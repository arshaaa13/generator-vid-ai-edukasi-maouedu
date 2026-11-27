// MaouEdu 3D Video World Engine v3 (Three.js WebGL)
// High-Craft @untabiru5 x @dhotscliper 3D Diorama Storytelling + Gemini Composite 3D Prefab Compiler!
// Features extruded slotted stator + copper windings, stone-tiled cutaway pond + fish drop shadows,
// curved golden rice paddy ditch + palm + flag, beveled Blender-style geometry, and 10+ composite prefabs.

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// ============================================================================
// 1. PROCEDURAL TEXTURES & BEVELED GEOMETRY HELPERS
// ============================================================================
function createBrickTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#e2d5c1";
  g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) {
    const off = (r % 2) * 32;
    for (let col = -1; col <= 4; col++) {
      g.fillStyle = (r + col) % 2 === 0 ? "#b8432e" : "#9e3624";
      g.fillRect(col * 64 + off + 3, r * 32 + 3, 58, 26);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

function createTileTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#e2e8f0";
  g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 4; col++) {
      g.fillStyle = (r + col) % 2 === 0 ? "#fef3c7" : "#fffbeb";
      g.fillRect(col * 64 + 3, r * 64 + 3, 58, 58);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2.5);
  return tex;
}

function createWoodTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#cc803c";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 6) {
    g.fillStyle = y % 18 === 0 ? "rgba(88, 38, 10, 0.25)" : "rgba(255, 224, 178, 0.14)";
    g.fillRect(0, y, 256, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createSoilTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#8a562e";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 115; i++) {
    g.fillStyle = i % 3 === 0 ? "#5c3619" : i % 3 === 1 ? "#a86f42" : "#d6ab7c";
    g.beginPath();
    g.arc((i * 53) % 256, (i * 97) % 256, 3 + (i % 6), 0, Math.PI * 2);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

function createWireMeshTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 128, 128);
  g.strokeStyle = "#18181b";
  g.lineWidth = 4;
  for (let i = 0; i <= 128; i += 12) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 128);
    g.moveTo(0, i);
    g.lineTo(128, i);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 2);
  return tex;
}

function createStingraySpotTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#334155";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 46; i++) {
    const x = 16 + ((i * 53) % 224);
    const y = 16 + ((i * 89) % 224);
    const r = 5 + (i % 5);
    g.fillStyle = "#fef3c7";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

function createArowanaScaleTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#dc2626";
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = "#fca5a5";
  g.lineWidth = 3;
  for (let y = 8; y < 128; y += 18) {
    const off = ((y / 18) % 2) * 12;
    for (let x = -12; x < 268; x += 24) {
      g.beginPath();
      g.arc(x + off, y, 11, -Math.PI * 0.45, Math.PI * 0.45);
      g.stroke();
    }
  }
  return new THREE.CanvasTexture(c);
}

function createSolarGridTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#0f172a";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#38bdf8";
  g.lineWidth = 4;
  for (let x = 32; x < 256; x += 32) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 256);
    g.stroke();
  }
  for (let y = 32; y < 256; y += 32) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(256, y);
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function createCapacitorLabelTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#f8fafc";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#1d4ed8";
  g.fillRect(16, 38, 224, 96);
  g.fillStyle = "#ffffff";
  g.font = "900 54px sans-serif";
  g.textAlign = "center";
  g.fillText("1,5 µF", 128, 102);
  g.fillStyle = "#0f172a";
  g.font = "700 30px monospace";
  g.fillText("450V~ AC", 128, 188);
  return new THREE.CanvasTexture(c);
}

// MaouEdu Sovereign Signature: Dark Obsidian Cutting-Mat Blueprint Grid (@xirooo4k x Overlord War Room!)
function createBlueprintGridTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#121a2b";
  g.fillRect(0, 0, 512, 512);

  // Subtle radial vignette glow
  if (typeof g.createRadialGradient === "function") {
    const rad = g.createRadialGradient(256, 256, 24, 256, 256, 280);
    rad.addColorStop(0, "rgba(245, 158, 11, 0.22)");
    rad.addColorStop(0.55, "rgba(56, 189, 248, 0.14)");
    rad.addColorStop(1, "rgba(9, 10, 15, 0.35)");
    g.fillStyle = rad;
    g.fillRect(0, 0, 512, 512);
  }

  // Minor grid lines (bright tactical cyan blueprint)
  g.strokeStyle = "rgba(56, 189, 248, 0.52)";
  g.lineWidth = 2.6;
  for (let i = 0; i <= 512; i += 32) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(512, i);
    g.stroke();
  }

  // Major grid lines (warm amber gold registration lines)
  g.strokeStyle = "rgba(245, 158, 11, 0.78)";
  g.lineWidth = 4.2;
  for (let i = 0; i <= 512; i += 128) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(512, i);
    g.stroke();
  }

  // Framing corners + precision ruler ticks
  g.strokeStyle = "#f59e0b";
  g.lineWidth = 8;
  if (typeof g.strokeRect === "function") g.strokeRect(8, 8, 496, 496);
  g.fillStyle = "rgba(253, 224, 71, 0.92)";
  g.font = "900 18px monospace";
  g.fillText("MAOUEDU // OVERLORD LAB 04", 22, 34);
  g.fillText("SCALE 1:12", 386, 488);
  const bTex = new THREE.CanvasTexture(c);
  if (typeof THREE.RepeatWrapping !== "undefined") {
    bTex.wrapS = THREE.RepeatWrapping;
    bTex.wrapT = THREE.RepeatWrapping;
  }
  return bTex;
}

// Hazard Tape Trim Texture (@untabiru5 x @anatomibenda construction diorama borders!)
function createWarningStripeTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#111827";
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = "#f59e0b";
  for (let x = -64; x < 320; x += 48) {
    g.beginPath();
    g.moveTo(x, 64);
    g.lineTo(x + 24, 64);
    g.lineTo(x + 56, 0);
    g.lineTo(x + 32, 0);
    if (typeof g.closePath === "function") g.closePath();
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  return tex;
}

// Crisp 3D Placard Texture (@kapten.arsitek x @xirooo4k dimensional labels inside WebGL!)
function createCalloutLabelTexture(text = "550°C", accentHex = "#f59e0b") {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = "#0b0f19";
  g.fillRect(0, 0, 256, 96);
  g.strokeStyle = accentHex;
  g.lineWidth = 8;
  if (typeof g.strokeRect === "function") g.strokeRect(4, 4, 248, 88);
  g.fillStyle = accentHex;
  g.fillRect(4, 4, 14, 88);
  g.fillStyle = "#f8fafc";
  g.font = "900 30px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const display = String(text || "")
    .replace(/µ|μ/g, "__MU__")
    .toUpperCase()
    .replace(/__MU__/g, "µ")
    .slice(0, 18);
  g.fillText(display, 134, 49, 212);
  return new THREE.CanvasTexture(c);
}

// @dekodaid x @xirooo4k Stylized Ink-Edge Silhouette Outliner (safe under mocks & real WebGL!)
function applyInkOutline(root, colorHex = 0x090a0f, thresholdDeg = 28) {
  if (!root || typeof THREE.EdgesGeometry !== "function" || typeof THREE.LineSegments !== "function") return;
  const edgeMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.72 });
  const toAttach = [];
  root.traverse((ch) => {
    if (!ch || !ch.isMesh || !ch.geometry || ch.userData?.noOutline) return;
    if (ch.material?.transparent || (ch.material?.opacity ?? 1) < 0.92) return;
    const gType = ch.geometry.type || "";
    if (/SphereGeometry|PlaneGeometry/i.test(gType)) return;
    if (!ch.geometry.attributes?.position) return;
    toAttach.push(ch);
  });
  for (const m of toAttach) {
    try {
      const edges = new THREE.EdgesGeometry(m.geometry, thresholdDeg);
      const lines = new THREE.LineSegments(edges, edgeMat.clone());
      lines.userData = { isInkOutline: true };
      m.add(lines);
    } catch { }
  }
}

// Sovereign Obsidian & Brushed-Gold Diorama Plinth Rim (@xirooo4k x MaouEdu Ciri Khas!)
function addSovereignPlinth(group, w = 5.4, d = 3.2, yTop = 0.0, accentHex = 0xf59e0b, hazardTex = null) {
  const rimH = 0.14;
  const plinth = new THREE.Mesh(
    createRoundedBoxGeometry(w, rimH, d, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.45, roughness: 0.48 })
  );
  plinth.position.set(0, yTop - rimH / 2 - 0.01, 0.05);
  plinth.receiveShadow = true;
  group.add(plinth);

  // Perimeter gold trim strip + optional hazard strip on front cutaway bevel
  const frontBarMat = hazardTex
    ? new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.55 })
    : new THREE.MeshStandardMaterial({ color: accentHex, metalness: 0.65, roughness: 0.3 });
  const frontBar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.045, 0.05), frontBarMat);
  frontBar.position.set(0, yTop - 0.03, 0.05 + d / 2 + 0.01);
  group.add(frontBar);

  const goldMat = new THREE.MeshStandardMaterial({ color: accentHex, metalness: 0.78, roughness: 0.25 });
  [[-w / 2 + 0.12, 0.05 - d / 2 + 0.12], [w / 2 - 0.12, 0.05 - d / 2 + 0.12], [-w / 2 + 0.12, 0.05 + d / 2 - 0.12], [w / 2 - 0.12, 0.05 + d / 2 - 0.12]].forEach(([cx, cz]) => {
    const corner = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.24), goldMat);
    corner.position.set(cx, yTop + 0.005, cz);
    group.add(corner);
  });
}

// Smooth Blender-Style Rounded Bevel Box Geometry
function createRoundedBoxGeometry(w = 1, h = 1, d = 1, r = 0.08) {
  const rad = Math.min(r, w * 0.28, h * 0.28, d * 0.28);
  if (typeof THREE.Shape !== "function" || typeof THREE.ExtrudeGeometry !== "function") {
    return new THREE.BoxGeometry(w, h, d);
  }
  const shape = new THREE.Shape();
  const hw = Math.max(0.02, w / 2 - rad);
  const hh = Math.max(0.02, h / 2 - rad);
  shape.moveTo(-hw, -hh - rad);
  shape.lineTo(hw, -hh - rad);
  shape.quadraticCurveTo(hw + rad, -hh - rad, hw + rad, -hh);
  shape.lineTo(hw + rad, hh);
  shape.quadraticCurveTo(hw + rad, hh + rad, hw, hh + rad);
  shape.lineTo(-hw, hh + rad);
  shape.quadraticCurveTo(-hw - rad, hh + rad, -hw - rad, hh);
  shape.lineTo(-hw - rad, -hh);
  shape.quadraticCurveTo(-hw - rad, -hh - rad, -hw, -hh - rad);

  const depth = Math.max(0.02, d - rad * 2);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: rad,
    bevelThickness: rad
  });
  geom.translate(0, 0, -depth / 2);
  return geom;
}

function easeOutBack(x) {
  const t = Math.max(0, Math.min(1, x));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ============================================================================
// 2. ARTICULATED 3D "IPUL" CHARACTER (@untabiru5 & @dhotscliper Style!)
// ============================================================================
function createHumanWorkerRig() {
  const root = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xebb68c, roughness: 0.48 });
  const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.5 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.65 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.75 });

  const hips = new THREE.Group();
  hips.position.y = 0.68;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.36, 10, 16), hoodieMat);
  torso.position.y = 0.32;
  torso.castShadow = true;
  hips.add(torso);

  // Cute white vertical shirt buttons (matches dhotscliper ref_3.jpg!)
  const btnGroup = new THREE.Group();
  const btnMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  [0.44, 0.32, 0.2].forEach((by) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), btnMat);
    b.position.set(0, by, 0.235);
    btnGroup.add(b);
  });
  hips.add(btnGroup);

  const head = new THREE.Group();
  head.position.y = 0.72;
  hips.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.235, 20, 18), skinMat);
  skull.castShadow = true;
  head.add(skull);

  const hairTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.242, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54),
    hairMat
  );
  hairTop.position.y = 0.025;
  head.add(hairTop);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMat);
  lEye.position.set(-0.075, 0.02, 0.215);
  head.add(lEye);
  const rEye = lEye.clone();
  rEye.position.x = 0.075;
  head.add(rEye);

  // @dhotscliper Yellow Farmer Caping Hat with crisp dark outline rim!
  const capingGroup = new THREE.Group();
  const capingCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.58, 0.24, 24),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 })
  );
  capingCone.castShadow = true;
  capingGroup.add(capingCone);
  const capingRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.018, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0x141824 })
  );
  capingRim.rotation.x = Math.PI / 2;
  capingRim.position.y = -0.11;
  capingGroup.add(capingRim);
  capingGroup.position.set(0, 0.22, 0);
  capingGroup.visible = false;
  head.add(capingGroup);

  // Chef Hat
  const chefHat = new THREE.Group();
  const chefBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.16, 14),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 })
  );
  chefBase.position.y = 0.22;
  chefHat.add(chefBase);
  const chefPuff = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 })
  );
  chefPuff.position.y = 0.34;
  chefHat.add(chefPuff);
  chefHat.visible = false;
  head.add(chefHat);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.11, 0.02, 0);
  hips.add(leftLeg);
  const llMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.38, 6, 10), pantsMat);
  llMesh.position.y = -0.28;
  leftLeg.add(llMesh);
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.22), shoeMat);
  lShoe.position.set(0, -0.55, 0.05);
  leftLeg.add(lShoe);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.11, 0.02, 0);
  hips.add(rightLeg);
  const rlMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.38, 6, 10), pantsMat);
  rlMesh.position.y = -0.28;
  rightLeg.add(rlMesh);
  const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.22), shoeMat);
  rShoe.position.set(0, -0.55, 0.05);
  rightLeg.add(rShoe);

  // Tactile Spherical Hands & Arms (exact ref_2.jpg silhouette!)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 0.46, 0);
  hips.add(leftArm);
  const laMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.32, 6, 10), hoodieMat);
  laMesh.position.y = -0.19;
  laMesh.castShadow = true;
  leftArm.add(laMesh);
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 14), skinMat);
  lHand.position.y = -0.4;
  lHand.castShadow = true;
  leftArm.add(lHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 0.46, 0);
  hips.add(rightArm);
  const raMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.32, 6, 10), hoodieMat);
  raMesh.position.y = -0.19;
  raMesh.castShadow = true;
  rightArm.add(raMesh);
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 14), skinMat);
  rHand.position.y = -0.4;
  rHand.castShadow = true;
  rightArm.add(rHand);

  // Switchable Bamboo Scoop / Blowtorch Group
  const toolGroup = new THREE.Group();
  toolGroup.position.set(0, -0.4, 0.06);
  rightArm.add(toolGroup);
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 })
  );
  stick.position.y = -0.28;
  stick.rotation.x = 0.42;
  toolGroup.add(stick);

  const basketRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.022, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x18181b })
  );
  basketRim.position.set(0, -0.68, -0.18);
  basketRim.rotation.x = Math.PI / 2;
  basketRim.visible = false;
  toolGroup.add(basketRim);

  const flameTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.16, 8),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  flameTip.position.set(0, -0.66, -0.16);
  flameTip.rotation.x = Math.PI + 0.45;
  flameTip.visible = false;
  toolGroup.add(flameTip);

  return {
    root,
    hips,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    toolGroup,
    basketRim,
    flameTip,
    capingHat: capingGroup,
    chefHat
  };
}

