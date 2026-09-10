/* Variant 4 — Narrative windows.

   SPEC-V2 §4: the run ALREADY writes an interim narrative roughly every two
   minutes (`status_public_interim_summary`), and today it is shown only on
   Overview, in the right-hand Summary box, one window at a time behind a
   ‹ 1/3 › pager. Nothing generates it for this page and nothing has to: the
   text exists, it is written about exactly the stretch of the feed the
   reader is looking at, and it is the only place in the product where the
   run says what it was doing in prose. So this layer moves that prose into
   the feed and lets it stand in for the sixty rows underneath it.

   The header is therefore NOT the 32 px shared header — the whole point is
   that the narrative is READ, not scanned, so it gets the app's serif at
   14 px/1.55 on a 62 ch measure, with the window's mono time range above it.
   Everything else is deliberately the shared vocabulary: the same 2 px
   orange spine down the left, the same 20 px indent for the rows, and the
   rows themselves in ctx.group()'s `.fd-rows` wrapper so shared/feed.js
   toggles them exactly as it toggles a turn group on variant 1 — click,
   Enter and Space, one delegated handler, no JS of our own.

   Quiet on purpose: the serif is the one bold thing on the page. The
   time range, the "62 events" toggle and its meta are all 11 px mono in the
   secondary ink, so the eye lands on the prose and then, only if the reader
   wants it, on the row count.

   Windows come straight from data.NARRATIVES — three of them, each with an
   inclusive `eventRange` into the 165 events, so every event belongs to
   exactly one window and none is dropped. Window 2 is open (SPEC-V2), the
   other two collapsed. */

'use strict';

/* The app's own tokens, read from the captured bundle (css/all.css):

     --font-serif   var(--font-serif-file), "Source Serif 4", serif
     --font-mono    var(--font-mono-file), JetBrains Mono, monospace
     --color-ink-800 #3a3a4a   the narrative prose
     --color-ink-450 #7a7a88   the time range
     --color-ink-560 #666676   the toggle line and its meta

   #fb923c is the orange the tree paints "Create Artifacts" with — the same
   accent shared/feed.css already uses for the group spine, restated here
   only because this header is our own element. */
const CSS = `
/* --- the window ------------------------------------------------------ */
.fd-win { margin: 0; }
.fd-win + .fd-win { margin-top: 30px; }
.fd-win:first-child { margin-top: 2px; }

/* The tall serif header. Same spine and same 11 px left inset as the shared
   32 px header (2 px border + 9 px padding), so the two read as one family. */
.fd-win-head {
  border-left: 2px solid #fb923c;
  padding: 1px 0 11px 9px;
}

.fd-win-time {
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: var(--color-ink-450, #7a7a88);
  margin-bottom: 7px;
}

.fd-win-p {
  margin: 0;
  max-width: 62ch;
  font-family: var(--font-serif, "Source Serif 4", serif);
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-ink-800, #3a3a4a);
  text-wrap: pretty;
}
.fd-win-p + .fd-win-p { margin-top: 10px; }

/* --- the toggle ------------------------------------------------------ */
/* Still the shared .fd-head — same spine, same sticky behaviour, same
   handler — just dressed down to a mono count line so it cannot compete
   with the prose above it. */
.fd-win .fd-group { margin: 0; }
.fd-win .fd-head { height: 28px; gap: 6px; }
.fd-win .fd-ord { display: none; }
.fd-win .fd-label {
  font-family: var(--font-mono, mono, monospace);
  font-size: 11px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink-560, #666676);
}
.fd-win .fd-head:hover .fd-label { color: var(--color-ink-900, #1a1a2e); }
`;

function money(usd) {
  return '$' + usd.toFixed(2);
}

module.exports = {
  id: 'feed/4-narratives',
  file: '4-narratives.html',
  name: 'Narratives',
  premise: "The run's own interim narrative, every ~2 minutes, as the group header.",
  needs: 'nothing new — the run already writes this text',
  css: CSS,
  js: '',

  transform(listHtml, ctx) {
    const windows = ctx.data.NARRATIVES;
    if (!Array.isArray(windows) || !windows.length) {
      throw new Error('4-narratives: window.AII.NARRATIVES is empty');
    }

    let covered = 0;
    const html = windows.map((win, i) => {
      const [a, b] = win.eventRange;
      const slice = ctx.events.slice(a, b + 1);
      if (!slice.length) throw new Error('4-narratives: window ' + i + ' is empty');
      covered += slice.length;

      const usd = slice.reduce((sum, ev) => sum + (ev.usd || 0), 0);
      const turns = new Set(slice.map((ev) => ev.turn)).size;
      const errors = slice.filter((ev) => ev.type === 'ERROR').length;

      /* SPEC-V2: every window collapsed except the second. */
      const open = i === 1;

      const head =
        '<div class="fd-win-head">' +
        '<div class="fd-win-time">' + ctx.escape(win.from + ' – ' + win.to) + '</div>' +
        win.paragraphs
          .map((p) => '<p class="fd-win-p">' + ctx.escape(p) + '</p>')
          .join('') +
        '</div>';

      const rows = slice.map((ev) => ctx.rowHtml(ev)).join('');

      return '<section class="fd-win">' + head + ctx.group({
        label: slice.length + (slice.length === 1 ? ' event' : ' events'),
        /* No duration here: the mono line directly above IS the window's
           time range, and repeating it as "2:00" only adds noise. */
        meta: turns + (turns === 1 ? ' turn · ' : ' turns · ') + money(usd),
        error: errors || false,
        open
      }, rows) + '</section>';
    }).join('');

    if (covered !== ctx.events.length) {
      throw new Error('4-narratives: windows cover ' + covered + ' of ' +
        ctx.events.length + ' events');
    }
    return html;
  }
};
