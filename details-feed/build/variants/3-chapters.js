/* Variant 3 — LLM chapters.

   One group per `CHAPTERS[]` entry: the label the summarizer wrote, its
   gist underneath, the outcomes it claims as mono chips, and the usual
   mono meta. Above them, a compact table of contents — the six chapters,
   their event counts, one click to each — pinned to the top of the list
   and collapsing to a single "Chapter 3 of 6 · <label>" line the moment
   the reader scrolls, so the answer to "where am I" never leaves the
   screen. Chapters 1 and 3 are open; the last one is still being written.

   Everything except the table of contents and the pending state is the
   shared vocabulary (ctx.group / ctx.groupHeader). The two things that are
   genuinely new — the TOC and the "Writing chapter…" placeholder — bring
   their own CSS and JS, written in the page's own tokens.

   The header surgery below (the gist and the chips become siblings of the
   label rather than children of it) is deliberate and asserted: at the
   real centre-column width — 604 px at 1440, 444 px at 1280 — the mono
   meta reserves ~160 px of the header's only row, and three chips plus a
   gist do not fit in what is left. Lifting them out of `.fd-label` lets
   both run the full width under the label instead, which is the only way
   the chips are readable at the width the product actually has. */

'use strict';

/* The chevron shared/feed.css already styles at `.fd-caret`. */
const CARET =
  '<svg class="fd-caret" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"' +
  ' fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"' +
  ' stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';

/* Chapters 1 and 3 open (SPEC-V2 §3); the rest closed. */
const OPEN = { 1: true, 3: true };

const PENDING_TEXT = 'Writing chapter…';

/* ------------------------------------------------------------ helpers */

/** Replace `needle` exactly once, or throw — the build fails loudly. */
function replaceOnce(html, needle, repl, what) {
  const first = html.indexOf(needle);
  if (first === -1) throw new Error('3-chapters: no anchor for ' + what);
  if (html.indexOf(needle, first + needle.length) !== -1) {
    throw new Error('3-chapters: ambiguous anchor for ' + what);
  }
  return html.slice(0, first) + repl + html.slice(first + needle.length);
}

function meta(ch) {
  return ch.events + ' events · ' + ch.dur + ' · $' + ch.cost.toFixed(2);
}

/* errors are the shared header's danger slot; a warning borrows the slot
   and is recoloured amber, because a warning is not an error. */
function headerError(ch) {
  if (ch.errors) return ch.errors;
  if (ch.warnings) return ch.warnings + (ch.warnings === 1 ? ' warning' : ' warnings');
  return 0;
}

/* --------------------------------------------------------- the header */

function chapterGroup(ch, n, ctx) {
  const esc = ctx.escape;
  const sub = ch.pending ? PENDING_TEXT : ch.gist;
  const open = !!OPEN[n];

  const rows = ctx.events
    .slice(ch.eventRange[0], ch.eventRange[1] + 1)
    .map((ev) => ctx.rowHtml(ev))
    .join('');

  let html = ctx.group({
    ordinal: String(n),
    label: ch.pending ? '' : ch.label,
    sub,
    meta: meta(ch),
    error: headerError(ch),
    open
  }, rows);

  /* 1. lift the gist and the chips out of `.fd-label` so they can run the
        full width of the header instead of sharing one row with the meta */
  const chips = (ch.outcomes || []).length
    ? '<span class="fd-chips">' +
      ch.outcomes.map((o) => '<span class="fd-chip">' + esc(o) + '</span>').join('') +
      '</span>'
    : '';
  html = replaceOnce(html,
    '<span class="fd-label-sub">' + esc(sub) + '</span></span>',
    '</span><span class="fd-sub">' + esc(sub) + '</span>' + chips,
    'chapter ' + n + ' sub line');

  /* 2. the pending chapter has no label yet — a skeleton bar stands in */
  if (ch.pending) {
    html = replaceOnce(html,
      '<span class="fd-label-main"></span>',
      '<span class="fd-label-main"><span class="fd-ch-skel" aria-hidden="true"></span></span>',
      'chapter ' + n + ' skeleton');
  }

  /* 3. a warning is amber, not red */
  if (!ch.errors && ch.warnings) {
    html = replaceOnce(html, 'class="fd-err"', 'class="fd-err fd-warn"',
      'chapter ' + n + ' warning');
  }

  /* 4. mark the group so the TOC can address it and the CSS can scope */
  return replaceOnce(html,
    '<div class="fd-group" data-open=',
    '<div class="fd-group fd-chapter' + (ch.pending ? ' fd-ch-pending' : '') +
    '" data-chapter="' + n + '" data-open=',
    'chapter ' + n + ' group');
}

/* ------------------------------------------------ the table of contents */

