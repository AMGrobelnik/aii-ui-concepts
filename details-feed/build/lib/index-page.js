/* index.html — SPEC-V2 §Index.

   Generated from the variant modules' own metadata, so a new
   build/variants/<n>-<name>.js appears here the moment it is added; nothing
   about the list is written twice.

   Deliberately plain: the app's own Inter (the same self-hosted files the
   mockups load), a single column, no cards. It is a contents page for the
   seven mockups, not another mockup. */

'use strict';

const { escape } = require('./html');
const { compactDuration } = require('./shell');

function renderIndex(variants, data) {
  const rows = variants.map((v, i) => row(v, i)).join('\n');
  /* variant 0 is the control, so the layers are everything after it */
  const layers = variants.length - 1;
  const heading = layers > 0
    ? layers + ' aggregation layer' + (layers === 1 ? '' : 's') +
      ' over the same ' + data.SUBSTEP.events + ' messages'
    : 'the control page, ' + data.SUBSTEP.events + ' messages';

  return [
'<!doctype html>',
/* The three classes the captured shell puts on <html>. They are the only
   definition of --font-sans-file / --font-mono-file / --font-serif-file, so
   without them `body.font-sans` resolves to nothing and the index alone
   renders in the browser's default UI sans instead of the bundled faces. */
'<html lang="en" class="__variable_d3a27a __variable_3d904d __variable_1ffd2b">',
'<head>',
'<meta charset="utf-8">',
'<meta name="viewport" content="width=device-width, initial-scale=1">',
'<title>Details feed — aggregation layers</title>',
'<link rel="icon" href="assets/logo_64.png" type="image/png">',
'<link rel="stylesheet" href="css/all.css">',
'<link rel="stylesheet" href="shared/review.css">',
'<style>' + CSS + '</style>',
'</head>',
'<body class="font-sans antialiased">',
'<main class="idx">',
'  <h1>Details feed — ' + heading + '</h1>',
'  <p class="idx-lede">Every page below is the real Details page, filled with a',
'  fictional run. The shell, the tree, the panel and the row markup are',
'  production; the only difference between pages is what sits <em>one level',
'  above</em> the per-message summaries. Page 0 is the control — today\'s page,',
'  nothing added — so the question each of the others answers is: is this level',
'  worth building, and what would it cost?</p>',
'  <p class="idx-lede">' + escape(data.SUBSTEP.name) + ' of ' +
  escape(data.SUBSTEP.module) + ', round ' + data.SUBSTEP.round + ' — ' +
  data.SUBSTEP.events + ' messages across ' + data.SUBSTEP.turns.length +
  ' agent turns, ' + escape(compactDuration(data.SUBSTEP.duration)) + ', $' +
  data.SUBSTEP.cost.toFixed(2) + '. Vote and note on each page or here; both',
'  write to the same place.</p>',
'  <ol class="idx-list">',
rows,
'  </ol>',
'  <div class="idx-actions">',
'    <button type="button" id="idx-copy">Copy all feedback</button>',
'    <button type="button" id="idx-clear">Clear all</button>',
'    <span id="idx-said" class="idx-said" role="status"></span>',
'  </div>',
'  <p class="idx-foot">Right arrow opens ' + escape(variants[0].file) +
  '. On a page, ← and → step through the sequence and the last one returns here.</p>',
'</main>',
'<script src="shared/feedback.js"></script>',
'<script>' + JS(variants) + '</script>',
'</body>',
'</html>'
  ].join('\n');
}

function row(v, i) {
  return [
'    <li class="idx-item" data-page-id="' + escape(v.id) + '">',
'      <a class="idx-num" href="' + escape(v.file) + '">' + i + '</a>',
'      <div class="idx-body">',
'        <a class="idx-name" href="' + escape(v.file) + '">' + escape(v.name) + '</a>',
'        <div class="idx-premise">' + escape(v.premise) + '</div>',
'        <div class="idx-needs">needs: ' + escape(v.needs) + '</div>',
'      </div>',
'      <div class="idx-vote"><span class="idx-vote-mark"></span><span class="idx-note"></span></div>',
'    </li>'
  ].join('\n');
}

