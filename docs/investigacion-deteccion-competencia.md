# Investigación: cómo detectan el tiro los competidores y las patentes relacionadas

**Fecha de investigación:** 2026-09-17
**Objetivo:** documentar exhaustivamente CÓMO implementan la detección de tiros/flechas los competidores de ArcheryWatch (K Archery, Garmin ArcheryX, Mantis X8, Arrow Tempo, BOWdometer, apps de cronómetro de tiro) y las patentes relacionadas, para mejorar el detector de suelta con acelerómetro de muñeca a 100 Hz + magnetómetro 50 Hz de ArcheryWatch (Garmin FR165).
**Convención de fiabilidad** (misma que `competencia-archeryx.md`, ampliada):

- 🔒 **DOCUMENTACIÓN OFICIAL** — fuente primaria del fabricante (ficha de tienda, manual, PR, FAQ oficial, metadatos de API).
- 💻 **CÓDIGO VERIFICADO** — código fuente leído directamente (repositorios públicos).
- 💬 **TESTIMONIO** — reseñas de usuarios, foros, prensa especializada con prueba de mano.
- 🧠 **INFERENCIA** — deducción nuestra a partir de lo anterior (marcada siempre).
- ⚠️ **NO VERIFICADO** — rumor/caché/fuente única no corroborada.

> **Nota metodológica (leer antes de usar):** el motor de búsqueda integrado agotó su cuota durante toda la sesión; la búsqueda se hizo con DuckDuckGo vía proxy de renderizado (Jina Reader) y consultas directas. Reddit y Justia bloquearon el acceso directo (403) y el Wayback Machine estaba caído, por lo que: (a) los hilos de Reddit se citan solo por snippets de buscador; (b) el changelog histórico de K Archery proviene de la caché del buscador, no de la ficha viva; (c) las reivindicaciones de patentes se extrajeron de Google Patents vía renderizado, no del PDF de la USPTO. Todo lo marcado 🔒 fue verificado contra la fuente primaria en el propio fetch de hoy; lo marcado ⚠️ no.

Este documento **complementa** a `competencia-archeryx.md`, `competencia-mantis.md`, `competencia-arqueria.md` y `competencia-wearables.md` (que cubren producto/precio/posicionamiento); aquí el foco es exclusivamente el **mecanismo de detección**.

---

## TL;DR — los 8 patrones que usan todos

1. **Nadie publica umbral numérico.** Ni Garmin, ni K Archery, ni Mantis documentan el umbral real; todos hablan de "firmas", "umbrales calibrados" o "ajustes de sensibilidad" sin cifras.
2. **Calibración por plantilla individual** (Garmin ArcheryX: 1 tiro de calibración "enseña al reloj cómo es un tiro"; K Archery: umbrales calibrados con élite; Goertek WO2018036316: plantillas DTW por eje). Es el patrón dominante en 2026.
3. **Verificación en dos etapas** (gatillo barato → captura/verificación rica): HS Produkt EP4392730B1 (piezo despierta al accel), Kordtech US20230228510A1 (evento de ~40 g despierta el MCU, luego 4–8 "gates" por regiones de interés), Arrow Tempo (movimiento Y audio deben coincidir).
4. **Período refractario explícito** en todos los cronómetros acústicos ("echo lockout" de 100 ms por defecto, rango 20–500 ms en código abierto verificado; "Echo Delay" ajustable en la patente del ecosistema Mantis).
5. **Ventana de análisis acotada alrededor del disparo**: BOWdometer recorta "un par de segundos antes y medio segundo después"; ArcheryX analiza "el último segundo antes de la suelta" (Break Radius); la diana óptica de 1998 ya descartaba glitches por ancho de pulso mínimo.
6. **El acelerómetro satura con el disparo** (problema documentado en US20230251055A1: "sensors become saturated during the shot"); las soluciones de la patente: muestrear 50–3200 Hz y expulsar los datos por paquetes ANTES del disparo, o usar umbrales de potencia espectral (DFT/KLT) en lugar de amplitud cruda.
7. **Colocación del sensor dividida**: ArcheryX y Arrow Tempo ponen el reloj en el **brazo del arco**; K Archery históricamente pedía el **brazo de la cuerda** (como ArcheryWatch); Mantis y BOWdometer se montan **en el riser**. La firma en el brazo de cuerda es la menos explorada comercialmente.
8. **Corrección manual siempre disponible**: "Delete Last Shot" (Garmin), fix a un toque (Arrow Tempo), borrar tiros en ShotView; las quejas de K Archery son justo de tiros no contados, no de falsos positivos masivos.

---

## 1. K Archery (Connect IQ, dev Jean-Noel_K)

Ficha: https://apps.garmin.com/en-US/apps/f3b2b9de-0a33-47d2-bfda-b6df45efc946

### 1.1 Ficha técnica verificada (🔒 API interna de la tienda, consultada 2026-09-17)

Datos extraídos del JSON `__NEXT_DATA__`/`_next/data` de la propia ficha de la tienda:

| Campo | Valor |
|---|---|
| Nombre actual | "K Archery - shoot detection and analysis" |
| Desarrollador | Jean-Noel_K (email de soporte: jn.k@posteo.net) |
| Primera aprobación | 1657179258000 ms epoch = **7 de julio de 2022** 🔒 |
| Última versión / fecha | 4.6 (build interno 73), release 1789461641000 = **15-16 sep 2026** 🔒 |
| Valoración | 4.1 / 5 con **40 reseñas**, ~1000 descargas 🔒 |
| Tamaño | ~88-91 KB por dispositivo 🔒 |
| Permisos | `Fit`, `SensorLogging`, `Communications`, `Positioning`, `FitContributor`, `Sensor` 🔒 |
| Web | karchery.jnk-conseil.fr (SPA, plataforma "K Archery Connect") |
| Vídeo demo oficial | YouTube `FaH9l_sl4q0`, "K Archery demo", canal TheDocNo 🔒 (oEmbed) |

**Dato relevante de permisos (🧠 inferencia):** `SensorLogging` + `FitContributor` significan que la app graba **datos de sensor de alta resolución en el FIT** (la API `FitContributor` es la única forma de escribir series temporales propias en el activity file). Es la misma vía que tiene ArcheryWatch para exportar acelerómetro/magnetómetro a 100/50 Hz.

