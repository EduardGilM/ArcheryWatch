# Mantis / MantisX aplicado a arquería — investigación de competencia

Investigación: 17 de septiembre de 2026. Fuentes primarias (mantisx.com, mantisarchery.com, train.mantisx.com, tiendas de apps, Amazon, Bow International, AllOutdoor, ArcheryTalk, Reddit vía snippets de buscador) consultadas ese día mediante fetch directo. Complementa a `docs/competencia-arqueria.md` (sección Mantis X8), que resume el mismo competidor desde la óptica general.

**Limitaciones de método, declaradas arriba para no olvidarlas:**
- El buscador integrado agotó cuota a mitad de sesión; el resto se hizo con fetch directo de URLs conocidas y Brave Search (que también acabó limitando). Las opiniones de Reddit se citan de snippets de resultados de búsqueda, no de la lectura completa de los hilos (Reddit bloquea el fetch anónimo).
- No he probado físicamente el Mantis X8 ni la app: lo que sigue son declaraciones del fabricante (marketing incluido), especificaciones de tiendas y testimonios de usuarios. Marco cada afirmación con su naturaleza.
- En español casi no hay fuentes primarias sobre Mantis; el mercado de opinión de este producto es anglosajón. Solo se localizó listado en español del competidor BOWdometer (Hattila).

---

## TL;DR para decisión de producto

Mantis X8 (149,99 $) es un sensor de movimiento que se atornilla/pega al riser y envía por BLE la traza del tiro a una app gratuita (sin suscripción). Su app es la referencia del sector en **lectura por fases con colores, score de estabilidad 0–100 y comparación de consistencia entre tiros**, y lleva 6 años madurándola. Sus debilidades documentadas por usuarios: el score no correlaciona con el resultado real de la flecha, no exporta datos, no explica el "por qué" de los errores (los usuarios lo piden explícitamente), detección de suelta con pocos puntos de datos, falsas detecciones y software de arquería con actualizaciones irregulares. Exige montar hardware en el arco (pegatina/rail, 10 $ por adaptador extra), lo cual no es gratis ni en esfuerzo ni en psicología del tiro. Todo eso es el espacio donde ArcheryWatch ya juega: cero hardware añadido, reloj que el arquero ya lleva, y sesión en vivo en el móvil.

---

## 1. Mantis X8: hardware

