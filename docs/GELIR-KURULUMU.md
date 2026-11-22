# MakeYUP — Gelir (Affiliate) Kurulumu

Bu rehber, MakeYUP'ta ürün sayfalarındaki "Satın al" linklerinden komisyon kazanmak için yapmanız gerekenleri adım adım anlatır.

> **Önce gerçekçi beklenti:** Affiliate geliri ziyaretçi ve satış gerektirir. Programlara bugün başvursanız da **yarın garanti gelir yoktur.** İlk satış birkaç gün ile birkaç hafta sürebilir. Her şey trafiğe bağlıdır (aşağıda "Trafik planı" bölümüne bakın).

Kod tarafı hazırdır: `js/affiliate.js` linkleri üretir, `js/data/affiliate_config.js` ayarları tutar. Onay gelene kadar linkler **normal arama linki** olarak çalışır (komisyon yok, ama kullanıcı için faydalı). Onaydan sonra yalnızca `tag` alanını doldurursunuz.

---

## 1. Bugün hangi programlara, hangi sırayla başvurmalı?

| Sıra | Program | Neden | Onay | Link nasıl oluşuyor |
|---|---|---|---|---|
| **1** | **Amazon.com.tr Ortaklık Programı** (gelirortakligi.amazon.com.tr) | Web sitesi kabul ediyor, **hesap hemen açılır ve takip kimliği (tag) hemen verilir**. Sitedeki tüm arama linklerine otomatik eklenebilir. | Kayıt anında link kullanılabilir; kesin onay **180 gün içinde 3 nitelikli satıştan sonra** yapılır. 3 satış olmazsa hesap kapanır. | `https://www.amazon.com.tr/s?k=ÜRÜN&tag=SİZİN-TAG-21` (kod bunu otomatik yapar) |
| **2** | **Admitad** (yayıncı/publisher hesabı) | Ücretsiz; web sitesi ile başvurulur, programlara tek tek katılırsınız. Türkiye'de en yaygın ağlardan biri. Hangi Türk kozmetik/e-ticaret programlarının şu an açık olduğu panelde görülür. | Site/hesap incelemesi genelde 1–2 iş günü (üçüncü taraf kaynak); her mağaza programı ayrıca onay ister. | Panelde "deeplink" oluşturulur: `https://ad.admitad.com/g/KİMLİK/?ulp=HEDEF_URL` |
| **3** | **Gelir Ortakları** ve **ReklamAction** (Türk affiliate ağları) | Türk reklamverenlerle çalışırlar. Hangi kozmetik markasının aktif olduğu yalnızca yayıncı panelinde görülür. | Değişken; kamuya açık bir süre bilgisi bulamadık. | Panelde verilen deeplink formatı |
| **4** | **Trendyol Influencer Programı** | Komisyon var, ama başvuru **Instagram hesabı** üzerinden ve linkler **Trendyol uygulamasında ürün bazında** üretiliyor. Web sitesine otomatik link basmaya uygun değil. Instagram/TikTok paylaşımları için kullanın. | Trendyol değerlendiriyor | Uygulamada "link oluştur" (ty.gl kısa linki) |
| **5** | **Hepsiburada Link Gelir** | Uygulama içinden ürün paylaşım linki; kozmetik gibi elektronik dışı ürünlerde ortalama ~%7 (2024 basın bülteni). Sosyal medya paylaşımı için uygun; web sitesine otomatik ekleme için resmi bir şablon bulamadık. | Uygulama içi | Uygulamada "paylaş ve kazan" linki |

**Kendi affiliate programı bulunamayanlar (Kasım 2026 araştırması):** Gratis, Watsons TR, Rossmann TR, Sephora TR ve Flormar için Türkiye'ye özel, kamuya açık bir affiliate programı **bulamadık** (Watsons'ın programı yalnızca Güneydoğu Asya'da, Rossmann'ınki Almanya'da). Bunlar ileride bir ağda (Admitad / Gelir Ortakları / ReklamAction) açılırsa panelde görürsünüz. Bu mağazalar ayar dosyasında şimdilik `enabled: false`.

