---
title: "Identidad visual con CSS moderno"
description: "Paleta, tipografías y variables CSS: el sistema de diseño desde el primer día."
date: 2026-08-07
order: 4
series: web-personal
part: 4
tags: ["css", "diseño", "variables", "tokens"]
draft: false
---

Antes de maquetar, definí la identidad visual. Hacerlo primero evita que cada componente inventase sus propios colores y márgenes: todo sale de un único lugar.

## El sistema de tokens

Un archivo `src/styles/global.css` con variables CSS (tokens) que se usan en todo el sitio. Elegí un estilo claro y sobrio con un azul como acento:

```css
:root {
  --color-bg: #f7f9fc;
  --color-surface: #ffffff;
  --color-text: #1f2937;
  --color-text-muted: #4b5563;
  --color-accent: #2563eb;
  --color-accent-dark: #1d4ed8;
  --color-accent-soft: #dbeafe;
  --color-border: #e5e7eb;

  --font-heading: 'Sora', sans-serif;
  --font-body: 'Inter', sans-serif;

  --container-max: 1100px;
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-5: 3rem;
  --space-6: 4rem;

  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  --transition: 150ms ease;
}
```

Fíjate en que uso una escala de espaciado y radios constantes: el resultado es que todo "encaja" visualmente, aunque cada componente viva en su propio archivo.

## Tipografías

Dos fuentes de Google Fonts, una para títulos y otra para texto:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700&display=swap"
  rel="stylesheet"
/>
```

## Estilos base

Junto a los tokens, un reset y utilidades de accesibilidad que se usan en toda la web:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-body);
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-bg);
}

.container {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--space-3);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  clip: rect(0, 0, 0, 0);
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

> El `.visually-hidden` es un clásico de accesibilidad: oculta un elemento visualmente pero lo deja disponible para lectores de pantalla.

En la siguiente parte montamos la cabecera, el pie y el layout común.
