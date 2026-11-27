// Calibrated Free Google Gemini TTS Engine (`gemini-2.5-flash-preview-tts` + Broadcast PCM DSP)
// Uses empirically trained vocal presets + real-time 24kHz PCM mastering to match ~90% of ElevenLabs Deep Overlord voice.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectGeminiKeys } from "../video-ai/gemini-client.js";
import { analyzeWavAcoustics, encodeWavFromFloat32, extractPcmFromWavOrRaw, masterVoiceDsp } from "./audio-dsp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROFILE_PATH = path.join(__dirname, "trained-voice-profile.json");

const TRAINED_PROFILE = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf-8"));
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

// In-memory LRU cache to protect free-tier RPM on repeated playback/renders
const audioCache = new Map();
const MAX_CACHE_ITEMS = 45;

export function getTrainedVoiceProfile() {
  return TRAINED_PROFILE;
}

export function resolveFreeVoicePreset(presetId = "", customProfile = null) {
  const base =
    TRAINED_PROFILE.presets[presetId] ||
    TRAINED_PROFILE.presets[TRAINED_PROFILE.defaultPresetId] ||
    TRAINED_PROFILE.presets.maou_overlord;

  if (!customProfile || typeof customProfile !== "object") return base;
  const targetVoice = String(customProfile.geminiVoiceName || base.geminiVoiceName || "Algenib").trim();
  return {
    ...base,
    geminiVoiceName: targetVoice,
    stylePrefix: customProfile.stylePrefix || base.stylePrefix,
    estimatedMatchPct: Number(customProfile.estimatedMatchPct) || base.estimatedMatchPct,
    dsp: {
      ...base.dsp,
      ...(customProfile.dsp || {})
    }
  };
}

export function buildTrainedDirectorSpeechPrompt(cleanIndonesianText, phase = "JADI", preset = null) {
  const activePreset = preset || resolveFreeVoicePreset();
  const phaseKey = String(phase || "JADI").toUpperCase();
  const phaseCue = activePreset.phaseDirections?.[phaseKey] || activePreset.phaseDirections?.JADI || "";

  // Add subtle natural breath beats on dramatic Indonesian hooks without altering spoken words
  const scripted = String(cleanIndonesianText || "")
    .replace(/\b(TAPI|NAHKAN|NAHMASALAHNYA)\b,?/g, "$1...")
    .replace(/\b(JADI)\b,?/g, "$1,")
    .replace(/\s+/g, " ")
    .trim();

  return `${activePreset.stylePrefix}. Delivery cue for this line: ${phaseCue}. Read every Indonesian word cleanly and naturally: "${scripted}"`;
}

export async function synthesizeGeminiFreeVoice({
  text,
  phase = "JADI",
  presetId = "maou_overlord",
  customProfile = null,
  geminiApiKey = ""
}) {
  const cleanText = String(text || "").trim();
  if (!cleanText) throw new Error("Teks voiceover kosong.");

  const candidateKeys = collectGeminiKeys(geminiApiKey);
  if (!candidateKeys.length) {
    return {
      ok: false,
      status: 400,
      error: "GEMINI_API_KEY belum diatur (isi di ⚙️ API & Voice atau Vercel Env Vars)."
    };
  }

  const preset = resolveFreeVoicePreset(presetId, customProfile);
  const promptText = buildTrainedDirectorSpeechPrompt(cleanText, phase, preset);
  const cacheKey = JSON.stringify({
    v: preset.geminiVoiceName,
    p: phase,
    d: preset.dsp,
    s: preset.stylePrefix.slice(0, 60),
    t: cleanText
  });

  if (audioCache.has(cacheKey)) {
    return { ...audioCache.get(cacheKey), cached: true };
  }

  let lastStatus = 500;
  let lastError = "Gemini TTS gagal";

  for (const key of candidateKeys) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${encodeURIComponent(
            key
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: promptText }] }],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: preset.geminiVoiceName }
                  }
                }
              }
            }),
            signal: AbortSignal.timeout(28000)
          }
        );

        if (resp.ok) {
          const j = await resp.json();
          const audioPart = j?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data);
          if (!audioPart) {
            lastStatus = 502;
            lastError = "Respons Gemini TTS tidak berisi data audio.";
            continue;
          }

          const rawBuf = Buffer.from(audioPart.inlineData.data, "base64");
          const { samples, sampleRate } = extractPcmFromWavOrRaw(rawBuf, 24000);
          const rawWav = encodeWavFromFloat32(samples, sampleRate);
          const masteredWav = masterVoiceDsp(rawWav, preset.dsp, sampleRate);
          const acoustics = analyzeWavAcoustics(masteredWav, sampleRate);

          const out = {
            ok: true,
            audioBase64: masteredWav.toString("base64"),
            mimeType: "audio/wav",
            provider: "gemini_free",
            presetId: preset.id,
            voiceName: preset.geminiVoiceName,
            model: TTS_MODEL,
            estimatedMatchPct: preset.estimatedMatchPct,
            acoustics,
            error: null
          };

          if (audioCache.size >= MAX_CACHE_ITEMS) {
            const oldestKey = audioCache.keys().next().value;
            audioCache.delete(oldestKey);
          }
          audioCache.set(cacheKey, out);
          return out;
        }

        const errTxt = await resp.text().catch(() => "");
        let parsedMsg = `HTTP ${resp.status}`;
        try {
          parsedMsg = JSON.parse(errTxt)?.error?.message || parsedMsg;
        } catch {}
        lastStatus = resp.status;
        lastError = parsedMsg;

        if ((resp.status === 429 || resp.status >= 500) && attempt < 2) {
          const delayMs = resp.status === 429 ? 2600 * (attempt + 1) : 1200 * (attempt + 1);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        break;
      } catch (err) {
        lastStatus = 504;
        lastError = err?.message || "Gemini TTS timeout";
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        }
      }
    }
  }

  return { ok: false, status: lastStatus, error: lastError };
}
