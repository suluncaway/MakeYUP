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
    const hay = `${p.brand} ${p.name} ${p.categoryLabel} ${p.description} ${p.ingredients.join(" ")}`.toLowerCase();

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
    ingredientsText: p.ingredients.join(", "),
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

  const brandRaw = raw.brands ? raw.brands.split(",")[0].trim() : "Diğer Marka";
  const image = raw.image_front_small_url || raw.image_front_url || raw.image_url || "";

  let ingredientsText =
    raw.ingredients_text_en || raw.ingredients_text || raw.ingredients_text_tr || "";

  if (!ingredientsText && Array.isArray(raw.ingredients) && raw.ingredients.length > 0) {
    ingredientsText = raw.ingredients
      .map((i) => i.text || i.id?.replace(/^en:/, ""))
      .filter(Boolean)
      .join(", ");
  }

  const labels = Array.isArray(raw.labels_tags) ? raw.labels_tags : [];
  const crueltyFree = labels.some(
    (l) => l.includes("cruelty-free") || l.includes("not-tested-on-animals")
  );

  const categoryLabel = raw.categories
    ? raw.categories.split(",")[0].trim().slice(0, 34)
    : "Kozmetik & Bakım";

  return {
    id: `obf-${code}`,
    barcode: code,
    brand: brandRaw,
    brandId: brandRaw.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: name.trim(),
    categoryLabel,
    image: image || "assets/images/foundation.jpg",
    hasRealImage: Boolean(image),
    description: ingredientsText
      ? "Open Beauty Facts küresel kozmetik veritabanından canlı olarak çekildi ve MakeYUP motoruyla analiz edildi."
      : "Küresel veritabanında kayıtlı ürün (INCI içerik listesi henüz topluluk tarafından eklenmemiş).",
    crueltyFree,
    ingredientsText: ingredientsText.trim(),
    source: "openbeautyfacts",
    sourceLabel: "Open Beauty Facts (Canlı)"
  };
}

async function queryObfEndpoint(terms, page, pageSize) {
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

  const url = `https://world.openbeautyfacts.org/cgi/search.pl?${params.toString()}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Küresel veritabanı yanıt vermedi (HTTP ${response.status}).`);
  }
  return response.json();
}

/**
 * Küresel Open Beauty Facts veritabanında akıllı Türkçe destekli canlı arama yapar.
 */
export async function searchGlobalProducts({
  query = "",
  brand = "",
  categoryTerm = "",
  page = 1,
  pageSize = 60
} = {}) {
  const translatedQuery = translateTurkishQuery(query);
  const combinedTerms = [translatedQuery, brand, categoryTerm]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ");

  const cacheKey = `${combinedTerms.toLowerCase()}|orig=${query.toLowerCase()}|p=${page}|s=${pageSize}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  let data = await queryObfEndpoint(combinedTerms, page, pageSize);
  let totalCount = Number(data.count || 0);
  let rawProducts = Array.isArray(data.products) ? data.products : [];

  // Çok dar çok-kelimeli bir aramada 0 sonuç dönerse ilk anlamlı kelimeyle (genellikle marka) yedek arama yap
  if (totalCount === 0 && page === 1 && combinedTerms.includes(" ")) {
    const fallbackTerm = brand || translatedQuery.split(/\s+/)[0] || categoryTerm;
    if (fallbackTerm && fallbackTerm !== combinedTerms) {
      data = await queryObfEndpoint(fallbackTerm, page, pageSize);
      totalCount = Number(data.count || 0);
      rawProducts = Array.isArray(data.products) ? data.products : [];
    }
  }

  const normalized = rawProducts
    .filter((p) => p.code && (p.product_name || p.product_name_en || p.product_name_tr))
    .map(normalizeApiProduct);

  normalized.sort((a, b) => {
    const aHas = a.ingredientsText.length > 15 ? 1 : 0;
    const bHas = b.ingredientsText.length > 15 ? 1 : 0;
    if (bHas !== aHas) return bHas - aHas;
    return (b.hasRealImage ? 1 : 0) - (a.hasRealImage ? 1 : 0);
  });

  // Sayfa 1'de eşleşen yerel seçki ürünlerini (Flormar, Golden Rose, Pastel, Rare Beauty vb.) başa ekle
  let finalProducts = normalized;
  if (page === 1) {
    const localMatches = findMatchingLocalProducts({ query, brand, categoryTerm });
    if (localMatches.length > 0) {
      finalProducts = [...localMatches, ...normalized];
      totalCount = Math.max(totalCount, finalProducts.length);
    }
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
