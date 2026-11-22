/**
 * MakeYUP · Piksel Lab — Zararlı İçerikleri Kendi Başına Tanıma Rehberi & Quiz
 */

export const GUIDE_LESSONS = [
  {
    id: "read-label-30s",
    sprite: "magnifier",
    title: "Etiketi 30 saniyede oku",
    subtitle: "Sıralama, gizli kelimeler ve renk kodları",
    bullets: [
      "%1'in üzerindeki bileşenler çoktan aza doğru sıralanır; listenin ilk 5 maddesi ürünün gövdesidir.",
      "%1 altındaki maddeler (koruyucular, aktifler, kokular) karışık sırada yazılabilir.",
      "\"Parfum\" veya \"Fragrance\" tek bir kelime gibi görünse de onlarca sentetik koku kimyasalını gizleyebilir.",
      "\"+/-\" veya \"May contain\" ifadesinden sonra gelenler farklı renk tonlarındaki pigmentlerdir.",
      "\"CI\" ile başlayan 5 haneli kodlar (örn. CI 77491, CI 75470) renklendirici pigmentleri gösterir."
    ],
    tip: "İlk 5 maddede bol miktarda Alcohol Denat. veya Mineral Oil görüyorsan o madde ürünün ana bileşeni demektir; son sıralarda ise etkisi çok daha hafiftir.",
    sampleInci: "Aqua, Glycerin, Niacinamide, Cetearyl Alcohol, Parfum, +/- CI 77891, CI 77491, CI 75470"
  },
  {
    id: "red-flags",
    sprite: "cross",
    title: "Kırmızı bayraklar (kaçın)",
    subtitle: "Etikette görünce durup düşünmen gereken gruplar",
    bullets: [
      "Parabenler: Sonu \"-paraben\" ile bitenler (Methylparaben, Propylparaben, Butylparaben) — endokrin sistem şüphesi.",
      "Formaldehit salıcılar: DMDM Hydantoin, Imidazolidinyl Urea, Diazolidinyl Urea, Quaternium-15, Bronopol — zamanla formaldehit salıp alerji yapabilir.",
      "MIT / MCI: Methylisothiazolinone ve Methylchloroisothiazolinone — durulanmayan ürünlerde güçlü kontakt alerjen.",
      "PFAS (sonsuz kimyasallar): İçinde PTFE, \"perfluoro-\" veya \"polyfluoro-\" geçen suya dayanıklı bileşenler.",
      "BHA / BHT (sentetik antioksidanlar), Oxybenzone (Benzophenone-3 kimyasal UV filtresi) ve Triclosan — hormonal etki endişesi.",
      "Talk (Talc): Özellikle toz far ve pudralarda asbest bulaşma ve solunum riski nedeniyle temiz alternatifler tercih edilir."
    ],
    tip: "İpucu: Kelimenin sonuna ve köküne bak — \"-paraben\", \"urea\", \"fluoro\" ve \"BHT\" eklerini hızlıca taramak 5 saniye sürer.",
    sampleInci: "Talc, Mica, Mineral Oil, Propylparaben, BHT, DMDM Hydantoin, PTFE"
  },
  {
    id: "yellow-flags",
    sprite: "warning",
    title: "Sarı bayraklar (dikkat)",
    subtitle: "Herkese zararlı değil ama hassas ciltte tepki verebilir",
    bullets: [
      "Parfüm ve 26 AB koku alerjeni: Limonene, Linalool, Citronellol, Geraniol, Eugenol, Coumarin.",
      "Alcohol Denat. (SD Alcohol): Ürünü hızlı kurutur; yüksek oranda kuru ve rozasealı cilt bariyerini zayıflatabilir.",
      "SLS (Sodium Lauryl Sulfate): Güçlü köpürtücüdür; hassas ve kuru ciltte gerginlik/kuruluk yapabilir.",
      "Mineral Oil / Petrolatum: Gözenekleri tek başına tıkamasa da yağlı/akneye meyilli ciltlerde komedon hissini artırabilir.",
      "Ağır silikonlar (Dimethicone, Cyclopentasiloxane): Pürüzsüzlük verir ancak akşam iyi temizlenmezse sivilceye yatkın ciltte birikebilir.",
      "Retinol / Retinyl Palmitate: Güçlü yaşlanma karşıtı aktiflerdir; gündüz güneş korumasız kullanılmamalı ve hamilelikte kaçınılmalıdır."
    ],
    tip: "Sarı bayrak gördüysen hemen çöpe atma: ürün yüzünde kalıyor mu yoksa yıkanıyor mu, ve senin cilt tipin hassas/akneli mi diye kontrol et.",
    sampleInci: "Aqua, Alcohol Denat., Dimethicone, Parfum, Limonene, Linalool, Phenoxyethanol"
  },
  {
    id: "myths",
    sprite: "sparkle",
    title: "Yanlış bilinenler",
    subtitle: "Korkutucu görünen ama aslında güvenli gerçekler",
    bullets: [
      "\"Alkol\" yazan her şey kurutmaz: Cetearyl Alcohol, Cetyl Alcohol ve Stearyl Alcohol cildi yumuşatan yağ alkolleridir.",
      "\"Doğal\" her zaman zararsız değildir: Zehirli sarmaşık da doğaldır; lavanta ve turunçgil uçucu yağları alerji yapabilir.",
      "\"Kimyasalsız\" kozmetik olmaz: Saf su (Aqua) ve E vitamini (Tocopherol) dahil evrendeki her madde kimyasaldır.",
      "Silikon toksik değildir: Dimethicone gibi silikonlar büyük moleküllüdür, deriden kana karışmaz; yalnız akne eğilimli ciltte arındırma ister.",
      "Doz ve temas süresi belirleyicidir: Durulanan bir temizleyicideki madde ile gece boyu kalan kremdeki aynı maddenin etkisi farklıdır."
    ],
    tip: "Etikette Latince uzun bir kimyasal adı görürsen korkma: örneğin Tocopherol sadece E vitaminidir, Ascorbic Acid ise C vitaminidir.",
    sampleInci: "Aqua, Cetearyl Alcohol, Caprylic/Capric Triglyceride, Tocopherol, Ascorbic Acid"
  },
  {
    id: "vegan-check",
    sprite: "leaf",
    title: "Vegan mı? Hızlı kontrol",
    subtitle: "Bitkisel görünen ama hayvansal olabilen 9 gizli madde",
    bullets: [
      "Carmine / CI 75470 / Cochineal: Koşnil böceğinin ezilmesiyle elde edilen kırmızı pigment (ruj, allık, pembe far).",
      "Cera Alba / Beeswax: Bal arısı mumu (ruj, maskara, dudak balmı). Bitkisel alternatifleri: Candelilla, Carnauba.",
      "Lanolin: Koyun yününden elde edilen yağ.",
      "Guanine / CI 75170: Balık pullarından elde edilen sedefli ışıltı; Shellac ise lak böceği salgısıdır.",
      "Keratin, Collagen, Mel (Bal), Propolis ve Snail Secretion Filtrate hayvansal kökenlidir.",
      "Squalene vs. Squalane farkı: Squalene köpekbalığı karaciğerinden gelebilir; modern Squalane çoğunlukla zeytin veya şeker kamışıdır."
    ],
    tip: "Kırmızı bir rujda \"CI 75470\" veya \"Carmine\", maskarada \"Cera Alba\" görmüyorsan vegan olma ihtimali çok yüksektir (Gliserin kaynağını da ambalajda kontrol et).",
    sampleInci: "Ricinus Communis Seed Oil, Cera Alba, Lanolin, Carmine, CI 75470, Guanine"
  },
  {
    id: "skin-type",
    sprite: "bottle",
    title: "Cilt tipine göre seç",
    subtitle: "Kuru, yağlı/akne ve hassas cilt için pusula",
    bullets: [
      "Kuru cilt — Ara: Hyaluronic Acid (Sodium Hyaluronate), Glycerin, Squalane, Ceramide, Shea Butter. Kaçın: ilk sıralarda Alcohol Denat. ve sert SLS.",
      "Yağlı / Akneye meyilli cilt — Ara: Niacinamide, Salicylic Acid (BHA), Zinc PCA, Kaolin, Silica. Dikkat/Kaçın: Coconut Oil, Isopropyl Myristate, Lanolin, ağır Mineral Oil.",
      "Hassas / Rozasealı cilt — Ara: Panthenol (B5), Centella Asiatica (Cica), Allantoin, Bisabolol, Çinko Oksit. Kaçın: Parfum, Limonene/Linalool, MIT/MCI, sert peeling asitleri.",
      "Karma cilt — T bölgesini tıkamayan hafif nemlendiriciler (Squalane, Propanediol) ve gözenek dostu formüller en dengeli seçenektir."
    ],
    tip: "Cilt tipine uymayan tek bir içerik tüm ürünü kötü yapmaz, ama her gün kullanacağın nemlendirici veya fondötende başrolde olmamasına dikkat et.",
    sampleInci: "Aqua, Niacinamide, Squalane, Ceramide NP, Panthenol, Centella Asiatica Extract"
  }
];

