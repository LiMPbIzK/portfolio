---
title: "Layout y componentes"
description: "El layout base con cabecera, navegación responsive y pie de página reutilizables."
date: 2026-08-07
order: 5
series: web-personal
part: 5
tags: ["astro", "componentes", "layout", "responsive"]
draft: false
---

La clave de Astro es que puedes reutilizar la estructura. Hice tres piezas: un layout global y dos componentes (navegación y pie). Así cada página solo escribe su contenido.

## El layout `Base.astro`

Todo lo común de la página: `<head>` con meta, las fuentes, un enlace para saltar al contenido y el hueco donde cada página inserta lo suyo (`<slot />`):

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
    <a class="skip-link" href="#main">Saltar al contenido</a>
    <Nav />
    <main id="main">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

## La navegación `Nav.astro`

Un `header` fijo (sticky), con el nombre como marca y los enlaces. En móvil se convierte en un botón hamburguesa con un poco de JavaScript vanilla para abrir/cerrar el menú:

```astro
<header class="site-header">
  <div class="container nav-wrap">
    <a class="brand" href="/">{siteName}</a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" data-nav-toggle>
      <span class="visually-hidden">Abrir menú</span>
      <span class="nav-toggle-line"></span>
      <span class="nav-toggle-line"></span>
      <span class="nav-toggle-line"></span>
    </button>
    <nav id="nav-menu" aria-label="Principal">
      <ul>
        <li><a href="/">Inicio</a></li>
        <li><a href="/sobre-mi">Sobre mí</a></li>
        <li><a href="/proyectos">Proyectos</a></li>
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

Con `aria-expanded` y `aria-controls` el botón es comprensible para lectores de pantalla. El CSS con `@media (max-width: 720px)` oculta el menú y muestra el botón hamburguesa.

## El pie `Footer.astro`

El pie reutiliza los enlaces de redes desde variables de entorno (más sobre esto en la parte 6):

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

## ¿Por qué no duplicar el código en cada página?

Porque entonces, para cambiar el menú, tendrías que tocarlo en cuatro archivos. Con componentes, lo cambias una vez y todas las páginas se regeneran. Ese es el mayor ahorro de un SSG como Astro.

En la siguiente parte, el tema que más me preguntaron: cómo tener datos personales en la web **sin** que aparezcan en el repositorio público.
