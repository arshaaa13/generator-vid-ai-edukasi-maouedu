// MaouEdu AI — 1-Prompt Auto-Research & Gaya B Video Generator Studio (Vercel Ready)

const canvas = document.getElementById("videoCanvas");
const ctx = canvas.getContext("2d");

// Load Locked MC Raja Iblis Character Asset
const mcImage = new Image();
mcImage.crossOrigin = "anonymous";
mcImage.src = "/assets/mc_default.jpg";

// Studio State
let currentScript = null;
let activeSceneIndex = 0;
let activePhraseIndex = 0;
let isPlaying = false;
let stage3d = null;
let stage3dReady = false;
let audioCtx = null;
let analyserNode = null;
let analyserData = null;
let smoothedVoiceEnergy = 0;
let sceneEnterTimestamp = performance.now();
let activeAudioSource = null;
let bgmInterval = null;
let serverConfig = {
  elevenlabsVoiceId: "cPoqAvGWCPfCfyPMwe4z",
  hasElevenlabsEnvKey: false,
  hasGeminiEnvKey: false
};

const sceneAudioBuffers = new Map();
const sceneBgImages = new Map();

// UI Elements
const simplePromptInput = document.getElementById("simplePromptInput");
const autoBuildVideoBtn = document.getElementById("autoBuildVideoBtn");
const pipelineBar = document.getElementById("pipelineBar");
const stepResearch = document.getElementById("stepResearch");
const stepScript = document.getElementById("stepScript");
const stepVoice = document.getElementById("stepVoice");
const stepReady = document.getElementById("stepReady");

const researchResultsBox = document.getElementById("researchResultsBox");
const aiEngineBadge = document.getElementById("aiEngineBadge");
const tiktokUrlInput = document.getElementById("tiktokUrlInput");
const analyzeTiktokBtn = document.getElementById("analyzeTiktokBtn");
const tiktokAnalysisBox = document.getElementById("tiktokAnalysisBox");
const exportVideoBtn = document.getElementById("exportVideoBtn");
const exportProgressBox = document.getElementById("exportProgressBox");
const exportProgressFill = document.getElementById("exportProgressFill");
const exportProgressText = document.getElementById("exportProgressText");
const sceneListContainer = document.getElementById("sceneListContainer");
const videoTitleDisplay = document.getElementById("videoTitleDisplay");
const sceneCounterDisplay = document.getElementById("sceneCounterDisplay");
const activePoseBadge = document.getElementById("activePoseBadge");
const playFullVideoBtn = document.getElementById("playFullVideoBtn");
const playSceneBtn = document.getElementById("playSceneBtn");
const prevSceneBtn = document.getElementById("prevSceneBtn");
const nextSceneBtn = document.getElementById("nextSceneBtn");
const addSceneBtn = document.getElementById("addSceneBtn");

// Toggles
const toggle3dMode = document.getElementById("toggle3dMode");
const toggleMcOverlay = document.getElementById("toggleMcOverlay");
const toggleYellowSubtitles = document.getElementById("toggleYellowSubtitles");
const toggleSfx = document.getElementById("toggleSfx");
const toggleBgm = document.getElementById("toggleBgm");
const toggleAiBgImage = document.getElementById("toggleAiBgImage");

// Local browser settings (never sent to GitHub)
function getLocalKeys() {
  return {
    elevenlabsVoiceId:
      localStorage.getItem("maou_el_voice") || serverConfig.elevenlabsVoiceId || "cPoqAvGWCPfCfyPMwe4z",
    elevenlabsApiKey: localStorage.getItem("maou_el_key") || "",
    geminiApiKey: localStorage.getItem("maou_gemini_key") || ""
  };
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (!analyserNode) {
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserData = new Uint8Array(analyserNode.frequencyBinCount);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function getLiveVoiceEnergy() {
  if (!isPlaying || !analyserNode || !analyserData) {
    smoothedVoiceEnergy *= 0.85;
    return smoothedVoiceEnergy;
  }
  analyserNode.getByteFrequencyData(analyserData);
  let sum = 0;
  // Focus on human speech frequencies (bins 2..28)
  for (let i = 2; i < 28; i++) sum += analyserData[i];
  const raw = Math.min(1, sum / (26 * 135));
  smoothedVoiceEnergy = smoothedVoiceEnergy * 0.65 + raw * 0.35;
  return smoothedVoiceEnergy;
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function setPipelineState(stage) {
  pipelineBar.classList.remove("hidden");
  const stages = [stepResearch, stepScript, stepVoice, stepReady];
  const order = { research: 0, script: 1, voice: 2, ready: 3, allDone: 4 };
  const activeIdx = order[stage] ?? 0;

  stages.forEach((el, idx) => {
    el.classList.remove("active", "done");
    if (idx < activeIdx) el.classList.add("done");
    else if (idx === activeIdx) el.classList.add("active");
  });
  if (stage === "allDone") {
    stages.forEach((el) => {
      el.classList.remove("active");
      el.classList.add("done");
    });
  }
}

// Procedural Sound Effects
function playProceduralSfx(type, destNode = null) {
  if (!toggleSfx.checked) return;
  try {
    const actx = getAudioContext();
    const target = destNode || actx.destination;
    const now = actx.currentTime;

    if (type === "error") {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(target);
      osc.start(now);
      osc.stop(now + 0.31);
    } else if (type === "pop") {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.09);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(target);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "ding") {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1318.5, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(gain);
      gain.connect(target);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "victory") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.14, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.5);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.52);
      });
    } else {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(target);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch {}
}

function startBgm(destNode = null) {
  stopBgm();
  if (!toggleBgm.checked) return;
  const actx = getAudioContext();
  const target = destNode || actx.destination;
  const notes = [110, 130.81, 146.83, 130.81, 98, 110, 164.81, 146.83];
  let step = 0;

  bgmInterval = setInterval(() => {
    if (!isPlaying || !toggleBgm.checked) return;
    const now = actx.currentTime;
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(notes[step % notes.length], now);
    gain.gain.setValueAtTime(0.032, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(target);
    osc.start(now);
    osc.stop(now + 0.36);
    step++;
  }, 380);
}

function stopBgm() {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}

function parseSubtitlePhrasesClient(narration) {
  const tokens = [];
  const regex = /\[([^\]]+)\]|(\S+)/g;
  let m;
  while ((m = regex.exec(narration)) !== null) {
    if (m[1]) {
      tokens.push({ text: m[1], highlight: true });
    } else if (m[2]) {
      const clean = m[2];
      const auto = /^(TAPI,?|JADI,?|SELAMAT!?)$/i.test(clean);
      tokens.push({ text: clean, highlight: auto });
    }
  }
  const phrases = [];
  let cur = [];
  for (let i = 0; i < tokens.length; i++) {
    cur.push(tokens[i]);
    if (/[.!?,;:]$/.test(tokens[i].text) || cur.length >= 4 || i === tokens.length - 1) {
      phrases.push(cur);
      cur = [];
    }
  }
  return phrases.length ? phrases : [[{ text: narration, highlight: false }]];
}

