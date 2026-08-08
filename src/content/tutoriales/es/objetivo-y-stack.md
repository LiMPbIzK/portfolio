---
title: "Objetivo y decisiones de stack"
description: "Por qué Astro, GitHub Pages y Cloudflare, y qué necesitas antes de empezar."
date: 2026-08-07
order: 1
series: web-personal
part: 1
tags: ["astro", "planificación", "web personal"]
draft: false
---

Siempre me ha gustado entender cómo funcionan las cosas por mi cuenta. Cuando decidí tener una web personal para mostrar mis proyectos, me propuse no usar plantillas de relleno: quería montarla desde cero, aprender por el camino y, al terminar, poder enseñarle a otros cómo hacer lo mismo.

Esta guía es exactamente eso: el recorrido que hice, con las decisiones que tomé, el código que escribí y los problemas con los que me topé (y cómo los resolví).

## Qué quería conseguir

1. Una web personal sencilla, rápida y con varias páginas.
2. Mostrar automáticamente los proyectos de mi perfil de GitHub.
3. Sin paneles de administración ni bases de datos.
4. Alojada gratis, en mi propio dominio.
5. Sin exponer mis datos personales en el código público.

## Por qué Astro

El requisito de "varias páginas" y "rápida" apuntaba a un sitio estático. Comparé varias opciones:

| Opción | Pro | Contra |
| --- | --- | --- |
| HTML/CSS/JS a pelo | Cero dependencias | Layout duplicado en cada página, build manual |
| **Astro** | Genera HTML estático real, componentes `.astro`, JS solo donde hace falta | Curva pequeña de aprender `.astro` |
| React + Vite | Ecosistema enorme | SPA más pesada, peor para SEO por defecto |
| Next.js | Full-stack | Sobrecargado para un portafolio |

Elegí **Astro**: genera páginas HTML estáticas (perfecto para GitHub Pages), permite reutilizar cabeceras/pies con componentes y solo carga JavaScript donde de verdad lo necesitas.

## Por qué GitHub Pages + Cloudflare

- **GitHub Pages** aloja sitios estáticos gratis y se actualiza solo con cada push a la rama `main`.
- **Cloudflare** era ya el proveedor DNS de mi dominio. Sirve de "proxy" para mostrar el contenido de GitHub Pages bajo mi propio dominio sin cambiar la URL.

## Requisitos

- **Node.js** ≥ 22 y **npm** (para Astro).
- **Git** con tu usuario configurado.
- Una cuenta en **GitHub** y el dominio en **Cloudflare**.

En la siguiente parte preparo el entorno y creo el repositorio.
