// Studio MAPPA 2D Satsuei (撮影) GPU WebGL Post-Compositor
// Pure 2D Anime After-Effects-Grade Compositing Pipeline (ZERO 3D geometry!):
// - Pass 1: Half-res Pro-Mist Halation Bloom (extracts neon signs, cursed energy, anime sparkles)
// - Pass 2: Full-screen Satsuei Compositor (Impact Frames B&W Manga Invert / Black Flash Strobe,
//           Chromatic Aberration Shock Split, Lens Barrel Breathing, Chiaroscuro Color Script, Film Grain, GPU Transitions)

const QUAD_VERT = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const HALATION_FRAG = `
  precision mediump float;
  uniform sampler2D uSourceTex;
  uniform vec2 uRes;
  varying vec2 vUv;

  vec3 brightPass(vec2 uv) {
    vec2 fuv = vec2(clamp(uv.x, 0.002, 0.998), clamp(1.0 - uv.y, 0.002, 0.998));
    vec3 c = texture2D(uSourceTex, fuv).rgb;
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    float soft = smoothstep(0.64, 0.96, lum);
    return c * soft;
  }

  void main() {
    vec2 px = 1.0 / max(uRes, vec2(1.0));
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
      acc += brightPass(vUv + dirs[i] * px * 2.6) * 0.055;
      acc += brightPass(vUv + dirs[i] * px * 6.4) * 0.04;
    }
    gl_FragColor = vec4(acc, 1.0);
  }
`;

