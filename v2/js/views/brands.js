/**
 * MakeYUP v2 — #/markalar (brand list) and #/marka/:id (brand page).
 * Brand page query: f = vegan,hamile ; n = shown count.
 */
import { setTitle, updateQuery } from "../router.js";
import { getBrands, getBrand, getCatalog, makeFilter, slugify } from "../state.js";
import { productGrid, chipRow, emptyState, scoreRing, escapeHtml, enc, fmt, icon, skeletonCards } from "../ui/components.js";

const PAGE = 24;

const POLICY = {
  full: { cls: "brands-tag-vegan", short: "Tamamen vegan" },
  partial: { cls: "brands-tag-part", short: "Vegan seri" },
  mixed: { cls: "brands-tag-mixed", short: "Ürün bazlı" }
};

const statusOf = (score) => (typeof score !== "number" ? "unknown" : score >= 70 ? "healthy" : score >= 50 ? "moderate" : "risky");

function mono(b, cls = "") {
  return `<span class="brands-mono ${cls}" style="--mono:${escapeHtml(b.accentColor || "")}" aria-hidden="true">${escapeHtml(b.monogram || (b.name || "?").slice(0, 2))}</span>`;
}

function tags(b) {
  const pol = POLICY[b.brandVeganPolicy];
  const out = [];
  if (pol) out.push(`<span class="brands-tag ${pol.cls}" title="${escapeHtml(b.brandVeganLabel || "")}">${b.brandVeganPolicy === "full" ? icon("leaf", { size: 12 }) : ""}${escapeHtml(pol.short)}</span>`);
  if (b.crueltyFree === true) out.push(`<span class="brands-tag brands-tag-cf">${icon("check", { size: 12 })}Cruelty-free</span>`);
  else if (b.crueltyFree === false) out.push(`<span class="brands-tag brands-tag-no">Cruelty-free değil</span>`);
  return out.join("");
}

/* ---------------- #/markalar ---------------- */

function brandList({ el }) {
  setTitle("Markalar");
  const list = getBrands()
    .slice()
    .sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1) || b.productCount - a.productCount || a.name.localeCompare(b.name, "tr"));
  el.innerHTML = `
    <header class="page-head brands-head">
      <div class="eyebrow">Marka rehberi</div>
      <h1>Markalar</h1>
      <p>${fmt(list.length)} marka, incelenmiş ürünlerinin ortalama puanına göre sıralı. Vegan politikası ve cruelty-free durumu bir bakışta.</p>
    </header>
    <ul class="brands-grid" role="list">
      ${list
        .map(
          (b) => `<li class="brands-card">
            ${mono(b)}
            <div class="brands-card-body">
              <h2 class="brands-card-n"><a class="brands-card-link" href="#/marka/${enc(b.id)}">${escapeHtml(b.name)}</a></h2>
              <p class="brands-card-meta">${escapeHtml(b.country || "")}${b.country ? " · " : ""}${fmt(b.productCount)} ürün</p>
              <div class="brands-tags">${tags(b)}</div>
            </div>
            <div class="brands-card-score" title="Ortalama sağlık puanı">
              ${scoreRing(b.avgScore, statusOf(b.avgScore), { size: "sm" })}
              <span>ort.</span>
            </div>
          </li>`
        )
        .join("")}
    </ul>`;
}

/* ---------------- #/marka/:id ---------------- */

const NEEDS = [
  { id: "vegan", label: "Vegan", dot: "vegan", key: "vegan" },
  { id: "hamile", label: "Hamileliğe uygun", key: "pregnancySafe" }
];

