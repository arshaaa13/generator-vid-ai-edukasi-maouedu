// Shared Stateless AI Video Engine for MaouEdu Studio (Vercel Serverless + Local Dev)

export const CHARACTER_BIBLE = {
  name: "Maou Vaelen (Sang Raja Iblis Modern)",
  archetype: "The Modern Overlord — MC Edukasi & Mastermind",
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
    "Kalem, elegan, blak-blakan, asik kayak temen nongkrong tapi tetep punya aura 'bos besar', sedikit arogan/sarkas ('Manusia masih aja belum paham soal ini...'). Berperan sebagai MC / Pembawa Acara utama yang membedah sains & teknik dengan rumus Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!"
};

export function extractTopicFromPrompt(rawPrompt = "") {
  let cleaned = rawPrompt
    .replace(/https?:\/\/\S+/gi, "")
    .replace(
      /^(tolong\s+)?(bikin(in)?|buat(in)?|generate|cari(in)?|jelasin|jelaskan|bahas)\s+(vid(eo)?|konten|edukasi|animasi|script)?\s*(tentang|mengenai|soal|cara)?\s*/i,
      ""
    )
    .trim();
  if (!cleaned) cleaned = rawPrompt.trim() || "Cara Bikin Aquarium Ikan Arwana";
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
      const autoHighlight = /^(TAPI,?|JADI,?|SELAMAT!?|GAGAL!?|BOCOR!?|KERUH!?|MUTER!?|MATI!?)$/i.test(
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

function detectVisualTheme(text = "") {
  const lower = text.toLowerCase();
  if (/(aquarium|akuarium|arwana|kolam|ikan|filter air|bio.?ball|amonia|kuras)/i.test(lower)) {
    return "aquarium";
  }
  if (/(kipas|motor|dinamo|stator|rotor|kapasitor|kumparan|magnet|listrik)/i.test(lower)) {
    return "motor";
  }
  if (/(sawah|padi|minapadi|petani|wereng|pupuk)/i.test(lower)) {
    return "agriculture";
  }
  if (/(surya|solar|panel|matahari|inverter|baterai|energi)/i.test(lower)) {
    return "solar";
  }
  if (/(sumur|penjernih|karbon aktif|pasir silika|tawas|air keruh)/i.test(lower)) {
    return "filter";
  }
  return "science";
}

// Live Autonomous Online Research using Wikipedia ID, Wikipedia EN & DuckDuckGo
export async function researchTopicOnline(topic) {
  const cleanQuery = extractTopicFromPrompt(topic)
    .replace(/\b(buat|bikin|cara|membuat|agar|supaya|anti gagal|yang benar)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const searchTerms = Array.from(
    new Set([cleanQuery, topic, ...cleanQuery.split(" ").filter((w) => w.length > 4).slice(0, 2)])
  ).filter(Boolean);

  const sources = [];
  const summaryFacts = [];

  async function queryWiki(lang, query) {
    try {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&utf8=&format=json&srlimit=2`;
      const sResp = await fetch(searchUrl, {
        headers: { "User-Agent": "MaouEduVideoStudio/1.0" },
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
        headers: { "User-Agent": "MaouEduVideoStudio/1.0" },
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
    queryWiki("id", cleanQuery || topic),
    queryWiki("en", cleanQuery || topic),
    queryDuckDuckGo(cleanQuery || topic)
  ]);

  // If primary combined phrase returned nothing, search first strong keyword
  if (sources.length === 0 && searchTerms[2]) {
    await queryWiki("id", searchTerms[2]);
  }

  return {
    searchedQuery: cleanQuery || topic,
    summaryFacts: summaryFacts.slice(0, 4),
    sources: sources.slice(0, 4)
  };
}

function buildStructuredScript(topic, referenceContext = "", researchData = null) {
  const lower = `${topic} ${referenceContext}`.toLowerCase();

  // Specific deep preset for Aquarium / Kolam Ikan Arwana
  if (lower.includes("aquarium") || lower.includes("akuarium")) {
    return {
      title: "Cara Bikin Aquarium Ikan Arwana Anti-Mati Ala Raja Iblis",
      topic,
      hookFormula: "Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          mcPlacement: "hero",
          componentLabel: "PERCOBAAN 01: AQUARIUM KACA & AIR KRAN",
          narration:
            "Manusia masih aja ngira bikin [aquarium arwana] itu gampang: beli kaca kotak, isi [air keran] sampai penuh, terus langsung cemplungin arwana merah?",
          highlightWords: ["aquarium arwana", "air keran"],
          visualPrompt:
            "3D isometric glass aquarium filled with tap water and a red arowana fish, sleek dark studio lighting",
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          mcPlacement: "presenter-right",
          componentLabel: "MASALAH #1: KLORIN & AMONIA BERACUN!",
          narration:
            "[TAPI] lihat hasilnya besok pagi! Air keran masih mengandung [kaporit klorin] dan belum ada bakteri pengurai, insang arwana langsung [terbakar amonia]!",
          highlightWords: ["TAPI", "kaporit klorin", "terbakar amonia"],
          visualPrompt:
            "3D aquarium cross-section with toxic green chlorine and ammonia hazard particles affecting a stressed fish",
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          mcPlacement: "presenter-left",
          componentLabel: "SOLUSI #1: SUMP FILTER & CYCLING BAKTERI",
          narration:
            "[JADI] pakai logika. Endapkan air atau kasih anti-klorin, lalu pasang [Sump Filter] isi kapas mekanis, karang jahe, dan [bio-ring] tempat hidup bakteri baik pengurai amonia.",
          highlightWords: ["JADI", "Sump Filter", "bio-ring"],
          visualPrompt:
            "3D cutaway diagram of a multi-chamber aquarium sump filter with filter wool, bio-rings, and clear circulating water",
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          mcPlacement: "presenter-right",
          componentLabel: "MASALAH #2: ARWANA LOMPAT & KACA PECAH!",
          narration:
            "[TAPI] baru ditinggal sebentar, arwananya malah [loncat keluar] menabrak atas! Manusia sering lupa kalau arwana itu [predator pelompat] dan butuh ruang gerak panjang.",
          highlightWords: ["TAPI", "loncat keluar", "predator pelompat"],
          visualPrompt:
            "3D illustration of a red arowana jumping out of an uncovered glass tank with trajectory warning arrows",
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          mcPlacement: "presenter-left",
          componentLabel: "SOLUSI #2: KACA 12MM & TUTUP BERAT BERLUBANG",
          narration:
            "[JADI] pakai aquarium minimal panjang 150 cm dengan [kaca 12 milimeter], lalu kunci pakai [tutup kaca geser] berpemberat tapi tetap ada celah oksigen.",
          highlightWords: ["kaca 12 milimeter", "tutup kaca geser"],
          visualPrompt:
            "3D technical diagram of a reinforced 12mm thick glass aquarium with a heavy ventilated sliding lid keeping fish safely inside",
          sfx: "ding"
        },
        {
          sceneNumber: 6,
          phase: "TAPI",
          mcPose: "sarcastic",
          mcPlacement: "presenter-right",
          componentLabel: "MASALAH #3: MATA TURUN (DROP EYE) & SUHU DROP",
          narration:
            "[TAPI] kenapa arwana aquarium sering kena [mata turun] dan stres pas malam dingin? Karena mereka terus ngelihat pantulan lantai dan suhu airnya [anjlok]!",
          highlightWords: ["TAPI", "mata turun", "anjlok"],
          visualPrompt:
            "3D educational diagram of an aquarium with dropping thermometer icon and glare reflections at the bottom",
          sfx: "error"
        },
        {
          sceneNumber: 7,
          phase: "CLIMAX",
          mcPose: "eureka",
          mcPlacement: "hero",
          componentLabel: "FINAL: HEATER 29°C, LAMPU TANNING & PINGPONG",
          narration:
            "[JADI] pasang [heater 29 derajat], kasih lampu tanning di atas, dan taruh [bola pingpong] mengapung biar pandangan arwana tetap fokus ke atas! [SELAMAT!] Aquarium arwana lu udah berstandar sultan. Habis ini mau gw bedah apa lagi? Tulis di komentar!",
          highlightWords: ["heater 29 derajat", "bola pingpong", "SELAMAT!"],
          visualPrompt:
            "3D isometric luxury arowana aquarium with glowing tanning lamp, heater at 29C, floating pingpong ball, and crystal clear sump filtration",
          sfx: "victory"
        }
      ]
    };
  }

  if (lower.includes("arwana") || lower.includes("kolam")) {
    return {
      title: "Eksperimen Kolam Arwana Anti-Gagal Ala Raja Iblis",
      topic,
      hookFormula: "Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          mcPlacement: "hero",
          componentLabel: "PERCOBAAN 01: GALI TANAH 1,5 METER",
          narration:
            "Manusia masih aja ngira bikin [kolam arwana] itu cuma modal gali tanah [satu setengah meter], isi air, terus cemplungin tujuh arwana merah?",
          highlightWords: ["kolam arwana", "satu setengah meter"],
          visualPrompt: "3D isometric dug pond with 7 red arowana fish",
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          mcPlacement: "presenter-right",
          componentLabel: "MASALAH #1: DINDING TANAH LURUH!",
          narration:
            "[TAPI] lihat sendiri akibatnya. Dinding tanahnya [luruh] kena tekanan air, kolamnya langsung [keruh cokelat]!",
          highlightWords: ["TAPI", "luruh", "keruh cokelat"],
          visualPrompt: "3D cross-section dirt pond collapsing into muddy water",
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          mcPlacement: "presenter-left",
          componentLabel: "SOLUSI #1: DINDING BATA & PLESTER SEMEN",
          narration:
            "[JADI] pakai otak sedikit. Kuras dulu airnya, susun [dinding bata] dan lapis [plester semen] kedap air sebelum diisi ulang.",
          highlightWords: ["JADI", "dinding bata", "plester semen"],
          visualPrompt: "3D pond reinforced with brick wall and waterproof cement",
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          mcPlacement: "presenter-right",
          componentLabel: "MASALAH #2: PREDATOR PELOMPAT!",
          narration:
            "[TAPI] tiba-tiba satu arwana [loncat keluar] kolam! Manusia sering lupa kalau arwana itu [jago lompat] ngejar mangsa.",
          highlightWords: ["TAPI", "loncat keluar", "jago lompat"],
          visualPrompt: "Red arowana jumping out of pond onto grass",
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          mcPlacement: "presenter-left",
          componentLabel: "SOLUSI #2: PAGAR JARING KELILING",
          narration:
            "[JADI] pasang [jaring pengaman] keliling bibir kolam. Begitu dia nekat lompat, badannya [mantul balik] ke air tanpa lecet.",
          highlightWords: ["JADI", "jaring pengaman", "mantul balik"],
          visualPrompt: "Pond with protective black net fence",
          sfx: "ding"
        },
        {
          sceneNumber: 6,
          phase: "TAPI",
          mcPose: "sarcastic",
          mcPlacement: "presenter-right",
          componentLabel: "MASALAH #3: AMONIA & KOTORAN NUMPUK",
          narration:
            "[TAPI] kotoran arwana itu banyak, bikin air penuh [racun amonia], keruh, dan [bau busuk]!",
          highlightWords: ["TAPI", "racun amonia", "bau busuk"],
          visualPrompt: "Murky pond with toxic ammonia buildup",
          sfx: "error"
        },
        {
          sceneNumber: 7,
          phase: "JADI",
          mcPose: "explaining",
          mcPlacement: "presenter-left",
          componentLabel: "SOLUSI #3: FILTER TETES & BAKTERI NITRIFIKASI",
          narration:
            "[JADI] taruh pompa di dasar kolam, alirkan ke rak isi bola plastik berduri. Ini namanya [Filter Tetes], rumah [bakteri baik] pengurai kotoran.",
          highlightWords: ["JADI", "Filter Tetes", "bakteri baik"],
          visualPrompt: "4-tier trickle filter tower with bio-balls",
          sfx: "pop"
        },
        {
          sceneNumber: 8,
          phase: "CLIMAX",
          mcPose: "eureka",
          mcPlacement: "hero",
          componentLabel: "HASIL AKHIR: ATAP BENING & SUHU STABIL",
          narration:
            "[JADI] kunci dengan [atap bening] biar suhu air tetap stabil pas hujan deras. [SELAMAT!] Sekarang lempar jangkrik, arwananya langsung ganas menyambar. Habis ini mau gw bedah apa lagi? Tulis di komentar!",
          highlightWords: ["JADI", "atap bening", "SELAMAT!"],
          visualPrompt: "Complete luxury pond with transparent canopy roof",
          sfx: "victory"
        }
      ]
    };
  }

  if (lower.includes("kipas") || lower.includes("motor") || lower.includes("dinamo")) {
    return {
      title: "Bedah Rahasia Mesin Kipas Angin Ala Raja Iblis",
      topic,
      hookFormula: "Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          mcPlacement: "hero",
          componentLabel: "TAHAP 01: ELEKTROMAGNET SEDERHANA",
          narration:
            "Manusia pikir bikin [kipas angin] itu cukup modal lilit [kawat tembaga] ke paku besi, terus ditempel ke baterai?",
          highlightWords: ["kipas angin", "kawat tembaga"],
          visualPrompt: "Copper wire coiled around iron nail with battery",
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          mcPlacement: "presenter-right",
          componentLabel: "MASALAH #1: CUMA NARIK, NGGAK MUTER!",
          narration:
            "Listrik di lilitan memang bikin besi jadi [magnet]. [TAPI] magnetnya cuma narik diam, sama sekali [nggak muter]!",
          highlightWords: ["magnet", "TAPI", "nggak muter"],
          visualPrompt: "Electromagnet nail stuck not spinning",
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          mcPlacement: "presenter-left",
          componentLabel: "SOLUSI #1: POROS & CINCIN KOMUTATOR",
          narration:
            "[JADI] lilit kawatnya di poros, apit pakai [dua magnet], dan pasang [cincin belah] buat membalik arus tiap setengah putaran!",
          highlightWords: ["JADI", "dua magnet", "cincin belah"],
          visualPrompt: "DC rotor coil between two magnets with split ring commutator",
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "TAPI",
          mcPose: "sarcastic",
          mcPlacement: "presenter-right",
          componentLabel: "MASALAH #2: TENAGA LEMAH & MOTOR BERDENGUNG",
          narration:
            "[TAPI] pakai listrik rumah yang [bolak-balik], kalau cuma satu lilitan motornya malah diam dan [cuma berdengung]!",
          highlightWords: ["TAPI", "bolak-balik", "cuma berdengung"],
          visualPrompt: "AC stator motor humming and vibrating without spinning",
          sfx: "error"
        },
        {
          sceneNumber: 5,
          phase: "JADI",
          mcPose: "explaining",
          mcPlacement: "presenter-left",
          componentLabel: "SOLUSI #2: STATOR PELAT TIPIS & KAPASITOR 1,5 µF",
          narration:
            "[JADI] susun [pelat besi tipis] stator, masukkan rotor aluminium, lalu pasang [kapasitor 1,5 mikrofarad] biar medan magnetnya [muter sempurna]!",
          highlightWords: ["pelat besi tipis", "kapasitor 1,5 mikrofarad", "muter sempurna"],
          visualPrompt: "AC motor wired with white 1.5uF capacitor",
          sfx: "ding"
        },
        {
          sceneNumber: 6,
          phase: "CLIMAX",
          mcPose: "eureka",
          mcPlacement: "hero",
          componentLabel: "FINAL: TOMBOL SPEED 1-2-3 & GIGI CACING",
          narration:
            "Tinggal tambah [tombol 1-2-3] dan [gigi cacing] biar bisa geleng kiri-kanan. [SELAMAT!] Sekarang lu ngerti kenapa kapasitor lemah bikin kipas macet. Mau gw bedah mesin apa lagi? Tulis di komentar!",
          highlightWords: ["tombol 1-2-3", "gigi cacing", "SELAMAT!"],
          visualPrompt: "Complete electric fan cutaway with worm gear",
          sfx: "victory"
        }
      ]
    };
  }

  if (lower.includes("sawah") || lower.includes("minapadi") || lower.includes("padi")) {
    return {
      title: "Rahasia Minapadi: Panen Ikan & Padi Sekaligus Ala Raja Iblis",
      topic,
      hookFormula: "Hook Kontras -> TAPI -> JADI -> SELAMAT!",
      scenes: [
        {
          sceneNumber: 1,
          phase: "HOOK",
          mcPose: "default",
          mcPlacement: "hero",
          componentLabel: "FENOMENA: PANEN IKAN DI TENGAH SAWAH!",
          narration:
            "Manusia awam pasti heran lihat petani ini [memanen ikan] berember-ember langsung dari tengah [sawah padinya] sendiri!",
          highlightWords: ["memanen ikan", "sawah padinya"],
          visualPrompt: "Farmer harvesting fish in middle of golden rice field",
          sfx: "whoosh"
        },
        {
          sceneNumber: 2,
          phase: "TAPI",
          mcPose: "sarcastic",
          mcPlacement: "presenter-right",
          componentLabel: "SKEPTIS AWAM: 'PADIMU HABIS DIMAKAN IKAN!'",
          narration:
            "Pas bibit ikan dilepas ke sawah muda, tetangga langsung nyinyir: [TAPI] nanti padimu [habis dimakan ikan]!",
          highlightWords: ["TAPI", "habis dimakan ikan"],
          visualPrompt: "Skeptical neighbor pointing at rice field with fish fry",
          sfx: "error"
        },
        {
          sceneNumber: 3,
          phase: "JADI",
          mcPose: "explaining",
          mcPlacement: "presenter-left",
          componentLabel: "MEKANISME #1: IKAN MEMANGSA HAMA & CABUT GULMA",
          narration:
            "Mereka nggak paham ekologi! [JADI] ikan menyenggol batang padi sampai [serangga hama] jatuh dan dimakan, sementara gerakan ikan mencabut [rumput liar]!",
          highlightWords: ["JADI", "serangga hama", "rumput liar"],
          visualPrompt: "Fish eating falling rice pests underwater",
          sfx: "pop"
        },
        {
          sceneNumber: 4,
          phase: "CLIMAX",
          mcPose: "eureka",
          mcPlacement: "hero",
          componentLabel: "HASIL RISET: HEMAT OBAT HAMA 2/3 & PANEN DOBEL!",
          narration:
            "Kotoran ikannya jadi [pupuk alami] padi, dan obat hama hemat [dua pertiga]! [SELAMAT!] Teknik Minapadi udah terbukti ribuan tahun. Mau gw bedah ilmu apa lagi? Tulis di komentar!",
          highlightWords: ["pupuk alami", "dua pertiga", "SELAMAT!"],
          visualPrompt: "Double harvest of rice mounds and baskets of fish",
          sfx: "victory"
        }
      ]
    };
  }

  // Dynamic research-backed script builder for ANY custom prompt!
  const cleanTopic = extractTopicFromPrompt(topic);
  const fact1 = researchData?.summaryFacts?.[0]
    ? researchData.summaryFacts[0].split(".")[0]
    : `${cleanTopic} bekerja dengan prinsip keseimbangan komponen dan aliran energi`;
  const fact2 = researchData?.summaryFacts?.[1]
    ? researchData.summaryFacts[1].split(".")[0]
    : `komponen inti pada ${cleanTopic} butuh kontrol yang presisi agar tidak cepat rusak`;

  return {
    title: `Bedah Tuntas: ${cleanTopic} Ala Raja Iblis`,
    topic: cleanTopic,
    hookFormula: "Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!",
    scenes: [
      {
        sceneNumber: 1,
        phase: "HOOK",
        mcPose: "default",
        mcPlacement: "hero",
        componentLabel: `PERCOBAAN 01: ${cleanTopic.toUpperCase().slice(0, 36)}`,
        narration: `Manusia masih banyak yang salah paham soal [${cleanTopic}]. Kelihatannya gampang kalau cuma dirakit asal-asalan dari luar, kan?`,
        highlightWords: [cleanTopic],
        visualPrompt: `3D isometric educational cutaway diagram of ${cleanTopic} initial setup`,
        sfx: "whoosh"
      },
      {
        sceneNumber: 2,
        phase: "TAPI",
        mcPose: "sarcastic",
        mcPlacement: "presenter-right",
        componentLabel: "MASALAH #1: GAGAL KARENA TANPA HITUNGAN!",
        narration: `[TAPI] kalau langsung dijalankan mentah tanpa paham prinsipnya, [${cleanTopic}] ini langsung [bermasalah] dan kinerjanya [anjlok total]!`,
        highlightWords: ["TAPI", cleanTopic, "anjlok total"],
        visualPrompt: `3D engineering cutaway of ${cleanTopic} failing with red warning signs`,
        sfx: "error"
      },
      {
        sceneNumber: 3,
        phase: "JADI",
        mcPose: "explaining",
        mcPlacement: "presenter-left",
        componentLabel: "FAKTA RISET & KOMPONEN INTI",
        narration: `[JADI] berdasarkan sains, kuncinya ada di sini: ${fact1}. Bagian [komponen inti] ini wajib disusun dengan [jalur sirkulasi] yang tepat.`,
        highlightWords: ["JADI", "komponen inti", "jalur sirkulasi"],
        visualPrompt: `3D technical diagram highlighting core mechanism of ${cleanTopic} with glowing blue flow lines`,
        sfx: "pop"
      },
      {
        sceneNumber: 4,
        phase: "TAPI",
        mcPose: "sarcastic",
        mcPlacement: "presenter-right",
        componentLabel: "MASALAH #2: BEBAN BERLEBIH & TIDAK STABIL!",
        narration: `[TAPI] begitu dipakai terus-menerus, beban di dalam sistem [menumpuk] dan bikin hasilnya [tidak stabil] kalau dibiarkan begitu saja!`,
        highlightWords: ["TAPI", "menumpuk", "tidak stabil"],
        visualPrompt: `3D diagram of ${cleanTopic} overheating and pressure buildup`,
        sfx: "error"
      },
      {
        sceneNumber: 5,
        phase: "JADI",
        mcPose: "explaining",
        mcPlacement: "presenter-left",
        componentLabel: "SOLUSI #2: STABILISATOR & PENGAMAN SISTEM",
        narration: `[JADI] pasang [mekanisme pengaman] dan kontrol penyeimbang. Ingat prinsipnya: ${fact2}.`,
        highlightWords: ["JADI", "mekanisme pengaman"],
        visualPrompt: `3D engineering diagram of ${cleanTopic} stabilized with regulator and green efficiency arrows`,
        sfx: "ding"
      },
      {
        sceneNumber: 6,
        phase: "CLIMAX",
        mcPose: "eureka",
        mcPlacement: "hero",
        componentLabel: "HASIL AKHIR: SISTEM 100% OPTIMAL!",
        narration: `[SELAMAT!] Sekarang [${cleanTopic}] bekerja penuh dan efisien tanpa drama. Habis ini mau gw bedah topik apa lagi? [Tulis di komentar]!`,
        highlightWords: ["SELAMAT!", cleanTopic, "Tulis di komentar"],
        visualPrompt: `3D isometric completed optimal ${cleanTopic} glowing with victory seal`,
        sfx: "victory"
      }
    ]
  };
}

function enrichScript(scriptObj, researchData = null) {
  scriptObj.character = CHARACTER_BIBLE;
  scriptObj.research = researchData;
  const overallTheme = detectVisualTheme(
    `${scriptObj.topic || ""} ${scriptObj.title || ""} ${(scriptObj.scenes || [])
      .map((s) => s.narration)
      .join(" ")}`
  );

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
    const mcPlacement =
      sc.mcPlacement ||
      (phase === "HOOK" || phase === "CLIMAX"
        ? "hero"
        : phase === "TAPI"
        ? "presenter-right"
        : "presenter-left");
    const plainNarration = (sc.narration || "").replace(/\[([^\]]+)\]/g, "$1");
    const subtitlePhrases = buildSubtitleChunks(sc.narration || "", sc.highlightWords || []);
    return {
      ...sc,
      sceneNumber: idx + 1,
      phase,
      mcPose,
      mcPlacement,
      visualTheme: sc.visualTheme || overallTheme,
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
  const cleanKey = apiKey.trim();
  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
  };

  // Try standard Gemini AI Studio endpoint first, then Vertex Express if key starts with AQ.
  const endpoints = cleanKey.startsWith("AQ.")
    ? [
        `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          cleanKey
        )}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          cleanKey
        )}`
      ]
    : [
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          cleanKey
        )}`
      ];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });
      if (resp.ok) {
        const data = await resp.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.scenes?.length >= 4) return parsed;
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
      "Pola Edutainment Step-by-Step: Langsung aksi di detik 0:00 -> Masalah ('TAPI...') -> Solusi Ilmiah ('JADI...') -> Loop 3-4 tahap ('SELAMAT!') + Subtitle kotak kuning kata kunci."
  };
}

