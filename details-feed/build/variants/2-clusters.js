/* Variant 2 — same-type clusters, no LLM, no group headers.

   SPEC-V2 §2: the lightest possible touch. Two changes to the production
   feed, and nothing else:

     (a) a run of >=3 consecutive rows of the SAME type collapses into ONE
         row of that type — the same disc, the same kind tag (with the count
         appended, "READ ×4"), the same chevron — whose summary is a
         machine JOIN of the children ("preds_dense.jsonl, preds_bm25.jsonl,
         preds_hybrid.jsonl, +1"). The chevron unfolds it into the original
         rows, which are pre-rendered underneath and merely hidden, so every
         one of the 165 events is one click (or one Enter) away;
     (b) an AGENT row gets 6 px of top margin and a hairline above it, so
         the agent's own message reads as the start of a section.

   No header, no ordinal, no meta, no LLM: the join is `String.split` over
   text that is already on the screen. This page is the baseline the other
   five are worth comparing against — how far grouping goes with no new
   generation.

   WHY A PRODUCTION ROW AND NOT ctx.fold(). fold() renders a light "+ SKILL
   ×6 · …" line, which is right for a run tucked INSIDE a group (variant 1)
   but wrong here: with no headers on the page, the collapsed run is the
   only thing standing in the feed at that position, so it has to BE a feed
   row — same 24 px disc, same 8 px kind tag, same chevron — or the eye
   reads it as chrome. So the collapsed row is ctx.rowHtml() on a synthetic
   event, i.e. production markup, and the only edit to it is the "×N" glued
   into the kind tag.

   ONE DELIBERATE CHOICE beyond the spec's wording: an unfolded cluster keeps
   its collapsed row, chevron now down, with the children indented 14 px
   behind a hairline. The spec does not say what unfolding looks like;
   keeping the row makes the fold a TOGGLE (a reviewer can put it back, and
   the same button does both by mouse and by keyboard) instead of a one-way
   door, and the indent is what says which rows the joined line was made of. */

'use strict';

const { KINDS } = require('../lib/rows');

/* --------------------------------------------------------- the join ----

   Every summary in the feed is written "<lead>: <detail>" —
   "preds_bm25.jsonl: 500 rows, 12 blank answers", "Task 2: score
   pre-filter…". The lead is the short name a person would use, so the join
   is: take the lead of each child, drop repeats, keep three, count the
   rest. Purely mechanical, and stable for any input. */

const LEAD_MAX = 30;   /* a ": " past this is prose, not a name */
const NAME_MAX = 24;   /* fallback name length, for a summary with no lead */
const SHOWN = 3;       /* names before "+N" */

function leadOf(summary) {
  const s = String(summary || '').trim();
  const c = s.indexOf(':');
  if (c > 0 && c <= LEAD_MAX) return s.slice(0, c).trim();
  const words = s.split(/\s+/);
  let out = words[0] || '';
  for (let i = 1; i < words.length && (out + ' ' + words[i]).length <= NAME_MAX; i++) {
    out += ' ' + words[i];
  }
  return out;
}

function detailOf(summary) {
  const s = String(summary || '').trim();
  const c = s.indexOf(':');
  return c > 0 && c <= LEAD_MAX ? s.slice(c + 1).trim() : s;
}

function uniq(list) {
  const seen = Object.create(null);
  return list.filter((v) => (seen[v] ? false : (seen[v] = true)));
}

function joined(items) {
  return items.length <= SHOWN
    ? items.join(', ')
    : items.slice(0, SHOWN).join(', ') + ', +' + (items.length - SHOWN);
}

/** The collapsed row's summary line, from the children's own summaries. */
function clusterSummary(children) {
  const names = uniq(children.map((e) => leadOf(e.summary)));
  if (names.length > 1) return joined(names);
  /* one lead for the whole run ("Evaluator skill: …" six times over): the
     names carry nothing, so join what actually differs, and if nothing
     does, the run is six identical rows — say it once. */
  const details = uniq(children.map((e) => detailOf(e.summary)));
  if (details.length > 1) return names[0] + ': ' + joined(details);
  return String(children[0].summary || '');
}

/* ------------------------------------------------------------- runs ---- */

/** Split the events into runs of one type; >=3 with real summaries clusters. */
function runsOf(events) {
  const runs = [];
  events.forEach((ev) => {
    const last = runs[runs.length - 1];
    if (last && last[0].type === ev.type) last.push(ev);
    else runs.push([ev]);
  });
  return runs;
}

/* A pending row (the last four of the run) has no summary yet, so there is
   nothing to join — leave those rows alone rather than print an empty line. */
function clusters(run) {
  return run.length >= 3 && run.every((ev) => ev.summary);
}

/* --------------------------------------------------------- rendering --- */

/* Glue "×4" into the kind tag of an already-rendered production row. The
   tag is `<span class="… uppercase">Read</span>`; CSS uppercases it, so
   "Read ×4" renders "READ ×4". Fails loudly if the row anatomy moves. */
