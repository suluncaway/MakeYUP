/**
 * MakeYUP — Makyaj Markaları Veritabanı
 * Her marka kendi kimliği, cruelty-free / vegan politikası ve açıklamasıyla tanımlanır.
 */

export const BRANDS_DATA = [
  {
    id: "rare-beauty",
    name: "Rare Beauty",
    monogram: "RB",
    accentColor: "#b56576",
    country: "ABD",
    crueltyFree: true,
    brandVeganPolicy: "full", // "full" | "partial" | "mixed"
    brandVeganLabel: "%100 Vegan Marka",
    tagline: "Cilt dostu, hafif dokulu, tamamen vegan ve cruelty-free modern makyaj serisi."
  },
  {
    id: "nyx",
    name: "NYX Professional Makeup",
    monogram: "NYX",
    accentColor: "#7c3aed",
    country: "ABD",
    crueltyFree: true,
    brandVeganPolicy: "partial",
    brandVeganLabel: "Geniş Vegan Koleksiyon",
    tagline: "Hayvanlar üzerinde test yapmayan, ürünlerinin büyük çoğunluğu vegan formüllü marka."
  },
  {
    id: "fenty-beauty",
    name: "Fenty Beauty",
    monogram: "FB",
    accentColor: "#b45309",
    country: "ABD",
    crueltyFree: true,
    brandVeganPolicy: "partial",
    brandVeganLabel: "Cruelty-Free · Seçili Vegan",
    tagline: "Geniş renk skalasına sahip, hayvan dostu ve yüksek performanslı makyaj ürünleri."
  },
  {
    id: "flormar",
    name: "Flormar",
    monogram: "FL",
    accentColor: "#be123c",
    country: "Türkiye / İtalya",
    crueltyFree: true,
    brandVeganPolicy: "mixed",
    brandVeganLabel: "Karma (Ürün Bazlı Kontrol)",
    tagline: "Klasik renkli kozmetik serilerinde balmumu ve karmin bulunabilir; ürün bazlı kontrol önerilir."
  },
  {
    id: "mac-cosmetics",
    name: "MAC Cosmetics",
    monogram: "MAC",
    accentColor: "#27272a",
    country: "Kanada",
    crueltyFree: false,
    brandVeganPolicy: "mixed",
    brandVeganLabel: "Karma (Hayvansal Pigment İçerebilir)",
    tagline: "Profesyonel sahne ve günlük makyaj; yoğun kırmızı/pembe pigmentlerde karmin bulunabilir."
  },
  {
    id: "maybelline",
    name: "Maybelline New York",
    monogram: "MYB",
    accentColor: "#1d4ed8",
    country: "ABD",
    crueltyFree: false,
    brandVeganPolicy: "mixed",
    brandVeganLabel: "Karma (Ürün Bazlı Kontrol)",
    tagline: "Yaygın erişilebilir günlük makyaj serisi; bazı klasik ürünlerde balmumu, talk veya paraben yer alabilir."
  },
  {
    id: "golden-rose",
    name: "Golden Rose",
    monogram: "GR",
    accentColor: "#9f1239",
    country: "Türkiye",
    crueltyFree: true,
    brandVeganPolicy: "mixed",
    brandVeganLabel: "Cruelty-Free · Ürün Bazlı Vegan",
    tagline: "Türkiye'nin en yaygın makyaj markalarından biri; vegan serileri ve klasik renkli kozmetik ürünleri bulunur."
  },
  {
    id: "pastel",
    name: "Pastel",
    monogram: "PST",
    accentColor: "#db2777",
    country: "Türkiye",
    crueltyFree: true,
    brandVeganPolicy: "partial",
    brandVeganLabel: "Cruelty-Free · Geniş Vegan Seri",
    tagline: "Türkiye menşeli, hayvanlar üzerinde test yapmayan ve vegan/helal sertifikalı geniş makyaj koleksiyonu."
  },
  {
    id: "revolution",
    name: "Revolution Beauty",
    monogram: "REV",
    accentColor: "#4338ca",
    country: "İngiltere",
    crueltyFree: true,
    brandVeganPolicy: "partial",
    brandVeganLabel: "Cruelty-Free · Çoğunlukla Vegan",
    tagline: "PETA onaylı cruelty-free, uygun fiyatlı ve geniş vegan kapatıcı, far ve allık serisi."
  },
  {
    id: "nars",
    name: "NARS Cosmetics",
    monogram: "NARS",
    accentColor: "#18181b",
    country: "ABD / Fransa",
    crueltyFree: false,
    brandVeganPolicy: "mixed",
    brandVeganLabel: "Karma (Karmin İçerebilir)",
    tagline: "Yüksek pigmentli lüks makyaj ürünleri; pembe/kırmızı tonlarda karmin veya talk bulunabilir."
  }
];
