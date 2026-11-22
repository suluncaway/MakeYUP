/**
 * MakeYUP — data layer. Lazily computed, cached, UI-free.
 *
 * Unified product shape (local products AND archive items):
 *   { id, brand, brandId, name, image|null, category, categoryLabel, ingredients,
 *     gtin, gtins, priceTier, source: "local" | "arsiv" | "online", analysis? }
 * Local products keep all their original fields (description, skinTypes, pao, shades…).
 * Use getAnalysis(product) to get the analyzer result (memoized) for any product.
 */
import { analyzeIngredients } from "./analyzer.js";
import { compileQuery, fold } from "./search.js";
import { PRODUCTS_DATA } from "./data/products.js";
import { BRANDS_DATA } from "./data/brands.js";
import { INGREDIENTS_DB } from "./data/ingredients.js";

/** Absolute URL of the repository root (where assets/ and js/ live). */
export const ROOT = new URL("../", import.meta.url).href;
/** Turns a repo-relative path ("assets/images/x.jpg") into an absolute URL (works from any page depth). */
export const asset = (path) => (!path ? "" : /^(https?:|data:|blob:)/.test(path) ? path : ROOT + String(path).replace(/^\.?\//, ""));

const ARCHIVE_IMG_BASE = "https://huggingface.co/datasets/thebeautyapi/beautyproducts/resolve/main/images/";

export const CATEGORY_LABELS = { yuz: "Yüz", goz: "Göz", dudak: "Dudak" };

export function slugify(s) {
  return fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* ---------------- analysis ---------------- */

const analysisMemo = new Map();

/** Analyzer result for any product / archive item / INCI string. Memoized by product id. */
export function getAnalysis(item) {
  if (!item) return null;
  if (typeof item === "string" || Array.isArray(item)) return analyzeIngredients(item);
  if (item.analysis) return item.analysis;
  const key = item.id != null ? `${item.source || "x"}:${item.id}` : null;
  if (key && analysisMemo.has(key)) return analysisMemo.get(key);
  let res = null;
  try { res = analyzeIngredients(item.ingredients || ""); } catch (err) { console.error(err); }
  if (key) analysisMemo.set(key, res);
  return res;
}

/* ---------------- local products ---------------- */

let products = null;
let productIndex = null;

/** The 63 curated products, each with .analysis computed. */
export function getProducts() {
  if (!products) {
    products = PRODUCTS_DATA.map((p) => {
      const item = {
        ...p,
        image: asset(p.image),
        categoryLabel: p.categoryLabel || CATEGORY_LABELS[p.category] || "",
        gtin: p.gtin || p.barcode || "",
        source: "local"
      };
      item.analysis = getAnalysis(item);
      return item;
    });
    productIndex = new Map(products.map((p) => [String(p.id), p]));
  }
  return products;
}

/** Local product by id (sync). For archive ids ("hf-…") use findProduct(). */
export function getProduct(id) {
  getProducts();
  return productIndex.get(String(id)) || null;
}

/** Any product by id: local first, then the 1,000-item archive (async). */
export async function findProduct(id) {
  const local = getProduct(id);
  if (local) return local;
  if (onlineIndex.has(String(id))) return onlineIndex.get(String(id));
  await getCatalog();
  return catalogIndex.get(String(id)) || null;
}

/* ---------------- brands ---------------- */

let brands = null;

/** Brands with { productCount, avgScore, veganCount, products } added. */
export function getBrands() {
  if (!brands) {
    const all = getProducts();
    brands = BRANDS_DATA.map((b) => {
      const list = all.filter((p) => p.brandId === b.id);
      const scores = list.map((p) => p.analysis?.healthScore).filter((n) => typeof n === "number");
      return {
        ...b,
        products: list,
        productCount: list.length,
        veganCount: list.filter((p) => p.analysis?.veganStatus === "vegan").length,
        avgScore: scores.length ? Math.round(scores.reduce((a, n) => a + n, 0) / scores.length) : null
      };
    });
  }
  return brands;
}

export function getBrand(id) {
  return getBrands().find((b) => b.id === id) || null;
}

/* ---------------- archive (beauty_catalog.json) ---------------- */

const onlineIndex = new Map(); // products seen via searchOnline() in this session
let catalogPromise = null;
let catalogIndex = new Map();

function preferredGtin(list) {
  const valid = (list || []).map((g) => String(g).replace(/\D/g, "")).filter((g) => [8, 12, 13, 14].includes(g.length));
  return valid.find((g) => g.startsWith("869")) || valid[0] || "";
}

function normalizeCatalogRow(row) {
  return {
    id: row.id,
    brand: row.b || "",
    brandId: slugify(row.b || ""),
    name: row.s ? `${row.n} (${row.s})` : row.n || "",
    image: row.img ? ARCHIVE_IMG_BASE + encodeURIComponent(row.img) : null,
    gtin: preferredGtin(row.g),
    gtins: Array.isArray(row.g) ? row.g : [],
    category: row.c || "",
    categoryLabel: row.c || "Kozmetik",
    ingredients: row.i || "",
    source: "arsiv"
  };
}

/** Loads the 1,000-item archive once. Never rejects (returns [] on failure). */
export function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch(ROOT + "js/data/beauty_catalog.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        const list = (Array.isArray(rows) ? rows : []).map(normalizeCatalogRow);
        catalogIndex = new Map(list.map((p) => [String(p.id), p]));
        return list;
      })
      .catch((err) => {
        console.warn("Arşiv yüklenemedi", err);
        catalogPromise = null; // allow retry later
        return [];
      });
  }
  return catalogPromise;
}

