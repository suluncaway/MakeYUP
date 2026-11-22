/**
 * MakeYUP — "Daha temiz alternatifler" motoru (UI'dan bağımsız, saf fonksiyon).
 *
 * Kullanım:
 *   import { analyzeIngredients } from "../analyzer.js";
 *   import { PRODUCTS_DATA } from "../data/products.js";
 *   import { findAlternatives } from "./features/alternatives.js";
 *   const alts = findAlternatives(product, PRODUCTS_DATA, { limit: 3, analyze: analyzeIngredients });
 *   // → [{ product, analysis, score, delta, sameType, reasons: ["Daha yüksek skor (+18)", "Parabensiz", ...] }]
 *
 * beauty_catalog.json kayıtları ({id,b,n,c,i}) da doğrudan verilebilir; normalizeProduct ile
 * otomatik olarak { id, brand, name, category, categoryLabel, ingredients } biçimine çevrilir.
 */

// Alt tür anahtarları — sıra önemli (ilk eşleşen kazanır).
const SUBTYPE_RULES = [
  [/serum/, "serum"],
  [/güneş|gunes|spf|sun/, "gunes"],
  [/tonik|toner|essence/, "tonik"],
  [/temizle|cleanser|cleansing/, "temizleyici"],
  [/nemlendir|moistur|cream|krem bakım/, "nemlendirici"],
  [/maske|\bmask\b/, "maske"],
  [/fondöten|fondoten|foundation/, "fondoten"],
  [/kapatıcı|kapatici|concealer/, "kapatici"],
  [/allık|allik|blush/, "allik"],
  [/bronzer/, "bronzer"],
  [/aydınlatıcı|aydinlatici|highlighter/, "aydinlatici"],
  [/pudra|powder/, "pudra"],
  [/sabitleyici|setting spray|sprey/, "sabitleyici"],
  [/makyaj bazı|makyaj bazi|primer/, "baz"],
  [/maskara|mascara/, "maskara"],
  [/eyeliner|liner/, "eyeliner"],
  [/kaş|kas jeli|brow/, "kas"],
  [/far|eyeshadow|palet/, "far"],
  [/dudak kalemi|lip ?liner|kalem/, "dudak-kalemi"],
  [/ruj|lipstick|lip ink/, "ruj"],
  [/parlatıcı|parlatici|gloss|dudak yağı|dudak yagi|lip oil/, "dudak-parlak"],
  [/lip|dudak/, "dudak-bakim"]
];

const VEGAN_RANK = { vegan: 2, check: 1, "non-vegan": 0 };

/** Ürünü (PRODUCTS_DATA veya beauty_catalog kaydı) ortak biçime getirir. */
export function normalizeProduct(p) {
  if (!p || typeof p !== "object") return null;
  if (p.ingredients || p.name) return p;
  // beauty_catalog.json kısa alanları
  return {
    id: p.id,
    brand: p.b || "",
    name: p.n || "",
    category: "katalog",
    categoryLabel: p.c || "",
    image: p.img || "",
    ingredients: p.i || "",
    _catalog: true
  };
}

/** "Yüz · Mat Fondöten" → { group: "yüz", subtype: "fondoten" } */
export function productType(p) {
  const label = String(p.categoryLabel || "").toLocaleLowerCase("tr");
  const [head, ...rest] = label.split("·");
  const tail = rest.length ? rest.join(" ") : head;
  const group = rest.length ? head.trim() : String(p.category || "").toLowerCase();
  let subtype = null;
  for (const [re, key] of SUBTYPE_RULES) {
    if (re.test(tail)) { subtype = key; break; }
  }
  return { group: group || String(p.category || ""), subtype: subtype || tail.trim() || null };
}

function facts(analysis) {
  const items = analysis.items || [];
  const known = items.filter((i) => i.known);
  const groups = (analysis.safety && analysis.safety.groups) || [];
  return {
    score: Number(analysis.healthScore) || 0,
    vegan: VEGAN_RANK[analysis.veganStatus] ?? 1,
    paraben: known.some((i) => (i.tags || []).includes("Paraben")),
    fragrance: known.some((i) => i.inci === "Parfum" || (i.tags || []).includes("Koku Alerjeni")),
    pregnancySafe: !!(analysis.safety && analysis.safety.pregnancySafe),
    banned: groups.some((g) => g.key === "banned"),
    high: (analysis.counts && analysis.counts.high) || 0
  };
}

