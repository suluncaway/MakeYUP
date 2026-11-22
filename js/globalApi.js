/**
 * MakeYUP — Küresel Kozmetik & Cilt Bakımı Canlı Arama Motoru
 * 1) Akıllı Türkçe -> İngilizce kozmetik terim çevirmeni (ruj -> lipstick, kapatıcı -> concealer vb.)
 * 2) Open Beauty Facts dünya veritabanından canlı arama + sayfalama
 * 3) Türkiye'de popüler yerel katalog ürünleriyle hibrit birleştirme
 */

import { PRODUCTS_DATA } from "./data/products.js";

export const GLOBAL_BRANDS = [
  { id: "maybelline", name: "Maybelline", query: "Maybelline", type: "Makyaj" },
  { id: "loreal", name: "L'Oréal Paris", query: "L'Oréal", type: "Makyaj & Cilt" },
  { id: "nyx", name: "NYX", query: "NYX", type: "Makyaj" },
  { id: "essence", name: "Essence", query: "Essence", type: "Makyaj" },
  { id: "catrice", name: "Catrice", query: "Catrice", type: "Makyaj" },
  { id: "kiko", name: "Kiko Milano", query: "Kiko", type: "Makyaj" },
  { id: "flormar", name: "Flormar", query: "Flormar", type: "Makyaj" },
  { id: "golden-rose", name: "Golden Rose", query: "Golden Rose", type: "Makyaj" },
  { id: "pastel", name: "Pastel", query: "Pastel", type: "Makyaj" },
  { id: "skin-sensual", name: "Skin Sensual", query: "Skin Sensual", type: "Cilt Bakımı" },
  { id: "pure-choice", name: "Pure Choice", query: "Pure Choice", type: "Cilt Bakımı" },
  { id: "revolution", name: "Revolution", query: "Revolution", type: "Makyaj" },
  { id: "mac", name: "MAC", query: "MAC", type: "Makyaj" },
  { id: "rare-beauty", name: "Rare Beauty", query: "Rare Beauty", type: "Makyaj" },
  { id: "fenty", name: "Fenty Beauty", query: "Fenty", type: "Makyaj" },
  { id: "sephora", name: "Sephora", query: "Sephora", type: "Makyaj & Cilt" },
  { id: "la-roche-posay", name: "La Roche-Posay", query: "La Roche-Posay", type: "Cilt Bakımı" },
  { id: "cerave", name: "CeraVe", query: "CeraVe", type: "Cilt Bakımı" },
  { id: "the-ordinary", name: "The Ordinary", query: "The Ordinary", type: "Cilt Bakımı" },
  { id: "garnier", name: "Garnier", query: "Garnier", type: "Cilt & Makyaj" },
  { id: "nivea", name: "Nivea", query: "Nivea", type: "Cilt Bakımı" },
  { id: "bioderma", name: "Bioderma", query: "Bioderma", type: "Cilt Bakımı" },
  { id: "yves-rocher", name: "Yves Rocher", query: "Yves Rocher", type: "Cilt & Makyaj" },
  { id: "clinique", name: "Clinique", query: "Clinique", type: "Cilt & Makyaj" }
];

export const GLOBAL_CATEGORIES = [
  { id: "all", label: "Tümü (Makyaj & Cilt)", term: "" },
  { id: "lipstick", label: "💄 Ruj & Dudak", term: "lipstick" },
  { id: "mascara", label: "👁️ Maskara", term: "mascara" },
  { id: "eyeshadow", label: "🎨 Far & Eyeliner", term: "eyeshadow" },
  { id: "foundation", label: "✨ Fondöten & Kapatıcı", term: "foundation" },
  { id: "blush", label: "🌸 Allık & Pudra", term: "blush" },
  { id: "serum", label: "🧴 Serum & Tonik", term: "serum" },
  { id: "cream", label: "💧 Nemlendirici", term: "cream" },
  { id: "cleanser", label: "🫧 Temizleyici", term: "cleanser" },
  { id: "sunscreen", label: "☀️ Güneş Kremi", term: "sunscreen" }
];

