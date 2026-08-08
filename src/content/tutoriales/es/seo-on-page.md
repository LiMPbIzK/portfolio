---
title: "SEO on-page"
description: "Meta tags, Open Graph, sitemap, robots.txt y JSON-LD para que la web aparezca bien en buscadores y redes."
date: 2026-08-07
order: 8
series: web-personal
part: 8
tags: ["seo", "open graph", "sitemap", "json-ld"]
draft: false
---

Una web estática ya parte con ventaja en SEO: es HTML real, sin JavaScript que Google tenga que ejecutar. Aun así, hay que darle los datos que los buscadores y las redes sociales esperan.

## Meta básica en el layout

Cada página define su `title` y `description`, y el layout los aplica:

```html
<title>{pageTitle}</title>
<meta name="description" content={pageDescription} />
<link rel="canonical" href={pageUrl} />
```

El `<title>` y la `description` son lo que se ve en los resultados de Google. La `canonical` evita contenido duplicado.

## Open Graph y Twitter Card

Esto es lo que dibuja la "tarjeta" cuando compartes el enlace en WhatsApp, LinkedIn o Twitter:

```html
<meta property="og:type" content="website" />
<meta property="og:title" content={pageTitle} />
<meta property="og:description" content={pageDescription} />
<meta property="og:url" content={pageUrl} />
<meta property="og:locale" content="es_ES" />
<meta property="og:image" content="https://tudominio.com/og.png" />
<meta name="twitter:card" content="summary_large_image" />
```

La imagen `og.png` (1200×630) es la miniatura que aparece al compartir.

## Sitemap con la integración de Astro

Con `site` definido en `astro.config.mjs`, la integración `@astrojs/sitemap` genera el sitemap automáticamente en cada build:

```js
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tudominio.com',
  integrations: [sitemap()],
});
```

## `robots.txt` dinámico

En vez de un archivo fijo, lo generé con una pequeña ruta para que la URL del sitemap se adapte a la base:

```ts
// src/pages/robots.txt.ts
export function GET() {
  const site = 'https://tudominio.com';
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
```

## Datos estructurados con JSON-LD

Un bloque en el `<head>` que le dice a Google quién soy, de forma explícita:

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Tu Nombre",
    "jobTitle": "Desarrollador",
    "url": "https://tudominio.com",
    "email": "mailto:hola@tudominio.com",
    "sameAs": [
      "https://github.com/tu-usuario",
      "https://www.linkedin.com/in/tu-usuario/"
    ]
  }
</script>
```

> Este JSON-LD se rellena desde variables de entorno, así el repo tampoco contiene aquí datos personales.

En la siguiente parte, subimos la web al mundo con GitHub Pages.
