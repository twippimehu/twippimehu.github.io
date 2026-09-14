export const tool = {
  id: 'stopwatch', title: 'Stopwatch', icon: '⏱️', category: 'Productivity',
  keywords: ['stopwatch','laps','time'],
  width: 380, height: 420,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Stopwatch</div>
      <div style="text-align:center;font-size:36px;font-weight:800;font-family:'JetBrains Mono',monospace" id="sw-display">00:00.0</div>
      <div class="grid3">
        <button class="btn btn-primary" id="sw-start">Start</button>
        <button class="btn btn-ghost" id="sw-pause">Pause</button>
        <button class="btn btn-danger" id="sw-reset">Reset</button>
      </div>
      <button class="btn btn-ghost" id="sw-lap">Lap</button>
      <div id="sw-laps" class="output" style="max-height:140px"></div>
    `;
    let elapsed = 0, startTs = null, interval = null, laps = [];
    const display = body.querySelector('#sw-display');
    const render = () => {
      const total = elapsed + (startTs ? Date.now()-startTs : 0);
      const m = Math.floor(total/60000), s = Math.floor((total%60000)/1000), ds = Math.floor((total%1000)/100);
      display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${ds}`;
    };
    body.querySelector('#sw-start').addEventListener('click', () => {
      if (interval) return;
      startTs = Date.now();
      interval = setInterval(render, 100);
    });
    body.querySelector('#sw-pause').addEventListener('click', () => {
      if (!interval) return;
      elapsed += Date.now()-startTs; startTs=null;
      clearInterval(interval); interval=null;
    });
    body.querySelector('#sw-reset').addEventListener('click', () => {
      clearInterval(interval); interval=null; elapsed=0; startTs=null; laps=[];
      body.querySelector('#sw-laps').textContent=''; render();
    });
    body.querySelector('#sw-lap').addEventListener('click', () => {
      laps.push(display.textContent);
      body.querySelector('#sw-laps').textContent = laps.map((l,i)=>`Lap ${i+1}: ${l}`).join('\n');
    });
    render();
  }
};
