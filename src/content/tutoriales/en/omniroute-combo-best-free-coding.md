---
title: "Portable OmniRoute + best-free-coding combo"
description: "Install OmniRoute on the SSD with portable Node 22, configure the OpenRouter key, and create the best-free-coding combo with 3 free models and automatic fallback."
date: 2026-08-06
order: 2
series: instalacion-opencode-portable-con-omniroute-y-openrouter
part: 2
tags: ["omniroute", "openrouter", "fallback", "free", "portable"]
draft: false
---

I wanted third-party models (OpenRouter, Nemotron, DeepSeek) with **automatic fallback** if one fails or exhausts its quota, all portable on the SSD. The solution: **OmniRoute** as a single gateway + `best-free-coding` combo with `priority` strategy.

## What we need

- SSD at `J:` (exFAT/NTFS)
- Node.js ≥ 22.22.2 for OmniRoute 3.8.x (host has Node 20 → **we'll use portable Node 22 at `J:\node`**)
- OpenRouter key (free, for `:free` models)
- PowerShell 5.1+

## 1. Install portable OmniRoute at `J:\omniroute`

```powershell
# From host (Node 20 + npm) — only to download deps
npm install -g --prefix "J:\omniroute" omniroute
# → creates J:\omniroute\node_modules\omniroute\bin\omniroute.mjs (v3.8.49)
```

> **Why `--prefix`**: installs everything inside `J:\omniroute`, no `%APPDATA%` pollution.

## 2. Portable Node 22 (fixes the 0xC0000005 crash)

OmniRoute 3.8.x **requires Node ≥22.22.2**. Host has Node 20.15 → memory access crash (`better-sqlite3` native). Portable fix: download Node 22 standalone to the SSD.

```powershell
New-Item -ItemType Directory -Path "J:\node" -Force
Invoke-WebRequest -Uri "https://nodejs.org/dist/latest-v22.x/win-x64/node.exe" -OutFile "J:\node\node.exe"
& "J:\node\node.exe" --version
# v22.23.2
```

> **Note**: `node.exe` standalone (87 MB) **does not include npm**. It's only for **running** OmniRoute. Dependency install was done above with host's Node 20.

## 3. Environment variables (`.env` at `J:\omniroute`)

```powershell
# Generate random secrets
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

- `DATA_DIR`: SQLite with providers/keys/settings travels on the SSD
- `JWT_SECRET` / `API_KEY_SECRET`: encrypt keys at rest (AES-256-GCM)
- `PORT=20128`: gateway exposes `http://localhost:20128/v1` (OpenAI-compatible)

## 4. Start OmniRoute and health-check

```powershell
# Launch in background with portable Node 22
$proc = Start-Process -FilePath "J:\node\node.exe" `
    -ArgumentList "`"J:\omniroute\node_modules\omniroute\bin\omniroute.mjs`"" `
    -WorkingDirectory "J:\omniroute" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "J:\omniroute\server.out.log" `
    -RedirectStandardError "J:\omniroute\server.err.log" `
    -PassThru

# Health-check with retries
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

Should see `{"status":"ok"}`.

## 5. Add OpenRouter key (web Dashboard)

Open `http://localhost:20128` in browser → **Providers** → **OpenRouter** → paste your key `sk-or-v1-...` (free, `:free` models only).

> Key is stored encrypted in `J:\omniroute\data\provider-credentials.json`. **Don't put it in the repo or tutorial**.

## 6. Create `best-free-coding` combo (3 models, `priority` strategy)

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

**Order = priority**. If 1st returns 429/402/5xx, falls back to 2nd, then 3rd. Zero cost (all free).

## 7. Configure opencode to use OmniRoute

Edit `J:\opencode\config\opencode.jsonc` (or wherever your config lives):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "omniroute": {
      "npm": "@ai-sdk/openai-compatible",
      "baseURL": "http://localhost:20128/v1",
      "apiKey": "sk_omniroute",  // dummy, OmniRoute ignores if REQUIRE_API_KEY=false
      "models": {
        "best-free-coding": {}
      }
    }
  },
  "model": "omniroute/best-free-coding"
}
```

> `apiKey` is a placeholder; with `REQUIRE_API_KEY=false` OmniRoute doesn't validate it.

## 8. Update launchers to auto-start OmniRoute

**`J:\opencode.ps1`** (add at the top):

```powershell
# Auto-start OmniRoute if not responding
$omnirouteProc = $null
function Start-OmniRouteIfNeeded {
    try { Invoke-RestMethod -Uri "http://localhost:20128/api/health" -TimeoutSec 2 -ErrorAction Stop | Out-Null }
    catch {
        Write-Host "Starting OmniRoute..." -ForegroundColor Yellow
        $omnirouteProc = Start-Process -FilePath "J:\node\node.exe" `
            -ArgumentList "`"J:\omniroute\node_modules\omniroute\bin\omniroute.mjs`"" `
            -WorkingDirectory "J:\omniroute" -WindowStyle Hidden `
            -RedirectStandardOutput "J:\omniroute\server.out.log" `
            -RedirectStandardError "J:\omniroute\server.err.log" -PassThru
        Start-Sleep -Seconds 8
        # quick health-check
        for ($i=0; $i -lt 10; $i++) {
            try { Invoke-RestMethod -Uri "http://localhost:20128/api/health" -TimeoutSec 2 -ErrorAction Stop | Out-Null; break }
            catch { Start-Sleep -Seconds 2 }
        }
    }
}
Start-OmniRouteIfNeeded

# ... rest of launcher (OPENCODE_* vars, PATH, opencode.exe)
```

**`J:\opencode.bat`** (batch equivalent at the top).

## 9. Verification

```powershell
J:\opencode.ps1 models omniroute
# Should list the 3 combo models

J:\opencode.ps1 run "Hello, which model are you?"
# Real response via gateway; X-OmniRoute-Decision header shows which one served
```

**Force fallback**: Dashboard → Providers → disable Nemotron → repeat chat → should fall back to DeepSeek.

## Issues and lessons

> **Lesson: Portable Node 22 = real portability**  
> Both PCs use `J:\node\node.exe`. Doesn't matter what Node they have locally. The SSD carries it all.

> **Lesson: `runtime repair` fails without C++ toolchain**  
> Built-in `omniroute runtime repair` needs to compile `better-sqlite3`. Portable Node standalone avoids the issue.

> **Lesson: No internet → built-ins still work**  
> If offline, OmniRoute starts but providers fail. `opencode/*-free` built-in models still work as manual fallback.

> **Something we learned the hard way: 0xC0000005 crash on Node 20**  
> Not an OmniRoute bug, it's `better-sqlite3` native incompatibility with Node <22. Portable Node 22 on SSD is the cleanest fix.

## What's next

We have a gateway with automatic fallback between 3 free models. In the next part we configure **OpenRouter** in detail (`:free` models, limits, practical usage with `/connect` and `/models`).