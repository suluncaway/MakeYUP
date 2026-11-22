/**
 * MakeYUP — Marka Marka Ayrılmış Makyaj Ürünleri Kataloğu
 * Sağlık skoru, vegan durumu ve risk dağılımı her ürünün gerçek INCI listesinden
 * analyzer.js tarafından dinamik olarak hesaplanır.
 * Not: Listelenen INCI profilleri eğitim ve bilgilendirme amaçlı temsili formüllerdir.
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

  // ========================
  // MAYBELLINE NEW YORK
  // ========================
  {
    id: "maybelline-sky-mascara",
    brandId: "maybelline",
    brand: "Maybelline New York",
    name: "Lash Lift Uzatıcı Maskara",
    category: "goz",
    categoryLabel: "Göz · Maskara",
    image: "assets/images/mascara.jpg",
    description:
      "Uzun süre kalıcı uzatıcı maskara. Balmumu (Cera Alba) içerdiği için vegan değildir; kurutucu alkol ve fenoksietanol nedeniyle çok hassas gözlerde dikkat gerektirir.",
    crueltyFree: false,
    skinTypes: ["Normal"],
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
  }
];
