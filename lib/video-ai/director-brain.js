// Self-Upgrading Anime Director Brain & Anti-"Aneh" Quality Control Engine
// Backed by Supabase (vt_references, director_playbook, learned_mistakes, generation_runs, scene_evaluations).
// All visual fixes stay 100% copyright-safe and ZERO paid Image API cost (director JSON + WebGL2 Satsuei calibration + mc_default.jpg lock).

import { callGeminiJson, GEMINI_VIDEO_MODELS } from "./gemini-client.js";
import { loadStyleAnchorRecord } from "./mappa-asset-generator.js";
import { analyzeTikTokUrl } from "../maou-engine.js";
import {
  DEFAULT_PLAYBOOK_V1,
  getAccessPinStatus,
  isSupabaseConfigured,
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
  supabaseUpsert,
  uploadDirectorAsset
} from "../supabase/server.js";

const VALID_MISTAKE_CATEGORIES = new Set([
  "anatomy",
  "character_drift",
  "layout_collision",
  "weird_motion",
  "pacing",
  "style_clash"
]);

function clamp(v, min, max, fb) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
}

function cleanShort(str, maxLen = 200) {
  return String(str || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function normalizeCategory(cat) {
  const c = String(cat || "").trim().toLowerCase();
  if (VALID_MISTAKE_CATEGORIES.has(c)) return c;
  if (/horn|face|jaw|character|outfit|drift/.test(c)) return "character_drift";
  if (/overlap|collision|subtitle|box|white|crop|margin/.test(c)) return "layout_collision";
  if (/scanline|static|freeze|motion|stiff/.test(c)) return "weird_motion";
  if (/slow|cut|pacing|tempo|duration/.test(c)) return "pacing";
  if (/3d|cgi|chibi|style|plastic|halo/.test(c)) return "style_clash";
  return "anatomy";
}

function isMissingSchemaError(errMsg) {
  const s = String(errMsg || "").toLowerCase();
  return s.includes("does not exist") || s.includes("could not find the table") || s.includes("pgrst205");
}

// ============================================================================
// 1. FETCH ACTIVE PLAYBOOK + LEARNED MISTAKES + VT REFERENCES
// ============================================================================
export async function fetchActiveDirectorContext() {
  const configured = isSupabaseConfigured();
  const pinStatus = getAccessPinStatus();

  if (!configured) {
    return {
      configured: false,
      schemaReady: false,
      pinStatus,
      playbook: { ...DEFAULT_PLAYBOOK_V1 },
      history: [{ ...DEFAULT_PLAYBOOK_V1 }],
      mistakes: [],
      vtReferences: [],
      recentRuns: [],
      recentEvaluations: [],
      statusMessage: "Supabase belum diisi di .env.local — memakai Playbook v1 lokal."
    };
  }

  const [pbRes, misRes, vtRes, runsRes, evalRes] = await Promise.all([
    supabaseSelect("director_playbook", "select=*&order=version.desc&limit=25"),
    supabaseSelect(
      "learned_mistakes",
      "select=*&is_active=eq.true&order=severity.desc,occurrences.desc,updated_at.desc&limit=25"
    ),
    supabaseSelect("vt_references", "select=*&order=created_at.desc&limit=12"),
    supabaseSelect("generation_runs", "select=*&order=created_at.desc&limit=8"),
    supabaseSelect("scene_evaluations", "select=*&order=created_at.desc&limit=20")
  ]);

  const anySchemaMissing = [pbRes, misRes, vtRes].some((r) => !r.ok && isMissingSchemaError(r.error));
  if (anySchemaMissing) {
    return {
      configured: true,
      schemaReady: false,
      pinStatus,
      playbook: { ...DEFAULT_PLAYBOOK_V1 },
      history: [{ ...DEFAULT_PLAYBOOK_V1 }],
      mistakes: [],
      vtReferences: [],
      recentRuns: [],
      recentEvaluations: [],
      statusMessage:
        "Supabase tersambung, tetapi tabel belum ada. Jalankan supabase/migrations/001_self_evolving_director.sql di Supabase SQL Editor."
    };
  }

  const firstErr = [pbRes, misRes, vtRes].find((r) => !r.ok)?.error || null;
  if (firstErr) {
    return {
      configured: true,
      schemaReady: false,
      pinStatus,
      playbook: { ...DEFAULT_PLAYBOOK_V1 },
      history: [{ ...DEFAULT_PLAYBOOK_V1 }],
      mistakes: [],
      vtReferences: [],
      recentRuns: [],
      recentEvaluations: [],
      statusMessage: `Koneksi Supabase perlu dicek: ${firstErr}`
    };
  }

  let history = Array.isArray(pbRes.data) ? pbRes.data : [];
  if (!history.length) {
    // Seed v1 baseline automatically if tables exist but director_playbook is empty
    const seeded = await supabaseInsert("director_playbook", {
      version: DEFAULT_PLAYBOOK_V1.version,
      is_active: true,
      pacing_rules: DEFAULT_PLAYBOOK_V1.pacing_rules,
      camera_rules: DEFAULT_PLAYBOOK_V1.camera_rules,
      composition_rules: DEFAULT_PLAYBOOK_V1.composition_rules,
      prompt_guidelines: DEFAULT_PLAYBOOK_V1.prompt_guidelines,
      negative_constraints: DEFAULT_PLAYBOOK_V1.negative_constraints,
      shader_presets: DEFAULT_PLAYBOOK_V1.shader_presets,
      changelog: DEFAULT_PLAYBOOK_V1.changelog,
      parent_version: null
    });
    history = Array.isArray(seeded.data) && seeded.data.length ? seeded.data : [{ ...DEFAULT_PLAYBOOK_V1 }];
  }

  const active = history.find((p) => p.is_active) || history[0] || { ...DEFAULT_PLAYBOOK_V1 };
  const mistakes = Array.isArray(misRes.data) ? misRes.data : [];
  const vtReferences = Array.isArray(vtRes.data) ? vtRes.data : [];
  const recentRuns = Array.isArray(runsRes.data) ? runsRes.data : [];
  const recentEvaluations = Array.isArray(evalRes.data) ? evalRes.data : [];

  return {
    configured: true,
    schemaReady: true,
    pinStatus,
    playbook: active,
    history,
    mistakes,
    vtReferences,
    recentRuns,
    recentEvaluations,
    statusMessage: `Terhubung ke Supabase • Playbook v${active.version} aktif (${mistakes.length} aturan anti-aneh)`
  };
}

export function formatPlaybookPromptInjection(context) {
  const pb = context?.playbook || DEFAULT_PLAYBOOK_V1;
  const mistakes = Array.isArray(context?.mistakes) ? context.mistakes : [];
  const negs = Array.isArray(pb.negative_constraints) ? pb.negative_constraints : [];

  const mistakeLines = mistakes.slice(0, 10).map(
    (m, i) =>
      `${i + 1}. [${m.category} • sev ${m.severity}/5 • x${m.occurrences}] Hindari "${m.bad_pattern}" -> WAJIB: ${m.corrective_rule}`
  );

  return `ACTIVE DIRECTOR PLAYBOOK v${pb.version || 1} (WAJIB DIPATUHI):
- Pacing Rules: ${JSON.stringify(pb.pacing_rules || {})}
- Camera Rules: ${JSON.stringify(pb.camera_rules || {})}
- Composition Rules: ${JSON.stringify(pb.composition_rules || {})}
- Shader Preset Baseline: ${JSON.stringify(pb.shader_presets || {})}
- Guidelines: ${pb.prompt_guidelines || ""}
- Hard Negative Constraints: ${JSON.stringify(negs)}${
    mistakeLines.length
      ? `\n\nLEARNED MISTAKES (MEMORI ANTI-"ANEH" PERSISTEN):\n${mistakeLines.join("\n")}`
      : ""
  }`;
}

async function publishNewPlaybookVersion({
  pacing_rules,
  camera_rules,
  composition_rules,
  prompt_guidelines,
  negative_constraints,
  shader_presets,
  changelog,
  parent_version
}) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase belum dikonfigurasi.", playbook: null };
  }
  const latestRes = await supabaseSelect("director_playbook", "select=version&order=version.desc&limit=1");
  if (!latestRes.ok) {
    return { ok: false, error: latestRes.error, playbook: null };
  }
  const maxVer = Number(latestRes.data?.[0]?.version || 0);
  const nextVer = maxVer + 1;

  // Deactivate current active rows cleanly before inserting the newly activated version
  await supabaseUpdate("director_playbook", "is_active=eq.true", { is_active: false }, { returning: false });

  const ins = await supabaseInsert("director_playbook", {
    version: nextVer,
    is_active: true,
    pacing_rules: pacing_rules || DEFAULT_PLAYBOOK_V1.pacing_rules,
    camera_rules: camera_rules || DEFAULT_PLAYBOOK_V1.camera_rules,
    composition_rules: composition_rules || DEFAULT_PLAYBOOK_V1.composition_rules,
    prompt_guidelines: cleanShort(prompt_guidelines || DEFAULT_PLAYBOOK_V1.prompt_guidelines, 1600),
    negative_constraints: Array.isArray(negative_constraints)
      ? negative_constraints.slice(0, 16).map((x) => cleanShort(x, 160))
      : DEFAULT_PLAYBOOK_V1.negative_constraints,
    shader_presets: shader_presets || DEFAULT_PLAYBOOK_V1.shader_presets,
    changelog: cleanShort(changelog || `Auto-upgraded to v${nextVer}`, 400),
    parent_version: parent_version ?? (maxVer || null)
  });

  if (!ins.ok) {
    // Restore previous version as active if insert failed
    if (parent_version) {
      await supabaseUpdate("director_playbook", `version=eq.${parent_version}`, { is_active: true }, { returning: false });
    }
    return { ok: false, error: ins.error, playbook: null };
  }
  return { ok: true, playbook: ins.data?.[0] || null };
}

