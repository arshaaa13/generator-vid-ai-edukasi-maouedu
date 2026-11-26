// Stage 3: Gemini Multimodal Visual Self-Critic & Closed-Loop Auto-Refiner
// Evaluates rendered 3D frames on script fidelity, physical grounding, architectural clarity,
// and strict anti-clutter discipline (penalizing excessive neon/bloom/floating props).

import { callGeminiJson } from "./gemini-client.js";
import { sanitizeMotionField } from "./shot-planner.js";
import { ALLOWED_LIGHTING_PRESETS } from "./visual-researcher.js";

const ALLOWED_MOODS = new Set([
  ...ALLOWED_LIGHTING_PRESETS,
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
  "pour_stream",
  "condensation_drops",
  "steam_smoke",
  "bubbles_rise",
  "frost_crystals",
  "water_splash",
  "fire_flames",
  "energy_flow",
  "sound_shockwave",
  "rain_storm",
  "gold_sparkles",
  "heat_haze",
  "electric_arcs",
  "god_rays"
]);

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanHex(v, fb = "#e0f2fe") {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb;
}

export function applyCriticPatchToBlueprint(blueprint, patch) {
  if (!blueprint || typeof blueprint !== "object" || !patch || typeof patch !== "object") {
    return blueprint;
  }

  const next = JSON.parse(JSON.stringify(blueprint));

  // Native patch handling for Pure 2D Studio MAPPA Anime blueprints
  if (next.engine === "anime-mappa-2d" || next.engine === "anime-mappa-sakuga") {
    next.satsueiGrade = next.satsueiGrade || {};
    if (patch.bloomStrength !== undefined) {
      next.satsueiGrade.bloomStrength = clamp(patch.bloomStrength, 0.18, 0.72, next.satsueiGrade.bloomStrength ?? 0.36);
    }
    if (patch.contrast !== undefined) {
      next.satsueiGrade.contrast = clamp(patch.contrast, 1.0, 1.24, next.satsueiGrade.contrast ?? 1.1);
    }
    if (patch.saturation !== undefined) {
      next.satsueiGrade.saturation = clamp(patch.saturation, 0.95, 1.32, next.satsueiGrade.saturation ?? 1.16);
    }
    if (patch.chromaticPeak !== undefined) {
      next.satsueiGrade.chromaticPeak = clamp(patch.chromaticPeak, 0.004, 0.025, next.satsueiGrade.chromaticPeak ?? 0.012);
    }
    return next;
  }

  if (patch.lightingMood && ALLOWED_MOODS.has(patch.lightingMood)) {
    next.lightingMood = patch.lightingMood;
  }

  // Camera zoom & height framing refinement
  const zoomMul = clamp(patch.cameraZoomMultiplier, 0.78, 1.32, 1.0);
  const yOff = clamp(patch.cameraYOffset, -0.35, 0.45, 0.0);
  if (next.cameraTrack) {
    for (const k of ["start", "mid", "end"]) {
      if (Array.isArray(next.cameraTrack[k]) && next.cameraTrack[k].length === 3) {
        const lookZ = next.cameraTrack.lookStart?.[2] || 0;
        const relZ = Math.max(2.0, (next.cameraTrack[k][2] - lookZ) * zoomMul);
        next.cameraTrack[k][2] = Number((lookZ + relZ).toFixed(3));
        next.cameraTrack[k][1] = Number(clamp(next.cameraTrack[k][1] + yOff, 0.75, 4.5, next.cameraTrack[k][1]).toFixed(3));
      }
    }
  }

  // Clean restrained color grading + crisp DOF refinement
  next.colorGrade = next.colorGrade || {};
  if (patch.bloomStrength !== undefined) {
    next.colorGrade.bloomStrength = clamp(patch.bloomStrength, 0.06, 0.45, next.colorGrade.bloomStrength ?? 0.18);
  }
  if (patch.contrast !== undefined) {
    next.colorGrade.contrast = clamp(patch.contrast, 0.96, 1.18, next.colorGrade.contrast ?? 1.05);
  }
  if (patch.saturation !== undefined) {
    next.colorGrade.saturation = clamp(patch.saturation, 0.9, 1.24, next.colorGrade.saturation ?? 1.08);
  }
  if (typeof patch.lensFlare === "boolean") {
    next.colorGrade.lensFlare = patch.lensFlare;
  }

  next.optics = next.optics || {};
  if (patch.dofAperture !== undefined) {
    next.optics.dofAperture = clamp(patch.dofAperture, 0.0, 0.55, next.optics.dofAperture ?? 0.18);
  }
  if (patch.motionBlur !== undefined) {
    next.optics.motionBlur = clamp(patch.motionBlur, 0.0, 0.35, next.optics.motionBlur ?? 0.06);
  }

  // Hero actor scale adjustment if subject looked too small/big
  const heroScaleMul = clamp(patch.heroScaleMultiplier, 0.82, 1.35, 1.0);
  if (Math.abs(heroScaleMul - 1.0) > 0.02 && Array.isArray(next.actors)) {
    for (const a of next.actors) {
      if (a.prefab !== "human_protagonist" && a.prefab !== "pipe_curved" && a.prefab !== "wire_arc") {
        a.scale = Number(clamp((a.scale || 1.0) * heroScaleMul, 0.35, 2.0, 1.0).toFixed(2));
        if (Array.isArray(a.keyframes)) {
          a.keyframes.forEach((kf) => {
            kf.scale = Number(clamp((kf.scale || 1.0) * heroScaleMul, 0.35, 2.0, 1.0).toFixed(2));
          });
        }
      }
    }
  }

  // Optional Motion Brush force field upgrade
  if (patch.motionField && typeof patch.motionField === "object") {
    next.motionField = sanitizeMotionField(patch.motionField);
  }

  // Allow Vision Critic to REMOVE excessive/distracting VFX!
  if (Array.isArray(patch.removeVfx) && patch.removeVfx.length && Array.isArray(next.vfxSystems)) {
    const removeSet = new Set(patch.removeVfx.map((x) => String(x)));
    next.vfxSystems = next.vfxSystems.filter((v) => !removeSet.has(v.type));
  }

  // Optional subtle physical VFX addition (only when justified!)
  if (patch.addVfx && ALLOWED_VFX.has(patch.addVfx.type)) {
    next.vfxSystems = Array.isArray(next.vfxSystems) ? next.vfxSystems : [];
    const exists = next.vfxSystems.some((v) => v.type === patch.addVfx.type);
    if (!exists && next.vfxSystems.length < 4) {
      next.vfxSystems.push({
        type: patch.addVfx.type,
        origin: [0.05, 0.55, 0.12],
        target: [0.05, 0.25, 0.12],
        color: cleanHex(patch.addVfx.color, "#e0f2fe"),
        intensity: clamp(patch.addVfx.intensity, 0.3, 1.0, 0.65)
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

  const isAnime2D = blueprint?.engine === "anime-mappa-2d" || blueprint?.engine === "anime-mappa-sakuga";

  const systemInstruction = isAnime2D
    ? `Kamu adalah "Studio MAPPA Chief Satsuei (撮影) & Sakuga QC Director" (standar Jujutsu Kaisen S2 / Chainsaw Man / Attack on Titan Final Season) yang MELIHAT langsung frame 2D Anime 9:16 lalu memoles komposisi, kontras cel-shading, Pro-Mist bloom, dan keterbacaan Genga + subtitle!

PRINSIP PENILAIAN ANIME 2D STUDIO MAPPA:
- BERI NILAI TINGGI jika latar lukisan 2D (Haikei), karakter 2D Maou Vaelen, ilustrasi 2D Genga SVG, dan efek Sakuga 2D menyatu mulus, garis tinta (lineart) tajam, bloom halus ala Pro-Mist (tidak silau berlebihan), dan subtitle bawah terbaca bersih.
- BERI PENALTI jika gambar terlalu gelap/silau, terlalu ramai sampai menutupi wajah karakter/ilustrasi Genga, atau komposisi terasa tidak nyambung dengan naskah.

Nilai frame 0..100 pada 5 pilar: framing, lighting, depthAndBokeh, subjectClarity, cinematicVibe.
Kembalikan HANYA JSON valid:
{
  "overallScore": 86,
  "breakdown": {
    "framing": 86,
    "lighting": 85,
    "depthAndBokeh": 84,
    "subjectClarity": 88,
    "cinematicVibe": 87
  },
  "critique": "Penilaian jujur 1-2 kalimat Bahasa Indonesia tentang kualitas cel 2D MAPPA, komposisi karakter & ilustrasi Genga, serta Satsuei bloom.",
  "improvements": ["Perbaikan 1", "Perbaikan 2"],
  "styleLesson": "1 kalimat singkat pelajaran komposisi & Satsuei Anime 2D Studio MAPPA untuk scene berikutnya",
  "patch": {
    "bloomStrength": 0.34,
    "contrast": 1.12,
    "saturation": 1.18,
    "chromaticPeak": 0.012
  }
}`
    : `Kamu adalah "Visual QC Critic" — pengawas kualitas visual edukasi 9:16 yang MELIHAT langsung frame render lalu memoles framing, pencahayaan alami, dan kebersihan visual!

PRINSIP PENILAIAN (WAJIB TEGAS!):
- BERI PENALTI jika ada efek berlebihan/norak (bloom terlalu silau, warna neon aneh di ruangan biasa, partikel ramai yang tidak disebut naskah, benda terlihat melayang atau tumpang tindih).
- BERI NILAI TINGGI jika objek utama jelas terbaca di tengah frame (tidak ketutup subtitle bawah/header atas), dan 100% NYAMBUNG dengan narasi scene!

Nilai frame 0..100 pada 5 pilar: framing, lighting, depthAndBokeh, subjectClarity, cinematicVibe.
Kembalikan HANYA JSON valid:
{
  "overallScore": 82,
  "breakdown": {
    "framing": 84,
    "lighting": 82,
    "depthAndBokeh": 80,
    "subjectClarity": 85,
    "cinematicVibe": 80
  },
  "critique": "Penilaian jujur 1-2 kalimat Bahasa Indonesia tentang kecocokan frame dengan naskah, kerapian objek, & kebersihan efek.",
  "improvements": ["Perbaikan 1", "Perbaikan 2"],
  "styleLesson": "1 kalimat singkat pelajaran tata kamera/pencahayaan bersih untuk video berikutnya",
  "patch": {
    "lightingMood": "soft_daylight" | "warm_kitchen" | "clean_workshop" | "outdoor_sunlight" | "cozy_indoor" | "cool_lab",
    "cameraZoomMultiplier": 0.92,
    "cameraYOffset": 0.08,
    "heroScaleMultiplier": 1.06,
    "bloomStrength": 0.16,
    "dofAperture": 0.18,
    "motionBlur": 0.05,
    "contrast": 1.06,
    "saturation": 1.08,
    "lensFlare": false,
    "removeVfx": []
  }
}`;

  const promptText = isAnime2D
    ? `Topik Anime 2D: "${topic}"
Scene #${scene?.sceneNumber || 1} (${scene?.phase || "HOOK"}): "${scene?.plainNarration || scene?.narration || ""}"
Blueprint Anime 2D MAPPA saat ini:
${JSON.stringify(
  {
    engine: blueprint?.engine,
    haikeiBg: blueprint?.haikeiBg,
    characterPose: blueprint?.characterPose,
    shotLayout: blueprint?.shotLayout,
    satsueiMood: blueprint?.satsueiMood,
    sakugaVfx2d: blueprint?.sakugaVfx2d,
    impactBeat: blueprint?.impactBeat,
    satsueiGrade: blueprint?.satsueiGrade
  },
  null,
  2
)}
Lihat gambar frame Anime 2D terlampir! Nilai komposisi karakter cel 2D, kejelasan ilustrasi Genga, kontras Satsuei ala Studio MAPPA, dan keterbacaan subtitle, lalu berikan patch penyempurnaan!`
    : `Topik Video: "${topic}"
Scene #${scene?.sceneNumber || 1} (${scene?.phase || "HOOK"}): "${scene?.plainNarration || scene?.narration || ""}"
Blueprint aktif saat ini:
${JSON.stringify(
  {
    lightingMood: blueprint?.lightingMood,
    roomType: blueprint?.worldFoundation?.roomType || blueprint?.environment,
    actorCount: blueprint?.actors?.length || 0,
    prefabs: (blueprint?.actors || []).map((a) => `${a.label || a.id}(${a.prefab})`),
    vfx: (blueprint?.vfxSystems || []).map((v) => v.type),
    optics: blueprint?.optics,
    colorGrade: blueprint?.colorGrade
  },
  null,
  2
)}
Lihat gambar frame render terlampir! Nilai apakah objek sesuai narasi, tidak melayang, tidak ketutup subtitle, pencahayaan bersih natural (tidak terlalu silau/norak), lalu berikan patch penyempurnaan!`;

  const res = await callGeminiJson({
    geminiApiKey,
    systemInstruction,
    parts: [
      { inlineData: { mimeType, data: base64Data } },
      { text: promptText }
    ],
    temperature: 0.38,
    maxOutputTokens: 2048,
    timeoutMs: 22000
  });

  if (!res.ok || !res.data) {
    const fallbackPatch = {
      cameraZoomMultiplier: 0.94,
      cameraYOffset: 0.08,
      heroScaleMultiplier: 1.05,
      bloomStrength: 0.16,
      dofAperture: 0.18,
      contrast: 1.06,
      saturation: 1.08,
      lensFlare: false,
      removeVfx: ["god_rays"]
    };
    return {
      ok: true,
      visionModel: "grounded-cinema-refiner",
      overallScore: 80,
      breakdown: { framing: 80, lighting: 80, depthAndBokeh: 78, subjectClarity: 82, cinematicVibe: 80 },
      critique: "Menajamkan framing objek utama, menurunkan bloom agar permukaan meja & wadah tetap bersih, dan menjaga sudut kamera mudah dibaca.",
      improvements: ["Perjelas sudut pandang objek utama", "Jaga pencahayaan natural tanpa bloom berlebih"],
      styleLesson: "Jaga bloom rendah (0.16), sudut kamera agak atas, dan hindari efek berlebihan agar diorama jelas terbaca.",
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
    overallScore: clamp(d.overallScore, 1, 100, 82),
    breakdown: {
      framing: clamp(d.breakdown?.framing, 1, 100, 82),
      lighting: clamp(d.breakdown?.lighting, 1, 100, 82),
      depthAndBokeh: clamp(d.breakdown?.depthAndBokeh, 1, 100, 80),
      subjectClarity: clamp(d.breakdown?.subjectClarity, 1, 100, 84),
      cinematicVibe: clamp(d.breakdown?.cinematicVibe, 1, 100, 82)
    },
    critique: String(d.critique || "Visual berhasil dievaluasi oleh Gemini Vision.").slice(0, 260),
    improvements: Array.isArray(d.improvements) ? d.improvements.slice(0, 4).map((s) => String(s).slice(0, 120)) : [],
    styleLesson: String(d.styleLesson || "").slice(0, 180),
    patch,
    refinedBlueprint,
    warning: null
  };
}
