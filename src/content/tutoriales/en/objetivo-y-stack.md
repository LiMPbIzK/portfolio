---
title: "Goal and stack decisions"
description: "Why Astro, GitHub Pages and Cloudflare, and what you need before starting."
date: 2026-08-07
order: 1
series: web-personal
part: 1
tags: ["astro", "planning", "personal website"]
draft: false
---

I have always enjoyed figuring out how things work on my own. When I decided to have a personal website to show my projects, I set out not to use filler templates: I wanted to build it from scratch, learn along the way and, when finished, be able to teach others how to do the same.

This guide is exactly that: the journey I took, the decisions I made, the code I wrote and the problems I ran into (and how I solved them).

## What I wanted to achieve

1. A simple, fast, multi-page personal website.
2. Automatically show the projects from my GitHub profile.
3. No admin panels or databases.
4. Hosted for free, on my own domain.
5. Without exposing my personal data in the public code.

## Why Astro

The "multi-page" and "fast" requirements pointed to a static site. I compared several options:

| Option | Pros | Cons |
| --- | --- | --- |
| Plain HTML/CSS/JS | Zero dependencies | Layout duplicated on every page, manual build |
| **Astro** | Generates real static HTML, `.astro` components, JS only where needed | Small learning curve for `.astro` |
| React + Vite | Huge ecosystem | Heavier SPA, worse SEO by default |
| Next.js | Full-stack | Overkill for a portfolio |

I chose **Astro**: it generates static HTML pages (perfect for GitHub Pages), lets you reuse headers/footers with components, and only loads JavaScript where you actually need it.

## Why GitHub Pages + Cloudflare

- **GitHub Pages** hosts static sites for free and updates automatically with every push to the `main` branch.
- **Cloudflare** was already my domain's DNS provider. It acts as a "proxy" to serve GitHub Pages content under my own domain without changing the URL.

## Requirements

- **Node.js** ≥ 22 and **npm** (for Astro).
- **Git** with your user configured.
- A **GitHub** account and the domain on **Cloudflare**.

In the next part I prepare the environment and create the repository.
