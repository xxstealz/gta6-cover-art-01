// Vice Cover Studio — cover renderer.
// Draws the multi-panel GTA-style poster onto any canvas: photos per panel,
// a retro striped sun, a colour grade, a vignette and the big Anton title.
// Everything is drawn with the 2D canvas API; no network, no library.

export const GRADES = {
  sunset: {
    wash: "rgba(255, 110, 30, 0.16)",
    sunTop: "#ffd23e",
    sunBottom: "#ff2e63",
    titleTop: "#fff3b0",
    titleBottom: "#ffb347",
    accent: "#ffb347",
    scrim: "rgba(24, 4, 40, 0.82)",
  },
  neon: {
    wash: "rgba(255, 45, 149, 0.20)",
    sunTop: "#ffe259",
    sunBottom: "#ff2e88",
    titleTop: "#eafffb",
    titleBottom: "#37e6d4",
    accent: "#37e6d4",
    scrim: "rgba(10, 2, 34, 0.82)",
  },
  dusk: {
    wash: "rgba(96, 80, 220, 0.20)",
    sunTop: "#ffc46b",
    sunBottom: "#c65df0",
    titleTop: "#ffffff",
    titleBottom: "#c9a7ff",
    accent: "#c9a7ff",
    scrim: "rgba(8, 4, 28, 0.82)",
  },
};

export const LAYOUTS = ["trio", "split", "hero"];

// How many photo panels a layout shows (trio 3, split 2, hero 1).
export function panelCount(layout) {
  return panelRects(layout, 100, 100).length;
}
export const SIZES = [
  { label: "1080 × 1080", w: 1080, h: 1080 },
  { label: "1080 × 1350", w: 1080, h: 1350 },
  { label: "1920 × 1080", w: 1920, h: 1080 },
];

export function defaultState() {
  return {
    layout: "trio",
    grade: "sunset",
    title: "SUNSET HEIST",
    subtitle: "One last job under a neon sky",
    topline: "SOLMAR BAY · 2026",
    panels: [
      { src: "pier", zoom: 1, ox: 0.5, oy: 0 },
      { src: "boulevard", zoom: 1, ox: 0.5, oy: 0.5 },
      { src: "pier", zoom: 1, ox: 0.5, oy: 0.5 },
    ],
  };
}

// Panel rectangles for a layout inside a canvas of w by h.
// Trio: one wide panel over two half panels. Split: two halves. Hero: one.
export function panelRects(layout, w, h) {
  const gap = Math.max(4, Math.round(w * 0.007));
  if (layout === "split") {
    const half = (w - gap) / 2;
    return [
      { x: 0, y: 0, w: half, h },
      { x: half + gap, y: 0, w: half, h },
    ];
  }
  if (layout === "hero") {
    return [{ x: 0, y: 0, w, h }];
  }
  const topH = h * 0.62 - gap / 2;
  const botY = h * 0.62 + gap / 2;
  const botH = h * 0.38 - gap / 2;
  const half = (w - gap) / 2;
  return [
    { x: 0, y: 0, w, h: topH },
    { x: 0, y: botY, w: half, h: botH },
    { x: half + gap, y: botY, w: half, h: botH },
  ];
}

// Cover-fit one image into a rectangle, honouring zoom and the ox/oy crop point.
// ox/oy are 0..1 across the slack: 0 pins the image's top/left edge to the panel.
export function drawPhotoInto(ctx, img, rect, panel) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (panel.ox ?? 0.5) * (rect.w - dw);
  const dy = rect.y + (panel.oy ?? 0.5) * (rect.h - dh);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

export function drawRetroSun(ctx, cx, cy, r, grade) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, grade.sunTop);
  g.addColorStop(1, grade.sunBottom);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Dark slits, thicker toward the bottom of the disc.
  ctx.fillStyle = "rgba(20, 8, 32, 0.85)";
  const slits = [0.08, 0.26, 0.44, 0.62];
  slits.forEach((t, i) => {
    const y = cy + r * t;
    const half = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    ctx.fillRect(cx - half, y, half * 2, r * (0.03 + i * 0.018));
  });
  ctx.restore();
}

