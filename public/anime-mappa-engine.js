// MaouEdu Broadcast-Grade 2D Anime Sakuga & True Satsuei (撮影) Engine — v2 Unified Upgrade
// Strictly Locked to mc_default.jpg Canonical Host Anchor + All 5 Broadcast Visual Fixes:
// 1. ZERO horizontal scanlines/stripes: single solid unbroken 2D Kyara cel (14-strip slicing REMOVED!)
// 2. ZERO blinding white spotlight box: Alternating Full-Screen 9:16 Dark-Anime Cutaways (Cut A Host <-> Cut B Cutaway)
//    + optional translucent dark-glass blueprint HUD (masked out cleanly during Impact Frames)
// 3. Strict 9:16 safe-margin clamping (>= 48px) + pure stylized Japanese Katakana/Kanji SFX sanitizer
// 4. True 1-sided directional rim light & Light Wrap + bottom-frame coat grounding
// 5. Living 12fps On-Twos Host choreography (speech-reactive lip-flap, eye-blink, golden eye glint) + snappy 0.15s Whip/Zoom-Punch cuts

import { MappaSatsuei2DWebGL } from "/video-engine/mappa-satsuei-2d-webgl.js";

export const CHARACTER_ANCHOR_ID = "mc_default.jpg";

const HAIKEI_URLS = {
  shibuya_night: "/assets/mappa/bg_shibuya_night.jpg",
  shrine_twilight: "/assets/mappa/bg_shrine_twilight.jpg",
  domain_void: "/assets/mappa/bg_domain_void.jpg",
  tokyo_rooftop: "/assets/mappa/bg_tokyo_rooftop.jpg",
  anime_kitchen: "/assets/mappa/bg_anime_kitchen.jpg",
  anime_lab: "/assets/mappa/bg_anime_lab.jpg"
};

// Strictly mc_default.jpg-locked chroma-key-ready Host pose pack (old mirrored-horn sprites retired!)
const CHAR_POSE_URLS = {
  pose_default_smirk: "/assets/mappa/poses_mc_locked/pose_default_smirk.png",
  pose_explaining: "/assets/mappa/poses_mc_locked/pose_explaining.png",
  pose_shock_panic: "/assets/mappa/poses_mc_locked/pose_shock_panic.png",
  pose_climax_domain: "/assets/mappa/poses_mc_locked/pose_climax_domain.png"
};

// Calibrated facial landmarks (normalized 0..1 on each mc_default.jpg-locked pose PNG)
// Enables crisp 12fps On-Twos speech-reactive lip-flap, natural 2-frame eye blink, and golden-amber eye glint!
const POSE_FACE_LANDMARKS = {
  pose_default_smirk: {
    leftEye: [0.432, 0.285],
    rightEye: [0.542, 0.281],
    eyeW: 0.068,
    mouth: [0.492, 0.360],
    mouthW: 0.072,
    browTopY: 0.228,
    cheekDrop: [0.585, 0.305]
  },
  pose_explaining: {
    leftEye: [0.340, 0.292],
    rightEye: [0.442, 0.289],
    eyeW: 0.066,
    mouth: [0.394, 0.365],
    mouthW: 0.070,
    browTopY: 0.236,
    cheekDrop: [0.482, 0.312]
  },
  pose_shock_panic: {
    leftEye: [0.422, 0.328],
    rightEye: [0.568, 0.328],
    eyeW: 0.088,
    mouth: [0.496, 0.430],
    mouthW: 0.086,
    browTopY: 0.262,
    cheekDrop: [0.608, 0.365]
  },
  pose_climax_domain: {
    leftEye: [0.422, 0.328],
    rightEye: [0.568, 0.328],
    eyeW: 0.088,
    mouth: [0.496, 0.430],
    mouthW: 0.084,
    browTopY: 0.262,
    cheekDrop: [0.608, 0.365]
  }
};

export function resolveCanonicalPoseKey(rawPose = "pose_default_smirk") {
  const p = String(rawPose || "").trim();
  if (CHAR_POSE_URLS[p]) return p;
  if (p === "point_reveal") return "pose_explaining";
  if (p === "shock_alert") return "pose_shock_panic";
  if (p === "domain_seal") return "pose_climax_domain";
  return "pose_default_smirk";
}

// Client-side defense-in-depth Pure Japanese Katakana/Kanji SFX sanitizer (rejects mixed Latin like "ズGararara!")
export function sanitizeClientJapaneseSfx(rawSfx = "", isConflict = false) {
  const s = String(rawSfx || "").trim();
  if (!s) return "";
  if (/[A-Za-z0-9]/.test(s)) {
    return isConflict ? "ドォォン!!" : "ゴゴゴ...";
  }
  return s.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFFー・…!?！？.]/g, "").slice(0, 8);
}

const SATSUEI_MOOD_COLORS = {
  jjk_cursed_blue: { shadow: "#1a2246", highlight: "#bae6fd", aura: "#38bdf8", wash: "rgba(12, 26, 62, 0.16)", rim: "#38bdf8" },
  shibuya_neon: { shadow: "#1b1433", highlight: "#fda4af", aura: "#f43f5e", wash: "rgba(20, 12, 40, 0.16)", rim: "#38bdf8" },
  sukuna_crimson: { shadow: "#340a16", highlight: "#fecdd3", aura: "#fb7185", wash: "rgba(92, 12, 28, 0.18)", rim: "#fb7185" },
  hollow_purple: { shadow: "#24104e", highlight: "#e9d5ff", aura: "#c084fc", wash: "rgba(44, 14, 88, 0.18)", rim: "#c084fc" },
  chainsaw_film: { shadow: "#1a2426", highlight: "#fde68a", aura: "#f59e0b", wash: "rgba(20, 30, 34, 0.14)", rim: "#fbbf24" },
  shonen_daylight: { shadow: "#2b3f6b", highlight: "#fffbeb", aura: "#38bdf8", wash: "rgba(255, 250, 232, 0.05)", rim: "#fffbeb" },
  golden_warm: { shadow: "#45232b", highlight: "#fef3c7", aura: "#fbbf24", wash: "rgba(255, 224, 175, 0.08)", rim: "#fde047" }
};

function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / Math.max(1e-5, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function chromaKeyAnimeCel(img) {
  const w = img?.naturalWidth || img?.width || 0;
  const h = img?.naturalHeight || img?.height || 0;
  if (!w || !h || typeof document === "undefined") return img;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) return img;
  g.drawImage(img, 0, 0, w, h);

  try {
    const imgData = g.getImageData(0, 0, w, h);
    const d = imgData.data;
    const keyCb = -0.331264;
    const keyCr = -0.418688;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] / 255;
      let gr = d[i + 1] / 255;
      let b = d[i + 2] / 255;
      const a0 = d[i + 3] / 255;
      if (a0 <= 0.002) continue;

      const cb = -0.168736 * r - 0.331264 * gr + 0.5 * b;
      const cr = 0.5 * r - 0.418688 * gr - 0.081312 * b;
      const dist = Math.hypot(cb - keyCb, cr - keyCr);
      const maxRB = Math.max(r, b);
      const gExcess = gr - maxRB;

      const distMask = smoothstep(0.24, 0.42, dist);
      const greenGuard = 1 - smoothstep(0.06, 0.2, gExcess) * smoothstep(0.22, 0.42, gr);
      let keyAlpha = clamp01(Math.max(distMask, greenGuard * 0.85));
      if (gExcess > 0.18 && gr > 0.32 && dist < 0.37) {
        keyAlpha = 0;
      }

      if (keyAlpha <= 0.01) {
        d[i + 3] = 0;
        continue;
      }

      const edgeFactor = clamp01(1 - keyAlpha);
      const avgRB = 0.5 * (r + b);
      const limitG = maxRB * (1 - (0.25 + edgeFactor * 0.35)) + avgRB * (0.25 + edgeFactor * 0.35);
      const gSpill = Math.max(0, gr - limitG);
      if (gSpill > 0.001) {
        gr -= gSpill * (0.88 + edgeFactor * 0.12);
        const lumRestore = gSpill * 0.36;
        r = Math.min(1, r + lumRestore * 0.55);
        b = Math.min(1, b + lumRestore * 0.62);
      }

      d[i] = Math.round(clamp01(r) * 255);
      d[i + 1] = Math.round(clamp01(gr) * 255);
      d[i + 2] = Math.round(clamp01(b) * 255);
      d[i + 3] = Math.round(a0 * keyAlpha * 255);
    }
    g.putImageData(imgData, 0, 0);
  } catch {
    return img;
  }
  return c;
}

