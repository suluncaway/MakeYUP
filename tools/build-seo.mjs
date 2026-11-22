#!/usr/bin/env node
/**
 * MakeYUP — SEO çıktısı üretici (idempotent, bağımlılıksız).
 *
 *   node tools/build-seo.mjs
 *
 * Üretir:
 *   robots.txt
 *   sitemap.xml
 *   urun/index.html           (tüm ürün analizlerinin dizini — tarayıcılar için iç bağlantı merkezi)
 *   urun/<id>.html            (her ürün için statik açılış sayfası: başlık, meta, OG, JSON-LD, özet, INCI listesi)
 *
 * Aynı girdiyle her çalıştırmada bayt bayt aynı çıktıyı üretir (zaman damgası yok).
 * products.js'den silinen ürünlerin sayfaları (yalnızca bu betiğin ürettikleri) kaldırılır.
 * products.js, affiliate_config.js veya analiz motoru değiştiğinde yeniden çalıştırın.
 */
import { readdir, readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://suluncaway.github.io/MakeYUP/";
const MARKER = "<!-- generated-by: tools/build-seo.mjs -->";
const OUT_DIR = join(ROOT, "urun");

const imp = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const { analyzeIngredients } = await imp("js/analyzer.js");
const { PRODUCTS_DATA } = await imp("js/data/products.js");
const { BRANDS_DATA } = await imp("js/data/brands.js");
const { findAlternatives } = await imp("js/features/alternatives.js");

// Affiliate modülü başka bir ekip tarafından yönetiliyor; yoksa / hata verirse linksiz devam et.
let affiliate = null;
try {
  const m = await imp("js/affiliate.js");
  if (typeof m.buyLinks === "function") affiliate = m;
} catch {
  affiliate = null;
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const jsonLd = (obj) => JSON.stringify(obj, null, 2).replace(/</g, "\\u003c");
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");
const abs = (rel) => new URL(rel, SITE).href;
const pageUrl = (id) => abs(`urun/${encodeURIComponent(id)}.html`);
const fileName = (id) => `${String(id).replace(/[^a-z0-9._-]/gi, "-")}.html`;

const RISK_TR = { safe: "Güvenli", moderate: "Orta risk", high: "Yüksek risk", unknown: "Veri yok" };
const STATUS_COLOR = { healthy: "#2f7d4f", moderate: "#b7791f", risky: "#b42318", unknown: "#6b7280" };

const cache = new Map();
const analyze = (p) => {
  if (!cache.has(p.id)) cache.set(p.id, analyzeIngredients(p.ingredients || []));
  return cache.get(p.id);
};

function metaDescription(p, a) {
  const parts = [
    `${p.brand} ${p.name}: sağlık skoru ${a.healthScore}/100 (${a.healthLabel}), ${a.veganLabel}.`,
    a.safety.pregnancySafe ? "Hamilelik uyarısı yok." : "Hamilelikte dikkat gerektiren bileşen içerir.",
    `${a.counts.total} bileşenlik INCI listesi ve risk analizi.`
  ];
  // Tam cümleleri sığdığı kadar ekle (yarım kesilmiş cümle yok)
  let out = parts[0];
  for (const s of parts.slice(1)) if ((out + " " + s).length <= 160) out += " " + s;
  return clip(out, 165);
}

const BASE_CSS = `
:root{--brand:#9d3f58;--ink:#1f1a1c;--muted:#6b6266;--line:#ece4e6;--bg:#fff;--soft:#faf6f7}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55}
a{color:var(--brand)}main{max-width:760px;margin:0 auto;padding:16px}
header.top{border-bottom:1px solid var(--line)}header.top div{max-width:760px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;gap:10px}
header.top a{font-weight:700;text-decoration:none;color:var(--ink);font-size:1.1rem}header.top span{color:var(--brand)}
nav.crumbs{font-size:.85rem;color:var(--muted);margin:4px 0 12px}h1{font-size:1.5rem;line-height:1.25;margin:.2em 0}
.sub{color:var(--muted);margin:0 0 16px}.hero{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.hero img{width:120px;height:120px;object-fit:cover;border-radius:12px;background:var(--soft)}
.score{display:inline-flex;align-items:baseline;gap:4px;font-weight:700;font-size:2rem}.score small{font-size:1rem;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.chip{border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:.85rem;background:var(--soft)}
.cta{display:inline-block;background:var(--brand);color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600;margin:8px 8px 8px 0}
.buy a{display:inline-block;border:1px solid var(--brand);border-radius:10px;padding:8px 14px;margin:4px 6px 4px 0;text-decoration:none;font-weight:600}
.note{font-size:.8rem;color:var(--muted)}section{margin:24px 0}h2{font-size:1.15rem;margin:0 0 8px}
ol.inci{padding-left:1.4em}ol.inci li{margin:2px 0}.r-high{color:#b42318}.r-moderate{color:#b7791f}.r-safe{color:#2f7d4f}.r-unknown{color:var(--muted)}
ul.alts{list-style:none;padding:0}ul.alts li{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:8px 0}
footer{border-top:1px solid var(--line);margin-top:32px;padding:16px;text-align:center;font-size:.85rem;color:var(--muted)}
`.trim();

function shell({ title, description, canonical, ogImage, body, ld, extraHead = "" }) {
  return `<!DOCTYPE html>
${MARKER}
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta name="robots" content="index, follow" />
<meta name="theme-color" content="#9d3f58" />
<link rel="icon" type="image/svg+xml" href="../assets/brand/logo-mark.svg" />
<link rel="apple-touch-icon" href="../assets/brand/icon-180.png" />
<link rel="manifest" href="../manifest.webmanifest" />
<meta property="og:site_name" content="MakeYUP" />
<meta property="og:locale" content="tr_TR" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />
${extraHead}${ld.map((o) => `<script type="application/ld+json">\n${jsonLd(o)}\n</script>`).join("\n")}
<style>${BASE_CSS}</style>
</head>
<body>
<header class="top"><div><a href="../">Make<span>YUP</span></a></div></header>
<main>
${body}
</main>
<footer>
<p>MakeYUP — makyaj ve cilt bakımı ürünleri için bağımsız içerik (INCI), sağlık ve vegan rehberi.</p>
<p><a href="../">Ana sayfa</a> · <a href="./">Tüm ürün analizleri</a></p>
</footer>
</body>
</html>
`;
}

function productPage(p) {
  const a = analyze(p);
  const brand = BRANDS_DATA.find((b) => b.id === p.brandId);
  const title = `${p.brand} ${p.name} içerik analizi — vegan mı, sağlıklı mı? | MakeYUP`;
  const description = metaDescription(p, a);
  const canonical = pageUrl(p.id);
  const ogImage = p.image ? abs(p.image) : abs("assets/brand/icon-512.png");
  const appLink = `../#/urun/${encodeURIComponent(p.id)}`;
  const color = STATUS_COLOR[a.healthStatus] || STATUS_COLOR.unknown;
  const subtype = String(p.categoryLabel || "").split("·").pop().trim();

  const chips = [
    a.veganLabel,
    a.safety.pregnancySafe ? "Hamilelik uyarısı yok" : "Hamilelikte dikkat",
    p.crueltyFree ? "Cruelty-free" : null,
    ...(a.highlights || []).map((h) => h.text)
  ].filter(Boolean);
  const uniqueChips = [...new Set(chips)];

  const warnings = (a.safety.groups || [])
    .map((g) => `<li><strong>${esc(g.title)}:</strong> ${esc(g.names.join(", "))}</li>`)
    .join("\n");

  const inci = a.items
    .map(
      (i) =>
        `<li><span class="r-${esc(i.risk)}">${esc(i.rawName)}</span>${
          i.known && i.nameTr && i.nameTr !== i.rawName ? ` — ${esc(i.nameTr)}` : ""
        } <small class="r-${esc(i.risk)}">(${esc(RISK_TR[i.risk] || i.risk)})</small></li>`
    )
    .join("\n");

  const alts = findAlternatives(p, PRODUCTS_DATA, { limit: 3, analyze: analyzeIngredients, cache: new Map() });
  const altHtml = alts.length
    ? `<section>
<h2>Daha temiz alternatifler</h2>
<ul class="alts">
${alts
  .map(
    (r) =>
      `<li><a href="${esc(fileName(r.product.id))}"><strong>${esc(r.product.brand)} ${esc(r.product.name)}</strong></a> — skor ${r.score}/100<br><span class="note">${esc(r.reasons.join(" · "))}</span></li>`
  )
  .join("\n")}
</ul>
</section>`
    : "";

  let buyHtml = "";
  if (affiliate) {
    try {
      const links = affiliate.buyLinks(p) || [];
      if (links.length) {
        const rel = affiliate.LINK_REL || "sponsored nofollow noopener";
        const disclosure = typeof affiliate.affiliateDisclosure === "function" ? affiliate.affiliateDisclosure() : "";
        const discText = typeof disclosure === "string" ? disclosure : disclosure && disclosure.text;
        buyHtml = `<section class="buy">
<h2>Satın al</h2>
${links
  .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="${esc(rel)}" data-store="${esc(l.store)}">${esc(l.name)}</a>`)
  .join("\n")}
${discText && links.some((l) => l.isAffiliate) ? `<p class="note">${esc(discText)}</p>` : ""}
</section>`;
      }
    } catch {
      buyHtml = "";
    }
  }

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${p.brand} ${p.name}`,
      brand: { "@type": "Brand", name: p.brand },
      category: p.categoryLabel,
      description: p.description || description,
      image: ogImage,
      url: canonical,
      additionalProperty: [
        { "@type": "PropertyValue", name: "MakeYUP sağlık skoru", value: a.healthScore, maxValue: 100, minValue: 0 },
        { "@type": "PropertyValue", name: "Vegan durumu", value: a.veganLabel },
        { "@type": "PropertyValue", name: "Cruelty-free", value: p.crueltyFree ? "Evet" : "Hayır" },
        { "@type": "PropertyValue", name: "İçindekiler (INCI)", value: a.items.map((i) => i.rawName).join(", ") }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "MakeYUP", item: SITE },
        { "@type": "ListItem", position: 2, name: "Ürün analizleri", item: abs("urun/") },
        { "@type": "ListItem", position: 3, name: `${p.brand} ${p.name}`, item: canonical }
      ]
    }
  ];

  const body = `<nav class="crumbs"><a href="../">MakeYUP</a> › <a href="./">Ürün analizleri</a> › ${esc(p.brand)}</nav>
<article>
<div class="hero">
${p.image ? `<img src="../${esc(p.image)}" alt="${esc(p.brand + " " + p.name)}" width="120" height="120" loading="eager" />` : ""}
<div>
<h1>${esc(p.brand)} ${esc(p.name)} içerik analizi</h1>
<p class="sub">${esc(p.categoryLabel)}${p.priceTier ? ` · ${esc(p.priceTier)}` : ""}</p>
<div class="score" style="color:${color}">${a.healthScore}<small>/100 · ${esc(a.healthLabel)}</small></div>
</div>
</div>
<div class="chips">${uniqueChips.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
<p><strong>Vegan mı?</strong> ${esc(a.veganLabel)}. ${esc(a.veganExplanation)}</p>
<p><strong>Sağlıklı mı?</strong> ${esc(a.healthSummary)}</p>
${p.description ? `<p>${esc(p.description)}</p>` : ""}
${a.skinProfile && a.skinProfile.hasData ? `<p><strong>Cilt tipi:</strong> ${esc(a.skinProfile.summaryText)}</p>` : ""}
${brand && brand.brandVeganLabel ? `<p><strong>Marka:</strong> ${esc(brand.name)} — ${esc(brand.brandVeganLabel)}${brand.crueltyFree ? ", cruelty-free" : ""}.</p>` : ""}
<a class="cta" href="${esc(appLink)}">Uygulamada detaylı analizi aç →</a>
${buyHtml}
${warnings ? `<section>\n<h2>Dikkat edilmesi gerekenler</h2>\n<ul>\n${warnings}\n</ul>\n</section>` : ""}
<section>
<h2>İçindekiler (INCI) — ${a.counts.total} bileşen</h2>
<ol class="inci">
${inci}
</ol>
<p class="note">Bileşen listesi bilgilendirme amaçlıdır ve üretici formülü zamanla değişebilir; satın almadan önce ambalajdaki güncel listeyi kontrol edin. Bu sayfa tıbbi tavsiye değildir.</p>
</section>
${altHtml}
<section>
<h2>Benzer ürünler</h2>
<p>${PRODUCTS_DATA.filter((x) => x.id !== p.id && x.categoryLabel === p.categoryLabel)
    .slice(0, 6)
    .map((x) => `<a href="${esc(fileName(x.id))}">${esc(x.brand)} ${esc(x.name)}</a>`)
    .join(" · ") || `<a href="./">Tüm ${esc(subtype)} analizleri</a>`}</p>
</section>
</article>`;

  return shell({ title, description, canonical, ogImage, body, ld });
}

