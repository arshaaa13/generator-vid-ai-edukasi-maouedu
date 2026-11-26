import { synthesizeSpeechStateless } from "../lib/maou-engine.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const text = (body?.text || "").trim();
    if (!text) {
      return Response.json({ error: "Text voiceover tidak boleh kosong." }, { status: 400 });
    }

    const result = await synthesizeSpeechStateless({
      text,
      voiceId: body?.voiceId,
      elevenlabsApiKey: body?.elevenlabsApiKey || "",
      geminiApiKey: body?.geminiApiKey || "",
      forceFallback: Boolean(body?.forceFallback)
    });

    return Response.json(result);
  } catch (error) {
    console.error("TTS endpoint error:", error);
    return Response.json({ error: error.message || "Gagal membuat audio." }, { status: 500 });
  }
}