**En hızlı yol:** Bugün **Amazon.com.tr** (tag'i aynı gün alırsınız) + **Admitad** yayıncı başvurusu. Trendyol ve Hepsiburada'yı sosyal medya paylaşımları için ayrıca kullanın.

### Başvuruda işinize yarayacaklar
- Site adresi (GitHub Pages adresi kabul edilir; mümkünse kendi alan adınız daha güven verir).
- Gizlilik politikası ve iletişim bilgisi olan bir sayfa (çoğu program ister).
- Kısa açıklama: "Kozmetik ürünlerin içerik (INCI) analizini yapan Türkçe bilgi sitesi."
- Vergi/ödeme bilgileri (Amazon ve ağlar ödeme için ister). Bireysel gelir için vergi durumunuzu bir mali müşavire danışın.

---

## 2. Onaydan sonra `js/data/affiliate_config.js` içine ne yazmalı?

Yalnızca ilgili mağazanın satırını değiştirin. **Kimliği kendiniz uydurmayın; panelde yazanı kopyalayın.**

**Amazon** (Associates panelinde "Takip Kimliği", genelde `-21` ile biter):
```js
{ id: "amazon-tr", ... tagParam: "tag", wrapTemplate: "", tag: "PANELDEKİ-KİMLİK-21" }
```

**Bir ağ üzerinden onaylanan mağaza** (ör. Admitad'da Trendyol veya Hepsiburada programı onaylandıysa):
```js
{ id: "trendyol", ... wrapTemplate: "https://ad.admitad.com/g/{tag}/?ulp={url}", tag: "PANELDEKİ-LİNK-KİMLİĞİ" }
```
- `{tag}` ve `{url}` yer tutucularını olduğu gibi bırakın; kod doldurur.
- Gelir Ortakları / ReklamAction kullanıyorsanız, panelin verdiği deeplink örneğindeki hedef adres kısmını `{url}`, size özel kimliği `{tag}` ile değiştirip `wrapTemplate`'e yapıştırın.

**Henüz doğrulanmamış mağazalar** (Watsons, Gratis, Sephora, Rossmann, Flormar): `searchTemplate` adresini tarayıcıda bir ürün adıyla deneyin. Sonuç sayfası açılıyorsa `verified: true, enabled: true` yapın.

Kontrol için terminalde:
```bash
node --input-type=module -e 'import {buyLinks} from "./js/affiliate.js"; console.log(buyLinks({brand:"The Ordinary",name:"Niacinamide 10% + Zinc 1%"}))'
```
`isAffiliate: true` görüyorsanız komisyon linki aktiftir.

---

## 3. Yasal beyan (zorunlu)

- Ticaret Bakanlığı Reklam Kurulu'nun 2021 tarihli **"Sosyal Medya Etkileyicileri Tarafından Yapılan Ticari Reklam ve Haksız Ticari Uygulamalar Hakkında Kılavuz"**u (6502 sayılı Tüketicinin Korunması Hakkında Kanun'a dayanır), ticari ilişkinin açıkça belirtilmesini ister. Önerilen etiketler: **#reklam**, **#işbirliği**, **#sponsor**, **"... ile iş birliği"**.
- Kılavuz affiliate linklerini ayrıca adlandırmıyor; ancak komisyonlu link bir ticari ilişkidir. **Güvenli yol: her zaman beyan edin.**
- Sitede: "Satın al" linklerinin hemen yanında `affiliateDisclosure()` metni görünür olmalı (dipnotta gizlenmemeli). Metin hazır: *"Reklam / İş birliği: Bu bölümdeki bazı mağaza bağlantıları satış ortaklığı (affiliate) bağlantısıdır…"*
- Instagram/TikTok paylaşımlarında: gönderinin başında **#reklam #işbirliği**; hikâyelerde etiket gönderi süresince görünür kalmalı.
- Analiz puanları affiliate ilişkisinden asla etkilenmemeli (bu hem yasal hem güven meselesi).
- Teknik: tüm affiliate linkleri `rel="sponsored nofollow noopener"` ile verilmeli (Google'ın ücretli link kuralı).
- Amazon ayrıca kendi beyan cümlesini ister (Associates sözleşmesindeki metni sitenizin alt kısmına ekleyin).

---

## 4. Gerçekçi beklentiler

Kabaca bir hesap (varsayımlara dayanır, garanti değildir):
- Ziyaretçilerin ~%2–5'i bir mağaza linkine tıklar; tıklayanların ~%2–5'i satın alır.
- Ortalama sepet 400 TL, komisyon ~%3–7 ise satış başına **~12–28 TL**.
- **Ayda 1.000 ziyaretçi → ayda 0–2 satış (birkaç on TL).** Ayda 50.000 ziyaretçi → birkaç bin TL mertebesi.
- Amazon'da 180 gün içinde 3 satış şartını kaçırmamak için ilk aylarda trafik kritik.

## 5. Trafik planı (gelirin asıl motoru)

1. **SEO sayfaları:** Her ürün ve her içerik maddesi (ör. "niacinamide nedir", "The Ordinary Niacinamide içerik analizi") için ayrı, indekslenebilir sayfa. İnsanlar Google'da tam bunu arıyor. Google Search Console'a siteyi ekleyin ve sitemap gönderin.
2. **Instagram / TikTok:** Haftada 3–5 kısa video veya karusel: "Bu popüler serumun içinde ne var?" + MakeYUP rapor ekran görüntüsü. Biyografide site linki. Satın alma linki paylaşıyorsanız Trendyol/Hepsiburada linkleri + **#reklam #işbirliği**.
3. **Topluluklar:** Ekşi Sözlük, r/Turkey ve cilt bakımı odaklı Reddit/Facebook/Telegram grupları, Donanımhaber/Kadınlar Kulübü forumları. **Spam yapmayın**: soru soranlara faydalı cevap verin, uygun yerde analiz linki paylaşın (affiliate linki doğrudan değil).
4. **Paylaşılabilir rapor:** Kullanıcıların analiz sonucunu tek tıkla paylaşabilmesi trafiği kendiliğinden büyütür.

**Özet:** Bugün Amazon.com.tr ve Admitad'a başvurun, `tag`'i girin, beyanı görünür yapın ve enerjinizin çoğunu trafiğe verin. Yarın garanti bir gelir beklemeyin.

---

## Kaynaklar (Kasım 2026 itibarıyla; komisyon ve şartlar değişir, başvurmadan önce resmi sayfadan kontrol edin)

- Amazon Associates başvuru inceleme süreci (180 gün / 3 satış): https://affiliate-program.amazon.com/help/topic/t21/
- Amazon gelir ortaklığı (Türkçe rehber, 24 saat çerez): https://www.shopify.com/tr/blog/amazon-gelir-ortakligi
- Amazon güzellik komisyon oranları (ABD tablosu, TR için doğrulanmadı: güzellik ~%3, lüks güzellik ~%10): https://www.influencer-hero.com/tr/blogs/amazon-influencer-commission-rates
- Trendyol Influencer Programı (resmi): https://www.trendyol.com/en/s/trendyol-influencer-program
- Trendyol programı başvuru bilgileri: https://www.habergazetesi.com.tr/trendyol-affiliate-programina-nasil-basvurulur-tum-detaylar-burada
- Trendyol / Takefluence (Admitad): https://www.admitad.com/ae/blog/trendyol-launches-influencer-program-via-takefluence
- Hepsiburada Link Gelir (elektronik dışı ~%7, 2024): https://www.haberturk.com/link-gelir-ile-1-milyar-tl-hedefi-3678728-teknoloji ve https://www.webtekno.com/hepsiburada-link-gelir-sistemi-duyurdu-h127433.html
- Türkiye'de affiliate platform payları (Impact, Admitad): https://www.wmtips.com/technologies/affiliate-marketing/country/tr/
- ReklamAction şirket profili: https://village.ai/company/reklamaction
- Watsons affiliate (yalnızca Güneydoğu Asya): https://involve.asia/blog/watsons-affiliate-program/
- Rossmann affiliate (Almanya): https://www.shopper.com/partnerships/rossmann-de-affiliate-program
- Ticaret Bakanlığı influencer kılavuzu duyurusu: https://ticaret.gov.tr/haberler/ticaret-bakanligi-sosyal-medya-etkileyicileri-icin-kilavuz-yayimladi
- Kılavuz tam metni (PDF): https://iabtr.org/wp-content/uploads/2024/06/Sosyal-Medya-Etkileyicileri-Tarafindan-Yapilan-Ticari-Reklam-ve-Haksiz-Ticari-Uygulamalar-Hakkinda-Kilavuz1062021101250.pdf

*Not: Gelir Ortakları'nın onay süresi ve kozmetik reklamverenleri, Gratis/Sephora TR/Flormar programları için kamuya açık güvenilir kaynak bulunamadı; bunlar ağ panellerinde kontrol edilmelidir.*
