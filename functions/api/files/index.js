import { json, requireUser } from "../../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const rows = await env.DB.prepare("SELECT id,conversation_id,filename,mime_type,size_bytes,created_at FROM user_files WHERE user_id=? ORDER BY created_at DESC LIMIT 100").bind(auth.user.id).all();
  return json({ files: rows.results || [] });
}
