// MaouEdu Gemini Cinema Video Renderer (Backend AI Director + Multi-Scene Animation Compiler)
// Powers Kling-class cinematic 3D PBR/Shader animation & optional Nano Banana AI Keyframe rendering
// using the user's configured Gemini models (gemini-3-flash-preview, gemini-3.5-flash-lite, gemini-3.1-flash-lite, etc.)

function cleanKey(raw = "") {
  return String(raw || "")
    .trim()
    .replace(/^[A-Z0-9_]+=/, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

export const GEMINI_CINEMA_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest"
];

export const GEMINI_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-nano-banana-2.1",
  "gemini-3.1-flash-lite-image",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image"
];

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

const ALLOWED_PREFABS = new Set([
  "human_protagonist",
  "fish_arowana",
  "fish_betta",
  "stingray",
  "bird_eagle",
  "drone_quad",
  "robot_arm",
  "car_sports",
  "rocket_ship",
  "aircraft_jet",
  "submarine",
  "ship_vessel",
  "glass_aquarium",
  "filter_sump",
  "turbine_generator",
  "asic_miner",
  "copper_stator_motor",
  "battery_reactor",
  "solar_array",
  "ac_compressor",
  "boiler_furnace",
  "microscope_lab",
  "server_rack",
  "crystal_core",
  "thermal_plates",
  "volcano_peak",
  "ice_cream_bowl",
  "coffee_espresso",
  "cooking_pot",
  "chemistry_flask",
  "rebar_structure",
  "tree_lush",
  "palm_tree",
  "mountain_peak",
  "crystal_cluster",
  "hologram_ring",
  "neon_tube",
  "pipe_curved",
  "wire_arc",
  "water_surface",
  "magma_pool",
  "bevel_chassis",
  "metallic_cylinder",
  "energy_sphere",
  "gear_wheel",
  "propeller_fan",
  "helix_coil"
]);

