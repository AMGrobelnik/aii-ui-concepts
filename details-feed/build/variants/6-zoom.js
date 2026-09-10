/* Variant 6 — Zoom levels and minimap (SPEC-V2 §6).

   Variant 1's turn groups, plus the two things that only make sense once a
   feed is grouped:

     the ZOOM CONTROL — one segmented control pinned at the top of the list
     that sets the fold depth of every group at once. Turns = headers only,
     Rows = groups open with identical runs folded (the default), Raw =
     every event, nothing folded. It is the same three states a reader
     would otherwise reach by clicking 22 headers and 8 "+" lines.

     the MINIMAP — a 96 px rail docked at the right edge of the centre
     column: one 2 px line per event in the row's OWN type colour (read
     from build/lib/rows.js, so the map and the rows can never drift),
     hairlines at turn boundaries, the ERROR as a 4 px red line, the USER
     steer as a teal marker, and a translucent azure viewport rectangle
     that frames the events currently on screen and jumps on click/drag.

   The viewport rectangle is computed in EVENT space, not scroll space:
   for every event we hold the element that represents it right now — its
   own row, or, when that row is folded away or its turn is collapsed, the
   "+" line or the turn header standing in for it. So the rectangle answers
   "which part of the substep am I looking at" at every zoom level, and a
   click on a line lands on something that is actually on the page. */

'use strict';

const { KINDS } = require('../lib/rows');

/* Runs shorter than this read better as themselves than as a "+" line:
   folding two rows into one saves nothing and hides half of it. */
const FOLD_MIN = 3;

/* type -> hex, straight off the row renderer's own table. The minimap is a
   picture of the rows, so it reuses the rows' colours by construction. */
const COLORS = Object.keys(KINDS).reduce((acc, k) => {
  acc[k] = KINDS[k].hex;
  return acc;
}, {});

/* How much of the minimap's track each type's line fills. The default is
   0.75; the exceptions are what gives the rail its shape. */
const WIDTHS = {
  AGENT: 1, USER: 1, ERROR: 1, SUMMARY: 0.88,
  WARNING: 0.7, RETRY: 0.7, SUCCESS: 0.7,
  THINK: 0.55, INFO: 0.45, CONFIG: 0.45
};

/* ------------------------------------------------------------- helpers */

const pad2 = (n) => (n < 10 ? '0' + n : String(n));
const money = (v) => '$' + Number(v).toFixed(2);

/** "8 events · 0:18 · $0.04" — the meta line SPEC-V2 fixes for a group. */
function turnMeta(turn) {
  return turn.events.length + ' events · ' + turn.dur + ' · ' + money(turn.usd);
}

const head = (s) => String(s).split(': ')[0];
const tail = (s) => {
  const i = String(s).indexOf(': ');
  return i === -1 ? String(s) : String(s).slice(i + 2);
};
const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);

/**
 * The one line a folded run has to earn its place with: what is DIFFERENT
 * between the rows it swallowed. Row summaries here are "<subject>: <what
 * happened>", so the subjects are the discriminator — unless they are a
 * bare enumeration ("Task 1", "Check 2"), which says nothing, and then the
 * predicates are. A run of genuinely identical rows keeps its own text.
 */
function foldSummary(run) {
  const summaries = run.map((ev) => ev.summary || '');
  const heads = uniq(summaries.map(head));
  if (heads.length === 1) return summaries[0];
  const enumerated = heads.every((h) => /^\S+ \d+$/.test(h));
  return join(uniq(enumerated ? summaries.map(tail) : heads));
}

function join(parts) {
  const shown = parts.slice(0, 3).join(', ');
  return parts.length > 3 ? shown + ' +' + (parts.length - 3) : shown;
}

/* ------------------------------------------------------- the zoom control */

const LEVELS = [
  ['turns', 'Turns', 'One line per agent turn'],
  ['rows', 'Rows', 'Every turn open, repeated rows folded'],
  ['raw', 'Raw', 'Every event, nothing folded']
];

/* Built out of the composer's own pill vocabulary (h-24px, rounded-full,
   border-black/[0.08], 11.5 px medium) with the selected segment carrying
   the azure tint + glow the tree already paints the selected substep with,
   so the control reads as a part of the app rather than a review widget. */
