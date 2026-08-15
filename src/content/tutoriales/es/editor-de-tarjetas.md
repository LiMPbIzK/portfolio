---
title: "LeXi: el editor de tarjetas con voz personalizada"
description: "Grabar la voz de la familia con MediaRecorder, pulsación larga para editar, caché de audio offline y reproducción palabra a palabra."
date: 2026-08-15
order: 6
series: proyecto-lexi
part: 6
tags: ["mediarecorder", "audio", "editor", "caché", "offline"]
draft: false
---

El valor real de un comunicador AAC es la **voz de la familia**: que la tarjeta "agua" suene como la mamá, no como un robot. En el Hito 6 lo conseguimos con MediaRecorder 100 % en el cliente.

## El grabador

`src/lib/recorder.ts` envuelve MediaRecorder con autodetección de formato (WebM/Opus o MP4/AAC según el navegador), gestión de permisos del micrófono y un límite de duración que luego el servidor refuerza.

`RecorderButton.svelte` es el botón grabar/parar con cronómetro, reproducción de prueba y descarte. Emite el **blob al padre** vía un callback `onrecorded`; el editor es quien lo sube a R2 al guardar.

## El editor y la pulsación larga

Al principio el editor tenía un botón "Añadir tarjeta", pero el usuario lo descartó: aparecía mal en modo demo. Lo sustituimos por la interacción natural del AAC:

- **Pulsación larga** (~500 ms) sobre una tarjeta → menú contextual flotante con "🎤 Añadir/Editar audio personalizado".
- También funciona con **clic derecho** en escritorio.
- Al guardar, la tarjeta muestra un **badge circular 🎤** y un tinte de acento.
- En modo demo no se abre el menú.

`CardEditor.svelte` guarda el audio en IndexedDB, sube el blob a R2 y actualiza `audio_key` de la tarjeta.

> Lección: **el `canEdit` no se puede calcular una sola vez al montar.** Las islas Svelte de Astro son independientes; cuando el usuario canjea un código en `ClaimDialog`, el grid no se enteraba. Lo resolvimos con un store global `deviceMode` en nanostores y un `$effect` reactivo.

## Límites y modo demo

Dos bugs seguidos:

- En móvil, una grabación de 2s decía "supera la duración máxima" → `MAX_RECORDING_MS` llegaba como string y rompía la comparación. Fix: `Number()` con fallback y subimos el límite a 30s.
- El cliente se fiaba de `localStorage` para saber si podía grabar. Nuevo endpoint **`GET /api/device/status`** que devuelve el modo real (demo/full) desde el servidor, y `CardTile` recibe `editable`.

> Lección: **el offline-first también aplica al modo de edición.** Si el dispositivo está en modo `full` local pero sin red, `refreshCanEdit` debe permitir grabar igualmente (un terapeuta sin cobertura no puede quedarse bloqueado); el servidor solo refuerza cuando hay conexión.

## Subida sin conexión: la cola pendiente

Si no hay red al grabar, el blob se guarda en IndexedDB (`uploads`) y la tarjeta queda con `audio_key: pending:...`. Al volver la red, `flushPendingUploads()` sube a R2 y actualiza la tarjeta. Y el audio se **cachea al guardar** (`cacheAudioBlob`) para que suene offline desde el minuto 1.

## Reproducción palabra a palabra

Al pulsar **Hablar**, cada palabra de la frase reproduce su audio grabado o cae a TTS:

- `playCardAudioEnd()` en `audio.ts` — reproduce y resuelve al terminar.
- `speakEnd()` en `tts.ts` — TTS que resuelve al final.
- `SentenceBar.speakSentence()` itera los chunks con metadata (texto, customVoice, audioKey).

> Algo que aprendimos por las malas: **`pause()` no dispara el evento `ended`.** El botón Parar no detenía la frase porque el bucle `for...await` seguía encolando. Fix: flag `playbackStop` (nanostore) que el bucle comprueba en cada iteración, y `stopActiveAudio()` que resuelve la promesa pendiente de `playCardAudioEnd`.

## Velocidad y teclado físico

- `SpeedSelector.svelte`: 1x / 1.5x (por defecto) / 2x, aplicado en caliente (`setLiveRate`).
- **Unión de TTS consecutivos**: los chunks TTS contiguos se agrupan en un solo utterance (elimina las micro-pausas que sonaban robóticas).
- Teclado físico en escritorio: escribir directo en la frase (Espacio separa, Backspace borra, Enter habla).

> Lección: **las claves duplicadas en `{#each}` rompen el render.** La lista de palabras usaba `text + customVoice` como clave y al pulsar dos veces la misma tarjeta Svelte dejaba de renderizar lo siguiente. La clave por índice es estable porque la frase solo crece al final.

## Cierre del hito

Commits consolidados: `feat: per-card custom voice + long-press editor + sentence sync + audio cache`, `feat: TTS speed selector, physical keyboard, join consecutive TTS, stop fix`, `fix: reactive device mode + docs (Hito 6)`. README y README.en.md actualizados al estado del Hito 6.

En la siguiente parte, la sincronización offline-first y las estadísticas.
