/**
 * MakeYUP — #/urun/:id  (product report; the money path)
 * Top → bottom: photo + facts · score · "Hızlı cevaplar" · buy panel + actions ·
 * warnings · skin fit · cleaner alternatives · ingredients · disclosure.
 * Phone: a fixed "Satın al" bar above the tab bar. Desktop: sticky side column.
 */
import { setTitle, back } from "../router.js";
import { findProduct, getProduct, getAnalysis, getProducts, getCatalog } from "../state.js";
import {
  escapeHtml as e, enc, productHref, productImage, scoreRing, scoreVerdict, statusTone, icon, emptyState,
  buyPanel, primaryBuyLink, priceTier, safetyList, skinFit, ingredientList, sectionHeader, veganBadge, toast, hideToast
} from "../ui/components.js";
import { LINK_REL } from "../affiliate.js";
import { analyzeIngredients } from "../analyzer.js";
import { findAlternatives } from "../features/alternatives.js";
import { isFavorite, toggleFavorite, addRecent, onChange } from "../features/favorites.js";
import { shareProduct, productPageUrl, reportUrl } from "../features/share.js";
import { addToCompare, replaceInCompare, compareHref, getCompareIds } from "./compare.js";

const altCache = new Map(); // analyzer results shared across product pages

/* ---------------- small helpers ---------------- */

function short(names, n = 2) {
  const list = [...new Set(names.filter(Boolean))];
  if (!list.length) return "";
  return list.slice(0, n).join(", ") + (list.length > n ? ` +${list.length - n}` : "");
}

function paoText(pao) {
  const m = String(pao || "").match(/(\d+)\s*M/i);
  return m ? `Açıldıktan sonra ${m[1]} ay` : "";
}

function spfOf(p) {
  const m = `${p.name} ${p.categoryLabel}`.match(/SPF\s*(\d+)/i);
  return m ? `SPF ${m[1]}` : "";
}

/* ---------------- "Hızlı cevaplar" ---------------- */

function quickData(a) {
  const known = !!a && a.healthStatus !== "unknown";
  if (!known) {
    const u = { tone: "unknown", ans: "Bilinmiyor", sub: "İçerik listesi yok ya da tanınmadı" };
    return [
      { q: "Vegan mı?", ...u },
      { q: "Hamilelikte uygun mu?", ...u },
      { q: "Parfüm / alerjen var mı?", ...u }
    ];
  }
  const groups = a.safety?.groups || [];

  let vegan;
  if (a.veganStatus === "vegan") vegan = { tone: "safe", ans: "Evet", sub: "Hayvansal içerik yok" };
  else if (a.veganStatus === "non-vegan") vegan = { tone: "high", ans: "Hayır", sub: `${short((a.nonVeganIngredients || []).map((i) => i.nameTr || i.inci))} içerir` };
  else vegan = { tone: "mod", ans: "Emin değiliz", sub: `Kaynağı belirsiz: ${short((a.conditionalVeganIngredients || []).map((i) => i.nameTr || i.inci)) || "bazı içerikler"}` };

  const avoid = groups.find((g) => g.key === "pregAvoid");
  const caution = groups.find((g) => g.key === "pregCaution");
  let preg;
  if (avoid) preg = { tone: "high", ans: "Önerilmez", sub: `${short(avoid.names)} içerir` };
  else if (caution) preg = { tone: "mod", ans: "Doktora danış", sub: `${short(caution.names)} içerir` };
  else preg = { tone: "safe", ans: "Evet", sub: "Hamilelik uyarısı yok" };

  const fragItems = (a.items || []).filter((i) => i.known && (i.inci === "Parfum" || (i.tags || []).includes("Koku Alerjeni")));
  const allergen = groups.find((g) => g.key === "allergen");
  const fragNames = [...fragItems.map((i) => i.rawName || i.inci), ...(allergen?.names || [])];
  const frag = fragNames.length
    ? { tone: "mod", ans: "Var", sub: short(fragNames) }
    : { tone: "safe", ans: "Yok", sub: "Parfüm ve koku alerjeni yok" };

  return [
    { q: "Vegan mı?", ...vegan },
    { q: "Hamilelikte uygun mu?", ...preg },
    { q: "Parfüm / alerjen var mı?", ...frag }
  ];
}

