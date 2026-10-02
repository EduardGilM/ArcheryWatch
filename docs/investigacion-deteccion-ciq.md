# Investigación: capacidades reales de sensores en Connect IQ (Garmin) e implicaciones para el detector de tiros de ArcheryWatch

**Fecha de investigación:** 2026-09-17
**SDK de referencia:** Connect IQ System SDK **9.2.0** (`compilerInfo.xml` y `bin/version.txt` del SDK local en `tools/ciq/sdk/`)
**Objetivo:** maximizar la detección de sueltas de arquería en un Forerunner 165 con lo que Connect IQ expone realmente, y que el código sea portable al resto de familias Garmin.

---

## 0. Método, convención de fuentes y limitaciones

Cada afirmación se etiqueta con una de estas categorías:

| Etiqueta | Significado |
|---|---|
| **[OFICIAL]** | Documentación oficial de Garmin (developer.garmin.com o la copia offline incluida en el SDK) |
| **[FORO]** | Hilo del foro de desarrolladores (forums.garmin.com/developer/connect-iq), recuperado y verificado en esta investigación |
| **[COMUNIDAD]** | Medición o testimonio de comunidad no oficial (reviews, comentarios) |
| **[INFERENCIA]** | Deducción propia a partir de fuentes primarias, explícitamente razonada |
| **[NO VERIFICADO]** | No se pudo recuperar fuente directa en esta sesión |

**Fuentes primarias locales (SDK 9.2.0, docs generados 2026-06-09):**

- `tools/ciq/sdk/bin/devices.xml` — tabla oficial por dispositivo de capacidades CIQ (incluye `<sensor_sample_rate>` con `high_freq_rate`, `accel`, `gyro`, `mag`). Parseado íntegro en esta investigación (165 bloques de dispositivo, 90 con entrada de tasa).
- `tools/ciq/sdk/doc/Toybox/Sensor.html` + subpáginas (`AccelerometerData`, `MagnetometerData`, `GyroscopeData`, `HeartRateData`, `SensorData`, `SensorDelegate`)
- `tools/ciq/sdk/doc/Toybox/SensorHistory.html`, `SensorHistory/SensorSample.html`
- `tools/ciq/sdk/doc/Toybox/SensorLogging.html`, `SensorLogging/SensorLogger.html`, `SensorLogging/SensorLoggingStats.html`
- `tools/ciq/sdk/doc/docs/Core_Topics/Sensors.html` (guía "Sensors")
- `tools/ciq/sdk/doc/docs/Connect_IQ_Basics/App_Types.html` (matriz módulo ↔ tipo de app)
- `tools/ciq/sdk/doc/docs/App_Review_Guidelines/Overview.html` (reglas de publicación)
- `tools/ciq/sdk/samples/PitchCounter/` y `samples/AccelMag/` (código oficial de Garmin)
- Documentación online `developer.garmin.com/connect-iq/api-docs/Toybox/Sensor.html` (verificada en vivo 2026-09-17; generación 2026-08-25, contenido coherente con la copia offline).

**Limitaciones de esta sesión (transparencia):** los buscadores web (DuckDuckGo, Bing, Brave, Ecosia, Mojeek) bloquearon las consultas automatizadas; el CDX de Wayback Machine estuvo intermitente; y la búsqueda interna de forums.garmin.com requiere login. Esto restringió el número de hilos del foro recuperables a los accesibles por URL directa. Los huecos resultantes se marcan **[NO VERIFICADO]**.

---

## 1. API `Toybox.Sensor` — contratos exactos

### 1.1 `registerSensorDataListener()` [OFICIAL]

Fuente: `doc/Toybox/Sensor.html` (SDK 9.2.0) y versión online (2026-08-25). La API de datos de alta frecuencia existe **desde API Level 2.3.0** (la guía Core Topics "Sensors" lo confirma: "Since API level 2.3.0 ... enables developers to implement their own custom motion detection algorithms").

```monkey
Sensor.registerSensorDataListener(listener as Method(data as Sensor.SensorData) as Void, options as {
    :period as Number,
    :synchronous as Boolean,
    :accelerometer as { :enabled, :sampleRate, :includePower, :includePitch, :includeRoll, :includeTimestamps },
    :gyroscope     as { :enabled, :sampleRate, :includeTimestamps },
    :magnetometer  as { :enabled, :sampleRate, :includeTimestamps },
    :heartBeatIntervals as { :enabled }
})
```

Contratos documentados:

