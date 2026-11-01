(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  // Popups
  document.querySelectorAll('[data-open]').forEach(function (button) {
    button.addEventListener('click', function () {
      var dialog = document.getElementById(button.getAttribute('data-open'));
      if (dialog && dialog.showModal) {
        dialog.showModal();
        root.classList.add('modal-open');
      }
    });
  });

  document.querySelectorAll('dialog.dlg').forEach(function (dialog) {
    // Clicking the dimmed area outside the popup closes it.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      root.classList.remove('modal-open');
    });
  });

  // Scroll progress bar in the header.
  var ticking = false;
  function updateProgress() {
    var max = root.scrollHeight - root.clientHeight;
    root.style.setProperty('--scroll', max > 0 ? root.scrollTop / max : 0);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  if (!hasIO) return;

  // Highlights: count up once when first seen.
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1100;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(to * eased).toLocaleString('en-US') + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counted = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      counted.unobserve(entry.target);
      if (!reduced) countUp(entry.target);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.stat__num').forEach(function (el) { counted.observe(el); });

  // Scroll reveals
  if (!reduced) {
    root.classList.add('reveal-ready');
    document.querySelectorAll('.stats, .principles').forEach(function (group) {
      group.querySelectorAll('.reveal').forEach(function (el, i) {
        el.style.setProperty('--rd', i * 80 + 'ms');
      });
    });
    document.querySelectorAll('.tags li').forEach(function (el, i) {
      el.style.setProperty('--rd', 150 + i * 50 + 'ms');
    });
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { revealer.observe(el); });
  }

  // Diagram arrows flow only while their diagram is on screen.
  var live = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('live', entry.isIntersecting);
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.figure').forEach(function (el) { live.observe(el); });

  // Highlight the current section in the nav.
  var links = {};
  document.querySelectorAll('.nav a').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
      var current = links[entry.target.id];
      if (current) current.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  Object.keys(links).forEach(function (id) {
    var section = document.getElementById(id);
    if (section) spy.observe(section);
  });
})();