function quickAnswers(a) {
  const IC = { safe: "check", high: "x", mod: "alert", unknown: "info" };
  return `<section class="product-quick" aria-labelledby="pq-h">
    <h2 id="pq-h" class="product-h">Hızlı cevaplar</h2>
    <ul class="product-qa" role="list">${quickData(a)
      .map(
        (d) => `<li class="product-qa-item qa-${d.tone}">
          <span class="product-qa-q">${e(d.q)}</span>
          <span class="product-qa-a">${icon(IC[d.tone], { size: 16 })}${e(d.ans)}</span>
          <span class="product-qa-sub">${e(d.sub)}</span>
        </li>`
      )
      .join("")}</ul>
  </section>`;
}

/* ---------------- blocks ---------------- */

function headBlock(p) {
  const facts = [];
  if (p.categoryLabel) facts.push(`<span>${e(p.categoryLabel)}</span>`);
  const tier = priceTier(p.priceTier);
  if (tier) facts.push(tier);
  const pao = paoText(p.pao);
  if (pao) facts.push(`<span>${e(pao)}</span>`);
  const spf = spfOf(p);
  if (spf) facts.push(`<span class="product-spf">${e(spf)}</span>`);
  if (p.crueltyFree === true) facts.push(`<span>Cruelty-free</span>`);
  if (p.source === "arsiv") facts.push(`<span>Arşiv kaydı</span>`);
  const brand = p.brand
    ? p.source === "local" && p.brandId
      ? `<a class="brand-name product-brand" href="#/marka/${enc(p.brandId)}">${e(p.brand)}</a>`
      : `<span class="brand-name product-brand">${e(p.brand)}</span>`
    : "";
  return `<header class="product-head">
    ${productImage(p, { cls: "product-ph", eager: true })}
    <div class="product-id">
      ${brand}
      <h1 class="product-name">${e(p.name)}</h1>
      ${facts.length ? `<div class="product-facts">${facts.join('<span class="product-dot" aria-hidden="true">·</span>')}</div>` : ""}
    </div>
  </header>`;
}

function scoreBlock(a) {
  const known = !!a && a.healthStatus !== "unknown";
  const total = a?.counts?.total || 0;
  const warns = a?.safety?.groups?.length || 0;
  const line = !a || !total
    ? "Bu ürün için içerik listesi yok; puan hesaplanamadı."
    : !known
      ? "İçerikler veritabanımızla eşleşmedi; puan hesaplanamadı."
      : `${total} içerikten ${a.counts.safe}'i düşük riskli. ${warns ? `${warns} dikkat noktası var.` : "Dikkat noktası yok."}`;
  return `<section class="product-score tone-bg-${known ? statusTone(a.healthStatus) : "unknown"}" aria-label="Sağlık puanı">
    ${scoreRing(a?.healthScore, a?.healthStatus || "unknown", { size: "lg" })}
    <div class="product-score-t">
      <span class="product-kicker">Sağlık puanı</span>
      <strong class="product-verdict">${e(scoreVerdict(a?.healthScore, a?.healthStatus || "unknown"))}</strong>
      <span class="product-score-line">${e(line)}</span>
    </div>
  </section>`;
}

function actionsBlock(p) {
  const fav = isFavorite(p.id);
  const inCompare = getCompareIds().includes(String(p.id));
  return `<div class="product-actions">
    <button type="button" class="product-act" data-act="fav" aria-pressed="${fav}">${icon("heart", { size: 18 })}<span>${fav ? "Favoride" : "Favori"}</span></button>
    <button type="button" class="product-act" data-act="share">${icon("share", { size: 18 })}<span>Paylaş</span></button>
    <button type="button" class="product-act" data-act="compare" aria-pressed="${inCompare}">${icon("compare", { size: 18 })}<span>${inCompare ? "Listede" : "Karşılaştır"}</span></button>
  </div>
  <div class="product-replace" data-replace hidden></div>`;
}

