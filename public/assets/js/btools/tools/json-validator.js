import { field, setStatus } from '../ui-helpers.js';

export const tool = {
  id: 'json-validator', title: 'JSON Validator', icon: '✅', category: 'Developer',
  keywords: ['json','validate','error','lint'],
  width: 500, height: 480,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Validate JSON</div>
      ${field('Input', '<textarea id="jv-in" rows="12" placeholder="Paste JSON…"></textarea>')}
      <button class="btn btn-primary" id="jv-run">Validate</button>
      <div id="jv-status" class="status inf">Ready.</div>
    `;
    body.querySelector('#jv-run').addEventListener('click', () => {
      const status = body.querySelector('#jv-status');
      const text = body.querySelector('#jv-in').value;
      try {
        JSON.parse(text);
        setStatus(status, 'Valid JSON — no errors found.', 'ok');
      } catch (e) {
        const posMatch = e.message.match(/position (\d+)/);
        let extra = '';
        if (posMatch) {
          const pos = +posMatch[1];
          const before = text.slice(0, pos);
          const line = before.split('\n').length;
          const col = pos - before.lastIndexOf('\n');
          extra = ` (approx. line ${line}, column ${col})`;
        }
        setStatus(status, 'Invalid JSON: ' + e.message + extra, 'err');
      }
    });
  }
};
