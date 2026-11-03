import { json, currentUser } from "../../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ authenticated: false, setupRequired: true }, 200);
  const user = await currentUser(request, env);
  return json({ authenticated: Boolean(user), user });
}
