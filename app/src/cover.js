// Drawing engine for Vice Cover Studio: turns panel photos, a caption and a colour
// grade into a GTA-style multi-panel poster on any canvas. Everything is drawn with
// the canvas 2D API — no images are fetched, so the app works fully offline.

export const LAYOUTS = {
  trio: { panels: 3 },
  split: { panels: 2 },
  hero: { panels: 1 },
};

export const GRADES = {
  sunset: { top: 'rgba(255, 140, 66, 0)', mid: 'rgba(255, 94, 98, 0.34)', bottom: 'rgba(160, 32, 120, 0.66)', band: 'rgba(24, 8, 40, 0.88)', accent: '#ffb347' },
  neon: { top: 'rgba(0, 229, 255, 0)', mid: 'rgba(255, 0, 153, 0.22)', bottom: 'rgba(120, 0, 200, 0.58)', band: 'rgba(10, 6, 32, 0.9)', accent: '#00e5ff' },
  dusk: { top: 'rgba(90, 120, 255, 0)', mid: 'rgba(140, 60, 220, 0.26)', bottom: 'rgba(40, 16, 90, 0.66)', band: 'rgba(12, 8, 28, 0.9)', accent: '#c9a7ff' },
};

/** Panel rectangles for a layout, as fractions of the canvas. gap is in pixels. */
export function panelRects(layout, w, h) {
  const g = Math.max(4, Math.round(w * 0.012));
  if (layout === 'split') {
    const hw = (w - g) / 2;
    return [{ x: 0, y: 0, w: hw, h }, { x: hw + g, y: 0, w: hw, h }];
  }
  if (layout === 'hero') return [{ x: 0, y: 0, w, h }];
  const heroH = Math.round(h * 0.62);
  const bw = (w - g) / 2;
  return [
    { x: 0, y: 0, w, h: heroH },
    { x: 0, y: heroH + g, w: bw, h: h - heroH - g },
    { x: bw + g, y: heroH + g, w: bw, h: h - heroH - g },
  ];
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan offsets. */
function drawPanelPhoto(ctx, rect, panel) {
  const img = panel.img;
  if (!img) return;
  const zoom = panel.zoom || 1;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * base;
  const ph = img.naturalHeight * base;
  const dx = rect.x + (rect.w - pw) / 2 + (panel.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + (panel.oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

/** A retro striped sun disc, tucked into the top-right corner of the hero panel
 *  (usually sky), so it never covers the subject of a portrait photo. */
function drawSun(ctx, rect, grade) {
  const r = Math.min(rect.w, rect.h) * 0.13;
  const cx = rect.x + rect.w - r * 1.15;
  const cy = rect.y + r * 1.15;
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, '#ffe259');
  g.addColorStop(0.55, '#ff7e3d');
  g.addColorStop(1, '#e91e63');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = grade.band;
  for (let i = 0; i < 4; i += 1) {
    const y = cy + r * (0.05 + i * 0.22);
    ctx.fillRect(cx - r, y, r * 2, r * 0.06);
  }
  ctx.restore();
}

function fitFont(ctx, text, startSize, maxWidth, family, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** Draws the caption block: title, subtitle and tag line. */
function drawCaption(ctx, state, w, h, grade) {
  const bandH = h * 0.26;
  const band = ctx.createLinearGradient(0, h - bandH, 0, h);
  band.addColorStop(0, 'rgba(10, 6, 24, 0)');
  band.addColorStop(1, grade.band);
  ctx.fillStyle = band;
  ctx.fillRect(0, h - bandH, w, h);

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const tag = (state.tag || '').trim().toUpperCase();
  const cx = w / 2;

  if (title) {
    const size = fitFont(ctx, title, Math.round(h * 0.115), w * 0.92, '"Anton", sans-serif', 400);
    const y = h - h * 0.085;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10, 6, 20, 0.9)';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeText(title, cx, y);
    const fill = ctx.createLinearGradient(0, y - size, 0, y);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.6, '#ffe9b0');
    fill.addColorStop(1, grade.accent);
    ctx.fillStyle = fill;
    ctx.fillText(title, cx, y);
    // thin accent underline
    const tw = ctx.measureText(title).width;
    ctx.fillStyle = grade.accent;
    ctx.fillRect(cx - tw * 0.32, y + h * 0.018, tw * 0.64, Math.max(3, h * 0.006));
  }
  if (subtitle) {
    const size = fitFont(ctx, subtitle, Math.round(h * 0.032), w * 0.86, '"Liberation Sans", sans-serif', 700);
    ctx.font = `700 ${size}px "Liberation Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(subtitle, cx, h - h * 0.028);
  }
  if (tag) {
    const size = Math.round(h * 0.02);
    ctx.font = `700 ${size}px "Liberation Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = grade.accent;
    ctx.fillText(tag, w * 0.045, h * 0.055);
  }
}

/** Draws the whole cover onto `canvas` at its own size, from `state`. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.layout] ? state.layout : 'trio';

  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(layout, w, h);
  rects.forEach((rect, i) => {
    const panel = (state.panels && state.panels[i]) || {};
    ctx.fillStyle = '#2b1838';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    drawPanelPhoto(ctx, rect, panel);
  });
  // retro sun over the hero panel
  drawSun(ctx, rects[0], grade);

  // colour grade wash
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.55, grade.mid);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  // vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(8,4,18,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // panel seams
  ctx.strokeStyle = 'rgba(20, 16, 28, 0.9)';
  ctx.lineWidth = Math.max(2, Math.round(w * 0.006));
  rects.forEach((r) => ctx.strokeRect(r.x, r.y, r.w, r.h));

  drawCaption(ctx, state, w, h, grade);
}

/** Renders the cover at an export size and returns a PNG blob. */
export function renderExport(state, sizeName) {
  const [w, h] = sizeName.split('x').map(Number);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