| Aspecto | Dato | Naturaleza | Fuente |
|---|---|---|---|
| Precio oficial | **149,99 $** (modelo MT-1008) | Hecho (página de venta) | [mantisarchery.com/products/mantis-x8](https://mantisarchery.com/products/mantis-x8), consultado 2026-09-17 |
| Precio de lanzamiento | 149 $ ("I expected it to cost way more than $149") | Testimonio de foro, ene 2020 | [ArcheryTalk, "Mantis X8 Shot Trainer"](https://www.archerytalk.com/threads/mantis-x8-shot-trainer.5820353/) |
| Disponibilidad | Agotado en la web oficial ("Notify me when available") a 2026-09-17 | Hecho observable | [mantisarchery.com/products/mantis-x8](https://mantisarchery.com/products/mantis-x8) |
| Montaje | Al riser: "Most shooters put it on the side of the riser"; también sobre la ventana de mira o el estabilizador mediante adaptadores | Hecho (fabricante) | [mantisarchery.com/pages/how-it-works](https://mantisarchery.com/pages/how-it-works) |
| En la práctica | Revisor de Bow International lo montó "just above the clicker" en un Hoyt GMX con pegatina 3M; requiere nivelar y aplomar respecto al riser | Review, 2020-09-14 | [Bow International](https://www.bow-international.com/reviews/mantis-x8-shooting-analysis-system-review/) y [Gear Report](https://gear-report.com/mantis-x10-elite-review-an-archery-perspective/) (2020-04-10) |
| En caja | Sensor + adaptador Universal + adaptador de rail de mira + cable USB + funda rígida con foam + guía rápida | Hecho (listado) | [Amazon B082LSYJHJ](https://www.amazon.com/Mantis-X8-Archery-Shooting-Analysis/dp/B082LSYJHJ), consultado 2026-09-17 |
| Adaptadores extra | 10 $/ud (Universal o Sight Rail); packs 5×40 $, 10×75 $. El de mira va "a los agujeros de rosca de la mira" con 2 tornillos | Hecho (catálogo) | [mantisarchery.com/collections/all](https://mantisarchery.com/collections/all) y [mantisx.com/products/archery-sight-rail-adapter](https://mantisx.com/products/archery-sight-rail-adapter) |
| Peso | ~0,4 oz (≈11 g) el sensor sin rail, pesado por el revisor; el paquete Amazon declara 0,18 kg | Review + listado | [AllOutdoor, 2021-11-09](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/) y [Amazon](https://www.amazon.com/Mantis-X8-Archery-Shooting-Analysis/dp/B082LSYJHJ) |
| Conectividad | Bluetooth Low Energy ("BLE o Bluetooth 4.0"); el emparejado se gestiona desde la app, no desde ajustes del teléfono | Hecho (fabricante) | [how-it-works](https://mantisarchery.com/pages/how-it-works) y [train.mantisx.com/instructions](https://train.mantisx.com/instructions/) |
| Batería | Li-po recargable por micro USB; "carga completa en 2 horas, al menos 12 horas de uso continuo" (doc oficial, wording de armas; mismo sensor). Usuarios reportan ~20 h de uso real; Gear Report declara 20 h para el X10 | Hecho oficial + testimonios | [train.mantisx.com/instructions](https://train.mantisx.com/instructions/), [ArcheryTalk 2020](https://www.archerytalk.com/threads/mantis-x8-shot-trainer.5820353/), [Gear Report](https://gear-report.com/mantis-x10-elite-review-an-archery-perspective/) |
| Impermeabilidad | "definitely not water proof" (dicho por un representante de Mantis al revisor) | Review | [AllOutdoor, 2021-11-09](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/) |
| Sensores | "accelerometer, gyroscope, and magnetometer" (sin modelo ni frecuencia publicados por Mantis; solo dicen "smart sensor") | Review técnica + doc oficial | [AllOutdoor](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/) y [train.mantisx.com/instructions](https://train.mantisx.com/instructions/) |
| Compatibilidad de arcos | "Attach the smart sensor to any longbow, compound bow, or recurve bow" (Amazon); "compound, recurve, and even crossbows", con modo conmutable (web oficial); barebow verificado en la review de Jake Kaminski | Marketing + listado + video | [Amazon](https://www.amazon.com/Mantis-X8-Archery-Shooting-Analysis/dp/B082LSYJHJ), [mantisx.com/pages/mantisx-for-archery](https://mantisx.com/pages/mantisx-for-archery), [YouTube, Jake Kaminski, ~ago 2021](https://www.youtube.com/watch?v=OxHk8ZWbw_E) |
| Garantía / origen | 2 años de garantía; "made in USA"; fabricante Mantis Tech LLC (Oswego, Illinois) | Listado + ficha de tienda | [Amazon](https://www.amazon.com/Mantis-X8-Archery-Shooting-Analysis/dp/B082LSYJHJ) y [Google Play](https://play.google.com/store/apps/details?id=com.roberts.croberts.mantis.archery&hl=en_US) |
| Apps | iOS 13+ (194,6 MB, v1.7.17) y Android (10K+ descargas, actualizada 2025-11-12) | Hecho (tiendas) | [App Store id1491050891](https://apps.apple.com/us/app/mantisx-archery/id1491050891) y [Google Play](https://play.google.com/store/apps/details?id=com.roberts.croberts.mantis.archery&hl=en_US) |

Nota de familia de producto: el X8 es la unidad "solo arquería". El X10 Elite (249 $ MSRP, 2020) añade las funciones de armas de fuego y también soporta arco; para arquería la app es la misma. Reddit (2025): el X8 es "a slightly smaller subset of what the X10 does, but at MSRP $100 less", y el X10 "only adds functionality for firearms". [Gear Report](https://gear-report.com/mantis-x10-elite-review-an-archery-perspective/), [Reddit r/Archery, 2025-10-20](https://www.reddit.com/r/Archery/comments/1obrg9v/mantis_x8_vs_mantis_x10/), [blog oficial de Mantis, 2024-02-21](https://mantisx.com/blogs/news/which-mantisx-product-is-right-for-you).

---

## 2. App MantisX Archery: funciones completas

La app es gratuita; el sensor es el producto. Descripción oficial: "The internal electronics of the MantisX Sensor collect movement data before, during, and after your shot... The app analyzes the data and diagnoses your shooting mechanics." ([App Store](https://apps.apple.com/us/app/mantisx-archery/id1491050891), [Google Play](https://play.google.com/store/apps/details?id=com.roberts.croberts.mantis.archery&hl=en_US))

### 2.1 Traza del tiro por fases (la funcionalidad estrella)

La traza dibuja el movimiento del arco en el plano de la diana, con código de color por fase. Leyenda literal de la web oficial ([mantisx.com/pages/mantisx-for-archery](https://mantisx.com/pages/mantisx-for-archery), consultado 2026-09-17):

| Color | Fase oficial |
|---|---|
| Azul | "upward movement during the setup/draw" (subida durante montaje/apertura) |
| Verde | "downward movement during the setup/draw" (bajada) |
| Amarillo | "as you approach the center of the target" (aproximación al centro) |
| Naranja | hold antes de la suelta — "This is the section Mantis X8 will score you on" |
| X blanca | instante de la suelta |
| Línea blanca | desde la suelta "until the arrow clears the bow" |
| X roja | cuando la flecha abandona el arco ("arrow departure") |
| Rojo | movimiento post-tiro (follow-through) |

Hecho equiparable a lo que ArcheryWatch pinta por fases (apertura→apunte→suelta→follow-through). Navegación: pestañas inferiores para "study the setup, hold, release, or your full shot process"; pestañas superiores para "the pitch and cant of the bow, times for each part of the shots, and arrow placement" (misma fuente).

En la review de Bow International (2020): la app registra el movimiento "covering setup, release and follow through", colorea las fases, muestra el cant en pantalla aparte, y "shows the gap between the shot's break and arrow departure to check continued expansion through release" — la separación entre ruptura del disparador y salida de flecha se usa para verificar la expansión durante la suelta. [Fuente](https://www.bow-international.com/reviews/mantis-x8-shooting-analysis-system-review/).

### 2.2 Score de estabilidad 0–100

- Oficial: "The stability of your hold is quantified and scored (0-100)... adjusting setup or mechanics shows the instant impact". ([how-it-works](https://mantisarchery.com/pages/how-it-works)) — **No publican el algoritmo**.
- Dato incómodo de foro (2023): un usuario contrastó el score medio con el valor real de las flechas: 94,7 de media en "blues" vs 94,5 en "golds" — "Stability score has no bearing on actual arrow value". Y según ese mismo hilo, incluso el personal de Mantis discrepaba internamente sobre cómo se calcula. [ArcheryTalk, "Mantis 8 for Archery", ~nov 2023](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/).
- Caso de uso real que sí funciona: elegir estabilizador. "LearningDad" comprobó que la estabilidad "empirically improved with a stabilizer" y las puntuaciones en diana siguieron; en Reddit (2025) lo repiten: "great for testing stabilizer weights". [ArcheryTalk 2023](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/), [Reddit r/Archery 2025-10-20](https://www.reddit.com/r/Archery/comments/1obrg9v/mantis_x8_vs_mantis_x10/).

### 2.3 Comparación entre tiros, historial y demás

Funciones verificadas con fuente:

- **Comparación de consistencia**: "View each phase of each shot in comparison to all the others... Analyze consistency, find outliers, and understand why" ([how-it-works](https://mantisarchery.com/pages/how-it-works)). Gear Report lo llama "Shot History Overlay": superpone tiros para ver repetición por fase ([fuente, 2020](https://gear-report.com/mantis-x10-elite-review-an-archery-perspective/)). PERO un usuario de 2023 se queja de que comparar exige malabarear tres pantallas y que no hay exportación de datos ("no data export exists") ([ArcheryTalk](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)).
- **Shot timing**: "times your whole shot process" con gráfica de barras; "Yet another indicator of consistency and outlier analysis" ([AllOutdoor 2021](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/), [how-it-works](https://mantisarchery.com/pages/how-it-works)).
- **Cant (inclinación)**: registro por tiro en pantalla separada ([Bow International 2020](https://www.bow-international.com/reviews/mantis-x8-shooting-analysis-system-review/)); vendido como "Stability score + cant" ([how-it-works](https://mantisarchery.com/pages/how-it-works)).
- **Diagnóstico de error**: el blog oficial (2024) describe que la app te dice "what some potential errors could be based on where you pulled your bow" ([fuente](https://mantisx.com/blogs/news/which-mantisx-product-is-right-for-you)). Marketing contrario: en 2020 dos fuentes independientes coinciden en que NO daba consejos: "the archery app does not currently give tips on how to improve certain flaws" ([Gear Report](https://gear-report.com/mantis-x10-elite-review-an-archery-perspective/)); en Reddit (2021) la respuesta top a un principiante: "it will show you what you are doing, but not why or how to fix it" ([r/Archery, 2021-08-03](https://www.reddit.com/r/Archery/comments/owttbz/is_mantis_x8_good_for_beginners/)).
- **Diana/biblioteca de objetivos**: overlay de diana para registrar impactos, con biblioteca NFAA, IBO, ASA y World Archery; distancias en metros o yardas; la traza puede anclarse a la suelta o a la salida de flecha ([AllOutdoor 2021](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/), [Google Play "What's new"](https://play.google.com/store/apps/details?id=com.roberts.croberts.mantis.archery&hl=en_US)). Queja de usabilidad: registrar impactos es "a big pain" ([Amazon, review de zeth1560](https://www.amazon.com/Mantis-X8-Archery-Shooting-Analysis/dp/B082LSYJHJ)). Y "the trace in no way line up with the target" ([ArcheryTalk 2023](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)).
- **Sesiones e historial**: en 2021, 36 tiros por sesión ([AllOutdoor](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/)); el límite de flechas se subió después a 72 y luego a 100, con filtros de historial ([App Store, historial de versiones 1.5–1.7](https://apps.apple.com/us/app/mantisx-archery/id1491050891)). "History: a full record of your improvement" ([how-it-works](https://mantisarchery.com/pages/how-it-works)).
- **Grupos sociales**: "create or join groups within the app to work with training partners towards shared goals" o competición amistosa ([mantisx-for-archery](https://mantisx.com/pages/mantisx-for-archery)); "Groups: track, follow, train together" ([how-it-works](https://mantisarchery.com/pages/how-it-works)).
- **Feedback de voz** con el score de cada tiro ([Amazon, review de Travis Hoag](https://www.amazon.com/Mantis-X8-Archery-Shooting-Analysis/dp/B082LSYJHJ)).
- **Perfil de equipo**: recurve/compound, longitudes/pesos de estabilizador, largo de D-loop, holding weight, altura de peep — pensado para comparar configuraciones sin sesgo ([AllOutdoor 2021](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/)).
- **Multi-arquero/entrenador**: índice de sub-usuarios para catalogar datos de varios alumnos ([AllOutdoor 2021](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/)).
- **Troubleshooter de detección**: "Troubleshooter will detect and notify shot failures due to incorrect settings" (App Store, v1.5.07–09); la doc oficial remite a "Settings → Not Detecting Shots" ([App Store](https://apps.apple.com/us/app/mantisx-archery/id1491050891), [train.mantisx.com/instructions](https://train.mantisx.com/instructions/)).
- **Drills guiados**: en la app de arquería NO hay un catálogo de drills comparable al de la línea de armas (donde el X10 tiene Holster-Draw o RecoilMeter). El "drill" de facto es el análisis por fases + timing + comparación. La comparativa oficial de modelos no atribuye drills de arquería al X8 ([mantisx.com blog, 2024-02-21](https://mantisx.com/blogs/news/which-mantisx-product-is-right-for-you)).
- **Ritmo de actualización**: promesa oficial "significant app updates every 4-8 weeks" ([how-it-works](https://mantisarchery.com/pages/how-it-works)); Bow International (2020) ya lo recogía. Contraste con la queja de 2023 de que la parte archery era "dead software with no more updates" ([ArcheryTalk](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)) — la tienda muestra una actualización Android en 2025-11-12, así que sigue viva pero lenta ([Google Play](https://play.google.com/store/apps/details?id=com.roberts.croberts.mantis.archery&hl=en_US)).
- **Exportación**: no existe exportación de datos según usuarios de 2023 ([ArcheryTalk](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)); tanto es así que un usuario (ELSAArcher) se escribió software propio para extraer la traza cruda (~400 puntos/s) del portal web vía DevTools (misma fuente). Mantis sí ofrece cuenta web (train.mantisx.com) orientada, por admisión de la propia empresa, a tiradores de arma corta/larga.

---

## 3. Modelo de negocio

- **Hardware como único ingreso relevante**: X8 a 149,99 $ ([web oficial](https://mantisarchery.com/products/mantis-x8)); adaptadores a 10 $ ([catálogo](https://mantisarchery.com/collections/all)). Gama completa del fabricante ~100–320 $ según modelo ([Reddit r/MantisX, vía snippet de buscador](https://www.reddit.com/r/MantisX/comments/1k3nc6i/what_exactly_is_required/)).
- **Sin suscripción en arquería**: el listado de Amazon (consultado 2026-09-17) declara "Free app with lifetime access, no subscription". El marketing de la línea lo repite: "Free App – Lifetime Access, No Subscription Needed" y "no subscription fees" ([mantisx.com/products/mantis-x3](https://mantisx.com/products/mantis-x3), [mantisx.com/products/mantis-x10-elite](https://mantisx.com/products/mantis-x10-elite)). Mantis critica públicamente a su competidor de armas Strikeman por cobrar "9,99 $/mes o 79,99 $/año" ([página comparativa](https://mantisx.com/pages/laser-academy-vs-strikeman)).
- **Las tiendas no listan compras integradas** para MantisX - Archery ([App Store](https://apps.apple.com/us/app/mantisx-archery/id1491050891): "no IAP items or prices appear"; [Google Play](https://play.google.com/store/apps/details?id=com.roberts.croberts.mantis.archery&hl=en_US): sin sección IAP). Los desbloqueos de drills a 4,99 $ que aparecen en la web de Mantis pertenecen a Laser Academy (línea de armas), no a la app de arquería ([página Academy White V3](https://mantisx.com/pages/academy-white-v3)).
- **Freemium real**: no hay — gratis completo + hardware obligatorio. El coste de entrada son ~150 $ y la fricción de montar el sensor.
- Lectura para ArcheryWatch: Mantis ha blindado el "no subscription" como argumento de venta desde hace años; un precio único o free-with-hardware ya lo tienes ganado al no necesitar hardware. Cuidado con proponer suscripción agresiva: el propio sector (Strikeman) usa el "no subscription" como ataque competitivo.

---

## 4. Recepción: reviews, foros, Reddit, Amazon, YouTube

### 4.1 Prensa especializada

- **Bow International (2020-09-14)**, positiva con matices: "clearly well-developed, classily small and packaged, and relatively inexpensive in the archery scheme of things"; "the first I've tried that feels like a 'real' app rather than a home-brew job"; potential "complete digital self-coaching system". Contras: "you really need to have a strong basic execution" (no para principiantes), puede distraer como cualquier app, sin manual de papel. Veredicto: para el arquero que "likes to reflect and analyse" puede ser "more transformative than you can imagine". [Fuente](https://www.bow-international.com/reviews/mantis-x8-shooting-analysis-system-review/).
- **AllOutdoor (2021-11-09)**, muy positiva: "an extremely powerful training tool"; al autor le ayudó a diagnosticar target panic y a comparar configuraciones; útil para entrenar con varios alumnos. Contras: no impermeable (problema en 3D), ASA lo prohíbe en competición porque no se permiten teléfonos (IBO sí lo permite), y recogía falsos tiros al armar la ballesta. [Fuente](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/).
- **Gear Report (2020-04-10, X10 desde óptica archery)**: 4,5/5, "excellent training tool for those at all levels"; critica que el rail se cobre aparte (10 $) en un paquete de 249 $ y que la app no diera consejos de mejora. [Fuente](https://gear-report.com/mantis-x10-elite-review-an-archery-perspective/).
- **American Hunter** (citado en la página de reviews de Mantis): la app "draws a trace of the bow movement through the entire shooting process, mapping the phases of each shot" siguiendo el National Training System de USA Archery. Marketing seleccionado por el fabricante, pero confirma el posicionamiento NTS. [mantisarchery.com/pages/reviews](https://mantisarchery.com/pages/reviews).

### 4.2 Amazon (4,1/5 sobre 29 valoraciones, consultado 2026-09-17)

- Aman: "it gives a lot of informational feedback on every aspect of the shot" (Kim C); "The app is super straight forward and easy to use" (Travis Hoag); "Instant feedback for when you don't have anyone to coach" (GreyMedic); "very easy to install on my bow" (zeth1560). [Fuente](https://www.amazon.com/Mantis-X8-Archery-Shooting-Analysis/dp/B082LSYJHJ).
- Critican: "it was missing about 25% of my shots" (Alive and Well, 3★); no explica cómo corregir, "not sure i would buy it again" (BuckeyeGuy); "it hasn't been able to record a single shot. Technical support won't get back to me" (alex d., 1★); registrar impactos es "a big pain" (zeth1560); "does not keep score" de la diana (Kim C). [Fuente](https://www.amazon.com/Mantis-X8-Archery-Shooting-Analysis/dp/B082LSYJHJ).

### 4.3 Reddit (snippets de buscador; no se pudo leer el hilo completo)

- r/Archery "Mantis X8 opinions" (2021-04-29): "The most useful information it provides is how steady I am holding when aiming and releasing"; valor claro para tuning de estabilizadores; varios usuarios recomiendan que 2–3 clases con entrenador rinden más que el aparato para la mayoría. [Hilo](https://www.reddit.com/r/Archery/comments/n1d1yv/mantis_x8_opinions/).
- "Is Mantis X8 good for beginners?" (2021-08-03): respuesta top: "it will show you what you are doing, but not why or how to fix it". [Hilo](https://www.reddit.com/r/Archery/comments/owttbz/is_mantis_x8_good_for_beginners/).
- "Mantis Training" (2023-05-20): opiniones divididas, de "largely a gimmick" a quien lo disfruta para torque de mano, timing y patrón de apuntado. [Hilo](https://www.reddit.com/r/Archery/comments/13mwds3/mantis_training/).
- "Mantix x8" (2024-08-09): lo citan para diagnosticar inconsistencias, balance de estabilizadores y torque de grip; aparece uno vendiendo el suyo. [Hilo](https://www.reddit.com/r/Archery/comments/1enuog1/mantix_x8/).
- "Mantis X8 first use, Loving it!" (2021-03-14): entusiasmo inicial típico. [Hilo](https://www.reddit.com/r/Archery/comments/m50b6x/mantis_x8_first_use_loving_it/).
- Comunidad custom: un entrenador Level 3 de USA Archery fabricó un adaptador para montar el X8 en la pestaña (mano de cuerda) y monitorizar el movimiento de la mano de apertura además del arco — señal de demanda de datos del lado de la suelta que el montaje en riser no cubre. [r/MantisX, 2023-12-24](https://www.reddit.com/r/MantisX/comments/18pxc3c/mantis_x8_archery_adapted_to_the_draw_hand_tab/).

### 4.4 ArcheryTalk (los hilos más técnicos)

Hilo 2020 ("Mantis X8 Shot Trainer", [fuente](https://www.archerytalk.com/threads/mantis-x8-shot-trainer.5820353/)):
- Positivo: "It does exactly what they say it does" (Guinnessguy); "Incredible little device" (AnAverageJack); a un recurvista le encantó porque "forces me to work on my shot cycle consistency" y sirve para balance de estabilizadores (Piasecznik).
- Escéptico célebre (Helic): "It can not, and will not give you a higher score... You can get a high 'hold score' and make a horrifying shot placement... Its a fun toy to play with. Its not going to change archery".
- Técnica: sensible a fallos del brazo de arco, poco a fallos de mano de cuerda y suelta; sin almacenamiento en el dispositivo (todo BLE→app); ~20 h de batería; un sensor puede compartirse entre varios teléfonos (ideal para club).
- Pregunta de madurez del producto (Tipe, 2020): ¿quién no lo ha mandado "to the drawer after first hype"?

Hilo 2023 ("Mantis 8 for Archery", [fuente](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)):
- La traza funciona y es sensible montado "near the pressure button, top of the riser, or on the sight bar".
- Pero: score sin correlación con valor de flecha; detección de suelta con solo "1–3 data points"; las dos X no se detectan con precisión; falsos tiros si el estabilizador toca el trípode; un riser desnudo puntúa solo ~10 puntos por debajo de un setup completo de estabilizadores (poca discriminación); el portal web está pensado para armas; soporte incapaz de explicar qué significan algunas métricas; un tirador GB profesional lo calificó de "not a training tool", útil solo para verificar si cambios de equipo/forma afectan a la estabilidad del hold.
- En positivo: portabilidad frente a un rig DIY de Arduino+portátil, y detección de "holding time, canting, bow movement at release".

### 4.5 YouTube

- Jake Kaminski (olímpico): "Mantis X-8 Review | Shooting Barebow and Recurve Archery with Technology!" (~ago 2021). [Fuente](https://www.youtube.com/watch?v=OxHk8ZWbw_E).
- "CRAZY TECH FOR ARCHERY! Mantis X8 – The Good & Bad" — review equilibrada de pros y contras. [Fuente](https://www.youtube.com/watch?v=JdRo-_cmCGs).

### 4.6 Patrones claros (síntesis propia de lo anterior)

Aman: ver el invisible (estabilidad del hold), feedback instantáneo sin entrenador, comparar equipos con datos, historia de progreso. Critican: precio de entrada, montaje (pegatina/rail, nivelación), falsas detecciones y tiros perdidos, score opaco y sin relación con la puntuación real, ausencia de "cómo lo arreglo", falta de exportación, y el cajón tras la novedad.

---

## 5. Documentación técnica: detección de suelta y "arrow departure"

- **Qué dice el fabricante (única fuente oficial)**: el sensor "collect movement data before, during, and after your shot"; el modo (compound/recurve/crossbow) es seleccionable y Mantis advierte que los algoritmos de tracking son distintos por tipo de disparo — en la doc de la línea: "tracking algorithms are different for each type of shooting, so make sure you select the correct setting" ([App Store](https://apps.apple.com/us/app/mantisx-archery/id1491050891), [mantisx-for-archery](https://mantisx.com/pages/mantisx-for-archery), [train.mantisx.com/instructions](https://train.mantisx.com/instructions/)).
- **Sensores**: acelerómetro + giroscopio + magnetómetro según la review de AllOutdoor; Mantis no publica modelo de IMU, rangos ni frecuencia. "Smart sensor" es todo lo oficial. ([AllOutdoor](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/), [train.mantisx.com](https://train.mantisx.com/instructions/))
- **Frecuencia de muestreo**: no publicada por Mantis para el X8; el dato de referencia de la comunidad es ~400 puntos/s, citado por un usuario que extrajo traza cruda del portal web ("~400 points/sec — based on the specs for the X10") ([ArcheryTalk 2023](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)). A efectos de comparación, el reloj de ArcheryWatch debe muestrear por encima de eso o igualarlo en la ventana crítica; un Garmin FR165 registra acelerómetro hasta 25–52 Hz en watchapps — lo que ArcheryWatch compensa con detección de evento, no con traza continua de alta frecuencia.
- **Suelta y salida de flecha**: la app marca el break (X blanca) y el instante en que "the arrow clears the bow" (X roja), y usa el hueco entre ambos para auditar la expansión en la suelta ([mantisx-for-archery](https://mantisx.com/pages/mantisx-for-archery), [Bow International](https://www.bow-international.com/reviews/mantis-x8-shooting-analysis-system-review/)). Usuarios: la detección del break se apoya en muy pocos puntos de datos ("1–3") y no siempre precisa ([ArcheryTalk 2023](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)).
- **Calibración**: automática al conectar (doc de la línea; "the firearm on a still surface... 2-3 seconds" es el wording de armas; el principio es el mismo) ([train.mantisx.com](https://train.mantisx.com/instructions/)).
- **Sin cómputo en el sensor**: el X8 no almacena nada; es un puente BLE y toda la inteligencia vive en app/portal ([ArcheryTalk 2020](https://www.archerytalk.com/threads/mantis-x8-shot-trainer.5820353/)).
- **Detección de fallos**: el troubleshooter avisa de "shot failures due to incorrect settings" ([App Store, notas v1.5](https://apps.apple.com/us/app/mantisx-archery/id1491050891)).
- **En el changelog de la línea de armas** (misma casa, marzo 2024) aparece un parámetro público de detección: "The minimum for shot detection delay has been changed to 0.05s" — no confirmado para la app de arquería ([blog oficial](https://mantisx.com/blogs/news/free-app-updates-with-mantisx)).

---

## 6. Sensor en el arco vs. reloj en la muñeca

Argumentos del lado Mantis (por qué miden en el arco):

- El sensor en riser mide "all of the movement of that bow during all stages of your shot" — el objeto que apunta es el arco, no la mano ([mantisx-for-archery](https://mantisx.com/pages/mantisx-for-archery)).
- Detecta movimiento "that cannot be seen on a slow motion video, let alone the naked eye" ([Gear Report, 2020](https://gear-report.com/mantis-x10-elite-review-an-archery-perspective/)).
- Aun midiendo en el arco, la ubicación importa: en el estabilizador delantero provoca falsas detecciones (contacto con trípode); cerca del button, en la parte alta del riser o en la mira funciona bien ([ArcheryTalk 2023](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)). Y el montaje debe estar "both level and plumb in relation to the riser" ([Gear Report](https://gear-report.com/mantis-x10-elite-review-an-archery-perspective/)).
- Aun midiendo en el arco, la sensibilidad es asimétrica: muy sensible a fallos del brazo de arco, poco a los de mano de cuerda y suelta ([ArcheryTalk 2020, Piasecznik](https://www.archerytalk.com/threads/mantis-x8-shot-trainer.5820353/)). Incluso un bare riser vs setup completo apenas mueve el score ~10 puntos ([ArcheryTalk 2023](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)).

Implicaciones honestas para la muñeca (lo que ArcheryWatch NO puede prometer):

- La aceleración de la muñeca no es la traza del arco: la muñeca amortigua y mezcla el movimiento del brazo con el del cuerpo; cualquier "traza de apuntado" dibujada desde la muñeca es una reconstrucción, no una medición del eje del arco. (Consecuencia directa de que Mantis esconda la traza en el riser y de la queja de ArcheryTalk de que hasta su traza "in no way line up with the target": [fuente](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/).)
- Minutos de arco/estabilidad "real" del hold: Garmin ya los ofrece desde reloj en ArcheryX (actividad para fēnix 9, anunciada 2025-08-25 según `docs/competencia-arqueria.md`) — pero su manual exige calibrar por arco y llevar el reloj en la muñeca del brazo de arco. Validación pendiente en ambos casos. ([Garmin newsroom, vía docs/competencia-arqueria.md](https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/))
- No confundir el score de muñeca con resultado en diana: en el arco ya no correlaciona (94,7 vs 94,5) ([ArcheryTalk 2023](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/)); desde la muñeca la correlación será igual o peor. Presentar estabilidad 0–100 como "consistencia", no como "precisión".
- Lo que la muñeca ve y el arco no: el brazo de cuerda (si el reloj va en esa muñeca), el latch/release y la reacción corporal post-suelta. La demanda existe: un entrenador fabricó un montaje para llevar el X8 en la pestaña precisamente por eso ([r/MantisX 2023](https://www.reddit.com/r/MantisX/comments/18pxc3c/mantis_x8_archery_adapted_to_the_draw_hand_tab/)).

---

## 7. Otros competidores hardware (tabla comparativa)

| Producto | Qué es | Montaje | Métrica estrella | Precio | Modelo app | Estado/fuente |
|---|---|---|---|---|---|---|
| **Mantis X8** | Sensor IMU multi-deporte (arquería-only en esta unidad) | Riser (pegatina/rail, 2 adaptadores incluidos) | Traza por fases + score 0–100 + comparación | 149,99 $ (+10 $/adaptador extra) | Gratis, sin suscripción | Agotado en web oficial a 2026-09-17; [web](https://mantisarchery.com/products/mantis-x8) |
| **BOWdometer** (Toxon Tech, Canadá) | Sensor/contador de tiros | Bracket con velcro al costado del arco | Contador automático + índice de ejecución "Xi" 1–100 (1ª flecha=50; niveles 1–8 que aprietan sensibilidad) | 140 $ oficial; 110–130 € en UE (Hattila ES: "proporciona un recuento preciso de los disparos") | App móvil BLE | [Bow International, 2021-03-02](https://www.bow-international.com/reviews/review-bowdometer/); precios vía [snippets de tienda](https://shop.bowdometer.com) y [Hattila](https://hattila.com); críticas: Xi confuso, teléfono cerca obligatorio, poco que hacer con los datos tras sincronizar |
| **Mathews Shot Sense** | Módulo que se integra en el grip/riser de arcos Mathews 2023+ | Integrado en el arco (exclusivo Mathews) | "Shot analytics" con feedback en tiempo real; grupos y competiciones en app | No publicado | App Mathews | [mathewsinc.com/pages/shot-sense](https://www.mathewsinc.com/pages/shot-sense) |
| **SHOT IQ** (Joel Turner) | NO es hardware: cursos/sistema "Controlled Process Shooting" contra target panic | — | Metodología (surprise release, proceso mental) | Cursos de pago | — | [shotiq.com](https://shotiq.com); recepción mixta en foros: funciona, pero "science-based" es exageración ([ArcheryTalk](https://www.archerytalk.com/threads/shot-iq-does-it-work.6319586/), vía snippet) |
| **Velocitip Ballistic System** | Sensor EN la flecha (ADXL346) | Flecha | Velocidad y dinámica de vuelo, rendimiento del arco | — | — | Histórico (2011); [Electronics Weekly](https://www.electronicsweekly.com/news/products/analog/smart-arrow-uses-adi-mems-sensor-2011-12/) |
| **ArrowSpeed RADARchron** | Radar Doppler de velocidad de flecha | Delante del arco | fps | ~low-cost | — | [sportssensors.com](https://sportssensors.com/products/arrowspeed-radarchron/) |
| **Wonder Fitter** | Simulador de arquería con arco real y pantalla | Arco+app+PC | Gamificación del entrenamiento indoor | — | Propia | [coolthings.com](https://www.coolthings.com/wonder-fitter-virtual-archery-system-real-bow-and-arrow/) |
| **Garmin ArcheryX + ShotView** | Actividad de reloj (fēnix 9) — el competidor más directo de ArcheryWatch por forma factor | Muñeca | Estabilidad en minutos de arco, traza animada, contador | Incluido en reloj (~caro) | Garmin Connect | Anuncio 2025-08-25 según `docs/competencia-arqueria.md`; [newsroom Garmin](https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/) |
| **K Archery (watchface Garmin CIQ)** | Detección por acelerómetro del reloj | Muñeca | Contador/tandas automáticos + curvas por tiro | 15 € desbloqueo + suscripción Connect | Propia | [docs/competencia-arqueria.md](./competencia-arqueria.md) |
| "Arrow (sensor)" | **No localizado como producto comercial** con ese nombre; lo más cercano son Velocitip (sensor en flecha) y proyectos de flecha inteligente (UpShot AR, impacto+LED) | — | — | — | — | Búsquedas 2026-09-17; [Intertronics (caso de electrónica en flecha)](https://www.intertronics.co.uk/2021/07/case-study-putting-electronics-into-an-archery-arrow-with-novel-cas/) |

---

## 8. Implicaciones para ArcheryWatch

Qué copiar (funciona y está validado por 6 años de Mantis):

1. **Línea temporal por fases legible de un vistazo** con colores fijos por fase (Mantis: azul/verde montaje, amarillo aproximación, naranja hold, blanco suelta, rojo follow-through). Es su funcionalidad más alabada y coincide con nuestras fases apertura→apunte→suelta→follow-through. Etiquetar en la UI solo tras validar cada detector (ya lo apunta `docs/competencia-arqueria.md`).
2. **Un score simple 0–100 por tiro** ("estabilidad/consistencia"), porque el mercado ya está educado a ese número por Mantis y BOWdometer (Xi 1–100). Nombrarlo "consistencia", nunca "precisión": el propio score de Mantis no correlaciona con el valor de la flecha.
3. **Comparador entre tiros por fase**, no solo por tiro completo: "view each phase of each shot in comparison to all the others" es su claim de consistencia; nuestro comparador ya lo hace y debemos verbalizarlo así en marketing.
4. **Modo entrenador/multi-arquero** (índice de sub-usuarios de Mantis) y **grupos**: barato de implementar en Android y abre clubes.
5. **Feedback de voz** del score tras cada tiro (función amada en Amazon) — trivial en el móvil, y en el reloj con vibración+indicador.
6. **Biblioteca de dianas** (World Archery, NFAA…) y unidades m/yd como ajuste de perfil — expectativa creada por Mantis.
7. **Troubleshooter de detección** ("not detecting shots?" guiado): Mantis lo tiene y aun así reciben 1★ por tiros perdidos; nuestro equivalente debe capturar la traza cruda de la ventana sospechosa y explicarla.
8. **Perfil por arco con calibración** ya existente en ArcheryWatch — mantenerlo visible: Garmin ArcheryX también exige calibración por arco; es table stakes del sector ahora.

Qué NO prometer midiendo en muñeca:

9. **No prometer "traza real de apuntado"**: desde la muñeca es reconstrucción, no medición del eje del arco. Palabras seguras: "tendencia de movimiento", "estabilidad relativa", "consistencia entre tiros".
10. **No prometer detección del "arrow departure"**: Mantis marca break y salida de flecha con IMU en el riser y aun así los usuarios miden esa detección en 1–3 puntos de datos; desde la muñeca, menos. Si marcamos "suelta", es el instante del jolt detectado, validado con nuestra campaña de tiros etiquetados (ver `docs/deteccion-validacion.md`).
11. **No prometer mejora de puntuación en diana por el score** (argumento que usan los escépticos contra Mantis: "you can get a high hold score and make a horrifying shot placement").
12. **No prometer uso en competición**: la ASA ya prohíbe teléfonos; posicionarnos como herramienta de entrenamiento/post-sesión.

Huecos de Mantis que explotar:

13. **Cero montaje, cero fricción**: Mantis exige pegar/atornillar un sensor, nivelarlo, cargarlo (y no es impermeable; 10 $ por cada arco extra). ArcheryWatch: el reloj FR165 que el arquero ya lleva, multi-arco vía perfiles de software. Mensaje: "sin pegar nada a tu arco".
14. **Precio**: 150 $ de entrada vs una app. Y Mantis está agotado en su web (2026-09-17) — señal de demanda insatisfecha y de cadena de suministro frágil.
15. **"No subscription" es terreno ganado**: defender gratis/precio único; no repetir el error de Strikeman (9,99 $/mes) que Mantis usa como blanco.
16. **El "por qué" del error**: la queja nº 1 transversal (Amazon, Reddit, Gear Report) es que Mantis dice QUÉ pasa pero no CÓMO corregirlo ("it will show you what you are doing, but not why or how to fix it"). Un coaching accionable por fase (aunque sea heurístico y honesto) nos diferenciaría de inmediato.
17. **Exportación y datos abiertos**: Mantis no exporta y su portal está volcado a armas; un CSV/JSON de tiros + trazas (e incluso la traza cruda del jolt) es un diferenciador barato que la comunidad DIY ya intentó forzar a mano.
18. **Sesión en vivo en el móvil sin tocar el reloj**: Mantis obliga a mirar el teléfono tras cada tiro; el reloj es el mando natural (contador en muñeca, análisis en móvil) — terreno donde K Archery y Garmin ya apuntan y Mantis no puede seguirnos sin otro hardware.
19. **Métricas del lado de la cuerda**: la demanda existe (montajes caseros del X8 en la pestaña) y la muñeca la capta gratis si el reloj va en esa mano; experimentar con detección de suelta por mano de cuerda como modo alternativo.

---

## 9. Fuentes y fechas de consulta

Todas las fuentes se consultaron el 2026-09-17 salvo indicación:

- Oficiales Mantis: [X8 (venta)](https://mantisarchery.com/products/mantis-x8) · [How It Works](https://mantisarchery.com/pages/how-it-works) · [MantisX for Archery](https://mantisx.com/pages/mantisx-for-archery) · [Reviews](https://mantisarchery.com/pages/reviews) · [Catálogo/adaptadores](https://mantisarchery.com/collections/all) · [Sight Rail Adapter](https://mantisx.com/products/archery-sight-rail-adapter) · [Instrucciones (train)](https://train.mantisx.com/instructions/) · [Blog "which product" 2024-02-21](https://mantisx.com/blogs/news/which-mantisx-product-is-right-for-you) · [Blog updates 2024-03-11](https://mantisx.com/blogs/news/free-app-updates-with-mantisx) · [Comparativa Strikeman](https://mantisx.com/pages/laser-academy-vs-strikeman)
- Tiendas de apps: [App Store](https://apps.apple.com/us/app/mantisx-archery/id1491050891) · [Google Play](https://play.google.com/store/apps/details?id=com.roberts.croberts.mantis.archery&hl=en_US)
- Reviews: [Bow International 2020-09-14](https://www.bow-international.com/reviews/mantis-x8-shooting-analysis-system-review/) · [AllOutdoor 2021-11-09](https://www.alloutdoor.com/2021/11/09/alloutdoor-review-mantis-x8/) · [Gear Report 2020-04-10](https://gear-report.com/mantis-x10-elite-review-an-archery-perspective/) · [Amazon](https://www.amazon.com/Mantis-X8-Archery-Shooting-Analysis/dp/B082LSYJHJ)
- Foros/Reddit: [ArcheryTalk 2020](https://www.archerytalk.com/threads/mantis-x8-shot-trainer.5820353/) · [ArcheryTalk 2023](https://www.archerytalk.com/threads/mantis-8-for-archery.6220926/) · [r/Archery 2021 opiniones](https://www.reddit.com/r/Archery/comments/n1d1yv/mantis_x8_opinions/) · [r/Archery 2021 principiantes](https://www.reddit.com/r/Archery/comments/owttbz/is_mantis_x8_good_for_beginners/) · [r/Archery 2023 training](https://www.reddit.com/r/Archery/comments/13mwds3/mantis_training/) · [r/Archery 2025 X8 vs X10](https://www.reddit.com/r/Archery/comments/1obrg9v/mantis_x8_vs_mantis_x10/) · [r/MantisX 2023 pestaña](https://www.reddit.com/r/MantisX/comments/18pxc3c/mantis_x8_archery_adapted_to_the_draw_hand_tab/) · [r/Archery 2024](https://www.reddit.com/r/Archery/comments/1enuog1/mantix_x8/)
- Video: [Jake Kaminski, ~2021-08](https://www.youtube.com/watch?v=OxHk8ZWbw_E) · [The Good & Bad](https://www.youtube.com/watch?v=JdRo-_cmCGs)
- Competidores: [Bow International BOWdometer 2021-03-02](https://www.bow-international.com/reviews/review-bowdometer/) · [Toxon/shop](https://shop.bowdometer.com) · [Hattila (ES)](https://hattila.com) · [Mathews Shot Sense](https://www.mathewsinc.com/pages/shot-sense) · [ShotIQ](https://shotiq.com) · [Electronics Weekly Velocitip 2011-12](https://www.electronicsweekly.com/news/products/analog/smart-arrow-uses-adi-mems-sensor-2011-12/) · [Sport Sensors RADARchron](https://sportssensors.com/products/arrowspeed-radarchron/) · [Wonder Fitter](https://www.coolthings.com/wonder-fitter-virtual-archery-system-real-bow-and-arrow/) · [Garmin ArcheryX](https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/) (ya documentado en `docs/competencia-arqueria.md`)
