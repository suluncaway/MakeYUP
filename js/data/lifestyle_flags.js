// Yaşam tarzı bayrakları: hamilelik ve kaynağı belirsiz (bitkisel/hayvansal) içerikler.
// Anahtarlar küçük harfli standart INCI adlarıdır. `aliases` alternatif adlar, `pattern` ise
// aile eşleşmesi için büyük/küçük harf duyarsız JS regex kaynağıdır (new RegExp(p, "i")).
// Notlar bilgilendirme amaçlıdır; tıbbi tavsiye yerine geçmez.

export const PREGNANCY_FLAGS = {
  // --- Retinoidler ---
  "retinol": { lvl: "avoid", note: "A vitamini türevi retinoid; hamilelikte topikal retinoidlerden kaçınılması önerilir.", aliases: ["vitamin a"] },
  "retinal": { lvl: "avoid", note: "Retinoid (retinaldehit); hamilelikte kullanımı önerilmez.", aliases: ["retinaldehyde"] },
  "retinyl palmitate": { lvl: "avoid", note: "Retinol esteri; ihtiyaten tüm retinoidlerden hamilelikte kaçınılması önerilir.", pattern: "^retinyl " },
  "retinyl acetate": { lvl: "avoid", note: "Retinol esteri; ihtiyaten hamilelikte kaçınılması önerilir." },
  "retinyl propionate": { lvl: "avoid", note: "Retinol esteri; ihtiyaten hamilelikte kaçınılması önerilir." },
  "retinyl linoleate": { lvl: "avoid", note: "Retinol esteri; ihtiyaten hamilelikte kaçınılması önerilir." },
  "retinyl retinoate": { lvl: "avoid", note: "Retinoid esteri; hamilelikte kullanımı önerilmez." },
  "hydroxypinacolone retinoate": { lvl: "avoid", note: "Retinoik asit esteri (HPR); retinoid reseptörlerine bağlanır, hamilelikte önerilmez.", aliases: ["granactive retinoid"] },
  "tretinoin": { lvl: "avoid", note: "Reçeteli retinoik asit; hamilelikte kontrendike kabul edilir.", aliases: ["retinoic acid", "all-trans retinoic acid"] },
  "isotretinoin": { lvl: "avoid", note: "Teratojenik retinoid; hamilelikte kesinlikle kontrendike." },
  "adapalene": { lvl: "avoid", note: "Reçeteli retinoid; hamilelikte kullanılmaması önerilir." },
  "tazarotene": { lvl: "avoid", note: "Reçeteli retinoid; hamilelikte kontrendike." },
  "trifarotene": { lvl: "avoid", note: "Reçeteli retinoid; hamilelikte kullanılmaması önerilir." },

  // --- Salisilatlar / BHA ---
  "salicylic acid": { lvl: "caution", note: "Düşük oranlı (≤%2) durulanan ürünler genelde kabul görür; yüksek oran ve peelingler önerilmez.", aliases: ["bha", "beta hydroxy acid"] },
  "capryloyl salicylic acid": { lvl: "caution", note: "Salisilik asit türevi (LHA); yüksek oran/geniş alan kullanımında dikkat.", aliases: ["lha"] },
  "betaine salicylate": { lvl: "caution", note: "Salisilat türevi; yüksek oran veya geniş alan kullanımında dikkat." },
  "methyl salicylate": { lvl: "caution", note: "Kış yeşili yağının ana bileşeni; salisilat emilimi nedeniyle hamilelikte dikkat.", aliases: ["wintergreen oil"] },
  "gaultheria procumbens leaf oil": { lvl: "caution", note: "Kış yeşili yağı; yüksek metil salisilat içerir, hamilelikte önerilmez.", aliases: ["wintergreen leaf oil"] },

  // --- Depigmentasyon ---
  "hydroquinone": { lvl: "avoid", note: "Sistemik emilimi yüksektir; hamilelikte kullanılmaması önerilir.", pattern: "hydroquinone" },
  "arbutin": { lvl: "caution", note: "Hidrokinon glikoziti; hamilelikte güvenlilik verisi sınırlı, yüksek oranlarda dikkat.", aliases: ["alpha-arbutin", "beta-arbutin"], pattern: "^(alpha-|beta-)?arbutin$" },

  // --- Formaldehit ve salıcıları ---
  "formaldehyde": { lvl: "avoid", note: "Kanserojen ve hassaslaştırıcı; hamilelikte maruziyetin azaltılması önerilir.", aliases: ["formalin", "methylene glycol"] },
  "dmdm hydantoin": { lvl: "avoid", note: "Formaldehit salıcı koruyucu; hamilelikte tercih edilmemesi önerilir." },
  "imidazolidinyl urea": { lvl: "avoid", note: "Formaldehit salıcı koruyucu; hamilelikte tercih edilmemesi önerilir." },
  "diazolidinyl urea": { lvl: "avoid", note: "Formaldehit salıcı koruyucu; hamilelikte tercih edilmemesi önerilir." },
  "quaternium-15": { lvl: "avoid", note: "Formaldehit salıcı koruyucu (AB'de yasak); hamilelikte önerilmez." },
  "2-bromo-2-nitropropane-1,3-diol": { lvl: "avoid", note: "Formaldehit salıcı koruyucu (bronopol); hamilelikte önerilmez.", aliases: ["bronopol"] },
  "sodium hydroxymethylglycinate": { lvl: "avoid", note: "Formaldehit salıcı koruyucu; hamilelikte tercih edilmemesi önerilir." },

  // --- Kimyasal UV filtreleri ---
  "benzophenone-3": { lvl: "caution", note: "Oksibenzon; endokrin etkileri tartışmalı, hamilelikte mineral filtreler tercih edilebilir.", aliases: ["oxybenzone"], pattern: "^benzophenone-\\d+$" },
  "homosalate": { lvl: "caution", note: "Kimyasal UV filtresi; endokrin etki şüphesi nedeniyle AB'de oranı sınırlandırıldı." },
  "ethylhexyl methoxycinnamate": { lvl: "caution", note: "Oktinoksat; endokrin etki şüphesi, hamilelikte mineral filtreler tercih edilebilir.", aliases: ["octinoxate", "octyl methoxycinnamate"] },
  "4-methylbenzylidene camphor": { lvl: "caution", note: "UV filtresi (4-MBC); endokrin bozucu şüphesi, AB'de artık izinli değil.", aliases: ["enzacamene", "4-mbc"] },
  "octocrylene": { lvl: "caution", note: "UV filtresi; zamanla benzofenon oluşturabilir, hamilelikte dikkat." },

  // --- Ftalatlar ve çözücüler ---
  "dibutyl phthalate": { lvl: "avoid", note: "Üreme toksisitesi olan ftalat; AB kozmetiklerinde yasak.", aliases: ["dbp"] },
  "diethyl phthalate": { lvl: "caution", note: "Ftalat (çoğu zaman parfümde); endokrin etki şüphesi nedeniyle dikkat.", aliases: ["dep"], pattern: "^di(methyl|ethyl|butyl|isobutyl|ethylhexyl|-?n-?butyl) phthalate$" },
  "toluene": { lvl: "avoid", note: "Oje çözücüsü; üreme toksisitesi nedeniyle hamilelikte maruziyetten kaçınılmalı." },

  // --- Antibakteriyeller ---
  "triclosan": { lvl: "caution", note: "Antibakteriyel; endokrin etki şüphesi nedeniyle hamilelikte dikkat." },
  "triclocarban": { lvl: "caution", note: "Antibakteriyel; endokrin etki şüphesi nedeniyle hamilelikte dikkat." },

  // --- Parabenler ---
  "propylparaben": { lvl: "caution", note: "Uzun zincirli paraben; zayıf östrojenik etki şüphesi, hamilelikte dikkat." },
  "butylparaben": { lvl: "caution", note: "Uzun zincirli paraben; zayıf östrojenik etki şüphesi, hamilelikte dikkat." },
  "isopropylparaben": { lvl: "avoid", note: "AB kozmetiklerinde yasaklı paraben; veri yetersiz." },
  "isobutylparaben": { lvl: "avoid", note: "AB kozmetiklerinde yasaklı paraben; veri yetersiz." },

  // --- Cıva bileşikleri ---
  "thimerosal": { lvl: "avoid", note: "Cıva bileşiği; hamilelikte cıva maruziyetinden kaçınılmalı.", aliases: ["thiomersal"], pattern: "thimerosal|thiomersal|mercur" },
  "phenylmercuric acetate": { lvl: "avoid", note: "Cıva bileşiği; hamilelikte cıva maruziyetinden kaçınılmalı." },

  // --- Tetrasiklinler ---
  "tetracycline": { lvl: "avoid", note: "Tetrasiklin grubu antibiyotik; hamilelikte kontrendike, doktora danışın.", pattern: "^(tetracycline|doxycycline|minocycline|oxytetracycline)( hcl| hydrochloride)?$" },
  "doxycycline": { lvl: "avoid", note: "Tetrasiklin grubu antibiyotik; hamilelikte kontrendike." },
  "minocycline": { lvl: "avoid", note: "Tetrasiklin grubu antibiyotik; hamilelikte kontrendike." },

  // --- Tüy dökücü / perma / saç boyası ---
  "thioglycolic acid": { lvl: "caution", note: "Tüy dökücü/perma aktifi; hamilelikte cilt hassasiyeti artabilir, dikkat.", pattern: "thioglycol" },
  "calcium thioglycolate": { lvl: "caution", note: "Tüy dökücü aktif; hamilelikte hassasiyet artabilir, dikkatli kullanın." },
  "potassium thioglycolate": { lvl: "caution", note: "Tüy dökücü aktif; hamilelikte hassasiyet artabilir, dikkatli kullanın." },
  "ammonium thioglycolate": { lvl: "caution", note: "Perma aktifi; hamilelikte dikkatli kullanın." },
  "p-phenylenediamine": { lvl: "caution", note: "Oksidatif saç boyası; ilk trimesterde saç boyasından kaçınılması sıklıkla önerilir.", aliases: ["ppd"] },

  // --- Prostaglandin analogları (kirpik serumları) ---
  "isopropyl cloprostenate": { lvl: "caution", note: "Prostaglandin analoğu; hamilelikte güvenlilik verisi yok, önerilmez.", pattern: "cloprostenate|bimatoprost|latanoprost|dechloro dihydroxy difluoro ethylcloprostenolamide" },

  // --- Uçucu yağlar ---
  "rosmarinus officinalis leaf oil": { lvl: "caution", note: "Biberiye yağı; hamilelikte yüksek konsantrasyonda önerilmez.", aliases: ["rosemary oil"] },
  "salvia officinalis oil": { lvl: "caution", note: "Adaçayı yağı; tujon içerir, hamilelikte önerilmez.", aliases: ["sage oil"] },
  "salvia sclarea oil": { lvl: "caution", note: "Misk adaçayı yağı; hamilelikte önerilmez.", aliases: ["clary sage oil"] },
  "jasminum officinale oil": { lvl: "caution", note: "Yasemin yağı; hamilelikte dikkatli kullanılması önerilir.", aliases: ["jasmine oil"], pattern: "^jasminum [a-z]+ (flower )?oil$" },
  "cinnamomum zeylanicum bark oil": { lvl: "caution", note: "Tarçın kabuğu yağı; hamilelikte önerilmez.", aliases: ["cinnamon bark oil"], pattern: "^cinnamomum (zeylanicum|cassia|verum) (bark |leaf )?oil$" },
  "camphor": { lvl: "caution", note: "Kâfur; sistemik toksisite riski nedeniyle hamilelikte dikkat.", aliases: ["cinnamomum camphora bark oil"] },
  "mentha pulegium oil": { lvl: "avoid", note: "Yarpuz (pennyroyal) yağı; pulegon içerir, hamilelikte kullanılmamalı.", aliases: ["pennyroyal oil"] },
  "ruta graveolens oil": { lvl: "avoid", note: "Sedef otu (rue) yağı; hamilelikte kullanılmamalı.", aliases: ["rue oil"] },
  "artemisia absinthium oil": { lvl: "avoid", note: "Pelin yağı; tujon içerir, hamilelikte kullanılmamalı.", aliases: ["wormwood oil"] },
  "thuja occidentalis leaf oil": { lvl: "avoid", note: "Tuya yağı; tujon içerir, hamilelikte kullanılmamalı.", aliases: ["thuja oil"] },
  "juniperus communis fruit oil": { lvl: "caution", note: "Ardıç yağı; hamilelikte önerilmez.", aliases: ["juniper berry oil"] },
  "hyssopus officinalis oil": { lvl: "caution", note: "Çördük otu yağı; hamilelikte önerilmez.", aliases: ["hyssop oil"] },
  "petroselinum sativum seed oil": { lvl: "caution", note: "Maydanoz tohumu yağı; apiol içerir, hamilelikte önerilmez.", aliases: ["parsley seed oil"] },
  "foeniculum vulgare oil": { lvl: "caution", note: "Rezene yağı; östrojenik bileşenler nedeniyle hamilelikte dikkat.", aliases: ["fennel oil"] },
  "ocimum basilicum oil": { lvl: "caution", note: "Fesleğen yağı; estragol içerir, hamilelikte dikkat.", aliases: ["basil oil"] },
};

