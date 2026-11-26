// Stage 1: Kling-Inspired Spatio-Temporal Shot Planner, Camera Control & Motion Brush Schema
// Gives Gemini explicit Cinematography Vocabulary (Lens mm, Depth-of-Field Bokeh, Multi-Keyframe Splines,
// Temporal Identity Bible, and Motion Brush Vector Force Fields).

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
  if (!raw || typeof raw !== "object") {
    return {
      type: phase === "TAPI" ? "radial_explosion" : phase === "CLIMAX" ? "updraft_thermal" : "wind_gust",
      direction: phase === "TAPI" ? [0, 0.5, 0.8] : [0.7, 0.25, 0],
      center: [0.1, 0.65, 0],
      strength: phase === "TAPI" ? 1.15 : 0.65
    };
  }
  return {
    type: ALLOWED_MOTION_FIELDS.has(raw.type) ? raw.type : "wind_gust",
    direction: cleanVec3(raw.direction, [0.6, 0.2, 0], 2.0),
    center: cleanVec3(raw.center, [0.1, 0.65, 0], 5.0),
    strength: clamp(raw.strength, 0.0, 2.5, 0.8)
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
        scale: clamp(k.scale, 0.2, 2.6, scale)
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
    (startPos[1] + endPos[1]) * 0.5 + 0.05,
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
    lensMm: clamp(rawOptics.lensMm, 20, 105, phase === "TAPI" ? 28 : phase === "CLIMAX" ? 50 : 38),
    dofAperture: clamp(rawOptics.dofAperture, 0.0, 1.0, phase === "CLIMAX" ? 0.58 : 0.42),
    dofFocusDist: clamp(rawOptics.dofFocusDist, 1.5, 10.0, 3.4),
    motionBlur: clamp(rawOptics.motionBlur, 0.0, 1.0, phase === "TAPI" ? 0.45 : 0.18),
    springPhysics: rawOptics.springPhysics !== false
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
KONTROL SINEMATOGRAFI & FISIKA ALA KLING AI (WAJIB DIISI DI SETIAP SCENE!):
1. "optics": { "lensMm": 24..85, "dofAperture": 0.35..0.75 (Bokeh background lembut!), "dofFocusDist": 2.8..4.5, "motionBlur": 0.15..0.55, "springPhysics": true }
2. "motionField" (Kling Motion Brush Vector Field untuk menggerakkan partikel, asap, percikan & atmosfer secara fisik!):
   { "type": "wind_gust" | "vortex_swirl" | "gravity_fall" | "radial_explosion" | "updraft_thermal" | "orbital_pull", "direction": [dx,dy,dz], "center": [x,y,z], "strength": 0.5..1.8 }
3. "keyframes" pada aktor hero (opsional 3-4 titik waktu t=0.0 -> 0.4 -> 0.75 -> 1.0 agar gerakan punya arc parabola, antisipasi, & follow-through fisik, BUKAN sekadar garis lurus!):
   [{ "t": 0.0, "pos": [x,y,z], "rot": [rx,ry,rz], "scale": 1.0 }, ...]
4. "identityBible" di level root JSON: kunci warna palet utama, pencahayaan ciri khas, dan konsistensi hero lintas seluruh scene agar seluruh video terasa seperti 1 film animasi utuh!
${memoryBlock}`;
}
