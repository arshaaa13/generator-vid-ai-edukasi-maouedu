// Stage 2: Gemini Generative 3D Asset & Skeletal Rig Synthesizer
// Turns LLM geometric reasoning into custom beveled 3D assemblies (Lathe, Extruded Polygons, 3D Spline Tubes,
// and hierarchical Parent-Child Skeletal Bone Trees) so Gemini can render ANY subject — not just fixed prefabs!

const ALLOWED_SHAPES = new Set([
  "rounded_box",
  "sphere",
  "ellipsoid",
  "capsule",
  "cylinder",
  "cone",
  "torus",
  "octahedron",
  "lathe",
  "extrude_poly",
  "tube_spline"
]);

const ALLOWED_MATERIALS = new Set([
  "metal_chrome",
  "brushed_steel",
  "glass_crystal",
  "water_clear",
  "emissive_neon",
  "matte_clay",
  "glossy_plastic",
  "wood_oak",
  "ceramic",
  "magma_glow",
  "ice_translucent",
  "gold_luxury"
]);

const ALLOWED_BONE_ANIMS = new Set([
  "none",
  "flap_left",
  "flap_right",
  "walk_left",
  "walk_right",
  "wave_chain",
  "spin_y",
  "spin_z",
  "pulse",
  "bob",
  "jaw_talk",
  "head_look",
  "slash"
]);

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanVec3(arr, fb = [0, 0, 0], lim = 5) {
  if (!Array.isArray(arr) || arr.length < 3) return [...fb];
  return [
    clamp(arr[0], -lim, lim, fb[0]),
    clamp(arr[1], -lim, lim, fb[1]),
    clamp(arr[2], -lim, lim, fb[2])
  ];
}

function cleanHex(v, fb = "#38bdf8") {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : fb;
}

function cleanPoints2D(pts, maxPts = 14, lim = 2.0) {
  if (!Array.isArray(pts) || pts.length < 3) return null;
  const out = [];
  for (const p of pts.slice(0, maxPts)) {
    if (Array.isArray(p) && p.length >= 2) {
      out.push([clamp(p[0], -lim, lim, 0), clamp(p[1], -lim, lim, 0)]);
    }
  }
  return out.length >= 3 ? out : null;
}

function cleanPoints3D(pts, maxPts = 12, lim = 3.0) {
  if (!Array.isArray(pts) || pts.length < 2) return null;
  const out = [];
  for (const p of pts.slice(0, maxPts)) {
    if (Array.isArray(p) && p.length >= 3) {
      out.push(cleanVec3(p, [0, 0, 0], lim));
    }
  }
  return out.length >= 2 ? out : null;
}

