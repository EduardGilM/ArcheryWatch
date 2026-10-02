# Investigación: detección de tiro en código abierto (arquería y análogos)

Fecha de consulta: 2026-09-17. Método: lectura directa de los ficheros fuente vía API de GitHub (`raw.githubusercontent.com`, ramas `master`/`main`) y metadatos de repositorio vía `api.github.com`. Cada afirmación técnica lleva la cita `repositorio/fichero:línea` tal como estaba el fichero en la fecha de consulta. Todas las ramas consultadas eran la rama por defecto del repo en ese momento.

Objetivo: extraer algoritmos concretos y reutilizables para el detector de ArcheryWatch (Monkey C, acelerómetro de muñeca a 100 Hz en Garmin Forerunner 165, magnetómetro a 25-50 Hz, sin framework de ML), y documentar licencias para saber qué se puede portar.

---

## 0. Resumen ejecutivo

1. **Sólo existen dos proyectos open source con detección automática de tiro de arquería por IMU**, ambos recientes y con licencia MIT: ArcheryShotCounter-wearos (muñeca, umbral simple + refractario + ventana de asentamiento) y Open-Float-Archery (riser/stabilizador, IMU a 3332 Hz promediado a ~1110 Hz, umbral de magnitud + compuerta de giroscopio + refractario de 800 ms, Madgwick a bordo). El resto de repos "archery" son apps de puntuación manual, relojes de tiro o hardware sin algoritmo público.
2. El detector de muñeca más directo (Vemestael) es deliberadamente minimalista: **magnitud euclídea de aceleración lineal > umbral estricto, un solo evento por periodo armado, ventana de asentamiento de 300 ms tras re-armar y cooldown por defecto de 10 s (configurable 1-30 s)**. Su valor principal está en las decisiones de ingeniería alrededor (sin batching, re-registro fiable, latch anti-doble) documentadas con tests de regresión.
3. Open-Float-Archery aporta el patrón de **dos condiciones de disparo (|a| > 12 g Y |ω| > 1,5 rad/s)** y el ciclo **buffer anular → freeze diferido 1,5 s tras el tiro → registro por tiro con ACK/dedup**, más un sistema de puntuación (Float Score) con **ventanas definidas en segundos y convertidas a muestras según la frecuencia real** — directamente portable a 25-100 Hz.
4. El mejor código abierto de detección de eventos periódicos en un reloj es el **contador de pasos del firmware de Bangle.js (Espruino, `stepcount.c`)**: eliminación de continua por EMA entera, FIR de 7 coeficientes, compuerta de actividad, detección de pico local y **máquina de estados con validación temporal (X pasos entre T_MIN y T_MAX)**. Licencia MPL-2.0 (copyleft de fichero: ideas sí, copia literal del fichero exige cumplir MPL).
5. InfiniTime (GPLv3) tiene la **EMA entera de "velocidad" más limpia que se ha encontrado** (`speed/5 + 4/5·acum`, equivalente a α=0,2) y umbrales de varianza para levantar la muñeca; es GPL: sólo como referencia conceptual.
6. Gadgetbridge: revisado; es un acompañante que parsea datos ya calculados por el firmware del reloj; **no contiene algoritmo de detección de eventos con acelerómetro reutilizable**. GPL, se omite.
7. **Ningún autor publica métricas de precisión** de detección (falsos positivos/negativos). Open-Float-Archery lo declara explícitamente: su umbral de 12 g "es una hipótesis" y la validación de campo está como fase pendiente. Conviene mantener la misma honestidad en ArcheryWatch mientras no haya datos etiquetados.

---

## 1. ArcheryShotCounter (Vemestael) — Wear OS, MIT

### 1.1 Identificación y estado

| Campo | Valor |
|---|---|
| Repo | https://github.com/Vemestael/ArcheryShotCounter-wearos (la URL antigua `Vemestael/ArcheryShotCounter` redirige a este; API devolvió "Moved Permanently" → id 1239190550) |
| Compañero | `Vemestael/ArcheryShotCounter-android` (app Android de sincronización, Kotlin, MIT) |
| Licencia | MIT (`LICENSE`; metadatos de la API: `spdx_id: MIT`) |
| Lenguaje | Kotlin (Wear OS 3.0+, API 30+) |
| Actividad | Último push 2026-09-15 ("Request battery-optimization exemption to help AOD shot detection"), v1.5 el 2026-08-24; 4 estrellas |
| Evidencia declarada | README.md:27 — "Tested on Galaxy Watch 6 Classic (bow arm, compound bow)". **No publica métricas de precisión**. |

Ficheros clave (ruta base `app/src/main/java/com/vemestael/archeryshotcounter/presentation/`):
- `ShotDetector.kt` — listener de sensor y disparo del evento (152 líneas).
- `ShotDetectionPolicy.kt` — lógica de decisión pura, testeable sin Android (40 líneas).
- `ShotDetectionPolicyTest.kt` — 9 casos de regresión de la decisión.
- `MainActivity.kt` — persistencia, vibración, corrección manual.
- `SettingsScreen.kt` — rangos de umbral y cooldown.
- `Shot.kt` — registro por tiro.

### 1.2 Sensor y frecuencia

- Sensor principal: **`TYPE_LINEAR_ACCELERATION`** (aceleración sin gravedad, compensada por el SO); si el dispositivo no lo tiene, fallback a `TYPE_ACCELEROMETER` crudo — `ShotDetector.kt:82-89`. El cambio de modo se recuerda en `useLinearAccel` (`ShotDetector.kt:78`).
- Cadencia: `SensorManager.SENSOR_DELAY_GAME` (`ShotDetector.kt:123`), que en Android equivale a un periodo objetivo de 20 000 µs ≈ **50 Hz** (constante documentada de `SensorManager`; el repo no la cambia).
- Magnitud: `sqrt(x²+y²+z²)`; si el sensor no es linear-accel, se resta la gravedad `9.81f` y se trunca a ≥0: `magnitude = (raw - GRAVITY).coerceAtLeast(0f)` — `ShotDetector.kt:56` (constante `GRAVITY = 9.81f`) y `ShotDetector.kt:136-141`.

### 1.3 Umbral

Presets (`ShotDetector.kt:19-24`, enum `Sensitivity`, unidades m/s²):

| Modo | Umbral (m/s²) | Cita |
|---|---|---|
| HIGH | 8 | `ShotDetector.kt:20` |
| MEDIUM (por defecto) | 13 | `ShotDetector.kt:21` y `ShotDetector.kt:61` |
| LOW | 20 | `ShotDetector.kt:22` |
| CUSTOM | valor del usuario, por defecto 15 | `ShotDetector.kt:23` y `ShotDetector.kt:62` |

- Selección en caliente: `threshold = if (sensitivity == CUSTOM) customThreshold else sensitivity.threshold` (`ShotDetector.kt:142`).
- Rango del modo CUSTOM en UI: **mínimo 5, máximo 50**, con botones −1/+1 — `SettingsScreen.kt:130` (`if (customThreshold > 5)`) y `SettingsScreen.kt:148` (`if (customThreshold < 50)`).
- Comparación **estricta**: cuenta si `magnitude > threshold` (un valor igual al umbral NO cuenta) — `ShotDetectionPolicy.kt:36` (`if (magnitude <= threshold) return false`) y su test dedicado `ShotDetectionPolicyTest.kt` ("magnitude exactly at threshold is not counted", comentario "Strict '>' comparison").
- El umbral se define como **impulso de retroceso de la suelta en la muñeca** (kdoc `ShotDetector.kt:29-30`: "sharp recoil impulse that occurs when the compound bow string is released").