// ============================================================================
// 3. DETAILED 3D FISH (+ DROP SHADOW), RICE STALK, PALM, GEAR, FAN, COIL
// ============================================================================
function createFishMesh(species = "arowana", colorHex = "#ef4444", scaleTex = null) {
  const g = new THREE.Group();
  const baseColor = new THREE.Color(colorHex || (species === "betta" ? "#2563eb" : "#ef4444"));

  // Grounding Soft Shadow Oval beneath every fish (ref_1.jpg!)
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 16),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.22 })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.scale.set(1.5, 0.65, 1);

  if (species === "betta") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.25, metalness: 0.2 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), bodyMat);
    body.scale.set(1.45, 0.62, 0.42);
    g.add(body);

    const finMat = new THREE.MeshPhysicalMaterial({
      color: baseColor.clone().lerp(new THREE.Color("#f43f5e"), 0.35),
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      roughness: 0.2
    });
    const tail = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16, -Math.PI * 0.45, Math.PI * 0.9), finMat);
    tail.position.set(-0.2, 0, 0);
    tail.rotation.y = Math.PI;
    g.add(tail);

    const dorsal = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12, 0, Math.PI), finMat);
    dorsal.position.set(-0.04, 0.09, 0);
    g.add(dorsal);

    const anal = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12, Math.PI, Math.PI), finMat);
    anal.position.set(-0.06, -0.08, 0);
    g.add(anal);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
    e1.position.set(0.17, 0.03, 0.055);
    g.add(e1);
    const e2 = e1.clone();
    e2.position.z = -0.055;
    g.add(e2);
    return { group: g, tail, shadowDisc };
  }

  // Sculpted Scaled Arowana / Orange Carp (matches ref_1.jpg & ref_3.jpg!)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: species === "orange_fish" ? 0xf97316 : baseColor,
    map: species === "arowana" && scaleTex ? scaleTex : null,
    roughness: 0.26,
    metalness: 0.2
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 14), bodyMat);
  body.scale.set(species === "arowana" ? 1.95 : 1.4, 0.46, 0.3);
  body.castShadow = true;
  g.add(body);

  const finMat = new THREE.MeshStandardMaterial({
    color: species === "orange_fish" ? 0xfb923c : 0xf43f5e,
    roughness: 0.35,
    side: THREE.DoubleSide
  });
  const tail = new THREE.Mesh(new THREE.CircleGeometry(0.145, 10, -Math.PI * 0.42, Math.PI * 0.84), finMat);
  tail.position.set(species === "arowana" ? -0.43 : -0.31, 0, 0);
  tail.rotation.y = Math.PI;
  g.add(tail);

  if (species === "arowana") {
    const dorsalLong = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.02), finMat);
    dorsalLong.position.set(-0.22, 0.09, 0);
    dorsalLong.rotation.z = 0.08;
    g.add(dorsalLong);
    const analLong = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.02), finMat);
    analLong.position.set(-0.22, -0.08, 0);
    g.add(analLong);

    // Classic Arowana Mouth Whisker Barbels!
    const barbelMat = new THREE.MeshBasicMaterial({ color: 0x7f1d1d });
    [-0.03, 0.03].forEach((bz) => {
      const barb = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.09, 5), barbelMat);
      barb.position.set(0.41, 0.01, bz);
      barb.rotation.z = -1.1;
      g.add(barb);
    });
  }

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), eyeMat);
  e1.position.set(species === "arowana" ? 0.31 : 0.21, 0.03, 0.058);
  g.add(e1);
  const e2 = e1.clone();
  e2.position.z = -0.058;
  g.add(e2);
  return { group: g, tail, shadowDisc };
}

function createGoldenRicePlant() {
  const g = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.7 });
  const grainMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 });
  for (let b = 0; b < 3; b++) {
    const offX = (b - 1) * 0.06;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.024, 0.92, 6), stemMat);
    stem.position.set(offX, 0.46, (b % 2) * 0.04);
    g.add(stem);
    // Curved golden drooping grain head at top (ref_3.jpg!)
    const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.26, 4, 8), grainMat);
    head.position.set(offX + 0.06, 0.96, (b % 2) * 0.04);
    head.rotation.z = -0.58 + b * 0.14;
    g.add(head);
  }
  return g;
}

function createCoconutPalm(x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, 1.9 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
  );
  trunk.position.y = 0.95 * scale;
  trunk.rotation.z = 0.08;
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65, side: THREE.DoubleSide });
  for (let f = 0; f < 6; f++) {
    const ang = (f / 6) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.24 * scale, 1.05 * scale, 4), leafMat);
    frond.position.set(Math.cos(ang) * 0.45 * scale, 1.85 * scale, Math.sin(ang) * 0.45 * scale);
    frond.rotation.z = -1.25;
    frond.rotation.y = -ang;
    g.add(frond);
  }
  g.position.set(x, 0, z);
  return g;
}

function buildGearMesh(radius = 0.3, teeth = 8, color = "#f59e0b", metallic = true) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: metallic ? 0.65 : 0.15,
    roughness: metallic ? 0.28 : 0.45
  });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.14, 20), mat);
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  g.add(disc);
  for (let i = 0; i < teeth; i++) {
    const ang = (i / teeth) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.32, radius * 0.28, 0.15), mat);
    tooth.position.set(Math.cos(ang) * (radius + radius * 0.14), Math.sin(ang) * (radius + radius * 0.14), 0);
    tooth.rotation.z = ang;
    g.add(tooth);
  }
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.32, radius * 0.32, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 })
  );
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  return g;
}

function buildFanMesh(radius = 0.45, blades = 3, color = "#38bdf8") {
  const g = new THREE.Group();
  const bladeMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.88,
    roughness: 0.18
  });
  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.22, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
  );
  g.add(hub);
  for (let i = 0; i < blades; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i * Math.PI * 2) / blades;
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.34, radius * 0.16, radius * 0.88, 10), bladeMat);
    blade.scale.set(1, 1, 0.14);
    blade.position.set(0, radius * 0.54, 0.04);
    blade.rotation.y = 0.28;
    blade.castShadow = true;
    pivot.add(blade);
    g.add(pivot);
  }
  return g;
}

function buildHelixCoilMesh(radius = 0.35, h = 0.65, turns = 5, tube = 0.04, color = "#38bdf8", glow = false) {
  const pts = [];
  const steps = turns * 18;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const ang = u * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(ang) * radius, (u - 0.5) * h, Math.sin(ang) * radius));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geom = new THREE.TubeGeometry(curve, steps, tube, 8, false);
  const c = new THREE.Color(color);
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    emissive: glow ? c.clone().multiplyScalar(0.55) : new THREE.Color(0x000000),
    metalness: 0.45,
    roughness: 0.28
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  return mesh;
}

function buildCurvedTube(from, to, radius = 0.04, color = "#64748b", glow = false) {
  const p0 = new THREE.Vector3(from[0], from[1], from[2]);
  const p2 = new THREE.Vector3(to[0], to[1], to[2]);
  const mid = new THREE.Vector3((p0.x + p2.x) / 2, Math.max(p0.y, p2.y) + 0.16, (p0.z + p2.z) / 2 + 0.08);
  const curve = new THREE.CatmullRomCurve3([p0, mid, p2]);
  const geom = new THREE.TubeGeometry(curve, 16, radius, 8, false);
  const c = new THREE.Color(color);
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    emissive: glow ? c.clone().multiplyScalar(0.45) : new THREE.Color(0x000000),
    metalness: 0.45,
    roughness: 0.3
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  return mesh;
}

function createStingrayMesh(spotTex, scale = 1, bellyAlert = false) {
  const g = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({
    map: spotTex,
    color: bellyAlert ? 0xf87171 : 0xffffff,
    roughness: 0.35
  });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.14, 18), topMat);
  disc.scale.set(1.22, 0.46, 1.05);
  disc.castShadow = true;
  g.add(disc);

  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 8),
    new THREE.MeshStandardMaterial({ color: bellyAlert ? 0xfca5a5 : 0xfef3c7, roughness: 0.5 })
  );
  belly.scale.set(1.1, 0.16, 0.95);
  belly.position.y = -0.028;
  g.add(belly);

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.52), topMat);
  leftWing.position.set(-0.34, 0.01, 0);
  g.add(leftWing);
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.52), topMat);
  rightWing.position.set(0.34, 0.01, 0);
  g.add(rightWing);

  const tail = new THREE.Group();
  tail.position.set(-0.4, 0, 0);
  const tailRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.035, 0.58, 8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
  );
  tailRod.rotation.z = Math.PI / 2;
  tailRod.position.x = -0.26;
  tail.add(tailRod);

  const spineTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.042, 0.16, 8),
    new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0x9f1239 })
  );
  spineTip.rotation.z = Math.PI / 2;
  spineTip.position.set(-0.36, 0.035, 0);
  spineTip.visible = false;
  tail.add(spineTip);
  g.add(tail);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  [-0.085, 0.085].forEach((ez) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeMat);
    eye.position.set(0.18, 0.045, ez);
    g.add(eye);
  });

  g.scale.setScalar(scale);
  return { group: g, leftWing, rightWing, tail, spineTip };
}

function createCamelMascot() {
  const g = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.34, 8, 12), coat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.46;
  body.castShadow = true;
  g.add(body);

  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), coat);
  hump.position.set(-0.02, 0.62, 0);
  g.add(hump);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.38, 8), coat);
  neck.position.set(0.26, 0.68, 0);
  neck.rotation.z = -0.35;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), coat);
  head.scale.set(1.25, 0.9, 0.85);
  head.position.set(0.36, 0.86, 0);
  g.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeMat);
  eye.position.set(0.42, 0.88, 0.085);
  g.add(eye);

  [[-0.14, 0.09], [-0.14, -0.09], [0.14, 0.09], [0.14, -0.09]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.44, 6), coat);
    leg.position.set(lx, 0.22, lz);
    g.add(leg);
  });
  return g;
}

function createFilterSumpMesh(w = 1.0, h = 0.68, d = 0.72, accentColor = "#0ea5e9") {
  const g = new THREE.Group();
  const boxMat = new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.34, roughness: 0.1 });
  const tank = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMat);
  g.add(tank);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: 0x0284c7 })));

  // 2 Internal Chamber Baffles
  const baffleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
  [-w * 0.17, w * 0.17].forEach((bx) => {
    const baf = new THREE.Mesh(new THREE.BoxGeometry(0.03, h * 0.82, d - 0.05), baffleMat);
    baf.position.set(bx, -h * 0.05, 0);
    g.add(baf);
  });

  // Chamber 1: Filter Brushes
  const brushMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  [-0.16, 0, 0.16].forEach((bz) => {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, h * 0.68, 8), brushMat);
    br.position.set(-w * 0.33, 0, bz);
    g.add(br);
  });

  // Chamber 2: Stacked Blue & Yellow Foam Sponges
  const spBlue = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.25, h * 0.28, d * 0.78),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.9 })
  );
  spBlue.position.set(0, -h * 0.18, 0);
  g.add(spBlue);
  const spYellow = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.25, h * 0.22, d * 0.78),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.9 })
  );
  spYellow.position.set(0, h * 0.1, 0);
  g.add(spYellow);

  // Chamber 3: Bio-bacteria Media + Submersible Pump
  const pump = new THREE.Mesh(
    createRoundedBoxGeometry(w * 0.22, h * 0.28, d * 0.45, 0.03),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(accentColor), roughness: 0.35 })
  );
  pump.position.set(w * 0.34, -h * 0.26, 0);
  g.add(pump);

  const bioSpheres = [];
  const bioMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0x10b981, emissiveIntensity: 0.4 });
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), bioMat);
    sp.position.set(w * 0.33 + ((i % 2) - 0.5) * 0.12, -0.05 + Math.floor(i / 2) * 0.1, ((i % 3) - 1) * 0.12);
    g.add(sp);
    bioSpheres.push({ mesh: sp, baseY: sp.position.y, seed: i * 1.1 });
  }
  g.userData.bioSpheres = bioSpheres;
  return g;
}

function createTurbineGenMesh(radius = 0.42, blades = 8, color = "#e2e8f0", glowing = true) {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.35 });
  const base = new THREE.Mesh(createRoundedBoxGeometry(radius * 2.6, 0.14, radius * 1.4, 0.03), frameMat);
  base.position.y = -radius * 0.95;
  base.castShadow = true;
  g.add(base);

  const rotor = buildFanMesh(radius * 0.92, Math.max(6, blades), color);
  rotor.position.set(-radius * 0.65, 0, 0);
  rotor.rotation.y = Math.PI / 2;
  g.add(rotor);

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, radius * 1.7, 12),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
  );
  shaft.rotation.z = Math.PI / 2;
  g.add(shaft);

  const genBody = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, radius * 0.95, 18),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.55, roughness: 0.3 })
  );
  genBody.rotation.z = Math.PI / 2;
  genBody.position.set(radius * 0.55, 0, 0);
  genBody.castShadow = true;
  g.add(genBody);

  const terminal = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 10, 10),
    new THREE.MeshStandardMaterial({
      color: glowing ? 0xfde047 : 0x64748b,
      emissive: glowing ? 0xf59e0b : 0x000000
    })
  );
  terminal.position.set(radius * 0.65, radius * 0.66, 0);
  g.add(terminal);

  g.userData.spinChild = rotor;
  return g;
}

function createMinerRigMesh(w = 0.88, h = 0.68, d = 0.58, color = "#475569", immersed = false) {
  const g = new THREE.Group();
  const chassis = new THREE.Mesh(
    createRoundedBoxGeometry(w, h, d, 0.05),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(color), metalness: 0.65, roughness: 0.35 })
  );
  chassis.castShadow = true;
  g.add(chassis);

  const topBoard = new THREE.Mesh(
    createRoundedBoxGeometry(w * 0.72, 0.08, d * 0.65, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
  );
  topBoard.position.y = h / 2 + 0.04;
  g.add(topBoard);

  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshBasicMaterial({ color: immersed ? 0x10b981 : 0xef4444 })
  );
  led.position.set(w * 0.34, h * 0.28, d / 2 + 0.02);
  g.add(led);

  const spinFans = [];
  [-w * 0.22, w * 0.22].forEach((fx) => {
    const fan = buildFanMesh(Math.min(w, h) * 0.28, 4, "#0f172a");
    fan.position.set(fx, -0.02, d / 2 + 0.025);
    g.add(fan);
    spinFans.push(fan);
  });
  g.userData.spinFans = spinFans;

  if (immersed) {
    const vat = new THREE.Mesh(
      new THREE.BoxGeometry(w * 1.38, h * 1.38, d * 1.45),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.32, roughness: 0.08 })
    );
    g.add(vat);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w * 1.38, h * 1.38, d * 1.45)), new THREE.LineBasicMaterial({ color: 0xe0f2fe })));
  }
  return g;
}

function createSoundRingsMesh(radius = 0.75, rings = 4, color = "#ef4444") {
  const g = new THREE.Group();
  const c = new THREE.Color(color);
  const ringMeshes = [];
  for (let i = 0; i < rings; i++) {
    const r = radius * (0.4 + (i / rings) * 0.7);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.024, 8, 28),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85 - i * 0.15 })
    );
    ring.position.z = i * 0.06;
    g.add(ring);
    ringMeshes.push({ mesh: ring, idx: i });
  }
  g.userData.ringMeshes = ringMeshes;
  return g;
}

function createRebarPitMesh(w = 1.15, h = 0.5, d = 0.85) {
  const g = new THREE.Group();
  const plankMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.78 });
  const rebarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.35 });

  const concrete = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.08, 0.08, d - 0.08),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 })
  );
  concrete.position.y = -h * 0.42;
  g.add(concrete);

  [-w / 2, w / 2].forEach((px) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, d), plankMat);
    wall.position.x = px;
    g.add(wall);
  });
  [-d / 2, d / 2].forEach((pz) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), plankMat);
    wall.position.z = pz;
    g.add(wall);
  });

  for (let i = -2; i <= 2; i++) {
    const barX = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, w * 0.88, 6), rebarMat);
    barX.rotation.z = Math.PI / 2;
    barX.position.set(0, -h * 0.28, (i / 2.5) * (d * 0.45));
    g.add(barX);

    const barZ = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, d * 0.88, 6), rebarMat);
    barZ.rotation.x = Math.PI / 2;
    barZ.position.set((i / 2.5) * (w * 0.45), -h * 0.25, 0);
    g.add(barZ);
  }
  return g;
}

function createThermalPlatesMesh(w = 1.55, d = 1.05, heated = false, color = "#64748b") {
  const g = new THREE.Group();
  const tankUnder = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.96, 0.14, d * 0.96),
    new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: heated ? 0x7c2d12 : 0x451a03, roughness: 0.4 })
  );
  tankUnder.position.y = -0.05;
  g.add(tankUnder);

  const tiles = [];
  const tw = w * 0.28;
  const td = d * 0.28;
  const tileMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(heated ? "#fb923c" : color),
    emissive: heated ? new THREE.Color(0x9a3412) : new THREE.Color(0x000000),
    metalness: 0.72,
    roughness: 0.28
  });

  for (let r = -1; r <= 1; r++) {
    for (let c = -1; c <= 1; c++) {
      const tile = new THREE.Mesh(createRoundedBoxGeometry(tw, 0.09, td, 0.015), tileMat);
      const gap = heated ? 1.02 : 1.18;
      tile.position.set(c * tw * gap, 0.07, r * td * gap);
      tile.castShadow = true;
      g.add(tile);
      tiles.push({ mesh: tile, col: c, row: r, tw, td });
    }
  }
  g.userData.tiles = tiles;
  g.userData.heated = heated;
  return g;
}