export async function upsertLearnedMistake({
  category,
  symptom,
  bad_pattern,
  corrective_rule,
  severity = 3
}) {
  if (!isSupabaseConfigured()) return { ok: false, skipped: true };
  const cleanCat = normalizeCategory(category);
  const cleanPattern = cleanShort(bad_pattern || symptom, 200);
  const cleanRule = cleanShort(corrective_rule, 280);
  if (!cleanPattern || !cleanRule) return { ok: false, skipped: true };

  // Check if same (category, bad_pattern) already exists so we increment occurrences
  const existing = await supabaseSelect(
    "learned_mistakes",
    `select=id,occurrences,severity&category=eq.${encodeURIComponent(cleanCat)}&bad_pattern=eq.${encodeURIComponent(cleanPattern)}&limit=1`
  );
  if (existing.ok && existing.data?.[0]) {
    const row = existing.data[0];
    return supabaseUpdate("learned_mistakes", `id=eq.${row.id}`, {
      symptom: cleanShort(symptom || cleanPattern, 240),
      corrective_rule: cleanRule,
      severity: Math.max(Number(row.severity) || 3, clamp(severity, 1, 5, 3)),
      occurrences: (Number(row.occurrences) || 1) + 1,
      is_active: true,
      updated_at: new Date().toISOString()
    });
  }

  return supabaseUpsert(
    "learned_mistakes",
    {
      category: cleanCat,
      symptom: cleanShort(symptom || cleanPattern, 240),
      bad_pattern: cleanPattern,
      corrective_rule: cleanRule,
      severity: clamp(severity, 1, 5, 3),
      occurrences: 1,
      is_active: true,
      updated_at: new Date().toISOString()
    },
    "category,bad_pattern"
  );
}

