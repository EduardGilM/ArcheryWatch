# Investigación de producto: Garmin ArcheryX + Garmin ShotView

**Fecha de investigación:** 2026-09-17
**Objetivo:** documentación exhaustiva de la actividad de tiro con arco **Garmin ArcheryX** (anunciada el 25/08/2026 para fēnix 9 / fēnix 9 Pro) y de la app de análisis **Garmin ShotView**, para igualar/mejorar su experiencia en **ArcheryWatch** (app Connect IQ para Forerunner 165 + visor Android por BLE).
**Convención de fiabilidad:** cada afirmación se marca como 🔒 **VERIFICADO** (fuente primaria: Garmin o ficha oficial de tienda), 📰 **PRENSA** (medio secundario citando a Garmin), ⚠️ **NO VERIFICADO / DUDOSO** (fuente única, sin corroborar, o de fiabilidad cuestionable). Cita + fecha en cada caso.

> **Nota metodológica y límites de esta investigación:** el motor de búsqueda web agotó su cuota a mitad de la sesión, por lo que la cobertura de Reddit, foros y patentes es parcial (los detalles están indicados donde aplica). Reddit bloqueó el acceso directo (403). La App Store de Apple no respondió. El resto se verificó contra fuentes primarias accesibles (Garmin newsroom, manual oficial webhelp del fēnix 9, Google Play).

---

## 0. Ficha rápida (TL;DR)