function zoomControl(ctx, data) {
  const buttons = LEVELS.map(([id, label, hint], i) =>
    '<button type="button" role="radio" class="fd-seg-btn" data-zoom="' + id +
    '" aria-checked="' + (id === 'rows') + '" tabindex="' + (id === 'rows' ? '0' : '-1') +
    '" title="' + ctx.escape(hint) + '">' + ctx.escape(label) + '</button>' +
    (i < LEVELS.length - 1 ? '<span class="fd-seg-dot" aria-hidden="true">·</span>' : '')
  ).join('');

  return '<div class="fd-zoom">' +
    '<span class="fd-zoom-title">Detail</span>' +
    '<div class="fd-seg" role="radiogroup" aria-label="Feed detail level">' +
    buttons + '</div>' +
    '<span class="fd-zoom-meta">' + data.SUBSTEP.turns.length + ' turns · ' +
    data.SUBSTEP.events + ' events</span></div>';
}

/* --------------------------------------------------------------- the CSS */

const css = `
/* --- the zoom control, pinned at the top of the list ------------------ */

.fd-zoom {
  position: sticky;
  top: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: -8px 0 6px;
  padding: 8px 0 7px;
  /* opaque, unlike the group headers below it: it is the topmost thing in
     the scroller, so a row passing under it must not ghost through */
  background: var(--color-ink-75, #f8f9fb);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.fd-zoom-title {
  flex: none;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-ink-560, #666676);
}
.fd-seg {
  flex: none;
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 2px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  background: #fff;
}
.fd-seg-btn {
  height: 22px;
  padding: 0 10px;
  margin: 0;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  font: inherit;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  color: var(--color-ink-600, #5a5a6a);
  cursor: pointer;
  appearance: none;
  transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
}
.fd-seg-btn:hover { color: var(--color-ink-900, #1a1a2e); }
.fd-seg-btn[aria-checked="true"] {
  background: rgba(96, 165, 250, 0.1);
  color: var(--color-ink-900, #1a1a2e);
  box-shadow: rgba(96, 165, 250, 0.25) 0 1px 4px, rgba(96, 165, 250, 0.1) 0 0 8px;
}
.fd-seg-dot { color: rgba(0, 0, 0, 0.14); font-size: 11px; }
.fd-seg-btn:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.5);
  outline-offset: 2px;
}
.fd-zoom-meta {
  margin-left: auto;
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-560, #666676);
  white-space: nowrap;
}

/* Group headers stick BELOW the control, not under it. The height is
   published by the variant's JS; 44 px is what the markup measures. */
.fd-head { top: var(--fd-ctl-h, 44px); }

/* --- the minimap ------------------------------------------------------ */

/* The rail is docked in the centre column's own gutter: the list gives back
   exactly its width, so no row ever runs underneath it and nothing widens
   the column. Below the app's lg breakpoint the layout is single-column
   and there is no gutter to dock in, so the rail is not rendered. */
:root { --fd-map-w: 0px; }
@media (min-width: 1024px) { :root { --fd-map-w: 64px; } }
@media (min-width: 1360px) { :root { --fd-map-w: 96px; } }

/* the rail's own 12 px inner margin is the gap to the text, so the list
   gives back the rail and 8 px, not the rail and a second gutter */
[data-feed-list] { padding-right: calc(var(--fd-map-w) + 8px); }
@media (max-width: 1023px) { [data-feed-list] { padding-right: 16px; } }

.fd-map {
  position: absolute;
  top: 0;
  right: 0;
  bottom: var(--composer-reserve, 0px);
  width: var(--fd-map-w);
  z-index: 15;
  box-sizing: border-box;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  touch-action: none;
  overscroll-behavior: contain;
}
@media (max-width: 1023px) { .fd-map { display: none; } }
.fd-map svg { display: block; }

/* the hover readout — mono, one line, out over the gutter to the left */
.fd-map-tip {
  position: absolute;
  right: calc(100% - 16px);
  transform: translateY(-50%);
  padding: 3px 7px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: var(--font-mono, mono, monospace);
  font-size: 10.5px;
  line-height: 1.3;
  white-space: nowrap;
  color: var(--color-ink-700, #4a4a5a);
  pointer-events: none;
}
.fd-map-tip[hidden] { display: none; }

/* what a minimap jump landed on, for the second it takes to find it */
.fd-flash { animation: fd-flash 900ms ease-out; border-radius: 6px; }
@keyframes fd-flash {
  from { background-color: rgba(59, 130, 246, 0.18); }
  to { background-color: transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .fd-flash { animation: none; }
  .fd-seg-btn { transition: none; }
}
`;

/* ---------------------------------------------------------------- the JS */

