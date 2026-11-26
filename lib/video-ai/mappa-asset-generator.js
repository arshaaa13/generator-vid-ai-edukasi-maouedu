// Dual-DNA Art Lock Multimodal Image Pipeline — Strictly Locked to mc_default.jpg!
// - Loads raw bytes of /public/style-anchors/mc_default.jpg (fallback: /public/assets/mc_default.jpg)
//   as the MANDATORY inlineData (image/jpeg) Reference Anchor for EVERY Kyara / Host multimodal call.
// - Loads /public/style-anchors/haikei_style_ref.png for gritty hand-painted Haikei & Full-Screen 9:16 Anime Cutaways.
// - Copyright-safe technical art terminology ONLY (ZERO copyrighted studio or anime franchise titles).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectGeminiKeys } from "./gemini-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STYLE_ANCHORS_DIR = path.resolve(__dirname, "../../public/style-anchors");
const ASSETS_DIR = path.resolve(__dirname, "../../public/assets");

export const DUAL_DNA_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image"
];

export const STYLE_ANCHOR_FILES = {
  mcDefault: { filename: "mc_default.jpg", mimeType: "image/jpeg", fallbackDir: ASSETS_DIR },
  haikei: { filename: "haikei_style_ref.png", mimeType: "image/png", fallbackDir: null }
};

// Canonical Character Identity Bible — Strictly Locked to mc_default.jpg!
export const MC_CANONICAL_IDENTITY_BIBLE =
  "EXACT CHARACTER LOCK TO ATTACHED mc_default.jpg REFERENCE IMAGE: " +
  "Face & Hair: sharp mature anime male jawline, confident dark charisma, messy spiky silver-gray hair with ONE distinct crimson-red center bangs streak, glowing golden-amber eyes with sharp dark eyeliner, black stud and ring piercings on his left ear (viewer's right ear). " +
  "Asymmetrical Horns (CRITICAL — NEVER SYMMETRIC, NEVER MIRRORED): Viewer's LEFT horn = tall sleek curved intact black demon horn; Viewer's RIGHT horn = broken/chipped black horn with glowing crimson-red magma cracks. " +
  "Outfit: sleek fitted black turtleneck under a sharp tailored black long coat with popped collar, subtle thin gold trim on collar and shoulders, ONE small glowing crimson diamond brooch on his left lapel (viewer's right chest), black fitted gloves with silver rings. " +
  "Art Style Lock: authentic 2D hand-drawn modern Japanese dark-action TV anime cel-shading with crisp variable-weight black G-pen ink lineart, sharp hard-edged 2-tone cel shadows, high-contrast directional rim light — ZERO chibi drift, ZERO round baby face, ZERO soft airbrush gradients, ZERO 3D CGI plastic look.";

const anchorCache = new Map();

export function loadStyleAnchorRecord(anchorKey) {
  const cfg = STYLE_ANCHOR_FILES[anchorKey];
  if (!cfg) return null;
  if (anchorCache.has(anchorKey)) return anchorCache.get(anchorKey);

  const candidates = [
    path.join(STYLE_ANCHORS_DIR, cfg.filename),
    path.join(process.cwd(), "public", "style-anchors", cfg.filename)
  ];
  if (cfg.fallbackDir) {
    candidates.push(path.join(cfg.fallbackDir, cfg.filename));
    candidates.push(path.join(process.cwd(), "public", "assets", cfg.filename));
  }

  for (const fullPath of candidates) {
    try {
      if (fs.existsSync(fullPath)) {
        const buf = fs.readFileSync(fullPath);
        const rec = {
          key: anchorKey,
          path: fullPath,
          mimeType: cfg.mimeType,
          bytes: buf.length,
          data: buf.toString("base64")
        };
        anchorCache.set(anchorKey, rec);
        return rec;
      }
    } catch {}
  }
  return null;
}

export function loadStyleAnchorBase64(anchorKey) {
  // Backward-compatible aliases ("kyara" / "masterSheet" now strictly resolve to mcDefault!)
  const normalized =
    anchorKey === "kyara" || anchorKey === "masterSheet" || anchorKey === "mc_default"
      ? "mcDefault"
      : anchorKey;
  return loadStyleAnchorRecord(normalized)?.data || null;
}

