// Mobile menu
(function () {
  var header = document.querySelector('.site-header');
  var btn = header && header.querySelector('.menu-btn');
  if (!btn) return;
  function setOpen(open) {
    header.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  }
  btn.addEventListener('click', function () { setOpen(!header.classList.contains('open')); });
  header.querySelectorAll('.site-nav a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('open')) { setOpen(false); btn.focus(); }
  });
})();

// Copy button on every code block
(function () {
  if (!navigator.clipboard) return;
  document.querySelectorAll('main pre').forEach(function (pre) {
    var wrap = document.createElement('div');
    wrap.className = 'code';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code');
    var timer = null;
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(pre.innerText.replace(/^\n+|\s+$/g, '')).then(function () {
        btn.textContent = 'Copied';
        btn.classList.add('done');
        clearTimeout(timer);
        timer = setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1500);
      });
    });
    wrap.appendChild(btn);
  });
})();

// Permalink next to each script heading
(function () {
  document.querySelectorAll('.docs-main section[id] > h2').forEach(function (h) {
    var a = document.createElement('a');
    a.className = 'anchor';
    a.href = '#' + h.parentNode.id;
    a.textContent = '#';
    a.setAttribute('aria-label', 'Link to ' + h.textContent);
    h.appendChild(a);
  });
})();

// Filter for the script index (searches names and tags)
(function () {
  var list = document.querySelector('.docs-nav ol');
  if (!list) return;
  var input = document.createElement('input');
  input.type = 'search';
  input.className = 'nav-filter';
  input.placeholder = 'Filter scripts  /';
  input.setAttribute('aria-label', 'Filter scripts');
  list.parentNode.insertBefore(input, list);
  var empty = document.createElement('p');
  empty.className = 'nav-empty';
  empty.textContent = 'No script matches.';
  empty.hidden = true;
  list.parentNode.insertBefore(empty, list.nextSibling);

  var items = [];
  list.querySelectorAll('li').forEach(function (li) {
    var a = li.querySelector('a');
    var text = a.textContent;
    var id = a.getAttribute('href').split('#')[1];
    var section = id && document.getElementById(id);
    if (section) section.querySelectorAll('.tag').forEach(function (t) { text += ' ' + t.textContent; });
    items.push({ li: li, text: text.toLowerCase() });
  });

  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();
    var shown = 0;
    items.forEach(function (it) {
      var hit = !q || it.text.indexOf(q) !== -1;
      it.li.hidden = !hit;
      if (hit) shown++;
    });
    empty.hidden = shown > 0;
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { input.value = ''; input.dispatchEvent(new Event('input')); input.blur(); }
    if (e.key === 'Enter') {
      var first = items.filter(function (it) { return !it.li.hidden; })[0];
      if (first) first.li.querySelector('a').click();
    }
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (!input.offsetParent) return; // hidden (home page on phones)
    e.preventDefault();
    var details = input.closest('details');
    if (details) details.setAttribute('open', '');
    input.focus();
  });
})();

// Docs index: collapsed on phones, highlights the script in view
(function () {
  var nav = document.querySelector('.docs-nav');
  if (!nav) return;

  var details = nav.querySelector('details');
  if (details && window.matchMedia('(max-width: 768px)').matches) {
    details.removeAttribute('open');
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { details.removeAttribute('open'); });
    });
  }

  var links = [];
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var section = document.getElementById(a.getAttribute('href').slice(1));
    if (section) links.push({ a: a, section: section });
  });
  var current = null;
  var ticking = false;
  var pinned = null;    // the link just clicked stays active until the reader scrolls on
  var settling = false; // true while the smooth scroll to it is still running
  var pinnedY = 0;
  var settleTimer = null;

  function setActive(a) {
    if (a === current) return;
    if (current) current.classList.remove('active');
    if (a) a.classList.add('active');
    current = a;
  }

  // The active script is the last one whose heading has scrolled past the header
  function update() {
    ticking = false;
    if (pinned) {
      if (settling || Math.abs(window.scrollY - pinnedY) < 80) return;
      pinned = null;
    }
    var active = links[0];
    for (var i = 0; i < links.length; i++) {
      if (links[i].section.getBoundingClientRect().top <= 120) active = links[i];
      else break;
    }
    if (active) setActive(active.a);
  }

  function settled() {
    if (!settling) return;
    settling = false;
    pinnedY = window.scrollY;
  }

  function pin(a) {
    pinned = a;
    settling = true;
    setActive(a);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settled, 1200); // fallback for browsers without scrollend
  }

  links.forEach(function (l) {
    l.a.addEventListener('click', function () { pin(l.a); });
  });

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
    if (settling && !('onscrollend' in window)) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settled, 150);
    }
  }, { passive: true });
  window.addEventListener('scrollend', settled);

  var initial = links.filter(function (l) { return '#' + l.section.id === location.hash; })[0];
  if (initial) { pin(initial.a); setTimeout(settled, 300); } else update();
})();
