---
title: "LeXi: Astro + Svelte skeleton and the theme system"
description: "Scaffolding the Astro project by hand, adding Svelte 5, Cloudflare Pages with wrangler.json and a theme switcher built with CSS custom properties."
date: 2026-08-15
order: 2
series: proyecto-lexi
part: 2
tags: ["astro", "svelte", "pwa", "cloudflare", "css", "themes"]
draft: false
---

In milestone 1 we set up the project skeleton. Instead of `npm create astro` I decided to **create the `package.json` by hand**: the folder already had READMEs, banners and `AGENTS.md`, and I wanted full control over every dependency.

## Versions and the dependency clash

The first hurdle was matching versions. The combination that worked (and that I never touched again):

```json
{
  "astro": "^5.0.0",
  "@astrojs/svelte": "^7.0.5",
  "@vite-pwa/astro": "^1.2.0",
  "svelte": "^5.1.16",
  "wrangler": "^4.0.0"
}
```

> Lesson: **the newest versions do not always fit together.** `@astrojs/svelte` 9 required Astro 7 and 8 required Astro 6; with Astro 5 the compatible version is 7.0.5. Finding a set that respects peer dependencies saves days of headaches.

## The configuration

`astro.config.mjs` with static output, the real domain and the Svelte + PWA integrations:

```js
export default defineConfig({
  output: 'static',
  site: 'https://lexi.fmartinezgarcia.com',
  integrations: [
    svelte(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: { /* name, 192/512/maskable icons, theme_color… */ },
      workbox: { /* precache + runtimeCaching for static.arasaac.org */ }
    })
  ]
});
```

And `wrangler.json` with the Pages configuration: `dist` output, `compatibility_date`, `nodejs_compat` flag and the bindings we will add later.

> Lesson: **`@vite-pwa/astro` does not export `VitePWA`.** You configure it with the integration's default export, not with the Vite plugin. Another detail: the `wrangler.json` fields change between versions; `pages_project` is invalid and `migrations_dir` goes inside each `d1_databases` entry.

## The theme system

I defined it with **CSS custom properties** and a `[data-theme]` attribute on `<html>`, so adding a new theme does not touch any component:

```css
:root {
  --radius: 12px;
  --tile-gap: 0.75rem;
}

[data-theme="neutral"] { --primary: #2563eb; --surface: #fff; /* … */ }
[data-theme="pastel"]   { /* … */ }
[data-theme="high-contrast"] { /* … */ }
[data-theme="calm"]     { /* … */ }
[data-theme="warm"]     { /* … */ }
```

`ThemeSelector.svelte` applies the theme and persists it to `localStorage` (`lexi:theme`), and an inline script in `Layout.astro` restores the saved theme before hydration to avoid flashing.

> Lesson: **`$state` in Svelte 5.56 does not accept a function initializer.** `$state<string>(() => localStorage.getItem(...))` is a type error; initialize to a value and read `localStorage` in `onMount` (also safer for SSR).

## Icons and security

- `scripts/generate-icons.mjs` generates the 192/512/maskable PNGs from `favicon.svg` with `sharp`.
- `public/_headers` defines the CSP and security policies:
  - `Permissions-Policy: microphone=(self), camera=(self)`.
  - `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'` — `'unsafe-inline'` is **essential** because Astro hydrates islands with inline scripts.

> What we learned the hard way: without `'unsafe-inline'` in `script-src`, the browser blocks island hydration and **everything stays on "Loading"**. We hit this in milestone 5 and I tell that story in detail there.

## Verification and wrap-up

- `npm install`, `npm run check` (0 errors), `astro build` OK.
- Local preview: HTTP 200, `data-theme="neutral"` in the HTML, hydrated island, `sw.js` + `manifest.webmanifest` generated.
- Commit `chore: scaffold Astro + Svelte + Pages/PWA config + theme system` + backup `lexi-$ts-Hito1.zip`.

I also set up the git workflow: `main` branch, `origin` remote, and commit messages always in English with Conventional Commits (a convention we pinned down in `AGENTS.md`).

In the next part, we connect the D1 database.
