// MakeYUP motor testleri — bağımlılıksız Node betiği.
// Çalıştırma: node tests/engine.test.mjs   (hata varsa çıkış kodu 1)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const J = (p) => join(ROOT, p);

// Tarayıcı fetch'i yerine yerel dosyaları sunan basit bir sahte fetch
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (!/^https?:/.test(u)) {
    const body = readFileSync(J(u));
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  }
  return realFetch(url, opts);
};

const analyzer = await import(J("js/analyzer.js"));
const flagsMod = await import(J("js/flags.js"));
const search = await import(J("js/search.js"));
const { INGREDIENTS_DB } = await import(J("js/data/ingredients.js"));
const { PRODUCTS_DATA } = await import(J("js/data/products.js"));
const { BRANDS_DATA } = await import(J("js/data/brands.js"));
const lifestyle = await import(J("js/data/lifestyle_flags.js"));
const eu = await import(J("js/data/eu_regulatory.js"));
const env = await import(J("js/data/environment_flags.js"));

const { analyzeIngredients, parseInciString, findIngredient, normalizeText, loadCosingIndex, getCosingMeta } = analyzer;
const { getIngredientFlags, flagTags, summarizeFlags } = flagsMod;
const { compileQuery, fold } = search;

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e && e.message ? e.message : e}`);
  }
}
function ok(cond, msg) {
  if (!cond) throw new Error(msg || "beklenen koşul sağlanmadı");
}
function eq(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${msg || ""} beklenen ${sb}, gelen ${sa}`);
}

// ------------------------------------------------------------------
// parseInciString
// ------------------------------------------------------------------
await test("parse: boş girdi", () => {
  eq(parseInciString(""), []);
  eq(parseInciString(null), []);
  eq(parseInciString(undefined), []);
  eq(parseInciString([]), []);
  eq(parseInciString("   "), []);
});
await test("parse: sadece virgül", () => eq(parseInciString(",,, ,;;\n,"), []));
await test("parse: Ingredients: öneki", () => {
  eq(parseInciString("Ingredients: Aqua, Glycerin"), ["Aqua", "Glycerin"]);
  eq(parseInciString("INGREDIENTS : Aqua, Glycerin"), ["Aqua", "Glycerin"]);
  eq(parseInciString("İçindekiler: Aqua, Glycerin"), ["Aqua", "Glycerin"]);
});
await test("parse: may contain [+/-]", () => {
  const r = parseInciString("Aqua, Mica, May Contain [+/-]: CI 77491, CI 77891");
  eq(r, ["Aqua", "Mica", "CI 77491", "CI 77891"]);
  const r2 = parseInciString("Aqua, Talc [+/- CI 77491, CI 77492]");
  ok(r2.includes("CI 77491") && r2.includes("CI 77492") && r2.includes("Talc"), JSON.stringify(r2));
  const r3 = parseInciString("Dimethicone, Tocopherol. May contain: CI 77891, CI 77499");
  ok(r3.includes("Tocopherol") && r3.includes("CI 77891"), JSON.stringify(r3));
});
await test("parse: yeni satır ve madde işaretleri", () => {
  eq(parseInciString("Aqua\n• Glycerin\n- Niacinamide\r\n* Panthenol"), ["Aqua", "Glycerin", "Niacinamide", "Panthenol"]);
});
await test("parse: tekrarlar", () => eq(parseInciString("Aqua, aqua, AQUA , Glycerin, glycerin"), ["Aqua", "Glycerin"]));
await test("parse: yüzdeler", () => {
  const r = parseInciString("Niacinamide 10%, Zinc PCA 1.0%, 2%, 100%");
  eq(r.length, 2, "yüzde parçaları gürültü sayılmalı");
  eq(findIngredient(r[0]).inci, "Niacinamide");
});
await test("parse: parantez içi virgül bölünmez", () => {
  eq(parseInciString("Aqua (Water, Eau), Glycerin"), ["Aqua (Water, Eau)", "Glycerin"]);
  eq(parseInciString("Aqua (Water)"), ["Aqua (Water)"]);
});
await test("parse: Türkçe adlar", () => {
  eq(parseInciString("Su, Gliserin, Niasinamid"), ["Su", "Gliserin", "Niasinamid"]);
  eq(findIngredient("GLİSERİN").inci, "Glycerin");
  eq(findIngredient("Gliserin").inci, "Glycerin");
  eq(findIngredient("Niasinamid").inci, "Niacinamide");
  eq(findIngredient("SU").inci, "Aqua");
});
await test("parse: rakamlar arası virgül bölünmez", () => {
  eq(parseInciString("Aqua, 1,3-Butylene Glycol, 1,2-Hexanediol"), ["Aqua", "1,3-Butylene Glycol", "1,2-Hexanediol"]);
});
await test("parse: sıfır genişlikli boşluklar", () => {
  const r = parseInciString("Caprylic/\u200BCapric Triglyceride, Aqua\u200B");
  eq(r, ["Caprylic/Capric Triglyceride", "Aqua"]);
  eq(findIngredient("Caprylic/\u200BCapric Triglyceride").inci, "Caprylic/Capric Triglyceride");
});
await test("find: boşluklu paraben adları", () => {
  eq(findIngredient("Propyl Paraben").inci, "Propylparaben");
  eq(findIngredient("Methyl Paraben").inci, "Methylparaben");
  eq(findIngredient("Butyl Paraben").inci, "Butylparaben");
  ok(getIngredientFlags("Isobutyl Paraben", findIngredient("Isobutyl Paraben")).banned);
  eq(findIngredient("Ethylhexyl-Glycerin").inci, "Ethylhexylglycerin");
});
await test("parse+analyze: 200 maddelik liste < 200ms", () => {
  const names = [];
  for (let i = 0; i < 200; i++) names.push(`Test Ingredient ${i} Extract`);
  names.push("Aqua", "Glycerin", "Retinol");
  const text = names.join(", ");
  analyzeIngredients(text); // ısınma
  const t0 = performance.now();
  const res = analyzeIngredients(text);
  const ms = performance.now() - t0;
  ok(ms < 200, `${ms.toFixed(1)}ms`);
  eq(res.counts.total, 203);
});

