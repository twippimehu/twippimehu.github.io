import { field, statbox } from '../ui-helpers.js';

function luminance(hex) {
  hex = hex.replace('#','');
  if (hex.length === 3) hex = hex.split('').map(x=>x+x).join('');
  const [r,g,b] = [0,2,4].map(i => {
    let c = parseInt(hex.slice(i,i+2),16)/255;
    return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  });
  return 0.2126*r + 0.7152*g + 0.0722*b;
}
function contrastRatio(a,b) {
  const l1 = luminance(a)+0.05, l2 = luminance(b)+0.05;
  return l1 > l2 ? l1/l2 : l2/l1;
}

export const tool = {
  id: 'contrast-checker', title: 'Contrast Checker', icon: '🌓', category: 'Design',
  keywords: ['contrast','accessibility','wcag','a11y'],
  width: 460, height: 460,
  build(body) {
    body.innerHTML = `
      <div class="section-head">WCAG Contrast Ratio</div>
      <div class="grid2">
        ${field('Foreground', '<input id="cc-fg" type="color" value="#e9e9f2">')}
        ${field('Background', '<input id="cc-bg" type="color" value="#09090e">')}
      </div>
      <div id="cc-preview" style="padding:20px;border-radius:8px;text-align:center;font-weight:700">Sample text</div>
      <div id="cc-out" class="grid2"></div>
    `;
    function update() {
      const fg = body.querySelector('#cc-fg').value, bg = body.querySelector('#cc-bg').value;
      const ratio = contrastRatio(fg,bg);
      const preview = body.querySelector('#cc-preview');
      preview.style.color = fg; preview.style.background = bg;
      body.querySelector('#cc-out').innerHTML = [
        ['Ratio', ratio.toFixed(2)+':1'],
        ['AA normal text', ratio>=4.5 ? 'Pass' : 'Fail'],
        ['AA large text', ratio>=3 ? 'Pass' : 'Fail'],
        ['AAA normal text', ratio>=7 ? 'Pass' : 'Fail'],
      ].map(([k,v]) => statbox(k,v)).join('');
    }
    body.querySelector('#cc-fg').addEventListener('input', update);
    body.querySelector('#cc-bg').addEventListener('input', update);
    update();
  }
};