/**
 * @param {object} product           Referans ürün
 * @param {object[]} allProducts     Aday ürün listesi
 * @param {{limit?:number, analyze:(ingredients)=>object, cache?:Map, fillFromGroup?:boolean}} opts
 *   fillFromGroup: aynı alt türde yeterli aday yoksa aynı ana gruptan (ör. Göz) tamamla (varsayılan kapalı)
 * @returns {{product, analysis, score:number, delta:number, sameType:boolean, reasons:string[]}[]}
 */
export function findAlternatives(product, allProducts, { limit = 3, analyze, cache, fillFromGroup = false } = {}) {
  if (typeof analyze !== "function") throw new TypeError("findAlternatives: 'analyze' fonksiyonu gerekli (analyzeIngredients).");
  const base = normalizeProduct(product);
  if (!base || !Array.isArray(allProducts) || limit <= 0) return [];

  const memo = cache instanceof Map ? cache : new Map();
  const run = (p) => {
    const key = p.id != null ? String(p.id) : null;
    if (key && memo.has(key)) return memo.get(key);
    let res = null;
    try { res = analyze(p.ingredients || []); } catch { res = null; }
    if (key) memo.set(key, res);
    return res;
  };

  const baseA = run(base);
  if (!baseA) return [];
  const bf = facts(baseA);
  const bt = productType(base);

  const out = [];
  for (const raw of allProducts) {
    const cand = normalizeProduct(raw);
    if (!cand || cand.id === base.id) continue;
    if (cand.brand === base.brand && cand.name === base.name) continue;
    const ct = productType(cand);
    if (ct.group !== bt.group) continue; // Yüz ↔ Cilt Bakımı ↔ Dudak karışmaz
    const sameType = !!bt.subtype && ct.subtype === bt.subtype;

    const a = run(cand);
    if (!a || a.healthStatus === "unknown") continue;
    const cf = facts(a);

    // "Daha temiz" olmalı: skor düşmemeli, veganlık ve hamilelik güvenliği kötüleşmemeli
    if (cf.score < bf.score) continue;
    if (cf.vegan < bf.vegan) continue;
    if (bf.pregnancySafe && !cf.pregnancySafe) continue;
    if (cf.banned && !bf.banned) continue;

    const reasons = [];
    const delta = cf.score - bf.score;
    if (delta > 0) reasons.push(`Daha yüksek skor (+${delta})`);
    if (bf.vegan < 2 && cf.vegan === 2) reasons.push("%100 Vegan");
    else if (bf.vegan === 0 && cf.vegan === 1) reasons.push("Hayvansal içerik tespit edilmedi");
    if (bf.paraben && !cf.paraben) reasons.push("Parabensiz");
    if (bf.fragrance && !cf.fragrance) reasons.push("Parfümsüz");
    if (!bf.pregnancySafe && cf.pregnancySafe) reasons.push("Hamilelik uyarısı yok");
    if (bf.banned && !cf.banned) reasons.push("AB'de yasaklı madde içermez");
    if (cf.high < bf.high) reasons.push(`Daha az riskli bileşen (${bf.high} → ${cf.high})`);
    if (base.crueltyFree === false && cand.crueltyFree === true) reasons.push("Cruelty-free");
    if (!reasons.length) continue; // hiçbir iyileşme yoksa alternatif değildir

    let rank = delta;
    if (sameType) rank += 25;
    if (bf.vegan < 2 && cf.vegan === 2) rank += 15;
    if (!bf.pregnancySafe && cf.pregnancySafe) rank += 10;
    if (bf.paraben && !cf.paraben) rank += 5;
    if (bf.fragrance && !cf.fragrance) rank += 3;
    if (cand.crueltyFree === true) rank += 2;

    if (!sameType && bt.subtype) reasons.push(`Benzer kategori: ${String(cand.categoryLabel || "").split("·").pop().trim()}`);
    out.push({ product: raw, analysis: a, score: cf.score, delta, sameType, reasons, _rank: rank });
  }

  out.sort((x, y) => y._rank - x._rank || y.score - x.score || String(x.product.name || x.product.n).localeCompare(String(y.product.name || y.product.n), "tr"));

  // Önce aynı alt tür; fillFromGroup açıksa (veya alt tür bilinmiyorsa) aynı ana gruptan tamamla.
  const same = out.filter((r) => r.sameType);
  const other = fillFromGroup || !bt.subtype ? out.filter((r) => !r.sameType) : [];
  return same.concat(other).slice(0, limit).map(({ _rank, ...r }) => r);
}
