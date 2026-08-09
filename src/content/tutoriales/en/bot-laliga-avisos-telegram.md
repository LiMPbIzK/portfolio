---
title: "LaLiga bot: Telegram alerts"
description: "Creating a bot with @BotFather, getting your chat_id and sending kickoff-change alerts with the Bot API."
date: 2026-08-09
order: 2
series: bot-laliga
part: 2
tags: ["telegram", "bot-api", "notifications"]
draft: false
---

With the matches structured, the next step was for the bot to ping my phone whenever the site changed a kickoff time. Telegram is perfect for this: free, with a simple HTTP API and no server needed.

## Creating the bot with @BotFather

1. Open a chat with [@BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. Give it a name (for example `Laliga Calendar Bot`) and a username ending in `bot` (for example `LaligaCalendarBot`).
4. @BotFather replies with the **HTTP API token**. That token is the password for our bot.

## Getting the chat_id

The bot needs to know which chat to deliver messages to. You get that number by talking to [@userinfobot](https://t.me/userinfobot), which replies with your numeric `Id`.

> With those two values (`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`) we have everything we need. They must never live in the code: we pass them through environment variables.

## Testing the API with curl

Before writing code I checked that the token worked:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

That returns `{"ok": true, ...}` if the token is valid. With the right chat_id, a test send:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>" \
  -d "text=Hello from the bot"
```

## The domain bug: `.com` vs `.org`

Here came a bug that cost us a while. We sent the message to `https://api.telegram.com/...` and the answer was a 301 redirect from a server called **Varnish**, never reaching Telegram.

> Lesson: the official Bot API domain is `api.telegram.org` (with `.org`, not `.com`). A `301` or an answer like `location: https://www.telegram.com/...` is the clue that you're using the wrong domain.

With the right domain, `curl -i` returned `200 OK` and `{"ok": true}`.

## The send function

In `main.py` I added a reusable function that reads the token and chat from the environment:

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

`parse_mode="Markdown"` enables bold text and formatting. The kickoff-change alert ended up like this:

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

> Something we learned the hard way: with `400 Bad Request` from Telegram it's almost always a wrong `chat_id` or a broken Markdown format. With `401 Unauthorized`, it's the token. It's worth reading the response body, it always spells it out.

## A workflow to test the send

Since the bot runs on GitHub Actions, I left a manual workflow (`test-telegram.yml`) that forces a send using the real secrets. That way you can check with one click that the bot reaches your phone:

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

In the next part we tie everything to Google Calendar so matches get scheduled and alerts fire automatically.
