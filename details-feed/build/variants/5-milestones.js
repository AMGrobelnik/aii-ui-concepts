/* Variant 5 — Inline milestones (SPEC-V2 §5).

   The sparsest layer of the six. Rows are NOT grouped and stay exactly the
   production rows; what is added is seven MILESTONES — the run's own
   extracted DECISIONS — pinned inline at the position of each decision's
   LAST event, and a fold over every stretch of ordinary rows between two
   of them.

   So the page at rest is seven cards and seven "14 events" lines: the
   things that mattered, in the order they happened, with the process one
   click away. Nothing is hidden that cannot be reached — the collapsed
   rows are in the DOM, and "Show everything" opens all seven at once.

   WHERE THE SEVEN SIT
   -------------------
   `DECISIONS[].eventRange[1]` is the index of the last event that made the
   decision, so the milestone is emitted directly after that row. The seven
   ends (13, 20, 44, 75, 136, 159, 164) happen to be strictly increasing
   even though two of the ranges overlap, so the seven stretches tile the
   165 events exactly once:

     0–13 (14) · 14–20 (7) · 21–44 (24) · 45–75 (31) · 76–136 (61) ·
     137–159 (23) · 160–164 (5)   =  165

   The stretch costs sum to $1.22, which is the substep cost the stat tile
   already shows — the layer invents no numbers, it only re-cuts the ones
   the run recorded.

   WHAT IS REUSED, WHAT IS NEW
   ---------------------------
   The collapsed stretch IS `ctx.fold()` — shared markup, shared unfold, so
   click and Enter/Space work with no key handling here. Only two things are
   genuinely new and therefore carry CSS of their own: the milestone card
   (a hairline card with the 2 px orange spine the shared group header uses,
   so the six pages read as one family) and the "Show everything" toggle.
   The variant JS is the toggle plus a two-way fold: the shared handler only
   ever OPENS a fold, and a reader who peeks into a stretch should be able
   to shut it again without collapsing all seven. */

'use strict';

/* mm:ss -> seconds, and back, so a stretch can report how long it ran in
   the same "0:41" shape the rest of the page uses. */
function toSeconds(t) {
  const parts = String(t || '0:00').split(':').map(Number);
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
}
function toClock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/** "14 events · 0:30 · $0.08" — the shared header's meta shape. */
function stretchMeta(events) {
  const span = toSeconds(events[events.length - 1].t) - toSeconds(events[0].t);
  const usd = events.reduce((sum, ev) => sum + (ev.usd || 0), 0);
  return toClock(span) + ' · $' + usd.toFixed(2);
}

/** One milestone: kind tag, title, the time it landed, its numbers. */
function milestone(decision, event, escape) {
  const numbers = (decision.numbers || []).map((n) =>
    '<div class="ms-num">' +
    '<span class="ms-num-l">' + escape(n.label) + '</span>' +
    '<span class="ms-num-v">' + escape(n.value) + '</span></div>').join('');

  return '<div class="ms" data-kind="' + escape(decision.kind) + '">' +
    '<div class="ms-row">' +
    '<span class="ms-kind">' + escape(decision.kind) + '</span>' +
    '<span class="ms-title">' + escape(decision.title) + '</span>' +
    '<span class="ms-time">' + escape(event.t) + '</span>' +
    '</div>' +
    (numbers ? '<div class="ms-nums">' + numbers + '</div>' : '') +
    '</div>';
}

