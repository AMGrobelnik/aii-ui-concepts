/* AI Inventor mockups — shared chrome (SPEC §2).
   Loaded after shared/data.js. Attaches to window.AII without clobbering
   anything data.js already put there. No framework, no CDN, no router. */

(function () {
  'use strict';

  var AII = (window.AII = window.AII || {});

  /* =================================================================
     1. Icons — lucide-style, drawn here, never fetched
     ================================================================= */

  var ICONS = {
    'bot': '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M9 13v2"/><path d="M15 13v2"/>',
    'brain': '<path d="M12 5.5A2.5 2.5 0 0 0 7.6 3.9 2.5 2.5 0 0 0 5.2 7 2.7 2.7 0 0 0 4 9.3a2.7 2.7 0 0 0 1 2.1A2.7 2.7 0 0 0 4.4 14a2.6 2.6 0 0 0 1.8 2.4A2.4 2.4 0 0 0 8.6 20 2.5 2.5 0 0 0 12 18.5z"/><path d="M12 5.5A2.5 2.5 0 0 1 16.4 3.9 2.5 2.5 0 0 1 18.8 7 2.7 2.7 0 0 1 20 9.3a2.7 2.7 0 0 1-1 2.1 2.7 2.7 0 0 1 .6 2.6 2.6 2.6 0 0 1-1.8 2.4A2.4 2.4 0 0 1 15.4 20 2.5 2.5 0 0 1 12 18.5z"/><path d="M12 5.5v13"/>',
    'sparkles': '<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18.5 14.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>',
    'settings': '<path d="M4 7h9"/><path d="M18 7h2"/><circle cx="15.5" cy="7" r="2.2"/><path d="M4 17h4"/><path d="M13 17h7"/><circle cx="10.5" cy="17" r="2.2"/>',
    'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7.5L3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    'rotate-cw': '<path d="M20.5 12a8.5 8.5 0 1 1-2.9-6.4"/><path d="M20.5 3.5v6h-6"/>',
    'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'wrench': '<path d="M14.6 6.4a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.7-3.7a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    'terminal': '<path d="M4 17l6-5-6-5"/><path d="M12 19h8"/>',
    'file-text': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8.5 13.5h7"/><path d="M8.5 17h4.5"/>',
    'file-plus': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M12 12.5v5"/><path d="M9.5 15h5"/>',
    'pencil': '<path d="M16.8 3.2a2.7 2.7 0 0 1 3.9 3.9L7.6 20.3 2.5 21.5l1.2-5.1z"/><path d="M14.8 5.2l4 4"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.2-4.2"/>',
    'list-todo': '<path d="M3 5.5l1.8 1.8L8 4"/><path d="M3 15.5l1.8 1.8L8 14"/><path d="M11.5 6.5H21"/><path d="M11.5 16.5H21"/>',
    'zap': '<path d="M13.5 2.5L4 13.5h7l-.5 8 9.5-11h-7z"/>',
    'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.3h.01"/>',
    'alert-triangle': '<path d="M10.3 4L2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4"/><path d="M12 17.3h.01"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 16.5V11"/><path d="M12 7.7h.01"/>',
    'check': '<path d="M20 6.5L9.2 17.3 4 12.1"/>',
    'chevron-right': '<path d="M9 18l6-6-6-6"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'play': '<path d="M6.5 4.2l13 7.8-13 7.8z"/>',
    'share': '<path d="M4 12.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.5"/><path d="M16 6.5L12 2.5 8 6.5"/><path d="M12 2.5v12"/>',
    'bug': '<path d="M8.5 6.2a3.5 3.5 0 0 1 7 0"/><path d="M7 10a5 5 0 0 1 10 0v4a5 5 0 0 1-10 0z"/><path d="M2.5 10H7"/><path d="M17 10h4.5"/><path d="M2.5 16H7"/><path d="M17 16h4.5"/><path d="M12 10v8"/>',
    'github': '<path d="M15 21.5v-3.6a3.4 3.4 0 0 0-.9-2.6c3 0 6-2 6-5.6a4.4 4.4 0 0 0-1-3.1 4.1 4.1 0 0 0-.1-3.1s-1 0-3 1.4a10.4 10.4 0 0 0-5.5 0C8.5 3.5 7.5 3.5 7.5 3.5a4.1 4.1 0 0 0-.1 3.1 4.4 4.4 0 0 0-1 3.1c0 3.6 3 5.6 6 5.6a3.4 3.4 0 0 0-.9 2.6v3.6"/><path d="M9.5 18.5c-3.6 1.5-3.6-1.8-5.5-2.3"/>',
    'plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
    'star': '<path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.7l6.1-.9z"/>',
    'x': '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    'arrow-right': '<path d="M4.5 12h15"/><path d="M13 5.5l6.5 6.5-6.5 6.5"/>',
    'pause': '<path d="M9.5 4.5v15"/><path d="M14.5 4.5v15"/>',
    'minus': '<path d="M5 12h14"/>'
  };

  function icon(name, size) {
    var s = size == null ? 12 : size;
    var body = ICONS[name] || ICONS['info'];
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" ' +
      'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  /* --- event type -> icon / colour (SPEC §1) --- */

  var ROW_ICON = {
    INFO: 'info', CONFIG: 'settings', PROMPT: 'message-square', AGENT: 'bot',
    THINK: 'brain', TOOL: 'wrench', TERMINAL: 'terminal', READ: 'file-text',
    WRITE: 'file-plus', EDIT: 'pencil', FIND: 'search', SEARCH: 'search',
    TODO: 'list-todo', SKILL: 'zap', RETRY: 'rotate-cw', ERROR: 'alert-circle',
    WARNING: 'alert-triangle', SUCCESS: 'check', SUMMARY: 'sparkles',
    USER: 'user', SYSTEM: 'settings'
  };

  var ROW_COLOR = {
    AGENT: '#7c3aed', THINK: '#4f46e5', SUMMARY: '#db2777', CONFIG: '#64748b',
    PROMPT: '#2563eb', RETRY: '#d97706', USER: '#0d9488',
    TOOL: '#2563eb', TERMINAL: '#2563eb', READ: '#2563eb', WRITE: '#2563eb',
    EDIT: '#2563eb', FIND: '#2563eb', SEARCH: '#2563eb', TODO: '#2563eb',
    SKILL: '#2563eb', ERROR: '#dc2626', WARNING: '#d97706', INFO: '#64748b',
    SYSTEM: '#64748b', SUCCESS: '#16a34a'
  };

  function typeKey(type) { return String(type == null ? 'INFO' : type).toUpperCase(); }
  function rowIcon(type) { return ROW_ICON[typeKey(type)] || 'info'; }
  function rowColor(type) { return ROW_COLOR[typeKey(type)] || '#64748b'; }
  /* 15 % alpha behind the 24 px circle: 0.15 * 255 = 38 = 0x26 */
  function tint(hex) { return hex + '26'; }

  AII.icon = icon;
  AII.ICONS = ICONS;
  AII.rowIcon = rowIcon;
  AII.rowColor = rowColor;
  AII.tint = tint;
  /* data.js owns iconFor/colorFor; only fill in if it did not ship them */
  AII.iconFor = AII.iconFor || rowIcon;
  AII.colorFor = AII.colorFor || rowColor;

  /* module accents cycle purple, blue, orange per module */
  var ACCENTS = ['var(--mod-purple)', 'var(--mod-blue)', 'var(--mod-orange)'];
  AII.ACCENTS = ACCENTS;
  AII.accent = function (i) { return ACCENTS[((i % 3) + 3) % 3]; };
  /* Create Artifacts is the third module of the round -> orange */
  AII.MODULE_ACCENT = ACCENTS[2];

  /* =================================================================
     2. Tiny DOM helpers
     ================================================================= */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  AII.el = el;
  AII.escapeHtml = esc;

  /* =================================================================
     3. Shared row anatomy — today's row, reused by every variant
     ================================================================= */

  /* ev: {type, summary, input, output, t, dur}
     opts: {open, meta, indent, onToggle} */
  function buildRow(ev, opts) {
    opts = opts || {};
    var type = typeKey(ev && ev.type);
    var color = rowColor(type);
    var item = el('div', 'row-item');
    if (opts.indent) item.style.paddingLeft = opts.indent + 'px';

    var btn = el('button', 'row');
    btn.type = 'button';
    var pending = !ev || !ev.summary;
    var sum = pending
      ? '<span class="row-sum is-pending"><span class="skeleton"></span></span>'
      : '<span class="row-sum">' + esc(ev.summary) + '</span>';

    btn.innerHTML =
      '<span class="row-ico" style="background:' + tint(color) + ';color:' + color + '">' +
        icon(rowIcon(type), 12) +
      '</span>' +
      '<span class="row-main">' +
        '<span class="row-type" style="color:' + color + '">' + esc(type) + '</span>' +
        sum +
      '</span>' +
      (opts.meta ? '<span class="row-meta mono">' + esc(opts.meta) + '</span>' : '') +
      '<span class="row-chev">' + icon('chevron-right', 12) + '</span>';
    if (type === 'ERROR') btn.classList.add('is-error');
    item.appendChild(btn);

    var body = el('div', 'row-body');
    body.hidden = true;
    body.innerHTML =
      '<div class="raw-block"><div class="raw-k">Tool input</div>' +
        '<pre class="raw-pre">' + esc((ev && ev.input) || '(no input recorded)') + '</pre></div>' +
      '<div class="raw-block"><div class="raw-k">Tool output</div>' +
        '<pre class="raw-pre">' + esc((ev && ev.output) || '(no output recorded)') + '</pre></div>';
    item.appendChild(body);

    function set(open) {
      body.hidden = !open;
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (opts.onToggle) opts.onToggle(open, item, ev);
    }
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () { set(body.hidden); });
    item.setOpen = set;
    if (opts.open) set(true);
    return item;
  }
  AII.buildRow = buildRow;

  /* Flatten a SUBSTEP (turns -> events) into one ordered list, tolerating
     the shapes data.js might use. Each event gets turn/turnIntent/index. */
  function flattenSubstep(sub) {
    var s = sub || AII.SUBSTEP;
    if (!s) return [];
    if (Array.isArray(s) && s.length && s[0] && s[0].type) return s.slice();
    var turns = Array.isArray(s) ? s : (s.turns || s.agentTurns || s.events || []);
    var out = [];
    turns.forEach(function (turn, ti) {
      if (turn && turn.type && !turn.events) { out.push(turn); return; }
      var evs = (turn && (turn.events || turn.rows)) || [];
      evs.forEach(function (ev) {
        var copy = Object.assign({}, ev);
        copy.turn = ti + 1;
        copy.turnIntent = turn.intent || turn.title || '';
        copy.index = out.length;
        out.push(copy);
      });
    });
    return out;
  }
  AII.flattenSubstep = flattenSubstep;

  /* =================================================================
     4. Left tree — built from AII.PHASES, with a spec-exact fallback
     ================================================================= */

  var FALLBACK_PHASES = [
    { id: 'run-phase-gen_idea', name: 'Create Idea', status: 'done',
      duration: '30 m', cost: '$9.36' },
    { id: 'run-phase-invention_loop', name: 'Test Idea', status: 'done',
      duration: '1 h 28 m', cost: '$22.21', children: [
        { id: 'run-phase-invention_loop-iter-1', name: 'Round 1', status: 'done',
          duration: '44 m', cost: '$10.79' },
        { id: 'run-phase-invention_loop-iter-2', name: 'Round 2', status: 'done',
          duration: '44 m', cost: '$11.42', children: [
            { id: 'run-phase-invention_loop-iter-2-mod-gen_strategy', name: 'Create Strategy', status: 'done', duration: '4 m', cost: '$0.62' },
            { id: 'run-phase-invention_loop-iter-2-mod-gen_plan', name: 'Create Plan', status: 'done', duration: '6 m', cost: '$1.08' },
            { id: 'run-phase-invention_loop-iter-2-mod-gen_art', name: 'Create Artifacts', status: 'done', duration: '21 m', cost: '$6.15', children: [
              { id: 'run-phase-invention_loop-iter-2-mod-gen_art-sub-research-1', name: 'Research 1', status: 'done', duration: '4 m 10 s', cost: '$1.02' },
              { id: 'run-phase-invention_loop-iter-2-mod-gen_art-sub-dataset-1', name: 'Dataset 1', status: 'done', duration: '3 m 22 s', cost: '$0.71' },
              { id: 'run-phase-invention_loop-iter-2-mod-gen_art-sub-exp-1', name: 'Experiment 1', status: 'done', duration: '6 m 05 s', cost: '$2.34' },
              { id: 'run-phase-invention_loop-iter-2-mod-gen_art-sub-eval-1', name: 'Evaluation 1', status: 'done', duration: '5 m 12 s', cost: '$1.22' },
              { id: 'run-phase-invention_loop-iter-2-mod-gen_art-sub-proof-1', name: 'Proof 1', status: 'done', duration: '2 m 11 s', cost: '$0.86' }
            ] },
            { id: 'run-phase-invention_loop-iter-2-mod-gen_paper', name: 'Write Paper', status: 'done', duration: '7 m', cost: '$2.01' },
            { id: 'run-phase-invention_loop-iter-2-mod-review_paper', name: 'Review Paper', status: 'done', duration: '4 m', cost: '$1.02' },
            { id: 'run-phase-invention_loop-iter-2-mod-upd_idea', name: 'Update Idea', status: 'done', duration: '2 m', cost: '$0.54' }
          ] }
      ] },
    { id: 'run-phase-report', name: 'Report Results', status: 'done',
      duration: '26 m', cost: '$10.01' }
  ];

  var NAME_KEYS = ['name', 'label', 'title'];
  var KID_KEYS = ['children', 'nodes', 'items', 'rounds', 'modules', 'substeps', 'subs', 'steps'];
  var DUR_KEYS = ['duration', 'dur', 'runtime', 'elapsed', 'time'];
  var COST_KEYS = ['cost', 'usd', 'price', 'spend'];

  function pick(o, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = o[keys[i]];
      if (v != null && v !== '') return v;
    }
    return null;
  }
  function kidsOf(o) {
    for (var i = 0; i < KID_KEYS.length; i++) {
      var v = o[KID_KEYS[i]];
      if (Array.isArray(v) && v.length) return v;
    }
    return [];
  }
  function money(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'number') return '$' + v.toFixed(2);
    return String(v);
  }
  function normNode(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var name = pick(raw, NAME_KEYS);
    if (name == null) return null;
    return {
      id: raw.id || raw.nodeId || String(name),
      name: String(name),
      kind: raw.kind ? String(raw.kind).toLowerCase() : '',
      duration: pick(raw, DUR_KEYS) == null ? '' : String(pick(raw, DUR_KEYS)),
      cost: money(pick(raw, COST_KEYS)),
      status: String(raw.status || raw.state || 'done').toLowerCase(),
      children: kidsOf(raw).map(normNode).filter(Boolean)
    };
  }
  function normalizePhases(src) {
    var raw = src || AII.PHASES;
    var arr = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.phases) ? raw.phases : null);
    if (!arr || !arr.length) return FALLBACK_PHASES.map(normNode);
    var out = arr.map(normNode).filter(Boolean);
    return out.length ? out : FALLBACK_PHASES.map(normNode);
  }
  AII.normalizePhases = normalizePhases;

  /* Exactly ONE node is selected: Evaluation 1 of Round 2. The tree can
     legitimately contain a second "Evaluation 1" under Round 1, so match on
     the canonical id first and fall back to the Round-2 path by name. */
  var SELECTED_ID = 'run-phase-invention_loop-iter-2-mod-gen_art-sub-eval-1';
  var SELECTED_NAME = 'Evaluation 1';
  var OPEN_NAMES = { 'Test Idea': 1, 'Round 2': 1, 'Create Artifacts': 1 };

  function walk(nodes, trail, visit) {
    nodes.forEach(function (n) {
      var chain = trail.concat([n]);
      visit(n, chain);
      walk(n.children, chain, visit);
    });
  }

  function markPath(phases) {
    var byId = null, byRound2 = null, byName = null;
    walk(phases, [], function (n, chain) {
      n.selected = false;
      n.open = false;
      if (n.id === SELECTED_ID && !byId) byId = chain;
      if (n.name !== SELECTED_NAME) return;
      if (!byName) byName = chain;
      if (!byRound2 && chain.some(function (a) { return a.name === 'Round 2'; })) {
        byRound2 = chain;
      }
    });
    var chain = byId || byRound2 || byName;
    if (chain) {
      chain.forEach(function (n, i) {
        if (i === chain.length - 1) n.selected = true;
        else n.open = true;
      });
      return true;
    }
    /* nothing recognisable to select — fall back to the documented opens */
    walk(phases, [], function (n) { n.open = !!OPEN_NAMES[n.name]; });
    return false;
  }

  function checkGlyph() {
    var s = el('span', 'phase-check');
    s.innerHTML = icon('check', 12);
    return s;
  }

  function treeNode(n, depth, moduleIdx) {
    var frag = document.createDocumentFragment();
    var btn = el('button', 'tnode');
    btn.type = 'button';
    var isRound = n.kind ? (n.kind === 'round') : (depth === 1);
    var isModule = n.kind ? (n.kind === 'module') : (depth === 2);
    if (isRound) btn.classList.add('is-round');
    if (n.selected) {
      btn.classList.add('is-selected');
      btn.setAttribute('aria-current', 'true');
    }
    btn.style.paddingLeft = (4 + depth * 8) + 'px';

    var caret = el('span', 'tnode-caret' + (n.children.length ? '' : ' is-leaf'));
    caret.innerHTML = icon(n.open ? 'chevron-down' : 'chevron-right', 12);
    btn.appendChild(caret);

    if (isModule) {
      var acc = el('span', 'tnode-accent');
      acc.style.color = AII.accent(moduleIdx);
      btn.appendChild(acc);
    }

    btn.appendChild(el('span', 'tnode-label', n.name));
    var meta = [n.duration, n.cost].filter(Boolean).join('  ');
    if (meta) btn.appendChild(el('span', 'tnode-meta', meta));
    frag.appendChild(btn);

    if (n.children.length && n.open) {
      var kids = el('div', 'tree-kids');
      n.children.forEach(function (c, i) { kids.appendChild(treeNode(c, depth + 1, i)); });
      frag.appendChild(kids);
    }
    return frag;
  }

  function renderTree() {
    var wrap = el('nav', 'left');
    wrap.setAttribute('aria-label', 'Module tree');
    var phases = normalizePhases();
    markPath(phases);
    phases.forEach(function (p) {
      var card = el('div', 'phase');
      var head = el('button', 'phase-head');
      head.type = 'button';
      var caret = el('span', 'tnode-caret' + (p.children.length ? '' : ' is-leaf'));
      caret.innerHTML = icon(p.open ? 'chevron-down' : 'chevron-right', 12);
      head.appendChild(caret);
      head.appendChild(el('span', 'phase-name', p.name));
      head.appendChild(checkGlyph());
      var meta = [p.duration, p.cost].filter(Boolean).join('  ');
      if (meta) head.appendChild(el('span', 'phase-meta', meta));
      card.appendChild(head);
      if (p.children.length && p.open) {
        var kids = el('div', 'phase-kids');
        p.children.forEach(function (c, i) { kids.appendChild(treeNode(c, 1, i)); });
        card.appendChild(kids);
      }
      wrap.appendChild(card);
    });
    return wrap;
  }

  /* =================================================================
     5. Sidebar, topbar, right panel, composer
     ================================================================= */

  var RUN_TITLE = 'Sparse retrieval pre-filtering for long-context QA';

  var PLACEHOLDER_RUNS = [
    { title: RUN_TITLE, status: 'done', current: true },
    { title: 'Curriculum ordering for small-model arithmetic', status: 'running' },
    { title: 'Retrieval cache reuse across sibling agents', status: 'running' },
    { title: 'Token budget schedules for multi-turn tool use', status: 'waiting' },
    { title: 'Cross-lingual transfer from 200 seed pairs', status: 'done' },
    { title: 'Distillation targets for verifier ensembles', status: 'done' },
    { title: 'Contrastive chunking for tabular retrieval', status: 'failed' },
    { title: 'Latency-aware speculative decoding gates', status: 'done' },
    { title: 'Label noise in weak supervision pipelines', status: 'done' },
    { title: 'Prompt compression at fixed answer quality', status: 'paused' },
    { title: 'Adapter merging under domain shift', status: 'done' },
    { title: 'Self-consistency budgets for code repair', status: 'done' }
  ];

  var STATUS_COLOR = {
    done: 'var(--ok)', running: 'var(--brand)', failed: 'var(--danger)',
    waiting: 'var(--warn)', paused: 'var(--ink-400)'
  };

  function runTitle() {
    var s = AII.RUN_SUMMARY;
    return (s && (s.title || s.name)) || RUN_TITLE;
  }

  function renderSidebar(opts) {
    var side = el('aside', 'sidebar');
    var head = el('div', 'sidebar-head');
    head.appendChild(el('div', 'wordmark', 'AI Inventor'));
    var nb = el('button', 'btn-newrun');
    nb.type = 'button';
    nb.innerHTML = icon('plus', 12) + '<span>New run</span>';
    head.appendChild(nb);
    side.appendChild(head);
    side.appendChild(el('div', 'sidebar-label', 'Runs'));

    var list = el('div', 'sidebar-runs');
    var runs = opts.sidebarRuns || AII.RUNS || PLACEHOLDER_RUNS;
    var title = runTitle();
    runs.forEach(function (r, i) {
      var name = (r && (r.title || r.name)) || String(r);
      var status = String((r && r.status) || 'done').toLowerCase();
      var b = el('button', 'run-row');
      b.type = 'button';
      var cur = (r && r.current) || name === title || (!runs.some(function (x) {
        return (x && (x.title || x.name)) === title;
      }) && i === 0);
      if (cur) {
        b.classList.add('is-current');
        b.setAttribute('aria-current', 'page');
      }
      var dot = el('span', 'run-dot');
      dot.style.background = STATUS_COLOR[status] || 'var(--ink-400)';
      b.appendChild(dot);
      b.appendChild(el('span', 'run-name', name));
      list.appendChild(b);
    });
    side.appendChild(list);
    return side;
  }

  function renderTopbar(opts) {
    var bar = el('header', 'topbar');

    var tabs = el('nav', 'tabs');
    tabs.setAttribute('aria-label', 'Run views');
    ['Overview', 'Details', 'Views'].forEach(function (name) {
      var t = el('button', 'tab', name);
      t.type = 'button';
      if (name === (opts.activeTab || 'Details')) {
        t.classList.add('is-active');
        t.setAttribute('aria-current', 'true');
      }
      tabs.appendChild(t);
    });
    bar.appendChild(tabs);

    bar.appendChild(el('div', 'topbar-sep'));
    bar.appendChild(el('div', 'topbar-title', runTitle()));
    bar.appendChild(el('div', 'topbar-sep'));

    var pb = el('div', 'playback');
    var play = el('button', 'playback-btn');
    play.type = 'button';
    play.setAttribute('aria-label', 'Play run');
    play.innerHTML = icon('play', 12);
    pb.appendChild(play);
    pb.appendChild(el('span', 'playback-time mono', '2:24:07'));
    var track = el('div', 'playback-track');
    track.appendChild(el('div', 'playback-fill'));
    pb.appendChild(track);
    pb.appendChild(el('span', 'playback-rate mono', '1×'));
    var live = el('span', 'pill-live' + (opts.finished ? ' pill-done' : ''));
    live.innerHTML = opts.finished
      ? '<span>' + icon('check', 10) + '</span><span>DONE</span>'
      : '<span class="dot">●</span><span>LIVE</span>';
    pb.appendChild(live);
    bar.appendChild(pb);

    var right = el('div', 'topbar-right');
    [['share', 'Share run'], ['bug', 'Report a bug'],
     ['file-text', 'Open paper'], ['github', 'Open repository']].forEach(function (p) {
      var b = el('button', 'icon-btn');
      b.type = 'button';
      b.title = p[1];
      b.setAttribute('aria-label', p[1]);
      b.innerHTML = icon(p[0], 14);
      right.appendChild(b);
    });
    var sub = el('button', 'btn-submit-review', 'Submit review');
    sub.type = 'button';
    right.appendChild(sub);
    bar.appendChild(right);
    return bar;
  }

  /* Hand-drawn throughput sparkline, 280 x 48 (SPEC §2) */
  var SPARK_POINTS = [
    [4, 40], [14, 33], [24, 36], [34, 24], [44, 27], [54, 16], [64, 21],
    [74, 12], [84, 18], [94, 9], [104, 15], [114, 22], [124, 14], [134, 19],
    [144, 11], [154, 8], [164, 17], [174, 13], [184, 25], [194, 18], [204, 10],
    [214, 14], [224, 7], [234, 12], [244, 20], [254, 15], [266, 23], [276, 31]
  ];

  function sparkline() {
    var pts = SPARK_POINTS.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var box = el('div', 'spark');
    box.innerHTML =
      '<svg viewBox="0 0 280 48" width="280" height="48" role="img" ' +
        'aria-label="Messages per minute across Evaluation 1">' +
        '<line x1="0" y1="47.5" x2="280" y2="47.5" stroke="var(--ink-200)" stroke-width="1"/>' +
        '<polyline points="' + pts + '" fill="none" stroke="var(--azure)" ' +
          'stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    return box;
  }

  function renderRight(opts) {
    var side = el('aside', 'right');
    side.setAttribute('aria-label', 'Node details');
    var tabs = el('div', 'right-tabs');
    ['Statistics', 'Summary', 'Files'].forEach(function (name) {
      var t = el('button', 'right-tab', name);
      t.type = 'button';
      if (name === 'Statistics') {
        t.classList.add('is-active');
        t.setAttribute('aria-current', 'true');
      }
      tabs.appendChild(t);
    });
    side.appendChild(tabs);

    var body = el('div', 'right-body');
    var scope = el('div', 'right-scope');
    scope.innerHTML = 'Scoped to <strong>Evaluation 1</strong> · Round 2';
    body.appendChild(scope);

    var grid = el('div', 'stat-grid');
    [['Cost', '$1.22', ''], ['Tokens', '2,390,272', ''], ['Runtime', '5 m 12 s', ''],
     ['Messages', '165', ''], ['Status', 'Done', 'ok']].forEach(function (s, i, arr) {
      /* an odd trailing stat spans both columns rather than leaving a hole */
      var cell = el('div', 'stat' + ((i === arr.length - 1 && arr.length % 2) ? ' is-wide' : ''));
      cell.appendChild(el('div', 'stat-k', s[0]));
      cell.appendChild(el('div', 'stat-v ' + s[2], s[1]));
      grid.appendChild(cell);
    });
    body.appendChild(grid);

    var sh = el('div', 'spark-head');
    sh.appendChild(el('div', 'spark-title', 'Throughput'));
    sh.appendChild(el('div', 'spark-note', 'messages / min'));
    body.appendChild(sh);
    body.appendChild(sparkline());
    side.appendChild(body);
    return side;
  }

  function renderComposer() {
    var c = el('form', 'composer');
    c.addEventListener('submit', function (e) { e.preventDefault(); });
    var i = document.createElement('input');
    i.type = 'text';
    i.placeholder = 'Steer Evaluation 1…';
    i.setAttribute('aria-label', 'Steer Evaluation 1');
    c.appendChild(i);
    var b = el('button', 'btn-send', 'Send');
    b.type = 'submit';
    c.appendChild(b);
    return c;
  }

  /* =================================================================
     6. Review bar + renderShell
     ================================================================= */

  function renderReviewBar(opts) {
    var bar = el('div', 'reviewbar');
    if (opts.title) {
      bar.appendChild(el('span', 'reviewbar-page', opts.title));
      bar.appendChild(el('span', 'reviewbar-sep', '·'));
    }
    bar.appendChild(el('span', 'reviewbar-variant', opts.variant || ''));
    if (opts.blurb) {
      bar.appendChild(el('span', 'reviewbar-sep', '·'));
      bar.appendChild(el('span', 'reviewbar-blurb', opts.blurb));
    } else {
      bar.appendChild(el('span', 'reviewbar-blurb', ''));
    }

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
    bar.appendChild(nav);
    return bar;
  }

  /* renderShell(rootEl, opts) -> the scrolling .center element */
  function renderShell(root, opts) {
    opts = opts || {};
    if (!root) throw new Error('renderShell: no root element');
    root.classList.add('page');
    root.innerHTML = '';
    root.appendChild(renderReviewBar(opts));

    var shell = el('div', 'shell');
    if (!opts.hideSidebar) shell.appendChild(renderSidebar(opts));

    var main = el('div', 'main');
    main.appendChild(renderTopbar(opts));

    var cols = el('div', 'cols');
    if (!opts.hideLeft) cols.appendChild(renderTree());

    var wrap = el('div', 'center-wrap');
    var center = el('div', 'center');
    center.setAttribute('role', 'region');
    center.setAttribute('aria-label', 'Event feed');
    wrap.appendChild(center);
    if (!opts.hideComposer) {
      center.classList.add('has-composer');
      wrap.appendChild(renderComposer());
    }
    cols.appendChild(wrap);

    if (!opts.hideRight) cols.appendChild(renderRight(opts));
    main.appendChild(cols);
    shell.appendChild(main);
    root.appendChild(shell);
    return center;
  }

  AII.renderShell = renderShell;
  AII.RUN_TITLE = RUN_TITLE;
  AII.PLACEHOLDER_RUNS = PLACEHOLDER_RUNS;
})();