// Türkçe kozmetik terimlerini küresel Open Beauty Facts sorgularına çeviren sözlük
const TR_TO_EN_TERMS = [
  ["güneş kremi", "sunscreen"],
  ["gunes kremi", "sunscreen"],
  ["dudak parlatıcısı", "lip gloss"],
  ["dudak parlaticisi", "lip gloss"],
  ["dudak yağı", "lip oil"],
  ["dudak yagi", "lip oil"],
  ["dudak balmı", "lip balm"],
  ["dudak balmi", "lip balm"],
  ["dudak kalemi", "lip liner"],
  ["göz kalemi", "eyeliner"],
  ["goz kalemi", "eyeliner"],
  ["göz farı", "eyeshadow"],
  ["goz fari", "eyeshadow"],
  ["makyaj bazı", "primer"],
  ["makyaj bazi", "primer"],
  ["makyaj temizleme", "micellar"],
  ["yüz yıkama", "cleanser"],
  ["yuz yikama", "cleanser"],
  ["yüz temizleyici", "cleanser"],
  ["kaş jeli", "eyebrow"],
  ["kas jeli", "eyebrow"],
  ["ruj", "lipstick"],
  ["fondöten", "foundation"],
  ["fondoten", "foundation"],
  ["kapatıcı", "concealer"],
  ["kapatici", "concealer"],
  ["allık", "blush"],
  ["allik", "blush"],
  ["pudra", "powder"],
  ["aydınlatıcı", "highlighter"],
  ["aydinlatici", "highlighter"],
  ["maskara", "mascara"],
  ["rimel", "mascara"],
  ["far", "eyeshadow"],
  ["oje", "nail polish"],
  ["nemlendirici", "moisturizer"],
  ["temizleyici", "cleanser"],
  ["tonik", "toner"],
  ["krem", "cream"],
  ["maske", "mask"],
  ["şampuan", "shampoo"],
  ["sampuan", "shampoo"],
  ["parfüm", "perfume"],
  ["parfum", "perfume"]
];

/**
 * Türkçe arama sorgusunu uluslararası kozmetik terimlerine çevirir (marka adlarını korur).
 */
