// Shared Stateless AI Video Engine for MaouEdu Studio (Vercel Serverless + Local Dev)
// 100% Bahasa Indonesia santai & seru, praktek langsung ala @untabiru5 + Ciri Khas Konsisten MC Raja Iblis!

export const CHARACTER_BIBLE = {
  name: "Maou Vaelen (Sang Raja Iblis)",
  archetype: "Host 2D Anime — Kalem, Elegan, Blak-blakan, Sedikit Sarkas",
  canonicalAnchor: "/style-anchors/mc_default.jpg",
  defaultVoiceId: "nPczCjzI2devNBz1zQrb",
  voiceUrl: "https://elevenlabs.io/voices/nPczCjzI2devNBz1zQrb",
  visualTraits: {
    hair: "Rambut spiky silver-gray dengan satu helai poni tengah warna merah darah + anting stud/ring hitam di telinga kiri",
    horns:
      "Tanduk hitam obsidian asimetris (kunci mc_default.jpg): tanduk kiri layar tinggi melengkung utuh, tanduk kanan layar patah dengan retakan magma merah menyala",
    eyes: "Mata golden-amber menyala dengan eyeliner hitam tajam & rahang pria dewasa tegas",
    outfit: "Turtleneck hitam + jas panjang hitam berkerah tegak beraksen garis emas tipis di kerah/bahu, 1 bros permata merah di dada kiri, sarung tangan hitam dengan cincin perak",
    aura: "Aura bayangan gelap halus & rim light sinematik satu arah"
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
  if (/(ikan\s*pari|\bpari\b|stingray)/i.test(lower)) {
    return {
      setting: "backyard",
      mainContainer: "dirt_pond",
      heroObject: "stingray_pond",
      accentColor: "#0284c7"
    };
  }
  if (/(bitcoin|\bbtc\b|mining|miner|kripto|crypto|asic)/i.test(lower)) {
    return {
      setting: "house_bunker",
      mainContainer: "bunker_chamber",
      heroObject: "bitcoin_bunker",
      accentColor: "#f59e0b"
    };
  }
  if (/(sr-?71|blackbird|titanium|pemuaian|pesawat\s*bocor|supersonik|supersonic)/i.test(lower)) {
    return {
      setting: "runway",
      mainContainer: "runway_strip",
      heroObject: "supersonic_jet",
      accentColor: "#334155"
    };
  }
  if (/(aquarium|akuarium|kolam|\bikan\b|\bkoi\b|\blele\b|guppy|channa|udang|koki)/i.test(lower)) {
    return {
      setting: lower.includes("kolam") ? "backyard" : "aquarium",
      mainContainer: lower.includes("kolam") ? "dirt_pond" : "glass_tank",
      heroObject: lower.includes("lele") ? "catfish" : "ornamental_fish",
      accentColor: "#f97316"
    };
  }
  if (/(kipas|dinamo)/i.test(lower)) {
    return {
      setting: "workshop",
      mainContainer: "motor_frame",
      heroObject: "fan_blades",
      accentColor: "#38bdf8"
    };
  }
  if (/\b(roket|pesawat|satelit)\b/i.test(lower)) {
    return {
      setting: "runway",
      mainContainer: "runway_strip",
      heroObject: "custom_stage",
      accentColor: "#e11d48"
    };
  }
  if (/(sawah|padi|minapadi)/i.test(lower)) {
    return {
      setting: "farm",
      mainContainer: "rice_field",
      heroObject: "rice_fish",
      accentColor: "#84cc16"
    };
  }
  if (/(bawah tanah|geotermal|panas bumi|pltu|rumah tangga|rumah)/i.test(lower)) {
    return {
      setting: "house_bunker",
      mainContainer: "bunker_chamber",
      heroObject: "custom_stage",
      accentColor: "#f59e0b"
    };
  }
  if (/(kulkas|\bac\b|freezer|pendingin|oven|kompor|microwave|pizza|roti|\bkue\b|donat|martabak|masak|goreng|\bmie\b|bakso|tahu|tempe|cokelat|coklat|\bkopi\b|\bteh\b|boba|\bjus\b|minuman|\bsusu\b)/i.test(lower)) {
    return {
      setting: "kitchen",
      mainContainer: "oven_pan",
      heroObject: "custom_stage",
      accentColor: "#f59e0b"
    };
  }
  if (/(gunung|berapi|gempa|hujan|petir|\balam\b|tanam|kebun|pohon|fotosintesis|filter air|sumur)/i.test(lower)) {
    return {
      setting: "backyard",
      mainContainer: "workbench_box",
      heroObject: "custom_stage",
      accentColor: "#10b981"
    };
  }
  return {
    setting: "workshop",
    mainContainer: "workbench_box",
    heroObject: "custom_stage",
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
  } catch { }

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

  if (/(ikan\s*pari|\bpari\b|stingray)/i.test(lower)) {
    return {
      title: "Bikin Kolam Ikan Pari Anti-Bocor, Anti-Amonia!",
      topic: "Kolam Ikan Pari",
      hookFormula: "Gali -> Merembes -> Cor Beton -> Perut Lecet -> Pasir + Filter 3 Sekat -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          componentLabel: "TAHAP 1: BANGUN KOLAM BATA IKAN PARI",
          narration: "Liat nih Ipul bikin kolam [ikan pari] pakai susunan bata, isi air, terus langsung masukin parinya?",
          highlightWords: ["ikan pari"],
          visual: {
            setting: "backyard",
            mainContainer: "dirt_pond",
            heroObject: "stingray_pond",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "none",
            accentColor: "#0284c7",
            comicText: "GALI!",
            hookCard: { title: "Kolam Ikan Pari?", subtitle: "Langsung susun bata + air" },
            infoCards: [{ label: "Jenis Ikan", value: "Pari Air Tawar", tone: "normal" }],
            meter: { label: "AIR KOLAM", value: 85, min: 0, max: 100, unit: "%", danger: false },
            stage3d: { environment: "backyard_cutaway", cameraShot: "isometric_cutaway", skyMode: "day", objects: [] }
          },
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH 1: AIR LANGSUNG MEREMBES KE TANAH!",
          narration: "[TAPI] baru sebentar, airnya [merembes habis] ke celah tanah dan bata! Pari hampir kekeringan tuh!",
          highlightWords: ["TAPI", "merembes habis"],
          visual: {
            setting: "backyard",
            mainContainer: "dirt_pond",
            heroObject: "stingray_pond",
            workerAction: "panic",
            problemVisual: "dry_seep",
            solutionVisual: "none",
            accentColor: "#e11d48",
            comicText: "BOCOR!",
            bannerText: "MEREMBES!",
            infoCards: [{ label: "Masalah 1", value: "Air Hilang ke Tanah", tone: "warn" }],
            meter: { label: "AIR KOLAM", value: 12, min: 0, max: 100, unit: "%", danger: true },
            stage3d: { environment: "backyard_cutaway", cameraShot: "disaster_shake", skyMode: "day", objects: [] }
          },
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 1: BEKISTING + TULANGAN BESI + COR BETON!",
          narration: "[JADI] pasang papan kayu, anyam [besi tulangan], terus cor beton rapat biar airnya [kedap] seratus persen!",
          highlightWords: ["JADI", "besi tulangan", "kedap"],
          visual: {
            setting: "backyard",
            mainContainer: "dirt_pond",
            heroObject: "stingray_pond",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "concrete_rebar",
            accentColor: "#0284c7",
            comicText: "COR BETON!",
            bannerText: "KEDAP AIR!",
            infoCards: [{ label: "Struktur Kolam", value: "Beton + Tulangan Besi", tone: "good" }],
            meter: { label: "AIR KOLAM", value: 92, min: 0, max: 100, unit: "%", danger: false },
            stage3d: { environment: "backyard_cutaway", cameraShot: "closeup_hands", skyMode: "day", objects: [] }
          },
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH BARU: PERUT PARI LECET & KERACUNAN AMONIA!",
          narration: "[TAPI] dasar semen terlalu kasar bikin [perut pari lecet], ditambah air keruh penuh [amonia] beracun!",
          highlightWords: ["TAPI", "perut pari lecet", "amonia"],
          visual: {
            setting: "backyard",
            mainContainer: "dirt_pond",
            heroObject: "stingray_pond",
            workerAction: "panic",
            problemVisual: "murky_mud",
            solutionVisual: "concrete_rebar",
            accentColor: "#e11d48",
            comicText: "LECET!",
            bannerText: "AMONIA TINGGI!",
            infoCards: [{ label: "Amonia Kotoran", value: "88 ppm (Bahaya!)", tone: "warn" }],
            meter: { label: "AMONIA AIR", value: 88, min: 0, max: 100, unit: "ppm", danger: true },
            stage3d: { environment: "backyard_cutaway", cameraShot: "side_inspection", skyMode: "day", objects: [] }
          },
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 2: TABUR PASIR SILIKA HALUS DI DASAR!",
          narration: "[JADI] taburin [pasir halus] tebal di dasar beton biar pari bisa ngubur badan tanpa [lecet] lagi!",
          highlightWords: ["JADI", "pasir halus", "lecet"],
          visual: {
            setting: "backyard",
            mainContainer: "dirt_pond",
            heroObject: "stingray_pond",
            workerAction: "pour",
            problemVisual: "none",
            solutionVisual: "sand_bed",
            accentColor: "#fbbf24",
            comicText: "PASIR HALUS!",
            infoCards: [{ label: "Alas Dasar", value: "Pasir Silika 5 cm", tone: "good" }],
            meter: { label: "KENYAMANAN", value: 78, min: 0, max: 100, unit: "%", danger: false },
            stage3d: { environment: "backyard_cutaway", cameraShot: "closeup_hands", skyMode: "day", objects: [] }
          },
          sfx: "pop"
        },
        {
          sceneNumber: 6,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 3: PASANG SUMP FILTER 3 SEKAT (SIKAT + BAKTERI BAIK)!",
          narration: "[JADI] pasang pipa penyedot ke [filter bertingkat] isi sikat rol, spons busa, dan [bakteri baik] pengurai amonia!",
          highlightWords: ["JADI", "filter bertingkat", "bakteri baik"],
          visual: {
            setting: "backyard",
            mainContainer: "dirt_pond",
            heroObject: "stingray_pond",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "filter_sump",
            accentColor: "#10b981",
            comicText: "FILTER BIO!",
            bannerText: "FILTER 3 SEKAT!",
            infoCards: [{ label: "Amonia Turun", value: "8 ppm (Aman!)", tone: "good" }],
            meter: { label: "AMONIA AIR", value: 8, min: 0, max: 100, unit: "ppm", danger: false },
            stage3d: { environment: "backyard_cutaway", cameraShot: "isometric_cutaway", skyMode: "day", objects: [] }
          },
          sfx: "ding"
        },
        {
          sceneNumber: 7,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "PERHATIAN! EKOR PARI BERBISA — BERSIHKAN PAKAI JARING!",
          narration: "[TAPI] awas jangan asal celup tangan karena ekor pari [berbisa]! Gunakan [jaring gagang panjang] ini!",
          highlightWords: ["TAPI", "berbisa", "jaring gagang panjang"],
          visual: {
            setting: "backyard",
            mainContainer: "dirt_pond",
            heroObject: "stingray_pond",
            workerAction: "long_net",
            problemVisual: "venom_tail",
            solutionVisual: "filter_sump",
            accentColor: "#f59e0b",
            comicText: "AWAS BISA!",
            bannerText: "EKOR BERBISA!",
            infoCards: [{ label: "Keamanan", value: "Pakai Jaring Panjang", tone: "warn" }],
            meter: { label: "KEJERNIHAN", value: 94, min: 0, max: 100, unit: "%", danger: false },
            stage3d: { environment: "backyard_cutaway", cameraShot: "side_inspection", skyMode: "day", objects: [] }
          },
          sfx: "pop"
        },
        {
          sceneNumber: 8,
          phase: "CLIMAX",
          mcPose: "eureka",
          componentLabel: "HASIL AKHIR: IKAN PARI NYAMAN SAMPAI BERANAK!",
          narration: "[SELAMAT!] Air jernih berpasir bikin pari betah sampai [beranak] dan langsung berenang! Mau bikin kolam apa lagi? [Tulis di komentar]!",
          highlightWords: ["SELAMAT!", "beranak", "Tulis di komentar"],
          visual: {
            setting: "backyard",
            mainContainer: "dirt_pond",
            heroObject: "stingray_pond",
            workerAction: "celebrate",
            problemVisual: "none",
            solutionVisual: "baby_stingrays",
            accentColor: "#10b981",
            comicText: "BERANAK!",
            bannerText: "SELAMAT!",
            infoCards: [{ label: "Status Kolam", value: "Jernih & Beranak!", tone: "good" }],
            meter: { label: "KESEHATAN", value: 100, min: 0, max: 100, unit: "%", danger: false },
            stage3d: { environment: "backyard_cutaway", cameraShot: "hero_low", skyMode: "day", objects: [] }
          },
          sfx: "victory"
        }
      ]
    };
  }

  if (/(bitcoin|\bbtc\b|mining|miner|kripto|crypto|asic)/i.test(lower)) {
    return {
      title: "Mining Bitcoin Pakai Bunker & PLTU Mini Anti-Boncos!",
      topic: "Mining Bitcoin & PLTU Mini",
      hookFormula: "Kamar Bising 75 dB -> Tagihan 4,3 Juta -> Bunker 55°C -> Panel Surya Mati -> Cairan Dielektrik + PLTU Mini -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          componentLabel: "TAHAP 1: NYALAKAN MESIN MINING DI KAMAR!",
          narration: "Ipul coba nyalain mesin [mining Bitcoin] di kamar—langsung bunyi dengung kencang [75 desibel] bikin kuping pengang!",
          highlightWords: ["mining Bitcoin", "75 desibel"],
          visual: {
            setting: "house_bunker",
            mainContainer: "bunker_chamber",
            heroObject: "bitcoin_bunker",
            workerAction: "cover_ears",
            problemVisual: "sound_waves",
            solutionVisual: "none",
            accentColor: "#e11d48",
            comicText: "75 dB!",
            hookCard: { title: "Nambang Bitcoin di Rumah?", subtitle: "Bising & boros listrik!" },
            infoCards: [{ label: "Suara Mesin", value: "± 75 dB (Bising!)", tone: "warn" }],
            meter: { label: "BISING", value: 75, min: 0, max: 100, unit: "dB", danger: true },
            stage3d: { environment: "house_bunker", cameraShot: "room_closeup", skyMode: "day", objects: [] }
          },
          sfx: "error"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH 1: TAGIHAN LISTRIK MELEDAK RP 4,3 JUTA!",
          narration: "[TAPI] bukan cuma berisik, sebulan dipakai malah keluar tagihan listrik [Rp 4,3 juta]! Boncos duluan sebelum cuan!",
          highlightWords: ["TAPI", "Rp 4,3 juta"],
          visual: {
            setting: "house_bunker",
            mainContainer: "bunker_chamber",
            heroObject: "bitcoin_bunker",
            workerAction: "panic",
            problemVisual: "bill_shock",
            solutionVisual: "none",
            accentColor: "#e11d48",
            comicText: "BONCOS!",
            bannerText: "± Rp 4,3 JUTA!",
            infoCards: [{ label: "Tagihan Listrik", value: "± Rp 4,3 Juta / Bln", tone: "warn" }],
            meter: { label: "BEBAN DAYA", value: 92, min: 0, max: 100, unit: "%", danger: true },
            stage3d: { environment: "house_bunker", cameraShot: "room_closeup", skyMode: "day", objects: [] }
          },
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 1: GALI BUNKER BAWAH TANAH KEDAP SUARA!",
          narration: "[JADI] Ipul bikin [bunker rahasia] di bawah tanah plus tangga—sekarang suara dengung terkunci dan kamar [hening] total!",
          highlightWords: ["JADI", "bunker rahasia", "hening"],
          visual: {
            setting: "house_bunker",
            mainContainer: "bunker_chamber",
            heroObject: "bitcoin_bunker",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "bunker_built",
            accentColor: "#38bdf8",
            comicText: "KEDAP!",
            bannerText: "TAMBANG RAHASIA!",
            infoCards: [{ label: "Peredam Alami", value: "Bunker Bawah Tanah", tone: "good" }],
            meter: { label: "BISING KAMAR", value: 18, min: 0, max: 100, unit: "dB", danger: false },
            stage3d: { environment: "house_bunker", cameraShot: "bunker_view", skyMode: "day", objects: [] }
          },
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH BARU: BUNKER PENGAP TEMBUS 55°C!",
          narration: "[TAPI] gara-gara ruangannya tertutup rapat, panas mesin numpuk bikin [suhu bunker 55 derajat]! Mesin bisa [meleleh]!",
          highlightWords: ["TAPI", "suhu bunker 55 derajat", "meleleh"],
          visual: {
            setting: "house_bunker",
            mainContainer: "bunker_chamber",
            heroObject: "bitcoin_bunker",
            workerAction: "panic",
            problemVisual: "heat_trap",
            solutionVisual: "bunker_built",
            accentColor: "#ef4444",
            comicText: "55°C!!",
            bannerText: "OVERHEAT!",
            infoCards: [{ label: "Suhu Bunker", value: "55°C (Terlalu Panas)", tone: "warn" }],
            meter: { label: "SUHU BUNKER", value: 55, min: 20, max: 80, unit: "°C", danger: true },
            stage3d: { environment: "house_bunker", cameraShot: "bunker_view", skyMode: "heat_alert", objects: [] }
          },
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "COBA PANEL SURYA — TAPI MALAM MATI!",
          narration: "[JADI] coba pasang [panel surya] di atap—siang lancar gratis, [TAPI] begitu [malam tiba] matahari hilang ya mati lagi!",
          highlightWords: ["JADI", "panel surya", "malam tiba"],
          visual: {
            setting: "house_bunker",
            mainContainer: "bunker_chamber",
            heroObject: "bitcoin_bunker",
            workerAction: "inspect",
            problemVisual: "night_outage",
            solutionVisual: "solar_roof",
            accentColor: "#f59e0b",
            comicText: "MATI LAMPU!",
            bannerText: "TENAGA MATAHARI!",
            infoCards: [{ label: "Malam Hari", value: "Panel Surya = 0 Watt", tone: "warn" }],
            meter: { label: "DAYA SURYA", value: 0, min: 0, max: 100, unit: "%", danger: true },
            stage3d: { environment: "house_bunker", cameraShot: "rooftop_view", skyMode: "night", objects: [] }
          },
          sfx: "error"
        },
        {
          sceneNumber: 6,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 2: RENDAM MESIN DI CAIRAN DIELEKTRIK!",
          narration: "[JADI] celupin mesinnya ke tangki [cairan dielektrik] anti-korslet! Panas terserap, cuma suhunya [60 derajat] belum bisa didihin air!",
          highlightWords: ["JADI", "cairan dielektrik", "60 derajat"],
          visual: {
            setting: "house_bunker",
            mainContainer: "bunker_chamber",
            heroObject: "bitcoin_bunker",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "immersion_tank",
            accentColor: "#38bdf8",
            comicText: "IMMERSION!",
            infoCards: [
              { label: "Air Mendidih", value: "100°C (Kurang Panas)", tone: "warn" },
              { label: "Suhu Cairan", value: "± 60°C Stabil", tone: "normal" }
            ],
            meter: { label: "CAIRAN", value: 60, min: 0, max: 120, unit: "°C", danger: false },
            stage3d: { environment: "house_bunker", cameraShot: "bunker_view", skyMode: "day", objects: [] }
          },
          sfx: "pop"
        },
        {
          sceneNumber: 7,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI 3: UBAH PANAS JADI PLTU MINI!",
          narration: "[JADI] salurin ke [penukar panas] berisi fluida titik didih rendah buat muter [turbin uap] lalu dingin lagi di tanah!",
          highlightWords: ["JADI", "penukar panas", "turbin uap"],
          visual: {
            setting: "house_bunker",
            mainContainer: "bunker_chamber",
            heroObject: "bitcoin_bunker",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "pltu_loop",
            accentColor: "#10b981",
            comicText: "PLTU MINI!",
            bannerText: "PLTU MINI!",
            infoCards: [{ label: "Turbin → Generator", value: "Listrik Mengalir!", tone: "good" }],
            meter: { label: "DAYA TURBIN", value: 96, min: 0, max: 100, unit: "%", danger: false },
            stage3d: { environment: "house_bunker", cameraShot: "full_cross_section", skyMode: "day", objects: [] }
          },
          sfx: "ding"
        },
        {
          sceneNumber: 8,
          phase: "CLIMAX",
          mcPose: "eureka",
          componentLabel: "HASIL AKHIR: LISTRIK RUMAH NYALA GRATIS 24 JAM!",
          narration: "[SELAMAT!] Kamar tenang adem, lampu rumah nyala gratis dari panas tambang sendiri! Mau bikin sistem gila apa lagi? [Tulis di komentar]!",
          highlightWords: ["SELAMAT!", "Tulis di komentar"],
          visual: {
            setting: "house_bunker",
            mainContainer: "bunker_chamber",
            heroObject: "bitcoin_bunker",
            workerAction: "celebrate",
            problemVisual: "none",
            solutionVisual: "house_lit",
            accentColor: "#10b981",
            comicText: "GRATIS!",
            bannerText: "SELAMAT!",
            infoCards: [{ label: "Tagihan Listrik", value: "Rp 0 / Mandiri 24 Jam", tone: "good" }],
            meter: { label: "EFISIENSI", value: 100, min: 0, max: 100, unit: "%", danger: false },
            stage3d: { environment: "house_bunker", cameraShot: "full_cross_section", skyMode: "night", objects: [] }
          },
          sfx: "victory"
        }
      ]
    };
  }

  if (/(sr-?71|blackbird|titanium|pemuaian|pesawat\s*bocor|supersonik|supersonic)/i.test(lower)) {
    return {
      title: "Kenapa Pesawat Termahal SR-71 Blackbird Sengaja Dibuat Bocor?",
      topic: "Pemuaian Termal SR-71 Blackbird",
      hookFormula: "Bocor di Darat -> Celah Titanium -> Ngebut Mach 3 (500°C) -> Memuai Rapat -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          componentLabel: "MISTERI 1: PESAWAT TRILIUNAN BOCOR DI DARAT!",
          narration: "Ini bukan pesawat rusak! [SR-71 Blackbird] termahal ini justru sengaja dibiarkan [bocor bahan bakar] pas diam di landasan!",
          highlightWords: ["SR-71 Blackbird", "bocor bahan bakar"],
          visual: {
            setting: "runway",
            mainContainer: "runway_strip",
            heroObject: "supersonic_jet",
            workerAction: "inspect",
            problemVisual: "fuel_leak",
            solutionVisual: "none",
            accentColor: "#f59e0b",
            comicText: "BOCOR?!",
            bannerText: "BOCOR?!",
            hookCard: { title: "Pesawat triliunan?", subtitle: "Sengaja dibuat bocor di darat?" },
            infoCards: [{ label: "Di Landasan", value: "Bahan Bakar Menetes", tone: "warn" }],
            meter: { label: "SUHU BODI", value: 30, min: 0, max: 500, unit: "°C", danger: false },
            stage3d: { environment: "runway_tarmac", cameraShot: "side_inspection", skyMode: "day", objects: [] }
          },
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "LIHAT CLOSE-UP: PELAT TITANIUMNYA SENGAJA RENGGANG!",
          narration: "[TAPI] jangan kaget—panel logam [titanium] di bodinya sengaja dikasih [celah renggang] saat suhu dingin di darat!",
          highlightWords: ["TAPI", "titanium", "celah renggang"],
          visual: {
            setting: "runway",
            mainContainer: "runway_strip",
            heroObject: "supersonic_jet",
            workerAction: "inspect",
            problemVisual: "plate_gap",
            solutionVisual: "none",
            accentColor: "#38bdf8",
            comicText: "RENGGANG!",
            hookCard: { title: "Kenapa ada celah?", subtitle: "Zoom pelat bodi titanium!" },
            infoCards: [{ label: "Celah Dingin", value: "Sengaja Tidak Rapat", tone: "normal" }],
            meter: { label: "SUHU BODI", value: 32, min: 0, max: 500, unit: "°C", danger: false },
            stage3d: { environment: "runway_tarmac", cameraShot: "macro_plate", skyMode: "day", objects: [] }
          },
          sfx: "pop"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SAAT TERBANG MACH 3: SUHU BODI TEMBUS 500°C!",
          narration: "[JADI] begitu ngebut menembus [Mach 3], gesekan udara bikin seluruh bodi pesawat memanas ekstrem sampai [500 derajat]!",
          highlightWords: ["JADI", "Mach 3", "500 derajat"],
          visual: {
            setting: "runway",
            mainContainer: "runway_strip",
            heroObject: "supersonic_jet",
            workerAction: "inspect",
            problemVisual: "none",
            solutionVisual: "afterburner_heat",
            accentColor: "#ef4444",
            comicText: "500°C!!",
            bannerText: "PANAS EKSTREM!",
            hookCard: { title: "Ngebut Mach 3!", subtitle: "Gesekan udara 3.500 km/jam" },
            infoCards: [{ label: "Suhu Bodi", value: "300°C – 500°C", tone: "warn" }],
            meter: { label: "SUHU BODI", value: 485, min: 0, max: 500, unit: "°C", danger: true },
            stage3d: { environment: "runway_tarmac", cameraShot: "hero_low", skyMode: "heat_alert", objects: [] }
          },
          sfx: "whoosh"
        },
        {
          sceneNumber: 4,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "HUKUM PEMUAIAN TERMAL: CELAH LOGAM MEMUAI RAPAT!",
          narration: "[JADI] gara-gara [pemuaian termal], panel titanium yang renggang tadi otomatis melebar dan [mengunci rapat] tanpa bengkok!",
          highlightWords: ["JADI", "pemuaian termal", "mengunci rapat"],
          visual: {
            setting: "runway",
            mainContainer: "runway_strip",
            heroObject: "supersonic_jet",
            workerAction: "build",
            problemVisual: "none",
            solutionVisual: "thermal_expand",
            accentColor: "#10b981",
            comicText: "MEMUAI!",
            bannerText: "MEMUAI!",
            hookCard: { title: "Pemuaian Termal", subtitle: "Logam memuai menutup celah" },
            infoCards: [{ label: "Celah Titanium", value: "0 mm (Terkunci Rapat!)", tone: "good" }],
            meter: { label: "SUHU BODI", value: 495, min: 0, max: 500, unit: "°C", danger: false },
            stage3d: { environment: "runway_tarmac", cameraShot: "macro_plate", skyMode: "heat_alert", objects: [] }
          },
          sfx: "ding"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "TANGKI KEDAP SEMPURNA & ISI BAHAN BAKAR DI UDARA!",
          narration: "[JADI] begitu rapat di langit tinggi, tangki berhenti bocor total! Pesawat tinggal [isi ulang bahan bakar] di udara.",
          highlightWords: ["JADI", "isi ulang bahan bakar"],
          visual: {
            setting: "runway",
            mainContainer: "runway_strip",
            heroObject: "supersonic_jet",
            workerAction: "celebrate",
            problemVisual: "none",
            solutionVisual: "sealed_jet",
            accentColor: "#10b981",
            comicText: "SEGEL!",
            bannerText: "SEGEL!",
            hookCard: { title: "Kedap di Udara!", subtitle: "Bocor hilang 100%" },
            infoCards: [{ label: "Status Tangki", value: "Kedap Tahan Mach 3", tone: "good" }],
            meter: { label: "KEKEDAPAN", value: 100, min: 0, max: 100, unit: "%", danger: false },
            stage3d: { environment: "runway_tarmac", cameraShot: "side_inspection", skyMode: "day", objects: [] }
          },
          sfx: "pop"
        },
        {
          sceneNumber: 6,
          phase: "CLIMAX",
          mcPose: "eureka",
          componentLabel: "HASIL AKHIR: JENIUSNYA REKAYASA MATERIAL!",
          narration: "[SELAMAT!] Kalau dibuat rapat di darat malah meledak di udara! Habis ini mau bedah sains pesawat apa lagi? [Tulis di komentar]!",
          highlightWords: ["SELAMAT!", "Tulis di komentar"],
          visual: {
            setting: "runway",
            mainContainer: "runway_strip",
            heroObject: "supersonic_jet",
            workerAction: "celebrate",
            problemVisual: "none",
            solutionVisual: "sealed_jet",
            accentColor: "#10b981",
            comicText: "JENIUS!",
            bannerText: "SELAMAT!",
            hookCard: { title: "Selesai!", subtitle: "Ilmu Pemuaian SR-71" },
            infoCards: [{ label: "Skor Rekayasa", value: "Mach 3.2 Anti-Meledak", tone: "good" }],
            meter: { label: "EFISIENSI", value: 100, min: 0, max: 100, unit: "%", danger: false },
            stage3d: { environment: "runway_tarmac", cameraShot: "hero_low", skyMode: "day", objects: [] }
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

const ALLOWED_PART_KINDS = new Set([
  "roundRect",
  "circle",
  "ellipse",
  "trapezoid",
  "poly",
  "liquid",
  "arrow",
  "gear",
  "fan",
  "coil",
  "badge"
]);

const ALLOWED_MOTIONS = new Set([
  "none",
  "float",
  "pulse",
  "spin",
  "spin_reverse",
  "shake",
  "slide_x",
  "slide_y",
  "rise",
  "drip",
  "tilt"
]);

const ALLOWED_FX = new Set([
  "sparks",
  "bubbles",
  "steam",
  "smoke",
  "frost",
  "flame",
  "lightning",
  "water_drops",
  "confetti",
  "leaves",
  "electrons"
]);

const PRESET_HEROES = new Set([
  "ice_cream",
  "betta_fish",
  "arowana_fish",
  "ornamental_fish",
  "catfish",
  "fan_blades",
  "rice_fish",
  "stingray_pond",
  "bitcoin_bunker",
  "supersonic_jet"
]);

function clampNum(val, min, max, fallback = 0) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function safeColor(val, fallback = "#38bdf8") {
  if (typeof val !== "string") return fallback;
  const trimmed = val.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  if (/^rgba?\([0-9.,\s%]+\)$/.test(trimmed)) return trimmed;
  return fallback;
}

function sanitizeStagePart(rawPart) {
  if (!rawPart || typeof rawPart !== "object") return null;
  const kind = ALLOWED_PART_KINDS.has(rawPart.kind) ? rawPart.kind : "roundRect";
  const motion = ALLOWED_MOTIONS.has(rawPart.motion) ? rawPart.motion : "none";
  const base = {
    kind,
    motion,
    fill: safeColor(rawPart.fill || rawPart.color, "#f8fafc"),
    stroke: safeColor(rawPart.stroke, "#141824"),
    glass: Boolean(rawPart.glass)
  };
  if (rawPart.label || rawPart.text) {
    base.label = String(rawPart.label || rawPart.text).trim().slice(0, 26);
  }
  if (rawPart.textColor) {
    base.textColor = safeColor(rawPart.textColor, "#090a0f");
  }

  if (kind === "poly") {
    const pts = Array.isArray(rawPart.points)
      ? rawPart.points
        .slice(0, 12)
        .map((p) => (Array.isArray(p) && p.length >= 2 ? [clampNum(p[0], -185, 185), clampNum(p[1], -135, 135)] : null))
        .filter(Boolean)
      : [];
    if (pts.length < 3) return null;
    return { ...base, points: pts };
  }

  if (kind === "arrow") {
    return {
      ...base,
      x1: clampNum(rawPart.x1, -185, 185, -80),
      y1: clampNum(rawPart.y1, -135, 135, 0),
      x2: clampNum(rawPart.x2, -185, 185, 80),
      y2: clampNum(rawPart.y2, -135, 135, 0),
      color: safeColor(rawPart.color || rawPart.fill, "#f59e0b"),
      width: clampNum(rawPart.width, 2, 12, 5),
      speed: clampNum(rawPart.speed, -6, 6, 2),
      dashed: rawPart.dashed !== false
    };
  }

  const x = clampNum(rawPart.x, -185, 185, 0);
  const y = clampNum(rawPart.y, -135, 135, 0);

  if (kind === "circle" || kind === "gear" || kind === "fan") {
    return {
      ...base,
      x,
      y,
      radius: clampNum(rawPart.radius ?? rawPart.r ?? rawPart.rx, 6, 125, 36),
      teeth: clampNum(rawPart.teeth, 5, 16, 8),
      blades: clampNum(rawPart.blades, 2, 6, 3),
      speed: clampNum(rawPart.speed, -12, 12, kind === "fan" ? 8 : 2.5)
    };
  }

  if (kind === "ellipse") {
    return {
      ...base,
      x,
      y,
      rx: clampNum(rawPart.rx ?? rawPart.w / 2, 6, 175, 48),
      ry: clampNum(rawPart.ry ?? rawPart.h / 2, 6, 120, 24)
    };
  }

  if (kind === "trapezoid") {
    return {
      ...base,
      x,
      y,
      topW: clampNum(rawPart.topW, 12, 280, 60),
      bottomW: clampNum(rawPart.bottomW, 20, 320, 150),
      h: clampNum(rawPart.h, 16, 220, 110)
    };
  }

  if (kind === "badge") {
    return {
      ...base,
      x,
      y,
      text: String(rawPart.text || rawPart.label || "KOMPONEN").toUpperCase().slice(0, 20),
      fill: safeColor(rawPart.fill || rawPart.color, "#fbbf24"),
      textColor: safeColor(rawPart.textColor, "#090a0f")
    };
  }

  if (kind === "coil") {
    return {
      ...base,
      x,
      y,
      w: clampNum(rawPart.w, 16, 280, 90),
      h: clampNum(rawPart.h, 16, 180, 56),
      turns: clampNum(rawPart.turns, 3, 10, 5),
      color: safeColor(rawPart.color || rawPart.fill, "#38bdf8")
    };
  }

  // roundRect or liquid
  return {
    ...base,
    x,
    y,
    w: clampNum(rawPart.w, 10, 340, 120),
    h: clampNum(rawPart.h, 10, 230, 80),
    r: clampNum(rawPart.r, 0, 40, 12),
    waveSpeed: clampNum(rawPart.waveSpeed, 1, 10, 4)
  };
}

function buildCustomFallbackParts(topic = "", phase = "HOOK", accentColor = "#38bdf8") {
  const lower = String(topic || "").toLowerCase();
  const isErr = phase === "TAPI";
  const isOk = phase === "CLIMAX";
  const isFix = phase === "JADI";

  if (/(panel surya|solar|matahari)/i.test(lower)) {
    return [
      { kind: "roundRect", x: -42, y: 12, w: 120, h: 78, r: 8, fill: "#0f172a", motion: isErr ? "shake" : "none" },
      { kind: "roundRect", x: 70, y: 14, w: 64, h: 96, r: 10, fill: "#1e293b", motion: "none" },
      { kind: "arrow", x1: 18, y1: 12, x2: 38, y2: 12, color: isErr ? "#ef4444" : "#fde047", speed: isErr ? 0.5 : 3 },
      { kind: "badge", x: -42, y: -42, text: "PANEL SURYA", fill: "#38bdf8", textColor: "#090a0f", motion: "none" }
    ];
  }

  if (/(baterai|aki|listrik|charger|hp)/i.test(lower)) {
    return [
      { kind: "roundRect", x: 0, y: 10, w: 190, h: 120, r: 16, fill: "#1e293b", motion: isErr ? "shake" : "none" },
      { kind: "roundRect", x: 0, y: -56, w: 54, h: 16, r: 6, fill: "#94a3b8", motion: isErr ? "shake" : "none" },
      { kind: "liquid", x: 0, y: 18, w: 168, h: 86, r: 10, fill: isErr ? "#ef4444" : "#38bdf8", motion: "none" },
      { kind: "roundRect", x: 0, y: 14, w: isFix || isOk ? 10 : 0, h: 92, r: 4, fill: "#fde047", motion: "pulse" },
      { kind: "badge", x: -50, y: -26, text: "ANODA -", fill: "#f43f5e", textColor: "#fff", motion: "none" },
      { kind: "badge", x: 50, y: -26, text: "KATODA +", fill: "#10b981", textColor: "#090a0f", motion: "none" },
      { kind: "arrow", x1: -65, y1: 16, x2: 65, y2: 16, color: isErr ? "#fde047" : "#6ee7b7", speed: isErr ? 5 : 2.5 }
    ].filter((p) => p.kind !== "roundRect" || p.w > 0);
  }

  if (/(gunung|berapi|lava|magma)/i.test(lower)) {
    return [
      { kind: "trapezoid", x: 0, y: 20, topW: 56, bottomW: 260, h: 140, fill: "#78350f", motion: isErr ? "shake" : "none" },
      { kind: "liquid", x: 0, y: 58, w: 120, h: 48, r: 16, fill: "#f97316", motion: "pulse" },
      { kind: "ellipse", x: 0, y: -48, rx: 28, ry: 12, fill: isErr ? "#dc2626" : "#fb923c", motion: "pulse" },
      { kind: "arrow", x1: 0, y1: 42, x2: 0, y2: -78, color: "#fde047", speed: isErr ? 5 : 2 },
      { kind: "badge", x: 0, y: 74, text: "DAPUR MAGMA", fill: "#ef4444", textColor: "#fff", motion: "none" }
    ];
  }

  return [
    { kind: "roundRect", x: 0, y: 12, w: 220, h: 130, r: 18, fill: isErr ? "#fee2e2" : "#e0f2fe", glass: true, motion: isErr ? "shake" : "none" },
    { kind: "liquid", x: 0, y: 34, w: 196, h: 74, r: 12, fill: isErr ? "#ef4444" : isOk ? "#10b981" : accentColor, motion: "none" },
    { kind: "gear", x: -46, y: 6, radius: 30, teeth: 8, fill: "#f59e0b", speed: isErr ? -0.5 : 3, motion: "spin" },
    { kind: "gear", x: 46, y: 14, radius: 24, teeth: 7, fill: "#38bdf8", speed: isErr ? 0.5 : -3.8, motion: "spin_reverse" },
    { kind: "arrow", x1: -75, y1: -34, x2: 75, y2: -34, color: isErr ? "#e11d48" : "#10b981", speed: isErr ? 0.5 : 3 },
    { kind: "badge", x: 0, y: -64, text: isErr ? "GAGAL!" : isOk ? "OPTIMAL!" : "PROSES", fill: isErr ? "#e11d48" : "#fbbf24", textColor: isErr ? "#fff" : "#090a0f", motion: "none" }
  ];
}

function defaultComicText(phase, heroObject) {
  if (phase === "TAPI") return heroObject === "ice_cream" ? "KRAK!" : "WADUH!";
  if (phase === "JADI") return "TRIKNYA!";
  if (phase === "CLIMAX") return "MANTAP!";
  return "MULAI!";
}

function defaultFxForPhase(phase, problemVisual, solutionVisual) {
  if (phase === "TAPI") {
    if (problemVisual === "rock_ice_block") return ["frost"];
    if (problemVisual === "motor_vibrating") return ["sparks", "smoke"];
    return ["smoke"];
  }
  if (phase === "JADI") {
    if (solutionVisual === "salt_frost_aura") return ["frost"];
    if (solutionVisual === "clear_bubbles" || solutionVisual === "creamy_swirl") return ["bubbles"];
    return ["electrons"];
  }
  if (phase === "CLIMAX") return ["confetti"];
  return [];
}

const ALLOWED_3D_ENVS = new Set([
  "wood_desk",
  "kitchen_tile",
  "backyard_cutaway",
  "farm_trench",
  "outdoor_sky",
  "house_bunker",
  "runway_tarmac"
]);

const ALLOWED_3D_SHOTS = new Set([
  "closeup_hands",
  "isometric_cutaway",
  "corridor_view",
  "hero_low",
  "side_inspection",
  "disaster_shake",
  "room_closeup",
  "bunker_view",
  "rooftop_view",
  "full_cross_section",
  "macro_plate"
]);

const ALLOWED_SKY_MODES = new Set(["day", "night", "heat_alert"]);

const ALLOWED_3D_KINDS = new Set([
  "box",
  "cylinder",
  "sphere",
  "cone",
  "torus",
  "coil",
  "liquid",
  "fan",
  "gear",
  "flow",
  "particles",
  "glass_tank",
  "battery_cell",
  "volcano",
  "ac_unit",
  "cup_mug",
  "pot_pan",
  "beaker",
  "solar_panel",
  "pipe",
  "wire_cable",
  "sound_rings",
  "filter_sump",
  "turbine_gen",
  "rebar_pit",
  "stingray",
  "thermal_plates",
  "aircraft_jet",
  "miner_rig"
]);

const ALLOWED_3D_ENTERS = new Set(["none", "drop", "pop", "slide_left", "slide_right"]);
const ALLOWED_3D_MOTIONS = new Set(["none", "float", "pulse", "spin", "spin_reverse", "shake", "bob", "pour"]);

function sanitize3dObject(raw) {
  if (!raw || typeof raw !== "object") return null;
  const kind = ALLOWED_3D_KINDS.has(raw.kind) ? raw.kind : "box";
  const enter = ALLOWED_3D_ENTERS.has(raw.enter) ? raw.enter : "pop";
  const motion = ALLOWED_3D_MOTIONS.has(raw.motion) ? raw.motion : "none";
  const color = safeColor(raw.color || raw.fill, "#38bdf8");

  if (kind === "flow" || kind === "pipe" || kind === "wire_cable") {
    const from = Array.isArray(raw.from) ? raw.from : [-0.7, 0.5, 0];
    const to = Array.isArray(raw.to) ? raw.to : [0.7, 0.5, 0];
    return {
      kind,
      from: [clampNum(from[0], -2.2, 2.2, -0.7), clampNum(from[1], -1.65, 2.5, 0.5), clampNum(from[2], -1.2, 1.2, 0)],
      to: [clampNum(to[0], -2.2, 2.2, 0.7), clampNum(to[1], -1.65, 2.5, 0.5), clampNum(to[2], -1.2, 1.2, 0)],
      radius: clampNum(raw.radius ?? raw.tube, 0.015, 0.14, kind === "wire_cable" ? 0.025 : 0.05),
      color,
      glow: Boolean(raw.glow),
      count: clampNum(raw.count, 3, 14, 7),
      speed: clampNum(raw.speed, 0.4, 6, 1.8)
    };
  }

  return {
    kind,
    x: clampNum(raw.x, -2.0, 2.0, 0),
    y: clampNum(raw.y, -1.65, 2.4, 0.45),
    z: clampNum(raw.z, -1.2, 1.2, 0),
    w: clampNum(raw.w, 0.06, 2.8, 0.8),
    h: clampNum(raw.h ?? raw.height, 0.06, 2.4, 0.7),
    d: clampNum(raw.d, 0.06, 2.2, 0.7),
    rTop: clampNum(raw.rTop ?? raw.radius, 0.05, 1.3, 0.35),
    rBottom: clampNum(raw.rBottom ?? raw.radius, 0.05, 1.3, 0.4),
    radius: clampNum(raw.radius ?? raw.rTop, 0.05, 1.3, 0.35),
    tube: clampNum(raw.tube, 0.02, 0.35, 0.09),
    turns: clampNum(raw.turns, 3, 10, 5),
    blades: clampNum(raw.blades, 2, 6, 3),
    teeth: clampNum(raw.teeth, 5, 16, 8),
    rings: clampNum(raw.rings, 2, 6, 4),
    speed: clampNum(raw.speed, -14, 14, kind === "fan" || kind === "turbine_gen" || kind === "miner_rig" ? 8 : 2.5),
    rx: clampNum(raw.rx, -3.2, 3.2, 0),
    ry: clampNum(raw.ry, -3.2, 3.2, 0),
    rz: clampNum(raw.rz, -3.2, 3.2, 0),
    color,
    liquidColor: safeColor(raw.liquidColor, "#38bdf8"),
    bladeColor: safeColor(raw.bladeColor, "#38bdf8"),
    chargeColor: safeColor(raw.chargeColor, "#38bdf8"),
    waterLevel: clampNum(raw.waterLevel, 0.15, 0.92, 0.72),
    glass: Boolean(raw.glass),
    metallic: Boolean(raw.metallic),
    glow: Boolean(raw.glow),
    openTop: Boolean(raw.openTop),
    murky: Boolean(raw.murky),
    hasSeparator: raw.hasSeparator !== false,
    magmaGlow: Boolean(raw.magmaGlow),
    isOutdoor: Boolean(raw.isOutdoor),
    blowing: raw.blowing !== false,
    boiling: Boolean(raw.boiling),
    burnerOn: Boolean(raw.burnerOn),
    foam: Boolean(raw.foam),
    heated: Boolean(raw.heated),
    immersed: Boolean(raw.immersed),
    tilt: clampNum(raw.tilt, -1.2, 1.2, 0.45),
    type: ALLOWED_FX.has(raw.type) ? raw.type : "sparks",
    enter,
    motion
  };
}

function buildCustom3dFallbackObjects(topic = "", phase = "HOOK", accentColor = "#38bdf8") {
  const lower = String(topic || "").toLowerCase();
  const isErr = phase === "TAPI";
  const isOk = phase === "CLIMAX";
  const isFix = phase === "JADI";

  if (/(panel surya|solar|matahari)/i.test(lower)) {
    return [
      { kind: "solar_panel", x: -0.35, y: 0.35, z: 0, w: 1.35, d: 0.88, tilt: 0.48, motion: isErr ? "shake" : "none" },
      { kind: "battery_cell", x: 0.72, y: 0.48, z: 0.1, radius: 0.34, h: 0.85, chargeColor: isErr ? "#ef4444" : "#10b981", hasSeparator: true },
      { kind: "wire_cable", from: [-0.2, 0.35, 0.2], to: [0.6, 0.55, 0.1], color: "#f59e0b" },
      { kind: "flow", from: [-0.25, 0.45, 0.22], to: [0.6, 0.6, 0.12], color: isErr ? "#ef4444" : "#fde047", count: 7, speed: isErr ? 0.5 : 3.0 }
    ];
  }

  if (/(baterai|aki|listrik|charger|hp)/i.test(lower)) {
    const objs = [
      { kind: "battery_cell", x: 0, y: 0.55, z: 0, radius: 0.48, h: 1.05, color: "#1e293b", chargeColor: isErr ? "#ef4444" : "#38bdf8", hasSeparator: isFix || isOk, motion: isErr ? "shake" : "none", enter: "pop" },
      { kind: "wire_cable", from: [-0.3, 1.05, 0], to: [0.3, 1.05, 0], color: isErr ? "#ef4444" : "#f59e0b" },
      { kind: "flow", from: [-0.4, 0.55, 0.15], to: [0.4, 0.55, 0.15], color: isErr ? "#fde047" : "#6ee7b7", count: 7, speed: isErr ? 4.2 : 2.2 }
    ];
    if (isErr) objs.push({ kind: "particles", x: 0, y: 1.1, z: 0, type: "sparks" });
    return objs;
  }

  if (/(gunung|berapi|lava|magma)/i.test(lower)) {
    const objs = [
      { kind: "volcano", x: 0, y: 0.65, z: 0, radius: 1.15, h: 1.25, magmaGlow: isErr || isFix || isOk, motion: isErr ? "shake" : "none" },
      { kind: "flow", from: [0, 0.35, 0], to: [0, 1.55, 0], color: "#fde047", count: 8, speed: isErr ? 4.5 : 2.2 }
    ];
    if (isErr) objs.push({ kind: "particles", x: 0, y: 1.38, z: 0, type: "flame" });
    return objs;
  }

  if (/(suara|bising|desibel|peredam|speaker|musik)/i.test(lower)) {
    return [
      { kind: "miner_rig", x: -0.45, y: 0.42, z: 0.1, w: 0.9, h: 0.7, d: 0.65, color: "#475569", motion: isErr ? "shake" : "none" },
      { kind: "sound_rings", x: -0.45, y: 0.55, z: 0.25, radius: 0.75, rings: 4, color: isErr ? "#ef4444" : "#38bdf8", glow: true, motion: "pulse" },
      { kind: "rebar_pit", x: 0.65, y: 0.35, z: 0, w: 0.95, h: 0.55, d: 0.75, color: "#94a3b8", enter: isFix || isOk ? "drop" : "none" }
    ];
  }

  if (/(turbin|uap|pembangkit|pltu|listrik|generator)/i.test(lower)) {
    return [
      { kind: "coil", x: -0.68, y: 0.52, z: 0, radius: 0.32, h: 0.65, turns: 6, color: "#f97316", glow: true },
      { kind: "turbine_gen", x: 0.48, y: 0.55, z: 0, radius: 0.42, blades: 8, color: "#e2e8f0", metallic: true, glow: isFix || isOk, speed: isErr ? 0.5 : 8 },
      { kind: "pipe", from: [-0.42, 0.68, 0], to: [0.18, 0.68, 0], color: "#38bdf8", radius: 0.05 },
      { kind: "flow", from: [-0.4, 0.68, 0.08], to: [0.18, 0.68, 0.08], color: isErr ? "#ef4444" : "#fde047", count: 7, speed: 3.2 }
    ];
  }

  if (/(filter|sump|saring|jernih|amonia)/i.test(lower)) {
    return [
      { kind: "glass_tank", x: -0.48, y: 0.48, z: 0, w: 1.15, h: 0.75, d: 0.85, liquidColor: isErr ? "#855e30" : "#38bdf8", murky: isErr, waterLevel: 0.82 },
      { kind: "filter_sump", x: 0.72, y: 0.42, z: 0, w: 0.95, h: 0.68, d: 0.72, color: "#0ea5e9", enter: isFix || isOk ? "drop" : "pop" },
      { kind: "pipe", from: [0.05, 0.65, 0], to: [0.35, 0.65, 0], color: "#38bdf8", radius: 0.045 },
      { kind: "flow", from: [0.05, 0.68, 0.05], to: [0.35, 0.68, 0.05], color: "#6ee7b7", count: 6, speed: 2.5 }
    ];
  }

  if (/(ac|kulkas|pendingin|freon|kompresor|panas)/i.test(lower)) {
    return [
      { kind: "ac_unit", x: -0.68, y: 0.65, z: 0, w: 0.95, h: 0.52, d: 0.45, color: "#f8fafc", isOutdoor: false, blowing: isFix || isOk, motion: isErr ? "shake" : "none" },
      { kind: "coil", x: 0.02, y: 0.52, z: -0.05, radius: 0.24, h: 0.58, turns: 6, color: "#f97316", glow: true },
      { kind: "ac_unit", x: 0.75, y: 0.48, z: 0, w: 0.85, h: 0.78, d: 0.48, color: "#cbd5e1", isOutdoor: true, blowing: isFix || isOk, bladeColor: "#38bdf8", motion: isErr ? "shake" : "none" },
      { kind: "pipe", from: [-0.25, 0.58, -0.05], to: [0.38, 0.48, -0.05], color: "#0284c7", radius: 0.04 },
      { kind: "flow", from: [0.32, 0.58, 0.06], to: [-0.48, 0.58, 0.06], color: isErr ? "#ef4444" : "#38bdf8", count: 7, speed: 2.8 }
    ];
  }

  if (/(kopi|teh|susu|masak|goreng|rebus|kue|donat|roti)/i.test(lower)) {
    return [
      { kind: "pot_pan", x: -0.45, y: 0.35, z: 0, radius: 0.46, h: 0.52, color: "#94a3b8", liquidColor: "#78350f", boiling: isFix || isErr, burnerOn: true, motion: isErr ? "shake" : "none" },
      { kind: "cup_mug", x: 0.58, y: 0.28, z: 0.1, radius: 0.32, h: 0.48, color: "#f8fafc", liquidColor: isOk ? "#92400e" : "#d97706", foam: isOk || isFix, enter: "drop" },
      { kind: "particles", x: 0.58, y: 0.75, z: 0.1, type: "steam" }
    ];
  }

  return [
    { kind: "glass_tank", x: 0, y: 0.52, z: 0, w: 1.55, h: 0.92, d: 0.85, liquidColor: isErr ? "#855e30" : isOk ? "#38bdf8" : accentColor, murky: isErr, waterLevel: 0.72, motion: isErr ? "shake" : "none" },
    { kind: "gear", x: -0.35, y: 0.54, z: 0.15, radius: 0.26, teeth: 8, color: "#f59e0b", metallic: true, speed: isErr ? -0.4 : 3.2 },
    { kind: "gear", x: 0.35, y: 0.62, z: 0.15, radius: 0.22, teeth: 7, color: "#38bdf8", metallic: true, speed: isErr ? 0.4 : -4.0 },
    { kind: "flow", from: [-0.6, 0.85, 0.2], to: [0.6, 0.85, 0.2], color: isErr ? "#e11d48" : "#6ee7b7", count: 6, speed: isErr ? 0.8 : 2.6 }
  ];
}

function projectStage3dTo2dParts(stage3d, phase) {
  const parts = [];
  for (const obj of (stage3d?.objects || []).slice(0, 10)) {
    const px = clampNum((obj.x || 0) * 100, -165, 165, 0);
    const py = clampNum(90 - (obj.y || 0.5) * 95, -105, 95, 0);
    if (obj.kind === "flow" && Array.isArray(obj.from) && Array.isArray(obj.to)) {
      parts.push({
        kind: "arrow",
        x1: clampNum(obj.from[0] * 100, -165, 165, -60),
        y1: clampNum(90 - obj.from[1] * 95, -105, 95, 0),
        x2: clampNum(obj.to[0] * 100, -165, 165, 60),
        y2: clampNum(90 - obj.to[1] * 95, -105, 95, 0),
        color: obj.color || "#38bdf8",
        speed: obj.speed || 2
      });
    } else if (obj.kind === "gear" || obj.kind === "fan" || obj.kind === "turbine_gen") {
      parts.push({
        kind: obj.kind === "turbine_gen" ? "fan" : obj.kind,
        x: px,
        y: py,
        radius: clampNum((obj.radius || 0.3) * 95, 16, 75, 30),
        teeth: obj.teeth || 8,
        blades: obj.blades || 4,
        fill: obj.color || "#fbbf24",
        speed: obj.speed || 3
      });
    } else if (obj.kind === "cone") {
      parts.push({
        kind: "trapezoid",
        x: px,
        y: py,
        topW: 28,
        bottomW: clampNum((obj.radius || 0.5) * 180, 50, 240, 120),
        h: clampNum((obj.h || 0.8) * 95, 40, 150, 100),
        fill: obj.color || "#78350f",
        motion: obj.motion || (phase === "TAPI" ? "shake" : "none")
      });
    } else if (obj.kind === "coil") {
      parts.push({
        kind: "coil",
        x: px,
        y: py,
        w: clampNum((obj.radius || 0.35) * 180, 40, 160, 80),
        h: clampNum((obj.h || 0.5) * 95, 30, 110, 56),
        turns: obj.turns || 5,
        color: obj.color || "#38bdf8",
        motion: obj.motion || "none"
      });
    } else if (obj.kind === "sphere" || obj.kind === "sound_rings") {
      parts.push({
        kind: "circle",
        x: px,
        y: py,
        radius: clampNum((obj.radius || 0.3) * 95, 14, 70, 28),
        fill: obj.kind === "sound_rings" ? "#ef4444" : obj.color || "#fbbf24",
        motion: obj.motion || "pulse"
      });
    } else if (obj.kind === "liquid") {
      parts.push({
        kind: "liquid",
        x: px,
        y: py,
        w: clampNum((obj.w || 1.2) * 105, 40, 240, 140),
        h: clampNum((obj.h || 0.5) * 95, 25, 140, 65),
        r: 12,
        fill: obj.color || "#38bdf8"
      });
    } else if (obj.kind === "volcano") {
      parts.push({ kind: "trapezoid", x: px, y: py, topW: 36, bottomW: 220, h: 130, fill: "#78350f", motion: obj.motion || "none" });
      parts.push({ kind: "ellipse", x: px, y: py - 58, rx: 24, ry: 10, fill: "#f97316", motion: "pulse" });
    } else if (obj.kind === "pipe" || obj.kind === "wire_cable") {
      parts.push({
        kind: "arrow",
        x1: clampNum(obj.from?.[0] * 100, -165, 165, -60),
        y1: clampNum(90 - obj.from?.[1] * 95, -105, 95, 0),
        x2: clampNum(obj.to?.[0] * 100, -165, 165, 60),
        y2: clampNum(90 - obj.to?.[1] * 95, -105, 95, 0),
        color: obj.color || "#64748b",
        speed: 0
      });
    } else if (obj.kind !== "particles") {
      parts.push({
        kind: "roundRect",
        x: px,
        y: py,
        w: clampNum((obj.w || (obj.radius || 0.4) * 2) * 100, 24, 240, 90),
        h: clampNum((obj.h || 0.7) * 95, 24, 170, 72),
        r: 12,
        fill: obj.liquidColor || obj.chargeColor || obj.color || "#f8fafc",
        glass: obj.kind === "glass_tank" || obj.kind === "beaker" || obj.kind === "filter_sump" || Boolean(obj.glass),
        motion: obj.motion || "none"
      });
    }
  }
  return parts.map(sanitizeStagePart).filter(Boolean);
}

function defaultEnvForSetting(setting) {
  if (setting === "kitchen") return "kitchen_tile";
  if (setting === "backyard") return "backyard_cutaway";
  if (setting === "farm") return "farm_trench";
  if (setting === "sky_space") return "outdoor_sky";
  if (setting === "house_bunker") return "house_bunker";
  if (setting === "runway") return "runway_tarmac";
  return "wood_desk";
}

function defaultShotForPhase(phase, setting) {
  if (setting === "house_bunker") return phase === "CLIMAX" ? "full_cross_section" : phase === "HOOK" ? "room_closeup" : "bunker_view";
  if (setting === "runway" || setting === "runway_tarmac") return phase === "CLIMAX" ? "hero_low" : "side_inspection";
  if (setting === "farm" || setting === "farm_trench") return phase === "CLIMAX" ? "hero_low" : "corridor_view";
  if (phase === "TAPI") return "disaster_shake";
  if (phase === "JADI") return "closeup_hands";
  if (phase === "CLIMAX") return "hero_low";
  return setting === "backyard" ? "isometric_cutaway" : "closeup_hands";
}

function sanitizeStage3d(raw3d, visualBase, defaults, phase, cleanTopic) {
  const isPreset = PRESET_HEROES.has(visualBase.heroObject);
  const env = ALLOWED_3D_ENVS.has(raw3d?.environment)
    ? raw3d.environment
    : defaultEnvForSetting(visualBase.setting || defaults.setting);
  const cameraShot = ALLOWED_3D_SHOTS.has(raw3d?.cameraShot)
    ? raw3d.cameraShot
    : defaultShotForPhase(phase, env);
  const skyMode = ALLOWED_SKY_MODES.has(raw3d?.skyMode)
    ? raw3d.skyMode
    : ALLOWED_SKY_MODES.has(visualBase?.skyMode)
      ? visualBase.skyMode
      : "day";

  const rawObjects = Array.isArray(raw3d?.objects)
    ? raw3d.objects.slice(0, 12).map(sanitize3dObject).filter(Boolean)
    : [];

  let objects =
    rawObjects.length >= 2
      ? rawObjects
      : !isPreset
        ? buildCustom3dFallbackObjects(cleanTopic, phase, visualBase.accentColor).map(sanitize3dObject).filter(Boolean)
        : [];

  // Keep bunker_view custom objects inside the subterranean bunker instead of floating above ceiling
  if (env === "house_bunker" && cameraShot === "bunker_view" && objects.length > 0) {
    const hasUnderground = objects.some((o) => (o.y ?? 0.5) < -0.15 || (o.from && o.from[1] < -0.15));
    if (!hasUnderground) {
      objects = objects.map((o) => {
        if (o.from && o.to) {
          return {
            ...o,
            from: [o.from[0], clampNum(o.from[1] - 1.38, -1.35, -0.25, -0.95), o.from[2]],
            to: [o.to[0], clampNum(o.to[1] - 1.38, -1.35, -0.25, -0.95), o.to[2]]
          };
        }
        return { ...o, y: clampNum((o.y ?? 0.45) - 1.38, -1.32, -0.35, -1.0) };
      });
    }
  }

  return {
    environment: env,
    cameraShot,
    skyMode,
    objects
  };
}

function sanitizeVisualSpec(v = {}, defaults, phase, idx, cleanTopic) {
  const heroObject = v.heroObject || defaults.heroObject;
  const accentColor = safeColor(v.accentColor, defaults.accentColor);
  const setting = v.setting || defaults.setting;
  const problemVisual =
    v.problemVisual ||
    (phase === "TAPI"
      ? heroObject === "ice_cream"
        ? idx <= 2
          ? "rock_ice_block"
          : "melting_puddle"
        : heroObject === "betta_fish"
          ? idx <= 2
            ? "fish_fighting"
            : "murky_mud"
          : heroObject === "arowana_fish"
            ? idx <= 2
              ? "murky_mud"
              : "fish_jumping"
            : heroObject === "fan_blades"
              ? "motor_vibrating"
              : "smoke_overheat"
      : "none");
  const solutionVisual =
    v.solutionVisual ||
    (phase === "CLIMAX"
      ? heroObject === "ice_cream"
        ? "waffle_cones"
        : "sparkle_shield"
      : phase === "JADI"
        ? heroObject === "ice_cream"
          ? idx <= 3
            ? "salt_frost_aura"
            : "creamy_swirl"
          : heroObject === "betta_fish"
            ? idx <= 3
              ? "glass_divider"
              : "clear_bubbles"
            : "rotating_arrows"
        : "none");

  const stage3d = sanitizeStage3d(v.stage3d, { heroObject, setting, accentColor }, defaults, phase, cleanTopic);
  const rawParts = Array.isArray(v.stageParts)
    ? v.stageParts.slice(0, 12).map(sanitizeStagePart).filter(Boolean)
    : [];

  const isPreset = PRESET_HEROES.has(heroObject);
  const useCustomStage =
    Boolean(v.useCustomStage) || !isPreset || rawParts.length >= 2 || stage3d.objects.length >= 2;
  const stageParts =
    rawParts.length >= 2
      ? rawParts
      : (() => {
        const projected = stage3d.objects.length >= 2 ? projectStage3dTo2dParts(stage3d, phase) : [];
        return projected.length >= 2
          ? projected
          : !isPreset
            ? buildCustomFallbackParts(cleanTopic, phase, accentColor).map(sanitizeStagePart).filter(Boolean)
            : projected;
      })();

  const fxList = Array.isArray(v.fx)
    ? v.fx.filter((f) => ALLOWED_FX.has(f)).slice(0, 2)
    : defaultFxForPhase(phase, problemVisual, solutionVisual);

  const meter =
    v.meter && typeof v.meter === "object" && v.meter.label
      ? {
        label: String(v.meter.label).toUpperCase().slice(0, 14),
        value: clampNum(v.meter.value, -999, 9999, 50),
        min: clampNum(v.meter.min, -999, 9999, 0),
        max: clampNum(v.meter.max, -999, 9999, 100),
        unit: String(v.meter.unit || "%").slice(0, 6),
        danger: typeof v.meter.danger === "boolean" ? v.meter.danger : phase === "TAPI"
      }
      : heroObject === "ice_cream"
        ? {
          label: "SUHU ES",
          value: phase === "TAPI" ? 2 : phase === "JADI" ? -15 : phase === "CLIMAX" ? -18 : 4,
          min: -25,
          max: 25,
          unit: "°C",
          danger: phase === "TAPI"
        }
        : null;

  const comicText = v.comicText
    ? String(v.comicText).toUpperCase().slice(0, 14)
    : defaultComicText(phase, heroObject);

  const bannerText = v.bannerText
    ? String(v.bannerText).toUpperCase().slice(0, 22)
    : "";

  const hookCard =
    v.hookCard && typeof v.hookCard === "object" && v.hookCard.title
      ? {
        title: String(v.hookCard.title).slice(0, 38),
        subtitle: String(v.hookCard.subtitle || "").slice(0, 44)
      }
      : null;

  const vsCard =
    v.vsCard && typeof v.vsCard === "object" && v.vsCard.leftTitle && v.vsCard.rightTitle
      ? {
        leftTitle: String(v.vsCard.leftTitle).slice(0, 22),
        leftValue: String(v.vsCard.leftValue || "").slice(0, 22),
        rightTitle: String(v.vsCard.rightTitle).slice(0, 22),
        rightValue: String(v.vsCard.rightValue || "").slice(0, 22),
        verdict: String(v.vsCard.verdict || "").slice(0, 36)
      }
      : null;

  const ALLOWED_CARD_TONES = new Set(["normal", "warn", "good"]);
  const infoCards = Array.isArray(v.infoCards)
    ? v.infoCards
      .slice(0, 2)
      .filter((c) => c && typeof c === "object" && (c.label || c.value))
      .map((c) => ({
        label: String(c.label || "").slice(0, 22),
        value: String(c.value || "").slice(0, 26),
        tone: ALLOWED_CARD_TONES.has(c.tone) ? c.tone : phase === "TAPI" ? "warn" : "normal"
      }))
    : [];

  return {
    setting: v.setting || defaults.setting,
    mainContainer: v.mainContainer || defaults.mainContainer,
    heroObject,
    useCustomStage,
    stage3d,
    stageParts,
    fx: fxList,
    comicText,
    bannerText,
    hookCard,
    vsCard,
    infoCards,
    meter,
    ingredientOrTool:
      v.ingredientOrTool || (phase === "TAPI" ? "none" : phase === "CLIMAX" ? "none" : "wrench"),
    workerAction:
      v.workerAction ||
      (phase === "TAPI"
        ? "panic"
        : phase === "CLIMAX"
          ? "celebrate"
          : phase === "JADI"
            ? "build"
            : "pour"),
    problemVisual,
    solutionVisual,
    accentColor,
    callouts:
      Array.isArray(v.callouts) && v.callouts.length
        ? v.callouts.slice(0, 2)
        : [phase === "TAPI" ? "MASALAH NYATA" : "TAHAP PRAKTEK"]
  };
}

function enrichScript(scriptObj, researchData = null, fallbackTopic = "") {
  scriptObj.character = CHARACTER_BIBLE;
  scriptObj.research = researchData;
  const cleanTopic = scriptObj.topic || extractTopicFromPrompt(fallbackTopic);
  const defaults = inferVisualDefaults(`${fallbackTopic} ${cleanTopic} ${scriptObj.title || ""}`);

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
    const visual = sanitizeVisualSpec(sc.visual || {}, defaults, phase, idx, cleanTopic);

    return {
      ...sc,
      sceneNumber: idx + 1,
      phase,
      mcPose,
      mcPlacement: phase === "TAPI" ? "presenter-right" : "presenter-left",
      visual,
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
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.78,
      maxOutputTokens: 16384
    }
  };

  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest"
  ];

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          cleanKey
        )}`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000)
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
            if (parsed?.scenes?.length >= 3) {
              parsed._usedModel = model;
              return parsed;
            }
          }
          break;
        } else {
          const errSnippet = await resp.text().catch(() => "");
          console.warn(`Gemini model ${model} HTTP ${resp.status}:`, errSnippet.slice(0, 180));
          if (resp.status === 503 && attempt === 0) {
            await new Promise((r) => setTimeout(r, 900));
            continue;
          }
          break;
        }
      } catch (e) {
        console.warn(`Gemini model ${model} error:`, e.message);
        break;
      }
    }
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

const ANIMATION_CURRICULUM_GUIDE = `
KURIKULUM SUTRADARA 3D @UNTABIRU5 x @DEKODAID x @BELAJAR.IAI (STANDAR KUALITAS BLENDER 3D!):
Video dirender di panggung 3D cerah dengan karakter "Ipul" (baju toska, tangan bulat) beraksi langsung di tempat kejadian!
Gunakan 7 pilihan "environment":
- "wood_desk": meja kayu bengkel terang (mesin, elektronik, eksperimen sains).
- "kitchen_tile": dapur keramik bersih (masak, es krim, minuman).
- "backyard_cutaway": halaman + potongan tanah/kolam beton berubin (ikan, kolam, filter).
- "farm_trench": sawah hijau + parit air + pohon kelapa (pertanian, ekologi).
- "outdoor_sky": lapangan rumput terbuka (alam, cuaca, roket).
- "house_bunker": rumah bertingkat X-ray + kamar atas + BUNKER BAWAH TANAH & atap surya! (sistem rumah, energi, peredam suara, bunker, PLTU mini!).
- "runway_tarmac": landasan aspal bandara + hanggar & bukit hijau! (pesawat, aerodinamika, mesin jet, pemuaian!).

