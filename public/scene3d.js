// MaouEdu 3D Video World Engine v2 (Three.js WebGL)
// High-Craft @untabiru5 x @dhotscliper 3D Diorama Storytelling + Gemini 3D Choreography Compiler!
// Note: 2D Anime MC Raja Iblis & yellow-pill subtitles always composite outside this 3D video in app.js.

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// ============================================================================
// 1. PROCEDURAL TEXTURES (@untabiru5 Brick, Tile, Oak Desk, Soil, Fish Scales)
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
  g.fillStyle = "#c97d3b";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 6) {
    g.fillStyle = y % 18 === 0 ? "rgba(92, 42, 12, 0.24)" : "rgba(255, 224, 178, 0.14)";
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
  for (let i = 0; i < 110; i++) {
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
  g.lineWidth = 5;
  for (let i = 0; i <= 128; i += 16) {
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
  tex.repeat.set(6, 2);
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
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xedb98f, roughness: 0.48 });
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
    new THREE.ConeGeometry(0.56, 0.24, 24),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 })
  );
  capingCone.castShadow = true;
  capingGroup.add(capingCone);
  const capingRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.018, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0x141824 })
  );
  capingRim.rotation.x = Math.PI / 2;
  capingRim.position.y = -0.11;
  capingGroup.add(capingRim);
  capingGroup.position.set(0, 0.21, 0);
  capingGroup.visible = false;
  head.add(capingGroup);

  // White Chef Hat
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

  // Articulated Arms + Tactile Big Peach Spherical Hands (ref_2.jpg!)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 0.46, 0);
  hips.add(leftArm);
  const laMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.32, 6, 10), hoodieMat);
  laMesh.position.y = -0.19;
  laMesh.castShadow = true;
  leftArm.add(laMesh);
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), skinMat);
  lHand.position.y = -0.4;
  lHand.castShadow = true;
  leftArm.add(lHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 0.46, 0);
  hips.add(rightArm);
  const raMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.32, 6, 10), hoodieMat);
  raMesh.position.y = -0.19;
  raMesh.castShadow = true;
  rightArm.add(raMesh);
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), skinMat);
  rHand.position.y = -0.4;
  rHand.castShadow = true;
  rightArm.add(rHand);

  // Switchable Right-Hand Tool Group (Bamboo Pole / Blowtorch / Carton / Magnifier)
  const toolGroup = new THREE.Group();
  toolGroup.position.set(0, -0.4, 0.06);
  rightArm.add(toolGroup);
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.85, 8),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.55 })
  );
  stick.position.y = -0.25;
  stick.rotation.x = 0.45;
  toolGroup.add(stick);

  const flameTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.16, 8),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  flameTip.position.set(0, -0.64, -0.16);
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
    flameTip,
    capingHat: capingGroup,
    chefHat
  };
}

// ============================================================================
// 3. DETAILED 3D FISH, GEAR, FAN & COIL BUILDERS
// ============================================================================
function createFishMesh(species = "arowana", colorHex = "#ef4444", scaleTex = null) {
  const g = new THREE.Group();
  const baseColor = new THREE.Color(colorHex || (species === "betta" ? "#2563eb" : "#ef4444"));

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
    return { group: g, tail, dorsal };
  }

  // Scaled Arowana / Golden Carp (matches ref_1.jpg & ref_3.jpg!)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: species === "orange_fish" ? 0xf97316 : baseColor,
    map: species === "arowana" && scaleTex ? scaleTex : null,
    roughness: 0.28,
    metalness: 0.2
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), bodyMat);
  body.scale.set(species === "arowana" ? 1.95 : 1.45, 0.48, 0.32);
  body.castShadow = true;
  g.add(body);

  const finMat = new THREE.MeshStandardMaterial({
    color: species === "orange_fish" ? 0xfb923c : 0xf43f5e,
    roughness: 0.35
  });
  const tail = new THREE.Mesh(new THREE.CircleGeometry(0.15, 10, -Math.PI * 0.4, Math.PI * 0.8), finMat);
  tail.position.set(species === "arowana" ? -0.44 : -0.32, 0, 0);
  tail.rotation.y = Math.PI;
  tail.material.side = THREE.DoubleSide;
  g.add(tail);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeMat);
  e1.position.set(species === "arowana" ? 0.33 : 0.22, 0.03, 0.06);
  g.add(e1);
  const e2 = e1.clone();
  e2.position.z = -0.06;
  g.add(e2);
  return { group: g, tail };
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

