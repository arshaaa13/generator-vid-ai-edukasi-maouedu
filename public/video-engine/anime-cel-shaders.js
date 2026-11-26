// Studio MAPPA / Jujutsu Kaisen Custom GLSL Shaders & Satsuei (撮影) Compositing Pipeline
// Implements:
// 1. 3-Band Hard-Edge Anime Cel-Shading with Chromatic Shadow Shift (never muddy grey!)
// 2. Razor-Sharp Fresnel Cursed-Energy Rim Lighting + Shibuya Manga Shadow Hatching
// 3. Inverted-Hull Variable-Weight Anime Ink Outlines (auto-thickens on Impact Frames!)
// 4. Real-Time Impact Frame Inversion (B&W Manga Negative & Black Flash Crimson-Black Strobe)
// 5. Painted MAPPA Anime Sky Dome & Full-Screen Satsuei Post-Compositor (Halation Bloom, DOF, Speed Lines, Chromatic Shock)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const CEL_VERT = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const CEL_FRAG = `
  uniform vec3 uBaseColor;
  uniform vec3 uShadowColor;
  uniform vec3 uRimColor;
  uniform vec3 uLightDir;
  uniform float uRimIntensity;
  uniform float uSpecStrength;
  uniform float uEmissive;
  uniform float uHatchStrength;
  uniform float uImpactMode; // 0=normal, 1=B&W manga invert, 2=Black Flash crimson-black
  uniform float uHasMap;
  uniform sampler2D uMap;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uLightDir);

    vec3 albedo = uBaseColor;
    if (uHasMap > 0.5) {
      albedo *= texture2D(uMap, vUv).rgb;
    }

    float ndl = dot(N, L);
    // MAPPA / JJK 3-band crisp cel terminator (lit / mid shadow / deep shadow)
    float litBand = smoothstep(0.06, 0.11, ndl);
    float deepBand = smoothstep(-0.28, -0.22, ndl);

    vec3 midShadow = mix(albedo * uShadowColor, albedo * 0.72, 0.35);
    vec3 deepShadow = albedo * uShadowColor * 0.62;
    vec3 col = mix(deepShadow, midShadow, deepBand);
    col = mix(col, albedo * 1.08, litBand);

    // Subtle Shibuya Season-2 diagonal manga ink hatching in deepest shadow crevices
    if (uHatchStrength > 0.01 && ndl < -0.18) {
      float diag = sin((gl_FragCoord.x + gl_FragCoord.y) * 0.68);
      float hatch = smoothstep(0.65, 0.9, diag);
      col = mix(col, deepShadow * 0.45, hatch * uHatchStrength * 0.55);
    }

    // Crisp Anime Specular Band (hair halo / metallic glint)
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0001), 28.0);
    float specStep = smoothstep(0.45, 0.52, spec) * uSpecStrength;
    col += mix(vec3(1.0), uRimColor, 0.25) * specStep;

    // Signature JJK Cursed-Energy Fresnel Rim Light
    float fresnel = pow(max(1.0 - max(dot(N, V), 0.0), 0.0001), 3.1);
    float rimStep = smoothstep(0.32, 0.42, fresnel) * uRimIntensity;
    col += uRimColor * rimStep * 0.92;

    // Emissive pop for glowing eyes, horns, cursed cores
    col += albedo * uEmissive;

    // Studio MAPPA 2-3 Frame High-Contrast Impact Frame Mode!
    if (uImpactMode > 0.5) {
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      float bw = step(0.34, lum + rimStep * 0.35);
      if (uImpactMode > 1.5) {
        // Black Flash (Kokusen): pitch black silhouettes + screaming crimson energy edge!
        vec3 bf = mix(vec3(0.02, 0.01, 0.03), vec3(1.0, 0.1, 0.22), bw);
        bf += vec3(1.0, 0.95, 0.95) * step(0.62, rimStep);
        col = bf;
      } else {
        // Classic Shibuya B&W Manga Negative Impact Frame!
        col = mix(vec3(0.03), vec3(0.98), 1.0 - bw);
      }
    }

    gl_FragColor = vec4(clamp(col, 0.0, 1.5), 1.0);
  }
`;

const OUTLINE_VERT = `
  uniform float uThickness;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    float distScale = clamp(-mvPos.z * 0.22, 0.55, 1.85);
    vec3 extruded = position + normalize(normal) * uThickness * distScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(extruded, 1.0);
  }
