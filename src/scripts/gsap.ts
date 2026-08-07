import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

let mm: gsap.MatchMedia | null = null;

function killAll(): void {
  mm?.revert();
  mm = null;
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  gsap.globalTimeline.clear();
}

function init(): void {
  killAll();
  mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const heroTitle = document.querySelector<HTMLElement>('.hero-title');
    if (heroTitle) {
      const split = new SplitText(heroTitle, { type: 'words' });
      gsap.fromTo(
        split.words,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.06 }
      );
    }

    const heroBlock = document.querySelector<HTMLElement>(
      '.hero-role, .hero-bio, .hero-objective, .hero-actions'
    );
    if (heroBlock) {
      gsap.fromTo(
        '.hero-role, .hero-bio, .hero-objective, .hero-actions',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.12, delay: 0.35 }
      );
    }

    document.querySelectorAll<HTMLElement>('[data-gsap="parallax"]').forEach((el) => {
      gsap.fromTo(
        el,
        { yPercent: 0 },
        {
          yPercent: -5,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });
  });

  ScrollTrigger.refresh();
}

document.addEventListener('astro:after-swap', killAll);
document.addEventListener('astro:page-load', init);

init();
