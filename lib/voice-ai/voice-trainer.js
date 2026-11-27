// Interactive Free-Voice Calibration & Acoustic Similarity Trainer
// Analyzes an optional reference voice clip (e.g. ElevenLabs sample MP3/WAV) via Gemini Multimodal Audio,
// selects & tunes the closest Gemini 2.5 Flash TTS voice + DSP EQ/pitch curve, and generates a live mastered preview.

import { callGeminiJson, GEMINI_VIDEO_MODELS } from "../video-ai/gemini-client.js";
import { formatIndonesianSpeechText } from "../maou-engine.js";
import { analyzeWavAcoustics } from "./audio-dsp.js";
import { getTrainedVoiceProfile, resolveFreeVoicePreset, synthesizeGeminiFreeVoice } from "./gemini-tts-engine.js";

const ALLOWED_GEMINI_VOICES = new Set(["Algenib", "Umbriel", "Charon", "Fenrir", "Orus", "Iapetus", "Schedar"]);

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

export async function calibrateFreeVoiceProfile({
  referenceAudioDataUrl = "",
  targetDescription = "",
  presetId = "maou_overlord",
  sampleText = "Eh bro, lu pernah mikir nggak kenapa benda ini bisa bekerja jauh lebih cepat? TAPI... ternyata ada rahasia fisika yang jarang orang tau!",
  geminiApiKey = ""
}) {
  const baseProfile = getTrainedVoiceProfile();
  const basePreset = resolveFreeVoicePreset(presetId);

  let tunedVoiceName = basePreset.geminiVoiceName;
  let tunedStylePrefix = basePreset.stylePrefix;
  let tunedDsp = { ...basePreset.dsp };
  let targetAnalysisSummary = "Target bawaan: Deep Charismatic Raja Iblis (gaya Kallixis / Brian ElevenLabs).";
  let measuredTargetF0 = null;

  const refMatch = String(referenceAudioDataUrl || "").match(
    /^data:(audio\/(?:mp3|mpeg|wav|x-wav|ogg|webm|m4a|mp4));base64,(.+)$/i
  );

  if (refMatch) {
    const mimeType = refMatch[1].toLowerCase() === "audio/mp3" ? "audio/mpeg" : refMatch[1].toLowerCase();
    const base64Data = refMatch[2];
    if (mimeType.includes("wav")) {
      const m = analyzeWavAcoustics(Buffer.from(base64Data, "base64"));
      measuredTargetF0 = m.medianF0Hz;
    }

    const parts = [
      {
        text: `You are a Principal Voice Casting Director & Mastering DSP Engineer.
Listen closely to this reference voice clip that the creator wants our free Gemini 2.5 Flash TTS voice to match (~90%+ acoustic similarity).
Extra creator note: "${targetDescription || "Match tone, depth, gravel, pacing, and charisma as closely as possible for Indonesian narration."}"
${measuredTargetF0 ? `Measured target median F0 pitch: ${measuredTargetF0} Hz.` : ""}

Choose the SINGLE BEST base voice from: Algenib (deep gravelly ~84Hz), Umbriel (deep relaxed ~91Hz), Fenrir (deep intense ~98Hz), Charon (calm resonant ~108Hz), Orus (firm ~106Hz).
And provide subtle natural DSP parameters (avoid heavy pitch shifts > 2.2 semitones to keep zero robotic artifacts!) + an acting stylePrefix for Gemini TTS.

Return ONLY valid JSON:
{
  "targetSummary": "1 kalimat ringkas Bahasa Indonesia menggambarkan karakter suara target",
  "bestGeminiVoice": "Algenib",
  "stylePrefix": "Detailed acting instruction in English describing timbre, pacing, warmth and Indonesian casual charisma...",
  "dsp": {
    "pitchSemitones": -0.4,
    "speakingRate": 1.03,
    "bassBoostDb": 4.0,
    "midCutDb": -2.2,
    "presenceBoostDb": 3.0,
    "saturationDrive": 0.15,
    "targetRmsDb": -15.5
  }
}`
      },
      { inlineData: { mimeType, data: base64Data } }
    ];

    const aiRes = await callGeminiJson({
      geminiApiKey,
      parts,
      temperature: 0.2,
      maxOutputTokens: 1536,
      timeoutMs: 28000,
      models: GEMINI_VIDEO_MODELS
    });

    if (aiRes.ok && aiRes.data) {
      const d = aiRes.data;
      if (ALLOWED_GEMINI_VOICES.has(d.bestGeminiVoice)) tunedVoiceName = d.bestGeminiVoice;
      if (typeof d.stylePrefix === "string" && d.stylePrefix.trim().length > 12) {
        tunedStylePrefix = d.stylePrefix.trim().slice(0, 420);
      }
      if (d.targetSummary) targetAnalysisSummary = String(d.targetSummary).slice(0, 220);
      if (d.dsp && typeof d.dsp === "object") {
        tunedDsp = {
          pitchSemitones: Number(clamp(d.dsp.pitchSemitones, -2.2, 1.5, basePreset.dsp.pitchSemitones).toFixed(2)),
          speakingRate: Number(clamp(d.dsp.speakingRate, 0.92, 1.15, basePreset.dsp.speakingRate).toFixed(2)),
          bassBoostDb: Number(clamp(d.dsp.bassBoostDb, -1, 6.5, basePreset.dsp.bassBoostDb).toFixed(2)),
          midCutDb: Number(clamp(d.dsp.midCutDb, -5, 1, basePreset.dsp.midCutDb).toFixed(2)),
          presenceBoostDb: Number(clamp(d.dsp.presenceBoostDb, -1, 5, basePreset.dsp.presenceBoostDb).toFixed(2)),
          saturationDrive: Number(clamp(d.dsp.saturationDrive, 0, 0.3, basePreset.dsp.saturationDrive).toFixed(2)),
          targetRmsDb: Number(clamp(d.dsp.targetRmsDb, -18, -13, -15.5).toFixed(1))
        };
      }
    }
  } else if (targetDescription) {
    tunedStylePrefix = `${basePreset.stylePrefix}. Additional direction: ${String(targetDescription).slice(0, 180)}`;
    targetAnalysisSummary = `Dikalibrasi ke arahan kustom: "${String(targetDescription).slice(0, 120)}"`;
  }

  const trainedCustomProfile = {
    presetId,
    geminiVoiceName: tunedVoiceName,
    stylePrefix: tunedStylePrefix,
    dsp: tunedDsp,
    estimatedMatchPct: basePreset.estimatedMatchPct,
    targetAnalysisSummary,
    calibratedAt: new Date().toISOString()
  };

  // Generate actual calibrated Indonesian voice preview using the newly trained profile
  const cleanSample = formatIndonesianSpeechText(sampleText);
  const synthRes = await synthesizeGeminiFreeVoice({
    text: cleanSample,
    phase: "HOOK",
    presetId,
    customProfile: trainedCustomProfile,
    geminiApiKey
  });

  if (!synthRes.ok) {
    throw new Error(synthRes.error || "Gagal men-generate audio latihan Gemini TTS.");
  }

  // Optional multimodal acoustic match verification when reference sample was provided
  if (refMatch) {
    try {
      const cmpRes = await callGeminiJson({
        geminiApiKey,
        parts: [
          {
            text: `Listen to Audio 1 (Target Reference) vs Audio 2 (Trained Free Voice ${tunedVoiceName} + Broadcast DSP). Score overall vocal vibe & depth similarity (0-100) and check for robotic artifacts. Return JSON: { "similarityPct": 90, "artifacts": false, "feedback": "..." }`
          },
          { text: "Audio 1 (Target):" },
          { inlineData: { mimeType: refMatch[1].toLowerCase() === "audio/mp3" ? "audio/mpeg" : refMatch[1].toLowerCase(), data: refMatch[2] } },
          { text: "Audio 2 (Trained Free Voice):" },
          { inlineData: { mimeType: "audio/wav", data: synthRes.audioBase64 } }
        ],
        temperature: 0.2,
        maxOutputTokens: 512,
        timeoutMs: 25000,
        models: GEMINI_VIDEO_MODELS
      });
      if (cmpRes.ok && cmpRes.data?.similarityPct) {
        trainedCustomProfile.estimatedMatchPct = clamp(cmpRes.data.similarityPct, 75, 97, trainedCustomProfile.estimatedMatchPct);
        if (cmpRes.data.feedback) {
          trainedCustomProfile.criticFeedback = String(cmpRes.data.feedback).slice(0, 200);
        }
      }
    } catch {}
  }

  return {
    ok: true,
    trainedProfile: trainedCustomProfile,
    previewAudioBase64: synthRes.audioBase64,
    previewMimeType: synthRes.mimeType,
    acoustics: synthRes.acoustics,
    model: synthRes.model,
    baselineVersion: baseProfile.version
  };
}