### 1.4 Bloqueo (refractario), asentamiento y latch

Hay TRES mecanismos distintos, conviene no confundirlos:

1. **Cooldown/refractario por defecto 10 s, configurable 1-30 s.** `DEFAULT_COOLDOWN_MS = 10_000L` (`ShotDetector.kt:57`); variable `cooldownMs` (`ShotDetector.kt:63`); UI entre 1 y 30 s con botones −/+ de 1 s (`SettingsScreen.kt:191` y `:204`). **Ojo: la "regla de 2 s" que se asumía no existe; el valor por defecto real es 10 s.** Durante el cooldown el listener se **desregistra por completo** (no se ignora muestras: no se consumen) — kdoc `ShotDetector.kt:31-33` ("fully unregistered ... so no samples are polled at all during the dead time") y `ShotDetector.kt:145` (`sensorManager.unregisterListener(this)` justo tras aceptar).
2. **Ventana de asentamiento (`settleMs`) de 300 ms** tras cada (re)registro: `SETTLE_MS_DEFAULT = 300L` (`ShotDetectionPolicy.kt:17`); las muestras de los primeros 300 ms tras re-armar se descartan aunque superen el umbral — `ShotDetectionPolicy.kt:35`. Motivo observado en campo: al reactivarse el sensor puede capturar movimiento de muñeca ya en curso, "observado en practice tan pronto como 11-17 ms tras el registro" (`ShotDetectionPolicy.kt:10-12`).
3. **Latch de un solo evento**: tras aceptar una muestra, `awaitingReregister = true` y toda llamada posterior a `evaluate` devuelve false hasta el siguiente `onRegistered` (`ShotDetectionPolicy.kt:33-39`). Esto neutraliza el problema de los sensores Android con batching: un flush entrega varias muestras juntas en `onSensorChanged` y "en la práctica producía tiros contados por doble" (`ShotDetector.kt:34-37`). El test "a second sample in the same delivery burst is ignored" lo cubre (`ShotDetectionPolicyTest.kt`).

Detalles de re-registro fiable (relevantes para nuestro ciclo de refractario):
- El re-registro tras el cooldown se programa con `AlarmManager.setAndAllowWhileIdle(ELAPSED_REALTIME_WAKEUP, ...)` en vez de `Handler.postDelayed`, porque en modo Ambient real la CPU se suspende y el handler no dispara; sin alarma "el reloj detectaría como mucho un tiro en ambient" — kdoc `ShotDetector.kt:39-44`, implementación `ShotDetector.kt:126-130`.
- Se evita deliberadamente el batching de `registerListener(maxReportLatencyUs)` (`ShotDetector.kt:34-37`).
- Al re-registrar se marca `listeningSinceMs` (`ShotDetectionPolicy.kt:24-27`), que habilita el settle.

### 1.5 Qué más hace (y qué NO hace)

- **No hay filtrado adicional**: ni paso alto explícito, ni media móvil, ni orientación, ni giroscopio. El antirrebote completo son los tres mecanismos del §1.4 más el umbral. La kdoc de la política lo resume: la decisión entera es `evaluate(magnitud, umbral, tiempo)` (`ShotDetectionPolicy.kt:4-13`).
- **Vibración de confirmación** al contar: `VibrationEffect.createOneShot(150, ...)` — `MainActivity.kt:174`. Vibración de inicio (patrón 0,100,100,100 ms — `MainActivity.kt:408`) y de pausa (300 ms — `MainActivity.kt:419`).
- Al aceptar un tiro guarda el registro con la magnitud: `recordShot(magnitude)` (`MainActivity.kt:168-175` → `MainActivity.kt:597-612`); la entidad `Shot` persiste `magnitude: Float?` (`Shot.kt:21`) — el nulo es para tiros manuales.
- Cada magnitud detectada se muestra 5 s en pantalla para diagnóstico de umbral en campo: `lastShotMagnitude` + `postDelayed(5000)` (`MainActivity.kt:171-173`). Es el equivalente exacto a nuestro `lastPeakDev` (ArcheryApp.mc:174): telemetría de "sacudida vista, no aceptada/aceptada".
- Auto-pausa por tandas (`shotsPerEnd`) con cuenta atrás: `MainActivity.kt:609-611`.
- La política de decisión es Kotlin puro sin APIs de Android, "para poder testearla sin dispositivo ni Robolectric" (`ShotDetectionPolicy.kt:4-6`). Los tests cubren: por debajo del umbral, igual al umbral, dentro/fuera del settle, frontera exacta del settle (299 ms fuera, 300 ms dentro), ráfaga de dos muestras, y re-registro a los 11 s (cooldown 10 s + settle 300 ms) — `ShotDetectionPolicyTest.kt` completo.

### 1.6 Corrección manual (+/−)

- Botones `−1` / `+1` siempre visibles: `onManualAdjust(-1)` / `onManualAdjust(1)` (`MainScreen.kt:175` y `:185`, etiquetas en `:182` y `:188`).
- Implementación: `manualAdjust(delta)` con clamping a ≥0 (`MainActivity.kt:614-618`); `+1` crea sesión si no existe e **inserta filas `Shot` sintéticas con `magnitude = null`** (`MainActivity.kt:620-639`, en concreto `repeat(actualDelta) { ... insert(Shot(..., magnitude = null)) }` en `:627`). Así la auditoría posterior puede distinguir tiros detectados de tiros añadidos a mano.

### 1.7 Valoración para ArcheryWatch

- Funciona a ~50 Hz (SENSOR_DELAY_GAME) en muñeca del **brazo del arco** con compuesto; el propio README advierte que la sensibilidad óptima depende del estilo de arco y de la muñeca: "el brazo del arco produce normalmente un impulso más fuerte que el del cordón" (README.md:62). Sus umbrales 8-20 m/s² (≈0,8-2 g) son del orden de nuestro mínimo de calibración (900 mg), coherentes con señal de muñeca.
- Coste en Monkey C: trivial (una suma de cuadrados, una sqrt, dos comparaciones, un latch). Portable íntegro.
- Sin giroscopio: no lo necesita. Es el contrapunto exacto a Open-Float (que sí usa gyro).
- Precisión declarada: ninguna cuantificada; su calidad está en los tests de regresión de la decisión y en dos lecciones de campo muy citables (doble conteo por batching; muestras fantasma 11-17 ms tras re-armar).
- Riesgo a evitar: su cooldown por defecto de 10 s está pensado para "1 tiro, mirar el reloj"; en tanda de arquería (1 tiro cada ~20-30 s, y en 3D hasta ~10-15 s) es demasiado largo por defecto, aunque sea configurable.

---

## 2. Open-Float-Archery (DevanMetz) — sensor de arco, MIT

### 2.1 Identificación y estado

