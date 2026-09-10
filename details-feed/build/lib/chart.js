/* The right panel's "Token Throughput (tokens/min)" plot, as an <svg>.

   Production renders it with ECharts onto a <canvas>. A canvas in a static
   capture is BLANK — there is no ECharts on these pages — so the panel would
   read as broken. This module draws the same chart declaratively at the same
   234x140, from the same geometry ECharts was configured with, so the panel
   looks like the product rather than like a hole.

   Geometry, verbatim from aii_frontend/components/stats/line-chart.tsx as
   parameterised by right-panel/views/stats-view.tsx:

     container      234 x 140            (height={140})
     grid           left 40, right 12, top 16, bottom 24 (containLabel false)
     y axis         type "log", min 10^floor(log10 min), max 10^ceil(log10 max)
     y ticks        computeLogAxisTicks(): 100 px of plot area divided by the
                    decade span picks [1,2,5] / [1,3] / [1] sub-decade ticks
     y labels       formatCompactNumber, except the log floor 1, printed "0"
     gridlines      rgba(0,0,0,0.08), 1 px, only where a label prints
     axis + labels  hsl(240, 5%, 64%), fontSize 10
     x axis         category, boundaryGap false, one label per minute change
     series         lineWidth 2, symbol none, smooth 0.2

   The series colour is `#f59e0b` — index 1 of the module palette
   ["#6366f1", "#f59e0b", "#e879f9"], the one module active in this substep. */

'use strict';

const W = 234;
const H = 140;
const L = 40;
const R = 12;
const T = 16;
const B = 24;
const X0 = L;
const X1 = W - R;          /* 222 */
const Y0 = T;              /* 16  */
const Y1 = H - B;          /* 116 */
const AXIS = 'hsl(240, 5%, 64%)';
const GRID = 'rgba(0,0,0,0.08)';
const SERIES = '#f59e0b';
const FRAME_S = 5;         /* stats-view samples every 5 s */

/* stats-view.tsx `formatCompactNumber`, plus line-chart.tsx's rule that the
   log floor 1 prints as "0". */
function compact(v) {
  if (v === 1) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e9) return drop0((v / 1e9).toFixed(1)) + 'B';
  if (abs >= 1e6) return drop0((v / 1e6).toFixed(1)) + 'M';
  if (abs >= 1e3) return drop0((v / 1e3).toFixed(1)) + 'k';
  return String(v);
}
function drop0(s) { return s.replace(/\.0$/, ''); }

