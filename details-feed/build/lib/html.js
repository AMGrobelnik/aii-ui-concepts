/* Tolerant HTML surgery for a 1.4 MB captured document.

   No DOM parser: jsdom is not installed and pulling one in would be the
   wrong trade for a build that only has to cut at a dozen well-identified
   anchors. What IS needed is a correct "where does this element end"
   scanner, because the regions we replace (the sidebar's Recents nav, the
   centre list) are deeply nested and a naive `.indexOf('</div>')` would cut
   at the first descendant's close tag.

   Everything here is byte-exact and fails loudly: a miss throws rather than
   silently leaving the capture's placeholder text in the page. */

'use strict';

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

/** Index just past the '>' of the open tag whose '<' sits at `start`. */
function openTagEnd(html, start) {
  let quote = null;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '>') return i + 1;
  }
  throw new Error('openTagEnd: unterminated tag at ' + start);
}

/**
 * Index just past the close tag of the element whose '<' sits at `start`.
 * Counts same-name opens and closes, so nesting is handled; self-closing and
 * void elements end at their own '>'.
 */
function elementEnd(html, start) {
  const m = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(html.slice(start, start + 64));
  if (!m) throw new Error('elementEnd: no tag at ' + start);
  const tag = m[1].toLowerCase();
  const bodyStart = openTagEnd(html, start);
  if (VOID_TAGS.has(tag) || html[bodyStart - 2] === '/') return bodyStart;

  const re = new RegExp('</?' + tag + '(?=[\\s>/])', 'gi');
  re.lastIndex = bodyStart;
  let depth = 1;
  let hit;
  while ((hit = re.exec(html))) {
    if (html[hit.index + 1] === '/') {
      if (--depth === 0) return openTagEnd(html, hit.index);
    } else {
      depth++;
    }
  }
  throw new Error('elementEnd: unclosed <' + tag + '> at ' + start);
}

/** [start, end) of the whole element that the literal `openTag` starts. */
function elementRange(html, openTag) {
  const start = indexOfOnce(html, openTag);
  return { start, end: elementEnd(html, start) };
}

/** Everything between the element's '>' and its '</tag'. */
function innerRange(html, openTag) {
  const { start, end } = elementRange(html, openTag);
  const bodyStart = openTagEnd(html, start);
  const closeLen = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(html.slice(start))[1].length + 3;
  return { start: bodyStart, end: end - closeLen };
}

/** Replace the children of the element `openTag` opens. */
function replaceInner(html, openTag, inner) {
  const r = innerRange(html, openTag);
  return html.slice(0, r.start) + inner + html.slice(r.end);
}

/** Replace the whole element that `openTag` opens. */
function replaceElement(html, openTag, replacement) {
  const r = elementRange(html, openTag);
  return html.slice(0, r.start) + replacement + html.slice(r.end);
}

/** Index of `needle`, asserting it occurs exactly once. */
function indexOfOnce(html, needle) {
  const i = html.indexOf(needle);
  if (i === -1) throw new Error('anchor not found: ' + brief(needle));
  if (html.indexOf(needle, i + needle.length) !== -1) {
    throw new Error('anchor is ambiguous (>1 occurrence): ' + brief(needle));
  }
  return i;
}

/** Replace a literal string that must occur exactly once. */
function replaceOnce(html, needle, replacement) {
  const i = indexOfOnce(html, needle);
  return html.slice(0, i) + replacement + html.slice(i + needle.length);
}

/** Replace a literal string that must occur at least once, every time. */
function replaceAll(html, needle, replacement) {
  if (html.indexOf(needle) === -1) throw new Error('anchor not found: ' + brief(needle));
  return html.split(needle).join(replacement);
}

/** Drop every element matching an open-tag regex, close tag included. */
function dropElements(html, openTagRe) {
  const re = new RegExp(openTagRe.source, openTagRe.flags.includes('g')
    ? openTagRe.flags : openTagRe.flags + 'g');
  const out = [];
  let cursor = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m.index < cursor) continue;
    const end = elementEnd(html, m.index);
    out.push(html.slice(cursor, m.index));
    cursor = end;
    re.lastIndex = end;
  }
  out.push(html.slice(cursor));
  return out.join('');
}

function brief(s) {
  const t = String(s).replace(/\s+/g, ' ');
  return t.length > 90 ? t.slice(0, 87) + '…' : t;
}

/** HTML-escape for text and attribute values. */
function escape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Throw if any of `terms` still appears in `html`. */
function assertAbsent(html, terms, what) {
  const found = terms.filter((t) => html.indexOf(t) !== -1);
  if (found.length) {
    throw new Error(what + ': forbidden strings still present -> ' + found.join(', '));
  }
}

module.exports = {
  elementEnd,
  elementRange,
  innerRange,
  replaceInner,
  replaceElement,
  indexOfOnce,
  replaceOnce,
  replaceAll,
  dropElements,
  escape,
  assertAbsent
};
