/**
 * MakeYUP — #/analiz: paste an INCI list, get the report.
 * Also exports renderReport() so the scanner can show an inline report for products
 * that have no id in state (online barcode hits).
 */
import { setTitle } from "../router.js";
import { getProducts, getAnalysis } from "../state.js";
import {
  escapeHtml as e, icon, scoreRing, scoreVerdict, safetyList, skinFit, ingredientList,
  productGrid, sectionHeader, emptyState, buyPanel, productImage
} from "../ui/components.js";
import { analyzeIngredients } from "../analyzer.js";
import { findAlternatives } from "../features/alternatives.js";

const TEXT_KEY = "myup-analyze-text";
const DONE_KEY = "myup-analyze-done";

const PRESETS = [
  {
    id: "serum",
    label: "Nemlendirici serum",
    text: "Aqua, Niacinamide, Glycerin, Sodium Hyaluronate, Panthenol, Allantoin, Centella Asiatica Extract, Xanthan Gum, Phenoxyethanol, Ethylhexylglycerin"
  },
  {
    id: "ruj",
    label: "Karminli ruj",
    text: "Ricinus Communis Seed Oil, Cera Alba, Lanolin, Paraffinum Liquidum, Carmine, CI 77491, Parfum, Propylparaben, Tocopherol"
  },
  {
    id: "krem",
    label: "Retinollü gece kremi",
    text: "Aqua, Cetearyl Alcohol, Dimethicone, Retinol, Glycerin, Parfum, Limonene, Linalool, Methylparaben, Disodium EDTA"
  }
];

