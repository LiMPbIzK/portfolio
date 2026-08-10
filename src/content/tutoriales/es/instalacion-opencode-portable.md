---
title: "Instalación portable de opencode en SSD externo"
description: "Montamos opencode 100% portable en J: con binario directo y lanzadores que aislan config, datos y caché sin tocar el host."
date: 2026-08-05
order: 1
series: instalacion-opencode-portable-con-omniroute-y-openrouter
part: 1
tags: ["opencode", "portable", "ssd", "windows"]
draft: false
---

Quería usar opencode en varios PCs sin repetir instalaciones ni dejar rastros en cada máquina. La solución: meter todo (binario, config, sesiones, caché) en mi SSD externo `J:` y arrancarlo con un script que setea las variables de entorno portables.

## Qué necesitamos

- Unidad externa montada en `J:` (exFAT o NTFS, **nunca FAT32** por el límite de 4 GB)
- Node.js ≥ 20 en el PC donde hagamos la instalación (solo para descargar; el binario de opencode no lo necesita)
- PowerShell 5.1+

> **Nota:** opencode en Windows nativo (`cmd.exe`) tiene un bug conocido: al salir con Ctrl+D o `/exit` cierra la terminal entera. La instalación portable que vamos a hacer **no resuelve eso** — sigue pasando si la lanzas desde `cmd.exe`. La práctica recomendada: úsala dentro de **Windows Terminal** o **Git Bash**, o mejor aún, desde **WSL2**. En este tutorial nos quedamos en Windows nativo porque el objetivo es portabilidad entre equipos Windows.

## 1. Estructura de directorios en el SSD

```powershell
New-Item -ItemType Directory -Path "J:\opencode\bin" -Force
New-Item -ItemType Directory -Path "J:\opencode\config" -Force
New-Item -ItemType Directory -Path "J:\opencode\data" -Force
New-Item -ItemType Directory -Path "J:\opencode\cache" -Force
New-Item -ItemType Directory -Path "J:\opencode\logs" -Force
New-Item -ItemType Directory -Path "J:\opencode\state" -Force
```

Queda así:

```
J:\
├── opencode.ps1       ← Lanzador PowerShell
├── opencode.bat       ← Lanzador CMD
└── opencode\
    ├── bin\opencode.exe
    ├── config\
    ├── data\
    ├── cache\
    ├── logs\
    └── state\
```

## 2. Descargar el binario de opencode (Windows x64)

La forma más limpia es bajar el ZIP del CLI desde GitHub Releases y extraer solo el `.exe`:

```powershell
# Obtener la última versión
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/anomalyco/opencode/releases/latest" -ErrorAction Stop
$asset = $release.assets | Where-Object { $_.name -eq "opencode-windows-x64.zip" } | Select-Object -First 1
$asset.browser_download_url
# → https://github.com/anomalyco/opencode/releases/download/v1.18.10/opencode-windows-x64.zip

# Descargar y extraer
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile "J:\opencode\opencode-windows-x64.zip"
Expand-Archive -LiteralPath "J:\opencode\opencode-windows-x64.zip" -DestinationPath "J:\opencode\bin" -Force
Remove-Item "J:\opencode\opencode-windows-x64.zip" -Force

# Verificar
& "J:\opencode\bin\opencode.exe" --version
# 1.18.10
```

> **Por qué no `npm install -g`**: instala en `%APPDATA%\npm` (ruta del usuario local) y arrastra cientos de dependencias. El binario directo son ~170 MB, cero dependencias, y va en el SSD.

## 3. Lanzadores portable (el truco)

Creamos dos archivos en la raíz `J:\` para que al pinchar/ejecutar arranquen opencode con **todas** las variables apuntando al SSD:

**`J:\opencode.ps1`** (PowerShell, recomendado):

```powershell
param(
    [switch]$Console,
    [switch]$StopOmniRoute
)

$drive = "J:"
$base = "$drive\opencode"
$nodeDir = "$drive\node\dist\node-v22.23.2-win-x64"
$omniBin = "$drive\omniroute\node_modules\omniroute\bin\omniroute.mjs"
$omniWork = "$drive\omniroute"

