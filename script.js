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
(function initLowPoly() {
  const canvas = document.getElementById('bg');
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = () => initThree();
  document.head.appendChild(script);

  function initThree() {
    let W = window.innerWidth, H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 0, 28);

    // -- Low-poly icosahedron shards --
    const SHARD_COUNT = 55;
    const shards = [];

    const colors = [0x1060ff, 0x2080ff, 0x3d8fff, 0x0050dd, 0x6aabff, 0x0033aa, 0x88ccff];

    for (let i = 0; i < SHARD_COUNT; i++) {
      const size = Math.random() * 2.8 + 0.6;
      const geo  = new THREE.IcosahedronGeometry(size, 0); // detail=0 = raw low-poly

      // Randomize vertex positions slightly for organic look
      const pos = geo.attributes.position;
      for (let v = 0; v < pos.count; v++) {
        pos.setXYZ(
          v,
          pos.getX(v) + (Math.random() - 0.5) * size * 0.35,
          pos.getY(v) + (Math.random() - 0.5) * size * 0.35,
          pos.getZ(v) + (Math.random() - 0.5) * size * 0.35,
        );
      }
      geo.computeVertexNormals();

      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        wireframe: true,
        transparent: true,
        opacity: Math.random() * 0.28 + 0.09,
      });

      // Solid face version (very faint)
      const solidMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: Math.random() * 0.07 + 0.025,
        side: THREE.DoubleSide,
      });

      const wire  = new THREE.Mesh(geo, mat);
      const solid = new THREE.Mesh(geo, solidMat);

      const spread = 22;
      const x = (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread * 0.7;
      const z = (Math.random() - 0.5) * 14 - 4;

      wire.position.set(x, y, z);
      solid.position.set(x, y, z);

      wire.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      solid.rotation.copy(wire.rotation);

      const speed = {
        rx: (Math.random() - 0.5) * 0.004,
        ry: (Math.random() - 0.5) * 0.004,
        rz: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.008,
        vx: (Math.random() - 0.5) * 0.005,
      };

      scene.add(wire);
      scene.add(solid);
      shards.push({ wire, solid, speed, baseY: y, baseX: x });
    }

    // -- Floating grid plane (subtle) --
    const gridGeo = new THREE.PlaneGeometry(80, 50, 18, 12);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0040cc,
      wireframe: true,
      transparent: true,
      opacity: 0.04,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 3.5;
    grid.position.set(0, -8, -10);
    scene.add(grid);

    // -- Large background shard (hero piece) --
    const heroGeo = new THREE.IcosahedronGeometry(9, 1);
    const hPos = heroGeo.attributes.position;
    for (let v = 0; v < hPos.count; v++) {
      hPos.setXYZ(v,
        hPos.getX(v) + (Math.random() - 0.5) * 1.2,
        hPos.getY(v) + (Math.random() - 0.5) * 1.2,
        hPos.getZ(v) + (Math.random() - 0.5) * 1.2,
      );
    }
    heroGeo.computeVertexNormals();
    const heroMat = new THREE.MeshBasicMaterial({
      color: 0x0044cc,
      wireframe: true,
      transparent: true,
      opacity: 0.13,
    });
    const hero = new THREE.Mesh(heroGeo, heroMat);
    hero.position.set(12, 2, -8);
    scene.add(hero);

    // Mouse parallax
    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
      mx = (e.clientX / W - 0.5);
      my = (e.clientY / H - 0.5);
    });

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.008;

      // Rotate hero shard slowly
      hero.rotation.x += 0.0008;
      hero.rotation.y += 0.0012;

      // Grid subtle drift
      grid.rotation.z += 0.0002;

      // Camera parallax
      camera.position.x += (mx * 3 - camera.position.x) * 0.03;
      camera.position.y += (-my * 2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      // Animate each shard
      shards.forEach((s, i) => {
        s.wire.rotation.x  += s.speed.rx;
        s.wire.rotation.y  += s.speed.ry;
        s.wire.rotation.z  += s.speed.rz;
        s.solid.rotation.copy(s.wire.rotation);

        // Gentle float
        const floatY = s.baseY + Math.sin(t + i * 0.4) * 0.8;
        const floatX = s.baseX + Math.cos(t * 0.6 + i * 0.3) * 0.4;
        s.wire.position.y  = floatY;
        s.solid.position.y = floatY;
        s.wire.position.x  = floatX;
        s.solid.position.x = floatX;

        // Pulse opacity
        s.wire.material.opacity  = (Math.sin(t * 0.8 + i) * 0.08 + 0.14);
        s.solid.material.opacity = (Math.sin(t * 0.8 + i) * 0.015 + 0.02);
      });

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      W = window.innerWidth; H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }, { passive: true });
  }
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
