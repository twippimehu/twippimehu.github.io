import { getTool, allTools } from './registry.js';
import { createWindow, isOpen, bringToFront, minimizeWindow, refreshWelcome } from './window-manager.js';
import { state, toggleFavorite } from './state.js';
import { initPalette } from './palette.js';
import { esc } from './ui-helpers.js';
import './ext-bridge.js';

function openTool(id) {
  const tool = getTool(id);
  if (!tool) return;
  if (isOpen(id)) { bringToFront(id); return; }
  createWindow(id, tool.title, tool.icon, tool.build, {
    width: tool.width, height: tool.height,
    favoriteToggle: () => { toggleFavorite(id); renderTaskbar(); },
  });
}

function renderTaskbar() {
  const bar = document.getElementById('taskbarTools');
  const favTools = state.favorites.map(getTool).filter(Boolean);
  bar.innerHTML = favTools.map(t => `
    <button class="task-btn hide-small" id="tb-${t.id}" data-id="${t.id}" title="${esc(t.title)}">
      <span class="dot"></span>${t.icon} ${esc(t.title)}
    </button>
  `).join('');
  bar.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (isOpen(id)) {
        minimizeWindow(id);
        bringToFront(id);
      } else {
        openTool(id);
      }
    });
  });
}

async function logout() {
  try { await fetch('/api/logout', { method: 'POST' }); } catch {}
  window.location.href = '/.../';
}

function init() {
  renderTaskbar();
  refreshWelcome();

  const palette = initPalette(openTool);
  document.getElementById('launcherBtn').addEventListener('click', palette.open);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  const hash = location.hash.replace('#', '');
  if (hash && getTool(hash)) openTool(hash);

  window.__btools = { openTool, allTools };
}

document.addEventListener('DOMContentLoaded', init);
