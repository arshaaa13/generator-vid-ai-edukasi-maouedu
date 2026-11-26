// MaouEdu Gemini Cinema Video Renderer (Backend Grounded 3D Director + Cumulative Choreography Compiler)
// Builds coherent, physically grounded Pixar/Blender-Cycles diorama animations driven by:
// Stage 0: Online Visual Reference Research + Locked World Foundation + Persistent Asset Catalog
// Stage 1: Script-Synced Cumulative Choreography + Physical Surface Placement + Clean Minimal VFX

import {
  cleanApiKey as cleanKey,
  collectGeminiKeys,
  callGeminiJson,
  GEMINI_VIDEO_MODELS
} from "./video-ai/gemini-client.js";
import { sanitizeCustomRig, buildCustomRigPromptSpec } from "./video-ai/mesh-synthesizer.js";
import {
  sanitizeMotionField,
  sanitizeKeyframes,
  sanitizeOptics,
  buildKlingCinematographyAddendum
} from "./video-ai/shot-planner.js";
import {
  researchAndPlanVisualWorld,
  sanitizeVisualPlan,
  ALLOWED_LIGHTING_PRESETS,
  ALLOWED_PREFABS_GROUNDED,
  ALLOWED_MATERIALS,
  isSciFiTopic
} from "./video-ai/visual-researcher.js";

export const GEMINI_CINEMA_MODELS = GEMINI_VIDEO_MODELS;

export const GEMINI_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-nano-banana-2.1",
  "gemini-3.1-flash-lite-image",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image"
];

