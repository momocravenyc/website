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
    // Replays every time a header comes into view. Waits for the section's
    // fade-in so the squares never pop while the header is still invisible.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var h = e.target;
        clearTimeout(h._mcT);
        if (e.isIntersecting) {
          h._mcT = setTimeout(function () { h.classList.add('mc-in'); }, 450);
        } else {
          h.classList.remove('mc-in');
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -20% 0px' });
    heads.forEach(function (h) { io.observe(h); });
  } else {
    heads.forEach(function (h) { h.classList.add('mc-in'); });
  }

  /* ---------- The Momo Line ----------
     Stations are read from the menu, so adding a dish to the menu adds a stop.
     Spicy dishes (pepper icon) run "express" and get a diamond bullet. */
  (function momoLine() {
    var metro = document.querySelector('.mc-metro');
    if (!metro) return;
    var dishes = [].slice.call(document.querySelectorAll('#section-menu .menu-item')).map(function (item) {
      var h = item.querySelector('h5');
      var name = h.textContent.trim();
      return {
        el: item,
        name: name === 'Momo' ? 'Steamed Momo' : name,
        short: (name === 'Momo' ? 'Steamed' : name.replace(/\s*Momo$/, '')),
        spicy: !!h.querySelector('.fa-pepper-hot')
      };
    });
    if (!dishes.length) return;

    function bullet(d) {
      return '<span class="mc-route' + (d.spicy ? ' mc-route--express' : '') + '"><span class="mc-route__t">M</span></span>';
    }
    function goTo(d) {
      d.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      d.el.classList.remove('mc-arrived'); void d.el.offsetWidth; d.el.classList.add('mc-arrived');
    }

    // strip map
    var stops = metro.querySelector('.mc-strip__stops');
    var train = metro.querySelector('.mc-strip__train');
    var btns = dishes.map(function (d) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mc-stopbtn' + (d.spicy ? ' is-spicy' : '');
      b.innerHTML = '<span class="mc-stopbtn__dot"></span><span>' + d.short + '</span>';
      b.setAttribute('aria-label', d.name + (d.spicy ? ' (spicy)' : '') + ': show on the menu');
      b.addEventListener('click', function () { goTo(d); });
      li.appendChild(b); stops.appendChild(li);
      return b;
    });

    // arrivals board
    var rowsEl = metro.querySelector('.mc-board__rows');
    var at = 0;                       // index of the dish arriving "now"
    var etas = [0, 3];
    function rowHTML(n, d, eta) {
      return '<div class="mc-row" data-i="' + dishes.indexOf(d) + '"><span class="mc-row__n">' + n + '</span>' + bullet(d) +
        '<span class="mc-row__dest">' + d.name + '</span><span class="mc-row__eta' + (eta === 0 ? ' is-now' : '') + '">' +
        (eta === 0 ? 'Now' : eta + ' min') + '</span></div>';
    }
    function render() {
      var a = dishes[at], b = dishes[(at + 1) % dishes.length];
      rowsEl.innerHTML = rowHTML(1, a, 0) + rowHTML(2, b, etas[1]);
    }
    rowsEl.addEventListener('click', function (e) {
      var r = e.target.closest('.mc-row');
      if (r) goTo(dishes[+r.dataset.i]);
    });
    function placeTrain(animate) {
      var btn = btns[at], strip = metro.querySelector('.mc-strip');
      var x = btn.getBoundingClientRect().left + btn.offsetWidth / 2 - strip.getBoundingClientRect().left + strip.scrollLeft;
      if (animate) {
        train.classList.add('is-moving');
        setTimeout(function () { train.classList.remove('is-moving'); }, 1100);
      }
      train.style.left = x + 'px';
      // narrow screens: the strip scrolls sideways, so keep the train in view
      if (strip.scrollWidth > strip.clientWidth + 2) {
        strip.scrollTo({ left: Math.max(0, x - strip.clientWidth / 2), behavior: animate ? 'smooth' : 'auto' });
      }
      btns.forEach(function (b, i) { b.classList.toggle('is-here', i === at); });
    }
    render();
    placeTrain(false);
    window.addEventListener('resize', function () { placeTrain(false); });
    if (reduce) return;

    // every few seconds the next dish arrives: rows roll up, the train moves on
    var timer, paused = false;
    function tick() {
      if (paused || document.hidden) return;
      var next = (at + 1) % dishes.length, after = dishes[(at + 2) % dishes.length];
      rowsEl.insertAdjacentHTML('beforeend', rowHTML(2, after, 2 + Math.floor(Math.random() * 5)));
      var rows = rowsEl.querySelectorAll('.mc-row');
      // row 2 becomes row 1 and turns to "Now"
      rows[1].querySelector('.mc-row__n').textContent = '1';
      var eta = rows[1].querySelector('.mc-row__eta'); eta.textContent = 'Now'; eta.classList.add('is-now');
      rowsEl.style.transform = 'translateY(-46px)';
      setTimeout(function () {
        rowsEl.style.transition = 'none';
        rows[0].remove();
        rowsEl.style.transform = '';
        void rowsEl.offsetWidth;
        rowsEl.style.transition = '';
      }, 470);
      at = next;
      placeTrain(true);
    }
    function start() { clearInterval(timer); timer = setInterval(tick, 3800); }
    metro.addEventListener('pointerenter', function () { paused = true; });
    metro.addEventListener('pointerleave', function () { paused = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) start(); else clearInterval(timer); });
      }).observe(metro);
    } else { start(); }
  })();

  if (reduce) return;

  /* click: a few wisps of steam rise from the momo cursor */
  var NS = 'http://www.w3.org/2000/svg';
  var WISPS = [
    { d: 'M14 74 C4 64 24 56 14 44 C5 33 23 26 14 14', sway: '-5px', delay: 60 },
    { d: 'M29 78 C40 66 18 57 29 42 C39 30 19 20 29 4', sway: '4px', delay: 0 },
    { d: 'M44 74 C54 64 34 56 44 44 C53 33 35 26 44 14', sway: '6px', delay: 110 }
  ];
  document.addEventListener('pointerdown', function (ev) {
    if (ev.pointerType !== 'mouse') return;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'mc-wisp');
    svg.setAttribute('viewBox', '0 0 58 80');
    svg.style.left = ev.clientX + 'px';
    svg.style.top = (ev.clientY - 4) + 'px';
    WISPS.forEach(function (w) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', w.d);
      p.setAttribute('pathLength', '100');
      p.style.setProperty('--sway', w.sway);
      p.style.animationDelay = w.delay + 'ms';
      svg.appendChild(p);
    });
    document.body.appendChild(svg);
    setTimeout(function () { svg.remove(); }, 1300);
  });

  if (!fine) return; // the rest needs a real pointer

  /* About pills tilt toward the pointer */
  document.querySelectorAll('.pill').forEach(function (pill) {
    pill.addEventListener('pointermove', function (e) {
      var r = pill.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      pill.style.transform = 'rotateY(' + x * 16 + 'deg) rotateX(' + -y * 10 + 'deg) translateZ(10px)';
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
      btn.style.translate = (x * 0.25) + 'px ' + (y * 0.35) + 'px';
    });
    btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
  });
})();
