// Broadcast-Grade 2D Anime Director — Alternating Full-Screen Cutaways + mc_default.jpg Canonical Host Lock
// Pure 2D Hand-Drawn Modern Japanese TV Anime Architecture (ZERO 3D primitives & copyright-safe API prompts!):
// - Directs alternating Cut A (Dramatic Host Shot locked to mc_default.jpg) <-> Cut B (Full-Screen 9:16 Dark-Anime Cutaway)
// - Synthesizes crisp dark-blueprint technical schematics ONLY as subtle dark-glass HUD (NEVER blinding white boxes!)
// - Enforces PURE stylized Japanese Katakana/Kanji SFX (ZERO mixed Latin-Katakana like "ズGararara!")
// - Syncs 1-2 frame Impact Beats & Black Flash VFX precisely to dramatic script phrases
// - Flags key hero scenes (is_hero_shot: true) for optional cost-controlled Veo Hero-Shot Mode

import { callGeminiJson, GEMINI_VIDEO_MODELS } from "./gemini-client.js";
import {
  generateDualDnaHaikei,
  generateDualDnaKyara,
  generateFullScreenAnimeCutaway,
  getStyleAnchorsStatus
} from "./mappa-asset-generator.js";

export const ALLOWED_HAIKEI_BGS = new Set([
  "shibuya_night",
  "shrine_twilight",
  "domain_void",
  "tokyo_rooftop",
  "anime_kitchen",
  "anime_lab"
]);

// Canonical mc_default.jpg-locked pose keys (+ backward-compatible aliases)
export const ALLOWED_CHAR_POSES = new Set([
  "pose_default_smirk",
  "pose_explaining",
  "pose_shock_panic",
  "pose_climax_domain",
  "stance",
  "point_reveal",
  "shock_alert",
  "domain_seal"
]);

export function normalizeCanonicalPose(rawPose = "", phase = "HOOK") {
  const p = String(rawPose || "").trim();
  if (p === "pose_default_smirk" || p === "stance") return "pose_default_smirk";
  if (p === "pose_explaining" || p === "point_reveal") return "pose_explaining";
  if (p === "pose_shock_panic" || p === "shock_alert") return "pose_shock_panic";
  if (p === "pose_climax_domain" || p === "domain_seal") return "pose_climax_domain";
  if (phase === "TAPI") return "pose_shock_panic";
  if (phase === "JADI") return "pose_explaining";
  if (phase === "CLIMAX") return "pose_climax_domain";
  return "pose_default_smirk";
}

export const ALLOWED_SHOT_LAYOUTS = new Set([
  "host_hero_alternating_cutaway",
  "dramatic_closeup_domain",
  "host_dark_hud_split",
  "action_clash_diagonal",
  "wide_establishing_parallax",
  // Legacy aliases gracefully supported
  "hero_and_genga_split",
  "genga_hero_focus"
]);

export const ALLOWED_CAMERA_MOTIONS_2D = new Set([
  "slow_push_in",
  "crash_zoom_impact",
  "pan_left_to_right",
  "pan_right_to_left",
  "tilt_up_hero",
  "dutch_shibuya_shake",
  "breathe_hold"
]);

export const ALLOWED_SATSUEI_MOODS = new Set([
  "jjk_cursed_blue",
  "shibuya_neon",
  "sukuna_crimson",
  "hollow_purple",
  "chainsaw_film",
  "shonen_daylight",
  "golden_warm"
]);

export const ALLOWED_SAKUGA_VFX_2D = new Set([
  "cursed_flames_2d",
  "black_flash_2d",
  "slash_smear_2d",
  "domain_seal_2d",
  "rain_streaks_2d",
  "embers_petals_2d",
  "anime_sparkles_steam_2d",
  "manga_speed_lines_2d"
]);

export const ALLOWED_IMPACT_STYLES = new Set([
  "bw_manga_invert",
  "black_flash",
  "crimson_flash"
]);

export const ALLOWED_CUTAWAY_KINDS = new Set([
  "copper_coils_sparks",
  "jammed_shaft_dust",
  "cracked_blade_vibration",
  "thermal_freeze_crystal",
  "fluid_vortex_tank",
  "supersonic_heat_plates",
  "plasma_circuit_core"
]);

export const ALLOWED_TRANSITION_STYLES = new Set(["whip_cut", "zoom_punch"]);

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanHex(v, fb = "#38bdf8") {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb;
}

/**
 * Strictly enforces PURE stylized Japanese Katakana/Kanji SFX (ZERO mixed Latin-Katakana like "ズGararara!").
 */
