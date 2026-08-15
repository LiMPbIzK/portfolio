---
title: "LeXi: sincronización offline-first y estadísticas"
description: "Reintento de sync al reconectar, cola de audio pendiente, endpoint de estadísticas y el bug de la FK que rompía el sync en producción."
date: 2026-08-15
order: 7
series: proyecto-lexi
part: 7
tags: ["sync", "d1", "indexeddb", "estadísticas", "nanostores", "fk"]
draft: false
---

El Hito 7 es la sincronización offline-first y las estadísticas. El sync core ya existía (push/pull a D1, cola de audio pendiente); mi trabajo fue cerrar los huecos que hacían que **no funcionara de verdad**.

## Los huecos que había

Al auditar el código encontré cuatro problemas:

1. `setupSyncListeners()` estaba definida pero **nunca se llamaba** → no había reintento al reconectar.
2. `sync.register('lexi-sync')` se registraba pero **no tenía handler** en el Service Worker → código muerto (el navegador reintentaba y se rendía).
3. `ConnectionStatus.svelte` solo mostraba en línea/sin conexión, sin estado de sincronización.
4. Los eventos de uso se subían a D1 pero no había forma de verlos.

## Decisiones de diseño

**Reintento online, sin Background Sync.** Eliminamos el `sync.register` y dependemos del evento `online` + sync al abrir la app + sync tras ediciones.

> Lección: **un `sync.register` sin handler es un bug silencioso.** Implementar un SW custom (`swSrc` + `injectManifest`) habría cambiado la arquitectura para una funcionalidad "nice-to-have". El evento `online` cubre el 99 % de los casos con mucho menos código.

**Endpoint `/api/stats` agregado en el servidor** en vez de devolver eventos crudos. Los eventos locales se limpian tras el push (`clearEvents`), así que D1 —que acumula historial por dispositivo— es la única fuente completa. Y reutilizar `GET /api/sync` devolvería miles de taps y no escala.

**Gráficos SVG a mano, sin librería.** No había chart lib en el proyecto y añadir una contradice el offline-first y el bundle pequeño.

## La implementación

1. **`src/stores/index.ts`** — `syncState` (`idle|syncing|ok|error`) y `lastSyncAt`.
2. **`src/lib/sync.ts`** — eliminado el bloque muerto; `syncNow()` actualiza los stores.
3. **`src/components/CardGrid.svelte`** — en `onMount`, `setupSyncListeners(() => void syncNow())`.
4. **`src/components/ConnectionStatus.svelte`** — "Sincronizando… / Al día HH:MM / Pendiente".
5. **`functions/api/stats.ts`** — `GET /api/stats?days=14`: actividad diaria, top tarjetas (join con `cards` y `categories`), totales por verbo, voz grabada vs TTS, almacenamiento.
6. **`src/lib/stats.ts`** — agregación local (fallback offline) + `fetchStats()`.
7. **`UsageStats.svelte`** — modal con gráficos: barras de 14 días, top tarjetas, donut de voz personalizada vs TTS.
8. **Eventos nuevos**: `hablar` (al pulsar Hablar) y `editar` (al guardar audio).

> Lección (Svelte 5): `$derived` se escribe `let x = $derived(...)`, no `$derived x = ...`; y un `{@const}` no puede vivir fuera de un bloque. Dos errores de compilación que corregimos sobre la marcha.

## El bug que rompía el sync en producción

Probando el flujo end-to-end en producción descubrí que **`POST /api/sync` devolvía siempre "Error al sincronizar"**, incluso con un dispositivo real.

- **Causa raíz:** el claim inserta en `devices` pero **nunca crea la fila en `users`**. Como `events.user_id`/`cards.user_id`/`categories.user_id` tienen FK a `users(id)` y D1 las aplica por defecto, insertar un evento violaba la constraint: `FOREIGN KEY constraint failed`.
- **Fix:** helper `upsertUser()` en `functions/lib/auth.ts`, llamado en los tres paths del claim (demo, recuperación, normal).
- **Migración `0009_claim_users.sql`** de backfill para los dispositivos ya registrados: crea la fila en `users` desde `devices`.

> Algo que aprendimos por las malas: **D1 aplica las foreign keys por defecto, aunque SQLite local no.** Una FK a una tabla que nunca se rellena solo se descubre en producción. El patrón "upsert de la fila padre antes de insertar la hija" se repitió en el Hito 5 (upload) y en el 7 (sync).

Verificación end-to-end: `POST /api/sync` → `{"ok":true}` y `/api/stats` refleja el evento.

## Cierre del hito

Commit `feat: online retry sync, sync status indicator, usage stats (charts + /api/stats), hablar/editar events` y marcado Hito 7 en ambos READMEs.

En la siguiente parte, la PWA instalable y el dominio propio.
