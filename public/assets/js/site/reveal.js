// Progressive enhancement for [data-reveal] elements.
//
// Nothing is hidden until this file runs, so a failed load or a JS-less
// visitor still sees the whole page. Visitors who ask for reduced motion
// are never shown the animation at all.

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setup() {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;
  if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('reveal-on');

  targets.forEach((el) => {
    const group = [...(el.parentElement?.querySelectorAll('[data-reveal]') || [])];
    const position = Math.max(group.indexOf(el), 0);
    el.style.setProperty('--reveal-delay', `${Math.min(position, 5) * 70}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

  targets.forEach((el) => observer.observe(el));

  // If someone turns reduced motion on mid-session, stop hiding anything.
  prefersReducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    document.documentElement.classList.remove('reveal-on');
    targets.forEach((el) => el.classList.add('is-visible'));
  });
}

setup();