export function sanitizeJapaneseSfx(rawSfx = "", phase = "HOOK") {
  const s = String(rawSfx || "").trim();
  if (!s) return "";
  // Reject any string containing Latin A-Z letters or digits -> map cleanly to authentic pure Japanese SFX!
  if (/[A-Za-z0-9]/.test(s)) {
    if (phase === "TAPI") return "ドォォン!!";
    if (phase === "CLIMAX") return "領域展開!";
    if (phase === "JADI") return "バチッ!!";
    return "ゴゴゴ...";
  }
  // Keep only authentic Hiragana, Katakana, Kanji, prolonged sound mark (ー), exclamation/dots
  const pure = s.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFFー・…!?！？.]/g, "").slice(0, 8);
  if (!pure) return "";
  return pure;
}

export function estimateScriptBeatTrigger(scene = {}, fallback = 0.45) {
  const phrases = Array.isArray(scene?.subtitlePhrases) && scene.subtitlePhrases.length ? scene.subtitlePhrases : null;
  if (phrases) {
    const weights = phrases.map((ph) => Math.max(5, ph.map((t) => t.text || "").join(" ").length));
    const totalW = weights.reduce((a, b) => a + b, 0) || 1;
    const dramaticRe = /^(tapi|bahaya|gagal|bocor|overheat|meledak|selamat|jadi|solusi|kunci|rahasi|fakta|plot)/i;
    let accum = 0;
    let firstHl = null;
    for (let i = 0; i < phrases.length; i++) {
      const startRatio = accum / totalW;
      const midRatio = (accum + weights[i] * 0.35) / totalW;
      for (const tok of phrases[i]) {
        const clean = String(tok?.text || "").replace(/[^a-zA-Z0-9]/g, "");
        if (tok?.highlight) {
          if (firstHl === null) firstHl = midRatio;
          if (dramaticRe.test(clean)) {
            return Number(clamp(i === 0 ? Math.max(0.16, startRatio + 0.08) : midRatio, 0.14, 0.82, fallback).toFixed(3));
          }
        }
      }
      accum += weights[i];
    }
    if (firstHl !== null) return Number(clamp(firstHl, 0.16, 0.82, fallback).toFixed(3));
  }

  const raw = String(scene?.narration || "");
  const m = raw.match(/\[[^\]]+\]/);
  if (m && raw.length >= 6) {
    return Number(clamp(m.index / raw.length, 0.16, 0.82, fallback).toFixed(3));
  }
  return fallback;
}

// Strict SVG sanitizer for translucent dark-blueprint HUD schematic (ZERO white fills/scripts/external URLs)
export function sanitizeGengaSvg(rawSvg) {
  if (typeof rawSvg !== "string") return null;
  const trimmed = rawSvg.trim();
  const match = trimmed.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return null;
  let svg = match[0];

  svg = svg
    .replace(/<(script|iframe|object|embed|foreignObject|link|style|image|text|tspan)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|iframe|object|embed|foreignObject|link|image|text)[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|xlink:href)\s*=\s*["']\s*(javascript:|https?:|data:)[^"']*["']/gi, "");

  if (!/xmlns\s*=/i.test(svg)) {
    svg = svg.replace(/^<svg/i, `<svg xmlns="http://www.w3.org/2000/svg"`);
  }
  if (!/viewBox\s*=/i.test(svg)) {
    svg = svg.replace(/^<svg/i, `<svg viewBox="0 0 540 540"`);
  }

  const shapeCount = (svg.match(/<(path|polygon|circle|ellipse|rect|polyline|line)\b/gi) || []).length;
  if (shapeCount < 4) return null;
  return svg.slice(0, 14000);
}

export function inferCutawayVisualKind(topic = "", narration = "", phase = "HOOK") {
  const txt = `${topic} ${narration}`.toLowerCase();
  if (/macet|debu|karat|poros|bearing|\bas\b|oli|berdecit|gesekan|seret/.test(txt)) return "jammed_shaft_dust";
  if (/baling|retak|getar|patah|bilah|sayap|turbin/.test(txt)) return "cracked_blade_vibration";
  if (/kipas|dinamo|motor|kumparan|tembaga|stator|kapasitor|listrik|baterai|overheat|panas|kabel/.test(txt)) {
    return "copper_coils_sparks";
  }
  if (/es krim|es batu|beku|kristal|garam|embun|kondensasi|dingin|freezer|kulkas/.test(txt)) {
    return "thermal_freeze_crystal";
  }
  if (/ikan|kolam|akuarium|air|filter|amonia|bocor|kopi|teh|susu|gelas|mangkuk/.test(txt)) {
    return "fluid_vortex_tank";
  }
  if (/pesawat|jet|sr-71|titanium|memuai|roket|supersonik|lava|api/.test(txt)) {
    return "supersonic_heat_plates";
  }
  return phase === "TAPI" ? "copper_coils_sparks" : "plasma_circuit_core";
}