async function brandPage({ params, query, el, signal }) {
  const id = String(params.id || "");
  const brand = getBrand(id);
  let f = String(query.f || "").split(",").filter((x) => NEEDS.some((n) => n.id === x));
  let n = Math.max(PAGE, parseInt(query.n, 10) || PAGE);

  el.innerHTML = skeletonCards(4);
  const catalog = await getCatalog();
  if (signal.aborted) return;
  // Archive spellings differ ("NYX" vs "nyx", "Nars" vs "nars-cosmetics"): match on the first word too.
  const keys = new Set([id, brand ? slugify(brand.name) : "", brand ? id.split("-")[0] : ""].filter(Boolean));
  const archive = catalog.filter((p) => keys.has(p.brandId));
  const local = brand ? brand.products : [];
  const all = [...local, ...archive];
  const name = brand?.name || archive[0]?.brand || "";

  if (!brand && !archive.length) {
    setTitle("Marka bulunamadı");
    el.innerHTML = `<section class="brands-missing">${emptyState({
      icon: "tag",
      title: "Bu markayı bulamadık",
      text: "Bağlantı eski olabilir. Marka listesinden devam edebilirsin.",
      action: { href: "#/markalar", label: "Tüm markalar" }
    })}</section>`;
    return;
  }
  setTitle(name);

  const scores = brand?.avgScore;
  el.innerHTML = `
    <nav class="brands-crumb" aria-label="Konum"><a href="#/markalar">${icon("back", { size: 16 })}Markalar</a></nav>
    <header class="panel brands-hero">
      ${brand ? mono(brand, "brands-mono-lg") : `<span class="brands-mono brands-mono-lg" aria-hidden="true">${escapeHtml(name.slice(0, 2))}</span>`}
      <div class="brands-hero-body">
        <h1>${escapeHtml(name)}</h1>
        ${brand?.tagline ? `<p class="brands-tagline">${escapeHtml(brand.tagline)}</p>` : ""}

      </div>
      <dl class="brands-facts">
          ${brand?.country ? `<div><dt>Ülke</dt><dd>${escapeHtml(brand.country)}</dd></div>` : ""}
          ${brand?.brandVeganLabel ? `<div><dt>Vegan politikası</dt><dd>${escapeHtml(brand.brandVeganLabel)}</dd></div>` : ""}
          ${brand ? `<div><dt>Cruelty-free</dt><dd>${brand.crueltyFree ? "Evet" : "Hayır"}</dd></div>` : ""}
          <div><dt>Ürün</dt><dd>${fmt(all.length)}</dd></div>
        </dl>
      ${typeof scores === "number" ? `<div class="brands-hero-score">${scoreRing(scores, statusOf(scores), { size: "lg" })}<span>Ortalama<br>sağlık puanı</span></div>` : ""}
    </header>
    <div class="brands-tools">
      <h2 class="brands-sub">Ürünleri</h2>
      ${chipRow(NEEDS.map((x) => ({ id: x.id, label: x.label, dot: x.dot, active: f.includes(x.id) })), { name: "brand", label: "Ürün filtreleri", mode: "multi" })}
    </div>
    <div data-list></div>`;

  const box = el.querySelector("[data-list]");
  let list = [];
  const render = () => {
    const filt = {};
    for (const id of f) filt[NEEDS.find((x) => x.id === id).key] = true;
    const pass = makeFilter(filt);
    list = all.filter(pass);
    const shown = list.slice(0, n);
    box.innerHTML = list.length
      ? `<p class="brands-count" role="status"><b>${fmt(list.length)}</b> ürün</p>${productGrid(shown)}${
          shown.length < list.length ? `<div class="brands-more"><button type="button" class="btn btn-ghost" data-more>Daha fazla göster (${fmt(list.length - shown.length)} kaldı)</button></div>` : ""
        }`
      : emptyState({ icon: "search", title: "Bu filtrede ürün yok", text: "Filtreyi kaldırıp markanın tüm ürünlerine bakabilirsin.", action: { id: "brandClear", label: "Filtreyi kaldır" } });
  };
  render();

  el.querySelector('[data-chips="brand"]').addEventListener("chipchange", (e) => {
    f = e.detail.selected;
    n = PAGE;
    updateQuery({ f, n: "" });
    render();
  });
  box.addEventListener("click", (e) => {
    if (e.target.closest("[data-more]")) {
      n += PAGE;
      updateQuery({ f, n });
      render();
    } else if (e.target.closest("#brandClear")) {
      f = [];
      n = PAGE;
      updateQuery({});
      el.querySelectorAll('[data-chips="brand"] .chip').forEach((c) => c.setAttribute("aria-pressed", "false"));
      render();
    }
  });
}

export default {
  routes: {
    "#/markalar": brandList,
    "#/marka/:id": brandPage
  }
};
