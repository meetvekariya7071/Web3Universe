/* ============================================
   HOME.JS — Arbitrum Landing Page JS
   ============================================ */

// ─── Hero Canvas: Arbitrum-style network animation ───
(function initCanvas() {
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var nodes = [];
  var raf;
  var mouse = { x: -9999, y: -9999 };

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  var N = Math.min(Math.floor(window.innerWidth / 14), 80);
  for (var i = 0; i < N; i++) {
    nodes.push({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 2 + 1.2,
      hue: Math.random() > 0.5 ? '18,170,255' : '99,102,241'
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < nodes.length; i++) {
      var p = nodes[i];
      p.x += p.vx;
      p.y += p.vy;

      // mouse repel
      var dx = p.x - mouse.x, dy = p.y - mouse.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < 110 && d > 0) { p.x += (dx / d) * 0.9; p.y += (dy / d) * 0.9; }

      // wrap
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.hue + ',0.55)';
      ctx.fill();

      // connections
      for (var j = i + 1; j < nodes.length; j++) {
        var q = nodes[j];
        var ex = p.x - q.x, ey = p.y - q.y;
        var dist = Math.sqrt(ex * ex + ey * ey);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          var alpha = (1 - dist / 150) * 0.18;
          ctx.strokeStyle = 'rgba(18,170,255,' + alpha + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(draw);
  }

  draw();

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); } else { draw(); }
  });
})();

// ─── Smooth scroll for hero CTA ───
(function initSmoothScroll() {
  var btn = document.getElementById('btn-learn');
  if (!btn) return;
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    var target = document.getElementById('why-l2');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

// ─── Hero parallax ───
(function initParallax() {
  var content = document.querySelector('.hero-content');
  if (!content) return;
  window.addEventListener('scroll', function () {
    var s = window.scrollY;
    if (s < window.innerHeight) {
      content.style.transform = 'translateY(' + s * 0.22 + 'px)';
      content.style.opacity = '' + (1 - s / (window.innerHeight * 0.75));
    }
  }, { passive: true });
})();

// ─── Rollup step highlight loop ───
(function initRollupHighlight() {
  var steps = document.querySelectorAll('.rollup-step');
  if (!steps.length) return;
  var idx = 0;
  setInterval(function () {
    steps.forEach(function (s) {
      s.style.background = '';
      s.style.boxShadow = '';
    });
    steps[idx].style.background = 'rgba(18,170,255,0.06)';
    idx = (idx + 1) % steps.length;
  }, 1400);
})();

// ─── Diagram TX pulse stagger ───
(function initDiagTx() {
  var txs = document.querySelectorAll('.diag-tx');
  txs.forEach(function (tx, i) {
    tx.style.animationDelay = (i * 0.2) + 's';
  });
})();

// ─── Stat counter animation ───
(function initCounters() {
  var el = document.getElementById('stat-gas');
  if (!el) return;
  var values = ['~$0.01', '~$0.02', '~$0.01', '~$0.03', '~$0.01'];
  var i = 0;
  setInterval(function () {
    i = (i + 1) % values.length;
    el.textContent = values[i];
  }, 3000);
})();