| Campo | Valor |
|---|---|
| Repo | https://github.com/DevanMetz/Open-Float-Archery (rama `main`) |
| Licencia | MIT (`LICENSE`; API: `spdx_id: MIT`) |
| Qué es | "Bow telemetry: BLE IMU sensor (XIAO nRF54L15 + Zephyr) + dashboard web local-first a ~1110 Hz — shot detection, Float Score y revisión de hold/release/follow-through" (descripción del repo) |
| Hardware | Seeed XIAO nRF54L15 Sense + LSM6DS3TR-C (IMU 6 ejes, I2C) + micrófono PDM (`Blueprint.md:15`, `:138-139`) |
| Actividad | 3 estrellas; último push 2026-06-13; CI de firmware y app |
| Monte | En el **arco** (riser/stabilizador), no en la muñeca (`Blueprint.md:105`: "small enough to mount on a riser, stabilizer, or accessory rail") |
| Evidencia declarada | Ver §2.6 — throughput BLE y CPU medidos; **detección sin validar en campo** |

### 2.2 Cadena de muestreo (3332 Hz → ~1110 Hz)

- IMU configurada por registros crudos: ODR **3332 Hz** para acelerómetro y giroscopio, ±16 g y ±2000 dps — `firmware/src/main.c:317` (`LSM6DSL_IMU_ODR_REG = LSM6DSL_ODR_3332HZ`), `:318-319`, `:249-251` (`IMU_ODR_HZ 3332`, `IMU_ACCEL_FS_G 16`, `IMU_GYRO_FS_DPS 2000`). El comentario `main.c:311-316` explica por qué no 6664 Hz: el bus I2C a 1 MHz no drena ~80 KB/s y hay overruns ~1/s con muestra corrupta.
- Lectura **por FIFO con marca de agua por interrupción** (INT1), marca de agua de 15 muestras (~4,5 ms) — `main.c:337` (`LSM6DSL_FIFO_WATERMARK_SAMPLES 15`), drenaje máximo de 32 muestras — `main.c:326`. El blueprint cuantifica: CPU del 51 % (polling) al **~35 %** con interrupciones (`Blueprint.md:78-82`).
- Cada frame de salida es la **media de 3 muestras crudas** (`SAMPLES_PER_OUTPUT 3`, `main.c:260`), dt ≈ 900 µs (`OUTPUT_DT_US`, `main.c:261`), lo que da **~1110 frames/s reales**, sin duplicar batches (comentario `main.c:252-258`: "Keeping the window short also preserves the shot-impulse peak for detect_shot()"). El bucle que agrupa y promedia está en `main.c:2970-3001` (los acumuladores cruzan drenajes, `:2963-2969`).
- Conversión a unidades: LSB→m/s² con `IMU_ACCEL_FS_G·9.81/32768` (`main.c:346-347`, `MPS2_PER_G = 9.81f` en `:356`); uso en `:844-846`.

### 2.3 Detección de tiro (`detect_shot`)

Implementación completa en `firmware/src/main.c:1329-1350`:

```c
static bool detect_shot(const struct vec3 *accel, const struct vec3 *gyro, uint64_t now_us,
                        float roll_deg, float pitch_deg, float yaw_deg)
{
    static int64_t last_shot_ms;
    float mag2 = (accel->x * accel->x) + (accel->y * accel->y) +
                 (accel->z * accel->z);
    float threshold = shot_accel_threshold_mps2;
    float thresh2 = threshold * threshold;
    int64_t now_ms = k_uptime_get();

    float gyro_mag2 = (gyro->x * gyro->x) + (gyro->y * gyro->y) + (gyro->z * gyro->z);
    float min_gyro_rad_s = 1.5f; /* ~85 deg/s minimum rotation during recoil */
    float min_gyro_rad_s2 = min_gyro_rad_s * min_gyro_rad_s;

    if (mag2 > thresh2 && gyro_mag2 > min_gyro_rad_s2 && (now_ms - last_shot_ms) > SHOT_REFRACTORY_MS) {
        last_shot_ms = now_ms;
        return true;
    }
    return false;
}
```

Constantes:
- **Umbral de aceleración: 12,0 g por defecto** (117,72 m/s²), **configurable en runtime por BLE (`thresh:<g>`) con clamps 2-30 g** — `DEFAULT_SHOT_ACCEL_THRESHOLD_G 12.0f`, `MIN_SHOT_ACCEL_THRESHOLD_G 2.0f`, `MAX_SHOT_ACCEL_THRESHOLD_G 30.0f` (`main.c:357-359`); estado `shot_accel_threshold_mps2` (`main.c:391-392`); comando y clamp en `Blueprint.md:506`. Comparación en cuadrados (sin sqrt), igual que Vemestael usa comparación directa.
- **Compuerta de giroscopio: |ω| > 1,5 rad/s ≈ 85 °/s** durante el retroceso — `main.c:1340-1342`. Es la segunda condición que elimina "dejar el arco en el soporte, manipulación, ajustes" (lista de rechazos en `Blueprint.md:370`).
- **Refractario: 800 ms** — `SHOT_REFRACTORY_MS 800` (`main.c:360`), condición temporal en `:1344`.
- El autor declara la debilidad del umbral: **"El umbral >12 g de las primeras notas de diseño es una hipótesis. Debe ajustarse con arcos reales, posiciones de montaje, pesos de flecha, estabilizadores y estilos"** (`Blueprint.md:380`).
- Estado del diseño inicial: el filtro paso alto (punto 1 del algoritmo previsto, `Blueprint.md:372-378`) y la "verificación con firma de vibración post-disparo" **siguen sin implementar**: "The high-pass filtering, post-trigger vibration verification ... are still to do" (`Blueprint.md:442-445`). Es decir, hoy la detección real es solo: magnitud + gyro + refractario, sobre la media de 3 muestras.
- Al detectar: incrementa contador persistente, congela traza, LED 120 ms (`LED_SHOT_PULSE_MS`, `main.c:363`), emite `OFSHOT` por serie (`main.c:3082-3088`) y guarda un registro compacto del tiro con accel en mg, umbral aplicado y actitud en centigrados (`main.c:3052-3065`, estructura `stored_shot` en `:463-471`).

### 2.4 Orientación: Madgwick IMU (sin magnetómetro)

- Filtro de Madgwick variante **IMU (solo giroscopio + acelerómetro, sin magnético)** ejecutado **en el dispositivo** por frame de salida: `madgwick_update_imu(&q, &avg_gyro, &avg_accel, dt)` — `main.c:3003-3004`; el blueprint lo declara: "a Madgwick filter produces the canonical quaternion on the device" (`Blueprint.md:25-28`).
- **Beta = 0,08** — `MADGWICK_BETA 0.08f` (`main.c:278`), aplicado como corrección del gradiente en `main.c:787-790`.
- Implementación (main.c:720-798): integración del giroscopio (`:756-759`), corrección por acelerómetro con normalización deste (`:761-785`), integración Euler `q += qdot·dt` (`:793-796`) y normalización con `inv_sqrt` (`:704-718`, `:797`).
- Cuaternión → Euler para lecturas (`quat_to_euler`, `main.c:800-809`); el cuaternión se escala por 10 000 para BLE (`SCALE_QUAT 1000000.0f` en `:284` es para otra ruta; el frame v2 declara "quaternion ... scaled by 10000" en `Blueprint.md:320`).
- **No usan magnetómetro** para la actitud (yaw con deriva; lo aceptan). Lección directa para nuestro uso del magnetómetro a 50 Hz: el yaw de brújula durante el impulso de la suelta no es fiable; OpenFloat ancla el tiro por **número de secuencia del frame**, no por brújula (`Blueprint.md:404-407`: "The browser uses that sequence ... to anchor connected shot traces to the device-side release sample").
- Derivación de velocidad angular **sin giroscopio** (para clientes que no lo reciben): `quaternionAngularSpeedDps` en `app/telemetry/telemetry.js:149-159` — ω = `2·acos(|q1·q2|)/dt` entre cuaterniones consecutivos. Es el sustituto exacto que ArcheryWatch podría usar si quisiera la compuerta de "rotación" sin gyro… aunque en FR165 tampoco hay cuaterniones (ver §7).
- Coste Monkey C: Madgwick a 100 Hz es viable aritméticamente (unas 40-60 multiplicaciones float por paso) pero no gratis; **no es necesario para detectar**, solo para métricas de cant/estabilidad.

