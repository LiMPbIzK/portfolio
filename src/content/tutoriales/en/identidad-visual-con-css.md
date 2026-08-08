---
title: "Visual identity with modern CSS"
description: "Palette, typography and CSS variables: the design system from day one."
date: 2026-08-07
order: 4
series: web-personal
part: 4
tags: ["css", "design", "variables", "tokens"]
draft: false
---

Before laying out anything, I defined the visual identity. Doing it first prevents every component from inventing its own colors and margins: everything comes from a single place.

## The token system

A `src/styles/global.css` file with CSS variables (tokens) used across the whole site. I chose a light, sober style with blue as the accent:

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

Notice I use a constant spacing scale and radii: the result is that everything "fits" visually, even though each component lives in its own file.

## Typography

Two Google Fonts, one for headings and one for body text:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700&display=swap"
  rel="stylesheet"
/>
```

## Base styles

Alongside the tokens, a reset and accessibility utilities used across the whole site:

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

> The `.visually-hidden` is an accessibility classic: it hides an element visually but keeps it available for screen readers.

In the next part we build the header, the footer and the shared layout.