- **`:period`**: segundos de datos por lote; **máximo 4 segundos** [OFICIAL].
- **`:sampleRate`**: "samples per second to request in Hz" — se pide, el sistema es el árbitro real del máximo (ver §1.3 y §2) [OFICIAL].
- **Un único listener activo**: "Only one data request is allowed to be registered at a time"; un registro posterior **sobrescribe** el anterior, y lanza `Toybox.Sensor.TooManySensorDataListenersException` si se intenta registrar más de uno [OFICIAL, doc online 2026-08-25].
- **Magnetómetro y modo síncrono**: "Magnetometer data is not supported in synchronous data request" [OFICIAL]. (`:synchronous => true` pide lotes alineados temporalmente entre sensores; incompatible con mag.)
- **Data Field: crash** — "Will cause an app crash if called from a data field app" (nota en `registerSensorDataListener`, `getInfo`, `getMaxSampleRate`, `enableSensorType`, etc.) [OFICIAL].
- Semántica de lotes según la guía oficial: "The callback will get invoked each time a new set of sensor data over the length of time specified in the period option is available" y, con el ejemplo histórico de 4 s a 25 Hz: **"the callback will be invoked every 100 samples taken"** [OFICIAL, `doc/docs/Core_Topics/Sensors.html`]. Es decir: **latencia de entrega ≈ límites del lote**, no por muestra. Con `:period => 1` se recibe 1 entrega/segundo; con `:period => 4`, una entrega cada ~4 s (latencia máxima de detección + duración del análisis).

### 1.2 Campos y unidades de los datos [OFICIAL]

Fuente: `doc/Toybox/Sensor/AccelerometerData.html`, `MagnetometerData.html`, `GyroscopeData.html`, `HeartRateData.html`, `SensorData.html`.

| Objeto | Campos | Unidades | Desde API |
|---|---|---|---|
| `SensorData` (contenedor) | `accelerometerData`, `gyroscopeData`, `magnetometerData`, `heartRateData` (todos `or Null`) | — | 2.3.0 (contenedor); `gyroscopeData`/`magnetometerData` como miembros 3.3.0; `heartRateData` 3.0.0 |
| `AccelerometerData` | `x`, `y`, `z` (`Array<Number>`) | **milli-g** (1000 mg = 1 g) | 2.3.0 |
| | `power` (`Array<Number>`, solo con `:includePower`) | milli-g (módulo vectorial) | 2.3.0 |
| | `pitch`, `roll` (`Array<Float>`, con `:includePitch`/`:includeRoll`) | grados; `pitch = atan2(y, sqrt(x²+z²))`, `roll = atan2(-x, z)` | 2.3.0 |
| | `timestamp` (`Array<Number>`, con `:includeTimestamps`) | **milisegundos** | **5.1.1** |
| `MagnetometerData` | `x`, `y`, `z` (`Array<Number>`); `timestamp` igual que accel | **milliGauss** | 3.3.0 (timestamp 5.1.1) |
| `GyroscopeData` | `x`, `y`, `z` (`Array<Float>`); `timestamp` | **grados/segundo** | 3.3.0 (timestamp 5.1.1) |
| `HeartRateData` | `heartBeatIntervals` (`Array<Number>`) | **milisegundos** entre latidos | 3.0.0 |

"Not if null, all fields are of equal size": todos los arrays de un mismo lote tienen la misma longitud [OFICIAL].

Nota práctica para ArcheryWatch: `:includeTimestamps` requiere **API Level 5.1.1+**; para distribuir al FR165 hay que fijar `minSdkVersion`/`targetSdkVersion` acorde (el FR165 es de la generación API 5.2.0 según `devices.xml`, así que lo soporta; el runtime lo confirma con `(sensorData.accelerometerData has :timestamp)`) [OFICIAL + INFERENCIA de compatibilidad].

### 1.3 `getMaxSampleRate()` y `getMaxSampleRateForSensorType()` [OFICIAL]

- `Sensor.getMaxSampleRate()` — máximo del sistema; **desde API 2.3.0**.
- `Sensor.getMaxSampleRateForSensorType(:accelerometer | :gyroscope | :magnetometer)` — **desde API 3.4.5**. Ambas llevan la nota: **"This function can produce different results after the app transitions to the active state after being inactive"** (AppBase.onActive/onInactive) — el máximo **puede bajar cuando la app pasa a inactiva/low power**. No hay cifra oficial de cuánto baja.
- La lista oficial de dispositivos con `getMaxSampleRateForSensorType` (doc SDK 9.2.0) **incluye** Forerunner 55, 165/165 Music, 255 (todos), 265 (todos), 570 (ambos), 955, 965, 970; fēnix 6/6S/6X (+Pro), fēnix 7 (todos), fēnix 8 (todos), fēnix E, epix Gen 2/Pro, MARQ Gen 1/Gen 2, D2 Mach 1/2, Descent Mk2/Mk3/G2, Enduro 3, Approach S70, Edge 540/840/1040/1050/550/850, Instinct 3 y Crossover AMOLED, Instinct E, Venu 2/2S/2 Plus/3/3S/4, Venu Sq 2, Venu X1, vívoactive 5/6, GPSMAP H1, eTrex Touch, Edge MTB…
- **No aparece en esa lista** (entre otros): FR 245/645/745/935/945/945 LTE, fēnix 5/5 Plus, Instinct 2/2S/2X/Crossover (solares), Venu Sq (1), vívoactive 3/4/4S, Descent Mk1/G1, Enduro (1). En esos modelos hay que usar `getMaxSampleRate()` (2.3.0) o valores fijos [OFICIAL + INFERENCIA].

