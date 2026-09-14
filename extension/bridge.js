// Runs ONLY on the B Tools app pages (see manifest.json matches). Its only
// job is translating window.postMessage <-> chrome.runtime messaging, since
// a normal webpage has no direct access to extension APIs. No page script
// can talk to the extension except through this narrow, fixed message shape.

window.addEventListener('message', (e) => {
  if (e.source !== window) return;
  const msg = e.data;
  if (!msg || msg.source !== 'btools-app') return;

  chrome.runtime.sendMessage({ source: 'btools-bridge', action: msg.action, payload: msg.payload }, (response) => {
    if (msg.action === 'ping' && response?.ok) {
      window.postMessage({ source: 'btools-extension', action: 'pong' }, '*');
    }
    if (response && response.ok === false) {
      window.postMessage({ source: 'btools-extension', action: msg.action + ':error', payload: response.error }, '*');
    }
  });
});

// Messages pushed from the background worker (progress updates, reports).
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.source === 'btools-extension') {
    window.postMessage(msg, '*');
  }
});
