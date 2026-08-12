---
title: "OpenRouter configuration in opencode"
description: "Connect OpenRouter as a :free model provider in opencode and OmniRoute, zero cost with clear limits."
date: 2026-08-07
order: 3
series: instalacion-opencode-portable-con-omniroute-y-openrouter
part: 3
tags: ["openrouter", "opencode", "models", "free"]
draft: false
---

After setting up portable opencode on the SSD, it was time to expand the free model catalog. **OpenRouter** aggregates hundreds of providers under a single API and many models have a `:free` variant. This part covers how to connect it both directly in opencode and through OmniRoute.

## What we need

- The portable opencode installation from part 1
- (Optional) OmniRoute from part 2 for automatic fallback
- A free OpenRouter account

## 1. Create account and API key

1. Sign up at openrouter.ai (free account).
2. Go to **Dashboard → Keys**.
3. Create an API key (type "free" — can only use `:free` models).
4. Copy it somewhere safe. **Do not share it or put it in the repository.**

## 2. Connect OpenRouter directly in opencode

From the opencode TUI, run:

```
/connect
```

Select **OpenRouter** from the list and paste your key when prompted. Opencode stores the credential encrypted in its config (`auth.json` inside `J:\opencode\config` if using the portable install).

> **Alternative**: manually edit opencode's providers file adding the OpenRouter provider with the corresponding env var or `auth.json` file. OpenCode already includes OpenRouter pre-wired in its provider catalog.

## 3. Pick a `:free` model

Free models on OpenRouter carry the `:free` suffix. Browse the catalog from opencode:

```
/models
```

Or directly via CLI:

```powershell
J:\opencode.ps1 models openrouter
```

Names follow `vendor/model:free` format. Common examples: `meta-llama/llama-4-...:free`, `deepseek/deepseek-r1:free`, etc.

To use one, select it with `/models` or pass it via CLI:

```powershell
J:\opencode.ps1 run --model openrouter/<model>:free "Hello"
```

## 4. Connect OpenRouter via OmniRoute (automatic fallback)

If you followed part 2, instead of pointing opencode directly at OpenRouter, add your key in the OmniRoute dashboard:

1. Start OmniRoute (`J:\opencode.ps1` does this if configured).
2. Open `http://localhost:20128` in browser.
3. Go to **Providers → OpenRouter** and paste your key.
4. OmniRoute encrypts and stores it in `J:\omniroute\data\provider-credentials.json`.

Now OpenRouter becomes **just another provider inside the combo**: if you want, add an `openrouter/<model>:free` entry to the `best-free-coding` combo, and OmniRoute will fall back to it when the others fail.

> **Real limit**: OpenRouter `:free` models usually have a daily cap (~50 requests at zero balance). When exhausted, they return 429. With OmniRoute, that triggers automatic fallback to the next model in the combo. Without OmniRoute, you'd have to switch models manually with `/models`.

## 5. Use paid models (optional)

Adding credits to your account unlocks paid models (no `:free` suffix). Same key, same steps. You can add them **at the top of the combo** (as priority) and keep the free ones as backup.

## Issues and lessons

> **Lesson: the key is a secret**  
> Treat it like a password. OmniRoute and opencode store it encrypted on the SSD. If you leak it (git, logs), revoke it from the OpenRouter dashboard and create a new one.

> **Lesson: `:free` is for zero balance**  
> If you have credit, `:free` models still work but have limits. For daily use without surprises, either accept the fallback via OmniRoute or monitor the 429s.

> **Something we learned the hard way: Kimi K3 via OpenRouter was a fiasco**  
> I also tried Kimi K3 (`:free`) and it didn't work well (intermittent errors, inconsistent quality), so I left it out of the combo. The combo ended up with Nemotron 3 Ultra Free, DeepSeek V4 Flash Free, and Big Pickle.

## Closing

With OpenRouter connected you have two layers of free models:
- **Direct**: `/connect` → OpenRouter → `/models` to choose.
- **With fallback**: key in OmniRoute → part of the `best-free-coding` combo.

That wraps up the "models" side of the series: portable opencode on the SSD + gateway with automatic fallback + OpenRouter as extra provider. The natural next step is teaching opencode to work in this environment: in part 4 we create the Windows and development rules that guide the assistant.