**Discrepancia documentada doc ↔ devices.xml:** la lista de dispositivos de `GyroscopeData`/`magnetometerData` en el doc online/offline **incluye FR165, FR245 y FR55**, pese a que `devices.xml` del mismo SDK no declara gyro para fr165 ni mag para fr55 (fr55 solo `accel="100"`). Además, el FR245/FR55 no tienen brújula en hardware. Conclusión: **las listas "Supported Devices" por miembro del doc están sobre-incluidas y no son fiables al nivel de capacidad concreta**; `devices.xml` + *probing* en runtime son el árbitro [OFICIAL con contradicción interna + INFERENCIA]. Ejemplo adicional: `Enduro` (1) tiene entrada de tasa en devices.xml pero no aparece en la lista del doc de `getMaxSampleRateForSensorType`.

---

## 2. Frecuencias reales por dispositivo

### 2.1 Qué declara oficialmente el SDK 9.2.0 (`bin/devices.xml`)

`devices.xml` marca con `<sensor_sample_rate high_freq_rate="true" accel="100" [gyro="100"] [mag="50] />` a los dispositivos capaces de alta frecuencia. Resultado del parseo completo (2026-09-17; 165 dispositivos, 90 con entrada):

**Grupo A — accel 100 Hz + gyro 100 Hz + mag 50 Hz** (plataforma completa):
fēnix 6 / 6S / 6X y todas las variantes Pro / quatix 6 / tactix Delta; fēnix 7 (7/7S/7X, Pro, Solar); fēnix 8 (43/47/51, Pro, Solar, MicroLED) y tactix 8 / quatix 8; fēnix E; epix Gen 2 y Pro (42/47/51); MARQ Gen 1 y Gen 2 (todas las ediciones); D2 Mach 1 / Mach 2 (+Pro) / D2 Air X10; Descent Mk2 / Mk2S / Mk3 / Mk3i / G2; **Enduro (1)** y Enduro 3; FR 255 / 255s / 255 Music / 255s Music; FR 265 / 265s; FR 570 (42 y 47 mm); FR 955 / Solar; FR 965; FR 970; Venu 2 / 2S / 2 Plus / 3 / 3S / 4 (41/45) / D2 Air X15 / Venu X1; vívoactive 6; Approach S70 (42/47); Instinct 3 AMOLED (45/50) y Solar (45/50); Instinct Crossover AMOLED; Edge 540 / 840 / 1040 / 1050 / 550 / 850 / Explore 2; GPSMAP H1/H1i; eTrex Touch.

**Grupo B — accel 100 Hz + mag 50 Hz, SIN gyro** (¡incluye el FR165!):
- **Forerunner 165 y 165 Music** [OFICIAL]
- Instinct E 40 / 45 mm
- Venu Sq 2 / Sq 2 Music
- **vívoactive 5**
- Approach S50

**Grupo C — solo accel 100 Hz (sin mag ni gyro):**
- **Forerunner 55** (sin brújula en hardware)
- Bounce 2; Edge MTB

**Grupo D — sin entrada `<sensor_sample_rate>`** (75 dispositivos; no tienen alta frecuencia declarada): FR 45, 230, 235, 245 / 245M, 630, 645 / 645M, 735XT, **745**, 920XT, 935, **945 / 945 LTE**; fēnix 3 / 3 HR / 5 / 5S / 5X (+ Plus) / Chronos; Instinct (1), Instinct 2 / 2S / 2X, Instinct Crossover (solar); Venu (1) / Venu Sq (1); vívoactive HR / 3 / 3M / 3 Music LTE / 4 / 4S; Descent Mk1 / G1; Edge 520/530/820/830/1030/1000/130…; Legacy Saga/Hero; Montana/Oregon/Rino 7xx; GPSMAP 66/67/86; Garmin Swim 2; etc.

