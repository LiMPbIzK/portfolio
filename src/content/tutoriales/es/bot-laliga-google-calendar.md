---
title: "Bot de LaLiga: sincronización con Google Calendar"
description: "Cuenta de servicio, calendario dedicado y la lógica de delta que crea, actualiza y avisa cuando cambia un horario."
date: 2026-08-09
order: 3
series: bot-laliga
part: 3
tags: ["google calendar", "api", "service-account"]
draft: false
---

El objetivo final era que los partidos aparecieran en mi calendario de Google y que, si la web cambiaba una hora, el evento se actualizara **y** me llegara la alerta. Para escribir en el calendario de un usuario sin pedirle autorización cada vez se usa una cuenta de servicio.

## Preparar las credenciales de Google

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilita la **Google Calendar API** desde el buscador.
3. Ve a **IAM y administración → Cuentas de servicio** y crea una (por ejemplo `bot-futbol`).
4. Entra en la cuenta, pestaña **Claves → Agregar clave → JSON**. Se descarga el archivo con las credenciales.
5. Ese JSON va entero al secreto `GOOGLE_SERVICE_ACCOUNT_JSON`.

Después, en Google Calendar:
1. Crea un calendario dedicado (por ejemplo *Partidos de LaLiga*).
2. En su configuración, copia el **ID del calendario** (formato `cadena@group.calendar.google.com`).
3. Compártelo con el email largo de la cuenta de servicio (está dentro del JSON) con permisos de **Hacer cambios y administrar la compartición**.

> Lección: sin ese último paso de compartir el calendario con el email de la cuenta de servicio, la API responde 403. El calendario y la cuenta son entidades distintas; hay que presentarlos.

## Autenticación y lectura de eventos

```python
scopes = ['https://www.googleapis.com/auth/calendar']
creds_dict = json.loads(json_creds)
credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
service = build('calendar', 'v3', credentials=credentials)

events_result = service.events().list(calendarId=calendar_id, maxResults=250, singleEvents=True).execute()
eventos_actuales = events_result.get('items', [])
mapa_eventos = {evt['summary']: evt for evt in eventos_actuales if 'summary' in evt}
```

Mapeo los eventos existentes **por su título** para saber si un partido ya está agendado sin tener que recorrer la lista.

## La estructura del evento

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

El recordatorio nativo (`popup` 60 minutos antes) es un detalle que evitó depender de la app de Telegram para no llegar tarde a un partido.

## La lógica de delta

Aquí está el corazón del bot: comparar lo que dice la web con lo que ya hay en el calendario.

```python
if p['titulo'] in mapa_eventos:
    existing_event = mapa_eventos[p['titulo']]
    existing_start = existing_event['start'].get('dateTime', '')[:16]
    target_start = start_dt.isoformat()[:16]

    if existing_start != target_start:
        # hay cambio: actualizar el evento y decidir si avisar
        service.events().update(calendarId=calendar_id, eventId=existing_event['id'], body=evento_body).execute()
else:
    # partido nuevo: crearlo
    service.events().insert(calendarId=calendar_id, body=evento_body).execute()
```

Para no saturar con avisos, el bot solo notifica cuando el cambio afecta a la **próxima jornada cronológica**:

```python
ahora_mismo = datetime.now()
proximos_partidos = []
for p in partidos:
    p_str = f"{p['fecha_iso']}T{p['hora']}:00"
    p_dt = datetime.strptime(p_str, "%Y-%m-%dT%H:%M:%S")
    if p_dt >= ahora_mismo:
        proximos_partidos.append((p_dt, p['jornada']))
jornada_siguiente = min(proximos_partidos, key=lambda x: x[0])[1] if proximos_partidos else None

# y en el bucle:
if p['jornada'] == jornada_siguiente:
    enviar_alerta_telegram(msg)
```

## El error del `T` perdido

El primer run del workflow reventó con esto:

```text
ValueError: time data '2026-08-16T18:00:00' does not match format '%Y-%m-%d%H:%M:%S'
```

> Lección: `strptime` exige un formato que coincida **carácter a carácter**. La fecha venía con la `T` literal que separa fecha y hora, así que el formato debía incluirla: `"%Y-%m-%dT%H:%M:%S"`. Un solo carácter marcaba la diferencia entre un evento correcto y un workflow roto.

Con esto, el calendario se mantiene al día y las alertas saltan cuando toca. En la siguiente parte automatizamos todo con GitHub Actions y los secretos.
