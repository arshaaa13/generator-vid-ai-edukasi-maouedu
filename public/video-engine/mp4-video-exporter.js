// MaouEdu Video Engine — Deterministic Frame-by-Frame H.264 + AAC MP4 Video Exporter
// Uses browser WebCodecs (VideoEncoder + AudioEncoder) + mp4-muxer@5 for zero-dropped-frame
// crisp 720p/1080p MP4 rendering compatible with TikTok, CapCut, Reels, Shorts, & Windows/iOS.

let cachedMp4Muxer = null;

async function loadMp4Muxer() {
  if (cachedMp4Muxer) return cachedMp4Muxer;
  cachedMp4Muxer = await import("https://cdn.jsdelivr.net/npm/mp4-muxer@5/+esm");
  return cachedMp4Muxer;
}

// Mix all scene AudioBuffers sequentially (+ optional gentle BGM) into one clean stereo Float32Array
async function renderTimelineAudioOffline(sceneTimings, sampleRate = 48000, includeBgm = false) {
  const totalSec = sceneTimings.reduce((acc, s) => acc + s.durationSec, 0);
  const totalFrames = Math.max(1, Math.ceil(totalSec * sampleRate));
  const offline = new OfflineAudioContext(2, totalFrames, sampleRate);

  let cursorSec = 0;
  for (const st of sceneTimings) {
    if (st.audioBuffer) {
      const src = offline.createBufferSource();
      src.buffer = st.audioBuffer;

      const hp = offline.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 85;

      const presence = offline.createBiquadFilter();
      presence.type = "peaking";
      presence.frequency.value = 3000;
      presence.Q.value = 0.9;
      presence.gain.value = 2.6;

      src.connect(hp);
      hp.connect(presence);
      presence.connect(offline.destination);
      src.start(cursorSec);
    }
    cursorSec += st.durationSec;
  }

  if (includeBgm) {
    const notes = [110, 130.81, 146.83, 130.81, 98, 110, 164.81, 146.83];
    for (let step = 0, t = 0; t < totalSec - 0.1; step++, t += 0.38) {
      const osc = offline.createOscillator();
      const gain = offline.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(notes[step % notes.length], t);
      gain.gain.setValueAtTime(0.008, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(offline.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    }
  }

  return await offline.startRendering();
}

export async function canExportWebCodecsMp4(width, height, fps = 30) {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") {
    return { supported: false, reason: "WebCodecs tidak tersedia di browser ini" };
  }
  const codecs = ["avc1.4d002a", "avc1.42002a", "avc1.42001f"];
  for (const codec of codecs) {
    try {
      const res = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate: width >= 1080 ? 12_000_000 : 7_500_000,
        framerate: fps
      });
      if (res?.supported) {
        let audioSupported = false;
        if (typeof AudioEncoder !== "undefined" && typeof AudioData !== "undefined") {
          try {
            const aRes = await AudioEncoder.isConfigSupported({
              codec: "mp4a.40.2",
              sampleRate: 48000,
              numberOfChannels: 2,
              bitrate: 128000
            });
            audioSupported = Boolean(aRes?.supported);
          } catch {}
        }
        return { supported: true, videoCodec: codec, audioSupported };
      }
    } catch {}
  }
  return { supported: false, reason: "H.264 hardware/software encoder tidak tersedia" };
}

