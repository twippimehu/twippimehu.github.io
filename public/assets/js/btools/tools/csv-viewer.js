import { field, esc } from '../ui-helpers.js';

function parseCSV(s) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i+1];
    if (c === '"' && q && n === '"') { cell += '"'; i++; continue; }
    if (c === '"') { q = !q; continue; }
    if (c === ',' && !q) { row.push(cell); cell = ''; continue; }
    if (c === '\n' && !q) { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    if (c !== '\r') cell += c;
  }
  row.push(cell);
  if (row.length > 1 || row[0]) rows.push(row);
  return rows;
}

export const tool = {
  id: 'csv-viewer', title: 'CSV Viewer', icon: '📊', category: 'Developer',
  keywords: ['csv','table','data','sort','export'],
  width: 660, height: 580,
  build(body) {
    body.innerHTML = `
      <div class="section-head">CSV / Delimited Data</div>
      ${field('Input', '<textarea id="csv-in" rows="7" placeholder="name,age,city\nJohn,20,Helsinki"></textarea>')}
      <div class="row">
        <input id="csv-search" placeholder="Filter rows…">
        <button class="btn btn-primary" id="csv-render">Render table</button>
        <button class="btn btn-ghost" id="csv-json">Copy as JSON</button>
      </div>
      <div id="csv-out" class="output" style="max-height:340px;white-space:normal"></div>
    `;
    let rows = [];
    function render() {
      const q = body.querySelector('#csv-search').value.toLowerCase();
      const filtered = q ? [rows[0], ...rows.slice(1).filter(r => r.join(' ').toLowerCase().includes(q))] : rows;
      const table = filtered.map((r,i) => '<tr>' + r.map(c =>
        `<${i===0?'th':'td'} style="border:1px solid var(--border);padding:6px;text-align:left;vertical-align:top">${esc(c)}</${i===0?'th':'td'}>`
      ).join('') + '</tr>').join('');
      body.querySelector('#csv-out').innerHTML = `<table style="width:100%;border-collapse:collapse">${table}</table>`;
    }
    body.querySelector('#csv-render').addEventListener('click', () => { rows = parseCSV(body.querySelector('#csv-in').value); render(); });
    body.querySelector('#csv-search').addEventListener('input', render);
    body.querySelector('#csv-json').addEventListener('click', () => {
      if (!rows.length) rows = parseCSV(body.querySelector('#csv-in').value);
      const h = rows[0] || [];
      const objs = rows.slice(1).map(r => Object.fromEntries(h.map((k,i) => [k, r[i] ?? ''])));
      navigator.clipboard?.writeText(JSON.stringify(objs, null, 2));
    });
  }
};
