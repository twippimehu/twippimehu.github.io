import { field, statbox } from '../ui-helpers.js';

function gcd(a,b) { while (b) { [a,b] = [b, a%b]; } return a; }

export const tool = {
  id: 'aspect-ratio', title: 'Aspect Ratio', icon: '📐', category: 'Design',
  keywords: ['aspect','ratio','resolution','video','reels'],
  width: 450, height: 520,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Resolution & Aspect Ratio</div>
      <div class="grid2">
        ${field('Width', '<input id="ar-w" type="number" value="1920">')}
        ${field('Height', '<input id="ar-h" type="number" value="1080">')}
      </div>
      <div id="ar-out" class="grid2"></div>
      <div class="field-label">Common presets</div>
      <div class="grid2">
        <button class="btn btn-ghost" data-w="1080" data-h="1920">Reels / TikTok 9:16</button>
        <button class="btn btn-ghost" data-w="1920" data-h="1080">YouTube 16:9</button>
        <button class="btn btn-ghost" data-w="1080" data-h="1080">Square 1:1</button>
        <button class="btn btn-ghost" data-w="1080" data-h="1350">Portrait 4:5</button>
      </div>
    `;
    function calc() {
      const w = +body.querySelector('#ar-w').value, h = +body.querySelector('#ar-h').value;
      if (!(w && h)) return;
      const g = gcd(w,h);
      body.querySelector('#ar-out').innerHTML = [
        ['Ratio', `${w/g}:${h/g}`], ['Decimal', (w/h).toFixed(4)],
        ['Pixels', `${w} × ${h}`], ['Orientation', w===h?'Square':w>h?'Landscape':'Portrait'],
      ].map(([k,v]) => statbox(k,v)).join('');
    }
    body.querySelector('#ar-w').addEventListener('input', calc);
    body.querySelector('#ar-h').addEventListener('input', calc);
    body.querySelectorAll('button[data-w]').forEach(btn => btn.addEventListener('click', () => {
      body.querySelector('#ar-w').value = btn.dataset.w;
      body.querySelector('#ar-h').value = btn.dataset.h;
      calc();
    }));
    calc();
  }
};
