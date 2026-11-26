// MaouEdu Studio MAPPA 2D Anime Sakuga Engine (100% Pure 2D Anime — ZERO 3D Primitives!)
// Architecture mirrors real Japanese TV Anime (Jujutsu Kaisen / Chainsaw Man / AOT Final Season):
// 1. Layer 1 (Haikei 背景): Authentic hand-painted 2D Studio MAPPA background plates with 2.5D multiplane parallax
// 2. Layer 2 (Back Sakuga VFX): Hand-drawn 2D Cursed Energy Flames (dark core + neon edge) & Rotating Domain Seals on-2s (12fps)
// 3. Layer 3 (Kyara キャラ): Pixel-accurate chroma-keyed 2D Studio MAPPA Maou Vaelen character cels + Live2D wind/breathing mesh warp + Satsuei rim light
// 4. Layer 4 (Genga 原画): Live Gemini-drawn scene-specific 2D Cel-Shaded SVG illustrations with crisp ink borders & specular shimmer
// 5. Layer 5 (Front Sakuga VFX & Satsuei 撮影): 2D Black Flash jagged lightning, slash smears, Shibuya rain, embers, manga speed lines,
//    katakana SFX stamps, & GPU WebGL2 Satsuei (Pro-Mist Halation Bloom + 2-3 Frame B&W / Black Flash Impact Frames!)

import { MappaSatsuei2DWebGL } from "/video-engine/mappa-satsuei-2d-webgl.js";

const HAIKEI_URLS = {
  shibuya_night: "/assets/mappa/bg_shibuya_night.jpg",
  shrine_twilight: "/assets/mappa/bg_shrine_twilight.jpg",
  domain_void: "/assets/mappa/bg_domain_void.jpg",
  tokyo_rooftop: "/assets/mappa/bg_tokyo_rooftop.jpg",
  anime_kitchen: "/assets/mappa/bg_anime_kitchen.jpg",
  anime_lab: "/assets/mappa/bg_anime_lab.jpg"
};

const CHAR_POSE_URLS = {
  stance: "/assets/mappa/char_stance.jpg",
  domain_seal: "/assets/mappa/char_domain_seal.jpg",
  point_reveal: "/assets/mappa/char_point_reveal.jpg",
  shock_alert: "/assets/mappa/char_shock_alert.jpg"
};

const SATSUEI_MOOD_COLORS = {
  jjk_cursed_blue: { shadow: "#1e1b4b", aura: "#38bdf8", wash: "rgba(14, 30, 75, 0.22)", rim: "#38bdf8" },
  shibuya_neon: { shadow: "#1e1038", aura: "#f43f5e", wash: "rgba(24, 12, 48, 0.24)", rim: "#38bdf8" },
  sukuna_crimson: { shadow: "#3b0718", aura: "#fb7185", wash: "rgba(110, 12, 32, 0.26)", rim: "#fb7185" },
  hollow_purple: { shadow: "#2e1065", aura: "#c084fc", wash: "rgba(56, 16, 108, 0.26)", rim: "#c084fc" },
  chainsaw_film: { shadow: "#1c2426", aura: "#f59e0b", wash: "rgba(22, 32, 36, 0.18)", rim: "#fbbf24" },
  shonen_daylight: { shadow: "#2b3d6b", aura: "#38bdf8", wash: "rgba(255, 248, 225, 0.06)", rim: "#fffbeb" },
  golden_warm: { shadow: "#4c2135", aura: "#fbbf24", wash: "rgba(255, 220, 165, 0.10)", rim: "#fde047" }
};