// ------------------------------------------------------------------
// normalizeText / findIngredient
// ------------------------------------------------------------------
await test("normalizeText temel", () => {
  eq(normalizeText("Aqua (Water)"), "aqua");
  eq(normalizeText(""), "");
  eq(normalizeText(null), "");
});
await test("find: parantez ve eğik çizgi", () => {
  eq(findIngredient("Aqua (Water)").inci, "Aqua");
  eq(findIngredient("Water/Aqua/Eau").inci, "Aqua");
  eq(findIngredient("Aqua (Water, Eau)").inci, "Aqua");
});
await test("find: yanlış takma ad eşleşmeleri yok", () => {
  ok(findIngredient("Isobutylparaben").inci !== "Propylparaben", "isobutylparaben ≠ propylparaben");
  ok(findIngredient("Butylparaben").inci !== "Propylparaben", "butylparaben ≠ propylparaben");
  ok(findIngredient("Behenyl Alcohol").inci !== "Alcohol Denat.", "behenyl alcohol yağ alkolüdür");
  ok(findIngredient("Phenethyl Alcohol").inci !== "Alcohol Denat.");
  ok(findIngredient("PEG-10 Dimethicone").inci !== "PEG-100 Stearate");
  ok(findIngredient("Petrolatum").inci !== "Mineral Oil", "petrolatum ≠ mineral oil");
  ok(findIngredient("Geraniol").inci !== "Citronellol");
  ok(findIngredient("Coumarin").inci !== "Citronellol");
  ok(findIngredient("Butylated Hydroxyanisole").inci !== "BHT", "BHA ≠ BHT");
  ok(findIngredient("Quaternium-15").inci !== "DMDM Hydantoin");
  ok(findIngredient("Pentylene Glycol").inci !== "Butylene Glycol");
});
await test("find: bitkisel adlar hayvansal sayılmaz", () => {
  for (const n of [
    "Silybum Marianum (Milk Thistle) Fruit Extract",
    "Lonicera Japonica (Honeysuckle) Flower Extract",
    "Cocos Nucifera (Coconut) Milk",
    "Avena Sativa (Oat) Milk"
  ]) {
    ok(findIngredient(n).vegan !== false, `${n} vegan olmalı`);
  }
});
await test("find: hayvansal adlar vegan değil", () => {
  for (const n of ["Carmine", "CI 75470", "Cera Alba", "Beeswax", "Lanolin", "Hydrolyzed Collagen", "Snail Secretion Filtrate", "Mel", "Honey", "Shark Liver Oil", "Guanine", "Shellac", "Tallow"]) {
    eq(findIngredient(n).vegan, false, n);
  }
  ok(findIngredient("Synthetic Beeswax").vegan === true, "synthetic beeswax vegan");
});
await test("find: çiçek suları saf su değil", () => {
  ok(findIngredient("Rosa Damascena Flower Water").inci !== "Aqua");
  ok(findIngredient("Hamamelis Virginiana Water").inci !== "Aqua");
});

