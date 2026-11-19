// Vice Cover Studio — editor wiring.
// Owns the page state, the panel controls, drag-to-reposition, uploads and
// the PNG exports. The drawing itself lives in cover.js; the ?shot= presets
// live in shots.js. Photos are read locally and never uploaded anywhere.

import { SIZES, defaultState, drawCover, panelCount, panelRects, renderCover } from "./cover.js";
import { applyShotPreset, whenReady } from "./shots.js";

const state = defaultState();
const images = {};
const preview = document.getElementById("preview");
const panelsBox = document.getElementById("panels");
const exportNote = document.getElementById("exportNote");

let exportSize = SIZES[0];
let shotMode = null;
let drag = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSample(key) {
  if (!images[key]) images[key] = await loadImage(`samples/${key}.jpg`);
  return images[key];
}

async function loadAllSamples() {
  await Promise.all([loadSample("pier"), loadSample("boulevard")]);
}

export function redraw() {
  preview.width = exportSize.w;
  preview.height = exportSize.h;
  drawCover(preview, state, images);
}

function visiblePanels() {
  return state.panels.slice(0, panelCount(state.layout));
}

function panelLabel(i) {
  if (state.layout === "hero") return `Panel 1 — hero`;
  if (state.layout === "split") return `Panel ${i + 1}`;
  return i === 0 ? "Panel 1 — hero" : `Panel ${i + 1}`;
}

function buildPanelControls() {
  panelsBox.innerHTML = "";
  visiblePanels().forEach((panel, i) => {
    const box = document.createElement("div");
    box.className = "panel";

    const heading = document.createElement("h3");
    heading.textContent = panelLabel(i);
    box.appendChild(heading);

    const pick = document.createElement("label");
    pick.textContent = "Photo";
    const select = document.createElement("select");
    ["pier", "boulevard"].forEach((key) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `${key}.jpg`;
      select.appendChild(opt);
    });
    if (panel.src !== "pier" && panel.src !== "boulevard") {
      const opt = document.createElement("option");
      opt.value = panel.src;
      opt.textContent = "Your upload";
      select.appendChild(opt);
    }
    select.value = panel.src;
    select.addEventListener("change", async () => {
      panel.src = select.value;
      await loadSample(panel.src);
      redraw();
    });
    pick.appendChild(select);
    box.appendChild(pick);

    const up = document.createElement("label");
    up.textContent = "Upload";
    const file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";
    file.addEventListener("change", () => {
      const chosen = file.files && file.files[0];
      if (!chosen) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const url = String(reader.result);
        images[url] = await loadImage(url);
        panel.src = url;
        buildPanelControls();
        redraw();
      };
      reader.readAsDataURL(chosen);
    });
    up.appendChild(file);
    box.appendChild(up);

    const zoomRow = document.createElement("div");
    zoomRow.className = "zoomline";
    const zoomLabel = document.createElement("span");
    zoomLabel.textContent = "Zoom";
    const zoom = document.createElement("input");
    zoom.type = "range";
    zoom.min = "1";
    zoom.max = "2.5";
    zoom.step = "0.05";
    zoom.value = String(panel.zoom || 1);
    const zoomValue = document.createElement("span");
    zoomValue.textContent = `${Number(panel.zoom || 1).toFixed(2)}×`;
    zoom.addEventListener("input", () => {
      panel.zoom = Number(zoom.value);
      zoomValue.textContent = `${panel.zoom.toFixed(2)}×`;
      redraw();
    });
    zoomRow.append(zoomLabel, zoom, zoomValue);
    box.appendChild(zoomRow);

    panelsBox.appendChild(box);
  });
}

function wirePicker(rowId, attr, apply) {
  const row = document.getElementById(rowId);
  row.addEventListener("click", (event) => {
    const btn = event.target.closest(`[data-${attr}]`);
    if (!btn) return;
    row.querySelectorAll(".pick").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    apply(btn.dataset[attr]);
  });
}

function setLayout(layout) {
  state.layout = layout;
  buildPanelControls();
  redraw();
}

function setGrade(grade) {
  state.grade = grade;
  redraw();
}

function setSize(key) {
  exportSize = SIZES.find((s) => `${s.w}x${s.h}` === key) || SIZES[0];
  exportNote.textContent = `Exports at ${exportSize.w} × ${exportSize.h} pixels. No upload, no watermark.`;
  redraw();
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, "image/png");
}

