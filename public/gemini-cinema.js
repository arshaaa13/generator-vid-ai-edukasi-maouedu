// MaouEdu Gemini Cinema Engine — Kling-Class WebGL2 PBR + Custom GLSL Shader + Volumetric VFX Renderer
// Renders Gemini-compiled Cinema Blueprints (and optional Nano Banana AI Keyframes) at 60 FPS
// with PMREM Studio HDRI Reflections, Custom GLSL Sky/Water/God-Ray Shaders, Multi-Tap Filmic Bloom,
// Anamorphic Lens Flare, GPU Scene Transitions, and 47+ Multi-Part Articulated 3D Hero Prefabs.

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import {
  buildProceduralCustomRig,
  animateProceduralCustomRig
} from "/video-engine/procedural-rig-builder.js";
import {
  evaluateKeyframeTrack,
  computeSpringPhysicsDeform,
  computeMotionBrushOffset
} from "/video-engine/physics-motion-brush.js";
import { PostCinemaPipeline } from "/video-engine/post-cinema-pipeline.js";

// ============================================================================
// 1. EASING & PROCEDURAL PBR TEXTURES (ALBEDO + BUMP/ROUGHNESS)
// ============================================================================
function easeOutBack(x) {
  const t = Math.max(0, Math.min(1, x));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInOutCubic(x) {
  const t = Math.max(0, Math.min(1, x));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function evalQuadBezier(p0, p1, p2, t) {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    u * u * p0[2] + 2 * u * t * p1[2] + t * t * p2[2]
  ];
}

function makeCanvasTex(size, drawFn, repeatX = 1, repeatY = 1) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  drawFn(g, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

function createCinemaTextures() {
  const wood = makeCanvasTex(
    256,
    (g, s) => {
      const grad = g.createLinearGradient(0, 0, 0, s);
      grad.addColorStop(0, "#b97337");
      grad.addColorStop(0.5, "#cc8444");
      grad.addColorStop(1, "#a6622b");
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 42; i++) {
        g.fillStyle = i % 2 === 0 ? "rgba(92,45,12,0.16)" : "rgba(255,220,175,0.1)";
        g.fillRect(0, i * 6 + ((i * 7) % 3), s, 2 + (i % 2));
      }
      g.strokeStyle = "rgba(60,28,8,0.28)";
      g.lineWidth = 2;
      for (let y = 64; y < s; y += 64) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(s, y);
        g.stroke();
      }
    },
    3,
    2
  );

  const brushedMetal = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#cbd5e1";
      g.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 2) {
        const v = 185 + ((y * 37) % 45);
        g.fillStyle = `rgb(${v},${v + 4},${v + 10})`;
        g.fillRect(0, y, s, 1.5);
      }
    },
    2,
    2
  );

  const cyberGrid = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#0b1120";
      g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(56,189,248,0.34)";
      g.lineWidth = 2;
      for (let p = 0; p <= s; p += 32) {
        g.beginPath();
        g.moveTo(p, 0);
        g.lineTo(p, s);
        g.stroke();
        g.beginPath();
        g.moveTo(0, p);
        g.lineTo(s, p);
        g.stroke();
      }
      g.fillStyle = "rgba(56,189,248,0.55)";
      for (let x = 32; x < s; x += 64) {
        for (let y = 32; y < s; y += 64) {
          g.beginPath();
          g.arc(x, y, 3, 0, Math.PI * 2);
          g.fill();
        }
      }
    },
    4,
    4
  );

  const tile = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#fff7ed";
      g.fillRect(0, 0, s, s);
      g.strokeStyle = "#e2ccb8";
      g.lineWidth = 3;
      for (let p = 0; p <= s; p += 64) {
        g.beginPath();
        g.moveTo(p, 0);
        g.lineTo(p, s);
        g.stroke();
        g.beginPath();
        g.moveTo(0, p);
        g.lineTo(s, p);
        g.stroke();
      }
    },
    4,
    3
  );

  const solar = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#0f172a";
      g.fillRect(0, 0, s, s);
      g.fillStyle = "#1e3a8a";
      for (let x = 6; x < s; x += 32) {
        for (let y = 6; y < s; y += 32) {
          g.fillRect(x, y, 26, 26);
        }
      }
      g.strokeStyle = "rgba(186,230,253,0.55)";
      g.lineWidth = 1.5;
      for (let p = 0; p <= s; p += 32) {
        g.beginPath();
        g.moveTo(p, 0);
        g.lineTo(p, s);
        g.stroke();
        g.beginPath();
        g.moveTo(0, p);
        g.lineTo(s, p);
        g.stroke();
      }
    },
    1,
    1
  );

  const asphalt = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#1e293b";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 420; i++) {
        const x = (i * 73) % s;
        const y = (i * 137) % s;
        g.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.18)";
        g.fillRect(x, y, 2, 2);
      }
    },
    4,
    3
  );

  const lavaRock = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#1c1917";
      g.fillRect(0, 0, s, s);
      g.strokeStyle = "#f97316";
      g.lineWidth = 4;
      for (let i = 0; i < 12; i++) {
        g.beginPath();
        g.moveTo((i * 41) % s, 0);
        g.lineTo(((i * 97) % s), s * 0.5);
        g.lineTo(((i * 53) % s), s);
        g.stroke();
      }
    },
    3,
    3
  );

  const grass = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#4d7c0f";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 280; i++) {
        g.fillStyle = i % 2 === 0 ? "#65a30d" : "#3f6212";
        g.fillRect((i * 59) % s, (i * 83) % s, 3, 7);
      }
    },
    5,
    5
  );

  const brick = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#d6c5b3";
      g.fillRect(0, 0, s, s);
      for (let r = 0; r < 8; r++) {
        const off = (r % 2) * 32;
        for (let c = -1; c <= 4; c++) {
          g.fillStyle = (r + c) % 2 === 0 ? "#b4432e" : "#993422";
          g.fillRect(c * 64 + off + 3, r * 32 + 3, 58, 26);
        }
      }
    },
    3,
    2
  );

  const subwayTile = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#e5dfd5";
      g.fillRect(0, 0, s, s);
      for (let r = 0; r < 8; r++) {
        const off = (r % 2) * 32;
        for (let c = -1; c <= 4; c++) {
          g.fillStyle = (r + c) % 2 === 0 ? "#fdfbf7" : "#f7f3eb";
          g.fillRect(c * 64 + off + 2, r * 32 + 2, 60, 28);
        }
      }
    },
    4,
    3
  );

  const plaster = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#f4ede2";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 360; i++) {
        const x = (i * 67) % s;
        const y = (i * 113) % s;
        g.fillStyle = i % 2 === 0 ? "rgba(180,160,130,0.06)" : "rgba(255,255,255,0.09)";
        g.fillRect(x, y, 6, 4);
      }
    },
    2,
    2
  );

  const pegboard = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#e7dcc8";
      g.fillRect(0, 0, s, s);
      g.fillStyle = "#9c8566";
      for (let y = 16; y < s; y += 24) {
        for (let x = 16; x < s; x += 24) {
          g.beginPath();
          g.arc(x, y, 3.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    },
    3,
    2
  );

  const marbleCounter = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#f3efe8";
      g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(148,163,184,0.18)";
      g.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        g.beginPath();
        g.moveTo(0, (i * 29) % s);
        g.lineTo(s * 0.45, ((i * 53 + 22) % s));
        g.lineTo(s, ((i * 37 + 40) % s));
        g.stroke();
      }
    },
    3,
    2
  );

  const concrete = makeCanvasTex(
    256,
    (g, s) => {
      g.fillStyle = "#d6dce2";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 300; i++) {
        g.fillStyle = i % 2 === 0 ? "rgba(100,116,139,0.08)" : "rgba(255,255,255,0.1)";
        g.fillRect((i * 71) % s, (i * 97) % s, 5, 5);
      }
    },
    3,
    3
  );

  return {
    wood,
    brushedMetal,
    cyberGrid,
    tile,
    solar,
    asphalt,
    lavaRock,
    grass,
    brick,
    subwayTile,
    plaster,
    pegboard,
    marbleCounter,
    concrete
  };
}

function buildHollowVesselGeo(profilePts, segs = 30) {
  if (typeof THREE.LatheGeometry !== "function" || !Array.isArray(profilePts) || profilePts.length < 3) {
    return new THREE.CylinderGeometry(0.45, 0.32, 0.42, 24);
  }
  const vecs = profilePts.map(([r, y]) => new THREE.Vector2(Math.max(0.002, r), y));
  const geo = new THREE.LatheGeometry(vecs, segs);
  geo.computeVertexNormals?.();
  return geo;
}

function buildRoundedBox(w = 1, h = 1, d = 1, r = 0.06) {
  if (typeof THREE.Shape !== "function" || typeof THREE.ExtrudeGeometry !== "function") {
    return new THREE.BoxGeometry(w, h, d);
  }
  const rad = Math.min(r, w * 0.25, h * 0.25, d * 0.25);
  const hw = w / 2 - rad;
  const hh = h / 2 - rad;
  const s = new THREE.Shape();
  s.moveTo(-hw, -hh - rad);
  s.lineTo(hw, -hh - rad);
  s.quadraticCurveTo(hw + rad, -hh - rad, hw + rad, -hh);
  s.lineTo(hw + rad, hh);
  s.quadraticCurveTo(hw + rad, hh + rad, hw, hh + rad);
  s.lineTo(-hw, hh + rad);
  s.quadraticCurveTo(-hw - rad, hh + rad, -hw - rad, hh);
  s.lineTo(-hw - rad, -hh);
  s.quadraticCurveTo(-hw - rad, -hh - rad, -hw, -hh - rad);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.02, d - rad * 2),
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: rad,
    bevelThickness: rad
  });
  g.center();
  return g;
}

// ============================================================================
// 2. CUSTOM GLSL SHADERS (SKY DOME, WATER CAUSTICS, GOD RAYS, POST-BLOOM)
// ============================================================================
const SKY_VERTEX_SHADER = `
  varying vec3 vWorldDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_FRAGMENT_SHADER = `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uBottomColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uStars;
  varying vec3 vWorldDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y, -1.0, 1.0);
    vec3 col = h >= 0.0
      ? mix(uHorizonColor, uTopColor, pow(max(h, 0.0001), 0.62))
      : mix(uHorizonColor, uBottomColor, pow(max(-h, 0.0001), 0.55));

    // Volumetric sun / moon halo
    float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0001);
    col += uSunColor * pow(sunAmt, 14.0) * 0.48;
    col += uSunColor * pow(sunAmt, 160.0) * 1.15;

    // Soft animated clouds
    if (h > 0.02) {
      vec2 cuv = dir.xz / (h + 0.28) * 1.65 + vec2(uTime * 0.025, uTime * 0.01);
      float n = noise(cuv) * 0.6 + noise(cuv * 2.2 + 4.1) * 0.4;
      float cloud = smoothstep(0.56, 0.85, n) * smoothstep(0.02, 0.25, h) * (1.0 - smoothstep(0.65, 0.98, h));
      col = mix(col, mix(uHorizonColor, vec3(1.0), 0.72), cloud * (0.45 - uStars * 0.28));
    }

    // Starfield for space/night moods
    if (uStars > 0.05 && h > -0.1) {
      vec2 suv = floor(dir.xz / (abs(dir.y) + 0.35) * 95.0);
      float st = hash(suv);
      if (st > 0.992) {
        float twinkle = 0.55 + 0.45 * sin(uTime * 4.5 + st * 400.0);
        col += vec3(1.0, 0.97, 0.88) * twinkle * uStars;
      }
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

const WATER_VERTEX_SHADER = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float w = sin(pos.x * 5.2 + uTime * 3.1) * 0.025 + cos(pos.z * 4.8 - uTime * 2.6) * 0.022;
    pos.y += w;
    vWave = w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WATER_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    float c1 = sin(vUv.x * 26.0 + uTime * 2.4 + sin(vUv.y * 18.0 - uTime * 1.7));
    float c2 = cos(vUv.y * 24.0 - uTime * 2.1 + cos(vUv.x * 16.0 + uTime * 1.9));
    float caustic = pow(max(0.0, (c1 + c2) * 0.5), 3.0);
    vec3 col = uColor + vec3(0.55, 0.88, 1.0) * caustic * 0.42 + vec3(0.2) * (vWave * 10.0);
    gl_FragColor = vec4(col, 0.74);
  }
