import { compileGeminiCinemaVideo } from "../lib/gemini-video-renderer.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const scenes = Array.isArray(body?.scenes) ? body.scenes : [];
    if (!scenes.length) {
      return Response.json(
        { error: "Scenes tidak boleh kosong untuk Gemini Cinema Video Renderer." },
        { status: 400 }
      );
    }

    const result = await compileGeminiCinemaVideo({
      topic: body?.topic || "",
      title: body?.title || "",
      scenes,
      geminiApiKey: body?.geminiApiKey || "",
      enableKeyframes: Boolean(body?.enableKeyframes)
    });

    return Response.json(result);
  } catch (error) {
    console.error("Gemini Cinema render error:", error);
    return Response.json(
      { error: error.message || "Gagal merender blueprint video Gemini Cinema." },
      { status: 500 }
    );
  }
}
