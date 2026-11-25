// Shared Stateless AI Video Engine for MaouEdu Studio (Vercel Serverless + Local Dev)
// Real-time Web Research + Gemini 3 Flash / Free LLM + Topic-Accurate 3D Scene Directing

export const CHARACTER_BIBLE = {
  name: "Maou Vaelen (Sang Raja Iblis Modern)",
  archetype: "The Modern Overlord — 2D Anime MC Host & Mastermind",
  defaultVoiceId: "cPoqAvGWCPfCfyPMwe4z",
  voiceUrl: "https://elevenlabs.io/voices/cPoqAvGWCPfCfyPMwe4z",
  visualTraits: {
    hair: "Ash-silver wolf-cut dengan satu helai rambut depan merah darah (crimson streak)",
    horns:
      "Tanduk hitam obsidian asimetris: tanduk kanan utuh melengkung rapi, tanduk kiri ujungnya patah sedikit dengan efek retakan cahaya merah menyala",
    eyes: "Mata merah keemasan menyala (glowing crimson-amber eyes)",
    outfit:
      "Turtleneck hitam ketat di bawah long coat hitam modern beraksen garis emas tipis di kerah & pin permata rubi di dada",
    aura: "Aura bayangan tipis (dark shadow wisps) di sekitar bahu"
  },
  personality:
    "Kalem, elegan, blak-blakan, asik kayak temen nongkrong tapi tetep punya aura 'bos besar', sedikit arogan/sarkas ('Lihat manusia satu ini...'). Berperan sebagai Host 2D Anime yang menunjukkan video 3D eksperimen manusia ke penonton dengan rumus Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!"
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
  if (!cleaned) cleaned = rawPrompt.trim() || "Cara Membuat Es Krim Lembut";
  return cleaned;
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
      const autoHighlight = /^(TAPI,?|JADI,?|SELAMAT!?|GAGAL!?|BOCOR!?|KERUH!?|MUTER!?|MATI!?|KERAS!?|CAIR!?)$/i.test(
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

export function detectWorldSpec(text = "") {
  const lower = text.toLowerCase();

  if (/(es\s*krim|eskrim|ice\s*cream|kue|cake|roti|masak|goreng|kopi|cokelat|coklat|pizza|mie|bakso|boba|pudding|puding|donat|martabak|minuman|makanan)/i.test(lower)) {
    const isIceCream = /(es\s*krim|eskrim|ice\s*cream)/i.test(lower);
    return {
      worldType: "kitchen_food",
      subjectName: isIceCream ? "es krim" : "masakan",
      subjectColor: isIceCream ? "#f9a8d4" : "#f59e0b"
    };
  }
  if (/(cupang|betta)/i.test(lower)) {
    return {
      worldType: "aquarium_fish",
      subjectName: "ikan cupang",
      subjectColor: "#2563eb"
    };
  }
  if (/(arwana|arowana)/i.test(lower)) {
    return {
      worldType: "aquarium_fish",
      subjectName: "ikan arwana",
      subjectColor: "#ef4444"
    };
  }
  if (/(aquarium|akuarium|kolam|ikan|koi|lele|guppy|channa|udang|louhan|discus|aquascape)/i.test(lower)) {
    const fishMatch = lower.match(/\b(koi|lele|guppy|channa|udang|louhan|discus|nila|gurame|koki)\b/);
    const species = fishMatch ? `ikan ${fishMatch[1]}` : "ikan hias";
    const colorMap = {
      koi: "#f97316",
      lele: "#475569",
      guppy: "#38bdf8",
      channa: "#0ea5e9",
      koki: "#fb923c"
    };
    return {
      worldType: "aquarium_fish",
      subjectName: species,
      subjectColor: (fishMatch && colorMap[fishMatch[1]]) || "#06b6d4"
    };
  }
  if (/(kipas|motor|dinamo|stator|rotor|kapasitor|kumparan|magnet|listrik|panel surya|solar|kulkas|ac|mesin|roket|pesawat|baterai|generator)/i.test(lower)) {
    return {
      worldType: "workshop_machine",
      subjectName: lower.includes("kipas") ? "kipas angin" : "mesin",
      subjectColor: "#38bdf8"
    };
  }
  if (/(sawah|padi|minapadi|petani|hidroponik|tanaman|kebun|pupuk|tani|sayur|buah)/i.test(lower)) {
    return {
      worldType: "farm_nature",
      subjectName: lower.includes("minapadi") || lower.includes("sawah") ? "sawah minapadi" : "pertanian",
      subjectColor: "#84cc16"
    };
  }
  return {
    worldType: "lab_science",
    subjectName: extractTopicFromPrompt(text).slice(0, 28),
    subjectColor: "#38bdf8"
  };
}

// Live Autonomous Online Research using Wikipedia ID, Wikipedia EN & DuckDuckGo
export async function researchTopicOnline(topic) {
  const cleanQuery = extractTopicFromPrompt(topic)
    .replace(/\b(buat|bikin|cara|membuat|agar|supaya|anti gagal|yang benar)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalizedQuery = cleanQuery.replace(/\beskrim\b/gi, "es krim");

  const sources = [];
  const summaryFacts = [];

  async function queryWiki(lang, query) {
    try {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&utf8=&format=json&srlimit=2`;
      const sResp = await fetch(searchUrl, {
        headers: { "User-Agent": "MaouEduVideoStudio/2.0" },
        signal: AbortSignal.timeout(6000)
      });
      if (!sResp.ok) return;
      const sData = await sResp.json();
      const hits = sData?.query?.search || [];
      if (!hits.length) return;

      const titles = hits.map((h) => h.title).join("|");
      const extUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
        titles
      )}&format=json`;
      const eResp = await fetch(extUrl, {
        headers: { "User-Agent": "MaouEduVideoStudio/2.0" },
        signal: AbortSignal.timeout(6000)
      });
      if (!eResp.ok) return;
      const eData = await eResp.json();
      const pages = Object.values(eData?.query?.pages || {});
      for (const p of pages) {
        if (p?.extract) {
          const shortExtract = p.extract.split(/\.\s+/).slice(0, 3).join(". ") + ".";
          summaryFacts.push(`${p.title}: ${shortExtract}`);
          sources.push({
            title: `${p.title} (Wikipedia ${lang.toUpperCase()})`,
            url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
            snippet: shortExtract.slice(0, 220)
          });
        }
      }
    } catch {}
  }

  async function queryDuckDuckGo(query) {
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
        query
      )}&format=json&no_html=1&skip_disambig=1`;
      const resp = await fetch(ddgUrl, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data?.AbstractText) {
        summaryFacts.push(data.AbstractText);
        sources.push({
          title: data.Heading || query,
          url: data.AbstractURL || "https://duckduckgo.com",
          snippet: data.AbstractText.slice(0, 220)
        });
      }
    } catch {}
  }

  await Promise.allSettled([
    queryWiki("id", normalizedQuery || topic),
    queryWiki("en", normalizedQuery || topic),
    queryDuckDuckGo(normalizedQuery || topic)
  ]);

  return {
    searchedQuery: normalizedQuery || topic,
    summaryFacts: summaryFacts.slice(0, 4),
    sources: sources.slice(0, 4)
  };
}

// Offline/Emergency Fallback Blueprint ONLY used if both Gemini AND Pollinations fail
function buildOfflineFallbackScript(topic, researchData = null) {
  const lower = topic.toLowerCase();
  const worldSpec = detectWorldSpec(topic);

  if (/(es\s*krim|eskrim|ice\s*cream)/i.test(lower)) {
    return {
      title: "Kenapa Bikin Es Krim Sendiri Sering Keras Kayak Batu?",
      topic: "Cara Membuat Es Krim Lembut",
      hookFormula: "Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          componentLabel: "PERCOBAAN 01: SUSU + GULA MASUK FREEZER",
          narration:
            "Lihat manusia ini bikin [es krim]. Modal campur [susu cair] sama gula di mangkuk, terus langsung dimasukin ke freezer?",
          highlightWords: ["es krim", "susu cair"],
          worldType: "kitchen_food",
          subjectName: "es krim",
          subjectColor: "#f9a8d4",
          workerAction: "stir",
          stageEffect: "normal",
          visualPrompt: "3D cute low-poly animation of a person mixing milk and sugar in a steel bowl on a wooden table",
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH #1: JADI BATU ES KERAS!",
          narration:
            "[TAPI] pas dikeluarkan, hasilnya bukan es krim lembut—malah jadi [batu es keras] bertekstur kasar gara-gara [kristal es besar]!",
          highlightWords: ["TAPI", "batu es keras", "kristal es besar"],
          worldType: "kitchen_food",
          subjectName: "es krim",
          subjectColor: "#93c5fd",
          workerAction: "panic",
          stageEffect: "frozen_hard",
          visualPrompt: "3D animation of a rock-hard frozen ice block inside a bowl with sharp ice crystals, human panicking",
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI #1: EMBER ES BATU + GARAM (-15°C)",
          narration:
            "[JADI] taruh mangkuk adonan di dalam ember berisi [es batu] lalu taburi [garam kasar]. Garam menurunkan titik beku es sampai [minus lima belas derajat]!",
          highlightWords: ["JADI", "es batu", "garam kasar", "minus lima belas derajat"],
          worldType: "kitchen_food",
          subjectName: "es krim",
          subjectColor: "#38bdf8",
          workerAction: "pour",
          stageEffect: "normal",
          visualPrompt: "3D cutaway diagram of a steel bowl sitting inside a bucket of ice cubes and coarse salt with -15C cold mist",
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH #2: MASIH BERPASIR & CEPAT LELEH!",
          narration:
            "[TAPI] kalau cuma didiamkan tanpa lemak dan udara, es krimnya tetap [berpasir] dan gampang [mencair] begitu kena suhu ruang!",
          highlightWords: ["TAPI", "berpasir", "mencair"],
          worldType: "kitchen_food",
          subjectName: "es krim",
          subjectColor: "#fde68a",
          workerAction: "panic",
          stageEffect: "melting",
          visualPrompt: "3D animation of melting grainy ice cream puddle on a wooden counter",
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI #2: KRIM KENTAL, KUNING TELUR & KOCOKAN (OVERRUN)",
          narration:
            "[JADI] tambahkan [krim kental] plus kuning telur sebagai pengemulsi, lalu [kocok terus] selama membeku supaya kristal es terpecah mikroskopis dan terisi [gelembung udara]!",
          highlightWords: ["JADI", "krim kental", "kocok terus", "gelembung udara"],
          worldType: "kitchen_food",
          subjectName: "es krim",
          subjectColor: "#f9a8d4",
          workerAction: "stir",
          stageEffect: "spinning",
          visualPrompt: "3D animation of a whisk vigorously churning smooth pink and vanilla cream in a chilled bowl",
          sfx: "ding"
        },
        {
          sceneNumber: 6,
          phase: "CLIMAX",
          mcPose: "eureka",
          componentLabel: "HASIL AKHIR: ES KRIM LEMBUT KUALITAS GELATO!",
          narration:
            "[SELAMAT!] Sekarang lihat hasilnya—[es krim lembut] padat dan nggak berpasir! Ternyata kuncinya cuma sains garam dan pengadukan. Habis ini mau gw bedah bikin apa lagi? [Tulis di komentar]!",
          highlightWords: ["SELAMAT!", "es krim lembut", "Tulis di komentar"],
          worldType: "kitchen_food",
          subjectName: "es krim",
          subjectColor: "#f472b6",
          workerAction: "celebrate",
          stageEffect: "creamy_done",
          visualPrompt: "3D cute animation of three colorful smooth ice cream scoops on crispy waffle cones with sparkles",
          sfx: "victory"
        }
      ]
    };
  }

  if (/(cupang|betta)/i.test(lower)) {
    return {
      title: "Cara Bikin Aquarium Ikan Cupang Biar Sehat & Ekor Mekar",
      topic: "Aquarium Ikan Cupang",
      hookFormula: "Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          componentLabel: "PERCOBAAN 01: TOPLES KECIL & AIR KRAN",
          narration:
            "Lihat manusia ini melihara [ikan cupang]. Cuma modal toples sempit diisi [air keran] mentah terus langsung masukin dua cupang sekaligus?",
          highlightWords: ["ikan cupang", "air keran"],
          worldType: "aquarium_fish",
          subjectName: "ikan cupang",
          subjectColor: "#2563eb",
          workerAction: "pour",
          stageEffect: "normal",
          visualPrompt: "3D cute animation of a person putting colorful blue betta fish into a tiny jar",
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH #1: CUPANG BERTARUNG & EKOR SOBEK!",
          narration:
            "[TAPI] baru lima menit, dua cupang jantan itu langsung [saling serang] sampai ekornya sobek! Cupang itu [ikan teritorial], nggak bisa digabung satu wadah!",
          highlightWords: ["TAPI", "saling serang", "ikan teritorial"],
          worldType: "aquarium_fish",
          subjectName: "ikan cupang",
          subjectColor: "#ef4444",
          workerAction: "panic",
          stageEffect: "fighting",
          visualPrompt: "3D animation of two betta fish flaring aggressively inside one glass tank",
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI #1: AQUARIUM SOLITER & SEKAT KACA",
          narration:
            "[JADI] pisahkan ke [aquarium kaca] minimal 5 liter per ekor, atau pasang [sekat buram] supaya mereka nggak stres melihat musuh terus-terusan.",
          highlightWords: ["JADI", "aquarium kaca", "sekat buram"],
          worldType: "aquarium_fish",
          subjectName: "ikan cupang",
          subjectColor: "#2563eb",
          workerAction: "build",
          stageEffect: "normal",
          visualPrompt: "3D clean glass betta aquarium with divider and aquatic plants",
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          componentLabel: "MASALAH #2: ARUS FILTER TERLALU DERAS & AIR KLORIN!",
          narration:
            "[TAPI] pas dikasih filter air yang kencang, cupangnya malah [tersedot arus] dan lemas! Ekor panjangnya berat buat berenang di arus deras, plus air keran mengandung [klorin]!",
          highlightWords: ["TAPI", "tersedot arus", "klorin"],
          worldType: "aquarium_fish",
          subjectName: "ikan cupang",
          subjectColor: "#06b6d4",
          workerAction: "panic",
          stageEffect: "murky",
          visualPrompt: "3D animation of betta fish struggling against strong filter current in cloudy tank",
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          componentLabel: "SOLUSI #2: DAUN KETAPANG & SPONGE FILTER PELAN",
          narration:
            "[JADI] endapkan air pakai [daun ketapang] kering biar pH air stabil dan anti-jamur, lalu pakai [sponge filter] berarus super lembut plus [tutup tipis] biar cupang nggak loncat!",
          highlightWords: ["JADI", "daun ketapang", "sponge filter", "tutup tipis"],
          worldType: "aquarium_fish",
          subjectName: "ikan cupang",
          subjectColor: "#3b82f6",
          workerAction: "build",
          stageEffect: "clear_done",
          visualPrompt: "3D cutaway betta aquarium with indian almond leaf, gentle sponge filter bubbles, and sleek lid",
          sfx: "ding"
        },
        {
          sceneNumber: 6,
          phase: "CLIMAX",
          mcPose: "eureka",
          componentLabel: "HASIL AKHIR: CUPANG SEHAT, WARNA TAJAM & EKOR MEKAR!",
          narration:
            "[SELAMAT!] Sekarang lihat [ikan cupang] lu berenang tenang dengan ekor [mekar sempurna]. Rawat ikan kecil aja tetap butuh ilmu, kan? Mau gw bedah topik apa lagi? [Tulis di komentar]!",
          highlightWords: ["SELAMAT!", "ikan cupang", "mekar sempurna", "Tulis di komentar"],
          worldType: "aquarium_fish",
          subjectName: "ikan cupang",
          subjectColor: "#3b82f6",
          workerAction: "celebrate",
          stageEffect: "sparkling",
          visualPrompt: "3D vibrant blue and red halfmoon betta fish swimming majestically in lush planted glass tank",
          sfx: "victory"
        }
      ]
    };
  }

  const cleanTopic = extractTopicFromPrompt(topic);
  const fact1 = researchData?.summaryFacts?.[0]
    ? researchData.summaryFacts[0].split(".")[0]
    : `${cleanTopic} bergantung pada keseimbangan komponen dan reaksi utamanya`;
  const fact2 = researchData?.summaryFacts?.[1]
    ? researchData.summaryFacts[1].split(".")[0]
    : `pengaturan tahap akhir pada ${cleanTopic} menentukan kualitas hasilnya`;

  return {
    title: `Bedah Tuntas: ${cleanTopic}`,
    topic: cleanTopic,
    hookFormula: "Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!",
    scenes: [
      {
        sceneNumber: 1,
        phase: "HOOK",
        mcPose: "default",
        componentLabel: `PERCOBAAN 01: ${cleanTopic.toUpperCase().slice(0, 32)}`,
        narration: `Lihat manusia ini mencoba [${cleanTopic}]. Kelihatannya gampang banget kalau cuma dilakukan asal-asalan dari langkah pertama, kan?`,
        highlightWords: [cleanTopic],
        ...worldSpec,
        workerAction: "build",
        stageEffect: "normal",
        visualPrompt: `3D cute low-poly isometric animation of a human starting ${cleanTopic}`,
        sfx: "whoosh"
      },
      {
        sceneNumber: 2,
        phase: "TAPI",
        mcPose: "sarcastic",
        componentLabel: "MASALAH #1: LANGSUNG GAGAL DI TAHAP AWAL!",
        narration: `[TAPI] begitu dijalankan mentah tanpa perhitungan, [${cleanTopic}] langsung [gagal total] dan hasilnya berantakan!`,
        highlightWords: ["TAPI", cleanTopic, "gagal total"],
        ...worldSpec,
        workerAction: "panic",
        stageEffect: "murky",
        visualPrompt: `3D animation of ${cleanTopic} failing with red warning signs`,
        sfx: "error"
      },
      {
        sceneNumber: 3,
        phase: "JADI",
        mcPose: "explaining",
        componentLabel: "SOLUSI #1: PRINSIP ILMIAH INTI",
        narration: `[JADI] pahami dulu faktanya: ${fact1}. Bagian [komponen inti] ini wajib disiapkan dengan takaran tepat.`,
        highlightWords: ["JADI", "komponen inti"],
        ...worldSpec,
        workerAction: "stir",
        stageEffect: "spinning",
        visualPrompt: `3D cutaway educational diagram showing core mechanism of ${cleanTopic}`,
        sfx: "pop"
      },
      {
        sceneNumber: 4,
        phase: "TAPI",
        mcPose: "sarcastic",
        componentLabel: "MASALAH #2: TIDAK STABIL SAAT DIPROSES!",
        narration: `[TAPI] kalau cuma berhenti sampai situ, hasilnya tetap [tidak stabil] dan cepat rusak!`,
        highlightWords: ["TAPI", "tidak stabil"],
        ...worldSpec,
        workerAction: "panic",
        stageEffect: "melting",
        visualPrompt: `3D diagram of unstable ${cleanTopic} problem`,
        sfx: "error"
      },
      {
        sceneNumber: 5,
        phase: "JADI",
        mcPose: "explaining",
        componentLabel: "SOLUSI #2: PENYEMPURNAAN & KONTROL",
        narration: `[JADI] lakukan langkah penyempurnaan ini: ${fact2}. Sekarang sistemnya terkendali sempurna!`,
        highlightWords: ["JADI", "terkendali sempurna"],
        ...worldSpec,
        workerAction: "build",
        stageEffect: "clear_done",
        visualPrompt: `3D diagram of perfected ${cleanTopic} mechanism`,
        sfx: "ding"
      },
      {
        sceneNumber: 6,
        phase: "CLIMAX",
        mcPose: "eureka",
        componentLabel: "HASIL AKHIR: 100% BERHASIL!",
        narration: `[SELAMAT!] Akhirnya [${cleanTopic}] berhasil sempurna. Habis ini mau gw tunjukin eksperimen apa lagi? [Tulis di komentar]!`,
        highlightWords: ["SELAMAT!", cleanTopic, "Tulis di komentar"],
        ...worldSpec,
        workerAction: "celebrate",
        stageEffect: "sparkling",
        visualPrompt: `3D completed ${cleanTopic} glowing with victory badge`,
        sfx: "victory"
      }
    ]
  };
}

function enrichScript(scriptObj, researchData = null, fallbackTopic = "") {
  scriptObj.character = CHARACTER_BIBLE;
  scriptObj.research = researchData;

  const baseSpec = detectWorldSpec(`${fallbackTopic} ${scriptObj.topic || ""} ${scriptObj.title || ""}`);

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
    return {
      ...sc,
      sceneNumber: idx + 1,
      phase,
      mcPose,
      mcPlacement: sc.mcPlacement || (phase === "TAPI" ? "presenter-right" : "presenter-left"),
      worldType: sc.worldType || baseSpec.worldType,
      subjectName: sc.subjectName || baseSpec.subjectName,
      subjectColor: sc.subjectColor || baseSpec.subjectColor,
      workerAction:
        sc.workerAction ||
        (phase === "TAPI" ? "panic" : phase === "CLIMAX" ? "celebrate" : phase === "JADI" ? "build" : "stir"),
      stageEffect:
        sc.stageEffect ||
        (phase === "TAPI" ? "murky" : phase === "CLIMAX" ? "sparkling" : phase === "JADI" ? "clear_done" : "normal"),
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
    generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
  };

  // Prioritize ultra-fast verified 200 OK models first!
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
      } else {
        console.warn(`Gemini ${model} returned HTTP ${resp.status}`);
      }
    } catch (e) {
      console.warn(`Gemini ${model} error:`, e.message);
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
      "Pola Edutainment 3D Step-by-Step ala @untabiru5: Langsung aksi di detik 0:00 -> Masalah ('TAPI...') -> Solusi Ilmiah ('JADI...') -> Loop 3 tahap ('SELAMAT!') + Subtitle kotak kuning kata kunci."
  };
}

export async function generateScriptFromPrompt({
  prompt,
  referenceUrl = "",
  geminiApiKey = ""
}) {
  const cleanTopic = extractTopicFromPrompt(prompt);
  const detectedWorld = detectWorldSpec(cleanTopic);

  const [refMeta, researchData] = await Promise.all([
    referenceUrl && referenceUrl.includes("tiktok.com")
      ? analyzeTikTokUrl(referenceUrl).catch(() => null)
      : Promise.resolve(null),
    researchTopicOnline(cleanTopic)
  ]);

  const refContext = refMeta
    ? `Referensi TikTok: "${refMeta.title}" oleh @${refMeta.author?.uniqueId}`
    : "";

  const factsBlock = researchData.summaryFacts.length
    ? `FAKTA HASIL RISET ONLINE:\n- ${researchData.summaryFacts.join("\n- ")}`
    : "";

  const systemInstruction = `Kamu adalah sutradara & penulis skrip video edukasi pendek TikTok (60-80 detik) bergaya @untabiru5 & @dhotscliper.
KONSEP VIDEO:
- Video utama di layar menampilkan animasi 3D seorang manusia biasa yang sedang mencoba membuat/melakukan sesuatu sesuai TOPIK SPESIFIK user.
- Karakter ikonik kita "Maou Vaelen" (MC Raja Iblis 2D Anime, suara cowok) tampil sebagai HOST yang MENUNJUKKAN & MENJELASKAN video percobaan manusia itu ke penonton (dia TIDAK ikut jadi pekerja di dalam video, tapi dia jadi host yang nge-roast kesalahan manusia & menjelaskan solusi ilmiahnya).
- GAYA BAHASA HOST: Kalem, elegan, blak-blakan, asik kayak temen nongkrong tapi tetap berwibawa ("bos besar"), sedikit sarkas ("Lihat manusia ini bikin...").
- WAJIB 100% SESUAI TOPIK USER! JANGAN PERNAH mengganti topik user ke topik lain (misal user minta "ikan cupang" HARUS bahas ikan cupang, BUKAN arwana; user minta "buat eskrim" HARUS bahas sains membuat es krim).
- WAJIB ikuti rumus @untabiru5:
  1. Scene 1 (HOOK): Langsung tunjukkan aksi pertama si manusia ("Lihat manusia ini bikin [topik]...").
  2. Scene 2 (TAPI): Masalah ilmiah/teknis nyata yang langsung terjadi ("TAPI...").
  3. Scene 3 (JADI): Solusi ilmiah konkret & nama bahan/komponennya ("JADI...").
  4. Scene 4 (TAPI): Masalah tahap kedua ("TAPI...").
  5. Scene 5 (JADI): Solusi penyempurnaan tahap kedua ("JADI...").
  6. Scene 6 (CLIMAX): Hasil akhir sempurna diawali "[SELAMAT!]" + kesimpulan + CTA "Tulis di komentar!".
- Bungkus 2-3 kata kunci penting tiap scene dalam kurung siku [kata kunci] untuk kotak kuning subtitle.

Pilih "worldType" paling cocok:
- "kitchen_food" (untuk makanan, minuman, es krim, kue, masak, kopi)
- "aquarium_fish" (untuk ikan cupang, arwana, koi, lele, udang, aquarium, kolam)
- "workshop_machine" (untuk kipas angin, motor, listrik, panel surya, kulkas, roket, alat teknik)
- "farm_nature" (untuk sawah, minapadi, tanaman, kebun, hidroponik)
- "lab_science" (untuk sains/fisika/kimia/topik umum lainnya)

Kembalikan HANYA JSON valid:
{
  "title": "Judul Video Singkat Sesuai Topik User",
  "topic": "${cleanTopic}",
  "hookFormula": "Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!",
  "scenes": [
    {
      "sceneNumber": 1,
      "phase": "HOOK" | "TAPI" | "JADI" | "CLIMAX",
      "mcPose": "default" | "sarcastic" | "explaining" | "eureka",
      "componentLabel": "LABEL KOMPONEN / TAHAP SINGKAT HURUF BESAR",
      "narration": "Kalimat host MC Raja Iblis dengan [kata kunci] di kurung siku",
      "highlightWords": ["kata kunci"],
      "worldType": "${detectedWorld.worldType}",
      "subjectName": "nama objek spesifik (misal: ikan cupang / es krim / kipas angin)",
      "subjectColor": "#hexcolor yang cocok dengan objek",
      "workerAction": "stir" | "dig" | "pour" | "build" | "panic" | "celebrate",
      "stageEffect": "normal" | "murky" | "frozen_hard" | "melting" | "jumping" | "fighting" | "spinning" | "humming" | "creamy_done" | "clear_done" | "sparkling",
      "visualPrompt": "English prompt for a cute 3D isometric low-poly educational animation frame (like Blender/untabiru5 style, bright clean lighting, showing the exact step for this topic)",
      "sfx": "whoosh" | "error" | "pop" | "ding" | "victory"
    }
  ]
}`;

  const userPrompt = `Prompt user: "${prompt}"\nTopik WAJIB dibahas: "${cleanTopic}"\n${refContext}\n${factsBlock}\nBuat 6-7 scene edukasi step-by-step yang sangat akurat secara ilmiah khusus tentang "${cleanTopic}".`;

  // 1. ALWAYS Try Gemini First (works for ANY topic: ikan cupang, buat eskrim, roket, dll!)
  const candidateGeminiKeys = Array.from(
    new Set([cleanApiKey(geminiApiKey), cleanApiKey(process.env.GEMINI_API_KEY)].filter(Boolean))
  );
  for (const gKey of candidateGeminiKeys) {
    const geminiResult = await callGeminiWithKey(gKey, systemInstruction, userPrompt);
    if (geminiResult) {
      const usedModel = geminiResult._usedModel || "gemini-3-flash";
      delete geminiResult._usedModel;
      const enriched = enrichScript(geminiResult, researchData, cleanTopic);
      enriched.referenceMetadata = refMeta;
      enriched.aiEngine = `${usedModel} + web-research`;
      return enriched;
    }
  }

  // 2. Backup: Free LLM (Pollinations) for ANY topic
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
          enriched.aiEngine = "pollinations-llm + web-research";
          return enriched;
        }
      }
    }
  } catch {}

  // 3. Offline Fallback (topic-aware: Es Krim, Cupang, generic research)
  const fallback = enrichScript(
    buildOfflineFallbackScript(cleanTopic, researchData),
    researchData,
    cleanTopic
  );
  fallback.referenceMetadata = refMeta;
  fallback.aiEngine = "maou-research-synthesizer";
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
  const PREMADE_MALE_FALLBACK_ID = "nPczCjzI2devNBz1zQrb"; // Brian — deep resonant male voice allowed on Free API
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
            voiceFallbackNote: `Akun ElevenLabs Free membatasi Library Voice (${effectiveVoiceId}) via API — otomatis pakai suara cowok deep ElevenLabs Brian (${PREMADE_MALE_FALLBACK_ID}).`
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
