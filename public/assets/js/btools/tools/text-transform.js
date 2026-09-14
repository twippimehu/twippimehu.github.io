import { field } from '../ui-helpers.js';

export const tool = {
  id: 'text-transform', title: 'Text Transformer', icon: '🔤', category: 'Productivity',
  keywords: ['case','upper','lower','camel','snake','kebab','sort','dedupe','trim'],
  width: 500, height: 560,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Transform Text</div>
      ${field('Input', '<textarea id="tx-in" rows="8" placeholder="Paste text…"></textarea>')}
      <div class="grid3" id="tx-buttons"></div>
      ${field('Output', '<textarea id="tx-out" rows="8" readonly></textarea>')}
      <button class="btn btn-primary" id="tx-copy">Copy output</button>
    `;
    const modes = [
      ['UPPERCASE','upper'],['lowercase','lower'],['Title Case','title'],['Sentence case','sentence'],
      ['camelCase','camel'],['PascalCase','pascal'],['snake_case','snake'],['kebab-case','kebab'],
      ['Reverse','reverse'],['Sort lines','sort'],['Reverse lines','revlines'],['Remove duplicates','dedupe'],
      ['Remove empty lines','noempty'],['Trim whitespace','trim'],['Remove punctuation','nopunct'],
      ['Add quotes','addquotes'],['Remove quotes','rmquotes'],['JSON escape','jsonesc'],['JSON unescape','jsonunesc'],
      ['URL encode','urlenc'],['URL decode','urldec'],['Base64 encode','b64enc'],['Base64 decode','b64dec'],
    ];
    body.querySelector('#tx-buttons').innerHTML = modes.map(([label, mode]) =>
      `<button class="btn btn-ghost" data-mode="${mode}">${label}</button>`
    ).join('');
    body.querySelector('#tx-buttons').addEventListener('click', e => {
      const btn = e.target.closest('button[data-mode]');
      if (btn) run(btn.dataset.mode);
    });
    body.querySelector('#tx-copy').addEventListener('click', e => {
      navigator.clipboard?.writeText(body.querySelector('#tx-out').value);
      const o = e.target.textContent; e.target.textContent = '✓ Copied'; setTimeout(() => e.target.textContent = o, 1200);
    });

    function run(mode) {
      let s = body.querySelector('#tx-in').value;
      const words = s.trim().split(/[^A-Za-z0-9]+/).filter(Boolean);
      const lines = () => s.split(/\n/);
      switch (mode) {
        case 'upper': s = s.toUpperCase(); break;
        case 'lower': s = s.toLowerCase(); break;
        case 'title': s = s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); break;
        case 'sentence': s = s.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (m,a,b) => a+b.toUpperCase()); break;
        case 'camel': s = words.map((w,i) => i ? w[0].toUpperCase()+w.slice(1).toLowerCase() : w.toLowerCase()).join(''); break;
        case 'pascal': s = words.map(w => w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''); break;
        case 'snake': s = words.map(w => w.toLowerCase()).join('_'); break;
        case 'kebab': s = words.map(w => w.toLowerCase()).join('-'); break;
        case 'reverse': s = s.split('').reverse().join(''); break;
        case 'sort': s = lines().sort((a,b) => a.localeCompare(b)).join('\n'); break;
        case 'revlines': s = lines().reverse().join('\n'); break;
        case 'dedupe': s = [...new Set(lines())].join('\n'); break;
        case 'noempty': s = lines().filter(l => l.trim()).join('\n'); break;
        case 'trim': s = lines().map(x => x.trim().replace(/[ \t]+/g,' ')).join('\n'); break;
        case 'nopunct': s = s.replace(/[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/g, ''); break;
        case 'addquotes': s = lines().map(l => `"${l}"`).join('\n'); break;
        case 'rmquotes': s = lines().map(l => l.replace(/^["']|["']$/g, '')).join('\n'); break;
        case 'jsonesc': s = JSON.stringify(s).slice(1, -1); break;
        case 'jsonunesc': try { s = JSON.parse(`"${s}"`); } catch { s = 'Invalid escaped JSON string.'; } break;
        case 'urlenc': s = encodeURIComponent(s); break;
        case 'urldec': try { s = decodeURIComponent(s); } catch { s = 'Invalid URL-encoded input.'; } break;
        case 'b64enc': s = btoa(unescape(encodeURIComponent(s))); break;
        case 'b64dec': try { s = decodeURIComponent(escape(atob(s))); } catch { s = 'Invalid Base64 input.'; } break;
      }
      body.querySelector('#tx-out').value = s;
    }
  }
};
