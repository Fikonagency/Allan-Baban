(() => {
  const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav__toggle');
  const menu = nav.querySelector('.nav__menu');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sticky nav
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Split [data-words] paragraphs into word spans
  const wordParas = [];
  document.querySelectorAll('[data-words]').forEach((p) => {
    const html = p.innerHTML;
    const wrapped = html.split(/(\s+)/).map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      if (!tok) return '';
      return `<span class="w">${tok}</span>`;
    }).join('');
    p.innerHTML = wrapped;
    wordParas.push({ el: p, words: p.querySelectorAll('.w') });
  });

  // Reveal observer
  const revealEls = document.querySelectorAll('.reveal, .reveal-up, .slide-in-left, .slide-in-right');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => io.observe(el));

  // Hero load
  const hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(() => hero.classList.add('loaded'));

  // Scroll-progress driven word reveal
  if (!reduced) {
    let ticking = false;
    const updateProgress = () => {
      const vh = window.innerHeight;
      const start = vh * 0.78;
      const end = vh * 0.32;
      wordParas.forEach(({ el, words }) => {
        if (el.classList.contains('done')) return;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const span = (start - end) + r.height;
        const traveled = (start - r.top);
        const p = Math.max(0, Math.min(1, traveled / span));
        const reveal = Math.ceil(p * words.length);
        for (let i = 0; i < words.length; i++) {
          const should = i < reveal;
          if (should !== words[i].classList.contains('lit')) {
            words[i].classList.toggle('lit', should);
          }
        }
        if (p >= 1) el.classList.add('done');
      });
      ticking = false;
    };
    document.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  } else {
    wordParas.forEach(({ el }) => el.classList.add('done'));
  }

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox.querySelector('.lightbox__img');
  const closeBtn = lightbox.querySelector('.lightbox__close');
  const open = (src, alt) => {
    lightboxImg.src = src; lightboxImg.alt = alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 300);
  };
  document.querySelectorAll('.scrolly__fig, .project__media figure').forEach((fig) => {
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('role', 'button');
    const img = fig.querySelector('img');
    if (!img) return;
    const trigger = () => open(img.src, img.alt);
    fig.addEventListener('click', trigger);
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
    });
  });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === closeBtn) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) close();
  });

  // Year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Hero parallax
  if (!reduced) {
    const heroBg = document.querySelector('.hero__bg');
    if (heroBg) {
      document.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          heroBg.style.transform = `scale(1.06) translateY(${y * 0.15}px)`;
        }
      }, { passive: true });
    }
  }

  // === Apple-style scrollytelling for projects ===
  const scrollies = Array.from(document.querySelectorAll('.scrolly'));
  scrollies.forEach((sc) => {
    const stages = parseInt(sc.dataset.stages || '4', 10);
    sc.style.setProperty('--stages', stages);
    // Set first stage active immediately so something paints before scroll
    const firstFig = sc.querySelector('.scrolly__fig[data-stage="0"]');
    const firstPanel = sc.querySelector('.scrolly__panel[data-stage="0"]');
    const firstStep = sc.querySelector('.scrolly__progress-step[data-stage="0"]');
    if (firstFig) firstFig.classList.add('is-active');
    if (firstPanel) firstPanel.classList.add('is-active');
    if (firstStep) firstStep.classList.add('is-active');
  });

  if (!reduced && scrollies.length) {
    let scTicking = false;
    const updateScrollies = () => {
      const vh = window.innerHeight;
      scrollies.forEach((sc) => {
        const rect = sc.getBoundingClientRect();
        const total = sc.offsetHeight - vh;
        if (total <= 0) return;
        // progress 0..1 across the entire scrolly's scroll range
        const raw = -rect.top / total;
        const progress = Math.max(0, Math.min(0.9999, raw));
        const stages = parseInt(sc.dataset.stages || '4', 10);
        const idx = Math.min(stages - 1, Math.floor(progress * stages));

        const figs = sc.querySelectorAll('.scrolly__fig');
        const panels = sc.querySelectorAll('.scrolly__panel');
        const steps = sc.querySelectorAll('.scrolly__progress-step');

        const apply = (nodes) => {
          nodes.forEach((n, i) => {
            n.classList.toggle('is-active', i === idx);
            n.classList.toggle('is-past', i < idx);
          });
        };
        apply(figs);
        apply(panels);
        apply(steps);
      });
      scTicking = false;
    };
    document.addEventListener('scroll', () => {
      if (!scTicking) { requestAnimationFrame(updateScrollies); scTicking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateScrollies);
    updateScrollies();
  } else if (reduced) {
    // Show every panel/figure stacked when motion is reduced
    scrollies.forEach((sc) => {
      sc.querySelectorAll('.scrolly__fig, .scrolly__panel').forEach((n) => n.classList.add('is-active'));
    });
  }
})();
