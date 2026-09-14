import { statbox } from '../ui-helpers.js';

export const tool = {
  id: 'image-inspector', title: 'Image Inspector', icon: '🖼️', category: 'Media',
  keywords: ['image','exif','dimensions','metadata'],
  width: 500, height: 560,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Inspect an Image (processed locally)</div>
      <div id="ii-drop" style="border:1px dashed var(--border);border-radius:10px;padding:26px;text-align:center;color:var(--text-dim);cursor:pointer">
        Drop an image here, or click to choose one
      </div>
      <input type="file" id="ii-file" accept="image/*" style="display:none">
      <img id="ii-preview" style="max-width:100%;border-radius:8px;display:none;max-height:180px;object-fit:contain">
      <div id="ii-out" class="grid2"></div>
    `;
    const drop = body.querySelector('#ii-drop'), fileInput = body.querySelector('#ii-file'), preview = body.querySelector('#ii-preview');
    drop.addEventListener('click', () => fileInput.click());
    ['dragover','dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.style.borderColor = 'var(--accent)'; }));
    ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.style.borderColor = 'var(--border)'; }));
    drop.addEventListener('drop', e => { if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) handle(fileInput.files[0]); });

    function handle(file) {
      const url = URL.createObjectURL(file);
      preview.src = url; preview.style.display = 'block';
      const img = new Image();
      img.onload = () => {
        body.querySelector('#ii-out').innerHTML = [
          ['File name', file.name], ['Dimensions', `${img.naturalWidth} × ${img.naturalHeight}`],
          ['File size', (file.size/1024).toFixed(1)+' KB'], ['MIME type', file.type || 'Unknown'],
          ['Last modified', file.lastModified ? new Date(file.lastModified).toLocaleDateString() : '—'],
        ].map(([k,v]) => statbox(k,v)).join('') + '<div class="status inf" style="grid-column:1/-1">Full EXIF parsing requires a dedicated parser and is not included in this build — dimensions, size and type are read directly from the file.</div>';
      };
      img.src = url;
    }
  }
};
