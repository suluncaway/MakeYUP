/**
 * MakeYUP — INCI İçerik & Vegan Analiz Motoru
 * Verilen içerik listesini (metin veya dizi) analiz ederek sağlık skoru,
 * veganlık durumu, risk dağılımı ve öne çıkan bulguları hesaplar.
 */

import { INGREDIENTS_DB } from "./data/ingredients.js";

/**
 * Metni eşleştirme için normalize eder.
 */
export function normalizeText(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ") // parantez içlerini ayır
    .replace(/[^a-z0-9çğıöşü/\-\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tek bir içerik adını veritabanında arar.
 */
export function findIngredient(rawName) {
  const cleaned = rawName.trim();
  const norm = normalizeText(cleaned);
  if (!norm) return null;

  // 1. Tam INCI veya alias eşleşmesi
  for (const item of INGREDIENTS_DB) {
    if (normalizeText(item.inci) === norm) return item;
    if (item.aliases.some((alias) => normalizeText(alias) === norm)) {
      return item;
    }
  }

  // 2. Kısmi eşleşme (örn: "CI 75470 / Carmine" veya "Water (Aqua)")
  const rawLower = cleaned.toLowerCase();
  for (const item of INGREDIENTS_DB) {
    const inciLower = item.inci.toLowerCase();
    if (rawLower.includes(inciLower) && inciLower.length >= 4) return item;
    for (const alias of item.aliases) {
      const aliasLower = alias.toLowerCase();
      if (aliasLower.length >= 4 && rawLower.includes(aliasLower)) {
        return item;
      }
    }
  }

  // 3. Akıllı INCI Desen & CI Pigment Tanıma (Veritabanında birebir yoksa bile sınıfını analiz et)
  return classifyByPattern(cleaned, rawLower);
}

/**
 * Veritabanında birebir bulunmayan gerçek dünya INCI maddelerini
 * kozmetik kimya kurallarına ve CI pigment kodlarına göre akıllıca sınıflandırır.
 */
function classifyByPattern(rawName, lower) {
  // Hayvansal kaynaklı anahtar kelimeler
  if (/(beeswax|cera alba|cera flava|honey|propolis|royal jelly)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Arı Ürünü)`,
      risk: "safe",
      riskScore: 1,
      vegan: false,
      animalSource: "Bal arılarından elde edilen hayvansal bileşen.",
      category: "Hayvansal Mum / Özüt",
      summaryTr: "Cilt için besleyici ve koruyucudur ancak arı kaynaklı olduğu için VEGAN DEĞİLDİR.",
      tags: ["Hayvansal Kaynaklı", "Vegan Değil"]
    };
  }
  if (/(carmine|ci\s*75470|cochineal|carminic)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Karmin Pigmenti)`,
      risk: "moderate",
      riskScore: 4,
      vegan: false,
      animalSource: "Koşnil böceğinden elde edilen kırmızı pigment.",
      category: "Hayvansal Renklendirici",
      summaryTr: "Kırmızı/pembe ton veren böcek kaynaklı pigmenttir; VEGAN DEĞİLDİR.",
      tags: ["Hayvansal Kaynaklı", "Vegan Değil"]
    };
  }
  if (/(lanolin|tallow|collagen|elastin|keratin|silk|serica|snail|chitosan|guanine|ci\s*75170|shellac)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Hayvansal Türev)`,
      risk: "safe",
      riskScore: 2,
      vegan: false,
      animalSource: "Hayvansal kaynaklı kozmetik bileşeni.",
      category: "Hayvansal Bileşen",
      summaryTr: "Bitkisel/vegan olduğu özellikle belirtilmedikçe hayvansal kaynaklı kabul edilir ve VEGAN DEĞİLDİR.",
      tags: ["Hayvansal Kaynaklı", "Vegan Değil"]
    };
  }

  // Yüksek riskli kimyasal aileler
  if (/paraben\b/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Paraben)`,
      risk: "high",
      riskScore: 7,
      vegan: true,
      animalSource: null,
      category: "Koruyucu (Paraben)",
      summaryTr: "Paraben ailesinden sentetik koruyucudur; hormonal etki şüphesi nedeniyle temiz kozmetikte kaçınılır.",
      tags: ["Paraben", "Endokrin Şüphesi"]
    };
  }
  if (/(formaldehyd|hydantoin|imidazolidinyl|diazolidinyl|quaternium-15|bronopol)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Formaldehit Salıcı)`,
      risk: "high",
      riskScore: 9,
      vegan: true,
      animalSource: null,
      category: "Koruyucu",
      summaryTr: "Formaldehit salma potansiyeli taşıyan yüksek alerjen riskli koruyucudur.",
      tags: ["Formaldehit Salıcı", "Kaçınılmalı"]
    };
  }
  if (/(fluoro|ptfe|pfas|perfluoro)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Florlu Bileşik)`,
      risk: "high",
      riskScore: 8,
      vegan: true,
      animalSource: null,
      category: "Kalıcı Kimyasal",
      summaryTr: "PFAS/floropolimer grubuna ait kalıcı sentetik bileşendir; sağlık ve çevre açısından kaçınılması önerilir.",
      tags: ["Kalıcı Kimyasal", "Yüksek Risk"]
    };
  }

  // Silikon ailesi
  if (/(dimethicone|methicone|siloxane|silsesquioxane|silicate)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Silikon Türevi)`,
      risk: "moderate",
      riskScore: 3,
      vegan: true,
      animalSource: null,
      category: "Silikon / Pürüzsüzleştirici",
      summaryTr: "Makyaja ipeksi kayganlık ve kalıcılık veren silikon türevidir. Akneye meyilli ciltlerde akşam çift aşamalı temizlik önerilir.",
      tags: ["Silikon", "Pürüzsüzleştirici"]
    };
  }

  // PEG / PPG / Etoksile emülgatörler
  if (/^(peg|ppg)[-\s]?\d+|ceteareth|steareth|oleth|laureth|polysorbate/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Sentetik Emülgatör)`,
      risk: "moderate",
      riskScore: 4,
      vegan: true,
      animalSource: null,
      category: "Emülgatör",
      summaryTr: "Su ve yağı birleştiren sentetik PEG/etoksile emülgatördür. Hassas ciltlerde bariyer geçirgenliğini artırabilir.",
      tags: ["Sentetik Emülgatör"]
    };
  }

  // Mineral Pigment CI Kodları (CI 77xxx)
  if (/ci\s*77\d{3}|ultramarines|manganese violet|ferric ferrocyanide|chromium oxide|fluorphlogopite/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Mineral Pigment)`,
      risk: "safe",
      riskScore: 1,
      vegan: true,
      animalSource: null,
      category: "Mineral Renklendirici",
      summaryTr: "Makyaj ürünlerine renk veya ışıltı veren, ciltle uyumlu ve vegan mineral pigmenttir.",
      tags: ["Mineral", "Vegan Pigment"]
    };
  }

  // Sentetik Organik Boya CI Kodları (CI 1xxxx - CI 4xxxx)
  if (/ci\s*[124]\d{4}|yellow\s*\d|red\s*\d|blue\s*\d|lake\b/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Kozmetik Boya)`,
      risk: "moderate",
      riskScore: 3,
      vegan: true,
      animalSource: null,
      category: "Sentetik Renklendirici",
      summaryTr: "Karmin'e vegan alternatif olarak kullanılan kozmetik renk pigmentidir. Çok hassas cilt/dudaklarda nadiren hassasiyet yapabilir.",
      tags: ["Vegan Boya", "Renklendirici"]
    };
  }

  // Bitkisel yağlar, tereyağları ve botanik özler
  if (/(seed oil|fruit oil|kernel oil|flower oil|leaf oil|butter|leaf extract|flower extract|root extract|fruit extract|bark extract|seed extract|water\b)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Bitkisel Öz / Yağ)`,
      risk: "safe",
      riskScore: 1,
      vegan: true,
      animalSource: null,
      category: "Botanik Bileşen",
      summaryTr: "Bitkisel kaynaklı doğal yağ veya botanik özüttür; cildi beslemeye ve yumuşatmaya yardımcı olur.",
      tags: ["Bitkisel", "Vegan"]
    };
  }

  // Peptit, Seramid, Hyaluronik türevler
  if (/(peptide|ceramide|hyaluron|panthenol|tocopher|ascorb|niacin)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Aktif Bakım)`,
      risk: "safe",
      riskScore: 1,
      vegan: true,
      animalSource: null,
      category: "Aktif Bakım",
      summaryTr: "Cilt bariyerini ve nem dengesini destekleyen modern kozmetik aktif bileşenidir.",
      tags: ["Cilt Dostu", "Aktif"]
    };
  }

  // Yaygın güvenli yapı/kıvam/çözücü bileşenleri
  if (/(glycol|glyceride|stearate|palmitate|myristate|oleate|citrate|benzoate|sorbate|gum\b|cellulose|starch|silica|kaolin|clay|polybutene|isododecane|isohexadecane|squalane|wax|cera\b|oxide|mica|alumina|calcium)/.test(lower)) {
    return {
      inci: rawName,
      nameTr: `${rawName} (Formül Bileşeni)`,
      risk: "safe",
      riskScore: 2,
      vegan: true,
      animalSource: null,
      category: "Doku / Kıvam Verici",
      summaryTr: "Ürünün dokusunu, kalıcılığını ve kolay sürülmesini sağlayan standart güvenli kozmetik bileşenidir.",
      tags: ["Doku Verici", "Düşük Risk"]
    };
  }

  return null;
}

/**
 * Virgül, noktalı virgül veya yeni satırla ayrılmış INCI metnini listeye çevirir.
 */
export function parseInciString(input) {
  if (Array.isArray(input)) {
    return input.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(input || "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
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
    const match = findIngredient(rawName);
    if (match) {
      items.push({
        rawName,
        known: true,
        ...match
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
        tags: ["İncelenmedi"]
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
  const safePct = counts.total ? Math.round((counts.safe / counts.total) * 100) : 0;
  const moderatePct = counts.total ? Math.round((counts.moderate / counts.total) * 100) : 0;
  const highPct = counts.total ? Math.round((counts.high / counts.total) * 100) : 0;
  const unknownPct = counts.total ? Math.max(0, 100 - safePct - moderatePct - highPct) : 0;

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

  return {
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
