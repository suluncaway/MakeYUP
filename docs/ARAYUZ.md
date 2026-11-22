# MakeYUP UI: shell and contract for view authors

The UI is a zero-build, vanilla ES-module single-page app served from the site root (it was built under `/v2/`; `v2/index.html` now only redirects old links to `../#/…`).
Open it at `http://localhost:8802/` (`cd MakeYUP && python3 -m http.server 8802`). E2E tests: `node tests/e2e.mjs http://localhost:8802/`.

## File ownership

| Path | Owner |
|---|---|
| `index.html`, `css/tokens.css`, `css/base.css`, `css/components.css` | shell (agent 8) |
| `js/main.js`, `js/router.js`, `js/state.js`, `js/ui/components.js`, `js/views/placeholder.js` | shell (agent 8) |
| `js/views/<name>.js` and `css/views/<name>.css` | the view's agent |
| `js/analyzer.js`, `flags.js`, `search.js`, `barcode.js`, `globalApi.js`, `affiliate.js`, `js/data/`, `js/features/` | engine: import it, never copy it |

If you need a new shared component or a token, ask the shell owner. Don't fork one into your view.

## Views

`main.js` lazy-loads `js/views/<name>.js` when one of its routes is first visited:

| name | routes |
|---|---|
| home | `#/` |
| product | `#/urun/:id` |
| analyze | `#/analiz` |
| scan | `#/tara` |
| brands | `#/markalar`, `#/marka/:id` |
| glossary | `#/sozluk`, `#/sozluk/:inci` |
| compare | `#/karsilastir` |
| favorites | `#/favoriler` |

A view module default-exports its routes:

```js
// js/views/product.js
import { setTitle, back } from "../router.js";
import { findProduct, getAnalysis } from "../state.js";
import { scoreRing, buyPanel, emptyState, escapeHtml } from "../ui/components.js";

export default {
  // css: false,   // set this if you ship NO css/views/product.css (it avoids a 404)
  routes: {
    "#/urun/:id": async ({ params, query, el, signal, isBack }) => {
      const p = await findProduct(params.id);
      if (signal.aborted) return;                      // user already navigated away
      if (!p) { el.innerHTML = emptyState({ icon: "search", title: "Ürün bulunamadı", action: { href: "#/", label: "Ürün ara" } }); return; }
      setTitle(p.name);
      const a = getAnalysis(p);
      el.innerHTML = `<article class="product-page">${scoreRing(a.healthScore, a.healthStatus, { size: "lg" })}${buyPanel(p)}</article>`;
      const onX = () => {}; window.addEventListener("resize", onX);
      return () => window.removeEventListener("resize", onX);   // optional cleanup
    }
  }
};
```

- If a module is missing or throws while loading, its routes fall back to `views/placeholder.js` ("Bu sayfa hazırlanıyor"). The app never crashes.
- `css/views/<name>.css` is injected automatically the first time the view loads, unless the module sets `css: false`.
- A view may register extra routes beyond the table above. They are discovered when an unknown URL is opened (all views get loaded and the URL is matched again). It is better to tell the shell owner so the route can be added to `VIEWS` in `main.js`.

## Router (`js/router.js`)

| export | description |
|---|---|
| `route(pattern, handler)` | Registers a route; patterns look like `"#/urun/:id"`. |
| `start()` | Starts routing (called by `main.js`). |
| `navigate(hash, { replace })` | `replace: true` replaces the current entry. Use it for redirects only; a scanner hit opening a product should be a normal push so Back returns to the scanner. |
| `updateQuery(obj, { merge })` | **Use this for search/filter changes.** It rewrites `?q=…&f=…` with no new history entry and no re-render. |
| `back(fallback = "#/")` | In-app back. Goes to `fallback` when the page was opened cold from a deep link. |
| `current()` | Returns `{ hash, path, pattern, params, query }`. |
| `setTitle(text)` | Sets `document.title` to `"text · MakeYUP"`. It is reset on every navigation. |
| `onRouteChange(fn)`, `parseHash(hash)`, `buildHash(path, query)`, `refresh()` | Helpers. |

The handler receives `{ params, query, el, path, hash, signal, isBack }`, where `el` is `#app`. It may be async and may return a cleanup function.

On every navigation the router:
- runs the previous cleanup,
- aborts the previous `signal`,
- scrolls to the top, or restores the saved scroll position on Back/Forward (`isBack: true`, after your handler resolves),
- moves focus to `#app`.

Because scroll is restored after render, a list view should rebuild its state from `query`. That way Back shows the same search and filters at the same scroll position.

Rules:
- Opening a product or glossary term is a normal link (`<a href="#/urun/id">`), which pushes history.
- Typing in a search field or toggling a filter calls `updateQuery(...)`.
- Unknown routes show a friendly 404 with a link home.

## State (`js/state.js`)

Unified product shape:

```
{ id, brand, brandId, name, image|null, category, categoryLabel, ingredients, gtin, gtins, priceTier, source: "local"|"arsiv"|"online" }
```

Local products also keep their original fields (`description`, `skinTypes`, `pao`, `shades`…) plus `.analysis`.