const CSS = `
body { margin: 0; background: var(--color-ink-75, #f8f9fb); color: var(--color-ink-900, #1a1a2e); }
.idx { max-width: 820px; margin: 0 auto; padding: 48px 24px 72px; }
.idx h1 { margin: 0 0 14px; font-size: 20px; font-weight: 600; line-height: 1.3; }
.idx-lede { margin: 0 0 12px; max-width: 78ch; font-size: 13.5px; line-height: 1.6; color: var(--color-ink-600, #5a5a6a); }
.idx-lede em { font-style: normal; font-weight: 600; color: var(--color-ink-900, #1a1a2e); }
.idx-list { list-style: none; margin: 26px 0 0; padding: 0; }
.idx-item { display: flex; align-items: baseline; gap: 14px; padding: 14px 0; border-top: 1px solid rgba(0, 0, 0, 0.07); }
.idx-item:last-child { border-bottom: 1px solid rgba(0, 0, 0, 0.07); }
.idx-num { flex: none; width: 18px; font-family: var(--font-mono, mono, monospace); font-size: 12px; color: var(--color-ink-560, #666676); text-decoration: none; }
.idx-body { flex: 1 1 auto; min-width: 0; }
.idx-name { display: inline-block; font-size: 14px; font-weight: 600; color: var(--color-ink-900, #1a1a2e); text-decoration: none; }
.idx-name:hover { text-decoration: underline; }
.idx-premise { margin-top: 3px; font-size: 13px; line-height: 1.55; color: var(--color-ink-600, #5a5a6a); }
.idx-needs { margin-top: 4px; font-family: var(--font-mono, mono, monospace); font-size: 11px; color: var(--color-ink-560, #666676); }
.idx-vote { flex: none; width: 190px; text-align: right; font-size: 12px; color: var(--color-ink-600, #5a5a6a); }
.idx-vote-mark { display: block; font-weight: 600; }
.idx-vote-mark[data-vote="like"] { color: #059669; }
.idx-vote-mark[data-vote="dislike"] { color: var(--color-red-600, #dc2626); }
.idx-vote-mark[data-vote="unsure"] { color: #d97706; }
.idx-note { display: block; margin-top: 2px; font-size: 11.5px; line-height: 1.45; color: var(--color-ink-560, #666676); white-space: pre-wrap; overflow-wrap: anywhere; }
.idx-actions { display: flex; align-items: center; gap: 10px; margin-top: 26px; }
.idx-actions button { appearance: none; cursor: pointer; border: 1px solid rgba(0, 0, 0, 0.12); border-radius: 6px; background: #fff; padding: 6px 11px; font: inherit; font-size: 12px; color: var(--color-ink-900, #1a1a2e); }
.idx-actions button:hover { border-color: rgba(0, 0, 0, 0.25); }
.idx-said { font-size: 12px; color: var(--color-ink-560, #666676); }
.idx-foot { margin-top: 22px; font-size: 12px; color: var(--color-ink-560, #666676); }
@media (max-width: 720px) { .idx-item { flex-wrap: wrap; } .idx-vote { width: 100%; text-align: left; } }
`;

function JS(variants) {
  const first = variants[0].file;
  const last = variants[variants.length - 1].file;
  const ids = variants.map((v) => v.id);
  return `
(function () {
  'use strict';
  var fb = window.AII && window.AII.feedback;
  if (fb && fb.setOrder) fb.setOrder(${JSON.stringify(ids)});

  var WORD = { like: 'liked', dislike: 'disliked', unsure: 'unsure' };

  function paint() {
    var all = fb ? fb.getAll() : {};
    var items = document.querySelectorAll('.idx-item');
    for (var i = 0; i < items.length; i++) {
      var id = items[i].getAttribute('data-page-id');
      var rec = all[id] || {};
      var mark = items[i].querySelector('.idx-vote-mark');
      var note = items[i].querySelector('.idx-note');
      mark.textContent = rec.vote ? WORD[rec.vote] : '';
      if (rec.vote) mark.setAttribute('data-vote', rec.vote);
      else mark.removeAttribute('data-vote');
      note.textContent = rec.note || '';
    }
  }

  function say(msg) {
    var el = document.getElementById('idx-said');
    el.textContent = msg;
    window.setTimeout(function () { el.textContent = ''; }, 2000);
  }

  document.getElementById('idx-copy').addEventListener('click', function () {
    var text = fb ? fb.exportText() : '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { say('copied'); },
        function () { say('could not copy'); });
    } else {
      say('clipboard unavailable');
    }
  });

  document.getElementById('idx-clear').addEventListener('click', function () {
    if (!window.confirm('Clear every vote and note?')) return;
    if (fb) fb.clearAll();
    paint();
    say('cleared');
  });

  window.addEventListener('storage', paint);
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); location.href = ${JSON.stringify(first)}; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); location.href = ${JSON.stringify(last)}; }
  });

  paint();
})();
`;
}

module.exports = { renderIndex };
