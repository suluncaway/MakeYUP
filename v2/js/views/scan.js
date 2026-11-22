/**
 * MakeYUP v2 — #/tara: camera / photo / manual barcode lookup.
 * Hit with an id in state → #/urun/<id>. Online-only hit → inline report + buyPanel.
 * Camera is stopped on route cleanup, when the tab is hidden, and on errors.
 */
import { setTitle, navigate } from "../router.js";
import { getProducts, getCatalog, getAnalysis } from "../state.js";
import { escapeHtml as e, icon, emptyState, buyPanel, productImage, enc } from "../ui/components.js";
import {
  BarcodeScannerController, fetchProductByBarcode, scanBarcodeFromImageFile,
  SAMPLE_BARCODES, LOCAL_BARCODES, cleanBarcode
} from "../../../js/barcode.js";
import { renderReport } from "./analyze.js";

const LOOKUP_CAP_MS = 9000; // never leave the user waiting longer than this
const PER_SOURCE_MS = 3500;

const stripZeros = (s) => String(s || "").replace(/\D/g, "").replace(/^0+/, "");

/** Products that already have an id in state (local + archive) for this barcode. */
async function findKnownByBarcode(code) {
  const localId = LOCAL_BARCODES[code];
  if (localId) return localId;
  const z = stripZeros(code);
  const local = getProducts().find((p) => [p.gtin, ...(p.gtins || [])].some((g) => g && stripZeros(g) === z));
  if (local) return local.id;
  const cat = await getCatalog();
  const hit = cat.find((p) => (p.gtins || []).some((g) => stripZeros(g) === z));
  return hit ? hit.id : null;
}

function friendlyCameraError(msg) {
  const m = String(msg || "");
  if (/izni reddedildi|NotAllowed|Permission/i.test(m)) {
    return "Kamera izni verilmedi. Tarayıcının adres çubuğundaki kamera simgesinden izin verebilir ya da fotoğraf yükleyebilirsin.";
  }
  if (/desteklemiyor|güvenli/i.test(m)) {
    return "Bu tarayıcı kamerayı desteklemiyor ya da sayfa güvenli (https) bağlantıda değil. Fotoğraf yükleyebilir ya da barkodu elle yazabilirsin.";
  }
  if (/not found|NotFound|Requested device/i.test(m)) {
    return "Bu cihazda kamera bulunamadı. Fotoğraf yükleyebilir ya da barkod numarasını elle yazabilirsin.";
  }
  if (/NotReadable|Could not start|in use/i.test(m)) {
    return "Kamera başka bir uygulama tarafından kullanılıyor olabilir. Onu kapatıp tekrar dene.";
  }
  return "Kamera başlatılamadı. Fotoğraf yükleyebilir ya da barkod numarasını elle yazabilirsin.";
}

function withCap(promise, ms) {
  let t;
  const cap = new Promise((_, rej) => { t = setTimeout(() => { const er = new Error("timeout"); er.code = "timeout"; rej(er); }, ms); });
  return Promise.race([promise, cap]).finally(() => clearTimeout(t));
}

