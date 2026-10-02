# Síntesis de competencia: ArcheryWatch frente a todos — FODA y roadmap

17/09/2026. Este documento condensa cinco investigaciones exhaustivas realizadas hoy contra fuentes primarias (Garmin, tiendas, foros, papers) y el estado real del código (`mobile/index.html` APK v61/4.4, firmware AWVZ, `watchapp/source/ArcheryApp.mc`). Detalle y fuentes completas en los cinco documentos de base:

- [competencia-archeryx.md](competencia-archeryx.md) — Garmin ArcheryX + ShotView (el rival de referencia del usuario).
- [competencia-mantis.md](competencia-mantis.md) — Mantis X8 y hardware de arco (BOWdometer, Shot Sense).
- [competencia-wearables.md](competencia-wearables.md) — K Archery, catálogo Connect IQ, Wear OS, watchOS.
- [competencia-scoring-apps.md](competencia-scoring-apps.md) — Artemis, ArcherySuccess, MyTargets, Arcs, ShotIQ, federaciones.
- [competencia-usuarios-ciencia.md](competencia-usuarios-ciencia.md) — voces de usuarios y ciencia IMU/arquería (qué métricas son válidas).

Dato local verificado durante esta síntesis: **el FR165 no tiene giroscopio** (`tools/ciq/sdk/bin/devices.xml`: accel 100 Hz + mag 50 Hz, sin gyro). FR265/FR965 sí lo tienen (accel/gyro/mag a 100/100/50 Hz). Esto acota qué podemos igualar de ArcheryX en este reloj y qué no.

---

## 1. Conclusión ejecutiva

**ArcheryWatch ya tiene el diferenciador que nadie más tiene: la traza del tiro, por fases y coloreada, en el móvil Android EN VIVO por BLE.** Garmin ArcheryX pasa por Garmin Connect (asíncrono), K Archery es una web post-sesión con suscripción, y Mantis exige pegar un sensor de 150 $ al arco. Nuestra posición natural es:

> «La analítica de ArcheryX para tu Forerunner —y para recurvo/barebow— en vivo en tu Android, sin pegar nada al arco y sin suscripción.»

Para llegar ahí faltan tres cosas: (1) igualar la experiencia de dibujado/replay de ArcheryX (el usuario la adora: es IMITABLE, es render, no hardware), (2) publicar cifras de precisión de detección que NADIE del nicho publica, y (3) cerrar el ciclo ejecución↔resultado registrando el valor de la flecha tras cada tiro detectado —la correlación «tus 9-10 salen con steadiness X, tus fallos con aperturas aceleradas» no la ofrece nadie en el mercado—.

El reloj de gama (fēnix 9 + gyro) le da a Garmin una precisión angular que el FR165 no puede igualar: no perseguir «MOA reales»; ganar en claridad, honestidad, latencia yPrecio.

---

## 2. Panorama competitivo (verificado 17/09/2026)

