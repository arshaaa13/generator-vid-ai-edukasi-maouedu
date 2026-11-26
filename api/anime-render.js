import { compileAnimeMappaVideo } from "../lib/video-ai/anime-director.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const scenes = Array.isArray(body?.scenes) ? body.scenes : [];
    if (!scenes.length) {
      return Response.json(
        { error: "Scenes tidak boleh kosong untuk Mode Anime MAPPA Sakuga." },
        { status: 400 }
      );
    }

    const result = await compileAnimeMappaVideo({
      topic: body?.topic || "",
      title: body?.title || "",
      scenes,
      geminiApiKey: body?.geminiApiKey || "",
      styleMemoryHints: Array.isArray(body?.styleMemoryHints) ? body.styleMemoryHints : []
    });

    return Response.json(result);
  } catch (error) {
    console.error("Anime MAPPA render error:", error);
    return Response.json(
      { error: error.message || "Gagal merender blueprint Anime MAPPA Sakuga." },
      { status: 500 }
    );
  }
}
