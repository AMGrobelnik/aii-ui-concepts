/* The shared aggregation primitives every variant builds out of.

   SPEC-V2 fixes the LOOK of a group header so that only the SEMANTICS of a
   grouping differ between pages: 32 px row, 2 px orange spine, mono
   ordinal, 13 px/500 label, right-aligned 11 px mono meta, a <button> with
   aria-expanded, sticky inside the scroller, rows indented 20 px behind a
   hairline. That is all in shared/feed.css; these functions only emit the
   markup, so a variant never restates the design.

   Passed to a variant's transform() as ctx.groupHeader / ctx.group /
   ctx.fold — see build/README.md. */

'use strict';

const { escape } = require('./html');

/* 10 px caret, the same chevron the feed rows use, at group scale. */
const CARET =
  '<svg class="fd-caret" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"' +
  ' fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"' +
  ' stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';

/**
 * groupHeader({ ordinal, label, meta, error, open, sub }) -> header markup.
 *
 *   ordinal  mono index at the left ("01", "3", "R2")
 *   label    13 px / 500 title
 *   meta     right-aligned mono string, e.g. "21 events · 0:46 · $0.14"
 *   error    when truthy, appended to meta in the danger colour
 *            (`true` renders "1 error", a number renders "N errors",
 *             a string is used verbatim)
 *   open     initial state; drives aria-expanded and the caret
 *   sub      optional second line under the label (variants 3 and 4)
 */
function groupHeader(opts) {
  const o = opts || {};
  const open = o.open !== false;
  const errText = errorText(o.error);
  const label = o.sub
    ? '<span class="fd-label"><span class="fd-label-main">' + escape(o.label) +
      '</span><span class="fd-label-sub">' + escape(o.sub) + '</span></span>'
    : '<span class="fd-label">' + escape(o.label) + '</span>';

  return '<button type="button" class="fd-head" aria-expanded="' +
    (open ? 'true' : 'false') + '">' +
    CARET +
    '<span class="fd-ord">' + escape(o.ordinal == null ? '' : o.ordinal) + '</span>' +
    label +
    '<span class="fd-meta">' + escape(o.meta == null ? '' : o.meta) +
    (errText ? '<span class="fd-err"> · ' + escape(errText) + '</span>' : '') +
    '</span></button>';
}

function errorText(error) {
  if (!error) return '';
  if (error === true) return '1 error';
  if (typeof error === 'number') return error + (error === 1 ? ' error' : ' errors');
  return String(error);
}

/**
 * group(headerOpts, rowsHtml) -> a whole collapsible group.
 * The header is groupHeader(headerOpts); the rows sit in `.fd-rows`, which
 * shared/feed.css indents 20 px behind the hairline that continues the spine.
 */
function group(headerOpts, rowsHtml) {
  const open = !headerOpts || headerOpts.open !== false;
  return '<div class="fd-group" data-open="' + (open ? 'true' : 'false') + '">' +
    groupHeader(headerOpts) +
    '<div class="fd-rows">' + (rowsHtml || '') + '</div></div>';
}

/**
 * fold(rowsHtml, { kind, count, summary }) -> a folded run of identical rows.
 *
 * Renders one line — "SKILL ×6 · <summary>" behind a "+" — with the real
 * rows hidden underneath; shared/feed.js un-hides them on click. `kind` is
 * the row label ("Skill"), rendered uppercase by CSS exactly as a row's own
 * kind label is.
 */
function fold(rowsHtml, opts) {
  const o = opts || {};
  return '<div class="fd-fold" data-open="false">' +
    '<button type="button" class="fd-fold-head" aria-expanded="false">' +
    '<span class="fd-fold-plus" aria-hidden="true">+</span>' +
    '<span class="fd-fold-kind">' + escape(o.kind || '') +
    (o.count ? ' ×' + o.count : '') + '</span>' +
    (o.summary ? '<span class="fd-fold-sep">·</span><span class="fd-fold-sum">' +
      escape(o.summary) + '</span>' : '') +
    '</button>' +
    '<div class="fd-fold-rows" hidden>' + (rowsHtml || '') + '</div></div>';
}

module.exports = { groupHeader, group, fold };