// ============================================================================
// 1-PROMPT AUTONOMOUS PIPELINE (Research -> Script -> Male Voice -> Auto-Play)
// ============================================================================
async function runAutonomousPromptBuild(promptText, autoPlayAfter = true) {
  const cleanPrompt = (promptText || simplePromptInput.value).trim();
  if (!cleanPrompt) return;

  stopPlayback();
  autoBuildVideoBtn.disabled = true;
  autoBuildVideoBtn.textContent = "⏳ Sedang Riset & Bikin Video...";
  setPipelineState("research");

  try {
    const keys = getLocalKeys();
    const refUrl = tiktokUrlInput.value.trim();

    // 1 & 2: Backend Autonomous Online Research + Script Generation
    const resp = await fetch("/api/research-and-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: cleanPrompt,
        referenceUrl: refUrl,
        geminiApiKey: keys.geminiApiKey
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || "Gagal membuat video.");

    setPipelineState("script");
    currentScript = data;
    activeSceneIndex = 0;
    activePhraseIndex = 0;
    sceneAudioBuffers.clear();
    sceneBgImages.clear();

    videoTitleDisplay.textContent = currentScript.title;
    aiEngineBadge.textContent = currentScript.aiEngine || "Auto-Research";
    renderResearchBox(currentScript.research);
    if (currentScript.referenceMetadata) showTikTokAnalysis(currentScript.referenceMetadata);
    renderSceneList();
    updateActiveSceneUI();

    if (toggleAiBgImage.checked) preloadAiSceneImages();

    // 3: Generate all male voiceovers
    setPipelineState("voice");
    for (let i = 0; i < currentScript.scenes.length; i++) {
      autoBuildVideoBtn.textContent = `🎙️ Rekam Suara Scene ${i + 1}/${currentScript.scenes.length}...`;
      await ensureSceneAudio(i);
    }

    setPipelineState("allDone");
    autoBuildVideoBtn.textContent = "✨ Buat Video Otomatis";
    autoBuildVideoBtn.disabled = false;

    if (autoPlayAfter) {
      playFullVideo();
    }
  } catch (e) {
    alert("Terjadi kendala saat membuat video: " + e.message);
    autoBuildVideoBtn.textContent = "✨ Buat Video Otomatis";
    autoBuildVideoBtn.disabled = false;
  }
}

function renderResearchBox(research) {
  if (!research || (!research.summaryFacts?.length && !research.sources?.length)) {
    researchResultsBox.innerHTML = `
      <div>🔍 Topik diproses dengan <strong>MaouEdu Science Blueprint</strong> (formula Trial → TAPI → JADI → SELAMAT!).</div>
    `;
    return;
  }

  const factsHtml = (research.summaryFacts || [])
    .slice(0, 3)
    .map((f) => `<div>• ${f.slice(0, 175)}${f.length > 175 ? "..." : ""}</div>`)
    .join("");

  const linksHtml = (research.sources || [])
    .slice(0, 3)
    .map(
      (s) =>
        `<a class="research-source-link" href="${s.url}" target="_blank" rel="noreferrer">📄 ${s.title}</a>`
    )
    .join(" • ");

  researchResultsBox.innerHTML = `
    <div><strong>Kata Kunci Riset:</strong> <code>${research.searchedQuery}</code></div>
    ${factsHtml}
    ${linksHtml ? `<div style="margin-top:4px;"><strong>Sumber:</strong> ${linksHtml}</div>` : ""}
  `;
}

function showTikTokAnalysis(meta) {
  tiktokAnalysisBox.classList.remove("hidden");
  const views = meta.stats?.views ? Number(meta.stats.views).toLocaleString("id-ID") : "-";
  const likes = meta.stats?.likes ? Number(meta.stats.likes).toLocaleString("id-ID") : "-";
  tiktokAnalysisBox.innerHTML = `
    <div><strong>✅ Referensi:</strong> "${meta.title}" oleh <strong>@${meta.author?.uniqueId || "kreator"}</strong></div>
    <div>📊 <strong>${views}</strong> views • ❤️ <strong>${likes}</strong> likes</div>
  `;
}

function preloadAiSceneImages() {
  if (!currentScript?.scenes) return;
  currentScript.scenes.forEach((sc, idx) => {
    if (sceneBgImages.has(idx)) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    const prompt = encodeURIComponent(
      `${sc.visualPrompt}, 3D isometric educational cutaway illustration, high contrast, vertical 9:16`
    );
    img.src = `https://image.pollinations.ai/prompt/${prompt}?width=540&height=960&nologo=true&seed=${idx + 101}`;
    img.onload = () => sceneBgImages.set(idx, img);
  });
}

toggleAiBgImage.addEventListener("change", () => {
  if (toggleAiBgImage.checked) preloadAiSceneImages();
});

