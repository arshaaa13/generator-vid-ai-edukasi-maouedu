// Studio MAPPA / Jujutsu Kaisen Anime Sakuga Director & Kling-Class Shot Choreographer
// Translates any full-length script into cel-shaded 2D/3D hybrid anime cinematography:
// - 3-Band Stepped Cel-Shading + Chromatic Shadow Color Scripts (Satsuei)
// - Inverted-Hull Dynamic Ink Outlines & 2-3 Frame High-Contrast B&W Impact Frames
// - Articulated Shonen Anime Characters (Maou Vaelen + optional Rival) with 9 Sakuga Action Poses
// - Signature JJK VFX (Cursed Energy Flames, Black Flash Red-Black Lightning, Slash Smears, Domain Rings, Debris)
// - Strict 9:16 Vertical Framing & Multi-Scene Batch Support (handles 10-16+ scene full stories cleanly!)

import { callGeminiJson, GEMINI_VIDEO_MODELS } from "./gemini-client.js";
import { sanitizeCustomRig, buildCustomRigPromptSpec } from "./mesh-synthesizer.js";
import { ALLOWED_PREFABS_GROUNDED } from "./visual-researcher.js";

export const ALLOWED_ANIME_ENVS = new Set([
  "shibuya_night",
  "shrine_twilight",
  "tokyo_rooftop",
  "domain_expansion",
  "anime_lab_hq",
  "anime_kitchen_cafe",
  "anime_workshop_studio",
  "shattered_battlefield"
]);

export const ALLOWED_SATSUEI_MOODS = new Set([
  "jjk_cursed_blue",
  "shibuya_neon",
  "sukuna_crimson",
  "hollow_purple",
  "shonen_daylight",
  "golden_sunset",
  "emerald_triumph"
]);

export const ALLOWED_SAKUGA_CAMERAS = new Set([
  "low_angle_hero_push",
  "orbit_sakuga",
  "crash_zoom_impact",
  "whip_pan_reveal",
  "dutch_tension_tilt",
  "overhead_domain_crane"
]);

export const ALLOWED_ANIME_POSES = new Set([
  "stance_ready",
  "domain_hand_sign",
  "charge_cursed_energy",
  "dash_strike",
  "point_reveal",
  "shock_recoil",
  "floating_overlord",
  "walk_explain",
  "triumph_climax"
]);

export const ALLOWED_ANIME_VFX = new Set([
  "cursed_energy_aura",
  "black_flash_lightning",
  "slash_smear_arc",
  "domain_sigil_rings",
  "floating_debris",
  "sakura_embers",
  "impact_shockwave",
  "anime_steam_pour"
]);

export const ALLOWED_IMPACT_STYLES = new Set([
  "bw_manga_invert",
  "black_flash",
  "crimson_flash"
]);

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanHex(v, fb = "#38bdf8") {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb;
}

function cleanVec3(arr, fb = [0, 0, 0], lim = 3.5) {
  if (!Array.isArray(arr) || arr.length < 3) return [...fb];
  return [
    clamp(arr[0], -lim, lim, fb[0]),
    clamp(arr[1], -lim, lim, fb[1]),
    clamp(arr[2], -lim, lim, fb[2])
  ];
}

