// MiniMax integration for MaouEdu Studio (international platform: api.minimax.io)
//  - Hailuo text-to-video  : POST /v1/video_generation -> poll /v1/query/video_generation -> /v1/files/retrieve
//  - Speech (T2A v2)       : POST /v1/t2a_v2 (audio returned as hex)
// The API key is read from MINIMAX_API_KEY (server env) or sent by the browser from the Settings modal.
// It is never logged and never written to the repository.

export const MINIMAX_DEFAULT_VOICE = "Indonesian_BossyLeader"; // calm, authoritative adult male (Indonesian)

function apiBase() {
  return String(process.env.MINIMAX_API_BASE || "https://api.minimax.io").replace(/\/+$/, "");
}

export function cleanMinimaxKey(raw = "") {
  return String(raw || "")
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^['"]|['"]$/g, "");
}

export function resolveMinimaxKey(userKey = "") {
  return cleanMinimaxKey(userKey) || cleanMinimaxKey(process.env.MINIMAX_API_KEY);
}

// MiniMax always answers HTTP 200 and puts the real result in base_resp.status_code
export function classifyMinimaxError(base = {}) {
  const code = Number(base?.status_code ?? 0);
  const msg = String(base?.status_msg || "MiniMax error");
  if (code === 0) return null;
  let kind = "other";
  if (code === 1008) kind = "balance";
  else if (code === 1004 || code === 2049) kind = "auth";
  else if (code === 1002 || code === 1039 || code === 1041) kind = "rate";
  else if (code === 1026 || code === 1027) kind = "content";
  else if (code === 2013) kind = "params";
  return { code, msg, kind };
}

async function mmFetch(pathName, { method = "POST", body, apiKey, timeoutMs = 30000 } = {}) {
  const res = await fetch(apiBase() + pathName, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: method === "POST" ? JSON.stringify(body || {}) : undefined,
    signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON error page */
  }
  return { httpStatus: res.status, json, rawText: json ? "" : text.slice(0, 200) };
}

// ---------------------------------------------------------------------------
// Text to speech
// ---------------------------------------------------------------------------
const ttsBlockedUntil = new Map(); // key -> timestamp (avoid wasting a round-trip on every scene)

export async function minimaxTts({ text, apiKey, voiceId, model } = {}) {
  const key = resolveMinimaxKey(apiKey);
  if (!key) return { ok: false, kind: "nokey", error: "MiniMax API key belum diisi" };
  if (!text) return { ok: false, kind: "params", error: "Teks kosong" };

  const blockedUntil = ttsBlockedUntil.get(key) || 0;
  if (Date.now() < blockedUntil) {
    return { ok: false, kind: "blocked", error: "MiniMax diblokir sementara (saldo/key bermasalah)" };
  }

  const voice = String(voiceId || process.env.MINIMAX_VOICE_ID || MINIMAX_DEFAULT_VOICE).trim();
  const models = Array.from(
    new Set([model, process.env.MINIMAX_TTS_MODEL, "speech-2.6-hd", "speech-02-hd", "speech-02-turbo"].filter(Boolean))
  );

  let lastErr = null;
  for (const m of models) {
    try {
      const { json, rawText } = await mmFetch("/v1/t2a_v2", {
        apiKey: key,
        timeoutMs: 40000,
        body: {
          model: m,
          text,
          stream: false,
          language_boost: "Indonesian",
          voice_setting: { voice_id: voice, speed: 1.0, vol: 1.0, pitch: 0 },
          audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 }
        }
      });
      const err = classifyMinimaxError(json?.base_resp);
      if (!err && json?.data?.audio) {
        const buf = Buffer.from(String(json.data.audio), "hex");
        if (buf.length > 500) return { ok: true, buf, voiceId: voice, model: m };
        lastErr = { code: -1, msg: "Audio MiniMax kosong", kind: "other" };
        continue;
      }
      lastErr = err || { code: -1, msg: rawText || "Respons MiniMax tidak dikenal", kind: "other" };
      if (lastErr.kind === "balance") {
        ttsBlockedUntil.set(key, Date.now() + 10 * 60 * 1000);
        break;
      }
      if (lastErr.kind === "auth") {
        ttsBlockedUntil.set(key, Date.now() + 60 * 60 * 1000);
        break;
      }
      if (lastErr.kind !== "params") break; // only try the next model name when this one was rejected as invalid
    } catch (e) {
      lastErr = { code: -1, msg: e.message, kind: "network" };
      break;
    }
  }
  return { ok: false, kind: lastErr?.kind || "other", error: lastErr?.msg || "MiniMax TTS gagal" };
}

// ---------------------------------------------------------------------------
// Hailuo text-to-video
// ---------------------------------------------------------------------------
const PHASE_MOOD = {
  HOOK: "curious opening hook, the worker looks at the contraption with wide eyes, a hint of danger",
  TAPI: "something goes wrong: steam, sparks and shaking parts, the worker panics and waves his arms",
  JADI: "the worker calmly fixes the problem step by step, parts click into place, the problem gets solved",
  CLIMAX: "triumphant success, everything runs perfectly, confetti and a happy celebration"
};

