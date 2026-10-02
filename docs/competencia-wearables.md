# Competencia: apps de tiro con arco para reloj/wearable

Investigación de producto para **ArcheryWatch** (Garmin Forerunner 165, Connect IQ/Monkey C: detección de suelta por acelerómetro de muñeca, fases, sets 3/6, perfiles+calibración, envío BLE a Android en vivo).

**Fecha de investigación:** 17-sep-2026. Todas las citas verificadas en esa fecha salvo indicación contraria.
**Convención de etiquetas por afirmación:**
- `[VERIFICADO]` — comprobado directamente contra la fuente primaria (ficha de store, API oficial, repo, comunicado).
- `[DEV]` — declaración del desarrollador publicada en su ficha/web (texto publicado, no medido de forma independiente).
- `[USUARIO]` — experiencia reportada por un usuario en foro/Reddit.
- `[SECUNDARIA]` — medio o agregador; no se pudo verificar contra la fuente original.

---

## 0. Resumen ejecutivo

1. **K Archery (Connect IQ, Jean-Noel_K) es el único competidor directo real en Garmin**, con exactamente el mismo concepto que ArcheryWatch: contador automático por acelerómetro + tandas + pulso + GPS + plataforma web de análisis. 1.000+ descargas, 4,1★ (40 reseñas), activo (última versión 4.6 publicada el 15-sep-2026). [VERIFICADO — ficha Garmin, §1]
2. **Garmin ha entrado nativo**: actividad **ArcheryX** de serie en Fenix 9 / Fenix 9 Pro (anuncio 25-ago-2026), centrada en arco compuesto, con aim trace, estabilidad en minutos de ángulo y app móvil ShotView. No hay indicios de que llegue a Forerunner 165. [VERIFICADO — comunicado Garmin, §2.2]
3. **Nadie en el nicho wearable publica métricas de precisión** de la detección (ni % de acierto, ni precisión/recall). Solo afirmaciones cualitativas. [VERIFICADO por ausencia en todas las fuentes revisadas, §6]
4. **El precio de referencia del nicho Garmin es 15 € pago único** (K Archery). En watchOS conviven pago único (9,99–14,99 USD) y suscripciones agresivas (Arrow Tempo: 14,99 USD/mes). [VERIFICADO, §1/§4]
5. **Hueco confirmado por usuarios**: "probé las apps de Garmin y ninguna sigue bien la arquería" (2023), "K Archery parece producir algún tipo de gráfica de curva de tensión" (2023-2026) — la demanda de análisis real del tiro en reloj está insatisfecha. [USUARIO, §6]
6. **El live-view en móvil por BLE es el mayor diferenciador disponible**: K Archery envía a una plataforma web tras la sesión (suscripción 5 €/mes); nadie transmite la curva del tiro en tiempo real al móvil. [VERIFICADO por ausencia, §7]

---

## 1. K Archery (Connect IQ) — el competidor más cercano

### 1.1 Ficha técnica de la store

