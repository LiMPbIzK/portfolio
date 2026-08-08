---
title: "Keeping private data out of the repo"
description: "Environment variables, .env, secrets and GitHub Actions variables: content visible on the site, invisible in the code."
date: 2026-08-07
order: 6
series: web-personal
part: 6
tags: ["privacy", "env", "secrets", "github actions"]
draft: false
---

My name, email or links are going to be visible on the website (that's the point). But the repository is public, and I didn't want personal data to live inside the source code. The solution was **environment variables**.

## The idea in one sentence

The data is injected at build time: locally, from a `.env` file that is never committed; in production, from the GitHub Actions secrets. The repository only contains variable names and placeholders.

## Locally: `.env` + `.env.example`

The `.env` file with my real data (ignored by Git):

```bash
SITE_NAME="Your Name"
SITE_ROLE="Developer"
SITE_EMAIL="contact@yourdomain.com"
SITE_GITHUB_USER="your-user"
SITE_GITHUB_URL="https://github.com/your-user"
SITE_LINKEDIN_URL="https://www.linkedin.com/in/your-user/"
SITE_URL="https://yourdomain.com"
```

And its template `.env.example` with the same names but example values. This one **is** committed, so anyone who clones the project knows which variables they need:

```bash
SITE_NAME="Your Name"
SITE_EMAIL="you@yourdomain.com"
```

## Reading them in Astro

In the *frontmatter* of any `.astro` (the part between `---`) I read them with `import.meta.env`:

```astro
---
const siteName = import.meta.env.SITE_NAME ?? 'Portfolio';
---
<h1>Hi, I'm {siteName}</h1>
```

Because the variables **don't** have the `PUBLIC_` prefix, they are only used at build time (server-side) and never leak into the browser's JavaScript.

## In production: GitHub Actions

The deployment runs in GitHub's cloud, so I pass the values from the **secrets** (for data) and **variables** (for build config). The workflow only mentions the names:

```yaml
env:
  SITE_URL: ${{ vars.SITE_URL }}
  SITE_NAME: ${{ secrets.SITE_NAME }}
  SITE_EMAIL: ${{ secrets.SITE_EMAIL }}
```

In the repository: **Settings → Secrets and variables → Actions**.

## What this gets you

- The public repo only has `.env.example` with placeholders → zero personal data in the code.
- The deployed site shows the real data because the CI injects it at build time.
- To change the email you don't touch code: just the secret on GitHub.

In the next part, automatically loading projects from the GitHub API.
