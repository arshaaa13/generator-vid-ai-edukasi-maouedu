// Server-Side Supabase REST/Storage Adapter & Access PIN Guard (Pure Node.js ESM — Zero Extra Deps)
// Supports both new `sb_secret_...` opaque keys (`apikey` header only) and legacy JWT `service_role` keys.
// NEVER import this module from frontend `public/` files or expose SUPABASE_SECRET_KEY to the browser.

import crypto from "node:crypto";

export const DEFAULT_PLAYBOOK_V1 = Object.freeze({
  version: 1,
  is_active: true,
  pacing_rules: {
    avg_cut_duration_sec: 2.4,
    max_static_shot_sec: 3.0,
    hook_duration_sec: 2.5,
    host_vs_cutaway_ratio: "45:55",
    transition_duration_sec: 0.15,
    motion_cadence_fps: 12
  },
  camera_rules: {
    hook_motion: "slow_push_in",
    conflict_motion: "dutch_shibuya_shake",
    explain_motion: "pan_left_to_right",
    climax_motion: "crash_zoom_impact",
    preferred_transitions: ["whip_cut", "zoom_punch"]
  },
  composition_rules: {
    aspect_ratio: "9:16",
    safe_margin_px: 48,
    subtitle_bottom_zone_pct: 18,
    character_anchor: "mc_default.jpg",
    never_flip_asymmetrical_horns: true
  },
  prompt_guidelines:
    "Direct dark-action 2D Japanese TV anime cinematography strictly locked to /public/style-anchors/mc_default.jpg (sharp mature male jawline, spiky silver-gray hair with 1 crimson-red center bang, golden-amber eyes, intact curved black left horn, broken magma-cracked right horn, black popped-collar coat with gold trim, crimson diamond lapel brooch, black gloves with silver rings). Alternate dramatic Host shots and full-screen 9:16 dark-anime macro cutaways every 2.2-2.8s. Use ONLY pure Katakana/Kanji SFX.",
  negative_constraints: [
    "no horizontal scanlines across character body",
    "no blinding pure white spotlight diagram boxes",
    "no 3D plastic CGI or chibi drift on Host",
    "no mirrored horns (keep viewer-left intact, viewer-right broken red)",
    "no mixed Katakana-Latin SFX like ズGararara!",
    "no static frozen shots longer than 3.0s"
  ],
  shader_presets: {
    bloomStrength: 0.28,
    lightWrapStrength: 0.44,
    ambientHarmonization: 0.22,
    shadowCrush: 0.14,
    dofBlur: 0.28,
    chromaticPeak: 0.012,
    contrast: 1.1,
    saturation: 1.14,
    rimIntensity: 0.8
  },
  changelog: "Baseline v1 (Lokal/Default): Dark 2D Broadcast Satsuei + mc_default.jpg Identity Lock.",
  parent_version: null
});

const SAMPLE_PIN_LITERALS = new Set([
  "ganti_pin_rahasia_kamu",
  "your_access_pin_here",
  "changeme",
  "123456"
]);

function isPlaceholder(val) {
  const s = String(val || "").trim();
  if (!s) return true;
  return /^(your_|ganti_|replace_|create_your_|https:\/\/your[_-])/i.test(s);
}

export function normalizeSupabaseUrl(rawUrl) {
  const s = String(rawUrl || "").trim();
  if (isPlaceholder(s)) return "";
  return s
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

export function getSupabaseConfig() {
  const url = normalizeSupabaseUrl(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  );
  const rawSecret = String(process.env.SUPABASE_SECRET_KEY || "").trim();
  const secretKey = isPlaceholder(rawSecret) ? "" : rawSecret;
  return {
    url,
    secretKey,
    configured: Boolean(url && secretKey && /^https:\/\/[a-z0-9.-]+/i.test(url))
  };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig().configured;
}

export function getAccessPinStatus() {
  const raw = String(process.env.APP_ACCESS_PIN || "").trim();
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const configured = Boolean(raw && !SAMPLE_PIN_LITERALS.has(raw.toLowerCase()) && !isPlaceholder(raw));
  return {
    configured,
    isProd,
    pinRequired: configured || isProd
  };
}

function readHeader(requestOrHeaders, name) {
  if (!requestOrHeaders) return "";
  const headersObj = requestOrHeaders.headers || requestOrHeaders;
  if (typeof headersObj.get === "function") {
    return String(headersObj.get(name) || headersObj.get(name.toLowerCase()) || "").trim();
  }
  const lower = name.toLowerCase();
  const val = headersObj[lower] ?? headersObj[name] ?? "";
  return Array.isArray(val) ? String(val[0] || "").trim() : String(val).trim();
}

export function verifyAccessPin(requestOrHeaders) {
  const { configured, isProd } = getAccessPinStatus();
  if (!configured) {
    if (isProd) {
      return {
        ok: false,
        status: 403,
        error: "APP_ACCESS_PIN belum dikonfigurasi di server production."
      };
    }
    return { ok: true, status: 200, mode: "local-unpinned" };
  }

  const expected = String(process.env.APP_ACCESS_PIN || "").trim();
  const provided = readHeader(requestOrHeaders, "x-access-pin");
  if (!provided) {
    return {
      ok: false,
      status: 401,
      error: "Masukkan Access PIN terlebih dahulu (header X-Access-Pin)."
    };
  }

  const a = crypto.createHash("sha256").update(expected).digest();
  const b = crypto.createHash("sha256").update(provided).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return {
      ok: false,
      status: 403,
      error: "Access PIN salah. Cek APP_ACCESS_PIN di .env.local atau Vercel."
    };
  }
  return { ok: true, status: 200, mode: "pin-verified" };
}

