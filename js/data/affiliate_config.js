/**
 * MakeYUP — Affiliate (satış ortaklığı) yapılandırması
 *
 * SAHİBİ İÇİN: Bir programdan onay aldığınızda yalnızca ilgili mağazanın `tag`
 * alanını doldurun (ayrıntılar: docs/GELIR-KURULUMU.md). Kod değişikliği gerekmez.
 *
 * Alanlar:
 *  - searchTemplate : Mağaza arama URL'si. {query} = URL-kodlanmış "marka + ürün adı" (veya GTIN).
 *  - supportsGtin   : true ise ürünün barkodu (GTIN/EAN) varsa isim yerine barkodla aranır.
 *  - tagParam       : Affiliate kimliği bir URL parametresiyle ekleniyorsa parametre adı (ör. Amazon "tag").
 *  - wrapTemplate   : Affiliate ağı "deeplink" formatı. {url} = URL-kodlanmış hedef arama linki,
 *                     {tag} = ağın verdiği kimlik/link ID. Ağ panelindeki deeplink formatını buraya yapıştırın.
 *  - tag            : BOŞ ("") ise link normal (affiliate olmayan) arama linki olarak çalışır
 *                     ve isAffiliate=false döner. Asla uydurma bir kimlik yazmayın.
 *  - verified       : false ise arama URL formatı henüz canlı sitede doğrulanmadı; bu yüzden
 *                     enabled:false bırakıldı. Tarayıcıda bir kez deneyip doğruysa true yapın.
 *  - priority       : Küçük sayı = listede önce.
 */

export const AFFILIATE_CONFIG = {
  enabled: true,

  // Reklam Kurulu ilkelerine uygun açık beyan (bkz. docs/GELIR-KURULUMU.md)
  disclosureLabel: "Reklam / İş birliği",
  disclosure:
    "Reklam / İş birliği: Bu bölümdeki bazı mağaza bağlantıları satış ortaklığı (affiliate) bağlantısıdır. " +
    "Bu bağlantılar üzerinden alışveriş yaparsanız MakeYUP, size hiçbir ek maliyet olmadan komisyon kazanabilir. " +
    "İçerik analizleri, puanlar ve uyarılar bu iş birliklerinden bağımsızdır ve etkilenmez.",

  // Tüm dış bağlantılarda kullanılacak rel değeri (Google: ücretli linkler "sponsored" olmalı)
  rel: "sponsored nofollow noopener",

  stores: [
    {
      id: "amazon-tr",
      name: "Amazon.com.tr",
      enabled: true,
      verified: true,
      priority: 1,
      searchTemplate: "https://www.amazon.com.tr/s?k={query}",
      supportsGtin: true,
      tagParam: "tag",          // Amazon Ortaklık Programı: ?tag=XXXX-21
      wrapTemplate: "",
      tag: ""                   // Onaydan sonra Associates panelindeki "Takip Kimliği"ni yazın (ör. "makeyup-21")
    },
    {
      id: "trendyol",
      name: "Trendyol",
      enabled: true,
      verified: true,
      priority: 2,
      searchTemplate: "https://www.trendyol.com/sr?q={query}",
      supportsGtin: false,
      tagParam: "",
      // Trendyol Influencer linkleri uygulama içinde ürün bazında üretilir (şablonlanamaz).
      // Trendyol'u bir affiliate ağı (ör. Admitad) üzerinden alırsanız ağın deeplink formatını yapıştırın,
      // ör. Admitad: "https://ad.admitad.com/g/{tag}/?ulp={url}"
      wrapTemplate: "",
      tag: ""
    },
    {
      id: "hepsiburada",
      name: "Hepsiburada",
      enabled: true,
      verified: true,
      priority: 3,
      searchTemplate: "https://www.hepsiburada.com/ara?q={query}",
      supportsGtin: false,
      tagParam: "",
      // Hepsiburada "Link Gelir" linkleri uygulama içinde üretilir; ağ üzerinden onay alırsanız
      // ağın deeplink formatını buraya yapıştırın.
      wrapTemplate: "",
      tag: ""
    },
    {
      id: "watsons-tr",
      name: "Watsons",
      enabled: false,
      verified: false,
      priority: 4,
      searchTemplate: "https://www.watsons.com.tr/search?text={query}",
      supportsGtin: false,
      tagParam: "",
      wrapTemplate: "",
      tag: ""
    },
    {
      id: "gratis",
      name: "Gratis",
      enabled: false,
      verified: false,
      priority: 5,
      searchTemplate: "https://www.gratis.com/search?q={query}",
      supportsGtin: false,
      tagParam: "",
      wrapTemplate: "",
      tag: ""
    },
    {
      id: "sephora-tr",
      name: "Sephora",
      enabled: false,
      verified: false,
      priority: 6,
      searchTemplate: "https://www.sephora.com.tr/search?q={query}",
      supportsGtin: false,
      tagParam: "",
      wrapTemplate: "",
      tag: ""
    },
    {
      id: "rossmann-tr",
      name: "Rossmann",
      enabled: false,
      verified: false,
      priority: 7,
      searchTemplate: "https://www.rossmann.com.tr/catalogsearch/result/?q={query}",
      supportsGtin: false,
      tagParam: "",
      wrapTemplate: "",
      tag: ""
    },
    {
      id: "flormar",
      name: "Flormar",
      enabled: false,
      verified: false,
      priority: 8,
      // Yalnızca Flormar markalı ürünlerde gösterilir.
      onlyBrands: ["flormar"],
      searchTemplate: "https://www.flormar.com.tr/search?q={query}",
      supportsGtin: false,
      tagParam: "",
      wrapTemplate: "",
      tag: ""
    }
  ]
};
