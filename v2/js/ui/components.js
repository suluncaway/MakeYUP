/**
 * MakeYUP v2 — shared UI components.
 * Every component is a pure function that returns an HTML STRING. All dynamic text is escaped.
 * Interactivity is handled by delegated listeners in main.js (affiliate tracking, chips,
 * image fallback) — components only emit the right attributes.
 */
import { flagTags } from "../../../js/flags.js";
import { buyLinks, affiliateDisclosure, LINK_REL } from "../../../js/affiliate.js";
import { getCosingMeta } from "../../../js/analyzer.js";
import { getAnalysis } from "../state.js";

/* ---------------- basics ---------------- */

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" };
/** Escapes text for HTML content AND attribute values. null/undefined → "". */
export function escapeHtml(value) {
  return value == null ? "" : String(value).replace(/[&<>"'`]/g, (c) => ESC[c]);
}
const e = escapeHtml;

/** Encodes an id for use in a hash URL segment. */
export const enc = (id) => encodeURIComponent(String(id ?? ""));

/** Product page URL. */
export const productHref = (p) => `#/urun/${enc(p.id)}`;

/** Turkish number formatting. */
export const fmt = (n) => (typeof n === "number" ? n.toLocaleString("tr-TR") : "");

/** Two-letter monogram used when a product has no photo. */
export function initials(text) {
  const w = String(text || "").trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toLocaleUpperCase("tr-TR") || "M";
}

const PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M8 9v6M12 9v6M16 9v6"/>',
  leaf: '<path d="M5 21c0-9 5-15 15-16-1 10-7 15-15 16z" fill="currentColor" stroke="none"/>',
  alert: '<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  tag: '<path d="M20 12 12 20l-8-8V4h8z"/><circle cx="8.5" cy="8.5" r="1.2"/>',
  flask: '<path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/>',
  book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v15H6.5a2.5 2.5 0 0 0 0 5H20"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  bag: '<path d="M6 7h12l1 13H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  compare: '<path d="M8 3v18M16 3v18M3 8h5M16 16h5"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'
};

/** Inline SVG icon by name (see PATHS). Unknown names render nothing. */
export function icon(name, { size = 18, label = "" } = {}) {
  const p = PATHS[name];
  if (!p) return "";
  const a11y = label ? `role="img" aria-label="${e(label)}"` : 'aria-hidden="true"';
  return `<svg class="ic ic-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${p}</svg>`;
}

/* ---------------- status helpers ---------------- */

/** Maps analyzer healthStatus → CSS tone: "safe" | "mod" | "high" | "unknown". */
export function statusTone(status) {
  return { healthy: "safe", moderate: "mod", risky: "high" }[status] || "unknown";
}

/** Maps ingredient risk → { tone, label }. */
export function riskInfo(risk) {
  return (
    {
      safe: { tone: "safe", label: "Güvenli" },
      moderate: { tone: "mod", label: "Orta risk" },
      high: { tone: "high", label: "Yüksek risk" }
    }[risk] || { tone: "unknown", label: "Bilinmiyor" }
  );
}

/** Short verdict for a 0–100 score. */
export function scoreVerdict(score, status) {
  if (status === "unknown" || typeof score !== "number") return "Yetersiz veri";
  if (score >= 85) return "Çok iyi";
  if (score >= 70) return "İyi";
  if (score >= 50) return "Orta";
  return "Dikkat";
}

/* ---------------- score ring ---------------- */

/**
 * Circular 0–100 score. scoreRing(86, "healthy", { size: "sm" | "lg" })
 */
export function scoreRing(score, status, { size = "sm" } = {}) {
  const lg = size === "lg";
  const box = lg ? 96 : 44;
  const sw = lg ? 8 : 4;
  const r = (box - sw) / 2 - 1;
  const c = 2 * Math.PI * r;
  const known = typeof score === "number" && status !== "unknown";
  const val = known ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const tone = known ? statusTone(status) : "unknown";
  const label = known ? `Sağlık puanı 100 üzerinden ${val}` : "Sağlık puanı hesaplanamadı";
  return `<div class="ring ring-${lg ? "lg" : "sm"} tone-${tone}" role="img" aria-label="${label}">
    <svg width="${box}" height="${box}" viewBox="0 0 ${box} ${box}" aria-hidden="true"><circle class="ring-trk" cx="${box / 2}" cy="${box / 2}" r="${r}" fill="none" stroke-width="${sw}"/>${
      known ? `<circle class="ring-val" cx="${box / 2}" cy="${box / 2}" r="${r}" fill="none" stroke-width="${sw}" stroke-dasharray="${((c * val) / 100).toFixed(1)} ${c.toFixed(1)}"/>` : ""
    }</svg><span class="ring-num">${known ? val : "–"}</span></div>`;
}

/* ---------------- badges ---------------- */

/** Vegan status pill: "vegan" | "non-vegan" | "check". */
export function veganBadge(veganStatus) {
  if (veganStatus === "vegan") return `<span class="badge b-vegan">${icon("leaf", { size: 12 })}Vegan</span>`;
  if (veganStatus === "non-vegan") return `<span class="badge b-nonvegan">Vegan değil</span>`;
  return `<span class="badge b-check">Vegan? Kontrol et</span>`;
}

const TIER_TEXT = { 1: "uygun", 2: "orta", 3: "yüksek" };
/** Price tier: accepts "₺₺" or 1–3. Renders filled + dimmed ₺ signs. */
export function priceTier(tier) {
  const n = typeof tier === "number" ? tier : String(tier || "").replace(/[^₺]/g, "").length;
  if (!n) return "";
  const k = Math.max(1, Math.min(3, n));
  return `<span class="price" aria-label="Fiyat: ${TIER_TEXT[k]}" title="Fiyat: ${TIER_TEXT[k]}">${"₺".repeat(k)}<i aria-hidden="true">${"₺".repeat(3 - k)}</i></span>`;
}

/** Risk pill for an ingredient risk ("safe"|"moderate"|"high"|"unknown"). */
export function riskPill(risk) {
  const r = riskInfo(risk);
  return `<span class="pill t-${r.tone}">${r.label}</span>`;
}

/* ---------------- product card ---------------- */

/** Photo (or monogram tile when there is no photo / the photo fails). */
export function productImage(p, { cls = "", eager = false } = {}) {
  const ini = e(initials(p.brand || p.name));
  if (!p.image) return `<div class="ph is-noimg ${cls}" data-initials="${ini}"></div>`;
  return `<div class="ph ${cls}" data-initials="${ini}"><img src="${e(p.image)}" alt="" ${eager ? "" : 'loading="lazy"'} decoding="async" data-fallback></div>`;
}

/** First enabled store link for a product (or null). */
export function primaryBuyLink(product) {
  try { return buyLinks(product)[0] || null; } catch { return null; }
}

function buyAttrs(link, product) {
  return `href="${e(link.url)}" target="_blank" rel="${e(LINK_REL)}" data-store="${e(link.store)}" data-product="${e(product.id)}"`;
}

/**
 * Product card. Whole card links to #/urun/<id>; the "Satın al" button is a separate
 * link (not nested), so tapping it never triggers card navigation.
 * productCard(product, { buy = true, eager = false })
 */
export function productCard(product, { buy = true, eager = false } = {}) {
  const p = product || {};
  const a = getAnalysis(p);
  const link = buy ? primaryBuyLink(p) : null;
  const title = `${p.brand ? p.brand + " " : ""}${p.name || ""}`;
  return `<article class="pcard" data-id="${e(p.id)}">
    ${productImage(p, { cls: "pcard-ph", eager })}
    <div class="pcard-body">
      ${p.brand ? `<div class="brand-name">${e(p.brand)}</div>` : ""}
      <h3 class="pname"><a class="pcard-link" href="${productHref(p)}" aria-label="${e(title)} — raporu aç">${e(p.name)}</a></h3>
      <div class="pcard-meta">${a ? veganBadge(a.veganStatus) : ""}${priceTier(p.priceTier)}</div>
      <div class="pcard-row">
        ${a ? scoreRing(a.healthScore, a.healthStatus, { size: "sm" }) : ""}
        ${link ? `<a class="btn btn-primary btn-sm pcard-buy" ${buyAttrs(link, p)} aria-label="${e(title)} — ${e(link.name)} üzerinden satın al">Satın al</a>` : ""}
      </div>
    </div>
  </article>`;
}

/** Responsive grid of product cards (or an empty state). */
export function productGrid(products, { emptyText = "Ürün bulunamadı.", buy = true } = {}) {
  const list = Array.isArray(products) ? products : [];
  if (!list.length) return emptyState({ icon: "search", title: emptyText });
  return `<div class="pgrid">${list.map((p, i) => productCard(p, { buy, eager: i < 4 })).join("")}</div>`;
}

/* ---------------- controls ---------------- */

/**
 * Filter chips. chipRow([{id,label,active,dot?}], { name, label, mode:"multi"|"single", wrap })
 * dot = token name ("vegan", "safe", …) for a colored dot. main.js toggles aria-pressed and
 * dispatches a "chipchange" CustomEvent on the row: detail { name, id, active, selected:[ids] }.
 */
export function chipRow(chips, { name = "chips", label = "Filtreler", mode = "multi", wrap = false } = {}) {
  const items = (chips || [])
    .map(
      (c) => `<button type="button" class="chip" data-chip="${e(c.id)}" aria-pressed="${c.active ? "true" : "false"}">${
        c.dot ? `<span class="dot" style="background:var(--${e(c.dot)})"></span>` : ""
      }${e(c.label)}</button>`
    )
    .join("");
  return `<div class="chips${wrap ? " chips-wrap" : ""}" role="group" aria-label="${e(label)}" data-chips="${e(name)}" data-mode="${mode === "single" ? "single" : "multi"}">${items}</div>`;
}

/** Big rounded search field. searchBox({ id, placeholder, value, label, scan:true }) */
export function searchBox({ id = "q", placeholder = "Ürün, marka ya da içerik ara…", value = "", label = "Ara", scan = true } = {}) {
  return `<form class="search" role="search" data-search="${e(id)}" onsubmit="return false">
    ${icon("search")}
    <label class="visually-hidden" for="${e(id)}">${e(label)}</label>
    <input id="${e(id)}" name="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="${e(placeholder)}" value="${e(value)}">
    ${scan ? `<a class="search-scan" href="#/tara">${icon("scan", { size: 16 })}Tara</a>` : ""}
  </form>`;
}

/** Section title with optional "Tümünü gör" link. */
export function sectionHeader(title, { actionHref = "", actionText = "Tümünü gör", level = 2, count = null } = {}) {
  const h = level === 3 ? "h3" : "h2";
  return `<div class="sec-head"><${h}>${e(title)}${count != null ? ` <span class="count">${e(count)}</span>` : ""}</${h}>${
    actionHref ? `<a href="${e(actionHref)}">${e(actionText)}</a>` : ""
  }</div>`;
}

/** Empty / zero state. action = { href, label } or { label, id } for a button. */
export function emptyState({ icon: ic = "search", title = "", text = "", action = null } = {}) {
  const glyph = PATHS[ic] ? icon(ic, { size: 22 }) : e(ic);
  let act = "";
  if (action && action.href) act = `<a class="btn btn-primary" href="${e(action.href)}">${e(action.label)}</a>`;
  else if (action && action.label) act = `<button type="button" class="btn btn-primary" ${action.id ? `id="${e(action.id)}"` : ""}>${e(action.label)}</button>`;
  return `<div class="empty-state">
    <div class="empty-ic" aria-hidden="true">${glyph}</div>
    ${title ? `<p class="empty-title">${e(title)}</p>` : ""}
    ${text ? `<p class="empty-text">${e(text)}</p>` : ""}
    ${act}
  </div>`;
}

/** n shimmering placeholder cards in the product grid layout. */
export function skeletonCards(n = 6) {
  const one = `<div class="pcard skel" aria-hidden="true"><div class="ph pcard-ph"></div><div class="pcard-body"><span class="sk sk-s"></span><span class="sk sk-l"></span><span class="sk sk-m"></span><span class="sk sk-b"></span></div></div>`;
  return `<div class="pgrid" aria-busy="true"><span class="visually-hidden">Yükleniyor…</span>${one.repeat(Math.max(1, n))}</div>`;
}

/* ---------------- report blocks ---------------- */

const LEVEL = { danger: { cls: "hi", ic: "alert" }, warning: { cls: "md", ic: "info" }, info: { cls: "lo", ic: "info" } };

/** "Dikkat edilmesi gerekenler" list from analysis.safety. */
export function safetyList(safety) {
  const groups = safety?.groups || [];
  if (!groups.length) {
    return `<div class="warn ok">${`<div class="wi">${icon("check", { size: 17 })}</div>`}<div><b>Önemli bir uyarı yok</b><span>AB yasaklı/kısıtlı madde, hamilelik uyarısı ya da etiket zorunlu alerjen bulunmadı.</span></div></div>`;
  }
  return `<ul class="warns" role="list">${groups
    .map((g) => {
      const l = LEVEL[g.level] || LEVEL.info;
      return `<li class="warn ${l.cls}"><div class="wi">${icon(l.ic, { size: 17 })}</div><div><b>${e(g.title)}</b><span>${e(g.names.join(", "))}</span></div></li>`;
    })
    .join("")}</ul>`;
}

const ORIGIN_TR = { plant: "Bitkisel", vegetable: "Bitkisel", mineral: "Mineral", synthetic: "Sentetik", animal: "Hayvansal" };

/**
 * One ingredient as an expandable row (<li> — wrap rows in <ul class="ings" role="list">,
 * or use ingredientList(items)).
 */
export function ingredientRow(item, { glossaryLink = true } = {}) {
  const it = item || {};
  const name = it.rawName || it.inci || "";
  const subParts = [];
  if (it.nameTr && it.nameTr !== name) subParts.push(it.nameTr);
  if (it.category && it.known !== false) subParts.push(it.category);
  const tags = flagTags(it.flags)
    .map((t) => `<span class="ftag ${e(t.cls)}">${e(t.text)}</span>`)
    .join("");
  let meta = null;
  try { meta = getCosingMeta(it.inci || name); } catch { meta = null; }
  const facts = [];
  if (it.origin) facts.push(["Kaynak", ORIGIN_TR[String(it.origin).toLowerCase()] || it.origin]);
  if (it.animalSource) facts.push(["Hayvansal kaynak", it.animalSource]);
  if (meta?.functionsTr?.length) facts.push(["İşlevi", meta.functionsTr.join(", ")]);
  if (meta?.comedogenicity != null) facts.push(["Komedojenik", `${meta.comedogenicity} / 5`]);
  if (meta?.cas) facts.push(["CAS", meta.cas]);
  if (meta?.ec) facts.push(["EC", meta.ec]);
  const inciKey = it.known !== false && it.inci ? it.inci : "";
  return `<li class="ing">
    <details>
      <summary>
        <span class="ing-n"><b>${e(name)}</b>${subParts.length ? `<span>${e(subParts.join(" · "))}</span>` : ""}</span>
        ${riskPill(it.risk)}
        ${icon("chevron", { size: 16 })}
      </summary>
      <div class="ing-body">
        ${tags ? `<div class="ftags">${tags}</div>` : ""}
        ${it.summaryTr ? `<p>${e(it.summaryTr)}</p>` : ""}
        ${facts.length ? `<dl class="ing-facts">${facts.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join("")}</dl>` : ""}
        ${glossaryLink && inciKey ? `<a class="ing-more" href="#/sozluk/${glossarySlug(inciKey)}">Sözlükte aç ${icon("chevron", { size: 14 })}</a>` : ""}
      </div>
    </details>
  </li>`;
}

/** Full ingredient list. */
export function ingredientList(items, opts) {
  return `<ul class="ings" role="list">${(items || []).map((it) => ingredientRow(it, opts)).join("")}</ul>`;
}

/** Vegan verdict callout from an analysis. */
export function veganCallout(analysis) {
  const a = analysis || {};
  const tone = a.veganStatus === "vegan" ? "vegan" : a.veganStatus === "non-vegan" ? "nonvegan" : "check";
  const ic = tone === "vegan" ? "leaf" : tone === "nonvegan" ? "x" : "info";
  return `<div class="callout c-${tone}">
    <div class="callout-ic">${icon(ic, { size: 17 })}</div>
    <div><strong>${e(a.veganLabel || "Vegan durumu")}</strong>${a.veganExplanation ? `<span>${e(a.veganExplanation)}</span>` : ""}</div>
  </div>`;
}

const SKIN_LEVEL = {
  recommended: { tone: "safe", label: "Uygun" },
  caution: { tone: "mod", label: "Dikkat" },
  avoid: { tone: "high", label: "Uygun değil" }
};

/** Skin-type fit list from analysis.skinProfile. */
export function skinFit(skinProfile) {
  const sp = skinProfile || {};
  if (!sp.hasData) return `<p class="muted skin-empty">${e(sp.summaryText || "Cilt tipi uygunluğu hesaplanamadı.")}</p>`;
  return `<div class="skinfit">
    ${sp.summaryText ? `<p class="skin-sum">${e(sp.summaryText)}</p>` : ""}
    <ul class="skin-list" role="list">${(sp.types || [])
      .map((t) => {
        const l = SKIN_LEVEL[t.level] || SKIN_LEVEL.caution;
        return `<li class="skin-row"><span class="skin-n"><b>${e(t.label)}</b><span>${e(t.reason)}</span></span><span class="pill t-${l.tone}">${l.label}</span></li>`;
      })
      .join("")}</ul>
  </div>`;
}

/**
 * Buy panel: primary "Satın al" (first enabled store) + "Diğer mağazalar" + disclosure.
 * Links carry data-store / data-product; main.js tracks clicks (trackClick).
 */
export function buyPanel(product, { label = "Satın al" } = {}) {
  let links = [];
  try { links = buyLinks(product) || []; } catch { links = []; }
  if (!links.length) return "";
  const [first, ...rest] = links;
  return `<div class="buy">
    <a class="btn btn-primary btn-lg buy-main" ${buyAttrs(first, product)}>${icon("bag", { size: 17 })}${e(label)}<span class="buy-store">· ${e(first.name)}</span></a>
    ${
      rest.length
        ? `<div class="buy-more"><span>Diğer mağazalar:</span>${rest
            .map((l) => `<a class="buy-alt" ${buyAttrs(l, product)}>${e(l.name)}${icon("external", { size: 13 })}</a>`)
            .join("")}</div>`
        : ""
    }
    <details class="buy-disc"><summary>Reklam / İş birliği · bağlantılar ortaklık bağlantısı olabilir</summary><p>${e(affiliateDisclosure())}</p></details>
  </div>`;
}

/** Sözlük adres parçası: küçük harf, boşluk → "-", [a-z0-9-] dışı atılır (glossary.js ile aynı kural). */
export function glossarySlug(inci) {
  return String(inci || "")
    .replace(/İ/g, "i")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
