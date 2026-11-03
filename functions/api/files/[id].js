import { json, requireUser } from "../../_lib/auth.js";
export async function onRequestGet({ request, env, params }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const row = await env.DB.prepare("SELECT id,object_key,filename,mime_type,size_bytes FROM user_files WHERE id=? AND user_id=?").bind(params.id, auth.user.id).first();
  if (!row) return json({ error: "File not found." }, 404);
  const object = await env.FILES.get(row.object_key);
  if (!object) return json({ error: "The stored file is unavailable." }, 404);
  return new Response(object.body, { headers: { "Content-Type": row.mime_type, "Content-Disposition": `attachment; filename="${row.filename.replace(/["\\\\]/g,"_")}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function onRequestDelete({ request, env, params }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const row = await env.DB.prepare("SELECT object_key FROM user_files WHERE id=? AND user_id=?").bind(params.id, auth.user.id).first();
  if (!row) return json({ error: "File not found." }, 404);
  await env.FILES.delete(row.object_key);
  await env.DB.prepare("DELETE FROM user_files WHERE id=? AND user_id=?").bind(params.id, auth.user.id).run();
  return json({ ok: true });
}