$env:XDG_DATA_HOME = "$base\xdg\share"
$env:XDG_CONFIG_HOME = "$base\xdg\config"
$env:XDG_CACHE_HOME = "$base\xdg\cache"
$env:XDG_STATE_HOME = "$base\xdg\state"
$env:PATH = "$nodeDir;$base\bin;$env:PATH"
$env:DATA_DIR = "$omniWork\data"

$script:omniStartedByUs = $false

function Test-OmniRouteUp {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:20128/api/monitoring/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-OmniRoute {
    if (Test-OmniRouteUp) {
        Write-Host "OmniRoute ya esta corriendo (localhost:20128)."
        return
    }
    Write-Host "Arrancando OmniRoute..."
    $script:omniStartedByUs = $true
    Start-Process -FilePath "$nodeDir\node.exe" -ArgumentList "`"$omniBin`"","serve" -WorkingDirectory $omniWork -WindowStyle Hidden
    $ok = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 2
        if (Test-OmniRouteUp) { $ok = $true; break }
    }
    if ($ok) {
        Write-Host "OmniRoute listo (localhost:20128)."
    } else {
        Write-Warning "OmniRoute no respondio. Abriendo opencode igualmente."
    }
}

if ($StopOmniRoute) {
    try {
        Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like "*omniroute*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Write-Host "OmniRoute detenido."
    } catch {
        Write-Warning "No se pudo detener OmniRoute: $($_.Exception.Message)"
    }
    exit
}

Start-OmniRoute

if ($Console) {
    & "$base\bin\opencode.exe" --no-tui @args
} else {
    & "$base\bin\opencode.exe" @args
}

if ($script:omniStartedByUs) {
    Write-Host ""
    Write-Host "Opencode ha finalizado."
    $answer = Read-Host "El servidor OmniRoute fue iniciado por este script. Deseas apagarlo? (S/N)"
    if ($answer -match "^[sS]") {
        try {
            Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like "*omniroute*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
            Write-Host "OmniRoute detenido."
        } catch {
            Write-Warning "No se pudo detener OmniRoute: $($_.Exception.Message)"
        }
    } else {
        Write-Host "OmniRoute sigue ejecutandose en localhost:20128."
    }
}
```

## 4. Probar que funciona

Desde cualquier terminal (PowerShell, CMD, Windows Terminal):

```powershell
J:\opencode.ps1 --version
# 1.18.10

J:\opencode.ps1 --help
# Muestra comandos: run, attach, acp, mcp, debug, providers...
```

Si ves la versión y la ayuda, **está listo**. Conecta el SSD en otro Windows, abre terminal y ejecuta `J:\opencode.ps1` — tendrás tu opencode con tu config, tus sesiones y tu historial, sin dejar nada en el host.

## Problemas y lecciones

> **Lección: `dubious ownership` en Git**  
> Si el repo del proyecto está también en el SSD (`J:\Codigo\mi-proyecto`), Git se queja de propiedad dudosa. Solución:
> ```powershell
> git config --global --add safe.directory "J:/Codigo/mi-proyecto"
> ```

> **Lección: email noreply en repos públicos**  
> Para que tu email personal no aparezca en el historial de commits:
> ```powershell
> git config user.email "12345678+tu-usuario@users.noreply.github.com"
> ```

> **Algo que aprendimos por las malas: el bug de `cmd.exe`**  
> En `cmd.exe` nativo, salir de opencode (Ctrl+D, `/exit`, `/quit`) cierra la ventana de la terminal. **No es cosa de nuestra instalación portable**, es un bug de opencode en Windows (#22003). Workarounds:
> - Usa **Windows Terminal** (no `cmd.exe` directo)
> - Usa **Git Bash** o **WSL2**
> - Si tienes que usar `cmd.exe`, lanza `opencode --no-tui` y sal con Ctrl+C

## Qué sigue

Ahora tienes opencode portable. En la siguiente parte integramos **OmniRoute + combo best-free-coding** para tener fallback automático entre modelos gratis (Nemotron 3 Ultra, DeepSeek V4 Flash, Big Pickle).