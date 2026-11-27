// MaouEdu AI — 1-Prompt Auto-Research & Pure 2D Studio MAPPA Anime + 3D Classic Video Studio
import {
  renderToonVideoFrame,
  drawScienceMeter,
  drawCelebrationConfetti
} from "/toon-renderer.js";
import { Maou3DStage } from "/scene3d.js";
import {
  MaouAnimeMappaEngine,
  CHAR_POSE_URLS,
  chromaKeyAnimeCel,
  drawLiving2DAnimeHostCel
} from "/anime-mappa-engine.js";
import { exportDeterministicMp4Video } from "/video-engine/mp4-video-exporter.js";
import { MaouPromptToVideoWorkflow } from "/video-engine/prompt-to-video-workflow.js";
import { applyClientBaritoneDsp } from "/voice-dsp-client.js";

const canvas = document.getElementById("videoCanvas");
const ctx = canvas.getContext("2d");

// Load Locked MC Raja Iblis Character Asset (used in Standby & 3D Classic Host fallback)
const mcImage = new Image();
mcImage.crossOrigin = "anonymous";
mcImage.src = "/assets/mc_default.jpg";

// Preload & Chroma-Key the 4 mc_default.jpg-locked 2D Anime Poses for Living 3D Presenter Mode!
const mc3dPoseCache = new Map();
for (const [poseKey, url] of Object.entries(CHAR_POSE_URLS)) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    mc3dPoseCache.set(poseKey, chromaKeyAnimeCel(img));
  };
  img.src = url;
}

// Studio State
let currentScript = null;
let activeSceneIndex = 0;
let activePhraseIndex = 0;
let isPlaying = false;
let playbackRunId = 0;
let stage3d = null;
let stage3dReady = false;
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
  hasGeminiEnvKey: false,
  enableVeoHeroShots: false,
  styleAnchors: { haikei: false, kyara: false, masterSheet: false }
};

const sceneAudioBuffers = new Map();
const sceneVideoClips = new Map();
let mcAnimatedVideo = null;

// UI Elements
const simplePromptInput = document.getElementById("simplePromptInput");
const autoBuildVideoBtn = document.getElementById("autoBuildVideoBtn");
const toggleAutoVisionQc = document.getElementById("toggleAutoVisionQc");
const toggleAutoExportMp4 = document.getElementById("toggleAutoExportMp4");
const workflowStrip = document.getElementById("workflowStrip");
const workflowTotalTimer = document.getElementById("workflowTotalTimer");
const workflowModal = document.getElementById("workflowModal");
const workflowModalSubtitle = document.getElementById("workflowModalSubtitle");
const workflowModalList = document.getElementById("workflowModalList");
const openWorkflowBtn = document.getElementById("openWorkflowBtn");
const openWorkflowMapBtn = document.getElementById("openWorkflowMapBtn");
const promptWorkflow = new MaouPromptToVideoWorkflow();

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
const veoHeroToggleWrap = document.getElementById("veoHeroToggleWrap");
const toggleVeoHeroShots = document.getElementById("toggleVeoHeroShots");

function getSelectedRenderMode() {
  const checked = document.querySelector('input[name="renderMode"]:checked');
  const raw = checked?.value || localStorage.getItem("maou_render_mode") || "anime_mappa";
  return raw === "classic_3d" ? "classic_3d" : "anime_mappa";
}

function syncRenderModeUI(mode) {
  const activeMode = mode === "classic_3d" ? "classic_3d" : "anime_mappa";
  localStorage.setItem("maou_render_mode", activeMode);
  document.querySelectorAll(".render-mode-card").forEach((card) => {
    const isMatch = card.dataset.mode === activeMode;
    card.classList.toggle("active", isMatch);
    const rad = card.querySelector('input[type="radio"]');
    if (rad) rad.checked = isMatch;
  });
  if (renderGeminiCinemaBtn) {
    if (activeMode === "anime_mappa") {
      renderGeminiCinemaBtn.textContent = "⚔️ Render Ulang Anime 2D MAPPA (Gemini AI)";
      renderGeminiCinemaBtn.disabled = false;
    } else {
      renderGeminiCinemaBtn.textContent = "🧱 Mode 3D Klasik Aktif (Instant)";
      renderGeminiCinemaBtn.disabled = true;
    }
  }
}

// Local browser settings (never sent to GitHub)
function getLocalKeys() {
  const savedVoiceMode = localStorage.getItem("maou_voice_mode");
  const defaultVoiceMode =
    serverConfig.defaultVoiceProvider === "elevenlabs"
      ? "elevenlabs"
      : `free:${serverConfig.defaultFreePreset || "maou_overlord"}`;
  const voiceMode = savedVoiceMode || defaultVoiceMode;
  const isEl = voiceMode === "elevenlabs";
  let trainedVoiceProfile = null;
  try {
    const rawProf = localStorage.getItem("maou_trained_voice_profile");
    if (rawProf) trainedVoiceProfile = JSON.parse(rawProf);
  } catch {}
  return {
    voiceMode,
    voiceProvider: isEl ? "elevenlabs" : "gemini_free",
    voicePreset: isEl ? "maou_overlord" : voiceMode.replace(/^free:/, "") || "maou_overlord",
    trainedVoiceProfile,
    elevenlabsVoiceId:
      localStorage.getItem("maou_el_voice") || serverConfig.elevenlabsVoiceId || "nPczCjzI2devNBz1zQrb",
    elevenlabsApiKey: localStorage.getItem("maou_el_key") || "",
    geminiApiKey: localStorage.getItem("maou_gemini_key") || "",
    accessPin: localStorage.getItem("maou_access_pin") || ""
  };
}

function updateVoiceStatusUI(keysArg = null) {
  const keys = keysArg || getLocalKeys();
  const dot = document.getElementById("voiceStatusDot");
  const lbl = document.getElementById("voiceStatusLabel");
  const trainBadge = document.getElementById("voiceTrainBadge");
  if (keys.voiceProvider === "gemini_free") {
    const prof = keys.trainedVoiceProfile;
    const matchPct = prof?.estimatedMatchPct || (keys.voicePreset === "maou_overlord" ? 91 : 88);
    const vName = prof?.geminiVoiceName || (keys.voicePreset === "maou_chill" ? "Umbriel" : keys.voicePreset === "maou_intense" ? "Fenrir" : keys.voicePreset === "maou_narrator" ? "Charon" : "Algenib");
    const hasGem = serverConfig.hasGeminiEnvKey || Boolean(keys.geminiApiKey);
    if (dot) dot.classList.toggle("active-el", hasGem);
    if (lbl) lbl.textContent = hasGem ? `Suara Gratis Terlatih (~${matchPct}% • ${vName})` : "Gemini Key Belum Diatur";
    if (trainBadge) trainBadge.textContent = `Profil: ${vName} (~${matchPct}%)`;
  } else {
    const hasEl = serverConfig.hasElevenlabsEnvKey || Boolean(keys.elevenlabsApiKey);
    if (dot) dot.classList.toggle("active-el", hasEl);
    if (lbl) lbl.textContent = hasEl ? `ElevenLabs (${keys.elevenlabsVoiceId})` : "ElevenLabs Belum Diatur";
  }
}

function buildDirectorHeaders() {
  const keys = getLocalKeys();
  const h = { "Content-Type": "application/json" };
  if (keys.accessPin) h["X-Access-Pin"] = keys.accessPin;
  return h;
}

let directorBrainState = null;
let vtThumbDataUrl = "";

async function fetchDirectorBrain() {
  try {
    const resp = await fetch("/api/director/playbook");
    const data = await resp.json();
    if (resp.ok && data) {
      directorBrainState = data;
      renderAiBrainUI(data);
    }
    return data;
  } catch (err) {
    console.warn("Fetch AI Brain warning:", err);
    return null;
  }
}

