let cache = null;

export async function loadPhotos() {
  if (cache) return cache;
  const res = await fetch('/data/photos.json');
  if (!res.ok) throw new Error('Could not load photo data');
  cache = await res.json();
  return cache;
}

export function categories(photos) {
  return [...new Set(photos.map(p => p.category).filter(Boolean))].sort();
}