export const GUIDE_QUIZ = [
  {
    id: "q1",
    question: "Aşağıdaki ruj etiketinde ürünü VEGAN olmaktan çıkaran ve yüksek kırmızı bayrak taşıyan ikili hangisidir?",
    inci: "Ricinus Communis Seed Oil, Caprylic/Capric Triglyceride, CI 75470, Tocopherol, Propylparaben",
    options: [
      "Ricinus Communis Seed Oil ve Tocopherol",
      "CI 75470 (Karmin) ve Propylparaben",
      "Caprylic/Capric Triglyceride ve Tocopherol"
    ],
    correctIndex: 1,
    explanation: "CI 75470 böcek kaynaklı Karmin pigmentidir (vegan değildir). Propylparaben ise hormonal etki şüphesi taşıyan paraben koruyucudur."
  },
  {
    id: "q2",
    question: "Bu nemlendirici krem etiketindeki Cetearyl Alcohol hakkında hangisi doğrudur?",
    inci: "Aqua, Glycerin, Cetearyl Alcohol, Ceramide NP, Panthenol, Ethylhexylglycerin",
    options: [
      "Cildi kurutan sert içki alkolüdür, hemen kaçınılmalıdır",
      "Yağ alkolüdür; cildi kurutmaz, aksine yumuşatır ve kıvam verir",
      "Hayvansal kaynaklıdır, bu yüzden ürün vegan değildir"
    ],
    correctIndex: 1,
    explanation: "Cetearyl Alcohol (ve Cetyl/Stearyl Alcohol) bitkisel yağlardan elde edilebilen yağ alkolleridir; Alcohol Denat. gibi kurutucu değildir."
  },
  {
    id: "q3",
    question: "Bir far paletinde hem solunum/kontaminasyon endişesi hem de balık pulu kaynaklı içerik hangileridir?",
    inci: "Talc, Mica, Dimethicone, Iron Oxides, Guanine, Methylparaben",
    options: [
      "Mica ve Iron Oxides",
      "Dimethicone ve Mica",
      "Talc (asbest şüphesi) ve Guanine (balık pulu)"
    ],
    correctIndex: 2,
    explanation: "Talc toz ürünlerde asbest bulaşma riski taşır; Guanine (CI 75170) ise balık pullarından elde edildiği için vegan değildir."
  },
  {
    id: "q4",
    question: "Çok hassas ve kızarıklığa meyilli bir cilt için bu formüldeki SARI BAYRAK nedir?",
    inci: "Aqua, Squalane, Centella Asiatica Extract, Parfum, Limonene, Linalool, Tocopherol",
    options: [
      "Centella Asiatica Extract",
      "Parfum, Limonene ve Linalool (koku alerjenleri)",
      "Squalane ve Tocopherol"
    ],
    correctIndex: 1,
    explanation: "Centella ve Squalane hassas cilt dostudur; ancak Parfum ile Limonene/Linalool koku alerjenleri hassas ciltte tahriş tetikleyebilir."
  },
  {
    id: "q5",
    question: "Bu maskara cilde güvenli görünse de neden %100 Vegan sayılmaz?",
    inci: "Aqua, Iron Oxides, Cera Alba, Copernicia Cerifera Cera, Panthenol, Tocopherol",
    options: [
      "Cera Alba bal arısı mumudur (hayvansaldır)",
      "Copernicia Cerifera Cera hayvansal mumdur",
      "Iron Oxides böcekten elde edilir"
    ],
    correctIndex: 0,
    explanation: "Cera Alba balmumudur ve arı ürünüdür; Copernicia Cerifera Cera (Karnauba) ise bitkisel palmiye mumudur."
  },
  {
    id: "q6",
    question: "INCI listesinde ilk 3 sırada yer alan maddeler ürün hakkında ne söyler?",
    inci: "Aqua, Niacinamide, Propanediol, Sodium Hyaluronate, Phenoxyethanol",
    options: [
      "Üründe en az bulunan eser miktardaki koruyuculardır",
      "Formülün en büyük yüzdesini oluşturan ana bileşenlerdir",
      "Yalnızca renk veren pigmentlerdir"
    ],
    correctIndex: 1,
    explanation: "%1'in üzerindeki bileşenler yüksekten düşüğe sıralanır; bu yüzden ilk 3-5 madde ürünün gerçek karakterini belirler."
  }
];
