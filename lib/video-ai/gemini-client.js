// Unified Gemini Multimodal Transport & Model Router for MaouEdu Video AI Engine
// Supports Text-to-JSON Cinematography, 3D Rig Synthesis, and Multimodal Vision Self-Critique

export function cleanApiKey(raw = "") {
  return String(raw || "")
    .trim()
    .replace(/^[A-Z0-9_]+=/, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

function splitMultiKeys(raw = "") {
  return String(raw || "")
    .split(/[,;\n]+/)
    .map((part) => cleanApiKey(part))
    .filter(Boolean);
}

export function collectGeminiKeys(browserKey = "") {
  return Array.from(
    new Set([
      ...splitMultiKeys(browserKey),
      ...splitMultiKeys(process.env.GEMINI_API_KEY),
      ...splitMultiKeys(process.env.GEMINI_API_KEY_2),
      ...splitMultiKeys(process.env.GEMINI_API_KEY_BACKUP)
    ])
  );
}

// Empirically verified fast + reliable Gemini models enabled on standard & express AI Studio keys
export const GEMINI_VIDEO_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest"
];

export async function callGeminiJson({
  geminiApiKey = "",
  systemInstruction = "",
  userPrompt = "",
  parts = null,
  temperature = 0.72,
  maxOutputTokens = 16384,
  timeoutMs = 24000,
  models = GEMINI_VIDEO_MODELS
}) {
  const candidateKeys = collectGeminiKeys(geminiApiKey);
  if (!candidateKeys.length) {
    return { ok: false, data: null, model: null, elapsedMs: 0, error: "GEMINI_API_KEY belum diatur." };
  }

  const contentParts = Array.isArray(parts) && parts.length ? parts : [{ text: userPrompt }];
  const body = {
    contents: [{ role: "user", parts: contentParts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature,
      maxOutputTokens
    }
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  let lastError = "Gemini tidak mengembalikan JSON valid.";
  for (const key of candidateKeys) {
    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const t0 = Date.now();
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
              key
            )}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
              signal: AbortSignal.timeout(timeoutMs)
            }
          );

          if (resp.ok) {
            const rawJson = await resp.json();
            const resParts = rawJson?.candidates?.[0]?.content?.parts || [];
            const textOut = resParts
              .filter((p) => p?.text && !p?.thought)
              .map((p) => p.text)
              .join("\n");
            const match = textOut.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              return {
                ok: true,
                data: parsed,
                model,
                elapsedMs: Date.now() - t0,
                error: null
              };
            }
            lastError = `${model}: respons tidak berisi JSON valid`;
            break;
          }

          const errSnippet = await resp.text().catch(() => "");
          lastError = `${model} HTTP ${resp.status}: ${errSnippet.slice(0, 140)}`;
          if (resp.status === 503 && attempt === 0) {
            await new Promise((r) => setTimeout(r, 700));
            continue;
          }
          break;
        } catch (err) {
          lastError = `${model}: ${err.message}`;
          break;
        }
      }
    }
  }

  return { ok: false, data: null, model: null, elapsedMs: 0, error: lastError };
}
