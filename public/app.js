// MaouEdu AI — 1-Prompt Auto-Research & Gemini Cinema (Kling-Class 3D PBR/Shader) + 2D Anime Host Video Studio
import {
  renderToonVideoFrame,
  drawScienceMeter,
  drawCelebrationConfetti
} from "/toon-renderer.js";
import { Maou3DStage } from "/scene3d.js";
import { MaouGeminiCinema } from "/gemini-cinema.js";
import { MaouAnimeMappaEngine } from "/anime-mappa-engine.js";
import { exportDeterministicMp4Video } from "/video-engine/mp4-video-exporter.js";

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
let playbackRunId = 0;
let stage3d = null;
let stage3dReady = false;
let geminiCinema = null;
let geminiCinemaReady = false;
let animeMappaEngine = null;
let animeMappaReady = false;
let audioCtx = null;
let analyserNode = null;
let analyserData = null;
let smoothedVoiceEnergy = 0;
let sceneEnterTimestamp = performance.now();
let activeAudioSource = null;
let activePhraseTimers = [];
let bgmInterval = null;
let serverConfig = {
  elevenlabsVoiceId: "nPczCjzI2devNBz1zQrb",
  hasElevenlabsEnvKey: false,
  hasGeminiEnvKey: false
};

const sceneAudioBuffers = new Map();
const sceneVideoClips = new Map();
let mcAnimatedVideo = null;

// UI Elements
const simplePromptInput = document.getElementById("simplePromptInput");
const autoBuildVideoBtn = document.getElementById("autoBuildVideoBtn");
const pipelineBar = document.getElementById("pipelineBar");
const stepResearch = document.getElementById("stepResearch");
const stepScript = document.getElementById("stepScript");
const stepVisualResearch = document.getElementById("stepVisualResearch");
const stepCinema = document.getElementById("stepCinema");
const stepVoice = document.getElementById("stepVoice");
const stepReady = document.getElementById("stepReady");

const researchResultsBox = document.getElementById("researchResultsBox");
const visualFoundationBox = document.getElementById("visualFoundationBox");
const aiEngineBadge = document.getElementById("aiEngineBadge");
const tiktokUrlInput = document.getElementById("tiktokUrlInput");
const analyzeTiktokBtn = document.getElementById("analyzeTiktokBtn");
const tiktokAnalysisBox = document.getElementById("tiktokAnalysisBox");
const renderGeminiCinemaBtn = document.getElementById("renderGeminiCinemaBtn");
const criticRefineBtn = document.getElementById("criticRefineBtn");
const criticResultBox = document.getElementById("criticResultBox");
const exportQualitySelect = document.getElementById("exportQualitySelect");
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

// Mutually-Exclusive Render Mode Selector + Active Overlay/Audio Toggles
const renderModeGroup = document.getElementById("renderModeGroup");
const toggleMcOverlay = document.getElementById("toggleMcOverlay");
const toggleYellowSubtitles = document.getElementById("toggleYellowSubtitles");
const toggleSfx = document.getElementById("toggleSfx");
const toggleBgm = document.getElementById("toggleBgm");

function getSelectedRenderMode() {
  const checked = document.querySelector('input[name="renderMode"]:checked');
  return checked?.value || localStorage.getItem("maou_render_mode") || "anime_mappa";
}

function syncRenderModeUI(mode) {
  const activeMode = ["anime_mappa", "cinema_3d", "classic_3d"].includes(mode) ? mode : "anime_mappa";
  localStorage.setItem("maou_render_mode", activeMode);
  document.querySelectorAll(".render-mode-card").forEach((card) => {
    const isMatch = card.dataset.mode === activeMode;
    card.classList.toggle("active", isMatch);
    const rad = card.querySelector('input[type="radio"]');
    if (rad) rad.checked = isMatch;
  });
  if (renderGeminiCinemaBtn) {
    if (activeMode === "anime_mappa") {
      renderGeminiCinemaBtn.textContent = "⚔️ Render Animasi Anime MAPPA (Gemini AI)";
      renderGeminiCinemaBtn.disabled = false;
    } else if (activeMode === "cinema_3d") {
      renderGeminiCinemaBtn.textContent = "🎬 Render Animasi 3D Sinematik (Gemini AI)";
      renderGeminiCinemaBtn.disabled = false;
    } else {
      renderGeminiCinemaBtn.textContent = "🧱 Mode 3D Klasik Aktif (Instant)";
      renderGeminiCinemaBtn.disabled = true;
    }
  }
}

