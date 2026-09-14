import { readCookie, verifySessionToken, COOKIE_NAME } from './_lib/session.js';

// A single root-level middleware, applied to every request. This checks the
// URL pathname directly rather than relying on a folder named "..." to
// drive routing — Windows can't create a dots-only folder name, so the
// actual protected files live under /private/ (see public/_redirects).
// Functions run BEFORE static asset resolution/rewrites, so this still
// sees the real "/.../tools" URL the browser requested, and gates it
// before the rewrite to /private/tools/ ever happens.

function isProtectedPath(pathname) {
  return pathname === '/.../tools' || pathname.startsWith('/.../tools/');
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (!isProtectedPath(url.pathname)) {
    return next();
  }

  const { SESSION_SECRET } = env;
  const token = readCookie(request, COOKIE_NAME);
  const valid = SESSION_SECRET && token && await verifySessionToken(token, SESSION_SECRET);

  if (!valid) {
    return Response.redirect(new URL('/.../', request.url), 302);
  }

  return next();
}
