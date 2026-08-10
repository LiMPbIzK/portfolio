---
title: "OmniRoute portable + combo best-free-coding"
description: "Instalamos OmniRoute en el SSD con Node 22 portable, configuramos la key de OpenRouter y creamos el combo best-free-coding con 3 modelos gratis y fallback automático."
date: 2026-08-06
order: 2
series: instalacion-opencode-portable-con-omniroute-y-openrouter
part: 2
tags: ["omniroute", "openrouter", "fallback", "gratis", "portable"]
draft: false
---

Quería modelos de terceros (OpenRouter, Nemotron, DeepSeek) con **fallback automático** si uno falla o agota cuota, todo portable en el SSD. La solución: **OmniRoute** como gateway único + combo `best-free-coding` con estrategia `priority`.

## Qué necesitamos

- SSD en `J:` (exFAT/NTFS)
- Node.js ≥ 22.22.2 para OmniRoute 3.8.x (el host tiene Node 20 → **usaremos Node 22 portable en `J:\node`**)
- Key de OpenRouter (gratis, para modelos `:free`)
- PowerShell 5.1+

## 1. Instalar OmniRoute portable en `J:\omniroute`

```powershell
# Desde el host (Node 20 + npm) — solo para descargar dependencias
npm install -g --prefix "J:\omniroute" omniroute
# → crea J:\omniroute\node_modules\omniroute\bin\omniroute.mjs (v3.8.49)
```

> **Por qué `--prefix`**: instala todo dentro de `J:\omniroute`, sin tocar `%APPDATA%`.

## 2. Node 22 portable (soluciona el crash 0xC0000005)

OmniRoute 3.8.x **requiere Node ≥22.22.2**. El host tiene Node 20.15 → crash de acceso a memoria (`better-sqlite3` nativo). Solución portable: bajar Node 22 standalone al SSD.

```powershell
New-Item -ItemType Directory -Path "J:\node" -Force
Invoke-WebRequest -Uri "https://nodejs.org/dist/latest-v22.x/win-x64/node.exe" -OutFile "J:\node\node.exe"
& "J:\node\node.exe" --version
# v22.23.2
```

> **Nota**: `node.exe` standalone (87 MB) **no incluye npm**. Sirve solo para **ejecutar** OmniRoute. La instalación de dependencias se hizo arriba con el Node 20 del host.

## 3. Variables de entorno (`.env` en `J:\omniroute`)

```powershell
# Generar secrets aleatorios
$jwt = [Convert]::ToBase64String((1..36 | ForEach-Object { Get-Random -Maximum 256 }))
$akey = -join ((1..32 | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }))

@"
DATA_DIR=J:\omniroute\data
JWT_SECRET=$jwt
API_KEY_SECRET=$akey
INITIAL_PASSWORD=CHANGEME
PORT=20128
REQUIRE_API_KEY=false
NODE_ENV=production
"@ | Set-Content -Path "J:\omniroute\.env" -Encoding utf8
```

- `DATA_DIR`: SQLite con providers/keys/settings viaja en el SSD
- `JWT_SECRET` / `API_KEY_SECRET`: cifran claves en reposo (AES-256-GCM)
- `PORT=20128`: gateway expone `http://localhost:20128/v1` (OpenAI-compatible)

## 4. Arrancar OmniRoute y health-check

```powershell
# Lanzar en background con Node 22 portable
$proc = Start-Process -FilePath "J:\node\node.exe" `
    -ArgumentList "`"J:\omniroute\node_modules\omniroute\bin\omniroute.mjs`"" `
    -WorkingDirectory "J:\omniroute" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "J:\omniroute\server.out.log" `
    -RedirectStandardError "J:\omniroute\server.err.log" `
    -PassThru

# Health-check con reintentos
$ok = $false
for ($i=0; $i -lt 30; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:20128/api/health" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "HEALTH OK: $($r | ConvertTo-Json -Compress)"
        $ok = $true; break
    } catch { Start-Sleep -Seconds 5 }
}
if (-not $ok) { Get-Content "J:\omniroute\server.err.log" -Tail 40 }
```

Deberías ver `{"status":"ok"}`.

## 5. Añadir key de OpenRouter (Dashboard web)

Abre `http://localhost:20128` en el navegador → **Providers** → **OpenRouter** → pega tu key `sk-or-v1-...` (gratis, solo modelos `:free`).

> La key se guarda cifrada en `J:\omniroute\data\provider-credentials.json`. **No la pongas en el repo ni en el tutorial**.

