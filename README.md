# Portfolio

Web personal estática y multi-página para mostrar proyectos alojados en GitHub.

Generada con **Astro** (SSG) y desplegada en **GitHub Pages** con dominio personalizado a través de **Cloudflare**.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| **Astro** | Framework SSG: genera HTML estático real por página |
| **TypeScript** | Tipado estricto en configuración y scripts |
| **HTML5** | Estructura semántica y accesible |
| **CSS3** | Variables (custom properties), `color-mix()`, capas `@layer`, anidamiento, container queries, Grid/Flexbox, diseño responsive |
| **JavaScript/TypeScript vanilla** | Menú móvil, toggle de tema, scroll reveal y carga de proyectos vía API |
| **Modo oscuro** | Toggle persistente en `localStorage` con respeto a `prefers-color-scheme` |
| **View Transitions** | Navegación entre páginas sin recarga con `astro:transitions` |
| **i18n** | Español por defecto (`/`) e inglés con prefijo (`/en/`), con diccionario tipado y hreflang |
| **astro-icon** | Iconos SVG optimizados (`simple-icons` + `lucide`) solo con lo usado |
| **GSAP** | Animaciones: entrada del hero con SplitText, parallax de scroll con ScrollTrigger |
| **GitHub REST API** | Carga en vivo de repos: `https://api.github.com/users/{user}/repos` |
| **localStorage** | Cache de la API (TTL 24 h) para respetar el rate-limit de GitHub |
| **@astrojs/sitemap** | Generación de `sitemap.xml` para SEO |
| **Content Collections** | Sección de tutoriales gestionada con archivos `.md` |
| **GitHub Actions** | Build y despliegue automático al hacer push en `main` |
| **GitHub Pages** | Alojamiento del sitio estático |
| **Cloudflare** | DNS, proxy, SSL/TLS y ofuscación de email |

## Requisitos

- Node.js ≥ 22.12
- npm ≥ 10

## Comandos

| Comando | Acción |
| --- | --- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Servidor de desarrollo en `http://localhost:4321` |
| `npm run build` | Build de producción en `./dist/` |
| `npm run preview` | Previsualiza el build antes de desplegar |
| `npm run check` | Comprobación de tipos y errores + paridad i18n es/en |

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores. El archivo `.env` está en `.gitignore` y **nunca se sube al repositorio**.

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `SITE_NAME` | Nombre mostrado | `Tu Nombre` |
| `SITE_ROLE` | Profesión o rol (español) | `Desarrollador` |
| `SITE_ROLE_EN` | Profesión o rol en inglés (si falta, usa `SITE_ROLE`) | `Developer` |
| `SITE_BIO` | Bio breve en primera persona (español) | `Curioso por naturaleza` |
| `SITE_BIO_EN` | Bio en inglés (si falta, usa `SITE_BIO`) | `Naturally curious` |
| `SITE_OBJECTIVE` | Objetivo principal (español) | `Ampliar conocimiento` |
| `SITE_OBJECTIVE_EN` | Objetivo en inglés (si falta, usa `SITE_OBJECTIVE`) | `Expand knowledge` |
| `SITE_EMAIL` | Email de contacto | `hola@tudominio.com` |
| `SITE_GITHUB_USER` | Usuario de GitHub (para la API) | `tu-usuario` |
| `SITE_GITHUB_URL` | Perfil de GitHub | `https://github.com/tu-usuario` |
| `SITE_LINKEDIN_URL` | Perfil de LinkedIn | `https://www.linkedin.com/in/tu-usuario/` |
| `SITE_CV_URL` | URL pública del CV descargable (opcional) | `https://.../cv.pdf` |
| `SITE_URL` | URL pública de producción | `https://tudominio.com` |

En el despliegue (CI) estos valores se inyectan desde los **secretos y variables de GitHub Actions** (Settings → Secrets and variables → Actions). El repositorio público solo contiene placeholders (`.env.example`) y los nombres de los secretos, nunca datos personales.

## Estructura

```text
/
├── public/                 → favicon y assets estáticos (imágenes, OG)
├── scripts/                → check-i18n.mjs (guarda de paridad es/en del check)
├── src/
│   ├── layouts/            → Base.astro (cabecera, navegación, pie, meta y script de tema)
│   ├── components/         → Nav (menú móvil + toggle de tema + switch idioma), Footer
│   ├── i18n/               → dictionaries.ts (es/en tipado), utils.ts (t()), env.ts (perfil por idioma)
│   ├── pages/              → index, sobre-mi, proyectos, contacto y tutoriales
│   ├── content/            → tutoriales/es y tutoriales/en (Content Collections bilingües)
│   ├── data/               → tutoriales.ts (series y consultas de contenido por locale)
│   ├── scripts/            → github.ts (API + cache), reveal.ts (scroll reveal) y gsap.ts (animaciones)
│   └── styles/             → global.css (variables, componentes, responsive) y prose.css
├── .github/workflows/      → deploy.yml (check + build + deploy a Pages)
├── .env.example            → plantilla de variables de entorno
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## Páginas

- `/` — Inicio: hero con resumen y accesos rápidos
- `/sobre-mi` — Bio, habilidades y trayectoria
- `/proyectos` — Grid de proyectos desde la API de GitHub, con filtro por tecnología y orden
- `/tutoriales` — Guías paso a paso sobre cómo se construyó esta web
- `/contacto` — Contacto y enlaces a redes sociales

Todas las páginas tienen su versión en inglés bajo el prefijo `/en/` (por ejemplo, `/en/sobre-mi`), con el switch **EN/ES** en la navegación.

## Despliegue

- El workflow `.github/workflows/deploy.yml` construye el sitio y lo publica con `actions/deploy-pages` al hacer push en `main`.
- Se usa un dominio personalizado servido vía proxy de Cloudflare:
  - CNAME del dominio y de `www` apuntando a `<usuario>.github.io` (proxied / orange cloud).
  - Cloudflare SSL/TLS en modo **Full**.
  - GitHub Pages: custom domain configurado + **Enforce HTTPS**.
- La `base` de Astro es configurable con la variable `ASTRO_BASE`:
  - Vacía (raíz `/`) cuando hay dominio personalizado en producción.
  - `/portfolio/` si se sirve desde `https://<usuario>.github.io/portfolio/`.

## Gestión de contenido

- **Edición directa de archivos fuente**: el contenido vive en los `.astro`/`.md`, no en una base de datos.
- **Editor web de GitHub como panel**: editar o crear archivos desde `github.com` → commit → el CI reconstruye y publica automáticamente (incluso desde el móvil).
- **Proyectos automáticos**: crear un repositorio nuevo en GitHub lo añade a la web sin tocar nada.
- **Tutoriales con Content Collections**: cada entrada vive en `src/content/tutoriales/es/` (español) y en `src/content/tutoriales/en/` (inglés), con el mismo `order`/`part`. Crear una nueva entrada = añadir los dos `.md`.
- **Workflow i18n**: todo cambio en la interfaz se hace en `src/i18n/dictionaries.ts` (clave en `es` y su traducción en `en`). El `npm run check` (local y CI) falla si es/en se descuadran, mostrando exactamente qué archivo corregir.

## Futuro

- Nada en curso. Ideas abiertas: ampliar la serie de tutoriales y seguir puliendo la web.

## Licencia

MIT — ver [LICENSE](LICENSE).
