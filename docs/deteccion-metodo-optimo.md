# Método óptimo de detección de flechas con el FR165 (y toda la familia Garmin portable)

17/09/2026. Síntesis de cuatro investigaciones exhaustivas realizadas hoy, más el análisis del código local (`watchapp/source/ArcheryApp.mc`, `Training.mc`, `tools/replay_detector.py`) y del SDK local 9.2.0 (`bin/devices.xml` parseado íntegro: 165 dispositivos).

Documentos de base:

- [investigacion-deteccion-ciencia.md](investigacion-deteccion-ciencia.md) — 41 fuentes académicas: qué algoritmos funcionan, qué frecuencias hacen falta, qué NO ha publicado nadie (huecos que podemos explotar).
- [investigacion-deteccion-competencia.md](investigacion-deteccion-competencia.md) — cómo detectan K Archery, Garmin ArcheryX, Mantis, Arrow Tempo + 10 patentes con claims extraídos.
- [investigacion-deteccion-opensource.md](investigacion-deteccion-opensource.md) — código verificado de ArcheryShotCounter, Open-Float-Archery, Bangle.js (constantes y líneas exactas).
- [investigacion-deteccion-ciq.md](investigacion-deteccion-ciq.md) — contratos reales de la API Sensor, frecuencias por dispositivo, restricciones de batería/tipo de app.

---

## 0. Conclusión ejecutiva

El método más efectivo con lo que expone el FR165 **no es un umbral mejor: es una arquitectura en dos capas con confirmación por forma**. El patrón que repiten la ciencia, las patentes y todos los competidores es el mismo: **un gatillo barato encuentra candidatos; la FORMA del pulso (tiempo + espectro + plantilla del propio usuario) confirma**. La amplitud sola no discrimina — es exactamente lo que enseñan los impactos de cabeza (87/93 % con <10 features de forma, Sci Rep 2017) y lo que explica por qué el score de Mantis no correlaciona con el resultado.

Nuestro detector ya tiene las piezas correctas (apertura desde reposo, ventana quieta, calibración por perfil, validación de decaimiento). Lo que falta, ordenado por rentabilidad:

1. **Cerrar el ciclo de medición**: log de candidatos RECHAZADOS con motivo y señal (hoy los falsos negativos son invisibles) + re-sincronizar `replay_detector.py` con el detector real (ha divergido: es el v2 sin jerk/apertura/postura/pulso).
2. **Confirmación por forma espectral**: ratio de energía 10–30 Hz / total del candidato (firma de impacto) vs <3 Hz (caminar/reajuste). Es la feature que la literatura valida y que ningún competidor de muñeca documenta.
3. **Plantilla DTW del propio usuario** como segunda confirmación (1 plantilla → 98,6 % en gestos de muñeca, uWave; DTW es además la métrica de consistencia avalada en arquería élite).
4. **Percentil de los propios tiros** (p95–99 de energía durante apunte) en vez de solo mediana×0,6, y **aprendizaje continuo** (todo tiro confirmado actualiza la plantilla y el umbral, con versionado).
5. Mantener el diseño **sin gyro como núcleo** (razón de portabilidad, ver §4: el grupo «accel 100 + mag 50 sin gyro» es amplio y el grupo D de 25 Hz aún más) y usar el magnetómetro solo como confirmación blanda.

Sobre el gyro del FR165: el firmware no lo expone (verificado en `devices.xml`, y la lista «Supported Devices» de `GyroscopeData` que lo incluye está sobre-incluida — la doc oficial se contradice consigo misma; el árbitro es devices.xml + probing en runtime). Si un firmware futuro lo expone, `getMaxSampleRateForSensorType(:gyroscope)` lo revelará sin cambiar una línea si el probing ya está en el arranque (ya existe `runSensorProbe`).

---

## 1. Dónde estamos: el detector actual, auditado

Lo que ya hace bien (y que la investigación valida a posteriori):

