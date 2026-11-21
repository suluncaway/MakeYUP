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
    items
  };
}
