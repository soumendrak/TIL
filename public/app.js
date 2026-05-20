/* ============================================================
   Dev Journal — shared helpers (theme, topic colors, motion)
   ============================================================ */
window.TIL = (function () {
  var EMOJI = {
    python:'🐍', llm:'🤖', ai:'🤖', agents:'🦾', observability:'📡', otel:'📡',
    signoz:'📊', metrics:'📊', tracing:'🧵', docker:'🐳', kubernetes:'☸',
    k8s:'☸', ci:'⚙️', 'github-actions':'⚙️', devops:'🛠', typescript:'🧩',
    javascript:'🟨', rust:'🦀', go:'🐹', wasm:'⚡', debug:'🪲', async:'⏱',
    linux:'🐧', git:'🌿', cli:'⌨', sql:'🗄', database:'🗄', api:'🔌',
    security:'🔐', performance:'🚀', testing:'🧪', web:'🌐', networking:'🛰'
  };

  /* escape text before it goes into an innerHTML string */
  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ESC_MAP[ch];
    });
  }

  function emoji(tags) {
    tags = tags || [];
    for (var i = 0; i < tags.length; i++) {
      if (EMOJI[tags[i]]) return EMOJI[tags[i]];
    }
    return '📝';
  }

  /* deterministic hue per tag, so a topic always wears the same colour */
  function hue(tag) {
    var h = 0;
    tag = tag || '';
    for (var i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) % 360;
    return h;
  }
  function color(tag, sat, light) {
    return 'hsl(' + hue(tag) + ' ' + (sat || 62) + '% ' + (light || 56) + '%)';
  }

  /* theme: wires every [data-theme-toggle] element */
  function syncTheme() {
    var dark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      var icon = b.querySelector('[data-theme-icon]');
      var label = b.querySelector('[data-theme-label]');
      if (icon) icon.textContent = dark ? '☾' : '☀';
      if (label) label.textContent = dark ? 'Dark' : 'Light';
      b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }
  function initTheme() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var dark = document.documentElement.classList.toggle('dark');
        try { localStorage.setItem('til-theme-c', dark ? 'dark' : 'light'); } catch (e) {}
        syncTheme();
      });
    });
    syncTheme();
  }

  /* reveal-on-scroll for [data-reveal] elements */
  function reveal(selector) {
    var els = [].slice.call(document.querySelectorAll(selector || '[data-reveal]'));
    var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e, i) {
      e.style.transitionDelay = Math.min(i * 45, 260) + 'ms';
      io.observe(e);
    });
  }

  /* ---- Keyboard shortcuts --------------------------------------- */

  /* true while the user is typing in a field — shortcuts stay quiet then */
  function isTyping() {
    var el = document.activeElement;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  /* flip the theme — same effect as clicking a [data-theme-toggle] */
  function toggleTheme() {
    var dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('til-theme-c', dark ? 'dark' : 'light'); } catch (e) {}
    syncTheme();
  }

  /* a roving j/k highlight over a set of link rows inside `container` */
  function rover(container, selector) {
    var sel = -1;
    function items() { return [].slice.call(container.querySelectorAll(selector)); }
    function paint(list) {
      for (var i = 0; i < list.length; i++) list[i].classList.toggle('kbd-on', i === sel);
    }
    function move(step) {
      var list = items();
      if (!list.length) return;
      sel = sel < 0 ? (step > 0 ? 0 : list.length - 1) : sel + step;
      sel = Math.max(0, Math.min(list.length - 1, sel));
      paint(list);
      list[sel].scrollIntoView({ block: 'nearest' });
    }
    return {
      next: function () { move(1); },
      prev: function () { move(-1); },
      open: function () { var l = items(); if (sel >= 0 && l[sel]) l[sel].click(); },
      reset: function () { sel = -1; paint(items()); },
    };
  }

  /* build the shortcuts overlay + floating launcher, then wire keydown.
     items: [{ keys:[...], hint:[...], desc:'...', run?:fn }]
     entries without `run` are documentation-only (handled elsewhere). */
  function initShortcuts(items) {
    var scrim = document.createElement('div');
    scrim.className = 'kbd-scrim';
    var rows = items.map(function (it) {
      var combo = (it.hint || it.keys).map(function (k) {
        return '<kbd>' + esc(k) + '</kbd>';
      }).join('');
      return '<div class="kbd-row"><span class="desc">' + esc(it.desc) +
        '</span><span class="combo">' + combo + '</span></div>';
    }).join('');
    scrim.innerHTML =
      '<div class="kbd-modal" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">' +
        '<div class="kbd-modal-h"><h2>⌨ Keyboard shortcuts</h2>' +
          '<button class="x" type="button" aria-label="Close">✕</button></div>' +
        '<div class="kbd-rows">' + rows + '</div>' +
        '<div class="kbd-modal-foot">these work from any screen</div>' +
      '</div>';
    document.body.appendChild(scrim);

    var fab = document.createElement('button');
    fab.className = 'kbd-fab';
    fab.type = 'button';
    fab.title = 'Keyboard shortcuts (press ?)';
    fab.setAttribute('aria-label', 'Show keyboard shortcuts');
    fab.textContent = '?';
    document.body.appendChild(fab);

    function isOpen() { return scrim.classList.contains('open'); }
    function close() { scrim.classList.remove('open'); }
    function toggle() { scrim.classList.toggle('open'); }

    fab.addEventListener('click', toggle);
    scrim.querySelector('.x').addEventListener('click', close);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) close(); });

    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { if (isOpen()) { close(); e.preventDefault(); } return; }
      if (isTyping()) return;
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === '?') { toggle(); e.preventDefault(); return; }
      if (isOpen()) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].run && items[i].keys.indexOf(key) >= 0) {
          e.preventDefault();
          items[i].run(e);
          return;
        }
      }
    });
  }

  return {
    esc: esc, emoji: emoji, hue: hue, color: color,
    initTheme: initTheme, reveal: reveal,
    isTyping: isTyping, toggleTheme: toggleTheme,
    rover: rover, initShortcuts: initShortcuts,
  };
})();
