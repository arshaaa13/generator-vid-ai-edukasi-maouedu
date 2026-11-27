// Browser-side Pure-JS WSOLA Pitch-Down + Studio Broadcast EQ for Zero-Quota GTTS Fallback
// Converts fallback MP3 chunks into a deep, warm, non-robotic Baritone Male Voice right inside Web Audio!

function applyBiquadFloat32(samples, { b0, b1, b2, a0, a1, a2 }) {
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

function lowShelf(sr, freq, gainDb, slope = 0.75) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sr;
  const cosW = Math.cos(w0);
  const sinW = Math.sin(w0);
  const alpha = (sinW / 2) * Math.sqrt((A + 1 / A) * (1 / slope - 1) + 2);
  const k = 2 * Math.sqrt(A) * alpha;
  return {
    b0: A * ((A + 1) - (A - 1) * cosW + k),
    b1: 2 * A * ((A - 1) - (A + 1) * cosW),
    b2: A * ((A + 1) - (A - 1) * cosW - k),
    a0: (A + 1) + (A - 1) * cosW + k,
    a1: -2 * ((A - 1) + (A + 1) * cosW),
    a2: (A + 1) + (A - 1) * cosW - k
  };
}

function peakingEq(sr, freq, gainDb, q = 1.1) {
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

function wsolaStretch(samples, rate, sr) {
  if (Math.abs(rate - 1) < 0.005 || samples.length < 4096) return samples;
  const winSize = Math.round(0.038 * sr);
  const synHop = Math.round(winSize * 0.5);
  const anaHop = Math.max(64, Math.round(synHop * rate));
  const searchRadius = Math.round(0.009 * sr);

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
      for (let off = minOff; off <= maxOff; off += 3) {
        let c = 0;
        for (let j = 0; j < synHop; j += 3) {
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

function resampleFloat32(samples, ratio) {
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

export function applyClientBaritoneDsp(samples, sampleRate = 24000, pitchSemitones = -5.8, speakingRate = 1.06) {
  if (!samples || samples.length < 256) return samples;
  const pitchFactor = Math.pow(2, pitchSemitones / 12);
  const stretchRate = speakingRate / pitchFactor;

  let s = wsolaStretch(samples, stretchRate, sampleRate);
  s = resampleFloat32(s, pitchFactor);
  s = applyBiquadFloat32(s, lowShelf(sampleRate, 140, 5.2, 0.75));
  s = applyBiquadFloat32(s, peakingEq(sampleRate, 460, -2.8, 1.15));
  s = applyBiquadFloat32(s, peakingEq(sampleRate, 2700, 2.2, 1.05));

  let sumSq = 0;
  for (let i = 0; i < s.length; i++) sumSq += s[i] * s[i];
  const rms = Math.sqrt(sumSq / Math.max(1, s.length)) || 1e-4;
  const gain = Math.min(3.5, Math.pow(10, -15.5 / 20) / rms);
  const ceiling = 0.89;
  for (let i = 0; i < s.length; i++) {
    let v = s[i] * gain;
    if (Math.abs(v) > ceiling) {
      const sign = v < 0 ? -1 : 1;
      v = sign * (ceiling + Math.tanh((Math.abs(v) - ceiling) * 3) * (0.98 - ceiling));
    }
    s[i] = v;
  }
  return s;
}