// Render Storyboard Scene Cards
function renderSceneList() {
  sceneListContainer.innerHTML = "";
  if (!currentScript?.scenes) return;

  currentScript.scenes.forEach((scene, index) => {
    const card = document.createElement("div");
    card.className = `scene-card ${index === activeSceneIndex ? "active" : ""}`;
    const hasAudio = sceneAudioBuffers.has(index);

    card.innerHTML = `
      <div class="scene-card-top">
        <span class="scene-num">SCENE #${index + 1}</span>
        <span class="phase-badge phase-${scene.phase}">${scene.phase}</span>
      </div>
      <div class="scene-controls-row">
        <select class="pose-select" data-idx="${index}">
          <option value="default" ${scene.mcPose === "default" ? "selected" : ""}>MC: Default Smirk</option>
          <option value="sarcastic" ${scene.mcPose === "sarcastic" ? "selected" : ""}>MC: Sarkas (TAPI...)</option>
          <option value="explaining" ${scene.mcPose === "explaining" ? "selected" : ""}>MC: Menjelaskan (JADI...)</option>
          <option value="eureka" ${scene.mcPose === "eureka" ? "selected" : ""}>MC: Bos Besar (SELAMAT!)</option>
        </select>
        <input
          type="text"
          class="scene-label-input"
          data-idx="${index}"
          value="${scene.componentLabel || ""}"
          placeholder="Label Komponen..."
        />
      </div>
      <textarea class="scene-narration-input" rows="3" data-idx="${index}">${scene.narration}</textarea>
      <div class="scene-card-footer">
        <span class="audio-status ${hasAudio ? "ready" : ""}" id="audioStatus_${index}">
          ${hasAudio ? "✅ Voiceover Cowok Siap" : "⚪ Belum direkam"}
        </span>
        <button class="btn btn-secondary btn-sm play-single-btn" data-idx="${index}">🔊 Tes Scene</button>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(e.target.tagName)) return;
      activeSceneIndex = index;
      activePhraseIndex = 0;
      updateActiveSceneUI();
    });

    sceneListContainer.appendChild(card);
  });

  document.querySelectorAll(".pose-select").forEach((sel) => {
    sel.addEventListener("change", (e) => {
      const idx = Number(e.target.dataset.idx);
      currentScript.scenes[idx].mcPose = e.target.value;
      activeSceneIndex = idx;
      updateActiveSceneUI();
    });
  });

  document.querySelectorAll(".scene-label-input").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const idx = Number(e.target.dataset.idx);
      currentScript.scenes[idx].componentLabel = e.target.value;
    });
  });

  document.querySelectorAll(".scene-narration-input").forEach((ta) => {
    ta.addEventListener("input", (e) => {
      const idx = Number(e.target.dataset.idx);
      const val = e.target.value;
      currentScript.scenes[idx].narration = val;
      currentScript.scenes[idx].plainNarration = val.replace(/\[([^\]]+)\]/g, "$1");
      currentScript.scenes[idx].subtitlePhrases = parseSubtitlePhrasesClient(val);
      sceneAudioBuffers.delete(idx);
      const st = document.getElementById(`audioStatus_${idx}`);
      if (st) {
        st.textContent = "⚪ Teks berubah (klik Tes Scene)";
        st.classList.remove("ready");
      }
    });
  });

  document.querySelectorAll(".play-single-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      await playSingleScene(idx);
    });
  });
}

function updateActiveSceneUI() {
  if (!currentScript?.scenes?.length) return;
  const sc = currentScript.scenes[activeSceneIndex];
  sceneCounterDisplay.textContent = `Scene ${activeSceneIndex + 1} / ${currentScript.scenes.length} • ${sc.phase}`;
  activePoseBadge.textContent = `MC Pose: ${(sc.mcPose || "default").toUpperCase()}`;

  document.querySelectorAll(".scene-card").forEach((el, idx) => {
    el.classList.toggle("active", idx === activeSceneIndex);
  });
}

async function ensureSceneAudio(index) {
  if (sceneAudioBuffers.has(index)) return sceneAudioBuffers.get(index);
  const scene = currentScript.scenes[index];
  const st = document.getElementById(`audioStatus_${index}`);
  if (st) st.textContent = "⏳ Rekam suara cowok...";

  const keys = getLocalKeys();
  const resp = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: scene.narration,
      voiceId: keys.elevenlabsVoiceId,
      elevenlabsApiKey: keys.elevenlabsApiKey
    })
  });
  const data = await resp.json();

  if (data.audioBase64) {
    const arrayBuf = base64ToArrayBuffer(data.audioBase64);
    const actx = getAudioContext();
    const decoded = await actx.decodeAudioData(arrayBuf);
    const entry = {
      buffer: decoded,
      provider: data.provider,
      playbackRate: data.provider === "elevenlabs" ? 1.0 : 0.9
    };
    sceneAudioBuffers.set(index, entry);
    if (st) {
      if (data.provider === "elevenlabs") {
        st.textContent = data.voiceFallbackNote
          ? `✅ ElevenLabs Deep Male (${data.voiceId} • Free API)`
          : `✅ ElevenLabs (${data.voiceId})`;
        st.classList.add("ready");
      } else if (data.elevenlabsError) {
        st.textContent = `⚠️ ElevenLabs Error (pakai fallback): ${data.elevenlabsError.slice(0, 55)}`;
        st.classList.remove("ready");
      } else {
        st.textContent = "✅ Suara Cowok Bariton Siap";
        st.classList.add("ready");
      }
    }
    const lbl = document.getElementById("voiceStatusLabel");
    const dot = document.getElementById("voiceStatusDot");
    if (data.provider === "elevenlabs") {
      if (dot) dot.classList.add("active-el");
      if (lbl) {
        lbl.textContent = data.voiceFallbackNote
          ? `ElevenLabs Active (${data.voiceId} • Free Premade)`
          : `ElevenLabs Active (${data.voiceId})`;
      }
    } else if (data.elevenlabsError && lbl) {
      lbl.textContent = `ElevenLabs Error: cek izin/kuota API key`;
    }
    return entry;
  }
  return null;
}

async function playSceneAudioAndWait(index, destNode = null) {
  const sc = currentScript.scenes[index];
  if (!sc.subtitlePhrases || !sc.subtitlePhrases.length) {
    sc.subtitlePhrases = parseSubtitlePhrasesClient(sc.narration);
  }

  activePhraseIndex = 0;
  sceneEnterTimestamp = performance.now();
  playProceduralSfx(sc.sfx, destNode);

  let audioEntry = null;
  try {
    audioEntry = await ensureSceneAudio(index);
  } catch {}

  return new Promise((resolve) => {
    const phrases = sc.subtitlePhrases;
    if (audioEntry && audioEntry.buffer) {
      const actx = getAudioContext();
      const source = actx.createBufferSource();
      source.buffer = audioEntry.buffer;
      source.playbackRate.value = audioEntry.playbackRate || 1.0;

      const bassFilter = actx.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 220;
      bassFilter.gain.value = audioEntry.provider === "elevenlabs" ? 3 : 7;

      source.connect(bassFilter);
      if (analyserNode) {
        bassFilter.connect(analyserNode);
        analyserNode.connect(destNode || actx.destination);
      } else {
        bassFilter.connect(destNode || actx.destination);
      }

      if (activeAudioSource) {
        try {
          activeAudioSource.stop();
        } catch {}
      }
      activeAudioSource = source;

      const durationMs = (audioEntry.buffer.duration / source.playbackRate.value) * 1000;
      const phraseIntervalMs = Math.max(400, durationMs / phrases.length);

      const phraseTimer = setInterval(() => {
        if (!isPlaying) {
          clearInterval(phraseTimer);
          return;
        }
        if (activePhraseIndex < phrases.length - 1) activePhraseIndex++;
      }, phraseIntervalMs);

      source.onended = () => {
        clearInterval(phraseTimer);
        resolve();
      };
      source.start(0);
    } else {
      const durationMs = Math.max(3200, phrases.length * 1050);
      const phraseIntervalMs = durationMs / phrases.length;
      const phraseTimer = setInterval(() => {
        if (activePhraseIndex < phrases.length - 1) activePhraseIndex++;
      }, phraseIntervalMs);
      setTimeout(() => {
        clearInterval(phraseTimer);
        resolve();
      }, durationMs);
    }
  });
}

async function playSingleScene(index) {
  stopPlayback();
  isPlaying = true;
  activeSceneIndex = index;
  updateActiveSceneUI();
  await playSceneAudioAndWait(index);
  isPlaying = false;
}

async function playFullVideo(destNode = null) {
  if (!currentScript?.scenes?.length) return;
  stopPlayback();
  isPlaying = true;
  playFullVideoBtn.textContent = "⏹ Hentikan";
  startBgm(destNode);

  for (let i = 0; i < currentScript.scenes.length; i++) {
    if (!isPlaying) break;
    activeSceneIndex = i;
    updateActiveSceneUI();
    await playSceneAudioAndWait(i, destNode);
  }

  stopPlayback();
}

function stopPlayback() {
  isPlaying = false;
  stopBgm();
  if (activeAudioSource) {
    try {
      activeAudioSource.stop();
    } catch {}
    activeAudioSource = null;
  }
  playFullVideoBtn.textContent = "▶ Putar Full Video";
}

// ============================================================================
// 9:16 CANVAS RENDERER — GAYA B
// ============================================================================

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

function drawEducationalDiagramStage(ctx, scene, tSec) {
  const W = canvas.width;
  const H = canvas.height;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  if (scene.phase === "TAPI") {
    bgGrad.addColorStop(0, "#1c0d14");
    bgGrad.addColorStop(0.5, "#141824");
    bgGrad.addColorStop(1, "#090a10");
  } else if (scene.phase === "JADI") {
    bgGrad.addColorStop(0, "#0d1b2a");
    bgGrad.addColorStop(0.5, "#111827");
    bgGrad.addColorStop(1, "#090a10");
  } else if (scene.phase === "CLIMAX") {
    bgGrad.addColorStop(0, "#0b241c");
    bgGrad.addColorStop(0.5, "#111b24");
    bgGrad.addColorStop(1, "#080a0f");
  } else {
    bgGrad.addColorStop(0, "#151326");
    bgGrad.addColorStop(0.5, "#101420");
    bgGrad.addColorStop(1, "#08090d");
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 36) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 36) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }

  if (toggleAiBgImage.checked && sceneBgImages.has(activeSceneIndex)) {
    const aiImg = sceneBgImages.get(activeSceneIndex);
    ctx.save();
    const zoom = 1.02 + Math.sin(tSec * 0.8) * 0.025;
    ctx.translate(W / 2, H * 0.42);
    ctx.scale(zoom, zoom);
    ctx.globalAlpha = 0.85;
    ctx.drawImage(aiImg, -W / 2, -H * 0.42, W, H * 0.84);
    ctx.restore();
  } else {
    drawProceduralEdutainmentScene(ctx, scene, tSec);
  }
}

function drawProceduralEdutainmentScene(ctx, scene, t) {
  const W = canvas.width;
  const stageY = 145;
  const stageH = 440;
  const centerX = W / 2;
  const centerY = stageY + stageH / 2;

  ctx.save();
  drawRoundedRect(ctx, 24, stageY, W - 48, stageH, 20);
  ctx.fillStyle = "rgba(18, 23, 38, 0.9)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle =
    scene.phase === "TAPI"
      ? "rgba(225, 29, 72, 0.7)"
      : scene.phase === "JADI"
      ? "rgba(245, 158, 11, 0.7)"
      : "rgba(16, 185, 129, 0.7)";
  ctx.stroke();

  const textContext = `${currentScript?.topic || ""} ${scene.narration || ""} ${
    scene.componentLabel || ""
  }`.toLowerCase();

  if (textContext.includes("aquarium") || textContext.includes("akuarium")) {
    // Dedicated Glass Aquarium + Sump Filter + Heater + Pingpong Ball Simulation!
    const tankX = 62;
    const tankY = stageY + 100;
    const tankW = W - 124;
    const tankH = 195;

    // Tank Lid if scene >= 5
    if (scene.sceneNumber >= 5) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.45)";
      ctx.fillRect(tankX - 6, tankY - 14, tankW + 12, 14);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.strokeRect(tankX - 6, tankY - 14, tankW + 12, 14);
    }

    // Tanning LED Lamp on Climax
    if (scene.sceneNumber >= 7) {
      drawRoundedRect(ctx, centerX - 110, tankY - 38, 220, 14, 6);
      ctx.fillStyle = "#fde047";
      ctx.fill();
      const lightCone = ctx.createLinearGradient(0, tankY - 24, 0, tankY + 90);
      lightCone.addColorStop(0, "rgba(253, 224, 71, 0.25)");
      lightCone.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = lightCone;
      ctx.fillRect(tankX + 10, tankY - 24, tankW - 20, 120);
    }

    // Water Fill (toxic greenish on TAPI chlorine/ammonia, crystal clear cyan on JADI/CLIMAX)
    const isToxic = scene.phase === "TAPI" && (textContext.includes("klorin") || textContext.includes("amonia"));
    ctx.fillStyle = isToxic ? "rgba(101, 163, 13, 0.45)" : "rgba(56, 189, 248, 0.35)";
    ctx.fillRect(tankX + 4, tankY + 22, tankW - 8, tankH - 26);

    // Glass Frame (thick 12mm edges)
    ctx.strokeStyle = "#bae6fd";
    ctx.lineWidth = 5;
    ctx.strokeRect(tankX, tankY, tankW, tankH);

    // Heater 29°C inside right wall
    if (scene.sceneNumber >= 6) {
      drawRoundedRect(ctx, tankX + tankW - 26, tankY + 55, 12, 100, 6);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.fillStyle = scene.sceneNumber >= 7 ? "#ef4444" : "#38bdf8";
      ctx.fillRect(tankX + tankW - 24, tankY + 75, 8, 24);
    }

    // Floating Pingpong Ball on top of water
    if (scene.sceneNumber >= 7 || textContext.includes("pingpong")) {
      const px = tankX + 90 + Math.sin(t * 2) * 14;
      ctx.beginPath();
      ctx.arc(px, tankY + 22, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#fb923c";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Sump Filter Cabinet below tank (scene >= 3)
    if (scene.sceneNumber >= 3) {
      const sumpY = tankY + tankH + 18;
      const sumpH = 95;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(tankX + 15, sumpY, tankW - 30, sumpH);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(tankX + 15, sumpY, tankW - 30, sumpH);

      // 3 Sump Chambers: Filter Wool, Bio-Ring, Return Pump
      const chW = (tankW - 54) / 3;
      const colors = ["#f8fafc", "#f59e0b", "#0284c7"];
      const labels = ["KAPAS", "BIO-RING", "POMPA"];
      for (let c = 0; c < 3; c++) {
        const cx = tankX + 24 + c * (chW + 6);
        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
        ctx.fillRect(cx, sumpY + 12, chW, sumpH - 20);
        ctx.fillStyle = colors[c];
        ctx.fillRect(cx + 8, sumpY + 34, chW - 16, 26);
        ctx.fillStyle = "#fff";
        ctx.font = "800 10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(labels[c], cx + chW / 2, sumpY + sumpH - 10);
      }
    }

    // Hero Red Arowana Swimming inside Glass Aquarium
    const isJumping = textContext.includes("loncat");
    const fx = centerX + Math.sin(t * 1.6) * 85;
    const fy = isJumping ? tankY - 30 - Math.abs(Math.sin(t * 4)) * 30 : tankY + 95 + Math.cos(t * 2.2) * 14;
    ctx.save();
    ctx.translate(fx, fy);
    if (isJumping) ctx.rotate(-0.6);
    else if (Math.cos(t * 1.6) < 0) ctx.scale(-1, 1);

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.ellipse(0, 0, 56, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(-52, 0);
    ctx.lineTo(-74, -15);
    ctx.lineTo(-74, 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(38, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (textContext.includes("arwana") || textContext.includes("kolam")) {
    // 3D Cross-Section Dirt/Brick Pond & Trickle Filter
    const pondX = 68;
    const pondY = stageY + 115;
    const pondW = W - 136;
    const pondH = 235;

    drawRoundedRect(ctx, pondX - 24, pondY - 10, pondW + 48, pondH + 55, 14);
    ctx.fillStyle = "#6b4423";
    ctx.fill();
    ctx.fillStyle = "#4d9c38";
    ctx.fillRect(pondX - 24, pondY - 16, pondW + 48, 14);

    if (scene.sceneNumber >= 3) {
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(pondX - 8, pondY, 12, pondH);
      ctx.fillRect(pondX + pondW - 4, pondY, 12, pondH);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(pondX, pondY, pondW, pondH);
    }

    const isMurky =
      scene.phase === "TAPI" &&
      (textContext.includes("luruh") || textContext.includes("keruh") || textContext.includes("kotoran"));
    ctx.fillStyle = isMurky ? "rgba(120, 82, 48, 0.92)" : "rgba(56, 189, 248, 0.72)";
    ctx.fillRect(pondX + 4, pondY + 18, pondW - 8, pondH - 22);

    if (scene.sceneNumber >= 5) {
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3;
      ctx.strokeRect(pondX - 4, pondY - 46, pondW + 8, 46);
    }

    for (let f = 0; f < 4; f++) {
      const fx = pondX + 60 + ((f * 70 + Math.sin(t * 1.8 + f) * 45) % (pondW - 120));
      const fy = pondY + 60 + f * 35 + Math.cos(t * 2 + f) * 8;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (
    textContext.includes("kipas") ||
    textContext.includes("magnet") ||
    textContext.includes("rotor") ||
    textContext.includes("kapasitor")
  ) {
    drawRoundedRect(ctx, 48, stageY + 265, W - 96, 130, 12);
    ctx.fillStyle = "#b4692e";
    ctx.fill();

    const isSpinning = scene.phase === "JADI" || scene.phase === "CLIMAX";
    const isHumming = textContext.includes("berdengung") || scene.phase === "TAPI";
    const shakeX = isHumming ? Math.sin(t * 45) * 4 : 0;

    ctx.save();
    ctx.translate(centerX + shakeX, centerY - 10);
    ctx.beginPath();
    ctx.arc(0, 0, 96, 0, Math.PI * 2);
    ctx.fillStyle = "#475569";
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#94a3b8";
    ctx.stroke();

    for (let a = 0; a < 12; a++) {
      ctx.save();
      ctx.rotate((a / 12) * Math.PI * 2);
      ctx.fillStyle = a % 2 === 0 ? "#d97706" : "#16a34a";
      drawRoundedRect(ctx, -11, -86, 22, 24, 5);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    if (isSpinning) ctx.rotate(t * 6.5);
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    for (let b = 0; b < 3; b++) {
      ctx.save();
      ctx.rotate((b * Math.PI * 2) / 3);
      ctx.fillStyle = "rgba(56, 189, 248, 0.78)";
      ctx.beginPath();
      ctx.ellipse(0, -54, 24, 44, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  } else {
    // Dynamic Researched Concept Flow Diagram for ANY Custom Topic!
    const boxW = W - 96;
    const boxH = 270;
    const bx = 48;
    const by = stageY + 95;

    drawRoundedRect(ctx, bx, by, boxW, boxH, 16);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.stroke();

    const nodeColors =
      scene.phase === "TAPI"
        ? ["#e11d48", "#f43f5e", "#fb7185"]
        : ["#10b981", "#f59e0b", "#38bdf8"];

    const topicWords = (currentScript?.topic || "SISTEM")
      .toUpperCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const stepLabels = [
      topicWords[0] || "INPUT",
      scene.phase === "TAPI" ? "MASALAH" : scene.phase === "JADI" ? "SOLUSI" : "PROSES",
      scene.phase === "CLIMAX" ? "OPTIMAL" : topicWords[1] || "HASIL"
    ];

    for (let i = 0; i < 3; i++) {
      const nx = bx + 78 + i * 142;
      const ny = by + 135 + Math.sin(t * 2.5 + i) * 12;

      if (i < 2) {
        ctx.strokeStyle = nodeColors[i];
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -t * 40;
        ctx.beginPath();
        ctx.moveTo(nx + 40, ny);
        ctx.lineTo(nx + 102, by + 135 + Math.sin(t * 2.5 + i + 1) * 12);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.arc(nx, ny, 42, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(30, 41, 59, 0.96)";
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = nodeColors[i];
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "800 12px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(stepLabels[i].slice(0, 10), nx, ny + 4);
    }
  }

  // Callout Tag
  if (scene.componentLabel) {
    const tagText = `●  ${scene.componentLabel.toUpperCase()}`;
    ctx.font = "800 13.5px 'Plus Jakarta Sans', sans-serif";
    const tw = Math.min(W - 80, ctx.measureText(tagText).width + 28);
    const tx = (W - tw) / 2;
    const ty = stageY + 18;

    drawRoundedRect(ctx, tx, ty, tw, 34, 9);
    ctx.fillStyle = scene.phase === "TAPI" ? "#e11d48" : "#f59e0b";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#090a0f";
    ctx.stroke();

    ctx.fillStyle = scene.phase === "TAPI" ? "#ffffff" : "#090a0f";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tagText, W / 2, ty + 17, tw - 16);
  }

  ctx.restore();
}

function drawMcRajaIblisPresenter(ctx, scene, tSec) {
  if (!toggleMcOverlay.checked || !mcImage.complete || !mcImage.naturalWidth) return;

  const W = canvas.width;
  const voice = getLiveVoiceEnergy();
  const isHero = scene.mcPlacement === "hero" || scene.phase === "HOOK" || scene.phase === "CLIMAX";
  const isRight = scene.mcPlacement !== "presenter-left";
  const elapsedScene = Math.min(1, (performance.now() - sceneEnterTimestamp) / 450);
  const slideEase = 1 - Math.pow(1 - elapsedScene, 3);

  // Dynamic Live2D-style motion: breathing + sway + voice-reactive bounce + phase tilt
  const breathY = Math.sin(tSec * 2.8) * 5.5;
  const swayX = Math.sin(tSec * 1.9) * 5.0;
  const voiceBounceY = -voice * 11;
  const phaseTilt =
    scene.mcPose === "sarcastic"
      ? -0.045 + Math.sin(tSec * 4.5) * 0.018
      : scene.mcPose === "explaining"
      ? 0.035 + Math.sin(tSec * 3.5) * 0.016
      : scene.mcPose === "eureka"
      ? Math.sin(tSec * 5.0) * 0.028
      : Math.sin(tSec * 2.2) * 0.022;

  ctx.save();
  const cardW = isHero ? 226 : 188;
  const cardH = isHero ? 286 : 240;
  const targetX = isHero ? W - cardW - 22 : isRight ? W - cardW - 20 : 20;
  const entryOffset = (1 - slideEase) * (isRight || isHero ? 60 : -60);
  const cardX = targetX + swayX + entryOffset;
  const cardY = (isHero ? 476 : 498) + breathY + voiceBounceY;
  const centerX = cardX + cardW / 2;
  const centerY = cardY + cardH / 2;

  // 1. Rotating Arcane Overlord Magic Circle behind MC during JADI / CLIMAX
  if (scene.mcPose === "explaining" || scene.mcPose === "eureka" || scene.phase === "CLIMAX") {
    ctx.save();
    ctx.translate(centerX, centerY - 12);
    ctx.rotate(tSec * 0.75);
    const circleRadius = (isHero ? 128 : 106) + voice * 12;
    ctx.strokeStyle =
      scene.phase === "CLIMAX" ? "rgba(16, 185, 129, 0.48)" : "rgba(251, 191, 36, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius - 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let p = 0; p < 6; p++) {
      const ang = (p * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * circleRadius, Math.sin(ang) * circleRadius, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fde047";
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Dark Shadow Aura Wisps billowing continuously around shoulders
  for (let w = 0; w < 7; w++) {
    const wx = centerX + Math.sin(tSec * 2.4 + w * 1.15) * (cardW * 0.54);
    const wy = cardY + cardH * 0.48 - ((tSec * 36 + w * 28) % 95) + 40;
    const rad = 24 + Math.sin(tSec * 3.6 + w) * 9 + voice * 14;
    const auraGrad = ctx.createRadialGradient(wx, wy, 2, wx, wy, rad);
    const auraColor =
      scene.mcPose === "sarcastic"
        ? "rgba(225, 29, 72, 0.46)"
        : scene.mcPose === "eureka"
        ? "rgba(245, 158, 11, 0.48)"
        : "rgba(139, 92, 246, 0.42)";
    auraGrad.addColorStop(0, auraColor);
    auraGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(wx, wy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Pointing Energy Laser Beam to Educational Stage when explaining ("JADI...")
  if (scene.mcPose === "explaining" || scene.phase === "JADI") {
    ctx.save();
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.55 + voice * 0.45})`;
    ctx.lineWidth = 3 + voice * 2.5;
    ctx.setLineDash([8, 5]);
    ctx.lineDashOffset = -tSec * 55;
    ctx.beginPath();
    ctx.moveTo(centerX, cardY + 18);
    ctx.lineTo(W / 2, 385);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(W / 2, 385, 6 + Math.sin(tSec * 8) * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#fde047";
    ctx.fill();
    ctx.restore();
  }

  // 4. Tilted & Animated Character Card Transform
  ctx.translate(centerX, centerY);
  ctx.rotate(phaseTilt);
  const punchScale = 1 + voice * 0.055;
  ctx.scale(punchScale, punchScale);
  ctx.translate(-centerX, -centerY);

  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 18);
  ctx.clip();

  // Continuous dynamic camera pan & zoom inside the portrait so character feels alive
  const panX = Math.sin(tSec * 1.4) * 5;
  const panY = Math.cos(tSec * 1.8) * 4 - voice * 5;
  const innerZoom = 1.08 + Math.sin(tSec * 1.1) * 0.03 + voice * 0.05;
  ctx.drawImage(
    mcImage,
    cardX - (cardW * (innerZoom - 1)) / 2 + panX,
    cardY - 8 + panY,
    cardW * innerZoom,
    cardH * 1.15 * innerZoom
  );

  // Subtle crimson eye glint shimmer & broken-left-horn energy flicker
  const glintAlpha = 0.28 + voice * 0.55 + Math.abs(Math.sin(tSec * 4)) * 0.22;
  const hornX = cardX + cardW * 0.67 + panX;
  const hornY = cardY + cardH * 0.16 + panY;
  const hornGrad = ctx.createRadialGradient(hornX, hornY, 1, hornX, hornY, 18 + voice * 12);
  hornGrad.addColorStop(0, `rgba(255, 60, 90, ${glintAlpha})`);
  hornGrad.addColorStop(1, "rgba(255, 0, 40, 0)");
  ctx.fillStyle = hornGrad;
  ctx.beginPath();
  ctx.arc(hornX, hornY, 26, 0, Math.PI * 2);
  ctx.fill();

  // Natural eye-blink micro-shadow every ~3.4 seconds
  const blinkCycle = tSec % 3.4;
  if (blinkCycle > 3.24) {
    ctx.fillStyle = "rgba(12, 10, 20, 0.55)";
    ctx.fillRect(cardX + cardW * 0.28, cardY + cardH * 0.31, cardW * 0.44, 5);
  }

  // Sarcastic Glitch Scanlines on "TAPI..."
  if (scene.mcPose === "sarcastic" && Math.sin(tSec * 18) > 0.75) {
    ctx.fillStyle = "rgba(225, 29, 72, 0.22)";
    ctx.fillRect(cardX, cardY + ((tSec * 160) % cardH), cardW, 6);
  }

  const innerGrad = ctx.createLinearGradient(0, cardY + cardH - 72, 0, cardY + cardH);
  innerGrad.addColorStop(0, "rgba(9, 10, 15, 0)");
  innerGrad.addColorStop(1, "rgba(9, 10, 15, 0.94)");
  ctx.fillStyle = innerGrad;
  ctx.fillRect(cardX, cardY + cardH - 72, cardW, 72);

  // Live Voice Waveform Equalizer Bars inside bottom of MC frame
  if (isPlaying || voice > 0.02) {
    const bars = 13;
    const barW = 4;
    const startBx = centerX - (bars * 7) / 2;
    for (let b = 0; b < bars; b++) {
      const bh = 4 + Math.abs(Math.sin(tSec * 16 + b * 0.9)) * (6 + voice * 22);
      ctx.fillStyle = scene.mcPose === "sarcastic" ? "#fb7185" : "#fbbf24";
      drawRoundedRect(ctx, startBx + b * 7, cardY + cardH - 42 - bh, barW, bh, 2);
      ctx.fill();
    }
  }
  ctx.restore();

  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 18);
  ctx.lineWidth = 3 + voice * 3.5;
  ctx.strokeStyle =
    scene.mcPose === "sarcastic"
      ? "#e11d48"
      : scene.mcPose === "explaining"
      ? "#fbbf24"
      : scene.mcPose === "eureka"
      ? "#10b981"
      : "#a855f7";
  ctx.stroke();

  const reactionMap = {
    default: "👑 MC RAJA IBLIS",
    sarcastic: "😒 TAPI... (SARKAS)",
    explaining: "☝️ JADI BEGINI...",
    eureka: "⚡ OVERLORD SOLVED!"
  };
  const badgeLabel = reactionMap[scene.mcPose] || "👑 MC RAJA IBLIS";
  drawRoundedRect(ctx, cardX + 10, cardY + cardH - 34, cardW - 20, 24, 7);
  ctx.fillStyle = "rgba(15, 18, 28, 0.92)";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "800 10.5px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeLabel, centerX, cardY + cardH - 22);
  ctx.restore();
}

