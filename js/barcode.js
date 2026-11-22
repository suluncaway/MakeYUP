/**
 * MakeYUP — Barkod Tarama & Open Beauty Facts API Modülü
 * 1) Native BarcodeDetector (Chrome/Edge/Android) + ZXing ES Module fallback (Firefox/Safari)
 * 2) Fotoğraftan barkod okuma desteği
 * 3) Canlı Open Beauty Facts API v2 (https://world.openbeautyfacts.org) entegrasyonu
 */

import { PRODUCTS_DATA } from "./data/products.js";

// Yerel katalog ürünleri için örnek barkod eşleştirmeleri
export const LOCAL_BARCODES = {
  "8690001001011": "rare-soft-pinch-blush",
  "8690001001028": "flormar-silk-matte-lipstick",
  "8690001001035": "mac-ruby-matte-lipstick",
  "8690001001042": "nyx-fat-oil-lip"
};

// Hızlı deneme için hem yerel hem gerçek Open Beauty Facts barkodları
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

/**
 * Barkod numarasını temizler (sadece rakamlar).
 */
export function cleanBarcode(raw) {
  return String(raw || "").replace(/[^0-9]/g, "").trim();
}

/**
 * Barkod ile ürün bilgisi ve INCI içerik listesini getirir.
 * Önce yerel eşleşmeye bakar, yoksa Open Beauty Facts API'den canlı çeker.
 */
