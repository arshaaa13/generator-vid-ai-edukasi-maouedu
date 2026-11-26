import { verifyAccessPin } from "../../lib/supabase/server.js";
import { rollbackDirectorPlaybook } from "../../lib/video-ai/director-brain.js";

export async function POST(request) {
  const auth = verifyAccessPin(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const result = await rollbackDirectorPlaybook(body?.version);
    return Response.json(result);
  } catch (error) {
    console.error("Director rollback error:", error);
    return Response.json({ error: error.message || "Gagal rollback Playbook." }, { status: 500 });
  }
}
