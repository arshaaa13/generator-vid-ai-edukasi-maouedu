import { verifyAccessPin } from "../../lib/supabase/server.js";
import { evolveDirectorPlaybook } from "../../lib/video-ai/director-brain.js";

export async function POST(request) {
  const auth = verifyAccessPin(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const result = await evolveDirectorPlaybook({
      triggerReason: body?.triggerReason || "Manual Upgrade Brain Now",
      extraNote: body?.extraNote || "",
      geminiApiKey: body?.geminiApiKey || ""
    });
    return Response.json(result);
  } catch (error) {
    console.error("Director evolve error:", error);
    return Response.json({ error: error.message || "Gagal meng-upgrade Playbook." }, { status: 500 });
  }
}
