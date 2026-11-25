// MaouEdu 3D Animation Engine (Three.js WebGL)
// Full-body articulated 3D MC Raja Iblis (Maou Vaelen) + 3D Human Worker + Interactive 3D Diorama Worlds
// Inspired by @untabiru5 & @dhotscliper 3D edutainment style, with MC Raja Iblis as the active 3D presenter!

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

function createBrickTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#c9b69c";
  g.fillRect(0, 0, 256, 256);
  const rows = 8;
  const cols = 4;
  const rh = 256 / rows;
  const cw = 256 / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw / 2);
    for (let col = -1; col <= cols; col++) {
      g.fillStyle = (r + col) % 2 === 0 ? "#a83c28" : "#963220";
      g.fillRect(col * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
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
  g.fillStyle = "#b87035";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    g.fillStyle = y % 16 === 0 ? "rgba(90, 45, 12, 0.25)" : "rgba(245, 195, 130, 0.14)";
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
  g.fillStyle = "#7a4d28";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 95; i++) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    g.fillStyle = i % 3 === 0 ? "#573519" : i % 3 === 1 ? "#99653a" : "#c79a6b";
    g.beginPath();
    g.arc(x, y, 3 + (i % 5), 0, Math.PI * 2);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

function createCapacitorLabelTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#f1f5f9";
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
// ARTICULATED FULL-BODY 3D CHARACTER #1: MC RAJA IBLIS (MAOU VAELEN)
// Every joint rigged: hips, spine, chest, neck, head, eyelids, brows, jaw/mouth,
// left/right shoulders, elbows, hands, pointing fingers, thighs, knees, boots,
// billowing coat tails, broken-left-horn glowing cracks, and shoulder shadow wisps!
// ============================================================================
function createDemonKingRig() {
  const root = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6dfd0, roughness: 0.55 });
  const hairSilverMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.42,
    metalness: 0.15
  });
  const hairCrimsonMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.55,
    roughness: 0.35
  });
  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x11131a,
    roughness: 0.25,
    metalness: 0.65
  });
  const crackGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff2a55,
    emissive: 0xff1e42,
    emissiveIntensity: 2.2
  });
  const coatMat = new THREE.MeshStandardMaterial({
    color: 0x141724,
    roughness: 0.55,
    metalness: 0.2
  });
  const turtleneckMat = new THREE.MeshStandardMaterial({
    color: 0x0b0d14,
    roughness: 0.75
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.82,
    roughness: 0.22,
    emissive: 0x78350f,
    emissiveIntensity: 0.25
  });
  const rubyMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.5,
    roughness: 0.12,
    metalness: 0.3
  });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x161a26, roughness: 0.65 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, roughness: 0.35, metalness: 0.4 });
  const eyeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff5a1f,
    emissive: 0xe11d48,
    emissiveIntensity: 1.4
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5 });

  // Pelvis / Hips Pivot (center of gravity at y=0.95)
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  root.add(hips);

  const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.24), pantsMat);
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  // ---- LEGS (Fully Articulated: Thigh -> Knee -> Shin -> Boot) ----
  function buildLeg(side) {
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.13, -0.08, 0);
    hips.add(hipJoint);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.32, 6, 12), pantsMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    hipJoint.add(thigh);

    const kneeJoint = new THREE.Group();
    kneeJoint.position.y = -0.44;
    hipJoint.add(kneeJoint);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.3, 6, 12), bootMat);
    shin.position.y = -0.2;
    shin.castShadow = true;
    kneeJoint.add(shin);

    // Boot Foot + Gold buckle
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.24), bootMat);
    foot.position.set(0, -0.4, 0.05);
    foot.castShadow = true;
    kneeJoint.add(foot);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.04), goldTrimMat);
    buckle.position.set(0, -0.32, 0.07);
    kneeJoint.add(buckle);

    return { hipJoint, kneeJoint };
  }

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  // ---- BILLOWING LONG COAT TAILS (Animated with physics sway!) ----
  const coatTailBack = new THREE.Group();
  coatTailBack.position.set(0, 0.04, -0.13);
  hips.add(coatTailBack);
  const backTailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.68, 0.04), coatMat);
  backTailMesh.position.y = -0.34;
  backTailMesh.castShadow = true;
  coatTailBack.add(backTailMesh);
  const backTailGold = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.035, 0.045), goldTrimMat);
  backTailGold.position.y = -0.66;
  coatTailBack.add(backTailGold);

  const coatTailLeft = new THREE.Group();
  coatTailLeft.position.set(-0.24, 0.04, 0.02);
  hips.add(coatTailLeft);
  const leftTailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.22), coatMat);
  leftTailMesh.position.y = -0.31;
  leftTailMesh.castShadow = true;
  coatTailLeft.add(leftTailMesh);

  const coatTailRight = new THREE.Group();
  coatTailRight.position.set(0.24, 0.04, 0.02);
  hips.add(coatTailRight);
  const rightTailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.22), coatMat);
  rightTailMesh.position.y = -0.31;
  rightTailMesh.castShadow = true;
  coatTailRight.add(rightTailMesh);

  // ---- SPINE & CHEST (Turtleneck + Gold-Trimmed Modern Overlord Long Coat + Ruby Brooch) ----
  const spine = new THREE.Group();
  spine.position.y = 0.08;
  hips.add(spine);

  // Inner fitted black turtleneck
  const torsoCore = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.17, 0.56, 14), turtleneckMat);
  torsoCore.position.y = 0.3;
  torsoCore.castShadow = true;
  spine.add(torsoCore);

  // High turtleneck collar
  const neckCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 12), turtleneckMat);
  neckCollar.position.y = 0.6;
  spine.add(neckCollar);

  // Modern Coat Jacket Sides & Broad Shoulders
  const coatLeftChest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.27), coatMat);
  coatLeftChest.position.set(-0.14, 0.31, 0);
  coatLeftChest.castShadow = true;
  spine.add(coatLeftChest);

  const coatRightChest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.27), coatMat);
  coatRightChest.position.set(0.14, 0.31, 0);
  coatRightChest.castShadow = true;
  spine.add(coatRightChest);

  // Gold Lapel Trim Lines
  const leftGoldLapel = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.52, 0.03), goldTrimMat);
  leftGoldLapel.position.set(-0.06, 0.32, 0.138);
  leftGoldLapel.rotation.z = -0.14;
  spine.add(leftGoldLapel);

  const rightGoldLapel = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.52, 0.03), goldTrimMat);
  rightGoldLapel.position.set(0.06, 0.32, 0.138);
  rightGoldLapel.rotation.z = 0.14;
  spine.add(rightGoldLapel);

  // High Overlord Coat Collar (Gold-Edged)
  const highCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.22, 0.15, 14, 1, true, Math.PI * 0.22, Math.PI * 1.56),
    coatMat
  );
  highCollar.position.y = 0.62;
  highCollar.rotation.y = Math.PI;
  spine.add(highCollar);

  // Ruby Chest Brooch pinned on left lapel
  const rubyBrooch = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), rubyMat);
  rubyBrooch.position.set(-0.13, 0.44, 0.155);
  spine.add(rubyBrooch);
  const broochRing = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.01, 8, 16), goldTrimMat);
  broochRing.position.copy(rubyBrooch.position);
  spine.add(broochRing);

  // ---- SHOULDER DARK SHADOW AURA WISPS (Animated orbiting smoke puffs!) ----
  const shadowWisps = [];
  const wispMat = new THREE.MeshStandardMaterial({
    color: 0x1e1030,
    emissive: 0x7c1d3e,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.65
  });
  for (let i = 0; i < 10; i++) {
    const w = new THREE.Mesh(new THREE.DodecahedronGeometry(0.055 + (i % 3) * 0.02, 0), wispMat);
    spine.add(w);
    shadowWisps.push({
      mesh: w,
      side: i % 2 === 0 ? -1 : 1,
      phase: i * 0.85
    });
  }

  // ---- ARMS (Fully Articulated: Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand + Pointing Finger) ----
  function buildArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.3, 0.54, 0);
    spine.add(shoulder);

    const shoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), coatMat);
    shoulderPad.castShadow = true;
    shoulder.add(shoulderPad);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.24, 6, 12), coatMat);
    upperArm.position.y = -0.17;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.23, 6, 12), coatMat);
    forearm.position.y = -0.15;
    forearm.castShadow = true;
    elbow.add(forearm);

    const cuffGold = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.03, 12), goldTrimMat);
    cuffGold.position.y = -0.26;
    elbow.add(cuffGold);

    const hand = new THREE.Group();
    hand.position.y = -0.32;
    elbow.add(hand);

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.09, 0.05), skinMat);
    hand.add(palm);

    // Expressive Pointing Finger
    const indexFinger = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.075, 4, 8), skinMat);
    indexFinger.position.set(side * -0.02, -0.085, 0.015);
    hand.add(indexFinger);

    // Magical Energy Orb in Hand (scales up when explaining / eureka!)
    const magicOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.08, 1),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xe11d48,
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: 0.9
      })
    );
    magicOrb.position.set(0, -0.16, 0.06);
    magicOrb.scale.setScalar(0.001);
    hand.add(magicOrb);

    return { shoulder, elbow, hand, indexFinger, magicOrb };
  }

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // ---- NECK & HANDSOME ANIME HEAD (Animated Blink, Brows, Lip-Sync Mouth, Wolf-Cut Hair, Asymmetrical Horns!) ----
  const neck = new THREE.Group();
  neck.position.y = 0.65;
  spine.add(neck);

  const head = new THREE.Group();
  head.position.y = 0.14;
  neck.add(head);

  // Stylized Handsome Head (slightly tapered jaw)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.215, 18, 16), skinMat);
  skull.scale.set(0.92, 1.05, 0.96);
  skull.castShadow = true;
  head.add(skull);

  const chin = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.12, 10), skinMat);
  chin.rotation.x = Math.PI;
  chin.position.set(0, -0.17, 0.05);
  head.add(chin);

  // Glowing Crimson-Amber Eyes + Animated Eyelids + Expressive Eyebrows
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xfff5f5 });
  const leftEyeGroup = new THREE.Group();
  leftEyeGroup.position.set(-0.075, 0.015, 0.185);
  head.add(leftEyeGroup);

  const rightEyeGroup = new THREE.Group();
  rightEyeGroup.position.set(0.075, 0.015, 0.185);
  head.add(rightEyeGroup);

  const eyelids = [];
  const eyebrows = [];
  [-1, 1].forEach((side, idx) => {
    const eg = idx === 0 ? leftEyeGroup : rightEyeGroup;
    const sclera = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.044, 0.015), eyeWhiteMat);
    eg.add(sclera);

    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.021, 12), eyeGlowMat);
    iris.position.set(0, 0, 0.009);
    eg.add(iris);

    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.009, 10), darkMat);
    pupil.position.set(0, 0, 0.011);
    eg.add(pupil);

    // Animated Eyelid (closes cleanly for blinking)
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.05, 0.022), skinMat);
    lid.position.set(0, 0.025, 0.008);
    lid.scale.y = 0.08;
    eg.add(lid);
    eyelids.push(lid);

    // Expressive Eyebrow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.016, 0.018), hairSilverMat);
    brow.position.set(side * 0.075, 0.068, 0.195);
    head.add(brow);
    eyebrows.push(brow);
  });

  // Animated Talking Mouth (Real-Time Audio Lip-Sync!)
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, -0.095, 0.192);
  head.add(mouthGroup);

  const mouthInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.048, 0.014),
    new THREE.MeshBasicMaterial({ color: 0x3b0a14 })
  );
  mouthInner.scale.y = 0.18;
  mouthGroup.add(mouthInner);

  const upperTeeth = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, 0.012, 0.016),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  upperTeeth.position.y = 0.012;
  mouthGroup.add(upperTeeth);

  // Ash-Silver Wolf-Cut Layered 3D Hair + Single Crimson-Red Front Streak!
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.228, 16, 14), hairSilverMat);
  hairCap.position.set(0, 0.045, -0.02);
  hairCap.scale.set(0.98, 1.0, 1.04);
  head.add(hairCap);

  // Back & Side Wolf-Cut Spikes
  const spikeDefs = [
    [-0.18, 0.02, -0.04, 0, 0, 0.55, 0.18],
    [0.18, 0.02, -0.04, 0, 0, -0.55, 0.18],
    [-0.14, -0.08, -0.14, 0.35, 0, 0.35, 0.22],
    [0.14, -0.08, -0.14, 0.35, 0, -0.35, 0.22],
    [0, -0.12, -0.19, 0.4, 0, 0, 0.24],
    [-0.11, 0.17, 0.14, 0.85, 0, 0.3, 0.16],
    [0.12, 0.16, 0.14, 0.85, 0, -0.25, 0.16],
    [0.02, 0.19, 0.12, 0.75, 0, 0.08, 0.15]
  ];
  spikeDefs.forEach(([x, y, z, rx, ry, rz, h]) => {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.065, h, 7), hairSilverMat);
    spike.position.set(x, y, z);
    spike.rotation.set(rx, ry, rz);
    head.add(spike);
  });

  // SIGNATURE CRIMSON-RED FRONT HAIR STREAK!
  const crimsonStreak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 7), hairCrimsonMat);
  crimsonStreak.position.set(-0.045, 0.11, 0.195);
  crimsonStreak.rotation.set(2.55, 0.1, 0.22);
  head.add(crimsonStreak);

  // SIGNATURE ASYMMETRICAL BLACK OBSIDIAN HORNS!
  // Viewer-left = Character's RIGHT horn (INTACT sleek curved horn)
  const rightHornGroup = new THREE.Group();
  rightHornGroup.position.set(-0.14, 0.18, 0.06);
  rightHornGroup.rotation.set(-0.45, 0, 0.42);
  head.add(rightHornGroup);
  const rhBase = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.26, 9), obsidianMat);
  rhBase.position.y = 0.12;
  rightHornGroup.add(rhBase);
  const rhTip = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.16, 8), obsidianMat);
  rhTip.position.set(-0.03, 0.26, -0.04);
  rhTip.rotation.set(-0.35, 0, 0.25);
  rightHornGroup.add(rhTip);

  // Viewer-right = Character's LEFT horn (BROKEN TIP + GLOWING RED FRACTURE CRACKS!)
  const leftHornGroup = new THREE.Group();
  leftHornGroup.position.set(0.14, 0.18, 0.06);
  leftHornGroup.rotation.set(-0.45, 0, -0.42);
  head.add(leftHornGroup);
  const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.052, 0.19, 9), obsidianMat);
  lhBase.position.y = 0.095;
  leftHornGroup.add(lhBase);
  const lhCrackRing = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.011, 6, 12), crackGlowMat);
  lhCrackRing.position.y = 0.19;
  lhCrackRing.rotation.x = Math.PI / 2;
  leftHornGroup.add(lhCrackRing);
  const lhSpark = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), crackGlowMat);
  lhSpark.position.y = 0.24;
  leftHornGroup.add(lhSpark);

  // Arcane Rotating Magic Ring behind MC during explanations ("JADI...")
  const arcaneRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.016, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.0 })
  );
  arcaneRing.position.set(0, 1.38, -0.35);
  root.add(arcaneRing);

  return {
    root,
    hips,
    spine,
    neck,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    coatTailBack,
    coatTailLeft,
    coatTailRight,
    eyelids,
    eyebrows,
    mouthInner,
    upperTeeth,
    lhSpark,
    lhCrackRing,
    shadowWisps,
    arcaneRing
  };
}

