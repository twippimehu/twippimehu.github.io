import { loadPhotos, categories } from './photos-data.js';

let photos = [];
let visible = [];
let activeCategory = 'All';
let lbIndex = -1;

const els = {
  filter: document.getElementById('categoryFilter'),
  masonry: document.getElementById('masonry'),
  lightbox: document.getElementById('lightbox'),
  lbImage: document.getElementById('lbImage'),
  lbCaption: document.getElementById('lbCaption'),
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderFilters() {
  const cats = ['All', ...categories(photos)];
  els.filter.innerHTML = cats.map(c =>
    `<button data-cat="${escapeHtml(c)}" class="${c === activeCategory ? 'active' : ''}">${escapeHtml(c)}</button>`
  ).join('');
  els.filter.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid() {
  visible = activeCategory === 'All' ? photos : photos.filter(p => p.category === activeCategory);
  if (!visible.length) {
    els.masonry.innerHTML = '<p style="color:var(--paper-dim)">No photos in this category yet.</p>';
    return;
  }
  els.masonry.innerHTML = visible.map((p, i) => `
    <figure id="${p.id}" data-index="${i}">
      <img src="${p.thumbnail || p.src}" alt="${escapeHtml(p.title || '')}" loading="lazy"
           style="aspect-ratio:${p.width && p.height ? p.width + '/' + p.height : 'auto'}">
      <figcaption>${escapeHtml(p.title || '')}${p.location ? ' — ' + escapeHtml(p.location) : ''}</figcaption>
    </figure>
  `).join('');
  els.masonry.querySelectorAll('figure').forEach(fig => {
    fig.addEventListener('click', () => openLightbox(+fig.dataset.index));
  });
}

function openLightbox(index) {
  lbIndex = index;
  const p = visible[index];
  if (!p) return;
  els.lbImage.src = p.src;
  els.lbImage.alt = p.title || '';
  els.lbCaption.innerHTML = `<strong>${escapeHtml(p.title || '')}</strong>${[p.description, p.location, p.date].filter(Boolean).map(escapeHtml).join(' · ')}`;
  els.lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  els.lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function step(delta) {
  if (lbIndex === -1) return;
  lbIndex = (lbIndex + delta + visible.length) % visible.length;
  openLightbox(lbIndex);
}

document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => step(-1));
document.getElementById('lbNext').addEventListener('click', () => step(1));
els.lightbox.addEventListener('click', e => { if (e.target === els.lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!els.lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

// touch swipe
let touchStartX = null;
els.lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
els.lightbox.addEventListener('touchend', e => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
  touchStartX = null;
}, { passive: true });

async function init() {
  try {
    photos = await loadPhotos();
  } catch (e) {
    els.masonry.innerHTML = '<p style="color:var(--paper-dim)">Could not load /data/photos.json.</p>';
    return;
  }
  renderFilters();
  renderGrid();

  const hash = location.hash.replace('#', '');
  if (hash) {
    const idx = visible.findIndex(p => p.id === hash);
    if (idx !== -1) openLightbox(idx);
  }
}

init();
