# Investigación: análisis de tiro de arquería SOLO con acelerómetro en Forerunner 165 (Connect IQ)

**Fecha:** 2026-09-17
**Contexto:** ArcheryWatch (app Connect IQ / Monkey C) para Garmin Forerunner 165. El FR165 no tiene giroscopio. Referencia comercial: Garmin ArcheryX (fēnix 9, con acelerómetro+giroscopio) vía ShotView. Objetivo: saber qué calidad de análisis es alcanzable con el acelerómetro de muñeca y qué otros sensores/datos expone el reloj.

**Método y niveles de confianza usados en todo el documento:**
- **[P]** = verificado en fuente primaria (documentación oficial de la API Toybox en developer.garmin.com, documentación OFFLINE del SDK 9.2.0 local en `tools/ciq/sdk/doc/` — mismo contenido, generado 2026-06-09 —, definición del dispositivo `fr165` descargada del SDK Manager, y páginas de producto de Garmin).
- **[S]** = fuente secundaria fiable (reseñas técnicas detalladas, foros de desarrolladores de Garmin, prensa especializada).
- **[I]** = inferencia/física propia razonada (marcada siempre; ninguna inferencia se presenta como verificada).

---

## 0. Resumen ejecutivo

**Qué SÍ se puede con acelerómetro de muñeca a 25 Hz (verificado [P] el límite de la API y [S]/[I] la técnica):**

1. **Detectar la suelta** por impulso de potencia/jerk con ventanas de energía y umbral adaptativo. El sample oficial de Garmin usa exactamente `sampleRate => 25` Hz [P]. A 25 Hz el transitorio de la suelta se ve como un pico de energía en banda baja, no como onda (Nyquist = 12,5 Hz).
2. **Segmentar el ciclo de tiro** (montaje→apertura→anclaje→apunte→suelta→follow-through) por energía y varianza de la señal, con métricas de timing comparables entre tiros. La literatura lo ha hecho con acelerómetros, aunque mayoritariamente con el sensor montado en el arco o en la mano; en muñeca es más difícil pero factible (sección 2).
3. **Estabilidad de apunte RELATIVA**: pitch/roll respecto a la gravedad (la API los da ya calculados en grados, o se calculan con `atan2`) durante la ventana quasi-estática de apunte. Como *índice comparativo entre tiros* es útil; como *MOA reales* NO (física en sección 3).
4. **Timing**: apertura, tiempo de anclaje→suelta, tiempo de apunte, follow-through (energía residual post-suelta), ritmo entre tiros.
5. **Fusión fisiológica**: intervalos latido-a-latido (RR) en ms vía `Sensor.HeartRateData.heartBeatIntervals` [P], pulso 1 Hz vía `Sensor.enableSensorEvents` [P], SpO2, temperatura de piel, presión barométrica (indoor/outdoor) vía `SensorHistory` [P] — todas presentes en la superficie API del FR165 [P].

**Qué NO se puede (física, no limitación de implementación):**

1. **Radio de apuntado real en MOA** (lo que anuncia ArcheryX): 1 MOA = 0,0167°, y la inclinación por acelerómetro tiene ruido del orden de décimas de grado *en reposo perfecto* y grados con el artefacto de tejido blando de la muñeca. Además el acelerómetro solo da 2 ejes (roll/pitch), nunca el yaw.
2. **Trayectoria de la flecha, puntuación en diana, agrupación**: la doble integración de la aceleración deriva de forma no acotada (error >150 m a los 60 s incluso con un IMU de calidad, citado de Woodman, Cambridge TR-696 [P-académico]); el movimiento del arco (centímetros) es irrecuperable, y la flecha ya ni siquiera está conectada al sensor.
3. **Yaw/azimut absoluto del brazo sin giroscopio**; solo parcialmente sustituible si el magnetómetro del FR165 resulta accesible en runtime (a verificar).

**Top 5 mejoras concretas, ordenadas por impacto/esfuerzo** (detalle en sección 4):

| # | Mejora | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 1 | Detector de suelta por potencia (`power` incluida en la API) + jerk, con refractario y estados de fase | Alto | Bajo |
| 2 | "Sway score" relativo: desviación típica de pitch/roll en la ventana de apunte (no MOA) | Alto | Bajo |
| 3 | Timing completo del ciclo + follow-through (energía post-suelta) | Alto | Bajo-Medio |
| 4 | Grabar acelerómetro crudo a FIT con `SensorLogging.SensorLogger` y analizar offline (replay en PC ya existe en `tools/replay_detector.py`) | Alto (desbloquea iteración) | Medio |
| 5 | Sonda en runtime: `:magnetometer`, `getMaxSampleRate()`, `getPressureHistory()` — si el magnetómetro da datos, yaw → traza de apunte 2D; si no, calibración guiada de poses muñeca→arco | Medio-Alto | Medio |

---

## 1. Sensores y datos que la API Connect IQ expone en el FR165

### 1.1 Hardware del FR165 (spec oficial Garmin)

