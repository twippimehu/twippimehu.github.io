import { field } from '../ui-helpers.js';

function b64urlDecode(str) {
  str = str.replace(/-/g,'+').replace(/_/g,'/');
  while (str.length % 4) str += '=';
  return decodeURIComponent(escape(atob(str)));
}

export const tool = {
  id: 'jwt-decoder', title: 'JWT Decoder', icon: '🪪', category: 'Developer',
  keywords: ['jwt','token','decode','header','payload'],
  width: 520, height: 560,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Decode a JWT</div>
      <div class="status inf">This decodes the header and payload only. It does NOT verify the signature — a decoded JWT should never be trusted as authentic without server-side signature verification.</div>
      ${field('Token', '<textarea id="jwt-in" rows="5" placeholder="eyJhbGciOi..."></textarea>')}
      <button class="btn btn-primary" id="jwt-run">Decode</button>
      <div class="field-label">Header</div>
      <div id="jwt-header" class="output"></div>
      <div class="field-label">Payload</div>
      <div id="jwt-payload" class="output"></div>
    `;
    body.querySelector('#jwt-run').addEventListener('click', () => {
      const parts = body.querySelector('#jwt-in').value.trim().split('.');
      const headerEl = body.querySelector('#jwt-header'), payloadEl = body.querySelector('#jwt-payload');
      if (parts.length < 2) { headerEl.textContent = 'Not a JWT.'; payloadEl.textContent = ''; return; }
      try { headerEl.textContent = JSON.stringify(JSON.parse(b64urlDecode(parts[0])), null, 2); }
      catch (e) { headerEl.textContent = 'Could not decode header: ' + e.message; }
      try { payloadEl.textContent = JSON.stringify(JSON.parse(b64urlDecode(parts[1])), null, 2); }
      catch (e) { payloadEl.textContent = 'Could not decode payload: ' + e.message; }
    });
  }
};
