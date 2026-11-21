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
  }
];