export function inferAnimeThemeForTopic(topic = "", scenes = []) {
  const txt = `${topic} ${(scenes || []).map((s) => `${s.componentLabel || ""} ${s.narration || ""}`).join(" ")}`.toLowerCase();

  if (/es krim|dapur|masak|goreng|rebus|kopi|teh|susu|mangkuk|panci|kue|roti|gelas/.test(txt)) {
    return {
      animeEnvironment: "anime_kitchen_cafe",
      defaultMood: "golden_sunset",
      auraColor: "#38bdf8",
      propPrefab: /es krim/.test(txt)
        ? "ice_cream_bowl"
        : /gelas|kopi|teh/.test(txt)
        ? "glass_cup"
        : /panci|rebus|kompor/.test(txt)
        ? "cooking_pot"
        : "hollow_bowl"
    };
  }
  if (/bitcoin|server|ai|chip|komputer|baterai|listrik|pltu|bunker|sains|kimia|sel|virus|dna/.test(txt)) {
    return {
      animeEnvironment: "anime_lab_hq",
      defaultMood: "jjk_cursed_blue",
      auraColor: "#38bdf8",
      propPrefab: /bitcoin|server/.test(txt)
        ? "asic_miner"
        : /baterai|listrik/.test(txt)
        ? "battery_reactor"
        : /kimia|sel|virus/.test(txt)
        ? "chemistry_flask"
        : "turbine_generator"
    };
  }
  if (/kipas|dinamo|motor|mesin|robot|mobil|bengkel/.test(txt)) {
    return {
      animeEnvironment: "anime_workshop_studio",
      defaultMood: "shonen_daylight",
      auraColor: "#f59e0b",
      propPrefab: /kipas|dinamo|motor/.test(txt)
        ? "copper_stator_motor"
        : /robot/.test(txt)
        ? "robot_arm"
        : /mobil/.test(txt)
        ? "car_sports"
        : "bevel_chassis"
    };
  }
  if (/pesawat|jet|sr-71|roket|langit|awan|hujan|petir|cuaca/.test(txt)) {
    return {
      animeEnvironment: "tokyo_rooftop",
      defaultMood: "shonen_daylight",
      auraColor: "#38bdf8",
      propPrefab: /roket/.test(txt) ? "rocket_ship" : "aircraft_jet"
    };
  }
  if (/gunung|lava|api|naga|perang|pertarungan|jujutsu|kutukan|iblis|samurai|pedang|ledak/.test(txt)) {
    return {
      animeEnvironment: "shrine_twilight",
      defaultMood: "sukuna_crimson",
      auraColor: "#f43f5e",
      propPrefab: /gunung|lava/.test(txt) ? "volcano_peak" : "crystal_core"
    };
  }
  if (/ikan|kolam|akuarium|pari|arwana|cupang|laut|samudra/.test(txt)) {
    return {
      animeEnvironment: "domain_expansion",
      defaultMood: "jjk_cursed_blue",
      auraColor: "#0ea5e9",
      propPrefab: /pari/.test(txt) ? "stingray" : /arwana/.test(txt) ? "fish_arowana" : "glass_aquarium"
    };
  }
  return {
    animeEnvironment: "shibuya_night",
    defaultMood: "shibuya_neon",
    auraColor: "#a855f7",
    propPrefab: "crystal_core"
  };
}