// ============================================================================
// ARTICULATED FULL-BODY 3D CHARACTER #2: THE 3D HUMAN WORKER ("Si Manusia")
// Performs the experiments in the 3D diorama while MC Raja Iblis shows & explains it!
// ============================================================================
function createHumanWorkerRig() {
  const root = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6b48a, roughness: 0.65 });
  const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.6 }); // iconic teal-green hoodie!
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.7 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

  const hips = new THREE.Group();
  hips.position.y = 0.62;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.32, 8, 14), hoodieMat);
  torso.position.y = 0.28;
  torso.castShadow = true;
  hips.add(torso);

  const head = new THREE.Group();
  head.position.y = 0.64;
  hips.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), skinMat);
  skull.castShadow = true;
  head.add(skull);

  const hairTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.208, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hairTop.position.y = 0.02;
  head.add(hairTop);

  // Farmer Caping Hat (visible only on Minapadi theme!)
  const capingHat = new THREE.Mesh(
    new THREE.ConeGeometry(0.36, 0.16, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
  );
  capingHat.position.y = 0.18;
  capingHat.visible = false;
  head.add(capingHat);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.09, 0.02, 0);
  hips.add(leftLeg);
  const llMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.36, 6, 10), pantsMat);
  llMesh.position.y = -0.26;
  leftLeg.add(llMesh);
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.18), shoeMat);
  lShoe.position.set(0, -0.5, 0.04);
  leftLeg.add(lShoe);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.09, 0.02, 0);
  hips.add(rightLeg);
  const rlMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.36, 6, 10), pantsMat);
  rlMesh.position.y = -0.26;
  rightLeg.add(rlMesh);
  const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.18), shoeMat);
  rShoe.position.set(0, -0.5, 0.04);
  rightLeg.add(rShoe);

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.24, 0.44, 0);
  hips.add(leftArm);
  const laMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28, 6, 10), hoodieMat);
  laMesh.position.y = -0.18;
  leftArm.add(laMesh);
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), skinMat);
  lHand.position.y = -0.36;
  leftArm.add(lHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.24, 0.44, 0);
  hips.add(rightArm);
  const raMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28, 6, 10), hoodieMat);
  raMesh.position.y = -0.18;
  rightArm.add(raMesh);
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), skinMat);
  rHand.position.y = -0.36;
  rightArm.add(rHand);

  // Handheld Tool (Hoe / Net / Wrench attached to right hand)
  const toolGroup = new THREE.Group();
  toolGroup.position.set(0, -0.36, 0.08);
  rightArm.add(toolGroup);
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.95, 8),
    new THREE.MeshStandardMaterial({ color: 0xb45309 })
  );
  stick.position.y = -0.2;
  stick.rotation.x = 0.5;
  toolGroup.add(stick);
  const headBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.05, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
  );
  headBlade.position.set(0, -0.62, 0.25);
  toolGroup.add(headBlade);

  return { root, hips, head, leftArm, rightArm, leftLeg, rightLeg, toolGroup, capingHat };
}

