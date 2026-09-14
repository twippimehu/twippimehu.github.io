import { sendToExtension, onExtensionMessage, isExtensionPresent } from '../ext-bridge.js';

export const tool = {
  id: 'element-finder', title: 'Element Finder', icon: '🎯', category: 'Automation',
  keywords: ['inspector','selector','xpath','extension'],
  width: 480, height: 480,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Element Finder</div>
      <div id="ef-status" class="status inf">Checking for the extension…</div>
      <button class="btn btn-primary" id="ef-toggle">Enable picker on active tab</button>
      <div class="field-label">Last picked element</div>
      <div id="ef-out" class="output"></div>
      <div class="row">
        <button class="btn btn-ghost" id="ef-copy-sel">Copy Selector</button>
        <button class="btn btn-ghost" id="ef-copy-xpath">Copy XPath</button>
      </div>
    `;
    let on = false, last = null;
    const status = body.querySelector('#ef-status');
    function setConnected(ok) {
      status.className = 'status ' + (ok ? 'ok' : 'err');
      status.textContent = ok ? 'Extension connected. Hover elements on the target tab; click to capture.' : 'Extension not detected — install it from the Downloads page.';
    }
    setConnected(isExtensionPresent());
    setTimeout(() => setConnected(isExtensionPresent()), 500);
    onExtensionMessage(msg => {
      if (msg.action === 'pong') setConnected(true);
      if (msg.action === 'finder:picked') {
        last = msg.payload;
        body.querySelector('#ef-out').textContent =
          `Tag: <${last.tag}>\nID: ${last.id || '—'}\nClasses: ${last.classes || '—'}\nSize: ${last.width}×${last.height}\nSelector: ${last.selector}\nXPath: ${last.xpath}`;
      }
    });
    body.querySelector('#ef-toggle').addEventListener('click', (e) => {
      on = !on;
      sendToExtension('finder:toggle', { on });
      e.target.textContent = on ? 'Disable picker' : 'Enable picker on active tab';
    });
    body.querySelector('#ef-copy-sel').addEventListener('click', () => last && navigator.clipboard?.writeText(last.selector));
    body.querySelector('#ef-copy-xpath').addEventListener('click', () => last && navigator.clipboard?.writeText(last.xpath));
  }
};
