const STORAGE = 'btools-v3';

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(`${STORAGE}.${key}`)) ?? fallback; }
  catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(`${STORAGE}.${key}`, JSON.stringify(value)); }
  catch { /* storage unavailable — degrade silently, never crash the app */ }
}

export const state = {
  windows: {},
  z: 10,
  favorites: read('favorites', []),
  recent: read('recent', []),
  windowState: read('windowState', {}), // per-tool remembered size/position
  drag: null,
  resize: null,
};

export function saveFavorites() { write('favorites', state.favorites); }
export function saveRecent() { write('recent', state.recent); }
export function saveWindowState() { write('windowState', state.windowState); }

export function noteRecent(id) {
  state.recent = [id, ...state.recent.filter(x => x !== id)].slice(0, 10);
  saveRecent();
}

export function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id)
    ? state.favorites.filter(x => x !== id)
    : [...state.favorites, id];
  saveFavorites();
}

export const STORAGE_PREFIX = STORAGE;
