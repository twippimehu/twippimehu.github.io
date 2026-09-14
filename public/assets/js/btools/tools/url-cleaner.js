import { field } from '../ui-helpers.js';

const TRACKING_PARAMS = /^(utm_.*|fbclid|gclid|mc_cid|mc_eid|igshid|ref|ref_src)$/i;

export const tool = {
  id: 'url-cleaner', title: 'URL Cleaner', icon: '🧼', category: 'Web',
  keywords: ['url','tracking','utm','fbclid','gclid','clean'],
  width: 500, height: 480,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Remove Tracking Parameters</div>
      <div class="status inf">Removes known tracking params (utm_*, fbclid, gclid, mc_cid, mc_eid, and similar) conservatively — everything else is left untouched.</div>
      ${field('URL(s) — one per line', '<textarea id="uc-in" rows="7"></textarea>')}
      <button class="btn btn-primary" id="uc-run">Clean</button>
      ${field('Output', '<textarea id="uc-out" rows="7" readonly></textarea>')}
      <button class="btn btn-ghost" id="uc-copy">Copy</button>
    `;
    body.querySelector('#uc-run').addEventListener('click', () => {
      const out = body.querySelector('#uc-in').value.split('\n').map(s => s.trim()).filter(Boolean).map(s => {
        try {
          const u = new URL(s);
          [...u.searchParams.keys()].forEach(k => { if (TRACKING_PARAMS.test(k)) u.searchParams.delete(k); });
          return u.toString();
        } catch { return s; }
      });
      body.querySelector('#uc-out').value = out.join('\n');
    });
    body.querySelector('#uc-copy').addEventListener('click', () => navigator.clipboard?.writeText(body.querySelector('#uc-out').value));
  }
};