const ALLOWED_MATERIALS = new Set([
  "metal_chrome",
  "brushed_steel",
  "glass_crystal",
  "water_clear",
  "emissive_neon",
  "matte_clay",
  "glossy_plastic",
  "wood_oak",
  "ceramic",
  "magma_glow",
  "ice_translucent",
  "gold_luxury"
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

const ALLOWED_TRANSITIONS = new Set([
  "zoom_through",
  "whip_pan",
  "flash_impact",
  "cross_dissolve",
  "none"
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

function sanitizeHex(hex, fallback = "#38bdf8") {
  if (typeof hex !== "string") return fallback;
  const s = hex.trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

export function inferFallbackCinemaBlueprint(scene = {}, topic = "", sceneIndex = 0, totalScenes = 6) {
  const phase = scene.phase || (sceneIndex === 0 ? "HOOK" : sceneIndex === totalScenes - 1 ? "CLIMAX" : "JADI");
  const text = `${topic} ${scene.componentLabel || ""} ${scene.narration || ""}`.toLowerCase();
  const visual = scene.visual || {};
  const hero = visual.heroObject || "custom_stage";

  let environment = "studio_bench";
  let lightingMood =
    phase === "TAPI" ? "inferno_alert" : phase === "CLIMAX" ? "emerald_victory" : phase === "HOOK" ? "pixar_golden" : "unreal_studio";

  if (/roket|antariksa|planet|bulan|mars|orbit|satelit|bintang|astronot/.test(text)) {
    environment = "space_orbit";
    lightingMood = phase === "TAPI" ? "inferno_alert" : "cyber_neon";
  } else if (/pesawat|jet|sr-71|bandara|terbang|supersonik|turbin pesawat/.test(text) || hero === "supersonic_jet") {
    environment = "runway_tarmac";
    lightingMood = phase === "TAPI" ? "inferno_alert" : "pixar_golden";
  } else if (/laut|samudra|selam|kapal selam|hiu|paus|terumbu|bawah laut/.test(text)) {
    environment = "deep_underwater";
    lightingMood = "deep_ocean";
  } else if (/gunung berapi|lava|magma|vulkanik|letusan|erupsi/.test(text)) {
    environment = "volcanic_terrain";
    lightingMood = "volcanic_forge";
  } else if (/es\b|salju|kutub|beku|es krim|freezer|kulkas|pendingin|ac\b/.test(text) || hero === "ice_cream") {
    environment = hero === "ice_cream" || /dapur|masak|kopi|es krim|resep/.test(text) ? "kitchen_cinema" : "arctic_glacier";
    lightingMood = phase === "TAPI" ? "inferno_alert" : "arctic_ice";
  } else if (/bitcoin|bunker|rumah|pltu|tambang/.test(text) || hero === "bitcoin_bunker") {
    environment = "house_cutaway";
    lightingMood = phase === "TAPI" ? "inferno_alert" : phase === "JADI" ? "cyber_neon" : "pixar_golden";
  } else if (/kolam|pari|arwana|ikan|akuarium|cupang|filter/.test(text) || hero === "stingray_pond" || hero === "arowana_fish" || hero === "betta_fish") {
    environment = /akuarium|cupang/.test(text) ? "studio_bench" : "backyard_pond";
    lightingMood = phase === "TAPI" ? "inferno_alert" : "deep_ocean";
  } else if (/sawah|padi|petani|minapadi|irigasi|hutan|pohon/.test(text) || hero === "rice_fish") {
    environment = "sawah_valley";
    lightingMood = "pixar_golden";
  } else if (/kopi|masak|goreng|rebus|dapur|kue|roti|coklat/.test(text)) {
    environment = "kitchen_cinema";
    lightingMood = "pixar_golden";
  } else if (/mobil|motor|balap|kereta|jalan|kota|gedung/.test(text)) {
    environment = "city_street";
    lightingMood = phase === "TAPI" ? "inferno_alert" : "cyber_neon";
  } else if (/pabrik|mesin|robot|baja|turbin|listrik|baterai|chip|ai|komputer|server/.test(text)) {
    environment = "sci_fi_lab";
    lightingMood = phase === "TAPI" ? "inferno_alert" : "cyber_neon";
  }

  // Build expressive rich multi-actor cinematic stage from context + existing stage3d objects
  const actors = [];
  const vfxSystems = [];

  // Protagonist hero actor with expressive pose
  actors.push({
    id: "protagonist",
    prefab: "human_protagonist",
    label: "Ipul",
    color: "#0d9488",
    secondaryColor: "#f59e0b",
    materialType: "matte_clay",
    startPos: [-1.15, 0, -0.55],
    endPos: phase === "CLIMAX" ? [-0.95, 0.08, -0.45] : [-1.08, 0, -0.52],
    startRot: [0, 0.38, 0],
    endRot: [0, 0.25, 0],
    scale: 1.0,
    loopMotion: phase === "TAPI" ? "shake" : phase === "CLIMAX" ? "hover" : "breathe",
    enterStyle: "none",
    speed: 3.2,
    action: visual.workerAction || (phase === "TAPI" ? "panic" : phase === "CLIMAX" ? "celebrate" : "build")
  });

  // Hero topic subject
  let heroPrefab = "crystal_core";
  let heroMat = "metal_chrome";
  let heroColor = visual.accentColor || "#38bdf8";
  if (/roket/.test(text)) { heroPrefab = "rocket_ship"; heroMat = "brushed_steel"; heroColor = "#f8fafc"; }
  else if (/pesawat|jet|sr-71/.test(text)) { heroPrefab = "aircraft_jet"; heroMat = "brushed_steel"; heroColor = "#1e293b"; }
  else if (/kapal selam/.test(text)) { heroPrefab = "submarine"; heroMat = "brushed_steel"; heroColor = "#eab308"; }
  else if (/mobil|balap|f1/.test(text)) { heroPrefab = "car_sports"; heroMat = "glossy_plastic"; heroColor = "#ef4444"; }
  else if (/gunung|lava|magma/.test(text)) { heroPrefab = "volcano_peak"; heroMat = "magma_glow"; heroColor = "#7c2d12"; }
  else if (/es krim/.test(text)) { heroPrefab = "ice_cream_bowl"; heroMat = "ceramic"; heroColor = "#f472b6"; }
  else if (/kopi|espresso/.test(text)) { heroPrefab = "coffee_espresso"; heroMat = "ceramic"; heroColor = "#92400e"; }
  else if (/kipas|dinamo|motor listrik|stator/.test(text)) { heroPrefab = "copper_stator_motor"; heroMat = "metal_chrome"; heroColor = "#d97706"; }
  else if (/baterai|lithium|energi|reaktor/.test(text)) { heroPrefab = "battery_reactor"; heroMat = "glass_crystal"; heroColor = "#10b981"; }
  else if (/turbin|pltu|pembangkit/.test(text)) { heroPrefab = "turbine_generator"; heroMat = "brushed_steel"; heroColor = "#38bdf8"; }
  else if (/bitcoin|mining|server|ai|komputer/.test(text)) { heroPrefab = "asic_miner"; heroMat = "brushed_steel"; heroColor = "#334155"; }
  else if (/pari/.test(text)) { heroPrefab = "stingray"; heroMat = "glossy_plastic"; heroColor = "#334155"; }
  else if (/arwana/.test(text)) { heroPrefab = "fish_arowana"; heroMat = "gold_luxury"; heroColor = "#ef4444"; }
  else if (/cupang|akuarium/.test(text)) { heroPrefab = "glass_aquarium"; heroMat = "glass_crystal"; heroColor = "#38bdf8"; }
  else if (/drone/.test(text)) { heroPrefab = "drone_quad"; heroMat = "metal_chrome"; heroColor = "#0ea5e9"; }
  else if (/robot/.test(text)) { heroPrefab = "robot_arm"; heroMat = "metal_chrome"; heroColor = "#f59e0b"; }
  else if (/ac\b|pendingin|kulkas/.test(text)) { heroPrefab = "ac_compressor"; heroMat = "glossy_plastic"; heroColor = "#e2e8f0"; }
  else if (/surya|solar/.test(text)) { heroPrefab = "solar_array"; heroMat = "glass_crystal"; heroColor = "#1d4ed8"; }

  actors.push({
    id: "hero_main",
    prefab: heroPrefab,
    label: scene.componentLabel || topic,
    color: heroColor,
    secondaryColor: phase === "TAPI" ? "#ef4444" : "#fbbf24",
    materialType: heroMat,
    startPos: [0.15, 0.58, 0.0],
    endPos: phase === "CLIMAX" ? [0.15, 0.72, 0.12] : [0.15, 0.62, 0.05],
    startRot: [0, -0.35, 0],
    endRot: [0, 0.35, 0],
    scale: 1.18,
    loopMotion:
      heroPrefab === "fish_arowana" || heroPrefab === "stingray"
        ? "swim"
        : phase === "TAPI"
        ? "vibrate"
        : heroPrefab === "drone_quad" || heroPrefab === "rocket_ship" || heroPrefab === "crystal_core"
        ? "hover"
        : "pulse",
    enterStyle: sceneIndex === 0 ? "pop_bounce" : "emerge_up",
    speed: phase === "TAPI" ? 7.5 : 2.6,
    emissiveIntensity: phase === "TAPI" || phase === "CLIMAX" ? 0.55 : 0.22
  });

  // Secondary cinematic machinery / hologram ring / accent
  actors.push({
    id: "holo_accent",
    prefab: "hologram_ring",
    label: "Energy Aura",
    color: phase === "TAPI" ? "#ef4444" : phase === "CLIMAX" ? "#10b981" : "#38bdf8",
    secondaryColor: "#fbbf24",
    materialType: "emissive_neon",
    startPos: [0.15, 0.62, 0.0],
    endPos: [0.15, 0.68, 0.0],
    startRot: [0.35, 0, 0],
    endRot: [0.35, 3.14, 0],
    scale: 1.15,
    loopMotion: "spin_y",
    enterStyle: "pop_bounce",
    speed: 1.6,
    emissiveIntensity: 0.9
  });

  // Map existing stage3d objects if present so nothing gets lost
  const legacyObjs = Array.isArray(visual?.stage3d?.objects) ? visual.stage3d.objects : [];
  legacyObjs.slice(0, 8).forEach((o, i) => {
    if (o.kind === "flow" && Array.isArray(o.from) && Array.isArray(o.to)) {
      vfxSystems.push({
        type: "energy_flow",
        origin: o.from,
        target: o.to,
        color: sanitizeHex(o.color, "#38bdf8"),
        intensity: 1.0
      });
      return;
    }
    if (o.kind === "particles") {
      const mapP = {
        sparks: "electric_arcs",
        smoke: "steam_smoke",
        steam: "steam_smoke",
        bubbles: "bubbles_rise",
        frost: "frost_crystals",
        flame: "fire_flames",
        confetti: "gold_sparkles"
      };
      vfxSystems.push({
        type: mapP[o.type] || "gold_sparkles",
        origin: [o.x || 0, o.y || 0.6, o.z || 0],
        color: sanitizeHex(o.color, "#fbbf24"),
        intensity: 1.0
      });
      return;
    }
    if (o.kind === "pipe" || o.kind === "wire_cable") {
      actors.push({
        id: `link_${i}`,
        prefab: o.kind === "pipe" ? "pipe_curved" : "wire_arc",
        color: sanitizeHex(o.color, "#38bdf8"),
        materialType: o.glow ? "emissive_neon" : "brushed_steel",
        from: sanitizeVec3(o.from, [-0.5, 0.4, 0]),
        to: sanitizeVec3(o.to, [0.5, 0.4, 0]),
        scale: 1.0,
        loopMotion: "none",
        enterStyle: "pop_bounce",
        emissiveIntensity: o.glow ? 0.8 : 0.1
      });
    }
  });

  // Always add rich Kling-class volumetric VFX!
  vfxSystems.push({
    type: "god_rays",
    origin: [0.6, 2.8, -1.2],
    color: phase === "TAPI" ? "#fb7185" : phase === "CLIMAX" ? "#fde047" : "#fffbeb",
    intensity: 0.78
  });

  if (phase === "TAPI") {
    vfxSystems.push(
      { type: "sound_shockwave", origin: [0.15, 0.68, 0.1], color: "#ef4444", intensity: 1.15 },
      { type: "fire_flames", origin: [0.15, 0.48, 0.15], color: "#f97316", intensity: 0.9 },
      { type: "steam_smoke", origin: [0.15, 0.9, 0.0], color: "#94a3b8", intensity: 0.85 }
    );
  } else if (phase === "CLIMAX") {
    vfxSystems.push(
      { type: "gold_sparkles", origin: [0.1, 0.9, 0.2], color: "#fde047", intensity: 1.35 },
      { type: "electric_arcs", origin: [0.15, 0.75, 0.05], target: [0.85, 0.75, 0.05], color: "#34d399", intensity: 0.85 }
    );
  } else {
    vfxSystems.push({
      type: environment === "deep_underwater" || environment === "backyard_pond" ? "bubbles_rise" : environment === "arctic_glacier" ? "frost_crystals" : "gold_sparkles",
      origin: [0.1, 0.7, 0.1],
      color: "#38bdf8",
      intensity: 0.85
    });
  }

  // Smooth cinematic Kling camera curve per phase
  const cameraPresets = [
    { start: [0.8, 1.55, 4.15], mid: [0.35, 1.25, 3.35], end: [-0.25, 1.12, 2.85], lookStart: [0.05, 0.55, 0], lookEnd: [0.12, 0.62, 0], fovStart: 48, fovEnd: 42, rollTilt: 0.0, handheldAmp: 0.018 },
    { start: [-0.55, 1.15, 3.1], mid: [0.12, 1.35, 2.65], end: [0.65, 1.05, 2.95], lookStart: [0.1, 0.62, 0], lookEnd: [0.15, 0.58, 0], fovStart: 46, fovEnd: 52, rollTilt: 0.045, handheldAmp: 0.055 },
    { start: [-1.15, 1.75, 3.65], mid: [-0.15, 1.4, 3.25], end: [0.85, 1.25, 3.05], lookStart: [0.0, 0.55, 0], lookEnd: [0.15, 0.62, 0], fovStart: 46, fovEnd: 43, rollTilt: 0.0, handheldAmp: 0.015 },
    { start: [0.0, 0.88, 3.85], mid: [0.42, 1.48, 3.2], end: [-0.15, 1.65, 2.85], lookStart: [0.1, 0.52, 0], lookEnd: [0.12, 0.68, 0], fovStart: 50, fovEnd: 40, rollTilt: -0.02, handheldAmp: 0.02 }
  ];
  const camBase = phase === "TAPI" ? cameraPresets[1] : phase === "CLIMAX" ? cameraPresets[3] : cameraPresets[sceneIndex % cameraPresets.length];

  return {
    engine: "gemini-cinema-3d",
    sceneNumber: scene.sceneNumber || sceneIndex + 1,
    lightingMood,
    environment,
    cinematicPrompt: `Kling-grade 9:16 3D Pixar/Unreal Engine 5 animation of ${topic}: ${scene.componentLabel || phase}`,
    cameraTrack: {
      ...camBase,
      transitionIn:
        sceneIndex === 0
          ? "none"
          : phase === "TAPI"
          ? "flash_impact"
          : phase === "CLIMAX"
          ? "zoom_through"
          : sceneIndex % 2 === 0
          ? "whip_pan"
          : "cross_dissolve"
    },
    actors,
    vfxSystems,
    colorGrade: {
      bloomStrength: phase === "TAPI" ? 0.85 : phase === "CLIMAX" ? 0.92 : 0.62,
      contrast: 1.08,
      saturation: 1.16,
      vignette: 0.28,
      tintHex: phase === "TAPI" ? "#ff4d6d" : phase === "CLIMAX" ? "#10b981" : "#38bdf8",
      lensFlare: phase === "HOOK" || phase === "CLIMAX",
      speedLines: phase === "TAPI"
    }
  };
}

export function sanitizeCinemaBlueprint(raw, scene, topic, sceneIndex, totalScenes) {
  const fb = inferFallbackCinemaBlueprint(scene, topic, sceneIndex, totalScenes);
  if (!raw || typeof raw !== "object") return fb;

  const lightingMood = ALLOWED_MOODS.has(raw.lightingMood) ? raw.lightingMood : fb.lightingMood;
  const environment = ALLOWED_ENVS.has(raw.environment) ? raw.environment : fb.environment;

  const rawCam = raw.cameraTrack || {};
  const cameraTrack = {
    start: sanitizeVec3(rawCam.start, fb.cameraTrack.start, 9),
    mid: sanitizeVec3(rawCam.mid, fb.cameraTrack.mid, 9),
    end: sanitizeVec3(rawCam.end, fb.cameraTrack.end, 9),
    lookStart: sanitizeVec3(rawCam.lookStart, fb.cameraTrack.lookStart, 4),
    lookEnd: sanitizeVec3(rawCam.lookEnd, fb.cameraTrack.lookEnd, 4),
    fovStart: clampNum(rawCam.fovStart, 34, 64, fb.cameraTrack.fovStart),
    fovEnd: clampNum(rawCam.fovEnd, 34, 64, fb.cameraTrack.fovEnd),
    rollTilt: clampNum(rawCam.rollTilt, -0.14, 0.14, fb.cameraTrack.rollTilt),
    handheldAmp: clampNum(rawCam.handheldAmp, 0, 0.09, fb.cameraTrack.handheldAmp),
    transitionIn: ALLOWED_TRANSITIONS.has(rawCam.transitionIn)
      ? rawCam.transitionIn
      : fb.cameraTrack.transitionIn
  };
  // Guarantee camera always stays clearly in front of look target (never inside objects!)
  if (cameraTrack.start[2] < cameraTrack.lookStart[2] + 2.2) cameraTrack.start[2] = cameraTrack.lookStart[2] + 3.2;
  if (cameraTrack.mid[2] < cameraTrack.lookStart[2] + 2.0) cameraTrack.mid[2] = cameraTrack.lookStart[2] + 2.9;
  if (cameraTrack.end[2] < cameraTrack.lookEnd[2] + 2.0) cameraTrack.end[2] = cameraTrack.lookEnd[2] + 2.75;

  const actors = Array.isArray(raw.actors)
    ? raw.actors
        .slice(0, 16)
        .filter((a) => a && typeof a === "object" && ALLOWED_PREFABS.has(a.prefab))
        .map((a, idx) => ({
          id: String(a.id || `actor_${idx}`).slice(0, 32),
          prefab: a.prefab,
          label: String(a.label || "").slice(0, 32),
          color: sanitizeHex(a.color, "#38bdf8"),
          secondaryColor: sanitizeHex(a.secondaryColor, "#fbbf24"),
          materialType: ALLOWED_MATERIALS.has(a.materialType) ? a.materialType : "glossy_plastic",
          startPos: sanitizeVec3(a.startPos || a.pos, [0, 0.45, 0], 6),
          endPos: sanitizeVec3(a.endPos || a.startPos || a.pos, [0, 0.5, 0], 6),
          startRot: sanitizeVec3(a.startRot || a.rot, [0, 0, 0], 6.3),
          endRot: sanitizeVec3(a.endRot || a.startRot || a.rot, [0, 0.4, 0], 6.3),
          scale: clampNum(a.scale, 0.25, 2.4, 1.0),
          from: a.from ? sanitizeVec3(a.from, [-0.6, 0.4, 0], 6) : null,
          to: a.to ? sanitizeVec3(a.to, [0.6, 0.4, 0], 6) : null,
          loopMotion: ALLOWED_MOTIONS.has(a.loopMotion) ? a.loopMotion : "none",
          enterStyle: ALLOWED_ENTERS.has(a.enterStyle) ? a.enterStyle : "pop_bounce",
          speed: clampNum(a.speed, 0.2, 16, 2.5),
          emissiveIntensity: clampNum(a.emissiveIntensity, 0, 2.0, 0.15),
          action: String(a.action || scene?.visual?.workerAction || "build").slice(0, 24)
        }))
    : [];

  const finalActors = actors.length >= 2 ? actors : fb.actors;

  const vfxSystems = Array.isArray(raw.vfxSystems)
    ? raw.vfxSystems
        .slice(0, 8)
        .filter((v) => v && typeof v === "object" && ALLOWED_VFX.has(v.type))
        .map((v) => ({
          type: v.type,
          origin: sanitizeVec3(v.origin, [0, 0.7, 0], 6),
          target: v.target ? sanitizeVec3(v.target, [0.7, 0.7, 0], 6) : null,
          color: sanitizeHex(v.color, "#fbbf24"),
          intensity: clampNum(v.intensity, 0.2, 2.0, 1.0)
        }))
    : [];

  const finalVfx = vfxSystems.length ? vfxSystems : fb.vfxSystems;
  // Ensure volumetric god_rays exist on HOOK/CLIMAX for Kling depth feel
  if (!finalVfx.some((v) => v.type === "god_rays")) {
    finalVfx.push({
      type: "god_rays",
      origin: [0.5, 2.8, -1.2],
      color: lightingMood === "inferno_alert" ? "#fb7185" : lightingMood === "cyber_neon" ? "#38bdf8" : "#fffbeb",
      intensity: 0.72
    });
  }

  const rawGrade = raw.colorGrade || {};
  const colorGrade = {
    bloomStrength: clampNum(rawGrade.bloomStrength, 0.15, 1.35, fb.colorGrade.bloomStrength),
    contrast: clampNum(rawGrade.contrast, 0.9, 1.35, fb.colorGrade.contrast),
    saturation: clampNum(rawGrade.saturation, 0.85, 1.45, fb.colorGrade.saturation),
    vignette: clampNum(rawGrade.vignette, 0.08, 0.65, fb.colorGrade.vignette),
    tintHex: sanitizeHex(rawGrade.tintHex, fb.colorGrade.tintHex),
    lensFlare: typeof rawGrade.lensFlare === "boolean" ? rawGrade.lensFlare : fb.colorGrade.lensFlare,
    speedLines: typeof rawGrade.speedLines === "boolean" ? rawGrade.speedLines : fb.colorGrade.speedLines
  };

  return {
    engine: "gemini-cinema-3d",
    sceneNumber: scene?.sceneNumber || sceneIndex + 1,
    lightingMood,
    environment,
    cinematicPrompt: String(raw.cinematicPrompt || fb.cinematicPrompt).slice(0, 340),
    cameraTrack,
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
        text: `${prompt}. Ultra-cinematic 3D Pixar / Blender Cycles / Kling AI animation frame, vertical 9:16 framing, dramatic volumetric lighting, rich PBR materials, shallow depth of field, NO text, NO watermark, NO subtitles. Mood: ${phase}.`
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
        if (resp.status === 429 || resp.status === 403) return null; // Quota/billing unavailable on free tier
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

const GEMINI_CINEMA_DIRECTOR_PROMPT = `Kamu adalah "Gemini Cinema AI Video Renderer" — Sutradara Film Animasi 3D sekelas KLING AI, PIXAR, dan UNREAL ENGINE 5!
Tugasmu adalah MENGOMPILASI setiap scene naskah menjadi **Blueprint Animasi Sinematik 3D Lengkap** yang padat aksi, dramatis, dinamis dari t=0% ke t=100%, dengan pergerakan kamera dolly/crane/orbit, material PBR berkilau, dan VFX volumetrik nyata!

ATURAN KUALITAS SINEMA KLING (WAJIB DIPATUHI!):
1. SETIAP SCENE WAJIB PUNYA **5 sampai 9 aktor 3D komposit** ("actors") agar frame 9:16 padat, berlapis (foreground, hero midground, background prop), TIDAK pernah kosong!
2. WAJIB buat gerakan nyata dari startPos/startRot -> endPos/endRot selama scene berjalan (misal roket melesat naik, cairan mengalir, mesin bergetar, ikan melompat, pelat logam memuai, kamera menukik mendekati detail!).
3. Koordinat panggung: Lantai/meja di Y=0.0. Hero utama di X=-0.4..0.6, Y=0.35..1.1, Z=-0.4..0.4. Kamera SELALU berada di depan objek pada Z=+2.6..4.8, Y=0.85..2.3, menghadap lookStart/lookEnd di sekitar Y=0.55..0.85.
4. PILIHAN "lightingMood": "pixar_golden" | "unreal_studio" | "cyber_neon" | "inferno_alert" | "deep_ocean" | "arctic_ice" | "emerald_victory" | "volcanic_forge" | "moonlit_mystery".
5. PILIHAN "environment": "studio_bench" | "kitchen_cinema" | "backyard_pond" | "sawah_valley" | "house_cutaway" | "runway_tarmac" | "sci_fi_lab" | "deep_underwater" | "volcanic_terrain" | "space_orbit" | "city_street" | "factory_floor" | "arctic_glacier".
6. PILIHAN "prefab" (Gunakan yang paling akurat dengan topik!):
   - Karakter/Makhluk: "human_protagonist", "fish_arowana", "fish_betta", "stingray", "bird_eagle", "drone_quad", "robot_arm", "car_sports", "rocket_ship", "aircraft_jet", "submarine", "ship_vessel"
   - Mesin/Sains/Dapur: "glass_aquarium", "filter_sump", "turbine_generator", "asic_miner", "copper_stator_motor", "battery_reactor", "solar_array", "ac_compressor", "boiler_furnace", "microscope_lab", "server_rack", "crystal_core", "thermal_plates", "volcano_peak", "ice_cream_bowl", "coffee_espresso", "cooking_pot", "chemistry_flask", "rebar_structure"
   - Alam/Efek/Konektor: "tree_lush", "palm_tree", "mountain_peak", "crystal_cluster", "hologram_ring", "neon_tube", "pipe_curved" (wajib isi from & to), "wire_arc" (wajib isi from & to), "water_surface", "magma_pool", "bevel_chassis", "metallic_cylinder", "energy_sphere", "gear_wheel", "propeller_fan", "helix_coil".
7. PILIHAN "materialType": "metal_chrome" | "brushed_steel" | "glass_crystal" | "water_clear" | "emissive_neon" | "matte_clay" | "glossy_plastic" | "wood_oak" | "ceramic" | "magma_glow" | "ice_translucent" | "gold_luxury".
8. PILIHAN "loopMotion": "none" | "hover" | "spin_y" | "spin_z" | "pulse" | "shake" | "swim" | "orbit" | "piston" | "flap" | "vibrate" | "breathe".
9. PILIHAN "vfxSystems" (Minimal 2-4 efek volumetrik per scene!): "god_rays" | "fire_flames" | "steam_smoke" | "water_splash" | "bubbles_rise" | "electric_arcs" | "frost_crystals" | "energy_flow" (isi origin & target) | "sound_shockwave" | "rain_storm" | "gold_sparkles" | "heat_haze".
10. PILIHAN "cameraTrack.transitionIn": "zoom_through" | "whip_pan" | "flash_impact" | "cross_dissolve" | "none".

Kembalikan HANYA JSON valid:
{
  "directorNotes": "Ringkasan gaya sinematografi film ini",
  "scenes": [
    {
      "sceneNumber": 1,
      "lightingMood": "pixar_golden",
      "environment": "sci_fi_lab",
      "cinematicPrompt": "Deskripsi visual bahasa Inggris detail ala Kling AI 9:16 untuk scene ini",
      "cameraTrack": {
        "start": [0.9, 1.5, 4.1],
        "mid": [0.25, 1.25, 3.3],
        "end": [-0.35, 1.1, 2.85],
        "lookStart": [0.05, 0.55, 0],
        "lookEnd": [0.15, 0.65, 0],
        "fovStart": 48,
        "fovEnd": 42,
        "rollTilt": 0.0,
        "handheldAmp": 0.015,
        "transitionIn": "zoom_through"
      },
      "actors": [
        {
          "id": "ipul",
          "prefab": "human_protagonist",
          "label": "Ipul",
          "color": "#0d9488",
          "secondaryColor": "#f59e0b",
          "materialType": "matte_clay",
          "startPos": [-1.15, 0, -0.5],
          "endPos": [-1.05, 0, -0.45],
          "startRot": [0, 0.4, 0],
          "endRot": [0, 0.25, 0],
          "scale": 1.0,
          "loopMotion": "breathe",
          "enterStyle": "none",
          "speed": 3.0,
          "emissiveIntensity": 0.0,
          "action": "build"
        }
      ],
      "vfxSystems": [
        { "type": "god_rays", "origin": [0.6, 2.8, -1.2], "color": "#fffbeb", "intensity": 0.85 },
        { "type": "energy_flow", "origin": [-0.6, 0.6, 0], "target": [0.6, 0.6, 0], "color": "#38bdf8", "intensity": 1.1 }
      ],
      "colorGrade": {
        "bloomStrength": 0.72,
        "contrast": 1.1,
        "saturation": 1.18,
        "vignette": 0.28,
        "tintHex": "#38bdf8",
        "lensFlare": true,
        "speedLines": false
      }
    }
  ]
}`;

export async function compileGeminiCinemaVideo({
  topic = "",
  title = "",
  scenes = [],
  geminiApiKey = "",
  enableKeyframes = false
}) {
  if (!Array.isArray(scenes) || !scenes.length) {
    throw new Error("Daftar scene kosong untuk dirender oleh Gemini Cinema.");
  }

  const candidateKeys = Array.from(
    new Set([cleanKey(geminiApiKey), cleanKey(process.env.GEMINI_API_KEY)].filter(Boolean))
  );

  const compactScenes = scenes.map((s, idx) => ({
    sceneNumber: s.sceneNumber || idx + 1,
    phase: s.phase || "HOOK",
    componentLabel: s.componentLabel || "",
    narration: s.plainNarration || s.narration || "",
    workerAction: s.visual?.workerAction || "",
    heroObject: s.visual?.heroObject || "custom_stage",
    problemVisual: s.visual?.problemVisual || "none",
    solutionVisual: s.visual?.solutionVisual || "none"
  }));

  const userPrompt = `TOPIK VIDEO: "${topic || title}"
JUDUL: "${title || topic}"
JUMLAH SCENE: ${compactScenes.length}

Rancang animasi 3D sinematik penuh (gaya Kling AI / Pixar / Blender Cycles) untuk SEMUA ${compactScenes.length} scene berikut agar tiap scene hidup, penuh gerakan aktor 0%->100%, kamera bergerak dramatis, lighting kontras, dan VFX volumetrik kaya:
${JSON.stringify(compactScenes, null, 2)}

WAJIB kembalikan array "scenes" dengan panjang TEPAT ${compactScenes.length} sesuai sceneNumber 1..${compactScenes.length}!`;

  let parsed = null;
  let usedModel = null;
  let lastError = null;

  for (const key of candidateKeys) {
    for (const model of GEMINI_CINEMA_MODELS) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: GEMINI_CINEMA_DIRECTOR_PROMPT }] },
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.72,
                maxOutputTokens: 16384
              }
            }),
            signal: AbortSignal.timeout(24000)
          }
        );

        if (resp.ok) {
          const data = await resp.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const rawText = parts
            .filter((p) => p?.text && !p?.thought)
            .map((p) => p.text)
            .join("\n");
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            const obj = JSON.parse(match[0]);
            if (Array.isArray(obj?.scenes) && obj.scenes.length > 0) {
              parsed = obj;
              usedModel = model;
              break;
            }
          }
        } else {
          const errTxt = await resp.text().catch(() => "");
          lastError = `${model} HTTP ${resp.status}: ${errTxt.slice(0, 140)}`;
        }
      } catch (e) {
        lastError = `${model}: ${e.message}`;
      }
    }
    if (parsed) break;
  }

  const rawMap = new Map();
  if (parsed?.scenes) {
    parsed.scenes.forEach((sc, i) => {
      rawMap.set(Number(sc.sceneNumber || i + 1), sc);
    });
  }

  const blueprints = scenes.map((sc, idx) => {
    const num = sc.sceneNumber || idx + 1;
    const rawBp = rawMap.get(num) || parsed?.scenes?.[idx] || null;
    return sanitizeCinemaBlueprint(rawBp, sc, topic || title, idx, scenes.length);
  });

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
      if (!kf) break; // Billing/quota not enabled for Nano Banana image -> cleanly stay on Gemini Cinema 3D!
      bp.aiKeyframe = {
        mimeType: kf.mimeType,
        dataUrl: `data:${kf.mimeType};base64,${kf.data}`
      };
      bp.engine = "gemini-nano-banana-cinema";
      prevBase64 = kf.data;
      imageModelUsed = kf.model;
      keyframeCount++;
    }
  }

  return {
    ok: true,
    engine: keyframeCount > 0 ? "gemini-nano-banana-cinema" : "gemini-cinema-3d",
    directorModel: usedModel || "gemini-cinema-fallback",
    imageModel: imageModelUsed,
    keyframeCount,
    directorNotes:
      parsed?.directorNotes ||
      `Sinematografi Kling-Class 3D PBR + Volumetric VFX untuk "${topic || title}"`,
    scenes: blueprints,
    warning: usedModel ? null : lastError
  };
}
