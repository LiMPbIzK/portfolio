---
title: "LeXi: card grid, Spanish keyboard and TTS"
description: "The picture-card board with sound, the Spanish keyboard, the TTS voice and the invite-code system with demo mode."
date: 2026-08-15
order: 5
series: proyecto-lexi
part: 5
tags: ["svelte", "tts", "keyboard", "indexeddb", "pwa", "telegram"]
draft: false
---

Milestone 5 is the heart of the app: the cards that make sound, the keyboard to build sentences and the voice. Here I learned most of what I know about Svelte 5 and what "truly offline-first" means.

## Global state with nanostores

New dependencies: `idb`, `nanostores` and `@nanostores/svelte-runes`.

> Lesson: **`@nanostores/svelte` does not exist; the adapter for Svelte 5 is `@nanostores/svelte-runes`** (the `useStore()` function returns a wrapper with `.current`). And in Svelte 5 the `$` prefix on store imports is forbidden: stores are named without it (`categories`, `cards`, `activeCategoryId`…).

## The offline ARASAAC library

`src/lib/seed.ts` seeds the ARASAAC manifest into **IndexedDB** once (offline-first). The local database is `src/lib/db.ts` with `idb`.

> What we learned the hard way: **IndexedDB composite index `['category_id','sort_order']` cannot be queried with a single key** (silent DataError, cards that would not appear). Solution: a simple `category_id` index and sorting by `sort_order` in JavaScript. We bumped `DB_VERSION` to 2 to migrate the store.

## The grid and the keyboard

- `CardTile.svelte` — the card: image, label, and on tap it plays recorded audio or TTS.
- `CardGrid.svelte` — the category bar + the grid.
- `VirtualKeyboard.svelte` — the Spanish keyboard, with accented vowels via **long-press** (holding a vowel shows á/à, é/è…).

`SentenceBar.svelte` builds the sentence. At first each keyboard letter was a "word" and speaking sounded like "h o l a"; a `sentenceText()` helper concatenates letters without spaces and separates cards with a space.

## The TTS

`src/lib/tts.ts` with the Web Speech API: load the Spanish voices, persist the selection (`localStorage` + IndexedDB fallback) and `speak()`. `VoiceSelector.svelte` lets the user pick the voice.

## Anti-abuse: per-device quotas

Without login, anyone with the URL could fill R2. We solved it with:

- Every endpoint requires the **`X-Device-Id`** header.
- Migration `0003_device_usage.sql`: a `device_usage` table (audio_count, audio_bytes) per device.
- Vars in `wrangler.json`: `MAX_AUDIO_PER_DEVICE`, `MAX_BYTES_PER_DEVICE`, `MAX_UPLOADS_PER_HOUR`.
- Over quota or rate limit → `429`.

> What we learned the hard way: **the upload returned 500 because of a FOREIGN KEY constraint.** `recordings.user_id` references `users(id)` and the `users` table was empty. The upload must upsert the user in `users` before inserting the recording. (This same FK pattern bit us again in milestone 7, with sync.)

## Invite codes and demo mode

With no account system, activation works through **invite codes** issued manually:

- Migrations `0004_invites.sql` (tables `invite_codes` and `devices`) and `0005_device_mode.sql` (`devices.mode`).
- `POST /api/claim` redeems a code and links the device; 409 if already used.
- `scripts/generate-codes.mjs` generates and inserts codes (`--local`/`--remote`).
- **`LEXI-DEMO-CODE`** is a hardcoded demo code, always valid and shareable, in read-only mode (upload returns 403 in demo).
- A private Telegram bot (`/nuevo`, `/libres`, `/lista`, `/revocar`) to manage codes from your phone.

> What we learned the hard way: **the code alphabet cannot exclude the `O` if the demo is called `LEXI-DEMO-CODE`.** The first input mask used `A-HJKMNPQRSTUVWXYZ23456789` (no I/L/O/0/1) and it was impossible to type the demo code. The server does the real validation; the input must allow full A-Z0-9.

## Device recovery (Android)

The tablet lost `localStorage` (Android memory management) → new UUID → "code already used". Solved in three layers:

1. **Dual persistence**: UUID/code/token in localStorage + IndexedDB (`meta` store); restored on load if missing.
2. **Recovery token** (`0007_device_token.sql`): the server generates it on redeem; if the UUID changes, the client resends it and the server **re-links** the code (moves recordings and usage, deletes the old device).
3. Without the token, the 409 stays intact (security).

## Deploy to Cloudflare Pages

The first real deploy: connect the repo to Pages (build `npm run build`, output `dist`, `main` branch). Result: **`https://your-project.pages.dev`**. Bindings are read from the repo's `wrangler.json`; nothing to touch in the dashboard.

> Lesson: **a CSP without `'unsafe-inline'` leaves the app stuck on "Loading".** Astro hydrates islands with inline scripts; if `script-src` forbids them, nothing mounts. We confirmed it with Playwright and fixed it in `public/_headers`.

## Milestone wrap-up

Commits: `feat: card grid + Spanish keyboard + TTS + voice selector`, `feat: invite codes, demo mode, Telegram bot, code mask + scripts`, `fix: CSP inline scripts (islands) + shared demo code + SW/api cache`, `fix: device identity persistence (IndexedDB) + recovery token on re-claim`, `feat: ARASAAC attribution in footer + floating feedback button`.

In the next part, the card editor with voice recording.
