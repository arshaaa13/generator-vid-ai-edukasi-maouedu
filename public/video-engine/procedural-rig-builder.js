// MaouEdu Video Engine — Runtime Procedural 3D Mesh & Skeletal Bone Tree Builder
// Compiles Gemini-synthesized customRig specs (Lathe, Extruded Vector Polygons, 3D Spline Tubes,
// Beveled Primitives, and Parent-Child Articulated Bone Hierarchies) into 60 FPS animated Three.js rigs.

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

function createExtrudedPolygonGeo(points2D, depth = 0.12) {
  if (
    typeof THREE.Shape !== "function" ||
    typeof THREE.ExtrudeGeometry !== "function" ||
    !Array.isArray(points2D) ||
    points2D.length < 3
  ) {
    return new THREE.BoxGeometry(0.45, 0.45, depth);
  }
  const shape = new THREE.Shape();
  shape.moveTo(points2D[0][0], points2D[0][1]);
  for (let i = 1; i < points2D.length; i++) {
    shape.lineTo(points2D[i][0], points2D[i][1]);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.02, depth),
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: Math.min(0.035, depth * 0.25),
    bevelThickness: Math.min(0.035, depth * 0.25)
  });
  geo.center?.();
  return geo;
}

function createLatheGeo(points2D) {
  if (typeof THREE.LatheGeometry !== "function" || !Array.isArray(points2D) || points2D.length < 3) {
    return new THREE.CylinderGeometry(0.2, 0.26, 0.65, 20);
  }
  const pts = points2D.map(([r, y]) => new THREE.Vector2(Math.max(0.004, Math.abs(r)), y));
  const geo = new THREE.LatheGeometry(pts, 28);
  geo.computeVertexNormals?.();
  return geo;
}

function createTubeSplineGeo(points3D, radius = 0.05) {
  if (!Array.isArray(points3D) || points3D.length < 2) {
    return new THREE.CylinderGeometry(radius, radius, 0.6, 12);
  }
  const vecs = points3D.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  if (vecs.length === 2) {
    const mid = vecs[0].clone().lerp(vecs[1], 0.5);
    mid.y += 0.12;
    vecs.splice(1, 0, mid);
  }
  const curve = new THREE.CatmullRomCurve3(vecs);
  return new THREE.TubeGeometry(curve, 24, Math.max(0.015, radius), 10, false);
}

function createBevelBoxGeo(w = 0.4, h = 0.4, d = 0.4) {
  if (typeof THREE.Shape !== "function" || typeof THREE.ExtrudeGeometry !== "function") {
    return new THREE.BoxGeometry(w, h, d);
  }
  const r = Math.min(0.05, w * 0.22, h * 0.22, d * 0.22);
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  const s = new THREE.Shape();
  s.moveTo(-hw, -hh - r);
  s.lineTo(hw, -hh - r);
  s.quadraticCurveTo(hw + r, -hh - r, hw + r, -hh);
  s.lineTo(hw + r, hh);
  s.quadraticCurveTo(hw + r, hh + r, hw, hh + r);
  s.lineTo(-hw, hh + r);
  s.quadraticCurveTo(-hw - r, hh + r, -hw - r, hh);
  s.lineTo(-hw - r, -hh);
  s.quadraticCurveTo(-hw - r, -hh - r, -hw, -hh - r);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.02, d - r * 2),
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: r,
    bevelThickness: r
  });
  geo.center?.();
  return geo;
}

function buildPartGeometry(part) {
  switch (part.shape) {
    case "sphere":
    case "ellipsoid":
      return new THREE.SphereGeometry(part.r || 0.25, 22, 18);
    case "capsule":
      return new THREE.CapsuleGeometry(part.r || 0.15, Math.max(0.08, (part.h || 0.45) - (part.r || 0.15) * 2), 10, 16);
    case "cylinder":
      return new THREE.CylinderGeometry(part.rTop ?? part.r ?? 0.2, part.rBot ?? part.r ?? 0.24, part.h || 0.55, 20);
    case "cone":
      return new THREE.ConeGeometry(part.r || 0.25, part.h || 0.55, 18);
    case "torus":
      return new THREE.TorusGeometry(part.r || 0.3, part.tube || 0.05, 12, 28);
    case "octahedron":
      return new THREE.OctahedronGeometry(part.r || 0.28, 0);
    case "lathe":
      return createLatheGeo(part.points);
    case "extrude_poly":
      return createExtrudedPolygonGeo(part.points, part.depth || 0.12);
    case "tube_spline":
      return createTubeSplineGeo(part.points, part.tube || 0.05);
    case "rounded_box":
    default:
      return createBevelBoxGeo(part.w || 0.45, part.h || 0.45, part.d || 0.45);
  }
}