function indexPage() {
  const groups = new Map();
  for (const p of PRODUCTS_DATA) {
    const g = String(p.categoryLabel || "Diğer").split("·")[0].trim();
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(p);
  }
  const body = `<nav class="crumbs"><a href="../">MakeYUP</a> › Ürün analizleri</nav>
<h1>Makyaj ve cilt bakımı ürün içerik analizleri</h1>
<p class="sub">${PRODUCTS_DATA.length} ürünün INCI içeriği, sağlık skoru ve vegan durumu.</p>
${[...groups]
  .map(
    ([g, list]) => `<section>
<h2>${esc(g)}</h2>
<ul>
${list
  .map((p) => {
    const a = analyze(p);
    return `<li><a href="${esc(fileName(p.id))}">${esc(p.brand)} ${esc(p.name)}</a> — ${a.healthScore}/100 · ${esc(a.veganLabel)}</li>`;
  })
  .join("\n")}
</ul>
</section>`
  )
  .join("\n")}`;
  const title = "Makyaj ürünleri içerik analizi: vegan mı, sağlıklı mı? | MakeYUP";
  const description = clip(
    `${PRODUCTS_DATA.length} popüler makyaj ve cilt bakımı ürününün içerik (INCI) analizi, sağlık skoru, vegan durumu ve hamilelik uyarıları.`,
    165
  );
  return shell({
    title,
    description,
    canonical: abs("urun/"),
    ogImage: abs("assets/brand/icon-512.png"),
    body,
    ld: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        url: abs("urun/"),
        inLanguage: "tr",
        isPartOf: { "@type": "WebSite", name: "MakeYUP", url: SITE }
      }
    ]
  });
}

