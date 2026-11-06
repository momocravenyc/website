/* Momo Crave V4 — interaction layer (vanilla JS, no dependencies) */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* scroll progress bar */
  var bar = document.createElement('div');
  bar.className = 'mc-progress';
  document.body.appendChild(bar);
  var ticking = false;
  function updateBar() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateBar); }
  }, { passive: true });
  updateBar();

  /* checker dividers pop in when their header scrolls into view */
  var heads = document.querySelectorAll('.site-section h2.display-4');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('mc-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    heads.forEach(function (h) { io.observe(h); });
  } else {
    heads.forEach(function (h) { h.classList.add('mc-in'); });
  }

  if (reduce) return;

  /* click: a small puff of steam from the momo cursor */
  document.addEventListener('pointerdown', function (ev) {
    if (ev.pointerType !== 'mouse') return;
    for (var i = 0; i < 6; i++) {
      var p = document.createElement('span');
      p.className = 'mc-steam';
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      var d = 26 + Math.random() * 22;
      p.style.left = ev.clientX + 'px';
      p.style.top = ev.clientY + 'px';
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', Math.sin(a) * d + 'px');
      p.style.animationDelay = i * 25 + 'ms';
      document.body.appendChild(p);
      setTimeout(function (el) { el.remove(); }, 900, p);
    }
  });

  if (!fine) return; // the rest needs a real pointer

  /* About pills tilt toward the pointer */
  document.querySelectorAll('.pill').forEach(function (pill) {
    pill.addEventListener('pointermove', function (e) {
      var r = pill.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      pill.style.transform = 'rotateY(' + x * 8 + 'deg) rotateX(' + -y * 6 + 'deg) translateZ(10px)';
    });
    pill.addEventListener('pointerleave', function () { pill.style.transform = ''; });
  });

  /* News cards: spotlight follows the pointer */
  document.querySelectorAll('#section-news .site-media').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* magnetic buttons */
  document.querySelectorAll('.btn.btn-primary').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = e.clientX - (r.left + r.width / 2);
      var y = e.clientY - (r.top + r.height / 2);
      btn.style.translate = (x * 0.15) + 'px ' + (y * 0.25) + 'px';
    });
    btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
  });
})();
