# MakeYUP — Makyaj İçerik, Sağlık & Vegan Analiz Rehberi

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Zero Build](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-a64d63)
![GitHub Pages Ready](https://img.shields.io/badge/Deploy-GitHub%20Pages%20Ready-1f7a53)

**MakeYUP**, makyaj malzemelerinin arkasındaki karmaşık INCI içerik listelerini görsel olarak analiz eden, ürünün **sağlıklı mı riskli mi** ve **vegan mı hayvansal içerikli mi** olduğunu anlaşılır grafiklerle anlatan açık kaynaklı bir web uygulamasıdır.

## Öne Çıkan Özellikler

- **🌍 Dünya Makyaj & Cilt Bakımı Kataloğu (Canlı API):** Open Beauty Facts küresel açık veritabanına canlı bağlıdır. Dünyadaki on binlerce cilt bakım ve makyaj ürününü (La Roche-Posay, CeraVe, The Ordinary, Garnier, Nivea, Bioderma, L'Oréal, Maybelline, Essence, NYX, Catrice, Clinique ve daha fazlası) marka marka gruplayarak arayabilir, sayfalayarak keşfedebilir ve anında görsel analizini görebilirsiniz.
- **Barkod Tarama & Canlı API Entegrasyonu:** Telefon veya bilgisayar kamerasıyla (native `BarcodeDetector` + ZXing fallback), barkod fotoğrafı yükleyerek ya da barkod numarası girerek **Open Beauty Facts** açık veritabanından ürünün içeriğini otomatik çeker; sağlık skorunu ve vegan durumunu anında görselleştirir.
- **Marka Marka Ayrılmış Katalog & Marka Karneleri:** Ürünler **Rare Beauty**, **NYX Professional Makeup**, **Fenty Beauty**, **Flormar**, **MAC Cosmetics** ve **Maybelline New York** gibi markalara göre ayrı bölümlerde gruplanır. Her markanın ortalama sağlık puanı, vegan politikası, cruelty-free durumu ve vegan ürün oranı dinamik olarak hesaplanır.
- **Görsel Ürün Kartları:** Her makyaj ürününün fotoğrafı, dinamik olarak hesaplanan **0–100 Sağlık Skoru Halkası**, **%100 Vegan / Hayvansal İçerik** rozeti, **Cruelty-Free** etiketi ve **İçerik Risk Dağılım Çubuğu**.
- **Detaylı İçerik Raporu:** Ürün kartına tıklandığında açılan görsel raporda her bir bileşenin Türkçe adı, INCI kodu, risk seviyesi (Güvenli / Orta / Yüksek) ve neden vegan olup olmadığı net biçimde açıklanır (ör. *Karmin / CI 75470*, *Balmumu / Cera Alba*, *Lanolin*, *Guanin*).
- **Canlı INCI İçerik Analizörü:** Herhangi bir ürünün içerik listesini virgülle ayırarak yapıştırın; uygulama anında sağlık skorunu, hayvansal içerikleri ve riskli bileşenleri (Paraben, Talk, BHT, Formaldehit salıcılar vb.) görselleştirsin.
- **Yan Yana Ürün Karşılaştırma:** Katalogdan 2 ürünü seçip sağlık skorlarını, vegan durumlarını ve riskli içeriklerini yan yana kıyaslayın.
- **Görsel İçerik Sözlüğü:** Kozmetik dünyasında en sık karşılaşılan 45+ bileşeni kategorilerine göre arayın ve öğrenin.
- **Açık / Koyu Tema Desteği** ve **Sıfır Kurulum (Zero-Build)** mimarisi sayesinde doğrudan **GitHub Pages** üzerinde yayınlanabilir.

## Proje Yapısı

```text
MakeYUP/
├── index.html               # Ana HTML5 uygulama yapısı
├── css/
│   └── styles.css           # Temiz editöryel tasarım sistemi & açık/koyu tema
├── js/
│   ├── app.js               # Arayüz, filtreleme, modal ve karşılaştırma kontrolcüsü
│   ├── analyzer.js          # Dinamik INCI ayrıştırıcı, sağlık skoru & vegan motoru
│   └── data/
│       ├── brands.js        # Marka profilleri ve vegan / cruelty-free politikaları
│       ├── ingredients.js   # Türkçe açıklamalı INCI içerik veritabanı
│       └── products.js      # Marka marka ayrılmış makyaj ürünleri kataloğu
├── assets/
│   └── images/              # Ürün görselleri
├── LICENSE                  # MIT Lisansı
└── README.md
```

## Yerel Olarak Çalıştırma

Uygulama modern ES Modülleri kullandığı için basit bir yerel sunucu ile çalıştırılmalıdır:

```bash
# Python 3 ile:
python -m http.server 8000
```

Ardından tarayıcıda `http://localhost:8000` adresini açın.

## GitHub Pages ile Yayınlama

1. Bu projeyi kendi GitHub reponuza push edin.
2. Repo ayarlarından **Settings → Pages** bölümüne gidin.
3. **Source** olarak `Deploy from a branch`, dal olarak `main` ve klasör olarak `/ (root)` seçip kaydedin.
4. Birkaç dakika içinde uygulamanız canlı olarak yayınlanacaktır!

## Katkıda Bulunma

Yeni makyaj ürünleri veya INCI içerikleri eklemek için:
- Yeni içerikler için `js/data/ingredients.js` dosyasına ekleme yapabilirsiniz.
- Yeni ürünler için `js/data/products.js` dosyasını güncelleyebilirsiniz.

> **Not:** Bu uygulamada yer alan içerik analizleri genel bilgilendirme amaçlıdır; tıbbi veya dermatolojik tavsiye yerine geçmez.