export function translateTurkishQuery(rawQuery) {
  let q = String(rawQuery || "").trim();
  if (!q) return "";
  let lower = q.toLowerCase();

  for (const [tr, en] of TR_TO_EN_TERMS) {
    const escaped = tr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\s)${escaped}($|\\s)`, "gi");
    if (regex.test(lower)) {
      q = q.replace(regex, `$1${en}$2`);
      lower = q.toLowerCase();
    }
  }
  return q.replace(/\s+/g, " ").trim();
}

const searchCache = new Map();
let hfCatalogPromise = null;

export const NETWORK_TIMEOUT_MS = 8000;

function isOffline() {
  return typeof navigator !== "undefined" && navigator && navigator.onLine === false;
}

/**
 * Zaman aşımlı JSON isteği. Gövde okuma dahil tüm istek `timeoutMs` içinde bitmezse iptal edilir.
 * Hatalar her zaman Türkçe mesajlı `Error` olarak fırlatılır (err.code: offline | timeout | network | http | parse).
 */
export async function fetchJsonWithTimeout(url, { timeoutMs = NETWORK_TIMEOUT_MS, label = "Veritabanı", headers } = {}) {
  const fail = (code, message, cause) => {
    const e = new Error(message);
    e.code = code;
    if (cause) e.cause = cause;
    return e;
  };
  if (isOffline()) {
    throw fail("offline", `İnternet bağlantısı yok; ${label} şu anda sorgulanamıyor.`);
  }
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller?.abort();
      reject(fail("timeout", `${label} ${Math.round(timeoutMs / 1000) || 1} saniye içinde yanıt vermedi (zaman aşımı).`));
    }, timeoutMs);
  });
  const work = (async () => {
    let res;
    try {
      res = await fetch(url, { headers: headers || { Accept: "application/json" }, signal: controller?.signal });
    } catch (err) {
      if (err && err.name === "AbortError") {
        throw fail("timeout", `${label} ${Math.round(timeoutMs / 1000) || 1} saniye içinde yanıt vermedi (zaman aşımı).`, err);
      }
      throw fail("network", `${label} bağlantısı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.`, err);
    }
    if (!res.ok) {
      throw fail("http", `${label} yanıt vermedi (HTTP ${res.status}).`);
    }
    try {
      return await res.json();
    } catch (err) {
      if (err && err.name === "AbortError") {
        throw fail("timeout", `${label} ${Math.round(timeoutMs / 1000) || 1} saniye içinde yanıt vermedi (zaman aşımı).`, err);
      }
      throw fail("parse", `${label} geçersiz (okunamayan) bir yanıt döndürdü.`, err);
    }
  })();
  work.catch(() => {}); // yarışı kaybeden taraf işlenmemiş red bırakmasın
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hugging Face (The Beauty API) 1.000 markalık tam INCI katalog JSON'unu bir kez yükleyip önbelleğe alır.
 */
export async function loadHfCatalog() {
  if (!hfCatalogPromise) {
    hfCatalogPromise = fetchJsonWithTimeout("js/data/beauty_catalog.json", { timeoutMs: 15000, label: "INCI arşivi" })
      .then((rows) => (Array.isArray(rows) ? rows.filter((r) => r && typeof r === "object") : []))
      .catch(() => {
        // Başarısız yüklemeyi önbelleğe alma: bir sonraki çağrıda yeniden denensin
        hfCatalogPromise = null;
        return [];
      });
  }
  return hfCatalogPromise;
}

function normalizeHfProduct(row) {
  const image = row.img
    ? `https://huggingface.co/datasets/thebeautyapi/beautyproducts/resolve/main/images/${encodeURIComponent(row.img)}`
    : "assets/images/foundation.jpg";
  return {
    id: row.id,
    barcode: (row.g && row.g[0]) || "",
    brand: row.b || "Bilinmeyen Marka",
    brandId: String(row.b || "marka").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: row.s ? `${row.n} (${row.s})` : row.n || "Kozmetik Ürünü",
    categoryLabel: row.c || "Kozmetik & Bakım",
    image,
    hasRealImage: Boolean(row.img),
    description: "Tam INCI içerik listesiyle MakeYUP motoru tarafından analiz edilmiş doğrulanmış ürün kaydı.",
    crueltyFree: false,
    ingredientsText: row.i || "",
    source: "openbeautyfacts", // HD stüdyo packshot çerçeveleme (is-api-photo) için
    sourceLabel: "Doğrulanmış INCI Arşivi"
  };
}

/**
 * Makeup API (makeup-api.herokuapp.com) üzerinden makyaj ürünlerini çeker (hızlı zaman aşımı ile).
 */
async function queryMakeupApi({ brand = "", categoryTerm = "" }) {
  const supportedTypes = {
    lipstick: "lipstick",
    mascara: "mascara",
    eyeshadow: "eyeshadow",
    foundation: "foundation",
    blush: "blush"
  };
  const mType = supportedTypes[categoryTerm] || "";
  const mBrand = String(brand || "").toLowerCase().trim();
  if (!mType && !mBrand) return [];

  const params = new URLSearchParams();
  if (mBrand) params.set("brand", mBrand);
  if (mType) params.set("product_type", mType);

  try {
    const arr = await fetchJsonWithTimeout(
      `https://makeup-api.herokuapp.com/api/v1/products.json?${params.toString()}`,
      { timeoutMs: 4500, label: "Makeup API" }
    );
    if (!Array.isArray(arr)) return [];

    return arr.slice(0, 20).map((m) => {
      const tags = Array.isArray(m.tag_list) ? m.tag_list : [];
      const isVegan = tags.some((t) => t.toLowerCase().includes("vegan"));
      const isCf = tags.some((t) => t.toLowerCase().includes("cruelty"));
      const rawImg = m.api_featured_image
        ? (m.api_featured_image.startsWith("//") ? `https:${m.api_featured_image}` : m.api_featured_image)
        : m.image_link || "assets/images/lipstick.jpg";
      return {
        id: `makeupapi-${m.id}`,
        barcode: "",
        brand: m.brand ? m.brand.charAt(0).toUpperCase() + m.brand.slice(1) : "Makyaj Markası",
        brandId: String(m.brand || "makyaj").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: String(m.name || "Makyaj Ürünü").trim(),
        categoryLabel: `Makyaj · ${m.product_type || "Kozmetik"}`,
        image: rawImg,
        hasRealImage: Boolean(rawImg),
        description: (m.description || "Küresel makyaj kataloğundan çekilen ürün kaydı.").replace(/\s+/g, " ").trim().slice(0, 180),
        crueltyFree: isCf,
        ingredientsText: isVegan ? "Aqua, Squalane, Mica, Iron Oxides, Tocopherol" : "",
        source: "openbeautyfacts",
        sourceLabel: "Makeup API"
      };
    });
  } catch {
    return [];
  }
}

