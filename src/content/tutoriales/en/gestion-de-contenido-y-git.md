---
title: "Content management and the Git workflow"
description: "How a static site gets updated without an admin panel, with Git as the only engine."
date: 2026-08-07
order: 11
series: web-personal
part: 11
tags: ["git", "content", "workflow"]
draft: false
---

A static site has no admin panel, but that doesn't mean it's frozen. The "panel" is the repository itself: you edit, you commit, and the site updates by itself. It's the part I like the most about this workflow.

## The lifecycle

```bash
# 1. See what has changed
git status

# 2. Add the files to the "stage"
git add .

# 3. Review what is going to be committed
git diff --cached --stat

# 4. Save the snapshot
git commit -m "description of the change"

# 5. Push to GitHub → the workflow compiles and publishes
git push origin main
```

If you work locally, before each commit you can preview with `npm run dev` and see the changes instantly in the browser.

## Types of content and how they get updated

**Static content (pages).** You edit the relevant `.astro` or `.md` and push. A text change in "About" is editing one line and pushing.

**Projects.** Nothing to touch: they are read from the GitHub API. Create a new repo on GitHub and, on the next visit, it already appears on the site (with its 24-hour cache).

**Tutorials / articles.** They are Markdown files in `src/content/tutoriales/`. Adding a new one is creating a `.md`, and the site publishes it automatically.

## Editing from anywhere

You don't need the project on your computer: on **github.com** you can open any file and press **edit** (or create a new one with "Add file"). Saving makes a commit, and the implicit push triggers the deployment. Ideal for quick fixes from your phone.

## Frequent commits

At first I was lazy about making small commits, but it helps a lot: each change stays isolated and, if something breaks, you find the culprit right away. A good habit is one commit per finished idea or component, with descriptive messages.

## What you need to remember

- `git status` and `git diff` are your friends: always look at **what** you're about to save before committing.
- The `.env` is never committed; personal data lives locally and in the GitHub secrets.
- Every push to `main` = a new published version. No exceptions.

And with this the guide ends. You've walked the same path as me: an Astro project, a personal website with your live projects, careful SEO, deployed on GitHub Pages and served under your own domain on Cloudflare. Now comes the best part: **stay curious** and try new things.
