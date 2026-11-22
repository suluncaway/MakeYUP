# MakeYUP · Piksel Lab — Marka Kimliği Rehberi

**Tagline:** *Etiketi oku, pikseli gör.*  
**Maskot:** **Yupi** — 16×16 piksel art ruj karakteri (`js/pixel.js`).

MakeYUP, kozmetik ve cilt bakım ürünlerinin içeriklerini korkutucu olmadan, ilk bakışta tanınan neşeli bir **Piksel Lab** estetiğiyle okunabilir kılar: ruh açıcı pembe-krem dama kareleri, `crispEdges` piksel ikonlar, 2px ink kenarlıklar ve sert ofset gölgeler.

---

## 1. Renk Paleti & Kullanım Kuralları

> **Altın Kural:** Pembe (`#FF5C8A`), nane (`#3DDC97`) ve limon (`#FFD23F`) **yalnızca dolgu rengi** olarak kullanılır; üzerlerinde mutlaka koyu ink (`#1B1530`) metin yer alır. Açık zeminde vurgu/bağlantı yazıları için yüksek kontrastlı `#C2185B` (`--px-pink-text`) tercih edilir.

### Açık Tema (`[data-theme="light"]`)

| Token | Hex | Kullanım |
| --- | --- | --- |
| `--px-paper` | `#FFF8F0` | Ana sayfa zemini |
| `--px-surface` | `#FFFFFF` | Kart, modal ve giriş yüzeyi |
| `--px-surface-2` | `#FFEFF4` | Yumuşak pembe yüzey, vurgu kutuları |
| `--px-ink` | `#1B1530` | Ana metin, 2px kenarlık, ofset gölge |
| `--px-muted` | `#5E5672` | İkincil açıklama ve meta metinler |
| `--px-pink` | `#FF5C8A` | Ana buton, aktif chip/sekme, dama kare |
| `--px-pink-soft` | `#FFB3C7` | Favori aktif arka planı, yumuşak dolgu |
| `--px-pink-text` | `#C2185B` | Açık zeminde link ve vurgu yazısı (WCAG AA) |
| `--px-mint` | `#3DDC97` | Sağlıklı / güvenli dolgu |
| `--px-lemon` | `#FFD23F` | Dikkat / orta risk / popüler sıra rozeti |
| `--px-tomato` | `#FF4D4D` | Yüksek risk / kırmızı bayrak dolgu |
| `--px-lavender` | `#B8A1FF` | Maskot & aksesuar detayı |

### Koyu Tema (`[data-theme="dark"]`)

| Token | Hex | Kullanım |
| --- | --- | --- |
| `--px-paper` | `#17122B` | Ana koyu zemin |
| `--px-surface` | `#221A3D` | Kart ve modal yüzeyi |
| `--px-surface-2` | `#2C2250` | İkincil koyu yüzey ve koyu dama hücresi |
| `--px-ink` | `#FFF3F7` | Açık metin |
| `--px-muted` | `#B9B0CF` | İkincil metin |
| `--px-pink-text` | `#FF8FB0` | Koyu zeminde link ve aktif sekme metni |
| `--px-safe-text` | `#5BE3A8` | Koyu zeminde güvenli metin |
| `--px-mid-text` | `#FFD95E` | Koyu zeminde dikkat metni |
| `--px-high-text` | `#FF7A7A` | Koyu zeminde riskli metin |

---

## 2. Tipografi

- **Ekran / Başlıklar (`Pixelify Sans`, 400–700):** Logo, `h1`, `h2`, ürün kart başlıkları (`.card-title`), modal başlıkları, puan rakamları ve piksel rozetler (`.px-badge`). Türkçe glif desteği (`ğ ş ı İ ç ö ü`) aktif olarak doğrulanır.
- **Gövde Metni (`Urbanist`):** Ürün açıklamaları, ders maddeleri ve uzun okuma alanları.
- **Teknik Veri (`DM Mono`):** INCI kodları, CAS/EC numaraları, skor oranları.

---

## 3. İmza Görsel Öğeler

1. **Dama (Checker) Kareleri (`16px`):**
   - Üst gezinme altında (`.px-band--nav`), puan bantlarının üstünde, footer üstünde (`.px-band`) ve hero rapor çerçevesinde (`.px-frame`) tekrar eder.
   - Açık temada `#FF5C8A` / `#FFE3EC`, koyu temada `#FF5C8A` / `#2C2250`.
2. **3 Piksel Trafik Işığı (`.px-lights`):**
   - Nane · Limon · Domates sırasıyla 3 piksel kareden oluşur. Aktif bant `%100` dolu, diğer ikisi soluk (`0.24`) görünür. Her puan bandının ve ürün/favori kartının yanında tekrar eder.
3. **Biçim Dili:**
   - `2px solid` ink kenarlık, `0–2px` köşe yarıçapı, sert ofset gölge (`4px 4px 0`).
   - Hover'da `translate(-2px, -2px)` + `6px 6px 0` gölge; `:active` durumda gölge sıfırlanır ve `translate(2px, 2px)` uygulanır.

---

## 4. Pixel Art Sprite Kuralları (`js/pixel.js`)

- **Izgara Boyutu:** `8×8` ile `16×16` piksel matrisleri.
- **Dış Hat:** Her sprite `1px` `#1B1530` (`K`) dış hata sahiptir.
- **SVG Çıktısı:** `shape-rendering="crispEdges"` ve `image-rendering: pixelated` zorunludur; bulanık `blur` veya yumuşatılmış köşe kullanılmaz.
- **Mevcut Sprite'lar:** `yupi`, `heart`, `sparkle`, `lipstick`, `mascara`, `bottle`, `drop`, `leaf`, `shield`, `warning`, `cross`, `magnifier`, `book`, `star`, `check`, `camera`.

---

## 5. Yapılacaklar & Yapılmayacaklar

- **Yap:** Tek bir piksel diliyle tüm kart, chip, buton ve rozetleri birleştir; arama çubuklarında `datalist` + popüler chip kısayollarıyla keşfi hızlandır; dekor sprite'larını metin kolonlarının dışında tut.
- **Yapma:** Pembe/nane/limon dolgu üstüne beyaz ince metin koyma; yumuşak `16px–24px` yuvarlatılmış cam kartlarla sert `2px` piksel çizgisini karıştırma; mobilde metnin üstüne yüzen ikon bindirme.
