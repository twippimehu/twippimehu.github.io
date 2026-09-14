import { esc } from '../ui-helpers.js';

export const tool = {
  id: 'clipboard-manager', title: 'Clipboard Manager', icon: '📋', category: 'Productivity',
  keywords: ['clipboard','history','paste','copy'],
  width: 460, height: 540,
  build(body) {
    const KEY = 'btools-v3.clips';
    const data = () => { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } };
    const save = a => localStorage.setItem(KEY, JSON.stringify(a.slice(0,50)));

    body.innerHTML = `
      <div class="section-head">Local Clipboard History</div>
      <textarea id="cb-in" rows="4" placeholder="Paste a snippet here and save it…"></textarea>
      <div class="row">
        <button class="btn btn-primary" id="cb-add">Save item</button>
        <button class="btn btn-danger" id="cb-clear">Clear</button>
      </div>
      <div class="searchbox"><span>⌕</span><input id="cb-search" placeholder="Search saved clips…"></div>
      <div id="cb-list"></div>
      <div class="status inf">The B Tools extension can auto-capture copies on pages where it's enabled — see the Downloads page. This manager always works for anything you paste here manually.</div>
    `;

    function render() {
      const q = (body.querySelector('#cb-search').value||'').toLowerCase();
      const items = data().filter(x => x.toLowerCase().includes(q));
      body.querySelector('#cb-list').innerHTML = items.length ? items.map(x => `
        <div class="statbox" style="margin-bottom:7px">
          <div style="white-space:pre-wrap;word-break:break-word;max-height:72px;overflow:auto">${esc(x)}</div>
          <div class="row" style="margin-top:7px">
            <button class="btn btn-primary cb-copy" data-v="${esc(x)}">Copy</button>
            <button class="btn btn-danger cb-del" data-v="${esc(x)}">Delete</button>
          </div>
        </div>`).join('') : '<div class="empty">No saved clips.</div>';
    }

    body.querySelector('#cb-add').addEventListener('click', () => {
      const v = body.querySelector('#cb-in').value.trim();
      if (!v) return;
      const a = data().filter(x => x !== v);
      a.unshift(v); save(a);
      body.querySelector('#cb-in').value = '';
      render();
    });
    body.querySelector('#cb-clear').addEventListener('click', () => { save([]); render(); });
    body.querySelector('#cb-search').addEventListener('input', render);
    body.querySelector('#cb-list').addEventListener('click', e => {
      const copyBtn = e.target.closest('.cb-copy'), delBtn = e.target.closest('.cb-del');
      if (copyBtn) navigator.clipboard?.writeText(copyBtn.dataset.v);
      if (delBtn) { save(data().filter(x => x !== delBtn.dataset.v)); render(); }
    });
    render();
  }
};
