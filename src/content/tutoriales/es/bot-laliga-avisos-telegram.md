---
title: "Bot de LaLiga: avisos por Telegram"
description: "Crear un bot con @BotFather, obtener tu chat_id y enviar alertas de cambios de horario con la Bot API."
date: 2026-08-09
order: 2
series: bot-laliga
part: 2
tags: ["telegram", "bot-api", "notificaciones"]
draft: false
---

Con los partidos ya estructurados, el siguiente paso era que el bot me avisara en el móvil cuando la web cambiara un horario. Telegram es perfecto para esto: gratis, con una API HTTP sencilla y sin necesidad de servidor.

## Crear el bot con @BotFather

1. Abre una conversación con [@BotFather](https://t.me/BotFather).
2. Envía `/newbot`.
3. Ponle un nombre (por ejemplo `Laliga Calendar Bot`) y un username que termine en `bot` (por ejemplo `LaligaCalendarBot`).
4. @BotFather te devuelve el **token** HTTP API. Ese token es la contraseña de nuestro bot.

## Obtener el chat_id

El bot necesita saber a qué chat enviar los mensajes. Ese número se consigue hablando con [@userinfobot](https://t.me/userinfobot), que responde con tu `Id` numérico.

> Con esos dos datos (`TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`) tenemos todo lo necesario. Nunca deben ir en el código: los pasamos por variables de entorno.

## Probar la API con curl

Antes de escribir código comprobé que el token funcionaba:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

Esto devuelve `{"ok": true, ...}` si el token es válido. Con el chat_id correcto, un envío de prueba:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>" \
  -d "text=Hola desde el bot"
```

## El error del dominio: `.com` vs `.org`

Aquí apareció un fallo que nos costó un rato. Enviamos el mensaje a `https://api.telegram.com/...` y la respuesta era un redireccionamiento 301 de un servidor llamado **Varnish**, sin llegar nunca a Telegram.

> Lección: el dominio oficial de la Bot API es `api.telegram.org` (con `.org`, no `.com`). Un `301` o una respuesta del tipo `location: https://www.telegram.com/...` es la pista de que estás usando el dominio equivocado.

Con el dominio correcto, el `curl -i` devolvía `200 OK` y `{"ok": true}`.

## La función de envío

En `main.py` añadí una función reutilizable que lee el token y el chat de las variables de entorno:

```python
def enviar_alerta_telegram(mensaje):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        print("[Aviso] Telegram no configurado o faltan variables de entorno.")
        return

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": mensaje,
        "parse_mode": "Markdown"
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code != 200:
            print(f"[Error] No se pudo enviar el mensaje a Telegram: {response.text}")
    except Exception as e:
        print(f"[Error] Excepción al conectar con Telegram: {e}")
```

`parse_mode="Markdown"` permite negritas y formato en el mensaje. La alerta de cambio de horario quedó así:

```python
msg = (
    f"🚨 *¡Cambio de horario en la próxima jornada!*\n\n"
    f"📌 *Partido:* {p['titulo']}\n"
    f"❌ *Antes:* {fecha_antigua_str}\n"
    f"✅ *Ahora:* {fecha_nueva_str}\n"
    f"🏟️ *Lugar:* {p['ubicacion']}"
)
enviar_alerta_telegram(msg)
```

> Algo que aprendimos por las malas: con `400 Bad Request` en Telegram casi siempre es un `chat_id` incorrecto o un formato Markdown roto. Con `401 Unauthorized`, el token. Vale la pena leer el cuerpo de la respuesta, siempre lo dice claro.

## Un workflow para probar el envío

Como el bot corre en GitHub Actions, dejé un workflow manual (`test-telegram.yml`) que fuerza el envío usando los secretos reales. Así se puede comprobar en un clic que el bot llega al móvil:

```yaml
name: Prueba Forzada Telegram

on:
  workflow_dispatch:

jobs:
  test-envio:
    runs-on: ubuntu-latest
    steps:
      - name: Forzar Mensaje Directo
        env:
          TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
          EQUIPO: ${{ secrets.EQUIPO_OBJETIVO }}
        run: |
          curl -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
            -d "chat_id=${CHAT_ID}" \
            -d "parse_mode=Markdown" \
            -d "text=🚨 *¡Cambio de horario en la próxima jornada!*"
```

En la siguiente parte conectamos todo con Google Calendar para que los partidos se agenden y las alertas se disparen automáticamente.
