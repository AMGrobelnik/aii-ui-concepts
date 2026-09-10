# details-feed — how the pages are built

Every page in this folder is the **real** AI Inventor Details page. The
markup, the CSS and the fonts come from `../real-capture/`, captured from
the running app; the only edits are (a) the fictional run substituted for
the privacy scrub's `Lorem ipsum` placeholders and (b) **one aggregation
layer over the centre list**, which is the thing the mockups are actually
asking about.

So a variant page differs from production in exactly one place. That is the
point: if a grouping looks wrong here, it looks wrong in the product.

```
node build/build.js
```

No npm dependencies. It writes `0-today.html` … one file per variant module,
plus `index.html`, `css/`, `fonts/` and `assets/`.

## The variant contract

One file per page in `build/variants/`, named `<n>-<name>.js`. Files are
loaded in `sort()` order, and that order is the page sequence the review
bar's ← / → follow, so the numeric prefix is what orders the set.

```js
module.exports = {
  id: 'feed/3-chapters',     // page id — feedback + review bar key it on this
  file: '3-chapters.html',   // written next to index.html
  name: 'Chapters',          // shown in the review bar and on the index
  premise: 'One group per LLM-written chapter.',   // one sentence
  needs: 'a windowed summarizer',                  // build cost, for the index
  css: '',                   // injected into <style id="variant"> in <head>
  js: '',                    // injected into <script id="variant"> at </body>
  transform(listHtml, ctx) { // returns the centre list's markup
    return listHtml;
  }
};
```

`transform` receives the production list — 165 rows, in order — as a
**string**, and returns the string that is written into the page. Do not
reach outside it: the shell is shared and identical on every page.

### `ctx`

| key | what it is |
|---|---|
| `data` | the whole `window.AII` object from `shared/data.js` |
| `events` | the 165 events flattened in order, each stamped `.turn` |
| `baseList` | the same markup as the `listHtml` argument |
| `rowHtml(ev, opts)` | production row markup for one event |
| `groupHeader(opts)` | the SHARED group-header markup (SPEC-V2 §Header style) |
| `group(headerOpts, rowsHtml)` | header + `.fd-rows` wrapper, collapsible |
| `fold(rowsHtml, opts)` | a folded run of identical rows behind a "+" |
| `escape(s)` | HTML-escape for text and attribute values |

```js
rowHtml(event, {
  turn,        // stamped into data-turn (default: event.turn)
  expanded,    // render the row already open
  extraClass   // appended to the row root's class list
})
```

Every row carries `data-feed-row`, `data-i`, `data-type`, `data-turn` and
`data-t` (mm:ss), so a variant's own JS can address rows without re-rendering
them.

```js
groupHeader({
  ordinal,   // mono index at the left: "01", "3", "R2"
  label,     // 13 px / 500
  sub,       // optional second line (a chapter gist, a narrative lede)
  meta,      // right-aligned mono: "21 events · 0:46 · $0.14"
  error,     // true -> "1 error"; a number -> "N errors"; a string verbatim
  open       // default true
})

group({ ordinal, label, meta }, rowsHtml)

fold(rowsHtml, { kind: 'Skill', count: 6, summary: 'core skills read' })
```

`group()` and `fold()` are the whole aggregation vocabulary. Their look is
fixed in `shared/feed.css` and their behaviour in `shared/feed.js` — one
delegated click handler for row expansion, group toggling and unfolding —
so **a variant should not need CSS or JS of its own** unless it is adding
something genuinely new (variant 6's minimap, variant 3's table of contents).
Use the page's own colour tokens (`--color-ink-600`, `--color-brand`, …) if
you do.

## What the build does

| step | file |
|---|---|
| copy CSS + fonts, rewrite `url(/_next/static/media/…)` → `../fonts/…` | `lib/assets.js` |
| strip every `<script>`, preload link and `<noscript>`; repoint stylesheets | `lib/shell.js` |
| substitute the fictional run into the shell | `lib/shell.js` |
| render the 165 events as production rows | `lib/rows.js` |
| the shared header / group / fold markup | `lib/aggregate.js` |
| the right panel's throughput plot, as SVG | `lib/chart.js` |
| tolerant HTML surgery (nesting-aware, fails loudly) | `lib/html.js` |
| `index.html` from the variants' own metadata | `lib/index-page.js` |

Two things are worth knowing before changing any of it.

**Anchors fail loudly, on purpose.** Every substitution goes through a helper
that throws if its anchor is missing *or* ambiguous, and the finished page is
asserted free of `proxy.runpod`, `_next/static` and the scrub's placeholder
text. A build that silently leaves placeholder text on the page is worse than
a build that stops.

**The row markup is not approximated.** `lib/rows.js` rebuilds all 15 captured
row kinds and asserts the result is byte-identical to `rowtypes.json`; the six
kinds the capture has no example of (`TOOL`, `READ`, `WRITE`, `FIND`,
`SEARCH`, `ERROR`) are built from the same source production reads,
`aii_frontend/constants/message-types.ts`, with icon paths from the pinned
lucide-react. If either ever moves, the build fails instead of drifting.

## Checking a page

```
node build/verify.js 3-chapters.html feed-3-chapters
```

Drives a real Chromium at 1440×900 and 1280×720, writes the screenshots to
`../../shots/`, and reports console errors, failed requests, horizontal
scroll, whether the app's own fonts actually loaded, and whether any scrub
placeholder survived into the rendered text.

## Building one variant while others are in progress

```
ONLY=3-chapters.js node build/build.js
```

builds that page alone and leaves `index.html` untouched, so a sibling
module that is mid-edit cannot break your build. Run the full build once at
the end: the ← / → links on a page are computed from the set that was
built, so a single-variant build leaves them stale.