### 2.5 Ventanas pre/post, traza y almacenamiento

- **Buffer anular de traza en RAM: 1000 puntos** (`TRACE_CAPACITY 1000`, `main.c:494`; push en `:560-570`), alimentado por diezmado del stream de 1110 Hz: stride 21 → ~52,7 Hz (modo por defecto `buffer_rate_hz = 52`, `main.c:516`), stride 11 → ~101 Hz, stride 5 → ~222 Hz (`main.c:3007-3023`; comandos `bufrate: 0/52/104/208` en `Blueprint.md:510`). Cada punto son 7 bytes (roll/pitch/yaw en centigrados + amplitud de micrófono) — `Blueprint.md:436-437`.
- **Freeze diferido tras el tiro**: al detectar, se programa el guardado de la traza `follow_through_ms` después, así la ventana contiene el apuntado previo y la recuperación posterior. Por defecto **1500 ms**, configurable 0-3000 ms (`followms:`) — `follow_through_ms = 1500` (`main.c:521`), `k_work_reschedule(&trace_freeze_work, K_MSEC(follow_through_ms))` (`main.c:610-623`, en particular `:622`), `Blueprint.md:433-435`. Si llega otro tiro antes, el freeze pendiente se materializa inmediatamente y se reprograma (`main.c:612-615`).
- Objetivo de diseño de ventana (a batir/igualar): **total 5 s = 3,5 s pre-tiro + 1,5 s post-tiro** (`Blueprint.md:241-246`); el dashboard del navegador captura exactamente `BROWSER_SHOT_PRE_MS = 3500` y `DEFAULT_FOLLOW_THROUGH_MS = 1500` / `MAX_FOLLOW_THROUGH_MS = 3000` (`app/telemetry/telemetry.js:26-28`), con capacidad de historia `max(1500, rate·30)` muestras (`telemetry.js:425`) — "20 s de buffer vivo son margen de retención" (`Blueprint.md:657`). Nuestro diseño actual (20 s pre @20 Hz + 2 s post, ArcheryApp.mc:196-215) cubre más pre con menos tasa.
- **Persistencia y recuperación**: contador de vida en RRAM (Zephyr Settings, clave `openfloat/shots`) escrito **fuera del bucle IMU** para no estancarlo (`Blueprint.md:409-412`); cola de los **100 últimos tiros** (`STORED_SHOT_CAPACITY 100`, `main.c:279`) con expulsión del más antiguo y contador de expulsados (`stored_shot_append`, `main.c:625-637`); escritura a RRAM **diferida 3 s** (`SHOT_LOG_RECONCILE_DELAY_MS 3000`, `main.c:403`) y solo si el tiro sigue sin ACK — "RRAM se escribe sólo cuando se perdió un frame en vivo" (`Blueprint.md:423-432`). Deduplicación en el navegador por `shot_id` **dentro de la conexión** (el id se reinicia con `shotreset`, así que el dedup vitalicio sería inseguro) (`Blueprint.md:655`).
- Extra: **sobre de audio por micrófono PDM** con follower de pico RC de τ=5 ms (`AUDIO_ENVELOPE_TAU_S 0.005f`, `main.c:60`; fórmula `smooth = max(pico, smooth·e^(−dt/τ))` en `Blueprint.md:345-347`) y **sustracción adaptativa de suelo de ruido** (ataque 2 s, recuperación 0,15 s; margen base 128 — `AUDIO_NOISE_MARGIN_BASE 128.0f` en `main.c:63`, descrito en `Blueprint.md:343-344`). Útil como idea si algún día detectamos el "click" del clicker.
- Gestión de energía: inactividad si `|ω| ≤ 1,0 rad/s` Y `|‖a‖−1g| ≤ sleep_sensitivity_g` (por defecto 0,15 g, `main.c:394`) resetea el temporizador de sueño (`main.c:3026-3034`); comando `autosleep` y `sleeptime` 5-600 s (`Blueprint.md:508,514`).

### 2.6 Float Score (puntuación de la suelta)

`app/telemetry/score.js` (159 líneas), "intencionalmente transparente y calculado localmente" (cabecera, `:1-3`). Versión `openfloat-float-score-v1` (`:5`).

Detección del índice de suelta dentro de la traza (`releaseIndexForTrace`, `:40-56`): busca el máximo de `movimiento = |‖a‖−1|·35 + |ω_dps|`; por defecto usa el punto al 62 % de la traza si no hay señal (`:43`). **Esta fórmula de "movimiento ponderado" es el análogo exacto de nuestra combinación magnitud+desviación y es portable tal cual.**

Ventanas **definidas en segundos y convertidas a muestras con la frecuencia real de la traza** (`:75-78`), con mínimos absolutos:

| Ventana | Duración | Mín. muestras | Cita |
|---|---|---|---|
| Pre (hold/apuntado) | 1,5 s antes del índice | 8 | `score.js:76` |
| Release | ±0,18 s alrededor del índice | 4 | `score.js:77` |
| Follow-through | 0,75 s tras el índice | 8 | `score.js:78` |

Fórmulas (todas acotadas 0-100 con `clamp`, `:9-11`):
- `holdStability = 100 − (sd(roll)+sd(pitch))·18 − media(|ω|)·0.55` (`:92`).
- `releaseQuality = 100 − pico(|ω|)·0.9 − pico(|‖a‖−1|)·18` (`:94-100`).
- `followThrough = 100 − media(|ω|_follow)·0.65 − (recorridoRoll+recorridoPitch)·8` (`:102-107`).
- `levelConsistency = 100 − media(|cant|)·6 − sd(roll)·12` (`:109-111`).
- `formScore = 0,40·holdStability + 0,24·releaseQuality + 0,22·followThrough + 0,14·levelConsistency` (`:115-124`); para capturas manuales, 0,7·hold + 0,3·level (`:115-116`). La variante "en vivo" usa pesos 0,45/0,18/0,17/0,20 (`:142-149`) y ventana viva de 120 muestras (`LIVE_SCORE_WINDOW`, `:7`).

### 2.7 Qué se puede bajar a 100 Hz (o 25 Hz)

