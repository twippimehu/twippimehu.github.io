import { field } from '../ui-helpers.js';

export const tool = {
  id: 'date-calc', title: 'Date Calculator', icon: '📅', category: 'Productivity',
  keywords: ['date','days','difference','week number','unix','age'],
  width: 480, height: 560,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Days Between Dates</div>
      <div class="grid2">
        ${field('Start date', '<input id="dc-a" type="date">')}
        ${field('End date', '<input id="dc-b" type="date">')}
      </div>
      <button class="btn btn-primary" id="dc-diff">Calculate</button>
      <div id="dc-out" class="output"></div>
      <div class="section-head">Add / Subtract Days</div>
      <div class="grid2">
        ${field('Base date', '<input id="dc-c" type="date">')}
        ${field('Days (+/-)', '<input id="dc-n" type="number" value="30">')}
      </div>
      <button class="btn btn-ghost" id="dc-add">Calculate target date</button>
      <div id="dc-out2" class="output"></div>
    `;
    body.querySelector('#dc-diff').addEventListener('click', () => {
      const a = new Date(body.querySelector('#dc-a').value), b = new Date(body.querySelector('#dc-b').value);
      const out = body.querySelector('#dc-out');
      if (isNaN(a) || isNaN(b)) { out.textContent = 'Choose both dates.'; return; }
      const days = Math.round((b-a)/86400000);
      const week = d => { const t=new Date(d); t.setUTCDate(t.getUTCDate()+4-(t.getUTCDay()||7)); const s=new Date(Date.UTC(t.getUTCFullYear(),0,1)); return Math.ceil((((t-s)/86400000)+1)/7); };
      out.textContent = `${days} days\nStart week: ${week(a)}\nEnd week: ${week(b)}\nStart Unix: ${Math.floor(a.getTime()/1000)}\nEnd Unix: ${Math.floor(b.getTime()/1000)}`;
    });
    body.querySelector('#dc-add').addEventListener('click', () => {
      const d = new Date(body.querySelector('#dc-c').value), n = +body.querySelector('#dc-n').value || 0;
      const out = body.querySelector('#dc-out2');
      if (isNaN(d)) { out.textContent = 'Choose a base date.'; return; }
      d.setDate(d.getDate()+n);
      out.textContent = d.toISOString().slice(0,10);
    });
  }
};
