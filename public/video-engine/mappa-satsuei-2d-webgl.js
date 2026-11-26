// True Studio Satsuei (撮影) Multi-Plane GPU WebGL2 Compositor — Broadcast Upgrade v2
// - ZERO scanline/stripe seams: single solid Kyara texture with strict interior opacity guard
// - True 1-Sided Directional Rim Light & Light Wrap (strictly light-facing hemisphere, ZERO uniform sticker aura!)
// - Subtle Bottom-Frame Grounding Vignette anchoring Kyara's lower coat naturally into foreground shadow
// - Snappy 0.15s Anime Transitions (Directional Whip-Cut motion smear & Zoom-Punch Cut — NO slow crossfades!)
// - Separable 2-Pass Pro-Mist Selective Halation, Radial Edge-Only CA, 1-2 Frame Impact Threshold, Filmic S-Curve, 35mm Grain

const PRECISION_HEADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

const QUAD_VERT = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

// Separable 9-tap Gaussian Blur (used for Anamorphic Haikei DoF/LightWrap AND 2-pass Pro-Mist Bloom)
const BLUR_SEPARABLE_FRAG = `${PRECISION_HEADER}
  uniform sampler2D uTex;
  uniform vec2 uDir;
  uniform float uFlipY;
  varying vec2 vUv;

  vec2 sampleUv(vec2 uv) {
    float y = mix(uv.y, 1.0 - uv.y, uFlipY);
    return vec2(clamp(uv.x, 0.001, 0.999), clamp(y, 0.001, 0.999));
  }

  void main() {
    vec4 acc = texture2D(uTex, sampleUv(vUv)) * 0.22702703;
    acc += texture2D(uTex, sampleUv(vUv + uDir * 1.38461538)) * 0.31621622;
    acc += texture2D(uTex, sampleUv(vUv - uDir * 1.38461538)) * 0.31621622;
    acc += texture2D(uTex, sampleUv(vUv + uDir * 3.23076923)) * 0.07027027;
    acc += texture2D(uTex, sampleUv(vUv - uDir * 3.23076923)) * 0.07027027;
    gl_FragColor = acc;
  }
`;

// Selective Bright-Pass Extraction (high threshold so skin/midtones NEVER blow out)
const BLOOM_BRIGHT_FRAG = `${PRECISION_HEADER}
  uniform sampler2D uTex;
  uniform float uThreshold;
  uniform float uFlipY;
  varying vec2 vUv;

  void main() {
    vec2 uv = vec2(clamp(vUv.x, 0.001, 0.999), clamp(mix(vUv.y, 1.0 - vUv.y, uFlipY), 0.001, 0.999));
    vec3 c = texture2D(uTex, uv).rgb;
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float maxCh = max(c.r, max(c.g, c.b));
    float energy = max(lum, maxCh * 0.85);
    float knee = smoothstep(uThreshold, uThreshold + 0.26, energy);
    gl_FragColor = vec4(c * knee, 1.0);
  }
`;

