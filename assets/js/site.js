(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- Smooth scrolling, once any jump to a linked section has happened ---------- */
  function enableSmoothScroll() {
    setTimeout(function () { root.classList.add('smooth-scroll'); }, 100);
  }
  if (document.readyState === 'complete') enableSmoothScroll();
  else window.addEventListener('load', enableSmoothScroll);

  /* ---------- Menu and footer year ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.site-nav');
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  /* ---------- Videos: show a thumbnail, load YouTube's player only when played ---------- */
  document.querySelectorAll('.video-thumb').forEach(function (thumb) {
    thumb.addEventListener('click', function (event) {
      // Let ctrl/cmd-click open YouTube in a new tab as usual.
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      var frame = document.createElement('iframe');
      frame.className = 'video-frame';
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(thumb.dataset.video) + '?autoplay=1&rel=0';
      frame.title = thumb.dataset.title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      thumb.replaceWith(frame);
      frame.focus();
    });
  });

  /* ---------- Highlight the current section in the menu ---------- */
  var navLinks = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { navLinks[a.getAttribute('href').slice(1)] = a; });
  function setActive(id) {
    Object.keys(navLinks).forEach(function (key) {
      var on = key === id;
      navLinks[key].classList.toggle('is-active', on);
      if (on) navLinks[key].setAttribute('aria-current', 'true');
      else navLinks[key].removeAttribute('aria-current');
    });
  }
  setActive('home');

  /* ---------- Count-ups and section tracking ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = Number(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var start = performance.now();
    (function step(now) {
      var p = Math.min((now - start) / 1100, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }(start));
  }

  if ('IntersectionObserver' in window) {
    if (!reduceMotion) {
      var countWatcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countWatcher.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { countWatcher.observe(el); });
    }

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && navLinks[entry.target.id]) setActive(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -65% 0px' });
    Object.keys(navLinks).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- Scroll progress bar and timeline fill ---------- */
  var timeline = document.querySelector('.timeline');
  var scheduled = false;
  function onScroll() {
    var max = root.scrollHeight - window.innerHeight;
    var y = window.scrollY;
    root.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    if (max > 0 && y >= max - 4) setActive('contact');
    if (timeline && !reduceMotion) {
      var box = timeline.getBoundingClientRect();
      var filled = (window.innerHeight * 0.7 - box.top) / box.height;
      timeline.style.setProperty('--fill', Math.max(0, Math.min(1, filled)) * 100 + '%');
    }
    scheduled = false;
  }
  window.addEventListener('scroll', function () {
    if (!scheduled) { scheduled = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Banner: a live "radio spectrum" landscape ---------- */
  var canvas = document.getElementById('spectrum');
  var ctx = canvas && canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var COLORS = { paper: '#f6f3ee', navy: '#0e3a4d', teal: '#2a9191', coral: '#e8705a', berry: '#a62c52', plum: '#7f5f9e', amber: '#f2b441' };

  // Each layer is a set of signal peaks: c = centre, w = width, h = height (fractions of the banner).
  var layers = [
    { color: COLORS.amber, base: 0.10, speed: 0.22, peaks: [{ c: 0.13, w: 0.07, h: 0.62 }, { c: 0.52, w: 0.09, h: 0.72 }, { c: 0.93, w: 0.06, h: 0.55 }] },
    { color: COLORS.coral, base: 0.14, speed: 0.31, peaks: [{ c: 0.27, w: 0.08, h: 0.86 }, { c: 0.67, w: 0.07, h: 0.70 }, { c: 0.84, w: 0.05, h: 0.40 }] },
    { color: COLORS.teal, base: 0.12, speed: 0.27, peaks: [{ c: 0.05, w: 0.08, h: 0.48 }, { c: 0.42, w: 0.06, h: 0.58 }, { c: 0.76, w: 0.09, h: 0.84 }] },
    { color: COLORS.plum, base: 0.08, speed: 0.36, peaks: [{ c: 0.19, w: 0.05, h: 0.40 }, { c: 0.58, w: 0.08, h: 0.48 }, { c: 0.98, w: 0.09, h: 0.76 }] },
    { color: COLORS.berry, base: 0.09, speed: 0.25, peaks: [{ c: 0.35, w: 0.09, h: 0.42 }, { c: 0.71, w: 0.05, h: 0.32 }, { c: 0.90, w: 0.06, h: 0.26 }] },
    { color: COLORS.navy, base: 0.13, speed: 0.19, peaks: [{ c: 0.10, w: 0.13, h: 0.18 }, { c: 0.48, w: 0.10, h: 0.20 }, { c: 0.82, w: 0.12, h: 0.16 }] }
  ];
  layers.forEach(function (layer, i) {
    layer.peaks.forEach(function (p, j) { p.phase = i * 1.7 + j * 2.3; });
  });

  var W = 0, H = 0, towers = [], nodes = [], ripples = [];
  var pointer = { x: 0, y: 0, strength: 0, target: 0 };

  function surface(layer, xFrac, t, xPx) {
    var y = layer.base + 0.012 * Math.sin(xFrac * 34 + t * layer.speed * 4);
    layer.peaks.forEach(function (p) {
      var drift = p.c + 0.012 * Math.sin(t * layer.speed + p.phase);
      var breathe = 0.80 + 0.20 * Math.sin(t * layer.speed * 2.2 + p.phase);
      var d = (xFrac - drift) / p.w;
      y += p.h * breathe * Math.exp(-d * d);
    });
    if (pointer.strength > 0.002) {
      var dp = (xPx - pointer.x) / Math.max(70, W * 0.065);
      y += (0.20 + layer.base) * pointer.strength * Math.exp(-dp * dp);
    }
    return H - Math.min(y, 0.97) * H;
  }

  function buildScene() {
    var narrow = W < 760;
    towers = (narrow ? [0.62, 0.88] : [0.42, 0.66, 0.90]).map(function (x, i) {
      return { x: x, height: 0.34 + (i % 2) * 0.07, offset: i * 0.37 };
    });
    var count = narrow ? 5 : 9;
    var seeds = [0.30, 0.47, 0.56, 0.72, 0.80, 0.36, 0.60, 0.95, 0.52];
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({ x: seeds[i], y: 0.10 + ((i * 37) % 44) / 100, phase: i * 1.3 });
    }
  }

  function resize() {
    var box = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = box.width; H = box.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildScene();
  }

  function towerTip(tower, t) {
    var front = layers[layers.length - 1];
    var groundY = surface(front, tower.x, t, tower.x * W);
    return { x: tower.x * W, y: groundY - tower.height * H, ground: groundY };
  }

  function drawTower(tower, t) {
    var tip = towerTip(tower, t);
    var half = H * 0.045;
    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tip.x - half, tip.ground + 6);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(tip.x + half, tip.ground + 6);
    var rungs = 4;
    for (var i = 1; i <= rungs; i++) {
      var f = i / (rungs + 1);
      var y = tip.y + (tip.ground - tip.y) * f;
      ctx.moveTo(tip.x - half * f, y);
      ctx.lineTo(tip.x + half * f, y);
    }
    ctx.stroke();
    ctx.fillStyle = COLORS.navy;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
    ctx.fill();
    return tip;
  }

  function drawRing(x, y, r, alpha, color) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawLink(a, b, t, seed) {
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    var p = (t * 0.28 + seed) % 1;
    ctx.fillStyle = COLORS.paper;
    ctx.beginPath();
    ctx.arc(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw(t) {
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, W, H);

    // Overlapping peaks, slightly translucent so each one shows through the next.
    var step = Math.max(4, W / 260);
    layers.forEach(function (layer, i) {
      ctx.globalAlpha = i === layers.length - 1 ? 1 : 0.88;
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (var x = 0; x <= W + step; x += step) {
        ctx.lineTo(x, surface(layer, x / W, t, x));
      }
      ctx.lineTo(W + step, H);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    var tips = towers.map(function (tower) { return drawTower(tower, t); });

    // Radio pulses leaving each tower.
    tips.forEach(function (tip, i) {
      for (var k = 0; k < 3; k++) {
        var phase = (t * 0.16 + towers[i].offset + k / 3) % 1;
        drawRing(tip.x, tip.y, 6 + phase * H * 0.62, (1 - phase) * 0.55, COLORS.paper);
      }
    });

    // Devices drifting overhead, each linked to its nearest tower.
    nodes.forEach(function (node, i) {
      var nx = node.x * W + Math.sin(t * 0.35 + node.phase) * 10;
      var ny = node.y * H + Math.cos(t * 0.45 + node.phase) * 7;
      var nearest = tips.reduce(function (best, tip) {
        return Math.abs(tip.x - nx) < Math.abs(best.x - nx) ? tip : best;
      }, tips[0]);
      drawLink(nearest, { x: nx, y: ny }, t, i * 0.21);
      ctx.fillStyle = COLORS.navy;
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.paper;
      ctx.beginPath();
      ctx.arc(nx, ny, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // The visitor's cursor joins the network.
    if (pointer.strength > 0.02) {
      var near = tips.reduce(function (best, tip) {
        return Math.abs(tip.x - pointer.x) < Math.abs(best.x - pointer.x) ? tip : best;
      }, tips[0]);
      ctx.globalAlpha = pointer.strength;
      drawLink(near, pointer, t * 2.4, 0);
      ctx.globalAlpha = pointer.strength;
      ctx.fillStyle = COLORS.amber;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Click or tap pulses.
    ripples = ripples.filter(function (r) { return t - r.start < 1.6; });
    ripples.forEach(function (r) {
      var p = (t - r.start) / 1.6;
      drawRing(r.x, r.y, 8 + p * H * 0.8, (1 - p) * 0.9, COLORS.amber);
    });
  }

  resize();
  // A settled scene for the first frame, and the only frame when motion is reduced.
  draw(12);

  window.addEventListener('resize', function () { resize(); draw(reduceMotion ? 12 : clock); });
  if (reduceMotion) return;

  var banner = canvas.parentElement;
  function locate(event) {
    var box = canvas.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
  }
  banner.addEventListener('pointermove', function (event) { locate(event); pointer.target = 1; });
  banner.addEventListener('pointerleave', function () { pointer.target = 0; });
  banner.addEventListener('pointerdown', function (event) {
    locate(event);
    ripples.push({ x: pointer.x, y: pointer.y, start: clock });
  });

  var clock = 12, last = 0, running = false, onScreen = true;
  function frame(now) {
    if (!running) return;
    if (last) clock += Math.min((now - last) / 1000, 0.05);
    last = now;
    pointer.strength += (pointer.target - pointer.strength) * 0.08;
    draw(clock);
    requestAnimationFrame(frame);
  }
  function sync() {
    var want = onScreen && !document.hidden;
    if (want === running) return;
    running = want;
    last = 0;
    if (running) requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      sync();
    }).observe(banner);
  }
  document.addEventListener('visibilitychange', sync);
  sync();
}());