| Campo | Valor | Fuente |
|---|---|---|
| Nombre | "K Archery - shoot detection and analysis" (FR: "K Archery - détection et analyse de tirs"; DE: "K Archery – Schusserkennung und -analyse") | [VERIFICADO] Ficha store: https://apps.garmin.com/en-US/apps/f3b2b9de-0a33-47d2-bfda-b6df45efc946 (consulta 17-sep-2026) |
| Desarrollador | Jean-Noel_K (userId `a0606124-fa0b-454f-b606-21be0b141de7`); email de soporte `jn.k@posteo.net` | [VERIFICADO] JSON de la store (`initialAppDetail`), vía `_next/data` de apps.garmin.com (17-sep-2026) |
| Tipo | Device App (Connect IQ), categoría Sports (categoryId 212) | [VERIFICADO] mismo JSON |
| Versión | App 4.6 (internal 73); frontend store 4.26.2 | [VERIFICADO] mismo JSON + HTML de la ficha |
| Valoración | **4,1★ con 40 reseñas** | [VERIFICADO] mismo JSON + schema.org `aggregateRating` del HTML |
| Descargas | **1.000+** (`downloadCount: 1000`, la store lo muestra como "1K+") | [VERIFICADO] mismo JSON |
| Primera publicación | **07-jul-2022** (timestamps 1657179258000) | [VERIFICADO] mismo JSON, campos `creationDate`/`firstApprovalDate` |
| Última actualización | **15-sep-2026** (timestamp 1789461641000); "What's new" de la ficha fechado 09-sep-2026: *"version 4, preparing upload mode"* | [VERIFICADO] mismo JSON, campos `changedDate`/`releaseDate`/`whatsNew` |
| Dispositivos | **216 tipos de dispositivo compatibles**; la descripción cita "fēnix, Forerunner, Instinct, Venu, Descent..." (la lista de la store devuelve part numbers, sin mapeo legible; **la presencia concreta de Forerunner 165 no se pudo verificar individualmente**, pero la familia Forerunner está explícitamente incluida en la descripción del dev) | [VERIFICADO] mismo JSON (`compatibleDeviceTypeIds`, 216 entradas) + [DEV] descripción de la ficha |
| Permisos | `Fit`, `SensorLogging`, `Communications`, `Positioning`, `FitContributor`, `Sensor` | [VERIFICADO] mismo JSON + HTML |
| Idiomas de la ficha | EN, FR, DE (localizaciones de store); la app según el dev: francés, inglés, alemán, ruso y chino simplificado. **Sin español.** | [VERIFICADO] `appLocalizations` (3) + [DEV] descripción |
| Multimedia | 5 capturas de pantalla, imagen hero, y vídeo **"K Archery demo"** del canal TheDocNo (https://www.youtube.com/watch?v=FaH9l_sl4q0) — muestra la app en el reloj contando tiros | [VERIFICADO] `screenshotFileIds` (5) + YouTube oEmbed (título/autor, 17-sep-2026) |
| Novedad sep-2026 | "New - 2026, september. You can try my new analysis platform, where you can track, analyse, follow any arrow you shoot": **https://karchery.jnk-conseil.fr** | [DEV] texto de la ficha (Verificado que el texto está publicado) |

### 1.2 Funciones (texto publicado por el dev en la ficha — [DEV])

Texto íntegro de la descripción EN (extraído del JSON de la store, 17-sep-2026), resumido aquí:

- **Contador automático de flechas y tandas (ends)** sin entrada manual.
- **Detección**: "The detection algorithm continuously analyzes accelerometer data and recognizes the characteristic signature of the bowstring release. Its thresholds were calibrated on real data from elite archers (international recurve competitors), so it stays reliable on both a 'clean' release and a less regular one — without ever confusing a release with an ordinary arm movement." → Afirmación de fiabilidad **sin métricas publicadas**.
- **Pulso** durante la sesión.
- **GPS opcional** con mapa en K Archery Connect (útil para 3D/field).
- **Export de 1 minuto de datos crudos de acelerómetro + contacto directo con el dev** para análisis personalizado (p. ej. si la detección falla). Es la novedad del último release.
- En el foro de desarrolladores de Garmin, el propio Jean-Noël confirmó: la app "uses the accelerometer to detect arrows shot" y puede grabar traza GPS; registró la actividad como "hiking" a petición de un usuario para el cálculo de calorías, porque **Connect IQ no permitía etiquetar la actividad como "Archery"**. [VERIFICADO — hilo https://forums.garmin.com/developer/connect-iq/f/discussion/386744/activity-type-archery, consultado 17-sep-2026]

### 1.3 Precio y modelo de negocio ([DEV] — texto de la ficha)

Dos niveles:

1. **Contador automático**: app gratis para probar; desbloqueo permanente por **15 €** (código de activación único, "válido de por vida en tu reloj").
2. **K Archery Connect** (plataforma web): sesiones, estadísticas y **curvas detalladas por flecha** guardadas automáticamente.
   - Cuenta demo con usuario/contraseña `demo` para probar.
   - **5 €/mes** "de por vida" para quien se suscriba ahora (tarjeta early-user, garantizada mientras la suscripción siga activa).
   - **9 €/mes** para cuentas creadas desde 2027.

Nota: el campo `paymentModel=1` de la API de la store es coherente con app de pago/unlock; `requiringExternalSubscription=false` (la suscripción de Connect se gestiona fuera de Garmin). [VERIFICADO — JSON store]

### 1.4 Recepción y foros

- Valoración global 4,1★/40 (17-sep-2026). Los textos de reseñas de la store se cargan por una API privada autenticada y **no fueron accesibles**; no se citan reseñas individuales de la store. [VERIFICADO la nota media; LIMITACIÓN documentada]
- **ArcheryTalk (hilo "Garmin to track shot count", jun-2025)**: el usuario DrLogik dice que K Archery cuenta flechas y que lo consideró para su Fenix 7X *"after reading some of the reviews I declined"*, esperando a ver la frecuencia de actualizaciones con corrección de bugs → **señal pública de reseñas negativas sobre fiabilidad** hacia mediados de 2025. https://www.archerytalk.com/threads/garmin-to-track-shot-count.6325501/ [USUARIO]
- **Reddit r/Archery**: un usuario recomienda "k archery in the garmin store": *"counts your shots and ends and seems to produce some sort of pull curve graph"*. Hilo "Smart or fitness watches for archery?" (jul-2023, comentarios recuperados vía API PullPush el 17-sep-2026). [USUARIO]
- El hilo del foro CIQ (386744, ">1 año", 1.812 vistas, 20 suscriptores) muestra que el dev pidió a Garmin un tipo de actividad "Archery" accesible desde Connect IQ; respuesta de flowstate (moderador/comunidad): Archery existe como tipo en Garmin Connect y como perfil nativo en **FR955** (modos Indoor/Outdoor) con pantallas genéricas (gráfica de FC, cronómetro, respiración, mapa), y **no es posible asignarlo desde CIQ** con los enums públicos. [VERIFICADO — foro Garmin]

---

## 2. Garmin Connect IQ Store — catálogo de arquería

Búsqueda sobre apps.garmin.com ("archery", "arrow", "bow", "shot counter"; WebSearch + fetch directo de fichas). **Limitación**: el buscador de la store es una SPA sin API pública accesible; la búsqueda se apoyó en WebSearch (cupo agotado a mitad de la investigación) y en verificación directa de cada ficha. Resultado hasta 17-sep-2026:

### 2.1 Apps y utilidades (no juegos)

| App | Dev | Pago | Valoración | Descargas | Dispositivos | Creada / Últ. act. | Qué hace | Fuente |
|---|---|---|---|---|---|---|---|---|
| **K Archery** | Jean-Noel_K | Gratis + 15 € unlock (+ Connect 5-9 €/mes) | 4,1★ ×40 | 1.000+ | 216 | 2022-07 / 2026-09 | Detección automática por acelerómetro, ends, FC, GPS, curvas por flecha en web | [VERIFICADO] §1 |
| **Target Archery App** | vald70 | Gratis (paymentModel 0) | **3,4★ ×16** | 1.000+ | 126 | 2019-03 / 2025-01 | Registro **manual** de ends y volumen de tiros (táctil/botones) + estadísticas; sin detección. El dev pide no poner reseñas negativas y avisarle por email | [VERIFICADO] JSON store id `1299ab43-97c6-43bf-ba41-cd656d2ee1e6` |
| **Archery Arrow Counter** | Zhivoi | Gratis | 4,0★ ×6 | 1.000+ | 170 | 2017-01 / 2026-08 | Contador **manual** de flechas (+1 o ronda completa de 2-12) y modo contador de puntuación; v0.93 | [VERIFICADO] JSON store id `afab51cb-1ff5-47cb-a074-6e4e70aee77e` |
| **Archery Random Timer** | AMWishart | — | — | — | — | — | Temporizador aleatorio con vibración para disparar (80 % de las veces 10-15 s) | [SECUNDARIA] snippet de búsqueda de apps.garmin.com/es-ES id `a771f486-488d-47cc-91a9-6a4a03d1c653` |
| **Archery** (store china) | Col1nsmith | — | 0 reseñas | 100 | — | — | Lleva la puntuación a lo largo de rondas | [VERIFICADO] apps.garmin.cn id `a2bf8354-6881-4653-aebc-527b653fb6c3` (fetch 17-sep-2026) |
| GoWild (caza) | GoWild/Garmin | Gratis | — | — | — | 2025 | Actividad de caza/tiro con arco: grupos de flechas, foto del grupo, valoración subjetiva | [SECUNDARIA] Outdoor Wire: https://theoutdoorwire.com/releases/674c785a-9c13-4549-b8fd-7839c04c8e98 |

### 2.2 Juegos y dato curioso

- **SteadyBow — Archery Timing Challenge** (SiruxLabs, gratis): minijuego de timing con botones ("no gyro, play anywhere"), 10 flechas y viento. Demuestra que hay devs experimentando con el nicho "archery" en la store. [VERIFICADO] HTML de la ficha id `d03be65b-4570-4831-9ddf-54dbbd046b6d` (fetch 17-sep-2026)

### 2.3 Lo nativo de Garmin (contexto crítico)

- **Perfil "Archery" nativo en FR955** (indoor/outdoor), con pantallas de datos genéricas (FC, cronómetro, respiración, mapa) y sin nada específico de arquería; no accesible desde CIQ. [VERIFICADO] foro CIQ 386744 (§1.4)
- **ArcheryX**, actividad de serie en **Fenix 9 y Fenix 9 Pro** (comunicado 25-ago-2026): sigue el movimiento del "brazo del arco y del cuerpo"; métricas: análisis del break del tiro (movimiento justo antes de soltar), tiempo de ejecución del tiro (apertura→suelta), contador de flechas, estabilidad en **minutos de ángulo**, **aim trace** con reproducción animada, FC/respiración/estrés; app móvil **ShotView** con tendencias por día/semana/mes/año. Enfocada a **arco compuesto** ("first-of-its-kind smartwatch activity"). El comunicado no menciona coste ni suscripción. [VERIFICADO] https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/ (17-sep-2026)
- the5krunner lo analizó el 25-ago-2026 ("Garmin ArcheryX – Fenix 9's new feature Explained"); según el snippet de búsqueda usa acelerómetro+giroscopio y 7 métricas por flecha (artículo con paywall/bloqueo, no verificado completo). [SECUNDARIA]

---

## 3. Wear OS

### 3.1 ArcheryShotCounter-wearos (Vemestael) — open source

| Campo | Valor | Fuente |
|---|---|---|
| Repo | https://github.com/Vemestael/ArcheryShotCounter-wearos — Kotlin, **licencia MIT**, web https://vemestael.github.io/ArcheryShotCounter-wearos/ | [VERIFICADO] API GitHub (17-sep-2026) |
| Actividad | Creado **14-may-2026**, último push **15-sep-2026** (muy activo) | [VERIFICADO] API GitHub |
| Popularidad | **4 estrellas, 0 forks** — nicho minúsculo | [VERIFICADO] API GitHub |
| Descripción | "WearOS app that automatically counts archery shots using the wrist accelerometer — no buttons needed during shooting" | [VERIFICADO] API GitHub |

Funciones según su README [VERIFICADO — README vía API GitHub, 17-sep-2026] [DEV cuando aplique]:
- Detección automática del **impulso de retroceso (recoil) de la suelta** por acelerómetro de muñeca; válido para compound, recurvo olímpico, barebow y tradicional, **en cualquiera de las dos muñecas** ajustando la sensibilidad.
- Ajuste **High/Medium/Low/Custom** + **cooldown configurable** entre tiros para evitar disparos dobles/falsos positivos.
- Marcadores de **tandas (shots per end)** con auto-pausa entre ends.
- Detalle por tiro: **timestamp e intensidad de impacto** de cada flecha.
- Historial de sesiones; corrección manual +/−; modo ambient (atenúa pantalla con AOD).
- **Export/import de sesiones a JSON**.
- **12 idiomas incluido español**.
- Requiere Wear OS 3.0+ (API 30); instalación por **sideload del APK vía ADB** (no está en Play Store según el README).
- Probado en **Galaxy Watch 6 Classic, en brazo del arco, con compound** (única configuración declarada de prueba).
- No publica métricas de precisión.

Existe además un companion Android `Vemestael/ArcheryShotCounter-android` ("syncs training sessions from the watch"), 0 estrellas. [VERIFICADO] API GitHub

### 3.2 Resto de Wear OS / Android

- **Búsqueda en GitHub topic "archery"+wear**: solo `bowman` (juego Android Wear, 1★, 2024), `WeArcheryPublic` (0★, 2021) y un proyecto hardware ESP32 de ansiedad en arqueros. El nicho Wear OS está **vacío salvo ArcheryShotCounter**. [VERIFICADO] API búsqueda GitHub (17-sep-2026)
- **Play Store** (búsqueda "archery tracker watch", 17-sep-2026; apps de móvil, algunas con mención Wear): MyTargets Archery (`de.dreier.mytargets`, **4,4★ ~3.590 valoraciones**, la ficha menciona Wear), ArrowTime Chrono (`com.paulfreedman.arrowtime13`; changelog: "Improved detection... Compare Distance Curves" — crono de velocidad), MantisX archery (`com.roberts.croberts.mantis.archery`, análisis con hardware), Archery Log, TrueShot Trainer, varios timers/scorecards. Ninguna aparece como detector automático de suelta en reloj salvo las ya citadas. [VERIFICADO] Play Store (fetch 17-sep-2026)
- Un usuario de Reddit (2023) usa MyTargets **en el móvil** junto a su Garmin para tiros/puntuaciones porque las apps del reloj no le convencían. [USUARIO] PullPush, hilo 1506i0q

---

## 4. Apple Watch (watchOS)

Datos de App Store vía API pública de iTunes (lookup/search, country=US, 17-sep-2026), salvo indicación.

### 4.1 Con detección automática por acelerómetro

| App | Dev | Precio | Valoración (US) | Actualizada | Detección y notas |
|---|---|---|---|---|---|
| **Archery Tracker** (id1450784807) | Appersian | Gratis + IAP **9,99 USD** ("Unlock 10-Shot Limit") | 4,0★ ×5 | **16-ene-2021 (v1.2.2, abandonada)** | Acelerómetro en **mano del arco**; feedback háptico por tiro; marcar "buenos tiros"; HealthKit; **export CSV "para uso científico"**. En Reddit: tras 10 tiros hay que pagar y "según la única reseña deja de funcionar; 2 años sin updates" [USUARIO] |
| **Arrow Count - Archery tracker** (id6776734793) | Matthew Gray | Gratis; prueba hasta 100 flechas; luego **pago único** (sin suscripción) | 0 valoraciones | **17-jul-2026 (nueva)** | Acelerómetro: cuenta tiros y **shot time (alzar brazo→suelta)**; HealthKit con FC y calorías; **sensibilidad en G ajustable**; historial y gráficas semanales. **Limitación reconocida por el dev**: requiere brazo alzado y estable; "los tiros cuesta abajo (field) pueden no registrarse". Requiere watchOS 10.6+ |
| **ArrowSense** (id1490650258) | TARGETED LABS SL | Gratis | **1★ ×1** | 21-jul-2023 | Workouts de archery + gráfica de datos de movimiento para analizar tiros; abandonada |
| **Arrow Tempo** (arrowtempo.com) | — | Freemium; Premium **14,99 USD/mes o 99,99 USD/año** (prueba 7 días) | — | — (web oficial) | **Fusión movimiento (100 Hz) + micrófono** (sonido de la suelta); detector de caminata pausa el conteo; por flecha: FC en el instante de la suelta, **hold time** y calorías; puntuación con cámara (36 flechas/día gratis); guarda "Archery workout" en Health; todo on-device; también enlace a Google Play. https://arrowtempo.com/apple-watch-archery-app [DEV — web oficial, fetch 17-sep-2026] |

### 4.2 Scoring/análisis sin detección automática (competencia indirecta del móvil)

- **ArcherySuccess** (AllTen Software): **14,99 USD**, **4,75★ ×291** — scoring + plot de flechas + diario de material; elogiada en ArcheryTalk (jun-2025) [VERIFICADO iTunes + USUARIO ArcheryTalk].
- **Falcon Eye: Archery tracker** (Martin Vaclavik): gratis, **4,83★ ×18** (US), v5.0.1 actualizada **29-ago-2026** (activa); scorekeeper iPhone+Watch; reseña citada: "no buggy, no subscription... la uso en torneos para la puntuación" [VERIFICADO iTunes; cita de búsqueda App Store].
- **Archery Scoresheets** (Appshay): 4,76★ ×554; **Ishi Archery**: 4,77★ ×120; **Rise**: 4,77★ ×154; Archery & 3D Scorecard, CapTarget Archery (4,93★ ×15, "World Archery Partner"), QuivAR (AR 3D). [VERIFICADO iTunes search "archery", 17-sep-2026]
- **ArcherSense: AI Archery Coach** (Carlos Farias): gratis, 5★ ×3; IA por **vídeo** (stance/draw/anchor/release), scoring WA, informes PDF biomecánicos. Análisis por cámara, no por reloj. [VERIFICADO iTunes lookup]

### 4.3 Otros

- **Actividad "Archery" nativa en Apple Watch**: un usuario (Reddit, 2023) reporta que el app Workout de watchOS tiene actividad Archery que registra tiempo/calorías/FC, "no sé si es precisa para algo que no sea tiempo". [USUARIO] La constante HealthKit de archery existe desde las primeras versiones (no verificado en docs de Apple: la página consultada devolvió 404).
- **"Intuitive Archer" y "Arcs companion"**: **no aparecen** en búsquedas de App Store ("intuitive archer", "arcs archery" devuelven solo juegos) a 17-sep-2026. No hay evidencia de que existan como apps de arquería para watchOS. [VERIFICADO por ausencia — iTunes search]
- **Mathews Shot Sense**: módulo hardware en el grip con analítica de tiro; usuarios lo descartan por precio ("the price is a little too high") y por no poder manipular los datos. [USUARIO] ArcheryTalk, jun-2025.

---

## 5. Otras plataformas

- **Samsung Galaxy Watch**: cubierto por Wear OS (§3). ArcheryShotCounter está probado en Galaxy Watch 6 Classic. [VERIFICADO README]
- **Polar**: **ecosistema cerrado** — no existen apps de terceros en el reloj. La página oficial de developers solo ofrece integración de datos hacia fuera (Polar API/AccessLink, Team Pro API, Polar SDK con datos live incluyendo aceleración, Bluetooth Smart, Google Fit/HealthKit). No hay tienda de apps ni manera de ejecutar lógica de arquería en el reloj. [VERIFICADO] https://www.polar.com/en/developers (17-sep-2026)
- **Suunto**: la página de FAQ consultada devolvió 404; **no se ha encontrado ninguna app de arquería para Suunto** en ninguna búsqueda (Google/Bing/sitios de arquería). Suunto no ofrece una tienda abierta de apps de reloj comparable a Connect IQ (sus funciones extra van vía "SuuntoPlus", curadas por Suunto). **No se pudo verificar con fuente primaria en esta sesión** — tratar como ausencia de evidencia, no como evidencia de ausencia. [VERIFICADO por ausencia en búsquedas + LIMITACIÓN]
- **Fitbit**: anécdota de usuario: "lo mejor que hice con mi Fitbit fue usarlo de contador de flechas". [USUARIO] Reddit/PullPush, hilo 1506i0q (2023)
- **Hardware dedicado (referencia de precio)**: visores Garmin Xero a1i/Pro (800–1.300 USD) cuentan flechas y dan datos de vibración tras el disparo; Mathews Shot Sense (módulo de grip). [USUARIO] ArcheryTalk, jun-2025 (precios citados por usuarios)

---

## 6. Detección de suelta por acelerómetro de muñeca: estado del arte

### 6.1 Quién lo hace (17-sep-2026)

| Solución | Plataforma | Sensor | Enfoque |
|---|---|---|---|
| K Archery | Garmin CIQ | Acelerómetro del reloj | "Firma" de la suelta de la cuerda, umbrales calibrados con recurvistas de élite [DEV] |
| ArcheryX (nativo) | Fenix 9/9 Pro | Movimiento del brazo del arco y cuerpo (acelerómetro+giroscopio según prensa) [SECUNDARIA] | Break del tiro, aim trace, MOA de estabilidad |
| ArcheryShotCounter | Wear OS | Acelerómetro de muñeca | Impulso de recoil; sensibilidad H/M/L/custom + cooldown [VERIFICADO README] |
| Archery Tracker | watchOS | Acelerómetro en mano del arco | Umbral con feedback háptico [VERIFICADO descripción App Store] |
| Arrow Count | watchOS | Acelerómetro | Cuenta + shot time; requiere brazo alzado/estable [VERIFICADO descripción App Store] |
| Arrow Tempo | watchOS | Acelerómetro 100 Hz + **micrófono** | Fusión movimiento+sonido para evitar falsos conteos [DEV web oficial] |

### 6.2 ¿Alguien publica precisión?

**No.** Ninguna app ni Garmin publican % de detección, precisión/recall, ni tasas de falsos positivos/negativos: K Archery lo afirma cualitativamente ("sin confundir nunca una suelta con un movimiento ordinario" [DEV]), Arrow Count solo da instrucciones cualitativas de ajuste de G [VERIFICADO], Arrow Tempo habla de "evitar falsos conteos" sin cifras [DEV], y el comunicado de ArcheryX no menciona precisión [VERIFICADO]. **Es un campo totalmente abierto.**

### 6.3 Experiencias de usuario (falsos positivos/negativos)

Del hilo r/Archery "Smart or fitness watches for archery?" (jul-2023; comentarios vía PullPush, 17-sep-2026) [USUARIO]:
- **Mano importa**: "Si disparas diestro, tienes que mover el reloj a la mano derecha [mano de cuerda]. Usa el acelerómetro para cazar el tiro. La mano del arco no se mueve lo suficiente." (nota: contradice la recomendación de las fichas de watchOS de llevarlo en mano del arco → la orientación/muñeca es un problema real sin resolver).
- **Peso del arco importa**: "cuanto más ligero el arco (libraje), menos probable que lo capture. Con 40 lbs nunca me falló."
- **Falsos negativos**: "lo probé y resultó inconsistente... a veces no registraba tiros" (usuario barebow).
- **Apple Watch nativo**: sirve "para tiempo transcurrido" al moverse hacia el blanco, no para contar.
- Veredicto Garmin pre-K-Archery-visible: "probé las apps disponibles y ninguna sigue bien la arquería".
- En ArcheryTalk (jun-2025): un Fenix 7X Pro con la actividad nativa Archery/Outdoor solo le sirve FC y distancia; para contar tiros no encontró forma; consideró K Archery pero las reseñas lo echaron atrás [USUARIO].

---

## 7. Precios, popularidad y huecos

### 7.1 Tabla de precios (17-sep-2026)

| App | Modelo | Precio |
|---|---|---|
| K Archery (Garmin) | Freemium + unlock vitalicio + suscripción web | Probar gratis; **15 € pago único**; Connect **5 €/mes** (early, de por vida) / **9 €/mes** desde 2027 [DEV] |
| Target Archery App / Arrow Counter (Garmin) | Gratis | 0 € |
| Archery Tracker (watchOS) | Freemium | IAP 9,99 USD |
| Arrow Count (watchOS) | Freemium | Pago único (precio no publicado en los metadatos; "más barato que un contador manual") |
| Arrow Tempo (watchOS) | Suscripción | 14,99 USD/mes o 99,99 USD/año |
| ArcherySuccess (iOS) | Pago | 14,99 USD |
| Falcon Eye (iOS) | Freemium/pago único | reseñas: "no subscription" |
| ArcheryShotCounter (Wear OS) | OSS (MIT), sideload | 0 € |

### 7.2 Popularidad aproximada

- **K Archery: 1.000+ descargas, 40 reseñas** — es la app de arquería **líder** en el nicho wearable Garmin. [VERIFICADO]
- Target Archery App y Archery Arrow Counter: 1.000+ descargas cada una, 16 y 6 reseñas. [VERIFICADO]
- ArcheryShotCounter (Wear OS): 4 estrellas en GitHub (equivalente a <100 usuarios, probablemente decenas). [VERIFICADO]
- watchOS: la mejor valorada con detección (Archery Tracker) tiene solo 5 valoraciones en US; scoring puro llega a 291 (ArcherySuccess) y 554 (Archery Scoresheets). [VERIFICADO]
- Referencia de masa crítica fuera del reloj: MyTargets (Android, scoring) ~3.590 valoraciones. [VERIFICADO Play]

**Lectura**: el nicho wearable de arquería tiene **miles** de usuarios potenciales ya identificados, pero todas las apps suman decenas de miles de instalaciones como mucho; no hay un ganador consolidado fuera del segmento scoring-en-móvil.

### 7.3 Huecos que dejan (con evidencia)

1. **Nadie publica precisión de detección** (§6.2) → la confianza es el factor de compra y nadie la puede demostrar.
2. **Sin live-view en móvil**: K Archery envía a una web tras la sesión con suscripción; ninguna app de reloj transmite la curva del tiro en vivo por BLE al móvil (ArcheryWatch ya lo hace). [VERIFICADO por ausencia en descripciones/fichas]
3. **Sin comparación de trazas/curvas entre tiros o sesiones** en reloj: K Archery da curvas por flecha en su plataforma de pago; ArrowTime Chrono compara curvas de velocidad, no de técnica. [VERIFICADO]
4. **Idiomas**: K Archery no tiene español (FR/EN/DE/RU/zh); ArcheryShotCounter sí (12 idiomas) pero requiere sideload. [VERIFICADO]
5. **watchOS**: la app pionera está abandonada desde 2021 y con paywall a los 10 tiros; la nueva (Arrow Count, jul-2026) valida que el nicho sigue vivo; la suscripción de Arrow Tempo (180 USD/año) deja espacio a pago único. [VERIFICADO]
6. **Garmin gama media sin ArcheryX**: ArcheryX es de serie solo en Fenix 9/9 Pro; los FR165/265/955/Instinct quedan fuera de la analítica nativa → espacio para apps CIQ. [VERIFICADO comunicado]
7. **Actividad "Archery" inaccesible desde CIQ** (foro 386744): los datos de arquería de terceros se registran con otros tipos de deporte; nadie lo ha resuelto. [VERIFICADO]
8. **Muñeca y tipo de arco**: sin consenso (mano del arco vs de cuerda; fallos con librajes bajos y barebow) → la calibración por perfil es un diferenciador real. [USUARIO + VERIFICADO descripciones]
9. **Nadie cubre 3D/field con GPS + análisis por tiro** salvo K Archery (GPS sí, análisis en web de pago). [VERIFICADO]
10. **Wear OS casi vacío** (un proyecto MIT con 4 estrellas, sideload). [VERIFICADO]

---

## 8. Implicaciones para ArcheryWatch (accionables)

1. **Publicar precisión medida**: montar un banco de validación (firmas de acelerómetro etiquetadas de tiros reales por estilo/libraje) y comunicar "X % de tiros detectados, Y falsos positivos/hora" en la ficha y la web. Nadie del nicho publica cifras (§6.2); ser el primero convierte la duda #1 de los usuarios ("¿contará bien?") en ventaja competitiva.
2. **Calibración guiada por perfil** (arco, libraje, mano hábil, muñeca, estilo): los fallos documentados son con arcos ligeros, barebow y muñeca equivocada (§6.3). Un asistente de calibración de 5 tiros con feedback en vivo (la app ya tiene fases+BLE) ataca directamente el punto débil de K Archery (umbrales fijos de élite recurvo).
3. **Soportar ambas muñecas y documentarlo con pruebas**: la contradicción entre "mano del arco" (fichas watchOS) y "mano de cuerda" (usuarios) sugiere que la señal está en el latigazo de la cuerda; probar la detección en ambas muñecas y publicar qué funciona mejor por tipo de arco.
4. **Live-view en móvil como diferenciador estrella**: nadie transmite la curva del tiro en tiempo real al móvil por BLE (§7.3.2). Cosecharlo en marketing: "ve tu curva de tensión al segundo, no al final de la sesión". Un vídeo demo al estilo "K Archery demo" de YouTube mostrando el live-view sería el equivalente del demo de K Archery pero superado.
5. **Precio anclado a 15 € pago único** (estándar de facto del nicho Garmin): igualar o batir (p. ej. 9,99-14,99 € de lanzamiento). Evitar suscripciones obligatorias: el rechazo de Arrow Tempo (14,99 USD/mes) y la reputación de Archery Tracker ("paga tras 10 tiros") demuestran que el paywall agresivo quema el nicho.
6. **Si hay plataforma/servidor, que sea gratis o barato y sin "desde 2027 sube a 9 €/mes"**: el anuncio público de subida de K Archery es una palanca de migración ("tarifa early sin letra pequeña").
7. **Español de primera clase**: K Archery no tiene español; el mercado iberoamericano y España (gran base de tiradores, ArcheryTalk/Reddit hablan de la falta de apps) es ganable solo por idioma. Luego EN, FR, DE, IT, PT; RU/zh menos prioritarios.
8. **Compatibilidad multi-Garmin desde el día 1**: K Archery cubre 216 tipos de dispositivo; el nicho es pequeño y cada reloj compatible multiplica instalaciones. Priorizar FR165/265/955 (AMOLED, corredores que también tiran), fenix e Instinct (público 3D/caza), Venu (casual).
9. **Sets 3/6 + auto-pausa entre ends + corrección manual**: paridad con ArcheryShotCounter (ends con auto-pausa, +/−) y K Archery (ends automáticos). La corrección manual +/− es obligatoria porque los falsos negativos con arcos ligeros están documentados.
10. **Anti-falsos-positivos explícito**: cooldown configurable entre tiros (como ArcheryShotCounter) y detector de caminata/levantar flechas (como el walk-detector de Arrow Tempo). Los usuarios citan pasos y ruido del campo como causa de sobreconteo.
11. **Export abierto de datos crudos**: CSV (Archery Tracker) y JSON (ArcheryShotCounter) marcan el mínimo; K Archery solo da 1 minuto de crudos vía contacto con el dev. Exportar la sesión completa cruda (acelerómetro a alta frecuencia + fases + eventos) genera confianza y comunidad académica/maker.
12. **Jugar con la actividad FIT de Garmin**: dado que CIQ no permite el tipo "Archery" (foro 386744), usar FitContribution para que la actividad sea útil en Connect y soportar el flujo que K Archery no resolvió; documentar en la ficha qué tipo de actividad se registra y por qué.
13. **Posicionarse frente a ArcheryX sin chocar con Garmin**: ArcheryX solo existe en Fenix 9/9 Pro y es compound-centric; el mensaje es "la analítica de ArcheryX para tu FR165/Instinct, y para recurvo/barebow" + export a Excel/CSV que ArcheryX no abre. Vigilar: si Garmin extiende ArcheryX a Forerunner, el valor debe estar en el análisis de técnica (fases, curvas, live-view) que el nativo no ofrece en esas gamas.
14. **Comparación de trazas entre tiros/sesiones en el móvil**: nadie la ofrece en wearable (§7.3.3); con el live-view ya existente, añadir overlay de curvas (tiro actual vs mejor tiro de referencia, "good shots" al estilo Archery Tracker) es el siguiente paso natural y altamente diferencial.
15. **Distribución y comunidad**: los hilos donde se decide la compra son r/Archery, ArcheryTalk y los foros de Garmin (2023-2026, aún activos y con demanda insatisfecha: "ninguna lo hace bien"). Publicar en esos hilos (sin spam), conseguir 3-5 reseñas en la store de Garmin pronto (K Archery ganó visibilidad con 40; el líder rival solo tiene 1.000 instalaciones — el mercado se decide con cientos), y mantener cadencia de updates visible: DrLogik descartó K Archery por su historial de bugs; una cadencia pública de releases es argumento de venta.

---

## 9. Anexo: fuentes principales (consultadas 17-sep-2026)

1. Ficha K Archery (store + JSON SSR): https://apps.garmin.com/en-US/apps/f3b2b9de-0a33-47d2-bfda-b6df45efc946
2. Plataforma K Archery Connect: https://karchery.jnk-conseil.fr
3. Vídeo demo K Archery: https://www.youtube.com/watch?v=FaH9l_sl4q0 ("K Archery demo", canal TheDocNo, vía YouTube oEmbed)
4. Hilo foro CIQ "Activity type: Archery": https://forums.garmin.com/developer/connect-iq/f/discussion/386744/activity-type-archery
5. Comunicado Garmin ArcheryX: https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/ (25-ago-2026)
6. the5krunner, "Garmin ArcheryX – Fenix 9's new feature Explained" (25-ago-2026): https://the5krunner.com/2026/08/25/garmin-archeryx-explained/ [SECUNDARIA, artículo no accesible completo]
7. Fichas Target Archery App y Archery Arrow Counter (JSON SSR de apps.garmin.com, ids `1299ab43-...` y `afab51cb-...`)
8. SteadyBow (SiruxLabs): https://apps.garmin.com/en-US/apps/d03be65b-4570-4831-9ddf-54dbbd046b6d
9. Archery (Col1nsmith, store china): https://apps.garmin.cn/zh-TW/apps/a2bf8354-6881-4653-aebc-527b653fb6c3
10. Repo ArcheryShotCounter-wearos + README: https://github.com/Vemestael/ArcheryShotCounter-wearos (API GitHub)
11. App Store (API iTunes lookup/search, US): Archery Tracker id1450784807; Falcon Eye id1568496550; Arrow Count id6776734793; ArrowSense id1490650258; ArcherSense id6748324853; búsquedas "archery", "intuitive archer", "arcs archery"
12. Arrow Tempo (web oficial): https://arrowtempo.com/apple-watch-archery-app
13. ArcheryTalk "Garmin to track shot count" (jun-2025): https://www.archerytalk.com/threads/garmin-to-track-shot-count.6325501/
14. Reddit r/Archery "Smart or fitness watches for archery?" (jul-2023), comentarios vía API PullPush: https://api.pullpush.io/reddit/search/comment/?link_id=1506i0q
15. Polar developers (modelo cerrado): https://www.polar.com/en/developers
16. GoWild+Garmin (Outdoor Wire): https://theoutdoorwire.com/releases/674c785a-9c13-4549-b8fd-7839c04c8e98
17. Play Store (búsqueda "archery tracker watch"): https://play.google.com/store/search?q=archery%20tracker%20watch&c=apps

**Limitaciones de esta investigación**: (a) los textos de reseñas de la store de Garmin no son accesibles sin sesión (solo nota media y recuento); (b) el buscador de apps.garmin.com no tiene API pública documentada, por lo que el catálogo del §2.1 puede no ser exhaustivo al 100 % (los juegos y watch faces con temática arquería no listados podrían existir); (c) el mapeo de los 216 part numbers de K Archery a nombres de dispositivo (para confirmar FR165) no está disponible públicamente; (d) WebSearch se agotó durante la sesión, las búsquedas tardías se hicieron con fetch directo de fuentes conocidas.
