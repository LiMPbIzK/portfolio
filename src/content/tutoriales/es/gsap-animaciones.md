---
title: "Animaciones modernas con GSAP"
description: "Integrar GSAP en Astro: entrada del hero con SplitText, parallax con ScrollTrigger, coexistir con el reveal y sobrevivir a las View Transitions."
date: 2026-08-07
order: 15
series: web-personal
part: 15
tags: ["gsap", "animaciones", "splittext", "scrolltrigger", "parallax"]
draft: false
---

Para dar el último toque de modernidad, añadí GSAP (GreenSock Animation Platform). Desde la versión 3.13 todos los plugins, incluidos SplitText y ScrollTrigger, son gratis. Lo más interesante fue integrarlo con Astro sin que se rompieran las View Transitions ni el `prefers-reduced-motion`.

## Instalación

```bash
npm install gsap
```

GSAP es ESM y funciona de maravilla con el bundle de Vite/Astro.

## El script de animaciones

Creé `src/scripts/gsap.ts` con los plugins registrados y toda la lógica:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
```

## Respetar `prefers-reduced-motion`

Todo va dentro de `gsap.matchMedia()`, de modo que si el usuario prefiere menos movimiento, no se crea ninguna animación:

```ts
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // todas las animaciones aquí
});
```

## Entrada del hero con SplitText

El título de la portada se divide en palabras y cada una sube con un pequeño desfase (stagger):

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

Y el resto del hero (rol, bio, objetivo, botones) entra en cascada:

```ts
gsap.fromTo(
  '.hero-role, .hero-bio, .hero-objective, .hero-actions',
  { y: 24, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.12, delay: 0.35 }
);
```

> Para que no haya flash, estos elementos se ocultan con CSS solo cuando hay JavaScript (`html[data-js]`) y solo si no hay movimiento reducido. Así, con JS los anima GSAP, sin JS o con reduced-motion se ven directamente.

### El caso del texto con gradiente

El nombre tiene un degradado con `background-clip: text`. Al dividirlo, las palabras pasan a ser elementos propios, así que les doy el gradiente directamente:

```css
.hero-title .gradient-text .word {
  background-image: linear-gradient(120deg, var(--color-accent), #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

## Parallax con ScrollTrigger

Para un parallax sutil, marco las secciones en el HTML con `data-gsap="parallax"` y las animo con `scrub`, que enlaza el movimiento al scroll:

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

## Coexistir con el scroll reveal existente

Ya teníamos un scroll reveal con `IntersectionObserver` (`[data-reveal]`). La regla para que no se pisen:

- **El reveal se queda** para las secciones y las tarjetas (`[data-reveal]`).
- **GSAP anima el hero** (quité el `data-reveal` de sus elementos) y añade parallax a secciones marcadas que ya **no** llevan `data-reveal`.

Así, nadie compite por la propiedad `opacity` o `transform` del mismo elemento.

## El punto crítico: las View Transitions

Con el router de Astro, al navegar el DOM se sustituye. Si no limpiamos las instancias, los `ScrollTrigger` se quedan apuntando a elementos viejos y las animaciones se duplican. La solución es el ciclo kill/reinit:

```ts
function killAll() {
  mm?.revert();                          // revierte animaciones de la MatchMedia
  mm = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  gsap.globalTimeline.clear();
}

function init() {
  killAll();
  mm = gsap.matchMedia();
  // ... animaciones ...
  ScrollTrigger.refresh();
}

document.addEventListener('astro:after-swap', killAll);
document.addEventListener('astro:page-load', init);

init();
```

- `astro:after-swap` → se limpia lo que apuntaba al DOM anterior.
- `astro:page-load` → se inicializa de nuevo (dispara también en la carga inicial).
- `killAll()` al empezar `init()` hace el proceso idempotente: dar igual que el evento se dispare dos veces.

## Carga solo donde hace falta

El script se importa únicamente en las páginas con animaciones (inicio, sobre mí y tutoriales), no en todas:

```astro
<script>
  import '../scripts/gsap';
</script>
```

Astro lo convierte en un chunk compartido (~40 KB gzip) que el navegador cachea y que las páginas que no lo usan no descargan.

Con esto la web quedó redonda: animada con GSAP, accesible con `prefers-reduced-motion` y robusta frente a las transiciones de página. ¡Fin de la serie!
