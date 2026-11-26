// MaouEdu Video Engine — Kling-Style Multi-Keyframe Splines, Spring-Damper Physics & Motion Brush Vector Fields
// Gives every AI-generated scene natural inertia, squash-and-stretch, organic arc trajectories,
// and directional force fields steering particles, smoke, sparks, and weather.

function smoothstep01(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

// Evaluate smooth multi-waypoint keyframe timeline [{t, pos:[x,y,z], rot:[x,y,z], scale}]
export function evaluateKeyframeTrack(keyframes, progress) {
  const p = Math.max(0, Math.min(1, progress));
  if (!Array.isArray(keyframes) || !keyframes.length) {
    return { pos: [0, 0.5, 0], rot: [0, 0, 0], scale: 1.0, vel: [0, 0, 0] };
  }
  if (keyframes.length === 1) {
    return { pos: [...keyframes[0].pos], rot: [...keyframes[0].rot], scale: keyframes[0].scale ?? 1, vel: [0, 0, 0] };
  }

  let idx = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (p >= keyframes[i].t && p <= keyframes[i + 1].t) {
      idx = i;
      break;
    }
    if (p > keyframes[i + 1].t) idx = i;
  }

  const k0 = keyframes[Math.max(0, idx - 1)];
  const k1 = keyframes[idx];
  const k2 = keyframes[Math.min(keyframes.length - 1, idx + 1)];
  const k3 = keyframes[Math.min(keyframes.length - 1, idx + 2)];

  const span = Math.max(0.0001, k2.t - k1.t);
  const rawU = Math.max(0, Math.min(1, (p - k1.t) / span));
  const u = smoothstep01(rawU);

  // Catmull-Rom spline interpolation for smooth organic motion arcs!
  const u2 = u * u;
  const u3 = u2 * u;
  const cr = (p0, p1, p2, p3) =>
    0.5 *
    (2 * p1 +
      (-p0 + p2) * u +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * u3);

  const pos = [
    cr(k0.pos[0], k1.pos[0], k2.pos[0], k3.pos[0]),
    cr(k0.pos[1], k1.pos[1], k2.pos[1], k3.pos[1]),
    cr(k0.pos[2], k1.pos[2], k2.pos[2], k3.pos[2])
  ];

  const rot = [
    k1.rot[0] + (k2.rot[0] - k1.rot[0]) * u,
    k1.rot[1] + (k2.rot[1] - k1.rot[1]) * u,
    k1.rot[2] + (k2.rot[2] - k1.rot[2]) * u
  ];

  const scale = (k1.scale ?? 1) + ((k2.scale ?? 1) - (k1.scale ?? 1)) * u;
  const vel = [
    (k2.pos[0] - k1.pos[0]) / span,
    (k2.pos[1] - k1.pos[1]) / span,
    (k2.pos[2] - k1.pos[2]) / span
  ];

  return { pos, rot, scale, vel };
}

// Compute organic physical squash-and-stretch + lean into velocity (Pixar/Kling weightiness!)
export function computeSpringPhysicsDeform(vel, tSec, seed = 0, enabled = true) {
  if (!enabled) return { scaleMul: [1, 1, 1], tiltX: 0, tiltZ: 0 };
  const speed = Math.hypot(vel[0], vel[1], vel[2]);
  const stretch = Math.min(0.14, speed * 0.045);
  const breathe = Math.sin(tSec * 3.8 + seed) * 0.018;
  const sx = 1 - stretch * 0.45 + breathe;
  const sy = 1 + stretch + Math.abs(vel[1]) * 0.035 - breathe * 0.5;
  const sz = 1 - stretch * 0.45 + breathe;
  const tiltZ = Math.max(-0.22, Math.min(0.22, -vel[0] * 0.14));
  const tiltX = Math.max(-0.18, Math.min(0.18, vel[2] * 0.12));
  return { scaleMul: [sx, sy, sz], tiltX, tiltZ };
}

// Kling Motion Brush Vector Field: steers VFX particles / sparks / steam / debris physically!
export function computeMotionBrushOffset(motionField, basePos, uLife, tSec, seed = 0) {
  if (!motionField || motionField.type === "none") return [0, 0, 0];
  const strength = motionField.strength ?? 0.75;
  const dir = motionField.direction || [0.6, 0.2, 0];
  const center = motionField.center || [0, 0.65, 0];
  const life = Math.max(0, Math.min(1, uLife));

  switch (motionField.type) {
    case "wind_gust": {
      const gust = 0.65 + 0.35 * Math.sin(tSec * 2.4 + seed);
      return [
        dir[0] * life * strength * gust * 0.9,
        dir[1] * life * strength * 0.45 + Math.sin(tSec * 4 + seed) * 0.06,
        dir[2] * life * strength * 0.6
      ];
    }
    case "vortex_swirl": {
      const ang = tSec * 2.8 * strength + seed + life * 4.2;
      const rad = (0.18 + life * 0.55) * strength;
      return [Math.cos(ang) * rad, life * 0.45 * strength, Math.sin(ang) * rad];
    }
    case "gravity_fall": {
      return [
        dir[0] * life * 0.35,
        -0.85 * life * life * strength,
        dir[2] * life * 0.35
      ];
    }
    case "radial_explosion": {
      const dx = basePos[0] - center[0] + Math.cos(seed * 3.1) * 0.25;
      const dy = basePos[1] - center[1] + 0.25;
      const dz = basePos[2] - center[2] + Math.sin(seed * 2.7) * 0.25;
      const len = Math.max(0.15, Math.hypot(dx, dy, dz));
      const burst = Math.pow(life, 0.7) * strength * 0.95;
      return [(dx / len) * burst, (dy / len) * burst, (dz / len) * burst];
    }
    case "updraft_thermal": {
      return [
        Math.sin(tSec * 3.2 + seed) * 0.22 * strength,
        life * 0.95 * strength,
        Math.cos(tSec * 2.7 + seed) * 0.18 * strength
      ];
    }
    case "orbital_pull": {
      const a = tSec * 2.0 * strength + seed;
      const pull = (1 - life) * 0.48 * strength;
      return [Math.cos(a) * pull, Math.sin(a * 1.5) * 0.18, Math.sin(a) * pull];
    }
    default:
      return [0, 0, 0];
  }
}
