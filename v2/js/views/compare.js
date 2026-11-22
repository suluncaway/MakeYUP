/**
 * MakeYUP v2 — #/karsilastir?ids=a,b
 * Two products side by side (two columns even on the phone), compared row by row.
 * Also exports the small compare-tray helpers used by the product page.
 */
import { setTitle, updateQuery } from "../router.js";
import { findProduct, getProduct, getAnalysis, getProducts } from "../state.js";
import {
  escapeHtml as e, enc, productHref, productImage, scoreRing, scoreVerdict, icon, emptyState, primaryBuyLink, priceTier
} from "../ui/components.js";
import { LINK_REL } from "../../../js/affiliate.js";
import { findAlternatives } from "../../../js/features/alternatives.js";
import { analyzeIngredients } from "../../../js/analyzer.js";

/* ---------------- compare tray (localStorage, max 2) ---------------- */

export const COMPARE_MAX = 2;
const KEY = "makeyup:compare:v1";
let memory = [];

function clean(ids) {
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    const s = String(id || "").trim();
    if (s && !out.includes(s)) out.push(s);
  }
  return out.slice(0, COMPARE_MAX);
}

/** Ids currently in the compare tray (oldest first). */
export function getCompareIds() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return clean(JSON.parse(raw));
    return [];
  } catch {
    return clean(memory);
  }
}

function save(ids) {
  const list = clean(ids);
  memory = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage blocked: memory only */ }
  return list;
}

/**
 * Adds a product to the compare tray.
 * Returns { status: "added" | "exists" | "full", ids }.
 * "full" changes nothing: ask the user which id to replace, then call replaceInCompare().
 */
export function addToCompare(id) {
  const ids = getCompareIds();
  const s = String(id);
  if (ids.includes(s)) return { status: "exists", ids };
  if (ids.length >= COMPARE_MAX) return { status: "full", ids };
  return { status: "added", ids: save([...ids, s]) };
}

/** Replaces oldId with newId (keeps the column position). */
export function replaceInCompare(oldId, newId) {
  const ids = getCompareIds().map((x) => (x === String(oldId) ? String(newId) : x));
  return save(ids);
}

export function removeFromCompare(id) {
  return save(getCompareIds().filter((x) => x !== String(id)));
}

/** "#/karsilastir?ids=a,b" */
export function compareHref(ids = getCompareIds()) {
  const list = clean(ids);
  return list.length ? `#/karsilastir?ids=${list.map(enc).join(",")}` : "#/karsilastir";
}

/* ---------------- facts used for each row ---------------- */

function factsOf(p) {
  const a = getAnalysis(p);
  const known = !!a && a.healthStatus !== "unknown";
  const groups = a?.safety?.groups || [];
  const preg = groups.filter((g) => g.key === "pregAvoid" || g.key === "pregCaution");
  const fragItems = (a?.items || []).filter((i) => i.known && (i.inci === "Parfum" || (i.tags || []).includes("Koku Alerjeni")));
  const allergen = groups.find((g) => g.key === "allergen");
  const fragNames = [...new Set([...fragItems.map((i) => i.rawName || i.inci), ...(allergen?.names || [])])];
  return {
    a, known,
    score: known ? a.healthScore : null,
    vegan: a?.veganStatus || "check",
    veganNames: (a?.nonVeganIngredients || []).map((i) => i.nameTr || i.inci),
    pregnancy: !known ? "unknown" : preg.some((g) => g.key === "pregAvoid") ? "no" : preg.length ? "warn" : "yes",
    pregNames: [...new Set(preg.flatMap((g) => g.names))],
    fragrance: !known ? "unknown" : fragNames.length ? "warn" : "yes",
    fragNames,
    high: (a?.highRiskIngredients || []).map((i) => i.nameTr || i.inci),
    warnings: groups.length,
    total: a?.counts?.total || 0
  };
}

const VEGAN_RANK = { vegan: 2, check: 1, "non-vegan": 0 };
const YES_RANK = { yes: 2, warn: 1, no: 0, unknown: -1 };

/** Index (0/1) of the better value, or -1 when equal / not comparable. */
function better(x, y, higherIsBetter = true) {
  if (x == null || y == null || x === y) return -1;
  return (x > y) === higherIsBetter ? 0 : 1;
}

function answer(tone, text, sub = "") {
  const ic = { safe: "check", high: "x", mod: "alert", unknown: "info" }[tone] || "info";
  return `<span class="compare-ans t-${tone}">${icon(ic, { size: 14 })}${e(text)}</span>${sub ? `<span class="compare-sub">${e(sub)}</span>` : ""}`;
}

