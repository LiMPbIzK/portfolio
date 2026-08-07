---
title: "Preparación del entorno"
description: "Node.js, Git y el repositorio en GitHub listos antes de escribir una línea de Astro."
date: 2026-08-07
order: 2
series: web-personal
part: 2
tags: ["git", "github", "node", "entorno"]
draft: false
---

Antes de tocar el proyecto, dejé el entorno preparado. Es aburrido pero te ahorra sustos después: si Git y Node no están bien configurados, las cosas fallan de formas raras y difíciles de entender.

## Node.js y npm

Astro necesita Node.js reciente. Lo comprobé en la terminal:

```bash
node --version
npm --version
```

En mi caso: `v22.23.2` y `10.9.8`. Si no lo tienes, instálalo desde nodejs.org y vuelve a comprobarlo.

## Git

También conviene que Git sepa quién eres para los commits:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

> Un detalle que me sorprendió: al usar una carpeta en otra unidad (`J:\`), Git me devolvía `detected dubious ownership`. La solución es añadir esa carpeta como *safe directory*:
>
> ```bash
> git config --global --add safe.directory J:/ruta/del/proyecto
> ```

## El repositorio en GitHub

Creé el repositorio en GitHub (público, rama `main` por defecto). Después, desde la carpeta del proyecto, lo conecté:

```bash
git init -b main
git remote add origin https://github.com/tu-usuario/tu-repo.git
```

El `-b main` crea la rama con el nombre que usa GitHub por defecto, así no hay sorpresas al hacer `push`.

> **Consejo de privacidad:** si el repo va a ser público, en GitHub puedes usar el email *noreply* para que tu email personal no aparezca en el historial de commits:
>
> ```bash
> git config user.email "12345678+tu-usuario@users.noreply.github.com"
> ```

Con el entorno listo, en la siguiente parte creamos el proyecto Astro.
