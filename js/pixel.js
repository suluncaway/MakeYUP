/**
 * MakeYUP · Piksel Lab — Pixel Art Sprite Sistemi
 * Her sprite 8x8 – 16x16 piksel matrisinden crispEdges SVG olarak üretilir.
 */

const PALETTE = {
  K: "#1B1530", // Ink dış hat
  P: "#FF5C8A", // Ana pembe
  p: "#FFB3C7", // Açık pembe
  M: "#3DDC97", // Nane yeşili
  Y: "#FFD23F", // Limon sarısı
  R: "#FF4D4D", // Domates kırmızı
  L: "#B8A1FF", // Lavanta
  W: "#FFFFFF", // Beyaz parlama
  G: "#E8B04A", // Altın / sıcak sarı
  B: "#7FD1FF"  // Buz mavisi
};

export const PIXEL_SPRITES = {
  // 16x16 maskot: Yupi (gülümseyen piksel ruj)
  yupi: [
    "......KKKK......",
    ".....KPPPPK.....",
    "....KPpPPPPK....",
    "....KPPWPPPK....",
    "....KPPPPPPK....",
    "....KPPPPPPK....",
    "....KGGGGGGK....",
    "....KGYWWYGK....",
    "...KKKKKKKKKK...",
    "...KLLLLLLLLK...",
    "...KLKLLLLKLK...",
    "...KLLLLLLLLK...",
    "...KLLKKKKLLK...",
    "...KLLLLLLLLK...",
    "...KKKKKKKKKK...",
    "................"
  ],

  // 10x9 kalp (1px K dış hat)
  heart: [
    ".KKK..KKK.",
    "KPPPKKPPPK",
    "KPWPPPPPPK",
    "KPPPPPPPPK",
    "KPPPPPPPPK",
    ".KPPPPPPK.",
    "..KPPPPK..",
    "...KPPK...",
    "....KK...."
  ],

  // 11x11 ışıltı
  sparkle: [
    ".....K.....",
    "....KYK....",
    "....KYK....",
    "...KYWYK...",
    ".KKYWWWYKK.",
    "KYYWWWWWYKK",
    ".KKYWWWYKK.",
    "...KYWYK...",
    "....KYK....",
    "....KYK....",
    ".....K....."
  ],

  // 12x12 ruj
  lipstick: [
    "....KKKK....",
    "...KPPPPK...",
    "...KPWPPK...",
    "...KPPPPK...",
    "...KGGGGK...",
    "...KGGGGK...",
    "..KKKKKKKK..",
    "..KLLLLLLK..",
    "..KLWLLLLK..",
    "..KLLLLLLK..",
    "..KKKKKKKK..",
    "............"
  ],

  // 12x12 maskara
  mascara: [
    "..KK....KK..",
    ".KMK...KPPK.",
    "KKMKK..KPPK.",
    ".KMK...KPPK.",
    "..K....KPPK.",
    "..K....KGGK.",
    "..K....KGGK.",
    "..K....KPPK.",
    "..K....KPPK.",
    "..KKKK.KKKK.",
    "............",
    "............"
  ],

  // 12x12 serum / şişe
  bottle: [
    "....KKKK....",
    "....KPPK....",
    "....KPPK....",
    "...KKKKKK...",
    "...KGGGGK...",
    "..KKKKKKKK..",
    "..KBBBBBBK..",
    "..KBWBBBBK..",
    "..KBWBBBBK..",
    "..KBBBBBBK..",
    "..KKKKKKKK..",
    "............"
  ],

  // 10x12 damla
  drop: [
    "....KK....",
    "....KK....",
    "...KBBK...",
    "...KBBK...",
    "..KBWBBK..",
    "..KBBBBK..",
    ".KBWBBBBK.",
    ".KBBBBBBK.",
    ".KBBBBBBK.",
    "..KBBBBK..",
    "...KKKK...",
    ".........."
  ],

  // 12x12 yaprak (vegan)
  leaf: [
    "......KKKKK.",
    "....KKMMMMMK",
    "...KMMWMMMMK",
    "..KMMWMMMMK.",
    ".KMMMMKMMMK.",
    ".KMMMKMMMK..",
    ".KMMKMMMK...",
    ".KMKMMKK....",
    ".KKMKK......",
    ".KK.........",
    "K...........",
    "............"
  ],

  // 12x12 kalkan (güvenli)
  shield: [
    ".KKKKKKKKKK.",
    "KMMMMMMMMMMK",
    "KMMWMMMMMMMK",
    "KMMMMMMKMMMK",
    "KMMMMMKMMMK.",
    ".KMKMKMMMK..",
    ".KMMKMMMK...",
    "..KMMMMK....",
    "...KMMK.....",
    "....KK......",
    "............",
    "............"
  ],

  // 12x11 uyarı (dikkat)
  warning: [
    ".....KK.....",
    "....KYYK....",
    "....KYYK....",
    "...KYKKYK...",
    "...KYKKYK...",
    "..KYYKKYYK..",
    "..KYYYYYYK..",
    ".KYYYKKYYYK.",
    ".KYYYYYYYYK.",
    "KKKKKKKKKKKK",
    "............"
  ],

  // 12x12 çarpı (riskli)
  cross: [
    ".KKKKKKKKKK.",
    "KRRRRRRRRRRK",
    "KRRKRRRRKRRK",
    "KRRRKRRKRRRK",
    "KRRRRKKRRRRK",
    "KRRRRKKRRRRK",
    "KRRRKRRKRRRK",
    "KRRKRRRRKRRK",
    "KRRRRRRRRRRK",
    ".KKKKKKKKKK.",
    "............",
    "............"
  ],

  // 12x12 büyüteç
  magnifier: [
    "..KKKKKK....",
    ".KBBBBBBK...",
    "KBWWBBBBBK..",
    "KBWBBBBBBK..",
    "KBBBBBBBBK..",
    ".KBBBBBBK...",
    "..KKKKKKK...",
    ".......KKK..",
    "........KKK.",
    ".........KKK",
    "..........KK",
    "............"
  ],

  // 12x12 kitap (rehber)
  book: [
    ".KKKKKKKKKK.",
    "KPPPPKKWWWWK",
    "KPWPPKKWKKWK",
    "KPPPPKKWWWWK",
    "KPPPPKKWKKWK",
    "KPPPPKKWWWWK",
    "KPPPPKKWKKWK",
    "KPPPPKKWWWWK",
    "KPPPPKKWWWWK",
    ".KKKKKKKKKK.",
    "............",
    "............"
  ],

  // 11x11 yıldız
  star: [
    ".....K.....",
    "....KYK....",
    "....KYK....",
    "KKKKYWYKKKK",
    "KYYYYWYYYYK",
    ".KYYYYYYYK.",
    "..KYYYYYK..",
    "..KYYKYYK..",
    ".KYYK.KYYK.",
    ".KKK...KKK.",
    "..........."
  ],

  // 10x10 onay tiki
  check: [
    "........KK",
    ".......KMK",
    "......KMMK",
    ".....KMMK.",
    ".KK.KMMK..",
    "KMMKMMK...",
    "KMMMMK....",
    ".KMMK.....",
    "..KK......",
    ".........."
  ],

  // 14x12 kamera
  camera: [
    "....KKKKKK....",
    "...KPPPPPPK...",
    ".KKKKKKKKKKKK.",
    "KPPPPPPPPPPPPK",
    "KPPKKKKKKKKPPK",
    "KPKBBBBBBBBKPK",
    "KPKBWWBBBBBKPK",
    "KPKBBBBBBBBKPK",
    "KPPKKKKKKKKPPK",
    "KPPPPPPPPPPPPK",
    ".KKKKKKKKKKKK.",
    ".............."
  ]
};

