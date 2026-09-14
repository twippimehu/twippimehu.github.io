import { field } from '../ui-helpers.js';

export const tool = {
  id: 'randomizer', title: 'Randomizer', icon: '🎲', category: 'Productivity',
  keywords: ['random','shuffle','pick','number'],
  width: 460, height: 540,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Randomizer</div>
      ${field('List (one item per line)', '<textarea id="rz-list" rows="6" placeholder="Alice\nBob\nCarol"></textarea>')}
      <div class="grid3">
        <button class="btn btn-primary" id="rz-shuffle">Shuffle</button>
        <button class="btn btn-ghost" id="rz-one">Pick one</button>
        <button class="btn btn-ghost" id="rz-multi">Pick 3</button>
      </div>
      <div class="sep"></div>
      <div class="grid2">
        ${field('Min', '<input id="rz-min" type="number" value="1">')}
        ${field('Max', '<input id="rz-max" type="number" value="100">')}
      </div>
      <button class="btn btn-ghost" id="rz-number">Random number</button>
      <div id="rz-out" class="output"></div>
    `;
    const items = () => body.querySelector('#rz-list').value.split('\n').map(x=>x.trim()).filter(Boolean);
    const out = msg => body.querySelector('#rz-out').textContent = msg;
    const shuffle = arr => { const a = [...arr]; for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };

    body.querySelector('#rz-shuffle').addEventListener('click', () => out(shuffle(items()).join('\n') || 'Add items to the list first.'));
    body.querySelector('#rz-one').addEventListener('click', () => { const a=items(); out(a.length ? a[Math.floor(Math.random()*a.length)] : 'Add items to the list first.'); });
    body.querySelector('#rz-multi').addEventListener('click', () => { const a=shuffle(items()); out(a.length ? a.slice(0,3).join('\n') : 'Add items to the list first.'); });
    body.querySelector('#rz-number').addEventListener('click', () => {
      const min = +body.querySelector('#rz-min').value, max = +body.querySelector('#rz-max').value;
      out(String(Math.floor(Math.random()*(max-min+1))+min));
    });
  }
};
