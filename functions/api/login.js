import { createSessionToken, sessionCookieHeader } from '../_lib/session.js';

// Constant-time-ish string compare to avoid trivially leaking length/content
// via early-exit timing. Not a substitute for rate limiting (see README).
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  const len = Math.max(aBytes.length, bBytes.length, 32);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
  }
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  const { B_TOOLS_USERNAME, B_TOOLS_PASSWORD, SESSION_SECRET } = env;

  if (!B_TOOLS_USERNAME || !B_TOOLS_PASSWORD || !SESSION_SECRET) {
    // Server misconfigured — never fall back to a hardcoded default.
    return new Response(JSON.stringify({ error: 'Access denied.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return denied();
  }

  const { username, password } = body || {};
  const ok = safeEqual(username, B_TOOLS_USERNAME) && safeEqual(password, B_TOOLS_PASSWORD);

  if (!ok) return denied();

  const token = await createSessionToken(SESSION_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookieHeader(token),
    },
  });
}

function denied() {
  // Deliberately generic — never reveals whether the username or the
  // password was the one that was wrong.
  return new Response(JSON.stringify({ error: 'Access denied.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
