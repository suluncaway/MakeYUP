/**
 * MakeYUP — Ana Uygulama Kontrolcüsü (Marka Marka Katalog + Analizör + Sözlük)
 */

import { BRANDS_DATA } from "./data/brands.js";
import { PRODUCTS_DATA } from "./data/products.js";
import { INGREDIENTS_DB } from "./data/ingredients.js";
import { analyzeIngredients } from "./analyzer.js";
import {
  SAMPLE_BARCODES,
  BarcodeScannerController,
  fetchProductByBarcode,
  scanBarcodeFromImageFile
} from "./barcode.js";
import {
  GLOBAL_BRANDS,
  GLOBAL_CATEGORIES,
  searchGlobalProducts
} from "./globalApi.js";

// ============================================================
// Yardımcı Fonksiyonlar
// ============================================================
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getScoreColorVar(score, status) {
  if (status === "unknown") return "var(--unknown)";
  if (score >= 78) return "var(--safe)";
  if (score >= 52) return "var(--moderate)";
  return "var(--high)";
}

function renderMiniRing(score, status) {
  const size = 34;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  const color = getScoreColorVar(score, status);

  return `
    <div class="score-ring" style="width:${size}px;height:${size}px;" aria-hidden="true">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="score-ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"></circle>
        <circle class="score-ring-progress" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"
          stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"></circle>
      </svg>
    </div>
  `;
}

function renderLargeRing(score, status) {
  const size = 104;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  const color = getScoreColorVar(score, status);

  return `
    <div class="score-ring" style="width:${size}px;height:${size}px;" role="img" aria-label="Sağlık skoru 100 üzerinden ${score}">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="score-ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"></circle>
        <circle class="score-ring-progress" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"
          stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="score-ring-value">
        <strong style="color:${color}">${status === "unknown" ? "?" : score}</strong>
        <span>/ 100</span>
      </div>
    </div>
  `;
}

function renderVeganTag(veganStatus, veganLabel) {
  if (veganStatus === "vegan") {
    return `
      <span class="tag tag-vegan">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M16.5 3.5c-5.5 0-10 2.5-12 7.5-.7 1.7-.9 3.6-.7 5.5 1.9.2 3.8 0 5.5-.7 5-2 7.5-6.5 7.2-12.3zm-8.6 9.8c-.4.4-1 .4-1.4 0s-.4-1 0-1.4l4.5-4.5c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-4.5 4.5z"/></svg>
        ${escapeHtml(veganLabel)}
      </span>
    `;
  }
  if (veganStatus === "non-vegan") {
    return `
      <span class="tag tag-nonvegan">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/></svg>
        ${escapeHtml(veganLabel)}
      </span>
    `;
  }
  return `<span class="tag tag-check">⚠ ${escapeHtml(veganLabel)}</span>`;
}

function renderRiskBar(analysis) {
  const { percentages, counts } = analysis;
  return `
    <div class="risk-bar-wrap">
      <div class="risk-bar-header">
        <span>İçerik Risk Dağılımı (${counts.total} bileşen)</span>
        <span>${percentages.safe}% Güvenli</span>
      </div>
      <div class="risk-bar" role="img" aria-label="Güvenli %${percentages.safe}, Orta %${percentages.moderate}, Riskli %${percentages.high}">
        ${percentages.safe > 0 ? `<div class="risk-seg-safe" style="width:${percentages.safe}%" title="Güvenli: ${counts.safe}"></div>` : ""}
        ${percentages.moderate > 0 ? `<div class="risk-seg-moderate" style="width:${percentages.moderate}%" title="Orta Risk: ${counts.moderate}"></div>` : ""}
        ${percentages.high > 0 ? `<div class="risk-seg-high" style="width:${percentages.high}%" title="Yüksek Risk: ${counts.high}"></div>` : ""}
        ${percentages.unknown > 0 ? `<div class="risk-seg-unknown" style="width:${percentages.unknown}%" title="Tanınmayan: ${counts.unknown}"></div>` : ""}
      </div>
    </div>
  `;
}

function renderIngredientCard(item) {
  const riskLabelMap = {
    safe: { text: "Güvenli", cls: "tag-safe" },
    moderate: { text: "Orta Risk", cls: "tag-moderate" },
    high: { text: "Yüksek Risk", cls: "tag-high" },
    unknown: { text: "İncelenmedi", cls: "tag-unknown" }
  };
  const rInfo = riskLabelMap[item.risk] || riskLabelMap.unknown;

  let veganBadge = "";
  if (item.vegan === true) {
    veganBadge = `<span class="tag tag-vegan">🌱 Vegan</span>`;
  } else if (item.vegan === false) {
    veganBadge = `<span class="tag tag-nonvegan">🐝 Hayvansal</span>`;
  } else if (item.vegan === "conditional") {
    veganBadge = `<span class="tag tag-check">? Kaynak Kontrolü</span>`;
  }

  return `
    <article class="inci-item risk-${escapeHtml(item.risk)}">
      <div class="inci-item-top">
        <div class="inci-names">
          <strong>${escapeHtml(item.nameTr)}</strong>
          <span>${escapeHtml(item.inci)} · ${escapeHtml(item.category)}</span>
        </div>
        <div class="inci-badges">
          <span class="tag ${rInfo.cls}">${rInfo.text}</span>
          ${veganBadge}
        </div>
      </div>
      <p class="inci-summary">${escapeHtml(item.summaryTr)}</p>
      ${item.animalSource ? `<p class="inci-animal-note">Hayvansal Kaynak Bilgisi: ${escapeHtml(item.animalSource)}</p>` : ""}
    </article>
  `;
}

