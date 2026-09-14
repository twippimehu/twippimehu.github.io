import { field, statbox } from '../ui-helpers.js';

function safeCalcExpr(s) {
  if (!/^[0-9+\-*/%().,\s^]+$/.test(s)) throw new Error('Only numeric expressions and arithmetic operators are allowed.');
  s = s.replace(/\^/g, '**');
  // Sandboxed to arithmetic-only input validated above — never receives arbitrary code.
  return Function('"use strict";return (' + s + ')')();
}

export const tool = {
  id: 'dev-calculator', title: 'Developer Calculator', icon: '🧮', category: 'Developer',
  keywords: ['calculator','math','binary','hex','bytes','percentage'],
  width: 480, height: 540,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Expression Evaluator</div>
      ${field('Expression', '<input id="ca-in" value="1920 / 60" placeholder="2^10 + 5 * 3">')}
      <button class="btn btn-primary" id="ca-run">Evaluate</button>
      <div id="ca-out" class="grid2"></div>
      <div class="section-head">Byte / Bit Helper</div>
      ${field('Bytes', '<input id="ca-bytes" value="1024" type="number">')}
      <div id="ca-bh" class="grid2"></div>
    `;
    body.querySelector('#ca-run').addEventListener('click', () => {
      const out = body.querySelector('#ca-out');
      try {
        const v = safeCalcExpr(body.querySelector('#ca-in').value);
        out.innerHTML = [['Result', String(v)], ['Rounded (10dp)', String(Number(v.toFixed?.(10) ?? v))]]
          .map(([k,val]) => statbox(k,val)).join('');
      } catch (e) { out.innerHTML = `<div class="status err">${e.message}</div>`; }
    });
    body.querySelector('#ca-bytes').addEventListener('input', () => {
      const b = +body.querySelector('#ca-bytes').value || 0;
      body.querySelector('#ca-bh').innerHTML = [
        ['Bits', b*8], ['KB', (b/1024).toFixed(3)], ['MB', (b/1024/1024).toFixed(6)], ['Hex bytes', b.toString(16).toUpperCase()],
      ].map(([k,v]) => statbox(k,v)).join('');
    });
    body.querySelector('#ca-bytes').dispatchEvent(new Event('input'));
  }
};