| Pieza actual | Validación externa |
|---|---|
| Apertura desde reposo (drawStart/motionSince) | «Abrir con el draw, no con el impulso» — arXiv 2025 demuestra draw reconocible en muñeca a 20 Hz; reduce candidatos a casi cero fuera de sesión |
| Ventana quieta de apunte (preStable, 450 mg) | Gating por contexto validado en la propia arquería (Ogasawara 2021); respaldo biomecánico (buenos arqueros = apunte más estable) |
| Umbral calibrado por perfil (≥3 tiros, mín 900 mg) | «No hay patrón absoluto universal» (Vendrame 2022); Garmin ArcheryX también calibra por arco («one calibration shot teaches the watch what a shot looks like») |
| Postura por coseno ≥0.85 | Equivalente a la segunda compuerta de Open-Float (\|a\| Y \|ω\|) sin gyro |
| Validación de decaimiento (100 ms/600 ms, rechazo >160 ms) | EvenT-ML: alinear la ventana al evento (pre/post) es lo óptimo; rechazo de «impulso sostenido» tiene paralelo en uLift |
| Refractario 1500 ms + recuperación 150 ms | Estándar universal (todos los cronómetros y patentes lo tienen) |
| Diagnóstico de descartes (✕/SACUDIDA, lastPeakDev) | Único en el nicho; la corrección manual siempre disponible es patrón de Garmin y Arrow Tempo |

Debilidades concretas detectadas (mías, sobre el código):

1. **Sin log de rechazados**: `discardInfo`/`lastPeakDev` solo guardan el ÚLTIMO motivo. imposible medir falsos negativos o re-entrenar offline (lo admiten `docs/v2.7-deteccion.md` y Open-Float en su blueprint).
2. **`replay_detector.py` divergió**: es el v2 (umbral fijo, sin jerk, sin apertura, sin postura, sin validación de pulso). Cualquier ajuste de parámetros validado ahí NO valida el firmware.
3. **Umbral = mediana de 3 tiros ×0,6**: estadísticamente débil (n=3), sin percentil, sin aprendizaje posterior; la «postura» se aprende pero la firma de la suelta no.
4. **La confirmación es solo temporal** (decaimiento y anchura): nada espectral, nada de plantilla. Un golpe seco con buen decaimiento pasa.
5. **Jerk crudo sin suavizar** (diff de 1 muestra): el SmoothDiff (diff + media móvil 4-5 muestras) mejora las fronteras en muñeca del arco (arXiv 2025) y cuesta nada.
6. **Mag sin usar en detección** (solo yaw de traza).
7. **Cuadrados vs raíces**: `sample()` hace 3-4 `sqrt` por muestra (mag, jerk) en el camino caliente a 100 Hz.

---

## 2. La evidencia: qué funciona (resumen por fuente)

### 2.1 Ciencia ([deteccion-ciencia](investigacion-deteccion-ciencia.md))

- **Benchmark realista en arquería**: precisión 0,72 / recall 0,80 con validación LOSO (Ogasawara 2021, sensor en arco). El 96,8 % del preprint de muñeca 2025 usa partición por ventana (fuga probable) — techo, no objetivo.
- **Frecuencia**: fases draw/aim/release salen a 20 Hz; el contenido discriminativo del impacto vive en **10–30 Hz** → 100 Hz (Nyquist 50) es el punto dulce; **25 Hz es viable sustituyendo validación espectral por temporal** (duración, decaimiento, DTW).
- **Pocas muestras por usuario**: DTW con 1 plantilla → 98,6 % (uWave); 1/3/5 ejemplos → 55/83/87 % (CHI 2022); SVM de un solo atleta → 0,96 (boxeo). Con calibración de 3-5 tiros estamos en el régimen donde DTW/k-NN gana a cualquier cosa más fancy.
- **Huecos que NADIE ha publicado** (oportunidad de datos propios): dirección y magnitud en g del jolt en muñeca; detección de **let-down** (apertura sin soltar); mag como veto/confirmación; micro-pico del clicker. Quien los mida, publica los primeros números del nicho.
- **Fisiología**: fase del ciclo cardíaco en la suelta como predictor (Keast & Elliott 1990) — ya capturamos RR; barato de registrar y exclusivo.

