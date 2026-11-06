import { loadPhotos, categories } from './photos-data.js';
import { t, lang, onLangChange } from './i18n.js';

const VIEW_KEY = 'view';
const canAnimate = typeof document.startViewTransition === 'function';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let photos = [];
let visible = [];
let activeCategory = 'All';
let view = 'grid';
let lbIndex = -1;
let lastFocus = null;

const els = {
  filter: document.getElementById('categoryFilter'),
  masonry: document.getElementById('masonry'),
  viewSwitch: document.getElementById('viewSwitch'),
  lightbox: document.getElementById('lightbox'),
  lbImage: document.getElementById('lbImage'),
  lbCaption: document.getElementById('lbCaption'),
  lbCount: document.getElementById('lbCount'),
  lbClose: document.getElementById('lbClose'),
  lbPrev: document.getElementById('lbPrev'),
  lbNext: document.getElementById('lbNext'),
  filmstrip: document.getElementById('lbFilmstrip'),
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function titleOf(p) { return p.title || ''; }

// What sits under a photograph in the viewer: where and when it was taken, and
// what it was taken with. Every part is optional, so a manifest with nothing but
// filenames stays clean and gains detail as you fill it in.
function placeOf(p) {
  return lang() === 'en' ? (p.locationEn || p.location) : (p.location || p.locationEn);
}

// Under a tile: just where and when. The camera belongs in the viewer, where
// there is room to read it.
function placeMeta(p) {
  const bits = [];
  const place = placeOf(p);
  if (place) bits.push(place);
  if (p.date) bits.push(p.date);
  else if (p.year) bits.push(String(p.year));
  return bits.join(' · ');
}

function captionMeta(p) {
  const bits = [];
  const place = placeOf(p);
  if (place) bits.push(place);
  if (p.date) bits.push(p.date);
  else if (p.year) bits.push(String(p.year));
  const gear = [p.camera, p.focal ? `${p.focal}mm` : ''].filter(Boolean).join(' ');
  if (gear) bits.push(gear);
  return bits.join(' · ');
}

function readView() {
  try { return localStorage.getItem(VIEW_KEY) === 'index' ? 'index' : 'grid'; } catch { return 'grid'; }
}

function setView(next) {
  view = next === 'index' ? 'index' : 'grid';
  try { localStorage.setItem(VIEW_KEY, view); } catch { /* private mode */ }
  els.masonry.classList.toggle('is-index', view === 'index');
  renderViewSwitch();
}

function renderViewSwitch() {
  if (!els.viewSwitch) return;
  const option = (id, label) => `
    <button type="button" data-view="${id}" class="${view === id ? 'is-active' : ''}"
            aria-pressed="${view === id}">${escapeHtml(label)}</button>`;
  els.viewSwitch.innerHTML = option('grid', t('viewGrid')) + option('index', t('viewIndex'));

  els.viewSwitch.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });
}

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
  els.masonry.classList.toggle('is-index', view === 'index');

  if (!visible.length) {
    els.masonry.innerHTML = photos.length
      ? `<p class="notice">${escapeHtml(t('noInCategory'))}</p>`
      : `<p class="notice">${escapeHtml(t('comingSoon'))}</p>`;
    renderFilmstrip();
    return;
  }

  els.masonry.innerHTML = visible.map((p, i) => {
    const dims = p.width && p.height ? ` width="${p.width}" height="${p.height}"` : '';
    const meta = placeMeta(p);
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
      openLightbox(Number(link.dataset.index), link.querySelector('img'));
    });
  });

  renderFilmstrip();
}

// The strip mirrors the photographs currently being browsed, so it follows the
// active filter rather than always showing everything.
function renderFilmstrip() {
  if (!els.filmstrip) return;

  els.filmstrip.innerHTML = visible.map((p, i) => {
    const dims = p.width && p.height ? ` width="${p.width}" height="${p.height}"` : '';
    // A frame with no source yet still needs its shape, or the strip collapses
    // to nothing and cannot be scrolled or centred.
    const ratio = p.width && p.height ? ` style="aspect-ratio:${p.width}/${p.height}"` : '';
    const label = titleOf(p) || `${t('photoLabel')} ${i + 1}`;
    return `<button type="button" data-strip="${i}" aria-label="${escapeHtml(label)}">
      <img data-src="${p.src}" alt="" decoding="async"${dims}${ratio}>
    </button>`;
  }).join('');

  els.filmstrip.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => goTo(Number(btn.dataset.strip)));
  });

  loadThumbs();
  syncFilmstrip();
}

// Frame by frame, the strip would pull every full-size photograph the moment
// the viewer opens — fifty of them. Frames are given their source only as they
// scroll into view, so a visit costs a handful of images rather than all of
// them.
let stripObserver = null;

function fillFrame(btn) {
  const img = btn.querySelector('img[data-src]');
  if (!img) return;
  img.src = img.dataset.src;
  img.removeAttribute('data-src');
}

// The current frame and its immediate neighbours, counted rather than
// measured — the strip has no width at all until the viewer is shown.
const FRAME_WINDOW = 8;

function fillAround() {
  const frames = [...els.filmstrip.children];
  const centre = lbIndex < 0 ? 0 : lbIndex;
  frames.forEach((btn, i) => {
    if (Math.abs(i - centre) <= FRAME_WINDOW) fillFrame(btn);
  });
}