function toc(chapters, ctx) {
  const esc = ctx.escape;
  const total = chapters.reduce((a, c) => a + c.events, 0);
  const cost = chapters.reduce((a, c) => a + c.cost, 0);
  const span = chapters[chapters.length - 1].to;

  const lines = chapters.map((ch, i) => {
    const n = i + 1;
    const label = ch.pending
      ? '<span class="fd-toc-lab fd-toc-lab-pending">' + esc(PENDING_TEXT) +
        '<span class="fd-toc-skel" aria-hidden="true"></span></span>'
      : '<span class="fd-toc-lab">' + esc(ch.label) + '</span>';
    return '<li class="fd-toc-item">' +
      '<button type="button" class="fd-toc-line" data-ch="' + n + '"' +
      (ch.pending ? ' data-pending="true"' : '') + '>' +
      '<span class="fd-toc-ord">' + n + '</span>' + label +
      '<span class="fd-toc-n">' + ch.events + ' events</span>' +
      '</button></li>';
  }).join('');

  return '<div class="fd-toc" data-collapsed="false">' +
      '<button type="button" class="fd-toc-bar" aria-expanded="false"' +
      ' aria-controls="fd-toc-panel" aria-label="Show all chapters">' + CARET +
        '<span class="fd-toc-now" data-fd-now-n>Chapter 1 of ' + chapters.length + '</span>' +
        '<span class="fd-toc-dot" aria-hidden="true">·</span>' +
        '<span class="fd-toc-now-label" data-fd-now-label>' +
          esc(chapters[0].label) + '</span>' +
      '</button>' +
      '<div class="fd-toc-panel" id="fd-toc-panel">' +
        '<button type="button" class="fd-toc-cap" aria-expanded="true"' +
        ' aria-controls="fd-toc-panel">' + CARET +
          '<span class="fd-toc-cap-t">Chapters</span>' +
          '<span class="fd-toc-cap-m">' + total + ' events · ' + span +
            ' · $' + cost.toFixed(2) + '</span>' +
        '</button>' +
        '<ol class="fd-toc-list">' + lines + '</ol>' +
      '</div>' +
    '</div>' +
    '<div class="fd-toc-space" aria-hidden="true"></div>';
}

/* ------------------------------------------------------------------ css */

