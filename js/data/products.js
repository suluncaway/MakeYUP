/**
 * MakeYUP — Marka Marka Ayrılmış Makyaj Ürünleri Kataloğu
 * Sağlık skoru, vegan durumu ve risk dağılımı her ürünün gerçek INCI listesinden
 * analyzer.js tarafından dinamik olarak hesaplanır.
 * Not: Listelenen INCI profilleri eğitim ve bilgilendirme amaçlı temsili formüllerdir.
 * Opsiyonel alanlar: spf, pao (açıldıktan sonra kullanım süresi; kategoriye göre tipik değer),
 * certifications (markanın bilinen sertifikaları), priceTier (₺ / ₺₺ / ₺₺₺ marka konumlandırması), shades.
 */

export const PRODUCTS_DATA = [
  // ========================
  // RARE BEAUTY
  // ========================
  {
    id: "rare-soft-pinch-blush",
    brandId: "rare-beauty",
    brand: "Rare Beauty",
    name: "Soft Pinch Likit Allık",
    category: "yuz",
    categoryLabel: "Yüz · Likit Allık",
    image: "assets/images/blush.jpg",
    description:
      "Karmin yerine güvenli mineral ve vegan pigmentler kullanan, Centella ve Jojoba yağı destekli yüksek pigmentli %100 vegan likit allık.",
    crueltyFree: true,
    skinTypes: ["Hassas", "Karma", "Tüm Ciltler"],
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Aqua",
      "Squalane",
      "Simmondsia Chinensis Seed Oil",
      "Propanediol",
      "Centella Asiatica Extract",
      "Mica",
      "Titanium Dioxide",
      "Iron Oxides",
      "CI 15850",
      "Silica",
      "Tocopherol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "rare-positive-light-foundation",
    brandId: "rare-beauty",
    brand: "Rare Beauty",
    name: "Positive Light Serum Fondöten",
    category: "yuz",
    categoryLabel: "Yüz · Fondöten",
    image: "assets/images/foundation.jpg",
    description:
      "Niasinamid, bitkisel skualan ve hyaluronik asit ile cilt bariyerini destekleyen nefes alan temiz vegan serum fondöten.",
    crueltyFree: true,
    skinTypes: ["Hassas", "Kuru", "Karma"],
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Aqua",
      "Squalane",
      "Niacinamide",
      "Caprylic/Capric Triglyceride",
      "Propanediol",
      "Titanium Dioxide",
      "Zinc Oxide",
      "Iron Oxides",
      "Sodium Hyaluronate",
      "Panthenol",
      "Tocopherol",
      "Xanthan Gum",
      "Ethylhexylglycerin",
      "Potassium Sorbate"
    ]
  },
  {
    id: "rare-liquid-touch-concealer",
    brandId: "rare-beauty",
    brand: "Rare Beauty",
    name: "Liquid Touch Aydınlatıcı Kapatıcı",
    category: "yuz",
    categoryLabel: "Yüz · Kapatıcı",
    image: "assets/images/foundation.jpg",
    description:
      "Hafif dokulu, katmanlanabilir ve doğal bitişli vegan kapatıcı. Bitkisel skualan ve gardenya özü benzeri yumuşatıcılarla göz altını kurutmadan aydınlatır.",
    crueltyFree: true,
    skinTypes: ["Kuru", "Normal", "Karma"],
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Aqua",
      "Dimethicone",
      "Isododecane",
      "Squalane",
      "Propanediol",
      "Titanium Dioxide",
      "Iron Oxides",
      "Silica",
      "Sodium Chloride",
      "Tocopherol",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "rare-stay-vulnerable-melting-blush",
    brandId: "rare-beauty",
    brand: "Rare Beauty",
    name: "Stay Vulnerable Eriyen Krem Allık",
    category: "yuz",
    categoryLabel: "Yüz · Krem Allık",
    image: "assets/images/blush.jpg",
    description:
      "Cilde eriyerek yayılan, dudak ve yanaklarda kullanılabilen vegan krem allık. Bitkisel mumlar ve yağlarla esnek, doğal bir parlaklık bırakır.",
    crueltyFree: true,
    skinTypes: ["Kuru", "Normal", "Hassas"],
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Caprylic/Capric Triglyceride",
      "Squalane",
      "Euphorbia Cerifera Cera",
      "Copernicia Cerifera Cera",
      "Silica",
      "Mica",
      "Titanium Dioxide",
      "Iron Oxides",
      "CI 15850",
      "Tocopherol"
    ]
  },
  {
    id: "rare-perfect-strokes-mascara",
    brandId: "rare-beauty",
    brand: "Rare Beauty",
    name: "Perfect Strokes Universal Volumizing Maskara",
    category: "goz",
    categoryLabel: "Göz · Hacim Maskarası",
    image: "assets/images/mascara.jpg",
    description:
      "Bitkisel mumlarla hacim ve uzunluk veren, topaklanmayan vegan maskara. Balmumu içermez; koruyucu olarak fenoksietanol barındırır.",
    crueltyFree: true,
    skinTypes: ["Hassas Gözler", "Tüm Ciltler"],
    pao: "6M",
    priceTier: "₺₺₺",
    ingredients: [
      "Aqua",
      "Copernicia Cerifera Cera",
      "Euphorbia Cerifera Cera",
      "Stearic Acid",
      "Iron Oxides",
      "Glycerin",
      "Panthenol",
      "Tocopherol",
      "Xanthan Gum",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "rare-kind-words-lipstick",
    brandId: "rare-beauty",
    brand: "Rare Beauty",
    name: "Kind Words Mat Ruj",
    category: "dudak",
    categoryLabel: "Dudak · Mat Ruj",
    image: "assets/images/lipstick.jpg",
    description:
      "Kurutmayan, yumuşak mat bitişli vegan ruj. Balmumu ve karmin yerine bitkisel mumlar ve sentetik pigmentler kullanılır.",
    crueltyFree: true,
    skinTypes: ["Normal", "Kuru"],
    pao: "24M",
    priceTier: "₺₺₺",
    ingredients: [
      "Ricinus Communis Seed Oil",
      "Caprylic/Capric Triglyceride",
      "Euphorbia Cerifera Cera",
      "Copernicia Cerifera Cera",
      "Silica",
      "Butyrospermum Parkii Butter",
      "Titanium Dioxide",
      "Iron Oxides",
      "CI 15850",
      "Tocopherol"
    ]
  },

  // ========================
  // NYX PROFESSIONAL MAKEUP
  // ========================
  {
    id: "nyx-fat-oil-lip",
    brandId: "nyx",
    brand: "NYX Professional Makeup",
    name: "Fat Oil Lip Drip Dudak Yağı",
    category: "dudak",
    categoryLabel: "Dudak · Dudak Yağı",
    image: "assets/images/lipoil.jpg",
    description:
      "Ahududu, kuşburnu ve bitkisel skualan ile dudaklara yoğun parlaklık veren %100 vegan dudak yağı. Koku bileşeni (Limonene) nedeniyle çok hassas dudaklarda dikkat gerektirir.",
    crueltyFree: true,
    skinTypes: ["Kuru", "Normal"],
    pao: "12M",
    certifications: ["Leaping Bunny", "PETA Cruelty-Free"],
    priceTier: "₺₺",
    ingredients: [
      "Ricinus Communis Seed Oil",
      "Rubus Idaeus Seed Oil",
      "Rosa Canina Fruit Oil",
      "Squalane",
      "Butyrospermum Parkii Butter",
      "Euphorbia Cerifera Cera",
      "Tocopherol",
      "CI 15850",
      "Limonene",
      "Linalool"
    ]
  },
  {
    id: "nyx-vegan-volume-mascara",
    brandId: "nyx",
    brand: "NYX Professional Makeup",
    name: "Botanica Lash Vegan Maskara",
    category: "goz",
    categoryLabel: "Göz · Maskara",
    image: "assets/images/mascara.jpg",
    description:
      "Balmumu yerine %100 bitkisel Karnauba ve Kandelila mumu kullanılarak geliştirilmiş, parfümsüz ve hassas gözlere uygun vegan hacim maskarası.",
    crueltyFree: true,
    skinTypes: ["Hassas Gözler", "Tüm Ciltler"],
    pao: "6M",
    certifications: ["Leaping Bunny", "PETA Cruelty-Free"],
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Iron Oxides",
      "Copernicia Cerifera Cera",
      "Euphorbia Cerifera Cera",
      "Simmondsia Chinensis Seed Oil",
      "Panthenol",
      "Tocopherol",
      "Xanthan Gum",
      "Sodium Benzoate",
      "Potassium Sorbate"
    ]
  },
  {
    id: "nyx-epic-ink-liner",
    brandId: "nyx",
    brand: "NYX Professional Makeup",
    name: "Epic Ink Liner Suya Dayanıklı Likit Eyeliner",
    category: "goz",
    categoryLabel: "Göz · Likit Eyeliner",
    image: "assets/images/mascara.jpg",
    description:
      "Fırça uçlu, yoğun siyah ve suya dayanıklı vegan likit eyeliner. Film oluşturucu polimerler ve koruyucu olarak fenoksietanol içerir.",
    crueltyFree: true,
    skinTypes: ["Normal", "Yağlı Göz Kapağı"],
    pao: "6M",
    certifications: ["Leaping Bunny", "PETA Cruelty-Free"],
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Butylene Glycol",
      "Iron Oxides",
      "Propylene Glycol",
      "Panthenol",
      "Disodium EDTA",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "nyx-butter-gloss",
    brandId: "nyx",
    brand: "NYX Professional Makeup",
    name: "Butter Gloss Dudak Parlatıcısı",
    category: "dudak",
    categoryLabel: "Dudak · Dudak Parlatıcısı",
    image: "assets/images/lipoil.jpg",
    description:
      "Yapışkan olmayan, kremsi dokulu vegan dudak parlatıcısı. Tatlı aroması için parfüm içerdiğinden hassas dudaklarda dikkat edilmelidir.",
    crueltyFree: true,
    skinTypes: ["Normal", "Kuru"],
    pao: "12M",
    certifications: ["Leaping Bunny", "PETA Cruelty-Free"],
    priceTier: "₺₺",
    ingredients: [
      "Ricinus Communis Seed Oil",
      "Caprylic/Capric Triglyceride",
      "Silica",
      "Butyrospermum Parkii Butter",
      "Mica",
      "Titanium Dioxide",
      "Iron Oxides",
      "Tocopherol",
      "Parfum",
      "Limonene"
    ]
  },
  {
    id: "nyx-suede-matte-lip-liner",
    brandId: "nyx",
    brand: "NYX Professional Makeup",
    name: "Suede Matte Dudak Kalemi",
    category: "dudak",
    categoryLabel: "Dudak · Dudak Kalemi",
    image: "assets/images/lipstick.jpg",
    description:
      "Kadifemsi mat bitişli, kolay sürülen vegan dudak kalemi. Bitkisel mumlar ve silikonlarla dudak hattını belirgin ve kalıcı kılar.",
    crueltyFree: true,
    skinTypes: ["Normal"],
    pao: "24M",
    certifications: ["Leaping Bunny", "PETA Cruelty-Free"],
    priceTier: "₺₺",
    ingredients: [
      "Caprylic/Capric Triglyceride",
      "Euphorbia Cerifera Cera",
      "Copernicia Cerifera Cera",
      "Dimethicone",
      "Silica",
      "Mica",
      "Titanium Dioxide",
      "Iron Oxides",
      "CI 15850",
      "Tocopherol"
    ]
  },
  {
    id: "nyx-matte-setting-spray",
    brandId: "nyx",
    brand: "NYX Professional Makeup",
    name: "Matte Finish Makyaj Sabitleyici Sprey",
    category: "yuz",
    categoryLabel: "Yüz · Sabitleyici Sprey",
    image: "assets/images/foundation.jpg",
    description:
      "Makyajı gün boyu sabitleyip parlamayı azaltan mat sabitleyici sprey. Yüksek oranda alkol içerdiğinden kuru ve hassas ciltleri kurutabilir.",
    crueltyFree: true,
    skinTypes: ["Yağlı", "Karma"],
    pao: "12M",
    certifications: ["Leaping Bunny", "PETA Cruelty-Free"],
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Alcohol Denat.",
      "Glycerin",
      "Aloe Barbadensis Leaf Juice",
      "Panthenol",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "nyx-the-brow-glue",
    brandId: "nyx",
    brand: "NYX Professional Makeup",
    name: "The Brow Glue Kaş Sabitleyici Jel",
    category: "goz",
    categoryLabel: "Göz · Kaş Jeli",
    image: "assets/images/mascara.jpg",
    description:
      "Kaşları laminasyon etkisiyle yukarı tarayıp gün boyu sabitleyen şeffaf vegan kaş jeli. Hafif koku bileşeni içerebilir.",
    crueltyFree: true,
    skinTypes: ["Tüm Ciltler"],
    pao: "12M",
    certifications: ["Leaping Bunny", "PETA Cruelty-Free"],
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Glycerin",
      "Butylene Glycol",
      "Panthenol",
      "Carbomer",
      "Disodium EDTA",
      "Phenoxyethanol",
      "Ethylhexylglycerin",
      "Parfum"
    ]
  },
  {
    id: "nyx-pore-filler-primer",
    brandId: "nyx",
    brand: "NYX Professional Makeup",
    name: "Pore Filler Gözenek Gizleyici Makyaj Bazı",
    category: "yuz",
    categoryLabel: "Yüz · Makyaj Bazı",
    image: "assets/images/foundation.jpg",
    description:
      "Silikon bazlı, gözenek ve ince çizgi görünümünü bulanıklaştıran makyaj bazı. Akneye meyilli ciltlerde akşam iyi temizlenmelidir.",
    crueltyFree: true,
    skinTypes: ["Yağlı", "Karma", "Normal"],
    pao: "12M",
    certifications: ["Leaping Bunny", "PETA Cruelty-Free"],
    priceTier: "₺₺",
    ingredients: [
      "Dimethicone",
      "Cyclopentasiloxane",
      "Silica",
      "Isododecane",
      "Tocopherol",
      "Phenoxyethanol"
    ]
  },

  // ========================
  // FENTY BEAUTY
  // ========================
  {
    id: "fenty-pro-filtr-foundation",
    brandId: "fenty-beauty",
    brand: "Fenty Beauty",
    name: "Pro Filt'r Soft Matte Fondöten",
    category: "yuz",
    categoryLabel: "Yüz · Fondöten",
    image: "assets/images/foundation.jpg",
    description:
      "Yüksek kapatıcılıklı ve vegan formüllü mat fondöten. Pürüzsüzleştirici silikonlar ve hafif parfüm içerdiği için çok hassas veya akneye meyilli ciltlerde dikkatli kullanım önerilir.",
    crueltyFree: true,
    skinTypes: ["Yağlı", "Karma"],
    pao: "12M",
    priceTier: "₺₺₺",
    shades: 50,
    ingredients: [
      "Aqua",
      "Dimethicone",
      "Cyclopentasiloxane",
      "Silica",
      "Titanium Dioxide",
      "Iron Oxides",
      "Propanediol",
      "Tocopherol",
      "Phenoxyethanol",
      "Parfum"
    ]
  },
  {
    id: "fenty-gloss-oil",
    brandId: "fenty-beauty",
    brand: "Fenty Beauty",
    name: "Gloss Bomb Besleyici Dudak Yağı",
    category: "dudak",
    categoryLabel: "Dudak · Dudak Yağı",
    image: "assets/images/lipoil.jpg",
    description:
      "Shea yağı, E vitamini ve bitkisel yağlarla dudakları besleyen, hayvansal içerik barındırmayan vegan dudak parlatıcısı.",
    crueltyFree: true,
    skinTypes: ["Kuru", "Hassas", "Tüm Ciltler"],
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Ricinus Communis Seed Oil",
      "Butyrospermum Parkii Butter",
      "Simmondsia Chinensis Seed Oil",
      "Squalane",
      "Euphorbia Cerifera Cera",
      "Tocopherol",
      "Iron Oxides",
      "Mica"
    ]
  },
  {
    id: "fenty-instant-retouch-concealer",
    brandId: "fenty-beauty",
    brand: "Fenty Beauty",
    name: "Pro Filt'r Instant Retouch Kapatıcı",
    category: "yuz",
    categoryLabel: "Yüz · Kapatıcı",
    image: "assets/images/foundation.jpg",
    description:
      "Uzun süre kalıcı, kırışmayan ve yüksek kapatıcılıklı vegan kapatıcı. Silikon ağırlıklı formülü ve hafif parfüm nedeniyle hassas ciltlerde dikkat önerilir.",
    crueltyFree: true,
    skinTypes: ["Yağlı", "Karma", "Normal"],
    pao: "12M",
    priceTier: "₺₺₺",
    shades: 50,
    ingredients: [
      "Aqua",
      "Cyclopentasiloxane",
      "Dimethicone",
      "Isododecane",
      "Titanium Dioxide",
      "Iron Oxides",
      "Silica",
      "Glycerin",
      "Tocopherol",
      "Phenoxyethanol",
      "Parfum"
    ]
  },
  {
    id: "fenty-killawatt-highlighter",
    brandId: "fenty-beauty",
    brand: "Fenty Beauty",
    name: "Killawatt Freestyle Aydınlatıcı",
    category: "yuz",
    categoryLabel: "Yüz · Toz Aydınlatıcı",
    image: "assets/images/blush.jpg",
    description:
      "Hafif ve katmanlanabilir dokulu, yoğun ışıltılı toz aydınlatıcı. Mika ve sentetik pigmentlerle vegan bir formüle sahiptir; talk içerir.",
    crueltyFree: true,
    skinTypes: ["Normal", "Kuru", "Karma"],
    pao: "24M",
    priceTier: "₺₺₺",
    ingredients: [
      "Mica",
      "Talc",
      "Dimethicone",
      "Caprylic/Capric Triglyceride",
      "Silica",
      "Titanium Dioxide",
      "Iron Oxides",
      "Tocopherol",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "fenty-sun-stalkr-bronzer",
    brandId: "fenty-beauty",
    brand: "Fenty Beauty",
    name: "Sun Stalk'r Instant Warmth Bronzer",
    category: "yuz",
    categoryLabel: "Yüz · Toz Bronzer",
    image: "assets/images/blush.jpg",
    description:
      "Cilde doğal bir güneş sıcaklığı veren ipeksi toz bronzer. Vegan formüldür ancak talk ve paraben içermesi nedeniyle temiz içerik arayanlar dikkat etmelidir.",
    crueltyFree: true,
    skinTypes: ["Normal", "Karma", "Yağlı"],
    pao: "24M",
    priceTier: "₺₺₺",
    ingredients: [
      "Talc",
      "Mica",
      "Dimethicone",
      "Silica",
      "Caprylic/Capric Triglyceride",
      "Iron Oxides",
      "Titanium Dioxide",
      "Methylparaben",
      "Propylparaben",
      "Tocopherol"
    ]
  },
  {
    id: "fenty-hella-thicc-mascara",
    brandId: "fenty-beauty",
    brand: "Fenty Beauty",
    name: "Hella Thicc Hacim Maskarası",
    category: "goz",
    categoryLabel: "Göz · Hacim Maskarası",
    image: "assets/images/mascara.jpg",
    description:
      "Kirpiklere yoğun hacim ve tanımlama veren vegan maskara. Balmumu içermez; bitkisel mumlar ve film oluşturucularla kalıcılık sağlar.",
    crueltyFree: true,
    skinTypes: ["Normal", "Hassas Gözler"],
    pao: "6M",
    priceTier: "₺₺₺",
    ingredients: [
      "Aqua",
      "Copernicia Cerifera Cera",
      "Euphorbia Cerifera Cera",
      "Stearic Acid",
      "Iron Oxides",
      "Butylene Glycol",
      "Panthenol",
      "Xanthan Gum",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },

  // ========================
  // FLORMAR
  // ========================
  {
    id: "flormar-silk-matte-lipstick",
    brandId: "flormar",
    brand: "Flormar",
    name: "Silk Matte Kadife Mat Ruj",
    category: "dudak",
    categoryLabel: "Dudak · Mat Ruj",
    image: "assets/images/lipstick.jpg",
    description:
      "Yoğun gül kurusu renk veren klasik mat ruj. Formülünde Balmumu (Cera Alba) ve kırmızı pigment olarak Karmin (CI 75470) bulunduğu için vegan değildir.",
    crueltyFree: true,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺",
    ingredients: [
      "Ricinus Communis Seed Oil",
      "Caprylic/Capric Triglyceride",
      "Cera Alba",
      "Dimethicone",
      "Carmine",
      "Titanium Dioxide",
      "Iron Oxides",
      "Tocopherol",
      "Parfum",
      "Phenoxyethanol"
    ]
  },
  {
    id: "flormar-precious-mascara",
    brandId: "flormar",
    brand: "Flormar",
    name: "Precious Curl Kıvırıcı Maskara",
    category: "goz",
    categoryLabel: "Göz · Maskara",
    image: "assets/images/mascara.jpg",
    description:
      "Pantenol ve tatlı bitkisel yağlarla kirpikleri besleyen temiz içerikli maskara; ancak doğal Balmumu (Cera Alba) içerdiği için vegan kategorisinde değildir.",
    crueltyFree: true,
    skinTypes: ["Hassas Gözler", "Normal"],
    pao: "6M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Iron Oxides",
      "Cera Alba",
      "Copernicia Cerifera Cera",
      "Simmondsia Chinensis Seed Oil",
      "Panthenol",
      "Tocopherol",
      "Xanthan Gum",
      "Sodium Benzoate",
      "Potassium Sorbate"
    ]
  },
  {
    id: "flormar-perfect-coverage-foundation",
    brandId: "flormar",
    brand: "Flormar",
    name: "Perfect Coverage Fondöten",
    category: "yuz",
    categoryLabel: "Yüz · Fondöten",
    image: "assets/images/foundation.jpg",
    description:
      "Orta-yüksek kapatıcılıklı, uygun fiyatlı klasik likit fondöten. Silikon, parfüm ve paraben içerdiğinden hassas ve akneye meyilli ciltlerde dikkat gerektirir.",
    crueltyFree: true,
    skinTypes: ["Normal", "Karma", "Kuru"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Cyclopentasiloxane",
      "Dimethicone",
      "Glycerin",
      "Titanium Dioxide",
      "Iron Oxides",
      "Talc",
      "Methylparaben",
      "Propylparaben",
      "Phenoxyethanol",
      "Parfum"
    ]
  },
  {
    id: "flormar-blush-on",
    brandId: "flormar",
    brand: "Flormar",
    name: "Blush-On Toz Allık",
    category: "yuz",
    categoryLabel: "Yüz · Toz Allık",
    image: "assets/images/blush.jpg",
    description:
      "Sıkıştırılmış toz yapıda, kolay dağılan günlük allık. Talk, mineral yağ ve parabenler içerdiği için sağlık skoru düşüktür; pembe tonlarda karmin bulunabilir.",
    crueltyFree: true,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺",
    ingredients: [
      "Talc",
      "Mica",
      "Mineral Oil",
      "Dimethicone",
      "Iron Oxides",
      "Titanium Dioxide",
      "Carmine",
      "Methylparaben",
      "Propylparaben"
    ]
  },
  {
    id: "flormar-extreme-tattoo-liner",
    brandId: "flormar",
    brand: "Flormar",
    name: "Extreme Tattoo Liner Kalem Uçlu Eyeliner",
    category: "goz",
    categoryLabel: "Göz · Likit Eyeliner",
    image: "assets/images/mascara.jpg",
    description:
      "Keçe uçlu, yoğun siyah ve uzun süre kalıcı likit eyeliner. Koruyucu sistemi nedeniyle göz çevresi hassas olanlar dikkatli kullanmalıdır.",
    crueltyFree: true,
    skinTypes: ["Normal"],
    pao: "6M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Butylene Glycol",
      "Propylene Glycol",
      "Iron Oxides",
      "Panthenol",
      "Phenoxyethanol",
      "Methylparaben",
      "Disodium EDTA"
    ]
  },
  {
    id: "flormar-waterproof-lipliner",
    brandId: "flormar",
    brand: "Flormar",
    name: "Waterproof Dudak Kalemi",
    category: "dudak",
    categoryLabel: "Dudak · Dudak Kalemi",
    image: "assets/images/lipstick.jpg",
    description:
      "Suya dayanıklı, kremsi dokulu dudak kalemi. Formülünde balmumu (Cera Alba) bulunduğu için vegan değildir.",
    crueltyFree: true,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺",
    ingredients: [
      "Caprylic/Capric Triglyceride",
      "Cera Alba",
      "Copernicia Cerifera Cera",
      "Mica",
      "Titanium Dioxide",
      "Iron Oxides",
      "CI 15850",
      "Tocopherol",
      "BHT"
    ]
  },

  // ========================
  // MAC COSMETICS
  // ========================
  {
    id: "mac-ruby-matte-lipstick",
    brandId: "mac-cosmetics",
    brand: "MAC Cosmetics",
    name: "Ruby Velvet Klasik Mat Ruj",
    category: "dudak",
    categoryLabel: "Dudak · Mat Ruj",
    image: "assets/images/lipstick.jpg",
    description:
      "İkonik yüksek pigmentli kırmızı/gül tonlu mat ruj. Karmin, Lanolin ve Balmumu gibi hayvansal içerikler ile sentetik BHT ve parfüm barındırır.",
    crueltyFree: false,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺₺₺",
    ingredients: [
      "Ricinus Communis Seed Oil",
      "Cera Alba",
      "Lanolin",
      "Dimethicone",
      "Carmine",
      "Titanium Dioxide",
      "Iron Oxides",
      "Parfum",
      "Limonene",
      "BHT",
      "Propylparaben"
    ]
  },
  {
    id: "mac-neutral-eyeshadow",
    brandId: "mac-cosmetics",
    brand: "MAC Cosmetics",
    name: "Neutral Prism 9'lu Far Paleti",
    category: "goz",
    categoryLabel: "Göz · Far Paleti",
    image: "assets/images/eyeshadow.jpg",
    description:
      "Profesyonel tonlarda 9'lu far paleti. Talk pudrası, parabenler ve pembe/kırmızı tonlarda Karmin içerdiği için temiz içerik arayanlar için riskli sınıftadır.",
    crueltyFree: false,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺₺₺",
    ingredients: [
      "Talc",
      "Mica",
      "Dimethicone",
      "Iron Oxides",
      "Carmine",
      "Methylparaben",
      "Propylparaben",
      "Parfum"
    ]
  },
  {
    id: "mac-studio-fix-fluid",
    brandId: "mac-cosmetics",
    brand: "MAC Cosmetics",
    name: "Studio Fix Fluid SPF 15 Fondöten",
    category: "yuz",
    categoryLabel: "Yüz · Mat Fondöten",
    image: "assets/images/foundation.jpg",
    description:
      "Orta-yüksek kapatıcılıklı, mat bitişli ve SPF 15 korumalı ikonik fondöten. Kimyasal UV filtresi, silikon ve parfüm içerir.",
    crueltyFree: false,
    skinTypes: ["Yağlı", "Karma"],
    spf: 15,
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Aqua",
      "Cyclopentasiloxane",
      "Dimethicone",
      "Ethylhexyl Methoxycinnamate",
      "Titanium Dioxide",
      "Iron Oxides",
      "Butylene Glycol",
      "Talc",
      "Silica",
      "Phenoxyethanol",
      "Methylparaben",
      "Parfum"
    ]
  },
  {
    id: "mac-studio-fix-powder",
    brandId: "mac-cosmetics",
    brand: "MAC Cosmetics",
    name: "Studio Fix Powder Plus Foundation",
    category: "yuz",
    categoryLabel: "Yüz · Pudra Fondöten",
    image: "assets/images/foundation.jpg",
    description:
      "Pudra ve fondöten görevini tek adımda gören mat bitişli kompakt pudra. Talk, mineral yağ ve parabenler içerir.",
    crueltyFree: false,
    skinTypes: ["Yağlı", "Karma"],
    pao: "24M",
    priceTier: "₺₺₺",
    ingredients: [
      "Talc",
      "Mica",
      "Dimethicone",
      "Mineral Oil",
      "Titanium Dioxide",
      "Iron Oxides",
      "Silica",
      "Methylparaben",
      "Propylparaben",
      "Tocopherol"
    ]
  },
  {
    id: "mac-fix-plus-setting-spray",
    brandId: "mac-cosmetics",
    brand: "MAC Cosmetics",
    name: "Prep + Prime Fix+ Sabitleyici Sprey",
    category: "yuz",
    categoryLabel: "Yüz · Sabitleyici Sprey",
    image: "assets/images/foundation.jpg",
    description:
      "Makyajı sabitleyen ve cildi tazeleyen yüz spreyi. Yeşil çay, papatya ve salatalık özleri içerir; parfüm bileşenleri hassas ciltlerde tahrişe yol açabilir.",
    crueltyFree: false,
    skinTypes: ["Tüm Ciltler"],
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Aqua",
      "Glycerin",
      "Butylene Glycol",
      "Panthenol",
      "Bisabolol",
      "Phenoxyethanol",
      "Disodium EDTA",
      "Parfum",
      "Linalool",
      "Citronellol"
    ]
  },
  {
    id: "mac-lipglass",
    brandId: "mac-cosmetics",
    brand: "MAC Cosmetics",
    name: "Lipglass Dudak Parlatıcısı",
    category: "dudak",
    categoryLabel: "Dudak · Dudak Parlatıcısı",
    image: "assets/images/lipoil.jpg",
    description:
      "Cam etkili yoğun parlaklık veren klasik dudak parlatıcısı. Lanolin ve bazı tonlarda karmin içerdiği için vegan değildir.",
    crueltyFree: false,
    skinTypes: ["Normal", "Kuru"],
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Mineral Oil",
      "Lanolin",
      "Ricinus Communis Seed Oil",
      "Silica",
      "Mica",
      "Titanium Dioxide",
      "Iron Oxides",
      "Carmine",
      "Tocopherol",
      "Parfum",
      "BHT"
    ]
  },

  // ========================
  // MAYBELLINE NEW YORK
  // ========================
  {
    id: "maybelline-sky-high-mascara",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "Lash Sensational Sky High Maskara",
    category: "goz",
    categoryLabel: "Göz · Uzatıcı Maskara",
    image: "assets/images/mascara.jpg",
    description:
      "Bambu özü ve esnek fırçasıyla yoğun uzunluk veren ikonik maskara. Balmumu (Cera Alba) içerdiği için vegan değildir; kurutucu alkol nedeniyle çok hassas gözlerde dikkat gerektirir.",
    crueltyFree: false,
    skinTypes: ["Normal", "Karma"],
    pao: "6M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Iron Oxides",
      "Cera Alba",
      "Copernicia Cerifera Cera",
      "Alcohol Denat.",
      "Dimethicone",
      "Phenoxyethanol",
      "Panthenol"
    ]
  },
  {
    id: "maybelline-lash-sensational-mascara",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "Lash Sensational Yelpaze Etkili Maskara",
    category: "goz",
    categoryLabel: "Göz · Hacim Maskarası",
    image: "assets/images/mascara.jpg",
    description:
      "Kuşburnu yağı destekli, kirpikleri tek tek ayıran yelpaze etkili klasik maskara. Doğal Balmumu (Cera Alba) içerdiği için vegan değildir.",
    crueltyFree: false,
    skinTypes: ["Normal"],
    pao: "6M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Cera Alba",
      "Copernicia Cerifera Cera",
      "Iron Oxides",
      "Rosa Canina Fruit Oil",
      "Glycerin",
      "Dimethicone",
      "Phenoxyethanol",
      "Tocopherol"
    ]
  },
  {
    id: "maybelline-instant-anti-age-eraser",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "Instant Anti-Age Eraser Kapatıcı",
    category: "yuz",
    categoryLabel: "Yüz · Göz Altı & Yüz Kapatıcı",
    image: "assets/images/foundation.jpg",
    description:
      "Sünger aplikatörlü, yüksek kapatıcılıklı popüler yüz ve göz altı kapatıcısı. Silikon ve fenoksietanol içerir; vegan formüle yakındır ancak gliserin kaynağı kontrol edilmelidir.",
    crueltyFree: false,
    skinTypes: ["Normal", "Kuru", "Karma"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Cyclopentasiloxane",
      "Dimethicone",
      "Glycerin",
      "Titanium Dioxide",
      "Iron Oxides",
      "Silica",
      "Sodium Chloride",
      "Tocopherol",
      "Phenoxyethanol",
      "Caprylyl Glycol"
    ]
  },
  {
    id: "maybelline-fit-me-concealer",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "Fit Me! Likit Yüz Kapatıcısı",
    category: "yuz",
    categoryLabel: "Yüz · Kapatıcı",
    image: "assets/images/foundation.jpg",
    description:
      "Yağsız yapısıyla doğal ve mat bitiş sunan günlük yüz kapatıcısı. Akneye meyilli ciltlerde akşam iyi temizlenmesi önerilir.",
    crueltyFree: false,
    skinTypes: ["Karma", "Yağlı", "Normal"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Cyclopentasiloxane",
      "Dimethicone",
      "Glycerin",
      "Titanium Dioxide",
      "Iron Oxides",
      "Silica",
      "Tocopherol",
      "Phenoxyethanol",
      "Disodium EDTA"
    ]
  },
  {
    id: "maybelline-fit-me-foundation",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "Fit Me! Matte + Poreless Fondöten",
    category: "yuz",
    categoryLabel: "Yüz · Mat Fondöten",
    image: "assets/images/foundation.jpg",
    description:
      "Gözenek görünümünü yumuşatan kil ve silika destekli mat fondöten. Yağlı ve karma ciltlerde parlamayı kontrol etmeye yardımcı olur.",
    crueltyFree: false,
    skinTypes: ["Yağlı", "Karma"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Cyclopentasiloxane",
      "Dimethicone",
      "Glycerin",
      "Kaolin",
      "Silica",
      "Titanium Dioxide",
      "Iron Oxides",
      "Tocopherol",
      "Phenoxyethanol"
    ]
  },
  {
    id: "maybelline-nudes-palette",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "The Nudes 9'lu Far Paleti",
    category: "goz",
    categoryLabel: "Göz · Far Paleti",
    image: "assets/images/eyeshadow.jpg",
    description:
      "Günlük nude tonlarda far paleti. Talk, Mineral Yağ, Karmin, Guanin ve Parabenler içerdiğinden hem sağlık skoru düşüktür hem de vegan değildir.",
    crueltyFree: false,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺",
    ingredients: [
      "Talc",
      "Mica",
      "Mineral Oil",
      "Dimethicone",
      "Iron Oxides",
      "Carmine",
      "Guanine",
      "Methylparaben",
      "Propylparaben",
      "BHT"
    ]
  },
  {
    id: "maybelline-superstay-matte-ink",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "SuperStay Matte Ink Likit Ruj",
    category: "dudak",
    categoryLabel: "Dudak · Likit Mat Ruj",
    image: "assets/images/lipstick.jpg",
    description:
      "16 saate kadar kalıcılık iddiasıyla bilinen, transfer yapmayan likit mat ruj. Uçucu silikonlar ve isododekan dudakları kurutabilir; parfüm içerir.",
    crueltyFree: false,
    skinTypes: ["Normal"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Dimethicone",
      "Isododecane",
      "Silica",
      "Cyclopentasiloxane",
      "Titanium Dioxide",
      "Iron Oxides",
      "CI 15850",
      "Phenoxyethanol",
      "Parfum",
      "Linalool"
    ]
  },
  {
    id: "maybelline-lifter-gloss",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "Lifter Gloss Hyaluronik Asitli Dudak Parlatıcısı",
    category: "dudak",
    categoryLabel: "Dudak · Dudak Parlatıcısı",
    image: "assets/images/lipoil.jpg",
    description:
      "Hyaluronik asit ile dudakları nemlendirip dolgun gösteren parlatıcı. Mineral yağ ve parfüm içerdiğinden temiz içerik skoru ortalamadır.",
    crueltyFree: false,
    skinTypes: ["Kuru", "Normal"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Mineral Oil",
      "Ricinus Communis Seed Oil",
      "Silica",
      "Sodium Hyaluronate",
      "Mica",
      "Titanium Dioxide",
      "Iron Oxides",
      "Tocopherol",
      "Parfum",
      "BHT"
    ]
  },
  {
    id: "maybelline-tattoo-brow-gel",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "Tattoo Brow 36H Kaş Şekillendirici Jel",
    category: "goz",
    categoryLabel: "Göz · Renkli Kaş Jeli",
    image: "assets/images/mascara.jpg",
    description:
      "Kaşları doldurup şekillendiren, uzun süre kalıcı renkli kaş jeli. Alkol ve film oluşturucular içerdiğinden kuru ciltlerde kuruluk yapabilir.",
    crueltyFree: false,
    skinTypes: ["Normal", "Yağlı"],
    pao: "6M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Alcohol Denat.",
      "Iron Oxides",
      "Copernicia Cerifera Cera",
      "Glycerin",
      "Mica",
      "Phenoxyethanol",
      "Disodium EDTA"
    ]
  },
  {
    id: "maybelline-master-chrome-highlighter",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "Master Chrome Metalik Aydınlatıcı",
    category: "yuz",
    categoryLabel: "Yüz · Toz Aydınlatıcı",
    image: "assets/images/blush.jpg",
    description:
      "Metalik ve yoğun ışıltılı toz aydınlatıcı. Talk ve paraben içerir; bazı tonlarda pigment kaynağı olarak karmin bulunabilir.",
    crueltyFree: false,
    skinTypes: ["Normal", "Kuru"],
    pao: "24M",
    priceTier: "₺",
    ingredients: [
      "Mica",
      "Talc",
      "Dimethicone",
      "Synthetic Beeswax",
      "Titanium Dioxide",
      "Iron Oxides",
      "Carmine",
      "Methylparaben",
      "Propylparaben"
    ]
  },

  // ========================
  // GOLDEN ROSE
  // ========================
  {
    id: "golden-rose-velvet-matte",
    brandId: "golden-rose",
    brand: "Golden Rose",
    name: "Velvet Matte Ruj",
    category: "dudak",
    categoryLabel: "Dudak · Mat Ruj",
    image: "assets/images/lipstick.jpg",
    description:
      "Türkiye'de en çok tercih edilen kadife mat ruj serisi. E vitamini ve yumuşatıcı yağlar içerir; bazı tonlarda balmumu ve parfüm bulunabilir.",
    crueltyFree: true,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺",
    ingredients: [
      "Ricinus Communis Seed Oil",
      "Caprylic/Capric Triglyceride",
      "Cera Alba",
      "Copernicia Cerifera Cera",
      "Silica",
      "Tocopherol",
      "Iron Oxides",
      "Titanium Dioxide",
      "CI 15850",
      "Parfum"
    ]
  },
  {
    id: "golden-rose-hd-foundation",
    brandId: "golden-rose",
    brand: "Golden Rose",
    name: "Total Cover 2in1 Fondöten & Kapatıcı",
    category: "yuz",
    categoryLabel: "Yüz · Fondöten & Kapatıcı",
    image: "assets/images/foundation.jpg",
    description:
      "Yüksek kapatıcılıklı, yağsız ve vegan formüllü fondöten & kapatıcı. Silikon ve fenoksietanol içerdiğinden akneye meyilli ciltlerde iyi temizlenmelidir.",
    crueltyFree: true,
    skinTypes: ["Karma", "Yağlı"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Cyclopentasiloxane",
      "Dimethicone",
      "Titanium Dioxide",
      "Iron Oxides",
      "Propanediol",
      "Silica",
      "Tocopherol",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "golden-rose-terracotta-blush",
    brandId: "golden-rose",
    brand: "Golden Rose",
    name: "Terracotta Blush-On Toz Allık",
    category: "yuz",
    categoryLabel: "Yüz · Toz Allık",
    image: "assets/images/blush.jpg",
    description:
      "Pişmiş (baked) teknolojiyle üretilen, ışıltılı ve doğal görünümlü toz allık. Talk ve parabenler içerir.",
    crueltyFree: true,
    skinTypes: ["Normal", "Karma"],
    pao: "24M",
    priceTier: "₺",
    ingredients: [
      "Talc",
      "Mica",
      "Dimethicone",
      "Caprylic/Capric Triglyceride",
      "Iron Oxides",
      "Titanium Dioxide",
      "Silica",
      "Methylparaben",
      "Propylparaben"
    ]
  },
  {
    id: "golden-rose-dream-lips-lipliner",
    brandId: "golden-rose",
    brand: "Golden Rose",
    name: "Dream Lips Dudak Kalemi",
    category: "dudak",
    categoryLabel: "Dudak · Dudak Kalemi",
    image: "assets/images/lipstick.jpg",
    description:
      "Yumuşak dokulu, kolay sürülen ve rujun dağılmasını önleyen dudak kalemi. Balmumu ve lanolin türevleri içerdiğinden vegan değildir.",
    crueltyFree: true,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺",
    ingredients: [
      "Caprylic/Capric Triglyceride",
      "Cera Alba",
      "Lanolin",
      "Copernicia Cerifera Cera",
      "Mica",
      "Titanium Dioxide",
      "Iron Oxides",
      "Tocopherol",
      "BHT"
    ]
  },

  // ========================
  // PASTEL
  // ========================
  {
    id: "pastel-show-cream-blush",
    brandId: "pastel",
    brand: "Pastel",
    name: "Show By Pastel Krem Allık",
    category: "yuz",
    categoryLabel: "Yüz · Krem Allık",
    image: "assets/images/blush.jpg",
    description:
      "Doğal ve taze görünüm veren %100 vegan, cruelty-free ve paraben içermeyen krem allık.",
    crueltyFree: true,
    skinTypes: ["Kuru", "Normal", "Hassas"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Caprylic/Capric Triglyceride",
      "Squalane",
      "Euphorbia Cerifera Cera",
      "Silica",
      "Mica",
      "Titanium Dioxide",
      "Iron Oxides",
      "CI 15850",
      "Tocopherol"
    ]
  },
  {
    id: "pastel-profashion-lip-oil",
    brandId: "pastel",
    brand: "Pastel",
    name: "Profashion Plump Up Dudak Parlatıcısı & Yağı",
    category: "dudak",
    categoryLabel: "Dudak · Parlatıcı & Yağ",
    image: "assets/images/lipoil.jpg",
    description:
      "Jojoba yağı, hyaluronik asit ve E vitamini ile dudakları dolgunlaştıran vegan ve temiz içerikli dudak yağı.",
    crueltyFree: true,
    skinTypes: ["Kuru", "Hassas", "Tüm Ciltler"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Ricinus Communis Seed Oil",
      "Simmondsia Chinensis Seed Oil",
      "Squalane",
      "Sodium Hyaluronate",
      "Butyrospermum Parkii Butter",
      "Tocopherol",
      "Iron Oxides",
      "CI 15850"
    ]
  },
  {
    id: "pastel-daylong-kissproof",
    brandId: "pastel",
    brand: "Pastel",
    name: "Profashion Daylong Lipcolor Kissproof Likit Ruj",
    category: "dudak",
    categoryLabel: "Dudak · Likit Ruj",
    image: "assets/images/lipstick.jpg",
    description:
      "Bulaşmaz formülüyle gün boyu kalıcılık sunan vegan likit ruj. Hızlı kuruyan yapısı nedeniyle kuru dudaklarda nemlendirici öncesi önerilir.",
    crueltyFree: true,
    skinTypes: ["Normal"],
    pao: "12M",
    priceTier: "₺",
    ingredients: [
      "Isododecane",
      "Dimethicone",
      "Silica",
      "Caprylic/Capric Triglyceride",
      "Titanium Dioxide",
      "Iron Oxides",
      "CI 15850",
      "Tocopherol"
    ]
  },

  // ========================
  // REVOLUTION BEAUTY
  // ========================
  {
    id: "revolution-conceal-define",
    brandId: "revolution",
    brand: "Revolution Beauty",
    name: "Conceal & Define Kapatıcı",
    category: "yuz",
    categoryLabel: "Yüz · Kapatıcı",
    image: "assets/images/foundation.jpg",
    description:
      "Tam kapatıcılıklı, %100 vegan ve PETA onaylı cruelty-free likit kapatıcı.",
    crueltyFree: true,
    skinTypes: ["Karma", "Yağlı", "Normal"],
    pao: "12M",
    certifications: ["PETA Cruelty-Free"],
    priceTier: "₺",
    ingredients: [
      "Aqua",
      "Dimethicone",
      "Propanediol",
      "Titanium Dioxide",
      "Iron Oxides",
      "Silica",
      "Rosa Canina Fruit Oil",
      "Tocopherol",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "revolution-reloaded-palette",
    brandId: "revolution",
    brand: "Revolution Beauty",
    name: "Reloaded Far Paleti",
    category: "goz",
    categoryLabel: "Göz · Far Paleti",
    image: "assets/images/eyeshadow.jpg",
    description:
      "Mat ve ışıltılı tonları bir arada sunan 15'li vegan far paleti. Talk ve mineral yağ içerir; karmin yerine sentetik pigmentler kullanılır.",
    crueltyFree: true,
    skinTypes: ["Normal"],
    pao: "24M",
    certifications: ["PETA Cruelty-Free"],
    priceTier: "₺",
    shades: 15,
    ingredients: [
      "Talc",
      "Mica",
      "Mineral Oil",
      "Dimethicone",
      "Silica",
      "Iron Oxides",
      "Titanium Dioxide",
      "CI 15850",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "revolution-loose-baking-powder",
    brandId: "revolution",
    brand: "Revolution Beauty",
    name: "Loose Baking Powder Sabitleyici Pudra",
    category: "yuz",
    categoryLabel: "Yüz · Toz Pudra",
    image: "assets/images/foundation.jpg",
    description:
      "Kapatıcı ve fondöteni sabitleyip matlaştıran, ince öğütülmüş vegan toz pudra. Talk içerir.",
    crueltyFree: true,
    skinTypes: ["Yağlı", "Karma"],
    pao: "24M",
    certifications: ["PETA Cruelty-Free"],
    priceTier: "₺",
    ingredients: [
      "Talc",
      "Silica",
      "Mica",
      "Dimethicone",
      "Kaolin",
      "Titanium Dioxide",
      "Iron Oxides",
      "Phenoxyethanol",
      "Ethylhexylglycerin"
    ]
  },

  // ========================
  // NARS COSMETICS
  // ========================
  {
    id: "nars-orgasm-blush",
    brandId: "nars",
    brand: "NARS Cosmetics",
    name: "Orgasm İkonik Toz Allık",
    category: "yuz",
    categoryLabel: "Yüz · Toz Allık",
    image: "assets/images/blush.jpg",
    description:
      "Altın ışıltılı şeftali-pembe ikonik toz allık. Klasik formülünde Talk ve Karmin bulunduğu için hassas ciltler ve vegan kullanıcılar dikkat etmelidir.",
    crueltyFree: false,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺₺₺",
    ingredients: [
      "Talc",
      "Mica",
      "Dimethicone",
      "Titanium Dioxide",
      "Iron Oxides",
      "Carmine",
      "Tocopherol",
      "Phenoxyethanol"
    ]
  },
  {
    id: "nars-radiant-creamy-concealer",
    brandId: "nars",
    brand: "NARS Cosmetics",
    name: "Radiant Creamy Kapatıcı",
    category: "yuz",
    categoryLabel: "Yüz · Kapatıcı",
    image: "assets/images/foundation.jpg",
    description:
      "Kremsi dokulu, orta-yüksek kapatıcılıklı ve ışıltılı bitişli ikonik kapatıcı. Silikonlar, parabenler ve koruyucu sistem nedeniyle hassas gözlerde dikkat gerektirir.",
    crueltyFree: false,
    skinTypes: ["Normal", "Kuru", "Karma"],
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Aqua",
      "Cyclopentasiloxane",
      "Dimethicone",
      "Glycerin",
      "Titanium Dioxide",
      "Iron Oxides",
      "Butylene Glycol",
      "Sodium Chloride",
      "Tocopherol",
      "Methylparaben",
      "Phenoxyethanol"
    ]
  },
  {
    id: "nars-laguna-bronzer",
    brandId: "nars",
    brand: "NARS Cosmetics",
    name: "Laguna Toz Bronzer",
    category: "yuz",
    categoryLabel: "Yüz · Toz Bronzer",
    image: "assets/images/blush.jpg",
    description:
      "Doğal güneş görünümü veren mat-ışıltılı ikonik bronzer. Talk ve parabenler içerdiğinden temiz içerik skoru düşüktür.",
    crueltyFree: false,
    skinTypes: ["Normal", "Karma"],
    pao: "24M",
    priceTier: "₺₺₺",
    ingredients: [
      "Talc",
      "Mica",
      "Dimethicone",
      "Iron Oxides",
      "Titanium Dioxide",
      "Silica",
      "Methylparaben",
      "Propylparaben",
      "Tocopherol"
    ]
  },
  {
    id: "nars-powermatte-lipstick",
    brandId: "nars",
    brand: "NARS Cosmetics",
    name: "Powermatte Ruj",
    category: "dudak",
    categoryLabel: "Dudak · Mat Ruj",
    image: "assets/images/lipstick.jpg",
    description:
      "Tek sürüşte yoğun renk veren uzun süre kalıcı mat ruj. Balmumu ve bazı tonlarda karmin içerdiği için vegan değildir; parfüm barındırır.",
    crueltyFree: false,
    skinTypes: ["Normal"],
    pao: "24M",
    priceTier: "₺₺₺",
    ingredients: [
      "Ricinus Communis Seed Oil",
      "Isododecane",
      "Cera Alba",
      "Dimethicone",
      "Silica",
      "Carmine",
      "Titanium Dioxide",
      "Iron Oxides",
      "Parfum",
      "BHT"
    ]
  },
  {
    id: "nars-light-reflecting-foundation",
    brandId: "nars",
    brand: "NARS Cosmetics",
    name: "Light Reflecting Fondöten",
    category: "yuz",
    categoryLabel: "Yüz · Fondöten",
    image: "assets/images/foundation.jpg",
    description:
      "Cilt bakım içerikleriyle zenginleştirilmiş, doğal ışıltılı orta kapatıcılıklı fondöten. Silikon ve fenoksietanol içerir.",
    crueltyFree: false,
    skinTypes: ["Normal", "Kuru", "Karma"],
    pao: "12M",
    priceTier: "₺₺₺",
    ingredients: [
      "Aqua",
      "Dimethicone",
      "Butylene Glycol",
      "Glycerin",
      "Titanium Dioxide",
      "Iron Oxides",
      "Niacinamide",
      "Sodium Hyaluronate",
      "Silica",
      "Tocopherol",
      "Phenoxyethanol"
    ]
  },

  // ========================
  // SKIN SENSUAL
  // ========================
  {
    id: "skin-sensual-niacinamide-serum",
    brandId: "skin-sensual",
    brand: "Skin Sensual",
    name: "Niacinamide %10 + Zinc Gözenek & Leke Serumu",
    category: "yuz",
    categoryLabel: "Cilt Bakımı · Serum",
    image: "assets/images/foundation.jpg",
    description:
      "Niasinamid, Pantenol ve Hyaluronik Asit ile sebum dengesini destekleyen, gözenek görünümünü azaltmaya yardımcı %100 vegan ve parfümsüz bakım serumu.",
    crueltyFree: true,
    skinTypes: ["Yağlı", "Karma", "Hassas"],
    pao: "12M",
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Niacinamide",
      "Propanediol",
      "Panthenol",
      "Sodium Hyaluronate",
      "Allantoin",
      "Centella Asiatica Extract",
      "Xanthan Gum",
      "Ethylhexylglycerin",
      "Sodium Benzoate"
    ]
  },
  {
    id: "skin-sensual-hyaluronic-cream",
    brandId: "skin-sensual",
    brand: "Skin Sensual",
    name: "Hyaluronic Acid + Ceramide Bariyer Nemlendirici",
    category: "yuz",
    categoryLabel: "Cilt Bakımı · Nemlendirici",
    image: "assets/images/blush.jpg",
    description:
      "Seramid, skualan ve hyaluronik asit ile kuru ve hassas cilt bariyerini onaran, parfümsüz ve tamamen vegan nemlendirici krem.",
    crueltyFree: true,
    skinTypes: ["Kuru", "Hassas", "Normal"],
    pao: "12M",
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Squalane",
      "Ceramide NP",
      "Sodium Hyaluronate",
      "Butyrospermum Parkii Butter",
      "Cetearyl Alcohol",
      "Panthenol",
      "Allantoin",
      "Tocopherol",
      "Ethylhexylglycerin"
    ]
  },
  {
    id: "skin-sensual-cleansing-gel",
    brandId: "skin-sensual",
    brand: "Skin Sensual",
    name: "Nazik Yüz Temizleme Jeli (Sülfatsız)",
    category: "yuz",
    categoryLabel: "Cilt Bakımı · Temizleyici",
    image: "assets/images/lipoil.jpg",
    description:
      "SLS/SLES içermeyen Koko-Glukozit ve Aloe Vera bazlı, cildi kurutmadan makyaj ve kiri arındıran vegan temizleme jeli.",
    crueltyFree: true,
    skinTypes: ["Hassas", "Kuru", "Karma", "Normal"],
    pao: "12M",
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Coco-Glucoside",
      "Cocamidopropyl Betaine",
      "Aloe Barbadensis Leaf Juice",
      "Panthenol",
      "Allantoin",
      "Citric Acid",
      "Sodium Benzoate",
      "Potassium Sorbate"
    ]
  },

  // ========================
  // PURE CHOICE
  // ========================
  {
    id: "pure-choice-vitamin-c-serum",
    brandId: "pure-choice",
    brand: "Pure Choice",
    name: "Vitamin C + Ferulic Aydınlatıcı Serum",
    category: "yuz",
    categoryLabel: "Cilt Bakımı · Aydınlatıcı Serum",
    image: "assets/images/foundation.jpg",
    description:
      "C vitamini, E vitamini ve Hyaluronik Asit ile cilt tonunu eşitleyen ve ışıltı veren %100 vegan antioksidan serum.",
    crueltyFree: true,
    skinTypes: ["Normal", "Kuru", "Karma"],
    pao: "6M",
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Ascorbic Acid",
      "Propanediol",
      "Sodium Hyaluronate",
      "Tocopherol",
      "Panthenol",
      "Bisabolol",
      "Ethylhexylglycerin",
      "Potassium Sorbate"
    ]
  },
  {
    id: "pure-choice-bha-toner",
    brandId: "pure-choice",
    brand: "Pure Choice",
    name: "Salicylic Acid %2 Gözenek Arındırıcı Tonik",
    category: "yuz",
    categoryLabel: "Cilt Bakımı · Tonik",
    image: "assets/images/lipoil.jpg",
    description:
      "Salisilik Asit (BHA), Centella ve Niasinamid ile siyah nokta ve akne oluşumunu azaltmaya destek olan vegan arındırıcı tonik.",
    crueltyFree: true,
    skinTypes: ["Yağlı", "Karma"],
    pao: "12M",
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Propanediol",
      "Salicylic Acid",
      "Niacinamide",
      "Centella Asiatica Extract",
      "Allantoin",
      "Panthenol",
      "Citric Acid",
      "Sodium Benzoate"
    ]
  },
  {
    id: "pure-choice-mineral-spf",
    brandId: "pure-choice",
    brand: "Pure Choice",
    name: "Mineral Filtreli Hassas Cilt Güneş Kremi SPF 50+",
    category: "yuz",
    categoryLabel: "Cilt Bakımı · Güneş Kremi",
    image: "assets/images/blush.jpg",
    description:
      "Çinko Oksit ve Titanyum Dioksit mineral filtreleriyle geniş spektrumlu koruma sağlayan, parfümsüz ve %100 vegan güneş kremi.",
    crueltyFree: true,
    skinTypes: ["Hassas", "Kuru", "Normal", "Karma"],
    spf: 50,
    pao: "12M",
    priceTier: "₺₺",
    ingredients: [
      "Aqua",
      "Zinc Oxide",
      "Titanium Dioxide",
      "Caprylic/Capric Triglyceride",
      "Squalane",
      "Niacinamide",
      "Bisabolol",
      "Tocopherol",
      "Ethylhexylglycerin"
    ]
  }
];