const js = `
(function () {
  'use strict';

  var COLORS = ${JSON.stringify(COLORS)};
  /* Line length by type, as a fraction of the track. A minimap of uniform
     bars is a barcode; giving the turn-opening AGENT line, the steer and the
     error the full width and the housekeeping types less of it makes the
     shape of the run readable from the rail alone. */
  var WIDTHS = ${JSON.stringify(WIDTHS)};
  var TRACK_LEFT = 22;      /* rail x where the event lines start */
  var TRACK_RIGHT = 10;     /* rail x kept clear on the right */
  var PAD_Y = 10;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  var list = document.querySelector('[data-feed-list]');
  if (!list) return;
  var scroller = list.parentElement;                  /* .composer-scroll-tail */
  var column = scroller.parentElement;                /* the centre column */
  var control = list.querySelector('.fd-zoom');
  var seg = list.querySelector('.fd-seg');
  var buttons = [].slice.call(list.querySelectorAll('.fd-seg-btn'));
  var rows = [].slice.call(list.querySelectorAll('[data-feed-row]'));
  var groups = [].slice.call(list.querySelectorAll('.fd-group'));
  var folds = [].slice.call(list.querySelectorAll('.fd-fold'));
  if (!rows.length) return;

  /* =============================================== anchors (event -> pixel)

     For each event: the element that stands for it on screen right now.
     Its own row when the row is rendered; the "+" of the run it is folded
     into, or its turn header, when it is not. Positions are cached and
     invalidated by a ResizeObserver on the list, so a scroll costs nothing. */

  var anchors = rows.map(function (row) {
    var f = row.closest('.fd-fold');
    var g = row.closest('.fd-group');
    return {
      row: row,
      fold: f ? f.querySelector('.fd-fold-head') : null,
      head: g ? g.querySelector('.fd-head') : null
    };
  });
  var tops = new Array(rows.length);
  var bots = new Array(rows.length);
  var dirty = true;

  function shown(el) { return !!(el && el.offsetParent); }

  function anchorEl(a) {
    if (shown(a.row)) return a.row;
    if (shown(a.fold)) return a.fold;
    return a.head || a.row;
  }

  function measure() {
    if (!dirty) return;
    /* content coordinates: viewport top of the scroller plus how far it has
       scrolled. A collapsed group's header cannot travel, so it is never
       measured in its stuck position. */
    var base = scroller.getBoundingClientRect().top - scroller.scrollTop;
    for (var k = 0; k < anchors.length; k++) {
      var r = anchorEl(anchors[k]).getBoundingClientRect();
      tops[k] = r.top - base;
      bots[k] = r.bottom - base;
    }
    dirty = false;
  }

  /** [first, last] event index currently on screen. */
  function visibleRange() {
    measure();
    var from = scroller.scrollTop;
    var to = from + scroller.clientHeight;
    var first = 0;
    var last = rows.length - 1;
    var k;
    for (k = 0; k < rows.length; k++) { if (bots[k] > from + 0.5) { first = k; break; } }
    for (k = rows.length - 1; k >= 0; k--) { if (tops[k] < to - 0.5) { last = k; break; } }
    return [first, Math.max(first, last)];
  }

  /* ================================================== the segmented control */

  function apply(next) {
    var at = visibleRange()[0];

    groups.forEach(function (g) {
      var open = next !== 'turns';
      g.setAttribute('data-open', open ? 'true' : 'false');
      var h = g.querySelector('.fd-head');
      if (h) h.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    folds.forEach(function (f) {
      var open = next === 'raw';
      f.setAttribute('data-open', open ? 'true' : 'false');
      var h = f.querySelector('.fd-fold-head');
      if (h) h.setAttribute('aria-expanded', open ? 'true' : 'false');
      var r = f.querySelector('.fd-fold-rows');
      if (r) r.hidden = !open;
    });
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-zoom') === next;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });

    dirty = true;
    /* hold the reader's place across a change that can multiply the list's
       height by four */
    measure();
    var max = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTop = Math.max(0, Math.min(max, tops[at] - headroom(at)));
    paint();
  }

  /* What is pinned over the top of the list at that event: the control
     always, and the event's own turn header too when the event is a row
     inside an open group. Landing under either of them looks like a jump
     that missed. */
  function headroom(k) {
    var above = (control ? control.offsetHeight : 0) + 6;
    var el = anchorEl(anchors[k]);
    if (el && !el.classList.contains('fd-head')) {
      var g = el.closest('.fd-group');
      var h = g ? g.querySelector('.fd-head') : null;
      if (h) above += h.offsetHeight;
    }
    return above;
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.fd-seg-btn') : null;
    if (b) apply(b.getAttribute('data-zoom'));
  });

  /* A radiogroup moves with the arrow keys and selection follows focus.
     preventDefault() also stops the review bar's page navigation, which
     listens on document and honours defaultPrevented. */
  seg.addEventListener('keydown', function (e) {
    var i = buttons.indexOf(document.activeElement);
    if (i === -1) return;
    var to = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % buttons.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i + buttons.length - 1) % buttons.length;
    if (e.key === 'Home') to = 0;
    if (e.key === 'End') to = buttons.length - 1;
    if (to === -1) return;
    e.preventDefault();
    buttons[to].focus();
    apply(buttons[to].getAttribute('data-zoom'));
  });

  /* ============================================================== the minimap */

  /* Pointer-only, and everything it reaches is reachable in the list itself
     (the control, the headers, the rows), so it is hidden from AT rather
     than announced as a second, unusable copy of the feed. */
  var rail = document.createElement('div');
  rail.className = 'fd-map';
  rail.setAttribute('aria-hidden', 'true');
  var svg = document.createElementNS(SVG_NS, 'svg');
  var tip = document.createElement('div');
  tip.className = 'fd-map-tip';
  tip.hidden = true;
  rail.appendChild(svg);
  rail.appendChild(tip);
  column.appendChild(rail);

  var pitch = 0;
  var mapH = 0;
  var vp = null;
  var cursor = null;
  var veilTop = null;
  var veilBottom = null;

  function line(x, y, w, h, fill, extra) {
    return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(2) + '" width="' + w.toFixed(1) +
      '" height="' + h + '" fill="' + fill + '"' + (extra || '') + '></rect>';
  }

  function build() {
    var w = rail.clientWidth;
    var h = rail.clientHeight;
    if (!w || !h) { pitch = 0; return; }
    mapH = h;
    var trackW = w - TRACK_LEFT - TRACK_RIGHT;
    pitch = (h - PAD_Y * 2) / rows.length;

    var parts = [];
    var marks = [];
    var turn = null;
    rows.forEach(function (row, k) {
      var y = PAD_Y + k * pitch;
      var t = row.getAttribute('data-turn');
      if (turn !== null && t !== turn) {
        /* hairline at every turn boundary, running into the marker gutter */
        parts.push(line(TRACK_LEFT - 12, y - 1, trackW + 12, 1, 'rgba(0,0,0,0.14)'));
      }
      turn = t;
      var type = row.getAttribute('data-type');
      var color = COLORS[type] || '#8a8a99';
      var lw = trackW * (WIDTHS[type] || 0.75);
      if (type === 'ERROR') {
        marks.push(line(TRACK_LEFT - 12, y - 1, trackW + 12, 4, color));
      } else if (type === 'USER') {
        marks.push(line(TRACK_LEFT, y, lw, 3, color));
        marks.push('<circle cx="' + (TRACK_LEFT - 7) + '" cy="' + (y + 1.5).toFixed(2) +
          '" r="3.5" fill="' + color + '"></circle>');
      } else {
        parts.push(line(TRACK_LEFT, y, lw, 2, color, ' fill-opacity="0.85"'));
      }
    });

    /* Everything outside the viewport rectangle is veiled, so the rectangle
       reads at a glance instead of being one more box in a busy rail. The
       two landmarks — the error and the steer — are drawn OVER the veil:
       they are the reason to look at the rail when they are off screen. */
    parts.push(line(0, 0, w, 0, 'rgba(249,250,252,0.6)', ' class="fd-veil-top"'));
    parts.push(line(0, 0, w, 0, 'rgba(249,250,252,0.6)', ' class="fd-veil-bottom"'));
    parts = parts.concat(marks);
    parts.push(line(TRACK_LEFT - 12, 0, trackW + 12, 1, 'rgba(0,0,0,0.45)',
      ' class="fd-cursor" opacity="0"'));
    parts.push('<rect class="fd-vp" x="' + (TRACK_LEFT - 8) + '" y="0" width="' + (trackW + 14) +
      '" height="0" rx="3" fill="rgba(59,130,246,0.1)" stroke="rgba(37,99,235,0.65)"' +
      ' stroke-width="1"></rect>');

    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML = parts.join('');
    vp = svg.querySelector('.fd-vp');
    cursor = svg.querySelector('.fd-cursor');
    veilTop = svg.querySelector('.fd-veil-top');
    veilBottom = svg.querySelector('.fd-veil-bottom');
    paint();
  }

  function paint() {
    if (!vp || !pitch) return;
    var r = visibleRange();
    var y = Math.max(0, PAD_Y + r[0] * pitch - 2);
    var h = Math.min(mapH - y, Math.max(10, (r[1] - r[0] + 1) * pitch + 4));
    vp.setAttribute('y', y.toFixed(2));
    vp.setAttribute('height', h.toFixed(2));
    veilTop.setAttribute('height', y.toFixed(2));
    veilBottom.setAttribute('y', (y + h).toFixed(2));
    veilBottom.setAttribute('height', Math.max(0, mapH - y - h).toFixed(2));
  }

  /* ------------------------------------------------------------ jumping */

  function indexAt(clientY) {
    var box = svg.getBoundingClientRect();
    var k = Math.floor((clientY - box.top - PAD_Y) / pitch);
    return Math.max(0, Math.min(rows.length - 1, k));
  }

  function jump(k, flash) {
    measure();
    var mid = (tops[k] + bots[k]) / 2;
    var max = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTop = Math.max(0, Math.min(max, mid - scroller.clientHeight / 2));
    if (flash) {
      var el = anchorEl(anchors[k]);
      el.classList.remove('fd-flash');
      void el.offsetWidth;
      el.classList.add('fd-flash');
      window.setTimeout(function () { el.classList.remove('fd-flash'); }, 1000);
    }
    paint();
  }

  var dragging = false;

  rail.addEventListener('pointerdown', function (e) {
    if (!pitch) return;
    dragging = true;
    rail.setPointerCapture(e.pointerId);
    jump(indexAt(e.clientY), false);
    e.preventDefault();
  });

  rail.addEventListener('pointermove', function (e) {
    if (!pitch) return;
    var k = indexAt(e.clientY);
    if (dragging) jump(k, false);
    hover(k, e.clientY);
  });

  function end(e) {
    if (!dragging) return;
    dragging = false;
    if (rail.hasPointerCapture && rail.hasPointerCapture(e.pointerId)) {
      rail.releasePointerCapture(e.pointerId);
    }
    jump(indexAt(e.clientY), true);
  }
  rail.addEventListener('pointerup', end);
  rail.addEventListener('pointercancel', end);

  rail.addEventListener('pointerleave', function () {
    tip.hidden = true;
    if (cursor) cursor.setAttribute('opacity', '0');
  });

  function hover(k, clientY) {
    var row = rows[k];
    tip.textContent = row.getAttribute('data-t') + ' · ' + row.getAttribute('data-type') +
      ' · turn ' + row.getAttribute('data-turn');
    tip.hidden = false;
    tip.style.top = (clientY - rail.getBoundingClientRect().top) + 'px';
    if (cursor) {
      cursor.setAttribute('y', (PAD_Y + k * pitch).toFixed(2));
      cursor.setAttribute('opacity', '1');
    }
  }

  /* ================================================================ wiring */

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () { queued = false; paint(); });
  }

  scroller.addEventListener('scroll', schedule, { passive: true });

  function publishControlHeight() {
    if (control) list.style.setProperty('--fd-ctl-h', control.offsetHeight + 'px');
  }

  function refresh() {
    publishControlHeight();
    dirty = true;
    build();
  }

  if (window.ResizeObserver) {
    /* the list's height changes whenever a group, a fold or a row opens —
       whoever opened it, the control or a click on the row itself */
    new window.ResizeObserver(function () { dirty = true; schedule(); }).observe(list);
    /* the rail's own height follows the scroller (composer, window resize) */
    new window.ResizeObserver(refresh).observe(scroller);
  }
  window.addEventListener('resize', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
  refresh();
})();
`;

