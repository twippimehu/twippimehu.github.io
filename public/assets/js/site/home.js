import { loadPhotos } from './photos-data.js';

async function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  try {
    const photos = await loadPhotos();
    const featured = photos.filter(p => p.featured).slice(0, 5);
    if (!featured.length) {
      grid.innerHTML = '<p style="color:var(--paper-dim)">Add photos to /data/photos.json and mark them "featured": true.</p>';
      return;
    }
    grid.innerHTML = featured.map(p => `
      <figure>
        <a href="/photography/#${p.id}">
          <img src="${p.thumbnail || p.src}" alt="${escapeHtml(p.title || '')}" loading="lazy">
        </a>
        <figcaption>
          <span>${escapeHtml(p.title || '')}</span>
          <span>${escapeHtml(p.category || '')}</span>
        </figcaption>
      </figure>
    `).join('');
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--paper-dim)">Photo data not found yet.</p>';
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

renderFeatured();