`;

const OUTLINE_FRAG = `
  uniform vec3 uInkColor;
  void main() {
    gl_FragColor = vec4(uInkColor, 1.0);
  }
`;

const MAPPA_SKY_VERT = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const MAPPA_SKY_FRAG = `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uLower;
  uniform vec3 uAccent;
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uImpactMode;
  uniform float uNight;
  varying vec3 vDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -1.0, 1.0);
    vec3 col = h >= 0.0
      ? mix(uHorizon, uZenith, pow(max(h, 0.0001), 0.58))
      : mix(uHorizon, uLower, pow(max(-h, 0.0001), 0.5));

    // Painted Anime Stepped Cumulus Clouds (Makoto Shinkai / MAPPA crisp rim clouds!)
    if (h > 0.03) {
      vec2 cuv = d.xz / (h + 0.34) * 1.45 + vec2(uTime * 0.018, 0.0);
      float n = noise(cuv) * 0.58 + noise(cuv * 2.4 + 3.1) * 0.42;
      float cloudBody = smoothstep(0.56, 0.62, n) * smoothstep(0.03, 0.2, h) * (1.0 - smoothstep(0.68, 0.96, h));
      float cloudRim = smoothstep(0.68, 0.74, n) * cloudBody;
      vec3 cBase = mix(uHorizon, uZenith, 0.25);
      vec3 cRim = mix(vec3(1.0), uAccent, 0.35);
      col = mix(col, mix(cBase, cRim, cloudRim), cloudBody * (0.72 - uNight * 0.35));
    }

    // Dramatic Anime Sun / Moon Halo
    float sDot = max(dot(d, normalize(uSunDir)), 0.0001);
    col += uAccent * pow(sDot, 10.0) * 0.45;
    col += vec3(1.0) * smoothstep(0.992, 0.996, sDot) * 0.9;

    // Night stars / cursed sparks in sky
    if (uNight > 0.2 && h > 0.0) {
      vec2 suv = floor(d.xz / (abs(d.y) + 0.3) * 90.0);
      float st = hash(suv);
      if (st > 0.991) {
        col += vec3(0.95, 0.98, 1.0) * (0.55 + 0.45 * sin(uTime * 4.0 + st * 200.0)) * uNight;
      }
    }

    // Impact Frame Sky Flash!
    if (uImpactMode > 0.5) {
      col = uImpactMode > 1.5 ? vec3(0.04, 0.01, 0.03) : vec3(0.96, 0.96, 0.98);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createMappaCelMaterial({
  color = "#cbd5e1",
  shadowColor = "#312e81",
  rimColor = "#38bdf8",
  lightDir = [0.55, 0.85, 0.6],
  rimIntensity = 1.05,
  specStrength = 0.28,
  emissive = 0.0,
  hatchStrength = 0.45,
  map = null,
  doubleSide = false
} = {}) {
  if (typeof THREE.ShaderMaterial !== "function") {
    return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.45 });
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: new THREE.Color(color) },
      uShadowColor: { value: new THREE.Color(shadowColor) },
      uRimColor: { value: new THREE.Color(rimColor) },
      uLightDir: { value: new THREE.Vector3(lightDir[0], lightDir[1], lightDir[2]).normalize() },
      uRimIntensity: { value: rimIntensity },
      uSpecStrength: { value: specStrength },
      uEmissive: { value: emissive },
      uHatchStrength: { value: hatchStrength },
      uImpactMode: { value: 0.0 },
      uHasMap: { value: map ? 1.0 : 0.0 },
      uMap: { value: map || null }
    },
    vertexShader: CEL_VERT,
    fragmentShader: CEL_FRAG,
    side: doubleSide ? THREE.DoubleSide : THREE.FrontSide
  });
  mat.userData = { isMappaCel: true };
  return mat;
}

export function createInkOutlineMaterial(thickness = 0.018, inkColor = "#07080d") {
  if (typeof THREE.ShaderMaterial !== "function") {
    return new THREE.MeshBasicMaterial({ color: new THREE.Color(inkColor), side: THREE.BackSide });
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uInkColor: { value: new THREE.Color(inkColor) }
    },
    vertexShader: OUTLINE_VERT,
    fragmentShader: OUTLINE_FRAG,
    side: THREE.BackSide
  });
  mat.userData = { isInkOutline: true, baseThickness: thickness };
  return mat;
}

