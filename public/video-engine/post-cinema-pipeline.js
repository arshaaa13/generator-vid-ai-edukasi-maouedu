// MaouEdu Video Engine — Multi-Pass Kling Cinema GPU Post-Processing Pipeline
// Pass 1: HDR Bright-Extract & Soft Wide Bloom Target (Half-Res for ultra-creamy glow)
// Pass 2: True Depth-Buffer Bokeh Depth-of-Field + Directional Camera Motion Blur +
//         Anamorphic Lens Flare + Chromatic Impact + ACES Filmic Grading + Kling GPU Transitions

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const QUAD_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Pass 1: Extract bright HDR speculars & emissives + 13-tap Gaussian Blur into half-res bloom RT
const BLOOM_EXTRACT_FRAG = `
  uniform sampler2D uSceneTex;
  uniform vec2 uResolution;
  varying vec2 vUv;

  vec3 brightPass(vec2 uv) {
    vec3 c = texture2D(uSceneTex, clamp(uv, 0.001, 0.999)).rgb;
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    float soft = smoothstep(0.82, 1.0, luma);
    return c * soft;
  }

  void main() {
    vec2 px = 1.0 / max(uResolution, vec2(1.0));
    vec3 acc = brightPass(vUv) * 0.22;
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
      acc += brightPass(vUv + dirs[i] * px * 2.8) * 0.055;
      acc += brightPass(vUv + dirs[i] * px * 6.5) * 0.042;
    }
    gl_FragColor = vec4(acc, 1.0);
  }
`;

