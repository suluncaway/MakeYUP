#!/usr/bin/env node
/**
 * MakeYUP — uçtan uca (E2E) arayüz testi.
 *
 *   cd MakeYUP && python3 -m http.server 8806 &
 *   node tests/e2e.mjs                         # http://localhost:8806/
 *   node tests/e2e.mjs http://localhost:8806/  # veya BASE=… node tests/e2e.mjs
 *   SHOTS=/tmp/shots node tests/e2e.mjs        # ekran görüntüleri de alır
 *
 * Telefon (390x844, dokunmatik) ve masaüstü (1280x860), açık ve koyu temada her rotayı açar;
 * JS hatası, yatay taşma, 44 px dokunma hedefi, alt metni, başlık sırası, "undefined/null/NaN"
 * metni ve "Satın al" bağlantılarının rel/target/URL kurallarını denetler. Ardından geri/ileri,
 * tema kalıcılığı, klavye erişimi ve beş kullanıcı yolculuğunu (süreleriyle) çalıştırır.
 * Dış alan adları (Open Beauty Facts, huggingface, Google Fonts, CDN) bilerek engellenir:
 * arayüzün bunlar olmadan da düzgün çalıştığını doğrular. Hata varsa çıkış kodu 1'dir.
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

// Playwright genelde global kurulu (NODE_PATH); ESM import bunu görmez, require görür.
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = (process.argv[2] || process.env.BASE || "http://localhost:8806/").replace(/#.*$/, "");
const SHOTS = process.env.SHOTS || "";
const BASE_HOST = new URL(BASE).host;

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const DESKTOP = { viewport: { width: 1280, height: 860 } };

const results = []; // { name, ok, detail }
const journeys = []; // { name, ms, ok }
const pass = (name, detail = "") => results.push({ name, ok: true, detail });
const fail = (name, detail = "") => { results.push({ name, ok: false, detail }); console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`); };
const check = (name, cond, detail = "") => (cond ? pass(name, detail) : fail(name, detail));

/* ---------------- helpers ---------------- */

async function newPage(browser, device, scheme) {
  const ctx = await browser.newContext({ ...device, colorScheme: scheme, locale: "tr-TR" });
  const page = await ctx.newPage();
  page._errors = [];
  page._blocked = new Set();
  // Dış alan adlarını engelle (sandbox'ta zaten erişilemiyor; testi deterministik yapar).
  await ctx.route("**/*", (r) => {
    const u = new URL(r.request().url());
    if (u.protocol.startsWith("http") && u.host !== BASE_HOST) {
      page._blocked.add(u.host);
      return r.abort("blockedbyclient");
    }
    return r.continue();
  });
  page.on("pageerror", (err) => page._errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const url = msg.location()?.url || "";
    const text = msg.text();
    // Engellenen dış kaynaklar ortam kısıtıdır, hata sayılmaz.
    if (url && !url.includes(BASE_HOST)) return;
    if (/ERR_BLOCKED_BY_CLIENT|net::ERR_|Failed to fetch|NetworkError/i.test(text) && !/localhost|127\.0\.0\.1/.test(text)) return;
    page._errors.push(`console: ${text}${url ? " @ " + url : ""}`);
  });
  page.on("response", (res) => {
    const u = new URL(res.url());
    if (u.host === BASE_HOST && res.status() >= 400 && !/favicon/.test(u.pathname)) page._errors.push(`HTTP ${res.status()} ${u.pathname}`);
  });
  return { ctx, page };
}