ATURAN KUALITAS 3D (WAJIB!):
- Untuk heroObject:"custom_stage", isi **4 sampai 6 objek 3D** per scene agar panggung padat & bernyawa seperti animasi Blender!
- Permukaan lantai/meja berada di Y = 0.0 (kecuali jika memilih cameraShot:"bunker_view" di dalam "house_bunker", taruh mesin bawah tanah di Y = -1.05!). Benda bertumpu rapi, TIDAK melayang sembarangan!
- HUBUNGKAN mesin yang terpisah memakai "pipe" (pipa aliran) atau "wire_cable" (kabel listrik) PLUS "flow" (partikel energi/aliran)!
- Tambahkan dinamika cuaca/suhu lewat "stage3d.skyMode": "day" (cerah) | "night" (malam berbintang, listrik padam!) | "heat_alert" (merah panas ekstrem!).

PREFAB 3D KOMPLEKS & PRIMITIF ("stage3d.objects"):
1. "glass_tank": { kind:"glass_tank", x, y, z, w, h, d, liquidColor, murky?:true, waterLevel:0.75, motion } -> akuarium/tangki kaca dielektrik/kolam!
2. "filter_sump": { kind:"filter_sump", x, y, z, w, h, d, color, enter, motion } -> bak filter 3 sekat (sikat rol, spons busa, bola bio-bakteri)!
3. "turbine_gen": { kind:"turbine_gen", x, y, z, radius, blades:8, color, glow?:true, speed:8, motion } -> turbin uap + generator listrik berputar!
4. "miner_rig": { kind:"miner_rig", x, y, z, w, h, d, color, immersed?:true, speed:10, motion } -> mesin rakitan kotak dengan dual kipas berputar!
5. "sound_rings": { kind:"sound_rings", x, y, z, radius, rings:4, color:"#ef4444", glow:true, motion:"pulse" } -> cincin gelombang suara bising/getaran!
6. "rebar_pit": { kind:"rebar_pit", x, y, z, w, h, d, color, enter:"drop" } -> cetakan kayu + tulangan besi cor beton / bunker!
7. "thermal_plates": { kind:"thermal_plates", x, y, z, w, d, heated?:true, color, motion } -> susunan 3x3 pelat logam titanium (renggang saat dingin, memuai rapat saat heated:true!).
8. "aircraft_jet": { kind:"aircraft_jet", x, y, z, color, heated?:true, glow?:true, motion } -> pesawat supersonik/jet dengan twin afterburner!
9. "stingray": { kind:"stingray", x, y, z, color, motion:"bob" } -> ikan pari tutul berenang!
10. "battery_cell" | "volcano" | "ac_unit" | "cup_mug" | "pot_pan" | "beaker" | "solar_panel" | "pipe" | "wire_cable" | "coil" | "gear" | "fan" | "liquid" | "flow" ({from,to,color,count,speed}) | "particles" ({x,y,z,type:"sparks"|"smoke"|"steam"|"bubbles"|"frost"|"flame"|"confetti"}).