// Pixel-accurate anti-aliased #00FF00 Chroma Key + Green Spill Killer -> crisp transparent 2D anime cel!
export function chromaKeyAnimeCel(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return img;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) return img;
  g.drawImage(img, 0, 0, w, h);

  try {
    const imgData = g.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const gr = d[i + 1];
      const b = d[i + 2];
      const maxRB = r > b ? r : b;
      const gExcess = gr - maxRB;

      if (gr > 85 && gExcess > 44) {
        // Pure chroma green background -> 100% transparent
        d[i + 3] = 0;
      } else if (gr > 70 && gExcess > 16) {
        // Anti-aliased ink boundary -> smooth alpha ramp + total green spill suppression!
        const t = (gExcess - 16) / (44 - 16);
        d[i + 3] = Math.round(d[i + 3] * (1 - t));
        d[i + 1] = Math.min(gr, maxRB);
      } else if (gExcess > 6 && gr > 90) {
        // Kill faint bounce spill on silver hair edges
        d[i + 1] = Math.round(maxRB + gExcess * 0.25);
      }
    }
    g.putImageData(imgData, 0, 0);
  } catch {
    return img;
  }
  return c;
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

    this.stageCanvas = document.createElement("canvas");
    this.stageCanvas.width = width;
    this.stageCanvas.height = height;
    this.ctx = this.stageCanvas.getContext("2d");

    this.satsuei = new MappaSatsuei2DWebGL(width, height);
    this.bgCache = new Map();
    this.charCache = new Map();
    this.gengaSvgCache = new Map();
    this.activeSceneKey = "";
    this.transStartSec = -10;
    this.lastImpactMode = 0;

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
    this.stageCanvas.width = width;
    this.stageCanvas.height = height;
    this.satsuei?.resize(width, height);
  }

  preloadAssets() {
    if (typeof Image === "undefined") return;
    for (const [key, url] of Object.entries(HAIKEI_URLS)) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => this.bgCache.set(key, img);
      img.src = url;
    }
    for (const [pose, url] of Object.entries(CHAR_POSE_URLS)) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const cleanCel = chromaKeyAnimeCel(img);
        this.charCache.set(pose, cleanCel);
      };
      img.src = url;
    }
  }

  getGengaImage(svgMarkup) {
    if (!svgMarkup || typeof Image === "undefined") return null;
    const cached = this.gengaSvgCache.get(svgMarkup);
    if (cached) return cached.ready ? cached.img : null;

    const entry = { img: new Image(), ready: false };
    entry.img.onload = () => {
      entry.ready = true;
    };
    entry.img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
    this.gengaSvgCache.set(svgMarkup, entry);
    if (this.gengaSvgCache.size > 40) {
      const firstKey = this.gengaSvgCache.keys().next().value;
      this.gengaSvgCache.delete(firstKey);
    }
    return null;
  }

  // ============================================================================
  // LAYER 1: PAINTED STUDIO MAPPA 2D HAIKEI BACKGROUND (MULTIPLANE 2.5D PARALLAX)
  // ============================================================================
  drawHaikeiLayer(ctx, W, H, bgKey, camOffX, camOffY, camZoom, camTilt, moodCfg) {
    const bgImg = this.bgCache.get(bgKey) || this.bgCache.get("shibuya_night");

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
      // Crisp 2D painted anime fallback gradient while plate streams in
      const grad = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
      grad.addColorStop(0, moodCfg.shadow);
      grad.addColorStop(0.55, "#172554");
      grad.addColorStop(1, "#07080f");
      ctx.fillStyle = grad;
      ctx.fillRect(-W / 2, -H / 2, W, H);
    }
    ctx.restore();

    // Color Script Atmospheric Satsuei Wash
    ctx.fillStyle = moodCfg.wash;
    ctx.fillRect(0, 0, W, H);
  }

  // ============================================================================
  // LAYER 2 & 5: TRUE 2D HAND-DRAWN STUDIO MAPPA SAKUGA VFX (STEPPED ON-2s 12FPS!)
  // ============================================================================
  draw2DDomainSeal(ctx, cx, cy, radius, auraHex, tSec) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tSec * 0.45);
    ctx.strokeStyle = auraHex;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([22, 12]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotating inner Jujutsu hexagram geometry
    ctx.rotate(-tSec * 0.9);
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

    // Precision tick marks
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9);
      ctx.lineTo(Math.cos(a) * radius * 1.05, Math.sin(a) * radius * 1.05);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw2DCursedFlames(ctx, cx, baseY, spreadW, heightH, auraHex, step12) {
    // Signature Jujutsu Kaisen 2D Cursed Energy: glowing outer cel tongue + pitch-black inner negative-space core!
    ctx.save();
    for (let i = 0; i < 11; i++) {
      const u = (step12 * 1.35 + i * 0.19) % 1;
      const side = ((i * 73) % 100) / 100 - 0.5;
      const fx = cx + side * spreadW + Math.sin(step12 * 6 + i * 2.1) * 24;
      const fy = baseY - u * heightH;
      const fw = (1 - u * 0.65) * (32 + (i % 3) * 14);
      const fh = (1 - u * 0.4) * (88 + (i % 4) * 26);

      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.92;
      // Outer glowing cel flame silhouette
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

      // Inner Jujutsu pitch-black cursed negative core!
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

  draw2DBlackFlashLightning(ctx, cx, cy, radius, step12) {
    // Authentic Jujutsu Kaisen Black Flash (Kokusen): jagged pitch-black bolts with screaming crimson neon edge!
    ctx.save();
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

      // Outer crimson glow stroke
      ctx.lineCap = "round";
      ctx.lineJoin = "miter";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 11;
      ctx.beginPath();
      pts.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();

      // Inner pitch-black Kokusen lightning fracture!
      ctx.strokeStyle = "#06060b";
      ctx.lineWidth = 5;
      ctx.beginPath();
      pts.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    }

    // Expanding crimson-black impact ring
    const u = (step12 * 1.6) % 1;
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 6 * (1 - u);
    ctx.globalAlpha = 1 - u;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (0.35 + u * 0.9), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  draw2DSlashSmears(ctx, W, H, auraHex, step12) {
    ctx.save();
    const u = (step12 * 1.4) % 1;
    const alpha = Math.sin(u * Math.PI) * 0.92;
    ctx.globalAlpha = alpha;
    ctx.translate(W * 0.52, H * 0.46);
    ctx.rotate(-0.45 + u * 0.55);

    ctx.fillStyle = auraHex;
    ctx.strokeStyle = "#07080d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, W * 0.48, -1.1, 1.05);
    ctx.arc(-28, 12, W * 0.42, 1.05, -1.1, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, W * 0.47, -0.7, 0.65);
    ctx.arc(-14, 6, W * 0.44, 0.65, -0.7, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  draw2DRainStreaks(ctx, W, H, tSec) {
    ctx.save();
    ctx.strokeStyle = "rgba(186, 230, 253, 0.42)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 42; i++) {
      const rx = ((i * 97 + tSec * 220) % (W + 120)) - 60;
      const ry = ((i * 157 + tSec * 1450) % (H + 160)) - 80;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 14, ry + 56);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw2DEmbersPetals(ctx, W, H, auraHex, tSec) {
    ctx.save();
    for (let i = 0; i < 24; i++) {
      const u = (tSec * 0.28 + i * 0.13) % 1;
      const px = ((i * 83) % W) + Math.sin(tSec * 2.2 + i) * 34;
      const py = H * 0.92 - u * H * 0.95;
      const sz = 4 + (i % 4) * 2.5;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(tSec * 2.5 + i);
      ctx.fillStyle = i % 3 === 0 ? "#fef08a" : auraHex;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.88;
      ctx.beginPath();
      ctx.ellipse(0, 0, sz, sz * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  draw2DAnimeSparklesSteam(ctx, W, H, auraHex, step12) {
    ctx.save();
    // Crisp 2D Makoto-Shinkai / anime 4-point diamond stars + curling cel steam
    for (let i = 0; i < 9; i++) {
      const sx = W * (0.15 + ((i * 37) % 72) * 0.01);
      const sy = H * (0.2 + ((i * 53) % 44) * 0.01);
      const pulse = 0.55 + Math.abs(Math.sin(step12 * 4.5 + i * 1.4)) * 0.85;
      const r = (9 + (i % 3) * 5) * pulse;
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
    // Flat cel steam ribbons rising gently
    ctx.strokeStyle = "rgba(255, 255, 255, 0.58)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    for (let s = 0; s < 3; s++) {
      const bx = W * (0.45 + s * 0.14);
      const u = (step12 * 0.55 + s * 0.33) % 1;
      const by = H * 0.52 - u * 165;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.65;
      ctx.beginPath();
      ctx.moveTo(bx, by + 48);
      ctx.bezierCurveTo(bx - 24, by + 22, bx + 24, by - 12, bx, by - 46);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw2DMangaSpeedLines(ctx, W, H, auraHex, step12) {
    ctx.save();
    const cx = W * 0.5;
    const cy = H * 0.44;
    const seed = Math.floor(step12 * 12);
    for (let i = 0; i < 48; i++) {
      const ang = (i / 48) * Math.PI * 2 + (seed % 7) * 0.04;
      const inner = W * (0.38 + ((i * 29 + seed * 13) % 16) * 0.014);
      const outer = Math.max(W, H) * 0.92;
      ctx.fillStyle = i % 5 === 0 ? auraHex : i % 2 === 0 ? "#07080d" : "#ffffff";
      ctx.globalAlpha = i % 5 === 0 ? 0.55 : 0.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
      ctx.lineTo(cx + Math.cos(ang - 0.016) * outer, cy + Math.sin(ang - 0.016) * outer);
      ctx.lineTo(cx + Math.cos(ang + 0.016) * outer, cy + Math.sin(ang + 0.016) * outer);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ============================================================================
  // LAYER 3: LIVE2D-STYLE SLICED MESH SWAY + SATSUEI RIM-LIT 2D ANIME CHARACTER CEL
  // ============================================================================
  draw2DAnimeCharacterCel(ctx, charImg, x, y, drawW, drawH, tSec, voiceEnergy, rimHex, flipX = false) {
    if (!charImg) return;
    const sw = charImg.width || charImg.naturalWidth;
    const sh = charImg.height || charImg.naturalHeight;
    if (!sw || !sh) return;

    const breatheY = Math.sin(tSec * 2.6) * 4.5 + voiceEnergy * 5.0;
    const breatheScaleY = 1.0 + Math.sin(tSec * 2.6) * 0.012 + voiceEnergy * 0.014;

    ctx.save();
    ctx.translate(x, y + breatheY);
    ctx.scale(flipX ? -1 : 1, breatheScaleY);

    // Studio MAPPA Satsuei Colored Rim-Light Edge Glow matching the exact Haikei background!
    ctx.shadowColor = rimHex || "#38bdf8";
    ctx.shadowBlur = 18 + voiceEnergy * 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = -2;

    // Live2D-style 14-strip horizontal mesh warp (gentle natural wind sway across hair & coat tails!)
    const strips = 14;
    const srcStripH = sh / strips;
    const dstStripH = drawH / strips;
    for (let s = 0; s < strips; s++) {
      const normY = s / (strips - 1);
      // Hair top (normY < 0.25) and flowing lower coat tails (normY > 0.65) sway gently in wind!
      const swayWeight = normY < 0.25 ? (0.25 - normY) * 1.4 : normY > 0.62 ? (normY - 0.62) * 2.2 : 0.08;
      const swayX = Math.sin(tSec * 3.8 + normY * 4.5) * 8.0 * swayWeight;
      ctx.drawImage(
        charImg,
        0,
        s * srcStripH,
        sw,
        srcStripH + 1,
        -drawW / 2 + swayX,
        -drawH + s * dstStripH,
        drawW,
        dstStripH + 1.2
      );
    }

    ctx.restore();
  }

  // ============================================================================
  // LAYER 4: GEMINI 2D GENGA SVG ILLUSTRATION IN CRISP ANIME MANGA SPOTLIGHT
  // ============================================================================
  draw2DGengaOverlay(ctx, gengaImg, cx, cy, boxSize, auraHex, tSec, sceneElapsedSec, isConflict) {
    if (!gengaImg) return;
    const pop = sceneElapsedSec < 0.35 ? 0.72 + (sceneElapsedSec / 0.35) * 0.28 : 1.0;
    const floatY = Math.sin(tSec * 2.4) * 6;
    const jitterX = isConflict ? Math.sin(tSec * 38) * 4 : 0;

    ctx.save();
    ctx.translate(cx + jitterX, cy + floatY);
    ctx.scale(pop, pop);

    // Crisp Manga Cel Panel Backdrop Frame (clean slanted Studio MAPPA visual insert!)
    const half = boxSize * 0.5;
    drawRoundedRectPath(ctx, -half + 6, -half + 8, boxSize, boxSize, 18);
    ctx.fillStyle = "rgba(7, 8, 15, 0.72)";
    ctx.fill();

    drawRoundedRectPath(ctx, -half, -half, boxSize, boxSize, 18);
    const panelGrad = ctx.createRadialGradient(0, -half * 0.2, 10, 0, 0, half * 1.15);
    panelGrad.addColorStop(0, "rgba(248, 250, 252, 0.94)");
    panelGrad.addColorStop(0.75, "rgba(226, 232, 240, 0.88)");
    panelGrad.addColorStop(1, "rgba(15, 23, 42, 0.86)");
    ctx.fillStyle = panelGrad;
    ctx.fill();

    ctx.lineWidth = 4.5;
    ctx.strokeStyle = "#07080d";
    ctx.stroke();

    // Inner glowing rim border matching scene aura!
    drawRoundedRectPath(ctx, -half + 4, -half + 4, boxSize - 8, boxSize - 8, 14);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = auraHex;
    ctx.stroke();

    // Draw the Gemini-illustrated 2D Anime Cel SVG cleanly inside the spotlight panel!
    const pad = boxSize * 0.06;
    ctx.drawImage(gengaImg, -half + pad, -half + pad, boxSize - pad * 2, boxSize - pad * 2);

    // Subtle anime diagonal specular highlight sweep across cel glass
    const sweep = ((tSec * 0.55) % 2.2) - 0.5;
    if (sweep > 0 && sweep < 1) {
      ctx.save();
      drawRoundedRectPath(ctx, -half, -half, boxSize, boxSize, 18);
      ctx.clip();
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.beginPath();
      const sx = -half + sweep * boxSize * 1.6 - 50;
      ctx.moveTo(sx, -half);
      ctx.lineTo(sx + 34, -half);
      ctx.lineTo(sx - 55, half);
      ctx.lineTo(sx - 89, half);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // ============================================================================
  // MAIN 60 FPS RENDER FRAME (PURE 2D MULTIPLANE + GPU WEBGL2 SATSUEI)
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
    const W = this.width;
    const H = this.height;
    const ctx = this.ctx;
    if (!ctx) return;

    if (this.activeSceneKey !== sceneKey) {
      if (this.activeSceneKey) {
        this.satsuei?.capturePrevious(this.stageCanvas);
        this.transStartSec = tSec;
      }
      this.activeSceneKey = sceneKey;
    }

    const bp = blueprint || {};
    const progress = Math.max(0, Math.min(1, sceneElapsedSec / Math.max(2.0, sceneDurationSec)));
    const easedP = progress * progress * (3 - 2 * progress);
    // Authentic Japanese TV Anime On-Twos (12fps) cadence for hand-drawn cel FX!
    const step12 = Math.floor(tSec * 12) / 12;

    const moodCfg = SATSUEI_MOOD_COLORS[bp.satsueiMood] || SATSUEI_MOOD_COLORS.jjk_cursed_blue;
    const auraHex = bp.auraColor || moodCfg.aura;

    // 1. Check Studio MAPPA 2-3 Frame Impact Frame Beat!
    const imp = bp.impactBeat || {};
    const triggerP = imp.triggerProgress ?? 0.5;
    const isImpactWindow = Boolean(imp.enabled) && Math.abs(progress - triggerP) < 0.032;
    const impactModeVal = !isImpactWindow ? 0.0 : imp.style === "black_flash" ? 2.0 : 1.0;
    this.lastImpactMode = impactModeVal;

    // 2. Compute 2.5D After Effects Satsuei Camera Motion
    const motion = bp.cameraMotion2d || "slow_push_in";
    let camOffX = 0, camOffY = 0, camZoom = 1.0, camTilt = 0.0;
    if (motion === "slow_push_in") {
      camZoom = 1.0 + easedP * 0.12;
      camOffY = -easedP * 18;
    } else if (motion === "crash_zoom_impact") {
      const zCurve = Math.min(1, progress / Math.max(0.25, triggerP));
      camZoom = 1.0 + zCurve * 0.22;
      camOffY = -zCurve * 24;
    } else if (motion === "pan_left_to_right") {
      camOffX = 36 - easedP * 72;
      camZoom = 1.06;
    } else if (motion === "pan_right_to_left") {
      camOffX = -36 + easedP * 72;
      camZoom = 1.06;
    } else if (motion === "tilt_up_hero") {
      camOffY = 42 - easedP * 78;
      camZoom = 1.05;
    } else if (motion === "dutch_shibuya_shake") {
      camTilt = 0.065;
      camZoom = 1.08 + easedP * 0.08;
      camOffX = Math.sin(tSec * 24) * 7;
      camOffY = Math.cos(tSec * 19) * 5;
    } else {
      camZoom = 1.02 + Math.sin(tSec * 1.4) * 0.015;
    }

    if (isImpactWindow) {
      camOffX += Math.sin(tSec * 85) * 18;
      camOffY += Math.cos(tSec * 77) * 14;
    }

    const vfxSet = new Set(Array.isArray(bp.sakugaVfx2d) ? bp.sakugaVfx2d : []);

    // LAYER 1: Authentic Studio MAPPA Painted 2D Background (Haikei)
    ctx.clearRect(0, 0, W, H);
    this.drawHaikeiLayer(ctx, W, H, bp.haikeiBg || "shibuya_night", camOffX, camOffY, camZoom, camTilt, moodCfg);

    // LAYER 2: Back-Layer 2D Sakuga VFX (behind character!)
    if (vfxSet.has("domain_seal_2d")) {
      this.draw2DDomainSeal(ctx, W * 0.5 + camOffX * 0.65, H * 0.44 + camOffY * 0.65, W * 0.42, auraHex, tSec);
    }
    if (vfxSet.has("cursed_flames_2d")) {
      this.draw2DCursedFlames(ctx, W * 0.45 + camOffX * 0.75, H * 0.78, W * 0.62, H * 0.44, auraHex, step12);
    }

    // LAYER 3 & 4: Shot Layout Composition (Hero 2D Character Cel + Live Gemini 2D Genga SVG!)
    const layout = bp.shotLayout || "hero_and_genga_split";
    const charImg = this.charCache.get(bp.characterPose || "stance") || this.charCache.get("stance");
    const gengaImg = this.getGengaImage(bp.gengaSvg);
    const isConflict = bp.characterPose === "shock_alert" || bp.satsueiMood === "sukuna_crimson";

    ctx.save();
    ctx.translate(camOffX, camOffY);
    if (camTilt) {
      ctx.translate(W / 2, H / 2);
      ctx.rotate(camTilt);
      ctx.translate(-W / 2, -H / 2);
    }

    if (!showCharacter) {
      // Character toggle OFF -> give full center-stage spotlight to the 2D painted Haikei + Gemini 2D Genga SVG!
      if (gengaImg) {
        this.draw2DGengaOverlay(ctx, gengaImg, W * 0.5, H * 0.44, W * 0.78, auraHex, tSec, sceneElapsedSec, isConflict);
      }
    } else if (layout === "dramatic_closeup_domain") {
      // Iconic Jujutsu Kaisen full-frame dramatic closeup on Maou doing Domain Seal / Shock!
      const cw = W * 0.96;
      const ch = cw * 1.28;
      this.draw2DAnimeCharacterCel(ctx, charImg, W * 0.5, H * 0.88, cw, ch, tSec, voiceEnergy, moodCfg.rim);
      if (gengaImg) {
        this.draw2DGengaOverlay(ctx, gengaImg, W * 0.76, H * 0.27, W * 0.38, auraHex, tSec, sceneElapsedSec, isConflict);
      }
    } else if (layout === "genga_hero_focus") {
      // Big crystal-clear 2D Genga Cel Illustration dead-center + Maou reacting in lower-left!
      if (gengaImg) {
        this.draw2DGengaOverlay(ctx, gengaImg, W * 0.52, H * 0.41, W * 0.72, auraHex, tSec, sceneElapsedSec, isConflict);
      }
      const cw = W * 0.56;
      const ch = cw * 1.32;
      this.draw2DAnimeCharacterCel(ctx, charImg, W * 0.24, H * 0.87, cw, ch, tSec, voiceEnergy, moodCfg.rim);
    } else if (layout === "action_clash_diagonal") {
      // Shibuya Incident Diagonal Split Sakuga Composition!
      ctx.save();
      ctx.fillStyle = "rgba(7, 8, 15, 0.52)";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.44);
      ctx.lineTo(W, H * 0.34);
      ctx.lineTo(W, H * 0.38);
      ctx.lineTo(0, H * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const cw = W * 0.78;
      const ch = cw * 1.28;
      this.draw2DAnimeCharacterCel(ctx, charImg, W * 0.34, H * 0.87, cw, ch, tSec, voiceEnergy, moodCfg.rim);
      if (gengaImg) {
        this.draw2DGengaOverlay(ctx, gengaImg, W * 0.66, H * 0.34, W * 0.54, auraHex, tSec, sceneElapsedSec, true);
      }
    } else if (layout === "wide_establishing_parallax") {
      const cw = W * 0.7;
      const ch = cw * 1.3;
      this.draw2DAnimeCharacterCel(ctx, charImg, W * 0.42, H * 0.86, cw, ch, tSec, voiceEnergy, moodCfg.rim);
      if (gengaImg) {
        this.draw2DGengaOverlay(ctx, gengaImg, W * 0.68, H * 0.35, W * 0.46, auraHex, tSec, sceneElapsedSec, isConflict);
      }
    } else {
      // hero_and_genga_split: Maou on left pointing smoothly into the Gemini 2D Genga illustration on right!
      const cw = W * 0.76;
      const ch = cw * 1.32;
      this.draw2DAnimeCharacterCel(ctx, charImg, W * 0.3, H * 0.88, cw, ch, tSec, voiceEnergy, moodCfg.rim);
      if (gengaImg) {
        this.draw2DGengaOverlay(ctx, gengaImg, W * 0.66, H * 0.4, W * 0.54, auraHex, tSec, sceneElapsedSec, isConflict);
      }
    }
    ctx.restore();

    // LAYER 5: Foreground 2D Hand-Drawn Sakuga VFX (1.35x Parallax!)
    if (vfxSet.has("rain_streaks_2d")) this.draw2DRainStreaks(ctx, W, H, tSec);
    if (vfxSet.has("embers_petals_2d")) this.draw2DEmbersPetals(ctx, W, H, auraHex, tSec);
    if (vfxSet.has("anime_sparkles_steam_2d")) this.draw2DAnimeSparklesSteam(ctx, W, H, auraHex, step12);
    if (vfxSet.has("slash_smear_2d")) this.draw2DSlashSmears(ctx, W, H, auraHex, step12);
    if (vfxSet.has("black_flash_2d") || impactModeVal > 1.5) {
      this.draw2DBlackFlashLightning(ctx, W * 0.56, H * 0.44, W * 0.42, step12);
    }
    if (vfxSet.has("manga_speed_lines_2d") || isImpactWindow) {
      this.draw2DMangaSpeedLines(ctx, W, H, auraHex, step12);
    }

    // Authentic Bold Manga SFX Cut-In Stamp (e.g. ゴゴゴ..., ドォォン!!, 領域展開!)
    if (bp.mangaSfxText) {
      ctx.save();
      ctx.translate(W * 0.76, H * 0.21);
      ctx.rotate(-0.12);
      const punch = sceneElapsedSec < 0.25 ? 1.25 - (sceneElapsedSec / 0.25) * 0.25 : 1 + Math.sin(step12 * 8) * 0.03;
      ctx.scale(punch, punch);
      ctx.font = `900 ${Math.round(W * 0.052)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 9;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#07080d";
      ctx.strokeText(bp.mangaSfxText, 0, 0);
      ctx.fillStyle = isConflict ? "#fb7185" : "#fde047";
      ctx.fillText(bp.mangaSfxText, 0, 0);
      ctx.restore();
    }

    // FINAL GPU PASS: Studio MAPPA Satsuei (撮影) WebGL2 Compositor!
    const grade = bp.satsueiGrade || {};
    const transProgress = Math.min(1, Math.max(0, tSec - this.transStartSec) / 0.26);

    this.satsuei.render(this.stageCanvas, {
      tSec,
      bloomStrength: isImpactWindow ? 0.78 : grade.bloomStrength ?? 0.36,
      contrast: isImpactWindow ? 1.28 : grade.contrast ?? 1.1,
      saturation: grade.saturation ?? 1.16,
      chromatic: isImpactWindow ? Math.max(0.014, grade.chromaticPeak ?? 0.014) : 0.0022,
      impactMode: impactModeVal,
      transProgress,
      barrel: isImpactWindow || motion === "crash_zoom_impact" ? 0.065 : 0.022,
      shadowTint: moodCfg.shadow,
      auraTint: auraHex
    });
  }
}