**Ajustes de la app (🔒+🧠):** la metadata de la tienda marca `settingsAvailabilityInfo = true` para todos los tipos de dispositivo, es decir, **la app expone ajustes de Connect IQ** (configurables desde Garmin Connect). Sin embargo, **ningún material público documenta qué ajustes son** (la descripción no menciona sensibilidad; la web no tiene página de FAQ pública localizable). La web oficial es una SPA cuyas rutas son solo `/abonnement`, `/admin`, `/compte`, `/login`, `/montres`, `/register`, `/unlock` (💻 verificado inspeccionando el bundle JS `index-CottbpbQ.js`): no hay FAQ ni documentación de algoritmo pública.

### 1.2 Qué dice exactamente del algoritmo (🔒 descripción oficial de la ficha, locale fr-FR/en-US, consultada 2026-09-17)

Traducción literal de la sección "Comment ça marche ? / How does it work?":

> "El algoritmo de detección analiza en continuo los datos del acelerómetro y **reconoce la firma característica del lâcher de cuerda** (suelta de cuerda). **Sus umbrales fueron calibrados a partir de datos reales de arqueros de alto nivel (competidores internacionales en recurvo)**, para seguir siendo fiable tanto en un tiro 'limpio' como en uno más irregular — sin confundir nunca una suelta con un simple movimiento de brazo."

Puntos extraíbles:

- **Modelo: reconocimiento de firma (template/signature matching)** sobre la señal continua del acelerómetro, no un simple pico de amplitud. 🧠 La palabra "signature" + "seuils" (umbrales) sugiere plantilla o conjunto de características con umbral, comparado en continuo.
- **Calibración con élite recurvo** (internacional): los umbrales NO se ajustan por usuario; son globales, calibrados offline con datos de élite. 🧠 No hay flujo de "calibration shot" por usuario como en ArcheryX; el ajuste fino se deja al desarrollador vía análisis personalizado.
- **Argumento anti-falso-positivo**: "sin confundir una suelta con un movimiento de brazo ordinario".
- **Modelo freemium**: contador gratuito con accel; desbloqueo 15 € vitalicio; plataforma web K Archery Connect a 5 €/mes (early users, para siempre mientras sigas suscrito) o 9 €/mes desde 2027; cuenta demo usuario/contraseña "demo" 🔒.
- **Export de 1 minuto de datos crudos de accel + contacto directo con el dev** para análisis personalizado "si la detección falla" 🔒. 🧠 Esto confirma que el dev depura falsos negativos a mano con datos reales de usuarios: la calibración de élite NO cubre todos los estilos y lo sabe.

### 1.3 Historial de versiones (⚠️ caché de DuckDuckGo de la ficha, indexado antes de la v4.6; consultado 2026-09-17)

La ficha viva solo muestra el último entry ("2026-09-09 : version 4, preparing upload mode." 🔒). La caché del buscador conserva el changelog anterior:

- 2026-03-05 — 3.9f2: bug relacionado con corrección de `activity_type`
- 2026-02-16 — 3.9x: soporte de varios dispositivos añadidos
- 2025-12-16 — 3.9g: fēnix 8 y Forerunner 970 añadidos "on request"
- 2025-12-01 — 3.9f: soporte Enduro 3
- 2025-01-03 — 3.9e: soporte fēnix 8
- 2024-12-22 — 3.9d: (texto truncado en la caché)

Lectura: ~2,5 años en la 3.x con parcheo mayoritario de **compatibilidad de dispositivos**, no de algoritmo. 🧠 El algoritmo core ha sido estable desde al menos 2022; la iteración va de cobertura.

### 1.4 Colocación del reloj: brazo de la CUERDA

⚠️ La descripción histórica indexada (título antiguo "K Archery - Automatic arrows counter") decía: *"Wear your watch on your **draw arm**, start the app, practice as usual"* (caché DDG, consultada 2026-09-17). La descripción actual no menciona la muñeca. 💬 Es coherente con la reseña de Carlos ("si el tiro es incorrecto seguramente no contará la flecha"): en el brazo de cuerda la firma es el latigazo de la cuerda + retroceso transmitido, sensible a la limpieza del tiro.

**Consecuencia para ArcheryWatch (🧠):** somos casi los únicos en el mercado con detección en brazo de cuerda; Garmin/Arrow Tempo van en brazo de arco. La firma de brazo de cuerda a 100 Hz es un espacio propio, pero hereda exactamente el problema que K Archery documenta en reseñas: los malos tiros (suelta tensa, colapso de hombro) generan firmas atípicas.

### 1.5 Reseñas: qué falla y qué no (🔒 ficha de tienda, consultada 2026-09-17)

- **Eimee Monica Solis, 4★, 18 ene 2026 (v3.9g):** "my shots are not always counted even if it's a good release (coach behind my back). Also, sometimes the end is ended early and the next arrow is counted" → **falsos negativos con sueltas validadas por entrenador** + fin de volée anticipado que atribuye la flecha siguiente a la volée cerrada.
- **Carlos, 5★, 21 may 2026 (v3.9f_2):** "si el tiro es incorrecto seguramente no contará la flecha, si es bueno sí" → comportamiento **aceptado como filosofía de producto**: un mal tiro no cuenta.
- **Davide, 5★, 2 sep 2026 (v3.9f_2):** sin contenido técnico.

🧠 Con 40 reseñas y 4.1★, los falsos negativos puntuales existen pero no dominan la valoración. No se localizaron quejas de falsos positivos por caminar/gestos en las reseñas visibles.

### 1.6 Foro Garmin (💬 hilo "Activity type : Archery", forums.garmin.com, id 386744, fechado por el índice 30-09-2024, consultado 2026-09-17)

El propio dev (Jean-Noël) escribió: *"I developed K-Archery, that uses accelerometer to detects arrows shoot in archery practice. It can logs GPS trace for those who practice outdoor course - also known as 3D Archery. I register it as an hiking archery (that was a user request, for calories calculation)"*, y preguntó si Garmin añadiría el tipo "Archery" a `Toybox.Activity`. Respuesta del usuario flowstate: Archery existe como perfil nativo en FR955 pero **no es accesible desde Connect IQ** (los enums de sport/subsport de CIQ no mapean con los typeId de Garmin Connect). 🧠 Por eso K Archery exporta como "hiking": limitación de plataforma que ArcheryWatch también sufrirá al grabar FIT.