function buildSupabaseHeaders(secretKey, extraHeaders = {}) {
  const headers = {
    apikey: secretKey,
    ...extraHeaders
  };
  // Legacy JWT keys (eyJ...) require Authorization: Bearer, while new sb_secret_... opaque keys
  // must NOT be sent as Bearer tokens (Supabase Gateway handles them cleanly via `apikey`).
  if (secretKey.startsWith("eyJ") && !headers.Authorization) {
    headers.Authorization = `Bearer ${secretKey}`;
  }
  return headers;
}

export async function supabaseRest(restPath, { method = "GET", body, headers = {} } = {}) {
  const { url, secretKey, configured } = getSupabaseConfig();
  if (!configured) {
    return { ok: false, notConfigured: true, status: 503, error: "Supabase belum dikonfigurasi di .env.local.", data: null };
  }

  const cleanPath = String(restPath || "").replace(/^\/+/, "");
  const endpoint = `${url}/rest/v1/${cleanPath}`;
  const reqHeaders = buildSupabaseHeaders(secretKey, {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...headers
  });

  try {
    const resp = await fetch(endpoint, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12000)
    });
    const text = await resp.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!resp.ok) {
      const msg =
        (data && typeof data === "object" && (data.message || data.error_description || data.hint || data.error)) ||
        `Supabase HTTP ${resp.status}`;
      return { ok: false, status: resp.status, error: String(msg), data };
    }
    return { ok: true, status: resp.status, data, error: null };
  } catch (err) {
    return { ok: false, status: 500, error: err?.message || "Supabase request failed", data: null };
  }
}

export async function supabaseSelect(table, queryString = "") {
  const qs = queryString ? `?${queryString.replace(/^\?/, "")}` : "";
  return supabaseRest(`${table}${qs}`, { method: "GET" });
}

export async function supabaseInsert(table, rowOrRows, { returning = true } = {}) {
  return supabaseRest(table, {
    method: "POST",
    body: rowOrRows,
    headers: {
      Prefer: returning ? "return=representation" : "return=minimal"
    }
  });
}

export async function supabaseUpdate(table, matchQuery, patchObj, { returning = true } = {}) {
  const qs = `?${String(matchQuery || "").replace(/^\?/, "")}`;
  return supabaseRest(`${table}${qs}`, {
    method: "PATCH",
    body: patchObj,
    headers: {
      Prefer: returning ? "return=representation" : "return=minimal"
    }
  });
}

export async function supabaseUpsert(table, rowOrRows, onConflictColumns) {
  const qs = onConflictColumns ? `?on_conflict=${encodeURIComponent(onConflictColumns)}` : "";
  return supabaseRest(`${table}${qs}`, {
    method: "POST",
    body: rowOrRows,
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    }
  });
}

export async function uploadDirectorAsset(storagePath, dataUrlOrBuffer, contentType = "image/jpeg") {
  const { url, secretKey, configured } = getSupabaseConfig();
  if (!configured || !storagePath || !dataUrlOrBuffer) {
    return { ok: false, path: "", reason: "Supabase tidak aktif atau payload kosong." };
  }

  let buf = null;
  let resolvedMime = contentType;
  if (Buffer.isBuffer(dataUrlOrBuffer)) {
    buf = dataUrlOrBuffer;
  } else if (typeof dataUrlOrBuffer === "string") {
    const m = dataUrlOrBuffer.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
    if (!m) return { ok: false, path: "", reason: "Data URL gambar tidak valid." };
    resolvedMime = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
    buf = Buffer.from(m[2], "base64");
  }
  if (!buf || !buf.length) return { ok: false, path: "", reason: "Buffer kosong." };

  const cleanObjectPath = String(storagePath)
    .replace(/^\/+/, "")
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

  const endpoint = `${url}/storage/v1/object/director-assets/${cleanObjectPath}`;
  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: buildSupabaseHeaders(secretKey, {
        "Content-Type": resolvedMime,
        "x-upsert": "true"
      }),
      body: buf,
      signal: AbortSignal.timeout(12000)
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return { ok: false, path: "", reason: txt || `Storage HTTP ${resp.status}` };
    }
    return { ok: true, path: `director-assets/${storagePath}` };
  } catch (err) {
    return { ok: false, path: "", reason: err?.message || "Storage upload failed" };
  }
}
