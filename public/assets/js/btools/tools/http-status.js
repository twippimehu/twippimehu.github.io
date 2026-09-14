import { esc } from '../ui-helpers.js';

const CODES = [
  [200,'OK','Request succeeded.'],[201,'Created','Resource created successfully.'],
  [204,'No Content','Succeeded, nothing to return.'],[301,'Moved Permanently','Resource has a new permanent URL.'],
  [302,'Found','Resource temporarily at a different URL.'],[304,'Not Modified','Cached version is still valid.'],
  [400,'Bad Request','Server could not understand the request.'],[401,'Unauthorized','Authentication is required.'],
  [403,'Forbidden','Authenticated but not permitted.'],[404,'Not Found','Resource does not exist.'],
  [405,'Method Not Allowed','HTTP method not supported for this resource.'],[409,'Conflict','Request conflicts with current state.'],
  [422,'Unprocessable Entity','Well-formed but semantically invalid.'],[429,'Too Many Requests','Rate limit exceeded.'],
  [500,'Internal Server Error','Generic server failure.'],[502,'Bad Gateway','Invalid response from upstream server.'],
  [503,'Service Unavailable','Server temporarily overloaded or down.'],[504,'Gateway Timeout','Upstream server timed out.'],
];

export const tool = {
  id: 'http-status', title: 'HTTP Status Reference', icon: '🌐', category: 'Web',
  keywords: ['http','status','codes','404','500'],
  width: 480, height: 560,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Common HTTP Status Codes</div>
      <input id="hs-search" placeholder="Search code or name…">
      <div id="hs-list" class="output" style="max-height:420px"></div>
    `;
    function render() {
      const q = body.querySelector('#hs-search').value.toLowerCase();
      const filtered = CODES.filter(([c,n]) => String(c).includes(q) || n.toLowerCase().includes(q));
      body.querySelector('#hs-list').innerHTML = filtered.map(([c,n,d]) =>
        `<div style="margin-bottom:10px"><strong>${c} ${esc(n)}</strong><br><span class="muted">${esc(d)}</span></div>`
      ).join('') || '<div class="empty">No matches.</div>';
    }
    body.querySelector('#hs-search').addEventListener('input', render);
    render();
  }
};