// ------------------------------------------------------------------
// analyzeIngredients değişmezleri
// ------------------------------------------------------------------
function checkInvariants(res, label) {
  ok(Number.isInteger(res.healthScore) && res.healthScore >= 0 && res.healthScore <= 100, `${label}: skor ${res.healthScore}`);
  const c = res.counts;
  eq(c.safe + c.moderate + c.high + c.unknown, c.total, `${label}: sayım toplamı`);
  eq(res.items.length, c.total, `${label}: item sayısı`);
  const p = res.percentages;
  const sum = p.safe + p.moderate + p.high + p.unknown;
  if (c.total) ok(sum === 100, `${label}: yüzde toplamı ${sum}`);
  else eq(sum, 0, `${label}: boş liste yüzde`);
  if (!c.unknown) eq(p.unknown, 0, `${label}: bilinmeyen yoksa %0`);
  for (const k of ["safe", "moderate", "high", "unknown"]) ok(p[k] >= 0 && p[k] <= 100, `${label}: ${k}`);
  ok(["vegan", "non-vegan", "check"].includes(res.veganStatus), `${label}: veganStatus`);
  ok(["healthy", "moderate", "risky", "unknown"].includes(res.healthStatus), `${label}: healthStatus`);
  ok(Array.isArray(res.safety.groups), `${label}: safety`);
  for (const it of res.items) {
    ok(typeof it.rawName === "string" && it.rawName, `${label}: rawName`);
    ok(["safe", "moderate", "high", "unknown"].includes(it.risk), `${label}: risk ${it.risk} (${it.rawName})`);
    ok([true, false, "conditional", "unknown"].includes(it.vegan), `${label}: vegan ${it.vegan} (${it.rawName})`);
    ok(Array.isArray(it.tags), `${label}: tags`);
  }
}