function buyBlock(p) {
  const panel = buyPanel(p);
  return `<aside class="product-side" aria-label="Satın al ve kaydet">
    <div class="product-side-in">
      ${panel || `<p class="muted product-nobuy">Bu ürün için mağaza bağlantısı yok.</p>`}
      ${actionsBlock(p)}
    </div>
  </aside>`;
}

function stickyBar(p, a) {
  const link = primaryBuyLink(p);
  if (!link) return "";
  const fav = isFavorite(p.id);
  return `<div class="product-bar" role="region" aria-label="Hızlı satın al">
    ${scoreRing(a?.healthScore, a?.healthStatus || "unknown", { size: "sm" })}
    <a class="btn btn-primary product-bar-buy" href="${e(link.url)}" target="_blank" rel="${e(LINK_REL)}" data-store="${e(link.store)}" data-product="${e(p.id)}">${icon("bag", { size: 17 })}Satın al<span class="product-bar-store">· ${e(link.name)}</span></a>
    <button type="button" class="product-bar-fav" data-act="fav" aria-pressed="${fav}" aria-label="Favorilere ekle">${icon("heart", { size: 20 })}</button>
  </div>`;
}

function altCard(r) {
  const p = r.product;
  const link = primaryBuyLink(p);
  const title = `${p.brand ? p.brand + " " : ""}${p.name}`;
  return `<li class="product-alt">
    ${productImage(p, { cls: "product-alt-ph" })}
    <div class="product-alt-body">
      ${p.brand ? `<span class="brand-name">${e(p.brand)}</span>` : ""}
      <a class="product-alt-name" href="${productHref(p)}">${e(p.name)}</a>
      <ul class="product-alt-why" role="list">${r.reasons.slice(0, 2).map((t) => `<li>${icon("check", { size: 12 })}${e(t)}</li>`).join("")}</ul>
      <div class="product-alt-row">
        ${scoreRing(r.analysis?.healthScore, r.analysis?.healthStatus, { size: "sm" })}
        ${veganBadge(r.analysis?.veganStatus)}
        ${link ? `<a class="btn btn-primary btn-sm product-alt-buy" href="${e(link.url)}" target="_blank" rel="${e(LINK_REL)}" data-store="${e(link.store)}" data-product="${e(p.id)}" aria-label="${e(title)} — ${e(link.name)} üzerinden satın al">Satın al</a>` : ""}
      </div>
    </div>
  </li>`;
}

async function alternativesFor(p) {
  try {
    let pool;
    if (p.source === "local") pool = getProducts();
    else pool = (await getCatalog()).filter((x) => x.ingredients && x.category === p.category);
    return findAlternatives(p, pool, { limit: 3, analyze: analyzeIngredients, cache: altCache });
  } catch (err) {
    console.warn("Alternatifler hesaplanamadı", err);
    return [];
  }
}

function altBlock(list) {
  if (!list.length) return "";
  return `<section class="product-sec product-alts" aria-labelledby="pa-h">
    <h2 id="pa-h" class="product-h">${icon("sparkle", { size: 18 })}Daha temiz alternatifler</h2>
    <p class="product-sub">Aynı türde, daha yüksek puanlı ürünler.</p>
    <ul class="product-alt-list" role="list">${list.map(altCard).join("")}</ul>
  </section>`;
}

function skeleton() {
  return `<article class="product-page product-skel" aria-busy="true"><span class="visually-hidden">Ürün yükleniyor…</span>
    <div class="product-head"><div class="ph product-ph sk"></div><div class="product-id"><span class="sk sk-s"></span><span class="sk sk-l"></span><span class="sk sk-m"></span></div></div>
    <div class="product-score sk product-sk-block"></div>
    <div class="product-sk-qa"><span class="sk"></span><span class="sk"></span><span class="sk"></span></div>
  </article>`;
}

/* ---------------- route ---------------- */

