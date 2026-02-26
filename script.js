/* =============================================
   ADVANCEMENT -- script.js
   ============================================= */

/* --- LOADER --- */
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

/* --- CUSTOM CURSOR --- */
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

/* --- HEADER STICKY --- */
(function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('sticky', window.scrollY > 60);
  }, { passive: true });
})();

/* --- WEBGL LOW-POLY MESH --- */
(function initBg() {
  const canvas = document.getElementById('bg');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const M = window.innerWidth < 800;

  /* ========================================
     LAYER 1: DIGITAL RAIN COLUMNS
     kanji-style data streams falling
  ======================================== */
  const CHARS = 'ADVANCEMENT01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+-<>[]{}|~^';
  const COL_W  = M ? 18 : 22;
  const COLS   = Math.ceil(W / COL_W);
  const cols   = Array.from({length: COLS}, () => ({
    y:     Math.random() * H,
    speed: 0.8 + Math.random() * 2.2,
    len:   8 + Math.floor(Math.random() * 20),
    bright: Math.random() > 0.88,
    chars: Array.from({length: 30}, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
    mutate: 0,
  }));

  /* ========================================
     LAYER 2: MORPHING GEOMETRY
     Giant wireframe structures that breathe
  ======================================== */
  function makeVerts(n, rx, ry, rz, scale) {
    // icosahedron-like but procedural
    const verts = [];
    const golden = (1 + Math.sqrt(5)) / 2;
    const base = [
      [-1, golden, 0],[1, golden, 0],[-1,-golden, 0],[1,-golden, 0],
      [0,-1, golden],[0, 1, golden],[0,-1,-golden],[0, 1,-golden],
      [golden, 0,-1],[golden, 0, 1],[-golden, 0,-1],[-golden, 0, 1],
    ];
    return base.map(v => {
      const len = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
      return { ox: v[0]/len*scale, oy: v[1]/len*scale, oz: v[2]/len*scale };
    });
  }

  const geos = [
    { verts: makeVerts(12,0,0,0,180), rx:0, ry:0, rz:0, drx:0.0004, dry:0.0007, drz:0.0003, cx:W*0.72, cy:H*0.42, pulse:0 },
    { verts: makeVerts(12,1,0,0,110), rx:1, ry:0.5, rz:0, drx:0.0006, dry:-0.0005, drz:0.0004, cx:W*0.15, cy:H*0.6, pulse:1.5 },
    { verts: makeVerts(12,0,1,0,70),  rx:0, ry:1, rz:0.5, drx:-0.0005, dry:0.0008, drz:-0.0004, cx:W*0.5, cy:H*0.2, pulse:3 },
  ];

  function project(v, geo, t) {
    // rotate
    let x=v.ox, y=v.oy, z=v.oz;
    const rx = geo.rx, ry = geo.ry, rz = geo.rz;
    // x rotation
    let y2 = y*Math.cos(rx) - z*Math.sin(rx);
    let z2 = y*Math.sin(rx) + z*Math.cos(rx);
    y=y2; z=z2;
    // y rotation
    let x2 = x*Math.cos(ry) + z*Math.sin(ry);
    z2 = -x*Math.sin(ry) + z*Math.cos(ry);
    x=x2; z=z2;
    // z rotation
    x2 = x*Math.cos(rz) - y*Math.sin(rz);
    y2 = x*Math.sin(rz) + y*Math.cos(rz);
    x=x2; y=y2;
    // perspective
    const fov = 600;
    const depth = fov / (fov + z + 200);
    return { sx: geo.cx + x * depth, sy: geo.cy + y * depth, depth, z };
  }

  const icoEdges = [
    [0,1],[0,5],[0,7],[0,10],[0,11],
    [1,5],[1,7],[1,8],[1,9],
    [2,3],[2,6],[2,10],[2,11],
    [3,4],[3,6],[3,8],[3,9],
    [4,5],[4,9],[4,11],
    [5,9],[6,7],[6,8],[6,10],
    [7,8],[7,10],[8,9],[10,11],
  ];

  /* ========================================
     LAYER 3: HYPERSPACE LINES
     Radial lines shooting from center vanishing point
  ======================================== */
  const HYPER = 80;
  const hypers = Array.from({length: HYPER}, (_, i) => ({
    angle: (i / HYPER) * Math.PI * 2,
    speed: 0.3 + Math.random() * 1.2,
    len:   0,
    maxLen: 0.3 + Math.random() * 0.7,
    phase:  Math.random() * Math.PI * 2,
    width:  0.2 + Math.random() * 0.8,
  }));

  /* ========================================
     LAYER 4: FLOATING PARTICLES (neural)
  ======================================== */
  const PCOUNT = M ? 80 : 200;
  const parts = Array.from({length: PCOUNT}, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
    r: Math.random()*1.5+0.3, phase: Math.random()*Math.PI*2,
    hue: 200 + Math.random()*60,
  }));

  /* ========================================
     MOUSE + SCROLL
  ======================================== */
  let mx = W*0.5, my = H*0.5, scroll = 0;
  if (!M) {
    window.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; }, {passive:true});
  }
  window.addEventListener('scroll', () => { scroll = window.scrollY; }, {passive:true});

  /* ========================================
     MAIN LOOP
  ======================================== */
  let t = 0, lastT = 0;
  const offscreen = document.createElement('canvas');
  offscreen.width = W; offscreen.height = H;
  const off = offscreen.getContext('2d');

  function draw(ts) {
    requestAnimationFrame(draw);
    const dt = Math.min((ts - lastT) / 16.67, 3);
    lastT = ts;
    t += 0.012 * dt;

    const scrollFactor = 1 + scroll * 0.0006;

    /* -- BG -- */
    ctx.fillStyle = 'rgba(4,8,18,0.88)';
    ctx.fillRect(0, 0, W, H);

    /* ---- LAYER 1: DIGITAL RAIN ---- */
    ctx.font = `${M?11:13}px monospace`;
    cols.forEach((col, ci) => {
      col.mutate += dt;
      if (col.mutate > 8 + Math.random()*12) {
        col.chars[Math.floor(Math.random()*col.chars.length)] = CHARS[Math.floor(Math.random()*CHARS.length)];
        col.mutate = 0;
      }
      for (let i = 0; i < col.len; i++) {
        const cy = col.y - i * (M?18:22);
        if (cy < -30 || cy > H+30) continue;
        const alpha = Math.max(0, 1 - i/col.len);
        if (i === 0) {
          // bright head
          ctx.fillStyle = `rgba(200,230,255,${alpha * 0.95})`;
          // glow
          ctx.shadowColor = '#88bbff';
          ctx.shadowBlur = col.bright ? 14 : 6;
        } else {
          ctx.shadowBlur = 0;
          const fade = alpha * (col.bright ? 0.45 : 0.2);
          ctx.fillStyle = `rgba(80,140,255,${fade})`;
        }
        ctx.fillText(col.chars[i % col.chars.length], ci * COL_W, cy);
      }
      ctx.shadowBlur = 0;
      col.y += col.speed * dt;
      if (col.y - col.len * COL_W > H + 50) {
        col.y = -Math.random() * H * 0.5;
        col.speed = 0.8 + Math.random() * 2.2;
        col.len = 8 + Math.floor(Math.random() * 20);
        col.bright = Math.random() > 0.88;
      }
    });

    /* ---- LAYER 2: WIREFRAME GEOMETRY ---- */
    geos.forEach((geo, gi) => {
      geo.rx += geo.drx * dt;
      geo.ry += geo.dry * dt;
      geo.rz += geo.drz * dt;

      // mouse influence
      if (!M) {
        geo.ry += (mx/W - 0.5) * 0.0008 * dt;
        geo.rx += (my/H - 0.5) * 0.0006 * dt;
      }

      const pulse = Math.sin(t * 0.8 + geo.pulse);
      const alpha = (0.12 + pulse * 0.06) * (gi === 0 ? 1.4 : 0.8);
      const projected = geo.verts.map(v => project(v, geo, t));

      // edges
      icoEdges.forEach(([a, b]) => {
        const pa = projected[a], pb = projected[b];
        const depth = (pa.depth + pb.depth) * 0.5;
        const hue = 210 + gi * 20 + pulse * 10;
        const edgeAlpha = alpha * depth * 1.2;
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${hue},75%,68%,${Math.min(edgeAlpha, 0.5)})`;
        ctx.lineWidth = depth * (gi === 0 ? 1.4 : 0.9);
        ctx.shadowColor = `hsla(${hue},80%,70%,0.6)`;
        ctx.shadowBlur = gi === 0 ? 8 : 4;
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // vertex dots
      projected.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.depth * 3, 0, Math.PI*2);
        ctx.fillStyle = `rgba(160,200,255,${alpha * p.depth * 1.5})`;
        ctx.fill();
      });
    });

    /* ---- LAYER 3: HYPERSPACE LINES ---- */
    const cx = W * (0.5 + (mx/W-0.5)*0.08);
    const cy = H * (0.5 + (my/H-0.5)*0.06);
    hypers.forEach((h, i) => {
      const active = Math.sin(t * 1.2 + h.phase) > 0.3;
      if (!active) return;
      const progress = (Math.sin(t * 0.9 + h.phase * 2) + 1) / 2 * h.maxLen;
      const r1 = 0;
      const r2 = progress * Math.min(W, H) * 0.75 * scrollFactor;
      const ax = cx + Math.cos(h.angle) * r1;
      const ay = cy + Math.sin(h.angle) * r1;
      const bx = cx + Math.cos(h.angle) * r2;
      const by = cy + Math.sin(h.angle) * r2;
      const grad = ctx.createLinearGradient(ax, ay, bx, by);
      const hue = 200 + ((i / HYPER) * 60);
      grad.addColorStop(0, `hsla(${hue},90%,75%,0)`);
      grad.addColorStop(0.6, `hsla(${hue},85%,70%,${0.04 + h.width * 0.04})`);
      grad.addColorStop(1, `hsla(${hue},80%,65%,0)`);
      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = h.width * 0.8;
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    });

    /* ---- LAYER 4: NEURAL PARTICLES + CONNECTIONS ---- */
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.phase += 0.018 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (!M) {
        const dx = p.x-mx, dy = p.y-my, d = Math.sqrt(dx*dx+dy*dy);
        if (d < 100) { p.vx += dx/d*0.012; p.vy += dy/d*0.012; }
      }
      p.vx *= 0.997; p.vy *= 0.997;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      // connections to nearby
      for (let j = i+1; j < parts.length; j++) {
        const q = parts[j];
        const dx = p.x-q.x, dy = p.y-q.y, d = Math.sqrt(dx*dx+dy*dy);
        if (d < (M?90:120)) {
          const fade = (1 - d/(M?90:120)) * 0.18;
          ctx.beginPath();
          ctx.strokeStyle = `hsla(${p.hue},70%,65%,${fade})`;
          ctx.lineWidth = fade * 1.5;
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
      // dot
      const pulse = Math.sin(p.phase)*0.5+0.5;
      const gr = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*6);
      gr.addColorStop(0, `hsla(${p.hue},90%,75%,${0.22+pulse*0.18})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*6,0,Math.PI*2);
      ctx.fillStyle=gr; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*(1+pulse*0.8),0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},85%,82%,${0.7+pulse*0.25})`; ctx.fill();
    }

    /* ---- VIGNETTE ---- */
    const vig = ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.88);
    vig.addColorStop(0,'rgba(0,0,0,0)');
    vig.addColorStop(1,'rgba(0,0,0,0.65)');
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
  }

  requestAnimationFrame(draw);

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    offscreen.width = W; offscreen.height = H;
    geos[0].cx=W*0.72; geos[0].cy=H*0.42;
    geos[1].cx=W*0.15; geos[1].cy=H*0.6;
    geos[2].cx=W*0.5;  geos[2].cy=H*0.2;
  }, {passive:true});
})();


/* --- SCROLL REVEAL --- */
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

/* --- HAMBURGER MENU --- */
(function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  menu.querySelectorAll('.mm-link').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

/* --- LANGUAGE TOGGLE --- */
let currentLang = 'ja';

function toggleLang() {
  currentLang = currentLang === 'ja' ? 'en' : 'ja';
  const isEN = currentLang === 'en';

  // Update all lang buttons
  document.querySelectorAll('#lang-btn').forEach(b => b.textContent = isEN ? 'JP' : 'EN');
  document.querySelectorAll('.mm-lang').forEach(b => b.textContent = isEN ? 'JP / EN' : 'EN / JP');

  // Update all elements with data-jp / data-en
  document.querySelectorAll('[data-jp][data-en]').forEach(el => {
    const val = isEN ? el.dataset.en : el.dataset.jp;
    if (!val) return;
    // Use innerHTML to support <br> tags
    el.innerHTML = val;
  });

  // Form placeholders from data attributes
  document.querySelectorAll('input[data-ph-en], textarea[data-ph-en]').forEach(el => {
    el.placeholder = isEN ? el.dataset.phEn : el.dataset.phJp;
  });

  // html lang attribute
  document.documentElement.lang = currentLang;
}

/* --- SCROLL PROGRESS BAR --- */
(function initProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;width:0%;background:linear-gradient(90deg,#0050ff,#5599ff);z-index:9999;transition:width .1s linear;pointer-events:none;';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
})();
