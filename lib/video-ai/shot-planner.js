// Stage 1: Clean Pixar/Blender-Cycles Spatio-Temporal Shot Planner & Motion Brush Schema
// Prioritizes crisp educational readability, steady intentional camera framing (inspired by @untabiru5 / @dekodaid),
// physically grounded keyframes, and restrained Motion Brush vector fields only when actual physical VFX occur.

const ALLOWED_MOTION_FIELDS = new Set([
  "none",
  "wind_gust",
  "vortex_swirl",
  "gravity_fall",
  "radial_explosion",
  "updraft_thermal",
  "orbital_pull"
]);

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanVec3(arr, fb = [0, 0, 0], lim = 8) {
  if (!Array.isArray(arr) || arr.length < 3) return [...fb];
  return [
    clamp(arr[0], -lim, lim, fb[0]),
    clamp(arr[1], -lim, lim, fb[1]),
    clamp(arr[2], -lim, lim, fb[2])
  ];
}

export function sanitizeMotionField(raw, phase = "HOOK") {
  if (!raw || typeof raw !== "object" || !ALLOWED_MOTION_FIELDS.has(raw.type)) {
    return {
      type: "none",
      direction: [0, 0.2, 0],
      center: [0, 0.5, 0],
      strength: 0.0
    };
  }
  return {
    type: raw.type,
    direction: cleanVec3(raw.direction, [0.2, 0.35, 0], 1.5),
    center: cleanVec3(raw.center, [0.0, 0.5, 0], 4.0),
    strength: clamp(raw.strength, 0.0, 1.4, raw.type === "none" ? 0.0 : 0.45)
  };
}

export function sanitizeKeyframes(rawKeyframes, startPos, endPos, startRot, endRot, scale = 1.0) {
  if (Array.isArray(rawKeyframes) && rawKeyframes.length >= 2) {
    const cleaned = rawKeyframes
      .slice(0, 6)
      .filter((k) => k && typeof k === "object")
      .map((k, idx, arr) => ({
        t: clamp(k.t, 0, 1, arr.length > 1 ? idx / (arr.length - 1) : 0),
        pos: cleanVec3(k.pos, startPos, 6),
        rot: cleanVec3(k.rot, startRot, 6.3),
        scale: clamp(k.scale, 0.25, 2.2, scale)
      }))
      .sort((a, b) => a.t - b.t);
    if (cleaned.length >= 2) {
      cleaned[0].t = 0;
      cleaned[cleaned.length - 1].t = 1;
      return cleaned;
    }
  }
  const midPos = [
    (startPos[0] + endPos[0]) * 0.5,
    (startPos[1] + endPos[1]) * 0.5,
    (startPos[2] + endPos[2]) * 0.5
  ];
  const midRot = [
    (startRot[0] + endRot[0]) * 0.5,
    (startRot[1] + endRot[1]) * 0.5,
    (startRot[2] + endRot[2]) * 0.5
  ];
  return [
    { t: 0.0, pos: startPos, rot: startRot, scale },
    { t: 0.5, pos: midPos, rot: midRot, scale },
    { t: 1.0, pos: endPos, rot: endRot, scale }
  ];
}

export function sanitizeOptics(rawOptics = {}, phase = "HOOK") {
  return {
    lensMm: clamp(rawOptics.lensMm, 24, 85, 42),
    dofAperture: clamp(rawOptics.dofAperture, 0.0, 0.65, 0.18),
    dofFocusDist: clamp(rawOptics.dofFocusDist, 1.8, 9.0, 3.2),
    motionBlur: clamp(rawOptics.motionBlur, 0.0, 0.4, 0.05),
    springPhysics: rawOptics.springPhysics === true
  };
}

export function buildKlingCinematographyAddendum(styleMemoryHints = []) {
  const memoryBlock =
    Array.isArray(styleMemoryHints) && styleMemoryHints.length
      ? `\nMEMORI GAYA TERBAIK USER (PELAJARI DARI SKOR TERTINGGI SEBELUMNYA):\n${styleMemoryHints
          .slice(0, 4)
          .map((h) => `- ${String(h).slice(0, 180)}`)
          .join("\n")}\n`
      : "";

  return `
PRINSIP SINEMATOGRAFI TERSTRUKTUR & JELAS (GAYA PIXAR DIORAMA / BLENDER CYCLES / @UNTABIRU5 x @DEKODAID):
1. "optics": jaga visual TETAP TAJAM & BERSIH! Gunakan { "lensMm": 38..50, "dofAperture": 0.12..0.28 (latar belakang lembut halus tanpa membuat objek buram!), "dofFocusDist": 2.9..3.8, "motionBlur": 0.04..0.12, "springPhysics": false }.
2. "cameraTrack": gerakan kamera HALUS, TENANG, & TERARAH (misal: establishing 3/4 meja -> perlahan push-in ke mangkuk/gelas -> sudut agak atas 40° supaya penonton bisa melihat isi di dalam mangkuk/panci -> close-up rapi ke detail yang dibahas narasi). Jaga "handheldAmp": 0.002..0.006 (stabil, TIDAK goyang berlebihan kecuali narasi menyebut getaran/gempa!).
3. "motionField": set { "type": "none", "strength": 0 } secara default! Hanya aktifkan ("updraft_thermal" untuk uap panas, "gravity_fall" untuk tuangan/hujan, "vortex_swirl" untuk adukan) jika scene benar-benar punya VFX fisik terkait.
4. "transitionIn": gunakan "cross_dissolve" atau "none" agar perpindahan antar scene terasa rapi & menyatu dalam satu ruangan (hindari flash/whip berlebihan!).
${memoryBlock}`;
}