export function attachInkOutline(mesh, thickness = 0.018, inkColor = "#07080d") {
  if (!mesh?.geometry) return null;
  const outMat = createInkOutlineMaterial(thickness, inkColor);
  const outMesh = new THREE.Mesh(mesh.geometry, outMat);
  outMesh.userData.isInkOutlineMesh = true;
  mesh.add(outMesh);
  return outMesh;
}

export function createMappaSkyMaterial() {
  if (typeof THREE.ShaderMaterial !== "function") {
    return new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.BackSide });
  }
  return new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color(0x0b1026) },
      uHorizon: { value: new THREE.Color(0x1e3a8a) },
      uLower: { value: new THREE.Color(0x090a14) },
      uAccent: { value: new THREE.Color(0x38bdf8) },
      uSunDir: { value: new THREE.Vector3(0.4, 0.5, -0.75) },
      uTime: { value: 0.0 },
      uImpactMode: { value: 0.0 },
      uNight: { value: 0.8 }
    },
    vertexShader: MAPPA_SKY_VERT,
    fragmentShader: MAPPA_SKY_FRAG,
    side: THREE.BackSide,
    depthWrite: false
  });
}

// ============================================================================
// MAPPA SATSUEI (撮影) FULL-SCREEN POST-COMPOSITING PIPELINE
// ============================================================================
const QUAD_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const SATSUEI_BLOOM_FRAG = `
  uniform sampler2D uSceneTex;
  uniform vec2 uResolution;
  varying vec2 vUv;

  vec3 brightPass(vec2 uv) {
    vec3 c = texture2D(uSceneTex, clamp(uv, 0.001, 0.999)).rgb;
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    float soft = smoothstep(0.68, 0.98, luma);
    return c * soft;
  }

  void main() {
    vec2 px = 1.0 / max(uResolution, vec2(1.0));
    vec3 acc = brightPass(vUv) * 0.24;
    vec2 dirs[8];
    dirs[0] = vec2( 1.0,  0.0);
    dirs[1] = vec2(-1.0,  0.0);
    dirs[2] = vec2( 0.0,  1.0);
    dirs[3] = vec2( 0.0, -1.0);
    dirs[4] = vec2( 0.707,  0.707);
    dirs[5] = vec2(-0.707,  0.707);
    dirs[6] = vec2( 0.707, -0.707);
    dirs[7] = vec2(-0.707, -0.707);

    for (int i = 0; i < 8; i++) {
      acc += brightPass(vUv + dirs[i] * px * 2.5) * 0.055;
      acc += brightPass(vUv + dirs[i] * px * 6.0) * 0.04;
    }
    gl_FragColor = vec4(acc, 1.0);
  }
`;

