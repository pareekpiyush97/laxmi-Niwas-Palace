/* ==========================================================
   LAXMI NIWAS PALACE — cinematic interaction layer v2
   GSAP + ScrollTrigger + Lenis (free CDN builds only).
   Awwwards-pattern motion: counter preloader, char-split
   title reveals, hero parallax, venetian page wipe.
   ========================================================== */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const MOTION = hasGSAP && !prefersReduced;
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (!MOTION) document.documentElement.classList.add('no-motion');

  /* ---------------- Lenis smooth scroll (single RAF driver) ---------------- */
  let lenis = null;
  if (MOTION && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true, autoRaf: false });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  }

  /* ---------------- Splitters (own implementation, no paid plugins) ---------------- */
  function splitWords(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/\s+/).forEach((w, i, arr) => {
      const line = document.createElement('span');
      line.className = 'mask-line';
      line.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = w;
      line.appendChild(inner);
      el.appendChild(line);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return el.querySelectorAll('.mask-line > span');
  }
  function splitChars(el) {
    const text = el.textContent;
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    text.split(/(\s+)/).forEach((part) => {
      if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
      const wd = document.createElement('span');
      wd.className = 'wd';
      [...part].forEach((c) => {
        const ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = c;
        wd.appendChild(ch);
      });
      el.appendChild(wd);
    });
    return el.querySelectorAll('.ch');
  }

  /* ---------------- Custom cursor ---------------- */
  function initCursor() {
    if (isTouch || !MOTION) return;
    document.body.classList.add('has-custom-cursor');
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
    window.addEventListener('mouseleave', () => { dot.classList.add('is-hidden'); ring.classList.add('is-hidden'); });
    window.addEventListener('mouseenter', () => { dot.classList.remove('is-hidden'); ring.classList.remove('is-hidden'); });
    (function tick() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    })();
    document.querySelectorAll('a, button, .bento__item, .trio__item').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  function initMagnetic() {
    if (isTouch || !MOTION) return;
    document.querySelectorAll('.magnetic, .masthead__menu-btn').forEach((el) => {
      const strength = 20;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left - r.width / 2) / r.width) * strength;
        const y = ((e.clientY - r.top - r.height / 2) / r.height) * strength;
        gsap.to(el, { x, y, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
      });
    });
  }

  /* ---------------- Masthead: solid bar after leaving the hero ---------------- */
  function initMasthead() {
    const head = document.querySelector('.masthead');
    if (!head) return;
    const onScroll = (y) => head.classList.toggle('is-scrolled', y > 60);
    if (lenis) lenis.on('scroll', (e) => onScroll(e.scroll));
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    onScroll(window.scrollY);
  }

  /* ---------------- Full-screen nav overlay ----------------
     Links reveal via pure CSS transition-delay stagger; only the
     overlay clip-path is GSAP-driven so the two never race. */
  function initNav() {
    const btn = document.getElementById('menuToggle');
    const overlay = document.getElementById('navOverlay');
    if (!btn || !overlay) return;
    let open = false;

    function openNav() {
      open = true;
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (MOTION) {
        gsap.killTweensOf(overlay);
        gsap.set(overlay, { clipPath: 'inset(0% 0% 100% 0%)' });
        overlay.classList.add('is-open');
        gsap.to(overlay, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.65, ease: 'power4.inOut' });
      } else {
        overlay.classList.add('is-open');
      }
    }
    function closeNav() {
      open = false;
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (MOTION) {
        gsap.killTweensOf(overlay);
        gsap.to(overlay, {
          clipPath: 'inset(0% 0% 100% 0%)', duration: 0.55, ease: 'power3.inOut',
          onComplete: () => overlay.classList.remove('is-open'),
        });
      } else {
        overlay.classList.remove('is-open');
      }
    }
    btn.addEventListener('click', () => (open ? closeNav() : openNav()));
    overlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeNav()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) closeNav(); });
  }

  /* ---------------- Scroll reveals ---------------- */
  function initReveals() {
    if (!MOTION) return;
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const type = el.getAttribute('data-reveal');
      const vars = { opacity: 1, duration: 1, ease: 'power3.out' };
      if (type === 'up') vars.y = 0;
      if (type === 'scale') vars.scale = 1;
      gsap.to(el, { ...vars, scrollTrigger: { trigger: el, start: 'top 88%' }, delay: parseFloat(el.getAttribute('data-delay') || 0) });
    });
    document.querySelectorAll('[data-reveal-group]').forEach((group) => {
      const items = group.children;
      gsap.set(items, { opacity: 0, y: 34 });
      gsap.to(items, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.09, scrollTrigger: { trigger: group, start: 'top 85%' } });
    });
    document.querySelectorAll('.js-mask').forEach((el) => {
      const spans = splitWords(el);
      gsap.set(spans, { yPercent: 110 });
      gsap.to(spans, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
    /* hero media parallax — image is 112% tall so edges never show */
    document.querySelectorAll('.cine').forEach((sec) => {
      const img = sec.querySelector('.cine__media img');
      if (!img || !window.ScrollTrigger) return;
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ---------------- Hero entrance (all pages) ---------------- */
  let heroPlayed = false;
  function playHeroIn() {
    if (heroPlayed) return;
    heroPlayed = true;
    const cine = document.querySelector('.cine');
    if (!cine || !MOTION) return;
    const small = window.innerWidth < 640;
    const title = cine.querySelector('.cine__title');
    const img = cine.querySelector('.cine__media img');
    const rest = cine.querySelectorAll('.cine__eyebrow, .cine__sub, .cine__lede, .cine__rule, .cine__scrollcue');
    const tl = gsap.timeline();
    if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: small ? 1.15 : 1.6, ease: 'power3.out' }, 0);
    if (title) {
      title.setAttribute('aria-label', title.textContent.trim().replace(/\s+/g, ' '));
      const lineSpans = title.querySelectorAll('.ln > span');
      let chars = [];
      lineSpans.forEach((s) => { chars = chars.concat([...splitChars(s)]); });
      gsap.set(lineSpans, { y: 0, yPercent: 0 });
      gsap.set(chars, { yPercent: 120 });
      tl.to(chars, {
        yPercent: 0, duration: small ? 0.75 : 0.9, ease: 'power4.out', stagger: small ? 0.015 : 0.02,
        onComplete: () => gsap.set(chars, { clearProps: 'transform' }),
      }, 0.15);
    }
    tl.to(rest, { opacity: 1, y: 0, duration: small ? 0.65 : 0.8, stagger: 0.08, ease: 'power3.out' }, small ? 0.4 : 0.55);
  }

  /* ---------------- Intro preloader (home only) ----------------
     Typographic counter 000→100 with cycling captions and a gold
     progress hairline, then the whole stage lifts like a curtain.
     Runs in full once per session; return visits get a fast lift. */
  function hasSeenIntro() {
    try { return sessionStorage.getItem('lnp-intro') === '1'; } catch (e) { return false; }
  }
  function markIntroSeen() {
    try { sessionStorage.setItem('lnp-intro', '1'); } catch (e) { /* private mode */ }
  }
  function initIntro() {
    const intro = document.querySelector('.intro');
    if (!intro) return false;
    if (!MOTION) { intro.style.display = 'none'; return false; }
    document.body.classList.add('is-introing');

    const finish = () => {
      gsap.set(intro, { display: 'none' });
      document.body.classList.remove('is-introing');
    };

    if (hasSeenIntro()) {
      gsap.timeline({ onComplete: finish })
        .to(intro, { yPercent: -100, duration: 0.85, ease: 'power4.inOut', delay: 0.15 })
        .add(playHeroIn, 0.35);
      return true;
    }

    const count = intro.querySelector('#introCount');
    const bar = intro.querySelector('.intro__bar span');
    const word = intro.querySelector('.intro__word');
    const isSmall = window.innerWidth < 640;
    const words = isSmall
      ? ['Bikaner, Rajasthan', 'Red Sandstone & Gold', 'Laxmi Niwas Palace']
      : ['Bikaner, Rajasthan', 'Est. Early 20th Century', 'Red Sandstone & Gold', 'Laxmi Niwas Palace'];
    const state = { v: 0 };
    const D = isSmall ? 1.9 : 2.6; // counter duration — quicker on phones

    const tl = gsap.timeline({
      onComplete: () => { markIntroSeen(); finish(); },
    });
    // 3-digit zero padding keeps the centered counter at a constant
    // width, so the number never wobbles sideways while counting
    tl.to(state, {
      v: 100, duration: D, ease: 'power2.inOut',
      onUpdate: () => { count.textContent = String(Math.round(state.v)).padStart(3, '0'); },
    }, 0);
    // scaleX, not width — width re-runs layout every frame and janks on phones
    tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: D, ease: 'power2.inOut' }, 0);
    const per = D / words.length;
    words.forEach((w, i) => {
      tl.call(() => { word.textContent = w; }, null, i * per);
      tl.fromTo(word, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: per * 0.4, ease: 'power2.out' }, i * per);
      if (i < words.length - 1) tl.to(word, { opacity: 0, y: -8, duration: per * 0.3, ease: 'power2.in' }, i * per + per * 0.65);
    });
    tl.to(intro, { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, D + 0.25);
    tl.add(playHeroIn, D + 0.55);
    return true;
  }

  /* ---------------- Page wipe (inner-page nav transition) ---------------- */
  function initPageWipe() {
    const wipe = document.getElementById('pageWipe');
    let chained = false;
    if (!wipe) return chained;
    const bars = wipe.querySelectorAll('.page-wipe__bar');
    const brand = wipe.querySelector('.page-wipe__brand');
    const isHome = document.body.getAttribute('data-page') === 'index';

    if (!MOTION) { wipe.style.display = 'none'; return chained; }

    const small = window.innerWidth < 640;

    if (isHome) {
      gsap.set(bars, { scaleY: 0 });
      wipe.style.display = 'none';
    } else {
      chained = true;
      gsap.set(bars, { scaleY: 1, transformOrigin: 'bottom' });
      gsap.set(brand, { opacity: 0 });
      gsap.timeline()
        .to(brand, { opacity: 1, duration: small ? 0.25 : 0.3 })
        .to(brand, { opacity: 0, duration: small ? 0.25 : 0.3 }, small ? '+=0.12' : '+=0.25')
        .to(bars, { scaleY: 0, duration: small ? 0.55 : 0.7, ease: 'power3.inOut', stagger: small ? 0.04 : 0.05 }, small ? '-=0.35' : '-=0.5')
        .set(wipe, { display: 'none' })
        .add(playHeroIn, '-=0.55');
    }

    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || a.target === '_blank') return;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        gsap.set(wipe, { display: 'block' });
        gsap.set(bars, { scaleY: 0, transformOrigin: 'bottom' });
        gsap.set(brand, { opacity: 0 });
        gsap.timeline({ onComplete: () => { window.location.href = href; } })
          .to(bars, { scaleY: 1, duration: small ? 0.5 : 0.6, ease: 'power3.inOut', stagger: small ? 0.04 : 0.045 })
          .to(brand, { opacity: 1, duration: 0.25 }, '-=0.2');
      });
    });
    return chained;
  }

  /* ---------------- bfcache restore (mobile back-swipe) ----------------
     Tapping a link plays the exit wipe, then navigates. If the user
     comes back via the back gesture, the browser restores this page
     from the back/forward cache EXACTLY as it left — black bars still
     covering the screen. Reset every overlay on restore. */
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    const wipe = document.getElementById('pageWipe');
    if (wipe) {
      if (hasGSAP) gsap.set(wipe.querySelectorAll('.page-wipe__bar'), { scaleY: 0 });
      wipe.style.display = 'none';
    }
    const intro = document.querySelector('.intro');
    if (intro) intro.style.display = 'none';
    document.body.classList.remove('is-introing');
    document.body.style.overflow = '';
    const overlay = document.getElementById('navOverlay');
    if (overlay) overlay.classList.remove('is-open');
    const btn = document.getElementById('menuToggle');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    playHeroIn(); // no-op if the hero already revealed before leaving
  });

  /* ---------------- Bento gallery: filters + reveal + lightbox ---------------- */
  function initBento() {
    const grid = document.querySelector('.bento');
    if (!grid) return;
    const items = [...grid.querySelectorAll('.bento__item')];
    const filters = document.querySelectorAll('.gallery-filters button');

    if (MOTION) {
      gsap.set(items, { opacity: 0, y: 30 });
      if (window.ScrollTrigger) {
        ScrollTrigger.batch(items, {
          start: 'top 92%',
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07 }),
        });
      } else {
        gsap.to(items, { opacity: 1, y: 0, duration: 0.7, stagger: 0.05 });
      }
    }

    filters.forEach((btn) => btn.addEventListener('click', () => {
      filters.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const cat = btn.getAttribute('data-filter');
      items.forEach((item) => {
        const show = cat === 'all' || item.getAttribute('data-category') === cat;
        if (MOTION) {
          if (show) { item.classList.remove('is-hidden'); gsap.fromTo(item, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }); }
          else gsap.to(item, { opacity: 0, scale: 0.96, duration: 0.28, ease: 'power2.in', onComplete: () => item.classList.add('is-hidden') });
        } else item.classList.toggle('is-hidden', !show);
      });
    }));

    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const lbImg = lightbox.querySelector('img');
    const lbCaption = lightbox.querySelector('.lightbox__caption');
    let current = 0, visible = items;
    function openAt(index) {
      visible = items.filter((it) => !it.classList.contains('is-hidden'));
      current = visible.indexOf(items[index]) >= 0 ? visible.indexOf(items[index]) : 0;
      show();
      lightbox.classList.add('is-open');
    }
    function show() {
      const img = visible[current].querySelector('img');
      lbImg.src = img.src; lbImg.alt = img.alt; lbCaption.textContent = img.alt;
    }
    items.forEach((item, i) => item.addEventListener('click', () => openAt(i)));
    lightbox.querySelector('.lightbox__close').addEventListener('click', () => lightbox.classList.remove('is-open'));
    lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', () => { current = (current - 1 + visible.length) % visible.length; show(); });
    lightbox.querySelector('.lightbox__nav--next').addEventListener('click', () => { current = (current + 1) % visible.length; show(); });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('is-open'); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') lightbox.classList.remove('is-open');
      if (e.key === 'ArrowRight') { current = (current + 1) % visible.length; show(); }
      if (e.key === 'ArrowLeft') { current = (current - 1 + visible.length) % visible.length; show(); }
    });
  }

  /* ---------------- Film-strip: vertical wheel scrolls the strip ---------------- */
  function initScrub() {
    document.querySelectorAll('.scrub').forEach((strip) => {
      strip.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        if (strip.scrollWidth <= strip.clientWidth) return;
        const atStart = strip.scrollLeft <= 0 && e.deltaY < 0;
        const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1 && e.deltaY > 0;
        if (atStart || atEnd) return;
        e.preventDefault();
        strip.scrollLeft += e.deltaY;
      }, { passive: false });
    });
  }

  /* ---------------- Dining menu tabs ---------------- */
  function initMenuTabs() {
    const tabs = document.querySelectorAll('.menu-tabs button');
    if (!tabs.length) return;
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.querySelectorAll('.menu-panel').forEach((p) => p.classList.remove('is-active'));
      const panel = document.getElementById(tab.getAttribute('data-panel'));
      if (panel) {
        panel.classList.add('is-active');
        if (MOTION) gsap.fromTo(panel, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
      }
    }));
  }

  /* ---------------- Forms (client-side demo) ---------------- */
  function initForms() {
    document.querySelectorAll('form[data-form]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const status = form.querySelector('.form-status');
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.setAttribute('disabled', 'true'); btn.style.opacity = '.6'; }
        if (status) { status.textContent = 'Sending your request…'; status.removeAttribute('data-state'); }
        setTimeout(() => {
          if (status) { status.textContent = 'Thank you — our reservations team will reach out within 24 hours.'; status.setAttribute('data-state', 'success'); }
          if (btn) { btn.removeAttribute('disabled'); btn.style.opacity = ''; }
          form.reset();
        }, 900);
      });
    });
  }

  /* ---------------- init ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initMagnetic();
    initMasthead();
    initNav();
    initScrub();
    initBento();
    initMenuTabs();
    initForms();
    initReveals();

    const introRan = initIntro();
    const wipeChained = initPageWipe();
    if (!introRan && !wipeChained) playHeroIn();
  });
})();
