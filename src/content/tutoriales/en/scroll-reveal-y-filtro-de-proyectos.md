---
title: "Scroll reveal and project filters"
description: "Animate elements as they appear on scroll with IntersectionObserver and add technology and ordering filters to the project list."
date: 2026-08-07
order: 14
series: web-personal
part: 14
tags: ["intersectionobserver", "scroll", "filters", "projects", "javascript"]
draft: false
---

Last part of the polish: elements appear with a small movement as you scroll, and the project list can be filtered and sorted. The most interesting bugs of the whole series also showed up here.

## Scroll reveal with IntersectionObserver

The idea is simple: elements with `data-reveal` start invisible and, when they enter the viewport, the `is-visible` class is added to trigger the transition:

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

[data-reveal].is-visible {
  opacity: 1;
  transform: none;
}
```

The observer watches all the marked elements:

```ts
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

function observeAll() {
  for (const el of document.querySelectorAll('[data-reveal]')) {
    if (!el.classList.contains('is-visible')) observer.observe(el);
  }
}
```

So that elements created later (the project cards arrive with `fetch`) also animate, a `MutationObserver` re-scans the document when it changes:

```ts
const mutationObserver = new MutationObserver(observeAll);
mutationObserver.observe(document.body, { childList: true, subtree: true });
```

And with the page transitions, it re-observes on every navigation:

```ts
document.addEventListener('astro:page-load', observeAll);
```

## Don't forget `prefers-reduced-motion`

If the user is bothered by motion, everything shows directly:

```css
@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
  }
}
```

## The "ghost card" bug

First lesson: at first I put `data-reveal` on every project card. But the cards are re-rendered every time you filter, and the new ones stayed at `opacity: 0` waiting for the observer to animate them... which didn't always happen. Result: when you pressed a filter, the cards disappeared and didn't come back until you changed page.

The fix was to reveal the `#projects` container once, not each card. Re-rendered cards always paint visible:

```html
<div id="projects" data-reveal aria-live="polite"></div>
```

> Lesson: reveal is good for static content. For content re-rendered by JavaScript, better apply it to the container, or you'll have invisible content waiting for an observer that already did its job.

## Filtering by technology with chips

The projects are loaded from the GitHub API. With that list in memory, the filter chips are generated dynamically:

```js
const languages = Array.from(new Set(repos.map((r) => r.language).filter(Boolean))).sort();

// chips: ["All", ...languages]
```

Each chip is a button with `aria-pressed` to indicate the selected state:

```js
button.addEventListener('click', () => {
  language = value;
  // update aria-pressed on all chips
  render();
});
```

## Sorting

A `<select>` lets you sort by recent, stars or name. The same `render()` function filters and sorts over the in-memory list, without calling the API again:

```js
function render() {
  const filtered = repos.filter(
    (repo) => language === 'all' || repo.language === language
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'stars') return b.stargazers_count - a.stargazers_count;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  container.innerHTML = sorted.map(projectCard).join('');
}
```

## The stale container bug

Second lesson, this time with View Transitions: at first the script saved the `#projects` element in a variable **only once**. When you navigated back to the page, the DOM had been replaced and that reference pointed to an element that no longer existed; the projects didn't load.

The fix was to query the element fresh every time it's needed:

```js
function getContainer() {
  return document.querySelector('#projects');
}
```

> Lesson: with View Transitions, any reference to DOM nodes must be queried at the moment of use, not saved when the module loads.

And one last recommendation: the load should trigger both on page load and after `astro:after-swap` and `astro:page-load`, with a guard so it doesn't paint twice if there are already cards.

With this, the site was complete: personal, with dark mode, animated, deployed and documented part by part. End of the series!