### 1.7 Lo que K Archery NO documenta (y ArcheryWatch puede documentar mejor)

- Umbral/firma: nada público. Sin papers, sin blog técnico.
- Sensibilidad: no hay ajuste documentado; el remedio del dev es el análisis manual con el export de 1 min.
- Calibración por usuario: no existe (global con élite).
- 🧠 Oportunidad: un ajuste de sensibilidad de 3 niveles + calibración opcional por usuario nos diferencia directamente contra su principal queja (tiros válidos no contados).

---

## 2. Garmin ArcheryX (fēnix 9 / fēnix 9 Pro, anunciado 25-08-2026)

Fuentes primarias: PR de Garmin (25-08-2026), manual web del fēnix 9 (v1 ago-2026), dos FAQs de soporte Garmin. Detalle completo de producto en `competencia-archeryx.md`; aquí solo el mecanismo de detección.

### 2.1 Flujo de calibración "Record Calibration Shot" (🔒 manual fēnix 9, GUID-95092193, ago 2026)

Del manual, sección "Recording an ArcheryX Activity":

1. Get Started → setup inicial guiado.
2. Type → indoor/outdoor.
3. **"To calibrate your equipment, select Record Calibration Shot, and follow the on-screen instructions. NOTE: It is recommended that you record a calibration shot the first time you use a new bow."**
4. Se inicia el cronómetro y se coloca el reloj en **la muñeca que sostiene el arco**.
5. Tras cada tiro se pueden ver gráficas y "aim information"; existe **"Delete Last Shot"**.

(🔒 FAQ "Using the ArcheryX Activity Profile", soporte Garmin, consultada 2026-09-17:) la calibración es **UN solo tiro** ("A Calibration Shot: One calibration shot teaches the watch what a shot looks like from your wrist"), necesaria solo la primera vez o al cambiar de arco/arquero; sirve para "accurate **shot detection** and **false shot rejection**". Además se pide **calibración del giróscopo en cada inicio de sesión** (reloj plano sobre superficie firme) porque las métricas miden "micro motions of the shooter during shot execution".

🧠 Lectura técnica: "one shot teaches the watch what a shot looks like" = **aprendizaje de plantilla por disparo de referencia** (posiblemente ventana + umbral derivados del tiro de calibración: amplitud/firma típica de ESE arco + ESE muñeca). El texto no revela si es plantilla correlacional o umbral adaptado, pero el flujo (1 tiro por arco nuevo) es claramente un auto-tuning de umbrales por equipo.

### 2.2 Señales y métricas alrededor del disparo (🔒 FAQ oficial, consultada 2026-09-17)

- **Aim Path**: solo se conservan los **últimos 60 MOA (1°) de apunte**; el punto de suelta está en el centro.
- **Aim Time**: tiempo con el punto de mira dentro de esos 60 MOA del punto de suelta.
- **Break Radius / Break Diameter**: dispersión de los puntos muestreados **en el último segundo antes de la suelta**.
- **Steadiness Rating**: nota del Break Radius "derived from a shooter sampling" (calibrada con una muestra de arqueros, no por usuario).
- **S.E.T.** (Shot Execution Time): desde levantar el arco hasta soltar, **cap a 15 s** de grabación por tiro.
- Ajustes de actividad en el manual: **Aim Path Animation** (on/off) — no hay ningún ajuste de sensibilidad de detección expuesto al usuario 🔒.
- **ShotView** (app móvil): overview con total de tiros y desviaciones; gráficas por tiro de Break Radius/Diameter, Aim Radius, Aim Time, SET, HR, respiración, estrés; borrar tiros y añadir notas por tiro 🔒 (FAQ "ArcheryX ShotView Session").

💬 Lancaster Archery Supply (28-08-2026): pensado "primarily with compound archers in mind"; recurvo "not currently compatible" y en desarrollo. 💬 DC Rainmaker (25-08-2026): ArcheryX **no se backportará** a relojes anteriores — el FR165 y todo el catálogo medio quedan fuera.

### 2.3 Patente Garmin relevante (🔒 Google Patents, US11859947B2, consultada 2026-09-17)

**"Targeting system"**, Garmin Switzerland GmbH, prioridad 06-06-2017, concedida 02-01-2024 (familia de la mira Xero A1/A9). Aunque es una mira electrónica, describe explícitamente un **acelerómetro "operable to detect a shot from the bow"** que dispara actualizaciones de pantalla/prompts, junto con inclinómetro, magnetómetro y sensor de luz. 🔒+🧠: es la única confirmación de patente de Garmin de detección de disparo de arco con acelerómetro; su enfoque es **evento transitorio como trigger de estado**, no análisis de firma. (No localicé en esta sesión una patente de Garmin específica de "plantilla de disparo en reloj"; las patentes genéricas de detección de actividad/repes de Garmin no se pudieron enumerar por bloqueo de Google Patents tras varias consultas — pendiente para otra sesión.)

---

## 3. Mantis X8 / MantisX (sensor en el arco)

Detalle comercial en `competencia-mantis.md`. Aquí lo relativo a detección de suelta.

### 3.1 Qué dice la documentación oficial (🔒 mantisarchery.com, mantisx.com, consultada 2026-09-17)

- X8 = "precision IMU (**accelerometer + gyroscope + magnetometer**) that analyzes movement patterns… analyzes **thousands of data points per second**" (ficha de producto; misma descripción en Lancaster y distribuidores). No se publica Hz concreto.
- Detección: "While the MantisX sensor continually collects and transmits movement data, the crucial part of the algorithm design is **shot detection**. **Live fire shot detection is easier than dry fire shot detection**, for obvious reasons" (página oficial de instrucciones). En live fire la señal es el retroceso (firma clara); en dry fire el reto es eliminar "false positives from jostling, racking, or other movements". Dicen haber probado "on hundreds of firearms" y actualizar la app con nuevos datasets; piden marca/modelo de arma a quien tenga mala detección → 🧠 **base de datos de firmas por plataforma + clasificador actualizable por OTA**, sin publicar umbrales.
- Calibración de sesión: dejar el arma/sensor **planos sobre una superficie unos segundos** antes de empezar (tarado de gravedad/orientación) 🔒.
- Arquería: el X8 va montado **en el riser** (rail adaptador), BLE, y analiza el tiro por fases con score de estabilidad 0–100, cant/pitch y traza; la app requiere el sensor 🔒.

