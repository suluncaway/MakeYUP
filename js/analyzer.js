/**
 * MakeYUP — INCI İçerik & Vegan Analiz Motoru
 * Verilen içerik listesini (metin veya dizi) analiz ederek sağlık skoru,
 * veganlık durumu, risk dağılımı ve öne çıkan bulguları hesaplar.
 */

import { INGREDIENTS_DB } from "./data/ingredients.js";
import { getIngredientFlags, summarizeFlags } from "./flags.js";

// 2.748 bileşenlik AB CosIng (CAS / EC / resmi işlev / komedojenik) sözlüğü
let cosingMap = {};
const COSING_FUNC_TR = {
  solvent: "Çözücü",
  humectant: "Nem Tutucu",
  "skin conditioning": "Cilt Bakım / Yumuşatıcı",
  emollient: "Yumuşatıcı",
  emulsifying: "Emülgatör",
  "emulsion stabilising": "Emülsiyon Dengeleyici",
  surfactant: "Yüzey Aktif (Temizleyici)",
  preservative: "Koruyucu",
  antioxidant: "Antioksidan",
  "viscosity controlling": "Kıvam Düzenleyici",
  perfuming: "Koku / Parfüm",
  "uv absorber": "UV Emici",
  "uv filter": "UV Filtresi",
  "film forming": "Film Oluşturucu",
  colorant: "Renklendirici",
  cosmetic_colorant: "Kozmetik Boya",
  smoothing: "Pürüzsüzleştirici",
  soothing: "Yatıştırıcı",
  "skin protecting": "Cilt Koruyucu",
  astringent: "Gözenek Sıkılaştırıcı",
  antimicrobial: "Antimikrobiyal",
  chelating: "Şelatlayıcı",
  buffering: "pH Dengeleyici",
  binding: "Bağlayıcı",
  bulking: "Dolgu Maddesi",
  opacifying: "Opaklaştırıcı",
  "gel forming": "Jel Oluşturucu",
  masking: "Koku Maskeleyici",
  cleansing: "Temizleyici",
  foaming: "Köpürtücü"
};

export async function loadCosingIndex() {
  try {
    const res = await fetch("js/data/cosing_index.json");
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && !Array.isArray(data)) cosingMap = data;
    }
  } catch {
    // sessizce yerel motorla devam et
  }
}

export function getCosingMeta(inciName) {
  const raw = String(inciName || "").replace(ZERO_WIDTH_RE, "").trim().toLowerCase();
  const norm = normalizeText(raw);
  if (!norm && !raw) return null;
  const own = (k) => (k && Object.prototype.hasOwnProperty.call(cosingMap, k) ? cosingMap[k] : null);
  // "Aqua (Water)" → "aqua (water)", "aqua", "water"; "Water/Aqua/Eau" → "water", "aqua", "eau"
  const candidates = [
    raw,
    norm,
    ...[...raw.matchAll(/\(([^)]+)\)/g)].map((m) => normalizeText(m[1])),
    ...norm.split("/").map((p) => p.trim())
  ];
  let hit = null;
  for (const c of candidates) {
    hit = own(c);
    if (hit) break;
  }
  if (!hit || typeof hit !== "object") return null;
  const funcsTr = Array.isArray(hit.fn)
    ? hit.fn.map((f) => COSING_FUNC_TR[f.toLowerCase()] || f)
    : [];
  return {
    cas: hit.cas || null,
    ec: hit.ec || null,
    functionsTr: funcsTr,
    irritancy: hit.irr ?? null,
    comedogenicity: hit.com ?? null
  };
}

/**
 * Metni eşleştirme için normalize eder.
 * Türkçe büyük "İ" / "I" harfleri doğru küçültülür ("GLİSERİN" → "gliserin").
 */
export function normalizeText(str) {
  return String(str ?? "")
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/̇/g, "")
    .replace(/\(.*?\)/g, " ") // parantez içlerini ayır
    .replace(/[^a-z0-9çğıöşü/\-\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TR_FOLD = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
const PERCENT_RE = /\b\d+(?:[.,]\d+)?\s*%/g;
const ZERO_WIDTH_RE = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;
// "Methyl Paraben" / "Propyl-Paraben" → "methylparaben" / "propylparaben"
const SPACED_PARABEN_RE = /\b(methyl|ethyl|propyl|butyl|isobutyl|isopropyl|benzyl|phenyl|pentyl)[\s-]+paraben\b/g;

/** Eşleştirme anahtarı: yüzdeler atılır, Türkçe harfler katlanır ("jojoba yağı" = "jojoba yagi"). */
function matchKey(str) {
  return normalizeText(String(str ?? "").replace(ZERO_WIDTH_RE, "").replace(PERCENT_RE, " "))
    .replace(/[çğıöşü]/g, (c) => TR_FOLD[c])
    .replace(SPACED_PARABEN_RE, "$1paraben");
}

/** Kısmi eşleşme için: parantez içi korunur, tüm noktalama boşluğa çevrilir (kelime sınırı kontrolü için). */
function wordKey(str) {
  return String(str ?? "")
    .replace(ZERO_WIDTH_RE, "")
    .replace(PERCENT_RE, " ")
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/̇/g, "")
    .replace(/[çğıöşü]/g, (c) => TR_FOLD[c])
    .replace(/[^a-z0-9]+/g, " ")
    .replace(SPACED_PARABEN_RE, "$1paraben")
    .trim();
}

// Tek başına çok genel olan ve başka maddelerin adının parçası olabilen terimler yalnızca
// birebir eşleşmede kullanılır ("Behenyl Alcohol" ≠ "Alcohol Denat.", "Rose Flower Water" ≠ "Aqua").
const PARTIAL_BLOCKLIST = new Set(["alcohol", "aqua", "water", "eau", "su", "peg", "aroma", "koku", "silicone"]);

// "Milk Thistle", "Honeysuckle", "Coconut Milk" gibi bitkisel adlar hayvansal sayılmamalı.
const PLANT_CONTEXT_RE =
  /(milk\s*thistle|milkweed|honeysuckle|silk\s*tree|(coconut|cocos nucifera|oat|avena sativa|almond|prunus amygdalus|soy|soybean|glycine soja|rice|oryza sativa|cashew|hemp|cannabis sativa|plant|vegetable)\s*\)?\s*milk|vegan|synthetic|plant|vegetable|phyto)/i;

