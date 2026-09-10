/* Centre-feed row rendering — production markup, fictional content.

   WHERE THE ROW ANATOMY COMES FROM
   --------------------------------
   `real-capture/rowtypes.json` holds 15 captured kinds (icon SVG, disc
   colour, label/summary/chevron/button/row class lists). The fictional
   dataset uses 19 types, so six have no capture: TOOL, READ, WRITE, FIND,
   SEARCH and ERROR. Rather than borrow a lookalike kind's markup, those six
   are rebuilt from the SAME source production reads —
   `aii_frontend/constants/message-types.ts` (`TOOL`, `TOOL_KIND_CONFIG`,
   `status_public_error`) — with the icon paths taken verbatim from the
   pinned lucide-react in `aii_frontend/node_modules`. So every row here is
   what the app would emit for that event, not an approximation.

   `assertIconsMatchCapture()` proves the template is right: for all 15
   captured kinds the SVG this file builds is byte-identical to the one in
   rowtypes.json. If lucide or the row anatomy ever moves, the build fails
   instead of drifting.

   THE DISC COLOUR RULE, read off the capture: the 24 px disc is the kind's
   hex at 8.2 % (`rgba(r, g, b, 0.082)`) and the icon is the hex itself. */

'use strict';

const { escape } = require('./html');

/* ---------------------------------------------------------------- icons */

/* Six icons the capture has no example of, verbatim from
   aii_frontend/node_modules/lucide-react/dist/esm/icons/<name>.js. */
const EXTRA_ICONS = {
  'file-text':
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>' +
    '<path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path>' +
    '<path d="M16 13H8"></path><path d="M16 17H8"></path>',
  'file-output':
    '<path d="M14 2v4a2 2 0 0 0 2 2h4"></path>' +
    '<path d="M4 7V4a2 2 0 0 1 2-2 2 2 0 0 0-2 2"></path>' +
    '<path d="M4.063 20.999a2 2 0 0 0 2 1L18 22a2 2 0 0 0 2-2V7l-5-5H6"></path>' +
    '<path d="m5 11-3 3"></path><path d="m5 17-3-3h10"></path>',
  'file-search':
    '<path d="M14 2v4a2 2 0 0 0 2 2h4"></path>' +
    '<path d="M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3"></path>' +
    '<path d="m9 18-1.5-1.5"></path><circle cx="5" cy="14" r="3"></circle>',
  search:
    '<path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle>',
  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"></path>',
  'circle-alert':
    '<circle cx="12" cy="12" r="10"></circle>' +
    '<line x1="12" x2="12" y1="8" y2="12"></line>' +
    '<line x1="12" x2="12.01" y1="16" y2="16"></line>'
};

/* type -> { label, icon, hex }. Labels and hexes mirror
   aii_frontend/constants/message-types.ts exactly. */
const KINDS = {
  AGENT: { label: 'Agent', icon: 'bot', hex: '#7c3aed' },
  THINK: { label: 'Think', icon: 'brain', hex: '#6366f1' },
  SUMMARY: { label: 'Summary', icon: 'sparkles', hex: '#ec4899' },
  CONFIG: { label: 'Config', icon: 'settings', hex: '#6b7280' },
  INFO: { label: 'Info', icon: 'info', hex: '#6b7280' },
  WARNING: { label: 'Warning', icon: 'triangle-alert', hex: '#d97706' },
  RETRY: { label: 'Retry', icon: 'refresh-cw', hex: '#d97706' },
  SUCCESS: { label: 'Success', icon: 'circle-check-big', hex: '#059669' },
  TERMINAL: { label: 'Terminal', icon: 'square-terminal', hex: '#475569' },
  SKILL: { label: 'Skill', icon: 'sparkles', hex: '#7c3aed' },
  EDIT: { label: 'Edit', icon: 'file-pen-line', hex: '#c2410c' },
  TODO: { label: 'Todo', icon: 'list-todo', hex: '#c026d3' },
  PROMPT: { label: 'Prompt', icon: 'message-square', hex: '#2563eb' },
  'SYSTEM PROMPT': { label: 'System Prompt', icon: 'message-square', hex: '#2563eb' },
  /* the six with no capture — see the header note */
  TOOL: { label: 'Tool', icon: 'wrench', hex: '#2563eb' },
  READ: { label: 'Read', icon: 'file-text', hex: '#0284c7' },
  WRITE: { label: 'Write', icon: 'file-output', hex: '#d97706' },
  FIND: { label: 'Find', icon: 'file-search', hex: '#ca8a04' },
  SEARCH: { label: 'Search', icon: 'search', hex: '#0891b2' },
  ERROR: { label: 'Error', icon: 'circle-alert', hex: '#dc2626' },
  /* USER takes the right-aligned bubble, not a disc row */
  USER: { label: 'User', icon: 'user-round', hex: '#0d9488', bubble: true }
};

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbCss(hex) { return 'rgb(' + rgb(hex).join(', ') + ')'; }
function discCss(hex) { return 'rgba(' + rgb(hex).join(', ') + ', 0.082)'; }

