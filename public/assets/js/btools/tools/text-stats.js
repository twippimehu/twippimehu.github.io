import { statbox } from '../ui-helpers.js';

export const tool = {
  id: 'text-stats', title: 'Text Statistics', icon: '📈', category: 'Productivity',
  keywords: ['frequency','unique words','longest word'],
  width: 480, height: 540,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Text Statistics</div>
      <textarea id="ts-in" rows="8" placeholder="Paste text…"></textarea>
      <button class="btn btn-primary" id="ts-run">Analyze</button>
      <div class="grid2" id="ts-boxes"></div>
      <div class="field-label">Most frequent words</div>
      <div id="ts-freq" class="output"></div>
    `;
    body.querySelector('#ts-run').addEventListener('click', () => {
      const s = body.querySelector('#ts-in').value;
      const words = (s.toLowerCase().match(/[a-z0-9']+/g) || []);
      const unique = new Set(words);
      const freq = {};
      words.forEach(w => freq[w] = (freq[w]||0)+1);
      const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,12);
      const longest = words.reduce((a,w) => w.length > a.length ? w : a, '');
      const shortest = words.reduce((a,w) => (a === '' || w.length < a.length) ? w : a, '');
      const sentences = (s.match(/[^.!?]+[.!?]+/g) || []).length;
      const paragraphs = s.split(/\n\s*\n/).filter(p => p.trim()).length;
      const avgLen = words.length ? (words.reduce((a,w)=>a+w.length,0)/words.length).toFixed(2) : '0';

      body.querySelector('#ts-boxes').innerHTML = [
        ['Unique words', unique.size], ['Longest word', longest || '—'],
        ['Shortest word', shortest || '—'], ['Sentences', sentences],
        ['Paragraphs', paragraphs], ['Avg word length', avgLen],
      ].map(([k,v]) => statbox(k,v)).join('');

      body.querySelector('#ts-freq').innerHTML = sorted.length
        ? sorted.map(([w,c]) => `${w} — ${c}`).join('\n')
        : 'No words yet.';
    });
  }
};