async function writeIfChanged(path, content) {
  try {
    if ((await readFile(path, "utf8")) === content) return false;
  } catch {
    /* yok */
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  return true;
}

async function main() {
  let changed = 0;
  const seen = new Set();
  const expected = new Set(["index.html"]);

  for (const p of PRODUCTS_DATA) {
    if (!p || !p.id) continue;
    const fn = fileName(p.id);
    if (seen.has(fn)) throw new Error(`Yinelenen ürün dosya adı: ${fn}`);
    seen.add(fn);
    expected.add(fn);
    if (await writeIfChanged(join(OUT_DIR, fn), productPage(p))) changed++;
  }
  if (await writeIfChanged(join(OUT_DIR, "index.html"), indexPage())) changed++;

  // Artık ürünü olmayan, bu betiğin ürettiği eski sayfaları temizle (elle yazılmış dosyalara dokunma)
  let removed = 0;
  for (const f of await readdir(OUT_DIR)) {
    if (!f.endsWith(".html") || expected.has(f)) continue;
    const content = await readFile(join(OUT_DIR, f), "utf8");
    if (content.includes(MARKER)) {
      await unlink(join(OUT_DIR, f));
      removed++;
    }
  }

  // Kök dizindeki hash'siz statik sayfalar (index.html dışındakiler, 404 hariç)
  const rootPages = (await readdir(ROOT))
    .filter((f) => f.endsWith(".html") && f !== "index.html" && f !== "404.html")
    .sort();

  const urls = [
    { loc: SITE, priority: "1.0", changefreq: "weekly" },
    ...rootPages.map((f) => ({ loc: abs(f), priority: "0.5", changefreq: "monthly" })),
    { loc: abs("urun/"), priority: "0.8", changefreq: "weekly" },
    ...PRODUCTS_DATA.filter((p) => p && p.id).map((p) => ({ loc: pageUrl(p.id), priority: "0.7", changefreq: "monthly" }))
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
  .join("\n")}
</urlset>
`;
  if (await writeIfChanged(join(ROOT, "sitemap.xml"), sitemap)) changed++;

  const robots = `# MakeYUP — tools/build-seo.mjs tarafından üretildi
User-agent: *
Allow: /

Sitemap: ${abs("sitemap.xml")}
`;
  if (await writeIfChanged(join(ROOT, "robots.txt"), robots)) changed++;

  console.log(
    `build-seo: ${PRODUCTS_DATA.length} ürün sayfası, ${urls.length} sitemap URL'si; ${changed} dosya güncellendi, ${removed} eski sayfa silindi.` +
      (affiliate ? " (Satın al linkleri eklendi)" : " (affiliate modülü yok — Satın al linkleri atlandı)")
  );
}

if (!existsSync(join(ROOT, "js/analyzer.js"))) {
  console.error("build-seo: proje kökü bulunamadı");
  process.exit(1);
}
await main();
