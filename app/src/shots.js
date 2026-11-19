// Vice Cover Studio — screenshot presets.
// Reads the ?shot= query string and applies a scene to the editor state so a
// headless browser can capture a deterministic cover or editor screenshot.
//   ?shot=cover&layout=trio&grade=sunset&title=SUNSET%20HEIST
//     &subtitle=One%20last%20job&topline=SOLMAR%20BAY&size=1080x1080
//     &panels=pier,boulevard,pier
//   ?shot=editor&layout=trio&grade=sunset&...
// size is one of 1080x1080, 1080x1350, 1920x1080. panels is a comma list of
// sample keys (pier, boulevard) in panel order. oy pins the first panel's
// vertical crop: 0 keeps the top of the photo (headroom for a face + hat).

import { SIZES } from "./cover.js";

const SAMPLES = ["pier", "boulevard"];

function readParams() {
  return new URLSearchParams(window.location.search);
}

export function applyShotPreset(state) {
  const q = readParams();
  const mode = q.get("shot");
  if (!mode) return null;

  const layout = q.get("layout");
  if (layout === "trio" || layout === "split" || layout === "hero") state.layout = layout;

  const grade = q.get("grade");
  if (grade === "sunset" || grade === "neon" || grade === "dusk") state.grade = grade;

  const title = q.get("title");
  if (title) state.title = title.toUpperCase();
  const subtitle = q.get("subtitle");
  if (subtitle) state.subtitle = subtitle;
  const topline = q.get("topline");
  if (topline) state.topline = topline;

  const panels = q.get("panels");
  if (panels) {
    const keys = panels.split(",").map((s) => s.trim()).filter((s) => SAMPLES.includes(s));
    keys.forEach((key, i) => {
      if (state.panels[i]) state.panels[i].src = key;
    });
  }

  // Vertical crop for the first panel: 0 = top of the photo visible.
  // The hero panel is wide and short, so a square photo's top (sky, hat,
  // face) must stay in frame — never default it to the middle.
  const oy = q.get("oy");
  if (oy !== null && state.panels[0]) {
    state.panels[0].oy = Math.min(1, Math.max(0, Number(oy) || 0));
  } else if (state.layout === "hero" && state.panels[0]) {
    state.panels[0].oy = 0;
  }
  // Same guard for the trio top panel: it is wide too, so keep its top.
  if (state.layout === "trio" && oy === null && state.panels[0]) {
    state.panels[0].oy = 0;
  }

  const size = SIZES.find((s) => `${s.w}x${s.h}` === q.get("size"));
  return { mode, size: size || null };
}

// Wait for the bundled fonts (and a beat for images) before a screenshot.
export function whenReady() {
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
  return Promise.race([fonts, timeout]);
}