await test("analyze: boş", () => {
  const r = analyzeIngredients("");
  checkInvariants(r, "boş");
  eq(r.healthStatus, "unknown");
  eq(r.counts.total, 0);
});
await test("analyze: üç madde yüzde yuvarlama", () => {
  const r = analyzeIngredients("Aqua, Phenoxyethanol, Methylisothiazolinone");
  checkInvariants(r, "3'lü");
  eq(r.percentages.unknown, 0);
});
await test("analyze: vegan mantığı", () => {
  eq(analyzeIngredients("Aqua, Niacinamide, Squalane").veganStatus, "vegan");
  const nv = analyzeIngredients("Aqua, Carmine, Glycerin");
  eq(nv.veganStatus, "non-vegan");
  ok(nv.nonVeganIngredients.some((i) => i.inci === "Carmine"));
  const cond = analyzeIngredients("Aqua, Glycerin");
  eq(cond.veganStatus, "check");
  ok(cond.conditionalVeganIngredients.length >= 1);
});
await test("analyze: belirsiz kaynak → koşullu vegan", () => {
  const r = analyzeIngredients("Aqua, Glyceryl Stearate, Polysorbate 20");
  eq(r.veganStatus, "check");
  for (const it of r.items.filter((i) => i.flags && i.flags.ambiguous)) eq(it.vegan, "conditional", it.rawName);
});
await test("analyze: yasaklı → yüksek risk", () => {
  const r = analyzeIngredients("Aqua, Isobutylparaben, Butylphenyl Methylpropional, Hydroquinone");
  checkInvariants(r, "yasaklı");
  for (const it of r.items) if (it.flags && it.flags.banned) eq(it.risk, "high", it.rawName);
  ok(r.items.find((i) => i.rawName === "Isobutylparaben").flags.banned, "isobutylparaben yasaklı");
  ok(r.safety.groups.some((g) => g.key === "banned"));
  ok(r.highlights[0].type === "danger");
  ok(r.healthScore <= 74);
});
await test("analyze: güvenlik grupları ham etiket adını kullanır", () => {
  const r = analyzeIngredients("Aqua (Water), RETINOL, Limonene");
  const preg = r.safety.groups.find((g) => g.key === "pregAvoid");
  ok(preg && preg.names.includes("RETINOL"), JSON.stringify(preg));
  const al = r.safety.groups.find((g) => g.key === "allergen");
  ok(al && al.names.includes("Limonene"));
  eq(r.safety.pregnancySafe, false);
});
await test("analyze: dizi girdisi", () => {
  const r = analyzeIngredients(["Aqua", "Glycerin", "", null, "Niacinamide"]);
  checkInvariants(r, "dizi");
  eq(r.counts.total, 3);
});
await test("analyze: skor aralıkları uç durumlar", () => {
  const bad = analyzeIngredients(
    "Methylisothiazolinone, DMDM Hydantoin, Triclosan, Oxybenzone, Sodium Lauryl Sulfate, Isobutylparaben, Talc, Mineral Oil, BHT, Formaldehyde"
  );
  checkInvariants(bad, "kötü");
  ok(bad.healthScore <= 48);
  eq(bad.healthStatus, "risky");
  const good = analyzeIngredients("Aqua, Niacinamide, Panthenol, Squalane");
  checkInvariants(good, "iyi");
  eq(good.healthScore, 100);
  eq(good.healthStatus, "healthy");
});
await test("analyze: skinProfile şekli", () => {
  const r = analyzeIngredients("Aqua, Glycerin, Sodium Lauryl Sulfate, Alcohol Denat.");
  eq(r.skinProfile.types.length, 5);
  eq(r.skinProfile.types[0].level, "avoid");
});