**Sobre el valor por defecto de 25 Hz:**
- No hay ninguna frase oficial del tipo "los dispositivos sin `high_freq_rate` entregan 25 Hz" [OFICIAL, ausencia].
- Evidencia convergente: (a) el ejemplo canónico de la guía oficial usa 25 Hz ("4 s a 25 Hz → callback cada 100 muestras") [OFICIAL]; (b) el sample oficial PitchCounter pide `:sampleRate => 25` y su callback procesa lotes con paso de 40 ms/muestra (constantes `Q_RANGE = 100*40`) [OFICIAL]; (c) hilo del foro (FR945, ~2020-21): con `:period => 1` llegan **~25 muestras por entrega** [FORO, thread 265135]; (d) la única división de capacidades que aparece en devices.xml es exactamente `high_freq_rate="true"` → 100 Hz [INFERENCIA sólida].
- **Conclusión operativa:** sin `high_freq_rate`, planificar para **25 Hz máx**; con ella, 100 Hz en accel y 50 Hz en mag; gyro a 100 Hz solo Grupo A [INFERENCIA a partir de OFICIAL].

### 2.2 Medición de comunidad

- Hilo "Heartrate at high sample rate" (forums.garmin.com/developer/connect-iq/f/discussion/265135, hilo ~5 años, recuperado 2026-09-17): el autor usa `getMaxSampleRate()` + listener con `:period => 1` y recibe ~25 muestras de accel por entrega de 1 s en su dispositivo (generación FR945) [FORO].
- No se pudo recuperar en esta sesión ningún hilo con medición explícita de 100 Hz reales por modelo (motores de búsqueda bloqueados, búsqueda del foro con login) **[NO VERIFICADO]**. La validación definitiva debe hacerse con el app de diagnóstico (§9) sobre hardware físico: log de `size(x)` por entrega × frecuencia pedida.

---

## 3. Restricciones prácticas del listener

1. **Un solo listener global**; re-registrar sobrescribe; excepción si se duplica [OFICIAL].
2. **Data Field: crash** al usar las APIs de datos/sensores [OFICIAL]. → ArcheryWatch no puede ser data field para esto.
3. **Latencia = tamaño de lote**: la entrega es por `:period` (hasta 4 s). Para detectar con la mínima latencia: `:period => 1` (o menos, si el firmware lo honra; el mínimo útil documentado con ejemplos es 1 s [OFICIAL en ejemplos] — valores <1 s no están documentados como soportados [INFERENCIA]). Con `:period => 1` a 100 Hz llegan lotes de ~100 muestras: suficiente para ventana de análisis de ±0,5 s alrededor de una suelta (~400 ms de evento).
4. **Consumo de batería**: las guías de revisión de la tienda prohíben degradar la batería esperada ("Apps should not cause Garmin's products to no longer meet their expected battery life" — causa de rechazo/retirada) [OFICIAL, App_Review_Guidelines/Overview.html]. **No se encontró cuantificación pública** del coste de 100 Hz vs 25 Hz [NO VERIFICADO]; mecánicamente, a 100 Hz el sensor hub no puede entrar en los modos de muestreo reducidos que usa el tracking pasivo, y el coprocesador Monkey C procesa 4× muestras [INFERENCIA]. Mitigación oficial: `:period` grande (el MCU duerme entre lotes) y registrar el listener solo durante la sesión de tiro [INFERENCIA + práctica del sample PitchCounter].
5. **Estados activo/inactivo (batería/pantalla)**: "Sensor states can not be changed while in inactive mode and sensor enabled during active mode will be disabled when app becomes inactive, and re-enabled automatically when active again" (nota de `enableSensorType`) y "getMaxSampleRate… can produce different results after the app transitions to active/inactive" [OFICIAL]. Lectura: en segundo plano/low power el sistema **gestiona los sensores él mismo** y puede bajar la tasa; no hay contrato de 100 Hz garantizado fuera del primer plano [OFICIAL (notas) + INFERENCIA (magnitud)].
6. **Watch faces**: sin acceso a `Toybox.Sensor` (matriz de App_Types, ver §3-bis) y con restricciones de energía propias [OFICIAL].
7. **Widget**: tiene acceso a `Toybox.Sensor` (matriz) [OFICIAL], pero un widget solo ejecuta cuando el usuario lo saca; y **`Toybox.SensorLogging` NO está disponible en widget** (ver §5) — un widget no puede grabar FIT con accel [OFICIAL].
8. **`:includeTimestamps`**: existe para accel/gyro/mag; arrays en ms; API 5.1.1+ [OFICIAL]. La base temporal exacta (época vs arranque vs lote) **no está documentada** [NO VERIFICADO]; para alinear accel+mag en el mismo `SensorData` basta la igualdad de longitud y el orden (INFERENCIA; con `:synchronous => true` el sistema alinea, salvo mag que no admite síncrono [OFICIAL]).
9. **App de actividad nativa vs app CIQ**: no hay interferencia documentada entre el registro nativo del sistema y el listener CIQ; el CIQ corre encima. No hay documentación de conflicto [NO VERIFICADO / sin documento público].

**3-bis. Matriz módulo ↔ tipo de app (oficial, App_Types.html, SDK 9.2.0):**