export function extractHaikeiLighting(img) {
  const fallback = {
    shadowTint: "#1e2440",
    highlightTint: "#dbeafe",
    rimTint: "#38bdf8",
    lightDir: [0.74, 0.67]
  };
  const w = img?.naturalWidth || img?.width || 0;
  const h = img?.naturalHeight || img?.height || 0;
  if (!w || !h || typeof document === "undefined") return fallback;

  try {
    const sampleSize = 16;
    const c = document.createElement("canvas");
    c.width = sampleSize;
    c.height = sampleSize;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) return fallback;
    g.drawImage(img, 0, 0, sampleSize, sampleSize);
    const data = g.getImageData(0, 0, sampleSize, sampleSize).data;

    const pixels = [];
    let brightSumW = 0;
    let brightCx = 0;
    let brightCy = 0;

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const idx = (y * sampleSize + x) * 4;
        const r = data[idx];
        const gr = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.2126 * r + 0.7152 * gr + 0.0722 * b;
        pixels.push({ r, g: gr, b, lum });
        if (lum > 120) {
          const weight = (lum - 100) / 155;
          brightSumW += weight;
          brightCx += ((x + 0.5) / sampleSize - 0.5) * weight;
          brightCy += (0.5 - (y + 0.5) / sampleSize) * weight;
        }
      }
    }

    pixels.sort((a, b) => a.lum - b.lum);
    const lowCount = Math.max(1, Math.floor(pixels.length * 0.35));
    const highStart = Math.floor(pixels.length * 0.72);

    let sr = 0, sg = 0, sb = 0;
    for (let i = 0; i < lowCount; i++) {
      sr += pixels[i].r;
      sg += pixels[i].g;
      sb += pixels[i].b;
    }
    sr /= lowCount;
    sg /= lowCount;
    sb /= lowCount;

    const shadowLift = Math.max(1, 78 / Math.max(22, 0.299 * sr + 0.587 * sg + 0.114 * sb));
    const shadowTint = rgbToHex(
      Math.min(180, sr * shadowLift + 16),
      Math.min(180, sg * shadowLift + 16),
      Math.min(195, sb * shadowLift + 20)
    );

    let hr = 0, hg = 0, hb = 0;
    const highCount = Math.max(1, pixels.length - highStart);
    for (let i = highStart; i < pixels.length; i++) {
      hr += pixels[i].r;
      hg += pixels[i].g;
      hb += pixels[i].b;
    }
    hr /= highCount;
    hg /= highCount;
    hb /= highCount;

    const highlightTint = rgbToHex(
      Math.min(255, hr * 0.85 + 38),
      Math.min(255, hg * 0.85 + 38),
      Math.min(255, hb * 0.85 + 38)
    );

    const avgH = (hr + hg + hb) / 3;
    const rimTint = rgbToHex(
      Math.min(255, avgH + (hr - avgH) * 1.45 + 32),
      Math.min(255, avgH + (hg - avgH) * 1.45 + 32),
      Math.min(255, avgH + (hb - avgH) * 1.45 + 32)
    );

    let lx = 0.74;
    let ly = 0.67;
    if (brightSumW > 0.25) {
      const dx = brightCx / brightSumW;
      const dy = Math.max(0.22, brightCy / brightSumW);
      // Ensure a clear directional horizontal component so rim light reads cleanly 1-sided!
      const biasX = Math.abs(dx) < 0.22 ? (dx >= 0 ? 0.55 : -0.55) : dx;
      const len = Math.hypot(biasX, dy) || 1;
      lx = biasX / len;
      ly = dy / len;
    }

    return { shadowTint, highlightTint, rimTint, lightDir: [lx, ly] };
  } catch {
    return fallback;
  }
}

