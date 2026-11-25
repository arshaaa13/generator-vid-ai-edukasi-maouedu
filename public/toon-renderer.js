// MaouEdu 2.5D Stylized Toon Animation Engine
// Clean, bright, lively cartoon edutainment matching @untabiru5 & @dhotscliper style!
// 100% consistent visual identity across ANY topic prompt (es krim, cupang, arwana, kipas, roket, kopi, dll).

const INK = "#141824";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

function drawOutlinedCircle(ctx, x, y, radius, fill, stroke = INK, lw = 3.2) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

// ============================================================================
// 1. BRIGHT CONSISTENT ENVIRONMENT BACKGROUNDS
// ============================================================================
function drawSettingBackground(ctx, W, H, setting, t) {
  ctx.save();

  if (setting === "kitchen") {
    // Cozy warm pastel sunlit kitchen
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 520);
    wallGrad.addColorStop(0, "#fff7ed");
    wallGrad.addColorStop(1, "#ffedd5");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle kitchen tiles
    ctx.strokeStyle = "rgba(180, 120, 60, 0.14)";
    ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 470);
      ctx.stroke();
    }
    for (let y = 0; y < 470; y += 44) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Sunny kitchen window on left
    rr(ctx, 36, 130, 145, 160, 14);
    ctx.fillStyle = "#bae6fd";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#b45309";
    ctx.stroke();
    // Window crossbars & drifting cloud
    const cx = 65 + ((t * 12) % 90);
    drawOutlinedCircle(ctx, cx, 185, 16, "#ffffff", "#fff", 0);
    drawOutlinedCircle(ctx, cx + 16, 182, 19, "#ffffff", "#fff", 0);
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(108, 130);
    ctx.lineTo(108, 290);
    ctx.moveTo(36, 210);
    ctx.lineTo(181, 210);
    ctx.stroke();

    // Shelf with cute jars on right
    rr(ctx, 365, 195, 140, 14, 6);
    ctx.fillStyle = "#b45309";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // Sugar & Cocoa Jars
    rr(ctx, 385, 152, 34, 43, 7);
    ctx.fillStyle = "#fef3c7";
    ctx.fill();
    ctx.stroke();
    rr(ctx, 432, 160, 38, 35, 7);
    ctx.fillStyle = "#fbcfe8";
    ctx.fill();
    ctx.stroke();

    // Warm Wooden Countertop (2.5D perspective plane)
    ctx.fillStyle = "#d98a42";
    ctx.fillRect(0, 455, W, 190);
    ctx.fillStyle = "#b46525";
    ctx.fillRect(0, 635, W, H - 635);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 455);
    ctx.lineTo(W, 455);
    ctx.moveTo(0, 635);
    ctx.lineTo(W, 635);
    ctx.stroke();

    // Subtle wood plank stripes
    ctx.strokeStyle = "rgba(120, 53, 15, 0.22)";
    ctx.lineWidth = 2;
    for (let wy = 485; wy < 630; wy += 28) {
      ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.lineTo(W, wy);
      ctx.stroke();
    }
  } else if (setting === "aquarium") {
    // Cozy bright indoor room with warm wooden aquarium stand
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 500);
    wallGrad.addColorStop(0, "#e0f2fe");
    wallGrad.addColorStop(1, "#f0f9ff");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle sunlit diagonal light beam
    ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.lineTo(240, 0);
    ctx.lineTo(420, 520);
    ctx.lineTo(180, 520);
    ctx.closePath();
    ctx.fill();

    // Cute potted leaf plant on top-left corner
    rr(ctx, 36, 392, 54, 62, 8);
    ctx.fillStyle = "#ea580c";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    for (let l = -1; l <= 1; l++) {
      ctx.save();
      ctx.translate(63, 392);
      ctx.rotate(l * 0.45 + Math.sin(t * 2 + l) * 0.06);
      ctx.beginPath();
      ctx.ellipse(0, -32, 12, 32, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#16a34a";
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Wooden desk surface
    ctx.fillStyle = "#c88141";
    ctx.fillRect(0, 465, W, 185);
    ctx.fillStyle = "#8c4f1f";
    ctx.fillRect(0, 645, W, H - 645);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 465);
    ctx.lineTo(W, 465);
    ctx.stroke();
  } else if (setting === "backyard" || setting === "farm") {
    // Bright cheerful sky + clouds + Indonesian brick house / village huts (@untabiru5 & @dhotscliper!)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 360);
    skyGrad.addColorStop(0, "#38bdf8");
    skyGrad.addColorStop(1, "#bae6fd");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, 380);

    // Sun + Clouds
    drawOutlinedCircle(ctx, 455, 118, 32, "#fde047", "#f59e0b", 3);
    for (let c = 0; c < 3; c++) {
      const cx = ((t * 14 + c * 210) % (W + 140)) - 70;
      const cy = 125 + (c % 2) * 45;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy - 6, 28, 0, Math.PI * 2);
      ctx.arc(cx + 46, cy, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    if (setting === "backyard") {
      // Classic Red Brick House Backdrop (@untabiru5!)
      ctx.fillStyle = "#b8432e";
      ctx.fillRect(0, 175, W, 175);
      ctx.strokeStyle = "#e7d5be";
      ctx.lineWidth = 2;
      for (let by = 175; by < 350; by += 22) {
        ctx.beginPath();
        ctx.moveTo(0, by);
        ctx.lineTo(W, by);
        ctx.stroke();
      }
      // Roof trim & wooden double doors
      ctx.fillStyle = "#92400e";
      ctx.fillRect(0, 155, W, 24);
      rr(ctx, 75, 225, 102, 125, 4);
      ctx.fillStyle = "#713f12";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
    } else {
      // Distant Green Hills & Village Huts (@dhotscliper!)
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(140, 355, 170, Math.PI, 0);
      ctx.arc(410, 355, 185, Math.PI, 0);
      ctx.fill();
      [110, 395].forEach((hx) => {
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(hx, 265, 68, 52);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(hx, 265, 68, 52);
        ctx.fillStyle = "#c2410c";
        ctx.beginPath();
        ctx.moveTo(hx - 12, 268);
        ctx.lineTo(hx + 34, 228);
        ctx.lineTo(hx + 80, 268);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    }

    // Lush Green Grass + Cutaway Soil Base
    ctx.fillStyle = "#65a30d";
    ctx.fillRect(0, 345, W, 225);
    ctx.fillStyle = "#7c4a24";
    ctx.fillRect(0, 565, W, H - 565);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 345);
    ctx.lineTo(W, 345);
    ctx.moveTo(0, 565);
    ctx.lineTo(W, 565);
    ctx.stroke();

    // Soil pebbles & roots
    for (let s = 0; s < 22; s++) {
      const sx = (s * 47 + 20) % W;
      const sy = 588 + ((s * 61) % 240);
      drawOutlinedCircle(ctx, sx, sy, 4 + (s % 4), s % 2 === 0 ? "#573215" : "#a1683a", INK, 1);
    }
  } else if (setting === "sky_space") {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.55, "#1d4ed8");
    grad.addColorStop(1, "#38bdf8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    for (let st = 0; st < 28; st++) {
      const sx = (st * 79) % W;
      const sy = (st * 53) % 340;
      const alpha = 0.4 + Math.abs(Math.sin(t * 3 + st)) * 0.6;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(sx, sy, 3.5, 3.5);
    }
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, 595, W, H - 595);
  } else {
    // Clean Warm Workshop (@untabiru5 Kipas Angin desk!)
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 480);
    wallGrad.addColorStop(0, "#fefce8");
    wallGrad.addColorStop(1, "#fef3c7");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle Pegboard Dots on Back Wall
    ctx.fillStyle = "rgba(180, 83, 9, 0.14)";
    for (let px = 40; px < W - 20; px += 32) {
      for (let py = 120; py < 410; py += 32) {
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Oak Workbench
    ctx.fillStyle = "#c97c36";
    ctx.fillRect(0, 455, W, 200);
    ctx.fillStyle = "#8a4b16";
    ctx.fillRect(0, 645, W, H - 645);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 455);
    ctx.lineTo(W, 455);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 2. EXPRESSIVE CARTOON HUMAN WORKER ("Si Manusia" — Consistent Across All Videos!)
// ============================================================================
function drawCartoonHuman(ctx, x, y, action, setting, tool, t) {
  ctx.save();
  const isPanic = action === "panic";
  const isCelebrate = action === "celebrate";
  const isHeat = action === "heat";
  const isInspect = action === "inspect";
  const bounce = isPanic
    ? Math.abs(Math.sin(t * 14)) * -10
    : isCelebrate
    ? Math.abs(Math.sin(t * 7.5)) * -18
    : Math.sin(t * 4) * 3;
  const shakeX = isPanic ? Math.sin(t * 36) * 4 : 0;

  ctx.translate(x + shakeX, y + bounce);

  // Soft Ground Shadow
  ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 128 - bounce * 0.5, 48, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (animated stepping!)
  const legSwing = isCelebrate ? Math.sin(t * 8) * 8 : Math.sin(t * 5) * 4;
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.fillStyle = "#1e3a5f";
  rr(ctx, -26, 72, 20, 50 + legSwing * 0.3, 8);
  ctx.fill();
  ctx.stroke();
  rr(ctx, 6, 72, 20, 50 - legSwing * 0.3, 8);
  ctx.fill();
  ctx.stroke();

  // Hoodie Torso (Signature Teal-Green Hoodie!)
  rr(ctx, -38, -2, 76, 82, 24);
  ctx.fillStyle = "#0d9488";
  ctx.fill();
  ctx.stroke();

  // Hoodie Pocket & Drawstrings
  rr(ctx, -22, 42, 44, 24, 10);
  ctx.fillStyle = "#0f766e";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = "#f8fafc";
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(-10, 26);
  ctx.moveTo(10, 4);
  ctx.lineTo(10, 26);
  ctx.stroke();

  // Articulated Arms & Hands
  const armWave = Math.sin(t * 7.5);
  function drawArm(side, angle, holdTool = false) {
    ctx.save();
    ctx.translate(side * 36, 16);
    ctx.rotate(angle);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = INK;
    rr(ctx, -11, 0, 22, 54, 11);
    ctx.fillStyle = "#14b8a6";
    ctx.fill();
    ctx.stroke();
    // Cute round hand
    drawOutlinedCircle(ctx, 0, 56, 13, "#f1c29b", INK, 3);

    // Optional Handheld Prop (Torch / Magnifier / Pour / Whisk / Wrench)
    if (holdTool && (isHeat || isInspect || (tool && tool !== "none"))) {
      ctx.save();
      ctx.translate(0, 58);
      if (isHeat || tool === "fire_heat") {
        // Handheld Mini Blowtorch with Animated Flame!
        rr(ctx, -7, 0, 14, 30, 5);
        ctx.fillStyle = "#475569";
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-6, 30);
        ctx.lineTo(0, 52 + Math.sin(t * 28) * 6);
        ctx.lineTo(6, 30);
        ctx.closePath();
        ctx.fillStyle = "#f97316";
        ctx.fill();
        ctx.stroke();
      } else if (isInspect) {
        // Magnifying Glass!
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 24);
        ctx.stroke();
        drawOutlinedCircle(ctx, 0, 40, 16, "rgba(186, 230, 253, 0.85)", INK, 3);
      } else if (tool === "milk_sugar" || tool === "salt_ice" || action === "pour") {
        // Pouring Carton / Salt Shaker
        ctx.rotate(0.65);
        rr(ctx, -14, -22, 28, 38, 6);
        ctx.fillStyle = tool === "salt_ice" ? "#38bdf8" : "#ffffff";
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = tool === "salt_ice" ? "#ffffff" : "#2563eb";
        ctx.fillRect(-12, -8, 24, 12);
      } else if (tool === "whisk_mixer" || tool === "spoon" || action === "stir") {
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 44);
        ctx.stroke();
        drawOutlinedCircle(ctx, 0, 46, 10, "#cbd5e1", INK, 2.5);
      } else if (tool === "wrench" || tool === "capacitor") {
        rr(ctx, -6, 0, 12, 38, 4);
        ctx.fillStyle = "#94a3b8";
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  if (isPanic) {
    drawArm(-1, 2.35 + armWave * 0.35, false);
    drawArm(1, -2.35 - armWave * 0.35, false);
  } else if (isCelebrate) {
    drawArm(-1, 2.65 + Math.sin(t * 9) * 0.15, false);
    drawArm(1, -2.65 - Math.sin(t * 9) * 0.15, false);
  } else if (isInspect) {
    drawArm(-1, 0.45 + armWave * 0.15, false);
    drawArm(1, -1.05 + Math.sin(t * 3.5) * 0.25, true);
  } else {
    drawArm(-1, 0.55 + armWave * 0.2, false);
    drawArm(1, -0.75 + armWave * 0.35, true);
  }

  // Expressive Head
  ctx.save();
  ctx.translate(0, -34);
  ctx.rotate(isPanic ? Math.sin(t * 14) * 0.12 : Math.sin(t * 2.5) * 0.05);
  drawOutlinedCircle(ctx, 0, 0, 38, "#f3c6a0", INK, 3.8);

  // Cute Hair Bangs
  ctx.beginPath();
  ctx.arc(0, -6, 39, Math.PI * 1.05, Math.PI * 1.95);
  ctx.quadraticCurveTo(18, -12, 0, -20);
  ctx.quadraticCurveTo(-18, -12, -37, -12);
  ctx.closePath();
  ctx.fillStyle = "#1e293b";
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Optional Hats matching setting!
  if (setting === "kitchen") {
    // Cute White Chef Hat!
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-16, -46, 15, 0, Math.PI * 2);
    ctx.arc(0, -52, 18, 0, Math.PI * 2);
    ctx.arc(16, -46, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    rr(ctx, -24, -42, 48, 16, 4);
    ctx.fill();
    ctx.stroke();
  } else if (setting === "farm") {
    // Traditional Caping Farmer Hat!
    ctx.beginPath();
    ctx.moveTo(-54, -22);
    ctx.lineTo(0, -56);
    ctx.lineTo(54, -22);
    ctx.closePath();
    ctx.fillStyle = "#eab308";
    ctx.fill();
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  // Facial Expressions (Blinking Eyes, Shocked Panic O-Mouth, Happy Celebrate Smile!)
  const isBlink = t % 3.1 > 2.95 && !isPanic;
  if (isCelebrate) {
    // Happy ^ ^ eyes
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    [-13, 13].forEach((ex) => {
      ctx.beginPath();
      ctx.arc(ex, 0, 7, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    });
    // Big cheerful grin
    ctx.beginPath();
    ctx.arc(0, 10, 12, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.stroke();
  } else if (isPanic) {
    // Big startled eyes + anime sweat drop!
    drawOutlinedCircle(ctx, -13, -2, 7.5, "#ffffff", INK, 2.5);
    drawOutlinedCircle(ctx, -13, -2, 3, INK, INK, 0);
    drawOutlinedCircle(ctx, 13, -2, 7.5, "#ffffff", INK, 2.5);
    drawOutlinedCircle(ctx, 13, -2, 3, INK, INK, 0);
    // Shocked O mouth
    ctx.beginPath();
    ctx.ellipse(0, 15, 8, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#991b1b";
    ctx.fill();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // Flying blue sweat drop
    drawOutlinedCircle(ctx, 36, -18 + (t * 25) % 16, 5.5, "#38bdf8", INK, 2);
  } else {
    // Focused working expression
    if (isBlink) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-18, -1);
      ctx.lineTo(-8, -1);
      ctx.moveTo(8, -1);
      ctx.lineTo(18, -1);
      ctx.stroke();
    } else {
      drawOutlinedCircle(ctx, -13, -1, 4.5, INK, INK, 0);
      drawOutlinedCircle(ctx, 13, -1, 4.5, INK, INK, 0);
      drawOutlinedCircle(ctx, -11.5, -2.5, 1.5, "#ffffff", "#fff", 0);
      drawOutlinedCircle(ctx, 14.5, -2.5, 1.5, "#ffffff", "#fff", 0);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 10, 8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

// ============================================================================
// 3. DETAILED 2.5D HANDS-ON PROPS & SIMULATIONS (MATCHING ANY TOPIC!)
// ============================================================================
function drawBettaFish2D(ctx, x, y, color, facingRight, t, seed) {
  ctx.save();
  ctx.translate(x, y);
  if (!facingRight) ctx.scale(-1, 1);

  const finWave = Math.sin(t * 8 + seed) * 7;

  // Flowing Translucent Halfmoon Fan Tail (Signature Ikan Cupang!)
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.bezierCurveTo(-48, -36 + finWave, -64, -12 + finWave, -56, 0);
  ctx.bezierCurveTo(-64, 16 - finWave, -46, 38 - finWave, -14, 0);
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(-14, 0, -60, 0);
  tailGrad.addColorStop(0, color);
  tailGrad.addColorStop(1, "#f43f5e");
  ctx.fillStyle = tailGrad;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Top Dorsal Flowing Fin
  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.quadraticCurveTo(-18, -34 + finWave * 0.5, 8, -12);
  ctx.closePath();
  ctx.fillStyle = tailGrad;
  ctx.fill();
  ctx.stroke();

  // Bottom Anal Fin
  ctx.beginPath();
  ctx.moveTo(-12, 8);
  ctx.quadraticCurveTo(-10, 32 - finWave * 0.5, 12, 10);
  ctx.closePath();
  ctx.fillStyle = tailGrad;
  ctx.fill();
  ctx.stroke();

  // Sleek Fish Body
  ctx.beginPath();
  ctx.ellipse(2, 0, 22, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Glossy Highlight & Eye
  drawOutlinedCircle(ctx, 15, -3, 3.5, "#fef08a", INK, 1.5);
  drawOutlinedCircle(ctx, 16, -3, 1.5, INK, INK, 0);
  ctx.restore();
}

function drawArowanaOrFish2D(ctx, x, y, color, facingRight, t, seed) {
  ctx.save();
  ctx.translate(x, y);
  if (!facingRight) ctx.scale(-1, 1);

  const wag = Math.sin(t * 10 + seed) * 6;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(-52, -13 + wag);
  ctx.lineTo(-52, 13 + wag);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, 36, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Shimmering scales highlight
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -5);
  ctx.lineTo(14, -5);
  ctx.stroke();

  drawOutlinedCircle(ctx, 24, -3, 3.5, "#fef08a", INK, 1.5);
  ctx.restore();
}

function drawIceCreamProps(ctx, cx, cy, visual, phase, t) {
  const isFrozen = visual.problemVisual === "rock_ice_block";
  const isMelting = visual.problemVisual === "melting_puddle";
  const hasSaltBucket =
    visual.solutionVisual === "salt_frost_aura" ||
    visual.ingredientOrTool === "salt_ice" ||
    visual.solutionVisual === "creamy_swirl";
  const isCones = visual.solutionVisual === "waffle_cones" || phase === "CLIMAX";

  ctx.save();

  if (isCones) {
    // 3 GORGEOUS CEL-SHADED ICE CREAM WAFFLE CONES!
    const flavors = ["#f472b6", "#fef3c7", "#34d399"];
    [-95, 0, 95].forEach((ox, idx) => {
      const bounce = Math.sin(t * 4 + idx) * 6;
      const x = cx + ox;
      const y = cy + 25 + bounce;

      // Waffle Cone
      ctx.beginPath();
      ctx.moveTo(x - 32, y - 10);
      ctx.lineTo(x + 32, y - 10);
      ctx.lineTo(x, y + 78);
      ctx.closePath();
      ctx.fillStyle = "#d97706";
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = INK;
      ctx.stroke();
      // Waffle criss-cross lines
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 20, y + 12);
      ctx.lineTo(x + 18, y + 32);
      ctx.moveTo(x + 20, y + 12);
      ctx.lineTo(x - 18, y + 32);
      ctx.stroke();

      // Double Glossy Ice Cream Scoops
      drawOutlinedCircle(ctx, x, y - 22, 34, flavors[idx], INK, 3.5);
      drawOutlinedCircle(ctx, x, y - 62, 26, flavors[(idx + 1) % 3], INK, 3.5);
      // Glossy highlight arc
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x - 8, y - 66, 12, Math.PI * 1.05, Math.PI * 1.45);
      ctx.stroke();
      // Cherry on top!
      drawOutlinedCircle(ctx, x, y - 92, 9, "#e11d48", INK, 2.5);
    });
    ctx.restore();
    return;
  }

  // Outer Chilled Wooden/Blue Bucket with Ice Cubes + Raining Salt!
  if (hasSaltBucket) {
    // Frosty Cold Glow Halo
    const frostGrad = ctx.createRadialGradient(cx, cy + 10, 20, cx, cy + 10, 165);
    frostGrad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
    frostGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = frostGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 165, 0, Math.PI * 2);
    ctx.fill();

    // Blue Chilled Bucket
    ctx.beginPath();
    ctx.moveTo(cx - 128, cy - 18);
    ctx.lineTo(cx + 128, cy - 18);
    ctx.lineTo(cx + 102, cy + 92);
    ctx.lineTo(cx - 102, cy + 92);
    ctx.closePath();
    ctx.fillStyle = "#0284c7";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // Sparkling Ice Cubes packed around the bowl!
    [-98, -74, 74, 98, -86, 86].forEach((ix, i) => {
      ctx.save();
      ctx.translate(cx + ix, cy - 22 + (i % 2) * 10);
      ctx.rotate(i * 0.4);
      rr(ctx, -14, -14, 28, 28, 6);
      ctx.fillStyle = "#bae6fd";
      ctx.fill();
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.restore();
    });

    // Raining Salt Crystals when salt_ice!
    if (visual.ingredientOrTool === "salt_ice") {
      ctx.fillStyle = "#ffffff";
      for (let g = 0; g < 16; g++) {
        const gx = cx - 95 + (g % 8) * 27;
        const gy = cy - 115 + ((t * 140 + g * 24) % 105);
        drawOutlinedCircle(ctx, gx, gy, 3.2, "#ffffff", "#0284c7", 1);
      }
    }
  }

  // Stainless Steel Mixing Bowl
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 86, 0, Math.PI);
  ctx.closePath();
  const bowlGrad = ctx.createLinearGradient(cx - 86, cy, cx + 86, cy);
  bowlGrad.addColorStop(0, "#94a3b8");
  bowlGrad.addColorStop(0.35, "#f1f5f9");
  bowlGrad.addColorStop(1, "#64748b");
  ctx.fillStyle = bowlGrad;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Bowl Rim & Creamy Contents
  ctx.beginPath();
  ctx.ellipse(cx, cy - 6, 86, 22, 0, 0, Math.PI * 2);
  ctx.fillStyle = isFrozen ? "#bae6fd" : isMelting ? "#fde68a" : visual.accentColor || "#fbcfe8";
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Liquid Milk Stream pouring in on HOOK!
  if (visual.ingredientOrTool === "milk_sugar") {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    rr(ctx, cx - 9, cy - 125, 18, 120, 8);
    ctx.fill();
    ctx.stroke();
  }

  // PROBLEM #1: Rock-Hard Jagged Ice Block + Bent Spoon!
  if (isFrozen) {
    const spikes = [
      [-45, -10, -25, -72, 2, -10],
      [-15, -10, 12, -88, 36, -10],
      [18, -10, 48, -64, 62, -10]
    ];
    spikes.forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.beginPath();
      ctx.moveTo(cx + x1, cy + y1);
      ctx.lineTo(cx + x2, cy + y2);
      ctx.lineTo(cx + x3, cy + y3);
      ctx.closePath();
      ctx.fillStyle = "#7dd3fc";
      ctx.fill();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    });
  }

  // PROBLEM #2: Melting Gritty Puddle dripping over bowl!
  if (isMelting) {
    ctx.fillStyle = "#fde68a";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 88, 118, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // SOLUTION #2: Spinning Silver Whisk Whipping Creamy Swirls + Tiny Air Bubbles!
  if (visual.solutionVisual === "creamy_swirl" || visual.ingredientOrTool === "whisk_mixer") {
    const wx = cx + Math.cos(t * 7) * 26;
    const wy = cy - 30 + Math.sin(t * 7) * 8;
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(wx, wy - 72);
    ctx.lineTo(wx, wy + 10);
    ctx.stroke();
    for (let w = -1; w <= 1; w++) {
      ctx.beginPath();
      ctx.ellipse(wx + w * 9, wy + 12, 10, 24, w * 0.25, 0, Math.PI * 2);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // Floating airy bubbles!
    for (let b = 0; b < 8; b++) {
      const bx = cx - 55 + b * 16;
      const by = cy - 22 - ((t * 45 + b * 14) % 55);
      drawOutlinedCircle(ctx, bx, by, 5, "#ffffff", "#f472b6", 1.8);
    }
  }

  ctx.restore();
}

function drawAquariumProps(ctx, cx, cy, visual, phase, sceneNum, t) {
  const isCupang = visual.heroObject === "betta_fish";
  const isMurky = visual.problemVisual === "murky_mud";
  const isFighting = visual.problemVisual === "fish_fighting";
  const isJumping = visual.problemVisual === "fish_jumping";
  const hasDivider = visual.solutionVisual === "glass_divider" || (isCupang && sceneNum >= 3);
  const hasKetapang = visual.ingredientOrTool === "ketapang_leaf" || (isCupang && sceneNum >= 5);
  const hasBubbles = visual.solutionVisual === "clear_bubbles" || sceneNum >= 5 || phase === "CLIMAX";

  const tw = 276;
  const th = 180;
  const tx = cx - tw / 2;
  const ty = cy - 75;

  ctx.save();

  // Protective Tank Lid
  if (sceneNum >= 5 || phase === "CLIMAX") {
    rr(ctx, tx - 6, ty - 14, tw + 12, 14, 5);
    ctx.fillStyle = "rgba(186, 230, 253, 0.8)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  // Water Body (Murky brown / warm ketapang amber / crystal cyan!)
  ctx.fillStyle = isMurky
    ? "rgba(133, 94, 48, 0.85)"
    : hasKetapang
    ? "rgba(56, 189, 248, 0.58)"
    : "rgba(56, 189, 248, 0.52)";
  ctx.fillRect(tx + 5, ty + 24, tw - 10, th - 29);

  // Animated Wavy Water Surface
  ctx.beginPath();
  ctx.moveTo(tx + 5, ty + 24);
  for (let wx = 0; wx <= tw - 10; wx += 14) {
    ctx.lineTo(tx + 5 + wx, ty + 24 + Math.sin(t * 4 + wx * 0.08) * 3.5);
  }
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Gravel Floor & Swaying Green Aquatic Plants
  ctx.fillStyle = "#d6d3d1";
  ctx.fillRect(tx + 5, ty + th - 20, tw - 10, 15);
  [-105, -82, 86].forEach((px, i) => {
    ctx.save();
    ctx.translate(cx + px, ty + th - 18);
    ctx.rotate(Math.sin(t * 2.5 + i) * 0.14);
    ctx.beginPath();
    ctx.ellipse(0, -34, 9, 36, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  });

  // Floating Brown Daun Ketapang (for Cupang!)
  if (hasKetapang) {
    ctx.save();
    ctx.translate(tx + 68, ty + 32 + Math.sin(t * 2) * 3);
    ctx.rotate(0.18);
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#92400e";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  }

  // Cute Sponge Filter + Rising Shimmering Bubbles
  if (hasBubbles) {
    rr(ctx, tx + tw - 48, ty + th - 68, 28, 48, 6);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = INK;
    ctx.stroke();
    for (let b = 0; b < 7; b++) {
      const by = ty + th - 72 - ((t * 58 + b * 18) % 85);
      const bx = tx + tw - 34 + Math.sin(t * 5 + b) * 7;
      drawOutlinedCircle(ctx, bx, by, 4.5, "rgba(255,255,255,0.85)", "#0284c7", 1.5);
    }
  }

  // Frosted Glass Divider (Sekat Kaca) for Cupang!
  if (hasDivider) {
    rr(ctx, cx - 5, ty + 6, 10, th - 12, 3);
    ctx.fillStyle = "rgba(226, 232, 240, 0.82)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  // Animated Fish (Betta Cupang vs Arowana vs Ornamental!)
  if (isCupang) {
    if (isFighting) {
      const dart = Math.sin(t * 10) * 16;
      drawBettaFish2D(ctx, cx - 35 + dart, cy + 5, "#2563eb", true, t, 0);
      drawBettaFish2D(ctx, cx + 35 - dart, cy + 12, "#e11d48", false, t, 2);
      // Angry red clash spark!
      ctx.font = "900 28px sans-serif";
      ctx.fillText("💥", cx - 14, cy - 12);
    } else {
      const f1x = hasDivider ? cx - 72 + Math.sin(t * 1.8) * 20 : cx - 45 + Math.sin(t * 1.8) * 45;
      const f2x = hasDivider ? cx + 68 + Math.cos(t * 1.8) * 18 : cx + 52 + Math.cos(t * 1.8) * 40;
      drawBettaFish2D(ctx, f1x, cy + 6 + Math.sin(t * 2.4) * 12, "#2563eb", Math.cos(t * 1.8) >= 0, t, 0);
      drawBettaFish2D(ctx, f2x, cy + 28 + Math.cos(t * 2.1) * 12, "#e11d48", Math.sin(t * 1.8) <= 0, t, 2);
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const jump = isJumping && i === 0;
      const fx = cx + Math.sin(t * 1.6 + i * 2) * 76;
      const fy = jump ? ty - 34 - Math.abs(Math.sin(t * 4)) * 34 : ty + 62 + i * 32;
      drawArowanaOrFish2D(
        ctx,
        fx,
        fy,
        visual.accentColor || "#ef4444",
        Math.cos(t * 1.6 + i * 2) >= 0,
        t,
        i
      );
    }
  }

  // Outer Crisp Glass Tank Frame + Glossy Reflection Streak
  rr(ctx, tx, ty, tw, th, 10);
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(tx + 18, ty + 38);
  ctx.lineTo(tx + 38, ty + 18);
  ctx.stroke();

  ctx.restore();
}

function drawFanMotorProps(ctx, cx, cy, visual, phase, sceneNum, t) {
  const isVibrating = visual.problemVisual === "motor_vibrating" || phase === "TAPI";
  const isSpinning = visual.solutionVisual === "rotating_arrows" || phase === "JADI" || phase === "CLIMAX";
  const shake = isVibrating ? Math.sin(t * 48) * 5 : 0;

  ctx.save();
  ctx.translate(cx + shake, cy + 8);

  // Stator Ring + Copper Coils
  drawOutlinedCircle(ctx, 0, 0, 88, "#64748b", INK, 4);
  drawOutlinedCircle(ctx, 0, 0, 62, "#1e293b", INK, 3.5);
  for (let i = 0; i < 10; i++) {
    ctx.save();
    ctx.rotate((i / 10) * Math.PI * 2);
    rr(ctx, -10, -82, 20, 22, 5);
    ctx.fillStyle = i % 2 === 0 ? "#d97706" : "#16a34a";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  }

  // Spinning Translucent Blue Fan Blades
  ctx.save();
  if (isSpinning) ctx.rotate(t * 9.5);
  else if (isVibrating) ctx.rotate(Math.sin(t * 45) * 0.12);

  for (let b = 0; b < 3; b++) {
    ctx.save();
    ctx.rotate((b * Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0, -48, 22, 42, 0.18, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(56, 189, 248, 0.85)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  }
  drawOutlinedCircle(ctx, 0, 0, 18, "#0284c7", INK, 3);
  ctx.restore();

  // White 1.5 uF Capacitor Box on right side!
  if (visual.ingredientOrTool === "capacitor" || sceneNum >= 5) {
    rr(ctx, 98, 12, 70, 80, 10);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(104, 30, 58, 26);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("1,5 µF", 133, 48);
    // Red wire
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(118, 12);
    ctx.quadraticCurveTo(96, -24, 65, -25);
    ctx.stroke();
  }

  // Animated Vibration Zig-Zag OR Smooth Rotation Arrows!
  if (isVibrating) {
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 108, -0.5, 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 108, Math.PI - 0.5, Math.PI + 0.5);
    ctx.stroke();
  } else if (isSpinning) {
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -t * 60;
    ctx.beginPath();
    ctx.arc(0, 0, 106, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawUniversalHandsOnProps(ctx, cx, cy, visual, phase, t) {
  const hero = visual.heroObject;
  const accent = visual.accentColor || "#38bdf8";
  const isError = phase === "TAPI";
  const isSuccess = phase === "CLIMAX";

  ctx.save();
  if (hero === "rocket") {
    const lift = isSuccess ? -((t * 80) % 160) : Math.sin(t * 4) * 6;
    ctx.translate(cx, cy + lift);
    // Flame exhaust
    ctx.beginPath();
    ctx.moveTo(-22, 62);
    ctx.lineTo(0, 110 + Math.sin(t * 28) * 14);
    ctx.lineTo(22, 62);
    ctx.closePath();
    ctx.fillStyle = "#f97316";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // Rocket body
    ctx.beginPath();
    ctx.moveTo(0, -88);
    ctx.quadraticCurveTo(38, -28, 34, 62);
    ctx.lineTo(-34, 62);
    ctx.quadraticCurveTo(-38, -28, 0, -88);
    ctx.closePath();
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    drawOutlinedCircle(ctx, 0, -10, 16, "#38bdf8", INK, 3.5);
  } else if (hero === "rice_fish") {
    // Minapadi Swaying Rice Stalks & Swimming Orange Fish!
    ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
    ctx.fillRect(40, cy + 12, 460, 110);
    for (let r = 0; r < 11; r++) {
      const rx = 68 + r * 40;
      ctx.save();
      ctx.translate(rx, cy + 50);
      ctx.rotate(Math.sin(t * 2.5 + r) * 0.15);
      ctx.strokeStyle = isSuccess ? "#eab308" : "#65a30d";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -76);
      ctx.stroke();
      ctx.restore();
    }
    for (let f = 0; f < 3; f++) {
      drawArowanaOrFish2D(
        ctx,
        120 + ((t * 55 + f * 130) % 300),
        cy + 65 + f * 22,
        "#f97316",
        true,
        t,
        f
      );
    }
  } else {
    // Detailed Illustrated Hands-On Workbench Container (Food Pan / Coffee Cup / Water Filter / Solar / Lab Device)
    rr(ctx, cx - 108, cy - 58, 216, 146, 20);
    ctx.fillStyle = isError ? "#fee2e2" : isSuccess ? "#d1fae5" : "#f8fafc";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // Inner animated mechanism/substance
    rr(ctx, cx - 86, cy - 32, 172, 96, 14);
    ctx.fillStyle = isError ? "#ef4444" : accent;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();

    // Animated rotating gear / swirl inside!
    ctx.save();
    ctx.translate(cx, cy + 16);
    ctx.rotate(isError ? Math.sin(t * 35) * 0.15 : t * 2.5);
    drawOutlinedCircle(ctx, 0, 0, 34, "#ffffff", INK, 3);
    for (let g = 0; g < 6; g++) {
      ctx.rotate(Math.PI / 3);
      rr(ctx, -6, -44, 12, 14, 3);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Rising Steam / Smoke / Sparkles
    for (let p = 0; p < 6; p++) {
      const px = cx - 60 + p * 24 + Math.sin(t * 4 + p) * 6;
      const py = cy - 68 - ((t * 48 + p * 16) % 55);
      drawOutlinedCircle(
        ctx,
        px,
        py,
        isError ? 9 : 6,
        isError ? "rgba(71, 85, 105, 0.7)" : "rgba(255, 255, 255, 0.85)",
        INK,
        1.8
      );
    }
  }
  ctx.restore();
}

// ============================================================================
// 3B. GEMINI-AUTHORED 2.5D VECTOR CHOREOGRAPHY COMPILER (ANY TOPIC!)
// ============================================================================
function getPartAnchor(part) {
  if (part.kind === "arrow") {
    return { ox: (part.x1 + part.x2) / 2, oy: (part.y1 + part.y2) / 2 };
  }
  if (part.kind === "poly" && Array.isArray(part.points) && part.points.length) {
    let sx = 0;
    let sy = 0;
    for (const pt of part.points) {
      sx += pt[0];
      sy += pt[1];
    }
    return { ox: sx / part.points.length, oy: sy / part.points.length };
  }
  return { ox: part.x || 0, oy: part.y || 0 };
}

function drawVectorPart(ctx, cx, cy, part, phase, t, idx) {
  const { ox, oy } = getPartAnchor(part);
  const motion = part.motion || "none";
  const strokeColor = part.stroke || INK;

  ctx.save();
  ctx.translate(cx + ox, cy + oy);

  if (motion === "float") {
    ctx.translate(0, Math.sin(t * 3 + idx) * 6);
  } else if (motion === "pulse") {
    const s = 1 + Math.sin(t * 4.5 + idx) * 0.065;
    ctx.scale(s, s);
  } else if (motion === "spin") {
    ctx.rotate(t * (part.speed || 3));
  } else if (motion === "spin_reverse") {
    ctx.rotate(-t * Math.abs(part.speed || 3));
  } else if (motion === "shake") {
    ctx.translate(Math.sin(t * 46 + idx) * 5, Math.cos(t * 38 + idx) * 2.5);
  } else if (motion === "slide_x") {
    ctx.translate(Math.sin(t * 3.5 + idx) * 18, 0);
  } else if (motion === "slide_y") {
    ctx.translate(0, Math.sin(t * 3.5 + idx) * 14);
  } else if (motion === "rise") {
    ctx.translate(0, -((t * 48 + idx * 13) % 52));
  } else if (motion === "drip") {
    ctx.translate(0, (t * 72 + idx * 17) % 52);
  } else if (motion === "tilt") {
    ctx.rotate(Math.sin(t * 3.2 + idx) * 0.24);
  }

  ctx.translate(-ox, -oy);

  if (part.kind === "roundRect") {
    const w = part.w || 120;
    const h = part.h || 80;
    const r = Math.min(part.r ?? 12, w / 2, h / 2);
    rr(ctx, ox - w / 2, oy - h / 2, w, h, r);
    ctx.fillStyle = part.glass ? "rgba(186, 230, 253, 0.36)" : part.fill || "#f8fafc";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();

    if (part.glass) {
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ox - w / 2 + 12, oy - h / 2 + 26);
      ctx.lineTo(ox - w / 2 + 28, oy - h / 2 + 10);
      ctx.stroke();
    } else if (w > 40 && h > 22) {
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox - w / 2 + 10, oy - h / 2 + 7);
      ctx.lineTo(ox + w / 2 - 14, oy - h / 2 + 7);
      ctx.stroke();
    }

    if (part.label) {
      ctx.fillStyle = INK;
      ctx.font = "800 12px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(part.label, ox, oy, w - 12);
    }
  } else if (part.kind === "liquid") {
    const w = part.w || 110;
    const h = part.h || 70;
    const r = Math.min(part.r ?? 10, w / 2, h / 2);
    const waveSpeed = part.waveSpeed || 4;
    const topY = oy - h / 2;
    const botY = oy + h / 2;
    const leftX = ox - w / 2;
    const rightX = ox + w / 2;

    ctx.save();
    rr(ctx, leftX, topY - 4, w, h + 4, r);
    ctx.clip();

    ctx.beginPath();
    ctx.moveTo(leftX, botY);
    for (let x = 0; x <= w; x += 10) {
      ctx.lineTo(leftX + x, topY + 6 + Math.sin(t * waveSpeed + x * 0.08 + idx) * 4);
    }
    ctx.lineTo(rightX, botY);
    ctx.closePath();
    ctx.fillStyle = part.fill || "#38bdf8";
    ctx.fill();

    // Bright surface highlight wave
    ctx.beginPath();
    for (let x = 0; x <= w; x += 10) {
      const wy = topY + 6 + Math.sin(t * waveSpeed + x * 0.08 + idx) * 4;
      if (x === 0) ctx.moveTo(leftX + x, wy);
      else ctx.lineTo(leftX + x, wy);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Subtle rising bubbles inside liquid
    for (let b = 0; b < 4; b++) {
      const bx = leftX + 16 + ((b * 37) % Math.max(20, w - 32));
      const by = botY - 8 - ((t * 36 + b * 19) % Math.max(16, h - 16));
      drawOutlinedCircle(ctx, bx, by, 3.5, "rgba(255,255,255,0.65)", INK, 1.2);
    }
    ctx.restore();
  } else if (part.kind === "circle") {
    const rad = part.radius || 32;
    drawOutlinedCircle(ctx, ox, oy, rad, part.fill || "#fbbf24", strokeColor, 3.5);
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ox, oy, Math.max(4, rad * 0.65), Math.PI * 1.1, Math.PI * 1.45);
    ctx.stroke();
    if (part.label) {
      ctx.fillStyle = INK;
      ctx.font = "800 11px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(part.label, ox, oy, rad * 1.7);
    }
  } else if (part.kind === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(ox, oy, part.rx || 48, part.ry || 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = part.fill || "#f59e0b";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  } else if (part.kind === "trapezoid") {
    const tw = (part.topW || 60) / 2;
    const bw = (part.bottomW || 150) / 2;
    const hh = (part.h || 110) / 2;
    ctx.beginPath();
    ctx.moveTo(ox - tw, oy - hh);
    ctx.lineTo(ox + tw, oy - hh);
    ctx.lineTo(ox + bw, oy + hh);
    ctx.lineTo(ox - bw, oy + hh);
    ctx.closePath();
    ctx.fillStyle = part.fill || "#94a3b8";
    ctx.fill();
    ctx.lineWidth = 3.8;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  } else if (part.kind === "poly" && Array.isArray(part.points)) {
    ctx.beginPath();
    part.points.forEach((pt, pIdx) => {
      if (pIdx === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    });
    ctx.closePath();
    ctx.fillStyle = part.fill || "#fde047";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  } else if (part.kind === "arrow") {
    const x1 = part.x1 ?? -60;
    const y1 = part.y1 ?? 0;
    const x2 = part.x2 ?? 60;
    const y2 = part.y2 ?? 0;
    const color = part.color || "#f59e0b";
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = (part.width || 5) + 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = part.width || 5;
    if (part.dashed !== false) {
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -t * (part.speed || 2.5) * 28;
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.translate(x2, y2);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  } else if (part.kind === "gear") {
    const rad = part.radius || 32;
    const teeth = part.teeth || 8;
    const spinAng = motion === "none" ? t * (part.speed || 2.8) : 0;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(spinAng);
    drawOutlinedCircle(ctx, 0, 0, rad, part.fill || "#fbbf24", strokeColor, 3.2);
    for (let g = 0; g < teeth; g++) {
      ctx.save();
      ctx.rotate((g * Math.PI * 2) / teeth);
      rr(ctx, -5, -rad - 9, 10, 12, 3);
      ctx.fillStyle = part.fill || "#fbbf24";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
      ctx.restore();
    }
    drawOutlinedCircle(ctx, 0, 0, Math.max(7, rad * 0.34), "#e2e8f0", strokeColor, 2.5);
    ctx.restore();
  } else if (part.kind === "fan") {
    const rad = part.radius || 38;
    const blades = part.blades || 3;
    const spinAng = motion === "none" ? t * (part.speed || 8.5) : 0;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(spinAng);
    for (let b = 0; b < blades; b++) {
      ctx.save();
      ctx.rotate((b * Math.PI * 2) / blades);
      ctx.beginPath();
      ctx.ellipse(0, -rad * 0.55, rad * 0.28, rad * 0.52, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = part.fill || "rgba(56, 189, 248, 0.88)";
      ctx.fill();
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
      ctx.restore();
    }
    drawOutlinedCircle(ctx, 0, 0, Math.max(6, rad * 0.22), "#0284c7", strokeColor, 2.5);
    ctx.restore();
  } else if (part.kind === "coil") {
    const w = part.w || 90;
    const h = part.h || 56;
    const turns = part.turns || 5;
    const left = ox - w / 2;
    const top = oy - h / 2;
    const step = w / turns;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i <= turns; i++) {
      const px = left + i * step;
      const py = i % 2 === 0 ? top : top + h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineWidth = 10;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = part.color || part.fill || "#38bdf8";
    ctx.stroke();
    ctx.restore();
  } else if (part.kind === "badge") {
    const text = part.text || part.label || "KOMPONEN";
    ctx.font = "800 11.5px 'Plus Jakarta Sans', sans-serif";
    const tw = Math.min(180, ctx.measureText(text).width + 20);
    rr(ctx, ox - tw / 2, oy - 13, tw, 26, 7);
    ctx.fillStyle = part.fill || "#fbbf24";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
    ctx.fillStyle = part.textColor || INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, ox, oy, tw - 10);
  }

  ctx.restore();
}

function drawGeminiStageParts(ctx, cx, cy, visual, phase, t) {
  const parts = visual?.stageParts || [];
  if (!parts.length) {
    drawUniversalHandsOnProps(ctx, cx, cy, visual, phase, t);
    return;
  }
  ctx.save();
  // Soft shadow pedestal under Gemini's 2.5D experiment
  ctx.fillStyle = "rgba(15, 23, 42, 0.2)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 96, 128, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  parts.forEach((part, idx) => {
    drawVectorPart(ctx, cx, cy, part, phase, t, idx);
  });
  ctx.restore();
}

function drawSceneFx(ctx, cx, cy, fxList = [], t) {
  if (!Array.isArray(fxList) || !fxList.length) return;
  ctx.save();
  for (const fx of fxList.slice(0, 2)) {
    if (fx === "sparks" || fx === "lightning") {
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4 + t * 2;
        const dist = 62 + ((t * 90 + i * 19) % 58);
        const sx = cx + Math.cos(ang) * dist;
        const sy = cy - 10 + Math.sin(ang) * dist * 0.7;
        ctx.fillStyle = i % 2 === 0 ? "#fde047" : "#ef4444";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 8);
        ctx.lineTo(sx + 6, sy);
        ctx.lineTo(sx, sy + 8);
        ctx.lineTo(sx - 6, sy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (fx === "bubbles" || fx === "water_drops") {
      for (let i = 0; i < 8; i++) {
        const bx = cx - 90 + i * 26 + Math.sin(t * 4 + i) * 7;
        const by =
          fx === "water_drops"
            ? cy - 95 + ((t * 95 + i * 23) % 140)
            : cy + 35 - ((t * 68 + i * 21) % 130);
        drawOutlinedCircle(ctx, bx, by, 5 + (i % 3), "rgba(186, 230, 253, 0.88)", "#0284c7", 1.8);
      }
    } else if (fx === "steam" || fx === "smoke") {
      const isSmoke = fx === "smoke";
      for (let i = 0; i < 7; i++) {
        const sx = cx - 66 + i * 22 + Math.sin(t * 3 + i) * 10;
        const sy = cy - 45 - ((t * 52 + i * 18) % 85);
        const rad = 11 + Math.sin(t * 4 + i) * 3;
        drawOutlinedCircle(
          ctx,
          sx,
          sy,
          rad,
          isSmoke ? "rgba(71, 85, 105, 0.78)" : "rgba(255, 255, 255, 0.82)",
          INK,
          2
        );
      }
    } else if (fx === "frost") {
      for (let i = 0; i < 9; i++) {
        const fxX = cx - 105 + ((i * 31 + Math.sin(t * 2 + i) * 14) % 210);
        const fxY = cy - 95 + ((t * 48 + i * 27) % 165);
        drawOutlinedCircle(ctx, fxX, fxY, 4.5, "#e0f2fe", "#0284c7", 1.6);
      }
    } else if (fx === "flame") {
      for (let i = 0; i < 6; i++) {
        const flX = cx - 50 + i * 20;
        const flH = 26 + Math.abs(Math.sin(t * 14 + i)) * 24;
        ctx.beginPath();
        ctx.moveTo(flX - 10, cy + 55);
        ctx.quadraticCurveTo(flX, cy + 55 - flH, flX + 10, cy + 55);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? "#f97316" : "#fde047";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
    } else if (fx === "electrons") {
      for (let i = 0; i < 6; i++) {
        const ex = cx - 95 + ((t * 110 + i * 38) % 190);
        const ey = cy - 10 + Math.sin(t * 5 + i) * 18;
        drawOutlinedCircle(ctx, ex, ey, 5.5, "#6ee7b7", "#059669", 2);
      }
    } else if (fx === "leaves") {
      for (let i = 0; i < 6; i++) {
        const lx = cx - 80 + i * 32 + Math.sin(t * 2.5 + i) * 12;
        const ly = cy - 100 + ((t * 38 + i * 25) % 150);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(t * 2 + i);
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  ctx.restore();
}

function drawComicBurstText(ctx, W, comicText, phase, t, sceneElapsedSec) {
  if (!comicText) return;
  const pop = Math.min(1, sceneElapsedSec / 0.28);
  const scale = 0.7 + Math.sin(pop * Math.PI * 0.5) * 0.35 + Math.sin(t * 8) * 0.03;

  ctx.save();
  ctx.translate(W - 92, 208);
  ctx.rotate(phase === "TAPI" ? 0.14 : -0.1);
  ctx.scale(scale, scale);

  const bg = phase === "TAPI" ? "#e11d48" : phase === "CLIMAX" ? "#10b981" : "#fde047";
  const spikes = 10;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? 52 : 38;
    const ang = (i * Math.PI) / spikes;
    const px = Math.cos(ang) * rad * 1.25;
    const py = Math.sin(ang) * rad * 0.72;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.fillStyle = phase === "TAPI" ? "#ffffff" : INK;
  ctx.font = "900 13.5px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(comicText, 0, 1, 96);
  ctx.restore();
}

function drawScienceMeter(ctx, meter, phase, t) {
  if (!meter || !meter.label) return;
  const x = 24;
  const y = 186;
  const w = 138;
  const h = 54;
  const span = Math.max(1, (meter.max ?? 100) - (meter.min ?? 0));
  const rawPct = ((meter.value ?? 50) - (meter.min ?? 0)) / span;
  const pct = Math.max(0.06, Math.min(1, rawPct + Math.sin(t * 5) * 0.03));

  ctx.save();
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "800 10px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText(meter.label, x + 10, y + 17);

  ctx.fillStyle = meter.danger || phase === "TAPI" ? "#fb7185" : "#6ee7b7";
  ctx.font = "900 13px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${meter.value}${meter.unit || ""}`, x + w - 10, y + 18);

  rr(ctx, x + 10, y + 29, w - 20, 12, 6);
  ctx.fillStyle = "#1e293b";
  ctx.fill();
  rr(ctx, x + 10, y + 29, Math.max(12, (w - 20) * pct), 12, 6);
  ctx.fillStyle = meter.danger || phase === "TAPI" ? "#e11d48" : phase === "CLIMAX" ? "#10b981" : "#f59e0b";
  ctx.fill();
  ctx.restore();
}

// ============================================================================
// 4. @UNTABIRU5 FLOATING POINTER CALLOUT TAGS & CONFETTI
// ============================================================================
function drawFloatingCallouts(ctx, W, visual, phase, t) {
  const tags = visual?.callouts || [];
  if (!tags.length) return;

  ctx.save();
  tags.slice(0, 2).forEach((label, idx) => {
    const clean = String(label || "").toUpperCase().slice(0, 24);
    if (!clean) return;
    ctx.font = "800 13px 'Plus Jakarta Sans', sans-serif";
    const tw = Math.min(230, ctx.measureText(clean).width + 32);
    const tx = idx === 0 ? 28 : W - tw - 28;
    const ty = (idx === 0 ? 310 : 352) + Math.sin(t * 3 + idx * 2) * 4;

    // Leader line pointing toward center experiment
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx + tw / 2, ty + 30);
    ctx.lineTo(W / 2 + (idx === 0 ? -45 : 45), 475);
    ctx.stroke();
    drawOutlinedCircle(ctx, W / 2 + (idx === 0 ? -45 : 45), 475, 5.5, "#f59e0b", INK, 2.5);

    // Crisp Orange/Red/Green Callout Pill
    rr(ctx, tx, ty, tw, 30, 8);
    ctx.fillStyle = phase === "TAPI" ? "#e11d48" : phase === "CLIMAX" ? "#10b981" : "#fbbf24";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();

    ctx.fillStyle = phase === "TAPI" ? "#ffffff" : "#090a0f";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`● ${clean}`, tx + tw / 2, ty + 15, tw - 12);
  });
  ctx.restore();
}

function drawCelebrationConfetti(ctx, W, t) {
  const colors = ["#f43f5e", "#fbbf24", "#10b981", "#38bdf8", "#a855f7"];
  ctx.save();
  for (let i = 0; i < 24; i++) {
    const x = ((i * 59 + Math.sin(t * 2 + i) * 30) % (W - 40)) + 20;
    const y = ((t * 110 + i * 47) % 620) + 70;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 4 + i);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-6, -4, 12, 8);
    ctx.restore();
  }
  ctx.restore();
}

// ============================================================================
// MAIN EXPORT: RENDER ONE 60-FPS FRAME OF THE 2.5D @UNTABIRU5 TOON VIDEO!
// ============================================================================
export function renderToonVideoFrame(ctx, W, H, scene, tSec, sceneElapsedSec = 1) {
  const visual = scene?.visual || {
    setting: "kitchen",
    mainContainer: "bowl_bucket",
    heroObject: "ice_cream",
    ingredientOrTool: "milk_sugar",
    workerAction: "pour",
    problemVisual: "none",
    solutionVisual: "none",
    accentColor: "#f472b6",
    callouts: []
  };
  const phase = scene?.phase || "HOOK";
  const sceneNum = scene?.sceneNumber || 1;

  // Smooth cinematic camera pop-in + gentle breathing pan + TAPI impact shake!
  const popEase = Math.min(1, sceneElapsedSec / 0.35);
  const camZoom = 1.0 + Math.sin(tSec * 0.7) * 0.018 + (1 - popEase) * 0.04;
  const impactShake =
    phase === "TAPI" && sceneElapsedSec < 0.45 ? Math.sin(tSec * 65) * 6 * (1 - sceneElapsedSec / 0.45) : 0;

  ctx.save();
  ctx.translate(W / 2 + impactShake, H * 0.48);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-W / 2, -H * 0.48);

  // 1. Consistent Bright Cozy Environment
  drawSettingBackground(ctx, W, H, visual.setting, tSec);

  // 2. Consistent Expressive Human Character performing the actual step!
  const humanY = visual.setting === "backyard" || visual.setting === "farm" ? 310 : 378;
  drawCartoonHuman(ctx, W / 2, humanY, visual.workerAction, visual.setting, visual.ingredientOrTool, tSec);

  // 3. Detailed Hands-On Experiment Props (Curated Preset OR Gemini 2.5D Choreography!)
  const propY = 515;
  if (visual.useCustomStage && Array.isArray(visual.stageParts) && visual.stageParts.length > 0) {
    drawGeminiStageParts(ctx, W / 2, propY, visual, phase, tSec);
  } else if (visual.heroObject === "ice_cream") {
    drawIceCreamProps(ctx, W / 2, propY, visual, phase, tSec);
  } else if (
    visual.heroObject === "betta_fish" ||
    visual.heroObject === "arowana_fish" ||
    visual.heroObject === "ornamental_fish" ||
    visual.heroObject === "catfish"
  ) {
    drawAquariumProps(ctx, W / 2, propY, visual, phase, sceneNum, tSec);
  } else if (visual.heroObject === "fan_blades") {
    drawFanMotorProps(ctx, W / 2, propY, visual, phase, sceneNum, tSec);
  } else if (Array.isArray(visual.stageParts) && visual.stageParts.length > 0) {
    drawGeminiStageParts(ctx, W / 2, propY, visual, phase, tSec);
  } else {
    drawUniversalHandsOnProps(ctx, W / 2, propY, visual, phase, tSec);
  }

  // 3B. Gemini Particle FX, Live Science Meter & Comic Sound Burst
  drawSceneFx(ctx, W / 2, propY, visual.fx, tSec);
  drawScienceMeter(ctx, visual.meter, phase, tSec);
  drawComicBurstText(ctx, W, visual.comicText, phase, tSec, sceneElapsedSec);

  // 4. Floating Indonesian Callout Tags with Leader Pointers (@untabiru5 style!)
  drawFloatingCallouts(ctx, W, visual, phase, tSec);

  // 5. Confetti Burst on CLIMAX ("SELAMAT!")
  if (phase === "CLIMAX" || (Array.isArray(visual.fx) && visual.fx.includes("confetti"))) {
    drawCelebrationConfetti(ctx, W, tSec);
  }

  ctx.restore();
}