// Pass 2: True Depth-of-Field Bokeh + Camera Motion Blur + Bloom Composite + Filmic LUT + Transitions
const COMPOSITE_FRAG = `
  uniform sampler2D uSceneTex;
  uniform sampler2D uDepthTex;
  uniform sampler2D uBloomTex;
  uniform sampler2D uPrevTex;
  uniform sampler2D uKeyframeTex;
  uniform float uHasDepth;
  uniform float uUseKeyframe;
  uniform float uTime;
  uniform float uSceneProgress;
  uniform float uTransProgress;
  uniform int uTransType; // 0=none, 1=zoom_through, 2=whip_pan, 3=flash_impact, 4=cross_dissolve
  uniform vec2 uResolution;
  uniform float uNear;
  uniform float uFar;
  uniform float uFocusDist;
  uniform float uDofAperture;
  uniform vec2 uMotionVec;
  uniform float uBloomStrength;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uVignette;
  uniform vec3 uTint;
  uniform float uLensFlare;
  uniform float uSpeedLines;
  uniform float uChromatic;
  varying vec2 vUv;

  float linearizeDepth(float depthSample) {
    float z = depthSample * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / max(0.0001, (uFar + uNear - z * (uFar - uNear)));
  }

  vec3 sampleScene(vec2 uv) {
    if (uUseKeyframe > 0.5) {
      vec2 centered = uv - 0.5;
      float zoom = 1.04 + uSceneProgress * 0.11;
      vec2 drift = vec2(sin(uTime * 0.7) * 0.018, cos(uTime * 0.55) * 0.012);
      vec2 baseUv = centered / zoom + 0.5 + drift;
      vec3 baseCol = texture2D(uKeyframeTex, clamp(baseUv, 0.002, 0.998)).rgb;
      float luma = dot(baseCol, vec3(0.299, 0.587, 0.114));
      vec2 parallaxUv = clamp(baseUv - drift * (luma * 0.65), 0.002, 0.998);
      return texture2D(uKeyframeTex, parallaxUv).rgb;
    }
    return texture2D(uSceneTex, clamp(uv, 0.001, 0.999)).rgb;
  }

  void main() {
    vec2 uv = vUv;
    vec2 px = 1.0 / max(uResolution, vec2(1.0));

    // 1. Compute True Depth-of-Field Circle-of-Confusion (CoC)
    float coc = 0.0;
    if (uUseKeyframe < 0.5 && uDofAperture > 0.02) {
      if (uHasDepth > 0.5) {
        float rawD = texture2D(uDepthTex, uv).r;
        float linD = linearizeDepth(rawD);
        float diff = abs(linD - uFocusDist) / max(1.2, uFocusDist);
        coc = clamp((diff - 0.18) * uDofAperture * 1.45, 0.0, 1.0);
      } else {
        float edgeDist = distance(uv, vec2(0.5, 0.48));
        coc = smoothstep(0.28, 0.72, edgeDist) * uDofAperture * 0.65;
      }
    }

    // 2. Sample with Bokeh Disk Blur + Directional Camera Motion Blur + Impact Chromatic Aberration
    vec3 col = sampleScene(uv);
    if (coc > 0.04) {
      vec3 bokehAcc = col;
      float radius = coc * 3.2;
      vec2 ring[8];
      ring[0] = vec2( 1.0,  0.0);
      ring[1] = vec2(-1.0,  0.0);
      ring[2] = vec2( 0.0,  1.0);
      ring[3] = vec2( 0.0, -1.0);
      ring[4] = vec2( 0.707,  0.707);
      ring[5] = vec2(-0.707,  0.707);
      ring[6] = vec2( 0.707, -0.707);
      ring[7] = vec2(-0.707, -0.707);
      for (int i = 0; i < 8; i++) {
        bokehAcc += sampleScene(uv + ring[i] * px * radius);
      }
      col = bokehAcc / 9.0;
    }

    float mvLen = length(uMotionVec);
    if (mvLen > 0.0005) {
      vec3 mb = col * 0.4;
      mb += sampleScene(uv + uMotionVec * 0.5) * 0.2;
      mb += sampleScene(uv - uMotionVec * 0.5) * 0.2;
      mb += sampleScene(uv + uMotionVec) * 0.1;
      mb += sampleScene(uv - uMotionVec) * 0.1;
      col = mb;
    }

    if (uChromatic > 0.001) {
      vec2 dir = (uv - 0.5) * uChromatic;
      col.r = mix(col.r, sampleScene(uv + dir).r, 0.85);
      col.b = mix(col.b, sampleScene(uv - dir).b, 0.85);
    }

    // 3. Add Subtle Clean Multi-Pass Bloom (never washes out bright daylight walls/bowls!)
    vec3 bloom = texture2D(uBloomTex, uv).rgb;
    col += bloom * uBloomStrength * 0.72;

    // 4. Anamorphic Horizontal Cinema Lens Streak (only when explicitly enabled)
    if (uLensFlare > 0.5) {
      vec3 streak = vec3(0.0);
      for (int k = -3; k <= 3; k++) {
        streak += texture2D(uBloomTex, clamp(uv + vec2(float(k) * px.x * 24.0, 0.0), 0.002, 0.998)).rgb * 0.14;
      }
      col += streak * mix(vec3(1.0), uTint, 0.45) * 0.35;
    }

    // 5. Clean Filmic Contrast, Natural Color & Gentle Mood Balance
    col = (col - 0.5) * uContrast + 0.5;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, uSaturation);
    col = mix(col, col * (0.96 + uTint * 0.06), 0.08);

    // 6. Dynamic Speed Lines on Dramatic TAPI Moments
    if (uSpeedLines > 0.5) {
      vec2 p = uv - 0.5;
      float ang = atan(p.y, p.x);
      float dist = length(p);
      float rays = pow(max(abs(sin(ang * 28.0 + floor(uTime * 18.0) * 1.7)), 0.0001), 14.0);
      float mask = smoothstep(0.28, 0.55, dist);
      col += mix(vec3(1.0, 0.9, 0.8), uTint, 0.4) * rays * mask * 0.22;
    }

    // 7. Subtle Natural Vignette + Micro Film Grain
    float d = distance(uv, vec2(0.5));
    col *= 1.0 - smoothstep(0.46, 0.98, d) * uVignette;
    float grain = (fract(sin(dot(uv * (uTime + 1.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.008;
    col += grain;

    // 8. Kling-Style GPU Scene Transitions
    if (uTransProgress < 0.999 && uTransType > 0) {
      float tp = clamp(uTransProgress, 0.0, 1.0);
      if (uTransType == 1) {
        vec2 zUv = (uv - 0.5) * mix(0.68, 1.0, tp) + 0.5;
        vec3 prev = texture2D(uPrevTex, clamp((uv - 0.5) * (1.0 - tp * 0.35) + 0.5, 0.0, 1.0)).rgb;
        col = mix(prev, sampleScene(zUv) + bloom * uBloomStrength * 0.8, smoothstep(0.15, 0.85, tp));
      } else if (uTransType == 2) {
        float shift = (1.0 - tp) * 0.42;
        vec3 prev = texture2D(uPrevTex, vec2(fract(uv.x - tp * 0.5), uv.y)).rgb;
        vec3 blurred = (sampleScene(uv + vec2(shift * 0.08, 0.0)) + col + sampleScene(uv - vec2(shift * 0.08, 0.0))) / 3.0;
        col = mix(prev, blurred, smoothstep(0.1, 0.75, tp));
      } else if (uTransType == 3) {
        float flash = max(sin(tp * 3.14159), 0.0001);
        vec3 prev = texture2D(uPrevTex, uv).rgb;
        col = mix(prev, col, step(0.38, tp)) + mix(vec3(1.0), uTint, 0.35) * pow(flash, 2.2) * 0.75;
      } else {
        vec3 prev = texture2D(uPrevTex, uv).rgb;
        col = mix(prev, col, smoothstep(0.0, 1.0, tp));
      }
    }

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export class PostCinemaPipeline {
  constructor(renderer, width, height) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;
    this.supported =
      typeof THREE.WebGLRenderTarget === "function" &&
      typeof THREE.ShaderMaterial === "function" &&
      typeof THREE.OrthographicCamera === "function";

    if (!this.supported) return;

    this.hasDepth = typeof THREE.DepthTexture === "function";
    this.sceneRT = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });
    if (this.hasDepth) {
      try {
        this.sceneRT.depthTexture = new THREE.DepthTexture(width, height);
      } catch {
        this.hasDepth = false;
      }
    }

    this.bloomRT = new THREE.WebGLRenderTarget(Math.max(128, Math.floor(width / 2)), Math.max(128, Math.floor(height / 2)), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });

    this.prevRT = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });

    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.bloomScene = new THREE.Scene();
    this.bloomMat = new THREE.ShaderMaterial({
      uniforms: {
        uSceneTex: { value: this.sceneRT.texture },
        uResolution: { value: new THREE.Vector2(Math.floor(width / 2), Math.floor(height / 2)) }
      },
      vertexShader: QUAD_VERT,
      fragmentShader: BLOOM_EXTRACT_FRAG,
      depthTest: false,
      depthWrite: false
    });
    this.bloomScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bloomMat));

    this.compScene = new THREE.Scene();
    this.compMat = new THREE.ShaderMaterial({
      uniforms: {
        uSceneTex: { value: this.sceneRT.texture },
        uDepthTex: { value: this.hasDepth ? this.sceneRT.depthTexture : this.sceneRT.texture },
        uBloomTex: { value: this.bloomRT.texture },
        uPrevTex: { value: this.prevRT.texture },
        uKeyframeTex: { value: this.sceneRT.texture },
        uHasDepth: { value: this.hasDepth ? 1.0 : 0.0 },
        uUseKeyframe: { value: 0.0 },
        uTime: { value: 0.0 },
        uSceneProgress: { value: 0.0 },
        uTransProgress: { value: 1.0 },
        uTransType: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uNear: { value: 0.1 },
        uFar: { value: 120.0 },
        uFocusDist: { value: 3.4 },
        uDofAperture: { value: 0.45 },
        uMotionVec: { value: new THREE.Vector2(0, 0) },
        uBloomStrength: { value: 0.72 },
        uContrast: { value: 1.08 },
        uSaturation: { value: 1.16 },
        uVignette: { value: 0.28 },
        uTint: { value: new THREE.Color(0x38bdf8) },
        uLensFlare: { value: 0.0 },
        uSpeedLines: { value: 0.0 },
        uChromatic: { value: 0.0 }
      },
      vertexShader: QUAD_VERT,
      fragmentShader: COMPOSITE_FRAG,
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

    const useKeyframe = Boolean(opts.keyframeTex);
    if (!useKeyframe) {
      this.renderer.setRenderTarget(this.sceneRT);
      this.renderer.render(scene, camera);
    }

    // Pass 1: Extract & blur half-res HDR bloom
    this.bloomMat.uniforms.uSceneTex.value = useKeyframe ? opts.keyframeTex : this.sceneRT.texture;
    this.renderer.setRenderTarget(this.bloomRT);
    this.renderer.render(this.bloomScene, this.quadCamera);

    // Pass 2: Composite DOF Bokeh + Motion Blur + Bloom + Filmic LUT + Transition to Canvas
    this.renderer.setRenderTarget(null);
    const u = this.compMat.uniforms;
    u.uTime.value = opts.tSec ?? 0;
    u.uSceneProgress.value = opts.progress ?? 0;
    u.uTransProgress.value = opts.transProgress ?? 1;
    u.uTransType.value = opts.transType ?? 0;
    u.uUseKeyframe.value = useKeyframe ? 1.0 : 0.0;
    if (useKeyframe) u.uKeyframeTex.value = opts.keyframeTex;
    u.uNear.value = camera.near || 0.1;
    u.uFar.value = camera.far || 120.0;
    u.uFocusDist.value = opts.focusDist ?? 3.4;
    u.uDofAperture.value = opts.dofAperture ?? 0.45;
    u.uMotionVec.value.set(opts.motionVecX ?? 0, opts.motionVecY ?? 0);
    u.uBloomStrength.value = opts.bloomStrength ?? 0.72;
    u.uContrast.value = opts.contrast ?? 1.08;
    u.uSaturation.value = opts.saturation ?? 1.16;
    u.uVignette.value = opts.vignette ?? 0.28;
    u.uTint.value.set(opts.tintHex || "#38bdf8");
    u.uLensFlare.value = opts.lensFlare ? 1.0 : 0.0;
    u.uSpeedLines.value = opts.speedLines ? 1.0 : 0.0;
    u.uChromatic.value = opts.chromatic ?? 0.0;

    this.renderer.render(this.compScene, this.quadCamera);
  }
}