// Sleek Dark-Mode Anime Blueprint Schematic SVG (used ONLY inside translucent dark-glass HUD — ZERO pure white!)
export function buildFallback2DGengaSvg(topic = "", narration = "", phase = "HOOK") {
  const kind = inferCutawayVisualKind(topic, narration, phase);
  const accent = phase === "TAPI" ? "#fb7185" : phase === "CLIMAX" ? "#fbbf24" : "#38bdf8";

  if (kind === "copper_coils_sparks" || kind === "jammed_shaft_dust" || kind === "cracked_blade_vibration") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">
      <circle cx="270" cy="270" r="188" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="18 10" opacity="0.75"/>
      <circle cx="270" cy="270" r="142" fill="rgba(15,23,42,0.55)" stroke="${accent}" stroke-width="5"/>
      <path d="M270 100 L292 152 L248 152 Z M270 440 L292 388 L248 388 Z M100 270 L152 248 L152 292 Z M440 270 L388 248 L388 292 Z" fill="${accent}" opacity="0.82"/>
      <circle cx="270" cy="270" r="76" fill="none" stroke="#f59e0b" stroke-width="7"/>
      <circle cx="270" cy="270" r="28" fill="${accent}"/>
      <path d="M165 165 L220 220 M375 375 L320 320 M375 165 L320 220 M165 375 L220 320" stroke="#fde047" stroke-width="4" stroke-linecap="round"/>
      <polygon points="365,92 328,176 374,176 312,265 412,160 364,160" fill="${accent}" opacity="0.9"/>
    </svg>`;
  }

  if (kind === "thermal_freeze_crystal") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">
      <polygon points="270,68 424,158 424,382 270,472 116,382 116,158" fill="rgba(14,165,233,0.16)" stroke="${accent}" stroke-width="5"/>
      <path d="M270 84 L270 456 M128 166 L412 374 M412 166 L128 374" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
      <polygon points="270,152 356,202 356,338 270,388 184,338 184,202" fill="rgba(56,189,248,0.22)" stroke="#e0f2fe" stroke-width="3.5"/>
      <circle cx="270" cy="270" r="36" fill="${accent}" opacity="0.88"/>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">
    <circle cx="270" cy="270" r="190" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="22 12" opacity="0.75"/>
    <circle cx="270" cy="270" r="144" fill="rgba(15,23,42,0.48)" stroke="#e2e8f0" stroke-width="3"/>
    <polygon points="270,96 420,356 120,356" fill="none" stroke="${accent}" stroke-width="4.5" stroke-linejoin="round"/>
    <polygon points="270,444 420,184 120,184" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="270" cy="270" r="56" fill="${accent}" opacity="0.85"/>
    <path d="M170 130 L232 198 L204 204 L248 256 M372 412 L308 344 L336 338 L292 284" fill="none" stroke="#fb7185" stroke-width="4.5" stroke-linecap="round"/>
  </svg>`;
}

export function inferAnime2DTheme(topic = "", scenes = []) {
  const txt = `${topic} ${(scenes || []).map((s) => `${s.componentLabel || ""} ${s.narration || ""}`).join(" ")}`.toLowerCase();

  if (/es krim|dapur|masak|goreng|rebus|kopi|teh|susu|mangkuk|panci|kue|roti|gelas|embun/.test(txt)) {
    return { haikeiBg: "anime_kitchen", satsueiMood: "golden_warm", auraColor: "#fbbf24" };
  }
  if (/kipas|dinamo|motor|bitcoin|server|ai|chip|komputer|baterai|listrik|pltu|bunker|sains|kimia|sel|virus|dna/.test(txt)) {
    return { haikeiBg: "anime_lab", satsueiMood: "jjk_cursed_blue", auraColor: "#38bdf8" };
  }
  if (/pesawat|jet|sr-71|roket|langit|awan|hujan|petir|cuaca|sawah|alam/.test(txt)) {
    return { haikeiBg: "tokyo_rooftop", satsueiMood: "shonen_daylight", auraColor: "#38bdf8" };
  }
  if (/gunung|lava|api|naga|perang|pertarungan|kutukan|iblis|samurai|pedang|ledak/.test(txt)) {
    return { haikeiBg: "shrine_twilight", satsueiMood: "sukuna_crimson", auraColor: "#f43f5e" };
  }
  if (/ikan|kolam|akuarium|pari|arwana|cupang|laut|samudra|antariksa|planet|galaksi/.test(txt)) {
    return { haikeiBg: "domain_void", satsueiMood: "hollow_purple", auraColor: "#a855f7" };
  }
  return { haikeiBg: "shibuya_night", satsueiMood: "shibuya_neon", auraColor: "#38bdf8" };
}