### 3.2 "Arrow departure, 1-3 puntos de datos, ~400 Hz" (⚠️ NO VERIFICADO)

El rumor de comunidad (mencionado como hipótesis en el encargo de investigación) NO aparece en ninguna fuente oficial accesible hoy: ni mantisx.com, ni mantisarchery.com, ni las FAQs de la App Store publican Hz de muestreo ni "arrow departure" como concepto. Las búsquedas dirigidas (DDG: `mantis archery "arrow departure" data points Hz`, `sampling rate Hz sensor IMU archerytalk`) solo devuelven el texto de marketing "thousands of data points per second". Si la comunidad habla de "1-3 puntos de datos de salida de flecha", sería coherente con un muestreo alto (cientos de Hz) y una ventana de salida de flecha de pocos ms, pero **no hay fuente primaria que lo confirme**. Tratar como folklore no verificado hasta medirlo con hardware.

### 3.3 Patente del ecosistema Mantis (🔒 Google Patents WO2024197357A1, consultada 2026-09-17)

**"Shooting analytics method and system"**, David Gulliver (provisional australiana 2023900888, 29-03-2023; el nombre coincide con el fundador de Mantis, ⚠️ sin confirmar la cesión a Mantis Tech LLC — Justia devolvió 403). No es IMU: es **detección acústica** con cronómetro externo o micrófono del teléfono:

- Micrófono con **sensibilidad ajustable por el usuario 0–200 dB**, con guía: ~50 dB dry fire, ~70 dB aplauso, ~90 dB pistola indoor.
- Detección **sin ML**: filtros de "frecuencia, duración y amplitud predefinidas" + **plantillas de firma por arma** ("audio signatures associated with the respective weapons systems").
- **"Echo Delay"** ajustable = **período refractario** entre sonidos registrados para no contar ecos.
- Modo redundante: timer Bluetooth como primario y micrófono como backup con alerta si discrepan.

🧠 Trasplantable tal cual al mundo accel: sensibilidad expuesta con referencia contextual (qué umbral equivale a qué gesto), refractario ajustable, y firma por "plataforma" (arco/tipo de suelta) en vez de por usuario.

---

## 4. Arrow Tempo (watchOS, arrowtempo.com) — la fusión accel+mic más cercana a nosotros

(🔒 landing + página "apple-watch-archery-app", consultadas 2026-09-17)

- **Fusión de dos sensores con coincidencia obligatoria**: "samples **motion at 100 Hz** on your **bow arm** and listens for the sound of the release through its microphone… Only when the bow-arm movement and the audio spike line up does it count an arrow". Es literalmente nuestro escenario espejo (ellos: brazo del arco 100 Hz + micrófono; nosotros: brazo de cuerda 100 Hz + magnetómetro 50 Hz).
- **Anti-falsos positivos por fusión**: "footsteps, nocking and range chatter don't trigger false counts".
- **Detector de caminar automático**: "an automatic walking detector pauses detection while you collect arrows" → su estado de "pausa por movimiento continuo" es el equivalente a nuestro cooldown inteligente.
- **Setup corto** que identifica mano del arco y orientación del reloj (no hay sliders de sensibilidad documentados).
- **Sin cifras de precisión** publicadas; reconocen fallos: "If the watch misses a shot or counts an extra one, the count is one tap from a manual fix".
- Procesamiento 100 % on-device; el audio "se analiza en vivo y nunca se almacena ni sube" (argumento de privacidad que también conviene a ArcheryWatch con Garmin).
- Requisitos: Apple Watch Series 4+, watchOS 10+. Precio: gratis con premium 14,99 $/mes o 99,99 $/año.

🧠 Conclusión competitiva: Arrow Tempo valida que **100 Hz bastan para detectar la suelta si se fusiona con un segundo sensor de confirmación** (ellos micrófono; nosotros magnetómetro, que además no les gusta a ellos porque requiere arco con material magnético — our differentiation risk: el magnetómetro solo ve perturbaciones si el arco/montaje magnético se mueve).

---

## 5. Patentes de detección de tiro con arco y eventos transitorios

Metodología: Google Patents (XHR + renderizado), consultadas 2026-09-17. Sintaxis de las búsquedas: `"archery" "shot detection"` (11 resultados), `"archery" accelerometer detection wrist` (107), `"dry fire" shot detection accelerometer sensor` (66), además de búsquedas dirigidas por assignee y por sitio.

### 5.1 US 2023/0251055 A1 → concedida como US 12 410 985 B2 — "Archery bow monitoring" 🔒

- **Titular:** Archery Intelligence LLC (inventores Jordi Vaquer, Josep Lluís Vaquer, Joan de Magrinyà). **Prioridad:** 30-07-2019 (PCT/US2019/44104); CIP 18-04-2023; concesión 09-09-2025.
- **Qué es:** elemento intercalado entre el arco y el estabilizador con acelerómetro triaxial MEMS muestreando a **50–3200 Hz**, procesador y transmisor.
- **Problema que reclama resolver:** los sistemas previos "become **saturated** during the shot" y promedian la señal, perdiendo el transitorio. Su solución: enviar "sequential packets of the sampled information **prior to** a flight of an archery projectile" (los datos ya están fuera del sensor cuando llega el disparo).
- **Localización del disparo en la señal (claim/descripción):** matriz de slices de señal con **umbral de potencia espectral vía DFT** o **transformada de Karhunen-Loève (KLT)**: slices por encima del umbral = ráfaga del disparo; slices por debajo (una frecuencia dominante) = vibración post-disparo.
- **Comparación contra baseline**: cada tiro se compara con "expected recurring bow vibrations for a plurality of archery bows" (frecuencias de resonancia) para detectar anomalías (tornillo flojo, cam dañado).
- **Umbral geométrico**: caída/inclinación/rotación con umbral de **1 grado** respecto a vertical.

**Aprendizaje sin infringer (🧠):** (a) la matemática DFT/KLT-por-slices con umbral de potencia es una técnica general aplicable a nuestra señal de 100 Hz para separar "ráfaga de suelta" de "oscilación post-tiro"; (b) la saturación del accel a 100 Hz es real y documentada — conviene chequear el rango ±g del FR165 y usar el magnetómetro como canal no saturable; (c) el claim está atado al hardware intercalado arco-estabilizador con transmisor: un reloj de muñeca genérico está fuera de su reivindicación literal, pero conviene no copiar la arquitectura completa si algún día sacamos hardware.