## 6. Crear combo `best-free-coding` (3 modelos, estrategia `priority`)

```powershell
$combo = @{
    name = "best-free-coding"
    strategy = "priority"
    models = @(
        "oc/nemotron-3-ultra-free"
        "oc/deepseek-v4-flash-free"
        "oc/big-pickle"
    )
    config = @{
        maxRetries = 1
        fallbackDelayMs = 0
    }
} | ConvertTo-Json -Depth 4 -Compress

Invoke-RestMethod -Method Post -Uri "http://localhost:20128/api/combos" `
    -ContentType "application/json" -Body $combo
```

**Orden = prioridad**. Si el 1º devuelve 429/402/5xx, salta al 2º, luego al 3º. Cero coste (todos gratis).

## 7. Configurar opencode para usar OmniRoute

Edita `J:\opencode\config\opencode.jsonc` (o donde tengas tu config):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "omniroute": {
      "npm": "@ai-sdk/openai-compatible",
      "baseURL": "http://localhost:20128/v1",
      "apiKey": "sk_omniroute",  // dummy, OmniRoute ignora la key si REQUIRE_API_KEY=false
      "models": {
        "best-free-coding": {}
      }
    }
  },
  "model": "omniroute/best-free-coding"
}
```

> `apiKey` es un placeholder; con `REQUIRE_API_KEY=false` OmniRoute no la valida.

## 8. Actualizar lanzadores para auto-arrancar OmniRoute

**`J:\opencode.ps1`** (añadir al principio):

```powershell
# Auto-arrancar OmniRoute si no responde
$omnirouteProc = $null
function Start-OmniRouteIfNeeded {
    try { Invoke-RestMethod -Uri "http://localhost:20128/api/health" -TimeoutSec 2 -ErrorAction Stop | Out-Null }
    catch {
        Write-Host "Iniciando OmniRoute..." -ForegroundColor Yellow
        $omnirouteProc = Start-Process -FilePath "J:\node\node.exe" `
            -ArgumentList "`"J:\omniroute\node_modules\omniroute\bin\omniroute.mjs`"" `
            -WorkingDirectory "J:\omniroute" -WindowStyle Hidden `
            -RedirectStandardOutput "J:\omniroute\server.out.log" `
            -RedirectStandardError "J:\omniroute\server.err.log" -PassThru
        Start-Sleep -Seconds 8
        # health-check rápido
        for ($i=0; $i -lt 10; $i++) {
            try { Invoke-RestMethod -Uri "http://localhost:20128/api/health" -TimeoutSec 2 -ErrorAction Stop | Out-Null; break }
            catch { Start-Sleep -Seconds 2 }
        }
    }
}
Start-OmniRouteIfNeeded

# ... resto del lanzador (variables OPENCODE_*, PATH, opencode.exe)
```

**`J:\opencode.bat`** (equivalente en batch al inicio).

## 9. Verificación

```powershell
J:\opencode.ps1 models omniroute
# Debe listar los 3 modelos del combo

J:\opencode.ps1 run "Hola, ¿qué modelo eres?"
# Respuesta real vía gateway; cabecera X-OmniRoute-Decision indica cuál sirvió
```

**Forzar fallback**: en Dashboard → Providers → desactiva Nemotron → repite el chat → debe saltar a DeepSeek.

## Problemas y lecciones

> **Lección: Node 22 portable = portabilidad real**  
> Ambos PCs usan `J:\node\node.exe`. Da igual qué Node tengan instalado localmente. El SSD lo lleva todo.

> **Lección: `runtime repair` falla sin toolchain C++**  
> El comando integrado `omniroute runtime repair` necesita compilar `better-sqlite3`. Node portable standalone evita el problema.

> **Lección: Sin internet → built-ins siguen**  
> Si no hay red, OmniRoute arranca pero los providers fallan. Los modelos `opencode/*-free` (integrados) siguen funcionando como respaldo manual.

> **Algo que aprendimos por las malas: crash 0xC0000005 en Node 20**  
> No es bug de OmniRoute, es incompatibilidad de `better-sqlite3` nativo con Node <22. La solución portable (Node 22 en el SSD) es la más limpia.

## Qué sigue

Tenemos gateway con fallback automático entre 3 modelos gratis. En la siguiente parte configuramos **OpenRouter** en detalle (modelos `:free`, límites, uso práctico con `/connect` y `/models`).