export async function fetchProductByBarcode(rawCode) {
  const code = cleanBarcode(rawCode);
  if (code.length < 6) {
    throw new Error("Geçerli bir barkod numarası girin (en az 6 rakam, örn: EAN-13).");
  }

  // 1. Yerel katalogda kayıtlı örnek barkod mu?
  const localId = LOCAL_BARCODES[code];
  if (localId) {
    const prod = PRODUCTS_DATA.find((p) => p.id === localId);
    if (prod) {
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

  // 2. Open Beauty Facts API v2 (ve bulunamazsa Open Products Facts yedek API) üzerinden canlı sorgula
  const fields =
    "product_name,product_name_tr,product_name_en,brands,image_front_url,image_url,ingredients_text,ingredients_text_tr,ingredients_text_en,ingredients,labels_tags,categories";
  const endpoints = [
    {
      url: `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`,
      label: "Open Beauty Facts (Canlı)"
    },
    {
      url: `https://world.openproductsfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`,
      label: "Open Products Facts (Canlı)"
    }
  ];

  let data = null;
  let usedLabel = "Open Beauty Facts (Canlı)";

  for (const ep of endpoints) {
    try {
      const response = await fetch(ep.url, { headers: { Accept: "application/json" } });
      if (response.ok) {
        const json = await response.json();
        if (json.status === 1 && json.product) {
          data = json;
          usedLabel = ep.label;
          break;
        }
      }
    } catch {
      // sonraki kaynağa geç
    }
  }

  if (!data || !data.product) {
    throw new Error(
      `Barkod (${code}) Open Beauty Facts ve Open Products Facts veritabanlarında bulunamadı. Ürünün arkasındaki INCI listesini "İçerik Analizörü" sekmesine yapıştırarak anında analiz edebilirsiniz.`
    );
  }

  const p = data.product;
  const name =
    p.product_name_tr || p.product_name || p.product_name_en || `Barkodlu Ürün (${code})`;
  const brand = p.brands ? p.brands.split(",")[0].trim() : "Bilinmeyen Marka";
  const image = p.image_front_url || p.image_url || "assets/images/foundation.jpg";

  // İçerik metnini çıkar
  let ingredientsText =
    p.ingredients_text_en || p.ingredients_text || p.ingredients_text_tr || "";

  if (!ingredientsText && Array.isArray(p.ingredients) && p.ingredients.length > 0) {
    ingredientsText = p.ingredients
      .map((i) => i.text || i.id?.replace(/^en:/, ""))
      .filter(Boolean)
      .join(", ");
  }

  const labels = Array.isArray(p.labels_tags) ? p.labels_tags : [];
  const isCrueltyFree = labels.some(
    (l) => l.includes("cruelty-free") || l.includes("not-tested-on-animals")
  );

  return {
    source: "openbeautyfacts",
    sourceLabel: usedLabel,
    barcode: code,
    name,
    brand,
    categoryLabel: p.categories ? p.categories.split(",")[0].trim() : "Kozmetik Ürünü",
    image,
    description: ingredientsText
      ? "Open Beauty Facts açık veritabanından barkod ile canlı çekildi ve MakeYUP motoruyla analiz edildi."
      : "Ürün bulundu ancak bu barkod için açık veritabanında henüz INCI içerik metni girilmemiş.",
    crueltyFree: isCrueltyFree,
    ingredientsText: ingredientsText.trim(),
    ingredientsList: null,
    apiLabels: labels
  };
}

// ============================================================
// Kamera & Fotoğraf Barkod Tarayıcı Sınıfı
// ============================================================
export class BarcodeScannerController {
  constructor(videoEl, { onDetected, onStatus, onError }) {
    this.videoEl = videoEl;
    this.onDetected = onDetected;
    this.onStatus = onStatus;
    this.onError = onError;

    this.stream = null;
    this.isRunning = false;
    this.rafId = null;
    this.zxingControls = null;
    this.lastCode = null;
    this.lastTime = 0;
  }

  async start() {
    if (this.isRunning) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onError?.(
        "Tarayıcınız kamera erişimini desteklemiyor veya sayfa güvenli (HTTPS / localhost) bağlantıda değil."
      );
      return;
    }

    this.isRunning = true;
    this.onStatus?.("Kamera başlatılıyor...");

    // 1. Native BarcodeDetector varsa en hızlı ve sıfır bağımlılıklı yolu kullan
    if ("BarcodeDetector" in window) {
      try {
        await this._startNativeDetector();
        return;
      } catch (err) {
        // Native destek başarısız olursa ZXing fallback'e geç
        console.warn("Native BarcodeDetector fallback:", err);
      }
    }

    // 2. Evrensel Fallback: ZXing Browser ESM (Safari / Firefox / Desktop)
    try {
      await this._startZxingFallback();
    } catch (err) {
      this.stop();
      this.onError?.(
        err?.name === "NotAllowedError"
          ? "Kamera izni reddedildi. Tarayıcı adres çubuğundan kamera izni verebilir veya 'Fotoğraftan Tara' seçeneğini kullanabilirsiniz."
          : `Kamera başlatılamadı: ${err?.message || "Bilinmeyen hata"}`
      );
    }
  }

  async _startNativeDetector() {
    const supported = await window.BarcodeDetector.getSupportedFormats();
    const wanted = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"].filter((f) =>
      supported.includes(f)
    );
    const detector = new window.BarcodeDetector({
      formats: wanted.length ? wanted : supported
    });

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    this.videoEl.srcObject = this.stream;
    await this.videoEl.play();
    this.onStatus?.("Kamera aktif — Barkodu çerçeve içine tutun");

    const scanLoop = async () => {
      if (!this.isRunning) return;
      try {
        if (this.videoEl.readyState >= 2) {
          const barcodes = await detector.detect(this.videoEl);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            this._handleHit(raw);
          }
        }
      } catch {
        // tek kare hatalarını yoksay
      }
      if (this.isRunning) {
        this.rafId = requestAnimationFrame(scanLoop);
      }
    };

    this.rafId = requestAnimationFrame(scanLoop);
  }

  async _startZxingFallback() {
    this.onStatus?.("Evrensel barkod tarayıcı yükleniyor...");
    const { BrowserMultiFormatReader } = await import(
      "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm"
    );
    if (!this.isRunning) return;

    const reader = new BrowserMultiFormatReader();
    this.zxingControls = await reader.decodeFromConstraints(
      { video: { facingMode: { ideal: "environment" } } },
      this.videoEl,
      (result) => {
        if (result && this.isRunning) {
          this._handleHit(result.getText());
        }
      }
    );
    this.onStatus?.("Kamera aktif — Barkodu çerçeve içine tutun");
  }

  _handleHit(rawValue) {
    const code = cleanBarcode(rawValue);
    const now = Date.now();
    if (!code || (code === this.lastCode && now - this.lastTime < 3000)) return;
    this.lastCode = code;
    this.lastTime = now;
    this.stop();
    this.onDetected?.(code);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.zxingControls) {
      try {
        this.zxingControls.stop();
      } catch {
        // ignore
      }
      this.zxingControls = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
  }
}

/**
 * Kullanıcının yüklediği bir fotoğraftan barkod okur.
 */
export async function scanBarcodeFromImageFile(file) {
  const imageUrl = URL.createObjectURL(file);
  try {
    // 1. Native BarcodeDetector ile dene
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

    // 2. ZXing fallback ile dene
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
    URL.revokeObjectURL(imageUrl);
  }
}
