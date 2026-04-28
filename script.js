(() => {
  const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav__toggle');
  const menu = nav.querySelector('.nav__menu');

  // Sticky nav background on scroll
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  };
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

  // Scroll reveal via IntersectionObserver
  const revealEls = document.querySelectorAll('.reveal-up, .reveal');
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

  // Year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Subtle parallax on hero bg
  const heroBg = document.querySelector('.hero__bg');
  if (heroBg && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroBg.style.transform = `scale(1.08) translateY(${y * 0.18}px)`;
      }
    }, { passive: true });
  }
})();