function secs(mmss) {
  const p = String(mmss).split(':').map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
}
function clock(startSec, offset) {
  const t = startSec + offset;
  const hh = Math.floor(t / 3600) % 24;
  const mm = Math.floor(t / 60) % 60;
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

/**
 * One tokens/min sample every 5 s across the substep, derived from the
 * turns: a turn's tokens are spread over its duration, and the plotted
 * value is the trailing 3-minute average the product plots. Quiet frames
 * fall to the log floor (1), exactly as stats-view maps them.
 */
function series(substep) {
  const total = secs(substep.duration.replace(/\s*m\s*/, ':').replace(/\s*s\s*/, ''));
  const frames = Math.max(2, Math.floor(total / FRAME_S) + 1);

  /* per-second token rate, laid down turn by turn */
  const perSec = new Array(total + 1).fill(0);
  const totalUsd = substep.turns.reduce((a, t) => a + (t.usd || 0), 0) || 1;
  substep.turns.forEach((turn) => {
    const t0 = secs(turn.t0);
    const dur = Math.max(1, secs(turn.dur));
    const tokens = substep.tokens * ((turn.usd || 0) / totalUsd);
    const rate = tokens / dur;
    for (let s = t0; s < Math.min(t0 + dur, perSec.length); s++) perSec[s] += rate;
  });

  /* trailing 3-minute average, expressed per minute */
  const out = [];
  for (let f = 0; f < frames; f++) {
    const at = f * FRAME_S;
    const from = Math.max(0, at - 180);
    let sum = 0;
    for (let s = from; s <= at && s < perSec.length; s++) sum += perSec[s];
    const span = Math.max(1, at - from + 1);
    out.push(Math.max(1, Math.round((sum / span) * 60)));
  }
  return out;
}

/* line-chart.tsx: the axis is clamped to whole decades around the data, and
   computeLogAxisTicks() picks the sub-decade density that fits 100 px of
   plot area (14 px per label). */
function axis(values) {
  const lo = Math.min.apply(null, values);
  const hi = Math.max.apply(null, values);
  const dMin = Math.floor(Math.log10(Math.max(1, lo)));
  const dMax = Math.ceil(Math.log10(Math.max(10, hi)));
  const decades = Math.max(1, dMax - dMin);
  const pxPerDecade = (Y1 - Y0) / decades;
  let subs;
  let stride = 1;
  if (pxPerDecade >= 42) subs = [1, 2, 5];
  else if (pxPerDecade >= 28) subs = [1, 3];
  else if (pxPerDecade >= 14) subs = [1];
  else { subs = [1]; stride = Math.ceil(14 / pxPerDecade); }
  const t = [];
  for (let d = dMin; d <= dMax; d += stride) {
    for (const s of subs) {
      const v = s * Math.pow(10, d);
      if (v >= Math.pow(10, dMin) && v <= Math.pow(10, dMax)) t.push(v);
    }
  }
  return { dMin, dMax, ticks: t };
}

/** Build the whole <svg>, ready to drop in where the <canvas> was. */
function chartSvg(substep, { startClock = '0:00' } = {}) {
  const vals = series(substep);
  const ax = axis(vals);
  const span = ax.dMax - ax.dMin;
  const y = (v) => Y1 - ((Math.log10(Math.max(1, v)) - ax.dMin) / span) * (Y1 - Y0);
  const x = (i) => X0 + (i / (vals.length - 1)) * (X1 - X0);

  const start = secs(startClock);
  const parts = [];

  /* gridlines + y labels, one per decade tick */
  ax.ticks.forEach((v) => {
    const yy = round(y(v));
    parts.push('<line x1="' + X0 + '" y1="' + yy + '" x2="' + X1 + '" y2="' + yy +
      '" stroke="' + GRID + '" stroke-width="1"></line>');
    parts.push('<text x="' + (X0 - 5) + '" y="' + (yy + 3) + '" text-anchor="end"' +
      ' font-size="10" fill="' + AXIS + '">' + compact(v) + '</text>');
  });

  /* x axis line and one label per minute change */
  parts.push('<line x1="' + X0 + '" y1="' + Y1 + '" x2="' + X1 + '" y2="' + Y1 +
    '" stroke="' + AXIS + '" stroke-width="1"></line>');
  parts.push('<line x1="' + X0 + '" y1="' + Y0 + '" x2="' + X0 + '" y2="' + Y1 +
    '" stroke="' + AXIS + '" stroke-width="1"></line>');

  let last = null;
  vals.forEach((_, i) => {
    const label = clock(start, i * FRAME_S);
    if (label === last) return;
    last = label;
    parts.push('<line x1="' + round(x(i)) + '" y1="' + Y1 + '" x2="' + round(x(i)) +
      '" y2="' + (Y1 + 4) + '" stroke="' + AXIS + '" stroke-width="1"></line>');
    parts.push('<text x="' + round(x(i)) + '" y="' + (Y1 + 15) + '" text-anchor="middle"' +
      ' font-size="10" fill="' + AXIS + '">' + label + '</text>');
  });

  /* the series — smooth 0.2 is a light Catmull-Rom; a polyline through the
     same points is the honest static equivalent */
  const pts = vals.map((v, i) => round(x(i)) + ',' + round(y(v))).join(' ');
  parts.push('<polyline fill="none" stroke="' + SERIES + '" stroke-width="2"' +
    ' stroke-linejoin="round" stroke-linecap="round" points="' + pts + '"></polyline>');

  return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"' +
    ' role="img" aria-label="Token throughput, tokens per minute"' +
    ' style="position: absolute; left: 0px; top: 0px; width: ' + W + 'px; height: ' +
    H + 'px; user-select: none;">' + parts.join('') + '</svg>';
}

function round(n) { return Math.round(n * 10) / 10; }

module.exports = { chartSvg, series, axis };
