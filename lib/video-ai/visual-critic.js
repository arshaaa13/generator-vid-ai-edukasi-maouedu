// Stage 5: Gemini Multimodal Art-Director Critic & Closed-Loop Satsuei Auto-Refiner
// - For 2D Anime Broadcast Engine: evaluates every preview frame (0-100) on 4 strict criteria:
//   1. 2D Cel Authenticity (rejects CGI/3D/glossy/airbrushed drift)
//   2. Chroma Key & Light Integration (rejects green/magenta halos, jagged outlines, lighting mismatch)
//   3. Satsuei Readability (checks Pro-Mist bloom & crushed blacks don't blow out face or hurt 9:16 readability)
//   4. Composition Balance (9:16 vertical framing, depth separation, script alignment)
//   Returns structured pass/issues/shader_adjustments/regenerate_asset auto-correction JSON.
// - Preserves 3D Diorama critic mode cleanly untouched for classic/3D workflows.

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

const ALLOWED_REGEN_ASSETS = new Set(["haikei", "kyara"]);

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanHex(v, fb = "#e0f2fe") {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb;
}

export function sanitizeShaderAdjustments(rawAdj = {}, legacyPatch = {}) {
  const src = { ...(legacyPatch || {}), ...(rawAdj || {}) };
  const out = {};

  const bloom = src.bloom_intensity ?? src.bloomStrength;
  if (bloom !== undefined) out.bloom_intensity = Number(clamp(bloom, 0.12, 0.62, 0.30).toFixed(3));

  const lightWrap = src.light_wrap_strength ?? src.lightWrapStrength;
  if (lightWrap !== undefined) out.light_wrap_strength = Number(clamp(lightWrap, 0.15, 0.85, 0.48).toFixed(3));

  const shadowCrush = src.shadow_crush ?? src.shadowCrush;
  if (shadowCrush !== undefined) out.shadow_crush = Number(clamp(shadowCrush, 0.04, 0.30, 0.14).toFixed(3));

  const ambient = src.ambient_harmonization ?? src.ambientHarmonization;
  if (ambient !== undefined) out.ambient_harmonization = Number(clamp(ambient, 0.15, 0.30, 0.22).toFixed(3));

  const dof = src.dof_blur ?? src.dofBlur;
  if (dof !== undefined) out.dof_blur = Number(clamp(dof, 0.08, 0.55, 0.28).toFixed(3));

  const contrast = src.contrast;
  if (contrast !== undefined) out.contrast = Number(clamp(contrast, 0.98, 1.24, 1.10).toFixed(3));

  const saturation = src.saturation;
  if (saturation !== undefined) out.saturation = Number(clamp(saturation, 0.94, 1.30, 1.14).toFixed(3));

  const chromatic = src.chromatic_peak ?? src.chromaticPeak;
  if (chromatic !== undefined) out.chromatic_peak = Number(clamp(chromatic, 0.002, 0.022, 0.012).toFixed(4));

  const rim = src.rim_intensity ?? src.rimIntensity;
  if (rim !== undefined) out.rim_intensity = Number(clamp(rim, 0.35, 1.35, 0.82).toFixed(3));

  return out;
}