function renderAnalysisReport(analysis, options = {}) {
  const { product = null, filter = "all", containerPrefix = "report" } = options;

  const statusTagClass =
    analysis.healthStatus === "healthy"
      ? "tag-safe"
      : analysis.healthStatus === "moderate"
      ? "tag-moderate"
      : analysis.healthStatus === "risky"
      ? "tag-high"
      : "tag-unknown";

  const veganBoxClass =
    analysis.veganStatus === "vegan"
      ? "is-vegan"
      : analysis.veganStatus === "non-vegan"
      ? "is-nonvegan"
      : "is-check";

  const veganIcon =
    analysis.veganStatus === "vegan"
      ? "🌱"
      : analysis.veganStatus === "non-vegan"
      ? "🐝"
      : "🔎";

  const filteredItems = analysis.items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "non-vegan") return item.vegan === false;
    return item.risk === filter;
  });

  return `
    <div class="report-hero ${product ? "report-hero-with-photo" : ""}">
      ${product ? `<img class="report-thumb" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />` : ""}
      ${renderLargeRing(analysis.healthScore, analysis.healthStatus)}
      <div class="report-verdict">
        <span class="tag ${statusTagClass}">${escapeHtml(analysis.healthLabel)}</span>
        ${product && product.crueltyFree ? `<span class="tag tag-neutral" style="margin-left:0.35rem;">🐰 Cruelty-Free</span>` : ""}
        <h3>${product ? escapeHtml(product.brand + " — " + product.name) : "İçerik Analiz Özeti"}</h3>
        <p>${escapeHtml(product ? product.description : analysis.healthSummary)}</p>
      </div>
    </div>

    <div class="vegan-callout ${veganBoxClass}">
      <span class="vegan-callout-icon" aria-hidden="true">${veganIcon}</span>
      <div>
        <strong>Vegan Durumu: ${escapeHtml(analysis.veganLabel)}</strong>
        <p>${escapeHtml(analysis.veganExplanation)}</p>
      </div>
    </div>

    ${renderRiskBar(analysis)}

    <div class="stats-strip">
      <div class="stat-box stat-safe">
        <strong>${analysis.counts.safe}</strong>
        <span>Güvenli Madde</span>
      </div>
      <div class="stat-box stat-moderate">
        <strong>${analysis.counts.moderate}</strong>
        <span>Orta Riskli</span>
      </div>
      <div class="stat-box stat-high">
        <strong>${analysis.counts.high}</strong>
        <span>Yüksek Riskli</span>
      </div>
    </div>

    <div class="inci-list-header">
      <h4>Detaylı İçerik Listesi (${filteredItems.length} / ${analysis.counts.total})</h4>
      <div class="filter-group" data-report-filter-group="${escapeHtml(containerPrefix)}">
        <button type="button" class="chip chip-sm ${filter === "all" ? "is-active" : ""}" data-inci-filter="all">Tümü</button>
        <button type="button" class="chip chip-sm ${filter === "high" ? "is-active" : ""}" data-inci-filter="high">Riskli (${analysis.counts.high})</button>
        <button type="button" class="chip chip-sm ${filter === "moderate" ? "is-active" : ""}" data-inci-filter="moderate">Orta (${analysis.counts.moderate})</button>
        <button type="button" class="chip chip-sm ${filter === "safe" ? "is-active" : ""}" data-inci-filter="safe">Güvenli (${analysis.counts.safe})</button>
        ${analysis.nonVeganIngredients.length > 0 ? `<button type="button" class="chip chip-sm ${filter === "non-vegan" ? "is-active" : ""}" data-inci-filter="non-vegan">Hayvansal (${analysis.nonVeganIngredients.length})</button>` : ""}
      </div>
    </div>

    <div class="inci-cards">
      ${
        filteredItems.length > 0
          ? filteredItems.map(renderIngredientCard).join("")
          : `<div class="empty-state" style="padding:1.4rem;"><p>Bu filtreye uygun bileşen bulunamadı.</p></div>`
      }
    </div>
  `;
}

// ============================================================
// Zenginleştirilmiş Ürün & Marka Verisi
// ============================================================
const enrichedProducts = PRODUCTS_DATA.map((product) => ({
  ...product,
  analysis: analyzeIngredients(product.ingredients)
}));

// Hem yerel hem de Open Beauty Facts canlı ürünlerini tutan ortak kayıt defteri
const productRegistry = new Map(enrichedProducts.map((p) => [p.id, p]));

const enrichedBrands = BRANDS_DATA.map((brand) => {
  const brandProducts = enrichedProducts.filter((p) => p.brandId === brand.id);
  const avgScore = brandProducts.length
    ? Math.round(brandProducts.reduce((sum, p) => sum + p.analysis.healthScore, 0) / brandProducts.length)
    : 0;
  const veganCount = brandProducts.filter((p) => p.analysis.veganStatus === "vegan").length;
  const healthyCount = brandProducts.filter((p) => p.analysis.healthStatus === "healthy").length;

  return {
    ...brand,
    products: brandProducts,
    avgScore,
    veganCount,
    healthyCount,
    totalProducts: brandProducts.length
  };
});

const brandMap = Object.fromEntries(enrichedBrands.map((b) => [b.id, b]));

// ============================================================
// Uygulama Durumu (State)
// ============================================================
const state = {
  activeView: "global",
  selectedBrand: "all",
  groupByBrand: true,
  catalogSearch: "",
  catalogCategory: "all",
  onlyVegan: false,
  onlyHealthy: false,
  onlyCrueltyFree: false,
  compareIds: [],
  glossarySearch: "",
  glossaryFilter: "all",
  activeModalProduct: null,
  activeModalInciFilter: "all",
  lastAnalyzerResult: null,
  lastAnalyzerFilter: "all",
  lastScanProduct: null,
  lastScanAnalysis: null,
  lastScanFilter: "all",
  // Küresel canlı katalog durumu
  globalQuery: "",
  globalBrand: "",
  globalCategoryId: "all",
  globalGroupByBrand: true,
  globalOnlyWithInci: true,
  globalOnlyVegan: false,
  globalPage: 1,
  globalTotalCount: 0,
  globalHasMore: false,
  globalLoading: false,
  globalItems: []
};

const INCI_PRESETS = {
  "clean-vegan":
    "Aqua, Squalane, Niacinamide, Sodium Hyaluronate, Panthenol, Centella Asiatica Extract, Simmondsia Chinensis Seed Oil, Titanium Dioxide, Iron Oxides, Tocopherol, Ethylhexylglycerin",
  "carmine-lip":
    "Ricinus Communis Seed Oil, Cera Alba, Lanolin, Dimethicone, Carmine, Iron Oxides, Parfum, Limonene, BHT, Propylparaben",
  "risky-palette":
    "Talc, Mica, Mineral Oil, Dimethicone, Carmine, Guanine, Methylparaben, Propylparaben, DMDM Hydantoin, Parfum"
};

// ============================================================
// DOM Referansları
// ============================================================
const brandFilterStripEl = document.getElementById("brandFilterStrip");
const groupByBrandBtn = document.getElementById("groupByBrandBtn");