// ------------------------------------------------------------------
// flags
// ------------------------------------------------------------------
await test("flags: retinol hamilelikte kaçının", () => {
  const f = getIngredientFlags("Retinol", findIngredient("Retinol"));
  eq(f.pregnancy.lvl, "avoid");
  ok(flagTags(f).some((t) => t.text.includes("kaçının")));
});
await test("flags: isobutylparaben yasaklı, kısıtlı değil", () => {
  const f = getIngredientFlags("Isobutylparaben", findIngredient("Isobutylparaben"));
  ok(f.banned, "banned");
  ok(!f.restricted, "restricted olmamalı");
});
await test("flags: propylparaben yasaklı DEĞİL, kısıtlı", () => {
  const f = getIngredientFlags("Propylparaben", findIngredient("Propylparaben"));
  ok(!f.banned, "yanlış pozitif yasaklı");
  ok(f.restricted, "restricted");
  const f2 = getIngredientFlags("Butylparaben", findIngredient("Butylparaben"));
  ok(!f2.banned && f2.restricted);
  const f3 = getIngredientFlags("Methylparaben", findIngredient("Methylparaben"));
  ok(!f3.banned && f3.restricted);
});
await test("flags: limonene alerjen", () => ok(getIngredientFlags("Limonene", findIngredient("Limonene")).allergen));
await test("flags: glycerin belirsiz kaynak", () => ok(getIngredientFlags("Glycerin", findIngredient("Glycerin")).ambiguous));
await test("flags: polyethylene çevre", () => eq(getIngredientFlags("Polyethylene", findIngredient("Polyethylene")).env.type, "microplastic"));
await test("flags: nano çinko oksit çevre deseni", () => {
  const f = getIngredientFlags("Zinc Oxide (Nano)", findIngredient("Zinc Oxide (Nano)"));
  ok(f && f.env, "nano zinc oxide env bayrağı");
});
await test("flags: su için bayrak yok", () => eq(getIngredientFlags("Aqua", findIngredient("Aqua")), null));
await test("flags: flagTags/summarizeFlags boş girdiler", () => {
  eq(flagTags(null), []);
  eq(summarizeFlags([]).groups, []);
  eq(summarizeFlags([]).pregnancySafe, true);
});
await test("flags: BHA (antioksidan) hamilelik salisilat bayrağı almaz", () => {
  const f = getIngredientFlags("BHA", findIngredient("BHA"));
  ok(!(f && f.pregnancy), JSON.stringify(f && f.pregnancy));
});

// ------------------------------------------------------------------
// search
// ------------------------------------------------------------------
await test("search: fold Türkçe", () => {
  eq(fold("KARMİN Parfüm ŞEKER ığdır"), "karmin parfum seker igdir");
  eq(fold("İSTANBUL"), "istanbul");
  eq(fold(null), "");
});
await test("search: Türkçe katlama eşleşme", () => {
  ok(compileQuery("karmın")("Karmin içerir"));
  ok(compileQuery("parfum")("Parfüm"));
  ok(compileQuery("ruj vegan")("Vegan mat RUJ"));
});
await test("search: yazım hatası toleransı", () => {
  ok(compileQuery("niasinamid")("Niacinamide serum"));
  ok(compileQuery("niacinamde")("Niacinamide 10%"));
  ok(compileQuery("fondoten")("Fondöten"));
  ok(!compileQuery("abc")("abd"), "kısa terimlerde tolerans yok");
});
await test("search: hariç tutma", () => {
  const m = compileQuery("ruj -karmin");
  ok(m("vegan ruj"));
  ok(!m("ruj karmin içerir"));
  ok(!compileQuery("-karmin")("Karmin"));
  ok(compileQuery("-karmin")("Mica"));
});
await test("search: boş sorgu", () => {
  ok(compileQuery("")("herhangi"));
  ok(compileQuery("   ")("x"));
  ok(compileQuery(null)("x"));
  ok(compileQuery("-")("x"));
});
await test("search: null metin", () => ok(compileQuery("x")(null) === false));

