/**
 * MakeYUP — #/sozluk (searchable ingredient list) and #/sozluk/:inci (ingredient page).
 *
 * Slug rule: glossarySlug("Sodium Hyaluronate") → "sodium-hyaluronate"
 * (lowercase, spaces → "-", anything outside [a-z0-9-] removed). Lookup is tolerant:
 * "#/sozluk/sodium%20hyaluronate", "#/sozluk/Sodium-Hyaluronate" and aliases resolve too.
 */
import { setTitle, updateQuery, back } from "../router.js";
import { getProducts } from "../state.js";
import {
  escapeHtml as e, icon, riskPill, riskInfo, chipRow, searchBox, productGrid, sectionHeader, emptyState
} from "../ui/components.js";
import { INGREDIENTS_DB } from "../data/ingredients.js";
import { findIngredient, getCosingMeta } from "../analyzer.js";
import { getIngredientFlags } from "../flags.js";
import { compileQuery } from "../search.js";

/** URL slug for an INCI name. */
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

/** Hash URL of an ingredient page: glossaryHref("Carmine") → "#/sozluk/carmine". */
export function glossaryHref(inci) {
  return `#/sozluk/${glossarySlug(inci)}`;
}

const keyOf = (s) => String(s || "").replace(/İ/g, "i").toLowerCase().replace(/[^a-z0-9]/g, "");

let keyIndex = null;
function entryBySlug(slug) {
  if (!keyIndex) {
    keyIndex = new Map();
    for (const it of INGREDIENTS_DB) if (!keyIndex.has(keyOf(it.inci))) keyIndex.set(keyOf(it.inci), it);
    for (const it of INGREDIENTS_DB) for (const al of it.aliases || []) if (!keyIndex.has(keyOf(al))) keyIndex.set(keyOf(al), it);
  }
  return keyIndex.get(keyOf(slug)) || null;
}

const FILTERS = [
  { id: "safe", label: "Güvenli", dot: "safe", test: (it) => it.risk === "safe" },
  { id: "moderate", label: "Orta", dot: "moderate", test: (it) => it.risk === "moderate" },
  { id: "high", label: "Yüksek", dot: "high", test: (it) => it.risk === "high" },
  { id: "animal", label: "Hayvansal", dot: "nonvegan", test: (it) => it.vegan === false }
];

const hay = new WeakMap();
const haystack = (it) => {
  let h = hay.get(it);
  if (!h) { h = [it.inci, it.nameTr, ...(it.aliases || []), it.category].join(" | "); hay.set(it, h); }
  return h;
};

const sortedDb = () => [...INGREDIENTS_DB].sort((a, b) => String(a.nameTr || a.inci).localeCompare(String(b.nameTr || b.inci), "tr"));

function veganText(v) {
  if (v === true) return { cls: "b-vegan", text: "Vegan" };
  if (v === false) return { cls: "b-nonvegan", text: "Hayvansal" };
  if (v === "conditional") return { cls: "b-check", text: "Kaynağa bağlı" };
  return null;
}

function rowHtml(it) {
  const v = veganText(it.vegan);
  const r = riskInfo(it.risk);
  return `<li><a class="glossary-row" href="${glossaryHref(it.inci)}">
    <span class="glossary-dot t-${r.tone}" aria-hidden="true"></span>
    <span class="glossary-row-n"><b>${e(it.nameTr || it.inci)}</b><span>${e(it.inci)}${it.category ? ` · ${e(it.category)}` : ""}</span></span>
    <span class="glossary-row-tags">${v && it.vegan === false ? `<span class="badge ${v.cls}">${v.text}</span>` : ""}${riskPill(it.risk)}</span>
    ${icon("chevron", { size: 16 })}
  </a></li>`;
}

/* ---------------- list ---------------- */

