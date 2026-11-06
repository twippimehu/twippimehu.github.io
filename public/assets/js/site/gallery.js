import { loadPhotos, categories } from './photos-data.js';
import { t, onLangChange } from './i18n.js';

let photos = [];
let visible = [];
let activeCategory = 'All';
let lbIndex = -1;
let lastFocus = null;

const els = {
  filter: document.getElementById('categoryFilter'),
  masonry: document.getElementById('masonry'),
  lightbox: document.getElementById('lightbox'),
  lbImage: document.getElementById('lbImage'),
  lbCaption: document.getElementById('lbCaption'),
  lbCount: document.getElementById('lbCount'),
  lbClose: document.getElementById('lbClose'),
  lbPrev: document.getElementById('lbPrev'),
  lbNext: document.getElementById('lbNext'),
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function titleOf(p) { return p.title || ''; }
function metaOf(p) { return [p.location, p.date].filter(Boolean).join(' · '); }

function renderFilters() {
  const cats = ['All', ...categories(photos)];
  const countFor = (c) => (c === 'All' ? photos.length : photos.filter((p) => p.category === c).length);

  // A single "All" button is noise — only show the row once there is
  // something to filter by.
  els.filter.hidden = photos.length === 0 || categories(photos).length === 0;
  els.filter.innerHTML = cats.map((c) => `
    <button type="button" data-cat="${escapeHtml(c)}"
            class="${c === activeCategory ? 'is-active' : ''}"
            aria-pressed="${c === activeCategory}">${escapeHtml(c === 'All' ? t('all') : c)}<span class="count">${countFor(c)}</span></button>
  `).join('');

  els.filter.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid() {
  visible = activeCategory === 'All' ? photos : photos.filter((p) => p.category === activeCategory);

  if (!visible.length) {
    els.masonry.innerHTML = photos.length
      ? `<p class="notice">${escapeHtml(t('noInCategory'))}</p>`
      : `<p class="notice">${escapeHtml(t('comingSoon'))}</p>`;
    return;
  }

  els.masonry.innerHTML = visible.map((p, i) => {
    const dims = p.width && p.height ? ` width="${p.width}" height="${p.height}"` : '';
    const meta = metaOf(p);
    return `<figure class="tile" id="${escapeHtml(p.id)}">
      <a class="tile-link" href="#${escapeHtml(p.id)}" data-index="${i}"
         aria-label="${escapeHtml(titleOf(p) ? `${t('openPrefix')} ${titleOf(p)}` : t('openPhoto'))}">
        <img src="${p.src}" alt="${escapeHtml(p.description || titleOf(p))}"
             ${dims} loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async">
      </a>
      <figcaption>
        <span>${escapeHtml(titleOf(p))}</span>
        <span>${escapeHtml(meta)}</span>
      </figcaption>
    </figure>`;
  }).join('');

  els.masonry.querySelectorAll('.tile-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(Number(link.dataset.index));
    });
  });
}

function preload(offset) {
  const p = visible[(lbIndex + offset + visible.length) % visible.length];
  if (p && p.src) new Image().src = p.src;
}

function renderLightbox() {
  const p = visible[lbIndex];
  if (!p) return;
  els.lbImage.src = p.src;
  els.lbImage.alt = p.description || titleOf(p);
  const meta = metaOf(p);
  els.lbCaption.innerHTML = `<strong>${escapeHtml(titleOf(p))}</strong>${meta ? escapeHtml(meta) : ''}`;
  els.lbCount.textContent = `${lbIndex + 1} / ${visible.length}`;
}

function openLightbox(index) {
  if (!visible[index]) return;
  lbIndex = index;
  lastFocus = document.activeElement;
  renderLightbox();
  els.lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  preload(-1);
  preload(1);
  els.lbClose.focus();
  history.replaceState(null, '', `#${visible[lbIndex].id}`);
}

function closeLightbox() {
  els.lightbox.classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  history.replaceState(null, '', location.pathname);
}

function step(delta) {
  if (lbIndex === -1) return;
  lbIndex = (lbIndex + delta + visible.length) % visible.length;
  renderLightbox();
  preload(delta);
  if (visible[lbIndex]) history.replaceState(null, '', `#${visible[lbIndex].id}`);
}

els.lbClose.addEventListener('click', closeLightbox);
els.lbPrev.addEventListener('click', () => step(-1));
els.lbNext.addEventListener('click', () => step(1));
els.lightbox.addEventListener('click', (e) => {
  if (e.target === els.lightbox || e.target.classList.contains('lightbox-stage')) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!els.lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  if (e.key === 'Tab') {
    // keep focus inside the dialog
    const items = [els.lbClose, els.lbPrev, els.lbNext];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!items.includes(document.activeElement)) { e.preventDefault(); first.focus(); }
  }
});

let touchStartX = null;
els.lightbox.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
els.lightbox.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
  touchStartX = null;
}, { passive: true });

async function init() {
  try {
    photos = await loadPhotos();
  } catch {
    els.masonry.innerHTML = `<p class="notice">${escapeHtml(t('unavailable'))}</p>`;
    return;
  }
  renderFilters();
  renderGrid();

  const hash = location.hash.replace('#', '');
  if (hash) {
    const idx = visible.findIndex((p) => p.id === hash);
    if (idx !== -1) openLightbox(idx);
  }
}

// the visible labels come from JavaScript, so a language change redraws them
onLangChange(() => {
  if (!photos.length) return;
  renderFilters();
  renderGrid();
});

init();