async function productRoute({ params, el, signal }) {
  const id = params.id;
  if (!getProduct(id)) el.innerHTML = skeleton();
  let p = null;
  try { p = await findProduct(id); } catch { p = null; }
  if (signal.aborted) return;

  if (!p) {
    setTitle("Ürün bulunamadı");
    el.innerHTML = `<section class="product-missing">${emptyState({
      icon: "search",
      title: "Bu ürünü bulamadık",
      level: 1,
      text: "Bağlantı eski olabilir ya da ürün kataloğumuzdan kaldırılmış olabilir. Adıyla ya da markasıyla aramayı dene.",
      action: { href: "#/", label: "Ürün ara" }
    })}</section>`;
    return;
  }

  setTitle(`${p.brand ? p.brand + " " : ""}${p.name}`);
  try { addRecent(p.id); } catch { /* ignore */ }
  const a = getAnalysis(p);
  const items = a?.items || [];
  const bar = stickyBar(p, a);

  el.innerHTML = `<article class="product-page${bar ? " has-bar" : ""}">
    <button type="button" class="product-back" data-act="back">${icon("back", { size: 18 })}Geri</button>
    <div class="product-grid">
      ${headBlock(p)}
      <div class="product-verdict-wrap">${scoreBlock(a)}${quickAnswers(a)}</div>
      ${buyBlock(p)}
      <section class="product-sec" aria-labelledby="ps-h">
        <h2 id="ps-h" class="product-h">Dikkat edilmesi gerekenler${a?.safety?.groups?.length ? ` <span class="count">${a.safety.groups.length}</span>` : ""}</h2>
        ${a && items.length ? safetyList(a.safety) : `<p class="muted">İçerik listesi olmadan uyarı kontrolü yapılamıyor.</p>`}
      </section>
      <section class="product-sec" aria-labelledby="pk-h">
        <h2 id="pk-h" class="product-h">Cilt tipine uygunluk</h2>
        ${skinFit(a?.skinProfile)}
      </section>
      <div class="product-alts-slot" data-alts></div>
      <section class="product-sec" aria-labelledby="pi-h">
        <h2 id="pi-h" class="product-h">İçerikler${items.length ? ` <span class="count">${items.length}</span>` : ""}</h2>
        ${items.length ? `<p class="product-sub">Bir içeriğe dokun: ne işe yaradığını ve risk durumunu gör.</p><div data-ings>${ingredientList(items)}</div>` : `<p class="muted">Bu ürünün içerik listesi henüz yok.</p>`}
      </section>
      <footer class="product-disc">
        <p>${icon("info", { size: 14 })}Puan ve uyarılar içerik listesine dayanır; bilgi amaçlıdır, tıbbi tavsiye değildir.</p>
      </footer>
    </div>
    ${bar}
  </article>`;
  let io = null;
  if (bar) {
    document.body.classList.add("product-bar-on");
    // Hide the fixed bar while the inline buy panel is on screen (no duplicate buttons).
    const barEl = el.querySelector(".product-bar");
    const inline = el.querySelector(".product-side .buy-main");
    if (inline && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([en]) => barEl.classList.toggle("is-hidden", en.isIntersecting), { rootMargin: "0px 0px -150px 0px" });
      io.observe(inline);
    }
  }

  // Alternatives (archive items need the catalog: fill in when ready).
  const slot = el.querySelector("[data-alts]");
  alternativesFor(p).then((list) => {
    if (signal.aborted || !slot.isConnected) return;
    slot.innerHTML = altBlock(list);
  });

  // ---- interactions ----
  const syncFav = () => {
    const on = isFavorite(p.id);
    el.querySelectorAll('[data-act="fav"]').forEach((b) => {
      b.setAttribute("aria-pressed", String(on));
      const label = b.querySelector("span");
      if (label) label.textContent = on ? "Favoride" : "Favori";
      if (b.classList.contains("product-bar-fav")) b.setAttribute("aria-label", on ? "Favorilerden çıkar" : "Favorilere ekle");
    });
  };
  syncFav();

  const setCompareBtn = (on) => {
    const b = el.querySelector('[data-act="compare"]');
    if (!b) return;
    b.setAttribute("aria-pressed", String(on));
    b.querySelector("span").textContent = on ? "Listede" : "Karşılaştır";
  };
  const compareToast = (ids) =>
    toast(
      ids.length >= 2
        ? `Karşılaştırmaya eklendi. <a href="${e(compareHref(ids))}">Karşılaştır (${ids.length})</a>`
        : `Karşılaştırmaya eklendi. İkinci ürünü de ekle. <a href="${e(compareHref(ids))}">Listeyi gör</a>`
    );

  const replaceBox = el.querySelector("[data-replace]");
  async function askReplace(ids) {
    const prods = await Promise.all(ids.map((x) => findProduct(x).catch(() => null)));
    if (signal.aborted) return;
    replaceBox.innerHTML = `<p class="product-replace-t">Karşılaştırmada zaten 2 ürün var. Bu ürün hangisinin yerine geçsin?</p>
      <div class="product-replace-opts">${ids
        .map((x, i) => `<button type="button" class="btn btn-ghost btn-sm product-replace-btn" data-replace-id="${e(x)}">${e(prods[i] ? `${prods[i].brand} ${prods[i].name}` : x)}</button>`)
        .join("")}<button type="button" class="btn btn-quiet btn-sm" data-replace-cancel>Vazgeç</button></div>`;
    replaceBox.hidden = false;
    replaceBox.querySelector("button")?.focus();
  }

  const onClick = async (ev) => {
    const t = ev.target.closest("[data-act], [data-replace-id], [data-replace-cancel]");
    if (!t) return;
    if (t.hasAttribute("data-replace-cancel")) { replaceBox.hidden = true; replaceBox.innerHTML = ""; return; }
    if (t.dataset.replaceId) {
      const ids = replaceInCompare(t.dataset.replaceId, p.id);
      replaceBox.hidden = true; replaceBox.innerHTML = "";
      setCompareBtn(true);
      compareToast(ids);
      return;
    }
    const act = t.dataset.act;
    if (act === "back") back("#/");
    else if (act === "fav") {
      const on = toggleFavorite(p.id);
      syncFav();
      toast(on ? `Favorilere eklendi. <a href="#/favoriler">Favorilerim</a>` : "Favorilerden çıkarıldı.");
    } else if (act === "share") {
      const url = p.source === "local" ? productPageUrl(p.id) : reportUrl(`#/urun/${p.id}`);
      const score = a && a.healthStatus !== "unknown" ? ` — sağlık puanı ${a.healthScore}/100` : "";
      const res = await shareProduct({ title: `${p.brand} ${p.name}`, text: `${p.brand} ${p.name} içerik analizi${score} · MakeYUP`, url });
      if (res === "copied") toast("Bağlantı kopyalandı");
      else if (res === "failed") toast("Paylaşılamadı. Adres çubuğundaki bağlantıyı kopyalayabilirsin.");
    } else if (act === "compare") {
      const r = addToCompare(p.id);
      if (r.status === "full") askReplace(r.ids);
      else if (r.status === "exists") toast(`Bu ürün zaten listede. <a href="${e(compareHref(r.ids))}">Karşılaştır (${r.ids.length})</a>`);
      else { setCompareBtn(true); compareToast(r.ids); }
    }
  };
  el.addEventListener("click", onClick);

  const offFav = onChange(({ type }) => { if (type === "favorites") syncFav(); });

  // CoSIng CAS/EC/function data arrives later: re-render ingredient rows (keeps open rows open).
  const onCosing = () => {
    const box = el.querySelector("[data-ings]");
    if (!box) return;
    const open = [...box.querySelectorAll("details")].map((d) => d.open);
    box.innerHTML = ingredientList(items);
    box.querySelectorAll("details").forEach((d, i) => { if (open[i]) d.open = true; });
  };
  window.addEventListener("makeyup:cosing-ready", onCosing);

  return () => {
    el.removeEventListener("click", onClick);
    window.removeEventListener("makeyup:cosing-ready", onCosing);
    try { offFav?.(); } catch { /* ignore */ }
    io?.disconnect();
    document.body.classList.remove("product-bar-on");
    hideToast();
  };
}

export default {
  routes: {
    "#/urun/:id": productRoute
  }
};
