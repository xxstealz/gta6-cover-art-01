# Vice Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/xxstealz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/xxstealz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover Studio** turns your photos and a caption into GTA-style cover art:
a multi-panel poster with bold lettering and a Vice City sunset or neon grade,
exported as a PNG to share. It runs entirely offline in your browser — your
photos never leave your machine.

## How to use it

1. Serve the app (no build step): `node serve.ts`, then open http://localhost:8080
   — or open `app/index.html` from any static file server.
2. Pick a layout: **Trio** (one big panel over two), **Split** (two halves) or
   **Hero** (one full photo).
3. Give each panel a photo: upload your own, or use a sample. Drag the preview
   to reposition a photo, or use its zoom slider.
4. Write your title, subtitle and tag line.
5. Pick a grade — **Sunset**, **Neon** or **Dusk** — and an export size:
   1080 × 1080, 1080 × 1350 or 1920 × 1080.
6. Hit **Export PNG**. Done — share it anywhere.

## What is inside

- `app/` — the whole app: `index.html`, `style.css`, `src/cover.js` (the
  drawing engine: panels, grade wash, retro sun, lettering), `src/main.js`
  (controls, drag-to-pan, export), `src/shots.js` (fixed screenshot scenes),
  `samples/` (two free-to-use sample photos), `fonts/` (Anton and Liberation
  Sans Bold, both SIL Open Font License).
- `main.ts` — the program that hands the app in: it copies `app/` and
  `screenshots/` to `/output` and writes `/output/dossier.json`.
- `screenshots/` — 3–4 screenshots of the app at work and the covers it exports.
- `serve.ts` — a tiny local static server for trying the app.

Everything in the app is original work: no Rockstar Games logo, artwork,
character or font. The two sample photos were made for make.fun with an image
model and are free to use.

## License

MIT — see `LICENSE`. Fonts under `app/fonts/` are licensed under the SIL Open
Font License.