let EXACT_INDEX = null;
let PARTIAL_TERMS = null;

function buildIngredientIndex() {
  EXACT_INDEX = new Map();
  const terms = [];
  for (const item of INGREDIENTS_DB) {
    for (const name of [item.inci, ...(item.aliases || [])]) {
      const k = matchKey(name);
      if (k && !EXACT_INDEX.has(k)) EXACT_INDEX.set(k, item);
      const w = wordKey(name);
      if (w.length >= 4 && !PARTIAL_BLOCKLIST.has(w)) terms.push({ term: ` ${w} `, item });
    }
  }
  // En uzun (en özgül) terim önce denensin
  terms.sort((a, b) => b.term.length - a.term.length);
  PARTIAL_TERMS = terms;
}

/**
 * Tek bir içerik adını veritabanında arar.
 */
export function findIngredient(rawName) {
  const cleaned = String(rawName ?? "").trim();
  const norm = matchKey(cleaned);
  if (!norm) return null;
  if (!EXACT_INDEX) buildIngredientIndex();

  // 1. Tam INCI veya alias eşleşmesi
  const exact = EXACT_INDEX.get(norm);
  if (exact) return exact;

  // 1b. "Water/Aqua/Eau" veya "CI 77491 (Iron Oxides)" gibi bileşik yazımların parçaları
  const parts = [...norm.split("/"), ...[...cleaned.matchAll(/\(([^)]+)\)/g)].map((m) => m[1])];
  for (const part of parts) {
    const hit = EXACT_INDEX.get(matchKey(part));
    if (hit) return hit;
  }

  const rawLower = cleaned.replace(ZERO_WIDTH_RE, "").replace(/İ/g, "i").toLowerCase().replace(SPACED_PARABEN_RE, "$1paraben");
  const plantLike = PLANT_CONTEXT_RE.test(rawLower);

  // 2. Kısmi (tam kelime) eşleşme — örn. "Sodium Hyaluronate Crosspolymer", "Hydrolyzed Collagen".
  // PEG/PPG türevleri kendi ailesinde sınıflandırılır ("PEG-40 Hydrogenated Castor Oil" ≠ hint yağı).
  if (!/^(peg|ppg)[-\s]?\d/.test(rawLower)) {
    const hay = ` ${wordKey(cleaned)} `;
    for (const { term, item } of PARTIAL_TERMS) {
      if (!hay.includes(term)) continue;
      if (plantLike && item.vegan === false) continue;
      return item;
    }
  }

  // 3. Akıllı INCI Desen, CI Pigment & Kimyasal Aile Tanıma (hiçbir gerçek bileşen analizsiz kalmaz)
  return classifyByPattern(cleaned, rawLower, plantLike);
}

/**
 * Veritabanındaki kayıtlar için kaynak (origin) etiketini otomatik belirler.
 */
function inferOriginForKnown(item) {
  if (item.origin) return item.origin;
  if (item.vegan === false) return "Hayvansal Kaynaklı";
  if (item.vegan === "conditional") return "Bitkisel veya Hayvansal (Kaynak Kontrolü)";
  const hay = `${item.category || ""} ${(item.tags || []).join(" ")} ${item.inci || ""}`.toLowerCase();
  if (/(mineral|kil|tuz|çinko|titanyum|mika|silika|demir|kaolin|aqua|su)/.test(hay)) return "Mineral / Doğal";
  if (/(bitkisel|botanik|yağ|aloe|centella|shea|jojoba|argan|badem|kuşburnu|ahududu|papatya|karnauba|kandelila)/.test(hay)) return "Bitkisel Kaynaklı";
  if (/(hyaluron|fermant|ksantan|niasinamid|pantenol|peptit|seramid)/.test(hay)) return "Biyoteknolojik / Sentetik";
  return "Sentetik (Laboratuvar)";
}

/**
 * Veritabanında birebir bulunmayan gerçek dünya INCI maddelerini
 * kozmetik kimya kurallarına ve CI pigment kodlarına göre eksiksiz sınıflandırır
 * ve ne kaynaklı olduğunu (Bitkisel / Mineral / Sentetik / Hayvansal / Biyoteknolojik) yazar.
 */