// ============================================================================
// 4. MAIN MAOU 3D DIORAMA STAGE v2 (@untabiru5 x @dhotscliper + GEMINI 3D!)
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
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfff7ed);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    this.camera.position.set(0.35, 1.45, 2.45);
    this.cameraTarget = new THREE.Vector3(0, 0.5, 0.05);
    this.camPosGoal = new THREE.Vector3(0.35, 1.45, 2.45);
    this.camLookGoal = new THREE.Vector3(0, 0.5, 0.05);

    // Bright Daylight @untabiru5 Global Studio Lighting + Tight Sharp Sun Shadows!
    const hemi = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.15);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.6);
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

    const fill = new THREE.DirectionalLight(0xbae6fd, 0.5);
    fill.position.set(-4, 3.5, 2.5);
    this.scene.add(fill);

    this.brickTex = createBrickTexture();
    this.tileTex = createTileTexture();
    this.woodTex = createWoodTexture();
    this.soilTex = createSoilTexture();
    this.meshFenceTex = createWireMeshTexture();
    this.arowanaTex = createArowanaScaleTexture();
    this.capTex = createCapacitorLabelTexture();

    this.worker = createHumanWorkerRig();
    this.worker.root.position.set(0.0, 0.0, -0.95);
    this.scene.add(this.worker.root);

    this.dioramaGroup = new THREE.Group();
    this.scene.add(this.dioramaGroup);

    this.activeKey = "";
    this.dioramaParts = {};
    this.customNodes = [];
    this.customFlows = [];
    this.customParticles = [];
    this.envGroundY = 0;
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

  // Unified @untabiru5 / @dhotscliper Environments — Surface ALWAYS aligns cleanly at Y = 0.0!
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

      // Sunny blue window pane on left wall!
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
      this.envGroundY = -0.35;
    } else if (envType === "backyard_cutaway") {
      // ref_1.jpg Exact Isometric Cutaway Ground + Red Brick House + Lawn!
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
      this.envGroundY = 0;
    } else if (envType === "farm_trench") {
      // ref_3.jpg Rice Paddy Valley + Village Huts + Palm + Indonesian Flag!
      this.scene.background = new THREE.Color(0x7dd3fc);
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.022);

      const soilBase = new THREE.Mesh(
        new THREE.BoxGeometry(9.0, 0.8, 8.5),
        new THREE.MeshStandardMaterial({ map: this.soilTex, roughness: 0.9 })
      );
      soilBase.position.set(0, -0.75, -1.0);
      soilBase.receiveShadow = true;
      this.dioramaGroup.add(soilBase);

      // Left & Right Elevated Earth Bunds framing the water ditch
      const bankMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8 });
      [-1.55, 1.55].forEach((bx) => {
        const bank = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.38, 7.6), bankMat);
        bank.position.set(bx, -0.15, -0.6);
        bank.receiveShadow = true;
        this.dioramaGroup.add(bank);
      });

      // Horizon hut & Merah-Putih Flagpole in the distance
      const hutBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.7, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 })
      );
      hutBody.position.set(-1.55, 0.35, -4.1);
      this.dioramaGroup.add(hutBody);
      const hutRoof = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 0.55, 4),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
      );
      hutRoof.position.set(-1.55, 0.96, -4.1);
      hutRoof.rotation.y = Math.PI / 4;
      this.dioramaGroup.add(hutRoof);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.9, 6),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
      );
      pole.position.set(-0.9, 0.95, -4.4);
      this.dioramaGroup.add(pole);
      const flagRed = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.02), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      flagRed.position.set(-0.68, 1.76, -4.4);
      this.dioramaGroup.add(flagRed);
      const flagWhite = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      flagWhite.position.set(-0.68, 1.62, -4.4);
      this.dioramaGroup.add(flagWhite);
      this.envGroundY = 0;
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
      this.envGroundY = 0;
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
      this.envGroundY = -0.35;
    }
  }

  // ============================================================================
  // 5. CURATED @UNTABIRU5 / @DHOTSCLIPER WORLDS + GEMINI CUSTOM 3D COMPILER
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
    if (hero === "custom_stage" || (Array.isArray(s3d.objects) && s3d.objects.length >= 2 && hero !== "ice_cream" && hero !== "betta_fish" && hero !== "arowana_fish" && hero !== "fan_blades" && hero !== "rice_fish")) {
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

    // C. CURATED KIPAS ANGIN & STATOR COPPER COIL DIORAMA (ref_2.jpg!)
    if (hero === "fan_blades") {
      const motorGroup = new THREE.Group();
      motorGroup.position.set(0, 0.72, 0.08);
      this.dioramaGroup.add(motorGroup);
      this.dioramaParts.motorGroup = motorGroup;

      // Brown Wooden Mounting Feet sitting right on desk!
      [-0.42, 0.42].forEach((mx) => {
        const foot = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.26, 0.74),
          new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 })
        );
        foot.position.set(mx, -0.59, 0);
        foot.castShadow = true;
        motorGroup.add(foot);
      });

      // Thick Laminated Gray Steel Stator Ring + Inner Winding Teeth (ref_2.jpg!)
      const statorOuter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.66, 0.66, 0.46, 32, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.68, roughness: 0.32, side: THREE.DoubleSide })
      );
      statorOuter.rotation.x = Math.PI / 2;
      statorOuter.castShadow = true;
      motorGroup.add(statorOuter);

      const statorRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.12, 14, 32),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.35 })
      );
      motorGroup.add(statorRing);

      // Glossy Copper Wire Windings around inner Stator Slots!
      const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.78, roughness: 0.22 });
      const frontWire = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 10, 28), copperMat);
      frontWire.position.z = 0.2;
      motorGroup.add(frontWire);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(0.11, 0.18, 0.44),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xc2410c : 0x64748b, metalness: 0.55, roughness: 0.35 })
        );
        slot.position.set(Math.cos(ang) * 0.42, Math.sin(ang) * 0.42, 0);
        slot.rotation.z = ang;
        motorGroup.add(slot);
      }

      const rotorPivot = buildFanMesh(0.56, 3, visual.accentColor || "#38bdf8");
      rotorPivot.position.z = 0.26;
      motorGroup.add(rotorPivot);
      this.dioramaParts.rotorPivot = rotorPivot;

      // Crisp 1.5 uF Capacitor Box on right side!
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.52, 0.32),
        new THREE.MeshStandardMaterial({ map: this.capTex, roughness: 0.35 })
      );
      cap.position.set(1.05, -0.46, 0.18);
      cap.castShadow = true;
      motorGroup.add(cap);
      this.dioramaParts.capacitor = cap;
      return;
    }

    // D. CURATED ARWANA POND / CUPANG AQUARIUM DIORAMA (ref_1.jpg!)
    if (hero === "arowana_fish" || hero === "betta_fish" || hero === "ornamental_fish" || hero === "catfish") {
      const isCupang = hero === "betta_fish";
      const isPond = envType === "backyard_cutaway";

      const tankGroup = new THREE.Group();
      this.dioramaGroup.add(tankGroup);

      const tw = isCupang ? 1.85 : 2.35;
      const th = isCupang ? 1.1 : 1.0;
      const td = isCupang ? 1.15 : 1.35;

      // Cream Stone Tile Coping Rim + Front Cutaway Wall around Pond (ref_1.jpg!)
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

        const tileMat = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.7 });
        [-td / 2 - 0.04, td / 2 + 0.04].forEach((tz) => {
          const rim = new THREE.Mesh(new THREE.BoxGeometry(tw + 0.34, 0.09, 0.18), tileMat);
          rim.position.set(0, wallH + 0.04, tz);
          rim.castShadow = true;
          tankGroup.add(rim);
        });
        [-tw / 2 - 0.08, tw / 2 + 0.08].forEach((tx) => {
          const rim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, td + 0.02), tileMat);
          rim.position.set(tx, wallH + 0.04, 0);
          rim.castShadow = true;
          tankGroup.add(rim);
        });

        // Wire Mesh Safety Fence around Rim (ref_1.jpg!)
        const fenceGroup = new THREE.Group();
        const fenceMat = new THREE.MeshBasicMaterial({ map: this.meshFenceTex, transparent: true, side: THREE.DoubleSide });
        const backFence = new THREE.Mesh(new THREE.PlaneGeometry(tw + 0.16, 0.62), fenceMat);
        backFence.position.set(0, wallH + 0.38, -td / 2 - 0.05);
        fenceGroup.add(backFence);
        [-tw / 2 - 0.08, tw / 2 + 0.08].forEach((fx) => {
          const sideFence = new THREE.Mesh(new THREE.PlaneGeometry(td + 0.12, 0.62), fenceMat);
          sideFence.position.set(fx, wallH + 0.38, 0);
          sideFence.rotation.y = Math.PI / 2;
          fenceGroup.add(sideFence);
        });
        tankGroup.add(fenceGroup);
        this.dioramaParts.meshFence = fenceGroup;
      }

      const waterYCenter = isPond ? 0.25 : th / 2;
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.42,
        roughness: 0.08
      });
      const water = new THREE.Mesh(new THREE.BoxGeometry(tw - 0.06, isPond ? 0.4 : th - 0.1, td - 0.06), waterMat);
      water.position.y = waterYCenter;
      tankGroup.add(water);
      this.dioramaParts.waterMat = waterMat;

      // Translucent Glass Edges
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(tw, isPond ? 0.46 : th, td)),
        new THREE.LineBasicMaterial({ color: 0xe0f2fe })
      );
      edges.position.y = waterYCenter;
      tankGroup.add(edges);

      // Clean Sand Floor & Pebbles (ALWAYS above grassLawn y=-0.02!)
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(tw - 0.04, 0.04, td - 0.04),
        new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9 })
      );
      floor.position.y = 0.04;
      floor.receiveShadow = true;
      tankGroup.add(floor);

      // Brown Ketapang Leaf + Divider for Cupang
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
        f.group.scale.setScalar(isCupang ? 0.9 : 0.72);
        f.group.position.set((i - 1) * 0.4, waterYCenter + (i % 2) * 0.12, 0);
        tankGroup.add(f.group);
        fishes.push({ ...f, seed: i * 1.9, waterYCenter });
      }
      this.dioramaParts.fishes = fishes;
      this.dioramaParts.isCupang = isCupang;
      return;
    }

    // E. CURATED SAWAH MINAPADI CORRIDOR (ref_3.jpg!)
    if (hero === "rice_fish") {
      const water = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.22, 7.6),
        new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65, roughness: 0.1 })
      );
      water.position.set(0, -0.22, -0.6);
      this.dioramaGroup.add(water);

      const stalks = [];
      const stalkMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.65 });
      for (let i = 0; i < 42; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const sx = side * (0.72 + ((i * 19) % 10) * 0.14);
        const sz = 2.0 - Math.floor(i / 2) * 0.34;
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.045, 1.35, 6), stalkMat);
        stalk.position.set(sx, 0.52, sz);
        stalk.castShadow = true;
        this.dioramaGroup.add(stalk);
        stalks.push({ mesh: stalk, seed: i * 0.55 });
      }
      this.dioramaParts.stalks = stalks;
      this.dioramaParts.stalkMat = stalkMat;

      const fishes = [];
      for (let i = 0; i < 8; i++) {
        const f = createFishMesh("orange_fish", "#f97316");
        f.group.scale.setScalar(0.5);
        f.group.position.set((i % 2 === 0 ? -0.22 : 0.22), -0.15, 1.2 - i * 0.48);
        f.group.rotation.y = Math.PI / 2;
        this.dioramaGroup.add(f.group);
        fishes.push({ ...f, seed: i * 1.1 });
      }
      this.dioramaParts.fishes = fishes;
      return;
    }

    // Default custom fallback
    this.buildGeminiCustomObjects(s3d.objects || []);
  }

  buildGeminiCustomObjects(objects = []) {
    objects.slice(0, 12).forEach((o, idx) => {
      const baseColor = new THREE.Color(o.color || "#38bdf8");
      const mat = o.glass
        ? new THREE.MeshPhysicalMaterial({ color: baseColor, transparent: true, opacity: 0.38, roughness: 0.1 })
        : new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: o.glow ? baseColor.clone().multiplyScalar(0.45) : new THREE.Color(0x000000),
            metalness: o.metallic ? 0.65 : 0.15,
            roughness: o.metallic ? 0.25 : 0.45
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
      if (o.kind === "cylinder") {
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
        mesh = new THREE.Mesh(new THREE.BoxGeometry(o.w || 0.9, o.h || 0.7, o.d || 0.7), mat);
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
      // closeup_hands (exact ref_2.jpg tight framing with Ipul behind!)
      this.camPosGoal.set(0.34 + Math.sin(tSec * 0.4) * 0.2, 1.35, 2.28 - Math.min(0.18, sceneElapsedSec * 0.06));
      this.camLookGoal.set(0, 0.5, 0.08);
    }

    this.camera.position.lerp(this.camPosGoal, 0.08);
    this.cameraTarget.lerp(this.camLookGoal, 0.08);
    this.camera.lookAt(this.cameraTarget);

    // 2. ANIMATE 3D "IPUL" WORKER BEHIND EXPERIMENT
    const wk = this.worker;
    const action = visual.workerAction || (phase === "TAPI" ? "panic" : phase === "CLIMAX" ? "celebrate" : "build");
    wk.root.position.set(0, -0.32, -0.88);
    if (this.worker.capingHat.visible) wk.root.position.set(-0.55, 0, 0.25);

    wk.flameTip.visible = action === "heat";
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
        const u = ((tSec * 0.9 + it.seed) % 1);
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
      const isSpinning = phase === "JADI" || phase === "CLIMAX" || visual.solutionVisual === "rotating_arrows";
      const isHumming = phase === "TAPI" || visual.problemVisual === "motor_vibrating";
      if (p.rotorPivot) {
        if (isSpinning) p.rotorPivot.rotation.z -= 0.26;
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
          f.group.position.set(sideX + Math.sin(ang) * (p.divider?.visible ? 0.25 : 0.68), f.waterYCenter + Math.cos(tSec * 2 + idx) * 0.08, Math.cos(ang) * 0.32);
          f.group.rotation.y = Math.cos(ang) >= 0 ? 0 : Math.PI;
          f.group.rotation.z = 0;
        }
        if (f.tail) f.tail.rotation.y = Math.PI + Math.sin(tSec * 12 + idx) * 0.35;
      });
    } else if (hero === "rice_fish") {
      if (p.stalkMat) p.stalkMat.color.setHex(phase === "CLIMAX" ? 0xfacc15 : 0x84cc16);
      (p.stalks || []).forEach((s) => {
        s.mesh.rotation.z = Math.sin(tSec * 2.2 + s.seed) * 0.12;
      });
      (p.fishes || []).forEach((f, idx) => {
        f.group.position.z = ((tSec * 0.65 + f.seed) % 4.5) - 2.2;
        if (f.tail) f.tail.rotation.y = Math.PI + Math.sin(tSec * 12 + idx) * 0.35;
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}
