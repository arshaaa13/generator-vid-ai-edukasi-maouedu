import { analyzeTikTokUrl } from "../lib/maou-engine.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const url = (body?.url || "").trim();
    if (!url) {
      return Response.json({ error: "Masukkan link TikTok terlebih dahulu." }, { status: 400 });
    }
    const analysis = await analyzeTikTokUrl(url);
    return Response.json(analysis);
  } catch (error) {
    console.error("Analyze TikTok error:", error);
    return Response.json({ error: error.message || "Gagal menganalisa link TikTok." }, { status: 500 });
  }
}
