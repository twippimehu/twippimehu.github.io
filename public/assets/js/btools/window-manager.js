import { state, noteRecent, saveWindowState } from './state.js';

const desktop = () => document.getElementById('desktop');

export function refreshWelcome() {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = Object.keys(state.windows).length ? 'none' : 'block';
}

function updateTaskBtn(id, open) {
  const b = document.getElementById('tb-' + id);
  if (b) b.classList.toggle('active', open);
}

export function isOpen(id) {
  return !!state.windows[id];
}

export function bringToFront(id) {
  if (!state.windows[id]) return;
  state.windows[id].el.style.zIndex = ++state.z;
  document.querySelectorAll('.window').forEach(x => x.classList.remove('focused'));
  state.windows[id].el.classList.add('focused');
  updateTaskBtn(id, true);
}

export function closeWindow(id) {
  const w = state.windows[id];
  if (!w) return;
  w.el.style.transition = 'transform .14s, opacity .14s';
  w.el.style.transform = 'scale(.86)';
  w.el.style.opacity = '0';
  setTimeout(() => {
    w.el.remove();
    delete state.windows[id];
    updateTaskBtn(id, false);
    refreshWelcome();
  }, 140);
}

export function minimizeWindow(id) {
  const w = state.windows[id];
  if (!w) return;
  w.min = !w.min;
  w.el.classList.toggle('minimized', w.min);
  updateTaskBtn(id, !w.min);
}

export function maximizeWindow(id) {
  const w = state.windows[id];
  if (!w) return;
  const d = desktop();
  if (!w.max) {
    w.prev = { top: w.el.style.top, left: w.el.style.left, width: w.el.style.width, height: w.el.style.height };
    Object.assign(w.el.style, { top: '0px', left: '0px', width: d.clientWidth + 'px', height: d.clientHeight + 'px' });
    w.max = true;
  } else {
    Object.assign(w.el.style, w.prev);
    w.max = false;
  }
}

export function favoriteBadge(id) {
  const el = document.getElementById('fav-badge-' + id);
  return el;
}

export function createWindow(id, title, icon, build, { width = 410, height = 360, top, left, favoriteToggle } = {}) {
  if (state.windows[id]) { bringToFront(id); return; }

  const remembered = state.windowState[id];
  const w = document.createElement('div');
  w.className = 'window';
  w.id = 'win-' + id;

  const openCount = Object.keys(state.windows).length;
  w.style.width = (remembered?.width || width) + 'px';
  w.style.height = (remembered?.height || height) + 'px';
  w.style.left = (remembered?.left ?? left ?? Math.max(15, 80 + (openCount * 28) % 420)) + 'px';
  w.style.top = (remembered?.top ?? top ?? Math.max(15, 60 + (openCount * 24) % 280)) + 'px';
  w.style.zIndex = ++state.z;

  w.innerHTML = `
    <div class="win-titlebar">
      <div class="controls">
        <button class="win-btn close" aria-label="Close ${title}"></button>
        <button class="win-btn min" aria-label="Minimize ${title}"></button>
        <button class="win-btn max" aria-label="Maximize ${title}"></button>
      </div>
      <div class="win-icon">${icon}</div>
      <span class="win-title">${title}</span>
      <span class="win-spacer"></span>
      <span class="win-small" id="fav-badge-${id}" title="Toggle favorite"></span>
    </div>
    <div class="win-body" id="body-${id}"></div>
    <div class="handle"></div>
  `;

  desktop().appendChild(w);
  state.windows[id] = { el: w, min: false, max: false, prev: null };

  w.querySelector('.win-btn.close').addEventListener('click', () => closeWindow(id));
  w.querySelector('.win-btn.min').addEventListener('click', () => minimizeWindow(id));
  w.querySelector('.win-btn.max').addEventListener('click', () => maximizeWindow(id));
  w.querySelector('.win-titlebar').addEventListener('mousedown', e => startDrag(e, id));
  w.querySelector('.handle').addEventListener('mousedown', e => startResize(e, id));
  w.addEventListener('mousedown', () => bringToFront(id));

  const badge = w.querySelector('#fav-badge-' + id);
  if (badge && favoriteToggle) {
    badge.addEventListener('click', e => { e.stopPropagation(); favoriteToggle(); });
  }

  build(document.getElementById('body-' + id));
  bringToFront(id);
  noteRecent(id);
  refreshWelcome();
  rememberGeometry(id);
}

// Persist size/position (debounced) whenever a window is moved or resized,
// so the layout survives a reload — a non-sensitive UI preference only.
let rememberTimer = null;
function rememberGeometry(id) {
  clearTimeout(rememberTimer);
  rememberTimer = setTimeout(() => {
    const w = state.windows[id];
    if (!w) return;
    state.windowState[id] = {
      width: w.el.offsetWidth, height: w.el.offsetHeight,
      left: w.el.offsetLeft, top: w.el.offsetTop,
    };
    saveWindowState();
  }, 300);
}

function startDrag(e, id) {
  if (e.target.closest('.win-btn') || e.target.closest('.win-small')) return;
  if (state.windows[id].max) return;
  const el = state.windows[id].el;
  bringToFront(id);
  state.drag = { el, id, ox: e.clientX - el.offsetLeft, oy: e.clientY - el.offsetTop };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag, { once: true });
}
function onDrag(e) {
  if (!state.drag) return;
  const d = desktop();
  const x = e.clientX - state.drag.ox, y = e.clientY - state.drag.oy;
  state.drag.el.style.left = Math.max(0, Math.min(x, d.clientWidth - state.drag.el.offsetWidth)) + 'px';
  state.drag.el.style.top = Math.max(0, Math.min(y, d.clientHeight - state.drag.el.offsetHeight)) + 'px';
}
function stopDrag() {
  if (state.drag) rememberGeometry(state.drag.id);
  state.drag = null;
  document.removeEventListener('mousemove', onDrag);
}

function startResize(e, id) {
  e.stopPropagation();
  if (state.windows[id].max) return;
  const el = state.windows[id].el;
  state.resize = { el, id, ox: e.clientX, oy: e.clientY, ow: el.offsetWidth, oh: el.offsetHeight };
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize, { once: true });
}
function onResize(e) {
  if (!state.resize) return;
  state.resize.el.style.width = Math.max(340, state.resize.ow + e.clientX - state.resize.ox) + 'px';
  state.resize.el.style.height = Math.max(220, state.resize.oh + e.clientY - state.resize.oy) + 'px';
}
function stopResize() {
  if (state.resize) rememberGeometry(state.resize.id);
  state.resize = null;
  document.removeEventListener('mousemove', onResize);
}
