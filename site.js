// Mobile menu
(function () {
  var header = document.querySelector('.site-header');
  var btn = header && header.querySelector('.menu-btn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var open = header.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  header.querySelectorAll('.site-nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      header.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
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
