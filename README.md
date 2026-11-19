# Vice Cover Studio

An offline web app that turns your photos and a caption into GTA-style
cover art — the multi-panel poster look with bold lettering and a Vice City
sunset or neon grade — and exports it as a PNG to share.

## Use it

```sh
node serve.ts
```

Open the printed address in desktop Chrome. Pick a layout, load a photo per
panel (or use the two bundled samples), drag a photo to reposition it, set
its zoom, edit the title, subtitle and top line, pick a grade, then download
the PNG.

## What it does

- **3 layouts**: Trio (one big panel over two), Split (two halves), Hero
  (one full photo).
- **Per panel**: your own upload or a bundled sample, drag to reposition,
  zoom slider. Photos are read on your machine and never uploaded.
- **Caption**: editable title in Anton, subtitle and top line in bold sans.
- **3 grades**: Sunset, Neon and Dusk — each a colour wash, a retro
  striped sun, a vignette and its own title gradient. The Hero panel keeps
  the top of a square photo in frame, so a face and hat stay whole with
  sky above them.
- **Export PNG** at exactly 1080 × 1080, 1080 × 1350 or 1920 × 1080, one
  size at a time or all three at once.

## Files

- `app/index.html` — the page: controls on the left, live preview on the right.
- `app/style.css` — dark Vice theme; Anton and Vice Sans from `app/fonts/`.
- `app/src/cover.js` — the cover renderer (panels, grade, sun, lettering).
- `app/src/main.js` — editor wiring: controls, drag, uploads, exports.
- `app/src/shots.js` — `?shot=` presets for deterministic screenshots.
- `app/samples/` — two bundled sample photos, made with an image model.
- `app/fonts/` — Anton and Liberation Sans Bold under the SIL Open Font License.
- `main.ts` — hands the app in: copies `app/` and `screenshots/` and
  writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — tiny static server for local testing.
- `shots.json` — the four screenshot scenes (see below).

## Screenshots

Taken with headless Chromium against the local server, waiting for
`window.__shotReady`, from the scenes in `shots.json`:

1. `1-cover.jpg` — Trio cover, Sunset, “SUNSET HEIST”.
2. `2-editor.jpg` — the editor with photos loaded.
3. `3-cover.jpg` — Split cover, Neon, “NEON NIGHTS”.
4. `4-cover.jpg` — Hero cover, Dusk, “SOLMAR BAY” (wide 16:9 export).

## Originality

Everything here is the entrant's own design. No Rockstar Games logo,
wordmark, artwork, character or font is used. The fonts are Anton and
Liberation Sans Bold, shipped under the SIL Open Font License
(see `app/fonts/OFL.txt`).

## License

MIT — see `LICENSE`.
