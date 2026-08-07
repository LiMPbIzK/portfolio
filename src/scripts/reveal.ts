const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let observer: IntersectionObserver | null = null;

if (!reducedMotion && 'IntersectionObserver' in window) {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer?.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
}

function observeAll(): void {
  if (!observer) return;
  for (const el of document.querySelectorAll('[data-reveal]')) {
    if (!el.classList.contains('is-visible')) observer.observe(el);
  }
}

if (observer) {
  const mutationObserver = new MutationObserver(observeAll);
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('astro:page-load', observeAll);

observeAll();
