---
title: "LeXi: offline-first sync and usage stats"
description: "Reconnect retry, the pending audio queue, a stats endpoint and the FK bug that broke sync in production."
date: 2026-08-15
order: 7
series: proyecto-lexi
part: 7
tags: ["sync", "d1", "indexeddb", "stats", "nanostores", "fk"]
draft: false
---

Milestone 7 is the offline-first sync and the usage stats. The sync core already existed (push/pull to D1, pending audio queue); my job was closing the gaps that kept it from **actually working**.

## The gaps I found

Auditing the code turned up four problems:

1. `setupSyncListeners()` was defined but **never called** → no reconnect retry.
2. `sync.register('lexi-sync')` was registered but **had no handler** in the service worker → dead code (the browser retried and gave up).
3. `ConnectionStatus.svelte` only showed online/offline, with no sync state.
4. Usage events were uploaded to D1 but there was no way to see them.

## Design decisions

**Online retry, no Background Sync.** We removed the `sync.register` and rely on the `online` event + sync on app open + sync after edits.

> Lesson: **a `sync.register` without a handler is a silent bug.** Building a custom SW (`swSrc` + `injectManifest`) would have changed the SW architecture for a nice-to-have feature. The `online` event covers 99% of the cases with much less code.

**An aggregated `/api/stats` endpoint** instead of returning raw events. Local events are cleared after the push (`clearEvents`), so D1 — which accumulates per-device history — is the only complete source. And reusing `GET /api/sync` would return thousands of taps and would not scale.

**Hand-rolled SVG charts, no library.** There was no chart lib in the project and adding one goes against offline-first and a small bundle.

## The implementation

1. **`src/stores/index.ts`** — `syncState` (`idle|syncing|ok|error`) and `lastSyncAt`.
2. **`src/lib/sync.ts`** — removed the dead block; `syncNow()` updates the stores.
3. **`src/components/CardGrid.svelte`** — in `onMount`, `setupSyncListeners(() => void syncNow())`.
4. **`src/components/ConnectionStatus.svelte`** — "Syncing… / Up to date HH:MM / Pending".
5. **`functions/api/stats.ts`** — `GET /api/stats?days=14`: daily activity, top cards (join with `cards` and `categories`), totals by verb, recorded vs TTS voice, storage.
6. **`src/lib/stats.ts`** — local aggregation (offline fallback) + `fetchStats()`.
7. **`UsageStats.svelte`** — modal with charts: 14-day bars, top cards, recorded-voice vs TTS donut.
8. **New events**: `hablar` (on Speak) and `editar` (on saving audio).

> Lesson (Svelte 5): `$derived` is written `let x = $derived(...)`, not `$derived x = ...`; and a `{@const}` cannot live outside a block. Two compile errors we fixed on the fly.

## The bug that broke sync in production

Testing the end-to-end flow in production I found that **`POST /api/sync` always returned "Error al sincronizar"**, even with a real device.

- **Root cause:** the claim inserts into `devices` but **never creates the row in `users`**. Since `events.user_id`/`cards.user_id`/`categories.user_id` have FK to `users(id)` and D1 enforces them by default, inserting an event violated the constraint: `FOREIGN KEY constraint failed`.
- **Fix:** an `upsertUser()` helper in `functions/lib/auth.ts`, called in all three claim paths (demo, recovery, normal).
- **Migration `0009_claim_users.sql`** backfill for already-registered devices: creates the `users` row from `devices`.

> What we learned the hard way: **D1 enforces foreign keys by default, even though local SQLite does not.** An FK pointing at a table that is never filled only shows up in production. The "upsert the parent row before inserting the child" pattern repeated in milestone 5 (upload) and in milestone 7 (sync).

End-to-end verification: `POST /api/sync` → `{"ok":true}` and `/api/stats` reflects the event.

## Milestone wrap-up

Commit `feat: online retry sync, sync status indicator, usage stats (charts + /api/stats), hablar/editar events` and milestone 7 checked in both READMEs.

In the next part, the installable PWA and the custom domain.