async function ready(page, extra = 250) {
  await page.waitForFunction(() => {
    const app = document.getElementById("app");
    return app && !app.hasAttribute("aria-busy") && !app.querySelector(".route-loading");
  }, null, { timeout: 15000 });
  // Arşiv / iskelet kartlar gibi ikinci aşama yüklemeleri bekle (en çok 6 sn).
  await page.waitForFunction(() => !document.querySelector('#app [aria-busy="true"]'), null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(extra);
}

async function open(page, hash) {
  await page.goto("about:blank");
  await page.goto(BASE + hash);
  await ready(page);
}

/** Generic per-page audit. Returns list of problems. */
async function audit(page) {
  return page.evaluate(() => {
    const out = [];
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) return false;
      if (el.closest("[hidden], .visually-hidden, details:not([open]) > :not(summary)")) return false;
      return true;
    };
    const desc = (el) => {
      const t = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""}"${t}"`;
    };

    // 1) yatay taşma
    const de = document.documentElement;
    if (de.scrollWidth > de.clientWidth + 1) {
      const wide = [...document.querySelectorAll("body *")].filter((n) => { const r = n.getBoundingClientRect(); return r.right > de.clientWidth + 1 && vis(n); }).slice(0, 3).map(desc);
      out.push(`overflow: scrollWidth ${de.scrollWidth} > ${de.clientWidth} (${wide.join(", ")})`);
    }

    // 2) dokunma hedefleri ≥ 44x44
    const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])';
    const small = [];
    for (const el of document.querySelectorAll(sel)) {
      if (el.id === "app" || el.classList.contains("skip-link") || !vis(el)) continue;
      if (el.closest("details:not([open])") && el.tagName !== "SUMMARY") continue;
      let r = el.getBoundingClientRect();
      // "Stretched link": ::after { position:absolute; inset:0 } tüm kartı tıklanabilir yapar.
      const after = getComputedStyle(el, "::after");
      if (after.content !== "none" && after.position === "absolute" && el.offsetParent) r = el.offsetParent.getBoundingClientRect();
      if (el.matches("input, select, textarea")) {
        const lab = el.closest("label") || (el.id && document.querySelector(`label[for="${el.id}"]`));
        if (lab && (r.width < 44 || r.height < 44)) { const lr = lab.getBoundingClientRect(); if (lr.width >= 43.5 && lr.height >= 43.5) continue; }
      }
      // Satır içi metin bağlantıları (WCAG 2.5.8 istisnası)
      const cs = getComputedStyle(el);
      if (el.tagName === "A" && cs.display === "inline") {
        const host = el.parentElement;
        if (host && (host.textContent || "").trim().length > (el.textContent || "").trim().length + 15) continue;
      }
      if (r.width < 43.5 || r.height < 43.5) small.push(`${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    if (small.length) out.push(`tap<44: ${[...new Set(small)].slice(0, 8).join(" | ")}${small.length > 8 ? ` (+${small.length - 8})` : ""}`);

    // 3) img alt
    const noAlt = [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).map((i) => i.src.slice(-40));
    if (noAlt.length) out.push(`img without alt: ${noAlt.slice(0, 3).join(", ")}`);

    // 4) başlıklar: tek h1, aşağı doğru seviye atlama yok
    const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => !h.closest("[hidden]") && getComputedStyle(h).display !== "none");
    const h1 = hs.filter((h) => h.tagName === "H1").length;
    if (h1 !== 1) out.push(`h1 count ${h1}`);
    let prev = 0;
    for (const h of hs) {
      const lv = Number(h.tagName[1]);
      if (prev && lv > prev + 1) { out.push(`heading skip h${prev}→h${lv} ("${h.textContent.trim().slice(0, 30)}")`); break; }
      prev = lv;
    }

    // 5) görünür metinde undefined/null/NaN
    const txt = document.body.innerText;
    const bad = txt.match(/.{0,25}\b(undefined|null|NaN|\[object Object\])\b.{0,25}/);
    if (bad) out.push(`bad text: "${bad[0].replace(/\s+/g, " ")}"`);
    for (const n of document.querySelectorAll("[href], [src], [alt], [aria-label], [title]")) {
      for (const at of ["href", "src", "alt", "aria-label", "title"]) {
        const v = n.getAttribute(at);
        if (v && /(^|[^a-z])(undefined|NaN)([^a-z]|$)|\/null(\/|$)/.test(v)) { out.push(`bad attr ${at}="${v.slice(0, 60)}"`); break; }
      }
    }

    // 6) satın alma bağlantıları
    for (const a of document.querySelectorAll("a[data-store]")) {
      const rel = (a.getAttribute("rel") || "").split(/\s+/);
      let okUrl = false;
      try { okUrl = new URL(a.href).protocol === "https:"; } catch { /* invalid */ }
      if (!rel.includes("sponsored") || a.target !== "_blank" || !okUrl) {
        out.push(`buy link bad: rel="${a.getAttribute("rel")}" target="${a.target}" href="${a.getAttribute("href").slice(0, 50)}"`);
        break;
      }
    }
    return out;
  });
}

/* ---------------- route checks ---------------- */