// Helper to build a sleek 3D Red Arowana Fish
function createArowanaFishMesh() {
  const g = new THREE.Group();
  const redBodyMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.3,
    roughness: 0.25,
    metalness: 0.35
  });
  const finMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), redBodyMat);
  body.scale.set(1.8, 0.52, 0.34);
  g.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.24, 5), finMat);
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
// MAIN 3D STAGE CONTROLLER
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
    this.scene.background = new THREE.Color(0x101420);
    this.scene.fog = new THREE.FogExp2(0x101420, 0.042);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    this.camera.position.set(0.4, 2.7, 6.2);
    this.cameraTarget = new THREE.Vector3(0, 1.15, 0);
    this.camPosGoal = new THREE.Vector3(0.4, 2.7, 6.2);
    this.camLookGoal = new THREE.Vector3(0, 1.15, 0);

    // Three-Point Cinematic Lighting
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e1b2e, 0.95);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.7);
    sun.position.set(4.5, 8.5, 5.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);

    this.rimLight = new THREE.PointLight(0xe11d48, 3.2, 12);
    this.rimLight.position.set(-2.4, 2.8, 2.5);
    this.scene.add(this.rimLight);

    this.goldAccentLight = new THREE.PointLight(0xfbbf24, 1.8, 12);
    this.goldAccentLight.position.set(2.5, 3.0, 2.2);
    this.scene.add(this.goldAccentLight);

    // Textures
    this.brickTex = createBrickTexture();
    this.woodTex = createWoodTexture();
    this.soilTex = createSoilTexture();
    this.capTex = createCapacitorLabelTexture();

    // Build Articulated 3D Characters
    this.mc = createDemonKingRig();
    this.mc.root.position.set(-1.15, 0.0, 2.05);
    this.scene.add(this.mc.root);

    this.worker = createHumanWorkerRig();
    this.worker.root.position.set(0.8, 0.0, -0.4);
    this.scene.add(this.worker.root);

    // Diorama World Container (rebuilt cleanly per theme: aquarium, pond, motor, agriculture, science)
    this.dioramaGroup = new THREE.Group();
    this.scene.add(this.dioramaGroup);

    // Floating Victory / Ambient Embers
    this.embers = [];
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 5), emberMat);
      m.position.set((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 4);
      this.scene.add(m);
      this.embers.push({ mesh: m, speed: 0.4 + Math.random() * 0.8, phase: Math.random() * 6 });
    }

    this.activeTheme = null;
    this.dioramaParts = {};
    this.buildDiorama("aquarium");
  }

  get domElement() {
    return this.renderer.domElement;
  }

  detectTheme(topicText = "") {
    const t = topicText.toLowerCase();
    if (t.includes("aquarium") || t.includes("akuarium")) return "aquarium";
    if (t.includes("arwana") || t.includes("kolam")) return "pond";
    if (t.includes("kipas") || t.includes("motor") || t.includes("magnet") || t.includes("kapasitor")) {
      return "motor";
    }
    if (t.includes("sawah") || t.includes("minapadi") || t.includes("padi")) return "agriculture";
    return "science";
  }

  buildDiorama(theme) {
    if (this.activeTheme === theme) return;
    this.activeTheme = theme;

    while (this.dioramaGroup.children.length > 0) {
      this.dioramaGroup.remove(this.dioramaGroup.children[0]);
    }
    this.dioramaParts = {};
    this.worker.capingHat.visible = theme === "agriculture";

    if (theme === "aquarium" || theme === "pond") {
      this.scene.background = new THREE.Color(theme === "pond" ? 0x1e293b : 0x0f1320);
      this.scene.fog = new THREE.FogExp2(theme === "pond" ? 0x1e293b : 0x0f1320, 0.032);

      // Floor / Cutaway Soil Block & Grass (Exact @untabiru5 vibe!)
      const soilBlock = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 1.3, 5.2),
        new THREE.MeshStandardMaterial({ map: this.soilTex, roughness: 0.9 })
      );
      soilBlock.position.set(0.3, -0.68, -0.2);
      soilBlock.receiveShadow = true;
      this.dioramaGroup.add(soilBlock);

      const grassTop = new THREE.Mesh(
        new THREE.BoxGeometry(7.3, 0.12, 5.3),
        new THREE.MeshStandardMaterial({ color: theme === "pond" ? 0x65a30d : 0x1e293b, roughness: 0.8 })
      );
      grassTop.position.set(0.3, -0.04, -0.2);
      grassTop.receiveShadow = true;
      this.dioramaGroup.add(grassTop);

      // Brick House Backdrop (just like @untabiru5!)
      const houseWall = new THREE.Mesh(
        new THREE.BoxGeometry(6.8, 3.2, 0.3),
        new THREE.MeshStandardMaterial({ map: this.brickTex, roughness: 0.85 })
      );
      houseWall.position.set(0.4, 1.55, -2.55);
      houseWall.receiveShadow = true;
      this.dioramaGroup.add(houseWall);

      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.9, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.7 })
      );
      door.position.set(-1.1, 0.95, -2.52);
      this.dioramaGroup.add(door);

      // Glass Tank / Cutaway Pond Structure
      const tankGroup = new THREE.Group();
      tankGroup.position.set(0.45, theme === "aquarium" ? 0.95 : 0.32, -0.45);
      this.dioramaGroup.add(tankGroup);

      // Cabinet stand (Aquarium) or Brick Rim (Pond)
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.9, 1.45),
        new THREE.MeshStandardMaterial({
          color: theme === "aquarium" ? 0x1e293b : 0xb91c1c,
          map: theme === "pond" ? this.brickTex : null,
          roughness: 0.6
        })
      );
      stand.position.y = theme === "aquarium" ? -0.52 : -0.35;
      stand.castShadow = true;
      tankGroup.add(stand);
      this.dioramaParts.brickStand = stand;

      // Water Volume
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.52,
        roughness: 0.12,
        transmission: 0.3
      });
      const water = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.98, 1.28), waterMat);
      water.position.y = 0.44;
      tankGroup.add(water);
      this.dioramaParts.waterMat = waterMat;

      // Glass Edges
      const glassEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(2.5, 1.12, 1.36)),
        new THREE.LineBasicMaterial({ color: 0xbae6fd })
      );
      glassEdges.position.y = 0.5;
      tankGroup.add(glassEdges);

      // Protective Lid / Mesh Fence (toggled on JADI #2+)
      const fenceGroup = new THREE.Group();
      const fenceFrame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(2.56, 0.58, 1.42)),
        new THREE.LineBasicMaterial({ color: 0xf8fafc })
      );
      fenceFrame.position.y = 1.35;
      fenceGroup.add(fenceFrame);
      const lidGlass = new THREE.Mesh(
        new THREE.BoxGeometry(2.56, 0.05, 1.42),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.42 })
      );
      lidGlass.position.y = theme === "aquarium" ? 1.09 : 1.64;
      fenceGroup.add(lidGlass);
      tankGroup.add(fenceGroup);
      this.dioramaParts.fenceGroup = fenceGroup;

      // 4-Tier Trickle Filter / Sump Bio-Ball Tower on the right side!
      const filterGroup = new THREE.Group();
      filterGroup.position.set(1.72, 0.0, 0);
      for (let tier = 0; tier < 4; tier++) {
        const tray = new THREE.Mesh(
          new THREE.BoxGeometry(0.66, 0.24, 0.66),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.72 })
        );
        tray.position.y = 0.15 + tier * 0.3;
        filterGroup.add(tray);

        for (let b = 0; b < 4; b++) {
          const ball = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.065, 0),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
          );
          ball.position.set((b % 2 - 0.5) * 0.25, 0.15 + tier * 0.3, (Math.floor(b / 2) - 0.5) * 0.25);
          filterGroup.add(ball);
        }
      }
      tankGroup.add(filterGroup);
      this.dioramaParts.filterGroup = filterGroup;

      // Glass Canopy Roof / Tanning Lamp (Climax)
      const canopyGroup = new THREE.Group();
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.08, 1.65),
        new THREE.MeshStandardMaterial({
          color: 0x7dd3fc,
          emissive: 0xfde047,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.55
        })
      );
      roof.position.y = 1.92;
      canopyGroup.add(roof);
      tankGroup.add(canopyGroup);
      this.dioramaParts.canopyGroup = canopyGroup;

      // Floating Orange Pingpong Ball (for Aquarium anti-drop-eye)
      const pingpong = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0x7c2d12, emissiveIntensity: 0.3 })
      );
      pingpong.position.set(-0.6, 0.92, 0.15);
      tankGroup.add(pingpong);
      this.dioramaParts.pingpong = pingpong;

      // 3D Animated Swimming Red Arowana Fish!
      const fishes = [];
      for (let i = 0; i < 4; i++) {
        const f = createArowanaFishMesh();
        f.group.position.set((i - 1.5) * 0.45, 0.25 + i * 0.16, (i % 2 - 0.5) * 0.35);
        tankGroup.add(f.group);
        fishes.push({ ...f, seed: i * 1.6 });
      }
      this.dioramaParts.fishes = fishes;

      // 3D Falling Water / Rain Droplets
      const rainDrops = [];
      const dropMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd });
      for (let i = 0; i < 20; i++) {
        const d = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 5), dropMat);
        d.position.set((Math.random() - 0.5) * 2.4, 1.2 + Math.random() * 2, (Math.random() - 0.5) * 1.2);
        tankGroup.add(d);
        rainDrops.push(d);
      }
      this.dioramaParts.rainDrops = rainDrops;
    } else if (theme === "motor") {
      this.scene.background = new THREE.Color(0x16121f);
      this.scene.fog = new THREE.FogExp2(0x16121f, 0.035);

      // Warm Wooden Workbench Table (@untabiru5 Video 2!)
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 0.5, 4.8),
        new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.65 })
      );
      desk.position.set(0.3, -0.25, -0.2);
      desk.receiveShadow = true;
      this.dioramaGroup.add(desk);

      const motorGroup = new THREE.Group();
      motorGroup.position.set(0.45, 1.05, -0.35);
      this.dioramaGroup.add(motorGroup);
      this.dioramaParts.motorGroup = motorGroup;

      // Laminated Grey Iron Stator Ring
      const stator = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.18, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.72, roughness: 0.32 })
      );
      stator.castShadow = true;
      motorGroup.add(stator);

      // Orange & Green Copper Windings inside Stator
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const coil = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.18, 0.26),
          new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0xd97706 : 0x16a34a,
            metalness: 0.6,
            roughness: 0.3
          })
        );
        coil.position.set(Math.cos(ang) * 0.54, Math.sin(ang) * 0.54, 0);
        coil.rotation.z = ang;
        motorGroup.add(coil);
      }

      // Spinning Rotor & 3 Translucent Blue Fan Blades!
      const rotorPivot = new THREE.Group();
      motorGroup.add(rotorPivot);
      this.dioramaParts.rotorPivot = rotorPivot;

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.38, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 })
      );
      hub.rotation.x = Math.PI / 2;
      rotorPivot.add(hub);

      const bladeMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.82,
        roughness: 0.18
      });
      for (let b = 0; b < 3; b++) {
        const bladeWrap = new THREE.Group();
        bladeWrap.rotation.z = (b * Math.PI * 2) / 3;
        const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.12, 0.62, 10), bladeMat);
        blade.scale.set(1, 1, 0.12);
        blade.position.set(0, 0.48, 0.22);
        blade.rotation.y = 0.25;
        bladeWrap.add(blade);
        rotorPivot.add(bladeWrap);
      }

      // White 1.5 µF Capacitor Box!
      const capacitor = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, 0.64, 0.36),
        new THREE.MeshStandardMaterial({ map: this.capTex, roughness: 0.35 })
      );
      capacitor.position.set(1.25, -0.42, 0.2);
      capacitor.castShadow = true;
      motorGroup.add(capacitor);
      this.dioramaParts.capacitor = capacitor;

      // Red Battery
      const battery = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.55, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
      );
      battery.rotation.z = Math.PI / 2;
      battery.position.set(-1.1, -0.78, 0.45);
      motorGroup.add(battery);
    } else if (theme === "agriculture") {
      this.scene.background = new THREE.Color(0x162638);
      this.scene.fog = new THREE.FogExp2(0x162638, 0.032);

      // Rice Field Water Bed & Grass Embankments (Exact @dhotscliper Minapadi vibe!)
      const fieldWater = new THREE.Mesh(
        new THREE.BoxGeometry(7.2, 0.3, 5.4),
        new THREE.MeshStandardMaterial({ color: 0x4d7c6f, roughness: 0.25, metalness: 0.15 })
      );
      fieldWater.position.set(0.2, -0.15, -0.4);
      this.dioramaGroup.add(fieldWater);

      // Raised Green Pematang (Embankment Path)
      const path = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.32, 5.4),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.85 })
      );
      path.position.set(0.35, 0.02, -0.4);
      this.dioramaGroup.add(path);

      // Swaying 3D Rice Stalks!
      const stalks = [];
      const stalkMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.7 });
      for (let r = 0; r < 24; r++) {
        const sx = (r % 6 - 2.5) * 0.72 + (r % 6 >= 3 ? 0.55 : -0.35);
        const sz = -1.8 + Math.floor(r / 6) * 0.85;
        const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.85, 5), stalkMat);
        stalk.position.set(sx, 0.42, sz);
        this.dioramaGroup.add(stalk);
        stalks.push({ mesh: stalk, seed: r * 0.6 });
      }
      this.dioramaParts.stalks = stalks;
      this.dioramaParts.stalkMat = stalkMat;

      // Swimming Orange Fish in Rice Field Water!
      const fishes = [];
      for (let i = 0; i < 6; i++) {
        const f = createArowanaFishMesh();
        f.group.scale.setScalar(0.58);
        f.group.position.set(-1.1 + (i % 3) * 0.9, 0.08, -1.2 + Math.floor(i / 3) * 1.1);
        this.dioramaGroup.add(f.group);
        fishes.push({ ...f, seed: i * 1.2 });
      }
      this.dioramaParts.fishes = fishes;
    } else {
      // Universal 3D Holographic Science / Solar / Filter Platform!
      this.scene.background = new THREE.Color(0x0c111e);
      this.scene.fog = new THREE.FogExp2(0x0c111e, 0.036);

      const floor = new THREE.Mesh(
        new THREE.CylinderGeometry(3.8, 4.1, 0.35, 24),
        new THREE.MeshStandardMaterial({ color: 0x161c2e, roughness: 0.5, metalness: 0.4 })
      );
      floor.position.set(0.2, -0.18, -0.2);
      floor.receiveShadow = true;
      this.dioramaGroup.add(floor);

      const sciCore = new THREE.Group();
      sciCore.position.set(0.5, 1.1, -0.45);
      this.dioramaGroup.add(sciCore);
      this.dioramaParts.sciCore = sciCore;

      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        metalness: 0.55,
        roughness: 0.22
      });
      const centerCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 1), coreMat);
      sciCore.add(centerCore);
      this.dioramaParts.centerCore = centerCore;
      this.dioramaParts.coreMat = coreMat;

      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.05, 10, 28),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.5 })
      );
      sciCore.add(ring1);
      this.dioramaParts.ring1 = ring1;

      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.84, 0.04, 10, 28),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x047857, emissiveIntensity: 0.5 })
      );
      ring2.rotation.x = Math.PI / 2;
      sciCore.add(ring2);
      this.dioramaParts.ring2 = ring2;
    }
  }

  // ============================================================================
  // UPDATE ALL 3D ANIMATIONS EVERY FRAME (60 FPS FULL-BODY MOTION + LIP-SYNC)
  // ============================================================================
  renderFrame(sceneData, topicText, tSec, voiceEnergy = 0, isPlaying = false) {
    const theme = this.detectTheme(`${topicText || ""} ${sceneData?.narration || ""}`);
    this.buildDiorama(theme);

    const phase = sceneData?.phase || "HOOK";
    const pose = sceneData?.mcPose || "default";
    const sceneNum = sceneData?.sceneNumber || 1;
    const speakWave = isPlaying ? Math.max(voiceEnergy, Math.abs(Math.sin(tSec * 12)) * 0.22) : voiceEnergy;

    // 1. CINEMATIC 3D CAMERA CHOREOGRAPHY (Smoothly shows BOTH MC Raja Iblis & Human Worker Diorama!)
    if (phase === "HOOK") {
      this.camPosGoal.set(-0.2 + Math.sin(tSec * 0.6) * 0.25, 2.15, 5.4);
      this.camLookGoal.set(-0.15, 1.12, 0.35);
    } else if (phase === "TAPI") {
      // Dramatic closer angle on the disaster + sarcastic MC reaction
      this.camPosGoal.set(0.35 + Math.sin(tSec * 0.9) * 0.22, 2.05, 4.9);
      this.camLookGoal.set(0.05, 1.05, 0.15);
    } else if (phase === "JADI") {
      // Clear explanatory showcase angle while MC points directly at the 3D mechanism!
      this.camPosGoal.set(-0.55 + Math.cos(tSec * 0.7) * 0.22, 2.25, 5.25);
      this.camLookGoal.set(0.15, 1.08, 0.0);
    } else {
      // CLIMAX ("SELAMAT!"): Hero slight orbital sweep
      this.camPosGoal.set(Math.sin(tSec * 0.55) * 1.15, 2.3, 5.45);
      this.camLookGoal.set(-0.1, 1.15, 0.25);
    }
    this.camera.position.lerp(this.camPosGoal, 0.06);
    this.cameraTarget.lerp(this.camLookGoal, 0.06);
    this.camera.lookAt(this.cameraTarget);

    // Dynamic Rim Light Color per Phase
    this.rimLight.color.setHex(
      phase === "TAPI" ? 0xff1e42 : phase === "JADI" ? 0xfbbf24 : phase === "CLIMAX" ? 0x10b981 : 0xe11d48
    );
    this.rimLight.intensity = 2.6 + speakWave * 2.4;

    // 2. FULL-BODY ARTICULATED 3D ANIMATION — MC RAJA IBLIS (EVERY LIMB MOVING FLUIDLY!)
    const mc = this.mc;
    const isLeftSide = sceneData?.mcPlacement !== "presenter-right";
    const targetMcX = phase === "CLIMAX" ? -0.95 : isLeftSide ? -1.18 : 1.18;
    const sideSign = targetMcX < 0 ? 1 : -1; // +1 means diorama is to his right/back

    mc.root.position.x = THREE.MathUtils.lerp(mc.root.position.x, targetMcX, 0.07);
    mc.root.position.z = THREE.MathUtils.lerp(mc.root.position.z, phase === "TAPI" ? 2.25 : 1.95, 0.07);

    // Smooth walking / dynamic weight-shift stance in legs & knees (NEVER FROZEN!)
    const walkFreq = isPlaying ? 3.8 : 2.1;
    const stepPhase = Math.sin(tSec * walkFreq);
    const stepAmp = phase === "CLIMAX" ? 0.24 : 0.16;

    mc.hips.position.y = 0.95 + Math.abs(Math.sin(tSec * walkFreq)) * 0.045 + speakWave * 0.03;
    mc.hips.rotation.y = sideSign * 0.24 + Math.sin(tSec * 1.4) * 0.12;
    mc.hips.rotation.z = Math.sin(tSec * walkFreq * 0.5) * 0.045;

    // Articulated Left & Right Legs + Knee Bending
    mc.leftLeg.hipJoint.rotation.x = stepPhase * stepAmp;
    mc.leftLeg.kneeJoint.rotation.x = Math.max(0, -stepPhase * 0.34);
    mc.rightLeg.hipJoint.rotation.x = -stepPhase * stepAmp;
    mc.rightLeg.kneeJoint.rotation.x = Math.max(0, stepPhase * 0.34);

    // Torso Breathing + Lean Forward toward Camera / Toward Diorama
    mc.spine.rotation.x = 0.04 + Math.sin(tSec * 2.6) * 0.04 + speakWave * 0.06;
    mc.spine.rotation.y = Math.sin(tSec * 1.6) * 0.14;

    // Billowing Coat Tails Physics
    mc.coatTailBack.rotation.x = 0.18 + Math.sin(tSec * 4.2) * 0.12 + speakWave * 0.1;
    mc.coatTailLeft.rotation.z = -0.14 - Math.sin(tSec * 3.8) * 0.08;
    mc.coatTailRight.rotation.z = 0.14 + Math.sin(tSec * 3.8 + 1) * 0.08;

    // Expressive Head Turn (Alternating between looking at viewer & looking over at the 3D human worker!)
    const glanceCycle = Math.sin(tSec * 1.15);
    mc.head.rotation.y =
      (glanceCycle > 0.35 ? sideSign * 0.42 : -sideSign * 0.14) + Math.sin(tSec * 2.8) * 0.08;
    mc.head.rotation.x =
      (pose === "sarcastic" ? 0.08 : -0.04) + Math.sin(tSec * 3.4) * 0.05 - speakWave * 0.08;
    mc.head.rotation.z =
      pose === "sarcastic" ? Math.sin(tSec * 6.0) * 0.12 : Math.sin(tSec * 1.9) * 0.06;

    // REAL-TIME AUDIO LIP-SYNC MOUTH ANIMATION!
    const mouthOpen = 0.16 + speakWave * 1.35 + (isPlaying ? Math.abs(Math.sin(tSec * 18)) * 0.25 : 0);
    mc.mouthInner.scale.y = THREE.MathUtils.clamp(mouthOpen, 0.14, 1.45);
    mc.mouthInner.scale.x = 1.0 + speakWave * 0.25;

    // Natural Eye Blinking every 3.2 seconds
    const blinkT = tSec % 3.2;
    const blinkScale = blinkT > 3.04 ? 1.05 : 0.08;
    mc.eyelids.forEach((lid) => {
      lid.scale.y = THREE.MathUtils.lerp(lid.scale.y, blinkScale, 0.45);
    });

    // Expressive Eyebrows per Phase
    if (pose === "sarcastic") {
      mc.eyebrows[0].rotation.z = -0.26;
      mc.eyebrows[1].rotation.z = 0.14;
    } else if (pose === "explaining") {
      mc.eyebrows[0].rotation.z = 0.12;
      mc.eyebrows[1].rotation.z = -0.12;
    } else {
      mc.eyebrows[0].rotation.z = -0.08;
      mc.eyebrows[1].rotation.z = 0.08;
    }

    // ARTICULATED ARMS & HANDS GESTURES PER PHASE (Pointing at Diorama, Sarcastic Reaction, Victory!)
    const gWave = Math.sin(tSec * 4.4);
    const gWave2 = Math.cos(tSec * 3.6);

    if (pose === "explaining" || phase === "JADI") {
      // Pointing arm actively gesturing straight toward the 3D diorama & human worker!
      const pointerArm = sideSign > 0 ? mc.rightArm : mc.leftArm;
      const supportArm = sideSign > 0 ? mc.leftArm : mc.rightArm;

      pointerArm.shoulder.rotation.x = -1.25 + gWave * 0.18 - speakWave * 0.2;
      pointerArm.shoulder.rotation.z = sideSign * -0.52 + gWave2 * 0.12;
      pointerArm.elbow.rotation.x = -0.35 + gWave * 0.2;
      pointerArm.magicOrb.scale.setScalar(0.85 + speakWave * 0.65);
      pointerArm.magicOrb.rotation.y = tSec * 4.5;

      supportArm.shoulder.rotation.x = -0.45 + gWave2 * 0.14;
      supportArm.shoulder.rotation.z = -sideSign * -0.22;
      supportArm.elbow.rotation.x = -0.85;
      supportArm.magicOrb.scale.setScalar(0.001);
    } else if (pose === "sarcastic" || phase === "TAPI") {
      // Exasperated sarcastic "look at this human!" gesture + palm-up shake
      mc.leftArm.shoulder.rotation.x = -0.88 + gWave * 0.16;
      mc.leftArm.shoulder.rotation.z = -0.35;
      mc.leftArm.elbow.rotation.x = -1.15 + gWave2 * 0.18;
      mc.leftArm.magicOrb.scale.setScalar(0.001);

      mc.rightArm.shoulder.rotation.x = -1.05 + gWave2 * 0.22;
      mc.rightArm.shoulder.rotation.z = 0.48 + gWave * 0.14;
      mc.rightArm.elbow.rotation.x = -0.65;
      mc.rightArm.magicOrb.scale.setScalar(0.001);
    } else if (pose === "eureka" || phase === "CLIMAX") {
      // Commanding Overlord Victory Gesture — arms sweeping proudly with glowing energy orbs!
      mc.leftArm.shoulder.rotation.x = -1.65 + gWave * 0.16;
      mc.leftArm.shoulder.rotation.z = -0.58 + gWave2 * 0.1;
      mc.leftArm.elbow.rotation.x = -0.35;
      mc.leftArm.magicOrb.scale.setScalar(1.0 + speakWave * 0.5);
      mc.leftArm.magicOrb.rotation.y = tSec * 5.0;

      mc.rightArm.shoulder.rotation.x = -1.65 - gWave * 0.16;
      mc.rightArm.shoulder.rotation.z = 0.58 - gWave2 * 0.1;
      mc.rightArm.elbow.rotation.x = -0.35;
      mc.rightArm.magicOrb.scale.setScalar(1.0 + speakWave * 0.5);
      mc.rightArm.magicOrb.rotation.y = -tSec * 5.0;
    } else {
      // HOOK / Default Charismatic Presenter Stance (inviting wave + stylish hip-hand)
      mc.leftArm.shoulder.rotation.x = -0.35 + gWave * 0.15;
      mc.leftArm.shoulder.rotation.z = -0.28;
      mc.leftArm.elbow.rotation.x = -0.95;
      mc.leftArm.magicOrb.scale.setScalar(0.001);

      mc.rightArm.shoulder.rotation.x = -1.1 + gWave2 * 0.22 - speakWave * 0.18;
      mc.rightArm.shoulder.rotation.z = 0.42 + gWave * 0.14;
      mc.rightArm.elbow.rotation.x = -0.55 + gWave * 0.18;
      mc.rightArm.magicOrb.scale.setScalar(0.55 + speakWave * 0.4);
      mc.rightArm.magicOrb.rotation.y = tSec * 3.5;
    }

    // Broken Left Horn Glowing Crimson Sparks & Shoulder Dark Shadow Wisps
    mc.lhSpark.rotation.y = tSec * 5;
    mc.lhSpark.scale.setScalar(0.75 + Math.abs(Math.sin(tSec * 8)) * 0.6 + speakWave * 0.5);

    mc.shadowWisps.forEach((w) => {
      const cycle = (tSec * 0.9 + w.phase) % 2.0;
      w.mesh.position.set(
        w.side * (0.28 + Math.sin(tSec * 2 + w.phase) * 0.12),
        0.48 + cycle * 0.34,
        -0.08 + Math.cos(tSec * 2.5 + w.phase) * 0.1
      );
      const s = Math.sin((cycle / 2.0) * Math.PI) * (0.8 + speakWave * 0.6);
      w.mesh.scale.setScalar(Math.max(0.01, s));
    });

    // Arcane Magic Ring behind MC on JADI / CLIMAX
    const showRing = phase === "JADI" || phase === "CLIMAX";
    mc.arcaneRing.material.opacity = THREE.MathUtils.lerp(
      mc.arcaneRing.material.opacity,
      showRing ? 0.68 : 0.0,
      0.08
    );
    mc.arcaneRing.rotation.z = tSec * 1.1;

    // 3. ARTICULATED 3D HUMAN WORKER ANIMATION (Digging, Assembling, Panicking on TAPI, Celebrating on CLIMAX!)
    const wk = this.worker;
    wk.root.position.set(isLeftSide ? 1.55 : -1.45, 0.02, -0.25);
    wk.root.rotation.y = isLeftSide ? -0.55 : 0.55;

    if (phase === "TAPI") {
      // Panicking human waving both hands in the air!
      wk.hips.position.y = 0.62 + Math.abs(Math.sin(tSec * 11)) * 0.1;
      wk.leftArm.rotation.x = -2.4 + Math.sin(tSec * 14) * 0.45;
      wk.rightArm.rotation.x = -2.4 - Math.sin(tSec * 14) * 0.45;
      wk.head.rotation.y = Math.sin(tSec * 12) * 0.35;
      wk.leftLeg.rotation.x = Math.sin(tSec * 11) * 0.3;
      wk.rightLeg.rotation.x = -Math.sin(tSec * 11) * 0.3;
    } else if (phase === "CLIMAX") {
      // Happy cheering jump!
      wk.hips.position.y = 0.62 + Math.abs(Math.sin(tSec * 6.5)) * 0.14;
      wk.leftArm.rotation.x = -2.65;
      wk.rightArm.rotation.x = -2.65;
      wk.head.rotation.y = Math.sin(tSec * 3) * 0.15;
    } else {
      // Actively working (digging / assembling / carrying)!
      const workWave = Math.sin(tSec * 5.2);
      wk.hips.position.y = 0.62 + Math.abs(workWave) * 0.03;
      wk.hips.rotation.x = 0.18 + workWave * 0.12;
      wk.rightArm.rotation.x = -1.05 + workWave * 0.72;
      wk.leftArm.rotation.x = -0.85 + workWave * 0.52;
      wk.leftLeg.rotation.x = workWave * 0.18;
      wk.rightLeg.rotation.x = -workWave * 0.18;
      wk.head.rotation.x = 0.2 + workWave * 0.1;
    }

    // 4. ANIMATE 3D DIORAMA WORLD PROPS PER SCENE
    const lowerNarr = `${sceneData?.narration || ""} ${sceneData?.componentLabel || ""}`.toLowerCase();

    if (theme === "aquarium" || theme === "pond") {
      const p = this.dioramaParts;
      const isMurky =
        phase === "TAPI" &&
        (lowerNarr.includes("luruh") ||
          lowerNarr.includes("keruh") ||
          lowerNarr.includes("klorin") ||
          lowerNarr.includes("amonia"));
      if (p.waterMat) {
        p.waterMat.color.setHex(isMurky ? 0x7c582d : 0x38bdf8);
      }
      if (p.fenceGroup) p.fenceGroup.visible = sceneNum >= 5;
      if (p.filterGroup) p.filterGroup.visible = sceneNum >= 3;
      if (p.canopyGroup) p.canopyGroup.visible = sceneNum >= 7;
      if (p.pingpong) {
        p.pingpong.visible = theme === "aquarium" && sceneNum >= 6;
        p.pingpong.position.y = 0.92 + Math.sin(tSec * 3.5) * 0.03;
        p.pingpong.position.x = -0.5 + Math.sin(tSec * 1.4) * 0.3;
      }

      // Swimming & Jumping 3D Red Arowana!
      const isJumpingScene = lowerNarr.includes("loncat") || lowerNarr.includes("lompat");
      (p.fishes || []).forEach((f, idx) => {
        const swimAngle = tSec * 1.35 + f.seed;
        if (isJumpingScene && idx === 0) {
          const jumpArc = Math.abs(Math.sin(tSec * 3.4));
          f.group.position.set(Math.sin(tSec * 1.5) * 0.5, 0.55 + jumpArc * 1.15, 0.1);
          f.group.rotation.z = Math.cos(tSec * 3.4) * 0.85;
        } else {
          const nx = Math.sin(swimAngle) * 0.82;
          const nz = Math.cos(swimAngle * 0.8) * 0.38;
          f.group.position.set(nx, 0.25 + idx * 0.16 + Math.sin(tSec * 2 + idx) * 0.05, nz);
          f.group.rotation.y = Math.cos(swimAngle) >= 0 ? 0 : Math.PI;
          f.group.rotation.z = 0;
        }
        f.tail.rotation.y = Math.sin(tSec * 14 + idx) * 0.4;
      });

      // Rain / Trickle Drops
      const showRain = lowerNarr.includes("hujan") || lowerNarr.includes("filter") || sceneNum >= 6;
      (p.rainDrops || []).forEach((d, i) => {
        d.visible = showRain;
        if (showRain) {
          d.position.y -= 0.075;
          if (d.position.y < 0.2) d.position.y = 2.4 + (i % 3) * 0.3;
        }
      });
    } else if (theme === "motor") {
      const p = this.dioramaParts;
      const isSpinning = phase === "JADI" || phase === "CLIMAX";
      const isHumming = phase === "TAPI";
      if (p.rotorPivot) {
        if (isSpinning) p.rotorPivot.rotation.z -= 0.22;
        else if (isHumming) p.rotorPivot.rotation.z = Math.sin(tSec * 45) * 0.08;
      }
      if (p.motorGroup) {
        p.motorGroup.position.x = 0.45 + (isHumming ? Math.sin(tSec * 50) * 0.035 : 0);
      }
      if (p.capacitor) {
        p.capacitor.visible = sceneNum >= 4 || lowerNarr.includes("kapasitor");
      }
    } else if (theme === "agriculture") {
      const p = this.dioramaParts;
      if (p.stalkMat) {
        p.stalkMat.color.setHex(phase === "CLIMAX" ? 0xeab308 : 0x84cc16);
      }
      (p.stalks || []).forEach((s) => {
        s.mesh.rotation.z = Math.sin(tSec * 2.4 + s.seed) * 0.12;
      });
      (p.fishes || []).forEach((f, idx) => {
        const ang = tSec * 1.4 + f.seed;
        f.group.position.x = -0.8 + Math.sin(ang) * 0.85;
        f.group.rotation.y = Math.cos(ang) >= 0 ? 0 : Math.PI;
        f.tail.rotation.y = Math.sin(tSec * 14 + idx) * 0.4;
      });
    } else {
      const p = this.dioramaParts;
      if (p.centerCore) {
        p.centerCore.rotation.y = tSec * 1.3;
        p.centerCore.rotation.x = tSec * 0.8;
        p.centerCore.scale.setScalar(1 + Math.sin(tSec * 3) * 0.08);
      }
      if (p.coreMat) {
        p.coreMat.color.setHex(phase === "TAPI" ? 0xf43f5e : phase === "CLIMAX" ? 0x10b981 : 0x38bdf8);
      }
      if (p.ring1) p.ring1.rotation.z = tSec * 1.5;
      if (p.ring2) p.ring2.rotation.y = -tSec * 1.9;
    }

    // Floating Atmospheric Embers
    this.embers.forEach((e) => {
      e.mesh.position.y += e.speed * 0.015;
      if (e.mesh.position.y > 4.2) e.mesh.position.y = 0.1;
      e.mesh.position.x += Math.sin(tSec + e.phase) * 0.005;
    });

    this.renderer.render(this.scene, this.camera);
  }
}