| Producto | Qué es | Precio | Fortaleza máxima | Debilidad máxima |
|---|---|---|---|---|
| **Garmin ArcheryX + ShotView** | Actividad nativa fēnix 9/9 Pro (25/08/2026), compound. ShotView = app de análisis (herencia Xero) | Incluido con reloj desde 999 $ | Marca + gyro + MOA + Aim Path con replay + nube Garmin | Solo fēnix 9; sin backport anunciado; flujo asíncrono vía Connect; monocolor (sin fases) |
| **Mantis X8** | IMU pegado al riser, BLE, app iOS/Android | 149,99 $ hardware; app gratis «de por vida» | Fases con colores, score 0-100, comparador por fase, 6 años de mercado | Montaje/nivelación; «dice qué, no cómo» (queja n.º 1); sin exportación; score no correlaciona con impacto; agotado en su web |
| **K Archery** (Connect IQ) | App IQ de detección por muñeca (la más cercana a nosotros) | Gratis contador; 15 € desbloqueo; Connect 5 €/mes (9 € desde 2027) | 216 dispositivos; activa (v4.6, 15/09/2026); web con curvas | Sin español; umbrales fijos «calibrados con recurvistas de élite»; análisis post-sesión en web de pago; 4,1★ con quejas de tiros omitidos |
| **Arrow Tempo** (watchOS) | Acelerómetro 100 Hz + micrófono | 14,99 USD/mes | Fusión sensor+sonido; scoring por cámara (IA) | Solo Apple Watch; suscripción cara; admite falsos negativos cuesta abajo |
| **BOWdometer** | IMU de arco (Toxon Tech) | ~140 $ | Xi 1-100, «Fitbit del arco» | **Muerto por dependencia de servidor** — lección de local-first |
| **Mathews Shot Sense** | Sensor integrado en riser Mathews 2023+ | Con el arco | Cero fricción de montaje | Solo Mathews; ecosistema cerrado |
| **Artemis / ArcherySuccess / MyTargets** | Diarios de puntuación y análisis de material | 0-30 € | Rondas oficiales, grupos, flechas identificadas, entrenadores | No miden ejecución: piden al usuario auto-evaluarla subjetivamente |
| **Arcs (iOS)** | Scoring popular | — | UX de referencia en iOS | Dominio parcheado (HugeDomains); sin análisis de ejecución |

Dato competitivo nuevo: **MyTargets pertenece ahora a Mantis Tech** (verificado en Play Store). Y **ShotIQ son cursos mentales, no hardware** (corregido en la investigación).

---

## 3. FODA de ArcheryWatch

### Fortalezas (verificadas en código y docs del repo)

1. **Live-view BLE en Android en tiempo real, pantalla apagada incluida.** Nadie lo hace: Garmin pasa por Connect, K Archery es web post-sesión, Mantis obliga a mirar el móvil tras cada tiro sin reloj. Con protocolo propio con cola persistente, ACK doble (reloj→APK→UI), dedup por sid/eid y recuperación FIT — robustez de entrega que ningún competidor documenta.
2. **Traza coloreada por fase** (apertura/apunte/suelta/follow-through) con curvas cuadráticas suaves, punto rojo de suelta, replay interpolado a tiempo real optimizado (anillos cacheados, runs de color), magnitud en escala log con rejilla 1g/2g/4g y regla de tiempos −2s…+2s. Garmin parece dibujar monocolor + punto: **nuestras fases son superioridad visual real, presumirla**.
3. **Escala común de set** (p90×1.3 anclado al reposo) para comparar flechas — Garmin anuncia tendencias, no comparación visual a escala común.
4. **Perfiles de arco/muñeca + calibración de 3 tiros** con aprendizaje de intensidad y postura (coseno ≥0.85) — paridad con «Record Calibration Shot» del manual de Garmin y superior a los umbrales fijos de K Archery.
5. **Fisiología por flecha**: pulso, intervalos RR y RMSSD de estrés anclados al tiro. Garmin lo da por sesión; K Archery por la web de pago; **por flecha no lo da nadie**.
6. **Sets de 3/6 con cierre explícito, reapertura, corrección de límites y deshacer** — la parte de dominio que Mantis/K Archery resuelven peor (sus cierres automáticos generan las quejas de sus reseñas).
7. **Local-first sin servidor**: export/restaurar JSON, cola offline. Lección Bowdometer aprendida por diseño.
8. **Español de primera clase** (K Archery no lo tiene) y coste cero de entrada (el reloj que ya posees).
9. **Mercado desprotegido**: ArcheryX es «Fenix 9 only» (the5krunner citando a DC Rainmaker); todo el catálogo Forerunner/Instinct/Venu + recurvo/barebow queda sin competencia oficial.
10. Detalles de calidad ya resueltos: borrado optimista con bloqueo de reenvíos, dirty-check anti-parpadeo, reproducción monotónica verificada por píxeles, diagnóstico de conexión.

### Debilidades

