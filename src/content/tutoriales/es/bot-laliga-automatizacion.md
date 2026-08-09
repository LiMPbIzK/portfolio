---
title: "Bot de LaLiga: automatización con GitHub Actions"
description: "El workflow con cron, los secretos del repositorio y la configuración local con .env para que el bot corra solo."
date: 2026-08-09
order: 4
series: bot-laliga
part: 4
tags: ["github actions", "cron", "secrets", "automatización"]
draft: false
---

Todo el sistema estaba montado y funcionaba en local. Faltaba lo que lo hace "serverless": que GitHub ejecute el script por mí cada X horas y le pase las credenciales sin exponerlas.

## El workflow

Creé `.github/workflows/sincronizar.yml`. Tiene dos disparadores: un `schedule` con cron y un `workflow_dispatch` para ejecutarlo a mano desde la interfaz (imprescindible para probar sin esperar a la hora programada).

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

El bloque `env` inyecta los secretos del repositorio como variables de entorno del runner. Por eso en `main.py` leemos todo con `os.environ.get(...)`.

## Los secretos del repositorio

Los creé en **Settings → Secrets and variables → Actions** del repo:

| Secreto | Descripción |
| :--- | :--- |
| `EQUIPO_OBJETIVO` | Nombre exacto del equipo tal y como aparece en la web de El Mundo. |
| `URL_LIV_DIVISION` | URL del calendario de Primera o Segunda División. |
| `GOOGLE_CALENDAR_ID` | Identificador del calendario de Google. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON completo de la cuenta de servicio. |
| `TELEGRAM_BOT_TOKEN` | Token del bot de @BotFather. |
| `TELEGRAM_CHAT_ID` | ID numérico de tu chat de Telegram. |

## Cron y la trampa del UTC

GitHub Actions ejecuta los cron en **hora UTC**, no en hora española. Y España cambia de huso:

- Con el **horario de verano** (marzo–octubre) va con UTC+2.
- Con el **de invierno** (octubre–marzo) va con UTC+1.

Si quieres que el script corra a las 8 y a las 20 en hora peninsular durante el invierno, el cron en UTC debe ser `'0 7,19 * * *'`.

> Lección: los cron de GitHub corren en UTC y, además, GitHub no garantiza puntualidad milimétrica: una tarea horaria puede retrasarse 15–30 minutos según la carga. Tampoco abuses de frecuencias altas (por ejemplo cada 5 minutos), porque las políticas de uso compartido pueden bloquear las Actions de tu repositorio. Para un calendario deportivo, cada 4 horas es más que suficiente.

## Desarrollo local con `.env`

En local no quiero copiar los secretos cada vez. Usé `python-dotenv`: creo un archivo `.env` en la raíz y el script lo carga al arrancar.

```python
from dotenv import load_dotenv

load_dotenv()  # En GitHub Actions no hay .env: usa los secretos
```

El `.env` va en `.gitignore` para no subir las credenciales al repo:

```text
.env
.venv/
__pycache__/
```

Y el `requirements.txt` quedó así:

```text
requests
beautifulsoup4
google-auth
google-api-python-client
python-dotenv
```

## El resultado

El flujo completo es: el cron arranca el entorno → `main.py` raspa el calendario de El Mundo → compara con Google Calendar → actualiza si hay cambio → avisa por Telegram si toca. Todo sin servidores y sin coste, desde un repositorio llamado `laliga-calendar-sync-bot`.

> Lección final: parametrizar el equipo por variables de entorno convirtió un bot pensado para un club concreto en un proyecto reusable: cualquiera puede copiarlo, poner su equipo y su división, y tener el mismo sistema funcionando.

¡Fin de la serie!
