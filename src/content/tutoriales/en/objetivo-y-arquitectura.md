---
title: "LeXi: goal and architecture of an AAC communicator"
description: "Why build an AAC communicator as an offline-first PWA on Cloudflare Pages, D1 and R2, and the stack we chose."
date: 2026-08-15
order: 1
series: proyecto-lexi
part: 1
tags: ["aac", "cloudflare", "d1", "r2", "pwa", "architecture"]
draft: false
---

LeXi is an AAC (Augmentative and Alternative Communication) communicator: a PWA with picture cards that, when tapped, play their sound either as synthesized speech or as audio recorded by the family. It is aimed at people with speech difficulties and their therapists and families. In this series I walk through how I built it from scratch, decision by decision, including the problems I ran into.

## What I wanted to achieve

The requirements that guided the whole design:

1. **Offline-first**: a child in a classroom or in the car does not always have a connection; the app must work offline from the very first second.
2. **Installable**: it should live as an app on the phone or tablet, not a browser tab.
3. **Per-card recorded audio**: recognizing the family's voice is key in AAC; synthesized speech alone is not enough.
4. **No registration or login**: families will not create accounts. Each device is anonymous.
5. **Free to run**: no servers running 24/7 and no usage costs.

## The stack and why

| Layer | Technology | Why |
| --- | --- | --- |
| Frontend | **Astro (SSG)** + **Svelte 5** islands | Fast static HTML + interactive components only where needed. Svelte has the smallest runtime, ideal for tiles and a touch keyboard. |
| Global state | **nanostores** + `@nanostores/svelte-runes` | Sharing state between isolated Svelte islands inside Astro. With Svelte 5 runes you use `useStore()`. |
| Hosting | **Cloudflare Pages** | We needed serverless Functions, D1 and R2. GitHub Pages cannot do this. |
| Data | **Cloudflare D1** (serverless SQLite) | The cloud is the backup; IndexedDB is the day-to-day source of truth. |
| Audio | **Cloudflare R2** (S3-compatible) | Storing recordings; read through a same-origin proxy (no CORS). |
| Offline data | **IndexedDB** (via `idb`) | Local app database; sync queue. |
| TTS voice | **Web Speech API** | Native browser SpeechSynthesis, zero cost. |
| Microphone | **MediaRecorder + getUserMedia** | 100% client-side, WebM/AAC blob uploaded to R2. |
| PWA | **@vite-pwa/astro** (workbox) | Service worker + manifest + precache. |

## Key architecture decisions

**Astro SSG + Pages Functions, not Astro SSR.** We evaluated `@astrojs/cloudflare` with `output: 'server'`, but discarded it: SSG with `output: 'static'` plus a `functions/` directory for the API is simpler to debug and enough.

**Private R2 with a read proxy.** The bucket is not public. Audio is read through a same-origin Function (`/api/audio/*`), which also avoids CORS configuration.

**Direct proxy upload, not presigned URLs.** The client sends the blob to `POST /api/upload` and the Function validates it (size, quotas) and calls `BUCKET.put()`. No S3 access secrets or signatures needed; a single request.

**No auth: `user_id` = device UUID.** Two devices are two independent users. Security relies on a client-generated UUID.

**Last-writer-wins sync by `updated_at`.** Deletes are tombstones (`deleted_at`) and conflicts are resolved by the most recent modification date.

> Lesson: **KV was dropped for the MVP.** D1 covers everything we needed (config, codes, usage), and adding KV was one more piece to maintain with no clear benefit.

## The D1 schema

Five tables, with client-generated UUID ids (critical for offline-first) and epoch-ms timestamps:

- `users` — anonymous per-device profile (UUID, locale, voice, theme).
- `categories` — boards; `user_id NULL` = global catalog.
- `cards` — cards (label, image/audio in R2, TTS text, order).
- `recordings` — audio recordings uploaded to R2.
- `events` — usage stats (tap, speak, create, edit).

Designed for i18n from day one: `users.locale` and `users.voice_uri`, with a future path to `card_translations`. Spanish (`es`) is the only language implemented so far.

In the next part, the Astro + Svelte skeleton with the theme system.