| Módulo | Data Field | Watch Face | Widget | App | Audio Content Provider | API |
|---|---|---|---|---|---|---|
| `Toybox.Sensor` | — | — | ✓ | ✓ | ✓ | 1.0.0 |
| `Toybox.SensorHistory` | ✓ | ✓ | ✓ | ✓ | ✓ | 2.1.0 |
| `Toybox.SensorLogging` | — | — | — | **✓** | ✓ | 2.3.0 |

(Cruce con api.mir del SDK: `SensorLogging` lleva anotaciones `disableDatafield/disableWatchFace/disableWidget` [OFICIAL].)

---

## 4. `Toybox.SensorHistory` — series históricas

Fuente: `doc/Toybox/SensorHistory.html` (SDK 9.2.0) [OFICIAL]:

- Series expuestas: **body battery** (0-100, API 3.3.0), **elevación** (m, 2.1.0, hasta el último apagado), **heart rate** (bpm, 2.1.0, hasta el último apagado), **SpO₂** (%, 3.2.0), **presión** (Pa, 2.1.0, hasta el último apagado), **estrés** (0-100, 3.3.0), **temperatura** (°C, 2.1.0, hasta el último apagado).
- **NO hay histórico de accelerometer, magnetometer ni gyroscope.** SensorHistory sirve para señales fisiológicas/barométricas, no para gesto.
- Granularidad: "The time between each SensorSample in the iterator may be device dependent" — sin garantía de tasa [OFICIAL].
- Cada `SensorSample` es `{ data: Number or Float or Null; when: Time.Moment }` con orden configurable (ORDER_NEWEST/OLDEST_FIRST) y permiso `SensorHistory` [OFICIAL].
- Utilidad para ArcheryWatch: **auxiliar y retro-análisis** — p. ej. HR/estrés alrededor del tiro para contexto de fatiga, o presión/elevación en campos de tiro con viento/cota; no sirve como canal de detección.

---

## 5. `Toybox.SensorLogging` / FIT

Fuente: `doc/Toybox/SensorLogging.html`, `SensorLogger.html`, `SensorLoggingStats.html` [OFICIAL]:

- `new SensorLogging.SensorLogger({:accelerometer => {:enabled => true}, :gyroscope => {:enabled…}, :magnetometer => {:enabled…}, :synchronous})` — **solo flags de activación, sin tasa**. La guía oficial aclara: **"the logger will always record at a standard rate for consumption by the simulator"** — es decir, el FIT de SensorLogger no necesariamente guarda a la tasa pedida al listener [OFICIAL].
- El logger se pasa a una sesión de grabación: `ActivityRecording.createSession({:name=>…, :sport=>…, :sensorLogger => logger})` y luego `session.start()/stop()/save()` (patrón del sample oficial PitchCounter) [OFICIAL].
- Estadísticas en vivo: `logger.getStats()` / `getStats2(:accelerometer|:gyroscope|:magnetometer|null)` → `sampleCount`, `samplePeriod` (s) [OFICIAL].
- Disponibilidad por tipo de app: **solo App (device app) y Audio Content Provider** — no widget, no data field, no watch face (§3-bis) [OFICIAL].
- **¿Se sincroniza el accel crudo con Garmin Connect y es accesible?** El SDK no documenta cómo aparece el canal en Garmin Connect; lo que sí está documentado es que la sesión se guarda como FIT y que el simulador puede reproducir el accel grabado ("can be played back in the simulator", "FIT Playback") [OFICIAL]. Que la UI de Garmin Connect no muestre el accel crudo y que el acceso sea exportando el FIT original ("Export original" / ficheros del dispositivo) es **[INFERENCIA]** — no se encontró documento público que lo contradiga ni lo confirme. Vida útil: es un FIT de sesión más, sujeto al almacenamiento histórico normal del reloj/Connect [INFERENCIA].
- Restricción conocida de escritura FIT por parte del developer del foro: "The fastest you can write to a fit file is every second. There is no way to change that." (jim_m_58, hilo 265135, ~2020) [FORO] — relevante si ArcheryWatch escribe eventos/series propias con `FitContributor` o `ActivityRecording`: resolución temporal de 1 s para datos propios, aunque el accel del SensorLogger va en el canal interno de sensor.
- **Para campañas de validación** (grabar sesiones de tiro reales): patrón recomendado = device app con listener para detectar en vivo + `SensorLogger` + sesión FIT para el crudo posterior; el usuario sincroniza y se extraen los FIT. Limitación a aceptar: la tasa efectiva del FIT la fija el firmware ("standard rate") [OFICIAL].

---

## 6. Giroscopio: quién lo expone y el caso FR165