export function buildProceduralCustomRig(customRig, createMaterialFn) {
  const root = new THREE.Group();
  const boneMap = new Map();
  const animatedBones = [];

  if (!customRig?.parts?.length) return root;

  // 1. Instantiate every bone pivot group + PBR mesh
  for (const part of customRig.parts) {
    const boneGroup = new THREE.Group();
    boneGroup.position.set(part.pos[0], part.pos[1], part.pos[2]);
    boneGroup.rotation.set(part.rot[0], part.rot[1], part.rot[2]);
    boneGroup.scale.set(part.scale[0], part.scale[1], part.scale[2]);

    const geo = buildPartGeometry(part);
    const mat = createMaterialFn(part.materialType, part.color, part.emissiveIntensity || 0);
    if (part.shape === "lathe" && mat) {
      mat.side = THREE.DoubleSide;
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = part.materialType !== "glass_crystal" && part.materialType !== "water_clear";
    mesh.receiveShadow = true;
    boneGroup.add(mesh);

    boneMap.set(part.id, { group: boneGroup, part });
    if (part.boneAnim && part.boneAnim !== "none") {
      animatedBones.push({
        group: boneGroup,
        part,
        basePos: [...part.pos],
        baseRot: [...part.rot],
        baseScale: [...part.scale]
      });
    }
  }

  // 2. Link parent-child skeletal hierarchy
  for (const { group, part } of boneMap.values()) {
    if (part.parentId && boneMap.has(part.parentId)) {
      boneMap.get(part.parentId).group.add(group);
    } else {
      root.add(group);
    }
  }

  root.userData.customAnimatedBones = animatedBones;
  return root;
}

export function animateProceduralCustomRig(root, tSec, voiceEnergy = 0) {
  const bones = root?.userData?.customAnimatedBones;
  if (!Array.isArray(bones) || !bones.length) return;

  for (const b of bones) {
    const { group, part, basePos, baseRot, baseScale } = b;
    const spd = part.animSpeed || 4.0;
    const amp = part.animAmp || 0.35;
    const ph = part.phaseOffset || 0;
    const s = Math.sin(tSec * spd + ph);
    const c = Math.cos(tSec * spd + ph);

    switch (part.boneAnim) {
      case "flap_left":
        group.rotation.set(baseRot[0], baseRot[1], baseRot[2] + s * amp);
        break;
      case "flap_right":
        group.rotation.set(baseRot[0], baseRot[1], baseRot[2] - s * amp);
        break;
      case "walk_left":
        group.rotation.set(baseRot[0] + s * amp, baseRot[1], baseRot[2]);
        break;
      case "walk_right":
        group.rotation.set(baseRot[0] - s * amp, baseRot[1], baseRot[2]);
        break;
      case "wave_chain":
        group.rotation.set(baseRot[0] + c * amp * 0.35, baseRot[1] + s * amp, baseRot[2]);
        break;
      case "spin_y":
        group.rotation.set(baseRot[0], baseRot[1] + tSec * spd, baseRot[2]);
        break;
      case "spin_z":
        group.rotation.set(baseRot[0], baseRot[1], baseRot[2] + tSec * spd);
        break;
      case "pulse": {
        const k = 1 + s * amp * 0.35;
        group.scale.set(baseScale[0] * k, baseScale[1] * k, baseScale[2] * k);
        break;
      }
      case "bob":
        group.position.set(basePos[0], basePos[1] + s * amp * 0.35, basePos[2]);
        break;
      case "jaw_talk":
        group.rotation.set(baseRot[0] + Math.abs(s) * amp * 0.4 + voiceEnergy * 0.45, baseRot[1], baseRot[2]);
        break;
      case "head_look":
        group.rotation.set(baseRot[0] + c * amp * 0.25, baseRot[1] + s * amp * 0.55, baseRot[2]);
        break;
      case "slash": {
        const sweep = Math.pow(Math.max(0, Math.sin(tSec * spd * 0.7 + ph)), 3);
        group.rotation.set(baseRot[0] - sweep * amp * 2.2, baseRot[1], baseRot[2] + sweep * amp);
        break;
      }
      default:
        break;
    }
  }
}
