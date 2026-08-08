---
title: "Sitio bilingüe con i18n"
description: "Enrutado es/en con Astro, diccionario tipado, contenido localizado, hreflang y guardas de paridad para que los idiomas no se descuadren."
date: 2026-08-07
order: 16
series: web-personal
part: 16
tags: ["i18n", "internacionalización", "bilingüe", "hreflang", "paridad"]
draft: false
---

La web era solo en español y quería abrirla al inglés. Astro tiene i18n integrado en el enrutado, y para los textos monté un diccionario propio con tipado fuerte. El reto no fue traducir: fue que los dos idiomas **no se descuadraran** con los cambios futuros.

## El enrutado

En `astro.config.mjs` declaré los idiomas, con el español por defecto y el inglés con prefijo:

```js
i18n: {
  defaultLocale: 'es',
  locales: ['es', 'en'],
  fallback: { en: 'es' },
  routing: {
    prefixDefaultLocale: false, // es se sirve en /, en en /en/
    fallbackType: 'rewrite',
  },
},
```

Con `fallbackType: 'rewrite'`, Astro genera automáticamente la versión `/en/` de cada página. Como toda la interfaz lee el idioma con `Astro.currentLocale`, la misma página se sirve traducida sin duplicar archivos.

> Cuando una página todavía no está traducida, el fallback hace que `/en/...` sirva la española. En nuestro caso no hace falta porque traducimos todo, pero es una red de seguridad útil.

## El diccionario tipado

Creé `src/i18n/dictionaries.ts`: `es` es la fuente de verdad y `en` se tipa contra sus claves:

```ts
const es = {
  'nav.home': 'Inicio',
  'nav.projects': 'Proyectos',
  // ...
} as const;

export type TranslationKey = keyof typeof es;

const en: Record<TranslationKey, string> = {
  'nav.home': 'Home',
  'nav.projects': 'Projects',
  // si falta una clave → error de tipos en el check
};
```

Y un helper `t()` con interpolación y fallback:

```ts
export function t(locale, key, params?) {
  const template = dictionaries[locale]?.[key] ?? dictionaries.es[key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template
  );
}
```

En cualquier componente se usa así:

```astro
---
const locale = (Astro.currentLocale ?? 'es') as Locale;
---
<h1>{t(locale, 'about.title')}</h1>
```

## El `<html>` y el idioma en el cliente

El layout fija `lang` y un `data-locale` que los scripts cliente leen en cada momento:

```html
<html lang={getLangTag(locale)} data-locale={locale}>
```

> Los scripts que viven en las páginas persisten entre navegaciones, así que el idioma se lee **fresco** en cada uso (`document.documentElement.getAttribute('data-locale')`), nunca capturado al cargar el módulo. Es el mismo principio que nos enseñó el bug del contenedor obsoleto.

## Contenido localizado

Los tutoriales viven en `src/content/tutoriales/es/` y `en/`, con los mismos nombres de archivo:

```ts
export function normalizeId(id: string): string {
  return id.startsWith('es/') || id.startsWith('en/') ? id.slice(3) : id;
}

export async function getPublishedTutorials(locale: Locale) {
  const entries = await getCollection('tutoriales', ({ data }) => !data.draft);
  return entries
    .filter((entry) => (entry.id.startsWith('en/') ? 'en' : 'es') === locale)
    .sort((a, b) => a.data.order - b.data.order);
}
```

En `getStaticPaths` se generan las URLs a partir de los artículos en español (el `normalizeId` quita el prefijo para que la URL no cambie), y dentro de la página se resuelve el artículo del idioma actual.

## SEO: hreflang y sitemap

- El `<head>` incluye los `link rel="alternate"` con `hreflang` para es/en/x-default, calculados con `getAbsoluteLocaleUrl`.
- El sitemap se configura con su propio bloque i18n:

```js
sitemap({
  i18n: { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en-US' } },
})
```

> Las rutas dinámicas generadas por el fallback (`/en/tutoriales/*`) no entraban en el sitemap. Las añadí con `customPages`, generadas dinámicamente leyendo la carpeta `es/` en la propia config.

## Las guardas de paridad

El diccionario tipado ya falla en `astro check` si una clave falta en inglés. Para el contenido añadí `scripts/check-i18n.mjs`, que se ejecuta dentro de `npm run check`:

```json
"check": "astro check && node scripts/check-i18n.mjs"
```

El script compara `es/` y `en/`: artículos faltantes o sobrantes, `order`/`part` distintos, `title`/`description` vacíos. Si hay algún problema, imprime cada error con la ruta del archivo y termina con código 1 (el CI bloquea el despliegue). En GitHub Actions, además, escribe un resumen en la pestaña *Summary* del run.

## Los datos del perfil

El rol, la bio y el objetivo vienen de variables de entorno. Añadí versiones en inglés con fallback:

```ts
export function profileText(locale, field) {
  const base = env[`SITE_${field}`];
  const english = env[`SITE_${field}_EN`];
  return locale === 'en' ? (english ?? base ?? '') : (base ?? '');
}
```

Así, si en el CI falta un secreto en inglés, la web no muestra huecos: cae al valor en español.

## El switch de idioma

En la navegación, un enlace que lleva a la misma página en el otro idioma:

```ts
import { getRelativeLocaleUrl } from 'astro:i18n';
const otherLocale = locale === 'es' ? 'en' : 'es';
const switchHref = getRelativeLocaleUrl(otherLocale, relativePath);
```

`getRelativeLocaleUrl` se encarga del prefijo: en `/` lleva a `/en/` y en `/en/proyectos/` de vuelta a `/proyectos/`.

Con esto la web quedó bilingüe, indexable en ambos idiomas y a prueba de descuadres. Y recuerda: cualquier cambio futuro de texto se hace en `es` y en `en` a la vez; si no, el check te va a avisar.
