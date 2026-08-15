---
title: "LeXi: esqueleto Astro + Svelte y sistema de temas"
description: "Montar el proyecto Astro a mano, añadir Svelte 5, Cloudflare Pages con wrangler.json y un selector de temas por CSS custom properties."
date: 2026-08-15
order: 2
series: proyecto-lexi
part: 2
tags: ["astro", "svelte", "pwa", "cloudflare", "css", "temas"]
draft: false
---

En el Hito 1 montamos el esqueleto del proyecto. En lugar de `npm create astro` decidí **crear el `package.json` a mano**: la carpeta ya tenía READMEs, banners y el `AGENTS.md`, y quería control total sobre cada dependencia.

## Versiones y conflicto de dependencias

El primer escollo fue casar versiones. La combinación que funcionó (y que ya no toqué):

```json
{
  "astro": "^5.0.0",
  "@astrojs/svelte": "^7.0.5",
  "@vite-pwa/astro": "^1.2.0",
  "svelte": "^5.1.16",
  "wrangler": "^4.0.0"
}
```

> Lección: **las versiones más nuevas no siempre casan.** `@astrojs/svelte` 9 exigía Astro 7 y 8 exigía Astro 6; con Astro 5 la versión compatible es la 7.0.5. Buscar una combinación que respete los *peer dependencies* evita días de dolores de cabeza.

## La configuración

`astro.config.mjs` con salida estática, el dominio real y las integraciones de Svelte y PWA:

```js
export default defineConfig({
  output: 'static',
  site: 'https://tu-dominio.com',
  integrations: [
    svelte(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: { /* nombre, iconos 192/512/maskable, theme_color… */ },
      workbox: { /* precache + runtimeCaching para static.arasaac.org */ }
    })
  ]
});
```

Y `wrangler.json` con la configuración de Pages: salida `dist`, `compatibility_date`, flag `nodejs_compat` y los bindings que iremos añadiendo.

> Lección: **`@vite-pwa/astro` no exporta `VitePWA`.** Se configura con el *default export* de la integración, no con el plugin de Vite. Otro detalle: los campos de `wrangler.json` cambian entre versiones; `pages_project` no es válido y `migrations_dir` va dentro de cada entrada de `d1_databases`.

## El sistema de temas

Lo definí con **CSS custom properties** y un atributo `[data-theme]` en `<html>`, sin tocar componentes para añadir un tema nuevo:

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

El `ThemeSelector.svelte` aplica el tema y lo persiste en `localStorage` (`lexi:theme`), y un script inline en `Layout.astro` restaura el tema guardado antes de hidratar para evitar el parpadeo.

> Lección: **`$state` en Svelte 5.56 no acepta un inicializador de función.** `$state<string>(() => localStorage.getItem(...))` da error de tipos; hay que inicializar a un valor y leer `localStorage` en `onMount` (además es más seguro para SSR).

## Iconos y seguridad

- `scripts/generate-icons.mjs` genera con `sharp` los PNG 192/512/maskable a partir del `favicon.svg`.
- `public/_headers` define la CSP y políticas de seguridad:
  - `Permissions-Policy: microphone=(self), camera=(self)`.
  - `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'` — el `'unsafe-inline'` es **imprescindible** porque Astro hidrata las islas con scripts inline.

> Algo que aprendimos por las malas: sin `'unsafe-inline'` en `script-src`, el navegador bloquea la hidratación de las islas y **todo se queda en "Cargando"**. Lo sufrimos en el Hito 5; lo cuento ahí con detalle.

## Verificación y cierre

- `npm install`, `npm run check` (0 errores), `astro build` OK.
- Preview local: HTTP 200, `data-theme="neutral"` en el HTML, isla hidratada, `sw.js` + `manifest.webmanifest` generados.
- Commit `chore: scaffold Astro + Svelte + Pages/PWA config + theme system` + backup `lexi-$ts-Hito1.zip`.

También dejé preparado el flujo de git: rama `main`, remote `origin`, y los mensajes de commit siempre en inglés con Conventional Commits (convención que fijamos en `AGENTS.md`).

En la siguiente parte, conectamos la base de datos D1.