export async function exportDeterministicMp4Video({
  canvas,
  sceneTimings,
  fps = 30,
  width = 720,
  height = 1280,
  includeBgm = false,
  renderAtTime,
  onProgress
}) {
  // Ensure even dimensions required by H.264
  const encW = width % 2 === 0 ? width : width - 1;
  const encH = height % 2 === 0 ? height : height - 1;
  const cap = await canExportWebCodecsMp4(encW, encH, fps);
  if (!cap.supported) {
    return { ok: false, fallbackRequired: true, reason: cap.reason };
  }

  const { Muxer, ArrayBufferTarget } = await loadMp4Muxer();
  const sampleRate = 48000;
  const hasAnyAudio = sceneTimings.some((s) => Boolean(s.audioBuffer)) || includeBgm;
  const encodeAudio = cap.audioSupported && hasAnyAudio;

  const muxerOpts = {
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width: encW,
      height: encH
    },
    fastStart: "in-memory"
  };
  if (encodeAudio) {
    muxerOpts.audio = {
      codec: "aac",
      sampleRate,
      numberOfChannels: 2
    };
  }

  const muxer = new Muxer(muxerOpts);

  let videoError = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      videoError = e;
    }
  });
  videoEncoder.configure({
    codec: cap.videoCodec,
    width: encW,
    height: encH,
    bitrate: encW >= 1080 ? 12_000_000 : 7_500_000,
    framerate: fps,
    latencyMode: "quality"
  });

  // Offscreen scaling canvas if export resolution differs from preview canvas
  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = encW;
  frameCanvas.height = encH;
  const fctx = frameCanvas.getContext("2d");

  const totalSec = sceneTimings.reduce((acc, s) => acc + s.durationSec, 0);
  const totalFrames = Math.max(1, Math.round(totalSec * fps));

  // Build cumulative scene start times
  let accum = 0;
  const spans = sceneTimings.map((s) => {
    const start = accum;
    accum += s.durationSec;
    return { ...s, startSec: start, endSec: accum };
  });

  // Deterministic frame-by-frame stepping (ZERO dropped frames!)
  for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
    if (videoError) throw videoError;
    const tSec = frameIdx / fps;
    const activeSpan = spans.find((sp) => tSec < sp.endSec) || spans[spans.length - 1];
    const sceneElapsedSec = Math.max(0, tSec - activeSpan.startSec);

    // Draw frame synchronously via studio renderer callback
    renderAtTime({
      sceneIndex: activeSpan.sceneIndex,
      tSec,
      sceneElapsedSec,
      sceneDurationSec: activeSpan.durationSec
    });

    fctx.clearRect(0, 0, encW, encH);
    fctx.drawImage(canvas, 0, 0, encW, encH);

    const timestampUs = Math.round((frameIdx * 1_000_000) / fps);
    const durationUs = Math.round(1_000_000 / fps);
    const vFrame = new VideoFrame(frameCanvas, { timestamp: timestampUs, duration: durationUs });
    videoEncoder.encode(vFrame, { keyFrame: frameIdx % fps === 0 });
    vFrame.close();

    // Prevent encoder queue backpressure
    if (videoEncoder.encodeQueueSize > 8) {
      await videoEncoder.flush();
    }
    if (frameIdx % 6 === 0) {
      onProgress?.(
        Math.round(35 + (frameIdx / totalFrames) * 52),
        `🎬 Merender Frame HD ${frameIdx + 1}/${totalFrames} (H.264 MP4)...`
      );
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  await videoEncoder.flush();
  videoEncoder.close();

  // Offline AAC Audio Mixing & Encoding
  if (encodeAudio) {
    onProgress?.(90, "🎙️ Mencampur & meng-encode audio ElevenLabs (AAC)...");
    const mixedAudio = await renderTimelineAudioOffline(sceneTimings, sampleRate, includeBgm);
    let audioError = null;
    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => {
        audioError = e;
      }
    });
    audioEncoder.configure({
      codec: "mp4a.40.2",
      sampleRate,
      numberOfChannels: 2,
      bitrate: 128000
    });

    const left = mixedAudio.getChannelData(0);
    const right = mixedAudio.numberOfChannels > 1 ? mixedAudio.getChannelData(1) : left;
    const chunkFrames = 1024;
    for (let offset = 0; offset < mixedAudio.length; offset += chunkFrames) {
      if (audioError) throw audioError;
      const n = Math.min(chunkFrames, mixedAudio.length - offset);
      // f32-planar: [L0..Ln-1, R0..Rn-1]
      const planar = new Float32Array(n * 2);
      planar.set(left.subarray(offset, offset + n), 0);
      planar.set(right.subarray(offset, offset + n), n);

      const audioData = new AudioData({
        format: "f32-planar",
        sampleRate,
        numberOfFrames: n,
        numberOfChannels: 2,
        timestamp: Math.round((offset / sampleRate) * 1_000_000),
        data: planar
      });
      audioEncoder.encode(audioData);
      audioData.close();
    }
    await audioEncoder.flush();
    audioEncoder.close();
  }

  onProgress?.(98, "📦 Finalisasi kontainer MP4...");
  muxer.finalize();
  const blob = new Blob([muxer.target.buffer], { type: "video/mp4" });
  return { ok: true, blob, ext: "mp4", width: encW, height: encH, frames: totalFrames, hasAudio: encodeAudio };
}
