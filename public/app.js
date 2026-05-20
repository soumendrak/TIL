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

  return { emoji: emoji, hue: hue, color: color, initTheme: initTheme, reveal: reveal };
})();
