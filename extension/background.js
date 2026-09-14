// Background service worker. Holds Auto-Fill state and routes messages
// between the B Tools web app (via bridge.js, a content script scoped to
// benkku.me only) and the actual target page (via content.js, which runs
// everywhere and performs the real DOM work).
//
// No credentials of any kind live here — this extension never talks to
// the B Tools login or session cookie. It only automates pages once the
// person is already using the app.

const BTOOLS_URL_PREFIX_MATCHERS = ['benkku.me', 'localhost', '127.0.0.1'];

let lastTargetTabId = null;

function isBToolsTab(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return BTOOLS_URL_PREFIX_MATCHERS.some(h => u.hostname.includes(h)) && u.pathname.startsWith('/.../');
  } catch { return false; }
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isBToolsTab(tab.url)) lastTargetTabId = tabId;
  } catch {}
});
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'complete' && tab.active && !isBToolsTab(tab.url)) lastTargetTabId = tabId;
});

async function getState() {
  const s = await chrome.storage.local.get({ answers: [], idx: 0 });
  return s;
}
async function setState(patch) {
  const current = await getState();
  await chrome.storage.local.set({ ...current, ...patch });
}

// Relay a message from the target page's content.js back to whichever
// B Tools tab(s) are currently open, so the tool UI can update.
async function relayToBToolsTabs(action, payload) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (isBToolsTab(tab.url)) {
      chrome.tabs.sendMessage(tab.id, { source: 'btools-extension', action, payload }).catch(() => {});
    }
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'autofill-next') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  const { answers, idx } = await getState();
  if (idx >= answers.length) {
    relayToBToolsTabs('autofill:progress', { index: idx, total: answers.length });
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { cmd: 'autofill-fill-value', value: answers[idx] });
    await setState({ idx: idx + 1 });
    relayToBToolsTabs('autofill:progress', { index: idx + 1, total: answers.length });
  } catch {
    // content script not present on this page (e.g. a chrome:// page) — ignore.
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Messages from bridge.js (the B Tools app tab).
  if (msg?.source === 'btools-bridge') {
    handleBridgeMessage(msg, sender).then(sendResponse);
    return true; // keep channel open for async sendResponse
  }
  // Messages from content.js (the target page) reporting results back.
  if (msg?.source === 'btools-content-report') {
    relayToBToolsTabs(msg.action, msg.payload);
  }
});

async function handleBridgeMessage(msg, sender) {
  switch (msg.action) {
    case 'ping':
      return { ok: true };

    case 'autofill:set':
      await setState({ answers: Array.isArray(msg.payload) ? msg.payload : [], idx: 0 });
      return { ok: true };

    case 'autofill:reset':
      await setState({ idx: 0 });
      return { ok: true };

    case 'autotype:start':
    case 'autotype:pause':
    case 'autotype:stop':
    case 'finder:toggle':
    case 'page:inspect':
    case 'dom:action': {
      if (!lastTargetTabId) return { ok: false, error: 'No target tab detected yet — click on the page you want to automate first.' };
      const cmdMap = {
        'autotype:start': 'autotype-start', 'autotype:pause': 'autotype-pause', 'autotype:stop': 'autotype-stop',
        'finder:toggle': 'finder-toggle', 'page:inspect': 'page-inspect', 'dom:action': 'dom-action',
      };
      try {
        await chrome.tabs.sendMessage(lastTargetTabId, { cmd: cmdMap[msg.action], ...(msg.payload || {}) });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: 'Could not reach the target tab. Click into it once, then try again.' };
      }
    }
    default:
      return { ok: false, error: 'Unknown action.' };
  }
}
