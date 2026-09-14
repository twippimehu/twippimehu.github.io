export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function field(label, inputHtml) {
  return `<div><div class="field-label">${esc(label)}</div>${inputHtml}</div>`;
}

export function statbox(k, v) {
  return `<div class="statbox"><div class="k">${esc(k)}</div><div class="v" style="font-size:13px">${esc(v)}</div></div>`;
}

export function copyText(text, btnEl) {
  navigator.clipboard?.writeText(text).then(() => {
    if (btnEl) {
      const original = btnEl.innerHTML;
      btnEl.innerHTML = '✓ Copied';
      setTimeout(() => { btnEl.innerHTML = original; }, 1200);
    }
  }).catch(() => {});
}

export function setStatus(el, msg, cls = 'inf') {
  if (!el) return;
  el.className = 'status ' + cls;
  el.textContent = msg;
}

// Every tool renders into an isolated container and should never let a
// thrown error take down the rest of the app. Wrap tool-supplied event
// handlers with this so one broken tool can't crash the desktop.
export function safe(fn) {
  return (...args) => {
    try { return fn(...args); }
    catch (e) {
      console.error('[B Tools] tool error:', e);
    }
  };
}