function classifyByPattern(rawName, lower, plantLike = false) {
  // 1. Hayvansal kaynaklı anahtar kelimeler (bitkisel bağlamda — "Milk Thistle", "Honeysuckle" — atlanır)
  if (!plantLike && /(beeswax|cera alba|cera flava|honey|\bmel\b|propolis|royal jelly)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Arı Ürünü)`,
      risk: "safe",
      riskScore: 1,
      vegan: false,
      origin: "Hayvansal Kaynaklı (Arı)",
      animalSource: "Bal arılarından elde edilen hayvansal bileşen.",
      category: "Hayvansal Mum / Özüt",
      summaryTr: "Cilt için besleyici ve koruyucudur ancak arı kaynaklı olduğu için VEGAN DEĞİLDİR.",
      tags: ["Hayvansal Kaynaklı", "Vegan Değil"]
    };
  }
  if (!plantLike && /(carmine|ci\s*75470|cochineal|carminic)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Karmin Pigmenti)`,
      risk: "moderate",
      riskScore: 4,
      vegan: false,
      origin: "Hayvansal Kaynaklı (Koşnil Böceği)",
      animalSource: "Koşnil böceğinden elde edilen kırmızı pigment.",
      category: "Hayvansal Renklendirici",
      summaryTr: "Kırmızı/pembe ton veren böcek kaynaklı pigmenttir; VEGAN DEĞİLDİR.",
      tags: ["Hayvansal Kaynaklı", "Vegan Değil"]
    };
  }
  if (
    !plantLike &&
    /(lanolin|tallow|collagen|elastin|keratin|silk|serica|snail|guanine|ci\s*75170|shellac|milk|lactose|\blac\b|emu oil|ostrich|placenta|caviar|gelatin|casein|whey|\bovum\b|egg yolk|albumen|\bpearl\b|mink oil|castoreum|civet|ambergris|shark liver|cod liver|fish oil|chondroitin|spongilla)/.test(lower)
  ) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Hayvansal Türev)`,
      risk: "safe",
      riskScore: 2,
      vegan: false,
      origin: "Hayvansal Kaynaklı",
      animalSource: "Hayvansal dokulardan veya salgılardan elde edilen kozmetik bileşeni.",
      category: "Hayvansal Bileşen",
      summaryTr: "Bitkisel/vegan olduğu özellikle belirtilmedikçe hayvansal kaynaklı kabul edilir ve VEGAN DEĞİLDİR.",
      tags: ["Hayvansal Kaynaklı", "Vegan Değil"]
    };
  }

  // 2. Yüksek riskli kimyasal aileler
  if (/paraben\b/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Paraben)`,
      risk: "high",
      riskScore: 7,
      vegan: true,
      origin: "Sentetik (Petrokimya)",
      animalSource: null,
      category: "Koruyucu (Paraben)",
      summaryTr: "Paraben ailesinden sentetik koruyucudur; hormonal etki şüphesi nedeniyle temiz kozmetikte kaçınılır.",
      tags: ["Paraben", "Endokrin Şüphesi"]
    };
  }
  if (/(formaldehyd|hydantoin|imidazolidinyl|diazolidinyl|quaternium-15|bronopol|methylisothiazolinone|methylchloroisothiazolinone)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Yüksek Riskli Koruyucu)`,
      risk: "high",
      riskScore: 9,
      vegan: true,
      origin: "Sentetik (Laboratuvar)",
      animalSource: null,
      category: "Koruyucu",
      summaryTr: "Formaldehit salma veya güçlü kontakt alerji riski taşıyan sentetik koruyucudur; kaçınılması önerilir.",
      tags: ["Yüksek Alerjen", "Kaçınılmalı"]
    };
  }
  if (/(fluoro|ptfe|pfas|perfluoro|hydroquinone|resorcinol|triclosan|triclocarban|phthalate)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Tartışmalı Sentetik)`,
      risk: "high",
      riskScore: 8,
      vegan: true,
      origin: "Sentetik (Endüstriyel Kimyasal)",
      animalSource: null,
      category: "Yüksek Riskli Bileşen",
      summaryTr: "Sağlık veya çevresel kalıcılık açısından riskli sınıfta yer alan sentetik bileşendir; kaçınılması önerilir.",
      tags: ["Yüksek Risk", "Kaçınılmalı"]
    };
  }

  // 3. Kimyasal UV Filtreleri
  if (/(benzophenone|methoxycinnamate|octocrylene|homosalate|avobenzone|methoxydibenzoylmethane|ethylhexyl salicylate|ethylhexyl triazone|bis-ethylhexyloxyphenol|diethylamino hydroxybenzoyl|terephthalylidene|drometrizole|phenylbenzimidazole|salicylate)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (UV Güneş Filtresi)`,
      risk: "moderate",
      riskScore: 4,
      vegan: true,
      origin: "Sentetik (UV Filtresi)",
      animalSource: null,
      category: "Güneş Koruyucu Filtre",
      summaryTr: "UVA/UVB ışınlarını emen sentetik güneş filtresidir. Çok hassas ciltlerde mineral filtreler (Çinko Oksit) daha nazik olabilir.",
      tags: ["UV Filtresi", "Sentetik"]
    };
  }

  // 4. Silikon ailesi
  if (/(dimethicone|methicone|siloxane|silsesquioxane|silicate|silicone|disiloxane|trisiloxane)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Silikon Türevi)`,
      risk: "moderate",
      riskScore: 3,
      vegan: true,
      origin: "Sentetik (Silis / Silikon)",
      animalSource: null,
      category: "Silikon / Pürüzsüzleştirici",
      summaryTr: "Makyaja ipeksi kayganlık ve kalıcılık veren silikon türevidir. Akneye meyilli ciltlerde akşam çift aşamalı temizlik önerilir.",
      tags: ["Silikon", "Pürüzsüzleştirici"]
    };
  }

  // 5. PEG / PPG / Etoksile emülgatörler & Sülfatlar
  if (/^(peg|ppg)[-\s]?\d+|peg-\d+|ppg-\d+|ceteareth|steareth|oleth|laureth|polysorbate|poloxamer/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Sentetik Emülgatör)`,
      risk: "moderate",
      riskScore: 4,
      vegan: true,
      origin: "Sentetik (Etoksile Bileşik)",
      animalSource: null,
      category: "Emülgatör",
      summaryTr: "Su ve yağı birleştiren sentetik PEG/etoksile emülgatördür. Hassas ciltlerde bariyer geçirgenliğini artırabilir.",
      tags: ["Sentetik Emülgatör"]
    };
  }
  if (/(sulfate|sulphate|sulfonate)/.test(lower) && !/(magnesium sulfate|sodium sulfate|barium sulfate|calcium sulfate)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Temizleyici Sülfat)`,
      risk: "moderate",
      riskScore: 5,
      vegan: true,
      origin: "Bitkisel / Sentetik Yüzey Aktif",
      animalSource: null,
      category: "Yüzey Aktif (Temizleyici)",
      summaryTr: "Köpürtücü temizleyici bileşendir; kuru ve hassas ciltlerde sık kullanımda kuruluk yapabilir.",
      tags: ["Sülfat", "Kuru Cilt Dikkat"]
    };
  }

  // 6. Koku / Aroma / Alerjen bileşenler
  if (/(parfum|fragrance|aroma|citral|citronellol|geraniol|coumarin|eugenol|farnesol|limonene|linalool|cinnamal|ionone|hydroxycitronellal|benzyl benzoate|benzyl cinnamate|benzyl salicylate|menthol|camphor|eucalyptol)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Koku / Aroma Bileşeni)`,
      risk: "moderate",
      riskScore: 5,
      vegan: true,
      origin: "Sentetik veya Uçucu Yağ Kaynaklı",
      animalSource: null,
      category: "Koku / Aroma",
      summaryTr: "Ürüne koku veya ferahlık verir; hassas ve alerjiye meyilli ciltlerde tahriş riski oluşturabilir.",
      tags: ["Koku Bileşeni", "Hassas Cilt Dikkat"]
    };
  }

  // 7. Mineral Pigmentler, Killer & İnorganik Tuzlar
  if (/ci\s*77\d{3}|ultramarines|manganese violet|ferric ferrocyanide|chromium oxide|fluorphlogopite|boron nitride|bismuth oxychloride|tin oxide|bentonite|hectorite|montmorillonite|magnesium|calcium|potassium|sodium chloride|sodium sulfate|zinc|copper|alumina|silica|kaolin|mica|iron|titanium|oxide\b|hydroxide\b|carbonate\b|phosphate\b/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Mineral Bileşen)`,
      risk: "safe",
      riskScore: 1,
      vegan: true,
      origin: "Mineral Kaynaklı",
      animalSource: null,
      category: "Mineral / Pigment / pH Dengeleyici",
      summaryTr: "Doğal veya saflaştırılmış mineral kaynaklı bileşendir; renk, doku, matlık veya pH dengesi sağlar.",
      tags: ["Mineral", "Vegan"]
    };
  }

  // 8. Sentetik Kozmetik Boyaları (CI 1xxxx - CI 4xxxx / Lake / Red / Yellow / Blue)
  if (/ci\s*[1246]\d{4}|yellow\s*\d|red\s*\d|blue\s*\d|violet\s*\d|green\s*\d|orange\s*\d|lake\b/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Kozmetik Boya)`,
      risk: "moderate",
      riskScore: 3,
      vegan: true,
      origin: "Sentetik (Renk Pigmenti)",
      animalSource: null,
      category: "Sentetik Renklendirici",
      summaryTr: "Karmin'e vegan alternatif olarak kullanılan kozmetik renk pigmentidir. Çok hassas cilt/dudaklarda nadiren hassasiyet yapabilir.",
      tags: ["Vegan Boya", "Renklendirici"]
    };
  }

  // 9. Bitkisel Yağlar, Tereyağları ve Botanik Özler
  if (/(oil\b|butter\b|extract\b|juice\b|powder\b|leaf\b|flower\b|root\b|fruit\b|bark\b|seed\b|peel\b|kernel\b|stem\b|bud\b|water\b|aqua\b|distillate|alga|kelp|laminaria|chondrus|camellia|rosmarinus|lavandula|chamomilla|calendula|prunus|persea|olea|vitis|oryza|avena|triticum|punica|citrus|mentha|salvia|thymus|zingiber|curcuma|brassica|sesamum|macadamia|moringa|mangifera|theobroma)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Bitkisel Öz / Yağ)`,
      risk: "safe",
      riskScore: 1,
      vegan: true,
      origin: "Bitkisel Kaynaklı",
      animalSource: null,
      category: "Botanik Bileşen",
      summaryTr: "Bitkisel kaynaklı doğal yağ, su veya botanik özüttür; cildi beslemeye, yatıştırmaya ve nemlendirmeye yardımcı olur.",
      tags: ["Bitkisel", "Vegan"]
    };
  }

  // 10. Biyoteknolojik Aktifler, Vitaminler, Amino Asitler & Fermantasyon Özleri
  if (/(peptide|ceramide|hyaluron|panthenol|tocopher|ascorb|niacin|biotin|retinyl|retinol|bakuchiol|resveratrol|ferulic|glutathione|coenzyme|ubiquinone|allantoin|bisabolol|caffeine|arginine|lysine|glycine|proline|serine|alanine|valine|leucine|threonine|histidine|glutamic|aspartic|ferment|filtrate|lysate|yeast|saccharomyces|lactobacillus|bifida|sphingosine|beta-glucan|ectoin|madecassoside|asiaticoside)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Biyoteknolojik Aktif)`,
      risk: "safe",
      riskScore: 1,
      vegan: true,
      origin: "Biyoteknolojik / Fermantasyon",
      animalSource: null,
      category: "Aktif Bakım",
      summaryTr: "Cilt bariyerini, nem dengesini veya antioksidan korumayı destekleyen modern aktif bakım bileşenidir.",
      tags: ["Cilt Dostu", "Aktif"]
    };
  }

  // 11. Sentetik Polimerler & Film Oluşturucular (Maskara, Ruj, Jel)
  if (/(copolymer|crosspolymer|polymer|acrylate|methacrylate|carbomer|pvp\b|vp\/|nylon|polyethylene|polypropylene|polyurethane|polybutene|polyisobutene|styrene|vinyl|resin|cellulose|gum\b|starch|dextrin|pullulan|maltodextrin)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Film Oluşturucu / Polimer)`,
      risk: "safe",
      riskScore: 2,
      vegan: true,
      origin: "Sentetik / Bitkisel Polimer",
      animalSource: null,
      category: "Kıvam & Kalıcılık Verici",
      summaryTr: "Ürünün dokusunu sabitler, makyajın akmasını önler ve uzun süre kalıcılık sağlar.",
      tags: ["Kalıcılık", "Kıvam Verici"]
    };
  }

  // 12. Yumuşatıcı Esterler, Yağ Asitleri, Glikoller & Nazik Koruyucular
  if (/(glycol|glyceride|glycerin|stearate|palmitate|myristate|oleate|linoleate|laurate|caprylate|caprate|benzoate|sorbate|citrate|lactate|gluconate|isostearate|behenate|ricinoleate|malate|trimellitate|isononanoate|neopentanoate|carbonate|alkan|dodecane|hexadecane|tetradecane|undecane|tridecane|squalane|octyldodecanol|hexanediol|pentanediol|butanediol|chlorphenesin|dehydroacetate|hydroxyacetophenone|piroctone|cymen|edta|etidronate|wax\b|cera\b|ozokerite|ceresin|paraffin|petrolatum|alcohol\b|acid\b|betaine|glucoside|taurate|sarcosinate|glutamate|isethionate|ester\b)/.test(lower)) {
    const isConditionalFatty = /(stearic acid|palmitic acid|stearate|glycerin|glyceryl)/.test(lower);
    const isPetrol = /(paraffin|petrolatum|ozokerite|ceresin)/.test(lower);
    return {
      inci: rawName,
      nameTr: `${rawName} (${isPetrol ? "Mineral / Petrol Mumu" : "Yumuşatıcı / Stabilizatör"})`,
      risk: isPetrol ? "moderate" : "safe",
      riskScore: isPetrol ? 4 : 2,
      vegan: isConditionalFatty ? "conditional" : true,
      origin: isPetrol
        ? "Mineral / Petrol Türevi"
        : isConditionalFatty
        ? "Bitkisel veya Hayvansal (Çoğunlukla Bitkisel)"
        : "Bitkisel / Sentetik Türev",
      animalSource: isConditionalFatty
        ? "Modern kozmetikte çoğunlukla bitkisel yağlardan üretilir; nadiren hayvansal kaynaklı olabilir."
        : null,
      category: isPetrol ? "Mum / Kıvam Verici" : "Yumuşatıcı / Taşıyıcı",
      summaryTr: isPetrol
        ? "Ürüne yoğun kıvam ve nem bariyeri veren mineral/petrol türevi mumdur; akneye meyilli ciltlerde dikkatli kullanılmalıdır."
        : "Formülün pürüzsüz sürülmesini, stabil kalmasını ve cildi yumuşatmasını sağlayan standart kozmetik bileşenidir.",
      tags: isPetrol ? ["Mineral Mum", "Orta Risk"] : ["Yumuşatıcı", "Düşük Risk"]
    };
  }

  // 13. Kalan tüm geçerli kimyasal INCI bileşenleri için evrensel sınıflandırma (sıfır "tanımlı değil"!)
  return {
    inci: rawName,
    nameTr: `${rawName} (Kozmetik Bileşeni)`,
    risk: "safe",
    riskScore: 2,
    vegan: true,
    origin: "Sentetik / Laboratuvar Kaynaklı",
    animalSource: null,
    category: "Yardımcı Formül Bileşeni",
    summaryTr: "Ürünün doku, stabilite veya uygulama performansını destekleyen standart kozmetik formül bileşenidir.",
    tags: ["Formül Bileşeni", "Düşük Risk"]
  };
}

