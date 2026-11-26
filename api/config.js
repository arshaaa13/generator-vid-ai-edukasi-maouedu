import { CHARACTER_BIBLE } from "../lib/maou-engine.js";
import { getStyleAnchorsStatus } from "../lib/video-ai/mappa-asset-generator.js";
import { isVeoHeroEnabled } from "../lib/video-ai/veo-hero-adapter.js";

export async function GET() {
  try {
    return Response.json({
      elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID || CHARACTER_BIBLE.defaultVoiceId,
      hasElevenlabsEnvKey: Boolean(process.env.ELEVENLABS_API_KEY),
      hasGeminiEnvKey: Boolean(process.env.GEMINI_API_KEY),
      enableVeoHeroShots: isVeoHeroEnabled(),
      styleAnchors: getStyleAnchorsStatus(),
      character: CHARACTER_BIBLE
    });
  } catch (error) {
    console.error("Config endpoint error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