- `detect_shot` es **por-frame** (magnitud + gyro + refractario): funciona idéntico a 25-100 Hz; de hecho a 100 Hz con media de 3 muestras sigue viendo el pico (el diseño elige ventana de 0,9 ms precisamente para no comerse el pico, `main.c:252-258`). A 25 Hz conviene usar el **máximo** del bloque de muestras del periodo, no la media.
- La compuerta de gyro (1,5 rad/s) **no existe en FR165**; sustitutos: desviación vectorial respecto a la postura de apuntado (ya la tenemos, similitud coseno ≥0,85 en calibración — docs/v2.7-deteccion.md) o la derivada de la EMA de gravedad (§5.1).
- Madgwick a 100 Hz: correcto numéricamente (beta 0,08), coste float moderado; solo vale para métricas de cant, no para el conteo. Alternativa sin gyro: pitch/roll por arcos tangentes de la gravedad EMA (lo que hace InfiniTime con `Asin`, §5.2).
- El Float Score es **independiente de la frecuencia** por construcción (ventanas en segundos, `:75-78`): portable directo a 52→25/100 Hz cambiando `sampleRateHz`.
- Ventanas pre/post: sus 3,5 s + 1,5 s caben de sobra en nuestros buffers (400 muestras @20 Hz = 20 s; post 24 muestras = 1,2 s ampliable a 1,5 s sin tocar memoria).

---

## 3. Resto de repos de arquería/tiro encontrados

Búsquedas ejecutadas en la API de GitHub (repositorios): `archery accelerometer`, `archery shot detection`, `archery imu`, `archery wearable`, `bow shot counter`, `arrow counter`, `archery counter`, `archery arduino`, `archery esp32`, `connectiq archery`, `monkey c archery`, `garmin connectiq shot`, `shot detection imu`, `shot counter arduino`, `paintball shot counter`, `airsoft shot counter`. Resultado:

### 3.1 Analizados a fondo

**marc-schieferdecker/arduino-shot-counter** (C++, Arduino, MIT, 3 estrellas, último push 2020-05-13) — "Arduino gun mountable shot counter" (contador de disparos montado en un arma, MPU6050).
- Lectura: toma el **máximo de los valores absolutos de los tres ejes** del acelerómetro del MPU6050 en ±16 g (2048 LSB/g) y lo devuelve en g — `lib/GyroMeasure/GyroMeasure.cpp:34-52` (concretamente `:46-49`: `gMax = max(max(|x|/2048, |y|/2048), |z|/2048)`). A pesar del nombre `GyroMeasure`, usa el acelerómetro.
- Decisión: **cuenta un disparo si `gMax >= shotCounter.countGforce`** — `lib/pageController/PageController.cpp:120-125`.
- Valores por defecto: **`countGforce = 3` (g)** y **`shotDelay = 250` (ms)**, en 6 perfiles persistidos en EEPROM con CRC — `lib/DataProfiles/DataProfiles.cpp:19-25` (struct por defecto `{0, 0, 3, 250, nombre}`) y `lib/DataProfiles/DataProfiles.h:11` (`profilesMax = 6`). Páginas de setup dedicadas: "Set min g force for shot count" y "Set shot count delay value" (`PageController.cpp:70-73`).
- Antirrebote: tras contar, `displayHelper->blink(shotCounter.shotDelay)` (bloquea/animación 250 ms por defecto, ajustable de 50 en 50 ms hasta 2000 y vuelta a 50) — `PageController.cpp:133-137` y `:270`.
- Lecciones: (a) perfiles por configuración de arma, idea aplicable a "perfil por arco/muñeca"; (b) umbral de 3 g sobre pico de eje — señal más fuerte que en muñeca (está atornillado al arma); (c) sin refractario temporal real, usa un blink bloqueante: no portable conceptualmente a un reloj, pero confirma que un "muerto" de 250 ms basta cuando el impulso es muy breve.
- Precisión: sin métricas.

**mikkosh/shotgunsports** (Monkey C, MIT, 2025) — app Garmin Connect IQ de tiro olímpico con escopeta (skeet/trap). **Conteo manual** por botones/swipes por turno (+1 acierto, −1 fallo; la app calcula fallos si el total es conocido) — `README.md` (secciones Usage) y `source/ShotgunLap.mc` (`onPreviousPage`/`onNextPage` → `increaseSelected`/`decreaseSelected`). **Sin acelerómetro**. Lección para nuestra misma plataforma: en Connect IQ el conteo manual por-turno con lógica de "total conocido" es un patrón de UX válido y barato; su retorno al usuario no exige detección. También demuestra cómo guardar la actividad (`ActivityRecording`) y exportar FIT.

### 3.2 Descartados, con motivo

| Repo | Qué es | Por qué se descarta |
|---|---|---|
| `1421735330/Smart_arch_point` | STM32L031 + ICM-42688-P, firmware C "archery motion sensing" | Sin licencia (API: `license: null`) y `Hardware/Core/Src/main.c` (303 líneas) no contiene ningún umbral/detección (`grep shot|threshold|detect` vacío) |
| `bermuta19/ArcheryTracking` | RPi + BNO085, ML embebido | Sin licencia; visión/ML, no contaje por muñeca |
| `DukyG/guacamole_archery_tracker` | ESP32 + Flutter | Sin licencia; sin algoritmo de detección identificable en el árbol |
| `ntader/ArcheryAlgorithm` | Arduino + MPU6050 para **ángulo de lanzamiento** por física de proyectiles (README) | Es asistencia de puntería (tilt), no detección de suelta |
| `VultureWood/KettlebellCounter` (GPL-3.0) | Contador de repes de kettlebell para jueces | **GPLv3 (incompatible para copiar)** y el conteo es por **botones** (`Software_for_ESP32/Code_KBC_main_V_1_8_open_source/KBC_main_V_1_8_open_source.ino:645-653`, `digitalRead(repButtonUP)`, sin IMU) |
| `insanity54/airsoft-shot-counter`, `jgreat/airsoft-shot-counter` | Contador por **caída de tensión** de batería (MIT) | Señal eléctrica, no IMU |
| `Kirtsuwu/airsoft-ammo-counter` (MIT) | ESP32 + **micrófono** | Acústico, no IMU |
| `XtromAI/Airsoft-Display` | Contador + batería en OLED | `NOASSERTION` en licencia |
| `Surrog/ArcheryCounter`, `Strobingn/arrow-counter`, `JulienUsson/arcount`, `meisenheimerc/SportsCounter`, `DanielWieczorek/ArcheryCounter` (LGPL), `itchrand/ArcheryCounter`, `Omafovbe/Archery-Score-Counter` | Contadores/puntuación de diana | Sin detección (conteo visual/manual o UI) |
| `zonkie/ardunoidArchery` | Contador+estadísticas+timer | Manual, sin algoritmo |
| `kaplanfx/LittleDuffer` | Contador de golpes de golf en Pebble | Botones |
| `christophbuehler/bowman` | Juego Android Wear | Juego |
| `Jooti/ArcheryClock`, `MoritzNelle/Archery_Clock_*`, `wjdragon/archerytimer` (GPL-3.0), `per-olav/*`, `ArcAndAlgorithm/ArcheryShotClock` (GPL-3.0), `SleXx88/archery-signal-system` | Relojes de tiro/señalización | Nada de detección |
| `alonso28md/Archery-Biomechanics-Analyser` (MIT) | Visión por cámara (MediaPipe) | Otra modalidad de sensor |
| `ShreeSabbineni/Smartwear-Archery-Anxiety-Monitor` | ESP32 GSR/HR/tremor | Mide estrés, no tiros; sin licencia |
| `david780531-ui/Auto-Archery-Machine` | Máquina de fuerza de apertura | No aplica |