const css = `
/* ---- chapter header: label row, then the gist, then the chips -------- */
.fd-group.fd-chapter > .fd-head {
  display: grid;
  grid-template-columns: 10px auto minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 8px;
  row-gap: 0;
  height: auto;
  min-height: 32px;
  padding: 7px 8px 8px 9px;
}
.fd-group.fd-chapter > .fd-head > .fd-caret { grid-area: 1 / 1; margin-top: 4px; }
.fd-group.fd-chapter > .fd-head > .fd-ord { grid-area: 1 / 2; line-height: 17px; }
.fd-group.fd-chapter > .fd-head > .fd-label { grid-area: 1 / 3; line-height: 17px; }
/* the gist is no longer inside .fd-label, so shared/feed.css's
   :has(.fd-label-sub) rule no longer relaxes it: the label's own block
   child has to carry the one-line ellipsis. */
.fd-group.fd-chapter .fd-label-main {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fd-group.fd-chapter > .fd-head > .fd-meta { grid-area: 1 / 4; line-height: 17px; }

.fd-sub {
  grid-area: 2 / 3 / 3 / 5;
  margin-top: 2px;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.38;
  color: var(--color-ink-600, #5a5a6a);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
.fd-chips {
  grid-area: 3 / 3 / 4 / 5;
  display: flex;
  gap: 6px;
  min-width: 0;
  margin-top: 5px;
}
.fd-chip {
  flex: 0 1 auto;
  min-width: 0;
  padding: 1px 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.55);
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-600, #5a5a6a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fd-warn { color: var(--color-amber-600, #c2620d); }

/* Chapter 6 is still being summarized: no label, no chips, tertiary lede. */
.fd-ch-pending > .fd-head > .fd-label { align-self: center; }
.fd-ch-skel {
  display: block;
  width: 208px;
  max-width: 70%;
  height: 9px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
}
.fd-ch-pending .fd-sub { color: var(--color-ink-400, #8a8a99); }

/* ---- table of contents ---------------------------------------------- */
/* Edge to edge inside the scroller: the list's own px-4/py-2 is cancelled
   so the pinned bar reads as part of the column, like the topbar above.

   The panel sticks for the WHOLE list, so it cannot live inside a wrapper
   of its own height — a sticky box is confined to its containing block, and
   a 165 px wrapper would unstick it 165 px in. It is a direct child of the
   list instead, and .fd-toc-space after it takes exactly the height the
   panel gives up when it collapses, so the 165 rows below never move. */
.fd-toc {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: -8px -16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  background: color-mix(in srgb, var(--color-ink-75, #f8f9fb) 96%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.fd-toc-space { height: 0; margin-bottom: 10px; }
/* the chapter headers stack under the collapsed bar, not behind it */
.fd-group.fd-chapter > .fd-head { top: 32px; }

.fd-toc-bar,
.fd-toc-cap,
.fd-toc-line {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  appearance: none;
}

.fd-toc-bar { height: 32px; padding: 0 8px 0 9px; }
.fd-toc-bar:hover { background: rgba(0, 0, 0, 0.02); }
.fd-toc-now {
  flex: none;
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-560, #666676);
}
.fd-toc-dot { flex: none; color: rgba(0, 0, 0, 0.18); }
.fd-toc-now-label {
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-ink-700, #4a4a5a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fd-toc-now-label.is-pending { font-weight: 400; color: var(--color-ink-400, #8a8a99); }

.fd-toc-cap { height: 26px; padding: 0 8px 0 9px; }
.fd-toc-cap-t {
  flex: none;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-900, #1a1a2e);
}
.fd-toc-cap-m {
  margin-left: auto;
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-560, #666676);
  white-space: nowrap;
}

.fd-toc-list { list-style: none; margin: 0; padding: 0 8px 6px 0; }
.fd-toc-line {
  height: 22px;
  padding: 0 0 0 9px;
  border-left: 2px solid transparent;
}
.fd-toc-line:hover { background: rgba(0, 0, 0, 0.02); }
.fd-toc-line:hover .fd-toc-lab { color: var(--color-ink-900, #1a1a2e); }
.fd-toc-ord {
  flex: none;
  width: 10px;
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-560, #666676);
}
.fd-toc-lab {
  min-width: 0;
  font-size: 12px;
  color: var(--color-ink-700, #4a4a5a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fd-toc-lab-pending {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  color: var(--color-ink-400, #8a8a99);
}
.fd-toc-skel {
  flex: 0 1 132px;
  height: 7px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
}
.fd-toc-n {
  flex: none;
  margin-left: auto;
  padding-left: 10px;
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-560, #666676);
}
.fd-toc-line[aria-current="true"] {
  border-left-color: #fb923c;
  background: rgba(251, 146, 60, 0.06);
}
.fd-toc-line[aria-current="true"] .fd-toc-lab {
  font-weight: 500;
  color: var(--color-ink-900, #1a1a2e);
}

.fd-toc-bar { display: none; }
.fd-toc[data-collapsed="true"] .fd-toc-bar { display: flex; }
.fd-toc[data-collapsed="true"] .fd-toc-panel { display: none; }
.fd-toc[data-collapsed="true"] .fd-toc-bar .fd-caret { transform: rotate(-90deg); }

.fd-toc-bar:focus-visible,
.fd-toc-cap:focus-visible,
.fd-toc-line:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.5);
  outline-offset: -2px;
  border-radius: 4px;
}

/* 1280: the column is 444 px, so the gist gives its third line to the
   chips rather than letting all three ellipsize. */
@media (max-width: 1360px) {
  .fd-sub { -webkit-line-clamp: 3; line-clamp: 3; }
  .fd-chips { flex-wrap: wrap; }
}
`;

/* ------------------------------------------------------------------- js */

