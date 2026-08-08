---
title: "Deploying with GitHub Pages and GitHub Actions"
description: "A workflow that compiles the site and publishes it by itself, with every push to the main branch."
date: 2026-08-07
order: 9
series: web-personal
part: 9
tags: ["github pages", "github actions", "ci", "deploy"]
draft: false
---

GitHub Pages hosts static sites for free. And with GitHub Actions we can make it so every time you `push` to `main`, the site compiles and publishes **by itself**. Zero manual steps.

## The workflow

I created the file `.github/workflows/deploy.yml` in the repo:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          ASTRO_BASE: ${{ vars.ASTRO_BASE || '/repo/' }}
          SITE_URL: ${{ vars.SITE_URL }}
          SITE_NAME: ${{ secrets.SITE_NAME }}
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## How it works

1. `on.push.branches: [main]` → it triggers with every push to `main`.
2. It installs Node and the dependencies (`npm ci`).
3. `npm run build` generates the site in `dist/`, with the secrets and variables injected.
4. `upload-pages-artifact` uploads `dist/` as an artifact.
5. `deploy-pages` publishes it to GitHub Pages.

## Enabling Pages

In the repo: **Settings → Pages → Source: GitHub Actions**. From then on, the workflow has permission to publish.

## The `base` depending on the destination

- If you use `https://user.github.io/repo/`, the `ASTRO_BASE` variable must be `/repo/`.
- If you use a **custom domain**, it will be `/` (empty). That's the variable we set up in part 3; changing it and pushing is enough for the whole site to regenerate with the correct paths.

## What it looks like day to day

```bash
git add .
git commit -m "homepage improvement"
git push origin main
```

And in the **Actions** tab of the repo you can watch the workflow run. When it finishes, your change is live. In the next part, the finishing touch: the custom domain with Cloudflare.
