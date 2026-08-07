---
title: "Gestión de contenido y flujo Git"
description: "Cómo se actualiza una web estática sin panel de administración, con Git como único motor."
date: 2026-08-07
order: 11
series: web-personal
part: 11
tags: ["git", "contenido", "workflow"]
draft: false
---

Una web estática no tiene panel de administración, pero eso no significa que esté congelada. El "panel" es el propio repositorio: editas, haces commit y el sitio se actualiza solo. Es la parte que más me gusta del flujo.

## El ciclo de vida

```bash
# 1. Ver qué ha cambiado
git status

# 2. Añadir los archivos al "escenario"
git add .

# 3. Revisar qué se va a commitear
git diff --cached --stat

# 4. Guardar el snapshot
git commit -m "descripción del cambio"

# 5. Subir a GitHub → el workflow compila y publica
git push origin main
```

Si trabajas en local, antes de cada commit puedes previsualizar con `npm run dev` y ver los cambios al instante en el navegador.

## Tipos de contenido y cómo se actualizan

**Contenido estático (páginas).** Se edita el `.astro` o el `.md` correspondiente y se sube. Un cambio de texto en "Sobre mí" es editar una línea y hacer push.

**Proyectos.** No hay que tocar nada: se leen de la API de GitHub. Creas un repo nuevo en GitHub y, la próxima visita, ya aparece en la web (con su cache de 24 horas).

**Tutoriales / artículos.** Son archivos Markdown en `src/content/tutoriales/`. Añadir uno nuevo es crear un `.md`, y el sitio lo publica automáticamente.

## Editar desde cualquier sitio

No hace falta tener el proyecto en el ordenador: en **github.com** puedes abrir cualquier archivo y pulsar **editar** (o crear uno nuevo con "Add file"). Al guardar se hace commit, y el push implícito dispara el despliegue. Ideal para retoques desde el móvil.

## Commits frecuentes

Al principio me daba pereza hacer commits pequeños, pero ayuda muchísimo: cada cambio queda aislado y, si algo se rompe, encuentras el culpable al momento. Un buen hábito es un commit por cada idea o componente terminado, con mensajes descriptivos.

## Qué necesitas recordar

- `git status` y `git diff` son tus amigos: siempre mira **qué** vas a guardar antes de commitear.
- El `.env` nunca se sube; los datos personales viven en local y en los secretos de GitHub.
- Cada push a `main` = nueva versión publicada. Sin excepciones.

Y con esto termina la guía. Has recorrido el mismo camino que yo: un proyecto Astro, una web personal con tus proyectos en vivo, SEO cuidado, desplegada en GitHub Pages y servida bajo tu propio dominio en Cloudflare. Ahora toca lo mejor: **seguir siendo curioso** y probar cosas nuevas.
