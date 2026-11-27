// Pure Node.js ESM 16-bit PCM Studio Broadcast DSP Engine (Zero Native Dependencies)
// Elevates free Gemini 2.5 Flash TTS raw 24kHz PCM into warm, deep, punchy ElevenLabs-caliber vocal audio:
// - Time-preserving WSOLA pitch shift (deepens voice without sluggish slow-motion)
// - 4-stage Biquad Parametric EQ (68Hz high-pass, 145Hz chest warmth shelf, 420Hz boxiness dip, 2.9kHz presence peak)
// - Subtle asymmetric tube/tape saturation + RMS loudness leveling + soft peak limiter (-1 dBFS)

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

export function extractPcmFromWavOrRaw(buf, fallbackSampleRate = 24000) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) {
    return { samples: new Float32Array(0), sampleRate: fallbackSampleRate };
  }
  const isWav = buf.length >= 44 && buf.subarray(0, 4).toString("ascii") === "RIFF";
  let sampleRate = fallbackSampleRate;
  let pcmOffset = 0;
  let pcmLength = buf.length;

  if (isWav) {
    sampleRate = buf.readUInt32LE(24) || fallbackSampleRate;
    let off = 12;
    while (off + 8 <= buf.length) {
      const chunkId = buf.subarray(off, off + 4).toString("ascii");
      const chunkSize = buf.readUInt32LE(off + 4);
      if (chunkId === "data") {
        pcmOffset = off + 8;
        pcmLength = Math.min(chunkSize, buf.length - pcmOffset);
        break;
      }
      off += 8 + chunkSize + (chunkSize % 2);
    }
    if (!pcmOffset) {
      pcmOffset = 44;
      pcmLength = buf.length - 44;
    }
  }

  const count = Math.floor(pcmLength / 2);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    samples[i] = buf.readInt16LE(pcmOffset + i * 2) / 32768;
  }
  return { samples, sampleRate };
}

export function encodeWavFromFloat32(samples, sampleRate = 24000) {
  const n = samples.length;
  const pcmLen = n * 2;
  const out = Buffer.alloc(44 + pcmLen);
  const byteRate = sampleRate * 2;

  out.write("RIFF", 0);
  out.writeUInt32LE(36 + pcmLen, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sampleRate, 24);
  out.writeUInt32LE(byteRate, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(pcmLen, 40);

  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    out.writeInt16LE(v < 0 ? Math.round(v * 32768) : Math.round(v * 32767), 44 + i * 2);
  }
  return out;
}

// Biquad Filter Designer (RBJ Audio EQ Cookbook)
function applyBiquad(samples, { b0, b1, b2, a0, a1, a2 }) {
  const nb0 = b0 / a0;
  const nb1 = b1 / a0;
  const nb2 = b2 / a0;
  const na1 = a1 / a0;
  const na2 = a2 / a0;

  const out = new Float32Array(samples.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i];
    const y0 = nb0 * x0 + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

function highPassCoeffs(sr, freq, q = 0.707) {
  const w0 = (2 * Math.PI * freq) / sr;
  const cosW = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  return {
    b0: (1 + cosW) / 2,
    b1: -(1 + cosW),
    b2: (1 + cosW) / 2,
    a0: 1 + alpha,
    a1: -2 * cosW,
    a2: 1 - alpha
  };
}

function lowShelfCoeffs(sr, freq, gainDb, slope = 0.75) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sr;
  const cosW = Math.cos(w0);
  const sinW = Math.sin(w0);
  const alpha = (sinW / 2) * Math.sqrt((A + 1 / A) * (1 / slope - 1) + 2);
  const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;
  return {
    b0: A * ((A + 1) - (A - 1) * cosW + twoSqrtAAlpha),
    b1: 2 * A * ((A - 1) - (A + 1) * cosW),
    b2: A * ((A + 1) - (A - 1) * cosW - twoSqrtAAlpha),
    a0: (A + 1) + (A - 1) * cosW + twoSqrtAAlpha,
    a1: -2 * ((A - 1) + (A + 1) * cosW),
    a2: (A + 1) + (A - 1) * cosW - twoSqrtAAlpha
  };
}

function peakingEqCoeffs(sr, freq, gainDb, q = 1.1) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sr;
  const cosW = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  return {
    b0: 1 + alpha * A,
    b1: -2 * cosW,
    b2: 1 - alpha * A,
    a0: 1 + alpha / A,
    a1: -2 * cosW,
    a2: 1 - alpha / A
  };
}