Lista de sensores interna según la página oficial de Garmin Malaysia (misma ficha técnica que la global, que en garmin.com carga por JS): **"Barometric altimeter. Compass, Only supports electronic compass calibration. Accelerometer. Thermometer. Ambient light sensor."** además de GPS/GLONASS/Galileo, **Garmin Elevate V4** (pulso óptico) y **Pulse Ox** [P: https://www.garmin.com.my/products/wearables/forerunner-165-black/].

- **SÍ tiene**: acelerómetro 3 ejes, brújula (magnetómetro), barómetro, termómetro (de piel), sensor de luz ambiental, pulso óptico, pulsioximetría.
- **NO tiene giroscopio**: ninguna lista oficial de sensores lo menciona (en contraste, el fēnix 9 sí lista "Gyroscope" en el comparador oficial de Garmin [P: https://www.garmin.com/en-US/compare/?compareProduct=886725&compareProduct=730659]).
- **Matices importantes sobre el barómetro**: aunque el hardware figura en la ficha, Garmin soporte llegó a decir a un usuario que "el FR165 no tiene altímetro barométrico", y una actualización de firmware **retiró el campo de datos de elevación**; los usuarios reportan deriva grande de altitud que se arregla limpiando el puerto del sensor tras la tapa trasera [S: https://forums.garmin.com/sports-fitness/running-multisport/f/forerunner-165-series/419867/altitude-inaccuracy-on-fr-165]. DC Rainmaker lo lista como presente [S: https://www.dcrainmaker.com/2024/02/garmin-forerunner-165-depth-review.html]. Conclusión práctica: **asumir que el barómetro existe pero verificar en runtime** si `SensorHistory.getPressureHistory()` y `Sensor.Info.pressure` devuelven datos útiles en TU unidad (ver sección 5).
- **La brújula "only supports electronic compass calibration"** [P: ficha MY] sugiere que no hay brújula magnética dedicada tipo puntero; el magnetómetro existe pero su exposición a CIQ hay que probarla (sección 1.2.3).

**Nota de firmware/CIQ:** la definición oficial del dispositivo descargada del SDK Manager (SDK 9.2.0, sept. 2026) declara `fr165` como **deviceGroup "API level 5.2"**, part number 010-02863-20, `connectIQVersion 5.2.0`, `firmwareVersion 2502` [P: `%APPDATA%\Garmin\ConnectIQ\Devices\fr165\compiler.json`]. El equipo del proyecto reporta firmware **29.05** (la numeración actual de FR165 va por 24.12 → 28.x [S: https://forums.garmin.com/sports-fitness/running-multisport/f/forerunner-165-series/418010/forerunner-165---software-version-24-12---100]) y sistema CIQ 6.0.2. Toda la API de sensores relevante (2.3.0–5.1.1) está por debajo de 5.2, así que **esta discrepancia no cambia ninguna conclusión de este informe**; verificación pendiente en Ajustes > Sistema > Acerca de.

### 1.2 Toybox.Sensor — datos de alta frecuencia (acelerómetro)

#### 1.2.1 `registerSensorDataListener` — la API central [P]

Firma completa (doc offline SDK 9.2.0, `doc/Toybox/Sensor.html`, idéntica a https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor.html):

```
registerSensorDataListener(listener, options) as Void
options = {
  :period as Number,                    // ventana de batching (ver ejemplo oficial: 1 = 1 segundo, máx. 4 s)
  :accelerometer as { :enabled, :sampleRate, :includePower, :includePitch, :includeRoll, :includeTimestamps },
  :gyroscope     as { :enabled, :sampleRate, :includeTimestamps },
  :magnetometer  as { :enabled, :sampleRate, :includeTimestamps },
  :heartBeatIntervals as { :enabled },
  :synchronous as Boolean
}
```

- El **ejemplo oficial de la documentación** pide `:period => 1, // 1 second sample time` y `:sampleRate => 25 // 25 samples` [P]. El sample oficial `samples/PitchCounter/source/PitchCounterProcess.mc` del SDK usa exactamente `{:period => 1, :accelerometer => {:enabled => true, :sampleRate => 25}}` [P].
- Excepciones: `TooManySensorDataListenersException` (solo un listener global) y `Lang.InvalidOptionsException` [P].
- La mayoría de métodos de configuración de sensores "provocan crash si se llaman desde una app tipo data field" [P] — relevante si algún día portamos la detección a data field.
- "Magnetometer data is not supported in synchronous data request" [P].

#### 1.2.2 Qué llega en el callback: `Sensor.SensorData` y unidades [P]

- `accelerometerData` (`Sensor.AccelerometerData`, API 2.3.0): arrays **x, y, z en milli-G ("1000 Milli G = 1 G")**; `power` = módulo vectorial en milli-G; **`pitch` y `roll` ya calculados, en GRADOS**, con las fórmulas oficiales `pitch = atan2(y, sqrt(x^2+z^2))` y `roll = atan2(-x, z)` (referenciadas a NXP AN3461 "Tilt Sensing Using a Three-Axis Accelerometer"); `timestamp` en ms (API 5.1.1, puede ser null) [P: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/AccelerometerData.html].
- `heartRateData` (`Sensor.HeartRateData`, API 3.0.0): `heartBeatIntervals` — **intervalos latido-a-latido en milisegundos** [P: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/HeartRateData.html].
- `gyroscopeData` (API 3.3.0, deg/s) y `magnetometerData` (API 3.3.0, milliGauss) existen como clases [P: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/GyroscopeData.html y .../MagnetometerData.html].

**Tasa de muestreo máxima:**
- La documentación no fija una cifra universal; expone `Sensor.getMaxSampleRate()` (API 2.3.0) y `Sensor.getMaxSampleRateForSensorType()` (API 3.4.5, símbolos `:accelerometer`/`:gyroscope`/`:magnetometer`) para consultarlo **en runtime por dispositivo** [P].
- Evidencia de foros de desarrolladores: el máximo del acelerómetro en relojes de esta familia es **25 Hz** (verificado en FR245 por otro desarrollador), mientras que el **giroscopio** de dispositivos con giro llega a **100 Hz**; hay petición abierta de la comunidad para subir el acelerómetro a 100 Hz sin respuesta oficial [S: https://forums.garmin.com/developer/connect-iq/f/discussion/264081/fr235-accelerometer-max-sample-rate, https://forums.garmin.com/developer/connect-iq/f/discussion/346428/garmin-sensor-data-finally-catching-up-to-apple]. No existe ningún modo público de "alta frecuencia" por encima del máximo devuelto por `getMaxSampleRate()` [I a partir de las fuentes anteriores; verificación runtime en sección 5].
- **Rango**: la documentación no declara el rango máximo en G del acelerómetro del FR165 [ausencia verificada en las páginas citadas]. Con unidad en milli-G y uso deportivo, asumir que el disparo de una suelta (varios G en el arco, menos en muñeca) entra en rango es razonable pero **sin verificar** [I].

#### 1.2.3 Gyro y magnetómetro en el FR165: distinción API vs hardware

El `fr165.api.debug.xml` local (superficie API del dispositivo) **contiene** los símbolos `GyroscopeData`, `MagnetometerData`, `registerSensorDataListener`, `getMaxSampleRateForSensorType` [P]. PERO las listas "Supported Devices" de esas clases son de **nivel de API, no de hardware**: el FR55 (sin brújula ni giro) también aparece en ellas [P: doc offline]. Por tanto:

- **`:gyroscope`**: el FR165 no tiene giroscopio (sección 1.1). Pedirlo compila, pero no debe producir datos útiles. **A verificar en simulador/dispositivo** (esperado: `gyroscopeData` null o vacío).
- **`:magnetometer`**: el FR165 SÍ lleva brújula/magnetómetro según la ficha oficial [P: ficha MY]. Es la vía potencial para obtener **orientación en yaw** (parcial sustituto del giro). **A verificar en runtime**: pedir `:magnetometer` con `:sampleRate` y comprobar si llegan arrays con valores plausibles (tierra ~50 µT ≈ 50-100 en milliGauss... ojo al factor de escala real de Garmin, no documentado) [I].

#### 1.2.4 Datos a 1 Hz: `enableSensorEvents` + `Sensor.Info` [P]

`Sensor.enableSensorEvents(listener)`: "Sensor events are retrieved from any enabled sensors at a rate of 1 Hz" [P]. `Sensor.Info` expone: `accel` (x,y,z milli-G, API 1.2.0), `mag` (milliGauss, 1.2.0), `heartRate` (bpm), `altitude` (m), `pressure` (Pa, "calibrated to sea level"), `temperature` (°C), `heading` (radianes desde el norte verdadero), `cadence` (rpm), `power` (W), `oxygenSaturation` (%) [P: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/Info.html]. Nota oficial: "Some devices do not enable the accelerometer at startup" — puede haber que activar sensores con `enableSensorType`/`setEnabledSensors` [P].

### 1.3 Toybox.SensorHistory — series históricas

Funciones disponibles en el FR165 (todas presentes en `fr165.api.debug.xml` [P]): `getHeartRateHistory` (bpm), `getPressureHistory` (**Pascales**), `getElevationHistory` (m), `getTemperatureHistory` (°C), `getOxygenSaturationHistory` (%), `getStressHistory` (0-100), `getBodyBatteryHistory` (0-100) [P: https://developer.garmin.com/connect-iq/api-docs/Toybox/SensorHistory.html]. Cada muestra llega como `SensorSample{data, when}` [P].

- **Resolución temporal**: "The time between each SensorSample ... is device dependent" y "The amount of information that is available is device dependent" [P: doc offline `doc/Toybox/SensorHistory.html`]. Garmin no publica la tasa por serie; medir en dispositivo (sección 5).
- Heart rate, presión, elevación y temperatura solo están disponibles **"up to the last power cycle"** [P].
- **NO existe serie histórica de aceleración** en SensorHistory (la acelerómetro de alta frecuencia solo por listener o SensorLogging) [P: ausencia en el módulo].

### 1.4 ANT/ANT+ y Bluetooth

- `Toybox.Ant` está disponible en el FR165: canal de recepción genérico (`Ant.CHANNEL_TYPE_RX_NOT_TX`, `Ant.Message`, `Ant.BurstPayload`, `Ant.NETWORK_PUBLIC`, `Ant.ChannelAssignment`, `Ant.DeviceConfig`, `Ant.CryptoConfig`) [P: `fr165.api.debug.xml`]. Con un canal RX genérico se puede recibir **cualquier dato ANT+ estándar** (p. ej. cadencia, potencia de bicicleta, podómetro) parseando el mensaje [P API / I en el detalle de perfiles].
- `Toybox.AntPlus` (legacy) en el FR165 incluye: `BikeCadence`, `BikeSpeed`, `BikeSpeedCadence`, `BikeLight`, `BikeRadar`, `Shifting`, `CommonData`, `BatteryStatus`, `ManufacturerInfo`, `ProductInfo`, `LightNetwork`… [P: `fr165.api.debug.xml`]. **No aparece el perfil `HeartRate` legacy**: los sensores externos de pulso se consumen por el sistema (`Sensor.SENSOR_HEARTRATE` remoto) [I a partir de la lista de símbolos].
- El manual del FR165 documenta emparejar sensores ANT+ (y Bluetooth en el modelo Music): pulsómetro externo, podómetro (Foot Pod), velocidad/cadencia, luces, radar, `tempe` (temperatura externa ANT+) [P: https://www8.garmin.com/manuals/webhelp/GUID-607F08F6-33FC-40BF-9727-84E54043D82D/EN-US/Forerunner_165_Series_OM_EN-US.pdf, sección "History" según resultados de búsqueda; verificado como texto del manual vía https://www8.garmin.com/manuals/webhelp/... — el PDF no se pudo extraer íntegramente en esta investigación; la lista procede del resumen de búsqueda del propio manual] [P-parcial].

### 1.5 GPS / Position

`Toybox.Position` en el FR165: `enableLocationEvents` (modo `LOCATION_CONTINUOUS`/`LOCATION_ONE_SHOT`), `getInfo`, `parse`, y `hasConfigurationSupport` con constantes `CONFIGURATION_GPS`, `CONFIGURATION_GPS_GLONASS_GALILEO_BEIDOU_L1`, `CONFIGURATION_GPS_GLONASS_GALILEO_BEIDOU_L1_L5` [P: `fr165.api.debug.xml`]. El `simulator.json` del FR165 configura la constelación "All SKUs" = **GPS L1 + Galileo L1 + GLONASS + BeiDou L1** (sin multibanda L5) [P: `Devices/fr165/simulator.json`]. Para tiro en campo cubierto, el GPS aporta poco; útil para localizar el rango al aire libre.

### 1.6 Otras APIs relevantes al proyecto

- **`SensorLogging.SensorLogger`**: graba acelerómetro (y en dispositivos con giro, giro) directamente a un FIT de alta frecuencia; presente en la superficie API del FR165 [P: `fr165.api.debug.xml`; uso descrito en https://developer.garmin.com/connect-iq/api-docs/Toybox/SensorLogging.html]. Es la vía para **no perder crudo** y analizar en PC.
- **`ActivityRecording.createSession`**: registrar la sesión como actividad en Garmin Connect [P: símbolo presente].
- **`Attention`**: `vibrate`, `VibeProfile`, `playTone`, `ToneProfile` — biofeedback háptico al detectar la suelta [P: símbolos presentes].
- **`Communications`**: `makeWebRequest`, `openWebPage`, `registerForPhoneAppMessages` — puente con companion en el móvil [P: símbolos presentes].
- **`FitContributor`**: presente [P: 8 referencias en `fr165.api.debug.xml`].
- **Procesos en segundo plano**: el FR165 soporta app type `background` con límite de memoria de 65.536 bytes [P: `compiler.json` appTypes]; las restricciones de CPU de background de CIQ hacen inviable monitorización continua en segundo plano (diseñar el flujo como app interactiva) [S/I].
- **Luz ambiental**: el FR165 la monta [P: ficha MY] pero **no existe ninguna API pública CIQ para leerla** (no hay clase en Toybox) [P: ausencia en módulos de `fr165.api.debug.xml`].
- **Temperatura**: la expuesta es la de piel; Garmin advierte en su manual que la lectura está afectada por la temperatura corporal [S: manual FR165, advertencia estándar; el sensor interno figura en ficha MY].

### 1.7 Qué es de fēnix/otros y NO aplica al FR165

- **Giroscopio a 100 Hz por `registerSensorDataListener`** [S: foro 346428]: solo en dispositivos con giro hardware (fēnix 9 sí lo tiene [P: comparador Garmin]). **No aplica al FR165.**
- **ArcheryX** es una actividad nativa anunciada por Garmin solo para **fēnix 9 / fēnix 9 Pro** (2026) [P: https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/; S: https://www.archerytalk.com/threads/new-garmin-watch-has-archery-feature.6391437/]. Usa el acelerómetro y el giroscopio del reloj para seguir el brazo del arco y registra 7 métricas por flecha (análisis de la rotura del tiro, tiempo de ejecución, contador de flechas, **steadiness en minutos de ángulo (MOA)**, traza de apunte con playback animado, timing, y FC/respiración/estrés de la sesión), con análisis en la app móvil ShotView [S: https://the5krunner.com/2026/08/25/garmin-archeryx-explained/; P para existencia/dispositivos: nota de prensa Garmin]. No es una app CIQ instalable en FR165.
- **Módulos absent en el FR165** que sí existen en rangos superiores (multibanda `Positioning` nuevo, mapas, etc.): no afectan a sensores [P: lista de módulos de `fr165.api.debug.xml` — 23 módulos, sin Toybox.Positioning como módulo de maps].

---

## 2. Procesado de señal con acelerómetro triaxial a 25 Hz en muñeca

### 2.1 Qué mide realmente el sensor (base física) [I, con base citada]

Un acelerómetro mide **fuerza específica** `f = a − g` (en el reposo, la reacción a la gravedad: 1 g hacia arriba). Con el brazo quieto, x/y/z dan la inclinación respecto a la vertical (fórmulas pitch/roll citadas por Garmin de NXP AN3461 [P]). En cuanto hay aceleración lineal del brazo, se mezcla con la gravedad y la inclinación instantánea deja de ser recuperable salvo que la aceleración dinámica sea pequeña frente a 1 g. Con la señal muestreada a 25 Hz:
- Resolución espectral útil: 0–12,5 Hz (Nyquist). La vibración de retroceso del arco (decenas–cientos de Hz) llega **aliasada**; solo su envolvente de energía es interpretable [I].
- A través de la muñeca, el acoplamiento brazo-reloj pasa por tejido blando: el reloj ve una versión amortiguada y retrasada del movimiento del antebrazo [I, consistente con la literatura de wearables].

### 2.2 Técnicas de detección de suelta y sus fallos

| Técnica | Cómo | Dónde falla |
|---|---|---|
| **Energía en ventana deslizante** (RMS o `power` de la API) | Pico de energía = evento | Falsos positivos con gestos (recoger flechas, vitorear); mitiga: umbral adaptativo + período refractario + exigir ventana de apunte previa de baja energía [I] |
| **Jerk** (derivada de la aceleración) | La suelta es el mayor cambio brusco del ciclo | Amplifica ruido; a 25 Hz la derivada sobre 1-2 muestras es frágil → suavizar o usar diferencia de energía entre ventanas [I] |
| **Zero-crossing / frecuencia de cruces** | Caracteriza "actividad" vs "apunte" | Sensible al ruido de cuantización en millones de G; usar tras filtro paso-bajo [I] |
| **Plantillas / DTW** | Comparar con 5-10 sueltas del propio arquero | Requiere plantillas por arquero/tipo de arco; coste computacional en Monkey C; funciona mejor para confirmar que para descubrir [I; respaldado por éxito de plantillas en deportes con wearables] |
| **ML ligero** (árboles/regex sobre features) | Features por ventana (media, var., energía por banda) | Overfitting por sujeto; la literatura de arquería con muñeca+PPG usa ventanas deslizantes (p. ej. tamaño 80 muestras, paso 20) y fases etiquetadas por expertos [S: https://www.researchgate.net/publication/397739451] |
| **Umbral fijo** | Simple | No traslada entre arqueros/arco/calibración de muñeca [I] |

**Evidencia empírica publicada:**
- **E-archery** (Zhao & Salunke, UbiComp 2016): prototipo wearable con acelerómetro para captar la "release" desde el movimiento de la mano [P-académico: https://dl.acm.org/doi/10.1145/2968219.2968577].
- **Ogasawara & Fukamachi (2021), "Archery Skill Assessment Using an Acceleration Sensor"**: sensor de aceleración pequeño montado en el **arco**; detecta automáticamente las fases del ciclo (apunte, suelta, follow-through) con procesamiento binario de la señal y lo usan como feedback de nivel [P-académico: https://www.semanticscholar.org/paper/92ed4fd4a6a66e970d77a321471398381746446b]. Ojo: sensor en arco, no en muñeca.
- **Eckelt et al. (2020), "Use of Acceleration Sensors in Archery"** (MDPI Proceedings 49(1):98): dos acelerómetros 3D en las **manos**, análisis sin filtrar, distingue fases del ciclo [S: https://www.mdpi.com/2504-3900/49/1/98].
- **"AI-Based Analysis of Archery Shooting Time from Anchoring to Release"** (MDPI Applied Sciences 14(24):11838, 2024): segmentación de anchoring→suelta con IMU y ML [S: https://www.mdpi.com/2076-3417/14/24/11838].
- **Framework multimodal 2025** (acelerómetro + PPG en muñeca): reconocimiento de acciones de arquería y estimación de estrés; ventanas deslizantes, fases dibujo/apunte/suelta definidas por expertos [S: https://www.researchgate.net/publication/397739451].
- **MantisX/Mantis X8 (referencia comercial en el arco)**: IMU (acelerómetro+giroscopio+magnetómetro) que se monta en el **riel del arco** (rígido, sin artefacto de muñeca); recoge movimiento antes/durante/después del disparo, detecta el evento con algoritmos configurables por tipo de tiro y muestra la dirección del movimiento durante la ejecución (sectores izquierda/derecha/arriba/abajo) [S: https://mantisarchery.com/, https://mantisx.com/pages/mantisx-instructions].

**Conclusión**: la detección de suelta en muñeca es alcanzable (E-archery lo hizo con un prototipo en la mano en 2016), pero todas las métricas finas de apuntado de la literatura y de MantisX se apoyan en el sensor **rígido al arco**. En muñeca, el contrato realista es: detección robusta + timing + índices relativos de estabilidad [I].

### 2.3 Límites de la integración (doble integración) [P-académico]

Woodman, "An introduction to inertial navigation" (UCAM-CL-TR-696, Cambridge, 2007, https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-696.pdf): con un IMU de calidad (Xsens MTx), "the average error in position grows to over 150 m after 60 seconds of operation"; un error de tilt de solo 0,05° proyecta "0.0086 m s^-2" de gravedad sobre el eje horizontal ("about 7.7 m of error after 30 seconds"); el sesgo ε del acelerómetro produce error de posición cuadrático "s(t) = ε·t²/2" y el ruido blanco produce crecimiento en t^(3/2) [P-académico]. Traducción al caso: reconstruir la trayectoria del arco (centímetros, <1 s) por doble integración a 25 Hz con un MEMS de muñeca es **imposible**; la integración solo sirve para velocidad en ventanas de fracciones de segundo, y aun así con deriva visible [I].

### 2.4 Extracción de gravedad vs aceleración lineal [I]

- **Filtro complementario / paso bajo**: gravedad ≈ paso bajo de la señal (corte ~0,1–0,5 Hz); la aceleración lineal ≈ señal − gravedad (paso alto). Válido **solo en fases quasi-estáticas** (apunte). En fases dinámicas (apertura, suelta) la separación es ambigua.
- **Pitch/roll nativos**: la API los entrega ya en grados [P], calculados solo con la muestra instantánea (equivale a filtro estático) — añadir nuestro propio suavizado/paso bajo encima en la ventana de apunte [I].
- La inclinación así obtenida tiene **2 grados de libertad** (roll, pitch). El **yaw es inobservable** con acelerómetro puro (la gravedad no cambia al girar sobre el eje vertical); requieren magnetómetro o giroscopio [I; el papel del magnetómetro y sus límites frente al giro está discutido en Woodman TR-696, sección de magnetómetros].

---

## 3. Métricas físicamente alcanzables y no alcanzables (solo acelerómetro de muñeca)

| Métrica (ref. ArcheryX/MantisX) | ¿Alcanzable en FR165? | Física / razón |
|---|---|---|
| Detección de suelta | **SÍ** | Evento de energía/jerk dominante del ciclo; demostrado con wearables en mano [S: E-archery] |
| Timing del ciclo (apertura, anclaje→suelta, apunte, ritmo) | **SÍ** | Fases separables por energía/varianza a 25 Hz [I; fases validadas en Ogasawara 2021 con sensor en arco] |
| Follow-through (energía post-suelta, quietud) | **SÍ (índice relativo)** | La quietud del brazo tras la suelta es energía baja medible; comparación relativa entre tiros [I] |
| Estabilidad de apunte **relativa** ("sway score", tendencia entre sesiones) | **SÍ (proxy)** | σ de pitch/roll en la ventana quasi-estática; útil comparado, no absoluto [I] |
| **Radio de apuntado en MOA** | **NO** | 1 MOA = 1/60° = 0,0167°. Ruido típico de un MEMS de consumo ~0,1–1 mg → 0,006°–0,06° solo de ruido del sensor [I, orden de magnitud], al que se suma el artefacto de tejido blando de la muñeca (grados durante el apunte real). Además: el acelerómetro solo da **roll/pitch (2 ejes)**; el error en MOA de ArcheryX implica yaw también. Woodman cuantifica lo que un tilt de 0,05° implica: proyección de gravedad de 0,0086 m/s² [P-académico]. Sin giroscopio integrado a alta tasa + montaje rígido, MOA reales no son medibles |
| Orientación absoluta / yaw del brazo | **NO con accel solo; PARCIAL si el magnetómetro responde** | yaw inobservable desde gravedad; brújula del FR165 existe [P: ficha MY] pero exposición CIQ por verificar |
| Trayectoria de la flecha / punto de impacto / puntuación | **NO** | La flecha no lleva sensor; doble integración deriva (Woodman [P-académico]); requeriría cámara/radar/diana electrónica |
| Pulso en suelta / estado fisiológico | **SÍ** | `heartBeatIntervals` (ms) por listener [P] + HR 1 Hz [P]; HRV como proxy de activación/estrés (el framework 2025 usa PPG+accel para exactamente eso [S]) |
| Indoor/outdoor | **PROBABLEMENTE SÍ** | Presión barométrica por `SensorHistory.getPressureHistory`/`Sensor.Info.pressure` [P], sujeto a la fiabilidad del barómetro del FR165 en runtime (sección 1.1) |

**Por qué "MOA solo en 2 ejes y con precisión de grados":** la inclinación respecto a la gravedad se obtiene del ángulo del vector f contra la vertical; ese ángulo tiene 2 componentes (pitch, roll) pero ningún acimut. Durante el apunte el brazo apenas se mueve (quasi-estático) y la componente dinámica es pequeña, de modo que el error angular queda dominado por (a) ruido del sensor (décimas de grado), (b) micro-motion fisiológico del arquero y artefacto reloj-muñeca (típicamente >0,5°), (c) la relación muñeca↔arco no es rígida ni fija (rotación de muñeca cambia el mapeo). El resultado: precisión práctica en el rango de **grados = decenas–cientos de MOA**, frente al objetivo MOA = 0,0167°. Por eso ArcheryX, con giroscopio en el reloj, publica "MOA" como índice de steadiness, y aun así montado en el mismo brazo del arco [I + S(the5krunner)].

---

## 4. Ideas concretas mejorables (ordenadas por impacto/esfuerzo)

1. **Detector de suelta por `power`+jerk (Bajo esfuerzo, Alto impacto).** Usar `:includePower => true` (la API da el módulo ya calculado en milli-G [P]) y detectar el pico con umbral adaptativo (media+k·σ de los últimos N s), período refractario de 2-3 s y requisito de "ventana de apunte" previa (energía baja sostenida ~1 s). Confirmar con plantilla simple (correlación con las últimas 5 sueltas del usuario). Feedback háptico con `Attention.vibrate` [P].
2. **Sway score relativo (Bajo, Alto).** En la ventana de apunte detectada: σ(pitch), σ(roll) (propios por `atan2` o los nativos [P]), inclinación media respecto a la calibrada, y % de tiempo dentro de umbral. Presentarlo como índice 0-100 comparativo, **nunca como MOA**.
3. **Timing completo del ciclo (Bajo-Medio, Alto).** Estados: QUIETO→DRAW (energía creciente sostenida)→ANCHOR/HOLD (energía baja tras pico)→AIM (ventana quasi-estática)→RELEASE (pico)→FOLLOW-THROUGH (1,5 s post-pico, energía residual). Métricas: duración de cada fase, ritmo entre tiros.
4. **Grabar crudo a FIT + replay PC (Medio, Alto).** `SensorLogging.SensorLogger` con `{:accelerometer => {:enabled => true}}` [P; presente en fr165 [P]] + `ActivityRecording.createSession` para sincronizar; así toda mejora de algoritmo se valida sobre datos reales sin recompiar (`tools/replay_detector.py` ya existe en el repo). Pedir `:includeTimestamps => true` (API 5.1.1) si el firmware lo soporta [P].
5. **Sonda de capacidades + magnetómetro (Medio, Medio-Alto).** Pequeña pantalla de diagnóstico que ejecute y muestre: `Sensor.getMaxSampleRate()`, `getMaxSampleRateForSensorType(:accelerometer/:magnetometer)` [P], datos reales de `:magnetometer` (¿llegan milliGauss plausibles al rotar el reloj?), `getPressureHistory` (¿hay muestras?), y RR intervals. Si el magnetómetro responde: fusionar heading con pitch/roll para **traza de apunte 2D** (sustituto parcial del gyro). Si no: **calibración guiada de poses** (2-3 poses del brazo conocidas para estimar la matriz muñeca→arco) [I].
6. **Contexto fisiológico y ambiental (Bajo, Medio).** RR intervals alrededor de cada suelta (RMSSD puntual), HR 1 Hz, temperatura de piel y presión (indoor/outdoor) como covariables de la calidad del tiro [P APIs].

**Sobre "ScienceMode" / alta frecuencia:** no existe en Connect IQ ningún modo público por encima de `getMaxSampleRate()`; las peticiones de la comunidad de 100 Hz de acelerómetro siguen abiertas [S: foro 346428]. "ScienceMode" es una API de Polar (no Garmin) y no aplica [I]. El techo práctico del FR165 es **25 Hz de acelerómetro** (ejemplo oficial [P]; confirmado por desarrolladores en la familia FR [S: foro 264081]) — verificar el valor exacto en la unidad (sección 5).

---

## 5. Verificaciones recomendadas en dispositivo (plan rápido)

1. App de diagnóstico que imprima `getMaxSampleRate()` y `getMaxSampleRateForSensorType(:accelerometer / :magnetometer / :gyroscope)` [P API].
2. Registrar 30 s con `{:period => 1, :accelerometer => {:enabled => true, :sampleRate => 25, :includePower => true, :includePitch => true, :includeRoll => true}}` y contar muestras/s reales.
3. Repetir con `:magnetometer => {:enabled => true, :sampleRate => 25}` y con `:gyroscope => {...}` (esperado: sin datos en FR165).
4. `SensorHistory.getPressureHistory({:period => ...})` y `getTemperatureHistory`: ¿muestras y a qué ritmo? [P API, resolución device-dependent].
5. `:heartBeatIntervals` en reposo y tras esfuerzo: ¿llegan RR en ms y con qué latencia? [P API].
6. Comparar pitch/roll nativos vs `atan2` propio con el reloj sobre una mesa inclinada known-angle.

---

## 6. Fuentes

**API Connect IQ (primarias):**
1. Toybox.Sensor (módulo): https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor.html
2. Sensor.AccelerometerData: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/AccelerometerData.html
3. Sensor.GyroscopeData: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/GyroscopeData.html
4. Sensor.MagnetometerData: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/MagnetometerData.html
5. Sensor.HeartRateData: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/HeartRateData.html
6. Sensor.SensorData: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/SensorData.html
7. Sensor.Info: https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/Info.html
8. Toybox.SensorHistory: https://developer.garmin.com/connect-iq/api-docs/Toybox/SensorHistory.html
9. Documentación offline del SDK 9.2.0 (idéntica a la anterior; generado 2026-06-09): `tools/ciq/sdk/doc/Toybox/Sensor.html`, `.../SensorHistory.html`, `.../Sensor/*.html`; sample oficial `tools/ciq/sdk/samples/PitchCounter/`
10. Definición oficial del dispositivo FR165 (SDK Manager): `%APPDATA%\Garmin\ConnectIQ\Devices\fr165\compiler.json` y `fr165.api.debug.xml`; `simulator.json`
11. Toybox.SensorLogging: https://developer.garmin.com/connect-iq/api-docs/Toybox/SensorLogging.html

**Garmin producto (primarias):**
12. Ficha técnica FR165 (sensores): https://www.garmin.com.my/products/wearables/forerunner-165-black/
13. Página FR165 US: https://www.garmin.com/en-US/p/1055469/
14. Manual FR165 (sensores emparejables ANT+/BLE): https://www8.garmin.com/manuals/webhelp/GUID-607F08F6-33FC-40BF-9727-84E54043D82D/EN-US/Forerunner_165_Series_OM_EN-US.pdf
15. Comparador oficial Garmin (fēnix 9 con giroscopio): https://www.garmin.com/en-US/compare/?compareProduct=886725&compareProduct=730659
16. Nota de prensa ArcheryX (Garmin Newsroom): https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/

**Secundarias:**
17. DC Rainmaker, FR165 in-depth review: https://www.dcrainmaker.com/2024/02/garmin-forerunner-165-depth-review.html
18. Foro Garmin "Altitude Inaccuracy on FR165": https://forums.garmin.com/sports-fitness/running-multisport/f/forerunner-165-series/419867/altitude-inaccuracy-on-fr-165
19. the5krunner, "Garmin ArcheryX explained": https://the5krunner.com/2026/08/25/garmin-archeryx-explained/
20. Lancaster Archery, ArcheryX: https://lancasterarchery.com/blogs/guides-and-information/garmins-archery-x-application-explained
21. Foros desarrollador CIQ: sample rate https://forums.garmin.com/developer/connect-iq/f/discussion/264081/fr235-accelerometer-max-sample-rate ; 100 Hz request https://forums.garmin.com/developer/connect-iq/f/discussion/346428/garmin-sensor-data-finally-catching-up-to-apple ; FIT 25 sps https://forums.garmin.com/developer/connect-iq/f/discussion/353139/save-high-frequency-accelerometer-and-gyroscope-data-to-fit-file
22. Mantis archery (IMU en riel del arco): https://mantisarchery.com/ ; instrucciones: https://mantisx.com/pages/mantisx-instructions

**Académicas:**
23. Woodman, O. "An introduction to inertial navigation", UCAM-CL-TR-696 (2007): https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-696.pdf
24. Zhao & Salunke, "E-archery: prototype wearable for analyzing archery release", UbiComp 2016: https://dl.acm.org/doi/10.1145/2968219.2968577
25. Ogasawara & Fukamachi, "Archery Skill Assessment Using an Acceleration Sensor" (2021): https://www.semanticscholar.org/paper/92ed4fd4a6a66e970d77a321471398381746446b
26. Eckelt et al., "Use of Acceleration Sensors in Archery", MDPI Proceedings 49(1):98 (2020): https://www.mdpi.com/2504-3900/49/1/98
27. "AI-Based Analysis of Archery Shooting Time from Anchoring to Release", Applied Sciences 14(24):11838 (2024): https://www.mdpi.com/2076-3417/14/24/11838
28. "ML-Based Multimodal Framework for Wearable Sensor-Based Archery Action Recognition and Stress Estimation" (2025): https://www.researchgate.net/publication/397739451
29. NXP AN3461 "Tilt Sensing Using a Three-Axis Accelerometer" (referenciada por la propia documentación de Garmin en [2])

---

## 7. Huecos abiertos (sin verificar, no inventados)

- Rango máximo en G del acelerómetro del FR165: no documentado [ausencia].
- Tasa real de las series `SensorHistory` en FR165 y disponibilidad de `getPressureHistory` en esta unidad: device-dependent [P] → medir (sección 5).
- Exposición runtime del magnetómetro en FR165: superficie API presente [P], hardware presente [P ficha MY], datos por `registerSensorDataListener` **sin confirmar**.
- Valor exacto de CIQ del firmware 29.05 del equipo (def SDK dice API level 5.2; el proyecto reporta 6.0.2): verificar en el reloj.
- Tasa de muestreo de MantisX y detalles internos de ArcheryX (algoritmos exactos): no publicados por los fabricantes.