function loadThumbs() {
  fillAround();

  if (stripObserver) { stripObserver.disconnect(); stripObserver = null; }
  if (!('IntersectionObserver' in window) || !els.filmstrip.clientWidth) return;

  // everything else arrives as it scrolls into the strip
  stripObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      fillFrame(entry.target);
      stripObserver.unobserve(entry.target);
    });
  }, { root: els.filmstrip, rootMargin: '0px 600px' });

  [...els.filmstrip.children].forEach((btn) => {
    if (btn.querySelector('img[data-src]')) stripObserver.observe(btn);
  });
}

function syncFilmstrip() {
  const strip = els.filmstrip;
  if (!strip || !strip.children.length) return;

  [...strip.children].forEach((btn, i) => {
    const active = i === lbIndex;
    btn.classList.toggle('is-active', active);
    if (active) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  });

  const active = strip.children[lbIndex];
  if (!active) return;
  strip.scrollTo({
    left: active.offsetLeft - strip.clientWidth / 2 + active.offsetWidth / 2,
    behavior: reduceMotion.matches ? 'auto' : 'smooth',
  });

  fillAround();
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
  const meta = captionMeta(p);
  els.lbCaption.innerHTML =
    (titleOf(p) ? `<strong>${escapeHtml(titleOf(p))}</strong>` : '')
    + (meta ? `<span class="lightbox-meta">${escapeHtml(meta)}</span>` : '');
  els.lbCount.textContent = `${lbIndex + 1} / ${visible.length}`;
  syncFilmstrip();
}

// Opening and closing morphs the thumbnail into the photograph, where the
// browser supports view transitions. One element carries the name "photo" in
// each of the two snapshots, which is what pairs them up.
function openLightbox(index, thumb) {
  if (!visible[index]) return;
  lbIndex = index;
  lastFocus = document.activeElement;
  renderLightbox();

  const animate = thumb && canAnimate && !reduceMotion.matches;

  const update = () => {
    els.lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (thumb) thumb.style.viewTransitionName = '';
    if (animate) els.lbImage.style.viewTransitionName = 'photo';
    // now that the strip has a width, centre the current frame and load it
    requestAnimationFrame(() => {
      syncFilmstrip();
      loadThumbs();
    });
  };

  if (animate) {
    thumb.style.viewTransitionName = 'photo';
    const transition = document.startViewTransition(update);
    transition.finished.finally(() => { els.lbImage.style.viewTransitionName = ''; });
  } else {
    update();
  }

  preload(-1);
  preload(1);
  els.lbClose.focus();
  history.replaceState(null, '', `#${visible[lbIndex].id}`);
}

function closeLightbox() {
  const target = visible[lbIndex]
    ? document.getElementById(visible[lbIndex].id)?.querySelector('img')
    : null;
  const animate = target && canAnimate && !reduceMotion.matches;

  const update = () => {
    els.lightbox.classList.remove('open');
    document.body.style.overflow = '';
    if (animate) {
      els.lbImage.style.viewTransitionName = '';
      target.style.viewTransitionName = 'photo';
    }
  };

  if (animate) {
    els.lbImage.style.viewTransitionName = 'photo';
    const transition = document.startViewTransition(update);
    transition.finished.finally(() => { target.style.viewTransitionName = ''; });
  } else {
    update();
  }

  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  history.replaceState(null, '', location.pathname);
}

function goTo(index) {
  if (!visible.length) return;
  lbIndex = (index + visible.length) % visible.length;
  renderLightbox();
  preload(-1);
  preload(1);
  history.replaceState(null, '', `#${visible[lbIndex].id}`);
}

function step(delta) {
  if (lbIndex === -1) return;
  goTo(lbIndex + delta);
}

els.lbClose.addEventListener('click', closeLightbox);
els.lbPrev.addEventListener('click', () => step(-1));
els.lbNext.addEventListener('click', () => step(1));
els.lightbox.addEventListener('click', (e) => {
  if (e.target === els.lightbox || e.target.classList.contains('lightbox-stage')) closeLightbox();
});

// Tabbing along the filmstrip browses the photographs. Delegated, so it keeps
// working when the strip is rebuilt for a filter or a language change.
els.filmstrip.addEventListener('focusin', (e) => {
  const frame = e.target.closest('button[data-strip]');
  if (!frame || !els.lightbox.classList.contains('open')) return;
  const index = Number(frame.dataset.strip);
  if (index !== lbIndex) goTo(index);
});

document.addEventListener('keydown', (e) => {
  if (!els.lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  if (e.key === 'Tab') {
    // Keep focus inside the dialog, wrapping at both ends. The list is read
    // from the DOM because the strip adds a button per photograph.
    const items = [...els.lightbox.querySelectorAll('button')]
      .filter((btn) => btn.offsetParent !== null);
    if (!items.length) return;
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
  view = readView();
  try {
    photos = await loadPhotos();
  } catch {
    els.masonry.innerHTML = `<p class="notice">${escapeHtml(t('unavailable'))}</p>`;
    return;
  }
  renderViewSwitch();
  renderFilters();
  renderGrid();

  const hash = location.hash.replace('#', '');
  if (hash) {
    const idx = visible.findIndex((p) => p.id === hash);
    if (idx !== -1) openLightbox(idx);
  }
}

// Everything visible on this page is drawn by this file, labels included, so a
// language change redraws it all.
onLangChange(() => {
  if (!photos.length) return;
  renderViewSwitch();
  renderFilters();
  renderGrid();
  if (lbIndex !== -1) renderLightbox();
});

init();
