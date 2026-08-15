---
title: "LeXi: grid de tarjetas, teclado virtual y TTS"
description: "El tablero de tarjetas con sonido, el teclado español, la voz TTS y el sistema de códigos de invitación con modo demo."
date: 2026-08-15
order: 5
series: proyecto-lexi
part: 5
tags: ["svelte", "tts", "teclado", "indexeddb", "pwa", "telegram"]
draft: false
---

El Hito 5 es el corazón de la app: las tarjetas que suenan, el teclado para escribir frases y la voz. Aquí aprendí casi todo lo que sé de Svelte 5 y de lo que significa "offline-first de verdad".

## Estado global con nanostores

Dependencias nuevas: `idb`, `nanostores` y `@nanostores/svelte-runes`.

> Lección: **`@nanostores/svelte` no existe; el adapter para Svelte 5 es `@nanostores/svelte-runes`** (la función `useStore()` devuelve un wrapper con `.current`). Y en Svelte 5 el prefijo `$` en imports de stores está prohibido: los stores se nombran sin él (`categories`, `cards`, `activeCategoryId`…).

## La librería ARASAAC offline

`src/lib/seed.ts` siembra el manifest ARASAAC en **IndexedDB** una sola vez (offline-first). La base local es `src/lib/db.ts` con `idb`.

> Algo que aprendimos por las malas: **el índice compuesto `['category_id','sort_order']` de IndexedDB no se puede consultar con una clave simple** (DataError silencioso, tarjetas que no aparecían). Solución: índice simple por `category_id` y ordenar por `sort_order` en JavaScript. Subimos `DB_VERSION` a 2 para migrar el store.

## El grid y el teclado

- `CardTile.svelte` — la tarjeta: imagen, etiqueta, y al pulsar reproduce audio grabado o TTS.
- `CardGrid.svelte` — la barra de categorías + la cuadrícula.
- `VirtualKeyboard.svelte` — el teclado español, con vocales acentuadas por **long-press** (mantener pulsada muestra á/à, é/è…).

El `SentenceBar.svelte` construye la frase. Al principio cada letra del teclado era una "palabra" y hablar sonaba "h o l a"; un helper `sentenceText()` concatena las letras sin espacios y separa las tarjetas con espacio.

## El TTS

`src/lib/tts.ts` con Web Speech API: cargar las voces en español, persistir la selección (`localStorage` + respaldo en IndexedDB) y `speak()`. El `VoiceSelector.svelte` permite elegir la voz.

## Anti-abuso: cuotas por dispositivo

Sin login, cualquiera con la URL podía llenar R2. Lo resolvimos con:

- Todo endpoint exige la cabecera **`X-Device-Id`**.
- Migración `0003_device_usage.sql`: tabla `device_usage` (audio_count, audio_bytes) por dispositivo.
- Vars en `wrangler.json`: `MAX_AUDIO_PER_DEVICE`, `MAX_BYTES_PER_DEVICE`, `MAX_UPLOADS_PER_HOUR`.
- Sobre cuota o rate limit → `429`.

> Algo que aprendimos por las malas: **el upload daba 500 por una restricción FOREIGN KEY.** `recordings.user_id` referencia `users(id)` y la tabla `users` estaba vacía. El upload tiene que hacer un upsert del usuario en `users` antes de insertar la grabación. (Este mismo patrón de FK nos volvería a morder en el Hito 7, con el sync.)

## Códigos de invitación y modo demo

Sin sistema de cuentas, la activación se hace con **códigos de invitación** emitidos manualmente:

- Migraciones `0004_invites.sql` (tablas `invite_codes` y `devices`) y `0005_device_mode.sql` (`devices.mode`).
- `POST /api/claim` canjea un código y vincula el dispositivo; 409 si ya está usado.
- `scripts/generate-codes.mjs` genera e inserta códigos (`--local`/`--remote`).
- **`LEXI-DEMO-CODE`** es un código demo hardcodeado, siempre válido y compartible, en modo solo lectura (el upload devuelve 403 en demo).
- Un bot de Telegram privado (`/nuevo`, `/libres`, `/lista`, `/revocar`) para gestionar códigos desde el móvil.

> Algo que aprendimos por las malas: **el alfabeto del código no puede excluir la `O` si el demo se llama `LEXI-DEMO-CODE`.** La primera máscara del input usaba `A-HJKMNPQRSTUVWXYZ23456789` (sin I/L/O/0/1) y era imposible escribir el código demo. La validación real la hace el servidor; el input debe permitir A-Z0-9 completo.

## Recuperación de dispositivo (Android)

La tablet perdía `localStorage` (gestión de memoria de Android) → UUID nuevo → "código ya usado". Solución en tres capas:

1. **Persistencia dual**: UUID/código/token en localStorage + IndexedDB (store `meta`); al cargar se restaura si falta.
2. **Token de recuperación** (`0007_device_token.sql`): el servidor lo genera al canjear; si el UUID cambia, el cliente lo reenvía y el servidor **re-vincula** el código (transfiere grabaciones y uso, borra el device antiguo).
3. Sin token, el 409 sigue intacto (seguridad).

## Deploy en Cloudflare Pages

El primer deploy real: conectar el repo a Pages (build `npm run build`, salida `dist`, rama `main`). Resultado: **`https://tu-proyecto.pages.dev`**. Los bindings se leen del `wrangler.json` del repo; no hay que tocarlos en el dashboard.

> Lección: **el CSP sin `'unsafe-inline'` deja la app en "Cargando".** Astro hidrata las islas con scripts inline; si `script-src` no lo permite, nada se monta. Lo confirmamos con Playwright y lo arreglamos en `public/_headers`.

## Cierre del hito

Commits: `feat: card grid + Spanish keyboard + TTS + voice selector`, `feat: invite codes, demo mode, Telegram bot, code mask + scripts`, `fix: CSP inline scripts (islands) + shared demo code + SW/api cache`, `fix: device identity persistence (IndexedDB) + recovery token on re-claim`, `feat: ARASAAC attribution in footer + floating feedback button`.

En la siguiente parte, el editor de tarjetas con grabación de voz.