function listHandler({ el, query }) {
  setTitle("İçerik sözlüğü");
  const all = sortedDb();
  let q = query.q || "";
  let f = FILTERS.some((x) => x.id === query.f) ? query.f : "";

  el.innerHTML = `<section class="glossary-page">
    <header class="page-head">
      <div class="eyebrow">İçerik sözlüğü</div>
      <h1>Bu madde ne işe yarar?</h1>
      <p>${all.length} kozmetik içeriğin Türkçe açıklaması, risk düzeyi ve vegan durumu.</p>
    </header>
    ${searchBox({ id: "glossaryQ", placeholder: "İçerik ara: karmin, paraben, niacinamide…", value: q, label: "İçerik ara", scan: false })}
    ${chipRow(
      [{ id: "", label: "Tümü", active: !f }, ...FILTERS.map((x) => ({ id: x.id, label: x.label, dot: x.dot, active: f === x.id }))],
      { name: "glossaryFilter", label: "Risk filtresi", mode: "single", wrap: true }
    )}
    <p class="glossary-count muted" aria-live="polite" data-count></p>
    <div data-list></div>
  </section>`;

  const listEl = el.querySelector("[data-list]");
  const countEl = el.querySelector("[data-count]");
  const render = () => {
    const test = compileQuery(q);
    const fx = FILTERS.find((x) => x.id === f);
    const items = all.filter((it) => (!fx || fx.test(it)) && test(haystack(it)));
    countEl.textContent = `${items.length} içerik`;
    if (!items.length) {
      const guess = q.trim() ? findIngredient(q) : null;
      listEl.innerHTML = emptyState({
        icon: "search",
        title: "Sözlükte bulunamadı",
        text: q.trim() ? "Yazımı kontrol et ya da bu adı yine de inceleyelim." : "Filtreyi değiştirmeyi dene.",
        action: q.trim() ? { href: glossaryHref(guess?.inci || q), label: `“${q.trim()}” maddesini incele` } : null
      });
      return;
    }
    listEl.innerHTML = `<ul class="glossary-list" role="list">${items.map(rowHtml).join("")}</ul>`;
  };
  render();

  const input = el.querySelector("#glossaryQ");
  let t = null;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => { q = input.value; updateQuery({ q, f }); render(); }, 120);
  });
  el.querySelector("[data-chips]").addEventListener("chipchange", (ev) => {
    f = ev.detail.selected[0] || "";
    updateQuery({ q, f });
    render();
  });
  return () => clearTimeout(t);
}

/* ---------------- detail ---------------- */

const ORIGIN_TR = { plant: "Bitkisel", vegetable: "Bitkisel", mineral: "Mineral", synthetic: "Sentetik", animal: "Hayvansal" };
const ENV_TR = { microplastic: "Mikroplastik", reef: "Mercan resiflerine zararlı olabilir", persistent: "Doğada kalıcı" };

function flagsHtml(flags) {
  if (!flags) return "";
  const out = [];
  if (flags.pregnancy) {
    const avoid = flags.pregnancy.lvl === "avoid";
    out.push({ cls: avoid ? "hi" : "md", ic: "alert", t: avoid ? "Hamilelikte kaçınılmalı" : "Hamilelikte doktora danışın", d: flags.pregnancy.note });
  }
  if (flags.banned) out.push({ cls: "hi", ic: "x", t: "AB'de kozmetikte yasaklı", d: flags.banned.note || "" });
  if (flags.restricted) out.push({ cls: "md", ic: "info", t: `AB'de oran sınırı${flags.restricted.max ? `: ${flags.restricted.max}` : ""}`, d: flags.restricted.note || "" });
  if (flags.allergen) out.push({ cls: "md", ic: "info", t: "AB etiket zorunlu koku alerjeni", d: flags.allergen.note || "Belirli oranın üstünde etikette ayrıca yazılması gerekir; hassas ciltte tahriş yapabilir." });
  if (flags.ambiguous) out.push({ cls: "lo", ic: "info", t: "Bitkisel de hayvansal da olabilir", d: flags.ambiguous.note || "" });
  if (flags.env) out.push({ cls: "lo", ic: "leaf", t: ENV_TR[flags.env.type] || "Çevre etkisi", d: flags.env.note || "" });
  if (!out.length) return "";
  return `<ul class="warns" role="list">${out
    .map((x) => `<li class="warn ${x.cls}"><div class="wi">${icon(x.ic, { size: 17 })}</div><div><b>${e(x.t)}</b>${x.d ? `<span>${e(x.d)}</span>` : ""}</div></li>`)
    .join("")}</ul>`;
}

function cosingHtml(inci) {
  let m = null;
  try { m = getCosingMeta(inci); } catch { m = null; }
  if (!m) return `<p class="muted glossary-nometa">AB CosIng kaydında ek bilgi bulunamadı.</p>`;
  const facts = [];
  if (m.functionsTr?.length) facts.push(["İşlevi (CosIng)", m.functionsTr.join(", ")]);
  if (m.comedogenicity != null) facts.push(["Komedojenik", `${m.comedogenicity} / 5`]);
  if (m.irritancy != null) facts.push(["Tahriş", `${m.irritancy} / 5`]);
  if (m.cas) facts.push(["CAS", m.cas]);
  if (m.ec) facts.push(["EC", m.ec]);
  if (!facts.length) return `<p class="muted glossary-nometa">AB CosIng kaydında ek bilgi bulunamadı.</p>`;
  return `<dl class="glossary-facts">${facts.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join("")}</dl>`;
}

function productsWith(entry) {
  const key = keyOf(entry.inci);
  return getProducts().filter((p) => (p.analysis?.items || []).some((i) => i.known && keyOf(i.inci) === key));
}