function scanHandler({ el, query }) {
  setTitle("Barkod tara");
  const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext !== false;
  el.innerHTML = `<section class="scan-page">
    <header class="page-head">
      <div class="eyebrow">Barkod tara</div>
      <h1>Ürünü okut, raporu gör</h1>
      <p>Barkodu kameraya göster, fotoğrafını yükle ya da numarasını yaz.</p>
    </header>
    <div class="scan-card panel">
      <div class="scan-view" data-view>
        <video class="scan-video" playsinline muted autoplay aria-label="Kamera görüntüsü"></video>
        <div class="scan-reticle" aria-hidden="true"><span></span></div>
        <div class="scan-idle">
          <button type="button" class="btn btn-primary btn-lg scan-start" data-start>${icon("scan", { size: 20 })}Kamerayı aç</button>
          <label class="btn btn-ghost scan-upload">${icon("box", { size: 17 })}Fotoğraftan oku<input type="file" accept="image/*" class="visually-hidden" data-file></label>
        </div>
      </div>
      <div class="scan-tools" data-tools hidden>
        <button type="button" class="btn btn-ghost btn-sm" data-stop>${icon("x", { size: 16 })}Durdur</button>
        <button type="button" class="btn btn-ghost btn-sm" data-focus>Odakla</button>
        <button type="button" class="btn btn-ghost btn-sm" data-torch aria-pressed="false" hidden>Flaş</button>
        <button type="button" class="btn btn-ghost btn-sm" data-switch hidden>Kamera değiştir</button>
        <label class="scan-zoom" data-zoomwrap hidden><span>Yakınlaştır</span><input type="range" data-zoom min="1" max="3" step="0.1" value="1"><output data-zoomval>1.0x</output></label>
      </div>
      <p class="scan-status" role="status" aria-live="polite" data-status>${
        supported ? "Barkodu çerçevenin ortasına, 15–20 cm uzaklıkta tut." : e(friendlyCameraError("desteklemiyor"))
      }</p>
      <form class="scan-manual" data-manual novalidate>
        <label for="scanCode">Barkod numarası</label>
        <div class="scan-manual-row">
          <input id="scanCode" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="search" placeholder="Örn: 8690001001028" value="${e(cleanBarcode(query?.kod || ""))}">
          <button type="submit" class="btn btn-primary">Sorgula</button>
        </div>
      </form>
      <div class="scan-samples">
        <span>Örnek barkodlar:</span>
        ${SAMPLE_BARCODES.map((s) => `<button type="button" class="chip scan-sample" data-code="${e(s.code)}">${e(s.label.replace(/\s*\((Canlı API|Örnek)\)/, ""))}</button>`).join("")}
      </div>
    </div>
    <div class="scan-result" data-result aria-live="polite"></div>
  </section>`;

  const $ = (s) => el.querySelector(s);
  const view = $("[data-view]");
  const video = $(".scan-video");
  const tools = $("[data-tools]");
  const statusEl = $("[data-status]");
  const result = $("[data-result]");
  const codeInput = $("#scanCode");
  const torchBtn = $("[data-torch]");
  const switchBtn = $("[data-switch]");
  const zoomWrap = $("[data-zoomwrap]");
  const zoom = $("[data-zoom]");
  const zoomVal = $("[data-zoomval]");

  let disposed = false;
  let lookupToken = 0;

  const setStatus = (t, tone = "") => {
    statusEl.textContent = t;
    statusEl.dataset.tone = tone;
  };

  const resetCameraUi = () => {
    view.classList.remove("is-live");
    tools.hidden = true;
    torchBtn.setAttribute("aria-pressed", "false");
  };

  const controller = new BarcodeScannerController(video, {
    onDetected: (code) => { resetCameraUi(); codeInput.value = code; lookup(code); },
    onStatus: (m) => { if (!disposed) setStatus(m.replace(/\.\.\.$/, "…")); },
    onError: (m) => { stopCamera(); if (!disposed) setStatus(friendlyCameraError(m), "error"); },
    onCapabilities: (caps) => {
      if (disposed) return;
      tools.hidden = false;
      zoomWrap.hidden = !caps.canZoom;
      if (caps.canZoom) {
        zoom.min = String(caps.zoomMin); zoom.max = String(caps.zoomMax); zoom.step = String(caps.zoomStep); zoom.value = String(caps.zoomValue);
        zoomVal.textContent = `${Number(caps.zoomValue).toFixed(1)}x`;
      }
      torchBtn.hidden = !caps.canTorch;
      switchBtn.hidden = !caps.canSwitch;
    }
  });

  function stopCamera() {
    try { controller.stop(); } catch { /* ignore */ }
    resetCameraUi();
  }

  async function startCamera() {
    if (!supported) { setStatus(friendlyCameraError("desteklemiyor"), "error"); return; }
    view.classList.add("is-live");
    tools.hidden = false;
    await controller.start();
    // getUserMedia may resolve after the user left / hid the page.
    if (disposed || document.hidden) controller.stop();
    else if (!controller.isRunning) resetCameraUi();
  }

  /* ---------- lookup ---------- */
  async function lookup(raw) {
    const code = cleanBarcode(raw);
    const my = ++lookupToken;
    if (code.length < 6) {
      setStatus("Geçerli bir barkod numarası yaz (en az 6 rakam, ör. 13 haneli EAN).", "error");
      codeInput.focus();
      return;
    }
    codeInput.value = code;
    setStatus(`${code} aranıyor…`);
    result.innerHTML = `<div class="scan-loading panel" aria-busy="true"><span class="scan-spinner" aria-hidden="true"></span><div><b>Barkod sorgulanıyor</b><span>${e(code)} için ürün ve içerik listesi aranıyor…</span></div></div>`;
    result.scrollIntoView({ block: "nearest" });
    try {
      const id = await withCap(findKnownByBarcode(code), 4000).catch(() => null);
      if (disposed || my !== lookupToken) return;
      if (id) { navigate(`#/urun/${enc(id)}`); return; }

      const prod = await withCap(
        fetchProductByBarcode(code, { timeoutMs: PER_SOURCE_MS, onProgress: (m) => { if (!disposed && my === lookupToken) setStatus(m.replace(/\.\.\.$/, "…")); } }),
        LOOKUP_CAP_MS
      );
      if (disposed || my !== lookupToken) return;
      renderOnline(prod, code);
    } catch (err) {
      if (disposed || my !== lookupToken) return;
      renderMiss(code, err);
    }
  }

  function renderOnline(prod, code) {
    const product = {
      id: `barkod-${code}`, brand: prod.brand === "Bilinmeyen Marka" ? "" : prod.brand || "", name: prod.name || `Barkodlu ürün (${code})`,
      image: /^https?:/.test(prod.image || "") && !/foundation\.jpg$/.test(prod.image) ? prod.image : null,
      gtin: code, gtins: [code], category: "", categoryLabel: prod.categoryLabel || "", ingredients: prod.ingredientsText || "", source: "online"
    };
    setStatus(`Ürün bulundu: ${[product.brand, product.name].filter(Boolean).join(" — ")}`, "ok");
    const a = product.ingredients ? getAnalysis(product.ingredients) : null;
    const src = `<p class="scan-src">${icon("info", { size: 14 })}Kaynak: ${e(prod.sourceLabel || "Açık veritabanı")}</p>`;
    if (a && a.counts?.total) {
      result.innerHTML = src + renderReport(a, { product, headingId: "scanReportTitle" });
    } else {
      result.innerHTML = `${src}<article class="panel scan-noinci">
        <div class="scan-prod">${productImage(product, { cls: "scan-prod-ph", eager: true })}<div>${product.brand ? `<div class="brand-name">${e(product.brand)}</div>` : ""}<h2 id="scanReportTitle" tabindex="-1">${e(product.name)}</h2></div></div>
        <p>Ürünü bulduk ama içerik listesi kayıtlı değil. Ambalajın arkasındaki listeyi yapıştırarak hemen analiz edebilirsin.</p>
        <div class="scan-miss-actions"><a class="btn btn-ghost" href="#/analiz">${icon("flask", { size: 16 })}İçerik listesini yapıştır</a></div>
        ${buyPanel(product)}
      </article>`;
    }
    requestAnimationFrame(() => {
      result.scrollIntoView({ behavior: "smooth", block: "start" });
      result.querySelector("#scanReportTitle")?.focus({ preventScroll: true });
    });
  }

  function renderMiss(code, err) {
    const msg = String(err?.message || "");
    const network = err?.code === "timeout" || /sorgulanamadı|bağlantı|zaman aşımı|timeout|network|fetch/i.test(msg) || navigator.onLine === false;
    const title = network ? "Barkod veritabanlarına ulaşılamadı" : "Bu barkodu bulamadık";
    const text = network
      ? `İnternet bağlantısı yok ya da veritabanları yanıt vermedi (${code}). İçerik listesini yapıştırarak ya da ürünü adıyla arayarak devam edebilirsin.`
      : `${code} numaralı ürün kayıtlarımızda yok. İçerik listesini yapıştırarak ya da ürünü adıyla arayarak devam edebilirsin.`;
    setStatus(title + ".", "error");
    result.innerHTML = `<div class="panel scan-miss">
      ${emptyState({ icon: network ? "alert" : "search", title, text })}
      <div class="scan-miss-actions">
        <a class="btn btn-primary" href="#/analiz">${icon("flask", { size: 16 })}İçerik listesini yapıştır</a>
        <a class="btn btn-ghost" href="#/?q=">${icon("search", { size: 16 })}İsimle ara</a>
        <button type="button" class="btn btn-quiet" data-retry="${e(code)}">Tekrar dene</button>
      </div>
    </div>`;
  }

  /* ---------- events ---------- */
  $("[data-start]").addEventListener("click", () => { result.innerHTML = ""; startCamera(); });
  $("[data-stop]").addEventListener("click", () => { stopCamera(); setStatus("Kamera kapatıldı."); });
  $("[data-focus]").addEventListener("click", () => { controller.triggerRefocus(); setStatus("Yeniden odaklanıyor…"); });
  torchBtn.addEventListener("click", async () => torchBtn.setAttribute("aria-pressed", String(await controller.toggleTorch())));
  switchBtn.addEventListener("click", async () => {
    setStatus("Kamera değiştiriliyor…");
    await controller.switchCamera();
    if (disposed) controller.stop();
  });
  zoom.addEventListener("input", () => {
    const v = Number(zoom.value);
    zoomVal.textContent = `${v.toFixed(1)}x`;
    controller.setZoom(v);
  });
  video.addEventListener("click", () => { if (controller.isRunning) controller.triggerRefocus(); });

  $("[data-file]").addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    stopCamera();
    setStatus("Fotoğraftaki barkod okunuyor…");
    try {
      const code = await withCap(scanBarcodeFromImageFile(file), 8000);
      if (disposed) return;
      lookup(code);
    } catch (err) {
      if (disposed) return;
      setStatus(err?.code === "timeout"
        ? "Fotoğraf okunamadı (zaman aşımı). Barkod numarasını elle yazabilirsin."
        : "Fotoğraftaki barkod okunamadı. Daha net ve aydınlık bir fotoğraf dene ya da numarayı elle yaz.", "error");
    }
  });

  $("[data-manual]").addEventListener("submit", (ev) => { ev.preventDefault(); stopCamera(); lookup(codeInput.value); });
  el.querySelector(".scan-samples").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-code]");
    if (!b) return;
    stopCamera();
    lookup(b.dataset.code);
  });
  result.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-retry]");
    if (b) lookup(b.dataset.retry);
  });

  const onVis = () => {
    if (document.hidden && (controller.isRunning || controller.stream)) {
      stopCamera();
      setStatus("Kamera durduruldu. Devam etmek için yeniden aç.");
    }
  };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", stopCamera);

  if (query?.kod) lookup(query.kod);

  return () => {
    disposed = true;
    lookupToken++;
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pagehide", stopCamera);
    stopCamera();
    // A pending getUserMedia/start() may attach a stream after cleanup: keep stopping it for a while.
    let n = 0;
    const guard = setInterval(() => {
      if (controller.stream || controller.isRunning) controller.stop();
      if (++n > 60) clearInterval(guard);
    }, 250);
  };
}

export default {
  routes: { "#/tara": scanHandler }
};