export function inferFallbackAnimeBlueprint(scene = {}, topic = "", sceneIndex = 0, totalScenes = 8, theme = null) {
  const t = theme || inferAnimeThemeForTopic(topic, [scene]);
  const phase = scene.phase || (sceneIndex === 0 ? "HOOK" : sceneIndex === totalScenes - 1 ? "CLIMAX" : "JADI");
  const text = `${scene.componentLabel || ""} ${scene.plainNarration || scene.narration || ""}`.toLowerCase();

  let animeEnvironment = t.animeEnvironment;
  if (phase === "CLIMAX" && (animeEnvironment === "shibuya_night" || animeEnvironment === "anime_lab_hq")) {
    animeEnvironment = "domain_expansion";
  }

  let satsueiMood = t.defaultMood;
  if (phase === "TAPI") satsueiMood = "sukuna_crimson";
  else if (phase === "CLIMAX") satsueiMood = "hollow_purple";
  else if (phase === "JADI" && sceneIndex % 2 === 1) satsueiMood = "jjk_cursed_blue";

  const poseByPhase = {
    HOOK: sceneIndex === 0 ? "point_reveal" : "stance_ready",
    TAPI: /bahaya|ledak|overheat|panas|hancur|kalah|gagal/.test(text) ? "shock_recoil" : "charge_cursed_energy",
    JADI: sceneIndex % 2 === 0 ? "domain_hand_sign" : "dash_strike",
    CLIMAX: "floating_overlord"
  };
  const mainPose = poseByPhase[phase] || "stance_ready";

  const cameraByPhase = {
    HOOK: "low_angle_hero_push",
    TAPI: sceneIndex % 2 === 0 ? "dutch_tension_tilt" : "crash_zoom_impact",
    JADI: sceneIndex % 2 === 0 ? "orbit_sakuga" : "whip_pan_reveal",
    CLIMAX: "orbit_sakuga"
  };
  const cameraMove = cameraByPhase[phase] || "low_angle_hero_push";

  const auraHex =
    phase === "TAPI" ? "#f43f5e" : phase === "CLIMAX" ? "#a855f7" : t.auraColor || "#38bdf8";

  const characters = [
    {
      id: "maou_hero",
      role: "protagonist",
      name: "Maou Vaelen",
      animePose: mainPose,
      hairColor: "#cbd5e1",
      streakColor: "#e11d48",
      outfitColor: "#111827",
      accentColor: "#f59e0b",
      eyeColor: phase === "TAPI" ? "#ef4444" : "#38bdf8",
      auraColor: auraHex,
      hasHorns: true,
      startPos: [-0.46, 0, -0.1],
      endPos: mainPose === "dash_strike" ? [-0.12, 0, 0.25] : [-0.4, 0, -0.04],
      rotY: 0.28,
      scale: 1.0
    }
  ];

  // Add dramatic rival silhouette in VS / clash scenes
  if (scene.visual?.vsCard?.leftTitle || /lawan|vs|musuh|banding|kalah/.test(text)) {
    characters.push({
      id: "rival_figure",
      role: "rival",
      name: "Rival",
      animePose: phase === "TAPI" ? "dash_strike" : "stance_ready",
      hairColor: "#1e1b4b",
      streakColor: "#38bdf8",
      outfitColor: "#1e293b",
      accentColor: "#e11d48",
      eyeColor: "#f43f5e",
      auraColor: "#e11d48",
      hasHorns: false,
      startPos: [0.58, 0, -0.25],
      endPos: [0.46, 0, -0.15],
      rotY: -0.42,
      scale: 0.96
    });
  }

  const subjectProps = [
    {
      id: "hero_subject",
      prefab: t.propPrefab || "crystal_core",
      customRig: null,
      label: scene.componentLabel || topic.slice(0, 26),
      color: phase === "TAPI" ? "#fb7185" : "#38bdf8",
      secondaryColor: "#fbbf24",
      pos: [0.46, 0.28, 0.08],
      rot: [0, -0.28, 0],
      scale: 0.82,
      motion: phase === "TAPI" ? "vibrate" : "hover_pulse"
    }
  ];

  const animeVfx = [];
  if (phase === "TAPI") {
    animeVfx.push(
      { type: "black_flash_lightning", origin: [0.05, 0.95, 0.1], color: "#ef4444", intensity: 1.15 },
      { type: "impact_shockwave", origin: [0.05, 0.9, 0.1], color: "#f43f5e", intensity: 1.0 },
      { type: "floating_debris", origin: [0, 0.7, -0.1], color: "#475569", intensity: 0.9 }
    );
  } else if (phase === "CLIMAX") {
    animeVfx.push(
      { type: "domain_sigil_rings", origin: [0.0, 1.05, -0.65], color: "#a855f7", intensity: 1.2 },
      { type: "cursed_energy_aura", origin: [-0.42, 0.75, -0.05], color: "#38bdf8", intensity: 1.1 },
      { type: "sakura_embers", origin: [0, 1.2, 0], color: "#fbbf24", intensity: 1.0 }
    );
  } else if (phase === "JADI") {
    animeVfx.push(
      { type: "cursed_energy_aura", origin: [-0.42, 0.75, -0.05], color: auraHex, intensity: 0.95 },
      { type: "slash_smear_arc", origin: [0.15, 0.9, 0.15], color: auraHex, intensity: 0.9 }
    );
  } else {
    animeVfx.push(
      { type: "cursed_energy_aura", origin: [-0.42, 0.75, -0.05], color: auraHex, intensity: 0.85 },
      { type: "sakura_embers", origin: [0, 1.0, 0], color: auraHex, intensity: 0.75 }
    );
  }

  if (animeEnvironment === "anime_kitchen_cafe" || /tuang|aduk|uap|masak|es krim|gelas/.test(text)) {
    animeVfx.push({ type: "anime_steam_pour", origin: [0.46, 0.6, 0.08], color: "#f8fafc", intensity: 0.9 });
  }

  const enableImpact = phase === "TAPI" || phase === "CLIMAX" || mainPose === "dash_strike";

  return {
    engine: "anime-mappa-sakuga",
    sceneNumber: scene.sceneNumber || sceneIndex + 1,
    animeEnvironment,
    satsueiMood,
    cameraMove,
    impactBeat: {
      enabled: enableImpact,
      triggerProgress: phase === "TAPI" ? 0.42 : 0.56,
      style: phase === "TAPI" ? "black_flash" : phase === "CLIMAX" ? "bw_manga_invert" : "crimson_flash"
    },
    characters,
    subjectProps,
    animeVfx,
    mangaCaption:
      phase === "TAPI"
        ? "IMPACT!!"
        : phase === "CLIMAX"
        ? "DOMAIN COMPLETE!"
        : sceneIndex === 0
        ? "ACTIVATE!"
        : "",
    satsueiGrade: {
      bloomStrength: phase === "TAPI" || phase === "CLIMAX" ? 0.58 : 0.36,
      rimIntensity: 1.15,
      chromaticPeak: enableImpact ? 0.014 : 0.003,
      speedLines: phase === "TAPI" || mainPose === "dash_strike",
      outlineWeight: 1.0,
      contrast: 1.12,
      saturation: 1.18
    }
  };
}