### 5.2 US 11 713 942 B1 — "Intelligent archery release" 🔒

- **Titular:** sin cesar (inventores Saahil y Himanshu Minocha). **Prioridad:** 22-04-2022; concedida 01-08-2023.
- **Qué es:** disparador (release) de compuesto con sensor táctil capacitivo y IMU.
- **Detección de inicio:** el pulgar toca el slider → timestamp t0; la aceleración se **normaliza a cero** en ese instante.
- **Detección de fin:** el retroceso de la mano al soltar produce "a sudden large acceleration" que **supera un umbral de recoil**; tiempo de tiro = cruce del umbral − t0. Alternativas reivindicadas: giróscopo, segundo touch sensor, accel en el peg.
- **Estabilidad:** varianza/desviación por eje en la ventana de apunte, sumas ponderadas entre ejes; "near-zero movement" = lecturas bajo umbral durante unos ms.

**Aprendizaje (🧠):** la estructura **t0 por evento de pre-tiro + t1 por cruce de umbral de recoil** es exactamente el esqueleto de un detector de suelta; es matemática general (y esta está en literatura pública desde hace décadas), la patente protege el dispositivo físico (release con touch slider), no el algoritmo en un reloj.

### 5.3 KR 102427571 B1 / CN 110088560 A — "Archery utilization monitoring" 🔒

- **Titular:** Stress Engineering Services, Inc. **Prioridad:** 20-12-2016.
- **Sensores en el arco:** strain gauge embebido en pala + **acelerómetro triaxial en el riser** cuyo rol declarado incluye "**detect the release of the bow string and arrow**" como respaldo para medir el tiempo de recorrido de la cuerda; cámara opcional; fuerza en la pestaña de la polea ("smart cam").
- **Lógica:** **tare/baseline** con la cuerda montada sin abrir; cada disparo se compara con **umbrales y medias históricas** almacenadas en la app; la derivada de la señal de tensión da velocidad de salida; la **inversión de la señal de tensión sin flecha = dry fire** (detección de disparo en seco por firma distinta).

**Aprendizaje (🧠):** idea transplantable directa: **la firma de "tiro sin flecha" o de "suelta fallida" difiere de la normal** — podemos detectar y etiquetar suelas fallidas/descompuestas en vez de solo no contarlas (justo la queja de K Archery).

### 5.4 EP 4 392 730 B1 — "Device, system and method of detecting and counting shots" 🔒

- **Titular:** HS Produkt d.o.o. (armas cortas, Croacia). **Prioridad:** 17-11-2021; concedida 15-10-2025.
- **Arquitectura de dos sensores:** sensor piezoeléctrico de choque **montado descentrado** (eje no perpendicular al disparo, para atenuar impactos extraños y rechazar "dropping on floor, slide release, hitting pistol") que **despierta/interrumpe al MCU**, y un acelerómetro digital triaxial con **FIFO on-chip** que se empieza a muestrear al recibir el trigger.
- **Clasificación:** el micro calcula coeficientes y compara la forma de onda contra "**a pre-determined configuration of pre-sets**" (patrones de disparo segmentados y verificados en amplitud, tiempo y espacio) para "distinguish a real shot-event from a false shot-event".
- **Precisión reclamada:** ~70 % con solo el accel digital, >90 % con el par de sensores, >99 % con el pattern-matching.

**Aprendizaje (🧠):** el patrón **"trigger barato + verificación rica con plantillas pre-grabadas"** con métricas de precisión por etapa es el mejor esqueleto posible para nuestro detector (p. ej. umbral de amplitud accel como etapa 1 y coincidencia de perfil magnetómetro como etapa 2), y el truco del sensor descendrado equivale a nuestra selección de eje/característica menos propensa a gestos cotidianos.

### 5.5 US 2023/0228510 A1 — "Shot detection and verification system" 🔒

- **Titular:** Kordtech Pty Ltd (Australia). **Prioridad:** 03-12-2019 (AU2019904580); publicación US 20-07-2023 (aplicación abandonada, pero describe el estado del arte).
- **Wake-up:** el sistema duerme hasta un "significant acceleration event" (~**40 g** sugerido para armas) que interrumpe al micro.
- **ROIs (regiones de interés):** ventanas temporales de ≥1 ms definidas desde una base de datos de disparos verificados de la plataforma concreta (para un Glock 17 Gen 5: 6 ROIs entre 0 y 86 ms + ROI total).
- **Tests por ROI y por eje:** suma de actividad rectificada calibrada, picos, y **ratios entre ejes** (Y:Z, Y:X, Y:SUM).
- **Umbrales adaptativos por tamaño de base de datos:** buffers de **±50 % con 3 disparos → ±10 % con 10.000 disparos**; ejemplo de gate de pico 135–242 g alrededor de la histórica 150–220 g.
- **Secuencia:** fallar cualquier gate ⇒ no-disparo y volver a dormir; pasar todos ⇒ disparo confirmado; casos especiales de "last shot" en armas semiautomáticas; recálculo de offset de deriva cero usando una ROI de actividad nula.

**Aprendizaje (🧠):** es el documento más útil de toda la investigación para robustecer ArcheryWatch: (a) **gates múltiples secuenciales baratos** (2–4 tests) en lugar de un umbral único; (b) **ratios entre ejes** como invariante de orientación (resistente a cómo lleves la muñeca); (c) **umbral adaptativo que se estrecha con el número de tiros calibrados** — implementable como "confianza del detector" visible al usuario; (d) derivar el timestamp exacto restando el offset de ventana, igual que hacemos con los buffers de 100 Hz.

### 5.6 WO 2018/036316 A1 — "Method for monitoring swimming state by means of a wearable device" 🔒

- **Titular:** Goertek Inc (fabricante chino de wearables para Apple). **Prioridad:** 25-08-2016 (estado: ceased).
- **Plantillas por estilo:** datos estándar pre-grabados de los 4 estilos almacenados como plantillas; al terminar un largo se extrae **un ciclo** (fronteras por picos adyacentes en el eje alineado con la dirección de nado; **excluir el primer y el último ciclo** por distorsión; si hay N ciclos tomar N/2 o (N+1)/2).
- **Preprocesado:** filtrado de media de K vecinos + **normalización a ±10** (la aceleración de nado cabe en ±1 g).
- **Matching:** **DTW (Dynamic Time Warping) por eje por separado** (sumar los 3 ejes o usar normas "era demasiado indistinto"), y se elige la plantilla de **menor distancia total** (sin umbral absoluto publicado: selección relativa).

