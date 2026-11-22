/**
 * MakeYUP — Paylaşım yardımcıları (UI'dan bağımsız).
 *
 *   await shareProduct({ title, text, url })
 *     → "shared" | "copied" | "cancelled" | "failed"
 *     Web Share API varsa yerel paylaşım sayfasını açar; yoksa (veya hata verirse)
 *     "metin + url"yi panoya kopyalar (Clipboard API → execCommand yedeği).
 *     Mutlaka kullanıcı tıklaması içinde çağırın (tarayıcı izni gerektirir).
 *
 *   reportUrl("#/urun/rare-soft-pinch-blush")
 *     → "https://suluncaway.github.io/MakeYUP/#/urun/rare-soft-pinch-blush"
 *
 *   productPageUrl("rare-soft-pinch-blush")
 *     → "https://suluncaway.github.io/MakeYUP/urun/rare-soft-pinch-blush.html"
 *     (statik SEO sayfası; WhatsApp/Twitter önizlemesi (OG etiketleri) için paylaşımda bunu tercih edin)
 */

export const SITE_URL = "https://suluncaway.github.io/MakeYUP/";

/** Uygulamanın kök URL'si (sorgu/hash olmadan, "index.html" atılmış, "/" ile biten). */
export function appBaseUrl(loc = globalThis.location) {
  try {
    if (!loc || !/^https?:$/.test(loc.protocol || "")) return SITE_URL;
    let path = String(loc.pathname || "/");
    path = path.replace(/[^/]*\.html?$/i, ""); // /MakeYUP/index.html → /MakeYUP/
    // Statik ürün sayfasından çağrılırsa (/MakeYUP/urun/x.html) bir üst dizine çık
    path = path.replace(/\/urun\/?$/i, "/");
    if (!path.endsWith("/")) path += "/";
    return `${loc.origin}${path}`;
  } catch {
    return SITE_URL;
  }
}

/** Hash rotasından mutlak URL üretir: "#/urun/id", "/urun/id" veya "urun/id" kabul edilir. */
export function reportUrl(route = "", loc = globalThis.location) {
  const r = String(route || "").trim().replace(/^#?\/?/, "");
  return appBaseUrl(loc) + (r ? `#/${r}` : "");
}

/** Statik (önizlemeli) ürün sayfası URL'si. */
export function productPageUrl(id, loc = globalThis.location) {
  return `${appBaseUrl(loc)}urun/${encodeURIComponent(String(id))}.html`;
}

async function copyText(str) {
  const nav = globalThis.navigator;
  try {
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
      await nav.clipboard.writeText(str);
      return true;
    }
  } catch {
    /* izin yok / güvenli bağlam değil → yedeğe düş */
  }
  try {
    const doc = globalThis.document;
    if (!doc || !doc.body) return false;
    const ta = doc.createElement("textarea");
    ta.value = str;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
    doc.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = doc.execCommand("copy");
    } finally {
      doc.body.removeChild(ta);
    }
    return !!ok;
  } catch {
    return false;
  }
}

export async function shareProduct({ title = "MakeYUP", text = "", url } = {}) {
  const link = url || reportUrl("");
  const nav = globalThis.navigator;
  const data = { title, text, url: link };

  if (nav && typeof nav.share === "function") {
    let can = true;
    try {
      if (typeof nav.canShare === "function") can = nav.canShare(data);
    } catch {
      can = true;
    }
    if (can) {
      try {
        await nav.share(data);
        return "shared";
      } catch (err) {
        if (err && err.name === "AbortError") return "cancelled";
        // NotAllowedError vb. → panoya kopyalamayı dene
      }
    }
  }

  const payload = [text, link].filter(Boolean).join(" ");
  return (await copyText(payload)) ? "copied" : "failed";
}