export function getStyleAnchorsStatus() {
  const mc = loadStyleAnchorRecord("mcDefault");
  const hk = loadStyleAnchorRecord("haikei");
  return {
    mcDefault: Boolean(mc),
    mcDefaultBytes: mc?.bytes || 0,
    mcDefaultUrl: "/style-anchors/mc_default.jpg",
    haikei: Boolean(hk),
    // Backward-compatible keys reflecting mc_default.jpg as single source of truth
    kyara: Boolean(mc),
    masterSheet: Boolean(mc)
  };
}

// Strict Beat-to-Pose/Expression mapping for mc_default.jpg Host poses
const BEAT_KYARA_DIRECTION = {
  pose_default_smirk: {
    pose: "confident dark charismatic three-quarter stance matching mc_default.jpg, gloved hand poised calmly, intense commanding eye contact",
    expression: "confident sly smirk, glowing golden-amber eyes with sharp dark eyeliner"
  },
  pose_explaining: {
    pose: "sharp dramatic pointing and explaining gesture with black-gloved hand wearing silver rings directed toward viewer's right",
    expression: "analytical knowing half-smirk, glowing golden-amber eyes focused sharply"
  },
  pose_shock_panic: {
    pose: "intense dramatic anime shock and alert recoil, black-gloved hand with silver rings raised sharply defensively, keeping exact mature sharp jawline",
    expression: "widened glowing golden-amber eyes, clenched brows, tense open mouth, one crisp small anime sweat-drop, heavy upper-forehead tension shadow"
  },
  pose_climax_domain: {
    pose: "intense chest-up close-up with both black-gloved hands (wearing silver rings) crossed in front of chest in a sharp arcane seal gesture, wind-blown spiky silver-gray hair",
    expression: "fierce commanding focus, blazing golden-red eyes, sharp determined mouth"
  }
};

function resolvePoseKey(phaseOrPose = "HOOK") {
  const raw = String(phaseOrPose || "HOOK").trim();
  if (BEAT_KYARA_DIRECTION[raw]) return raw;
  const u = raw.toUpperCase();
  if (u === "TAPI" || raw === "shock_alert") return "pose_shock_panic";
  if (u === "JADI" || raw === "point_reveal") return "pose_explaining";
  if (u === "CLIMAX" || raw === "domain_seal") return "pose_climax_domain";
  return "pose_default_smirk";
}

export function buildDualDnaHaikeiPrompt({ sceneDescription = "", topic = "", mood = "overcast dramatic" }) {
  const subject = String(sceneDescription || topic || "urban alley research workshop").trim();
  return [
    `Match the exact painted 2D background art style, brushwork texture, atmospheric depth, and tonal discipline of the attached style reference image.`,
    `Paint a pure 2D hand-painted modern Japanese TV anime background plate (Haikei) depicting: ${subject}.`,
    `Art direction: detailed architectural and environmental matte painting, visible hand-painted gouache and watercolor brushwork, dramatic overcast or tungsten cinematic lighting, subtle volumetric dust and atmospheric haze, deep atmospheric perspective, moody desaturated dark-action palette with selective practical light accents (${mood}).`,
    `Composition: vertical 3:4 framing giving generous left/right headroom for smooth 2.5D parallax camera panning.`,
    `Strict prohibitions: ZERO 3D CGI look, ZERO glossy plastic surfaces, ZERO characters or human figures, ZERO text, ZERO watermarks, ZERO logos.`
  ].join(" ");
}

export function buildDualDnaKyaraPrompt({ phase = "HOOK", poseKey = "", poseHint = "", topic = "" }) {
  const resolved = resolvePoseKey(poseKey || phase);
  const beat = BEAT_KYARA_DIRECTION[resolved] || BEAT_KYARA_DIRECTION.pose_default_smirk;
  const poseText = poseHint ? `${beat.pose}; ${poseHint}` : beat.pose;
  return [
    MC_CANONICAL_IDENTITY_BIBLE,
    `Generate a clean 2D hand-drawn character keyframe cel (${resolved}) isolated on a 100% FLAT SOLID UNIFORM NEON GREEN #00FF00 background for clean WebGL2 chroma-keying.`,
    `Pose & acting synced to script beat (${phase}${topic ? ` — ${topic}` : ""}): ${poseText}. Expression: ${beat.expression}.`,
    `Strict background & keying rules: 100% solid pure #00FF00 chroma green background ONLY — ZERO dungeon background, ZERO magic circles, ZERO floating smoke/wings/aura wisps, ZERO green light spill on hair or coat, ZERO text, ZERO watermarks.`
  ].join(" ");
}