export function drawVignette(ctx, w, h) {
  const cx = w / 2;
  const cy = h * 0.45;
  const inner = Math.max(w, h) * 0.42;
  const outer = Math.max(w, h) * 0.78;
  const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  g.addColorStop(0, "rgba(0, 0, 0, 0)");
  g.addColorStop(1, "rgba(0, 0, 0, 0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function fitAnton(ctx, text, maxWidth, startSize, w) {
  let size = startSize;
  ctx.font = `${size}px Anton, "Vice Sans", sans-serif`;
  while (size > w * 0.03 && ctx.measureText(text).width > maxWidth) {
    size *= 0.92;
    ctx.font = `${size}px Anton, "Vice Sans", sans-serif`;
  }
  return size;
}

export function drawTitleBlock(ctx, w, h, state, grade) {
  const pad = h * 0.032;
  const subSize = Math.round(w * 0.030);
  const titleSize = fitAnton(ctx, state.title, w * 0.94, Math.round(w * 0.115), w);
  const titleY = h - pad - subSize * 1.35;
  const subY = h - pad;

  // Bottom scrim so the lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, h * 0.52, 0, h);
  scrim.addColorStop(0, "rgba(10, 4, 24, 0)");
  scrim.addColorStop(1, grade.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.52, w, h * 0.48);

  // Title: gradient fill, heavy dark outline.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const grad = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY);
  grad.addColorStop(0, grade.titleTop);
  grad.addColorStop(1, grade.titleBottom);
  ctx.font = `${titleSize}px Anton, "Vice Sans", sans-serif`;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(12, 4, 20, 0.95)";
  ctx.lineWidth = Math.max(4, titleSize * 0.09);
  ctx.strokeText(state.title, w / 2, titleY);
  ctx.fillStyle = grad;
  ctx.fillText(state.title, w / 2, titleY);

  // Accent rule under the title.
  const ruleW = ctx.measureText(state.title).width * 0.55;
  ctx.fillStyle = grade.accent;
  ctx.fillRect((w - ruleW) / 2, titleY + subSize * 0.32, ruleW, Math.max(3, w * 0.004));

  // Subtitle in bold sans.
  ctx.font = `700 ${subSize}px "Vice Sans", sans-serif`;
  ctx.lineWidth = Math.max(3, subSize * 0.16);
  ctx.strokeStyle = "rgba(12, 4, 20, 0.9)";
  ctx.strokeText(state.subtitle, w / 2, subY);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(state.subtitle, w / 2, subY);

  // Top line, small caps in the grade accent.
  const topSize = Math.round(w * 0.021);
  ctx.textAlign = "left";
  ctx.font = `700 ${topSize}px "Vice Sans", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(topSize * 0.12)}px`; } catch { /* older canvas */ }
  ctx.fillStyle = grade.accent;
  ctx.fillText(state.topline, w * 0.04, h * 0.048);
  try { ctx.letterSpacing = "0px"; } catch { /* older canvas */ }
  ctx.textAlign = "center";
}

// Draw the whole cover onto a canvas of exactly w by h.
// images maps a panel src key ("pier", "boulevard") or a data: URL to an Image.
export function drawCover(canvas, state, images) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = panelRects(state.layout, w, h);
  const panels = state.panels.slice(0, rects.length);

  ctx.fillStyle = "#160a20";
  ctx.fillRect(0, 0, w, h);
  panels.forEach((panel, i) => {
    const img = images[panel.src];
    if (img && img.naturalWidth) drawPhotoInto(ctx, img, rects[i], panel);
  });

  // Colour wash over the photos, then the sun and the vignette.
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  const sunR = w * 0.075;
  drawRetroSun(ctx, w * 0.86, h * 0.10, sunR, grade);
  drawVignette(ctx, w, h);
  drawTitleBlock(ctx, w, h, state, grade);

  // Thin dark frame around the whole poster.
  ctx.strokeStyle = "#14081f";
  ctx.lineWidth = Math.max(4, w * 0.006);
  ctx.strokeRect(0, 0, w, h);
  return canvas;
}

// Render a fresh offscreen canvas at exactly w by h (an export size).
export function renderCover(state, images, w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return drawCover(canvas, state, images);
}