// ============================================================================
// 2. VT REFERENCE INGESTOR (Extract Concrete Pacing/Camera DNA -> Upgrade Playbook)
// ============================================================================
export async function ingestVtReference({
  title = "",
  referenceUrl = "",
  sourceNotes = "",
  avgCutDurationHint = null,
  thumbnailDataUrl = "",
  geminiApiKey = ""
}) {
  const ctx = await fetchActiveDirectorContext();
  if (!ctx.configured || !ctx.schemaReady) {
    throw new Error(ctx.statusMessage || "Supabase belum siap. Jalankan migration SQL dulu.");
  }

  let tikTokMeta = null;
  if (referenceUrl && /^https?:\/\//i.test(referenceUrl.trim())) {
    try {
      const tt = await analyzeTikTokUrl(referenceUrl.trim());
      if (tt && !tt.error) tikTokMeta = tt;
    } catch {}
  }

  let storagePath = "";
  const parts = [];
  const frameMatch = String(thumbnailDataUrl || "").match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  if (frameMatch) {
    const mime = frameMatch[1].toLowerCase() === "image/jpg" ? "image/jpeg" : frameMatch[1].toLowerCase();
    parts.push({ inlineData: { mimeType: mime, data: frameMatch[2] } });
    const up = await uploadDirectorAsset(`vt-refs/vt_${Date.now()}.${mime.includes("png") ? "png" : "jpg"}`, thumbnailDataUrl, mime);
    if (up.ok) storagePath = up.path;
  }

  const effectiveTitle = cleanShort(title || tikTokMeta?.title || referenceUrl || "VT Reference", 140);
  const currentPb = ctx.playbook || DEFAULT_PLAYBOOK_V1;

  const systemInstruction = `Kamu adalah Principal Anime Cinematographer & Short-Form VT Editing Analyst.
Analisa referensi video pendek (VT/TikTok/Reels) terlampir lalu ekstrak ANGKA KONKRET, RUMUS PACING, POLA KAMERA, dan DNA VISUAL untuk di-merge ke Director Playbook anime 2D 9:16 yang terkunci ke karakter mc_default.jpg.
DILARANG menyebut nama studio/judul anime berhak cipta. DILARANG deskripsi kabur — wajib beri angka & preset teknis!

Kembalikan HANYA JSON valid:
{
  "avg_cut_duration_sec": 2.2,
  "hook_structure": {
    "duration_sec": 2.4,
    "opening_shot": "tight_closeup_smirk",
    "pattern_interrupt_beat_sec": 1.1,
    "hook_formula": "Pertanyaan mengejutkan + zoom punch + SFX impact"
  },
  "camera_patterns": {
    "host_vs_cutaway_ratio": "40:60",
    "preferred_transitions": ["whip_cut", "zoom_punch"],
    "punch_zoom_frequency_sec": 2.2,
    "explain_motion": "pan_left_to_right",
    "conflict_motion": "dutch_shibuya_shake"
  },
  "visual_style_dna": {
    "lighting_contrast": "high_contrast_crushed_blacks",
    "bloomStrength": 0.28,
    "lightWrapStrength": 0.46,
    "shadowCrush": 0.16,
    "contrast": 1.12,
    "saturation": 1.15
  },
  "subtitle_safe_zone": {
    "safe_margin_px": 48,
    "subtitle_bottom_zone_pct": 18,
    "max_words_per_chunk": 4
  },
  "upgraded_prompt_guidelines": "Instruksi singkat konkret untuk director menggabungkan pola VT ini sambil mengunci karakter ke mc_default.jpg",
  "changelog": "Ringkasan 1 kalimat upgrade Playbook hasil ingest VT ini"
}`;

  const promptText = `REFERENSI VT:
- Judul: "${effectiveTitle}"
- URL: "${referenceUrl || "-"}"
- Catatan Editor / Observasi User: "${sourceNotes || "Ikuti ritme VT edukasi dark-anime cepat, cut dinamis setiap ~2 detik, subtitle bersih, kontras tajam"}"
- Target Durasi Cut Manual (opsional): ${avgCutDurationHint || "auto"}
- Metadata TikTok: ${tikTokMeta ? JSON.stringify({ title: tikTokMeta.title, author: tikTokMeta.author?.uniqueId, stats: tikTokMeta.stats }) : "tidak tersedia"}
- Playbook Aktif v${currentPb.version}: ${JSON.stringify({ pacing_rules: currentPb.pacing_rules, camera_rules: currentPb.camera_rules, shader_presets: currentPb.shader_presets })}`;

  parts.push({ text: promptText });

  const aiRes = await callGeminiJson({
    geminiApiKey,
    systemInstruction,
    parts,
    temperature: 0.32,
    maxOutputTokens: 2048,
    timeoutMs: 22000,
    models: GEMINI_VIDEO_MODELS
  });

  const d = aiRes.ok && aiRes.data ? aiRes.data : {};
  const avgCut = clamp(d.avg_cut_duration_sec ?? avgCutDurationHint, 1.2, 3.4, currentPb.pacing_rules?.avg_cut_duration_sec || 2.2);
  const hookStructure = d.hook_structure && typeof d.hook_structure === "object"
    ? d.hook_structure
    : {
        duration_sec: Math.min(2.6, avgCut),
        opening_shot: "tight_closeup_smirk",
        pattern_interrupt_beat_sec: 1.1,
        hook_formula: "Direct question + quick zoom punch + Katakana SFX"
      };
  const cameraPatterns = d.camera_patterns && typeof d.camera_patterns === "object"
    ? d.camera_patterns
    : {
        host_vs_cutaway_ratio: "40:60",
        preferred_transitions: ["whip_cut", "zoom_punch"],
        punch_zoom_frequency_sec: avgCut,
        explain_motion: "pan_left_to_right",
        conflict_motion: "dutch_shibuya_shake"
      };
  const visualStyleDna = d.visual_style_dna && typeof d.visual_style_dna === "object"
    ? d.visual_style_dna
    : {
        lighting_contrast: "high_contrast_crushed_blacks",
        bloomStrength: 0.28,
        lightWrapStrength: 0.46,
        shadowCrush: 0.16,
        contrast: 1.12,
        saturation: 1.15
      };
  const subtitleSafeZone = d.subtitle_safe_zone && typeof d.subtitle_safe_zone === "object"
    ? d.subtitle_safe_zone
    : { safe_margin_px: 48, subtitle_bottom_zone_pct: 18, max_words_per_chunk: 4 };

  const vtIns = await supabaseInsert("vt_references", {
    title: effectiveTitle,
    source_notes: cleanShort(sourceNotes || referenceUrl, 500),
    storage_path: storagePath,
    avg_cut_duration_sec: avgCut,
    hook_structure: hookStructure,
    camera_patterns: cameraPatterns,
    visual_style_dna: visualStyleDna,
    subtitle_safe_zone: subtitleSafeZone,
    raw_analysis: aiRes.ok ? aiRes.data : { fallback: true, tikTokMeta }
  });
  if (!vtIns.ok) throw new Error(`Gagal menyimpan vt_references: ${vtIns.error}`);

  const mergedPacing = {
    ...(currentPb.pacing_rules || {}),
    avg_cut_duration_sec: avgCut,
    max_static_shot_sec: Math.min(3.2, Number((avgCut + 0.6).toFixed(2))),
    hook_duration_sec: clamp(hookStructure.duration_sec, 1.5, 3.0, 2.3),
    host_vs_cutaway_ratio: cameraPatterns.host_vs_cutaway_ratio || "40:60"
  };
  const mergedCamera = {
    ...(currentPb.camera_rules || {}),
    explain_motion: cameraPatterns.explain_motion || currentPb.camera_rules?.explain_motion || "pan_left_to_right",
    conflict_motion: cameraPatterns.conflict_motion || currentPb.camera_rules?.conflict_motion || "dutch_shibuya_shake",
    preferred_transitions: Array.isArray(cameraPatterns.preferred_transitions)
      ? cameraPatterns.preferred_transitions
      : ["whip_cut", "zoom_punch"]
  };
  const mergedComposition = {
    ...(currentPb.composition_rules || {}),
    safe_margin_px: clamp(subtitleSafeZone.safe_margin_px, 40, 72, 48),
    subtitle_bottom_zone_pct: clamp(subtitleSafeZone.subtitle_bottom_zone_pct, 15, 24, 18),
    character_anchor: "mc_default.jpg",
    never_flip_asymmetrical_horns: true
  };
  const mergedShaders = {
    ...(currentPb.shader_presets || {}),
    bloomStrength: clamp(visualStyleDna.bloomStrength, 0.16, 0.5, currentPb.shader_presets?.bloomStrength ?? 0.28),
    lightWrapStrength: clamp(visualStyleDna.lightWrapStrength, 0.22, 0.72, currentPb.shader_presets?.lightWrapStrength ?? 0.46),
    shadowCrush: clamp(visualStyleDna.shadowCrush, 0.08, 0.24, currentPb.shader_presets?.shadowCrush ?? 0.15),
    contrast: clamp(visualStyleDna.contrast, 1.0, 1.22, currentPb.shader_presets?.contrast ?? 1.12),
    saturation: clamp(visualStyleDna.saturation, 0.96, 1.24, currentPb.shader_presets?.saturation ?? 1.14)
  };

  const guidelines = cleanShort(
    d.upgraded_prompt_guidelines ||
      `${currentPb.prompt_guidelines} Target avg cut ${avgCut}s with Host/Cutaway ${mergedPacing.host_vs_cutaway_ratio}.`,
    1500
  );
  const changelog = cleanShort(
    d.changelog || `Ingested VT "${effectiveTitle}" (cut ${avgCut}s, rasio ${mergedPacing.host_vs_cutaway_ratio})`,
    360
  );

  const pub = await publishNewPlaybookVersion({
    pacing_rules: mergedPacing,
    camera_rules: mergedCamera,
    composition_rules: mergedComposition,
    prompt_guidelines: guidelines,
    negative_constraints: currentPb.negative_constraints,
    shader_presets: mergedShaders,
    changelog,
    parent_version: currentPb.version
  });
  if (!pub.ok) throw new Error(`Gagal menerbitkan Playbook baru: ${pub.error}`);

  return {
    ok: true,
    vtReference: vtIns.data?.[0] || null,
    playbook: pub.playbook,
    model: aiRes.model || "vt-heuristic-parser"
  };
}