function drawSelamatStamp(ctx, scene, tSec) {
  if (scene.phase !== "CLIMAX" && !/selamat/i.test(scene.narration)) return;
  const W = canvas.width;

  ctx.save();
  ctx.translate(W / 2, 152);
  ctx.rotate(-0.08);
  const scale = 1 + Math.sin(tSec * 5) * 0.03;
  ctx.scale(scale, scale);

  drawRoundedRect(ctx, -125, -28, 250, 56, 10);
  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#10b981";
  ctx.stroke();

  drawRoundedRect(ctx, -117, -21, 234, 42, 6);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#059669";
  ctx.stroke();

  ctx.fillStyle = "#059669";
  ctx.font = "900 28px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SELAMAT!", 0, 2);
  ctx.restore();
}

function drawUntabiruSubtitles(ctx, scene) {
  if (!toggleYellowSubtitles.checked) return;
  const phrases = scene.subtitlePhrases || parseSubtitlePhrasesClient(scene.narration || "");
  const activeTokens = phrases[Math.min(activePhraseIndex, phrases.length - 1)] || [];
  if (!activeTokens.length) return;

  const W = canvas.width;
  const baseY = 825;

  ctx.save();
  ctx.font = "900 27px 'Plus Jakarta Sans', sans-serif";
  ctx.textBaseline = "middle";

  const lines = [];
  let currentLine = [];
  let currentWidth = 0;

  activeTokens.forEach((tok) => {
    const w = ctx.measureText(tok.text).width + (tok.highlight ? 24 : 12);
    if (currentWidth + w > 460 && currentLine.length > 0) {
      lines.push({ tokens: currentLine, totalWidth: currentWidth });
      currentLine = [tok];
      currentWidth = w;
    } else {
      currentLine.push(tok);
      currentWidth += w;
    }
  });
  if (currentLine.length) lines.push({ tokens: currentLine, totalWidth: currentWidth });

  lines.forEach((line, lineIdx) => {
    const y = baseY + (lineIdx - (lines.length - 1) / 2) * 48;
    let cursorX = (W - line.totalWidth) / 2;

    line.tokens.forEach((tok) => {
      const textW = ctx.measureText(tok.text).width;
      const boxW = textW + (tok.highlight ? 20 : 10);

      if (tok.highlight) {
        ctx.save();
        drawRoundedRect(ctx, cursorX, y - 20, boxW, 40, 8);
        ctx.fillStyle = "#090a0f";
        ctx.fill();

        drawRoundedRect(ctx, cursorX - 2, y - 22, boxW, 40, 8);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#090a0f";
        ctx.stroke();

        ctx.fillStyle = "#090a0f";
        ctx.textAlign = "left";
        ctx.fillText(tok.text, cursorX + 8, y - 1);
        ctx.restore();
      } else {
        ctx.save();
        ctx.textAlign = "left";
        ctx.lineWidth = 7;
        ctx.strokeStyle = "#090a0f";
        ctx.lineJoin = "round";
        ctx.strokeText(tok.text, cursorX + 4, y);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(tok.text, cursorX + 4, y);
        ctx.restore();
      }
      cursorX += boxW + 6;
    });
  });

  ctx.restore();
}

