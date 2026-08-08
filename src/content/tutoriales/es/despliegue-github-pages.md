---
title: "Despliegue con GitHub Pages y GitHub Actions"
description: "Un workflow que compila el sitio y lo publica solo, con cada push a la rama main."
date: 2026-08-07
order: 9
series: web-personal
part: 9
tags: ["github pages", "github actions", "ci", "deploy"]
draft: false
---

GitHub Pages aloja sitios estáticos gratis. Y con GitHub Actions podemos hacer que cada vez que hagas `push` a `main`, el sitio se compile y se publique **solo**. Cero pasos manuales.

## El workflow

Creé el archivo `.github/workflows/deploy.yml` en el repo:

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

## Cómo funciona

1. `on.push.branches: [main]` → se dispara con cada push a `main`.
2. Se instala Node y las dependencias (`npm ci`).
3. `npm run build` genera la web en `dist/`, con los secretos y variables inyectados.
4. `upload-pages-artifact` sube `dist/` como artefacto.
5. `deploy-pages` lo publica en GitHub Pages.

## Activar Pages

En el repo: **Settings → Pages → Source: GitHub Actions**. A partir de ahí, el workflow tiene permiso para publicar.

## La `base` según el destino

- Si usas `https://usuario.github.io/repo/`, la variable `ASTRO_BASE` debe ser `/repo/`.
- Si usas un **dominio propio**, será `/` (vacía). Es la variable que montamos en la parte 3; cambiarla y hacer push es suficiente para que todo el sitio se genere con las rutas correctas.

## Cómo se ve en el día a día

```bash
git add .
git commit -m "mejora en la portada"
git push origin main
```

Y en la pestaña **Actions** del repo ves el workflow ejecutándose. Cuando termina, tu cambio está online. En la siguiente parte, el toque final: el dominio propio con Cloudflare.