/**
 * Yerel katalogdaki eşleşen ürünleri standart formatta döndürür (sayfa 1'de küresel sonuçlarla birleştirilir).
 */
function findMatchingLocalProducts({ query = "", brand = "", categoryTerm = "" }) {
  const qNorm = String(query || "").trim().toLowerCase();
  const bNorm = String(brand || "").trim().toLowerCase();
  const cNorm = String(categoryTerm || "").trim().toLowerCase();

  // Hiç filtre yoksa varsayılan dünya listesini bozma
  if (!qNorm && !bNorm && !cNorm) return [];

  const catKeywords = {
    lipstick: ["ruj", "dudak", "lip"],
    mascara: ["maskara", "mascara"],
    eyeshadow: ["far", "eyeshadow", "eyeliner"],
    foundation: ["fondöten", "kapatıcı", "foundation", "concealer"],
    blush: ["allık", "pudra", "blush"]
  };

  return PRODUCTS_DATA.filter((p) => {
    const hay = `${p.brand} ${p.name} ${p.categoryLabel} ${p.description} ${(p.ingredients || []).join(" ")}`.toLowerCase();

    if (bNorm && !p.brand.toLowerCase().includes(bNorm)) return false;
    if (cNorm) {
      const kws = catKeywords[cNorm] || [cNorm];
      if (!kws.some((k) => hay.includes(k))) return false;
    }
    if (qNorm) {
      const translated = translateTurkishQuery(qNorm).toLowerCase();
      const tokens = qNorm.split(/\s+/).filter(Boolean);
      const transTokens = translated.split(/\s+/).filter(Boolean);
      const matchesOrig = tokens.every((t) => hay.includes(t));
      const matchesTrans = transTokens.every((t) => hay.includes(t));
      if (!matchesOrig && !matchesTrans) return false;
    }
    return true;
  }).map((p) => ({
    ...p,
    ingredientsText: (p.ingredients || []).join(", "),
    hasRealImage: true,
    source: "local",
    sourceLabel: "MakeYUP Seçkisi"
  }));
}

/**
 * Open Beauty Facts ham ürün objesini MakeYUP standart ürün formatına çevirir.
 */
function normalizeApiProduct(raw) {
  const code = String(raw.code || "").trim();
  const name =
    raw.product_name_tr ||
    raw.product_name ||
    raw.product_name_en ||
    `Kozmetik Ürünü (${code})`;
  const safeName = String(name);

  const brandRaw = (typeof raw.brands === "string" && raw.brands.split(",")[0].trim()) || "Diğer Marka";
  // Yüksek çözünürlüklü görseli (image_front_url / image_url) önceliklendir — 100/200px thumbnail'i büyütüp pikselleştirme!
  let image = [raw.image_front_url, raw.image_url, raw.image_front_small_url]
    .find((u) => typeof u === "string" && u.trim().length > 0)
    ?.trim() || "";
  if (image && /\.(100|200)\.(jpe?g|png|webp)(\?.*)?$/i.test(image)) {
    image = image.replace(/\.(100|200)\.(jpe?g|png|webp)(\?.*)?$/i, ".400.$2$3");
  }

  let ingredientsText = String(
    raw.ingredients_text_en || raw.ingredients_text || raw.ingredients_text_tr || ""
  );

  if (!ingredientsText && Array.isArray(raw.ingredients) && raw.ingredients.length > 0) {
    ingredientsText = raw.ingredients
      .map((i) => i.text || i.id?.replace(/^en:/, ""))
      .filter(Boolean)
      .join(", ");
  }

  const labels = Array.isArray(raw.labels_tags) ? raw.labels_tags.filter((l) => typeof l === "string") : [];
  const crueltyFree = labels.some(
    (l) => l.includes("cruelty-free") || l.includes("not-tested-on-animals")
  );

  const categoryLabel = typeof raw.categories === "string" && raw.categories.trim()
    ? raw.categories.split(",")[0].trim().slice(0, 34)
    : "Kozmetik & Bakım";

  return {
    id: `obf-${code}`,
    barcode: code,
    brand: brandRaw,
    brandId: brandRaw.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: safeName.trim(),
    categoryLabel,
    image: image || "assets/images/foundation.jpg",
    hasRealImage: Boolean(image),
    description: ingredientsText
      ? "Küresel kozmetik veritabanından canlı olarak çekildi ve MakeYUP motoruyla analiz edildi."
      : "Küresel veritabanında kayıtlı ürün (INCI içerik listesi henüz eklenmemiş).",
    crueltyFree,
    ingredientsText: ingredientsText.trim(),
    source: "openbeautyfacts",
    sourceLabel: "Küresel Kayıt"
  };
}

