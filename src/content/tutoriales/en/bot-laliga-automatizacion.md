---
title: "LaLiga bot: automating with GitHub Actions"
description: "The cron workflow, repository secrets and local setup with .env so the bot runs on its own."
date: 2026-08-09
order: 4
series: bot-laliga
part: 4
tags: ["github actions", "cron", "secrets", "automation"]
draft: false
---

The whole system was built and working locally. What was missing was what makes it "serverless": having GitHub run the script for me every X hours and pass it the credentials without exposing them.

## The workflow

I created `.github/workflows/sincronizar.yml`. It has two triggers: a `schedule` with cron and a `workflow_dispatch` to run it by hand from the UI (essential for testing without waiting for the scheduled time).

```yaml
name: Sincronización de Calendario y Alertas

on:
  schedule:
    - cron: '0 */4 * * *'
  workflow_dispatch:

jobs:
  run-bot:
    runs-on: ubuntu-latest

    steps:
      - name: Configurar el Repositorio
        uses: actions/checkout@v4

      - name: Configurar Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Instalar Dependencias
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Ejecutar Bot de Sincronización
        env:
          GOOGLE_CALENDAR_ID: ${{ secrets.GOOGLE_CALENDAR_ID }}
          GOOGLE_SERVICE_ACCOUNT_JSON: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_JSON }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
          EQUIPO_OBJETIVO: ${{ secrets.EQUIPO_OBJETIVO }}
          URL_LIV_DIVISION: ${{ secrets.URL_LIV_DIVISION }}
        run: python main.py
```

The `env` block injects the repository secrets as environment variables on the runner. That's why in `main.py` we read everything with `os.environ.get(...)`.

## Repository secrets

I created them under **Settings → Secrets and variables → Actions** in the repo:

| Secret | Description |
| :--- | :--- |
| `EQUIPO_OBJETIVO` | Exact team name as it appears on the El Mundo site. |
| `URL_LIV_DIVISION` | URL of the Primera or Segunda División calendar. |
| `GOOGLE_CALENDAR_ID` | Google calendar identifier. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full service account JSON. |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather. |
| `TELEGRAM_CHAT_ID` | Numeric ID of your Telegram chat. |

## Cron and the UTC trap

GitHub Actions runs cron schedules in **UTC**, not Spanish time. And Spain changes time zone:

- During **daylight saving** (March–October) it's UTC+2.
- During **standard time** (October–March) it's UTC+1.

If you want the script to run at 8 and 20 in peninsular time during winter, the UTC cron must be `'0 7,19 * * *'`.

> Lesson: GitHub cron jobs run in UTC and, on top of that, GitHub doesn't guarantee precise timing: an hourly job can be delayed 15–30 minutes depending on load. Also, don't abuse high frequencies (for example every 5 minutes), because shared-use policies can block your repository's Actions. For a sports calendar, every 4 hours is more than enough.

## Local development with `.env`

Locally I don't want to copy the secrets every time. I used `python-dotenv`: I create a `.env` file at the root and the script loads it on startup.

```python
from dotenv import load_dotenv

load_dotenv()  # On GitHub Actions there's no .env: it uses the secrets
```

The `.env` goes in `.gitignore` so credentials never reach the repo:

```text
.env
.venv/
__pycache__/
```

And `requirements.txt` ended up like this:

```text
requests
beautifulsoup4
google-auth
google-api-python-client
python-dotenv
```

## The result

The full flow is: the cron starts the environment → `main.py` scrapes the El Mundo calendar → compares with Google Calendar → updates if there's a change → alerts on Telegram when appropriate. All with no servers and no cost, from a repository called `laliga-calendar-sync-bot`.

> Final lesson: parameterizing the team through environment variables turned a bot built for one specific club into a reusable project: anyone can fork it, set their team and division, and have the same system running.

End of the series!
