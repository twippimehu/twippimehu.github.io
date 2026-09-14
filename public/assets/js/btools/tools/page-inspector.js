import { sendToExtension, onExtensionMessage, isExtensionPresent } from '../ext-bridge.js';
import { esc } from '../ui-helpers.js';

export const tool = {
  id: 'page-inspector', title: 'Page Inspector', icon: '🔍', category: 'Automation',
  keywords: ['page','inspect','links','images','forms','extension'],
  width: 520, height: 580,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Inspect the Active Tab</div>
      <div id="pi-status" class="status inf">Checking for the extension…</div>
      <button class="btn btn-primary" id="pi-run">Inspect active tab</button>
      <div id="pi-out" class="output" style="max-height:340px"></div>
    `;
    const status = body.querySelector('#pi-status');
    function setConnected(ok) {
      status.className = 'status ' + (ok ? 'ok' : 'err');
      status.textContent = ok ? 'Extension connected.' : 'Extension not detected — install it from the Downloads page.';
    }
    setConnected(isExtensionPresent());
    setTimeout(() => setConnected(isExtensionPresent()), 500);
    onExtensionMessage(msg => {
      if (msg.action === 'pong') setConnected(true);
      if (msg.action === 'page:report') {
        const d = msg.payload;
        body.querySelector('#pi-out').innerHTML =
          `Title: ${esc(d.title)}\nURL: ${esc(d.url)}\nDomain: ${esc(d.domain)}\n\n` +
          `Headings: ${d.headings}\nLinks: ${d.links}\nImages: ${d.images}\nForms: ${d.forms}\nInputs: ${d.inputs}\nButtons: ${d.buttons}\n\n` +
          `Emails found: ${d.emails.join(', ') || '—'}`;
      }
    });
    body.querySelector('#pi-run').addEventListener('click', () => sendToExtension('page:inspect'));
  }
};
