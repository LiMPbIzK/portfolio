---
title: "Portable opencode installation on external SSD"
description: "Set up opencode 100% portable on J: with direct binary and launchers that isolate config, data, and cache without touching the host."
date: 2026-08-05
order: 1
series: instalacion-opencode-portable-con-omniroute-y-openrouter
part: 1
tags: ["opencode", "portable", "ssd", "windows"]
draft: false
---

I wanted to use opencode on multiple PCs without repeating installations or leaving traces on each machine. The solution: put everything (binary, config, sessions, cache) on my external SSD `J:` and launch it with a script that sets portable environment variables.

## What we need

- External drive mounted at `J:` (exFAT or NTFS, **never FAT32** due to the 4 GB file limit)
- Node.js ≥ 20 on the PC where we do the installation (only for downloading; the opencode binary doesn't need it)
- PowerShell 5.1+

> **Note:** opencode on native Windows (`cmd.exe`) has a known bug: exiting with Ctrl+D or `/exit` closes the entire terminal window. The portable installation we're building **doesn't fix this** — it still happens if you launch from `cmd.exe`. Recommended practice: use it inside **Windows Terminal** or **Git Bash**, or better yet, from **WSL2**. In this tutorial we stay on native Windows because the goal is portability between Windows machines.

## 1. Directory structure on the SSD

```powershell
New-Item -ItemType Directory -Path "J:\opencode\bin" -Force
New-Item -ItemType Directory -Path "J:\opencode\config" -Force
New-Item -ItemType Directory -Path "J:\opencode\data" -Force
New-Item -ItemType Directory -Path "J:\opencode\cache" -Force
New-Item -ItemType Directory -Path "J:\opencode\logs" -Force
New-Item -ItemType Directory -Path "J:\opencode\state" -Force
```

Result:

```
J:\
├── opencode.ps1       ← PowerShell launcher
├── opencode.bat       ← CMD launcher
└── opencode\
    ├── bin\opencode.exe
    ├── config\
    ├── data\
    ├── cache\
    ├── logs\
    └── state\
```

## 2. Download the opencode binary (Windows x64)

The cleanest way is to grab the CLI ZIP from GitHub Releases and extract only the `.exe`:

```powershell
# Get latest version
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/anomalyco/opencode/releases/latest" -ErrorAction Stop
$asset = $release.assets | Where-Object { $_.name -eq "opencode-windows-x64.zip" } | Select-Object -First 1
$asset.browser_download_url
# → https://github.com/anomalyco/opencode/releases/download/v1.18.10/opencode-windows-x64.zip

# Download and extract
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile "J:\opencode\opencode-windows-x64.zip"
Expand-Archive -LiteralPath "J:\opencode\opencode-windows-x64.zip" -DestinationPath "J:\opencode\bin" -Force
Remove-Item "J:\opencode\opencode-windows-x64.zip" -Force

# Verify
& "J:\opencode\bin\opencode.exe" --version
# 1.18.10
```

> **Why not `npm install -g`**: it installs to `%APPDATA%\npm` (local user path) and pulls hundreds of dependencies. The direct binary is ~170 MB, zero dependencies, and lives on the SSD.

## 3. Portable launchers (the trick)

Create two files at `J:\` root so double-clicking/running them starts opencode with **all** variables pointing to the SSD:

**`J:\opencode.ps1`** (PowerShell, recommended):

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
        Write-Host "OmniRoute is running on (localhost:20128)."
        return
    }
    Write-Host "Launching OmniRoute..."
    $script:omniStartedByUs = $true
    Start-Process -FilePath "$nodeDir\node.exe" -ArgumentList "`"$omniBin`"","serve" -WorkingDirectory $omniWork -WindowStyle Hidden
    $ok = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 2
        if (Test-OmniRouteUp) { $ok = $true; break }
    }
    if ($ok) {
        Write-Host "OmniRoute ready (localhost:20128)."
    } else {
        Write-Warning "OmniRoute did not respond. Opening opencode anyway."
    }
}

if ($StopOmniRoute) {
    try {
        Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like "*omniroute*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Write-Host "OOmniRoute stopped."
    } catch {
        Write-Warning "Failed to stop OmniRoute: $($_.Exception.Message)"
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
    Write-Host "Opencode finalized."
    $answer = Read-Host "The OmniRoute server was started by this script. Do you want to shut it down? (Y/N)"
    if ($answer -match "^[yY]") {
        try {
            Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like "*omniroute*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
            Write-Host "OOmniRoute stopped."
        } catch {
            Write-Warning "Failed to stop OmniRoute: $($_.Exception.Message)"
        }
    } else {
        Write-Host "OmniRoute is still running on localhost:20128."
    }
}

```

## 4. Test it works

From any terminal (PowerShell, CMD, Windows Terminal):

```powershell
J:\opencode.ps1 --version
# 1.18.10

J:\opencode.ps1 --help
# Shows commands: run, attach, acp, mcp, debug, providers...
```

If you see the version and help, **you're ready**. Plug the SSD into another Windows, open a terminal, run `J:\opencode.ps1` — you'll have your opencode with your config, sessions, and history, leaving nothing on the host.

## Issues and lessons

> **Lesson: `dubious ownership` in Git**  
> If your project repo is also on the SSD (`J:\Codigo\my-project`), Git complains about dubious ownership. Fix:
> ```powershell
> git config --global --add safe.directory "J:/Codigo/my-project"
> ```

> **Lesson: noreply email on public repos**  
> To keep your personal email out of commit history:
> ```powershell
> git config user.email "12345678+your-user@users.noreply.github.com"
> ```

> **Something we learned the hard way: the `cmd.exe` bug**  
> In native `cmd.exe`, exiting opencode (Ctrl+D, `/exit`, `/quit`) closes the terminal window. **This isn't our portable install's fault**, it's an opencode bug on Windows (#22003). Workarounds:
> - Use **Windows Terminal** (not raw `cmd.exe`)
> - Use **Git Bash** or **WSL2**
> - If you must use `cmd.exe`, launch `opencode --no-tui` and exit with Ctrl+C

## What's next

Now you have portable opencode. In the next part we integrate **OmniRoute + best-free-coding combo** for automatic fallback between free models (Nemotron 3 Ultra, DeepSeek V4 Flash, Big Pickle).