// Pass 2: True 3-Plane Studio Satsuei Compositor (1-Sided Directional Rim & Light Wrap + Bottom Grounding)
const MERGE_3PLANE_FRAG = `${PRECISION_HEADER}
  uniform sampler2D uHaikeiTex;
  uniform sampler2D uHaikeiBlurTex;
  uniform sampler2D uKyaraTex;
  uniform sampler2D uFgTex;
  uniform vec2 uRes;
  uniform float uDofBlur;
  uniform float uApplyChromaKey;
  uniform float uLightWrapStrength;
  uniform float uAmbientStrength;
  uniform float uRimIntensity;
  uniform vec3 uShadowTint;
  uniform vec3 uHighlightTint;
  uniform vec3 uRimTint;
  uniform vec2 uLightDir;
  varying vec2 vUv;

  vec2 flipUv(vec2 uv) {
    return vec2(clamp(uv.x, 0.001, 0.999), clamp(1.0 - uv.y, 0.001, 0.999));
  }

  vec2 rgbToCbCr(vec3 c) {
    float cb = -0.168736 * c.r - 0.331264 * c.g + 0.500000 * c.b;
    float cr =  0.500000 * c.r - 0.418688 * c.g - 0.081312 * c.b;
    return vec2(cb, cr);
  }

  float computeChromaAlpha(vec4 px) {
    if (px.a <= 0.002) return 0.0;
    if (uApplyChromaKey < 0.5) return px.a;

    // Target #00FF00 in YCbCr space = (-0.331264, -0.418688)
    vec2 keyCbCr = vec2(-0.331264, -0.418688);
    vec2 pixCbCr = rgbToCbCr(px.rgb);
    float dist = length(pixCbCr - keyCbCr);

    float maxRB = max(px.r, px.b);
    float gExcess = px.g - maxRB;

    float distMask = smoothstep(0.24, 0.42, dist);
    float greenGuard = 1.0 - smoothstep(0.06, 0.20, gExcess) * smoothstep(0.22, 0.42, px.g);
    float keyAlpha = clamp(max(distMask, greenGuard * 0.85), 0.0, 1.0);

    if (gExcess > 0.18 && px.g > 0.32 && dist < 0.37) {
      keyAlpha = 0.0;
    }
    return px.a * keyAlpha;
  }

  vec3 deSpillAnimeCel(vec3 rgb, float edgeFactor) {
    float maxRB = max(rgb.r, rgb.b);
    float avgRB = 0.5 * (rgb.r + rgb.b);
    float limitG = mix(maxRB, avgRB, 0.25 + edgeFactor * 0.35);
    float gSpill = max(0.0, rgb.g - limitG);
    if (gSpill > 0.001) {
      rgb.g -= gSpill * (0.88 + edgeFactor * 0.12);
      float lumRestore = gSpill * 0.36;
      rgb.r = min(1.0, rgb.r + lumRestore * 0.55);
      rgb.b = min(1.0, rgb.b + lumRestore * 0.62);
    }
    float minRB = min(rgb.r, rgb.b);
    float mSpill = max(0.0, minRB - rgb.g) * edgeFactor * 0.45;
    if (mSpill > 0.01 && (rgb.r + rgb.b) > 0.5 && abs(rgb.r - rgb.b) < 0.12) {
      rgb.r -= mSpill * 0.35;
      rgb.b -= mSpill * 0.35;
      rgb.g += mSpill * 0.3;
    }
    return clamp(rgb, 0.0, 1.0);
  }

  void main() {
    vec2 px = 1.0 / max(uRes, vec2(1.0));
    vec2 fUv = flipUv(vUv);

    // === PLANE 1: HAIKEI WITH SUBTLE ANAMORPHIC DEPTH-OF-FIELD ===
    vec3 haikeiSharp = texture2D(uHaikeiTex, fUv).rgb;
    vec3 haikeiBlur = texture2D(uHaikeiBlurTex, clamp(vUv, 0.001, 0.999)).rgb;
    float dofRamp = clamp(uDofBlur * (0.65 + 0.55 * abs(vUv.y - 0.48)), 0.0, 0.85);
    vec3 comp = mix(haikeiSharp, haikeiBlur, dofRamp);

    // === PLANE 2: KYARA (SOLID 2D CEL — YCbCr KEY + 1-SIDED DIRECTIONAL RIM & LIGHT WRAP) ===
    vec4 rawChar = texture2D(uKyaraTex, fUv);
    float cAlpha = computeChromaAlpha(rawChar);

    if (cAlpha > 0.004) {
      // 4-tap cardinal edge check (smooth outer silhouette matte, strictly zero internal stripe artifacts!)
      float aL = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + vec2(-px.x, 0.0))));
      float aR = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + vec2( px.x, 0.0))));
      float aU = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + vec2(0.0,  px.y))));
      float aD = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + vec2(0.0, -px.y))));
      float minNbr1 = min(min(aL, aR), min(aU, aD));
      float avgNbr1 = 0.25 * (aL + aR + aU + aD);

      float matteAlpha = mix(cAlpha, min(cAlpha, avgNbr1), 0.35 * (1.0 - minNbr1));
      matteAlpha = smoothstep(0.05, 0.95, matteAlpha);

      float edge1px = clamp(1.0 - minNbr1, 0.0, 1.0);
      vec3 charCol = deSpillAnimeCel(rawChar.rgb, edge1px);

      // Protect crisp black G-pen ink lineart from ambient washout
      float charLum = dot(charCol, vec3(0.2126, 0.7152, 0.0722));
      float inkProtect = smoothstep(0.06, 0.22, charLum);

      // 2a. Dynamic Ambient Color Harmonization (15%-25% matching scene Haikei temperature)
      float shadowMask = smoothstep(0.58, 0.08, charLum);
      float highMask = smoothstep(0.42, 0.92, charLum);
      vec3 shadowHarmonized = charCol * mix(vec3(1.0), uShadowTint * 1.16 + vec3(0.10), shadowMask * uAmbientStrength);
      vec3 fullHarmonized = mix(
        shadowHarmonized,
        shadowHarmonized * mix(vec3(1.0), uHighlightTint * 1.10, 0.62) + uHighlightTint * 0.05,
        highMask * uAmbientStrength * 0.80
      );
      charCol = mix(charCol, fullHarmonized, inkProtect);

      // 2b. TRUE 1-SIDED DIRECTIONAL ANIME RIM LIGHT (ONLY on light-facing silhouette side!)
      vec2 lDir = normalize(uLightDir + vec2(0.0001));
      vec2 lPerp = vec2(-lDir.y, lDir.x);
      float alphaLight1 = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + lDir * px * 2.2)));
      float alphaLight2 = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + lDir * px * 4.5)));
      float alphaSideA  = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + (lDir * 0.8 + lPerp * 0.6) * px * 3.2)));
      float alphaSideB  = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + (lDir * 0.8 - lPerp * 0.6) * px * 3.2)));

      // Crisp 1-sided hard-cel anime rim strip (zero glow on opposite shadow side!)
      float facingEdge = 1.0 - min(min(alphaLight1, alphaLight2), min(alphaSideA, alphaSideB));
      // Fade rim smoothly near bottom edge so lower coat never gets a horizontal glowing bottom bar
      float bottomMask = smoothstep(0.03, 0.14, vUv.y);
      float dirRimMask = clamp(matteAlpha * facingEdge * bottomMask, 0.0, 1.0);
      vec3 rimCol = uRimTint * dirRimMask * uRimIntensity * 0.62;
      charCol = 1.0 - (1.0 - charCol) * (1.0 - clamp(rimCol, 0.0, 0.80));

      // 2c. DIRECTIONAL REAL-TIME LIGHT WRAP (3-6px blurred Haikei bleed biased strictly toward key light!)
      float wOut1 = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + lDir * px * 3.5)));
      float wOut2 = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + (lDir * 0.72 + lPerp * 0.68) * px * 5.2)));
      float wOut3 = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + (lDir * 0.72 - lPerp * 0.68) * px * 5.2)));
      float wOut4 = computeChromaAlpha(texture2D(uKyaraTex, flipUv(vUv + lDir * px * 6.2)));

      float wrapBand = clamp(((1.0 - wOut1) * 0.55 + (1.0 - min(wOut2, wOut3)) * 0.35 + (1.0 - wOut4) * 0.25) * bottomMask, 0.0, 1.0);
      float bgLum = dot(haikeiBlur, vec3(0.2126, 0.7152, 0.0722));
      float bgBright = smoothstep(0.16, 0.92, bgLum);
      vec3 wrapLight = (haikeiBlur * (0.42 + 0.82 * bgBright)) * wrapBand * uLightWrapStrength;
      charCol = 1.0 - (1.0 - charCol) * (1.0 - clamp(wrapLight, 0.0, 0.72));

      // 2d. Subtle Bottom-Frame Grounding Vignette (anchors lower coat cleanly into shadow — NO abrupt waist fade!)
      float groundDark = mix(0.62, 1.0, smoothstep(0.0, 0.16, vUv.y));
      charCol *= groundDark;

      comp = mix(comp, charCol, matteAlpha);
    }

    // === PLANE 3: FOREGROUND ATMOSPHERIC LAYER (DUST, EMBERS, LIGHT SHAFTS, DARK-GLASS HUD IN FRONT OF KYARA) ===
    vec4 fg = texture2D(uFgTex, fUv);
    if (fg.a > 0.002) {
      comp = mix(comp, fg.rgb, clamp(fg.a, 0.0, 1.0));
    }

    gl_FragColor = vec4(clamp(comp, 0.0, 1.0), 1.0);
  }
`;

