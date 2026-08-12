---
title: "Configuración de OpenRouter en opencode"
description: "Conectamos OpenRouter como proveedor de modelos :free en opencode y en OmniRoute, sin coste y con límites claros."
date: 2026-08-07
order: 3
series: instalacion-opencode-portable-con-omniroute-y-openrouter
part: 3
tags: ["openrouter", "opencode", "modelos", "gratis"]
draft: false
---

Después de montar opencode portable en el SSD, tocaba ampliar el catálogo de modelos gratis. **OpenRouter** agrega cientos de proveedores bajo una única API y muchos modelos tienen variante `:free`. Esta parte cubre cómo conectarlo tanto directamente en opencode como a través de OmniRoute.

## Qué necesitamos

- La instalación portable de opencode de la parte 1
- (Opcional) OmniRoute de la parte 2 para fallback automático
- Una cuenta gratuita en OpenRouter

## 1. Crear la cuenta y la key de API

1. Regístrate en openrouter.ai (cuenta gratuita).
2. Ve a **Dashboard → Keys**.
3. Crea una key de API (tipo "free" — solo puede usar modelos `:free`).
4. Cópiala en un lugar seguro. **No la compartas ni la pongas en el repositorio.**

## 2. Conectar OpenRouter directamente en opencode

Desde el TUI de opencode, ejecuta:

```
/connect
```

Selecciona **OpenRouter** en la lista y pega tu key cuando la pida. Opencode guarda la credencial cifrada en su config (`auth.json` dentro de `J:\opencode\config` si usas la instalación portable).

> **Alternativa**: edita a mano el fichero de providers de opencode añadiendo el proveedor OpenRouter con la variable de entorno correspondiente o el fichero `auth.json`. OpenCode ya incluye OpenRouter pre-cableado en su catálogo de providers.

## 3. Elegir un modelo `:free`

Los modelos gratuitos de OpenRouter llevan el sufijo `:free`. Puedes consultar el catálogo desde opencode:

```
/models
```

O directamente por CLI:

```powershell
J:\opencode.ps1 models openrouter
```

Los nombres tienen formato `vendor/modelo:free`. Ejemplos habituales: `meta-llama/llama-4-...:free`, `deepseek/deepseek-r1:free`, etc.

Para usarlo, selecciónalo con `/models` o pásalo por CLI:

```powershell
J:\opencode.ps1 run --model openrouter/<modelo>:free "Hola"
```

## 4. Conectar OpenRouter vía OmniRoute (fallback automático)

Si seguiste la parte 2, en vez de apuntar opencode a OpenRouter directamente, añades tu key en el dashboard de OmniRoute:

1. Arranca OmniRoute (`J:\opencode.ps1` ya lo hace si lo configuraste).
2. Abre `http://localhost:20128` en el navegador.
3. Ve a **Providers → OpenRouter** y pega tu key.
4. OmniRoute la cifra y la guarda en `J:\omniroute\data\provider-credentials.json`.

Así, OpenRouter queda como **un proveedor más dentro del combo**: si quieres, añades una entrada `openrouter/<modelo>:free` al combo `best-free-coding`, y OmniRoute cae a ella cuando los otros fallen.

> **Límite real**: los modelos `:free` de OpenRouter suelen tener tope diario (~50 requests a saldo 0). Cuando lo agotas, devuelven 429. Con OmniRoute, eso dispara el fallback al siguiente modelo del combo automáticamente. Sin OmniRoute, tendrías que cambiar de modelo a mano con `/models`.

## 5. Usar modelos de pago (opcional)

Añadir créditos a la cuenta te permite usar modelos de pago (sin sufijo `:free`). Misma key, mismos pasos. Puedes añadirlos **al inicio del combo** (como prioridad) y dejar los gratis como respaldo.

## Problemas y lecciones

> **Lección: la key es un secreto**  
> Trátala como una contraseña. OmniRoute y opencode la guardan cifrada en el SSD. Si la filtras (git, logs), revócala desde el dashboard de OpenRouter y crea otra.

> **Lección: `:free` es para saldo 0**  
> Si tienes crédito, los modelos `:free` siguen funcionando pero tienen límites. Para uso diario sin sorpresas, o asumes el fallback con OmniRoute o monitorizas los 429.

> **Algo que aprendimos por las malas: Kimi K3 vía OpenRouter fue un fiasco**  
> Probé también Kimi K3 (`:free`) y no funcionaba bien (errores intermitentes, calidad irregular), así que lo dejé fuera del combo. El combo quedó con Nemotron 3 Ultra Free, DeepSeek V4 Flash Free y Big Pickle.

## Cierre

Con OpenRouter conectado tienes dos capas de modelos gratis:
- **Directa**: `/connect` → OpenRouter → `/models` para elegir.
- **Con fallback**: key en OmniRoute → formar parte del combo `best-free-coding`.

Con esto la parte 3 deja atada la parte "modelos" de la serie: opencode portable en el SSD + gateway con fallback automático + OpenRouter como proveedor extra. El siguiente paso natural es enseñar a opencode a trabajar en este entorno: en la parte 4 creamos las reglas de Windows y de desarrollo que guían al asistente.