function createAircraftJetMesh(color = "#1e293b", heated = false) {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: heated ? new THREE.Color(0x7c2d12) : new THREE.Color(0x000000),
    metalness: 0.55,
    roughness: 0.35
  });

  const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.16, 2.25, 10), hullMat);
  fuselage.rotation.z = -Math.PI / 2;
  fuselage.scale.set(1, 1, 0.55);
  fuselage.castShadow = true;
  g.add(fuselage);

  const cockpit = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.1, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  cockpit.position.set(0.42, 0.08, 0);
  g.add(cockpit);

  const deltaWing = new THREE.Mesh(new THREE.ConeGeometry(0.88, 1.55, 3), hullMat);
  deltaWing.rotation.z = -Math.PI / 2;
  deltaWing.scale.set(0.08, 1, 1.25);
  deltaWing.position.set(-0.22, -0.02, 0);
  deltaWing.castShadow = true;
  g.add(deltaWing);

  [-0.36, 0.36].forEach((ez) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 1.05, 12), hullMat);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(-0.32, 0.01, ez);
    g.add(pod);

    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.03), hullMat);
    fin.position.set(-0.68, 0.14, ez * 0.92);
    fin.rotation.x = ez > 0 ? 0.25 : -0.25;
    g.add(fin);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.095, heated ? 0.55 : 0.18, 10),
      new THREE.MeshBasicMaterial({ color: heated ? 0xf97316 : 0x64748b })
    );
    flame.rotation.z = Math.PI / 2;
    flame.position.set(heated ? -1.05 : -0.88, 0.01, ez);
    g.add(flame);
  });

  // Landing gear legs
  [[-0.3, -0.2, 0.26], [-0.3, -0.2, -0.26], [0.55, -0.2, 0]].forEach(([gx, gy, gz]) => {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    strut.position.set(gx, gy + 0.06, gz);
    g.add(strut);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(gx, gy - 0.06, gz);
    g.add(wheel);
  });

  return g;
}

// ============================================================================
// 3B. VT SYNTHESIS PREFABS (@kapten.arsitek, @xirooo4k, @dekodaid)
// ============================================================================
function createVectorArrowsMesh(from = [-0.6, 0.5, 0], to = [0.6, 0.5, 0], count = 3, color = "#ef4444", size = 0.14, speed = 1.8) {
  const g = new THREE.Group();
  const c = new THREE.Color(color);
  const f = new THREE.Vector3(from[0] ?? -0.6, from[1] ?? 0.5, from[2] ?? 0);
  const t = new THREE.Vector3(to[0] ?? 0.6, to[1] ?? 0.5, to[2] ?? 0);
  const dir = new THREE.Vector3(t.x - f.x, t.y - f.y, t.z - f.z);
  const len = Math.max(0.2, Math.hypot(dir.x, dir.y, dir.z));
  const arrows = [];
  const mat = new THREE.MeshStandardMaterial({
    color: c,
    emissive: c.clone().multiplyScalar(0.55),
    roughness: 0.25,
    metalness: 0.2
  });

  for (let i = 0; i < count; i++) {
    const unit = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.16, size * 0.16, size * 1.15, 8), mat);
    shaft.position.y = -size * 0.45;
    unit.add(shaft);
    const head = new THREE.Mesh(new THREE.ConeGeometry(size * 0.42, size * 0.72, 10), mat);
    head.position.y = size * 0.36;
    unit.add(head);

    if (typeof THREE.Quaternion === "function" && typeof THREE.Vector3 === "function") {
      const nDir = new THREE.Vector3(dir.x / len, dir.y / len, dir.z / len);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), nDir);
      unit.quaternion?.copy(q);
    } else {
      unit.rotation.z = -Math.atan2(dir.x, dir.y);
    }
    g.add(unit);
    arrows.push({ mesh: unit, tOffset: i / Math.max(1, count) });
  }
  g.userData.vectorArrows = { from: f, to: t, speed, arrows };
  return g;
}

function createSpotlightConeMesh(radius = 0.65, h = 1.65, color = "#fde047") {
  const g = new THREE.Group();
  const c = new THREE.Color(color);
  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.22, radius * 0.3, 0.16, 14),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.75, roughness: 0.3 })
  );
  head.position.y = h / 2 + 0.06;
  g.add(head);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, 0.04, 12),
    new THREE.MeshBasicMaterial({ color: c })
  );
  lens.position.y = h / 2 - 0.02;
  g.add(lens);

  const coneMat = new THREE.MeshBasicMaterial({
    color: c,
    transparent: true,
    opacity: 0.19,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.14, radius, h, 20, 1, true), coneMat);
  cone.userData.noOutline = true;
  g.add(cone);

  const floorDisc = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.92, 0.026, 8, 28),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85 })
  );
  floorDisc.rotation.x = Math.PI / 2;
  floorDisc.position.y = -h / 2 + 0.02;
  floorDisc.userData.noOutline = true;
  g.add(floorDisc);

  g.userData.spotlightCone = { cone, coneMat, floorDisc };
  return g;
}

function createExplodeStackMesh(w = 1.15, d = 0.85, layers = 4, baseColor = "#38bdf8", accentColor = "#f59e0b", explodeAmount = 0.28) {
  const g = new THREE.Group();
  const count = Math.max(2, Math.min(5, layers || 4));
  const palette = ["#1e293b", accentColor, baseColor, "#0f172a", "#94a3b8"];
  const stackLayers = [];

  for (let i = 0; i < count; i++) {
    const layer = new THREE.Group();
    const isHeatFin = i === count - 2 && count >= 3;
    const isTopShroud = i === count - 1;
    const lw = w * (isTopShroud ? 0.98 : 0.82 + i * 0.04);
    const ld = d * (isTopShroud ? 0.96 : 0.8 + i * 0.04);
    const lh = i === 0 ? 0.09 : 0.07;

    const plate = new THREE.Mesh(
      createRoundedBoxGeometry(lw, lh, ld, 0.02),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette[i % palette.length]),
        metalness: i === 1 || isHeatFin ? 0.65 : 0.25,
        roughness: 0.34,
        emissive: i === 1 ? new THREE.Color(accentColor).multiplyScalar(0.25) : new THREE.Color(0x000000)
      })
    );
    plate.castShadow = true;
    layer.add(plate);

    if (isHeatFin) {
      for (let f = -3; f <= 3; f++) {
        const fin = new THREE.Mesh(
          new THREE.BoxGeometry(lw * 0.9, 0.07, 0.025),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.22 })
        );
        fin.position.set(0, 0.06, f * (ld * 0.11));
        layer.add(fin);
      }
    }
    if (isTopShroud) {
      const fan = buildFanMesh(Math.min(lw, ld) * 0.34, 4, accentColor);
      fan.rotation.x = -Math.PI / 2;
      fan.position.y = 0.055;
      layer.add(fan);
      g.userData.spinChild = fan;
    }

    const baseLocalY = (i - (count - 1) / 2) * 0.11;
    layer.position.y = baseLocalY;
    g.add(layer);
    stackLayers.push({ mesh: layer, baseLocalY, idx: i });
  }

  // Vertical guide rails showing assembly axis (@xirooo4k CAD look!)
  const railMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.45 });
  [[-w * 0.46, -d * 0.44], [w * 0.46, -d * 0.44], [-w * 0.46, d * 0.44], [w * 0.46, d * 0.44]].forEach(([rx, rz]) => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, count * (explodeAmount + 0.12), 6), railMat);
    rail.userData.noOutline = true;
    rail.position.set(rx, 0.18, rz);
    g.add(rail);
  });

  g.userData.explodeStack = { layers: stackLayers, explodeAmount };
  return g;
}

function createCalloutPinMesh(h = 0.8, label = "500°C", color = "#f59e0b") {
  const g = new THREE.Group();
  const c = new THREE.Color(color);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, h, 8),
    new THREE.MeshBasicMaterial({ color: c })
  );
  stem.position.y = h / 2;
  stem.userData.noOutline = true;
  g.add(stem);

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 10),
    new THREE.MeshBasicMaterial({ color: c })
  );
  dot.position.y = 0.02;
  g.add(dot);

  const tex = createCalloutLabelTexture(label, color);
  const placard = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.28, 0.045),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.1 })
  );
  placard.position.set(0, h + 0.14, 0);
  g.add(placard);
  g.userData.calloutPin = { placard, baseY: h + 0.14 };
  return g;
}