export function inferFallbackAnimeBlueprint(scene = {}, topic = "", sceneIndex = 0, totalScenes = 8, theme = null) {
  const t = theme || inferAnime2DTheme(topic, [scene]);
  const phase = scene.phase || (sceneIndex === 0 ? "HOOK" : sceneIndex === totalScenes - 1 ? "CLIMAX" : "JADI");
  const narration = `${scene.componentLabel || ""} ${scene.plainNarration || scene.narration || ""}`;
  const lower = narration.toLowerCase();

  let haikeiBg = t.haikeiBg;
  if (phase === "CLIMAX" && (haikeiBg === "shibuya_night" || haikeiBg === "anime_lab")) {
    haikeiBg = "domain_void";
  }

  let satsueiMood = t.satsueiMood;
  if (phase === "TAPI") satsueiMood = "sukuna_crimson";
  else if (phase === "CLIMAX") satsueiMood = "hollow_purple";

  const characterPose = normalizeCanonicalPose("", phase);

  // Primary cinematography: alternating Cut A (Host) <-> Cut B (Full-Screen 9:16 Dark-Anime Cutaway)!
  const shotLayout =
    phase === "CLIMAX"
      ? "dramatic_closeup_domain"
      : phase === "TAPI"
        ? "action_clash_diagonal"
        : sceneIndex === 0
          ? "host_hero_alternating_cutaway"
          : sceneIndex % 2 === 1
            ? "host_hero_alternating_cutaway"
            : "host_dark_hud_split";

  const camByPhase = {
    HOOK: "slow_push_in",
    TAPI: "dutch_shibuya_shake",
    JADI: sceneIndex % 2 === 0 ? "pan_left_to_right" : "tilt_up_hero",
    CLIMAX: "crash_zoom_impact"
  };
  const cameraMotion2d = camByPhase[phase] || "slow_push_in";
  const auraColor = phase === "TAPI" ? "#f43f5e" : phase === "CLIMAX" ? "#a855f7" : t.auraColor || "#38bdf8";

  const sakugaVfx2d = [];
  if (phase === "TAPI") {
    sakugaVfx2d.push("black_flash_2d", "manga_speed_lines_2d");
  } else if (phase === "CLIMAX") {
    sakugaVfx2d.push("domain_seal_2d", "cursed_flames_2d", "embers_petals_2d");
  } else if (haikeiBg === "anime_kitchen" || /es krim|susu|masak|gelas|kopi/.test(lower)) {
    sakugaVfx2d.push("anime_sparkles_steam_2d");
  } else if (haikeiBg === "shibuya_night") {
    sakugaVfx2d.push("rain_streaks_2d", "embers_petals_2d");
  } else if (haikeiBg === "shrine_twilight") {
    sakugaVfx2d.push("embers_petals_2d", "slash_smear_2d");
  } else {
    sakugaVfx2d.push("embers_petals_2d");
  }

  const enableImpact = phase === "TAPI" || phase === "CLIMAX" || sceneIndex === 0;
  const triggerProgress = estimateScriptBeatTrigger(scene, phase === "TAPI" ? 0.36 : 0.52);
  const isHeroShot = sceneIndex === 0 || phase === "CLIMAX";
  const cutawayKind = inferCutawayVisualKind(topic, narration, phase);

  return {
    engine: "anime-mappa-2d",
    sceneNumber: scene.sceneNumber || sceneIndex + 1,
    is_hero_shot: isHeroShot,
    haikeiBg,
    haikeiPrompt: `Gritty atmospheric 2D painted anime environment for ${topic || "science explanation"} (${scene.componentLabel || phase})`,
    cutawayPrompt: `Dramatic dark-action 2D anime macro cutaway of ${scene.componentLabel || topic}, glowing technical details, sparks and atmospheric depth`,
    cutawayKind,
    enableAlternatingCutaway: phase !== "CLIMAX",
    cutawayStartSec: 2.5,
    transitionStyle: phase === "HOOK" || phase === "CLIMAX" ? "zoom_punch" : "whip_cut",
    characterPose,
    kyaraExpression:
      phase === "TAPI"
        ? "shadowed ominous warning glare"
        : phase === "JADI"
        ? "dramatic pointing gloved hand with glowing golden eyes"
        : phase === "CLIMAX"
        ? "triumphant arcane seal stance"
        : "intense confident overlord smirk",
    shotLayout,
    cameraMotion2d,
    satsueiMood,
    auraColor,
    gengaSvg: buildFallback2DGengaSvg(topic, narration, phase),
    gengaTitle: String(scene.componentLabel || topic).slice(0, 32),
    sakugaVfx2d,
    impactBeat: {
      enabled: enableImpact,
      beatSynced: true,
      triggerProgress,
      style: phase === "TAPI" ? "black_flash" : "bw_manga_invert"
    },
    mangaSfxText: sanitizeJapaneseSfx(
      phase === "TAPI" ? "ドォォン!!" : phase === "CLIMAX" ? "領域展開!" : sceneIndex === 0 ? "ゴゴゴ..." : "",
      phase
    ),
    satsueiGrade: {
      bloomStrength: phase === "TAPI" || phase === "CLIMAX" ? 0.38 : 0.28,
      bloomThreshold: 0.70,
      lightWrapStrength: 0.44,
      ambientHarmonization: 0.22,
      shadowCrush: phase === "TAPI" ? 0.18 : 0.14,
      dofBlur: 0.28,
      chromaticPeak: enableImpact ? 0.014 : 0.0022,
      chromaticEdge: 0.0022,
      contrast: 1.1,
      saturation: 1.14,
      rimIntensity: 0.80
    }
  };
}

