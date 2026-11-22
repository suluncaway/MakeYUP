---
name: ingredient-data-check
description: MakeYUP içerik/ürün veri dosyalarını (js/data) doğrular — CAS/EC biçimi, yinelenen INCI, eksik puanlar, kaynak etiketi. Yeni veri eklendikten sonra çalıştır.
disable-model-invocation: true
---

# İçerik verisi doğrulama

`js/data/` altındaki veriyi denetle ve bulguları tablo halinde raporla. **Dosyaları düzeltme**, yalnızca raporla; kullanıcı onaylarsa düzelt.

## Adımlar
1. Bir Node script'i ile (scratchpad'e yaz, projeye değil) şunları yükle:
   `js/data/cosing_index.json`, `js/data/beauty_catalog.json`, `js/data/ingredients.js`.
2. Kontroller:
   - **CAS** biçimi: `^\d{2,7}-\d{2}-\d$` ve kontrol basamağı doğru mu.
   - **EC** biçimi: `^\d{3}-\d{3}-\d$`.
   - **Yinelenen INCI** adları (büyük/küçük harf ve boşluk normalize edilerek).
   - Eksik **komedojenik** / **tahriş** puanı veya 0–5 dışı değer.
   - Kaynak etiketi Bitkisel / Mineral / Sentetik / Hayvansal dışında ya da boş.
   - Katalogdaki ürünlerin INCI listesinde `analyzer.js` tarafından tanınmayan bileşenler (ilk 50).
   - GTIN: 8/12/13/14 hane ve kontrol basamağı.
3. Rapor: kontrol başına hata sayısı + ilk 10 örnek. Sonunda genel durum (✅ / ⚠️).