### 2.2 Competencia y patentes ([deteccion-competencia](investigacion-deteccion-competencia.md))

- **Los 8 patrones que repiten todos**: nadie publica umbrales; calibración por plantilla individual; **verificación en dos etapas** (gatillo barato → verificación rica: HS Produkt pasa de 70 % → 90 % → 99 % por etapas); refractario explícito; ventana acotada alrededor del disparo (ArcheryX analiza «el último segundo»); **el accel satura con el disparo** (US12410985: usar potencia espectral, no amplitud cruda); corrección manual siempre disponible.
- **Kordtech US20230228510A1**: ratios ENTRE EJES como features + umbrales adaptativos que se estrechan (±50 %→±10 %) con tiros calibrados → **aprendizaje progresivo del umbral**.
- **Archery Intelligence US12410985**: umbral de potencia espectral por slices (DFT/KLT) para separar ráfaga de suelta de oscilación post-tiro — la base matemática del ratio de bandas.
- **Arrow Tempo** (espejo exacto nuestro): accel 100 Hz en brazo del arco + pico de audio DEBEN coincidir + detector de caminar que pausa. Valida la fusión con segundo sensor como respuesta a los falsos positivos.
- **Garmin**: «Record Calibration Shot» = 1 tiro que «enseña al reloj cómo es un tiro» + calibración de gyro cada sesión; métricas sobre el último segundo (Break Radius); sin ajuste de sensibilidad expuesto. Recurvo «no compatible todavía».

### 2.3 Open source ([deteccion-opensource](investigacion-deteccion-opensource.md))

- **Vemestael (MIT)**: refractario por defecto 10 s (no 2), configurable 1-30 s; **ventana de asentamiento 300 ms tras re-armar** (muestras fantasma a los 11-17 ms); **latch anti-ráfaga** (un evento por periodo armado); política pura testeable (patrón a copiar para `Tests.mc`).
- **Open-Float (MIT)**: disparo = |a|>12 g **Y** |ω|>1,5 rad/s (compuerta doble; sin gyro → nuestra postura/EMA equivalen); comparar **cuadrados**; freeze de traza 1,5 s post-tiro; «un tiro nuevo cierra el follow-through del anterior»; log por tiro con umbral aplicado.
- **Bangle.js (MPL-2.0, reimplementar sin copiar)**: EMA entera α=1/12 como paso alto O(1) (sustituto de nuestra media de ventana); **compuerta de actividad** para dormir el detector; FSM temporal de validación de secuencia.
- **Float Score (MIT)**: índice de suelta por máximo de `|‖a‖−1|·35 + |ω|` — portable con nuestra magnitud y desviación vectorial; ventanas en segundos parametrizadas por Hz.
- **NO adoptar**: umbral 12 g (es riser+compuesto; muñeca ve 10-20× menos), restar 9,81 a la magnitud (mejor EMA vectorial), mag como criterio (Open-Float lo evita), promediar muestras del periodo (a 25 Hz borra el pico; usar máximo).

### 2.4 Plataforma CIQ ([deteccion-ciq](investigacion-deteccion-ciq.md))

- Grupos oficiales (devices.xml): **A** accel 100 + gyro 100 + mag 50 (FR255/265/570/955/965/970, fēnix 6+, Epix 2, Venu 2/3/4, Instinct 3, Enduro…) · **B** accel 100 + mag 50 **sin gyro** (FR165/165M, Instinct E, Venu Sq 2, vívoactive 5, Approach S50) · **C** solo accel 100 (FR55, Bounce 2) · **D** sin alta frecuencia → planificar 25 Hz (FR245/745/945, fēnix 5, Instinct 2, Venu 1, vívoactive 3/4…).
- `SensorHistory` NO expone accel/mag/gyro (solo HR/presión/estrés/SpO₂/temp) — no hay canal de detección por histórico. `SensorLogging` (FIT) solo en device app y graba a «standard rate» del firmware, no a la pedida.
- `:period => 1` = lotes de ~1 s (a 100 Hz ≈ 100 muestras/lote): latencia acotada; un solo listener; data field imposible; re-negociar tasas tras inactive; `:includeTimestamps` desde API 5.1.1; `:includePower`/`:includePitch`/`:includeRoll` vienen calculados por el sistema (CPU gratis).
- Precedente oficial: el sample **PitchCounter** (25 Hz, FIR + umbrales + quietud + refractario + SensorLogger) es arquitectónicamente nuestro detector — es la referencia que Garmin considera idiomática.