export function sanitizeAnimeBlueprint(raw, scene, topic, sceneIndex, totalScenes, theme = null) {
  const fb = inferFallbackAnimeBlueprint(scene, topic, sceneIndex, totalScenes, theme);
  if (!raw || typeof raw !== "object") return fb;

  const phase = scene?.phase || "HOOK";
  const haikeiBg = ALLOWED_HAIKEI_BGS.has(raw.haikeiBg) ? raw.haikeiBg : fb.haikeiBg;
  const characterPose = normalizeCanonicalPose(
    ALLOWED_CHAR_POSES.has(raw.characterPose) ? raw.characterPose : fb.characterPose,
    phase
  );
  const shotLayout = ALLOWED_SHOT_LAYOUTS.has(raw.shotLayout) ? raw.shotLayout : fb.shotLayout;
  const cameraMotion2d = ALLOWED_CAMERA_MOTIONS_2D.has(raw.cameraMotion2d) ? raw.cameraMotion2d : fb.cameraMotion2d;
  const satsueiMood = ALLOWED_SATSUEI_MOODS.has(raw.satsueiMood) ? raw.satsueiMood : fb.satsueiMood;
  const auraColor = cleanHex(raw.auraColor, fb.auraColor);
  const cutawayKind = ALLOWED_CUTAWAY_KINDS.has(raw.cutawayKind) ? raw.cutawayKind : fb.cutawayKind;
  const transitionStyle = ALLOWED_TRANSITION_STYLES.has(raw.transitionStyle) ? raw.transitionStyle : fb.transitionStyle;

  const cleanSvg = sanitizeGengaSvg(raw.gengaSvg) || fb.gengaSvg;

  const sakugaVfx2d = Array.isArray(raw.sakugaVfx2d)
    ? raw.sakugaVfx2d.filter((v) => ALLOWED_SAKUGA_VFX_2D.has(v)).slice(0, 3)
    : [];

  const rawImp = raw.impactBeat || {};
  const impactBeat = {
    enabled: typeof rawImp.enabled === "boolean" ? rawImp.enabled : fb.impactBeat.enabled,
    beatSynced: true,
    triggerProgress: estimateScriptBeatTrigger(
      scene,
      clamp(rawImp.triggerProgress, 0.16, 0.82, fb.impactBeat.triggerProgress)
    ),
    style: ALLOWED_IMPACT_STYLES.has(rawImp.style) ? rawImp.style : fb.impactBeat.style
  };

  const rawG = raw.satsueiGrade || {};
  const satsueiGrade = {
    bloomStrength: clamp(rawG.bloomStrength, 0.14, 0.62, fb.satsueiGrade.bloomStrength),
    bloomThreshold: clamp(rawG.bloomThreshold, 0.58, 0.85, fb.satsueiGrade.bloomThreshold),
    lightWrapStrength: clamp(rawG.lightWrapStrength, 0.15, 0.80, fb.satsueiGrade.lightWrapStrength),
    ambientHarmonization: clamp(rawG.ambientHarmonization, 0.15, 0.30, fb.satsueiGrade.ambientHarmonization),
    shadowCrush: clamp(rawG.shadowCrush, 0.04, 0.30, fb.satsueiGrade.shadowCrush),
    dofBlur: clamp(rawG.dofBlur, 0.08, 0.55, fb.satsueiGrade.dofBlur),
    chromaticPeak: clamp(rawG.chromaticPeak, 0.0, 0.018, fb.satsueiGrade.chromaticPeak),
    chromaticEdge: clamp(rawG.chromaticEdge, 0.0, 0.006, fb.satsueiGrade.chromaticEdge),
    contrast: clamp(rawG.contrast, 0.98, 1.24, fb.satsueiGrade.contrast),
    saturation: clamp(rawG.saturation, 0.95, 1.30, fb.satsueiGrade.saturation),
    rimIntensity: clamp(rawG.rimIntensity, 0.35, 1.30, fb.satsueiGrade.rimIntensity)
  };

  return {
    engine: "anime-mappa-2d",
    sceneNumber: scene?.sceneNumber || sceneIndex + 1,
    is_hero_shot: typeof raw.is_hero_shot === "boolean" ? raw.is_hero_shot : fb.is_hero_shot,
    haikeiBg,
    haikeiPrompt: String(raw.haikeiPrompt || fb.haikeiPrompt).slice(0, 240),
    cutawayPrompt: String(raw.cutawayPrompt || fb.cutawayPrompt).slice(0, 240),
    cutawayKind,
    enableAlternatingCutaway:
      typeof raw.enableAlternatingCutaway === "boolean" ? raw.enableAlternatingCutaway : fb.enableAlternatingCutaway,
    cutawayStartSec: clamp(raw.cutawayStartSec, 2.0, 3.6, fb.cutawayStartSec),
    transitionStyle,
    characterPose,
    kyaraExpression: String(raw.kyaraExpression || fb.kyaraExpression).slice(0, 120),
    shotLayout,
    cameraMotion2d,
    satsueiMood,
    auraColor,
    gengaSvg: cleanSvg,
    gengaTitle: String(raw.gengaTitle || scene?.componentLabel || "").slice(0, 32),
    sakugaVfx2d: sakugaVfx2d.length ? sakugaVfx2d : fb.sakugaVfx2d,
    impactBeat,
    mangaSfxText: sanitizeJapaneseSfx(raw.mangaSfxText || "", phase),
    satsueiGrade
  };
}