function exportOne() {
  const canvas = renderCover(state, images, exportSize.w, exportSize.h);
  downloadCanvas(canvas, `vice-cover-${state.layout}-${exportSize.w}x${exportSize.h}.png`);
}

async function exportAll() {
  for (const size of SIZES) {
    const canvas = renderCover(state, images, size.w, size.h);
    downloadCanvas(canvas, `vice-cover-${state.layout}-${size.w}x${size.h}.png`);
    await new Promise((r) => setTimeout(r, 350));
  }
}

// Drag a photo inside its panel: pointer position maps back to canvas pixels,
// then the panel's ox/oy crop point follows the pointer.
function panelAt(clientX, clientY) {
  const box = preview.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * preview.width;
  const y = ((clientY - box.top) / box.height) * preview.height;
  const rects = panelRects(state.layout, preview.width, preview.height);
  const i = rects.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  return i === -1 ? null : { index: i, x, y, rect: rects[i] };
}

function drawnSize(img, rect, panel) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (panel.zoom || 1);
  return { w: img.naturalWidth * scale, h: img.naturalHeight * scale };
}

preview.addEventListener("pointerdown", (event) => {
  const hit = panelAt(event.clientX, event.clientY);
  if (!hit) return;
  const panel = visiblePanels()[hit.index];
  const img = images[panel.src];
  if (!img) return;
  preview.setPointerCapture(event.pointerId);
  preview.classList.add("dragging");
  drag = { ...hit, panel, startX: hit.x, startY: hit.y, drawn: drawnSize(img, hit.rect, panel) };
});

preview.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const box = preview.getBoundingClientRect();
  const x = ((event.clientX - box.left) / box.width) * preview.width;
  const y = ((event.clientY - box.top) / box.height) * preview.height;
  const { panel, rect, drawn } = drag;
  const dx = x - drag.startX;
  const dy = y - drag.startY;
  if (drawn.w > rect.w) {
    const from = rect.x + panel.ox * (rect.w - drawn.w);
    panel.ox = Math.min(1, Math.max(0, (from + dx - rect.x) / (rect.w - drawn.w)));
  }
  if (drawn.h > rect.h) {
    const from = rect.y + panel.oy * (rect.h - drawn.h);
    panel.oy = Math.min(1, Math.max(0, (from + dy - rect.y) / (rect.h - drawn.h)));
  }
  drag.startX = x;
  drag.startY = y;
  redraw();
});

function endDrag() {
  drag = null;
  preview.classList.remove("dragging");
}
preview.addEventListener("pointerup", endDrag);
preview.addEventListener("pointercancel", endDrag);

wirePicker("layoutRow", "layout", setLayout);
wirePicker("gradeRow", "grade", setGrade);
wirePicker("sizeRow", "size", setSize);

document.getElementById("titleInput").addEventListener("input", (e) => {
  state.title = e.target.value.toUpperCase();
  redraw();
});
document.getElementById("subtitleInput").addEventListener("input", (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById("toplineInput").addEventListener("input", (e) => {
  state.topline = e.target.value;
  redraw();
});
document.getElementById("exportOne").addEventListener("click", exportOne);
document.getElementById("exportAll").addEventListener("click", exportAll);

// Boot: apply any ?shot= preset, load the samples, draw, then signal ready.
const preset = applyShotPreset(state);
if (preset) {
  shotMode = preset.mode;
  if (preset.size) {
    exportSize = preset.size;
    document.querySelectorAll("#sizeRow .pick").forEach((b) => {
      b.classList.toggle("active", b.dataset.size === `${preset.size.w}x${preset.size.h}`);
    });
  }
  if (preset.mode === "cover") document.documentElement.classList.add("cover-shot");
  document.querySelectorAll("#layoutRow .pick").forEach((b) => {
    b.classList.toggle("active", b.dataset.layout === state.layout);
  });
  document.querySelectorAll("#gradeRow .pick").forEach((b) => {
    b.classList.toggle("active", b.dataset.grade === state.grade);
  });
  document.getElementById("titleInput").value = state.title;
  document.getElementById("subtitleInput").value = state.subtitle;
  document.getElementById("toplineInput").value = state.topline;
}
buildPanelControls();
loadAllSamples()
  .then(() => {
    redraw();
    return whenReady();
  })
  .then(() => {
    redraw();
    window.__shotReady = true;
  })
  .catch(() => {
    redraw();
    window.__shotReady = true;
  });
