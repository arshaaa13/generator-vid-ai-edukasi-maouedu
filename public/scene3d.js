// MaouEdu 3D Video World Engine (Three.js WebGL)
// PURE @untabiru5 & @dhotscliper Style 3D Experiment Video (Human Worker + Interactive 3D Props)
// The iconic 2D Anime MC Raja Iblis hosts & shows this 3D video from outside (2D Anime layer in app.js)!

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

function createBrickTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#d6c5ad";
  g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) {
    const off = (r % 2) * 32;
    for (let col = -1; col <= 4; col++) {
      g.fillStyle = (r + col) % 2 === 0 ? "#b8432e" : "#9e3624";
      g.fillRect(col * 64 + off + 2, r * 32 + 2, 60, 28);
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
  tex.repeat.set(3, 2);
  return tex;
}

function createWoodTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#c47d3e";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    g.fillStyle = y % 16 === 0 ? "rgba(100, 52, 16, 0.22)" : "rgba(255, 215, 160, 0.16)";
    g.fillRect(0, y, 256, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createSoilTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#85532c";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 95; i++) {
    g.fillStyle = i % 3 === 0 ? "#5c381a" : i % 3 === 1 ? "#a36d40" : "#cfa272";
    g.beginPath();
    g.arc((i * 53) % 256, (i * 97) % 256, 3 + (i % 5), 0, Math.PI * 2);
    g.fill();
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
  g.fillRect(18, 42, 220, 90);
  g.fillStyle = "#ffffff";
  g.font = "900 54px sans-serif";
  g.textAlign = "center";
  g.fillText("1,5 µF", 128, 105);
  g.fillStyle = "#0f172a";
  g.font = "700 32px monospace";
  g.fillText("450V~ AC", 128, 188);
  return new THREE.CanvasTexture(c);
}

// ============================================================================
// ARTICULATED 3D HUMAN WORKER ("Si Manusia" — exact @untabiru5 style!)
// ============================================================================
function createHumanWorkerRig() {
  const root = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xebb88f, roughness: 0.6 });
  const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.55 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.65 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

  const hips = new THREE.Group();
  hips.position.y = 0.66;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.34, 8, 14), hoodieMat);
  torso.position.y = 0.3;
  torso.castShadow = true;
  hips.add(torso);

  const head = new THREE.Group();
  head.position.y = 0.68;
  hips.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 16), skinMat);
  skull.castShadow = true;
  head.add(skull);

  const hairTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.228, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  hairTop.position.y = 0.025;
  head.add(hairTop);

  // Cute round eyes on worker
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMat);
  lEye.position.set(-0.07, 0.02, 0.2);
  head.add(lEye);
  const rEye = lEye.clone();
  rEye.position.x = 0.07;
  head.add(rEye);

  // Farmer Caping Hat (agriculture) & Chef Hat (kitchen_food)
  const capingHat = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.17, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
  );
  capingHat.position.y = 0.2;
  capingHat.visible = false;
  head.add(capingHat);

  const chefHat = new THREE.Group();
  const chefBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.16, 14),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  );
  chefBase.position.y = 0.22;
  chefHat.add(chefBase);
  const chefPuff = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  );
  chefPuff.position.y = 0.34;
  chefHat.add(chefPuff);
  chefHat.visible = false;
  head.add(chefHat);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.1, 0.02, 0);
  hips.add(leftLeg);
  const llMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.38, 6, 10), pantsMat);
  llMesh.position.y = -0.28;
  leftLeg.add(llMesh);
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.2), shoeMat);
  lShoe.position.set(0, -0.54, 0.05);
  leftLeg.add(lShoe);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.1, 0.02, 0);
  hips.add(rightLeg);
  const rlMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.38, 6, 10), pantsMat);
  rlMesh.position.y = -0.28;
  rightLeg.add(rlMesh);
  const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.2), shoeMat);
  rShoe.position.set(0, -0.54, 0.05);
  rightLeg.add(rShoe);

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.26, 0.46, 0);
  hips.add(leftArm);
  const laMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 6, 10), hoodieMat);
  laMesh.position.y = -0.19;
  leftArm.add(laMesh);
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), skinMat);
  lHand.position.y = -0.38;
  leftArm.add(lHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.26, 0.46, 0);
  hips.add(rightArm);
  const raMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 6, 10), hoodieMat);
  raMesh.position.y = -0.19;
  rightArm.add(raMesh);
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), skinMat);
  rHand.position.y = -0.38;
  rightArm.add(rHand);

  // Tool in Right Hand (Whisk/Spoon OR Hoe/Net)
  const toolGroup = new THREE.Group();
  toolGroup.position.set(0, -0.38, 0.08);
  rightArm.add(toolGroup);
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8),
    new THREE.MeshStandardMaterial({ color: 0xb45309 })
  );
  stick.position.y = -0.22;
  stick.rotation.x = 0.5;
  toolGroup.add(stick);

  return { root, hips, head, leftArm, rightArm, leftLeg, rightLeg, toolGroup, capingHat, chefHat };
}

