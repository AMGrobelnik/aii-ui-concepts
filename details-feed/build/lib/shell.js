/* Turn real-capture/details.html into the mockup template.

   Two passes:

     stripRuntime()  removes everything that would try to talk to a server —
                     every <script>, the preload/modulepreload/prefetch
                     links, <noscript>, and the two Next.js stylesheet hrefs
                     (repointed at the local bundle). Asserts afterwards that
                     no `proxy.runpod` and no `_next/static/chunks` remain.

     fillShell()     replaces the scrub's `Lorem ipsum` / all-zero
                     placeholders with the fictional dataset, region by
                     region, matching by the selectors in
                     real-capture/structure.md.

   Every substitution goes through replaceOnce(), which throws if its anchor
   is missing OR ambiguous. That is deliberate: a build that silently leaves
   `Lorem ipsum` on the page is worse than a build that fails. */

'use strict';

const { replaceOnce, replaceAll, replaceElement, replaceInner, dropElements,
  escape, assertAbsent } = require('./html');

/* ================================================================== 1/2 */

const APP_ROOT_OPEN = '<div class="flex h-dvh flex-col bg-ink-75 md:flex-row">';

function stripRuntime(raw) {
  let h = raw;

  h = dropElements(h, /<script\b/g);
  h = dropElements(h, /<noscript\b/g);
  h = h.replace(/<link\b[^>]*rel="(?:preload|modulepreload|prefetch)"[^>]*>/g, '');

  /* the two Next.js stylesheets -> one local bundle, plus our own chrome */
  h = replaceOnce(h,
    '<link rel="stylesheet" href="/_next/static/css/ec62c2e9a8823dc7.css" data-precedence="next">' +
    '<link rel="stylesheet" href="/_next/static/css/933d10ac4d1273da.css" data-precedence="next">',
    '<link rel="stylesheet" href="css/all.css">' +
    '<link rel="stylesheet" href="shared/feed.css">' +
    '<link rel="stylesheet" href="shared/review.css">');

  /* the wordmark <img> and the two favicons are absolute paths served by
     Next; point all three at the copy in assets/ */
  h = h.replace(/ srcset="\/_next\/image[^"]*"/g, '')
    .replace(/src="\/_next\/image[^"]*"/g, 'src="assets/logo_64.png"')
    .replace(/<link rel="icon" href="\/favicon\.ico"[^>]*>/,
      '<link rel="icon" href="assets/logo_64.png" type="image/png">')
    .replace(/<link rel="icon" href="\/icon\.png[^>]*>/, '');

  /* the app root gets an id so review.css can subtract the review bar */
  h = replaceOnce(h, APP_ROOT_OPEN,
    '<div id="app-root" class="flex h-dvh flex-col bg-ink-75 md:flex-row">');

  assertAbsent(h, ['proxy.runpod', '_next/static/chunks', '_next/static/css',
    '_next/static/media', '<script', '<noscript'], 'stripRuntime');
  return h;
}

/* ================================================================== 2/2 */

/* The privacy scrub replaced every user-visible string with `Lorem ipsum` of
   the same length and every digit with `0`. Rather than quote those
   placeholders back (which would leave the scrub's own marker text in this
   repo, and would break the moment a capture is re-taken at a different
   length), each anchor below writes `§` where the scrubbed value sits and
   `fillOnce` matches whatever is actually there.

   Real aria-labels come from real-capture/notes.md, which records the ones
   the scrub flattened, and from the frontend source for the rest. */

const ANY = '§';

/**
 * fillOnce(html, pattern, ...values)
 *
 * `pattern` is literal markup with `§` marking each scrubbed span. The
 * pattern must match EXACTLY ONCE — zero matches or two are both build
 * failures, because a silent miss leaves placeholder text on the page.
 */
function fillOnce(html, pattern, ...values) {
  const parts = pattern.split(ANY);
  if (parts.length - 1 !== values.length) {
    throw new Error('fillOnce: ' + (parts.length - 1) + ' markers but ' +
      values.length + ' values -> ' + pattern.slice(0, 80));
  }
  const re = new RegExp(parts.map(escapeRe).join('([^"<>]*)'), 'g');
  const hits = html.match(re);
  if (!hits) throw new Error('anchor not found: ' + pattern.slice(0, 100));
  if (hits.length > 1) {
    throw new Error('anchor is ambiguous (' + hits.length + '): ' + pattern.slice(0, 100));
  }
  const out = parts.reduce((acc, part, i) =>
    acc + part + (i < values.length ? String(values[i]) : ''), '');
  return html.replace(re, () => out);
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/* [pattern, ...values] — one row per scrubbed string in the shell. */
const ARIA = [
  ['<section aria-label="§" tabindex="-1"', 'Notifications'],
  ['<button type="button" aria-label="§" class="h-[44px] w-[44px]', 'Open menu'],
  ['<button type="button" aria-label="§" class="h-[28px] w-[28px] rounded-md border-none',
    'Collapse sidebar'],
  ['aria-label="§" data-state="closed" data-slot="tooltip-trigger">' +
    '<span class="grid h-5 w-5 shrink-0 place-items-center">', 'Search runs'],
  ['<button type="button" aria-label="§" class="touch-target flex h-[24px] w-[24px]', 'Play'],
  ['<div role="slider" tabindex="0" aria-label="§"', 'Playback position'],
  /* Share and Bug are the same button class; radix's own generated id is
     what tells them apart in the capture. */
  ['<button type="button" aria-label="§" class="grid h-[28px] w-[28px] place-items-center' +
    ' rounded text-ink-900 transition-colors hover:bg-black/[.05]" aria-haspopup="dialog"' +
    ' aria-expanded="false" aria-controls="radix-_r_p_"', 'Share run'],
  ['<button type="button" aria-label="§" class="grid h-[28px] w-[28px] place-items-center' +
    ' rounded text-ink-900 transition-colors hover:bg-black/[.05]" aria-haspopup="dialog"' +
    ' aria-expanded="false" aria-controls="radix-_r_s_"', 'Report a bug or send feedback'],
  ['aria-label="§" data-state="closed" data-slot="tooltip-trigger"><svg xmlns=' +
    '"http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"' +
    ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
    ' class="lucide lucide-file-text h-4 w-4"', 'Open paper PDF'],
  ['aria-label="§" data-state="closed" data-slot="tooltip-trigger"><svg viewBox="0 0 24 24"' +
    ' fill="currentColor"', 'Open GitHub repo'],
  ['<section aria-label="§" class="composer-clearance hidden flex-col', 'Run structure'],
  /* the two lg:hidden sheet triggers, told apart by radix's generated id */
  ['aria-controls="radix-_r_10_" data-state="closed" data-slot="sheet-trigger"' +
    ' aria-label="§"', 'Show tree'],
  ['aria-controls="radix-_r_13_" data-state="closed" data-slot="sheet-trigger"' +
    ' aria-label="§"', 'Show files and stats'],
  ['<button type="button" aria-label="§" class="touch-target flex h-5 w-5 items-center' +
    ' justify-center rounded text-[11px]', 'Close panel'],
  ['aria-label="§" class="inline-flex h-[16px] shrink-0 items-center gap-[3px] rounded-full' +
    ' border px-[5px]', 'Send mode: Fork. Sends this message as a fork of the run from here.'],
  ['type="button" aria-label="§" aria-expanded="false" class="inline-flex size-[16px]',
    'What does send mode do?'],
  ['data-slot="popover-trigger" aria-label="§" class="touch-target grid h-[32px] w-[32px]',
    'Attach files'],
  ['<button type="button" disabled="" aria-label="§"', 'Send message'],
  /* single-character glyphs the scrub flattened to "l" */
  ['hover:bg-black/[0.04] hover:text-ink-700">§</button>', '✕'],
  ['<span aria-hidden="true" class="text-[8px] opacity-70">§</span>', '▾'],
  /* the tree sheet trigger's own label text, truncated by the scrub */
  ['<path d="M9 3v18"></path></svg>§</button>', 'Tree']
];

function fillShell(html, ctx) {
  const { data, listHtml, chartSvg } = ctx;
  const RUN = data.RUN;
  const SUB = data.SUBSTEP;
  let h = html;

  /* --- head ---------------------------------------------------------- */
  h = fillOnce(h, '<meta name="viewport" content="§">',
    'width=device-width, initial-scale=1');
  h = fillOnce(h, '<title>§</title>', escape(RUN.title) + ' — AI Inventor');
  h = fillOnce(h, '<meta name="description" content="§">',
    'AI Inventor run details — ' + escape(RUN.title));

  /* --- aria-labels and stray glyphs ---------------------------------- */
  for (const [pattern, ...values] of ARIA) h = fillOnce(h, pattern, ...values);

  /* --- sidebar: Search badge + the Recents list ----------------------- */
  h = fillOnce(h, 'text-blue-600 transition-opacity duration-100 opacity-100">§</span>',
    data.RUNS.length);
  h = replaceElement(h, '<nav aria-label=', recentsNav(data));

  /* --- topbar --------------------------------------------------------- */
  h = fillOnce(h, 'aria-label="§" class="w-full max-w-[160px]', escape(RUN.title));
  h = fillOnce(h, '<span class="block truncate">§</span>', escape(RUN.title));
  h = fillOnce(h, 'tabular-nums bg-black/[0.04] text-black/55">§</span>',
    escape(ctx.playbackTime));
  h = fillOnce(h,
    'aria-valuemin="0" aria-valuemax="§" aria-valuenow="§" aria-valuetext="§ of §"',
    ctx.playbackSeconds, ctx.playbackSeconds,
    escape(ctx.playbackTime), escape(ctx.playbackTime));

  /* --- left tree ------------------------------------------------------ */
  h = fillPhaseCards(h, data);
  h = replaceElement(h,
    '<div class="relative pl-[20px]"><div class="absolute -top-[16px] bottom-3 left-[4px]',
    substepList(data));

  /* --- right panel ---------------------------------------------------- */
  h = statTile(h, 'Cost', money(SUB.cost), thousands(SUB.tokens) + ' tokens');
  h = statTile(h, 'Runtime', compactDuration(SUB.duration), SUB.name);
  h = statTile(h, 'Messages', String(SUB.events), SUB.name);
  h = replaceElement(h, '<canvas data-zr-dom-id="zr_0.0"', chartSvg);
  h = fillOnce(h, '_echarts_instance_="§"', 'token-throughput');

  /* --- composer ------------------------------------------------------- */
  h = fillOnce(h, '<textarea placeholder="§"',
    'Message \'' + escape(SUB.module) + '\'...');
  /* The agent-backend chip (the one with the capacity dot; the sibling
     "Lite" chip was not scrubbed). BACKEND_LABELS in
     aii_frontend/features/run-config/run-settings.ts. */
  h = fillOnce(h,
    '<span aria-hidden="true" data-slot="capacity-dot" data-state="unknown"' +
    ' class="inline-block h-2 w-2 shrink-0 rounded-full bg-black/20"></span>' +
    '<span class="truncate font-medium text-ink-900">§</span>',
    'Claude Agent');

  /* --- centre list ---------------------------------------------------- */
  h = replaceOnce(h, '<div class="px-4 py-2">', '<div class="px-4 py-2" data-feed-list="true">');
  h = replaceInner(h, '<div class="px-4 py-2" data-feed-list="true">', listHtml);

  return h;
}

/* ---------------------------------------------------------------- parts */

function money(v) { return '$' + Number(v).toFixed(2); }
function thousands(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

/* "5 m 12 s" -> "5m 12s", the shape the stat tile uses ("1h 58m"). */
function compactDuration(s) { return String(s).replace(/\s+([a-z])/g, '$1'); }

/* The current run's sidebar row carries aria-current + the completed check;
   every other row is the plain <a>. Both templates are verbatim capture. */
function recentsNav(data) {
  const rows = data.RUNS.map((r) => recentRow(r, r.id === data.RUN.id)).join('');
  return '<nav aria-label="Recent runs" class="min-h-0 flex-1 overflow-y-auto ' +
    'overscroll-contain transition-all duration-150 opacity-100">' +
    '<div class="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.8px] ' +
    'text-sand-600 uppercase">Recents</div>' +
    '<div class="px-2 py-0.5">' + rows + '</div></nav>';
}

const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"' +
  ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
  ' stroke-linejoin="round" class="lucide lucide-check h-3 w-3 shrink-0 text-emerald-700"' +
  ' aria-label="Completed"><path d="M20 6 9 17l-5-5"></path></svg>';

const ELLIPSIS_BTN =
  '<div class="absolute top-0 right-0 bottom-0 flex items-center pr-1 pl-6 transition-opacity' +
  ' duration-100 pointer-fine:pointer-events-none pointer-fine:opacity-0' +
  ' pointer-fine:group-hover:pointer-events-auto pointer-fine:group-hover:opacity-100' +
  ' pointer-fine:group-focus-within:pointer-events-auto pointer-fine:group-focus-within:opacity-100"' +
  ' style="background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8) 40%,' +
  ' rgb(255, 255, 255) 60%);"><button type="button" aria-label="Run options"' +
  ' class="grid h-5 w-5 place-items-center rounded text-ink-550 transition-colors' +
  ' hover:bg-black/[.05] hover:text-ink-680 pointer-coarse:h-6 pointer-coarse:w-6"' +
  ' aria-haspopup="dialog" aria-expanded="false" data-state="closed"' +
  ' data-slot="tooltip-trigger"><svg xmlns="http://www.w3.org/2000/svg" width="24"' +
  ' height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
  ' stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis h-3.5 w-3.5"' +
  ' aria-hidden="true"><circle cx="12" cy="12" r="1"></circle>' +
  '<circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>' +
  '</svg></button></div>';

function recentRow(run, current) {
  const base = 'relative flex w-full items-center gap-1.5 rounded-md cursor-pointer' +
    ' font-medium transition-colors duration-100 select-none' +
    ' [-webkit-touch-callout:none] px-2.5 py-1.5 text-xs ';
  const cls = current ? base + 'bg-azure-500/[.06] text-ink-900'
    : base + 'text-ink-680 hover:bg-black/[.025]';
  return '<div class="group relative"><a' + (current ? ' aria-current="page"' : '') +
    ' class="' + cls + '" href="#">' +
    (run.status === 'done' ? CHECK_ICON : '') +
    '<span class="overflow-hidden text-ellipsis whitespace-nowrap" data-state="closed"' +
    ' data-slot="tooltip-trigger" tabindex="0">' + escape(run.title) + '</span></a>' +
    ELLIPSIS_BTN + '</div>';
}

/* The three phase cards carry "<duration> … <cost>" in one shared markup
   shape, so they are matched positionally rather than by a literal (two of
   the three placeholders are the identical string "0h 00m"). */
function fillPhaseCards(html, data) {
  const CARD_RE = /<div class="flex items-center text-\[11px\] text-gray-500"><span>([^<]*)<\/span><span class="ml-auto font-semibold text-gray-500">([^<]*)<\/span><\/div>/g;
  const phases = data.PHASES;
  let n = 0;
  const out = html.replace(CARD_RE, () => {
    const p = phases[n++];
    return '<div class="flex items-center text-[11px] text-gray-500"><span>' +
      escape(compactDuration(p.duration)) +
      '</span><span class="ml-auto font-semibold text-gray-500">' +
      escape(money(p.cost)) + '</span></div>';
  });
  if (n !== 3) throw new Error('fillPhaseCards: expected 3 phase cards, saw ' + n);
  return out;
}

/* Round 2 -> Create Artifacts substeps. The capture has three; the dataset
   has five, and Evaluation 1 is the selected one — the pill is an INLINE
   STYLE, not a class (real-capture/structure.md §4). */
const SUBSTEP_SELECTED_STYLE =
  'background: rgba(96, 165, 250, 0.1); border-radius: 9999px; margin-left: -8px;' +
  ' padding-left: 8px; padding-right: 8px; box-shadow: rgba(96, 165, 250, 0.25) 0px 1px 4px,' +
  ' rgba(96, 165, 250, 0.1) 0px 0px 8px;';

function substepList(data) {
  const artifacts = findNode(data.PHASES, 'Test Idea', 'Round 2', 'Create Artifacts');
  const rows = artifacts.children.map((s) => substepRow(s)).join('');
  return '<div class="relative pl-[20px]"><div class="absolute -top-[16px] bottom-3' +
    ' left-[4px] z-[1] w-0.5 rounded-full" style="background: rgba(96, 165, 250, 0.1);">' +
    '</div>' + rows + '</div>';
}

function substepRow(s) {
  const sel = !!s.selected;
  const dot = s.status === 'done' || s.status === 'skipped' ? s.status : 'done';
  return '<div><div class="relative flex min-h-8 items-center py-0.5">' +
    '<div class="absolute top-1/2 z-[1] h-[1.5px] -translate-y-1/2 rounded-full"' +
    ' style="left: -16px; width: 16px; background: rgba(96, 165, 250, 0.15);"></div>' +
    '<button type="button" class="group/sub flex w-full self-stretch cursor-pointer' +
    ' items-center gap-2 rounded-md transition-colors duration-100 appearance-none' +
    ' bg-transparent text-left hover:bg-black/[0.025]"' +
    (sel ? ' style="' + SUBSTEP_SELECTED_STYLE + '"' : '') + '>' +
    '<div data-sub-dot="true" data-status="' + escape(dot) + '" class="relative z-[2] flex' +
    ' shrink-0 items-center justify-center rounded-full h-[11px] w-[11px]"' +
    ' style="background: rgba(96, 165, 250, 0.12);">' +
    '<svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.8L6.5 2.2"' +
    ' stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '</path></svg></div><span class="text-xs break-words ' + (sel ? 'font-medium ' : '') +
    'text-gray-700">' + escape(s.name) + '</span></button></div></div>';
}

function findNode(nodes, ...names) {
  let level = nodes;
  let hit = null;
  for (const name of names) {
    hit = level.find((n) => n.name === name);
    if (!hit) throw new Error('findNode: no "' + name + '"');
    level = hit.children || [];
  }
  return hit;
}

/** Replace one stat tile's value + caption, keyed on its uppercase label. */
function statTile(html, label, value, sub) {
  const re = new RegExp(
    '(uppercase">' + label + '</div><div class="mt-0\\.5 text-lg font-bold text-ink-900' +
    ' tabular-nums">)([^<]*)(</div><div class="mt-0\\.5 text-\\[9px\\] text-ink-550">)([^<]*)(</div>)');
  if (!re.test(html)) throw new Error('statTile: no "' + label + '" tile');
  return html.replace(re, (m, a, _v, b, _s, c) => a + escape(value) + b + escape(sub) + c);
}

module.exports = { stripRuntime, fillShell, fillOnce, money, thousands, compactDuration };