async function catalogIds(page) {
  return page.evaluate(async (base) => {
    let r = await fetch(base + "js/data/beauty_catalog.json");
    if (!r.ok) r = await fetch(new URL("../js/data/beauty_catalog.json", base)); // alt dizinden servis edilirse
    const rows = await r.json();
    return rows.filter((r) => r.i).slice(0, 2).map((r) => r.id);
  }, BASE);
}

async function routeSuite(browser, devName, device, scheme) {
  const tag = `${devName}/${scheme}`;
  console.log(`\n▶ ${tag}`);
  const { ctx, page } = await newPage(browser, device, scheme);
  await open(page, "#/");
  const [hfId] = await catalogIds(page);

  const routes = [
    ["#/", async () => check(`${tag} home cards`, (await page.locator(".pcard").count()) > 0)],
    ["#/?q=karmin", async () => {
      const n = await page.locator(".pcard").count();
      const v = await page.inputValue("#homeQ");
      check(`${tag} search karmin`, n > 0 && v === "karmin", `cards=${n} value=${v}`);
    }],
    ["#/markalar", async () => check(`${tag} brands list`, (await page.locator('a[href^="#/marka/"]').count()) > 3)],
    ["#/marka/nyx", async () => check(`${tag} brand nyx`, /nyx/i.test(await page.locator("h1").innerText()))],
    ["#/urun/rare-soft-pinch-blush", async () => check(`${tag} product rare`, (await page.locator(".buy-main").count()) > 0 && /pinch/i.test(await page.locator("h1").innerText()))],
    ["#/urun/flormar-blush-on", async () => check(`${tag} product flormar`, (await page.locator("h1").count()) === 1)],
    [`#/urun/${hfId}`, async () => check(`${tag} archive product ${hfId}`, (await page.locator("h1").count()) === 1 && !/bulunamad/i.test(await page.locator("#app").innerText()))],
    ["#/urun/boyle-bir-urun-yok-123", async () => check(`${tag} unknown product`, /bulunamad|bulamad/i.test(await page.locator("#app").innerText()))],
    ["#/analiz", async () => {
      await page.locator("[data-preset]").first().click();
      await page.waitForTimeout(300);
      const ok1 = (await page.locator("#analyzeResult .ring").count()) > 0;
      await page.fill("#analyzeInput", "Aqua, Glycerin, Niacinamide, Parfum, Phenoxyethanol, Methylparaben");
      await page.locator(".analyze-go").click();
      await page.waitForTimeout(300);
      const ok2 = /Methylparaben/i.test(await page.locator("#analyzeResult").innerText());
      await page.locator("[data-clear]").click();
      await page.locator(".analyze-go").click();
      await page.waitForTimeout(200);
      const ok3 = await page.locator("#analyzeMsg").isVisible();
      check(`${tag} analyze preset/custom/empty`, ok1 && ok2 && ok3, `preset=${ok1} custom=${ok2} emptyMsg=${ok3}`);
      // yeniden önayar sonucuyla denetle
      await page.locator("[data-preset]").first().click();
      await page.waitForTimeout(300);
    }],
    ["#/tara", async () => {
      // yerel barkod → ürün sayfası
      await page.fill("#scanCode", "8690001001028");
      await page.locator(".scan-manual button[type=submit]").click();
      await page.waitForFunction(() => location.hash.startsWith("#/urun/"), null, { timeout: 10000 }).catch(() => {});
      check(`${tag} scan local barcode → product`, page.url().includes("#/urun/flormar-silk-matte-lipstick"), page.url());
      await page.goBack();
      await ready(page);
      // çevrimiçi barkod (dış ağ yok) → ≤10 sn içinde Türkçe mesaj
      await page.fill("#scanCode", "4250947516027");
      const t0 = Date.now();
      await page.locator(".scan-manual button[type=submit]").click();
      const done = await page.waitForFunction(() => {
        const s = document.querySelector("[data-status]");
        return s && (s.dataset.tone === "error" || s.dataset.tone === "ok") && !document.querySelector(".scan-loading");
      }, null, { timeout: 10500 }).then(() => true).catch(() => false);
      const ms = Date.now() - t0;
      const msg = await page.locator("[data-status]").innerText();
      console.log(`  scan online barcode: ${ms} ms → "${msg}"`);
      check(`${tag} scan online barcode ≤10s with Turkish message`, done && ms <= 10000 && /[çğıöşüÇĞİÖŞÜ]/.test(msg), `${ms}ms "${msg}"`);
    }],
    ["#/sozluk", async () => check(`${tag} glossary`, (await page.locator('a[href^="#/sozluk/"]').count()) > 5)],
    ["#/sozluk/phenoxyethanol", async () => check(`${tag} glossary term`, /phenoxyethanol/i.test(await page.locator("#app").innerText()) && (await page.locator("h1").count()) === 1)],
    ["#/karsilastir", async () => check(`${tag} compare 0`, (await page.locator(".empty-state").count()) > 0)],
    ["#/karsilastir?ids=rare-soft-pinch-blush", async () => check(`${tag} compare 1`, (await page.locator(".compare-head").count()) >= 1)],
    ["#/karsilastir?ids=rare-soft-pinch-blush,flormar-blush-on", async () => check(`${tag} compare 2`, (await page.locator(".compare-head").count()) === 2)],
    ["#/favoriler", async () => check(`${tag} favorites`, (await page.locator("h1").count()) === 1)],
    ["#/boyle-bir-sayfa-yok", async () => check(`${tag} 404`, /bulamad/i.test(await page.locator("#app").innerText()))]
  ];

  for (const [hash, extra] of routes) {
    page._errors = [];
    try {
      await open(page, hash);
      await extra();
      const probs = await audit(page);
      check(`${tag} ${hash} audit`, probs.length === 0, probs.join(" ; "));
    } catch (err) {
      fail(`${tag} ${hash} crashed`, String(err.message).split("\n")[0]);
    }
    check(`${tag} ${hash} no JS errors`, page._errors.length === 0, page._errors.slice(0, 3).join(" | "));
  }
  if (page._blocked.size) console.log(`  (blocked external hosts: ${[...page._blocked].join(", ")})`);
  await ctx.close();
}

