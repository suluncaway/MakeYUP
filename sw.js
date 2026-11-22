/*
 * MakeYUP — Service Worker (bilinçli olarak muhafazakâr).
 *
 * Strateji:
 *  - Yalnızca aynı kökenli (same-origin) GET istekleri ele alınır. Çapraz kökenli API'ler
 *    (Open Beauty Facts, makeup-api, Google Fonts vb.) HİÇ yakalanmaz ve önbelleğe alınmaz.
 *  - HTML sayfaları, JS modülleri ve JSON veri: AĞ ÖNCELİKLİ (network-first), çevrimdışıysa önbellek.
 *    (ES modülleri sürümsüz URL'lerle içe aktarıldığı için yeni main.js + eski analyzer.js
 *     karışımını önlemek amacıyla kod asla önbellekten öncelikli sunulmaz.)
 *  - Görseller, ikonlar, fontlar: ÖNBELLEK ÖNCELİKLİ (cache-first).
 *  - CSS ve manifest: önbellekten hemen sun + arka planda tazele (stale-while-revalidate).
 *  - Sürüm değiştiğinde eski "makeyup-" önbellekleri silinir.
 *
 * Yeni sürüm yayınlarken CACHE_VERSION'ı değiştirin.
 * ACİL DURUM: SW'yi tamamen kaldırmak için KILL_SWITCH = true yapıp yayınlayın; tüm
 * önbellekler silinir ve SW kendini kayıttan çıkarır.
 */
const CACHE_VERSION = "2026-11-22-2";
const CACHE = `makeyup-${CACHE_VERSION}`;
const KILL_SWITCH = false;

const CACHE_FIRST_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i;
const SWR_EXT = /\.(?:css|webmanifest)$/i;
const NETWORK_FIRST_EXT = /\.(?:js|mjs|json|html?)$/i;
const MAX_CACHEABLE_BYTES = 8 * 1024 * 1024;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (!KILL_SWITCH) {
        // Kabuk ön belleği "en iyi çaba" ile: bir dosya eksikse kurulum BAŞARISIZ OLMAZ.
        const cache = await caches.open(CACHE);
        await Promise.all(["./", "./manifest.webmanifest"].map((u) => cache.add(u).catch(() => {})));
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("makeyup-") && (KILL_SWITCH || k !== CACHE)).map((k) => caches.delete(k))
      );
      if (KILL_SWITCH) {
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((c) => c.navigate(c.url).catch(() => {}));
        return;
      }
      await self.clients.claim();
    })()
  );
});

function isCacheable(response) {
  if (!response || !response.ok || response.type !== "basic") return false;
  if (response.status !== 200) return false; // 206 kısmi yanıtları saklama
  const len = Number(response.headers.get("content-length") || 0);
  return !(len && len > MAX_CACHEABLE_BYTES);
}

async function put(request, response) {
  if (!isCacheable(response)) return;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response);
  } catch {
    /* kota dolu vb. → yoksay */
  }
}

async function networkFirst(request, isNavigation, event) {
  try {
    const response = await fetch(request);
    event.waitUntil(put(request, response.clone()));
    return response;
  } catch (err) {
    const cached = await caches.match(request, { ignoreSearch: false });
    if (cached) return cached;
    if (isNavigation) {
      const shell = (await caches.match("./")) || (await caches.match("./index.html"));
      if (shell) return shell;
    }
    throw err;
  }
}

async function cacheFirst(request, event) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  event.waitUntil(put(request, response.clone()));
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cached = await caches.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      await put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  const fresh = await refresh;
  return fresh || Response.error();
}

self.addEventListener("fetch", (event) => {
  if (KILL_SWITCH) return;
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return; // çapraz köken: tarayıcıya bırak
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
  if (url.pathname.endsWith("/sw.js")) return;
  if (request.headers.has("range")) return;

  const isNavigation = request.mode === "navigate";
  const path = url.pathname;

  if (isNavigation || path.endsWith("/") || NETWORK_FIRST_EXT.test(path)) {
    event.respondWith(networkFirst(request, isNavigation, event));
  } else if (CACHE_FIRST_EXT.test(path)) {
    event.respondWith(cacheFirst(request, event));
  } else if (SWR_EXT.test(path)) {
    event.respondWith(staleWhileRevalidate(request, event));
  }
  // Diğer her şey: SW karışmaz, normal ağ isteği.
});
