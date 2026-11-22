/**
 * MakeYUP — #/favoriler: saved products (localStorage) + "Son baktıkların".
 */
import { setTitle } from "../router.js";
import { findProduct } from "../state.js";
import { getFavorites, getRecent, toggleFavorite, onChange } from "../features/favorites.js";
import { productGrid, sectionHeader, emptyState, escapeHtml, icon, skeletonCards } from "../ui/components.js";

const load = async (ids) => (await Promise.all(ids.map((id) => findProduct(id).catch(() => null)))).filter(Boolean);

function heartBtn(p) {
  const name = `${p.brand ? p.brand + " " : ""}${p.name || ""}`;
  return `<button type="button" class="favorites-heart" data-unfav="${escapeHtml(p.id)}" aria-pressed="true" aria-label="${escapeHtml(name)}: favorilerden çıkar">${icon("heart", { size: 20 })}</button>`;
}

async function favoritesView({ el, signal }) {
  setTitle("Favorilerim");
  el.innerHTML = `
    <header class="page-head favorites-head">
      <div class="eyebrow">Kaydettiklerin</div>
      <h1>Favorilerim</h1>
      <p>Kalbe dokunduğun ürünler bu cihazda saklanır.</p>
    </header>
    <div data-favs>${skeletonCards(2)}</div>
    <div data-undo class="favorites-undo-wrap" aria-live="polite"></div>
    <div data-recent></div>`;
  const favBox = el.querySelector("[data-favs]");
  const recentBox = el.querySelector("[data-recent]");
  const undoBox = el.querySelector("[data-undo]");
  let run = 0;

  async function render() {
    const my = ++run;
    const [favs, recent] = await Promise.all([load(getFavorites()), load(getRecent(8))]);
    if (signal.aborted || my !== run) return;
    if (!favs.length) {
      favBox.innerHTML = `<div class="panel favorites-empty">${emptyState({
        icon: "heart",
        title: "Henüz favorin yok",
        text: "Bir ürünün sayfasında kalbe dokun; burada seni beklesin.",
        action: { href: "#/", label: "Keşfet'te ürün ara" }
      })}</div>`;
    } else {
      favBox.innerHTML = `<p class="favorites-count" role="status"><b>${favs.length}</b> ürün kayıtlı</p>${productGrid(favs)}`;
      favBox.querySelectorAll(".pcard").forEach((card) => {
        const p = favs.find((x) => String(x.id) === card.dataset.id);
        if (p) card.insertAdjacentHTML("beforeend", heartBtn(p));
      });
    }
    const favIds = new Set(favs.map((p) => String(p.id)));
    const rec = recent.filter((p) => !favIds.has(String(p.id))).slice(0, 4);
    recentBox.innerHTML = rec.length ? `<section>${sectionHeader("Son baktıkların")}${productGrid(rec)}</section>` : "";
  }

  favBox.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-unfav]");
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.unfav;
    toggleFavorite(id); // onChange re-renders
    undoBox.innerHTML = `<div class="favorites-undo" role="status"><span>Favorilerden çıkarıldı.</span><button type="button" class="btn btn-quiet" data-undo-id="${escapeHtml(id)}">Geri al</button></div>`;
  });
  undoBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-undo-id]");
    if (!b) return;
    toggleFavorite(b.dataset.undoId);
    undoBox.innerHTML = "";
  });

  const off = onChange(() => render());
  await render();
  return () => off();
}

export default {
  routes: { "#/favoriler": favoritesView }
};