function short(names, n = 3) {
  if (!names.length) return "";
  return names.slice(0, n).join(", ") + (names.length > n ? ` +${names.length - n}` : "");
}

function buyCell(p) {
  const link = primaryBuyLink(p);
  if (!link) return `<span class="muted compare-sub">Mağaza bağlantısı yok</span>`;
  return `<a class="btn btn-primary compare-buy" href="${e(link.url)}" target="_blank" rel="${e(LINK_REL)}" data-store="${e(link.store)}" data-product="${e(p.id)}" aria-label="${e(`${p.brand} ${p.name}`)} — ${e(link.name)} üzerinden satın al">${icon("bag", { size: 16 })}Satın al</a><span class="compare-sub">${e(link.name)}</span>`;
}

function row(label, cells, win = -1) {
  return `<div class="compare-row" role="row">
    <div class="compare-label" role="rowheader">${e(label)}</div>
    ${cells.map((c, i) => `<div class="compare-cell${win === i ? " is-win" : ""}" role="cell">${c}${win === i ? `<span class="visually-hidden"> (daha iyi)</span>` : ""}</div>`).join("")}
  </div>`;
}

function headCell(p) {
  return `<div class="compare-head" role="columnheader">
    <a class="compare-plink" href="${productHref(p)}">
      ${productImage(p, { cls: "compare-ph", eager: true })}
      ${p.brand ? `<span class="brand-name">${e(p.brand)}</span>` : ""}
      <span class="compare-pname">${e(p.name)}</span>
    </a>
    <button type="button" class="compare-remove" data-remove="${e(p.id)}" aria-label="${e(p.name)} — karşılaştırmadan çıkar">${icon("x", { size: 16 })}Çıkar</button>
  </div>`;
}

function addCell(first) {
  let sugg = [];
  try {
    sugg = findAlternatives(first, getProducts(), { limit: 3, analyze: analyzeIngredients, fillFromGroup: true });
  } catch { sugg = []; }
  return `<div class="compare-head compare-add" role="columnheader">
    <div class="compare-add-ic" aria-hidden="true">${icon("compare", { size: 22 })}</div>
    <p class="compare-add-t">İkinci ürünü seç</p>
    <a class="btn btn-ghost btn-sm" href="#/">${icon("search", { size: 15 })}Ürün ara</a>
    ${
      sugg.length
        ? `<p class="compare-sub">Ya da şunlardan biri:</p><ul class="compare-sugg" role="list">${sugg
            .map((s) => `<li><button type="button" class="compare-sugg-btn" data-add="${e(s.product.id)}">${e(s.product.brand)} ${e(s.product.name)}</button></li>`)
            .join("")}</ul>`
        : ""
    }
  </div>`;
}

function table(products) {
  const [p1, p2] = products;
  const f = products.map(factsOf);
  const two = f.length === 2;
  const W = (fn) => (two ? fn(f[0], f[1]) : -1);
  const filler = two ? [] : [""];
  const cells = (fn) => [...f.map(fn), ...filler];

  const rows = [
    row("Sağlık puanı", cells((x) => `<div class="compare-score">${scoreRing(x.score, x.a?.healthStatus, { size: "sm" })}<span>${e(scoreVerdict(x.score, x.a?.healthStatus))}</span></div>`), W((x, y) => better(x.score, y.score))),
    row("Vegan mı?", cells((x) =>
      x.vegan === "vegan" ? answer("safe", "Evet")
        : x.vegan === "non-vegan" ? answer("high", "Hayır", short(x.veganNames))
        : answer("mod", "Emin değiliz", x.known ? "Kaynağı belirsiz içerik var" : "İçerik bilgisi yok")
    ), W((x, y) => better(VEGAN_RANK[x.vegan], VEGAN_RANK[y.vegan]))),
    row("Hamilelikte uygun mu?", cells((x) =>
      x.pregnancy === "yes" ? answer("safe", "Uyarı yok")
        : x.pregnancy === "no" ? answer("high", "Önerilmez", short(x.pregNames))
        : x.pregnancy === "warn" ? answer("mod", "Doktora danış", short(x.pregNames))
        : answer("unknown", "Bilinmiyor")
    ), W((x, y) => better(YES_RANK[x.pregnancy], YES_RANK[y.pregnancy]))),
    row("Parfüm / alerjen", cells((x) =>
      x.fragrance === "yes" ? answer("safe", "Yok")
        : x.fragrance === "warn" ? answer("mod", "Var", short(x.fragNames))
        : answer("unknown", "Bilinmiyor")
    ), W((x, y) => better(YES_RANK[x.fragrance], YES_RANK[y.fragrance]))),
    row("Yüksek riskli içerik", cells((x) =>
      !x.known ? answer("unknown", "Bilinmiyor")
        : x.high.length ? answer("high", `${x.high.length} madde`, short(x.high)) : answer("safe", "Yok")
    ), W((x, y) => (x.known && y.known ? better(x.high.length, y.high.length, false) : -1))),
    row("Uyarı sayısı", cells((x) => `<span class="compare-num">${x.known ? x.warnings : "–"}</span>`), W((x, y) => (x.known && y.known ? better(x.warnings, y.warnings, false) : -1))),
    row("İçerik sayısı", cells((x) => `<span class="compare-num">${x.total || "–"}</span>`)),
    row("Fiyat", cells((_, i) => priceTier(products[i].priceTier) || `<span class="muted">–</span>`)),
    row("Satın al", cells((_, i) => buyCell(products[i])))
  ];

  return `<div class="compare-table" role="table" aria-label="Ürün karşılaştırması">
    <div class="compare-row compare-row-head" role="row">
      <div class="compare-label" role="rowheader"><span class="visually-hidden">Ürün</span></div>
      ${headCell(p1)}${p2 ? headCell(p2) : addCell(p1)}
    </div>
    ${rows.join("")}
  </div>`;
}

