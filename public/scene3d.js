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

// ============================================================================
// 4. MAIN MAOU 3D DIORAMA STAGE v3 (@untabiru5 x @dhotscliper + GEMINI 3D!)
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

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    this.camera.position.set(0.32, 1.38, 2.28);
    this.cameraTarget = new THREE.Vector3(0, 0.5, 0.05);
    this.camPosGoal = new THREE.Vector3(0.32, 1.38, 2.28);
    this.camLookGoal = new THREE.Vector3(0, 0.5, 0.05);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.18);
    this.scene.add(hemi);

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

    const fill = new THREE.DirectionalLight(0xbae6fd, 0.52);
    fill.position.set(-4, 3.5, 2.5);
    this.scene.add(fill);

    this.brickTex = createBrickTexture();
    this.tileTex = createTileTexture();
    this.woodTex = createWoodTexture();
    this.soilTex = createSoilTexture();
    this.meshFenceTex = createWireMeshTexture();
    this.arowanaTex = createArowanaScaleTexture();
    this.solarTex = createSolarGridTexture();
    this.capTex = createCapacitorLabelTexture();

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
  }

  get domElement() {
    return this.renderer.domElement;
  }

  clearDiorama() {
    this.dioramaGroup.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
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
  }

  // Unified @untabiru5 / @dhotscliper Environments (Surface ALWAYS aligned cleanly at Y = 0.0!)
  buildEnvironmentStage(envType) {
    if (envType === "kitchen_tile") {
      this.scene.background = new THREE.Color(0xfff7ed);
      this.scene.fog = new THREE.FogExp2(0xfff7ed, 0.02);

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
    } else if (envType === "backyard_cutaway") {
      this.scene.background = new THREE.Color(0xbae6fd);
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.018);

      const soilBlock = new THREE.Mesh(
        new THREE.BoxGeometry(8.2, 1.25, 6.2),
        new THREE.MeshStandardMaterial({ map: this.soilTex, roughness: 0.9 })
      );
      soilBlock.position.set(0, -0.66, 0.2);
      soilBlock.receiveShadow = true;
      this.dioramaGroup.add(soilBlock);

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
    } else if (envType === "farm_trench") {
      this.scene.background = new THREE.Color(0x7dd3fc);
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.02);

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

      // Horizon hut, coconut palm trees & Merah-Putih flag (ref_3.jpg!)
      const hutBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.7, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 })
      );
      hutBody.position.set(-1.65, 0.35, -4.1);
      this.dioramaGroup.add(hutBody);
      const hutRoof = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 0.55, 4),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
      );
      hutRoof.position.set(-1.65, 0.96, -4.1);
      hutRoof.rotation.y = Math.PI / 4;
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
      this.scene.background = new THREE.Color(0x93c5fd);
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.02);
      const lawn = new THREE.Mesh(
        new THREE.BoxGeometry(9.0, 0.7, 7.0),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8 })
      );
      lawn.position.set(0, -0.35, 0);
      lawn.receiveShadow = true;
      this.dioramaGroup.add(lawn);
    } else {
      // wood_desk (ref_2.jpg Sunlit Workbench Studio!)
      this.scene.background = new THREE.Color(0xfefce8);
      this.scene.fog = new THREE.FogExp2(0xfefce8, 0.018);

      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(8.5, 4.8, 0.25),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.75 })
      );
      backWall.position.set(0, 1.9, -2.25);
      backWall.receiveShadow = true;
      this.dioramaGroup.add(backWall);

      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(7.6, 0.72, 4.2),
        new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.45 })
      );
      desk.position.set(0, -0.36, 0.15);
      desk.receiveShadow = true;
      this.dioramaGroup.add(desk);
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
        : hero === "rice_fish"
        ? "farm_trench"
        : hero === "rocket"
        ? "outdoor_sky"
        : "wood_desk");

    this.buildEnvironmentStage(envType);

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
        hero !== "rice_fish")
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
      return;
    }

    // C. CURATED KIPAS ANGIN & SLOTTED COPPER STATOR DIORAMA (Exact ref_2.jpg!)
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
      if (o.kind === "glass_tank") {
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
      mesh.castShadow = !o.glass;
      mesh.receiveShadow = true;
      this.dioramaGroup.add(mesh);

      this.customNodes.push({
        mesh,
        baseX: o.x || 0,
        baseY: o.y ?? 0.45,
        baseZ: o.z || 0,
        baseRx: o.rx || 0,
        baseRy: o.ry || 0,
        baseRz: o.rz || 0,
        kind: o.kind,
        enter: o.enter || "pop",
        motion: o.motion || "none",
        speed: o.speed || 2.5,
        seed: idx * 0.9
      });
    });
  }

  // ============================================================================
  // 6. PER-FRAME 60 FPS TIMELINE + CAMERA CUTS + WORKER ACTION
  // ============================================================================
  renderFrame(sceneData, topicText, tSec, sceneElapsedSec = 1.0) {
    const visual = sceneData?.visual || {};
    const phase = sceneData?.phase || "HOOK";
    const sceneNum = sceneData?.sceneNumber || 1;
    const hero = visual.heroObject || "custom_stage";
    const worldKey =
      hero === "custom_stage"
        ? `custom::${topicText}::${sceneNum}`
        : `${hero}::${visual.setting || "std"}`;

    this.buildDiorama(worldKey, sceneData, topicText);

    // 1. CINEMATIC @UNTABIRU5 CAMERA CUTS & SMOOTH DOLLY
    const shot = visual.stage3d?.cameraShot || "closeup_hands";
    const shakeX = phase === "TAPI" && sceneElapsedSec < 0.8 ? Math.sin(tSec * 52) * 0.08 * (1 - sceneElapsedSec / 0.8) : 0;
    const shakeY = phase === "TAPI" && sceneElapsedSec < 0.8 ? Math.cos(tSec * 44) * 0.05 * (1 - sceneElapsedSec / 0.8) : 0;

    if (shot === "isometric_cutaway") {
      this.camPosGoal.set(2.05 + Math.sin(tSec * 0.45) * 0.28, 2.25, 2.95);
      this.camLookGoal.set(0, 0.25, 0.05);
    } else if (shot === "corridor_view") {
      this.camPosGoal.set(Math.sin(tSec * 0.5) * 0.18, 1.35, 3.25 - Math.min(0.45, sceneElapsedSec * 0.12));
      this.camLookGoal.set(0, 0.5, -0.6);
    } else if (shot === "hero_low") {
      this.camPosGoal.set(Math.sin(tSec * 0.6) * 1.15, 1.15, 2.95);
      this.camLookGoal.set(0, 0.62, 0);
    } else if (shot === "side_inspection") {
      this.camPosGoal.set(-1.75 + Math.cos(tSec * 0.5) * 0.2, 1.48, 2.35);
      this.camLookGoal.set(0, 0.52, 0.05);
    } else if (shot === "disaster_shake") {
      this.camPosGoal.set(0.32 + shakeX, 1.45 + shakeY, 2.38);
      this.camLookGoal.set(0, 0.52, 0.05);
    } else {
      this.camPosGoal.set(0.34 + Math.sin(tSec * 0.4) * 0.2, 1.35, 2.28 - Math.min(0.18, sceneElapsedSec * 0.06));
      this.camLookGoal.set(0, 0.5, 0.08);
    }

    this.camera.position.lerp(this.camPosGoal, 0.08);
    this.cameraTarget.lerp(this.camLookGoal, 0.08);
    this.camera.lookAt(this.cameraTarget);

    // 2. ANIMATE "IPUL" BEHIND EXPERIMENT
    const wk = this.worker;
    const action = visual.workerAction || (phase === "TAPI" ? "panic" : phase === "CLIMAX" ? "celebrate" : "build");
    wk.root.position.set(0, -0.32, -0.88);
    if (this.worker.capingHat.visible) wk.root.position.set(-0.55, 0, 0.25);

    wk.flameTip.visible = action === "heat";
    wk.basketRim.visible = this.worker.capingHat.visible;

    if (action === "panic" || phase === "TAPI") {
      wk.hips.position.y = 0.68 + Math.abs(Math.sin(tSec * 12)) * 0.1;
      wk.leftArm.rotation.x = -2.35 + Math.sin(tSec * 15) * 0.4;
      wk.rightArm.rotation.x = -2.35 - Math.sin(tSec * 15) * 0.4;
      wk.head.rotation.y = Math.sin(tSec * 12) * 0.3;
      wk.toolGroup.visible = false;
    } else if (action === "celebrate" || phase === "CLIMAX") {
      wk.hips.position.y = 0.68 + Math.abs(Math.sin(tSec * 7.5)) * 0.14;
      wk.leftArm.rotation.x = -2.65;
      wk.rightArm.rotation.x = -2.65;
      wk.head.rotation.y = Math.sin(tSec * 3) * 0.15;
      wk.toolGroup.visible = false;
    } else {
      const w = Math.sin(tSec * 5.2);
      wk.hips.position.y = 0.68 + Math.abs(w) * 0.025;
      wk.hips.rotation.x = 0.18 + w * 0.06;
      wk.rightArm.rotation.x = -1.18 + w * 0.42;
      wk.rightArm.rotation.z = Math.cos(tSec * 5.2) * 0.2;
      wk.leftArm.rotation.x = -1.05 - w * 0.3;
      wk.head.rotation.x = 0.22 + w * 0.06;
      wk.toolGroup.visible = action === "stir" || action === "heat" || this.worker.capingHat.visible;
    }

    // 3. ANIMATE CUSTOM GEMINI 3D TIMELINE OBJECTS
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

      if (node.motion === "float" || node.motion === "bob") ey += Math.sin(tSec * 2.8 + node.seed) * 0.09;
      if (node.motion === "shake") {
        ex += Math.sin(tSec * 48 + node.seed) * 0.045;
        ez += Math.cos(tSec * 42 + node.seed) * 0.025;
      }
      if (node.motion === "pulse") scale *= 1 + Math.sin(tSec * 4.5 + node.seed) * 0.07;

      node.mesh.position.set(ex, ey, ez);
      node.mesh.scale.setScalar(scale);

      if (node.mesh.userData?.spinChild) {
        node.mesh.userData.spinChild.rotation.z = tSec * 9.5;
      }
      if (node.kind === "fan" || node.kind === "gear") {
        node.mesh.rotation.z = tSec * (node.motion === "spin_reverse" ? -Math.abs(node.speed) : node.speed);
      } else if (node.motion === "spin") {
        node.mesh.rotation.y = node.baseRy + tSec * node.speed;
      } else if (node.motion === "spin_reverse") {
        node.mesh.rotation.y = node.baseRy - tSec * Math.abs(node.speed);
      }
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
    }

    this.renderer.render(this.scene, this.camera);
  }
}