function drawTopVideoHeader(ctx, scene) {
  const W = canvas.width;
  ctx.save();
  const phaseColors = {
    HOOK: { bg: "#1d4ed8", text: "⚡ HOOK PEMBUKA" },
    TAPI: { bg: "#e11d48", text: "⚠️ TAPI... (MASALAH)" },
    JADI: { bg: "#d97706", text: "💡 JADI... (SOLUSI ILMIAH)" },
    CLIMAX: { bg: "#059669", text: "🏆 KESIMPULAN AKHIR" }
  };
  const pInfo = phaseColors[scene.phase] || phaseColors.HOOK;

  drawRoundedRect(ctx, 24, 24, 215, 34, 999);
  ctx.fillStyle = pInfo.bg;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#090a0f";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 12.5px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pInfo.text, 24 + 107.5, 41);

  drawRoundedRect(ctx, W - 175, 24, 151, 34, 999);
  ctx.fillStyle = "rgba(15, 18, 28, 0.85)";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
  ctx.stroke();

  ctx.fillStyle = "#fde68a";
  ctx.font = "800 11.5px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("👑 @MaouEdu.ID", W - 100, 41);
  ctx.restore();
}

function draw3dCalloutBadge(ctx, scene) {
  if (!scene.componentLabel) return;
  const W = canvas.width;
  const tagText = `●  ${scene.componentLabel.toUpperCase()}`;
  ctx.save();
  ctx.font = "800 13.5px 'Plus Jakarta Sans', sans-serif";
  const tw = Math.min(W - 44, ctx.measureText(tagText).width + 28);
  const tx = (W - tw) / 2;
  const ty = 72;

  drawRoundedRect(ctx, tx, ty, tw, 34, 10);
  ctx.fillStyle = scene.phase === "TAPI" ? "#e11d48" : scene.phase === "CLIMAX" ? "#10b981" : "#f59e0b";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#090a0f";
  ctx.stroke();

  ctx.fillStyle = scene.phase === "TAPI" ? "#ffffff" : "#090a0f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, W / 2, ty + 17, tw - 16);
  ctx.restore();
}

