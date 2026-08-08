---
title: "Modern animations with GSAP"
description: "Integrate GSAP in Astro: hero entrance with SplitText, parallax with ScrollTrigger, coexisting with the reveal and surviving the View Transitions."
date: 2026-08-07
order: 15
series: web-personal
part: 15
tags: ["gsap", "animations", "splittext", "scrolltrigger", "parallax"]
draft: false
---

For the final touch of modernity, I added GSAP (GreenSock Animation Platform). Since version 3.13 all the plugins, including SplitText and ScrollTrigger, are free. The most interesting part was integrating it with Astro without breaking the View Transitions or `prefers-reduced-motion`.

## Installation

```bash
npm install gsap
```

GSAP is ESM and works great with the Vite/Astro bundler.

## The animation script

I created `src/scripts/gsap.ts` with the plugins registered and all the logic:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
```

## Respecting `prefers-reduced-motion`

Everything goes inside `gsap.matchMedia()`, so if the user prefers less motion, no animation is created:

```ts
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // all the animations here
});
```

## Hero entrance with SplitText

The home title is split into words and each one rises with a slight stagger:

```ts
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
  const split = new SplitText(heroTitle, { type: 'words' });
  gsap.fromTo(
    split.words,
    { yPercent: 110, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.06 }
  );
}
```

And the rest of the hero (role, bio, objective, buttons) enters in cascade:

```ts
gsap.fromTo(
  '.hero-role, .hero-bio, .hero-objective, .hero-actions',
  { y: 24, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.12, delay: 0.35 }
);
```

> To avoid a flash, these elements are hidden with CSS only when there is JavaScript (`html[data-js]`) and only if there's no reduced motion. So with JS, GSAP animates them; without JS or with reduced motion, they show directly.

### The gradient text case

The name has a gradient with `background-clip: text`. When split, the words become their own elements, so I give them the gradient directly:

```css
.hero-title .gradient-text .word {
  background-image: linear-gradient(120deg, var(--color-accent), #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

## Parallax with ScrollTrigger

For a subtle parallax, I mark the sections in the HTML with `data-gsap="parallax"` and animate them with `scrub`, which links the movement to the scroll:

```ts
document.querySelectorAll('[data-gsap="parallax"]').forEach((el) => {
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
```

```html
<section class="skills" data-gsap="parallax">...</section>
```

## Coexisting with the existing scroll reveal

We already had a scroll reveal with `IntersectionObserver` (`[data-reveal]`). The rule so they don't step on each other:

- **The reveal stays** for the sections and cards (`[data-reveal]`).
- **GSAP animates the hero** (I removed the `data-reveal` from its elements) and adds parallax to marked sections that no longer carry `data-reveal`.

That way nobody competes for the same element's `opacity` or `transform`.

## The critical part: View Transitions

With Astro's router, the DOM is replaced when navigating. If we don't clean up the instances, the `ScrollTrigger`s stay pointing at old elements and the animations duplicate. The fix is the kill/reinit cycle:

```ts
function killAll() {
  mm?.revert();                          // reverts the MatchMedia animations
  mm = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  gsap.globalTimeline.clear();
}

function init() {
  killAll();
  mm = gsap.matchMedia();
  // ... animations ...
  ScrollTrigger.refresh();
}

document.addEventListener('astro:after-swap', killAll);
document.addEventListener('astro:page-load', init);

init();
```

- `astro:after-swap` → whatever pointed at the previous DOM is cleaned up.
- `astro:page-load` → it initializes again (it also fires on initial load).
- `killAll()` at the start of `init()` makes the process idempotent: it doesn't matter if the event fires twice.

## Loading only where it's needed

The script is imported only on the pages with animations (home, about and tutorials), not on all of them:

```astro
<script>
  import '../scripts/gsap';
</script>
```

Astro turns it into a shared chunk (~40 KB gzip) that the browser caches and that the pages that don't use it never download.

With this, the site was complete: animated with GSAP, accessible with `prefers-reduced-motion` and robust against page transitions. End of the series!
