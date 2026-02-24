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

/* ─── WEBGL 3D GLOBE ─── */
(function initGlobe() {
  const canvas = document.getElementById('bg');

  // Load Three.js dynamically
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = () => initThree();
  document.head.appendChild(script);

  function initThree() {
    const W = window.innerWidth, H = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.z = 2.8;

    // ── Globe wireframe ──
    const sphereGeo  = new THREE.SphereGeometry(1, 36, 24);
    const wireMat    = new THREE.MeshBasicMaterial({
      color: 0x0050ff,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    });
    const globe = new THREE.Mesh(sphereGeo, wireMat);
    scene.add(globe);

    // ── Outer glow sphere ──
    const glowGeo = new THREE.SphereGeometry(1.06, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x2b7fff,
      transparent: true,
      opacity: 0.03,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // ── Equator ring ──
    const ringGeo = new THREE.TorusGeometry(1.0, 0.002, 8, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x0080ff, transparent: true, opacity: 0.35 });
    const ring    = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    // ── Lat lines (5 horizontal rings) ──
    [-60, -30, 0, 30, 60].forEach(deg => {
      const lat = deg * Math.PI / 180;
      const r   = Math.cos(lat);
      const y   = Math.sin(lat);
      const lg  = new THREE.TorusGeometry(r, 0.001, 6, 80);
      const lm  = new THREE.MeshBasicMaterial({ color: 0x0050ff, transparent: true, opacity: 0.12 });
      const lring = new THREE.Mesh(lg, lm);
      lring.position.y = y;
      lring.rotation.x = Math.PI / 2;
      scene.add(lring);
    });

    // ── Node dots on surface ──
    const NODE_POSITIONS = [
      [35.7, 139.7],  // Tokyo
      [51.5, -0.1],   // London
      [40.7, -74.0],  // NYC
      [1.3,  103.8],  // Singapore
      [48.9, 2.3],    // Paris
      [37.6, 126.9],  // Seoul
      [22.3, 114.2],  // HK
      [-33.9, 151.2], // Sydney
      [55.7, 37.6],   // Moscow
      [19.1, 72.9],   // Mumbai
      [25.2, 55.3],   // Dubai
      [-23.5, -46.6], // Sao Paulo
    ];

    const dotGeo = new THREE.SphereGeometry(0.018, 8, 8);
    const dots   = [];
    const dotGroup = new THREE.Group();

    NODE_POSITIONS.forEach(([lat, lon]) => {
      const phi   = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      const x = -Math.sin(phi) * Math.cos(theta);
      const y =  Math.cos(phi);
      const z =  Math.sin(phi) * Math.sin(theta);
      const mat  = new THREE.MeshBasicMaterial({ color: 0x5599ff, transparent: true, opacity: 0.9 });
      const dot  = new THREE.Mesh(dotGeo, mat);
      dot.position.set(x, y, z);
      dot.userData.pulse = Math.random() * Math.PI * 2;
      dots.push(dot);
      dotGroup.add(dot);
    });
    scene.add(dotGroup);

    // ── Connection lines between nearby nodes ──
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0060ff, transparent: true, opacity: 0.25 });
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const d = dots[i].position.distanceTo(dots[j].position);
        if (d < 1.1) {
          const geo = new THREE.BufferGeometry().setFromPoints([
            dots[i].position, dots[j].position
          ]);
          dotGroup.add(new THREE.Line(geo, lineMat));
        }
      }
    }

    // ── Particles halo ──
    const pCount = 800;
    const pPos   = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r   = 1.4 + Math.random() * 0.8;
      const phi = Math.acos(2 * Math.random() - 1);
      const th  = Math.random() * Math.PI * 2;
      pPos[i * 3]     = r * Math.sin(phi) * Math.cos(th);
      pPos[i * 3 + 1] = r * Math.cos(phi);
      pPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(th);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x3366ff, size: 0.008, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(pGeo, pMat));

    // ── Position globe off-center to the right ──
    globe.position.x      = 1.2;
    dotGroup.position.x   = 1.2;
    ring.position.x       = 1.2;
    scene.children.forEach(c => {
      if (c.type === 'Mesh' && c.geometry.type === 'TorusGeometry') c.position.x = 1.2;
      if (c.type === 'Mesh' && c.geometry.type === 'SphereGeometry' && c !== globe) c.position.x = 1.2;
    });

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    });

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.005;

      // Auto-rotate
      globe.rotation.y    += 0.0018;
      dotGroup.rotation.y += 0.0018;
      ring.rotation.z     += 0.0005;

      // Mouse parallax tilt
      globe.rotation.x    += (mouseY * 0.5 - globe.rotation.x)    * 0.04;
      dotGroup.rotation.x += (mouseY * 0.5 - dotGroup.rotation.x) * 0.04;

      // Pulse dots
      dots.forEach(dot => {
        dot.userData.pulse += 0.04;
        dot.material.opacity = 0.5 + Math.sin(dot.userData.pulse) * 0.4;
        const s = 1 + Math.sin(dot.userData.pulse) * 0.25;
        dot.scale.setScalar(s);
      });

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      const W = window.innerWidth, H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }, { passive: true });
  }
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

