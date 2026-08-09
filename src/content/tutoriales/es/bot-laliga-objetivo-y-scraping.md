---
title: "Bot de LaLiga: objetivo y scraping del calendario"
description: "Un bot serverless en Python que raspa el calendario de LaLiga desde El Mundo y extrae los partidos de cualquier equipo configurable."
date: 2026-08-09
order: 1
series: bot-laliga
part: 1
tags: ["python", "scraping", "beautifulsoup", "la-liga"]
draft: false
---

Esta serie cuenta cómo construí un bot que sigue el calendario de **cualquier equipo de Primera o Segunda División**, lo sincroniza en Google Calendar y me avisa por Telegram cuando cambia un horario. Todo sin mantener un servidor: el script corre en la nube de GitHub. Empezamos por la parte más delicada: sacar los datos.

## Por qué un bot serverless

En lugar de alquilar un servidor encendido 24/7, usé **GitHub Actions** para ejecutar el script de forma periódica y con coste cero. El stack quedó así:

- **Python 3.11+**.
- **Requests + Beautiful Soup 4** para el scraping.
- **Google Calendar API v3** con una cuenta de servicio.
- **Telegram Bot API** para las alertas.
- **GitHub Actions** como planificador.

## La guerra por una fuente de datos

Lo que parecía el paso fácil resultó ser el más complicado. Probé varias fuentes antes de encontrar una estable:

- **BeSoccer**: selectores de clase inestables, cambios de estructura y bloqueos.
- **resultados-futbol.com**: devolvía `403 Forbidden` a las peticiones directas.
- **Playwright** (navegador Chromium headless): conseguía cargar el DOM, pero el resultado seguía siendo frágil: logs con *"0 bloques de información"* y un montón de dependencias para mantener.

> Lección: las webs de resultados bloquean las peticiones directas (403) y cambian sus selectores a menudo. Antes de montar un navegador headless, merece la pena buscar una página con HTML público y estructura estable.

## La solución: el calendario de El Mundo

El Mundo publica el calendario completo de cada división en HTML plano y accesible:

- Primera: `https://www.elmundo.es/deportes/futbol/primera-division/calendario.html`
- Segunda: `https://www.elmundo.es/deportes/futbol/segunda-division/calendario.html`

Cada partido vive en una fila de tabla (`<tr>`) con un formato muy predecible:

```text
Real Madrid 26/08 21:00 R. Sociedad
```

## El scraper

La función recibe la **URL de la división** y el **nombre del equipo** como parámetros. Así el mismo código sirve para cualquier equipo:

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

## La expresión regular

La clave está en el patrón que separa las cuatro partes de cada fila:

```python
r'^(.*?)\s+(\d{2}/\d{2})\s+(\d{2}:\d{2})\s+(.*)$'
```

- `(.*?)` → equipo local (de forma perezosa).
- `(\d{2}/\d{2})` → fecha corta `DD/MM`.
- `(\d{2}:\d{2})` → hora `HH:MM`.
- `(.*)` → equipo visitante.

## Deduciendo el año

La web solo publica `DD/MM`, así que deduzco el año según la temporada. Una temporada va de agosto a junio: si el mes es agosto o posterior, es el año de inicio; si no, es el siguiente.

```python
anio = 2026 if mes >= 8 else 2027
```

## Haciéndolo configurable

El punto de entrada lee el equipo y la liga de variables de entorno:

```python
EQUIPO = os.environ.get("EQUIPO_OBJETIVO")
URL_LIGA = os.environ.get("URL_LIV_DIVISION")
```

> Lección: el nombre del equipo debe coincidir **exactamente** con el que usa la web (por ejemplo `R. Sociedad`, no `Real Sociedad`). Por eso en el README dejé listas desplegables con los nombres exactos de Primera y Segunda para copiar y pegar.

Con esto ya tenemos la lista estructurada de partidos. En la siguiente parte conectamos el bot de Telegram para recibir las alertas cuando cambie un horario.