/**
 * Gerçek dünya etiketlerinden gelen çöp/dipnot parçacıklarını (örn: "2", "100%", "F.I.L. C23456/1", "May contain") ayıklar.
 */
function isNoiseToken(token) {
  const t = token.trim();
  if (!t || t.length < 2) return true;
  if (/^[\d\s.,%+\-*/#()\[\]:;]+$/.test(t)) return true; // saf sayı / yüzde ("2", "100%", "+/-")
  if (/^(f\.?\s*i\.?\s*l\.?|code\s*f\.?\s*i\.?\s*l|[a-z]\d{5,}\/\d+|may\s*contain|peut\s*contenir|ingredients?|ingrédients?|içindekiler|i̇çindekiler|contains?)$/i.test(t)) {
    return true;
  }
  return false;
}

// Etiket önekleri ("Ingredients:", "İçindekiler:") ve "may contain / +/-" ayraçları
const PREFIX_RE = /^\s*(?:ingredients?|ingrédients?|ingredientes|inci|içindekiler|i̇çindekiler|İçindekiler|bileşenler|composition)\s*(?:\/\s*[^\s:]+\s*)?[:：]\s*/i;
const MAY_CONTAIN_RE = /\[\s*\+\s*\/\s*-\s*\]\s*:?|\(\s*\+\s*\/\s*-\s*\)\s*:?|\+\s*\/\s*-\s*:?|\b(?:may\s+contain|peut\s+contenir|puede\s+contener|kann\s+enthalten|içerebilir)\b\s*:?/gi;

/** Parantez dışındaki virgül / noktalı virgül / satır sonu / madde işaretlerinden böler. */
function splitTopLevel(text) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    // "1,3-Butylene Glycol", "1,2-Hexanediol": rakamlar arasındaki virgül ayraç değildir
    const numericComma = ch === "," && /\d/.test(text[i - 1] || "") && /\d/.test(text[i + 1] || "");
    if (depth === 0 && !numericComma && /[,;\n\r•·|]/.test(ch)) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  // Kapanmamış parantez listenin geri kalanını yutmasın: güvenli yedek bölme
  if (depth > 0) return text.split(/[,;\n\r•·|]+/);
  return out;
}

/**
 * Virgül, noktalı virgül veya yeni satırla ayrılmış INCI metnini temiz listeye çevirir.
 */
export function parseInciString(input) {
  let rawArr;
  if (Array.isArray(input)) {
    rawArr = input.filter((s) => s !== null && s !== undefined && typeof s !== "object").map((s) => String(s));
  } else {
    const text = String(input ?? "")
      .replace(ZERO_WIDTH_RE, "")
      .replace(PREFIX_RE, "")
      .replace(MAY_CONTAIN_RE, ",");
    rawArr = splitTopLevel(text);
  }

  const cleaned = [];
  const seen = new Set();

  for (let part of rawArr) {
    part = part
      .replace(ZERO_WIDTH_RE, "")
      .replace(PREFIX_RE, "")
      .replace(/^(may contain|peut contenir|\+\/-)\s*:?\s*/i, "")
      .replace(/\[?\+\/-\]?/g, "")
      .replace(/^[\s*•·\-–—.:\[\]]+|[\s*•·\-–—.:\[\]]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Dengesiz tek parantezleri temizle: "Eau)" → "Eau", "(Water" → "Water"
    if (!part.includes("(") && part.endsWith(")")) part = part.slice(0, -1).trim();
    if (!part.includes(")") && part.startsWith("(")) part = part.slice(1).trim();

    if (isNoiseToken(part)) continue;
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(part);
  }
  return cleaned;
}

function roundPercentages(counts) {
  const keys = ["safe", "moderate", "high", "unknown"];
  const out = { safe: 0, moderate: 0, high: 0, unknown: 0 };
  if (!counts.total) return out;
  const raw = keys.map((k) => ({ k, v: (counts[k] / counts.total) * 100 }));
  let used = 0;
  for (const r of raw) {
    out[r.k] = Math.floor(r.v);
    used += out[r.k];
  }
  raw.sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)));
  for (let i = 0; used < 100 && i < raw.length; i++, used++) out[raw[i].k] += 1;
  return out;
}