async function render({ query, el, signal }) {
  const fromUrl = clean(String(query.ids || "").split(","));
  let ids = fromUrl.length ? save(fromUrl) : getCompareIds();
  if (!fromUrl.length && ids.length) updateQuery({ ids: ids.join(",") });
  setTitle("Karşılaştır");

  const head = `<header class="page-head compare-top"><p class="eyebrow">Karşılaştır</p><h1>Hangisi daha iyi?</h1></header>`;

  if (!ids.length) {
    el.innerHTML = `<section class="compare-page">${head}${emptyState({
      icon: "compare",
      title: "Karşılaştırılacak ürün yok",
      text: "Bir ürün sayfasında “Karşılaştırmaya ekle”ye dokun, sonra ikinci ürünü de ekle. İki ürün burada yan yana görünür.",
      action: { href: "#/", label: "Ürün ara" }
    })}</section>`;
    return;
  }

  if (ids.some((id) => !getProduct(id))) {
    el.innerHTML = `<section class="compare-page">${head}<div class="compare-loading" aria-busy="true"><span class="visually-hidden">Yükleniyor…</span><span class="sk"></span><span class="sk"></span></div></section>`;
  }
  const found = (await Promise.all(ids.map((id) => findProduct(id).catch(() => null)))).filter(Boolean);
  if (signal.aborted) return;
  if (found.length !== ids.length) {
    ids = save(found.map((p) => String(p.id)));
    updateQuery({ ids: ids.join(",") });
  }
  if (!found.length) {
    el.innerHTML = `<section class="compare-page">${head}${emptyState({
      icon: "search", title: "Ürünler bulunamadı", text: "Bu karşılaştırma bağlantısındaki ürünleri bulamadık.", action: { href: "#/", label: "Ürün ara" }
    })}</section>`;
    return;
  }
  setTitle(found.map((p) => p.name).join(" – "));
  el.innerHTML = `<section class="compare-page">${head}
    <p class="compare-hint">${icon(found.length === 1 ? "info" : "check", { size: 16 })}${found.length === 1 ? "İkinci bir ürün ekle; satırlar yan yana karşılaştırılır." : "Daha iyi olan değer yeşil ile vurgulanır."}</p>
    ${table(found)}
    <p class="compare-disc">Reklam / İş birliği · “Satın al” bağlantıları ortaklık bağlantısı olabilir; puanlar bundan etkilenmez.</p>
  </section>`;
}

export default {
  routes: {
    "#/karsilastir": async ({ query, el, signal }) => {
      const onClick = (ev) => {
        const rm = ev.target.closest("[data-remove]");
        const add = ev.target.closest("[data-add]");
        if (!rm && !add) return;
        const next = rm ? removeFromCompare(rm.dataset.remove) : save([...getCompareIds(), add.dataset.add]);
        updateQuery({ ids: next.join(",") });
        render({ query: { ids: next.join(",") }, el, signal });
      };
      el.addEventListener("click", onClick, { signal });
      await render({ query, el, signal });
      return () => el.removeEventListener("click", onClick);
    }
  }
};