1. **Sin giroscopio en FR165** → orientación reconstruida solo con gravedad (2 ejes) + brújula (yaw, ya viva y saneada). No podemos publicar «MOA» con sentido físico; ArcheryX/fēnix 9 sí tiene gyro. Mitigación: unidades relativas honestas + soportar FR265/FR965/fēnix (gyro 100 Hz) en el build con degradación elegante.
2. **Sin registro del resultado**: no hay valor de flecha, ni diana de impactos, ni grupos. Las apps de scoring viven de eso, y sin resultado no existe el insight estrella ejecución↔resultado.
3. **Un solo familia de dispositivo** (fr165/fr165m) frente a las 216 de K Archery.
4. **Detección sin campaña etiquetada publicada**: la fiabilidad es la duda n.º 1 de los usuarios del nicho y no tenemos cifras propias (tampoco las tiene nadie — ser los primeros es la oportunidad).
5. **Sin presencia en tiendas**: APK sideload sin Gradle, sin ficha en la IQ Store ni Play; sin iOS.
6. **Análisis en el reloj mínimo**: ArcheryX muestra gráficas post-tiro en el propio reloj; nosotros solo esfera de estado/contadores.
7. **Sin capa de coach/remoto**: la queja n.º 1 del sector es «me dice qué, no cómo» — hoy tenemos `tip` heurístico, sin guía accionable ni informe compartible.
8. Español único (fortaleza local, barrera global).

### Amenazas

1. Garmin extiende ArcheryX a Forerunner en un futuro (no anunciado, pero la firma es explícita en que es su apuesta).
2. Arrow Tempo (accel+micro, scoring IA por cámara) salta a Android/Garmin.
3. Mantis Tech (dueña de MyTargets) integra ejecución+scoring en un ecosistema.
4. La subida de K Archery a 9 €/mes en 2027 puede educar al mercado en suscripciones… o abrir una ventana de migración masiva hacia alternativas de pago único.

### Oportunidades

1. **Publicar precisión de detección** (sensibilidad/especificidad por perfil) — nadie lo hace; resuelve la objeción de compra n.º 1.
2. **Coaching del «por qué»**: frase accionable por fase — la queja transversal contra Mantis.
3. **Ejecución+resultado en la misma flecha** — espacio vacío en TODO el mercado (Artemis pide autoevaluación subjetiva; nosotros medimos).
4. Mantis X8 agotado en su web; BOWdometer muerto → demanda insatisfecha de análisis sin hardware nuevo.
5. Nomenclatura que el mercado está aprendiendo de Garmin/Hoyt (Aim Time, S.E.T., Aim Radius, Break Radius): adoptarla calcula métricas honestas equivalentes.
6. Comunidad decidida en r/Archery, ArcheryTalk y foros Garmin con «ninguna lo hace bien» — nicho ganable con cientos de reseñas.

---

## 4. Igualar el dibujado de ArcheryX (prioridad declarada del usuario)

Lo que el usuario ama de ArcheryX («cómo dibuja y traza») es, según la investigación, **render, no hardware**: Aim Path con replay animado inmediato, punto de suelta, Float Analysis, métricas MOA/SET. Todo ello es replicable y superable sobre nuestra base actual (ya tenemos: fases coloreadas, curvas suaves, replay interpolado optimizado, escala común). Plan concreto:

### 4.1 Paridad (P0)

1. **Auto-replay al llegar la flecha**: hoy hay que pulsar «Reproducir»; ArcheryX promociona «traza inmediatamente tras cada tiro con reproducción animada». Al recibir el evento BLE, animar automáticamente (1,5–2 s) la apertura→apunte→suelta con el cursor luminoso — sin tocar el móvil.
2. **Marca de suelta con momento**: mantener el punto rojo y añadir un destello/ripple (y vibración del móvil si está en mano) al cruzar el instante de la suelta durante el replay.
3. **Scrubber**: barra de arrastre temporal bajo la traza (frame a frame, 0,25×/0,5×/1×). Garmin solo anuncia «playback»; el scrubber es mejora visible y barata sobre `play()` actual.
4. **Doble escala**: (a) escala común bloqueable por sesión (ya existe por set — extender el candado a nivel sesión para comparar días) y (b) «auto-zoom a los últimos 500 ms» — la ventana que decide el tiro. Ejes etiquetados en grados (o MOA-relativo con la advertencia honesta).
5. **Nomenclatura de mercado**: renombrar/complementar métricas → Aim Time (apunte), S.E.T. (apertura→suelta, ya lo mostramos como TIEMPO TIRO), Aim Radius (ya existe RADIO APUNTE), + **Break Radius/Diameter** (radio/diámetro de la nube en el instante de la suelta = desviación RMS a la centróide de las últimas muestras). Mantener Estabilidad 0-100 como índice propio.