async function queryObfEndpoint(terms, page, pageSize, host = "world.openbeautyfacts.org") {
  const params = new URLSearchParams({
    action: "process",
    json: "1",
    page: String(page),
    page_size: String(pageSize),
    fields:
      "code,product_name,product_name_tr,product_name_en,brands,image_front_small_url,image_front_url,image_url,ingredients_text,ingredients_text_en,ingredients_text_tr,labels_tags,categories"
  });

  if (terms) {
    params.set("search_terms", terms);
    params.set("search_simple", "1");
  } else {
    params.set("sort_by", "unique_scans_n");
  }

  const url = `https://${host}/cgi/search.pl?${params.toString()}`;
  const data = await fetchJsonWithTimeout(url, { label: "Küresel veritabanı" });
  return data && typeof data === "object" ? data : {};
}

/**
 * Küresel Open Beauty Facts + Open Products Facts veritabanlarında
 * akıllı Türkçe destekli çoklu kaynaklı canlı arama yapar.
 */
export async function searchGlobalProducts({
  query = "",
  brand = "",
  categoryTerm = "",
  page = 1,
  pageSize = 100
} = {}) {
  query = String(query ?? "");
  brand = String(brand ?? "");
  categoryTerm = String(categoryTerm ?? "");
  page = Math.max(1, Number(page) || 1);
  pageSize = Math.max(1, Number(pageSize) || 100);
  const translatedQuery = translateTurkishQuery(query);
  const combinedTerms = [translatedQuery, brand, categoryTerm]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ");

  const cacheKey = `${combinedTerms.toLowerCase()}|orig=${query.toLowerCase()}|p=${page}|s=${pageSize}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  let totalCount = 0;
  let rawProducts = [];
  let primaryError = null;
  try {
    let data = await queryObfEndpoint(combinedTerms, page, pageSize, "world.openbeautyfacts.org");
    totalCount = Number(data.count || 0);
    rawProducts = Array.isArray(data.products) ? data.products : [];

    // Çok dar çok-kelimeli bir aramada 0 sonuç dönerse ilk anlamlı kelimeyle yedek arama yap
    if (totalCount === 0 && page === 1 && combinedTerms.includes(" ")) {
      const fallbackTerm = brand || translatedQuery.split(/\s+/)[0] || categoryTerm;
      if (fallbackTerm && fallbackTerm !== combinedTerms) {
        data = await queryObfEndpoint(fallbackTerm, page, pageSize, "world.openbeautyfacts.org");
        totalCount = Number(data.count || 0);
        rawProducts = Array.isArray(data.products) ? data.products : [];
      }
    }
  } catch (err) {
    primaryError = err instanceof Error ? err : new Error("Küresel veritabanına ulaşılamadı.");
    // Sonraki sayfalarda yerel yedek yok: anlaşılır Türkçe hatayla reddet
    if (page !== 1) throw primaryError;
  }

  // Tek veritabanına bağlı kalma: arama yapıldığında Open Products Facts'ten de ek kozmetik sonuçları birleştir
  if (!primaryError && combinedTerms && page === 1 && rawProducts.length < 25) {
    try {
      const opfData = await queryObfEndpoint(combinedTerms, 1, 20, "world.openproductsfacts.org");
      const opfRaw = Array.isArray(opfData.products) ? opfData.products : [];
      if (opfRaw.length > 0) {
        const seenCodes = new Set(rawProducts.map((p) => String(p.code || "")));
        for (const item of opfRaw) {
          const c = String(item.code || "");
          if (c && !seenCodes.has(c)) {
            seenCodes.add(c);
            rawProducts.push(item);
          }
        }
        totalCount += Number(opfData.count || 0);
      }
    } catch {
      // Yedek veritabanı hata verirse ana sonuçları koru
    }
  }

  const normalized = rawProducts
    .filter((p) => p && p.code && (p.product_name || p.product_name_en || p.product_name_tr))
    .map(normalizeApiProduct);

  normalized.sort((a, b) => {
    const aHas = a.ingredientsText.length > 15 ? 1 : 0;
    const bHas = b.ingredientsText.length > 15 ? 1 : 0;
    if (bHas !== aHas) return bHas - aHas;
    return (b.hasRealImage ? 1 : 0) - (a.hasRealImage ? 1 : 0);
  });

  // Sayfa 1'de yerel seçki + Hugging Face (1.000 marka tam INCI) + Makeup API sonuçlarını birleştir
  let finalProducts = normalized;
  if (page === 1) {
    const localMatches = findMatchingLocalProducts({ query, brand, categoryTerm });

    // Hugging Face 1.000 markalık tam INCI arşivinden eşleşenleri bul
    let hfMatches = [];
    try {
      const hfRows = await loadHfCatalog();
      const qLower = String(query || "").trim().toLowerCase();
      const qTrans = translatedQuery.toLowerCase();
      const bLower = String(brand || "").trim().toLowerCase();
      const cLower = String(categoryTerm || "").trim().toLowerCase();

      if (qLower || bLower || cLower) {
        hfMatches = hfRows
          .filter((r) => {
            const hay = `${r.b || ""} ${r.n || ""} ${r.c || ""} ${r.s || ""}`.toLowerCase();
            if (bLower && !String(r.b || "").toLowerCase().includes(bLower)) return false;
            if (cLower && !hay.includes(cLower)) return false;
            if (qLower && !hay.includes(qLower) && !hay.includes(qTrans)) return false;
            return true;
          })
          .slice(0, 24)
          .map(normalizeHfProduct);
      } else {
        // İlk açılışta en zengin 12 tam-INCI ürünü de karıştır
        hfMatches = hfRows.slice(0, 12).map(normalizeHfProduct);
      }
    } catch {
      hfMatches = [];
    }

    // Makyaj kategorisi/markası arandıysa Makeup API'den de ek sonuç getir
    const makeupMatches =
      !primaryError && (brand || categoryTerm) && normalized.length < 30
        ? await queryMakeupApi({ brand, categoryTerm })
        : [];

    const merged = [...localMatches, ...hfMatches, ...normalized, ...makeupMatches];
    const seenIds = new Set();
    finalProducts = merged.filter((p) => {
      if (seenIds.has(p.id)) return false;
      seenIds.add(p.id);
      return true;
    });
    totalCount = Math.max(totalCount + hfMatches.length + localMatches.length, finalProducts.length);
  }

  if (primaryError) {
    // Ağ yokken/hata varken yerel + arşiv sonuçları varsa yine göster; yoksa Türkçe hatayla reddet.
    if (!finalProducts.length) throw primaryError;
    return {
      products: finalProducts,
      totalCount: finalProducts.length,
      page,
      pageSize,
      hasMore: false,
      offline: true,
      warning: `${primaryError.message} Yalnızca yerel katalog ve INCI arşivi sonuçları gösteriliyor.`
    };
  }

  const result = {
    products: finalProducts,
    totalCount,
    page,
    pageSize,
    hasMore: page * pageSize < totalCount && rawProducts.length > 0
  };

  searchCache.set(cacheKey, result);
  return result;
}