`;

// ============================================================================
// 3. PBR MATERIAL FACTORY + UPGRADED PIXAR-STYLE PROTAGONIST + 47 HERO PREFABS
// ============================================================================
function createPbrMaterial(materialType, colorHex, tex, emissiveIntensity = 0.0) {
  const color = new THREE.Color(colorHex || "#38bdf8");
  const em = emissiveIntensity > 0 ? color.clone().multiplyScalar(Math.min(1.5, emissiveIntensity)) : new THREE.Color(0x000000);

  if (materialType === "metal_chrome") {
    return new THREE.MeshPhysicalMaterial({
      color,
      map: tex.brushedMetal,
      metalness: 0.92,
      roughness: 0.14,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      emissive: em
    });
  }
  if (materialType === "brushed_steel") {
    return new THREE.MeshStandardMaterial({
      color,
      map: tex.brushedMetal,
      metalness: 0.78,
      roughness: 0.3,
      emissive: em
    });
  }
  if (materialType === "gold_luxury") {
    return new THREE.MeshPhysicalMaterial({
      color: colorHex ? color : new THREE.Color(0xfbbf24),
      metalness: 0.94,
      roughness: 0.18,
      clearcoat: 0.9,
      emissive: em
    });
  }
  if (materialType === "glass_crystal" || materialType === "water_clear" || materialType === "ice_translucent") {
    return new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity: materialType === "water_clear" ? 0.56 : 0.42,
      roughness: materialType === "ice_translucent" ? 0.18 : 0.06,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      emissive: em
    });
  }
  if (materialType === "emissive_neon" || materialType === "magma_glow") {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone(),
      emissiveIntensity: Math.max(0.95, emissiveIntensity),
      roughness: 0.25,
      metalness: 0.2
    });
  }
  if (materialType === "wood_oak") {
    return new THREE.MeshStandardMaterial({
      color,
      map: tex.wood,
      roughness: 0.52,
      metalness: 0.05
    });
  }
  if (materialType === "ceramic") {
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.18,
      metalness: 0.04,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      emissive: em
    });
  }
  if (materialType === "matte_clay") {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.62,
      metalness: 0.05,
      emissive: em
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.24,
    metalness: 0.14,
    clearcoat: 0.65,
    clearcoatRoughness: 0.2,
    emissive: em
  });
}

function buildCurvedTubeMesh(from, to, radius = 0.04, colorHex = "#38bdf8", glow = false) {
  const p1 = new THREE.Vector3(from[0], from[1], from[2]);
  const p2 = new THREE.Vector3(to[0], to[1], to[2]);
  const mid = p1.clone().lerp(p2, 0.5);
  mid.y += 0.22;
  const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex || "#38bdf8"),
    emissive: glow ? new THREE.Color(colorHex || "#38bdf8") : new THREE.Color(0x000000),
    emissiveIntensity: glow ? 0.9 : 0,
    metalness: glow ? 0.25 : 0.68,
    roughness: 0.25
  });
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, radius, 10, false), mat);
  mesh.castShadow = true;
  return mesh;
}

function createCinemaProtagonist(colorHex = "#0d9488", accentHex = "#f59e0b") {
  const root = new THREE.Group();
  const skinMat = new THREE.MeshPhysicalMaterial({ color: 0xf1bfa0, roughness: 0.42, clearcoat: 0.12 });
  const hoodieMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(colorHex), roughness: 0.48, clearcoat: 0.15 });
  const accentMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accentHex), roughness: 0.35, metalness: 0.2 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const shoeMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.25, clearcoat: 0.5 });
  const hairMat = new THREE.MeshPhysicalMaterial({ color: 0x18181b, roughness: 0.38, clearcoat: 0.25 });

  // Soft contact shadow disc
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 20),
    new THREE.MeshBasicMaterial({ color: 0x090a0f, transparent: true, opacity: 0.28 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);

  const hips = new THREE.Group();
  hips.position.y = 0.68;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.36, 12, 18), hoodieMat);
  torso.position.y = 0.32;
  torso.castShadow = true;
  hips.add(torso);

  // Collar + chest accent emblem
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 10, 20), accentMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.54;
  hips.add(collar);

  const head = new THREE.Group();
  head.position.y = 0.74;
  hips.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.245, 24, 20), skinMat);
  skull.castShadow = true;
  head.add(skull);

  // Stylized Pixar/Anime Hair Crown + Front Tuft
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.255, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
  hairCap.position.y = 0.025;
  head.add(hairCap);
  for (let s = -1; s <= 1; s++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8), hairMat);
    spike.position.set(s * 0.075, 0.16, 0.18);
    spike.rotation.set(0.65, 0, -s * 0.25);
    head.add(spike);
  }

  // Expressive Eyes with White Specular Catchlights
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eyeGroup = new THREE.Group();
  [-0.08, 0.08].forEach((ex) => {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), eyeWhiteMat);
    ew.scale.set(1, 1.12, 0.6);
    ew.position.set(ex, 0.02, 0.215);
    eyeGroup.add(ew);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), pupilMat);
    pupil.position.set(ex, 0.02, 0.236);
    eyeGroup.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), eyeWhiteMat);
    glint.position.set(ex + 0.01, 0.032, 0.252);
    eyeGroup.add(glint);
  });
  head.add(eyeGroup);

  // Animated Eyebrows & Mouth
  const browMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
  const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.018), browMat);
  leftBrow.position.set(-0.08, 0.09, 0.232);
  head.add(leftBrow);
  const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.018), browMat);
  rightBrow.position.set(0.08, 0.09, 0.232);
  head.add(rightBrow);

  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0x7f1d1d })
  );
  mouth.scale.set(1.3, 0.55, 0.5);
  mouth.position.set(0, -0.075, 0.228);
  head.add(mouth);

  // Arms & Legs
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.29, 0.46, 0);
  hips.add(leftArm);
  const la = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.32, 8, 12), hoodieMat);
  la.position.y = -0.19;
  la.castShadow = true;
  leftArm.add(la);
  const lh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), skinMat);
  lh.position.y = -0.39;
  leftArm.add(lh);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.29, 0.46, 0);
  hips.add(rightArm);
  const ra = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.32, 8, 12), hoodieMat);
  ra.position.y = -0.19;
  ra.castShadow = true;
  rightArm.add(ra);
  const rh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), skinMat);
  rh.position.y = -0.39;
  rightArm.add(rh);

  [-0.11, 0.11].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.38, 8, 12), pantsMat);
    leg.position.set(lx, -0.26, 0);
    leg.castShadow = true;
    hips.add(leg);
    const shoe = new THREE.Mesh(buildRoundedBox(0.14, 0.09, 0.23, 0.03), shoeMat);
    shoe.position.set(lx, -0.53, 0.05);
    hips.add(shoe);
  });

  root.userData.rig = { hips, head, eyeGroup, leftBrow, rightBrow, mouth, leftArm, rightArm };
  return root;
}

function buildSpinBladeFan(radius = 0.35, blades = 4, colorHex = "#38bdf8") {
  const g = new THREE.Group();
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, 0.1, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
  );
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  const bMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(colorHex), roughness: 0.22, metalness: 0.35, clearcoat: 0.7 });
  for (let i = 0; i < blades; i++) {
    const ang = (i / blades) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.rotation.z = ang;
    const b = new THREE.Mesh(buildRoundedBox(radius * 0.3, radius * 0.82, 0.026, 0.01), bMat);
    b.position.y = radius * 0.46;
    b.rotation.y = 0.28;
    pivot.add(b);
    g.add(pivot);
  }
  return g;
}

function buildCinemaActorPrefab(actor, tex) {
  const p = actor.prefab;
  if (p === "custom_rig" && actor.customRig) {
    return buildProceduralCustomRig(actor.customRig, (mType, col, em) =>
      createPbrMaterial(mType, col, tex, em)
    );
  }
  const mat = createPbrMaterial(actor.materialType, actor.color, tex, actor.emissiveIntensity);
  const secMat = createPbrMaterial("metal_chrome", actor.secondaryColor || "#fbbf24", tex, actor.emissiveIntensity * 0.5);
  const neonMat = createPbrMaterial("emissive_neon", actor.secondaryColor || "#38bdf8", tex, 1.3);
  const glassMat = createPbrMaterial("glass_crystal", "#e0f2fe", tex, 0.05);
  const g = new THREE.Group();

  if (p === "human_protagonist") {
    return createCinemaProtagonist(actor.color, actor.secondaryColor);
  }

  if (p === "pipe_curved" || p === "wire_arc") {
    return buildCurvedTubeMesh(
      actor.from || [-0.6, 0.45, 0],
      actor.to || [0.6, 0.45, 0],
      p === "pipe_curved" ? 0.045 : 0.024,
      actor.color,
      actor.materialType === "emissive_neon" || actor.emissiveIntensity > 0.3
    );
  }

  if (p === "rocket_ship") {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.35, 24), mat);
    body.castShadow = true;
    g.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.48, 24), secMat);
    nose.position.y = 0.91;
    g.add(nose);
    const windowRim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 10, 20), secMat);
    windowRim.position.set(0, 0.25, 0.25);
    g.add(windowRim);
    const windowGlass = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), createPbrMaterial("emissive_neon", "#38bdf8", tex, 1.0));
    windowGlass.position.set(0, 0.25, 0.22);
    g.add(windowGlass);
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(buildRoundedBox(0.06, 0.44, 0.32, 0.02), secMat);
      const a = (i / 3) * Math.PI * 2;
      fin.position.set(Math.cos(a) * 0.34, -0.45, Math.sin(a) * 0.34);
      fin.rotation.y = -a + Math.PI / 2;
      g.add(fin);
    }
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.72, 16),
      createPbrMaterial("emissive_neon", "#f97316", tex, 1.6)
    );
    flame.rotation.x = Math.PI;
    flame.position.y = -0.96;
    g.add(flame);
    g.userData.pulseChild = flame;
    return g;
  }

  if (p === "aircraft_jet") {
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 1.75, 18), mat);
    fuse.rotation.x = Math.PI / 2;
    fuse.castShadow = true;
    g.add(fuse);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.55, 18), mat);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 1.14;
    g.add(nose);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), glassMat);
    canopy.scale.set(0.85, 0.65, 2.2);
    canopy.position.set(0, 0.11, 0.45);
    g.add(canopy);
    const wing = new THREE.Mesh(buildRoundedBox(1.85, 0.04, 0.95, 0.015), mat);
    wing.position.set(0, -0.02, -0.18);
    g.add(wing);
    [-0.58, 0.58].forEach((nx) => {
      const nac = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.95, 16), secMat);
      nac.rotation.x = Math.PI / 2;
      nac.position.set(nx, 0.0, -0.2);
      g.add(nac);
      const burn = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.48, 12), createPbrMaterial("emissive_neon", "#38bdf8", tex, 1.5));
      burn.rotation.x = -Math.PI / 2;
      burn.position.set(nx, 0.0, -0.88);
      g.add(burn);
      const tail = new THREE.Mesh(buildRoundedBox(0.035, 0.36, 0.38, 0.01), mat);
      tail.position.set(nx, 0.24, -0.52);
      tail.rotation.z = nx < 0 ? -0.18 : 0.18;
      g.add(tail);
    });
    return g;
  }

  if (p === "car_sports") {
    const body = new THREE.Mesh(buildRoundedBox(1.45, 0.34, 0.72, 0.08), mat);
    body.position.y = 0.24;
    body.castShadow = true;
    g.add(body);
    const cabin = new THREE.Mesh(buildRoundedBox(0.75, 0.26, 0.62, 0.09), glassMat);
    cabin.position.set(-0.06, 0.48, 0);
    g.add(cabin);
    const spoiler = new THREE.Mesh(buildRoundedBox(0.16, 0.04, 0.74, 0.01), secMat);
    spoiler.position.set(-0.68, 0.48, 0);
    g.add(spoiler);
    const wheels = [];
    const wMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    [[-0.45, 0.37], [0.45, 0.37], [-0.45, -0.37], [0.45, -0.37]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.11, 18), wMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.16, wz);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 10), secMat);
      w.add(rim);
      g.add(w);
      wheels.push(w);
    });
    [-0.22, 0.22].forEach((lz) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.14), createPbrMaterial("emissive_neon", "#fef08a", tex, 1.5));
      hl.position.set(0.73, 0.26, lz);
      g.add(hl);
    });
    g.userData.spinFans = wheels;
    return g;
  }

  if (p === "drone_quad") {
    const core = new THREE.Mesh(buildRoundedBox(0.45, 0.14, 0.45, 0.05), mat);
    core.castShadow = true;
    g.add(core);
    const cam = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 12), neonMat);
    cam.position.set(0, -0.1, 0.16);
    g.add(cam);
    const rotors = [];
    [[-0.48, -0.48], [0.48, -0.48], [-0.48, 0.48], [0.48, 0.48]].forEach(([rx, rz]) => {
      const arm = buildCurvedTubeMesh([0, 0, 0], [rx, 0.04, rz], 0.025, actor.color, false);
      g.add(arm);
      const rotor = buildSpinBladeFan(0.24, 3, actor.secondaryColor || "#38bdf8");
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(rx, 0.09, rz);
      g.add(rotor);
      rotors.push(rotor);
    });
    g.userData.spinFans = rotors;
    return g;
  }

  if (p === "submarine" || p === "ship_vessel") {
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.1, 14, 20), mat);
    hull.rotation.z = Math.PI / 2;
    hull.castShadow = true;
    g.add(hull);
    const tower = new THREE.Mesh(buildRoundedBox(0.34, 0.36, 0.24, 0.05), secMat);
    tower.position.set(0.05, 0.38, 0);
    g.add(tower);
    const win = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), neonMat);
    win.position.set(0.66, 0.02, 0);
    g.add(win);
    const prop = buildSpinBladeFan(0.24, 4, "#fbbf24");
    prop.rotation.y = Math.PI / 2;
    prop.position.set(-0.88, 0, 0);
    g.add(prop);
    g.userData.spinFans = [prop];
    return g;
  }

  if (p === "robot_arm") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.18, 20), secMat);
    base.position.y = 0.09;
    g.add(base);
    const seg1 = new THREE.Mesh(buildRoundedBox(0.16, 0.65, 0.16, 0.04), mat);
    seg1.position.set(0, 0.46, 0);
    seg1.rotation.z = -0.22;
    g.add(seg1);
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), neonMat);
    joint.position.set(0.08, 0.78, 0);
    g.add(joint);
    const armUpper = new THREE.Group();
    armUpper.position.set(0.08, 0.78, 0);
    const seg2 = new THREE.Mesh(buildRoundedBox(0.62, 0.13, 0.13, 0.04), mat);
    seg2.position.set(0.3, 0.06, 0);
    armUpper.add(seg2);
    const claw = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16, Math.PI * 1.4), secMat);
    claw.position.set(0.66, 0.06, 0);
    armUpper.add(claw);
    g.add(armUpper);
    g.userData.articulateChild = armUpper;
    return g;
  }

  if (p === "fish_arowana" || p === "fish_betta" || p === "stingray" || p === "bird_eagle") {
    const isRay = p === "stingray";
    const isBird = p === "bird_eagle";
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16), mat);
    body.scale.set(isRay ? 1.5 : 1.75, isRay ? 0.25 : 0.62, isRay ? 1.65 : 0.48);
    body.castShadow = true;
    g.add(body);
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(isRay ? 0.06 : 0.24, isRay ? 0.95 : 0.52, 8),
      secMat
    );
    tail.rotation.z = Math.PI / 2;
    tail.position.x = isRay ? -0.78 : -0.62;
    g.add(tail);
    g.userData.tailChild = tail;
    if (isBird || isRay) {
      const lWing = new THREE.Mesh(buildRoundedBox(0.5, 0.04, 0.75, 0.02), mat);
      lWing.position.set(0, 0.05, 0.42);
      const rWing = lWing.clone();
      rWing.position.z = -0.42;
      g.add(lWing, rWing);
      g.userData.wings = [lWing, rWing];
    }
    [-0.14, 0.14].forEach((ez) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      eye.position.set(0.38, 0.06, ez);
      g.add(eye);
    });
    return g;
  }

  if (p === "glass_aquarium" || p === "filter_sump") {
    const w = 1.55, h = 0.92, d = 0.92;
    const frame = new THREE.Mesh(buildRoundedBox(w + 0.06, 0.08, d + 0.06, 0.02), secMat);
    frame.position.y = -h / 2;
    g.add(frame);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat);
    g.add(glass);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: 0xe0f2fe })));
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.08, h * 0.74, d - 0.08),
      createPbrMaterial("water_clear", actor.color || "#0ea5e9", tex, 0.15)
    );
    water.position.y = -h * 0.1;
    g.add(water);
    if (p === "filter_sump") {
      [-0.36, 0.36].forEach((bx) => {
        const baffle = new THREE.Mesh(new THREE.BoxGeometry(0.05, h * 0.78, d - 0.12), secMat);
        baffle.position.set(bx, -0.05, 0);
        g.add(baffle);
      });
      for (let i = 0; i < 8; i++) {
        const bio = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), neonMat);
        bio.position.set(0.52 + (i % 2) * 0.12, -0.25 + Math.floor(i / 2) * 0.14, (i % 3 - 1) * 0.2);
        g.add(bio);
      }
    }
    return g;
  }

  if (p === "copper_stator_motor" || p === "turbine_generator") {
    const outer = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.14, 16, 36), mat);
    outer.castShadow = true;
    g.add(outer);
    const copperMat = createPbrMaterial("gold_luxury", "#d97706", tex, 0.18);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 10), copperMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0);
      g.add(coil);
    }
    const rotor = buildSpinBladeFan(0.54, p === "turbine_generator" ? 8 : 3, actor.secondaryColor || "#38bdf8");
    rotor.position.z = 0.22;
    g.add(rotor);
    g.userData.spinFans = [rotor];
    return g;
  }

  if (p === "asic_miner" || p === "server_rack" || p === "ac_compressor") {
    const chassis = new THREE.Mesh(buildRoundedBox(1.05, 0.72, 0.62, 0.06), mat);
    chassis.castShadow = true;
    g.add(chassis);
    const fans = [];
    const offsets = p === "ac_compressor" ? [0] : [-0.26, 0.26];
    offsets.forEach((fx) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 10, 24), secMat);
      ring.position.set(fx, 0, 0.32);
      g.add(ring);
      const fan = buildSpinBladeFan(0.2, 5, actor.secondaryColor || "#38bdf8");
      fan.position.set(fx, 0, 0.33);
      g.add(fan);
      fans.push(fan);
    });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.04), neonMat);
    led.position.set(0, 0.28, 0.31);
    g.add(led);
    g.userData.spinFans = fans;
    return g;
  }

  if (p === "battery_reactor" || p === "crystal_core" || p === "chemistry_flask") {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 1.15, 24), glassMat);
    g.add(shell);
    const core = new THREE.Mesh(
      p === "crystal_core" ? new THREE.OctahedronGeometry(0.32, 0) : new THREE.CylinderGeometry(0.32, 0.32, 0.86, 20),
      createPbrMaterial("emissive_neon", actor.color || "#10b981", tex, 1.25)
    );
    g.add(core);
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 24), secMat);
    topCap.position.y = 0.62;
    const botCap = topCap.clone();
    botCap.position.y = -0.62;
    g.add(topCap, botCap);
    g.userData.pulseChild = core;
    return g;
  }

  if (p === "solar_array") {
    const panel = new THREE.Mesh(
      buildRoundedBox(1.55, 0.07, 0.96, 0.025),
      new THREE.MeshPhysicalMaterial({ map: tex.solar, metalness: 0.45, roughness: 0.15, clearcoat: 1.0 })
    );
    panel.rotation.x = 0.45;
    panel.castShadow = true;
    g.add(panel);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.56, 12), secMat);
    pole.position.y = -0.28;
    g.add(pole);
    return g;
  }

  if (p === "volcano_peak" || p === "mountain_peak") {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.15, 1.45, 16),
      p === "volcano_peak"
        ? new THREE.MeshStandardMaterial({ map: tex.lavaRock, roughness: 0.85 })
        : mat
    );
    cone.castShadow = true;
    g.add(cone);
    if (p === "volcano_peak") {
      const crater = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.2, 0.18, 16),
        createPbrMaterial("magma_glow", "#f97316", tex, 1.6)
      );
      crater.position.y = 0.66;
      g.add(crater);
    } else {
      const snowCap = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.52, 16), createPbrMaterial("ceramic", "#f8fafc", tex));
      snowCap.position.y = 0.47;
      g.add(snowCap);
    }
    return g;
  }

  if (p === "hollow_bowl" || p === "ice_cream_bowl") {
    const ls = actor.liquidState || {};
    const outerMat = createPbrMaterial(actor.materialType || "brushed_steel", actor.color || "#cbd5e1", tex, 0);
    outerMat.side = THREE.DoubleSide;
    // True thick-walled hollow concave mixing bowl profile (base Y = 0.0 -> rim Y = 0.44)
    const bowlGeo = buildHollowVesselGeo([
      [0.004, 0.0],
      [0.31, 0.0],
      [0.44, 0.08],
      [0.54, 0.24],
      [0.57, 0.41],
      [0.59, 0.44],
      [0.54, 0.44],
      [0.51, 0.39],
      [0.47, 0.23],
      [0.37, 0.09],
      [0.25, 0.055],
      [0.004, 0.055]
    ]);
    const bowlMesh = new THREE.Mesh(bowlGeo, outerMat);
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;
    g.add(bowlMesh);

    const fillLevel = ls.level ?? (p === "ice_cream_bowl" ? 0.65 : 0.55);
    if (fillLevel > 0.04) {
      const fillY = 0.08 + fillLevel * 0.28;
      const fillR = 0.33 + fillLevel * 0.18;
      const liqColor = ls.frozen ? "#bae6fd" : ls.color || actor.secondaryColor || "#fef3c7";
      const liqMat = createPbrMaterial(ls.frozen ? "ice_translucent" : "matte_clay", liqColor, tex, 0);
      const liqDisc = new THREE.Mesh(new THREE.CylinderGeometry(fillR, fillR * 0.78, Math.max(0.06, fillY - 0.06), 24), liqMat);
      liqDisc.position.y = 0.06 + (fillY - 0.06) * 0.5;
      g.add(liqDisc);

      if (ls.iceCubes || ls.frozen) {
        const iceMat = createPbrMaterial("ice_translucent", "#e0f2fe", tex, 0);
        const cubeCoords = [[-0.14, fillY + 0.03, 0.08], [0.16, fillY + 0.02, -0.06], [0.02, fillY + 0.04, -0.14]];
        cubeCoords.forEach(([ix, iy, iz], idx) => {
          const cube = new THREE.Mesh(buildRoundedBox(0.14, 0.12, 0.14, 0.025), iceMat);
          cube.position.set(ix, iy, iz);
          cube.rotation.set(0.2 * idx, 0.5 * idx, 0.15);
          g.add(cube);
        });
      }
      if (ls.scoops || (p === "ice_cream_bowl" && !ls.frozen)) {
        const scoopColors = [actor.secondaryColor || "#f472b6", "#fef3c7", "#86efac"];
        [[-0.16, fillY + 0.1, 0.06], [0.17, fillY + 0.09, 0.04], [0.0, fillY + 0.22, -0.06]].forEach(([sx, sy, sz], i) => {
          const sc = new THREE.Mesh(
            new THREE.SphereGeometry(0.19, 18, 16),
            createPbrMaterial("matte_clay", scoopColors[i % scoopColors.length], tex, 0)
          );
          sc.position.set(sx, sy, sz);
          sc.castShadow = true;
          g.add(sc);
        });
      }
    }
    return g;
  }

  if (p === "cooking_pot") {
    const ls = actor.liquidState || {};
    const potMat = createPbrMaterial(actor.materialType || "brushed_steel", actor.color || "#cbd5e1", tex, 0);
    potMat.side = THREE.DoubleSide;
    const potGeo = buildHollowVesselGeo([
      [0.004, 0.0],
      [0.44, 0.0],
      [0.48, 0.06],
      [0.48, 0.52],
      [0.52, 0.55],
      [0.45, 0.55],
      [0.43, 0.50],
      [0.43, 0.06],
      [0.004, 0.06]
    ]);
    const potMesh = new THREE.Mesh(potGeo, potMat);
    potMesh.castShadow = true;
    potMesh.receiveShadow = true;
    g.add(potMesh);

    const handleMat = createPbrMaterial("matte_clay", actor.secondaryColor || "#334155", tex, 0);
    [-0.52, 0.52].forEach((hx) => {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 16, Math.PI), handleMat);
      handle.position.set(hx, 0.42, 0);
      handle.rotation.z = hx < 0 ? Math.PI / 2 : -Math.PI / 2;
      g.add(handle);
    });

    const fillLevel = ls.level ?? 0.6;
    if (fillLevel > 0.05) {
      const h = 0.08 + fillLevel * 0.36;
      const broth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, h, 24),
        createPbrMaterial("water_clear", ls.color || "#f59e0b", tex, 0)
      );
      broth.position.y = 0.06 + h * 0.5;
      g.add(broth);
    }
    return g;
  }

  if (p === "glass_cup" || p === "coffee_espresso") {
    const ls = actor.liquidState || {};
    const isMug = p === "coffee_espresso";
    const cupMat = createPbrMaterial(isMug ? "ceramic" : "glass_crystal", actor.color || (isMug ? "#f8fafc" : "#e0f2fe"), tex, 0);
    cupMat.side = THREE.DoubleSide;
    const cupGeo = buildHollowVesselGeo([
      [0.004, 0.0],
      [0.24, 0.0],
      [0.29, 0.58],
      [0.30, 0.61],
      [0.26, 0.61],
      [0.25, 0.56],
      [0.21, 0.06],
      [0.004, 0.06]
    ]);
    const cupMesh = new THREE.Mesh(cupGeo, cupMat);
    cupMesh.castShadow = isMug;
    cupMesh.receiveShadow = true;
    g.add(cupMesh);

    if (isMug) {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.032, 10, 18, Math.PI), cupMat);
      handle.position.set(0.28, 0.33, 0);
      handle.rotation.z = -Math.PI / 2;
      g.add(handle);
    }

    const fillLevel = ls.level ?? 0.68;
    if (fillLevel > 0.04) {
      const h = fillLevel * 0.44;
      const liq = new THREE.Mesh(
        new THREE.CylinderGeometry(0.21 + fillLevel * 0.04, 0.2, h, 20),
        createPbrMaterial(isMug ? "matte_clay" : "water_clear", ls.color || (isMug ? "#78350f" : "#7dd3fc"), tex, 0)
      );
      liq.position.y = 0.065 + h * 0.5;
      g.add(liq);

      if (ls.iceCubes || ls.frozen) {
        const iceMat = createPbrMaterial("ice_translucent", "#f0f9ff", tex, 0);
        [[-0.07, 0.07 + h, 0.04], [0.08, 0.06 + h, -0.05], [-0.01, 0.09 + h, -0.04]].forEach(([ix, iy, iz], i) => {
          const ic = new THREE.Mesh(buildRoundedBox(0.11, 0.1, 0.11, 0.02), iceMat);
          ic.position.set(ix, iy, iz);
          ic.rotation.set(0.3 * i, 0.6 * i, 0.2);
          g.add(ic);
        });
      }
    }

    if (ls.condensation) {
      const dropMat = createPbrMaterial("glass_crystal", "#e0f2fe", tex, 0);
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + (i % 3) * 0.25;
        const dy = 0.12 + ((i * 19) % 40) * 0.01;
        const rad = 0.255 + (dy / 0.6) * 0.045;
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.016 + (i % 3) * 0.005, 8, 8), dropMat);
        drop.position.set(Math.cos(ang) * rad, dy, Math.sin(ang) * rad);
        g.add(drop);
      }
    }
    return g;
  }

  if (p === "jar_bottle" || p === "salt_shaker") {
    const isShaker = p === "salt_shaker";
    const bodyMat = createPbrMaterial(actor.materialType || "glass_crystal", actor.color || "#f8fafc", tex, 0);
    bodyMat.side = THREE.DoubleSide;
    const prof = isShaker
      ? [[0.004, 0.0], [0.15, 0.0], [0.16, 0.28], [0.11, 0.34], [0.11, 0.38]]
      : [[0.004, 0.0], [0.22, 0.0], [0.23, 0.42], [0.11, 0.56], [0.1, 0.72], [0.12, 0.75]];
    const bottle = new THREE.Mesh(buildHollowVesselGeo(prof, 24), bodyMat);
    bottle.castShadow = true;
    g.add(bottle);

    const innerFill = new THREE.Mesh(
      new THREE.CylinderGeometry(isShaker ? 0.13 : 0.19, isShaker ? 0.13 : 0.19, isShaker ? 0.2 : 0.34, 18),
      createPbrMaterial("matte_clay", isShaker ? "#f8fafc" : actor.secondaryColor || "#fef3c7", tex, 0)
    );
    innerFill.position.y = isShaker ? 0.12 : 0.19;
    g.add(innerFill);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(isShaker ? 0.115 : 0.11, isShaker ? 0.115 : 0.11, 0.09, 18),
      createPbrMaterial(isShaker ? "brushed_steel" : "wood_oak", actor.secondaryColor || "#94a3b8", tex, 0)
    );
    cap.position.y = isShaker ? 0.4 : 0.77;
    g.add(cap);
    return g;
  }

  if (p === "plate_dish") {
    const plateMat = createPbrMaterial("ceramic", actor.color || "#f8fafc", tex, 0);
    plateMat.side = THREE.DoubleSide;
    const plateGeo = buildHollowVesselGeo([
      [0.004, 0.0],
      [0.36, 0.0],
      [0.54, 0.07],
      [0.55, 0.095],
      [0.51, 0.095],
      [0.34, 0.035],
      [0.004, 0.035]
    ]);
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.castShadow = true;
    plate.receiveShadow = true;
    g.add(plate);
    return g;
  }

  if (p === "cutting_board") {
    const board = new THREE.Mesh(buildRoundedBox(1.15, 0.07, 0.78, 0.025), createPbrMaterial("wood_oak", actor.color || "#c08446", tex, 0));
    board.position.y = 0.035;
    board.castShadow = true;
    board.receiveShadow = true;
    g.add(board);
    const grip = new THREE.Mesh(buildRoundedBox(0.24, 0.06, 0.24, 0.02), createPbrMaterial("wood_oak", actor.color || "#c08446", tex, 0));
    grip.position.set(0.64, 0.035, 0);
    g.add(grip);
    return g;
  }

  if (p === "whisk_spoon") {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.56, 12), createPbrMaterial("wood_oak", actor.color || "#b45309", tex, 0));
    handle.position.y = 0.42;
    handle.castShadow = true;
    g.add(handle);
    const headMat = createPbrMaterial("brushed_steel", actor.secondaryColor || "#cbd5e1", tex, 0);
    for (let i = 0; i < 4; i++) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.011, 8, 16), headMat);
      loop.scale.set(0.75, 1.35, 0.75);
      loop.position.y = 0.11;
      loop.rotation.y = (i / 4) * Math.PI;
      g.add(loop);
    }
    return g;
  }

  if (p === "stove_burner") {
    const body = new THREE.Mesh(buildRoundedBox(1.25, 0.18, 1.15, 0.035), createPbrMaterial("brushed_steel", actor.color || "#334155", tex, 0));
    body.position.y = 0.09;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    const ringMat = createPbrMaterial("matte_clay", "#1e293b", tex, 0);
    const grate = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.028, 10, 24), ringMat);
    grate.rotation.x = Math.PI / 2;
    grate.position.y = 0.2;
    g.add(grate);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.04, 14), createPbrMaterial("metal_chrome", "#e2e8f0", tex, 0));
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0.42, 0.09, 0.58);
    g.add(knob);
    if (actor.scriptAction === "heat_below") {
      const flameRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.032, 10, 24),
        createPbrMaterial("emissive_neon", "#38bdf8", tex, 1.2)
      );
      flameRing.rotation.x = Math.PI / 2;
      flameRing.position.y = 0.195;
      g.add(flameRing);
      g.userData.pulseChild = flameRing;
    }
    return g;
  }

  if (p === "bucket_tub") {
    const ls = actor.liquidState || {};
    const tubMat = createPbrMaterial(actor.materialType || "glossy_plastic", actor.color || "#38bdf8", tex, 0);
    tubMat.side = THREE.DoubleSide;
    const tubGeo = buildHollowVesselGeo([
      [0.004, 0.0],
      [0.42, 0.0],
      [0.54, 0.52],
      [0.57, 0.55],
      [0.51, 0.55],
      [0.49, 0.49],
      [0.38, 0.06],
      [0.004, 0.06]
    ]);
    const tub = new THREE.Mesh(tubGeo, tubMat);
    tub.castShadow = true;
    tub.receiveShadow = true;
    g.add(tub);

    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.016, 8, 28, Math.PI), createPbrMaterial("brushed_steel", "#cbd5e1", tex, 0));
    handle.position.y = 0.52;
    handle.rotation.x = -0.35;
    g.add(handle);

    const fillLevel = ls.level ?? 0.5;
    if (fillLevel > 0.05) {
      const h = fillLevel * 0.36;
      const fill = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.38, h, 22),
        createPbrMaterial(ls.iceCubes ? "ice_translucent" : "water_clear", ls.color || "#bae6fd", tex, 0)
      );
      fill.position.y = 0.06 + h * 0.5;
      g.add(fill);
    }
    return g;
  }

  if (p === "wooden_table") {
    const woodMat = createPbrMaterial("wood_oak", actor.color || "#b87a42", tex, 0);
    const top = new THREE.Mesh(buildRoundedBox(1.8, 0.1, 1.1, 0.025), woodMat);
    top.position.y = 0.72;
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);
    [[-0.78, -0.44], [0.78, -0.44], [-0.78, 0.44], [0.78, 0.44]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(buildRoundedBox(0.09, 0.7, 0.09, 0.015), woodMat);
      leg.position.set(lx, 0.35, lz);
      leg.castShadow = true;
      g.add(leg);
    });
    return g;
  }

  if (p === "bookshelf_cabinet") {
    const woodMat = createPbrMaterial("wood_oak", actor.color || "#a66c38", tex, 0);
    const frame = new THREE.Mesh(buildRoundedBox(1.15, 1.35, 0.42, 0.03), woodMat);
    frame.position.y = 0.675;
    frame.castShadow = true;
    g.add(frame);
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#6366f1"];
    for (let i = 0; i < 5; i++) {
      const bk = new THREE.Mesh(buildRoundedBox(0.11, 0.32, 0.28, 0.015), createPbrMaterial("matte_clay", colors[i], tex, 0));
      bk.position.set(-0.32 + i * 0.16, 0.92, 0.09);
      g.add(bk);
    }
    return g;
  }

  if (p === "whiteboard_chart") {
    const frameMat = createPbrMaterial("brushed_steel", actor.secondaryColor || "#475569", tex, 0);
    const stand = new THREE.Mesh(buildRoundedBox(0.92, 0.06, 0.28, 0.015), frameMat);
    stand.position.y = 0.03;
    g.add(stand);
    const board = new THREE.Mesh(buildRoundedBox(1.05, 0.76, 0.06, 0.02), createPbrMaterial("ceramic", "#f8fafc", tex, 0));
    board.position.y = 0.46;
    board.castShadow = true;
    g.add(board);
    const barColors = ["#38bdf8", "#f59e0b", "#10b981"];
    [0.2, 0.36, 0.5].forEach((bh, idx) => {
      const bar = new THREE.Mesh(buildRoundedBox(0.16, bh, 0.03, 0.01), createPbrMaterial("matte_clay", barColors[idx], tex, 0));
      bar.position.set(-0.24 + idx * 0.24, 0.18 + bh * 0.5, 0.038);
      g.add(bar);
    });
    return g;
  }

  if (p === "potted_plant") {
    const potMat = createPbrMaterial("matte_clay", "#c26d4a", tex, 0);
    potMat.side = THREE.DoubleSide;
    const pot = new THREE.Mesh(
      buildHollowVesselGeo([[0.004, 0.0], [0.16, 0.0], [0.22, 0.28], [0.24, 0.32], [0.2, 0.32], [0.18, 0.25], [0.004, 0.25]], 20),
      potMat
    );
    pot.castShadow = true;
    g.add(pot);
    const leafMat = createPbrMaterial("matte_clay", "#22c55e", tex, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), leafMat);
      leaf.scale.set(0.65, 1.5, 0.45);
      leaf.position.set(Math.cos(a) * 0.1, 0.42 + (i % 2) * 0.08, Math.sin(a) * 0.1);
      leaf.rotation.set(Math.sin(a) * 0.45, a, -Math.cos(a) * 0.45);
      g.add(leaf);
    }
    return g;
  }

  if (p === "ice_cube_tray") {
    const tray = new THREE.Mesh(buildRoundedBox(0.74, 0.12, 0.42, 0.025), createPbrMaterial("glossy_plastic", actor.color || "#38bdf8", tex, 0));
    tray.position.y = 0.06;
    tray.castShadow = true;
    g.add(tray);
    const iceMat = createPbrMaterial("ice_translucent", "#e0f2fe", tex, 0);
    for (let c = -1; c <= 1; c++) {
      for (let r = -0.5; r <= 0.5; r += 1) {
        const ic = new THREE.Mesh(buildRoundedBox(0.16, 0.11, 0.14, 0.02), iceMat);
        ic.position.set(c * 0.21, 0.12, r * 0.18);
        g.add(ic);
      }
    }
    return g;
  }

  if (p === "thermal_plates") {
    const tiles = [];
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        const tileM = new THREE.Mesh(buildRoundedBox(0.44, 0.09, 0.34, 0.02), mat);
        tileM.position.set(c * 0.52, 0, r * 0.42);
        tileM.castShadow = true;
        g.add(tileM);
        tiles.push({ mesh: tileM, c, r });
      }
    }
    g.userData.thermalTiles = tiles;
    return g;
  }

  if (p === "hologram_ring" || p === "neon_tube") {
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.028, 12, 48), neonMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.018, 10, 40), createPbrMaterial("emissive_neon", actor.color || "#38bdf8", tex, 1.3));
    ring2.rotation.x = Math.PI / 3;
    g.add(ring1, ring2);
    g.userData.spinFans = [ring2];
    return g;
  }

  if (p === "tree_lush" || p === "palm_tree") {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.15, 10), createPbrMaterial("wood_oak", "#78350f", tex));
    trunk.position.y = 0.55;
    trunk.castShadow = true;
    g.add(trunk);
    const leafMat = createPbrMaterial("matte_clay", "#22c55e", tex);
    for (let i = 0; i < 5; i++) {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), leafMat);
      const a = (i / 5) * Math.PI * 2;
      crown.position.set(Math.cos(a) * 0.24, 1.15 + (i % 2) * 0.18, Math.sin(a) * 0.24);
      g.add(crown);
    }
    return g;
  }

  if (p === "crystal_cluster") {
    for (let i = 0; i < 6; i++) {
      const h = 0.45 + (i % 3) * 0.34;
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.13, h, 6), mat);
      const a = (i / 6) * Math.PI * 2;
      cr.position.set(Math.cos(a) * 0.22, h / 2, Math.sin(a) * 0.22);
      cr.rotation.set(Math.sin(a) * 0.28, a, -Math.cos(a) * 0.28);
      g.add(cr);
    }
    return g;
  }

  if (p === "water_surface" || p === "magma_pool") {
    const geo = new THREE.PlaneGeometry(2.6, 2.2, 24, 24);
    geo.rotateX(-Math.PI / 2);
    const shaderMat =
      typeof THREE.ShaderMaterial === "function"
        ? new THREE.ShaderMaterial({
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color(p === "magma_pool" ? "#f97316" : actor.color || "#0ea5e9") }
            },
            vertexShader: WATER_VERTEX_SHADER,
            fragmentShader: WATER_FRAGMENT_SHADER,
            transparent: true
          })
        : mat;
    const waterMesh = new THREE.Mesh(geo, shaderMat);
    g.add(waterMesh);
    g.userData.waterShaderMat = shaderMat;
    return g;
  }

  if (p === "gear_wheel") {
    const hub = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 12, 24), mat);
    g.add(hub);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const tooth = new THREE.Mesh(buildRoundedBox(0.11, 0.15, 0.12, 0.02), secMat);
      tooth.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0);
      tooth.rotation.z = a;
      g.add(tooth);
    }
    return g;
  }

  if (p === "propeller_fan") {
    const fan = buildSpinBladeFan(0.56, 4, actor.color || "#38bdf8");
    g.add(fan);
    g.userData.spinFans = [fan];
    return g;
  }

  if (p === "helix_coil") {
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const a = t * Math.PI * 2 * 5;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.34, (t - 0.5) * 0.85, Math.sin(a) * 0.34));
    }
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 52, 0.045, 10, false), mat);
    g.add(mesh);
    return g;
  }

  if (p === "energy_sphere") {
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 20), neonMat);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.02, 10, 32), secMat);
    g.add(sp, halo);
    g.userData.pulseChild = sp;
    g.userData.spinFans = [halo];
    return g;
  }

  if (p === "metallic_cylinder" || p === "boiler_furnace" || p === "microscope_lab") {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.92, 24), mat);
    cyl.castShadow = true;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.038, 10, 24), secMat);
    band.rotation.x = Math.PI / 2;
    const glowWin = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), neonMat);
    glowWin.position.set(0, 0.05, 0.34);
    g.add(cyl, band, glowWin);
    return g;
  }

  if (p === "rebar_structure") {
    const base = new THREE.Mesh(buildRoundedBox(1.3, 0.14, 0.95, 0.02), createPbrMaterial("wood_oak", "#b45309", tex));
    g.add(base);
    for (let x = -0.5; x <= 0.5; x += 0.25) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8), secMat);
      bar.position.set(x, 0.38, 0);
      g.add(bar);
    }
    return g;
  }

  // Default beveled high-craft PBR chassis with accent rim
  const box = new THREE.Mesh(buildRoundedBox(0.95, 0.72, 0.72, 0.08), mat);
  box.castShadow = true;
  const trim = new THREE.Mesh(buildRoundedBox(0.99, 0.08, 0.76, 0.02), secMat);
  trim.position.y = 0.26;
  g.add(box, trim);
  return g;
}

// ============================================================================
// 4. MAIN GEMINI CINEMA ENGINE CLASS
// ============================================================================
const MOOD_PRESETS = {
  // Clean Natural Pixar / Blender-Cycles Daylight Studio Presets (DEFAULT!)
  soft_daylight: { top: 0xbae6fd, hor: 0xf8fafc, bot: 0xe2e8f0, sun: 0xfffdf7, sunPos: [3.6, 6.8, 4.4], sunInt: 1.95, hemiInt: 1.32, rim: 0xe0f2fe, rimInt: 0.45, fog: 0xf1f5f9, fogDensity: 0.004, stars: 0.0 },
  warm_kitchen: { top: 0x93c5fd, hor: 0xfff7ed, bot: 0xfde68a, sun: 0xfffbeb, sunPos: [4.2, 6.0, 3.8], sunInt: 2.0, hemiInt: 1.35, rim: 0xfef3c7, rimInt: 0.48, fog: 0xfff7ed, fogDensity: 0.004, stars: 0.0 },
  clean_workshop: { top: 0xbae6fd, hor: 0xf5f0e6, bot: 0xd6c7b2, sun: 0xffffff, sunPos: [3.8, 6.8, 4.2], sunInt: 1.95, hemiInt: 1.3, rim: 0xe2e8f0, rimInt: 0.45, fog: 0xf5f0e6, fogDensity: 0.004, stars: 0.0 },
  outdoor_sunlight: { top: 0x38bdf8, hor: 0xe0f2fe, bot: 0xbae6fd, sun: 0xfffbeb, sunPos: [4.5, 7.5, 4.0], sunInt: 2.15, hemiInt: 1.25, rim: 0xfef08a, rimInt: 0.45, fog: 0xe0f2fe, fogDensity: 0.009, stars: 0.0 },
  cozy_indoor: { top: 0xfde68a, hor: 0xfef3c7, bot: 0xd6c7b2, sun: 0xfff7ed, sunPos: [3.4, 5.8, 3.8], sunInt: 1.88, hemiInt: 1.3, rim: 0xfdba74, rimInt: 0.45, fog: 0xfef3c7, fogDensity: 0.004, stars: 0.0 },
  cool_lab: { top: 0xe0f2fe, hor: 0xf8fafc, bot: 0xcbd5e1, sun: 0xffffff, sunPos: [3.5, 7.2, 4.5], sunInt: 1.95, hemiInt: 1.38, rim: 0xbae6fd, rimInt: 0.45, fog: 0xf1f5f9, fogDensity: 0.004, stars: 0.0 },
  night_dim: { top: 0x0f172a, hor: 0x1e293b, bot: 0x090d16, sun: 0xbae6fd, sunPos: [-3.0, 6.2, 3.2], sunInt: 1.45, hemiInt: 0.78, rim: 0x93c5fd, rimInt: 0.65, fog: 0x0f172a, fogDensity: 0.012, stars: 0.85 },
  warm_alert: { top: 0x7c2d12, hor: 0xfdba74, bot: 0x451a03, sun: 0xfed7aa, sunPos: [3.5, 5.5, 3.8], sunInt: 2.05, hemiInt: 1.05, rim: 0xfb923c, rimInt: 0.72, fog: 0x7c2d12, fogDensity: 0.009, stars: 0.0 },
  cyber_dark: { top: 0x090d1e, hor: 0x1e1b4b, bot: 0x020617, sun: 0x38bdf8, sunPos: [-3.5, 5.0, 3.5], sunInt: 1.75, hemiInt: 0.78, rim: 0xf43f5e, rimInt: 1.2, fog: 0x0f172a, fogDensity: 0.014, stars: 0.8 },
  // Legacy preset keys (backward-compatible)
  pixar_golden: { top: 0x60a5fa, hor: 0xffedd5, bot: 0xfed7aa, sun: 0xfffbeb, sunPos: [4.2, 6.2, 3.8], sunInt: 2.0, hemiInt: 1.28, rim: 0xfef3c7, rimInt: 0.5, fog: 0xffedd5, fogDensity: 0.006, stars: 0.0 },
  unreal_studio: { top: 0x93c5fd, hor: 0xf1f5f9, bot: 0xcbd5e1, sun: 0xffffff, sunPos: [3.8, 7.2, 4.2], sunInt: 1.95, hemiInt: 1.32, rim: 0xe0f2fe, rimInt: 0.45, fog: 0xf1f5f9, fogDensity: 0.005, stars: 0.0 },
  cyber_neon: { top: 0x090d1e, hor: 0x1e1b4b, bot: 0x020617, sun: 0x38bdf8, sunPos: [-3.5, 5.0, 3.5], sunInt: 1.75, hemiInt: 0.75, rim: 0xf43f5e, rimInt: 1.2, fog: 0x0f172a, fogDensity: 0.015, stars: 0.85 },
  inferno_alert: { top: 0x7c2d12, hor: 0xfb923c, bot: 0x451a03, sun: 0xfed7aa, sunPos: [3.5, 4.8, 3.5], sunInt: 2.1, hemiInt: 0.95, rim: 0xf97316, rimInt: 0.85, fog: 0x451a03, fogDensity: 0.012, stars: 0.0 },
  deep_ocean: { top: 0x0369a1, hor: 0x38bdf8, bot: 0x082f49, sun: 0xbae6fd, sunPos: [1.5, 8.0, 2.0], sunInt: 1.9, hemiInt: 1.15, rim: 0x7dd3fc, rimInt: 0.65, fog: 0x0c4a6e, fogDensity: 0.014, stars: 0.0 },
  arctic_ice: { top: 0x38bdf8, hor: 0xf0f9ff, bot: 0xbae6fd, sun: 0xffffff, sunPos: [4.2, 6.2, 3.8], sunInt: 2.0, hemiInt: 1.32, rim: 0xbae6fd, rimInt: 0.55, fog: 0xe0f2fe, fogDensity: 0.007, stars: 0.0 },
  emerald_victory: { top: 0x60a5fa, hor: 0xecfdf5, bot: 0xa7f3d0, sun: 0xfffbeb, sunPos: [3.5, 6.5, 3.5], sunInt: 2.05, hemiInt: 1.3, rim: 0xfef08a, rimInt: 0.55, fog: 0xecfdf5, fogDensity: 0.005, stars: 0.0 },
  volcanic_forge: { top: 0x292524, hor: 0xc2410c, bot: 0x1c1917, sun: 0xf97316, sunPos: [2.0, 4.5, 3.2], sunInt: 2.2, hemiInt: 0.85, rim: 0xfacc15, rimInt: 1.1, fog: 0x29150e, fogDensity: 0.015, stars: 0.1 },
  moonlit_mystery: { top: 0x0f172a, hor: 0x1e293b, bot: 0x090a0f, sun: 0xbae6fd, sunPos: [-3.0, 6.5, 2.5], sunInt: 1.45, hemiInt: 0.72, rim: 0x93c5fd, rimInt: 0.85, fog: 0x0f172a, fogDensity: 0.014, stars: 0.9 }
};

export class MaouGeminiCinema {
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
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.14;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 120);
    this.camera.position.set(0.4, 1.35, 3.6);
    this.lookAtVec = new THREE.Vector3(0, 0.55, 0);

    // Procedural Studio HDRI Environment Map for Real Metal/Glass Reflections
    this.envMap = this.createStudioEnvMap();
    if (this.envMap) this.scene.environment = this.envMap;

    // 3-Point Cinema Lighting (Key Sun + Cool/Warm Rim + Sky Hemisphere)
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.1);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfffbeb, 2.1);
    this.keyLight.position.set(4.0, 6.5, 3.8);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 22;
    this.keyLight.shadow.camera.left = -4.2;
    this.keyLight.shadow.camera.right = 4.2;
    this.keyLight.shadow.camera.top = 4.2;
    this.keyLight.shadow.camera.bottom = -4.2;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    this.rimLight.position.set(-4.2, 3.8, -3.5);
    this.scene.add(this.rimLight);

    this.tex = createCinemaTextures();

    // Animated Sky Dome
    this.skyMat =
      typeof THREE.ShaderMaterial === "function"
        ? new THREE.ShaderMaterial({
            uniforms: {
              uTopColor: { value: new THREE.Color(0x3b82f6) },
              uHorizonColor: { value: new THREE.Color(0xfdba74) },
              uBottomColor: { value: new THREE.Color(0x1e293b) },
              uSunColor: { value: new THREE.Color(0xfef08a) },
              uSunDir: { value: new THREE.Vector3(0.4, 0.55, -0.7) },
              uTime: { value: 0 },
              uStars: { value: 0 }
            },
            vertexShader: SKY_VERTEX_SHADER,
            fragmentShader: SKY_FRAGMENT_SHADER,
            side: THREE.BackSide,
            depthWrite: false
          })
        : new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.BackSide });
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(52, 24, 16), this.skyMat);
    this.scene.add(this.skyDome);

    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);

    // Multi-Pass Kling Cinema Post-Processing Pipeline (HDR Bloom + DepthTexture Bokeh DOF + Motion Blur + Transitions)
    this.postPipeline = new PostCinemaPipeline(this.renderer, width, height);
    this.prevCamPos = new THREE.Vector3(0.4, 1.35, 3.6);

    this.activeSceneKey = "";
    this.actors = [];
    this.vfxNodes = [];
    this.waterMats = [];
    this.keyframeCache = new Map();
    this.activeKeyframeTex = null;
    this.transStartSec = -10;
    this.transType = 0;
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
    this.postPipeline?.resize(width, height);
  }

  createStudioEnvMap() {
    if (typeof THREE.PMREMGenerator !== "function") return null;
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envScene = new THREE.Scene();
      // Bright neutral daylight studio HDRI (clean natural metal/ceramic/glass reflections!)
      envScene.background = new THREE.Color(0xeef2f6);
      const skylight = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      skylight.position.set(0, 8, 0);
      skylight.rotation.x = Math.PI / 2;
      envScene.add(skylight);
      const windowPanel = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), new THREE.MeshBasicMaterial({ color: 0xfffbeb, side: THREE.DoubleSide }));
      windowPanel.position.set(-8, 3, 2);
      windowPanel.rotation.y = Math.PI / 2;
      envScene.add(windowPanel);
      const fillPanel = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide }));
      fillPanel.position.set(8, 3, 2);
      fillPanel.rotation.y = -Math.PI / 2;
      envScene.add(fillPanel);
      const floorBounce = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ color: 0xd6c7b2, side: THREE.DoubleSide }));
      floorBounce.position.set(0, -6, 0);
      floorBounce.rotation.x = -Math.PI / 2;
      envScene.add(floorBounce);
      const rt = pmrem.fromScene(envScene, 0.04);
      pmrem.dispose();
      return rt.texture;
    } catch {
      return null;
    }
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
    this.actors = [];
    this.vfxNodes = [];
    this.waterMats = [];
  }

  applyLightingMood(moodKey) {
    const m = MOOD_PRESETS[moodKey] || MOOD_PRESETS.soft_daylight;
    this.scene.fog = new THREE.FogExp2(m.fog, m.fogDensity ?? 0.005);
    this.hemiLight.intensity = m.hemiInt;
    this.keyLight.color.setHex(m.sun);
    this.keyLight.intensity = m.sunInt;
    this.keyLight.position.set(m.sunPos[0], m.sunPos[1], m.sunPos[2]);
    this.rimLight.color.setHex(m.rim);
    this.rimLight.intensity = m.rimInt;
    if (this.skyMat?.uniforms) {
      this.skyMat.uniforms.uTopColor.value.setHex(m.top);
      this.skyMat.uniforms.uHorizonColor.value.setHex(m.hor);
      this.skyMat.uniforms.uBottomColor.value.setHex(m.bot);
      this.skyMat.uniforms.uSunColor.value.setHex(m.sun);
      this.skyMat.uniforms.uStars.value = m.stars;
    }
  }

  buildArchitecturalWallsAndShelf(g, walls = {}) {
    if (!walls.enabled) return;

    const wallTexMap = {
      ceramic_tile: this.tex.subwayTile,
      warm_plaster: this.tex.plaster,
      red_brick: this.tex.brick,
      wood_panel: this.tex.wood,
      pegboard: this.tex.pegboard,
      concrete: this.tex.concrete,
      lab_panel: this.tex.plaster
    };
    const wallMap = wallTexMap[walls.backWallMaterial] || this.tex.plaster;
    const wallCol = new THREE.Color(walls.backWallColor || "#f4ede2");
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallCol,
      map: wallMap,
      roughness: walls.backWallMaterial === "ceramic_tile" ? 0.28 : 0.72,
      metalness: 0.02
    });

    // Back architectural wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10.5, 5.8, 0.24), wallMat);
    backWall.position.set(0, 1.35, -2.18);
    backWall.receiveShadow = true;
    g.add(backWall);

    // Optional left corner wall to enclose the room cleanly like a Pixar miniature diorama!
    if (walls.sideWallEnabled) {
      const sideMat = new THREE.MeshStandardMaterial({
        color: wallCol.clone().multiplyScalar(0.95),
        map: this.tex.plaster,
        roughness: 0.74
      });
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5.8, 7.6), sideMat);
      sideWall.position.set(-3.15, 1.35, 1.2);
      sideWall.receiveShadow = true;
      g.add(sideWall);
    }

    // Crisp wooden baseboard & tabletop backsplash trim
    if (walls.hasBaseboard) {
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xe7ddd0, roughness: 0.55 });
      const backTrim = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.14, 0.08), trimMat);
      backTrim.position.set(0, 0.06, -2.03);
      g.add(backTrim);
      const floorBase = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.22, 0.1), trimMat);
      floorBase.position.set(0, -1.54, -2.02);
      g.add(floorBase);
    }

    // Framed sunlit daylight window on back-left wall
    if (walls.hasWindow) {
      const winGroup = new THREE.Group();
      winGroup.position.set(-1.55, 1.75, -2.02);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
      const glassPane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.36, 1.36),
        new THREE.MeshBasicMaterial({ color: 0xdbeafe })
      );
      winGroup.add(glassPane);
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.1, 0.1), frameMat);
      topBar.position.y = 0.7;
      const botSill = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.11, 0.18), frameMat);
      botSill.position.set(0, -0.7, 0.04);
      const leftBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.48, 0.1), frameMat);
      leftBar.position.x = -0.72;
      const rightBar = leftBar.clone();
      rightBar.position.x = 0.72;
      const midV = new THREE.Mesh(new THREE.BoxGeometry(0.055, 1.38, 0.07), frameMat);
      const midH = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.055, 0.07), frameMat);
      winGroup.add(topBar, botSill, leftBar, rightBar, midV, midH);
      g.add(winGroup);
    }

    // Floating wooden wall shelf on back-right with calm, grounded everyday props!
    if (walls.hasShelf) {
      const shelfWood = createPbrMaterial("wood_oak", "#b87a42", this.tex, 0);
      const shelfBoard = new THREE.Mesh(buildRoundedBox(1.85, 0.075, 0.36, 0.015), shelfWood);
      shelfBoard.position.set(1.18, 1.48, -1.88);
      shelfBoard.castShadow = true;
      shelfBoard.receiveShadow = true;
      g.add(shelfBoard);

      const items = Array.isArray(walls.shelfItems) && walls.shelfItems.length ? walls.shelfItems : ["jar", "plant", "mug"];
      items.slice(0, 3).forEach((item, i) => {
        const sx = 0.62 + i * 0.56;
        const sy = 1.52;
        const sz = -1.86;
        if (item === "plant") {
          const pl = buildCinemaActorPrefab({ prefab: "potted_plant", color: "#c26d4a" }, this.tex);
          pl.position.set(sx, sy, sz);
          pl.scale.setScalar(0.55);
          g.add(pl);
        } else if (item === "books") {
          const bCols = ["#3b82f6", "#f59e0b", "#10b981"];
          bCols.forEach((bc, bi) => {
            const bk = new THREE.Mesh(buildRoundedBox(0.08, 0.28 + bi * 0.03, 0.2, 0.01), createPbrMaterial("matte_clay", bc, this.tex, 0));
            bk.position.set(sx - 0.09 + bi * 0.09, sy + 0.14 + bi * 0.015, sz);
            g.add(bk);
          });
        } else if (item === "mug") {
          const mug = buildCinemaActorPrefab({ prefab: "coffee_espresso", color: "#fef3c7", liquidState: { level: 0 } }, this.tex);
          mug.position.set(sx, sy, sz);
          mug.scale.setScalar(0.45);
          g.add(mug);
        } else {
          const jar = buildCinemaActorPrefab({ prefab: "jar_bottle", color: "#f8fafc", secondaryColor: i === 0 ? "#f59e0b" : "#0ea5e9" }, this.tex);
          jar.position.set(sx, sy, sz);
          jar.scale.setScalar(0.44);
          g.add(jar);
        }
      });
    }
  }

  buildWorldFoundation(wf, legacyEnv) {
    if (!wf || typeof wf !== "object") {
      this.buildEnvironment(legacyEnv || "studio_bench");
      return;
    }

    const g = this.stageGroup;
    const room = wf.roomType || "oak_workshop";
    const surf = wf.surface || {};
    const walls = wf.walls || {};

    // Outdoor / special world environments
    if (room === "space_orbit") {
      this.buildEnvironment("space_orbit");
      return;
    }
    if (room === "underwater_bed") {
      this.buildEnvironment("deep_underwater");
      return;
    }
    if (room === "volcanic_outdoor") {
      this.buildEnvironment("volcanic_terrain");
      return;
    }
    if (room === "arctic_outdoor") {
      this.buildEnvironment("arctic_glacier");
      return;
    }
    if (room === "runway_outdoor" || room === "street_exterior") {
      this.buildEnvironment(room === "runway_outdoor" ? "runway_tarmac" : "city_street");
      return;
    }
    if (room === "farm_field" || room === "backyard_yard") {
      const lawn = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.5, 10),
        new THREE.MeshStandardMaterial({ map: this.tex.grass, roughness: 0.82 })
      );
      lawn.position.set(0, -0.25, 0);
      lawn.receiveShadow = true;
      g.add(lawn);
      if (walls.enabled) this.buildArchitecturalWallsAndShelf(g, { ...walls, hasWindow: false, hasShelf: false });
      return;
    }

    // Real room floor underneath table/counter (visible around table legs!)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe5ddd0,
      map: this.tex.tile,
      roughness: 0.62
    });
    const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.25, 9), floorMat);
    roomFloor.position.set(0, -1.78, 0.2);
    roomFloor.receiveShadow = true;
    g.add(roomFloor);

    const w = surf.width || 5.4;
    const d = surf.depth || 3.1;

    if (room === "kitchen_counter" || surf.type === "kitchen_counter") {
      // Genuine Kitchen Countertop (top flush at Y = 0.0!) + lower cabinets with handles!
      const counterTop = new THREE.Mesh(
        buildRoundedBox(w, 0.14, d, 0.025),
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(surf.materialColor || "#ebe4d8"),
          map: this.tex.marbleCounter,
          roughness: 0.26,
          clearcoat: 0.35
        })
      );
      counterTop.position.set(0, -0.07, -0.35);
      counterTop.receiveShadow = true;
      g.add(counterTop);

      const cabMat = new THREE.MeshStandardMaterial({ color: 0xd8c3a5, roughness: 0.52 });
      const cabBody = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 1.52, d - 0.16), cabMat);
      cabBody.position.set(0, -0.9, -0.4);
      cabBody.receiveShadow = true;
      g.add(cabBody);

      const handleMat = createPbrMaterial("brushed_steel", "#64748b", this.tex, 0);
      const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0xc9b08e, roughness: 0.58 });
      [-1.5, 0, 1.5].forEach((dx) => {
        const door = new THREE.Mesh(buildRoundedBox(1.32, 1.24, 0.04, 0.012), doorFrameMat);
        door.position.set(dx, -0.84, d * 0.5 - 0.47);
        g.add(door);
        const handle = new THREE.Mesh(buildRoundedBox(0.28, 0.032, 0.045, 0.01), handleMat);
        handle.position.set(dx, -0.36, d * 0.5 - 0.43);
        g.add(handle);
      });
    } else if (room === "science_lab" || surf.type === "lab_bench") {
      // Clean bright science lab bench (top flush at Y = 0.0!) + steel legs
      const benchTop = new THREE.Mesh(
        buildRoundedBox(w, 0.12, d, 0.022),
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(surf.materialColor || "#f1f5f9"),
          roughness: 0.24,
          clearcoat: 0.3
        })
      );
      benchTop.position.set(0, -0.06, -0.3);
      benchTop.receiveShadow = true;
      g.add(benchTop);

      const steelMat = createPbrMaterial("brushed_steel", "#94a3b8", this.tex, 0);
      const apron = new THREE.Mesh(new THREE.BoxGeometry(w - 0.25, 0.16, d - 0.25), steelMat);
      apron.position.set(0, -0.18, -0.3);
      g.add(apron);
      [[-w * 0.43, -d * 0.4 - 0.3], [w * 0.43, -d * 0.4 - 0.3], [-w * 0.43, d * 0.4 - 0.3], [w * 0.43, d * 0.4 - 0.3]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(buildRoundedBox(0.11, 1.55, 0.11, 0.015), steelMat);
        leg.position.set(lx, -0.88, lz);
        g.add(leg);
      });
    } else if (room === "house_cross_section" || surf.type === "concrete_floor") {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(w + 1.2, 0.22, d + 0.8),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(surf.materialColor || "#cbd5e1"),
          map: this.tex.concrete,
          roughness: 0.65
        })
      );
      slab.position.set(0, -0.11, -0.2);
      slab.receiveShadow = true;
      g.add(slab);
    } else {
      // Genuine Beveled Wooden Table (top flush at Y = 0.0!) + Under-Apron + 4 Solid Oak Legs!
      const woodMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(surf.materialColor || "#c2864b"),
        map: this.tex.wood,
        roughness: 0.38,
        clearcoat: 0.22
      });
      const tableTop = new THREE.Mesh(buildRoundedBox(w, 0.14, d, 0.03), woodMat);
      tableTop.position.set(0, -0.07, -0.28);
      tableTop.receiveShadow = true;
      g.add(tableTop);

      const apronMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(surf.materialColor || "#a66c38").multiplyScalar(0.86),
        map: this.tex.wood,
        roughness: 0.5
      });
      const apron = new THREE.Mesh(new THREE.BoxGeometry(w - 0.36, 0.2, d - 0.36), apronMat);
      apron.position.set(0, -0.22, -0.28);
      g.add(apron);

      [[-w * 0.42, -d * 0.38 - 0.28], [w * 0.42, -d * 0.38 - 0.28], [-w * 0.42, d * 0.38 - 0.28], [w * 0.42, d * 0.38 - 0.28]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(buildRoundedBox(0.14, 1.56, 0.14, 0.02), apronMat);
        leg.position.set(lx, -0.88, lz);
        leg.castShadow = true;
        g.add(leg);
      });
    }

    this.buildArchitecturalWallsAndShelf(g, walls);
  }

  buildEnvironment(envType) {
    const g = this.stageGroup;
    if (envType === "space_orbit") {
      // Orbiting curved planet horizon beneath!
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(9.5, 32, 24),
        new THREE.MeshPhysicalMaterial({ color: 0x1d4ed8, roughness: 0.5, clearcoat: 0.4 })
      );
      planet.position.set(0, -10.3, -2.5);
      g.add(planet);
      return;
    }

    if (envType === "sci_fi_lab" || envType === "factory_floor") {
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(11, 0.4, 9),
        new THREE.MeshPhysicalMaterial({
          map: this.tex.cyberGrid,
          roughness: 0.22,
          metalness: 0.45,
          clearcoat: 0.8
        })
      );
      floor.position.set(0, -0.2, 0);
      floor.receiveShadow = true;
      g.add(floor);
      // Glowing architectural arches behind stage
      const archMat = createPbrMaterial("emissive_neon", "#38bdf8", this.tex, 1.1);
      for (let z = -2.4; z >= -6.4; z -= 2.0) {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.045, 10, 32, Math.PI), archMat);
        arch.position.set(0, 0, z);
        g.add(arch);
      }
      return;
    }

    if (envType === "deep_underwater") {
      const sand = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.5, 10),
        new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.85 })
      );
      sand.position.set(0, -0.25, 0);
      sand.receiveShadow = true;
      g.add(sand);
      // Animated overhead water surface shimmering above!
      const ceilWater = buildCinemaActorPrefab({ prefab: "water_surface", color: "#38bdf8" }, this.tex);
      ceilWater.position.set(0, 3.4, -0.5);
      ceilWater.scale.set(4.5, 1, 4.5);
      g.add(ceilWater);
      if (ceilWater.userData.waterShaderMat) this.waterMats.push(ceilWater.userData.waterShaderMat);
      return;
    }

    if (envType === "volcanic_terrain") {
      const ground = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.5, 10),
        new THREE.MeshStandardMaterial({ map: this.tex.lavaRock, roughness: 0.85 })
      );
      ground.position.set(0, -0.25, 0);
      ground.receiveShadow = true;
      g.add(ground);
      return;
    }

    if (envType === "arctic_glacier") {
      const ice = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.5, 10),
        new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, roughness: 0.14, clearcoat: 1.0, metalness: 0.05 })
      );
      ice.position.set(0, -0.25, 0);
      ice.receiveShadow = true;
      g.add(ice);
      return;
    }

    if (envType === "runway_tarmac" || envType === "city_street") {
      const road = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.4, 9),
        new THREE.MeshStandardMaterial({ map: this.tex.asphalt, roughness: 0.65 })
      );
      road.position.set(0, -0.2, 0);
      road.receiveShadow = true;
      g.add(road);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      for (let x = -4.5; x <= 4.5; x += 1.4) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.12), stripeMat);
        dash.position.set(x, 0.01, 0.3);
        g.add(dash);
      }
      return;
    }

    if (envType === "kitchen_cinema") {
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.5, 6),
        new THREE.MeshPhysicalMaterial({ map: this.tex.wood, roughness: 0.32, clearcoat: 0.4 })
      );
      counter.position.set(0, -0.25, 0);
      counter.receiveShadow = true;
      g.add(counter);
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(11, 5.5, 0.25),
        new THREE.MeshStandardMaterial({ map: this.tex.tile, roughness: 0.4 })
      );
      wall.position.set(0, 2.2, -2.6);
      wall.receiveShadow = true;
      g.add(wall);
      return;
    }

    if (envType === "backyard_pond" || envType === "sawah_valley") {
      const lawn = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.5, 10),
        new THREE.MeshStandardMaterial({ map: this.tex.grass, roughness: 0.8 })
      );
      lawn.position.set(0, -0.25, 0);
      lawn.receiveShadow = true;
      g.add(lawn);
      if (envType === "backyard_pond") {
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(10, 3.6, 0.3),
          new THREE.MeshStandardMaterial({ map: this.tex.brick, roughness: 0.78 })
        );
        wall.position.set(0, 1.7, -3.2);
        g.add(wall);
      }
      return;
    }

    if (envType === "house_cutaway") {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 0.16, 4.2),
        new THREE.MeshStandardMaterial({ map: this.tex.wood, roughness: 0.45 })
      );
      slab.position.set(0, -0.08, -0.2);
      slab.receiveShadow = true;
      g.add(slab);
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 3.4, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65 })
      );
      back.position.set(0, 1.6, -2.2);
      back.receiveShadow = true;
      g.add(back);
      return;
    }

    // Default: Studio Workbench with Glossy Oak Countertop
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.5, 6.2),
      new THREE.MeshPhysicalMaterial({ map: this.tex.wood, roughness: 0.3, clearcoat: 0.45 })
    );
    bench.position.set(0, -0.25, 0);
    bench.receiveShadow = true;
    g.add(bench);
  }

  buildVfxSystem(vfx) {
    const g = new THREE.Group();
    const o = vfx.origin || [0, 0.7, 0];
    const col = new THREE.Color(vfx.color || "#fbbf24");
    const items = [];

    if (vfx.type === "god_rays") {
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.12 * (vfx.intensity || 0.8),
        side: THREE.DoubleSide,
        depthWrite: false
      });
      for (let i = 0; i < 4; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.65 + i * 0.22, 4.8, 16, 1, true), mat);
        cone.position.set(o[0] + (i - 1.5) * 0.55, o[1] - 1.2, o[2]);
        cone.rotation.z = 0.28 + i * 0.05;
        g.add(cone);
        items.push({ mesh: cone, seed: i * 1.1 });
      }
    } else if (vfx.type === "sound_shockwave" || vfx.type === "heat_haze") {
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.72 });
      for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 10, 32), mat.clone());
        ring.position.set(o[0], o[1], o[2]);
        g.add(ring);
        items.push({ mesh: ring, seed: i * 0.25 });
      }
    } else if (vfx.type === "electric_arcs") {
      const mat = new THREE.MeshBasicMaterial({ color: col });
      for (let i = 0; i < 7; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.24, 6), mat);
        g.add(seg);
        items.push({ mesh: seg, seed: i });
      }
    } else if (vfx.type === "pour_stream") {
      const mat = new THREE.MeshPhysicalMaterial({
        color: col,
        roughness: 0.15,
        clearcoat: 0.8,
        transparent: true,
        opacity: 0.9
      });
      for (let i = 0; i < 14; i++) {
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.028 + (i % 2) * 0.008, 10, 8), mat);
        g.add(drop);
        items.push({ mesh: drop, seed: i / 14 });
      }
    } else if (vfx.type === "condensation_drops") {
      const mat = new THREE.MeshPhysicalMaterial({
        color: col,
        transparent: true,
        opacity: 0.72,
        roughness: 0.08,
        clearcoat: 1.0
      });
      for (let i = 0; i < 16; i++) {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.018 + (i % 3) * 0.005, 8, 8), mat);
        g.add(bead);
        items.push({ mesh: bead, seed: i * 0.41 });
      }
    } else if (vfx.type === "energy_flow") {
      const mat = new THREE.MeshBasicMaterial({ color: col });
      for (let i = 0; i < 10; i++) {
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mat);
        g.add(orb);
        items.push({ mesh: orb, seed: i / 10 });
      }
    } else {
      const count = vfx.type === "rain_storm" ? 24 : 16;
      const geo =
        vfx.type === "rain_storm"
          ? new THREE.BoxGeometry(0.014, 0.24, 0.014)
          : vfx.type === "frost_crystals"
          ? new THREE.OctahedronGeometry(0.055, 0)
          : vfx.type === "fire_flames"
          ? new THREE.ConeGeometry(0.09, 0.24, 8)
          : new THREE.SphereGeometry(vfx.type === "steam_smoke" ? 0.11 : 0.055, 10, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: vfx.type === "steam_smoke" ? 0.42 : 0.88
      });
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(geo, mat);
        g.add(m);
        items.push({ mesh: m, seed: i * 0.47 });
      }
    }

    this.stageGroup.add(g);
    this.vfxNodes.push({ spec: vfx, group: g, items });
  }

  measureActorBounds(mesh, scale = 1.0) {
    let minY = 0;
    let maxY = 0.6;
    if (typeof THREE.Box3 === "function") {
      try {
        mesh.scale.set(scale, scale, scale);
        mesh.position.set(0, 0, 0);
        mesh.updateMatrixWorld?.(true);
        const box = new THREE.Box3().setFromObject(mesh);
        if (Number.isFinite(box.min?.y) && Number.isFinite(box.max?.y) && box.max.y > box.min.y) {
          minY = box.min.y;
          maxY = box.max.y;
        }
      } catch {}
    }
    return {
      groundOffsetY: -minY,
      height: Math.max(0.08, maxY - minY)
    };
  }

  groundActorsToSurfaces() {
    const byId = new Map();
    for (const entry of this.actors) {
      const bounds = this.measureActorBounds(entry.mesh, entry.spec.scale || 1.0);
      entry.groundOffsetY = bounds.groundOffsetY;
      entry.height = bounds.height;
      entry.resolvedSurfaceY = 0;
      entry.resolvedX = entry.spec.placement?.x ?? entry.spec.startPos?.[0] ?? 0;
      entry.resolvedZ = entry.spec.placement?.z ?? entry.spec.startPos?.[2] ?? 0;
      entry.isGrounded = entry.spec.placement?.on !== "floating";
      byId.set(entry.spec.id, entry);
      if (entry.spec.assetId) byId.set(entry.spec.assetId, entry);
    }

    // Two passes resolve surface -> on_top / inside support chains cleanly
    for (let pass = 0; pass < 2; pass++) {
      for (const entry of this.actors) {
        const pl = entry.spec.placement || { on: "surface", x: entry.resolvedX, z: entry.resolvedZ, yOffset: 0 };
        const on = pl.on || "surface";
        if (on === "floating") {
          entry.isGrounded = false;
          entry.resolvedSurfaceY = entry.spec.startPos?.[1] ?? 0.65;
        } else if (on === "wall") {
          entry.isGrounded = true;
          entry.resolvedZ = -1.92;
          entry.resolvedSurfaceY = Math.max(0.4, pl.yOffset || 0.85);
        } else if (on.startsWith("on_top:")) {
          const parent = byId.get(on.slice(7));
          entry.isGrounded = true;
          if (parent && parent !== entry) {
            entry.resolvedX = parent.resolvedX + (Math.abs(pl.x) < 0.35 ? pl.x : 0);
            entry.resolvedZ = parent.resolvedZ + (Math.abs(pl.z) < 0.35 ? pl.z : 0);
            entry.resolvedSurfaceY = parent.resolvedSurfaceY + parent.height + (pl.yOffset || 0);
          } else {
            entry.resolvedSurfaceY = pl.yOffset || 0;
          }
        } else if (on.startsWith("inside:")) {
          const parent = byId.get(on.slice(7));
          entry.isGrounded = true;
          if (parent && parent !== entry) {
            entry.resolvedX = parent.resolvedX + (Math.abs(pl.x) < 0.25 ? pl.x : 0);
            entry.resolvedZ = parent.resolvedZ + (Math.abs(pl.z) < 0.25 ? pl.z : 0);
            entry.resolvedSurfaceY = parent.resolvedSurfaceY + 0.08 + (pl.yOffset || 0);
          } else {
            entry.resolvedSurfaceY = 0.08 + (pl.yOffset || 0);
          }
        } else {
          entry.isGrounded = true;
          entry.resolvedSurfaceY = pl.yOffset || 0;
        }
      }
    }
  }

  loadBlueprint(sceneKey, blueprint, tSec) {
    if (this.activeSceneKey === sceneKey) return;

    // Capture outgoing frame for smooth GPU transition!
    if (this.postPipeline?.supported && this.activeSceneKey) {
      this.postPipeline.capturePreviousFrame(this.scene, this.camera);
      const tMap = { none: 0, zoom_through: 1, whip_pan: 2, flash_impact: 3, cross_dissolve: 4 };
      this.transType = tMap[blueprint?.cameraTrack?.transitionIn] ?? 4;
      this.transStartSec = tSec;
    } else {
      this.transType = 0;
    }

    this.activeSceneKey = sceneKey;
    this.clearStage();
    this.applyLightingMood(blueprint.lightingMood || blueprint.worldFoundation?.lightingPreset || "soft_daylight");
    this.buildWorldFoundation(blueprint.worldFoundation, blueprint.environment || "studio_bench");

    for (const actorSpec of blueprint.actors || []) {
      const mesh = buildCinemaActorPrefab(actorSpec, this.tex);
      if (mesh.userData?.waterShaderMat) this.waterMats.push(mesh.userData.waterShaderMat);
      this.stageGroup.add(mesh);
      this.actors.push({ spec: actorSpec, mesh });
    }

    // Snap every solid prop & character cleanly to tabletop/floor/container via Box3!
    this.groundActorsToSurfaces();

    for (const vfx of blueprint.vfxSystems || []) {
      this.buildVfxSystem(vfx);
    }

    // Load optional Nano Banana AI keyframe texture if present
    this.activeKeyframeTex = null;
    const kfUrl = blueprint?.aiKeyframe?.dataUrl;
    if (kfUrl && typeof Image !== "undefined") {
      if (this.keyframeCache.has(kfUrl)) {
        this.activeKeyframeTex = this.keyframeCache.get(kfUrl);
      } else {
        const img = new Image();
        img.onload = () => {
          const tex = new THREE.Texture(img);
          tex.needsUpdate = true;
          this.keyframeCache.set(kfUrl, tex);
          if (this.activeSceneKey === sceneKey) this.activeKeyframeTex = tex;
        };
        img.src = kfUrl;
      }
    }
  }

  renderFrame(blueprint, sceneKey, tSec, sceneElapsedSec = 0, sceneDurationSec = 4.5, voiceEnergy = 0) {
    this.loadBlueprint(sceneKey, blueprint, tSec);

    const progress = Math.max(0, Math.min(1, sceneElapsedSec / Math.max(2.0, sceneDurationSec)));
    const easedP = easeInOutCubic(progress);

    // 1. Update Animated Sky & Water Shaders
    if (this.skyMat?.uniforms?.uTime) this.skyMat.uniforms.uTime.value = tSec;
    for (const wm of this.waterMats) {
      if (wm?.uniforms?.uTime) wm.uniforms.uTime.value = tSec;
    }

    // 2. Kling-Style Quadratic Bezier Camera Choreography + Dolly Zoom + Organic Breathing
    const cam = blueprint.cameraTrack || {};
    const cPos = evalQuadBezier(
      cam.start || [0.6, 1.4, 3.8],
      cam.mid || [0.1, 1.25, 3.2],
      cam.end || [-0.35, 1.15, 2.85],
      easedP
    );
    const lStart = cam.lookStart || [0, 0.58, 0];
    const lEnd = cam.lookEnd || [0.1, 0.65, 0];
    const lx = lStart[0] + (lEnd[0] - lStart[0]) * easedP;
    const ly = lStart[1] + (lEnd[1] - lStart[1]) * easedP + 0.08;
    const lz = lStart[2] + (lEnd[2] - lStart[2]) * easedP;

    const amp = cam.handheldAmp || 0.015;
    const bx = Math.sin(tSec * (amp > 0.03 ? 28 : 1.7)) * amp;
    const by = Math.cos(tSec * (amp > 0.03 ? 23 : 1.3)) * amp * 0.8;

    const prevX = this.prevCamPos.x;
    const prevY = this.prevCamPos.y;
    const nextCamX = cPos[0] + bx;
    const nextCamY = cPos[1] + by;
    const nextCamZ = cPos[2];
    const camVelX = nextCamX - prevX;
    const camVelY = nextCamY - prevY;
    this.prevCamPos.set(nextCamX, nextCamY, nextCamZ);

    const optics = blueprint.optics || {};
    const lensFov = optics.lensMm ? Math.max(30, Math.min(62, Math.round(1800 / optics.lensMm))) : null;
    const fovStart = cam.fovStart || lensFov || 46;
    const fovEnd = cam.fovEnd || (lensFov ? Math.max(30, lensFov - 4) : 42);

    this.camera.position.set(nextCamX, nextCamY, nextCamZ);
    this.camera.fov = fovStart + (fovEnd - fovStart) * easedP;
    this.camera.updateProjectionMatrix?.();
    this.lookAtVec.set(lx, ly, lz);
    this.camera.lookAt(this.lookAtVec);
    if (cam.rollTilt) this.camera.rotation.z += cam.rollTilt;

    // 3. Animate Grounded Actors Along Keyframes + Literal Script Actions + Custom Bone Rigs!
    const useSpringGlobal = optics.springPhysics === true;
    for (let aIdx = 0; aIdx < this.actors.length; aIdx++) {
      const entry = this.actors[aIdx];
      const { spec, mesh } = entry;
      if (spec.prefab !== "pipe_curved" && spec.prefab !== "wire_arc") {
        let x, y, z, rx, ry, rz, sc, vel;
        if (Array.isArray(spec.keyframes) && spec.keyframes.length >= 2) {
          const kf = evaluateKeyframeTrack(spec.keyframes, progress);
          [x, y, z] = kf.pos;
          [rx, ry, rz] = kf.rot;
          sc = kf.scale;
          vel = kf.vel;
        } else {
          const sp = spec.startPos || [entry.resolvedX, 0, entry.resolvedZ];
          const ep = spec.endPos || sp;
          x = sp[0] + (ep[0] - sp[0]) * easedP;
          y = sp[1] + (ep[1] - sp[1]) * easedP;
          z = sp[2] + (ep[2] - sp[2]) * easedP;
          const sr = spec.startRot || [0, 0, 0];
          const er = spec.endRot || sr;
          rx = sr[0] + (er[0] - sr[0]) * easedP;
          ry = sr[1] + (er[1] - sr[1]) * easedP;
          rz = sr[2] + (er[2] - sr[2]) * easedP;
          sc = spec.scale || 1.0;
          vel = [ep[0] - sp[0], ep[1] - sp[1], ep[2] - sp[2]];
        }

        // Physical surface grounding: anchor bottom flush onto resolved support surface!
        if (entry.isGrounded) {
          x = entry.resolvedX + (x - (spec.startPos?.[0] ?? entry.resolvedX)) * 0.4;
          z = entry.resolvedZ + (z - (spec.startPos?.[2] ?? entry.resolvedZ)) * 0.4;
          y = entry.resolvedSurfaceY + (entry.groundOffsetY || 0);
        }

        // Literal script-synced physical choreography!
        const sa = spec.scriptAction || "rest";
        if (sa === "pour_into") {
          const tiltP = Math.sin(Math.min(1, progress * 1.15) * Math.PI);
          y += 0.34 * Math.min(1, progress * 2.5);
          x -= 0.16 * Math.min(1, progress * 2.5);
          rz += 0.92 * Math.max(0.25, tiltP);
        } else if (sa === "stir_inside") {
          const ang = tSec * 4.4;
          x += Math.cos(ang) * 0.16;
          z += Math.sin(ang) * 0.16;
          rx += Math.sin(ang) * 0.18;
          rz += -Math.cos(ang) * 0.18;
        } else if (sa === "vibrate_fault") {
          x += Math.sin(tSec * 46) * 0.025;
          z += Math.cos(tSec * 41) * 0.018;
        } else if (sa === "assemble_drop") {
          const dropU = Math.min(1, sceneElapsedSec / 0.75);
          y += (1 - easeOutBack(dropU)) * 0.85;
        } else if (sa === "celebrate_bounce") {
          y += Math.abs(Math.sin(tSec * 5.2)) * 0.08;
        } else if (sa === "spin_smooth") {
          ry += tSec * (spec.speed || 2.2);
        }

        if (sceneElapsedSec < 0.55 && spec.enterStyle !== "none") {
          const epEnter = sceneElapsedSec / 0.55;
          if (spec.enterStyle === "pop_bounce") sc *= Math.max(0.05, easeOutBack(epEnter));
          else if (spec.enterStyle === "drop_impact") y += (1 - easeOutBack(epEnter)) * 0.9;
          else if (spec.enterStyle === "slide_left") x -= (1 - easeInOutCubic(epEnter)) * 1.4;
          else if (spec.enterStyle === "slide_right") x += (1 - easeInOutCubic(epEnter)) * 1.4;
          else if (spec.enterStyle === "emerge_up") y -= (1 - easeOutBack(epEnter)) * 0.65;
        }

        const spd = spec.speed || 2.2;
        if (spec.loopMotion === "hover" && !entry.isGrounded) y += Math.sin(tSec * spd) * 0.06;
        if (spec.loopMotion === "shake" || spec.loopMotion === "vibrate") {
          x += Math.sin(tSec * 42) * 0.025;
          z += Math.cos(tSec * 36) * 0.018;
        }
        if (spec.loopMotion === "pulse" && !entry.isGrounded) sc *= 1 + Math.sin(tSec * spd * 1.4) * 0.045;
        if (spec.loopMotion === "swim") {
          x += Math.sin(tSec * spd * 0.7) * 0.28;
          y += Math.cos(tSec * spd) * 0.04;
        }
        if (spec.loopMotion === "piston") y += Math.abs(Math.sin(tSec * spd * 2)) * 0.12;

        // Only apply spring squash-and-stretch to organic/character/flying actors — NEVER rigid bowls/tables!
        const allowSpring =
          useSpringGlobal &&
          (!entry.isGrounded || spec.prefab === "human_protagonist" || spec.prefab.startsWith("fish_") || spec.prefab === "stingray");
        const deform = computeSpringPhysicsDeform(vel, tSec, aIdx * 1.1, allowSpring);
        mesh.position.set(x, y, z);
        mesh.scale.set(sc * deform.scaleMul[0], sc * deform.scaleMul[1], sc * deform.scaleMul[2]);

        if (spec.loopMotion === "spin_y") ry += tSec * spd;
        if (spec.loopMotion === "spin_z") rz += tSec * spd;
        mesh.rotation.set(rx + deform.tiltX, ry, rz + deform.tiltZ);
      }

      // Animate Gemini-Synthesized Custom Skeletal Bone Rigs!
      if (mesh.userData?.customAnimatedBones) {
        animateProceduralCustomRig(mesh, tSec, voiceEnergy);
      }

      // Animate Articulated Sub-Parts!
      if (Array.isArray(mesh.userData?.spinFans)) {
        mesh.userData.spinFans.forEach((f) => {
          f.rotation.z = tSec * (spec.speed || 8) * 1.8;
        });
      }
      if (mesh.userData?.pulseChild) {
        const ps = 0.92 + Math.sin(tSec * 9) * 0.14;
        mesh.userData.pulseChild.scale.set(ps, ps, ps);
      }
      if (mesh.userData?.tailChild) {
        mesh.userData.tailChild.rotation.y = Math.sin(tSec * 11) * 0.42;
      }
      if (Array.isArray(mesh.userData?.wings)) {
        const fl = Math.sin(tSec * 7.5) * 0.32;
        mesh.userData.wings[0].rotation.x = fl;
        mesh.userData.wings[1].rotation.x = -fl;
      }
      if (mesh.userData?.articulateChild) {
        mesh.userData.articulateChild.rotation.z = Math.sin(tSec * 3.2) * 0.38;
      }
      if (Array.isArray(mesh.userData?.thermalTiles)) {
        const gap = 1.18 - easedP * 0.16;
        mesh.userData.thermalTiles.forEach((t) => {
          t.mesh.position.set(t.c * 0.46 * gap, 0, t.r * 0.36 * gap);
        });
      }

      // Animate Pixar Protagonist Expressions, Eye-Blink, Lip-Sync & Body Action!
      if (mesh.userData?.rig) {
        const r = mesh.userData.rig;
        const act = spec.action || "build";
        const blink = tSec % 3.6 > 3.46 ? 0.12 : 1.0;
        r.eyeGroup.scale.set(1, blink, 1);
        r.mouth.scale.set(1.2, 0.45 + voiceEnergy * 1.25 + (act === "panic" ? 0.65 : 0), 0.5);

        if (act === "panic" || act === "cover_ears") {
          r.hips.position.y = 0.68 + Math.abs(Math.sin(tSec * 12)) * 0.08;
          r.leftArm.rotation.set(-2.35 + Math.sin(tSec * 14) * 0.25, 0, -0.35);
          r.rightArm.rotation.set(-2.35 - Math.sin(tSec * 14) * 0.25, 0, 0.35);
          r.leftBrow.rotation.z = 0.35;
          r.rightBrow.rotation.z = -0.35;
          r.head.rotation.y = Math.sin(tSec * 11) * 0.22;
        } else if (act === "celebrate") {
          r.hips.position.y = 0.68 + Math.abs(Math.sin(tSec * 7)) * 0.15;
          r.leftArm.rotation.set(-2.7, 0, -0.2);
          r.rightArm.rotation.set(-2.7, 0, 0.2);
          r.leftBrow.rotation.z = -0.15;
          r.rightBrow.rotation.z = 0.15;
          r.head.rotation.y = Math.sin(tSec * 3.5) * 0.14;
        } else {
          const w = Math.sin(tSec * 4.5);
          r.hips.position.y = 0.68 + Math.abs(w) * 0.025;
          r.rightArm.rotation.set(-1.15 + w * 0.35, 0, 0.15);
          r.leftArm.rotation.set(-0.9 - w * 0.22, 0, -0.1);
          r.leftBrow.rotation.z = 0;
          r.rightBrow.rotation.z = 0;
          r.head.rotation.y = Math.sin(tSec * 1.8) * 0.12;
        }
      }
    }

    // 4. Animate Volumetric VFX Systems
    for (const vfxNode of this.vfxNodes) {
      const { spec, items } = vfxNode;
      const o = spec.origin || [0, 0.7, 0];
      const tgt = spec.target || [o[0] + 0.9, o[1], o[2]];

      if (spec.type === "god_rays") {
        items.forEach((it) => {
          it.mesh.material.opacity = (0.08 + Math.sin(tSec * 1.4 + it.seed) * 0.045) * (spec.intensity || 0.8);
        });
      } else if (spec.type === "sound_shockwave" || spec.type === "heat_haze") {
        items.forEach((it) => {
          const u = (tSec * 1.35 + it.seed) % 1;
          it.mesh.scale.setScalar(0.55 + u * 2.1);
          it.mesh.material.opacity = (1 - u) * 0.75;
        });
      } else if (spec.type === "pour_stream") {
        items.forEach((it) => {
          const u = (tSec * 1.6 + it.seed) % 1;
          const x = o[0] + (tgt[0] - o[0]) * u;
          const z = o[2] + (tgt[2] - o[2]) * u;
          const y = o[1] + (tgt[1] - o[1]) * (u * u);
          it.mesh.position.set(x, y, z);
          it.mesh.scale.setScalar(0.85 + Math.sin(u * Math.PI) * 0.35);
        });
      } else if (spec.type === "condensation_drops") {
        items.forEach((it, idx) => {
          const ang = (idx / items.length) * Math.PI * 2;
          const slide = ((tSec * 0.12 + it.seed) % 1) * 0.28;
          it.mesh.position.set(
            o[0] + Math.cos(ang) * 0.31,
            Math.max(0.06, o[1] + 0.16 - slide),
            o[2] + Math.sin(ang) * 0.31
          );
        });
      } else if (spec.type === "energy_flow") {
        items.forEach((it) => {
          const u = (tSec * 0.85 + it.seed) % 1;
          const arcY = Math.sin(u * Math.PI) * 0.32;
          it.mesh.position.set(
            o[0] + (tgt[0] - o[0]) * u,
            o[1] + (tgt[1] - o[1]) * u + arcY,
            o[2] + (tgt[2] - o[2]) * u
          );
        });
      } else if (spec.type === "electric_arcs") {
        items.forEach((it, idx) => {
          const f = (idx + 0.5) / items.length;
          const jitter = Math.sin(tSec * 55 + idx * 7.1) * 0.14;
          it.mesh.position.set(
            o[0] + (tgt[0] - o[0]) * f,
            o[1] + (tgt[1] - o[1]) * f + jitter,
            o[2] + (tgt[2] - o[2]) * f + Math.cos(tSec * 48 + idx) * 0.08
          );
          it.mesh.rotation.z = Math.PI / 2 + jitter * 3.0;
        });
      } else {
        const mField = blueprint.motionField;
        items.forEach((it, idx) => {
          const u = (tSec * (spec.type === "rain_storm" ? 2.2 : 0.75) + it.seed) % 1;
          const ang = idx * 1.3 + tSec * 1.2;
          const fOff = computeMotionBrushOffset(mField, o, u, tSec, it.seed);
          if (spec.type === "rain_storm") {
            it.mesh.position.set(
              o[0] + Math.cos(idx * 3.7) * 2.4 + fOff[0] * 0.5,
              3.2 - u * 3.4,
              o[2] + Math.sin(idx * 2.1) * 1.6 + fOff[2] * 0.4
            );
          } else if (spec.type === "water_splash") {
            const r = u * 0.85;
            it.mesh.position.set(
              o[0] + Math.cos(ang) * r + fOff[0] * 0.4,
              o[1] + u * 0.9 - u * u * 1.1 + fOff[1] * 0.3,
              o[2] + Math.sin(ang) * r + fOff[2] * 0.4
            );
          } else if (spec.type === "frost_crystals") {
            it.mesh.position.set(
              o[0] + Math.cos(ang) * 0.75 + fOff[0] * 0.5,
              o[1] + 0.85 - u * 1.1 + fOff[1] * 0.3,
              o[2] + Math.sin(ang) * 0.75 + fOff[2] * 0.5
            );
            it.mesh.rotation.set(tSec * 2 + idx, tSec * 1.5, 0);
          } else {
            const spread = spec.type === "gold_sparkles" ? 1.35 : 0.42;
            it.mesh.position.set(
              o[0] + Math.cos(ang) * spread * (0.35 + u * 0.65) + fOff[0] * 0.55,
              o[1] + u * 1.25 + fOff[1] * 0.45,
              o[2] + Math.sin(ang) * spread * (0.35 + u * 0.65) + fOff[2] * 0.55
            );
            if (spec.type === "steam_smoke") it.mesh.scale.setScalar(0.7 + u * 1.4);
          }
        });
      }
    }

    // 5. Render Scene + Multi-Pass HDR Bloom / Depth-of-Field Bokeh / Motion Blur / Kling Transitions!
    const grade = blueprint.colorGrade || {};
    const transElapsed = Math.max(0, tSec - this.transStartSec);
    const transProgress = this.transType > 0 ? Math.min(1, transElapsed / 0.42) : 1.0;
    const focusDist =
      optics.dofFocusDist ||
      Math.max(1.8, Math.hypot(nextCamX - lx, nextCamY - ly, nextCamZ - lz));
    const mbScale = (optics.motionBlur ?? 0.2) * 0.045;

    this.postPipeline.render(this.scene, this.camera, {
      tSec,
      progress,
      transProgress,
      transType: this.transType,
      keyframeTex: this.activeKeyframeTex,
      focusDist,
      dofAperture: optics.dofAperture ?? 0.18,
      motionVecX: Math.max(-0.012, Math.min(0.012, camVelX * mbScale)),
      motionVecY: Math.max(-0.012, Math.min(0.012, camVelY * mbScale)),
      bloomStrength: grade.bloomStrength ?? 0.16,
      contrast: grade.contrast ?? 1.05,
      saturation: grade.saturation ?? 1.08,
      vignette: grade.vignette ?? 0.13,
      tintHex: grade.tintHex || "#38bdf8",
      lensFlare: Boolean(grade.lensFlare),
      speedLines: Boolean(grade.speedLines),
      chromatic: (cam.handheldAmp || 0) > 0.03 ? 0.004 : 0.0
    });
  }
}