export function sanitizeCustomRig(rawRig) {
  if (!rawRig || typeof rawRig !== "object" || !Array.isArray(rawRig.parts) || rawRig.parts.length === 0) {
    return null;
  }

  const parts = [];
  const seenIds = new Set();

  for (let i = 0; i < Math.min(18, rawRig.parts.length); i++) {
    const p = rawRig.parts[i];
    if (!p || typeof p !== "object") continue;

    const rawId = String(p.id || `part_${i}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || `part_${i}`;
    const id = seenIds.has(rawId) ? `${rawId}_${i}` : rawId;
    seenIds.add(id);

    const shape = ALLOWED_SHAPES.has(p.shape) ? p.shape : "rounded_box";
    const part = {
      id,
      parentId: typeof p.parentId === "string" && p.parentId !== id ? p.parentId.slice(0, 24) : null,
      shape,
      pos: cleanVec3(p.pos, [0, 0, 0], 3.5),
      rot: cleanVec3(p.rot, [0, 0, 0], 6.3),
      scale: cleanVec3(p.scale, [1, 1, 1], 3.0),
      w: clamp(p.w, 0.04, 2.5, 0.4),
      h: clamp(p.h, 0.04, 2.5, 0.4),
      d: clamp(p.d, 0.04, 2.5, 0.4),
      r: clamp(p.r, 0.02, 1.5, 0.24),
      rTop: clamp(p.rTop, 0.01, 1.5, 0.18),
      rBot: clamp(p.rBot, 0.01, 1.5, 0.24),
      tube: clamp(p.tube, 0.01, 0.4, 0.05),
      depth: clamp(p.depth, 0.02, 0.8, 0.12),
      color: cleanHex(p.color, "#38bdf8"),
      materialType: ALLOWED_MATERIALS.has(p.materialType) ? p.materialType : "glossy_plastic",
      emissiveIntensity: clamp(p.emissiveIntensity, 0, 2.0, 0.0),
      boneAnim: ALLOWED_BONE_ANIMS.has(p.boneAnim) ? p.boneAnim : "none",
      animSpeed: clamp(p.animSpeed, 0.2, 16, 4.0),
      animAmp: clamp(p.animAmp, 0.02, 1.6, 0.35),
      phaseOffset: clamp(p.phaseOffset, -6.3, 6.3, i * 0.45)
    };

    if (shape === "lathe") {
      part.points = cleanPoints2D(p.points, 12, 1.5) || [
        [0.02, -0.35],
        [0.26, -0.25],
        [0.18, 0.05],
        [0.3, 0.28],
        [0.02, 0.38]
      ];
    } else if (shape === "extrude_poly") {
      part.points = cleanPoints2D(p.points, 14, 1.6) || [
        [0, 0.45],
        [0.32, 0.05],
        [0.14, -0.4],
        [-0.14, -0.4],
        [-0.32, 0.05]
      ];
    } else if (shape === "tube_spline") {
      part.points = cleanPoints3D(p.points, 10, 2.4) || [
        [0, 0, 0],
        [0.18, 0.25, -0.2],
        [0.05, 0.55, -0.45]
      ];
    }

    parts.push(part);
  }

  // Prevent invalid parent references or dependency cycles
  const idMap = new Set(parts.map((x) => x.id));
  for (const part of parts) {
    if (part.parentId && !idMap.has(part.parentId)) {
      part.parentId = null;
    }
  }
  const parentLookup = new Map(parts.map((x) => [x.id, x.parentId]));
  for (const part of parts) {
    const visited = new Set([part.id]);
    let cur = part.parentId;
    while (cur) {
      if (visited.has(cur)) {
        part.parentId = null;
        break;
      }
      visited.add(cur);
      cur = parentLookup.get(cur) || null;
    }
  }

  return parts.length >= 2
    ? {
        name: String(rawRig.name || "Gemini Sculpted 3D Hero").slice(0, 48),
        parts
      }
    : null;
}

export function buildCustomRigPromptSpec() {
  return `FITUR SCULPTOR 3D GENERATIF GEMINI ("prefab": "custom_rig"):
Jika topik memiliki makhluk, karakter, benda unik, organ tubuh, senjata, bangunan, atau fenomena yang TIDAK ada di daftar prefab bawaan (misal naga, kucing cyberpunk, samurai, sel darah putih, virus, DNA, kastil, robot mech, monster, pohon magis, jantung manusia, pedang energi, dll.), WAJIB gunakan prefab="custom_rig" dan RAKIT SENDIRI objek 3D artikulatifnya di field "customRig":
{
  "name": "Nama Aktor 3D",
  "parts": [
    {
      "id": "torso",
      "parentId": null,
      "shape": "ellipsoid" | "capsule" | "rounded_box" | "sphere" | "cylinder" | "cone" | "torus" | "octahedron" | "lathe" | "extrude_poly" | "tube_spline",
      "pos": [0, 0, 0], "rot": [0, 0, 0], "scale": [1, 1, 1],
      "w": 0.5, "h": 0.6, "d": 0.4, "r": 0.25, "rTop": 0.15, "rBot": 0.28, "tube": 0.05, "depth": 0.1,
      "points": [[0.02,-0.3],[0.28,-0.1],[0.15,0.3]], // khusus lathe ([[r,y]...]), extrude_poly ([[x,y]...]), tube_spline ([[x,y,z]...])
      "color": "#e11d48", "materialType": "metal_chrome", "emissiveIntensity": 0.3,
      "boneAnim": "none" | "flap_left" | "flap_right" | "walk_left" | "walk_right" | "wave_chain" | "spin_y" | "spin_z" | "pulse" | "bob" | "jaw_talk" | "head_look" | "slash",
      "animSpeed": 4.5, "animAmp": 0.45
    }
  ]
}
Gunakan 5 sampai 12 bagian (parts) yang saling terhubung lewat parentId sehingga sayap mengepak, ekor melambai (wave_chain), kaki berjalan (walk_left/walk_right), atau rahang bergerak secara fisik & alami!`;
}
