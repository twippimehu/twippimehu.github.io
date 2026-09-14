import { statbox } from '../ui-helpers.js';

export const tool = {
  id: 'file-inspector', title: 'File Inspector', icon: '🗂️', category: 'Media',
  keywords: ['file','metadata','mime','size'],
  width: 460, height: 420,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Inspect File Metadata</div>
      <input type="file" id="fi-file">
      <div id="fi-out" class="grid2"></div>
    `;
    body.querySelector('#fi-file').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const ext = f.name.includes('.') ? f.name.split('.').pop() : '—';
      body.querySelector('#fi-out').innerHTML = [
        ['Filename', f.name], ['Extension', ext], ['MIME type', f.type || 'Unknown'],
        ['Size', (f.size/1024).toFixed(1)+' KB'],
        ['Modified', f.lastModified ? new Date(f.lastModified).toLocaleString() : 'Not available'],
      ].map(([k,v]) => statbox(k,v)).join('');
    });
  }
};
