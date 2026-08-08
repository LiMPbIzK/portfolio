---
title: "Scroll reveal y filtro de proyectos"
description: "Animar la aparición al hacer scroll con IntersectionObserver y añadir filtros por tecnología y orden a la lista de proyectos."
date: 2026-08-07
order: 14
series: web-personal
part: 14
tags: ["intersectionobserver", "scroll", "filtros", "proyectos", "javascript"]
draft: false
---

Última parte del pulido: los elementos aparecen con un pequeño movimiento al hacer scroll, y la lista de proyectos se puede filtrar y ordenar. Aquí salieron también los bugs más interesantes de toda la serie.

## Scroll reveal con IntersectionObserver

La idea es simple: los elementos con `data-reveal` empiezan invisibles y, cuando entran en el viewport, se les añade la clase `is-visible` que dispara la transición:

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

[data-reveal].is-visible {
  opacity: 1;
  transform: none;
}
```

El observador vigila todos los elementos marcados:

```ts
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

function observeAll() {
  for (const el of document.querySelectorAll('[data-reveal]')) {
    if (!el.classList.contains('is-visible')) observer.observe(el);
  }
}
```

Para que los elementos que se crean después (las tarjetas de proyectos llegan con `fetch`) también se animen, un `MutationObserver` vuelve a escanear el documento cuando cambia:

```ts
const mutationObserver = new MutationObserver(observeAll);
mutationObserver.observe(document.body, { childList: true, subtree: true });
```

Y con las transiciones de página, se re-observa en cada navegación:

```ts
document.addEventListener('astro:page-load', observeAll);
```

## No olvidar `prefers-reduced-motion`

Si al usuario le molesta el movimiento, todo se muestra directo:

```css
@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
  }
}
```

## El bug de las tarjetas "fantasma"

Primera lección: al principio puse `data-reveal` en cada tarjeta de proyecto. Pero las tarjetas se re-renderizan cada vez que filtras, y las nuevas quedaban a `opacity: 0` a la espera de que el observador las animara... que no siempre pasaba. Resultado: al pulsar un filtro, las tarjetas desaparecían y no volvían hasta cambiar de página.

La solución fue revelar una sola vez el contenedor `#projects`, y no cada tarjeta. Las tarjetas re-renderizadas se pintan siempre visibles:

```html
<div id="projects" data-reveal aria-live="polite"></div>
```

> Lección: el reveal es bueno para contenido estático. Para contenido que se re-renderiza por JavaScript, mejor aplicarlo al contenedor, o tendrás contenido invisible a la espera de un observador que ya cumplió su trabajo.

## Filtro por tecnología con chips

Los proyectos se cargan de la GitHub API. Con esa lista en memoria, los chips de filtro se generan dinámicamente:

```js
const languages = Array.from(new Set(repos.map((r) => r.language).filter(Boolean))).sort();

// chips: ["Todos", ...languages]
```

Cada chip es un botón con `aria-pressed` para indicar el estado seleccionado:

```js
button.addEventListener('click', () => {
  language = value;
  // actualizar aria-pressed en todos los chips
  render();
});
```

## Ordenación

Un `<select>` permite ordenar por recientes, estrellas o nombre. La misma función `render()` filtra y ordena sobre la lista en memoria, sin volver a llamar a la API:

```js
function render() {
  const filtered = repos.filter(
    (repo) => language === 'all' || repo.language === language
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'stars') return b.stargazers_count - a.stargazers_count;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  container.innerHTML = sorted.map(projectCard).join('');
}
```

## El bug del contenedor obsoleto

Segunda lección, esta vez con las View Transitions: al principio el script guardaba el elemento `#projects` en una variable **una sola vez**. Al navegar de vuelta a la página, el DOM se había sustituido y esa referencia apuntaba a un elemento ya no existente; los proyectos no cargaban.

La solución fue consultar el elemento fresco cada vez que se necesita:

```js
function getContainer() {
  return document.querySelector('#projects');
}
```

> Lección: con View Transitions, cualquier referencia a nodos del DOM debe consultarse en el momento de usarla, no guardarse al cargar el módulo.

Y una última recomendación: la carga debe dispararse tanto al cargar la página como tras `astro:after-swap` y `astro:page-load`, con un guard para no pintar dos veces si ya hay tarjetas.

Con esto, la web quedó completa: personal, con modo oscuro, animada, desplegada y documentada parte a parte. ¡Fin de la serie!