export function buildHailuoPrompt(scene = {}, topic = "") {
  const visual = scene.visual || {};
  const stage = visual.stage3d || {};
  const props = Array.from(
    new Set((stage.objects || []).map((o) => o?.label || o?.kind).filter(Boolean).map((s) => String(s).replace(/_/g, " ")))
  ).slice(0, 6);
  const hero = visual.heroObject && visual.heroObject !== "custom_stage" ? String(visual.heroObject).replace(/_/g, " ") : "";
  const env = stage.environment ? String(stage.environment).replace(/_/g, " ") : "";
  const mood = PHASE_MOOD[String(scene.phase || "").toUpperCase()] || PHASE_MOOD.JADI;

  const parts = [
    "Stylized 3D animated educational diorama, bright toy-like cartoon look, soft lighting, clean uncluttered background.",
    topic ? `Topic: ${topic}.` : "",
    scene.componentLabel ? `Focus: ${scene.componentLabel}.` : "",
    hero ? `Main object: ${hero}.` : "",
    env ? `Setting: ${env}.` : "",
    props.length ? `Visible parts: ${props.join(", ")}.` : "",
    "A small chibi worker with black hair, green shirt and blue trousers is in the scene.",
    `Action: ${mood}.`,
    "Subject centered in the middle of the frame so it survives a vertical 9:16 center crop. Slow smooth push-in camera.",
    "No text, no letters, no subtitles, no watermark, no logo."
  ];
  return parts.filter(Boolean).join(" ").slice(0, 1800);
}

export async function minimaxVideoCreate({ prompt, apiKey, model, duration, resolution } = {}) {
  const key = resolveMinimaxKey(apiKey);
  if (!key) return { ok: false, kind: "nokey", error: "MiniMax API key belum diisi" };
  if (!prompt) return { ok: false, kind: "params", error: "Prompt video kosong" };

  const useModel = model || process.env.MINIMAX_VIDEO_MODEL || "MiniMax-Hailuo-2.3";
  const { json, rawText } = await mmFetch("/v1/video_generation", {
    apiKey: key,
    body: {
      model: useModel,
      prompt,
      duration: Number(duration || process.env.MINIMAX_VIDEO_DURATION || 6),
      resolution: resolution || process.env.MINIMAX_VIDEO_RESOLUTION || "768P",
      prompt_optimizer: true
    }
  });
  const err = classifyMinimaxError(json?.base_resp);
  if (err) return { ok: false, kind: err.kind, error: err.msg, code: err.code };
  if (!json?.task_id) return { ok: false, kind: "other", error: rawText || "MiniMax tidak mengembalikan task_id" };
  return { ok: true, taskId: String(json.task_id), model: useModel };
}

export async function minimaxFileUrl({ fileId, apiKey } = {}) {
  const key = resolveMinimaxKey(apiKey);
  const { json } = await mmFetch(`/v1/files/retrieve?file_id=${encodeURIComponent(fileId)}`, {
    method: "GET",
    apiKey: key
  });
  const err = classifyMinimaxError(json?.base_resp);
  if (err) return { ok: false, kind: err.kind, error: err.msg };
  const url = json?.file?.download_url;
  return url ? { ok: true, url } : { ok: false, kind: "other", error: "download_url tidak ditemukan" };
}

export async function minimaxVideoStatus({ taskId, apiKey } = {}) {
  const key = resolveMinimaxKey(apiKey);
  if (!key) return { ok: false, kind: "nokey", error: "MiniMax API key belum diisi" };
  if (!taskId) return { ok: false, kind: "params", error: "task_id kosong" };

  const { json, rawText } = await mmFetch(`/v1/query/video_generation?task_id=${encodeURIComponent(taskId)}`, {
    method: "GET",
    apiKey: key
  });
  const err = classifyMinimaxError(json?.base_resp);
  if (err) return { ok: false, kind: err.kind, error: err.msg };
  if (!json) return { ok: false, kind: "other", error: rawText || "Respons status tidak valid" };

  const raw = String(json.status || "").toLowerCase();
  if (raw === "success") {
    const fileId = json.file_id ? String(json.file_id) : "";
    const file = fileId ? await minimaxFileUrl({ fileId, apiKey: key }) : { ok: false };
    return { ok: true, status: "success", fileId, downloadUrl: file.ok ? file.url : "" };
  }
  if (raw === "fail" || raw === "failed") {
    return { ok: true, status: "fail", error: json.base_resp?.status_msg || "Generate video gagal di MiniMax" };
  }
  return { ok: true, status: "processing", detail: json.status || "Processing" };
}

// Shared request handler used by both the Vercel function and the local dev server
export async function handleMinimaxVideo(body = {}) {
  const action = String(body.action || "").toLowerCase();
  const apiKey = body.minimaxApiKey || "";
  let out;
  if (action === "create") {
    const prompt = body.prompt || buildHailuoPrompt(body.scene || {}, body.topic || "");
    out = await minimaxVideoCreate({ prompt, apiKey, model: body.model });
    if (out.ok) out.prompt = prompt;
  } else if (action === "status") {
    out = await minimaxVideoStatus({ taskId: body.taskId, apiKey });
  } else {
    return { status: 400, json: { error: "action harus 'create' atau 'status'" } };
  }
  if (out.ok) return { status: 200, json: out };
  const status = { balance: 402, auth: 401, rate: 429, nokey: 400, params: 400 }[out.kind] || 502;
  return { status, json: { error: out.error, errorKind: out.kind } };
}

// Streams the finished MP4 through our server (the browser cannot always read MiniMax's CDN because of CORS)
export async function openMinimaxDownload({ fileId, apiKey } = {}) {
  const file = await minimaxFileUrl({ fileId, apiKey: resolveMinimaxKey(apiKey) });
  if (!file.ok) return { ok: false, status: 502, error: file.error };
  const upstream = await fetch(file.url, { signal: AbortSignal.timeout(55000) });
  if (!upstream.ok || !upstream.body) return { ok: false, status: 502, error: `Download MiniMax gagal (HTTP ${upstream.status})` };
  return { ok: true, upstream };
}
