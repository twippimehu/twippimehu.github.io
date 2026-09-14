import { createSessionToken, verifySessionToken, readCookie, sessionCookieHeader, COOKIE_NAME } from './lib/session.js';

// Cloudflare Workers (with Static Assets) doesn't do folder-based routing
// the way Pages Functions did — this single fetch handler is the entire
// server side of the app: the two auth endpoints, the auth gate on the
// private route, and a manual rewrite so the literal "/..." URL still
// works even though the actual files live in /public/private/ (Windows
// can't create a folder literally named "...").

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const aBytes = enc.encode(a), bBytes = enc.encode(b);
  const len = Math.max(aBytes.length, bBytes.length, 32);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) diff |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
  return diff === 0;
}

function denied() {
  return new Response(JSON.stringify({ error: 'Access denied.' }), {
    status: 401, headers: { 'Content-Type': 'application/json' },
  });
}

async function handleLogin(request, env) {
  const { B_TOOLS_USERNAME, B_TOOLS_PASSWORD, SESSION_SECRET } = env;
  if (!B_TOOLS_USERNAME || !B_TOOLS_PASSWORD || !SESSION_SECRET) {
    return new Response(JSON.stringify({ error: 'Access denied.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
  let body;
  try { body = await request.json(); } catch { return denied(); }
  const { username, password } = body || {};
  if (!safeEqual(username, B_TOOLS_USERNAME) || !safeEqual(password, B_TOOLS_PASSWORD)) return denied();

  const token = await createSessionToken(SESSION_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookieHeader(token) },
  });
}

function handleLogout() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookieHeader('', { clear: true }) },
  });
}

function isProtectedPath(pathname) {
  return pathname === '/.../tools' || pathname.startsWith('/.../tools/');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/login') return handleLogin(request, env);
    if (request.method === 'POST' && url.pathname === '/api/logout') return handleLogout();

    if (isProtectedPath(url.pathname)) {
      const token = readCookie(request, COOKIE_NAME);
      const valid = env.SESSION_SECRET && token && await verifySessionToken(token, env.SESSION_SECRET);
      if (!valid) return Response.redirect(new URL('/.../', request.url), 302);
      // Authenticated — fall through to asset serving below, rewritten to /private/tools/.
      return env.ASSETS.fetch(new Request(new URL('/private/tools/', request.url), request));
    }

    if (url.pathname === '/...' || url.pathname === '/.../') {
      return env.ASSETS.fetch(new Request(new URL('/private/', request.url), request));
    }

    return env.ASSETS.fetch(request);
  },
};