---

## 3. Arquitectura recomendada: «gatillo barato + confirmación por forma, en dos capas»

Máquina de estados (la actual, formalizada y ampliada):

```
IDLE ──movimiento sostenido──▶ DRAW ──quietud estable──▶ AIM ──impulso──▶ CANDIDATE
                                                                     │
                                              confirmación por forma ◀┘ (600 ms)
                                                     │ éxito              │ fracaso
                                                     ▼                    ▼
                                                  SHOT ──refractario── IDLE (log de rechazo)
```

### Capa 1 — portable a 25 Hz (todos los dispositivos, grupo D incluido)

Todo en ms, nunca en muestras (ya lo hace `configureRate`; extenderlo a TODA constante):

1. **Compuerta de actividad** (Bangle): N muestras bajo umbral bajo → detector dormido; se despierta con movimiento sostenido. Ahorra batería y mata falsos por manipulación.
2. **DRAW**: excursión grande sostenida (la actual: Δ>120 mg diezmado con episodios ≥600 ms) — mantener.
3. **AIM**: ventana quieta obligatoria con **calidad medida** (no binaria): sd por eje + tremor 3-10 Hz + heading del mag estable. La calidad es a la vez gate, feature de confirmación y métrica de usuario.
4. **Settle de re-armado 300 ms** tras salir de pausa/refractario (Vemestael; nuestras «muestras fantasma»).
5. **Latch por periodo armado**: un candidato por armado; ráfagas del mismo lote no cuentan doble.
6. **Confirmación temporal** (la actual): decaimiento 100 ms en ≤600 ms, rechazo de sostenido >160 ms, ventana alineada al evento (250-300 ms pre + 600 ms post).

### Capa 2 — con 100 Hz (FR165 y grupos A/B/C), es donde se GANA precisión

7. **Jerk filtrado (SmoothDiff)**: diff + media móvil de 4-5 muestras como feature primaria en lugar del diff crudo.
8. **Ratio de bandas 10–30 Hz**: en ventana ~500 ms alrededor del candidato (FFT 256 o filtro Goertzel por banda — 2 Goertzel por banda es más barato que FFT en Monkey C): `E(10-30Hz)/E(total)` alto = impacto; dominancia <3 Hz = caminar/reajuste. Esta es LA feature que separa suelta de interferentes según la evidencia.
9. **Ratios entre ejes** (Kordtech): proporción de la energía por eje del impulso vs la postura calibrada — captura la DIRECCIÓN del jolt sin necesitar literatura (que no existe: lo medimos nosotros).
10. **Plantilla DTW del propio usuario**: normalizar el pulso (±300 ms alrededor del pico, magnitud normalizada) y comparar con la plantilla del perfil (media de los calibrados). DTW-distance ≤ percentil 75 de los tiros de calibración = confirmación. Con 1 plantilla rinde 98,6 % en gestos de muñeca (uWave); con 3-5, mejor. **Sustituye/complementa el coseno de postura** (que mira orientación, no firma temporal).
11. **Saturación**: comprobar el rango ±g del FR165; si el pico toca fondo, confiar más en bandas/plantilla que en amplitud (lección US12410985).

### Calibración y aprendizaje (el «one shot» de Garmin, hecho mejor)

