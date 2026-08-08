---
title: "Datos privados fuera del repo"
description: "Variables de entorno, .env, secretos y variables de GitHub Actions: contenido visible en la web, invisible en el código."
date: 2026-08-07
order: 6
series: web-personal
part: 6
tags: ["privacidad", "env", "secretos", "github actions"]
draft: false
---

Mi nombre, email o enlaces van a verse en la web (es lo que toca). Pero el repositorio es público, y yo no quería que los datos personales vivieran dentro del código fuente. La solución fueron **variables de entorno**.

## La idea en una frase

Los datos se inyectan en el momento de compilar: en local, desde un archivo `.env` que no se sube; en producción, desde los secretos de GitHub Actions. El repositorio solo contiene nombres de variables y placeholders.

## En local: `.env` + `.env.example`

El archivo `.env` con mis datos reales (ignorado por Git):

```bash
SITE_NAME="Tu Nombre"
SITE_ROLE="Desarrollador"
SITE_EMAIL="contacto@tudominio.com"
SITE_GITHUB_USER="tu-usuario"
SITE_GITHUB_URL="https://github.com/tu-usuario"
SITE_LINKEDIN_URL="https://www.linkedin.com/in/tu-usuario/"
SITE_URL="https://tudominio.com"
```

Y su plantilla `.env.example` con los mismos nombres pero valores de ejemplo. Esta **sí** se sube, para que cualquiera que clone el proyecto sepa qué variables necesita:

```bash
SITE_NAME="Tu Nombre"
SITE_EMAIL="tucorreo@tudominio.com"
```

## Leerlas en Astro

En el *frontmatter* de cualquier `.astro` (la parte entre `---`) las leo con `import.meta.env`:

```astro
---
const siteName = import.meta.env.SITE_NAME ?? 'Portfolio';
---
<h1>Hola, soy {siteName}</h1>
```

Como las variables **no** llevan el prefijo `PUBLIC_`, solo se usan en el build (server-side) y no se filtran al JavaScript del navegador.

## En producción: GitHub Actions

El despliegue ocurre en la nube de GitHub, así que los valores se los paso desde los **secretos** (para datos) y **variables** (para config de build). El workflow solo menciona los nombres:

```yaml
env:
  SITE_URL: ${{ vars.SITE_URL }}
  SITE_NAME: ${{ secrets.SITE_NAME }}
  SITE_EMAIL: ${{ secrets.SITE_EMAIL }}
```

En el repositorio: **Settings → Secrets and variables → Actions**.

## Qué consigue esto

- El repo público solo tiene `.env.example` con placeholders → cero datos personales en el código.
- La web desplegada muestra los datos reales porque el CI los inyecta al compilar.
- Para cambiar el email no hay que tocar código: solo el secreto en GitHub.

En la siguiente parte, la carga automática de proyectos desde la API de GitHub.
