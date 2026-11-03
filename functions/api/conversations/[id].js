import { json, requireUser } from "../../_lib/auth.js";
export async function onRequestGet({ request, env, params }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const conversation = await env.DB.prepare("SELECT id,title,agent,created_at,updated_at FROM conversations WHERE id=? AND user_id=?").bind(params.id, auth.user.id).first();
  if (!conversation) return json({ error: "Conversation not found." }, 404);
  const messages = await env.DB.prepare("SELECT id,role,content,created_at FROM messages WHERE conversation_id=? AND user_id=? ORDER BY created_at ASC LIMIT 200").bind(params.id, auth.user.id).all();
  const files = await env.DB.prepare("SELECT id,filename,mime_type,size_bytes,extracted_text FROM user_files WHERE conversation_id=? AND user_id=? ORDER BY created_at ASC").bind(params.id, auth.user.id).all();
  return json({ conversation, messages: messages.results || [], files: files.results || [] });
}
export async function onRequestPatch({ request, env, params }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  let body; try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const title = String(body.title || "").trim().slice(0, 100);
  if (!title) return json({ error: "A title is required." }, 400);
  const result = await env.DB.prepare("UPDATE conversations SET title=?,updated_at=datetime('now') WHERE id=? AND user_id=?").bind(title, params.id, auth.user.id).run();
  return result.meta.changes ? json({ ok: true }) : json({ error: "Conversation not found." }, 404);
}
export async function onRequestDelete({ request, env, params }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const fileRows = await env.DB.prepare("SELECT object_key FROM user_files WHERE conversation_id=? AND user_id=?").bind(params.id, auth.user.id).all();
  if (env.FILES) await Promise.all((fileRows.results || []).map(file => env.FILES.delete(file.object_key)));
  const result = await env.DB.prepare("DELETE FROM conversations WHERE id=? AND user_id=?").bind(params.id, auth.user.id).run();
  return result.meta.changes ? json({ ok: true }) : json({ error: "Conversation not found." }, 404);
}