const globalBrandsStripEl = document.getElementById("globalBrandsStrip");
const globalCategoriesStripEl = document.getElementById("globalCategoriesStrip");
const globalSearchFormEl = document.getElementById("globalSearchForm");
const globalSearchInputEl = document.getElementById("globalSearchInput");
const globalGroupByBrandBtn = document.getElementById("globalGroupByBrandBtn");
const globalOnlyWithInciBtn = document.getElementById("globalOnlyWithInciBtn");
const globalOnlyVeganBtn = document.getElementById("globalOnlyVeganBtn");
const globalCountEl = document.getElementById("globalCount");
const globalResultsContainerEl = document.getElementById("globalResultsContainer");
const globalLoadMoreWrapEl = document.getElementById("globalLoadMoreWrap");
const globalLoadMoreBtn = document.getElementById("globalLoadMoreBtn");
const productGridEl = document.getElementById("productGrid");
const catalogCountEl = document.getElementById("catalogCount");
const catalogSearchEl = document.getElementById("catalogSearch");
const filterVeganBtn = document.getElementById("filterVeganBtn");
const filterHealthyBtn = document.getElementById("filterHealthyBtn");
const filterCrueltyBtn = document.getElementById("filterCrueltyBtn");

const brandsDirectoryGridEl = document.getElementById("brandsDirectoryGrid");
const brandsCountEl = document.getElementById("brandsCount");

const inciTextareaEl = document.getElementById("inciTextarea");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearAnalyzerBtn = document.getElementById("clearAnalyzerBtn");
const analyzerResultEl = document.getElementById("analyzerResult");