// ------------------------------------------------------------------
// Ürün verisi
// ------------------------------------------------------------------
await test("products: her ürün analiz edilir ve zorunlu alanlar var", () => {
  const ids = new Set();
  const brandIds = new Set(BRANDS_DATA.map((b) => b.id));
  for (const p of PRODUCTS_DATA) {
    for (const k of ["id", "brandId", "brand", "name", "category", "categoryLabel", "image", "description"]) {
      ok(typeof p[k] === "string" && p[k].trim(), `${p.id}: ${k}`);
    }
    ok(typeof p.crueltyFree === "boolean", `${p.id}: crueltyFree`);
    ok(Array.isArray(p.ingredients) && p.ingredients.length > 0, `${p.id}: ingredients`);
    ok(!ids.has(p.id), `yinelenen id ${p.id}`);
    ids.add(p.id);
    ok(brandIds.has(p.brandId), `${p.id}: bilinmeyen marka ${p.brandId}`);
    const r = analyzeIngredients(p.ingredients);
    checkInvariants(r, p.id);
  }
});
await test("ingredients DB: şema ve tekrarsız adlar", () => {
  const seen = new Map();
  for (const it of INGREDIENTS_DB) {
    ok(typeof it.inci === "string" && it.inci, "inci");
    ok(Array.isArray(it.aliases), `${it.inci}: aliases`);
    ok(["safe", "moderate", "high"].includes(it.risk), `${it.inci}: risk`);
    ok(Number.isFinite(it.riskScore) && it.riskScore >= 1 && it.riskScore <= 10, `${it.inci}: riskScore`);
    ok([true, false, "conditional"].includes(it.vegan), `${it.inci}: vegan`);
    ok(it.nameTr && it.summaryTr && it.category && Array.isArray(it.tags), `${it.inci}: metinler`);
    if (it.vegan === false) ok(it.animalSource, `${it.inci}: animalSource`);
    for (const n of [it.inci, ...it.aliases]) {
      const k = normalizeText(n);
      ok(!seen.has(k) || seen.get(k) === it.inci ? true : false, `yinelenen ad "${n}" (${seen.get(k)} / ${it.inci})`);
      if (seen.has(k) && seen.get(k) === it.inci && n !== it.inci) throw new Error(`aynı kayıtta yinelenen ad "${n}" (${it.inci})`);
      seen.set(k, it.inci);
    }
  }
});

// ------------------------------------------------------------------
// Bayrak veri dosyaları
// ------------------------------------------------------------------
function checkTable(name, table, extra) {
  ok(table && typeof table === "object", name);
  const keys = new Set();
  for (const [key, val] of Object.entries(table)) {
    ok(key === key.toLowerCase().trim() && key, `${name}: anahtar "${key}"`);
    ok(val && typeof val === "object", `${name}.${key}`);
    ok(typeof val.note === "string" && val.note.length > 3, `${name}.${key}: note`);
    if (val.aliases !== undefined) {
      ok(Array.isArray(val.aliases) && val.aliases.every((a) => typeof a === "string" && a.trim()), `${name}.${key}: aliases`);
    }
    if (val.pattern !== undefined) {
      ok(typeof val.pattern === "string", `${name}.${key}: pattern`);
      new RegExp(val.pattern, "i");
    }
    ok(!keys.has(key), `${name}: yinelenen ${key}`);
    keys.add(key);
    extra && extra(key, val);
  }
}
await test("data: PREGNANCY_FLAGS", () => checkTable("PREGNANCY", lifestyle.PREGNANCY_FLAGS, (k, v) => ok(["avoid", "caution"].includes(v.lvl), `${k}: lvl`)));
await test("data: AMBIGUOUS_SOURCE", () => checkTable("AMBIGUOUS", lifestyle.AMBIGUOUS_SOURCE));
await test("data: EU_ALLERGENS", () => checkTable("ALLERGENS", eu.EU_ALLERGENS));
await test("data: EU_BANNED", () => checkTable("BANNED", eu.EU_BANNED));
await test("data: EU_RESTRICTED", () => checkTable("RESTRICTED", eu.EU_RESTRICTED, (k, v) => ok(typeof v.max === "string" && v.max, `${k}: max`)));
await test("data: ENV_FLAGS", () => checkTable("ENV", env.ENV_FLAGS, (k, v) => ok(["microplastic", "reef", "persistent"].includes(v.type), `${k}: type ${v.type}`)));
await test("data: yasaklı ve kısıtlı listeleri çakışmaz", () => {
  for (const k of Object.keys(eu.EU_BANNED)) ok(!(k in eu.EU_RESTRICTED), `${k} hem yasaklı hem kısıtlı`);
});
await test("data: desenler kendi anahtarlarıyla çakışan yanlış yasak üretmez", () => {
  for (const k of Object.keys(eu.EU_RESTRICTED)) {
    const f = getIngredientFlags(k, null);
    ok(!(f && f.banned), `kısıtlı "${k}" yasaklı olarak işaretlendi (${f && f.banned && f.banned.key})`);
  }
});

