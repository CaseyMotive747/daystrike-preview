(function () {
  const $ = (s, r = document) => r.querySelector(s);

  /* Dark theme only */

  /* Header on scroll */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Reveal */
  const targets = document.querySelectorAll('.section__head, .flavor, .split, .spec, .notfor, .join__inner, .faq__list');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    targets.forEach((t) => { t.classList.add('reveal'); io.observe(t); });
  }

})();