/* ─── LANGUAGE TOGGLE ─── */
const TRANSLATIONS = {
  // HERO
  '.eyebrow-text':  { jp: 'Strategic Consulting × AI',  en: 'Strategic Consulting × AI' },
  '.hero-desc':     { jp: '経営とAIを掛け合わせ、企業のポテンシャルを最大限引き出す。<br>Advancementは、変革を実装まで伴走する戦略パートナーです。',
                      en: 'We fuse management strategy with AI to unlock the full potential of your business.<br>Advancement is the strategic partner that executes transformation alongside you.' },
  '[href="#contact"].btn-fill':  { jp: 'Contact Us',  en: 'Contact Us' },
  '[href="#services"].btn-ghost':{ jp: 'Our Services',en: 'Our Services' },

  // PHILOSOPHY
  '.philo-h':   { jp: 'Unleash<br>Potential,<br><em>Redefine</em><br>Limits.',
                  en: 'Unleash<br>Potential,<br><em>Redefine</em><br>Limits.' },

  // FOUNDER
  '.founder-title-label': { jp: 'Representative Director', en: 'Representative Director' },
  '.founder-p:first-of-type': {
    jp: 'エンジニア、ITコンサルタント、経営管理の実務を経て、2023年、Advancementを創業。',
    en: 'After careers in engineering, IT consulting, and management, he founded Advancement in 2023.'
  },

  // SERVICES
  '.services-sub': { jp: '経営とAIの融合で、<br>ビジネスの可能性を拡張する。',
                     en: 'Fusing management and AI<br>to expand business potential.' },

  // WHY
  '.cred-card:nth-child(1) .cred-h': { jp: '技術と経営、<br>両方わかる',         en: 'Tech & Management.<br>Both.' },
  '.cred-card:nth-child(2) .cred-h': { jp: '戦略で終わらない、<br>実装まで',      en: 'Strategy through<br>Execution.' },
  '.cred-card:nth-child(3) .cred-h': { jp: 'AIを武器にする<br>経営戦略',          en: 'AI as a Strategic<br>Weapon.' },
  '.cred-card:nth-child(4) .cred-h': { jp: 'スタートアップから<br>大企業まで',    en: 'Startups to<br>Enterprises.' },
  '.cred-card:nth-child(1) .cred-p': { jp: 'エンジニアリングから経営管理まで実務を経た代表が、現場レベルで課題を理解し、経営レベルで解を設計します。',
                                       en: 'Our founder, with hands-on experience from engineering to management, understands challenges at the operational level and designs solutions at the executive level.' },
  '.cred-card:nth-child(2) .cred-p': { jp: 'コンサルティングは提言で終わりがちです。Advancementは実装フェーズまで伴走し、確実に成果を出すことにコミットします。',
                                       en: 'Consulting often ends at recommendations. Advancement commits to walking alongside clients through implementation to ensure real outcomes.' },
  '.cred-card:nth-child(3) .cred-p': { jp: 'AIは導入することが目的ではありません。経営戦略と融合させて初めて競争優位になる。その設計ができる数少ないパートナーです。',
                                       en: 'AI is not the goal — integrating it with management strategy to create competitive advantage is. We are one of the few partners who can architect that.' },
  '.cred-card:nth-child(4) .cred-p': { jp: '創業期のスタートアップへの投資支援から、大企業のAI変革まで。企業のフェーズに合わせた最適なアプローチを提供します。',
                                       en: 'From investment support for early-stage startups to AI transformation for large enterprises — we tailor our approach to your stage.' },

  // CONTACT
  '.contact-desc': { jp: 'プロジェクトのご相談、投資相談など、<br>お気軽にお問い合わせください。',
                     en: 'For project inquiries, investment consultations,<br>please feel free to reach out.' },

  // FOOTER
  '.ft-tagline': { jp: '経営とAIを掛け合わせ、<br>企業のポテンシャルを最大限引き出す。',
                   en: 'Fusing management and AI<br>to unlock unlimited potential.' },
  '.ft-copy':    { jp: '© 2026 Advancement Inc. All rights reserved.',
                   en: '© 2026 Advancement Inc. All rights reserved.' },
};

function toggleLang() {
  const isJP = document.documentElement.lang === 'ja';
  const next  = isJP ? 'en' : 'ja';
  document.documentElement.lang = next;
  document.getElementById('lang-btn').textContent = isJP ? 'JP / EN' : 'EN / JP';

  Object.entries(TRANSLATIONS).forEach(([sel, t]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.innerHTML = next === 'en' ? t.en : t.jp;
  });

  // Form placeholders
  const isEN = next === 'en';
  const fields = {
    '[name="name"]':    isEN ? 'Taro Yamada'       : '山田 太郎',
    '[name="email"]':   isEN ? 'hello@example.com'  : 'hello@example.com',
    '[name="company"]': isEN ? 'Example Inc.'        : '株式会社 Example',
    '[name="message"]': isEN ? 'Please describe your inquiry...' : 'ご相談内容をご記入ください…',
  };
  Object.entries(fields).forEach(([sel, ph]) => {
    const el = document.querySelector(sel);
    if (el) el.placeholder = ph;
  });
}

/* ─── SCROLL PROGRESS BAR ─── */
(function initProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;width:0%;background:linear-gradient(90deg,#0050ff,#5599ff);z-index:9999;transition:width .1s linear;pointer-events:none;';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
})();
