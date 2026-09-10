#!/usr/bin/env node
/* Screenshot + assert the generated pages in a real browser.

   Not part of the build: this is the check the brief asks for — fonts
   actually loaded, no console errors, no failed requests, no horizontal
   scroll, and no scrub placeholder anywhere in the rendered text. */

'use strict';

const path = require('path');
const { chromium } = require('/home/adrian/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const OUT = path.resolve(__dirname, '..');
const SHOTS = path.resolve(OUT, '..', '..', 'shots');
const EXE = '/home/adrian/.cache/ms-playwright/chromium-1237/chrome-linux/chrome';

const PAGE = process.argv[2] || '0-today.html';
const TAG = process.argv[3] || 'feed-0-today';

async function main() {
  const browser = await chromium.launch({
    executablePath: EXE,
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  const report = [];
  for (const [w, h] of [[1440, 900], [1280, 720]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const errors = [];
    const failed = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('requestfailed', (r) => failed.push(r.url() + ' — ' + (r.failure() || {}).errorText));

    await page.goto('file://' + path.join(OUT, PAGE));
    await page.waitForTimeout(700);

    const facts = await page.evaluate(() => {
      const txt = document.body.innerText;
      const list = document.querySelector('[data-feed-list]');
      const rows = document.querySelectorAll('[data-feed-row]');
      const scroller = document.querySelector('.composer-scroll-tail');
      return {
        fontsSans: document.fonts.check('12px sans'),
        fontsMono: document.fonts.check('12px mono'),
        fontStatus: document.fonts.status,
        loadedFaces: Array.from(document.fonts).filter((f) => f.status === 'loaded')
          .map((f) => f.family + ' ' + f.weight),
        hasLorem: /lorem/i.test(txt),
        hasZeroRun: /0000/.test(txt),
        rows: rows.length,
        rowH: rows.length ? Math.round(rows[0].getBoundingClientRect().height) : 0,
        listW: list ? Math.round(list.getBoundingClientRect().width) : 0,
        hscroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        reviewH: Math.round((document.querySelector('.reviewbar') || {}).offsetHeight || 0),
        appTop: Math.round(document.getElementById('app-root').getBoundingClientRect().top),
        appH: Math.round(document.getElementById('app-root').getBoundingClientRect().height),
        composerH: getComputedStyle(document.documentElement).getPropertyValue('--composer-h'),
        scrollerH: scroller ? Math.round(scroller.scrollHeight) : 0,
        sidebar: !!document.querySelector('nav[aria-label="Recent runs"]'),
        recents: document.querySelectorAll('nav[aria-label="Recent runs"] a').length,
        cards: document.querySelectorAll('section[aria-label="Run structure"] button.rounded-xl').length,
        tiles: Array.from(document.querySelectorAll('.tabular-nums.text-lg')).map((e) => e.textContent),
        chart: !!document.querySelector('svg[aria-label^="Token throughput"]'),
        feedback: !!document.querySelector('.fb'),
        title: (document.querySelector('main .truncate') || {}).textContent
      };
    });

    await page.screenshot({ path: path.join(SHOTS, TAG + '-' + w + '.png') });

    if (w === 1440) {
      /* one row expanded, exactly as a click does it */
      await page.evaluate(() => {
        document.querySelectorAll('[data-feed-row] button')[9].click();
        document.querySelector('.composer-scroll-tail').scrollTop = 0;
      });
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(SHOTS, TAG + '-expanded.png') });
      const exp = await page.evaluate(() => {
        const b = document.querySelectorAll('[data-feed-row]')[9];
        return {
          open: b.querySelector('button').getAttribute('aria-expanded'),
          bodyVisible: !b.querySelector('[data-feed-body]').hidden,
          chevron: !!b.querySelector('svg.lucide-chevron-down'),
          height: Math.round(b.getBoundingClientRect().height)
        };
      });
      report.push('expanded row: ' + JSON.stringify(exp));

      await page.evaluate(() => {
        const s = document.querySelector('.composer-scroll-tail');
        s.scrollTop = s.scrollHeight;
      });
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(SHOTS, TAG + '-bottom.png') });
      const tail = await page.evaluate(() => {
        const rows = document.querySelectorAll('[data-feed-row]');
        const last = rows[rows.length - 1].getBoundingClientRect();
        const composer = document.querySelector('[class*="lg:bottom-4"][class*="lg:absolute"]')
          .getBoundingClientRect();
        return {
          lastBottom: Math.round(last.bottom),
          composerTop: Math.round(composer.top),
          clear: last.bottom <= composer.top
        };
      });
      report.push('bottom: ' + JSON.stringify(tail));
    }

    report.push(w + 'x' + h + ': ' + JSON.stringify(facts, null, 1));
    report.push(w + ' console errors: ' + (errors.length ? errors.join(' | ') : 'none'));
    report.push(w + ' failed requests: ' + (failed.length ? failed.join(' | ') : 'none'));
    await ctx.close();
  }

  await browser.close();
  console.log(report.join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
