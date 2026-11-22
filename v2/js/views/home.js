/**
 * MakeYUP v2 — #/ Keşfet: one search box, one chip row, results (local → archive → online).
 * URL query: q (text), f (needs: vegan,hamile,parfumsuz,parabensiz), k (category), n (shown count), tum=1 (browse all).
 */
import { setTitle, updateQuery } from "../router.js";
import { getProducts, getBrands, searchAll, searchOnline, findProduct } from "../state.js";
import { getRecent } from "../../../js/features/favorites.js";
import {
  productGrid, sectionHeader, searchBox, chipRow, emptyState, skeletonCards, escapeHtml, enc, fmt, icon
} from "../ui/components.js";

const PAGE = 24;

const NEEDS = [
  { id: "vegan", label: "Vegan", dot: "vegan", filter: "vegan" },
  { id: "hamile", label: "Hamileliğe uygun", filter: "pregnancySafe" },
  { id: "parfumsuz", label: "Parfümsüz", filter: "fragranceFree" },
  { id: "parabensiz", label: "Parabensiz", filter: "parabenFree" }
];

// Category chips. Local products use their own category; archive rows are matched by keywords.
const CATS = [
  { id: "yuz", label: "Yüz", re: /foundation|fond[oö]ten|concealer|kapat[ıi]c[ıi]|powder|pudra|blush|all[ıi]k|bronz|highlight|ayd[ıi]nlat[ıi]c[ıi]|primer|bb cream|cc cream|tinted/i },
  { id: "goz", label: "Göz", re: /mascara|maskara|eyeliner|eye ?liner|eyeshadow|eye shadow|far\b|brow|ka[sş]|lash|kirpik|eye care|eye cream|g[oö]z/i },
  { id: "dudak", label: "Dudak", re: /\blip|ruj|lipstick|gloss|dudak/i },
  { id: "cilt", label: "Cilt bakımı", re: /serum|cleanser|moisturi[sz]er|face mask|exfoliat|suncare|face oil|spot treatment|toner|essence|eye care|skincare|cream|nemlendirici|temizleyici|tonik|g[uü]ne[sş]/i }
];
const LOCAL_SKINCARE = /serum|nemlendirici|temizleyici|tonik|krem|cream|g[uü]ne[sş]|bakım/i;

const SUGGESTIONS = ["ruj", "fondöten", "karmin", "maskara -karmin", "niacinamide", "serum"];

function catMatch(p, k) {
  const c = CATS.find((x) => x.id === k);
  if (!c) return true;
  if (p.source === "local") {
    if (k === "cilt") return LOCAL_SKINCARE.test(`${p.name} ${p.categoryLabel || ""}`);
    return p.category === k;
  }
  return c.re.test(`${p.category || ""} ${p.name || ""}`);
}

function readQuery(query) {
  const f = String(query.f || "").split(",").filter((x) => NEEDS.some((n) => n.id === x));
  const k = CATS.some((c) => c.id === query.k) ? query.k : "";
  const n = Math.max(PAGE, Math.min(2000, parseInt(query.n, 10) || PAGE));
  return { q: String(query.q || ""), f, k, n, tum: query.tum === "1" };
}

function filtersOf(st) {
  const out = {};
  for (const id of st.f) out[NEEDS.find((n) => n.id === id).filter] = true;
  return out;
}

function chipsHtml(st) {
  const chips = [
    { id: "all", label: "Tümü", active: !st.f.length && !st.k },
    ...NEEDS.map((n) => ({ id: n.id, label: n.label, dot: n.dot, active: st.f.includes(n.id) })),
    ...CATS.map((c) => ({ id: "k:" + c.id, label: c.label, active: st.k === c.id }))
  ];
  return chipRow(chips, { name: "home", label: "Filtreler ve kategoriler", mode: "multi" });
}