/* ---------------- behaviour checks ---------------- */

async function behaviourSuite(browser, devName, device) {
  const tag = `${devName}`;
  console.log(`\n▶ ${tag} behaviour`);
  const { ctx, page } = await newPage(browser, device, "light");

  // Back/forward: liste → ürün → geri → aynı liste
  await open(page, "#/?q=ruj");
  await page.locator(".pcard-link").nth(2).click();
  await page.waitForFunction(() => location.hash.startsWith("#/urun/"));
  await ready(page);
  await page.goBack();
  await ready(page);
  const backOk = (await page.evaluate(() => location.hash)) === "#/?q=ruj" && (await page.inputValue("#homeQ")) === "ruj" && (await page.locator(".pcard").count()) > 0;
  check(`${tag} back restores list`, backOk, await page.evaluate(() => location.hash));
  await page.goForward();
  await ready(page);
  check(`${tag} forward returns to product`, (await page.evaluate(() => location.hash)).startsWith("#/urun/"));

  // Ürün sayfasındaki "Geri" düğmesi
  await open(page, "#/?q=allık");
  await page.locator(".pcard-link").first().click();
  await ready(page);
  const backBtn = page.locator('[data-act="back"]');
  if (await backBtn.count()) {
    await backBtn.first().click();
    await ready(page);
    check(`${tag} in-app back button`, (await page.evaluate(() => decodeURIComponent(location.hash))) === "#/?q=allık");
  }

  // Tema düğmesi kalıcı
  await open(page, "#/");
  await page.click("#themeToggle");
  const t1 = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.reload();
  await ready(page);
  const t2 = await page.evaluate(() => document.documentElement.dataset.theme);
  check(`${tag} theme toggle persists`, t1 === "dark" && t2 === "dark", `${t1} → ${t2}`);
  await page.click("#themeToggle");
  check(`${tag} theme toggle back to light`, (await page.evaluate(() => document.documentElement.dataset.theme)) === "light");

  // Klavye: Tab arama kutusuna ve Satın al'a ulaşır, odak görünür
  const tabTo = async (selector, max) => {
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    await page.locator("body").focus().catch(() => {});
    for (let i = 0; i < max; i++) {
      await page.keyboard.press("Tab");
      const hit = await page.evaluate((s) => {
        const a = document.activeElement;
        if (!a || !a.matches(s)) return null;
        const cs = getComputedStyle(a);
        const visible = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none");
        const wrap = a.closest(".search");
        const wcs = wrap ? getComputedStyle(wrap) : null;
        const wrapVisible = wcs && ((wcs.outlineStyle !== "none" && parseFloat(wcs.outlineWidth) > 0) || (wcs.boxShadow && wcs.boxShadow !== "none"));
        return { visible: visible || !!wrapVisible };
      }, selector);
      if (hit) return { reached: i + 1, ...hit };
    }
    return null;
  };
  await open(page, "#/");
  const s = await tabTo("#homeQ", 30);
  check(`${tag} Tab reaches search with visible focus`, !!s && s.visible, JSON.stringify(s));
  await open(page, "#/urun/rare-soft-pinch-blush");
  const b = await tabTo(".buy-main", 60);
  check(`${tag} Tab reaches Satın al with visible focus`, !!b && b.visible, JSON.stringify(b));
  await ctx.close();

  // Yavaş/yanıtsız ağ: dış istekler hiç yanıt vermezse barkod sorgusu yine ≤10 sn'de Türkçe mesajla bitmeli.
  const { ctx: c2, page: p2 } = await newPage(browser, device, "light");
  await c2.unroute("**/*");
  await c2.route("**/*", (r) => {
    const host = new URL(r.request().url()).host;
    if (host === BASE_HOST) return r.continue();
    if (/openbeautyfacts|openproductsfacts|openfoodfacts|upcitemdb/.test(host)) return undefined; // barkod API'leri: asılı kalır
    return r.abort("blockedbyclient");
  });
  await open(p2, "#/tara");
  await p2.fill("#scanCode", "3600531469498");
  const t0 = Date.now();
  await p2.locator(".scan-manual button[type=submit]").click();
  const done = await p2.waitForFunction(() => {
    const s = document.querySelector("[data-status]");
    return s && (s.dataset.tone === "error" || s.dataset.tone === "ok") && !document.querySelector(".scan-loading");
  }, null, { timeout: 12000 }).then(() => true).catch(() => false);
  const ms = Date.now() - t0;
  const msg = await p2.locator("[data-status]").innerText();
  console.log(`  scan with hanging network: ${ms} ms → "${msg}"`);
  check(`${tag} scan with hanging network ≤10s`, done && ms <= 10000 && /[çğıöşüÇĞİÖŞÜ]/.test(msg), `${ms}ms "${msg}"`);
  await c2.close();
}

