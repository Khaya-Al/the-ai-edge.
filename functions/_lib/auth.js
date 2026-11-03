const COOKIE = "__Host-aiedge_session";
const SESSION_DAYS = 30;

export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra }
});

export function cookieValue(request) {
  const header = request.headers.get("Cookie") || "";
  const pair = header.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  return pair ? decodeURIComponent(pair.slice(COOKIE.length + 1)) : "";
}

async function sha256(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function toBase64(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function hashPassword(password, saltBytes) {
  const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 210000 }, key, 256);
  return { hash: toBase64(bits), salt: toBase64(salt) };
}

export async function verifyPassword(password, saltBase64, expected) {
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
  const actual = await hashPassword(password, salt);
  return actual.hash === expected;
}

export async function createSession(db, userId) {
  const token = [...crypto.getRandomValues(new Uint8Array(32))].map(x => x.toString(16).padStart(2, "0")).join("");
  const tokenHash = await sha256(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await db.prepare("INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)")
    .bind(crypto.randomUUID(), userId, tokenHash, expires).run();
  return { token, cookie: `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}` };
}

export async function currentUser(request, env) {
  if (!env.DB) return null;
  const token = cookieValue(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    "SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?"
  ).bind(tokenHash, new Date().toISOString()).first();
  return row || null;
}

export async function requireUser(request, env) {
  if (!env.DB) return { error: json({ error: "Account storage is not configured yet. Please try again after setup." }, 503) };
  const user = await currentUser(request, env);
  return user ? { user } : { error: json({ error: "Please sign in to continue." }, 401) };
}

export async function destroySession(request, env) {
  const token = cookieValue(request);
  if (token && env.DB) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(token)).run();
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}
