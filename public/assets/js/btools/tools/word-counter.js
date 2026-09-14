import { statbox } from '../ui-helpers.js';

export const tool = {
  id: 'word-counter', title: 'Word Counter', icon: '🔢', category: 'Productivity',
  keywords: ['words','characters','reading time','sentences'],
  width: 460, height: 500,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Word Counter</div>
      <textarea id="wc-in" rows="10" placeholder="Paste or type text…"></textarea>
      <div class="grid2" id="wc-out"></div>
    `;
    const input = body.querySelector('#wc-in');
    const out = body.querySelector('#wc-out');
    input.addEventListener('input', render);
    render();
    function render() {
      const s = input.value;
      const words = (s.trim().match(/\S+/g) || []);
      const sentences = (s.match(/[^.!?]+[.!?]+/g) || (s.trim() ? [s] : []));
      const paragraphs = s.split(/\n\s*\n/).filter(p => p.trim());
      const chars = s.length;
      const charsNoSpace = s.replace(/\s/g, '').length;
      const avgSentenceLen = sentences.length ? (words.length / sentences.length).toFixed(1) : '0';
      const avgWordLen = words.length ? (words.reduce((a,w) => a+w.length,0) / words.length).toFixed(1) : '0';
      const readingTime = Math.max(1, Math.round(words.length / 200));
      out.innerHTML = [
        ['Words', words.length], ['Characters', chars], ['Chars (no spaces)', charsNoSpace],
        ['Sentences', sentences.length], ['Paragraphs', paragraphs.length], ['Reading time', readingTime + ' min'],
        ['Avg sentence length', avgSentenceLen + ' words'], ['Avg word length', avgWordLen + ' chars'],
      ].map(([k,v]) => statbox(k,v)).join('');
    }
  }
};
