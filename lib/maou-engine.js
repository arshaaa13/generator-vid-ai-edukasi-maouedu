// Shared Stateless AI Video Engine for MaouEdu Studio (Vercel Serverless + Local Dev)
// 100% Bahasa Indonesia santai & seru, praktek langsung ala @untabiru5 + Ciri Khas Konsisten MC Raja Iblis!

export const CHARACTER_BIBLE = {
  name: "Maou Vaelen (Sang Raja Iblis)",
  archetype: "Host 2D Anime — Kalem, Elegan, Blak-blakan, Sedikit Sarkas",
  defaultVoiceId: "cPoqAvGWCPfCfyPMwe4z",
  voiceUrl: "https://elevenlabs.io/voices/cPoqAvGWCPfCfyPMwe4z",
  visualTraits: {
    hair: "Rambut ash-silver wolf-cut dengan satu helai depan warna merah darah",
    horns:
      "Tanduk hitam obsidian asimetris: tanduk kanan utuh rapi, tanduk kiri ujungnya patah dengan efek retakan cahaya merah menyala",
    eyes: "Mata merah keemasan menyala tajam",
    outfit: "Turtleneck hitam + jas panjang modern beraksen garis emas & bros batu rubi di dada",
    aura: "Aura bayangan tipis di sekitar bahu"
  },
  personality:
    "Kalem, elegan, blak-blakan, asik kayak temen nongkrong tapi tetep punya aura 'bos besar', sedikit arogan/sarkas ('Liat nih manusia, masih aja belum paham...'). Selalu menjelaskan secara singkat, simpel, seru, 100% bahasa Indonesia dan langsung praktek langkah demi langkah!"
};

