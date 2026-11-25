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
  if (/(kipas|dinamo)/i.test(lower)) {
    return {
      setting: "workshop",
      mainContainer: "motor_frame",
      heroObject: "fan_blades",
      accentColor: "#38bdf8"
    };
  }
  if (/(roket|pesawat|satelit)/i.test(lower)) {
    return {
      setting: "sky_space",
      mainContainer: "rocket_pad",
      heroObject: "rocket",
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
  if (/(pizza|roti|kue|donat|martabak|masak|goreng|mie|bakso|tahu|tempe|cokelat|coklat|kopi|teh|boba|jus|minuman|susu)/i.test(lower)) {
    return {
      setting: "kitchen",
      mainContainer: "oven_pan",
      heroObject: "custom_stage",
      accentColor: "#f59e0b"
    };
  }
  if (/(gunung|berapi|gempa|hujan|petir|alam|tanam|kebun|pohon|fotosintesis|filter air|sumur)/i.test(lower)) {
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
  "rocket",
  "rice_fish"
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

function sanitizeVisualSpec(v = {}, defaults, phase, idx, cleanTopic) {
  const heroObject = v.heroObject || defaults.heroObject;
  const accentColor = safeColor(v.accentColor, defaults.accentColor);
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

  const rawParts = Array.isArray(v.stageParts)
    ? v.stageParts.slice(0, 12).map(sanitizeStagePart).filter(Boolean)
    : [];

  const isPreset = PRESET_HEROES.has(heroObject);
  const useCustomStage = Boolean(v.useCustomStage) || (!isPreset && rawParts.length >= 2) || heroObject === "custom_stage";
  const stageParts =
    rawParts.length >= 2
      ? rawParts
      : useCustomStage
      ? buildCustomFallbackParts(cleanTopic, phase, accentColor).map(sanitizeStagePart).filter(Boolean)
      : [];

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

  return {
    setting: v.setting || defaults.setting,
    mainContainer: v.mainContainer || defaults.mainContainer,
    heroObject,
    useCustomStage,
    stageParts,
    fx: fxList,
    comicText,
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
      temperature: 0.75,
      maxOutputTokens: 8192
    }
  };

  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3-flash-preview",
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
          if (parsed?.scenes?.length >= 4) {
            parsed._usedModel = model;
            return parsed;
          }
        }
      } else {
        const errSnippet = await resp.text().catch(() => "");
        console.warn(`Gemini model ${model} HTTP ${resp.status}:`, errSnippet.slice(0, 180));
      }
    } catch (e) {
      console.warn(`Gemini model ${model} error:`, e.message);
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
KURIKULUM ANIMATOR 2.5D MAOUEDU (WAJIB KAMU KUASAI AGAR ANIMASI GERAK NYATA & KONSISTEN):
Panggung eksperimen berpusat di titik (0, 0). Rentang koordinat aman:
- Sumbu X: -165 (kiri) sampai +165 (kanan).
- Sumbu Y: -105 (atas) sampai +100 (bawah/meja).
Susun visual.stageParts berurutan DARI BELAKANG KE DEPAN (wadah/mesin besar dulu -> cairan di dalam -> mekanisme/komponen dalam -> panah aliran -> label badge kecil di paling akhir).

DAFTAR BENTUK 2.5D ("kind"):
1. "roundRect": { kind:"roundRect", x, y, w, h, r, fill, glass?:true, label?, motion } -> kotak/tabung/baterai/kulkas/HP/panel/sekat (x,y adalah titik TENGAH kotak!).
2. "circle": { kind:"circle", x, y, radius, fill, label?, motion } -> bola/roda/atom/matahari/buah/lampu.
3. "ellipse": { kind:"ellipse", x, y, rx, ry, fill, motion } -> piring/wajan/kawah/gelembung.
4. "trapezoid": { kind:"trapezoid", x, y, topW, bottomW, h, fill, motion } -> gunung berapi, tabung kimia Erlenmeyer, ember, corong, gelas kopi!
5. "poly": { kind:"poly", points:[[x,y],...], fill, motion } -> petir, kristal, lava, atap, sayap, api.
6. "liquid": { kind:"liquid", x, y, w, h, r, fill } -> cairan bergelombang hidup (magma, air filter, kopi, elektrolit, minyak panas).
7. "arrow": { kind:"arrow", x1, y1, x2, y2, color, speed:2 } -> panah garis putus-putus BERGERAK untuk menunjukkan arah aliran listrik/panas/air/gas!
8. "gear": { kind:"gear", x, y, radius, teeth:8, fill, speed:3 } -> roda gigi BERPUTAR!
9. "fan": { kind:"fan", x, y, radius, blades:3, fill, speed:8 } -> baling-baling / turbin BERPUTAR!
10. "coil": { kind:"coil", x, y, w, h, turns:5, color, motion } -> pipa pendingin AC/kulkas, pegas, atau lilitan kawat pemanas!
11. "badge": { kind:"badge", x, y, text, fill, textColor } -> label komponen singkat 1-2 kata (contoh: "ANODA -", "MAGMA", "FREON").

DAFTAR GERAKAN ("motion"):
"none" | "float" | "pulse" | "spin" | "spin_reverse" | "shake" (untuk scene TAPI rusak/bergetar/meletus!) | "slide_x" | "slide_y" | "rise" (naik ke atas terus) | "drip" (menetes ke bawah) | "tilt" (menuang).

EFEK PARTIKEL ("fx", maksimal 2 per scene):
"sparks" | "bubbles" | "steam" | "smoke" | "frost" | "flame" | "lightning" | "water_drops" | "confetti" | "leaves" | "electrons"

CONTOH REFERENSI KOREOGRAFI ANIMASI (TIRU KUALITAS & LOGIKA GERAKNYA!):
- Contoh 1 (BATERAI HP):
  - HOOK: casing Baterai (roundRect x:0 y:10 w:190 h:120 fill:"#1e293b") + liquid elektrolit biru (x:0 y:20 w:168 h:82 fill:"#38bdf8") + badge ANODA (-) & KATODA (+), motion:"none", fx:["electrons"].
  - TAPI: motion:"shake" di baterai & elektrolit merah ("#ef4444"), hilangkan sekat tengah biar konslet, fx:["sparks","smoke"], comicText:"KONSLET!", meter:{label:"SUHU",value:95,min:20,max:120,unit:"°C",danger:true}.
  - JADI: tambah separator tengah (roundRect x:0 y:10 w:10 h:105 fill:"#fde047" motion:"pulse"), elektrolit balik biru ("#38bdf8"), arrow elektron mengalir halus (x1:-65 y1:-20 x2:65 y2:-20 color:"#6ee7b7" speed:3), fx:["electrons"], comicText:"AMAN!".
- Contoh 2 (GUNUNG BERAPI):
  - trapezoid gunung coklat (x:0 y:25 topW:58 bottomW:265 h:145 fill:"#78350f") + liquid dapur magma di dalam bawah (x:0 y:62 w:130 h:50 fill:"#f97316") + arrow dorongan gas naik (x1:0 y1:45 x2:0 y2:-65 color:"#fde047" speed:4), fx:["smoke","flame"] saat TAPI meletus!
- Contoh 3 (CARA KERJA AC / KULKAS):
  - roundRect unit ruangan (x:-65 y:10 w:110 h:110 fill:"#e0f2fe") + coil evaporator biru (x:-65 y:15 w:72 h:62 color:"#0284c7") + roundRect unit luar (x:75 y:10 w:110 h:110 fill:"#f1f5f9") + fan kipas luar (x:75 y:10 radius:32 fill:"#38bdf8" speed:8) + arrow aliran pipa dingin ke kiri & panas ke kanan, fx:["frost"]!
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
    ? `CATATAN RISET (JANGAN DI-COPY MENTAH, ubah jadi aksi praktek nyata + animasi gerak!):\n- ${researchData.summaryFacts.join(
        "\n- "
      )}`
    : "";

  const isPresetTopic = PRESET_HEROES.has(defaults.heroObject);
  const stageInstruction = isPresetTopic
    ? `Topik ini memiliki stage animasi unggulan heroObject="${defaults.heroObject}". Gunakan heroObject="${defaults.heroObject}", lalu PERKAYA setiap scene dengan "fx", "comicText", dan "meter" yang relevan dengan fase HOOK/TAPI/JADI/CLIMAX!`
    : `WAJIB set heroObject="custom_stage" dan rancang SENDIRI animasi 2.5D-nya menggunakan "stageParts" (WAJIB minimal 5–8 komponen visual tiap scene! Jangan cuma 2 kotak polos — gabungkan wadah + cairan/isi + gear/fan/coil + arrow aliran bergerak + badge komponen, dan pastikan berubah nyata antara HOOK -> TAPI -> JADI -> CLIMAX!) + "fx" + "comicText" + "meter"!`;

  const systemInstruction = `Kamu adalah Sutradara Animasi 2.5D & Penulis Skrip Video Edukasi Pendek TikTok bergaya @untabiru5 x @dhotscliper (konsisten di setiap video!).

ATURAN WAJIB (HARUS DIPATUHI 100%):
1. BAHASA: **WAJIB 100% BAHASA INDONESIA SEHARI-HARI YANG SIMPEL, ASIK, SERU, DAN MUDAH DIPAHAMI!** DILARANG memakai kalimat bahasa Inggris kaku atau gaya membaca Wikipedia!
2. GAYA HOST (MC RAJA IBLIS 2D ANIME):
   - Kalem, elegan, blak-blakan, agak sarkas tapi suportif kayak bos besar ("Liat nih manusia...", "Nah gitu dong!").
   - Host sedang mengomentari manusia topi/hoodie toska yang sedang PRAKTEK langsung langkah demi langkah!
3. PANJANG KALIMAT: **RINGKAS & CEPAT!** 12–20 kata per scene. Setiap scene berisi AKSI PRAKTEK NYATA, BUKAN definisi buku teks.
4. POLA WAJIB 6 SCENE:
   - Scene 1 (HOOK): Manusia nyoba [${cleanTopic}] pakai cara polos paling awal.
   - Scene 2 (TAPI): Masalah nyata langsung kejadian gara-gara cara polos itu! Diawali "[TAPI]".
   - Scene 3 (JADI): Solusi praktek tahap 1 (sebut alat/bahan nyata + kenapa berhasil!). Diawali "[JADI]".
   - Scene 4 (TAPI): Masalah nyata tahap kedua muncul! Diawali "[TAPI]".
   - Scene 5 (JADI): Solusi penyempurnaan tahap 2! Diawali "[JADI]".
   - Scene 6 (CLIMAX): Sukses sempurna! Diawali "[SELAMAT!]" + "Habis ini mau liat bikin apa lagi? [Tulis di komentar]!".
5. HIGHLIGHT SUBTITLE: Bungkus 2-3 kata kunci penting per scene dengan kurung siku [kata kunci].
6. TOPIK WAJIB: 100% fokus pada "${cleanTopic}".
7. KOREOGRAFI VISUAL PRAKTEK: ${stageInstruction}
   - setting: "kitchen" | "aquarium" | "backyard" | "workshop" | "farm" | "sky_space"
   - workerAction: "pour" | "stir" | "build" | "heat" | "inspect" | "panic" | "celebrate"
   - comicText: 1 kata seru huruf besar (misal: "KRAK!", "DUAR!", "DESIS!", "KLIK!", "TING!")
   - meter: angka indikator ilmiah nyata (misal: {"label":"SUHU","value":-15,"min":-25,"max":40,"unit":"°C","danger":false})
${ANIMATION_CURRICULUM_GUIDE}

Kembalikan HANYA JSON valid sesuai struktur:
{
  "title": "Judul Singkat Menarik Bahasa Indonesia",
  "topic": "${cleanTopic}",
  "hookFormula": "Praktek Awal -> TAPI (Gagal) -> JADI (Trik Ilmiah) -> SELAMAT!",
  "scenes": [
    {
      "sceneNumber": 1,
      "phase": "HOOK" | "TAPI" | "JADI" | "CLIMAX",
      "mcPose": "default" | "sarcastic" | "explaining" | "eureka",
      "componentLabel": "LABEL KOMPONEN UTAMA",
      "narration": "Narasi 12-20 kata Bahasa Indonesia santai dengan [kata kunci]",
      "highlightWords": ["kata kunci"],
      "visual": {
        "setting": "${defaults.setting}",
        "heroObject": "${defaults.heroObject}",
        "workerAction": "pour",
        "ingredientOrTool": "wrench",
        "problemVisual": "none",
        "solutionVisual": "none",
        "accentColor": "${defaults.accentColor}",
        "comicText": "MULAI!",
        "fx": ["bubbles"],
        "meter": { "label": "PROSES", "value": 30, "min": 0, "max": 100, "unit": "%", "danger": false },
        "callouts": ["LABEL KIRI", "LABEL KANAN"],
        "stageParts": []
      },
      "sfx": "whoosh" | "error" | "pop" | "ding" | "victory"
    }
  ]
}`;

  const userPrompt = `Prompt user: "${prompt}"\nTopik wajib: "${cleanTopic}"\n${refContext}\n${factsBlock}\nBuat 6 scene praktek langsung Bahasa Indonesia santai + rancang visual animasi 2.5D yang benar-benar bergerak menunjukkan proses "${cleanTopic}" tahap demi tahap!`;

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
      enriched.aiEngine = `${usedModel} • Animator 2.5D`;
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
          enriched.aiEngine = "AI Gratis • Animator 2.5D";
          return enriched;
        }
      }
    }
  } catch {}

  const fallback = enrichScript(buildOfflineFallbackScript(cleanTopic), researchData, cleanTopic);
  fallback.referenceMetadata = refMeta;
  fallback.aiEngine = "Blueprint Praktek 2.5D";
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
