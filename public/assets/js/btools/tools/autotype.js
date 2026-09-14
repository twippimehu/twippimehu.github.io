import { field } from '../ui-helpers.js';
import { sendToExtension, onExtensionMessage, isExtensionPresent } from '../ext-bridge.js';

export const tool = {
  id: 'autotype', title: 'Auto-Type', icon: '⌨️', category: 'Automation',
  keywords: ['autotype','type','simulate typing','extension'],
  width: 500, height: 580,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Auto-Type via B Tools Extension</div>
      <div id="at-status" class="status inf">Checking for the extension…</div>
      <div class="status inf">Click into a text field on the target tab first, then press Start — typing goes into whatever is currently focused there.</div>
      ${field('Text to type', '<textarea id="at-text" rows="7"></textarea>')}
      <div class="grid2">
        ${field('Speed (ms / character)', '<input id="at-speed" type="number" value="35" min="0">')}
        <label style="margin-top:22px"><input type="checkbox" id="at-humanize" checked> Humanized timing (slight random variance)</label>
      </div>
      <div class="grid3">
        <button class="btn btn-primary" id="at-start">Start</button>
        <button class="btn btn-ghost" id="at-pause">Pause</button>
        <button class="btn btn-danger" id="at-stop">Stop</button>
      </div>
      <div class="status inf">Progress: <span id="at-progress">Idle</span></div>
      <div class="status inf">This uses synthetic input events through the extension — it is not equivalent to real OS-level keystrokes, and some hardened fields (e.g. some payment forms) may not accept it.</div>
    `;
    const status = body.querySelector('#at-status');
    function setConnected(ok) {
      status.className = 'status ' + (ok ? 'ok' : 'err');
      status.textContent = ok ? 'Extension connected.' : 'Extension not detected — install it from the Downloads page.';
    }
    setConnected(isExtensionPresent());
    setTimeout(() => setConnected(isExtensionPresent()), 500);
    onExtensionMessage(msg => {
      if (msg.action === 'pong') setConnected(true);
      if (msg.action === 'autotype:progress') body.querySelector('#at-progress').textContent = `${msg.payload.typed} / ${msg.payload.total} characters`;
      if (msg.action === 'autotype:done') body.querySelector('#at-progress').textContent = 'Done.';
    });
    body.querySelector('#at-start').addEventListener('click', () => sendToExtension('autotype:start', {
      text: body.querySelector('#at-text').value,
      speed: Math.max(0, +body.querySelector('#at-speed').value || 35),
      humanize: body.querySelector('#at-humanize').checked,
    }));
    body.querySelector('#at-pause').addEventListener('click', () => sendToExtension('autotype:pause'));
    body.querySelector('#at-stop').addEventListener('click', () => sendToExtension('autotype:stop'));
  }
};
