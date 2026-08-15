---
title: "LeXi: the ARASAAC seed, a preloaded catalog"
description: "Downloading ARASAAC pictograms, generating a manifest and an idempotent SQL, and detecting changes in CI."
date: 2026-08-15
order: 4
series: proyecto-lexi
part: 4
tags: ["arasaac", "seed", "pictograms", "ci", "data"]
draft: false
---

LeXi needs a base pictogram catalog so the app works from the very first second, even offline. **ARASAAC** symbols are the reference for augmentative communication in Spanish, distributed under CC BY-NC-SA 4.0 (attribution required).

## The problem: the API does not serve images

I researched ARASAAC thoroughly before writing a single line:

- The search API works: `GET /v1/pictograms/es/search/{term}` returns JSON metadata.
- **Downloading images via the API does not work** (`?downloadType=png` → 400).
- What is reliable is the **static CDN**: `https://static.arasaac.org/pictograms/{id}/{id}_500.png` (PNG only, in 300/500; JPG and SVG return 404).

> Lesson: **before building a scraping pipeline, check the real data source.** The API looked nice on paper but was useless for what we needed; the static CDN was the stable path.

## The strategy: seed at build time, not runtime

Key decision: the catalog is **downloaded and committed** to the repo. This way:

- The app works 100% offline from minute one.
- Zero ARASAAC calls at runtime.
- The vocabulary is **editable** (pictograms do not change; the text does).

Structure:

- `data/core-vocab.es.json` — 8 categories, 285 terms, with an `overrides` block.
- `scripts/seed-arasaac.mjs` — searches the API, downloads from the CDN, generates manifest + SQL.
- `public/assets/arasaac/` — 286 500px PNGs (~4.9 MB) committed.
- `migrations/0002_seed_arasaac.sql` — idempotent seed (`INSERT OR IGNORE`, `user_id = NULL` → global catalog).

## Vocabulary failures and overrides

Generating the seed produced wrong matches: `té` → "tres en raya" (tictac-toe), `feliz` → "Merry Christmas!", `¿qué?` → "bon appétit!". I fixed them with an `overrides` block mapping the term to an alternative search:

```json
{
  "overrides": {
    "¿por qué?": "porque",
    "sentarse": "sentar en circulo"
  }
}
```

Other issues: reflexive verbs ("levantarse", "lavarse") return 404 → fallback to the base form; and terms like `algo` have no pictogram → removed from the vocabulary.

> What we learned the hard way: **the card id must derive from the term, not the pictogram.** `lavar` and `lavarse` share a pictogram; if the key was the image id, cards collided (287 in the manifest vs 281 in D1).

## The `--check` mode for CI

To avoid constantly re-running the seed, the script has two modes: `--download` regenerates, and `--check` compares the regenerated manifest against the committed one. A GitHub Actions workflow runs it and only regenerates when there are changes.

> Lesson: **GitHub Actions with `bash -e` kills the step when `node --check` exits with code 1** (which is exactly when there are changes). The first workflow version never ran the conditional step. And a gitignored `.arasaac-hash` made CI always see "changed". The fix was comparing the committed manifest (which does exist in CI) and capturing the exit code with `set +e`.

## Wrap-up

- Commit `feat: ARASAAC core seed (285 cards, script + CI)`.
- Applied remotely with `npm run db:remote`.
- The app footer includes the required ARASAAC attribution and license.

In the next part, the card grid, the on-screen keyboard and TTS.
