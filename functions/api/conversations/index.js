import { json, requireUser } from "../../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const rows = await env.DB.prepare("SELECT id,title,agent,created_at,updated_at FROM conversations WHERE user_id=? ORDER BY updated_at DESC LIMIT 100").bind(auth.user.id).all();
  return json({ conversations: rows.results || [] });
}
export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  let body = {}; try { body = await request.json(); } catch {}
  const id = crypto.randomUUID();
  const agent = ["tutor","research","maths","engineering","programming","writing","design","exam","quality","career"].includes(body.agent) ? body.agent : "tutor";
  const title = String(body.title || "New conversation").trim().slice(0, 100) || "New conversation";
  await env.DB.prepare("INSERT INTO conversations (id,user_id,title,agent) VALUES (?,?,?,?)").bind(id, auth.user.id, title, agent).run();
  return json({ conversation: { id, title, agent } }, 201);
}
