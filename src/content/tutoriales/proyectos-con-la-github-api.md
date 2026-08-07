---
title: "Proyectos con la GitHub API"
description: "Cargar los repositorios en vivo, cachear en el navegador y manejar los estados de carga y error."
date: 2026-08-07
order: 7
series: web-personal
part: 7
tags: ["github api", "javascript", "fetch", "cache"]
draft: false
---

Lo mejor de una web personal es no tener que actualizar los proyectos a mano: la página los lee directamente de GitHub.

## El endpoint

La API pública de GitHub permite listar los repos de un usuario:

```
https://api.github.com/users/tu-usuario/repos?per_page=100&sort=updated
```

Devuelve un JSON con todos los repos y sus metadatos: nombre, descripción, lenguaje, estrellas, forks, enlace...

## El módulo `github.ts`

Un archivo con la lógica, tipado con TypeScript y con cache para no llamar a la API más de lo necesario (la versión sin autenticar tiene límite de peticiones por hora):

```ts
export async function getRepos(username: string) {
  const cacheKey = `github-repos:${username}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
  );
  if (!response.ok) throw new Error(`GitHub API: ${response.status}`);

  const repos = await response.json();
  writeCache(cacheKey, repos);
  return repos;
}
```

El cache guarda el resultado en `localStorage` con una marca de tiempo y lo invalida a las 24 horas:

```ts
const TTL = 24 * 60 * 60 * 1000;

function readCache(key: string) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (Date.now() - data.fetchedAt > TTL) {
    localStorage.removeItem(key);
    return null;
  }
  return data.repos;
}

function writeCache(key: string, repos: unknown[]) {
  localStorage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), repos }));
}
```

## La página de proyectos

La página muestra un estado inicial "Cargando…", y luego tarjetas. Si algo falla, muestra un mensaje con un botón para reintentar. Todo con un `<script>` en la página:

```astro
<script>
  import { getRepos } from '../scripts/github';

  const container = document.querySelector('#projects');
  const username = container?.getAttribute('data-username') ?? '';

  async function load() {
    if (!username) {
      setStatus('No se ha configurado el usuario de GitHub.');
      return;
    }
    try {
      const repos = await getRepos(username);
      renderCards(repos);
    } catch {
      setStatus('No se pudieron cargar los proyectos. Reintenta más tarde.');
    }
  }

  void load();
</script>
```

El nombre de usuario se pasa sin hardcodear en el JS, mediante un atributo `data-username` que el servidor rellena desde la variable de entorno.

> **Detalle de seguridad:** al pintar datos que vienen de fuera (la API) con `innerHTML`, siempre sanitizo el texto para escapar `<`, `>`, `&`... así un nombre raro de repo no se convierte en HTML malicioso.

En la siguiente parte, todo lo que los buscadores necesitan para encontrar la web.
