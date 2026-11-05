import { loadPhotos } from './photos-data.js';

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

function captionFor(photo) {
  const meta = [photo.location, photo.date].filter(Boolean).map(escapeHtml).join(' · ');
  const title = photo.title ? escapeHtml(photo.title) : '';
  if (!title && !meta) return '';
  return `<figcaption><span>${title}</span>${meta ? `<span>${meta}</span>` : ''}</figcaption>`;
}

function renderHero(photo) {
  const figure = document.getElementById('heroFigure');
  const hero = document.getElementById('hero');
  if (!figure || !hero || !photo || !photo.src) return;
  const dims = photo.width && photo.height
    ? ` width="${photo.width}" height="${photo.height}"`
    : '';
  figure.innerHTML = `<img src="${photo.src}" alt="${escapeHtml(photo.title || '')}"${dims} loading="eager" decoding="async">`
    + captionFor(photo);
  hero.dataset.photo = 'true';
}

function renderRecent(photos) {
  const grid = document.getElementById('recentGrid');
  if (!grid) return;
  if (!photos.length) {
    grid.innerHTML = '<p class="notice">Photographs coming soon.</p>';
    return;
  }
  grid.innerHTML = photos.map((p) => {
    const dims = p.width && p.height ? ` width="${p.width}" height="${p.height}"` : '';
    return `<figure>
      <a href="/photography/#${encodeURIComponent(p.id)}">
        <img src="${p.src}" alt="${escapeHtml(p.title || '')}"${dims} loading="lazy" decoding="async">
      </a>
      ${captionFor(p)}
    </figure>`;
  }).join('');
}

async function init() {
  try {
    const photos = await loadPhotos();
    const heroPhoto = photos.find((p) => p.featured && p.src) || photos.find((p) => p.src) || null;
    const rest = photos.filter((p) => p !== heroPhoto).slice(0, 3);
    renderHero(heroPhoto);
    renderRecent(rest);
  } catch {
    renderRecent([]);
  }
}

init();