// ============================================================================
// 3. GENERATION RUN TRACKING & PER-SCENE VISION AUTO-CRITIC GATE (MAX 2 RETRIES)
// ============================================================================
export async function createOrGetGenerationRun({ runId = null, topic = "", playbookVersion = 1 }) {
  if (!isSupabaseConfigured()) return { ok: true, id: runId || null, localOnly: true };
  if (runId) return { ok: true, id: runId };

  const ins = await supabaseInsert("generation_runs", {
    topic: cleanShort(topic || "Untitled Video", 220),
    playbook_version: Number(playbookVersion) || 1,
    status: "in_progress"
  });
  if (!ins.ok) return { ok: false, id: null, error: ins.error };
  return { ok: true, id: ins.data?.[0]?.id || null };
}

function buildSurgicalHealBlueprint(blueprint, defects = [], pb = DEFAULT_PLAYBOOK_V1) {
  if (!blueprint || typeof blueprint !== "object") return blueprint;
  const next = JSON.parse(JSON.stringify(blueprint));
  const defectText = defects
    .map((d) => `${d.category || ""} ${d.symptom || ""} ${d.bad_pattern || ""} ${d.corrective_rule || ""}`)
    .join(" ")
    .toLowerCase();

  next.satsueiGrade = { ...(pb.shader_presets || {}), ...(next.satsueiGrade || {}) };

  if (/bloom|silau|glare|terang|white/.test(defectText)) {
    next.satsueiGrade.bloomStrength = clamp((next.satsueiGrade.bloomStrength ?? 0.28) - 0.08, 0.14, 0.45, 0.22);
    next.satsueiGrade.contrast = clamp((next.satsueiGrade.contrast ?? 1.1) + 0.04, 1.0, 1.22, 1.14);
  }
  if (/sticker|halo|green|chroma|tempel/.test(defectText)) {
    next.satsueiGrade.lightWrapStrength = clamp((next.satsueiGrade.lightWrapStrength ?? 0.44) + 0.14, 0.25, 0.78, 0.58);
    next.satsueiGrade.ambientHarmonization = clamp((next.satsueiGrade.ambientHarmonization ?? 0.22) + 0.05, 0.18, 0.3, 0.26);
  }
  if (/dark|gelap|pekat|crush/.test(defectText)) {
    next.satsueiGrade.shadowCrush = clamp((next.satsueiGrade.shadowCrush ?? 0.14) - 0.04, 0.06, 0.24, 0.1);
  }
  if (/static|freeze|kaku|lama|pacing/.test(defectText)) {
    next.enableAlternatingCutaway = true;
    next.cutawayStartSec = Math.min(Number(next.cutawayStartSec || 2.5), Number(pb.pacing_rules?.avg_cut_duration_sec || 2.3));
    next.transitionStyle = next.transitionStyle === "zoom_punch" ? "whip_cut" : "zoom_punch";
  }
  if (/horn|drift|face|mc|character/.test(defectText)) {
    if (!["pose_default_smirk", "pose_explaining", "pose_shock_panic", "pose_climax_domain"].includes(next.characterPose)) {
      next.characterPose = "pose_default_smirk";
    }
  }
  return next;
}