SHOT KAMERA WAJIB VARIATIF ("cameraShot"):
"closeup_hands" | "isometric_cutaway" | "corridor_view" | "disaster_shake" | "side_inspection" | "hero_low" | "room_closeup" (dalam kamar!) | "bunker_view" (kamera zoom ke bunker bawah tanah!) | "rooftop_view" (kamera ke atap panel surya!) | "full_cross_section" (rumah + bunker utuh!) | "macro_plate" (zoom detail material/celah!).

OVERLAY DATA & CAP REKAMAN (@DEKODAID x @BELAJAR.IAI!):
- visual.hookCard: { "title": "Pertanyaan singkat 3-4 kata?", "subtitle": "Petunjuk singkat 3-5 kata" } (tampil elegan di kiri atas saat membuka/zoom fakta!).
- visual.infoCards: [{ "label": "Suhu Bunker", "value": "55°C (Overheat!)", "tone": "warn" | "good" | "normal" }] (maks 2 kartu angka nyata seperti "± 75 dB", "± Rp 4,3 juta", "100°C vs 60°C"!).
- visual.bannerText: "TAMBANG RAHASIA!" / "PLTU MINI!" / "MEMUAI!" / "BOCOR?!" (cap kotak miring tegas untuk momen puncak!).
`;

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
    ? `CATATAN RISET (JANGAN DI-COPY MENTAH, ubah jadi aksi praktek nyata + angka faktual + animasi 3D!):\n- ${researchData.summaryFacts.join(
      "\n- "
    )}`
    : "";

  const isPresetTopic = PRESET_HEROES.has(defaults.heroObject);
  const stageInstruction = isPresetTopic
    ? `Topik ini memiliki dunia 3D unggulan heroObject="${defaults.heroObject}". Tetap set heroObject="${defaults.heroObject}", WAJIB pilih visual.stage3d.cameraShot & skyMode yang bervariasi per scene, dan perkaya dengan "fx", "comicText", "bannerText", "hookCard", "infoCards", serta "meter"! ("stage3d.objects" boleh [] untuk preset ini.)`
    : `WAJIB set heroObject="custom_stage" dan rancang SENDIRI dunia 3D nyatanya lewat visual.stage3d: pilih "environment", "skyMode", variasi "cameraShot", dan minimal 4–7 objek 3D kompleks di "stage3d.objects" yang BENAR-BENAR BERUBAH & TERHUBUNG pipa/kabel antar scene HOOK -> TAPI -> JADI (masalah baru!) -> JADI -> CLIMAX! Perkaya dengan "fx", "comicText", "bannerText", "hookCard", "infoCards", dan "meter"!`;

  const systemInstruction = `Kamu adalah "Maou Vaelen" — Sutradara Animasi 3D & Penulis Naskah "Sidang Iblis x Diorama 3D" dengan ciri khas PALING IKONIK, TAJAM, DAN ANTI-BOSAN di TikTok!