// Local browser settings (never sent to GitHub)
function getLocalKeys() {
  return {
    elevenlabsVoiceId:
      localStorage.getItem("maou_el_voice") || serverConfig.elevenlabsVoiceId || "nPczCjzI2devNBz1zQrb",
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

function unlockAudioContextSync() {
  try {
    const actx = getAudioContext();
    if (actx && actx.state === "suspended") {
      actx.resume().catch(() => {});
    }
    return actx;
  } catch {
    return null;
  }
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
  const stages = [stepResearch, stepScript, stepVisualResearch, stepCinema, stepVoice, stepReady].filter(Boolean);
  const order = { research: 0, script: 1, visualResearch: 2, cinema: 3, voice: 4, ready: 5, allDone: 6 };
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
  } catch { }
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
    gain.gain.setValueAtTime(0.008, now);
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
  unlockAudioContextSync();
  const cleanPrompt = (promptText || simplePromptInput.value).trim();
  if (!cleanPrompt) {
    simplePromptInput.value = "";
    simplePromptInput.placeholder = "Isi dulu topik atau ide video kamu di sini!";
    simplePromptInput.focus();
    return;
  }

  // Always keep prompt column clean & ready for the next generation
  simplePromptInput.value = "";
  videoTitleDisplay.textContent = `⏳ Merancang: ${cleanPrompt.slice(0, 46)}`;

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
    sceneVideoClips.clear();

    videoTitleDisplay.textContent = currentScript.title;
    aiEngineBadge.textContent = currentScript.aiEngine || "Auto-Research";
    renderResearchBox(currentScript.research);
    if (currentScript.referenceMetadata) showTikTokAnalysis(currentScript.referenceMetadata);
    renderSceneList();
    updateActiveSceneUI();

    // 3 & 4: Compile Active Render Mode (Anime MAPPA Sakuga OR 3D Sinematik OR Instant Classic 3D)
    const activeMode = getSelectedRenderMode();
    if (activeMode === "anime_mappa") {
      setPipelineState("visualResearch");
      autoBuildVideoBtn.textContent = `⚔️ Menyusun Anime MAPPA (${currentScript.scenes.length} Scene)...`;
      await renderScenesForActiveMode(null, (phase) => {
        if (phase === "cinema") {
          setPipelineState("cinema");
          autoBuildVideoBtn.textContent = `⚔️ Koreografi Sakuga ${currentScript.scenes.length} Scene...`;
        }
      });
    } else if (activeMode === "cinema_3d") {
      setPipelineState("visualResearch");
      autoBuildVideoBtn.textContent = "🏛️ Riset Referensi Visual & Fondasi 3D...";
      await renderScenesForActiveMode(null, (phase) => {
        if (phase === "cinema") {
          setPipelineState("cinema");
          autoBuildVideoBtn.textContent = `🎬 Menyusun 3D Sinematik ${currentScript.scenes.length} Scene...`;
        }
      });
    } else {
      setPipelineState("cinema");
    }

    // 4: Generate voiceovers strictly via ElevenLabs across all scenes (no Google fallback)
    setPipelineState("voice");
    for (let i = 0; i < currentScript.scenes.length; i++) {
      autoBuildVideoBtn.textContent = `🎙️ ElevenLabs Scene ${i + 1}/${currentScript.scenes.length}...`;
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

function getCinemaStyleMemory() {
  try {
    const arr = JSON.parse(localStorage.getItem("maou_cinema_style_memory") || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveCinemaStyleLesson(lesson, score) {
  if (!lesson) return;
  try {
    const list = getCinemaStyleMemory();
    list.unshift({ lesson: String(lesson).slice(0, 180), score: Number(score) || 80, ts: Date.now() });
    const dedup = [];
    const seen = new Set();
    for (const item of list) {
      if (!seen.has(item.lesson)) {
        seen.add(item.lesson);
        dedup.push(item);
      }
      if (dedup.length >= 12) break;
    }
    localStorage.setItem("maou_cinema_style_memory", JSON.stringify(dedup));
  } catch {}
}

function renderVisualFoundationBox(visualPlan, sceneCount = 0) {
  if (!visualFoundationBox) return;
  if (!visualPlan?.worldFoundation) {
    visualFoundationBox.classList.add("hidden");
    return;
  }
  const wf = visualPlan.worldFoundation;
  const catalog = Array.isArray(visualPlan.assetCatalog) ? visualPlan.assetCatalog : [];
  const refs = Array.isArray(visualPlan.visualReferences) ? visualPlan.visualReferences : [];

  const assetsText = catalog
    .slice(0, 6)
    .map((a) => `<code>${a.name || a.id}</code>`)
    .join(" • ");

  const refsHtml = refs.length
    ? `<div style="margin-top:4px;font-size:0.74rem;"><strong>Referensi Visual:</strong> ${refs
        .slice(0, 3)
        .map((r) => `<a class="research-source-link" href="${r.url}" target="_blank" rel="noreferrer">${r.title}</a>`)
        .join(" • ")}</div>`
    : "";

  visualFoundationBox.classList.remove("hidden");
  visualFoundationBox.innerHTML = `
    <div><strong>🏛️ Fondasi Set 3D Konsisten (${sceneCount || currentScript?.scenes?.length || 0} Scene)</strong></div>
    <div style="font-size:0.76rem;margin-top:2px;">Set: <code>${wf.roomType}</code> • Cahaya: <code>${wf.lightingPreset}</code> • Dinding: <code>${wf.walls?.enabled ? wf.walls.backWallMaterial : "terbuka"}</code></div>
    <div style="font-size:0.76rem;margin-top:3px;">${wf.storySummary || ""}</div>
    ${assetsText ? `<div style="font-size:0.74rem;margin-top:4px;"><strong>Aset Persisten:</strong> ${assetsText}</div>` : ""}
    ${refsHtml}
  `;
}

async function renderScenesWithAnimeMappa(singleIdx = null, onStageChange = null) {
  if (!currentScript?.scenes?.length) return false;
  const keys = getLocalKeys();
  const targetScenes =
    singleIdx !== null && currentScript.scenes[singleIdx]
      ? [currentScript.scenes[singleIdx]]
      : currentScript.scenes;

  if (renderGeminiCinemaBtn) {
    renderGeminiCinemaBtn.disabled = true;
    renderGeminiCinemaBtn.textContent =
      singleIdx !== null
        ? `⏳ Menyutradarai Anime Scene #${singleIdx + 1}...`
        : `⚔️ Studio MAPPA Director (${currentScript.scenes.length} Scene)...`;
  }

  try {
    onStageChange?.("cinema");
    const styleMemoryHints = getCinemaStyleMemory()
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 4)
      .map((m) => m.lesson);

    const resp = await fetch("/api/anime-render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: currentScript.topic || "",
        title: currentScript.title || "",
        scenes: targetScenes,
        geminiApiKey: keys.geminiApiKey,
        styleMemoryHints
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      throw new Error(data.error || "Gagal merender animasi Anime MAPPA.");
    }

    if (singleIdx !== null && data.scenes?.[0]) {
      currentScript.scenes[singleIdx].animeBlueprint = data.scenes[0];
      currentScript.scenes[singleIdx].animeRenderVersion = Date.now();
    } else if (Array.isArray(data.scenes)) {
      data.scenes.forEach((bp, idx) => {
        if (currentScript.scenes[idx]) {
          currentScript.scenes[idx].animeBlueprint = bp;
          currentScript.scenes[idx].animeRenderVersion = Date.now();
        }
      });
    }

    if (visualFoundationBox) {
      const envs = Array.from(new Set((data.scenes || []).map((s) => s.animeEnvironment))).slice(0, 3);
      const impactCount = (data.scenes || []).filter((s) => s.impactBeat?.enabled).length;
      visualFoundationBox.classList.remove("hidden");
      visualFoundationBox.innerHTML = `
        <div><strong>⚔️ Produksi Anime Sakuga — Studio MAPPA / JJK (${currentScript.scenes.length} Scene)</strong></div>
        <div style="font-size:0.76rem;margin-top:2px;">Latar: <code>${envs.join(" → ")}</code> • Impact Frames: <code>${impactCount} momen</code></div>
        <div style="font-size:0.75rem;margin-top:3px;">${data.directorNotes || ""}</div>
      `;
    }

    aiEngineBadge.textContent = `⚔️ Anime MAPPA (${data.directorModel} • ${currentScript.scenes.length} Scene)`;
    sceneEnterTimestamp = performance.now();
    renderSceneList();
    updateActiveSceneUI();
    return true;
  } catch (err) {
    console.warn("Anime MAPPA render warning:", err);
    return false;
  } finally {
    syncRenderModeUI(getSelectedRenderMode());
  }
}

async function renderScenesForActiveMode(singleIdx = null, onStageChange = null) {
  const mode = getSelectedRenderMode();
  if (mode === "anime_mappa") return renderScenesWithAnimeMappa(singleIdx, onStageChange);
  if (mode === "cinema_3d") return renderScenesWithGeminiCinema(singleIdx, onStageChange);
  return true;
}

async function renderScenesWithGeminiCinema(singleIdx = null, onStageChange = null) {
  if (!currentScript?.scenes?.length) return false;
  const keys = getLocalKeys();
  const targetScenes =
    singleIdx !== null && currentScript.scenes[singleIdx]
      ? [currentScript.scenes[singleIdx]]
      : currentScript.scenes;

  if (renderGeminiCinemaBtn) {
    renderGeminiCinemaBtn.disabled = true;
    renderGeminiCinemaBtn.textContent =
      singleIdx !== null
        ? `⏳ Gemini Merender Scene #${singleIdx + 1}...`
        : "🏛️ Riset Visual & Menyusun Set 3D...";
  }

  try {
    // Stage 0: Research real-world visual references & lock 1 coherent room + persistent asset catalog
    if (singleIdx === null || !currentScript.visualPlan?.worldFoundation) {
      onStageChange?.("visualResearch");
      try {
        const vrResp = await fetch("/api/visual-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: currentScript.topic || "",
            title: currentScript.title || "",
            scenes: currentScript.scenes,
            geminiApiKey: keys.geminiApiKey
          })
        });
        const vrData = await vrResp.json();
        if (vrResp.ok && vrData?.worldFoundation) {
          currentScript.visualPlan = vrData;
          renderVisualFoundationBox(vrData, currentScript.scenes.length);
        }
      } catch (vrErr) {
        console.warn("Visual research non-fatal warning:", vrErr);
      }
    }

    onStageChange?.("cinema");
    if (renderGeminiCinemaBtn && singleIdx === null) {
      renderGeminiCinemaBtn.textContent = `🎬 Koreografi ${currentScript.scenes.length} Scene Sesuai Naskah...`;
    }

    const styleMemoryHints = getCinemaStyleMemory()
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 4)
      .map((m) => m.lesson);

    const resp = await fetch("/api/gemini-render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: currentScript.topic || "",
        title: currentScript.title || "",
        scenes: targetScenes,
        visualPlan: currentScript.visualPlan || null,
        geminiApiKey: keys.geminiApiKey,
        enableKeyframes: false,
        enableCustomRigs: true,
        styleMemoryHints
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      throw new Error(data.error || "Gagal merender animasi Gemini Cinema.");
    }

    if (data.worldFoundation && !currentScript.visualPlan?.worldFoundation) {
      currentScript.visualPlan = {
        worldFoundation: data.worldFoundation,
        assetCatalog: data.assetCatalog || [],
        visualReferences: data.visualReferences || []
      };
      renderVisualFoundationBox(currentScript.visualPlan, currentScript.scenes.length);
    }

    if (singleIdx !== null && data.scenes?.[0]) {
      currentScript.scenes[singleIdx].cinemaBlueprint = data.scenes[0];
      currentScript.scenes[singleIdx].cinemaRenderVersion = Date.now();
    } else if (Array.isArray(data.scenes)) {
      data.scenes.forEach((bp, idx) => {
        if (currentScript.scenes[idx]) {
          currentScript.scenes[idx].cinemaBlueprint = bp;
          currentScript.scenes[idx].cinemaRenderVersion = Date.now();
        }
      });
    }

    const rigSuffix = data.customRigCount > 0 ? ` • ${data.customRigCount} Custom Rig` : "";
    const modeTag =
      data.keyframeCount > 0
        ? `🍌 Nano Banana + Diorama (${data.imageModel})`
        : `🏛️ Diorama 3D (${data.directorModel}${rigSuffix} • ${currentScript.scenes.length} Scene)`;
    aiEngineBadge.textContent = modeTag;
    sceneEnterTimestamp = performance.now();
    renderSceneList();
    updateActiveSceneUI();
    return true;
  } catch (err) {
    console.warn("Gemini Cinema render warning:", err);
    return false;
  } finally {
    syncRenderModeUI(getSelectedRenderMode());
  }
}

async function runGeminiVisualCritic(targetIdx = activeSceneIndex) {
  if (!currentScript?.scenes?.[targetIdx]) {
    alert("Buat video terlebih dahulu agar Gemini Vision bisa melihat dan mengevaluasi frame-nya.");
    return;
  }
  const scene = currentScript.scenes[targetIdx];
  const activeMode = getSelectedRenderMode();
  if (activeMode === "anime_mappa" && !scene.animeBlueprint) {
    await renderScenesWithAnimeMappa(targetIdx);
  } else if (activeMode === "cinema_3d" && !scene.cinemaBlueprint) {
    await renderScenesWithGeminiCinema(targetIdx);
  }
  activeSceneIndex = targetIdx;
  updateActiveSceneUI();

  if (criticRefineBtn) {
    criticRefineBtn.disabled = true;
    criticRefineBtn.textContent = `👁️ Gemini Vision Menilai Scene #${targetIdx + 1}...`;
  }
  if (criticResultBox) {
    criticResultBox.classList.remove("hidden");
    criticResultBox.innerHTML = `<div>👁️ Mengirim tangkapan layar Scene #${targetIdx + 1} (${activeMode === "anime_mappa" ? "Anime MAPPA" : "3D"}) ke <strong>Gemini Multimodal Vision</strong>...</div>`;
  }

  try {
    // Render crisp frame right before snapshotting
    renderCompositeFrame({
      sceneIndex: targetIdx,
      tSec: performance.now() / 1000,
      sceneElapsedSec: 1.4,
      sceneDurationSec: sceneAudioBuffers.get(targetIdx)?.buffer?.duration || 4.6
    });
    const frameDataUrl = canvas.toDataURL("image/jpeg", 0.78);
    const keys = getLocalKeys();
    const targetBlueprint = activeMode === "anime_mappa" ? scene.animeBlueprint : scene.cinemaBlueprint;

    const resp = await fetch("/api/video-critic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frameDataUrl,
        blueprint: targetBlueprint,
        scene,
        topic: currentScript.topic || currentScript.title || "",
        geminiApiKey: keys.geminiApiKey
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || "Gagal mengevaluasi frame.");

    if (data.refinedBlueprint) {
      if (activeMode === "anime_mappa") {
        currentScript.scenes[targetIdx].animeBlueprint = data.refinedBlueprint;
        currentScript.scenes[targetIdx].animeRenderVersion = Date.now();
      } else {
        currentScript.scenes[targetIdx].cinemaBlueprint = data.refinedBlueprint;
        currentScript.scenes[targetIdx].cinemaRenderVersion = Date.now();
      }
      currentScript.scenes[targetIdx].criticScore = data.overallScore;
    }
    if (data.styleLesson) {
      saveCinemaStyleLesson(data.styleLesson, data.overallScore);
    }

    const memCount = getCinemaStyleMemory().length;
    if (criticResultBox) {
      const bd = data.breakdown || {};
      criticResultBox.classList.remove("hidden");
      criticResultBox.innerHTML = `
        <div><strong>👁️ Skor Gemini Vision (${data.visionModel}): ${data.overallScore}/100</strong></div>
        <div style="font-size:0.72rem;opacity:0.9;margin-top:2px;">Framing ${bd.framing || "-"} • Lighting ${bd.lighting || "-"} • Bokeh ${bd.depthAndBokeh || "-"} • Kling Vibe ${bd.cinematicVibe || "-"}</div>
        <div style="margin-top:4px;">${data.critique}</div>
        <div style="margin-top:4px;color:#fde68a;">✅ Patch otomatis diterapkan • Memori Gaya Tersimpan: <strong>${memCount} pelajaran</strong></div>
      `;
    }
    sceneEnterTimestamp = performance.now();
    renderSceneList();
    updateActiveSceneUI();
  } catch (err) {
    if (criticResultBox) {
      criticResultBox.classList.remove("hidden");
      criticResultBox.innerHTML = `<div>⚠️ Gemini Vision QC gagal: ${err.message}</div>`;
    }
  } finally {
    if (criticRefineBtn) {
      criticRefineBtn.disabled = false;
      criticRefineBtn.textContent = "👁️ Evaluasi & Upgrade Visual (Gemini Vision)";
    }
  }
}

function renderResearchBox(research) {
  if (!research || (!research.summaryFacts?.length && !research.sources?.length)) {
    researchResultsBox.innerHTML = `
      <div>🔍 Topik langsung diubah jadi langkah praktek nyata (pola Praktek Awal → TAPI → JADI → SELAMAT!).</div>
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

// Render Storyboard Scene Cards
function renderSceneList() {
  sceneListContainer.innerHTML = "";
  if (!currentScript?.scenes) return;

  currentScript.scenes.forEach((scene, index) => {
    const card = document.createElement("div");
    card.className = `scene-card ${index === activeSceneIndex ? "active" : ""}`;
    const hasAudio = sceneAudioBuffers.has(index);
    const clipInfo = sceneVideoClips.get(index);
    const hasCustomRig = Boolean(scene.cinemaBlueprint?.actors?.some((a) => a.prefab === "custom_rig"));
    const qcScore = scene.criticScore ? ` • ⭐${scene.criticScore}` : "";
    const animBadge = scene.cinemaBlueprint
      ? scene.cinemaBlueprint.aiKeyframe
        ? `🍌 Gemini AI Keyframe${qcScore}`
        : `🎬 Cinema (${scene.cinemaBlueprint.actors?.length || 0} aktor${hasCustomRig ? " • 🧬Rig" : ""}${qcScore})`
      : scene.visual?.stage3d?.objects?.length
        ? `🎬 3D AI (${scene.visual.stage3d.objects.length} objek)`
        : scene.visual?.heroObject
          ? `🎬 3D @untabiru5`
          : "";
    const clipBadge = clipInfo?.videoEl ? "🎥 Klip MP4 Siap" : animBadge;

    card.innerHTML = `
      <div class="scene-card-top">
        <span class="scene-num">SCENE #${index + 1} ${clipBadge ? `<span style="color:#6ee7b7;margin-left:6px;font-weight:700;">${clipBadge}</span>` : ""}</span>
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
          ${hasAudio ? "✅ Suara Siap" : "⚪ Belum direkam"}
        </span>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm rerender-cinema-btn" data-idx="${index}" title="Render ulang animasi scene ini via Gemini Cinema">🎬 Gemini</button>
          <button class="btn btn-secondary btn-sm critic-scene-btn" data-idx="${index}" title="Evaluasi & upgrade visual scene ini via Gemini Vision">👁️ QC</button>
          <label class="btn btn-secondary btn-sm" style="cursor:pointer;" title="Upload klip MP4 sendiri">
            📁 MP4
            <input type="file" accept="video/mp4,video/webm" class="upload-scene-mp4 hidden" data-idx="${index}" />
          </label>
          <button class="btn btn-secondary btn-sm play-single-btn" data-idx="${index}">🔊 Tes</button>
        </div>
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

  document.querySelectorAll(".rerender-cinema-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      activeSceneIndex = idx;
      updateActiveSceneUI();
      btn.disabled = true;
      btn.textContent = "⏳...";
      await renderScenesWithGeminiCinema(idx);
    });
  });

  document.querySelectorAll(".critic-scene-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      btn.disabled = true;
      btn.textContent = "⏳...";
      await runGeminiVisualCritic(idx);
    });
  });

  document.querySelectorAll(".play-single-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      await playSingleScene(idx);
    });
  });

  document.querySelectorAll(".upload-scene-mp4").forEach((inp) => {
    inp.addEventListener("change", async (e) => {
      const idx = Number(e.target.dataset.idx);
      const file = e.target.files?.[0];
      if (!file) return;
      const blobUrl = URL.createObjectURL(file);
      const videoEl = await loadVideoElement(blobUrl);
      sceneVideoClips.set(idx, {
        videoEl,
        url: blobUrl,
        status: "succeed",
        message: `✅ Klip MP4 Lokal: ${file.name}`
      });
      activeSceneIndex = idx;
      renderSceneList();
      updateActiveSceneUI();
    });
  });
}

