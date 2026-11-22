/**
 * MakeYUP — Favori Ürünler Yönetimi (localStorage: makeyup-favs)
 */

const STORAGE_KEY = "makeyup-favs";

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Depolama doluysa sessizce yoksay
  }
}

export function getFavs() {
  return readStorage();
}

export function isFav(id) {
  if (!id) return false;
  return readStorage().some((item) => item.id === id);
}

export function toggleFav(product) {
  if (!product || !product.id) return false;
  const list = readStorage();
  const idx = list.findIndex((item) => item.id === product.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    writeStorage(list);
    return false;
  }

  const ingredientsText =
    product.ingredientsText ||
    (Array.isArray(product.ingredients) ? product.ingredients.join(", ") : "");

  const snapshot = {
    id: product.id,
    name: String(product.name || "Kozmetik Ürünü").trim(),
    brand: String(product.brand || "Diğer Marka").trim(),
    image: product.image || "assets/images/foundation.jpg",
    ingredientsText: String(ingredientsText || "").slice(0, 1500),
    categoryLabel: String(product.categoryLabel || "Kozmetik & Bakım"),
    source: product.source || "local"
  };

  list.unshift(snapshot);
  writeStorage(list);
  return true;
}
