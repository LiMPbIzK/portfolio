---
title: "LaLiga bot: goal and calendar scraping"
description: "A serverless Python bot that scrapes the LaLiga calendar from El Mundo and extracts the matches of any configurable team."
date: 2026-08-09
order: 1
series: bot-laliga
part: 1
tags: ["python", "scraping", "beautifulsoup", "la-liga"]
draft: false
---

This series tells how I built a bot that follows the calendar of **any Primera or Segunda División team**, syncs it to Google Calendar and alerts me on Telegram when a kickoff time changes. All without keeping a server running: the script runs on GitHub's cloud. We start with the trickiest part: getting the data.

## Why a serverless bot

Instead of renting a 24/7 server, I used **GitHub Actions** to run the script periodically at zero cost. The stack ended up like this:

- **Python 3.11+**.
- **Requests + Beautiful Soup 4** for scraping.
- **Google Calendar API v3** with a service account.
- **Telegram Bot API** for alerts.
- **GitHub Actions** as the scheduler.

## The fight for a data source

What looked like the easy step turned out to be the hardest. I tried several sources before finding a stable one:

- **BeSoccer**: unstable class selectors, structural changes and blocking.
- **resultados-futbol.com**: returned `403 Forbidden` to direct requests.
- **Playwright** (headless Chromium): it did load the DOM, but the result was still fragile — logs showing *"0 bloques de información"* and a pile of extra dependencies to maintain.

> Lesson: match-result websites block direct requests (403) and change their selectors often. Before setting up a headless browser, it's worth looking for a page with plain, stable HTML.

## The solution: El Mundo's calendar

El Mundo publishes the full calendar for each division in plain, accessible HTML:

- Primera: `https://www.elmundo.es/deportes/futbol/primera-division/calendario.html`
- Segunda: `https://www.elmundo.es/deportes/futbol/segunda-division/calendario.html`

Each match lives in a table row (`<tr>`) with a very predictable format:

```text
Real Madrid 26/08 21:00 R. Sociedad
```

## The scraper

The function takes the **division URL** and the **team name** as parameters. That way the same code works for any team:

```python
import requests
from bs4 import BeautifulSoup
import re

def extraer_calendario_elmundo(url_division, nombre_equipo):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(url_division, headers=headers, timeout=15)
        if response.status_code != 200:
            print(f"[Error] No se pudo acceder a la URL: {url_division}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        filas_partidos = soup.find_all('tr')
        partidos_estructurados = []
        contador_jornada = 1

        for fila in filas_partidos:
            texto = fila.get_text()
            if nombre_equipo in texto:
                texto_limpio = " ".join(texto.split()).strip()
                if len(texto_limpio) > 15:
                    match = re.search(r'^(.*?)\s+(\d{2}/\d{2})\s+(\d{2}:\d{2})\s+(.*)$', texto_limpio)
                    if match:
                        local = match.group(1).strip()
                        fecha_corta = match.group(2).strip()
                        hora = match.group(3).strip()
                        visitante = match.group(4).strip()

                        mes = int(fecha_corta.split('/')[1])
                        anio = 2026 if mes >= 8 else 2027
                        fecha_iso = f"{anio}-{fecha_corta.split('/')[1]}-{fecha_corta.split('/')[0]}"

                        if local == nombre_equipo:
                            rival = visitante
                            ubicacion = f"Estadio del {nombre_equipo}"
                            titulo_evento = f"{nombre_equipo} vs {rival} (J{contador_jornada})"
                        else:
                            rival = local
                            ubicacion = f"Estadio del {rival}"
                            titulo_evento = f"{rival} vs {nombre_equipo} (J{contador_jornada})"

                        partidos_estructurados.append({
                            "jornada": contador_jornada,
                            "titulo": titulo_evento,
                            "fecha_iso": fecha_iso,
                            "hora": hora,
                            "ubicacion": ubicacion
                        })
                        contador_jornada += 1
        return partidos_estructurados
    except Exception as e:
        print(f"Error en extracción: {e}")
        return []
```

## The regular expression

The key is the pattern that splits the four parts of each row:

```python
r'^(.*?)\s+(\d{2}/\d{2})\s+(\d{2}:\d{2})\s+(.*)$'
```

- `(.*?)` → home team (lazy match).
- `(\d{2}/\d{2})` → short date `DD/MM`.
- `(\d{2}:\d{2})` → time `HH:MM`.
- `(.*)` → away team.

## Figuring out the year

The site only publishes `DD/MM`, so I infer the year from the season. A season runs from August to June: if the month is August or later, it's the starting year; otherwise it's the next one.

```python
anio = 2026 if mes >= 8 else 2027
```

## Making it configurable

The entry point reads the team and the division from environment variables:

```python
EQUIPO = os.environ.get("EQUIPO_OBJETIVO")
URL_LIGA = os.environ.get("URL_LIV_DIVISION")
```

> Lesson: the team name must match **exactly** the one used by the site (for example `R. Sociedad`, not `Real Sociedad`). That's why I left collapsible lists in the README with the exact names for Primera and Segunda, ready to copy and paste.

With that we have the structured match list. In the next part we connect the Telegram bot to get alerts whenever a kickoff time changes.