module.exports = {
  id: 'feed/5-milestones',
  file: '5-milestones.html',
  name: 'Milestones',
  premise: 'Seven extracted decisions pinned in place; the process between them collapsed.',
  needs: 'a decision extractor',

  css: `
/* ===== the list's one control: "Show everything" ===================== */
.ms-top {
  position: sticky;
  top: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 65ch;
  height: 30px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: color-mix(in srgb, var(--color-ink-75, #f8f9fb) 97%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.ms-count {
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-560, #666676);
}
.ms-all {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 12px;
  color: var(--color-ink-700, #4a4a5a);
  text-decoration: underline;
  text-decoration-color: rgba(0, 0, 0, 0.2);
  text-underline-offset: 3px;
  cursor: pointer;
  appearance: none;
}
.ms-all:hover { color: var(--color-ink-900, #1a1a2e); text-decoration-color: currentColor; }
.ms-all:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.5);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ===== the milestone ================================================
   A hairline card, not a banner: the app's own card recipe (rounded-xl,
   border-black/[0.06], the warm translucent paper, 1 px shadow) plus the
   2 px orange spine the shared group header uses, so the six variants
   read as one family. Anatomy follows that header too — mono tag at the
   left, 13 px/500 label, right-aligned mono meta. */
.ms {
  position: relative;
  max-width: 65ch;
  margin: 10px 0;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: 2px solid #fb923c;
  border-radius: 8px;
  background: rgba(255, 253, 250, 0.55);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}
/* Baseline, not centre: at 1280 a title wraps to two lines and the tag and
   the time belong on the FIRST of them, exactly as the shared header's
   ordinal and meta do. 11 + 17 + 11 is the 40 px row. */
.ms-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-height: 40px;
  padding: 11px 12px;
}
.ms-kind {
  flex: none;
  font-family: var(--font-mono, mono, monospace);
  font-size: 10px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--color-ink-560, #666676);
}
/* The one milestone that records a failure says so in the danger colour —
   the same signal the shared header spends on "1 error". */
.ms[data-kind="error"] .ms-kind { color: var(--color-red-600, #dc2626); }
.ms-title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--color-ink-900, #1a1a2e);
}
.ms-time {
  flex: none;
  margin-left: auto;
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-560, #666676);
}

/* The numbers the decision turned on: label over mono value, the same
   8 px tracked caps production puts over a Tool Input card. */
.ms-nums {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 22px;
  padding: 0 12px 10px;
}
.ms-num { display: flex; flex-direction: column; gap: 1px; }
.ms-num-l {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-540, #616979);
}
.ms-num-v {
  font-family: var(--font-mono, mono, monospace);
  font-size: 12px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-800, #3a3a4a);
}

/* ===== the collapsed stretch =========================================
   ctx.fold(), with the count promoted out of the 8 px row-kind register:
   on this page the fold line is the main thing a reader clicks, so it
   reads "14 events · 0:30 · $0.08" rather than "14 EVENTS". */
.ms-gap { max-width: 65ch; }
.ms-gap .fd-fold-head { padding: 7px 0; }
.ms-gap .fd-fold-kind {
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  color: var(--color-ink-700, #4a4a5a);
}
.ms-gap .fd-fold-sum {
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
/* An open stretch keeps its head, so the peek is reversible. */
.ms-gap .fd-fold[data-open="true"] > .fd-fold-head { display: inline-flex; }
.ms-gap .fd-fold-plus { font-size: 0; }
.ms-gap .fd-fold-plus::after {
  content: "+";
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  line-height: 1;
}
.ms-gap .fd-fold[data-open="true"] .fd-fold-plus::after { content: "\\2013"; }
.ms-gap .fd-fold[data-open="true"] > .fd-fold-head .fd-fold-kind,
.ms-gap .fd-fold[data-open="true"] > .fd-fold-head .fd-fold-sum,
.ms-gap .fd-fold[data-open="true"] > .fd-fold-head .fd-fold-sep {
  color: var(--color-ink-560, #666676);
}
.ms-gap .fd-fold[data-open="true"] > .fd-fold-head .fd-fold-kind { font-weight: 400; }
`,

  js: `
/* Milestones — the stretch toggle. Two handlers, both on the list.

   shared/feed.js already unfolds a stretch on click (and therefore on
   Enter/Space, the head being a real <button>), but it only ever OPENS
   one and it leaves aria-expanded alone. Both are fixed here: the
   attribute is this page's record of the state, so a second click on the
   same head closes the stretch again, and "Show everything" drives all
   seven at once. */
(function () {
  'use strict';

  function init() {
    var list = document.querySelector('[data-feed-list]');
    if (!list) return;
    var toggle = list.querySelector('.ms-all');
    var folds = list.querySelectorAll('.ms-gap .fd-fold');
    if (!toggle || !folds.length) return;

    function setOpen(fold, open) {
      fold.setAttribute('data-open', open ? 'true' : 'false');
      var rows = fold.querySelector('.fd-fold-rows');
      if (rows) rows.hidden = !open;
      var head = fold.querySelector('.fd-fold-head');
      if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openCount() {
      var n = 0;
      Array.prototype.forEach.call(folds, function (f) {
        if (f.getAttribute('data-open') === 'true') n += 1;
      });
      return n;
    }

    function sync() {
      var all = openCount() === folds.length;
      toggle.textContent = all ? 'Collapse to milestones' : 'Show everything';
      toggle.setAttribute('aria-pressed', all ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-pressed') !== 'true';
      Array.prototype.forEach.call(folds, function (f) { setOpen(f, open); });
      sync();
      if (!open) list.scrollIntoView({ block: 'start' });
    });

    /* Registered after shared/feed.js's handler, so by the time this runs
       the shared one has already opened a closed stretch. */
    list.addEventListener('click', function (e) {
      var head = e.target && e.target.closest
        ? e.target.closest('.ms-gap .fd-fold-head') : null;
      if (head) {
        setOpen(head.closest('.fd-fold'),
          head.getAttribute('aria-expanded') !== 'true');
      }
      sync();
    });

    sync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`,

  transform(listHtml, ctx) {
    const events = ctx.events;
    const decisions = ctx.data.DECISIONS.slice()
      .sort((a, b) => a.eventRange[1] - b.eventRange[1]);

    const out = [
      '<div class="ms-top">' +
      '<span class="ms-count">' + decisions.length + ' milestones · ' +
      events.length + ' events</span>' +
      '<button type="button" class="ms-all" aria-pressed="false">Show everything</button>' +
      '</div>'
    ];

    let cursor = 0;
    decisions.forEach((decision) => {
      const end = decision.eventRange[1];
      if (end < cursor || end >= events.length) {
        throw new Error('5-milestones: decision "' + decision.kind +
          '" ends at ' + end + ', which is not after ' + cursor);
      }
      const stretch = events.slice(cursor, end + 1);
      out.push('<div class="ms-gap">' + ctx.fold(
        stretch.map((ev) => ctx.rowHtml(ev)).join(''),
        { kind: stretch.length + ' events', summary: stretchMeta(stretch) }
      ) + '</div>');
      out.push(milestone(decision, events[end], ctx.escape));
      cursor = end + 1;
    });

    /* Anything after the last milestone is a stretch of its own. The
       fictional run ends ON a decision, so today this emits nothing —
       but a run that ended mid-work would still reach every event. */
    if (cursor < events.length) {
      const tail = events.slice(cursor);
      out.push('<div class="ms-gap">' + ctx.fold(
        tail.map((ev) => ctx.rowHtml(ev)).join(''),
        { kind: tail.length + ' events', summary: stretchMeta(tail) }
      ) + '</div>');
    }

    return out.join('');
  }
};
