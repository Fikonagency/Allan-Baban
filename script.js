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
    const firstFig = sc.querySelector('.scrolly__fig[data-stage="0"]');
    const firstPanel = sc.querySelector('.scrolly__panel[data-stage="0"]');
    const firstStep = sc.querySelector('.scrolly__progress-step[data-stage="0"]');
    if (firstFig) firstFig.classList.add('is-active');
    if (firstPanel) firstPanel.classList.add('is-active');
    if (firstStep) firstStep.classList.add('is-active');
    sc.dataset.activeStage = '0';
  });

  if (!reduced && scrollies.length) {
    let scTicking = false;
    const updateScrollies = () => {
      const vh = window.innerHeight;
      scrollies.forEach((sc) => {
        const rect = sc.getBoundingClientRect();
        const total = sc.offsetHeight - vh;
        if (total <= 0) return;
        const raw = -rect.top / total;
        const progress = Math.max(0, Math.min(0.9999, raw));
        const stages = parseInt(sc.dataset.stages || '4', 10);
        const stageFloat = progress * stages;
        const idx = Math.min(stages - 1, Math.floor(stageFloat));
        const stageProgress = Math.max(0, Math.min(1, stageFloat - idx));

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
        sc.dataset.activeStage = String(idx);

        // Project-specific scroll-driven effects
        if (sc.classList.contains('scrolly--p1')) {
          // Stage 0: draw the section image left-to-right (0 -> 1 across stage)
          const draw = idx === 0 ? Math.min(1, stageProgress * 1.1) : 1;
          const main = sc.querySelector('.p1-main__img');
          if (main) main.style.setProperty('--p1-draw', draw.toFixed(3));
          // Insets visible per stage
          const insets = sc.querySelectorAll('.p1-inset');
          insets.forEach((el) => {
            const s = parseInt(el.dataset.stage, 10);
            el.classList.toggle('is-visible', idx >= s);
          });
        }

        if (sc.classList.contains('scrolly--p3')) {
          // Stage 0: 3D rotate over 360° as you scroll the stage
          const rot = idx === 0 ? stageProgress * 360 : (idx > 0 ? 360 : 0);
          const rotImg = sc.querySelector('.p3-rotate__img');
          if (rotImg) rotImg.style.setProperty('--p3-rot', rot.toFixed(1) + 'deg');
          // Stage 1 & 2: draw plans
          const drawFigs = sc.querySelectorAll('.p3-fig--draw');
          drawFigs.forEach((el) => {
            const s = parseInt(el.dataset.stage, 10);
            let draw;
            if (idx < s) draw = 0;
            else if (idx > s) draw = 1;
            else draw = Math.min(1, stageProgress * 1.05);
            el.style.setProperty('--p3-draw', draw.toFixed(3));
          });
        }
      });
      scTicking = false;
    };
    document.addEventListener('scroll', () => {
      if (!scTicking) { requestAnimationFrame(updateScrollies); scTicking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateScrollies);
    updateScrollies();
  } else if (reduced) {
    scrollies.forEach((sc) => {
      sc.querySelectorAll('.scrolly__fig, .scrolly__panel').forEach((n) => n.classList.add('is-active'));
      sc.querySelectorAll('.p1-inset').forEach((n) => n.classList.add('is-visible'));
    });
  }

  // === Background blueprint scroll-driven drawing ===
  const bp = document.getElementById('bp-bg');
  if (bp && !reduced) {
    const bpLines = Array.from(bp.querySelectorAll('.bp-line'));
    bpLines.forEach((p) => {
      try {
        const len = p.getTotalLength();
        p.style.setProperty('--len', len.toFixed(1));
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
      } catch (e) {}
    });
    const aboutEl = document.getElementById('about');
    const skillsEl = document.getElementById('skills');
    let bpTicking = false;
    const updateBP = () => {
      if (aboutEl && skillsEl) {
        const aboutTop = aboutEl.getBoundingClientRect().top + window.scrollY;
        const skillsBottom = skillsEl.getBoundingClientRect().bottom + window.scrollY;
        const total = skillsBottom - aboutTop;
        const y = window.scrollY + window.innerHeight * 0.5;
        const p = Math.max(0, Math.min(1, (y - aboutTop) / total));
        const inRange = y >= aboutTop - window.innerHeight * 0.3 && y <= skillsBottom + window.innerHeight * 0.1;
        bp.classList.toggle('bp-active', inRange);
        // Distribute drawing across all lines
        bpLines.forEach((line, i) => {
          const start = i / bpLines.length;
          const end = (i + 1) / bpLines.length;
          const lp = Math.max(0, Math.min(1, (p - start) / (end - start)));
          const len = parseFloat(line.style.getPropertyValue('--len') || '1000');
          line.style.strokeDashoffset = (len * (1 - lp)).toFixed(1);
        });
      }
      bpTicking = false;
    };
    document.addEventListener('scroll', () => {
      if (!bpTicking) { requestAnimationFrame(updateBP); bpTicking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateBP);
    updateBP();
  }

  // === Projects intro burst — observe and toggle ===
  const introEl = document.getElementById('projects-intro');
  if (introEl) {
    const introIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) introEl.classList.add('in');
      });
    }, { threshold: 0.35 });
    introIO.observe(introEl);
  }
})();