**Dispositivos que exponen gyro en CIQ según devices.xml (SDK 9.2.0):** Grupo A completo del §2.1 (fēnix 6 en adelante — curiosamente el **Enduro 1 ya lo tiene** —, fēnix 7/8, epix Gen 2, MARQ, D2 Mach, Descent Mk2+, FR 255/265/570/955/965/970, Venu 2+, vívoactive 6, Venu X1, Instinct 3/Crossover AMOLED, Approach S70, Edge 540+, GPSMAP H1, eTrex Touch…) [OFICIAL].

**FR165:**
- **En CIQ no se expone gyro**: ni entrada `gyro` en `devices.xml` para `fr165`/`fr165m` (y sí para fr265/fr965 del mismo año) [OFICIAL, SDK 9.2.0, 2026-06-09].
- **Hardware**: el FR165 pertenece a la misma generación de sensor hub que el FR265; la review de DC Rainmaker del FR165 (feb-2024) recoge en comentarios la pregunta "Do you think the **lack of gyroscope in the 165** is a big issue… I see the **265 has it**" [COMUNIDAD, dcrainmaker.com/2024/02/garmin-forerunner-165-depth-review.html, comentario 2024-02-22]. La premisa "lo tiene físicamente pero no expuesto" **no quedó demostrada con fuente primaria** (no se halló teardown iFixit ni fotos FCC indexadas del B4432 en esta sesión) **[NO VERIFICADO]**. Lo que sí es un hecho: aunque el chip existiera, **CIQ no da acceso hoy** [OFICIAL].
- **Contradicción doc oficial**: la lista de dispositivos de `SensorData.gyroscopeData` incluye "Forerunner 165/165 Music" en el doc del SDK 9.2.0, pero devices.xml (misma versión) no declara gyro para fr165, y la misma lista incluye FR245/FR55 que carecen de esa capacidad a todas luces. Las listas del doc están sobre-incluidas [OFICIAL con contradicción interna; ver §1.3].
- **Futuro firmware**: no se encontró evidencia (changelog, foro, beta) de que Garmin vaya a exponer el gyro del FR165 vía CIQ [NO VERIFICADO]. Si ocurriese, no requeriría cambios de firma: `getMaxSampleRateForSensorType(:gyroscope)` pasaría de error/25 a 100 y `sensorData.gyroscopeData` dejaría de ser null.

**Cómo comprobarlo en runtime sin recompilar por dispositivo:**

```monkey
var hasGyro = false;
if (Toybox has :Sensor && Sensor has :getMaxSampleRateForSensorType) {
    try {
        hasGyro = (Sensor.getMaxSampleRateForSensorType(:gyroscope) >= 25);
    } catch (e) { hasGyro = false; }
}
// y en el callback: if (sensorData has :gyroscopeData && sensorData.gyroscopeData != null) { … }
```
[INFERENCIA — patrón estándar de capability detection en CIQ; los `has` son el mecanismo oficial recomendado en los ejemplos de SensorHistory.]

---

## 7. Portabilidad multi-dispositivo

1. **Probing en runtime, nunca constantes por modelo como única fuente**: `Toybox has :Sensor`, `Sensor has :getMaxSampleRateForSensorType`, `Sensor has :registerSensorDataListener`, y por dato `sensorData has :heartRateData` etc. La doc oficial ya usa ese estilo en sus ejemplos [OFICIAL].
2. **Degradación por tasa**: pedir siempre `max = getMaxSampleRateForSensorType(:accelerometer)` (o 25 si no existe el método) y **dimensionar las ventanas de detección en milisegundos, no en muestras** (p. ej. ventana de look-back 300-500 ms, refractario 500-800 ms → 25-50 muestras a 25 Hz, 100-200 a 100 Hz). Los umbrales en g y los filtros (FIR/IIR de `Toybox.Math`, API 2.3.0 [OFICIAL]) son independientes de la tasa salvo por la frecuencia de corte — re-diseñar coeficientes para 25 vs 100 Hz o aplicar decimación 4:1 al llegar a 100 Hz para reutilizar el pipeline de 25 Hz [INFERENCIA].
3. **Familias mínimas a testear** (cubre las 4 combinaciones reales):
   - FR165 (100 Hz + mag, sin gyro) — objetivo principal.
   - FR55 o Bounce 2 (100 Hz solo accel, sin mag).
   - FR945/745 o FR245 (generación sin alta frecuencia declarada; planificar 25 Hz).
   - FR965/970 o fēnix 7/8 (100 Hz + gyro + mag completo).
   - vivoactive 5 o Venu Sq 2 (100 Hz + mag sin gyro, no-Forerunner) y un Edge (540/840) si se quiere público ciclismo [INFERENCIA sobre devices.xml].
