// Wires Vice Cover Studio: layout, per-panel photos, caption, grade, export sizes.
// Dragging the preview pans the photo under the pointer; `?shot=` sets up a fixed
// scene for screenshots instead (see shots.js).
import { LAYOUTS, drawCover, renderExport, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelsBox = document.getElementById('panels');

const SAMPLES = ['pier.jpg', 'boulevard.jpg'];

const state = {
  layout: 'trio',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  subtitle: 'One last job under a neon sky',
  tag: 'SOLMAR BAY · 2026',
  size: '1080x1080',
  panels: [],
};

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function ensurePanels() {
  while (state.panels.length < panelCount()) {
    state.panels.push({ img: null, zoom: 1, ox: 0, oy: 0, sample: SAMPLES[state.panels.length % 2] });
  }
  state.panels.length = panelCount();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  ensurePanels();
  drawCover(canvas, state);
}

function buildPanelControls() {
  ensurePanels();
  panelsBox.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const box = document.createElement('div');
    box.className = 'panel';
    box.innerHTML = `
      <h3>Panel ${i + 1}${i === 0 ? ' — hero' : ''}</h3>
      <div class="row">
        <select aria-label="Sample photo for panel ${i + 1}">
          <option value="">Sample photo…</option>
          ${SAMPLES.map((s) => `<option value="${s}"${panel.sample === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
        <label style="margin:0">Upload <input type="file" accept="image/*" aria-label="Upload photo for panel ${i + 1}"></label>
      </div>
      <div class="zoom"><span>Zoom</span><input type="range" min="1" max="2.5" step="0.05" value="${panel.zoom}" aria-label="Zoom panel ${i + 1}"><span>${panel.zoom.toFixed(2)}×</span></div>`;
    box.querySelector('select').addEventListener('change', async (e) => {
      panel.sample = e.target.value;
      if (!panel.sample) return;
      panel.img = await loadImage(`samples/${panel.sample}`);
      panel.zoom = 1; panel.ox = 0; panel.oy = 0;
      redraw();
    });
    box.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      panel.img = await loadImage(URL.createObjectURL(file));
      panel.sample = '';
      box.querySelector('select').value = '';
      panel.zoom = 1; panel.ox = 0; panel.oy = 0;
      redraw();
    });
    const zoom = box.querySelector('input[type=range]');
    zoom.addEventListener('input', () => {
      panel.zoom = Number(zoom.value);
      zoom.nextElementSibling.textContent = `${panel.zoom.toFixed(2)}×`;
      redraw();
    });
    panelsBox.appendChild(box);
  });
}

// Drag to pan: find the panel under the pointer and shift its photo.
let drag = null;
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = (clientX - r.left) / r.width * canvas.width;
  const y = (clientY - r.top) / r.height * canvas.height;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const i = rects.findIndex((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
  return i === -1 ? null : { index: i, rect: rects[i], x, y };
}
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  drag = { ...hit, startX: e.clientX, startY: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const panel = state.panels[drag.index];
  panel.ox += (e.clientX - drag.startX) / r.width * (canvas.width / drag.rect.w);
  panel.oy += (e.clientY - drag.startY) / r.height * (canvas.height / drag.rect.h);
  drag.startX = e.clientX;
  drag.startY = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

function wirePicker(id, key, onPick) {
  document.getElementById(id).addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-' + key + ']');
    if (!btn) return;
    document.querySelectorAll(`#${id} button`).forEach((b) => b.classList.remove('picked'));
    btn.classList.add('picked');
    onPick(btn.dataset[key]);
  });
}
wirePicker('layoutRow', 'layout', (v) => { state.layout = v; buildPanelControls(); redraw(); });
wirePicker('gradeRow', 'grade', (v) => { state.grade = v; redraw(); });
wirePicker('sizeRow', 'size', (v) => { state.size = v; });

['title', 'subtitle', 'tag'].forEach((id) => {
  document.getElementById(id).addEventListener('input', (e) => {
    state[id] = e.target.value;
    redraw();
  });
});

document.getElementById('export').addEventListener('click', async () => {
  status.textContent = 'Rendering…';
  const blob = await renderExport(state, state.size);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${state.size}.png`;
  a.click();
  status.textContent = `Saved vice-cover-${state.size}.png (${(blob.size / 1024).toFixed(0)} KiB)`;
});

async function loadSamples() {
  ensurePanels();
  for (const panel of state.panels) {
    if (!panel.img && panel.sample) {
      try { panel.img = await loadImage(`samples/${panel.sample}`); } catch { /* sample missing: keep panel blank */ }
    }
  }
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (scene) => {
    state.layout = scene.layout || state.layout;
    state.grade = scene.grade || state.grade;
    state.title = scene.caption ?? state.title;
    state.subtitle = scene.subtitle ?? state.subtitle;
    state.tag = scene.tag ?? state.tag;
    state.size = scene.size || state.size;
    ensurePanels();
    const photos = scene.photos || [];
    for (let i = 0; i < state.panels.length; i += 1) {
      const name = photos[i] || SAMPLES[i % SAMPLES.length];
      state.panels[i].sample = name;
      state.panels[i].img = await loadImage(`samples/${name}`);
      // A scene may nudge a panel's framing (dusk's hero pan keeps the face
      // in frame); scenes without pan keep the centred default.
      const pan = (scene.pan && scene.pan[i]) || {};
      state.panels[i].ox = pan.ox || 0;
      state.panels[i].oy = pan.oy || 0;
    }
    document.getElementById('title').value = state.title;
    document.getElementById('subtitle').value = state.subtitle;
    document.getElementById('tag').value = state.tag;
    document.querySelectorAll('#layoutRow button').forEach((b) => b.classList.toggle('picked', b.dataset.layout === state.layout));
    document.querySelectorAll('#gradeRow button').forEach((b) => b.classList.toggle('picked', b.dataset.grade === state.grade));
    document.querySelectorAll('#sizeRow button').forEach((b) => b.classList.toggle('picked', b.dataset.size === state.size));
    buildPanelControls();
    redraw();
  });
} else {
  buildPanelControls();
  document.fonts.ready.then(async () => {
    await loadSamples();
    redraw();
  });
}