// ============================================================================
// LOCAL MP4 CLIP HELPER
// ============================================================================
function loadVideoElement(srcUrl) {
  return new Promise((resolve, reject) => {
    const vid = document.createElement("video");
    vid.crossOrigin = "anonymous";
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.src = srcUrl;
    vid.onloadeddata = () => {
      vid.play().catch(() => { });
      resolve(vid);
    };
    vid.onerror = () => reject(new Error("Gagal memuat file video MP4."));
    vid.load();
  });
}

function drawCoverVideo(ctx, videoEl, x, y, w, h) {
  const vw = videoEl.videoWidth || w;
  const vh = videoEl.videoHeight || h;
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(videoEl, dx, dy, dw, dh);
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

let activeElevenlabsVoiceId = "";

async function ensureSceneAudio(index) {
  if (sceneAudioBuffers.has(index)) return sceneAudioBuffers.get(index);
  const scene = currentScript.scenes[index];
  const st = document.getElementById(`audioStatus_${index}`);
  if (st) st.textContent = "⏳ Rekam suara ElevenLabs...";

  const keys = getLocalKeys();
  const requestedVoiceId = activeElevenlabsVoiceId || keys.elevenlabsVoiceId;
  let data = {};
  try {
    const resp = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: scene.narration,
        voiceId: requestedVoiceId,
        elevenlabsApiKey: keys.elevenlabsApiKey
      })
    });
    data = await resp.json().catch(() => ({ elevenlabsError: `HTTP ${resp.status}` }));
  } catch (e) {
    data = { elevenlabsError: e.message || "Gagal terhubung ke endpoint ElevenLabs" };
  }

  const lbl = document.getElementById("voiceStatusLabel");
  const dot = document.getElementById("voiceStatusDot");

  if (data.provider === "elevenlabs" && data.audioBase64) {
    const actx = getAudioContext();
    if (actx.state === "suspended") {
      try {
        await actx.resume();
      } catch { }
    }

    const arrayBuf = base64ToArrayBuffer(data.audioBase64);
    const decoded = await actx.decodeAudioData(arrayBuf);
    if (data.voiceId) activeElevenlabsVoiceId = data.voiceId;

    const entry = {
      buffer: decoded,
      provider: "elevenlabs",
      playbackRate: 1.0
    };
    sceneAudioBuffers.set(index, entry);
    if (st) {
      st.textContent = data.voiceFallbackNote
        ? `✅ ElevenLabs Deep Male (${data.voiceId})`
        : `✅ ElevenLabs (${data.voiceId})`;
      st.classList.add("ready");
    }
    if (dot) dot.classList.add("active-el");
    if (lbl) lbl.textContent = `ElevenLabs Active (${data.voiceId})`;
    return entry;
  }

  // Strictly ElevenLabs-only: report error clearly without falling back to Google TTS
  const errMsg = data.elevenlabsError || data.error || "Gagal menghubungi ElevenLabs";
  if (st) {
    st.textContent = `⚠️ ElevenLabs gagal: ${String(errMsg).slice(0, 62)}`;
    st.classList.remove("ready");
  }
  if (dot) dot.classList.remove("active-el");
  if (lbl) lbl.textContent = `ElevenLabs Error — cek kuota / API key di ⚙️ API & Voice`;
  return null;
}