/* ---------------- storage (never throws) ---------------- */
const store = {
  get(k) { try { return sessionStorage.getItem(k) || ""; } catch { return ""; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* blocked */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch { /* blocked */ } }
};

/* ---------------- shared report ---------------- */

const uniq = (arr) => [...new Set(arr.filter(Boolean))];
const nameOf = (i) => i.rawName || i.nameTr || i.inci;

/** The 3 yes/no "Hızlı cevaplar" rows for an analysis. */
export function quickAnswers(a) {
  const items = a.items || [];
  const groups = a.safety?.groups || [];

  // Vegan
  let vegan;
  if (a.veganStatus === "vegan") {
    vegan = { tone: "safe", ic: "leaf", ans: "Evet", text: "Hayvansal kaynaklı içerik bulunamadı." };
  } else if (a.veganStatus === "non-vegan") {
    const names = uniq((a.nonVeganIngredients || []).map((i) => i.nameTr || i.inci));
    vegan = { tone: "high", ic: "x", ans: "Hayır", text: `İçerir: ${names.join(", ")}` };
  } else {
    const names = uniq((a.conditionalVeganIngredients || []).map((i) => i.nameTr || i.inci));
    vegan = {
      tone: "mod", ic: "info", ans: "Kontrol et",
      text: names.length ? `Kaynağı belirsiz: ${names.join(", ")}. Ambalajda vegan logosu ara.` : "Veganlık doğrulanamadı."
    };
  }

  // Pregnancy
  const avoid = groups.find((g) => g.key === "pregAvoid");
  const caution = groups.find((g) => g.key === "pregCaution");
  let preg;
  if (avoid) preg = { tone: "high", ic: "x", ans: "Önerilmez", text: `Kaçınılmalı: ${avoid.names.join(", ")}` };
  else if (caution) preg = { tone: "mod", ic: "alert", ans: "Doktora danış", text: `Dikkat: ${caution.names.join(", ")}` };
  else preg = { tone: "safe", ic: "check", ans: "Uyarı yok", text: "Hamilelikte bilinen bir uyarı taşıyan madde yok." };

  // Fragrance / allergens
  const fr = uniq(
    items
      .filter((i) => (i.known && (i.inci === "Parfum" || (i.tags || []).includes("Koku Alerjeni"))) || i.flags?.allergen)
      .map(nameOf)
  );
  const parfum = fr.length
    ? { tone: "mod", ic: "alert", ans: "İçerir", text: fr.join(", ") }
    : { tone: "safe", ic: "check", ans: "Yok", text: "Parfüm ya da etiket zorunlu koku alerjeni bulunmadı." };

  const row = (q, r) => `<li class="analyze-qa qa-${r.tone}">
      <span class="analyze-qa-ic">${icon(r.ic, { size: 16 })}</span>
      <span class="analyze-qa-t"><span class="analyze-qa-q">${e(q)}</span><b>${e(r.ans)}</b><span class="analyze-qa-d">${e(r.text)}</span></span>
    </li>`;
  return `<ul class="analyze-qas" role="list">${row("Vegan mı?", vegan)}${row("Hamilelikte uygun mu?", preg)}${row("Parfüm / alerjen?", parfum)}</ul>`;
}

/**
 * Full report card (score + quick answers + optional buy panel + warnings + skin fit + ingredients).
 * opts: { product, headingId, title }
 */
export function renderReport(a, { product = null, headingId = "analyzeReportTitle", title = "Analiz sonucu" } = {}) {
  const c = a.counts || {};
  const low = c.safe || 0;
  const warnCount = a.safety?.groups?.length || 0;
  const summary = `${c.total || 0} içerikten ${low} tanesi düşük riskli. ${
    warnCount ? `${warnCount} dikkat noktası var.` : "Önemli bir uyarı yok."
  }`;
  const prod = product
    ? `<div class="analyze-prod">${productImage(product, { cls: "analyze-prod-ph", eager: true })}<div>${
        product.brand ? `<div class="brand-name">${e(product.brand)}</div>` : ""
      }<h2 class="analyze-prod-n" id="${e(headingId)}" tabindex="-1">${e(product.name)}</h2>${
        product.gtin ? `<span class="muted analyze-prod-code">Barkod ${e(product.gtin)}</span>` : ""
      }</div></div>`
    : `<h2 class="analyze-rep-title" id="${e(headingId)}" tabindex="-1">${e(title)}</h2>`;

  return `<article class="analyze-report panel">
    <div class="analyze-rep-head">
      ${prod}
      <div class="analyze-score">
        ${scoreRing(a.healthScore, a.healthStatus, { size: "lg" })}
        <div><div class="analyze-lbl">Sağlık puanı</div><div class="analyze-verdict">${e(scoreVerdict(a.healthScore, a.healthStatus))}</div><p>${e(summary)}</p></div>
      </div>
      <h3 class="analyze-h">Hızlı cevaplar</h3>
      ${quickAnswers(a)}
      ${product ? buyPanel(product) : ""}
    </div>
    <div class="analyze-rep-body">
      <section><h3 class="analyze-h">Dikkat edilmesi gerekenler ${warnCount ? `<span class="count">${warnCount}</span>` : ""}</h3>${safetyList(a.safety)}</section>
      <section><details class="analyze-skin"><summary><span>Cilt tipine uygunluk</span>${icon("chevron", { size: 16 })}</summary>${skinFit(a.skinProfile)}</details></section>
      <section><h3 class="analyze-h">İçerikler <span class="count">${c.total || 0}</span></h3>${ingredientList(a.items)}</section>
    </div>
  </article>`;
}

/* ---------------- alternatives ---------------- */

const altCache = new Map();
const knownSet = (a) => new Set((a?.items || []).filter((i) => i.known).map((i) => String(i.inci).toLowerCase()));

/** Guesses a category by ingredient overlap, then runs findAlternatives. Honest fallback otherwise. */
function alternativesFor(text, a) {
  const products = getProducts();
  const mine = knownSet(a);
  let best = null;
  let bestSim = 0;
  if (mine.size >= 3) {
    for (const p of products) {
      const theirs = knownSet(p.analysis);
      if (!theirs.size) continue;
      let inter = 0;
      for (const x of mine) if (theirs.has(x)) inter++;
      const sim = inter / (mine.size + theirs.size - inter);
      if (sim > bestSim) { bestSim = sim; best = p; }
    }
  }
  if (best && bestSim >= 0.25) {
    const base = { id: "__analiz", brand: "", name: "Yapıştırılan liste", category: best.category, categoryLabel: best.categoryLabel, ingredients: text };
    let alts = [];
    try {
      alts = findAlternatives(base, products, {
        limit: 3, fillFromGroup: true, cache: altCache,
        analyze: (ings) => analyzeIngredients(ings)
      });
    } catch (err) { console.warn(err); }
    const kind = String(best.categoryLabel || "").split("·").pop().trim();
    return { list: alts.map((x) => x.product), note: `Listen en çok ${kind.toLocaleLowerCase("tr")} ürünlerine benziyor; aynı gruptan puanı daha yüksek olanlar:` };
  }
  const score = typeof a.healthScore === "number" ? a.healthScore : 0;
  const list = products
    .filter((p) => p.analysis?.healthStatus === "healthy" && p.analysis.healthScore > score)
    .sort((x, y) => y.analysis.healthScore - x.analysis.healthScore)
    .slice(0, 3);
  return { list, note: "Ürün türünü tahmin edemedik; puanı bu listeden yüksek olan ürünleri gösteriyoruz." };
}

/* ---------------- view ---------------- */

function resultHtml(text) {
  const a = getAnalysis(text);
  if (!a || !a.counts?.total) {
    return emptyState({ icon: "flask", title: "İçerik bulunamadı", text: "Listeyi virgülle ayrılmış şekilde yapıştır (ör. Aqua, Glycerin, Parfum)." });
  }
  if (a.healthStatus === "unknown") {
    return `<div class="panel">${emptyState({
      icon: "info", title: "Bu içerikleri tanıyamadık",
      text: "Listedeki maddeler veritabanımızla eşleşmedi. Yazımı ürün ambalajındaki INCI listesiyle karşılaştır."
    })}${ingredientList(a.items, { glossaryLink: false })}</div>`;
  }
  const alt = alternativesFor(text, a);
  const alts = alt.list.length
    ? `<p class="analyze-alt-note">${e(alt.note)}</p>${productGrid(alt.list)}`
    : `<p class="analyze-alt-note">Bu listeden daha temiz, benzer bir ürün bulamadık. Bu iyi bir işaret.</p>`;
  return `${renderReport(a)}
    <section class="analyze-alts">${sectionHeader("Bu içeriğe benzer daha temiz ürünler")}${alts}</section>`;
}

function analyzeHandler({ el, isBack }) {
  setTitle("İçerik analizi");
  const saved = store.get(TEXT_KEY);
  el.innerHTML = `<section class="analyze-page">
    <header class="page-head">
      <div class="eyebrow">İçerik analizi</div>
      <h1>İçerik listesini yapıştır</h1>
      <p>Ambalajın arkasındaki INCI listesini kopyala, buraya yapıştır. Puanı, vegan durumunu ve uyarıları hemen gör.</p>
    </header>
    <form class="analyze-form panel" novalidate>
      <label class="analyze-label" for="analyzeInput">İçerik (INCI) listesi</label>
      <textarea id="analyzeInput" class="analyze-input" rows="6" spellcheck="false" autocapitalize="off" autocomplete="off"
        placeholder="Örn: Aqua, Glycerin, Niacinamide, Parfum, Phenoxyethanol" aria-describedby="analyzeMsg">${e(saved)}</textarea>
      <p id="analyzeMsg" class="analyze-msg" role="alert" hidden></p>
      <div class="analyze-actions">
        <button type="submit" class="btn btn-primary btn-lg analyze-go">${icon("flask", { size: 17 })}Analiz et</button>
        <button type="button" class="btn btn-ghost analyze-clear" data-clear>Temizle</button>
      </div>
      <div class="analyze-presets">
        <span class="analyze-presets-l">Örnek dene:</span>
        ${PRESETS.map((p) => `<button type="button" class="chip analyze-preset" data-preset="${e(p.id)}">${e(p.label)}</button>`).join("")}
      </div>
    </form>
    <div id="analyzeResult" class="analyze-result" aria-live="polite"></div>
  </section>`;

  const form = el.querySelector(".analyze-form");
  const input = el.querySelector("#analyzeInput");
  const msg = el.querySelector("#analyzeMsg");
  const out = el.querySelector("#analyzeResult");

  const showMsg = (t) => { msg.textContent = t; msg.hidden = !t; input.toggleAttribute("aria-invalid", !!t); };

  const run = ({ scroll = true } = {}) => {
    const text = input.value.trim();
    if (!text) {
      showMsg("Önce bir içerik listesi yapıştır ya da aşağıdaki örneklerden birini seç.");
      out.innerHTML = "";
      store.del(DONE_KEY);
      input.focus();
      return;
    }
    showMsg("");
    store.set(TEXT_KEY, input.value);
    store.set(DONE_KEY, "1");
    out.innerHTML = resultHtml(text);
    if (scroll) {
      const target = out.querySelector("#analyzeReportTitle") || out.firstElementChild;
      requestAnimationFrame(() => {
        out.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        target?.focus?.({ preventScroll: true });
      });
    }
  };

  form.addEventListener("submit", (ev) => { ev.preventDefault(); run(); });
  input.addEventListener("input", () => { store.set(TEXT_KEY, input.value); if (!msg.hidden) showMsg(""); });
  el.querySelector("[data-clear]").addEventListener("click", () => {
    input.value = "";
    out.innerHTML = "";
    showMsg("");
    store.del(TEXT_KEY);
    store.del(DONE_KEY);
    input.focus();
  });
  el.querySelector(".analyze-presets").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-preset]");
    if (!b) return;
    const p = PRESETS.find((x) => x.id === b.dataset.preset);
    if (!p) return;
    input.value = p.text;
    run();
  });

  // Restore the previous result (Back / revisit). No auto-scroll: the router restores scroll.
  if (saved.trim() && store.get(DONE_KEY)) run({ scroll: false });

  const onCosing = () => { if (out.innerHTML && input.value.trim() && store.get(DONE_KEY)) out.innerHTML = resultHtml(input.value.trim()); };
  window.addEventListener("makeyup:cosing-ready", onCosing);
  return () => window.removeEventListener("makeyup:cosing-ready", onCosing);
}

export default {
  routes: { "#/analiz": analyzeHandler }
};
