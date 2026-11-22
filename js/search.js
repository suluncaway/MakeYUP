/**
 * MakeYUP — Akıllı Arama Yardımcıları
 * - Türkçe karakter ve aksan duyarsız ("karmın" = "karmin", "parfum" = "parfüm")
 * - Çok kelimeli aramada kelime sırası önemsiz ("ruj vegan" = "vegan ruj")
 * - Küçük yazım hatalarını tolere eder ("niasinamid" ≈ "niacinamide")
 * - "-kelime" ile hariç tutma ("ruj -karmin")
 */

export function fold(str) {
  return String(str || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%+\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** En fazla 1 harf farkı (ekleme / silme / değiştirme / yer değiştirme). */
function withinOneEdit(a, b) {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

function termMatches(term, text, words) {
  if (text.includes(term)) return true;
  if (term.length < 5) return false;
  // Yazım hatası toleransı: kelimenin başıyla 1 harf farkla eşleşme
  return words.some(
    (w) =>
      withinOneEdit(term, w) ||
      (w.length > term.length && withinOneEdit(term, w.slice(0, term.length)))
  );
}

/**
 * Bir arama sorgusunu bir kez derler; dönen fonksiyon metne uyup uymadığını söyler.
 * Boş sorgu her şeyle eşleşir.
 */
export function compileQuery(query) {
  const tokens = fold(query).split(" ").filter(Boolean);
  const include = [];
  const exclude = [];
  for (const t of tokens) {
    if (t.startsWith("-") && t.length > 1) exclude.push(t.slice(1));
    else if (t !== "-") include.push(t.replace(/^-+/, ""));
  }
  if (!include.length && !exclude.length) return () => true;

  return (rawText) => {
    const text = fold(rawText);
    const words = text.split(" ");
    for (const t of exclude) if (text.includes(t)) return false;
    return include.every((t) => termMatches(t, text, words));
  };
}
