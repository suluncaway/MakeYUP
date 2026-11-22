/**
 * MakeYUP v2 — app entry: theme, routes, global delegated listeners.
 * View modules live in ./views/<name>.js and default-export { routes: { "#/...": handler }, css?: false }.
 */
import { route, start, onRouteChange, setNotFound, match, navigate } from "./router.js";
import { ROOT } from "./state.js";
import { placeholderHandler } from "./views/placeholder.js";
import { trackClick, affiliateDisclosure } from "../../js/affiliate.js";
import { loadCosingIndex } from "../../js/analyzer.js";

/* ------------------------------------------------------------------
 * Engine modules fetch "js/data/…" relative to the document. v2/ lives one
 * level deeper, so rewrite those requests to the repository root.
 * ------------------------------------------------------------------ */
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (typeof input === "string" && /^(\.\/)?js\/data\//.test(input)) input = ROOT + input.replace(/^\.\//, "");
  return nativeFetch(input, init);
};

/* ------------------------------------------------------------------
 * Theme
 * ------------------------------------------------------------------ */
const THEME_KEY = "myup-theme";
const root = document.documentElement;
const darkMq = window.matchMedia("(prefers-color-scheme: dark)");

function isDark() {
  const t = root.getAttribute("data-theme");
  return t ? t === "dark" : darkMq.matches;
}

function syncThemeUi() {
  const btn = document.getElementById("themeToggle");
  if (btn) btn.setAttribute("aria-label", isDark() ? "Açık temaya geç" : "Koyu temaya geç");
  const meta = document.getElementById("metaThemeColor");
  if (meta) meta.setAttribute("content", getComputedStyle(root).getPropertyValue("--bg").trim() || "#FAF6F1");
}

function initTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  } catch { /* storage blocked */ }
  syncThemeUi();
  darkMq.addEventListener?.("change", syncThemeUi);
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    syncThemeUi();
  });
}

/* ------------------------------------------------------------------
 * Views: lazy-loaded modules with placeholder fallback
 * ------------------------------------------------------------------ */
export const VIEWS = {
  home: ["#/"],
  product: ["#/urun/:id"],
  analyze: ["#/analiz"],
  scan: ["#/tara"],
  brands: ["#/markalar", "#/marka/:id"],
  glossary: ["#/sozluk", "#/sozluk/:inci"],
  compare: ["#/karsilastir"],
  favorites: ["#/favoriler"]
};

const loaded = new Map(); // name → Promise<{ routes, ok }>

function injectCss(name) {
  const href = `css/views/${name}.css`;
  if (document.querySelector(`link[data-view-css="${name}"]`)) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.viewCss = name;
    const done = () => resolve();
    link.onload = done;
    link.onerror = () => { link.remove(); done(); };
    setTimeout(done, 1500); // never block rendering for long
    document.head.appendChild(link);
  });
}

function loadView(name) {
  if (!loaded.has(name)) {
    const p = import(`./views/${name}.js`)
      .then(async (mod) => {
        const def = mod.default || {};
        const routes = def.routes && typeof def.routes === "object" ? def.routes : {};
        if (!Object.keys(routes).length) throw new Error(`views/${name}.js exports no routes`);
        if (def.css !== false) await injectCss(name);
        for (const [pattern, handler] of Object.entries(routes)) route(pattern, handler);
        return { ok: true };
      })
      .catch((err) => {
        console.warn(`[MakeYUP] views/${name}.js yüklenemedi, yer tutucu gösteriliyor.`, err?.message || err);
        const fallback = placeholderHandler(name);
        for (const pattern of VIEWS[name] || []) route(pattern, fallback);
        return { ok: false };
      });
    loaded.set(name, p);
  }
  return loaded.get(name);
}

function registerLazyRoutes() {
  for (const [name, patterns] of Object.entries(VIEWS)) {
    for (const pattern of patterns) {
      const stub = async (ctx) => {
        await loadView(name);
        const m = match(ctx.path);
        if (m && m.route.handler !== stub) {
          Object.assign(ctx.params, m.params);
          return m.route.handler(ctx);
        }
        return placeholderHandler(name)(ctx);
      };
      route(pattern, stub);
    }
  }
}

