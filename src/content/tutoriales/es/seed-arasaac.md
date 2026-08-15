---
title: "LeXi: el seed ARASAAC, el catálogo precargado"
description: "Descargar los pictogramas de ARASAAC, generarlos en un manifest y un SQL idempotente, y detectar cambios en CI."
date: 2026-08-15
order: 4
series: proyecto-lexi
part: 4
tags: ["arasaac", "seed", "pictogramas", "ci", "datos"]
draft: false
---

LeXi necesita un catálogo base de pictogramas para que la app funcione desde el primer segundo, incluso sin conexión. Los símbolos de **ARASAAC** son la referencia en comunicación aumentativa en español, y se distribuyen bajo licencia CC BY-NC-SA 4.0 (atribución obligatoria).

## El problema: la API no sirve imágenes

Investigué ARASAAC a fondo antes de escribir una sola línea:

- La API de búsqueda funciona: `GET /v1/pictograms/es/search/{term}` devuelve JSON con metadatos.
- **La descarga de imágenes por API no funciona** (`?downloadType=png` → 400).
- Lo fiable es el **CDN estático**: `https://static.arasaac.org/pictograms/{id}/{id}_500.png` (solo PNG en 300/500; JPG y SVG dan 404).

> Lección: **antes de montar un pipeline de scraping, comprueba la fuente de datos real.** La API era bonita en papel pero inútil para lo que necesitábamos; el CDN estático era la vía estable.

## La estrategia: seed en build, no en runtime

Decisión clave: el catálogo se **descarga y commitea** en el repo. Así:

- La app funciona 100 % offline desde el minuto 1.
- Cero llamadas a ARASAAC en runtime.
- El vocabulario es **editable** (los pictogramas no cambian, el texto sí).

Estructura:

- `data/core-vocab.es.json` — 8 categorías, 285 términos, con un bloque `overrides`.
- `scripts/seed-arasaac.mjs` — busca en la API, descarga del CDN, genera manifest + SQL.
- `public/assets/arasaac/` — 286 PNG de 500px (~4,9 MB) commiteados.
- `migrations/0002_seed_arasaac.sql` — seed idempotente (`INSERT OR IGNORE`, `user_id = NULL` → catálogo global).

## Fallos y overrides del vocabulario

Al generar el seed salieron matches erróneos de la búsqueda: `té` → "tres en raya", `feliz` → "¡Feliz Navidad!", `¿qué?` → "¡buen provecho!". Los arreglé con un bloque `overrides` en el JSON que mapea el término a una búsqueda alternativa:

```json
{
  "overrides": {
  "¿por qué?": "porque",
  "sentarse": "sentar en circulo"
  }
}
```

Otros problemas: los verbos reflexivos ("levantarse", "lavarse") devuelven 404 → fallback a la forma base; y términos como `algo` no tienen pictograma → se quitaron del vocabulario.

> Algo que aprendimos por las malas: **el ID de la tarjeta debe derivar del término, no del pictograma.** `lavar` y `lavarse` comparten pictograma; si la clave era el id de la imagen, las tarjetas colisionaban (287 en el manifest frente a 281 en D1).

## El modo `--check` para CI

Para no relanzar el seed constantemente, el script tiene dos modos: `--download` regenera, y `--check` compara el manifest regenerado contra el commiteado. Un workflow de GitHub Actions lo ejecuta y solo re-genera cuando hay cambios.

> Lección: **GitHub Actions con `bash -e` corta el step cuando `node --check` sale con código 1** (que es justo cuando hay cambios). La primera versión del workflow nunca ejecutaba el paso condicional. Y un `.arasaac-hash` gitignored hacía que CI siempre viera "changed". La solución fue comparar el manifest commiteado (que sí existe en CI) y capturar el exit code con `set +e`.

## Cierre

- Commit `feat: ARASAAC core seed (285 cards, script + CI)`.
- Se aplica en remoto con `npm run db:remote`.
- El footer de la app incluye la atribución obligatoria a ARASAAC y la licencia.

En la siguiente parte, el grid de tarjetas, el teclado virtual y el TTS.
