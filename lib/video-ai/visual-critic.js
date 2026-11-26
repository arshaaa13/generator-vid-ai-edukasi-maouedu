// Stage 3: Gemini Multimodal Visual Self-Critic & Closed-Loop Auto-Refiner
// Captures real rendered frames from the WebGL Cinema Engine, lets Gemini SEE the actual pixels,
// scores Kling cinematography quality (0-100), and patches camera/lighting/DOF/VFX/scale automatically!

import { callGeminiJson } from "./gemini-client.js";
import { sanitizeMotionField } from "./shot-planner.js";

const ALLOWED_MOODS = new Set([
  "pixar_golden",
  "unreal_studio",
  "cyber_neon",
  "inferno_alert",
  "deep_ocean",
  "arctic_ice",
  "emerald_victory",
  "volcanic_forge",
  "moonlit_mystery"
]);

const ALLOWED_VFX = new Set([
  "god_rays",
  "fire_flames",
  "steam_smoke",
  "water_splash",
  "bubbles_rise",
  "electric_arcs",
  "frost_crystals",
  "energy_flow",
  "sound_shockwave",
  "rain_storm",
  "gold_sparkles",
  "heat_haze"
]);

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanHex(v, fb = "#fbbf24") {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb;
}

export function applyCriticPatchToBlueprint(blueprint, patch) {
  if (!blueprint || typeof blueprint !== "object" || !patch || typeof patch !== "object") {
    return blueprint;
  }

  const next = JSON.parse(JSON.stringify(blueprint));

  if (patch.lightingMood && ALLOWED_MOODS.has(patch.lightingMood)) {
    next.lightingMood = patch.lightingMood;
  }

  // Camera zoom & height framing refinement
  const zoomMul = clamp(patch.cameraZoomMultiplier, 0.72, 1.38, 1.0);
  const yOff = clamp(patch.cameraYOffset, -0.4, 0.45, 0.0);
  if (next.cameraTrack) {
    for (const k of ["start", "mid", "end"]) {
      if (Array.isArray(next.cameraTrack[k]) && next.cameraTrack[k].length === 3) {
        const lookZ = next.cameraTrack.lookStart?.[2] || 0;
        const relZ = Math.max(2.0, (next.cameraTrack[k][2] - lookZ) * zoomMul);
        next.cameraTrack[k][2] = Number((lookZ + relZ).toFixed(3));
        next.cameraTrack[k][1] = Number(clamp(next.cameraTrack[k][1] + yOff, 0.4, 5.0, next.cameraTrack[k][1]).toFixed(3));
      }
    }
  }

  // Color grading + optical bokeh refinement
  next.colorGrade = next.colorGrade || {};
  if (patch.bloomStrength !== undefined) {
    next.colorGrade.bloomStrength = clamp(patch.bloomStrength, 0.2, 1.35, next.colorGrade.bloomStrength ?? 0.68);
  }
  if (patch.contrast !== undefined) {
    next.colorGrade.contrast = clamp(patch.contrast, 0.95, 1.32, next.colorGrade.contrast ?? 1.08);
  }
  if (patch.saturation !== undefined) {
    next.colorGrade.saturation = clamp(patch.saturation, 0.9, 1.45, next.colorGrade.saturation ?? 1.16);
  }
  if (typeof patch.lensFlare === "boolean") {
    next.colorGrade.lensFlare = patch.lensFlare;
  }

  next.optics = next.optics || {};
  if (patch.dofAperture !== undefined) {
    next.optics.dofAperture = clamp(patch.dofAperture, 0.0, 0.95, next.optics.dofAperture ?? 0.45);
  }
  if (patch.motionBlur !== undefined) {
    next.optics.motionBlur = clamp(patch.motionBlur, 0.0, 0.85, next.optics.motionBlur ?? 0.22);
  }

  // Hero actor scale adjustment if subject looked too small/big
  const heroScaleMul = clamp(patch.heroScaleMultiplier, 0.78, 1.45, 1.0);
  if (Math.abs(heroScaleMul - 1.0) > 0.02 && Array.isArray(next.actors)) {
    for (const a of next.actors) {
      if (a.prefab !== "human_protagonist" && a.prefab !== "pipe_curved" && a.prefab !== "wire_arc") {
        a.scale = Number(clamp((a.scale || 1.0) * heroScaleMul, 0.35, 2.5, 1.0).toFixed(2));
        if (Array.isArray(a.keyframes)) {
          a.keyframes.forEach((kf) => {
            kf.scale = Number(clamp((kf.scale || 1.0) * heroScaleMul, 0.35, 2.5, 1.0).toFixed(2));
          });
        }
      }
    }
  }

  // Optional Motion Brush force field upgrade
  if (patch.motionField && typeof patch.motionField === "object") {
    next.motionField = sanitizeMotionField(patch.motionField);
  }

  // Optional new volumetric VFX
  if (patch.addVfx && ALLOWED_VFX.has(patch.addVfx.type)) {
    next.vfxSystems = Array.isArray(next.vfxSystems) ? next.vfxSystems : [];
    const exists = next.vfxSystems.some((v) => v.type === patch.addVfx.type);
    if (!exists && next.vfxSystems.length < 9) {
      next.vfxSystems.push({
        type: patch.addVfx.type,
        origin: [0.1, 0.75, 0.15],
        target: [0.85, 0.8, 0.15],
        color: cleanHex(patch.addVfx.color, "#fbbf24"),
        intensity: clamp(patch.addVfx.intensity, 0.4, 1.8, 1.1)
      });
    }
  }

  return next;
}

