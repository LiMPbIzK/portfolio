---
title: "LeXi: objetivo y arquitectura de un comunicador AAC"
description: "Por qué construir un comunicador AAC como PWA offline-first sobre Cloudflare Pages, D1 y R2, y el stack que elegimos."
date: 2026-08-15
order: 1
series: proyecto-lexi
part: 1
tags: ["aac", "cloudflare", "d1", "r2", "pwa", "arquitectura"]
draft: false
---

LeXi es un comunicador AAC (Comunicación Aumentativa y Alternativa): una PWA de tarjetas con imágenes que, al pulsarlas, reproducen su sonido en voz sintetizada o con audio grabado por la familia. Está pensado para personas con dificultades de habla y para terapeutas y familias. En esta serie cuento cómo lo construí desde cero, decisión a decisión, incluyendo los problemas con los que me encontré.

## Qué quería conseguir

Los requisitos que guiaron todo el diseño:

1. **Offline-first**: un niño en el aula o en el coche no siempre tiene red; la app tiene que funcionar sin conexión desde el primer segundo.
2. **Instalable**: que quede como una app en el móvil o la tablet, no una pestaña del navegador.
3. **Audio propio por tarjeta**: el reconocimiento de la voz de la familia es clave en AAC; no basta con voz sintética.
4. **Sin registro ni login**: las familias no van a crear cuentas. Cada dispositivo es anónimo.
5. **Gratis de mantener**: nada de servidores encendidos 24/7 ni costes por uso.

## El stack elegido y por qué

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Frontend | **Astro (SSG)** + islas **Svelte 5** | HTML estático rápido + componentes interactivos solo donde hacen falta. Svelte tiene el runtime más pequeño, ideal para tiles y teclado táctil. |
| Estado global | **nanostores** + `@nanostores/svelte-runes` | Compartir estado entre islas Svelte aisladas dentro de Astro. Con las runas de Svelte 5 se usa `useStore()`. |
| Hosting | **Cloudflare Pages** | Necesitábamos Functions serverless, D1 y R2. GitHub Pages no sirve para esto. |
| Datos | **Cloudflare D1** (SQLite serverless) | La nube es el *backup*; IndexedDB es la fuente de verdad del día a día. |
| Audio | **Cloudflare R2** (S3-compatible) | Almacenar grabaciones; lectura vía proxy del mismo origen (sin CORS). |
| Datos offline | **IndexedDB** (vía `idb`) | Base local de la app; cola de sincronización. |
| Voz TTS | **Web Speech API** | SpeechSynthesis nativa del navegador, coste cero. |
| Micrófono | **MediaRecorder + getUserMedia** | 100 % en cliente, blob WebM/AAC que se sube a R2. |
| PWA | **@vite-pwa/astro** (workbox) | Service Worker + manifest + precache. |

## Decisiones de arquitectura clave

**Astro SSG + Pages Functions, no Astro SSR.** Evaluamos `@astrojs/cloudflare` con `output: 'server'`, pero lo descartamos: el modo SSG con `output: 'static'` y un directorio `functions/` para la API es más simple de depurar y suficiente.

**R2 privado con proxy de lectura.** El bucket no es público. Se lee el audio a través de una Function del mismo origen (`/api/audio/*`), lo que además evita configurar CORS.

**Subida vía proxy directo, no presigned URL.** El cliente manda el blob a `POST /api/upload` y la Function lo valida (tamaño, cuotas) y hace `BUCKET.put()`. No hacen falta secrets de acceso S3 ni firmas; una sola petición.

**Sin auth: `user_id` = UUID del dispositivo.** Dos dispositivos son dos usuarios independientes. La seguridad se basa en un UUID que se genera en el cliente.

**Sync last-writer-wins por `updated_at`.** Los borrados son *tombstones* (`deleted_at`) y los conflictos los resuelve la fecha de modificación más reciente.

> Lección: **KV se descartó para el MVP.** D1 cubre todo lo que necesitábamos (config, códigos, uso) y añadir KV era una pieza más que mantener sin beneficio claro.

## El esquema de datos en D1

Cinco tablas, con IDs UUID generados en el cliente (crítico para offline-first) y timestamps en epoch ms:

- `users` — perfil anónimo por dispositivo (UUID, locale, voz, tema).
- `categories` — tableros; `user_id NULL` = catálogo global.
- `cards` — tarjetas (etiqueta, imagen/audio en R2, texto TTS, orden).
- `recordings` — grabaciones de audio subidas a R2.
- `events` — estadísticas de uso (tap, hablar, crear, editar).

Diseñado desde el día 1 para i18n: `users.locale` y `users.voice_uri`, con camino futuro a `card_translations`. Español (`es`) es el único idioma implantado ahora.

En la siguiente parte, el esqueleto Astro + Svelte con el sistema de temas.