---

## 4. Detección de eventos análoga en wearables open source

### 4.1 Contador de pasos del firmware Bangle.js (Espruino) — MPL-2.0

Repo `espruino/Espruino` (licencia del paquete: **Mozilla Public License 2.0** — fichero `LICENSE` y cabeceras "Mozilla Public License, v. 2.0" en `libs/misc/stepcount.c:6-8`). Muestreo del acelerómetro a **12,5 Hz** (los periodos del FSM están "In periods of 12.5Hz", `stepcount.c:154`; el magnitud se calcula en el bucle de poll de `libs/banglejs/jswrap_bangle.c:1641` — `accMagSquared = x²+y²+z²` — y se entrega a `stepcount_new(accMagSquared)` en `:1729`).

Pipeline completo en `libs/misc/stepcount.c` (293 líneas), diseñado para poder probarse offline con CSV reales (`:21-27`, contra la herramienta `gfwilliams/step-count`):

1. **Eliminación de continua por EMA entera**: `avg += (muestra − avg/NSAMPLE)` con `NSAMPLE = 12` (α = 1/12) y salida `muestra − avg/12` — `:80-87`. Es un paso alto causal de **una suma y una división por muestra**, sin buffer.
2. **FIR de 7 coeficientes** con enteros de 8 bits: taps `[-11, -15, 44, 68, 44, -15, -11]`, resultado `>>2` — `:40-49` y `:65-73`. Pasa banda centrada en la frecuencia de paso.
3. **Compuerta de actividad**: si `|v| > RAW_THRESHOLD (15)` en `N_ACTIVE_SAMPLES (3)` de las últimas muestras, se abre la compuerta; si vuelven el silencio, se cierra — `:158-159` (constantes) y `:268-278` (lógica de contador ascendente/descendente). Evita picos aislados.
4. **Detección de pico local**: pico cuando `hist[1] > hist[0] && hist[1] > accFiltered` (máximo con las dos muestras adyacentes) — `:286-290`.
5. **Máquina de estados de validación temporal** (`:147-161` constantes, `:180-242` lógica): estados `S_STILL → S_STEP_1 → S_STEP_22N → S_STEPPING`; se exige que cada pico llegue entre `T_MIN_STEP = 4` (~333 ms) y `T_MAX_STEP = 16` (~1300 ms) del anterior, y no se entrega ningún paso hasta acumular `X_STEPS = 6` seguidos válidos (entonces entrega los 6 de golpe). Si un intervalo se sale, vuelve a `S_STEP_1`. El comentario del autor (`:127-145`) explica por qué este diseño corrige el sesgo del esquema previo "X pasos en Y segundos".
6. **Umbral**: `STEPCOUNTERTHRESHOLD_DEFAULT 600` sobre la señal ya filtrada (escala de 8 bits), con historial de tuning offline 0-2000 en pasos de 100 — `:94-100`.
7. Integración firmware (`jswrap_bangle.c:1722-1736`): el conteo se **suspende en modo ahorro** (frecuencia de acelerómetro baja) y hay una heurística de actividad por bloques de 10 min (200 pasos ⇒ caminando).

Coste en Monkey C: todo es entero y O(1) en memoria (7 taps + EMA + contadores). Portable al 100 % sin floats.

### 4.2 InfiniTime (PineTime) — GPL-3.0 (solo referencia)

Repo `InfiniTimeOrg/InfiniTime`, `src/components/motion/MotionController.{h,cpp}`. Step-counting delegado en el BMA421 (firmware interno del sensor), pero el controller aporta patrones reutilizables:

- **EMA entera de "velocidad"** sobre 8 muestras @10 Hz: `speed = |Δz + Δy/2 + Δx/4|·100/Δt_ms`; `accumulatedSpeed = speed/5 + accumulatedSpeed·4/5` con el comentario "integer version of (0.2·speed) + (0.8·accumulatedSpeed)" — `MotionController.cpp:66-72`; buffers circulares de `histSize = 8` (`MotionController.h:107-110`). El truco de pesos 1/4, 1/2, 1 por eje es una orientación de "muñeca hacia arriba" barata.
- **Estadísticas de ventana**: medias y varianzas por eje sobre `numHistory = 2` bloques (`MotionController.h:89`, `MotionController.cpp:83-111`).
- **Levantar la muñeca** (`ShouldRaiseWake`, `MotionController.cpp:113-129`): compuertas simultáneas de varianza (`varianceThresh = 56·56`), de media por eje (`xThresh = 384`, `yThresh = -64`, con la gravedad ≈ 1024 en su escala de 4 g) y de **giro de actitud**: `DegreesRolled` por `asin(y)` entre medias consecutivas con umbral −45° (`:15-35`). Es un ejemplo canónico de **compuerta multi-condición con estados derivados de media+varianza** — la misma familia de "postura + estabilidad" que ya usamos.
- **Acostar/dormir** (`ShouldLowerSleep`, `:131-148`): otra combinación de medias ±887, giros ±30° y umbral 265 sostenido en la historia.
- **Licencia GPLv3: prohibido copiar código**; sólo reimplementar ideas con atribución de inspiración.

### 4.3 Otros relevantes

- `gfwilliams/step-count` (sin licencia, herramienta web): el arnés offline con el que se eligieron las constantes del contador de Bangle (referenciado desde `stepcount.c:26-27` y `:92-93`). Lección metodológica: elegir constantes barriendo un rango (`STEPCOUNTERTHRESHOLD_MIN 0 / MAX 2000 / STEP 100`, `stepcount.c:98-100`) sobre CSV etiquetados, no a ojo.
- `pavloshargan/accelerometer_step_counter` (MIT, Jupyter): detección de la **frecuencia** de paso desde la señal 3 ejes (análisis espectral en Python). Útil como referencia de validación offline, no portable a Monkey C.
- Búsquedas sin resultados relevantes: `punch counter` (solo visión: `shangar21/compubox`; wearables Java sin algoritmo), `tennis swing detection`, `rep counter accelerometer`, `swim stroke counter`, `jump rope counter accelerometer` — **no existe hoy un proyecto open source maduro de "contador de golpes/puñetazos por IMU de muñeca"**; el hueco que ocupa ArcheryWatch también está abierto en otros deportes.

---

## 5. Gadgetbridge (Codeberg, Freeyourgadget)

Revisión rápida solicitada. Repo `Freeyourgadget/Gadgetbridge` en codeberg.org (rama `master`, ~1928 estrellas, licencia GPLv3). La estructura del paquete (`app/src/main/java/nodomain/freeyourgadget/gadgetbridge/`: `devices/`, `deviceevents/`, `database/`, `activities/`, `service/`) confirma su papel: **acompañante que sincroniza y parsea datos de actividad ya calculados por el firmware de cada banda/reloj** (muestras de actividad, pasos, sueño), y en el caso de Bangle.js descarga grabaciones de acelerómetro. **No se ha encontrado ningún algoritmo de detección de eventos con acelerómetro que copiar.** Además es GPLv3: excluido para portar. Conclusión: omitido como fuente, como permitía el encargo.

