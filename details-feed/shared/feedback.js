/* AI Inventor details-feed mockups — feedback widget.
   Copied from details-view/shared/feedback.js (SPEC-V2 asks for a copy, not a
   dependency on the old folder); only ORDER changed to the feed page ids.
   Docks bottom-right on every page, persists to localStorage, and exposes the
   reading API index.html uses. Styling lives in shared/review.css. */

(function () {
  'use strict';

  var AII = (window.AII = window.AII || {});

  var KEY = 'aii-mockup-feedback';
  var UI_KEY = 'aii-mockup-feedback-ui';

  /* Canonical page order for exportText(). Index may override with
     setOrder(); unknown ids keep their insertion order at the end. */
  var ORDER = [
    'feed/0-today', 'feed/1-turns', 'feed/2-clusters', 'feed/3-chapters',
    'feed/4-narratives', 'feed/5-milestones', 'feed/6-zoom'
  ];

  var VOTES = ['like', 'dislike', 'unsure'];
  var PILL_WORD = { like: 'liked', dislike: 'disliked', unsure: 'unsure' };

  /* ---------- storage ---------- */

  function readAll() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? o : {};
    } catch (e) {
      return {};
    }
  }
  function writeAll(o) {
    try { window.localStorage.setItem(KEY, JSON.stringify(o)); return true; }
    catch (e) { return false; }
  }
  function get(pageId) {
    return readAll()[pageId] || { vote: '', note: '', at: '' };
  }
  function set(pageId, patch) {
    var all = readAll();
    var cur = all[pageId] || { vote: '', note: '', at: '' };
    var next = {
      vote: patch.vote === undefined ? cur.vote : patch.vote,
      note: patch.note === undefined ? cur.note : patch.note,
      at: new Date().toISOString()
    };
    if (!next.vote && !next.note) delete all[pageId];
    else all[pageId] = next;
    writeAll(all);
    return next;
  }
  function clearAll() {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  function today() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function oneLine(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function exportText() {
    var all = readAll();
    var ids = Object.keys(all);
    var ordered = ORDER.filter(function (id) { return all[id]; })
      .concat(ids.filter(function (id) { return ORDER.indexOf(id) === -1; }));
    var lines = ['AI Inventor mockup feedback (' + today() + ')'];
    if (!ordered.length) {
      lines.push('(no feedback recorded yet)');
      return lines.join('\n');
    }
    ordered.forEach(function (id) {
      var e = all[id];
      var vote = e.vote || 'no vote';
      var note = oneLine(e.note);
      lines.push(id + ': ' + vote + (note ? ' — ' + note : ''));
    });
    return lines.join('\n');
  }

  /* ---------- widget ---------- */

  function readCollapsed() {
    try { return window.localStorage.getItem(UI_KEY) === 'collapsed'; }
    catch (e) { return false; }
  }
  function writeCollapsed(v) {
    try { window.localStorage.setItem(UI_KEY, v ? 'collapsed' : 'open'); }
    catch (e) { /* ignore */ }
  }

  function mount(pageId) {
    if (!pageId) return null;
    var existing = document.querySelector('.fb');
    if (existing) existing.parentNode.removeChild(existing);

    var state = get(pageId);
    var box = document.createElement('aside');
    box.className = 'fb';
    box.setAttribute('aria-label', 'Mockup feedback');

    var head = document.createElement('div');
    head.className = 'fb-head';
    var title = document.createElement('div');
    title.className = 'fb-title';
    title.textContent = pageId;
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'fb-toggle';
    head.appendChild(title);
    head.appendChild(toggle);

    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'fb-pill';
    pill.hidden = true;

    var body = document.createElement('div');
    body.className = 'fb-body';

    var votes = document.createElement('div');
    votes.className = 'fb-votes';
    votes.setAttribute('role', 'group');
    votes.setAttribute('aria-label', 'Verdict');
    var voteBtns = {};
    VOTES.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fb-vote';
      b.textContent = v.charAt(0).toUpperCase() + v.slice(1);
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        var next = state.vote === v ? '' : v;
        state = set(pageId, { vote: next });
        paint();
        flashSaved();
      });
      voteBtns[v] = b;
      votes.appendChild(b);
    });
    body.appendChild(votes);

    var note = document.createElement('textarea');
    note.className = 'fb-note';
    note.placeholder = "What works, what doesn't…";
    note.setAttribute('aria-label', 'Note');
    note.value = state.note || '';
    body.appendChild(note);

    var saved = document.createElement('div');
    saved.className = 'fb-saved';
    saved.setAttribute('aria-live', 'polite');
    body.appendChild(saved);

    box.appendChild(head);
    box.appendChild(pill);
    box.appendChild(body);
    document.body.appendChild(box);

    function grow() {
      note.style.height = 'auto';
      note.style.height = Math.min(note.scrollHeight, 200) + 'px';
    }
    var timer = null;
    note.addEventListener('input', function () {
      grow();
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        state = set(pageId, { note: note.value });
        flashSaved();
        paintPill();
      }, 400);
    });
    note.addEventListener('blur', function () {
      if (timer) window.clearTimeout(timer);
      state = set(pageId, { note: note.value });
      paintPill();
    });

    var savedTimer = null;
    function flashSaved() {
      saved.textContent = 'saved';
      if (savedTimer) window.clearTimeout(savedTimer);
      savedTimer = window.setTimeout(function () { saved.textContent = ''; }, 1600);
    }

    function paintPill() {
      var word = PILL_WORD[state.vote] || 'not rated';
      pill.innerHTML = '';
      var a = document.createElement('span');
      a.textContent = 'Feedback';
      var b = document.createElement('span');
      b.className = 'fb-pill-state';
      b.textContent = '· ' + word;
      pill.appendChild(a);
      pill.appendChild(b);
    }

    function paint() {
      VOTES.forEach(function (v) {
        var on = state.vote === v;
        voteBtns[v].classList.toggle('is-on', on);
        voteBtns[v].setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      paintPill();
    }

    var collapsed = readCollapsed();
    function applyCollapsed() {
      box.classList.toggle('is-collapsed', collapsed);
      head.hidden = collapsed;
      pill.hidden = !collapsed;
      toggle.innerHTML = AII.icon ? AII.icon('minus', 12) : '&minus;';
      toggle.setAttribute('aria-label', 'Collapse feedback');
      toggle.title = 'Collapse';
    }
    toggle.addEventListener('click', function () {
      collapsed = true; writeCollapsed(true); applyCollapsed();
    });
    pill.addEventListener('click', function () {
      collapsed = false; writeCollapsed(false); applyCollapsed();
      grow();
    });

    paint();
    applyCollapsed();
    grow();
    return box;
  }

  AII.feedback = {
    KEY: KEY,
    getAll: readAll,
    get: get,
    set: set,
    clearAll: clearAll,
    exportText: exportText,
    setOrder: function (ids) { if (Array.isArray(ids) && ids.length) ORDER = ids.slice(); },
    order: function () { return ORDER.slice(); },
    mount: mount
  };

  function init() {
    var page = document.body && document.body.dataset ? document.body.dataset.page : '';
    if (!page) return;
    if (document.body.dataset.feedback === 'off') return;
    mount(page);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
