# Portfolio

Web personal estática y multi-página para mostrar proyectos alojados en GitHub.

Generada con **Astro** (SSG) y desplegada en **GitHub Pages** con dominio personalizado a través de **Cloudflare**.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| **Astro** | Framework SSG: genera HTML estático real por página |
| **TypeScript** | Tipado estricto en configuración y scripts |
| **HTML5** | Estructura semántica y accesible |
| **CSS3** | Variables (custom properties), Grid/Flexbox, diseño responsive |
| **JavaScript/TypeScript vanilla** | Menú móvil y carga de proyectos vía API |
| **GitHub REST API** | Carga en vivo de repos: `https://api.github.com/users/{user}/repos` |
| **localStorage** | Cache de la API (TTL 24 h) para respetar el rate-limit de GitHub |
| **@astrojs/sitemap** | Generación de `sitemap.xml` para SEO |
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
| `npm run check` | Comprobación de tipos y errores |

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores. El archivo `.env` está en `.gitignore` y **nunca se sube al repositorio**.

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `SITE_NAME` | Nombre mostrado | `Tu Nombre` |
| `SITE_ROLE` | Profesión o rol | `Desarrollador` |
| `SITE_BIO` | Bio breve en primera persona | `Curioso por naturaleza` |
| `SITE_OBJECTIVE` | Objetivo principal | `Ampliar conocimiento` |
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
├── src/
│   ├── layouts/            → Base.astro (cabecera, navegación, pie, meta)
│   ├── components/         → Nav, Footer, ProjectCard, Hero, ...
│   ├── pages/              → index, sobre-mi, proyectos, contacto
│   ├── scripts/            → main.ts (menú) y github.ts (API + cache)
│   └── styles/             → global.css (variables, componentes, responsive)
├── .github/workflows/      → deploy.yml (build + deploy a Pages)
├── .env.example            → plantilla de variables de entorno
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## Páginas

- `/` — Inicio: hero con resumen y accesos rápidos
- `/sobre-mi` — Bio, habilidades y trayectoria
- `/proyectos` — Grid de proyectos cargados desde la API de GitHub
- `/contacto` — Contacto y enlaces a redes sociales

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
- **Contenido estructurado (futuro)**: blog con Content Collections (crear una entrada = añadir un archivo `.md`).

## Futuro

- Blog / artículos con Content Collections.
- Internacionalización (i18n): el HTML se marca con `lang="es"` y la estructura queda preparada para añadir traducciones.

## Licencia

MIT — ver [LICENSE](LICENSE).
