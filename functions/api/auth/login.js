import { json, verifyPassword, createSession, sameOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  if (!env.DB) return json({ error: "Account database is not connected yet. The site administrator must finish the Cloudflare setup." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Please send valid login details." }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return json({ error: "Enter your email and password." }, 400);
  try {
    const row = await env.DB.prepare("SELECT id,name,email,password_hash,password_salt FROM users WHERE email=?").bind(email).first();
    if (!row || !(await verifyPassword(password, row.password_salt, row.password_hash))) {
      return json({ error: "Email or password is incorrect." }, 401);
    }
    const session = await createSession(env.DB, row.id);
    return json({ user: { id: row.id, name: row.name, email: row.email } }, 200, { "Set-Cookie": session.cookie });
  } catch (error) {
    console.error("Login failed", error?.message || "unknown");
    return json({ error: "We couldn't sign you in. Please try again." }, 500);
  }
}