function cleanApiKey(raw = "") {
  return String(raw || "")
    .trim()
    .replace(/^[A-Z0-9_]+=/, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

export function extractTopicFromPrompt(rawPrompt = "") {
  let cleaned = rawPrompt
    .replace(/https?:\/\/\S+/gi, "")
    .replace(
      /^(tolong\s+)?(bikin(in)?|buat(in)?|generate|cari(in)?|jelasin|jelaskan|bahas)\s+(vid(eo)?|konten|edukasi|animasi|script)?\s*(tentang|mengenai|soal|cara)?\s*/i,
      ""
    )
    .trim();
  if (!cleaned) cleaned = rawPrompt.trim() || "buat es krim";
  return cleaned.replace(/\beskrim\b/gi, "es krim");
}

export function buildSubtitleChunks(narration = "", highlightWords = []) {
  let marked = narration;
  if (!marked.includes("[")) {
    for (const hw of highlightWords) {
      if (hw && hw.length > 2) {
        const escaped = hw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        marked = marked.replace(new RegExp(`\\b(${escaped})\\b`, "i"), "[$1]");
      }
    }
  }

  const tokens = [];
  const regex = /\[([^\]]+)\]|(\S+)/g;
  let m;
  while ((m = regex.exec(marked)) !== null) {
    if (m[1]) {
      tokens.push({ text: m[1], highlight: true });
    } else if (m[2]) {
      const clean = m[2];
      const autoHighlight = /^(TAPI,?|JADI,?|SELAMAT!?|GAGAL!?|KERUH!?|KERAS!?|LEMBUT!?|MUTER!?)$/i.test(
        clean
      );
      tokens.push({ text: clean, highlight: autoHighlight });
    }
  }

  const phrases = [];
  let current = [];
  for (let i = 0; i < tokens.length; i++) {
    current.push(tokens[i]);
    const wordText = tokens[i].text;
    const isBreak = /[.!?,;:]$/.test(wordText) || current.length >= 4;
    if (isBreak || i === tokens.length - 1) {
      phrases.push(current);
      current = [];
    }
  }
  return phrases.length ? phrases : [[{ text: narration, highlight: false }]];
}

export function inferVisualDefaults(text = "") {
  const lower = text.toLowerCase();

  if (/(es\s*krim|eskrim)/i.test(lower)) {
    return {
      setting: "kitchen",
      mainContainer: "bowl_bucket",
      heroObject: "ice_cream",
      accentColor: "#f472b6"
    };
  }
  if (/(pizza|roti|kue|donat|martabak|masak|goreng|mie|bakso|tahu|tempe|cokelat|coklat)/i.test(lower)) {
    return {
      setting: "kitchen",
      mainContainer: "oven_pan",
      heroObject: "food_dish",
      accentColor: "#f59e0b"
    };
  }
  if (/(kopi|teh|boba|jus|minuman|susu)/i.test(lower)) {
    return {
      setting: "kitchen",
      mainContainer: "coffee_cup",
      heroObject: "drink_brew",
      accentColor: "#92400e"
    };
  }
  if (/(cupang|betta)/i.test(lower)) {
    return {
      setting: "aquarium",
      mainContainer: "glass_tank",
      heroObject: "betta_fish",
      accentColor: "#2563eb"
    };
  }
  if (/(arwana|arowana)/i.test(lower)) {
    return {
      setting: lower.includes("aquarium") || lower.includes("akuarium") ? "aquarium" : "backyard",
      mainContainer: lower.includes("aquarium") || lower.includes("akuarium") ? "glass_tank" : "dirt_pond",
      heroObject: "arowana_fish",
      accentColor: "#ef4444"
    };
  }
  if (/(aquarium|akuarium|kolam|ikan|koi|lele|guppy|channa|udang|koki)/i.test(lower)) {
    return {
      setting: lower.includes("kolam") ? "backyard" : "aquarium",
      mainContainer: lower.includes("kolam") ? "dirt_pond" : "glass_tank",
      heroObject: lower.includes("lele") ? "catfish" : "ornamental_fish",
      accentColor: "#f97316"
    };
  }
  if (/(kipas|motor|dinamo|magnet|kapasitor|listrik|baterai)/i.test(lower)) {
    return {
      setting: "workshop",
      mainContainer: "motor_frame",
      heroObject: "fan_blades",
      accentColor: "#38bdf8"
    };
  }
  if (/(panel surya|solar|matahari)/i.test(lower)) {
    return {
      setting: "backyard",
      mainContainer: "workbench_box",
      heroObject: "solar_panel",
      accentColor: "#0ea5e9"
    };
  }
  if (/(filter air|sumur|jernih|air keruh)/i.test(lower)) {
    return {
      setting: "backyard",
      mainContainer: "filter_tower",
      heroObject: "water_layers",
      accentColor: "#06b6d4"
    };
  }
  if (/(roket|pesawat|terbang|satelit)/i.test(lower)) {
    return {
      setting: "sky_space",
      mainContainer: "rocket_pad",
      heroObject: "rocket",
      accentColor: "#e11d48"
    };
  }
  if (/(sawah|padi|minapadi|petani|hidroponik|tanam|kebun|pohon)/i.test(lower)) {
    return {
      setting: "farm",
      mainContainer: "rice_field",
      heroObject: "rice_fish",
      accentColor: "#84cc16"
    };
  }
  return {
    setting: "workshop",
    mainContainer: "workbench_box",
    heroObject: "science_machine",
    accentColor: "#38bdf8"
  };
}

// Live Indonesian-ONLY Research (id.wikipedia.org) — NEVER returns English text!
export async function researchTopicOnline(topic) {
  const cleanQuery = extractTopicFromPrompt(topic)
    .replace(/\b(buat|bikin|cara|membuat|agar|supaya|anti gagal|yang benar)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const sources = [];
  const summaryFacts = [];

  try {
    const searchUrl = `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      cleanQuery || topic
    )}&utf8=&format=json&srlimit=2`;
    const sResp = await fetch(searchUrl, {
      headers: { "User-Agent": "MaouEduVideoStudio/3.0" },
      signal: AbortSignal.timeout(5500)
    });
    if (sResp.ok) {
      const sData = await sResp.json();
      const hits = sData?.query?.search || [];
      if (hits.length) {
        const titles = hits.map((h) => h.title).join("|");
        const extUrl = `https://id.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
          titles
        )}&format=json`;
        const eResp = await fetch(extUrl, {
          headers: { "User-Agent": "MaouEduVideoStudio/3.0" },
          signal: AbortSignal.timeout(5500)
        });
        if (eResp.ok) {
          const eData = await eResp.json();
          const pages = Object.values(eData?.query?.pages || {});
          for (const p of pages) {
            if (p?.extract) {
              const shortExtract = p.extract.split(/\.\s+/).slice(0, 2).join(". ") + ".";
              summaryFacts.push(`${p.title}: ${shortExtract}`);
              sources.push({
                title: `${p.title} (Wikipedia ID)`,
                url: `https://id.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
                snippet: shortExtract.slice(0, 180)
              });
            }
          }
        }
      }
    }
  } catch {}

  return {
    searchedQuery: cleanQuery || topic,
    summaryFacts: summaryFacts.slice(0, 3),
    sources: sources.slice(0, 3)
  };
}

// Hands-on, punchy, 100% Indonesian fallback scripts (never reading Wikipedia like a robot!)
function buildOfflineFallbackScript(topic) {
  const lower = topic.toLowerCase();
  const baseVisual = inferVisualDefaults(topic);

  if (/(es\s*krim|eskrim)/i.test(lower)) {
    return {
      title: "Cara Bikin Es Krim Lembut Tanpa Jadi Batu Es",
      topic: "Membuat Es Krim Lembut",
      hookFormula: "Praktek Awal -> TAPI (Gagal) -> JADI (Trik Ilmiah) -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          componentLabel: "LANGKAH 1: SUSU + GULA MASUK FREEZER",
          narration:
            "Liat nih manusia bikin [es krim]. Cuma nyampur [susu sama gula] di mangkuk, terus langsung dimasukin kulkas?",
          highlightWords: ["es krim", "susu sama gula"],
          visual: {
            setting: "kitchen",
            mainContainer: "bowl_bucket",
            heroObject: "ice_cream",
            ingredientOrTool: "milk_sugar",
            workerAction: "pour",
            problemVisual: "none",
            solutionVisual: "none",
            accentColor: "#fbcfe8",
            callouts: ["SUSU + GULA", "MANGKUK BESI"]
          },
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH 1: KERAS KAYAK BATU ES!",
          narration:
            "[TAPI] pas dicoba disendok, keras banget kayak [batu es]! Air di susu ngebeku jadi [kristal es besar]!",
          highlightWords: ["TAPI", "batu es", "kristal es besar"],
          visual: {
            setting: "kitchen",
            mainContainer: "bowl_bucket",
            heroObject: "ice_cream",
            ingredientOrTool: "spoon",
            workerAction: "panic",
            problemVisual: "rock_ice_block",
            solutionVisual: "none",
            accentColor: "#93c5fd",
            callouts: ["KRISTAL ES BESAR", "SENDOK MENTOK!"]
          },
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 1: EMBER ES BATU + GARAM DAPUR",
          narration:
            "[JADI] taruh mangkuknya di ember isi [es batu], terus taburi [garam dapur]. Garam bikin suhunya anjlok sampai [minus 15 derajat]!",
          highlightWords: ["JADI", "es batu", "garam dapur", "minus 15 derajat"],
          visual: {
            setting: "kitchen",
            mainContainer: "bowl_bucket",
            heroObject: "ice_cream",
            ingredientOrTool: "salt_ice",
            workerAction: "pour",
            problemVisual: "none",
            solutionVisual: "salt_frost_aura",
            accentColor: "#38bdf8",
            callouts: ["GARAM + ES BATU", "SUHU -15°C"]
          },
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH 2: MASIH KASAR & CEPAT LELEH!",
          narration:
            "[TAPI] kalau didiemin doang tanpa lemak, pas digigit tetep [kasar berpasir] dan gampang [mencair]!",
          highlightWords: ["TAPI", "kasar berpasir", "mencair"],
          visual: {
            setting: "kitchen",
            mainContainer: "bowl_bucket",
            heroObject: "ice_cream",
            ingredientOrTool: "spoon",
            workerAction: "panic",
            problemVisual: "melting_puddle",
            solutionVisual: "none",
            accentColor: "#fde68a",
            callouts: ["TEKSTUR BERPASIR", "CEPAT MELELEH!"]
          },
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 2: TAMBAH KRIM KENTAL & KOCOK CEPAT",
          narration:
            "[JADI] campur [krim kental] biar lemaknya nahan kristal es, terus [kocok terus] pas membeku biar gelembung [udara halus] masuk!",
          highlightWords: ["JADI", "krim kental", "kocok terus", "udara halus"],
          visual: {
            setting: "kitchen",
            mainContainer: "bowl_bucket",
            heroObject: "ice_cream",
            ingredientOrTool: "whisk_mixer",
            workerAction: "stir",
            problemVisual: "none",
            solutionVisual: "creamy_swirl",
            accentColor: "#f472b6",
            callouts: ["KRIM KENTAL", "DIADUK CEPAT"]
          },
          sfx: "ding"
        },
        {
          sceneNumber: 6,
          phase: "CLIMAX",
          mcPose: "eureka",
          componentLabel: "HASIL AKHIR: ES KRIM LEMBUT PARAH!",
          narration:
            "[SELAMAT!] Liat tuh hasilnya—[es krim lembut] kayak buatan toko mahal! Simpel kan kalau ngerti triknya? Habis ini mau liat bikin apa lagi? [Tulis di komentar]!",
          highlightWords: ["SELAMAT!", "es krim lembut", "Tulis di komentar"],
          visual: {
            setting: "kitchen",
            mainContainer: "bowl_bucket",
            heroObject: "ice_cream",
            ingredientOrTool: "none",
            workerAction: "celebrate",
            problemVisual: "none",
            solutionVisual: "waffle_cones",
            accentColor: "#f472b6",
            callouts: ["ES KRIM LEMBUT!", "KRISTAL MIKRO"]
          },
          sfx: "victory"
        }
      ]
    };
  }

  if (/(cupang|betta)/i.test(lower)) {
    return {
      title: "Cara Bikin Aquarium Ikan Cupang Anti-Stres & Ekor Mekar",
      topic: "Aquarium Ikan Cupang",
      hookFormula: "Praktek Awal -> TAPI (Gagal) -> JADI (Trik Ilmiah) -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          componentLabel: "LANGKAH 1: TOPLES SEMPIT & DUA CUPANG",
          narration:
            "Liat nih manusia pelihara [ikan cupang]. Baru beli langsung cemplungin [dua ekor] sekaligus ke satu wadah isi air keran?",
          highlightWords: ["ikan cupang", "dua ekor"],
          visual: {
            setting: "aquarium",
            mainContainer: "glass_tank",
            heroObject: "betta_fish",
            ingredientOrTool: "bucket",
            workerAction: "pour",
            problemVisual: "none",
            solutionVisual: "none",
            accentColor: "#2563eb",
            callouts: ["AIR KERAN MENTAH", "2 CUPANG JANTAN"]
          },
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH 1: LANGSUNG BERANTEM EKOR SOBEK!",
          narration:
            "[TAPI] baru semenit langsung [saling serang] sampai ekornya robek! Cupang itu [ikan petarung], nggak mau berbagi wilayah!",
          highlightWords: ["TAPI", "saling serang", "ikan petarung"],
          visual: {
            setting: "aquarium",
            mainContainer: "glass_tank",
            heroObject: "betta_fish",
            ingredientOrTool: "none",
            workerAction: "panic",
            problemVisual: "fish_fighting",
            solutionVisual: "none",
            accentColor: "#e11d48",
            callouts: ["SIFAT TERITORIAL", "EKOR SOBEK!"]
          },
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 1: PASANG SEKAT KACA & ENDAPKAN AIR",
          narration:
            "[JADI] pisah pakai [sekat kaca] buram biar nggak lihat-lihatan, dan pakai air yang sudah [diendapkan] semalam supaya kaporitnya hilang.",
          highlightWords: ["JADI", "sekat kaca", "diendapkan"],
          visual: {
            setting: "aquarium",
            mainContainer: "glass_tank",
            heroObject: "betta_fish",
            ingredientOrTool: "wrench",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "glass_divider",
            accentColor: "#2563eb",
            callouts: ["SEKAT BURAM", "BEBAS KAPORIT"]
          },
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH 2: ARUS FILTER KENCANG & AIR KERUH!",
          narration:
            "[TAPI] pas dipasang pompa kencang, cupangnya malah [ketarik arus] dan capek! Ekornya yang lebar itu berat kalau kena arus deras!",
          highlightWords: ["TAPI", "ketarik arus"],
          visual: {
            setting: "aquarium",
            mainContainer: "glass_tank",
            heroObject: "betta_fish",
            ingredientOrTool: "none",
            workerAction: "panic",
            problemVisual: "murky_mud",
            solutionVisual: "none",
            accentColor: "#06b6d4",
            callouts: ["ARUS TERLALU DERAS", "CUPANG STRES"]
          },
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 2: DAUN KETAPANG & FILTER BUSA PELAN",
          narration:
            "[JADI] cemplungin [daun ketapang] kering biar air adem bebas jamur, terus ganti pakai [filter busa] pelan plus tutup tipis biar nggak loncat!",
          highlightWords: ["JADI", "daun ketapang", "filter busa"],
          visual: {
            setting: "aquarium",
            mainContainer: "glass_tank",
            heroObject: "betta_fish",
            ingredientOrTool: "ketapang_leaf",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "clear_bubbles",
            accentColor: "#2563eb",
            callouts: ["DAUN KETAPANG", "FILTER BUSA PELAN"]
          },
          sfx: "ding"
        },
        {
          sceneNumber: 6,
          phase: "CLIMAX",
          mcPose: "eureka",
          componentLabel: "HASIL AKHIR: CUPANG SEHAT & EKOR MEKAR!",
          narration:
            "[SELAMAT!] Liat tuh [ikan cupang] berenang santai, warna tajam, ekornya [mekar sempurna]! Habis ini mau liat eksperimen apa lagi? [Tulis di komentar]!",
          highlightWords: ["SELAMAT!", "ikan cupang", "mekar sempurna", "Tulis di komentar"],
          visual: {
            setting: "aquarium",
            mainContainer: "glass_tank",
            heroObject: "betta_fish",
            ingredientOrTool: "none",
            workerAction: "celebrate",
            problemVisual: "none",
            solutionVisual: "sparkle_shield",
            accentColor: "#3b82f6",
            callouts: ["EKOR MEKAR!", "AIR JERNIH SEHAT"]
          },
          sfx: "victory"
        }
      ]
    };
  }

  if (/(kipas|motor|dinamo)/i.test(lower)) {
    return {
      title: "Cara Bikin Kipas Angin Dari Kawat & Magnet",
      topic: "Cara Kerja Kipas Angin",
      hookFormula: "Praktek Awal -> TAPI (Gagal) -> JADI (Trik Ilmiah) -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          componentLabel: "LANGKAH 1: KAWAT LILIT PAKU + BATERAI",
          narration:
            "Liat manusia ini bikin [kipas angin]. Cuma lilit [kawat tembaga] ke paku, tempel baterai, terus pakunya langsung narik klip kertas!",
          highlightWords: ["kipas angin", "kawat tembaga"],
          visual: {
            setting: "workshop",
            mainContainer: "motor_frame",
            heroObject: "fan_blades",
            ingredientOrTool: "wrench",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "none",
            accentColor: "#f59e0b",
            callouts: ["KAWAT TEMBAGA", "JADI MAGNET"]
          },
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH 1: CUMA NARIK, NGGAK MUTER!",
          narration:
            "[TAPI] magnetnya cuma narik diam doang, sama sekali [nggak muter]! Gimana mau keluar angin kalau nggak berputar?",
          highlightWords: ["TAPI", "nggak muter"],
          visual: {
            setting: "workshop",
            mainContainer: "motor_frame",
            heroObject: "fan_blades",
            ingredientOrTool: "none",
            workerAction: "panic",
            problemVisual: "motor_vibrating",
            solutionVisual: "none",
            accentColor: "#e11d48",
            callouts: ["MAGNET DIAM", "NGGAK MUTER!"]
          },
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 1: POROS LILITAN & DUA MAGNET",
          narration:
            "[JADI] lilit kawatnya di [poros tengah], apit pakai dua magnet, dan kasih cincin pembalik arus biar kutubnya terus [dorong-menolak]!",
          highlightWords: ["JADI", "poros tengah", "dorong-menolak"],
          visual: {
            setting: "workshop",
            mainContainer: "motor_frame",
            heroObject: "fan_blades",
            ingredientOrTool: "wrench",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "rotating_arrows",
            accentColor: "#38bdf8",
            callouts: ["POROS & MAGNET", "ARUS BOLAK-BALIK"]
          },
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH 2: COLOK LISTRIK RUMAH CUMA BERDENGUNG!",
          narration:
            "[TAPI] pas dicolok ke listrik rumah, mesinnya malah getar dan [cuma berdengung]! Medan magnetnya bingung mau muter ke kiri apa kanan!",
          highlightWords: ["TAPI", "cuma berdengung"],
          visual: {
            setting: "workshop",
            mainContainer: "motor_frame",
            heroObject: "fan_blades",
            ingredientOrTool: "none",
            workerAction: "panic",
            problemVisual: "motor_vibrating",
            solutionVisual: "none",
            accentColor: "#e11d48",
            callouts: ["MESIN BERDENGUNG", "MACET!"]
          },
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 2: PASANG KAPASITOR 1,5 µF!",
          narration:
            "[JADI] tambahin kotak kecil bernama [kapasitor]! Dia ngasih dorongan awal biar medan magnet langsung [muter kencang]. Makanya kipas berdengung itu penyakitnya di kapasitor!",
          highlightWords: ["JADI", "kapasitor", "muter kencang"],
          visual: {
            setting: "workshop",
            mainContainer: "motor_frame",
            heroObject: "fan_blades",
            ingredientOrTool: "capacitor",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "rotating_arrows",
            accentColor: "#38bdf8",
            callouts: ["KAPASITOR 1,5 µF", "MEDAN MUTER!"]
          },
          sfx: "ding"
        },
        {
          sceneNumber: 6,
          phase: "CLIMAX",
          mcPose: "eureka",
          componentLabel: "HASIL AKHIR: KIPAS ANGIN KENCANG & ADEM!",
          narration:
            "[SELAMAT!] Tinggal pasang baling-baling, tombol 1-2-3, dan pengaman jaring—jadi deh [kipas angin]! Mau bongkar mesin apa lagi? [Tulis di komentar]!",
          highlightWords: ["SELAMAT!", "kipas angin", "Tulis di komentar"],
          visual: {
            setting: "workshop",
            mainContainer: "motor_frame",
            heroObject: "fan_blades",
            ingredientOrTool: "none",
            workerAction: "celebrate",
            problemVisual: "none",
            solutionVisual: "sparkle_shield",
            accentColor: "#38bdf8",
            callouts: ["TOMBOL 1-2-3", "ANGIN KENCANG!"]
          },
          sfx: "victory"
        }
      ]
    };
  }

  const cleanTopic = extractTopicFromPrompt(topic);
  return {
    title: `Cara Praktis ${cleanTopic} Anti-Gagal`,
    topic: cleanTopic,
    hookFormula: "Praktek Awal -> TAPI (Gagal) -> JADI (Trik Ilmiah) -> SELAMAT!",
    scenes: [
      {
        sceneNumber: 1,
        phase: "HOOK",
        mcPose: "default",
        componentLabel: `LANGKAH 1: COBA ${cleanTopic.toUpperCase().slice(0, 22)}`,
        narration: `Liat nih manusia nyoba [${cleanTopic}]. Kelihatannya gampang banget kalau cuma langsung asal gabung bahan di awal, kan?`,
        highlightWords: [cleanTopic],
        visual: {
          ...baseVisual,
          ingredientOrTool: "wrench",
          workerAction: "build",
          problemVisual: "none",
          solutionVisual: "none",
          callouts: ["TAHAP AWAL", cleanTopic.toUpperCase().slice(0, 18)]
        },
        sfx: "whoosh"
      },
      {
        sceneNumber: 2,
        phase: "TAPI",
        mcPose: "sarcastic",
        componentLabel: "MASALAH 1: LANGSUNG BERANTAKAN!",
        narration: `[TAPI] pas dicoba beneran, hasilnya malah [berantakan] dan gagal total! Manusia emang hobi skip langkah penting.`,
        highlightWords: ["TAPI", "berantakan"],
        visual: {
          ...baseVisual,
          ingredientOrTool: "none",
          workerAction: "panic",
          problemVisual: "smoke_overheat",
          solutionVisual: "none",
          callouts: ["GAGAL TOTAL!", "SALAH TAKARAN"]
        },
        sfx: "error"
      },
      {
        sceneNumber: 3,
        phase: "JADI",
        mcPose: "explaining",
        componentLabel: "SOLUSI 1: ATUR KOMPONEN UTAMANYA",
        narration: `[JADI] kuncinya atur dulu [bagian utamanya] dengan takaran pas supaya proses [${cleanTopic}] berjalan mulus dari dalam.`,
        highlightWords: ["JADI", "bagian utamanya", cleanTopic],
        visual: {
          ...baseVisual,
          ingredientOrTool: "wrench",
          workerAction: "stir",
          problemVisual: "none",
          solutionVisual: "rotating_arrows",
          callouts: ["TAKARAN PAS", "PROSES STABIL"]
        },
        sfx: "pop"
      },
      {
        sceneNumber: 4,
        phase: "TAPI",
        mcPose: "sarcastic",
        componentLabel: "MASALAH 2: HASIL BELUM TAHAN LAMA!",
        narration: `[TAPI] kalau cuma berhenti di situ, hasilnya tetep [gampang rusak] dan nggak maksimal pas dipakai!`,
        highlightWords: ["TAPI", "gampang rusak"],
        visual: {
          ...baseVisual,
          ingredientOrTool: "none",
          workerAction: "panic",
          problemVisual: "cracked_leak",
          solutionVisual: "none",
          callouts: ["BELUM STABIL!", "PERLU PENGAMAN"]
        },
        sfx: "error"
      },
      {
        sceneNumber: 5,
        phase: "JADI",
        mcPose: "explaining",
        componentLabel: "SOLUSI 2: TAMBAH LAPISAN PENYEMPURNA",
        narration: `[JADI] tinggal tambahkan [tahap penyempurna] ini sebagai pengunci terakhir biar hasilnya awet dan jauh lebih [maksimal]!`,
        highlightWords: ["JADI", "tahap penyempurna", "maksimal"],
        visual: {
          ...baseVisual,
          ingredientOrTool: "wrench",
          workerAction: "build",
          problemVisual: "none",
          solutionVisual: "clear_bubbles",
          callouts: ["PENGUNCI AKHIR", "HASIL AWET"]
        },
        sfx: "ding"
      },
      {
        sceneNumber: 6,
        phase: "CLIMAX",
        mcPose: "eureka",
        componentLabel: "HASIL AKHIR: 100% BERHASIL!",
        narration: `[SELAMAT!] Sekarang [${cleanTopic}] jadi sempurna tanpa drama! Habis ini mau liat manusia bikin apa lagi? [Tulis di komentar]!`,
        highlightWords: ["SELAMAT!", cleanTopic, "Tulis di komentar"],
        visual: {
          ...baseVisual,
          ingredientOrTool: "none",
          workerAction: "celebrate",
          problemVisual: "none",
          solutionVisual: "sparkle_shield",
          callouts: ["BERHASIL!", "PAHAM ILMUNYA"]
        },
        sfx: "victory"
      }
    ]
  };
}

function enrichScript(scriptObj, researchData = null, fallbackTopic = "") {
  scriptObj.character = CHARACTER_BIBLE;
  scriptObj.research = researchData;
  const defaults = inferVisualDefaults(`${fallbackTopic} ${scriptObj.topic || ""} ${scriptObj.title || ""}`);

  scriptObj.scenes = (scriptObj.scenes || []).map((sc, idx) => {
    const phase = sc.phase || (idx === 0 ? "HOOK" : idx % 2 === 1 ? "TAPI" : "JADI");
    const mcPose =
      sc.mcPose ||
      (phase === "TAPI"
        ? "sarcastic"
        : phase === "JADI"
        ? "explaining"
        : phase === "CLIMAX"
        ? "eureka"
        : "default");
    const plainNarration = (sc.narration || "").replace(/\[([^\]]+)\]/g, "$1");
    const subtitlePhrases = buildSubtitleChunks(sc.narration || "", sc.highlightWords || []);

    const v = sc.visual || {};
    const visual = {
      setting: v.setting || defaults.setting,
      mainContainer: v.mainContainer || defaults.mainContainer,
      heroObject: v.heroObject || defaults.heroObject,
      ingredientOrTool:
        v.ingredientOrTool ||
        (phase === "TAPI" ? "none" : phase === "CLIMAX" ? "none" : "wrench"),
      workerAction:
        v.workerAction ||
        (phase === "TAPI"
          ? "panic"
          : phase === "CLIMAX"
          ? "celebrate"
          : phase === "JADI"
          ? "build"
          : "pour"),
      problemVisual:
        v.problemVisual ||
        (phase === "TAPI"
          ? defaults.heroObject === "ice_cream"
            ? idx <= 2
              ? "rock_ice_block"
              : "melting_puddle"
            : defaults.heroObject === "betta_fish"
            ? idx <= 2
              ? "fish_fighting"
              : "murky_mud"
            : defaults.heroObject === "arowana_fish"
            ? idx <= 2
              ? "murky_mud"
              : "fish_jumping"
            : defaults.heroObject === "fan_blades"
            ? "motor_vibrating"
            : "smoke_overheat"
          : "none"),
      solutionVisual:
        v.solutionVisual ||
        (phase === "CLIMAX"
          ? defaults.heroObject === "ice_cream"
            ? "waffle_cones"
            : "sparkle_shield"
          : phase === "JADI"
          ? defaults.heroObject === "ice_cream"
            ? idx <= 3
              ? "salt_frost_aura"
              : "creamy_swirl"
            : defaults.heroObject === "betta_fish"
            ? idx <= 3
              ? "glass_divider"
              : "clear_bubbles"
            : "rotating_arrows"
          : "none"),
      accentColor: v.accentColor || defaults.accentColor,
      callouts:
        Array.isArray(v.callouts) && v.callouts.length
          ? v.callouts.slice(0, 2)
          : [sc.componentLabel || "TAHAP PRAKTEK"]
    };

    return {
      ...sc,
      sceneNumber: idx + 1,
      phase,
      mcPose,
      mcPlacement: phase === "TAPI" ? "presenter-right" : "presenter-left",
      visual,
      klingPrompt:
        sc.klingPrompt ||
        buildDefaultKlingPrompt(sc, scriptObj.topic || fallbackTopic, visual),
      plainNarration,
      subtitlePhrases,
      sfx:
        sc.sfx ||
        (phase === "TAPI"
          ? "error"
          : phase === "JADI"
          ? "pop"
          : phase === "CLIMAX"
          ? "victory"
          : "whoosh")
    };
  });
  return scriptObj;
}

async function callGeminiWithKey(apiKey, systemInstruction, userPrompt) {
  const cleanKey = cleanApiKey(apiKey);
  if (!cleanKey) return null;

  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.75 }
  };

  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
    "gemini-flash-latest"
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        cleanKey
      )}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(22000)
      });
      if (resp.ok) {
        const data = await resp.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const rawText = parts
          .filter((p) => p?.text && !p?.thought)
          .map((p) => p.text)
          .join("\n");
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.scenes?.length >= 4) {
            parsed._usedModel = model;
            return parsed;
          }
        }
      }
    } catch {}
  }
  return null;
}

export async function analyzeTikTokUrl(tiktokUrl) {
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;
  const resp = await fetch(apiUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(12000)
  });
  const data = await resp.json();
  if (!data || !data.data) {
    throw new Error("Gagal mengambil metadata TikTok dari link tersebut.");
  }
  const d = data.data;
  return {
    id: d.id,
    title: d.title || "Video Edukasi TikTok",
    duration: d.duration,
    author: {
      uniqueId: d.author?.unique_id,
      nickname: d.author?.nickname
    },
    stats: {
      views: d.play_count,
      likes: d.digg_count,
      comments: d.comment_count,
      shares: d.share_count
    },
    formulaAnalysis:
      "Praktek Langsung Step-by-Step: Langsung aksi -> Masalah nyata ('TAPI...') -> Solusi praktek simpel ('JADI...') -> Berhasil ('SELAMAT!')."
  };
}

export async function generateScriptFromPrompt({
  prompt,
  referenceUrl = "",
  geminiApiKey = ""
}) {
  const cleanTopic = extractTopicFromPrompt(prompt);
  const defaults = inferVisualDefaults(cleanTopic);

  const [refMeta, researchData] = await Promise.all([
    referenceUrl && referenceUrl.includes("tiktok.com")
      ? analyzeTikTokUrl(referenceUrl).catch(() => null)
      : Promise.resolve(null),
    researchTopicOnline(cleanTopic)
  ]);

  const refContext = refMeta ? `Referensi TikTok: "${refMeta.title}"` : "";
  const factsBlock = researchData.summaryFacts.length
    ? `CATATAN RISET (JANGAN DI-COPY MENTAH, ubah jadi langkah praktek nyata yang seru!):\n- ${researchData.summaryFacts.join(
        "\n- "
      )}`
    : "";

  const systemInstruction = `Kamu adalah sutradara animasi & penulis skrip video edukasi pendek TikTok bergaya @untabiru5 (seperti "Ipul bikin kolam arwana" / "Kamu bikin kipas angin").

ATURAN WAJIB (HARUS DIPATUHI 100%):
1. BAHASA: **WAJIB 100% BAHASA INDONESIA SEHARI-HARI YANG SIMPEL, ASIK, SERU, DAN MUDAH DIPAHAMI!** DILARANG KERAS memakai kata/kalimat bahasa Inggris yang kaku, istilah buku pelajaran rumit, atau gaya membaca artikel Wikipedia!
2. GAYA HOST (MC RAJA IBLIS 2D ANIME):
   - Kalem, elegan, blak-blakan, asik kayak temen nongkrong tapi tetap ada aura "bos besar", sedikit sarkas ke kelakuan manusia ("Liat nih manusia...", "Nah gitu dong, baru pinter.").
   - Host sedang MENUNJUKKAN video animasi seorang manusia yang lagi PRAKTEK langsung langkah demi langkah!
3. PANJANG KALIMAT: **RINGKAS & CEPAT!** Maksimal 12–20 kata per scene (persis ritme @untabiru5!). Setiap scene harus berupa **AKSI PRAKTEK NYATA** (menuang, memotong, mencampur, memasang, membekukan, menyaring, mengaduk), BUKAN teori abstrak!
4. POLA WAJIB 6 SCENE:
   - Scene 1 (HOOK): Manusia nyoba bikin/ngelakuin [${cleanTopic}] pakai cara polos paling awal.
   - Scene 2 (TAPI): Masalah nyata langsung kejadian gara-gara cara polos itu! Diawali "[TAPI]".
   - Scene 3 (JADI): Solusi praktek konkret (sebut bahan/alat nyatanya + alasan simpelnya!). Diawali "[JADI]".
   - Scene 4 (TAPI): Masalah nyata tahap kedua muncul! Diawali "[TAPI]".
   - Scene 5 (JADI): Solusi praktek penyempurnaan tahap kedua! Diawali "[JADI]".
   - Scene 6 (CLIMAX): Hasil akhirnya sukses besar! Diawali "[SELAMAT!]" + kalimat asik + "Habis ini mau liat bikin apa lagi? [Tulis di komentar]!".
5. HIGHLIGHT SUBTITLE: Bungkus 2-3 kata kunci paling penting tiap scene pakai kurung siku [kata kunci] untuk kotak kuning ala @untabiru5.
6. TOPIK WAJIB: Bahas 100% tentang "${cleanTopic}" — JANGAN melenceng ke topik lain!
7. ARAHAN VISUAL PRAKTEK ("visual"): Pilih properti visual paling akurat agar animasi 2.5D benar-benar memperlihatkan proses prakteknya:
   - setting: "kitchen" | "aquarium" | "backyard" | "workshop" | "farm" | "sky_space"
   - mainContainer: "bowl_bucket" | "glass_tank" | "dirt_pond" | "oven_pan" | "coffee_cup" | "motor_frame" | "filter_tower" | "rocket_pad" | "rice_field" | "workbench_box"
   - heroObject: "ice_cream" | "food_dish" | "drink_brew" | "betta_fish" | "arowana_fish" | "ornamental_fish" | "catfish" | "fan_blades" | "solar_panel" | "water_layers" | "rocket" | "rice_fish" | "science_machine"
   - ingredientOrTool: "none" | "milk_sugar" | "salt_ice" | "whisk_mixer" | "spoon" | "ketapang_leaf" | "bucket" | "wrench" | "capacitor" | "fire_heat" | "net"
   - workerAction: "pour" | "stir" | "build" | "panic" | "celebrate"
   - problemVisual: "none" | "rock_ice_block" | "melting_puddle" | "murky_mud" | "fish_fighting" | "fish_jumping" | "motor_vibrating" | "smoke_overheat" | "cracked_leak" | "rain_cold"
   - solutionVisual: "none" | "salt_frost_aura" | "creamy_swirl" | "waffle_cones" | "glass_divider" | "clear_bubbles" | "mesh_fence" | "rotating_arrows" | "sparkle_shield"
   - callouts: array 2 label singkat BAHASA INDONESIA HURUF BESAR yang menunjuk komponen di layar (contoh: ["GARAM + ES BATU", "SUHU -15°C"]).

Kembalikan HANYA JSON valid:
{
  "title": "Judul Bahasa Indonesia Singkat & Menarik",
  "topic": "${cleanTopic}",
  "hookFormula": "Praktek Awal -> TAPI (Gagal) -> JADI (Trik Ilmiah) -> SELAMAT!",
  "scenes": [
    {
      "sceneNumber": 1,
      "phase": "HOOK" | "TAPI" | "JADI" | "CLIMAX",
      "mcPose": "default" | "sarcastic" | "explaining" | "eureka",
      "componentLabel": "LABEL BAHASA INDONESIA SINGKAT",
      "narration": "Narasi singkat 12-20 kata 100% Bahasa Indonesia dengan [kata kunci]",
      "highlightWords": ["kata kunci"],
      "visual": {
        "setting": "${defaults.setting}",
        "mainContainer": "${defaults.mainContainer}",
        "heroObject": "${defaults.heroObject}",
        "ingredientOrTool": "pour",
        "workerAction": "pour",
        "problemVisual": "none",
        "solutionVisual": "none",
        "accentColor": "${defaults.accentColor}",
        "callouts": ["LABEL 1", "LABEL 2"]
      },
      "klingPrompt": "Detailed English visual action prompt (25-40 words) describing ONLY what happens visually on screen in a cute 3D Blender low-poly isometric animation style (like untabiru5) showing a teal-hoodie cartoon human doing this exact step with the real objects (no text/subtitles)",
      "sfx": "whoosh" | "error" | "pop" | "ding" | "victory"
    }
  ]
}`;

  const userPrompt = `Prompt user: "${prompt}"\nTopik: "${cleanTopic}"\n${refContext}\n${factsBlock}\nBuat 6 scene praktek langsung 100% Bahasa Indonesia santai, seru, dan gampang dipahami ala @untabiru5 dengan Host MC Raja Iblis!`;

  const candidateGeminiKeys = Array.from(
    new Set([cleanApiKey(geminiApiKey), cleanApiKey(process.env.GEMINI_API_KEY)].filter(Boolean))
  );
  for (const gKey of candidateGeminiKeys) {
    const geminiResult = await callGeminiWithKey(gKey, systemInstruction, userPrompt);
    if (geminiResult) {
      const usedModel = geminiResult._usedModel || "gemini-3.5-flash-lite";
      delete geminiResult._usedModel;
      const enriched = enrichScript(geminiResult, researchData, cleanTopic);
      enriched.referenceMetadata = refMeta;
      enriched.aiEngine = `${usedModel} + Riset ID`;
      return enriched;
    }
  }

  try {
    const resp = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ]
      }),
      signal: AbortSignal.timeout(15000)
    });
    if (resp.ok) {
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.scenes?.length >= 4) {
          const enriched = enrichScript(parsed, researchData, cleanTopic);
          enriched.referenceMetadata = refMeta;
          enriched.aiEngine = "AI Gratis + Riset ID";
          return enriched;
        }
      }
    }
  } catch {}

  const fallback = enrichScript(buildOfflineFallbackScript(cleanTopic), researchData, cleanTopic);
  fallback.referenceMetadata = refMeta;
  fallback.aiEngine = "Blueprint Praktek ID";
  return fallback;
}

export async function synthesizeSpeechStateless({
  text,
  voiceId = CHARACTER_BIBLE.defaultVoiceId,
  elevenlabsApiKey = ""
}) {
  const cleanText = (text || "").replace(/\[([^\]]+)\]/g, "$1").trim();
  if (!cleanText) throw new Error("Teks voiceover kosong.");

  const effectiveVoiceId = cleanApiKey(voiceId) || CHARACTER_BIBLE.defaultVoiceId;
  const browserElKey = cleanApiKey(elevenlabsApiKey);
  const envElKey = cleanApiKey(process.env.ELEVENLABS_API_KEY);
  const candidateKeys = Array.from(new Set([browserElKey, envElKey].filter(Boolean)));
  const PREMADE_MALE_FALLBACK_ID = "nPczCjzI2devNBz1zQrb";
  let elevenlabsError = null;

  async function callElevenLabsTts(apiKey, targetVoiceId) {
    const elResp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
        targetVoiceId
      )}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg"
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.82,
            style: 0.35,
            use_speaker_boost: true
          }
        }),
        signal: AbortSignal.timeout(18000)
      }
    );

    if (elResp.ok) {
      const buf = Buffer.from(await elResp.arrayBuffer());
      if (buf.length > 500) return { ok: true, buf };
    }

    const errBody = await elResp.text().catch(() => "");
    let msg = `HTTP ${elResp.status}`;
    try {
      const parsedErr = JSON.parse(errBody);
      msg = parsedErr?.detail?.message || msg;
    } catch {}
    return { ok: false, status: elResp.status, msg };
  }

  for (const activeKey of candidateKeys) {
    try {
      const primary = await callElevenLabsTts(activeKey, effectiveVoiceId);
      if (primary.ok) {
        return {
          audioBase64: primary.buf.toString("base64"),
          mimeType: "audio/mpeg",
          provider: "elevenlabs",
          voiceId: effectiveVoiceId
        };
      }

      elevenlabsError = primary.msg;
      console.error("ElevenLabs TTS error:", primary.status, primary.msg);

      if (primary.status === 402 && effectiveVoiceId !== PREMADE_MALE_FALLBACK_ID) {
        const premade = await callElevenLabsTts(activeKey, PREMADE_MALE_FALLBACK_ID);
        if (premade.ok) {
          return {
            audioBase64: premade.buf.toString("base64"),
            mimeType: "audio/mpeg",
            provider: "elevenlabs",
            voiceId: PREMADE_MALE_FALLBACK_ID,
            requestedVoiceId: effectiveVoiceId,
            voiceFallbackNote: `Akun ElevenLabs Free membatasi Library Voice — otomatis memakai suara cowok deep ElevenLabs (${PREMADE_MALE_FALLBACK_ID}).`
          };
        }
      }
    } catch (e) {
      elevenlabsError = e.message;
      console.error("ElevenLabs TTS exception:", e.message);
    }
  }

  const chunks = [];
  const words = cleanText.split(/\s+/);
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 170) {
      chunks.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur.trim()) chunks.push(cur.trim());

  const buffers = [];
  for (const c of chunks) {
    try {
      const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=id&q=${encodeURIComponent(
        c
      )}`;
      const r = await fetch(ttsUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(9000)
      });
      if (r.ok) {
        buffers.push(Buffer.from(await r.arrayBuffer()));
      }
    } catch {}
  }

  if (buffers.length > 0) {
    const combined = Buffer.concat(buffers);
    return {
      audioBase64: combined.toString("base64"),
      mimeType: "audio/mpeg",
      provider: "free-male-baritone-fallback",
      pitchShiftMale: true,
      voiceId: effectiveVoiceId,
      elevenlabsError
    };
  }

  return {
    audioBase64: null,
    mimeType: null,
    provider: "offline-timer-fallback",
    voiceId: effectiveVoiceId,
    elevenlabsError
  };
}

// ============================================================================
// OFFICIAL KLING AI 3D VIDEO GENERATION (https://api-singapore.klingai.com)
// ============================================================================
const KLING_BASE_URL = "https://api-singapore.klingai.com";

export const KLING_CONSISTENT_3D_STYLE =
  "Cute 3D Blender low-poly isometric educational animation style (clean smooth stylized 3D diorama like viral educational explainer videos), bright cheerful daylight studio lighting, crisp colorful materials, soft shadows, featuring a cute round-headed cartoon human wearing a teal-green hoodie and dark blue pants actively demonstrating the experiment step by step, smooth camera motion, vertical 9:16 framing, NO text, NO letters, NO subtitles, NO watermark.";

function buildDefaultKlingPrompt(scene, topic, visual) {
  const phaseAction =
    scene.phase === "TAPI"
      ? "something suddenly goes wrong dramatically and the cute teal-hoodie 3D human reacts in comical panic with arms raised"
      : scene.phase === "JADI"
      ? "the cute teal-hoodie 3D human cleverly installs or applies the practical fix and it immediately works smoothly"
      : scene.phase === "CLIMAX"
      ? "the finished result looks vibrant, glowing, and perfect while the cute teal-hoodie 3D human jumps happily in celebration"
      : "the cute teal-hoodie 3D human starts preparing the initial setup enthusiastically";

  return `${KLING_CONSISTENT_3D_STYLE} Topic: ${topic}. Step: ${
    scene.componentLabel || scene.plainNarration
  }. Setting: ${visual?.setting || "bright studio"}. Action: ${phaseAction}.`;
}

export async function createKlingVideoTask({
  prompt = "",
  klingApiKey = "",
  type = "text2video",
  imageBase64 = "",
  modelName = "kling-v2-6",
  duration = "5",
  aspectRatio = "9:16",
  mode = "std"
}) {
  const browserKey = cleanApiKey(klingApiKey);
  const envKey = cleanApiKey(process.env.KLING_API_KEY);
  const candidateKeys = Array.from(new Set([browserKey, envKey].filter(Boolean)));
  if (!candidateKeys.length) {
    throw new Error("KLING_API_KEY belum diisi. Masukkan di Settings atau Vercel Environment Variables.");
  }

  const endpointPath = type === "image2video" ? "/v1/videos/image2video" : "/v1/videos/text2video";
  const finalPrompt =
    type === "image2video"
      ? prompt ||
        "High quality modern 2D anime character animation, handsome silver-haired demon king with crimson hair streak and broken left horn glowing red, smooth natural breathing, confident charismatic head movement, blinking glowing crimson-amber eyes, speaking mouth motion, subtle dark shadow aura floating around shoulders, waist-up anime host framing, steady camera"
      : prompt.includes("Blender") || prompt.includes("3D")
      ? prompt
      : `${KLING_CONSISTENT_3D_STYLE} ${prompt}`;

  const modelsToTry = Array.from(new Set([modelName, "kling-v2-6", "kling-v2-1", "kling-v1-6"]));
  let lastError = "Gagal menghubungi Kling AI.";

  for (const activeKey of candidateKeys) {
    for (const mdl of modelsToTry) {
      try {
        const body =
          type === "image2video"
            ? {
                model_name: mdl,
                image: String(imageBase64 || "").replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, ""),
                prompt: finalPrompt.slice(0, 2400),
                negative_prompt: "blurry, distorted face, extra limbs, text, watermark, ugly, deformed",
                duration: String(duration || "5"),
                mode
              }
            : {
                model_name: mdl,
                prompt: finalPrompt.slice(0, 2400),
                negative_prompt:
                  "text, subtitles, words, watermark, logo, blurry, distorted, scary, dark gloomy, realistic live action photo",
                duration: String(duration || "5"),
                aspect_ratio: aspectRatio || "9:16",
                mode
              };

        const resp = await fetch(`${KLING_BASE_URL}${endpointPath}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20000)
        });

        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data?.code === 0 && data?.data?.task_id) {
          return {
            ok: true,
            taskId: data.data.task_id,
            taskStatus: data.data.task_status || "submitted",
            modelUsed: mdl,
            type
          };
        }

        lastError = data?.message || `Kling HTTP ${resp.status}`;
        // Stop model loop immediately if auth/balance error (won't be fixed by switching models)
        if (resp.status === 401 || resp.status === 403 || /balance|credit|quota|resource|insufficient|pack/i.test(lastError)) {
          break;
        }
      } catch (e) {
        lastError = e.message;
      }
    }
  }

  throw new Error(`Kling AI gagal memulai render: ${lastError}`);
}

export async function getKlingVideoStatus({
  taskId,
  type = "text2video",
  klingApiKey = ""
}) {
  const browserKey = cleanApiKey(klingApiKey);
  const envKey = cleanApiKey(process.env.KLING_API_KEY);
  const candidateKeys = Array.from(new Set([browserKey, envKey].filter(Boolean)));
  if (!candidateKeys.length) {
    throw new Error("KLING_API_KEY tidak tersedia.");
  }

  const endpointPath =
    type === "image2video"
      ? `/v1/videos/image2video/${encodeURIComponent(taskId)}`
      : `/v1/videos/text2video/${encodeURIComponent(taskId)}`;

  let lastError = "Gagal memeriksa status Kling AI.";
  for (const activeKey of candidateKeys) {
    try {
      const resp = await fetch(`${KLING_BASE_URL}${endpointPath}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${activeKey}`,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(12000)
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data?.code === 0 && data?.data) {
        const d = data.data;
        const videoUrl = d?.task_result?.videos?.[0]?.url || null;
        return {
          ok: true,
          taskId: d.task_id || taskId,
          status: d.task_status || "processing",
          statusMsg: d.task_status_msg || "",
          videoUrl,
          proxiedVideoUrl: videoUrl ? `/api/kling-proxy?url=${encodeURIComponent(videoUrl)}` : null
        };
      }
      lastError = data?.message || `HTTP ${resp.status}`;
    } catch (e) {
      lastError = e.message;
    }
  }

  throw new Error(lastError);
}
