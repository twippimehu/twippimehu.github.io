export const tool = {
  id: 'uuid-generator', title: 'UUID Generator', icon: '🆔', category: 'Developer',
  keywords: ['uuid','guid','id'],
  width: 420, height: 440,
  build(body) {
    body.innerHTML = `
      <div class="section-head">UUID v4</div>
      <div class="row">
        <input id="uu-count" type="number" value="5" min="1" max="200">
        <button class="btn btn-primary" id="uu-run">Generate</button>
      </div>
      <div id="uu-out" class="output"></div>
      <button class="btn btn-ghost" id="uu-copy">Copy</button>
    `;
    body.querySelector('#uu-run').addEventListener('click', () => {
      const n = Math.min(200, +body.querySelector('#uu-count').value || 5);
      body.querySelector('#uu-out').textContent = Array.from({length:n}, () => crypto.randomUUID()).join('\n');
    });
    body.querySelector('#uu-copy').addEventListener('click', () => navigator.clipboard?.writeText(body.querySelector('#uu-out').textContent));
  }
};
