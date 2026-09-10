/* AI Inventor details-feed mockups — review bar + arrow-key navigation.

   Adapted from details-view/shared/chrome.js (renderReviewBar / bindArrowKeys);
   copied rather than imported, per SPEC-V2 §Build approach step 5.

   Reads window.__PAGE = { id, variant, premise, prev, next } — build.js writes
   that object into every generated page. The bar is 44 px and sits ABOVE the
   app: it is position:fixed at the top and the app root is pushed down and
   shortened by the same 44 px (see shared/review.css). */

(function () {
  'use strict';

  var AII = (window.AII = window.AII || {});

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* Left/Right arrow keys move between pages. Ignored while typing in a
     field or when a modifier is held, so text editing and browser
     shortcuts keep working. */
  function bindArrowKeys(prev, next) {
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var t = e.target;
      if (t && t.closest && t.closest('[role="slider"]')) return;
      var tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
          (t && t.isContentEditable)) return;
      if (e.key === 'ArrowRight' && next) { e.preventDefault(); location.href = next; }
      if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); location.href = prev; }
    });
  }

  function renderReviewBar(opts) {
    var bar = el('div', 'reviewbar');
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', 'Mockup review');

    if (opts.id) {
      bar.appendChild(el('span', 'reviewbar-page', opts.id));
      bar.appendChild(el('span', 'reviewbar-sep', '·'));
    }
    bar.appendChild(el('span', 'reviewbar-variant', opts.variant || ''));
    bar.appendChild(el('span', 'reviewbar-sep', '·'));
    bar.appendChild(el('span', 'reviewbar-blurb', opts.premise || ''));

    var nav = el('div', 'reviewbar-nav');
    function link(href, text) {
      if (!href) return el('span', 'disabled', text);
      var a = el('a', null, text);
      a.href = href;
      return a;
    }
    nav.appendChild(link(opts.prev, '← previous'));
    nav.appendChild(el('span', 'reviewbar-sep', '·'));
    nav.appendChild(link(opts.indexHref || 'index.html', 'index'));
    nav.appendChild(el('span', 'reviewbar-sep', '·'));
    nav.appendChild(link(opts.next, 'next →'));
    nav.appendChild(el('span', 'reviewbar-keys', 'arrow keys'));
    bar.appendChild(nav);

    bindArrowKeys(opts.prev, opts.next);
    return bar;
  }

  function init() {
    var page = window.__PAGE;
    if (!page) return;
    if (document.querySelector('.reviewbar')) return;
    document.body.insertBefore(renderReviewBar(page), document.body.firstChild);
  }

  AII.renderReviewBar = renderReviewBar;
  AII.bindArrowKeys = bindArrowKeys;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