function syncChips(root, st) {
  root.querySelectorAll('[data-chips="home"] .chip').forEach((c) => {
    const id = c.dataset.chip;
    const on = id === "all" ? !st.f.length && !st.k : id.startsWith("k:") ? st.k === id.slice(2) : st.f.includes(id);
    c.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

const isListing = (st) => !!(st.q.trim() || st.f.length || st.k || st.tum);

/* ---------------- discovery (no query) ---------------- */

function brandStrip() {
  const list = getBrands()
    .slice()
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name, "tr"));
  return `<ul class="home-brands" role="list">${list
    .map(
      (b) => `<li><a class="home-brand" href="#/marka/${enc(b.id)}">
        <span class="home-mono" style="--mono:${escapeHtml(b.accentColor || "")}" aria-hidden="true">${escapeHtml(b.monogram || "")}</span>
        <span class="home-brand-n">${escapeHtml(b.name)}</span>
      </a></li>`
    )
    .join("")}</ul>`;
}

async function renderDiscovery(box, signal) {
  // Top-scored, alternating categories (yüz / göz / dudak) and brands so the list feels varied.
  const sorted = getProducts().slice().sort((a, b) => (b.analysis?.healthScore ?? -1) - (a.analysis?.healthScore ?? -1));
  const featured = [];
  const usedBrands = new Set();
  for (let round = 0; featured.length < 6 && round < 3; round++) {
    for (const cat of ["yuz", "dudak", "goz"]) {
      const p = sorted.find((x) => x.category === cat && !featured.includes(x) && (round > 1 || !usedBrands.has(x.brandId)));
      if (p && featured.length < 6) { featured.push(p); usedBrands.add(p.brandId); }
    }
  }
  const ids = getRecent(8);
  let recent = [];
  if (ids.length) {
    recent = (await Promise.all(ids.map((id) => findProduct(id).catch(() => null)))).filter(Boolean).slice(0, 4);
    if (signal.aborted) return;
  }
  box.innerHTML = `
    <section>
      ${sectionHeader("Öne çıkanlar", { actionHref: "#/?tum=1", actionText: "Tümünü gör" })}
      ${productGrid(featured)}
    </section>
    ${recent.length ? `<section>${sectionHeader("Son baktıkların", { actionHref: "#/favoriler", actionText: "Favorilerim" })}${productGrid(recent)}</section>` : ""}
    <section>
      ${sectionHeader("Markalar", { actionHref: "#/markalar", actionText: "Tümünü gör" })}
      ${brandStrip()}
    </section>`;
}

/* ---------------- results ---------------- */

function countLine(total, shown, localN, st) {
  if (!total) return "";
  const parts = [`<b>${fmt(total)}</b> ürün`];
  if (localN) parts.push(`${fmt(localN)} incelenmiş`);
  if (shown < total) parts.push(`ilk ${fmt(shown)} gösteriliyor`);
  const what = st.q.trim() ? ` · “${escapeHtml(st.q.trim())}”` : "";
  return `<p class="home-count" role="status">${parts.join(" · ")}${what}</p>`;
}

function noResults(st) {
  const hasFilters = st.f.length || st.k;
  const sugg = SUGGESTIONS.map((s) => `<a class="home-sugg" href="#/?q=${encodeURIComponent(s)}">${escapeHtml(s)}</a>`).join("");
  return `<div class="home-empty">
    ${emptyState({
      icon: "search",
      title: st.q.trim() ? `“${st.q.trim()}” için sonuç yok` : "Bu filtrelerle ürün yok",
      text: hasFilters ? "Filtrelerden birini kaldırmayı ya da daha kısa bir kelime denemeyi düşün." : "Yazımı kontrol et ya da marka, ürün türü veya içerik adıyla ara.",
      action: hasFilters ? { id: "homeClear", label: "Filtreleri temizle" } : null
    })}
    <p class="home-sugg-t">Şunları deneyebilirsin:</p>
    <div class="home-suggs">${sugg}</div>
  </div>`;
}

function onlineBlock(st) {
  if (!st.q.trim()) return "";
  return `<div class="home-online" data-online>
    <button type="button" class="btn btn-ghost" data-online-btn>${icon("external", { size: 16 })}İnternette de ara</button>
    <p class="home-online-hint">Open Beauty Facts veritabanında “${escapeHtml(st.q.trim())}” için ek ürünler aranır.</p>
  </div>`;
}

/* ---------------- view ---------------- */

async function homeView({ query, el, signal }) {
  setTitle("");
  const st = readQuery(query);
  el.innerHTML = `
    <section class="home-hero">
      <div class="eyebrow">İçerik analizi</div>
      <h1>Cildine ne sürdüğünü bil.</h1>
      <p>Ürün, marka ya da içerik ara; sağlık puanı, vegan durumu ve uyarılar tek bakışta.</p>
      ${searchBox({ id: "homeQ", value: st.q, label: "Ürün, marka ya da içerik ara" })}
      ${chipsHtml(st)}
    </section>
    <div class="home-body" data-body></div>`;

  const input = el.querySelector("#homeQ");
  const body = el.querySelector("[data-body]");
  let run = 0;
  let lastList = [];

  async function render({ keepN = true } = {}) {
    const my = ++run;
    if (!keepN) st.n = PAGE;
    if (!isListing(st)) {
      await renderDiscovery(body, signal);
      return;
    }
    if (!body.querySelector(".home-res")) body.innerHTML = skeletonCards(4);
    const res = await searchAll(st.q, filtersOf(st));
    if (signal.aborted || my !== run) return;
    const all = st.k ? res.items.filter((p) => catMatch(p, st.k)) : res.items;
    const localN = all.filter((p) => p.source === "local").length;
    lastList = all;
    const shown = all.slice(0, st.n);
    if (!all.length) {
      body.innerHTML = `<div class="home-res">${noResults(st)}${onlineBlock(st)}<div data-online-res></div></div>`;
      return;
    }
    body.innerHTML = `<div class="home-res">
      ${countLine(all.length, shown.length, localN, st)}
      <div data-grid>${productGrid(shown)}</div>
      ${shown.length < all.length ? `<div class="home-more"><button type="button" class="btn btn-ghost" data-more>Daha fazla göster <span class="home-more-n">(${fmt(all.length - shown.length)} kaldı)</span></button></div>` : ""}
      ${onlineBlock(st)}
      <div data-online-res></div>
    </div>`;
  }

  const syncUrl = () =>
    updateQuery({ q: st.q.trim() ? st.q : "", f: st.f, k: st.k, n: st.n > PAGE ? st.n : "", tum: st.tum && !st.q.trim() && !st.f.length && !st.k ? "1" : "" });

  // Typing (debounced).
  let t = 0;
  const onInput = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      st.q = input.value;
      st.n = PAGE;
      syncUrl();
      render();
    }, 200);
  };
  input.addEventListener("input", onInput);
  input.form?.addEventListener("submit", () => {
    clearTimeout(t);
    st.q = input.value;
    st.n = PAGE;
    syncUrl();
    render();
    if (matchMedia("(hover: none)").matches) input.blur(); // close the phone keyboard
  });

  // Chips.
  el.querySelector('[data-chips="home"]').addEventListener("chipchange", (e) => {
    const id = e.detail.id;
    if (id === "all") { st.f = []; st.k = ""; }
    else if (id.startsWith("k:")) { const k = id.slice(2); st.k = st.k === k ? "" : k; }
    else st.f = st.f.includes(id) ? st.f.filter((x) => x !== id) : [...st.f, id];
    st.n = PAGE;
    syncChips(el, st);
    syncUrl();
    render();
  });

  // Delegated clicks inside the results.
  body.addEventListener("click", async (e) => {
    const more = e.target.closest("[data-more]");
    if (more) {
      const from = st.n;
      st.n += PAGE;
      syncUrl();
      const grid = body.querySelector("[data-grid] .pgrid");
      const next = lastList.slice(from, st.n);
      if (grid && next.length) {
        const tmp = document.createElement("div");
        tmp.innerHTML = productGrid(next);
        grid.append(...tmp.querySelector(".pgrid").children);
      }
      const left = lastList.length - st.n;
      const line = body.querySelector(".home-count");
      if (line) line.outerHTML = countLine(lastList.length, Math.min(st.n, lastList.length), lastList.filter((p) => p.source === "local").length, st);
      if (left > 0) more.querySelector(".home-more-n").textContent = `(${fmt(left)} kaldı)`;
      else more.closest(".home-more").remove();
      return;
    }
    if (e.target.closest("#homeClear")) {
      st.f = []; st.k = ""; st.n = PAGE;
      syncChips(el, st);
      syncUrl();
      render();
      return;
    }
    const ob = e.target.closest("[data-online-btn]");
    if (ob) {
      const wrap = ob.closest("[data-online]");
      const q = st.q;
      const my = run;
      ob.disabled = true;
      ob.textContent = "Aranıyor…";
      const { items, error } = await searchOnline(q);
      if (signal.aborted || my !== run) return;
      const seen = new Set(lastList.map((p) => String(p.id)));
      const pass = (p) => !seen.has(String(p.id)) && (!st.k || catMatch(p, st.k));
      const extra = (items || []).filter(pass);
      const out = body.querySelector("[data-online-res]");
      if (error) {
        wrap.innerHTML = `<p class="home-note" role="status">${icon("info", { size: 16 })}İnternet veritabanına şu an ulaşılamıyor. Yerel sonuçlar gösteriliyor.</p>`;
      } else if (!extra.length) {
        wrap.innerHTML = `<p class="home-note" role="status">${icon("info", { size: 16 })}İnternette ek sonuç bulunamadı.</p>`;
      } else {
        wrap.remove();
        if (out) out.innerHTML = `${sectionHeader("İnternetten", { count: extra.length, level: 3 })}${productGrid(extra)}`;
      }
    }
  });

  // "/" focuses the search on desktop.
  const onKey = (e) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
    e.preventDefault();
    input.focus();
    input.select();
  };
  document.addEventListener("keydown", onKey);

  await render();
  return () => {
    clearTimeout(t);
    document.removeEventListener("keydown", onKey);
  };
}

export default {
  routes: { "#/": homeView }
};