const ALLOWED_MOODS = new Set([
  // New clean natural daylight studio presets
  ...ALLOWED_LIGHTING_PRESETS,
  // Legacy mood keys (backward-compatible)
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

const ALLOWED_ENVS = new Set([
  "studio_bench",
  "kitchen_cinema",
  "backyard_pond",
  "sawah_valley",
  "house_cutaway",
  "runway_tarmac",
  "sci_fi_lab",
  "deep_underwater",
  "volcanic_terrain",
  "space_orbit",
  "city_street",
  "factory_floor",
  "arctic_glacier"
]);

const ROOM_TO_ENV_FALLBACK = {
  kitchen_counter: "kitchen_cinema",
  oak_workshop: "studio_bench",
  cozy_room: "studio_bench",
  science_lab: "studio_bench",
  backyard_yard: "backyard_pond",
  farm_field: "sawah_valley",
  house_cross_section: "house_cutaway",
  runway_outdoor: "runway_tarmac",
  street_exterior: "city_street",
  underwater_bed: "deep_underwater",
  volcanic_outdoor: "volcanic_terrain",
  arctic_outdoor: "arctic_glacier",
  space_orbit: "space_orbit"
};

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

const ALLOWED_TRANSITIONS = new Set([
  "none",
  "cross_dissolve",
  "zoom_through",
  "whip_pan",
  "flash_impact"
]);

const ALLOWED_MOTIONS = new Set([
  "none",
  "hover",
  "spin_y",
  "spin_z",
  "pulse",
  "shake",
  "swim",
  "orbit",
  "piston",
  "flap",
  "vibrate",
  "breathe"
]);

const ALLOWED_ENTERS = new Set([
  "none",
  "pop_bounce",
  "drop_impact",
  "slide_left",
  "slide_right",
  "emerge_up"
]);

const ALLOWED_SCRIPT_ACTIONS = new Set([
  "rest",
  "pour_into",
  "stir_inside",
  "heat_below",
  "vibrate_fault",
  "spin_smooth",
  "assemble_drop",
  "slide_in",
  "celebrate_bounce"
]);

const RIGID_GROUNDED_PREFABS = new Set([
  "hollow_bowl",
  "glass_cup",
  "jar_bottle",
  "plate_dish",
  "cutting_board",
  "stove_burner",
  "bucket_tub",
  "wooden_table",
  "bookshelf_cabinet",
  "whiteboard_chart",
  "potted_plant",
  "ice_cube_tray",
  "salt_shaker",
  "ice_cream_bowl",
  "coffee_espresso",
  "cooking_pot",
  "chemistry_flask",
  "glass_aquarium",
  "filter_sump",
  "asic_miner",
  "battery_reactor",
  "solar_array",
  "ac_compressor",
  "boiler_furnace",
  "microscope_lab",
  "server_rack",
  "thermal_plates",
  "rebar_structure",
  "bevel_chassis"
]);

const SCIFI_ONLY_PREFABS = new Set(["hologram_ring", "neon_tube", "energy_sphere"]);

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function sanitizeVec3(arr, fallback = [0, 0, 0], limit = 12) {
  if (!Array.isArray(arr) || arr.length < 3) return [...fallback];
  return [
    clampNum(arr[0], -limit, limit, fallback[0]),
    clampNum(arr[1], -limit, limit, fallback[1]),
    clampNum(arr[2], -limit, limit, fallback[2])
  ];
}

function sanitizeHex(hex, fallback = "#cbd5e1") {
  if (typeof hex !== "string") return fallback;
  const s = hex.trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

function sanitizePlacement(raw, actor) {
  const fallbackX = Array.isArray(actor?.startPos) ? actor.startPos[0] : 0;
  const fallbackZ = Array.isArray(actor?.startPos) ? actor.startPos[2] : 0;
  const defaultOn =
    actor?.prefab === "rocket_ship" ||
    actor?.prefab === "bird_eagle" ||
    actor?.prefab === "drone_quad" ||
    actor?.prefab === "hologram_ring"
      ? "floating"
      : "surface";

  if (!raw || typeof raw !== "object") {
    return {
      on: defaultOn,
      x: clampNum(fallbackX, -3.2, 3.2, 0),
      z: clampNum(fallbackZ, -2.0, 1.6, 0),
      yOffset: 0
    };
  }

  let on = String(raw.on || defaultOn).trim().slice(0, 48);
  const validOn =
    on === "surface" ||
    on === "floor" ||
    on === "wall" ||
    on === "floating" ||
    /^on_top:[a-zA-Z0-9_-]{1,32}$/.test(on) ||
    /^inside:[a-zA-Z0-9_-]{1,32}$/.test(on);
  if (!validOn) on = defaultOn;

  return {
    on,
    x: clampNum(raw.x, -3.2, 3.2, fallbackX),
    z: clampNum(raw.z, -2.0, 1.6, fallbackZ),
    yOffset: clampNum(raw.yOffset, -0.5, 1.8, 0)
  };
}

function sanitizeLiquidState(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    level: clampNum(raw.level, 0, 1, 0.55),
    color: sanitizeHex(raw.color, "#fef3c7"),
    frozen: Boolean(raw.frozen),
    murky: Boolean(raw.murky),
    bubbles: Boolean(raw.bubbles),
    condensation: Boolean(raw.condensation),
    scoops: Boolean(raw.scoops),
    iceCubes: Boolean(raw.iceCubes)
  };
}

// Strict script-grounded VFX gatekeeper: prevents random sci-fi/fire/sparkle clutter!
export function isVfxJustifiedForScene(type, sceneText = "", topicText = "", phase = "HOOK") {
  const s = String(sceneText || "").trim().toLowerCase();
  const both = `${s} ${String(topicText || "").toLowerCase()}`;
  const target = s.length >= 6 ? s : both;
  const scifi = isSciFiTopic(both);

  switch (type) {
    case "pour_stream":
      return /tuang|siram|alir|tabur|masukkan|campur|isi\b|tetes|bocor|susu|air|garam|gula/.test(target);
    case "condensation_drops":
      return /embun|basah|kondensasi|tetes|dingin|uap air|mengembun/.test(target);
    case "steam_smoke":
      return /uap|asap|panas|didih|rebus|goreng|kompor|kopi|teh|overheat|bakar|knalpot|pltu|vulkanik|lava|mesin panas|suhu tinggi/.test(
        target
      );
    case "bubbles_rise":
      return /gelembung|didih|rebus|akuarium|kolam|ikan|filter|oksigen|aerator|bawah laut|selam|soda|air/.test(target);
    case "frost_crystals":
      return /es\b|es krim|beku|dingin|freezer|kulkas|salju|kutub|garam|titik beku|kristal/.test(target);
    case "water_splash":
      return /ciprat|lompat|tumpah|ombak|menyiram|terjun/.test(target);
    case "fire_flames":
      return /api|kompor|nyala|bakar|meledak|lava|magma|roket|afterburner|vulkanik|naga|overheat/.test(target);
    case "electric_arcs":
      return scifi || /listrik|korslet|petir|tegangan|kapasitor|percikan|setrum|plasma|baterai/.test(target);
    case "sound_shockwave":
      return /bising|berisik|suara|getar|db|desibel|gempa|ledak|guncang|tutup telinga|keras banget/.test(target);
    case "energy_flow":
      return /alir|pipa|kabel|listrik|arus|filter|sirkulasi|panas|energi|surya|turbin|udara/.test(target);
    case "rain_storm":
      return /hujan|badai|gerimis|mendung/.test(target);
    case "heat_haze":
      return /panas|memuai|suhu|overheat|matahari|lava|kompor/.test(target);
    case "god_rays":
      return /sinar matahari|cahaya langit|bawah laut|hutan|surga/.test(target);
    case "gold_sparkles":
      return phase === "CLIMAX" && /selamat|berhasil|sempurna|lembut|juara|enak|jernih|menang/.test(target);
    default:
      return false;
  }
}

export function inferFallbackCinemaBlueprint(
  scene = {},
  topic = "",
  sceneIndex = 0,
  totalScenes = 6,
  visualPlan = null
) {
  const phase = scene.phase || (sceneIndex === 0 ? "HOOK" : sceneIndex === totalScenes - 1 ? "CLIMAX" : "JADI");
  const narration = `${scene.componentLabel || ""} ${scene.plainNarration || scene.narration || ""}`;
  const lower = narration.toLowerCase();
  const visual = scene.visual || {};

  const plan =
    visualPlan?.worldFoundation && Array.isArray(visualPlan?.assetCatalog)
      ? visualPlan
      : sanitizeVisualPlan(null, topic, [scene]);
  const wf = plan.worldFoundation;
  const catalog = plan.assetCatalog;

  const environment = ROOM_TO_ENV_FALLBACK[wf.roomType] || "studio_bench";
  const lightingMood =
    phase === "TAPI" && /overheat|api|bakar|panas ekstrem|meledak/.test(lower)
      ? "warm_alert"
      : /malam|padam|gelap/.test(lower)
      ? "night_dim"
      : wf.lightingPreset || "soft_daylight";

  // Build grounded persistent actors from the shared assetCatalog!
  const actors = [];
  const vfxSystems = [];

  const hostAsset = catalog.find((a) => a.prefab === "human_protagonist");
  const nonHostAssets = catalog.filter((a) => a.prefab !== "human_protagonist");
  const primaryContainer = nonHostAssets.find((a) => a.physicalRole === "container") || nonHostAssets[0] || null;

  if (hostAsset) {
    actors.push({
      id: hostAsset.id,
      assetId: hostAsset.id,
      prefab: "human_protagonist",
      label: hostAsset.name || "Ipul",
      color: hostAsset.color || "#0d9488",
      secondaryColor: hostAsset.secondaryColor || "#f59e0b",
      materialType: "matte_clay",
      placement: { on: "surface", x: -1.25, z: -0.78, yOffset: 0 },
      startPos: [-1.25, 0, -0.78],
      endPos: [-1.22, 0, -0.76],
      startRot: [0, 0.36, 0],
      endRot: [0, 0.28, 0],
      scale: hostAsset.defaultScale || 0.9,
      loopMotion: "none",
      enterStyle: "none",
      speed: 2.4,
      emissiveIntensity: 0,
      scriptAction: "rest",
      action: visual.workerAction || (phase === "TAPI" ? "panic" : phase === "CLIMAX" ? "celebrate" : "explain")
    });
  }

  // Deterministic grounded tabletop layout so props never collide or float!
  const layoutSlots = [
    [0.05, 0.12],
    [0.95, 0.08],
    [-0.75, 0.28],
    [0.72, -0.52],
    [-0.55, -0.45],
    [1.25, -0.35]
  ];

  const isPouring = /tuang|siram|masukkan|campur|tabur/.test(lower);
  const isStirring = /aduk|kocok|putar|ratakan|whisk|mixer/.test(lower);
  const isFrozen = /beku|keras|batu|kristal|freezer|es batu/.test(lower);
  const isCreamy = /lembut|creamy|jadi es krim|scoop|selamat/.test(lower) && /es krim/.test(`${topic} ${lower}`);
  const isCondensing = /embun|basah|kondensasi|tetes/.test(lower);
  const isMurky = /keruh|kotor|lumpur|bau|racun|amonia/.test(lower);
  const isBoiling = /panas|didih|rebus|kompor|goreng|masak/.test(lower);
  const isVibrating = /getar|bising|berisik|rusak|macet|goyang/.test(lower);

  nonHostAssets.slice(0, 6).forEach((asset, idx) => {
    const slot = layoutSlots[idx % layoutSlots.length];
    let placement = {
      on: asset.supportType === "floating" ? "floating" : "surface",
      x: slot[0],
      z: slot[1],
      yOffset: 0
    };
    let scriptAction = "rest";
    let loopMotion = "none";
    let liquidState = null;

    if (asset.prefab === "fish_arowana" || asset.prefab === "fish_betta" || asset.prefab === "stingray") {
      if (primaryContainer && primaryContainer.id !== asset.id) {
        placement = { on: `inside:${primaryContainer.id}`, x: 0, z: 0, yOffset: 0.25 };
      }
      loopMotion = "swim";
    } else if (asset.prefab === "whisk_spoon" && primaryContainer) {
      placement = isStirring
        ? { on: `inside:${primaryContainer.id}`, x: 0, z: 0, yOffset: 0.1 }
        : { on: "surface", x: 0.85, z: 0.42, yOffset: 0 };
      scriptAction = isStirring ? "stir_inside" : "rest";
    } else if (asset.prefab === "salt_shaker" && /garam|tabur|bubuk/.test(lower) && primaryContainer) {
      placement = { on: "surface", x: 0.72, z: 0.12, yOffset: 0 };
      scriptAction = "pour_into";
      vfxSystems.push({
        type: "pour_stream",
        origin: [0.46, 0.76, 0.12],
        target: [layoutSlots[0][0], 0.24, layoutSlots[0][1]],
        color: "#f8fafc",
        intensity: 0.8
      });
    } else if (asset.prefab === "jar_bottle" && /tuang|susu|air|siram|masukkan|campur/.test(lower) && !/garam/.test(lower) && primaryContainer) {
      placement = { on: "surface", x: 0.72, z: 0.12, yOffset: 0 };
      scriptAction = "pour_into";
      vfxSystems.push({
        type: "pour_stream",
        origin: [0.46, 0.76, 0.12],
        target: [layoutSlots[0][0], 0.24, layoutSlots[0][1]],
        color: asset.color || "#fef3c7",
        intensity: 0.85
      });
    } else if (asset.prefab === "stove_burner") {
      placement = { on: "surface", x: 0.05, z: 0.12, yOffset: 0 };
      scriptAction = isBoiling ? "heat_below" : "rest";
    } else if (asset.prefab === "cooking_pot" && nonHostAssets.some((a) => a.prefab === "stove_burner")) {
      const stove = nonHostAssets.find((a) => a.prefab === "stove_burner");
      placement = { on: `on_top:${stove.id}`, x: 0, z: 0, yOffset: 0 };
    } else if (asset.prefab === "glass_cup" && nonHostAssets.some((a) => a.prefab === "plate_dish")) {
      const plate = nonHostAssets.find((a) => a.prefab === "plate_dish");
      placement = { on: `on_top:${plate.id}`, x: 0, z: 0, yOffset: 0 };
    }

    // Dynamic container visual state synchronized literally to the script!
    if (
      asset.prefab === "hollow_bowl" ||
      asset.prefab === "ice_cream_bowl" ||
      asset.prefab === "glass_cup" ||
      asset.prefab === "cooking_pot" ||
      asset.prefab === "bucket_tub" ||
      asset.prefab === "glass_aquarium"
    ) {
      liquidState = {
        level: sceneIndex === 0 && !isPouring ? 0.45 : Math.min(0.85, 0.55 + sceneIndex * 0.06),
        color: isMurky
          ? "#78716c"
          : isFrozen
          ? "#bae6fd"
          : asset.secondaryColor || (asset.prefab === "glass_cup" ? "#bae6fd" : "#fef3c7"),
        frozen: isFrozen && !isCreamy,
        murky: isMurky,
        bubbles: isBoiling || /gelembung|aerator|oksigen|filter/.test(lower),
        condensation: isCondensing || (asset.prefab === "glass_cup" && isFrozen),
        scoops: isCreamy,
        iceCubes: isFrozen || /es batu|air es|dingin/.test(lower)
      };
    }

    if (isVibrating && (asset.physicalRole === "machine" || asset.physicalRole === "hero_subject")) {
      scriptAction = "vibrate_fault";
      loopMotion = "vibrate";
    } else if (
      (asset.prefab === "copper_stator_motor" || asset.prefab === "turbine_generator" || asset.prefab === "propeller_fan") &&
      !isVibrating
    ) {
      scriptAction = "spin_smooth";
    }

    const yBase = placement.on === "floating" ? 0.72 : 0;
    actors.push({
      id: asset.id,
      assetId: asset.id,
      prefab: asset.prefab,
      customRig: asset.customRig || null,
      label: asset.name,
      color: asset.color,
      secondaryColor: asset.secondaryColor,
      materialType: asset.materialType,
      placement,
      startPos: [placement.x, yBase, placement.z],
      endPos: [placement.x, yBase, placement.z],
      startRot: [0, idx === 0 ? -0.18 : 0.14, 0],
      endRot: [0, idx === 0 ? -0.06 : 0.14, 0],
      scale: asset.defaultScale || 1.0,
      loopMotion,
      enterStyle: sceneIndex === 0 ? "none" : idx === nonHostAssets.length - 1 ? "pop_bounce" : "none",
      speed: isVibrating ? 7.0 : 2.0,
      emissiveIntensity: 0,
      scriptAction,
      liquidState,
      action: visual.workerAction || "build"
    });
  });

  // STRICT minimal physical VFX ONLY when literally described by narration!
  if (isCondensing) {
    vfxSystems.push({
      type: "condensation_drops",
      origin: [0.05, 0.34, 0.12],
      color: "#e0f2fe",
      intensity: 0.85
    });
  }
  if (isBoiling) {
    vfxSystems.push({
      type: "steam_smoke",
      origin: [0.05, 0.56, 0.12],
      color: "#f8fafc",
      intensity: 0.65
    });
  }
  if (isFrozen && /es krim|garam|freezer|beku|es batu/.test(lower)) {
    vfxSystems.push({
      type: "frost_crystals",
      origin: [0.05, 0.48, 0.12],
      color: "#e0f2fe",
      intensity: 0.55
    });
  }
  if (isVibrating && /bising|berisik|suara|dB/.test(lower)) {
    vfxSystems.push({
      type: "sound_shockwave",
      origin: [0.05, 0.45, 0.12],
      color: "#ef4444",
      intensity: 0.7
    });
  }
  if (phase === "CLIMAX" && /selamat|berhasil|lembut|sempurna/.test(lower)) {
    vfxSystems.push({
      type: "gold_sparkles",
      origin: [0.05, 0.65, 0.12],
      color: "#fde047",
      intensity: 0.55
    });
  }

  // Calm, purposeful Blender-Diorama camera angles cycling smoothly across scenes
  const camShots = [
    // 0: Clean 3/4 Establishing Tabletop Shot
    { start: [0.55, 1.48, 3.65], mid: [0.35, 1.42, 3.42], end: [0.18, 1.38, 3.22], lookStart: [0.0, 0.38, 0.0], lookEnd: [0.05, 0.38, 0.05], fovStart: 42, fovEnd: 40, rollTilt: 0.0, handheldAmp: 0.003 },
    // 1: Slightly Elevated 40° Inspection (sees clearly INSIDE hollow bowls/pots!)
    { start: [-0.35, 1.65, 3.05], mid: [-0.12, 1.58, 2.88], end: [0.12, 1.52, 2.78], lookStart: [0.05, 0.34, 0.1], lookEnd: [0.05, 0.34, 0.1], fovStart: 41, fovEnd: 39, rollTilt: 0.0, handheldAmp: isVibrating ? 0.02 : 0.003 },
    // 2: Right-Side Detail Shot showing tools/ingredients interacting
    { start: [1.05, 1.32, 3.15], mid: [0.75, 1.35, 2.95], end: [0.48, 1.32, 2.82], lookStart: [0.15, 0.38, 0.08], lookEnd: [0.08, 0.36, 0.1], fovStart: 42, fovEnd: 40, rollTilt: 0.0, handheldAmp: 0.003 },
    // 3: Clean Hero Climax Framing
    { start: [-0.25, 1.35, 3.45], mid: [0.0, 1.32, 3.12], end: [0.15, 1.28, 2.88], lookStart: [0.05, 0.42, 0.05], lookEnd: [0.05, 0.42, 0.05], fovStart: 43, fovEnd: 39, rollTilt: 0.0, handheldAmp: 0.003 }
  ];
  const camBase = phase === "CLIMAX" ? camShots[3] : camShots[sceneIndex % camShots.length];

  return {
    engine: "gemini-cinema-3d",
    sceneNumber: scene.sceneNumber || sceneIndex + 1,
    lightingMood,
    environment,
    worldFoundation: wf,
    cinematicPrompt: `Clean Pixar / Blender Cycles 9:16 diorama of ${topic}: ${scene.componentLabel || phase}, ${wf.storySummary}`,
    cameraTrack: {
      ...camBase,
      transitionIn: sceneIndex === 0 ? "none" : "cross_dissolve"
    },
    optics: sanitizeOptics({ lensMm: 42, dofAperture: 0.18, dofFocusDist: 3.2, motionBlur: 0.05, springPhysics: false }, phase),
    motionField: sanitizeMotionField(
      isBoiling ? { type: "updraft_thermal", direction: [0, 0.45, 0], center: [0.05, 0.5, 0.1], strength: 0.4 } : null,
      phase
    ),
    actors: actors.map((a) => ({
      ...a,
      keyframes: sanitizeKeyframes(
        null,
        a.startPos || [0, 0, 0],
        a.endPos || a.startPos || [0, 0, 0],
        a.startRot || [0, 0, 0],
        a.endRot || a.startRot || [0, 0, 0],
        a.scale || 1.0
      )
    })),
    vfxSystems,
    colorGrade: {
      bloomStrength: 0.16,
      contrast: 1.05,
      saturation: 1.08,
      vignette: 0.13,
      tintHex: wf.colorPalette?.accent || "#38bdf8",
      lensFlare: false,
      speedLines: false
    }
  };
}

export function sanitizeCinemaBlueprint(raw, scene, topic, sceneIndex, totalScenes, visualPlan = null) {
  const fb = inferFallbackCinemaBlueprint(scene, topic, sceneIndex, totalScenes, visualPlan);
  if (!raw || typeof raw !== "object") return fb;

  const sceneText = `${scene?.componentLabel || ""} ${scene?.plainNarration || scene?.narration || ""}`;
  const allowSciFi = isSciFiTopic(`${topic} ${sceneText}`);
  const wf = visualPlan?.worldFoundation || fb.worldFoundation;

  let lightingMood = ALLOWED_MOODS.has(raw.lightingMood) ? raw.lightingMood : fb.lightingMood;
  // Never let a calm everyday room randomly flip into dark cyberpunk neon or red inferno!
  if (!allowSciFi && (lightingMood === "cyber_neon" || lightingMood === "cyber_dark")) {
    lightingMood = wf?.lightingPreset || fb.lightingMood;
  }
  if (
    (lightingMood === "inferno_alert" || lightingMood === "volcanic_forge") &&
    !/api|bakar|lava|magma|vulkanik|overheat|meledak|panas ekstrem|naga/.test(sceneText.toLowerCase())
  ) {
    lightingMood = wf?.lightingPreset || fb.lightingMood;
  }

  const environment = wf?.roomType
    ? ROOM_TO_ENV_FALLBACK[wf.roomType] || fb.environment
    : ALLOWED_ENVS.has(raw.environment)
    ? raw.environment
    : fb.environment;

  const rawCam = raw.cameraTrack || {};
  const isShakeJustified = /getar|gempa|ledak|guncang|tabrak|berisik|bising/.test(sceneText.toLowerCase());
  const cameraTrack = {
    start: sanitizeVec3(rawCam.start, fb.cameraTrack.start, 8),
    mid: sanitizeVec3(rawCam.mid, fb.cameraTrack.mid, 8),
    end: sanitizeVec3(rawCam.end, fb.cameraTrack.end, 8),
    lookStart: sanitizeVec3(rawCam.lookStart, fb.cameraTrack.lookStart, 3.5),
    lookEnd: sanitizeVec3(rawCam.lookEnd, fb.cameraTrack.lookEnd, 3.5),
    fovStart: clampNum(rawCam.fovStart, 34, 54, fb.cameraTrack.fovStart),
    fovEnd: clampNum(rawCam.fovEnd, 34, 54, fb.cameraTrack.fovEnd),
    rollTilt: clampNum(rawCam.rollTilt, -0.05, 0.05, 0.0),
    handheldAmp: clampNum(rawCam.handheldAmp, 0, isShakeJustified ? 0.035 : 0.008, fb.cameraTrack.handheldAmp),
    transitionIn: ALLOWED_TRANSITIONS.has(rawCam.transitionIn)
      ? !allowSciFi && rawCam.transitionIn === "flash_impact" && !isShakeJustified
        ? "cross_dissolve"
        : rawCam.transitionIn
      : fb.cameraTrack.transitionIn
  };
  // Keep camera comfortably in front & slightly above tabletop so props are never obstructed
  if (cameraTrack.start[2] < cameraTrack.lookStart[2] + 2.2) cameraTrack.start[2] = cameraTrack.lookStart[2] + 3.1;
  if (cameraTrack.mid[2] < cameraTrack.lookStart[2] + 2.0) cameraTrack.mid[2] = cameraTrack.lookStart[2] + 2.9;
  if (cameraTrack.end[2] < cameraTrack.lookEnd[2] + 2.0) cameraTrack.end[2] = cameraTrack.lookEnd[2] + 2.75;
  if (cameraTrack.start[1] < 0.75) cameraTrack.start[1] = 1.35;
  if (cameraTrack.mid[1] < 0.75) cameraTrack.mid[1] = 1.32;
  if (cameraTrack.end[1] < 0.75) cameraTrack.end[1] = 1.28;

  // Index persistent assetCatalog for consistent reuse across scenes
  const catalogMap = new Map();
  if (Array.isArray(visualPlan?.assetCatalog)) {
    for (const item of visualPlan.assetCatalog) {
      if (item?.id) catalogMap.set(item.id, item);
    }
  }

  const actors = Array.isArray(raw.actors)
    ? raw.actors
        .slice(0, 12)
        .filter((a) => a && typeof a === "object")
        .map((a, idx) => {
          const catItem = a.assetId && catalogMap.has(a.assetId) ? catalogMap.get(a.assetId) : catalogMap.get(a.id) || null;
          let rawPrefab = a.prefab || catItem?.prefab || "";
          if (!allowSciFi && SCIFI_ONLY_PREFABS.has(rawPrefab)) return null;

          let customRig = null;
          let prefab = rawPrefab;
          if (rawPrefab === "custom_rig") {
            customRig = sanitizeCustomRig(a.customRig) || catItem?.customRig || null;
            if (!customRig) return null;
            if (!allowSciFi) {
              customRig.parts = customRig.parts.map((pt) => ({
                ...pt,
                materialType: pt.materialType === "emissive_neon" ? "matte_clay" : pt.materialType,
                emissiveIntensity: Math.min(0.15, pt.emissiveIntensity || 0)
              }));
            }
          } else if (!ALLOWED_PREFABS_GROUNDED.has(rawPrefab)) {
            if (catItem && (catItem.prefab === "custom_rig" || ALLOWED_PREFABS_GROUNDED.has(catItem.prefab))) {
              prefab = catItem.prefab;
              customRig = catItem.customRig || null;
            } else {
              return null;
            }
          }

          let materialType = ALLOWED_MATERIALS.has(a.materialType)
            ? a.materialType
            : catItem?.materialType || "matte_clay";
          if (!allowSciFi && materialType === "emissive_neon") materialType = "glossy_plastic";

          const placement = sanitizePlacement(a.placement, { ...a, prefab });
          const startPos = sanitizeVec3(a.startPos || a.pos, [placement.x, placement.on === "floating" ? 0.72 : 0, placement.z], 5);
          const endPos = sanitizeVec3(a.endPos || a.startPos || a.pos, startPos, 5);
          // Grounded non-floating actors stay anchored to surface coordinates (X/Z from placement if provided)
          if (a.placement && placement.on !== "floating") {
            startPos[0] = placement.x;
            startPos[2] = placement.z;
            if (!a.endPos) {
              endPos[0] = placement.x;
              endPos[2] = placement.z;
            }
          }
          const startRot = sanitizeVec3(a.startRot || a.rot, [0, 0, 0], 6.3);
          const endRot = sanitizeVec3(a.endRot || a.startRot || a.rot, startRot, 6.3);
          const scale = clampNum(a.scale, 0.3, 1.9, catItem?.defaultScale || 1.0);

          let loopMotion = ALLOWED_MOTIONS.has(a.loopMotion) ? a.loopMotion : "none";
          // Never make solid bowls, tables, cups, pots hover or pulsate randomly!
          if (RIGID_GROUNDED_PREFABS.has(prefab) && (loopMotion === "hover" || loopMotion === "pulse" || loopMotion === "breathe" || loopMotion === "orbit")) {
            loopMotion = "none";
          }

          const scriptAction = ALLOWED_SCRIPT_ACTIONS.has(a.scriptAction) ? a.scriptAction : "rest";
          const liquidState = sanitizeLiquidState(a.liquidState);

          return {
            id: String(a.id || catItem?.id || `actor_${idx}`).slice(0, 32),
            assetId: catItem?.id || (a.assetId ? String(a.assetId).slice(0, 32) : null),
            prefab,
            customRig,
            label: String(a.label || catItem?.name || "").slice(0, 32),
            color: sanitizeHex(a.color, catItem?.color || "#cbd5e1"),
            secondaryColor: sanitizeHex(a.secondaryColor, catItem?.secondaryColor || "#94a3b8"),
            materialType,
            placement,
            startPos,
            endPos,
            startRot,
            endRot,
            scale,
            keyframes: sanitizeKeyframes(a.keyframes, startPos, endPos, startRot, endRot, scale),
            from: a.from ? sanitizeVec3(a.from, [-0.6, 0.4, 0], 6) : null,
            to: a.to ? sanitizeVec3(a.to, [0.6, 0.4, 0], 6) : null,
            loopMotion,
            enterStyle: ALLOWED_ENTERS.has(a.enterStyle) ? a.enterStyle : "none",
            speed: clampNum(a.speed, 0.2, 12, 2.2),
            emissiveIntensity: allowSciFi ? clampNum(a.emissiveIntensity, 0, 1.5, 0.1) : clampNum(a.emissiveIntensity, 0, 0.2, 0.0),
            scriptAction,
            liquidState,
            action: String(a.action || scene?.visual?.workerAction || "explain").slice(0, 24)
          };
        })
        .filter(Boolean)
    : [];

  const finalActors = (actors.length >= 2 ? actors : fb.actors).map((a) => ({
    ...a,
    placement: sanitizePlacement(a.placement, a),
    keyframes:
      a.keyframes ||
      sanitizeKeyframes(null, a.startPos || [0, 0, 0], a.endPos || [0, 0, 0], a.startRot || [0, 0, 0], a.endRot || [0, 0, 0], a.scale || 1)
  }));

  const phase = scene?.phase || "HOOK";

  // Strict Anti-Excess VFX filtering: keep ONLY physically justified VFX (empty [] is completely fine & clean!)
  const rawVfx = Array.isArray(raw.vfxSystems)
    ? raw.vfxSystems
        .slice(0, 4)
        .filter(
          (v) =>
            v &&
            typeof v === "object" &&
            ALLOWED_VFX.has(v.type) &&
            isVfxJustifiedForScene(v.type, sceneText, topic, phase)
        )
        .map((v) => ({
          type: v.type,
          origin: sanitizeVec3(v.origin, [0.05, 0.55, 0.1], 5),
          target: v.target ? sanitizeVec3(v.target, [0.05, 0.25, 0.1], 5) : null,
          color: sanitizeHex(v.color, "#e0f2fe"),
          intensity: clampNum(v.intensity, 0.2, 1.15, 0.7)
        }))
    : [];

  const finalVfx = rawVfx.length ? rawVfx : fb.vfxSystems;

  const rawGrade = raw.colorGrade || {};
  const maxBloom = allowSciFi ? 0.75 : 0.34;
  const colorGrade = {
    bloomStrength: clampNum(rawGrade.bloomStrength, 0.06, maxBloom, fb.colorGrade.bloomStrength),
    contrast: clampNum(rawGrade.contrast, 0.96, 1.16, fb.colorGrade.contrast),
    saturation: clampNum(rawGrade.saturation, 0.92, 1.22, fb.colorGrade.saturation),
    vignette: clampNum(rawGrade.vignette, 0.06, 0.28, fb.colorGrade.vignette),
    tintHex: sanitizeHex(rawGrade.tintHex, fb.colorGrade.tintHex),
    lensFlare: allowSciFi ? Boolean(rawGrade.lensFlare) : false,
    speedLines: false
  };

  const optics = sanitizeOptics(raw.optics, phase);
  const motionField = finalVfx.length ? sanitizeMotionField(raw.motionField, phase) : sanitizeMotionField(null, phase);

  return {
    engine: "gemini-cinema-3d",
    sceneNumber: scene?.sceneNumber || sceneIndex + 1,
    lightingMood,
    environment,
    worldFoundation: wf,
    cinematicPrompt: String(raw.cinematicPrompt || fb.cinematicPrompt).slice(0, 340),
    cameraTrack,
    optics,
    motionField,
    actors: finalActors,
    vfxSystems: finalVfx,
    colorGrade
  };
}

// Optional: Try Gemini Nano Banana Native Image-to-Video Dual Keyframes if user has billed Gemini Image quota
async function tryRenderNanoBananaKeyframes({ apiKey, prompt, phase, referenceBase64 = null }) {
  const key = cleanKey(apiKey);
  if (!key) return null;

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const parts = [];
      if (referenceBase64) {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: referenceBase64 } });
      }
      parts.push({
        text: `${prompt}. Clean grounded 3D Pixar / Blender Cycles miniature diorama frame, vertical 9:16 framing, natural daylight lighting, physically grounded objects resting on table/counter, crystal clear educational readability, NO random neon clutter, NO text, NO watermark. Mood: ${phase}.`
      });

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              responseModalities: ["IMAGE"],
              imageConfig: { aspectRatio: "9:16" }
            }
          }),
          signal: AbortSignal.timeout(24000)
        }
      );

      if (!resp.ok) {
        if (resp.status === 429 || resp.status === 403) return null;
        continue;
      }

      const data = await resp.json();
      const imgPart = (data?.candidates?.[0]?.content?.parts || []).find((p) => p?.inlineData?.data);
      if (imgPart?.inlineData?.data) {
        return {
          model,
          mimeType: imgPart.inlineData.mimeType || "image/png",
          data: imgPart.inlineData.data
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

const GEMINI_CINEMA_DIRECTOR_PROMPT = `Kamu adalah "Gemini 3D Diorama Director" — Sutradara Animasi 3D Edukasi Terstruktur bergaya PIXAR / BLENDER CYCLES (@untabiru5 x @dekodaid x @belajar.iai)!
Tugasmu adalah menyusun KOREOGRAFI 3D yang **100% NYAMBUNG DENGAN NASKAH**, **KONSISTEN ANTAR SCENE**, **BERTUMPU FISIK NYATA**, dan **BERSIH TANPA EFEK BERLEBIHAN / ANEH**!

ATURAN EMAS (WAJIB DIPATUHI!):
1. KUNCI SATU DUNIA ("worldFoundation"):
   - Semua scene HARUS berlangsung di ruangan/meja/dinding yang SAMA persis sesuai worldFoundation yang sudah diriset! JANGAN ganti-ganti lokasi atau tiba-tiba jadi ruang cyber neon!
   - Gunakan "lightingMood" yang SAMA dengan worldFoundation.lightingPreset (misal "warm_kitchen", "soft_daylight", "clean_workshop", "outdoor_sunlight", "cozy_indoor", "cool_lab"). Hanya geser ke "warm_alert" jika narasi benar-benar menyebut overheat/kebakaran, atau "night_dim" jika menyebut malam/listrik padam.
2. PAKAI ULANG ASET PERSISTEN ("assetId" dari assetCatalog):
   - Di setiap scene, tampilkan **3 sampai 6 aktor** yang berasal dari "assetCatalog" (gunakan "assetId" yang persis sama!).
   - Terapkan **KOREOGRAFI KUMULATIF**: benda utama (misal mangkuk, gelas, meja, tangki, mesin) TETAP ADA di posisi logis yang sama dari Scene 1 hingga selesai, sementara bahan/alat baru muncul bertahap tepat saat narasi menyebutkannya!
3. PENUMPUAN FISIK NYATA ("placement" — DILARANG MELAYANG!):
   - Setiap aktor WAJIB punya field "placement":
     • { "on": "surface", "x": 0.05, "z": 0.12, "yOffset": 0 } -> menempel rata di atas meja / konter / lantai!
     • { "on": "on_top:<id_aktor_bawah>", "x": 0, "z": 0, "yOffset": 0 } -> bertumpu rapi di atas talenan, piring, atau kompor!
     • { "on": "inside:<id_wadah>", "x": 0, "z": 0, "yOffset": 0.08 } -> berada di DALAM mangkuk cekung / panci / akuarium (misal sendok mengaduk, ikan berenang)!
     • { "on": "floating", "x": 0, "z": 0, "yOffset": 0 } -> HANYA untuk roket/pesawat terbang/burung/drone!
   - Benda padat (mangkuk, gelas, panci, meja, mesin) WAJIB "loopMotion": "none" (JANGAN hover/pulse melayang-layang aneh!).
4. AKSI HARFIAH & ISI WADAH SESUAI NASKAH ("scriptAction" & "liquidState"):
   - "scriptAction": "rest" | "pour_into" (botol/wadah miring menuang ke mangkuk/gelas!) | "stir_inside" (sendok/whisk mengaduk memutar di dalam mangkuk!) | "heat_below" (kompor menyala kecil di bawah panci!) | "vibrate_fault" (mesin bergetar saat error/berisik!) | "spin_smooth" (motor/kipas berputar mulus!) | "assemble_drop" (komponen turun terpasang rapi!) | "celebrate_bounce".
   - Untuk wadah berongga ("hollow_bowl", "glass_cup", "cooking_pot", "bucket_tub", "ice_cream_bowl", "glass_aquarium"), isi "liquidState" agar perubahan fisiknya TERLIHAT JELAS sesuai naskah:
     { "level": 0.0..0.9, "color": "#fef3c7", "frozen": false, "murky": false, "bubbles": false, "condensation": false, "scoops": false, "iceCubes": false }
     Contoh: Scene 1 tuang susu -> level 0.45; Scene 2 beku jadi batu -> frozen: true; Scene 4 diaduk lembut -> frozen: false, scoops: true! Atau gelas es -> iceCubes: true, condensation: true!
5. ANTI-EFEK BERLEBIHAN (DISIPLIN KETAT!):
   - DEFAULT "vfxSystems": [] (KOSONG lebih bersih & jelas daripada efek ramai yang tidak nyambung!).
   - DILARANG menambahkan "hologram_ring", "neon_tube", "god_rays", "fire_flames", "electric_arcs", "lensFlare": true, atau "speedLines": true kecuali narasi scene benar-benar membahas hal itu!
   - Boleh tambahkan maks 1-2 VFX fisik yang HARFIAH sesuai narasi:
     • "pour_stream" (isi "origin" di mulut botol & "target" di dalam mangkuk/gelas) -> saat menuang susu/air/garam!
     • "condensation_drops" -> saat narasi membahas gelas dingin berembun/basah!
     • "steam_smoke" -> saat memasak/mendidih/uap panas/overheat!
     • "bubbles_rise" -> saat air mendidih/akuarium/aerator!
     • "frost_crystals" -> saat es/garam/freezer membekukan adonan!
     • "fire_flames" -> HANYA saat kompor menyala/api/lava/roket!
     • "sound_shockwave" -> HANYA saat narasi membahas suara bising/getaran!
     • "energy_flow" -> HANYA aliran pipa/listrik yang terhubung!
     • "gold_sparkles" -> HANYA tipis di CLIMAX keberhasilan!
   - Jaga "colorGrade": { "bloomStrength": 0.14..0.24, "contrast": 1.05, "saturation": 1.08, "vignette": 0.12, "lensFlare": false, "speedLines": false } agar warna meja, dinding, dan mangkuk bersih, cerah, dan tajam!

Kembalikan HANYA JSON valid:
{
  "directorNotes": "Ringkasan bagaimana animasi menjaga kontinuitas satu ruangan & alur cerita",
  "scenes": [
    {
      "sceneNumber": 1,
      "lightingMood": "warm_kitchen",
      "cinematicPrompt": "Clean Pixar/Blender Cycles 9:16 kitchen countertop diorama...",
      "cameraTrack": {
        "start": [0.55, 1.48, 3.6],
        "mid": [0.3, 1.44, 3.35],
        "end": [0.1, 1.4, 3.15],
        "lookStart": [0.05, 0.36, 0.08],
        "lookEnd": [0.05, 0.36, 0.08],
        "fovStart": 42,
        "fovEnd": 40,
        "rollTilt": 0.0,
        "handheldAmp": 0.003,
        "transitionIn": "none"
      },
      "optics": { "lensMm": 42, "dofAperture": 0.18, "dofFocusDist": 3.2, "motionBlur": 0.05, "springPhysics": false },
      "motionField": { "type": "none", "direction": [0, 0, 0], "center": [0, 0.5, 0], "strength": 0 },
      "actors": [
        {
          "id": "ipul_host",
          "assetId": "ipul_host",
          "prefab": "human_protagonist",
          "label": "Ipul",
          "placement": { "on": "surface", "x": -1.25, "z": -0.78, "yOffset": 0 },
          "startRot": [0, 0.35, 0],
          "endRot": [0, 0.28, 0],
          "scale": 0.9,
          "loopMotion": "none",
          "enterStyle": "none",
          "scriptAction": "rest",
          "action": "pour"
        },
        {
          "id": "mangkuk_adonan",
          "assetId": "mangkuk_adonan",
          "prefab": "hollow_bowl",
          "label": "Mangkuk Stainless",
          "placement": { "on": "surface", "x": 0.05, "z": 0.12, "yOffset": 0 },
          "scale": 1.05,
          "loopMotion": "none",
          "enterStyle": "none",
          "scriptAction": "rest",
          "liquidState": { "level": 0.5, "color": "#fef3c7", "frozen": false, "iceCubes": false, "condensation": false, "scoops": false }
        }
      ],
      "vfxSystems": [],
      "colorGrade": {
        "bloomStrength": 0.16,
        "contrast": 1.05,
        "saturation": 1.08,
        "vignette": 0.13,
        "tintHex": "#38bdf8",
        "lensFlare": false,
        "speedLines": false
      }
    }
  ]
}`;

export async function compileGeminiCinemaVideo({
  topic = "",
  title = "",
  scenes = [],
  visualPlan = null,
  geminiApiKey = "",
  enableKeyframes = false,
  enableCustomRigs = true,
  styleMemoryHints = []
}) {
  if (!Array.isArray(scenes) || !scenes.length) {
    throw new Error("Daftar scene kosong untuk dirender oleh Gemini Cinema.");
  }

  const candidateKeys = collectGeminiKeys(geminiApiKey);

  // Stage 0: Ensure grounded visual research & locked worldFoundation exist
  const resolvedVisualPlan =
    visualPlan && visualPlan.worldFoundation && Array.isArray(visualPlan.assetCatalog)
      ? sanitizeVisualPlan(visualPlan, topic || title, scenes, {
          references: visualPlan.visualReferences || [],
          formNotes: visualPlan.formNotes || []
        })
      : await researchAndPlanVisualWorld({
          topic: topic || title,
          title: title || topic,
          scenes,
          geminiApiKey
        });

  const compactScenes = scenes.map((s, idx) => ({
    sceneNumber: s.sceneNumber || idx + 1,
    phase: s.phase || "HOOK",
    componentLabel: s.componentLabel || "",
    narration: s.plainNarration || s.narration || "",
    workerAction: s.visual?.workerAction || "",
    problemVisual: s.visual?.problemVisual || "none",
    solutionVisual: s.visual?.solutionVisual || "none"
  }));

  const fullSystemPrompt = [
    GEMINI_CINEMA_DIRECTOR_PROMPT,
    enableCustomRigs ? buildCustomRigPromptSpec() : "",
    buildKlingCinematographyAddendum(styleMemoryHints)
  ]
    .filter(Boolean)
    .join("\n\n");

  const userPrompt = `TOPIK VIDEO: "${topic || title}"
JUDUL: "${title || topic}"
JUMLAH SCENE: ${compactScenes.length}

FONDASI RUANGAN & MEJA/DINDING TERKUNCI (WAJIB SAMA DI SEMUA SCENE!):
${JSON.stringify(resolvedVisualPlan.worldFoundation, null, 2)}

KATALOG ASET 3D PERSISTEN (GUNAKAN "assetId" YANG SAMA AGAR BENDA NYAMBUNG ANTAR SCENE!):
${JSON.stringify(
  resolvedVisualPlan.assetCatalog.map((a) => ({
    id: a.id,
    name: a.name,
    prefab: a.prefab,
    color: a.color,
    secondaryColor: a.secondaryColor,
    materialType: a.materialType,
    defaultScale: a.defaultScale,
    supportType: a.supportType,
    physicalRole: a.physicalRole,
    visualNotes: a.visualNotes
  })),
  null,
  2
)}

NASKAH LENGKAP SEMUA ${compactScenes.length} SCENE:
${JSON.stringify(compactScenes, null, 2)}

Susun koreografi 3D kumulatif, terstruktur, bersih, dan 100% sesuai narasi untuk TEPAT ${compactScenes.length} scene (sceneNumber 1..${compactScenes.length})!`;

  const llmRes = await callGeminiJson({
    geminiApiKey,
    systemInstruction: fullSystemPrompt,
    userPrompt,
    temperature: 0.48,
    maxOutputTokens: 16384,
    timeoutMs: 28000,
    models: GEMINI_CINEMA_MODELS
  });

  const parsed = llmRes.ok && Array.isArray(llmRes.data?.scenes) && llmRes.data.scenes.length > 0 ? llmRes.data : null;
  const usedModel = parsed ? llmRes.model : null;
  const lastError = parsed ? null : llmRes.error;

  const rawMap = new Map();
  if (parsed?.scenes) {
    parsed.scenes.forEach((sc, i) => {
      rawMap.set(Number(sc.sceneNumber || i + 1), sc);
    });
  }

  const blueprints = scenes.map((sc, idx) => {
    const num = sc.sceneNumber || idx + 1;
    const rawBp = rawMap.get(num) || parsed?.scenes?.[idx] || null;
    return sanitizeCinemaBlueprint(rawBp, sc, topic || title, idx, scenes.length, resolvedVisualPlan);
  });

  const customRigCount = blueprints.reduce(
    (sum, bp) => sum + (bp.actors || []).filter((a) => a.prefab === "custom_rig" && a.customRig).length,
    0
  );

  // Optional Nano Banana AI Keyframe upgrade (only runs if explicitly requested & key has active image quota)
  let keyframeCount = 0;
  let imageModelUsed = null;
  if (enableKeyframes && candidateKeys.length) {
    let prevBase64 = null;
    for (let i = 0; i < blueprints.length; i++) {
      const bp = blueprints[i];
      const kf = await tryRenderNanoBananaKeyframes({
        apiKey: candidateKeys[0],
        prompt: bp.cinematicPrompt,
        phase: scenes[i]?.phase || "HOOK",
        referenceBase64: prevBase64
      });
      if (!kf) break;
      bp.aiKeyframe = {
        mimeType: kf.mimeType,
        dataUrl: `data:${kf.mimeType};base64,${kf.data}`
      };
      bp.engine = "gemini-nano-banana-cinema";
      imageModelUsed = kf.model;
      keyframeCount++;
      prevBase64 = kf.data;
    }
  }

  return {
    ok: true,
    directorModel: usedModel || "grounded-diorama-fallback",
    researchModel: resolvedVisualPlan.researchModel || visualPlan?.researchModel || "grounded-architect",
    imageModel: imageModelUsed,
    keyframeCount,
    customRigCount,
    directorNotes:
      parsed?.directorNotes ||
      resolvedVisualPlan.worldFoundation?.storySummary ||
      "Animasi 3D diorama terstruktur, konsisten satu lokasi, dan bersih sesuai naskah.",
    worldFoundation: resolvedVisualPlan.worldFoundation,
    assetCatalog: resolvedVisualPlan.assetCatalog,
    visualReferences: resolvedVisualPlan.visualReferences || [],
    scenes: blueprints,
    warning: usedModel ? null : lastError
  };
}