export async function critiqueAndRefineRenderedFrame({
  frameDataUrl = "",
  blueprint = null,
  scene = {},
  topic = "",
  geminiApiKey = ""
}) {
  const m = String(frameDataUrl || "").match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!m) {
    throw new Error("Format frame gambar tidak valid (harus base64 JPEG/PNG/WebP).");
  }
  const mimeType = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  const base64Data = m[2];

  const systemInstruction = `Kamu adalah "Kling Cinema Visual Director & QC Critic" — kritikus sinematografi AI yang MELIHAT langsung frame hasil render 3D WebGL video 9:16 lalu meng-upgrade pencahayaan, framing kamera, Depth-of-Field Bokeh, bloom, skala objek, dan VFX agar makin mendekati standar film animasi KLING AI / Pixar!

Nilai frame dari 0 sampai 100 pada 5 pilar: framing, lighting, depthAndBokeh, subjectClarity, cinematicVibe.
Berikan kritik singkat padat dalam Bahasa Indonesia + JSON "patch" yang realistis & aman agar visual langsung meningkat!

Kembalikan HANYA JSON valid:
{
  "overallScore": 78,
  "breakdown": {
    "framing": 80,
    "lighting": 75,
    "depthAndBokeh": 72,
    "subjectClarity": 82,
    "cinematicVibe": 79
  },
  "critique": "Penilaian jujur 1-2 kalimat Bahasa Indonesia atas apa yang terlihat di frame.",
  "improvements": ["Perbaikan 1", "Perbaikan 2"],
  "styleLesson": "1 kalimat singkat pelajaran gaya untuk memori kualitas video selanjutnya",
  "patch": {
    "lightingMood": "pixar_golden" | "unreal_studio" | "cyber_neon" | "inferno_alert" | "deep_ocean" | "arctic_ice" | "emerald_victory" | "volcanic_forge" | "moonlit_mystery",
    "cameraZoomMultiplier": 0.88,
    "cameraYOffset": 0.05,
    "heroScaleMultiplier": 1.12,
    "bloomStrength": 0.82,
    "dofAperture": 0.55,
    "motionBlur": 0.25,
    "contrast": 1.12,
    "saturation": 1.22,
    "lensFlare": true,
    "addVfx": { "type": "god_rays" | "gold_sparkles" | "steam_smoke" | "electric_arcs" | "fire_flames" | "bubbles_rise" | "sound_shockwave", "color": "#fbbf24", "intensity": 1.1 }
  }
}`;

  const promptText = `Topik Video: "${topic}"
Scene #${scene?.sceneNumber || 1} (${scene?.phase || "HOOK"}): "${scene?.plainNarration || scene?.narration || ""}"
Blueprint aktif saat ini:
${JSON.stringify(
  {
    lightingMood: blueprint?.lightingMood,
    environment: blueprint?.environment,
    actorCount: blueprint?.actors?.length || 0,
    prefabs: (blueprint?.actors || []).map((a) => a.prefab),
    vfx: (blueprint?.vfxSystems || []).map((v) => v.type),
    optics: blueprint?.optics,
    colorGrade: blueprint?.colorGrade
  },
  null,
  2
)}
Perhatikan gambar frame render terlampir! Evaluasi apakah objek utama jelas terlihat di tengah panggung (tidak ketutup subtitle bawah atau header atas), apakah pencahayaan & kontras sudah sinematik ala Kling, dan berikan patch perbaikan optimal!`;

  const res = await callGeminiJson({
    geminiApiKey,
    systemInstruction,
    parts: [
      { inlineData: { mimeType, data: base64Data } },
      { text: promptText }
    ],
    temperature: 0.45,
    maxOutputTokens: 2048,
    timeoutMs: 22000
  });

  if (!res.ok || !res.data) {
    // Graceful heuristic refinement fallback if Vision API is temporarily busy
    const fallbackPatch = {
      cameraZoomMultiplier: 0.92,
      heroScaleMultiplier: 1.1,
      bloomStrength: 0.82,
      dofAperture: 0.52,
      contrast: 1.12,
      saturation: 1.2,
      lensFlare: true,
      addVfx: { type: "gold_sparkles", color: "#fbbf24", intensity: 1.0 }
    };
    return {
      ok: true,
      visionModel: "heuristic-cinema-refiner",
      overallScore: 76,
      breakdown: { framing: 76, lighting: 75, depthAndBokeh: 72, subjectClarity: 78, cinematicVibe: 77 },
      critique: "Meningkatkan kedalaman bokeh, bloom highlight, dan zoom kamera agar hero lebih menonjol ala Kling.",
      improvements: ["Perdekat framing hero", "Naikkan bokeh & anamorphic bloom"],
      styleLesson: "Jaga kamera sedikit lebih dekat dengan bokeh 0.52 dan rim lighting kuat.",
      patch: fallbackPatch,
      refinedBlueprint: applyCriticPatchToBlueprint(blueprint, fallbackPatch),
      warning: res.error
    };
  }

  const d = res.data;
  const patch = d.patch && typeof d.patch === "object" ? d.patch : {};
  const refinedBlueprint = applyCriticPatchToBlueprint(blueprint, patch);

  return {
    ok: true,
    visionModel: res.model,
    elapsedMs: res.elapsedMs,
    overallScore: clamp(d.overallScore, 1, 100, 80),
    breakdown: {
      framing: clamp(d.breakdown?.framing, 1, 100, 80),
      lighting: clamp(d.breakdown?.lighting, 1, 100, 80),
      depthAndBokeh: clamp(d.breakdown?.depthAndBokeh, 1, 100, 78),
      subjectClarity: clamp(d.breakdown?.subjectClarity, 1, 100, 82),
      cinematicVibe: clamp(d.breakdown?.cinematicVibe, 1, 100, 80)
    },
    critique: String(d.critique || "Visual berhasil dievaluasi oleh Gemini Vision.").slice(0, 260),
    improvements: Array.isArray(d.improvements) ? d.improvements.slice(0, 4).map((s) => String(s).slice(0, 120)) : [],
    styleLesson: String(d.styleLesson || "").slice(0, 180),
    patch,
    refinedBlueprint,
    warning: null
  };
}
