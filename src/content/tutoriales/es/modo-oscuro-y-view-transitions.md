---
title: "Modo oscuro con toggle y transiciones de página"
description: "Tema claro/oscuro con toggle persistente, tokens de color por tema, evitar el flash y añadir View Transitions entre páginas."
date: 2026-08-07
order: 13
series: web-personal
part: 13
tags: ["modo oscuro", "view transitions", "localstorage", "tema", "anima"]
draft: false
---

El modo oscuro no es un lujo: a mucha gente le duele la vista con fondos blancos. Esta parte añade un toggle que recuerda tu elección y, de paso, anima la navegación entre páginas.

## Tokens de color por tema

En `global.css` los colores viven en `:root` para el tema claro, y un selector de atributo sobreescribe las variables para el oscuro:

```css
:root {
  --color-bg: #f7f9fc;
  --color-text: #1f2937;
  color-scheme: light;
}

[data-theme='dark'] {
  --color-bg: #0b1220;
  --color-text: #e5e9f0;
  color-scheme: dark;
}
```

Como todo el diseño usa variables, basta con cambiar `data-theme` en el `<html>` para cambiar toda la web. `color-scheme` además hace que scrollbars y controles nativos se adapten.

## Aplicar el tema antes del primer pintado

El truco está en un script inline en el `<head>`, que se ejecuta antes de que el navegador pinte nada. Así no hay flash de tema equivocado (FOUC):

```html
<script is:inline>
  (function () {
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch {}
    var prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch {}
  })();
</script>
```

Si no hay preferencia guardada, respeta la del sistema operativo.

## El botón de toggle

Un botón con iconos de sol y luna que conmuta el atributo y guarda la elección:

```js
const current = document.documentElement.getAttribute('data-theme');
const next = current === 'dark' ? 'light' : 'dark';
document.documentElement.setAttribute('data-theme', next);
localStorage.setItem('theme', next);
```

Los iconos se muestran u ocultan con CSS según el tema:

```css
.theme-toggle .icon-sun { display: none; }
.theme-toggle .icon-moon { display: block; }

[data-theme='dark'] .theme-toggle .icon-sun { display: block; }
[data-theme='dark'] .theme-toggle .icon-moon { display: none; }
```

> Cuida esto: si las reglas de sol/luna van dentro de un componente con estilos *scopeados* de Astro, no funcionan sobre el `<html>` o los iconos inyectados. Ponlas en el CSS global.

## Re-aplicar el tema tras la navegación

Con las transiciones de página (que vienen ahora), el `data-theme` puede perderse al intercambiar el DOM. Por eso, tras cada cambio de página, vuelvo a aplicarlo:

```js
function applyTheme() {
  document.documentElement.setAttribute('data-theme', getTheme());
}

document.addEventListener('astro:after-swap', applyTheme);
document.addEventListener('astro:page-load', () => {
  applyTheme();
  // y re-enlazar el toggle, el menú móvil, etc.
});
```

## Transiciones de página con View Transitions

Astro trae el soporte nativo: solo hay que añadir el router en el layout:

```astro
---
import { ClientRouter } from 'astro:transitions';
---
<body>
  <ClientRouter />
</body>
```

Con eso, los enlaces internos se navegan sin recargar y el navegador anima la transición. Personalizo la duración con las pseudoclases nativas:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}
```

## El bloqueo de código (Shiki) en oscuro

Los bloques de código se pintan con Shiki en el build y sus colores vienen **inline** en el HTML. Para que el tema oscuro funcione, hay que sobreescribirlos con `!important`, porque un color inline solo se vence con un `!important`:

```css
[data-theme='dark'] .astro-code,
[data-theme='dark'] .astro-code span {
  color: var(--shiki-dark) !important;
}

[data-theme='dark'] .astro-code {
  background-color: var(--shiki-dark-bg) !important;
}
```

> Algo que aprendimos por las malas: usar `data-astro-rerun` para "volver a ejecutar" un script convierte el `<script>` en inline y rompe el chequeo de tipos de Astro. Mejor escuchar `astro:page-load` y `astro:after-swap`.

En la siguiente parte, animamos la aparición de los elementos y añadimos filtros a los proyectos.