export async function generateScriptFromPrompt({
  prompt,
  referenceUrl = "",
  geminiApiKey = ""
}) {
  const cleanTopic = extractTopicFromPrompt(prompt);

  // Run TikTok reference lookup (if provided) and live online research in parallel
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

  const systemInstruction = `Kamu adalah penulis skrip video edukasi pendek TikTok (60-80 detik) dengan MC utama "Maou Vaelen" — Raja Iblis Ganteng bergaya Modern Overlord.
GAYA BAHASA MC:
- Suara cowok, kalem, elegan, blak-blakan, asik kayak temen nongkrong tapi berwibawa ("bos besar"), sedikit arogan/sarkas ke kesalahan manusia ("Manusia masih aja ngira...").
- MC adalah pembawa acara yang MENJELASKAN mekanisme ilmiah/teknik secara akurat berdasarkan fakta riset, BUKAN NPC.
- WAJIB gunakan struktur @untabiru5:
  1. Detik 0:00 langsung masuk percobaan pertama (HOOK).
  2. Muncul masalah nyata diawali "[TAPI]" (mcPose: "sarcastic").
  3. Penjelasan ilmiah & komponen solusi nyata diawali "[JADI]" (mcPose: "explaining").
  4. Ulangi "[TAPI]" -> "[JADI]" 2-3 kali hingga sistem sempurna.
  5. Tutup dengan "[SELAMAT!]" + CTA komentar (mcPose: "eureka").
- Bungkus maksimal 2-3 kata kunci penting per scene dengan kurung siku [kata kunci] untuk kotak kuning subtitle.

Kembalikan HANYA JSON valid:
{
  "title": "Judul Video Singkat",
  "topic": "${cleanTopic}",
  "hookFormula": "Trial -> TAPI (Masalah) -> JADI (Solusi Ilmiah) -> SELAMAT!",
  "scenes": [
    {
      "sceneNumber": 1,
      "phase": "HOOK" | "TAPI" | "JADI" | "CLIMAX",
      "mcPose": "default" | "sarcastic" | "explaining" | "eureka",
      "mcPlacement": "hero" | "presenter-right" | "presenter-left",
      "componentLabel": "LABEL TEKNIS SINGKAT",
      "narration": "Narasi MC dengan [kata kunci] di kurung siku",
      "highlightWords": ["kata kunci"],
      "visualPrompt": "English 3D isometric cutaway educational illustration prompt of this step",
      "sfx": "whoosh" | "error" | "pop" | "ding" | "victory"
    }
  ]
}`;

  const userPrompt = `Prompt user: "${prompt}"\nTopik inti: "${cleanTopic}"\n${refContext}\n${factsBlock}\nBuat 6-8 scene edukasi step-by-step yang sangat konkret dan akurat secara teknis/ilmiah.`;

  const effectiveGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY || "";
  if (effectiveGeminiKey) {
    const geminiResult = await callGeminiWithKey(
      effectiveGeminiKey,
      systemInstruction,
      userPrompt
    );
    if (geminiResult) {
      const enriched = enrichScript(geminiResult, researchData);
      enriched.referenceMetadata = refMeta;
      enriched.aiEngine = "gemini-2.5-flash + web-research";
      return enriched;
    }
  }

  // Try free LLM endpoint for custom topics (skip if we already have rich specialized preset for Arwana/Kipas/Minapadi)
  const lower = `${cleanTopic} ${refContext}`.toLowerCase();
  const hasDeepPreset =
    lower.includes("arwana") ||
    lower.includes("aquarium") ||
    lower.includes("akuarium") ||
    lower.includes("kipas") ||
    lower.includes("minapadi");

  if (!hasDeepPreset) {
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
        signal: AbortSignal.timeout(14000)
      });
      if (resp.ok) {
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.scenes?.length >= 4) {
            const enriched = enrichScript(parsed, researchData);
            enriched.referenceMetadata = refMeta;
            enriched.aiEngine = "pollinations-llm + web-research";
            return enriched;
          }
        }
      }
    } catch {}
  }

  const fallback = enrichScript(
    buildStructuredScript(cleanTopic, refContext, researchData),
    researchData
  );
  fallback.referenceMetadata = refMeta;
  fallback.aiEngine = hasDeepPreset
    ? "maou-verified-blueprint + web-research"
    : "maou-research-synthesizer";
  return fallback;
}