function detailHandler({ el, params }) {
  const raw = String(params.inci || "");
  let entry = entryBySlug(raw);
  let inDb = !!entry;
  const guessName = raw.replace(/[-_]+/g, " ").trim();
  if (!entry) {
    const f = findIngredient(guessName);
    if (f) { entry = f; inDb = INGREDIENTS_DB.includes(f); }
  }
  const inci = entry?.inci || guessName;
  const flags = getIngredientFlags(entry?.inci || guessName, entry) || null;
  const pretty = guessName.replace(/\b\w/g, (c) => c.toUpperCase());
  const title = (inDb ? entry?.nameTr : pretty) || entry?.nameTr || "İçerik";
  setTitle(title);

  const enc = encodeURIComponent(inci);
  const v = entry ? veganText(entry.vegan) : null;
  const origin = entry?.origin ? ORIGIN_TR[String(entry.origin).toLowerCase()] || entry.origin : entry?.vegan === false ? "Hayvansal" : "";
  const prods = entry ? productsWith(entry) : [];

  const body = () => `<article class="glossary-detail">
    <button type="button" class="btn btn-quiet glossary-back" data-back>${icon("back", { size: 16 })}Sözlük</button>
    <header class="glossary-head panel">
      <div class="eyebrow">İçerik sözlüğü</div>
      <h1>${e(title)}</h1>
      ${inDb && entry?.nameTr && entry.nameTr !== inci ? `<p class="glossary-inci">INCI: <b>${e(inci)}</b></p>` : ""}
      <div class="glossary-badges">${entry ? riskPill(entry.risk) : riskPill("unknown")}${v ? `<span class="badge ${v.cls}">${v.cls === "b-vegan" ? icon("leaf", { size: 12 }) : ""}${v.text}</span>` : ""}${
        entry?.category ? `<span class="badge glossary-cat">${e(entry.category)}</span>` : ""
      }</div>
      ${entry?.summaryTr ? `<p class="glossary-sum">${e(entry.summaryTr)}</p>` : ""}
      ${!entry ? `<p class="glossary-sum">Bu madde yerel veritabanımızda yok. Aşağıdaki kaynaklardan bilgi alabilirsin.</p>` : !inDb ? `<p class="glossary-note muted">${icon("info", { size: 14 })}Bu bilgi maddenin kimyasal ailesinden tahmin edildi.</p>` : ""}
      ${entry?.animalSource || origin ? `<dl class="glossary-facts glossary-origin">${origin ? `<div><dt>Kaynak</dt><dd>${e(origin)}</dd></div>` : ""}${entry?.animalSource ? `<div><dt>Hayvansal kaynak</dt><dd>${e(entry.animalSource)}</dd></div>` : ""}</dl>` : ""}
    </header>
    ${flags ? `<section class="glossary-sec">${sectionHeader("Uyarılar", { level: 2 })}${flagsHtml(flags)}</section>` : ""}
    <section class="glossary-sec" data-cosing>${sectionHeader("Teknik bilgiler", { level: 2 })}${cosingHtml(inci)}</section>
    ${entry ? `<section class="glossary-sec">${sectionHeader("Bu içeriği barındıran ürünler", { level: 2, count: prods.length })}${prods.length ? productGrid(prods) : `<p class="muted glossary-nometa">Seçili ürünlerimizde bu madde yok.</p>`}</section>` : ""}
    <section class="glossary-sec">${sectionHeader("Dış kaynaklar", { level: 2 })}
      <ul class="glossary-links" role="list">
        <li><a href="https://cosmileeurope.eu/inci/search/?q=${enc}" target="_blank" rel="noopener noreferrer">COSMILE Europe ${icon("external", { size: 14 })}</a></li>
        <li><a href="https://www.ewg.org/skindeep/search/?search=${enc}" target="_blank" rel="noopener noreferrer">EWG Skin Deep ${icon("external", { size: 14 })}</a></li>
        <li><a href="https://ec.europa.eu/growth/tools-databases/cosing/" target="_blank" rel="noopener noreferrer">AB CosIng ${icon("external", { size: 14 })}</a></li>
      </ul>
      <p class="muted glossary-disc">Bilgi amaçlıdır, tıbbi tavsiye değildir.</p>
    </section>
  </article>`;

  el.innerHTML = body();
  el.querySelector("[data-back]").addEventListener("click", () => back("#/sozluk"));
  const onCosing = () => {
    const sec = el.querySelector("[data-cosing]");
    if (sec) sec.innerHTML = sectionHeader("Teknik bilgiler", { level: 2 }) + cosingHtml(inci);
  };
  window.addEventListener("makeyup:cosing-ready", onCosing);
  return () => window.removeEventListener("makeyup:cosing-ready", onCosing);
}

export default {
  routes: {
    "#/sozluk": listHandler,
    "#/sozluk/:inci": detailHandler
  }
};