// Linear interpolation resample
function resampleLinear(samples, ratio) {
  if (Math.abs(ratio - 1) < 0.002) return samples;
  const outLen = Math.max(1, Math.round(samples.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const s0 = samples[Math.min(samples.length - 1, idx)];
    const s1 = samples[Math.min(samples.length - 1, idx + 1)];
    out[i] = s0 + (s1 - s0) * frac;
  }
  return out;
}

// WSOLA-style overlap-add time stretch to preserve natural speaking tempo after pitch shift
function timeStretchWsola(samples, rate, sampleRate = 24000) {
  if (Math.abs(rate - 1) < 0.004 || samples.length < 4096) return samples;
  const winSize = Math.round(0.036 * sampleRate); // 36ms window (~2.5-3 vocal pitch periods)
  const synHop = Math.round(winSize * 0.5);
  const anaHop = Math.max(64, Math.round(synHop * rate));
  const searchRadius = Math.round(0.008 * sampleRate);

  const win = new Float32Array(winSize);
  for (let i = 0; i < winSize; i++) {
    win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (winSize - 1)));
  }

  const outLen = Math.max(winSize, Math.round(samples.length / rate) + winSize);
  const out = new Float32Array(outLen);
  const norm = new Float32Array(outLen);

  let anaPos = 0;
  let synPos = 0;
  let prevEnd = 0;

  while (anaPos + winSize < samples.length && synPos + winSize < outLen) {
    let bestOffset = 0;
    if (synPos > 0 && prevEnd > 0) {
      let bestCorr = -Infinity;
      const minOff = Math.max(-searchRadius, -anaPos);
      const maxOff = Math.min(searchRadius, samples.length - winSize - anaPos - 1);
      for (let off = minOff; off <= maxOff; off += 2) {
        let c = 0;
        for (let j = 0; j < synHop; j += 2) {
          c += out[synPos + j] * samples[anaPos + off + j];
        }
        if (c > bestCorr) {
          bestCorr = c;
          bestOffset = off;
        }
      }
    }

    const srcIdx = anaPos + bestOffset;
    for (let j = 0; j < winSize; j++) {
      const w = win[j];
      out[synPos + j] += samples[srcIdx + j] * w;
      norm[synPos + j] += w;
    }

    prevEnd = srcIdx + synHop;
    anaPos += anaHop;
    synPos += synHop;
  }

  const finalLen = Math.min(outLen, synPos + synHop);
  const trimmed = new Float32Array(finalLen);
  for (let i = 0; i < finalLen; i++) {
    trimmed[i] = norm[i] > 1e-4 ? out[i] / norm[i] : out[i];
  }
  return trimmed;
}

export function applyPitchAndTempo(samples, pitchSemitones = 0, speakingRate = 1.0, sampleRate = 24000) {
  const semi = clamp(pitchSemitones, -4.0, 4.0, 0);
  const rate = clamp(speakingRate, 0.85, 1.25, 1.0);
  const pitchFactor = Math.pow(2, semi / 12);

  // To lower pitch while keeping desired speakingRate:
  // Step 1: Time-stretch by pitchFactor / rate (so resampling by pitchFactor restores speakingRate)
  const stretchRate = rate / pitchFactor;
  const stretched = Math.abs(stretchRate - 1) > 0.006 ? timeStretchWsola(samples, stretchRate, sampleRate) : samples;
  return resampleLinear(stretched, pitchFactor);
}