/* ---------------- user journeys ---------------- */

async function journey(browser, devName, device, name, fn) {
  const { ctx, page } = await newPage(browser, device, "light");
  const t0 = Date.now();
  let ok = false, detail = "";
  try {
    detail = (await fn(page, ctx)) || "";
    ok = true;
  } catch (err) {
    detail = String(err.message).split("\n")[0];
  }
  const ms = Date.now() - t0;
  journeys.push({ name: `${devName}: ${name}`, ms, ok });
  check(`${devName} journey "${name}" (${ms} ms)`, ok && page._errors.length === 0, detail + (page._errors.length ? " errors: " + page._errors.slice(0, 2).join(" | ") : ""));
  await ctx.close();
}

function assert(c, m) { if (!c) throw new Error(m); }

async function journeys_(browser, devName, device) {
  console.log(`\n▶ ${devName} journeys`);

  await journey(browser, devName, device, "find a lipstick without carmine and buy it", async (page, ctx) => {
    await open(page, "#/");
    await page.fill("#homeQ", "ruj -karmin");
    await page.waitForFunction(() => decodeURIComponent(location.hash).includes("ruj -karmin") || decodeURIComponent(location.hash).includes("ruj+-karmin"), null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(600);
    await page.locator(".pcard-link").first().click();
    await ready(page);
    const txt = await page.locator("#app").innerText();
    assert(!/carmine|CI 75470/i.test(txt), "opened product contains carmine");
    assert(/ruj|lipstick|lip/i.test(txt), "opened product is not a lipstick");
    const buy = page.locator(".buy-main").first();
    const href = await buy.getAttribute("href");
    // Mağaza alan adı sandbox'ta engelli: yeni sekmenin açıldığını ve hedefin https olduğunu doğrula.
    const [popup] = await Promise.all([ctx.waitForEvent("page", { timeout: 5000 }), buy.click()]);
    assert(popup && /^https:\/\//.test(href), "buy href " + href);
    return new URL(href).host;
  });

  await journey(browser, devName, device, "pregnant → find a foundation", async (page) => {
    await open(page, "#/");
    await page.locator('[data-chips="home"] .chip[data-chip="hamile"]').click();
    await page.fill("#homeQ", "fondöten");
    await page.waitForTimeout(700);
    assert(/hamile/.test(await page.evaluate(() => location.hash)), "filter not in URL");
    const n = await page.locator(".pcard").count();
    assert(n > 0, "no pregnancy-safe foundations");
    await page.locator(".pcard-link").first().click();
    await ready(page);
    const txt = await page.locator("#app").innerText();
    assert(/fond|foundation/i.test(txt), "not a foundation");
    assert(!/hamilelikte kaçın/i.test(txt), "pregnancy warning on result");
    return `${n} results`;
  });

  await journey(browser, devName, device, "paste INCI → understand result → open an ingredient", async (page) => {
    await open(page, "#/analiz");
    await page.fill("#analyzeInput", "Aqua, Glycerin, Niacinamide, Parfum, Phenoxyethanol, Retinol");
    await page.locator(".analyze-go").click();
    await page.waitForSelector("#analyzeResult .ring");
    const summary = page.locator("#analyzeResult .ing summary").filter({ hasText: /Phenoxyethanol/ }).first();
    await summary.click();
    await page.locator("#analyzeResult .ing details[open] .ing-more").first().click();
    await ready(page);
    const h = await page.locator("h1").innerText();
    assert(/#\/sozluk\/phenoxyethanol/.test(page.url()) && /phenoxyethanol/i.test(await page.locator("#app").innerText()), "glossary page " + page.url());
    return h;
  });

  await journey(browser, devName, device, "compare two products", async (page) => {
    await open(page, "#/urun/rare-soft-pinch-blush");
    await page.locator('.product-act[data-act="compare"]').click();
    await open(page, "#/urun/flormar-blush-on");
    await page.locator('.product-act[data-act="compare"]').click();
    const link = page.locator('.toast a[href^="#/karsilastir"], a[href^="#/karsilastir?ids="]').first();
    await link.click();
    await ready(page);
    const n = await page.locator(".compare-head").count();
    assert(n === 2, "compare columns " + n);
    return "2 columns";
  });

  await journey(browser, devName, device, "favorite then find it in Favoriler", async (page) => {
    await open(page, "#/urun/nyx-fat-oil-lip");
    await page.locator('.product-act[data-act="fav"]').click();
    await page.locator('.header-actions a[href="#/favoriler"]').click();
    await ready(page);
    const ok = await page.locator('#app a[href="#/urun/nyx-fat-oil-lip"]').count();
    assert(ok > 0, "favorite not listed");
    return "listed";
  });
}

/* ---------------- screenshots ---------------- */

async function screenshots(browser) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  for (const [devName, device] of [["phone", PHONE], ["desktop", DESKTOP]]) {
    const { ctx, page } = await newPage(browser, device, "light");
    for (const [n, h] of [["home", "#/"], ["product", "#/urun/rare-soft-pinch-blush"], ["analyze", "#/analiz"]]) {
      await open(page, h);
      if (n === "analyze") { await page.locator("[data-preset]").first().click(); await page.waitForTimeout(300); }
      await page.screenshot({ path: `${SHOTS}/${devName}-${n}.png`, fullPage: false });
    }
    await ctx.close();
  }
  console.log(`\nScreenshots → ${SHOTS}`);
}

/* ---------------- main ---------------- */

const t0 = Date.now();
const browser = await chromium.launch();
try {
  for (const [devName, device] of [["phone", PHONE], ["desktop", DESKTOP]]) {
    for (const scheme of ["light", "dark"]) await routeSuite(browser, devName, device, scheme);
    await behaviourSuite(browser, devName, device);
    await journeys_(browser, devName, device);
  }
  await screenshots(browser);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log("\n──────── E2E özet ────────");
console.log(`Hedef: ${BASE}`);
console.log(`Kontroller: ${results.length - failed.length} geçti, ${failed.length} başarısız (${((Date.now() - t0) / 1000).toFixed(1)} sn)`);
console.log("Yolculuklar:");
for (const j of journeys) console.log(`  ${j.ok ? "✓" : "✗"} ${j.name}: ${j.ms} ms`);
if (failed.length) {
  console.log("Başarısız:");
  for (const f of failed) console.log(`  ✗ ${f.name}${f.detail ? " — " + f.detail : ""}`);
}
process.exit(failed.length ? 1 : 0);
