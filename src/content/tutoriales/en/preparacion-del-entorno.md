---
title: "Preparing the environment"
description: "Node.js, Git and the GitHub repository ready before writing a single line of Astro."
date: 2026-08-07
order: 2
series: web-personal
part: 2
tags: ["git", "github", "node", "environment"]
draft: false
---

Before touching the project, I prepared the environment. It's boring but it saves you headaches later: if Git and Node are not set up properly, things fail in weird, hard-to-understand ways.

## Node.js and npm

Astro needs a recent Node.js. I checked it in the terminal:

```bash
node --version
npm --version
```

In my case: `v22.23.2` and `10.9.8`. If you don't have it, install it from nodejs.org and check again.

## Git

It's also a good idea for Git to know who you are for commits:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

> A detail that surprised me: when using a folder on another drive (`J:\`), Git returned `detected dubious ownership`. The fix is to add that folder as a *safe directory*:
>
> ```bash
> git config --global --add safe.directory J:/path/to/project
> ```

## The repository on GitHub

I created the repository on GitHub (public, `main` branch by default). Then, from the project folder, I connected it:

```bash
git init -b main
git remote add origin https://github.com/your-user/your-repo.git
```

The `-b main` creates the branch with the name GitHub uses by default, so there are no surprises when pushing.

> **Privacy tip:** if the repo is going to be public, on GitHub you can use the *noreply* email so your personal email never appears in the commit history:
>
> ```bash
> git config user.email "12345678+your-user@users.noreply.github.com"
> ```

With the environment ready, in the next part we create the Astro project.
