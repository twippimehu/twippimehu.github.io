import { field } from '../ui-helpers.js';

export const tool = {
  id: 'password-generator', title: 'Password Generator', icon: '🔐', category: 'Security',
  keywords: ['password','secret','random','generator'],
  width: 440, height: 460,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Local Password Generator</div>
      <div class="grid2">
        ${field('Length', '<input id="pw-l" type="number" value="24" min="4" max="128">')}
        ${field('Count', '<input id="pw-c" type="number" value="5" min="1" max="50">')}
      </div>
      <div class="grid2">
        <label><input type="checkbox" id="pw-u" checked> Uppercase</label>
        <label><input type="checkbox" id="pw-lw" checked> Lowercase</label>
        <label><input type="checkbox" id="pw-n" checked> Numbers</label>
        <label><input type="checkbox" id="pw-s" checked> Symbols</label>
      </div>
      <label><input type="checkbox" id="pw-x"> Exclude ambiguous characters (l, 1, O, 0)</label>
      <button class="btn btn-primary" id="pw-run">Generate</button>
      <div id="pw-out" class="output"></div>
      <div class="status inf">Generated locally using the browser's cryptographic randomness. Nothing is sent to a server or saved automatically.</div>
    `;
    body.querySelector('#pw-run').addEventListener('click', () => {
      let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower = 'abcdefghijklmnopqrstuvwxyz', nums = '0123456789', syms = '!@#$%^&*_-+=?';
      if (body.querySelector('#pw-x').checked) { upper = upper.replace(/[O]/g,''); lower = lower.replace(/[l]/g,''); nums = nums.replace(/[01]/g,''); }
      let chars = '';
      if (body.querySelector('#pw-u').checked) chars += upper;
      if (body.querySelector('#pw-lw').checked) chars += lower;
      if (body.querySelector('#pw-n').checked) chars += nums;
      if (body.querySelector('#pw-s').checked) chars += syms;
      if (!chars) { body.querySelector('#pw-out').textContent = 'Select at least one character set.'; return; }
      const len = Math.min(128, +body.querySelector('#pw-l').value || 24);
      const count = Math.min(50, +body.querySelector('#pw-c').value || 5);
      const rnd = new Uint32Array(len * count);
      crypto.getRandomValues(rnd);
      const out = [];
      for (let i = 0; i < count; i++) {
        let pw = '';
        for (let j = 0; j < len; j++) pw += chars[rnd[i*len+j] % chars.length];
        out.push(pw);
      }
      body.querySelector('#pw-out').textContent = out.join('\n');
    });
  }
};
