export const tool = {
  id: 'random-data', title: 'Random Data Generator', icon: '🧬', category: 'Security',
  keywords: ['random','test data','fake data','generator'],
  width: 480, height: 480,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Local Test Data Generator</div>
      <div class="status inf">Generates placeholder test data only — never represented as real people or real credentials.</div>
      <div class="grid2">
        <button class="btn btn-ghost" id="rd-uuid">UUIDs (5)</button>
        <button class="btn btn-ghost" id="rd-num">Numbers (10)</button>
        <button class="btn btn-ghost" id="rd-color">Colors (5)</button>
        <button class="btn btn-ghost" id="rd-str">Test strings (5)</button>
        <button class="btn btn-ghost" id="rd-date">Dates (5)</button>
        <button class="btn btn-ghost" id="rd-name">Placeholder names (5)</button>
      </div>
      <div id="rd-out" class="output"></div>
    `;
    const out = t => body.querySelector('#rd-out').textContent = t;
    const first = ['Alex','Sam','Jordan','Taylor','Casey','Riley','Morgan','Jamie'];
    const last = ['Nguyen','Smith','Garcia','Kim','Müller','Andersson','Rossi','Kowalski'];
    body.querySelector('#rd-uuid').addEventListener('click', () => out(Array.from({length:5},()=>crypto.randomUUID()).join('\n')));
    body.querySelector('#rd-num').addEventListener('click', () => out(Array.from({length:10},()=>Math.floor(Math.random()*100000)).join('\n')));
    body.querySelector('#rd-color').addEventListener('click', () => out(Array.from({length:5},()=>'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')).join('\n')));
    body.querySelector('#rd-str').addEventListener('click', () => out(Array.from({length:5},()=>crypto.randomUUID().replace(/-/g,'').slice(0,12)).join('\n')));
    body.querySelector('#rd-date').addEventListener('click', () => out(Array.from({length:5},()=>{const d=new Date(Date.now()-Math.random()*1e11);return d.toISOString().slice(0,10);}).join('\n')));
    body.querySelector('#rd-name').addEventListener('click', () => out(Array.from({length:5},()=>`${first[Math.floor(Math.random()*first.length)]} ${last[Math.floor(Math.random()*last.length)]} (placeholder)`).join('\n')));
  }
};