/* ---------------------------------------------------------------- module */

module.exports = {
  id: 'feed/6-zoom',
  file: '6-zoom.html',
  name: 'Zoom',
  premise: 'Turn groups with one control that sets the detail level for the whole ' +
    'feed, and a minimap of all 165 events.',
  needs: 'the fold control and the minimap',
  css,
  js,

  transform(listHtml, ctx) {
    const turns = ctx.data.SUBSTEP.turns;
    const out = [zoomControl(ctx, ctx.data)];

    turns.forEach((turn) => {
      const events = turn.events;
      let body = '';
      let i = 0;
      while (i < events.length) {
        let j = i;
        while (j + 1 < events.length && events[j + 1].type === events[i].type) j++;
        const run = events.slice(i, j + 1);
        const rowsHtml = run.map((ev) => ctx.rowHtml(ev, { turn: turn.n })).join('');
        body += run.length >= FOLD_MIN
          ? ctx.fold(rowsHtml, {
            kind: KINDS[run[0].type].label,
            count: run.length,
            summary: foldSummary(run)
          })
          : rowsHtml;
        i = j + 1;
      }

      const errors = events.filter((ev) => ev.type === 'ERROR').length;
      out.push(ctx.group({
        ordinal: pad2(turn.n),
        label: turn.intent,
        meta: turnMeta(turn),
        error: errors || false,
        open: true
      }, body));
    });

    return out.join('');
  }
};
