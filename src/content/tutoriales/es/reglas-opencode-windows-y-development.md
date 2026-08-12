---
title: "Reglas de opencode para Windows y desarrollo"
description: "Creamos dos archivos de reglas que guían a opencode: uno para PowerShell/Windows y otro para el entorno de desarrollo portátil en J:, con encoding UTF-8, módulos y flujo Git adaptado a solitario."
date: 2026-08-12
order: 4
series: instalacion-opencode-portable-con-omniroute-y-openrouter
part: 4
tags: ["opencode", "reglas", "powershell", "windows", "configuracion"]
draft: false
---

Con las partes 1-3 tenía opencode portable corriendo en el SSD con OmniRoute y OpenRouter. Pero el asistente no conocía mi entorno: dónde está Python, que estoy en PowerShell, qué herramientas usa cada proyecto. La solución fue escribir **dos archivos de reglas** que opencode carga al arrancar y sigue automáticamente.

## 1. Dónde viven las reglas en opencode

En la instalación portable, la config vive en `J:\opencode\xdg\config\opencode\`. Opencode carga automáticamente los archivos `.md` de la carpeta `rules`:

```powershell
New-Item -ItemType Directory -Path "J:\opencode\xdg\config\opencode\rules" -Force
```

Dividí el comportamiento en dos archivos con responsabilidades distintas:

```
J:\opencode\xdg\config\opencode\rules\
├── windows_rules.md      ← entorno y terminal (PowerShell, rutas, encoding)
└── development_rules.md  ← ecosistemas dev (Node, Python, Git, env vars)
```

### Descarga las reglas

Te dejo el paquete con ambos archivos listos para copiar a `J:\opencode\xdg\config\opencode\rules\`:

<a class="download-btn" href="/rules.7z" download>Descargar rules.7z</a>

## 2. Windows rules: la base

El primer archivo arrancó con lo esencial: estoy en Windows nativo con PowerShell y **nunca** debo usar comandos Unix. La tabla de traducción Unix → PowerShell fue la pieza central:

| ❌ MAL (Unix) | ✅ BIEN (PowerShell) |
|---------------|----------------------|
| `ls -la` o `ll` | `Get-ChildItem -Force` |
| `touch archivo.txt` | `New-Item -ItemType File -Name archivo.txt` |
| `mkdir -p dir/subdir` | `New-Item -ItemType Directory -Force -Path dir\subdir` |
| `rm -rf carpeta` | `Remove-Item -Recurse -Force carpeta` |
| `grep "texto" archivo.txt` | `Select-String -Pattern "texto" -Path archivo.txt` |
| `comando1 && comando2` | `comando1 ; comando2` |

> **Regla de encadenamiento:** en PowerShell 5.1 `&&` y `||` daban error de sintaxis; el punto y coma era la única opción portable. Esto cambió con PowerShell 7 (lo vemos en la sección 6).

Además dejé fijadas las reglas de eficiencia: respuestas cortas, agrupar comandos en una sola petición, lectura selectiva (nunca leer un archivo entero de más de 300 líneas) y no devolver archivos completos cuando solo cambian unas líneas.

## 3. Ampliar con PowerShell específico

La base no bastaba. Añadí diez subsecciones con el PowerShell útil para el día a día:

- **3.1 Rutas**: `\` nativo y comillas dobles si hay espacios (`"C:\Program Files\app"`)
- **3.2 Variables de entorno**: `$env:NOMBRE` (no `$NOMBRE` ni `%NOMBRE%`)
- **3.3 Encoding**: default UTF-16; forzar UTF-8 (ver lección en sección 5)
- **3.4 Errores**: `$?`, `$LASTEXITCODE`, `try/catch`, `-ErrorAction Stop`
- **3.5 Pipeline**: objetos .NET, `Where-Object`, `Select-Object`, `ForEach-Object`
- **3.6 Alias**: `gci`, `ni`, `ri`, `cp`, `mv`, `cat`, `ps`, `kill`
- **3.7 Directorio de trabajo**: `Set-Location`, `Push-Location`/`Pop-Location`
- **3.8 Comillas**: dobles expanden `$(...)`, simples son literales
- **3.9 Comparadores**: `-eq`, `-like`, `-match`, `-contains`, `-in` con sufijos c/i
- **3.10 Background**: `Start-Process`, `Start-Job`, `Start-ThreadJob`

## 4. Reestructurar para localizar rápido

Con 13 subsecciones, navegar a pelo era lento. Reestructuré el archivo con una **tabla de contenidos con anclas** al principio:

```markdown
## Tabla de contenidos
1. [Principios Generales](#1-principios-generales)
2. [Comandos Básicos (Unix → PowerShell)](#2-comandos-básicos-unix--powershell)
3. [PowerShell Específico](#3-powershell-específico)
   - 3.1 [Rutas y Separadores](#31-rutas-y-separadores)
   - ...
```

Cada sección ahora tiene su número y su ancla: el asistente localiza "encoding" o "background jobs" con un vistazo, sin leer el archivo entero.

## 5. Añadir ayuda y módulos (lo esencial de verdad)

Revisando el archivo, faltaban dos cosas que uso **a diario** aunque parezcan avanzadas:

- **3.11 Sistema de ayuda**: `Get-Help comando -Full`, `-Examples`, `-Online`, `Update-Help`
- **3.12 Módulos**: `Get-Module -ListAvailable`, `Import-Module`, `Install-Module`, `Find-Module`

> **Lección: en PowerShell 5.1 `-Encoding utf8` crea BOM**  
> `Set-Content` y `Out-File -Encoding utf8` escriben UTF-8 **con BOM**, y herramientas modernas (Vite, Astro, Svelte) fallan con esos archivos. La solución portable: usar el método de .NET `[IO.File]::WriteAllText("archivo", "texto")`, que genera UTF-8 sin BOM por defecto. Otra corrección del mismo repaso: al lanzar servidores de desarrollo en background hay que redirigir la salida a un log (o a `$null`) para que la terminal no se quede bloqueada. Con PowerShell 7 esto dejó de ser un problema de BOM (lo vemos ahora).

## 6. Migración a PowerShell 7

Instalé PowerShell 7 y el escenario cambió a mejor:

- **Encoding 3.3**: ahora `Set-Content`/`Out-File -Encoding utf8` generan **UTF-8 sin BOM por defecto** — el workaround de `[IO.File]::WriteAllText` dejó de ser necesario
- **Encadenamiento**: `&&` y `||` funcionan de forma nativa en PS7+; `;` queda como opción de máxima compatibilidad
- **3.13 novedades**: pipeline chain operators, ternary `cond ? a : b`, null coalescing `??`, `$PSVersionTable.PSEdition = "Core"`, cross-platform, mejor rendimiento (.NET 6+)

Actualicé la sección 2 y el 3.3 para reflejar el nuevo entorno, manteniendo nota de 5.1 para no perder compatibilidad si un día tenemos que tocar una máquina antigua.

## 7. Development rules: el entorno de desarrollo

El segundo archivo ataca el mismo problema pero para **código**: qué tooling esperar en cada tecnología y cómo trabajar sin saturar la terminal.

**Node.js y frontend:**
- Instalaciones **silenciosas** siempre: `npm install paquete --no-fund --no-audit --loglevel=error`
- Binarios con `npx` (nunca `-g` salvo que se pida): `npx astro add tailwind`, `npx svelte-check`
- Servidores de desarrollo (`npm run dev`) **bloquean** la terminal → técnica background del `windows_rules.md` o avisar al usuario

**Calidad y testing (secciones 2.4 y 2.5):** detectar qué usa el proyecto (`lint`, `format`, `typecheck`), ejecutarlos obligatoriamente tras tocar código, y si un test falla, corregir el código real — nunca retocar un test para hacerlo pasar.

**Python (entorno portátil `J:`):** llamar siempre al ejecutable directo, sin activar venvs:

| Contexto | Comando/Ruta |
|----------|--------------|
| Global | `J:\Python\python.exe script.py` |
| Venv local | `.\venv\Scripts\python.exe script.py` |
| Instalar (quiet) | `.\venv\Scripts\python.exe -m pip install -q paquete` |

Con instalación de entornos, `requirements.txt`, `pyproject.toml` + `pip-tools` y `pip freeze > requirements.txt`.

**Variables de entorno:** `.env` local no commiteado, `.env.example` versionado con claves dummy, carga con `dotenv` o `node --env-file=.env` (Node 20.6+), y **nunca** hardcodear secretos.

## 8. Git adaptado a un desarrollador solitario

La primera versión aplicaba un flujo de equipo (rama protegida, PRs obligatorios, squash). Para mi trabajo **en solitario era demasiado restrictivo**. Lo adapté:

- **4.1 Flujo ágil / solo dev**: commits y pushes directos a `main` para iteraciones rápidas; ramas separadas solo para features grandes que puedan romper la app; integración con `git merge` (idealmente `--ff-only` o con rebase previo) para historial lineal
- **4.2 Hooks**: si el `pre-commit` (lint + format + typecheck) o el `commit-msg` fallan, **nunca usar `--no-verify`** — leer el error, corregir y reintentar el commit limpio

## Problemas y lecciones

> **Lección: las reglas evolucionan con el entorno**  
> El BOM en UTF-8 solo era un problema en PowerShell 5.1. Al migrar a PS7, la regla (y el workaround recomendado) dejaron de tener sentido. Los archivos de reglas no son estáticos: se revisan cada vez que cambia la herramienta, no al revés.

> **Lección: separar responsabilidades entre reglas**  
> `windows_rules.md` habla de *cómo* se ejecuta (PowerShell, rutas, encoding); `development_rules.md` de *qué* se ejecuta (npm, Python, Git). Mantenerlos separados hace que cada archivo sea plano, corto y de una sola idea.

> **Lección: lo "avanzado" es lo cotidiano**  
> `Get-Help` y `Import-Module` parecían de manual avanzado, pero son los dos comandos que uso prácticamente a diario. Priorizamos reglas por frecuencia de uso, no por nivel de complejidad.

## Cierre

Con estos dos archivos, opencode sabe en qué entorno vive y cómo trabajar eficientemente: comandos PowerShell correctos, encoding UTF-8 fiable, tooling del proyecto detectado antes de ejecutar nada, y un flujo Git pensado para desarrollo en solitario. Y como buen ciudadano del SSD: todo vive en `J:\opencode\xdg\config\opencode\rules\`, listo para moverse de PC sin arrastrar configuración del host.

La serie sigue viva: el asistente ya conoce el sistema operativo y el ecosistema de desarrollo. En la siguiente parte, cualquier ajuste específico que vaya surgiendo sobre el camino lo documentaremos igual.