**Aprendizaje (🧠):** receta completa y matemática (no protegible como idea) para un modo "calibración de suelta" estilo ArcheryX en ArcheryWatch: extraer el ciclo central de N sueltas, normalizar, DTW por eje, y usar la distancia como **score de confianza**; la advertencia de Goertek de que **la norma 3D mezcla demasiado** sugiere comparar ejes del accel (y quizá los del magnetómetro) por separado.

### 5.7 US 10 345 169 B2 — "Archery sensory feedback system and method of use" 🔒

- **Titular:** sin cesar (Brady V. y Jennifer S. Dunham). **Prioridad:** 26-08-2016.
- **Detección de suelta por carga:** sensores de fuerza en guante/grip/release; el sistema se activa cuando la carga de apertura supera un umbral y **la suelta se detecta por la caída de carga**; sensores de movimiento para el follow-through ("straight back and around the face"). Comparación contra "predetermined values" derivadas de calibración por usuario.

**Aprendizaje (🧠):** la suelta definida como **transición de estado (carga alta→baja)** en vez de pico absoluto: en nuestro caso, transición de "tensión sostenida" (magnetómetro estable cerca del clicker / accel con temblor de apuntamiento) a "transitorio".

### 5.8 US 6 191 574 B1 — "Bow-mounted apparatus for detection and quantification of deviations" 🔒

- **Titular:** sin cesar (John Patrick Dilger). **Prioridad:** 20-01-1998. Sensor óptico bajo el paso de la flecha; la pluma cock interrumpe el haz; **Schmitt trigger + medición de ancho de pulso**; descarta glitches por **chequeo de ancho mínimo**; las variaciones sucesivas de ancho cuantifican la oscilación sinusoidal amortiguada de la flecha.

**Aprendizaje (🧠):** de aquí salen dos ideas eternas: el **condicionador de señal (Schmitt = histéresis)** para limpiar el transitorio antes de datarlo, y **medir la vibración post-suelta como feature** (su amplitud/frecuencia informa del tiro tanto como el instante de suelta).

### 5.9 Otras localizadas (sin extracción detallada) ⚠️

- **US 2019/0293382 A1** — "Device, system, and method for improving archery accuracy": accel+giróscopo inalámbricos con software de autografiado por arquero/equipo (prioridad ~2018).
- **US 2024/0191966 A1** — "Archery information system": feedback sin perder el foco visual del blanco durante la apertura.
- **EP 3559587 B1 / CA 3148962 C** — "Archery bow monitoring" (familia Archery Intelligence, ver 5.1).
- **US 2015/0338436 A1** — "Wearable System For Accelerometer-Based Detection And Classification Of Firearm Use" (prioridad 22-05-2014, wearable para clasificar uso de arma): precedente directo de "clasificar el gesto del disparo desde un wearable".
- **US 11 835 311 B** (resumen Justia vía snippet): sistema con **accel + micrófono acoplados al usuario o al arma, "training the device by firing rounds"** (calibración disparando), detecta acción mecánica + onda sonora de eyección → precedente de **calibración por disparos de referencia con fusión de dos modalidades**.
- No se localizó **ninguna patente publicada específica de "detección de suelta desde reloj de muñeca en recurvo"**: 🧠 el hueco que ocupa ArcheryWatch parece desprotegido por terceros (verificación pendiente de una pasada sistemática por Espacenet/CPC F41G o A63B cuando la cuota lo permita).

---

## 6. Aplicaciones de tiro con armas: detección transitoria transplantable

### 6.1 Cronómetro open-source Android (💻 CÓDIGO VERIFICADO, repo `MehKoiter/shot-timer-android`, consultado 2026-09-17)

`app/src/main/java/com/shottimer/app/detection/ShotDetector.kt` — detector acústico completo:

```kotlin
const val DEFAULT_THRESHOLD_AMPLITUDE = 0.35f        // amplitud normalizada (0-1)
const val DEFAULT_ECHO_LOCKOUT_MS = 100L             // período refractario

for (i in samples.indices) {
    val amplitude = abs(samples[i].toFloat()) / Short.MAX_VALUE
    if (amplitude < thresholdAmplitude) continue     // gate 1: umbral
    if (sampleTimeNanos - lastEventNanos < lockoutNanos) continue  // gate 2: refractario
    events += ShotEvent(sampleTimeNanos)
    lastEventNanos = sampleTimeNanos
}
```

- El propio comentario del código: "Deliberately dumb — a single amplitude threshold plus an echo-lockout window… **Sensitivity tuning happens by adjusting thresholdAmplitude**".
- `TimerSettings.kt`: sensibilidad por defecto 0.5; **lockout ajustable por el usuario entre 20 y 500 ms**; reset del lockout al empezar cada run ("so a previous run's lockout state can't suppress shot #1").
- `docs/DESIGN.md`: el pipeline descrito es exactamente: umbral digital configurable + **echo suppression (lockout de decenas de ms)** + sensibilidad ajustable "para calibres fuertes o .22 LR silenciadas"; futuro: "accelerometer/recoil-based detection for wearable" reconocido como alternativa cuando el micrófono sufre falsos disparos de vecinos.

🧠 **Transplante directo a ArcheryWatch:** (1) exponer la sensibilidad como ese parámetro único normalizado; (2) refractario por defecto 100 ms con rango ajustable; (3) **reset del refractario por volée/sesión**; (4) el equivalente accel de "disparo del vecino" es el tiro del arquero de al lado percibido como vibración de suelo — la fusión con magnetómetro es nuestro filtro.

### 6.2 Patente del ecosistema Mantis (audio) — ver §3.3

Sensibilidad 0–200 dB con guía contextual por tipo de evento (~50 dB dry fire / ~70 aplauso / ~90 pistola), **Echo Delay** = refractario ajustable, plantillas de firma por arma: el mismo triplete (sensibilidad guiada + refractario + plantilla por plataforma) documentado en forma de patente.

### 6.3 Patrones transversales del dominio "evento transitorio" (🧠 síntesis)