const scannerViewportEl = document.getElementById("scannerViewport");
const scannerVideoEl = document.getElementById("scannerVideo");
const scannerReticleEl = document.getElementById("scannerReticle");
const scannerStatusEl = document.getElementById("scannerStatus");
const startCameraBtn = document.getElementById("startCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const barcodeFileInputEl = document.getElementById("barcodeFileInput");
const barcodeManualFormEl = document.getElementById("barcodeManualForm");
const barcodeInputEl = document.getElementById("barcodeInput");
const sampleBarcodesWrapEl = document.getElementById("sampleBarcodesWrap");
const scannerResultEl = document.getElementById("scannerResult");

const glossaryGridEl = document.getElementById("glossaryGrid");
const glossaryCountEl = document.getElementById("glossaryCount");
const glossarySearchEl = document.getElementById("glossarySearch");

const productDialog = document.getElementById("productDialog");
const modalProductCategory = document.getElementById("modalProductCategory");
const modalProductTitle = document.getElementById("modalProductTitle");
const modalProductBody = document.getElementById("modalProductBody");

const compareDialog = document.getElementById("compareDialog");
const compareOpenBtn = document.getElementById("compareOpenBtn");
const compareCountEl = document.getElementById("compareCount");
const compareBody = document.getElementById("compareBody");
const clearCompareBtn = document.getElementById("clearCompareBtn");

const themeToggleBtn = document.getElementById("themeToggle");

// ============================================================
// Marka Seçici Şeridi & Ürün Kartı Render
// ============================================================
function renderBrandStrip() {
  const allPill = `
    <button type="button" class="brand-pill ${state.selectedBrand === "all" ? "is-active" : ""}" data-select-brand="all">
      <span class="brand-pill-mono" style="background:var(--accent);">ALL</span>
      <span>Tüm Markalar</span>
      <span class="brand-pill-count">(${enrichedProducts.length})</span>
    </button>
  `;

  const brandPills = enrichedBrands
    .map(
      (b) => `
      <button type="button" class="brand-pill ${state.selectedBrand === b.id ? "is-active" : ""}" data-select-brand="${escapeHtml(b.id)}">
        <span class="brand-pill-mono" style="background:${escapeHtml(b.accentColor)};">${escapeHtml(b.monogram)}</span>
        <span>${escapeHtml(b.name)}</span>
        <span class="brand-pill-count">(${b.totalProducts})</span>
      </button>
    `
    )
    .join("");

  brandFilterStripEl.innerHTML = allPill + brandPills;
}

function renderProductCard(p) {
  const { analysis } = p;
  const isCompared = state.compareIds.includes(p.id);
  const scoreColor = getScoreColorVar(analysis.healthScore, analysis.healthStatus);

  const highlightPills = analysis.highlights
    .slice(0, 2)
    .map((h) => {
      const cls =
        h.type === "positive"
          ? "tag-safe"
          : h.type === "vegan"
          ? "tag-vegan"
          : h.type === "nonvegan"
          ? "tag-nonvegan"
          : h.type === "danger"
          ? "tag-high"
          : "tag-moderate";
      return `<span class="tag ${cls}">${escapeHtml(h.text)}</span>`;
    })
    .join("");

  return `
    <article class="product-card">
      <div class="card-media">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.brand + " " + p.name)}" loading="lazy" />
        <div class="card-overlay-top">
          <div class="card-score-badge">
            ${renderMiniRing(analysis.healthScore, analysis.healthStatus)}
            <div class="score-mini-text">
              <span class="score-mini-num" style="color:${scoreColor}">${analysis.healthScore}/100</span>
              <span class="score-mini-label">${escapeHtml(analysis.healthLabel)}</span>
            </div>
          </div>
          ${renderVeganTag(analysis.veganStatus, analysis.veganLabel)}
        </div>
      </div>

      <div class="card-body">
        <div>
          <div class="card-meta-row">
            <span>${escapeHtml(p.brand)} · ${escapeHtml(p.categoryLabel)}</span>
            ${p.crueltyFree ? `<span>🐰 Cruelty-Free</span>` : ""}
          </div>
          <h4 class="card-title">${escapeHtml(p.name)}</h4>
          <p class="card-desc">${escapeHtml(p.description)}</p>
        </div>

        ${renderRiskBar(analysis)}

        <div class="card-highlights">${highlightPills}</div>

        <div class="card-actions">
          <button type="button" class="btn btn-primary btn-sm" data-open-product="${escapeHtml(p.id)}">
            İçeriği Görsel İncele
          </button>
          <button
            type="button"
            class="btn btn-outline btn-sm btn-compare ${isCompared ? "is-selected" : ""}"
            data-toggle-compare="${escapeHtml(p.id)}"
            aria-pressed="${isCompared}"
          >
            ${isCompared ? "✓ Seçildi" : "Karşılaştır"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderCatalog() {
  const q = state.catalogSearch.trim().toLowerCase();

  const filtered = enrichedProducts.filter((p) => {
    if (state.selectedBrand !== "all" && p.brandId !== state.selectedBrand) return false;
    if (state.catalogCategory !== "all" && p.category !== state.catalogCategory) return false;
    if (state.onlyVegan && p.analysis.veganStatus !== "vegan") return false;
    if (state.onlyHealthy && p.analysis.healthStatus !== "healthy") return false;
    if (state.onlyCrueltyFree && !p.crueltyFree) return false;

    if (q) {
      const haystack = [
        p.name,
        p.brand,
        p.categoryLabel,
        p.description,
        ...p.ingredients,
        ...p.analysis.items.map((i) => i.nameTr)
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  catalogCountEl.textContent = `${filtered.length} ürün gösteriliyor`;

  if (filtered.length === 0) {
    productGridEl.innerHTML = `
      <div class="empty-state" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);">
        <div class="empty-icon" aria-hidden="true">🔍</div>
        <h3>Aradığınız kriterde ürün bulunamadı</h3>
        <p>Filtreleri gevşetebilir veya aradığınız ürünün içerik listesini <strong>İçerik Analizörü</strong> sekmesinde kendiniz test edebilirsiniz.</p>
      </div>
    `;
    return;
  }

  // Marka Marka Gruplu Görünüm
  if (state.groupByBrand) {
    const groupedIds = [...new Set(filtered.map((p) => p.brandId))];
    productGridEl.innerHTML = groupedIds
      .map((brandId) => {
        const brand = brandMap[brandId];
        const items = filtered.filter((p) => p.brandId === brandId);
        const avg = Math.round(items.reduce((s, x) => s + x.analysis.healthScore, 0) / items.length);
        const avgColor = getScoreColorVar(avg, "ok");
        const veganBadgeCls =
          brand.brandVeganPolicy === "full"
            ? "tag-vegan"
            : brand.brandVeganPolicy === "partial"
            ? "tag-safe"
            : "tag-check";

        return `
          <section class="brand-section" aria-label="${escapeHtml(brand.name)} ürünleri">
            <div class="brand-section-header">
              <div class="brand-section-identity">
                <div class="brand-avatar" style="background:${escapeHtml(brand.accentColor)};">
                  ${escapeHtml(brand.monogram)}
                </div>
                <div>
                  <h3>${escapeHtml(brand.name)}</h3>
                  <p>${escapeHtml(brand.tagline)}</p>
                </div>
              </div>

              <div class="brand-section-metrics">
                <div class="brand-avg-chip">
                  ${renderMiniRing(avg, "ok")}
                  <span>Marka Ort: <strong style="color:${avgColor}">${avg}/100</strong></span>
                </div>
                <span class="tag ${veganBadgeCls}">${escapeHtml(brand.brandVeganLabel)}</span>
                <span class="tag tag-neutral">${brand.crueltyFree ? "🐰 Cruelty-Free" : "⚠ Hayvan Testi Belirsiz"}</span>
              </div>
            </div>

            <div class="product-grid">
              ${items.map(renderProductCard).join("")}
            </div>
          </section>
        `;
      })
      .join("");
  } else {
    // Düz Grid Görünümü
    productGridEl.innerHTML = `
      <div class="product-grid">
        ${filtered.map(renderProductCard).join("")}
      </div>
    `;
  }
}

// ============================================================
// Markalar Rehberi (Brand Directory)
// ============================================================
function renderBrandsDirectory() {
  brandsCountEl.textContent = `${enrichedBrands.length} marka`;

  brandsDirectoryGridEl.innerHTML = enrichedBrands
    .map((b) => {
      const avgColor = getScoreColorVar(b.avgScore, "ok");
      const veganPolicyTag =
        b.brandVeganPolicy === "full"
          ? `<span class="tag tag-vegan">🌱 ${escapeHtml(b.brandVeganLabel)}</span>`
          : b.brandVeganPolicy === "partial"
          ? `<span class="tag tag-safe">🌿 ${escapeHtml(b.brandVeganLabel)}</span>`
          : `<span class="tag tag-check">⚠ ${escapeHtml(b.brandVeganLabel)}</span>`;

      return `
        <article class="brand-dir-card">
          <div class="brand-dir-top">
            <div class="brand-section-identity">
              <div class="brand-avatar" style="background:${escapeHtml(b.accentColor)};">
                ${escapeHtml(b.monogram)}
              </div>
              <div>
                <h3 style="font-size:1.2rem;">${escapeHtml(b.name)}</h3>
                <span style="font-size:0.78rem;color:var(--text-muted);font-weight:600;">Menşei: ${escapeHtml(b.country)}</span>
              </div>
            </div>
            <div class="brand-avg-chip">
              ${renderMiniRing(b.avgScore, "ok")}
              <strong style="color:${avgColor}">${b.avgScore}/100</strong>
            </div>
          </div>

          <p style="margin:0;font-size:0.86rem;color:var(--text-secondary);">${escapeHtml(b.tagline)}</p>

          <div class="inci-badges">
            ${veganPolicyTag}
            <span class="tag tag-neutral">${b.crueltyFree ? "🐰 Cruelty-Free" : "⚠ Hayvan Testi Belirsiz"}</span>
          </div>

          <div class="brand-dir-stats">
            <div class="stat-box">
              <strong>${b.totalProducts}</strong>
              <span>Analizli Ürün</span>
            </div>
            <div class="stat-box stat-safe">
              <strong>${b.veganCount}/${b.totalProducts}</strong>
              <span>Vegan Ürün</span>
            </div>
            <div class="stat-box">
              <strong>${b.healthyCount}/${b.totalProducts}</strong>
              <span>Temiz Formül</span>
            </div>
          </div>

          <button type="button" class="btn btn-primary btn-sm" data-browse-brand="${escapeHtml(b.id)}">
            ${escapeHtml(b.name)} Ürünlerini İncele →
          </button>
        </article>
      `;
    })
    .join("");
}

// ============================================================
// Ürün Detay Modalı
// ============================================================
function openProductModal(productId) {
  const product = productRegistry.get(productId);
  if (!product) return;

  state.activeModalProduct = product;
  state.activeModalInciFilter = "all";

  modalProductCategory.textContent = `${product.brand} · ${product.categoryLabel}`;
  modalProductTitle.textContent = product.name;
  renderProductModalBody();

  productDialog.showModal();
}

function renderProductModalBody() {
  if (!state.activeModalProduct) return;
  modalProductBody.innerHTML = renderAnalysisReport(state.activeModalProduct.analysis, {
    product: state.activeModalProduct,
    filter: state.activeModalInciFilter,
    containerPrefix: "modal"
  });
}

// ============================================================
// Karşılaştırma Modalı
// ============================================================
function updateCompareButton() {
  const count = state.compareIds.length;
  compareCountEl.textContent = String(count);
  compareOpenBtn.hidden = count === 0;
}

function toggleCompare(productId) {
  const idx = state.compareIds.indexOf(productId);
  if (idx >= 0) {
    state.compareIds.splice(idx, 1);
  } else {
    if (state.compareIds.length >= 2) {
      state.compareIds.shift();
    }
    state.compareIds.push(productId);
  }
  updateCompareButton();
  renderCatalog();
  renderGlobalResults();
}

function openCompareModal() {
  const selected = state.compareIds
    .map((id) => productRegistry.get(id))
    .filter(Boolean);

  if (selected.length < 2) {
    compareBody.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">⚖️</div>
        <h3>Karşılaştırmak için 2 ürün seçin</h3>
        <p>Şu an <strong>${selected.length}</strong> ürün seçili. Katalogdan bir ürün daha seçip yan yana karşılaştırabilirsiniz.</p>
      </div>
    `;
  } else {
    compareBody.innerHTML = `
      <div class="compare-grid">
        ${selected
          .map((p) => {
            const { analysis } = p;
            return `
              <div class="compare-col">
                <div class="compare-head">
                  <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" />
                  <div>
                    <span>${escapeHtml(p.brand)} · ${escapeHtml(p.categoryLabel)}</span>
                    <h3>${escapeHtml(p.name)}</h3>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                  ${renderLargeRing(analysis.healthScore, analysis.healthStatus)}
                  <div style="display:flex;flex-direction:column;gap:0.4rem;">
                    ${renderVeganTag(analysis.veganStatus, analysis.veganLabel)}
                    <span class="tag tag-neutral">${p.crueltyFree ? "🐰 Cruelty-Free" : "Cruelty-Free Belirsiz"}</span>
                  </div>
                </div>
                ${renderRiskBar(analysis)}
                <div class="stats-strip" style="margin:0;">
                  <div class="stat-box stat-safe"><strong>${analysis.counts.safe}</strong><span>Güvenli</span></div>
                  <div class="stat-box stat-moderate"><strong>${analysis.counts.moderate}</strong><span>Orta</span></div>
                  <div class="stat-box stat-high"><strong>${analysis.counts.high}</strong><span>Riskli</span></div>
                </div>
                <p style="margin:0;font-size:0.84rem;color:var(--text-secondary);">
                  <strong>Vegan Notu:</strong> ${escapeHtml(analysis.veganExplanation)}
                </p>
                <div class="card-highlights">
                  ${analysis.highRiskIngredients.length > 0
                    ? analysis.highRiskIngredients.map((i) => `<span class="tag tag-high">⚠ ${escapeHtml(i.nameTr)}</span>`).join("")
                    : `<span class="tag tag-safe">✓ Yüksek riskli madde yok</span>`}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  compareDialog.showModal();
}