### 4.2 Superación (P1)

6. **Float Analysis propia** (existe en ShotView 🔒): elipse 1-2σ de la nube de apuntado, vector de deriva por tramos, y render alternativo de mapa de calor/densidad de la traza (KDE 2D). Nuestra versión coloreada por fase supera la monocolor de Garmin.
7. **Panel H vs V**: separar desviación horizontal (torque de agarre) y vertical (tensión/heave) por tiro y en tendencia — diagnóstico por eje con texto accionable.
8. **Ghost overlay**: comparador actual vs «tiro de referencia» (mejor de la sesión o marcado por el usuario) en la misma escala, con replay sincronizado — extiende el comparador de set existente.
9. **Mini-traza en el reloj tras cada tiro** (pantalla post-tiro estilo fēnix): dibujar la traza diezmada en el FR165 con `drawArc`/polilínea — coste medio, gran efecto demo.
10. **Tarjetas de sesión con thumbnail de traza** + lista de tiros con filtro indoor/outdoor, notas por tiro y marcado de outliers (herencia ShotView/Xero 🔒).

### 4.3 Lo que NO copiar

- No prometer **MOA reales** desde la muñeca del FR165 (sin gyro; deriva y artefacto de tejido → decenas-cientos de MOA de error). Unidades relativas, tendencia personal.
- No añadir colores/efectos que rompan la legibilidad al aire libre ni animaciones que consuman batería en sesión larga: la investigación de usuarios valora claridad > decoración.

---

## 5. Roadmap priorizado

| Prio | Trabajo | Criterio de terminado |
|---|---|---|
| **P0** | Campaña de tiros etiquetados + replay Python/causal + **publicar cifras** (sensibilidad, falsos positivos/hora, duplicados) por perfil | Informe reproducible con sesiones reservadas de validación; cifras en la ficha del producto |
| **P0** | Dibujado ArcheryX §4.1: auto-replay, ripple de suelta, scrubber, doble escala, nomenclatura SET/Aim/Break | Paridad visual verificada en navegador + teléfono físico |
| **P0** | Valor de flecha rápido: tras cada tiro detectado, tap opcional en diana (posición→valor) + grupos | Correlación ejecución↔resultado visible por set (frase-insight) |
| **P1** | Float Analysis (elipse, deriva, heatmap) + panel H/V + frases de coaching accionables por fase | Cada métrica con una interpretación y una acción sugerida, etiquetadas como observacionales |
| **P1** | Fisiología por flecha terminada: FC en la suelta, RMSSD de los ~30 s previos (ya hay RR), deceleración pre-tiro | «FC en la suelta» junto a cada flecha; etiqueta «indicador de estado» |
| **P1** | Multi-dispositivo: sonda runtime de gyro + build FR265/FR965/fēnix con fusión gyro (pitch/roll relativos por tiro, ventana ≤3 s, re-zero por tiro) | Instalación en un segundo Garmin real; modo gyro guardado en los datos; degradación elegante sin gyro |
| **P1** | Export CSV (tiros, métricas, trazas) + notas + outliers + tarjetas de sesión con thumbnail | Ida y vuelta; CSV legible en Excel; compatible como capa sobre ArcherySuccess/MyTargets |
| **P2** | Voz del score (TTS español), modo estabilizador A/B, informe compartible (PDF/enlace) para coach remoto | Sesión compartible sin cuenta ni servidor |
| **P2** | Distribución: ficha IQ Store (máximo dispositivos del SDK), Play Store, precio ancla 9,99–14,99 € pago único; ES+EN | 3-5 reseñas reales; vídeo demo del live-view (equivalente al demo de K Archery, superado) |
| **P2** | Rondas: 10-20 oficiales frecuentes (WA 720, Vegas, 3-spot, field) + práctica libre; registro flecha-a-flecha con orden | Ronda configurada en <30 s; NO clonar Arcs (600+ rondas, clubes) |
| **P3** | Follow-through cuantificado (dirección/magnitud 300 ms post-suelta), clicker→suelta (MCRT) con marca manual | Métrica validada con la campaña etiquetada |
| **P3** | Vídeo sync, nube, multi-arquero/torneo | Solo si añaden valor probado — terreno de Ianseo/Rcherz, no competir |

