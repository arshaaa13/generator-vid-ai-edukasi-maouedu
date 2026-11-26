// Studio MAPPA 2D Anime Director & Gemini 2D Genga (原画) Vector Cel Illustrator
// Pure 2D Hand-Drawn Japanese Anime Architecture (ZERO 3D primitives!):
// - Directs authentic Studio MAPPA 2D multiplane compositions (Jujutsu Kaisen / Chainsaw Man / AOT aesthetic)
// - Maps each scene to verified 2D Studio MAPPA painted Haikei backgrounds + transparent 2D Maou Vaelen character cels
// - Synthesizes fresh scene-specific 2D Anime Cel-Shaded SVG Genga illustrations directly via Gemini per scene!
// - Schedules authentic Studio MAPPA 2-3 frame Impact Frames (B&W Manga Invert / Black Flash) & 2D Sakuga VFX

import { callGeminiJson, GEMINI_VIDEO_MODELS } from "./gemini-client.js";

export const ALLOWED_HAIKEI_BGS = new Set([
  "shibuya_night",
  "shrine_twilight",
  "domain_void",
  "tokyo_rooftop",
  "anime_kitchen",
  "anime_lab"
]);

export const ALLOWED_CHAR_POSES = new Set([
  "stance",
  "point_reveal",
  "domain_seal",
  "shock_alert"
]);