4. **Restricción de tipo de app**: si se quiere FIT de accel (SensorLogging), la app debe ser **device app**; el widget solo vale para consulta puntual. Data field está descartado (crash) [OFICIAL].
5. **Re-registro tras onActive/onInactive**: re-pedir tasas al volver a activo porque el máximo puede haber cambiado [OFICIAL — nota en getMaxSampleRate*].
6. **K Archery (216 dispositivos):** **[NO VERIFICADO]** — no se pudo recuperar en esta sesión ninguna intervención del desarrollador de K Archery en el foro ni su ficha de store (búsqueda web bloqueada; store de apps es SPA sin API pública accesible). No se replica aquí su estrategia; la práctica documentada en el foro más cercana es la de jim_m_58 (sept-2026, hilo "Effective testing no multiple devices in the simulator", forums.garmin.com/developer/connect-iq/f/discussion/443979): probar "every device in the sim" porque incluso dentro de una familia hay resoluciones y MIP/AMOLED distintos, y lanzar con un subconjunto de dispositivos y ampliar por actualizaciones de store [FORO]. Verificación pendiente sugerida: ficha del developer en apps.garmin.com y búsqueda con sesión en el foro.

---

## 8. Comunidad CIQ de detección de eventos (gestos/impactos)

- **El precedente oficial es el sample `PitchCounter`** (SDK 9.2.0, `samples/PitchCounter/source/PitchCounterProcess.mc`): detector de brazadas de béisbol a **25 Hz** con: filtro FIR pasa-bajos de 3 coeficientes (`[-0.0278, 0.9444, -0.0278]`, ganancia 0.001), umbrales alto/bajo (±6/-4.2 mg tras filtro), ventana de pausa (~4 s) para exigir quietud previa al gesto, y **período refractario** (`_skipSample = 20` muestras) tras cada detección + `SensorLogger` + sesión FIT [OFICIAL]. Es, funcionalmente, la arquitectura de un detector de sueltas: quietud → pico → refractario.
- `AccelMag` es el segundo sample oficial de referencia para accel/mag [OFICIAL].
- Demanda de la comunidad: hilo "Rowing cadence or accelerometer data in datafield" (thread 377741, ~2 años) pide acceso a cadence/accel en data fields — sin respuesta; ilustra que el acceso de alta frecuencia en data field no existe (además del crash documentado) [FORO].
- Límites prácticos publicados por devs de apps de golf/contadores: **no se pudo recuperar** ningún hilo específico en esta sesión (búsqueda bloqueada) **[NO VERIFICADO]**. Los límites mejor documentados siguen siendo los oficiales (§1 y §3): lote ≥1 s, un listener, sin data field, period ≤4 s.

---

## 9. Implicaciones para ArcheryWatch (recomendaciones)

1. **Matriz de compatibilidad objetivo**: (a) soporte completo FR165/165M (100 Hz accel + 50 Hz mag + IBI), (b) sin mag en FR55/Bounce 2, (c) 25 Hz en FR245/645/745/935/945 y fēnix 5/Instinct 2, (d) bonus gyro en FR255/265/570/955/965/970 y fēnix 6+ (mejor discriminación de rotación del brazo en la suelta).
2. **Probing obligatorio al arrancar**: tasa accel con `getMaxSampleRateForSensorType(:accelerometer)` dentro de `try` (API 3.4.5+), fallback `getMaxSampleRate()` (2.3.0+), fallback duro 25; igual para mag y gyro. Guardar el resultado en `Application.Storage` para diagnóstico.
3. **Ventanas en tiempo, no en muestras**: todo el detector parametrizado en ms (look-back ~400 ms, refractario ~600 ms, umbral de quietud ~1 s) y convertido a muestras con la tasa negociada; así 25→100 Hz no requiere reescritura.
4. **Decimación en la entrada**: si `max == 100`, aplicar media/decimación 4:1 para alimentar el pipeline optimizado a 25 Hz, y correr un segundo pasa-altos a 100 Hz solo si el umbral de pico no dispara (reduce CPU y batería sin perder detección).
5. **`:period => 1` como compromiso latencia/batería**: entrega cada ~1 s implica hasta ~1 s de latencia de aviso; si el feedback inmediato es crítico, probar `:period` menores en hardware real (no documentado) y contemplar `:period => 4` solo en modo grabación.
6. **`:includePower => true`** (módulo vectorial, barato en CPU al venir ya calculado) como canal primario de umbral de pico; **`:includePitch/:includeRoll`** para validar la orientación del brazo (fórmulas oficiales atan2) sin necesitar mag.
7. **Magnetómetro a 50 Hz solo como confirmador** (giro del arco de tiro); recordar que no admite `:synchronous` y que en FR55/Bounce 2 directamente no existe — el detector debe ser válido sin él.
8. **heartBeatIntervals**: mantenerlo como canal de contexto (estabilidad del pulso antes del tiro) — no sirve para el evento en sí (resolución ~ms pero ritmo cardiaco ≪ gesto).
9. **Battery budget**: registrar el listener solo en la sesión de tiro (start/stop manual o detección de sesión `ActivityMonitoring`), `unregisterSensorDataListener()` al salir, y `:period` grande en modo grabación; la tienda puede rechazar apps que degraden la batería esperada — 100 Hz continuo en background es el escenario de riesgo a evitar.
10. **Riesgos de firmware**: (a) `getMaxSampleRate*` puede devolver menos tras onInactive — re-negociar al activar; (b) el firmware puede entregar menos muestras que las pedidas: validar `x.size()` por lote y derivar la tasa real (tasa efectiva = muestras/Δt con `:includeTimestamps` si está disponible, API 5.1.1+); (c) si un update expone el gyro del FR165, `getMaxSampleRateForSensorType(:gyroscope)` lo revelará sin cambios de código.
11. **Tipo de app**: device app obligatoria si se mantiene `SensorLogging` para FIT; el modo widget solo puede leer (sin FIT). Data field jamás.
12. **Campaña de validación**: patrón PitchCounter — listener en vivo + `SensorLogger` + `ActivityRecording.createSession(:sensorLogger)`; aceptar que el FIT del logger lo graba el firmware a "standard rate" y que el crudo fino es el del listener (exportar por `Application.Storage`/comms si se necesita a 100 Hz exactos, con presupuesto de memoria Monkey C en mente).
13. **Test físico mínimo**: un "app de diagnóstico" que imprima/logueé (tasa pedida, tasa efectiva medida, tamaño de lote, latencia entre lotes con timestamps) en los 5-6 modelos del punto 3, para reemplazar la ausencia de mediciones públicas con datos propios.
14. **Doc oficial ≠ realidad por dispositivo**: no fiarse de las listas "Supported Devices" de las páginas de clase (incluyen FR165 en GyroscopeData contra evidencia interna del SDK); árbitro = devices.xml + probing + medición.
15. **Legado**: no prometer detección en FR230/235/45/630 (API 1.x-2.x sin listener o sin alta frecuencia): dar modo básico (accel 1 Hz vía `Sensor.getInfo()`/`enableSensorEvents`) o excluir del manifest.

