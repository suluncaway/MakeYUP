/**
 * MakeYUP — Affiliate (satış ortaklığı) link üretici ve tıklama sayacı.
 * Bağımlılık yok, ES module. Yapılandırma: js/data/affiliate_config.js
 *
 * Kullanım (UI tarafı için öneri):
 *   import { buyLinks, trackClick, affiliateDisclosure, LINK_REL } from "./affiliate.js";
 *   for (const l of buyLinks(product)) {
 *     // <a href="${l.url}" target="_blank" rel="${LINK_REL}" data-store="${l.store}">${l.name}</a>
 *     // a.addEventListener("click", () => trackClick(l.store, product.id));
 *   }
 *   // Linklerin hemen yanında/üstünde affiliateDisclosure() metnini GÖRÜNÜR şekilde gösterin.
 *
 * rel="sponsored nofollow noopener": ücretli/komisyonlu linkler için Google'ın istediği
 * işaretleme ("sponsored"), PageRank aktarmama ("nofollow") ve target=_blank güvenliği ("noopener").
 */

import { AFFILIATE_CONFIG } from "./data/affiliate_config.js";

export const LINK_REL = AFFILIATE_CONFIG.rel || "sponsored nofollow noopener";

const STORAGE_KEY = "makeyup_affiliate_clicks_v1";

/** Ürün nesnesinden marka/ad/GTIN alanlarını çıkarır (products.js ve beauty_catalog.json biçimlerini destekler). */
function normalizeProduct(product = {}) {
  const brand = String(product.brand ?? product.b ?? "").trim();
  const name = String(product.name ?? product.n ?? "").trim();
  const rawGtin = product.gtin ?? product.ean ?? product.barcode ?? product.g;
  const candidates = Array.isArray(rawGtin) ? rawGtin : rawGtin != null ? [rawGtin] : [];
  // Geçerli uzunlukta ilk barkodu al (EAN-8, UPC-A 12, EAN-13, GTIN-14); TR (869) barkodlarını öne al.
  const valid = candidates.map((g) => String(g).replace(/\D/g, "")).filter((g) => [8, 12, 13, 14].includes(g.length));
  const gtin = valid.find((g) => g.startsWith("869")) || valid[0] || "";
  return { brand, name, gtin };
}

function buildQuery({ brand, name }) {
  // Ürün adı zaten markayı içeriyorsa tekrar ekleme.
  const q = name.toLowerCase().includes(brand.toLowerCase()) ? name : `${brand} ${name}`;
  return q.replace(/\s+/g, " ").trim();
}

function isStoreAffiliate(store) {
  return Boolean(store.tag && (store.tagParam || store.wrapTemplate));
}

function storeUrl(store, query) {
  let url = store.searchTemplate.replace("{query}", encodeURIComponent(query));
  if (!store.tag) return url;
  if (store.tagParam) {
    url += (url.includes("?") ? "&" : "?") + `${encodeURIComponent(store.tagParam)}=${encodeURIComponent(store.tag)}`;
  }
  if (store.wrapTemplate) {
    url = store.wrapTemplate.replace("{tag}", encodeURIComponent(store.tag)).replace("{url}", encodeURIComponent(url));
  }
  return url;
}

function activeStores(brand = "") {
  if (!AFFILIATE_CONFIG.enabled) return [];
  const b = brand.toLowerCase();
  return AFFILIATE_CONFIG.stores
    .filter((s) => s.enabled && s.searchTemplate)
    .filter((s) => !s.onlyBrands || s.onlyBrands.some((ob) => b.includes(ob)))
    .sort((a, z) => (a.priority ?? 99) - (z.priority ?? 99));
}

/**
 * Ürün için mağaza linklerini döndürür.
 * @param {{brand?:string,name?:string,gtin?:string|string[],b?:string,n?:string,g?:string[]}} product
 * @returns {{store:string,name:string,url:string,isAffiliate:boolean}[]}
 */
export function buyLinks(product) {
  const p = normalizeProduct(product);
  if (!p.brand && !p.name && !p.gtin) return [];
  const textQuery = buildQuery(p);
  return activeStores(p.brand).map((s) => {
    const query = s.supportsGtin && p.gtin ? p.gtin : textQuery;
    return { store: s.id, name: s.name, url: storeUrl(s, query || p.gtin), isAffiliate: isStoreAffiliate(s) };
  });
}

/**
 * Tıklamayı localStorage'a sayar ve varsa gtag / plausible'a olay gönderir.
 * Hiçbir kişisel veri toplanmaz; yalnızca mağaza + ürün kimliği.
 */
export function trackClick(storeId, productId) {
  const store = AFFILIATE_CONFIG.stores.find((s) => s.id === storeId);
  const isAffiliate = store ? isStoreAffiliate(store) : false;
  const pid = String(productId ?? "unknown");

  try {
    if (typeof localStorage !== "undefined") {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      data[storeId] = data[storeId] || { total: 0, products: {} };
      data[storeId].total += 1;
      data[storeId].products[pid] = (data[storeId].products[pid] || 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (_) { /* gizli mod / engelli depolama: sessizce geç */ }

  const props = { store: storeId, product_id: pid, is_affiliate: isAffiliate };
  try {
    if (typeof window !== "undefined") {
      if (typeof window.gtag === "function") window.gtag("event", "affiliate_click", props);
      if (typeof window.plausible === "function") window.plausible("Affiliate Click", { props });
    }
  } catch (_) { /* analitik hatası UI'ı bozmasın */ }
}

/** localStorage'daki tıklama sayılarını döndürür (yerel hata ayıklama için). */
export function getClickStats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (_) {
    return {};
  }
}

/** En az bir mağazada gerçek affiliate kimliği tanımlı mı? */
export function hasActiveAffiliates() {
  return activeStores().some(isStoreAffiliate);
}

/** Linklerin yanında gösterilecek Türkçe reklam/iş birliği beyanı. */
export function affiliateDisclosure() {
  return AFFILIATE_CONFIG.disclosure;
}