/**
 * Bir içerik listesinin tam sağlık ve vegan analizini yapar.
 */
export function analyzeIngredients(input) {
  const rawList = parseInciString(input);

  const items = [];
  const counts = { safe: 0, moderate: 0, high: 0, unknown: 0, total: 0 };
  const nonVeganIngredients = [];
  const conditionalVeganIngredients = [];
  const highRiskIngredients = [];
  const safeHeroIngredients = [];

  for (const rawName of rawList) {
    const found = findIngredient(rawName);
    const flags = getIngredientFlags(rawName, found);
    let match = found;
    if (found && flags) {
      match = { ...found };
      // Kaynağı belirsiz maddeler (gliserin, stearik asit vb.) kesin vegan sayılmaz
      if (flags.ambiguous && match.vegan === true) {
        match.vegan = "conditional";
        match.animalSource = match.animalSource || flags.ambiguous.note;
      }
      // AB'de yasaklı maddeler her zaman yüksek riskli sayılır
      if (flags.banned && match.risk !== "high") {
        match.risk = "high";
        match.riskScore = Math.max(match.riskScore || 0, 8);
      }
    }
    if (match) {
      items.push({
        rawName,
        known: true,
        ...match,
        origin: inferOriginForKnown(match),
        flags
      });

      counts[match.risk] += 1;
      counts.total += 1;

      if (match.vegan === false) {
        nonVeganIngredients.push(match);
      } else if (match.vegan === "conditional") {
        conditionalVeganIngredients.push(match);
      }

      if (match.risk === "high") {
        highRiskIngredients.push(match);
      } else if (match.risk === "safe" && match.riskScore === 1 && match.category !== "Çözücü") {
        safeHeroIngredients.push(match);
      }
    } else {
      items.push({
        rawName,
        known: false,
        inci: rawName,
        nameTr: rawName,
        risk: "unknown",
        riskScore: null,
        vegan: "unknown",
        animalSource: null,
        category: "Veritabanında Yok",
        summaryTr:
          "Bu bileşen henüz yerel veritabanımızda tanımlı değil. Kesin bilgi için ürün etiketini veya üretici beyanını kontrol edin.",
        tags: ["İncelenmedi"],
        flags
      });
      counts.unknown += 1;
      counts.total += 1;
    }
  }

  // Sağlık Skoru Hesaplama (0 - 100)
  // Yüksek riskli bileşenler güçlü, orta riskliler ılımlı puan düşürür.
  let healthScore = 100;
  const knownCount = counts.safe + counts.moderate + counts.high;

  if (knownCount > 0) {
    let penalty = 0;
    for (const item of items) {
      if (!item.known) continue;
      if (item.risk === "high") {
        penalty += 15 + (item.riskScore - 6) * 2;
      } else if (item.risk === "moderate") {
        penalty += 5 + Math.max(0, item.riskScore - 3) * 1.5;
      }
    }
    // Çok uzun listelerde küçük oranlı orta riskler skoru aşırı ezmesin diye hafif ölçekleme
    const scale = knownCount > 12 ? 12 / knownCount : 1;
    const adjustedPenalty = penalty * (0.7 + 0.3 * scale);
    healthScore = Math.max(8, Math.min(100, Math.round(100 - adjustedPenalty)));

    // En az 1 yüksek riskli madde varsa skor 74'ün üstüne çıkmasın
    if (counts.high >= 1 && healthScore > 74) healthScore = 74;
    if (counts.high >= 3 && healthScore > 48) healthScore = 48;
  } else {
    healthScore = 0;
  }

  // Sağlık Durumu Sınıflandırması
  let healthStatus = "healthy";
  let healthLabel = "Sağlıklı & Temiz";
  let healthSummary = "Formül cilt dostu ve düşük riskli bileşenlerden oluşuyor.";

  if (knownCount === 0) {
    healthStatus = "unknown";
    healthLabel = "Yetersiz Veri";
    healthSummary = "Listelenen içerikler veritabanımızla eşleşmedi.";
  } else if (healthScore >= 78) {
    healthStatus = "healthy";
    healthLabel = "Sağlıklı & Temiz";
    healthSummary = "Genel olarak güvenli, cilt bariyerini koruyan temiz bir formüle sahip.";
  } else if (healthScore >= 52) {
    healthStatus = "moderate";
    healthLabel = "Dikkatli Kullanım";
    healthSummary = "Bazı hassasiyet yapabilecek veya orta riskli içerikler barındırıyor.";
  } else {
    healthStatus = "risky";
    healthLabel = "Riskli İçerik";
    healthSummary = "Yüksek riskli veya kaçınılması önerilen birden fazla kimyasal bileşen tespit edildi.";
  }

  // Vegan Durumu Sınıflandırması
  let veganStatus = "vegan";
  let veganLabel = "%100 Vegan";
  let veganExplanation = "Analiz edilen içerikler arasında hayvansal kaynaklı hiçbir bileşen bulunamadı.";

  if (nonVeganIngredients.length > 0) {
    veganStatus = "non-vegan";
    veganLabel = "Vegan Değil";
    const names = nonVeganIngredients.map((i) => i.nameTr).join(", ");
    veganExplanation = `Hayvansal kaynaklı bileşen tespit edildi: ${names}.`;
  } else if (conditionalVeganIngredients.length > 0) {
    veganStatus = "check";
    veganLabel = "Kaynağı Kontrol Et";
    const names = conditionalVeganIngredients.map((i) => i.nameTr).join(", ");
    veganExplanation = `${names} bileşenleri hem bitkisel hem hayvansal üretilebilir; ambalajda Vegan logosu arayın.`;
  } else if (knownCount === 0) {
    veganStatus = "check";
    veganLabel = "Belirsiz";
    veganExplanation = "İçerikler tanınmadığı için veganlık durumu doğrulanamadı.";
  }

  // Yüzdelik dağılım
  // En büyük kalan yöntemiyle yuvarlanır: toplam her zaman tam 100 olur ve
  // bilinmeyen madde yokken "unknown" yuvarlama artığıyla %1 görünmez.
  const { safe: safePct, moderate: moderatePct, high: highPct, unknown: unknownPct } = roundPercentages(counts);

  // Öne çıkan görsel bulgular (highlights)
  const highlights = [];
  const hasParaben = items.some((i) => i.known && i.tags.includes("Paraben"));
  const hasFragrance = items.some((i) => i.known && (i.inci === "Parfum" || i.tags.includes("Koku Alerjeni")));

  if (!hasParaben && knownCount > 0) {
    highlights.push({ type: "positive", text: "Paraben içermez" });
  } else if (hasParaben) {
    highlights.push({ type: "danger", text: "Paraben tespit edildi" });
  }

  if (!hasFragrance && knownCount > 0) {
    highlights.push({ type: "positive", text: "Parfüm / koku alerjeni yok" });
  } else if (hasFragrance) {
    highlights.push({ type: "warning", text: "Koku / parfüm alerjeni içerir" });
  }

  if (nonVeganIngredients.length > 0) {
    highlights.push({
      type: "nonvegan",
      text: `${nonVeganIngredients.length} hayvansal bileşen (${nonVeganIngredients.map((i) => i.inci).join(", ")})`
    });
  } else if (veganStatus === "vegan") {
    highlights.push({ type: "vegan", text: "Tamamen bitkisel / mineral kaynaklı" });
  }

  if (safeHeroIngredients.length > 0) {
    const topHeroes = safeHeroIngredients.slice(0, 2).map((i) => i.nameTr).join(" & ");
    highlights.push({ type: "positive", text: `Cilt dostu aktifler: ${topHeroes}` });
  }

  // Dinamik Cilt Tipi Uygunluk Analizi
  const skinProfile = computeSkinCompatibility(items, knownCount);

  const safety = summarizeFlags(items);
  if (safety.groups.some((g) => g.key === "banned")) {
    highlights.unshift({ type: "danger", text: "AB'de yasaklı madde içerir" });
  }

  return {
    safety,
    healthScore,
    healthStatus,
    healthLabel,
    healthSummary,
    veganStatus,
    veganLabel,
    veganExplanation,
    nonVeganIngredients,
    conditionalVeganIngredients,
    highRiskIngredients,
    counts,
    percentages: {
      safe: safePct,
      moderate: moderatePct,
      high: highPct,
      unknown: unknownPct
    },
    highlights,
    skinProfile,
    items
  };
}