---

## 10. Índice de fuentes (consultadas 2026-09-17)

**Oficiales (local, SDK 9.2.0 — docs generados 2026-06-09):**
- `tools/ciq/sdk/bin/devices.xml` (parseo íntegro propio)
- `tools/ciq/sdk/doc/Toybox/Sensor.html` (+ AccelerometerData, MagnetometerData, GyroscopeData, HeartRateData, SensorData, SensorDelegate, Info)
- `tools/ciq/sdk/doc/Toybox/SensorHistory.html`, `SensorHistory/SensorSample.html`
- `tools/ciq/sdk/doc/Toybox/SensorLogging.html`, `SensorLogging/SensorLogger.html`, `SensorLogging/SensorLoggingStats.html`
- `tools/ciq/sdk/doc/docs/Core_Topics/Sensors.html`
- `tools/ciq/sdk/doc/docs/Connect_IQ_Basics/App_Types.html`
- `tools/ciq/sdk/doc/docs/App_Review_Guidelines/Overview.html`
- `tools/ciq/sdk/samples/PitchCounter/`, `samples/AccelMag/`
- `tools/ciq/sdk/bin/compilerInfo.xml`, `bin/version.txt`, `bin/api.mir` (anotaciones de módulos)

**Oficiales (online):**
- https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor.html (verificado en vivo 2026-09-17; generado 2026-08-25)

**Foro de desarrolladores Garmin (recuperados en vivo 2026-09-17):**
- https://forums.garmin.com/developer/connect-iq/f/discussion/265135/heartrate-at-high-sample-rate (~2020-21; lote de ~25 muestras/s; límite de escritura FIT 1 Hz)
- https://forums.garmin.com/developer/connect-iq/f/discussion/443979/effective-testing-no-multiple-devices-in-the-simulator (sept-2026; práctica multi-dispositivo de jim_m_58)
- https://forums.garmin.com/developer/connect-iq/f/discussion/377741/rowing-cadence-or-accelerometer-data-in-datafield (sin respuesta)
- https://forums.garmin.com/developer/connect-iq/f/discussion/231092/access-accelerometer-data-from-530 (sin respuesta)

**Comunidad:**
- https://www.dcrainmaker.com/2024/02/garmin-forerunner-165-depth-review.html (feb-2024; comentarios sobre la ausencia de giroscopio en el FR165 vs FR265)

**Huecos declarados:** cuantificación pública de coste de batería a 100 Hz; comentarios del dev de K Archery; mediciones de comunidad de 100 Hz por modelo; hilos de devs de apps de golf/rep-counters; teardown/FCC del FR165. Todos marcados **[NO VERIFICADO]** con vía de verificación propuesta.
