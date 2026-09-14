import { field, statbox } from '../ui-helpers.js';

export const tool = {
  id: 'user-agent', title: 'User-Agent Decoder', icon: '🕵️‍♂️', category: 'Web',
  keywords: ['user agent','browser','os','device'],
  width: 520, height: 460,
  build(body) {
    body.innerHTML = `
      <div class="section-head">Parse a User-Agent String</div>
      <div class="status inf">User-Agent parsing is heuristic — browsers can freeze or spoof this string, so treat results as a best guess, not ground truth.</div>
      ${field('User-Agent', '<textarea id="ua-in" rows="4"></textarea>')}
      <button class="btn btn-primary" id="ua-run">Parse</button>
      <div id="ua-out" class="grid2"></div>
    `;
    body.querySelector('#ua-in').value = navigator.userAgent;
    body.querySelector('#ua-run').addEventListener('click', () => {
      const ua = body.querySelector('#ua-in').value;
      const browser =
        /Edg\//.test(ua) ? 'Edge' :
        /Chrome\//.test(ua) && !/Chromium/.test(ua) ? 'Chrome' :
        /Firefox\//.test(ua) ? 'Firefox' :
        /Safari\//.test(ua) && !/Chrome/.test(ua) ? 'Safari' : 'Unknown';
      const os =
        /Windows NT/.test(ua) ? 'Windows' :
        /Mac OS X/.test(ua) ? 'macOS' :
        /Android/.test(ua) ? 'Android' :
        /iPhone|iPad/.test(ua) ? 'iOS' :
        /Linux/.test(ua) ? 'Linux' : 'Unknown';
      const mobile = /Mobi|Android|iPhone/.test(ua) ? 'Likely mobile' : 'Likely desktop';
      body.querySelector('#ua-out').innerHTML = [
        ['Browser (guess)', browser], ['OS (guess)', os], ['Device type (guess)', mobile],
      ].map(([k,v]) => statbox(k,v)).join('');
    });
    body.querySelector('#ua-run').click();
  }
};