export function masterVoiceDsp(wavOrPcmBuf, dsp = {}, sampleRate = 24000) {
  const parsed = extractPcmFromWavOrRaw(wavOrPcmBuf, sampleRate);
  const sr = parsed.sampleRate || 24000;
  let s = parsed.samples;
  if (!s.length) return wavOrPcmBuf;

  const pitchSemitones = clamp(dsp.pitch_semitones ?? dsp.pitchSemitones, -3.5, 2.5, -0.6);
  const speakingRate = clamp(dsp.speaking_rate ?? dsp.speakingRate, 0.88, 1.2, 1.04);
  const bassBoostDb = clamp(dsp.bass_boost_db ?? dsp.bassBoostDb, -3, 8, 4.0);
  const midCutDb = clamp(dsp.mid_cut_db ?? dsp.midCutDb, -6, 3, -2.2);
  const presenceBoostDb = clamp(dsp.presence_boost_db ?? dsp.presenceBoostDb, -3, 6, 3.0);
  const saturationDrive = clamp(dsp.saturation_drive ?? dsp.saturationDrive, 0, 0.45, 0.14);
  const targetRmsDb = clamp(dsp.target_rms_db ?? dsp.targetRmsDb, -22, -11, -15.5);

  // 1. Pitch & tempo calibration (subtle sub-tone weight without sluggish speed)
  if (Math.abs(pitchSemitones) > 0.05 || Math.abs(speakingRate - 1) > 0.01) {
    s = applyPitchAndTempo(s, pitchSemitones, speakingRate, sr);
  }

  // 2. Broadcast EQ Chain
  s = applyBiquad(s, highPassCoeffs(sr, 68, 0.707));
  if (Math.abs(bassBoostDb) > 0.1) s = applyBiquad(s, lowShelfCoeffs(sr, 145, bassBoostDb, 0.75));
  if (Math.abs(midCutDb) > 0.1) s = applyBiquad(s, peakingEqCoeffs(sr, 420, midCutDb, 1.15));
  if (Math.abs(presenceBoostDb) > 0.1) s = applyBiquad(s, peakingEqCoeffs(sr, 2900, presenceBoostDb, 1.05));

  // 3. Subtle tube warmth saturation (adds rich ElevenLabs-like chest harmonics!)
  if (saturationDrive > 0.01) {
    const k = 1 + saturationDrive * 3.2;
    const norm = Math.tanh(k);
    for (let i = 0; i < s.length; i++) {
      // Gentle asymmetric warmth for even + odd harmonics
      const x = s[i] + 0.025 * saturationDrive;
      s[i] = (Math.tanh(k * x) - Math.tanh(k * 0.025 * saturationDrive)) / norm;
    }
  }

  // 4. Broadcast RMS Leveling + Soft Limiter (-1.0 dBFS ceiling so zero clipping)
  let sumSq = 0;
  for (let i = 0; i < s.length; i++) sumSq += s[i] * s[i];
  const rms = Math.sqrt(sumSq / Math.max(1, s.length)) || 1e-4;
  const targetRmsLin = Math.pow(10, targetRmsDb / 20);
  const gain = Math.min(4.2, Math.max(0.5, targetRmsLin / rms));

  const ceiling = 0.891; // -1.0 dBFS
  for (let i = 0; i < s.length; i++) {
    let v = s[i] * gain;
    if (Math.abs(v) > ceiling) {
      const sign = v < 0 ? -1 : 1;
      const excess = Math.abs(v) - ceiling;
      v = sign * (ceiling + Math.tanh(excess * 3.0) * (0.98 - ceiling));
    }
    s[i] = v;
  }

  return encodeWavFromFloat32(s, sr);
}

export function analyzeWavAcoustics(wavOrPcmBuf, sampleRate = 24000) {
  const { samples, sampleRate: sr } = extractPcmFromWavOrRaw(wavOrPcmBuf, sampleRate);
  const n = samples.length;
  if (!n) return { durationSec: 0, rmsDb: -60, peak: 0, medianF0Hz: null };

  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const v = samples[i];
    sumSq += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  const rms = Math.sqrt(sumSq / n);
  const winSize = Math.round(0.05 * sr);
  const minLag = Math.floor(sr / 260);
  const maxLag = Math.floor(sr / 62);
  const f0s = [];

  for (let start = 0; start + winSize < n; start += Math.round(winSize / 2)) {
    let e = 0;
    for (let i = 0; i < winSize; i++) e += samples[start + i] * samples[start + i];
    if (Math.sqrt(e / winSize) < rms * 0.6) continue;

    let bestLag = 0;
    let bestCorr = -1;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let c = 0, na = 0, nb = 0;
      for (let i = 0; i < winSize - lag; i += 2) {
        const a = samples[start + i];
        const b = samples[start + i + lag];
        c += a * b;
        na += a * a;
        nb += b * b;
      }
      const r = c / (Math.sqrt(na * nb) || 1);
      if (r > bestCorr) {
        bestCorr = r;
        bestLag = lag;
      }
    }
    if (bestCorr > 0.45 && bestLag > 0) f0s.push(sr / bestLag);
  }
  f0s.sort((a, b) => a - b);
  return {
    durationSec: Number((n / sr).toFixed(2)),
    rmsDb: Number((20 * Math.log10(rms || 1e-6)).toFixed(1)),
    peak: Number(peak.toFixed(3)),
    medianF0Hz: f0s.length ? Number(f0s[Math.floor(f0s.length / 2)].toFixed(1)) : null
  };
}
