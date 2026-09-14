import { field, setStatus } from '../ui-helpers.js';

export const tool = {
  id: 'json-formatter', title: 'JSON Formatter', icon: '🧠', category: 'Developer',
  keywords: ['json','format','minify','pretty','sort keys'],
  width: 520, height: 580,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Format / Minify JSON</div>
      ${field('Input', '<textarea id="js-in" rows="10" placeholder=\'{"hello":"world"}\'></textarea>')}
      <div class="grid3">
        <button class="btn btn-primary" id="js-fmt">Format</button>
        <button class="btn btn-ghost" id="js-min">Minify</button>
        <button class="btn btn-ghost" id="js-sort">Sort keys</button>
      </div>
      <div id="js-status" class="status inf">Ready.</div>
      ${field('Output', '<textarea id="js-out" rows="10" readonly></textarea>')}
      <div class="row">
        <button class="btn btn-ghost" id="js-copy">Copy</button>
        <button class="btn btn-ghost" id="js-download">Download</button>
      </div>
    `;
    const status = body.querySelector('#js-status');
    function sortKeys(o) {
      if (Array.isArray(o)) return o.map(sortKeys);
      if (o && typeof o === 'object') return Object.fromEntries(Object.keys(o).sort().map(k => [k, sortKeys(o[k])]));
      return o;
    }
    function run(mode) {
      try {
        let obj = JSON.parse(body.querySelector('#js-in').value);
        if (mode === 'sort') obj = sortKeys(obj);
        body.querySelector('#js-out').value = mode === 'min' ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);
        setStatus(status, 'Valid JSON.', 'ok');
      } catch (e) {
        setStatus(status, 'Invalid JSON: ' + e.message, 'err');
        body.querySelector('#js-out').value = '';
      }
    }
    body.querySelector('#js-fmt').addEventListener('click', () => run('fmt'));
    body.querySelector('#js-min').addEventListener('click', () => run('min'));
    body.querySelector('#js-sort').addEventListener('click', () => run('sort'));
    body.querySelector('#js-copy').addEventListener('click', () => navigator.clipboard?.writeText(body.querySelector('#js-out').value));
    body.querySelector('#js-download').addEventListener('click', () => {
      const blob = new Blob([body.querySelector('#js-out').value], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'data.json'; a.click();
    });
  }
};