---

## 6. Valoración de cada algoritmo (frecuencia, coste Monkey C, sin gyro, evidencia)

| Algoritmo (repo) | ¿Viable a 25-100 Hz en muñeca? | Coste en Monkey C | ¿Portable sin gyro? | Precisión declarada y evidencia |
|---|---|---|---|---|
| Umbral+magnitud+refractario+latch (Vemestael) | **Sí** — diseñado y probado a ~50 Hz de muñeca (`ShotDetector.kt:123`) | Ínfimo: sqrt + comparación + latch | **Sí** (no usa gyro) | Sin métricas. Evidencia: app publicada, tests de decisión (`ShotDetectionPolicyTest.kt`), pruebas reales GW6C brazo del arco (README.md:27) |
| Magnitud+gyro+refractario (Open-Float `detect_shot`) | Sí a 100 Hz; a 25 Hz usar máximo del bloque | Mínimo (comparación en cuadrados, sin sqrt — `main.c:1334-1344`) | **No tal cual** (necesita gyro ≥1,5 rad/s); sustituible por compuerta de postura/vector (nuestra similitud coseno) o derivada de EMA | Umbral declarado **hipótesis** (`Blueprint.md:380`); validación de campo **pendiente** (Fase 8 `[todo]`, `Blueprint.md:897-903`; plan de pruebas de falsos disparos `:912`) |
| Madgwick IMU β=0,08 (Open-Float) | Sí a 100 Hz (dt=0,9 s→0,01 s) | Medio: ~50 mult float/paso; ok como métrica, no en camino caliente | Sí (variante IMU sin magnetómetro) — `main.c:720-798` | Orientación estable medida en banco (trazas); sin métricas de error angular |
| Float Score (Open-Float `score.js`) | **Sí** — ventanas parametrizadas por Hz (`score.js:75-78`) | Bajo (sd, medias y máximos sobre ventanas pequeñas; float ok) | Sí (usa roll/pitch; la variante viva solo roll/pitch/ω/‖a‖) | Ninguna cuantificada; "no modelado sobre ningún producto comercial" (`score.js:2-3`) |
| Umbral por pico de eje + perfiles (arduino-shot-counter) | Sí (muestreo por bucle lento) | Ínfimo | Sí | Ninguna; hobby |
| Paso Bangle.js: EMA+compuerta+pico+FSM (Espruino) | **Sí, nacido a 12,5 Hz** — sobrado a 100 Hz | **Ínfimo**: enteros, O(1) — `stepcount.c` completo | Sí | Validado offline contra CSV de paseos reales y elección de constantes por barrido (`stepcount.c:21-27, 94-100`; `gfwilliams/step-count`) |
| Lift/wake EMA+varianza (InfiniTime) | Sí (10 Hz) | Ínfimo (enteros) | Sí | Ninguna publicada; GPL: solo ideas |
| Conteo manual por turno (shotgunsports) | n/a | Cero | Sí | n/a (UX, no señal) |

Observación transversal: **el patrón dominante en producción real (Bangle, InfiniTime, Vemestael, Open-Float) es: señal simple → umbral (fijo o calibrado) → latches/refractarios → (opcional) FSM temporal**. Nadie usa umbrales adaptativos tipo media+kσ en los repos examinados; la "adaptación" se resuelve por calibración/configuración por usuario (Vemestael CUSTOM 5-50; Open-Float `thresh` 2-30 g; arduino-shot-counter 6 perfiles) o por barrido offline (stepcount). Para ArcheryWatch, la calibración de 3 tiros ya implementada juega ese papel con mejor base de datos (por usuario/arco).

---

## 7. Implicaciones para ArcheryWatch

Partiendo del detector actual (ventana causal 500 ms, `PRE_STABLE = 450` mg, `REFRAC = 1500` ms, `POST = 1200` ms, `SETTLE_MG = 300` mg, calibración de 3 tiros con mínimo 900 mg y postura cos ≥ 0,85, pulso corto: decaimiento 100 ms en los primeros 600 ms y rechazo del impulso sostenido >160 ms — `watchapp/source/ArcheryApp.mc:184-258` y `docs/v2.7-deteccion.md`):