export function sanitizeAnimeBlueprint(raw, scene, topic, sceneIndex, totalScenes, theme = null) {
  const fb = inferFallbackAnimeBlueprint(scene, topic, sceneIndex, totalScenes, theme);
  if (!raw || typeof raw !== "object") return fb;

  const animeEnvironment = ALLOWED_ANIME_ENVS.has(raw.animeEnvironment) ? raw.animeEnvironment : fb.animeEnvironment;
  const satsueiMood = ALLOWED_SATSUEI_MOODS.has(raw.satsueiMood) ? raw.satsueiMood : fb.satsueiMood;
  const cameraMove = ALLOWED_SAKUGA_CAMERAS.has(raw.cameraMove) ? raw.cameraMove : fb.cameraMove;

  const rawImp = raw.impactBeat || {};
  const impactBeat = {
    enabled: typeof rawImp.enabled === "boolean" ? rawImp.enabled : fb.impactBeat.enabled,
    triggerProgress: clamp(rawImp.triggerProgress, 0.2, 0.85, fb.impactBeat.triggerProgress),
    style: ALLOWED_IMPACT_STYLES.has(rawImp.style) ? rawImp.style : fb.impactBeat.style
  };

  const characters = Array.isArray(raw.characters)
    ? raw.characters
        .slice(0, 2)
        .filter((c) => c && typeof c === "object")
        .map((c, idx) => {
          const isMain = idx === 0;
          const sp = cleanVec3(c.startPos, isMain ? [-0.46, 0, -0.08] : [0.54, 0, -0.2], 1.2);
          const ep = cleanVec3(c.endPos || c.startPos, sp, 1.2);
          // Clamp X cleanly within 9:16 portrait safe corridor!
          sp[0] = clamp(sp[0], -0.78, 0.78, isMain ? -0.46 : 0.54);
          ep[0] = clamp(ep[0], -0.78, 0.78, sp[0]);
          sp[1] = clamp(sp[1], 0, 0.75, 0);
          ep[1] = clamp(ep[1], 0, 0.75, sp[1]);
          return {
            id: String(c.id || (isMain ? "maou_hero" : `anime_char_${idx}`)).slice(0, 28),
            role: c.role === "rival" ? "rival" : "protagonist",
            name: String(c.name || (isMain ? "Maou Vaelen" : "Rival")).slice(0, 28),
            animePose: ALLOWED_ANIME_POSES.has(c.animePose) ? c.animePose : fb.characters[0].animePose,
            hairColor: cleanHex(c.hairColor, isMain ? "#cbd5e1" : "#1e1b4b"),
            streakColor: cleanHex(c.streakColor, isMain ? "#e11d48" : "#38bdf8"),
            outfitColor: cleanHex(c.outfitColor, isMain ? "#111827" : "#1e293b"),
            accentColor: cleanHex(c.accentColor, isMain ? "#f59e0b" : "#e11d48"),
            eyeColor: cleanHex(c.eyeColor, isMain ? "#38bdf8" : "#f43f5e"),
            auraColor: cleanHex(c.auraColor, fb.characters[0].auraColor),
            hasHorns: typeof c.hasHorns === "boolean" ? c.hasHorns : isMain,
            startPos: sp,
            endPos: ep,
            rotY: clamp(c.rotY, -1.8, 1.8, isMain ? 0.28 : -0.38),
            scale: clamp(c.scale, 0.72, 1.25, 1.0)
          };
        })
    : [];

  const subjectProps = Array.isArray(raw.subjectProps)
    ? raw.subjectProps
        .slice(0, 4)
        .filter((p) => p && typeof p === "object")
        .map((p, idx) => {
          let prefab = p.prefab;
          let customRig = null;
          if (prefab === "custom_rig") {
            customRig = sanitizeCustomRig(p.customRig);
            if (!customRig) prefab = fb.subjectProps[0].prefab;
          } else if (!ALLOWED_PREFABS_GROUNDED.has(prefab)) {
            prefab = fb.subjectProps[0].prefab;
          }
          const pos = cleanVec3(p.pos, [0.46, 0.25 + idx * 0.15, 0.08], 1.15);
          pos[0] = clamp(pos[0], -0.78, 0.78, 0.46);
          pos[1] = clamp(pos[1], 0.0, 1.4, 0.28);
          return {
            id: String(p.id || `prop_${idx}`).slice(0, 28),
            prefab,
            customRig,
            label: String(p.label || "").slice(0, 28),
            color: cleanHex(p.color, "#38bdf8"),
            secondaryColor: cleanHex(p.secondaryColor, "#fbbf24"),
            pos,
            rot: cleanVec3(p.rot, [0, -0.25, 0], 6.3),
            scale: clamp(p.scale, 0.4, 1.35, 0.82),
            motion: ["none", "hover_pulse", "spin", "vibrate", "orbit_slash"].includes(p.motion)
              ? p.motion
              : "hover_pulse"
          };
        })
    : [];

  const animeVfx = Array.isArray(raw.animeVfx)
    ? raw.animeVfx
        .slice(0, 4)
        .filter((v) => v && typeof v === "object" && ALLOWED_ANIME_VFX.has(v.type))
        .map((v) => ({
          type: v.type,
          origin: cleanVec3(v.origin, [0, 0.9, 0], 2.5),
          color: cleanHex(v.color, fb.characters[0].auraColor),
          intensity: clamp(v.intensity, 0.35, 1.45, 1.0)
        }))
    : [];

  const rawG = raw.satsueiGrade || {};
  const satsueiGrade = {
    bloomStrength: clamp(rawG.bloomStrength, 0.18, 0.78, fb.satsueiGrade.bloomStrength),
    rimIntensity: clamp(rawG.rimIntensity, 0.5, 1.8, fb.satsueiGrade.rimIntensity),
    chromaticPeak: clamp(rawG.chromaticPeak, 0.0, 0.02, fb.satsueiGrade.chromaticPeak),
    speedLines: typeof rawG.speedLines === "boolean" ? rawG.speedLines : fb.satsueiGrade.speedLines,
    outlineWeight: clamp(rawG.outlineWeight, 0.65, 1.8, 1.0),
    contrast: clamp(rawG.contrast, 1.0, 1.24, fb.satsueiGrade.contrast),
    saturation: clamp(rawG.saturation, 0.95, 1.35, fb.satsueiGrade.saturation)
  };

  return {
    engine: "anime-mappa-sakuga",
    sceneNumber: scene?.sceneNumber || sceneIndex + 1,
    animeEnvironment,
    satsueiMood,
    cameraMove,
    impactBeat,
    characters: characters.length ? characters : fb.characters,
    subjectProps: subjectProps.length ? subjectProps : fb.subjectProps,
    animeVfx: animeVfx.length ? animeVfx : fb.animeVfx,
    mangaCaption: String(raw.mangaCaption || "").slice(0, 26),
    satsueiGrade
  };
}