export const ALLOWED_SHOT_LAYOUTS = new Set([
  "hero_and_genga_split",
  "dramatic_closeup_domain",
  "genga_hero_focus",
  "wide_establishing_parallax",
  "action_clash_diagonal"
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

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanHex(v, fb = "#38bdf8") {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb;
}

// Strict SVG sanitizer: ensures pure crisp 2D anime vector cel artwork with ZERO scripts/XSS/external URLs!
export function sanitizeGengaSvg(rawSvg) {
  if (typeof rawSvg !== "string") return null;
  const trimmed = rawSvg.trim();
  const match = trimmed.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return null;
  let svg = match[0];

  // Strip dangerous tags & event attributes
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

  // Must contain actual vector shapes (>= 4 shapes)
  const shapeCount = (svg.match(/<(path|polygon|circle|ellipse|rect|polyline|line)\b/gi) || []).length;
  if (shapeCount < 4) return null;
  return svg.slice(0, 14000);
}

// High-craft 2D Studio MAPPA hand-inked fallback Genga SVGs (pure 2D cel art — ZERO 3D!)
export function buildFallback2DGengaSvg(topic = "", narration = "", phase = "HOOK") {
  const txt = `${topic} ${narration}`.toLowerCase();
  const accent = phase === "TAPI" ? "#f43f5e" : phase === "CLIMAX" ? "#fbbf24" : "#38bdf8";

  if (/es krim|susu|mangkuk|dapur|masak|aduk|panci/.test(txt)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">
      <defs>
        <linearGradient id="st" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="55%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#334155"/></linearGradient>
        <linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fde68a"/></linearGradient>
      </defs>
      <ellipse cx="270" cy="430" rx="195" ry="42" fill="#0f172a" opacity="0.45"/>
      <path d="M90 270 C90 420 450 420 450 270 Z" fill="url(#st)" stroke="#07080d" stroke-width="5" stroke-linejoin="round"/>
      <path d="M120 325 C170 390 370 390 420 325 C365 365 175 365 120 325 Z" fill="#1e293b" opacity="0.45"/>
      <ellipse cx="270" cy="270" rx="180" ry="54" fill="#cbd5e1" stroke="#07080d" stroke-width="5"/>
      <ellipse cx="270" cy="276" rx="154" ry="40" fill="url(#cr)" stroke="#07080d" stroke-width="4"/>
      <path d="M210 262 C230 225 310 225 330 262 C305 285 235 285 210 262 Z" fill="#f472b6" stroke="#07080d" stroke-width="4"/>
      <path d="M250 115 L292 128 L272 268 L236 264 Z" fill="#fffbeb" stroke="#07080d" stroke-width="4" stroke-linejoin="round"/>
      <path d="M160 225 C195 190 230 245 205 268 Z" fill="#ffffff" stroke="#07080d" stroke-width="3.5"/>
      <path d="M385 218 C355 190 320 245 342 268 Z" fill="#ffffff" stroke="#07080d" stroke-width="3.5"/>
      <polygon points="435,140 448,172 480,185 448,198 435,230 422,198 390,185 422,172" fill="#fde047" stroke="#07080d" stroke-width="3"/>
      <polygon points="105,155 114,176 135,185 114,194 105,215 96,194 75,185 96,176" fill="${accent}" stroke="#07080d" stroke-width="3"/>
    </svg>`;
  }

  if (/gelas|es batu|embun|kondensasi|kopi|teh|minum/.test(txt)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">
      <defs>
        <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e0f2fe"/><stop offset="60%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0369a1"/></linearGradient>
      </defs>
      <ellipse cx="270" cy="458" rx="140" ry="30" fill="#0f172a" opacity="0.45"/>
      <path d="M155 125 L385 125 L350 445 C325 462 215 462 190 445 Z" fill="url(#gl)" stroke="#07080d" stroke-width="5.5" stroke-linejoin="round"/>
      <path d="M174 225 L366 225 L344 432 C320 446 220 446 196 432 Z" fill="#0ea5e9" stroke="#07080d" stroke-width="4"/>
      <rect x="200" y="195" width="66" height="62" rx="10" transform="rotate(-14 233 226)" fill="#f0f9ff" stroke="#07080d" stroke-width="4"/>
      <rect x="278" y="210" width="62" height="58" rx="10" transform="rotate(16 309 239)" fill="#e0f2fe" stroke="#07080d" stroke-width="4"/>
      <ellipse cx="270" cy="125" rx="115" ry="26" fill="#f0f9ff" stroke="#07080d" stroke-width="5"/>
      <path d="M185 155 L210 155 L196 410 L176 410 Z" fill="#ffffff" opacity="0.65"/>
      <circle cx="156" cy="270" r="13" fill="#e0f2fe" stroke="#07080d" stroke-width="3.5"/>
      <circle cx="384" cy="300" r="16" fill="#e0f2fe" stroke="#07080d" stroke-width="3.5"/>
      <circle cx="368" cy="365" r="11" fill="#e0f2fe" stroke="#07080d" stroke-width="3.5"/>
      <circle cx="176" cy="355" r="10" fill="#e0f2fe" stroke="#07080d" stroke-width="3.5"/>
    </svg>`;
  }

  if (/kipas|dinamo|motor|stator|kapasitor|turbin|listrik|baterai/.test(txt)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">
      <defs>
        <linearGradient id="cu" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="50%" stop-color="#d97706"/><stop offset="100%" stop-color="#78350f"/></linearGradient>
      </defs>
      <circle cx="270" cy="270" r="175" fill="#1e293b" stroke="#07080d" stroke-width="6"/>
      <circle cx="270" cy="270" r="130" fill="#0f172a" stroke="#07080d" stroke-width="5"/>
      <rect x="242" y="96" width="56" height="58" rx="8" fill="url(#cu)" stroke="#07080d" stroke-width="4"/>
      <rect x="242" y="386" width="56" height="58" rx="8" fill="url(#cu)" stroke="#07080d" stroke-width="4"/>
      <rect x="96" y="242" width="58" height="56" rx="8" fill="url(#cu)" stroke="#07080d" stroke-width="4"/>
      <rect x="386" y="242" width="58" height="56" rx="8" fill="url(#cu)" stroke="#07080d" stroke-width="4"/>
      <circle cx="270" cy="270" r="78" fill="#cbd5e1" stroke="#07080d" stroke-width="5"/>
      <circle cx="270" cy="270" r="32" fill="${accent}" stroke="#07080d" stroke-width="4"/>
      <polygon points="350,80 315,170 365,170 300,265 405,155 352,155" fill="${accent}" stroke="#07080d" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="140,340 195,280 165,280 215,215 125,295 162,295" fill="#fde047" stroke="#07080d" stroke-width="3.5" stroke-linejoin="round"/>
    </svg>`;
  }

  if (/pesawat|jet|sr-71|roket|terbang|supersonik/.test(txt)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">
      <defs>
        <linearGradient id="jet" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#475569"/><stop offset="55%" stop-color="#1e293b"/><stop offset="100%" stop-color="#090a0f"/></linearGradient>
      </defs>
      <polygon points="270,58 318,220 478,348 455,392 315,340 296,425 244,425 225,340 85,392 62,348 222,220" fill="url(#jet)" stroke="#07080d" stroke-width="5.5" stroke-linejoin="round"/>
      <polygon points="270,92 292,215 248,215" fill="#94a3b8" opacity="0.4"/>
      <ellipse cx="270" cy="182" rx="18" ry="42" fill="#38bdf8" stroke="#07080d" stroke-width="4"/>
      <polygon points="215,420 250,420 232,512" fill="#f97316" stroke="#07080d" stroke-width="4"/>
      <polygon points="290,420 325,420 308,512" fill="#f97316" stroke="#07080d" stroke-width="4"/>
      <polygon points="224,425 242,425 232,482" fill="#fef08a"/>
      <polygon points="298,425 316,425 308,482" fill="#fef08a"/>
      <path d="M55 150 L185 85" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
      <path d="M485 150 L355 85" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
    </svg>`;
  }

  // Iconic Jujutsu Kaisen Cursed Energy / Tech Core Diagram 2D Cel
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540">
    <defs>
      <radialGradient id="orb" cx="45%" cy="40%" r="55%"><stop offset="0%" stop-color="#ffffff"/><stop offset="45%" stop-color="${accent}"/><stop offset="100%" stop-color="#090a14"/></radialGradient>
    </defs>
    <circle cx="270" cy="270" r="195" fill="none" stroke="${accent}" stroke-width="6" stroke-dasharray="28 14"/>
    <circle cx="270" cy="270" r="152" fill="none" stroke="#07080d" stroke-width="8"/>
    <circle cx="270" cy="270" r="152" fill="none" stroke="#ffffff" stroke-width="3"/>
    <polygon points="270,82 430,358 110,358" fill="none" stroke="${accent}" stroke-width="5" stroke-linejoin="round"/>
    <polygon points="270,458 430,182 110,182" fill="none" stroke="#fbbf24" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="270" cy="270" r="88" fill="url(#orb)" stroke="#07080d" stroke-width="6"/>
    <path d="M180 120 L235 190 L205 195 L250 250" fill="none" stroke="#07080d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M180 120 L235 190 L205 195 L250 250" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M365 425 L310 350 L342 342 L292 285" fill="none" stroke="#07080d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M365 425 L310 350 L342 342 L292 285" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function inferAnime2DTheme(topic = "", scenes = []) {
  const txt = `${topic} ${(scenes || []).map((s) => `${s.componentLabel || ""} ${s.narration || ""}`).join(" ")}`.toLowerCase();

  if (/es krim|dapur|masak|goreng|rebus|kopi|teh|susu|mangkuk|panci|kue|roti|gelas|embun/.test(txt)) {
    return { haikeiBg: "anime_kitchen", satsueiMood: "golden_warm", auraColor: "#38bdf8" };
  }
  if (/kipas|dinamo|motor|bitcoin|server|ai|chip|komputer|baterai|listrik|pltu|bunker|sains|kimia|sel|virus|dna/.test(txt)) {
    return { haikeiBg: "anime_lab", satsueiMood: "jjk_cursed_blue", auraColor: "#38bdf8" };
  }
  if (/pesawat|jet|sr-71|roket|langit|awan|hujan|petir|cuaca|sawah|alam/.test(txt)) {
    return { haikeiBg: "tokyo_rooftop", satsueiMood: "shonen_daylight", auraColor: "#38bdf8" };
  }
  if (/gunung|lava|api|naga|perang|pertarungan|jujutsu|kutukan|iblis|samurai|pedang|ledak/.test(txt)) {
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

  const poseByPhase = {
    HOOK: sceneIndex === 0 ? "stance" : "point_reveal",
    TAPI: "shock_alert",
    JADI: sceneIndex % 2 === 0 ? "point_reveal" : "domain_seal",
    CLIMAX: "domain_seal"
  };
  const characterPose = poseByPhase[phase] || "stance";

  const layoutCycle = ["hero_and_genga_split", "genga_hero_focus", "dramatic_closeup_domain", "action_clash_diagonal"];
  const shotLayout =
    phase === "TAPI"
      ? "action_clash_diagonal"
      : phase === "CLIMAX"
      ? "dramatic_closeup_domain"
      : sceneIndex === 0
      ? "hero_and_genga_split"
      : layoutCycle[sceneIndex % layoutCycle.length];

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
    sakugaVfx2d.push("rain_streaks_2d", "cursed_flames_2d");
  } else if (haikeiBg === "shrine_twilight") {
    sakugaVfx2d.push("embers_petals_2d", "slash_smear_2d");
  } else {
    sakugaVfx2d.push("cursed_flames_2d", "embers_petals_2d");
  }

  const enableImpact = phase === "TAPI" || phase === "CLIMAX";

  return {
    engine: "anime-mappa-2d",
    sceneNumber: scene.sceneNumber || sceneIndex + 1,
    haikeiBg,
    characterPose,
    shotLayout,
    cameraMotion2d,
    satsueiMood,
    auraColor,
    gengaSvg: buildFallback2DGengaSvg(topic, narration, phase),
    gengaTitle: String(scene.componentLabel || topic).slice(0, 32),
    sakugaVfx2d,
    impactBeat: {
      enabled: enableImpact,
      triggerProgress: phase === "TAPI" ? 0.42 : 0.56,
      style: phase === "TAPI" ? "black_flash" : "bw_manga_invert"
    },
    mangaSfxText: phase === "TAPI" ? "ドォォン!!" : phase === "CLIMAX" ? "領域展開!" : sceneIndex === 0 ? "ゴゴゴ..." : "",
    satsueiGrade: {
      bloomStrength: phase === "TAPI" || phase === "CLIMAX" ? 0.52 : 0.34,
      chromaticPeak: enableImpact ? 0.014 : 0.0025,
      contrast: 1.1,
      saturation: 1.16,
      rimIntensity: 0.85
    }
  };
}

export function sanitizeAnimeBlueprint(raw, scene, topic, sceneIndex, totalScenes, theme = null) {
  const fb = inferFallbackAnimeBlueprint(scene, topic, sceneIndex, totalScenes, theme);
  if (!raw || typeof raw !== "object") return fb;

  const haikeiBg = ALLOWED_HAIKEI_BGS.has(raw.haikeiBg) ? raw.haikeiBg : fb.haikeiBg;
  const characterPose = ALLOWED_CHAR_POSES.has(raw.characterPose) ? raw.characterPose : fb.characterPose;
  const shotLayout = ALLOWED_SHOT_LAYOUTS.has(raw.shotLayout) ? raw.shotLayout : fb.shotLayout;
  const cameraMotion2d = ALLOWED_CAMERA_MOTIONS_2D.has(raw.cameraMotion2d) ? raw.cameraMotion2d : fb.cameraMotion2d;
  const satsueiMood = ALLOWED_SATSUEI_MOODS.has(raw.satsueiMood) ? raw.satsueiMood : fb.satsueiMood;
  const auraColor = cleanHex(raw.auraColor, fb.auraColor);

  const cleanSvg = sanitizeGengaSvg(raw.gengaSvg) || fb.gengaSvg;

  const sakugaVfx2d = Array.isArray(raw.sakugaVfx2d)
    ? raw.sakugaVfx2d.filter((v) => ALLOWED_SAKUGA_VFX_2D.has(v)).slice(0, 3)
    : [];

  const rawImp = raw.impactBeat || {};
  const impactBeat = {
    enabled: typeof rawImp.enabled === "boolean" ? rawImp.enabled : fb.impactBeat.enabled,
    triggerProgress: clamp(rawImp.triggerProgress, 0.2, 0.82, fb.impactBeat.triggerProgress),
    style: ALLOWED_IMPACT_STYLES.has(rawImp.style) ? rawImp.style : fb.impactBeat.style
  };

  const rawG = raw.satsueiGrade || {};
  const satsueiGrade = {
    bloomStrength: clamp(rawG.bloomStrength, 0.16, 0.72, fb.satsueiGrade.bloomStrength),
    chromaticPeak: clamp(rawG.chromaticPeak, 0.0, 0.018, fb.satsueiGrade.chromaticPeak),
    contrast: clamp(rawG.contrast, 0.98, 1.22, fb.satsueiGrade.contrast),
    saturation: clamp(rawG.saturation, 0.95, 1.32, fb.satsueiGrade.saturation),
    rimIntensity: clamp(rawG.rimIntensity, 0.35, 1.4, fb.satsueiGrade.rimIntensity)
  };

  return {
    engine: "anime-mappa-2d",
    sceneNumber: scene?.sceneNumber || sceneIndex + 1,
    haikeiBg,
    characterPose,
    shotLayout,
    cameraMotion2d,
    satsueiMood,
    auraColor,
    gengaSvg: cleanSvg,
    gengaTitle: String(raw.gengaTitle || scene?.componentLabel || "").slice(0, 32),
    sakugaVfx2d: sakugaVfx2d.length ? sakugaVfx2d : fb.sakugaVfx2d,
    impactBeat,
    mangaSfxText: String(raw.mangaSfxText || "").slice(0, 22),
    satsueiGrade
  };
}

const MAPPA_2D_DIRECTOR_PROMPT = `Kamu adalah "Studio MAPPA 2D Anime Director & Chief Genga (原画) Illustrator" untuk episode anime 2D sejati bergaya **Jujutsu Kaisen & Chainsaw Man** (100% 2D ANIME — BUKAN 3D!).

Tugasmu menyutradarai setiap scene naskah menjadi cut 2D Anime lengkap dengan:
1. **Latar Lukisan 2D *Haikei* ("haikeiBg") — KONSISTEN DENGAN TOPIK:**
   - "anime_kitchen": dapur apartemen Jepang terang bermandikan sinar pagi (masak, es krim, minuman, gelas, makanan)
   - "anime_lab": markas / bengkel riset gelap dramatis MAPPA dengan layar cyan & lampu meja (motor listrik, komputer, sains, baterai, eksperimen)
   - "shibuya_night": gang malam Shibuya basah hujan berneon (kota, misteri, teknologi, aksi malam)
   - "tokyo_rooftop": atap gedung Tokyo cerah berawan besar ala MAPPA/Shinkai (pesawat, cuaca, langit, luar ruangan)
   - "shrine_twilight": gerbang Torii kuil Jepang senja merah menyala (api, gunung berapi, konflik besar, mitologi)
   - "domain_void": cermin samudra bintang *Domain Expansion* (klimaks epik, laut, antariksa, penjelasan konsep puncak!)
2. **Pose Cel Karakter 2D Maou Vaelen ("characterPose"):**
   - "stance" (pose tenang keren pembuka/penutup)
   - "point_reveal" (menunjuk tegas ke kanan ke arah ilustrasi *Genga* 2D saat menjelaskan!)
   - "domain_seal" (segel jari silang *Domain Expansion* khas Jujutsu Kaisen di momen puncak/penjelasan inti!)
   - "shock_alert" (ekspresi kaget/peringatan intens khas Shibuya untuk momen [TAPI] / bahaya!)
3. **Komposisi Cut 2D ("shotLayout") & Kamera 2.5D *Satsuei* ("cameraMotion2d"):**
   - shotLayout: "hero_and_genga_split" | "genga_hero_focus" | "dramatic_closeup_domain" | "wide_establishing_parallax" | "action_clash_diagonal"
   - cameraMotion2d: "slow_push_in" | "crash_zoom_impact" | "pan_left_to_right" | "pan_right_to_left" | "tilt_up_hero" | "dutch_shibuya_shake" | "breathe_hold"
4. **WAJIB GAMBAR ILUSTRASI 2D *GENGA* SVG UNIK PER SCENE ("gengaSvg"):**
   - Gambar sendiri objek/adegan inti yang HARFIAH dibahas narasi scene ini sebagai **SVG 2D Cel-Shaded Anime murni** (viewBox="0 0 540 540", background transparan)!
   - Pakai garis tinta hitam tegas G-pen (\`stroke="#07080d" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"\`), blok warna flat 2-band/3-band cel shading, kilau specular putih tajam, dan 10–22 elemen \`<path>\`, \`<polygon>\`, \`<ellipse>\`, \`<circle>\`, \`<linearGradient>\` yang rapi & mudah dipahami penonton!
   - DILARANG memasukkan \`<text>\`, \`<script>\`, atau URL luar di dalam SVG!
5. **VFX Sakuga 2D & Impact Frames ("sakugaVfx2d" & "impactBeat"):**
   - sakugaVfx2d (1–3 item): "cursed_flames_2d" | "black_flash_2d" | "slash_smear_2d" | "domain_seal_2d" | "rain_streaks_2d" | "embers_petals_2d" | "anime_sparkles_steam_2d" | "manga_speed_lines_2d"
   - satsueiMood: "jjk_cursed_blue" | "shibuya_neon" | "sukuna_crimson" | "hollow_purple" | "chainsaw_film" | "shonen_daylight" | "golden_warm"
   - impactBeat: aktifkan ("enabled": true) HANYA di momen puncak [TAPI] / benturan / [CLIMAX] dengan style "bw_manga_invert" atau "black_flash"!

Kembalikan HANYA JSON valid:
{
  "directorNotes": "Ringkasan arah seni 2D Studio MAPPA untuk episode ini",
  "scenes": [
    {
      "sceneNumber": 1,
      "haikeiBg": "anime_kitchen",
      "characterPose": "point_reveal",
      "shotLayout": "hero_and_genga_split",
      "cameraMotion2d": "slow_push_in",
      "satsueiMood": "golden_warm",
      "auraColor": "#38bdf8",
      "gengaTitle": "Mangkuk & Tuangan Susu",
      "gengaSvg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 540'>...</svg>",
      "sakugaVfx2d": ["anime_sparkles_steam_2d"],
      "impactBeat": { "enabled": false, "triggerProgress": 0.5, "style": "bw_manga_invert" },
      "mangaSfxText": "ゴゴゴ...",
      "satsueiGrade": { "bloomStrength": 0.34, "chromaticPeak": 0.003, "contrast": 1.1, "saturation": 1.16, "rimIntensity": 0.85 }
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
    throw new Error("Daftar scene kosong untuk Mode Anime 2D Studio MAPPA.");
  }

  const theme = inferAnime2DTheme(topic || title, scenes);
  const memoryBlock =
    Array.isArray(styleMemoryHints) && styleMemoryHints.length
      ? `\nMEMORI KUALITAS VISUAL USER:\n${styleMemoryHints.slice(0, 3).map((h) => `- ${h}`).join("\n")}`
      : "";

  const systemInstruction = [MAPPA_2D_DIRECTOR_PROMPT, memoryBlock].filter(Boolean).join("\n\n");

  // Batch 4 scenes per call so every single scene gets a rich 14-22 path custom 2D Genga SVG without ever truncating!
  const chunkSize = 4;
  const rawMap = new Map();
  let usedModel = null;
  let lastError = null;
  let directorNotes = "";

  const batches = [];
  for (let start = 0; start < scenes.length; start += chunkSize) {
    batches.push({ start, slice: scenes.slice(start, start + chunkSize) });
  }

  // Run up to 2 batches concurrently for speed while staying gentle on Gemini rate limits
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
REKOMENDASI HAIKEI KONSISTEN: "${theme.haikeiBg}" (boleh berpindah ke "domain_void" saat CLIMAX epik!)
BATCH SCENE ${compact[0].sceneNumber}..${compact[compact.length - 1].sceneNumber} dari ${scenes.length} scene:
${JSON.stringify(compact, null, 2)}

Sutradarai & GAMBAR ilustrasi 2D cel-shaded "gengaSvg" unik bergaya Studio MAPPA untuk SEMUA ${compact.length} scene pada batch ini!`;

        const res = await callGeminiJson({
          geminiApiKey,
          systemInstruction,
          userPrompt,
          temperature: 0.62,
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

  return {
    ok: true,
    renderMode: "anime_mappa",
    directorModel: usedModel || "mappa-2d-fallback",
    customGengaCount,
    directorNotes:
      directorNotes ||
      `Produksi Anime 2D Studio MAPPA (${scenes.length} scene penuh, ${customGengaCount} Genga SVG 2D asli).`,
    scenes: blueprints,
    warning: usedModel ? null : lastError
  };
}
