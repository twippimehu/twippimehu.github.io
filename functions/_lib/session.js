// Minimal signed-session helper for Cloudflare Pages Functions.
// The session is a compact, HMAC-signed token stored in an HttpOnly cookie.
// It is NOT a JWT library dependency — just Web Crypto, which is available
// natively in the Workers/Pages runtime with zero npm install required.

export const COOKIE_NAME = 'btools_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function base64url(bytes) {
  let str = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function hmacKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
}

export async function createSessionToken(secret) {
  const payload = JSON.stringify({ sub: 'btools', exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
  const payloadBytes = new TextEncoder().encode(payload);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, payloadBytes);
  return `${base64url(payloadBytes)}.${base64url(sig)}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || !token.includes('.')) return false;
  const [payloadPart, sigPart] = token.split('.');
  try {
    const payloadBytes = base64urlToBytes(payloadPart);
    const sigBytes = base64urlToBytes(sigPart);
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, payloadBytes);
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookieHeader(token, { clear = false } = {}) {
  const parts = [
    `${COOKIE_NAME}=${clear ? '' : token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    clear ? 'Max-Age=0' : `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  return parts.join('; ');
}
