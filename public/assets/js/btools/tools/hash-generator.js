import { field } from '../ui-helpers.js';

export const tool = {
  id: 'hash-generator', title: 'Hash Generator', icon: '#️⃣', category: 'Developer',
  keywords: ['hash','sha256','sha384','sha512','digest','checksum'],
  width: 500, height: 480,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Text Hashes (computed locally)</div>
      ${field('Input', '<textarea id="ha-in" rows="7" placeholder="Text to hash…"></textarea>')}
      <button class="btn btn-primary" id="ha-run">Generate hashes</button>
      <div id="ha-out" class="output"></div>
    `;
    body.querySelector('#ha-run').addEventListener('click', async () => {
      const s = body.querySelector('#ha-in').value;
      const bytes = new TextEncoder().encode(s);
      const algos = ['SHA-256', 'SHA-384', 'SHA-512'];
      const rows = [];
      for (const a of algos) {
        const digest = await crypto.subtle.digest(a, bytes);
        rows.push(`${a}\n${[...new Uint8Array(digest)].map(x => x.toString(16).padStart(2,'0')).join('')}`);
      }
      body.querySelector('#ha-out').textContent = rows.join('\n\n');
    });
  }
};