// ============================================================
// Canlı INCI Analizörü
// ============================================================
function runLiveAnalyzer() {
  const raw = inciTextareaEl.value.trim();
  if (!raw) {
    state.lastAnalyzerResult = null;
    analyzerResultEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">🧪</div>
        <h3>İçerik Listesi Boş</h3>
        <p>Lütfen analiz etmek için en az bir içerik adı yazın veya yukarıdaki hızlı örneklerden birini seçin.</p>
      </div>
    `;
    return;
  }

  state.lastAnalyzerResult = analyzeIngredients(raw);
  state.lastAnalyzerFilter = "all";
  renderLiveAnalyzerResult();
}

function renderLiveAnalyzerResult() {
  if (!state.lastAnalyzerResult) return;
  analyzerResultEl.innerHTML = renderAnalysisReport(state.lastAnalyzerResult, {
    product: null,
    filter: state.lastAnalyzerFilter,
    containerPrefix: "analyzer"
  });
}

// ============================================================
// Görsel İçerik Sözlüğü
// ============================================================
function renderGlossary() {
  const q = state.glossarySearch.trim().toLowerCase();

  const filtered = INGREDIENTS_DB.filter((item) => {
    if (state.glossaryFilter === "non-vegan" && item.vegan !== false) return false;
    if (["safe", "moderate", "high"].includes(state.glossaryFilter) && item.risk !== state.glossaryFilter) {
      return false;
    }

    if (q) {
      const hay = [item.inci, item.nameTr, item.category, item.summaryTr, ...item.aliases, ...item.tags]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  glossaryCountEl.textContent = `${filtered.length} içerik listeleniyor`;

  if (filtered.length === 0) {
    glossaryGridEl.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);">
        <div class="empty-icon" aria-hidden="true">📖</div>
        <h3>Eşleşen içerik bulunamadı</h3>
        <p>Farklı bir INCI adı veya Türkçe terim deneyebilirsiniz.</p>
      </div>
    `;
    return;
  }

  glossaryGridEl.innerHTML = filtered
    .map((item) => {
      const riskMap = {
        safe: { text: "Güvenli", cls: "tag-safe" },
        moderate: { text: "Orta Risk", cls: "tag-moderate" },
        high: { text: "Yüksek Risk", cls: "tag-high" }
      };
      const rInfo = riskMap[item.risk];

      const veganTag =
        item.vegan === true
          ? `<span class="tag tag-vegan">🌱 Vegan</span>`
          : item.vegan === false
          ? `<span class="tag tag-nonvegan">🐝 Vegan Değil</span>`
          : `<span class="tag tag-check">? Kaynağı Kontrol Et</span>`;

      return `
        <article class="glossary-card">
          <div class="glossary-card-head">
            <div>
              <h3>${escapeHtml(item.nameTr)}</h3>
              <div class="glossary-inci">${escapeHtml(item.inci)} · ${escapeHtml(item.category)}</div>
            </div>
            <span class="tag ${rInfo.cls}">${rInfo.text}</span>
          </div>
          <p class="inci-summary">${escapeHtml(item.summaryTr)}</p>
          ${item.animalSource ? `<p class="inci-animal-note">Kaynak: ${escapeHtml(item.animalSource)}</p>` : ""}
          <div class="inci-badges" style="margin-top:auto;padding-top:0.3rem;">
            ${veganTag}
            ${item.tags.slice(0, 2).map((t) => `<span class="tag tag-neutral">${escapeHtml(t)}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

// ============================================================
// Görünüm Değiştirme (Sekmeler)
// ============================================================
function switchView(viewName) {
  if (state.activeView === "scanner" && viewName !== "scanner") {
    stopScannerUI();
  }
  state.activeView = viewName;

  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === viewName);
  });

  document.querySelectorAll(".view-section").forEach((sec) => {
    const isMatch = sec.id === `view-${viewName}`;
    sec.hidden = !isMatch;
    sec.classList.toggle("is-active", isMatch);
  });
}

// ============================================================
// Tema Yönetimi (Açık / Koyu)
// ============================================================
function initTheme() {
  const saved = localStorage.getItem("makeyup-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");
  document.documentElement.dataset.theme = initial;
}

themeToggleBtn.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("makeyup-theme", next);
});

// ============================================================
// Olay Dinleyicileri (Event Listeners)
// ============================================================
document.querySelectorAll(".nav-tab").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