function renderAiBrainUI(state) {
  if (!state) return;
  const pb = state.playbook || { version: 1 };
  const verLabel = document.getElementById("aiBrainVersionLabel");
  if (verLabel) verLabel.textContent = `v${pb.version || 1}`;

  const activeBadge = document.getElementById("aiBrainActiveBadge");
  if (activeBadge) activeBadge.textContent = `Playbook v${pb.version || 1}`;

  const statusLine = document.getElementById("aiBrainStatusLine");
  if (statusLine) {
    const icon = state.configured && state.schemaReady ? "🟢" : state.configured ? "🟠" : "🟡";
    statusLine.textContent = `${icon} ${state.statusMessage || "Playbook Lokal Aktif"}`;
  }

  const pbSummary = document.getElementById("aiBrainPlaybookSummary");
  if (pbSummary) {
    const pacing = pb.pacing_rules || {};
    const negs = Array.isArray(pb.negative_constraints) ? pb.negative_constraints : [];
    pbSummary.classList.remove("hidden");
    pbSummary.innerHTML = `
      <div><strong>Changelog:</strong> ${escapeHtml(pb.changelog || "-")}</div>
      <div style="font-size:0.74rem;margin-top:4px;">
        <strong>Pacing:</strong> Cut <code>${pacing.avg_cut_duration_sec ?? 2.4}s</code> • Hook <code>${pacing.hook_duration_sec ?? 2.5}s</code> • Rasio Host/Cutaway <code>${pacing.host_vs_cutaway_ratio || "45:55"}</code>
      </div>
      <div style="font-size:0.73rem;margin-top:4px;opacity:0.9;"><strong>Guidelines:</strong> ${escapeHtml(pb.prompt_guidelines || "")}</div>
      <div style="font-size:0.72rem;margin-top:4px;color:#fda4af;"><strong>Larangan Ketat:</strong> ${negs.slice(0, 6).map((x) => escapeHtml(x)).join(" • ") || "-"}</div>
    `;
  }

  const rollSel = document.getElementById("rollbackVersionSelect");
  if (rollSel && Array.isArray(state.history)) {
    rollSel.innerHTML = state.history
      .map((h) => {
        const selected = h.version === pb.version ? "selected" : "";
        return `<option value="${h.version}" ${selected}>v${h.version}${h.is_active ? " (AKTIF)" : ""} — ${escapeHtml(String(h.changelog || "").slice(0, 38))}</option>`;
      })
      .join("");
  }

  const misBox = document.getElementById("learnedMistakesListBox");
  if (misBox) {
    const list = Array.isArray(state.mistakes) ? state.mistakes : [];
    misBox.innerHTML = list.length
      ? list
          .map(
            (m) => `
            <div class="brain-item">
              <div><strong>[${escapeHtml(m.category)} • Sev ${m.severity}/5 • x${m.occurrences}]</strong> ${escapeHtml(m.symptom)}</div>
              <div style="color:#fda4af;font-size:0.71rem;">❌ Hindari: ${escapeHtml(m.bad_pattern)}</div>
              <div style="color:#6ee7b7;font-size:0.71rem;">✅ Aturan: ${escapeHtml(m.corrective_rule)}</div>
            </div>`
          )
          .join("")
      : `<div class="field-hint">Belum ada catatan cacat/aneh tersimpan. Tandai scene 👎 Aneh atau jalankan Auto-Critic agar AI belajar otomatis.</div>`;
  }

  const vtBox = document.getElementById("vtRefListBox");
  if (vtBox) {
    const vts = Array.isArray(state.vtReferences) ? state.vtReferences : [];
    vtBox.innerHTML = vts.length
      ? vts
          .map(
            (v) => `
            <div class="brain-item">
              <div><strong>🎬 ${escapeHtml(v.title)}</strong> • Avg Cut <code>${v.avg_cut_duration_sec}s</code> • Rasio <code>${escapeHtml(v.camera_patterns?.host_vs_cutaway_ratio || "-")}</code></div>
              <div style="font-size:0.71rem;opacity:0.86;">Hook: ${escapeHtml(v.hook_structure?.hook_formula || v.source_notes || "-")}</div>
            </div>`
          )
          .join("")
      : `<div class="field-hint">Belum ada referensi VT yang di-ingest.</div>`;
  }
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

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatStageDuration(ms) {
  if (!ms || ms <= 0) return "";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function getStatusBadgeLabel(stage) {
  if (stage.status === "running") return "⏳ Proses...";
  if (stage.status === "done") return stage.metric || formatStageDuration(stage.elapsedMs) || "✅ OK";
  if (stage.status === "skipped") return "⏭️ Lewat";
  if (stage.status === "error") return "⚠️ Error";
  return "Menunggu";
}

function renderWorkflowUI(snapshot) {
  if (workflowTotalTimer) {
    if (snapshot.isRunning) {
      const runningStage = snapshot.stages.find((s) => s.status === "running");
      workflowTotalTimer.textContent = runningStage
        ? `⏳ Tahap ${runningStage.step}/7: ${runningStage.shortLabel.replace(/^\d+\.\s*/, "")}`
        : "⏳ Menjalankan Workflow...";
    } else if (snapshot.totalElapsedMs > 0) {
      workflowTotalTimer.textContent = `✅ Selesai dalam ${formatStageDuration(snapshot.totalElapsedMs)}`;
    } else {
      workflowTotalTimer.textContent = "⚡ Workflow Siap • 7 Tahap";
    }
  }

  if (workflowStrip) {
    workflowStrip.innerHTML = snapshot.stages
      .map((st, idx) => {
        const arrow = idx < snapshot.stages.length - 1 ? `<div class="wf-chip-arrow">→</div>` : "";
        const safeTitle = escapeHtml(st.title);
        const safeDetail = escapeHtml(st.detail);
        const safeBadge = escapeHtml(getStatusBadgeLabel(st));
        return `
          <button type="button" class="wf-chip ${escapeHtml(st.status)}" data-stage-id="${escapeHtml(st.id)}" title="${safeTitle}: ${safeDetail}">
            <div class="wf-chip-top">
              <span>${st.icon} ${escapeHtml(st.shortLabel)}</span>
              <span class="wf-chip-badge">${safeBadge}</span>
            </div>
            <div class="wf-chip-detail">${safeDetail}</div>
          </button>${arrow}
        `;
      })
      .join("");

    workflowStrip.querySelectorAll(".wf-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        openWorkflowModal(chip.dataset.stageId);
      });
    });
  }

  if (workflowModalSubtitle && snapshot.activeTopic) {
    workflowModalSubtitle.textContent = `Topik aktif: "${snapshot.activeTopic}" • Mode: ${
      snapshot.renderMode === "classic_3d" ? "🧱 3D Klasik" : "⚔️ Anime 2D Studio MAPPA"
    }${snapshot.totalElapsedMs ? ` • Total waktu: ${formatStageDuration(snapshot.totalElapsedMs)}` : ""}`;
  }

  if (workflowModalList) {
    workflowModalList.innerHTML = snapshot.stages
      .map((st, idx) => {
        const dur = formatStageDuration(st.elapsedMs);
        const canRerun = Boolean(st.rerunAction && currentScript?.scenes?.length && !snapshot.isRunning);
        const rerunLabelMap = {
          rerunProduction: "⚔️ Render Ulang Visual",
          rerunVisionQc: "👁️ Jalankan Vision QC",
          rerunVoice: "🎙️ Rekam Ulang Suara",
          rerunExport: "⬇️ Export Video MP4"
        };
        const arrow = idx < snapshot.stages.length - 1 ? `<div class="wf-node-arrow">↓</div>` : "";
        return `
          <div class="wf-node-card ${escapeHtml(st.status)}" data-modal-stage="${escapeHtml(st.id)}">
            <div class="wf-node-head">
              <div class="wf-node-title">${st.step}. ${st.icon} ${escapeHtml(st.title)}</div>
              <div class="wf-node-meta">
                <span class="badge badge-outline">${escapeHtml(st.actor)}</span>
                <code>${escapeHtml(st.endpoint)}</code>
                <span class="wf-chip-badge">${escapeHtml(getStatusBadgeLabel(st))}${dur ? ` • ${escapeHtml(dur)}` : ""}</span>
              </div>
            </div>
            <div class="wf-node-desc">${escapeHtml(st.description)}</div>
            <div class="wf-node-foot">
              <span><strong>Status &amp; Output:</strong> ${escapeHtml(st.detail)}</span>
              ${
                canRerun
                  ? `<button type="button" class="btn btn-secondary btn-sm wf-rerun-btn" data-rerun="${escapeHtml(st.rerunAction)}">${
                      rerunLabelMap[st.rerunAction] || "🔄 Jalankan"
                    }</button>`
                  : ""
              }
            </div>
          </div>${arrow}
        `;
      })
      .join("");

    workflowModalList.querySelectorAll(".wf-rerun-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const act = btn.dataset.rerun;
        workflowModal?.classList.add("hidden");
        if (act === "rerunProduction") await renderScenesForActiveMode();
        else if (act === "rerunVisionQc") await runGeminiVisualCritic(activeSceneIndex);
        else if (act === "rerunVoice") {
          promptWorkflow.beginStage("voice", "Merekam ulang suara ElevenLabs...");
          let okCount = 0;
          for (let i = 0; i < (currentScript?.scenes?.length || 0); i++) {
            const e = await ensureSceneAudio(i);
            if (e?.buffer) okCount++;
          }
          promptWorkflow.completeStage(
            "voice",
            `${okCount}/${currentScript?.scenes?.length || 0} audio ElevenLabs siap`,
            `${okCount}/${currentScript?.scenes?.length || 0} OK`
          );
        } else if (act === "rerunExport") await exportFullVideo();
      });
    });
  }
}

function openWorkflowModal(focusStageId = null) {
  if (!workflowModal) return;
  renderWorkflowUI(promptWorkflow.getSnapshot());
  workflowModal.classList.remove("hidden");
  if (focusStageId) {
    const targetCard = workflowModalList?.querySelector(`[data-modal-stage="${focusStageId}"]`);
    targetCard?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

promptWorkflow.subscribe(renderWorkflowUI);

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
// 1-PROMPT AUTONOMOUS WORKFLOW (Prompt -> Research -> Script -> Visual 2D/3D -> Vision QC -> ElevenLabs -> Video/MP4)
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
  autoBuildVideoBtn.textContent = "⏳ Menjalankan Workflow...";

  const activeMode = getSelectedRenderMode();
  const autoVisionQc = Boolean(toggleAutoVisionQc?.checked);
  const autoExportMp4 = Boolean(toggleAutoExportMp4?.checked);
  const keys = getLocalKeys();
  const refUrl = tiktokUrlInput.value.trim();

  try {
    await promptWorkflow.execute({
      prompt: cleanPrompt,
      referenceUrl: refUrl,
      renderMode: activeMode,
      autoVisionQc,
      autoExportMp4,
      handlers: {
        onResearchAndScript: async ({ prompt, referenceUrl }) => {
          autoBuildVideoBtn.textContent = "🔍 2-3/7 Riset Online & Script...";
          const resp = await fetch("/api/research-and-script", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              referenceUrl,
              geminiApiKey: keys.geminiApiKey
            })
          });
          const data = await resp.json();
          if (!resp.ok || data.error) throw new Error(data.error || "Gagal membuat video.");
          return data;
        },

        onScriptReady: async (data) => {
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
        },

        onVisualProduction: async (data) => {
          if (activeMode === "anime_mappa") {
            autoBuildVideoBtn.textContent = `⚔️ 4/7 Anime 2D MAPPA (${data.scenes.length} Scene)...`;
            return await renderScenesWithAnimeMappa();
          }
          return { ok: true };
        },

        onVisionQc: async (data) => {
          // Pick the key dramatic TAPI/CLIMAX scene (or scene 0) for automatic Gemini Vision inspection
          const peakIdx = Math.max(
            0,
            data.scenes.findIndex((s) => s.phase === "TAPI" || s.phase === "CLIMAX")
          );
          autoBuildVideoBtn.textContent = `👁️ 5/7 Gemini Vision QC Scene #${peakIdx + 1}...`;
          return await runGeminiVisualCritic(peakIdx);
        },

        onVoiceSynthesis: async (data, onVoiceProgress) => {
          let readyCount = 0;
          let lastError = "";
          const curKeys = getLocalKeys();
          for (let i = 0; i < data.scenes.length; i++) {
            const labelProvider = curKeys.voiceProvider === "elevenlabs" ? "ElevenLabs" : "Suara Gratis (~91%)";
            autoBuildVideoBtn.textContent = `🎙️ 6/7 ${labelProvider} ${i + 1}/${data.scenes.length}...`;
            const entry = await ensureSceneAudio(i);
            if (entry?.buffer) {
              readyCount++;
            } else {
              const lbl = document.getElementById(`audioStatus_${i}`)?.textContent || "";
              if (lbl) lastError = lbl;
            }
            onVoiceProgress?.(i + 1, data.scenes.length);
            if (curKeys.voiceProvider === "gemini_free" && !entry?.cached && entry?.provider === "gemini_free" && i < data.scenes.length - 1) {
              await new Promise((r) => setTimeout(r, 650));
            }
          }
          return {
            readyCount,
            voiceId: curKeys.voiceProvider === "gemini_free" ? curKeys.voicePreset : (activeElevenlabsVoiceId || curKeys.elevenlabsVoiceId),
            lastError
          };
        },

        onExportMp4: async () => {
          autoBuildVideoBtn.textContent = "🎬 7/7 Export Video MP4 HD...";
          return await exportFullVideo();
        },

        onFinalizePreview: async () => {
          if (activeMode === "anime_mappa" && animeMappaEngine && currentScript?.scenes?.length) {
            await animeMappaEngine.ensureAssetsReady(
              currentScript.scenes.map((s) => s.animeBlueprint).filter(Boolean)
            );
          }
          if (autoPlayAfter) {
            playFullVideo();
          }
        }
      }
    });

    autoBuildVideoBtn.textContent = "✨ Buat Video Otomatis";
    autoBuildVideoBtn.disabled = false;
  } catch (e) {
    alert("Terjadi kendala saat menjalankan workflow video: " + e.message);
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

async function renderScenesWithAnimeMappa(singleIdx = null) {
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
        ? `⏳ Menggambar Genga 2D Scene #${singleIdx + 1}...`
        : `⚔️ Studio MAPPA 2D Director (${currentScript.scenes.length} Scene)...`;
  }

  try {
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
      throw new Error(data.error || "Gagal merender animasi Anime 2D Studio MAPPA.");
    }

    if (data.runId) currentScript.runId = data.runId;
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
    if (data.playbookVersion && document.getElementById("aiBrainVersionLabel")) {
      document.getElementById("aiBrainVersionLabel").textContent = `v${data.playbookVersion}`;
    }

    if (visualFoundationBox) {
      const allBps = currentScript.scenes.map((s) => s.animeBlueprint).filter(Boolean);
      const bgs = Array.from(new Set(allBps.map((s) => s.haikeiBg || "shibuya_night"))).slice(0, 4);
      const impactCount = allBps.filter((s) => s.impactBeat?.enabled).length;
      const gengaLabel =
        typeof data.customGengaCount === "number"
          ? `${data.customGengaCount}/${(data.scenes || []).length} Genga SVG Gemini`
          : `${allBps.length} Genga 2D`;
      visualFoundationBox.classList.remove("hidden");
      visualFoundationBox.innerHTML = `
        <div><strong>⚔️ Produksi Anime 2D — Studio MAPPA (${currentScript.scenes.length} Scene)</strong></div>
        <div style="font-size:0.76rem;margin-top:2px;">Haikei 2D: <code>${bgs.join(" → ")}</code> • <code>${gengaLabel}</code> • Impact Frames: <code>${impactCount} momen</code></div>
        <div style="font-size:0.75rem;margin-top:3px;">${data.directorNotes || ""}</div>
      `;
    }

    if (getSelectedRenderMode() === "anime_mappa" && animeMappaEngine) {
      const targetBps = singleIdx !== null
        ? [currentScript.scenes[singleIdx]?.animeBlueprint].filter(Boolean)
        : currentScript.scenes.map((s) => s.animeBlueprint).filter(Boolean);
      await animeMappaEngine.ensureAssetsReady(targetBps);
    }

    aiEngineBadge.textContent = `⚔️ Anime 2D MAPPA (${data.directorModel} • ${currentScript.scenes.length} Scene)`;
    sceneEnterTimestamp = performance.now();
    renderSceneList();
    updateActiveSceneUI();
    return {
      ok: true,
      directorModel: data.directorModel,
      customGengaCount: data.customGengaCount || 0,
      warning: data.warning || null
    };
  } catch (err) {
    console.warn("Anime 2D MAPPA render warning:", err);
    return { ok: false, warning: err.message, customGengaCount: 0 };
  } finally {
    syncRenderModeUI(getSelectedRenderMode());
  }
}