function init3dEngine() {
  import("/scene3d.js")
    .then(({ Maou3DStage }) => {
      stage3d = new Maou3DStage(canvas.width, canvas.height);
      stage3dReady = true;
    })
    .catch((err) => {
      console.warn("3D WebGL engine unavailable, using 2D fallback:", err);
      stage3dReady = false;
    });
}

function startRenderLoop() {
  init3dEngine();

  function frame(now) {
    const tSec = now / 1000;
    if (currentScript?.scenes?.length) {
      const scene = currentScript.scenes[activeSceneIndex] || currentScript.scenes[0];
      const use3d = Boolean(toggle3dMode?.checked && stage3dReady && stage3d);

      if (use3d) {
        const voice = getLiveVoiceEnergy();
        if (stage3d.mc?.root) {
          stage3d.mc.root.visible = Boolean(toggleMcOverlay.checked);
        }
        stage3d.renderFrame(scene, currentScript.topic || "", tSec, voice, isPlaying);
        ctx.drawImage(stage3d.domElement, 0, 0, canvas.width, canvas.height);

        // Soft bottom cinematic gradient for crisp @untabiru5 yellow-box subtitle contrast
        const subGrad = ctx.createLinearGradient(0, canvas.height - 230, 0, canvas.height);
        subGrad.addColorStop(0, "rgba(9, 10, 15, 0)");
        subGrad.addColorStop(1, "rgba(9, 10, 15, 0.84)");
        ctx.fillStyle = subGrad;
        ctx.fillRect(0, canvas.height - 230, canvas.width, 230);

        drawTopVideoHeader(ctx, scene);
        draw3dCalloutBadge(ctx, scene);
        drawSelamatStamp(ctx, scene, tSec);
        drawUntabiruSubtitles(ctx, scene);
      } else {
        drawEducationalDiagramStage(ctx, scene, tSec);
        drawTopVideoHeader(ctx, scene);
        drawSelamatStamp(ctx, scene, tSec);
        drawMcRajaIblisPresenter(ctx, scene, tSec);
        drawUntabiruSubtitles(ctx, scene);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ============================================================================
// EXPORT / DOWNLOAD 9:16 VIDEO
// ============================================================================
async function exportFullVideo() {
  if (!currentScript?.scenes?.length) return;
  exportVideoBtn.disabled = true;
  exportProgressBox.classList.remove("hidden");
  exportProgressFill.style.width = "10%";
  exportProgressText.textContent = "1/2: Memastikan suara semua scene siap...";

  try {
    for (let i = 0; i < currentScript.scenes.length; i++) {
      exportProgressFill.style.width = `${Math.round(((i + 1) / currentScript.scenes.length) * 40)}%`;
      await ensureSceneAudio(i);
    }

    const actx = getAudioContext();
    const audioDest = actx.createMediaStreamDestination();
    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks()
    ]);

    const mimeCandidates = [
      "video/mp4;codecs=avc1,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm"
    ];
    const selectedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
    const ext = selectedMime.includes("mp4") ? "mp4" : "webm";

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 4500000
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const donePromise = new Promise((resolve) => {
      recorder.onstop = resolve;
    });

    recorder.start(200);
    stopPlayback();
    isPlaying = true;
    startBgm(audioDest);

    for (let i = 0; i < currentScript.scenes.length; i++) {
      if (!isPlaying) break;
      activeSceneIndex = i;
      updateActiveSceneUI();
      exportProgressFill.style.width = `${40 + Math.round(((i + 1) / currentScript.scenes.length) * 60)}%`;
      exportProgressText.textContent = `2/2: Merender Scene ${i + 1} / ${currentScript.scenes.length}...`;
      await playSceneAudioAndWait(i, audioDest);
    }

    stopPlayback();
    recorder.stop();
    await donePromise;

    const blob = new Blob(chunks, { type: selectedMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (currentScript.topic || "maou_edu")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
    a.href = url;
    a.download = `${safeName}_raja_iblis.${ext}`;
    a.click();

    exportProgressFill.style.width = "100%";
    exportProgressText.textContent = `✅ Video selesai di-download (${a.download})!`;
  } catch (e) {
    alert("Gagal render video: " + e.message);
  } finally {
    exportVideoBtn.disabled = false;
  }
}

// ============================================================================
// INIT & EVENTS
// ============================================================================
async function initStudio() {
  try {
    const cfgResp = await fetch("/api/config");
    serverConfig = await cfgResp.json();
    const keys = getLocalKeys();
    document.getElementById("elevenlabsVoiceIdInput").value = keys.elevenlabsVoiceId;
    document.getElementById("elevenlabsApiKeyInput").value = keys.elevenlabsApiKey;
    document.getElementById("geminiApiKeyInput").value = keys.geminiApiKey;

    const hasEl = serverConfig.hasElevenlabsEnvKey || Boolean(keys.elevenlabsApiKey);
    document.getElementById("voiceStatusDot").classList.toggle("active-el", hasEl);
    document.getElementById("voiceStatusLabel").textContent = hasEl
      ? `ElevenLabs Active (${keys.elevenlabsVoiceId})`
      : `Suara Cowok Bariton Siap (${keys.elevenlabsVoiceId})`;
  } catch {}

  startRenderLoop();

  // Initial load without auto-playing audio (browsers block autoplay before user gesture)
  setPipelineState("research");
  const resp = await fetch("/api/research-and-script", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: simplePromptInput.value.trim(),
      geminiApiKey: getLocalKeys().geminiApiKey
    })
  });
  currentScript = await resp.json();
  videoTitleDisplay.textContent = currentScript.title;
  aiEngineBadge.textContent = currentScript.aiEngine || "Auto-Research";
  renderResearchBox(currentScript.research);
  renderSceneList();
  updateActiveSceneUI();
  setPipelineState("allDone");
}

autoBuildVideoBtn.addEventListener("click", () => {
  runAutonomousPromptBuild(simplePromptInput.value.trim(), true);
});

simplePromptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    runAutonomousPromptBuild(simplePromptInput.value.trim(), true);
  }
});