CIRI KHAS NASKAH MAOUEDU (WAJIB BERBEDA DARI KONTEN BIASA!):
1. BAHASA: **WAJIB 100% BAHASA INDONESIA KASUAL CEPAT & BERSAHUTAN!** Dilarang gaya kaku buku pelajaran/Wikipedia ("merupakan", "sehingga demikian"). Pakai ritme lisan ("Eh tunggu dulu—", "Cek angkanya!", "Kelihatannya sepele, ya?").
2. HOOK COLD OPEN 2 DETIK (DILARANG BASA-BASI!):
   Jangan mulai dengan "Mari kita lihat..."! Pilih teknik pembuka paling menggigit di Scene 1:
   - **Paradoks / Angka Aneh** ("Komponennya cuma ratusan dibanding pesawat, tapi kok lebih mustahil ditiru?!", "Angkanya lebih baru, tapi kok kalah telak?!").
   - **Bencana Sekejap / Ironi** ("Kedengarannya sepele: gali, isi, jadi. Tunggu sampai besok pagi...").
   - **Anomali Mencurigakan** ("Katanya tahan banting, eh ditinggal semalam malah karatan?!").
3. 4 SENJATA NASKAH ANTI-BOSAN:
   - **Suara Batin Komponen (Personifikasi)**: Biarkan 1-2 komponen berdialog pendek/protes di skrip! Contoh: "[Si Piston] teriak: 'Salah campuran, woy!'", "[Si Baterai] udah sekarat jam 2 pagi!".
   - **Analogi Nyeleneh Sehari-hari**: Wajib selipkan minimal 1 perbandingan absurd tapi ngena! (misal "ibarat nyicipin burger matang lalu nebak resep koki", "kayak kuping nyeri pas nyelem dalem", "sehalus debu di lapangan seluas satu negara").
   - **Eskalasi "Masalah Beranak Masalah"**: Solusi 1 WAJIB memicu masalah baru yang lebih gila di scene berikutnya!
   - **Realitas Jujur / Plot Twist Penutup + Circular Origin**: Menjelang akhir, selipkan peringatan/fakta tak terduga (misal bahaya gas beracun / biaya asli / mitos terbantahkan), lalu ingatkan "Padahal semua berawal waktu Ipul cuma...".