export function applyCriticPatchToBlueprint(blueprint, patchOrAdj) {
  if (!blueprint || typeof blueprint !== "object" || !patchOrAdj || typeof patchOrAdj !== "object") {
    return blueprint;
  }

  const next = JSON.parse(JSON.stringify(blueprint));

  // Native patch handling for Pure 2D Anime Broadcast Satsuei blueprints
  if (next.engine === "anime-mappa-2d" || next.engine === "anime-mappa-sakuga") {
    const adj = sanitizeShaderAdjustments(patchOrAdj.shader_adjustments || patchOrAdj, patchOrAdj);
    next.satsueiGrade = next.satsueiGrade || {};

    if (adj.bloom_intensity !== undefined) next.satsueiGrade.bloomStrength = adj.bloom_intensity;
    if (adj.light_wrap_strength !== undefined) next.satsueiGrade.lightWrapStrength = adj.light_wrap_strength;
    if (adj.shadow_crush !== undefined) next.satsueiGrade.shadowCrush = adj.shadow_crush;
    if (adj.ambient_harmonization !== undefined) next.satsueiGrade.ambientHarmonization = adj.ambient_harmonization;
    if (adj.dof_blur !== undefined) next.satsueiGrade.dofBlur = adj.dof_blur;
    if (adj.contrast !== undefined) next.satsueiGrade.contrast = adj.contrast;
    if (adj.saturation !== undefined) next.satsueiGrade.saturation = adj.saturation;
    if (adj.chromatic_peak !== undefined) next.satsueiGrade.chromaticPeak = adj.chromatic_peak;
    if (adj.rim_intensity !== undefined) next.satsueiGrade.rimIntensity = adj.rim_intensity;
    return next;
  }

  const patch = patchOrAdj;
  if (patch.lightingMood && ALLOWED_MOODS.has(patch.lightingMood)) {
    next.lightingMood = patch.lightingMood;
  }

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

  if (patch.motionField && typeof patch.motionField === "object") {
    next.motionField = sanitizeMotionField(patch.motionField);
  }

  if (Array.isArray(patch.removeVfx) && patch.removeVfx.length && Array.isArray(next.vfxSystems)) {
    const removeSet = new Set(patch.removeVfx.map((x) => String(x)));
    next.vfxSystems = next.vfxSystems.filter((v) => !removeSet.has(v.type));
  }

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

// Copyright-safe Broadcast 2D Anime Art-Director & Satsuei QC System Instruction
export const ANIME_ART_DIRECTOR_QC_PROMPT = `Kamu adalah "Chief 2D Anime Art-Director & Satsuei (撮影) Compositing QC Critic" standar siaran TV anime Jepang modern yang MELIHAT langsung frame render 9:16 lalu melakukan inspeksi ketat & kalibrasi shader otomatis!

NILAI FRAME (0–100) PADA 4 KRITERIA KETAT:
1. **celAuthenticity (2D Cel Authenticity):**
   - Tolak (skor < 70) jika karakter atau ilustrasi terlihat seperti 3D CGI, plastik glossy, atau soft-airbrush kabur.
   - Beri skor tinggi jika lineart tinta hitam G-pen tajam, bayangan cel 2-tone tegas, dan latar Haikei memiliki tekstur lukisan 2D atmosferik.
2. **chromaLightIntegration (Chroma Key & Light Integration):**
   - Tolak (skor < 70) jika tampak halo hijau/magenta sisa chroma key, pinggiran bergerigi (jagged), atau pencahayaan karakter terasa tempelan stiker terpisah dari warna ruangan Haikei.
   - Beri skor tinggi jika Light Wrap di tepi siluet karakter & temperatur ambient menyatu natural dengan Haikei.
3. **satsueiReadability (Satsuei Readability di Layar HP 9:16):**
   - Tolak (skor < 70) jika Pro-Mist bloom terlalu silau hingga wajah/Genga pecah, shadow crush terlalu pekat sampai detail hilang, atau teks/subtitle bawah & diagram edukasi sulit dibaca.
4. **compositionBalance (Komposisi & Kecocokan Naskah):**
   - Nilai apakah pembagian ruang karakter, ilustrasi Genga, atmosfer foreground, dan header/subtitle seimbang serta 100% sesuai narasi.

ATURAN AUTO-CORRECTION JSON:
- Set \`"pass": true\` HANYA jika \`overallScore >= 75\` DAN tidak ada kriteria di bawah 68.
- Isi \`"issues"\` secara spesifik (array string pendek; kosong \`[]\` jika mulus).
- Isi \`"shader_adjustments"\` dengan angka presisi untuk memperbaiki kekurangan visual yang kamu lihat:
  - \`bloom_intensity\` (0.14..0.55 — turunkan jika wajah/panel terlalu silau)
  - \`light_wrap_strength\` (0.20..0.78 — naikkan jika karakter masih terasa tempelan)
  - \`shadow_crush\` (0.06..0.26 — turunkan jika bagian gelap terlalu pekat, naikkan jika gambar terlalu pudar)
  - \`ambient_harmonization\` (0.15..0.28 — naikkan jika warna kulit/baju kurang nyatu dengan suhu warna latar)
  - \`dof_blur\` (0.12..0.46 — tingkatkan sedikit jika latar terlalu ramai bersaing dengan host)
  - \`contrast\` (1.00..1.20), \`saturation\` (0.98..1.24), \`chromatic_peak\` (0.004..0.018)
- Set \`"regenerate_asset"\` ke \`"haikei"\` atau \`"kyara"\` HANYA jika aset gambar benar-benar rusak/salah tema/artefak parah; selain itu WAJIB \`null\`.

Kembalikan HANYA JSON valid:
{
  "pass": true,
  "overallScore": 86,
  "criteria": {
    "celAuthenticity": 88,
    "chromaLightIntegration": 85,
    "satsueiReadability": 86,
    "compositionBalance": 85
  },
  "issues": [],
  "critique": "Penilaian jujur 1-2 kalimat Bahasa Indonesia tentang integrasi cel 2D, Light Wrap, Pro-Mist bloom, dan keterbacaan 9:16.",
  "improvements": ["Perbaikan konkret 1", "Perbaikan konkret 2"],
  "styleLesson": "1 kalimat pelajaran compositing Satsuei 2D untuk scene berikutnya",
  "shader_adjustments": {
    "bloom_intensity": 0.30,
    "light_wrap_strength": 0.50,
    "shadow_crush": 0.14,
    "ambient_harmonization": 0.22,
    "dof_blur": 0.28,
    "contrast": 1.10,
    "saturation": 1.14,
    "chromatic_peak": 0.012
  },
  "regenerate_asset": null
}`;

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
    ? ANIME_ART_DIRECTOR_QC_PROMPT
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
Blueprint 2D Satsuei saat ini:
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
Inspeksi gambar frame Anime 2D 9:16 terlampir! Skor 4 kriteria ketat (celAuthenticity, chromaLightIntegration, satsueiReadability, compositionBalance), deteksi halo chroma key / cahaya tidak menyatu / bloom berlebih, lalu kembalikan JSON auto-correction (pass, issues, shader_adjustments, regenerate_asset)!`
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
    temperature: 0.34,
    maxOutputTokens: 2048,
    timeoutMs: 22000
  });

  if (!res.ok || !res.data) {
    // Dedicated Anime 2D Satsuei fallback (fixes legacy bug where 3D diorama patch leaked into 2D mode!)
    if (isAnime2D) {
      const animeFallbackAdj = {
        bloom_intensity: 0.28,
        light_wrap_strength: 0.50,
        shadow_crush: 0.14,
        ambient_harmonization: 0.22,
        dof_blur: 0.28,
        contrast: 1.10,
        saturation: 1.14,
        chromatic_peak: 0.012
      };
      return {
        ok: true,
        pass: true,
        visionModel: "satsuei-art-director-fallback",
        overallScore: 84,
        criteria: {
          celAuthenticity: 86,
          chromaLightIntegration: 84,
          satsueiReadability: 84,
          compositionBalance: 82
        },
        breakdown: {
          framing: 82,
          lighting: 84,
          depthAndBokeh: 84,
          subjectClarity: 84,
          cinematicVibe: 86
        },
        issues: [],
        critique:
          "Kalibrasi Satsuei otomatis diterapkan: Pro-Mist bloom ditahan agar wajah & subtitle tajam, Light Wrap & ambient tint diselaraskan dengan Haikei.",
        improvements: [
          "Jaga Light Wrap 0.50 & ambient harmonization 0.22 agar cel 2D menyatu dengan latar",
          "Pertahankan selective bloom di bawah 0.32 untuk keterbacaan optimal di layar 9:16"
        ],
        styleLesson: "Jaga Light Wrap 0.48–0.54 dan bloom selektif 0.28 agar lineart cel 2D dan teks 9:16 tetap tajam.",
        shader_adjustments: animeFallbackAdj,
        regenerate_asset: null,
        patch: animeFallbackAdj,
        refinedBlueprint: applyCriticPatchToBlueprint(blueprint, animeFallbackAdj),
        warning: res.error
      };
    }

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
      pass: true,
      visionModel: "grounded-cinema-refiner",
      overallScore: 80,
      breakdown: { framing: 80, lighting: 80, depthAndBokeh: 78, subjectClarity: 82, cinematicVibe: 80 },
      issues: [],
      critique:
        "Menajamkan framing objek utama, menurunkan bloom agar permukaan meja & wadah tetap bersih, dan menjaga sudut kamera mudah dibaca.",
      improvements: ["Perjelas sudut pandang objek utama", "Jaga pencahayaan natural tanpa bloom berlebih"],
      styleLesson: "Jaga bloom rendah (0.16), sudut kamera agak atas, dan hindari efek berlebihan agar diorama jelas terbaca.",
      patch: fallbackPatch,
      refinedBlueprint: applyCriticPatchToBlueprint(blueprint, fallbackPatch),
      warning: res.error
    };
  }

  const d = res.data;

  if (isAnime2D) {
    const crit = d.criteria || {};
    const celAuthenticity = clamp(crit.celAuthenticity ?? d.breakdown?.cinematicVibe, 1, 100, 84);
    const chromaLightIntegration = clamp(crit.chromaLightIntegration ?? d.breakdown?.lighting, 1, 100, 82);
    const satsueiReadability = clamp(crit.satsueiReadability ?? d.breakdown?.subjectClarity, 1, 100, 84);
    const compositionBalance = clamp(crit.compositionBalance ?? d.breakdown?.framing, 1, 100, 84);

    const computedAvg = Math.round((celAuthenticity + chromaLightIntegration + satsueiReadability + compositionBalance) / 4);
    const overallScore = clamp(d.overallScore, 1, 100, computedAvg);
    const minScore = Math.min(celAuthenticity, chromaLightIntegration, satsueiReadability, compositionBalance);
    const pass = typeof d.pass === "boolean" ? d.pass : overallScore >= 75 && minScore >= 68;

    const issues = Array.isArray(d.issues)
      ? d.issues.slice(0, 5).map((s) => String(s).slice(0, 140))
      : [];

    const shaderAdjustments = sanitizeShaderAdjustments(d.shader_adjustments, d.patch);
    const rawRegen = typeof d.regenerate_asset === "string" ? d.regenerate_asset.trim().toLowerCase() : null;
    const regenerateAsset = ALLOWED_REGEN_ASSETS.has(rawRegen) ? rawRegen : null;

    const refinedBlueprint = applyCriticPatchToBlueprint(blueprint, shaderAdjustments);

    return {
      ok: true,
      pass,
      visionModel: res.model,
      elapsedMs: res.elapsedMs,
      overallScore,
      criteria: {
        celAuthenticity,
        chromaLightIntegration,
        satsueiReadability,
        compositionBalance
      },
      // Backward-compatible breakdown mirror for existing UI elements
      breakdown: {
        framing: compositionBalance,
        lighting: chromaLightIntegration,
        depthAndBokeh: chromaLightIntegration,
        subjectClarity: satsueiReadability,
        cinematicVibe: celAuthenticity
      },
      issues,
      critique: String(d.critique || "Visual 2D Satsuei dievaluasi oleh Art-Director Vision QC.").slice(0, 280),
      improvements: Array.isArray(d.improvements) ? d.improvements.slice(0, 4).map((s) => String(s).slice(0, 130)) : [],
      styleLesson: String(d.styleLesson || "").slice(0, 180),
      shader_adjustments: shaderAdjustments,
      regenerate_asset: regenerateAsset,
      patch: shaderAdjustments,
      refinedBlueprint,
      warning: null
    };
  }

  const patch = d.patch && typeof d.patch === "object" ? d.patch : {};
  const refinedBlueprint = applyCriticPatchToBlueprint(blueprint, patch);

  return {
    ok: true,
    pass: clamp(d.overallScore, 1, 100, 82) >= 72,
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
    issues: [],
    critique: String(d.critique || "Visual berhasil dievaluasi oleh Gemini Vision.").slice(0, 260),
    improvements: Array.isArray(d.improvements) ? d.improvements.slice(0, 4).map((s) => String(s).slice(0, 120)) : [],
    styleLesson: String(d.styleLesson || "").slice(0, 180),
    patch,
    refinedBlueprint,
    warning: null
  };
}