// Strictly copyright-safe technical broadcast anime director prompt
export const ANIME_2D_DIRECTOR_PROMPT = `Kamu adalah "Broadcast 2D Dark-Action Anime Director" untuk produksi animasi 2D Jepang modern kelas siaran TV (100% 2D ANIME — gritty painterly Haikei + hard-edged 2-tone cel Kyara + full-screen 9:16 dark-anime cutaways, BUKAN 3D dan BUKAN kotak putih flat!).

Tugasmu menyutradarai setiap scene naskah menjadi sinematografi anime 2D dinamis:
1. **Latar Lukisan 2D *Haikei* ("haikeiBg" & "haikeiPrompt"):**
   - "anime_kitchen" | "anime_lab" | "shibuya_night" | "tokyo_rooftop" | "shrine_twilight" | "domain_void"
   - "haikeiPrompt": 1 kalimat Inggris teknis murni lingkungan latar (tanpa karakter/teks/judul berhak cipta).
2. **Sinematografi Cut Bergantian ("shotLayout", "cutawayPrompt", "cutawayKind", "enableAlternatingCutaway"):**
   - Hindari menempel kotak diagram statis selama 7 detik! Gunakan "host_hero_alternating_cutaway" (Cut A: shot dramatis Host -> Cut B: full-screen 9:16 dark-anime cutaway objek mekanis/ilmiah tiap 2.5–3.2 detik!), "dramatic_closeup_domain" (klimaks close-up Host), "action_clash_diagonal" (momen TAPI), atau "host_dark_hud_split" (HUD skematik gelap transparan).
   - "cutawayKind": "copper_coils_sparks" | "jammed_shaft_dust" | "cracked_blade_vibration" | "thermal_freeze_crystal" | "fluid_vortex_tank" | "supersonic_heat_plates" | "plasma_circuit_core"
   - "cutawayPrompt": 1 kalimat Inggris sinematik dark-anime tentang objek teknis harfiah scene ini (contoh: "glowing red-hot copper coils throwing orange sparks in a dark anime motor housing").
3. **Pose Cel Karakter 2D Maou Vaelen ("characterPose" — terkunci ke mc_default.jpg):**
   - "pose_default_smirk" (smirk percaya diri pembuka)
   - "pose_explaining" (gestur tangan bersarung hitam menunjuk tegas saat Solusi Sains)
   - "pose_shock_panic" (reaksi kaget/peringatan intens untuk momen [TAPI] / bahaya)
   - "pose_climax_domain" (close-up intens segel jari silang klimaks)
4. **Skematik HUD Dark-Glass ("gengaSvg"):**
   - SVG vektor garis blueprint bercahaya (viewBox="0 0 540 540", background transparan, TANPA fill putih polos #ffffff besar, pakai garis cyan/amber/crimson & dark translucent shape) — HANYA dipakai di HUD transparan gelap jika diperlukan!
   - DILARANG memasukkan \`<text>\`, \`<script>\`, atau URL luar di dalam SVG!
5. **SFX Bahasa Jepang MURNI ("mangaSfxText") & Transisi Cepat ("transitionStyle"):**
   - WAJIB HANYA Katakana/Kanji murni (contoh: \`"ゴゴゴ..."\`, \`"ドォォン!!"\`, \`"バチッ!!"\`, \`"ギュイイイン!!"\`, \`"領域展開!"\`). **DILARANG KERAS mencampur huruf Latin** seperti "ズGararara!"!
   - "transitionStyle": "whip_cut" | "zoom_punch" (transisi cepat 0.15 detik antar fase).
   - "impactBeat": aktifkan ("enabled": true) HANYA di momen Hook/TAPI/CLIMAX dengan style "bw_manga_invert" atau "black_flash".
   - "is_hero_shot": \`true\` HANYA pada 1–2 scene paling puncak (Hook #1 / Climax terakhir).

Kembalikan HANYA JSON valid:
{
  "directorNotes": "Ringkasan arah sinematografi 2D & ritme cutaway episode ini",
  "scenes": [
    {
      "sceneNumber": 1,
      "is_hero_shot": true,
      "haikeiBg": "anime_lab",
      "haikeiPrompt": "Dark moody Japanese electronics workshop with hanging tungsten lamp and atmospheric dust",
      "cutawayKind": "copper_coils_sparks",
      "cutawayPrompt": "Dramatic dark 2D anime macro closeup of glowing red-hot copper stator coils throwing sharp orange sparks",
      "enableAlternatingCutaway": true,
      "cutawayStartSec": 2.6,
      "transitionStyle": "zoom_punch",
      "characterPose": "pose_default_smirk",
      "kyaraExpression": "confident dark overlord smirk with glowing golden eyes",
      "shotLayout": "host_hero_alternating_cutaway",
      "cameraMotion2d": "slow_push_in",
      "satsueiMood": "jjk_cursed_blue",
      "auraColor": "#38bdf8",
      "gengaTitle": "Kumparan Tembaga Stator",
      "gengaSvg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 540'>...</svg>",
      "sakugaVfx2d": ["embers_petals_2d"],
      "impactBeat": { "enabled": true, "triggerProgress": 0.42, "style": "bw_manga_invert" },
      "mangaSfxText": "ゴゴゴ...",
      "satsueiGrade": {
        "bloomStrength": 0.28,
        "lightWrapStrength": 0.44,
        "ambientHarmonization": 0.22,
        "shadowCrush": 0.14,
        "dofBlur": 0.28,
        "chromaticPeak": 0.012,
        "contrast": 1.1,
        "saturation": 1.14,
        "rimIntensity": 0.80
      }
    }
  ]
}`;

