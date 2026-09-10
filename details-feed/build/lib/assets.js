/* Copy the captured stylesheet bundle and font files into details-feed/.

   The only edit is the font URL: the capture references
   `/_next/static/media/<hash>.woff2` (root-relative, because the scrub
   stripped the deploy host). These pages are opened from the filesystem, so
   every such URL is rewritten to `../fonts/<hash>.woff2` — relative to
   css/, which is where the stylesheets land.

   `css/all.css` is the three details-page stylesheets concatenated in the
   manifest's document order (01 @font-face, 02 the Tailwind build, 03 the
   inline block). Entry 04 is Overview-only and is skipped. Each file is
   also written individually so the source order stays inspectable. */

'use strict';

const fs = require('fs');
const path = require('path');

const MEDIA_RE = /url\(\/_next\/static\/media\/([^)]+)\)/g;

function copyAssets({ captureDir, outDir, logoSrc }) {
  const cssOut = path.join(outDir, 'css');
  const fontsOut = path.join(outDir, 'fonts');
  fs.mkdirSync(cssOut, { recursive: true });
  fs.mkdirSync(fontsOut, { recursive: true });

  const manifest = JSON.parse(
    fs.readFileSync(path.join(captureDir, 'css', 'manifest.json'), 'utf8'));
  const fontMap = JSON.parse(
    fs.readFileSync(path.join(captureDir, 'fonts', 'map.json'), 'utf8'));

  /* fonts — map.json keys are the URL as the stylesheets write it */
  const fontFiles = [];
  for (const [url, entry] of Object.entries(fontMap.fonts)) {
    const base = path.basename(entry.file);
    fs.copyFileSync(path.join(captureDir, entry.file), path.join(fontsOut, base));
    fontFiles.push({ url, base });
  }

  /* stylesheets — details pages only, manifest order */
  const parts = [];
  const written = [];
  for (const e of manifest.entries.filter((x) => x.pages.includes('details'))) {
    const raw = fs.readFileSync(path.join(captureDir, 'css', e.file), 'utf8');
    const fixed = raw.replace(MEDIA_RE, (m, file) => 'url(../fonts/' + file + ')');
    fs.writeFileSync(path.join(cssOut, e.file), fixed);
    written.push(e.file);
    parts.push('/* ' + e.file + ' — capture order ' + e.order + ' */\n' + fixed);
  }

  /* The app's own wordmark. The capture routes it through Next's image
     optimiser (`/_next/image?url=%2Flogo_64.png`), which does not exist on
     a filesystem page; the source file does, in aii_frontend/public. It is
     product chrome, not run content. */
  let logo = null;
  if (logoSrc && fs.existsSync(logoSrc)) {
    fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
    logo = 'logo_64.png';
    fs.copyFileSync(logoSrc, path.join(outDir, 'assets', logo));
  }

  const all = parts.join('\n');
  if (/_next\/static/.test(all)) {
    throw new Error('assets: a /_next/static reference survived the rewrite');
  }
  for (const f of fontFiles) {
    if (all.indexOf('../fonts/' + f.base) === -1) {
      throw new Error('assets: font ' + f.base + ' is not referenced by all.css');
    }
  }
  fs.writeFileSync(path.join(cssOut, 'all.css'), all);

  return { files: written, fonts: fontFiles.map((f) => f.base), logo, bytes: all.length };
}

module.exports = { copyAssets };