function withCount(rowHtml, label, count) {
  const anchor = 'uppercase">' + label + '</span>';
  if (rowHtml.indexOf(anchor) === -1) {
    throw new Error('2-clusters: kind tag "' + label + '" not found in the row markup');
  }
  return rowHtml.replace(anchor,
    'uppercase">' + label + ' <span class="fd-cl-n">×' + count + '</span></span>');
}

/* aria-controls on the collapsed row's button, pointing at the hidden rows,
   so a screen reader is told what the chevron opens. */
function withControls(rowHtml, id) {
  return rowHtml.replace('aria-expanded="false"', 'aria-expanded="false" aria-controls="' + id + '"');
}

module.exports = {
  id: 'feed/2-clusters',
  file: '2-clusters.html',
  name: 'Clusters',
  premise: 'No headers: runs of the same type fold into one row of that type, and agent messages start a section.',
  needs: 'nothing new — a string join over rows already on screen',

  css: [
    /* the "×4" in the kind tag: same 8 px bold tag, mono and one step back
       so the count reads as a quantity rather than as part of the name */
    '.fd-cl-n{font-family:var(--font-mono,monospace);letter-spacing:.06em;',
    'color:var(--color-ink-560,#666676);}',
    /* an unfolded cluster: its rows sit 14 px in, behind the app's own
       hairline (black/6 %, the rule rows.js uses inside an expanded row) */
    '.fd-cl-rows{position:relative;padding-left:14px;}',
    '.fd-cl-rows::before{content:"";position:absolute;left:3px;top:1px;bottom:1px;',
    'width:1px;background:rgba(0,0,0,.06);}',
    /* once the rows are out, the joined line has done its job: it steps
       back to the meta colour so the eye goes to the children */
    '.fd-cl[data-open="true"]>.fd-cl-row .text-ink-600{color:var(--color-ink-400,#8a8a99);}',
    /* (b) an AGENT row starts a section: 6 px of air and a hairline, across
       the prose column the rows already occupy. Not on the first row. */
    '.fd-agent-start{margin-top:6px;border-top:1px solid rgba(0,0,0,.06);}',
    '.fd-agent-start:first-child{margin-top:0;border-top:0;}'
  ].join(''),

  /* One delegated click handler. The collapsed row is a real <button>, so
     Enter and Space already arrive here as clicks — no key handling. */
  js: [
    '(function(){',
    'var list=document.querySelector("[data-feed-list]");if(!list)return;',
    'function chevron(btn,open){',
    'var s=btn.querySelectorAll("svg.lucide-chevron-right,svg.lucide-chevron-down");',
    's=s.length?s[s.length-1]:null;if(!s)return;',
    's.classList.remove(open?"lucide-chevron-right":"lucide-chevron-down");',
    's.classList.add(open?"lucide-chevron-down":"lucide-chevron-right");',
    's.innerHTML=\'<path d="\'+(open?"m6 9 6 6 6-6":"m9 18 6-6-6-6")+\'"></path>\';}',
    'list.addEventListener("click",function(e){',
    'var row=e.target&&e.target.closest?e.target.closest(".fd-cl-row"):null;if(!row)return;',
    'var cl=row.parentNode,rows=cl.querySelector(".fd-cl-rows");if(!rows)return;',
    'var open=cl.getAttribute("data-open")!=="true";',
    'cl.setAttribute("data-open",open?"true":"false");',
    'rows.hidden=!open;',
    'var btn=row.querySelector("button");',
    'if(btn){btn.setAttribute("aria-expanded",open?"true":"false");chevron(btn,open);}',
    '});})();'
  ].join(''),

  transform(listHtml, ctx) {
    const out = [];
    runsOf(ctx.events).forEach((run) => {
      if (!clusters(run)) {
        run.forEach((ev) => out.push(ctx.rowHtml(ev, { extraClass: agentClass(ev) })));
        return;
      }
      const first = run[0];
      const id = 'fd-cl-' + first.i;
      const label = kindLabel(first.type);
      const head = withControls(
        withCount(
          ctx.rowHtml(
            { i: 'c' + first.i, type: first.type, t: first.t, summary: clusterSummary(run) },
            { turn: first.turn, extraClass: ('fd-cl-row ' + agentClass(first)).trim() }
          ),
          label, run.length),
        id);
      out.push(
        '<div class="fd-cl" data-open="false" data-count="' + run.length + '">' +
        head +
        '<div class="fd-cl-rows" id="' + id + '" hidden>' +
        run.map((ev) => ctx.rowHtml(ev, { extraClass: agentClass(ev) })).join('') +
        '</div></div>');
    });
    return out.join('');
  }
};

/* (b) again: the class that turns an agent message into a section start. */
function agentClass(ev) {
  return ev.type === 'AGENT' ? 'fd-agent-start' : '';
}

/* The kind tag's text for a type, from the same table rows.js renders from. */
function kindLabel(type) {
  const kind = KINDS[String(type).toUpperCase()];
  if (!kind) throw new Error('2-clusters: unmapped type "' + type + '"');
  return kind.label;
}