- Detección en **dos niveles** (wake-up barato + verificación): EP4392730, Kordtech, Arrow Tempo.
- **Refractario** siempre presente, y en dos de tres casos ajustable por el usuario.
- **Calibración por referencia** (disparo de calibración, rounds de entrenamiento, datos de élite) en lugar de umbrales universales.
- **Rechazo por forma/coincidencia** (presets, ratios entre ejes, DTW) para separar el evento de gestos parecidos.
- **Ventana post-evento como dato** (vibración, Break Radius, oscilación de flecha), no solo el instante.

---

## 7. Sistemas de diana electrónica — descartados como modelo de detección de ejecución

- **RyngDyng (Archery Analytics / archery-electronics.com)** 🔒: cámara autónoma frente a la diana que **detecta dónde clava la flecha** (posición y puntuación automática, hasta 2-4 dianas en paralelo; usado en los Juegos de Tokio 2020 según World Archery). No mide el gesto ni la suelta: no es modelo para nuestro detector (sí es referencia de UX de corrección manual y de datos de resultado para cruzar con la ejecución).
- **iTargetPro (Train Smart Inc.)** 🔒: cartucho láser + app con cámara para **dry fire de armas de fuego** ("uses a laser light detection algorithm to locate and track hits"). Detección del impacto del láser en diana, no del disparo real: descartado.
- **BOWdometer (Toxon Technologies)** — NO descartable, es competidor real de detección 🔒+💬: dispositivo de media onza montado en el arco que cuenta tiros por **vibración** y da un índice de ejecución "Xi" ("patent-pending process of representing the sensor data for each shot", Outdoor Wire/Archery Wire, lanzamiento 2019). Fuentes oficiales del producto (Facebook del fabricante, capturado vía snippets 2026-09-17): "detecting a shot… **it clips out the data from a couple seconds before your shot to examine your hold. It also clips out half a second** after", y "our sensors pick up **tens of thousands of data points every single second**" → ⚠️ Hz real no publicado (decenas de miles de puntos/s ≈ decenas de kHz de datos agregados, no de muestras IMU). Además avisan de que **cambiar de forma o equipo cambia la señal** ("it's really important to update your bow setup when you make changes") — el mismo problema de deriva de firma que tendremos. Documentación integrada con Artemis (PDF oficial vapeldoorn.net).

---

## 8. Implicaciones para ArcheryWatch (decisiones accionables)

1. **Exponer un ajuste de sensibilidad real** (único parámetro, normalizado 0–1 como el ShotDetector open-source, con guía contextual tipo Mantis: "suelta limpia recurvo ≈ nivel medio; liberación mecánica compuesto ≈ bajo"). Nadie de la competencia lo documenta: K Archery no tiene, ArcheryX no tiene, Arrow Tempo no tiene. Es diferenciación barata y ataca la queja nº1 de K Archery (tiros válidos no contados).
2. **Período refractario interno de ~100 ms** (defecto) con rango 20–500 ms solo en ajustes avanzados; **resetear el refractario al inicio de cada volée/sesión** (lección del repo open-source: sin reset, el lockout de un evento anterior se come el primer tiro).
3. **Calibración opcional por usuario estilo ArcheryX**: "graba 1-3 tiros de calibración con ESTE arco" y derivar de ahí umbral/plantilla (con la receta Goertek: ciclo central de N tiros, normalizar, DTW por eje, umbral de aceptación = k × distancia mínima histórica). Garmin la hace obligatoria-ish en ArcheryX; nosotros podemos hacerla opcional con valores por defecto de fábrica calibrados (como K Archery con élite).
4. **Umbral adaptativo con confianza visible** (lección Kordtech): buffers ±50 % con 3 tiros calibrados → ±10 % con cientos; mostrar "detector: aprendido (n tiros)" en vez de un número mágico.
5. **Verificación en dos etapas** (lección HS Produkt + Arrow Tempo): etapa 1 barata en accel (umbral + pendiente), etapa 2 de confirmación con magnetómetro (coincidencia temporal de la perturbación magnética en ±X ms) antes de contar. La fusión accel+mag de ArcheryWatch replica el rol que Arrow Tempo resuelve con el micrófono, sin permisos de micrófono.
6. **Ratio entre ejes como invariante** (Kordtech): en vez de umbral absoluto sobre |a|, usar ratios de actividad X:Y:Z dentro de la ventana del evento para distinguir "suelta" de "golpe en la muñeca/caminar"; es robusto a la orientación del reloj.
7. **Ventana post-suelta como feature, no como estorbo**: medir la vibración amortiguada tras el evento (lecciones Dilger + Archery Intelligence) y usarla para (a) confirmar que fue disparo y no gesto, (b) dar un "índice de limpieza de suelta" tipo Xi/Break Radius sin hardware extra.
8. **Detectar y etiquetar suelas atípicas en vez de descartarlas silenciosamente** (lección Stress Engineering + reseñas de K Archery): si el transitorio no pasa todos los gates pero supera algunos, contar el tiro marcándolo como "suelta irregular" y dejar corregir/borrar con un toque (Delete Last Shot de Garmin / fix de Arrow Tempo).
9. **Fin de volée conservador** (queja explícita de K Archery: "the end is ended early and the next arrow is counted"): exigir inactividad más larga + no cerrar la volée si hay un evento pendiente de verificación.
10. **Cuidado con la saturación del acelerómetro** (documentada en US20230251055A1): comprobar el rango ±2g/±4g/±8g/±16g del LIS2DW/LIS3DH del FR165 y elegir escala para que la suelta no clave la señal; el magnetómetro (canal de baja dinámica pero no saturable por golpes) es la verificación ideal precisamente por eso.
11. **Usar el canal FIT de alta resolución** como K Archery (permisos `FitContributor`/`SensorLogging` verificados en su ficha): exportar la ventana de ±s alrededor de cada tiro para depuración y para un futuro "análisis personalizado" — es literalmente su estrategia de soporte con el export de 1 minuto.
12. **No copiar el modelo de cierre de K Archery**: sin ajustes ni FAQ pública, el usuario con falsos negativos solo puede escribir al dev. FAQ pública + auto-calibración + sensibilidad = ventaja de soporte.
13. **Evitar el error de ArcheryX para recurvo**: Garmin solo cubre compound (recurve "en desarrollo", Lancaster 28-08-2026) y no backporta (DC Rainmaker 25-08-2026); en recurvo con reloj de muñeca (FR165) seguimos solos frente a K Archery.
14. **Legal/hipótesis de patente (🧠, no asesoramiento legal):** las patentes revisadas protegen implementaciones concretas (hardware en el arco/estabilizador/release, piezo+accel embebido, mira láser), no las matemáticas (umbral+refractario, DTW, gates por ROI, ratios entre ejes son estado del arte anterior y técnica general). Riesgo bajo para un reloj de muñeca genérico mientras no repliquemos la arquitectura reivindicada completa (p. ej., el elemento arco-estabilizador con transmisor de Archery Intelligence). Pendiente: pasada sistemática por Espacenet/CPC (F41G 5/00, A63B 69/40, A63B 2220/83) cuando haya cuota de búsqueda.
15. **Rellenar los dos huecos de verificación pendientes**: (a) Hz reales del Mantis X8 (rumor ~400 Hz no verificado hoy — solo marketing "thousands per second"); (b) patentes propias de Garmin sobre detección de actividad/repes en reloj (el bloqueo de Google Patents impidió enumerarlas; US11859947B2 ya documenta su "accel detecta el disparo" en la mira Xero). Citar como desconocido hasta verificar, no como inexistente.

