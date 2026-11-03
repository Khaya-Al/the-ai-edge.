import { json, destroySession, sameOrigin } from "../../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const cookie = await destroySession(request, env);
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}
