import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CHARACTER_BIBLE,
  analyzeTikTokUrl,
  generateScriptFromPrompt,
  synthesizeSpeechStateless
} from "./lib/maou-engine.js";
import { compileGeminiCinemaVideo } from "./lib/gemini-video-renderer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

// Load local .env.local or .env automatically if present (never committed to git)
for (const envFile of [".env.local", ".env"]) {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    const lines = await fsp.readFile(envPath, "utf-8");
    for (const line of lines.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
      }
    }
  }
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  try {
    if (pathname === "/api/config" && req.method === "GET") {
      return sendJson(res, 200, {
        elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID || CHARACTER_BIBLE.defaultVoiceId,
        hasElevenlabsEnvKey: Boolean(process.env.ELEVENLABS_API_KEY),
        hasGeminiEnvKey: Boolean(process.env.GEMINI_API_KEY),
        character: CHARACTER_BIBLE
      });
    }

    if (pathname === "/api/analyze-tiktok" && req.method === "POST") {
      const { url } = await readJsonBody(req);
      if (!url) return sendJson(res, 400, { error: "Masukkan link TikTok terlebih dahulu." });
      return sendJson(res, 200, await analyzeTikTokUrl(url));
    }

    if (
      (pathname === "/api/research-and-script" || pathname === "/api/generate-script") &&
      req.method === "POST"
    ) {
      const body = await readJsonBody(req);
      const prompt = (body?.prompt || body?.topic || "").trim();
      if (!prompt) return sendJson(res, 400, { error: "Masukkan prompt terlebih dahulu." });
      const result = await generateScriptFromPrompt({
        prompt,
        referenceUrl: body?.referenceUrl || "",
        geminiApiKey: body?.geminiApiKey || ""
      });
      return sendJson(res, 200, result);
    }

    if (pathname === "/api/gemini-render" && req.method === "POST") {
      const body = await readJsonBody(req);
      const scenes = Array.isArray(body?.scenes) ? body.scenes : [];
      if (!scenes.length) {
        return sendJson(res, 400, { error: "Scenes tidak boleh kosong untuk Gemini Cinema." });
      }
      const result = await compileGeminiCinemaVideo({
        topic: body?.topic || "",
        title: body?.title || "",
        scenes,
        geminiApiKey: body?.geminiApiKey || "",
        enableKeyframes: Boolean(body?.enableKeyframes)
      });
      return sendJson(res, 200, result);
    }

    if (pathname === "/api/tts" && req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body?.text) return sendJson(res, 400, { error: "Text kosong" });
      const result = await synthesizeSpeechStateless({
        text: body.text,
        voiceId: body.voiceId,
        elevenlabsApiKey: body.elevenlabsApiKey || ""
      });
      return sendJson(res, 200, result);
    }

    const filePath = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "no-cache"
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  } catch (err) {
    console.error("Local server error:", err);
    sendJson(res, 500, { error: err.message || "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`MaouEdu AI Video Studio running locally at http://localhost:${PORT}`);
});
