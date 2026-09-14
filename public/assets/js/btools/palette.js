import { searchTools } from './registry.js';
import { esc } from './ui-helpers.js';
import { state } from './state.js';

let selected = 0;
let results = [];
let onLaunch = null;

export function initPalette(launchFn) {
  onLaunch = launchFn;
  const overlay = document.getElementById('paletteOverlay');
  const input = document.getElementById('paletteInput');
  const list = document.getElementById('paletteResults');

  function render() {
    const q = input.value;
    results = searchTools(q);
    if (!q) {
      // Show recents then favorites then everything else, deduped.
      const byId = id => results.find(t => t.id === id);
      const ordered = [
        ...state.recent.map(byId).filter(Boolean),
        ...results.filter(t => !state.recent.includes(t.id)),
      ];
      results = [...new Map(ordered.map(t => [t.id, t])).values()];
    }
    selected = 0;
    list.innerHTML = results.length ? results.map((t, i) => `
      <div class="result ${i === 0 ? 'selected' : ''}" data-id="${t.id}">
        <div class="ico">${t.icon}</div>
        <div class="meta">
          <div class="title">${esc(t.title)} ${state.favorites.includes(t.id) ? '★' : ''}</div>
          <div class="sub">${esc(t.category)}${state.recent.includes(t.id) ? ' · Recent' : ''}</div>
        </div>
      </div>
    `).join('') : '<div class="empty">No tools match.</div>';
  }

  function highlight() {
    [...list.children].forEach((el, i) => el.classList.toggle('selected', i === selected));
    list.children[selected]?.scrollIntoView({ block: 'nearest' });
  }

  function launch(id) {
    close();
    onLaunch?.(id);
  }

  function open() {
    overlay.classList.add('open');
    input.value = '';
    render();
    input.focus();
  }
  function close() {
    overlay.classList.remove('open');
  }

  input.addEventListener('input', render);
  list.addEventListener('click', e => {
    const r = e.target.closest('.result');
    if (r) launch(r.dataset.id);
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.classList.contains('open') ? close() : open();
      return;
    }
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowDown') { e.preventDefault(); selected = Math.min(selected + 1, results.length - 1); highlight(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); selected = Math.max(selected - 1, 0); highlight(); }
    if (e.key === 'Enter' && results[selected]) launch(results[selected].id);
  });

  return { open, close };
}
