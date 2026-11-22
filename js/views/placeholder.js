/**
 * Fallback views used by main.js when a real view module (views/<name>.js) is missing
 * or fails to load. Also serves as a minimal example of the view contract.
 */
import { setTitle } from "../router.js";
import { getProducts } from "../state.js";
import { productGrid, sectionHeader, searchBox, chipRow, emptyState } from "../ui/components.js";

const TITLES = {
  home: "Keşfet",
  product: "Ürün raporu",
  analyze: "İçerik analizi",
  scan: "Barkod tara",
  brands: "Markalar",
  glossary: "Sözlük",
  compare: "Karşılaştır",
  favorites: "Favorilerim"
};

/** Demo home: hero + search + chips + the first 6 products. */
function demoHome({ el }) {
  setTitle("");
  el.innerHTML = `
    <section class="ph-hero">
      <div class="eyebrow">İçerik analizi</div>
      <h1>Cildine ne sürdüğünü bil.</h1>
      <p>İçerik listesini yapıştır ya da barkodu tara; sağlık puanı, vegan durumu ve uyarılar saniyeler içinde.</p>
      ${searchBox({ id: "phSearch" })}
      ${chipRow(
        [
          { id: "all", label: "Tümü", active: true },
          { id: "vegan", label: "Vegan", dot: "vegan" },
          { id: "hamile", label: "Hamileliğe uygun" },
          { id: "parfumsuz", label: "Parfümsüz" },
          { id: "parabensiz", label: "Parabensiz" }
        ],
        { name: "demo", label: "Filtreler", mode: "single" }
      )}
    </section>
    ${sectionHeader("Öne çıkanlar", { actionHref: "#/markalar", actionText: "Tümünü gör" })}
    ${productGrid(getProducts().slice(0, 6))}`;
}

/** Returns a handler that renders "Bu sayfa hazırlanıyor" for the given view name. */
export function placeholderHandler(name) {
  if (name === "home") return demoHome;
  return ({ el }) => {
    const title = TITLES[name] || "Sayfa";
    setTitle(title);
    el.innerHTML = `<section class="soon">${emptyState({
      icon: "sparkle",
      title: `${title}: bu sayfa hazırlanıyor`,
      text: "Çok yakında burada olacak.",
      action: { href: "#/", label: "Keşfet'e dön" }
    })}</section>`;
  };
}

export default { routes: {} };