// 3D Fish Mesh Builder — Species Aware! (Halfmoon Betta Cupang vs Long Arowana vs General Fish)
function createFishMesh(isCupang = false, colorHex = "#3b82f6") {
  const g = new THREE.Group();
  const baseColor = new THREE.Color(colorHex || (isCupang ? "#2563eb" : "#ef4444"));
  const bodyMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: baseColor.clone().multiplyScalar(0.25),
    roughness: 0.25,
    metalness: 0.3
  });

  if (isCupang) {
    // Gorgeous Halfmoon Betta Fish (Ikan Cupang) with wide flowing translucent fan fins!
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), bodyMat);
    body.scale.set(1.45, 0.65, 0.42);
    g.add(body);

    const finMat = new THREE.MeshPhysicalMaterial({
      color: baseColor.clone().lerp(new THREE.Color("#f43f5e"), 0.35),
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      roughness: 0.2
    });

    // Huge Flowing Halfmoon Fan Tail!
    const tail = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16, -Math.PI * 0.45, Math.PI * 0.9), finMat);
    tail.position.set(-0.22, 0, 0);
    tail.rotation.y = Math.PI;
    g.add(tail);

    // Top Dorsal Fan Fin
    const dorsal = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12, 0, Math.PI), finMat);
    dorsal.position.set(-0.04, 0.1, 0);
    g.add(dorsal);

    // Bottom Anal Fan Fin
    const anal = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12, Math.PI, Math.PI), finMat);
    anal.position.set(-0.06, -0.09, 0);
    g.add(anal);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), eyeMat);
    e1.position.set(0.18, 0.03, 0.06);
    g.add(e1);
    const e2 = e1.clone();
    e2.position.z = -0.06;
    g.add(e2);

    return { group: g, tail, dorsal };
  }

  // Sleek Long Arowana / General Fish
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), bodyMat);
  body.scale.set(1.85, 0.5, 0.34);
  g.add(body);

  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.24, 5),
    new THREE.MeshStandardMaterial({ color: baseColor.clone().multiplyScalar(0.85) })
  );
  tail.rotation.z = -Math.PI / 2;
  tail.position.x = -0.45;
  g.add(tail);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), eyeMat);
  e1.position.set(0.32, 0.04, 0.07);
  g.add(e1);
  const e2 = e1.clone();
  e2.position.z = -0.07;
  g.add(e2);

  return { group: g, tail };
}

