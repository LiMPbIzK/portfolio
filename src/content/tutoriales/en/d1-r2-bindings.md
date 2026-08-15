---
title: "LeXi: D1 and R2, the Cloudflare bindings"
description: "The SQL schema in D1, local and remote migrations, and the R2 audio endpoints with proxy upload."
date: 2026-08-15
order: 3
series: proyecto-lexi
part: 3
tags: ["cloudflare", "d1", "r2", "sqlite", "functions", "bindings"]
draft: false
---

In milestone 2 we connected the database and in milestone 3 the audio storage. They are the foundations of LeXi's serverless side.

## The D1 schema

`migrations/0001_init.sql` with the five tables from the design, indexes included. The key to offline-first: ids are client-generated UUIDs, and timestamps are epoch ms.

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, display_name TEXT,
  locale TEXT NOT NULL DEFAULT 'es', voice_uri TEXT,
  theme TEXT NOT NULL DEFAULT 'neutral',
  created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
  category_id TEXT REFERENCES categories(id), label TEXT NOT NULL,
  image_key TEXT, audio_key TEXT, tts_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER
);
```

> Lesson: **`deleted_at` is the tombstone.** Deletes are not `DELETE` statements but setting `deleted_at`, because in a multi-device system the deletion must be syncable.

## Auth and first migrations

- `wrangler d1 create lexidb` → copy the `database_id` into `wrangler.json`.
- Local migrations without auth: `npx wrangler d1 migrations apply lexidb --local`.
- Remote: `npx wrangler d1 migrations apply lexidb --remote`.

We added the npm scripts `db:local` and `db:remote` so we never type the full command again.

> What we learned the hard way: **`wrangler d1 create` asks whether you want to connect to the remote resource locally; answer No** (so local uses its own copy). And when the dashboard offers to "add the binding for you", also No: in D1 it created a duplicate binding we had to consolidate into a single `DB`.

## The R2 binding and the audio endpoints

`wrangler.json`:

```json
{
  "r2_buckets": [
    { "binding": "BUCKET", "bucket_name": "lexi-audio" }
  ]
}
```

Two Functions:

- **`functions/api/upload.ts`** — `POST /api/upload`: validates `Content-Type`, applies a size limit, generates the key `recordings/<uuid>.<ext>` and calls `BUCKET.put(key, request.body)`.
- **`functions/api/audio/[[key]].ts`** — read proxy: `GET` streams the object from R2 with its metadata, `DELETE` removes it. It is a **catch-all** `[[key]]` because keys contain `/`.

> Lesson: **the catch-all `[[key]]` is mandatory.** With `[key]` (a single segment) a key like `audio/uuid.webm` would not match. `params.key` arrives as an array and has to be joined with `/`.

Workers types do not exist in local tsc: we added `@cloudflare/workers-types` as a devDependency and `skipLibCheck`.

## Verification

I tested the full cycle against wrangler's local emulator: upload 201, read 200 with the right mime and size, missing 404, delete 204 and then 404. Remotely, after enabling R2 in the dashboard, the `lexi-audio` bucket with `DB` and `BUCKET` bindings and no duplicates.

Commits: `feat: D1 schema (users, categories, cards, recordings, events)` and `feat: R2 audio endpoints (upload proxy, GET/DELETE)`.

In the next part, the ARASAAC seed to preload the pictogram catalog.
