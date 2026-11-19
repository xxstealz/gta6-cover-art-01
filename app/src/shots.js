// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover hides the controls and shows the cover alone. The `scene`
// query picks a preset layout/grade/caption/photo set. window.__shotReady is set
// once the scene has painted, so a headless screenshot can wait for it.
const SCENES = {
  sunset: {
    layout: 'trio', grade: 'sunset', caption: 'SUNSET HEIST',
    subtitle: 'One last job under a neon sky', tag: 'SOLMAR BAY · 2026',
    photos: ['pier.jpg', 'boulevard.jpg', 'pier.jpg'], size: '1080x1080',
  },
  neon: {
    layout: 'split', grade: 'neon', caption: 'NEON NIGHTS',
    subtitle: 'The city never sleeps, neither do we', tag: 'SOLMAR BAY · 2026',
    photos: ['boulevard.jpg', 'pier.jpg'], size: '1080x1350',
  },
  dusk: {
    layout: 'hero', grade: 'dusk', caption: 'SOLMAR BAY',
    subtitle: 'Where the sunset never ends', tag: 'VICE COVER STUDIO',
    photos: ['pier.jpg'], size: '1920x1080',
    // Hero is 16:9 against a square photo: cover-fit centres it, which crops
    // the top of the subject's head. Nudge this panel down so the face keeps
    // headroom. Other scenes have no pan and are unaffected.
    pan: [{ oy: 0.2 }],
  },
};

export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const scene = SCENES[query.get('scene') || 'sunset'] || SCENES.sunset;
  const canvas = document.getElementById('cover');
  const [w, h] = (scene.size || '1080x1080').split('x').map(Number);
  if (shot === 'cover') {
    canvas.width = w;
    canvas.height = h;
  }
  await document.fonts.ready;
  await apply(scene);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