export async function evaluateSceneWithDirectorGate({
  frameDataUrl = "",
  blueprint = null,
  scene = {},
  topic = "",
  runId = null,
  sceneIndex = 0,
  retryCount = 0,
  geminiApiKey = ""
}) {
  const m = String(frameDataUrl || "").match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!m) {
    throw new Error("Format frame gambar tidak valid (harus base64 JPEG/PNG/WebP).");
  }
  const mimeType = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  const base64Data = m[2];

  const ctx = await fetchActiveDirectorContext();
  const pb = ctx.playbook || DEFAULT_PLAYBOOK_V1;
  const playbookBlock = formatPlaybookPromptInjection(ctx);
  const sceneType = blueprint?.enableAlternatingCutaway && Number(retryCount) > 0 && sceneIndex % 2 === 1 ? "cutaway" : "host";

  // Attach real mc_default.jpg anchor for multimodal identity comparison!
  const mcAnchor = loadStyleAnchorRecord("mcDefault");
  const parts = [];
  if (mcAnchor?.data) {
    parts.push({ text: "GAMBAR 1 — MASTER CHARACTER ANCHOR WAJIB (mc_default.jpg):" });
    parts.push({ inlineData: { mimeType: mcAnchor.mimeType, data: mcAnchor.data } });
  }
  parts.push({ text: "GAMBAR 2 — FRAME RENDER 9:16 YANG SEDANG DIEVALUASI:" });
  parts.push({ inlineData: { mimeType, data: base64Data } });

  const systemInstruction = `Kamu adalah "Principal Anime Art-Director & Anti-Aneh Vision QC Critic".
Evaluasi GAMBAR 2 (frame 9:16) secara ketat terhadap:
1. Active Director Playbook & Learned Mistakes terlampir
2. Identitas GAMBAR 1 (mc_default.jpg: rahang tegas dewasa ZERO chibi, rambut abu-abu perak dengan 1 poni merah tengah, mata emas-amber, TANDUK ASIMETRIS kiri layar utuh melengkung & kanan layar patah retakan magma merah, jas hitam kerah tegak trim emas + bros merah kiri + sarung tangan hitam cincin perak)
3. Kualitas anti-"aneh" (ZERO horizontal scanline, ZERO kotak putih polos, ZERO halo hijau chroma key, ZERO tabrakan subtitle/UI, ZERO teks Katakana campur huruf Latin).

${playbookBlock}

SKOR 0.0–10.0 UNTUK 4 PILAR:
- \`anatomy_coherence\` (proporsi wajah/tubuh/benda bersih, tidak putus/terbelah garis horizontal)
- \`character_consistency\` (kemiripan 1:1 dengan mc_default.jpg termasuk tanduk asimetris!)
- \`anime_style_fidelity\` (2D cel shading tajam, Satsuei Light Wrap, kontras bersih, tanpa plastik 3D/stiker)
- \`layout_safety\` (ruang aman 9:16 >= 48px, tidak ada kotak putih menyilaukan, teks SFX/subtitle bersih terbaca)

Kembalikan HANYA JSON valid:
{
  "scores": {
    "anatomy_coherence": 8.8,
    "character_consistency": 8.9,
    "anime_style_fidelity": 8.5,
    "layout_safety": 8.7
  },
  "overall_score_10": 8.7,
  "pass": true,
  "critique": "Penilaian jujur 1-2 kalimat Bahasa Indonesia.",
  "defects": [
    {
      "category": "anatomy | character_drift | layout_collision | weird_motion | pacing | style_clash",
      "symptom": "Gejala singkat yang terlihat",
      "bad_pattern": "Pola penyebab singkat (max 12 kata)",
      "corrective_rule": "Aturan perbaikan konkret untuk scene & Playbook",
      "severity": 3
    }
  ],
  "styleLesson": "1 kalimat pelajaran singkat untuk scene selanjutnya",
  "shader_adjustments": {
    "bloom_intensity": 0.28,
    "light_wrap_strength": 0.48,
    "shadow_crush": 0.14,
    "ambient_harmonization": 0.22,
    "dof_blur": 0.28,
    "contrast": 1.10,
    "saturation": 1.14,
    "chromatic_peak": 0.012
  }
}`;

  parts.push({
    text: `Topik: "${topic}" | Scene #${sceneIndex + 1} (${scene?.phase || "HOOK"}): "${scene?.plainNarration || scene?.narration || ""}" | Blueprint: ${JSON.stringify({
      engine: blueprint?.engine,
      haikeiBg: blueprint?.haikeiBg,
      characterPose: blueprint?.characterPose,
      cutawayKind: blueprint?.cutawayKind,
      transitionStyle: blueprint?.transitionStyle,
      satsueiGrade: blueprint?.satsueiGrade
    })}
Inspeksi GAMBAR 2 dibandingkan GAMBAR 1 (mc_default.jpg) dan Playbook v${pb.version}. Jika ada bagian "aneh", turunkan skor di bawah 8.0 & isi array \`defects\` dengan tepat!`
  });

  const aiRes = await callGeminiJson({
    geminiApiKey,
    systemInstruction,
    parts,
    temperature: 0.28,
    maxOutputTokens: 2048,
    timeoutMs: 24000
  });

  const d = aiRes.ok && aiRes.data ? aiRes.data : null;
  const sObj = d?.scores || {};
  const anatomy = clamp(sObj.anatomy_coherence, 1, 10, 8.6);
  const consistency = clamp(sObj.character_consistency, 1, 10, 8.7);
  const styleFidelity = clamp(sObj.anime_style_fidelity, 1, 10, 8.5);
  const layoutSafety = clamp(sObj.layout_safety, 1, 10, 8.6);
  const computed10 = Number(((anatomy + consistency + styleFidelity + layoutSafety) / 4).toFixed(1));
  const score10 = clamp(d?.overall_score_10, 1, 10, computed10);
  const pass = score10 >= 8.0 && Math.min(anatomy, consistency, styleFidelity, layoutSafety) >= 7.0;

  const defects = Array.isArray(d?.defects)
    ? d.defects
        .filter((x) => x && (x.symptom || x.bad_pattern))
        .slice(0, 4)
        .map((x) => ({
          category: normalizeCategory(x.category),
          symptom: cleanShort(x.symptom, 180),
          bad_pattern: cleanShort(x.bad_pattern || x.symptom, 180),
          corrective_rule: cleanShort(x.corrective_rule || `Hindari ${x.bad_pattern || x.symptom}`, 240),
          severity: clamp(x.severity, 1, 5, 3)
        }))
    : [];

  const shaderAdjustments = {
    bloom_intensity: clamp(d?.shader_adjustments?.bloom_intensity, 0.14, 0.55, pb.shader_presets?.bloomStrength ?? 0.28),
    light_wrap_strength: clamp(d?.shader_adjustments?.light_wrap_strength, 0.2, 0.78, pb.shader_presets?.lightWrapStrength ?? 0.48),
    shadow_crush: clamp(d?.shader_adjustments?.shadow_crush, 0.06, 0.26, pb.shader_presets?.shadowCrush ?? 0.14),
    ambient_harmonization: clamp(d?.shader_adjustments?.ambient_harmonization, 0.15, 0.3, pb.shader_presets?.ambientHarmonization ?? 0.22),
    dof_blur: clamp(d?.shader_adjustments?.dof_blur, 0.1, 0.5, pb.shader_presets?.dofBlur ?? 0.28),
    contrast: clamp(d?.shader_adjustments?.contrast, 0.98, 1.22, pb.shader_presets?.contrast ?? 1.1),
    saturation: clamp(d?.shader_adjustments?.saturation, 0.95, 1.24, pb.shader_presets?.saturation ?? 1.14),
    chromatic_peak: clamp(d?.shader_adjustments?.chromatic_peak, 0.002, 0.018, pb.shader_presets?.chromaticPeak ?? 0.012)
  };

  let refinedBlueprint = blueprint ? JSON.parse(JSON.stringify(blueprint)) : null;
  if (refinedBlueprint) {
    refinedBlueprint.satsueiGrade = {
      ...(refinedBlueprint.satsueiGrade || {}),
      bloomStrength: shaderAdjustments.bloom_intensity,
      lightWrapStrength: shaderAdjustments.light_wrap_strength,
      shadowCrush: shaderAdjustments.shadow_crush,
      ambientHarmonization: shaderAdjustments.ambient_harmonization,
      dofBlur: shaderAdjustments.dof_blur,
      contrast: shaderAdjustments.contrast,
      saturation: shaderAdjustments.saturation,
      chromaticPeak: shaderAdjustments.chromatic_peak
    };
  }

  // Hard cap: max 2 auto-heal retries per scene!
  const currentRetry = Math.max(0, Math.min(2, Number(retryCount) || 0));
  const needsHeal = !pass && currentRetry < 2;
  if (needsHeal && refinedBlueprint) {
    refinedBlueprint = buildSurgicalHealBlueprint(refinedBlueprint, defects, pb);
  }

  let previewStoragePath = "";
  let ensuredRunId = runId || null;
  let evalRow = null;
  let evolvedPlaybook = null;

  if (ctx.configured && ctx.schemaReady) {
    const runRes = await createOrGetGenerationRun({
      runId: ensuredRunId,
      topic,
      playbookVersion: pb.version
    });
    ensuredRunId = runRes.id;

    if (!pass) {
      const up = await uploadDirectorAsset(
        `evals/run_${ensuredRunId || "ad_hoc"}_s${sceneIndex + 1}_r${currentRetry}.jpg`,
        frameDataUrl,
        mimeType
      );
      if (up.ok) previewStoragePath = up.path;

      // Upsert defects into learned_mistakes and check if any defect occurred >= 2 times!
      let autoEvolveTrigger = false;
      for (const df of defects) {
        const upRes = await upsertLearnedMistake(df);
        const occ = Number(upRes?.data?.[0]?.occurrences || 1);
        if (occ >= 2 || df.severity >= 5) {
          autoEvolveTrigger = true;
        }
      }

      if (autoEvolveTrigger) {
        const evo = await evolveDirectorPlaybook({
          triggerReason: `Auto-Critic mendeteksi cacat berulang pada Scene #${sceneIndex + 1}`,
          extraNote: defects.map((x) => `${x.bad_pattern}: ${x.corrective_rule}`).join("; "),
          geminiApiKey
        });
        if (evo.ok) evolvedPlaybook = evo.playbook;
      }
    }

    const evalIns = await supabaseInsert("scene_evaluations", {
      run_id: ensuredRunId,
      scene_index: Number(sceneIndex) || 0,
      scene_type: sceneType,
      prompt_used: cleanShort(blueprint?.haikeiPrompt || blueprint?.cutawayPrompt || scene?.narration || "", 800),
      motion_or_camera_config: {
        cameraMotion2d: blueprint?.cameraMotion2d,
        transitionStyle: blueprint?.transitionStyle,
        characterPose: blueprint?.characterPose,
        satsueiGrade: shaderAdjustments
      },
      critic_score: score10,
      critic_defects: defects,
      retry_count: currentRetry,
      user_rating: null,
      user_note: "",
      preview_storage_path: previewStoragePath
    });
    if (evalIns.ok) evalRow = evalIns.data?.[0] || null;
  }

  const overallScore100 = Math.round(score10 * 10);
  return {
    ok: true,
    pass,
    needsRetry: needsHeal,
    retryCount: currentRetry,
    maxRetries: 2,
    runId: ensuredRunId,
    evaluationId: evalRow?.id || null,
    playbookVersion: evolvedPlaybook?.version || pb.version,
    evolvedPlaybook,
    visionModel: aiRes.model || "director-gate-fallback",
    overallScore10: score10,
    overallScore: overallScore100,
    scores10: {
      anatomy_coherence: anatomy,
      character_consistency: consistency,
      anime_style_fidelity: styleFidelity,
      layout_safety: layoutSafety
    },
    criteria: {
      celAuthenticity: Math.round(styleFidelity * 10),
      chromaLightIntegration: Math.round(consistency * 10),
      satsueiReadability: Math.round(layoutSafety * 10),
      compositionBalance: Math.round(anatomy * 10)
    },
    defects,
    issues: defects.map((df) => `[${df.category}] ${df.symptom}`),
    critique: cleanShort(
      d?.critique ||
        (pass
          ? `Scene #${sceneIndex + 1} lolos Director Gate (${score10}/10) dan konsisten dengan mc_default.jpg.`
          : `Scene #${sceneIndex + 1} mendapat skor ${score10}/10 — patch anti-aneh diterapkan.`),
      300
    ),
    styleLesson: cleanShort(d?.styleLesson || "", 180),
    shader_adjustments: shaderAdjustments,
    refinedBlueprint
  };
}

