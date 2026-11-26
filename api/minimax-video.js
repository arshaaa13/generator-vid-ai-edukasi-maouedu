import { handleMinimaxVideo, openMinimaxDownload } from "../lib/minimax.js";

// POST { action: "create" | "status", ... } -> JSON
export async function POST(request) {
  try {
    const body = await request.json();
    const out = await handleMinimaxVideo(body || {});
    return Response.json(out.json, { status: out.status });
  } catch (error) {
    console.error("MiniMax video endpoint error:", error.message);
    return Response.json({ error: error.message || "Gagal memproses video MiniMax." }, { status: 500 });
  }
}

// GET ?action=download&fileId=... (+ optional x-minimax-key header) -> streams the MP4
export async function GET(request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("action") !== "download") {
      return Response.json({ error: "Gunakan POST, atau GET ?action=download&fileId=..." }, { status: 400 });
    }
    const fileId = url.searchParams.get("fileId") || "";
    if (!/^[A-Za-z0-9_-]{4,80}$/.test(fileId)) {
      return Response.json({ error: "fileId tidak valid" }, { status: 400 });
    }
    const dl = await openMinimaxDownload({ fileId, apiKey: request.headers.get("x-minimax-key") || "" });
    if (!dl.ok) return Response.json({ error: dl.error }, { status: dl.status });
    return new Response(dl.upstream.body, {
      status: 200,
      headers: { "Content-Type": "video/mp4", "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("MiniMax download error:", error.message);
    return Response.json({ error: error.message || "Gagal mengunduh video." }, { status: 500 });
  }
}