export const AMBIGUOUS_SOURCE = {
  // --- Gliserin ve yağ asitleri ---
  "glycerin": { note: "Bitkisel yağdan, iç yağından (tallow) veya sentetik olarak üretilebilir.", aliases: ["glycerol", "glycerine"] },
  "stearic acid": { note: "Bitkisel (palm, shea) veya hayvansal (iç yağı) kaynaklı olabilir." },
  "palmitic acid": { note: "Palm yağından veya hayvansal yağlardan elde edilebilir." },
  "myristic acid": { note: "Hindistan cevizi/muskat yağından veya hayvansal yağlardan elde edilebilir." },
  "oleic acid": { note: "Zeytin gibi bitkisel yağlardan veya hayvansal yağlardan elde edilebilir." },
  "behenic acid": { note: "Genellikle bitkisel (kolza) kaynaklıdır; hayvansal kaynak da mümkündür." },

  // --- Yağ alkolleri ---
  "cetyl alcohol": { note: "Palm/hindistan cevizi veya hayvansal yağlardan (eskiden ispermeçet) elde edilebilir." },
  "cetearyl alcohol": { note: "Bitkisel veya hayvansal yağ alkollerinin karışımı olabilir." },
  "stearyl alcohol": { note: "Bitkisel veya hayvansal stearik asitten üretilebilir." },
  "oleyl alcohol": { note: "Bitkisel yağlardan veya balık/hayvansal yağlardan elde edilebilir." },
  "behenyl alcohol": { note: "Genellikle kolza yağından; hayvansal kaynak da mümkündür." },
  "myristyl alcohol": { note: "Bitkisel veya hayvansal yağlardan elde edilebilir." },

  // --- Esterler ve gliseritler ---
  "glyceryl stearate": { note: "Gliserin ve stearik asit esteri; her ikisi de bitkisel veya hayvansal olabilir.", aliases: ["glyceryl stearate se"] },
  "glyceryl oleate": { note: "Oleik asit esteri; bitkisel veya hayvansal kaynaklı olabilir." },
  "glycol stearate": { note: "Stearik asit esteri; bitkisel veya hayvansal kaynaklı olabilir." },
  "glycol distearate": { note: "Stearik asit esteri; bitkisel veya hayvansal kaynaklı olabilir." },
  "peg-100 stearate": { note: "Stearik asit türevi; yağ asidi bitkisel veya hayvansal olabilir.", pattern: "^peg-\\d+ (di)?stearate$" },
  "sorbitan stearate": { note: "Stearik asit türevi; yağ asidi bitkisel veya hayvansal olabilir." },
  "sorbitan oleate": { note: "Oleik asit türevi; yağ asidi bitkisel veya hayvansal olabilir." },
  "isopropyl palmitate": { note: "Palmitik asit esteri; palm veya hayvansal yağ kaynaklı olabilir." },
  "isopropyl myristate": { note: "Miristik asit esteri; bitkisel veya hayvansal kaynaklı olabilir." },
  "myristyl myristate": { note: "Miristik asit esteri; bitkisel veya hayvansal kaynaklı olabilir." },
  "cetyl palmitate": { note: "Eskiden ispermeçetten; bugün çoğunlukla bitkisel, ancak kaynak değişebilir." },
  "ethylhexyl palmitate": { note: "Palmitik asit esteri; bitkisel veya hayvansal kaynaklı olabilir." },
  "butyl stearate": { note: "Stearik asit esteri; bitkisel veya hayvansal kaynaklı olabilir." },
  "stearyl stearate": { note: "Stearik asit esteri; bitkisel veya hayvansal kaynaklı olabilir." },

  // --- Stearat tuzları ---
  "sodium stearate": { note: "Sabun bileşeni; bitkisel yağ veya iç yağından üretilebilir." },
  "magnesium stearate": { note: "Stearik asit tuzu; bitkisel veya hayvansal kaynaklı olabilir." },
  "zinc stearate": { note: "Stearik asit tuzu; bitkisel veya hayvansal kaynaklı olabilir." },
  "calcium stearate": { note: "Stearik asit tuzu; bitkisel veya hayvansal kaynaklı olabilir." },

  // --- Etoksilatlar ---
  "polysorbate 20": { note: "Yağ asidi kısmı bitkisel veya hayvansal kaynaklı olabilir.", pattern: "^polysorbate[- ]\\d+$" },
  "polysorbate 60": { note: "Stearik asit kısmı bitkisel veya hayvansal kaynaklı olabilir." },
  "polysorbate 80": { note: "Oleik asit kısmı bitkisel veya hayvansal kaynaklı olabilir." },
  "steareth-20": { note: "Stearil alkol türevi; yağ alkolü bitkisel veya hayvansal olabilir.", pattern: "^(steareth|ceteareth|ceteth|oleth)-\\d+$" },

  // --- Steroller ve lipitler ---
  "squalene": { note: "Köpekbalığı karaciğeri veya zeytin/amarant yağından elde edilebilir (skualan ile karıştırmayın)." },
  "cholesterol": { note: "Lanolin veya hayvansal kaynaklı olabilir; bitkisel/sentetik muadilleri de var." },
  "lecithin": { note: "Soya/ayçiçeği veya yumurta sarısından elde edilebilir.", aliases: ["hydrogenated lecithin"] },
  "phospholipids": { note: "Soya veya hayvansal (yumurta, doku) kaynaklı olabilir." },
  "sphingolipids": { note: "Bitkisel, mayalı fermantasyon veya hayvansal kaynaklı olabilir." },
  "ceramide np": { note: "Çoğunlukla sentetik/fermantasyon; hayvansal kaynaklı seramidler de kullanılmıştır.", pattern: "^ceramide (np|ap|eop|ns|as|eos|ng|ag|1|2|3|6 ii)$" },

  // --- Vitaminler ---
  "retinyl palmitate": { note: "Çoğunlukla sentetik; balık karaciğeri yağından da elde edilebilir." },
  "cholecalciferol": { note: "D3 vitamini; genellikle lanolinden, vegan muadili likenden elde edilir.", aliases: ["vitamin d3"] },

  // --- Asitler ve nemlendiriciler ---
  "lactic acid": { note: "Bugün çoğunlukla bitkisel fermantasyonla üretilir; süt kaynaklı da olabilir." },
  "sodium lactate": { note: "Laktik asit tuzu; fermantasyon veya süt kaynaklı olabilir." },
  "hyaluronic acid": { note: "Günümüzde çoğunlukla bakteriyel fermantasyon; tarihsel olarak horoz ibiğinden." },
  "sodium hyaluronate": { note: "Çoğunlukla bakteriyel fermantasyon; horoz ibiği kaynaklı da olabilir.", pattern: "hyaluron" },
  "allantoin": { note: "Genellikle sentetik veya karakafes otundan; hayvansal kaynaklı da olabilir." },

  // --- Amino asitler ve polisakkaritler ---
  "cysteine": { note: "Tüy/kıl kaynaklı veya fermantasyonla üretilebilir.", aliases: ["l-cysteine"] },
  "glucosamine": { note: "Kabuklu deniz ürünlerinden veya mantar/fermantasyondan elde edilebilir.", aliases: ["glucosamine hcl"] },
  "chitosan": { note: "Kabuklu deniz ürünlerinden veya mantarlardan elde edilebilir." },

  // --- Pigmentler ---
  "guanine": { note: "Balık pulundan veya sentetik olarak elde edilebilir (sedef efekti).", aliases: ["ci 75170"] },
};
