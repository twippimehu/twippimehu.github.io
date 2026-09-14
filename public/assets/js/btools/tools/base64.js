import { field } from '../ui-helpers.js';

export const tool = {
  id: 'base64', title: 'Base64', icon: '🔡', category: 'Developer',
  keywords: ['base64','encode','decode'],
  width: 460, height: 500,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Base64 Encode / Decode (UTF-8 safe)</div>
      ${field('Input', '<textarea id="b64-in" rows="9"></textarea>')}
      <div class="row">
        <button class="btn btn-primary" id="b64-enc">Encode</button>
        <button class="btn btn-ghost" id="b64-dec">Decode</button>
      </div>
      ${field('Output', '<textarea id="b64-out" rows="9" readonly></textarea>')}
      <button class="btn btn-ghost" id="b64-copy">Copy</button>
    `;
    body.querySelector('#b64-enc').addEventListener('click', () => {
      try { body.querySelector('#b64-out').value = btoa(unescape(encodeURIComponent(body.querySelector('#b64-in').value))); }
      catch (e) { body.querySelector('#b64-out').value = 'Error: '+e.message; }
    });
    body.querySelector('#b64-dec').addEventListener('click', () => {
      try { body.querySelector('#b64-out').value = decodeURIComponent(escape(atob(body.querySelector('#b64-in').value))); }
      catch (e) { body.querySelector('#b64-out').value = 'Error: '+e.message; }
    });
    body.querySelector('#b64-copy').addEventListener('click', () => navigator.clipboard?.writeText(body.querySelector('#b64-out').value));
  }
};