12. **Calibración rápida opcional de 1 tiro** (paridad Garmin) + **calibración completa de 3-5** (la actual) — el primer tiro de cada sesión confirma la plantilla y ajusta fino.
13. **Umbral por percentil**: p95-99 de la energía de picos durante draw/aim del propio usuario + margen, con suelo por dispositivo (900 mg hoy); sustituye mediana×0,6 con n=3.
14. **Aprendizaje continuo estrechado** (Kordtech): todo tiro CONFIRMADO (no borrado, no manual) actualiza plantilla y estrecha el umbral con asíntota (±50 %→±10 %); todo borrado por el usuario marca la plantilla como «sospechosa» y relaja. Versionar plantilla/umbral para no contaminar histórico.
15. **Perfiles por arco YA existen** — añadir «tipo de arco» explícito (recurvo/compound/barebow/longbow): la firma del jolt cambia con el libraje y la configuración (riesgo documentado).

### Confirmadores blandos (nunca veto duro)

16. **Magnetómetro**: |B| y heading 1 s antes vs después del candidato + alerta de distorsión si |B| se desvía del campo de referencia (riser metálico). Si la distorsión es alta, ignorar el mag esa sesión (auto-degradación AHRS estándar).
17. **RR/HR**: RMSSD de los 20-60 s previos como contexto; fase del ciclo cardíaco en la suelta como dato experimental (nadie lo tiene).
18. **Micro-pico del clicker** (recurvo): pico breve 10-30 Hz en los ~100 ms previos al jolt. Sin precedente publicado — si aparece en nuestros datos, es el marcador más específico posible.

### Rendimiento y batería

19. Comparar **cuadrados** en el camino caliente; EMA entera/vectorial O(1) sustituyendo la media de ventana cuando sea equivalente; `:includePower` para el módulo ya calculado; listener activo SOLO durante la sesión (ya así es); Goertzel por banda en vez de FFT.
20. Un **tiro nuevo cierra el follow-through del anterior** (Open-Float): elimina solapes y acorta POST.

### Observabilidad (sin esto no hay validación posible)

21. **Log persistente de candidatos rechazados**: timestamp, motivo (apertura/quietud/postura/pulso/bandas/refractario), magnitud, y ±300 ms de señal diezmada. Es la pieza que falta para medir falsos negativos y re-entrenar offline; también alimenta el diagnóstico de campo.
22. **Sincronizar `replay_detector.py`** con el detector real (mismas constantes exportadas del firmware, idealmente generadas de una fuente única) — sin equivalencia Python↔Monkey C no se puede ajustar nada con confianza.

---

## 4. Portabilidad: el mapa real de dispositivos

| Grupo | Sensores (devices.xml SDK 9.2.0) | Dispositivos clave | Diseño |
|---|---|---|---|
| **B** (nuestro núcleo) | accel 100 + mag 50, sin gyro | **FR165/165M**, Instinct E, Venu Sq 2, vívoactive 5, Approach S50 | Detección completa capa 1+2; mag como confirmador blando |
| **A** (premium) | + gyro 100 | FR255/265/570/955/965/970, fēnix 6+, Epix 2, Venu 2/3/4, Enduro | Capa 2 con compuerta \|ω\| real (Open-Float) y mejor orientación de traza |
| **C** (mínimo) | accel 100, sin mag | FR55, Bounce 2 | Capa 1+2 sin mag (el detector NUNCA debe exigir mag) |
| **D** (legacy) | sin alta frecuencia → 25 Hz | FR245/745/945, fēnix 5, Instinct 2, Venu 1, vívoactive 3/4 | Capa 1 + confirmación temporal/DTW (sin bandas: Nyquist 12,5 Hz) |

Reglas: probing en runtime al arrancar (ya existe `runSensorProbe`) y guardar resultado; re-negociar tras inactive; ventanas en ms; `:includeTimestamps` (API 5.1.1) para tasa efectiva medida = muestras/Δt; validar `x.size()` por lote. Manifest inicial razonable: FR165/165M + FR55 + FR255/265/965 + un Venu Sq 2/vívoactive 5 + (si se quiere legacy) FR245/945 con «100 Hz recomendado; 25 Hz soportado».