**Qué no hacer nunca** (trampas documentadas del sector): suscripción obligatoria (Strikeman 9,99 $/mes es el blanco de Mantis; K Archery 9 €/mes quemará usuarios), dependencia de servidor para lo ya pagado (Bowdometer murió así), prometer impacto/puntuación automática (escepticismo documentado contra el scoring por cámara), prometer mejora garantizada de puntuación (argumento de los escépticos contra el score de Mantis), ni uso en competición (ASA prohíbe teléfonos).

---

## 6. Posicionamiento y segmento

- **Segmento diana**: arquero olímpico/compound que **auto-entrena sin coach** (evidencia de usuarios: es quien paga por interpretación de datos). Recurvo → mensaje de timing/proceso (el float es normal); compound → steadiness/micro-estabilidad (evidencia científica más sólida). La caza es el segmento MENOS receptivo (rechazo documentado al Xero A1i de 1.200 $) — no orientar el marketing a él.
- **Mensaje**: «sin pegar nada a tu arco, sin suscripción, en tu Android al segundo». El precio mental a batir: 15 € de K Archery y «2-3 clases con un coach».
- **Honestidad como marca**: unidades relativas, «sin dato» cuando no se puede medir, traza = movimiento relativo de muñeca. La investigación muestra que la credibilidad es el activo escaso del nicho (scores opacos, MOA sin validación): la transparencia publicada es ventaja competitiva, no modestia.

## 7. Métricas: qué podemos prometer desde un FR165

| Métrica | ¿La tenemos? | Estatuto honesto |
|---|---|---|
| Detección de suelta + segmentación de fases | Sí (v2.7+) | Publicar precisión tras campaña etiquetada |
| Aim Time / S.E.T. / ritmo entre flechas | Sí | Tiempos reales del sensor |
| Steadiness (tremor/RMS últimos 500 ms) | Parcial (estabilidad 0-100) | Proxy relativo validado por literatura (PLoS ONE 2023; Sports Biomech 2025) |
| Aim/Break Radius | Radio de apunte ya; Break en P0 | Unidades relativas/grados, no MOA físicos |
| Traza de apuntado 2D | Sí (accel+brújula saneada) | Movimiento relativo de muñeca, nunca trayectoria óptica |
| FC/RR/RMSSD por flecha | Sí (RR ya fluye) | Indicador de estado, no garantía |
| MOA «reales» | NO (sin gyro en FR165) | Solo con gyro (FR265/965/fēnix) y aun así etiquetado |
| Salida de flecha / impacto / puntuación automática | NO | Registrar valor manual por tap; sin cámara |
| Follow-through cuantificado | No aún (P3) | Dirección/magnitud post-suelta relativa |

---

## 8. Cambios frente al análisis del 16/09

[competencia-arqueria.md](competencia-arqueria.md) sigue vigente en sus P0 (datos, tandas, honestidad, prueba etiquetada). Esta síntesis añade: verificación de que ArcheryX no llega a Forerunner (mercado desprotegido), el plan de dibujado §4 (nueva prioridad del usuario), el puente ejecución↔resultado como insight estrella, la nomenclatura Garmin/Hoyt, el dato MyTargets→Mantis, Bowdometer muerto como lección, y la base científica de las métricas honestas.
