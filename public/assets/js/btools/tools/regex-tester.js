import { field, setStatus } from '../ui-helpers.js';

export const tool = {
  id: 'regex-tester', title: 'Regex Tester', icon: '🧪', category: 'Developer',
  keywords: ['regex','regexp','pattern','match','replace'],
  width: 540, height: 600,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Test a Regular Expression</div>
      <div class="row">
        ${field('Pattern', '<input id="rx-p" placeholder="\\\\d+">')}
        ${field('Flags', '<input id="rx-f" value="g" placeholder="gimsuy" style="max-width:90px">')}
      </div>
      ${field('Test string', '<textarea id="rx-t" rows="8" placeholder="Text to test against…"></textarea>')}
      <div class="grid2">
        <button class="btn btn-primary" id="rx-run">Find matches</button>
        <button class="btn btn-ghost" id="rx-replace">Replace</button>
      </div>
      <div id="rx-status" class="status inf">Ready.</div>
      <div id="rx-out" class="output"></div>
    `;
    const status = body.querySelector('#rx-status');
    body.querySelector('#rx-run').addEventListener('click', () => {
      try {
        const r = new RegExp(body.querySelector('#rx-p').value, body.querySelector('#rx-f').value);
        const s = body.querySelector('#rx-t').value;
        const m = [...s.matchAll(r.global ? r : new RegExp(r.source, r.flags+'g'))];
        body.querySelector('#rx-out').textContent = m.length
          ? m.map((x,i) => `#${i+1}: ${x[0]}${x.length>1 ? '  captures: '+JSON.stringify(x.slice(1)) : ''}  @${x.index}`).join('\n')
          : 'No matches.';
        setStatus(status, `${m.length} match(es).`, 'ok');
      } catch (e) { setStatus(status, e.message, 'err'); }
    });
    body.querySelector('#rx-replace').addEventListener('click', () => {
      const replacement = prompt('Replace matches with:', '') ?? '';
      try {
        const r = new RegExp(body.querySelector('#rx-p').value, body.querySelector('#rx-f').value);
        body.querySelector('#rx-out').textContent = body.querySelector('#rx-t').value.replace(r, replacement);
        setStatus(status, 'Replacement applied.', 'ok');
      } catch (e) { setStatus(status, e.message, 'err'); }
    });
  }
};