const SATSUEI_COMP_FRAG = `
  precision mediump float;
  uniform sampler2D uSourceTex;
  uniform sampler2D uBloomTex;
  uniform sampler2D uPrevTex;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uBloomStrength;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uChromatic;
  uniform float uImpactMode; // 0=normal, 1=Shibuya B&W Manga Negative, 2=Black Flash Crimson-Black
  uniform float uTransProgress;
  uniform float uBarrel;
  uniform vec3 uShadowTint;
  uniform vec3 uAuraTint;
  varying vec2 vUv;

  vec2 flipUv(vec2 uv) {
    return vec2(clamp(uv.x, 0.002, 0.998), clamp(1.0 - uv.y, 0.002, 0.998));
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float r2 = dot(centered, centered);
    // Subtle anime 35mm cinema lens breathing warp
    vec2 uv = 0.5 + centered * (1.0 + uBarrel * r2);

    vec3 col = texture2D(uSourceTex, flipUv(uv)).rgb;

    // 1. Chromatic Aberration (subtle Pro-Mist edge fringe normally; dramatic RGB shock split on Impact!)
    if (uChromatic > 0.0005) {
      vec2 dir = (uv - 0.5) * uChromatic;
      col.r = mix(col.r, texture2D(uSourceTex, flipUv(uv + dir)).r, 0.85);
      col.b = mix(col.b, texture2D(uSourceTex, flipUv(uv - dir)).b, 0.85);
    }

    // 2. Studio MAPPA Pro-Mist Halation Bloom
    vec3 bloom = texture2D(uBloomTex, clamp(uv, 0.002, 0.998)).rgb;
    col += bloom * mix(vec3(1.0), uAuraTint, 0.25) * uBloomStrength * 0.95;

    // 3. Chiaroscuro Color Script Shadow-Tint & Anime Contrast/Vibrance
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * (0.88 + uShadowTint * 0.24), smoothstep(0.45, 0.0, luma) * 0.35);
    col = (col - 0.5) * uContrast + 0.5;
    float l2 = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(l2), col, uSaturation);

    // 4. Authentic Studio MAPPA 2-3 Frame High-Contrast Impact Frame Mode!
    if (uImpactMode > 0.5) {
      vec2 px = 1.0 / max(uRes, vec2(1.0));
      float lx = dot(texture2D(uSourceTex, flipUv(uv + vec2(px.x * 2.0, 0.0))).rgb, vec3(0.3, 0.59, 0.11));
      float ly = dot(texture2D(uSourceTex, flipUv(uv + vec2(0.0, px.y * 2.0))).rgb, vec3(0.3, 0.59, 0.11));
      float edge = clamp((abs(luma - lx) + abs(luma - ly)) * 5.0, 0.0, 1.0);
      float bw = step(0.38, luma + edge * 0.35);

      if (uImpactMode > 1.5) {
        // Black Flash (Kokusen): pitch-black contrast + screaming crimson edges + white core pop!
        vec3 bf = mix(vec3(0.03, 0.01, 0.04), vec3(0.98, 0.1, 0.24), bw);
        bf += vec3(1.0, 0.96, 0.96) * step(0.42, edge);
        col = bf;
      } else {
        // Classic Shibuya B&W Manga Negative Impact Frame!
        col = mix(vec3(0.03), vec3(0.98), 1.0 - bw);
        col = mix(col, vec3(0.02), step(0.45, edge) * 0.65);
      }
    }

    // 5. Soft Anime Satsuei Vignette & 35mm Film Grain
    float d = length(uv - 0.5);
    col *= 1.0 - smoothstep(0.45, 0.98, d) * 0.22;
    float grain = (fract(sin(dot(uv * (uTime + 1.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.011;
    col += grain;

    // 6. Smooth GPU Whip / Cross-Dissolve Scene Transition
    if (uTransProgress < 0.999) {
      float tp = clamp(uTransProgress, 0.0, 1.0);
      vec3 prev = texture2D(uPrevTex, flipUv(uv)).rgb;
      col = mix(prev, col, smoothstep(0.0, 1.0, tp));
    }

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`MAPPA Satsuei shader error: ${log}`);
  }
  return sh;
}

function createProgram(gl, vsSrc, fsSrc) {
  const p = gl.createProgram();
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(`MAPPA Satsuei link error: ${log}`);
  }
  return p;
}

function hexToRgb01(hex = "#38bdf8") {
  const clean = String(hex || "#38bdf8").replace("#", "");
  if (clean.length !== 6) return [0.22, 0.74, 0.97];
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255
  ];
}

export class MappaSatsuei2DWebGL {
  constructor(width = 720, height = 1280) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl = null;
    this.supported = false;

    try {
      const gl =
        this.canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true, alpha: false }) ||
        this.canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true, alpha: false });
      if (!gl) return;
      this.gl = gl;

      this.bloomProg = createProgram(gl, QUAD_VERT, HALATION_FRAG);
      this.compProg = createProgram(gl, QUAD_VERT, SATSUEI_COMP_FRAG);

      this.quadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      this.sourceTex = this.makeTex();
      this.prevTex = this.makeTex();
      this.bloomTex = this.makeTex();
      this.bloomFbo = gl.createFramebuffer();
      this.allocBloomTarget(width, height);
      this.supported = true;
    } catch {
      this.supported = false;
    }
  }

  makeTex() {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  allocBloomTarget(w, h) {
    const gl = this.gl;
    this.bw = Math.max(128, Math.floor(w / 2));
    this.bh = Math.max(128, Math.floor(h / 2));
    gl.bindTexture(gl.TEXTURE_2D, this.bloomTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.bw, this.bh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bloomTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(width, height) {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.supported) this.allocBloomTarget(width, height);
  }

  capturePrevious(sourceCanvas) {
    if (!this.supported || !sourceCanvas) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
  }

  bindQuad(prog) {
    const gl = this.gl;
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  render(sourceCanvas, opts = {}) {
    if (!this.supported) return sourceCanvas;
    const gl = this.gl;

    // Upload current 2D anime frame
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    // Pass 1: Half-res Pro-Mist Halation Bloom
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFbo);
    gl.viewport(0, 0, this.bw, this.bh);
    gl.useProgram(this.bloomProg);
    this.bindQuad(this.bloomProg);
    gl.uniform1i(gl.getUniformLocation(this.bloomProg, "uSourceTex"), 0);
    gl.uniform2f(gl.getUniformLocation(this.bloomProg, "uRes"), this.bw, this.bh);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Pass 2: Full-Screen Studio MAPPA Satsuei Compositor
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.compProg);
    this.bindQuad(this.compProg);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTex);
    gl.uniform1i(gl.getUniformLocation(this.compProg, "uSourceTex"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomTex);
    gl.uniform1i(gl.getUniformLocation(this.compProg, "uBloomTex"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex);
    gl.uniform1i(gl.getUniformLocation(this.compProg, "uPrevTex"), 2);

    const shadowRgb = hexToRgb01(opts.shadowTint || "#1e1b4b");
    const auraRgb = hexToRgb01(opts.auraTint || "#38bdf8");

    gl.uniform2f(gl.getUniformLocation(this.compProg, "uRes"), this.width, this.height);
    gl.uniform1f(gl.getUniformLocation(this.compProg, "uTime"), opts.tSec ?? 0);
    gl.uniform1f(gl.getUniformLocation(this.compProg, "uBloomStrength"), opts.bloomStrength ?? 0.38);
    gl.uniform1f(gl.getUniformLocation(this.compProg, "uContrast"), opts.contrast ?? 1.1);
    gl.uniform1f(gl.getUniformLocation(this.compProg, "uSaturation"), opts.saturation ?? 1.16);
    gl.uniform1f(gl.getUniformLocation(this.compProg, "uChromatic"), opts.chromatic ?? 0.0025);
    gl.uniform1f(gl.getUniformLocation(this.compProg, "uImpactMode"), opts.impactMode ?? 0.0);
    gl.uniform1f(gl.getUniformLocation(this.compProg, "uTransProgress"), opts.transProgress ?? 1.0);
    gl.uniform1f(gl.getUniformLocation(this.compProg, "uBarrel"), opts.barrel ?? 0.03);
    gl.uniform3f(gl.getUniformLocation(this.compProg, "uShadowTint"), shadowRgb[0], shadowRgb[1], shadowRgb[2]);
    gl.uniform3f(gl.getUniformLocation(this.compProg, "uAuraTint"), auraRgb[0], auraRgb[1], auraRgb[2]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this.canvas;
  }
}