// ============================================================================
// MAIN 3D VIDEO STAGE (PURE @untabiru5 WORLD — NO 3D MC INSIDE!)
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
    this.renderer.toneMappingExposure = 1.18;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbae6fd);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    this.camera.position.set(0.0, 2.8, 5.4);
    this.cameraTarget = new THREE.Vector3(0, 1.0, 0);
    this.camPosGoal = new THREE.Vector3(0.0, 2.8, 5.4);
    this.camLookGoal = new THREE.Vector3(0, 1.0, 0);

    // Bright Cheerful @untabiru5 Edutainment Studio Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x475569, 1.15);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.65);
    sun.position.set(4.5, 9.0, 6.0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0xbae6fd, 0.55);
    fill.position.set(-4, 4, 3);
    this.scene.add(fill);

    this.brickTex = createBrickTexture();
    this.tileTex = createTileTexture();
    this.woodTex = createWoodTexture();
    this.soilTex = createSoilTexture();
    this.capTex = createCapacitorLabelTexture();

    // ONLY the 3D Human Worker performs inside the video! (Our 2D Anime MC hosts from outside!)
    this.worker = createHumanWorkerRig();
    this.worker.root.position.set(0.0, 0.0, -1.0);
    this.scene.add(this.worker.root);

    this.dioramaGroup = new THREE.Group();
    this.scene.add(this.dioramaGroup);

    this.activeKey = "";
    this.dioramaParts = {};
  }

  get domElement() {
    return this.renderer.domElement;
  }

  buildDiorama(worldKey, sceneData) {
    if (this.activeKey === worldKey) return;
    this.activeKey = worldKey;

    while (this.dioramaGroup.children.length > 0) {
      this.dioramaGroup.remove(this.dioramaGroup.children[0]);
    }
    this.dioramaParts = {};

    const worldType = sceneData?.worldType || "lab_science";
    const subjectName = (sceneData?.subjectName || "").toLowerCase();
    const subjectColor = sceneData?.subjectColor || "#38bdf8";

    this.worker.capingHat.visible = worldType === "farm_nature";
    this.worker.chefHat.visible = worldType === "kitchen_food";

    if (worldType === "kitchen_food") {
      // ---- 3D KITCHEN & ICE CREAM / COOKING WORLD ----
      this.scene.background = new THREE.Color(0xfff7ed);
      this.scene.fog = new THREE.FogExp2(0xfff7ed, 0.022);

      // Kitchen Tile Wall Backdrop
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(7.8, 4.6, 0.3),
        new THREE.MeshStandardMaterial({ map: this.tileTex, roughness: 0.6 })
      );
      wall.position.set(0, 2.0, -2.2);
      wall.receiveShadow = true;
      this.dioramaGroup.add(wall);

      // Warm Wooden Kitchen Counter
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(6.8, 0.85, 3.8),
        new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.55 })
      );
      counter.position.set(0, 0.42, 0.1);
      counter.receiveShadow = true;
      this.dioramaGroup.add(counter);

      const station = new THREE.Group();
      station.position.set(0, 0.86, 0.25);
      this.dioramaGroup.add(station);

      // Blue Chilled Outer Bucket (Ice Cubes + Salt Bath!)
      const bucket = new THREE.Mesh(
        new THREE.CylinderGeometry(1.12, 0.92, 0.72, 22, 1, false),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.35 })
      );
      bucket.position.y = 0.36;
      bucket.castShadow = true;
      station.add(bucket);
      this.dioramaParts.iceBucket = bucket;

      // Translucent 3D Ice Cubes & Salt Crystals around inner bowl
      const iceGroup = new THREE.Group();
      const iceMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.85,
        roughness: 0.1
      });
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), iceMat);
        cube.position.set(Math.cos(ang) * 0.86, 0.68, Math.sin(ang) * 0.86);
        cube.rotation.set(i * 0.4, i * 0.7, 0.3);
        iceGroup.add(cube);
      }
      station.add(iceGroup);
      this.dioramaParts.iceGroup = iceGroup;

      // Stainless Steel Inner Mixing Bowl
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.76, 0.54, 0.68, 22),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.78, roughness: 0.22 })
      );
      bowl.position.y = 0.48;
      bowl.castShadow = true;
      station.add(bowl);

      // Liquid / Creamy Mix Inside Bowl
      const mixMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(subjectColor || "#f9a8d4"),
        roughness: 0.25
      });
      const mixSurface = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.12, 20), mixMat);
      mixSurface.position.y = 0.79;
      station.add(mixSurface);
      this.dioramaParts.mixSurface = mixSurface;
      this.dioramaParts.mixMat = mixMat;

      // Rock-Hard Jagged Ice Crystals (shown during TAPI frozen_hard!)
      const hardIceGroup = new THREE.Group();
      const jaggedMat = new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        roughness: 0.12,
        metalness: 0.15,
        transparent: true,
        opacity: 0.92
      });
      for (let s = 0; s < 9; s++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 5), jaggedMat);
        const ang = (s / 9) * Math.PI * 2;
        spike.position.set(Math.cos(ang) * 0.32, 0.95, Math.sin(ang) * 0.32);
        spike.rotation.set((s % 2 - 0.5) * 0.4, s, (s % 3 - 1) * 0.35);
        hardIceGroup.add(spike);
      }
      station.add(hardIceGroup);
      this.dioramaParts.hardIceGroup = hardIceGroup;

      // Spinning Whisk / Mixer Blade!
      const whiskGroup = new THREE.Group();
      whiskGroup.position.set(0, 1.05, 0);
      const whiskShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.75, 10),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
      );
      whiskShaft.position.y = 0.25;
      whiskGroup.add(whiskShaft);
      for (let w = 0; w < 4; w++) {
        const loop = new THREE.Mesh(
          new THREE.TorusGeometry(0.18, 0.016, 6, 16),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
        );
        loop.rotation.y = (w * Math.PI) / 4;
        loop.position.y = -0.15;
        whiskGroup.add(loop);
      }
      station.add(whiskGroup);
      this.dioramaParts.whiskGroup = whiskGroup;

      // 3 Finished 3D Ice Cream Waffle Cones (Shown on CLIMAX / creamy_done!)
      const conesGroup = new THREE.Group();
      const scoopColors = [0xf472b6, 0xfef3c7, 0x34d399];
      [-0.78, 0, 0.78].forEach((cx, idx) => {
        const coneWrap = new THREE.Group();
        coneWrap.position.set(cx, 0.6, 0.45);
        const waffle = new THREE.Mesh(
          new THREE.ConeGeometry(0.24, 0.68, 14),
          new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 })
        );
        waffle.rotation.x = Math.PI;
        waffle.position.y = -0.15;
        coneWrap.add(waffle);

        const scoop1 = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 16, 14),
          new THREE.MeshStandardMaterial({ color: scoopColors[idx], roughness: 0.3 })
        );
        scoop1.position.y = 0.26;
        coneWrap.add(scoop1);

        const scoop2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.21, 14, 12),
          new THREE.MeshStandardMaterial({ color: scoopColors[(idx + 1) % 3], roughness: 0.3 })
        );
        scoop2.position.y = 0.56;
        coneWrap.add(scoop2);

        const cherry = new THREE.Mesh(
          new THREE.SphereGeometry(0.065, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.15 })
        );
        cherry.position.y = 0.79;
        coneWrap.add(cherry);
        conesGroup.add(coneWrap);
      });
      station.add(conesGroup);
      this.dioramaParts.conesGroup = conesGroup;

      // Rising Frosty Mist Particles
      const frostParticles = [];
      const mistMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.65 });
      for (let m = 0; m < 16; m++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mistMat);
        p.position.set((Math.random() - 0.5) * 1.4, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 1.2);
        station.add(p);
        frostParticles.push({ mesh: p, seed: m * 0.7 });
      }
      this.dioramaParts.frostParticles = frostParticles;
    } else if (worldType === "aquarium_fish") {
      // ---- 3D AQUARIUM / POND WORLD (SPECIES-AWARE: CUPANG vs ARWANA vs KOI/LELE!) ----
      const isCupang = subjectName.includes("cupang") || subjectName.includes("betta");
      const isPond = subjectName.includes("kolam") && !subjectName.includes("aquarium");

      this.scene.background = new THREE.Color(isPond ? 0xbae6fd : 0x111827);
      this.scene.fog = new THREE.FogExp2(isPond ? 0xbae6fd : 0x111827, 0.025);

      if (isPond) {
        // Backyard Dirt + Grass + Brick House (@untabiru5 Video 1!)
        const soilBlock = new THREE.Mesh(
          new THREE.BoxGeometry(7.2, 1.3, 5.2),
          new THREE.MeshStandardMaterial({ map: this.soilTex, roughness: 0.9 })
        );
        soilBlock.position.set(0, -0.68, 0);
        this.dioramaGroup.add(soilBlock);

        const grassTop = new THREE.Mesh(
          new THREE.BoxGeometry(7.3, 0.12, 5.3),
          new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8 })
        );
        grassTop.position.set(0, -0.04, 0);
        this.dioramaGroup.add(grassTop);

        const houseWall = new THREE.Mesh(
          new THREE.BoxGeometry(6.8, 3.2, 0.3),
          new THREE.MeshStandardMaterial({ map: this.brickTex, roughness: 0.85 })
        );
        houseWall.position.set(0, 1.55, -2.45);
        this.dioramaGroup.add(houseWall);
      } else {
        // Clean Indoor Desk for Glass Aquarium (Cupang / Arwana Aquarium!)
        const desk = new THREE.Mesh(
          new THREE.BoxGeometry(6.8, 0.75, 3.8),
          new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.55 })
        );
        desk.position.set(0, 0.35, 0.1);
        desk.receiveShadow = true;
        this.dioramaGroup.add(desk);
      }

      const tankGroup = new THREE.Group();
      tankGroup.position.set(0, isPond ? 0.35 : 0.82, 0.2);
      this.dioramaGroup.add(tankGroup);

      // Tank Size (Sleek Cube/Rect for Cupang, Wide Long Tank for Arwana)
      const tw = isCupang ? 2.15 : 2.65;
      const th = isCupang ? 1.35 : 1.18;
      const td = isCupang ? 1.35 : 1.38;

      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.42,
        roughness: 0.1
      });
      const water = new THREE.Mesh(new THREE.BoxGeometry(tw - 0.08, th - 0.14, td - 0.08), waterMat);
      water.position.y = th / 2 - 0.04;
      tankGroup.add(water);
      this.dioramaParts.waterMat = waterMat;

      // Crisp Glass Frame Edges
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(tw, th, td)),
        new THREE.LineBasicMaterial({ color: 0xe0f2fe })
      );
      edges.position.y = th / 2;
      tankGroup.add(edges);

      // Sand Substrate + Green Aquatic Plants + Daun Ketapang (Almond Leaf for Cupang!)
      const gravel = new THREE.Mesh(
        new THREE.BoxGeometry(tw - 0.06, 0.12, td - 0.06),
        new THREE.MeshStandardMaterial({ color: isCupang ? 0xd6d3d1 : 0x78716c, roughness: 0.9 })
      );
      gravel.position.y = 0.06;
      tankGroup.add(gravel);

      const plantMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });
      [-0.72, -0.55, 0.65].forEach((px, i) => {
        const plant = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.58 + i * 0.1, 6), plantMat);
        plant.position.set(px, 0.35, -0.35 + (i % 2) * 0.25);
        tankGroup.add(plant);
      });

      // Brown Ketapang Leaf floating (for Cupang!)
      const ketapangLeaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.02, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
      );
      ketapangLeaf.position.set(-0.45, th - 0.16, 0.2);
      ketapangLeaf.rotation.y = 0.4;
      tankGroup.add(ketapangLeaf);
      this.dioramaParts.ketapangLeaf = ketapangLeaf;

      // Glass Divider (Sekat Kaca) for Cupang!
      const divider = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, th - 0.08, td - 0.08),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.68 })
      );
      divider.position.set(0, th / 2, 0);
      tankGroup.add(divider);
      this.dioramaParts.divider = divider;

      // Sponge Filter + Rising Bubbles OR 4-Tier Trickle Filter!
      const filterGroup = new THREE.Group();
      if (isCupang) {
        const sponge = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, 0.34, 14),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
        );
        sponge.position.set(tw / 2 - 0.28, 0.24, -0.32);
        filterGroup.add(sponge);
        const tube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 0.72, 10),
          new THREE.MeshStandardMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.75 })
        );
        tube.position.set(tw / 2 - 0.28, 0.62, -0.32);
        filterGroup.add(tube);
      } else {
        filterGroup.position.set(tw / 2 + 0.42, 0, 0);
        for (let tier = 0; tier < 4; tier++) {
          const tray = new THREE.Mesh(
            new THREE.BoxGeometry(0.62, 0.22, 0.62),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.75 })
          );
          tray.position.y = 0.14 + tier * 0.28;
          filterGroup.add(tray);
        }
      }
      tankGroup.add(filterGroup);
      this.dioramaParts.filterGroup = filterGroup;

      // Protective Lid
      const lid = new THREE.Mesh(
        new THREE.BoxGeometry(tw + 0.06, 0.05, td + 0.06),
        new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.45 })
      );
      lid.position.y = th + 0.03;
      tankGroup.add(lid);
      this.dioramaParts.lid = lid;

      // Species-Accurate 3D Fish!
      const fishes = [];
      const count = isCupang ? 2 : 3;
      for (let i = 0; i < count; i++) {
        const fishColor = isCupang ? (i === 0 ? "#2563eb" : "#e11d48") : subjectColor;
        const f = createFishMesh(isCupang, fishColor);
        f.group.position.set(i === 0 ? -0.45 : 0.48, 0.55 + (i % 2) * 0.18, 0.05);
        tankGroup.add(f.group);
        fishes.push({ ...f, seed: i * 2.1, isSecondBetta: isCupang && i === 1 });
      }
      this.dioramaParts.fishes = fishes;
      this.dioramaParts.isCupang = isCupang;

      // Rising Oxygen Bubbles
      const bubbles = [];
      const bMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.7 });
      for (let b = 0; b < 14; b++) {
        const bm = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), bMat);
        bm.position.set(tw / 2 - 0.28 + (Math.random() - 0.5) * 0.2, 0.2 + Math.random(), -0.3);
        tankGroup.add(bm);
        bubbles.push(bm);
      }
      this.dioramaParts.bubbles = bubbles;
    } else if (worldType === "workshop_machine") {
      // ---- 3D WORKSHOP / MOTOR / KIPAS ANGIN / MACHINE WORLD ----
      this.scene.background = new THREE.Color(0xfef3c7);
      this.scene.fog = new THREE.FogExp2(0xfef3c7, 0.025);

      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 0.7, 4.4),
        new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.6 })
      );
      desk.position.set(0, 0.35, 0.1);
      desk.receiveShadow = true;
      this.dioramaGroup.add(desk);

      const motorGroup = new THREE.Group();
      motorGroup.position.set(0, 1.45, 0.25);
      this.dioramaGroup.add(motorGroup);
      this.dioramaParts.motorGroup = motorGroup;

      const stator = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.16, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.72, roughness: 0.32 })
      );
      motorGroup.add(stator);

      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const coil = new THREE.Mesh(
          new THREE.BoxGeometry(0.13, 0.17, 0.24),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xd97706 : 0x16a34a, metalness: 0.6 })
        );
        coil.position.set(Math.cos(ang) * 0.52, Math.sin(ang) * 0.52, 0);
        coil.rotation.z = ang;
        motorGroup.add(coil);
      }

      const rotorPivot = new THREE.Group();
      motorGroup.add(rotorPivot);
      this.dioramaParts.rotorPivot = rotorPivot;

      const bladeMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(subjectColor || "#38bdf8"),
        transparent: true,
        opacity: 0.85,
        roughness: 0.18
      });
      for (let b = 0; b < 3; b++) {
        const bw = new THREE.Group();
        bw.rotation.z = (b * Math.PI * 2) / 3;
        const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.11, 0.58, 10), bladeMat);
        blade.scale.set(1, 1, 0.12);
        blade.position.set(0, 0.45, 0.2);
        bw.add(blade);
        rotorPivot.add(bw);
      }

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.62, 0.35),
        new THREE.MeshStandardMaterial({ map: this.capTex, roughness: 0.35 })
      );
      cap.position.set(1.18, -0.45, 0.2);
      motorGroup.add(cap);
      this.dioramaParts.capacitor = cap;
    } else if (worldType === "farm_nature") {
      // ---- 3D FARM / MINAPADI / NATURE WORLD ----
      this.scene.background = new THREE.Color(0xbae6fd);
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.025);

      const field = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 0.3, 5.4),
        new THREE.MeshStandardMaterial({ color: 0x4d7c6f, roughness: 0.25 })
      );
      field.position.set(0, -0.15, -0.2);
      this.dioramaGroup.add(field);

      const path = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.32, 5.4),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.85 })
      );
      path.position.set(0, 0.02, -0.2);
      this.dioramaGroup.add(path);

      const stalks = [];
      const stalkMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.7 });
      for (let r = 0; r < 24; r++) {
        const sx = (r % 6 - 2.5) * 0.75 + (r % 6 >= 3 ? 0.5 : -0.5);
        const sz = -1.6 + Math.floor(r / 6) * 0.85;
        const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.85, 5), stalkMat);
        stalk.position.set(sx, 0.42, sz);
        this.dioramaGroup.add(stalk);
        stalks.push({ mesh: stalk, seed: r * 0.6 });
      }
      this.dioramaParts.stalks = stalks;
      this.dioramaParts.stalkMat = stalkMat;

      const fishes = [];
      for (let i = 0; i < 6; i++) {
        const f = createFishMesh(false, "#f97316");
        f.group.scale.setScalar(0.55);
        f.group.position.set(-1.2 + (i % 3) * 0.9, 0.08, -1.0 + Math.floor(i / 3) * 1.1);
        this.dioramaGroup.add(f.group);
        fishes.push({ ...f, seed: i * 1.2 });
      }
      this.dioramaParts.fishes = fishes;
    } else {
      // ---- UNIVERSAL 3D SCIENCE EXPERIMENT BENCH ----
      this.scene.background = new THREE.Color(0x111827);
      this.scene.fog = new THREE.FogExp2(0x111827, 0.03);

      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(6.8, 0.75, 3.8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.25 })
      );
      bench.position.set(0, 0.35, 0.1);
      this.dioramaGroup.add(bench);

      const labCore = new THREE.Group();
      labCore.position.set(0, 1.4, 0.25);
      this.dioramaGroup.add(labCore);

      const coreMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(subjectColor || "#38bdf8"),
        emissive: new THREE.Color(subjectColor || "#38bdf8").multiplyScalar(0.45),
        metalness: 0.4,
        roughness: 0.2
      });
      const centerObj = new THREE.Mesh(new THREE.OctahedronGeometry(0.54, 1), coreMat);
      labCore.add(centerObj);
      this.dioramaParts.centerCore = centerObj;
      this.dioramaParts.coreMat = coreMat;

      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.95, 0.05, 10, 28),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e })
      );
      labCore.add(ring1);
      this.dioramaParts.ring1 = ring1;
    }
  }

  renderFrame(sceneData, topicText, tSec) {
    const worldType = sceneData?.worldType || "lab_science";
    const subjectName = (sceneData?.subjectName || topicText || "").toLowerCase();
    const worldKey = `${worldType}::${subjectName.includes("cupang") ? "cupang" : subjectName.includes("kolam") ? "pond" : "std"}`;
    this.buildDiorama(worldKey, sceneData);

    const phase = sceneData?.phase || "HOOK";
    const action = sceneData?.workerAction || (phase === "TAPI" ? "panic" : phase === "CLIMAX" ? "celebrate" : "stir");
    const effect = sceneData?.stageEffect || "normal";
    const sceneNum = sceneData?.sceneNumber || 1;

    // 1. CINEMATIC @UNTABIRU5 3D CAMERA (Focused cleanly on the 3D Experiment + Human Worker!)
    if (phase === "HOOK") {
      this.camPosGoal.set(Math.sin(tSec * 0.5) * 0.35, 2.75, 5.1);
      this.camLookGoal.set(0, 1.15, 0.05);
    } else if (phase === "TAPI") {
      this.camPosGoal.set(0.45 + Math.sin(tSec * 0.8) * 0.25, 2.45, 4.35);
      this.camLookGoal.set(0, 1.2, 0.15);
    } else if (phase === "JADI") {
      this.camPosGoal.set(-0.55 + Math.cos(tSec * 0.6) * 0.25, 2.65, 4.65);
      this.camLookGoal.set(0, 1.2, 0.15);
    } else {
      this.camPosGoal.set(Math.sin(tSec * 0.65) * 1.35, 2.7, 4.85);
      this.camLookGoal.set(0, 1.25, 0.15);
    }
    this.camera.position.lerp(this.camPosGoal, 0.06);
    this.cameraTarget.lerp(this.camLookGoal, 0.06);
    this.camera.lookAt(this.cameraTarget);

    // 2. ANIMATE 3D HUMAN WORKER DOING THE EXPERIMENT
    const wk = this.worker;
    const isDeskWorld =
      worldType === "kitchen_food" ||
      worldType === "workshop_machine" ||
      worldType === "lab_science" ||
      (worldType === "aquarium_fish" && !subjectName.includes("kolam"));

    wk.root.position.set(0, isDeskWorld ? 0.58 : 0.02, -0.95);
    wk.root.rotation.y = 0;

    if (action === "panic" || phase === "TAPI") {
      wk.hips.position.y = 0.66 + Math.abs(Math.sin(tSec * 12)) * 0.12;
      wk.leftArm.rotation.x = -2.45 + Math.sin(tSec * 15) * 0.45;
      wk.rightArm.rotation.x = -2.45 - Math.sin(tSec * 15) * 0.45;
      wk.head.rotation.y = Math.sin(tSec * 13) * 0.35;
      wk.toolGroup.visible = false;
    } else if (action === "celebrate" || phase === "CLIMAX") {
      wk.hips.position.y = 0.66 + Math.abs(Math.sin(tSec * 7)) * 0.15;
      wk.leftArm.rotation.x = -2.7;
      wk.rightArm.rotation.x = -2.7;
      wk.head.rotation.y = Math.sin(tSec * 3) * 0.18;
      wk.toolGroup.visible = false;
    } else {
      const w = Math.sin(tSec * 5.8);
      wk.hips.position.y = 0.66 + Math.abs(w) * 0.03;
      wk.hips.rotation.x = 0.16 + w * 0.08;
      wk.rightArm.rotation.x = -1.15 + w * 0.55;
      wk.rightArm.rotation.z = Math.cos(tSec * 5.8) * 0.22;
      wk.leftArm.rotation.x = -0.95 - w * 0.35;
      wk.head.rotation.x = 0.25 + w * 0.08;
      wk.toolGroup.visible = true;
    }

    // 3. ANIMATE WORLD-SPECIFIC 3D PROPS
    const p = this.dioramaParts;
    if (worldType === "kitchen_food") {
      const isFrozen = effect === "frozen_hard" || (phase === "TAPI" && sceneNum <= 2);
      const isDone = phase === "CLIMAX" || effect === "creamy_done";
      const isChurning = action === "stir" || effect === "spinning" || phase === "JADI";

      if (p.hardIceGroup) p.hardIceGroup.visible = isFrozen;
      if (p.conesGroup) {
        p.conesGroup.visible = isDone;
        p.conesGroup.rotation.y = Math.sin(tSec * 1.4) * 0.2;
      }
      if (p.iceBucket) p.iceBucket.visible = sceneNum >= 3 || phase === "JADI" || isDone;
      if (p.iceGroup) p.iceGroup.visible = sceneNum >= 3 || phase === "JADI" || isDone;
      if (p.whiskGroup) {
        p.whiskGroup.visible = !isDone && !isFrozen;
        if (isChurning) {
          p.whiskGroup.rotation.y = tSec * 14;
          p.whiskGroup.position.x = Math.cos(tSec * 4) * 0.18;
          p.whiskGroup.position.z = Math.sin(tSec * 4) * 0.18;
        }
      }
      if (p.mixMat) {
        p.mixMat.color.set(
          isFrozen ? "#bae6fd" : effect === "melting" ? "#fef08a" : sceneData?.subjectColor || "#f9a8d4"
        );
      }
      (p.frostParticles || []).forEach((fp) => {
        fp.mesh.visible = sceneNum >= 2;
        fp.mesh.position.y += 0.015;
        if (fp.mesh.position.y > 2.2) fp.mesh.position.y = 0.8;
      });
    } else if (worldType === "aquarium_fish") {
      const isMurky = effect === "murky" || (phase === "TAPI" && sceneNum >= 3);
      const isFighting = effect === "fighting" || (p.isCupang && phase === "TAPI" && sceneNum === 2);
      const isJumping = effect === "jumping";

      if (p.waterMat) p.waterMat.color.setHex(isMurky ? 0x7c582d : 0x38bdf8);
      if (p.divider) p.divider.visible = p.isCupang && sceneNum >= 3;
      if (p.ketapangLeaf) p.ketapangLeaf.visible = p.isCupang && sceneNum >= 4;
      if (p.filterGroup) p.filterGroup.visible = sceneNum >= 3;
      if (p.lid) p.lid.visible = sceneNum >= 5;

      (p.fishes || []).forEach((f, idx) => {
        if (p.isCupang) {
          if (isFighting) {
            const ang = tSec * 5.2 + idx * Math.PI;
            f.group.position.set(Math.cos(ang) * 0.36, 0.65 + Math.sin(tSec * 8) * 0.08, Math.sin(ang) * 0.25);
            f.group.rotation.y = -ang;
          } else {
            const sideOffset = p.divider?.visible ? (idx === 0 ? -0.52 : 0.52) : 0;
            const swimAng = tSec * 1.4 + f.seed;
            f.group.position.set(
              sideOffset + Math.sin(swimAng) * 0.26,
              0.62 + Math.cos(tSec * 2 + idx) * 0.12,
              Math.cos(swimAng) * 0.26
            );
            f.group.rotation.y = Math.cos(swimAng) >= 0 ? 0 : Math.PI;
          }
          if (f.tail) f.tail.rotation.y = Math.PI + Math.sin(tSec * 10 + idx) * 0.35;
        } else {
          const swimAngle = tSec * 1.4 + f.seed;
          if (isJumping && idx === 0) {
            f.group.position.set(Math.sin(tSec * 1.5) * 0.4, 0.6 + Math.abs(Math.sin(tSec * 3.6)) * 1.1, 0);
            f.group.rotation.z = Math.cos(tSec * 3.6) * 0.85;
          } else {
            f.group.position.set(Math.sin(swimAngle) * 0.85, 0.38 + idx * 0.22, Math.cos(swimAngle) * 0.35);
            f.group.rotation.y = Math.cos(swimAngle) >= 0 ? 0 : Math.PI;
            f.group.rotation.z = 0;
          }
          if (f.tail) f.tail.rotation.y = Math.sin(tSec * 14 + idx) * 0.4;
        }
      });

      (p.bubbles || []).forEach((bm) => {
        bm.visible = sceneNum >= 3;
        bm.position.y += 0.022;
        if (bm.position.y > 1.2) bm.position.y = 0.2;
      });
    } else if (worldType === "workshop_machine") {
      const isSpinning = phase === "JADI" || phase === "CLIMAX" || effect === "spinning";
      const isHumming = phase === "TAPI" || effect === "humming";
      if (p.rotorPivot) {
        if (isSpinning) p.rotorPivot.rotation.z -= 0.24;
        else if (isHumming) p.rotorPivot.rotation.z = Math.sin(tSec * 45) * 0.08;
      }
      if (p.motorGroup) {
        p.motorGroup.position.x = isHumming ? Math.sin(tSec * 50) * 0.04 : 0;
      }
      if (p.capacitor) p.capacitor.visible = sceneNum >= 4;
    } else if (worldType === "farm_nature") {
      if (p.stalkMat) p.stalkMat.color.setHex(phase === "CLIMAX" ? 0xeab308 : 0x84cc16);
      (p.stalks || []).forEach((s) => {
        s.mesh.rotation.z = Math.sin(tSec * 2.4 + s.seed) * 0.12;
      });
      (p.fishes || []).forEach((f, idx) => {
        const ang = tSec * 1.4 + f.seed;
        f.group.position.x = -0.8 + Math.sin(ang) * 0.85;
        f.group.rotation.y = Math.cos(ang) >= 0 ? 0 : Math.PI;
      });
    } else {
      if (p.centerCore) {
        p.centerCore.rotation.y = tSec * 1.4;
        p.centerCore.rotation.x = tSec * 0.8;
      }
      if (p.ring1) p.ring1.rotation.z = tSec * 1.8;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