| Aspecto | Resumen | Fiabilidad |
|---|---|---|
| Qué es | Perfil de actividad nativo en el reloj para tiro con arco **con arco compuesto**, centrado en el análisis del ciclo de tiro (apunte → suelta → follow-through) | 🔒 [PR Garmin, 25/08/2026](https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/) |
| Dispositivos | Solo **fēnix 9 y fēnix 9 Pro** (de serie). NO llega a fēnix 8 ni anteriores; **confirmado que no se backporte** a Forerunner/Instinct | 🔒 PR + 📰 [the5krunner, 26/08/2026](https://the5krunner.com/2026/08/26/fenix-9-features-will-pass-to-existing-garmin-watches/) |
| Dónde va el reloj | En la **muñeca del arco** (brazo del arco), no la de la cuerda | 🔒 [Manual fēnix 9, v1 ago-2026](https://www8.garmin.com/manuals/webhelp/GUID-708A8F4D-9A78-49CF-9528-DE109BBCC472/EN-US/GUID-95092193-D88B-41FA-8C68-8D48FD263264.html) |
| App de análisis | **ShotView**: app de smartphone (Google Play confirmado; "app store de tu teléfono" según manual). Ya existía para cronógrafos Xero; el soporte ArcheryX se añadió el 02/09/2026 | 🔒 [Google Play](https://play.google.com/store/apps/details?id=com.garmin.android.apps.shotview) + 🔒 manual |
| Trazado | Traza del movimiento de la muñeca ("**Aim Path**" en ShotView) mostrada **inmediatamente tras cada tiro** con **reproducción animada**; punto que marca la suelta; métrica de estabilidad en **minutos de ángulo (MOA)** | 🔒 PR + 🔒 Google Play; detalles visuales finos ⚠️ |
| Precio | Incluido **de serie** con el reloj. Sin mención de suscripción. fēnix 9 desde 999,99 USD; fēnix 9 Pro desde 1.099,99 USD | 🔒 [PR fēnix 9, 25/08/2026](https://www.garmin.com/en-US/newsroom/press-release/outdoor/garmin-expands-its-flagship-performance-smartwatch-lineup-with-fenix9-and-fenix9-pro/) |
| Para ArcheryWatch | Garmin deja **todo el catálogo no-fēnix-9 sin arquería analítica** (incluido el Forerunner 165): nuestro mercado no tiene competencia oficial hoy | Deducción de las dos anteriores |

---

## 1. Anuncio oficial y funciones exactas

### 1.1 Comunicado de prensa de Garmin (fuente primaria) 🔒

**Garmin, "Track and improve archery performance with the new ArcheryX smartwatch activity from Garmin", Olathe (Kansas), 25 de agosto de 2026, 05:53 CDT.**
Enlace: https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/

- Definición oficial: *"a first-of-its-kind smartwatch activity designed to help improve shooting accuracy and consistency with compound bows"* — "primera actividad de smartwatch de su tipo diseñada para mejorar la precisión y consistencia del tiro **con arco compuesto**".
- Funcionamiento declarado: rastrea el movimiento del **brazo del arco** y del cuerpo para dar datos y biometría en tiempo real desde la muñeca.
- Dispositivos: *"comes standard"* (viene de serie) en los nuevos **fēnix 9 y fēnix 9 Pro**.
- Lista oficial de funciones (sección "Insights with every arrow", traducción literal de cada ítem):

| Función oficial | Texto original (traducido) |
|---|---|
| **Shot break analysis** (análisis previo a la suelta) | "Rastrea el movimiento del brazo del arco justo antes del momento de la suelta para mejorar la técnica." |
| **Shot execution time** (tiempo apertura→suelta) | "Ver el tiempo desde la apertura hasta la suelta para aumentar la consistencia." |
| **Arrow counter** (contador de flechas) | "Lleva fácilmente la cuenta de cuántas flechas se disparan por sesión." |
| **Minutes of angle** (MOA / estabilidad) | "ArcheryX mide la estabilidad de cada tiro para ofrecer a los arqueros una estadística de 'minutos de ángulo' por tiro" — vinculando estabilidad de apuntado con el resultado. |
| **Aim trace** (traza de apuntado) | "Ver la traza del movimiento de la muñeca de cada tiro **inmediatamente después de cada tiro**, junto con **reproducción animada**." |
| **Beyond the bow** (biometría) | "Registrar frecuencia cardiaca, frecuencia respiratoria y niveles de estrés durante la sesión." |
| **See stats at a glance** (tendencias) | "Analizar en profundidad el rendimiento y ver tendencias a lo largo del tiempo en la **app ShotView**. Lleva la cuenta de cada flecha por sesión y ve totales de flechas por día, semana, mes y año." |

- Contactos de prensa del PR: Brianna Silverman y Rehan Nana, Garmin International.
- Lo que el PR **no** menciona: calibración, borrado de tiros, Xero, precio específico de la actividad, citas de ejecutivos. 📰 (verificado por extracción del texto completo).

### 1.2 Manual oficial del fēnix 9 (fuente primaria) 🔒

**"fēnix 9 Series Owner's Manual", versión v1, agosto 2026, © Garmin Ltd.**

Página "Recording an ArcheryX Activity" (dentro de *Outdoor Activities*):
https://www8.garmin.com/manuals/webhelp/GUID-708A8F4D-9A78-49CF-9528-DE109BBCC472/EN-US/GUID-95092193-D88B-41FA-8C68-8D48FD263264.html

Flujo completo documentado en el manual:

1. **Inicio:** botón START → **Activities > Outdoor > ArcheryX**.
2. **Primer uso:** seleccionar **Get Started** y seguir las instrucciones en pantalla (asistente inicial).
3. **Tipo de sesión:** seleccionar **Type** → elegir **indoor u outdoor** (interior/exterior). Implica que la detección o métricas se adaptan al contexto.
4. **Calibración por arco:** seleccionar **Record Calibration Shot** y seguir los pasos. Nota del manual: grabar un tiro de calibración *"the first time you use a new bow"* (la primera vez que se usa un arco nuevo) → **la calibración es POR ARCO**, igual que nuestros perfiles de arco.
5. **Colocación obligatoria:** llevar el reloj en *"the wrist holding the bow"* (la muñeca que sostiene el arco). La detección de tiros depende de la calibración y de esta colocación.
6. **Grabación:** pulsar el botón para arrancar el cronómetro de actividad y comenzar a disparar. La detección es automática (no hay que marcar cada tiro).
7. **Pantallas post-tiro:** *"After each shot, scroll down for additional data such as shot graphs and aim information"* — tras cada tiro se puede hacer scroll para ver **gráficas del tiro e información del apuntado** en el propio reloj.
8. **Borrar último tiro:** mantener el botón → **Delete Last Shot** (para flechas fallidas o no disparadas). 🔒
9. **Guardar:** tras la última flecha, pulsar el botón → **Save**.
10. Descripción general del manual: durante la actividad el reloj registra *"your shots, hold steadiness, shooting time, and more"*; las sesiones pueden **compararse** y el progreso seguirse en la app **ShotView** (enlace a la sección "ShotView App").

Página "ShotView App" del manual:
https://www8.garmin.com/manuals/webhelp/GUID-708A8F4D-9A78-49CF-9528-DE109BBCC472/EN-US/GUID-F567A07C-1106-4060-92FC-5EB72C7945D3.html

- Texto (casi) completo de la página: *"The ShotView™ app shows detailed statistics and shot analyses that you recorded with your device"* (La app ShotView muestra estadísticas detalladas y análisis de los tiros registrados con tu dispositivo) y *"You can download the ShotView app from the app store on your phone"* → **app de teléfono**, con enlace oficial a **garmin.com/shotviewapp**. Está bajo el apartado "Phone Apps and Computer Applications". Es una página deliberadamente breve; el detalle está en la propia app.

### 1.3 Nombres de métricas según los distribuidores (prensas/especialistas) 📰

**Vídeo de Lancaster Archery Supply** (mayor distribuidor de arquería de EE. UU.), "Garmin Fenix 9 Watch: ALL NEW Feature Just for ARCHERS - Archery X!!!!!", 11/09/2026, 10.182 visualizaciones (consultado 17/09/2026):
https://www.youtube.com/watch?v=zNb1_3odGcM
- En la descripción: el fēnix 9 Pro *"includes a new app that's built in called Archery X"*, que permite *"track your archery training sessions as the watch tracks your bow movement during the shot process"*. La pantalla del reloj **muestra el movimiento del arco cuando sueltas el tiro**, ayudando a estabilizar, y se puede registrar el apuntado y el timing y ver cómo afectan a los impactos.

**Vídeo de Hoyt Archery** (fabricante de arcos, socio de Garmin; el vídeo vende el fēnix 9 en hoyt.com), "Your Shot Is Telling You Something—ArcheryX Helps You See It", 14/09/2026, 7.514 visualizaciones (consultado 17/09/2026):
https://m.youtube.com/watch?v=ppLQIkdZbbI
- Según su descripción oficial: ArcheryX *"automatically detects each arrow and uses wrist and bow-arm movement"* → **detección automática de cada flecha**.
- Nombres de métricas usados por Hoyt (📋 valiosos como "nomenclatura estándar" que el mercado está aprendiendo):
  - **Aim Time** (tiempo de apunte)
  - **Shot Execution Time (S.E.T.)** (tiempo de ejecución del tiro, apertura→suelta)
  - **Aim Radius** (radio de apuntado)
  - **Break Radius** (radio en el momento de la suelta)
  - **Break Diameter** (diámetro en la suelta)
  - **Aim Trace** (la traza del movimiento antes de la suelta)
- Repaso post-sesión en ShotView con tiros individuales, estadísticas de sesión y tendencias a largo plazo; contador automático de flechas; feedback en tiempo real; biometría (FC, respiración, estrés); orientado a arqueros de compuesto.
- Precios etiquetados en el vídeo: fēnix 9 47 mm — 1.049,99 USD; fēnix 9 Pro inReach 51 mm — 1.349,99 USD (hoyt.com).

### 1.4 Artículo "explicativo" de prensa especializada 📰

**the5krunner, "Garmin ArcheryX – Fenix 9's new feature Explained", 25/08/2026:**
https://the5krunner.com/2026/08/25/garmin-archeryx-explained/
- *"The watch uses its accelerometer and gyroscope to track bow arm movement throughout each shot"* → **acelerómetro + giroscopio** siguiendo el brazo del arco durante todo el tiro.
- Flujo de datos: el reloj muestra los datos en tiempo real y **sincroniza con la app ShotView a través de Garmin Connect** (reloj → Garmin Connect → ShotView).
- Las ~7 métricas por flecha: shot break analysis, MOA, aim trace, shot execution time, contador de flechas, FC, respiración/estrés.
- Sobre MOA: cifra de precisión angular de la estabilidad; **cuanto más bajo, más estable el agarre**; comparar MOA contra el impacto real de la flecha para diagnosticar si limita la técnica o la ejecución.
- Traza: *"with animated playback immediately after release"* (coincide con el PR).
- Compatibilidad: *"ArcheryX is available on the Fenix 9 and Fenix 9 Pro at launch. It is not available on the Fenix 8 or earlier models."* No menciona recurvo/tradicional → solo compuesto de momento.
- Precio: no hay precio separado para ArcheryX; es función del fēnix 9 (gama desde 999 USD/999 €/859 £).
- Sin mención de calibración, de Xero o de suscripción. El autor dice en la barra lateral que *"acaba de comprarse"* un fēnix 9 Pro (señal de que la prensa entusiasta también compra el hardware).

**Game & Fish Magazine, "Garmin ArcheryX feature", 26/08/2026** (enfoque cazador con arco):
https://www.gameandfishmag.com/editorial/garmin-archeryx-feature/558322
- Para arqueros de caza en sesiones de práctica: registra tiempo en apertura plena, estabilidad antes del disparo y movimiento del brazo del arco en la suelta, con el objetivo de *"identify habits that can improve consistency and tighten groups"*.
- Repite el paquete de funciones (shot break analysis, aim/draw→release, contador semanal, medida tipo MOA, biometría FC/respiración/estrés) y la revisión en ShotView. Cierre positivo: *"looks like an intriguing new tool"* para arqueros amantes de los datos.

---

## 2. Garmin ShotView: qué es exactamente

### 2.1 Origen: no nació para ArcheryX 🔒

La ficha oficial de Google Play lo dice textualmente:

> *"Use the ShotView™ app to connect to your Xero® chronographs, and ArcheryX compatible devices."*
> — https://play.google.com/store/apps/details?id=com.garmin.android.apps.shotview (Garmin International; **actualizada el 02/09/2026**; 50.000+ descargas; PEGI 3)

Es decir: **ShotView es la app que Garmin ya usaba con sus cronógrafos de tiro Xero (C1/C2)** para velocidad de salida, análisis balístico y gestión de sesiones, y el soporte de ArcheryX se **añadió** a esa app (nota de la versión del 02/09/2026: *"New ArcheryX session cards and detailed session insights with shot lists and session type filtering"*). Esto explica su ADN: export CSV, notas por tiro, exclusión de outliers, perfiles de arma/munición, etc.

- Plataformas: **Android confirmado** (Google Play). Para iOS, el manual dice genéricamente *"download… from the app store on your phone"* 🔒 (no pude verificar la ficha del App Store: la API de iTunes no respondió durante la investigación). Página oficial de marketing: garmin.com/shotviewapp (carga por JS; el scrape solo devolvió navegación, título "ShotView™ App" confirmado).
- Cuenta: *"A Garmin account is required to store your data in the cloud"* 🔒 (Google Play) → la copia en la nube requiere cuenta Garmin; no hay mención de pago.
- Canal de datos: reloj → **Garmin Connect** → ShotView 📰 (the5krunner, 25/08/2026). No es BLE directo reloj↔app como ArcheryWatch: pasa por el ecosistema Garmin (con la latencia que eso implica).

### 2.2 Qué muestra ShotView (features oficiales de la ficha) 🔒

Funciones declaradas en Google Play (02/09/2026), combinando descripción y "novedades de la versión":

| Capacidad en ShotView | Detalle |
|---|---|
| **ArcheryX session cards** | Tarjetas por sesión con *"detailed session insights with shot lists and session type filtering"* (listas de tiros y filtrado por tipo de sesión — encaja con Type indoor/outdoor del reloj) |
| **Aim Path** | Gráfica de la traza de apuntado; novedades: *"aim path visualization/playback"* → **visualización Y reproducción animada** de la traza |
| **Float Analysis** | Gráfica de "flotación" (análisis del apunte durante la retención); listada junto a Aim Path en las funciones y en las novedades |
| **Interactive charts** | Gráficas interactivas de las métricas de la sesión |
| **Shot editing and grouping** | Edición y agrupación de tiros (marcar tiros válidos, agrupar en ends/sets) |
| **Performance statistics** | Estadísticas de rendimiento por tiro y sesión |
| Herencia Xero (ya existía) | Sesión en vivo con gráfica de velocidad en tiempo real (C2), análisis balístico (velocidad, desviación, extreme spread, energía cinética), **export CSV**, exclusión de outliers/"cold bore", nombre de sesión, **notas por tiro**, filtros por tipo de arma, perfiles personalizados por plataforma/munición |
| Nube | Backup opcional con cuenta Garmin |

- Tendencias históricas 🔒: el PR de ArcheryX (25/08/2026) añade lo específico de arquería: *"Dig deeper into shooting performance and see trends over time in the ShotView app"* y *"Keep track of every arrow by session and see arrow count totals by day, week, month and year"* (totales de flechas por día/semana/mes/año).
- Comparación de sesiones 🔒: el manual del fēnix 9 habla de comparar sesiones y seguir mejoras en ShotView.
- Lo que **no está documentado** públicamente (a fecha 17/09/2026): pantallas concretas, tipos de gráfica exactos por métrica, si hay app web además de móvil. ⚠️ No encontré screenshot oficial descrito con detalle.

---

## 3. CÓMO dibuja la traza (descripción visual lo más precisa posible)

Aquí está el núcleo de lo que nos interesa: **el dibujado y trazado**. Reconstrucción a partir de todas las fuentes disponibles, con el nivel de confianza de cada pieza:

### 3.1 Piezas duras (verificables)

- **Se dibuja inmediatamente tras cada tiro, con animación** 🔒: *"See the trace of the wrist's motion for each shot immediately after each shot, along with animated playback"* (PR Garmin, 25/08/2026). La recompensa visual es instantánea, en el reloj, flecha a flecha.
- **También se reproduce/visualiza en ShotView** 🔒: "aim path visualization/playback" (Google Play, 02/09/2026).
- **El punto de suelta queda marcado** ⚠️: The Smart Snout describe que un **punto rojo** marca el instante en que el acelerómetro detecta el impulso hacia delante de la suelta, y que *"only the final 0.5 seconds before that dot matters for accuracy"* (solo los últimos 0,5 s antes del punto importan para la precisión) — https://thesmartsnout.com/2026/09/16/garmin-archeryx-shotview-hold-steadiness-guide/ (16/09/2026). **Fuente dudosa** (ver 3.4), pero coherente con la física y con el resto de fuentes.
- **En el reloj, la traza aparece al soltar** 📰: Lancaster (11/09/2026) describe que la pantalla del reloj muestra el movimiento del arco en el momento de la suelta para ayudarte a estabilizar.
- **Escala angular (MOA)** 🔒/⚠️: la métrica de estabilidad oficial es MOA por tiro (PR). Smart Snout muestra la interfaz con valores cabecera tipo **"2.4 MOA Deviation / 6.2s Hold Time / 88 HR at Break"** ⚠️. No hay confirmación oficial de si la traza se dibuja en escala MOA fija o autoescalada.
- **Diagnóstico por ejes** ⚠️ (Smart Snout): deriva **horizontal** del trazo → presión de agarre; rebote **vertical** → tensión de core/largo de desnivel. *"The sensors isolate these axes brilliantly"*.

### 3.2 Forma típica del trazo ⚠️

Descripción de Smart Snout (16/09/2026), que llama al patrón *"a classic back-tension stabilization pattern"*:
- **Trayectoria de entrada ancha** (en su ejemplo entra por abajo-izquierda) que **decae en una oscilación estrecha y centrada** justo antes de la suelta.
- La nube final es compacta: la "dispersión" viva alrededor del centro en los últimos instantes es la información útil (de ahí Aim Radius/Break Radius/Break Diameter de Hoyt 📰).
- No menciona anillos de diana ni colores por fase en la traza: la única marca de color citada es el **punto rojo de suelta**. ⚠️ **No confirmado por fuentes primarias**: colores por fase, grosor del trazo, anillos, rejilla, zoom.

### 3.3 Qué NO encontramos (huecos documentados)

- Sin capturas oficiales describibles de la traza en ShotView (las imágenes de prensa son fotos de producto, p. ej. "Photo courtesy of Garmin" en Game & Fish 📰).
- Sin confirmación de: mapa de colores por fase (apertura/apunte/suelta/follow-through), autoescala vs MOA fija, anillos de diana sobre la traza, zoom por pellizco, replay con scrubber manual (solo "playback" genérico).
- Los vídeos de Lancaster y Hoyt no exponen transcripción accesible (bloqueada en el scrape), así que el detalle en movimiento queda sin verificar.

### 3.4 Advertencia de fiabilidad sobre Smart Snout ⚠️

El artículo (Allen Moore, 16/09/2026) dice haber usado el fēnix 9 en el brazo del arco *"last October"* (octubre de 2025), **imposible** si el reloj se lanzó el 25/08/2026; el blog es pequeño y de temática cambiante (mascotas, seguros…). Sus cifras (2.500 flechas en 3 meses, experimentos con estabilizador, FC pre-tiro 78→115 ppm) deben tratarse como **ilustrativas, no verificados**. Aun así, sus descripciones estructurales de la traza (entrada ancha → oscilación centrada → punto rojo de suelta; ejes H/V; MOA por tiro) son coherentes con las funciones oficiales y con la mecánica del movimiento, por lo que las usamos como hipótesis de trabajo y no como hecho.

---

## 4. Dispositivos compatibles y requisitos

- **Solo fēnix 9 y fēnix 9 Pro**, de serie 🔒 (PR Garmin, 25/08/2026).
- **No está en fēnix 8 ni anteriores** 📰: *"It is not available on the Fenix 8 or earlier models"* (the5krunner, 25/08/2026).
- **Confirmado que NO se backportea** 📰: en la lista de funciones de fēnix 9 que Garmin sí migrará a relojes anteriores (Garmin Epic, zonas de stamina, remo indoor, rucking, etc.), el5krunner (26/08/2026, citando a DC Rainmaker) escribe: *"ArcheryX, the new compound bow activity profile, is Fenix 9 only"* → **Forerunner 970/570, Instinct 3, Venu, Epix, etc. quedan fuera** por ahora. Enlace: https://the5krunner.com/2026/08/26/fenix-9-features-will-pass-to-existing-garmin-watches/
- La ficha de ShotView habla genéricamente de *"ArcheryX compatible devices"* 🔒 (Google Play), formulación que deja la puerta abierta a futuros dispositivos (no confirmado nada).
- **Requisito de colocación: muñeca del arco** 🔒 (manual: "the wrist holding the bow"). El perfil entero está diseñado alrededor del sensor de muñeca del brazo que sostiene el arco (acelerómetro + giroscopio 📰).
- **Tipo de arco: compuesto** 🔒 (PR: "with compound bows"). Recurvo/longbow sin mención oficial.
- Peculiaridad de gama: el fēnix 9 Pro añade biometría sobre la mecánica según Smart Snout ⚠️ (no confirmado por Garmin; el PR lista FC/respiración/estrés sin distinguir 9 vs 9 Pro).

---

## 5. Precio e inclusión

- **Incluido de serie** con fēnix 9/9 Pro 🔒 (PR: "comes standard"). Sin SKU aparte ni precio de la actividad.
- **Sin suscripción mencionada** en PR, manual, ni ficha de Google Play 🔒. Solo requisitos: cuenta Garmin para el backup en la nube (Google Play 🔒) y — en el fēnix 9 Pro — plan activo para la conectividad LTE, que no tiene relación con ArcheryX 🔒 (PR fēnix 9).
- Precio del hardware que lo incluye 🔒 (PR fēnix 9, 25/08/2026): fēnix 9 (43/47/51 mm) **desde 999,99 USD**; fēnix 9 Pro **desde 1.099,99 USD**; disponible "ya" (available now). Precios de distribuidor 📰: Hoyt vende fēnix 9 47 mm a 1.049,99 USD y fēnix 9 Pro inReach 51 mm a 1.349,99 USD (14/09/2026); Lancaster fēnix 9 Pro 47 mm Carbon/Black a 1.249,99 USD (11/09/2026).
- ShotView: gratis en Google Play 🔒 (ficha oficial, sin precio).

---

## 6. Recepción (prensa, YouTube, comunidades)

- **Prensa de arquería (positiva)** 📰: Game & Fish (26/08/2026) lo considera *"an intriguing new tool"* para arqueros de datos que convierte el tiempo de campo en confianza de caza. Es prensa de lanzamiento con fotos oficiales de Garmin — tono promocional.
- **Distribuidores (positiva, comercial)** 📰: Lancaster (11/09/2026) y Hoyt (14/09/2026) dedican vídeos íntegros; Hoyt además **vende el reloj en su tienda** (conflicto de interés evidente). Interés de nicho: ~10.000 y ~7.500 visualizaciones en su primera semana respectivamente (consultado 17/09/2026).
- **Comunidades** (acceso limitado durante la investigación):
  - Existe hilo en Reddit r/the5krunner: "Garmin ArcheryX - Fenix 9's new feature Explained" (https://www.reddit.com/r/the5krunner/comments/1vyrytc/) — Reddit devolvió 403 al scrape; **no pude extraer reacciones**. ⚠️
  - Resultado de búsqueda indica un post en un grupo de Facebook de Garmin con feedback mixto y un usuario *"unimpressed by its limited features"* ⚠️ (fragmento de snippet de buscador, sin acceso al post completo; tratar como anécdota).
  - Contexto previo útil: en r/Archery y r/Garmin los arqueros usaban Garmin para arquería con workarounds (perfil de "Strength" renombrado para contar repeticiones como flechas) 📰 (hilos de 2019–2023: https://www.reddit.com/r/Garmin/comments/cz910r/archery_as_exercise/, https://www.reddit.com/r/Archery/comments/1506i0q/smart_or_fitness_watches_for_archery/) — muestra la demanda que ArcheryX viene a cubrir.
- **Críticas técnicas conocidas** ⚠️ (Smart Snout, dudoso pero útil): el sensor mide la muñeca, no el varillaje → un brazo blando puede dar MOA "de élite" falsos (su experimento: 1,2 MOA con dispersión real grande); la correa de suelta índex deforma la lectura del giroscopio (recomienda reloj alto en el antebrazo); los datos solo valen con alineación esquelética correcta.
- **Lo que alaban**: concepto único, feedback instantáneo flecha a flecha, MOA comparable con impactos, biometría integrada, contador automático. **Lo que critican**: exclusividad fēnix 9 (999+ USD), solo compuesto, features "limitadas" según algún usuario de Facebook ⚠️.

---

## 7. Patentes y notas técnicas

- **No encontré patente pública específica de ArcheryX** (detección de suelta por muñeca/traza) a fecha 17/09/2026. El buscador general agotó cuota y Google Patents no renderizó resultados sin JS; la búsqueda en FreePatentsOnline con "garmin archery shot" devolvió 31 resultados **sin assignee visible** 🔒 (https://www.freepatentsonline.com/result.html?query_txt=garmin+archery+shot&submit=&patents=on): los relevantes por título son la familia *"Targeting system"* (US 11,022,403, US 11,898,820, US 10,670,372, US 11,859,947, US 2019/0101357, US 2021/0262760…) y *"Positioning device for alignment of archery sight"* (US 10,184,757; WO 2019/010168 A1), compatibles con las miras Xero de Garmin, **pero el assignee no pudo confirmarse en la página de resultados**. ⚠️
- **Nota técnica del mecanismo** (lo reconstruible):
  - Sensores: acelerómetro + giroscopio de muñeca siguiendo el brazo del arco durante todo el ciclo 📰 (the5krunner, 25/08/2026).
  - Detección automática de cada flecha 🔒/📰 (Google Play: "Receive shooting session information from the device"; Hoyt: "automatically detects each arrow").
  - Calibración por arco con "tiro de calibración" 🔒 (manual) — análogo al cero/zero de los cronógrafos.
  - Estabilidad cuantificada como **desviación angular (MOA)** por tiro 🔒 (PR).
  - La marca de suelta es un evento detectable: impulso hacia delante de la muñeca al partir la suelta ⚠️ (Smart Snout) — coincide con cómo detectamos nosotros el pico de aceleración en ArcheryWatch.
  - Sin documento técnico/patente público que describa el algoritmo de segmentación o el dibujado del Aim Path. ⚠️

---

## 8. Hechos verificados vs. marketing (síntesis)

| Afirmación | Estado |
|---|---|
| ArcheryX existe, es perfil nativo de fēnix 9/9 Pro, lanzado 25/08/2026 | 🔒 Hecho (PR Garmin + manual oficial) |
| Mide estabilidad en MOA por tiro, tiempo apertura→suelta, contador, FC/respiración/estrés | 🔒 Hecho funcional (PR; el dato real dependerá del sensor de muñeca) |
| Traza con reproducción animada inmediata y Aim Path/Float Analysis con playback en ShotView | 🔒 Hecho funcional (PR + Google Play) |
| Calibración por arco (tiro de calibración), Delete Last Shot, Type indoor/outdoor | 🔒 Hecho (manual v1) |
| Exclusivo de fēnix 9 por ahora, sin backport anunciado | 📰 Hecho reportado (the5krunner citando a DC Rainmaker); Garmin no lo negó públicamente |
| "First-of-its-kind" | 📣 Marketing (verdadero respecto a perfiles nativos de relojes deportivos grandes, pero hay apps CIQ de terceros y productos como MantisX desde años antes) |
| Vínculo con cronógrafos Xero para velocidad de flecha | ⚠️ No confirmado a nivel de integración directa; solo comparten la app ShotView (Google Play) |
| Detalles visuales finos de la traza (punto rojo, patrones, ejes) | ⚠️ No verificados (fuente única de dudosa fiabilidad, coherente con la física) |
| Mejora real de la precisión del arquero | 📣 Marketing / no medido públicamente |

---

## 9. Comparación implícita con ArcheryWatch (app CIQ en muñeca + BLE → Android)

**Qué ArcheryX hace que ArcheryWatch ya puede replicar (mismo hardware: acelerómetro/gyro de muñeca):**
1. Detección de suelta y segmentación del ciclo (apertura→apunte→suelta→follow-through) — idéntica base sensorial; Garmin no usa (según las fuentes) nada que el FR165 no tenga.
2. MOA por tiro: es matemática sobre la señal de la muñeca (desviación angular estimada); replicable en nuestro firmware/app.
3. Traza + playback animado flecha a flecha: es render de la serie temporal 2D/3D; 100 % replicable — y mejorable.
4. Contador por sesión y agregados día/semana/mes/año: trivial en nuestra app Android.
5. Calibración por arco (tiro de calibración guiado) y borrado del último tiro: ya lo tenemos en el roadmap; el manual confirma que Garmin también lo necesita (es decir, **su detección también es imperfecta sin calibrar**).
6. Pantallas post-tiro en el reloj con mini-gráfica e info de apuntado, y guardado por sesiones comparables.
7. Métricas con nombres de mercado: Aim Time, S.E.T., Aim Radius, Break Radius, Break Diameter.
8. Cards de sesión, listas de tiros, filtrado indoor/outdoor, edición/agrupación, notas, export CSV (herencia Xero de ShotView).
9. Biometría de sesión (FC como mínimo en FR165; respiración/estrés Garmin los deriva de FC/HRV).

**Qué depende del hardware/ecosistema fēnix (no replicable en FR165 por ahora):**
1. Animación nativa fluida en pantalla AMOLED grande del fēnix 9 con CPU nueva (el fēnix 9 presume de 50 % más RAM y procesador Pro 📰); en FR165 habrá que ser conservador con el canvas del reloj.
2. Respiración/estrés "oficiales" de Garmin si quisiéramos cifras idénticas (dependen de sus algoritmos Firstbeat; nosotros podemos aproximar por HRV).
3. Ecosistema: sincronización automática vía Garmin Connect + app con backup en nube (nosotros ya jugamos con ventaja: **BLE directo = traza en el teléfono en tiempo real**, Garmin pasa por Garmin Connect, asincrónico).
4. Marca/fiat: Garmin entra con Hoyt y Lancaster vendiendo el reloj.

**Ventajas estructurales nuestras:** mercado entero no-fēnix-9 (Forerunner/Instinct/Venu + archers con Android) sin competencia oficial; latencia cero BLE; trazado coloreado por fase (Garmin, por lo que se ve, NO colorea por fase — su traza parece monocolor con punto rojo de suelta); diana con impactos y replay; pulso/RR y brújula integrados por flecha.

---

## 10. Implicaciones para ArcheryWatch (accionables, priorizadas)

1. **Replay animado de la traza como función estrella (máxima prioridad).** Garmin promociona exactamente eso: traza *"immediately after each shot, along with animated playback"* (PR) y *"aim path visualization/playback"* (Google Play). En el visor Android: al recibir la flecha por BLE, animar el trazo de apertura→suelta→follow-through en ~1,5–2 s con un cursor luminoso, no dibujar la curva estática de golpe.
2. **Marca visual del punto de suelta.** Punto distintivo (Garmin parece usar un punto rojo ⚠️) + destello/ripple en la animación al cruzar el instante de suelta; el usuario debe poder ver dónde "muere" el apunte en cada replay.
3. **Botón de replay por flecha y por set**, con scrubber manual (arrastre temporal). Garmin solo anuncia "playback"; un scrubber frame-a-frame es mejora fácil y visible.
4. **Escala en MOA con doble modo.** Ofrecer "escala MOA fija" (misma escala entre flechas/sets para comparar de un vistazo) y "auto-zoom al último 0,5 s" (los últimos instantes son los que importan ⚠️ Smart Snout). Etiquetar los ejes con valores MOA reales.
5. **Métricas con la nomenclatura que el mercado está aprendiendo de Garmin/Hoyt:** Aim Time, Shot Execution Time, Aim Radius, Break Radius, Break Diameter, MOA deviation. Mantener nuestra estabilidad 0-100 como índice extra, pero mostrar MOA al lado para comparabilidad mental.
6. **Float Analysis propia:** gráfica de flotación con nube de apunte (elipse de 1-2σ por eje, tendencia central durante la retención, deriva por tramos). Es una gráfica oficial de ShotView 🔒 y encaja con nuestra traza por fases.
7. **Diagnóstico por ejes con color/leyenda:** separar componente horizontal (agarre) y vertical (tensión/desmultiplicación) en la traza y en un mini-panel "H vs V" por flecha; sugerir causa (agarre, core, anclaje) como texto accionable.
8. **Colorear por fase (ya lo hacemos) y presumir de ello.** Ninguna fuente describe trazado por fases en Garmin (monocolor + punto de suelta). Nuestra leyenda apertura/apunte/suelta/follow-through es diferenciación real: hacerla visible en la primera pantalla, con toggle por fase en el replay.
9. **Post-tiro en el reloj a lo Garmin:** tras cada suelta, panel deslizable en el FR165 con mini-traza + MOA + tiempo; hold de botón = "borrar último tiro" (paridad exacta con Delete Last Shot 🔒 del manual) y save de sesión con resumen.
10. **Calibración por arco guiada con "tiro de calibración"** (paridad con Record Calibration Shot 🔒) almacenada por perfil de arco, y aviso automático si cambias de perfil ("este arco no está calibrado").
11. **Cards de sesión con thumbnail de la traza** en la lista de sesiones Android + listas de tiro con filtrado indoor/outdoor y edición/agrupación por ends de 3/6 (nuestros sets ya lo hacen; añadir el filtro y las cards).
12. **Agregados temporales:** totales de flechas por día/semana/mes/año (Garmin lo anuncia como headline 🔒) y tendencia de MOA/SET/estabilidad por semana; gráfica de progreso con comparación de sesiones (el manual lo anuncia para ShotView).
13. **Notas por tiro + export CSV + marcado de outliers** (herencia ShotView/Xero 🔒): barato de añadir y clave para entrenadores; incluir el impacto en diana junto a cada nota.
14. **HR "at break" por flecha:** registrar FC/RR media pre-tiro y en la ventana de suelta, mostrar "FC en la suelta" junto a cada flecha (Garmin lo exhibe ⚠️ y cuenta una historia potente contra el target panic); ya enviamos pulso/RR por BLE, solo hace falta anclarlo al evento.
15. **Ergonomía y honestidad del sensor:** guiar en la app la colocación del reloj (brazo del arco, alto en el antebrazo, fuera de la correa de suelta ⚠️) y avisar cuando la traza parezca desacoplada del movimiento real (p. ej., suave pero impacto desviado): mostrar siempre traza + impacto juntos para que el usuario calibre su confianza, que es la crítica más repetida a este tipo de métricas.

---

## Apéndice: listado completo de fuentes

**Primarias (Garmin / tiendas oficiales):**
1. PR ArcheryX — Garmin Newsroom, 25/08/2026: https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/
2. PR fēnix 9 / fēnix 9 Pro — Garmin Newsroom, 25/08/2026: https://www.garmin.com/en-US/newsroom/press-release/outdoor/garmin-expands-its-flagship-performance-smartwatch-lineup-with-fenix9-and-fenix9-pro/
3. Manual fēnix 9 Series, "Recording an ArcheryX Activity" (v1, ago-2026): https://www8.garmin.com/manuals/webhelp/GUID-708A8F4D-9A78-49CF-9528-DE109BBCC472/EN-US/GUID-95092193-D88B-41FA-8C68-8D48FD263264.html
4. Manual fēnix 9 Series, "ShotView App" (v1, ago-2026): https://www8.garmin.com/manuals/webhelp/GUID-708A8F4D-9A78-49CF-9528-DE109BBCC472/EN-US/GUID-F567A07C-1106-4060-92FC-5EB72C7945D3.html
5. Google Play — ShotView™ (Garmin International, act. 02/09/2026): https://play.google.com/store/apps/details?id=com.garmin.android.apps.shotview
6. Página oficial de la app: garmin.com/shotviewapp (referenciada por el manual; cuerpo en JS, no scrapable)

**Prensa y especialistas:**
7. the5krunner — "Garmin ArcheryX – Fenix 9's new feature Explained", 25/08/2026: https://the5krunner.com/2026/08/25/garmin-archeryx-explained/
8. the5krunner — "Fenix 9 features will pass to existing Garmin watches", 26/08/2026 (act. 01/09/2026): https://the5krunner.com/2026/08/26/fenix-9-features-will-pass-to-existing-garmin-watches/
9. Game & Fish Magazine — "Garmin ArcheryX feature", 26/08/2026: https://www.gameandfishmag.com/editorial/garmin-archeryx-feature/558322
10. The Smart Snout — "Mastering Hold Steadiness with Garmin ArcheryX & ShotView", 16/09/2026 (⚠️ fiabilidad dudosa): https://thesmartsnout.com/2026/09/16/garmin-archeryx-shotview-hold-steadiness-guide/

**Vídeo (distribuidores/fabricantes):**
11. Lancaster Archery Supply — "Garmin Fenix 9 Watch: ALL NEW Feature Just for ARCHERS", 11/09/2026: https://www.youtube.com/watch?v=zNb1_3odGcM
12. Hoyt Archery — "Your Shot Is Telling You Something—ArcheryX Helps You See It", 14/09/2026: https://m.youtube.com/watch?v=ppLQIkdZbbI

**Comunidades (acceso limitado):**
13. Reddit r/the5krunner — hilo sobre ArcheryX (contenido no accesible, 403): https://www.reddit.com/r/the5krunner/comments/1vyrytc/garmin_archeryx_fenix_9s_new_feature_explained/
14. Reddit r/Garmin — "Archery as exercise?" (contexto pre-ArcheryX): https://www.reddit.com/r/Garmin/comments/cz910r/archery_as_exercise/
15. Reddit r/Archery — "Smart or fitness watches for archery?" (contexto pre-ArcheryX): https://www.reddit.com/r/Archery/comments/1506i0q/smart_or_fitness_watches_for_archery/

**Patentes (sin confirmación de assignee):**
16. FreePatentsOnline — búsqueda "garmin archery shot": https://www.freepatentsonline.com/result.html?query_txt=garmin+archery+shot&submit=&patents=on
