#!/usr/bin/env node
/* details-feed builder — one static page per variant module.

   Run:  node build/build.js            (from details-feed/, or anywhere)

   No npm dependencies. The whole build is:

     1. copy the captured CSS + fonts into details-feed/, rewriting the
        font URLs to be relative                              (lib/assets.js)
     2. strip the runtime out of the captured details.html and substitute
        the fictional content into the shell                  (lib/shell.js)
     3. render the 165 events as production row markup         (lib/rows.js)
     4. for each build/variants/*.js, hand it that list markup and write
        the page its metadata names
     5. write index.html from the same metadata

   Step 4 is the ONLY thing that differs between pages: every variant is
   the identical production shell with one aggregation layer applied to the
   centre list. See build/README.md for the contract. */

'use strict';

const fs = require('fs');
const path = require('path');

const { copyAssets } = require('./lib/assets');
const { stripRuntime, fillShell } = require('./lib/shell');
const { buildIcons, assertIconsMatchCapture, makeRowHtml, flatten } = require('./lib/rows');
const { groupHeader, group, fold } = require('./lib/aggregate');
const { chartSvg } = require('./lib/chart');
const { escape, replaceOnce, assertAbsent } = require('./lib/html');
const { renderIndex } = require('./lib/index-page');

const OUT = path.resolve(__dirname, '..');
const CAPTURE = path.resolve(OUT, '..', '..', 'real-capture');
const VARIANT_DIR = path.join(__dirname, 'variants');

/* The run is 2 h 24 m in and the playback head sits at the end. */
const PLAYBACK_TIME = '2:24:07';
const PLAYBACK_SECONDS = 2 * 3600 + 24 * 60 + 7;
/* Wall-clock start of the selected substep, for the throughput chart's
   x-axis (the app plots HH:MM, not an offset). */
const SUBSTEP_START_CLOCK = '14:36:00';

/* ------------------------------------------------------------------ data */

function loadData() {
  const sandbox = { window: {} };
  const src = fs.readFileSync(path.join(OUT, 'shared', 'data.js'), 'utf8');
  new Function('window', src)(sandbox.window);
  const data = sandbox.window.AII;
  if (!data || !data.SUBSTEP) throw new Error('shared/data.js did not define window.AII');
  return data;
}

/* --------------------------------------------------------------- variants */

/* ONLY=<file.js> builds one variant and leaves index.html alone, so an
   in-progress sibling module cannot break someone else's build. prev/next
   on that page are stale until the next full build. */
const ONLY = process.env.ONLY || '';

function loadVariants() {
  let files = fs.readdirSync(VARIANT_DIR).filter((f) => f.endsWith('.js')).sort();
  if (ONLY) {
    if (!files.includes(ONLY)) throw new Error('ONLY=' + ONLY + ' is not in build/variants/');
    files = files.filter((f) => f === ONLY);
  }
  return files.map((f) => {
    const v = require(path.join(VARIANT_DIR, f));
    for (const key of ['id', 'file', 'name', 'premise', 'needs']) {
      if (!v[key]) throw new Error(f + ': variant is missing "' + key + '"');
    }
    if (typeof v.transform !== 'function') {
      throw new Error(f + ': variant has no transform(listHtml, ctx)');
    }
    return v;
  });
}

/* ------------------------------------------------------------------ pages */

function pageHtml(template, variant, ctx) {
  let h = template;

  /* the centre list, after this variant's aggregation layer */
  const listHtml = variant.transform(ctx.baseList, ctx);
  if (typeof listHtml !== 'string') {
    throw new Error(variant.file + ': transform() must return a string');
  }
  h = replaceOnce(h, ctx.LIST_SLOT, listHtml);

  /* per-variant CSS and JS, always present so the shape is predictable */
  h = replaceOnce(h, '<style id="variant"></style>',
    '<style id="variant">' + (variant.css || '') + '</style>');
  h = replaceOnce(h, '<script id="variant"></script>',
    '<script id="variant">' + (variant.js || '') + '</script>');

  h = replaceOnce(h, '__PAGE_JSON__', JSON.stringify({
    id: variant.id,
    variant: variant.name,
    premise: variant.premise,
    prev: ctx.prev,
    next: ctx.next
  }));
  h = replaceOnce(h, 'data-page="__PAGE_ID__"', 'data-page="' + escape(variant.id) + '"');
  return h;
}

