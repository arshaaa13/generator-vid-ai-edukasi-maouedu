// MaouEdu Studio MAPPA / Jujutsu Kaisen Anime Sakuga WebGL2 Engine
// Renders 60 FPS Cel-Shaded + Inverted-Hull Ink-Outlined Anime Episodes in 9:16 Portrait:
// - Heroic Shonen Anime Articulated Characters (sculpted hair, glowing painted manga eyes, flowing coat tails, 9 JJK poses)
// - 8 Signature MAPPA Environments (Shibuya Night, Shrine Twilight, Tokyo Rooftop, Domain Expansion, Anime Lab/Kitchen/Workshop, Battlefield)
// - 8 Sakuga VFX Systems (Cursed Energy Aura, Black Flash Red-Black Lightning, Slash Smear Arcs, Domain Rings, Floating Debris)
// - Authentic 2-3 Frame B&W / Black Flash Impact Frames + Satsuei Compositor + Exact 9:16 Safe Portrait Framing!

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import {
  createMappaCelMaterial,
  attachInkOutline,
  createMappaSkyMaterial,
  MappaSatsueiPipeline
} from "/video-engine/anime-cel-shaders.js";
import {
  buildProceduralCustomRig,
  animateProceduralCustomRig
} from "/video-engine/procedural-rig-builder.js";

const SATSUEI_PALETTES = {
  jjk_cursed_blue: {
    zenith: 0x070d24, horizon: 0x172554, lower: 0x050814, accent: 0x38bdf8,
    shadow: "#1e1b4b", rim: "#38bdf8", lightDir: [0.55, 0.85, 0.65], night: 0.85
  },
  shibuya_neon: {
    zenith: 0x09081a, horizon: 0x2e1065, lower: 0x050510, accent: 0xf43f5e,
    shadow: "#1e1b4b", rim: "#38bdf8", lightDir: [-0.45, 0.78, 0.72], night: 0.95
  },
  sukuna_crimson: {
    zenith: 0x1f060c, horizon: 0x881337, lower: 0x120307, accent: 0xfb7185,
    shadow: "#3b0718", rim: "#fb7185", lightDir: [0.62, 0.65, 0.58], night: 0.55
  },
  hollow_purple: {
    zenith: 0x11052c, horizon: 0x581c87, lower: 0x070216, accent: 0xc084fc,
    shadow: "#2e1065", rim: "#c084fc", lightDir: [0.35, 0.9, 0.65], night: 0.9
  },
  shonen_daylight: {
    zenith: 0x1d4ed8, horizon: 0xbae6fd, lower: 0x64748b, accent: 0xfef08a,
    shadow: "#3b4c7a", rim: "#fffbeb", lightDir: [0.65, 0.9, 0.6], night: 0.0
  },
  golden_sunset: {
    zenith: 0x1e293b, horizon: 0xfb923c, lower: 0x451a03, accent: 0xfde047,
    shadow: "#4c1d3d", rim: "#fde047", lightDir: [0.75, 0.55, 0.6], night: 0.15
  },
  emerald_triumph: {
    zenith: 0x064e3b, horizon: 0x34d399, lower: 0x022c22, accent: 0xfde047,
    shadow: "#134e4a", rim: "#6ee7b7", lightDir: [0.5, 0.85, 0.65], night: 0.2
  }
};