/**
 * İçerik listesine göre 5 temel cilt tipi (Kuru, Yağlı/Akne, Hassas, Karma, Normal)
 * için dinamik uygunluk seviyesi ve Türkçe gerekçe hesaplar.
 */
function computeSkinCompatibility(items, knownCount) {
  if (knownCount === 0) {
    return {
      hasData: false,
      recommendedLabels: [],
      summaryText: "İçerik bilgisi olmadığı için cilt tipi uygunluğu hesaplanamadı.",
      types: []
    };
  }

  const allText = items
    .map((i) => `${i.inci || ""} ${i.rawName || ""} ${(i.tags || []).join(" ")}`)
    .join(" | ")
    .toLowerCase();

  const hasHydrators = /(hyaluron|glycerin|squalane|ceramide|shea|butyrospermum|urea|panthenol|jojoba|simmondsia|argan|almond|rosehip|rosa canina)/.test(allText);
  const hasSoothers = /(centella|panthenol|allantoin|bisabolol|aloe|ceramide|niacinamide|zinc oxide)/.test(allText);
  const hasOilControl = /(niacinamide|salicylic|silica|kaolin|azelaic|zinc oxide)/.test(allText);

  const hasFragrance = /(parfum|fragrance|limonene|linalool|citronellol|geraniol|coumarin|eugenol|hexyl cinnamal|koku alerjeni)/.test(allText);
  const hasDryingAlcohol = /(alcohol denat|denatured alcohol|sd alcohol)/.test(allText);
  const hasHarshSulfate = /(sodium lauryl sulfate|\bsls\b)/.test(allText);
  const hasComedogenic = /(cocos nucifera|coconut oil|mineral oil|paraffinum liquidum|petrolatum|lanolin|isopropyl myristate)/.test(allText);
  const hasHeavySilicone = /(dimethicone|cyclopentasiloxane|silikon)/.test(allText);
  const hasStrongActives = /(retinol|retinyl palmitate|glycolic acid)/.test(allText);
  const hasHighAllergenPreservative = /(dmdm hydantoin|methylisothiazolinone|formaldehit)/.test(allText);
  const hasCarmine = /(carmine|ci 75470)/.test(allText);

  // 1. Kuru Cilt
  let dryLevel = "recommended";
  let dryReason = hasHydrators
    ? "Nem tutucu ve besleyici bileşenlerle kuru cildi destekler."
    : "Kurutucu sert bileşen içermediği için kuru ciltte kullanılabilir.";
  if (hasHarshSulfate || hasDryingAlcohol) {
    dryLevel = hasHarshSulfate && hasDryingAlcohol ? "avoid" : "caution";
    dryReason = hasHarshSulfate
      ? "Sert sülfat (SLS) içerdiği için kuru cildi daha fazla kurutabilir."
      : "Denatüre alkol içerdiği için kuru ciltlerde gerginlik yapabilir.";
  }

  // 2. Yağlı & Akneye Meyilli Cilt
  let oilyLevel = "recommended";
  let oilyReason = hasOilControl
    ? "Sebum dengeleyici / gözenek dostu bileşenlerle yağlı ve akneye meyilli ciltlere uygundur."
    : "Ağır gözenek tıkayıcı yağlar içermediği için yağlı ciltte rahattır.";
  if (hasComedogenic) {
    oilyLevel = "avoid";
    oilyReason = "Hindistan cevizi yağı, mineral yağ veya lanolin gibi komedojenik (gözenek tıkayıcı) maddeler içerir.";
  } else if (hasHeavySilicone) {
    oilyLevel = "caution";
    oilyReason = "Silikon türevi içerir; akneye meyilli ciltlerde akşam çift aşamalı temizlik önerilir.";
  }

  // 3. Hassas Cilt
  let sensitiveLevel = "recommended";
  let sensitiveReason = hasSoothers
    ? "Parfümsüz ve yatıştırıcı (Pantenol/Seramid/Centella vb.) yapısıyla hassas cilt dostudur."
    : "Yaygın koku alerjeni ve sert tahriş ediciler içermediği için hassas ciltlere uygundur.";
  if (hasHighAllergenPreservative || hasHarshSulfate || (hasFragrance && hasDryingAlcohol)) {
    sensitiveLevel = "avoid";
    sensitiveReason = "Yüksek alerjen koruyucu, sert sülfat veya parfüm+alkol kombinasyonu hassas ciltte tahriş yapabilir.";
  } else if (hasFragrance || hasStrongActives || hasDryingAlcohol || hasCarmine) {
    sensitiveLevel = "caution";
    sensitiveReason = hasFragrance
      ? "Parfüm veya koku alerjeni içerdiğinden çok hassas/egzamalı ciltlerde dikkatli kullanılmalıdır."
      : hasStrongActives
      ? "Güçlü aktif (Retinol/AHA) içerir; hassas ciltlerde düşük sıklıkla başlanmalıdır."
      : "Hassas ciltlerde reaksiyon potansiyeli olan bileşenler içerir.";
  }

  // 4. Karma Cilt
  let comboLevel = "recommended";
  let comboReason = "Dengeli formülüyle T-bölgesi yağlı, yanakları normal/kuru karma ciltlere uygundur.";
  if (hasComedogenic && hasHarshSulfate) {
    comboLevel = "avoid";
    comboReason = "Hem sert temizleyici hem gözenek tıkayıcı içerik barındırdığı için karma cilt dengesini bozabilir.";
  } else if (hasComedogenic) {
    comboLevel = "caution";
    comboReason = "T-bölgesinde parlama veya gözenek tıkanması yapabilecek ağır yağlar içerir.";
  }

  // 5. Normal Cilt
  let normalLevel = "recommended";
  let normalReason = "Günlük kullanımda normal cilt bariyeriyle uyumlu bir formüle sahiptir.";
  if (hasHighAllergenPreservative) {
    normalLevel = "caution";
    normalReason = "Yüksek alerjen potansiyelli koruyucu içerdiği için daha temiz alternatifler tercih edilebilir.";
  }

  const types = [
    { id: "kuru", icon: "💧", label: "Kuru", level: dryLevel, reason: dryReason },
    { id: "yagli", icon: "✨", label: "Yağlı / Akne", level: oilyLevel, reason: oilyReason },
    { id: "hassas", icon: "🌸", label: "Hassas", level: sensitiveLevel, reason: sensitiveReason },
    { id: "karma", icon: "⚖️", label: "Karma", level: comboLevel, reason: comboReason },
    { id: "normal", icon: "🌿", label: "Normal", level: normalLevel, reason: normalReason }
  ];

  const recommendedLabels = types.filter((t) => t.level === "recommended").map((t) => t.label);
  const summaryText =
    recommendedLabels.length > 0
      ? `En uygun cilt tipleri: ${recommendedLabels.join(", ")}`
      : "Tüm cilt tiplerinde içeriğindeki aktif/alerjenler nedeniyle dikkatli kullanım önerilir.";

  return {
    hasData: true,
    recommendedLabels,
    summaryText,
    types
  };
}