const LUCIDE_HEAD =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"' +
  ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
  ' stroke-linejoin="round" class="lucide lucide-';

/** The app's icon element for a kind: 12 px, tinted with the kind's hex. */
function iconSvg(name, hex, icons) {
  const inner = icons[name];
  if (!inner) throw new Error('rows: no icon paths for "' + name + '"');
  return LUCIDE_HEAD + name + ' h-3 w-3" aria-hidden="true" style="color: ' +
    rgbCss(hex) + ';">' + inner + '</svg>';
}

function chevronSvg(open) {
  return LUCIDE_HEAD + (open ? 'chevron-down' : 'chevron-right') +
    ' h-3 w-3 shrink-0" aria-hidden="true"><path d="' +
    (open ? 'm6 9 6 6 6-6' : 'm9 18 6-6-6-6') + '"></path></svg>';
}

/* Icon inner-markup table: the 15 captured kinds are lifted straight out of
   rowtypes.json so nothing is retyped, plus the six extras above. */
function buildIcons(rowtypes) {
  const icons = Object.assign({}, EXTRA_ICONS);
  for (const entry of Object.values(rowtypes)) {
    const svg = entry.iconSvg || '';
    const name = /class="lucide lucide-([a-z0-9-]+)/.exec(svg);
    const inner = /<svg[^>]*>([\s\S]*)<\/svg>$/.exec(svg);
    if (name && inner) icons[name[1]] = inner[1];
  }
  return icons;
}

/** Prove the template reproduces every captured kind byte for byte. */
function assertIconsMatchCapture(rowtypes, icons) {
  for (const [key, entry] of Object.entries(rowtypes)) {
    const kind = KINDS[key];
    if (!kind || !entry.iconSvg) continue;
    if (kind.bubble) continue;          /* USER's icon is class-tinted, not inline */
    const built = iconSvg(kind.icon, kind.hex, icons);
    if (built !== entry.iconSvg) {
      throw new Error('rows: icon drift for ' + key + '\n  built:    ' + built +
        '\n  captured: ' + entry.iconSvg);
    }
    const disc = 'background: ' + discCss(kind.hex) + ';';
    if (entry.circleInlineStyle && entry.circleInlineStyle !== disc) {
      throw new Error('rows: disc drift for ' + key + ' -> ' + entry.circleInlineStyle);
    }
  }
}

/* ----------------------------------------------------------------- rows */

const BTN_CLASSES =
  'inline-flex w-full cursor-pointer items-start gap-2 appearance-none bg-transparent' +
  ' text-left text-xs text-gray-600 transition-colors hover:text-ink-700';

const CARD =
  'rounded-xl border border-black/[0.06] bg-[rgba(255,253,250,0.55)] p-3' +
  ' shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-[12px]';

/** One Tool Input / Tool Output section of an expanded row. */
function payloadSection(label, text, withRule) {
  return '<div>' +
    (withRule ? '<div class="my-2 h-px bg-black/[0.06]"></div>' : '') +
    '<div class="mb-1 text-[8px] font-bold tracking-widest text-ink-540 uppercase">' +
    escape(label) + '</div>' +
    '<div class="' + CARD + '">' +
    '<pre class="rounded bg-black/[0.03] p-2 font-mono text-xs wrap-anywhere whitespace-pre-wrap">' +
    '<code class="wrap-anywhere text-ink-800">' + escape(text) + '</code></pre></div></div>';
}

/* The expanded body is pre-rendered and hidden rather than built on click:
   un-hiding it leaves exactly the DOM the app produces, and it keeps the
   pages static (no data plumbing at runtime). */
function expandedBody(ev) {
  const parts = [];
  if (ev.input) parts.push(payloadSection('Tool Input', ev.input, false));
  if (ev.output) parts.push(payloadSection('Tool Output', ev.output, parts.length > 0));
  if (!parts.length) return '';
  return '<div data-feed-body="true" hidden class="space-y-2 mt-1.5 ml-7">' +
    parts.join('') + '</div>';
}

