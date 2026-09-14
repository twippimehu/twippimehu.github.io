export const tool = {
  id: 'file-hash', title: 'File Hash', icon: '🔒', category: 'Media',
  keywords: ['file','hash','sha256','checksum'],
  width: 480, height: 460,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Hash a File (processed locally)</div>
      <div id="fh-drop" style="border:1px dashed var(--border);border-radius:10px;padding:26px;text-align:center;color:var(--text-dim);cursor:pointer">
        Drop a file here, or click to choose one
      </div>
      <input type="file" id="fh-file" style="display:none">
      <div id="fh-out" class="output"></div>
    `;
    const drop = body.querySelector('#fh-drop'), fileInput = body.querySelector('#fh-file');
    drop.addEventListener('click', () => fileInput.click());
    ['dragover','dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.style.borderColor = 'var(--accent)'; }));
    ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.style.borderColor = 'var(--border)'; }));
    drop.addEventListener('drop', e => { if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) handle(fileInput.files[0]); });

    async function handle(file) {
      body.querySelector('#fh-out').textContent = 'Hashing ' + file.name + '…';
      const buf = await file.arrayBuffer();
      const results = [];
      for (const algo of ['SHA-256','SHA-384','SHA-512']) {
        const digest = await crypto.subtle.digest(algo, buf);
        results.push(`${algo}\n${[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}`);
      }
      body.querySelector('#fh-out').textContent = `${file.name} (${(file.size/1024).toFixed(1)} KB)\n\n` + results.join('\n\n');
    }
  }
};
