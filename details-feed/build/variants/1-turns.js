/* Variant 1 — Agent turns.

   SPEC-V2 §1: one group per agent turn, and nothing in the layer is
   generated. The run already records its turns, so every field on a header
   is read straight off `SUBSTEP.turns[]`:

     ordinal  the turn number, zero-padded ("01" … "22")
     label    `turn.intent` — the agent's OWN first line, verbatim
     meta     "N events · m:ss · $x.xx", from turn.events / dur / usd
     error    the number of ERROR rows in the turn, when non-zero

   Inside a turn, a run of consecutive rows of the SAME kind folds into one
   line behind a "+" ("SKILL ×6"), so a turn reads as its shape rather than
   as its repetitions. All 22 turns are open on load; only those runs are
   closed, which is the one thing a reader has to click.

   No CSS and no JS: `ctx.group` / `ctx.fold` already carry the shared look
   (shared/feed.css) and the shared behaviour (shared/feed.js), and the
   whole page is static markup. */

'use strict';

/* A run has to be at least this long to be worth hiding. Two rows behind a
   "+" is one line saved and one click added; three is where the fold starts
   paying for itself. The six SKILL calls of turn 7 are the case the spec
   names, and the eight runs this threshold catches hide 30 of 165 rows. */
const FOLD_MIN = 3;

/* Up to this many distinct row summaries are named on a fold line before
   the rest become "+N" — the line is one ellipsised row, so naming more
   would only be truncated by CSS. */
const FOLD_NAMES = 3;

module.exports = {
  id: 'feed/1-turns',
  file: '1-turns.html',
  name: 'Turns',
  premise: 'One group per agent turn, labelled with the turn\'s own first line.',
  needs: 'nothing new — the run already records its turns',
  /* The one thing the shared CSS cannot know: a fold line stands IN the row
     column, so its text has to start where a row's kind label starts. A row
     is a 24 px icon disc plus an 8 px gap (kind label at +32); the fold's
     "+" is a 16 px box plus a 6 px gap (+22), which reads as a 10 px kink in
     an otherwise dead-straight left edge. Centre the smaller box in the same
     24 px column and the two agree exactly — no sizes are restated, only the
     margins that close the gap, and only on the box, so the rest of the fold
     line keeps the shared 6 px rhythm. */
  css: '.fd-fold-plus { margin-left: 4px; margin-right: 6px; }\n',
  js: '',

  transform(listHtml, ctx) {
    const turns = ctx.data.SUBSTEP.turns;
    const byTurn = new Map();
    ctx.events.forEach((ev) => {
      if (!byTurn.has(ev.turn)) byTurn.set(ev.turn, []);
      byTurn.get(ev.turn).push(ev);
    });

    const html = turns.map((turn) => {
      const events = byTurn.get(turn.n) || [];
      if (events.length !== turn.events.length) {
        throw new Error('1-turns: turn ' + turn.n + ' has ' + events.length +
          ' flattened events, the turn record says ' + turn.events.length);
      }
      return ctx.group({
        ordinal: pad(turn.n),
        label: turn.intent,
        meta: metaOf(turn, events),
        error: errorsIn(events),
        open: true
      }, rowsOf(events, ctx));
    }).join('');

    /* Every event still has to be reachable — a group that silently drops
       rows would look tidier and be wrong. */
    const rendered = (html.match(/data-feed-row="true"/g) || []).length;
    if (rendered !== ctx.events.length) {
      throw new Error('1-turns: rendered ' + rendered + ' of ' + ctx.events.length + ' rows');
    }
    return html;
  }
};

/* ---------------------------------------------------------------- header */

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

/** "8 events · 0:18 · $0.05" — the turn's own numbers, nothing derived. */
function metaOf(turn, events) {
  return events.length + (events.length === 1 ? ' event' : ' events') +
    ' · ' + turn.dur + ' · $' + turn.usd.toFixed(2);
}

function errorsIn(events) {
  return events.filter((ev) => String(ev.type).toUpperCase() === 'ERROR').length;
}

/* ------------------------------------------------------------------ rows */

/** A turn's rows, with runs of ≥ FOLD_MIN consecutive same-kind rows folded. */
function rowsOf(events, ctx) {
  const out = [];
  let run = [];

  const flush = () => {
    if (!run.length) return;
    if (run.length >= FOLD_MIN) {
      out.push(ctx.fold(run.map((ev) => ctx.rowHtml(ev)).join(''), {
        kind: label(run[0].type),
        count: run.length,
        summary: foldSummary(run)
      }));
    } else {
      run.forEach((ev) => out.push(ctx.rowHtml(ev)));
    }
    run = [];
  };

  events.forEach((ev) => {
    if (run.length && run[0].type === ev.type) run.push(ev);
    else { flush(); run = [ev]; }
  });
  flush();
  return out.join('');
}

/* The row kind as the row itself prints it: SKILL -> "Skill", the fold's
   own CSS uppercases it again. */
function label(type) {
  const s = String(type).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* A machine join of what the folded rows say, so the fold line still
   carries content rather than only a count. Rows that all say the same
   thing (the six evaluator-skill calls) keep that one summary; rows that
   differ are named by the part before their colon — the file, the task,
   the bucket — up to FOLD_NAMES of them, then "+N". */
function foldSummary(run) {
  const summaries = run.map((ev) => String(ev.summary || '').trim()).filter(Boolean);
  if (!summaries.length) return '';

  const same = summaries.every((s) => s === summaries[0]);
  if (same) return summaries[0];

  const names = [];
  summaries.forEach((s) => {
    const n = leadOf(s);
    if (n && names.indexOf(n) === -1) names.push(n);
  });
  const shown = names.slice(0, FOLD_NAMES).join(', ');
  const rest = names.length - FOLD_NAMES;
  return rest > 0 ? shown + ', +' + rest : shown;
}

/** "preds_bm25.jsonl: 500 rows, 12 blank" -> "preds_bm25.jsonl". */
function leadOf(summary) {
  const colon = summary.indexOf(':');
  return colon > 0 && colon <= 40 ? summary.slice(0, colon) : summary;
}