const SATSUEI_COMP_FRAG = `
  uniform sampler2D uSceneTex;
  uniform sampler2D uBloomTex;
  uniform sampler2D uPrevTex;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uBloomStrength;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uChromatic;
  uniform float uSpeedLines;
  uniform float uImpactMode;
  uniform float uTransProgress;
  uniform vec3 uAuraTint;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec3 col = texture2D(uSceneTex, uv).rgb;

    // 1. Chromatic Aberration (subtle anime lens fringe normally, punchy RGB split on Impact!)
    if (uChromatic > 0.0005) {
      vec2 dir = (uv - 0.5) * uChromatic;
      col.r = mix(col.r, texture2D(uSceneTex, clamp(uv + dir, 0.002, 0.998)).r, 0.85);
      col.b = mix(col.b, texture2D(uSceneTex, clamp(uv - dir, 0.002, 0.998)).b, 0.85);
    }

    // 2. Satsuei Cursed-Energy Halation Bloom
    vec3 bloom = texture2D(uBloomTex, uv).rgb;
    col += bloom * uBloomStrength * 1.1;

    // 3. Manga Radial Action Speed Lines (only during dash / clash / impact beats!)
    if (uSpeedLines > 0.5 || uImpactMode > 0.5) {
      vec2 p = uv - vec2(0.5, 0.44);
      float ang = atan(p.y, p.x);
      float dist = length(p);
      float stepT = floor(uTime * 20.0);
      float rays = pow(max(abs(sin(ang * 34.0 + stepT * 2.1)), 0.0001), 16.0);
      float mask = smoothstep(0.24, 0.54, dist);
      vec3 lineCol = uImpactMode > 1.5 ? vec3(1.0, 0.15, 0.28) : mix(vec3(1.0), uAuraTint, 0.45);
      col += lineCol * rays * mask * (uImpactMode > 0.5 ? 0.58 : 0.28);
    }

    // 4. MAPPA Chiaroscuro High-Contrast Anime Color Grade
    col = (col - 0.5) * uContrast + 0.5;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, uSaturation);

    // 5. Crisp Cinema Vignette + Fine Anime Film Texture
    float d = distance(uv, vec2(0.5));
    col *= 1.0 - smoothstep(0.44, 0.98, d) * 0.24;
    float grain = (fract(sin(dot(uv * (uTime + 1.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.012;
    col += grain;

    // 6. Clean Anime Cut / Whip Cross-Dissolve Transition
    if (uTransProgress < 0.999) {
      float tp = clamp(uTransProgress, 0.0, 1.0);
      vec3 prev = texture2D(uPrevTex, uv).rgb;
      col = mix(prev, col, smoothstep(0.0, 1.0, tp));
    }

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export class MappaSatsueiPipeline {
  constructor(renderer, width, height) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;
    this.supported =
      typeof THREE.WebGLRenderTarget === "function" &&
      typeof THREE.ShaderMaterial === "function" &&
      typeof THREE.OrthographicCamera === "function";

    if (!this.supported) return;

    this.sceneRT = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });
    this.prevRT = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });
    const bw = Math.max(128, Math.floor(width / 2));
    const bh = Math.max(128, Math.floor(height / 2));
    this.bloomRT = new THREE.WebGLRenderTarget(bw, bh, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });

    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.bloomScene = new THREE.Scene();
    this.bloomMat = new THREE.ShaderMaterial({
      uniforms: {
        uSceneTex: { value: this.sceneRT.texture },
        uResolution: { value: new THREE.Vector2(bw, bh) }
      },
      vertexShader: QUAD_VERT,
      fragmentShader: SATSUEI_BLOOM_FRAG,
      depthTest: false,
      depthWrite: false
    });
    this.bloomScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bloomMat));

    this.compScene = new THREE.Scene();
    this.compMat = new THREE.ShaderMaterial({
      uniforms: {
        uSceneTex: { value: this.sceneRT.texture },
        uBloomTex: { value: this.bloomRT.texture },
        uPrevTex: { value: this.prevRT.texture },
        uResolution: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0 },
        uBloomStrength: { value: 0.42 },
        uContrast: { value: 1.12 },
        uSaturation: { value: 1.18 },
        uChromatic: { value: 0.003 },
        uSpeedLines: { value: 0.0 },
        uImpactMode: { value: 0.0 },
        uTransProgress: { value: 1.0 },
        uAuraTint: { value: new THREE.Color(0x38bdf8) }
      },
      vertexShader: QUAD_VERT,
      fragmentShader: SATSUEI_COMP_FRAG,
      depthTest: false,
      depthWrite: false
    });
    this.compScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.compMat));
  }

  resize(width, height) {
    if (!this.supported) return;
    this.width = width;
    this.height = height;
    this.sceneRT.setSize(width, height);
    this.prevRT.setSize(width, height);
    const bw = Math.max(128, Math.floor(width / 2));
    const bh = Math.max(128, Math.floor(height / 2));
    this.bloomRT.setSize(bw, bh);
    this.bloomMat.uniforms.uResolution.value.set(bw, bh);
    this.compMat.uniforms.uResolution.value.set(width, height);
  }

  capturePreviousFrame(scene, camera) {
    if (!this.supported) return;
    this.renderer.setRenderTarget(this.prevRT);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
  }

  render(scene, camera, opts = {}) {
    if (!this.supported) {
      this.renderer.render(scene, camera);
      return;
    }

    this.renderer.setRenderTarget(this.sceneRT);
    this.renderer.render(scene, camera);

    this.renderer.setRenderTarget(this.bloomRT);
    this.renderer.render(this.bloomScene, this.quadCamera);

    this.renderer.setRenderTarget(null);
    const u = this.compMat.uniforms;
    u.uTime.value = opts.tSec ?? 0;
    u.uBloomStrength.value = opts.bloomStrength ?? 0.42;
    u.uContrast.value = opts.contrast ?? 1.12;
    u.uSaturation.value = opts.saturation ?? 1.18;
    u.uChromatic.value = opts.chromatic ?? 0.003;
    u.uSpeedLines.value = opts.speedLines ? 1.0 : 0.0;
    u.uImpactMode.value = opts.impactMode ?? 0.0;
    u.uTransProgress.value = opts.transProgress ?? 1.0;
    u.uAuraTint.value.set(opts.auraTint || "#38bdf8");

    this.renderer.render(this.compScene, this.quadCamera);
  }
}
