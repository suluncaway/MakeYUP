/**
 * MakeYUP — tiny hash router.
 *
 *   route("#/urun/:id", async ({ params, query, el, signal, isBack }) => {
 *     el.innerHTML = "…";
 *     return () => { /* optional cleanup, runs before the next route *\/ };
 *   });
 *   start();
 *
 * - Every screen is a URL (#/path?key=value). Links are plain <a href="#/...">.
 * - Opening a page = new history entry (navigate / normal link).
 * - Filter / search changes = updateQuery(): rewrites the URL query WITHOUT a new
 *   history entry and WITHOUT re-rendering.
 * - Scroll position is stored per history entry, so Back restores the list where it was.
 */

const DEFAULT_TITLE = "MakeYUP · Kozmetik içerik analizi";
const routes = [];
const listeners = new Set();

let notFoundHandler = defaultNotFound;
let cleanup = null;
let token = 0;
let controller = null;
let started = false;
let firstDispatch = true;
let lastIdx = 0; // position of the current entry inside this app session (for back())
let currentInfo = { hash: "#/", path: "#/", params: {}, query: {}, pattern: null };

/* ---------------- patterns ---------------- */

function normalizePath(path) {
  let p = String(path || "").trim();
  if (!p || p === "#") return "#/";
  if (!p.startsWith("#")) p = "#" + p;
  if (!p.startsWith("#/")) p = "#/" + p.slice(1);
  if (p.length > 2 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function compile(pattern) {
  const keys = [];
  const src = normalizePath(pattern)
    .split("/")
    .map((seg) => {
      if (seg.startsWith(":")) {
        keys.push(seg.slice(1));
        return "([^/]+)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { keys, re: new RegExp("^" + src + "$") };
}

/** Registers (or replaces) a route. Pattern examples: "#/", "#/urun/:id", "#/sozluk/:inci". */
export function route(pattern, handler) {
  if (typeof handler !== "function") throw new TypeError("route(): handler must be a function");
  const norm = normalizePath(pattern);
  const existing = routes.findIndex((r) => r.pattern === norm);
  const entry = { pattern: norm, handler, ...compile(norm) };
  if (existing >= 0) routes[existing] = entry;
  else routes.push(entry);
}

/** Returns { route, params } for a path ("#/urun/x"), or null. */
export function match(path) {
  const p = normalizePath(path);
  for (const r of routes) {
    const m = r.re.exec(p);
    if (!m) continue;
    const params = {};
    r.keys.forEach((k, i) => {
      try { params[k] = decodeURIComponent(m[i + 1]); } catch { params[k] = m[i + 1]; }
    });
    return { route: r, params };
  }
  return null;
}

/** Splits "#/a/b?x=1&y=2" into { hash, path:"#/a/b", query:{x:"1",y:"2"} }. */
export function parseHash(hash = location.hash) {
  const raw = hash || "#/";
  const qi = raw.indexOf("?");
  const path = normalizePath(qi >= 0 ? raw.slice(0, qi) : raw);
  const query = {};
  if (qi >= 0) new URLSearchParams(raw.slice(qi + 1)).forEach((v, k) => { query[k] = v; });
  return { hash: raw, path, query };
}

/** Builds "#/path?x=1" from a path and a query object (empty / null values are dropped). */
export function buildHash(path, query = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (v == null || v === "" || v === false || (Array.isArray(v) && !v.length)) continue;
    sp.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const qs = sp.toString();
  return normalizePath(path) + (qs ? "?" + qs : "");
}

/* ---------------- public API ---------------- */

export function setNotFound(handler) { notFoundHandler = handler; }

/** Info about the active route: { hash, path, pattern, params, query }. */
export function current() { return { ...currentInfo, params: { ...currentInfo.params }, query: { ...currentInfo.query } }; }

/** Sets document.title as "<text> · MakeYUP" (or the default title when empty). */
export function setTitle(text) {
  document.title = text ? `${text} · MakeYUP` : DEFAULT_TITLE;
}

/** Go to a hash. { replace:true } replaces the current history entry (e.g. scanner hit → product). */
export function navigate(hash, { replace = false } = {}) {
  const target = hash.startsWith("#") ? hash : "#" + hash;
  saveScroll();
  if (replace) {
    const idx = history.state && typeof history.state.idx === "number" ? history.state.idx : 0;
    history.replaceState({ idx }, "", target);
    dispatch();
  } else if (location.hash === target) {
    dispatch();
  } else {
    location.hash = target;
  }
}

/**
 * Update the query of the current URL without a new history entry and without re-rendering.
 * Pass the full desired query object, or { merge:true } to merge with the existing query.
 *   updateQuery({ q: "ruj", f: ["vegan","hamile"] })
 */
export function updateQuery(query, { merge = false } = {}) {
  const next = merge ? { ...currentInfo.query, ...query } : query;
  const hash = buildHash(currentInfo.path, next);
  try { history.replaceState(history.state, "", hash); } catch { /* ignore */ }
  currentInfo = { ...currentInfo, hash, query: parseHash(hash).query };
}

/** Back inside the app; falls back to `fallback` when the page was opened cold (deep link). */
export function back(fallback = "#/") {
  const idx = history.state && typeof history.state.idx === "number" ? history.state.idx : 0;
  if (idx > 0) history.back();
  else navigate(fallback, { replace: true });
}

/** Subscribe to route changes: fn(currentInfo). Returns an unsubscribe function. */
export function onRouteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Re-run the current route handler (e.g. after data that a view depends on arrived). */
export function refresh() { dispatch({ keepScroll: true }); }

export function start() {
  if (started) return;
  started = true;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("hashchange", () => dispatch());
  // Save scroll position right before an in-app link is followed.
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (a && !e.defaultPrevented) saveScroll();
  }, true);
  let t = 0;
  window.addEventListener("scroll", () => {
    clearTimeout(t);
    t = setTimeout(saveScroll, 300);
  }, { passive: true });
  window.addEventListener("pagehide", saveScroll);
  dispatch();
}

/* ---------------- internals ---------------- */

function saveScroll() {
  try {
    const st = history.state && typeof history.state === "object" ? history.state : {};
    if (st.scrollY === window.scrollY) return;
    history.replaceState({ ...st, scrollY: window.scrollY }, "");
  } catch { /* Safari rate limit etc. */ }
}

async function dispatch({ keepScroll = false } = {}) {
  const rawHash = location.hash || "#/";
  // Non-route fragments such as "#app" (skip link) are not routes: ignore them.
  if (rawHash !== "#" && rawHash !== "#/" && !rawHash.startsWith("#/")) return;

  const { hash, path, query } = parseHash(rawHash);
  const m = match(path);
  const el = document.getElementById("app");
  const my = ++token;

  if (cleanup) {
    try { cleanup(); } catch (err) { console.error(err); }
    cleanup = null;
  }
  if (controller) controller.abort();
  controller = new AbortController();

  const saved = history.state && typeof history.state.scrollY === "number" ? history.state.scrollY : null;
  // Number each history entry so back() knows whether there is an in-app page behind us.
  try {
    const st = history.state && typeof history.state === "object" ? history.state : null;
    if (!st || typeof st.idx !== "number") {
      lastIdx = firstDispatch ? 0 : lastIdx + 1;
      history.replaceState({ ...(st || {}), idx: lastIdx }, "");
    } else {
      lastIdx = st.idx;
    }
  } catch { /* ignore */ }
  const restoreY = keepScroll ? window.scrollY : saved;
  if (restoreY == null) window.scrollTo(0, 0);

  currentInfo = { hash, path, query, params: m ? m.params : {}, pattern: m ? m.route.pattern : null };
  setTitle("");
  for (const fn of listeners) {
    try { fn(current()); } catch (err) { console.error(err); }
  }

  const ctx = { params: currentInfo.params, query: { ...query }, el, path, hash, signal: controller.signal, isBack: saved != null };
  el.setAttribute("aria-busy", "true");
  let result;
  try {
    result = await (m ? m.route.handler(ctx) : notFoundHandler(ctx));
  } catch (err) {
    if (err && err.name === "AbortError") return;
    console.error(err);
    if (my === token) renderError(el);
  }

  if (my !== token) {
    if (typeof result === "function") { try { result(); } catch { /* ignore */ } }
    return;
  }
  cleanup = typeof result === "function" ? result : null;
  el.removeAttribute("aria-busy");

  if (restoreY != null) {
    // Wait one frame so the new content has a height.
    requestAnimationFrame(() => window.scrollTo(0, restoreY));
  }
  if (!firstDispatch && !keepScroll) {
    try { el.focus({ preventScroll: true }); } catch { el.focus(); }
  }
  firstDispatch = false;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function defaultNotFound({ el }) {
  setTitle("Sayfa bulunamadı");
  el.innerHTML = `
    <section class="not-found">
      <div class="empty-state">
        <div class="empty-ic" aria-hidden="true">?</div>
        <h1 class="empty-title">Bu sayfayı bulamadık</h1>
        <p class="empty-text">Bağlantı eski ya da hatalı olabilir: <code>${esc(location.hash)}</code></p>
        <a class="btn btn-primary" href="#/">Ana sayfaya dön</a>
      </div>
    </section>`;
}

function renderError(el) {
  setTitle("Bir sorun oluştu");
  el.removeAttribute("aria-busy");
  el.innerHTML = `
    <section class="route-error">
      <div class="empty-state">
        <div class="empty-ic" aria-hidden="true">!</div>
        <h1 class="empty-title">Bir şeyler ters gitti</h1>
        <p class="empty-text">Sayfa yüklenemedi. Lütfen tekrar dene.</p>
        <a class="btn btn-primary" href="#/">Ana sayfaya dön</a>
      </div>
    </section>`;
}
