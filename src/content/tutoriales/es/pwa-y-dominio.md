---
title: "LeXi: PWA instalable y el dominio propio"
description: "Soporte iOS, caché del service worker en un dominio personalizado, el bug del SW que no se registraba y el huso horario del bot."
date: 2026-08-15
order: 8
series: proyecto-lexi
part: 8
tags: ["pwa", "service worker", "cloudflare", "dominio", "cache-control", "timezone"]
draft: false
---

El último hito: que LeXi quede **instalable de verdad** y se sirva desde el dominio propio `lexi.fmartinezgarcia.com`. Fue el hito con más bugs sorpresa de toda la serie, todos relacionados con la diferencia entre "funciona en local" y "funciona en producción".

## Soporte iOS

`src/layouts/Layout.astro` — en el `<head>` añadimos las etiquetas que iOS necesita para "Añadir a pantalla de inicio":

```html
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="LeXi" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

## Screenshots del manifest

`scripts/generate-screenshots.mjs` (con `sharp`) genera dos screenshots para el diálogo de instalación enriquecido:

```js
screenshots: [
  { src: '/screenshots/lexi-mobile.png', sizes: '410x917', form_factor: 'narrow' },
  { src: '/screenshots/lexi-desktop.png', sizes: '1919x966', form_factor: 'wide' }
]
```

> Lección: **las `sizes` del manifest deben coincidir con las dimensiones reales del PNG.** Generamos placeholders y el usuario los sustituyó por capturas reales; hubo que actualizar las tallas en `astro.config.mjs` o Chrome ignora el screenshot.

## El bug del SW que no se registraba

Verificando con Puppeteer contra producción descubrí que **el Service Worker nunca se registraba**. El plugin generaba `registerSW.js` (y lo precacheaba dentro de `sw.js`), pero **no lo inyectaba en el HTML final de Astro**: el `transformIndexHtml` de vite-plugin-pwa no corre sobre el SSG de Astro. Ni `injectRegister: 'script'` lo arreglaba.

> Algo que aprendimos por las malas: **en Astro SSG, el plugin PWA genera los archivos pero no el registro.** La solución fue registrarlo manualmente en el `<script>` inline del layout:

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}
```

Tras el fix: SW `active`, precache `workbox-precache-v2` creado, y **offline OK** — 24 tarjetas y 24 imágenes ARASAAC cargadas sin red.

## El sw.js cacheado en el dominio personalizado

`/sw.js` respondía con `Cache-Control: public, max-age=14400` en el dominio propio, aunque en `pages.dev` salía bien. El `_headers` sí se aplicaba (la CSP llegaba), pero el **edge cache del zone** reescribía la cabecera para `.js`.

No podía crear una Cache Rule por API (el token de wrangler solo tenía `zone:read`). La solución fue una cabecera que Cloudflare Pages sí respeta para controlar la caché de borde:

```
/sw.js
  Cache-Control: no-cache
  CDN-Cache-Control: no-cache
```

> Lección: **`CDN-Cache-Control` controla la caché de borde en Cloudflare.** El `Cache-Control` restante (`max-age=14400`) es a nivel navegador, y por spec el update-check del SW ignora la caché HTTP (`updateViaCache` por defecto es `'imports'`). Funcionalmente resuelto.

## Huso horario: el bot y las estadísticas

El bot de Telegram mostraba las horas en **UTC** porque `toLocaleString('es-ES')` en Workers no hereda la zona local. Lo arreglamos con una variable configurable:

- `wrangler.json`: `"TIME_ZONE": "Europe/Madrid"`.
- `webhook.ts`: helper `formatTime(ts, timeZone)`.
- Y `/api/stats` agrupaba por día en UTC con `strftime`; lo reescribimos para agrupar **en JS con el timezone** (formato `en-CA` → `YYYY-MM-DD`).

> Lección: **en Cloudflare Workers no existe "la hora local del usuario".** Hay que forzar el `timeZone` explícitamente. Y cuidado con `strftime` para agrupar días: un evento a las 23:00 UTC es del día siguiente en Madrid.

## Botón demo

El código `LEXI-DEMO-CODE` ya existía; añadimos un botón **"Probar la aplicación (demo)"** en el diálogo de bienvenida que lo canjea con un clic, para que cualquiera pueda explorar la app sin registro.

## Verificación final

- Lighthouse 13 eliminó la categoría PWA del core, así que verifiqué los criterios manualmente (HTTPS, manifest, SW, iconos 200, `start_url`).
- Deploy a `lexi.fmartinezgarcia.com` con DNS CNAME → `lexi-426.pages.dev` y SSL automático.

## Cierre de la serie

Commits: `feat: installable PWA polish`, `fix: prevent edge caching of sw.js`, `fix: register service worker in Layout`, `fix: create users row on device claim`, `fix: format bot and stats times in owner timezone`, `docs: mark Hito 8 complete`.

Con esto, los 8 hitos de LeXi están completos: arquitectura, esqueleto, D1/R2, seed ARASAAC, grid+teclado+TTS, editor, sync+estadísticas y PWA+dominio. El único pendiente en la hoja de ruta es el soporte inicial para inglés (i18n), para cuando toque. ¡Fin de la serie!