// ------------------------------------------------------------------
// CosIng dizini
// ------------------------------------------------------------------
await test("cosing_index.json geçerli", async () => {
  const data = JSON.parse(readFileSync(J("js/data/cosing_index.json"), "utf8"));
  ok(data && typeof data === "object" && !Array.isArray(data));
  const entries = Object.entries(data);
  ok(entries.length > 1000, `kayıt sayısı ${entries.length}`);
  for (const [k, v] of entries) {
    ok(k === k.toLowerCase(), `anahtar küçük harf değil: ${k}`);
    ok(v && typeof v === "object", k);
    if (v.fn !== undefined) ok(Array.isArray(v.fn), `${k}: fn`);
    for (const f of ["cas", "ec", "com", "irr", "r"]) if (v[f] !== undefined) ok(typeof v[f] === "string", `${k}: ${f}`);
  }
  await loadCosingIndex();
  const m = getCosingMeta("Niacinamide");
  ok(m && m.cas === "98-92-0", JSON.stringify(m));
  ok(getCosingMeta("") === null && getCosingMeta(null) === null);
  ok(getCosingMeta("Aqua (Water)") && getCosingMeta("Aqua (Water)").cas === "7732-18-5", "parantez içi aday");
  ok(getCosingMeta("constructor") === null, "prototip anahtarı");
});

// ------------------------------------------------------------------
// beauty_catalog.json — 1000 gerçek INCI metni
// ------------------------------------------------------------------
await test("beauty_catalog: tüm ürünler hatasız analiz edilir", () => {
  const rows = JSON.parse(readFileSync(J("js/data/beauty_catalog.json"), "utf8"));
  ok(Array.isArray(rows) && rows.length >= 1000, `satır ${rows.length}`);
  let tokens = 0;
  let generic = 0;
  let unknown = 0;
  const t0 = performance.now();
  for (const row of rows) {
    const res = analyzeIngredients(row.i || "");
    checkInvariants(res, `katalog ${row.id}`);
    for (const it of res.items) {
      tokens++;
      if (!it.known) unknown++;
      else if (it.category === "Yardımcı Formül Bileşeni") generic++;
    }
  }
  const ms = performance.now() - t0;
  console.log(
    `  katalog: ${rows.length} ürün, ${tokens} bileşen, eşleşmeyen ${unknown} (%${((unknown / tokens) * 100).toFixed(2)}), ` +
      `yalnızca genel yedek sınıfa düşen ${generic} (%${((generic / tokens) * 100).toFixed(1)}), ${ms.toFixed(0)}ms`
  );
});

// ------------------------------------------------------------------
// Ağ modülleri (barcode.js / globalApi.js) — hata yönetimi
// ------------------------------------------------------------------
globalThis.window = globalThis;
globalThis.document = { createElement: () => ({ getContext: () => null }) };
const globalApi = await import(J("js/globalApi.js"));
const barcode = await import(J("js/barcode.js"));

function withFetch(impl, fn) {
  const prev = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    const u = String(url);
    if (!/^https?:/.test(u)) return prev(url, opts);
    return impl(u, opts);
  };
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      globalThis.fetch = prev;
    });
}
const turkishish = (msg) => /[çğıöşüÇĞİÖŞÜ]|veritaban|bağlant|barkod|ulaşıl/i.test(msg);

let unhandled = 0;
process.on("unhandledRejection", () => unhandled++);