const ANIME_MAPPA_DIRECTOR_PROMPT = `Kamu adalah "Studio MAPPA x Kling AI Anime Sakuga Director" — Sutradara Animasi Anime bergaya **JUJUTSU KAISEN (Season 1 & Shibuya Incident Season 2)**!
Tugasmu adalah menyutradarai setiap scene naskah menjadi potongan animasi anime 9:16 yang **HIDUP, DINAMIS, DRAMATIS, BERKELANJUTAN, DAN NYAMBUNG 100% DENGAN NARASI**!

PRINSIP PRODUKSI ANIME STUDIO MAPPA (WAJIB!):
1. **SATU SET DUNIA ANIME KONSISTEN & EVOLUTIF:**
   - Pilih latar anime yang pas dengan topik ("anime_kitchen_cafe" untuk masak/minuman/es krim ala anime kuliner, "anime_workshop_studio" untuk alat/eksperimen/dinamo, "anime_lab_hq" untuk sains/komputer/listrik, "shibuya_night" untuk kota/teknologi/misteri, "tokyo_rooftop" untuk cuaca/pesawat/langit, "shrine_twilight" untuk api/konflik/mitologi, "domain_expansion" untuk klimaks sains/penjelasan mendalam/laut!).
2. **KARAKTER ANIME ARTIKULATIF & POSE SAKUGA ("characters"):**
   - Karakter utama "Maou Vaelen" (rambut ash-silver + crimson streak, jas panjang berkibar, tanduk asimetris menyala) beraksi langsung menjelaskan & mendemonstrasikan topik dengan pose ekspresif:
     "stance_ready" | "domain_hand_sign" (segel tangan Domain Expansion!) | "charge_cursed_energy" | "dash_strike" | "point_reveal" | "shock_recoil" | "floating_overlord" | "walk_explain" | "triumph_climax".
   - Di scene konflik/perbandingan (VS), kamu boleh hadirkan karakter ke-2 ("role": "rival")!
   - **FRAMING 9:16 PRESISI:** jaga posisi X karakter & objek di antara **-0.65 sampai +0.65** agar TIDAK PERNAH terpotong sisi kiri/kanan layar HP!
3. **OBJEK TOPIK CEL-SHADED + INK OUTLINE ("subjectProps"):**
   - Wajib hadirkan 1–3 objek 3D cel-shaded yang **HARFIAH menggambarkan isi narasi** (misal "hollow_bowl", "ice_cream_bowl", "glass_cup", "cooking_pot", "copper_stator_motor", "asic_miner", "aircraft_jet", "rocket_ship", "glass_aquarium", "battery_reactor", "custom_rig" untuk makhluk/objek unik!).
4. **IMPACT FRAMES & SATSUEI COMPOSITING KHAS JUJUTSU KAISEN:**
   - Aktifkan "impactBeat": { "enabled": true, "triggerProgress": 0.45..0.65, "style": "bw_manga_invert" | "black_flash" | "crimson_flash" } pada momen puncak [TAPI], benturan, atau [CLIMAX]! (Pada scene penjelasan tenang, set enabled: false agar ritme kontras & terasa mahal seperti episode MAPPA asli!)
   - Pilih "satsueiMood": "jjk_cursed_blue" | "shibuya_neon" | "sukuna_crimson" | "hollow_purple" | "shonen_daylight" | "golden_sunset" | "emerald_triumph".
   - Pilih "cameraMove": "low_angle_hero_push" | "orbit_sakuga" | "crash_zoom_impact" | "whip_pan_reveal" | "dutch_tension_tilt" | "overhead_domain_crane".
   - Pilih 1–3 "animeVfx" yang dramatis & sesuai momen: "cursed_energy_aura" | "black_flash_lightning" | "slash_smear_arc" | "domain_sigil_rings" | "floating_debris" | "sakura_embers" | "impact_shockwave" | "anime_steam_pour".

Kembalikan HANYA JSON valid:
{
  "directorNotes": "Ringkasan gaya penyutradaraan MAPPA x JJK untuk episode ini",
  "scenes": [
    {
      "sceneNumber": 1,
      "animeEnvironment": "shibuya_night",
      "satsueiMood": "jjk_cursed_blue",
      "cameraMove": "low_angle_hero_push",
      "impactBeat": { "enabled": false, "triggerProgress": 0.55, "style": "bw_manga_invert" },
      "characters": [
        {
          "id": "maou_hero",
          "role": "protagonist",
          "name": "Maou Vaelen",
          "animePose": "point_reveal",
          "hairColor": "#cbd5e1",
          "streakColor": "#e11d48",
          "outfitColor": "#111827",
          "accentColor": "#f59e0b",
          "eyeColor": "#38bdf8",
          "auraColor": "#38bdf8",
          "hasHorns": true,
          "startPos": [-0.42, 0, -0.05],
          "endPos": [-0.36, 0, 0.02],
          "rotY": 0.28,
          "scale": 1.0
        }
      ],
      "subjectProps": [
        {
          "id": "main_prop",
          "prefab": "hollow_bowl",
          "label": "Mangkuk Stainless",
          "color": "#cbd5e1",
          "secondaryColor": "#fef3c7",
          "pos": [0.42, 0.28, 0.08],
          "rot": [0, -0.25, 0],
          "scale": 0.85,
          "motion": "hover_pulse"
        }
      ],
      "animeVfx": [
        { "type": "cursed_energy_aura", "origin": [-0.42, 0.75, -0.05], "color": "#38bdf8", "intensity": 0.9 },
        { "type": "sakura_embers", "origin": [0, 1.0, 0], "color": "#fbbf24", "intensity": 0.75 }
      ],
      "mangaCaption": "ACTIVATE!",
      "satsueiGrade": {
        "bloomStrength": 0.38,
        "rimIntensity": 1.2,
        "chromaticPeak": 0.004,
        "speedLines": false,
        "outlineWeight": 1.0,
        "contrast": 1.12,
        "saturation": 1.18
      }
    }
  ]
}`;

