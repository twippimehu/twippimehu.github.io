import { field } from '../ui-helpers.js';

export const tool = {
  id: 'gradient-generator', title: 'Gradient Generator', icon: '🌈', category: 'Design',
  keywords: ['gradient','css','linear','background'],
  width: 480, height: 500,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Linear Gradient Builder</div>
      <div class="grid2">
        ${field('Color 1', '<input id="gr-c1" type="color" value="#7c5cfc">')}
        ${field('Color 2', '<input id="gr-c2" type="color" value="#fc5c8a">')}
      </div>
      ${field('Angle', '<input id="gr-angle" type="range" min="0" max="360" value="135">')}
      <div id="gr-preview" style="height:120px;border-radius:10px;border:1px solid var(--border)"></div>
      <div class="field-label">CSS</div>
      <div id="gr-out" class="output"></div>
      <button class="btn btn-ghost" id="gr-copy">Copy CSS</button>
    `;
    function update() {
      const c1 = body.querySelector('#gr-c1').value, c2 = body.querySelector('#gr-c2').value, angle = body.querySelector('#gr-angle').value;
      const css = `background: linear-gradient(${angle}deg, ${c1}, ${c2});`;
      body.querySelector('#gr-preview').style.background = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
      body.querySelector('#gr-out').textContent = css;
    }
    ['gr-c1','gr-c2','gr-angle'].forEach(id => body.querySelector('#'+id).addEventListener('input', update));
    body.querySelector('#gr-copy').addEventListener('click', () => navigator.clipboard?.writeText(body.querySelector('#gr-out').textContent));
    update();
  }
};
