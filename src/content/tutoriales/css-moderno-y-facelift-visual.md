---
title: "CSS moderno y facelift visual"
description: "Capas CSS, color-mix(), anidamiento, container queries, fuentes variables autohospedadas, header de cristal e iconos SVG."
date: 2026-08-07
order: 12
series: web-personal
part: 12
tags: ["css", "color-mix", "nesting", "container queries", "iconos"]
draft: false
---

Con la estructura y el contenido ya montados, llegó el momento de que la web dejara de ser funcional y empezara a tener carácter. Esta fase fue de pulido visual: CSS moderno, fuentes autohospedadas e iconos SVG que no pesan nada.

## Capas CSS con `@layer`

Los estilos compartidos viven en un único `global.css`. Para que todo el mundo se lleve bien, declaro el orden de mis capas:

```css
@layer base, components;
```

Dentro de `@layer base` van los estilos de elementos (cuerpo, títulos, enlaces) y en `components` los patrones reutilizables (botones, tarjetas, chips). La ventaja: sin importar el orden físico de las reglas, la capa `components` gana siempre a `base`. Adiós a los `!important` de emergencia.

## Colores derivados con `color-mix()`

En vez de definir cada tono a mano, los derivo del color de acento:

```css
--color-accent: #2563eb;
--color-accent-dark: color-mix(in srgb, var(--color-accent) 80%, #000);
--color-accent-soft: color-mix(in srgb, var(--color-accent) 12%, #fff);
```

Así, si mañana cambio el acento de azul a verde, toda la gama de suaves, oscuros y fondos de botón se recalcula sola. También se usa para las sombras de los botones:

```css
box-shadow: 0 8px 24px color-mix(in srgb, var(--color-accent) 40%, transparent);
```

## Anidamiento nativo

Ya no hace falta un preprocesador para escribir el CSS anidado:

```css
.project-card {
  /* estilos base */

  &:hover {
    box-shadow: var(--shadow-lg);
  }
}
```

El navegador entiende el `&` directamente. Se lee igual que el HTML, que es justo lo que quieres.

## Container queries

Cambié los media queries por tamaño de pantalla por *container queries* por tamaño de componente. Las tarjetas de proyectos forman una cuadrícula y ajustan su relleno según el espacio que les toca:

```css
.projects {
  container-type: inline-size;
}

@container (max-width: 360px) {
  .project-card {
    padding: var(--space-3);
  }
}
```

## Fuentes variables autohospedadas

Las Google Fonts obligan a pedir el CSS y las fuentes a un tercero. Las cambié por paquetes que se descargan en el build e incrustan el `@font-face` en el propio CSS:

```bash
npm install @fontsource-variable/inter @fontsource-variable/sora
```

```css
@import '@fontsource-variable/inter';
@import '@fontsource-variable/sora';
```

El navegador recibe el `woff2-variations` con el rango de pesos completo en un solo archivo y con `unicode-range` para cargar solo lo que usa. Ventaja extra: en modo oscuro no hay flash de fuente blanca sobre fondo negro, porque la fuente es local.

## Header de cristal

El header usa `backdrop-filter` para desenfocar lo que pasa por debajo y un fondo semitransparente:

```css
.site-header {
  position: sticky;
  top: 0;
  background-color: color-mix(in srgb, var(--color-surface) 82%, transparent);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}
```

Se mantiene visible al hacer scroll y el contenido lo atraviesa con ese efecto de cristal.

## Iconos SVG con `astro-icon`

En lugar de dibujar iconos a mano o usar una librería pesada, uso `astro-icon` con los paquetes de iconos oficiales:

```bash
npm install astro-icon @iconify-json/simple-icons @iconify-json/lucide
```

```js
// astro.config.mjs
import icon from 'astro-icon';
integrations: [
  icon({ include: { 'simple-icons': [...], lucide: [...] } }),
];
```

```astro
<Icon name="lucide:download" aria-hidden="true" />
```

Solo se incrustan en el HTML los SVG que se usan, nada de cargar una librería de iconos completa. El resultado fue una web con mucha más personalidad: gradientes, cristal, microinteracciones y un sistema de colores coherente.

En la siguiente parte, damos el salto al modo oscuro y a las transiciones de página.