export function computeScriptBeatProgress(scene, fallbackProgress = 0.45) {
  if (!scene) return fallbackProgress;
  const phrases = Array.isArray(scene.subtitlePhrases) && scene.subtitlePhrases.length ? scene.subtitlePhrases : null;
  if (!phrases) {
    const raw = String(scene.narration || "");
    const m = raw.match(/\[[^\]]+\]/);
    if (!m || raw.length < 4) return fallbackProgress;
    return Math.max(0.14, Math.min(0.82, m.index / raw.length));
  }

  const weights = phrases.map((ph) => Math.max(5, ph.map((t) => t.text || "").join(" ").length));
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const dramaticRe = /^(tapi|bahaya|gagal|bocor|overheat|meledak|selamat|jadi|solusi|kunci|rahasi|fakta|plot)/i;

  let accum = 0;
  let firstHighlightRatio = null;
  for (let i = 0; i < phrases.length; i++) {
    const ph = phrases[i];
    const startRatio = accum / totalW;
    const midRatio = (accum + weights[i] * 0.35) / totalW;
    for (const tok of ph) {
      const txt = String(tok?.text || "").replace(/[^a-zA-Z0-9]/g, "");
      if (tok?.highlight) {
        if (firstHighlightRatio === null) firstHighlightRatio = midRatio;
        if (dramaticRe.test(txt)) {
          return Math.max(0.14, Math.min(0.82, i === 0 ? Math.max(0.16, startRatio + 0.08) : midRatio));
        }
      }
    }
    accum += weights[i];
  }
  if (firstHighlightRatio !== null) {
    return Math.max(0.16, Math.min(0.82, firstHighlightRatio));
  }
  return fallbackProgress;
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export class MaouAnimeMappaEngine {
  constructor(width = 720, height = 1280) {
    this.width = width;
    this.height = height;
    this.characterAnchorId = CHARACTER_ANCHOR_ID;

    this.haikeiCanvas = document.createElement("canvas");
    this.haikeiCanvas.width = width;
    this.haikeiCanvas.height = height;
    this.haikeiCtx = this.haikeiCanvas.getContext("2d");

    this.kyaraCanvas = document.createElement("canvas");
    this.kyaraCanvas.width = width;
    this.kyaraCanvas.height = height;
    this.kyaraCtx = this.kyaraCanvas.getContext("2d");

    this.fgCanvas = document.createElement("canvas");
    this.fgCanvas.width = width;
    this.fgCanvas.height = height;
    this.fgCtx = this.fgCanvas.getContext("2d");

    this.stageCanvas = document.createElement("canvas");
    this.stageCanvas.width = width;
    this.stageCanvas.height = height;
    this.ctx = this.stageCanvas.getContext("2d");

    this.satsuei = new MappaSatsuei2DWebGL(width, height);
    this.bgCache = new Map();
    this.bgLightingCache = new Map();
    this.rawCharCache = new Map();
    this.charCache = new Map();
    this.dynamicImgCache = new Map();
    this.gengaSvgCache = new Map();
    this.preloadPromises = [];
    this.activeSceneKey = "";
    this.activeCutPhase = "host";
    this.transStartSec = -10;
    this.activeTransStyle = "whip_cut";
    this.lastImpactMode = 0;
    this.lastRenderedCut = "host";

    this.preloadAssets();
  }

  get domElement() {
    return this.satsuei?.supported ? this.satsuei.canvas : this.stageCanvas;
  }

  captureSnapshotDataUrl(quality = 0.78) {
    try {
      return this.domElement.toDataURL("image/jpeg", quality);
    } catch {
      return null;
    }
  }

  resize(width, height) {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    for (const c of [this.haikeiCanvas, this.kyaraCanvas, this.fgCanvas, this.stageCanvas]) {
      c.width = width;
      c.height = height;
    }
    this.satsuei?.resize(width, height);
  }

  preloadAssets() {
    if (typeof Image === "undefined") return;
    this.preloadPromises = [];
    for (const [key, url] of Object.entries(HAIKEI_URLS)) {
      this.preloadPromises.push(
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            this.bgCache.set(key, img);
            this.bgLightingCache.set(key, extractHaikeiLighting(img));
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        })
      );
    }
    for (const [pose, url] of Object.entries(CHAR_POSE_URLS)) {
      this.preloadPromises.push(
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            this.rawCharCache.set(pose, img);
            if (!this.satsuei?.supported) {
              this.charCache.set(pose, chromaKeyAnimeCel(img));
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        })
      );
    }
  }

  getDynamicImage(urlOrDataUrl, isHaikei = false) {
    if (!urlOrDataUrl || typeof Image === "undefined") return null;
    const cached = this.dynamicImgCache.get(urlOrDataUrl);
    if (cached) return cached.ready ? cached.img : null;

    const entry = { img: new Image(), ready: false, lighting: null, promise: null };
    entry.promise = new Promise((resolve) => {
      entry.img.crossOrigin = "anonymous";
      entry.img.onload = () => {
        entry.ready = true;
        if (isHaikei) {
          entry.lighting = extractHaikeiLighting(entry.img);
          this.bgLightingCache.set(urlOrDataUrl, entry.lighting);
        }
        resolve(entry.img);
      };
      entry.img.onerror = () => resolve(null);
      entry.img.src = urlOrDataUrl;
    });
    this.dynamicImgCache.set(urlOrDataUrl, entry);
    if (this.dynamicImgCache.size > 32) {
      const firstKey = this.dynamicImgCache.keys().next().value;
      this.dynamicImgCache.delete(firstKey);
    }
    return null;
  }

  getGengaImage(svgMarkup) {
    if (!svgMarkup || typeof Image === "undefined") return null;
    const cached = this.gengaSvgCache.get(svgMarkup);
    if (cached) return cached.ready ? cached.img : null;

    const entry = { img: new Image(), ready: false, promise: null };
    entry.promise = new Promise((resolve) => {
      entry.img.onload = () => {
        entry.ready = true;
        resolve(entry.img);
      };
      entry.img.onerror = () => resolve(null);
      entry.img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
    });
    this.gengaSvgCache.set(svgMarkup, entry);
    if (this.gengaSvgCache.size > 40) {
      const firstKey = this.gengaSvgCache.keys().next().value;
      this.gengaSvgCache.delete(firstKey);
    }
    return null;
  }

  async ensureAssetsReady(blueprints = [], timeoutMs = 4500) {
    if (typeof Image === "undefined") return;
    const waiters = [...(this.preloadPromises || [])];
    for (const bp of blueprints || []) {
      if (bp?.gengaSvg) {
        this.getGengaImage(bp.gengaSvg);
        const cached = this.gengaSvgCache.get(bp.gengaSvg);
        if (cached?.promise) waiters.push(cached.promise);
      }
      for (const [field, isBg] of [
        ["customHaikeiUrl", true],
        ["customCutawayUrl", true],
        ["customKyaraUrl", false]
      ]) {
        if (bp?.[field]) {
          this.getDynamicImage(bp[field], isBg);
          const cached = this.dynamicImgCache.get(bp[field]);
          if (cached?.promise) waiters.push(cached.promise);
        }
      }
    }
    if (!waiters.length) return;
    await Promise.race([
      Promise.allSettled(waiters),
      new Promise((resolve) => setTimeout(resolve, timeoutMs))
    ]);
  }

  // ============================================================================
  // PLANE 1: PAINTED 2D HAIKEI BACKGROUND (30FPS SMOOTH PARALLAX)
  // ============================================================================
  drawHaikeiLayer(ctx, W, H, bgKey, customHaikeiUrl, camOffX, camOffY, camZoom, camTilt, moodCfg) {
    const customImg = customHaikeiUrl ? this.getDynamicImage(customHaikeiUrl, true) : null;
    const bgImg = customImg || this.bgCache.get(bgKey) || this.bgCache.get("shibuya_night");

    ctx.save();
    ctx.translate(W / 2 + camOffX * 0.42, H / 2 + camOffY * 0.42);
    ctx.rotate(camTilt * 0.55);
    const scale = 1.14 * camZoom;
    ctx.scale(scale, scale);

    if (bgImg && (bgImg.naturalWidth || bgImg.width)) {
      const iw = bgImg.naturalWidth || bgImg.width;
      const ih = bgImg.naturalHeight || bgImg.height;
      const cover = Math.max(W / iw, H / ih);
      const dw = iw * cover;
      const dh = ih * cover;
      ctx.drawImage(bgImg, -dw / 2, -dh / 2, dw, dh);
    } else {
      const grad = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
      grad.addColorStop(0, moodCfg.shadow);
      grad.addColorStop(0.55, "#172554");
      grad.addColorStop(1, "#07080f");
      ctx.fillStyle = grad;
      ctx.fillRect(-W / 2, -H / 2, W, H);
    }
    ctx.restore();

    ctx.fillStyle = moodCfg.wash;
    ctx.fillRect(0, 0, W, H);
  }

  // ============================================================================
  // FIX 2: FULL-SCREEN 9:16 DARK-ANIME TECHNICAL CUTAWAY (ZERO WHITE BOX / ZERO FLAT CLIPART!)
  // Renders either Gemini-generated full-screen 9:16 cutaway OR dramatic dark-action anime macro plate
  // ============================================================================
  drawFullScreenDarkAnimeCutaway(ctx, W, H, bp, camOffX, camOffY, camZoom, camTilt, tSec, step12, auraHex, isConflict) {
    const customCutImg = bp.customCutawayUrl ? this.getDynamicImage(bp.customCutawayUrl, true) : null;

    if (customCutImg && (customCutImg.naturalWidth || customCutImg.width)) {
      ctx.save();
      ctx.translate(W / 2 + camOffX * 0.5, H / 2 + camOffY * 0.5);
      ctx.rotate(camTilt * 0.5);
      const scale = 1.10 * camZoom;
      ctx.scale(scale, scale);
      const iw = customCutImg.naturalWidth || customCutImg.width;
      const ih = customCutImg.naturalHeight || customCutImg.height;
      const cover = Math.max(W / iw, H / ih);
      ctx.drawImage(customCutImg, -(iw * cover) / 2, -(ih * cover) / 2, iw * cover, ih * cover);
      ctx.restore();
      return;
    }

    // Dark-action atmospheric anime macro cutaway (built over dark-graded Haikei so texture stays painterly!)
    const kind = bp.cutawayKind || "copper_coils_sparks";
    const bgImg = this.bgCache.get(bp.haikeiBg || "anime_lab") || this.bgCache.get("anime_lab");

    ctx.save();
    ctx.translate(W / 2 + camOffX * 0.55, H / 2 + camOffY * 0.55);
    ctx.rotate(camTilt * 0.45);
    ctx.scale(1.22 * camZoom, 1.22 * camZoom);
    if (bgImg && (bgImg.naturalWidth || bgImg.width)) {
      const iw = bgImg.naturalWidth || bgImg.width;
      const ih = bgImg.naturalHeight || bgImg.height;
      const cover = Math.max(W / iw, H / ih);
      ctx.drawImage(bgImg, -(iw * cover) / 2, -(ih * cover) / 2, iw * cover, ih * cover);
    }
    ctx.restore();

    // Heavy chiaroscuro dark vignette backdrop so the glowing technical subject pops like an anime macro shot!
    const darkGrad = ctx.createRadialGradient(W * 0.5, H * 0.44, W * 0.08, W * 0.5, H * 0.48, H * 0.65);
    darkGrad.addColorStop(0, isConflict ? "rgba(42, 10, 18, 0.52)" : "rgba(10, 18, 34, 0.54)");
    darkGrad.addColorStop(0.65, "rgba(6, 9, 18, 0.84)");
    darkGrad.addColorStop(1, "rgba(3, 5, 10, 0.96)");
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.5 + camOffX * 0.85;
    const cy = H * 0.45 + camOffY * 0.85;
    const vibX = isConflict ? Math.sin(step12 * 52) * 5.5 : 0;
    const vibY = isConflict ? Math.cos(step12 * 47) * 4.0 : 0;

    ctx.save();
    ctx.translate(cx + vibX, cy + vibY);
    ctx.scale(camZoom, camZoom);

    if (kind === "copper_coils_sparks" || kind === "jammed_shaft_dust") {
      // Dramatic dark anime stator & glowing copper coils + steel rotor shaft + flying sparks!
      const R = W * 0.36;
      // Outer dark gunmetal housing with hard 2-tone cel rim
      ctx.fillStyle = "#111827";
      ctx.strokeStyle = "#04060c";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#080b14";
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.86, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 8 Red-hot / Amber glowing hand-inked copper coil windings around stator
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + (kind === "jammed_shaft_dust" ? 0.12 : 0);
        ctx.save();
        ctx.rotate(ang);
        const heatPulse = 0.65 + Math.sin(step12 * 10 + i) * 0.35;
        const cGrad = ctx.createLinearGradient(-28, -R * 0.96, 28, -R * 0.54);
        cGrad.addColorStop(0, isConflict ? "#ef4444" : "#f59e0b");
        cGrad.addColorStop(0.55, isConflict ? "#f97316" : "#b45309");
        cGrad.addColorStop(1, "#451a03");
        ctx.fillStyle = cGrad;
        ctx.strokeStyle = "#05060b";
        ctx.lineWidth = 4;
        drawRoundedRectPath(ctx, -28, -R * 0.98, 56, R * 0.34, 8);
        ctx.fill();
        ctx.stroke();

        // Crisp wound copper wire lines
        ctx.strokeStyle = isConflict ? `rgba(254, 215, 170, ${0.45 + heatPulse * 0.45})` : "rgba(253, 224, 71, 0.5)";
        ctx.lineWidth = 2;
        for (let w = 0; w < 4; w++) {
          const wy = -R * 0.92 + w * 14;
          ctx.beginPath();
          ctx.moveTo(-22, wy);
          ctx.lineTo(22, wy);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Central steel rotor shaft (spins smoothly OR jams/vibrates on TAPI!)
      ctx.save();
      const rot = kind === "jammed_shaft_dust" || isConflict ? Math.sin(step12 * 40) * 0.08 : tSec * 3.8;
      ctx.rotate(rot);
      const rotorGrad = ctx.createLinearGradient(-R * 0.45, -R * 0.45, R * 0.45, R * 0.45);
      rotorGrad.addColorStop(0, "#64748b");
      rotorGrad.addColorStop(0.45, "#1e293b");
      rotorGrad.addColorStop(1, "#090d16");
      ctx.fillStyle = rotorGrad;
      ctx.strokeStyle = "#04060c";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Specular metallic slash highlights
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.42, -2.4, -1.2);
      ctx.stroke();

      // Steel center axle nut
      ctx.fillStyle = isConflict ? "#f43f5e" : auraHex;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#04060c";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Dramatic anime electric sparks & heat streaks shooting outward (12fps On-Twos!)
      const seed = Math.floor(step12 * 12);
      for (let s = 0; s < 14; s++) {
        const ang = (s / 14) * Math.PI * 2 + (seed % 5) * 0.27;
        const r0 = R * (0.36 + ((s * 13 + seed * 7) % 10) * 0.03);
        const r1 = r0 + R * (0.28 + ((s * 19 + seed * 11) % 7) * 0.08);
        ctx.strokeStyle = s % 2 === 0 ? "#fef08a" : isConflict ? "#fb7185" : auraHex;
        ctx.lineWidth = s % 3 === 0 ? 4.5 : 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
        ctx.lineTo(
          Math.cos(ang + 0.08) * ((r0 + r1) * 0.52),
          Math.sin(ang + 0.08) * ((r0 + r1) * 0.52)
        );
        ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.stroke();
      }
    } else if (kind === "cracked_blade_vibration") {
      // Dramatic dark anime macro of vibrating cracked fan/turbine blades with anime motion ghosts!
      const R = W * 0.42;
      const ghosts = isConflict ? 3 : 2;
      for (let gIdx = ghosts - 1; gIdx >= 0; gIdx--) {
        ctx.save();
        ctx.globalAlpha = gIdx === 0 ? 1.0 : 0.28 / gIdx;
        const spin = isConflict ? Math.sin(step12 * 45) * 0.12 - gIdx * 0.09 : tSec * 4.5 - gIdx * 0.18;
        ctx.rotate(spin);
        for (let b = 0; b < 3; b++) {
          ctx.save();
          ctx.rotate((b * Math.PI * 2) / 3);
          const bGrad = ctx.createLinearGradient(-40, -R, 50, 0);
          bGrad.addColorStop(0, "#334155");
          bGrad.addColorStop(0.55, "#1e293b");
          bGrad.addColorStop(1, "#090d16");
          ctx.fillStyle = bGrad;
          ctx.strokeStyle = "#04060c";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(R * 0.45, -R * 0.25, R * 0.42, -R * 0.92, 0, -R);
          ctx.bezierCurveTo(-R * 0.34, -R * 0.85, -R * 0.25, -R * 0.25, 0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Sharp glowing stress-fracture crack on primary blade during conflict!
          if (gIdx === 0 && b === 0) {
            ctx.strokeStyle = isConflict ? "#fb7185" : "#38bdf8";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-8, -R * 0.32);
            ctx.lineTo(14, -R * 0.52);
            ctx.lineTo(-4, -R * 0.66);
            ctx.lineTo(18, -R * 0.84);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = isConflict ? "#f43f5e" : auraHex;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    } else if (kind === "thermal_freeze_crystal") {
      // Dramatic dark anime frost crystal lattice & swirling sub-zero mist
      const R = W * 0.38;
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i / 6) * Math.PI * 2 + step12 * 0.25);
        const iceGrad = ctx.createLinearGradient(0, -R, 0, 0);
        iceGrad.addColorStop(0, "#e0f2fe");
        iceGrad.addColorStop(0.5, "#0284c7");
        iceGrad.addColorStop(1, "#082f49");
        ctx.fillStyle = iceGrad;
        ctx.strokeStyle = "#04060c";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, -R);
        ctx.lineTo(34, -R * 0.45);
        ctx.lineTo(0, 0);
        ctx.lineTo(-34, -R * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = "#38bdf8";
      ctx.strokeStyle = "#04060c";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Dark anime high-energy plasma / fluid / thermal schematic macro with glowing core & arcs
      const R = W * 0.36;
      ctx.strokeStyle = auraHex;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([28, 14]);
      ctx.save();
      ctx.rotate(step12 * 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const coreGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, R * 0.72);
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.28, auraHex);
      coreGrad.addColorStop(0.7, "#0f172a");
      coreGrad.addColorStop(1, "rgba(7, 9, 18, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // Hand-drawn anime energy arcs
      const seed = Math.floor(step12 * 12);
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2 + seed * 0.19;
        ctx.strokeStyle = a % 2 === 0 ? "#fef08a" : auraHex;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * R * 0.2, Math.sin(ang) * R * 0.2);
        ctx.lineTo(Math.cos(ang + 0.22) * R * 0.56, Math.sin(ang + 0.22) * R * 0.56);
        ctx.lineTo(Math.cos(ang - 0.1) * R * 0.96, Math.sin(ang - 0.1) * R * 0.96);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Subtle dark anime technical cutaway label bar at top-safe area (NO white box!)
    if (bp.gengaTitle) {
      const SAFE_PAD = Math.max(36, Math.round(48 * (W / 720)));
      const labelTxt = String(bp.gengaTitle).toUpperCase().slice(0, 28);
      ctx.save();
      ctx.font = `800 ${Math.round(W * 0.025)}px 'JetBrains Mono', monospace`;
      const tw = Math.min(W - SAFE_PAD * 2 - 24, ctx.measureText(labelTxt).width + 28);
      const bx = SAFE_PAD;
      const by = H * 0.155;
      ctx.fillStyle = "rgba(6, 9, 16, 0.76)";
      ctx.fillRect(bx, by, tw, 30);
      ctx.fillStyle = isConflict ? "#f43f5e" : auraHex;
      ctx.fillRect(bx, by, 4, 30);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, tw, 30);
      ctx.fillStyle = "#f1f5f9";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(labelTxt, bx + 14, by + 15, tw - 20);
      ctx.restore();
    }
  }

  // ============================================================================
  // BACK & FOREGROUND 2D HAND-DRAWN SAKUGA VFX (STRICT 12FPS ON-TWOS!)
  // ============================================================================
  draw2DDomainSeal(ctx, cx, cy, radius, auraHex, step12) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(step12 * 0.45);
    ctx.strokeStyle = auraHex;
    ctx.lineWidth = 3.5;
    ctx.globalAlpha = 0.68;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([22, 12]);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.rotate(-step12 * 0.9);
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + (k * Math.PI) / 3;
        const px = Math.cos(a) * radius * 0.78;
        const py = Math.sin(a) * radius * 0.78;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  draw2DCursedFlames(ctx, cx, baseY, spreadW, heightH, auraHex, step12) {
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const u = (step12 * 1.35 + i * 0.19) % 1;
      const side = ((i * 73) % 100) / 100 - 0.5;
      const fx = cx + side * spreadW + Math.sin(step12 * 6 + i * 2.1) * 24;
      const fy = baseY - u * heightH;
      const fw = (1 - u * 0.65) * (30 + (i % 3) * 12);
      const fh = (1 - u * 0.4) * (82 + (i % 4) * 24);

      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.84;
      ctx.fillStyle = auraHex;
      ctx.strokeStyle = "#07080d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx, fy - fh);
      ctx.quadraticCurveTo(fx + fw, fy - fh * 0.35, fx + fw * 0.35, fy);
      ctx.quadraticCurveTo(fx, fy + fw * 0.25, fx - fw * 0.35, fy);
      ctx.quadraticCurveTo(fx - fw, fy - fh * 0.35, fx, fy - fh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.fillStyle = "#07080f";
        ctx.beginPath();
        ctx.moveTo(fx, fy - fh * 0.68);
        ctx.quadraticCurveTo(fx + fw * 0.45, fy - fh * 0.25, fx, fy - fh * 0.08);
        ctx.quadraticCurveTo(fx - fw * 0.45, fy - fh * 0.25, fx, fy - fh * 0.68);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  draw2DBlackFlashLightning(ctx, cx, cy, radius, step12, burstStrength = 1.0) {
    ctx.save();
    ctx.globalAlpha = clamp01(burstStrength);
    const seed = Math.floor(step12 * 12);
    for (let b = 0; b < 7; b++) {
      const baseAng = (b / 7) * Math.PI * 2 + (seed % 9) * 0.42;
      const pts = [[cx, cy]];
      let px = cx;
      let py = cy;
      for (let s = 1; s <= 5; s++) {
        const jitter = Math.sin(seed * 7.3 + b * 3.1 + s * 5.7) * 0.55;
        const dist = (radius / 5) * (0.75 + ((s * 17 + b * 11) % 5) * 0.14);
        px += Math.cos(baseAng + jitter) * dist;
        py += Math.sin(baseAng + jitter) * dist;
        pts.push([px, py]);
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "miter";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 10;
      ctx.beginPath();
      pts.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();

      ctx.strokeStyle = "#06060b";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      pts.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    }
    ctx.restore();
  }

  draw2DSlashSmears(ctx, W, H, auraHex, step12) {
    ctx.save();
    const u = (step12 * 1.4) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.85;
    ctx.translate(W * 0.52, H * 0.46);
    ctx.rotate(-0.45 + u * 0.55);

    ctx.fillStyle = auraHex;
    ctx.strokeStyle = "#07080d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, W * 0.46, -1.1, 1.05);
    ctx.arc(-26, 12, W * 0.40, 1.05, -1.1, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  draw2DRainStreaks(ctx, W, H, step12) {
    ctx.save();
    ctx.strokeStyle = "rgba(186, 230, 253, 0.34)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 36; i++) {
      const rx = ((i * 97 + step12 * 260) % (W + 120)) - 60;
      const ry = ((i * 157 + step12 * 1520) % (H + 160)) - 80;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 14, ry + 58);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw2DEmbersPetals(ctx, W, H, auraHex, step12) {
    ctx.save();
    for (let i = 0; i < 20; i++) {
      const u = (step12 * 0.28 + i * 0.13) % 1;
      const px = ((i * 83) % W) + Math.sin(step12 * 2.2 + i) * 34;
      const py = H * 0.92 - u * H * 0.95;
      const sz = 3.2 + (i % 4) * 2.0;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(step12 * 2.5 + i);
      ctx.fillStyle = i % 3 === 0 ? "#fef08a" : auraHex;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.78;
      ctx.beginPath();
      ctx.ellipse(0, 0, sz, sz * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  draw2DAnimeSparklesSteam(ctx, W, H, auraHex, step12) {
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const sx = W * (0.14 + ((i * 37) % 72) * 0.01);
      const sy = H * (0.20 + ((i * 53) % 44) * 0.01);
      const pulse = 0.55 + Math.abs(Math.sin(step12 * 4.5 + i * 1.4)) * 0.85;
      const r = (7 + (i % 3) * 4) * pulse;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#fef08a";
      ctx.strokeStyle = "#07080d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.5);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.quadraticCurveTo(0, 0, 0, r * 1.5);
      ctx.quadraticCurveTo(0, 0, -r, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r * 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  draw2DMangaSpeedLines(ctx, W, H, auraHex, step12) {
    ctx.save();
    const cx = W * 0.5;
    const cy = H * 0.44;
    const seed = Math.floor(step12 * 12);
    for (let i = 0; i < 42; i++) {
      const ang = (i / 42) * Math.PI * 2 + (seed % 7) * 0.04;
      const inner = W * (0.42 + ((i * 29 + seed * 13) % 16) * 0.014);
      const outer = Math.max(W, H) * 0.92;
      ctx.fillStyle = i % 5 === 0 ? auraHex : i % 2 === 0 ? "#07080d" : "#ffffff";
      ctx.globalAlpha = i % 5 === 0 ? 0.48 : 0.34;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
      ctx.lineTo(cx + Math.cos(ang - 0.015) * outer, cy + Math.sin(ang - 0.015) * outer);
      ctx.lineTo(cx + Math.cos(ang + 0.015) * outer, cy + Math.sin(ang + 0.015) * outer);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawForegroundAtmosphere(ctx, W, H, tSec, highlightHex, lightDir, camOffX, camOffY) {
    ctx.save();
    const lx = Array.isArray(lightDir) ? lightDir[0] : 0.74;
    const originX = lx >= 0 ? W * 0.88 : W * 0.12;
    const targetX = lx >= 0 ? W * 0.24 : W * 0.76;
    ctx.globalAlpha = 0.068;
    for (let s = 0; s < 2; s++) {
      const shift = Math.sin(tSec * 0.45 + s * 2.1) * 26 + camOffX * 0.35;
      const grad = ctx.createLinearGradient(originX + shift, 0, targetX + shift, H * 0.85);
      grad.addColorStop(0, highlightHex || "#fef3c7");
      grad.addColorStop(0.55, "rgba(255,255,255,0.20)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      const spread = 66 + s * 40;
      ctx.moveTo(originX - spread + shift, -20);
      ctx.lineTo(originX + spread * 0.6 + shift, -20);
      ctx.lineTo(targetX + spread * 1.4 + shift, H * 0.88);
      ctx.lineTo(targetX - spread * 0.8 + shift, H * 0.88);
      ctx.closePath();
      ctx.fill();
    }

    for (let i = 0; i < 16; i++) {
      const u = (tSec * 0.09 + i * 0.173) % 1;
      const mx = ((i * 97 + Math.sin(tSec * 0.7 + i * 1.9) * 30 + camOffX * 1.35) % (W + 40) + (W + 40)) % (W + 40) - 20;
      const my = H * 0.92 - u * H * 0.88 + camOffY * 1.35;
      const rad = 1.5 + (i % 4) * 1.15;
      const alpha = Math.sin(u * Math.PI) * (0.20 + (i % 3) * 0.11);

      const dGrad = ctx.createRadialGradient(mx, my, 0, mx, my, rad * 2.4);
      dGrad.addColorStop(0, highlightHex || "#fffbeb");
      dGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.arc(mx, my, rad * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ============================================================================
  // FIX 1 + FIX 5: SINGLE SOLID UNBROKEN 2D KYARA CEL (ZERO SCANLINES!) + LIVING LIP-FLAP / EYE-BLINK / GLINT
  // ============================================================================
  draw2DAnimeCharacterCel(ctx, charImg, poseKey, x, y, drawW, drawH, step12, voiceEnergy, flipX = false) {
    if (!charImg) return;
    const sw = charImg.width || charImg.naturalWidth;
    const sh = charImg.height || charImg.naturalHeight;
    if (!sw || !sh) return;

    // 12fps On-Twos organic living breathing + subtle upper-body posture sway (ZERO horizontal strip slicing!)
    const steppedVoice = Math.round(clamp01(voiceEnergy) * 5) / 5;
    const breatheY = Math.sin(step12 * 2.5) * 3.8 - steppedVoice * 4.5;
    const breatheScaleY = 1.0 + Math.sin(step12 * 2.5) * 0.011 + steppedVoice * 0.012;
    const subtlePivot = Math.sin(step12 * 1.65) * 0.011;

    ctx.save();
    ctx.translate(x, y + breatheY);
    ctx.rotate(subtlePivot);
    ctx.scale(flipX ? -1 : 1, breatheScaleY);

    // SINGLE SOLID UNBROKEN DRAW CALL — 100% eliminates horizontal scanline / stripe seam artifacts!
    ctx.drawImage(charImg, -drawW / 2, -drawH, drawW, drawH);

    // Living Anime Facial Micro-Animation (strictly aligned to mc_default.jpg pose landmarks!)
    const lm = POSE_FACE_LANDMARKS[poseKey] || POSE_FACE_LANDMARKS.pose_default_smirk;
    const ox = -drawW / 2;
    const oy = -drawH;

    // 1. Shock/Panic Dramatic Forehead Tension Vignette (soft feathered oval — ZERO sharp rectangle!) & Clean Cel Sweat-Drop
    if (poseKey === "pose_shock_panic") {
      ctx.save();
      const browY = oy + (lm.browTopY + 0.045) * drawH;
      const faceCx = ox + ((lm.leftEye[0] + lm.rightEye[0]) * 0.5) * drawW;
      const rGrad = ctx.createRadialGradient(faceCx, browY, drawW * 0.02, faceCx, browY, drawW * 0.14);
      rGrad.addColorStop(0, "rgba(10, 8, 22, 0.42)");
      rGrad.addColorStop(0.6, "rgba(10, 8, 22, 0.20)");
      rGrad.addColorStop(1, "rgba(10, 8, 22, 0)");
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.ellipse(faceCx, browY, drawW * 0.14, drawH * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();

      // Clean 2D cel anime sweat-drop on cheek (12fps bob)
      const dx = ox + lm.cheekDrop[0] * drawW;
      const dy = oy + lm.cheekDrop[1] * drawH + Math.sin(step12 * 8) * 2.5;
      const dr = drawW * 0.022;
      ctx.fillStyle = "#bae6fd";
      ctx.strokeStyle = "#07080d";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(dx, dy - dr * 1.7);
      ctx.quadraticCurveTo(dx + dr, dy + dr * 0.3, dx, dy + dr);
      ctx.quadraticCurveTo(dx - dr, dy + dr * 0.3, dx, dy - dr * 1.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(dx - dr * 0.22, dy + dr * 0.15, dr * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Speech-Reactive 2-3 Frame Cel Mouth / Lip-Flap synced to ElevenLabs voice amplitude!
    if (steppedVoice >= 0.18) {
      const mx = ox + lm.mouth[0] * drawW;
      const my = oy + lm.mouth[1] * drawH;
      const mw = lm.mouthW * drawW;
      const openLevel = steppedVoice >= 0.55 ? 2 : 1; // 2 discrete anime cel mouth shapes (half-open / wide-open)
      const mh = openLevel === 2 ? mw * 0.42 : mw * 0.22;

      ctx.save();
      ctx.fillStyle = "#3b0a18";
      ctx.strokeStyle = "#090a0f";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(mx - mw * 0.46, my - mh * 0.25);
      ctx.quadraticCurveTo(mx, my - mh * 0.55, mx + mw * 0.46, my - mh * 0.25);
      ctx.quadraticCurveTo(mx, my + mh * 1.05, mx - mw * 0.46, my - mh * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Subtle upper cel teeth flash on wide vowel peak
      if (openLevel === 2) {
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.ellipse(mx, my - mh * 0.12, mw * 0.28, mh * 0.2, 0, 0, Math.PI);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Natural Periodic 2-Frame Eye Blink (~every 3.3s) OR Golden-Amber Eye Glint on dramatic voice peaks!
    const blinkCycle = step12 % 3.35;
    const isBlinking = blinkCycle > 3.18 && poseKey !== "pose_shock_panic";
    if (isBlinking) {
      ctx.save();
      for (const [exN, eyN] of [lm.leftEye, lm.rightEye]) {
        const ex = ox + exN * drawW;
        const ey = oy + eyN * drawH;
        const ew = lm.eyeW * drawW;
        // Skin-matched eyelid cover + sharp curved anime lash line
        ctx.fillStyle = "#d9c2b6";
        ctx.beginPath();
        ctx.ellipse(ex, ey, ew * 0.54, ew * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#090a0f";
        ctx.lineWidth = 3.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ex - ew * 0.52, ey);
        ctx.quadraticCurveTo(ex, ey + ew * 0.16, ex + ew * 0.52, ey);
        ctx.stroke();
      }
      ctx.restore();
    } else if (steppedVoice >= 0.45 || poseKey === "pose_climax_domain" || poseKey === "pose_shock_panic") {
      // Dramatic golden-amber anime eye glint shimmer!
      const glintAlpha = poseKey === "pose_climax_domain" ? 0.72 : 0.45 + steppedVoice * 0.35;
      ctx.save();
      ctx.globalAlpha = clamp01(glintAlpha);
      for (const [exN, eyN] of [lm.leftEye, lm.rightEye]) {
        const ex = ox + exN * drawW;
        const ey = oy + eyN * drawH;
        const gr = lm.eyeW * drawW * 0.42;
        const gGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, gr);
        gGrad.addColorStop(0, "#fef08a");
        gGrad.addColorStop(0.45, "rgba(245, 158, 11, 0.55)");
        gGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(ex, ey, gr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // ============================================================================
  // FIX 2 FALLBACK: TRANSLUCENT DARK-GLASS GLOWING ANIME BLUEPRINT HUD (ZERO PURE WHITE!)
  // Strictly masked out during Impact Frames & clamped inside >= 48px safe margins!
  // ============================================================================
  drawDarkGlassAnimeHud(ctx, W, gengaImg, titleText, cx, cy, boxSize, auraHex, step12, sceneElapsedSec, isConflict) {
    if (!gengaImg) return;
    const SAFE_PAD = Math.max(36, Math.round(48 * (W / 720)));
    const half = boxSize * 0.5;
    // Strict horizontal safe-margin clamping (never clips right/left border!)
    const safeCx = Math.max(SAFE_PAD + half, Math.min(W - SAFE_PAD - half, cx));

    const pop = sceneElapsedSec < 0.22 ? 0.84 + (sceneElapsedSec / 0.22) * 0.16 : 1.0;
    const floatY = Math.sin(step12 * 2.2) * 4;
    const jitterX = isConflict ? Math.sin(step12 * 38) * 3 : 0;

    ctx.save();
    ctx.translate(safeCx + jitterX, cy + floatY);
    ctx.scale(pop, pop);

    // Translucent dark-glass backing (NO white fill, NO bright radial circle!)
    ctx.fillStyle = "rgba(7, 10, 18, 0.74)";
    ctx.fillRect(-half, -half, boxSize, boxSize);

    // Subtle dark-blueprint hairlines inside HUD
    ctx.strokeStyle = "rgba(148, 163, 184, 0.10)";
    ctx.lineWidth = 1;
    const gridStep = boxSize / 6;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-half + i * gridStep, -half);
      ctx.lineTo(-half + i * gridStep, half);
      ctx.moveTo(-half, -half + i * gridStep);
      ctx.lineTo(half, -half + i * gridStep);
      ctx.stroke();
    }

    // Crisp outer hairline frame + tactical glowing corner brackets
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-half, -half, boxSize, boxSize);

    const bLen = Math.round(boxSize * 0.11);
    ctx.strokeStyle = isConflict ? "#fb7185" : auraHex;
    ctx.lineWidth = 3;
    const corners = [
      [-half, -half, 1, 1],
      [half, -half, -1, 1],
      [-half, half, 1, -1],
      [half, half, -1, -1]
    ];
    for (const [bx, by, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(bx, by + dy * bLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + dx * bLen, by);
      ctx.stroke();
    }

    // Draw dark-blueprint schematic cleanly inside dark glass
    const pad = boxSize * 0.10;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(gengaImg, -half + pad, -half + pad, boxSize - pad * 2, boxSize - pad * 2);

    if (titleText) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(5, 8, 15, 0.86)";
      ctx.fillRect(-half, half - 26, boxSize, 26);
      ctx.fillStyle = isConflict ? "#fda4af" : "#bae6fd";
      ctx.font = `700 ${Math.max(10, Math.round(boxSize * 0.055))}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(titleText).toUpperCase().slice(0, 22), 0, half - 13, boxSize - 16);
    }

    ctx.restore();
  }

  // ============================================================================
  // FIX 3: AUTO-SCALED & SAFE-MARGIN-CLAMPED PURE JAPANESE SFX (NEVER CLIPS OFF EDGE!)
  // ============================================================================
  drawSafeJapaneseSfx(ctx, W, H, rawSfxText, step12, sceneElapsedSec, isConflict) {
    const text = sanitizeClientJapaneseSfx(rawSfxText, isConflict);
    if (!text) return;

    const SAFE_PAD = Math.max(36, Math.round(48 * (W / 720)));
    const maxAvailW = W * 0.44;
    let fontSize = Math.round(W * 0.048);

    ctx.save();
    ctx.font = `900 ${fontSize}px 'Plus Jakarta Sans', 'Yu Gothic', 'Meiryo', sans-serif`;
    let measured = ctx.measureText(text).width;
    if (measured > maxAvailW && measured > 1) {
      fontSize = Math.max(18, Math.floor(fontSize * (maxAvailW / measured)));
      ctx.font = `900 ${fontSize}px 'Plus Jakarta Sans', 'Yu Gothic', 'Meiryo', sans-serif`;
      measured = ctx.measureText(text).width;
    }

    const punch = sceneElapsedSec < 0.2 ? 1.18 - (sceneElapsedSec / 0.2) * 0.18 : 1 + Math.sin(step12 * 8) * 0.025;
    // Account for peak scale + tilt when clamping horizontal position inside [SAFE_PAD, W - SAFE_PAD]
    const halfSpan = (measured * 1.18) * 0.5 + 10;
    const tx = Math.max(SAFE_PAD + halfSpan, Math.min(W - SAFE_PAD - halfSpan, W * 0.78));
    const ty = Math.max(H * 0.16, Math.min(H * 0.24, H * 0.175));

    ctx.translate(tx, ty);
    ctx.rotate(-0.09);
    ctx.scale(punch, punch);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(6, Math.round(fontSize * 0.22));
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#07080d";
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = isConflict ? "#fb7185" : "#fde047";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  renderVideoClipWithSatsuei(videoEl, blueprint, tSec, sceneElapsedSec = 0, sceneDurationSec = 4.6) {
    const W = this.width;
    const H = this.height;
    const ctx = this.haikeiCtx;
    if (!ctx || !videoEl) return;

    const vw = videoEl.videoWidth || W;
    const vh = videoEl.videoHeight || H;
    const scale = Math.max(W / vw, H / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(videoEl, (W - dw) / 2, (H - dh) / 2, dw, dh);

    const bp = blueprint || {};
    const moodCfg = SATSUEI_MOOD_COLORS[bp.satsueiMood] || SATSUEI_MOOD_COLORS.jjk_cursed_blue;
    const grade = bp.satsueiGrade || {};
    if (this.satsuei?.supported) {
      this.satsuei.render(this.haikeiCanvas, {
        tSec,
        bloomStrength: grade.bloomStrength ?? 0.28,
        contrast: grade.contrast ?? 1.08,
        saturation: grade.saturation ?? 1.12,
        shadowCrush: grade.shadowCrush ?? 0.14,
        chromatic: 0.0022,
        impactMode: 0,
        impactIntensity: 0,
        transProgress: Math.min(1, Math.max(0, sceneElapsedSec / 0.15)),
        transStyle: bp.transitionStyle || "zoom_punch",
        barrel: 0.018,
        shadowTint: moodCfg.shadow,
        auraTint: bp.auraColor || moodCfg.aura
      });
    } else {
      this.ctx.drawImage(this.haikeiCanvas, 0, 0, W, H);
    }
  }

  // ============================================================================
  // MAIN RENDER FRAME (3-PLANE SATSUEI + ALTERNATING CUT A/B + 12FPS ON-TWOS + 0.15s SNAPPY CUTS)
  // ============================================================================
  renderFrame(
    blueprint,
    sceneKey,
    tSec,
    sceneElapsedSec = 0,
    sceneDurationSec = 4.6,
    voiceEnergy = 0,
    options = {}
  ) {
    const showCharacter = options?.showCharacter !== false;
    const sceneRef = options?.scene || null;
    const forceCut = options?.forceCut || null; // "host" | "cutaway" (useful for testing/inspection)
    const W = this.width;
    const H = this.height;
    const hCtx = this.haikeiCtx;
    const kCtx = this.kyaraCtx;
    const fCtx = this.fgCtx;
    if (!hCtx || !kCtx || !fCtx) return;

    const bp = blueprint || {};
    const dur = Math.max(1.8, sceneDurationSec || 4.6);
    const progress = clamp01(sceneElapsedSec / dur);
    const easedP = progress * progress * (3 - 2 * progress);
    const step12 = Math.floor(tSec * 12) / 12;

    const layout = bp.shotLayout || "host_hero_alternating_cutaway";
    const cutawayStart = bp.cutawayStartSec ?? 2.55;
    const canAlternate =
      bp.enableAlternatingCutaway !== false &&
      layout !== "dramatic_closeup_domain" &&
      layout !== "host_dark_hud_split" &&
      dur >= 3.3;

    // Alternating Cut A (Host) <-> Cut B (Full-Screen 9:16 Dark-Anime Cutaway) every ~2.6-3.2s!
    let isCutawayBeat = false;
    if (forceCut === "cutaway") {
      isCutawayBeat = true;
    } else if (forceCut === "host") {
      isCutawayBeat = false;
    } else if (!showCharacter) {
      isCutawayBeat = true;
    } else if (canAlternate) {
      const cutWindow = Math.max(2.4, Math.min(3.2, cutawayStart));
      const beatSlot = Math.floor(sceneElapsedSec / cutWindow);
      isCutawayBeat = beatSlot % 2 === 1;
    }
    this.lastRenderedCut = isCutawayBeat ? "cutaway" : "host";

    const cutPhaseKey = `${sceneKey}::${this.lastRenderedCut}`;
    if (this.activeSceneKey !== cutPhaseKey) {
      if (this.activeSceneKey && this.satsuei?.supported) {
        this.satsuei.capturePrevious(this.satsuei.canvas);
        this.transStartSec = tSec;
        this.activeTransStyle = bp.transitionStyle || (this.lastRenderedCut === "cutaway" ? "whip_cut" : "zoom_punch");
      }
      this.activeSceneKey = cutPhaseKey;
    }

    const moodCfg = SATSUEI_MOOD_COLORS[bp.satsueiMood] || SATSUEI_MOOD_COLORS.jjk_cursed_blue;
    const auraHex = bp.auraColor || moodCfg.aura;

    const bgLookupKey = bp.customHaikeiUrl || bp.haikeiBg || "shibuya_night";
    const autoLight = this.bgLightingCache.get(bgLookupKey) || {
      shadowTint: moodCfg.shadow,
      highlightTint: moodCfg.highlight,
      rimTint: moodCfg.rim,
      lightDir: [0.74, 0.67]
    };

    // 1. Beat-Synced 1-2 Frame High-Contrast Impact Frame + Exponentially Decaying Camera Shake
    const imp = bp.impactBeat || {};
    const triggerP =
      imp.beatSynced === false && typeof imp.triggerProgress === "number"
        ? imp.triggerProgress
        : sceneRef
          ? computeScriptBeatProgress(sceneRef, imp.triggerProgress ?? 0.45)
          : imp.triggerProgress ?? 0.45;
    const triggerSec = triggerP * dur;
    const deltaAfterHit = sceneElapsedSec - triggerSec;
    const isImpactFlash = Boolean(imp.enabled) && deltaAfterHit >= 0 && deltaAfterHit <= 0.068;
    const isPostImpactDecay = Boolean(imp.enabled) && deltaAfterHit > 0.068 && deltaAfterHit <= 0.40;
    const impactDecay = isPostImpactDecay ? Math.exp(-(deltaAfterHit - 0.068) * 9.5) : isImpactFlash ? 1.0 : 0.0;
    const impactModeVal = !isImpactFlash ? 0.0 : imp.style === "black_flash" ? 2.0 : 1.0;
    const impactIntensity = isImpactFlash ? 1.0 : impactDecay * 0.40;
    this.lastImpactMode = impactModeVal;

    // 2. Smooth 30fps Camera Push-In + Subtle Handheld Living Drift + Decaying Impact Shake
    const motion = bp.cameraMotion2d || "slow_push_in";
    let camOffX = Math.sin(tSec * 0.85) * 3.2; // Subtle living handheld drift!
    let camOffY = Math.cos(tSec * 0.68) * 2.4;
    let camZoom = 1.0;
    let camTilt = 0.0;

    if (motion === "slow_push_in") {
      camZoom = 1.0 + easedP * 0.11;
      camOffY += -easedP * 14;
    } else if (motion === "crash_zoom_impact") {
      const zCurve = Math.min(1, progress / Math.max(0.22, triggerP));
      camZoom = 1.0 + zCurve * zCurve * 0.20;
      camOffY += -zCurve * 18;
    } else if (motion === "pan_left_to_right") {
      camOffX += 30 - easedP * 60;
      camZoom = 1.05;
    } else if (motion === "pan_right_to_left") {
      camOffX += -30 + easedP * 60;
      camZoom = 1.05;
    } else if (motion === "tilt_up_hero") {
      camOffY += 34 - easedP * 68;
      camZoom = 1.05;
    } else if (motion === "dutch_shibuya_shake") {
      camTilt = 0.048;
      camZoom = 1.07 + easedP * 0.06;
      camOffX += Math.sin(tSec * 20) * 4.5;
      camOffY += Math.cos(tSec * 17) * 3.8;
    } else {
      camZoom = 1.02 + Math.sin(tSec * 1.4) * 0.015;
    }

    if (impactDecay > 0.02) {
      camOffX += Math.sin(tSec * 92) * 18 * impactDecay;
      camOffY += Math.cos(tSec * 83) * 14 * impactDecay;
    }

    const vfxSet = new Set(Array.isArray(bp.sakugaVfx2d) ? bp.sakugaVfx2d : []);
    const poseKey = resolveCanonicalPoseKey(bp.characterPose || "pose_default_smirk");
    const isConflict = poseKey === "pose_shock_panic" || bp.satsueiMood === "sukuna_crimson";

    // ========================================================================
    // PLANE 1 (HAIKEI OR FULL-SCREEN 9:16 CUTAWAY) & PLANE 2 (SOLID UNBROKEN KYARA CEL)
    // ========================================================================
    hCtx.clearRect(0, 0, W, H);
    kCtx.clearRect(0, 0, W, H);
    fCtx.clearRect(0, 0, W, H);

    let showDarkHud = false;
    let hudPlacement = null;
    const gengaImg = this.getGengaImage(bp.gengaSvg);

    if (isCutawayBeat) {
      // === CUT B: FULL-SCREEN 9:16 DARK-ANIME TECHNICAL CUTAWAY (ZERO WHITE BOX!) ===
      this.drawFullScreenDarkAnimeCutaway(hCtx, W, H, bp, camOffX, camOffY, camZoom, camTilt, tSec, step12, auraHex, isConflict);
    } else {
      // === CUT A: DRAMATIC HOST SHOT (LOCKED TO mc_default.jpg!) ===
      this.drawHaikeiLayer(hCtx, W, H, bp.haikeiBg || "shibuya_night", bp.customHaikeiUrl, camOffX, camOffY, camZoom, camTilt, moodCfg);

      if (vfxSet.has("domain_seal_2d")) {
        this.draw2DDomainSeal(hCtx, W * 0.5 + camOffX * 0.65, H * 0.42 + camOffY * 0.65, W * 0.40, auraHex, step12);
      }
      if (vfxSet.has("cursed_flames_2d")) {
        this.draw2DCursedFlames(hCtx, W * 0.45 + camOffX * 0.75, H * 0.78, W * 0.60, H * 0.42, auraHex, step12);
      }

      const customCharImg = bp.customKyaraUrl ? this.getDynamicImage(bp.customKyaraUrl, false) : null;
      const useGpuKey = Boolean(this.satsuei?.supported);
      let charImg = customCharImg;
      if (!charImg) {
        if (useGpuKey) {
          charImg = this.rawCharCache.get(poseKey) || this.rawCharCache.get("pose_default_smirk");
        } else {
          if (!this.charCache.has(poseKey) && this.rawCharCache.has(poseKey)) {
            this.charCache.set(poseKey, chromaKeyAnimeCel(this.rawCharCache.get(poseKey)));
          }
          charImg = this.charCache.get(poseKey) || this.charCache.get("pose_default_smirk");
        }
      }

      kCtx.save();
      kCtx.translate(camOffX, camOffY);
      if (camTilt) {
        kCtx.translate(W / 2, H / 2);
        kCtx.rotate(camTilt);
        kCtx.translate(-W / 2, -H / 2);
      }

      if (layout === "dramatic_closeup_domain") {
        // Full dramatic close-up Host climax — ZERO HUD card jumping over his face!
        const cw = W * 0.94;
        const ch = cw * 1.28;
        this.draw2DAnimeCharacterCel(kCtx, charImg, poseKey, W * 0.5, H * 1.02, cw, ch, step12, voiceEnergy);
      } else if (layout === "host_dark_hud_split" || layout === "hero_and_genga_split" || layout === "genga_hero_focus") {
        // Host anchored cleanly bottom-left, optional sleek translucent dark-glass HUD strictly upper-right (NEVER over face!)
        const cw = W * 0.78;
        const ch = cw * 1.32;
        this.draw2DAnimeCharacterCel(kCtx, charImg, poseKey, W * 0.30, H * 1.02, cw, ch, step12, voiceEnergy);
        if (gengaImg) {
          showDarkHud = true;
          hudPlacement = { x: W * 0.71, y: H * 0.33, size: W * 0.38 };
        }
      } else if (layout === "action_clash_diagonal") {
        hCtx.save();
        hCtx.fillStyle = "rgba(7, 8, 15, 0.50)";
        hCtx.beginPath();
        hCtx.moveTo(0, H * 0.44);
        hCtx.lineTo(W, H * 0.34);
        hCtx.lineTo(W, H * 0.38);
        hCtx.lineTo(0, H * 0.48);
        hCtx.closePath();
        hCtx.fill();
        hCtx.restore();

        const cw = W * 0.86;
        const ch = cw * 1.28;
        this.draw2DAnimeCharacterCel(kCtx, charImg, poseKey, W * 0.46, H * 1.02, cw, ch, step12, voiceEnergy);
      } else {
        // Primary dramatic Host hero framing (clean full-frame anime composition without clutter box!)
        const cw = W * 0.86;
        const ch = cw * 1.32;
        this.draw2DAnimeCharacterCel(kCtx, charImg, poseKey, W * 0.46, H * 1.02, cw, ch, step12, voiceEnergy);
      }
      kCtx.restore();
    }

    // ========================================================================
    // PLANE 3: FOREGROUND ATMOSPHERE + MASKED DARK-GLASS HUD + SAFE SFX (IN FRONT OF KYARA!)
    // ========================================================================
    // Strictly hide HUD during Impact Frames so ZERO black inverted boxes ever appear!
    if (showDarkHud && hudPlacement && gengaImg && !isImpactFlash && impactIntensity < 0.30) {
      this.drawDarkGlassAnimeHud(
        fCtx,
        W,
        gengaImg,
        bp.gengaTitle,
        hudPlacement.x + camOffX * 0.4,
        hudPlacement.y + camOffY * 0.4,
        hudPlacement.size,
        auraHex,
        step12,
        sceneElapsedSec,
        isConflict
      );
    }

    this.drawForegroundAtmosphere(fCtx, W, H, tSec, autoLight.highlightTint, autoLight.lightDir, camOffX, camOffY);

    if (vfxSet.has("rain_streaks_2d")) this.draw2DRainStreaks(fCtx, W, H, step12);
    if (vfxSet.has("embers_petals_2d")) this.draw2DEmbersPetals(fCtx, W, H, auraHex, step12);
    if (vfxSet.has("anime_sparkles_steam_2d")) this.draw2DAnimeSparklesSteam(fCtx, W, H, auraHex, step12);
    if (vfxSet.has("slash_smear_2d")) this.draw2DSlashSmears(fCtx, W, H, auraHex, step12);

    const blackFlashBurst = isImpactFlash
      ? 1.0
      : impactDecay > 0.08
        ? impactDecay
        : vfxSet.has("black_flash_2d") && Math.abs(deltaAfterHit) < 0.42
          ? 0.82
          : 0.0;
    if (blackFlashBurst > 0.05) {
      this.draw2DBlackFlashLightning(fCtx, W * 0.52, H * 0.44, W * 0.40, step12, blackFlashBurst);
    }
    if (vfxSet.has("manga_speed_lines_2d") || isImpactFlash || impactDecay > 0.35) {
      this.draw2DMangaSpeedLines(fCtx, W, H, auraHex, step12);
    }

    if (bp.mangaSfxText && !isImpactFlash) {
      this.drawSafeJapaneseSfx(fCtx, W, H, bp.mangaSfxText, step12, sceneElapsedSec, isConflict);
    }

    // ========================================================================
    // FINAL GPU PASS: 3-PLANE TRUE SATSUEI + SNAPPY 0.15s WHIP/ZOOM-PUNCH CUTS
    // ========================================================================
    const grade = bp.satsueiGrade || {};
    const transProgress = Math.min(1, Math.max(0, tSec - this.transStartSec) / 0.15);

    if (this.satsuei?.supported) {
      this.satsuei.renderMultiPlane(
        {
          haikeiCanvas: this.haikeiCanvas,
          kyaraCanvas: this.kyaraCanvas,
          fgCanvas: this.fgCanvas,
          applyChromaKey: true
        },
        {
          tSec,
          dofBlur: isCutawayBeat ? 0.08 : grade.dofBlur ?? 0.28,
          lightWrapStrength: grade.lightWrapStrength ?? 0.42,
          ambientHarmonization: grade.ambientHarmonization ?? 0.22,
          rimIntensity: grade.rimIntensity ?? 0.80,
          shadowTint: autoLight.shadowTint,
          highlightTint: autoLight.highlightTint,
          rimTint: autoLight.rimTint,
          lightDir: autoLight.lightDir,
          auraTint: auraHex,
          bloomStrength: isImpactFlash ? 0.62 : grade.bloomStrength ?? 0.28,
          bloomThreshold: grade.bloomThreshold ?? 0.70,
          contrast: isImpactFlash ? 1.24 : grade.contrast ?? 1.1,
          saturation: grade.saturation ?? 1.14,
          shadowCrush: grade.shadowCrush ?? 0.14,
          chromatic: isImpactFlash
            ? Math.max(0.014, grade.chromaticPeak ?? 0.014)
            : grade.chromaticEdge ?? 0.0022,
          impactMode: impactModeVal,
          impactIntensity,
          transProgress,
          transStyle: this.activeTransStyle,
          barrel: isImpactFlash || motion === "crash_zoom_impact" ? 0.052 : 0.018
        }
      );
    } else {
      this.ctx.clearRect(0, 0, W, H);
      this.ctx.drawImage(this.haikeiCanvas, 0, 0, W, H);
      this.ctx.drawImage(this.kyaraCanvas, 0, 0, W, H);
      this.ctx.drawImage(this.fgCanvas, 0, 0, W, H);
    }
  }
}