/* ---------------- search ---------------- */

// Turkish ↔ English category words. Each group is treated as one term.
const CATEGORY_SYNONYMS = [
  ["fondoten", "foundation", "fondöten"],
  ["ruj", "lipstick", "lip stick"],
  ["maskara", "mascara", "rimel"],
  ["allik", "blush", "allık"],
  ["far", "eyeshadow", "eye shadow", "goz fari"],
  ["kapatici", "concealer", "kapatıcı"],
  ["pudra", "powder"],
  ["dudak", "lip"],
  ["eyeliner", "goz kalemi", "dipliner"],
  ["nemlendirici", "moisturizer", "moisturiser"],
  ["temizleyici", "cleanser"],
  ["serum"],
  ["tonik", "toner"],
  ["gunes kremi", "sunscreen", "suncare", "spf"],
  ["maske", "mask"],
  ["sampuan", "shampoo"],
  ["parfum", "fragrance", "perfume", "parfüm"],
  ["aydinlatici", "highlighter"],
  ["bronzer", "bronzlastirici"],
  ["kas", "brow", "eyebrow"]
];

let synonymMap = null;

function addGroup(map, names) {
  const group = [...new Set(names.map(fold).filter((n) => n.length >= 3 || n === "far" || n === "ruj"))];
  if (group.length < 2) return;
  for (const n of group) {
    const prev = map.get(n);
    map.set(n, prev ? [...new Set([...prev, ...group])] : group);
  }
}

function getSynonyms() {
  if (!synonymMap) {
    synonymMap = new Map();
    for (const g of CATEGORY_SYNONYMS) addGroup(synonymMap, g);
    for (const ing of INGREDIENTS_DB) {
      const tr = String(ing.nameTr || "");
      const trCore = tr.replace(/\(.*?\)/g, " ");
      const inParens = (tr.match(/\(([^)]*)\)/) || [])[1] || "";
      addGroup(synonymMap, [ing.inci, ...(ing.aliases || []), trCore, inParens]);
    }
  }
  return synonymMap;
}

/**
 * Compiles a query into a matcher that understands Turkish↔English synonyms for
 * ingredients ("karmin" = "carmine" = "ci 75470") and categories ("fondöten" = "foundation").
 * "-kelime" excludes. Returns (text) => boolean.
 */
export function compileSmartQuery(query) {
  const q = fold(query);
  if (!q) return () => true;
  const syn = getSynonyms();
  const whole = syn.get(q);
  if (whole) {
    const preds = whole.map((alt) => compileQuery(alt));
    return (text) => preds.some((p) => p(text));
  }
  const parts = q.split(" ").filter(Boolean).map((tok) => {
    const neg = tok.startsWith("-") && tok.length > 1;
    const word = neg ? tok.slice(1) : tok;
    const alts = syn.get(word) || [word];
    const preds = alts.map((alt) => compileQuery(alt));
    return { neg, test: (text) => preds.some((p) => p(text)) };
  });
  return (text) => parts.every((p) => (p.neg ? !p.test(text) : p.test(text)));
}

const hayCache = new WeakMap();
/** Searchable text: brand, name, category and INCI names only (never free-text descriptions). */
function haystack(p) {
  let h = hayCache.get(p);
  if (!h) {
    const ings = Array.isArray(p.ingredients) ? p.ingredients.join(", ") : p.ingredients || "";
    const shades = Array.isArray(p.shades) ? p.shades.map((s) => (typeof s === "string" ? s : s?.name || "")).join(" ") : "";
    h = [p.brand, p.name, p.categoryLabel, CATEGORY_LABELS[p.category] || p.category, shades, ings].join(" | ");
    hayCache.set(p, h);
  }
  return h;
}

