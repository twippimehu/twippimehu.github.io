// Language switch.
//
// Finnish is the site's own language and the default; English is there for
// anyone who needs it. Every translatable string exists twice in the markup,
// once with lang="fi" and once with lang="en", and CSS lays out only the one
// matching <html data-lang>. Strings that JavaScript generates come from the
// table below.
//
// The choice is kept in localStorage, and a small inline script in each page's
// <head> applies it before the first paint so the two versions never flash.

const STRINGS = {
  fi: {
    all: 'Kaikki',
    openPrefix: 'Avaa',
    openPhoto: 'Avaa valokuva',
    noInCategory: 'Ei kuvia tässä kategoriassa vielä.',
    comingSoon: 'Kuvia tulossa.',
    unavailable: 'Kuvat eivät ole juuri nyt saatavilla.',
    recentComingSoon: 'Kuvia tulossa.',
  },
  en: {
    all: 'All',
    openPrefix: 'Open',
    openPhoto: 'Open photograph',
    noInCategory: 'No photographs in this category yet.',
    comingSoon: 'Photographs coming soon.',
    unavailable: 'Photographs are unavailable right now.',
    recentComingSoon: 'Photographs coming soon.',
  },
};

const STORAGE_KEY = 'lang';

export function lang() {
  return document.documentElement.dataset.lang === 'en' ? 'en' : 'fi';
}

export function t(key) {
  return STRINGS[lang()][key] ?? STRINGS.fi[key] ?? key;
}

export function onLangChange(fn) {
  window.addEventListener('langchange', fn);
  return () => window.removeEventListener('langchange', fn);
}

function apply(next) {
  const root = document.documentElement;
  root.setAttribute('lang', next);
  root.setAttribute('data-lang', next);

  const title = document.querySelector('title');
  if (title && title.dataset[next]) title.textContent = title.dataset[next];

  document.querySelectorAll('[data-label-fi]').forEach((el) => {
    const label = next === 'en' ? el.dataset.labelEn : el.dataset.labelFi;
    if (label) el.setAttribute('aria-label', label);
  });

  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.textContent = next === 'fi' ? 'EN' : 'FI';
    btn.setAttribute('aria-label', next === 'fi' ? 'Vaihda englanniksi' : 'Switch to Finnish');
    btn.setAttribute('lang', next === 'fi' ? 'en' : 'fi');
  });

  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode */ }

  window.dispatchEvent(new Event('langchange'));
}

export function setLang(next) {
  apply(next === 'en' ? 'en' : 'fi');
}

function mount() {
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(lang() === 'fi' ? 'en' : 'fi'));
  });
  apply(lang());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
