---
title: "Dark mode with toggle and page transitions"
description: "Light/dark theme with a persistent toggle, per-theme color tokens, avoiding the flash and adding View Transitions between pages."
date: 2026-08-07
order: 13
series: web-personal
part: 13
tags: ["dark mode", "view transitions", "localstorage", "theme", "animation"]
draft: false
---

Dark mode isn't a luxury: a lot of people get eye strain from white backgrounds. This part adds a toggle that remembers your choice and, on the way, animates the navigation between pages.

## Color tokens per theme

In `global.css` the colors live in `:root` for the light theme, and an attribute selector overrides the variables for the dark one:

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

Since the whole design uses variables, changing `data-theme` on the `<html>` changes the whole site. `color-scheme` also makes native scrollbars and controls adapt.

## Applying the theme before the first paint

The trick is an inline script in the `<head>`, which runs before the browser paints anything. That way there's no wrong-theme flash (FOUC):

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

If there's no saved preference, it respects the operating system's.

## The toggle button

A button with sun and moon icons that switches the attribute and saves the choice:

```js
const current = document.documentElement.getAttribute('data-theme');
const next = current === 'dark' ? 'light' : 'dark';
document.documentElement.setAttribute('data-theme', next);
localStorage.setItem('theme', next);
```

The icons are shown or hidden with CSS depending on the theme:

```css
.theme-toggle .icon-sun { display: none; }
.theme-toggle .icon-moon { display: block; }

[data-theme='dark'] .theme-toggle .icon-sun { display: block; }
[data-theme='dark'] .theme-toggle .icon-moon { display: none; }
```

> Watch out: if the sun/moon rules live inside an Astro *scoped* component style, they won't work on the `<html>` or the injected icons. Put them in the global CSS.

## Re-applying the theme after navigation

With the page transitions (coming up next), the `data-theme` can get lost when the DOM is swapped. That's why, after every page change, I re-apply it:

```js
function applyTheme() {
  document.documentElement.setAttribute('data-theme', getTheme());
}

document.addEventListener('astro:after-swap', applyTheme);
document.addEventListener('astro:page-load', () => {
  applyTheme();
  // and re-bind the toggle, the mobile menu, etc.
});
```

## Page transitions with View Transitions

Astro brings native support: you only need to add the router in the layout:

```astro
---
import { ClientRouter } from 'astro:transitions';
---
<body>
  <ClientRouter />
</body>
```

With that, internal links navigate without a reload and the browser animates the transition. I customize the duration with the native pseudo-classes:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}
```

## The code blocks (Shiki) in dark mode

The code blocks are highlighted by Shiki at build time and their colors come **inline** in the HTML. For the dark theme to work, you have to override them with `!important`, because an inline color can only be beaten by an `!important`:

```css
[data-theme='dark'] .astro-code,
[data-theme='dark'] .astro-code span {
  color: var(--shiki-dark) !important;
}

[data-theme='dark'] .astro-code {
  background-color: var(--shiki-dark-bg) !important;
}
```

> Something we learned the hard way: using `data-astro-rerun` to "re-run" a script turns the `<script>` into an inline one and breaks Astro's type checking. Better to listen to `astro:page-load` and `astro:after-swap`.

In the next part, we animate the appearance of the elements and add filters to the projects.
