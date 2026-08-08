---
title: "Custom domain on Cloudflare"
description: "Connect your domain to GitHub Pages without changing the URL, and the two typical errors you'll run into."
date: 2026-08-07
order: 10
series: web-personal
part: 10
tags: ["cloudflare", "dns", "domain", "https"]
draft: false
---

Having the site at `user.github.io/repo/` is fine, but a custom domain looks much better. The good thing about using **Cloudflare** is that it can serve the GitHub Pages content under your domain **without changing the URL in the browser**.

## The idea: proxy, not redirect

If you do a *redirect* (301/302), the browser ends up showing `user.github.io`. To keep it on `yourdomain.com`, what you need is for Cloudflare to **serve** the content as if it were yours: a CNAME record with Cloudflare's proxy enabled.

## Step 1: the domain on GitHub

In the repo: **Settings → Pages → Custom domain**: type your domain and save. GitHub may ask for a **TXT verification record** (`_github-pages-challenge-your-user.yourdomain.com`) with a code; you add it in Cloudflare and then press **Verify**.

## Step 2: the DNS records on Cloudflare

In **Cloudflare → DNS → Records**, add:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | `yourdomain.com` | `your-user.github.io` | DNS only (grey) |
| CNAME | `www` | `your-user.github.io` | DNS only (grey) |

> ⚠️ **This is where I hit the first error.** GitHub checks that the domain resolves to its servers. If the CNAME has the proxy enabled (orange cloud), the DNS answers with Cloudflare's IPs and GitHub rejects it with *"DNS check unsuccessful"*. **The fix:** leave the record in **DNS only (grey)**. GitHub still provides the HTTPS.

## Step 3: SSL/TLS

- In Cloudflare: **SSL/TLS → Overview → Full**.
- In GitHub: after verification, enable **Enforce HTTPS**.

## Typical errors I found

**1. "DNS check unsuccessful"** — the record points somewhere wrong or has the proxy enabled. Fix: CNAME in grey pointing to `your-user.github.io`, and wait for the DNS to propagate.

**2. "Content for CNAME record is invalid"** — in the record's target I wrote `https://...` or a path. Cloudflare only accepts the bare hostname: `your-user.github.io`.

**3. The URL doesn't change but the site doesn't load** — check the SSL mode in Cloudflare; it must be **Full**, not Flexible.

## Updating the deployment variables

With a custom domain, the site is served at the root. I changed the GitHub Actions variables:

- `ASTRO_BASE` → `/`
- `SITE_URL` → `https://yourdomain.com`

A `git push` and the CI regenerates everything with the correct paths. Result: your site at **https://yourdomain.com**, with `www` working.

In the last part, how to keep managing content without a panel and the Git workflow.
