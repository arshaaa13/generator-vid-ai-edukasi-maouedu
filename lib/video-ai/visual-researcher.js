// Stage 0: Online Visual Reference Researcher & Grounded 3D World Architect
// Researches real-world object forms, materials, and room architecture from Wikipedia ID/EN & Wikimedia Commons,
// then locks ONE coherent architectural set (worldFoundation) + ONE reusable persistent assetCatalog across all scenes
// so animations stay structured, physically grounded, and 100% synced to the script without random sci-fi clutter.

import { callGeminiJson, GEMINI_VIDEO_MODELS } from "./gemini-client.js";
import { sanitizeCustomRig } from "./mesh-synthesizer.js";

export const ALLOWED_ROOM_TYPES = new Set([
  "kitchen_counter",
  "oak_workshop",
  "cozy_room",
  "science_lab",
  "backyard_yard",
  "farm_field",
  "house_cross_section",
  "runway_outdoor",
  "street_exterior",
  "underwater_bed",
  "volcanic_outdoor",
  "arctic_outdoor",
  "space_orbit"
]);

export const ALLOWED_LIGHTING_PRESETS = new Set([
  // Clean natural Pixar/Blender-Cycles daylight studio presets (DEFAULT!)
  "soft_daylight",
  "warm_kitchen",
  "clean_workshop",
  "outdoor_sunlight",
  "cozy_indoor",
  "cool_lab",
  // Situational presets (ONLY when explicitly justified by topic/scene narration!)
  "deep_ocean",
  "arctic_ice",
  "night_dim",
  "warm_alert",
  "volcanic_forge",
  "cyber_dark"
]);

export const ALLOWED_SURFACE_TYPES = new Set([
  "wooden_table",
  "kitchen_counter",
  "lab_bench",
  "concrete_floor",
  "grass_lawn",
  "soil_cutaway",
  "asphalt",
  "water_bed",
  "ice_sheet",
  "none"
]);

export const ALLOWED_WALL_MATERIALS = new Set([
  "ceramic_tile",
  "warm_plaster",
  "red_brick",
  "wood_panel",
  "pegboard",
  "concrete",
  "lab_panel"
]);

export const ALLOWED_SHELF_ITEMS = new Set(["jar", "plant", "mug", "books", "tools", "bottle"]);

export const ALLOWED_MATERIALS = new Set([
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

export const ALLOWED_PREFABS_GROUNDED = new Set([
  // Grounded Everyday Household, Kitchen, Room & Experiment Props (NEW hollow Lathe & beveled furniture!)
  "hollow_bowl",
  "glass_cup",
  "jar_bottle",
  "plate_dish",
  "cutting_board",
  "whisk_spoon",
  "stove_burner",
  "bucket_tub",
  "wooden_table",
  "bookshelf_cabinet",
  "whiteboard_chart",
  "potted_plant",
  "ice_cube_tray",
  "salt_shaker",
  // Existing Culinary / Science / Engineering / Nature / Character Prefabs
  "human_protagonist",
  "ice_cream_bowl",
  "coffee_espresso",
  "cooking_pot",
  "chemistry_flask",
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
  "thermal_plates",
  "rebar_structure",
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
  "volcano_peak",
  "tree_lush",
  "palm_tree",
  "mountain_peak",
  "crystal_cluster",
  "crystal_core",
  "pipe_curved",
  "wire_arc",
  "water_surface",
  "magma_pool",
  "bevel_chassis",
  "metallic_cylinder",
  "gear_wheel",
  "propeller_fan",
  "helix_coil",
  // Sci-fi only (auto-filtered out on everyday grounded topics!)
  "hologram_ring",
  "neon_tube",
  "energy_sphere"
]);

const SCIFI_ONLY_PREFABS = new Set(["hologram_ring", "neon_tube", "energy_sphere"]);

const OBJECT_VISUAL_LEXICON = [
  { re: /mangkuk|mangkok|baskom|wadah/i, en: "Mixing bowl", id: "Mangkuk", hint: "cekung berongga (hollow concave) dengan dinding tipis & bibir melingkar rapi" },
  { re: /gelas|cangkir|mug|kopi|teh|minum/i, en: "Drinking glass", id: "Gelas", hint: "silinder kaca/keramik berongga transparan dengan cairan & es di dalam" },
  { re: /panci|wajan|kompor|rebus|goreng|masak/i, en: "Cookware and bakeware", id: "Panci", hint: "panci logam berongga dengan gagang samping di atas tungku kompor" },
  { re: /dapur|es krim|resep|kue|roti|adonan|susu/i, en: "Kitchen countertop", id: "Dapur", hint: "meja konter dapur keramik/kayu bersih + backsplash ubin + rak bumbu & jendela" },
  { re: /meja|bangku|bengkel|kamar|ruangan/i, en: "Table (furniture)", id: "Meja kayu", hint: "meja kayu oak tebal berpinggir tumpul (beveled) dengan 4 kaki kokoh di lantai" },
  { re: /dinding|tembok|keramik|rumah|bunker/i, en: "Wall", id: "Dinding", hint: "dinding sudut ruangan dengan list bawah (baseboard), jendela cahaya alami, & rak rapi" },
  { re: /akuarium|ikan|cupang|arwana|kolam|filter/i, en: "Aquarium", id: "Akuarium", hint: "tangki kaca bening berisi air & sistem filter bersekat rapi di atas alas kokoh" },
  { re: /kipas|dinamo|motor listrik|stator|kapasitor|turbin/i, en: "Electric motor", id: "Motor listrik", hint: "kumparan tembaga melingkar + rotor kipas di atas meja kerja kayu terang" },
  { re: /baterai|panel surya|listrik|pltu|energi/i, en: "Battery (electricity)", id: "Baterai", hint: "sel silinder/kotak terhubung kabel rapi dengan arah aliran arus jelas" },
  { re: /pesawat|jet|sr-71|bandara|aerodinamika/i, en: "Supersonic aircraft", id: "Pesawat jet", hint: "badan pesawat ramping di landasan aspal bandara cerah dengan detail pelat logam" },
  { re: /sawah|padi|petani|irigasi|parit|tanam/i, en: "Paddy field", id: "Sawah", hint: "petak sawah hijau + parit air mengalir jernih di bawah langit siang natural" },
  { re: /sendok|pengaduk|mixer|whisk/i, en: "Whisk", id: "Pengaduk", hint: "sendok kayu atau pengocok logam melingkar untuk mengaduk di dalam mangkuk" },
  { re: /botol|toples|garam|gula/i, en: "Glass bottle", id: "Botol", hint: "botol/toples berleher ramping yang bisa dimiringkan untuk menuang isi ke wadah" },
  { re: /es batu|embun|kondensasi|beku|freezer|kulkas/i, en: "Condensation", id: "Kondensasi", hint: "butiran air halus di dinding luar gelas dingin & kristal es jernih di dalam" }
];

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanHex(v, fb = "#d97706") {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb;
}

export function isSciFiTopic(text = "") {
  return /cyberpunk|sci-?fi|futurist|hologram|laser|neon|alien|luar angkasa|antariksa|orbit|galaksi|kuantum|plasma|naga api/i.test(
    String(text || "")
  );
}

export function extractVisualSearchTerms(topic = "", scenes = []) {
  const combined = [
    topic,
    ...(Array.isArray(scenes) ? scenes.map((s) => `${s.componentLabel || ""} ${s.plainNarration || s.narration || ""}`) : [])
  ].join(" ");

  const matched = [];
  const seenEn = new Set();
  for (const item of OBJECT_VISUAL_LEXICON) {
    if (item.re.test(combined) && !seenEn.has(item.en)) {
      seenEn.add(item.en);
      matched.push(item);
      if (matched.length >= 4) break;
    }
  }
  return matched;
}

async function fetchWikiSummary(lang, query) {
  try {
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&utf8=&format=json&srlimit=1`;
    const sResp = await fetch(searchUrl, {
      headers: { "User-Agent": "MaouEduVisualResearcher/4.0" },
      signal: AbortSignal.timeout(6000)
    });
    if (!sResp.ok) return null;
    const sData = await sResp.json();
    const hit = sData?.query?.search?.[0];
    if (!hit?.title) return null;

    const extUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
      hit.title
    )}&format=json`;
    const eResp = await fetch(extUrl, {
      headers: { "User-Agent": "MaouEduVisualResearcher/4.0" },
      signal: AbortSignal.timeout(6000)
    });
    if (!eResp.ok) return null;
    const eData = await eResp.json();
    const page = Object.values(eData?.query?.pages || {})[0];
    if (!page?.extract) return null;
    const shortText = page.extract.split(/\.\s+/).slice(0, 2).join(". ").slice(0, 260);
    return {
      source: lang === "id" ? "Wikipedia ID" : "Wikipedia EN",
      title: page.title,
      url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      visualNote: shortText
    };
  } catch {
    return null;
  }
}

async function fetchCommonsVisualRef(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(
      query
    )}&utf8=&format=json&srlimit=2`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "MaouEduVisualResearcher/4.0" },
      signal: AbortSignal.timeout(6000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const hits = data?.query?.search || [];
    if (!hits.length) return null;
    const best = hits[0];
    const cleanFile = String(best.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, "").replace(/_/g, " ");
    const cleanSnippet = String(best.snippet || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
    return {
      source: "Wikimedia Commons",
      title: cleanFile.slice(0, 80),
      url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.title.replace(/ /g, "_"))}`,
      visualNote: cleanSnippet || `Referensi visual bentuk nyata: ${cleanFile}`
    };
  } catch {
    return null;
  }
}