async function renderScenesForActiveMode(singleIdx = null) {
  const mode = getSelectedRenderMode();
  if (mode === "anime_mappa") {
    promptWorkflow.beginStage("production", "Menyutradarai & menggambar Genga 2D...");
    const res = await renderScenesWithAnimeMappa(singleIdx);
    if (res?.ok) {
      promptWorkflow.completeStage(
        "production",
        `${res.customGengaCount}/${currentScript?.scenes?.length || 1} Genga SVG • ${res.directorModel}`,
        `${res.customGengaCount} Genga`
      );
    } else {
      promptWorkflow.failStage("production", res?.warning || "Fallback 2D aktif");
    }
    return res;
  }
  return { ok: true };
}

async function submitSceneFeedback(idx, rating, btnEl) {
  const sc = currentScript?.scenes?.[idx];
  if (!sc) return;
  const note = String(sc.userFeedbackNote || "").trim();
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = rating === "weird" ? "🧬..." : "⏳";
  }

  let previewDataUrl = "";
  try {
    renderCompositeFrame({
      sceneIndex: idx,
      tSec: performance.now() / 1000,
      sceneElapsedSec: 1.4,
      sceneDurationSec: sceneAudioBuffers.get(idx)?.buffer?.duration || 4.6
    });
    previewDataUrl = canvas.toDataURL("image/jpeg", 0.65);
  } catch {}

  try {
    const keys = getLocalKeys();
    const abp = sc.animeBlueprint || {};
    const resp = await fetch("/api/director/feedback", {
      method: "POST",
      headers: buildDirectorHeaders(),
      body: JSON.stringify({
        runId: currentScript.runId || null,
        topic: currentScript.topic || currentScript.title || "",
        sceneIndex: idx,
        sceneType: abp.enableAlternatingCutaway && idx % 2 === 1 ? "cutaway" : "host",
        promptUsed: abp.haikeiPrompt || abp.cutawayPrompt || sc.plainNarration || sc.narration || "",
        motionConfig: {
          cameraMotion2d: abp.cameraMotion2d,
          characterPose: abp.characterPose,
          satsueiGrade: abp.satsueiGrade
        },
        criticScore: sc.criticScore10 ?? null,
        criticDefects: sc.criticDefects || [],
        retryCount: sc.criticRetries || 0,
        userRating: rating,
        userNote: note,
        previewDataUrl,
        geminiApiKey: keys.geminiApiKey
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || "Gagal menyimpan feedback.");

    if (data.runId) currentScript.runId = data.runId;
    sc.userRating = rating;
    renderSceneList();

    if (data.evolved && data.playbook) {
      await fetchDirectorBrain();
      if (criticResultBox) {
        criticResultBox.classList.remove("hidden");
        criticResultBox.innerHTML = `<div>🧬 <strong>AI Brain Self-Upgraded → Playbook v${data.playbook.version}!</strong> (${escapeHtml(data.playbook.changelog || "")})</div>`;
      }
    } else if (data.localOnly && rating === "weird" && note) {
      saveCinemaStyleLesson(`Hindari pola aneh: ${note}`, 65);
    }
  } catch (err) {
    alert(`Feedback gagal: ${err.message}`);
  } finally {
    if (btnEl) btnEl.disabled = false;
  }
}

async function runGeminiVisualCritic(targetIdx = activeSceneIndex) {
  if (!currentScript?.scenes?.[targetIdx]) {
    alert("Buat video terlebih dahulu agar Gemini Vision bisa melihat dan mengevaluasi frame-nya.");
    return { error: "Belum ada scene" };
  }
  const scene = currentScript.scenes[targetIdx];
  const activeMode = getSelectedRenderMode();
  if (activeMode === "anime_mappa" && !scene.animeBlueprint) {
    await renderScenesWithAnimeMappa(targetIdx);
  }
  if (activeMode === "anime_mappa" && animeMappaEngine && scene.animeBlueprint) {
    await animeMappaEngine.ensureAssetsReady([scene.animeBlueprint]);
  }
  activeSceneIndex = targetIdx;
  updateActiveSceneUI();

  if (criticRefineBtn) {
    criticRefineBtn.disabled = true;
    criticRefineBtn.textContent = `👁️ Gemini Vision Menilai Scene #${targetIdx + 1}...`;
  }
  if (criticResultBox) {
    criticResultBox.classList.remove("hidden");
    criticResultBox.innerHTML = `<div>👁️ Mengirim tangkapan layar Scene #${targetIdx + 1} (${activeMode === "anime_mappa" ? "Anime 2D MAPPA" : "3D Klasik"}) ke <strong>Gemini Multimodal Vision</strong>...</div>`;
  }

  try {
    const keys = getLocalKeys();
    let retryCount = 0;
    let data = null;
    let usedFallbackRoute = false;

    while (retryCount <= 2) {
      if (retryCount > 0 && criticResultBox) {
        criticResultBox.innerHTML = `<div>🛠️ <strong>Auto-Heal Retry ${retryCount}/2</strong> Scene #${targetIdx + 1}: menerapkan perbaikan bedah Playbook &amp; memeriksa ulang...</div>`;
      }

      renderCompositeFrame({
        sceneIndex: targetIdx,
        tSec: performance.now() / 1000,
        sceneElapsedSec: 1.4,
        sceneDurationSec: sceneAudioBuffers.get(targetIdx)?.buffer?.duration || 4.6
      });
      const frameDataUrl = canvas.toDataURL("image/jpeg", 0.78);
      const targetBlueprint = activeMode === "anime_mappa" ? scene.animeBlueprint : null;

      let resp = await fetch("/api/director/critic", {
        method: "POST",
        headers: buildDirectorHeaders(),
        body: JSON.stringify({
          frameDataUrl,
          blueprint: targetBlueprint,
          scene,
          topic: currentScript.topic || currentScript.title || "",
          runId: currentScript.runId || null,
          sceneIndex: targetIdx,
          retryCount,
          geminiApiKey: keys.geminiApiKey
        })
      });

      if (resp.status === 401 || resp.status === 403) {
        // Fallback smoothly to stateless local Vision Critic if Access PIN is not yet set in browser
        usedFallbackRoute = true;
        resp = await fetch("/api/video-critic", {
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
      }

      data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Gagal mengevaluasi frame.");

      if (data.runId) currentScript.runId = data.runId;
      if (data.refinedBlueprint && activeMode === "anime_mappa") {
        currentScript.scenes[targetIdx].animeBlueprint = data.refinedBlueprint;
        currentScript.scenes[targetIdx].animeRenderVersion = Date.now();
        scene = currentScript.scenes[targetIdx];
        if (animeMappaEngine) await animeMappaEngine.ensureAssetsReady([scene.animeBlueprint]);
      }

      if (data.needsRetry && retryCount < 2 && !usedFallbackRoute) {
        retryCount++;
        continue;
      }
      break;
    }

    if (data.overallScore || data.overallScore10) {
      currentScript.scenes[targetIdx].criticScore = data.overallScore || Math.round((data.overallScore10 || 8) * 10);
      currentScript.scenes[targetIdx].criticScore10 = data.overallScore10 ?? Number(((data.overallScore || 80) / 10).toFixed(1));
      currentScript.scenes[targetIdx].criticPass = data.pass !== false;
      currentScript.scenes[targetIdx].criticDefects = Array.isArray(data.defects) ? data.defects : [];
      currentScript.scenes[targetIdx].criticRetries = retryCount;
    }
    if (data.styleLesson) {
      saveCinemaStyleLesson(data.styleLesson, data.overallScore);
    }
    if (data.evolvedPlaybook) {
      fetchDirectorBrain();
    }

    const memCount = getCinemaStyleMemory().length;
    if (criticResultBox) {
      const s10 = data.scores10 || null;
      const cr = data.criteria || null;
      const bd = data.breakdown || {};
      const passBadge = data.pass === false ? "⚠️ PERLU POLES" : "✅ PASS";
      const metricsHtml = s10
        ? `Anatomi <strong>${s10.anatomy_coherence}/10</strong> • Karakter <strong>${s10.character_consistency}/10</strong> • Gaya 2D <strong>${s10.anime_style_fidelity}/10</strong> • Layout <strong>${s10.layout_safety}/10</strong>`
        : cr
          ? `Cel 2D <strong>${cr.celAuthenticity}</strong> • Key/Light <strong>${cr.chromaLightIntegration}</strong> • Readability <strong>${cr.satsueiReadability}</strong> • Balance <strong>${cr.compositionBalance}</strong>`
          : `Framing ${bd.framing || "-"} • Lighting ${bd.lighting || "-"} • Depth ${bd.depthAndBokeh || "-"} • Vibe ${bd.cinematicVibe || "-"}`;
      const issuesHtml =
        Array.isArray(data.issues) && data.issues.length
          ? `<div style="margin-top:3px;font-size:0.72rem;color:#fca5a5;">Isu: ${data.issues.map((x) => escapeHtml(x)).join(" • ")}</div>`
          : "";
      const adj = data.shader_adjustments || null;
      const adjSummary = adj
        ? `Bloom ${adj.bloom_intensity ?? "-"} • LightWrap ${adj.light_wrap_strength ?? "-"} • Crush ${adj.shadow_crush ?? "-"} • Ambient ${adj.ambient_harmonization ?? "-"}`
        : "Patch otomatis diterapkan";
      const pinHint = usedFallbackRoute
        ? `<div style="margin-top:3px;font-size:0.71rem;color:#fde68a;">🔒 Isi App Access PIN di 🧠 AI Brain agar hasil QC &amp; auto-learn tersimpan ke Supabase.</div>`
        : "";
      const retryBadge = retryCount > 0 ? ` • 🛠️ Auto-Heal ${retryCount}/2` : "";
      const scoreTitle = data.overallScore10 !== undefined
        ? `${data.overallScore10}/10 (${data.overallScore}/100)`
        : `${data.overallScore}/100`;

      criticResultBox.classList.remove("hidden");
      criticResultBox.innerHTML = `
        <div><strong>👁️ Director QC Gate (${escapeHtml(data.visionModel)}): ${scoreTitle} • ${passBadge}${retryBadge}</strong></div>
        <div style="font-size:0.72rem;opacity:0.92;margin-top:2px;">${metricsHtml}</div>
        <div style="margin-top:4px;">${escapeHtml(data.critique)}</div>
        ${issuesHtml}
        <div style="margin-top:4px;color:#fde68a;font-size:0.74rem;">✅ ${adjSummary} • Memori: <strong>${memCount}</strong></div>
        ${pinHint}
      `;
    }
    sceneEnterTimestamp = performance.now();
    renderSceneList();
    updateActiveSceneUI();
    if (!promptWorkflow.isRunning) {
      promptWorkflow.completeStage(
        "vision_qc",
        `Skor ${data.overallScore}/100 (${data.visionModel}) • Satsuei dipoles`,
        `⭐ ${data.overallScore}`
      );
    }
    return data;
  } catch (err) {
    if (criticResultBox) {
      criticResultBox.classList.remove("hidden");
      criticResultBox.innerHTML = `<div>⚠️ Gemini Vision QC gagal: ${err.message}</div>`;
    }
    if (!promptWorkflow.isRunning) {
      promptWorkflow.failStage("vision_qc", err.message);
    }
    return { error: err.message };
  } finally {
    if (criticRefineBtn) {
      criticRefineBtn.disabled = false;
      criticRefineBtn.textContent = "👁️ Evaluasi & Upgrade Visual (Gemini Vision)";
    }
  }
}

async function runVeoHeroShot(targetIdx) {
  const scene = currentScript?.scenes?.[targetIdx];
  if (!scene?.animeBlueprint) return;
  if (!serverConfig.enableVeoHeroShots) {
    alert("Veo Hero-Shot Mode sedang nonaktif (ENABLE_VEO_HERO_SHOTS=false).");
    return;
  }
  if (!scene.animeBlueprint.is_hero_shot) {
    alert("Cost-Control Guard: Hanya scene berstatus Hero Shot (Hook / Climax) yang dapat dianimasikan via Veo.");
    return;
  }

  activeSceneIndex = targetIdx;
  updateActiveSceneUI();
  if (animeMappaEngine) {
    await animeMappaEngine.ensureAssetsReady([scene.animeBlueprint]);
  }
  // Render pure clean Satsuei keyframe (without subtitles/header) for Veo Image-to-Video!
  animeMappaEngine.renderFrame(
    scene.animeBlueprint,
    `veo_seed_${targetIdx}_${Date.now()}`,
    1.2,
    1.2,
    4.6,
    0.2,
    { showCharacter: Boolean(toggleMcOverlay?.checked), scene }
  );
  const keyframeDataUrl = animeMappaEngine.captureSnapshotDataUrl(0.9);
  if (!keyframeDataUrl) {
    alert("Gagal mengambil keyframe 2D untuk Veo Hero-Shot.");
    return;
  }

  const keys = getLocalKeys();
  const startResp = await fetch("/api/veo-hero", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "start",
      keyframeDataUrl,
      scene,
      blueprint: scene.animeBlueprint,
      topic: currentScript.topic || currentScript.title || "",
      geminiApiKey: keys.geminiApiKey
    })
  });
  const startData = await startResp.json();
  if (!startData.ok || !startData.operationName) {
    alert("Veo Hero-Shot gagal dimulai: " + (startData.error || "Unknown error"));
    return;
  }

  // Poll up to ~120s without hitting Vercel 60s single-request limit
  for (let attempt = 0; attempt < 24; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));
    const pollResp = await fetch("/api/veo-hero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "poll",
        operationName: startData.operationName,
        geminiApiKey: keys.geminiApiKey
      })
    });
    const pollData = await pollResp.json();
    if (!pollData.ok) {
      alert("Veo Hero-Shot gagal: " + (pollData.error || "Polling error"));
      return;
    }
    if (pollData.done && pollData.videoDataUrl) {
      const videoEl = await loadVideoElement(pollData.videoDataUrl);
      sceneVideoClips.set(targetIdx, {
        videoEl,
        url: pollData.videoDataUrl,
        isVeoHero: true,
        status: "succeed",
        message: "✅ Veo Hero-Shot (2D Satsuei)"
      });
      renderSceneList();
      updateActiveSceneUI();
      return;
    }
  }
  alert("Veo Hero-Shot masih memproses di server Google; coba lagi beberapa saat.");
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
    const qcScore = scene.criticScore ? ` • ⭐${scene.criticScore}` : "";
    const abp = scene.animeBlueprint;
    const animBadge = abp
      ? `⚔️ Anime 2D (${abp.haikeiBg || "shibuya_night"}${abp.is_hero_shot ? " • ⭐Hero" : ""}${abp.impactBeat?.enabled ? " • ⚡Impact" : ""}${qcScore})`
      : scene.visual?.stage3d?.objects?.length
        ? `🧱 3D Klasik (${scene.visual.stage3d.objects.length} objek)`
        : scene.visual?.heroObject
          ? `🧱 3D @untabiru5`
          : "";
    const clipBadge = clipInfo?.videoEl
      ? clipInfo.isVeoHero
        ? "🎞️ Veo Hero-Shot (Satsuei)"
        : "🎥 Klip MP4 Siap"
      : animBadge;
    const veoBtnHtml =
      serverConfig.enableVeoHeroShots && abp?.is_hero_shot
        ? `<button class="btn btn-secondary btn-sm veo-hero-scene-btn" data-idx="${index}" title="Animasikan keyframe Hero Shot ini via Google Veo (cost-controlled)">🎞️ Veo</button>`
        : "";

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
          <button class="btn btn-secondary btn-sm rerender-cinema-btn" data-idx="${index}" title="Gambar ulang ilustrasi & animasi Anime 2D MAPPA untuk scene ini">⚔️ Anime 2D</button>
          <button class="btn btn-secondary btn-sm critic-scene-btn" data-idx="${index}" title="Evaluasi & upgrade visual scene ini via Gemini Vision">👁️ QC</button>
          ${veoBtnHtml}
          <label class="btn btn-secondary btn-sm" style="cursor:pointer;" title="Upload klip MP4 sendiri">
            📁 MP4
            <input type="file" accept="video/mp4,video/webm" class="upload-scene-mp4 hidden" data-idx="${index}" />
          </label>
          <button class="btn btn-secondary btn-sm play-single-btn" data-idx="${index}">🔊 Tes</button>
        </div>
      </div>
      <div class="scene-feedback-bar">
        <button type="button" class="btn btn-secondary btn-sm btn-rate-good ${scene.userRating === "good" ? "rated" : ""}" data-idx="${index}" title="Bagus / Keren">👍</button>
        <button type="button" class="btn btn-secondary btn-sm btn-rate-weird ${scene.userRating === "weird" ? "rated" : ""}" data-idx="${index}" title="Tandai aneh agar AI otomatis belajar & upgrade Playbook">👎 Aneh</button>
        <input type="text" class="scene-feedback-note" data-idx="${index}" value="${escapeHtml(scene.userFeedbackNote || "")}" placeholder="Catatan kalau aneh (opsional)..." />
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
      if (getSelectedRenderMode() !== "anime_mappa") {
        syncRenderModeUI("anime_mappa");
      }
      updateActiveSceneUI();
      btn.disabled = true;
      btn.textContent = "⏳...";
      await renderScenesWithAnimeMappa(idx);
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

  document.querySelectorAll(".scene-feedback-note").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const idx = Number(e.target.dataset.idx);
      if (currentScript?.scenes?.[idx]) {
        currentScript.scenes[idx].userFeedbackNote = e.target.value;
      }
    });
  });

  document.querySelectorAll(".btn-rate-good, .btn-rate-weird").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      const rating = btn.classList.contains("btn-rate-weird") ? "weird" : "good";
      await submitSceneFeedback(idx, rating, btn);
    });
  });

  document.querySelectorAll(".veo-hero-scene-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      btn.disabled = true;
      btn.textContent = "⏳ Veo...";
      try {
        await runVeoHeroShot(idx);
      } finally {
        btn.disabled = false;
        btn.textContent = "🎞️ Veo";
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
const pendingAudioPromises = new Map();

async function ensureSceneAudio(index) {
  if (sceneAudioBuffers.has(index)) return sceneAudioBuffers.get(index);
  const scene = currentScript?.scenes?.[index];
  if (!scene) return null;
  const keys = getLocalKeys();
  const dedupeKey = `${index}::${scene.narration}::${keys.voiceProvider}::${keys.voicePreset}`;
  if (pendingAudioPromises.has(dedupeKey)) {
    return await pendingAudioPromises.get(dedupeKey);
  }

  const task = (async () => {
    const isFreeGemini = keys.voiceProvider === "gemini_free";
    const st = document.getElementById(`audioStatus_${index}`);
    if (st) st.textContent = isFreeGemini ? "⏳ Rekam suara gratis terlatih..." : "⏳ Rekam suara ElevenLabs...";

    const requestedVoiceId = activeElevenlabsVoiceId || keys.elevenlabsVoiceId;
    let data = {};
    try {
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: scene.narration,
          voiceProvider: keys.voiceProvider,
          voicePreset: keys.voicePreset,
          phase: scene.phase || "JADI",
          customVoiceProfile: keys.trainedVoiceProfile || null,
          voiceId: requestedVoiceId,
          elevenlabsApiKey: keys.elevenlabsApiKey,
          geminiApiKey: keys.geminiApiKey
        })
      });
      data = await resp.json().catch(() => ({ elevenlabsError: `HTTP ${resp.status}` }));
    } catch (e) {
      data = { elevenlabsError: e.message || "Gagal terhubung ke endpoint TTS" };
    }

    const lbl = document.getElementById("voiceStatusLabel");
    const dot = document.getElementById("voiceStatusDot");

    if (data.provider === "gtts_baritone" && (Array.isArray(data.audioSegmentsBase64) ? data.audioSegmentsBase64.length : data.audioBase64)) {
      const actx = getAudioContext();
      if (actx.state === "suspended") {
        try {
          await actx.resume();
        } catch { }
      }
      const segments = Array.isArray(data.audioSegmentsBase64) && data.audioSegmentsBase64.length
        ? data.audioSegmentsBase64
        : [data.audioBase64];
      const decodedChunks = [];
      let totalSamples = 0;
      let sampleRate = actx.sampleRate || 24000;
      for (const b64 of segments) {
        const arrBuf = base64ToArrayBuffer(b64);
        const segBuf = await actx.decodeAudioData(arrBuf);
        sampleRate = segBuf.sampleRate || sampleRate;
        const chan = segBuf.getChannelData(0);
        decodedChunks.push(chan);
        totalSamples += chan.length;
      }
      const merged = new Float32Array(totalSamples);
      let writeOffset = 0;
      for (const ch of decodedChunks) {
        merged.set(ch, writeOffset);
        writeOffset += ch.length;
      }
      const baritone = data.applyClientBaritoneDsp ? applyClientBaritoneDsp(merged, sampleRate, -3.6, 1.02) : merged;
      const outBuf = actx.createBuffer(1, baritone.length, sampleRate);
      outBuf.getChannelData(0).set(baritone);

      const entry = {
        buffer: outBuf,
        provider: "gtts_baritone",
        cached: Boolean(data.cached),
        playbackRate: 1.0
      };
      sceneAudioBuffers.set(index, entry);
      if (st) {
        st.textContent = "⚡ Bebas Kuota (Baritone DSP)";
        st.classList.add("ready");
      }
      if (dot) dot.classList.add("active-el");
      if (lbl) lbl.textContent = "Cadangan Bebas Kuota Aktif (Limit Gemini terlewati)";
      return entry;
    }

    if ((data.provider === "gemini_free" || data.provider === "elevenlabs") && data.audioBase64) {
      const actx = getAudioContext();
      if (actx.state === "suspended") {
        try {
          await actx.resume();
        } catch { }
      }

      const arrayBuf = base64ToArrayBuffer(data.audioBase64);
      const decoded = await actx.decodeAudioData(arrayBuf);
      if (data.provider === "elevenlabs" && data.voiceId) activeElevenlabsVoiceId = data.voiceId;

      const entry = {
        buffer: decoded,
        provider: data.provider,
        cached: Boolean(data.cached),
        playbackRate: 1.0
      };
      sceneAudioBuffers.set(index, entry);
      if (st) {
        if (data.provider === "gemini_free") {
          const pct = data.estimatedMatchPct || 91;
          st.textContent = `✅ Gratis ~${pct}% (${data.voiceName || "Algenib"} + DSP)`;
        } else {
          st.textContent = data.voiceFallbackNote
            ? `✅ ElevenLabs Deep Male (${data.voiceId})`
            : `✅ ElevenLabs (${data.voiceId})`;
        }
        st.classList.add("ready");
      }
      if (dot) dot.classList.add("active-el");
      if (lbl) {
        lbl.textContent =
          data.provider === "gemini_free"
            ? `Suara Gratis Terlatih (~${data.estimatedMatchPct || 91}% • ${data.voiceName || "Algenib"})`
            : `ElevenLabs Active (${data.voiceId})`;
      }
      return entry;
    }

    const errMsg = data.elevenlabsError || data.error || "Gagal menghasilkan audio";
    if (st) {
      st.textContent = `⚠️ Suara gagal: ${String(errMsg).slice(0, 62)}`;
      st.classList.remove("ready");
    }
    if (dot) dot.classList.remove("active-el");
    if (lbl) lbl.textContent = `TTS Error — cek API key di ⚙️ API & Voice`;
    return null;
  })();

  pendingAudioPromises.set(dedupeKey, task);
  try {
    return await task;
  } finally {
    pendingAudioPromises.delete(dedupeKey);
  }
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
  if (!toggleMcOverlay?.checked) return;

  const W = canvas.width;
  const H = canvas.height;
  const voice = getLiveVoiceEnergy();
  const hasAnimatedMcVideo = Boolean(mcAnimatedVideo && mcAnimatedVideo.readyState >= 2);

  // Map 3D scene pose/phase to canonical mc_default.jpg-locked 2D anime poses,
  // biased toward Maou Vaelen's Sovereign Overlord & Sarcastic Ruler persona!
  const resolve3DPresenterPoseKey = () => {
    if (scene.mcPose === "sarcastic") return "pose_default_smirk";
    if (scene.phase === "TAPI") return "pose_shock_panic";
    if (scene.mcPose === "eureka" || scene.phase === "CLIMAX") return "pose_climax_domain";
    if (scene.mcPose === "explaining" || scene.phase === "JADI") return "pose_explaining";
    if (voice > 0.08 || isPlaying) return "pose_explaining";
    return "pose_default_smirk";
  };

  const poseKey = resolve3DPresenterPoseKey();
  const keyedPose =
    mc3dPoseCache.get(poseKey) ||
    mc3dPoseCache.get("pose_explaining") ||
    mc3dPoseCache.get("pose_default_smirk");

  // Primary Path: Living 2D Anime Host (zero boxy card, chroma-keyed cut-out, 12fps On-Twos + lip-flap + eye-blink!)
  if (!hasAnimatedMcVideo && keyedPose) {
    const sw = keyedPose.width || keyedPose.naturalWidth || 720;
    const sh = keyedPose.height || keyedPose.naturalHeight || 960;
    const step12 = Math.floor(tSec * 12) / 12;
    const elapsedScene = Math.min(1, (performance.now() - sceneEnterTimestamp) / 380);
    const slideEase = 1 - Math.pow(1 - elapsedScene, 3);

    // Stand on bottom-left foreground by default so pose_explaining points directly toward center 3D diorama
    // without ever mirroring his asymmetrical horns!
    const isRight = scene.mcPlacement === "presenter-right";
    const drawW = Math.round(W * 0.44);
    const drawH = Math.round(drawW * (sh / sw));
    const targetX = isRight ? Math.round(W - drawW * 0.44) : Math.round(drawW * 0.45);
    const entryOffset = (1 - slideEase) * (isRight ? 46 : -46);
    const presenterSway = Math.sin(step12 * 1.4) * 3.5;
    const hostX = targetX + entryOffset + presenterSway;
    const bottomY = Math.round(H * 0.855);

    ctx.save();

    // 1. Overlord Sovereign Rim Aura behind presenter silhouette (zero box!)
    const auraGrad = ctx.createRadialGradient(
      hostX,
      bottomY - drawH * 0.48,
      drawW * 0.08,
      hostX,
      bottomY - drawH * 0.48,
      drawW * 0.66
    );
    const isSarcasticMood = scene.mcPose === "sarcastic" || scene.phase === "TAPI";
    const rimTint =
      isSarcasticMood
        ? "rgba(225, 29, 72, 0.36)"
        : poseKey === "pose_climax_domain"
          ? "rgba(245, 158, 11, 0.34)"
          : "rgba(245, 158, 11, 0.28)";
    auraGrad.addColorStop(0, rimTint);
    auraGrad.addColorStop(0.65, isSarcasticMood ? "rgba(136, 19, 55, 0.14)" : "rgba(180, 83, 9, 0.10)");
    auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(hostX, bottomY - drawH * 0.48, drawW * 0.58, drawH * 0.50, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Clean Overlord Sovereign Command Beam toward the 3D Diorama Subject
    if (poseKey === "pose_explaining" || scene.phase === "JADI") {
      const handX = isRight ? hostX - drawW * 0.24 : hostX + drawW * 0.30;
      const handY = bottomY - drawH * 0.43;
      const focusX = W * 0.55;
      const focusY = H * 0.43;

      ctx.save();
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.46 + voice * 0.45})`;
      ctx.lineWidth = 2.4 + voice * 1.5;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -tSec * 48;
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(focusX, focusY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Overlord diamond + circular targeting reticle on 3D object
      const pulseR = 7 + Math.sin(tSec * 7) * 2 + voice * 4;
      ctx.strokeStyle = "rgba(253, 224, 71, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(focusX, focusY, pulseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(focusX, focusY - pulseR - 4);
      ctx.lineTo(focusX + pulseR + 4, focusY);
      ctx.lineTo(focusX, focusY + pulseR + 4);
      ctx.lineTo(focusX - pulseR - 4, focusY);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(focusX, focusY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Softly clip bottom coat edge above subtitle zone so captions stay 100% crisp
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, Math.round(H * 0.845));
    ctx.clip();

    drawLiving2DAnimeHostCel(ctx, keyedPose, poseKey, hostX, bottomY, drawW, drawH, step12, voice, false);
    ctx.restore();

    // 4. Compact Overlord Sovereign Micro-Tag cleanly above horns on Sarcastic / Verdict beats
    if (isSarcasticMood || scene.phase === "CLIMAX") {
      const badgeText = scene.phase === "CLIMAX" ? "👑 VONIS PENGUASA" : "😏 DASAR MANUSIA...";
      ctx.save();
      ctx.font = "900 9.5px 'JetBrains Mono', monospace";
      const bw = ctx.measureText(badgeText).width + 16;
      const bx = isRight ? Math.min(W - bw - 14, hostX - bw / 2) : Math.max(14, hostX - bw / 2);
      const by = Math.max(195, bottomY - drawH - 18);
      drawRoundedRect(ctx, bx, by, bw, 21, 6);
      ctx.fillStyle = "rgba(11, 13, 22, 0.94)";
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = scene.phase === "CLIMAX" ? "#f59e0b" : "#e11d48";
      ctx.stroke();
      ctx.fillStyle = scene.phase === "CLIMAX" ? "#fde047" : "#fda4af";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, bx + 8, by + 10.5);
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  // Fallback / Custom Uploaded Animated MC Video Path
  if (!hasAnimatedMcVideo && (!mcImage.complete || !mcImage.naturalWidth)) return;

  const isHero = scene.mcPlacement === "hero" || scene.phase === "HOOK" || scene.phase === "CLIMAX";
  const isRight = scene.mcPlacement !== "presenter-left";
  const elapsedScene = Math.min(1, (performance.now() - sceneEnterTimestamp) / 450);
  const slideEase = 1 - Math.pow(1 - elapsedScene, 3);
  const breathY = Math.sin(tSec * 2.8) * 5.5;
  const swayX = Math.sin(tSec * 1.9) * 5.0;
  const voiceBounceY = -voice * 11;

  ctx.save();
  const cardW = isHero ? 148 : 132;
  const cardH = isHero ? 186 : 168;
  const targetX = isHero ? W - cardW - 14 : isRight ? W - cardW - 14 : 14;
  const entryOffset = (1 - slideEase) * (isRight || isHero ? 50 : -50);
  const cardX = targetX + swayX + entryOffset;
  const cardY = (isHero ? 548 : 566) + breathY + voiceBounceY;

  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 18);
  ctx.clip();
  if (hasAnimatedMcVideo) {
    drawCoverVideo(ctx, mcAnimatedVideo, cardX, cardY, cardW, cardH);
  } else {
    ctx.drawImage(mcImage, cardX, cardY, cardW, cardH * 1.15);
  }
  ctx.restore();
}

function drawSelamatStamp(ctx, scene, tSec) {
  if (scene.phase !== "CLIMAX" && !/selamat/i.test(scene.narration)) return;
  const W = canvas.width;

  ctx.save();
  ctx.translate(W / 2, 154);
  ctx.rotate(-0.07);
  const scale = 1 + Math.sin(tSec * 5) * 0.03;
  ctx.scale(scale, scale);

  // Obsidian & Gold Royal Demon King Decree Frame around SELAMAT!
  drawRoundedRect(ctx, -138, -34, 276, 68, 12);
  ctx.fillStyle = "rgba(11, 13, 22, 0.94)";
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "#f59e0b";
  ctx.stroke();

  drawRoundedRect(ctx, -130, -26, 260, 52, 8);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#10b981";
  ctx.stroke();

  ctx.fillStyle = "#fde047";
  ctx.font = "900 10px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("👑 VONIS RAJA IBLIS", 0, -15);

  ctx.fillStyle = "#34d399";
  ctx.font = "900 27px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("SELAMAT!", 0, 10);
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

function drawBroadcastAnimeTitleCard(ctx, scene, sceneElapsedSec = 1) {
  const W = canvas.width;
  const SAFE_PAD = Math.round(48 * (W / 720)); // Strict >= 48px at 720w safe margin!
  const phase = scene.phase || "HOOK";
  const phaseMeta = {
    HOOK: { tag: "ACT 01 // PROLOG", accent: "#f59e0b" },
    TAPI: { tag: "ACT 02 // ANOMALI", accent: "#f43f5e" },
    JADI: { tag: "ACT 03 // ANALISIS", accent: "#38bdf8" },
    CLIMAX: { tag: "FINAL // RESOLUSI", accent: "#c084fc" }
  };
  const meta = phaseMeta[phase] || phaseMeta.HOOK;
  const enterEase = Math.min(1, sceneElapsedSec / 0.16);
  const slideX = (1 - enterEase) * -18;

  ctx.save();
  ctx.globalAlpha = 0.94 * enterEase;
  ctx.translate(slideX, 0);

  // Minimal sharp broadcast anime title-card typography (NO rounded mobile-app pills!)
  const labelRaw = String(scene.componentLabel || currentScript?.topic || "").trim().toUpperCase();
  const titleLine = labelRaw.slice(0, 34);
  const maxBoxW = W - SAFE_PAD * 2;

  ctx.font = "700 10.5px 'JetBrains Mono', monospace";
  const tagW = ctx.measureText(meta.tag).width;
  ctx.font = "800 13px 'Plus Jakarta Sans', sans-serif";
  const titleW = titleLine ? ctx.measureText(titleLine).width : 0;
  const boxW = Math.min(maxBoxW, Math.max(tagW, titleW) + 28);
  const boxH = titleLine ? 46 : 26;
  const bx = SAFE_PAD;
  const by = 26;

  // Sharp dark translucent broadcast backing + crisp 1px hairline border + 3px accent bar
  ctx.fillStyle = "rgba(6, 9, 16, 0.74)";
  ctx.fillRect(bx, by, boxW, boxH);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);

  ctx.fillStyle = meta.accent;
  ctx.fillRect(bx, by, 3.5, boxH);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = meta.accent;
  ctx.font = "700 10px 'JetBrains Mono', monospace";
  ctx.fillText(meta.tag, bx + 12, by + 7, boxW - 20);

  if (titleLine) {
    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 12.5px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(titleLine, bx + 12, by + 23, boxW - 20);
  }

  // Subtle broadcast channel signature in top-right safe margin (zero rounded pill!)
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(248, 250, 252, 0.62)";
  ctx.font = "700 10px 'JetBrains Mono', monospace";
  ctx.fillText("@MAOUEDU.ID", W - SAFE_PAD, by + 7);
  ctx.restore();
}

function drawTopVideoHeader(ctx, scene) {
  const W = canvas.width;
  ctx.save();
  const phaseColors = {
    HOOK: { bg: "#1d4ed8", text: "⚡ PRAKTEK MANUSIA" },
    TAPI: { bg: "#e11d48", text: "😏 TAPI... (HANCUR!)" },
    JADI: { bg: "#d97706", text: "👁️ TRIK PENGUASA!" },
    CLIMAX: { bg: "#059669", text: "👑 SELAMAT! (BERHASIL)" }
  };
  const pInfo = phaseColors[scene.phase] || phaseColors.HOOK;

  drawRoundedRect(ctx, 22, 24, 224, 34, 10);
  ctx.fillStyle = pInfo.bg;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = "#090a0f";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 12px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pInfo.text, 22 + 112, 41);

  drawRoundedRect(ctx, W - 184, 24, 162, 34, 10);
  ctx.fillStyle = "rgba(11, 13, 22, 0.92)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#f59e0b";
  ctx.stroke();

  ctx.fillStyle = "#fde047";
  ctx.font = "900 11.5px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("👑 @MaouEdu.ID", W - 103, 41);
  ctx.restore();
}

function draw3dCalloutBadge(ctx, scene) {
  if (!scene.componentLabel) return;
  const W = canvas.width;
  const tagText = `◆  ${scene.componentLabel.toUpperCase()}`;
  const isDanger = scene.phase === "TAPI";
  const isWin = scene.phase === "CLIMAX";
  const accent = isDanger ? "#e11d48" : isWin ? "#10b981" : "#f59e0b";
  ctx.save();
  ctx.font = "900 13px 'Plus Jakarta Sans', sans-serif";
  const tw = Math.min(W - 44, ctx.measureText(tagText).width + 32);
  const tx = (W - tw) / 2;
  const ty = 72;

  drawRoundedRect(ctx, tx + 2, ty + 3, tw, 34, 8);
  ctx.fillStyle = "rgba(9, 10, 15, 0.55)";
  ctx.fill();

  drawRoundedRect(ctx, tx, ty, tw, 34, 8);
  ctx.fillStyle = "rgba(11, 13, 22, 0.94)";
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = accent;
  ctx.stroke();

  drawRoundedRect(ctx, tx + 4, ty + 5, 5, 24, 2);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.fillStyle = isDanger ? "#fda4af" : isWin ? "#6ee7b7" : "#fde68a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, W / 2 + 2, ty + 17, tw - 22);
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

  // Obsidian & Amber Sovereign Card (@dekodaid x MaouEdu)
  drawRoundedRect(ctx, x, y, cardW, cardH, 10);
  ctx.fillStyle = "rgba(11, 13, 22, 0.94)";
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#f59e0b";
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "900 12.5px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(hc.title, x + 12, y + 9, cardW - 24);

  if (hc.subtitle) {
    ctx.fillStyle = "#fde047";
    ctx.font = "800 10.5px 'Plus Jakarta Sans', sans-serif";
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
      card.tone === "warn" ? "#e11d48" : card.tone === "good" ? "#10b981" : "#f59e0b";

    ctx.save();
    drawRoundedRect(ctx, x + 2, y + 3, cardW, cardH, 10);
    ctx.fillStyle = "rgba(9, 10, 15, 0.4)";
    ctx.fill();

    drawRoundedRect(ctx, x, y, cardW, cardH, 10);
    ctx.fillStyle = "rgba(11, 13, 22, 0.92)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = accent;
    ctx.stroke();

    // Colored left indicator bar
    drawRoundedRect(ctx, x + 5, y + 6, 5, cardH - 12, 3);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "800 9.5px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(String(card.label || "INFO").toUpperCase(), x + 18, y + 7, cardW - 26);

    ctx.fillStyle = card.tone === "warn" ? "#fda4af" : card.tone === "good" ? "#6ee7b7" : "#f8fafc";
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
  ctx.fillText("⚔️  MAOUEDU ANIME 2D STUDIO", W / 2, 535);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 24px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Kolom Prompt Kosong & Siap!", W / 2, 575);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 14.5px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Ketik ide videomu di kolom atas,", W / 2, 610);
  ctx.fillText("Studio MAPPA 2D Anime siap beraksi.", W / 2, 632);
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
  let renderedPrimary = false;
  let renderedPureAnime2D = false;

  if (clip?.videoEl && clip.videoEl.readyState >= 2) {
    if (clip.isVeoHero && mode === "anime_mappa" && animeMappaReady && animeMappaEngine) {
      animeMappaEngine.renderVideoClipWithSatsuei(
        clip.videoEl,
        scene.animeBlueprint,
        tSec,
        sceneElapsedSec,
        sceneDurationSec
      );
      ctx.drawImage(animeMappaEngine.domElement, 0, 0, canvas.width, canvas.height);
      renderedPureAnime2D = true;
    } else {
      drawCoverVideo(ctx, clip.videoEl, 0, 0, canvas.width, canvas.height);
    }
    renderedPrimary = true;
  } else {
    if (mode === "anime_mappa" && animeMappaReady && animeMappaEngine) {
      try {
        const bp = scene.animeBlueprint || {
          engine: "anime-mappa-2d",
          haikeiBg: scene.phase === "CLIMAX" ? "domain_void" : "shibuya_night",
          characterPose:
            scene.phase === "TAPI"
              ? "pose_shock_panic"
              : scene.phase === "CLIMAX"
                ? "pose_climax_domain"
                : scene.phase === "JADI"
                  ? "pose_explaining"
                  : "pose_default_smirk",
          shotLayout:
            scene.phase === "CLIMAX"
              ? "dramatic_closeup_domain"
              : scene.phase === "TAPI"
                ? "action_clash_diagonal"
                : "host_hero_alternating_cutaway",
          enableAlternatingCutaway: scene.phase !== "CLIMAX",
          cutawayStartSec: 2.55,
          transitionStyle: scene.phase === "HOOK" || scene.phase === "CLIMAX" ? "zoom_punch" : "whip_cut",
          cameraMotion2d:
            scene.phase === "TAPI"
              ? "dutch_shibuya_shake"
              : scene.phase === "CLIMAX"
                ? "crash_zoom_impact"
                : "slow_push_in",
          satsueiMood:
            scene.phase === "TAPI"
              ? "sukuna_crimson"
              : scene.phase === "CLIMAX"
                ? "hollow_purple"
                : "jjk_cursed_blue",
          auraColor: scene.phase === "TAPI" ? "#fb7185" : scene.phase === "CLIMAX" ? "#c084fc" : "#38bdf8",
          sakugaVfx2d:
            scene.phase === "TAPI"
              ? ["black_flash_2d", "manga_speed_lines_2d", "slash_smear_2d"]
              : scene.phase === "CLIMAX"
                ? ["domain_seal_2d", "cursed_flames_2d", "embers_petals_2d"]
                : ["rain_streaks_2d", "embers_petals_2d"],
          impactBeat: {
            enabled: scene.phase === "TAPI" || scene.phase === "CLIMAX",
            beatSynced: true,
            triggerProgress: 0.46,
            style: scene.phase === "TAPI" ? "black_flash" : "bw_manga_invert"
          },
          mangaSfxText: scene.phase === "TAPI" ? "ドォォン!!" : scene.phase === "CLIMAX" ? "領域展開!" : "ゴゴゴ...",
          satsueiGrade: {
            bloomStrength: scene.phase === "CLIMAX" ? 0.36 : 0.28,
            lightWrapStrength: 0.42,
            ambientHarmonization: 0.22,
            shadowCrush: 0.14,
            dofBlur: 0.28,
            contrast: 1.1,
            saturation: 1.14,
            chromaticPeak: 0.014
          }
        };
        const aKey = `anime2d::${currentScript.topic || ""}::${sceneIndex}::${scene.animeRenderVersion || 1}`;
        animeMappaEngine.renderFrame(bp, aKey, tSec, sceneElapsedSec, sceneDurationSec, liveVoice, {
          showCharacter: Boolean(toggleMcOverlay?.checked),
          scene
        });
        ctx.drawImage(animeMappaEngine.domElement, 0, 0, canvas.width, canvas.height);
        renderedPrimary = true;
        renderedPureAnime2D = true;
      } catch (animeErr) {
        console.warn("Anime 2D MAPPA fallback:", animeErr);
        animeMappaReady = false;
      }
    }
    if (!renderedPrimary && stage3dReady && stage3d) {
      try {
        stage3d.renderFrame(scene, currentScript.topic || "", tSec, sceneElapsedSec);
        ctx.drawImage(stage3d.domElement, 0, 0, canvas.width, canvas.height);
        drawScienceMeter(ctx, scene.visual?.meter, scene.phase, tSec);
        if (scene.phase === "CLIMAX" || scene.visual?.fx?.includes("confetti")) {
          drawCelebrationConfetti(ctx, canvas.width, tSec);
        }
        renderedPrimary = true;
      } catch (glErr) {
        console.warn("3D frame fallback to 2.5D:", glErr);
        stage3dReady = false;
      }
    }
    if (!renderedPrimary) {
      renderToonVideoFrame(ctx, canvas.width, canvas.height, scene, tSec, sceneElapsedSec);
    }
  }

  // Light bottom gradient only near subtitle zone so the anime / 3D stage stays crystal clear!
  const subGrad = ctx.createLinearGradient(0, canvas.height - 175, 0, canvas.height);
  subGrad.addColorStop(0, "rgba(9, 10, 15, 0)");
  subGrad.addColorStop(1, "rgba(9, 10, 15, 0.62)");
  ctx.fillStyle = subGrad;
  ctx.fillRect(0, canvas.height - 175, canvas.width, 175);

  if (renderedPureAnime2D) {
    // Sharp minimal broadcast anime typography (NO rounded mobile-app pills & hidden during Impact Frames!)
    const isImpactNow = Boolean(animeMappaEngine && animeMappaEngine.lastImpactMode > 0.5);
    if (!isImpactNow) {
      drawBroadcastAnimeTitleCard(ctx, scene, sceneElapsedSec);
    }
  } else {
    // Classic 3D @untabiru5 / @dekodaid educational cards + rounded pills untouched!
    drawTopVideoHeader(ctx, scene);
    draw3dCalloutBadge(ctx, scene);
    drawDekodaHookCard(ctx, scene.visual, tSec, sceneElapsedSec);
    drawBelajarInfoPills(ctx, scene.visual, scene.phase, tSec);
    drawMilestoneStampBanner(ctx, scene.visual, scene, tSec, sceneElapsedSec);
    drawMaouVersusCard(ctx, scene.visual, tSec);
    drawMcRajaIblisPresenter(ctx, scene, tSec);
    drawSelamatStamp(ctx, scene, tSec);
  }
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
  exportProgressText.textContent = "1/3: Memastikan animasi & audio ElevenLabs siap...";

  const [targetW, targetH] = (exportQualitySelect?.value || "720x1280").split("x").map(Number);
  const safeName = (currentScript.topic || "maou_edu")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");

  try {
    const activeMode = getSelectedRenderMode();
    if (activeMode === "anime_mappa" && currentScript.scenes.some((s) => !s.animeBlueprint)) {
      exportProgressText.textContent = "1/3: Studio MAPPA menyusun animasi Anime 2D...";
      await renderScenesWithAnimeMappa();
    }
    if (activeMode === "anime_mappa" && animeMappaEngine) {
      exportProgressText.textContent = "1/3: Memastikan semua Haikei, Cel Karakter & Genga SVG terdekode...";
      await animeMappaEngine.ensureAssetsReady(
        currentScript.scenes.map((s) => s.animeBlueprint).filter(Boolean)
      );
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
    const prevAnimeW = animeMappaEngine?.width || 720;
    const prevAnimeH = animeMappaEngine?.height || 1280;
    let mp4Result = { ok: false, fallbackRequired: true };
    try {
      if (activeMode === "anime_mappa" && animeMappaEngine && targetW && targetH) {
        animeMappaEngine.resize(targetW, targetH);
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
      isOfflineExporting = false;
    }

    if (mp4Result.ok && mp4Result.blob) {
      const url = URL.createObjectURL(mp4Result.blob);
      const a = document.createElement("a");
      a.href = url;
      const modeSlug = activeMode === "anime_mappa" ? "anime_mappa_2d" : "edukasi_3d";
      a.download = `${safeName}_${modeSlug}_${mp4Result.width}x${mp4Result.height}.mp4`;
      a.click();
      exportProgressFill.style.width = "100%";
      exportProgressText.textContent = `✅ Video MP4 HD selesai (${mp4Result.frames} frame • ${mp4Result.width}×${mp4Result.height})!`;
      if (!promptWorkflow.isRunning) {
        promptWorkflow.completeStage(
          "export",
          `MP4 HD didownload (${mp4Result.width}×${mp4Result.height} • ${mp4Result.frames} frame)`,
          "MP4 Siap"
        );
      }
      return {
        downloaded: true,
        width: mp4Result.width,
        height: mp4Result.height,
        frames: mp4Result.frames
      };
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
    return { downloaded: true, width: canvas.width, height: canvas.height, frames: "MediaRecorder" };
  } catch (e) {
    alert("Gagal render video: " + e.message);
    return { downloaded: false, error: e.message };
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
    const anchorBadge = document.getElementById("charAnchorDebugBadge");
    if (anchorBadge) {
      const okAnchor = Boolean(serverConfig?.styleAnchors?.mcDefault);
      anchorBadge.textContent = okAnchor
        ? "Character Anchor: mc_default.jpg (ACTIVE)"
        : "Character Anchor: mc_default.jpg (FALLBACK)";
      anchorBadge.style.borderColor = okAnchor ? "rgba(16,185,129,0.55)" : "rgba(245,158,11,0.55)";
      anchorBadge.style.color = okAnchor ? "#6ee7b7" : "#fde68a";
    }
    if (veoHeroToggleWrap) {
      veoHeroToggleWrap.classList.toggle("hidden", !serverConfig.enableVeoHeroShots);
    }
    const keys = getLocalKeys();
    const voiceModeEl = document.getElementById("voiceModeSelect");
    const elSection = document.getElementById("elevenlabsVoiceSection");
    const trainerBox = document.getElementById("voiceTrainerBox");
    if (voiceModeEl) voiceModeEl.value = keys.voiceMode;
    if (elSection) elSection.classList.toggle("hidden", keys.voiceProvider !== "elevenlabs");
    if (trainerBox) trainerBox.classList.toggle("hidden", keys.voiceProvider === "elevenlabs");

    const voiceInputEl = document.getElementById("elevenlabsVoiceIdInput");
    const voicePresetEl = document.getElementById("elevenlabsVoicePreset");
    if (voiceInputEl) voiceInputEl.value = keys.elevenlabsVoiceId;
    if (voicePresetEl) {
      const hasPreset = Array.from(voicePresetEl.options).some(
        (o) => o.value && o.value !== "__custom__" && o.value === keys.elevenlabsVoiceId
      );
      voicePresetEl.value = hasPreset ? keys.elevenlabsVoiceId : "__custom__";
      if (voiceInputEl) voiceInputEl.classList.toggle("hidden", hasPreset);
    }
    const elKeyEl = document.getElementById("elevenlabsApiKeyInput");
    if (elKeyEl) elKeyEl.value = keys.elevenlabsApiKey;
    document.getElementById("geminiApiKeyInput").value = keys.geminiApiKey;
    const pinInp = document.getElementById("appAccessPinInput");
    if (pinInp) pinInp.value = keys.accessPin;
    const brainPinInp = document.getElementById("brainAccessPinInput");
    if (brainPinInp) brainPinInp.value = keys.accessPin;

    updateVoiceStatusUI(keys);
  } catch { }

  try {
    animeMappaEngine = new MaouAnimeMappaEngine(720, 1280);
    animeMappaReady = true;
  } catch (err) {
    console.warn("Anime 2D MAPPA unavailable:", err);
    animeMappaReady = false;
  }

  try {
    stage3d = new Maou3DStage(canvas.width, canvas.height);
    stage3dReady = true;
  } catch (err) {
    console.warn("WebGL 3D unavailable, using 2.5D toon fallback:", err);
    stage3dReady = false;
  }

  // Migrate any legacy saved cinema_3d mode cleanly to Pure 2D Studio MAPPA Anime
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
      } else if (nextMode === "classic_3d") {
        aiEngineBadge.textContent = `🧱 3D Edukasi Klasik (${currentScript.scenes.length} Scene)`;
      }
    });
  }

  startRenderLoop();
  renderWorkflowUI(promptWorkflow.getSnapshot());
  fetchDirectorBrain();

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

openWorkflowBtn?.addEventListener("click", () => openWorkflowModal());
openWorkflowMapBtn?.addEventListener("click", () => openWorkflowModal());
document.getElementById("closeWorkflowBtn")?.addEventListener("click", () => {
  workflowModal?.classList.add("hidden");
});
document.getElementById("closeWorkflowFooterBtn")?.addEventListener("click", () => {
  workflowModal?.classList.add("hidden");
});
workflowModal?.addEventListener("click", (e) => {
  if (e.target === workflowModal) workflowModal.classList.add("hidden");
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

const voiceModeSelect = document.getElementById("voiceModeSelect");
if (voiceModeSelect) {
  voiceModeSelect.addEventListener("change", () => {
    const isEl = voiceModeSelect.value === "elevenlabs";
    document.getElementById("elevenlabsVoiceSection")?.classList.toggle("hidden", !isEl);
    document.getElementById("voiceTrainerBox")?.classList.toggle("hidden", isEl);
  });
}

let voiceTrainSampleDataUrl = "";
document.getElementById("voiceTrainSampleInput")?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  const lbl = document.getElementById("voiceTrainSampleName");
  if (!file) {
    voiceTrainSampleDataUrl = "";
    if (lbl) lbl.textContent = "Opsional: pakai contoh audio ElevenLabs";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    voiceTrainSampleDataUrl = String(reader.result || "");
    if (lbl) lbl.textContent = `✅ ${file.name}`;
  };
  reader.readAsDataURL(file);
});

document.getElementById("resetTrainedVoiceBtn")?.addEventListener("click", () => {
  localStorage.removeItem("maou_trained_voice_profile");
  const statusBox = document.getElementById("voiceTrainStatusBox");
  if (statusBox) statusBox.textContent = "↺ Direset ke profil terlatih bawaan (Algenib + Broadcast DSP ~91%).";
  sceneAudioBuffers.clear();
  updateVoiceStatusUI();
});

document.getElementById("trainVoiceBtn")?.addEventListener("click", async () => {
  const btn = document.getElementById("trainVoiceBtn");
  const statusBox = document.getElementById("voiceTrainStatusBox");
  const player = document.getElementById("voiceTrainPreviewAudio");
  const desc = document.getElementById("voiceTrainDescInput")?.value.trim() || "";
  const modeVal = document.getElementById("voiceModeSelect")?.value || "free:maou_overlord";
  const presetId = modeVal.startsWith("free:") ? modeVal.replace(/^free:/, "") : "maou_overlord";

  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Melatih & Mengkalibrasi DSP...";
  }
  if (statusBox) statusBox.textContent = "Menganalisa karakter vokal, pitch F0 (Hz), & merender preview...";

  try {
    const keys = getLocalKeys();
    const resp = await fetch("/api/voice-train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceAudioDataUrl: voiceTrainSampleDataUrl,
        targetDescription: desc,
        presetId,
        geminiApiKey: keys.geminiApiKey
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || "Gagal melatih suara gratis.");

    if (data.trainedProfile) {
      localStorage.setItem("maou_trained_voice_profile", JSON.stringify(data.trainedProfile));
      localStorage.setItem("maou_voice_mode", `free:${presetId}`);
      if (voiceModeSelect) voiceModeSelect.value = `free:${presetId}`;
    }
    sceneAudioBuffers.clear();
    updateVoiceStatusUI();

    if (player && data.previewAudioBase64) {
      player.src = `data:${data.previewMimeType || "audio/wav"};base64,${data.previewAudioBase64}`;
      player.classList.remove("hidden");
      player.play().catch(() => {});
    }
    if (statusBox) {
      const tp = data.trainedProfile || {};
      const ac = data.acoustics || {};
      statusBox.innerHTML = `✅ <strong>Terlatih (~${tp.estimatedMatchPct || 91}% Match)</strong> • Base: <code>${tp.geminiVoiceName || "Algenib"}</code> • Pitch F0: <code>${ac.medianF0Hz || "-"} Hz</code> • Loudness: <code>${ac.rmsDb || "-"} dB</code><br/>${escapeHtml(tp.targetAnalysisSummary || tp.criticFeedback || "")}`;
    }
  } catch (err) {
    if (statusBox) statusBox.textContent = `⚠️ Gagal melatih suara: ${err.message}`;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "🎓 Latih & Tes Dengarkan Suara";
    }
  }
});

document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  const voiceMode = document.getElementById("voiceModeSelect")?.value || "free:maou_overlord";
  const voiceId = document.getElementById("elevenlabsVoiceIdInput")?.value.trim() || "nPczCjzI2devNBz1zQrb";
  const elKey = document.getElementById("elevenlabsApiKeyInput")?.value.trim() || "";
  const gemKey = document.getElementById("geminiApiKeyInput").value.trim();
  const pinVal = document.getElementById("appAccessPinInput")?.value.trim() || "";

  localStorage.setItem("maou_voice_mode", voiceMode);
  localStorage.setItem("maou_el_voice", voiceId);
  localStorage.setItem("maou_el_key", elKey);
  localStorage.setItem("maou_gemini_key", gemKey);
  if (pinVal) localStorage.setItem("maou_access_pin", pinVal);
  else localStorage.removeItem("maou_access_pin");
  const brainPinInp = document.getElementById("brainAccessPinInput");
  if (brainPinInp) brainPinInp.value = pinVal;

  updateVoiceStatusUI();

  activeElevenlabsVoiceId = "";
  sceneAudioBuffers.clear();
  settingsModal.classList.add("hidden");
});

// ============================================================================
// AI BRAIN MODAL EVENTS (Playbook vX, VT Reference Ingestor, Upgrade & Rollback)
// ============================================================================
const aiBrainModal = document.getElementById("aiBrainModal");
document.getElementById("openAiBrainBtn")?.addEventListener("click", async () => {
  aiBrainModal?.classList.remove("hidden");
  await fetchDirectorBrain();
});
document.getElementById("closeAiBrainBtn")?.addEventListener("click", () => {
  aiBrainModal?.classList.add("hidden");
});
document.getElementById("closeAiBrainFooterBtn")?.addEventListener("click", () => {
  aiBrainModal?.classList.add("hidden");
});
aiBrainModal?.addEventListener("click", (e) => {
  if (e.target === aiBrainModal) aiBrainModal.classList.add("hidden");
});
document.getElementById("refreshAiBrainBtn")?.addEventListener("click", fetchDirectorBrain);

document.getElementById("saveBrainPinBtn")?.addEventListener("click", () => {
  const val = document.getElementById("brainAccessPinInput")?.value.trim() || "";
  if (val) localStorage.setItem("maou_access_pin", val);
  else localStorage.removeItem("maou_access_pin");
  const setInp = document.getElementById("appAccessPinInput");
  if (setInp) setInp.value = val;
  const btn = document.getElementById("saveBrainPinBtn");
  if (btn) {
    btn.textContent = "✅ PIN Disimpan";
    setTimeout(() => {
      btn.textContent = "🔒 Simpan PIN";
    }, 1500);
  }
});

document.getElementById("vtRefThumbInput")?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  const lbl = document.getElementById("vtRefThumbName");
  if (!file) {
    vtThumbDataUrl = "";
    if (lbl) lbl.textContent = "Belum ada frame";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    vtThumbDataUrl = String(reader.result || "");
    if (lbl) lbl.textContent = `✅ ${file.name}`;
  };
  reader.readAsDataURL(file);
});

document.getElementById("ingestVtBtn")?.addEventListener("click", async () => {
  const btn = document.getElementById("ingestVtBtn");
  const title = document.getElementById("vtRefTitleInput")?.value.trim() || "";
  const url = document.getElementById("vtRefUrlInput")?.value.trim() || "";
  const notes = document.getElementById("vtRefNotesInput")?.value.trim() || "";
  const cutRaw = document.getElementById("vtRefCutInput")?.value;
  if (!title && !url && !notes && !vtThumbDataUrl) {
    alert("Isi minimal judul, link VT, catatan pacing, atau upload frame VT terlebih dahulu.");
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Mengekstrak DNA VT...";
  }
  try {
    const keys = getLocalKeys();
    const resp = await fetch("/api/director/ingest-vt", {
      method: "POST",
      headers: buildDirectorHeaders(),
      body: JSON.stringify({
        title,
        referenceUrl: url,
        sourceNotes: notes,
        avgCutDurationHint: cutRaw ? Number(cutRaw) : null,
        thumbnailDataUrl: vtThumbDataUrl,
        geminiApiKey: keys.geminiApiKey
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || "Gagal ingest referensi VT.");
    await fetchDirectorBrain();
    alert(`✅ VT berhasil di-ingest! AI Brain naik ke Playbook v${data.playbook?.version || "?"}`);
  } catch (err) {
    alert("Ingest VT gagal: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "📥 Ingest VT & Upgrade Playbook";
    }
  }
});

document.getElementById("upgradeBrainNowBtn")?.addEventListener("click", async () => {
  const btn = document.getElementById("upgradeBrainNowBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "🧬 Meng-upgrade...";
  }
  try {
    const keys = getLocalKeys();
    const resp = await fetch("/api/director/evolve", {
      method: "POST",
      headers: buildDirectorHeaders(),
      body: JSON.stringify({
        triggerReason: "Manual Upgrade Brain Now",
        geminiApiKey: keys.geminiApiKey
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || "Gagal meng-upgrade Playbook.");
    await fetchDirectorBrain();
    alert(`🧬 Brain berhasil di-upgrade ke Playbook v${data.playbook?.version || "?"}!`);
  } catch (err) {
    alert("Upgrade Brain gagal: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "🧬 Upgrade Brain Now";
    }
  }
});

document.getElementById("rollbackBrainBtn")?.addEventListener("click", async () => {
  const sel = document.getElementById("rollbackVersionSelect");
  const ver = Number(sel?.value || 0);
  if (!ver) return;
  try {
    const resp = await fetch("/api/director/rollback", {
      method: "POST",
      headers: buildDirectorHeaders(),
      body: JSON.stringify({ version: ver })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || "Gagal rollback Playbook.");
    await fetchDirectorBrain();
    alert(`⏪ Berhasil rollback ke Playbook v${data.playbook?.version || ver}!`);
  } catch (err) {
    alert("Rollback gagal: " + err.message);
  }
});

initStudio();
