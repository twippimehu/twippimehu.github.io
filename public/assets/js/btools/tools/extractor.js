import { field } from '../ui-helpers.js';

export const tool = {
  id: 'extractor', title: 'Email / URL Extractor', icon: '📎', category: 'Web',
  keywords: ['extract','email','links','domains','phones'],
  width: 520, height: 560,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Extract Data From Text</div>
      ${field('Input', '<textarea id="ex-in" rows="11" placeholder="Paste text, HTML, chat logs, source…"></textarea>')}
      <div class="grid2">
        <button class="btn btn-primary" id="ex-emails">Emails</button>
        <button class="btn btn-ghost" id="ex-urls">URLs</button>
        <button class="btn btn-ghost" id="ex-domains">Domains</button>
        <button class="btn btn-ghost" id="ex-phones">Phone-like strings</button>
      </div>
      ${field('Output', '<textarea id="ex-out" rows="8" readonly></textarea>')}
      <button class="btn btn-ghost" id="ex-copy">Copy</button>
    `;
    function extract(type) {
      const s = body.querySelector('#ex-in').value;
      let out = [];
      if (type === 'emails') out = [...new Set(s.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
      if (type === 'urls') out = [...new Set((s.match(/https?:\/\/[^\s<>'"`]+/gi) || []).map(x => x.replace(/[),.;]+$/, '')))];
      if (type === 'domains') out = [...new Set((s.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) || []).map(x => x.toLowerCase()))];
      if (type === 'phones') out = [...new Set(s.match(/\+?\d[\d ()-]{7,}\d/g) || [])];
      body.querySelector('#ex-out').value = out.join('\n');
    }
    body.querySelector('#ex-emails').addEventListener('click', () => extract('emails'));
    body.querySelector('#ex-urls').addEventListener('click', () => extract('urls'));
    body.querySelector('#ex-domains').addEventListener('click', () => extract('domains'));
    body.querySelector('#ex-phones').addEventListener('click', () => extract('phones'));
    body.querySelector('#ex-copy').addEventListener('click', () => navigator.clipboard?.writeText(body.querySelector('#ex-out').value));
  }
};