// Pass 4: Broadcast Satsuei Finish + Snappy 0.15s Whip-Cut / Zoom-Punch Transitions
const SATSUEI_FINISH_FRAG = `${PRECISION_HEADER}
  uniform sampler2D uCompTex;
  uniform sampler2D uBloomTex;
  uniform sampler2D uPrevTex;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uBloomStrength;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uShadowCrush;
  uniform float uChromatic;
  uniform float uImpactMode;      // 0 = normal, 1 = B&W Manga Negative, 2 = Black Flash Crimson-Black
  uniform float uImpactIntensity; // 0.0 .. 1.0
  uniform float uTransProgress;   // 0.0 .. 1.0 (snappy 0.15s window!)
  uniform float uTransStyle;      // 0 = quick cut, 1 = directional whip-cut smear, 2 = zoom-punch cut
  uniform float uBarrel;
  uniform vec3 uShadowTint;
  uniform vec3 uAuraTint;
  uniform float uFlipCompY;
  varying vec2 vUv;

  vec2 toTexUv(vec2 uv, float flipFlag) {
    return vec2(clamp(uv.x, 0.001, 0.999), clamp(mix(uv.y, 1.0 - uv.y, flipFlag), 0.001, 0.999));
  }

  float filmHash(vec2 p, float tSeed) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031 + tSeed * 0.0713);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec3 filmicSCurve(vec3 col, float contrast, float shadowCrush) {
    vec3 crushed = max(col - vec3(shadowCrush * 0.16), vec3(0.0)) / max(1.0 - shadowCrush * 0.16, 0.5);
    vec3 sCurve = crushed * crushed * (3.0 - 2.0 * crushed);
    float sAmount = clamp((contrast - 1.0) * 1.4 + shadowCrush * 0.65, 0.0, 0.65);
    vec3 outCol = mix(crushed, sCurve, sAmount);
    return clamp((outCol - 0.5) * mix(1.0, contrast, 0.55) + 0.5, 0.0, 1.0);
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float r2 = dot(centered, centered);
    float rad = length(centered);
    vec2 uv = 0.5 + centered * (1.0 + uBarrel * r2);

    vec3 col = texture2D(uCompTex, toTexUv(uv, uFlipCompY)).rgb;

    // 1. Snappy 0.15s Anime Scene Transition (Whip-Cut motion smear OR Zoom-Punch Cut — NO slow crossfade!)
    if (uTransProgress < 0.999) {
      float tp = clamp(uTransProgress, 0.0, 1.0);
      float peak = sin(tp * 3.14159265); // peaks sharply at mid-transition (0.075s)
      if (uTransStyle > 1.5) {
        // Zoom-Punch Cut: rapid radial zoom in on outgoing -> punch snap into incoming!
        float zOut = 1.0 - tp * 0.24;
        float zIn  = 1.0 + (1.0 - tp) * 0.18;
        vec3 prevZ = texture2D(uPrevTex, toTexUv(0.5 + (uv - 0.5) * zOut, 1.0)).rgb;
        vec3 nextZ = texture2D(uCompTex, toTexUv(0.5 + (uv - 0.5) * zIn, uFlipCompY)).rgb;
        vec3 nextBlur = texture2D(uCompTex, toTexUv(0.5 + (uv - 0.5) * (zIn - 0.04 * peak), uFlipCompY)).rgb;
        col = mix(prevZ, mix(nextZ, nextBlur, peak * 0.55), smoothstep(0.28, 0.68, tp));
        col += vec3(0.18) * peak * peak;
      } else if (uTransStyle > 0.5) {
        // Directional Whip-Cut: crisp horizontal slide + 4-tap motion blur smear
        float slide = smoothstep(0.0, 1.0, tp);
        float shiftX = uv.x + slide;
        vec3 whipCol;
        float blurAmp = 0.045 * peak;
        if (shiftX < 1.0) {
          vec2 pUv = vec2(shiftX, uv.y);
          whipCol = texture2D(uPrevTex, toTexUv(pUv, 1.0)).rgb * 0.5
                  + texture2D(uPrevTex, toTexUv(pUv - vec2(blurAmp, 0.0), 1.0)).rgb * 0.3
                  + texture2D(uPrevTex, toTexUv(pUv - vec2(blurAmp * 2.0, 0.0), 1.0)).rgb * 0.2;
        } else {
          vec2 nUv = vec2(shiftX - 1.0, uv.y);
          whipCol = texture2D(uCompTex, toTexUv(nUv, uFlipCompY)).rgb * 0.5
                  + texture2D(uCompTex, toTexUv(nUv + vec2(blurAmp, 0.0), uFlipCompY)).rgb * 0.3
                  + texture2D(uCompTex, toTexUv(nUv + vec2(blurAmp * 2.0, 0.0), uFlipCompY)).rgb * 0.2;
        }
        col = whipCol;
      } else {
        vec3 prev = texture2D(uPrevTex, toTexUv(uv, 1.0)).rgb;
        col = mix(prev, col, smoothstep(0.15, 0.85, tp));
      }
    }

    // 2. Radial Impact Motion Blur during Sakuga hit / Impact Frame
    if (uImpactIntensity > 0.02) {
      vec3 rAcc = col * 0.36;
      float rStep = 0.026 * uImpactIntensity;
      rAcc += texture2D(uCompTex, toTexUv(0.5 + (uv - 0.5) * (1.0 - rStep * 1.0), uFlipCompY)).rgb * 0.22;
      rAcc += texture2D(uCompTex, toTexUv(0.5 + (uv - 0.5) * (1.0 - rStep * 2.0), uFlipCompY)).rgb * 0.18;
      rAcc += texture2D(uCompTex, toTexUv(0.5 + (uv - 0.5) * (1.0 - rStep * 3.0), uFlipCompY)).rgb * 0.14;
      rAcc += texture2D(uCompTex, toTexUv(0.5 + (uv - 0.5) * (1.0 - rStep * 4.0), uFlipCompY)).rgb * 0.10;
      col = mix(col, rAcc, clamp(uImpactIntensity * 0.85, 0.0, 0.85));
    }

    // 3. Radial EDGE-ONLY Chromatic Aberration (9:16 borders only — face & typography stay razor sharp!)
    if (uChromatic > 0.0002) {
      float borderMask = smoothstep(0.26, 0.74, rad);
      float caPower = uChromatic * mix(borderMask * borderMask, 1.0, uImpactIntensity * 0.55);
      vec2 dir = centered * caPower * 1.8;
      float rCh = texture2D(uCompTex, toTexUv(uv + dir, uFlipCompY)).r;
      float bCh = texture2D(uCompTex, toTexUv(uv - dir, uFlipCompY)).b;
      col.r = mix(col.r, rCh, 0.86);
      col.b = mix(col.b, bCh, 0.86);
    }

    // 4. Calibrated Pro-Mist Selective Halation Bloom (screen-blend prevents blown-out faces!)
    vec3 bloom = texture2D(uBloomTex, clamp(uv, 0.001, 0.999)).rgb;
    vec3 bloomTerm = bloom * mix(vec3(1.0), uAuraTint, 0.20) * uBloomStrength * 0.88;
    col = 1.0 - (1.0 - col) * (1.0 - clamp(bloomTerm, 0.0, 0.76));

    // 5. Chiaroscuro Color Script Shadow-Tint + Filmic S-Curve Crushed Blacks + Vibrance
    float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(col, col * (0.90 + uShadowTint * 0.22), smoothstep(0.42, 0.0, luma) * 0.26);
    col = filmicSCurve(col, uContrast, uShadowCrush);
    float l2 = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(l2), col, uSaturation);

    // 6. Crisp 1-2 Frame High-Contrast Studio Impact Frame Mode
    if (uImpactMode > 0.5 && uImpactIntensity > 0.05) {
      vec2 px = 1.0 / max(uRes, vec2(1.0));
      float lx = dot(texture2D(uCompTex, toTexUv(uv + vec2(px.x * 2.0, 0.0), uFlipCompY)).rgb, vec3(0.3, 0.59, 0.11));
      float ly = dot(texture2D(uCompTex, toTexUv(uv + vec2(0.0, px.y * 2.0), uFlipCompY)).rgb, vec3(0.3, 0.59, 0.11));
      float edge = clamp((abs(luma - lx) + abs(luma - ly)) * 5.4, 0.0, 1.0);
      float bw = step(0.36, luma + edge * 0.34);

      vec3 impCol;
      if (uImpactMode > 1.5) {
        impCol = mix(vec3(0.02, 0.008, 0.03), vec3(0.98, 0.08, 0.22), bw);
        impCol += vec3(1.0, 0.96, 0.96) * step(0.40, edge);
      } else {
        impCol = mix(vec3(0.02), vec3(0.98), 1.0 - bw);
        impCol = mix(impCol, vec3(0.015), step(0.42, edge) * 0.72);
      }
      col = mix(col, impCol, clamp(uImpactIntensity, 0.0, 1.0));
    }

    // 7. Soft Cinematic Vignette + Temporal 35mm Fine Film Grain
    col *= 1.0 - smoothstep(0.46, 0.98, rad) * 0.20;
    float frameTick = floor(mod(uTime, 120.0) * 24.0);
    float n = filmHash(gl_FragCoord.xy, frameTick) - 0.5;
    float grainMask = smoothstep(0.04, 0.25, l2) * (1.0 - smoothstep(0.75, 0.98, l2) * 0.65);
    col += n * 0.018 * grainMask;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

function compileShader(gl, type, src, label) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) || "Unknown shader error";
    gl.deleteShader(sh);
    throw new Error(`MAPPA Satsuei shader [${label}] error: ${log}`);
  }
  return sh;
}

function createCachedProgram(gl, vsSrc, fsSrc, label, uniformNames = []) {
  const p = gl.createProgram();
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc, `${label}:vert`);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc, `${label}:frag`);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p) || "Unknown link error";
    gl.deleteProgram(p);
    throw new Error(`MAPPA Satsuei program [${label}] link error: ${log}`);
  }
  const uniforms = {};
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(p, name);
  }
  const aPos = gl.getAttribLocation(p, "aPos");
  return { program: p, uniforms, aPos };
}

export function hexToRgb01(hex = "#38bdf8") {
  if (Array.isArray(hex) && hex.length >= 3) {
    return [Number(hex[0]) || 0, Number(hex[1]) || 0, Number(hex[2]) || 0];
  }
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
    this.isWebGL2 = false;
    this.supported = false;
    this.lastError = null;

    try {
      let gl = this.canvas.getContext("webgl2", {
        antialias: false,
        preserveDrawingBuffer: true,
        alpha: false,
        powerPreference: "high-performance"
      });
      if (gl) {
        this.isWebGL2 = true;
      } else {
        gl = this.canvas.getContext("webgl", {
          antialias: false,
          preserveDrawingBuffer: true,
          alpha: false
        });
      }
      if (!gl) {
        this.lastError = "WebGL context unavailable";
        console.warn("[MAPPA Satsuei] WebGL context unavailable; falling back to Canvas 2D.");
        return;
      }
      this.gl = gl;

      this.blurProg = createCachedProgram(gl, QUAD_VERT, BLUR_SEPARABLE_FRAG, "blur_separable", [
        "uTex",
        "uDir",
        "uFlipY"
      ]);
      this.brightProg = createCachedProgram(gl, QUAD_VERT, BLOOM_BRIGHT_FRAG, "bloom_bright", [
        "uTex",
        "uThreshold",
        "uFlipY"
      ]);
      this.mergeProg = createCachedProgram(gl, QUAD_VERT, MERGE_3PLANE_FRAG, "merge_3plane", [
        "uHaikeiTex",
        "uHaikeiBlurTex",
        "uKyaraTex",
        "uFgTex",
        "uRes",
        "uDofBlur",
        "uApplyChromaKey",
        "uLightWrapStrength",
        "uAmbientStrength",
        "uRimIntensity",
        "uShadowTint",
        "uHighlightTint",
        "uRimTint",
        "uLightDir"
      ]);
      this.finishProg = createCachedProgram(gl, QUAD_VERT, SATSUEI_FINISH_FRAG, "satsuei_finish", [
        "uCompTex",
        "uBloomTex",
        "uPrevTex",
        "uRes",
        "uTime",
        "uBloomStrength",
        "uContrast",
        "uSaturation",
        "uShadowCrush",
        "uChromatic",
        "uImpactMode",
        "uImpactIntensity",
        "uTransProgress",
        "uTransStyle",
        "uBarrel",
        "uShadowTint",
        "uAuraTint",
        "uFlipCompY"
      ]);

      this.quadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      this.haikeiTex = this.makeTex();
      this.kyaraTex = this.makeTex();
      this.fgTex = this.makeTex();
      this.prevTex = this.makeTex();

      this.haikeiBlurTexA = this.makeTex();
      this.haikeiBlurTexB = this.makeTex();
      this.compTex = this.makeTex();
      this.bloomTexA = this.makeTex();
      this.bloomTexB = this.makeTex();

      this.haikeiBlurFboA = gl.createFramebuffer();
      this.haikeiBlurFboB = gl.createFramebuffer();
      this.compFbo = gl.createFramebuffer();
      this.bloomFboA = gl.createFramebuffer();
      this.bloomFboB = gl.createFramebuffer();

      this.allocTargets(width, height);
      this.supported = true;
    } catch (err) {
      this.lastError = err?.message || String(err);
      console.error("[MAPPA Satsuei] Initialization failed:", err);
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

  attachTarget(fbo, tex, w, h, label) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Incomplete FBO [${label}]: 0x${status.toString(16)}`);
    }
  }

  allocTargets(w, h) {
    const gl = this.gl;
    this.bw = Math.max(128, Math.floor(w / 2));
    this.bh = Math.max(128, Math.floor(h / 2));
    this.attachTarget(this.haikeiBlurFboA, this.haikeiBlurTexA, this.bw, this.bh, "haikeiBlurA");
    this.attachTarget(this.haikeiBlurFboB, this.haikeiBlurTexB, this.bw, this.bh, "haikeiBlurB");
    this.attachTarget(this.compFbo, this.compTex, w, h, "comp3Plane");
    this.attachTarget(this.bloomFboA, this.bloomTexA, this.bw, this.bh, "bloomA");
    this.attachTarget(this.bloomFboB, this.bloomTexB, this.bw, this.bh, "bloomB");
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(width, height) {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.supported) {
      try {
        this.allocTargets(width, height);
      } catch (err) {
        this.lastError = err?.message || String(err);
        console.error("[MAPPA Satsuei] Resize FBO error:", err);
        this.supported = false;
      }
    }
  }

  capturePrevious(sourceCanvas) {
    if (!this.supported || !sourceCanvas) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
  }

  bindQuad(progEntry) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.enableVertexAttribArray(progEntry.aPos);
    gl.vertexAttribPointer(progEntry.aPos, 2, gl.FLOAT, false, 0, 0);
  }

  runSeparableBlur(srcTex, fboA, texA, fboB, w, h, spreadX, spreadY, flipFirstY = 0.0) {
    const gl = this.gl;
    const p = this.blurProg;
    gl.useProgram(p.program);
    this.bindQuad(p);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
    gl.viewport(0, 0, w, h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    gl.uniform1i(p.uniforms.uTex, 0);
    gl.uniform2f(p.uniforms.uDir, spreadX / w, 0.0);
    gl.uniform1f(p.uniforms.uFlipY, flipFirstY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    gl.viewport(0, 0, w, h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(p.uniforms.uTex, 0);
    gl.uniform2f(p.uniforms.uDir, 0.0, spreadY / h);
    gl.uniform1f(p.uniforms.uFlipY, 0.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  runBloomAndFinish(compTex, flipCompY, opts = {}) {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFboB);
    gl.viewport(0, 0, this.bw, this.bh);
    gl.useProgram(this.brightProg.program);
    this.bindQuad(this.brightProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, compTex);
    gl.uniform1i(this.brightProg.uniforms.uTex, 0);
    gl.uniform1f(this.brightProg.uniforms.uThreshold, opts.bloomThreshold ?? 0.70);
    gl.uniform1f(this.brightProg.uniforms.uFlipY, flipCompY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.runSeparableBlur(this.bloomTexB, this.bloomFboA, this.bloomTexA, this.bloomFboB, this.bw, this.bh, 2.35, 2.15, 0.0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    const f = this.finishProg;
    gl.useProgram(f.program);
    this.bindQuad(f);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, compTex);
    gl.uniform1i(f.uniforms.uCompTex, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomTexB);
    gl.uniform1i(f.uniforms.uBloomTex, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex);
    gl.uniform1i(f.uniforms.uPrevTex, 2);

    const shadowRgb = hexToRgb01(opts.shadowTint || "#1e1b4b");
    const auraRgb = hexToRgb01(opts.auraTint || "#38bdf8");
    const transStyleNum =
      opts.transStyle === "zoom_punch" ? 2.0 : opts.transStyle === "whip_cut" ? 1.0 : Number(opts.transStyle ?? 1.0);

    gl.uniform2f(f.uniforms.uRes, this.width, this.height);
    gl.uniform1f(f.uniforms.uTime, opts.tSec ?? 0);
    gl.uniform1f(f.uniforms.uBloomStrength, opts.bloomStrength ?? 0.30);
    gl.uniform1f(f.uniforms.uContrast, opts.contrast ?? 1.1);
    gl.uniform1f(f.uniforms.uSaturation, opts.saturation ?? 1.14);
    gl.uniform1f(f.uniforms.uShadowCrush, opts.shadowCrush ?? 0.14);
    gl.uniform1f(f.uniforms.uChromatic, opts.chromatic ?? 0.0022);
    gl.uniform1f(f.uniforms.uImpactMode, opts.impactMode ?? 0.0);
    gl.uniform1f(f.uniforms.uImpactIntensity, opts.impactIntensity ?? (opts.impactMode > 0.5 ? 1.0 : 0.0));
    gl.uniform1f(f.uniforms.uTransProgress, opts.transProgress ?? 1.0);
    gl.uniform1f(f.uniforms.uTransStyle, transStyleNum);
    gl.uniform1f(f.uniforms.uBarrel, opts.barrel ?? 0.02);
    gl.uniform3f(f.uniforms.uShadowTint, shadowRgb[0], shadowRgb[1], shadowRgb[2]);
    gl.uniform3f(f.uniforms.uAuraTint, auraRgb[0], auraRgb[1], auraRgb[2]);
    gl.uniform1f(f.uniforms.uFlipCompY, flipCompY);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this.canvas;
  }

  renderMultiPlane({ haikeiCanvas, kyaraCanvas, fgCanvas, applyChromaKey = true }, opts = {}) {
    if (!this.supported) return haikeiCanvas;
    const gl = this.gl;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.haikeiTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, haikeiCanvas);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.kyaraTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, kyaraCanvas);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.fgTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fgCanvas);

    const blurSpread = 1.65 + (opts.dofBlur ?? 0.28) * 3.2;
    this.runSeparableBlur(
      this.haikeiTex,
      this.haikeiBlurFboA,
      this.haikeiBlurTexA,
      this.haikeiBlurFboB,
      this.bw,
      this.bh,
      blurSpread * 1.35,
      blurSpread * 0.85,
      1.0
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.compFbo);
    gl.viewport(0, 0, this.width, this.height);
    const m = this.mergeProg;
    gl.useProgram(m.program);
    this.bindQuad(m);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.haikeiTex);
    gl.uniform1i(m.uniforms.uHaikeiTex, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.haikeiBlurTexB);
    gl.uniform1i(m.uniforms.uHaikeiBlurTex, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.kyaraTex);
    gl.uniform1i(m.uniforms.uKyaraTex, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.fgTex);
    gl.uniform1i(m.uniforms.uFgTex, 3);

    const shadowRgb = hexToRgb01(opts.shadowTint || "#1e1b4b");
    const highRgb = hexToRgb01(opts.highlightTint || "#e2e8f0");
    const rimRgb = hexToRgb01(opts.rimTint || opts.auraTint || "#38bdf8");
    const lightDir = Array.isArray(opts.lightDir) ? opts.lightDir : [0.74, 0.67];

    gl.uniform2f(m.uniforms.uRes, this.width, this.height);
    gl.uniform1f(m.uniforms.uDofBlur, opts.dofBlur ?? 0.28);
    gl.uniform1f(m.uniforms.uApplyChromaKey, applyChromaKey ? 1.0 : 0.0);
    gl.uniform1f(m.uniforms.uLightWrapStrength, opts.lightWrapStrength ?? 0.44);
    gl.uniform1f(m.uniforms.uAmbientStrength, opts.ambientHarmonization ?? 0.22);
    gl.uniform1f(m.uniforms.uRimIntensity, opts.rimIntensity ?? 0.80);
    gl.uniform3f(m.uniforms.uShadowTint, shadowRgb[0], shadowRgb[1], shadowRgb[2]);
    gl.uniform3f(m.uniforms.uHighlightTint, highRgb[0], highRgb[1], highRgb[2]);
    gl.uniform3f(m.uniforms.uRimTint, rimRgb[0], rimRgb[1], rimRgb[2]);
    gl.uniform2f(m.uniforms.uLightDir, lightDir[0], lightDir[1]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return this.runBloomAndFinish(this.compTex, 0.0, opts);
  }

  render(sourceCanvas, opts = {}) {
    if (!this.supported) return sourceCanvas;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.haikeiTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
    return this.runBloomAndFinish(this.haikeiTex, 1.0, opts);
  }
}
