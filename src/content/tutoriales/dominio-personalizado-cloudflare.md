---
title: "Dominio personalizado en Cloudflare"
description: "Conectar tu dominio a GitHub Pages sin cambiar la URL, y los dos errores típicos que te vas a encontrar."
date: 2026-08-07
order: 10
series: web-personal
part: 10
tags: ["cloudflare", "dns", "dominio", "https"]
draft: false
---

Tener la web en `usuario.github.io/repo/` está bien, pero un dominio propio queda mucho mejor. La parte buena de usar **Cloudflare** es que puede servir el contenido de GitHub Pages bajo tu dominio **sin cambiar la URL en el navegador**.

## La idea: proxy, no redirección

Si haces una *redirección* (301/302), el navegador acaba mostrando `usuario.github.io`. Para que se quede en `tudominio.com`, lo que hay que hacer es que Cloudflare **sirva** el contenido como si fuera tuyo: un registro CNAME con el proxy de Cloudflare activo.

## Paso 1: el dominio en GitHub

En el repo: **Settings → Pages → Custom domain**: escribe tu dominio y guarda. GitHub puede pedirte un registro **TXT de verificación** (`_github-pages-challenge-tu-usuario.tudominio.com`) con un código; se añade en Cloudflare y luego pulsas **Verify**.

## Paso 2: los registros DNS en Cloudflare

En **Cloudflare → DNS → Records**, añade:

| Tipo | Nombre | Destino | Proxy |
| --- | --- | --- | --- |
| CNAME | `tudominio.com` | `tu-usuario.github.io` | DNS only (gris) |
| CNAME | `www` | `tu-usuario.github.io` | DNS only (gris) |

> ⚠️ **Aquí me topé con el primer error.** GitHub comprueba que el dominio resuelva a sus servidores. Si el CNAME está con el proxy activo (nube naranja), el DNS responde con las IPs de Cloudflare y GitHub lo rechaza con *"DNS check unsuccessful"*. **La solución:** dejar el registro en **DNS only (gris)**. El HTTPS lo da GitHub igualmente.

## Paso 3: SSL/TLS

- En Cloudflare: **SSL/TLS → Overview → Full**.
- En GitHub: tras la verificación, activa **Enforce HTTPS**.

## Errores típicos que encontré

**1. "DNS check unsuccessful"** — el registro apunta mal o está con proxy activo. Solución: CNAME en gris hacia `tu-usuario.github.io`, y esperar a que el DNS propague.

**2. "Content for CNAME record is invalid"** — en el destino del registro puse `https://...` o una ruta. Cloudflare solo acepta el hostname pelado: `tu-usuario.github.io`.

**3. La URL no cambia pero el sitio no carga** — revisa el modo SSL en Cloudflare; tiene que ser **Full**, no Flexible.

## Actualizar las variables del despliegue

Con dominio propio, el sitio se sirve en la raíz. Cambié las variables de GitHub Actions:

- `ASTRO_BASE` → `/`
- `SITE_URL` → `https://tudominio.com`

Un `git push` y el CI regenera todo con las rutas correctas. Resultado: tu web en **https://tudominio.com**, con `www` funcionando.

En la última parte, cómo seguir gestionando el contenido sin panel y el flujo de Git.