function makeAnimeFaceTexture(eyeHex = "#38bdf8", skinHex = "#f5d0b5", expression = "confident") {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");

  // Clean flat anime skin base
  g.fillStyle = skinHex;
  g.fillRect(0, 0, 256, 256);

  // Subtle anime blush / nose shadow
  g.fillStyle = "rgba(217, 119, 102, 0.22)";
  g.fillRect(72, 148, 28, 8);
  g.fillRect(156, 148, 28, 8);
  g.fillStyle = "rgba(120, 72, 58, 0.45)";
  g.beginPath();
  g.moveTo(128, 128);
  g.lineTo(124, 152);
  g.lineTo(131, 152);
  g.closePath();
  g.fill();

  // Sharp Shonen Manga Eyes (Jujutsu Kaisen style: heavy upper lash, luminous colored iris, twin catchlights!)
  const drawEye = (cx, flip) => {
    g.save();
    g.translate(cx, 122);
    g.scale(flip, 1);

    // Sclera
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(-22, -4);
    g.quadraticCurveTo(0, -14, 22, -3);
    g.quadraticCurveTo(6, 12, -18, 9);
    g.closePath();
    g.fill();

    // Glowing Anime Iris
    const irisH = expression === "shock" ? 7 : 10;
    g.fillStyle = eyeHex;
    g.beginPath();
    g.ellipse(1, 0, 9.5, irisH, 0, 0, Math.PI * 2);
    g.fill();

    // Deep Upper Iris Ring & Pupil
    g.fillStyle = "#090a12";
    g.beginPath();
    g.ellipse(1, -1, 4.8, irisH * 0.55, 0, 0, Math.PI * 2);
    g.fill();

    // Twin Crisp Specular Catchlights
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(-3, -4, 3.2, 0, Math.PI * 2);
    g.arc(5, 3, 1.8, 0, Math.PI * 2);
    g.fill();

    // Bold Black Upper Eyelash Ink Stroke
    g.strokeStyle = "#07080d";
    g.lineWidth = 4.5;
    g.beginPath();
    g.moveTo(-24, -2);
    g.quadraticCurveTo(0, -16, 24, -4);
    g.stroke();

    // Sharp Shonen Eyebrow
    g.lineWidth = 3.6;
    g.beginPath();
    if (expression === "fierce") {
      g.moveTo(-22, -22);
      g.lineTo(22, -14);
    } else if (expression === "shock") {
      g.moveTo(-20, -24);
      g.quadraticCurveTo(0, -32, 22, -22);
    } else {
      g.moveTo(-22, -20);
      g.lineTo(22, -17);
    }
    g.stroke();
    g.restore();
  };

  drawEye(96, 1);
  drawEye(160, -1);

  // Expressive Manga Mouth
  g.strokeStyle = "#1c1917";
  g.lineWidth = 3.2;
  g.beginPath();
  if (expression === "fierce" || expression === "shock") {
    g.fillStyle = "#7f1d1d";
    g.ellipse(128, 178, 16, 10, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = "#ffffff";
    g.fillRect(116, 170, 24, 5);
  } else {
    g.moveTo(114, 176);
    g.quadraticCurveTo(130, 184, 144, 173);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function buildHollowLathe(pts, segs = 26) {
  if (typeof THREE.LatheGeometry !== "function") return new THREE.CylinderGeometry(0.4, 0.3, 0.4, 20);
  const v = pts.map(([r, y]) => new THREE.Vector2(Math.max(0.004, r), y));
  const geo = new THREE.LatheGeometry(v, segs);
  geo.computeVertexNormals?.();
  return geo;
}

export class MaouAnimeMappaEngine {
  constructor(width = 720, height = 1280) {
    this.width = width;
    this.height = height;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    this.camera.position.set(0.3, 1.35, 4.6);
    this.lookAtVec = new THREE.Vector3(0, 0.85, 0);

    this.skyMat = createMappaSkyMaterial();
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(56, 24, 16), this.skyMat);
    this.scene.add(this.skyDome);

    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);

    this.satsuei = new MappaSatsueiPipeline(this.renderer, width, height);

    this.activeSceneKey = "";
    this.celMaterials = [];
    this.outlineMaterials = [];
    this.characters = [];
    this.props = [];
    this.vfxNodes = [];
    this.activePalette = SATSUEI_PALETTES.jjk_cursed_blue;
    this.transStartSec = -10;
  }

  get domElement() {
    return this.renderer.domElement;
  }

  captureSnapshotDataUrl(quality = 0.78) {
    try {
      return this.renderer.domElement.toDataURL("image/jpeg", quality);
    } catch {
      return null;
    }
  }

  resize(width, height) {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.satsuei?.resize(width, height);
  }

  makeCel(opts = {}) {
    const p = this.activePalette;
    const mat = createMappaCelMaterial({
      shadowColor: p.shadow,
      rimColor: p.rim,
      lightDir: p.lightDir,
      ...opts
    });
    if (mat.userData?.isMappaCel) this.celMaterials.push(mat);
    return mat;
  }

  addInk(mesh, thickness = 0.016, inkColor = "#07080d") {
    const out = attachInkOutline(mesh, thickness, inkColor);
    if (out?.material?.userData?.isInkOutline) {
      this.outlineMaterials.push(out.material);
    }
    return out;
  }

  clearStage() {
    this.stageGroup.traverse((c) => {
      if (c.isMesh) {
        c.geometry?.dispose?.();
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose?.());
        else c.material?.dispose?.();
      }
    });
    while (this.stageGroup.children.length > 0) {
      this.stageGroup.remove(this.stageGroup.children[0]);
    }
    this.celMaterials = [];
    this.outlineMaterials = [];
    this.characters = [];
    this.props = [];
    this.vfxNodes = [];
  }

  applySatsueiPalette(moodKey) {
    const p = SATSUEI_PALETTES[moodKey] || SATSUEI_PALETTES.jjk_cursed_blue;
    this.activePalette = p;
    if (this.skyMat?.uniforms) {
      this.skyMat.uniforms.uZenith.value.setHex(p.zenith);
      this.skyMat.uniforms.uHorizon.value.setHex(p.horizon);
      this.skyMat.uniforms.uLower.value.setHex(p.lower);
      this.skyMat.uniforms.uAccent.value.setHex(p.accent);
      this.skyMat.uniforms.uNight.value = p.night;
    }
  }

  // ============================================================================
  // HEROIC SHONEN ANIME CHARACTER RIG (Jujutsu Kaisen / Maou Vaelen Proportions)
  // ============================================================================
  buildAnimeCharacterRig(spec) {
    const root = new THREE.Group();
    const skinMat = this.makeCel({ color: "#f6d2b6", rimColor: spec.auraColor, rimIntensity: 0.75, specStrength: 0.12, hatchStrength: 0.25 });
    const coatMat = this.makeCel({ color: spec.outfitColor || "#111827", rimColor: spec.auraColor, rimIntensity: 1.25, specStrength: 0.25 });
    const accentMat = this.makeCel({ color: spec.accentColor || "#f59e0b", rimColor: "#fffbeb", rimIntensity: 0.9, specStrength: 0.6 });
    const hairMat = this.makeCel({ color: spec.hairColor || "#cbd5e1", rimColor: spec.auraColor, rimIntensity: 1.15, specStrength: 0.65 });
    const streakMat = this.makeCel({ color: spec.streakColor || "#e11d48", rimColor: "#fb7185", rimIntensity: 1.3, specStrength: 0.55 });
    const pantsMat = this.makeCel({ color: "#0f172a", rimColor: spec.auraColor, rimIntensity: 0.85, specStrength: 0.15 });
    const bootMat = this.makeCel({ color: "#18181b", rimColor: spec.auraColor, rimIntensity: 0.9, specStrength: 0.45 });

    // Ground contact ink shadow
    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 22),
      new THREE.MeshBasicMaterial({ color: 0x05060a, transparent: true, opacity: 0.45 })
    );
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.01;
    root.add(shadowDisc);

    // Pelvis (standing feet at Y = 0.0 -> pelvis at Y = 0.84)
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.84;
    root.add(pelvis);

    // Heroic Lean Torso + High Sorcerer Collar + Ruby Pin
    const torso = new THREE.Group();
    pelvis.add(torso);
    const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.52, 16), coatMat);
    chestMesh.position.y = 0.27;
    this.addInk(chestMesh, 0.015);
    torso.add(chestMesh);

    const highCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.165, 0.13, 16, 1, true), coatMat);
    highCollar.position.y = 0.54;
    highCollar.material.side = THREE.DoubleSide;
    torso.add(highCollar);

    // Gold Lapel Lines & Glowing Crimson Brooch
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.38, 0.04), accentMat);
    lapel.position.set(0, 0.28, 0.155);
    torso.add(lapel);
    const brooch = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.042, 0),
      this.makeCel({ color: spec.streakColor || "#e11d48", emissive: 0.9, rimIntensity: 1.4 })
    );
    brooch.position.set(0, 0.44, 0.175);
    torso.add(brooch);

    // Flowing Long Anime Overlord Coat Tails (wind-animated!)
    const coatL = new THREE.Group();
    coatL.position.set(-0.14, 0.04, -0.02);
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.62, 0.06), coatMat);
    tailL.position.set(-0.04, -0.3, -0.04);
    tailL.rotation.z = -0.1;
    this.addInk(tailL, 0.014);
    coatL.add(tailL);
    pelvis.add(coatL);

    const coatR = new THREE.Group();
    coatR.position.set(0.14, 0.04, -0.02);
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.62, 0.06), coatMat);
    tailR.position.set(0.04, -0.3, -0.04);
    tailR.rotation.z = 0.1;
    this.addInk(tailR, 0.014);
    coatR.add(tailR);
    pelvis.add(coatR);

    // Sculpted Shonen Anime Head + Sharp Chin + Painted Glowing Manga Eyes!
    const head = new THREE.Group();
    head.position.y = 0.68;
    torso.add(head);

    const expr =
      spec.animePose === "shock_recoil"
        ? "shock"
        : spec.animePose === "dash_strike" || spec.animePose === "charge_cursed_energy"
        ? "fierce"
        : "confident";
    const faceTex = makeAnimeFaceTexture(spec.eyeColor || "#38bdf8", "#f6d2b6", expr);
    const headMat = this.makeCel({
      color: "#ffffff",
      map: faceTex,
      rimColor: spec.auraColor,
      rimIntensity: 0.7,
      specStrength: 0.08,
      hatchStrength: 0.18
    });
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.185, 22, 18), headMat);
    skull.scale.set(0.92, 1.06, 0.94);
    skull.rotation.y = -Math.PI / 2;
    this.addInk(skull, 0.015);
    head.add(skull);

    // Multi-Layered Spiky Shonen Wolf-Cut Hair + Iconic Crimson Front Streak!
    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.198, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
    hairBack.position.set(0, 0.03, -0.018);
    this.addInk(hairBack, 0.014);
    head.add(hairBack);

    const spikeDefs = [
      [-0.12, 0.17, 0.1, 0.55, 0.15, 0.35, 0.052, 0.18, false],
      [-0.03, 0.19, 0.14, 0.72, 0, 0.05, 0.046, 0.19, true], // Crimson Front Streak!
      [0.08, 0.18, 0.12, 0.6, -0.15, -0.28, 0.052, 0.18, false],
      [-0.17, 0.06, 0.04, 0.25, 0.2, 0.65, 0.045, 0.22, false],
      [0.17, 0.06, 0.04, 0.25, -0.2, -0.65, 0.045, 0.22, false],
      [0.0, 0.18, -0.16, -0.65, 0, 0, 0.075, 0.24, false],
      [-0.11, 0.14, -0.15, -0.5, 0.2, 0.38, 0.065, 0.22, false],
      [0.11, 0.14, -0.15, -0.5, -0.2, -0.38, 0.065, 0.22, false]
    ];
    spikeDefs.forEach(([sx, sy, sz, rx, ry, rz, rad, len, isStreak]) => {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 7), isStreak ? streakMat : hairMat);
      sp.position.set(sx, sy, sz);
      sp.rotation.set(rx, ry, rz);
      this.addInk(sp, 0.011);
      head.add(sp);
    });

    // Iconic Asymmetric Obsidian Horns (Right Intact, Left Broken with Crimson Glow!)
    if (spec.hasHorns) {
      const hornMat = this.makeCel({ color: "#0f0f14", rimColor: "#fb7185", rimIntensity: 1.2, specStrength: 0.6 });
      const rHorn = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.24, 8), hornMat);
      rHorn.position.set(0.11, 0.22, 0.02);
      rHorn.rotation.set(-0.22, 0, -0.35);
      this.addInk(rHorn, 0.01);
      head.add(rHorn);

      const lHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.036, 0.13, 8), hornMat);
      lHorn.position.set(-0.1, 0.18, 0.02);
      lHorn.rotation.set(-0.22, 0, 0.35);
      this.addInk(lHorn, 0.01);
      head.add(lHorn);

      const crackGlow = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.028, 0),
        this.makeCel({ color: "#fb7185", emissive: 1.35, rimColor: "#ffffff", rimIntensity: 1.5 })
      );
      crackGlow.position.set(-0.125, 0.24, 0.01);
      head.add(crackGlow);
    }

    // Articulated Arms (Shoulder -> Upper Arm -> Forearm -> Hand + Cursed Fist Glow!)
    const buildArm = (side) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.23, 0.47, 0);
      torso.add(shoulder);
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.24, 8, 12), coatMat);
      upper.position.y = -0.14;
      this.addInk(upper, 0.013);
      shoulder.add(upper);

      const elbow = new THREE.Group();
      elbow.position.y = -0.28;
      shoulder.add(elbow);
      const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.22, 8, 12), coatMat);
      fore.position.y = -0.12;
      this.addInk(fore, 0.012);
      elbow.add(fore);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), skinMat);
      hand.position.y = -0.26;
      this.addInk(hand, 0.01);
      elbow.add(hand);

      const fistAura = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 12, 10),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(spec.auraColor || "#38bdf8"), transparent: true, opacity: 0.38 })
      );
      fistAura.position.y = -0.26;
      elbow.add(fistAura);

      return { shoulder, elbow, hand, fistAura };
    };
    const leftArm = buildArm(-1);
    const rightArm = buildArm(1);

    // Articulated Heroic Anime Legs & Boots (standing cleanly on Y = 0.0!)
    const buildLeg = (side) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.1, 0, 0);
      pelvis.add(hip);
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.32, 8, 12), pantsMat);
      thigh.position.y = -0.2;
      this.addInk(thigh, 0.013);
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.4;
      hip.add(knee);
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.3, 8, 12), bootMat);
      shin.position.y = -0.19;
      this.addInk(shin, 0.013);
      knee.add(shin);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.22), bootMat);
      foot.position.set(0, -0.39, 0.05);
      this.addInk(foot, 0.011);
      knee.add(foot);
      return { hip, knee };
    };
    const leftLeg = buildLeg(-1);
    const rightLeg = buildLeg(1);

    root.userData.animeRig = { pelvis, torso, head, leftArm, rightArm, leftLeg, rightLeg, coatL, coatR };
    return root;
  }

  // ============================================================================
  // 8 SIGNATURE STUDIO MAPPA ANIME ENVIRONMENTS
  // ============================================================================
  buildAnimeEnvironment(envType) {
    const g = this.stageGroup;
    const accentHex = `#${this.activePalette.accent.toString(16).padStart(6, "0")}`;

    if (envType === "shibuya_night") {
      // Wet Reflective Shibuya Asphalt Street + Crosswalk Stripes + Towering Neon Buildings!
      const road = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.3, 12),
        this.makeCel({ color: "#1e293b", rimIntensity: 0.45, specStrength: 0.8 })
      );
      road.position.set(0, -0.15, -1.0);
      g.add(road);

      const stripeMat = this.makeCel({ color: "#e2e8f0", rimIntensity: 0.3, specStrength: 0.2 });
      for (let x = -2.4; x <= 2.4; x += 0.65) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.015, 1.5), stripeMat);
        st.position.set(x, 0.01, -0.4);
        g.add(st);
      }

      // Towering Shibuya Buildings & Vertical Glowing Anime Neon Signs in background
      const bSpecs = [
        [-2.8, 3.2, -5.2, 1.8, 6.4, 1.8, "#1e293b", "#38bdf8"],
        [-0.9, 3.8, -6.4, 1.9, 7.6, 1.8, "#0f172a", "#f43f5e"],
        [1.1, 3.5, -6.0, 2.0, 7.0, 1.8, "#1e293b", "#a855f7"],
        [2.9, 3.0, -5.0, 1.8, 6.0, 1.8, "#0f172a", "#fbbf24"]
      ];
      bSpecs.forEach(([x, y, z, w, h, d, col, neon]) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.makeCel({ color: col, rimColor: neon, rimIntensity: 0.7 }));
        b.position.set(x, y, z);
        this.addInk(b, 0.024);
        g.add(b);
        const sign = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 2.2, 0.08),
          this.makeCel({ color: neon, emissive: 1.35, rimColor: "#ffffff", rimIntensity: 1.2 })
        );
        sign.position.set(x + (x < 0 ? w * 0.42 : -w * 0.42), 2.3, z + d * 0.52);
        g.add(sign);
      });
      return;
    }

    if (envType === "shrine_twilight") {
      // Iconic Jujutsu Kaisen Crimson Torii Gate & Stone Temple Steps!
      const ground = new THREE.Mesh(
        new THREE.BoxGeometry(11, 0.3, 10),
        this.makeCel({ color: "#3f3835", rimColor: "#fb7185", rimIntensity: 0.5 })
      );
      ground.position.set(0, -0.15, -1.0);
      g.add(ground);

      const toriiMat = this.makeCel({ color: "#be123c", rimColor: "#fda4af", rimIntensity: 1.15 });
      const darkCap = this.makeCel({ color: "#18181b", rimColor: "#fb7185", rimIntensity: 0.8 });
      [-1.35, 1.35].forEach((px) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 3.8, 14), toriiMat);
        pillar.position.set(px, 1.9, -2.8);
        this.addInk(pillar, 0.022);
        g.add(pillar);
      });
      const beamTop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.26, 0.34), darkCap);
      beamTop.position.set(0, 3.72, -2.8);
      this.addInk(beamTop, 0.022);
      const beamSub = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.2, 0.24), toriiMat);
      beamSub.position.set(0, 3.15, -2.8);
      this.addInk(beamSub, 0.02);
      g.add(beamTop, beamSub);
      return;
    }

    if (envType === "domain_expansion") {
      // Surreal Obsidian Mirror Floor + Giant Concentric Glowing Domain Barrier Rings!
      const mirrorFloor = new THREE.Mesh(
        new THREE.CylinderGeometry(6.5, 6.5, 0.16, 36),
        this.makeCel({ color: "#090a14", rimColor: accentHex, rimIntensity: 0.9, specStrength: 0.9 })
      );
      mirrorFloor.position.set(0, -0.08, 0);
      g.add(mirrorFloor);

      const ringMat = this.makeCel({ color: accentHex, emissive: 1.25, rimColor: "#ffffff", rimIntensity: 1.4 });
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.045, 10, 48), ringMat);
      r1.position.set(0, 1.5, -2.4);
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.03, 10, 40), ringMat);
      r2.position.set(0, 1.5, -2.2);
      g.add(r1, r2);

      // Floating Obsidian Domain Monoliths around backdrop
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI * 0.85 + (i / 5) * Math.PI * 0.7;
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 2.2 + (i % 3) * 0.8, 0.42),
          this.makeCel({ color: "#181825", rimColor: accentHex, rimIntensity: 1.1 })
        );
        pillar.position.set(Math.cos(a) * 3.6, 1.3 + (i % 2) * 0.45, Math.sin(a) * 2.8 - 1.5);
        pillar.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.08;
        this.addInk(pillar, 0.02);
        g.add(pillar);
      }
      return;
    }

    if (envType === "anime_kitchen_cafe" || envType === "anime_workshop_studio") {
      const isKitchen = envType === "anime_kitchen_cafe";
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.25, 8),
        this.makeCel({ color: isKitchen ? "#e7dfd3" : "#cbd5e1", rimIntensity: 0.25 })
      );
      floor.position.set(0, -0.125, 0);
      g.add(floor);

      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.86, 1.5),
        this.makeCel({ color: isKitchen ? "#d6b58d" : "#b87a42", rimIntensity: 0.45 })
      );
      counter.position.set(0.35, 0.43, -0.85);
      this.addInk(counter, 0.018);
      g.add(counter);

      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(9, 5.2, 0.25),
        this.makeCel({ color: isKitchen ? "#fbf7f0" : "#ece2d2", rimIntensity: 0.25 })
      );
      wall.position.set(0, 2.5, -2.5);
      g.add(wall);

      const winPane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 1.6),
        this.makeCel({ color: "#dbeafe", emissive: 0.55, rimIntensity: 0.2 })
      );
      winPane.position.set(-1.1, 2.35, -2.35);
      g.add(winPane);
      return;
    }

    if (envType === "tokyo_rooftop") {
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.3, 8),
        this.makeCel({ color: "#cbd5e1", rimColor: "#fef08a", rimIntensity: 0.4 })
      );
      roof.position.set(0, -0.15, -0.5);
      g.add(roof);
      const railMat = this.makeCel({ color: "#475569", rimIntensity: 0.5 });
      for (let x = -3.0; x <= 3.0; x += 1.2) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 8), railMat);
        post.position.set(x, 0.75, -2.2);
        this.addInk(post, 0.012);
        g.add(post);
      }
      const railBar = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.05, 0.05), railMat);
      railBar.position.set(0, 1.48, -2.2);
      g.add(railBar);
      return;
    }

    // Default / anime_lab_hq / shattered_battlefield
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.3, 10),
      this.makeCel({ color: envType === "shattered_battlefield" ? "#475569" : "#1e293b", rimColor: accentHex, rimIntensity: 0.55 })
    );
    deck.position.set(0, -0.15, -0.5);
    g.add(deck);

    // Architectural concrete slabs / energy trusses in background for strong Kling depth cues!
    for (let i = -2; i <= 2; i += 2) {
      const colMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 3.6, 0.38),
        this.makeCel({ color: "#334155", rimColor: accentHex, rimIntensity: 0.85 })
      );
      colMesh.position.set(i * 1.15, 1.8, -3.2);
      if (envType === "shattered_battlefield") colMesh.rotation.z = i * 0.08;
      this.addInk(colMesh, 0.02);
      g.add(colMesh);
    }
  }

  // ============================================================================
  // CEL-SHADED + INK-OUTLINED ANIME SUBJECT PROPS
  // ============================================================================
  buildAnimeSubjectProp(spec) {
    if (spec.prefab === "custom_rig" && spec.customRig) {
      const rig = buildProceduralCustomRig(spec.customRig, (mType, col, em) =>
        this.makeCel({
          color: col,
          emissive: mType === "emissive_neon" ? Math.max(0.9, em) : em * 0.5,
          specStrength: mType === "metal_chrome" ? 0.8 : 0.35
        })
      );
      rig.traverse((c) => {
        if (c.isMesh && !c.userData?.isInkOutlineMesh) this.addInk(c, 0.014);
      });
      return rig;
    }

    const g = new THREE.Group();
    const p = spec.prefab;
    const mainMat = this.makeCel({ color: spec.color || "#38bdf8", specStrength: 0.55 });
    const secMat = this.makeCel({ color: spec.secondaryColor || "#fbbf24", specStrength: 0.65 });
    const glowMat = this.makeCel({ color: spec.color || "#38bdf8", emissive: 1.0, rimIntensity: 1.4 });

    if (p === "hollow_bowl" || p === "ice_cream_bowl" || p === "cooking_pot") {
      const bowlMat = this.makeCel({ color: spec.color || "#e2e8f0", doubleSide: true, specStrength: 0.7 });
      const bowl = new THREE.Mesh(
        buildHollowLathe([
          [0.004, 0.0], [0.3, 0.0], [0.46, 0.14], [0.54, 0.42], [0.49, 0.42], [0.42, 0.14], [0.24, 0.06], [0.004, 0.06]
        ]),
        bowlMat
      );
      this.addInk(bowl, 0.015);
      g.add(bowl);
      const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.35, 0.18, 20), secMat);
      fill.position.y = 0.22;
      g.add(fill);
      if (p === "ice_cream_bowl") {
        [[-0.14, 0.4, 0.04], [0.15, 0.38, 0.04], [0, 0.52, -0.05]].forEach(([sx, sy, sz], i) => {
          const sc = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), this.makeCel({ color: i === 0 ? "#f472b6" : i === 1 ? "#fef3c7" : "#34d399" }));
          sc.position.set(sx, sy, sz);
          this.addInk(sc, 0.012);
          g.add(sc);
        });
      }
      return g;
    }

    if (p === "glass_cup" || p === "coffee_espresso" || p === "chemistry_flask") {
      const cup = new THREE.Mesh(
        buildHollowLathe([[0.004, 0.0], [0.23, 0.0], [0.28, 0.56], [0.24, 0.56], [0.2, 0.06], [0.004, 0.06]]),
        this.makeCel({ color: "#e0f2fe", doubleSide: true, specStrength: 0.9 })
      );
      this.addInk(cup, 0.014);
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.34, 18), mainMat);
      liq.position.y = 0.24;
      g.add(cup, liq);
      return g;
    }

    if (p === "rocket_ship" || p === "aircraft_jet") {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.05, 18), mainMat);
      this.addInk(body, 0.016);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 18), secMat);
      nose.position.y = 0.7;
      this.addInk(nose, 0.014);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.55, 12), this.makeCel({ color: "#f97316", emissive: 1.3 }));
      flame.rotation.x = Math.PI;
      flame.position.y = -0.78;
      g.add(body, nose, flame);
      if (p === "aircraft_jet") g.rotation.x = Math.PI / 2;
      return g;
    }

    if (p === "copper_stator_motor" || p === "turbine_generator") {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.11, 14, 28), mainMat);
      this.addInk(ring, 0.016);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 14), secMat);
      core.rotation.x = Math.PI / 2;
      this.addInk(core, 0.014);
      const blades = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.03), secMat);
        const a = (i / 6) * Math.PI * 2;
        b.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.14);
        b.rotation.z = a;
        this.addInk(b, 0.01);
        blades.add(b);
      }
      g.add(ring, core, blades);
      g.userData.spinPart = blades;
      return g;
    }

    if (p === "asic_miner" || p === "battery_reactor" || p === "glass_aquarium") {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.68, 0.6), mainMat);
      box.position.y = 0.34;
      this.addInk(box, 0.016);
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.64), glowMat);
      core.position.y = 0.36;
      g.add(box, core);
      return g;
    }

    // Iconic Cel-Shaded Energy / Science Core Crystal
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), glowMat);
    crystal.position.y = 0.42;
    this.addInk(crystal, 0.018);
    const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.028, 10, 32), secMat);
    orbitRing.position.y = 0.42;
    this.addInk(orbitRing, 0.01);
    g.add(crystal, orbitRing);
    g.userData.spinPart = orbitRing;
    return g;
  }

  // ============================================================================
  // 8 JUJUTSU KAISEN SAKUGA VFX SYSTEMS
  // ============================================================================
  buildAnimeVfx(vfx) {
    const g = new THREE.Group();
    const o = vfx.origin || [0, 0.85, 0];
    const col = new THREE.Color(vfx.color || "#38bdf8");
    const items = [];

    if (vfx.type === "cursed_energy_aura") {
      // Twin-Layer JJK Cursed Flame Tongues (dark core + electric cel rim!)
      const outerMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.78 });
      const innerMat = new THREE.MeshBasicMaterial({ color: 0x05050a, transparent: true, opacity: 0.85 });
      for (let i = 0; i < 14; i++) {
        const isDark = i % 3 === 0;
        const tongue = new THREE.Mesh(new THREE.ConeGeometry(isDark ? 0.08 : 0.12, isDark ? 0.42 : 0.56, 6), isDark ? innerMat : outerMat);
        g.add(tongue);
        items.push({ mesh: tongue, seed: i * 0.53 });
      }
    } else if (vfx.type === "black_flash_lightning") {
      // Iconic Kokusen: Jagged Crimson + Pitch-Black Branching Spatial Lightning!
      const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const blkMat = new THREE.MeshBasicMaterial({ color: 0x050509 });
      for (let i = 0; i < 16; i++) {
        const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.48 + (i % 3) * 0.2, 0.032), i % 3 === 0 ? blkMat : redMat);
        g.add(bolt);
        items.push({ mesh: bolt, seed: i * 0.77 });
      }
    } else if (vfx.type === "slash_smear_arc") {
      // Sweeping 3D Cel-Shaded Crescent Sakuga Motion Smears!
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      for (let i = 0; i < 3; i++) {
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.68 + i * 0.24, 0.042, 6, 24, Math.PI * 1.15), mat.clone());
        arc.position.set(o[0], o[1], o[2]);
        arc.rotation.set(0.35 * i, 0.5 * i, -0.4 + i * 0.8);
        g.add(arc);
        items.push({ mesh: arc, seed: i * 0.35 });
      }
    } else if (vfx.type === "domain_sigil_rings") {
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 });
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95 + i * 0.42, 0.025, 8, 40), mat);
        ring.position.set(o[0], o[1], o[2]);
        g.add(ring);
        items.push({ mesh: ring, seed: i + 1 });
      }
    } else if (vfx.type === "impact_shockwave") {
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.82 });
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 8, 32), mat.clone());
        ring.position.set(o[0], o[1], o[2]);
        g.add(ring);
        items.push({ mesh: ring, seed: i * 0.33 });
      }
    } else if (vfx.type === "floating_debris") {
      const rockMat = this.makeCel({ color: "#475569", rimColor: `#${col.getHexString()}`, rimIntensity: 0.9 });
      for (let i = 0; i < 12; i++) {
        const chunk = new THREE.Mesh(new THREE.OctahedronGeometry(0.06 + (i % 3) * 0.035, 0), rockMat);
        this.addInk(chunk, 0.008);
        g.add(chunk);
        items.push({ mesh: chunk, seed: i * 0.81 });
      }
    } else {
      // sakura_embers & anime_steam_pour
      const geo =
        vfx.type === "anime_steam_pour"
          ? new THREE.SphereGeometry(0.09, 10, 8)
          : new THREE.PlaneGeometry(0.07, 0.045);
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      for (let i = 0; i < 18; i++) {
        const m = new THREE.Mesh(geo, mat);
        g.add(m);
        items.push({ mesh: m, seed: i * 0.47 });
      }
    }

    this.stageGroup.add(g);
    this.vfxNodes.push({ spec: vfx, group: g, items });
  }

  loadBlueprint(sceneKey, blueprint, tSec) {
    if (this.activeSceneKey === sceneKey) return;

    if (this.satsuei?.supported && this.activeSceneKey) {
      this.satsuei.capturePreviousFrame(this.scene, this.camera);
      this.transStartSec = tSec;
    }

    this.activeSceneKey = sceneKey;
    this.clearStage();
    this.applySatsueiPalette(blueprint.satsueiMood || "jjk_cursed_blue");
    this.buildAnimeEnvironment(blueprint.animeEnvironment || "shibuya_night");

    for (const charSpec of blueprint.characters || []) {
      const rigMesh = this.buildAnimeCharacterRig(charSpec);
      this.stageGroup.add(rigMesh);
      this.characters.push({ spec: charSpec, mesh: rigMesh });
    }

    for (const propSpec of blueprint.subjectProps || []) {
      const propMesh = this.buildAnimeSubjectProp(propSpec);
      this.stageGroup.add(propMesh);
      this.props.push({ spec: propSpec, mesh: propMesh });
    }

    for (const vfx of blueprint.animeVfx || []) {
      this.buildAnimeVfx(vfx);
    }
  }

  animateAnimeCharacterPose(entry, tSec, progress, voiceEnergy) {
    const { spec, mesh } = entry;
    const r = mesh.userData?.animeRig;
    if (!r) return;

    const sp = spec.startPos || [-0.42, 0, -0.05];
    const ep = spec.endPos || sp;
    const easeP = progress * progress * (3 - 2 * progress);
    const x = sp[0] + (ep[0] - sp[0]) * easeP;
    let y = sp[1] + (ep[1] - sp[1]) * easeP;
    const z = sp[2] + (ep[2] - sp[2]) * easeP;

    const pose = spec.animePose || "stance_ready";
    const breathe = Math.sin(tSec * 3.4);

    // Dynamic anime coat wind physics!
    const wind = Math.sin(tSec * 7.5) * 0.24 + (pose === "dash_strike" || pose === "floating_overlord" ? 0.35 : 0.14);
    r.coatL.rotation.set(wind, 0, -0.15 - Math.abs(wind) * 0.4);
    r.coatR.rotation.set(wind * 0.9, 0, 0.15 + Math.abs(wind) * 0.4);

    // Subtle speaking head emphasis synced to ElevenLabs voice!
    r.head.rotation.x = Math.sin(tSec * 2.2) * 0.05 - voiceEnergy * 0.08;
    r.head.rotation.y = Math.sin(tSec * 1.6) * 0.12;
    r.torso.rotation.set(0, 0, 0);
    r.pelvis.position.y = 0.84 + breathe * 0.015;
    r.leftLeg.hip.rotation.set(0, 0, -0.06);
    r.rightLeg.hip.rotation.set(0, 0, 0.06);
    r.leftLeg.knee.rotation.set(0, 0, 0);
    r.rightLeg.knee.rotation.set(0, 0, 0);

    if (pose === "domain_hand_sign") {
      // Iconic Jujutsu Kaisen Domain Expansion Hand Seal!
      r.torso.rotation.x = 0.08;
      r.leftArm.shoulder.rotation.set(-1.35, 0.45, 0.35);
      r.leftArm.elbow.rotation.set(-0.95, 0, 0);
      r.rightArm.shoulder.rotation.set(-1.35, -0.45, -0.35);
      r.rightArm.elbow.rotation.set(-0.95, 0, 0);
      const glowPulse = 1.2 + Math.sin(tSec * 14) * 0.35;
      r.leftArm.fistAura.scale.setScalar(glowPulse);
      r.rightArm.fistAura.scale.setScalar(glowPulse);
    } else if (pose === "charge_cursed_energy") {
      r.pelvis.position.y = 0.72 + Math.sin(tSec * 16) * 0.02;
      r.torso.rotation.x = 0.25;
      r.leftArm.shoulder.rotation.set(-0.8, 0, -0.55);
      r.leftArm.elbow.rotation.set(-1.25, 0, 0);
      r.rightArm.shoulder.rotation.set(-0.8, 0, 0.55);
      r.rightArm.elbow.rotation.set(-1.25, 0, 0);
      r.leftLeg.hip.rotation.set(-0.35, 0, -0.18);
      r.rightLeg.hip.rotation.set(-0.35, 0, 0.18);
      r.leftLeg.knee.rotation.set(0.55, 0, 0);
      r.rightLeg.knee.rotation.set(0.55, 0, 0);
    } else if (pose === "dash_strike") {
      r.torso.rotation.set(0.32, -0.45, 0);
      r.rightArm.shoulder.rotation.set(-1.65, -0.2, 0.2);
      r.rightArm.elbow.rotation.set(-0.2, 0, 0);
      r.leftArm.shoulder.rotation.set(0.65, 0, -0.35);
      r.leftLeg.hip.rotation.set(-0.45, 0, -0.1);
      r.rightLeg.hip.rotation.set(0.45, 0, 0.1);
    } else if (pose === "point_reveal") {
      r.torso.rotation.y = 0.18;
      r.rightArm.shoulder.rotation.set(-1.35 + Math.sin(tSec * 4) * 0.08, -0.35, 0.22);
      r.rightArm.elbow.rotation.set(-0.18, 0, 0);
      r.leftArm.shoulder.rotation.set(0.15, 0, -0.2);
      r.leftArm.elbow.rotation.set(-0.45, 0, 0);
    } else if (pose === "shock_recoil") {
      r.torso.rotation.x = -0.22 + Math.sin(tSec * 24) * 0.04;
      r.leftArm.shoulder.rotation.set(-1.85, 0, -0.45);
      r.rightArm.shoulder.rotation.set(-1.85, 0, 0.45);
      r.leftArm.elbow.rotation.set(-0.8, 0, 0);
      r.rightArm.elbow.rotation.set(-0.8, 0, 0);
    } else if (pose === "floating_overlord") {
      y += 0.34 + Math.sin(tSec * 2.8) * 0.09;
      r.torso.rotation.x = -0.08;
      r.leftArm.shoulder.rotation.set(-0.4, 0, -0.85);
      r.rightArm.shoulder.rotation.set(-0.4, 0, 0.85);
      r.leftLeg.knee.rotation.set(0.32, 0, 0);
      r.rightLeg.knee.rotation.set(0.18, 0, 0);
    } else if (pose === "walk_explain") {
      const stride = Math.sin(tSec * 6.5);
      r.leftLeg.hip.rotation.x = stride * 0.45;
      r.rightLeg.hip.rotation.x = -stride * 0.45;
      r.leftArm.shoulder.rotation.set(-stride * 0.35, 0, -0.15);
      r.rightArm.shoulder.rotation.set(-1.1 + voiceEnergy * 0.3, -0.2, 0.18);
    } else if (pose === "triumph_climax") {
      r.pelvis.position.y = 0.86 + Math.abs(Math.sin(tSec * 4.5)) * 0.05;
      r.rightArm.shoulder.rotation.set(-2.55, 0, 0.25);
      r.leftArm.shoulder.rotation.set(-0.25, 0, -0.25);
    } else {
      // stance_ready
      r.leftArm.shoulder.rotation.set(-0.3 + breathe * 0.05, 0, -0.22);
      r.leftArm.elbow.rotation.set(-0.65, 0, 0);
      r.rightArm.shoulder.rotation.set(-0.45 - breathe * 0.06, 0, 0.22);
      r.rightArm.elbow.rotation.set(-0.85, 0, 0);
    }

    mesh.position.set(x, y, z);
    mesh.rotation.set(0, spec.rotY ?? 0.28, 0);
    mesh.scale.setScalar(spec.scale || 1.0);
  }

  renderFrame(blueprint, sceneKey, tSec, sceneElapsedSec = 0, sceneDurationSec = 4.6, voiceEnergy = 0) {
    this.loadBlueprint(sceneKey, blueprint, tSec);

    const progress = Math.max(0, Math.min(1, sceneElapsedSec / Math.max(2.0, sceneDurationSec)));
    const easedP = progress * progress * (3 - 2 * progress);

    // 1. Check Authentic Studio MAPPA Impact Frame Window (2-3 high-contrast frames at peak beat!)
    const imp = blueprint.impactBeat || {};
    const triggerP = imp.triggerProgress ?? 0.52;
    const isImpactWindow = Boolean(imp.enabled) && Math.abs(progress - triggerP) < 0.028;
    const impactModeVal = !isImpactWindow ? 0.0 : imp.style === "black_flash" ? 2.0 : 1.0;

    // Broadcast impact frame & outline thickening to EVERY cel shader & ink outline!
    const grade = blueprint.satsueiGrade || {};
    const outlineWeight = (grade.outlineWeight ?? 1.0) * (isImpactWindow ? 2.3 : 1.0);
    for (const cm of this.celMaterials) {
      if (cm.uniforms?.uImpactMode) cm.uniforms.uImpactMode.value = impactModeVal;
      if (cm.uniforms?.uRimIntensity) cm.uniforms.uRimIntensity.value = grade.rimIntensity ?? 1.15;
    }
    for (const om of this.outlineMaterials) {
      if (om.uniforms?.uThickness) {
        om.uniforms.uThickness.value = (om.userData.baseThickness || 0.015) * outlineWeight;
      }
    }
    if (this.skyMat?.uniforms) {
      this.skyMat.uniforms.uTime.value = tSec;
      this.skyMat.uniforms.uImpactMode.value = impactModeVal;
    }

    // 2. Animate Articulated Anime Characters & Cel-Shaded Subject Props
    for (const ch of this.characters) {
      this.animateAnimeCharacterPose(ch, tSec, progress, voiceEnergy);
    }

    for (let i = 0; i < this.props.length; i++) {
      const { spec, mesh } = this.props[i];
      const bp = spec.pos || [0.46, 0.28, 0.08];
      let px = bp[0], py = bp[1], pz = bp[2];
      const br = spec.rot || [0, -0.25, 0];
      let rx = br[0], ry = br[1], rz = br[2];

      if (spec.motion === "hover_pulse") py += Math.sin(tSec * 2.8 + i) * 0.08;
      else if (spec.motion === "vibrate") {
        px += Math.sin(tSec * 48) * 0.035;
        pz += Math.cos(tSec * 42) * 0.025;
      } else if (spec.motion === "spin") {
        ry += tSec * 2.6;
      } else if (spec.motion === "orbit_slash") {
        px += Math.cos(tSec * 3.2) * 0.14;
        py += Math.sin(tSec * 3.2) * 0.1;
      }
      mesh.position.set(px, py, pz);
      mesh.rotation.set(rx, ry, rz);
      mesh.scale.setScalar(spec.scale || 0.82);

      if (mesh.userData?.spinPart) mesh.userData.spinPart.rotation.z = tSec * 7.5;
      if (mesh.userData?.customAnimatedBones) animateProceduralCustomRig(mesh, tSec, voiceEnergy);
    }

    // 3. Animate Jujutsu Kaisen Sakuga VFX
    for (const vfxNode of this.vfxNodes) {
      const { spec, items } = vfxNode;
      const o = spec.origin || [0, 0.85, 0];

      if (spec.type === "cursed_energy_aura") {
        items.forEach((it, idx) => {
          const u = (tSec * 1.45 + it.seed) % 1;
          const ang = idx * 1.15 + tSec * 2.6;
          const rad = 0.24 + Math.sin(u * Math.PI) * 0.22;
          it.mesh.position.set(o[0] + Math.cos(ang) * rad, o[1] - 0.5 + u * 1.65, o[2] + Math.sin(ang) * rad);
          it.mesh.scale.set(1 - u * 0.45, 0.75 + Math.sin(u * Math.PI) * 0.85, 1 - u * 0.45);
        });
      } else if (spec.type === "black_flash_lightning") {
        const snapT = Math.floor(tSec * 18);
        items.forEach((it, idx) => {
          const ang = (idx / items.length) * Math.PI * 2 + snapT * 1.3;
          const dist = 0.22 + ((idx * 37 + snapT * 19) % 10) * 0.075;
          it.mesh.position.set(o[0] + Math.cos(ang) * dist, o[1] + Math.sin(ang) * dist * 0.85, o[2] + Math.cos(idx + snapT) * 0.25);
          it.mesh.rotation.set(Math.sin(snapT + idx), Math.cos(snapT * 1.7 + idx), ang + 0.6);
        });
      } else if (spec.type === "slash_smear_arc") {
        items.forEach((it, idx) => {
          it.mesh.rotation.z += 0.14 * (idx % 2 === 0 ? 1 : -1);
          it.mesh.material.opacity = 0.45 + Math.abs(Math.sin(tSec * 6.5 + it.seed)) * 0.48;
        });
      } else if (spec.type === "domain_sigil_rings") {
        items.forEach((it, idx) => {
          it.mesh.rotation.z = tSec * (idx % 2 === 0 ? 0.85 : -1.1);
          it.mesh.rotation.x = Math.sin(tSec * 0.9 + idx) * 0.2;
        });
      } else if (spec.type === "impact_shockwave") {
        items.forEach((it) => {
          const u = (tSec * 1.6 + it.seed) % 1;
          it.mesh.scale.setScalar(0.5 + u * 2.5);
          it.mesh.material.opacity = (1 - u) * 0.85;
        });
      } else if (spec.type === "floating_debris") {
        items.forEach((it, idx) => {
          const ang = idx * 1.2 + tSec * 0.55;
          const rad = 0.65 + (idx % 4) * 0.34;
          it.mesh.position.set(o[0] + Math.cos(ang) * rad, 0.25 + ((tSec * 0.35 + it.seed) % 1) * 1.85, o[2] + Math.sin(ang) * rad * 0.7);
          it.mesh.rotation.set(tSec * 1.8 + idx, tSec * 1.2, 0);
        });
      } else {
        items.forEach((it, idx) => {
          const u = (tSec * 0.65 + it.seed) % 1;
          it.mesh.position.set(
            o[0] + Math.sin(tSec * 1.8 + idx * 1.4) * 1.35,
            spec.type === "anime_steam_pour" ? o[1] + u * 1.2 : 2.4 - u * 2.5,
            o[2] + Math.cos(tSec * 1.4 + idx) * 0.85
          );
          it.mesh.rotation.set(tSec * 2 + idx, tSec * 1.6, 0);
        });
      }
    }

    // 4. True 9:16 Portrait Safe-Framing Kling x MAPPA Sakuga Camera Director!
    // Keeps X in [-0.85, +0.85] & full standing anime hero cleanly framed ABOVE bottom subtitles & BELOW top header!
    const move = blueprint.cameraMove || "low_angle_hero_push";
    const baseDist = 4.65;
    let camX = 0.15, camY = 1.15, camZ = baseDist;
    let lookX = 0.0, lookY = 0.78, lookZ = 0.0;
    let fov = 48;
    let roll = 0.0;

    if (move === "low_angle_hero_push") {
      camX = 0.35 - easedP * 0.45;
      camY = 0.76 + easedP * 0.18;
      camZ = 4.95 - easedP * 0.72;
      lookY = 0.92;
      fov = 49 - easedP * 3;
    } else if (move === "orbit_sakuga") {
      const ang = -0.36 + easedP * 0.72; // Safe Kling-class 41-degree dynamic anime orbit!
      camX = Math.sin(ang) * 4.55;
      camZ = Math.cos(ang) * 4.55;
      camY = 1.12 + Math.sin(easedP * Math.PI) * 0.25;
      lookY = 0.85;
      fov = 48;
    } else if (move === "crash_zoom_impact") {
      const zCurve = Math.min(1, progress / Math.max(0.25, triggerP));
      camX = -0.25 + zCurve * 0.25;
      camY = 1.05 - zCurve * 0.12;
      camZ = 5.15 - zCurve * 1.15;
      lookY = 0.86;
      fov = 50 - zCurve * 7;
    } else if (move === "whip_pan_reveal") {
      camX = -0.95 + easedP * 1.35;
      camY = 1.18;
      camZ = 4.55;
      lookX = -0.2 + easedP * 0.4;
      lookY = 0.82;
    } else if (move === "dutch_tension_tilt") {
      camX = -0.35 + easedP * 0.55;
      camY = 0.95;
      camZ = 4.45 - easedP * 0.35;
      lookY = 0.88;
      roll = 0.13;
    } else if (move === "overhead_domain_crane") {
      camX = 0.4 - easedP * 0.5;
      camY = 2.45 - easedP * 0.45;
      camZ = 4.35;
      lookY = 0.65;
    }

    // Impact Frame Camera Punch Shake!
    const shakeAmp = isImpactWindow ? 0.11 : 0.008;
    camX += Math.sin(tSec * (isImpactWindow ? 68 : 2.1)) * shakeAmp;
    camY += Math.cos(tSec * (isImpactWindow ? 59 : 1.7)) * shakeAmp;

    this.camera.position.set(camX, camY, camZ);
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix?.();
    this.lookAtVec.set(lookX, lookY, lookZ);
    this.camera.lookAt(this.lookAtVec);
    if (roll) this.camera.rotation.z += roll;

    // 5. MAPPA Satsuei (撮影) Full-Screen Compositing Pass!
    const transProgress = Math.min(1, Math.max(0, tSec - this.transStartSec) / 0.3);
    const auraTint = blueprint.characters?.[0]?.auraColor || `#${this.activePalette.accent.toString(16).padStart(6, "0")}`;

    this.satsuei.render(this.scene, this.camera, {
      tSec,
      bloomStrength: isImpactWindow ? 0.82 : grade.bloomStrength ?? 0.42,
      contrast: isImpactWindow ? 1.32 : grade.contrast ?? 1.12,
      saturation: grade.saturation ?? 1.18,
      chromatic: isImpactWindow ? Math.max(0.014, grade.chromaticPeak ?? 0.014) : 0.002,
      speedLines: Boolean(grade.speedLines) || isImpactWindow,
      impactMode: impactModeVal,
      transProgress,
      auraTint
    });
  }
}
