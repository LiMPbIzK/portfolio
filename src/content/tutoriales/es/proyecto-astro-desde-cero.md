---
title: "Proyecto Astro desde cero"
description: "Scaffold del proyecto, estructura de carpetas, .gitignore y una base configurable."
date: 2026-08-07
order: 3
series: web-personal
part: 3
tags: ["astro", "scaffold", "estructura"]
draft: false
---

Llegó el momento de crear el proyecto. Astro tiene un asistente que deja todo montado en un par de minutos.

## Crear el proyecto

Desde la carpeta donde quiero que viva el proyecto:

```bash
npm create -y astro@latest . -- --template minimal --install --no-git --typescript strict --yes
```

Detalle importante: usé `--no-git` para que Astro no inicialice Git por mí, porque yo ya tenía el repositorio preparado y prefiero controlar ese paso.

## Estructura que genera

```text
/
├── public/          → archivos estáticos (favicon, imágenes)
├── src/
│   └── pages/       → cada archivo .astro es una página
├── astro.config.mjs → configuración de Astro
├── package.json
├── tsconfig.json
└── .gitignore
```

Yo fui añadiendo a `src/` estas carpetas según las necesitaba: `components/`, `layouts/`, `styles/` y `scripts/`.

## Ajustar el .gitignore

Astro ya trae un buen `.gitignore` (`node_modules/`, `dist/`, `.astro/`). Añadí las variables de entorno para que nunca se suban datos sensibles:

```gitignore
# environment variables
.env
.env.*
!.env.example
```

## Hacer la base configurable

Este es un truco que luego me salvó el despliegue. La web se sirve en sitios distintos según el entorno: en el dominio propio va en la raíz `/`, pero en `https://usuario.github.io/repo/` va bajo una subcarpeta. Lo resolví leyendo una variable de entorno en la configuración:

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

Así, según el valor de `ASTRO_BASE` (vacío para un dominio propio, `/repo/` para GitHub Pages), todos los enlaces y recursos se generan con la ruta correcta.

## Probar que funciona

```bash
npm run dev
```

Se abre en `http://localhost:4321`. Cualquier cambio se ve al instante sin recargar. En la siguiente parte le damos identidad visual.