4. CERITA UTUH, LENGKAP, MENDALAM & TANPA PATOKAN JUMLAH SCENE:
   - **DILARANG MEMBATASI ATAU MEMPERPENDEK JUMLAH SCENE!** Jangan pernah terburu-buru berhenti di 4 scene atau 6 scene kalau cerita, eksperimen, konflik, dan penjelasannya belum benar-benar tuntas!
   - Buat sebanyak apapun scene yang benar-benar dibutuhkan agar cerita terasa **LENGKAP, MENDALAM, SERU, RUNTUT, DAN MEMUASKAN** dari Cold Open -> Praktek Awal -> Masalah 1 ([TAPI]) -> Solusi 1 ([JADI]) -> Masalah Beranak Masalah ([TAPI] lanjutan!) -> Penjelasan Sains / Rekayasa Inti -> Plot Twist / Realitas Jujur -> Klimaks & Penyelesaian Penuh (biasanya cerita yang utuh & mantap ala video viral 60-90 detik berkembang alami menjadi sekitar **8 sampai 14 scene**, atau lebih/kurang murni mengikuti kebutuhan alur cerita — BUKAN patokan kaku!).
   - Setiap scene: 16-26 kata padat bernyawa + beri angka nyata jika relevan ("pH 12,5", "500°C", "0,1 mm") ke infoCards & meter.
   - Gambarkan aksi visual konkret yang dinamis & ekspresif di setiap scene (ekspresi, benda nyata, pergerakan mekanis/energi, perbandingan visual) agar animator 3D maupun Anime Sakuga bisa menerjemahkannya jadi tontonan yang hidup, terstruktur, dan mudah dipahami!
   - Pakai vsCard di scene perbandingan (misal BARU vs FLAGSHIP atau SEBELUM vs SESUDAH)!
