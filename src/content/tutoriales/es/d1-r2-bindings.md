---
title: "LeXi: D1 y R2, los bindings de Cloudflare"
description: "El esquema SQL en D1, las migraciones locales y remotas, y los endpoints de audio en R2 con subida vía proxy."
date: 2026-08-15
order: 3
series: proyecto-lexi
part: 3
tags: ["cloudflare", "d1", "r2", "sqlite", "functions", "bindings"]
draft: false
---

En el Hito 2 conectamos la base de datos y en el Hito 3 el almacenamiento de audio. Son los cimientos de la parte serverless de LeXi.

## El esquema D1

`migrations/0001_init.sql` con las cinco tablas del diseño, índices incluidos. La clave del offline-first: los IDs son UUID que genera el cliente, y los timestamps van en epoch ms.

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

> Lección: **`deleted_at` es el *tombstone*.** Los borrados no se hacen con `DELETE` sino marcando `deleted_at`, porque en un sistema multi-dispositivo el borrado debe poder sincronizarse.

## Autenticación y primeras migraciones

- `wrangler d1 create lexidb` → copiar el `database_id` a `wrangler.json`.
- Migraciones locales sin auth: `npx wrangler d1 migrations apply lexidb --local`.
- Remotas: `npx wrangler d1 migrations apply lexidb --remote`.

Añadimos los scripts npm `db:local` y `db:remote` para no escribir el comando entero cada vez.

> Algo que aprendimos por las malas: **`wrangler d1 create` pregunta si quieres conectar al recurso remoto en local; responde que No** (así lo local usa su propia copia). Y cuando el dashboard ofrece "añadir el binding por ti", también No: en D1 nos creó un binding duplicado que tuvimos que consolidar a un único `DB`.

## El binding R2 y los endpoints de audio

`wrangler.json`:

```json
{
  "r2_buckets": [
    { "binding": "BUCKET", "bucket_name": "lexi-audio" }
  ]
}
```

Dos Functions:

- **`functions/api/upload.ts`** — `POST /api/upload`: valida `Content-Type`, aplica límite de tamaño, genera la clave `recordings/<uuid>.<ext>` y hace `BUCKET.put(key, request.body)`.
- **`functions/api/audio/[[key]].ts`** — proxy de lectura: `GET` devuelve el objeto desde R2 con sus metadatos, `DELETE` lo borra. Es un **catch-all** `[[key]]` porque las claves contienen `/`.

> Lección: **el catch-all `[[key]]` es obligatorio.** Con `[key]` (un solo segmento) una clave tipo `audio/uuid.webm` no matchearía. El `params.key` llega como array y hay que unirlo con `/`.

Los types de Workers no existen en tsc local: añadimos `@cloudflare/workers-types` como devDependency y `skipLibCheck`.

## Verificación

Probé el ciclo completo contra el emulador local de wrangler: subida 201, lectura 200 con mime y tamaño correctos, inexistente 404, borrado 204 y posterior 404. En remoto, tras activar R2 en el dashboard, bucket `lexi-audio` con bindings `DB` y `BUCKET` sin duplicados.

Commits: `feat: D1 schema (users, categories, cards, recordings, events)` y `feat: R2 audio endpoints (upload proxy, GET/DELETE)`.

En la siguiente parte, el seed ARASAAC para precargar el catálogo de pictogramas.
