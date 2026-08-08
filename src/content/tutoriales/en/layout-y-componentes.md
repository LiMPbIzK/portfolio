---
title: "Layout and components"
description: "The base layout with a reusable header, responsive navigation and footer."
date: 2026-08-07
order: 5
series: web-personal
part: 5
tags: ["astro", "components", "layout", "responsive"]
draft: false
---

The key to Astro is that you can reuse the structure. I made three pieces: a global layout and two components (navigation and footer). That way each page only writes its own content.

## The `Base.astro` layout

Everything common to the page: the `<head>` with meta tags, the fonts, a skip-to-content link and the slot where each page inserts its own content (`<slot />`):

```astro
---
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

const siteName = import.meta.env.SITE_NAME ?? 'Portfolio';
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{Astro.props.title ?? siteName}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <Nav />
    <main id="main">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

## The `Nav.astro` navigation

A sticky `header`, with the name as the brand and the links. On mobile it becomes a hamburger button with a bit of vanilla JavaScript to open/close the menu:

```astro
<header class="site-header">
  <div class="container nav-wrap">
    <a class="brand" href="/">{siteName}</a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" data-nav-toggle>
      <span class="visually-hidden">Open menu</span>
      <span class="nav-toggle-line"></span>
      <span class="nav-toggle-line"></span>
      <span class="nav-toggle-line"></span>
    </button>
    <nav id="nav-menu" aria-label="Main">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/sobre-mi">About</a></li>
        <li><a href="/proyectos">Projects</a></li>
      </ul>
    </nav>
  </div>
</header>

<script>
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('#nav-menu');

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    menu?.classList.toggle('open');
  });
</script>
```

With `aria-expanded` and `aria-controls` the button is understandable for screen readers. The CSS with `@media (max-width: 720px)` hides the menu and shows the hamburger button.

## The `Footer.astro` footer

The footer reuses the social links from environment variables (more on that in part 6):

```astro
---
const siteName = import.meta.env.SITE_NAME ?? 'Portfolio';
const githubUrl = import.meta.env.SITE_GITHUB_URL ?? '';
const linkedinUrl = import.meta.env.SITE_LINKEDIN_URL ?? '';
---

<footer>
  <div class="container">
    <p>© {new Date().getFullYear()} {siteName}</p>
    <ul>
      <li><a href={githubUrl}>GitHub</a></li>
      <li><a href={linkedinUrl}>LinkedIn</a></li>
    </ul>
  </div>
</footer>
```

## Why not duplicate the code in every page?

Because then, to change the menu, you would have to edit four files. With components, you change it once and every page is regenerated. That is the biggest win of an SSG like Astro.

In the next part, the topic I got asked about the most: how to have personal data on the website **without** it showing up in the public repository.