async function playSceneAudioAndWait(index, destNode = null, runId = playbackRunId) {
  if (runId !== playbackRunId) return;
  const sc = currentScript.scenes[index];
  if (!sc.subtitlePhrases || !sc.subtitlePhrases.length) {
    sc.subtitlePhrases = parseSubtitlePhrasesClient(sc.narration);
  }

  activePhraseIndex = 0;
  sceneEnterTimestamp = performance.now();
  const clip = sceneVideoClips.get(index);
  if (clip?.videoEl) {
    try {
      clip.videoEl.currentTime = 0;
      clip.videoEl.play().catch(() => { });
    } catch { }
  }
  playProceduralSfx(sc.sfx, destNode);

  let audioEntry = null;
  try {
    audioEntry = await ensureSceneAudio(index);
  } catch { }

  if (runId !== playbackRunId || !isPlaying) return;

  return new Promise(async (resolve) => {
    const phrases = sc.subtitlePhrases;
    if (audioEntry && audioEntry.buffer) {
      const actx = getAudioContext();
      if (actx.state === "suspended") {
        try {
          await actx.resume();
        } catch { }
      }
      if (runId !== playbackRunId || !isPlaying) return resolve();

      const source = actx.createBufferSource();
      source.buffer = audioEntry.buffer;
      source.playbackRate.value = audioEntry.playbackRate || 1.0;

      const highpassFilter = actx.createBiquadFilter();
      highpassFilter.type = "highpass";
      highpassFilter.frequency.value = 85;

      const vocalPresence = actx.createBiquadFilter();
      vocalPresence.type = "peaking";
      vocalPresence.frequency.value = 3000;
      vocalPresence.Q.value = 0.9;
      vocalPresence.gain.value = 2.8;

      source.connect(highpassFilter);
      highpassFilter.connect(vocalPresence);
      if (analyserNode) {
        vocalPresence.connect(analyserNode);
        try {
          analyserNode.disconnect();
        } catch { }
        analyserNode.connect(destNode || actx.destination);
      } else {
        vocalPresence.connect(destNode || actx.destination);
      }

      if (activeAudioSource) {
        try {
          activeAudioSource.onended = null;
          activeAudioSource.stop();
        } catch { }
      }
      activePhraseTimers.forEach((t) => clearTimeout(t));
      activePhraseTimers = [];
      activeAudioSource = source;

      const durationMs = (audioEntry.buffer.duration / (source.playbackRate.value || 1.0)) * 1000;
      const weights = phrases.map((ph) => Math.max(5, ph.map((t) => t.text).join(" ").length));
      const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
      let accumMs = 0;
      for (let i = 0; i < phrases.length - 1; i++) {
        accumMs += (weights[i] / totalWeight) * durationMs;
        const nextIdx = i + 1;
        activePhraseTimers.push(
          setTimeout(() => {
            if (isPlaying && runId === playbackRunId) activePhraseIndex = nextIdx;
          }, accumMs)
        );
      }

      source.onended = () => {
        if (activeAudioSource === source) activeAudioSource = null;
        activePhraseTimers.forEach((t) => clearTimeout(t));
        activePhraseTimers = [];
        resolve();
      };
      source.start(0);
    } else {
      const durationMs = Math.max(3200, phrases.length * 1050);
      const phraseIntervalMs = durationMs / phrases.length;
      const phraseTimer = setInterval(() => {
        if (runId !== playbackRunId || !isPlaying) {
          clearInterval(phraseTimer);
          return;
        }
        if (activePhraseIndex < phrases.length - 1) activePhraseIndex++;
      }, phraseIntervalMs);
      const endTimer = setTimeout(() => {
        clearInterval(phraseTimer);
        resolve();
      }, durationMs);
      activePhraseTimers.push(endTimer);
    }
  });
}

async function playSingleScene(index) {
  unlockAudioContextSync();
  stopPlayback();
  const runId = playbackRunId;
  isPlaying = true;
  activeSceneIndex = index;
  updateActiveSceneUI();
  await playSceneAudioAndWait(index, null, runId);
  if (runId === playbackRunId) isPlaying = false;
}

