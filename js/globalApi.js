/**
 * MakeYUP — Küresel Kozmetik & Cilt Bakımı Canlı Arama Motoru
 * Open Beauty Facts dünya veritabanından (on binlerce makyaj ve cilt bakım ürünü)
 * marka, kategori veya ürün adıyla canlı arama ve sayfalama yapar.
 */

export const GLOBAL_BRANDS = [
  { id: "la-roche-posay", name: "La Roche-Posay", query: "La Roche-Posay", type: "Cilt Bakımı" },
  { id: "cerave", name: "CeraVe", query: "CeraVe", type: "Cilt Bakımı" },
  { id: "the-ordinary", name: "The Ordinary", query: "The Ordinary", type: "Cilt Bakımı" },
  { id: "garnier", name: "Garnier", query: "Garnier", type: "Cilt & Makyaj" },
  { id: "nivea", name: "Nivea", query: "Nivea", type: "Cilt Bakımı" },
  { id: "bioderma", name: "Bioderma", query: "Bioderma", type: "Cilt Bakımı" },
  { id: "loreal", name: "L'Oréal Paris", query: "L'Oréal", type: "Makyaj & Cilt" },
  { id: "maybelline", name: "Maybelline", query: "Maybelline", type: "Makyaj" },
  { id: "essence", name: "Essence", query: "Essence", type: "Makyaj" },
  { id: "nyx", name: "NYX", query: "NYX", type: "Makyaj" },
  { id: "catrice", name: "Catrice", query: "Catrice", type: "Makyaj" },
  { id: "yves-rocher", name: "Yves Rocher", query: "Yves Rocher", type: "Cilt & Makyaj" },
  { id: "neutrogena", name: "Neutrogena", query: "Neutrogena", type: "Cilt Bakımı" },
  { id: "kiko", name: "Kiko Milano", query: "Kiko", type: "Makyaj" },
  { id: "avene", name: "Avène", query: "Avene", type: "Cilt Bakımı" },
  { id: "clinique", name: "Clinique", query: "Clinique", type: "Cilt & Makyaj" }
];

export const GLOBAL_CATEGORIES = [
  { id: "all", label: "Tümü (Makyaj & Cilt)", term: "" },
  { id: "lipstick", label: "💄 Ruj & Dudak", term: "lipstick" },
  { id: "mascara", label: "👁️ Maskara & Göz", term: "mascara" },
  { id: "foundation", label: "✨ Fondöten & Ten", term: "foundation" },
  { id: "serum", label: "🧴 Serum & Bakım", term: "serum" },
  { id: "cream", label: "💧 Nemlendirici Krem", term: "cream" },
  { id: "cleanser", label: "🫧 Yüz Temizleyici", term: "cleanser" },
  { id: "sunscreen", label: "☀️ Güneş Kremi (SPF)", term: "sunscreen" }
];

const searchCache = new Map();

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

/**
 * Küresel Open Beauty Facts veritabanında canlı arama yapar.
 * @param {object} params
 * @param {string} params.query - Arama metni veya marka adı
 * @param {string} params.brand - Seçili marka (opsiyonel)
 * @param {string} params.categoryTerm - Kategori arama terimi (opsiyonel)
 * @param {number} params.page - Sayfa numarası (1'den başlar)
 * @param {number} params.pageSize - Sayfa başı ürün sayısı
 */
export async function searchGlobalProducts({
  query = "",
  brand = "",
  categoryTerm = "",
  page = 1,
  pageSize = 60
} = {}) {
  const combinedTerms = [query, brand, categoryTerm]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ");

  const cacheKey = `${combinedTerms.toLowerCase()}|p=${page}|s=${pageSize}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    action: "process",
    json: "1",
    page: String(page),
    page_size: String(pageSize),
    fields:
      "code,product_name,product_name_tr,product_name_en,brands,image_front_small_url,image_front_url,image_url,ingredients_text,ingredients_text_en,ingredients_text_tr,labels_tags,categories"
  });

  if (combinedTerms) {
    params.set("search_terms", combinedTerms);
    params.set("search_simple", "1");
  } else {
    // Varsayılan açılışta en popüler ve içerik bilgisi dolu ürünleri getir
    params.set("sort_by", "unique_scans_n");
  }

  const url = `https://world.openbeautyfacts.org/cgi/search.pl?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Küresel veritabanı yanıt vermedi (HTTP ${response.status}).`);
  }

  const data = await response.json();
  const totalCount = Number(data.count || 0);
  const rawProducts = Array.isArray(data.products) ? data.products : [];

  // Geçerli adı olan ve tercihen içerik metni bulunan ürünleri öne çıkar
  const normalized = rawProducts
    .filter((p) => p.code && (p.product_name || p.product_name_en || p.product_name_tr))
    .map(normalizeApiProduct);

  // İçerik metni olanları üstte göster ki kullanıcı hemen görsel analiz görebilsin
  normalized.sort((a, b) => {
    const aHas = a.ingredientsText.length > 15 ? 1 : 0;
    const bHas = b.ingredientsText.length > 15 ? 1 : 0;
    if (bHas !== aHas) return bHas - aHas;
    return (b.hasRealImage ? 1 : 0) - (a.hasRealImage ? 1 : 0);
  });

  const result = {
    products: normalized,
    totalCount,
    page,
    pageSize,
    hasMore: page * pageSize < totalCount && rawProducts.length > 0
  };

  searchCache.set(cacheKey, result);
  return result;
}
