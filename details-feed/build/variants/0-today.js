/* Variant 0 — the control.

   The identity transform: production markup, fictional content, nothing
   added. Every other variant is measured against this page, so it must add
   NOTHING — no CSS, no JS, and `transform` hands the list straight back. */

'use strict';

module.exports = {
  id: 'feed/0-today',
  file: '0-today.html',
  name: 'Today',
  premise: 'The real page with fictional content; nothing added.',
  needs: 'nothing new — this is what ships today',
  css: '',
  js: '',
  transform(listHtml) {
    return listHtml;
  }
};