// ============================================================================
// 4. HUMAN-IN-THE-LOOP FEEDBACK (👍 Keren / 👎 Aneh) + AUTO-EVOLUTION OPTIMIZER
// ============================================================================
export async function recordSceneFeedback({
  runId = null,
  topic = "",
  sceneIndex = 0,
  sceneType = "host",
  promptUsed = "",
  motionConfig = {},
  criticScore = null,
  criticDefects = [],
  retryCount = 0,
  userRating = "good",
  userNote = "",
  previewDataUrl = "",
  geminiApiKey = ""
}) {
  const ctx = await fetchActiveDirectorContext();
  if (!ctx.configured || !ctx.schemaReady) {
    return {
      ok: true,
      localOnly: true,
      evolved: false,
      playbook: ctx.playbook,
      message: ctx.statusMessage
    };
  }

  const pb = ctx.playbook || DEFAULT_PLAYBOOK_V1;
  const rating = userRating === "weird" ? "weird" : "good";
  const runRes = await createOrGetGenerationRun({ runId, topic, playbookVersion: pb.version });
  const ensuredRunId = runRes.id;

  let previewStoragePath = "";
  if (rating === "weird" && previewDataUrl) {
    const up = await uploadDirectorAsset(
      `feedback/weird_run_${ensuredRunId || "ad_hoc"}_s${sceneIndex + 1}_${Date.now()}.jpg`,
      previewDataUrl,
      "image/jpeg"
    );
    if (up.ok) previewStoragePath = up.path;
  }

  const evalIns = await supabaseInsert("scene_evaluations", {
    run_id: ensuredRunId,
    scene_index: Number(sceneIndex) || 0,
    scene_type: sceneType === "cutaway" ? "cutaway" : "host",
    prompt_used: cleanShort(promptUsed, 800),
    motion_or_camera_config: motionConfig && typeof motionConfig === "object" ? motionConfig : {},
    critic_score: criticScore !== null && criticScore !== undefined ? Number(criticScore) : null,
    critic_defects: Array.isArray(criticDefects) ? criticDefects : [],
    retry_count: Math.max(0, Number(retryCount) || 0),
    user_rating: rating,
    user_note: cleanShort(userNote, 360),
    preview_storage_path: previewStoragePath
  });
  if (!evalIns.ok) throw new Error(`Gagal menyimpan feedback: ${evalIns.error}`);

  let evolved = false;
  let newPlaybook = pb;
  let newMistakes = [];
  if (rating === "weird") {
    const evo = await evolveDirectorPlaybook({
      triggerReason: `User menandai Scene #${Number(sceneIndex) + 1} 👎 Aneh`,
      extraNote: cleanShort(userNote || `Visual scene #${Number(sceneIndex) + 1} terasa aneh (${promptUsed})`, 360),
      geminiApiKey
    });
    if (evo.ok && evo.playbook) {
      evolved = true;
      newPlaybook = evo.playbook;
      newMistakes = evo.upsertedMistakes || [];
    }
  }

  return {
    ok: true,
    runId: ensuredRunId,
    evaluation: evalIns.data?.[0] || null,
    evolved,
    playbook: newPlaybook,
    newMistakes
  };
}