function dataAttrs(ev, turn) {
  return ' data-i="' + escape(ev.i) + '" data-type="' + escape(ev.type) +
    '" data-turn="' + escape(turn == null ? '' : turn) +
    '" data-t="' + escape(ev.t || '') + '"';
}

/**
 * rowHtml(ev, opts) -> the production row markup for one event.
 *
 * opts.turn      turn number stamped into data-turn (defaults to ev.turn)
 * opts.expanded  render the row open (chevron-down, body visible)
 * opts.extraClass  appended to the row root's class list (variants only)
 */
function makeRowHtml(icons) {
  return function rowHtml(ev, opts) {
    const o = opts || {};
    const kind = KINDS[String(ev.type).toUpperCase()];
    if (!kind) throw new Error('rows: unmapped event type "' + ev.type + '"');
    const turn = o.turn == null ? ev.turn : o.turn;
    const open = !!o.expanded;
    const extra = o.extraClass ? ' ' + o.extraClass : '';
    let body = expandedBody(ev);
    if (open && body) body = body.replace(' hidden ', ' ');

    if (kind.bubble) return userRow(ev, { turn, open, extra, body, icons });

    const summary = ev.summary || '';
    const skeleton = summary ? '' :
      '<span class="fd-skeleton" aria-hidden="true"></span>';
    const pending = summary ? '' : ' fd-pending';

    return '<div data-feed-row="true" class="max-w-prose py-1' + pending + extra + '"' +
      dataAttrs(ev, turn) + '>' +
      '<div class="group select-text">' +
      '<button type="button" class="' + BTN_CLASSES + '" aria-expanded="' +
      (open ? 'true' : 'false') + '">' +
      '<div class="relative mt-[1px] h-[24px] w-[24px] shrink-0">' +
      '<div class="grid h-[24px] w-[24px] place-items-center rounded-full" style="background: ' +
      discCss(kind.hex) + ';">' + iconSvg(kind.icon, kind.hex, icons) + '</div></div>' +
      '<div class="flex min-w-0 flex-col">' +
      '<span class="text-[8px] font-bold tracking-widest text-ink-900 uppercase">' +
      escape(kind.label) + '</span>' +
      '<div class="-mt-[1px] flex min-w-0 items-start gap-1.5">' +
      '<span class="wrap-anywhere text-ink-600">' + escape(summary) + '</span>' +
      skeleton +
      '<span class="mt-[3px]">' + chevronSvg(open) + '</span>' +
      '</div></div></button>' + body + '</div></div>';
  };
}

/* The one event a person authored: right-aligned bubble, label above it,
   avatar disc on the right. Markup verbatim from real-capture/structure.md
   §3 "Human / user prompt bubble". */
function userRow(ev, ctx) {
  const text = ev.summary || ev.input || '';
  return '<div data-feed-row="true" class="py-1' + ctx.extra + '"' +
    dataAttrs(ev, ctx.turn) + '>' +
    '<div class="group select-text">' +
    '<button type="button" class="flex w-full cursor-pointer appearance-none justify-end' +
    ' bg-transparent text-left text-xs" aria-expanded="' + (ctx.open ? 'true' : 'false') + '">' +
    '<div class="flex max-w-[min(85%,60ch)] items-start gap-2">' +
    '<div class="flex min-w-0 flex-col items-end">' +
    '<span class="mb-0.5 text-[8px] font-bold tracking-widest text-ink-900 uppercase">User</span>' +
    '<div class="rounded-2xl rounded-tr-md bg-black/[0.04] px-3.5 py-2 transition-colors' +
    ' duration-150 group-hover:bg-black/[0.06]">' +
    '<div class="flex min-w-0 items-start gap-1.5">' +
    '<p class="text-xs leading-relaxed wrap-anywhere whitespace-pre-wrap text-ink-800 line-clamp-3">' +
    escape(text) + '</p>' +
    '<span class="mt-[3px] text-gray-600">' + chevronSvg(ctx.open) + '</span>' +
    '</div></div></div>' +
    '<div class="mt-[14px] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600/[0.08]">' +
    LUCIDE_HEAD + 'user-round h-3 w-3 text-brand-600" aria-hidden="true">' +
    '<circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>' +
    '</div></div></button>' + ctx.body + '</div></div>';
}

/** Flatten SUBSTEP.turns into one ordered array, each event stamped .turn. */
function flatten(substep) {
  const out = [];
  substep.turns.forEach((turn) => {
    turn.events.forEach((ev) => {
      out.push(Object.assign({}, ev, { turn: turn.n }));
    });
  });
  return out;
}

module.exports = { KINDS, buildIcons, assertIconsMatchCapture, makeRowHtml, flatten, chevronSvg };
