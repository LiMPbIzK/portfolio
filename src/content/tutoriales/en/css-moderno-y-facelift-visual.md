---
title: "Modern CSS and visual facelift"
description: "CSS layers, color-mix(), nesting, container queries, self-hosted variable fonts, glass header and SVG icons."
date: 2026-08-07
order: 12
series: web-personal
part: 12
tags: ["css", "color-mix", "nesting", "container queries", "icons"]
draft: false
---

With the structure and content already in place, it was time for the site to stop being merely functional and start having character. This phase was all about visual polish: modern CSS, self-hosted fonts and SVG icons that weigh almost nothing.

## CSS layers with `@layer`

The shared styles live in a single `global.css`. So that everything plays nice together, I declare the order of my layers:

```css
@layer base, components;
```

Inside `@layer base` go the element styles (body, headings, links) and in `components` the reusable patterns (buttons, cards, chips). The advantage: no matter the physical order of the rules, the `components` layer always beats `base`. Goodbye emergency `!important`.

## Derived colors with `color-mix()`

Instead of defining every shade by hand, I derive them from the accent color:

```css
--color-accent: #2563eb;
--color-accent-dark: color-mix(in srgb, var(--color-accent) 80%, #000);
--color-accent-soft: color-mix(in srgb, var(--color-accent) 12%, #fff);
```

So if tomorrow I change the accent from blue to green, the whole range of soft tones, darks and button backgrounds recalculates by itself. It's also used for button shadows:

```css
box-shadow: 0 8px 24px color-mix(in srgb, var(--color-accent) 40%, transparent);
```

## Native nesting

You no longer need a preprocessor to write nested CSS:

```css
.project-card {
  /* base styles */

  &:hover {
    box-shadow: var(--shadow-lg);
  }
}
```

The browser understands `&` directly. It reads like the HTML, which is exactly what you want.

## Container queries

I swapped screen-size media queries for *container queries* based on component size. The project cards form a grid and adjust their padding depending on the space they get:

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

## Self-hosted variable fonts

Google Fonts force you to request the CSS and the fonts from a third party. I switched to packages that download at build time and embed the `@font-face` right in the CSS:

```bash
npm install @fontsource-variable/inter @fontsource-variable/sora
```

```css
@import '@fontsource-variable/inter';
@import '@fontsource-variable/sora';
```

The browser receives the `woff2-variations` with the full weight range in a single file and with `unicode-range` to load only what it uses. Bonus: in dark mode there's no white-font flash on a black background, because the font is local.

## Glass header

The header uses `backdrop-filter` to blur what passes underneath plus a semi-transparent background:

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

It stays visible while scrolling and content passes underneath with that glass effect.

## SVG icons with `astro-icon`

Instead of drawing icons by hand or using a heavy library, I use `astro-icon` with the official icon packages:

```bash
npm install astro-icon @iconify-json/simple-icons @iconify-json/lucide
```

```js
// astro.config.mjs
import icon from 'astro-icon';
integrations: [
  icon({ include: { 'simple-icons': [...], lucide: [...] } });
];
```

```astro
<Icon name="lucide:download" aria-hidden="true" />
```

Only the SVGs actually used get embedded in the HTML, no full icon library loaded. The result was a site with much more personality: gradients, glass, micro-interactions and a coherent color system.

In the next part, we jump to dark mode and page transitions.
