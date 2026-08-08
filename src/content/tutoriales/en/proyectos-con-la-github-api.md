---
title: "Projects with the GitHub API"
description: "Load the repositories live, cache them in the browser and handle loading and error states."
date: 2026-08-07
order: 7
series: web-personal
part: 7
tags: ["github api", "javascript", "fetch", "cache"]
draft: false
---

The best thing about a personal website is not having to update projects by hand: the page reads them straight from GitHub.

## The endpoint

The public GitHub API lets you list a user's repos:

```
https://api.github.com/users/your-user/repos?per_page=100&sort=updated
```

It returns JSON with all the repos and their metadata: name, description, language, stars, forks, link...

## The `github.ts` module

A file with the logic, typed with TypeScript and with a cache so we don't call the API more than necessary (the unauthenticated version has a requests-per-hour limit):

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

The cache stores the result in `localStorage` with a timestamp and invalidates it after 24 hours:

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

## The projects page

The page shows an initial "Loading…" state, then the cards. If something fails, it shows a message with a retry button. All of it in a `<script>` on the page:

```astro
<script>
  import { getRepos } from '../scripts/github';

  const container = document.querySelector('#projects');
  const username = container?.getAttribute('data-username') ?? '';

  async function load() {
    if (!username) {
      setStatus('The GitHub user is not configured.');
      return;
    }
    try {
      const repos = await getRepos(username);
      renderCards(repos);
    } catch {
      setStatus('Couldn\'t load the projects. Try again later.');
    }
  }

  void load();
</script>
```

The username is passed without hardcoding it in the JS, through a `data-username` attribute that the server fills from the environment variable.

> **Security detail:** when painting data that comes from outside (the API) with `innerHTML`, I always sanitize the text to escape `<`, `>`, `&`... so a weird repo name can't turn into malicious HTML.

In the next part, everything search engines need to find the site.
