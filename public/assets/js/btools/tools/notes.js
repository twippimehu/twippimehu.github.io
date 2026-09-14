export const tool = {
  id: 'notes', title: 'Quick Notes', icon: '📝', category: 'Productivity',
  keywords: ['notes','scratchpad','memo'],
  width: 480, height: 520,
  build(body) {
    const KEY = 'btools-v3.notes';
    body.innerHTML = `
      <div class="section-head">Persistent Scratchpad</div>
      <textarea id="note-in" rows="22" placeholder="Your notes…"></textarea>
      <div class="row">
        <button class="btn btn-primary" id="note-save">Save</button>
        <button class="btn btn-danger" id="note-clear">Clear</button>
      </div>
      <div class="status inf" id="note-status">Saved locally in this browser.</div>
    `;
    const input = body.querySelector('#note-in');
    input.value = localStorage.getItem(KEY) || '';
    const status = body.querySelector('#note-status');
    body.querySelector('#note-save').addEventListener('click', () => {
      localStorage.setItem(KEY, input.value);
      status.className='status ok'; status.textContent='Saved.';
    });
    body.querySelector('#note-clear').addEventListener('click', () => {
      input.value=''; localStorage.setItem(KEY,'');
      status.className='status inf'; status.textContent='Cleared.';
    });
  }
};
