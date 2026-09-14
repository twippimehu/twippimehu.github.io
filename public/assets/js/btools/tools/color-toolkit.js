import { statbox } from '../ui-helpers.js';

function rgbFromHex(h) {
  h = h.replace('#','');
  if (h.length === 3) h = h.split('').map(x=>x+x).join('');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function rgbHex(r,g,b) { return '#'+[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('').toUpperCase(); }
function rgbToHsl(r,g,b) {
  r/=255; g/=255; b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2;
  let h=0, s=0;
  if (mx !== mn) {
    const d = mx-mn; s = l>0.5 ? d/(2-mx-mn) : d/(mx+mn);
    switch (mx) { case r: h=(g-b)/d+(g<b?6:0); break; case g: h=(b-r)/d+2; break; default: h=(r-g)/d+4; }
    h *= 60;
  }
  return [Math.round(h), Math.round(s*100), Math.round(l*100)];
}

export const tool = {
  id: 'color-toolkit', title: 'Color Toolkit', icon: '🎨', category: 'Design',
  keywords: ['hex','rgb','hsl','color','palette'],
  width: 470, height: 580,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Color Inspector</div>
      <div class="row">
        <input id="co-color" type="color" value="#7c5cfc">
        <input id="co-hex" value="#7C5CFC">
      </div>
      <div id="co-stats" class="grid3"></div>
      <div class="grid2">
        <button class="btn btn-primary" id="co-random">Random color</button>
        <button class="btn btn-ghost" id="co-palette">Generate palette</button>
      </div>
      <div id="co-swatches" class="chip-wrap"></div>
    `;
    function update(hex) {
      try {
        const [r,g,b] = rgbFromHex(hex);
        const [h,s,l] = rgbToHsl(r,g,b);
        body.querySelector('#co-hex').value = rgbHex(r,g,b);
        body.querySelector('#co-color').value = rgbHex(r,g,b);
        body.querySelector('#co-stats').innerHTML = [
          ['HEX', rgbHex(r,g,b)], ['RGB', `${r}, ${g}, ${b}`], ['HSL', `${h}°, ${s}%, ${l}%`],
        ].map(([k,v]) => statbox(k,v)).join('');
      } catch {}
    }
    body.querySelector('#co-color').addEventListener('input', e => update(e.target.value));
    body.querySelector('#co-hex').addEventListener('input', e => update(e.target.value));
    body.querySelector('#co-random').addEventListener('click', () => update('#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')));
    body.querySelector('#co-palette').addEventListener('click', () => {
      const [r,g,b] = rgbFromHex(body.querySelector('#co-hex').value);
      const arr = Array.from({length:8}, (_,i) => rgbHex(r+(255-r)*i/7, g+(255-g)*i/7, b+(255-b)*i/7));
      body.querySelector('#co-swatches').innerHTML = arr.map(h =>
        `<button class="chip" style="background:${h};color:${(rgbFromHex(h).reduce((a,x)=>a+x,0)/3)>150?'#111':'#fff'}" data-hex="${h}">${h}</button>`
      ).join('');
    });
    body.querySelector('#co-swatches').addEventListener('click', e => {
      const btn = e.target.closest('button[data-hex]');
      if (btn) navigator.clipboard?.writeText(btn.dataset.hex);
    });
    update('#7c5cfc');
  }
};