/**
 * Pixel art sprite'ı SVG string olarak üretir.
 */
export function pixelSVG(name, { size = 32, title = "" } = {}) {
  const grid = PIXEL_SPRITES[name] || PIXEL_SPRITES.sparkle;
  const height = grid.length;
  const width = grid[0] ? grid[0].length : height;

  let rects = "";
  for (let y = 0; y < height; y += 1) {
    const row = grid[y];
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      const fill = PALETTE[ch];
      if (!fill) continue;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
    }
  }

  const cleanTitle = String(title || "").trim();
  const ariaAttr = cleanTitle
    ? `role="img" aria-label="${cleanTitle.replace(/"/g, "&quot;")}"`
    : `aria-hidden="true"`;
  const titleTag = cleanTitle
    ? `<title>${cleanTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>`
    : "";

  return `<svg class="px-svg" width="${size}" height="${size}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" ${ariaAttr}>${titleTag}${rects}</svg>`;
}

/**
 * DOM içindeki tüm [data-pixel] yer tutucularını pixel SVG ile doldurur.
 */
export function hydratePixels(root = document) {
  if (!root) return;
  root.querySelectorAll("[data-pixel]").forEach((el) => {
    const name = el.dataset.pixel;
    if (!name) return;
    const size = Number(el.dataset.pixelSize || 32);
    const title = el.dataset.pixelTitle || "";
    el.classList.add("px-sprite");
    el.innerHTML = pixelSVG(name, { size, title });
  });
}
