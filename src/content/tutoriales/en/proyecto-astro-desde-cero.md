---
title: "Astro project from scratch"
description: "Project scaffold, folder structure, .gitignore and a configurable base."
date: 2026-08-07
order: 3
series: web-personal
part: 3
tags: ["astro", "scaffold", "structure"]
draft: false
---

Time to create the project. Astro has a wizard that sets everything up in a couple of minutes.

## Creating the project

From the folder where I want the project to live:

```bash
npm create -y astro@latest . -- --template minimal --install --no-git --typescript strict --yes
```

Important detail: I used `--no-git` so Astro doesn't initialize Git for me, because I already had the repository prepared and prefer to control that step.

## The structure it generates

```text
/
├── public/          → static files (favicon, images)
├── src/
│   └── pages/       → each .astro file is a page
├── astro.config.mjs → Astro configuration
├── package.json
├── tsconfig.json
└── .gitignore
```

I later added these folders to `src/` as I needed them: `components/`, `layouts/`, `styles/` and `scripts/`.

## Adjusting the .gitignore

Astro already ships a good `.gitignore` (`node_modules/`, `dist/`, `.astro/`). I added the environment variables so sensitive data never gets committed:

```gitignore
# environment variables
.env
.env.*
!.env.example
```

## Making the base configurable

This is a trick that later saved the deployment. The site is served from different places depending on the environment: on the custom domain it lives at the root `/`, but on `https://user.github.io/repo/` it lives under a subfolder. I solved it by reading an environment variable in the config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

export default defineConfig({
  site: process.env.SITE_URL ?? env.SITE_URL ?? 'http://localhost:4321',
  base: process.env.ASTRO_BASE ?? env.ASTRO_BASE ?? '',
});
```

That way, depending on the value of `ASTRO_BASE` (empty for a custom domain, `/repo/` for GitHub Pages), all links and assets are generated with the correct path.

## Testing that it works

```bash
npm run dev
```

It opens at `http://localhost:4321`. Any change is visible instantly without reloading. In the next part we give it a visual identity.