function cleanVisualSearchTopic(raw = "") {
  return String(raw || "")
    .replace(
      /\b(cara|bikin|buat|membuat|kenapa|mengapa|bagaimana|pakai|dengan|tanpa|mesin|mahal|murah|agar|supaya|yang|di|ke|dari|luar|dalam|bisa|jadi|anti|gagal|mudah|cepat|lembut)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");
}

export async function fetchOnlineVisualReferences(topic = "", scenes = []) {
  const matchedLexicon = extractVisualSearchTerms(topic, scenes);
  const shortIdTopic = cleanVisualSearchTopic(topic) || matchedLexicon[0]?.id || topic;
  const queries = [];

  if (shortIdTopic) queries.push({ lang: "id", q: shortIdTopic });
  for (const item of matchedLexicon.slice(0, 3)) {
    queries.push({ lang: "en", q: item.en });
  }

  const tasks = [];
  if (shortIdTopic) {
    tasks.push(fetchWikiSummary("id", shortIdTopic));
  }
  if (matchedLexicon[0]?.en) {
    tasks.push(fetchCommonsVisualRef(matchedLexicon[0].en));
  } else if (shortIdTopic) {
    tasks.push(fetchCommonsVisualRef(shortIdTopic));
  }
  for (const item of matchedLexicon.slice(0, 2)) {
    tasks.push(fetchWikiSummary("en", item.en));
  }

  const results = await Promise.all(tasks);
  const references = [];
  const seenUrls = new Set();

  for (const r of results) {
    if (r && r.url && !seenUrls.has(r.url)) {
      seenUrls.add(r.url);
      references.push(r);
    }
  }

  // Always include grounded architectural form cues from matched everyday lexicon
  const formNotes = matchedLexicon.map((m) => `${m.id} (${m.en}): ${m.hint}`);

  return {
    queries: queries.map((x) => x.q),
    references: references.slice(0, 4),
    formNotes
  };
}

export function inferGroundedWorldFallback(topic = "", scenes = []) {
  const allText = `${topic} ${(scenes || []).map((s) => `${s.componentLabel || ""} ${s.narration || ""}`).join(" ")}`.toLowerCase();
  const scifi = isSciFiTopic(allText);

  let worldFoundation = {
    roomType: "oak_workshop",
    lightingPreset: "soft_daylight",
    surface: {
      type: "wooden_table",
      materialColor: "#b87a42",
      width: 5.4,
      depth: 3.2
    },
    walls: {
      enabled: true,
      backWallMaterial: "warm_plaster",
      backWallColor: "#f3ece1",
      sideWallEnabled: true,
      hasBaseboard: true,
      hasWindow: true,
      hasShelf: true,
      shelfItems: ["plant", "books", "jar"]
    },
    colorPalette: {
      primary: "#0d9488",
      secondary: "#d97706",
      surface: "#b87a42",
      wall: "#f3ece1",
      accent: "#2563eb"
    },
    storySummary: `Set meja kerja kayu oak terang & dinding ruangan natural untuk menjelaskan "${topic}" secara runtut dan mudah dipahami.`
  };

  const assetCatalog = [
    {
      id: "ipul_host",
      name: "Ipul",
      prefab: "human_protagonist",
      color: "#0d9488",
      secondaryColor: "#f59e0b",
      materialType: "matte_clay",
      defaultScale: 0.92,
      supportType: "surface",
      physicalRole: "character",
      visualNotes: "Karakter peraga di sisi kiri-belakang meja agar tidak menutupi objek utama."
    }
  ];

  if (/es krim|dapur|masak|goreng|rebus|kue|roti|adonan|kopi|teh|susu|mangkuk|mangkok|panci|kompor/.test(allText)) {
    worldFoundation = {
      roomType: "kitchen_counter",
      lightingPreset: "warm_kitchen",
      surface: {
        type: "kitchen_counter",
        materialColor: "#d6b58d",
        width: 5.6,
        depth: 3.1
      },
      walls: {
        enabled: true,
        backWallMaterial: "ceramic_tile",
        backWallColor: "#fbf7f0",
        sideWallEnabled: true,
        hasBaseboard: true,
        hasWindow: true,
        hasShelf: true,
        shelfItems: ["jar", "mug", "plant"]
      },
      colorPalette: {
        primary: "#f472b6",
        secondary: "#e2e8f0",
        surface: "#d6b58d",
        wall: "#fbf7f0",
        accent: "#0284c7"
      },
      storySummary: `Set meja dapur kayu bersih berlatar dinding keramik terang + jendela matahari pagi untuk praktek "${topic}".`
    };

    if (/es krim/.test(allText)) {
      assetCatalog.push(
        {
          id: "mangkuk_adonan",
          name: "Mangkuk Stainless",
          prefab: "hollow_bowl",
          color: "#cbd5e1",
          secondaryColor: "#fef3c7",
          materialType: "brushed_steel",
          defaultScale: 1.05,
          supportType: "surface",
          physicalRole: "container",
          visualNotes: "Mangkuk cekung stainless berongga berisi adonan susu krim putih."
        },
        {
          id: "baskom_es",
          name: "Baskom Es & Garam",
          prefab: "bucket_tub",
          color: "#38bdf8",
          secondaryColor: "#e0f2fe",
          materialType: "glossy_plastic",
          defaultScale: 1.12,
          supportType: "surface",
          physicalRole: "container",
          visualNotes: "Wadah baskom luar berisi es batu & taburan garam."
        },
        {
          id: "botol_susu",
          name: "Botol Susu & Gula",
          prefab: "jar_bottle",
          color: "#f8fafc",
          secondaryColor: "#f472b6",
          materialType: "glass_crystal",
          defaultScale: 0.92,
          supportType: "surface",
          physicalRole: "ingredient",
          visualNotes: "Botol kaca bening berisi susu cair untuk dituang ke mangkuk."
        },
        {
          id: "pengocok_adonan",
          name: "Sendok Pengaduk",
          prefab: "whisk_spoon",
          color: "#b45309",
          secondaryColor: "#cbd5e1",
          materialType: "wood_oak",
          defaultScale: 0.95,
          supportType: "inside_container",
          physicalRole: "tool",
          visualNotes: "Pengaduk dapur untuk mengaduk adonan es krim di dalam mangkuk."
        },
        {
          id: "wadah_garam",
          name: "Taburan Garam",
          prefab: "salt_shaker",
          color: "#f1f5f9",
          secondaryColor: "#94a3b8",
          materialType: "glass_crystal",
          defaultScale: 0.85,
          supportType: "surface",
          physicalRole: "ingredient",
          visualNotes: "Botol garam dapur untuk menurunkan titik beku es."
        }
      );
    } else if (/kopi|teh|gelas|embun|kondensasi|minum/.test(allText)) {
      assetCatalog.push(
        {
          id: "gelas_utama",
          name: "Gelas Kaca",
          prefab: "glass_cup",
          color: "#e0f2fe",
          secondaryColor: "#38bdf8",
          materialType: "glass_crystal",
          defaultScale: 1.05,
          supportType: "surface",
          physicalRole: "container",
          visualNotes: "Gelas kaca bening berongga berisi air/minuman dingin atau hangat."
        },
        {
          id: "talenan_alas",
          name: "Alas Kayu",
          prefab: "cutting_board",
          color: "#c08446",
          secondaryColor: "#92400e",
          materialType: "wood_oak",
          defaultScale: 0.95,
          supportType: "surface",
          physicalRole: "prop",
          visualNotes: "Talenan kayu bersih di atas meja dapur."
        },
        {
          id: "teko_tuang",
          name: "Botol / Teko",
          prefab: "jar_bottle",
          color: "#f8fafc",
          secondaryColor: "#92400e",
          materialType: "ceramic",
          defaultScale: 0.92,
          supportType: "surface",
          physicalRole: "ingredient",
          visualNotes: "Wadah tuang minuman atau air."
        }
      );
    } else {
      assetCatalog.push(
        {
          id: "kompor_dapur",
          name: "Kompor Dapur",
          prefab: "stove_burner",
          color: "#334155",
          secondaryColor: "#94a3b8",
          materialType: "brushed_steel",
          defaultScale: 1.0,
          supportType: "surface",
          physicalRole: "machine",
          visualNotes: "Tungku kompor rapi di tengah meja dapur."
        },
        {
          id: "panci_masak",
          name: "Panci Masak",
          prefab: "cooking_pot",
          color: "#cbd5e1",
          secondaryColor: "#475569",
          materialType: "brushed_steel",
          defaultScale: 1.02,
          supportType: "surface",
          physicalRole: "container",
          visualNotes: "Panci logam berongga dengan gagang samping."
        },
        {
          id: "mangkuk_bahan",
          name: "Mangkuk Bahan",
          prefab: "hollow_bowl",
          color: "#f8fafc",
          secondaryColor: "#fbbf24",
          materialType: "ceramic",
          defaultScale: 0.9,
          supportType: "surface",
          physicalRole: "container",
          visualNotes: "Mangkuk keramik cekung di samping panci."
        },
        {
          id: "sendok_masak",
          name: "Sendok Kayu",
          prefab: "whisk_spoon",
          color: "#b45309",
          secondaryColor: "#d97706",
          materialType: "wood_oak",
          defaultScale: 0.95,
          supportType: "inside_container",
          physicalRole: "tool",
          visualNotes: "Sendok kayu pengaduk."
        }
      );
    }
  } else if (/gelas|es batu|embun|kondensasi|air dingin|es\b/.test(allText)) {
    worldFoundation = {
      roomType: "cozy_room",
      lightingPreset: "soft_daylight",
      surface: {
        type: "wooden_table",
        materialColor: "#b87a42",
        width: 5.4,
        depth: 3.2
      },
      walls: {
        enabled: true,
        backWallMaterial: "warm_plaster",
        backWallColor: "#f5efe6",
        sideWallEnabled: true,
        hasBaseboard: true,
        hasWindow: true,
        hasShelf: true,
        shelfItems: ["plant", "books"]
      },
      colorPalette: {
        primary: "#38bdf8",
        secondary: "#e0f2fe",
        surface: "#b87a42",
        wall: "#f5efe6",
        accent: "#0284c7"
      },
      storySummary: `Meja kayu terang dekat jendela ruangan untuk mengamati fenomena "${topic}" secara dekat dan jelas.`
    };
    assetCatalog.push(
      {
        id: "gelas_es",
        name: "Gelas Air Es",
        prefab: "glass_cup",
        color: "#e0f2fe",
        secondaryColor: "#38bdf8",
        materialType: "glass_crystal",
        defaultScale: 1.15,
        supportType: "surface",
        physicalRole: "container",
        visualNotes: "Gelas kaca bening berongga berisi air dingin & es batu."
      },
      {
        id: "piring_tatakan",
        name: "Tatakan Piring",
        prefab: "plate_dish",
        color: "#f8fafc",
        secondaryColor: "#cbd5e1",
        materialType: "ceramic",
        defaultScale: 1.0,
        supportType: "surface",
        physicalRole: "prop",
        visualNotes: "Piring tatakan keramik putih di bawah gelas."
      },
      {
        id: "botol_air",
        name: "Botol Air",
        prefab: "jar_bottle",
        color: "#bae6fd",
        secondaryColor: "#0284c7",
        materialType: "glass_crystal",
        defaultScale: 0.9,
        supportType: "surface",
        physicalRole: "ingredient",
        visualNotes: "Botol air di sebelah kanan gelas."
      }
    );
  } else if (/akuarium|cupang|arwana|kolam|pari|ikan|filter/.test(allText)) {
    const isPond = /kolam|pari/.test(allText);
    worldFoundation = {
      roomType: isPond ? "backyard_yard" : "cozy_room",
      lightingPreset: isPond ? "outdoor_sunlight" : "soft_daylight",
      surface: {
        type: isPond ? "grass_lawn" : "wooden_table",
        materialColor: isPond ? "#5c8c2c" : "#b87a42",
        width: 5.8,
        depth: 3.6
      },
      walls: {
        enabled: true,
        backWallMaterial: isPond ? "red_brick" : "warm_plaster",
        backWallColor: isPond ? "#b55239" : "#f3ece1",
        sideWallEnabled: !isPond,
        hasBaseboard: !isPond,
        hasWindow: !isPond,
        hasShelf: !isPond,
        shelfItems: ["plant", "jar"]
      },
      colorPalette: {
        primary: "#0ea5e9",
        secondary: "#10b981",
        surface: isPond ? "#5c8c2c" : "#b87a42",
        wall: isPond ? "#b55239" : "#f3ece1",
        accent: "#f59e0b"
      },
      storySummary: `Lingkungan ${isPond ? "halaman belakang dengan dinding bata" : "meja ruang tamu terang"} untuk menampilkan sistem air & ikan pada "${topic}".`
    };
    assetCatalog.push(
      {
        id: "tangki_air",
        name: "Akuarium / Kolam Kaca",
        prefab: "glass_aquarium",
        color: "#0ea5e9",
        secondaryColor: "#334155",
        materialType: "glass_crystal",
        defaultScale: 1.05,
        supportType: "surface",
        physicalRole: "container",
        visualNotes: "Tangki kaca bening bertumpu rata di meja/lantai."
      },
      {
        id: "ikan_utama",
        name: "Ikan",
        prefab: /pari/.test(allText) ? "stingray" : /arwana/.test(allText) ? "fish_arowana" : "fish_betta",
        color: /arwana/.test(allText) ? "#ef4444" : "#2563eb",
        secondaryColor: "#fbbf24",
        materialType: "glossy_plastic",
        defaultScale: 0.72,
        supportType: "inside_container",
        physicalRole: "hero_subject",
        visualNotes: "Ikan berenang di dalam tangki kaca."
      },
      {
        id: "filter_air",
        name: "Filter 3 Sekat",
        prefab: "filter_sump",
        color: "#38bdf8",
        secondaryColor: "#475569",
        materialType: "glass_crystal",
        defaultScale: 0.85,
        supportType: "surface",
        physicalRole: "machine",
        visualNotes: "Bak filter mekanis & biologis di sebelah tangki utama."
      }
    );
  } else if (/sawah|padi|petani|minapadi|irigasi|tanam/.test(allText)) {
    worldFoundation = {
      roomType: "farm_field",
      lightingPreset: "outdoor_sunlight",
      surface: { type: "grass_lawn", materialColor: "#65a30d", width: 8, depth: 6 },
      walls: { enabled: false, backWallMaterial: "warm_plaster", backWallColor: "#f3ece1", sideWallEnabled: false, hasBaseboard: false, hasWindow: false, hasShelf: false, shelfItems: [] },
      colorPalette: { primary: "#65a30d", secondary: "#0ea5e9", surface: "#65a30d", wall: "#bae6fd", accent: "#f59e0b" },
      storySummary: `Diorama petak sawah & aliran parit air terbuka siang hari untuk "${topic}".`
    };
    assetCatalog.push(
      { id: "air_parit", name: "Aliran Air Sawah", prefab: "water_surface", color: "#0ea5e9", secondaryColor: "#bae6fd", materialType: "water_clear", defaultScale: 0.9, supportType: "surface", physicalRole: "container", visualNotes: "Permukaan air parit sawah." },
      { id: "pohon_sawah", name: "Pohon Kelapa", prefab: "palm_tree", color: "#22c55e", secondaryColor: "#78350f", materialType: "matte_clay", defaultScale: 1.0, supportType: "surface", physicalRole: "prop", visualNotes: "Pohon di pinggir pematang sawah." }
    );
  } else if (/pesawat|jet|sr-71|bandara|supersonik/.test(allText)) {
    worldFoundation = {
      roomType: "runway_outdoor",
      lightingPreset: "outdoor_sunlight",
      surface: { type: "asphalt", materialColor: "#334155", width: 8, depth: 6 },
      walls: { enabled: false, backWallMaterial: "concrete", backWallColor: "#cbd5e1", sideWallEnabled: false, hasBaseboard: false, hasWindow: false, hasShelf: false, shelfItems: [] },
      colorPalette: { primary: "#334155", secondary: "#f59e0b", surface: "#334155", wall: "#93c5fd", accent: "#ef4444" },
      storySummary: `Landasan aspal bandara siang cerah untuk menjelaskan "${topic}".`
    };
    assetCatalog.push(
      { id: "pesawat_utama", name: "Pesawat Jet", prefab: "aircraft_jet", color: "#1e293b", secondaryColor: "#94a3b8", materialType: "brushed_steel", defaultScale: 1.0, supportType: "surface", physicalRole: "hero_subject", visualNotes: "Pesawat jet rapi di landasan." },
      { id: "pelat_logam", name: "Pelat Titanium", prefab: "thermal_plates", color: "#64748b", secondaryColor: "#f97316", materialType: "brushed_steel", defaultScale: 0.85, supportType: "surface", physicalRole: "prop", visualNotes: "Susunan pelat logam pemuaian." }
    );
  } else if (/bitcoin|bunker|rumah|pltu|tambang/.test(allText)) {
    worldFoundation = {
      roomType: "house_cross_section",
      lightingPreset: "cozy_indoor",
      surface: { type: "concrete_floor", materialColor: "#94a3b8", width: 6, depth: 3.6 },
      walls: { enabled: true, backWallMaterial: "warm_plaster", backWallColor: "#f5ebd8", sideWallEnabled: true, hasBaseboard: true, hasWindow: true, hasShelf: false, shelfItems: [] },
      colorPalette: { primary: "#f59e0b", secondary: "#334155", surface: "#94a3b8", wall: "#f5ebd8", accent: "#0ea5e9" },
      storySummary: `Potongan ruangan rumah & ruang mesin terstruktur untuk "${topic}".`
    };
    assetCatalog.push(
      { id: "mesin_utama", name: "Mesin Rakitan", prefab: "asic_miner", color: "#334155", secondaryColor: "#38bdf8", materialType: "brushed_steel", defaultScale: 1.0, supportType: "surface", physicalRole: "machine", visualNotes: "Unit mesin utama dengan kipas pendingin." },
      { id: "panel_surya", name: "Panel Surya", prefab: "solar_array", color: "#1d4ed8", secondaryColor: "#cbd5e1", materialType: "glass_crystal", defaultScale: 0.9, supportType: "surface", physicalRole: "machine", visualNotes: "Panel surya sumber listrik." }
    );
  } else if (/roket|antariksa|planet|orbit|satelit/.test(allText)) {
    worldFoundation = {
      roomType: "space_orbit",
      lightingPreset: "night_dim",
      surface: { type: "none", materialColor: "#1e293b", width: 6, depth: 4 },
      walls: { enabled: false, backWallMaterial: "concrete", backWallColor: "#0f172a", sideWallEnabled: false, hasBaseboard: false, hasWindow: false, hasShelf: false, shelfItems: [] },
      colorPalette: { primary: "#f8fafc", secondary: "#f97316", surface: "#1d4ed8", wall: "#0f172a", accent: "#38bdf8" },
      storySummary: `Lintasan orbit luar angkasa dengan cakrawala planet bumi untuk "${topic}".`
    };
    assetCatalog.push({
      id: "roket_utama",
      name: "Roket",
      prefab: "rocket_ship",
      color: "#f8fafc",
      secondaryColor: "#ef4444",
      materialType: "brushed_steel",
      defaultScale: 1.0,
      supportType: "floating",
      physicalRole: "hero_subject",
      visualNotes: "Roket meluncur tegak di orbit."
    });
  } else if (/kipas|dinamo|motor|baterai|listrik|turbin|mesin|robot|sains|eksperimen|kimia|fisika/.test(allText)) {
    const isLab = /kimia|eksperimen|sains|mikroskop|sel|bakteri|lab/.test(allText);
    worldFoundation = {
      roomType: isLab ? "science_lab" : "oak_workshop",
      lightingPreset: isLab ? "cool_lab" : "clean_workshop",
      surface: {
        type: isLab ? "lab_bench" : "wooden_table",
        materialColor: isLab ? "#e2e8f0" : "#b87a42",
        width: 5.5,
        depth: 3.2
      },
      walls: {
        enabled: true,
        backWallMaterial: isLab ? "lab_panel" : "pegboard",
        backWallColor: isLab ? "#f1f5f9" : "#e8dfd1",
        sideWallEnabled: true,
        hasBaseboard: true,
        hasWindow: true,
        hasShelf: true,
        shelfItems: isLab ? ["jar", "bottle", "books"] : ["tools", "jar", "plant"]
      },
      colorPalette: {
        primary: "#2563eb",
        secondary: "#d97706",
        surface: isLab ? "#e2e8f0" : "#b87a42",
        wall: isLab ? "#f1f5f9" : "#e8dfd1",
        accent: "#10b981"
      },
      storySummary: `Meja ${isLab ? "laboratorium bersih terang" : "bengkel kayu oak + dinding pegboard"} untuk membedah "${topic}" secara jelas.`
    };
    const mainPrefab = /kipas|dinamo|motor/.test(allText)
      ? "copper_stator_motor"
      : /turbin/.test(allText)
      ? "turbine_generator"
      : /baterai/.test(allText)
      ? "battery_reactor"
      : /robot/.test(allText)
      ? "robot_arm"
      : isLab
      ? "chemistry_flask"
      : "bevel_chassis";

    assetCatalog.push(
      {
        id: "objek_utama",
        name: topic.slice(0, 28) || "Objek Utama",
        prefab: mainPrefab,
        color: mainPrefab === "copper_stator_motor" ? "#d97706" : "#38bdf8",
        secondaryColor: "#64748b",
        materialType: mainPrefab === "chemistry_flask" ? "glass_crystal" : "brushed_steel",
        defaultScale: 1.0,
        supportType: "surface",
        physicalRole: "hero_subject",
        visualNotes: `Objek eksperimen utama di tengah meja kerja.`
      },
      {
        id: "papan_diagram",
        name: "Papan Skema",
        prefab: "whiteboard_chart",
        color: "#f8fafc",
        secondaryColor: "#334155",
        materialType: "ceramic",
        defaultScale: 0.9,
        supportType: "surface",
        physicalRole: "prop",
        visualNotes: "Papan kecil penjelas data di latar belakang."
      }
    );
  } else {
    if (scifi) {
      worldFoundation.lightingPreset = "cyber_dark";
    }
    assetCatalog.push(
      {
        id: "objek_utama",
        name: topic.slice(0, 28) || "Model Utama",
        prefab: "bevel_chassis",
        color: "#2563eb",
        secondaryColor: "#e2e8f0",
        materialType: "matte_clay",
        defaultScale: 1.0,
        supportType: "surface",
        physicalRole: "hero_subject",
        visualNotes: "Model utama bertumpu mantap di tengah meja."
      },
      {
        id: "papan_penjelas",
        name: "Papan Data",
        prefab: "whiteboard_chart",
        color: "#f8fafc",
        secondaryColor: "#475569",
        materialType: "ceramic",
        defaultScale: 0.9,
        supportType: "surface",
        physicalRole: "prop",
        visualNotes: "Papan grafik edukasi di kanan meja."
      }
    );
  }

  return { worldFoundation, assetCatalog };
}

export function sanitizeVisualPlan(raw, topic = "", scenes = [], onlineRefs = null) {
  const fallback = inferGroundedWorldFallback(topic, scenes);
  const allText = `${topic} ${(scenes || []).map((s) => s.narration || "").join(" ")}`;
  const allowSciFi = isSciFiTopic(allText);

  const rawWorld = raw?.worldFoundation || {};
  const roomType = ALLOWED_ROOM_TYPES.has(rawWorld.roomType) ? rawWorld.roomType : fallback.worldFoundation.roomType;

  let lightingPreset = ALLOWED_LIGHTING_PRESETS.has(rawWorld.lightingPreset)
    ? rawWorld.lightingPreset
    : fallback.worldFoundation.lightingPreset;
  // Block accidental cyberpunk dark disco lighting on everyday topics!
  if (lightingPreset === "cyber_dark" && !allowSciFi) {
    lightingPreset = fallback.worldFoundation.lightingPreset;
  }

  const rawSurface = rawWorld.surface || {};
  const surface = {
    type: ALLOWED_SURFACE_TYPES.has(rawSurface.type) ? rawSurface.type : fallback.worldFoundation.surface.type,
    materialColor: cleanHex(rawSurface.materialColor, fallback.worldFoundation.surface.materialColor),
    width: clamp(rawSurface.width, 3.2, 9.0, fallback.worldFoundation.surface.width),
    depth: clamp(rawSurface.depth, 2.2, 7.0, fallback.worldFoundation.surface.depth)
  };

  const rawWalls = rawWorld.walls || {};
  const shelfItems = Array.isArray(rawWalls.shelfItems)
    ? rawWalls.shelfItems.filter((x) => ALLOWED_SHELF_ITEMS.has(x)).slice(0, 4)
    : fallback.worldFoundation.walls.shelfItems;

  const walls = {
    enabled: typeof rawWalls.enabled === "boolean" ? rawWalls.enabled : fallback.worldFoundation.walls.enabled,
    backWallMaterial: ALLOWED_WALL_MATERIALS.has(rawWalls.backWallMaterial)
      ? rawWalls.backWallMaterial
      : fallback.worldFoundation.walls.backWallMaterial,
    backWallColor: cleanHex(rawWalls.backWallColor, fallback.worldFoundation.walls.backWallColor),
    sideWallEnabled:
      typeof rawWalls.sideWallEnabled === "boolean"
        ? rawWalls.sideWallEnabled
        : fallback.worldFoundation.walls.sideWallEnabled,
    hasBaseboard:
      typeof rawWalls.hasBaseboard === "boolean" ? rawWalls.hasBaseboard : fallback.worldFoundation.walls.hasBaseboard,
    hasWindow: typeof rawWalls.hasWindow === "boolean" ? rawWalls.hasWindow : fallback.worldFoundation.walls.hasWindow,
    hasShelf: typeof rawWalls.hasShelf === "boolean" ? rawWalls.hasShelf : fallback.worldFoundation.walls.hasShelf,
    shelfItems: shelfItems.length ? shelfItems : fallback.worldFoundation.walls.shelfItems
  };

  const rawPalette = rawWorld.colorPalette || {};
  const colorPalette = {
    primary: cleanHex(rawPalette.primary, fallback.worldFoundation.colorPalette.primary),
    secondary: cleanHex(rawPalette.secondary, fallback.worldFoundation.colorPalette.secondary),
    surface: cleanHex(rawPalette.surface, surface.materialColor),
    wall: cleanHex(rawPalette.wall, walls.backWallColor),
    accent: cleanHex(rawPalette.accent, fallback.worldFoundation.colorPalette.accent)
  };

  const worldFoundation = {
    roomType,
    lightingPreset,
    surface,
    walls,
    colorPalette,
    storySummary: String(rawWorld.storySummary || fallback.worldFoundation.storySummary).slice(0, 240)
  };

  const seenIds = new Set();
  const assetCatalog = [];
  const roomAlreadyHasTableSurface =
    surface.type === "wooden_table" || surface.type === "kitchen_counter" || surface.type === "lab_bench";
  if (Array.isArray(raw?.assetCatalog)) {
    for (let i = 0; i < Math.min(10, raw.assetCatalog.length); i++) {
      const a = raw.assetCatalog[i];
      if (!a || typeof a !== "object") continue;
      if (!allowSciFi && SCIFI_ONLY_PREFABS.has(a.prefab)) continue;
      // Avoid placing a duplicate mini wooden_table ON TOP of an existing tabletop/counter!
      if (roomAlreadyHasTableSurface && a.prefab === "wooden_table") continue;

      let prefab = a.prefab;
      let customRig = null;
      if (prefab === "custom_rig") {
        customRig = sanitizeCustomRig(a.customRig);
        if (!customRig) continue;
        // Prevent unintended neon emissive spam on everyday custom rigs
        if (!allowSciFi) {
          customRig.parts = customRig.parts.map((pt) => ({
            ...pt,
            materialType: pt.materialType === "emissive_neon" ? "matte_clay" : pt.materialType,
            emissiveIntensity: Math.min(0.15, pt.emissiveIntensity || 0)
          }));
        }
      } else if (!ALLOWED_PREFABS_GROUNDED.has(prefab)) {
        continue;
      }

      const baseId = String(a.id || `asset_${i}`)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .slice(0, 28) || `asset_${i}`;
      const id = seenIds.has(baseId) ? `${baseId}_${i}` : baseId;
      seenIds.add(id);

      let materialType = ALLOWED_MATERIALS.has(a.materialType) ? a.materialType : "matte_clay";
      if (!allowSciFi && materialType === "emissive_neon") materialType = "glossy_plastic";

      assetCatalog.push({
        id,
        name: String(a.name || id).slice(0, 36),
        prefab,
        customRig,
        color: cleanHex(a.color, "#cbd5e1"),
        secondaryColor: cleanHex(a.secondaryColor, "#94a3b8"),
        materialType,
        defaultScale: clamp(a.defaultScale, 0.4, 1.8, 1.0),
        supportType: ["surface", "floor", "wall", "inside_container", "floating"].includes(a.supportType)
          ? a.supportType
          : "surface",
        physicalRole: ["container", "hero_subject", "tool", "ingredient", "character", "machine", "prop"].includes(
          a.physicalRole
        )
          ? a.physicalRole
          : "prop",
        visualNotes: String(a.visualNotes || "").slice(0, 140)
      });
    }
  }

  // Ensure at least 2 meaningful assets exist (otherwise merge fallback assets)
  const finalCatalog = assetCatalog.length >= 2 ? assetCatalog : fallback.assetCatalog;
  // Ensure protagonist is available if script uses workerAction or Ipul
  if (!finalCatalog.some((a) => a.prefab === "human_protagonist") && finalCatalog.length < 10) {
    finalCatalog.unshift({
      id: "ipul_host",
      name: "Ipul",
      prefab: "human_protagonist",
      customRig: null,
      color: "#0d9488",
      secondaryColor: "#f59e0b",
      materialType: "matte_clay",
      defaultScale: 0.9,
      supportType: "surface",
      physicalRole: "character",
      visualNotes: "Karakter peraga rapi di belakang-kiri meja."
    });
  }

  return {
    worldFoundation,
    assetCatalog: finalCatalog,
    visualReferences: Array.isArray(onlineRefs?.references) ? onlineRefs.references : [],
    formNotes: Array.isArray(onlineRefs?.formNotes) ? onlineRefs.formNotes : []
  };
}

const VISUAL_ARCHITECT_SYSTEM_PROMPT = `Kamu adalah "Visual Reference Researcher & 3D Production Designer" standar Pixar Diorama / Blender Cycles (seperti @untabiru5, @dekodaid, @belajar.iai).
Sebelum animator membuat gerakan tiap scene, tugasmu adalah MENELITI bentuk fisik nyata & MENETAPKAN SATU FONDASI DUNIA + KATALOG ASET 3D KONSISTEN untuk keseluruhan video!

PRINSIP FONDASI ANIMASI TERSTRUKTUR (WAJIB!):
1. SATU SET LOKASI KONSISTEN ("worldFoundation"):
   - Pilih SATU ruangan/lokasi nyata yang paling cocok dengan naskah (misal: dapur bermeja konter + dinding ubin keramik + jendela siang untuk topik masak/es krim; meja kayu oak + dinding plester + rak buku untuk eksperimen gelas/fisika; meja bengkel + dinding pegboard untuk motor/dinamo; halaman belakang + dinding bata untuk kolam ikan).
   - Pencahayaan WAJIB BERSIH, CERAH, NATURAL ("soft_daylight", "warm_kitchen", "clean_workshop", "outdoor_sunlight", "cozy_indoor", "cool_lab"). DILARANG memakai "cyber_dark" atau tema neon gelap kecuali topik benar-benar fiksi ilmiah/cyberpunk!
2. KATALOG ASET FISIK NYATA YANG BERKELANJUTAN ("assetCatalog"):
   - Daftarkan 4 sampai 8 benda nyata yang benar-benar disebut/dipakai sepanjang naskah (misal: mangkuk cekung "hollow_bowl", gelas kaca "glass_cup", botol tuang "jar_bottle", panci "cooking_pot", sendok/pengocok "whisk_spoon", kompor "stove_burner", talenan "cutting_board", piring "plate_dish", baskom "bucket_tub", wadah garam "salt_shaker", akuarium "glass_aquarium", filter "filter_sump", papan data "whiteboard_chart", dll.).
   - PENTING: Meja utama/konter dapur SUDAH dibangun otomatis oleh "worldFoundation.surface", jadi JANGAN masukkan "wooden_table" ke dalam "assetCatalog" ketika ruangan sudah punya meja/konter!
   - Benda yang SAMA (berdasarkan "id") akan dipakai terus dari Scene 1 sampai Scene terakhir agar animasi nyambung, bertahap, dan punya fondasi kuat!
   - DILARANG memasukkan "hologram_ring", "neon_tube", atau "energy_sphere" pada topik sehari-hari/dapur/eksperimen biasa!
   - Jika ada 1 objek fisik unik yang tidak ada di daftar prefab, kamu boleh buat "prefab": "custom_rig" dengan bentuk realistis (lathe untuk wadah cekung/botol/vas, rounded_box untuk boks/meja/alat, cylinder/sphere untuk bagian mekanis) & material natural (wood_oak, ceramic, brushed_steel, glass_crystal, matte_clay) — TANPA glow/neon berlebihan!

PILIHAN VALID:
- roomType: "kitchen_counter" | "oak_workshop" | "cozy_room" | "science_lab" | "backyard_yard" | "farm_field" | "house_cross_section" | "runway_outdoor" | "street_exterior" | "underwater_bed" | "volcanic_outdoor" | "arctic_outdoor" | "space_orbit"
- lightingPreset: "soft_daylight" | "warm_kitchen" | "clean_workshop" | "outdoor_sunlight" | "cozy_indoor" | "cool_lab" | "deep_ocean" | "arctic_ice" | "night_dim" | "warm_alert" | "volcanic_forge" | "cyber_dark"
- surface.type: "wooden_table" | "kitchen_counter" | "lab_bench" | "concrete_floor" | "grass_lawn" | "soil_cutaway" | "asphalt" | "water_bed" | "ice_sheet" | "none"
- walls.backWallMaterial: "ceramic_tile" | "warm_plaster" | "red_brick" | "wood_panel" | "pegboard" | "concrete" | "lab_panel"
- walls.shelfItems: ["jar" | "plant" | "mug" | "books" | "tools" | "bottle"]
- prefab: "human_protagonist", "hollow_bowl", "glass_cup", "jar_bottle", "plate_dish", "cutting_board", "whisk_spoon", "stove_burner", "bucket_tub", "wooden_table", "bookshelf_cabinet", "whiteboard_chart", "potted_plant", "ice_cube_tray", "salt_shaker", "ice_cream_bowl", "coffee_espresso", "cooking_pot", "chemistry_flask", "glass_aquarium", "filter_sump", "turbine_generator", "asic_miner", "copper_stator_motor", "battery_reactor", "solar_array", "ac_compressor", "boiler_furnace", "microscope_lab", "server_rack", "thermal_plates", "rebar_structure", "fish_arowana", "fish_betta", "stingray", "bird_eagle", "drone_quad", "robot_arm", "car_sports", "rocket_ship", "aircraft_jet", "submarine", "ship_vessel", "volcano_peak", "tree_lush", "palm_tree", "mountain_peak", "water_surface", "bevel_chassis", "metallic_cylinder", "gear_wheel", "propeller_fan", "helix_coil", "custom_rig"
- materialType: "wood_oak" | "ceramic" | "brushed_steel" | "metal_chrome" | "glass_crystal" | "water_clear" | "matte_clay" | "glossy_plastic" | "ice_translucent" | "gold_luxury"

Kembalikan HANYA JSON valid:
{
  "worldFoundation": {
    "roomType": "kitchen_counter",
    "lightingPreset": "warm_kitchen",
    "surface": { "type": "kitchen_counter", "materialColor": "#d6b58d", "width": 5.6, "depth": 3.1 },
    "walls": {
      "enabled": true,
      "backWallMaterial": "ceramic_tile",
      "backWallColor": "#fbf7f0",
      "sideWallEnabled": true,
      "hasBaseboard": true,
      "hasWindow": true,
      "hasShelf": true,
      "shelfItems": ["jar", "mug", "plant"]
    },
    "colorPalette": {
      "primary": "#f472b6",
      "secondary": "#cbd5e1",
      "surface": "#d6b58d",
      "wall": "#fbf7f0",
      "accent": "#0284c7"
    },
    "storySummary": "Ringkasan singkat Bahasa Indonesia mengenai set ruangan & alasan pemilihannya."
  },
  "assetCatalog": [
    {
      "id": "ipul_host",
      "name": "Ipul",
      "prefab": "human_protagonist",
      "color": "#0d9488",
      "secondaryColor": "#f59e0b",
      "materialType": "matte_clay",
      "defaultScale": 0.9,
      "supportType": "surface",
      "physicalRole": "character",
      "visualNotes": "Karakter peraga di belakang kiri meja"
    },
    {
      "id": "mangkuk_adonan",
      "name": "Mangkuk Stainless",
      "prefab": "hollow_bowl",
      "color": "#cbd5e1",
      "secondaryColor": "#fef3c7",
      "materialType": "brushed_steel",
      "defaultScale": 1.05,
      "supportType": "surface",
      "physicalRole": "container",
      "visualNotes": "Mangkuk cekung logam berongga di tengah meja"
    }
  ]
}`;

export async function researchAndPlanVisualWorld({
  topic = "",
  title = "",
  scenes = [],
  geminiApiKey = ""
}) {
  const t0 = Date.now();
  const onlineRefs = await fetchOnlineVisualReferences(topic || title, scenes);

  const refsBlock = onlineRefs.references.length
    ? onlineRefs.references.map((r) => `- [${r.source}] ${r.title}: ${r.visualNote}`).join("\n")
    : "- Gunakan proporsi fisik nyata sehari-hari yang bersih & jelas (meja berkaki, dinding bertekstur, wadah cekung berongga).";

  const formBlock = onlineRefs.formNotes.length
    ? `\nCATATAN BENTUK FISIK BENDA:\n- ${onlineRefs.formNotes.join("\n- ")}`
    : "";

  const compactScript = (scenes || []).map((s, idx) => ({
    sceneNumber: s.sceneNumber || idx + 1,
    phase: s.phase || "HOOK",
    label: s.componentLabel || "",
    narration: s.plainNarration || s.narration || ""
  }));

  const userPrompt = `TOPIK VIDEO: "${topic || title}"
JUDUL: "${title || topic}"
JUMLAH SCENE: ${compactScript.length}

HASIL RISET REFERENSI VISUAL NYATA (Wikipedia & Wikimedia Commons):
${refsBlock}${formBlock}

RINGKASAN SELURUH NASKAH SCENE 1..${compactScript.length}:
${JSON.stringify(compactScript, null, 2)}

Rancang 1 "worldFoundation" ruangan/meja/dinding yang KONSISTEN + "assetCatalog" berisi semua benda fisik nyata yang muncul di naskah ini (dengan bentuk cekung/nyata & warna realistis agar mudah dipahami penonton)!`;

  const llmRes = await callGeminiJson({
    geminiApiKey,
    systemInstruction: VISUAL_ARCHITECT_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.42,
    maxOutputTokens: 6144,
    timeoutMs: 22000,
    models: GEMINI_VIDEO_MODELS
  });

  const plan = sanitizeVisualPlan(llmRes.ok ? llmRes.data : null, topic || title, scenes, onlineRefs);

  return {
    ok: true,
    ...plan,
    researchModel: llmRes.ok ? llmRes.model : "grounded-architect-fallback",
    elapsedMs: Date.now() - t0,
    warning: llmRes.ok ? null : llmRes.error
  };
}