const js = `
/* Table of contents: pin, collapse, and keep "where am I" true.

   Three jobs, one scroll listener:
     1. collapse the six-line index to one line as soon as the reader
        scrolls, and expand it again at the top;
     2. keep that one line naming the chapter the reader is actually in;
     3. jump to a chapter on click — opening it first if it is closed,
        because scrolling to a header with nothing under it reads as a
        broken link.

   The wrapper's height is measured once and pinned, so collapsing the
   panel cannot shift the 165 rows underneath it by 140 px. */
(function () {
  'use strict';

  var STICK = 32;          /* the collapsed bar's height */

  function init() {
    var list = document.querySelector('[data-feed-list]');
    var scroller = document.querySelector('.composer-scroll-tail');
    var toc = list && list.querySelector('.fd-toc');
    if (!list || !scroller || !toc) return;

    var space = list.querySelector('.fd-toc-space');
    var bar = toc.querySelector('.fd-toc-bar');
    var cap = toc.querySelector('.fd-toc-cap');
    var nowN = toc.querySelector('[data-fd-now-n]');
    var nowLabel = toc.querySelector('[data-fd-now-label]');
    var lines = Array.prototype.slice.call(toc.querySelectorAll('.fd-toc-line'));
    var groups = Array.prototype.slice.call(list.querySelectorAll('.fd-group[data-chapter]'));
    var at = -1;

    /* The expanded panel's height, measured once: whatever the collapsed
       bar gives back, the spacer takes, so nothing below it moves. */
    var full = 0;
    function reserve() {
      var was = toc.getAttribute('data-collapsed') === 'true';
      toc.setAttribute('data-collapsed', 'false');
      full = toc.offsetHeight;
      toc.setAttribute('data-collapsed', was ? 'true' : 'false');
      space.style.height = (was ? full - toc.offsetHeight : 0) + 'px';
    }

    function setCollapsed(v) {
      if ((toc.getAttribute('data-collapsed') === 'true') === v) return;
      toc.setAttribute('data-collapsed', v ? 'true' : 'false');
      space.style.height = (v ? full - toc.offsetHeight : 0) + 'px';
      bar.setAttribute('aria-expanded', v ? 'false' : 'true');
      cap.setAttribute('aria-expanded', v ? 'false' : 'true');
    }

    /* The chapter under the sticky line — the last one whose header has
       passed it. */
    function currentIndex() {
      var edge = scroller.getBoundingClientRect().top + STICK + 6;
      var idx = 0;
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].getBoundingClientRect().top <= edge) idx = i;
      }
      return idx;
    }

    function paint() {
      var i = currentIndex();
      if (i === at) return;
      at = i;
      nowN.textContent = 'Chapter ' + (i + 1) + ' of ' + lines.length;
      nowLabel.textContent = lines[i].querySelector('.fd-toc-lab').textContent;
      nowLabel.classList.toggle('is-pending',
        lines[i].getAttribute('data-pending') === 'true');
      for (var j = 0; j < lines.length; j++) {
        if (j === i) lines[j].setAttribute('aria-current', 'true');
        else lines[j].removeAttribute('aria-current');
      }
    }

    function goTo(i) {
      var g = groups[i];
      if (!g) return;
      if (g.getAttribute('data-open') !== 'true') {
        g.setAttribute('data-open', 'true');
        var head = g.querySelector('.fd-head');
        if (head) head.setAttribute('aria-expanded', 'true');
      }
      var top = scroller.scrollTop + g.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top - STICK - 4;
      scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    toc.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var line = t.closest('.fd-toc-line');
      if (line) { goTo(parseInt(line.getAttribute('data-ch'), 10) - 1); return; }
      if (t.closest('.fd-toc-bar')) {
        setCollapsed(false);
        scroller.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (t.closest('.fd-toc-cap')) {
        setCollapsed(toc.getAttribute('data-collapsed') !== 'true');
      }
    });

    var ticking = false;
    scroller.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        setCollapsed(scroller.scrollTop > 6);
        paint();
      });
    }, { passive: true });

    /* A group toggled by hand moves every header below it. */
    list.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('.fd-head')) {
        requestAnimationFrame(paint);
      }
    });

    window.addEventListener('resize', function () { reserve(); at = -1; paint(); });

    reserve();
    paint();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { reserve(); at = -1; paint(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;

/* -------------------------------------------------------------- module */

module.exports = {
  id: 'feed/3-chapters',
  file: '3-chapters.html',
  name: 'Chapters',
  premise: 'One group per LLM-written chapter, with a pinned table of contents.',
  needs: 'a windowed summarizer',
  css,
  js,
  transform(listHtml, ctx) {
    const chapters = ctx.data.CHAPTERS;
    if (!chapters || chapters.length !== 6) {
      throw new Error('3-chapters: expected six chapters, got ' +
        (chapters ? chapters.length : 0));
    }

    /* the ranges must cover every event exactly once, in order */
    let next = 0;
    chapters.forEach((ch, i) => {
      if (ch.eventRange[0] !== next) {
        throw new Error('3-chapters: chapter ' + (i + 1) + ' starts at ' +
          ch.eventRange[0] + ', expected ' + next);
      }
      if (ch.eventRange[1] - ch.eventRange[0] + 1 !== ch.events) {
        throw new Error('3-chapters: chapter ' + (i + 1) + ' claims ' + ch.events +
          ' events, its range holds ' + (ch.eventRange[1] - ch.eventRange[0] + 1));
      }
      next = ch.eventRange[1] + 1;
    });
    if (next !== ctx.events.length) {
      throw new Error('3-chapters: chapters cover ' + next + ' of ' +
        ctx.events.length + ' events');
    }

    /* the rows this page shows are the production rows, byte for byte:
       every chapter is a contiguous slice of exactly this string */
    if (ctx.events.map((ev) => ctx.rowHtml(ev)).join('') !== listHtml) {
      throw new Error('3-chapters: re-rendered rows differ from the production list');
    }

    return toc(chapters, ctx) +
      chapters.map((ch, i) => chapterGroup(ch, i + 1, ctx)).join('');
  }
};