await test("barcode: geçersiz barkod", async () => {
  let err;
  try {
    await barcode.fetchProductByBarcode("12");
  } catch (e) {
    err = e;
  }
  ok(err && turkishish(err.message), err && err.message);
});
await test("barcode: yerel barkod ağ olmadan", async () => {
  await withFetch(
    async () => {
      throw new TypeError("Failed to fetch");
    },
    async () => {
      const p = await barcode.fetchProductByBarcode("8690001001011");
      eq(p.source, "local");
    }
  );
});
await test("barcode: ağ hatası → Türkçe hata", async () => {
  await withFetch(
    async () => {
      throw new TypeError("Failed to fetch");
    },
    async () => {
      let err;
      try {
        await barcode.fetchProductByBarcode("0000000000017");
      } catch (e) {
        err = e;
      }
      ok(err && turkishish(err.message), err && err.message);
    }
  );
});
await test("barcode: bozuk JSON / HTTP 500 → Türkçe hata", async () => {
  await withFetch(
    async (u) => (u.includes("openbeauty") ? new Response("<html>", { status: 200 }) : new Response("err", { status: 500 })),
    async () => {
      let err;
      try {
        await barcode.fetchProductByBarcode("0000000000024");
      } catch (e) {
        err = e;
      }
      ok(err && turkishish(err.message), err && err.message);
    }
  );
});
await test("barcode: asılı kalan istek zaman aşımına uğrar", async () => {
  // Abort sinyaline uyan ama asla yanıt vermeyen fetch
  const hang = (u, opts) =>
    new Promise((_, rej) => {
      opts?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
    });
  await withFetch(hang, async () => {
    const t0 = Date.now();
    let err;
    try {
      await barcode.fetchProductByBarcode("0000000000031", { timeoutMs: 50 });
    } catch (e) {
      err = e;
    }
    ok(err && turkishish(err.message), err && err.message);
    ok(Date.now() - t0 < 5000, "zaman aşımı çalışmadı");
  });
});
await test("globalApi: ağ hatası → Türkçe hata veya yerel sonuç", async () => {
  await withFetch(
    async () => {
      throw new TypeError("Failed to fetch");
    },
    async () => {
      let err, res;
      try {
        res = await globalApi.searchGlobalProducts({ query: "zzqqxx-yok", page: 1 });
      } catch (e) {
        err = e;
      }
      ok((err && turkishish(err.message)) || (res && Array.isArray(res.products)), err && err.message);
      // Yerel eşleşme varsa sonuçlar yine döner
      const r2 = await globalApi.searchGlobalProducts({ query: "ruj", page: 1 });
      ok(Array.isArray(r2.products) && r2.products.length > 0, "yerel sonuç dönmeli");
    }
  );
});
await test("globalApi: bozuk JSON → Türkçe hata", async () => {
  await withFetch(
    async () => new Response("not json", { status: 200 }),
    async () => {
      let err;
      try {
        await globalApi.searchGlobalProducts({ query: "qqzzyy-none", page: 2 });
      } catch (e) {
        err = e;
      }
      ok(err && turkishish(err.message), err && err.message);
    }
  );
});
await test("globalApi: HTTP 503 → Türkçe hata", async () => {
  await withFetch(
    async () => new Response("down", { status: 503 }),
    async () => {
      let err;
      try {
        await globalApi.searchGlobalProducts({ query: "qqzzyy-none2", page: 3 });
      } catch (e) {
        err = e;
      }
      ok(err && turkishish(err.message) && /503/.test(err.message), err && err.message);
    }
  );
});
await test("globalApi: null parametreler çökmez", async () => {
  await withFetch(
    async () => new Response(JSON.stringify({ count: 0, products: [] }), { status: 200 }),
    async () => {
      const r = await globalApi.searchGlobalProducts({ query: null, brand: null, categoryTerm: null, page: 1 });
      ok(Array.isArray(r.products));
    }
  );
  eq(globalApi.translateTurkishQuery("kırmızı ruj"), "kırmızı lipstick");
  eq(globalApi.translateTurkishQuery(null), "");
});
await test("işlenmemiş promise reddi yok", async () => {
  await new Promise((r) => setTimeout(r, 50));
  eq(unhandled, 0, "unhandledRejection");
});

// ------------------------------------------------------------------
console.log(`\n${passed} geçti, ${failures.length} başarısız`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(failures.length ? 1 : 0);
