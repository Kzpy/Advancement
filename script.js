/* =============================================
   ADVANCEMENT v16 — script.js
   Restrained, performant, purposeful.
   ============================================= */

/* ─── HEADER STICKY ─── */
(function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('sticky', window.scrollY > 60);
  }, { passive: true });
})();

/* ─── AMBIENT WEBGL — subtle, low-poly, quiet ─── */
(function initAmbient() {
  const canvas = document.getElementById('bg');
  if (!canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    canvas.style.display = 'none';
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = () => build();
  script.onerror = () => { canvas.style.display = 'none'; };
  document.head.appendChild(script);

  function build() {
    let W = window.innerWidth, H = window.innerHeight;
    const isMobile = W < 800;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 0, 30);

    // Fewer, larger shards — ambient, not busy
    const SHARD_COUNT = isMobile ? 12 : 28;
    const shards = [];

    for (let i = 0; i < SHARD_COUNT; i++) {
      const size = Math.random() * 3.2 + 0.8;
      const geo  = new THREE.IcosahedronGeometry(size, 0);

      const pos = geo.attributes.position;
      for (let v = 0; v < pos.count; v++) {
        pos.setXYZ(v,
          pos.getX(v) + (Math.random() - 0.5) * size * 0.3,
          pos.getY(v) + (Math.random() - 0.5) * size * 0.3,
          pos.getZ(v) + (Math.random() - 0.5) * size * 0.3,
        );
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshBasicMaterial({
        color: 0x0050ff,
        wireframe: true,
        transparent: true,
        opacity: Math.random() * 0.08 + 0.02,
      });

      const mesh = new THREE.Mesh(geo, mat);
      const spread = isMobile ? 16 : 24;
      const x = (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread * 0.6;
      const z = (Math.random() - 0.5) * 12 - 5;

      mesh.position.set(x, y, z);
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      const speed = {
        rx: (Math.random() - 0.5) * 0.002,
        ry: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.004,
      };

      scene.add(mesh);
      shards.push({ mesh, speed, baseY: y, baseX: x });
    }

    // Single large hero shard
    const heroGeo = new THREE.IcosahedronGeometry(10, 1);
    const hPos = heroGeo.attributes.position;
    for (let v = 0; v < hPos.count; v++) {
      hPos.setXYZ(v,
        hPos.getX(v) + (Math.random() - 0.5) * 0.9,
        hPos.getY(v) + (Math.random() - 0.5) * 0.9,
        hPos.getZ(v) + (Math.random() - 0.5) * 0.9,
      );
    }
    heroGeo.computeVertexNormals();
    const heroMat = new THREE.MeshBasicMaterial({
      color: 0x0040cc,
      wireframe: true,
      transparent: true,
      opacity: 0.04,
    });
    const hero = new THREE.Mesh(heroGeo, heroMat);
    hero.position.set(14, 2, -10);
    scene.add(hero);

    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
      mx = (e.clientX / W - 0.5);
      my = (e.clientY / H - 0.5);
    });

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.005;

      hero.rotation.x += 0.0005;
      hero.rotation.y += 0.0007;

      camera.position.x += (mx * 2 - camera.position.x) * 0.02;
      camera.position.y += (-my * 1.5 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      shards.forEach((s, i) => {
        s.mesh.rotation.x += s.speed.rx;
        s.mesh.rotation.y += s.speed.ry;
        s.mesh.position.y = s.baseY + Math.sin(t + i * 0.5) * 0.5;
        s.mesh.position.x = s.baseX + Math.cos(t * 0.4 + i * 0.3) * 0.25;
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
    { threshold: 0.06 }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ─── HAMBURGER MENU ─── */
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

/* ─── LANGUAGE TOGGLE ─── */
let currentLang = 'ja';

function toggleLang() {
  currentLang = currentLang === 'ja' ? 'en' : 'ja';
  const isEN = currentLang === 'en';

  document.querySelectorAll('#lang-btn').forEach(b => b.textContent = isEN ? 'JP' : 'EN');
  document.querySelectorAll('.mm-lang').forEach(b => b.textContent = isEN ? 'JP / EN' : 'EN / JP');

  document.querySelectorAll('[data-jp][data-en]').forEach(el => {
    const val = isEN ? el.dataset.en : el.dataset.jp;
    if (!val) return;
    el.innerHTML = val;
  });

  const placeholders = {
    '[name="name"]':    { jp: '山田 太郎',          en: 'Taro Yamada' },
    '[name="email"]':   { jp: 'hello@example.com',  en: 'hello@example.com' },
    '[name="company"]': { jp: '株式会社 Example',   en: 'Example Inc.' },
    '[name="message"]': { jp: 'ご相談内容をご記入ください…', en: 'Please describe your inquiry...' },
  };
  Object.entries(placeholders).forEach(([sel, t]) => {
    const el = document.querySelector(sel);
    if (el) el.placeholder = isEN ? t.en : t.jp;
  });

  document.documentElement.lang = currentLang;
}

/* ─── SCROLL PROGRESS ─── */
(function initProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
})();

/* ─── FORM SUBMISSION FEEDBACK ─── */
(function initForm() {
  const form   = document.getElementById('contact-form');
  const btn    = document.getElementById('submit-btn');
  const status = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    status.className = 'form-status';
    status.textContent = '';

    const isEN = currentLang === 'en';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
      });

      if (res.ok) {
        status.className = 'form-status success';
        status.textContent = isEN
          ? 'Thank you. We will be in touch shortly.'
          : 'お問い合わせありがとうございます。折り返しご連絡いたします。';
        form.reset();
      } else {
        throw new Error('submit failed');
      }
    } catch {
      status.className = 'form-status error';
      status.textContent = isEN
        ? 'Something went wrong. Please try again.'
        : '送信に失敗しました。もう一度お試しください。';
    } finally {
      btn.disabled = false;
    }
  });
})();