/* ------------------------------------------------------------------- main */

function main() {
  const data = loadData();
  const rowtypes = JSON.parse(fs.readFileSync(path.join(CAPTURE, 'rowtypes.json'), 'utf8'));

  const assets = copyAssets({
    captureDir: CAPTURE,
    outDir: OUT,
    logoSrc: '/home/adrian/projects/ai-inventor/aii_frontend/public/logo_64.png'
  });

  const icons = buildIcons(rowtypes);
  assertIconsMatchCapture(rowtypes, icons);
  const rowHtml = makeRowHtml(icons);

  const events = flatten(data.SUBSTEP);
  if (events.length !== data.SUBSTEP.events) {
    throw new Error('rows: flattened ' + events.length + ' events, SUBSTEP.events says ' +
      data.SUBSTEP.events);
  }
  const baseList = events.map((ev) => rowHtml(ev)).join('');

  /* one template, built once; the list is a placeholder the variants fill */
  const LIST_SLOT = '<!--AII_FEED_LIST-->';
  const raw = fs.readFileSync(path.join(CAPTURE, 'details.html'), 'utf8');
  let template = fillShell(stripRuntime(raw), {
    data,
    listHtml: LIST_SLOT,
    chartSvg: chartSvg(data.SUBSTEP, { startClock: SUBSTEP_START_CLOCK }),
    playbackTime: PLAYBACK_TIME,
    playbackSeconds: PLAYBACK_SECONDS
  });
  template = injectChrome(template);

  const variants = loadVariants();
  const ctx = {
    data,
    rowHtml,
    escape,
    groupHeader,
    group,
    fold,
    events,
    baseList,
    LIST_SLOT
  };

  const written = [];
  variants.forEach((v, i) => {
    const html = pageHtml(template, v, Object.assign({}, ctx, {
      prev: i === 0 ? 'index.html' : variants[i - 1].file,
      next: i === variants.length - 1 ? 'index.html' : variants[i + 1].file
    }));
    assertPage(html, v);
    fs.writeFileSync(path.join(OUT, v.file), html);
    written.push(v.file + ' (' + Math.round(html.length / 1024) + ' kB)');
  });

  if (!ONLY) {
    const index = renderIndex(variants, data);
    fs.writeFileSync(path.join(OUT, 'index.html'), index);
    written.push('index.html (' + Math.round(index.length / 1024) + ' kB)');
  }

  console.log('css:   ' + assets.files.join(', ') + ' -> css/all.css (' +
    Math.round(assets.bytes / 1024) + ' kB)');
  console.log('fonts: ' + assets.fonts.join(', ') +
    (assets.logo ? '  |  logo: assets/' + assets.logo : ''));
  console.log('rows:  ' + events.length + ' events, ' + data.SUBSTEP.turns.length + ' turns');
  console.log('pages: ' + written.join('\n       '));
}

/* Everything that is NOT the product: our stylesheets and scripts, the
   review bar's page object, the feedback widget's page id, the per-variant
   style/script slots, and the --composer-h measurement production does with
   a ResizeObserver in the run layout. */
function injectChrome(html) {
  let h = html;

  h = replaceOnce(h, '</head>', '<style id="variant"></style></head>');

  h = replaceOnce(h, '<body class="font-sans antialiased">',
    '<body class="font-sans antialiased" data-page="__PAGE_ID__">');

  h = replaceOnce(h, '</body>',
    '<script>window.__PAGE = __PAGE_JSON__;</script>' +
    '<script src="shared/data.js"></script>' +
    '<script src="shared/review.js"></script>' +
    '<script src="shared/feedback.js"></script>' +
    '<script src="shared/feed.js"></script>' +
    '<script id="variant"></script>' +
    '</body>');
  return h;
}

/* A page that still carries the scrub's placeholders is a build failure, not
   something to notice in a screenshot. */
function assertPage(html, variant) {
  assertAbsent(html, ['proxy.runpod', '_next/static', 'Lorem ipsum', 'lorem ipsum',
    '0:00:00', '__PAGE_JSON__', '__PAGE_ID__'], variant.file);
  if (/>\s*Lore\s*</.test(html)) throw new Error(variant.file + ': "Lore" fragment survived');
  if (html.indexOf('<!--AII_FEED_LIST-->') !== -1) {
    throw new Error(variant.file + ': the list slot was not filled');
  }
}

main();
