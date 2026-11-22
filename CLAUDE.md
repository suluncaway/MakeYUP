# MakeYUP — Claude Code proje notları

Makyaj/cilt bakımı ürünlerinin INCI içerik listelerini analiz eden (sağlık skoru, vegan durumu, risk) **sıfır-build** statik web uygulaması. GitHub Pages'te yayınlanır.

## Yığın
- Saf HTML5 + CSS3 + Vanilla JS. **npm, bundler, framework yok** — ekleme.
- Giriş: `index.html`. Stil: `css/styles.css`, `css/app-skin.css`.
- `js/app.js` — arayüz, filtreleme, modal, karşılaştırma, sayfalama (100'lü)
- `js/analyzer.js` — INCI ayrıştırıcı, sağlık skoru & vegan motoru
- `js/barcode.js` — `BarcodeDetector` + ZXing yedek
- `js/globalApi.js` — Open Beauty Facts / Makeup API / Hugging Face
- `js/data/` — `ingredients.js`, `products.js`, `brands.js`, `beauty_catalog.json` (~640 KB), `cosing_index.json` (AB CosIng, ~250 KB)

## Kurallar
- Arayüz metinleri ve commit mesajları **Türkçe**, Conventional Commits (`feat:`, `fix:` …).
- Mobil öncelikli: alt gezinme çubuğu, bottom-sheet modallar, yatay filtre şeritleri bozulmamalı.
- Büyük JSON veri dosyalarını elle düzenleme; script ile üret/güncelle.
- Her içerik bileşeni bir kaynak etiketi taşır: Bitkisel / Mineral / Sentetik / Hayvansal. Analizde "tanımsız" bileşen kalmamalı.
- Sağlık bilgisi gösteriliyor: puanlar kaynaklı (CosIng, COSMILE, EWG) olmalı, uydurma değer yazma.

## Çalıştırma / doğrulama
- Yerel sunucu: `npx serve .` veya `python -m http.server 8000`
- Sözdizimi kontrolü: `node --check js/<dosya>.js` (hook otomatik yapar)
- Tarayıcı testi: Playwright MCP ile masaüstü + mobil (375px) görünüm.