// ============================================================================
// 4. MAIN MAOU 3D DIORAMA STAGE v4 (MaouEdu Sovereign 3D Overlord Studio)
// ============================================================================
export class Maou3DStage {
  constructor(width = 540, height = 960) {
    this.width = width;
    this.height = height;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfff7ed);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 80);
    this.camera.position.set(0.28, 1.38, 2.75);
    this.cameraTarget = new THREE.Vector3(0, 0.28, 0.0);
    this.camPosGoal = new THREE.Vector3(0.28, 1.38, 2.75);
    this.camLookGoal = new THREE.Vector3(0, 0.28, 0.0);
    this.lastCamSceneKey = "";

    const hemi = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.18);
    this.scene.add(hemi);
    this.hemiLight = hemi;

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.65);
    sun.position.set(3.8, 7.2, 4.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 20;
    sun.shadow.camera.left = -3.8;
    sun.shadow.camera.right = 3.8;
    sun.shadow.camera.top = 3.8;
    sun.shadow.camera.bottom = -3.8;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);
    this.sunLight = sun;

    const fill = new THREE.DirectionalLight(0xbae6fd, 0.52);
    fill.position.set(-4, 3.5, 2.5);
    this.scene.add(fill);
    this.fillLight = fill;

    // Overlord Back-Rim Accent Light (warm gold or crimson phase separation!)
    const rim = new THREE.DirectionalLight(0xf59e0b, 0.85);
    rim.position.set(-2.6, 4.2, -4.2);
    this.scene.add(rim);
    this.rimLight = rim;

    this.brickTex = createBrickTexture();
    this.tileTex = createTileTexture();
    this.woodTex = createWoodTexture();
    this.soilTex = createSoilTexture();
    this.meshFenceTex = createWireMeshTexture();
    this.stingrayTex = createStingraySpotTexture();
    this.arowanaTex = createArowanaScaleTexture();
    this.solarTex = createSolarGridTexture();
    this.capTex = createCapacitorLabelTexture();
    this.blueprintTex = createBlueprintGridTexture();
    this.hazardTex = createWarningStripeTexture();

    this.worker = createHumanWorkerRig();
    this.worker.root.position.set(0.0, 0.0, -0.92);
    this.scene.add(this.worker.root);

    this.dioramaGroup = new THREE.Group();
    this.scene.add(this.dioramaGroup);

    this.activeKey = "";
    this.dioramaParts = {};
    this.customNodes = [];
    this.customFlows = [];
    this.customParticles = [];
    this.customVectors = [];
  }

  get domElement() {
    return this.renderer.domElement;
  }

  clearDiorama() {
    this.dioramaGroup.traverse((child) => {
      if (child.isMesh || child.isLineSegments) {
        if (child.geometry) child.geometry.dispose?.();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose?.());
        else child.material?.dispose?.();
      }
    });
    while (this.dioramaGroup.children.length > 0) {
      this.dioramaGroup.remove(this.dioramaGroup.children[0]);
    }
    this.dioramaParts = {};
    this.customNodes = [];
    this.customFlows = [];
    this.customParticles = [];
    this.customVectors = [];
  }

  // Unified MaouEdu Sovereign Diorama Environments (Surface aligned cleanly at Y = 0.0!)
  buildEnvironmentStage(envType, skyMode = "day") {
    this.applySkyLighting(skyMode);

    if (envType === "house_bunker") {
      // Multi-story cutaway House + Underground Subterranean Bunker!
      const soilCutaway = new THREE.Mesh(
        new THREE.BoxGeometry(8.6, 2.0, 5.2),
        new THREE.MeshStandardMaterial({ map: this.soilTex, roughness: 0.92 })
      );
      soilCutaway.position.set(0, -1.04, -0.6);
      soilCutaway.receiveShadow = true;
      this.dioramaGroup.add(soilCutaway);

      // Left & Right Green Front Lawns flanking concrete bunker opening
      const lawnMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8 });
      [-2.85, 2.85].forEach((lx) => {
        const lawn = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.14, 5.4), lawnMat);
        lawn.position.set(lx, -0.04, -0.4);
        this.dioramaGroup.add(lawn);
      });

      // Subterranean Concrete Bunker Box Cutaway (y = -1.52..-0.12, front open)
      const bunkerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.72 });
      const bunkerBack = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.38, 0.16), bunkerMat);
      bunkerBack.position.set(0, -0.82, -1.25);
      this.dioramaGroup.add(bunkerBack);
      const bunkerFloor = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 2.3), bunkerMat);
      bunkerFloor.position.set(0, -1.48, -0.18);
      bunkerFloor.receiveShadow = true;
      this.dioramaGroup.add(bunkerFloor);
      [-1.65, 1.65].forEach((bx) => {
        const bSide = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.38, 1.45), bunkerMat);
        bSide.position.set(bx, -0.82, -0.58);
        this.dioramaGroup.add(bSide);
      });

      // Vertical Yellow Steel Access Ladder into Bunker
      const ladderMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
      [-1.42, -1.16].forEach((lx) => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.48, 6), ladderMat);
        rail.position.set(lx, -0.76, 0.35);
        this.dioramaGroup.add(rail);
      });
      for (let r = 0; r < 6; r++) {
        const rung = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.03), ladderMat);
        rung.position.set(-1.29, -1.3 + r * 0.22, 0.35);
        this.dioramaGroup.add(rung);
      }

      // Ground-Floor Cozy Bedroom Cutaway (y = 0.0..1.48)
      const houseBack = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 1.52, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 })
      );
      houseBack.position.set(0, 0.76, -1.25);
      houseBack.receiveShadow = true;
      applyInkOutline(houseBack, 0x1e293b, 30);
      this.dioramaGroup.add(houseBack);

      const floorSlab = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.12, 2.4),
        new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.5 })
      );
      floorSlab.position.set(0, -0.02, -0.15);
      floorSlab.receiveShadow = true;
      this.dioramaGroup.add(floorSlab);

      [-1.74, 1.74].forEach((wx) => {
        const sideW = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 1.52, 1.48),
          new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.7 })
        );
        sideW.position.set(wx, 0.76, -0.58);
        applyInkOutline(sideW, 0x1e293b, 30);
        this.dioramaGroup.add(sideW);
      });

      // Red Pitched Roof (supports Solar Panels on right slope!)
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 });
      const leftSlope = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 2.65), roofMat);
      leftSlope.position.set(-0.95, 1.85, -0.15);
      leftSlope.rotation.z = 0.44;
      applyInkOutline(leftSlope, 0x0f172a, 28);
      this.dioramaGroup.add(leftSlope);
      const rightSlope = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 2.65), roofMat);
      rightSlope.position.set(0.95, 1.85, -0.15);
      rightSlope.rotation.z = -0.44;
      applyInkOutline(rightSlope, 0x0f172a, 28);
      this.dioramaGroup.add(rightSlope);

      // Bed Prop on left side of upstairs bedroom
      const bedFrame = new THREE.Mesh(
        createRoundedBoxGeometry(0.85, 0.24, 0.75, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
      );
      bedFrame.position.set(-1.12, 0.16, -0.55);
      applyInkOutline(bedFrame);
      this.dioramaGroup.add(bedFrame);
      const mattress = new THREE.Mesh(
        createRoundedBoxGeometry(0.78, 0.14, 0.68, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.6 })
      );
      mattress.position.set(-1.12, 0.31, -0.55);
      this.dioramaGroup.add(mattress);

      // Ceiling Light Bulbs (toggled ON/OFF by power scenes!)
      const roomBulbMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfbbf24, emissiveIntensity: 0.8 });
      const upperBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), roomBulbMat);
      upperBulb.position.set(0, 1.38, -0.3);
      this.dioramaGroup.add(upperBulb);
      const lowerBulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), roomBulbMat);
      lowerBulb.position.set(0, -0.22, -0.3);
      this.dioramaGroup.add(lowerBulb);
      this.dioramaParts.roomBulbMat = roomBulbMat;

      // Sovereign Collector Bedrock Trim + Hazard Cutaway Lip
      addSovereignPlinth(this.dioramaGroup, 8.75, 5.25, -2.02, 0xf59e0b, this.hazardTex);
    } else if (envType === "runway_tarmac") {
      // Airport Tarmac Runway + Hills + Hangar (@dekodaid SR-71!)
      const runway = new THREE.Mesh(
        new THREE.BoxGeometry(9.5, 0.3, 4.6),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.82 })
      );
      runway.position.set(0, -0.15, 0.2);
      runway.receiveShadow = true;
      this.dioramaGroup.add(runway);

      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      for (let sx = -3.6; sx <= 3.6; sx += 1.2) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.12), stripeMat);
        dash.position.set(sx, 0.01, 0.2);
        this.dioramaGroup.add(dash);
      }

      const grassStrip = new THREE.Mesh(
        new THREE.BoxGeometry(10.5, 0.25, 3.6),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.85 })
      );
      grassStrip.position.set(0, -0.14, -3.5);
      this.dioramaGroup.add(grassStrip);

      // Hangar Building + Control Tower
      const hangar = new THREE.Mesh(
        createRoundedBoxGeometry(1.9, 1.05, 1.3, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 })
      );
      hangar.position.set(-2.1, 0.52, -3.4);
      applyInkOutline(hangar);
      this.dioramaGroup.add(hangar);

      const towerStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.24, 1.85, 10),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
      );
      towerStem.position.set(2.25, 0.92, -3.6);
      applyInkOutline(towerStem);
      this.dioramaGroup.add(towerStem);
      const towerCab = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.32, 0.38, 12),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3 })
      );
      towerCab.position.set(2.25, 1.95, -3.6);
      applyInkOutline(towerCab);
      this.dioramaGroup.add(towerCab);

      addSovereignPlinth(this.dioramaGroup, 9.6, 4.7, -0.26, 0x38bdf8, this.hazardTex);
    } else if (envType === "kitchen_tile") {
      if (skyMode === "day") {
        this.scene.background = new THREE.Color(0xfff7ed);
        this.scene.fog = new THREE.FogExp2(0xfff7ed, 0.02);
      }

      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(8.5, 4.8, 0.25),
        new THREE.MeshStandardMaterial({ map: this.tileTex, roughness: 0.55 })
      );
      wall.position.set(0, 1.9, -2.25);
      wall.receiveShadow = true;
      this.dioramaGroup.add(wall);

      const windowGlass = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 1.5, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xbae6fd })
      );
      windowGlass.position.set(-1.6, 1.75, -2.1);
      this.dioramaGroup.add(windowGlass);

      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(7.6, 0.7, 4.2),
        new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.48 })
      );
      counter.position.set(0, -0.35, 0.15);
      counter.receiveShadow = true;
      this.dioramaGroup.add(counter);

      // MaouEdu Overlord Blueprint Cutting-Mat Inlay on foreground prep surface
      const prepMat = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.018, 2.35),
        new THREE.MeshStandardMaterial({
          map: this.blueprintTex,
          emissiveMap: this.blueprintTex,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.42,
          roughness: 0.38,
          metalness: 0.12
        })
      );
      prepMat.position.set(0, 0.032, 0.05);
      prepMat.receiveShadow = true;
      this.dioramaGroup.add(prepMat);
      addSovereignPlinth(this.dioramaGroup, 4.1, 2.55, 0.0, 0xf59e0b, null);
    } else if (envType === "backyard_cutaway") {
      if (skyMode === "day") {
        this.scene.background = new THREE.Color(0xbae6fd);
        this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.018);
      }

      const soilBlock = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 1.25, 6.2),
        new THREE.MeshStandardMaterial({ map: this.soilTex, roughness: 0.9 })
      );
      soilBlock.position.set(0, -0.66, 0.2);
      soilBlock.receiveShadow = true;
      this.dioramaGroup.add(soilBlock);

      // @anatomibenda Lower Clay/Bedrock Cutaway Strata + Hazard Construction Trim
      const strataClay = new THREE.Mesh(
        new THREE.BoxGeometry(8.26, 0.36, 6.26),
        new THREE.MeshStandardMaterial({ color: 0x572e18, roughness: 0.95 })
      );
      strataClay.position.set(0, -1.08, 0.2);
      this.dioramaGroup.add(strataClay);

      const grassLawn = new THREE.Mesh(
        new THREE.BoxGeometry(8.3, 0.08, 6.3),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.78 })
      );
      grassLawn.position.set(0, -0.02, 0.2);
      grassLawn.receiveShadow = true;
      this.dioramaGroup.add(grassLawn);

      const houseWall = new THREE.Mesh(
        new THREE.BoxGeometry(7.8, 3.3, 0.35),
        new THREE.MeshStandardMaterial({ map: this.brickTex, roughness: 0.8 })
      );
      houseWall.position.set(0, 1.55, -2.6);
      this.dioramaGroup.add(houseWall);

      addSovereignPlinth(this.dioramaGroup, 8.45, 6.45, -1.24, 0xf59e0b, this.hazardTex);
    } else if (envType === "farm_trench") {
      if (skyMode === "day") {
        this.scene.background = new THREE.Color(0x7dd3fc);
        this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.02);
      }

      const soilBase = new THREE.Mesh(
        new THREE.BoxGeometry(9.0, 0.8, 8.5),
        new THREE.MeshStandardMaterial({ map: this.soilTex, roughness: 0.9 })
      );
      soilBase.position.set(0, -0.75, -1.0);
      soilBase.receiveShadow = true;
      this.dioramaGroup.add(soilBase);

      const bankMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8 });
      [-1.55, 1.55].forEach((bx) => {
        const bank = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.38, 7.6), bankMat);
        bank.position.set(bx, -0.15, -0.6);
        bank.receiveShadow = true;
        this.dioramaGroup.add(bank);
      });

      const hutBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.7, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 })
      );
      hutBody.position.set(-1.65, 0.35, -4.1);
      applyInkOutline(hutBody);
      this.dioramaGroup.add(hutBody);
      const hutRoof = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 0.55, 4),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
      );
      hutRoof.position.set(-1.65, 0.96, -4.1);
      hutRoof.rotation.y = Math.PI / 4;
      applyInkOutline(hutRoof);
      this.dioramaGroup.add(hutRoof);

      this.dioramaGroup.add(createCoconutPalm(-0.1, -4.6, 1.25));
      this.dioramaGroup.add(createCoconutPalm(1.75, -4.2, 1.05));

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.9, 6),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
      );
      pole.position.set(-1.05, 0.95, -4.4);
      this.dioramaGroup.add(pole);
      const flagRed = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.02), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      flagRed.position.set(-0.83, 1.76, -4.4);
      this.dioramaGroup.add(flagRed);
      const flagWhite = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      flagWhite.position.set(-0.83, 1.62, -4.4);
      this.dioramaGroup.add(flagWhite);
    } else if (envType === "outdoor_sky") {
      if (skyMode === "day") {
        this.scene.background = new THREE.Color(0x93c5fd);
        this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.02);
      }
      const lawn = new THREE.Mesh(
        new THREE.BoxGeometry(9.0, 0.7, 7.0),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8 })
      );
      lawn.position.set(0, -0.35, 0);
      lawn.receiveShadow = true;
      this.dioramaGroup.add(lawn);
      addSovereignPlinth(this.dioramaGroup, 5.2, 3.2, 0.0, 0xf59e0b, this.hazardTex);
    } else {
      // Flagship Default Stage: MaouEdu Overlord Obsidian-Gold Cutting Mat x Warm Workbench (@xirooo4k x @untabiru5!)
      if (skyMode === "day") {
        this.scene.background = new THREE.Color(0x131926);
        this.scene.fog = new THREE.FogExp2(0x131926, 0.025);
      }

      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(8.8, 5.2, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78 })
      );
      backWall.position.set(0, 2.0, -2.35);
      backWall.receiveShadow = true;
      this.dioramaGroup.add(backWall);

      // Architectural Pegboard + Illuminated Accent Rails on back wall (@xirooo4k x MaouEdu!)
      const pegPanel = new THREE.Mesh(
        createRoundedBoxGeometry(4.8, 2.45, 0.08, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.3, roughness: 0.55 })
      );
      pegPanel.position.set(0, 1.35, -2.18);
      applyInkOutline(pegPanel, 0xf59e0b, 35);
      this.dioramaGroup.add(pegPanel);

      const ledBarTop = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.05, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      ledBarTop.position.set(0, 2.42, -2.12);
      this.dioramaGroup.add(ledBarTop);

      const cyanShelf = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.06, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x0284c7, emissiveIntensity: 0.35 })
      );
      cyanShelf.position.set(-0.7, 1.82, -2.02);
      this.dioramaGroup.add(cyanShelf);

      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(7.8, 0.72, 4.4),
        new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.48 })
      );
      desk.position.set(0, -0.37, 0.15);
      desk.receiveShadow = true;
      this.dioramaGroup.add(desk);

      // Centered Dark-Obsidian Cutting-Mat Blueprint Grid Pad (sits cleanly above beveled plinth!)
      const cutMat = new THREE.Mesh(
        new THREE.BoxGeometry(4.36, 0.018, 2.56),
        new THREE.MeshStandardMaterial({
          map: this.blueprintTex,
          emissiveMap: this.blueprintTex,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.45,
          roughness: 0.38,
          metalness: 0.12
        })
      );
      cutMat.position.set(0, 0.032, 0.05);
      cutMat.receiveShadow = true;
      this.dioramaGroup.add(cutMat);

      addSovereignPlinth(this.dioramaGroup, 4.65, 2.85, 0.0, 0xf59e0b, this.hazardTex);
    }
  }

  applySkyLighting(skyMode = "day") {
    if (skyMode === "night") {
      this.scene.background = new THREE.Color(0x0b0f1a);
      this.scene.fog = new THREE.FogExp2(0x0b0f1a, 0.022);
      if (this.hemiLight) this.hemiLight.intensity = 0.72;
      if (this.sunLight) {
        this.sunLight.color.setHex(0x93c5fd);
        this.sunLight.intensity = 0.92;
      }
      if (this.fillLight) this.fillLight.intensity = 0.52;
      if (this.rimLight) {
        this.rimLight.color.setHex(0x38bdf8);
        this.rimLight.intensity = 1.15;
      }
      const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      for (let i = 0; i < 16; i++) {
        const star = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), starMat);
        star.position.set(-3.2 + ((i * 1.1) % 6.4), 2.4 + ((i * 0.7) % 1.8), -3.8);
        this.dioramaGroup.add(star);
      }
    } else if (skyMode === "heat_alert") {
      this.scene.background = new THREE.Color(0x450a0a);
      this.scene.fog = new THREE.FogExp2(0x7c2d12, 0.026);
      if (this.hemiLight) this.hemiLight.intensity = 1.1;
      if (this.sunLight) {
        this.sunLight.color.setHex(0xfb923c);
        this.sunLight.intensity = 1.85;
      }
      if (this.fillLight) this.fillLight.intensity = 0.52;
      if (this.rimLight) {
        this.rimLight.color.setHex(0xf43f5e);
        this.rimLight.intensity = 1.45;
      }
    } else {
      this.scene.background = new THREE.Color(0xbae6fd);
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.018);
      if (this.hemiLight) this.hemiLight.intensity = 1.18;
      if (this.sunLight) {
        this.sunLight.color.setHex(0xfffbeb);
        this.sunLight.intensity = 1.65;
      }
      if (this.fillLight) this.fillLight.intensity = 0.58;
      if (this.rimLight) {
        this.rimLight.color.setHex(0xf59e0b);
        this.rimLight.intensity = 0.85;
      }
    }
  }

  // ============================================================================
  // 5. CURATED @UNTABIRU5 / @DHOTSCLIPER WORLDS + GEMINI COMPOSITE 3D COMPILER
  // ============================================================================
  buildDiorama(worldKey, scene, cleanTopic) {
    if (this.activeKey === worldKey) return;
    this.activeKey = worldKey;
    this.clearDiorama();

    const visual = scene?.visual || {};
    const phase = scene?.phase || "HOOK";
    const hero = visual.heroObject || "custom_stage";
    const s3d = visual.stage3d || {};
    const envType =
      s3d.environment ||
      (hero === "ice_cream"
        ? "kitchen_tile"
        : hero === "betta_fish"
          ? "wood_desk"
          : hero === "arowana_fish"
            ? visual.setting === "aquarium"
              ? "wood_desk"
              : "backyard_cutaway"
            : hero === "stingray_pond"
              ? "backyard_cutaway"
              : hero === "bitcoin_bunker"
                ? "house_bunker"
                : hero === "supersonic_jet"
                  ? "runway_tarmac"
                  : hero === "rice_fish"
                    ? "farm_trench"
                    : hero === "rocket"
                      ? "outdoor_sky"
                      : "wood_desk");

    const skyMode = s3d.skyMode || "day";
    this.buildEnvironmentStage(envType, skyMode);

    this.worker.capingHat.visible = envType === "farm_trench";
    this.worker.chefHat.visible = envType === "kitchen_tile";

    // A. CUSTOM GEMINI 3D SCENE COMPILER (FOR ANY TOPIC!)
    if (
      hero === "custom_stage" ||
      (Array.isArray(s3d.objects) &&
        s3d.objects.length >= 2 &&
        hero !== "ice_cream" &&
        hero !== "betta_fish" &&
        hero !== "arowana_fish" &&
        hero !== "fan_blades" &&
        hero !== "rice_fish" &&
        hero !== "stingray_pond" &&
        hero !== "bitcoin_bunker" &&
        hero !== "supersonic_jet")
    ) {
      this.buildGeminiCustomObjects(s3d.objects || []);
      return;
    }

    // B. CURATED ES KRIM KITCHEN DIORAMA
    if (hero === "ice_cream") {
      const station = new THREE.Group();
      this.dioramaGroup.add(station);

      const bucket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 0.78, 0.62, 24),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3 })
      );
      bucket.position.y = 0.31;
      bucket.castShadow = true;
      station.add(bucket);
      this.dioramaParts.iceBucket = bucket;

      const iceGroup = new THREE.Group();
      const iceMat = new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.88, roughness: 0.1 });
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), iceMat);
        cube.position.set(Math.cos(ang) * 0.74, 0.6, Math.sin(ang) * 0.74);
        cube.rotation.set(i * 0.4, i * 0.7, 0.3);
        iceGroup.add(cube);
      }
      station.add(iceGroup);
      this.dioramaParts.iceGroup = iceGroup;

      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.66, 0.46, 0.56, 24),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.78, roughness: 0.22 })
      );
      bowl.position.y = 0.38;
      bowl.castShadow = true;
      station.add(bowl);

      const mixMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(visual.accentColor || "#f9a8d4"),
        roughness: 0.24
      });
      const mixSurface = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 22), mixMat);
      mixSurface.position.y = 0.64;
      station.add(mixSurface);
      this.dioramaParts.mixMat = mixMat;

      const hardIceGroup = new THREE.Group();
      const spikeMat = new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, roughness: 0.12, transparent: true, opacity: 0.92 });
      for (let s = 0; s < 9; s++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.46, 5), spikeMat);
        const ang = (s / 9) * Math.PI * 2;
        spike.position.set(Math.cos(ang) * 0.28, 0.82, Math.sin(ang) * 0.28);
        spike.rotation.set((s % 2 - 0.5) * 0.35, s, (s % 3 - 1) * 0.3);
        hardIceGroup.add(spike);
      }
      station.add(hardIceGroup);
      this.dioramaParts.hardIceGroup = hardIceGroup;

      const whiskGroup = new THREE.Group();
      whiskGroup.position.set(0, 0.9, 0);
      const whiskShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.68, 10),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
      );
      whiskShaft.position.y = 0.22;
      whiskGroup.add(whiskShaft);
      for (let w = 0; w < 4; w++) {
        const loop = new THREE.Mesh(
          new THREE.TorusGeometry(0.16, 0.015, 6, 16),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
        );
        loop.rotation.y = (w * Math.PI) / 4;
        loop.position.y = -0.12;
        whiskGroup.add(loop);
      }
      station.add(whiskGroup);
      this.dioramaParts.whiskGroup = whiskGroup;

      const conesGroup = new THREE.Group();
      const scoopColors = [0xf472b6, 0xfef3c7, 0x34d399];
      [-0.68, 0, 0.68].forEach((cx, idx) => {
        const coneWrap = new THREE.Group();
        coneWrap.position.set(cx, 0.52, 0.25);
        const waffle = new THREE.Mesh(
          new THREE.ConeGeometry(0.21, 0.6, 14),
          new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.72 })
        );
        waffle.rotation.x = Math.PI;
        waffle.position.y = -0.14;
        waffle.castShadow = true;
        coneWrap.add(waffle);

        const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 14), new THREE.MeshStandardMaterial({ color: scoopColors[idx], roughness: 0.28 }));
        s1.position.y = 0.24;
        s1.castShadow = true;
        coneWrap.add(s1);

        const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), new THREE.MeshStandardMaterial({ color: scoopColors[(idx + 1) % 3], roughness: 0.28 }));
        s2.position.y = 0.52;
        coneWrap.add(s2);

        const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.15 }));
        cherry.position.y = 0.73;
        coneWrap.add(cherry);
        conesGroup.add(coneWrap);
      });
      station.add(conesGroup);
      this.dioramaParts.conesGroup = conesGroup;

      const coldArrows = createVectorArrowsMesh([-0.55, 0.55, 0.25], [-0.88, 0.85, 0.25], 2, "#38bdf8", 0.11, 1.8);
      station.add(coldArrows);
      this.dioramaParts.iceColdArrows = coldArrows;
      this.dioramaParts.curatedVectors = [coldArrows];
      applyInkOutline(station);
      return;
    }

    // C. CURATED KIPAS ANGIN & SLOTTED COPPER STATOR DIORAMA (Exact ref_2.jpg x @kapten.arsitek!)
    if (hero === "fan_blades") {
      const motorGroup = new THREE.Group();
      motorGroup.position.set(0, 0.72, 0.1);
      this.dioramaGroup.add(motorGroup);
      this.dioramaParts.motorGroup = motorGroup;

      // Wooden Cradle Mount resting flush on oak workbench
      const stand = new THREE.Mesh(
        createRoundedBoxGeometry(0.96, 0.24, 0.58, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.72 })
      );
      stand.position.set(0, -0.6, 0);
      stand.castShadow = true;
      motorGroup.add(stand);

      // Multi-lamination Gray Steel Outer Stator Barrel (ref_2.jpg!)
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.65, roughness: 0.34, side: THREE.DoubleSide });
      const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.32 });
      for (let slice = -2; slice <= 2; slice++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.11, 10, 32), slice % 2 === 0 ? steelMat : darkSteelMat);
        ring.position.z = slice * 0.085;
        ring.castShadow = true;
        motorGroup.add(ring);
      }

      // 16 Radial Inner Steel Stator Teeth + Continuous Enameled Orange Copper Windings!
      const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.72, roughness: 0.22 });
      for (let t = 0; t < 16; t++) {
        const ang = (t / 16) * Math.PI * 2;
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.22, 0.44), darkSteelMat);
        tooth.position.set(Math.cos(ang) * 0.44, Math.sin(ang) * 0.44, 0);
        tooth.rotation.z = ang + Math.PI / 2;
        motorGroup.add(tooth);
      }
      // Front & Back Copper Coil Torus Loops weaving smoothly around teeth!
      [-0.22, 0.22].forEach((cz) => {
        const copperRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 12, 32), copperMat);
        copperRing.position.z = cz;
        copperRing.castShadow = true;
        motorGroup.add(copperRing);
      });

      // Power Cord + White Wall Plug on Left Desk (visible on left of ref_2.jpg!)
      const plug = new THREE.Mesh(
        createRoundedBoxGeometry(0.24, 0.22, 0.24, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
      );
      plug.position.set(-1.12, -0.6, 0.18);
      motorGroup.add(plug);
      motorGroup.add(buildCurvedTube([-0.4, -0.45, -0.15], [-1.05, -0.6, 0.12], 0.025, "#18181b", false));

      // Central Shaft & 3-Blade Propeller (Hidden on HOOK empty stator scenes 1-2, spins in CLIMAX!)
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.72, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
      );
      shaft.rotation.x = Math.PI / 2;
      shaft.position.z = 0.08;
      motorGroup.add(shaft);
      this.dioramaParts.shaft = shaft;

      const rotorPivot = buildFanMesh(0.58, 3, visual.accentColor || "#38bdf8");
      rotorPivot.position.z = 0.36;
      motorGroup.add(rotorPivot);
      this.dioramaParts.rotorPivot = rotorPivot;

      // Crisp 1.5 uF Capacitor Box on right side!
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.52, 0.32),
        new THREE.MeshStandardMaterial({ map: this.capTex, roughness: 0.35 })
      );
      cap.position.set(1.08, -0.46, 0.18);
      cap.castShadow = true;
      motorGroup.add(cap);
      this.dioramaParts.capacitor = cap;

      const capPin = createCalloutPinMesh(0.48, "1,5 µF TORSI", "#f59e0b");
      capPin.position.set(1.08, -0.18, 0.18);
      motorGroup.add(capPin);

      const torqueArrows = createVectorArrowsMesh([1.05, -0.05, 0.2], [0.22, 0.15, 0.2], 3, "#38bdf8", 0.11, 2.0);
      motorGroup.add(torqueArrows);
      this.dioramaParts.torqueArrows = torqueArrows;
      this.dioramaParts.curatedVectors = [torqueArrows];

      applyInkOutline(motorGroup);
      return;
    }

    // D. CURATED ARWANA POND / CUPANG AQUARIUM DIORAMA (Exact ref_1.jpg!)
    if (hero === "arowana_fish" || hero === "betta_fish" || hero === "ornamental_fish" || hero === "catfish") {
      const isCupang = hero === "betta_fish";
      const isPond = envType === "backyard_cutaway";

      const tankGroup = new THREE.Group();
      this.dioramaGroup.add(tankGroup);

      const tw = isCupang ? 1.85 : 2.35;
      const th = isCupang ? 1.1 : 1.0;
      const td = isCupang ? 1.15 : 1.35;

      if (isPond) {
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 });
        const wallH = 0.44;
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(tw + 0.16, wallH, 0.12), concreteMat);
        backWall.position.set(0, wallH / 2 + 0.02, -td / 2 - 0.02);
        tankGroup.add(backWall);
        [-tw / 2 - 0.02, tw / 2 + 0.02].forEach((wx) => {
          const sw = new THREE.Mesh(new THREE.BoxGeometry(0.12, wallH, td + 0.08), concreteMat);
          sw.position.set(wx, wallH / 2 + 0.02, 0);
          tankGroup.add(sw);
        });

        // Segmented Cream Stone Tile Coping Rim around Pond (ref_1.jpg!)
        const tileMat = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.65 });
        for (let tx = -tw / 2; tx <= tw / 2; tx += 0.28) {
          const stoneBack = new THREE.Mesh(createRoundedBoxGeometry(0.25, 0.09, 0.18, 0.02), tileMat);
          stoneBack.position.set(tx, wallH + 0.04, -td / 2 - 0.04);
          stoneBack.castShadow = true;
          tankGroup.add(stoneBack);
        }
        for (let tz = -td / 2; tz <= td / 2; tz += 0.28) {
          [-tw / 2 - 0.06, tw / 2 + 0.06].forEach((sideX) => {
            const stoneSide = new THREE.Mesh(createRoundedBoxGeometry(0.18, 0.09, 0.25, 0.02), tileMat);
            stoneSide.position.set(sideX, wallH + 0.04, tz);
            stoneSide.castShadow = true;
            tankGroup.add(stoneSide);
          });
        }

        // Wire Mesh Fence + Steel Corner Posts around Rim (ref_1.jpg!)
        const fenceGroup = new THREE.Group();
        const fenceMat = new THREE.MeshBasicMaterial({ map: this.meshFenceTex, transparent: true, side: THREE.DoubleSide });
        const postMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
        const backFence = new THREE.Mesh(new THREE.PlaneGeometry(tw + 0.16, 0.62), fenceMat);
        backFence.position.set(0, wallH + 0.38, -td / 2 - 0.04);
        fenceGroup.add(backFence);
        [-tw / 2 - 0.06, tw / 2 + 0.06].forEach((fx) => {
          const sideFence = new THREE.Mesh(new THREE.PlaneGeometry(td + 0.12, 0.62), fenceMat);
          sideFence.position.set(fx, wallH + 0.38, 0);
          sideFence.rotation.y = Math.PI / 2;
          fenceGroup.add(sideFence);
          [-td / 2, 0, td / 2].forEach((pz) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.68, 6), postMat);
            post.position.set(fx, wallH + 0.4, pz);
            fenceGroup.add(post);
          });
        });
        tankGroup.add(fenceGroup);
        this.dioramaParts.meshFence = fenceGroup;
      }

      const waterYCenter = isPond ? 0.25 : th / 2;
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.38,
        roughness: 0.08
      });
      const water = new THREE.Mesh(new THREE.BoxGeometry(tw - 0.06, isPond ? 0.4 : th - 0.1, td - 0.06), waterMat);
      water.position.y = waterYCenter;
      tankGroup.add(water);
      this.dioramaParts.waterMat = waterMat;

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(tw, isPond ? 0.46 : th, td)),
        new THREE.LineBasicMaterial({ color: 0xe0f2fe })
      );
      edges.position.y = waterYCenter;
      tankGroup.add(edges);

      const floorY = 0.04;
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(tw - 0.04, 0.04, td - 0.04),
        new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9 })
      );
      floor.position.y = floorY;
      floor.receiveShadow = true;
      tankGroup.add(floor);

      // Decorative Smooth River Stones + Dirt Pellets for TAPI
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.85 });
      [[-0.75, -0.35], [-0.45, 0.3], [0.68, 0.22], [0.4, -0.4]].forEach(([sx, sz]) => {
        const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), stoneMat);
        pebble.scale.set(1.3, 0.4, 1.1);
        pebble.position.set(sx, floorY + 0.03, sz);
        tankGroup.add(pebble);
      });

      const ketapangLeaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.02, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
      );
      ketapangLeaf.position.set(-0.42, th - 0.14, 0.18);
      ketapangLeaf.rotation.y = 0.4;
      tankGroup.add(ketapangLeaf);
      this.dioramaParts.ketapangLeaf = ketapangLeaf;

      const divider = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, th - 0.06, td - 0.06),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.68 })
      );
      divider.position.set(0, th / 2, 0);
      tankGroup.add(divider);
      this.dioramaParts.divider = divider;

      const fishes = [];
      const count = isCupang ? 2 : 4;
      for (let i = 0; i < count; i++) {
        const fc = isCupang ? (i === 0 ? "#2563eb" : "#e11d48") : visual.accentColor || "#ef4444";
        const f = createFishMesh(isCupang ? "betta" : "arowana", fc, this.arowanaTex);
        f.group.scale.setScalar(isCupang ? 0.9 : 0.76);
        f.group.position.set((i - 1) * 0.4, waterYCenter + (i % 2) * 0.12, 0);
        tankGroup.add(f.group);
        f.shadowDisc.position.set(f.group.position.x, floorY + 0.026, f.group.position.z);
        tankGroup.add(f.shadowDisc);
        fishes.push({ ...f, seed: i * 1.9, waterYCenter, floorY });
      }
      this.dioramaParts.fishes = fishes;
      this.dioramaParts.isCupang = isCupang;
      return;
    }

    // E. CURATED SAWAH MINAPADI CORRIDOR (Exact ref_3.jpg!)
    if (hero === "rice_fish") {
      const water = new THREE.Mesh(
        new THREE.BoxGeometry(1.18, 0.22, 7.6),
        new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65, roughness: 0.1 })
      );
      water.position.set(0, -0.22, -0.6);
      this.dioramaGroup.add(water);

      // Sloped concrete ditch sides framing central canal (ref_3.jpg!)
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.85 });
      [-0.6, 0.6].forEach((ex) => {
        const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.35, 7.6), edgeMat);
        ledge.position.set(ex, -0.14, -0.6);
        this.dioramaGroup.add(ledge);
      });

      const stalks = [];
      for (let i = 0; i < 40; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const sx = side * (0.78 + ((i * 19) % 8) * 0.16);
        const sz = 2.0 - Math.floor(i / 2) * 0.34;
        const rice = createGoldenRicePlant();
        rice.position.set(sx, 0.02, sz);
        rice.rotation.y = side * 0.3;
        this.dioramaGroup.add(rice);
        stalks.push({ mesh: rice, seed: i * 0.55 });
      }
      this.dioramaParts.stalks = stalks;

      const fishes = [];
      for (let i = 0; i < 10; i++) {
        const f = createFishMesh("orange_fish", "#f97316");
        f.group.scale.setScalar(0.5);
        f.group.position.set((i % 2 === 0 ? -0.22 : 0.22), -0.15, 1.4 - i * 0.42);
        f.group.rotation.y = Math.PI / 2;
        this.dioramaGroup.add(f.group);
        fishes.push({ ...f, seed: i * 1.1 });
      }
      this.dioramaParts.fishes = fishes;
      return;
    }

    // F. CURATED KOLAM IKAN PARI + FILTER 3 SEKAT (@untabiru5!)
    if (hero === "stingray_pond") {
      const pond = new THREE.Group();
      pond.position.set(-0.22, 0, 0);
      this.dioramaGroup.add(pond);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0xb45309, map: this.brickTex, roughness: 0.78 });
      const backW = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.56, 0.14), wallMat);
      backW.position.set(0, 0.28, -0.68);
      pond.add(backW);
      [-1.02, 1.02].forEach((wx) => {
        const sw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.56, 1.42), wallMat);
        sw.position.set(wx, 0.28, 0);
        pond.add(sw);
      });

      const rebarGroup = createRebarPitMesh(1.98, 0.48, 1.24);
      rebarGroup.position.set(0, 0.26, 0);
      pond.add(rebarGroup);
      this.dioramaParts.rebarGroup = rebarGroup;

      const sandBed = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.08, 1.24),
        new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.92 })
      );
      sandBed.position.set(0, 0.06, 0);
      sandBed.receiveShadow = true;
      pond.add(sandBed);
      this.dioramaParts.sandBed = sandBed;

      const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.42, roughness: 0.08 });
      const waterBox = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 1.24), waterMat);
      waterBox.position.set(0, 0.28, 0);
      pond.add(waterBox);
      this.dioramaParts.waterMat = waterMat;
      this.dioramaParts.waterBox = waterBox;

      const filterGroup = new THREE.Group();
      const sump = createFilterSumpMesh(0.92, 0.54, 0.74, "#0ea5e9");
      sump.position.set(1.38, 0.28, -0.05);
      filterGroup.add(sump);
      filterGroup.add(buildCurvedTube([0.72, 0.42, -0.15], [1.02, 0.42, -0.15], 0.04, "#38bdf8", false));
      filterGroup.add(buildCurvedTube([1.15, 0.14, 0.25], [0.68, 0.45, 0.22], 0.035, "#10b981", false));
      this.dioramaGroup.add(filterGroup);
      this.dioramaParts.filterGroup = filterGroup;
      this.dioramaParts.sumpMesh = sump;

      // Camel mascot in background yard!
      const camel = createCamelMascot();
      camel.position.set(-1.35, 0.0, -1.35);
      camel.scale.setScalar(0.85);
      this.dioramaGroup.add(camel);

      const rays = [];
      const bellyAlert = visual.problemVisual === "murky_mud";
      for (let i = 0; i < 2; i++) {
        const ray = createStingrayMesh(this.stingrayTex, 0.66 - i * 0.08, bellyAlert);
        ray.group.position.set(-0.22 + (i - 0.5) * 0.65, 0.18, (i - 0.5) * 0.25);
        pond.add(ray.group);
        rays.push({ ...ray, seed: i * 2.1 });
      }
      this.dioramaParts.stingrays = rays;

      const babyRays = [];
      for (let b = 0; b < 2; b++) {
        const baby = createStingrayMesh(this.stingrayTex, 0.34, false);
        baby.group.position.set(-0.15 + b * 0.48, 0.22, 0.18 - b * 0.25);
        pond.add(baby.group);
        babyRays.push({ ...baby, seed: b * 1.4 + 3.0 });
      }
      this.dioramaParts.babyRays = babyRays;
      return;
    }

    // G. CURATED MINING BITCOIN HOUSE + BUNKER + PLTU MINI (@belajar.iai x MaouEdu!)
    if (hero === "bitcoin_bunker") {
      // Upstairs ASIC miner rig on bedroom desk
      const desk = new THREE.Mesh(
        createRoundedBoxGeometry(0.9, 0.42, 0.55, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 })
      );
      desk.position.set(0.75, 0.21, -0.55);
      applyInkOutline(desk);
      this.dioramaGroup.add(desk);

      const roomMiner = createMinerRigMesh(0.58, 0.46, 0.42, "#475569", false);
      roomMiner.position.set(0.75, 0.66, -0.52);
      applyInkOutline(roomMiner);
      this.dioramaGroup.add(roomMiner);
      this.dioramaParts.roomMiner = roomMiner;

      const soundRings = createSoundRingsMesh(0.62, 4, "#ef4444");
      soundRings.position.set(0.75, 0.72, -0.15);
      this.dioramaGroup.add(soundRings);
      this.dioramaParts.soundRings = soundRings;

      // Bunker Underground Miner + Dielectric Immersion Tank
      const bunkerMiner = createMinerRigMesh(0.68, 0.52, 0.48, "#334155", true);
      bunkerMiner.position.set(-0.55, -1.04, -0.25);
      applyInkOutline(bunkerMiner);
      this.dioramaGroup.add(bunkerMiner);
      this.dioramaParts.bunkerMiner = bunkerMiner;

      // @kapten.arsitek Heat Convection Vector Arrows rising from bunker tank + @xirooo4k Overhead Spotlight
      const heatArrows = createVectorArrowsMesh([-0.55, -1.05, 0.12], [-0.55, -0.25, 0.12], 3, "#f97316", 0.12, 1.9);
      this.dioramaGroup.add(heatArrows);
      this.dioramaParts.heatArrows = heatArrows;
      this.dioramaParts.curatedVectors = [heatArrows];

      const bunkerSpot = createSpotlightConeMesh(0.58, 1.15, "#fde047");
      bunkerSpot.position.set(0.28, -0.78, -0.25);
      this.dioramaGroup.add(bunkerSpot);
      this.dioramaParts.bunkerSpot = bunkerSpot;

      // Rooftop Solar Panels (slope right!)
      const solarGroup = new THREE.Group();
      [-0.55, 0.35].forEach((sz) => {
        const sp = new THREE.Mesh(
          createRoundedBoxGeometry(0.95, 0.06, 0.72, 0.02),
          new THREE.MeshStandardMaterial({ map: this.solarTex, metalness: 0.4, roughness: 0.2 })
        );
        sp.position.set(0.92, 1.98, sz);
        sp.rotation.z = -0.44;
        applyInkOutline(sp);
        solarGroup.add(sp);
      });
      this.dioramaGroup.add(solarGroup);
      this.dioramaParts.solarGroup = solarGroup;

      // PLTU Mini (Orange Heat Exchanger Coil + Steam Turbine Generator + Cooling Pipe!)
      const pltuGroup = new THREE.Group();
      const coil = buildHelixCoilMesh(0.24, 0.56, 5, 0.04, "#f97316", true);
      coil.position.set(0.28, -1.04, -0.25);
      pltuGroup.add(coil);

      const turbine = createTurbineGenMesh(0.32, 8, "#e2e8f0", true);
      turbine.position.set(1.05, -0.82, -0.25);
      applyInkOutline(turbine);
      pltuGroup.add(turbine);
      this.dioramaParts.turbine = turbine;

      // Heat fluid pipe -> turbine & cooling return loop -> tank + power wire up to ceiling!
      pltuGroup.add(buildCurvedTube([-0.15, -1.0, -0.25], [0.22, -1.0, -0.25], 0.038, "#ef4444", true));
      pltuGroup.add(buildCurvedTube([0.28, -0.74, -0.25], [0.85, -0.74, -0.25], 0.036, "#f8fafc", false));
      pltuGroup.add(buildCurvedTube([1.05, -1.16, 0.05], [-0.45, -1.35, 0.15], 0.034, "#38bdf8", false));
      pltuGroup.add(buildCurvedTube([1.22, -0.58, -0.25], [1.45, 1.38, -0.3], 0.024, "#facc15", true));
      this.dioramaGroup.add(pltuGroup);
      this.dioramaParts.pltuGroup = pltuGroup;
      return;
    }

    // H. CURATED SR-71 BLACKBIRD + THERMAL EXPANSION PLATES (@dekodaid x @kapten.arsitek!)
    if (hero === "supersonic_jet") {
      const isHeated = visual.solutionVisual === "afterburner_heat" || visual.solutionVisual === "thermal_expand" || visual.solutionVisual === "sealed_jet" || phase === "CLIMAX";
      const jet = createAircraftJetMesh("#1e293b", isHeated);
      jet.position.set(0, 0.42, -0.1);
      jet.scale.setScalar(1.05);
      applyInkOutline(jet, 0x0f172a, 28);
      this.dioramaGroup.add(jet);
      this.dioramaParts.jet = jet;

      // Aerodynamic shock / thermal expansion 3D vectors & callout pin
      const airArrows = createVectorArrowsMesh([1.25, 0.62, 0.18], [-1.25, 0.48, 0.18], 3, isHeated ? "#f97316" : "#38bdf8", 0.12, 2.4);
      this.dioramaGroup.add(airArrows);
      this.dioramaParts.airArrows = airArrows;
      this.dioramaParts.curatedVectors = [airArrows];

      const jetPin = createCalloutPinMesh(0.65, isHeated ? "315°C SEGEL!" : "CELAH DINGIN", isHeated ? "#f97316" : "#38bdf8");
      jetPin.position.set(0.35, 0.52, -0.1);
      this.dioramaGroup.add(jetPin);
      this.dioramaParts.jetPin = jetPin;

      const fuelPuddle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.48, 0.02, 18),
        new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.78, roughness: 0.15 })
      );
      fuelPuddle.position.set(-0.1, 0.02, 0.25);
      this.dioramaGroup.add(fuelPuddle);
      this.dioramaParts.fuelPuddle = fuelPuddle;

      const plateRig = createThermalPlatesMesh(1.48, 0.98, visual.solutionVisual === "thermal_expand" || phase === "CLIMAX", "#94a3b8");
      plateRig.position.set(0, 0.48, 0.65);
      plateRig.rotation.x = 0.62;
      applyInkOutline(plateRig);
      this.dioramaGroup.add(plateRig);
      this.dioramaParts.plateRig = plateRig;
      return;
    }

    this.buildGeminiCustomObjects(s3d.objects || []);
  }

  // ============================================================================
  // 5B. GEMINI COMPOSITE 3D PREFAB & ROUNDED BEVEL OBJECT COMPILER
  // ============================================================================
  buildGeminiCustomObjects(objects = []) {
    objects.slice(0, 12).forEach((o, idx) => {
      const baseColor = new THREE.Color(o.color || "#38bdf8");
      const mat = o.glass
        ? new THREE.MeshPhysicalMaterial({ color: baseColor, transparent: true, opacity: 0.38, roughness: 0.1 })
        : new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: o.glow ? baseColor.clone().multiplyScalar(0.45) : new THREE.Color(0x000000),
            metalness: o.metallic ? 0.65 : 0.18,
            roughness: o.metallic ? 0.26 : 0.42
          });

      if (o.kind === "vector_arrows") {
        const va = createVectorArrowsMesh(o.from, o.to, o.count || 3, o.color || "#ef4444", o.size || 0.14, o.speed || 1.8);
        this.dioramaGroup.add(va);
        this.customVectors.push({ group: va, ...va.userData.vectorArrows });
        return;
      }

      if (o.kind === "flow") {
        const balls = [];
        const bMat = new THREE.MeshBasicMaterial({ color: baseColor });
        const count = o.count || 7;
        for (let b = 0; b < count; b++) {
          const sp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), bMat);
          this.dioramaGroup.add(sp);
          balls.push({ mesh: sp, tOffset: b / count });
        }
        this.customFlows.push({ from: o.from, to: o.to, speed: o.speed || 2.0, balls });
        return;
      }

      if (o.kind === "pipe" || o.kind === "wire_cable") {
        const tube = buildCurvedTube(o.from, o.to, o.radius || 0.04, o.color, o.glow);
        this.dioramaGroup.add(tube);
        return;
      }

      if (o.kind === "particles") {
        const plist = [];
        const pColor =
          o.type === "smoke" ? 0x64748b : o.type === "frost" ? 0xe0f2fe : o.type === "flame" ? 0xf97316 : 0xfde047;
        const pMat = new THREE.MeshBasicMaterial({ color: pColor, transparent: true, opacity: 0.8 });
        for (let p = 0; p < 10; p++) {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.055 + (p % 3) * 0.02, 7, 7), pMat);
          this.dioramaGroup.add(m);
          plist.push({ mesh: m, seed: p * 0.65 });
        }
        this.customParticles.push({ origin: [o.x, o.y, o.z], type: o.type, items: plist });
        return;
      }

      let mesh = null;
      if (o.kind === "spotlight_cone") {
        mesh = createSpotlightConeMesh(o.radius || 0.65, o.h || 1.65, o.color || "#fde047");
      } else if (o.kind === "explode_stack") {
        mesh = createExplodeStackMesh(
          o.w || 1.15,
          o.d || 0.85,
          o.layers || 4,
          o.color || "#38bdf8",
          o.accentColor || "#f59e0b",
          o.explodeAmount ?? 0.28
        );
      } else if (o.kind === "callout_pin") {
        mesh = createCalloutPinMesh(o.h || 0.8, o.label || "500°C", o.color || "#f59e0b");
      } else if (o.kind === "glass_tank") {
        const g = new THREE.Group();
        const w = o.w || 1.5;
        const h = o.h || 0.9;
        const d = o.d || 0.85;
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.28, roughness: 0.08 })
        );
        g.add(glass);
        g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: 0xf8fafc })));
        const liqH = h * (o.waterLevel || 0.72);
        const liq = new THREE.Mesh(
          new THREE.BoxGeometry(w - 0.08, liqH, d - 0.08),
          new THREE.MeshPhysicalMaterial({ color: new THREE.Color(o.murky ? "#855e30" : o.liquidColor || "#38bdf8"), transparent: true, opacity: 0.65, roughness: 0.1 })
        );
        liq.position.y = -h / 2 + liqH / 2 + 0.04;
        g.add(liq);
        mesh = g;
      } else if (o.kind === "battery_cell") {
        const g = new THREE.Group();
        const r = o.radius || 0.45;
        const h = o.h || 1.0;
        const shell = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, h, 24),
          new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.36, roughness: 0.12 })
        );
        g.add(shell);
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.35, r * 0.35, 0.12, 16),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.25 })
        );
        cap.position.y = h / 2 + 0.06;
        g.add(cap);
        const core = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.84, r * 0.84, h * 0.8, 20),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(o.chargeColor || "#38bdf8"), roughness: 0.25 })
        );
        g.add(core);
        if (o.hasSeparator) {
          const sep = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, h * 0.86, r * 1.68),
            new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0x854d0e })
          );
          g.add(sep);
        }
        mesh = g;
      } else if (o.kind === "volcano") {
        const g = new THREE.Group();
        const r = o.radius || 1.1;
        const h = o.h || 1.25;
        const mtn = new THREE.Mesh(
          new THREE.ConeGeometry(r, h, 14),
          new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.88 })
        );
        mtn.castShadow = true;
        g.add(mtn);
        const crater = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.24, r * 0.16, 0.14, 14),
          new THREE.MeshStandardMaterial({
            color: 0xf97316,
            emissive: o.magmaGlow ? new THREE.Color(0xdc2626) : new THREE.Color(0x000000)
          })
        );
        crater.position.y = h / 2 - 0.06;
        g.add(crater);
        mesh = g;
      } else if (o.kind === "ac_unit") {
        const g = new THREE.Group();
        const w = o.w || 0.95;
        const h = o.h || 0.52;
        const d = o.d || 0.45;
        const body = new THREE.Mesh(
          createRoundedBoxGeometry(w, h, d, 0.06),
          new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.35 })
        );
        body.castShadow = true;
        g.add(body);
        if (o.isOutdoor) {
          const fan = buildFanMesh(Math.min(w, h) * 0.36, 3, o.bladeColor || "#38bdf8");
          fan.position.z = d / 2 + 0.03;
          g.add(fan);
          g.userData.spinChild = fan;
        } else {
          const vent = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
          vent.position.set(0, -h * 0.28, d / 2 + 0.02);
          g.add(vent);
        }
        mesh = g;
      } else if (o.kind === "cup_mug") {
        const g = new THREE.Group();
        const r = o.radius || 0.32;
        const h = o.h || 0.48;
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.82, h, 20), mat);
        cup.castShadow = true;
        g.add(cup);
        const handle = new THREE.Mesh(new THREE.TorusGeometry(h * 0.28, 0.04, 8, 16), mat);
        handle.position.x = r;
        g.add(handle);
        const drink = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.06, 18),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(o.liquidColor || "#78350f"), roughness: 0.2 })
        );
        drink.position.y = h * 0.38;
        g.add(drink);
        if (o.foam) {
          const foam = new THREE.Mesh(
            new THREE.SphereGeometry(r * 0.85, 14, 10),
            new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 })
          );
          foam.scale.set(1, 0.32, 1);
          foam.position.y = h * 0.44;
          g.add(foam);
        }
        mesh = g;
      } else if (o.kind === "pot_pan") {
        const g = new THREE.Group();
        const r = o.radius || 0.46;
        const h = o.h || 0.5;
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, h, 22),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.72, roughness: 0.26 })
        );
        pot.castShadow = true;
        g.add(pot);
        const soup = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.06, 20),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(o.liquidColor || "#f59e0b"), roughness: 0.25 })
        );
        soup.position.y = h * 0.36;
        g.add(soup);
        if (o.burnerOn) {
          const flame = new THREE.Mesh(
            new THREE.TorusGeometry(r * 0.65, 0.045, 8, 20),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
          );
          flame.rotation.x = Math.PI / 2;
          flame.position.y = -h * 0.52;
          g.add(flame);
        }
        mesh = g;
      } else if (o.kind === "beaker") {
        const g = new THREE.Group();
        const r = o.radius || 0.32;
        const h = o.h || 0.68;
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, h, 20),
          new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.34, roughness: 0.08 })
        );
        g.add(glass);
        const liq = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.88, r * 0.88, h * 0.62, 18),
          new THREE.MeshPhysicalMaterial({ color: new THREE.Color(o.liquidColor || "#38bdf8"), transparent: true, opacity: 0.72 })
        );
        liq.position.y = -h * 0.14;
        g.add(liq);
        mesh = g;
      } else if (o.kind === "solar_panel") {
        const g = new THREE.Group();
        const panel = new THREE.Mesh(
          createRoundedBoxGeometry(o.w || 1.35, 0.08, o.d || 0.85, 0.03),
          new THREE.MeshStandardMaterial({ map: this.solarTex, metalness: 0.4, roughness: 0.2 })
        );
        panel.rotation.x = o.tilt || 0.45;
        panel.castShadow = true;
        g.add(panel);
        const stand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.1, 0.45, 10),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 })
        );
        stand.position.y = -0.22;
        g.add(stand);
        mesh = g;
      } else if (o.kind === "sound_rings") {
        mesh = createSoundRingsMesh(o.radius || 0.75, o.rings || 4, o.color || "#ef4444");
      } else if (o.kind === "filter_sump") {
        mesh = createFilterSumpMesh(o.w || 1.0, o.h || 0.68, o.d || 0.72, o.color || "#0ea5e9");
      } else if (o.kind === "turbine_gen") {
        mesh = createTurbineGenMesh(o.radius || 0.42, o.blades || 8, o.color || "#e2e8f0", o.glow !== false);
      } else if (o.kind === "rebar_pit") {
        mesh = createRebarPitMesh(o.w || 1.15, o.h || 0.5, o.d || 0.85);
      } else if (o.kind === "stingray") {
        mesh = createStingrayMesh(this.stingrayTex, o.radius ? o.radius * 1.4 : 0.75, o.murky).group;
      } else if (o.kind === "thermal_plates") {
        mesh = createThermalPlatesMesh(o.w || 1.48, o.d || 0.98, Boolean(o.heated), o.color || "#94a3b8");
      } else if (o.kind === "aircraft_jet") {
        mesh = createAircraftJetMesh(o.color || "#1e293b", Boolean(o.heated));
      } else if (o.kind === "miner_rig") {
        mesh = createMinerRigMesh(o.w || 0.88, o.h || 0.68, o.d || 0.58, o.color || "#475569", Boolean(o.immersed));
      } else if (o.kind === "cylinder") {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(o.rTop || 0.35, o.rBottom || 0.4, o.h || 0.7, 22, 1, Boolean(o.openTop)), mat);
        if (o.openTop) mat.side = THREE.DoubleSide;
      } else if (o.kind === "sphere") {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(o.radius || 0.35, 18, 16), mat);
      } else if (o.kind === "cone") {
        mesh = new THREE.Mesh(new THREE.ConeGeometry(o.radius || 0.6, o.h || 1.0, 20), mat);
      } else if (o.kind === "torus") {
        mesh = new THREE.Mesh(new THREE.TorusGeometry(o.radius || 0.45, o.tube || 0.09, 12, 26), mat);
      } else if (o.kind === "coil") {
        mesh = buildHelixCoilMesh(o.radius || 0.32, o.h || 0.65, o.turns || 5, o.tube || 0.04, o.color, o.glow);
      } else if (o.kind === "gear") {
        mesh = buildGearMesh(o.radius || 0.3, o.teeth || 8, o.color, o.metallic !== false);
      } else if (o.kind === "fan") {
        mesh = buildFanMesh(o.radius || 0.45, o.blades || 3, o.color);
      } else if (o.kind === "liquid") {
        const lMat = new THREE.MeshPhysicalMaterial({ color: baseColor, transparent: true, opacity: 0.68, roughness: 0.12 });
        mesh = new THREE.Mesh(new THREE.BoxGeometry(o.w || 1.1, o.h || 0.5, o.d || 0.65), lMat);
      } else {
        mesh = new THREE.Mesh(createRoundedBoxGeometry(o.w || 0.9, o.h || 0.7, o.d || 0.7, 0.07), mat);
      }

      mesh.position.set(o.x || 0, o.y ?? 0.45, o.z || 0);
      mesh.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
      mesh.castShadow = !o.glass && o.kind !== "spotlight_cone";
      mesh.receiveShadow = true;
      if (o.inkOutline !== false && !o.glass && o.kind !== "particles" && o.kind !== "sound_rings" && o.kind !== "spotlight_cone" && o.kind !== "callout_pin") {
        applyInkOutline(mesh);
      }
      this.dioramaGroup.add(mesh);

      const hw = o.w ? o.w / 2 : (o.radius || 0.35);
      const hh = o.h ? o.h / 2 : (o.radius || 0.35);
      const hd = o.d ? o.d / 2 : (o.radius || 0.35);
      this.customNodes.push({
        mesh,
        baseMat: mat,
        baseColor: baseColor.clone(),
        baseX: o.x || 0,
        baseY: o.y ?? 0.45,
        baseZ: o.z || 0,
        halfW: hw,
        halfH: hh,
        halfD: hd,
        baseRx: o.rx || 0,
        baseRy: o.ry || 0,
        baseRz: o.rz || 0,
        kind: o.kind,
        enter: o.enter || "pop",
        motion: o.motion || "none",
        speed: o.speed || 2.5,
        explodeY: o.explodeY || 0,
        thermalGlow: Boolean(o.thermalGlow),
        seed: idx * 0.9
      });
    });
  }

  computeActiveBounds(visual, hero, envType, shot) {
    if (hero === "custom_stage" && (this.customNodes.length > 0 || this.customFlows.length > 0 || this.customVectors.length > 0)) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const n of this.customNodes) {
        minX = Math.min(minX, n.baseX - (n.halfW || 0.4));
        maxX = Math.max(maxX, n.baseX + (n.halfW || 0.4));
        minY = Math.min(minY, n.baseY - (n.halfH || 0.35));
        maxY = Math.max(maxY, n.baseY + (n.halfH || 0.35) + Math.max(0, n.explodeY || 0));
        minZ = Math.min(minZ, n.baseZ - (n.halfD || 0.35));
        maxZ = Math.max(maxZ, n.baseZ + (n.halfD || 0.35));
      }
      for (const fl of this.customFlows) {
        minX = Math.min(minX, fl.from[0], fl.to[0]);
        maxX = Math.max(maxX, fl.from[0], fl.to[0]);
        minY = Math.min(minY, fl.from[1], fl.to[1]);
        maxY = Math.max(maxY, fl.from[1], fl.to[1]);
        minZ = Math.min(minZ, fl.from[2], fl.to[2]);
        maxZ = Math.max(maxZ, fl.from[2], fl.to[2]);
      }
      for (const va of this.customVectors) {
        minX = Math.min(minX, va.from.x, va.to.x);
        maxX = Math.max(maxX, va.from.x, va.to.x);
        minY = Math.min(minY, va.from.y, va.to.y);
        maxY = Math.max(maxY, va.from.y, va.to.y);
        minZ = Math.min(minZ, va.from.z, va.to.z);
        maxZ = Math.max(maxZ, va.from.z, va.to.z);
      }
      if (Number.isFinite(minX)) {
        return {
          cx: (minX + maxX) / 2,
          cy: (minY + maxY) / 2,
          cz: (minZ + maxZ) / 2,
          spanW: Math.max(1.15, maxX - minX),
          spanH: Math.max(0.85, maxY - minY),
          spanD: Math.max(0.9, maxZ - minZ)
        };
      }
    }

    if (hero === "bitcoin_bunker") {
      if (shot === "room_closeup") return { cx: 0.15, cy: 0.62, cz: -0.42, spanW: 1.85, spanH: 1.15, spanD: 1.1 };
      if (shot === "bunker_view") return { cx: 0.25, cy: -0.88, cz: -0.25, spanW: 2.25, spanH: 1.15, spanD: 1.0 };
      if (shot === "rooftop_view") return { cx: 0.65, cy: 1.88, cz: -0.22, spanW: 1.85, spanH: 0.95, spanD: 1.2 };
      return { cx: 0.12, cy: 0.25, cz: -0.28, spanW: 3.1, spanH: 3.05, spanD: 1.4 };
    }
    if (hero === "supersonic_jet") {
      if (shot === "macro_plate") return { cx: 0, cy: 0.5, cz: 0.62, spanW: 1.65, spanH: 0.85, spanD: 1.05 };
      return { cx: 0, cy: 0.45, cz: 0.0, spanW: 2.35, spanH: 0.95, spanD: 1.65 };
    }
    if (hero === "stingray_pond") {
      const hasFilter = Boolean(this.dioramaParts.filterGroup?.visible);
      return hasFilter
        ? { cx: 0.22, cy: 0.36, cz: -0.05, spanW: 2.85, spanH: 0.9, spanD: 1.45 }
        : { cx: -0.18, cy: 0.36, cz: -0.05, spanW: 2.25, spanH: 0.85, spanD: 1.45 };
    }
    if (hero === "rice_fish") return { cx: 0, cy: 0.35, cz: -0.45, spanW: 2.1, spanH: 1.1, spanD: 2.0 };
    if (hero === "fan_blades") return { cx: 0.05, cy: 0.65, cz: 0.08, spanW: 2.1, spanH: 1.15, spanD: 1.0 };
    if (hero === "ice_cream") return { cx: 0, cy: 0.58, cz: 0.08, spanW: 1.9, spanH: 1.1, spanD: 1.35 };
    if (hero === "arowana_fish" || hero === "betta_fish" || hero === "ornamental_fish" || hero === "catfish") {
      return { cx: 0, cy: 0.48, cz: 0, spanW: 2.25, spanH: 1.05, spanD: 1.35 };
    }
    return { cx: 0, cy: 0.48, cz: 0, spanW: 1.9, spanH: 1.0, spanD: 1.2 };
  }

  // ============================================================================
  // 6. PER-FRAME 60 FPS TIMELINE + CAMERA CUTS + WORKER ACTION
  // ============================================================================
  renderFrame(sceneData, topicText, tSec, sceneElapsedSec = 1.0) {
    const visual = sceneData?.visual || {};
    const phase = sceneData?.phase || "HOOK";
    const sceneNum = sceneData?.sceneNumber || 1;
    const hero = visual.heroObject || "custom_stage";
    const skyMode = visual.stage3d?.skyMode || "day";
    const worldKey =
      hero === "custom_stage"
        ? `custom::${topicText}::${sceneNum}::${skyMode}`
        : `${hero}::${visual.setting || "std"}::${skyMode}::${visual.solutionVisual || "none"}::${visual.problemVisual || "none"}`;

    this.buildDiorama(worldKey, sceneData, topicText);

    // 1. AUTO-FRAMED 9:16 SHOWCASE CAMERA (UNOBSTRUCTED UPPER-MIDDLE STAGE!)
    const shot = visual.stage3d?.cameraShot || "closeup_hands";
    const envType = visual.stage3d?.environment || "wood_desk";
    const shakeX = phase === "TAPI" && sceneElapsedSec < 0.7 ? Math.sin(tSec * 52) * 0.075 * (1 - sceneElapsedSec / 0.7) : 0;
    const shakeY = phase === "TAPI" && sceneElapsedSec < 0.7 ? Math.cos(tSec * 44) * 0.05 * (1 - sceneElapsedSec / 0.7) : 0;

    const bounds = this.computeActiveBounds(visual, hero, envType, shot);
    const vFovRad = (50 * Math.PI) / 180;
    const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * (this.width / this.height));
    const distX = (bounds.spanW * 0.5) / (Math.tan(hFovRad / 2) * 0.74);
    const distY = (bounds.spanH * 0.5) / (Math.tan(vFovRad / 2) * 0.44);
    let dist = Math.max(2.15, distX, distY, bounds.spanD * 0.65 + 1.35);

    let az = 0.22; // +12.5 deg clean 3/4 view
    let elev = 0.44; // ~25 deg downward look
    const pushFactor = 1.0 - Math.min(0.08, sceneElapsedSec * 0.02);

    if (shot === "isometric_cutaway") {
      az = 0.46 + Math.sin(tSec * 0.45) * 0.07;
      elev = 0.54;
      dist *= 1.04;
    } else if (shot === "side_inspection") {
      az = -0.44 + Math.cos(tSec * 0.45) * 0.06;
      elev = 0.36;
      dist *= 0.98;
    } else if (shot === "corridor_view") {
      az = Math.sin(tSec * 0.45) * 0.08;
      elev = 0.32;
      dist *= 1.06;
    } else if (shot === "hero_low") {
      az = Math.sin(tSec * 0.5) * 0.25;
      elev = 0.18;
      dist *= 1.02;
    } else if (shot === "disaster_shake") {
      az = 0.14;
      elev = 0.38;
      dist *= 0.94;
    } else if (shot === "room_closeup" || shot === "bunker_view") {
      az = 0.18 + Math.sin(tSec * 0.4) * 0.06;
      elev = 0.16;
      dist *= 1.12;
    } else if (shot === "rooftop_view") {
      az = 0.34 + Math.sin(tSec * 0.35) * 0.06;
      elev = 0.46;
      dist *= 1.18;
    } else if (shot === "full_cross_section") {
      az = Math.sin(tSec * 0.35) * 0.06;
      elev = 0.14;
      dist *= 1.24;
    } else if (shot === "macro_plate") {
      az = 0.14 + Math.sin(tSec * 0.5) * 0.05;
      elev = 0.52;
      dist *= 1.08;
    } else {
      az = 0.20 + Math.sin(tSec * 0.4) * 0.05;
      elev = 0.20;
      dist *= 1.18;
    }

    const activeDist = Math.max(3.85, dist * pushFactor * 1.14);
    const horizDist = activeDist * Math.cos(elev);
    const camX = bounds.cx + Math.sin(az) * horizDist + shakeX;
    const camY = bounds.cy + Math.sin(elev) * activeDist + shakeY;
    const camZ = bounds.cz + Math.cos(az) * horizDist;

    // Look slightly above center so the 3D subject settles cleanly in the open middle stage (y=260..740), clear of top HUD & bottom subtitles
    const lookYOffset = Math.min(0.24, Math.max(0.06, bounds.spanH * 0.08));
    this.camPosGoal.set(camX, camY, camZ);
    this.camLookGoal.set(bounds.cx, bounds.cy + lookYOffset, bounds.cz);

    const curCamSceneKey = `${worldKey}::${sceneNum}::${shot}`;
    if (this.lastCamSceneKey !== curCamSceneKey) {
      this.lastCamSceneKey = curCamSceneKey;
      this.camera.position.copy(this.camPosGoal);
      this.cameraTarget.copy(this.camLookGoal);
    } else {
      this.camera.position.lerp(this.camPosGoal, 0.14);
      this.cameraTarget.lerp(this.camLookGoal, 0.14);
    }
    this.camera.lookAt(this.cameraTarget);

    // 2. OPEN UNDERGROUND BUNKER CUTAWAY & ROOF VISIBILITY + ANIMATE "IPUL"
    if ((visual.stage3d?.environment === "house_bunker" || hero === "bitcoin_bunker") && this.dioramaGroup) {
      let cutawayReady = this.dioramaGroup.children.some((c) => c.name === "__maouBunkerCutawayMarker");
      if (!cutawayReady) {
        const marker = new THREE.Group();
        marker.name = "__maouBunkerCutawayMarker";
        this.dioramaGroup.add(marker);
        let soilMat = null;
        const roofs = [];
        const wp = new THREE.Vector3();
        if (typeof this.dioramaGroup.updateMatrixWorld === "function") {
          this.dioramaGroup.updateMatrixWorld(true);
        }
        this.dioramaGroup.traverse((ch) => {
          if (!ch?.isMesh || !ch.geometry?.parameters) return;
          const gp = ch.geometry.parameters;
          if (typeof ch.getWorldPosition === "function") ch.getWorldPosition(wp);
          else wp.copy(ch.position);
          // Solid front soil cube (8.6 x 2 x 5.2 at z=-0.6) buried the underground concrete bunker; open the front mouth
          if ((gp.width || 0) >= 8.0 && (gp.height || 0) >= 1.8 && wp.y < -0.45) {
            ch.visible = false;
            soilMat = ch.material;
          } else if (
            ch.geometry.type === "CylinderGeometry" &&
            Math.abs(wp.x) < 1.85 &&
            wp.z > 0.25 &&
            wp.y > -0.25 &&
            wp.y < 0.08
          ) {
            ch.visible = false;
          } else if (Math.abs(ch.rotation?.z || 0) > 0.35 && wp.y > 1.45 && (gp.depth || 0) > 2.0) {
            roofs.push({ mesh: ch, origZ: ch.position.z });
          }
        });
        if (soilMat) {
          const leftSoil = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.56, 4.4), soilMat);
          leftSoil.position.set(-3.02, -0.82, -0.6);
          const rightSoil = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.56, 4.4), soilMat);
          rightSoil.position.set(3.02, -0.82, -0.6);
          const backSoil = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.56, 0.5), soilMat);
          backSoil.position.set(0, -0.82, -1.58);
          const baseSoil = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.52, 4.8), soilMat);
          baseSoil.position.set(0, -1.80, -0.6);
          this.dioramaGroup.add(leftSoil, rightSoil, backSoil, baseSoil);
        }
        if (typeof THREE.PointLight === "function") {
          const bunkerFill = new THREE.PointLight(0xfef3c7, 0.95, 5.5);
          bunkerFill.position.set(0, -0.42, 0.85);
          this.dioramaGroup.add(bunkerFill);
        }
        this.dioramaGroup.userData.roofSlopes = roofs;
      }
      const showFullRoof = shot === "rooftop_view";
      for (const rf of this.dioramaGroup.userData.roofSlopes || []) {
        rf.mesh.scale.set(1, 1, showFullRoof ? 1 : 0.70);
        rf.mesh.position.z = showFullRoof ? rf.origZ : rf.origZ - 0.36;
      }
    }

    const wk = this.worker;
    const action = visual.workerAction || (phase === "TAPI" ? "panic" : phase === "CLIMAX" ? "celebrate" : "build");
    wk.root.scale.setScalar(1);
    if (visual.stage3d?.environment === "house_bunker" || hero === "bitcoin_bunker") {
      if (shot === "bunker_view" || shot === "full_cross_section") {
        wk.root.position.set(-0.92, -1.44, -0.25);
        wk.root.scale.setScalar(0.82);
      } else {
        wk.root.position.set(-0.25, 0.0, -0.58);
      }
    } else if (hero === "supersonic_jet") {
      wk.root.position.set(1.15, 0.0, -0.55);
    } else {
      wk.root.position.set(0, -0.32, -0.88);
    }
    if (this.worker.capingHat.visible) wk.root.position.set(-0.55, 0, 0.25);

    wk.flameTip.visible = action === "heat";
    wk.basketRim.visible = action === "long_net" || this.worker.capingHat.visible;

    if (action === "cover_ears") {
      wk.hips.position.y = 0.68 + Math.sin(tSec * 14) * 0.03;
      wk.leftArm.rotation.set(-2.25, 0, -0.45);
      wk.rightArm.rotation.set(-2.25, 0, 0.45);
      wk.head.rotation.y = Math.sin(tSec * 14) * 0.28;
      wk.toolGroup.visible = false;
    } else if (action === "long_net") {
      wk.hips.position.y = 0.68 + Math.sin(tSec * 3.5) * 0.025;
      wk.leftArm.rotation.set(-1.1, 0, 0);
      wk.rightArm.rotation.set(-1.35 + Math.sin(tSec * 4) * 0.22, 0, 0.1);
      wk.head.rotation.x = 0.15;
      wk.toolGroup.visible = true;
    } else if (action === "panic" || phase === "TAPI") {
      wk.hips.position.y = 0.68 + Math.abs(Math.sin(tSec * 12)) * 0.1;
      wk.leftArm.rotation.set(-2.35 + Math.sin(tSec * 15) * 0.4, 0, 0);
      wk.rightArm.rotation.set(-2.35 - Math.sin(tSec * 15) * 0.4, 0, 0);
      wk.head.rotation.y = Math.sin(tSec * 12) * 0.3;
      wk.toolGroup.visible = false;
    } else if (action === "celebrate" || phase === "CLIMAX") {
      wk.hips.position.y = 0.68 + Math.abs(Math.sin(tSec * 7.5)) * 0.14;
      wk.leftArm.rotation.set(-2.65, 0, 0);
      wk.rightArm.rotation.set(-2.65, 0, 0);
      wk.head.rotation.y = Math.sin(tSec * 3) * 0.15;
      wk.toolGroup.visible = false;
    } else {
      const w = Math.sin(tSec * 5.2);
      wk.hips.position.y = 0.68 + Math.abs(w) * 0.025;
      wk.hips.rotation.x = 0.18 + w * 0.06;
      wk.rightArm.rotation.set(-1.18 + w * 0.42, 0, Math.cos(tSec * 5.2) * 0.2);
      wk.leftArm.rotation.set(-1.05 - w * 0.3, 0, 0);
      wk.head.rotation.x = 0.22 + w * 0.06;
      wk.toolGroup.visible = action === "stir" || action === "heat" || this.worker.capingHat.visible;
    }

    // 3. ANIMATE CUSTOM GEMINI 3D TIMELINE OBJECTS (+ VT-INSPIRED VECTORS / SPOTLIGHT / EXPLODE / THERMAL!)
    if (this.rimLight) {
      if (phase === "TAPI") {
        this.rimLight.color.setHex(0xf43f5e);
        this.rimLight.intensity = 1.25 + Math.sin(tSec * 7) * 0.25;
      } else if (phase === "CLIMAX") {
        this.rimLight.color.setHex(0xfbbf24);
        this.rimLight.intensity = 1.2;
      } else if (skyMode === "day") {
        this.rimLight.color.setHex(0xf59e0b);
        this.rimLight.intensity = 0.85;
      }
    }

    for (const node of this.customNodes) {
      let ex = node.baseX;
      let ey = node.baseY;
      let ez = node.baseZ;
      let scale = 1;

      if (sceneElapsedSec < 0.75 && node.enter !== "none") {
        const p = sceneElapsedSec / 0.75;
        if (node.enter === "drop") ey += (1 - easeOutBack(p)) * 1.45;
        else if (node.enter === "pop") scale = Math.max(0.05, easeOutBack(p));
        else if (node.enter === "slide_left") ex -= (1 - p) * 1.6;
        else if (node.enter === "slide_right") ex += (1 - p) * 1.6;
      }

      if (node.explodeY) {
        const expProgress = Math.min(1, sceneElapsedSec / 0.85);
        ey += node.explodeY * easeOutBack(expProgress);
      }

      if (node.motion === "float" || node.motion === "bob") ey += Math.sin(tSec * 2.8 + node.seed) * 0.09;
      if (node.motion === "shake") {
        ex += Math.sin(tSec * 48 + node.seed) * 0.045;
        ez += Math.cos(tSec * 42 + node.seed) * 0.025;
      }
      if (node.motion === "pulse") scale *= 1 + Math.sin(tSec * 4.5 + node.seed) * 0.07;

      node.mesh.position.set(ex, ey, ez);
      node.mesh.scale.setScalar(scale);

      // @dekodaid Dynamic Thermal Heat Shift (cool tone -> glowing molten crimson/orange!)
      if (node.thermalGlow && node.baseMat?.emissive) {
        const heatT = Math.min(1, 0.35 + sceneElapsedSec * 0.65);
        node.baseMat.emissive.setRGB?.(heatT * 0.85, heatT * 0.22, 0.02);
      }

      // @xirooo4k Exploded Multi-Layer Hardware Teardown Stack
      if (node.mesh.userData?.explodeStack) {
        const st = node.mesh.userData.explodeStack;
        const expP = Math.min(1, sceneElapsedSec / 0.85);
        const factor = easeOutBack(expP);
        st.layers.forEach((lr) => {
          lr.mesh.position.y = lr.baseLocalY + lr.idx * st.explodeAmount * factor;
        });
      }

      // @xirooo4k Volumetric Overhead Spotlight Cone Breathing
      if (node.mesh.userData?.spotlightCone) {
        const sp = node.mesh.userData.spotlightCone;
        if (sp.coneMat) sp.coneMat.opacity = 0.14 + Math.sin(tSec * 3.5) * 0.05;
        if (sp.floorDisc) sp.floorDisc.scale.setScalar(0.95 + Math.sin(tSec * 4.2) * 0.06);
      }

      // @kapten.arsitek Floating 3D Callout Pin Bob
      if (node.mesh.userData?.calloutPin) {
        const cp = node.mesh.userData.calloutPin;
        cp.placard.position.y = cp.baseY + Math.sin(tSec * 2.6 + node.seed) * 0.03;
      }

      if (node.mesh.userData?.spinChild) {
        node.mesh.userData.spinChild.rotation.z = tSec * (node.speed || 9.5);
      }
      if (Array.isArray(node.mesh.userData?.spinFans)) {
        node.mesh.userData.spinFans.forEach((f) => {
          f.rotation.z = tSec * 12;
        });
      }
      if (Array.isArray(node.mesh.userData?.ringMeshes)) {
        node.mesh.userData.ringMeshes.forEach((rm) => {
          const s = 0.8 + ((tSec * 1.4 + rm.idx * 0.25) % 1) * 0.65;
          rm.mesh.scale.setScalar(s);
        });
      }
      if (Array.isArray(node.mesh.userData?.bioSpheres)) {
        node.mesh.userData.bioSpheres.forEach((b) => {
          b.mesh.position.y = b.baseY + Math.sin(tSec * 3.5 + b.seed) * 0.04;
        });
      }
      if (node.kind === "fan" || node.kind === "gear") {
        node.mesh.rotation.z = tSec * (node.motion === "spin_reverse" ? -Math.abs(node.speed) : node.speed);
      } else if (node.motion === "spin") {
        node.mesh.rotation.y = node.baseRy + tSec * node.speed;
      } else if (node.motion === "spin_reverse") {
        node.mesh.rotation.y = node.baseRy - tSec * Math.abs(node.speed);
      }
    }

    // @kapten.arsitek Pulsing 3D Force/Flow Vector Arrows
    for (const va of this.customVectors) {
      va.arrows.forEach((ar) => {
        const u = (ar.tOffset + tSec * (va.speed || 1.8) * 0.42) % 1;
        ar.mesh.position.set(
          va.from.x + (va.to.x - va.from.x) * u,
          va.from.y + (va.to.y - va.from.y) * u,
          va.from.z + (va.to.z - va.from.z) * u
        );
        const s = 0.85 + Math.sin(u * Math.PI) * 0.35;
        ar.mesh.scale.setScalar(s);
      });
    }

    for (const fl of this.customFlows) {
      for (const b of fl.balls) {
        const u = (b.tOffset + tSec * fl.speed * 0.35) % 1;
        b.mesh.position.set(
          fl.from[0] + (fl.to[0] - fl.from[0]) * u,
          fl.from[1] + (fl.to[1] - fl.from[1]) * u + Math.sin(u * Math.PI * 2 + tSec * 4) * 0.04,
          fl.from[2] + (fl.to[2] - fl.from[2]) * u
        );
      }
    }

    for (const ps of this.customParticles) {
      ps.items.forEach((it, idx) => {
        const u = (tSec * 0.9 + it.seed) % 1;
        const angle = idx * 0.9 + tSec * 1.5;
        const spread = ps.type === "sparks" ? u * 0.65 : Math.sin(angle) * 0.25;
        it.mesh.position.set(
          ps.origin[0] + Math.cos(angle) * spread,
          ps.origin[1] + (ps.type === "frost" ? -u * 0.75 + 0.5 : u * 0.95),
          ps.origin[2] + Math.sin(angle) * spread
        );
      });
    }

    // 4. ANIMATE CURATED SHOWCASE PROPS
    const p = this.dioramaParts;
    if (hero === "ice_cream") {
      const isFrozen = visual.problemVisual === "rock_ice_block" || (phase === "TAPI" && sceneNum <= 2);
      const isDone = phase === "CLIMAX" || visual.solutionVisual === "waffle_cones";
      if (p.hardIceGroup) p.hardIceGroup.visible = isFrozen;
      if (p.conesGroup) {
        p.conesGroup.visible = isDone;
        p.conesGroup.rotation.y = Math.sin(tSec * 1.4) * 0.22;
      }
      if (p.iceBucket) p.iceBucket.visible = sceneNum >= 3 || phase === "JADI" || isDone;
      if (p.iceGroup) p.iceGroup.visible = sceneNum >= 3 || phase === "JADI" || isDone;
      if (p.whiskGroup) {
        p.whiskGroup.visible = !isDone && !isFrozen;
        if (phase === "JADI") {
          p.whiskGroup.rotation.y = tSec * 14;
          p.whiskGroup.position.x = Math.cos(tSec * 4) * 0.16;
          p.whiskGroup.position.z = Math.sin(tSec * 4) * 0.16;
        }
      }
      if (p.iceColdArrows) p.iceColdArrows.visible = phase === "JADI" || visual.solutionVisual === "salt_frost_aura";
      if (p.mixMat) p.mixMat.color.set(isFrozen ? "#bae6fd" : visual.accentColor || "#f9a8d4");
    } else if (hero === "fan_blades") {
      const isSpinning = phase === "CLIMAX" || (phase === "JADI" && sceneNum >= 5) || visual.solutionVisual === "sparkle_shield";
      const isHumming = phase === "TAPI" || visual.problemVisual === "motor_vibrating";
      if (p.shaft) p.shaft.visible = sceneNum >= 3;
      if (p.rotorPivot) {
        p.rotorPivot.visible = sceneNum >= 5 || phase === "CLIMAX";
        if (isSpinning) p.rotorPivot.rotation.z -= 0.28;
        else if (isHumming) p.rotorPivot.rotation.z = Math.sin(tSec * 46) * 0.09;
      }
      if (p.motorGroup) p.motorGroup.position.x = isHumming ? Math.sin(tSec * 52) * 0.04 : 0;
      if (p.capacitor) p.capacitor.visible = sceneNum >= 4;
      if (p.torqueArrows) p.torqueArrows.visible = sceneNum >= 4 || isSpinning;
    } else if (hero === "arowana_fish" || hero === "betta_fish" || hero === "ornamental_fish" || hero === "catfish") {
      const isMurky = visual.problemVisual === "murky_mud" || (phase === "TAPI" && sceneNum >= 3);
      const isFighting = visual.problemVisual === "fish_fighting" || (p.isCupang && phase === "TAPI" && sceneNum === 2);
      const isJumping = visual.problemVisual === "fish_jumping";
      if (p.waterMat) p.waterMat.color.setHex(isMurky ? 0x7c582d : 0x38bdf8);
      if (p.divider) p.divider.visible = p.isCupang && sceneNum >= 3;
      if (p.ketapangLeaf) p.ketapangLeaf.visible = p.isCupang && sceneNum >= 4;
      if (p.meshFence) p.meshFence.visible = sceneNum >= 4 || phase === "CLIMAX";

      (p.fishes || []).forEach((f, idx) => {
        if (p.isCupang && isFighting) {
          const ang = tSec * 5.2 + idx * Math.PI;
          f.group.position.set(Math.cos(ang) * 0.34, f.waterYCenter, Math.sin(ang) * 0.22);
          f.group.rotation.y = -ang;
        } else if (isJumping && idx === 0) {
          f.group.position.set(Math.sin(tSec * 1.5) * 0.35, f.waterYCenter + Math.abs(Math.sin(tSec * 3.8)) * 0.78, 0);
          f.group.rotation.z = Math.cos(tSec * 3.8) * 0.8;
        } else {
          const ang = tSec * 1.35 + f.seed;
          const sideX = p.divider?.visible ? (idx === 0 ? -0.45 : 0.45) : 0;
          f.group.position.set(
            sideX + Math.sin(ang) * (p.divider?.visible ? 0.25 : 0.68),
            f.waterYCenter + Math.cos(tSec * 2 + idx) * 0.08,
            Math.cos(ang) * 0.32
          );
          f.group.rotation.y = Math.cos(ang) >= 0 ? 0 : Math.PI;
          f.group.rotation.z = 0;
        }
        if (f.shadowDisc) {
          f.shadowDisc.position.set(f.group.position.x, f.floorY + 0.026, f.group.position.z);
          f.shadowDisc.rotation.y = f.group.rotation.y;
        }
        if (f.tail) f.tail.rotation.y = Math.PI + Math.sin(tSec * 12 + idx) * 0.35;
      });
    } else if (hero === "rice_fish") {
      (p.stalks || []).forEach((s) => {
        s.mesh.rotation.z = Math.sin(tSec * 2.2 + s.seed) * 0.1;
      });
      (p.fishes || []).forEach((f, idx) => {
        f.group.position.z = ((tSec * 0.65 + f.seed) % 4.5) - 2.2;
        if (f.tail) f.tail.rotation.y = Math.PI + Math.sin(tSec * 12 + idx) * 0.35;
      });
    } else if (hero === "stingray_pond") {
      const isDry = visual.problemVisual === "dry_seep";
      const isMurky = visual.problemVisual === "murky_mud";
      if (p.rebarGroup) p.rebarGroup.visible = visual.solutionVisual === "concrete_rebar" || sceneNum === 3;
      if (p.sandBed) p.sandBed.visible = sceneNum >= 5 || visual.solutionVisual === "sand_bed" || visual.solutionVisual === "baby_stingrays";
      if (p.filterGroup) p.filterGroup.visible = sceneNum >= 6 || visual.solutionVisual === "filter_sump" || visual.solutionVisual === "baby_stingrays";
      if (p.waterMat) p.waterMat.color.setHex(isMurky ? 0x7c582d : 0x38bdf8);
      if (p.waterBox) p.waterBox.scale.y = isDry ? 0.16 : 1;
      if (p.sumpMesh && Array.isArray(p.sumpMesh.userData?.bioSpheres)) {
        p.sumpMesh.userData.bioSpheres.forEach((b) => {
          b.mesh.position.y = b.baseY + Math.sin(tSec * 4 + b.seed) * 0.04;
        });
      }
      const glideList = [...(p.stingrays || [])];
      if (p.babyRays) {
        p.babyRays.forEach((br) => {
          br.group.visible = phase === "CLIMAX" || visual.solutionVisual === "baby_stingrays";
          if (br.group.visible) glideList.push(br);
        });
      }
      glideList.forEach((sr, idx) => {
        const ang = tSec * (1.2 + idx * 0.25) + sr.seed;
        sr.group.position.set(Math.sin(ang) * 0.58, isDry ? 0.08 : 0.16 + Math.cos(tSec * 2 + idx) * 0.04, Math.cos(ang) * 0.34);
        sr.group.rotation.y = Math.atan2(Math.cos(ang), -Math.sin(ang));
        const flap = Math.sin(tSec * 6.5 + idx) * 0.24;
        if (sr.leftWing) sr.leftWing.rotation.z = flap;
        if (sr.rightWing) sr.rightWing.rotation.z = -flap;
        if (sr.tail) sr.tail.rotation.y = Math.sin(tSec * 8 + idx) * 0.22;
        if (sr.spineTip) sr.spineTip.visible = visual.problemVisual === "venom_tail" || sceneNum === 7;
      });
    } else if (hero === "bitcoin_bunker") {
      if (p.roomMiner) {
        p.roomMiner.visible = sceneNum <= 2;
        (p.roomMiner.userData?.spinFans || []).forEach((f) => { f.rotation.z = tSec * 14; });
      }
      if (p.soundRings) {
        p.soundRings.visible = sceneNum <= 2 || visual.problemVisual === "sound_waves";
        (p.soundRings.userData?.ringMeshes || []).forEach((rm) => {
          rm.mesh.scale.setScalar(0.75 + ((tSec * 1.6 + rm.idx * 0.25) % 1) * 0.75);
        });
      }
      if (p.bunkerMiner) {
        p.bunkerMiner.visible = sceneNum >= 3;
        (p.bunkerMiner.userData?.spinFans || []).forEach((f) => { f.rotation.z = tSec * 12; });
      }
      if (p.heatArrows) p.heatArrows.visible = sceneNum >= 4 && !p.pltuGroup?.visible;
      if (p.bunkerSpot) p.bunkerSpot.visible = sceneNum >= 7 || visual.solutionVisual === "pltu_loop";
      if (p.solarGroup) p.solarGroup.visible = sceneNum >= 5;
      if (p.pltuGroup) p.pltuGroup.visible = sceneNum >= 7 || visual.solutionVisual === "pltu_loop" || visual.solutionVisual === "house_lit";
      if (p.turbine && p.turbine.userData?.spinChild && p.pltuGroup?.visible) {
        p.turbine.userData.spinChild.rotation.z = tSec * 11;
      }
      if (p.roomBulbMat) {
        const isBlackout = visual.problemVisual === "night_outage" || (sceneNum === 5 && skyMode === "night");
        p.roomBulbMat.emissiveIntensity = isBlackout ? 0.0 : phase === "CLIMAX" ? 1.5 : 0.75;
        p.roomBulbMat.color.setHex(isBlackout ? 0x475569 : 0xfef08a);
      }
    } else if (hero === "supersonic_jet") {
      const showMacro = visual.stage3d?.cameraShot === "macro_plate";
      const isExpanded = visual.solutionVisual === "thermal_expand" || visual.solutionVisual === "sealed_jet" || phase === "CLIMAX";
      if (p.jet) {
        p.jet.visible = !showMacro;
        if (visual.solutionVisual === "afterburner_heat" || visual.solutionVisual === "sealed_jet" || phase === "CLIMAX") {
          p.jet.position.y = 0.56 + Math.sin(tSec * 4) * 0.05;
        }
      }
      if (p.airArrows) p.airArrows.visible = !showMacro;
      if (p.jetPin) p.jetPin.visible = !showMacro;
      if (p.fuelPuddle) p.fuelPuddle.visible = !showMacro && (visual.problemVisual === "fuel_leak" || sceneNum === 1);
      if (p.plateRig) {
        p.plateRig.visible = showMacro;
        if (Array.isArray(p.plateRig.userData?.tiles)) {
          const animGap = isExpanded ? THREE.MathUtils.lerp(1.18, 1.01, Math.min(1, sceneElapsedSec * 1.1)) : 1.18;
          p.plateRig.userData.tiles.forEach((t) => {
            t.mesh.position.set(t.col * t.tw * animGap, 0.07, t.row * t.td * animGap);
          });
        }
      }
    }

    // Animate any curated VT vector_arrows (shared across worlds)
    for (const vecGroup of p.curatedVectors || []) {
      const va = vecGroup?.userData?.vectorArrows;
      if (!va || !vecGroup.visible) continue;
      va.arrows.forEach((ar) => {
        const u = (ar.tOffset + tSec * (va.speed || 1.8) * 0.42) % 1;
        ar.mesh.position.set(
          va.from.x + (va.to.x - va.from.x) * u,
          va.from.y + (va.to.y - va.from.y) * u,
          va.from.z + (va.to.z - va.from.z) * u
        );
        ar.mesh.scale.setScalar(0.85 + Math.sin(u * Math.PI) * 0.35);
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}
