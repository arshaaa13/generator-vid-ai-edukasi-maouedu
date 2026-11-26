// Optional Modular Adapter: Cost-Controlled Google Veo Hero-Shot Mode (Image-to-Video)
// Strictly DISABLED by default (ENABLE_VEO_HERO_SHOTS=false).
// Only animates scenes explicitly flagged as is_hero_shot: true (e.g., 3s Hook or Climax)
// using copyright-safe 2D cel preservation prompts, piping the returned clip directly into
// the existing WebGL2 Satsuei Broadcast Finish + WebCodecs 9:16 30FPS Export pipeline.

import { collectGeminiKeys } from "./gemini-client.js";

export const VEO_HERO_MODELS = [
  "veo-3.0-fast-generate-preview",
  "veo-2.0-generate-001"
];

export function isVeoHeroEnabled() {
  return String(process.env.ENABLE_VEO_HERO_SHOTS || "false").trim().toLowerCase() === "true";
}

export function buildVeoCelPreservationPrompt({ scene = {}, blueprint = {}, topic = "" }) {
  const phase = String(scene?.phase || "HOOK").toUpperCase();
  const actionBeat =
    phase === "CLIMAX"
      ? "commanding arcane hand-seal energy surge, sweeping long coat folds, drifting glowing embers"
      : phase === "TAPI"
        ? "tense dramatic alert head turn, intense eyes narrowing, subtle ominous shadow shift"
        : "subtle confident overlord smirk, slow cinematic push-in camera, ash-silver hair and coat edges swaying gently in breeze";

  return [
    `Animate this exact 2D hand-drawn modern Japanese TV anime keyframe for a 9:16 vertical educational hero shot (${topic || "science reveal"}).`,
    `Motion direction: ${actionBeat}; gentle atmospheric dust motes drifting in foreground; smooth 24fps camera push-in while keeping character animation strictly on 12fps on-twos anime cadence.`,
    `Strict 2D cel preservation: keep razor-sharp variable-weight black ink lineart, hard-edged 2-tone cel shading, exact character face/horns/coat design, and gritty hand-painted atmospheric background texture.`,
    `Prohibitions: ZERO 3D CGI conversion, ZERO photorealistic skin/plastic shading, ZERO morphing distortion, ZERO extra limbs, ZERO text or watermarks.`
  ].join(" ");
}

export async function startVeoHeroShotJob({
  keyframeDataUrl = "",
  scene = {},
  blueprint = {},
  topic = "",
  geminiApiKey = ""
}) {
  if (!isVeoHeroEnabled()) {
    return {
      ok: false,
      disabled: true,
      error: "Veo Hero-Shot Mode nonaktif (set ENABLE_VEO_HERO_SHOTS=true di .env.local / Vercel Env Vars untuk mengaktifkan)."
    };
  }

  if (!blueprint?.is_hero_shot && !scene?.is_hero_shot) {
    return {
      ok: false,
      skipped: true,
      error: "Cost-Control Guard: Hanya scene dengan flag is_hero_shot: true (Hook / Climax) yang diizinkan memakai Veo."
    };
  }

  const m = String(keyframeDataUrl || "").match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!m) {
    return { ok: false, error: "keyframeDataUrl tidak valid untuk Veo Image-to-Video." };
  }
  const mimeType = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  const bytesBase64Encoded = m[2];

  const keys = collectGeminiKeys(geminiApiKey);
  if (!keys.length) {
    return { ok: false, error: "GEMINI_API_KEY diperlukan untuk Veo Hero-Shot Mode." };
  }

  const prompt = buildVeoCelPreservationPrompt({ scene, blueprint, topic });
  let lastError = "Veo API tidak tersedia untuk API key ini.";

  for (const key of keys) {
    for (const model of VEO_HERO_MODELS) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${encodeURIComponent(key)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [
                {
                  prompt,
                  image: {
                    bytesBase64Encoded,
                    mimeType
                  }
                }
              ],
              parameters: {
                aspectRatio: "9:16",
                durationSeconds: 4,
                personGeneration: "allow_adult"
              }
            }),
            signal: AbortSignal.timeout(25000)
          }
        );

        if (!resp.ok) {
          const snippet = await resp.text().catch(() => "");
          lastError = `${model} HTTP ${resp.status}: ${snippet.slice(0, 140)}`;
          if (resp.status === 403 || resp.status === 429) {
            return { ok: false, error: lastError };
          }
          continue;
        }

        const data = await resp.json();
        if (data?.name) {
          return {
            ok: true,
            status: "running",
            operationName: data.name,
            model,
            promptUsed: prompt
          };
        }
      } catch (err) {
        lastError = `${model}: ${err.message}`;
      }
    }
  }

  return { ok: false, error: lastError };
}

export async function pollVeoHeroShotJob({ operationName = "", geminiApiKey = "" }) {
  if (!isVeoHeroEnabled()) {
    return { ok: false, disabled: true, error: "Veo Hero-Shot Mode nonaktif (ENABLE_VEO_HERO_SHOTS=false)." };
  }
  const cleanOp = String(operationName || "").trim();
  if (!cleanOp || !/^[a-zA-Z0-9/_-]+$/.test(cleanOp)) {
    return { ok: false, error: "operationName Veo tidak valid." };
  }
  const keys = collectGeminiKeys(geminiApiKey);
  if (!keys.length) {
    return { ok: false, error: "GEMINI_API_KEY diperlukan untuk mengecek status Veo." };
  }

  const key = keys[0];
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${cleanOp}?key=${encodeURIComponent(key)}`,
      { method: "GET", signal: AbortSignal.timeout(20000) }
    );
    if (!resp.ok) {
      const snippet = await resp.text().catch(() => "");
      return { ok: false, error: `Veo poll HTTP ${resp.status}: ${snippet.slice(0, 140)}` };
    }
    const op = await resp.json();
    if (!op.done) {
      return { ok: true, done: false, status: "running", operationName: cleanOp };
    }
    if (op.error) {
      return { ok: false, done: true, error: op.error.message || "Veo generation failed." };
    }

    const sample =
      op.response?.generateVideoResponse?.generatedSamples?.[0] ||
      op.response?.generatedVideos?.[0] ||
      null;
    const videoUri = sample?.video?.uri || sample?.uri || null;
    if (!videoUri) {
      return { ok: false, done: true, error: "Veo selesai tetapi URL video tidak ditemukan." };
    }

    // Fetch MP4 bytes server-side so browser receives clean data URL with zero CORS taint for WebGL2/WebCodecs!
    const sep = videoUri.includes("?") ? "&" : "?";
    const vidResp = await fetch(`${videoUri}${sep}key=${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(28000)
    });
    if (!vidResp.ok) {
      return { ok: false, done: true, error: `Gagal mengunduh klip Veo (HTTP ${vidResp.status}).` };
    }
    const buf = Buffer.from(await vidResp.arrayBuffer());
    return {
      ok: true,
      done: true,
      status: "succeed",
      mimeType: "video/mp4",
      videoDataUrl: `data:video/mp4;base64,${buf.toString("base64")}`,
      bytes: buf.length
    };
  } catch (err) {
    return { ok: false, error: `Veo poll error: ${err.message}` };
  }
}
