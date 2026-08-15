---
title: "LeXi: the installable PWA and the custom domain"
description: "iOS support, service-worker caching on a custom domain, the SW that never registered and the bot's timezone."
date: 2026-08-15
order: 8
series: proyecto-lexi
part: 8
tags: ["pwa", "service worker", "cloudflare", "domain", "cache-control", "timezone"]
draft: false
---

The last milestone: make LeXi **truly installable** and serve it from the custom domain `lexi.fmartinezgarcia.com`. It was the milestone with the most surprise bugs of the whole series, all related to the difference between "works locally" and "works in production".

## iOS support

`src/layouts/Layout.astro` — in the `<head>` we added the tags iOS needs for "Add to Home Screen":

```html
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="LeXi" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

## Manifest screenshots

`scripts/generate-screenshots.mjs` (with `sharp`) generates two screenshots for the richer install dialog:

```js
screenshots: [
  { src: '/screenshots/lexi-mobile.png', sizes: '410x917', form_factor: 'narrow' },
  { src: '/screenshots/lexi-desktop.png', sizes: '1919x966', form_factor: 'wide' }
]
```

> Lesson: **the manifest `sizes` must match the actual PNG dimensions.** We generated placeholders and the user replaced them with real captures; we had to update the sizes in `astro.config.mjs` or Chrome ignores the screenshot.

## The SW that never registered

Verifying with Puppeteer against production I found that **the Service Worker never registered**. The plugin generated `registerSW.js` (and precached it inside `sw.js`), but **did not inject it into Astro's final HTML**: vite-plugin-pwa's `transformIndexHtml` does not run on Astro's SSG output. Even `injectRegister: 'script'` did not fix it.

> What we learned the hard way: **in Astro SSG, the PWA plugin generates the files but not the registration.** The fix was registering it manually in the layout's inline `<script>`:

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}
```

After the fix: SW `active`, `workbox-precache-v2` precache created, and **offline OK** — 24 cards and 24 ARASAAC images loaded with no network.

## sw.js cached on the custom domain

`/sw.js` responded with `Cache-Control: public, max-age=14400` on the custom domain, even though `pages.dev` was fine. `_headers` was being applied (the CSP arrived), but the **zone's edge cache** rewrote the header for `.js`.

I could not create a Cache Rule via API (the wrangler token only had `zone:read`). The solution was a header Cloudflare Pages does respect for edge cache:

```
/sw.js
  Cache-Control: no-cache
  CDN-Cache-Control: no-cache
```

> Lesson: **`CDN-Cache-Control` controls Cloudflare's edge cache.** The remaining `Cache-Control` (`max-age=14400`) is browser-level, and per spec the SW update-check ignores the HTTP cache (`updateViaCache` defaults to `'imports'`). Functionally solved.

## Timezone: the bot and the stats

The Telegram bot showed times in **UTC** because `toLocaleString('es-ES')` on Workers does not inherit the local zone. We fixed it with a configurable variable:

- `wrangler.json`: `"TIME_ZONE": "Europe/Madrid"`.
- `webhook.ts`: a `formatTime(ts, timeZone)` helper.
- And `/api/stats` grouped days in UTC with `strftime`; we rewrote it to group **in JS with the timezone** (format `en-CA` → `YYYY-MM-DD`).

> Lesson: **there is no "user's local time" in Cloudflare Workers.** You must force `timeZone` explicitly. And be careful grouping days with `strftime`: an event at 23:00 UTC belongs to the next day in Madrid.

## Demo button

The `LEXI-DEMO-CODE` code already existed; we added a **"Try the app (demo)"** button in the welcome dialog that redeems it with one click, so anyone can explore the app without registering.

## Final verification

- Lighthouse 13 removed the PWA category from core, so I verified the criteria manually (HTTPS, manifest, SW, icons 200, `start_url`).
- Deploy to `lexi.fmartinezgarcia.com` with a DNS CNAME → `lexi-426.pages.dev` and automatic SSL.

## End of the series

Commits: `feat: installable PWA polish`, `fix: prevent edge caching of sw.js`, `fix: register service worker in Layout`, `fix: create users row on device claim`, `fix: format bot and stats times in owner timezone`, `docs: mark Hito 8 complete`.

With this, all 8 LeXi milestones are complete: architecture, skeleton, D1/R2, ARASAAC seed, grid+keyboard+TTS, editor, sync+stats and PWA+domain. The only roadmap item left is initial English support (i18n), whenever we get to it. End of the series!
