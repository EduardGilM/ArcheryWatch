# Competencia: apps de puntuación / seguimiento de arquería (scoring, training log, análisis)

**Fecha de investigación:** 17 de septiembre de 2026.
**Objetivo:** decidir si ArcheryWatch (detección de suelta por reloj Garmin + análisis de ejecución en Android) debe añadir registro del resultado de las flechas (scoring) y conocer qué hace la competencia.
**Método y fuentes:** iTunes Search/Lookup API y RSS de reseñas de App Store, fichas de Google Play, sitios oficiales de cada app, Wayback Machine, review de prensa especializada (Bow International), hilos de foros (ArcheryTalk) y reseñas de tienda con fecha. Limitaciones declaradas: el buscador web general agotó su cuota a mitad de la investigación y Reddit bloqueó el acceso directo (403); lo compensamos con la API pública de Apple (catálogo completo de 188 apps iOS con "archery"), Google Play, RSS de reseñas y foros. Cada afirmación indica su fuente y fecha. Se distingue entre **[hecho verificado]**, **[marketing]** y **[opinión de usuario]**.

---

## 0. Resumen ejecutivo

1. **Sí conviene añadir scoring, pero ligero.** Todos los líderes del segmento (ArcherySuccess, Rise, MyTargets, Artemis, CapTarget) son esencialmente "libretas de puntuación con estadísticas": el núcleo del producto es anotar el valor de cada flecha y dibujarla en la diana. Es lo que el arquero espera de un diario de entrenamiento. Fuente: descripciones oficiales de cada app (App Store / Google Play / webs oficiales), consultadas 17-09-2026.
2. **Nadie combina ejecución + resultado.** Ninguna app de scoring registra cómo se ejecutó el tiro (traza de apuntado, estabilidad, tiempos por fase); ninguna app de análisis de reloj registra el resultado en la diana. Artemis es la más cercana: pide al usuario una **valoración subjetiva de la ejecución y el timing por flecha** (fuente: artemis.vapeldoorn.net/artemis.html, 17-09-2026). Ese es exactamente el hueco de ArcheryWatch: lo que Artemis pide al usuario que autoevalúe, nosotros lo **medimos**.
3. **El reloj ya es un campo de batalla en iOS.** Arrow Tempo (Apple Watch, cuenta flechas por movimiento+audio, FC por tiro, suscripción de 14,99 USD/mes) y Archery Tracker (acelerómetro del Watch, HealthKit, CSV) validan el concepto de ArcheryWatch; ninguno tiene versión Android/Garmin ni análisis del resultado en diana. Fuentes: arrowtempo.com e iTunes lookup id1450784807, 17-09-2026.
4. **Puntos de dolor recurrentes de la competencia** (con citas): backups/sincronización rotos (MyTargets), funciones queridas eliminadas en rediseños (Rcherz y su shot clock), suscripciones caras percibidas en iOS (hilo r/Archery de oct-2025), miedo al abandono (Archer's Mark sin actualizar), precisión del trazado en pantalla pequeña, y rondas/rondines no estándar mal soportados.

---

## 1. Arcs (iOS) — verificación negativa documentada

**No se ha podido verificar la existencia de una app de arquería llamada "Arcs"** a fecha 17-09-2026, pese a búsqueda exhaustiva:

- **Catálogo completo de App Store EE. UU.** [hecho verificado]: descarga de los 188 resultados de "archery" en la iTunes Search API (17-09-2026): no existe ninguna app de scoring llamada "Arcs". La única app llamada exactamente "Arcs" (Pomegranate Apps LLC, 2,99 USD) es un juego de puzzle de círculos giratorios. Fuente: https://itunes.apple.com/search?term=archery&entity=software&limit=200 (y term=arcs).
- **Otras tiendas** (GB, NL, ES, DE): búsquedas "arcs archery" vía iTunes API devuelven solo juegos (Bowmasters, Archero, etc.). Fuente: iTunes Search API, 17-09-2026.
- **Dominio arcsapp.com**: hoy es una página de venta de dominio (HugeDomains). En Wayback Machine solo hay 4 capturas, todas de 2002-2015 (un sitio web anterior, no una app). Fuente: archive.org CDX, 17-09-2026.
- **Candidato más probable del nombre**: **"Arc Scorer"** (Jonathan Ho, iOS, id6758692459): app de scoring **gratis** lanzada el **10-03-2026**, con 5,0★ pero solo **3 valoraciones**, iOS 17+, sin Watch/iCloud/export mencionados; eslogan "Track every arrow. See your progress. Shoot smarter."; vistas de historial, comparación de sesiones y notas. **[hecho verificado]** Fuente: iTunes lookup id6758692459, 17-09-2026. Es un producto nuevo y diminuto, no "muy popular": si "Arcs" existió como app popular, fue retirada o renombrada; la evidencia disponible no permite confirmarlo.
- **Conclusión práctica:** los líderes reales de scoring en iOS por adopción valorada son **ArcherySuccess** (291 valoraciones, 4,75★), **Rise** (154, 4,77★), **Archery Scoresheets** (554, 4,76★), **Rcherz** (725, 4,62★) y **CapTarget** (~1.480 reseñas en Play). Fuente: iTunes Search API y Google Play, 17-09-2026.

---

## 2. MyTargets (Android, open source)

- **Qué es:** app Android para llevar el progreso de entrenamiento; nació como proyecto open source de Florian Dreier. **[hecho verificado]** Fuentes: github.com/DreierF/MyTargets y Play Store, 17-09-2026.
- **Estado del repositorio:** **archivado el 26-04-2020** (solo lectura); GPL v2, Kotlin, 89 estrellas, 940 commits, con **módulo `wearable`** etiquetado "android-wear" (Android Wear). Fuente: página de GitHub, 17-09-2026.
- **Paradoja viva:** aunque el repo está archivado, **la ficha de Google Play sigue actualizándose**: desarrollador "Mantis Tech", última actualización **01-04-2026** (v3.4.9), **500K+ descargas, 4,5★ con ~3.590 reseñas**. Es decir, alguien mantiene el producto fuera de GitHub. Fuentes: Play Store y GitHub, 17-09-2026.
- **Modelo de rondas** (ficha de Play, 17-09-2026): 25 caras de diana incluyendo Field y 3D; estilos de puntuación múltiples; rondas estándar y **rondas estándar personalizables**; rondines (ends) editables; modo competición con cronómetro ("timer horn" aparece en release notes). Fuente: Play Store de.dreier.mytargets.
- **Wearable:** "soporte Android Wear" listado explícitamente en la ficha. Fuente: Play Store, 17-09-2026.
- **Otras funciones:** gestión de material (arcos y flechas), hoja de puntuación **imprimible**, estadísticas, registro de **marcas de mira** (sight marks), condiciones meteorológicas (viento), seguimiento por flecha, 20+ idiomas. Fuente: Play Store, 17-09-2026.
- **Recepción de usuarios:**
  - Comparativa 2025/2026 de ArcheryBuddy: pros "gratis y open source, UI limpia, buenas opciones de exportación"; contras "sin funciones de entrenamiento, sin feedback de forma, solo Android". **[opinión/comparativa]** Fuente: archerybuddy.app/articles/best-archery-apps-2025-comparison, 17-09-2026.
  - **[opinión de usuario]** Reseña de Bernt (nov-2022) en Play: al cambiar de móvil, el backup local queda en una carpeta del sistema inaccesible y el backup de Google Drive "no funciona". Fuente: reseñas de Play Store.
  - Las notas de la v3.4.9 admiten problemas de backup: congelación al abrir ajustes de copia de seguridad y "mejorada estabilidad de scoring, backup y restauración"; arreglos de crashes en Android 16 Beta, congelación del cuerno del timer, y registro de toques al trazar flechas. **[hecho]** Fuente: sección "What's new" de Play, 17-09-2026.

**Lección para ArcheryWatch:** el modelo de MyTargets (ronda → ends → flechas trazadas en diana → estadísticas + material) es el estándar de facto gratuito en Android; su punto débil histórico (backup/restauración) es una oportunidad de diferenciación.

---

## 3. Intuitive Archer (iOS + Apple Watch) — verificación negativa y sustitutos reales

- **No se encuentra ninguna app llamada "Intuitive Archer"** ni en la iTunes Search API (EE. UU., 17-09-2026), ni en búsquedas de Google Play ("intuitive archer", 17-09-2026), ni en buscadores (Bing/Mojeek/DuckDuckGo devolvieron cero resultados de arquería). Conclusión: la app no existe hoy bajo ese nombre, o tiene presencia marginal. **[hecho: ausencia verificada en las fuentes consultadas]**
- **Quién ocupa realmente el nicho "análisis de tiro con el reloj" en iOS** (lo que se le atribuiría a "Intuitive Archer"):

### Arrow Tempo — el competidor más directo de ArcheryWatch
- **Plataformas:** Apple Watch (watchOS 10+, Series 4+) + iPhone (iOS 17+). **Precio:** gratis con límites; **Premium 14,99 USD/mes o 99,99 USD/año** (prueba de 1 semana). **[hecho]** Fuente: arrowtempo.com/apple-watch-archery-app, 17-09-2026.
- **Funcionamiento:** muestrea movimiento a **100 Hz en el brazo del arco** + micrófono; cuenta la flecha solo si coinciden pico de movimiento y sonido; detector de caminata pausa la detección al ir a recoger flechas; **todo el procesado es en el dispositivo** y el audio no se almacena. Fuente: misma web, 17-09-2026.
- **Por cada flecha detectada registra:** frecuencia cardíaca en el momento de la suelta, **hold time** (desde que se levanta el brazo hasta el tiro), calorías ponderadas por libraje y apertura. Premium añade "signature shot heatmap" y archivo completo de sesiones. Fuente: misma web.
- **Extras:** presets por arco, modo solo-contador, **entrenador de cadencia con metrónomo háptico**, app iPhone con scoring de end por cámara o manual y sincronización, guardado como entrenamiento de Arquería en Apple Health, iCloud, corrección manual del contador, sin cuentas de usuario. Fuentes: arrowtempo.com y app "AI Archery Score - Arrow Tempo" (Sergey Tyan) en App Store, 17-09-2026.
- **Lo que NO hace:** no registra el valor de la flecha en la diana más allá del scoring manual/cámara del iPhone; no hay Android ni Garmin. **[hecho: ausencia en listado]**

### Archery Tracker (Appersian)
- iOS, **gratis**, última actualización **16-01-2021** (aparentemente abandonada), 4★ (5 valoraciones). Detección de tiro con el **acelerómetro del Apple Watch** en la mano del arco; marca de "Good Shots" en la muñeca como referencia; sincroniza por **HealthKit**; historial en iCloud; **exportación CSV "para uso científico"**. **[hecho]** Fuente: iTunes lookup id1450784807, 17-09-2026.

### ArcherSense: AI Archery Coach
- iOS, gratis, actualizada el 11-09-2026, 5★ (3 valoraciones; muy nueva). **AI video coaching** por fases del ciclo de tiro (stance, alineación, draw, anclaje, apuntado, suelta, follow-through) + **scoring completo** (WA 122/80/40 cm, 10-ring y 6-ring de compound, 3-spot vertical/triangular, field y 3D, X-count e inner-10) + marcas de mira y setups + misiones de entrenamiento personalizadas + **informes PDF biomecánicos con esqueleto superpuesto para el entrenador**. **[hecho según descripción del desarrollador]** Fuente: iTunes lookup id6748324853, 17-09-2026.

**Respuesta a la pregunta del encargo:** no hay evidencia de que "Intuitive Archer" tenga integración con Apple Watch; los ejemplos reales de análisis por reloj son Arrow Tempo y Archery Tracker. Ninguno de los dos traza el apuntado por fases ni estima estabilidad: se quedan en contar, ritmo cardíaco y tiempos groseros.

---

## 4. Archer's Mark (iOS; Android no encontrado)

- **Identidad actual:** publicación de **ULTRAVIEW Archery, Inc.** para iOS, **19,99 USD** (pago único), 4,27★ (48 valoraciones), v2.15 de **mayo de 2024** (añade soporte de visor Bowfinger 1). **[hecho]** Fuente: iTunes Search API, 17-09-2026.
- **Función estrella:** no es una libreta de puntuación, sino una **calculadora de marcas de mira (sight marks)** para field archery: genera marcas métricas e imperiales y las **ajusta en tiempo real** por clima, fatiga del arquero, etc.; soporta juegos NFAA Field/Hunter/Animal; manual integrado; se integra con la app complementaria "Archer's Score" (de pago). Fuente: descripción de App Store, 17-09-2026.
- **Android:** ninguna ficha de "Archer's Mark" aparece en las búsquedas de Google Play realizadas el 17-09-2026 (la asociación "Android/iOS" del encargo no se pudo verificar; el ecosistema es iOS: Archer's Mark + Archer's Score + Archers Tape). **[hecho: ausencia]**
- **Ecosistema (según usuarios de ArcheryTalk):** se pueden "enviar las marcas por email" y usar la app gratuita **Archers Tape** para "imprimir tus marcas en una tarjeta del tamaño perfecto" como respaldo de torneo. **[opinión de usuario]** Fuente: archerytalk.com/threads/best-archery-apps-for-ios.4781793, consultado 17-09-2026.
- **Recepción de usuarios:**
  - **[opinión]** Bobmuley (ArcheryTalk): "Sight marks have been better than AA [Archery's Advantage] for me"; Baller valora ajustar "sobre la marcha" sin cambiar de cinta de mira. Fuente: mismo hilo.
  - **[opinión]** waltw (ArcheryTalk): preocupa que "la app lleva casi un año sin actualizarse" y pagar 20 USD "para que la abandonen". Fuente: mismo hilo.
  - **[opinión]** Reseñas App Store v2.14-2.15: error de cálculo de FPS/marcas cortas (Rensarns, 4★), "error sight" al meter yardas (Marc The Archer, 1★: "no malgastéis el dinero"), fallo con pendiente de 18° en un safari (Belvedong, 4★), y entusiasmo: "esta app hace que la arquería sea divertida… imprimir hojas de marcas es una NECESIDAD ya" (AeroD, 5★). Fuente: RSS de reseñas App Store, 17-09-2026.

---

## 5. Artemis (vApeldoorn, Android) — la referencia de análisis

- **Posicionamiento** **[marketing con datos verificables]**: "The #1 App for the serious archer and coach… **10 years of development**", desarrollada "en cooperación con muchos de los mejores arqueros y entrenadores del mundo". Fuente: artemis.vapeldoorn.net/artemis.html, 17-09-2026. La review de Bow International (02-07-2018) ya la puntuaba con 4,5/5 y la llamaba "la herramienta smartphone líder para arqueros serios", con el respaldo del campeón mundial indoor Sjef van den Berg; las arqueras olímpicas Mackenzie Brown (migró desde ArcherZUpshot) y Gabriela Bayardo también la usaban. Fuente: bow-international.com/reviews/review-archery-scoring-apps/.
- **Modelo de registro por flecha** (lo más relevante para ArcheryWatch): se traza con el dedo sobre la diana; **más de 100 rondas preconfiguradas**; sesiones de entrenamiento personalizadas (volumen, solo score, o trazar todo); y por cada tiro se añade: posición en diana, orden de tiro, **qué flecha (número de flecha)**, **valoración de la ejecución del tiro (shot execution rating)**, **shot timing** e incluso **frecuencia cardíaca**. Fuente: web oficial, 17-09-2026.
- **Consejos en tiempo real (Premium/Coached):** "Sight Advice": monitoriza la tendencia de los grupos y avisa **cuándo y cuánto** ajustar la mira; alerta cuando **una flecha concreta** rinde inconsistente (chequear el tubo); monitorización de **ritmo cardíaco e indicación de estrés**. Fuente: web oficial, 17-09-2026.
- **Análisis y comparación de material:** soporta varios setups de arco y tubos; **comparar rendimientos entre setups/tunings** ("encuentra esos puntos extra"); gráficas de puntuación, tendencias de volumen y de **tamaño de grupo**; precisión de flechas individuales; registro de cambios de forma/equipo; "Personal Online Analysis" como servicio web. Fuente: web oficial, 17-09-2026.
- **Herramientas de entrenador:** edición **Coached** (el entrenador monitoriza a sus atletas), **TEAM monitoring** (base de datos compartida de cada atleta, análisis en profundidad, infraestructura web agregada opcional), **compartir la ronda con el entrenador** "no solo el score por WhatsApp, sino el análisis completo" por email o sincronización automática con el Artemis del entrenador; **generador de etiquetas QR** para escanear el programa de entrenamiento (usado en el Centro Olímpico de Papendal, Países Bajos). Fuentes: web oficial, 17-09-2026; World Archery Europe respalda ArtemisLite como "parte esencial del entrenamiento para el arquero (semi)profesional y el entrenador" (archeryeurope.org/media/archery-2-0/).
- **Modelo de negocio:** **ArtemisLite gratis** de por vida con mejoras de pago (**Premium**: asesoramiento + análisis online; **Coached**: entrenadores). Fuente: web oficial; ArtemisLite en Google Play (com.vapeldoorn.artemislite).
- **Recepción:**
  - **[opinión]** ArcheryBuddy (comparativa 2025/2026): "estadísticas detalladas, múltiples formatos de ronda, análisis de grupos"; contras: "sin análisis de forma, interfaz anticuada, curva de aprendizaje pronunciada". La propia web admite "Artemis puede ser muy desafiante" (FAQ). Fuente: archerybuddy.app y web oficial, 17-09-2026.
  - **[opinión]** Testimonios de la web oficial: "una auténtica herramienta imprescindible… el análisis resalta cosas invisibles a simple vista" (Valerio Angelici); "sencillamente la herramienta de arquería más completa que existe" (Stephen Collins).
  - **[hecho 2018, quizá desactualizado]** Bow International: solo Android (su mayor contra).

---

## 6. ArcherySuccess — el estándar de "diario de arquería" en iOS

- **Plataformas y precio:** iOS **14,99 USD** pago único (4,75★, 291 valoraciones, actualizada 06-07-2026); Android **16,99 EUR** pago único con compras internas (1K+ descargas, actualizada 05-07-2026). Desarrolladora: AllTen Software Limited (Nueva Zelanda). **[hecho]** Fuentes: iTunes Search API y Google Play com.alltensoftware.archerysuccess, 17-09-2026.
- **Funciones estrella** (ficha de Play, 17-09-2026):
  - **600+ tipos de ronda integrados** (WA target/indoor/field/3D/VI/barebow, Archery GB, USA Archery, FITA, NFAA/IFAA, NASP, IBO/ASA 3D, Lancaster, Clout, Archery Australia/NZ, DBSV, UK 252) o rondas propias.
  - **Trazado rápido o de precisión** con diana con zoom.
  - **"Arrow tagging and arrow group analysis"** — identificación por flecha y análisis de grupos.
  - **Nivel de habilidad y handicaps por ronda** (tablas antiguas y nuevas).
  - **Objetivos de volumen:** "pon una meta de número de flechas y sigue y reporta tus volúmenes".
  - **Backups automáticos**, restauración desde lista con fechas y guía "Transfer to New Phone".
  - Diario con notas buscables, informes semanales de progreso **por email**, **exportación a Excel**, récord personales por tipo de arco/material/nivel, seguimiento de setups, función "Seasons".
- La web oficial (17-09-2026) presume de "usada en 60 países, **700+ rondas**" y de registrar "flechas puntuadas y sin puntuar contra tus objetivos". Nota: un resumen de búsqueda de la misma web citaba "780+ rondas en 23 federaciones"; la cifra exacta varía según la fecha de captura. **[hecho con rango]**
- **Recepción:**
  - **[opinión]** "El estándar de oro del diario de arquería… la uso desde hace 4 años y sigue mejorando; me hace responsable registrando volumen de flechas, práctica, torneos, cambios de material y notas" (Wilklang3, v4.90). "Es la app que me recomendó mi entrenador… la UI cuesta un poco al principio" (Caleb Hayes314). "Ojalá añadiesen scoring de varios tiradores" (Lucian666). "Todos los arqueros que conozco tienen esta app" (Stampin'Shaz, v4.7). Fuente: RSS reseñas App Store, 17-09-2026.
  - **[opinión foro]** En r/Archery (hilo "Archery scoring apps?", jul-2023) una usuaria de iPhone la recomienda con "target mode" para introducir puntuaciones aunque prefiere la vista de tabla. Fuente: reddit.com/r/Archery/comments/14pdp11 (acceso vía resultados de búsqueda; Reddit bloqueó el fetch directo el 17-09-2026).
  - En ArcheryTalk, algunos dicen que las sight marks de Archer's Mark les funcionan mejor que las de ArcherySuccess. **[opinión]** Fuente: hilo 4781793, 17-09-2026.

---

## 7. ShotIQ — entrenamiento mental (no es app de scoring)

- **Qué es:** marca de instrucción de **Joel Turner** (tirador/coach, ex SWAT según su propia biografía) alrededor del sistema **"CPS" (Controlled Process Shooting)**: entrenamiento mental para batir el **target panic** y tirar bajo presión. **[hecho]** Fuente: shotiq.com, 17-09-2026.
- **Producto real:** cursos online vía portal web **go.shotiq.com** (curso de Arquería "science based system for beating target panic", curso de Bodie Turner —"mayor X-count de clasificación en la historia de Vegas" [marketing]—, Precision Long Gun, Precision Pistol) y **MindIQ** (mindiq.com) para rendimiento mental. **No hay app móvil**: el único acceso es el login web. **No publica precios en la home.** Fuente: shotiq.com, 17-09-2026.
- **Recepción:** en r/Archery se discute su modelo ("every archer needs to own every shot" — ningún tiro accidental). **[opinión]** Fuente: reddit.com/r/Archery/comments/14zj4pk (vía resultados de búsqueda, 17-09-2026). Testimonios de la web (Joe Rogan, tiradores SWAT/MLB) son **[marketing]** sin evidencia verificable.
- **Relevancia para ArcheryWatch:** el "proceso controlado" es filosofía, no software; el hueco real de producto (medir la ejecución bajo presión y ligarla al resultado) sigue libre.

---

## 8. Otras apps relevantes (federaciones, Vegas/3D, veteranas)

### CapTarget Archery — la "app partner oficial de World Archery"
- **Plataformas:** iOS y Android (captarget.archery). Desarrollador: Appli Magine (Tours, Francia). **Modelo:** gratis con anuncios y compras ("80% de las funciones Premium son gratis"). **4,9★ con ~1.480 reseñas** en Play, 10K+ descargas, actualizada el **12-09-2026**. **[hecho]** Fuente: Google Play e iTunes Search API, 17-09-2026.
- **Se declara "World Archery's Official Partner App"** con comunidad de +25.000 arqueros; **[marketing, coherente con la ausencia de app propia de WA]**. World Archery **no ofrece app oficial propia** en su portada (worldarchery.sport, 17-09-2026: solo resultados web, Archery.tv y WAREOS en el pie).
- **Funciones:** entrenamiento guiado y scoring indoor/outdoor/3D/field; **planificación de temporada**; opción de sustituir el scoring por **medición de distancia al centro**; **30+ ejercicios** (ordenación de flechas, matches individuales/equipo, optimización de plunger y brace height, torneos World Cup, **ronda Las Vegas**); retos multijugador en tiempo real; rivales AI; cronómetro; gestión de material; **diario de entrenamiento digital**; **acceso para el entrenador** a tus estadísticas; acceso a resultados de competiciones internacionales. Fuente: ficha Play, 17-09-2026.

### Rcherz (bowbook, Eslovaquia) — scoring social + competiciones de club
- iOS 4,62★ (725 valoraciones); Play: app de arquero (cs.rcherz) y **Rcherz Scoring** (cs.rcherz.scoring, 5K+ descargas, actualizada 07-05-2026) que convierte "cualquier dispositivo Android en el sistema de puntuación de competiciones del club", con edición de resultados offline. **[hecho]** Fuentes: iTunes Search API y fichas Play, 17-09-2026.
- **[opinión]** cbrunson (ArcheryTalk, hilo 4781793): "puedes gestionar juegos de práctica de múltiples formatos, organizar competiciones" y el live scoring "se publica y se ve en tiempo real desde cualquier lugar".
- **[opinión, quejas]** Tras un rediseño hacia competición, varios usuarios (una entrenadora JOAD, RivRobin, Stampin'Shaz) se quejan: "**¿Por qué quitaron el reloj?**", "el shot clock tan útil ha desaparecido, igual que las notas"; otro usuario no pudo ni crear cuenta. Fuente: RSS reseñas App Store, 17-09-2026. (La misma reseña menciona **Between Ends** como herramienta de club alternativa más lenta de actualizar.)

### Archery Scoresheets (Appshay)
- iOS 4,76★ (554), actualizada 07-08-2026. Rondas estándar (WA, GNAS, USA, Australia, NZ) y custom, hasta 4 arqueros, **clasificaciones y handicaps de Archery GB**, trazado en diana, imprimir/firmar/enviar hojas. Nivel ELITE (de pago): **escaneo de hojas de papel**, calculadora de sight marks, vídeo con retardo. **[hecho]** Fuente: iTunes Search API, 17-09-2026.
- **[opinión]** Reseñas: pedir "un cursor de flecha para marcar el punto exacto, con el dedo cuesta acertar" (v4.3); "tarda mucho crear una hoja custom cada vez para 3D" piden NASP 3D (Bulldogmom757, v4.1); "ojalá se pudiera configurar el número de ends" (BH Archery, v4.1). Fuente: RSS reseñas, 17-09-2026.

### Ishi Archery
- iOS 4,77★ (120), actualizada 15-05-2023. FITA/GNAS, NFAA, **dianas Vegas 3/5** con auto-scoring, 3D (ASA/IBO), dianas custom con foto propia, hasta 4 arqueros por tarjeta, timer, **etiquetado de flechas**, sincronización con portal web. Premium ~4,99 GBP (2018). **[hecho]** Fuentes: iTunes Search API 17-09-2026; Bow International 02-07-2018 (3,5/5: trazado potente pero "los targets pequeños exigen dedos ágiles" y funciones clave tras el muro de pago).

### Rise (Campbell Affleck)
- iOS, gratis, 4,77★ (154), actualizada 05-09-2026. **[hecho]** Fuente: iTunes Search API, 17-09-2026.
- Diferenciales (web oficial risearchery.com, 17-09-2026): **simulación de competición** — rondas olímpicas head-to-head contra amigos (online o sin app), "Rise Bot" como rival fantasma basado en tu rendimiento reciente, torneos con qualifying/eliminatorias/posiciones; stats por flecha numerada ("cómo agrupa cada flecha"), tendencias por material y distancia; **Form Checker** (vídeo retardado); tags, grupos, leaderboards mensuales y **feedback del entrenador**; caras USAA/WA/NFAA/3D/Imperial. La descripción de App Store añade **exportación CSV/PDF** y simulación de **800+ eventos de World Archery/Corea/USA**. **Solo iOS** (sin Android; "wish there was an android port" — reseña de JC1203). Monetización poco clara en la web (enlace Ko-fi); una reseña 1★ (v5.0.3) reporta timer sin sonido en iPhone y vídeo roto en tablet.

### Apps de federaciones y ecosistema torneos
- **Ianseo Scorekeeper NG** (net.ianseo.scorekeeperng, Play): app de scoring para organizadores del sistema de resultados Ianseo (usado habitualmente en eventos internacionales). **[hecho: ficha existe]** Fuente: Google Play, 17-09-2026.
- **ASA Archery Pro/Am** (Holodyn): app oficial del ASA Pro/Am Tour (calendario/eventos). **NASP Portal**: app oficial del programa escolar NASP. **Archery Passport** (Easton Sports Development Foundation). **[hecho]** Fuente: iTunes Search API, 17-09-2026.
- **World Archery head2head** (2018, 4/5 en Bow International): match play contra resultados de la élite mundial desde la base de datos de WA; **ya no aparece en el catálogo actual de la App Store** (búsqueda 17-09-2026). Hoy la función "competir contra la élite" la cubre Rise (simulaciones) y CapTarget (partner WA).
- **Vegas/indoor y 3D específicos:** Easy3DScore (IFAA/IBO/ASA/NFAS + sistemas de puntuación editables y compartibles, offline; 4,85★), ShootOff Archery (0,99 USD), Foam Hunter Scoring (4,99 USD), 3D Scoresheet, "Scoring in Archery" (WA 10/6/5-ring, IBO, ASA, Field, NFAS, IFAA; offline; modo competición nuevo), Archery Scoring Helper (scoring WA + iCloud + gestión de material, sin cuentas), My Archery (PRO añade export CSV y gráficas). **[hecho: descripciones de tienda]** Fuente: iTunes Search API, 17-09-2026.

### Veteranas / anecdóticas (lecciones)
- **ArcherZUpshot ("ArcherZ")**: descontinuada ("Upshot! is really simple… archerzupshot is discontinued" — BaconRocks, ArcheryTalk; un usuario no encontraba "Cluster Analysis" sin comprar add-on). Era la app que Mackenzie Brown abandonó por Artemis (Bow International, 2018).
- **iArcher** (Julian Parker, 4,99 USD, 2,11★): veterana de registro de datos, casi sin reseñas y mal valorada. **iArchers** (sena izala): scorebook nuevo con entrada tocando la diana. **[hecho]** Fuente: iTunes Search API, 17-09-2026.
- **ArrowNautics** (iOS, 9,99 GBP en 2018; 3/5): "carísima para lo que hace; 11 pantallas antes de puntuar" (Bow International, 02-07-2018); en ArcheryTalk, adam0321 la llamó "un desperdicio de dinero" porque buscaba timer, perfiles de arco/flecha y progreso — no scoring masivo para 100 personas.
- **ArchersDiary** (2018, 2,5/5): tenía aim tracker **no guardable** y "planeaba" integración con Apple Watch (nunca llegó a relevantarse). Bow International, 02-07-2018.

---

## 9. Qué hacen bien y mal según los usuarios (síntesis con evidencia)

**Bien:**
1. **Trazar en la diana con análisis posterior de grupos** es la función querida por encima de todo (Artemis, ArcherySuccess, Rise, MyTargets, Ishi). Fuentes: descripciones de tienda y reviews citadas, 2018-2026.
2. **Identificar cada flecha** y detectar la que falla: Artemis alerta de flechas inconsistentes; Rise numeración por flecha; ArcherySuccess arrow tagging. Fuentes: web oficial Artemis 17-09-2026; fichas de tienda.
3. **Vínculo con el entrenador**: ArcherySuccess "la que me recomendó mi entrenador"; Artemis comparte análisis completos (no solo el score); ArcherSense exporta PDFs biomecánicos; CapTarget da acceso al coach. Fuentes citadas arriba.
4. **Respuesta del desarrollador**: usuarios de ArcherySuccess destacan soporte rápido con capturas y explicaciones (Stampin'Shaz). Fuente: RSS reseñas, 17-09-2026.

**Mal (puntos de dolor típicos):**
1. **Pérdida de datos / backups rotos**: MyTargets (Bernt, nov-2022: backup local inaccesible, Drive "no funciona"); el trauma colectivo del cull de apps 32-bit en iOS ("perdí 46 apps" — JimDE, ArcheryTalk). Fuentes citadas.
2. **Suscripciones percibidas como abusivas en iOS**: hilo de r/Archery (oct-2025, "Free iOS archery scorebook — no sign-in needed") presenta JayArchery como "local-first, a diferencia de la mayoría de apps iOS que empujan suscripciones"; Arrow Tempo cobra 99,99 USD/año por contar flechas. Fuentes: reddit.com/r/Archery/comments/1o68l1f (vía snippet de búsqueda, 17-09-2026) y arrowtempo.com.
3. **Quitar funciones queridas al rediseñar**: el caso Rcherz (shot clock y notas eliminados; "Bring the timer back"). Fuente: RSS reseñas App Store, 17-09-2026.
4. **Miedo al abandono**: Archer's Mark casi un año sin actualizaciones (waltw); Archery Tracker parada desde ene-2021; ArcherZUpshot descontinuada; head2head desaparecida. Fuentes citadas.
5. **Precisión del trazado en pantalla**: "cuesta acertar el punto exacto con el dedo" (Archery Scoresheets v4.3); "targets pequeños exigen dedos ágiles" (Ishi, Bow International 2018). Soluciones emergentes: lupa con zoom (ArcherySuccess "precision plotting"), cursor de flecha pedido por usuarios.
6. **Rondas no estándar mal soportadas**: crear rondas custom "es una pérdida de tiempo" (NASP 3D en Scoresheets); configurar ends a mano (BH Archery); ArrowNautics no servía para uso individual (adam0321). Fuentes citadas.
7. **Fricciones de pago confusas**: Ishi "funciones clave tras el muro de pago" (Bow 2018); CapTarget "80% Premium gratis" [marketing] con anuncios; Rcherz requiere cuenta y hubo quien no pudo crearla.
8. **Bugs de bulto en releases**: timer sin sonido y vídeo roto (Rise v5.0.3); congelación del cuerno del timer y del registro de trazado (MyTargets v3.4.9); errores de cálculo de yardas/FPS (Archer's Mark v2.15). Fuentes citadas.
9. **Falta de exportación**: peticiones explícitas de CSV/impresión (My Archery la cobra como PRO; Archer's Mark imprime marcas vía app hermana; ArcherySuccess lo vendió como ventaja con Excel). Fuente: fichas de tienda.
10. **Solo-iOS o solo-Android**: Rise "ojalá hubiera port Android"; MyTargets "Android only" como contra en comparativas; Artemis "no está en iPhone" (Bow 2018) — sigue sin estar en el catálogo iOS actual (búsqueda 17-09-2026).

---

## 10. Funciones transversales que los arqueros piden una y otra vez

Con evidencia de reseñas/foros (fuentes anteriores):
1. **Registro ligero por flecha con trazado en diana** (zoom y corrección fácil de toques).
2. **Identificación por flecha** (número de flecha → grupos y detección de la flecha "mala": Artemis, Rise, ArcherySuccess, Ishi).
3. **Grupos y su evolución** (tamaño de grupo por end/sesión/distancia: Artemis, ArcherySuccess, Archery Recorder en ArcheryTalk).
4. **Estadísticas por distancia, ronda y material** (promedios, distribución por anillo, tendencias temporales: Rise, ArcherySuccess, My Archery, Artemis).
5. **Rondas oficiales actualizadas** (WA/FITA, GNAS/AGB, USA Archery, NFAA/IFAA, NASP, Vegas, field/3D, clout, UK 252...) y editor de rondas custom rápido (ArcherySuccess 600+, Scoresheets, CapTarget).
6. **Modo competición con timer/cuerno y shot clock** (Artemis, Ishi, MyTargets, Rise; el trauma de Rcherz al quitarlo demuestra su valor).
7. **Backup fiable + sincronización entre dispositivos** (iCloud en iOS; quejas rotundas cuando falla: MyTargets; "Transfer to New Phone" de ArcherySuccess como buen patrón).
8. **Exportación estándar** (CSV/Excel/PDF/imprimir hoja de puntuación o tarjeta de marcas: Rise, ArcherySuccess, Archery Tracker, Archers Tape).
9. **Compartir con el entrenador** (análisis completo, no solo el score: Artemis share/TEAM, CapTarget coach, ArcherSense PDF, feedback en Rise).
10. **Multi-arquero** (familias, clubs, leagues: Scoresheets e Ishi 4 arqueros; petición explícita en ArcherySuccess).
11. **Marcas de mira (sight marks)** y calculadoras/tuning (Archer's Mark, MyTargets, Archery Toolkit, Artemis setups).
12. **Objetivos de volumen de flechas** y rachas (ArcherySuccess goals, CapTarget historial de volumen).
13. **Competir contra algo**: élite de la base de datos WA (head2head), rival fantasma con tu nivel (Rise Bot), multijugador (CapTarget).
14. **Local-first / sin cuentas obligatorias** (hilo r/Archery oct-2025; Archery Scoring Helper "almacenamiento en el dispositivo"; Arrow Tempo "sin cuentas de usuario").
15. **Sin suscripción agresiva** o con compra única razonable (ArcherySuccess 14,99-16,99 EUR pago único como contraejemplo rentable).

---

## 11. Implicaciones para ArcheryWatch

1. **SÍ añadir scoring, pero como "resultado ligero", no como clon de Arcs/ArcherySuccess.** El registro debe ser una extensión natural de la detección: cuando el reloj detecta la suelta, ofrecer (en el reloj o en el móvil) una entrada de 1 toque del valor de la flecha (pad numérico 0-10/X) o trazado rápido en diana. La competencia confirma que el valor percibido está en el **análisis posterior**, no en teclear.
2. **El diferenciador único: ejecución + resultado en la misma flecha.** Artemis pide al usuario una *valoración subjetiva* de ejecución y timing por flecha; ArcheryWatch ya **mide** traza de apuntado por fases, estabilidad y tiempos. Cruzar "cómo ejecuté" con "cuánto saqué" (p. ej., "tus 9-10 salen con estabilidad X y tiempo de anclaje Y; tus fallos coinciden con aperturas aceleradas") es algo que **ninguna app del mercado ofrece**. Convertirlo en el insight estrella.
3. **Adoptar el modelo de rondas de MyTargets/ArcherySuccess**: rondas oficiales predefinidas (WA 720,vertis 3-spot, Vegas, field), ends configurables y una ronda "libre/práctica" de 1 toque para quien no quiera ceremonia (el dolor "custom = pérdida de tiempo" es real).
4. **Trazado en diana con zoom y corrección**: copiar el "precision plotting" con zoom de ArcherySuccess y resolver la queja universal del "no acierto al tocar" (lupa, arrastre fino, confirmación).
5. **Identificación por flecha desde el día 1**: número de flecha opcional por tiro y "flecha del pinchazo" (detectar la flecha que falla) como en Artemis; con nuestra medición podemos además **correlacionar desviación del grupo con la ejecución**, no solo con el tubo.
6. **Grupos como métrica principal**: tamaño de grupo por end/sesión/distancia y su tendencia (Artemis lo usa hasta para aconsejar la mira; nosotros podemos decir "tu grupo se abre cuando tu fase de apuntado supera N segundos").
7. **Backup y exportación no negociables**: backup automático + restauración fechada (patrón ArcherySuccess) y **export CSV/estándar** (el "CSV para uso científico" de Archery Tracker ya validó la demanda). Evitar el error histórico de MyTargets (backups inaccesibles).
8. **Local-first, sin cuenta obligatoria, sin suscripción agresiva**: posicionamiento claro frente a las suscripciones de iOS (99,99 USD/año de Arrow Tempo) y alineado con el hilo r/Archery de oct-2025. Compra única o freemium generoso (modelo "80% gratis" de CapTarget como referencia de percepción).
9. **Estadísticas por perfil y distancia**: promedios, distribución de anillos con colores (7-8 rojo, 9-10/X oro, patrón visual citado en r/Archery), tendencias semanales; objetivos de volumen de flechas (ArcherySuccess) integrados con el conteo automático que ya hacemos.
10. **Compartir con entrenador**: export/import de sesión completa (no solo score) al estilo Artemis, y un informe PDF de sesión que combine resultado + ejecución (referencia: informes biomecánicos de ArcherSense). Es la puerta de entrada a clubs.
11. **Modo práctica con timer opcional**: el shot clock/cuerno es una función querida (Rcherz, MyTargets, Ishi) que podemos dar "gratis" al estar ya en el reloj (vibraciones hápticas como el metrónomo de Arrow Tempo: háptica de cadencia de tiro).
12. **NO clonar Arcs/ArcherySuccess**: no perseguir las 600+ rondas ni las 23 federaciones ni las funciones de club/liga (Rcherz, Ianseo, CapTarget tienen esa capa cubierta y con efectos de red). Elegir 10-20 rondas oficiales frecuentes + custom simple.
13. **NO competir en gestión de torneos**: scoring de competición multi-arquero en vivo es terreno de Ianseo Scorekeeper NG, Rcherz Scoring y las apps federadas; Alto coste de mantenimiento, baja sinergia con el reloj.
14. **Vigilar Arrow Tempo y ArcherSense**: son los únicos que ocupan "análisis desde el reloj". Si sacan Android/Garmin o añaden scoring automático por cámara (Arrow Tempo ya tiene "AI Archery Score" con cámara), nuestra ventana se estrecha: la combinación ejecución+resultado es la fosa defensiva.
15. **Explorar el puente con las apps de scoring existentes**: en vez de reconstruir un diario completo, permitir exportar/importar el resultado de la sesión (CSV compatible con ArcherySuccess/MyTargets) o deep-links; el arquero con años de historial en otra app no la abandonará, pero sí nos usará como capa de ejecución.

---

## Anexo: fuentes principales (todas consultadas el 17-09-2026 salvo indicación)

- iTunes Search/Lookup API (App Store EE. UU., GB, NL, ES, DE): búsquedas "archery" (188 resultados), "arcs", "arc scorer", "archery scoring", "archer's mark", "archerysuccess", "world archery", "archerzupshot", "iarcher", "vegas archery scoring", "intuitive archery"; lookups id6758692459 (Arc Scorer), id1450784807 (Archery Tracker), id6748324853 (ArcherSense), id1289128334 (ArcherySuccess), id333265578 (Archer's Mark).
- RSS de reseñas de App Store (sortBy=mostRecent) para ArcherySuccess, Rise, Archery Scoresheets, Archer's Mark, Rcherz (con versiones; fechas aproximadas por versión).
- Google Play: de.dreier.mytargets (MyTargets), com.alltensoftware.archerysuccess, captarget.archery, cs.rcherz y cs.rcherz.scoring, net.ianseo.scorekeeperng, búsquedas "archery scoring app", "intuitive archer", "archers mark", "rcherz".
- Webs oficiales: artemis.vapeldoorn.net/artemis.html (vía https://vapeldoorn.net); archerysuccess.com; risearchery.com; arrowtempo.com/apple-watch-archery-app; shotiq.com; arcsapp.com (parcheada por HugeDomains).
- GitHub: github.com/DreierF/MyTargets (archivado 26-04-2020) y README.
- Wayback Machine: CDX de arcsapp.com (4 capturas 2002-2015).
- Prensa/foros: Bow International, "Review: archery scoring apps" (02-07-2018, issue 124); ArcheryTalk hilo "Best archery apps for iOS" (n.º 4781793); World Archery Europe "Archery 2.0" (respaldo ArtemisLite); worldarchery.sport (portada, sin app oficial); Archery GB "Archery apps" (403 al fetch, no accesible el 17-09-2026).
- Reddit (vía resultados de búsqueda; acceso directo bloqueado 403): r/Archery/comments/14pdp11 (scoring apps, jul-2023), r/Archery/comments/ent4cy (best scoring app Android), r/Archery/comments/1o68l1f (scorebook iOS sin suscripción, oct-2025), r/Archery/comments/14zj4pk (Shot IQ).
- Comparativa: archerybuddy.app/articles/best-archery-apps-2025-comparison (con declaración de sesgo: es su propia app).

*Nota metodológica: la información de tiendas (precios, valoraciones, fechas) corresponde a la fecha de consulta y puede variar; las citas de usuarios se reproducen en inglés original para preservar fidelidad.*