export async function synthesizeSpeechStateless({
  text,
  voiceId = CHARACTER_BIBLE.defaultVoiceId,
  elevenlabsApiKey = ""
}) {
  const cleanText = (text || "").replace(/\[([^\]]+)\]/g, "$1").trim();
  if (!cleanText) throw new Error("Teks voiceover kosong.");

  const effectiveVoiceId = voiceId || CHARACTER_BIBLE.defaultVoiceId;
  const effectiveElKey = elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || "";
  let elevenlabsError = null;

  // 1. Primary: ElevenLabs API
  if (effectiveElKey) {
    try {
      const elResp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
          effectiveVoiceId
        )}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": effectiveElKey.trim(),
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
        if (buf.length > 500) {
          return {
            audioBase64: buf.toString("base64"),
            mimeType: "audio/mpeg",
            provider: "elevenlabs",
            voiceId: effectiveVoiceId
          };
        }
      } else {
        const errBody = await elResp.text().catch(() => "");
        try {
          const parsedErr = JSON.parse(errBody);
          elevenlabsError = parsedErr?.detail?.message || `HTTP ${elResp.status}`;
        } catch {
          elevenlabsError = `HTTP ${elResp.status}`;
        }
        console.error("ElevenLabs TTS error:", elResp.status, elevenlabsError);
      }
    } catch (e) {
      elevenlabsError = e.message;
      console.error("ElevenLabs TTS exception:", e.message);
    }
  }

  // 2. Stateless Free Fallback: Chunked Indonesian TTS MP3 returned as base64 (pitched down to male baritone in client)
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
