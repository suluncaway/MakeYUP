/**
 * MakeYUP — Ek Güvenlik Bayrakları
 * Hamilelik, AB alerjen / yasaklı / kısıtlı maddeler, helal uygunluğu,
 * kaynağı belirsiz (bitkisel veya hayvansal) maddeler ve çevre etkisi.
 */

import { PREGNANCY_FLAGS, HALAL_FLAGS, AMBIGUOUS_SOURCE } from "./data/lifestyle_flags.js";
import { EU_ALLERGENS, EU_BANNED, EU_RESTRICTED } from "./data/eu_regulatory.js";
import { ENV_FLAGS } from "./data/environment_flags.js";

function clean(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9/\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIndex(table) {
  const exact = new Map();
  const patterns = [];
  for (const [key, val] of Object.entries(table || {})) {
    const entry = { key, ...val };
    exact.set(clean(key), entry);
    for (const alias of val.aliases || []) exact.set(clean(alias), entry);
    if (val.pattern) {
      try {
        patterns.push([new RegExp(val.pattern, "i"), entry]);
      } catch {
        // geçersiz desen: yoksay
      }
    }
  }
  return { exact, patterns };
}

const INDEX = {
  pregnancy: buildIndex(PREGNANCY_FLAGS),
  halal: buildIndex(HALAL_FLAGS),
  ambiguous: buildIndex(AMBIGUOUS_SOURCE),
  allergen: buildIndex(EU_ALLERGENS),
  banned: buildIndex(EU_BANNED),
  restricted: buildIndex(EU_RESTRICTED),
  env: buildIndex(ENV_FLAGS)
};

/** "Aqua (Water)" → ["aqua (water)", "aqua", "water"] gibi aday adlar üretir. */
function candidateNames(rawName, item) {
  const out = new Set();
  const add = (s) => {
    const c = clean(s);
    if (c) out.add(c);
  };
  for (const name of [rawName, item && item.inci]) {
    if (!name) continue;
    add(name);
    add(String(name).replace(/\(.*?\)/g, " "));
    for (const m of String(name).matchAll(/\(([^)]+)\)/g)) add(m[1]);
    for (const part of String(name).split("/")) add(part);
  }
  return [...out];
}

function lookup(index, names) {
  for (const n of names) {
    const hit = index.exact.get(n);
    if (hit) return hit;
  }
  for (const [re, entry] of index.patterns) {
    if (names.some((n) => re.test(n))) return entry;
  }
  return null;
}

/** Tek bir bileşenin tüm ek bayraklarını döndürür (yoksa null alanlar). */
export function getIngredientFlags(rawName, item) {
  const names = candidateNames(rawName, item);
  const flags = {};
  for (const key of Object.keys(INDEX)) {
    const hit = lookup(INDEX[key], names);
    if (hit) flags[key] = hit;
  }
  if (flags.banned) delete flags.restricted;
  return Object.keys(flags).length ? flags : null;
}

/** Bileşen kartında gösterilecek kısa etiketler. */
export function flagTags(flags) {
  if (!flags) return [];
  const tags = [];
  if (flags.banned) tags.push({ cls: "tag-high", text: "⛔ AB'de yasaklı" });
  if (flags.restricted) tags.push({ cls: "tag-moderate", text: `AB limiti: ${flags.restricted.max || "kısıtlı"}` });
  if (flags.pregnancy) {
    tags.push({
      cls: flags.pregnancy.lvl === "avoid" ? "tag-high" : "tag-moderate",
      text: flags.pregnancy.lvl === "avoid" ? "🤰 Hamilelikte kaçının" : "🤰 Hamilelikte dikkat"
    });
  }
  if (flags.allergen) tags.push({ cls: "tag-moderate", text: "AB alerjeni" });
  if (flags.halal) tags.push({ cls: "tag-check", text: flags.halal.lvl === "haram" ? "Helal değil" : "Helal şüpheli" });
  if (flags.env) tags.push({ cls: "tag-neutral", text: ENV_LABEL[flags.env.type] || "Çevre etkisi" });
  return tags;
}

const ENV_LABEL = {
  microplastic: "🌊 Mikroplastik",
  reef: "🪸 Mercana zararlı",
  persistent: "♻ Doğada kalıcı"
};

/**
 * Analiz edilen tüm bileşenlerden sade bir uyarı özeti çıkarır.
 * Her grup: { icon, title, level: "danger" | "warning" | "info", names: [] }
 */
export function summarizeFlags(items) {
  const groups = [
    { key: "banned", icon: "⛔", title: "AB'de yasaklı madde", level: "danger", test: (f) => f.banned },
    { key: "pregAvoid", icon: "🤰", title: "Hamilelikte kaçınılmalı", level: "danger", test: (f) => f.pregnancy && f.pregnancy.lvl === "avoid" },
    { key: "pregCaution", icon: "🤰", title: "Hamilelikte doktora danışın", level: "warning", test: (f) => f.pregnancy && f.pregnancy.lvl !== "avoid" },
    { key: "restricted", icon: "📏", title: "AB'de oran sınırı olan madde", level: "warning", test: (f) => f.restricted },
    { key: "allergen", icon: "🌸", title: "AB etiket zorunlu koku alerjeni", level: "warning", test: (f) => f.allergen },
    { key: "halal", icon: "☪", title: "Helal açısından şüpheli", level: "info", test: (f) => f.halal },
    { key: "ambiguous", icon: "🔎", title: "Bitkisel de hayvansal da olabilir", level: "info", test: (f) => f.ambiguous },
    { key: "env", icon: "🌍", title: "Çevreye zararlı / kalıcı", level: "info", test: (f) => f.env }
  ];

  const result = [];
  for (const g of groups) {
    const names = [];
    for (const item of items) {
      if (item.flags && g.test(item.flags)) names.push(item.rawName || item.inci);
    }
    if (names.length) result.push({ key: g.key, icon: g.icon, title: g.title, level: g.level, names });
  }

  const pregnancySafe = !result.some((g) => g.key === "pregAvoid" || g.key === "pregCaution");
  return { groups: result, pregnancySafe };
}