document.querySelectorAll("[data-jump]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.jump;
    switchView(target);
    const el = document.getElementById(`view-${target}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

brandFilterStripEl.addEventListener("click", (e) => {
  const pill = e.target.closest("[data-select-brand]");
  if (!pill) return;
  state.selectedBrand = pill.dataset.selectBrand;
  renderBrandStrip();
  renderCatalog();
});

groupByBrandBtn.addEventListener("click", () => {
  state.groupByBrand = !state.groupByBrand;
  groupByBrandBtn.setAttribute("aria-pressed", String(state.groupByBrand));
  renderCatalog();
});

brandsDirectoryGridEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-browse-brand]");
  if (!btn) return;
  state.selectedBrand = btn.dataset.browseBrand;
  state.groupByBrand = true;
  groupByBrandBtn.setAttribute("aria-pressed", "true");
  switchView("catalog");
  renderBrandStrip();
  renderCatalog();
  document.getElementById("view-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

catalogSearchEl.addEventListener("input", (e) => {
  state.catalogSearch = e.target.value;
  renderCatalog();
});

document.querySelectorAll("[data-filter-category]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.catalogCategory = btn.dataset.filterCategory;
    document.querySelectorAll("[data-filter-category]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
    renderCatalog();
  });
});

filterVeganBtn.addEventListener("click", () => {
  state.onlyVegan = !state.onlyVegan;
  filterVeganBtn.setAttribute("aria-pressed", String(state.onlyVegan));
  renderCatalog();
});

filterHealthyBtn.addEventListener("click", () => {
  state.onlyHealthy = !state.onlyHealthy;
  filterHealthyBtn.setAttribute("aria-pressed", String(state.onlyHealthy));
  renderCatalog();
});

filterCrueltyBtn.addEventListener("click", () => {
  state.onlyCrueltyFree = !state.onlyCrueltyFree;
  filterCrueltyBtn.setAttribute("aria-pressed", String(state.onlyCrueltyFree));
  renderCatalog();
});

productGridEl.addEventListener("click", (e) => {
  const openBtn = e.target.closest("[data-open-product]");
  if (openBtn) {
    openProductModal(openBtn.dataset.openProduct);
    return;
  }
  const cmpBtn = e.target.closest("[data-toggle-compare]");
  if (cmpBtn) {
    toggleCompare(cmpBtn.dataset.toggleCompare);
  }
});

// Modal & Analizör içi içerik filtreleri (Event Delegation)
document.addEventListener("click", (e) => {
  const filterBtn = e.target.closest("[data-inci-filter]");
  if (filterBtn) {
    const group = filterBtn.closest("[data-report-filter-group]");
    const prefix = group?.dataset.reportFilterGroup;
    const nextFilter = filterBtn.dataset.inciFilter;
    if (prefix === "modal") {
      state.activeModalInciFilter = nextFilter;
      renderProductModalBody();
    } else if (prefix === "analyzer") {
      state.lastAnalyzerFilter = nextFilter;
      renderLiveAnalyzerResult();
    } else if (prefix === "scanner") {
      state.lastScanFilter = nextFilter;
      renderScannerReport();
    }
    return;
  }

  const closeBtn = e.target.closest("[data-close-dialog]");
  if (closeBtn) {
    document.getElementById(closeBtn.dataset.closeDialog)?.close();
  }
});

// Dialog dışına (backdrop) tıklayınca kapatma
[productDialog, compareDialog].forEach((dlg) => {
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) {
      dlg.close();
    }
  });
});

compareOpenBtn.addEventListener("click", openCompareModal);
clearCompareBtn.addEventListener("click", () => {
  state.compareIds = [];
  updateCompareButton();
  renderCatalog();
  compareDialog.close();
});

// Canlı Analizör olayları
analyzeBtn.addEventListener("click", runLiveAnalyzer);
clearAnalyzerBtn.addEventListener("click", () => {
  inciTextareaEl.value = "";
  runLiveAnalyzer();
});

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    inciTextareaEl.value = INCI_PRESETS[btn.dataset.preset] || "";
    runLiveAnalyzer();
  });
});

// Sözlük olayları
glossarySearchEl.addEventListener("input", (e) => {
  state.glossarySearch = e.target.value;
  renderGlossary();
});

document.querySelectorAll("[data-glossary-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.glossaryFilter = btn.dataset.glossaryFilter;
    document.querySelectorAll("[data-glossary-filter]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
    renderGlossary();
  });
});

// ============================================================
// Barkod Tarayıcı & Canlı API Sorgulama
// ============================================================
function setScannerStatus(message, tone = "neutral") {
  scannerStatusEl.textContent = message;
  scannerStatusEl.classList.remove("is-error", "is-success");
  if (tone === "error") scannerStatusEl.classList.add("is-error");
  if (tone === "success") scannerStatusEl.classList.add("is-success");
}

function stopScannerUI() {
  scannerController.stop();
  scannerViewportEl.classList.remove("is-streaming");
  scannerReticleEl.hidden = true;
  startCameraBtn.hidden = false;
  stopCameraBtn.hidden = true;
}

const scannerController = new BarcodeScannerController(scannerVideoEl, {
  onDetected: (code) => {
    stopScannerUI();
    barcodeInputEl.value = code;
    setScannerStatus(`Barkod okundu: ${code} — İçerik getiriliyor...`, "success");
    lookupAndRenderBarcode(code);
  },
  onStatus: (msg) => {
    setScannerStatus(msg, "neutral");
  },
  onError: (errMsg) => {
    stopScannerUI();
    setScannerStatus(errMsg, "error");
  }
});

function renderSampleBarcodes() {
  sampleBarcodesWrapEl.innerHTML = SAMPLE_BARCODES.map(
    (s) => `
      <button type="button" class="chip chip-sm" data-sample-barcode="${escapeHtml(s.code)}">
        ${escapeHtml(s.label)}
      </button>
    `
  ).join("");
}

function renderScannerReport() {
  if (!state.lastScanProduct) return;
  const prod = state.lastScanProduct;
  const analysis = state.lastScanAnalysis;

  const sourceHeader = `
    <div class="barcode-source-bar">
      <span><strong>Barkod:</strong> <code>${escapeHtml(prod.barcode)}</code></span>
      <span class="tag ${prod.source === "openbeautyfacts" ? "tag-safe" : "tag-neutral"}">
        ${escapeHtml(prod.sourceLabel)}
      </span>
    </div>
  `;

  if (!analysis || analysis.counts.total === 0) {
    scannerResultEl.innerHTML = `
      ${sourceHeader}
      <div class="report-hero report-hero-with-photo">
        <img class="report-thumb" src="${escapeHtml(prod.image)}" alt="${escapeHtml(prod.name)}" />
        <div></div>
        <div class="report-verdict">
          <span class="tag tag-check">İçerik Metni Eksik</span>
          <h3>${escapeHtml(prod.brand + " — " + prod.name)}</h3>
          <p>${escapeHtml(prod.description)}</p>
        </div>
      </div>
      <div class="empty-state" style="padding:1.2rem;">
        <p style="margin-bottom:0.9rem;">Ürünün arkasındaki INCI listesini kopyalayıp anında analiz edebilirsiniz.</p>
        <button type="button" class="btn btn-primary btn-sm" data-jump="analyzer">İçerik Analizörüne Git</button>
      </div>
    `;
    return;
  }

  scannerResultEl.innerHTML =
    sourceHeader +
    renderAnalysisReport(analysis, {
      product: prod,
      filter: state.lastScanFilter,
      containerPrefix: "scanner"
    });
}

async function lookupAndRenderBarcode(rawCode) {
  const code = String(rawCode || "").trim();
  if (!code) return;

  barcodeInputEl.value = code;
  scannerResultEl.innerHTML = `
    <div class="empty-state">
      <div class="spinner" aria-hidden="true"></div>
      <h3>Barkod Sorgulanıyor...</h3>
      <p><code>${escapeHtml(code)}</code> için ürün ve INCI içerik listesi getiriliyor.</p>
    </div>
  `;

  try {
    const product = await fetchProductByBarcode(code);
    state.lastScanProduct = product;
    state.lastScanFilter = "all";
    state.lastScanAnalysis = product.ingredientsText
      ? analyzeIngredients(product.ingredientsText)
      : null;

    setScannerStatus(`Ürün bulundu: ${product.brand} — ${product.name}`, "success");
    renderScannerReport();
  } catch (err) {
    state.lastScanProduct = null;
    state.lastScanAnalysis = null;
    setScannerStatus(err.message || "Barkod sorgulanamadı.", "error");
    scannerResultEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">🔎</div>
        <h3>Ürün Bulunamadı</h3>
        <p style="margin-bottom:1rem;">${escapeHtml(err.message)}</p>
        <button type="button" class="btn btn-outline btn-sm" data-jump="analyzer">
          İçeriği Elle Yapıştırarak Analiz Et
        </button>
      </div>
    `;
  }
}