---

## 5. Protocolo de validación (LOSO, interferentes y los 3 huecos)

1. **Captura**: ≥30 tiros × ≥5 perfiles distintos (arco/muñeca/libraje), etiquetados por vídeo/audio (el snap del clicker como marcador objetivo) + **negativos etiquetados**: caminar, recoger flechas, bajar el arco, **let-down**, ajuste de correa, montar/desmontar estabilizadores.
2. **Métricas por perfil (LOSO)**: precisión, recall, FP/hora, duplicados, error temporal. Publicar el benchmark contra Ogasawara 0,72/0,80 — ser los primeros del nicho con cifras.
3. **Medir primero los 3 huecos de la literatura** (salen gratis de la campaña): dirección y magnitud del jolt en muñeca (por eje y tipo de arco), firma del let-down (movimiento de gran excursión SIN impulso agudo final), y aportación real del mag junto al arco (¿|B| distorsionado?).
4. **A/B con el replay sincronizado**: umbral-mediana vs percentil; coseno solo vs coseno+DTW; con/sin bandas; con/sin mag (ablation).
5. Separar sesiones de ajuste y sesiones reservadas de verificación (ya está en la doctrina del repo).

## 6. Parámetros de partida (tabla de decisión)

| Parámetro | Hoy | Propuesto | Origen |
|---|---|---|---|
| Settle tras re-armar | — | 300 ms | Vemestael (fantasmas 11-17 ms) |
| Refractario | 1500 ms fijo | 1500-2000 ms, configurable por perfil (1-30 s rango UI) | Vemestael/patentes |
| Umbral | mediana 3 tiros ×0,6, mín 900 mg | p95-99 energía draw/aim + margen, suelo 900 mg, estrechamiento ±50→±10 % | Kordtech, Vendrame |
| Confirmación | decaimiento+anchura | + ratio bandas 10-30 Hz + DTW plantilla (≤p75) | Sci Rep 2017, uWave |
| Jerk | diff crudo | SmoothDiff (media móvil 4-5) | arXiv 2025 |
| Post | 1200 ms | 1200-1500 ms; un tiro nuevo cierra el anterior | Open-Float |
| Mag | solo traza | confirmador blando + alerta de distorsión \|B\| | Sensors 2014/2018, catch 2020 |
| Rechazados | último motivo | log persistente con señal | necesidad propia + Open-Float blueprint |

## 7. Qué NO hacer

- No prometer ni depender de >50 Hz (intransportable), de mag (no existe en FR55), ni de gyro (no existe en FR165).
- No usar ML entrenado global: con 3-5 ejemplos por usuario, DTW/k-NN + umbrales personales gana según la evidencia, y Monkey C no tiene framework de inferencia razonable.
- No copiar código GPL/AGPL (InfiniTime, Gadgetbridge) ni sin licencia; MIT (Vemestael, Open-Float) apto con atribución; MPL-2.0 (Bangle) reimplementar citando.
- No vetar por mag de forma dura (distorsión del riser no caracterizada).
- No fiarse de las listas «Supported Devices» de la doc online (sobre-incluidas): devices.xml + probing + medición.
- No promediar muestras del periodo en el camino de detección (borra picos a 25 Hz).

## 8. Orden de implementación recomendado

1. **Observabilidad**: log de rechazados + replay sincronizado con constantes compartidas (sin esto, todo lo demás es a ciegas).
2. Perf barato: cuadrados, SmoothDiff, settle 300 ms, latch, «tiro nuevo cierra el anterior».
3. Umbral percentil + aprendizaje continuo versionado + tipo de arco en perfil.
4. Confirmación por forma: bandas Goertzel → DTW plantilla → ratios de ejes (en ese orden de A/B).
5. Campaña etiquetada + medición de los 3 huecos + cifras LOSO publicables.
6. Mag blando + RR contexto + micro-pico clicker (experimentos incrementales con ablation).
7. Multi-dispositivo: manifest ampliado con probing y degradación (grupo D a 25 Hz).
