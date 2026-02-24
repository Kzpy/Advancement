/* =============================================
   ADVANCEMENT — script.js
   ============================================= */

/* ─── LOADER ─── */
(function initLoader() {
  const fill  = document.getElementById('loader-fill');
  const pctEl = document.getElementById('loader-pct');
  const loader = document.getElementById('loader');
  let pct = 0;

  const tick = setInterval(() => {
    pct += Math.random() * 11 + 2;
    if (pct >= 100) {
      pct = 100;
      clearInterval(tick);
      setTimeout(() => loader.classList.add('out'), 350);
    }
    fill.style.width = pct + '%';
    pctEl.textContent  = Math.floor(pct) + '%';
  }, 75);
})();

/* ─── CUSTOM CURSOR ─── */
(function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  (function loop() {
    rx = lerp(rx, mx, 0.11);
    ry = lerp(ry, my, 0.11);
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a, button, input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hov'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hov'));
  });
})();

/* ─── HEADER STICKY ─── */
(function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('sticky', window.scrollY > 60);
  }, { passive: true });
})();

/* ─── PARTICLE CANVAS ─── */
(function initCanvas() {
  const canvas = document.getElementById('bg');
  const ctx    = canvas.getContext('2d');
  let W, H, t = 0;

  // ── Globe nodes (lat/lon projected) ──
  const NODE_COUNT = 42;
  let nodes = [];

  // Strategic hub nodes with fixed positions (normalized 0-1)
  const HUBS = [
    [0.18, 0.30], [0.42, 0.22], [0.62, 0.28], [0.80, 0.32],
    [0.25, 0.52], [0.50, 0.48], [0.72, 0.45], [0.88, 0.55],
    [0.15, 0.68], [0.38, 0.65], [0.58, 0.70], [0.76, 0.68],
  ];

  class Node {
    constructor(xn, yn, isHub = false) {
      this.xn    = xn + (Math.random() - 0.5) * (isHub ? 0.02 : 0.08);
      this.yn    = yn + (Math.random() - 0.5) * (isHub ? 0.02 : 0.06);
      this.vx    = (Math.random() - 0.5) * 0.00012;
      this.vy    = (Math.random() - 0.5) * 0.00008;
      this.r     = isHub ? Math.random() * 2 + 2.5 : Math.random() * 1.2 + 0.6;
      this.isHub = isHub;
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.018 + Math.random() * 0.012;
    }
    get x() { return this.xn * W; }
    get y() { return this.yn * H; }
    update() {
      this.xn += this.vx;
      this.yn += this.vy;
      if (this.xn < 0.05 || this.xn > 0.95) this.vx *= -1;
      if (this.yn < 0.1  || this.yn > 0.9 ) this.vy *= -1;
      this.pulse += this.pulseSpeed;
    }
    draw() {
      const glow = Math.sin(this.pulse) * 0.4 + 0.6;
      if (this.isHub) {
        // Outer ring pulse
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 6 + Math.sin(this.pulse) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,120,255,${glow * 0.18})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        // Inner dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,160,255,${glow * 0.9})`;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60,130,255,${glow * 0.55})`;
        ctx.fill();
      }
    }
  }

  // ── Data packets traveling along edges ──
  class Packet {
    constructor(from, to) {
      this.from = from;
      this.to   = to;
      this.t    = 0;
      this.speed = 0.004 + Math.random() * 0.004;
    }
    update() { this.t += this.speed; }
    get done() { return this.t >= 1; }
    draw() {
      const x = this.from.x + (this.to.x - this.from.x) * this.t;
      const y = this.from.y + (this.to.y - this.from.y) * this.t;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160,210,255,${(1 - Math.abs(this.t - 0.5) * 2) * 0.9})`;
      ctx.fill();
    }
  }

  // ── Horizontal scan lines ──
  const SCAN_LINES = 5;
  let scanLines = Array.from({ length: SCAN_LINES }, (_, i) => ({
    y: (i / SCAN_LINES) * 1.0,
    speed: 0.0004 + Math.random() * 0.0003,
    opacity: 0.04 + Math.random() * 0.04,
    width: 0.3 + Math.random() * 0.4,
  }));

  let packets = [];
  let edges   = [];  // pairs of hub nodes

  function buildEdges() {
    edges = [];
    const hubs = nodes.filter(n => n.isHub);
    hubs.forEach((a, i) => {
      hubs.forEach((b, j) => {
        if (j <= i) return;
        const dx = a.xn - b.xn, dy = a.yn - b.yn;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 0.38) edges.push([a, b, d]);
      });
    });
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;

    nodes = HUBS.map(([x, y]) => new Node(x, y, true));
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push(new Node(Math.random() * 0.9 + 0.05, Math.random() * 0.7 + 0.12, false));
    }
    buildEdges();
    packets = [];
  }

  function drawEdge(a, b, dist) {
    const alpha = (1 - dist / 0.38) * 0.22;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(0,80,220,${alpha})`;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
  }

  function drawSoftEdge(a, b, d) {
    // subtle non-hub connections
    const alpha = (1 - d / 0.22) * 0.10;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(0,60,180,${alpha})`;
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  function drawScanLines() {
    scanLines.forEach(sl => {
      const y = sl.y * H;
      const grd = ctx.createLinearGradient(0, y, W, y);
      grd.addColorStop(0,          'transparent');
      grd.addColorStop(0.5 - sl.width / 2, 'transparent');
      grd.addColorStop(0.5,        `rgba(0,100,255,${sl.opacity})`);
      grd.addColorStop(0.5 + sl.width / 2, 'transparent');
      grd.addColorStop(1,          'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, y - 1, W, 2);
      sl.y += sl.speed;
      if (sl.y > 1.05) sl.y = -0.05;
    });
  }

  function drawCornerMarkers() {
    // Subtle corner bracket decorations
    const size = 24, margin = 40;
    const corners = [
      [margin,     margin,      1,  1 ],
      [W - margin, margin,     -1,  1 ],
      [margin,     H - margin,  1, -1 ],
      [W - margin, H - margin, -1, -1 ],
    ];
    ctx.strokeStyle = 'rgba(0,100,255,0.15)';
    ctx.lineWidth   = 1;
    corners.forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + sx * size, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * size);
      ctx.stroke();
    });
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    t++;

    // Scan lines
    drawScanLines();
    // Corner markers
    drawCornerMarkers();

    // Update nodes
    nodes.forEach(n => n.update());

    // Draw soft edges between nearby non-hub nodes
    const regular = nodes.filter(n => !n.isHub);
    for (let i = 0; i < regular.length; i++) {
      for (let j = i + 1; j < regular.length; j++) {
        const a = regular[i], b = regular[j];
        const dx = a.xn - b.xn, dy = a.yn - b.yn;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 0.22) drawSoftEdge(a, b, d);
      }
    }

    // Draw hub edges
    edges.forEach(([a, b, d]) => drawEdge(a, b, d));

    // Spawn packets occasionally
    if (t % 38 === 0 && edges.length > 0) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      packets.push(new Packet(e[0], e[1]));
      if (Math.random() > 0.5) packets.push(new Packet(e[1], e[0]));
    }

    // Update & draw packets
    packets = packets.filter(p => !p.done);
    packets.forEach(p => { p.update(); p.draw(); });

    // Draw nodes (non-hub first, then hubs on top)
    regular.forEach(n => n.draw());
    nodes.filter(n => n.isHub).forEach(n => n.draw());

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  frame();
})();

/* ─── SCROLL REVEAL ─── */
(function initReveal() {
  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();