5. HIGHLIGHT SUBTITLE KODE WARNA:
   - Kurung kata konflik/bahaya pakai [TAPI], [BAHAYA], [BOCOR], [OVERHEAT], [AMBLES] (otomatis kotak MERAH CRIMSON!).
   - Kurung kata menang pakai [SELAMAT!], [SOLUSI], [JADI] (otomatis HIJAU!) dan kata teknis [kapasitor], [pirolisis] (otomatis KUNING!).
6. TOPIK WAJIB: 100% fokus tentang "${cleanTopic}".
7. KOREOGRAFI 3D PRAKTEK: ${stageInstruction}
${ANIMATION_CURRICULUM_GUIDE}

Kembalikan HANYA JSON valid sesuai format:
{
  "title": "Judul Hook Paradoks Singkat Bahasa Indonesia",
  "topic": "${cleanTopic}",
  "hookFormula": "Cold Open Paradoks -> Masalah Beranak Masalah -> Plot Twist & Rekayasa -> Vonis Raja Iblis!",
  "scenes": [
    {
      "sceneNumber": 1,
      "phase": "HOOK" | "TAPI" | "JADI" | "CLIMAX",
      "mcPose": "default" | "sarcastic" | "explaining" | "eureka",
      "componentLabel": "LABEL KOMPONEN UTAMA",
      "narration": "Narasi 15-24 kata cepat + [kata kunci] (+ suara batin komponen / analogi nyeleneh)",
      "highlightWords": ["kata kunci"],
      "visual": {
        "setting": "${defaults.setting}",
        "heroObject": "${defaults.heroObject}",
        "workerAction": "pour" | "stir" | "build" | "heat" | "inspect" | "panic" | "celebrate" | "cover_ears" | "long_net",
        "ingredientOrTool": "milk_sugar" | "salt_ice" | "whisk_mixer" | "wrench" | "capacitor" | "ketapang_leaf" | "fire_heat" | "none",
        "problemVisual": "none" | "rock_ice_block" | "melting_puddle" | "murky_mud" | "fish_fighting" | "fish_jumping" | "motor_vibrating" | "smoke_overheat",
        "solutionVisual": "none" | "salt_frost_aura" | "creamy_swirl" | "waffle_cones" | "glass_divider" | "clear_bubbles" | "rotating_arrows" | "sparkle_shield",
        "accentColor": "${defaults.accentColor}",
        "comicText": "SIAP!",
        "bannerText": "CAP SINGKAT!",
        "hookCard": { "title": "Pertanyaan paradoks?", "subtitle": "Petunjuk singkat" },
        "vsCard": { "leftTitle": "PIHAK A", "leftValue": "Angka A", "rightTitle": "PIHAK B", "rightValue": "Angka B", "verdict": "Vonis Singkat" },
        "infoCards": [{ "label": "Metrik", "value": "55°C", "tone": "warn" }],
        "fx": ["bubbles"],
        "meter": { "label": "SUHU", "value": 25, "min": 0, "max": 100, "unit": "°C", "danger": false },
        "callouts": ["LABEL 1", "LABEL 2"],
        "stage3d": {
          "environment": "wood_desk",
          "cameraShot": "closeup_hands",
          "skyMode": "day",
          "objects": []
        }
      },
      "sfx": "whoosh" | "error" | "pop" | "ding" | "victory"
    }
  ]
}`;

  const userPrompt = `Prompt user: "${prompt}"\nTopik wajib: "${cleanTopic}"\n${refContext}\n${factsBlock}\nTIDAK ADA PATOKAN JUMLAH SCENE — buat cerita selengkap, seutuh, dan sememuaskan mungkin dari awal hingga akhir (JANGAN dipersingkat atau dipotong jadi 4-5 scene!). Kembangkan alur penuh bergaya @untabiru5 x @dekodaid x @belajar.iai lengkap dengan cold open menggigit, praktek bertahap, eskalasi masalah beranak masalah, fakta angka nyata, plot twist, dan klimaks tuntas!`;

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
      enriched.aiEngine = `${usedModel} • Animator 3D (@untabiru5 x @dekodaid x @belajar.iai)`;
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
        if (parsed?.scenes?.length >= 3) {
          const enriched = enrichScript(parsed, researchData, cleanTopic);
          enriched.referenceMetadata = refMeta;
          enriched.aiEngine = "AI Gratis • Animator 3D";
          return enriched;
        }
      }
    }
  } catch { }

  const fallback = enrichScript(buildOfflineFallbackScript(cleanTopic), researchData, cleanTopic);
  fallback.referenceMetadata = refMeta;
  fallback.aiEngine = "Blueprint Praktek 3D";
  return fallback;
}

const elevenlabsBlockedVoicePairs = new Set();

export function formatIndonesianSpeechText(raw = "") {
  return String(raw || "")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/[—–]/g, ", ")
    .replace(/\s*:\s*/g, ", ")
    .replace(/\s*&\s*/g, " dan ")
    .replace(/\s*->\s*|\s*→\s*/g, ", lalu ")
    .replace(/(\d+)\s*\/\s*(detik|menit|jam|hari|minggu|bulan|tahun|orang|unit|kg|liter)\b/gi, "$1 per $2")
    .replace(/(\b(?:juta|ribu|miliar|milyar|triliun|watt|kw|mw|rpm|liter|kg|meter|cm|mm))\s*\/\s*(detik|menit|jam|hari|minggu|bulan|tahun|orang|unit)\b/gi, "$1 per $2")
    .replace(/\s*\/\s*/g, " atau ")
    .replace(/±\s*/g, "sekitar ")
    .replace(/\bRp\s*([0-9.,]+)\s*(juta|ribu|miliar|milyar|triliun)\b/gi, (_, num, unit) => {
      const cleanNum = num.replace(/\.(\d{3})(?!\d)/g, "$1").replace(/,(\d+)/g, " koma $1");
      return `${cleanNum} ${unit} rupiah`;
    })
    .replace(/\bRp\s*([0-9.,]+)/gi, (_, num) => {
      const cleanNum = num.replace(/\.(\d{3})(?!\d)/g, "$1").replace(/,(\d+)/g, " koma $1");
      return `${cleanNum} rupiah`;
    })
    .replace(/(\d+)\.(\d{3})(?!\d)/g, "$1$2")
    .replace(/(\d+),(\d+)/g, "$1 koma $2")
    .replace(/(\d+)\s*°\s*C/gi, "$1 derajat celcius")
    .replace(/(\d+)\s*°\s*F/gi, "$1 derajat fahrenheit")
    .replace(/(\d+)\s*dB\b/gi, "$1 desibel")
    .replace(/(\d+)\s*km\/j(am)?\b/gi, "$1 kilometer per jam")
    .replace(/(\d+)\s*mm\b/gi, "$1 milimeter")
    .replace(/(\d+)\s*cm\b/gi, "$1 sentimeter")
    .replace(/(\d+)\s*kg\b/gi, "$1 kilogram")
    .replace(/(\d+)\s*ml\b/gi, "$1 mililiter")
    .replace(/(\d+)\s*(µ|u)F\b/gi, "$1 mikro farad")
    .replace(/(\d+)\s*kW\b|\bkW\b/gi, (_, d) => (d ? `${d} kilowatt` : "kilowatt"))
    .replace(/(\d+)\s*MW\b|\bMW\b/gi, (_, d) => (d ? `${d} megawatt` : "megawatt"))
    .replace(/(\d+)\s*kHz\b|\bkHz\b/gi, (_, d) => (d ? `${d} kilohertz` : "kilohertz"))
    .replace(/(\d+)\s*MHz\b|\bMHz\b/gi, (_, d) => (d ? `${d} megahertz` : "megahertz"))
    .replace(/(\d+)\s*Hz\b|\bHz\b/gi, (_, d) => (d ? `${d} hertz` : "hertz"))
    .replace(/(\d+)\s*VA\b/gi, "$1 volt ampere")
    .replace(/\bpsi\b/gi, "P S I")
    .replace(/\bBTC\b/g, "bitcoin")
    .replace(/(\d+)%/g, "$1 persen")
    .replace(/\bRPM\b/g, "R P M")
    .replace(/\bpH\b/g, "P H")
    .replace(/\bGPU\b/g, "G P U")
    .replace(/\bPLTU\b/g, "P L T U")
    .replace(/\bPLTA\b/g, "P L T A")
    .replace(/\bPVC\b/g, "P V C")
    .replace(/\bAC\b/g, "A C")
    .replace(/['"`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function synthesizeSpeechStateless({
  text,
  voiceId = CHARACTER_BIBLE.defaultVoiceId,
  elevenlabsApiKey = ""
}) {
  const cleanText = formatIndonesianSpeechText(text);
  if (!cleanText) throw new Error("Teks voiceover kosong.");

  const effectiveVoiceId = cleanApiKey(voiceId) || CHARACTER_BIBLE.defaultVoiceId;
  const browserElKey = cleanApiKey(elevenlabsApiKey);
  const envElKey = cleanApiKey(process.env.ELEVENLABS_API_KEY);
  const candidateKeys = Array.from(new Set([browserElKey, envElKey].filter(Boolean)));
  // Verified ElevenLabs premade male voices that work on BOTH Free & Paid API keys (never 402 library-voice error)
  const PREMADE_MALE_VOICES = [
    "nPczCjzI2devNBz1zQrb", // Brian — Deep, Resonant Narrator
    "pNInz6obpgDQGcFmaJgB", // Adam — Dominant, Firm Male
    "IKne3meq5aSn9XLyUdCD", // Charlie — Deep, Confident, Energetic
    "JBFqnCBsd6RMkjVDRZzb", // George — Warm Storyteller
    "onwK4e9ZLuTAKqWW03F9"  // Daniel — Steady Broadcaster
  ];
  let elevenlabsError = candidateKeys.length
    ? null
    : "ELEVENLABS_API_KEY belum diatur. Masukkan ElevenLabs API Key di ⚙️ API & Voice atau Vercel Env Vars.";

  async function callElevenLabsTts(apiKey, targetVoiceId) {
    let lastStatus = 500;
    let lastMsg = "ElevenLabs gagal";
    for (const modelCfg of [
      { model_id: "eleven_flash_v2_5", language_code: "id" },
      { model_id: "eleven_multilingual_v2" }
    ]) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
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
                ...modelCfg,
                voice_settings: {
                  stability: 0.72,
                  similarity_boost: 0.78,
                  style: 0.12,
                  use_speaker_boost: true
                }
              }),
              signal: AbortSignal.timeout(22000)
            }
          );

          if (elResp.ok) {
            const buf = Buffer.from(await elResp.arrayBuffer());
            if (buf.length > 500) return { ok: true, buf };
            lastStatus = 502;
            lastMsg = "Audio ElevenLabs kosong";
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
              continue;
            }
            break;
          }

          const errBody = await elResp.text().catch(() => "");
          let msg = `HTTP ${elResp.status}`;
          try {
            const parsedErr = JSON.parse(errBody);
            msg = parsedErr?.detail?.message || msg;
          } catch {}
          lastStatus = elResp.status;
          lastMsg = msg;

          // Retry transient ElevenLabs rate limits / 5xx before giving up on this model
          if ((elResp.status === 429 || elResp.status >= 500) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
            continue;
          }
          // Non-retryable auth/plan errors stop trying other models immediately
          if (elResp.status === 401 || elResp.status === 402 || elResp.status === 404) {
            return { ok: false, status: elResp.status, msg };
          }
          break;
        } catch (e) {
          lastStatus = 504;
          lastMsg = e.message || "ElevenLabs timeout";
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
        }
      }
    }
    return { ok: false, status: lastStatus, msg: lastMsg };
  }

  for (const activeKey of candidateKeys) {
    try {
      const voicePairKey = `${activeKey}:${effectiveVoiceId}`;
      const primary = elevenlabsBlockedVoicePairs.has(voicePairKey)
        ? { ok: false, status: 402, msg: "Free users cannot use library voices via the API" }
        : await callElevenLabsTts(activeKey, effectiveVoiceId);

      if (primary.ok) {
        return {
          audioBase64: primary.buf.toString("base64"),
          mimeType: "audio/mpeg",
          provider: "elevenlabs",
          voiceId: effectiveVoiceId,
          elevenlabsError: null
        };
      }

      elevenlabsError = primary.msg;
      if (primary.status === 402) {
        elevenlabsBlockedVoicePairs.add(voicePairKey);
      }
      console.error("ElevenLabs TTS error:", primary.status, primary.msg);

      if (primary.status === 402 || primary.status === 404) {
        for (const fallbackVoiceId of PREMADE_MALE_VOICES) {
          if (fallbackVoiceId === effectiveVoiceId) continue;
          const premade = await callElevenLabsTts(activeKey, fallbackVoiceId);
          if (premade.ok) {
            return {
              audioBase64: premade.buf.toString("base64"),
              mimeType: "audio/mpeg",
              provider: "elevenlabs",
              voiceId: fallbackVoiceId,
              requestedVoiceId: effectiveVoiceId,
              elevenlabsError: null,
              voiceFallbackNote: `Library Voice dibatasi paket Free — tetap menggunakan suara cowok ElevenLabs (${fallbackVoiceId}).`
            };
          }
          elevenlabsError = premade.msg;
          if (premade.status === 401) break;
        }
      }
    } catch (e) {
      elevenlabsError = e.message;
      console.error("ElevenLabs TTS exception:", e.message);
    }
  }

  // Strictly ElevenLabs-only: NEVER fall back to Google Translate or Gemini TTS
  return {
    audioBase64: null,
    mimeType: null,
    provider: "elevenlabs-error",
    voiceId: effectiveVoiceId,
    elevenlabsError:
      elevenlabsError || "ElevenLabs gagal menghasilkan suara. Periksa API key & sisa kuota di ⚙️ API & Voice."
  };
}