document.querySelectorAll(".prompt-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    simplePromptInput.value = chip.dataset.prompt;
    runAutonomousPromptBuild(chip.dataset.prompt, true);
  });
});

analyzeTiktokBtn.addEventListener("click", async () => {
  const url = tiktokUrlInput.value.trim();
  if (!url) return;
  analyzeTiktokBtn.disabled = true;
  analyzeTiktokBtn.textContent = "⏳...";
  try {
    const resp = await fetch("/api/analyze-tiktok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    showTikTokAnalysis(data);
    if (data.title) {
      simplePromptInput.value = `bikin vid tentang ${data.title.replace(/#\S+/g, "").trim()}`;
    }
  } catch (e) {
    alert("Gagal bedah link TikTok: " + e.message);
  } finally {
    analyzeTiktokBtn.disabled = false;
    analyzeTiktokBtn.textContent = "Bedah";
  }
});

playFullVideoBtn.addEventListener("click", () => {
  if (isPlaying) stopPlayback();
  else playFullVideo();
});

playSceneBtn.addEventListener("click", () => {
  playSingleScene(activeSceneIndex);
});

prevSceneBtn.addEventListener("click", () => {
  if (!currentScript?.scenes?.length) return;
  stopPlayback();
  activeSceneIndex = (activeSceneIndex - 1 + currentScript.scenes.length) % currentScript.scenes.length;
  activePhraseIndex = 0;
  updateActiveSceneUI();
});

nextSceneBtn.addEventListener("click", () => {
  if (!currentScript?.scenes?.length) return;
  stopPlayback();
  activeSceneIndex = (activeSceneIndex + 1) % currentScript.scenes.length;
  activePhraseIndex = 0;
  updateActiveSceneUI();
});

addSceneBtn.addEventListener("click", () => {
  if (!currentScript?.scenes) return;
  const nextNum = currentScript.scenes.length + 1;
  currentScript.scenes.push({
    sceneNumber: nextNum,
    phase: "JADI",
    mcPose: "explaining",
    mcPlacement: "presenter-left",
    componentLabel: `TAHAP TAMBAHAN #${nextNum}`,
    narration: "[JADI] pasang komponen tambahan ini supaya kinerjanya makin [stabil]!",
    subtitlePhrases: parseSubtitlePhrasesClient(
      "[JADI] pasang komponen tambahan ini supaya kinerjanya makin [stabil]!"
    ),
    sfx: "pop"
  });
  activeSceneIndex = currentScript.scenes.length - 1;
  renderSceneList();
  updateActiveSceneUI();
});

exportVideoBtn.addEventListener("click", exportFullVideo);

// Modals
const settingsModal = document.getElementById("settingsModal");
const characterModal = document.getElementById("characterModal");

document.getElementById("openSettingsBtn").addEventListener("click", () => {
  settingsModal.classList.remove("hidden");
});
document.getElementById("closeSettingsBtn").addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});
document.getElementById("cancelSettingsBtn").addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

document.getElementById("openCharacterBibleBtn").addEventListener("click", () => {
  characterModal.classList.remove("hidden");
});
document.getElementById("closeCharacterBtn").addEventListener("click", () => {
  characterModal.classList.add("hidden");
});

document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  const voiceId = document.getElementById("elevenlabsVoiceIdInput").value.trim() || "cPoqAvGWCPfCfyPMwe4z";
  const elKey = document.getElementById("elevenlabsApiKeyInput").value.trim();
  const gemKey = document.getElementById("geminiApiKeyInput").value.trim();

  localStorage.setItem("maou_el_voice", voiceId);
  localStorage.setItem("maou_el_key", elKey);
  localStorage.setItem("maou_gemini_key", gemKey);

  const hasEl = serverConfig.hasElevenlabsEnvKey || Boolean(elKey);
  document.getElementById("voiceStatusDot").classList.toggle("active-el", hasEl);
  document.getElementById("voiceStatusLabel").textContent = hasEl
    ? `ElevenLabs Active (${voiceId})`
    : `Suara Cowok Bariton Siap (${voiceId})`;

  sceneAudioBuffers.clear();
  settingsModal.classList.add("hidden");
});

initStudio();
