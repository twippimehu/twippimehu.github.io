export const tool = {
  id: 'timer', title: 'Timer', icon: '⏲️', category: 'Productivity',
  keywords: ['countdown','timer','duration'],
  width: 380, height: 340,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Countdown Timer</div>
      <div class="row">
        <input id="tm-min" type="number" value="5" min="0" placeholder="min">
        <input id="tm-sec" type="number" value="0" min="0" max="59" placeholder="sec">
      </div>
      <div style="text-align:center;font-size:40px;font-weight:800;font-family:'JetBrains Mono',monospace" id="tm-display">05:00</div>
      <div class="grid3">
        <button class="btn btn-primary" id="tm-start">Start</button>
        <button class="btn btn-ghost" id="tm-pause">Pause</button>
        <button class="btn btn-danger" id="tm-reset">Reset</button>
      </div>
      <div class="status inf" id="tm-status">Ready.</div>
    `;
    let remaining = 300, interval = null;
    const display = body.querySelector('#tm-display');
    const status = body.querySelector('#tm-status');
    const render = () => {
      const m = Math.floor(remaining/60), s = remaining%60;
      display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };
    body.querySelector('#tm-start').addEventListener('click', () => {
      if (interval) return;
      if (remaining <= 0) {
        remaining = (+body.querySelector('#tm-min').value||0)*60 + (+body.querySelector('#tm-sec').value||0);
      }
      status.className='status inf'; status.textContent='Running…';
      interval = setInterval(() => {
        remaining--;
        render();
        if (remaining <= 0) {
          clearInterval(interval); interval = null;
          status.className='status ok'; status.textContent='Time is up.';
        }
      }, 1000);
    });
    body.querySelector('#tm-pause').addEventListener('click', () => {
      if (interval) { clearInterval(interval); interval=null; status.textContent='Paused.'; }
    });
    body.querySelector('#tm-reset').addEventListener('click', () => {
      clearInterval(interval); interval = null;
      remaining = (+body.querySelector('#tm-min').value||0)*60 + (+body.querySelector('#tm-sec').value||0);
      render(); status.className='status inf'; status.textContent='Ready.';
    });
    render();
  }
};
