---
title: "opencode rules for Windows and development"
description: "We create two rule files that guide opencode: one for PowerShell/Windows and one for the portable development environment on J:, with UTF-8 encoding, modules, and a Git workflow adapted to solo work."
date: 2026-08-12
order: 4
series: instalacion-opencode-portable-con-omniroute-y-openrouter
part: 4
tags: ["opencode", "rules", "powershell", "windows", "configuration"]
draft: false
---

After parts 1-3 I had portable opencode running on the SSD with OmniRoute and OpenRouter. But the assistant didn't know my environment: where Python lives, that I'm on PowerShell, what tooling each project uses. The solution was writing **two rule files** that opencode loads on startup and follows automatically.

## 1. Where rules live in opencode

In the portable install, config lives at `J:\opencode\xdg\config\opencode\`. Opencode automatically loads the `.md` files inside the `rules` folder:

```powershell
New-Item -ItemType Directory -Path "J:\opencode\xdg\config\opencode\rules" -Force
```

I split behavior into two files with distinct responsibilities:

```
J:\opencode\xdg\config\opencode\rules\
├── windows_rules.md      ← environment and terminal (PowerShell, paths, encoding)
└── development_rules.md  ← dev ecosystems (Node, Python, Git, env vars)
```

### Download the rules

Here's the package with both files ready to copy into `J:\opencode\xdg\config\opencode\rules\`:

<a class="download-btn" href="/rules.7z" download>Download rules.7z</a>

## 2. Windows rules: the baseline

The first file started with the essentials: I'm on native Windows with PowerShell and I should **never** use Unix commands. The Unix → PowerShell translation table was the core piece:

| ❌ BAD (Unix) | ✅ GOOD (PowerShell) |
|---------------|----------------------|
| `ls -la` or `ll` | `Get-ChildItem -Force` |
| `touch archivo.txt` | `New-Item -ItemType File -Name archivo.txt` |
| `mkdir -p dir/subdir` | `New-Item -ItemType Directory -Force -Path dir\subdir` |
| `rm -rf carpeta` | `Remove-Item -Recurse -Force carpeta` |
| `grep "texto" archivo.txt` | `Select-String -Pattern "texto" -Path archivo.txt` |
| `comando1 && comando2` | `comando1 ; comando2` |

> **Chaining rule:** in PowerShell 5.1 `&&` and `||` caused syntax errors; the semicolon was the only portable option. This changed with PowerShell 7 (we'll see it in section 6).

I also locked in the efficiency rules: short answers, group commands in a single request, selective reading (never read a whole file over 300 lines), and don't return entire files when only a few lines changed.

## 3. Expanding with PowerShell specifics

The baseline wasn't enough. I added ten subsections with the PowerShell that's actually useful day to day:

- **3.1 Paths**: native `\` and double quotes for spaces (`"C:\Program Files\app"`)
- **3.2 Environment variables**: `$env:NAME` (not `$NAME` or `%NAME%`)
- **3.3 Encoding**: UTF-16 default; force UTF-8 (lesson in section 5)
- **3.4 Error handling**: `$?`, `$LASTEXITCODE`, `try/catch`, `-ErrorAction Stop`
- **3.5 Pipeline**: .NET objects, `Where-Object`, `Select-Object`, `ForEach-Object`
- **3.6 Aliases**: `gci`, `ni`, `ri`, `cp`, `mv`, `cat`, `ps`, `kill`
- **3.7 Working directory**: `Set-Location`, `Push-Location`/`Pop-Location`
- **3.8 Quotes**: double quotes expand `$(...)`, single quotes are literal
- **3.9 Comparison operators**: `-eq`, `-like`, `-match`, `-contains`, `-in` with c/i suffixes
- **3.10 Background**: `Start-Process`, `Start-Job`, `Start-ThreadJob`

## 4. Restructure for quick lookup

With 13 subsections, navigating by eye was slow. I restructured the file with a **table of contents with anchors** at the top:

```markdown
## Table of contents
1. [General Principles](#1-general-principles)
2. [Basic Commands (Unix → PowerShell)](#2-basic-commands-unix--powershell)
3. [PowerShell Specifics](#3-powershell-specifics)
   - 3.1 [Paths and Separators](#31-paths-and-separators)
   - ...
```

Each section now has its number and anchor: the assistant locates "encoding" or "background jobs" at a glance without reading the whole file.

## 5. Add help and modules (the truly essential stuff)

Reviewing the file, two things were missing that I use **daily** even though they sound advanced:

- **3.11 Help system**: `Get-Help comando -Full`, `-Examples`, `-Online`, `Update-Help`
- **3.12 Modules**: `Get-Module -ListAvailable`, `Import-Module`, `Install-Module`, `Find-Module`

> **Lesson: in PowerShell 5.1 `-Encoding utf8` creates a BOM**  
> `Set-Content` and `Out-File -Encoding utf8` write UTF-8 **with BOM**, and modern tooling (Vite, Astro, Svelte) fails on those files. The portable fix: use the .NET method `[IO.File]::WriteAllText("archivo", "texto")`, which writes UTF-8 without BOM by default. Another fix from the same review: when launching dev servers in the background, redirect output to a log (or `$null`) so the terminal doesn't hang. With PowerShell 7 the BOM issue went away entirely (next section).

## 6. Migrating to PowerShell 7

I installed PowerShell 7 and the picture got better:

- **Encoding 3.3**: now `Set-Content`/`Out-File -Encoding utf8` produce **UTF-8 without BOM by default** — the `[IO.File]::WriteAllText` workaround is no longer needed
- **Chaining**: `&&` and `||` work natively in PS7+; `;` stays as the maximum-compatibility option
- **3.13 What's new**: pipeline chain operators, ternary `cond ? a : b`, null coalescing `??`, `$PSVersionTable.PSEdition = "Core"`, cross-platform, better performance (.NET 6+)

I updated section 2 and 3.3 to reflect the new environment, keeping a 5.1 note for compatibility in case we ever touch an older machine.

## 7. Development rules: the dev environment

The second file attacks the same problem but for **code**: what tooling to expect in each technology and how to work without cluttering the terminal.

**Node.js and frontend:**
- **Silent** installs, always: `npm install paquete --no-fund --no-audit --loglevel=error`
- Binaries with `npx` (never `-g` unless asked): `npx astro add tailwind`, `npx svelte-check`
- Dev servers (`npm run dev`) **block** the terminal → background technique from `windows_rules.md` or warn the user

**Quality and testing (2.4 and 2.5):** detect what the project uses (`lint`, `format`, `typecheck`), run them after touching code, and when a test fails, fix the real code — never tweak a test just to make it pass.

**Python (portable `J:` environment):** always call the executable directly, no venv activation:

| Context | Command/Path |
|---------|--------------|
| Global | `J:\Python\python.exe script.py` |
| Local venv | `.\venv\Scripts\python.exe script.py` |
| Install (quiet) | `.\venv\Scripts\python.exe -m pip install -q paquete` |

Plus environment setup, `requirements.txt`, `pyproject.toml` + `pip-tools`, and `pip freeze > requirements.txt`.

**Environment variables:** local untracked `.env`, versioned `.env.example` with dummy keys, loading with `dotenv` or `node --env-file=.env` (Node 20.6+), and **never** hardcode secrets.

## 8. Git adapted to a solo developer

The first version applied a team workflow (protected branch, mandatory PRs, squash). For my **solo work it was too restrictive**. I adapted it:

- **4.1 Agile flow / solo dev**: direct commits and pushes to `main` for fast iterations; separate branches only for big features that could break the app; integration with `git merge` (ideally `--ff-only` or with a prior rebase) for a linear history
- **4.2 Hooks**: if the `pre-commit` (lint + format + typecheck) or `commit-msg` fails, **never use `--no-verify`** — read the error, fix it, and retry the commit cleanly

## Issues and lessons

> **Lesson: rules evolve with the environment**  
> The UTF-8 BOM was only an issue in PowerShell 5.1. After migrating to PS7, the rule (and its recommended workaround) stopped making sense. Rule files aren't static: they're reviewed every time the tool changes, not the other way around.

> **Lesson: separate responsibilities between rule files**  
> `windows_rules.md` talks about *how* things run (PowerShell, paths, encoding); `development_rules.md` about *what* runs (npm, Python, Git). Keeping them separate keeps each file flat, short, and single-purpose.

> **Lesson: what seems "advanced" is often daily**  
> `Get-Help` and `Import-Module` looked like advanced-manual material, but they're two of the commands I use practically every day. We prioritized rules by usage frequency, not by complexity level.

## Closing

With these two files, opencode knows what environment it lives in and how to work efficiently: correct PowerShell commands, reliable UTF-8 encoding, project tooling detected before running anything, and a Git workflow designed for solo development. And as a good SSD citizen: everything lives in `J:\opencode\xdg\config\opencode\rules\`, ready to move between PCs without dragging host configuration along.

The series lives on: the assistant now knows the operating system and the development ecosystem. In the next part, any specific adjustments that come up along the way will be documented the same way.