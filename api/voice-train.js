import { calibrateFreeVoiceProfile } from "../lib/voice-ai/voice-trainer.js";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await calibrateFreeVoiceProfile({
      referenceAudioDataUrl: body?.referenceAudioDataUrl || "",
      targetDescription: body?.targetDescription || "",
      presetId: body?.presetId || "maou_overlord",
      sampleText:
        body?.sampleText ||
        "Eh bro, lu pernah mikir nggak kenapa mesin ini bisa muter secepat kilat? TAPI... ternyata ada rahasia fisika gila di baliknya!",
      geminiApiKey: body?.geminiApiKey || ""
    });
    return Response.json(result);
  } catch (error) {
    console.error("Voice trainer error:", error);
    return Response.json({ error: error.message || "Gagal melatih suara gratis." }, { status: 500 });
  }
}
