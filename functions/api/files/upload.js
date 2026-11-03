import { json, requireUser, sameOrigin } from "../../_lib/auth.js";
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain","text/markdown","image/png","image/jpeg","image/webp"]);
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  if (!env.FILES) return json({ error: "File storage is not connected yet. The site administrator must finish the Cloudflare setup." }, 503);
  let form; try { form = await request.formData(); } catch { return json({ error: "Upload a valid file." }, 400); }
  const file = form.get("file");
  const conversationId = String(form.get("conversationId") || "");
  const extractedText = String(form.get("extractedText") || "").slice(0, 50000);
  if (!file || typeof file.arrayBuffer !== "function") return json({ error: "Choose a file first." }, 400);
  if (file.size < 1 || file.size > MAX_BYTES) return json({ error: "Files must be smaller than 8 MB." }, 413);
  if (!TYPES.has(file.type)) return json({ error: "Supported files: PDF, DOCX, TXT, Markdown, PNG, JPG and WebP." }, 415);
  if (conversationId) {
    const owned = await env.DB.prepare("SELECT id FROM conversations WHERE id=? AND user_id=?").bind(conversationId, auth.user.id).first();
    if (!owned) return json({ error: "Conversation not found." }, 404);
  }
  const id = crypto.randomUUID();
  const safeName = String(file.name || "upload").replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120);
  const key = `users/${auth.user.id}/${id}`;
  try {
    await env.FILES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    await env.DB.prepare("INSERT INTO user_files (id,user_id,conversation_id,object_key,filename,mime_type,size_bytes,extracted_text) VALUES (?,?,?,?,?,?,?,?)")
      .bind(id, auth.user.id, conversationId || null, key, safeName, file.type, file.size, extractedText).run();
    return json({ file: { id, filename: safeName, mimeType: file.type, size: file.size, extractedText } }, 201);
  } catch (error) {
    await env.FILES.delete(key).catch(() => {});
    console.error("File upload failed", error?.message || "unknown");
    return json({ error: "The file could not be saved. Please try again." }, 500);
  }
}