startCameraBtn.addEventListener("click", async () => {
  scannerViewportEl.classList.add("is-streaming");
  scannerReticleEl.hidden = false;
  startCameraBtn.hidden = true;
  stopCameraBtn.hidden = false;
  await scannerController.start();
});

stopCameraBtn.addEventListener("click", () => {
  stopScannerUI();
  setScannerStatus("Kamera durduruldu.", "neutral");
});

barcodeFileInputEl.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;

  setScannerStatus("Fotoğraftaki barkod okunuyor...", "neutral");
  try {
    const code = await scanBarcodeFromImageFile(file);
    setScannerStatus(`Fotoğraftan barkod okundu: ${code}`, "success");
    await lookupAndRenderBarcode(code);
  } catch (err) {
    setScannerStatus(err.message, "error");
  }
});

barcodeManualFormEl.addEventListener("submit", (e) => {
  e.preventDefault();
  lookupAndRenderBarcode(barcodeInputEl.value);
});

sampleBarcodesWrapEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-sample-barcode]");
  if (!btn) return;
  lookupAndRenderBarcode(btn.dataset.sampleBarcode);
});

// Dinamik oluşturulan [data-jump] butonları için delegasyon
scannerResultEl.addEventListener("click", (e) => {
  const jumpBtn = e.target.closest("[data-jump]");
  if (!jumpBtn) return;
  const target = jumpBtn.dataset.jump;
  switchView(target);
  document.getElementById(`view-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ============================================================
// Dünya Kataloğu (Canlı Open Beauty Facts Arama & Marka Gruplama)
// ============================================================
function hashColor(str) {
  const palette = ["#a64d63", "#1f7a53", "#7c3aed", "#b45309", "#1d4ed8", "#0f766e", "#be123c", "#4338ca"];
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return palette[h % palette.length];
}

function getBrandMonogram(name) {
  const words = String(name || "?").trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return words[0].slice(0, 3).toUpperCase();
}

function renderGlobalBrandsStrip() {
  const allBtn = `
    <button type="button" class="brand-pill ${!state.globalBrand ? "is-active" : ""}" data-global-brand="">
      <span class="brand-pill-mono" style="background:var(--accent);">🌍</span>
      <span>Tüm Dünya</span>
    </button>
  `;

  const pills = GLOBAL_BRANDS.map(
    (b) => `
      <button type="button" class="brand-pill ${state.globalBrand === b.query ? "is-active" : ""}" data-global-brand="${escapeHtml(b.query)}">
        <span class="brand-pill-mono" style="background:${hashColor(b.name)};">${escapeHtml(getBrandMonogram(b.name))}</span>
        <span>${escapeHtml(b.name)}</span>
        <span class="brand-pill-type">· ${escapeHtml(b.type)}</span>
      </button>
    `
  ).join("");

  globalBrandsStripEl.innerHTML = allBtn + pills;
}

function renderGlobalCategoriesStrip() {
  globalCategoriesStripEl.innerHTML = GLOBAL_CATEGORIES.map(
    (cat) => `
      <button type="button" class="chip ${state.globalCategoryId === cat.id ? "is-active" : ""}" data-global-cat="${escapeHtml(cat.id)}">
        ${escapeHtml(cat.label)}
      </button>
    `
  ).join("");
}

function renderGlobalResults() {
  let visible = state.globalItems;

  if (state.globalOnlyWithInci) {
    visible = visible.filter((p) => p.ingredientsText && p.ingredientsText.length > 5);
  }
  if (state.globalOnlyVegan) {
    visible = visible.filter((p) => p.analysis.veganStatus === "vegan");
  }

  const totalFormatted = state.globalTotalCount
    ? state.globalTotalCount.toLocaleString("tr-TR")
    : String(visible.length);

  globalCountEl.textContent = state.globalLoading
    ? "Dünya veritabanı taranıyor..."
    : `${totalFormatted} küresel sonuç · ${visible.length} gösteriliyor`;

  globalLoadMoreWrapEl.hidden = !state.globalHasMore || state.globalLoading;

  if (state.globalLoading && state.globalItems.length === 0) {
    globalResultsContainerEl.innerHTML = `
      <div class="empty-state" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);">
        <div class="spinner" aria-hidden="true"></div>
        <h3>Dünya Kataloğu Yükleniyor...</h3>
        <p>Open Beauty Facts küresel veritabanından makyaj ve cilt bakım ürünleri çekiliyor.</p>
      </div>
    `;
    return;
  }

  if (visible.length === 0) {
    globalResultsContainerEl.innerHTML = `
      <div class="empty-state" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);">
        <div class="empty-icon" aria-hidden="true">🌍</div>
        <h3>Bu filtrede ürün bulunamadı</h3>
        <p>"Sadece İçeriği Olanlar" veya "Sadece Vegan" filtresini kapatabilir ya da farklı bir marka/ürün adı arayabilirsiniz.</p>
      </div>
    `;
    return;
  }

  if (state.globalGroupByBrand) {
    const brandGroups = new Map();
    for (const item of visible) {
      const rawName = (item.brand || "Diğer Markalar").trim();
      const normKey = rawName.toLowerCase();
      if (!brandGroups.has(normKey)) {
        brandGroups.set(normKey, { displayName: rawName, items: [] });
      }
      brandGroups.get(normKey).items.push(item);
    }

    globalResultsContainerEl.innerHTML = [...brandGroups.values()]
      .map(({ displayName: brandName, items }) => {
        const analyzed = items.filter((x) => x.analysis.counts.total > 0);
        const avg = analyzed.length
          ? Math.round(analyzed.reduce((s, x) => s + x.analysis.healthScore, 0) / analyzed.length)
          : 0;
        const avgColor = getScoreColorVar(avg, analyzed.length ? "ok" : "unknown");
        const veganCount = analyzed.filter((x) => x.analysis.veganStatus === "vegan").length;

        return `
          <section class="brand-section" aria-label="${escapeHtml(brandName)} ürünleri">
            <div class="brand-section-header">
              <div class="brand-section-identity">
                <div class="brand-avatar" style="background:${hashColor(brandName)};">
                  ${escapeHtml(getBrandMonogram(brandName))}
                </div>
                <div>
                  <h3>${escapeHtml(brandName)}</h3>
                  <p>${items.length} ürün listeleniyor · Open Beauty Facts Küresel Veritabanı</p>
                </div>
              </div>

              <div class="brand-section-metrics">
                ${
                  analyzed.length
                    ? `<div class="brand-avg-chip">
                        ${renderMiniRing(avg, "ok")}
                        <span>Ort. Skor: <strong style="color:${avgColor}">${avg}/100</strong></span>
                      </div>`
                    : ""
                }
                <span class="tag tag-vegan">🌱 ${veganCount}/${items.length} Vegan</span>
              </div>
            </div>

            <div class="product-grid">
              ${items.map(renderProductCard).join("")}
            </div>
          </section>
        `;
      })
      .join("");
  } else {
    globalResultsContainerEl.innerHTML = `
      <div class="product-grid">
        ${visible.map(renderProductCard).join("")}
      </div>
    `;
  }
}

async function fetchGlobalCatalog({ append = false } = {}) {
  const catObj = GLOBAL_CATEGORIES.find((c) => c.id === state.globalCategoryId);
  const nextPage = append ? state.globalPage + 1 : 1;

  state.globalLoading = true;
  if (!append) {
    state.globalItems = [];
    renderGlobalResults();
  } else {
    globalLoadMoreBtn.disabled = true;
    globalLoadMoreBtn.textContent = "Yükleniyor...";
  }

  try {
    const res = await searchGlobalProducts({
      query: state.globalQuery,
      brand: state.globalBrand,
      categoryTerm: catObj?.term || "",
      page: nextPage,
      pageSize: 24
    });

    const enrichedBatch = res.products.map((p) => {
      const enriched = {
        ...p,
        analysis: p.ingredientsText
          ? analyzeIngredients(p.ingredientsText)
          : analyzeIngredients([])
      };
      productRegistry.set(enriched.id, enriched);
      return enriched;
    });

    state.globalPage = res.page;
    state.globalTotalCount = res.totalCount;
    state.globalHasMore = res.hasMore;
    state.globalItems = append
      ? [...state.globalItems, ...enrichedBatch]
      : enrichedBatch;
  } catch (err) {
    if (!append) {
      globalResultsContainerEl.innerHTML = `
        <div class="empty-state" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);">
          <div class="empty-icon" aria-hidden="true">📡</div>
          <h3>Küresel Veritabanına Ulaşılamadı</h3>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  } finally {
    state.globalLoading = false;
    globalLoadMoreBtn.disabled = false;
    globalLoadMoreBtn.textContent = "Daha Fazla Ürün Yükle";
    renderGlobalResults();
  }
}

globalBrandsStripEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-global-brand]");
  if (!btn) return;
  state.globalBrand = btn.dataset.globalBrand;
  renderGlobalBrandsStrip();
  fetchGlobalCatalog({ append: false });
});

globalCategoriesStripEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-global-cat]");
  if (!btn) return;
  state.globalCategoryId = btn.dataset.globalCat;
  renderGlobalCategoriesStrip();
  fetchGlobalCatalog({ append: false });
});

globalSearchFormEl.addEventListener("submit", (e) => {
  e.preventDefault();
  state.globalQuery = globalSearchInputEl.value.trim();
  fetchGlobalCatalog({ append: false });
});

globalGroupByBrandBtn.addEventListener("click", () => {
  state.globalGroupByBrand = !state.globalGroupByBrand;
  globalGroupByBrandBtn.setAttribute("aria-pressed", String(state.globalGroupByBrand));
  renderGlobalResults();
});

globalOnlyWithInciBtn.addEventListener("click", () => {
  state.globalOnlyWithInci = !state.globalOnlyWithInci;
  globalOnlyWithInciBtn.setAttribute("aria-pressed", String(state.globalOnlyWithInci));
  renderGlobalResults();
});

globalOnlyVeganBtn.addEventListener("click", () => {
  state.globalOnlyVegan = !state.globalOnlyVegan;
  globalOnlyVeganBtn.setAttribute("aria-pressed", String(state.globalOnlyVegan));
  renderGlobalResults();
});

globalLoadMoreBtn.addEventListener("click", () => {
  fetchGlobalCatalog({ append: true });
});

globalResultsContainerEl.addEventListener("click", (e) => {
  const openBtn = e.target.closest("[data-open-product]");
  if (openBtn) {
    openProductModal(openBtn.dataset.openProduct);
    return;
  }
  const cmpBtn = e.target.closest("[data-toggle-compare]");
  if (cmpBtn) {
    toggleCompare(cmpBtn.dataset.toggleCompare);
  }
});

// ============================================================
// Başlatma
// ============================================================
initTheme();
renderGlobalBrandsStrip();
renderGlobalCategoriesStrip();
renderBrandStrip();
renderCatalog();
renderBrandsDirectory();
renderSampleBarcodes();
renderGlossary();
updateCompareButton();
fetchGlobalCatalog({ append: false });