---

## Apéndice A. Fuentes por producto (todas consultadas el 2026-09-17)

**K Archery**
- Ficha CIQ (HTML + JSON interno): https://apps.garmin.com/en-US/apps/f3b2b9de-0a33-47d2-bfda-b6df45efc946 (y locales fr-FR/es-ES/en-GB; endpoint `_next/data/l31LKbS0DWq5btzdPQnEZ/...json`)
- Web plataforma: http://karchery.jnk-conseil.fr (SPA; rutas inspeccionadas en bundle `/assets/index-CottbpbQ.js`)
- Vídeo demo oficial: https://www.youtube.com/watch?v=FaH9l_sl4q0 (oEmbed)
- Hilo del dev en foro Garmin: https://forums.garmin.com/developer/connect-iq/f/discussion/386744/activity-type-archery (índice DDG lo fecha 30-09-2024)
- Changelog histórico: caché DuckDuckGo de la ficha (⚠️, ver §1.3)

**Garmin ArcheryX**
- PR: https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/ (25-08-2026)
- Manual fēnix 9, "Recording an ArcheryX Activity": https://www8.garmin.com/manuals/webhelp/GUID-708A8F4D-9A78-49CF-9528-DE109BBCC472/EN-US/GUID-95092193-D88B-41FA-8C68-8D48FD263264.html (v1, ago 2026)
- FAQ "Using the ArcheryX Activity Profile": https://support.garmin.com/en-US/?faq=eBZSZzOM8y1vcOkTBXpQm6
- FAQ "ArcheryX ShotView Session": https://support.garmin.com/en-US/?faq=BuYQiSEYrZ1gXTYlb1Bk0A
- Ajustes de actividad: https://www8.garmin.com/manuals/webhelp/GUID-708A8F4D-9A78-49CF-9528-DE109BBCC472/EN-US/GUID-26346C57-321D-4B77-BC3B-584EC6161A29.html
- 💬 Lancaster Archery Supply (28-08-2026): https://lancasterarchery.com/blogs/guides-and-information/garmins-archery-x-application-explained
- 💬 DC Rainmaker (25-08-2026): https://www.dcrainmaker.com/2026/08/garmin-fenix9-software-feature-overview.html

**Mantis X8**
- https://mantisarchery.com/ y https://mantisarchery.com/pages/how-it-works
- https://mantisx.com/pages/mantisx-instructions (detección live vs dry fire)
- FAQ App Store vía espejo: https://mwm.ai/apps/mantisx-archery/1491050891
- Patente ecosistema: https://patents.google.com/patent/WO2024197357A1/en

**Arrow Tempo**
- https://arrowtempo.com y https://arrowtempo.com/apple-watch-archery-app

**Patentes** (Google Patents, EN)
- US20230251055A1 / US12410985B2 (Archery Intelligence LLC) · US11713942B1 (Minocha) · KR102427571B1 / CN110088560A (Stress Engineering Services) · EP4392730B1 (HS Produkt) · US20230228510A1 (Kordtech Pty Ltd) · WO2018036316A1 / CN106175781B (Goertek) · US10345169B2 (Dunham) · US6191574B1 (Dilger) · US11859947B2 (Garmin Switzerland) · US20190293382A1 · US20240191966A1 · EP3559587B1 · US20150338436A1 · US11835311B

**Cronómetros / transitorios**
- 💻 https://github.com/MehKoiter/shot-timer-android (`detection/ShotDetector.kt`, `settings/TimerSettings.kt`, `docs/DESIGN.md`)

**Dianas/BOWdometer**
- https://www.ryngdyng.com (manuales v1.0/v1.5), https://archery-electronics.com/en/public/ryngdyng/technology, 💬 https://www.worldarchery.sport/news/200459 (Tokio 2020)
- https://www.itargetpro.com/ y Google Play (itargetpro.com.targetpro)
- BOWdometer: 💬 Bow International (review), Outdoor Wire/Archery Wire (lanzamiento, "Xi patent-pending"), Facebook oficial @bowdometer (snippets), PDF Artemis: https://artemis.vapeldoorn.net/downloads/BOWdometerUse.pdf

## Apéndice B. Huecos de esta investigación (para cerrar en otra sesión)

1. Reseñas completas de K Archery (solo 3 de 40 visibles sin JS interactivo; la pestaña de reseñas usa paginación client-side).
2. Contenido exacto de los ajustes (settings) de K Archery en Garmin Connect — requiere instalar la app o el SDK de CIQ.
3. Hz de muestreo reales de Mantis X8 y significado de "arrow departure" en la app (rumor de comunidad sin fuente primaria).
4. Patentes de Garmin de detección de actividad genérica (rep counting/swing) — Google Patents bloqueó el IP tras ~10 consultas XHR; reintentar con Espacenet OPS o USPTO PPUBS.
5. Patente(s) del BOWdometer "Xi" (buscado como Toxon Technologies; no localizado en esta sesión).
6. Hilos de Reddit (r/Archery 1506i0q) leídos completos — Reddit devuelve 403 a fetch anónimo; citar solo tras lectura real.