| export | description |
|---|---|
| `getProducts()` | The 63 curated products, each with `.analysis` (synchronous, cached). |
| `getProduct(id)` | Looks up a local product only (synchronous). |
| `findProduct(id)` | Async. Checks local, then the archive (`hf-…`), then online results already seen. |
| `getBrands()` / `getBrand(id)` | Brands plus `productCount`, `veganCount`, `avgScore` and `products`. |
| `getCatalog()` | Async. Loads the 1,000-row archive once and never rejects. |
| `getAnalysis(productOrInci)` | Memoized `analyzeIngredients` result. Also accepts a raw INCI string or array. |
| `searchAll(q, filters, { limit, sources })` | Async. Returns `{ items, local, archive, total }`, with local results first. |
| `searchLocal(q, filters)` | Synchronous search over local products only. |
| `searchOnline(q)` | Optional Open Beauty Facts enrichment. **Never throws**; returns `{ items, error }`. Append its results after local ones and never blank the list because of it. On `error`, show a quiet inline note. |
| `makeFilter(filters)`, `compileSmartQuery(q)` | Building blocks for custom lists. |
| `ROOT`, `asset(path)`, `slugify(s)`, `CATEGORY_LABELS` | Helpers. |

`filters` is `{ category, vegan, minScore, pregnancySafe, parabenFree, fragranceFree, brandId }`.

How search matches:
- It looks only at brand, name, category, shades and the INCI list, never at free-text descriptions.
- Turkish and English synonyms work for ingredients (from the INGREDIENTS_DB aliases: karmin = carmine = ci 75470) and for categories (fondöten = foundation, ruj = lipstick, maskara, allık, far, kapatıcı, pudra…).
- A term prefixed with `-` excludes it.

## Components (`js/ui/components.js`)

Every component is a pure function that returns an **HTML string** with all dynamic text escaped. Escape anything you interpolate yourself with `escapeHtml`.

| function | notes |
|---|---|
| `escapeHtml(v)`, `enc(id)`, `productHref(p)`, `fmt(n)`, `initials(s)` | basics |
| `icon(name, { size, label })` | search, scan, leaf, alert, info, check, x, chevron, back, heart, compass, tag, flask, book, external, bag, share, compare, sparkle, box |
| `scoreRing(score, status, { size: "sm"\|"lg" })` | `status` is the analyzer `healthStatus` |
| `veganBadge(veganStatus)`, `priceTier("₺₺" \| 2)`, `riskPill(risk)` | badges |
| `statusTone(status)`, `riskInfo(risk)`, `scoreVerdict(score, status)` | mapping helpers |
| `productCard(p, { buy = true })` | The whole card links to `#/urun/<id>`. "Satın al" is a separate link and never triggers card navigation. Pass `{ buy: false }` for lists where buying belongs on the detail page. |
| `productGrid(list, { emptyText, buy })` | One-column rows on the phone (about 150 px each), 2 columns from 560 px, 3–4 columns on desktop. |
| `productImage(p, { cls })`, `primaryBuyLink(p)` | A missing or broken photo shows a brand monogram. |
| `chipRow([{id,label,active,dot}], { name, label, mode: "multi"\|"single", wrap })` | `main.js` toggles `aria-pressed` and fires a bubbling `chipchange` event whose `detail` is `{ name, id, active, selected }`. |
| `searchBox({ id, placeholder, value, label, scan })` | Listen to `input` on `#id`. Submitting never reloads the page. |
| `sectionHeader(title, { actionHref, actionText, level, count })` | |
| `emptyState({ icon, title, text, action: { href, label } \| { id, label }, level })` | `level: 1` renders the title as the page `<h1>` (use it when the empty state is the whole page, e.g. not found). |
| `skeletonCards(n)` | |
| `safetyList(analysis.safety)` | |
| `ingredientRow(item)`, `ingredientList(items)` | `<details>` rows showing CoSIng CAS/EC/function/comedogenic data and a link to `#/sozluk/<inci>`. |
| `veganCallout(analysis)`, `skinFit(analysis.skinProfile)` | |
| `buyPanel(p, { label })` | Primary store button, "Diğer mağazalar" and the disclosure. |
| `toast(html, { timeout })`, `hideToast()` | Bottom status message (`role="status"`). Escape dynamic text yourself; call `hideToast()` in your cleanup. |

Example:

```js
el.innerHTML = sectionHeader("Öne çıkanlar", { actionHref: "#/?k=dudak" }) + productGrid(list);
el.querySelector("[data-chips]")?.addEventListener("chipchange", (e) => updateQuery({ f: e.detail.selected }, { merge: true }));
```

Global behaviour that `main.js` provides for free:
- Affiliate tracking: any `a[data-store][data-product]` calls `trackClick`.
- Chip toggling.
- Image fallback for `img[data-fallback]`.
- Theme toggle.
- Active state for the nav and tabs.
- A `makeyup:cosing-ready` window event once the CoSIng index has loaded. Re-render ingredient rows on it if you need CAS/EC data on first paint.
- Service-worker registration (HTTPS only) and `?v=` cache busting of view CSS (taken from `js/main.js?v=…` in `index.html`).

## CSS conventions

- **Use tokens only** (`var(--accent)`, `var(--surface)`, `var(--r-lg)`, `var(--s-4)`, `var(--tap)`…). Dark mode then works automatically, with no per-view dark rules.
- **Prefix every class with the view name**: `.home-*`, `.product-*`, `.analyze-*`, `.scan-*`, `.brands-*`, `.glossary-*`, `.compare-*`, `.favorites-*`. Never restyle shared classes globally. If a shared component needs a variant, ask the shell owner.
- Make every tap target at least 44 px tall (`min-height: var(--tap)`).
- Never use `text-transform: uppercase` on brand, product or ingredient names: the Turkish locale turns i into İ.
- Headings and product names use Fraunces (`var(--serif)`); the UI uses Manrope (`var(--sans)`).
- Design mobile first at 390 px. The desktop breakpoint is `@media (min-width: 760px)`, where the bottom tab bar hides and the top nav appears.
- Avoid horizontal page overflow: use `min-width: 0` on grid/flex children and `overflow-wrap: anywhere` for INCI strings.
- `#app` already has the page gutter and max width, so views don't need `.wrap`. `.panel` is the white rounded report card from prototype A.
