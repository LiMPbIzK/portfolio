---
title: "LaLiga bot: syncing with Google Calendar"
description: "Service account, dedicated calendar and the delta logic that creates, updates and alerts when a kickoff time changes."
date: 2026-08-09
order: 3
series: bot-laliga
part: 3
tags: ["google calendar", "api", "service-account"]
draft: false
---

The end goal was for matches to show up in my Google Calendar and, if the site changed a time, for the event to update **and** for an alert to reach me. To write to a user's calendar without asking for authorization every time, a service account is the way.

## Setting up the Google credentials

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Calendar API** from the search bar.
3. Go to **IAM & Admin → Service Accounts** and create one (for example `bot-futbol`).
4. Open the account, **Keys → Add key → JSON**. The credentials file downloads.
5. That JSON goes whole into the `GOOGLE_SERVICE_ACCOUNT_JSON` secret.

Then, in Google Calendar:
1. Create a dedicated calendar (for example *LaLiga Matches*).
2. In its settings, copy the **Calendar ID** (format `string@group.calendar.google.com`).
3. Share it with the service account's long email (it's inside the JSON) with **Make changes and manage sharing** permissions.

> Lesson: without that last step of sharing the calendar with the service account email, the API replies 403. The calendar and the account are separate entities; you have to introduce them.

## Authentication and reading events

```python
scopes = ['https://www.googleapis.com/auth/calendar']
creds_dict = json.loads(json_creds)
credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
service = build('calendar', 'v3', credentials=credentials)

events_result = service.events().list(calendarId=calendar_id, maxResults=250, singleEvents=True).execute()
eventos_actuales = events_result.get('items', [])
mapa_eventos = {evt['summary']: evt for evt in eventos_actuales if 'summary' in evt}
```

I map the existing events **by their title** so I can tell whether a match is already scheduled without scanning the whole list.

## The event structure

```python
start_dt = datetime.strptime(start_str, "%Y-%m-%dT%H:%M:%S")
end_dt = start_dt + timedelta(hours=2)

evento_body = {
    'summary': p['titulo'],
    'location': p['ubicacion'],
    'description': "Partido oficial de LaLiga. Sincronización automática.",
    'start': {'dateTime': start_dt.isoformat(), 'timeZone': 'Europe/Madrid'},
    'end': {'dateTime': end_dt.isoformat(), 'timeZone': 'Europe/Madrid'},
    'reminders': {
        'useDefault': False,
        'overrides': [
            {'method': 'popup', 'minutes': 60}
        ]
    }
}
```

The native reminder (`popup` 60 minutes before) is a detail that avoided depending on the Telegram app to not be late for a match.

## The delta logic

Here is the heart of the bot: comparing what the site says with what's already in the calendar.

```python
if p['titulo'] in mapa_eventos:
    existing_event = mapa_eventos[p['titulo']]
    existing_start = existing_event['start'].get('dateTime', '')[:16]
    target_start = start_dt.isoformat()[:16]

    if existing_start != target_start:
        # time changed: update the event and decide whether to alert
        service.events().update(calendarId=calendar_id, eventId=existing_event['id'], body=evento_body).execute()
else:
    # new match: create it
    service.events().insert(calendarId=calendar_id, body=evento_body).execute()
```

To avoid flooding with alerts, the bot only notifies when the change affects the **next chronological matchday**:

```python
ahora_mismo = datetime.now()
proximos_partidos = []
for p in partidos:
    p_str = f"{p['fecha_iso']}T{p['hora']}:00"
    p_dt = datetime.strptime(p_str, "%Y-%m-%dT%H:%M:%S")
    if p_dt >= ahora_mismo:
        proximos_partidos.append((p_dt, p['jornada']))
jornada_siguiente = min(proximos_partidos, key=lambda x: x[0])[1] if proximos_partidos else None

# and in the loop:
if p['jornada'] == jornada_siguiente:
    enviar_alerta_telegram(msg)
```

## The missing `T` bug

The first workflow run blew up with this:

```text
ValueError: time data '2026-08-16T18:00:00' does not match format '%Y-%m-%d%H:%M:%S'
```

> Lesson: `strptime` demands a format that matches **character by character**. The date came with the literal `T` separating date and time, so the format had to include it: `"%Y-%m-%dT%H:%M:%S"`. A single character was the difference between a correct event and a broken workflow.

With this, the calendar stays up to date and the alerts fire when they should. In the next part we automate everything with GitHub Actions and secrets.