// Unknown path: views may declare extra routes, so load them all once, then retry.
let allViewsTried = false;
setNotFound(async (ctx) => {
  if (!allViewsTried) {
    allViewsTried = true;
    await Promise.all(Object.keys(VIEWS).map(loadView));
    const m = match(ctx.path);
    if (m) {
      Object.assign(ctx.params, m.params);
      return m.route.handler(ctx);
    }
  }
  const { el } = ctx;
  const { emptyState } = await import("./ui/components.js");
  const { setTitle } = await import("./router.js");
  setTitle("Sayfa bulunamadı");
  el.innerHTML = `<section class="not-found">${emptyState({
    icon: "compass",
    title: "Bu sayfayı bulamadık",
    text: "Bağlantı eski ya da hatalı olabilir. Keşfet'ten devam edebilirsin.",
    action: { href: "#/", label: "Ana sayfaya dön" }
  })}</section>`;
});

/* ------------------------------------------------------------------
 * Navigation highlight (top nav, bottom tabs, favorites button)
 * ------------------------------------------------------------------ */
function sectionOf(path) {
  if (path === "#/") return "kesfet";
  const seg = path.split("/")[1] || "";
  return { markalar: "markalar", marka: "markalar", tara: "tara", analiz: "analiz", sozluk: "sozluk", favoriler: "favoriler" }[seg] || "";
}

onRouteChange((info) => {
  const sec = sectionOf(info.path);
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === sec) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
});

/* ------------------------------------------------------------------
 * Global delegated listeners
 * ------------------------------------------------------------------ */
function initDelegates() {
  // Affiliate click tracking (buy buttons emitted by components carry data-store/data-product).
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[data-store]");
    if (a) {
      try { trackClick(a.dataset.store, a.dataset.product); } catch { /* never block the link */ }
    }
  });

  // Chips: toggle aria-pressed and emit "chipchange" on the row.
  document.addEventListener("click", (e) => {
    const chip = e.target.closest && e.target.closest("[data-chips] .chip");
    if (!chip) return;
    const row = chip.closest("[data-chips]");
    const single = row.dataset.mode === "single";
    const wasOn = chip.getAttribute("aria-pressed") === "true";
    if (single) {
      row.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === chip ? "true" : "false"));
    } else {
      chip.setAttribute("aria-pressed", wasOn ? "false" : "true");
    }
    const selected = [...row.querySelectorAll('.chip[aria-pressed="true"]')].map((c) => c.dataset.chip);
    row.dispatchEvent(new CustomEvent("chipchange", {
      bubbles: true,
      detail: { name: row.dataset.chips, id: chip.dataset.chip, active: chip.getAttribute("aria-pressed") === "true", selected }
    }));
  });

  // Broken product photos → monogram tile.
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img && img.tagName === "IMG" && img.hasAttribute("data-fallback")) {
      img.parentElement?.classList.add("is-noimg");
      img.remove();
    }
  }, true);

  // Search forms never reload the page.
  document.addEventListener("submit", (e) => {
    if (e.target.matches && e.target.matches("form[data-search]")) e.preventDefault();
  });

  // Skip link: "#app" is not a route — just move focus.
  document.querySelector("[data-skip]")?.addEventListener("click", (e) => {
    e.preventDefault();
    const app = document.getElementById("app");
    app.focus();
    app.scrollIntoView();
  });
}

/* ------------------------------------------------------------------
 * Boot
 * ------------------------------------------------------------------ */
function boot() {
  initTheme();
  initDelegates();
  const disc = document.getElementById("footDisclosure");
  try { if (disc) disc.textContent = affiliateDisclosure(); } catch { /* keep static text */ }
  registerLazyRoutes();
  start();
  // CoSIng metadata (CAS/EC/function) for ingredient rows; views may listen for this event.
  loadCosingIndex().finally(() => window.dispatchEvent(new CustomEvent("makeyup:cosing-ready")));
}

boot();

// Handy for debugging in the console.
window.MakeYUP = { navigate };