export function buildFullScreenCutawayPrompt({ subjectDescription = "", topic = "", phase = "JADI", mood = "dark dramatic tungsten" }) {
  const subject = String(subjectDescription || topic || "glowing copper coils and precision steel mechanism").trim();
  const drama =
    String(phase).toUpperCase() === "TAPI"
      ? "high-tension mechanical failure closeup, flying crimson-orange sparks, dark smoke streaks, dramatic cracked tension lines"
      : String(phase).toUpperCase() === "CLIMAX"
        ? "triumphant high-energy peak closeup, brilliant focused golden-cyan energy flow, dramatic rim highlights, atmospheric embers"
        : "dramatic technical cutaway closeup, moody chiaroscuro lighting, crisp metallic reflections, subtle volumetric dust and anime kinetic lines";

  return [
    `Match the exact dark hand-painted 2D anime art direction and brushwork quality of the attached style reference image.`,
    `Illustrate a FULL-SCREEN 9:16 vertical dark-action 2D Japanese TV anime cutaway shot depicting the literal object/mechanism: ${subject}.`,
    `Cinematography: ${drama}, ${mood}, dramatic deep shadows, crisp black ink linework combined with atmospheric painterly textures, strong focal depth-of-field.`,
    `Strict prohibitions: ZERO white background box, ZERO flat vector clipart, ZERO plain geometric UI diagrams, ZERO 3D CGI plastic look, ZERO human characters, ZERO text, ZERO labels, ZERO watermarks.`
  ].join(" ");
}

export function buildFullScreenHostInScenePrompt({ sceneDescription = "", phase = "HOOK", poseHint = "", topic = "" }) {
  const resolved = resolvePoseKey(phase);
  const beat = BEAT_KYARA_DIRECTION[resolved] || BEAT_KYARA_DIRECTION.pose_default_smirk;
  return [
    MC_CANONICAL_IDENTITY_BIBLE,
    `Illustrate this exact character natively inside a FULL-SCREEN 9:16 dramatic dark-action 2D anime shot set in: ${sceneDescription || topic || "moody Japanese research workshop"}.`,
    `Acting & Camera: ${poseHint || beat.pose}; expression: ${beat.expression}; dramatic low-angle or subtle Dutch angle anime cinematography with directional tungsten/neon rim lighting seamlessly wrapping his silver-gray hair and black coat.`,
    `Strict prohibitions: ZERO green screen, ZERO floating white boxes, ZERO 3D plastic CGI look, ZERO chibi proportions, ZERO text, ZERO watermarks.`
  ].join(" ");
}

async function callGeminiImageWithReferences({
  geminiApiKey = "",
  referenceImages = [],
  promptText = "",
  aspectRatio = "9:16",
  timeoutMs = 26000
}) {
  const keys = collectGeminiKeys(geminiApiKey);
  if (!keys.length) {
    return { ok: false, fallbackRequired: true, reason: "GEMINI_API_KEY belum diatur." };
  }

  const parts = [];
  for (const ref of referenceImages) {
    if (ref?.data) {
      parts.push({
        inlineData: {
          mimeType: ref.mimeType || "image/jpeg",
          data: ref.data
        }
      });
    }
  }
  parts.push({ text: promptText });

  let lastReason = "Gemini Image API tidak tersedia untuk kunci ini.";
  for (const key of keys) {
    for (const model of DUAL_DNA_IMAGE_MODELS) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts }],
              generationConfig: {
                responseModalities: ["IMAGE"],
                imageConfig: { aspectRatio }
              }
            }),
            signal: AbortSignal.timeout(timeoutMs)
          }
        );

        if (!resp.ok) {
          const snippet = await resp.text().catch(() => "");
          lastReason = `${model} HTTP ${resp.status}: ${snippet.slice(0, 120)}`;
          if (resp.status === 429 || resp.status === 403) {
            return { ok: false, fallbackRequired: true, reason: lastReason };
          }
          continue;
        }

        const data = await resp.json();
        const imgPart = (data?.candidates?.[0]?.content?.parts || []).find((p) => p?.inlineData?.data);
        if (imgPart?.inlineData?.data) {
          const mimeType = imgPart.inlineData.mimeType || "image/png";
          return {
            ok: true,
            model,
            mimeType,
            dataUrl: `data:${mimeType};base64,${imgPart.inlineData.data}`,
            fallbackRequired: false,
            reason: null
          };
        }
      } catch (err) {
        lastReason = `${model}: ${err.message}`;
      }
    }
  }

  return { ok: false, fallbackRequired: true, reason: lastReason };
}