export async function compileAnimeMappaVideo({
  topic = "",
  title = "",
  scenes = [],
  geminiApiKey = "",
  styleMemoryHints = []
}) {
  if (!Array.isArray(scenes) || !scenes.length) {
    throw new Error("Daftar scene kosong untuk Mode Anime MAPPA Sakuga.");
  }

  const theme = inferAnimeThemeForTopic(topic || title, scenes);
  const memoryBlock =
    Array.isArray(styleMemoryHints) && styleMemoryHints.length
      ? `\nMEMORI KUALITAS VISUAL USER:\n${styleMemoryHints.slice(0, 3).map((h) => `- ${h}`).join("\n")}`
      : "";

  const systemInstruction = [ANIME_MAPPA_DIRECTOR_PROMPT, buildCustomRigPromptSpec(), memoryBlock]
    .filter(Boolean)
    .join("\n\n");

  // Chunk into batches of max 8 scenes so even 12-16 scene full stories NEVER hit token truncation!
  const chunkSize = 8;
  const rawMap = new Map();
  let usedModel = null;
  let lastError = null;
  let directorNotes = "";

  for (let start = 0; start < scenes.length; start += chunkSize) {
    const slice = scenes.slice(start, start + chunkSize);
    const compact = slice.map((s, i) => ({
      sceneNumber: s.sceneNumber || start + i + 1,
      phase: s.phase || "HOOK",
      componentLabel: s.componentLabel || "",
      narration: s.plainNarration || s.narration || "",
      hasVsCard: Boolean(s.visual?.vsCard?.leftTitle)
    }));

    const userPrompt = `TOPIK EPISODE ANIME: "${topic || title}"
JUDUL: "${title || topic}"
REKOMENDASI LATAR KONSISTEN: "${theme.animeEnvironment}" (boleh masuk "domain_expansion" di CLIMAX!)
BATCH SCENE: ${compact[0].sceneNumber}..${compact[compact.length - 1].sceneNumber} dari total ${scenes.length} scene:
${JSON.stringify(compact, null, 2)}

Sutradarai SEMUA ${compact.length} scene di batch ini dengan gaya animasi Studio MAPPA / Jujutsu Kaisen yang epik, terstruktur, dan 100% sesuai narasi!`;

    const res = await callGeminiJson({
      geminiApiKey,
      systemInstruction,
      userPrompt,
      temperature: 0.65,
      maxOutputTokens: 16384,
      timeoutMs: 26000,
      models: GEMINI_VIDEO_MODELS
    });

    if (res.ok && Array.isArray(res.data?.scenes)) {
      usedModel = res.model;
      if (!directorNotes && res.data.directorNotes) directorNotes = res.data.directorNotes;
      res.data.scenes.forEach((sc, i) => {
        const keyNum = Number(sc.sceneNumber || slice[i]?.sceneNumber || start + i + 1);
        rawMap.set(keyNum, sc);
      });
    } else {
      lastError = res.error;
    }
  }

  const blueprints = scenes.map((sc, idx) => {
    const num = sc.sceneNumber || idx + 1;
    const rawBp = rawMap.get(num) || null;
    return sanitizeAnimeBlueprint(rawBp, sc, topic || title, idx, scenes.length, theme);
  });

  const customRigCount = blueprints.reduce(
    (sum, bp) => sum + (bp.subjectProps || []).filter((p) => p.prefab === "custom_rig" && p.customRig).length,
    0
  );

  return {
    ok: true,
    renderMode: "anime_mappa",
    directorModel: usedModel || "mappa-sakuga-fallback",
    customRigCount,
    directorNotes:
      directorNotes ||
      `Episode Anime Sakuga gaya Studio MAPPA (Jujutsu Kaisen) untuk "${topic || title}" dengan ${scenes.length} scene penuh.`,
    scenes: blueprints,
    warning: usedModel ? null : lastError
  };
}
