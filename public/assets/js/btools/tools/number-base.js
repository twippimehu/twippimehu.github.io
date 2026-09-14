import { field } from '../ui-helpers.js';

export const tool = {
  id: 'number-base', title: 'Number Base Converter', icon: '🔢', category: 'Developer',
  keywords: ['binary','hex','octal','decimal','base'],
  width: 460, height: 460,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Live Base Conversion</div>
      ${field('Decimal', '<input id="nb-dec" value="255">')}
      ${field('Hexadecimal', '<input id="nb-hex" value="FF">')}
      ${field('Binary', '<input id="nb-bin" value="11111111">')}
      ${field('Octal', '<input id="nb-oct" value="377">')}
    `;
    const els = { dec: body.querySelector('#nb-dec'), hex: body.querySelector('#nb-hex'), bin: body.querySelector('#nb-bin'), oct: body.querySelector('#nb-oct') };
    function update(from) {
      let n;
      try {
        if (from === 'dec') n = parseInt(els.dec.value || '0', 10);
        if (from === 'hex') n = parseInt(els.hex.value || '0', 16);
        if (from === 'bin') n = parseInt(els.bin.value || '0', 2);
        if (from === 'oct') n = parseInt(els.oct.value || '0', 8);
        if (isNaN(n)) return;
        if (from !== 'dec') els.dec.value = n;
        if (from !== 'hex') els.hex.value = n.toString(16).toUpperCase();
        if (from !== 'bin') els.bin.value = n.toString(2);
        if (from !== 'oct') els.oct.value = n.toString(8);
      } catch {}
    }
    Object.entries(els).forEach(([key, el]) => el.addEventListener('input', () => update(key)));
  }
};