export async function generateDualDnaHaikei({
  sceneDescription = "",
  topic = "",
  mood = "moody overcast tungsten",
  geminiApiKey = ""
}) {
  const haikeiRec = loadStyleAnchorRecord("haikei");
  const promptText = buildDualDnaHaikeiPrompt({ sceneDescription, topic, mood });
  const references = haikeiRec ? [{ mimeType: haikeiRec.mimeType, data: haikeiRec.data }] : [];

  const res = await callGeminiImageWithReferences({
    geminiApiKey,
    referenceImages: references,
    promptText,
    aspectRatio: "3:4"
  });

  return {
    ...res,
    assetType: "haikei",
    anchorUsed: Boolean(haikeiRec),
    promptUsed: promptText
  };
}

export async function generateDualDnaKyara({
  phase = "HOOK",
  poseKey = "",
  poseHint = "",
  topic = "",
  geminiApiKey = ""
}) {
  // MANDATORY: Always attach raw bytes of mc_default.jpg as inlineData!
  const mcRec = loadStyleAnchorRecord("mcDefault");
  if (!mcRec) {
    return {
      ok: false,
      fallbackRequired: true,
      assetType: "kyara",
      anchorFile: null,
      reason: "Master character anchor mc_default.jpg tidak ditemukan!"
    };
  }
  const promptText = buildDualDnaKyaraPrompt({ phase, poseKey, poseHint, topic });
  const res = await callGeminiImageWithReferences({
    geminiApiKey,
    referenceImages: [{ mimeType: mcRec.mimeType, data: mcRec.data }],
    promptText,
    aspectRatio: "3:4"
  });

  return {
    ...res,
    assetType: "kyara",
    anchorFile: "mc_default.jpg",
    anchorsUsed: { mcDefault: true },
    promptUsed: promptText
  };
}

export async function generateFullScreenAnimeCutaway({
  subjectDescription = "",
  topic = "",
  phase = "JADI",
  mood = "dark dramatic tungsten",
  geminiApiKey = ""
}) {
  const haikeiRec = loadStyleAnchorRecord("haikei");
  const promptText = buildFullScreenCutawayPrompt({ subjectDescription, topic, phase, mood });
  const references = haikeiRec ? [{ mimeType: haikeiRec.mimeType, data: haikeiRec.data }] : [];

  const res = await callGeminiImageWithReferences({
    geminiApiKey,
    referenceImages: references,
    promptText,
    aspectRatio: "9:16"
  });

  return {
    ...res,
    assetType: "cutaway",
    anchorUsed: Boolean(haikeiRec),
    promptUsed: promptText
  };
}

export async function generateFullScreenHostInScene({
  sceneDescription = "",
  phase = "HOOK",
  poseHint = "",
  topic = "",
  geminiApiKey = ""
}) {
  const mcRec = loadStyleAnchorRecord("mcDefault");
  const haikeiRec = loadStyleAnchorRecord("haikei");
  const promptText = buildFullScreenHostInScenePrompt({ sceneDescription, phase, poseHint, topic });
  const references = [];
  if (mcRec) references.push({ mimeType: mcRec.mimeType, data: mcRec.data });
  if (haikeiRec) references.push({ mimeType: haikeiRec.mimeType, data: haikeiRec.data });

  const res = await callGeminiImageWithReferences({
    geminiApiKey,
    referenceImages: references,
    promptText,
    aspectRatio: "9:16"
  });

  return {
    ...res,
    assetType: "fullscreen_host",
    anchorFile: mcRec ? "mc_default.jpg" : null,
    promptUsed: promptText
  };
}
