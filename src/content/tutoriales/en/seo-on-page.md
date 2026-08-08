---
title: "On-page SEO"
description: "Meta tags, Open Graph, sitemap, robots.txt and JSON-LD so the site shows up well in search engines and social networks."
date: 2026-08-07
order: 8
series: web-personal
part: 8
tags: ["seo", "open graph", "sitemap", "json-ld"]
draft: false
---

A static site already starts with an SEO advantage: it's real HTML, no JavaScript for Google to execute. Still, you have to give search engines and social networks the data they expect.

## Basic meta in the layout

Each page defines its `title` and `description`, and the layout applies them:

```html
<title>{pageTitle}</title>
<meta name="description" content={pageDescription} />
<link rel="canonical" href={pageUrl} />
```

The `<title>` and the `description` are what shows up in Google results. The `canonical` avoids duplicate content.

## Open Graph and Twitter Card

This is what draws the "card" when you share the link on WhatsApp, LinkedIn or Twitter:

```html
<meta property="og:type" content="website" />
<meta property="og:title" content={pageTitle} />
<meta property="og:description" content={pageDescription} />
<meta property="og:url" content={pageUrl} />
<meta property="og:locale" content="es_ES" />
<meta property="og:image" content="https://yourdomain.com/og.png" />
<meta name="twitter:card" content="summary_large_image" />
```

The `og.png` image (1200×630) is the thumbnail that appears when sharing.

## Sitemap with the Astro integration

With `site` defined in `astro.config.mjs`, the `@astrojs/sitemap` integration generates the sitemap automatically on every build:

```js
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yourdomain.com',
  integrations: [sitemap()],
});
```

## Dynamic `robots.txt`

Instead of a fixed file, I generated it with a small route so the sitemap URL adapts to the base:

```ts
// src/pages/robots.txt.ts
export function GET() {
  const site = 'https://yourdomain.com';
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
```

## Structured data with JSON-LD

A block in the `<head>` that explicitly tells Google who I am:

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Your Name",
    "jobTitle": "Developer",
    "url": "https://yourdomain.com",
    "email": "mailto:hello@yourdomain.com",
    "sameAs": [
      "https://github.com/your-user",
      "https://www.linkedin.com/in/your-user/"
    ]
  }
</script>
```

> This JSON-LD is filled from environment variables, so the repo doesn't contain personal data here either.

In the next part, we take the site out into the world with GitHub Pages.