const PARABEN_RE = /paraben/i;
const FRAGRANCE_RE = /\b(parfum|fragrance|aroma|perfume)\b/i;

function ingredientText(p) {
  return Array.isArray(p.ingredients) ? p.ingredients.join(", ") : String(p.ingredients || "");
}

function categoryMatches(p, cat) {
  if (!cat) return true;
  if (p.category === cat) return true;
  const c = fold(cat);
  const alts = getSynonyms().get(c) || [c];
  const text = fold(`${p.category} ${p.categoryLabel} ${p.name}`);
  return alts.some((a) => text.includes(a));
}

/**
 * Returns a predicate for a filters object:
 *   { category, vegan, minScore, pregnancySafe, parabenFree, fragranceFree, brandId }
 */
export function makeFilter(filters = {}) {
  const f = filters || {};
  return (p) => {
    if (f.brandId && p.brandId !== f.brandId) return false;
    if (f.category && !categoryMatches(p, f.category)) return false;
    if (f.parabenFree && PARABEN_RE.test(ingredientText(p))) return false;
    if (f.fragranceFree && FRAGRANCE_RE.test(ingredientText(p))) return false;
    if (f.vegan || f.minScore || f.pregnancySafe) {
      const a = getAnalysis(p);
      if (!a) return false;
      if (f.vegan && a.veganStatus !== "vegan") return false;
      if (f.minScore && !(a.healthScore >= Number(f.minScore))) return false;
      if (f.pregnancySafe && !a.safety?.pregnancySafe) return false;
    }
    return true;
  };
}

/**
 * Searches local products (first) and the archive.
 *   const { items, local, archive } = await searchAll("ruj", { vegan:true }, { limit: 60 });
 * Options: { limit=Infinity, sources=["local","arsiv"], includeEmpty=true }
 * Archive items with no ingredient list are sorted last. Never rejects.
 */
export async function searchAll(query = "", filters = {}, { limit = Infinity, sources = ["local", "arsiv"] } = {}) {
  const test = compileSmartQuery(query);
  const pass = makeFilter(filters);
  const local = sources.includes("local") ? getProducts().filter((p) => test(haystack(p)) && pass(p)) : [];
  let archive = [];
  if (sources.includes("arsiv")) {
    const cat = await getCatalog();
    archive = cat.filter((p) => test(haystack(p)) && pass(p));
    archive.sort((a, b) => (b.ingredients ? 1 : 0) - (a.ingredients ? 1 : 0));
  }
  const items = [...local, ...archive].slice(0, limit);
  return { items, local, archive, total: local.length + archive.length };
}

/** Synchronous search over the 63 local products only. */
export function searchLocal(query = "", filters = {}) {
  const test = compileSmartQuery(query);
  const pass = makeFilter(filters);
  return getProducts().filter((p) => test(haystack(p)) && pass(p));
}

/**
 * OPTIONAL online enrichment (Open Beauty Facts via js/globalApi.js). Append its results
 * AFTER local results; it never throws: { items:[], error:true } on failure / timeout.
 */
export async function searchOnline(query, { timeoutMs = 6000 } = {}) {
  if (!String(query || "").trim()) return { items: [], error: false };
  try {
    const mod = await import("./globalApi.js");
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs));
    const res = await Promise.race([mod.searchGlobalProducts({ query, page: 1, pageSize: 40 }), timeout]);
    const rows = Array.isArray(res) ? res : res?.products || res?.items || [];
    getProducts();
    const items = rows
      .filter((r) => r && r.source === "openbeautyfacts" && !String(r.id).startsWith("hf-") && !productIndex.has(String(r.id)))
      .map((r) => ({
        id: r.id,
        brand: r.brand || "",
        brandId: slugify(r.brand || ""),
        name: r.name || "",
        image: r.hasRealImage ? r.image : null,
        gtin: r.barcode || "",
        gtins: r.barcode ? [r.barcode] : [],
        category: r.categoryLabel || "",
        categoryLabel: r.categoryLabel || "",
        ingredients: r.ingredientsText || "",
        source: "online"
      }));
    for (const it of items) onlineIndex.set(String(it.id), it);
    // Çevrimiçi veritabanına ulaşılamadıysa (globalApi yerel sonuçlarla döner) bunu hata olarak bildir
    const unreachable = !Array.isArray(res) && res && res.offline === true;
    return { items, error: unreachable && items.length === 0, warning: unreachable ? res.warning || "" : "" };
  } catch (err) {
    return { items: [], error: true };
  }
}
