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

  // Split display headings into chars
  document.querySelectorAll('.display').forEach((el) => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((c, i) => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = c === ' ' ? ' ' : c;
      span.style.transitionDelay = `${i * 35}ms`;
      el.appendChild(span);
    });
  });

  // Split [data-words] paragraphs into word spans for scroll-driven reveal
  const wordParas = [];
  document.querySelectorAll('[data-words]').forEach((p) => {
    const html = p.innerHTML;
    // split by whitespace but preserve original spacing
    const wrapped = html.split(/(\s+)/).map((tok) => {
      if (/^\s+$/.test(tok)) return tok;
      if (!tok) return '';
      return `<span class="w">${tok}</span>`;
    }).join('');
    p.innerHTML = wrapped;
    const wordEls = p.querySelectorAll('.w');
    wordParas.push({ el: p, words: wordEls });
  });

  // Reveal observer for sections that enter
  const revealEls = document.querySelectorAll('.reveal, .slide-in-left, .slide-in-right, .display, [data-words]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => io.observe(el));

  // Scroll-progress driven word reveal: as you scroll the paragraph through
  // the viewport, words light up sequentially. Once paragraph is fully past
  // the activation line, all words are bright (handled by .in fallback above).
  if (!reduced) {
    let ticking = false;
    const updateProgress = () => {
      const vh = window.innerHeight;
      const activation = vh * 0.78;
      const finish = vh * 0.32;
      wordParas.forEach(({ el, words }) => {
        if (el.classList.contains('done')) return;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const start = activation;
        const end = finish;
        // progress 0 when paragraph top hits start, 1 when paragraph bottom passes end
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
  document.querySelectorAll('.project__media figure').forEach((fig) => {
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('role', 'button');
    const img = fig.querySelector('img');
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
})();
