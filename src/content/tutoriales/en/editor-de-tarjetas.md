---
title: "LeXi: the card editor with custom voice"
description: "Recording the family's voice with MediaRecorder, long-press editing, offline audio cache and word-by-word playback."
date: 2026-08-15
order: 6
series: proyecto-lexi
part: 6
tags: ["mediarecorder", "audio", "editor", "cache", "offline"]
draft: false
---

The real value of an AAC communicator is the **family's voice**: the "water" card should sound like mom, not like a robot. In milestone 6 we achieved it with MediaRecorder, 100% client-side.

## The recorder

`src/lib/recorder.ts` wraps MediaRecorder with format auto-detection (WebM/Opus or MP4/AAC depending on the browser), microphone permission handling and a duration limit that the server then enforces.

`RecorderButton.svelte` is the record/stop button with a timer, test playback and discard. It **emits the blob to the parent** via an `onrecorded` callback; the editor is the one that uploads to R2 on save.

## The editor and long-press

At first the editor had an "Add card" button, but the user rejected it: it looked wrong in demo mode. We replaced it with the natural AAC interaction:

- **Long press** (~500 ms) on a card → a floating context menu with "🎤 Add/Edit custom audio".
- It also works with **right-click** on desktop.
- On save, the card shows a **circular 🎤 badge** and an accent tint.
- In demo mode the menu does not open.

`CardEditor.svelte` saves the audio to IndexedDB, uploads the blob to R2 and updates the card's `audio_key`.

> Lesson: **`canEdit` cannot be computed only once on mount.** Astro Svelte islands are independent; when the user redeems a code in `ClaimDialog`, the grid did not find out. We solved it with a global `deviceMode` store in nanostores and a reactive `$effect`.

## Limits and demo mode

Two consecutive bugs:

- On mobile, a 2-second recording said "exceeds the max duration" → `MAX_RECORDING_MS` arrived as a string and broke the comparison. Fix: `Number()` with fallback and we raised the limit to 30s.
- The client trusted `localStorage` to know whether it could record. New endpoint **`GET /api/device/status`** that returns the real mode (demo/full) from the server, and `CardTile` receives `editable`.

> Lesson: **offline-first applies to edit mode too.** If the device is locally in `full` mode but offline, `refreshCanEdit` must still allow recording (a therapist without coverage cannot stay blocked); the server only enforces when there is a connection.

## Offline upload: the pending queue

If there is no network when recording, the blob is saved to IndexedDB (`uploads`) and the card ends up with `audio_key: pending:...`. When the network returns, `flushPendingUploads()` uploads to R2 and updates the card. And the audio is **cached on save** (`cacheAudioBlob`) so it plays offline from minute one.

## Word-by-word playback

On **Speak**, each word in the sentence plays its recorded audio or falls back to TTS:

- `playCardAudioEnd()` in `audio.ts` — plays and resolves when finished.
- `speakEnd()` in `tts.ts` — TTS that resolves at the end.
- `SentenceBar.speakSentence()` iterates the chunks with metadata (text, customVoice, audioKey).

> What we learned the hard way: **`pause()` does not fire the `ended` event.** The Stop button did not stop the sentence because the `for...await` loop kept queueing. Fix: a `playbackStop` flag (nanostore) that the loop checks on every iteration, and `stopActiveAudio()` that resolves the pending promise of `playCardAudioEnd`.

## Speed and physical keyboard

- `SpeedSelector.svelte`: 1x / 1.5x (default) / 2x, applied live (`setLiveRate`).
- **Joining consecutive TTS**: contiguous TTS chunks are grouped into a single utterance (removes the micro-pauses that sounded robotic).
- Physical keyboard on desktop: type directly into the sentence (Space separates, Backspace deletes, Enter speaks).

> Lesson: **duplicate keys in `{#each}` break rendering.** The word list used `text + customVoice` as the key and tapping the same card twice made Svelte stop rendering the rest. Index keys are stable because the sentence only grows at the end.

## Milestone wrap-up

Consolidated commits: `feat: per-card custom voice + long-press editor + sentence sync + audio cache`, `feat: TTS speed selector, physical keyboard, join consecutive TTS, stop fix`, `fix: reactive device mode + docs (Hito 6)`. README and README.en.md updated to milestone 6 state.

In the next part, offline-first sync and usage stats.
