/* AI Inventor details-feed mockups — feed interactions.

   Three delegated handlers, one listener each, on the centre list:

     1. a production row expands/collapses exactly as it does in the app —
        the expanded body (`div.space-y-2.mt-1.5.ml-7` with the Tool Input /
        Tool Output cards) is pre-rendered next to the button and simply
        un-hidden, and the chevron swaps chevron-right -> chevron-down;
     2. a group header (`.fd-head`) toggles its group;
     3. a folded run (`.fd-fold-head`) unfolds into the real rows.

   Every control is a real <button>, so Enter and Space already fire `click`
   — that is the whole keyboard story, no synthetic key handling needed. */

(function () {
  'use strict';

  var CHEVRON = {
    right: { cls: 'lucide-chevron-right', d: 'm9 18 6-6-6-6' },
    down: { cls: 'lucide-chevron-down', d: 'm6 9 6 6 6-6' }
  };

  /* Rewrite the chevron in place rather than toggling two pre-rendered
     icons, so the resulting DOM is byte-identical to what the app emits. */
  function setChevron(svg, open) {
    if (!svg) return;
    var from = open ? CHEVRON.right : CHEVRON.down;
    var to = open ? CHEVRON.down : CHEVRON.right;
    svg.classList.remove(from.cls);
    svg.classList.add(to.cls);
    svg.innerHTML = '<path d="' + to.d + '"></path>';
  }

  function rowChevron(btn) {
    var svgs = btn.querySelectorAll('svg.lucide-chevron-right, svg.lucide-chevron-down');
    return svgs.length ? svgs[svgs.length - 1] : null;
  }

  function toggleRow(btn) {
    var group = btn.parentNode;                       /* div.group.select-text */
    if (!group) return;
    var body = group.querySelector(':scope > [data-feed-body]');
    if (!body) return;
    var open = body.hidden;
    body.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    setChevron(rowChevron(btn), open);
  }

  function toggleGroup(head) {
    var group = head.closest('.fd-group');
    if (!group) return;
    var open = group.getAttribute('data-open') !== 'true';
    group.setAttribute('data-open', open ? 'true' : 'false');
    head.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function unfold(head) {
    var fold = head.closest('.fd-fold');
    if (!fold) return;
    fold.setAttribute('data-open', 'true');
    var rows = fold.querySelector('.fd-fold-rows');
    if (rows) rows.hidden = false;
  }

  function onClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var foldHead = t.closest('.fd-fold-head');
    if (foldHead) { unfold(foldHead); return; }

    var head = t.closest('.fd-head');
    if (head) { toggleGroup(head); return; }

    var btn = t.closest('[data-feed-row] > .group > button, [data-feed-row] button');
    if (btn && btn.closest('[data-feed-row]')) { toggleRow(btn); }
  }

  /* Production publishes the composer's height as `--composer-h` from a
     ResizeObserver in app/(app)/runs/[runId]/layout.tsx; `.composer-clearance`
     and `.composer-scroll-tail` both consume it, and the capture's value was
     digit-scrubbed to `0px`. Without this the last rows sit under the
     composer. Same measurement, six lines. */
  function measureComposer() {
    var composer = document.querySelector('[class*="lg:bottom-4"][class*="lg:absolute"]');
    if (!composer) return;
    var publish = function () {
      document.documentElement.style.setProperty(
        '--composer-h', composer.offsetHeight + 'px');
    };
    publish();
    if (window.ResizeObserver) new window.ResizeObserver(publish).observe(composer);
    window.addEventListener('resize', publish);
  }

  function init() {
    var list = document.querySelector('[data-feed-list]');
    (list || document).addEventListener('click', onClick);
    measureComposer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