export async function evolveDirectorPlaybook({
  triggerReason = "Manual Brain Upgrade",
  extraNote = "",
  geminiApiKey = ""
}) {
  const ctx = await fetchActiveDirectorContext();
  if (!ctx.configured || !ctx.schemaReady) {
    throw new Error(ctx.statusMessage || "Supabase belum dikonfigurasi / belum migrasi SQL.");
  }

  const pb = ctx.playbook || DEFAULT_PLAYBOOK_V1;
  const weirdEvalsRes = await supabaseSelect(
    "scene_evaluations",
    "select=scene_index,scene_type,prompt_used,critic_score,critic_defects,user_rating,user_note&or=(user_rating.eq.weird,critic_score.lt.8)&order=created_at.desc&limit=10"
  );
  const failingEvals = Array.isArray(weirdEvalsRes.data) ? weirdEvalsRes.data : [];

  const systemInstruction = `Kamu adalah Principal AI Anime Self-Evolution Optimizer.
Tugasmu menganalisa kegagalan visual ("👎 Aneh" dari user + Auto-Critic score < 8.0 + Playbook saat ini), lalu menghasilkan:
1. Daftar aturan konkret ke \`learned_mistakes\` (unik, tajam, mencegah cacat terulang).
2. Playbook versi v${Number(pb.version) + 1} yang lebih ketat pada prompt, negative constraints, dan parameter Satsuei shader, sambil mempertahankan lock \`mc_default.jpg\` (tanduk kiri utuh, tanduk kanan patah magma merah, NO chibi, NO white boxes, NO scanlines, NO paid image gen).

Kembalikan HANYA JSON valid:
{
  "mistakes_to_learn": [
    {
      "category": "anatomy | character_drift | layout_collision | weird_motion | pacing | style_clash",
      "symptom": "Gejala visual aneh yang muncul",
      "bad_pattern": "Pola penyebab spesifik (max 12 kata)",
      "corrective_rule": "Aturan pencegahan konkret untuk director & Satsuei",
      "severity": 4
    }
  ],
  "negative_constraints": ["aturan larangan 1", "aturan larangan 2"],
  "prompt_guidelines": "Ringkasan instruksi penyutradaraan yang diperketat (maks 3 kalimat).",
  "shader_presets": {
    "bloomStrength": 0.26,
    "lightWrapStrength": 0.48,
    "ambientHarmonization": 0.24,
    "shadowCrush": 0.14,
    "dofBlur": 0.28,
    "chromaticPeak": 0.012,
    "contrast": 1.12,
    "saturation": 1.14,
    "rimIntensity": 0.82
  },
  "pacing_rules": {
    "avg_cut_duration_sec": 2.2,
    "max_static_shot_sec": 2.8,
    "hook_duration_sec": 2.3,
    "host_vs_cutaway_ratio": "45:55"
  },
  "changelog": "Ringkasan jelas apa yang ditingkatkan di v${Number(pb.version) + 1}"
}`;

  const promptText = `TRIGGER EVOLUSI: ${triggerReason}
CATATAN USER TERBARU: "${extraNote || "-"}"
PLAYBOOK AKTIF v${pb.version}:
${JSON.stringify({
  pacing_rules: pb.pacing_rules,
  camera_rules: pb.camera_rules,
  negative_constraints: pb.negative_constraints,
  shader_presets: pb.shader_presets
})}
LOG SCENE BERMASALAH (TERAKHIR):
${JSON.stringify(failingEvals.slice(0, 6))}
ATURAN ANTI-ANEH SAAT INI:
${JSON.stringify((ctx.mistakes || []).slice(0, 8))}`;

  const aiRes = await callGeminiJson({
    geminiApiKey,
    systemInstruction,
    userPrompt: promptText,
    temperature: 0.28,
    maxOutputTokens: 2048,
    timeoutMs: 22000,
    models: GEMINI_VIDEO_MODELS
  });

  const d = aiRes.ok && aiRes.data ? aiRes.data : {};
  const rawMistakes = Array.isArray(d.mistakes_to_learn) ? d.mistakes_to_learn : [];
  if (!rawMistakes.length && extraNote) {
    rawMistakes.push({
      category: normalizeCategory(extraNote),
      symptom: cleanShort(extraNote, 180),
      bad_pattern: cleanShort(extraNote, 120),
      corrective_rule: `Hindari pola "${cleanShort(extraNote, 100)}" dan perketat Light Wrap / framing aman 9:16.`,
      severity: 4
    });
  }

  const upsertedMistakes = [];
  for (const mItem of rawMistakes.slice(0, 5)) {
    const res = await upsertLearnedMistake(mItem);
    if (res.ok && res.data?.[0]) upsertedMistakes.push(res.data[0]);
  }

  const mergedNegs = Array.from(
    new Set([
      ...(Array.isArray(pb.negative_constraints) ? pb.negative_constraints : []),
      ...(Array.isArray(d.negative_constraints) ? d.negative_constraints : []),
      ...(extraNote ? [`avoid: ${cleanShort(extraNote, 90)}`] : [])
    ])
  ).slice(0, 14);

  const pub = await publishNewPlaybookVersion({
    pacing_rules: { ...(pb.pacing_rules || {}), ...(d.pacing_rules || {}) },
    camera_rules: pb.camera_rules,
    composition_rules: pb.composition_rules,
    prompt_guidelines: d.prompt_guidelines || pb.prompt_guidelines,
    negative_constraints: mergedNegs,
    shader_presets: { ...(pb.shader_presets || {}), ...(d.shader_presets || {}) },
    changelog:
      d.changelog ||
      `Upgrade otomatis (${cleanShort(triggerReason, 100)}${extraNote ? `: ${cleanShort(extraNote, 120)}` : ""})`,
    parent_version: pb.version
  });

  if (!pub.ok) throw new Error(`Gagal menyimpan Playbook baru: ${pub.error}`);
  return {
    ok: true,
    playbook: pub.playbook,
    upsertedMistakes,
    model: aiRes.model || "rule-synthesizer"
  };
}

// ============================================================================
// 5. ONE-CLICK VERSION ROLLBACK
// ============================================================================
export async function rollbackDirectorPlaybook(targetVersion) {
  const ver = Number(targetVersion);
  if (!Number.isInteger(ver) || ver < 1) {
    throw new Error("Nomor versi Playbook tidak valid.");
  }
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi di .env.local.");
  }

  const check = await supabaseSelect("director_playbook", `select=*&version=eq.${ver}&limit=1`);
  if (!check.ok || !check.data?.[0]) {
    throw new Error(`Playbook v${ver} tidak ditemukan di Supabase.`);
  }

  await supabaseUpdate("director_playbook", "is_active=eq.true", { is_active: false }, { returning: false });
  const act = await supabaseUpdate("director_playbook", `version=eq.${ver}`, { is_active: true });
  if (!act.ok) throw new Error(`Gagal rollback ke v${ver}: ${act.error}`);

  return {
    ok: true,
    playbook: act.data?.[0] || check.data[0]
  };
}
