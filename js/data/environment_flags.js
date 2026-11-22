// Çevresel uyarı bayrakları (mikroplastik, mercan resifi, kalıcı/biyobirikimli maddeler).
// Anahtarlar küçük harfli INCI adlarıdır. `aliases` ek eşleşme adları, `pattern` ise
// büyük/küçük harf duyarsız bir JS regex kaynağıdır.
// Kaynaklar: AB 2023/2055 (kasıtlı eklenen mikroplastik), Hawaii SB2571 / Key West / Palau
// güneş kremi yasakları, AB 2024/1328 (D4/D5/D6), REACH ve Stockholm Sözleşmesi (PFAS, triklosan).

export const ENV_FLAGS = {
  // ---------- Mikroplastikler (AB 2023/2055) ----------
  "polyethylene": {
    type: "microplastic",
    note: "Katı sentetik polimer; AB 2023/2055 kapsamında kasıtlı eklenen mikroplastik.",
    aliases: ["pe"]
  },
  "polypropylene": {
    type: "microplastic",
    note: "Suda çözünmeyen sentetik polimer; AB'de mikroplastik kısıtlaması kapsamında."
  },
  "nylon-12": {
    type: "microplastic",
    note: "Poliamid toz; makyajda dolgu/doku verici, AB 2023/2055'e göre mikroplastik.",
    aliases: ["polyamide-12"]
  },
  "nylon-6": {
    type: "microplastic",
    note: "Poliamid toz; AB 2023/2055 kapsamında mikroplastik olarak değerlendirilir."
  },
  "nylon-66": {
    type: "microplastic",
    note: "Poliamid lif/toz; suda çözünmez, mikroplastik kapsamında."
  },
  "nylon-6/12": {
    type: "microplastic",
    note: "Poliamid kopolimer toz; mikroplastik kapsamında."
  },
  "polymethyl methacrylate": {
    type: "microplastic",
    note: "PMMA mikroküreleri; katı sentetik polimer, AB'de mikroplastik kapsamında.",
    aliases: ["pmma"]
  },
  "methyl methacrylate crosspolymer": {
    type: "microplastic",
    note: "Çapraz bağlı akrilik mikroküre; katı ve çözünmez, mikroplastik kapsamında."
  },
  "polystyrene": {
    type: "microplastic",
    note: "Katı sentetik polimer; mikroplastik kapsamında."
  },
  "polyethylene terephthalate": {
    type: "microplastic",
    note: "PET; simli ürünlerdeki plastik glitterin ana maddesi, mikroplastik kapsamında.",
    aliases: ["pet", "glitter"]
  },
  "polybutylene terephthalate": {
    type: "microplastic",
    note: "Plastik glitter/lif; katı sentetik polimer, mikroplastik kapsamında."
  },
  "polyethylene isoterephthalate": {
    type: "microplastic",
    note: "Plastik glitter polimeri; mikroplastik kapsamında."
  },
  "polyurethane-11": {
    type: "microplastic",
    note: "Poliüretan toz; katı sentetik polimer, mikroplastik kapsamında."
  },
  "hdi/trimethylol hexyllactone crosspolymer": {
    type: "microplastic",
    note: "Poliüretan mikroküre; katı ve çözünmez, mikroplastik kapsamında."
  },
  "polyurethane crosspolymer": {
    type: "microplastic",
    note: "Çapraz bağlı poliüretan toz; mikroplastik kapsamında.",
    pattern: "^polyurethane-\\d+ crosspolymer$"
  },
  "acrylates copolymer": {
    type: "microplastic",
    note: "Katı film/parçacık halinde mikroplastik sayılabilir; formüle göre tartışmalı."
  },
  "acrylates crosspolymer": {
    type: "microplastic",
    note: "Çapraz bağlı akrilat parçacıkları; katı halde mikroplastik kapsamında."
  },
  "acrylates/c10-30 alkyl acrylate crosspolymer": {
    type: "microplastic",
    note: "Kıvamlaştırıcı; jel/şişen polimer olduğundan mikroplastik sayılması tartışmalı."
  },
  "styrene/acrylates copolymer": {
    type: "microplastic",
    note: "Opaklaştırıcı polimer parçacıkları; katı ve çözünmez, mikroplastik kapsamında."
  },
  "polyacrylate-11": {
    type: "microplastic",
    note: "Akrilik polimer; parçacık halinde mikroplastik sayılabilir, tartışmalı."
  },
  "vinyl dimethicone/methicone silsesquioxane crosspolymer": {
    type: "microplastic",
    note: "Silikon elastomer toz; AB tanımındaki sentetik polimer parçacıkları arasında."
  },
  "polymethylsilsesquioxane": {
    type: "microplastic",
    note: "Silikon reçine mikroküre; katı polimer, AB 2023/2055 kapsamında."
  },
  "ethylene/acrylic acid copolymer": {
    type: "microplastic",
    note: "Katı sentetik kopolimer; mikroplastik kapsamında."
  },
  "ethylene/va copolymer": {
    type: "microplastic",
    note: "Etilen-vinil asetat kopolimeri; katı halde mikroplastik kapsamında."
  },
  "polytetrafluoroethylene": {
    type: "persistent",
    note: "PTFE toz bir PFAS'tır ('sonsuz kimyasal'); aynı zamanda katı mikroplastik.",
    aliases: ["ptfe", "teflon"]
  },

  // ---------- Mercan resifi (Hawaii / Key West / Palau düzenlemeleri) ----------
  "benzophenone-3": {
    type: "reef",
    note: "Oksibenzon; mercan ağarmasıyla ilişkili, Hawaii ve Palau'da yasaklı UV filtresi.",
    aliases: ["oxybenzone"]
  },
  "ethylhexyl methoxycinnamate": {
    type: "reef",
    note: "Oktinoksat; Hawaii ve Key West'te resif nedeniyle yasaklı UV filtresi.",
    aliases: ["octinoxate", "octyl methoxycinnamate"]
  },
  "octocrylene": {
    type: "reef",
    note: "Palau listesinde; mercanlarda birikim ve benzofenon oluşumu bildirilmiştir."
  },
  "homosalate": {
    type: "reef",
    note: "Resif etkisi şüpheli UV filtresi; Maui'de mineral dışı filtrelerle birlikte kısıtlı."
  },
  "4-methylbenzylidene camphor": {
    type: "reef",
    note: "Palau'da yasaklı UV filtresi; olası endokrin etkisi nedeniyle tartışmalı.",
    aliases: ["enzacamene", "4-mbc"]
  },
  "ethylhexyl salicylate": {
    type: "reef",
    note: "Oktisalat; Maui'de mineral dışı filtrelerle kısıtlı, resif verisi sınırlı.",
    aliases: ["octisalate"]
  },
  "butylparaben": {
    type: "reef",
    note: "Palau resif dostu yasası kapsamındaki koruyucu."
  },
  "benzylparaben": {
    type: "reef",
    note: "Palau resif dostu yasası kapsamındaki koruyucu (AB'de zaten yasaklı)."
  },
  "benzophenone-4": {
    type: "reef",
    note: "Benzofenon türevi; resif etkisi için öncelikli izlenen UV filtreleri arasında.",
    aliases: ["sulisobenzone"]
  },
  // Yalnızca nano form işaretlenir; normal (nano olmayan) çinko oksit mineral filtre olarak resif dostu kabul edilir.
  "zinc oxide (nano)": {
    type: "reef",
    note: "Nano formu tartışmalı; kaplamasız nano çinko oksit için resif verisi çelişkili.",
    pattern: "zinc oxide.*\\bnano\\b|\\bnano\\b.*zinc oxide"
  },

  // ---------- Kalıcı / biyobirikimli (persistent) ----------
  "cyclotetrasiloxane": {
    type: "persistent",
    note: "D4; kalıcı ve biyobirikimli (PBT/vPvB), AB'de durulanan/kalan ürünlerde kısıtlı.",
    aliases: ["d4", "octamethylcyclotetrasiloxane"]
  },
  "cyclopentasiloxane": {
    type: "persistent",
    note: "D5; çok kalıcı ve biyobirikimli (vPvB), AB 2024/1328 ile %0,1 sınırı.",
    aliases: ["d5", "decamethylcyclopentasiloxane"]
  },
  "cyclohexasiloxane": {
    type: "persistent",
    note: "D6; çok kalıcı ve biyobirikimli (vPvB), AB 2024/1328 ile kısıtlandı.",
    aliases: ["d6", "dodecamethylcyclohexasiloxane"]
  },
  "cyclomethicone": {
    type: "persistent",
    note: "Siklik silikon karışımı; genellikle D4/D5/D6 içerir, kalıcı kabul edilir."
  },
  "perfluoro compounds": {
    type: "persistent",
    note: "Perfloro bileşikler PFAS ailesindendir; çevrede parçalanmadan kalır.",
    pattern: "perfluoro|polyfluoro"
  },
  "fluoro polymers": {
    type: "persistent",
    note: "Florlu alkil/polimer; PFAS grubunda, kalıcı ve biyobirikime yatkın.",
    pattern: "\\bc\\d+-\\d+ fluoroalcohol|fluoroalkyl|perfluorononyl|perfluorodecalin|polyperfluoromethylisopropyl ether|trifluoropropyl|octafluoropentyl|ptfe|tetrafluoroethylene"
  },
  "perfluorodecalin": {
    type: "persistent",
    note: "Tamamen florlu sıvı; PFAS ailesinden, son derece kalıcı."
  },
  "perfluorohexane": {
    type: "persistent",
    note: "Tamamen florlu sıvı; PFAS ailesinden, son derece kalıcı."
  },
  "polyperfluoromethylisopropyl ether": {
    type: "persistent",
    note: "Florlu polieter (PFPE); PFAS grubunda, çevrede kalıcı."
  },
  "c9-15 fluoroalcohol phosphate": {
    type: "persistent",
    note: "Florlu yüzey aktif madde; PFAS grubunda, parçalanma ürünleri kalıcı."
  },
  "triclosan": {
    type: "persistent",
    note: "Kalıcı antimikrobiyal; sularda birikir, antimikrobiyal direnç endişesi."
  },
  "triclocarban": {
    type: "persistent",
    note: "Kalıcı ve biyobirikimli antimikrobiyal; atık su arıtımında giderilemez."
  },
  "galaxolide": {
    type: "persistent",
    note: "HHCB polisiklik misk; sucul ortamda kalıcı ve biyobirikimli.",
    aliases: ["hexamethylindanopyran", "hhcb"]
  },
  "tonalide": {
    type: "persistent",
    note: "AHTN polisiklik misk; yağ dokusunda ve sularda birikir.",
    aliases: ["ahtn", "acetyl hexamethyl tetralin"]
  },
  "musk ketone": {
    type: "persistent",
    note: "Nitro misk; kalıcı ve biyobirikimli, AB'de kullanımı sınırlı."
  },
  "musk xylene": {
    type: "persistent",
    note: "Nitro misk; REACH'te vPvB, kozmetikte yasaklı."
  },
  "cybutryne": {
    type: "persistent",
    note: "Biyosit; sucul ortamda kalıcı ve çok toksik."
  }
};
