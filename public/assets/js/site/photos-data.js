// Photo manifest loader.
//
// The manifest is meant to be edited by hand. Every entry can be as small as
//   { "file": "metsa.jpg" }
// and everything else is optional:
//
//   file      filename inside /photos/            (required)
//   title     shown under the photograph
//   category  used by the filter row
//   featured  true → used as the homepage hero
//   date      free text, e.g. "2025"
//   location  free text
//   width     image width in pixels   (never type this by hand:
//   height    image height in pixels   `npm run photos` fills it in)
//
// `src` and `id` are still accepted for compatibility with older entries.

let cache = null;

const PHOTO_DIR = '/photos/';

function normalize(entry, index) {
  if (!entry || typeof entry !== 'object') return null;

  const file = typeof entry.file === 'string' ? entry.file.trim() : '';
  const src = entry.src || (file ? PHOTO_DIR + file : '');
  if (!src) return null;

  const id = entry.id
    || file.replace(/\.[a-z0-9]+$/i, '')
    || `photo-${index + 1}`;

  return {
    ...entry,
    id,
    src,
    title: entry.title || '',
    description: entry.description || '',
    category: entry.category || '',
    date: entry.date || '',
    location: entry.location || '',
    featured: entry.featured === true,
    width: Number(entry.width) || 0,
    height: Number(entry.height) || 0,
  };
}

export async function loadPhotos() {
  if (cache) return cache;
  const res = await fetch('/data/photos.json');
  if (!res.ok) throw new Error('Could not load photo data');
  const raw = await res.json();
  const list = Array.isArray(raw) ? raw : [];
  cache = list.map(normalize).filter(Boolean);
  return cache;
}

export function categories(photos) {
  return [...new Set(photos.map((p) => p.category).filter(Boolean))].sort();
}
