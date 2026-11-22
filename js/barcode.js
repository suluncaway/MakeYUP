/**
 * MakeYUP — Gelişmiş Çoklu-Veritabanı Barkod & Profesyonel Kamera Odaklama Modülü
 *
 * 1) Çoklu Veritabanı Sorgusu (Tek veritabanına bağlı kalmaz):
 *    MakeYUP Katalog -> Open Beauty Facts -> Open Products Facts -> Open Food Facts -> UPCitemdb
 * 2) Gelişmiş Kamera Barkod Okuma:
 *    - Sürekli Otomatik Odaklama (focusMode: continuous) + Dokunarak Odaklama (Tap-to-Focus)
 *    - Akıllı Yakınlaştırma (Zoom 1x-3x, varsayılan 1.5x ile küçük kozmetik barkodlarında net odak)
 *    - Flaş (Torch) ve Kamera Değiştirme (Arka Ana / Makro / Ön)
 *    - Merkez Kırpma (ROI) + Kontrast Artırımlı Canvas tarama (parlak/yuvarlak ruj-maskara tüpleri için)
 */

import { PRODUCTS_DATA } from "./data/products.js";
import { loadHfCatalog, fetchJsonWithTimeout, NETWORK_TIMEOUT_MS } from "./globalApi.js";

export const LOCAL_BARCODES = {
  "8690001001011": "rare-soft-pinch-blush",
  "8690001001028": "flormar-silk-matte-lipstick",
  "8690001001035": "mac-ruby-matte-lipstick",
  "8690001001042": "nyx-fat-oil-lip"
};

export const SAMPLE_BARCODES = [
  {
    code: "4250947516027",
    label: "Essence Lash Princess (Canlı API)",
    type: "live"
  },
  {
    code: "3600531469498",
    label: "Maybelline SuperStay Ruj (Canlı API)",
    type: "live"
  },
  {
    code: "8690001001028",
    label: "Flormar Mat Ruj (Örnek)",
    type: "local"
  },
  {
    code: "8690001001011",
    label: "Rare Beauty Allık (Örnek)",
    type: "local"
  }
];

export function cleanBarcode(raw) {
  return String(raw || "").replace(/[^0-9]/g, "").trim();
}

function safeProgress(onProgress, msg) {
  try {
    onProgress?.(msg);
  } catch {
    // ilerleme geri çağrısındaki hata sorguyu bozmasın
  }
}

/**
 * Birden fazla açık kozmetik ve ürün veritabanında sırayla barkod sorgular.
 */