export async function compileAnimeMappaVideo({
  topic = "",
  title = "",
  scenes = [],
  geminiApiKey = "",
  styleMemoryHints = [],
  enableDualDnaAssets = false
}) {
  if (!Array.isArray(scenes) || !scenes.length) {
    throw new Error("Daftar scene kosong untuk Mode Anime 2D Broadcast.");
  }

  const theme = inferAnime2DTheme(topic || title, scenes);
  const memoryBlock =
    Array.isArray(styleMemoryHints) && styleMemoryHints.length
      ? `\nMEMORI KUALITAS VISUAL USER:\n${styleMemoryHints.slice(0, 3).map((h) => `- ${h}`).join("\n")}`
      : "";

  const systemInstruction = [ANIME_2D_DIRECTOR_PROMPT, memoryBlock].filter(Boolean).join("\n\n");

  const chunkSize = 4;
  const rawMap = new Map();
  let usedModel = null;
  let lastError = null;
  let directorNotes = "";

  const batches = [];
  for (let start = 0; start < scenes.length; start += chunkSize) {
    batches.push({ start, slice: scenes.slice(start, start + chunkSize) });
  }

  for (let b = 0; b < batches.length; b += 2) {
    const pair = batches.slice(b, b + 2);
    const results = await Promise.all(
      pair.map(async ({ start, slice }) => {
        const compact = slice.map((s, i) => ({
          sceneNumber: s.sceneNumber || start + i + 1,
          phase: s.phase || "HOOK",
          componentLabel: s.componentLabel || "",
          narration: s.plainNarration || s.narration || ""
        }));

        const userPrompt = `TOPIK ANIME 2D: "${topic || title}"
JUDUL: "${title || topic}"
REKOMENDASI HAIKEI KONSISTEN: "${theme.haikeiBg}" (boleh pindah ke "domain_void" saat CLIMAX epik!)
BATCH SCENE ${compact[0].sceneNumber}..${compact[compact.length - 1].sceneNumber} dari ${scenes.length} scene:
${JSON.stringify(compact, null, 2)}

Sutradarai sinematografi 2D bergaya dark-action broadcast dengan cutaway full-screen 9:16 & SFX Katakana/Kanji murni untuk SEMUA ${compact.length} scene pada batch ini!`;

        const res = await callGeminiJson({
          geminiApiKey,
          systemInstruction,
          userPrompt,
          temperature: 0.58,
          maxOutputTokens: 16384,
          timeoutMs: 28000,
          models: GEMINI_VIDEO_MODELS
        });
        return { start, slice, res };
      })
    );

    for (const { start, slice, res } of results) {
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
  }

  let customGengaCount = 0;
  const blueprints = scenes.map((sc, idx) => {
    const num = sc.sceneNumber || idx + 1;
    const rawBp = rawMap.get(num) || null;
    if (rawBp?.gengaSvg && sanitizeGengaSvg(rawBp.gengaSvg)) customGengaCount++;
    return sanitizeAnimeBlueprint(rawBp, sc, topic || title, idx, scenes.length, theme);
  });

  // Optional Hybrid Dual-DNA Multimodal Reference Generation (strictly anchored to mc_default.jpg & haikei_style_ref.png!)
  let dualDnaGeneratedCount = 0;
  let dualDnaNote = null;
  if (enableDualDnaAssets) {
    const targetIndices = blueprints
      .map((bp, idx) => (bp.is_hero_shot || bp.enableAlternatingCutaway ? idx : -1))
      .filter((idx) => idx >= 0)
      .slice(0, 3);

    for (const idx of targetIndices) {
      const bp = blueprints[idx];
      // 1. Full-screen 9:16 Dark-Anime Cutaway Illustration of the educational/technical subject!
      if (bp.enableAlternatingCutaway && bp.cutawayPrompt) {
        const cutRes = await generateFullScreenAnimeCutaway({
          subjectDescription: bp.cutawayPrompt,
          topic,
          phase: scenes[idx]?.phase || "JADI",
          mood: bp.satsueiMood,
          geminiApiKey
        });
        if (cutRes.ok && cutRes.dataUrl) {
          bp.customCutawayUrl = cutRes.dataUrl;
          dualDnaGeneratedCount++;
        } else {
          dualDnaNote = cutRes.reason || "Menggunakan dark-anime procedural cutaway lokal.";
          break;
        }
      }

      // 2. Hero scene bespoke Haikei + mc_default.jpg-anchored Kyara if quota permits
      if (bp.is_hero_shot) {
        const hRes = await generateDualDnaHaikei({
          sceneDescription: bp.haikeiPrompt || topic,
          topic,
          mood: bp.satsueiMood,
          geminiApiKey
        });
        if (hRes.ok && hRes.dataUrl) {
          bp.customHaikeiUrl = hRes.dataUrl;
          dualDnaGeneratedCount++;
        }
        const kRes = await generateDualDnaKyara({
          phase: scenes[idx]?.phase || "HOOK",
          poseKey: bp.characterPose,
          poseHint: bp.kyaraExpression || "",
          topic,
          geminiApiKey
        });
        if (kRes.ok && kRes.dataUrl) {
          bp.customKyaraUrl = kRes.dataUrl;
          dualDnaGeneratedCount++;
        }
      }
    }
  }

  return {
    ok: true,
    renderMode: "anime_mappa",
    characterAnchor: "mc_default.jpg",
    directorModel: usedModel || "mappa-2d-fallback",
    customGengaCount,
    dualDnaGeneratedCount,
    dualDnaNote,
    styleAnchors: getStyleAnchorsStatus(),
    directorNotes:
      directorNotes ||
      `Produksi Anime 2D Broadcast Satsuei (${scenes.length} scene • Character Anchor: mc_default.jpg • Full-Screen Cutaways).`,
    scenes: blueprints,
    warning: usedModel ? null : lastError
  };
}
