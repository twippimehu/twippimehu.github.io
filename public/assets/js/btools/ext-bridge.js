// Thin client for talking to the B Tools browser extension from inside the
// web app. The extension's bridge.js content script (matched only on this
// site) relays these postMessage calls to the background service worker —
// the page itself has no direct extension API access, by design.

const listeners = new Set();
let extensionSeen = false;

window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  const msg = e.data;
  if (!msg || msg.source !== 'btools-extension') return;
  extensionSeen = true;
  listeners.forEach(fn => fn(msg));
});

export function isExtensionPresent() {
  return extensionSeen;
}

export function pingExtension() {
  window.postMessage({ source: 'btools-app', action: 'ping' }, '*');
}

export function sendToExtension(action, payload) {
  window.postMessage({ source: 'btools-app', action, payload }, '*');
}

export function onExtensionMessage(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Kick a ping on load so tools can show "extension connected / not detected".
pingExtension();
setTimeout(pingExtension, 400);