export async function fetchProductByBarcode(rawCode, { onProgress, timeoutMs = NETWORK_TIMEOUT_MS } = {}) {
  const code = cleanBarcode(rawCode);
  if (code.length < 6) {
    throw new Error("Geçerli bir barkod numarası girin (en az 6 rakam, örn: EAN-13).");
  }

  // 1. Yerel katalog
  const localId = LOCAL_BARCODES[code];
  if (localId) {
    const prod = PRODUCTS_DATA.find((p) => p.id === localId);
    if (prod && Array.isArray(prod.ingredients)) {
      return {
        source: "local",
        sourceLabel: "MakeYUP Katalog",
        barcode: code,
        name: prod.name,
        brand: prod.brand,
        categoryLabel: prod.categoryLabel,
        image: prod.image,
        description: prod.description,
        crueltyFree: prod.crueltyFree,
        ingredientsText: prod.ingredients.join(", "),
        ingredientsList: prod.ingredients,
        apiLabels: []
      };
    }
  }

  // 1.5. Hugging Face (744+ GTIN barkodlu tam INCI arşivi) kontrolü
  try {
    const hfRows = (await loadHfCatalog()) || [];
    const trimmedCode = code.replace(/^0+/, "");
    const hfHit = hfRows.find(
      (r) => Array.isArray(r.g) && r.g.some((g) => String(g).replace(/^0+/, "") === trimmedCode)
    );
    if (hfHit) {
      const image = hfHit.img
        ? `https://huggingface.co/datasets/thebeautyapi/beautyproducts/resolve/main/images/${encodeURIComponent(hfHit.img)}`
        : "assets/images/foundation.jpg";
      return {
        source: "openbeautyfacts",
        sourceLabel: "Doğrulanmış INCI Arşivi",
        barcode: code,
        name: hfHit.s ? `${hfHit.n} (${hfHit.s})` : hfHit.n || `Barkodlu Ürün (${code})`,
        brand: hfHit.b || "Bilinmeyen Marka",
        categoryLabel: hfHit.c || "Kozmetik & Bakım",
        image,
        description: "Barkod ile doğrulanmış tam INCI arşivinden bulundu ve analiz edildi.",
        crueltyFree: false,
        ingredientsText: hfHit.i || "",
        ingredientsList: null,
        apiLabels: []
      };
    }
  } catch {
    // devam et
  }

  // 2. Çoklu Open Facts veritabanları (Open Beauty Facts -> Open Products Facts -> Open Food Facts)
  const fields =
    "product_name,product_name_tr,product_name_en,brands,image_front_url,image_url,ingredients_text,ingredients_text_tr,ingredients_text_en,ingredients,labels_tags,categories";

  const openFactsSources = [
    {
      url: `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`,
      label: "Kozmetik Veritabanı (Canlı)"
    },
    {
      url: `https://world.openproductsfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`,
      label: "Genel Ürün Veritabanı (Canlı)"
    },
    {
      url: `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`,
      label: "Doğal Bakım Kaydı (Canlı)"
    }
  ];

  // Çevrimdışıysa canlı kaynakları hiç denemeden anlaşılır bir hata ver
  if (typeof navigator !== "undefined" && navigator && navigator.onLine === false) {
    throw new Error(
      `İnternet bağlantısı yok. Barkod (${code}) yerel katalogda bulunamadı; bağlantı gelince tekrar deneyin veya INCI listesini "İçerik Analizörü" sekmesine yapıştırın.`
    );
  }

  let lastError = null;
  for (const src of openFactsSources) {
    safeProgress(onProgress, `${src.label.replace(" (Canlı)", "")} sorgulanıyor...`);
    try {
      const json = await fetchJsonWithTimeout(src.url, { timeoutMs, label: src.label.replace(" (Canlı)", "") });
      {
        if (json && json.status === 1 && json.product && typeof json.product === "object") {
          const p = json.product;
          const name =
            p.product_name_tr || p.product_name || p.product_name_en || `Barkodlu Ürün (${code})`;
          const brand = (typeof p.brands === "string" && p.brands.split(",")[0].trim()) || "Bilinmeyen Marka";
          const image = p.image_front_url || p.image_url || "assets/images/foundation.jpg";

          let ingredientsText = String(
            p.ingredients_text_en || p.ingredients_text || p.ingredients_text_tr || ""
          );

          if (!ingredientsText && Array.isArray(p.ingredients) && p.ingredients.length > 0) {
            ingredientsText = p.ingredients
              .map((i) => i.text || i.id?.replace(/^en:/, ""))
              .filter(Boolean)
              .join(", ");
          }

          const labels = Array.isArray(p.labels_tags) ? p.labels_tags.filter((l) => typeof l === "string") : [];
          const isCrueltyFree = labels.some(
            (l) => l.includes("cruelty-free") || l.includes("not-tested-on-animals")
          );

          return {
            source: "openbeautyfacts",
            sourceLabel: src.label,
            barcode: code,
            name,
            brand,
            categoryLabel:
              (typeof p.categories === "string" && p.categories.split(",")[0].trim()) || "Kozmetik Ürünü",
            image,
            description: ingredientsText
              ? `${src.label} veritabanından barkod ile canlı çekildi ve MakeYUP motoruyla analiz edildi.`
              : `Ürün ${src.label} içinde bulundu ancak INCI içerik metni henüz eklenmemiş.`,
            crueltyFree: isCrueltyFree,
            ingredientsText: ingredientsText.trim(),
            ingredientsList: null,
            apiLabels: labels
          };
        }
      }
    } catch (err) {
      lastError = err;
      // Sonraki veritabanına geç
    }
  }

  // 3. Yedek Küresel Barkod Kaynağı: UPCitemdb (ürün adı/marka/fotoğraf için)
  safeProgress(onProgress, "UPCitemdb yedek veritabanı sorgulanıyor...");
  try {
    const upcJson = await fetchJsonWithTimeout(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`,
      { timeoutMs: Math.min(timeoutMs, 5000), label: "UPCitemdb" }
    );
    {
      const item = upcJson && Array.isArray(upcJson.items) ? upcJson.items[0] : null;
      if (item && item.title) {
        return {
          source: "openbeautyfacts",
          sourceLabel: "UPCitemdb (Yedek API)",
          barcode: code,
          name: item.title,
          brand: item.brand || "Bilinmeyen Marka",
          categoryLabel: item.category || "Kozmetik / Kişisel Bakım",
          image: (Array.isArray(item.images) && item.images[0]) || "assets/images/foundation.jpg",
          description:
            "Ürün küresel UPCitemdb kaydında bulundu. Bu kaynak INCI metni sunmadığından ürün arkasındaki içerik listesini İçerik Analizörü'ne yapıştırabilirsiniz.",
          crueltyFree: false,
          ingredientsText: "",
          ingredientsList: null,
          apiLabels: []
        };
      }
    }
  } catch (err) {
    lastError = lastError || err;
    // CORS veya limit durumunda sessizce geç
  }

  // Tüm kaynaklar ağ/zaman aşımı hatası verdiyse "bulunamadı" yerine bağlantı sorununu söyle
  if (lastError && ["offline", "timeout", "network"].includes(lastError.code)) {
    throw new Error(
      `Barkod (${code}) sorgulanamadı: ${lastError.message} Ürün arkasındaki INCI listesini "İçerik Analizörü" sekmesine yapıştırarak çevrimdışı analiz edebilirsiniz.`
    );
  }
  throw new Error(
    `Barkod (${code}) bağlı 4 farklı küresel veritabanında bulunamadı. Ürün arkasındaki INCI listesini "İçerik Analizörü" sekmesine yapıştırarak anında analiz edebilirsiniz.`
  );
}

// ============================================================
// Profesyonel Kamera Odaklama & Kontrastlı Barkod Tarayıcı
// ============================================================
export class BarcodeScannerController {
  constructor(videoEl, { onDetected, onStatus, onError, onCapabilities }) {
    this.videoEl = videoEl;
    this.onDetected = onDetected;
    this.onStatus = onStatus;
    this.onError = onError;
    this.onCapabilities = onCapabilities;

    this.stream = null;
    this.videoTrack = null;
    this.isRunning = false;
    this.scanTimer = null;
    this.lastCode = null;
    this.lastTime = 0;

    this.devices = [];
    this.currentDeviceIndex = -1;
    this.torchEnabled = false;
    this.currentZoom = 1;

    this.detector = null;
    this.zxingReader = null;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  async _loadDevices() {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter((d) => d.kind === "videoinput");
      // Arka kameraları (back / rear / environment) öne al, ultra-wide yerine ana kamerayı tercih et
      cams.sort((a, b) => {
        const al = (a.label || "").toLowerCase();
        const bl = (b.label || "").toLowerCase();
        const aRear = /back|rear|environment/.test(al) ? 1 : 0;
        const bRear = /back|rear|environment/.test(bl) ? 1 : 0;
        if (bRear !== aRear) return bRear - aRear;
        const aUltra = /ultra|wide|0\.5/.test(al) ? 1 : 0;
        const bUltra = /ultra|wide|0\.5/.test(bl) ? 1 : 0;
        return aUltra - bUltra;
      });
      this.devices = cams;
    } catch {
      this.devices = [];
    }
  }

  async start(deviceId = null) {
    if (this.isRunning) {
      this.stop();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onError?.(
        "Tarayıcınız kamera erişimini desteklemiyor veya sayfa güvenli (HTTPS / localhost) bağlantıda değil."
      );
      return;
    }

    this.isRunning = true;
    this.onStatus?.("Kamera ve otomatik odaklama başlatılıyor...");

    try {
      const videoConstraints = deviceId
        ? {
            deviceId: { exact: deviceId },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          }
        : {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          };

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      this.videoEl.srcObject = this.stream;
      await this.videoEl.play();

      this.videoTrack = this.stream.getVideoTracks()[0] || null;
      await this._loadDevices();

      if (this.videoTrack) {
        const activeId = this.videoTrack.getSettings?.().deviceId;
        const idx = this.devices.findIndex((d) => d.deviceId === activeId);
        if (idx >= 0) this.currentDeviceIndex = idx;
      }

      await this._configureFocusAndCapabilities();
      await this._initBarcodeEngine();

      this.onStatus?.("Kamera aktif — Barkodu 15–20 cm mesafeden yatay tutun (odak için ekrana dokunun)");
      this._startScanLoop();
    } catch (err) {
      this.stop();
      this.onError?.(
        err?.name === "NotAllowedError"
          ? "Kamera izni reddedildi. Tarayıcı adres çubuğundan izin verebilir veya 'Fotoğraftan Tara' seçeneğini kullanabilirsiniz."
          : `Kamera başlatılamadı: ${err?.message || "Bilinmeyen hata"}`
      );
    }
  }

  async _configureFocusAndCapabilities() {
    if (!this.videoTrack || typeof this.videoTrack.getCapabilities !== "function") {
      this.onCapabilities?.({ canZoom: false, canTorch: false, canSwitch: this.devices.length > 1, canFocus: false });
      return;
    }

    const caps = this.videoTrack.getCapabilities();
    const advanced = [];

    // 1. Sürekli otomatik odaklama (continuous autofocus)
    const canFocus = Array.isArray(caps.focusMode) && caps.focusMode.length > 0;
    if (canFocus && caps.focusMode.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }

    // 2. Hafif zoom (1.5x) küçük ruj/maskara barkodlarında kamerayı yaklaştırmadan net odak sağlar
    let canZoom = false;
    let zoomMin = 1;
    let zoomMax = 1;
    let zoomStep = 0.1;
    if (caps.zoom && caps.zoom.max > caps.zoom.min) {
      canZoom = true;
      zoomMin = caps.zoom.min;
      zoomMax = Math.min(caps.zoom.max, 4);
      zoomStep = caps.zoom.step || 0.1;
      const idealZoom = Math.min(Math.max(1.5, zoomMin), zoomMax);
      this.currentZoom = idealZoom;
      advanced.push({ zoom: idealZoom });
    }

    if (advanced.length > 0) {
      try {
        await this.videoTrack.applyConstraints({ advanced });
      } catch {
        // Bazı cihazlar birleşik constraint'i reddedebilir; tek tek dene
        for (const c of advanced) {
          try {
            await this.videoTrack.applyConstraints({ advanced: [c] });
          } catch {
            // yoksay
          }
        }
      }
    }

    this.onCapabilities?.({
      canZoom,
      zoomMin,
      zoomMax,
      zoomStep,
      zoomValue: this.currentZoom,
      canTorch: Boolean(caps.torch),
      canSwitch: this.devices.length > 1,
      canFocus
    });
  }

  async setZoom(value) {
    if (!this.videoTrack) return;
    this.currentZoom = Number(value);
    try {
      await this.videoTrack.applyConstraints({ advanced: [{ zoom: this.currentZoom }] });
    } catch {
      // yoksay
    }
  }

  async toggleTorch() {
    if (!this.videoTrack) return false;
    this.torchEnabled = !this.torchEnabled;
    try {
      await this.videoTrack.applyConstraints({ advanced: [{ torch: this.torchEnabled }] });
      return this.torchEnabled;
    } catch {
      this.torchEnabled = false;
      return false;
    }
  }

  async triggerRefocus() {
    if (!this.videoTrack || typeof this.videoTrack.getCapabilities !== "function") return;
    const caps = this.videoTrack.getCapabilities();
    if (!Array.isArray(caps.focusMode)) return;
    try {
      if (caps.focusMode.includes("single-shot")) {
        await this.videoTrack.applyConstraints({ advanced: [{ focusMode: "single-shot" }] });
      }
      if (caps.focusMode.includes("continuous")) {
        setTimeout(() => {
          this.videoTrack?.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(() => {});
        }, 350);
      }
    } catch {
      // yoksay
    }
  }

  async switchCamera() {
    if (this.devices.length <= 1) return;
    this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.devices.length;
    const nextDevice = this.devices[this.currentDeviceIndex];
    if (nextDevice?.deviceId) {
      await this.start(nextDevice.deviceId);
    }
  }

  async _initBarcodeEngine() {
    if ("BarcodeDetector" in window) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const wanted = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"].filter((f) =>
          supported.includes(f)
        );
        this.detector = new window.BarcodeDetector({
          formats: wanted.length ? wanted : supported
        });
        return;
      } catch {
        this.detector = null;
      }
    }

    // Native BarcodeDetector yoksa ZXing yükle
    const { BrowserMultiFormatReader } = await import(
      "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm"
    );
    this.zxingReader = new BrowserMultiFormatReader();
  }

  _startScanLoop() {
    const tick = async () => {
      if (!this.isRunning) return;
      try {
        if (this.videoEl.readyState >= 2 && this.videoEl.videoWidth > 0) {
          const code = await this._detectFrame();
          if (code) {
            this._handleHit(code);
            return;
          }
        }
      } catch {
        // tek kare hatalarını yoksay
      }
      if (this.isRunning) {
        this.scanTimer = setTimeout(tick, 180);
      }
    };
    this.scanTimer = setTimeout(tick, 220);
  }

  async _detectFrame() {
    const vw = this.videoEl.videoWidth;
    const vh = this.videoEl.videoHeight;

    // 1. Önce merkez barkod şeridini (ROI) kırpıp kontrastını artırarak tara
    const cropW = Math.round(vw * 0.8);
    const cropH = Math.round(vh * 0.45);
    const cropX = Math.round((vw - cropW) / 2);
    const cropY = Math.round((vh - cropH) / 2);

    this.canvas.width = cropW;
    this.canvas.height = cropH;
    this.ctx.filter = "contrast(1.35) grayscale(1)";
    this.ctx.drawImage(this.videoEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    this.ctx.filter = "none";

    if (this.detector) {
      // Önce yüksek kontrastlı kırpılmış merkez alan
      const roiHits = await this.detector.detect(this.canvas);
      if (roiHits && roiHits.length > 0) return roiHits[0].rawValue;

      // Bulunamazsa tam video karesi
      const fullHits = await this.detector.detect(this.videoEl);
      if (fullHits && fullHits.length > 0) return fullHits[0].rawValue;
      return null;
    }

    if (this.zxingReader) {
      try {
        const res = this.zxingReader.decodeFromCanvas(this.canvas);
        if (res) return res.getText();
      } catch {
        // barkod bu karede yok
      }
    }

    return null;
  }

  _handleHit(rawValue) {
    const code = cleanBarcode(rawValue);
    const now = Date.now();
    if (!code || code.length < 6 || (code === this.lastCode && now - this.lastTime < 3000)) return;
    this.lastCode = code;
    this.lastTime = now;
    try {
      navigator.vibrate?.(80);
    } catch {
      // yoksay
    }
    this.stop();
    this.onDetected?.(code);
  }

  stop() {
    this.isRunning = false;
    this.torchEnabled = false;
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.videoTrack = null;
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
  }
}

/**
 * Kullanıcının yüklediği bir fotoğraftan barkod okur.
 */
export async function scanBarcodeFromImageFile(file) {
  let imageUrl = null;
  try {
    imageUrl = URL.createObjectURL(file);
    if ("BarcodeDetector" in window) {
      const bitmap = await createImageBitmap(file);
      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"]
      });
      const results = await detector.detect(bitmap);
      bitmap.close?.();
      if (results && results.length > 0) {
        return cleanBarcode(results[0].rawValue);
      }
    }

    const { BrowserMultiFormatReader } = await import(
      "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm"
    );
    const reader = new BrowserMultiFormatReader();
    const res = await reader.decodeFromImageUrl(imageUrl);
    if (res) {
      return cleanBarcode(res.getText());
    }
    throw new Error("Fotoğrafta okunabilir bir barkod bulunamadı.");
  } catch {
    throw new Error(
      "Fotoğraftaki barkod okunamadı. Daha net ve aydınlık bir barkod fotoğrafı deneyebilir veya numarayı elle girebilirsiniz."
    );
  } finally {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }
}