1. **Latch de un solo evento por periodo armado (Vemestael).** Formalizar "tras aceptar, ignorar todo hasta re-armar" como estado (`awaitingReregister`, `ShotDetectionPolicy.kt:33-39`) y proteger también contra **ráfagas**: si `onData` entrega varias muestras del mismo periodo, el latch evita el doble conteo (`ShotDetector.kt:34-37`, test en `ShotDetectionPolicyTest.kt`). Nuestro `inShot` ya lo parece (`ArcheryApp.mc:220`); el aprendizaje es exigir la equivalencia con tests puros (el patrón "política Kotlin pura testeable" se traslada a Monkey C con `Tests.mc`).
2. **Ventana de asentamiento de 300 ms tras cada re-armado** (`SETTLE_MS_DEFAULT = 300L`, `ShotDetectionPolicy.kt:17`; muestras fantasma observadas a los 11-17 ms, `:10-12`). Aplicarla también al salir de pausa (`resetCooldown`, `ShotDetector.kt:113-118`) — equivale a exigir "apertura desde reposo", que ya hacemos; el valor 300 ms es un buen mínimo contractual.
3. **Comparar cuadrados, no raíces** en el camino caliente: `mag2 > thresh2` (`main.c:1334-1337`). A 100 Hz en Monkey C, ahorrar 25-100 `sqrt`/s importa.
4. **Cooldown configurable, no fijo**: preajustes + valor custom acotado (Vemestael: 1-30 s, por defecto 10 s, `SettingsScreen.kt:191-204`; Open-Float: 800 ms fijo). Para tanda de arquería, partir de **1,5-2 s** (nuestro `REFRAC`) y exponerlo como parámetro de perfil; evitar por defecto el 10 s de Vemestael, que asume un disparo aislado.
5. **Umbral de usuario con rangos acotados y diagnóstico en vivo**: mostrar la última sacudida aceptada/rechazada unos segundos (`MainActivity.kt:171-173`) y acotar el ajuste manual (5-50 m/s², `SettingsScreen.kt:130,148`). Nuestro `lastPeakDev` (ArcheryApp.mc:174) ya lo hace para rechazados: añadir el par aceptado y la marca temporal.
6. **Dos condiciones de disparo en vez de una** (Open-Float: |a| y |ω|, `main.c:1344`). Sin gyro en FR165, la segunda condición puede ser: similitud coseno con la postura aprendida (ya existe) **o** la magnitud de la variación de la gravedad EMA entre extremos del impulso; la evidencia de Open-Float es que la compuerta doble es lo que separa "dejar el arco" de "soltar" (`Blueprint.md:370`).
7. **EMA entera de eliminación de continua como paso alto causal barato** (Bangle `DCFilter`, α=1/12, `stepcount.c:80-87`; una suma y una división por muestra, sin buffer). Sustituto O(1) de nuestra media por ventana de 50 muestras (`gBuf`, `ArcheryApp.mc:191-193`) para la "desviación respecto a 1 g", con calibración de α por frecuencia igual que `configureRate` ya hace (`ArcheryApp.mc:254-259`).
8. **Compuerta de actividad para dormir el detector** (Bangle: `RAW_THRESHOLD 15`, `N_ACTIVE_SAMPLES 3`, `stepcount.c:158-159,268-278`): cuando la muñeca lleva N muestras por debajo de un umbral bajo, desarmar y solo re-armar con movimiento sostenido. Ahorra batería y elimina de raíz los falsos por manipulación; conecta con nuestra detección de "apertura tras reposo".
9. **Validación temporal por FSM cuando haya ráfagas de eventos** (Bangle: X eventos entre T_MIN y T_MAX antes de dar por válida la secuencia, `stepcount.c:147-161,180-242`). Nuestro análogo es la validación de anchura de pulso (rechazo >160 ms sostenido); si algún día contamos "series" o eventos múltiples (p. ej. tiro + rebote del estabilizador), este FSM es el patrón con constantes de partida (4-16 periodos @12,5 Hz).
10. **Congelar la traza con retardo de follow-through** (Open-Float: freeze 1,5 s después del tiro, `main.c:610-623`; si llega otro tiro, cerrar el anterior inmediatamente, `:612-615`). Nuestro `POST = 1200` ms es del mismo orden; adoptar la semántica "un tiro nuevo cierra el follow-through del anterior" para trazas solapadas.
11. **Registro por tiro con suficiente contexto para auditar** (Open-Float guarda accel mg, umbral aplicado y actitud por tiro, `main.c:3052-3065`; Vemestael guarda magnitud, `Shot.kt:21`). Extensión recomendada: loguear también los **rechazados** con su motivo (postura, anchura, refractario) — hoy "los JSON de tiros aceptados no permiten medir falsos negativos" (docs/v2.7-deteccion.md, sección Validación), y Open-Float declara lo mismo como tarea pendiente (`Blueprint.md:897-912`).
12. **Cola de recuperación con capacidad fija, ACK y persistencia diferida** (Open-Float: 100 tiros, expulsión circular, persistir solo si no llegó ACK en 3 s, `main.c:279,403,625-637`; dedup por id dentro de la conexión, `Blueprint.md:655`). Nuestra cola de mensajería al móvil (`queuedN`, `ArcheryApp.mc:263-277`) ya es de la misma familia: añadir contador de expulsados y un contador de duración del disparo no lo complica.
13. **Corrección manual +/− con tiros sintéticos marcados** (Vemestael: inserta `Shot(magnitude=null)` por cada +1, `MainActivity.kt:620-639`): conserva la auditoría (se sabe qué fue detectado y qué fue humano). Nuestra corrección manual debería hacer lo mismo en el modelo de entrenamiento.
14. **Puntuación de suelta con ventanas en segundos** (Float Score, §2.6): las fórmulas lineales con constantes explícitas (`holdStability` con sd de roll/pitch ×18 y ω medio ×0,55, `score.js:92`; pesos 0,40/0,24/0,22/0,14, `:115-124`) son un punto de partida razonable y honesto para nuestra métrica de estabilidad/suelta; su detección del índice de suelta por máximo de `|‖a‖−1|·35 + |ω|` (`score.js:43-56`) es directamente portable usando nuestra magnitud y desviación vectorial.
15. **Licencias — qué se puede tomar**:
    - **MIT, apto con atribución** (incluir aviso en recursos/README): Vemestael (detector completo), Open-Float-Archery (detect_shot, Madgwick, Float Score, ventanas), arduino-shot-counter, shotgunsports.
    - **MPL-2.0** (Bangle/Espruino `stepcount.c`): se puede reimplementar la idea libremente; **copiar el fichero/traducirlo 1:1 obliga a poner ese fichero bajo MPL** — para Monkey C lo limpio es reimplementar citando la fuente.
    - **GPLv3/AGPL — prohibido copiar código** (ni traducido): InfiniTime, Gadgetbridge, KettlebellCounter, `wjdragon/archerytimer`, `ArcAndAlgorithm/ArcheryShotClock`. Solo ideas conceptuales.
    - **Sin licencia — no reutilizar código en absoluto** (ni siquiera "con atribución"): `Smart_arch_point`, `ArcheryTracking`, `guacamole_archery_tracker`, `gfwilliams/step-count`. Ideas públicas, sí.
16. **Qué NO adoptar**: el umbral de 12 g (es para IMU montada en riser con compuesto; la muñeca ve ~10-20× menos — nuestros 900 mg mínimos y el rango de Vemestael 0,8-2 g son la referencia correcta); el fallback "restar 9,81 a la magnitud total" de Vemestael (`ShotDetector.kt:141`) es una aproximación pobre si algún día necesitamos modo gravedad-incluida (mejor EMA de gravedad vectorial, que ya tenemos); magnetómetro como criterio de detección (Open-Float lo evita deliberadamente y ancla por secuencia, §2.4); y promediar muestras en el camino de detección (Open-Float promedia 3 muestras/0,9 ms solo porque va a 3332 Hz — a 25 Hz la media del periodo borrará el pico; usar máximo).

---

## 8. Índice de fuentes (todas consultadas el 2026-09-17)

- https://github.com/Vemestael/ArcheryShotCounter-wearos — `ShotDetector.kt`, `ShotDetectionPolicy.kt`, `ShotDetectionPolicyTest.kt`, `MainActivity.kt`, `MainScreen.kt`, `SettingsScreen.kt`, `Shot.kt`, `README.md`, `LICENSE` (MIT).
- https://github.com/Vemestael/ArcheryShotCounter-android — metadatos (compañero Kotlin, MIT).
- https://github.com/DevanMetz/Open-Float-Archery — `firmware/src/main.c`, `app/telemetry/score.js`, `app/telemetry/telemetry.js`, `Blueprint.md`, `README.md`, `LICENSE` (MIT).
- https://github.com/marc-schieferdecker/arduino-shot-counter — `lib/GyroMeasure/GyroMeasure.cpp`, `lib/DataProfiles/DataProfiles.{h,cpp}`, `lib/pageController/PageController.cpp` (MIT).
- https://github.com/mikkosh/shotgunsports — `README.md`, `source/ShotgunLap.mc` (Monkey C, MIT).
- https://github.com/espruino/Espruino — `libs/misc/stepcount.c`, `libs/banglejs/jswrap_bangle.c`, `LICENSE` (MPL-2.0).
- https://github.com/InfiniTimeOrg/InfiniTime — `src/components/motion/MotionController.{h,cpp}` (GPL-3.0).
- https://github.com/gfwilliams/step-count, https://github.com/pavloshargan/accelerometer_step_counter (MIT) — herramientas de validación offline de pasos.
- https://codeberg.org/Freeyourgadget/Gadgetbridge — estructura del paquete (GPL-3.0).
- Búsquedas GitHub: `archery accelerometer|shot detection|imu|wearable|counter|arduino|esp32`, `bow shot counter`, `arrow counter`, `connectiq archery`, `monkey c archery`, `garmin connectiq shot`, `shot detection imu`, `shot counter arduino`, `paintball shot counter`, `airsoft shot counter`, `punch counter|tracker`, `rep counter accelerometer`, `tennis swing detection`, `swim stroke counter`, `jump rope counter accelerometer`, `pushup counter accelerometer`, `kettlebell counter`, `pebble stroke counter`.
