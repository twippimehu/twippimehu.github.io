import { field } from '../ui-helpers.js';

export const tool = {
  id: 'text-cleaner', title: 'Text Cleaner', icon: '🧹', category: 'Productivity',
  keywords: ['clean','whitespace','invisible','normalize','dashes','quotes'],
  width: 480, height: 500,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Clean Messy Text</div>
      ${field('Input', '<textarea id="cl-in" rows="9" placeholder="Paste messy text…"></textarea>')}
      <button class="btn btn-primary" id="cl-run">Clean</button>
      ${field('Output', '<textarea id="cl-out" rows="9" readonly></textarea>')}
      <button class="btn btn-ghost" id="cl-copy">Copy</button>
    `;
    body.querySelector('#cl-run').addEventListener('click', () => {
      let s = body.querySelector('#cl-in').value
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t]+/g, ' ');
      s = s.split('\n').map(x => x.trim()).join('\n').replace(/\n{3,}/g, '\n\n');
      s = s.replace(/[""]/g, '"').replace(/['']/g, "'").replace(/[–—]/g, '-');
      body.querySelector('#cl-out').value = s;
    });
    body.querySelector('#cl-copy').addEventListener('click', e => {
      navigator.clipboard?.writeText(body.querySelector('#cl-out').value);
      const o = e.target.textContent; e.target.textContent = '✓ Copied'; setTimeout(() => e.target.textContent = o, 1200);
    });
  }
};
