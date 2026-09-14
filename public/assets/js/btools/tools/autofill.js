import { field } from '../ui-helpers.js';
import { sendToExtension, onExtensionMessage, isExtensionPresent, pingExtension } from '../ext-bridge.js';

export const tool = {
  id: 'autofill', title: 'Auto-Fill', icon: '📋', category: 'Automation',
  keywords: ['autofill','answers','extension','fill fields'],
  width: 480, height: 560,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Auto-Fill via B Tools Extension</div>
      <div id="af-status" class="status inf">Checking for the extension…</div>
      ${field('Answers — one per line, used in order', '<textarea id="af-answers" rows="8" placeholder="Answer 1\nAnswer 2\nAnswer 3"></textarea>')}
      <div class="row">
        <button class="btn btn-primary" id="af-load">Load into extension</button>
        <button class="btn btn-ghost" id="af-reset">Reset progress</button>
      </div>
      <div class="status inf">Focus a field on any webpage, then press <span class="kbd">Alt</span> + <span class="kbd">Q</span> to fill the next answer. Progress: <span id="af-progress">0 / 0</span></div>
    `;
    const status = body.querySelector('#af-status');
    const progress = body.querySelector('#af-progress');

    function setConnected(ok) {
      status.className = 'status ' + (ok ? 'ok' : 'err');
      status.textContent = ok ? 'Extension connected.' : 'Extension not detected — install it from the Downloads page, then reload this tab.';
    }
    setConnected(isExtensionPresent());
    pingExtension();
    setTimeout(() => setConnected(isExtensionPresent()), 500);

    onExtensionMessage(msg => {
      if (msg.action === 'pong') setConnected(true);
      if (msg.action === 'autofill:progress') progress.textContent = `${msg.payload.index} / ${msg.payload.total}`;
    });

    body.querySelector('#af-load').addEventListener('click', () => {
      const answers = body.querySelector('#af-answers').value.split('\n').filter(l => l.trim().length);
      sendToExtension('autofill:set', answers);
      progress.textContent = `0 / ${answers.length}`;
    });
    body.querySelector('#af-reset').addEventListener('click', () => sendToExtension('autofill:reset'));
  }
};
