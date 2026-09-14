// Runs on every page (see manifest.json). This is where the actual DOM
// work happens — Auto-Fill, Auto-Type, Element Finder, Page Inspector and
// DOM Playground all execute here, triggered by messages from the
// background service worker. Nothing in this file runs on its own; it is
// always a direct response to something the person did in B Tools.

function nativeSet(el, value) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value); else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function fillFocused(value) {
  const el = document.activeElement;
  if (!el) return;
  if (el.isContentEditable) {
    el.textContent = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    nativeSet(el, value);
  }
}

// ---- Auto-Type ----
let autotypeTimer = null, autotypeState = null;
function autotypeStart({ text, speed, humanize }) {
  autotypeStop();
  const el = document.activeElement;
  if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && !el.isContentEditable)) return;
  autotypeState = { text, speed, humanize, i: 0, el, paused: false };
  step();
}
function step() {
  if (!autotypeState || autotypeState.paused) return;
  const s = autotypeState;
  if (s.i >= s.text.length) {
    chrome.runtime.sendMessage({ source: 'btools-content-report', action: 'autotype:done', payload: {} });
    autotypeState = null;
    return;
  }
  const ch = s.text[s.i];
  if (ch === '\n') {
    if (s.el.tagName === 'TEXTAREA') nativeSet(s.el, s.el.value + '\n');
    else s.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  } else if (s.el.isContentEditable) {
    s.el.textContent += ch;
    s.el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  } else {
    nativeSet(s.el, s.el.value + ch);
  }
  s.i++;
  chrome.runtime.sendMessage({ source: 'btools-content-report', action: 'autotype:progress', payload: { typed: s.i, total: s.text.length } });
  const jitter = s.humanize ? Math.random() * s.speed * 0.6 : 0;
  autotypeTimer = setTimeout(step, s.speed + jitter);
}
function autotypePause() { if (autotypeState) autotypeState.paused = !autotypeState.paused; if (autotypeState && !autotypeState.paused) step(); clearTimeout(autotypeTimer); }
function autotypeStop() { clearTimeout(autotypeTimer); autotypeState = null; }

// ---- Element Finder ----
let finderOn = false, overlay = null;
function cssSelector(el) {
  if (el.id) return '#' + CSS.escape(el.id);
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && parts.length < 6) {
    let sel = node.tagName.toLowerCase();
    if (node.classList.length) sel += '.' + [...node.classList].slice(0,2).map(CSS.escape).join('.');
    const parent = node.parentElement;
    if (parent) {
      const siblings = [...parent.children].filter(c => c.tagName === node.tagName);
      if (siblings.length > 1) sel += `:nth-of-type(${siblings.indexOf(node)+1})`;
    }
    parts.unshift(sel);
    node = node.parentElement;
  }
  return parts.join(' > ');
}
function xpathOf(el) {
  if (el.id) return `//*[@id="${el.id}"]`;
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1) {
    let index = 1, sib = node.previousElementSibling;
    while (sib) { if (sib.tagName === node.tagName) index++; sib = sib.previousElementSibling; }
    parts.unshift(`${node.tagName.toLowerCase()}[${index}]`);
    node = node.parentElement;
  }
  return '/' + parts.join('/');
}
function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  Object.assign(overlay.style, { position: 'fixed', pointerEvents: 'none', border: '2px solid #7c5cfc', background: 'rgba(124,92,252,0.12)', zIndex: 2147483647, transition: 'all .05s' });
  document.documentElement.appendChild(overlay);
  return overlay;
}
function onFinderMove(e) {
  const r = e.target.getBoundingClientRect();
  const o = ensureOverlay();
  Object.assign(o.style, { display: 'block', top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' });
}
function onFinderClick(e) {
  e.preventDefault(); e.stopPropagation();
  const el = e.target;
  chrome.runtime.sendMessage({
    source: 'btools-content-report', action: 'finder:picked',
    payload: {
      tag: el.tagName.toLowerCase(), id: el.id, classes: [...el.classList].join(' '),
      width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height),
      selector: cssSelector(el), xpath: xpathOf(el),
    },
  });
}
function finderToggle({ on }) {
  finderOn = on;
  if (on) {
    document.addEventListener('mousemove', onFinderMove, true);
    document.addEventListener('click', onFinderClick, true);
  } else {
    document.removeEventListener('mousemove', onFinderMove, true);
    document.removeEventListener('click', onFinderClick, true);
    if (overlay) overlay.style.display = 'none';
  }
}

// ---- Page Inspector ----
function pageInspect() {
  const emails = [...document.body.innerText.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m => m[0]).slice(0,20);
  chrome.runtime.sendMessage({
    source: 'btools-content-report', action: 'page:report',
    payload: {
      title: document.title, url: location.href, domain: location.hostname,
      headings: document.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
      links: document.querySelectorAll('a[href]').length,
      images: document.querySelectorAll('img').length,
      forms: document.querySelectorAll('form').length,
      inputs: document.querySelectorAll('input,textarea,select').length,
      buttons: document.querySelectorAll('button').length,
      emails: [...new Set(emails)],
    },
  });
}

// ---- DOM Playground ----
function domAction({ selector, action, value }) {
  let ok = true, message = '';
  try {
    const el = document.querySelector(selector);
    if (!el) { chrome.runtime.sendMessage({ source: 'btools-content-report', action: 'dom:result', payload: { ok: false, message: 'No element matched that selector.' } }); return; }
    switch (action) {
      case 'text': el.textContent = value; message = 'Text updated.'; break;
      case 'html': el.innerHTML = value; message = 'HTML updated. (This can execute scripts — only use on pages and markup you trust.)'; break;
      case 'addClass': el.classList.add(value); message = 'Class added.'; break;
      case 'removeClass': el.classList.remove(value); message = 'Class removed.'; break;
      case 'setAttr': { const [k,...rest] = value.split('='); el.setAttribute(k.trim(), rest.join('=')); message = 'Attribute set.'; break; }
      case 'hide': el.style.display = 'none'; message = 'Hidden.'; break;
      case 'show': el.style.display = ''; message = 'Shown.'; break;
      case 'click': el.click(); message = 'Clicked.'; break;
      default: ok = false; message = 'Unknown action.';
    }
    if (ok) flashElement(el);
  } catch (e) { ok = false; message = e.message; }
  chrome.runtime.sendMessage({ source: 'btools-content-report', action: 'dom:result', payload: { ok, message } });
}
function flashElement(el) {
  const prev = el.style.outline;
  el.style.outline = '2px solid #7c5cfc';
  setTimeout(() => { el.style.outline = prev; }, 500);
}

chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.cmd) {
    case 'autofill-fill-value': fillFocused(msg.value); break;
    case 'autotype-start': autotypeStart(msg); break;
    case 'autotype-pause': autotypePause(); break;
    case 'autotype-stop': autotypeStop(); break;
    case 'finder-toggle': finderToggle(msg); break;
    case 'page-inspect': pageInspect(); break;
    case 'dom-action': domAction(msg); break;
  }
});
