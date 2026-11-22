/**
 * MakeYUP — Favoriler & Son Bakılanlar (localStorage, UI'dan bağımsız).
 *
 * localStorage erişimi gizli sekmede / engellenmiş depolamada hata fırlatabilir;
 * bu durumda modül sessizce bellek içi (sayfa ömrü boyunca) çalışmaya devam eder.
 *
 *   getFavorites()        → string[] (en son eklenen başta)
 *   isFavorite(id)        → boolean
 *   toggleFavorite(id)    → boolean (yeni durum: true = favoride)
 *   addRecent(id)         → void   (ürün detayı açıldığında çağırın)
 *   getRecent(limit = 10) → string[] (en yeni başta)
 *   clearRecent()         → void
 *   onChange(cb)          → unsubscribe()   cb({ type: "favorites" | "recent", ids })
 */

const FAV_KEY = "makeyup:favorites:v1";
const RECENT_KEY = "makeyup:recent:v1";
const MAX_FAV = 200;
const MAX_RECENT = 30;

const memory = { [FAV_KEY]: [], [RECENT_KEY]: [] };
const listeners = new Set();

function storage() {
  try {
    const s = globalThis.localStorage;
    return s && typeof s.getItem === "function" ? s : null;
  } catch {
    return null;
  }
}

function read(key) {
  const s = storage();
  if (s) {
    try {
      const raw = s.getItem(key);
      if (raw != null) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          memory[key] = arr.filter((x) => typeof x === "string" && x);
          return memory[key].slice();
        }
      }
    } catch {
      /* bozuk JSON veya erişim hatası → bellek kopyası */
    }
  }
  return memory[key].slice();
}

function write(key, arr) {
  memory[key] = arr.slice();
  const s = storage();
  if (s) {
    try {
      s.setItem(key, JSON.stringify(arr));
    } catch {
      /* kota dolu / engelli → yalnız bellek */
    }
  }
  emit(key === FAV_KEY ? "favorites" : "recent", arr.slice());
}

function emit(type, ids) {
  for (const cb of [...listeners]) {
    try {
      cb({ type, ids });
    } catch (err) {
      if (globalThis.console) console.error(err);
    }
  }
}

const norm = (id) => (id == null ? "" : String(id).trim());

export function getFavorites() {
  return read(FAV_KEY);
}

export function isFavorite(id) {
  const key = norm(id);
  return !!key && read(FAV_KEY).includes(key);
}

export function toggleFavorite(id) {
  const key = norm(id);
  if (!key) return false;
  const list = read(FAV_KEY);
  const idx = list.indexOf(key);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(FAV_KEY, list);
    return false;
  }
  list.unshift(key);
  write(FAV_KEY, list.slice(0, MAX_FAV));
  return true;
}

export function addRecent(id) {
  const key = norm(id);
  if (!key) return;
  const list = read(RECENT_KEY).filter((x) => x !== key);
  list.unshift(key);
  write(RECENT_KEY, list.slice(0, MAX_RECENT));
}

export function getRecent(limit = 10) {
  return read(RECENT_KEY).slice(0, Math.max(0, limit));
}

export function clearRecent() {
  write(RECENT_KEY, []);
}

export function onChange(cb) {
  if (typeof cb !== "function") return () => {};
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Başka sekmede yapılan değişiklikleri de yayınla
try {
  if (typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("storage", (e) => {
      if (e && (e.key === FAV_KEY || e.key === RECENT_KEY)) {
        emit(e.key === FAV_KEY ? "favorites" : "recent", read(e.key));
      }
    });
  }
} catch {
  /* yoksay */
}
