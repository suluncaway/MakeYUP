# Yeni Özellikler (büyüme modülleri)

Tümü bağımlılıksız ES modülü; UI'dan bağımsızdır, DOM'a dokunmaz (paylaşım yedeği hariç). Yeni arayüz bunları çağırır.

## 1. Daha temiz alternatifler — `js/features/alternatives.js`

```js
import { analyzeIngredients } from "../analyzer.js";
import { PRODUCTS_DATA } from "../data/products.js";
import { findAlternatives } from "./features/alternatives.js";

const alts = findAlternatives(product, PRODUCTS_DATA, { limit: 3, analyze: analyzeIngredients });
// → [{ product, analysis, score, delta, sameType, reasons: ["Daha yüksek skor (+18)", "%100 Vegan", "Parabensiz", ...] }]
```

- Aynı ana grup (Yüz / Göz / Dudak / Cilt Bakımı) ve aynı alt tür (ruj, fondöten, maskara…) içinde arar.
- Aday; skoru düşük değilse, veganlığı/hamilelik güvenliği kötüleşmiyorsa ve en az bir iyileşme varsa listelenir.
- Sıralama: skor farkı + aynı alt tür + vegan + hamilelik uyarısı yok + parabensiz/parfümsüz bonusları.
- Seçenekler: `cache` (Map, tekrar analizleri önler), `fillFromGroup: true` (aynı alt türde aday azsa aynı gruptan tamamlar; varsayılan kapalı).
- `beauty_catalog.json` kayıtları (`{id,b,n,c,i}`) da doğrudan verilebilir.
- Hiç aday yoksa `[]` döner (ürün zaten en temiz) → bölümü gizleyin.
- **UI yeri:** ürün detay sayfasında analiz sonucunun altında "Daha temiz alternatifler" kartları; her kartta `reasons` çipleri + "Satın al" (affiliate) butonu. Gelir için en değerli yer burası.

## 2. Favoriler & son bakılanlar — `js/features/favorites.js`

```js
import { getFavorites, isFavorite, toggleFavorite, addRecent, getRecent, clearRecent, onChange } from "./features/favorites.js";
toggleFavorite(id)      // → true (eklendi) / false (çıkarıldı)
isFavorite(id)          // → boolean
getFavorites()          // → string[] (en yeni başta, en çok 200)
addRecent(id)           // ürün detayı her açıldığında çağırın (en çok 30 tutulur)
getRecent(limit = 10)   // → string[] (en yeni başta)
const off = onChange(({ type, ids }) => { /* type: "favorites" | "recent" */ });
```

- localStorage engelliyse (gizli sekme, Safari) hata vermez, sayfa ömrü boyunca bellekte çalışır.
- Başka sekmedeki değişiklikler de `onChange` ile gelir. Yalnızca ürün **id**'leri saklanır; UI id → ürün eşlemesini yapar (bilinmeyen id'leri sessizce atlayın).
- **UI yeri:** ürün kartı/detayında kalp butonu; ana sayfada "Son baktıkların" şeridi; üst menüde "Favorilerim".

## 3. Paylaşım — `js/features/share.js`

```js
import { shareProduct, reportUrl, productPageUrl } from "./features/share.js";
const result = await shareProduct({ title, text, url: productPageUrl(product.id) });
// result: "shared" | "copied" | "cancelled" | "failed"  → "copied" ise "Bağlantı kopyalandı" bildirimi gösterin
reportUrl("#/urun/rare-soft-pinch-blush")  // → https://…/MakeYUP/#/urun/rare-soft-pinch-blush
productPageUrl("rare-soft-pinch-blush")    // → https://…/MakeYUP/urun/rare-soft-pinch-blush.html
```

- Mutlaka bir tıklama olayının içinde çağırın.
- Paylaşımda **`productPageUrl`** tercih edin: statik sayfada OG etiketleri olduğu için WhatsApp/Instagram/X önizlemesi görünür; hash URL'lerde önizleme çıkmaz. Statik sayfa ziyaretçiyi "Uygulamada aç" ile `#/urun/<id>`'ye yönlendirir.
- Katalog (beauty_catalog) ürünlerinin statik sayfası yoktur; onlar için `reportUrl("#/urun/<id>")` kullanın.

## 4. PWA — `manifest.webmanifest`, `sw.js`

`index.html` `<head>` içine ekleyin:

```html
<link rel="manifest" href="manifest.webmanifest" />
```

ve uygulama başlarken (yükleme sonrası):

```js
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
```

- Önbellek stratejisi: HTML/JS/JSON **ağ öncelikli** (çevrimdışıysa önbellek), görsel/font **önbellek öncelikli**, CSS **stale-while-revalidate**. Çapraz kökenli API istekleri hiç yakalanmaz.
- Sürüm yayınlarken `sw.js` içindeki `CACHE_VERSION`'ı değiştirin (eski önbellekler otomatik silinir).
- **Acil durum:** bir sorun olursa `sw.js`'de `KILL_SWITCH = true` yapıp yayınlayın; SW tüm önbellekleri siler ve kendini kaldırır. `sw.js` dosyasını asla silmeyin (silmek eski SW'yi kaldırmaz).

## 5. SEO — `tools/build-seo.mjs`

```bash
node tools/build-seo.mjs
```

- Üretir: `robots.txt`, `sitemap.xml`, `urun/index.html` (tüm analizlerin dizini) ve her ürün için `urun/<id>.html`.
- Her sayfa: başlık "<Marka> <Ürün> içerik analizi — vegan mı, sağlıklı mı? | MakeYUP", skor/vegan durumlu meta açıklama, canonical, Open Graph/Twitter, JSON-LD (`Product` + `BreadcrumbList`; sahte puan/fiyat **yok**), özet, INCI listesi, uyarılar, daha temiz alternatifler, benzer ürünler ve `js/affiliate.js` varsa "Satın al" linkleri (`rel="sponsored nofollow noopener"`).
- İdempotent: değişmeyen dosyaya yazmaz; `products.js`'den silinen ürünün (betiğin ürettiği) sayfasını siler.
- `products.js`, analiz motoru veya `affiliate_config.js` (ör. affiliate `tag` girildiğinde) değişince **yeniden çalıştırıp commit edin** — statik sayfalardaki linkler derleme anında oluşur.
- **UI için zorunlu:** uygulama `#/urun/<id>` hash rotasını desteklemeli (statik sayfalardaki "Uygulamada aç" linki buraya gider).
- Not: GitHub Pages proje sitesinde (`/MakeYUP/`) `robots.txt` arama motorlarınca okunmaz (yalnızca alan adının kökünde geçerlidir). `sitemap.xml`'i Google Search Console'a elle gönderin; ana sayfaya `<link rel="sitemap" href="sitemap.xml">` eklemek de faydalıdır.
