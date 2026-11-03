import { json, hashPassword, createSession, sameOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  if (!env.DB) return json({ error: "Account database is not connected yet. The site administrator must finish the Cloudflare setup." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Please send valid form details." }, 400); }
  const name = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (name.length < 2) return json({ error: "Enter your name (at least 2 characters)." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "Enter a valid email address." }, 400);
  if (password.length < 10 || password.length > 128) return json({ error: "Use a password between 10 and 128 characters." }, 400);
  try {
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
    if (existing) return json({ error: "An account with that email already exists. Try signing in." }, 409);
    const { hash, salt } = await hashPassword(password);
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO users (id,name,email,password_hash,password_salt) VALUES (?,?,?,?,?)")
      .bind(id, name, email, hash, salt).run();
    const session = await createSession(env.DB, id);
    return json({ user: { id, name, email } }, 201, { "Set-Cookie": session.cookie });
  } catch (error) {
    console.error("Registration failed", error?.message || "unknown");
    return json({ error: "We couldn't create the account. Please try again." }, 500);
  }
}
