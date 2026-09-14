import { field } from '../ui-helpers.js';

export const tool = {
  id: 'url-toolkit', title: 'URL Toolkit', icon: '🔗', category: 'Web',
  keywords: ['url','parse','domain','path','query','encode','decode'],
  width: 520, height: 560,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Parse, Encode & Decode URLs</div>
      ${field('URL(s) — one per line', '<textarea id="url-in" rows="6" placeholder="https://example.com/path?x=1"></textarea>')}
      <div class="grid2">
        <button class="btn btn-primary" id="url-inspect">Inspect</button>
        <button class="btn btn-ghost" id="url-domains">Extract domains</button>
        <button class="btn btn-ghost" id="url-enc">Encode</button>
        <button class="btn btn-ghost" id="url-dec">Decode</button>
      </div>
      ${field('Output', '<textarea id="url-out" rows="9" readonly></textarea>')}
    `;
    const lines = () => body.querySelector('#url-in').value.split('\n').map(x=>x.trim()).filter(Boolean);
    body.querySelector('#url-inspect').addEventListener('click', () => {
      body.querySelector('#url-out').value = lines().map(s => {
        try { const u = new URL(s); return `URL: ${u.href}\nOrigin: ${u.origin}\nDomain: ${u.hostname}\nPath: ${u.pathname}\nQuery: ${u.search}\nHash: ${u.hash}`; }
        catch { return 'Invalid URL: ' + s; }
      }).join('\n\n');
    });
    body.querySelector('#url-domains').addEventListener('click', () => {
      body.querySelector('#url-out').value = [...new Set(lines().map(s => { try { return new URL(s).hostname; } catch { return ''; } }).filter(Boolean))].join('\n');
    });
    body.querySelector('#url-enc').addEventListener('click', () => {
      body.querySelector('#url-out').value = lines().map(l => { try { return encodeURIComponent(l); } catch { return l; } }).join('\n');
    });
    body.querySelector('#url-dec').addEventListener('click', () => {
      body.querySelector('#url-out').value = lines().map(l => { try { return decodeURIComponent(l); } catch { return l; } }).join('\n');
    });
  }
};