async function playFullVideo(destNode = null) {
  if (!currentScript?.scenes?.length) return;
  unlockAudioContextSync();
  stopPlayback();
  const runId = playbackRunId;
  isPlaying = true;
  playFullVideoBtn.textContent = "⏹ Hentikan";
  startBgm(destNode);

  for (let i = 0; i < currentScript.scenes.length; i++) {
    if (!isPlaying || runId !== playbackRunId) break;
    activeSceneIndex = i;
    updateActiveSceneUI();
    await playSceneAudioAndWait(i, destNode, runId);
  }

  if (runId === playbackRunId) stopPlayback();
}

function stopPlayback() {
  playbackRunId++;
  isPlaying = false;
  stopBgm();
  activePhraseTimers.forEach((t) => clearTimeout(t));
  activePhraseTimers = [];
  if (activeAudioSource) {
    try {
      activeAudioSource.onended = null;
      activeAudioSource.stop();
    } catch { }
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

  drawProceduralEdutainmentScene(ctx, scene, tSec);
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

  const textContext = `${currentScript?.topic || ""} ${scene.narration || ""} ${scene.componentLabel || ""
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
  const cardW = isHero ? 148 : 132;
  const cardH = isHero ? 186 : 168;
  const targetX = isHero ? W - cardW - 14 : isRight ? W - cardW - 14 : 14;
  const entryOffset = (1 - slideEase) * (isRight || isHero ? 50 : -50);
  const cardX = targetX + swayX + entryOffset;
  const cardY = (isHero ? 548 : 566) + breathY + voiceBounceY;
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

  // Draw animated MC video if uploaded, else Live2D-animated portrait
  const hasAnimatedMcVideo = Boolean(mcAnimatedVideo && mcAnimatedVideo.readyState >= 2);
  const panX = hasAnimatedMcVideo ? 0 : Math.sin(tSec * 1.4) * 5;
  const panY = hasAnimatedMcVideo ? 0 : Math.cos(tSec * 1.8) * 4 - voice * 5;
  if (hasAnimatedMcVideo) {
    drawCoverVideo(ctx, mcAnimatedVideo, cardX, cardY, cardW, cardH);
  } else {
    const innerZoom = 1.08 + Math.sin(tSec * 1.1) * 0.03 + voice * 0.05;
    ctx.drawImage(
      mcImage,
      cardX - (cardW * (innerZoom - 1)) / 2 + panX,
      cardY - 8 + panY,
      cardW * innerZoom,
      cardH * 1.15 * innerZoom
    );
  }

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
    eureka: "👑 BERHASIL TOTAL!"
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

  // Expressive 2D Anime Emotion Pop-Up Icon floating beside MC's head
  const fxY = cardY - 6 + Math.sin(tSec * 6.5) * 5;
  ctx.font = "900 26px sans-serif";
  if (scene.mcPose === "sarcastic" || scene.phase === "TAPI") {
    ctx.fillText("💢", cardX + 18, fxY + 22);
  } else if (scene.mcPose === "explaining" || scene.phase === "JADI") {
    ctx.fillText("✨", cardX + cardW - 16, fxY + 18);
  } else if (scene.mcPose === "eureka" || scene.phase === "CLIMAX") {
    ctx.fillText("👑", centerX, fxY);
  }
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
        const isDangerWord = /^(tapi|bahaya|plot twist|rewind|awas|bocor|gagal|panas|overheat|ambles|karatan|bising|mogok)/i.test(
          tok.text.trim()
        );
        const isWinWord = /^(selamat!?|berhasil!?|jadi|solusi|mantap!?|hidup!?)$/i.test(tok.text.trim());
        ctx.save();
        drawRoundedRect(ctx, cursorX, y - 20, boxW, 42, 10);
        ctx.fillStyle = "#090a0f";
        ctx.fill();

        drawRoundedRect(ctx, cursorX - 2, y - 22, boxW, 42, 10);
        ctx.fillStyle = isDangerWord ? "#e11d48" : isWinWord ? "#10b981" : "#fbbf24";
        ctx.fill();
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = "#090a0f";
        ctx.stroke();

        ctx.fillStyle = isDangerWord ? "#ffffff" : "#090a0f";
        ctx.textAlign = "left";
        ctx.fillText(tok.text, cursorX + 8, y);
        ctx.restore();
      } else {
        ctx.save();
        ctx.textAlign = "left";
        ctx.lineWidth = 8.5;
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
    HOOK: { bg: "#1d4ed8", text: "⚡ MULAI PRAKTEK" },
    TAPI: { bg: "#e11d48", text: "⚠️ TAPI... (GAGAL!)" },
    JADI: { bg: "#d97706", text: "💡 JADI... (TRIKNYA!)" },
    CLIMAX: { bg: "#059669", text: "🏆 BERHASIL!" }
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

function drawDekodaHookCard(ctx, visual, tSec, sceneElapsedSec) {
  if (visual?.vsCard?.leftTitle && visual?.vsCard?.rightTitle) return;
  const hc = visual?.hookCard;
  if (!hc || !hc.title) return;
  const W = canvas.width;
  const cardW = 224;
  const cardH = hc.subtitle ? 56 : 38;
  const x = W - cardW - 18;
  const y = 116;
  const pop = sceneElapsedSec < 0.25 ? 0.85 + (sceneElapsedSec / 0.25) * 0.15 : 1;

  ctx.save();
  ctx.translate(x + cardW / 2, y + cardH / 2);
  ctx.scale(pop, pop);
  ctx.translate(-(x + cardW / 2), -(y + cardH / 2));

  // Soft shadow
  drawRoundedRect(ctx, x + 2, y + 4, cardW, cardH, 12);
  ctx.fillStyle = "rgba(9, 10, 15, 0.28)";
  ctx.fill();

  // Warm @dekodaid cream plaque
  drawRoundedRect(ctx, x, y, cardW, cardH, 12);
  ctx.fillStyle = "#fffbeb";
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = "#1e293b";
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 13px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(hc.title, x + 12, y + 9, cardW - 24);

  if (hc.subtitle) {
    ctx.fillStyle = "#0284c7";
    ctx.font = "800 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(hc.subtitle, x + 12, y + 30, cardW - 24);
  }
  ctx.restore();
}

function drawBelajarInfoPills(ctx, visual, phase, tSec) {
  const cards = visual?.infoCards;
  if (!Array.isArray(cards) || !cards.length) return;
  const startY = visual?.meter ? 172 : 116;
  const cardW = 196;
  const cardH = 44;

  cards.slice(0, 2).forEach((card, idx) => {
    const x = 18;
    const y = startY + idx * (cardH + 8);
    const accent =
      card.tone === "warn" ? "#e11d48" : card.tone === "good" ? "#10b981" : "#0284c7";

    ctx.save();
    drawRoundedRect(ctx, x + 2, y + 3, cardW, cardH, 10);
    ctx.fillStyle = "rgba(9, 10, 15, 0.26)";
    ctx.fill();

    drawRoundedRect(ctx, x, y, cardW, cardH, 10);
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#090a0f";
    ctx.stroke();

    // Colored left indicator bar
    drawRoundedRect(ctx, x + 5, y + 6, 6, cardH - 12, 3);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#475569";
    ctx.font = "800 9.5px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(String(card.label || "INFO").toUpperCase(), x + 18, y + 7, cardW - 26);

    ctx.fillStyle = card.tone === "warn" ? "#be123c" : card.tone === "good" ? "#047857" : "#0f172a";
    ctx.font = "900 12.5px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(String(card.value || ""), x + 18, y + 21, cardW - 26);
    ctx.restore();
  });
}

function drawMilestoneStampBanner(ctx, visual, scene, tSec, sceneElapsedSec) {
  const txt = visual?.bannerText;
  if (!txt) return;
  if (scene.phase === "CLIMAX" && txt === "SELAMAT!") return;

  const W = canvas.width;
  const punch = sceneElapsedSec < 0.28 ? 1.25 - (sceneElapsedSec / 0.28) * 0.25 : 1 + Math.sin(tSec * 4) * 0.015;

  ctx.save();
  ctx.font = "900 17px 'Plus Jakarta Sans', sans-serif";
  const boxW = Math.min(260, Math.max(140, ctx.measureText(txt).width + 32));
  const boxH = 38;

  ctx.translate(W - boxW / 2 - 20, 198);
  ctx.rotate(-0.06);
  ctx.scale(punch, punch);

  // @belajar.iai solid offset shadow + crisp white black-bordered card
  drawRoundedRect(ctx, -boxW / 2 + 4, -boxH / 2 + 4, boxW, boxH, 7);
  ctx.fillStyle = "#090a0f";
  ctx.fill();

  drawRoundedRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 7);
  ctx.fillStyle = scene.phase === "TAPI" ? "#fef2f2" : "#ffffff";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#090a0f";
  ctx.stroke();

  ctx.fillStyle = scene.phase === "TAPI" ? "#e11d48" : "#090a0f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(txt, 0, 1, boxW - 16);
  ctx.restore();
}

function drawMaouVersusCard(ctx, visual, tSec) {
  const vs = visual?.vsCard;
  if (!vs || !vs.leftTitle || !vs.rightTitle) return;
  const W = canvas.width;
  const cardW = 280;
  const cardH = 56;
  const x = W - cardW - 18;
  const y = 114;

  ctx.save();
  drawRoundedRect(ctx, x + 2, y + 3, cardW, cardH, 11);
  ctx.fillStyle = "rgba(9, 10, 15, 0.3)";
  ctx.fill();

  drawRoundedRect(ctx, x, y, cardW, cardH, 11);
  ctx.fillStyle = "rgba(15, 18, 28, 0.94)";
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#f59e0b";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "800 9px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(vs.leftTitle.toUpperCase(), x + 68, y + 14, 112);
  ctx.fillStyle = "#fb7185";
  ctx.font = "900 12px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(vs.leftValue || "-", x + 68, y + 32, 112);

  drawRoundedRect(ctx, x + cardW / 2 - 14, y + 14, 28, 20, 999);
  ctx.fillStyle = "#e11d48";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 9.5px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("VS", x + cardW / 2, y + 25);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "800 9px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(vs.rightTitle.toUpperCase(), x + cardW - 68, y + 14, 112);
  ctx.fillStyle = "#34d399";
  ctx.font = "900 12px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(vs.rightValue || "-", x + cardW - 68, y + 32, 112);

  if (vs.verdict) {
    ctx.fillStyle = "#fde047";
    ctx.font = "800 9px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(vs.verdict.toUpperCase(), x + cardW / 2, y + 48, cardW - 18);
  }
  ctx.restore();
}

function drawIdleStandbyCanvas(ctx, tSec) {
  const W = canvas.width;
  const H = canvas.height;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b0d14");
  bg.addColorStop(0.55, "#191122");
  bg.addColorStop(1, "#090a0f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 9; i++) {
    const px = W / 2 + Math.sin(tSec * 0.9 + i * 1.3) * 190;
    const py = H * 0.45 + Math.cos(tSec * 1.1 + i * 0.9) * 260;
    const r = 38 + Math.sin(tSec * 2 + i) * 12;
    const g = ctx.createRadialGradient(px, py, 2, px, py, r);
    g.addColorStop(0, i % 2 === 0 ? "rgba(225, 29, 72, 0.25)" : "rgba(245, 158, 11, 0.2)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  if (mcImage.complete && mcImage.naturalWidth > 0) {
    const cw = 210;
    const ch = 260;
    const cx = (W - cw) / 2;
    const cy = 225 + Math.sin(tSec * 1.8) * 6;
    drawRoundedRect(ctx, cx, cy, cw, ch, 22);
    ctx.save();
    ctx.clip();
    ctx.drawImage(mcImage, cx, cy, cw, ch * 1.1);
    ctx.restore();
    drawRoundedRect(ctx, cx, cy, cw, ch, 22);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#f59e0b";
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#fbbf24";
  ctx.font = "900 14px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("👑  MAOUEDU 3D STUDIO", W / 2, 535);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 24px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Kolom Prompt Kosong & Siap!", W / 2, 575);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 14.5px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Ketik ide videomu di kolom atas,", W / 2, 610);
  ctx.fillText("Raja Iblis + 3D Ipul siap beraksi.", W / 2, 632);
  ctx.restore();
}

function computeSubtitlePhraseAtTime(scene, sceneElapsedSec, sceneDurationSec) {
  const phrases = scene.subtitlePhrases || parseSubtitlePhrasesClient(scene.narration || "");
  if (!phrases.length) return 0;
  const weights = phrases.map((ph) => Math.max(5, ph.map((t) => t.text).join(" ").length));
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  const targetRatio = Math.max(0, Math.min(0.999, sceneElapsedSec / Math.max(0.5, sceneDurationSec)));
  let accum = 0;
  for (let i = 0; i < phrases.length; i++) {
    accum += weights[i] / totalWeight;
    if (targetRatio <= accum) return i;
  }
  return phrases.length - 1;
}

function renderCompositeFrame({
  sceneIndex = activeSceneIndex,
  tSec = performance.now() / 1000,
  sceneElapsedSec = 0,
  sceneDurationSec = 4.6,
  deterministicPhrase = false
} = {}) {
  if (!currentScript?.scenes?.length) {
    drawIdleStandbyCanvas(ctx, tSec);
    return;
  }
  const scene = currentScript.scenes[sceneIndex] || currentScript.scenes[0];
  if (deterministicPhrase) {
    activePhraseIndex = computeSubtitlePhraseAtTime(scene, sceneElapsedSec, sceneDurationSec);
  }

  // 1. Play uploaded MP4 clip -> else strictly render the user's SELECTED mutually-exclusive Render Mode!
  const clip = sceneVideoClips.get(sceneIndex);
  const liveVoice = deterministicPhrase ? 0.45 + Math.abs(Math.sin(tSec * 11)) * 0.45 : getLiveVoiceEnergy();
  const mode = getSelectedRenderMode();
  let rendered3d = false;

  if (clip?.videoEl && clip.videoEl.readyState >= 2) {
    drawCoverVideo(ctx, clip.videoEl, 0, 0, canvas.width, canvas.height);
  } else {
    if (mode === "anime_mappa" && animeMappaReady && animeMappaEngine) {
      try {
        const bp = scene.animeBlueprint || {
          animeEnvironment: "shibuya_night",
          satsueiMood: scene.phase === "TAPI" ? "sukuna_crimson" : scene.phase === "CLIMAX" ? "hollow_purple" : "jjk_cursed_blue",
          cameraMove: scene.phase === "TAPI" ? "dutch_tension_tilt" : "low_angle_hero_push",
          impactBeat: { enabled: scene.phase === "TAPI" || scene.phase === "CLIMAX", triggerProgress: 0.48, style: scene.phase === "TAPI" ? "black_flash" : "bw_manga_invert" },
          characters: [
            {
              id: "maou_hero",
              role: "protagonist",
              animePose: scene.phase === "TAPI" ? "charge_cursed_energy" : scene.phase === "CLIMAX" ? "floating_overlord" : "point_reveal",
              hairColor: "#cbd5e1",
              streakColor: "#e11d48",
              outfitColor: "#111827",
              accentColor: "#f59e0b",
              eyeColor: scene.phase === "TAPI" ? "#ef4444" : "#38bdf8",
              auraColor: scene.phase === "TAPI" ? "#f43f5e" : "#38bdf8",
              hasHorns: true,
              startPos: [-0.42, 0, -0.05],
              endPos: [-0.36, 0, 0.02],
              rotY: 0.28,
              scale: 1.0
            }
          ],
          subjectProps: [
            { id: "main", prefab: "crystal_core", color: "#38bdf8", secondaryColor: "#fbbf24", pos: [0.44, 0.3, 0.08], rot: [0, -0.25, 0], scale: 0.85, motion: "hover_pulse" }
          ],
          animeVfx: [
            { type: scene.phase === "TAPI" ? "black_flash_lightning" : "cursed_energy_aura", origin: [-0.4, 0.8, 0], color: scene.phase === "TAPI" ? "#ef4444" : "#38bdf8" }
          ],
          satsueiGrade: { bloomStrength: 0.42, rimIntensity: 1.2, contrast: 1.12, saturation: 1.18, speedLines: scene.phase === "TAPI" }
        };
        const aKey = `anime::${currentScript.topic || ""}::${sceneIndex}::${scene.animeRenderVersion || 1}`;
        animeMappaEngine.renderFrame(bp, aKey, tSec, sceneElapsedSec, sceneDurationSec, liveVoice);
        ctx.drawImage(animeMappaEngine.domElement, 0, 0, canvas.width, canvas.height);

        // Draw crisp MAPPA Manga Impact Stamp if defined on this anime cut!
        if (bp.mangaCaption) {
          ctx.save();
          ctx.font = "900 18px 'Plus Jakarta Sans', sans-serif";
          ctx.translate(canvas.width - 110, 245);
          ctx.rotate(-0.08);
          ctx.lineWidth = 5;
          ctx.strokeStyle = "#07080d";
          ctx.strokeText(bp.mangaCaption, 0, 0);
          ctx.fillStyle = scene.phase === "TAPI" ? "#fb7185" : "#fde047";
          ctx.fillText(bp.mangaCaption, 0, 0);
          ctx.restore();
        }
        drawScienceMeter(ctx, scene.visual?.meter, scene.phase, tSec);
        rendered3d = true;
      } catch (animeErr) {
        console.warn("Anime MAPPA fallback:", animeErr);
        animeMappaReady = false;
      }
    } else if (mode === "cinema_3d" && geminiCinemaReady && geminiCinema && scene.cinemaBlueprint) {
      try {
        const cKey = `${currentScript.topic || ""}::${sceneIndex}::${scene.cinemaRenderVersion || 1}`;
        geminiCinema.renderFrame(
          scene.cinemaBlueprint,
          cKey,
          tSec,
          sceneElapsedSec,
          sceneDurationSec,
          liveVoice
        );
        ctx.drawImage(geminiCinema.domElement, 0, 0, canvas.width, canvas.height);
        drawScienceMeter(ctx, scene.visual?.meter, scene.phase, tSec);
        if (scene.phase === "CLIMAX" || scene.visual?.fx?.includes("confetti")) {
          drawCelebrationConfetti(ctx, canvas.width, tSec);
        }
        rendered3d = true;
      } catch (cinErr) {
        console.warn("Gemini Cinema fallback to classic 3D:", cinErr);
        geminiCinemaReady = false;
      }
    }
    if (!rendered3d && stage3dReady && stage3d) {
      try {
        stage3d.renderFrame(scene, currentScript.topic || "", tSec, sceneElapsedSec);
        ctx.drawImage(stage3d.domElement, 0, 0, canvas.width, canvas.height);
        drawScienceMeter(ctx, scene.visual?.meter, scene.phase, tSec);
        if (scene.phase === "CLIMAX" || scene.visual?.fx?.includes("confetti")) {
          drawCelebrationConfetti(ctx, canvas.width, tSec);
        }
        rendered3d = true;
      } catch (glErr) {
        console.warn("3D frame fallback to 2.5D:", glErr);
        stage3dReady = false;
      }
    }
    if (!rendered3d) {
      renderToonVideoFrame(ctx, canvas.width, canvas.height, scene, tSec, sceneElapsedSec);
    }
  }

  // Light bottom gradient only near subtitle zone so 3D diorama stays bright @untabiru5 style!
  const subGrad = ctx.createLinearGradient(0, canvas.height - 175, 0, canvas.height);
  subGrad.addColorStop(0, "rgba(9, 10, 15, 0)");
  subGrad.addColorStop(1, "rgba(9, 10, 15, 0.58)");
  ctx.fillStyle = subGrad;
  ctx.fillRect(0, canvas.height - 175, canvas.width, 175);

  drawTopVideoHeader(ctx, scene);
  draw3dCalloutBadge(ctx, scene);
  drawDekodaHookCard(ctx, scene.visual, tSec, sceneElapsedSec);
  drawBelajarInfoPills(ctx, scene.visual, scene.phase, tSec);
  drawMilestoneStampBanner(ctx, scene.visual, scene, tSec, sceneElapsedSec);
  drawMaouVersusCard(ctx, scene.visual, tSec);
  drawSelamatStamp(ctx, scene, tSec);

  // 2. Consistent 2D Anime MC Raja Iblis Host reacting & pointing outside the video!
  drawMcRajaIblisPresenter(ctx, scene, tSec);
  drawUntabiruSubtitles(ctx, scene);
}

let isOfflineExporting = false;

function startRenderLoop() {
  function frame(now) {
    try {
      if (!isOfflineExporting) {
        const tSec = now / 1000;
        const sceneElapsedSec = Math.max(0, (now - sceneEnterTimestamp) / 1000);
        const audioBufEntry = sceneAudioBuffers.get(activeSceneIndex);
        const sceneDurationSec = audioBufEntry?.buffer?.duration || 4.6;
        renderCompositeFrame({
          sceneIndex: activeSceneIndex,
          tSec,
          sceneElapsedSec,
          sceneDurationSec,
          deterministicPhrase: false
        });
      }
    } catch (err) {
      console.error("Render frame error:", err);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ============================================================================
// EXPORT / DOWNLOAD 9:16 VIDEO (Deterministic H.264/AAC MP4 + MediaRecorder Fallback)
// ============================================================================
async function exportFullVideo() {
  if (!currentScript?.scenes?.length) return;
  unlockAudioContextSync();
  stopPlayback();
  exportVideoBtn.disabled = true;
  exportProgressBox.classList.remove("hidden");
  exportProgressFill.style.width = "8%";
  exportProgressText.textContent = "1/3: Memastikan animasi Gemini Cinema & audio siap...";

  const [targetW, targetH] = (exportQualitySelect?.value || "720x1280").split("x").map(Number);
  const safeName = (currentScript.topic || "maou_edu")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");

  try {
    const activeMode = getSelectedRenderMode();
    if (activeMode === "anime_mappa" && currentScript.scenes.some((s) => !s.animeBlueprint)) {
      exportProgressText.textContent = "1/3: Studio MAPPA menyusun animasi Anime Sakuga...";
      await renderScenesWithAnimeMappa();
    } else if (activeMode === "cinema_3d" && currentScript.scenes.some((s) => !s.cinemaBlueprint)) {
      exportProgressText.textContent = "1/3: Gemini Cinema mengompilasi animasi 3D HD...";
      await renderScenesWithGeminiCinema();
    }

    for (let i = 0; i < currentScript.scenes.length; i++) {
      exportProgressFill.style.width = `${10 + Math.round(((i + 1) / currentScript.scenes.length) * 24)}%`;
      exportProgressText.textContent = `1/3: Menyiapkan audio ElevenLabs Scene ${i + 1}/${currentScript.scenes.length}...`;
      await ensureSceneAudio(i);
    }

    const sceneTimings = currentScript.scenes.map((sc, i) => {
      const entry = sceneAudioBuffers.get(i);
      const phrases = sc.subtitlePhrases || parseSubtitlePhrasesClient(sc.narration || "");
      const fallbackDur = Math.max(3.2, phrases.length * 1.05);
      return {
        sceneIndex: i,
        audioBuffer: entry?.buffer || null,
        durationSec: entry?.buffer?.duration ? entry.buffer.duration + 0.15 : fallbackDur
      };
    });

    // Try Deterministic Frame-by-Frame H.264/AAC MP4 Encoder first (ZERO dropped frames!)
    isOfflineExporting = true;
    const prevCinemaW = geminiCinema?.width || 720;
    const prevCinemaH = geminiCinema?.height || 1280;
    const prevAnimeW = animeMappaEngine?.width || 720;
    const prevAnimeH = animeMappaEngine?.height || 1280;
    let mp4Result = { ok: false, fallbackRequired: true };
    try {
      if (activeMode === "anime_mappa" && animeMappaEngine && targetW && targetH) {
        animeMappaEngine.resize(targetW, targetH);
      } else if (activeMode === "cinema_3d" && geminiCinema && targetW && targetH) {
        geminiCinema.resize(targetW, targetH);
      }
      mp4Result = await exportDeterministicMp4Video({
        canvas,
        sceneTimings,
        fps: 30,
        width: targetW || 720,
        height: targetH || 1280,
        includeBgm: Boolean(toggleBgm?.checked),
        renderAtTime: ({ sceneIndex, tSec, sceneElapsedSec, sceneDurationSec }) => {
          activeSceneIndex = sceneIndex;
          renderCompositeFrame({
            sceneIndex,
            tSec,
            sceneElapsedSec,
            sceneDurationSec,
            deterministicPhrase: true
          });
        },
        onProgress: (pct, msg) => {
          exportProgressFill.style.width = `${pct}%`;
          exportProgressText.textContent = msg;
        }
      });
    } catch (encErr) {
      console.warn("WebCodecs MP4 encoder fallback to MediaRecorder:", encErr);
      mp4Result = { ok: false, fallbackRequired: true };
    } finally {
      if (animeMappaEngine) animeMappaEngine.resize(prevAnimeW, prevAnimeH);
      if (geminiCinema) geminiCinema.resize(prevCinemaW, prevCinemaH);
      isOfflineExporting = false;
    }

    if (mp4Result.ok && mp4Result.blob) {
      const url = URL.createObjectURL(mp4Result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_gemini_cinema_${mp4Result.width}x${mp4Result.height}.mp4`;
      a.click();
      exportProgressFill.style.width = "100%";
      exportProgressText.textContent = `✅ Video MP4 HD selesai (${mp4Result.frames} frame • ${mp4Result.width}×${mp4Result.height})!`;
      return;
    }

    // Fallback: Real-Time High-Bitrate MediaRecorder
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
      videoBitsPerSecond: 8000000
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
    const exportRunId = playbackRunId;
    isPlaying = true;
    startBgm(audioDest);

    for (let i = 0; i < currentScript.scenes.length; i++) {
      if (!isPlaying || exportRunId !== playbackRunId) break;
      activeSceneIndex = i;
      updateActiveSceneUI();
      exportProgressFill.style.width = `${40 + Math.round(((i + 1) / currentScript.scenes.length) * 60)}%`;
      exportProgressText.textContent = `2/2: Merender Video HD Scene ${i + 1} / ${currentScript.scenes.length}...`;
      await playSceneAudioAndWait(i, audioDest, exportRunId);
    }

    stopPlayback();
    recorder.stop();
    await donePromise;

    const blob = new Blob(chunks, { type: selectedMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_raja_iblis.${ext}`;
    a.click();

    exportProgressFill.style.width = "100%";
    exportProgressText.textContent = `✅ Video selesai di-download (${a.download})!`;
  } catch (e) {
    alert("Gagal render video: " + e.message);
  } finally {
    isOfflineExporting = false;
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
    const voiceInputEl = document.getElementById("elevenlabsVoiceIdInput");
    const voicePresetEl = document.getElementById("elevenlabsVoicePreset");
    voiceInputEl.value = keys.elevenlabsVoiceId;
    if (voicePresetEl) {
      const hasPreset = Array.from(voicePresetEl.options).some(
        (o) => o.value && o.value !== "__custom__" && o.value === keys.elevenlabsVoiceId
      );
      voicePresetEl.value = hasPreset ? keys.elevenlabsVoiceId : "__custom__";
      voiceInputEl.classList.toggle("hidden", hasPreset);
    }
    document.getElementById("elevenlabsApiKeyInput").value = keys.elevenlabsApiKey;
    document.getElementById("geminiApiKeyInput").value = keys.geminiApiKey;

    const hasEl = serverConfig.hasElevenlabsEnvKey || Boolean(keys.elevenlabsApiKey);
    document.getElementById("voiceStatusDot").classList.toggle("active-el", hasEl);
    document.getElementById("voiceStatusLabel").textContent = hasEl
      ? `ElevenLabs Only (${keys.elevenlabsVoiceId})`
      : `ElevenLabs Belum Diatur (Isi Key di ⚙️ API & Voice)`;
  } catch { }

  try {
    animeMappaEngine = new MaouAnimeMappaEngine(720, 1280);
    animeMappaReady = true;
  } catch (err) {
    console.warn("Anime MAPPA WebGL unavailable:", err);
    animeMappaReady = false;
  }

  try {
    geminiCinema = new MaouGeminiCinema(720, 1280);
    geminiCinemaReady = true;
  } catch (err) {
    console.warn("Gemini Cinema WebGL unavailable:", err);
    geminiCinemaReady = false;
  }

  try {
    stage3d = new Maou3DStage(canvas.width, canvas.height);
    stage3dReady = true;
  } catch (err) {
    console.warn("WebGL 3D unavailable, using 2.5D toon fallback:", err);
    stage3dReady = false;
  }

  syncRenderModeUI(localStorage.getItem("maou_render_mode") || "anime_mappa");
  if (renderModeGroup) {
    renderModeGroup.addEventListener("change", async (e) => {
      if (e.target?.name !== "renderMode") return;
      const nextMode = e.target.value;
      syncRenderModeUI(nextMode);
      sceneEnterTimestamp = performance.now();
      if (!currentScript?.scenes?.length) return;
      if (nextMode === "anime_mappa" && currentScript.scenes.some((s) => !s.animeBlueprint)) {
        await renderScenesWithAnimeMappa();
      } else if (nextMode === "cinema_3d" && currentScript.scenes.some((s) => !s.cinemaBlueprint)) {
        await renderScenesWithGeminiCinema();
      } else if (nextMode === "classic_3d") {
        aiEngineBadge.textContent = `🧱 3D Edukasi Klasik (${currentScript.scenes.length} Scene)`;
      }
    });
  }

  startRenderLoop();

  // Always start with an empty prompt column ready for user input
  simplePromptInput.value = "";
  videoTitleDisplay.textContent = "MaouEdu 9:16 Stage — Siap Prompt Baru";
  aiEngineBadge.textContent = "Siap • Ketik Prompt";
  sceneCounterDisplay.textContent = "Menunggu topikmu";
  renderResearchBox(null);
}

autoBuildVideoBtn.addEventListener("click", () => {
  runAutonomousPromptBuild(simplePromptInput.value.trim(), true);
});

simplePromptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    runAutonomousPromptBuild(simplePromptInput.value.trim(), true);
  }
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

if (renderGeminiCinemaBtn) {
  renderGeminiCinemaBtn.addEventListener("click", async () => {
    if (!currentScript?.scenes?.length) {
      alert("Ketik topik dan buat video dulu di kolom atas, lalu klik Render Animasi.");
      return;
    }
    await renderScenesForActiveMode();
  });
}

if (criticRefineBtn) {
  criticRefineBtn.addEventListener("click", async () => {
    await runGeminiVisualCritic(activeSceneIndex);
  });
}

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

const voicePresetSelect = document.getElementById("elevenlabsVoicePreset");
if (voicePresetSelect) {
  voicePresetSelect.addEventListener("change", () => {
    const inp = document.getElementById("elevenlabsVoiceIdInput");
    if (voicePresetSelect.value === "__custom__") {
      inp.classList.remove("hidden");
      inp.focus();
    } else if (voicePresetSelect.value) {
      inp.value = voicePresetSelect.value;
      inp.classList.add("hidden");
    }
  });
}

document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  const voiceId = document.getElementById("elevenlabsVoiceIdInput").value.trim() || "nPczCjzI2devNBz1zQrb";
  const elKey = document.getElementById("elevenlabsApiKeyInput").value.trim();
  const gemKey = document.getElementById("geminiApiKeyInput").value.trim();

  localStorage.setItem("maou_el_voice", voiceId);
  localStorage.setItem("maou_el_key", elKey);
  localStorage.setItem("maou_gemini_key", gemKey);

  const hasEl = serverConfig.hasElevenlabsEnvKey || Boolean(elKey);
  document.getElementById("voiceStatusDot").classList.toggle("active-el", hasEl);
  document.getElementById("voiceStatusLabel").textContent = hasEl
    ? `ElevenLabs Only (${voiceId})`
    : `ElevenLabs Belum Diatur (Isi Key di ⚙️ API & Voice)`;

  activeElevenlabsVoiceId = "";
  sceneAudioBuffers.clear();
  settingsModal.classList.add("hidden");
});

initStudio();
