import { field } from '../ui-helpers.js';
import { sendToExtension, onExtensionMessage, isExtensionPresent } from '../ext-bridge.js';

export const tool = {
  id: 'dom-playground', title: 'DOM Playground', icon: '🧩', category: 'Automation',
  keywords: ['dom','selector','manipulate','extension'],
  width: 500, height: 500,
  build(body) {
    body.innerHTML = `
      <div class="section-head">DOM Playground</div>
      <div id="dp-status" class="status inf">Checking for the extension…</div>
      <div class="status inf">Actions run on the active tab only after you click Run — nothing happens silently.</div>
      ${field('CSS selector', '<input id="dp-sel" placeholder="#hero, .card, button[type=submit]">')}
      ${field('Action', `<select id="dp-action">
        <option value="text">Change text</option>
        <option value="html">Change HTML</option>
        <option value="addClass">Add class</option>
        <option value="removeClass">Remove class</option>
        <option value="setAttr">Set attribute</option>
        <option value="hide">Hide</option>
        <option value="show">Show</option>
        <option value="click">Click</option>
      </select>`)}
      ${field('Value (attr: name=value)', '<input id="dp-value" placeholder="e.g. Hello, or class-name, or href=/x">')}
      <button class="btn btn-primary" id="dp-run">Run on active tab</button>
      <div id="dp-out" class="status inf">Ready.</div>
    `;
    const status = body.querySelector('#dp-status');
    function setConnected(ok) {
      status.className = 'status ' + (ok ? 'ok' : 'err');
      status.textContent = ok ? 'Extension connected.' : 'Extension not detected — install it from the Downloads page.';
    }
    setConnected(isExtensionPresent());
    setTimeout(() => setConnected(isExtensionPresent()), 500);
    onExtensionMessage(msg => {
      if (msg.action === 'pong') setConnected(true);
      if (msg.action === 'dom:result') {
        const out = body.querySelector('#dp-out');
        out.className = 'status ' + (msg.payload.ok ? 'ok' : 'err');
        out.textContent = msg.payload.message;
      }
    });
    body.querySelector('#dp-run').addEventListener('click', () => {
      sendToExtension('dom:action', {
        selector: body.querySelector('#dp-sel').value,
        action: body.querySelector('#dp-action').value,
        value: body.querySelector('#dp-value').value,
      });
    });
  }
};
