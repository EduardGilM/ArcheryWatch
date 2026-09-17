# ArcheryWatch — contexto completo y punto de continuación

Actualizado: 15 de septiembre de 2026 (noche), Europe/Madrid. Documento de continuidad que resume la conversación, decisiones, investigación y acciones; no es una transcripción literal.

## 0. PIVOTE DE PLATAFORMA (decisión del usuario)

**El proyecto pasa del Xiaomi Watch S1 Active al Garmin Forerunner 165.** El usuario desvinculó el Xiaomi del Nothing (bond Android eliminado a las 19:17) y emparejó un FR165 (nuevo bond a las 19:22, Garmin Connect v5.29 instalada desde julio, actualizada hoy). Mi Fitness queda archivado por orden expresa («El mi fitness ya ignoralo, vamos a trabajar con el garmin»).

Por qué el FR165 es muy superior para este proyecto: Connect IQ es un SDK oficial gratuito; acelerómetro y giroscopio accesibles con `Sensor.registerSensorDataListener()` hasta 25 Hz (verificado en la doc del SDK 9.2.0: FR165 y FR165 Music aparecen en dispositivos soportados de `AccelerometerData` y `GyroscopeData`); `SensorLogging.SensorLogger` graba accel+gyro directamente a FIT que sincroniza con Garmin Connect. Límite asumido: 25 Hz no captura el pico fino de vibración de la suelta (MantisX usa 100–400 Hz); sirve para ciclo de abertura, estabilidad, follow-through y detección de tiro.

## 1. Objetivo del usuario y acuerdos

El usuario preguntó por Mantis Archery y la función de arquería del Garmin fēnix 9 Pro: quería saber si existen alternativas open source y si se puede replicar en el reloj que tiene. La idea es que **el reloj registre el tiro y envíe la información al teléfono**.

Confirmó después:

- Reloj: **Xiaomi Watch S1 Active**.
- Teléfono: Android. Inicialmente no indicó modelo; posteriormente ADB identificó Nothing A069, Android 16.
- Quiere construir **nuestro propio sistema prácticamente desde cero**, reutilizando las partes útiles del open source. No busca limitarse a instalar una aplicación existente.
- Autorizó avanzar con «Pues adelante» tras proponer una primera prueba de acceso al sensor y visualización de una grabación.
- Instrucción del proyecto: «Implementa todo con la menor cantidad de líneas de código posibles».
- Última petición: **antes de seguir, documentar todo en un Markdown porque queda poco uso**. El trabajo técnico queda detenido en este punto; no continuar automáticamente con más pruebas tras esta documentación.

No se conoce todavía si usa arco recurvo o compuesto, en qué muñeca llevará el reloj, ni la versión de firmware. No se ha confirmado si el reloj está vinculado al Nothing actual o a otro móvil.

## 2. Arquitectura planteada

1. Reloj: capturar acelerómetro y giroscopio cuando sea posible, detectar tiros y conservar ventanas anteriores y posteriores a la suelta.
2. Registro: sesiones y tiros con identificadores y marcas temporales; idealmente funcionamiento sin conexión y recuperación posterior.
3. Comunicación: sincronizar con Android, tolerando desconexiones.
4. Móvil: trazas de movimiento, número de flechas, tiempos, estabilidad y comparación entre tiros/sesiones.
5. Algoritmos: empezar con una detección sencilla y calibrarla con tiros reales marcados manualmente; medir falsos positivos y tiros perdidos.

Esta arquitectura es una propuesta, **no está implementada**. Primero se acordó demostrar que podemos obtener datos reales del S1 Active.

Limitaciones explicadas: la muñeca y el arco no forman un cuerpo rígido; medir la muñeca no equivale a medir un sensor fijado al arco. No se ha prometido precisión equivalente a Mantis/Garmin, trayectoria exacta de apuntado ni posición de impacto de la flecha. La calidad de la captura debe validarse físicamente.

## 3. Referencias investigadas

| Proyecto/producto | Hallazgos y uso posible |
| --- | --- |
| [Mantis X8](https://mantisarchery.com/pages/how-it-works) | Sensor fijado al arco, conectado por BLE al móvil; análisis de movimiento, estabilidad, inclinación y tiempos. Referencia funcional. |
| [Garmin ArcheryX](https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/) | Anunciado el 25/08/2026 para fēnix 9/9 Pro, orientado a compuesto, análisis de muñeca y revisión en ShotView. El manual indica muñeca del brazo que sostiene el arco y calibración al cambiar de arco. |
| [ArcheryShotCounter](https://github.com/Vemestael/ArcheryShotCounter) | MIT, Kotlin, Wear OS 3+. Aceleración lineal, umbral y bloqueo de 2 segundos; historial y corrección manual. Referencia para detección inicial, **no instalable directamente en S1 Active**. No se verificó una sincronización móvil ni análisis completo tipo Mantis. |
| [Open Float Archery](https://github.com/DevanMetz/Open-Float-Archery) | MIT, sensor externo XIAO nRF54L15 Sense/Zephyr y panel web. Referencia para telemetría, ventanas, puntuación experimental y recuperación de datos; no es firmware para el Xiaomi. |
| [Gadgetbridge](https://codeberg.org/Freeyourgadget/Gadgetbridge) | AGPLv3; referencia concreta para conexión, autenticación y protocolo Xiaomi. **Se encontró captura de aceleración cruda en 0.93.0**. Instalado como herramienta de prueba; no sustituye nuestro producto. |
| [xiaomi-band-development](https://github.com/oryonatan/xiaomi-band-development) | Herramientas para Vela y RPK; lista S1 Pro y modelos posteriores, no confirma S1 Active. No se ejecutaron scripts de este proyecto. |

La propuesta inicial de Wear OS y su Data Layer se hizo antes de conocer el modelo. **Queda descartada para este reloj**; Android en el móvil no implica Wear OS en el reloj.

## 4. Lo que sabemos del S1 Active

- Xiaomi especifica acelerómetro y giroscopio: [especificaciones](https://www.mi.co.id/id/product/xiaomi-watch-s1-active/specs/).
- Xiaomi documenta apps de terceros a través de Mi Fitness: [FAQ](https://www.mi.com/ph/support/faq/details/KA-08502/). Esa FAQ mezcla textos antiguos de Color 2 y Android 12 beta; no extrapolar todos sus detalles a firmware/región actuales.
- Tener tienda de apps no prueba que podamos instalar paquetes propios ni acceder a sensores continuamente.
- La documentación pública Vela lista **S1 Pro**, no S1 Active. Además, [su tabla de sensores](https://iot.mi.com/vela/quickapp/en/features/system/sensor.html) marca acelerómetro no soportado en S1 Pro. No confundir modelos ni asumir compatibilidad por tener pantalla similar.
- Gadgetbridge clasifica el S1 Active como experimental, conexión `BOTH` (BLE/Classic). Su coordinador reconoce `^XiaomiWatchS1Active [0-9A-Z]{4}$`.

### Corrección importante durante la investigación

Al principio solo se encontró documentación general de pasos/pulso, sin movimiento crudo. **Después se consiguió leer código actual y se descubrió una ruta real de acelerómetro**. No continuar a partir de la conclusión antigua «no hay ruta».

## 5. Ruta concreta de acelerómetro descubierta

Código comprobado en la versión publicada [Gadgetbridge 0.93.0, XiaomiHealthService.java](https://codeberg.org/Freeyourgadget/Gadgetbridge/raw/tag/0.93.0/app/src/main/java/nodomain/freeyourgadget/gadgetbridge/service/devices/xiaomi/services/XiaomiHealthService.java). No requiere nightly por esta función.

`XiaomiCoordinator.getSleepAsAndroidFeatures()` declara `ACCELEROMETER` por defecto. El coordinador S1 Active no redefine esa capacidad; **esto no demuestra que su firmware responda**.

Secuencia observada, siempre usando transporte y autenticación Xiaomi existentes, `Command.type=8`:

| Fase | Detalles |
| --- | --- |
| Inicio | `startRawSensor()`: estadísticas en directo subtipo 45; estado de entrenamiento subtipo 26, `sport=810`, `status=0`, `sportInfo.type=16`, `unknown6=3`, timestamp en segundos. |
| Confirmación | Al recibir `WorkoutOpenWatch` subtipo 30, responder `WorkoutOpenReply` con `unknown1/2/3 = 0/2/2`. |
| Datos | Subtipo 53: `RawSensorBatch.accel[]` con `AxisSensor.x/y/z`; se reenvían a `SleepAsAndroidSender.onAccelChanged`. |
| Mantenimiento | ACK subtipo 49 cada diez lotes, contador creciente y `unknown2/3=0`. |
| Parada | `stopRawSensor()`: subtipo 46, luego estado 1 y estado 3. El código indica semántica intermedia incierta pero necesaria. |

El código describe un entrenamiento sintético oculto/no persistente. Esta ruta podría proporcionar **streaming de aceleración al teléfono**, pero no demuestra giroscopio, captura autónoma ni recuperación después de desconectar. El manejador revisado no usa timestamps individuales; revisar esquema protobuf y unidades. No convertir tiempos de recepción en tiempos exactos de muestra sin evidencia.

Falta investigar cómo invocar esta función desde la aplicación publicada y exportar los ejes: podría requerir integración de prueba con los eventos de Sleep as Android o instrumentación de Gadgetbridge. No se ha instalado Sleep as Android ni se ha construido ese receptor.

Más detalles y enlaces al coordinador/servicios: [docs/s1-active-viabilidad.md](docs/s1-active-viabilidad.md).

## 6. Acciones realizadas en el ordenador y teléfono

### Entorno

- Carpeta de trabajo: `C:\Users\eduar\Desktop\Eduard\Repositorios\ArcheryWatch`.
- PowerShell en Windows. Al inicio solo existía la carpeta de documentación creada durante esta conversación; no se ha inicializado Git ni hecho commits.
- ADB disponible en PATH mediante Google Platform Tools de WinGet.
- Python de PATH procedía del entorno de Hermes y no tenía pip. `python -m venv .venv` creó el entorno, pero falló el paso ensurepip.
- Se utilizó `uv --cache-dir .uv-cache pip install --python .venv/Scripts/python.exe bleak` para completar dependencias locales. La red requirió escalación y fue autorizada; no hubo rechazo de revisión automática.
- Instalado Bleak **3.0.2** y sus dependencias WinRT en `.venv`; `requirements.txt` fija esa versión.
- `.uv-cache` y `.venv` son locales al proyecto. No se modificaron entornos globales.

### Detección inicial

- `Get-PnpDevice` falló por acceso denegado; se usó `pnputil`.
- ADB y mDNS inicialmente no detectaban dispositivos. Los dispositivos portátiles no mostraban el reloj.
- El inventario Bluetooth de Windows mostraba varios móviles/accesorios emparejados; no se tomó eso como identificación del reloj ni como conexión activa.
- Primer escaneo BLE: varios dispositivos, ninguno identificado como reloj. No se concluyó que el reloj careciera de BLE.

### Teléfono detectado después

- ADB pasó a mostrar un dispositivo autorizado.
- Fabricante `Nothing`, modelo `A069`, Android `16`.
- Mi Fitness: paquete `com.xiaomi.wearable`, versión `3.57.0i`, código `357000`.
- Se consultaron nombres de paquetes relacionados con Xiaomi/salud, sin extraer sus datos personales.
- Accesibles los logs de Mi Fitness en `/sdcard/Android/data/com.xiaomi.wearable/files/log/`.
- Copiados a `captures/`: `XiaomiFit.device.log` y `XiaomiFit.main.log`.
- Se buscaron campos de modelo/firmware/autenticación. **No se obtuvo firmware ni una clave de autenticación** con esas búsquedas; no demuestra que nunca puedan aparecer en otros registros o tras vincular.
- Los logs mostraron anuncios de `XiaomiWatchS1Active A6CB`; solo se verificó búsqueda/detección, no vinculación completa.
- Los logs pueden contener datos sensibles: conservar localmente, no publicar su contenido ni claves. No se extrajeron credenciales de cuentas ni se inició sesión en nombre del usuario.

### Conexión real al reloj

- Segundo escaneo detectó `XiaomiWatchS1Active A6CB`.
- Dirección observada en esa sesión: `44:27:F3:49:A6:CB`. Dato local del dispositivo, no una credencial; verificar de nuevo si cambia.
- `tools/probe.py --address ...` completó conexión GATT, enumeración y desconexión sin error.
- Se encontraron siete servicios: `1800`, `1801`, `FE95`, `FDAB`, `3802`, `cc353442-be58-4ea2-876e-11d8d6976366`, `1314ff00-1000-9000-7000-301291e21220`.
- `FDAB`: característica `00000001` de lectura; `00000002` y `00000003` de notificación/escritura sin respuesta. **No se enviaron comandos propietarios** ni se asumió que fueran datos de movimiento.
- No se expuso servicio Device Information `180A`; el lector estándar no obtuvo firmware.
- Informe completo: `captures/watch-services.json`.

### Gadgetbridge instalado

- Descargada [APK 0.93.0 desde F-Droid](https://f-droid.org/repo/nodomain.freeyourgadget.gadgetbridge_252_01cce93.apk), enlazada en su [ficha oficial](https://f-droid.org/packages/nodomain.freeyourgadget.gadgetbridge/).
- Copia local: `captures/gadgetbridge-0.93.0.apk` (22.706.393 bytes).
- `adb install` terminó con `Success`.
- `dumpsys package` confirmó `nodomain.freeyourgadget.gadgetbridge`, `versionName=0.93.0`, `versionCode=252`.
- **No se configuró el reloj en Gadgetbridge, no se concedieron permisos adicionales, no se abrió una sesión de sensor.** La firma de desarrollador es la descrita por F-Droid; no se hizo auditoría criptográfica independiente.

### Investigación de código

- Se usó la habilidad `research` y un agente de investigación en paralelo.
- El acceso web a Codeberg falló; la descarga de archivos sueltos por PowerShell con red autorizada sí funcionó.
- Se inspeccionaron `XiaomiWatchS1ActiveCoordinator.java`, `XiaomiCoordinator.java`, `XiaomiHealthService.java`, `XiaomiSystemService.java`, changelog y el HealthService del tag 0.93.0.
- Algunas copias quedaron en TEMP (`archery-s1-coordinator.java`, `archery-xiaomi-health.java`, entre otras); pueden desaparecer. Las fuentes reproducibles están enlazadas en la nota de viabilidad.
- No se clonó el repositorio completo ni se incorporó código AGPL a nuestra herramienta Python. Esta es propia y usa Bleak; si se reutiliza código de Gadgetbridge, conservar su procedencia/licencia.

## 7. Archivos creados o actualizados

| Archivo | Contenido |
| --- | --- |
| `CONTINUIDAD.md` | Este documento: contexto y punto para retomar. |
| `README.md` | Alcance actual, ejecución del diagnóstico y criterios para avanzar. |
| `requirements.txt` | `bleak==3.0.2`. |
| `.gitignore` | Excluye `.venv/`, `.uv-cache/`, `__pycache__/`, `captures/`. No existe aún repositorio Git inicializado. |
| `tools/probe.py` | Escaneo BLE e inspección de un dispositivo seleccionado, informes JSON y manejo de errores. |
| `docs/investigacion-arqueria.md` | Comparación inicial, fuentes y limitaciones. Actualizada para reflejar el modelo confirmado. |
| `docs/s1-active-viabilidad.md` | Investigación específica y protocolo de acelerómetro encontrado. |
| `docs/prueba-dispositivo.md` | Resultados físicos y estado de instalación de Gadgetbridge. |
| `captures/ble-probe.json` | Primer escaneo. |
| `captures/ble-probe-2.json` | Segundo escaneo que identificó el reloj. |
| `captures/watch-services.json` | Servicios y características del reloj. |
| `captures/XiaomiFit.*.log` | Dos registros locales de Mi Fitness. No publicar. |
| `captures/gadgetbridge-0.93.0.apk` | Herramienta descargada para la siguiente prueba. |

### Funcionamiento de la herramienta propia

`tools/probe.py` escanea durante 12 segundos por defecto. Sin `--address`, solo descubre anuncios. Con dirección exacta, exige haberla detectado y conecta únicamente a ese dispositivo. Enumera servicios/características y solo intenta leer modelo/fabricante/firmware/hardware estándar si están disponibles. Guarda errores en el informe y devuelve código 1; escaneo vacío se informa sin afirmar incompatibilidad.

No implementa autenticación Xiaomi, notificaciones de sensores, decodificación protobuf ni gráficas. No inicia emparejamiento explícito, entrenamiento, instalación o escritura propietaria.

Comandos ya utilizados, desde la raíz:

```powershell
.\.venv\Scripts\python.exe tools/probe.py
.\.venv\Scripts\python.exe tools/probe.py --seconds 15 --output captures/ble-probe-2.json
.\.venv\Scripts\python.exe tools/probe.py --address 44:27:F3:49:A6:CB --output captures/watch-services.json
.\.venv\Scripts\python.exe -m py_compile tools/probe.py
.\.venv\Scripts\python.exe tools/probe.py --help
adb devices -l
```

Compilación y ayuda correctas; escaneos reales e inspección GATT correctos. No hay suite de tests, captura de IMU, prueba de tiros ni validación de precisión. No se ha comprobado recuperación ante todos los errores Bluetooth.

## 8. Preguntas pendientes al usuario

Se pidieron mediante preguntas asíncronas:

1. Poner reloj cerca y conectar móvil por USB con depuración autorizada; indicar firmware. **La conexión del móvil se consiguió**, firmware no.
2. «¿El reloj ya aparece vinculado y sincronizado en Mi Fitness de este Nothing, o sigue vinculado a otro teléfono? No lo desvincules ni restaures». **Sin respuesta al cierre de este documento.**

También queda por conocer arco recurvo/compuesto y muñeca, pero no bloquean la prueba inicial de movimiento.

No se ha pedido ni autorizado expresamente restaurar el reloj, cambiar firmware o borrar datos. Mantener vinculación existente; no usar desvinculación como paso rutinario, porque puede restaurarlo.

## 9. Próximo paso exacto al retomar

1. Leer este documento; respetar la pausa actual hasta que el usuario quiera continuar.
2. Confirmar vinculación actual y firmware. Reutilizar el acceso ADB autorizado si sigue disponible; no repetir instalación de Gadgetbridge ni toda la investigación.
3. Establecer autenticación Xiaomi sin borrar la vinculación. Investigar cómo obtener de forma local la clave necesaria a partir de la vinculación legítima; mantener secretos fuera de documentación/salidas.
4. Configurar el instrumento de prueba Gadgetbridge 0.93.0 y verificar cómo invocar `startRawSensor()` y recoger sus ejes. Revisar `SleepAsAndroidSender`, receptor de eventos y esquema protobuf si hace falta. No asumir que abrir la app empieza a grabar.
5. Intentar una captura acotada de 30 segundos con reposo, inclinación y movimiento. Finalizar siempre la sesión sintética. Guardar muestras reales, tiempos de recepción y origen.
6. Verificar unidades, frecuencia efectiva, agrupación de muestras y pérdidas. Solo entonces visualizar la señal y probar detección de tiros.
7. Validar por separado giroscopio, pantalla apagada y registro sin móvil. Si la ruta solo transmite en directo, explicar esa limitación respecto al objetivo original; no presentar streaming como almacenamiento autónomo.

**Estado al pausar:** reloj localizado y accesible por Bluetooth; herramienta propia de diagnóstico funcional; vía de acelerómetro encontrada en código publicado; Gadgetbridge instalado; autenticación pendiente; **cero muestras de movimiento obtenidas todavía**.

## 10. Cierre de la vía Xiaomi (15 de septiembre, tarde)

- La clave de autenticación Xiaomi (16 bytes, handshake HMAC «miwear-auth», AES-CCM) no está accesible: la ruta de log de 2022 (issue #2991 de Gadgetbridge, `authKey=...` en `XiaomiFit.device.log`) está parcheada en Mi Fitness 3.57.0i (cero coincidencias en todos los logs, incluido el persistente y capturas logcat durante reconexiones forzadas con ciclo de Bluetooth).
- Gadgetbridge no admite emparejamiento nuevo de Xiaomi ya vinculados: `XiaomiAuthService.getSecretKey()` solo lee la clave guardada; no hay ruta que reciba clave nueva del reloj.
- Diagnóstico final del estado Xiaomi: el Nothing tenía solo bond Android (HFP/Classic) con el reloj; Mi Fitness nunca lo tuvo registrado como dispositivo activo («no current device, stop service», `device size 0`), y el reloj aceptaba GATT desde Windows estando «conectado» al teléfono. La clave estaba en otro teléfono, si es que existía.
- El usuario resolvió el bloqueo desvinculando el Xiaomi y pasando al Garmin. Capturas Xiaomi conservadas en `captures/` (logs, probe BLE, watch-services.json, gadgetbridge apk, gb-src con fuentes AGPL consultadas — solo lectura, sin código copiado).

## 11. Avance Garmin (15 de septiembre, noche)

Entorno creado en el PC:

- Java 21 (OpenJDK Microsoft) ya presente.
- Connect IQ SDK **9.2.0** descargado por URL directa (manifiesto público `https://developer.garmin.com/downloads/connect-iq/sdks/sdks.json` → `connectiq-sdk-win-9.2.0-2026-06-09-92a1605b2.zip`), extraído en `tools/ciq/sdk/` (ignorado por git). `monkeyc.bat` funciona (compilador 9.2.0).
- SDK Manager GUI en `tools/ciq/manager/` (WebView2). Licencia de desarrollador aceptada el 15/09 a las ~19:40 tras decisión de continuar. El manager pide **login de cuenta Garmin de desarrollador** antes de descargar nada.
- **Bloqueo actual:** `monkeyc -d fr165` falla con «Invalid device id»: el compilador 9.x carga definiciones de dispositivo desde `~/.Garmin/ConnectIQ/Devices/` (JSON que baja el SDK Manager tras login). El XML embebido en `monkeybrains.jar` (`com/garmin/monkeybrains/devices/devices.xml`, contiene `fr165` con CIQ 5.2.0, pantalla 390x390, icono 54x54) es un esqueleto sin anotaciones de API; `--override-devices-json` (opción oculta) lo acepta pero revienta con NPE. Probado sin éxito: `-u` (deprecado, ignorado), extraer el XML a `bin/`, URLs de SDKs antiguos (404), repos GitHub con devices.xml commiteado. La alternativa headless (`lindell/connect-iq-sdk-manager-cli`) también exige login Garmin (OAuth o usuario/clave).
- IDs de dispositivo FR165 confirmados: `fr165` y `fr165m` (Music).

App creada (`watchapp/`, compila pendiente de devices):

- `monkey.jungle`, `manifest.xml` (productos fr165+fr165m, permiso Sensor, minSdk 3.3.0, id A2C49E17B03A4F1E8D5C6B7A90E1F2D3), recursos (strings, icono naranja 54x54 generado con Python puro) y `source/ArcheryApp.mc`.
- La app registra listener accel+gyro a `getMaxSampleRateForSensorType()`, lotes de 1000 ms, muestra en pantalla: tasas máximas, últimos valores (accel g aprox, gyro deg/s), contadores de muestras y Hz efectivos; try/catch con error visible en pantalla (diagnóstico in situ si el gyro no estuviera expuesto).
- Comando de compilación: `./tools/ciq/sdk/bin/monkeyc.bat -f watchapp/monkey.jungle -d fr165 -o watchapp/build/AW-fr165.prg` (requiere Devices/ del manager).

API clave verificada en la doc offline del SDK: `Sensor.registerSensorDataListener(method, {:period => ms, :accelerometer => {:enabled, :sampleRate, :includeTimestamps...}, :gyroscope => {...}})`; `SensorData.accelerometerData/.gyroscopeData` dan arrays por eje; gyro en deg/s. `SensorLogging.SensorLogger({:accelerometer=>{:enabled=>true},:gyroscope=>{:enabled=>true}})` se pasa a una sesión FIT para grabar a fichero.

Próximos pasos exactos al retomar:

1. **HECHO (15/9 noche):** login del usuario en SDK Manager; descarga de definiciones de dispositivos (incluidos fr165/fr165m con compiler.json) a `%APPDATA%\Garmin\ConnectIQ\Devices\`; puente creado en `%USERPROFILE%\.Garmin\ConnectIQ\sdkmanager-download-location.cfg` apuntando ahí para que monkeyc los cargue.
2. **HECHO:** compilación `BUILD SUCCESSFUL` para fr165 y fr165m → `watchapp/build/AW-fr165.prg` y `AW-fr165m.prg` (firmados con RSA PKCS#8 **DER binario** `watchapp/developer.der`; PEM NO vale — KeyUtils mete los bytes directo a PKCS8EncodedKeySpec; DSA tampoco: espera RSA).
3. **HECHO:** app verificada en simulador CIQ (Forerunner 165 5.2.0): arranca sin error y muestra **maxRate a25 g25** — acelerómetro y giroscopio EXPUESTOS a Connect IQ a 25 Hz máx en FR165 (confirmado en runtime, no solo doc). El simulador no inyecta datos IMU (Activity Select solo da GPS/pasos): muestras a 0 es lo esperado; los datos reales requieren el reloj físico.
## 12. Veredicto sensores en el FR165 real (15/9, ~21:00)

- **Acelerómetro: 99,8 Hz reales** (la API declara 25 de máximo, el firmware entrega 100). Validado en muñeca con la app en el reloj. Régimen comparable a MantisX.
- **Giroscopio: NO expuesto por el firmware.** Experimento automatizado en la app (re-registro gyro-only a los 3 s): `gyroscopeData` siempre null (`l:0 u:-1 SOLO`). Mismo defecto documentado del Forerunner 170: hardware y specs lo listan, la API compila y `getMaxSampleRateForSensorType(:gyroscope)` devuelve 25, pero jamás llega un dato. Posible reporte en foros de Garmin. **El proyecto sigue con accel-only.**
- Firmware del reloj: 28.05, part 006-B4432-00, idioma spa.

## 13. v4: captura a FIT (15/9, ~21:15)

- `watchapp` reescrita como capturadora: al abrir, crea `SensorLogging.SensorLogger({:accelerometer=>{:enabled=>true}})` + `ActivityRecording.createSession({:sport=>SPORT_GENERIC, :name=>"ArcheryWatch", :sensorLogger=>logger})` + `session.start()`; listener accel en paralelo para el dashboard en vivo (REC en rojo, accel xyz naranja, muestras, Hz efectivos); al salir `onStop` → `session.stop()` + `session.save()`.
- Permisos manifest correctos: `Sensor`, `Fit`, `SensorLogging` (ids válidos; «ActivityRecording» NO es un id válido de permiso).
- El FIT queda en `GARMIN/Activity/` del reloj (accesible por MTP) y también sincroniza a Garmin Connect.
- Sideload v4 completado (COPIADO_OK).

Pendiente al retomar: ~~captura oficial~~ → **HECHO (15/9 21:06)**. Resultados de `captures/2026-09-15-21-05-44.fit` (30 s, reposo/inclinar/mover):
- **3000 muestras en 30,1 s = 99,7 Hz sostenidos**; dt mediana 10 ms, máx 16 ms, **0 huecos > 20 ms**.
- **Unidades: milig** (mG): fase estática |a| ≈ 1020 mG = gravedad; picos de movimiento hasta 8800 mG. El campo se llama `calibrated_accel_*` con etiqueta «g» pero los valores son mG.
- Estructura FIT: mensajes `accelerometer_data` con arrays por eje + `sample_time_offset` (ms, timestamp POR MUESTRA) + `timestamp`/`timestamp_ms` de base por mensaje. 25 muestras/mensaje típicamente.
- Export limpio a `captures/aw-session1.csv` (t_ms, x_mg, y_mg, z_mg). Parser: fitparse 1.2.0 en `.venv` (instalado con uv).

Siguientes pasos reales del proyecto (nada bloquea):
1. Prototipo de detección de tiros sobre esta señal (umbral + ventana pre/post; validar con la sacudida de la captura y luego con sesiones reales de arquería).
2. App v5: modo arquería (grabación continua larga, auto-detección en reloj opcional, marca de tiros manual con botón para calibrado).
3. Lado móvil: análisis/visualización de sesiones (el FIT sincroniza solo a Garmin Connect; alternativa directa por USB/MTP).
4. Opcional: reportar a Garmin el gyro muerto del FR165 (como el caso FR170).
5. Pendiente (acción física del usuario): expulsar el reloj del USB, verificar Modo desarrollador activo (Ajustes → Sistema → Modo de desarrollador) y abrir la app «ArcheryWatch» (icono naranja) desde la lista de apps con START. Prueba de 30 s: reposo → inclinación → movimiento; anotar contadores «muestras aN gN» y Hz de pantalla.
6. Después: exportación de datos crudos (SensorLogger a FIT o Communications), ventana pre/post suelta, detección de tiros, comparación de sesiones.

Notas técnicas del toolchain (para no re-tropezar):

- **Firma: LA CLAVE DEBE SER RSA-4096 en PKCS#8 DER binario** (`openssl genrsa 4096` + `openssl pkcs8 -topk8 -nocrypt -outform DER`). El formato `DeveloperSignature` del firmware usa campos fijos: firma 512 B, módulo 512 B, exponente 4 B; V1 (SHA1) = 1036 B, V2 (SHA1+SHA256 doble firma) = 1548 B. Una clave RSA-2048 compila sin error pero el reloj la rechaza: `CIQ_LOG`: «Signature check failed» (firmware 28.05, part 006-B4432-00). PEM tampoco vale (KeyUtils mete bytes crudos a PKCS8EncodedKeySpec; algoritmo RSA obligatorio).
- **«Modo desarrollador» NO existe en los Garmin actuales** — es un bulo de IA extendido en foros (desmentido por moderadores). El sideload es solo copiar el .prg (nombre 8.3) a `GARMIN/Apps/`. El reloj escanea la carpeta al desconectar/abrir el launcher; si acepta, importa y borra el fichero; si rechaza, lo borra y deja el motivo en `GARMIN/Apps/LOGS/CIQ_LOG.BAK` (ese fichero es el diagnóstico de oro).
- `watchapp/developer.der` (RSA-4096) y `dev4096.pem` son la clave de firma definitiva; fuera de git. Regenerar invalidaría apps instaladas.
- Compilar: `./tools/ciq/sdk/bin/monkeyc.bat -f watchapp/monkey.jungle -d fr165 -y watchapp/developer.der -o watchapp/build/AW-fr165.prg` (device `fr165m` para Music).
- Sintaxis Monkey C que costó: `catch (e instanceof Lang.Exception)`, sin tipos en locales, `System.getTimer()` para ms, `Sensor.unregisterSensorDataListener()`, sin `COLOR_CYAN`.
- Copia MTP desde PowerShell (Shell COM): enumerar `::{20D04FE0...}` → Forerunner 165 → Internal Storage → GARMIN → Apps → `CopyHere` con fuente desde ruta absoluta de Temp de Windows (los special-folders fallan y ocultan el error).
- SDK Manager GUI en `tools/ciq/manager/` con sesión iniciada; definiciones de dispositivo en `%APPDATA%\Garmin\ConnectIQ\Devices\` (fr165 descargado); puente para el compilador en `%USERPROFILE%\.Garmin\ConnectIQ\sdkmanager-download-location.cfg`.
- El simulador CIQ escucha en TCP 1234; no inyecta datos IMU (solo GPS/pasos con Activity Select) — las muestras reales requieren el reloj físico.

## 14. Detector v1, app v5 (modo arquería) y app móvil (15/9, ~23:00)

**Detector de tiros** (`tools/detect_shots.py`, validado sobre la captura real):
- Algoritmo mínimo: desviación de |a| respecto a gravedad local (media móvil 500 ms), umbral **1500 mG**, periodo refractario 1500 ms, ventanas **PRE 3000 ms / POST 2000 ms**.
- Métricas por tiro: `t_ms`, `peak_mg`, `instab_mg` (inestabilidad pre-suelta), `settle_ms` (asentamiento post-suelta), `aim_score` (0–100), arrays `tilt_x/tilt_y` (trayectoria de apuntado para el diagrama XY).
- Resultado sobre `aw-session1.csv`: 1 tiro (la sacudida deliberada, t=24840 ms, pico 4630 mG, settle 131 ms) y **0 falsos positivos** en reposo/inclinación. Salida: `captures/aw-session1-shots.json`.

**Watchapp v5** (sideloadada, COPIADO_OK):
- Dashboard arquería: REC + tiempo, accel xyz, contador **TIROS**.
- `onSelect()` (botón START) → `markShot()`: `session.addLap()` + incrementa TIROS. Los laps del FIT marcan los tiros reales para calibrar el detector.
- Sigue grabando FIT accel 100 Hz con SensorLogger como v4.

**App móvil** (`mobile/index.html`, un solo fichero, sin dependencias):
- Vista estilo MantisX: cabecera SHOT N con flechas ‹ ›, **diagrama XY de apuntado** (5 anillos verde-centro→rojo-borde, traza azul, puntos coloreados por tiempo), 4 métricas (PUNTERÍA / PICO / ASENTAM. / INESTAB.), barra de fases (AIM/RELEASE/FOLLOW-THROUGH), **traza temporal** con fases sombreadas y línea de suelta, selector de tiros, carga de JSON por botón y `fetch` de `./aw-session1-shots.json` al arrancar.
- Verificación visual en navegador 390x780: diagrama, métricas (89/4630/131 ms/285) y traza renderizan correctamente; corregido orden de anillos (verde al centro, estilo MantisX).
- **Despliegue en el Nothing A069:** `python -m http.server 8901` (sirviendo `mobile/` en segundo plano) + `adb reverse tcp:8901 tcp:8901` + Chrome en `http://127.0.0.1:8901/`. Nota: el intent genérico sin componente no resuelve en Nothing OS; usar `-n com.android.chrome/com.google.android.apps.chrome.Main`. El túnel vive mientras el proceso adb siga y el USB esté conectado; re-ejecutar `adb reverse` tras reconectar.

Pipeline completo operativo: **reloj (FIT accel 100 Hz + laps) → USB/MTP → detect_shots.py → JSON → app móvil en el teléfono.**

Siguientes pasos:
1. **Sesión real de arquería con v5**: grabar tiros de verdad, marcar cada uno con START, traer el FIT y calibrar el umbral del detector contra los laps marcados.
2. Ajustar PRE_MS/POST_MS y métricas con tiros reales (la sacudida de mano no es una suelta de arco).
3. Opcional: reportar el gyro muerto del FR165 a Garmin.

## 15. App móvil v2: PWA instalable + sets automáticos (16/9, ~00:30)

Petición del usuario: «que sea una app real y no una pagina web», quitar «cargar sesión» y **sets automáticos** («si lleva mas de 1 minuto sin tirar, ha acabado el set»).

- **PWA** (`mobile/manifest.json` + `mobile/sw.js` + iconos): standalone, tema oscuro, icono diana 192/512 (`tools/gen_icons.py`, PNG puro con supersampling). SW cache-first para el shell y **network-first para JSON** (las sesiones nuevas siempre se ven); para publicar cambios del index/estilos, subir la versión `C='aw-v1'` en `sw.js` (cache-first). `http://127.0.0.1` es contexto seguro → instalable e SW válido a través del túnel adb. Botón flotante «INSTALAR APP» vía `beforeinstallprompt`; también instalable desde menú de Chrome → Añadir a pantalla inicio. Arranca offline tras primera visita.
- **Sets**: `sets()` agrupa tiros ordenados por hueco de t_ms > `GAP_MS=60000` (>1 min sin tirar = set nuevo; exactamente 60 s NO corta, unit-testeado en Node). Cabecera «SET n · FLECHA k/N», barra de tabs de sets (oculta si solo hay 1), botones de tiro F1..Fn dentro del set, flechas ‹ › navegan global saltando entre sets.
- **Cargar sesión eliminado**: solo `fetch('./shots.json')` con fallback `./aw-session1-shots.json`. El JSON canónico de ahora en adelante: `mobile/shots.json` (copiar ahí la salida del detector).
- Verificado en navegador 390x780: sets, anillos verde-centro, métricas, SW activo. Relanzado en el Nothing (force-stop Chrome + am start; el túnel `adb reverse` persiste por proceso adb, re-ejecutar si se reconecta USB).

## 16. APK real + app v3 estilo MantisX (16/9, ~01:30)

El usuario rechazó la PWA («no es una app, es una pagina pedorra») y pidió revisar MantisX para mejorar.

**Investigación MantisX** (mantisx.com/pages/mantisx-for-archery): puntuación 0-100 por tiro con clasificación de errores (<95 = error), reproducción/playback del movimiento del arco, histórico y comparación entre tiros/sesiones, consejos de entrenamiento según patrones.

**APK nativo** (`android/`, sin Gradle):
- WebView fullscreen (Theme.Black.NoTitleBar.Fullscreen) cargando `file:///android_asset/index.html`; `setAllowUniversalAccessFromFileURLS` para poder refrescar `shots.json` desde el túnel adb. Package `com.archerywatch.app`, minSdk 24, target 34.
- Toolchain manual descargado en `tools/android/`: build-tools 34 (extrae a `android-14/`, tiene aapt2/d8/apksigner) + `platform-34-ext7_r03.zip` (→ `android-34/android.jar`). URLs directas de `dl.google.com/android/repository/` (el nombre `platform-34_r02.zip` NO existe; consultar `repository2-3.xml`).
- `android/build.sh`: aapt2 compile+link (-A mobile como assets) → javac → jar de classes → d8 → `jar -uf base.apk classes.dex` → apksigner con `tools/android/archery.keystore` (pass archery123, alias aw; **perder el keystore obliga a desinstalar para actualizar**). Incrementar `versionCode` en cada build.
- Trampa bash que costó: `$` en `R$drawable.class` se expande como variable vacía dentro de `eval` → d8 veía R.class duplicado; solución: empaquetar classes en jar y pasarlo entero.
- Instalado (v2, versionCode 2) y lanzado en el Nothing: `adb install -r` + `am start -n com.archerywatch.app/.MainActivity`.

**App v3** (`mobile/index.html`, misma sirve de assets y de web):
- Nav inferior 3 vistas: **SESIÓN** (resumen: flechas/media/mejor/desv., gráfico de tendencia por flecha coloreado por nota, lista de sets con media y salto al primer tiro), **TIRO** (vista MantisX existente + nota A-E coloreada junto a la puntuación + botón ▶ REPRODUCIR que anima la trayectoria en 3 s con punto blanco + tarjeta de consejos) y **SET** (todas las flechas del set superpuestas en el diagrama con un color por flecha + leyenda + lista con pico/asentamiento).
- Notas: ≥90 A verde, ≥75 B, ≥75... escala A/B/C/D/E. Consejos (heurísticos): inestab>250 mG, settle>400 ms, pico>5000 mG, score<60.
- Orden de fetch de sesión: `./shots.json` → `./aw-session1-shots.json` → `http://127.0.0.1:8901/shots.json` (túnel).
- SW subido a `aw-v2`; ojo: sin `skipWaiting`, actualizar shell web exige unregister/clear o recargas.
- Verificado en navegador: SESIÓN (1/89/89/0 + lista), TIRO (nota «89 B», playback capturado a mitad con punto blanco, consejo por 285 mG), SET (leyenda F1·89 + línea pico/asentamiento).

## 17. Tiempo real: v6 en reloj + EN VIVO en APK (16/9, ~02:30)

Petición: «que en la app del movil se muestre en tiempo real mientras tiras, para que nada mas acabes el set puedas ponerte a revisar la app».

**Reloj v6** (`watchapp/source/ArcheryApp.mc`, compilada, pendiente sideload):
- **Detector portado a Monkey C**, streaming a 100 Hz: gravedad local = media de anillo de 50 muestras (500 ms); disparo si |a|−g > **1500 mG** con refractario 1500 ms; ventana post 2000 ms.
- Al disparar congela snapshot pre-suelta: score (100−pstdev(últimos 500 ms)/10), instab (pstdev |a| 3,2 s), tilt 64 puntos decimados a 20 Hz (anillos x/y restando la media). Tras la ventana post: pico y asentamiento (dev < 300 mG) → **lap automático** + `Communications.transmit()` BLE.
- Mensaje: dict con claves **String** («t», «peak», «instab», «settle», «score», «tx», «ty») — TransmitKeyType NO admite símbolos. Valores Float/Number y arrays `new [64] as Array<Float>`.
- Pantalla: REC + «movil OK n» (contador de transmits con ack), TIROS, último score coloreado. START sigue marcando lap manual (calibración).
- Trampas Monkey C: `Math` es `Toybox.Math` (no `Lang.Math`), el listener es un **objeto** `class TxListener extends Communications.ConnectionListener` con `onComplete()/onError()` SIN argumentos, `$` en nombres de clase revienta eval en bash.

**APK v4** (`com.archerywatch.app`):
- SDK **ConnectIQ Android 2.4.0** desde Maven Central (`com.garmin.connectiq:ciq-companion-app-sdk`, AAR en `tools/ciq/mobile/`): `initialize()` → `registerForAppEvents(dispositivo, IQApp("2C49E17B-304A-4F1E-8D5C-6B7A90E1F2D3"))` → `onMessageReceived` → Map→JSON a pelo → `evaluateJavascript("liveShot(...)")` en UI thread. Callback real: `onSdkReady` (no onSdkInitialized) + `onSdkShutDown` obligatorio.
- Manifest fusiona los componentes del AAR (queries a `com.garmin.android.apps.connectmobile` + `IQGarminBindingService` + `AutoUIDialogHostActivity`).
- **Build-tools 35-rc1** (`tools/android/android-VanillaIceCream/`, d8 8.4.7): el d8 8.2.2-dev del BT34 tiene un NPE interno con las clases Kotlin del SDK Garmin — usar el nuevo para TODO (aapt2/d8/apksigner).

**Web EN VIVO**: `window.liveShot(ev)` (primer evento en vivo sustituye la sesión cargada; dedupe por |Δt|<800 ms; window=null → la traza muestra placeholder «traza completa tras el análisis del FIT») y `window.liveStatus(s)`. Badge naranja «● EN VIVO · n». Verificado inyectando 3 eventos sintéticos por el mismo puente: SET 2 auto por gap 75 s, resumen 3 flechas media 84, badge y diagrama correctos.

**Flujo real completo**: reloj (v6 abierta, Garmin Connect en el móvil con BLE) → tiro → ~2 s después aparece en el móvil sin tocar nada. El FIT sigue grabándose (100 Hz + laps) para el análisis fino posterior.

**Pendiente**: sideload de la v6 al reloj (USB MTP, igual que v4/v5: copiar `watchapp/build/AW-fr165.prg` renombrado 8.3 a GARMIN/Apps/) y prueba física: sacudir el reloj con la app abierta y el móvil al lado → debe llegar «EN VIVO» al APK.

## 18. Tiempo real FUNCIONANDO end-to-end (16/9, ~03:00)

La cadena completa ya va: reloj v6 → BLE → Garmin Connect → LiveService → WebView. Hallazgos de la puesta en marcha (todos documentados para no re-tropezar):

1. **UUID real**: el id 0xA2C49E17B03A4F1E8D5C6B7A90E1F2D3 mapea al UUID **`a2c49e17-b03a-4f1e-8d5c-6b7a90e1f2d3`** (el id completo formateado 8-4-4-4-12 — NO se quita el byte A2). Descubierto empíricamente con `getApplicationInfo(uuidCandidato, device, listener)`: `onApplicationInfoReceived` = instalada / `onApplicationNotInstalled` = uuid equivocada. LiveService sondea candidatos al arrancar y registra el listener con el IQApp REAL que devuelve Garmin (más robusto que hardcodear).
2. **kotlin-stdlib obligatoria**: el AAR de Maven (`com.garmin.connectiq:ciq-companion-app-sdk:2.4.0`) es Kotlin y NO trae la stdlib → `NoClassDefFoundError: kotlin.jvm.internal.Intrinsics` al llegar el primer mensaje (crash en `IQMessageHelper.convertToJava`). Solución: `kotlin-stdlib-2.0.0.jar` de Maven extraída en `tools/ciq/mobile/kotlin-classes/` y empaquetada en el dex (APK pasa de 105 KB a 690 KB).
3. **FGS connectedDevice exige runtime**: `BLUETOOTH_CONNECT` concedido en runtime + permisos `FOREGROUND_SERVICE*` en manifest. Concedible por adb: `pm grant com.archerywatch.app android.permission.BLUETOOTH_CONNECT`.
4. **Arrays primitivas del SDK**: los arrays del dict CIQ llegan como `long[]`/`double[]`, NO como `List` → el toJson de MainActivity las serializaba como `"[J@hash"`. Añadidos casos int[]/long[]/float[]/double[]/Object[].
5. **fetch no vale en file://**: en el APK los assets se cargan con `XMLHttpRequest` (fallback cuando `location.protocol === 'file:'`).
6. **Drain en onResume**: los tiros recibidos con la app cerrada se vuelcan también al volver a primer plano (no solo en onPageFinished).
7. **Voz «cuenta X segundos»**: era el Garmin Connect procesando mensajes del reloj sin reclamante (uuid equivocada); desaparece con el listener correcto.

**APK v10** (estética): canvas sin fondo negro (transparentes sobre el panel), cabecera 17px sin ruido («ARCHERYWATCH» fuera), consejos en una línea, badge píldora naranja bajo la cabecera, **auto-apertura del análisis del tiro** al llegar un evento en vivo (`show('Shot')` si la app está visible), barra de fases 12px. Verificado por captura: badge «EN VIVO · 3» con los tiros buffered de las sacudidas reales.

**Estado**: pipeline vivo completo + FIT para análisis fino. Queda: sesión real de arquería (calibrar umbral 1500 mG y PRE/POST contra tiros de verdad), y opcionalmente pulir estética más con feedback de uso.

**APK v12** (pulido de producción, a petición del usuario): la burbuja de estado técnico («ciq listo: a2c49e17…») ya no se muestra — `liveStatus` solo saca píldora para errores (texto fijo «sin Garmin Connect», sin código); el éxito va al log interno. Cabecera rediseñada sin mayúsculas ni números apretados: «Sesión / 3 flechas · 2 sets», «Set 2 / 3 flechas», «Flecha 2 / set 1 · t+38 s». Verificado en navegador: conectado oculto, badge solo con tiros.

**APK v13 — rediseño producción** (reescritura completa de `mobile/index.html`, misma lógica):
- Sesión: sin subtítulo en cabecera; **héroe** con «PUNTERÍA MEDIA» en número grande coloreado por nota + stats compactos a la derecha (flechas/sets, mejor, desv); **gráfico de progreso con barras redondeadas, línea de media discontinua con etiqueta y separadores verticales entre sets**; lista de sets con chip de nota y «›».
- Tiro: tiles con borde (el de puntería se ilumina con el color de la nota), fase sin texto, botón ▶ circular, consejo con barra naranja a la izquierda.
- General: paleta más profunda (#0e0e12/#17171d/#1f1f27 + bordes #282833), números tabulares, nav inferior en **píldoras** (activa: fondo + naranja), estados vacíos elegantes («esperando tiros del reloj», avg «·»).
- `rr()` helper para barras redondeadas en canvas (arcTo, sin depender de roundRect).
- Verificado en navegador con sesión sintética de 5 flechas/2 sets y en captura del Nothing real.

## 19. v14: feedback de usuario + historial de sesiones (16/9, ~04:00)

Cambios pedidos por el usuario (todos verificados en navegador antes de instalar):

- **Sin «t+X s»** en la ficha de tiro (cabecera: «Flecha N · set M»).
- **La voz del móvil era Garmin Connect anunciando cada lap**: la v6 hacía `addLap()` automático por tiro detectado y GCM lee las laps en voz alta (Audio Prompts). Quitado el auto-lap del reloj (`finalize()` ya no marca lap; el timestamp va en el mensaje BLE y la señal completa queda en el FIT). PRG recompilado — **pendiente sideload al reloj** (mismo MTP). El lap manual con START sigue existiendo (calibración) — si vuelve a hablar tras pulsarlo, es GCM: ajustes → avisos de audio.
- **Tips**: sin barra naranja izquierda; caja ámbar completa (#251d12, borde #3e2f1a).
- **Botón «Reproducir»** literal, ancho completo, entre la diana y las métricas; alterna a «Detener» durante la animación.
- **Sesión**: héroe sustituido por grid de 4 tiles (FLECHAS / SETS / PUNTERÍA — coloreada por nota — / DESVIACIÓN).
- **HISTORIAL (nuevo)**: 4ª pestaña. Sesiones persistidas en `localStorage` (`awSessions`); la sesión viva caduca a los 10 min sin tiros y se archiva sola; boot restaura la viva fresca, si no la última archivada; entradas «hoy HH:MM / ayer / d mes» con chip de media y nº de flechas, tap = cargar.
- Bug corregido durante la prueba: `store.list()` re-parseaba en cada liveShot rompiendo la identidad del objeto sesión (data.shots quedaba desincronizado → `cur` fuera de rango → crash en render). Ahora la sesión viva vive en `curSess` en memoria y `persist()` la reemplaza por id.

## 20. v15 móvil + pantalla de reloj de producción (16/9, ~04:30)

- **Métricas autodescriptivas (petición explcita)**: «89B/4630/131ms/285» → «89/100 · PUNTERÍA», «4.6 g · PICO SUELTA», «131 ms · ASENTAMIENTO», «0.29 g · TEMBLOR APUNTE». mG→g en tips y lista de set también.
- **Pantalla del reloj rediseñada** (esfera redonda 390): REC mm:ss naranja arriba, número de flechas en FONT_LARGE protagonista, «FLECHAS» naranja, última puntería «NN/100» coloreada (verde/amarillo/rojo), «móvil OK (n)» verde / «sin móvil» gris abajo. Sin accel crudo. Verificada en simulador CIQ.
- **La vibración por tiro era el lap automático** (el reloj vibra al marcar lap): quitado en §19; el PRG sin lap está compilado — **sideload pendiente de USB del reloj**. El START manual sigue marcando lap (y vibrando) a propósito.
- APK v15 (versionCode 15, sw aw-v10) instalado.

## 21. Reloj v7: cola de reenvío + traza en vivo (16/9, ~05:00)

Problema reportado: 7 flechas tiradas, solo 2 en el móvil. Causa: Communications.transmit es fire-and-forget — si el BLE estaba caído/ocupado (reconectar el reloj por USB lo mata), el mensaje se pierde sin aviso.

- **Cola de reenvío en el reloj**: cada tiro entra en pending[8]; un Toybox.Timer.Timer cada 5 s reenvía toda la cola hasta que un ConnectionListener.onComplete la limpia (onTxAck). El dedupe del móvil (|Δt|<800 ms) absorbe repetidos. onError activa slim: reenviar solo métricas sin trazas (por si FAILURE_MESSAGE_TOO_LARGE).
- **Traza en el mensaje en vivo**: además de tilt 32×2, viaja mp (|a| pre-suelta, 48 pts @20 Hz) y mq (post, 40 pts); el móvil construye window con tiempos de 50 ms → la gráfica temporal se ve EN VIVO (antes pedía el FIT).
- Pantalla: sin «móvil OK» (petición); REC/flechas/score a secas.
- Etiquetas móviles: PUNTERÍA /100, IMPULSO DE SUELTA (g), ESTABILIZACIÓN (ms), TEMBLOR EN APUNTE (g); tips alineados.
- Trampa Monkey C: import Toybox.Timer + new Timer() resuelve al MÓDULO («Cannot instantiate»); usar new Toybox.Timer.Timer().
- PRG sideloaded (AWV7.PRG, COPIADO_OK) y APK v16 instalado.

## 22. Sesión por actividad del reloj + arranque en vacío (16/9, ~06:00)

Peticiones: arrancar sin mostrar la última sesión («esperando flechas…»), abrir/cerrar actividad en el reloj = iniciar/terminar sesión, y background total.

- **Reloj v8**: `onStart` encola `{"start":1}` y `onStop` encola `{"end":1}` (misma cola de reenvío con timer de 5 s; el end puede perderse si el BLE está caído → fallback: la sesión caduca sola a los 10 min). PRG compilado como AWV8.PRG — **sideload pendiente (reloj no estaba en USB)**.
- **APK v22**: LiveService enruta por claves (`start`/`end`/tiro) y el buffer SHOTS ahora guarda **llamadas JS completas** («liveStart()», «liveShot({...})», «liveEnd()») — el drain al reabrir reconstruye la sesión entera en orden. `BootReceiver` arranca el servicio al encender el móvil (RECEIVE_BOOT_COMPLETED; best-effort según restricciones FGS).
- **Web**: `liveStart()` descarta sesiones «live» previas del store (el replay las reconstruye) y vacía la vista; `liveEnd()` archiva y quita el badge. **boot: solo restaura sesión viva fresca (<10 min); nada de última archivada ni demo automática** — arranque vacío con «esperando flechas…», las viejas solo en HISTORIAL. Bug corregido: liveShot no reasignaba data.shots tras un liveStart (data y sesión desacopladas → 0 tiros visibles); condición `!live || data.shots !== sess.shots`.
- **Sets**: sin cambios — cortan con >60 s entre flechas; en la prueba con sacudidas seguidas un único set es lo correcto; en arquería real (recoger flechas) separa solo.

## 23. Caza de bugs de la cadena en vivo (16/9, ~07:00, con CDP)

Toda la depuración se hizo con el debugging de WebView activado (`WebView.setWebContentsDebuggingEnabled(true)`) + `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>` y scripts Node con WebSocket (el node_repl MCP no tiene WebSocket global; el node del sistema v24 sí). CDP: `Runtime.evaluate` sobre la página real del APK. Método guardado en /tmp/cdp*.mjs (regenerar si hacen falta).

1. **BootReceiver nunca compilado (v20-23)**: el manifest declaraba `.BootReceiver` pero build.sh solo compilaba MainActivity/LiveService → `ClassNotFoundException` al instanciar receivers → Android mataba el proceso al arrancar. Síntoma: «el móvil no refleja nada» pese a que el servicio (proceso viejo) sí recibía. Fix: build.sh compila todos los .java (`find android/src`).
2. **DOM storage apagado**: sin `setDomStorageEnabled(true)`, `localStorage` es null en WebView → `store.list()` lanza → liveStart/liveShot reventaban silenciosamente. Síntoma: eventos llegando y empujándose (log push js[1598]) con la pantalla en «esperando flechas».
3. **Duplicados de historial**: cada reapertura re-replayaba el buffer completo (liveStart re-archivaba). Fix: drain consume y limpia el buffer (synchronized + snapshot).
4. **Carrera drain/carga**: onResume drenaba ANTES de que la página cargara → evaluateJavascript en página en blanco se pierde y el buffer ya está limpio. Síntoma: ciclo completo en el log, sesión archivada, pantalla vacía. Fix: `pageReady` — drain solo en/tras `onPageFinished`.
- APK v27 (versionCode 27, sw aw-v15). También: re-registro del listener cada 60 s, log de estados de mensaje no-SUCCESS, push con callback de resultado.

## 24. v28-v29: análisis en vivo completo + historial navegable (16/9, ~08:00)

- **v28**: el parche de la traza en vivo (mkWin de mp/mq) NUNCA se había aplicado (replace silencioso sin assert — lección: todos los parches ahora usan assert). Verificado en el APK real: `window pre=48 post=40` en sesiones nuevas. Gráfico de sesión interactivo (trendBars + pointerdown → ficha de la flecha). Swipe izq/der en TIRO (touchstart/end, umbral 50 px). liveEnd limpia la pantalla (data={} y show('Session')) — cerrar actividad en el reloj vacía el móvil.
- **v29**: botón «‹ actual» (píldora arriba-izquierda) visible al cargar una sesión del HISTORIAL; la vuelve a dejar y restaura la sesión viva si existe (o el estado de espera). Subtítulo muestra la fecha de la sesión del historial. liveStart quita el modo historial.
- **Datos antiguos**: las sesiones previas a v28 (23:31, 23:33, 23:45) no tienen window — los datos se perdieron en las versiones rotas y no son recuperables en el móvil (solo desde el FIT del reloj). Las nuevas sí.
- APK v29 (versionCode 29, sw aw-v17).

## 25. v30-v31: SESIÓN como retorno + tarjeta de progreso (17/9, ~00:15)

- Fuera el botón «‹ actual» (petición: era un botón enano feo). Ahora **la pestaña SESIÓN saca del modo historial** y devuelve a la sesión actual (viva o estado de espera); dentro del historial el subtítulo muestra la fecha de la sesión consultada.
- **Tarjeta PROGRESO** en el historial: gráfica de doble línea (puntería media por sesión en naranja, temblor medio en azul, normalizado) + resumen «media global X · última Y ▲/▼d». Con sesiones de prueba es ruido; con sesiones reales es la evolución del tirador.
- Bug cazado: v30 borró el elemento backLive pero backToCurrent seguía tocándolo → excepción silenciosa → el retorno no funcionaba. Regla ya aplicada: nada de referencias a elementos quitados.
- APK v31 (versionCode 31, sw aw-v19).

## 26. v33: progreso separado, limpieza de vistas y eliminación

Petición: conservar el estilo, corregir errores de frontend, mover progreso a una página con casita entre TIRO y SET, volver del historial a sesión vacía y eliminar flechas, sets o sesiones tanto en vivo como en historial.

### Cambios

- Navegación: SESIÓN / TIRO / casita PROGRESO / SET / HISTORIAL. Progreso muestra la evolución y un resumen breve; historial queda para las sesiones.
- Se corrigió la cronología del resumen: antes «última» tomaba la sesión más antigua. Estados sin sesiones/una sesión explícitos; sin gráficos o cifras residuales.
- Volver a sesión actual desde SESIÓN o el botón del modo historial restaura la viva o el vacío. Se limpian listas, leyendas, métricas, consejos, lienzos y zonas interactivas; las vistas vacías ocultan controles sin datos.
- Se reinicia/limita `cur` al cargar o borrar; navegación y reproducción vacías no fallan. Reproducción cancela al cambiar/renderizar y no accede fuera del array al terminar. Sets sin traza ya no fallan. Barras de sesiones largas mantienen ancho positivo.
- Un tiro recibido mientras se consulta el historial se guarda en la sesión viva sin sustituir la consulta. Inicio de actividad archiva las sesiones anteriores en vez de borrarlas. Validación mínima de mensajes y estructura de localStorage.
- Etiqueta EN VIVO en el flujo de página, sin superposición; métricas de tiro en dos columnas en pantallas estrechas; navegación fija sin desbordamiento; gestos verticales no cambian de flecha. Identificador duplicado de diana sustituido por clase.
- Botones «Eliminar flecha», «Eliminar set» y «Eliminar sesión» en sus vistas. Papelera por sesión en HISTORIAL. Confirmación antes de modificar datos.
- Eliminación recalcula vistas, estadísticas y progreso. Al eliminar la última flecha archivada, se retira la sesión vacía y vuelve al historial.
- Sesiones vivas conservan `removed` (timestamps de flechas borradas) para ignorar reenvíos BLE con la misma tolerancia de deduplicación existente (<800 ms). Al borrar todos sus tiros, el registro interno vacío puede conservarse hasta terminar la actividad, pero no aparece en historial. Las flechas nuevas siguen entrando. No se modifica ni borra el FIT del reloj.
- `MainActivity` incorpora `WebChromeClient.onJsConfirm` y diálogo Android con Cancelar/Eliminar; sin esto el WebView no gestiona la confirmación de borrado.

### Validación y entrega

- Repro inicial en navegador falló con «Siguen visibles 2 filas de flechas/sets después de vaciar la sesión»; caso mínimo: liveStart → tiro → Sesión → Set → liveEnd.
- `tools/frontend-regression.js`: función para ejecutar mediante evaluación en un navegador de pruebas. **23 comprobaciones pasan**, incluida cancelación, eliminación en vivo e historial, reenvíos de tiros borrados y restauración de marcas. Guarda/restaura localStorage; no ejecutar sobre la WebView del usuario durante una actividad.
- Inspección visual en 390×780 y 360×740, sin desbordamiento horizontal. Cero errores de consola tras los casos de regresión.
- Compilado con `android/build.sh` (Git Bash requiere ejecución fuera del aislamiento en este equipo). APK `android/build/ArcheryWatch.apk`, **versionCode 33 / versionName 1.3.2**, SW `aw-v21`.
- Instalado mediante `adb install -r` en Nothing A069, conservando datos. Confirmada versión por dumpsys.
- Verificación CDP del APK real: navegación incluye casita, retorno desde historial deja 0 filas residuales, conserva las 4 sesiones existentes. Se probó el diálogo nativo con un mensaje de prueba sin borrado; Atrás lo canceló y siguieron existiendo las 4 sesiones. No se eliminaron datos reales para probar.
- No se recompiló ni modificó la aplicación Garmin. No se hizo una nueva sesión de tiro físico: validación de frontend, puente con eventos de prueba y arranque real del APK.

Archivos modificados: `mobile/index.html`, `mobile/sw.js`, `android/AndroidManifest.xml`, `android/src/com/archerywatch/app/MainActivity.java`; añadido `tools/frontend-regression.js`. Servidor de prueba local usado: `127.0.0.1:8902`. CDP del teléfono: puerto 9222, asociado al PID de su WebView (renovar forward tras reiniciar).


## 27. Revisión técnica, logo e investigación de competencia (16/9/2026)

Usuario pide optimización/producción y logo; después añade investigación profunda de K Archery y competencia para mejorar esfera, fluidez, información, detección y cierre de tandas.

- Investigación y propuesta: docs/competencia-arqueria.md; sensores, detector y protocolo de validación: docs/deteccion-validacion.md. Fuentes primarias y límites diferenciados; no se han probado físicamente apps competidoras.
- Correcciones, pruebas y pendientes detallados en docs/estado-produccion.md. APK 36/1.5 y PRG fr165 compilados, pero NO instalados en esta entrega: al cierre ni ADB ni MTP muestran los dispositivos. No se borraron sesiones reales.
- 30 comprobaciones de frontend, pruebas JVM de cola, firma APK verificada. Nuevos recibos persistentes Android, sid de sesión, cola persistente Garmin, set_id que conserva agrupaciones al borrar, navegación estable con tiros entrantes, métricas renombradas honestamente.
- Logo ImageGen en assets/branding/logo-generated.png y prompt en README del mismo directorio; iconos aplicados al proyecto.
- No afirmar producción ni precisión validada. Faltan ACK de extremo a extremo, cierre explícito de tandas, validación física y campaña etiquetada. La esfera 3/6 naranja es propuesta, no implementación.


## 28. Implementación v2 y revisión de sincronización (16/9/2026)

Usuario autoriza toda la propuesta y después informa de que el APK antiguo no recibe: espera inicio de sesión al abrir actividad y cierre al terminar. Se priorizó ese flujo. Implementación y límites en docs/v2-entrenamiento.md.

- APK 37/2.0; protocolo v2 requiere actualizar APK y reloj juntos. Archivos nuevos mobile/session-model.js, mobile/training.js, watchapp/source/Training.mc, watchapp/source/Tests.mc, tools/replay_detector.py y pruebas.
- Esfera propia y tandas 3/6/libres, pausa, correcciones, perfiles/calibración experimental, comparador y progreso por equipo, backup nativo/web.
- Colas duraderas en ambas direcciones, ACK tras commit Android y recibos de UI. Evento + estado de recuperación en una escritura del reloj. Ámbito por instalación para órdenes.
- Inicio móvil incluso sin flechas, restauración sin caducidad ficticia, final archiva y limpia. Guardar y salir espera ACK antes de abandonar reloj; salida offline conserva cola. Diagnóstico visible con último mensaje y pendientes.
- Pruebas: 30 anteriores + 21 nuevas navegador, modelo Node, cola Java y 5 Python correctas. Compilan APK y fr165/fr165m. Tests Monkey C compilados pero simulador no completa conexión: NO ejecutados.
- Al cierre de las comprobaciones ADB/MTP no detectan dispositivos; no instalado. No se pudo identificar la causa exacta del APK antiguo ni certificar flujo BLE real. Pregunta asíncrona de reconexión enviada al usuario.
- Una compilación fue rechazada por revisión automática al agotarse uso; tras la hora indicada y petición de continuar, compilaciones posteriores autorizadas y correctas.

## 27. v34-v35: anti-falsos, traza por fases, regla de tiempo y pulso (17/9)

Petición: la sensibilidad detectaba recoger flechas/abrir el arco como tiros; traza coloreada por fase con regla de tiempo (estilo MantisX); investigación de competencia.

### Reloj (AWV9, sideloaded e importado)
- **THRESH 1500→3200 mG** y **compuerta preStable()**: solo dispara si el pico supera 3,2 g Y los ~400 ms previos estaban quietos (pstdev<450 mG sobre las 42 muestras más antiguas de gBuf). Recoger flechas/maniobrar = movimiento previo → rechazado aunque el tironcito supere el umbral.
- **Frecuencia cardiaca**: `Sensor.setEnabledSensors([SENSOR_HEARTRATE])` + `enableSensorEvents(onHr)`; FC congelada en cada trigger y enviada como `"hr"` en el mensaje.
- **Trayectoria post-suelta**: anillos postX/postY (40 pts @20 Hz) → claves `"px"/"py"` (x,y menos el centro pre-suelta) para colorear el follow-through.
- Trampas Monkey C: no existen `Math.max` ni `Math.abs` (mano a mano con ifs / ternarios).

### Móvil (APK v35, 1.4)
- **drawTrace reescrito**: línea por tramos de fase — colocación (gris, tramo inestable inicial del pre), apuntado (verde, estable final, walk-back de dev<300 con hold mínimo del 20%), suelta (rojo, pico post hasta caer del 15%, máx 400 ms), follow-through (naranja). **Regla de tiempo** abajo con ticks cada segundo relativos a la suelta (-2s…0…+2s). Marca «suelta» discontinua. La phasebar fija fuera; leyenda con puntos + **❤ ppm** del tiro.
- liveShot guarda `hr_bpm` y `traj_x/traj_y` (px/py).
- Detector PC sincronizado a 3200 mG. SW aw-v22.
- LiveService apuntaba a `R.drawable.ic_notification` (no existe) → `R.drawable.ic`; build.sh compila `android/src/*.java` (BootReceiver y EventQueue de la sesión anterior ya estaban).

### Validación
- CDP sobre el APK real: inyección de tiro con fases sintéticas → canvas con 4 colores (gris 909 px, rojo 1323, naranja 1378; verde era falso negativo de mi clasificador), leyenda «colocación apuntado suelta follow-through ❤ 96 ppm», métricas 81/100 · 4,1 g · 120 ms · 0,16 g, regla pintada.
- Captura visual con pantalla despierta confirma: traza segmentada gris→verde→pico rojo→naranja con regla de tiempo.
- Sesión sintética de prueba eliminada del store del teléfono; estado limpio.

### Investigación competencia (resumen operativo)
- **MantisX** (mantisx.com/pages/mantisx-for-archery): traza coloreada por fase (azul/verde subida-bajada en setup, amarillo aproximación, naranja hold puntuado, blanco X = suelta, rojo X = flecha fuera), selector de fase (setup/hold/release/full), pitch/cant del arco, tiempos por fase, colocación de flecha en diana, coaching por flecha, archivo histórico y grupos. Copiado ya: colores por fase + regla. **Pendientes copiables**: puntuar SOLO el hold (como ellos), selector de fase en la diana, marcar impacto manual (1-10) y correlacionarlo con temblor, comparación cara a cara de sesiones.
- **Garmin ArcheryX** (Fenix 9/9 Pro): reloj en muñeca del brazo de arco + disparo de calibración al cambiar de arco. Copiable: **autocalibración** (3 flechas marcadas con START → el reloj ajusta su umbral a la firma real de la suelta) en vez del 3200 fijado a mano. Registrado como mejora pendiente.

## 28. Auditoría de versiones: instalado vs fuente (17/9, tarde)

Sospecha del usuario: «no veo cambios, ¿seguro que lo instalado es lo último?». **Tenía razón a medias y la auditoría lo resolvió definitivamente:**

- **Diagnóstico**: el `adb install` de la tanda anterior llevaba `| tail -1` que se comió el resultado → la APK v35 (713 KB) siguió instalada mientras el build correcto (16:57, 927 KB) nunca llegó al móvil. Además el fuente había seguido avanzando en paralelo (sesión compañera): protocolo v2 con eventos/eid (`session-model.js`), panel de entrenamiento con sets explícitos de 3/6/libre, calibración asistida (5 tiros + 5 movimientos), comparador de flechas, export/import de copia, reetiquetado PUNTERÍA→ESTABILIDAD / IMPULSO→PICO ACEL., versión 2.0 (versionCode 37, sw aw-v24, minSdk 26).
- **Arreglo**: `adb install -r` sin tuberías + verificación explícita. **Prueba de identidad**: md5 del APK instalado (extraído con `pm path` + `adb pull`) == md5 del compilado (944f2025…) y los 4 assets (index/session-model/training/sw.js) byte a byte idénticos al fuente.
- **Reloj**: AWV9 importado corresponde al fuente actual — .mc (15:13:58) < .prg (15:14:05) y el sideload usó ese .prg. El fuente del reloj además incluye la máquina `training` (paused/resting/calibration, umbral dinámico, menú) de la sesión compañera construida sobre el detector (3200 mG + preStable + hr + px/py). Recompilado de verificación: mismo tamaño ±48 B (metadatos).
- **Smoke test real**: UI dump del APK arrancado muestra Sesión con «● EN VIVO · 1» y «Set 2 · 0/3 flechas» + panel de entrenamiento completo → la cadena reloj→móvil funciona en vivo con la versión auditeda.
- **CDP ya no disponible en release**: MainActivity de la sesión compañera condiciona `setWebContentsDebuggingEnabled` a FLAG_DEBUGGABLE; para inspección futura, build con flag debuggable o reactivar temporalmente.
- **Lección de proceso**: nunca `| tail -1` sobre adb install; siempre verificar «Success» + versión por dumpsys; para certeza total, comparar md5 instalado vs compilado.

## 29. v38 (2.1): calibración usable + equipo compacto + refresco del reloj (17/9, tarde)

Quejas: botón Calibrar no hacía nada (era stub: caía en «Disponible desde el reloj conectado»), sección «Equipo y entrenamiento» verbosa, e icono/esfera del reloj «sin actualizar».

- **Modal de calibración** (training.js): «Calibrar» ahora abre un popup con instrucciones (5 sueltas + 5 movimientos no-tiro, marcando cada uno en el menú del reloj), contadores en vivo (Sueltas X/5 · Movimientos X/5) alimentados por los eventos `label` del reloj vía liveEvent, y el resultado de `applyCalibration` aparece dentro del modal. Botones con wiring JS (lección: onclick inline con comillas simples dentro de string JS rompe; y `node --check mobile/training.js` ANTES de empaquetar — aapt2 no valida JS).
- **Equipo compacto**: fuera el bloque «Equipo y entrenamiento» de 5 cuadros; ahora una fila: segmentado [3|6|Libre] + select de perfil (las 4 opciones del reloj, sin input libre) + Vibración (toggle) + «⋯» con conexión y copias. targetSize/equipment input sustituidos; render override sincroniza el segmentado.
- **Icono/esfera del reloj**: CIQ_LOG.BAK solo contenía un crash VIEJO (ayer, app AARCHER, firmware ya actualizado a 29.05/CIQ 6.0.2). La esfera nueva (anillo de progreso, LISTO/PAUSA/DESCANSO/CALIBRACIÓN, contador X/Y FONT_NUMBER_HOT, SET n, total+tiempo, ppm+pendientes, «START: cerrar/seguir») y el icono SÍ están en el PRG desde las 15:14. Causa más probable de «no se actualiza»: la app seguía ABIERTA en el reloj (CIQ no hace hot-swap). Sideload fresco AWVB.PRG + instrucción: cerrar la app antes de expulsar y reabrir desde el launcher.
- APK v38 (versionCode 38, 2.1, sw aw-v25), install con «Success» explícito. UI verificada en navegador: segmentado, modal, progreso 1/1 con labels sintéticos, resultado en modal, 0 errores JS.

## 30. v39 (2.2): calibración como asistente guiado (17/9, noche)

Petición: fuera parrafadas — el móvil debe dar órdenes una a una («Tira», «Muévete»…) con check por paso y aplicar solo. Y los botones compactos no se veían bien.

- **Asistente**: secuencia fija TIRA|TIRA|MUÉVETE|TIRA|MUÉVETE|TIRA|MUÉVETE|TIRA|MUÉVETE|MUÉVETE (5+5 mezclados). Pantalla: paso n/10, orden en 34 px (TIRA naranja / MUÉVETE azul), hint de una línea, fila de 10 puntos→✓, botón grande «Hecho ✓» y Cancelar discreto. Cada «Hecho» envía `positive`/`negative` al reloj (que registra el pico medido); el evento `label` de vuelta avanza el paso (anti doble-toque con calBusy + timeout 4 s). Al décimo: todos ✓, «APLICANDO» y `applyCalibration` automático; el resultado del reloj se muestra y cierra solo a los 2,5 s. Sin reloj conectado: aviso y no abre.
- Botones compactos rehechos (misma altura/radio/fondo que el resto; segmentado limpio).
- Verificado en navegador con Native simulado: secuencia completa, 12 comandos correctos al reloj, 10 checks, resultado y 0 errores JS. APK v39 (versionCode 39, 2.2, sw aw-v26), instalada con Success.

## 31. v40–v41 (2.3–2.4): calibración solo en reloj, esfera nueva, menú de 5, perfiles por tipo de arco (16/9)

Feedback del usuario: los botones Hecho/Cancelar del asistente NO funcionaban en el móvil, calibración mejor SOLO desde el reloj, menú START con demasiadas opciones, esfera «horrible» (referencia: capturas estilo K-Archery), y ¿qué significaba «Recurvo / arco» vs «Recurvo / cuerda»?

- **Bug real de los botones**: `#calModal{display:flex}` (CSS por id) sobreescribía el `display:none` del atributo `hidden` (la UA stylesheet pierde por especificidad) → el modal nunca se cerraba. Irrelevante: el asistente entero se eliminó.
- **Calibración fuera del móvil**: training.js sin rastro de wizard/modal/botón Calibrar. El flujo vivo: menú del reloj ▸ Más opciones ▸ Calibrar perfil ▸ Confirmar tiro / Marcar movimiento (n) ▸ Aplicar calibración. En el móvil solo queda un `notice()` con el resultado cuando llega el evento `calibration`.
- **Esfera nueva** (ArcheryView.onUpdate): tres bandas con líneas divisorias #282833 — arriba «SET n» (naranja) + flechas del set | TOTAL; centro FONT_NUMBER_HOT «n/target» con score de la última flecha coloreado (≥75 verde / ≥50 amarillo / rojo) o estado (LISTO gris, DESCANSO, PAUSA, CALIBRANDO naranja); abajo PPM | MIN con divisor vertical. Sin arco de progreso.
- **Menú de 5**: Pausar/Reanudar · Cerrar/Siguiente tanda · Deshacer última · **Más opciones** · Guardar y salir. «Más» (openMoreMenu): manual, reabrir, tandas 3/6/libres, Recurvo/Compuesto, Vibración, Calibrar (+subítems si activa). pushMenu acepta tuplas de 3 o 4 (label, subtítulo, action, value).
- **Perfiles = tipo de arco** (petición: «como si el reloj siempre fuese en la mano del arco»): solo «Recurvo» y «Compuesto». restore() migra nombres viejos con `profile.indexOf(" /")` → substring. El select del móvil muestra «Arco recurvo/compuesto» (value canónico); PROFILE_LABELS mapea también los 4 nombres viejos para sesiones históricas; fallback `.split(' /')[0]` para sesiones viejas.
- **Modales con estilo propio**: `askConfirm(msg)` → Promise, dialogo #askModal (panel oscuro, radio 18, Confirmar naranja) SUSTITUYE todos los confirm() nativos (el AlertDialog de Android era la «estética del 2000»). CSS con guard `#askModal:not([hidden])` (lección del calModal). Verificado en navegador: cancelar conserva, confirmar borra; geometría de botones alineada (el «desalineado» de la captura era falso positivo del escalado).
- **Instalaciones**: APK v41 (versionCode 41, 2.4, sw aw-v28), Success + md5 local==instalado + assets byte-iguales. PRG: AWVD.PRG en GARMIN/Apps verificado copiándolo DE VUELTA y comparando md5 (af81b1bb…).
- **Lecciones MTP**: (1) `InvokeVerb('delete')` y `CopyHere(...,16)` desde PowerShell se CUELGAN o son no-op contra el FR165 — el borrado fiable es Explorer por UI (computer-use: seleccionar fila → botón Eliminar → diálogo Sí). (2) La propiedad Size por COM puede mentir («0 bytes, 1899») con el archivo perfecto — la verificación real es copiar el archivo de vuelta y hashear. (3) Un delete interrumpido deja el archivo intacto pero engañoso.
- El AWVC viejo (build de 4 perfiles) se borró por Explorer; en Apps queda SOLO AWVD. El usuario debe: cerrar la app en el reloj si está abierta, expulsar USB, y reabrir ArcheryWatch (CIQ no hace hot-swap).

## 32. Crash IQ! al arrancar (16/9, noche): String.indexOf no existe en Monkey C

El AWVD importado cascó al seleccionarlo en el reloj (IQ + triángulo). Diagnóstico por GARMIN/Apps/LOGS/CIQ_LOG.BAK: `Symbol Not Found: "Could not find symbol 'indexOf'"` en Training.mc:28 (restore) — la migración de perfiles usó `String.indexOf(" /")`, que NO existe en Monkey C (compila bien porque los símbolos se resuelven en runtime). Corregido con mapeo explícito `profile.equals(...)` (método probado en el resto del app). Grep de guardia: sin más indexOf/startsWith/endsWith/split en watchapp/source.

- **Verificación en simulador ANTES de pedir eject al usuario**: `connectiq.bat` (simulador corriendo) + `monkeydo.bat <prg> fr165` → la consola de monkeydo recibe los println del app y los crashes. Con un `System.println("AWVE-ALIVE perfil="+training.profile)` temporal tras restore(): salida «AWVE-ALIVE perfil=Recurvo», 0 excepciones en 30 s. Sin println tras recompilar, md5 = 8d6183db = EXACTO al AWVE ya enviado al reloj → probado == enviado. (monkeydo necesita el simulador YA lanzado; sin él dice «Unable to connect to simulator».)
- AWVE.PRG copiado a GARMIN/Apps y verificado copiándolo de vuelta (md5). Apps queda con SOLO AWVE (AWVD se consumió al importar, AWVC se borró por Explorer).
- Lección de herramientas: stop_computer_control es un kill-switch del turno — no invocarlo hasta terminar ABSOLUTAMENTE todo el trabajo de escritorio. El volcado de pantalla por PowerShell (GetWindowRect + CopyFromScreen) + análisis de píxeles sirve de verificación visual sin CUA (pantalla IQ! = fondo blanco; esfera = negro).

## 33. AWVF: crash de salida + esfera sin solapes + LISTO fuera (16/9, noche)

**Crash IQ? al cerrar/salir** (CIQ_LOG: `System Error: a class method was invoked on a Session that is no longer valid`, onStop línea 245 ← onPhone 395): al recibir el ack del «end», `System.exit()` dispara onStop, que llamaba `session.isRecording()` sobre una Session ya stop+saveada por finishActivity() — el objeto queda inválido tras save() y cualquier método suyo es System Error (NO capturable). Fix: `session=null` inmediatamente tras stop/save en onStop y finishActivity.

**Esfera v2**: la v1 posicionaba a ciegas — FONT_NUMBER_HOT mide ~2× lo asumido y el héroe pisaba la línea de estado («un LISTO por encima de todo»). Nuevo onUpdate: layout calculado EN RUNTIME con `dc.getFontHeight()` y apilado secuencial (cada y = anterior + altura + gap) → solape imposible por construcción en cualquier dispositivo. Estructura: línea superior única (CALIBRANDO naranja / PAUSA / DESCANSO / «ULTIMA n» coloreado — nada si idle, LISTO eliminado a petición), banda de 3 columnas SET·TOTAL·PPM (FONT_LARGE, divisores verticales), héroe «n/target» en NUMBER_HOT, y MM:SS debajo SOLO si cabe (`yTime+hM < H-14`).

**Sim**: los println de onStart llegan a la consola de monkeydo, los de onUpdate NO (comportamiento estable en 3 runs; el dispositivo real sí renderiza onUpdate — el usuario vio la esfera). Verificación visual del sim por píxeles (0% blanco = no IQ!) + verificación aritmética del layout. AWVF.PRG en Apps, md9d6bf23f verificado copiándolo de vuelta.

## 34. v42 (2.5): el móvil es solo visor (16/9, noche)

Petición: fuera del móvil el botón Vibración, el desplegable «⋯» (mostraba «APK 37…» = diagnostics de conexión), Cerrar set/Siguiente/+Flecha/Pausa, el select de arco y el segmentado 3/6/Libre — «todo eso se debe poder hacer desde el reloj solo». (El menú del reloj ya lo tiene todo: principal = Pausar · Cerrar/Siguiente tanda · Deshacer · Más opciones · Guardar y salir; Más = manual, reabrir, tandas 3/6/libres, Recurvo/Compuesto, Vibración, Calibrar.)

- training.js reescrito como visor: quedan SOLO la línea de estado («Set 2 · 0/3 flechas»/Pausa/Descanso), «Set abierto/cerrado» en la vista SET, el contexto de flecha + Comparar (TIRO) y el filtro de Equipo y métrica (PROGRESO). Eliminado: trainingAction entera (ya sin llamantes), actions/inline rows, targetSeg, equipment, feedbackBtn, details ⋯, connectionInfo + su intervalo, exportBackup/importBackup/restoreBackup + input file, CSS de .actions/.seg.
- Eliminar flechas (removeSelection → orden al reloj) y askConfirm se mantienen: son corrección de datos, no control del entrenamiento.
- Verificado en navegador: 0 botones/selects/details en el panel, 0 botones en SET, funciones puente (liveEvent/removeSelection) intactas, 0 errores JS. APK v42 (versionCode 42, 2.5, sw aw-v29), Success + assets byte-iguales + grep negativo de controles dentro del APK.
- Nota: split/merge de sets («Separar/Unir») quedan sin UI al quitar los botones de SET; act() del reloj los soporta si algún día se quieren en el menú «Más».

## 35. IQ! en calibración sin log + blindaje de la cola (16/9, tarde-noche)

Usuario en modo calibración tira una flecha → IQ!. CIQ_LOG NO registró nada nuevo (solo el crash de salida de las 18:43, ya arreglado). AWVF confirmado importado (Apps vacía).

**Investigación con selftests sintéticos en sim** (sample() es público: se le puede alimentar gravedad+picos con reloj sintético):
- Flujo calibración completo (calibrate → 5+5 picos → positive/negative → applyCalibration) pasa LIMPIO; umbral calculado exacto ((3500+800)/2=2150).
- Un tiro normal (trigger→finalize→add→emit) también pasa LIMPIO solo.
- Con los act()/emit() intercalados, el sim muere con «**Watchdog Tripped – Code Executed Too Long**», y el storage del sim arrancó con **55+ eventos encolados sin ACK** acumulados de runs anteriores. La cola persistente de reenvío (Application.Storage, un setValue GRANDE por evento + checkpoint) crece sin límite si el móvil no ACKa.
- En calibración el disparo NO pasa por el detector (línea de gate `!training.calibration`) — solo actualiza measuredPeak: el crash del usuario no pudo ser el código del tiro en sí.

**Conclusión**: muerte por watchdog/memoria sin excepción logueada; sospechoso principal = cola de reenvío desbocada (días de pruebas con el móvil a veces sin conectar). 

**Blindaje AWVG (8990e538)**: (1) enqueue con tope — si hay ≥50 pendientes purga los viejos conservando los 10 recientes y JAMÁS rethrowa (antes propagaba una Lang.Exception desde onData sin capturar); (2) Training.save() con try/catch (cuota de Storage superada no puede tumbar la app); (3) sin cambios en detector. Selftest y prints de bisect eliminados; run limpio en sim; AWVG.PRG verificado copiándolo de vuelta (md5 idéntico).

**Nota sim**: los watchdog trips del sim son parcialmente artefacto de su lentitud, pero sirvieron para descubrir la cola sin límite — bug real independiente.

## 36. AWVH: calibración rápida «3 tiros y fuera» estilo ArcheryX (16/9, noche)

Petición: como Garmin ArcheryX (1 disparo por arco) o al menos más simple — «como 3 tiros y fuera».

- **Flujo nuevo**: Menú ▸ Más opciones ▸ «Calibrar: 3 tiros» → la pantalla muestra «CALIBRANDO n/3» → tiras 3 flechas reales; el propio detector las caza con una barra provisional baja (1500 mG, misma ventana de refractario/estabilidad que los tiros normales) y vibra por cada una → al tercer tiro: **umbral = mediana(3 picos) × 0.8**, se guarda por perfil, la calibración se cierra sola y el resultado llega como aviso al móvil. Mediana en vez de mínimo: un movimiento espurio entre los 3 no desordena el umbral. Si la mediana sale <1000 mG: «Señales débiles: repetir». Fuera: Confirmar tiro / Marcar movimiento / Aplicar calibración (flujo 5+5 eliminado) y los campos negative/measuredPeak/calibrationFrom.
- **Lección Float32**: Monkey C usa Float de 32 bits. A magnitud de System.getTimer() (~465e6 ms en sim tras días encendido), el ULP es ~64 ms — los selftests con `tt+=10.0` sobre esa base NO avanzaban el tiempo (t congelado, finalize nunca disparaba). El device real no lo sufre porque t=tAbs−t0 trabaja a escala de sesión y los saltos reales entre lotes son ~100 ms. Selftests de tiempo: `t0=0` y base pequeña. Cuidado también con jitters de ±64 ms en t si el reloj lleva MUCHOS días sin reiniciar (tolerado por REFRAC/POST).
- **Verificado en sim** (con base de tiempo arreglada): 3 picos [4200,5100,3900] → contados 1→2→3 → umbral 3360.0 exacto (mediana 4200×0.8) → calibrando=false → un tiro posterior cuenta como flecha normal. Selftest eliminado del fuente; build limpio md5 a1f1b82e.
- **Sideload**: AWVG (blindaje cola, §35) seguía sin importar; AWVH copiado y verificado por hash de vuelta. Borrado de AWVG vía Explorer imposible esta vez (CUA muerto por stop_computer_control §32; InvokePattern/SelectionItemPattern no soportados en ítems MTP; SendKeys no llegó). Se dejan AMBOS: el instalador procesa alfabético (AWVG→AWVH), AWVH es superconjunto y gana. Verificación del usuario: el menú debe decir «Calibrar: 3 tiros».

## 37. v43 (2.6) + AWVI: modos, equipo con nombre, radio/tiempo de apunte (16/9, noche)

Ideas traídas de ArcheryX (captura del usuario: SD BREAK RADIUS en MOA, SD S.E.T. en s, equipo HOYT/Easton con CHANGE).

**Reloj (AWVI 5290ccab)**: al arrancar pregunta «Modo de tiro» (Menu2 pushView desde ArcheryView.onShow con flag askedMode — onStart es demasiado pronto) → Indoor=3 flechas/end, Outdoor=6, Libre=0. `TrainingState.mode` persistido en preferences y snapshot; act("mode") fija target; el menú Más muestra los 3 modos en lugar de «Tandas de 3/6/libres». act("profile") ya aceptaba cualquier String → los ARCOS CON NOMBRE del móvil se sincronizan como perfil de calibración (threshold por nombre de arco).

**Móvil (v43, sw aw-v30)**: fuera los <select> nativos («mini modals»): tres filas a ANCHO COMPLETO (Modo/Arco/Flechas) que despliegan hojas propias (.picker/.pickRow/.sheet). Arco y flechas = biblioteca con nombre (localStorage awGear, input+Añadir en la hoja). Elegir modo/arco guarda la sesión y SI está viva envía mode/profile al reloj. Métricas nuevas: TIEMPO APUNTE (ms tranquilos antes de soltar, desde window.mag_pre con umbral |mag−g|<250) y RADIO APUNTE en MOA (dispersión de tilt_x/y: sd combinada /1000·57.3·60) en TIRO; RADIO MEDIO en SESIÓN (sustituye DESVIACIÓN); shotContext con equipo+apunte+radio+pulso; historial muestra modo·arco·flechas. liveShot legacy ahora guarda hr.

**Bug cazado en el test**: displayedSession() devuelve copia del array — mutarla y persist() (que guarda curSess) pierde el cambio; añadido saveSession(s) que escribe la sesión mutada. Afectaba a selección de modo y equipo.

**Estrés**: contestado honesto — Garmin usa HRV (intervalos RR) que Connect IQ NO expone; nuestra aproximación es el pulso por tiro (hr_bpm ya se transmitía, ahora visible). Sin gyro (FR165) el MOA del radio es estimación de inclinación de muñeca, no medición angular real — etiquetado como estimación.

**Stack de PRGs**: AWVG+AWVH seguían pendientes; AWVI añadido. Import alfabético → AWVI (superconjunto: modos+calibración 3 tiros+blindaje cola) gana. Verificación del usuario: al arrancar debe preguntar «Modo de tiro».

## 38. AWVJ: flechas no detectadas — bloqueo por paused/resting heredado (16/9, madrugada)

Usuario tira una flecha sin calibrar y el reloj no la detecta. Diagnóstico: DOS bloqueos reales del gate de detección:
1. **restore() heredaba paused/resting del checkpoint de la cola**: finishActivity() deja paused=true en el último checkpoint; si el móvil no ACKeó todo, al reabrir la app el detector llegaba BLOQUEADO y ninguna flecha disparaba hasta tocar el menú. Fix: restore() fuerza paused=false; resting=false (una sesión nueva nunca hereda el bloqueo).
2. **Interbloqueo con tandas por objetivo**: el gate exigía !resting, pero resting solo se limpia en add() — que nunca llega porque el gate bloquea. Con Indoor (3 flechas), al completar la tanda la 4ª flecha en adelante NO se detectaba jamás. Fix: fuera !resting del gate; add() ya rota de tanda con la primera flecha tras el descanso (DT-2: filas 1→2, resting pasa a false). La PAUSA sigue bloqueando a propósito (DT-3 ✓).

**Lecciones de banco de pruebas**: (a) las filas restauradas de la cola hacen inválidos tests que comparen valores absolutos — imprimir la línea base ANTES del estímulo; (b) hay que resetear `t0=0` en todo selftest de tiempo (tercera vez que el Float32/las bases grandes engañan: t negativo → REFRAC falla siempre y parece que el detector no funciona).

AWVJ (61417098) en Apps junto a AWVG/H/I (4 pendientes: el usuario no ha expulsado desde AWVG — sigue corriendo AWVF). Import alfabético → AWVJ gana. Apps del usuario: expulsar y probar.

## 39. AWVK: indicador de motivo de descarte en campo (16/9, noche)

Contexto: sesión paralela reworked el detector (drawStart/impulse/jerk/pulseRecovered, Tests.mc con Toybox.Test, umbral de calibración con barra 1200) y ya sembró `detectorStatus` con motivos: FALTA APERTURA, MOVIMIENTO PREVIO, APUNTE INESTABLE, POSTURA DISTINTA, PULSO DESCARTADO. Pero la esfera solo lo pintaba con nShots==0 — en campo, tras la primera flecha, un descarte era invisible.

- ArcheryApp: `public discardInfo/discardAt` — sample() captura el último motivo no nulo con marca de tiempo (System.getTimer()); al aceptar tiro se limpia (junto al detectorStatus=null existente).
- Esfera: la línea superior muestra «✕ <motivo>» en naranja durante 6 s tras el descarte, con prioridad sobre ULTIMA/DESCANSO (después de CALIBRANDO/PAUSA). Cambio display-only + captura pasiva: no toca detección/umbrales/timing → los Tests de la sesión paralela quedan intactos por construcción.
- Compila OK; sim sin crash (0% blanco). monkeydo /t no vuelca resultados por consola (Git Bash: usar MSYS_NO_PATHCONV=1; y aun así el runner imprime en el panel del sim, no en stdout).
- **Reloj DESCONECTADO (NO-DEVICE)**: AWVK.PRG (md5 en Temp) pendiente de sideload cuando el usuario conecte. Apps acumula AWVG..AWVJ sin importar todavía según el último listado — verificar al reconectar.

## 40. AWVK v2: por qué calibraba sí y tirar no — puerta de escape sin apertura (17/9)

Dato clave del usuario: «calibración SÍ detecta los tiros, pero luego a la hora de tirar no». El detector nuevo exige drawStart>=0 (apertura detectada) salvo en calibración — una apertura suave (compuesto/back-tension) nunca activa drawStart ⇒ TODAS las sueltas reales se descartaban como FALTA APERTURA. Además su umbral calibrado = mediana(picos)×0.8 ⇒ una suelta típica queda en ~1.25× umbral.

- **Gate**: `(calibration || drawStart>=0 || adev>limit*1.2)` — suelta típica (≥1.2× umbral) cuenta aunque no haya apertura detectada; los falsos siguen fuera por preStable (ventana quieta), que la sesión paralela ya afinó contra su falso positivo. NOTA: 1.5× inicial era demasiado alto (1.25× típico quedaba fuera).
- **Diagnóstico en campo (persistente)**: el motivo de descarte (✕ FALTA APERTURA / MOVIMIENTO PREVIO / APUNTE INESTABLE / POSTURA DISTINTA / PULSO DESCARTADO) queda en pantalla hasta el siguiente tiro aceptado — 6 s era inútil: al tirar miras la diana, no el reloj. Y si el niembró movimiento cruzó el umbral: «SACUDIDA X · UMBRAL Y» (pico reciente sin tiro, 30 s). lastPeakDev se limpia al aceptar tiro.
- Verificado en sim: fuerte sin apertura ✓ cuenta; típica 1.25× sin apertura ✓ cuenta (filas 4→5, drawStart=-1); floja 1.06× sin apertura ✓ rechazada con FALTA APERTURA persistente y picoResid=3400. Watchdog del sim en selftests largos = artefacto (cola de 70 eventos en storage del sim + onStart acumulado); tests de un solo caso caben.
- Error propio corregido: capturas usaban `dev` antes de declararlo (mover tras `var impulse`).
- AWVK v2 en Temp (reloj sigue desconectado). Al reconectar: sideload + verificar Apps.

## 41. AWVL + APK v44: calibración que garantiza detección y traza estilo ArcheryX (17/9)

Petición: la calibración tiene que hacer que NO falle (no solo diagnosticar), y la traza debe verse como ArcheryX (abres fuera de la diana → converges → sueltas), no como «todo en el centro y la suelta lo desplaza».

- **Puerta de escape 1.2× → 1.05×**: con umbral = mediana(picos)×0.8, una suelta típica queda a 1.25× y hasta una floja a ~1.1× — ambas cuentan ahora aunque la apertura no se detecte. Los falsos siguen muriendo en preStable (ventana quieta), que es donde la sesión paralela los ajustó.
- **Traza absoluta**: el reloj restaba la media a tilt (snapTx=rx−mx) y el móvil centraba el canvas ⇒ doble centrado = imposible ver la aproximación. Ahora snapTx/snapTy y px/py van ABSOLUTOS, y proj() ancla el gráfico a la media del REPOSO FINAL (último 20% de la ventana pre): la apertura queda lejos del centro, la convergencia se ve, el reposo ES el centro. Retrocompatible: sesiones viejas (centradas) tienen hold-mean≈0 y se ven igual que antes. Verificado: reloj (snapTx 0→400 en apertura sintética) y navegador (distancias al centro 363→147→35).
- Sesión paralela ya había subido versiones: APK v44 (2.7, sw aw-v44) compilada con estos cambios; **instalación pendiente — el móvil estaba desconectado al compilar** (adb sin dispositivos). AWVL (429a6beb) SÍ copiado al reloj y verificado por hash. Apps acumula AWVG..AWVL (el usuario aún no ha expulsado desde AWVG).

## 42. Investigación acelerómetro + sonda de sensores en el reloj (17/9)

Informe completo en docs/investigacion-acelerometro.md (agente de research, ~29 fuentes, etiquetas [P]/[S]/[I]). Hallazgos que cambian decisiones:
- **FR165 tiene brújula/magnetómetro** (ficha oficial) — CIQ expone :magnetometer en el listener; SI responde en runtime ⇒ yaw ⇒ traza de apunte 2D real. Las listas "supported" de Gyro/MagData son de nivel API, no hardware.
- **Intervalos RR accesibles** (`:heartBeatIntervals` en el listener / HeartRateData.heartBeatIntervals en ms) — el estrés tipo HRV (RMSSD) ES posible; mi afirmación previa de "HRV no accesible" era incorrecta.
- **25 Hz es el techo** del acelerómetro en esta familia (ejemplos oficiales + foros); getMaxSampleRate() para confirmar. pitch/roll ya vienen calculados en grados (fórmulas NXP AN3461) — podemos dejar de derivarlos a mano.
- MOA reales: físicamente no (tilt 2 ejes + ruido de tejido); doble integración: irrecuperable (Woodman TR-696).
- Top-5 mejoras en el informe §4 (power/jerk ya parcialmente hecho por la sesión paralela; sway por pitch/roll; timing; log FIT+replay; sonda MAG).

**AWVM**: «Diagnostico sensores» en Más opciones — registra listener con magnetometer+heartBeatIntervals y getPressureHistory, y muestra en pantalla: tasa máx ACC, MAG (api + dato real en mGauss), RR (ms), BAR (Pa). START cierra. Permiso SensorHistory añadido al manifest. Sim sin crash (4,5% blanco = esfera normal). AWVM copiado y verificado por hash.

## 43. AWVN: crash del diagnóstico arreglado (Array.clear no existe) + sonda validada en sim (17/9)

Usuario ejecuta «Diagnóstico sensores»: ve «START: null» y luego IQ!. CIQ_LOG: `Symbol Not Found: 'clear'` en onSelect — **Lang.Array NO tiene clear()**; y el «null» inicial era `new [1]` (array con un null) que activaba la pantalla de sonda desde el arranque.

- probeReport: init `new [0]` (vacío), reset por reasignación `= new [0]` en vez de clear().
- Sonda endurecida: sin `.toString()` (concat directa), guards null en getMaxSampleRate/getMaxSampleRateForSensorType/presión; heartBeatIntervals es **Array<Number> ms** (no objetos .interval — el doc oficial lo confirma); getPressureHistory devuelve **SensorHistoryIterator sin hasNext()** — patrón `next()!=null`; unregisterSensorDataListener ANTES de cada re-registro (TooManySensorDataListenersException).
- **Datos del sim** (la unidad real puede variar): ACC max 50 Hz, MAG api 50 Hz (¡expuesta!), BAR 86126 Pa. La sonda completa (5 líneas + restauración del listener) corre sin crash en sim.
- AWVN (65d48c0d) en Apps, verificado por hash. Lecciones Monkey C acumuladas: sin Array.clear, sin String.indexOf, iteradores solo next(), unregister antes de re-registrar, Float32 en tiempos grandes.

## 44. CONFIRMADO EN DISPOSITIVO REAL: magnetómetro funciona (17/9)

Lectura del usuario del diagnóstico AWVO: «ACC MAX 50HZ / MAG API 50HZ / BAR 101783.5 Pa / LISTENER MAG+RR OK / MAG dato SAI (15 mGa…)» — la API del magnetómetro está expuesta, el listener con sampleRate explícito entra, y **ENTREGA DATOS REALES (mGauss)**. 15 mGauss parece bajo para el campo terrestre (posible calibración de brújula pendiente — ver al usarlo). RR aún sin leer (pantalla cortaba).

- AWVP: informe del diagnóstico con FONT_XTINY y trozos de 16 chars (9 líneas) para lectura completa en la esfera redonda. El wrap usa substring(0,cut)+substring(cut,len) — substring de 1 arg NO existe.
- Desbloqueado el plan: traza de apunte con yaw de brújula + pitch/roll nativos (estilo ArcheryX real) y estrés HRV con heartBeatIntervals. Falta confirmar RR en la próxima lectura.

## 45. RR ausente en primera lectura — sonda paciente (17/9)

Lectura completa del usuario (AWVP legible): ACC 50 / MAG api 50 / BAR / LISTENER MAG+RR OK / MAG dato SI / **RR ausente**. Hipótesis: la sonda miraba SOLO el primer lote (1 s) y el óptico aún no había enganchado; alternativa: FR165 no entrega heartBeatIntervals pese a exponer la API (caso barómetro). AWVQ: la sonda espera hasta 15 lotes (~15 s), muestra «HR X ppm, esperando RR...» como testigo del óptico, y solo concluye «RR ausente en 15 s» si nada llega. Instrucción al usuario: reloj puesto, esperar ~15 s antes de START.

## 46. AWVR + APK v45: traza con brújula real y estrés RMSSD (17/9)

Tras confirmar MAG dato SI en el dispositivo (§44) y «HR 90 ppm» del óptico (RR final se verá con el sensor caliente en sesión real — auto-fallback):

**Reloj (AWVR e56df0a4)**: listener de producción con `:magnetometer {:sampleRate=>25}` + `:heartBeatIntervals` (ambos aceptados por el firmware según la sonda). Anillo `ryw[400]` con yaw=atan2(magY,magX)·57.3° por muestra diezmada, alimentado desde `curMagX/Y` (onData alinea magnetometerData[i] con accelerometer[i]; sin firma de sample() cambiada → Tests intactos). trigger() congela `snapYw` paralelo a snapTx; msg añade `"yw"=>decimate(snapYw,64)`. `rrRing[90]` cosecha intervalos 300-2500 ms; `rrRmssd()` = sqrt(media diff²) sobre últimos ≤30; msg añade `"rmssd"` solo si ≥11 intervalos.

**Móvil (v45/2.8, sw aw-v45)**: `hasCompass(s)` (yaw con dispersión >0.5°); proj() con brújula → horizontal = yaw real en grados (anclado al reposo), vertical = inclinación mG→grados (/17.45); esc en grados. aimRadius → grados reales (sd yaw, sd tilt/17.45) o MOA estimados sin brújula; aimUnit dinámico (°/MOA) en TIRO, RADIO MEDIO y shotContext. session-model/liveShot pasan yaw_deg+rmssd. shotContext: «radio 4.6° · pulso 96 ppm · RMSSD 43 ms».

**Verificado**: navegador (compás sintético: convergencia 14.7→1.9 en grados, radio 4.6°, RMSSD en ctx) y sim (anillo yaw 0°→−61.1° con rotación sintética, tiro contado). Nota de test: recargas del navegador pueden servir training.js cacheado — fetch(url,{cache:'reload'}) antes de location.reload (en el APK no aplica, file://).

**Pendiente**: APK v45 sin instalar (móvil desconectado). RR definitivo: se verá en sesiones reales (rmssd aparecerá solo si el firmware entrega intervalos en marcha).

## 47. AWVS + APK v46: menos flechas perdidas, sin avisos fantasma, latencia corta (17/9)

Feedback de campo: muchas flechas sin detectar, «apunte inestable» mientras coloca flecha, y tiempo de registro del tiro demasiado grande.

- **preStable(strong)**: strong = dev>umbral (candidato real). Suelta fuerte (impulso de suelta de verdad) se salta los vetos de varianza de apunte (umbral base 6400→40000 mG² = sd 200 mG; factor de pose 2.25→3.0; y para strong el veto solo a 4×) y de postura. MOVIMIENTO PREVIO (pstdev gravedad) sigue SIEMPRE — es el discriminador real apertura/maniobra. Avisos (todos los estados) solo con strong: el jerk débil de colocar flecha ya no canta ni cuenta (FX-1: filas sin cambio, aviso null).
- **PULSO DESCARTADO** ya no veta sueltas fuertes (peak≥1.3×umbral pasa aunque la forma del pulso sea atípica).
- **Latencia**: POST 2000→1200 ms, buffers post 40→24 (1.2 s @20 Hz). aimTime del móvil: umbral de calma 250→150 mG.
- Verificado en sim: colocar-flecha (oscilación 1.5-2.4 g suave) → 0 flechas y 0 avisos; suelta típica → flecha limpia. APK v46 (2.9, aw-v46) instalada (Success, versionName 2.9). AWVS verificado por hash.

## 48. AWVT: deshacer en calibración + IQ al salir (17/9, tarde)

Reporte de campo: «borrar flecha en modo calibración no funciona» y IQ! al «Guardar y salir» (sin entrada nueva en CIQ_LOG).

- **Deshacer en calibración**: act("undo") con calibration=true ahora quita el último pico de positive[] (antes borraba de rows, que está vacío en calibración → no hacía nada) y emite state → el contador n/3 baja.
- **IQ al salir**: el System.exit() se ejecutaba DENTRO del callback de Communications al llegar el ACK del móvil — salir desde callback puede matar la app sin log (encaja con el CIQ_LOG vacío). Ahora onPhone solo marca `exitPending` y el timer (contexto principal) ejecuta System.exit() en su siguiente tick (≤5 s).
- **Investigación del repro en sim**: session.stop() mata la app en el simulador con logger sin datos (artifact: monkeydo no genera datos de sensor; en el dispositivo los FIT siempre se han guardado). Bisects intermedios invalidados por parches a medio aplicar (anclas de flushTimer/probeMode cambiadas por la sesión paralela) — lección: escribir el fichero tras cada grupo de parches con éxito, no todo-al-final.

## 49. AWVU + APK v47 (3.0): campo con datos reales via CDP (17/9, tarde)

Reporte de campo post-AWVT + volcado del localStorage del móvil vía build debuggable temporal + CDP (captures/field-sessions.json: 20 sesiones, 4 flechas de hoy). Hallazgos con TUS flechas: **yawSpread=0 en todas** (el magnetómetro no alimentó la sesión: mi alineación exigía mag.x.size()==n del acelerómetro; la sonda leía directo y por eso sí veía datos — los lotes de cada sensor vienen con tamaños propios), rmssd=None (intervalos no fluyen: fallback correcto), scores 98-99 clavados (fórmula saturada), mag_pre quieta en 46/48 muestras (el «tiempo de apunte» contaba casi toda la ventana pre).

- **MAG por índice**: magN = mag.x.size()>0, feed curMagX/Y con índice acotado (mi=min(i,len-1)) — el reloj y la sonda confirmaron datos; ahora la sesión los recibe.
- **Score**: clamp(100 − pstdev×0.8): 10 mG→92, 60→52, 125→0 (antes /10: todo 98+).
- **TIEMPO TIRO**: el reloj transmite drawms = t−drawStart (verificado 2400 ms sintético); el móvil muestra (drawms+1200)/1000 s — apertura→suelta+margen, como pedido. Etiqueta «TIEMPO APUNTE»→«TIEMPO TIRO». draw_ms en session-model.
- **Flechas tras recoger set**: MOVIMIENTO PREVIO tolera ×1.5 (675 mG) en sueltas fuertes — la muñeca recién asentada tras recoger ya no descarta la primera flecha del set siguiente.
- v47 instalada (Success, 3.0). AWVU (b56d6b1a) verificado por hash. El build debuggable se revirtió (release limpia). Nota: reinstall -r conservó localStorage ✓.

## 50. AWVV + APK v48 (3.1): ventana de traza saneada y reproducción a ritmo fijo (17/9, noche)

Datos de la tanda 16:34 (3 flechas, TRX 38): draw_ms 30-61 s (drawStart disparaba al colocar la flecha y no se recuperaba), ventanas 32 s, yawSpread 325-357° (la brújula YA alimenta ✓ — recortado queda útil; pendiente calibración de brújula del sistema si el yaw salta), scores 52/92/91 (curva nueva ✓), rmssd none.

- **Reloj**: la ventana de traza ancla al ÚLTIMO episodio de movimiento (motionSince−200 ms) con tope de 6 s — colocar la flecha ya no engorda traza ni TIEMPO TIRO; snapDraw = t−motionSince (apertura real). Con 64 puntos en ≤6 s, el muestreo pasa de ~0,5 s a ~90 ms por punto.
- **Móvil**: play() ya no reproduce en tiempo real (32 s de ventana = 32 s de espera): duración fija 1,1-1,8 s y marcador interpolado entre muestras (suave).
- v48 instalada (3.1). AWVV verificado por hash. Debuggable revertido (release limpia).

## 51. APK v49 (3.2): traza de magnitud en escala logarítmica (17/9, noche)

Petición: el pico de la suelta (~4-8 g) aplastaba el resto de movimientos del tiro en la gráfica de magnitud. drawTrace ahora mapea Y con log10(1+v) (rejilla 1g/2g/4g intacta — sus líneas siguen en sitio log-correcto). Verificado en navegador con suelta 8 g + apunte ±60 mG: el apunte pasa de <1 px a ~13% de la altura (18 filas de 140) y el pico conserva la parte superior. Solo móvil; sin cambios de reloj (AWVV sigue vigente).

## 52. AWVW + APK v50 (3.3): traza completa visible, puntuación anti-deriva, borrado sin confirmar (18/9)

Feedback: el reproducir solo enseñaba la suelta; la mejor puntuación fue una flecha con movimiento intencional; confirmación innecesaria al borrar; y una 4ª flecha fantasma (detección falsa).

- **Escala robusta de la traza (aim)**: con brújula viva, el barrido de la apertura (±120°) fijaba la escala y el apunte quedaba en un punto → ahora esc = percentil 90 de las desviaciones ancladas al reposo ×1,3. Verificado: traza con apertura -120° y apunte ±1,5° ocupa 312/330 filas (antes invisible); reproducción 1,2 s.
- **Puntuación con castigo de deriva**: score = 100 − pstdev×0,8 − rango_tilt×0,10 (máx de los rangos x/y de las últimas 25 muestras diezmadas). Moverse despacio (varianza baja, rango alto) ya no puntúa: 300 mG de deriva = −30 puntos.
- **Borrar flecha directo**: fuera askConfirm en removeSelection (index.html) y en el override del reloj (training.js). El modal askConfirm queda sin uso inmediato.
- La flecha fantasma: detección falsa (tanda de 4) — borrarla ya es un toque; si se repite, anotar el movimiento previo (los indicadores ✕/SACUDIDA orientan). Sin cambio de gate en esta versión para no desestabilizar lo recién afinado.

## 53. APK v51 (3.4): el misterio de la «confirmación» al borrar (18/9)

No era un diálogo: el aviso «Eliminación pendiente de confirmación» (confirmación del RELOJ, no del usuario) al borrar flechas de sesión viva se leía como petición de confirmación — y la flecha no desaparecía hasta el eco del reloj. Ahora: borrado OPTIMISTA inmediato en el móvil (removed[] bloquea reenvíos del reloj), orden al reloj si hay puente, y aviso «Flecha eliminada». Verificado en navegador con Native mock: 3→2 flechas al instante, sin modal, removed=[t]. Forzar force-stop tras instalar (lección §52: la app viva conserva el DOM viejo).

## 54. APK v52 + AWVX: reproducción completa + dieta de cola (18/9)

- **Bug del reproducir**: al comprimir la duración de pared, el `end` también quedaba comprimido → solo recorría el primer 1/6 de la trayectoria. k avanza en tiempo de pared; end mapea a ms REALES (pts[0][2]+k*real).
- **IQ en plena sesión (sin log otra vez)**: mitigación por presión de recursos — cola de reenvío con tope 25 (antes 50) y yaw diezmado a 32 puntos por evento. Si reaparece, pedir al usuario: cuánto tiempo llevaba tirando y si el móvil estaba conectado (los no-ACK engordan la cola).

## 55. APK v53 + AWVY: ritmo de reproducción y puntuación = traza visible (18/9)

- Playback: real/3 con rango 1,6-3,5 s (venía a 1,1 s tras el fix del §54 — demasiado rápido).
- Puntuación: ahora juzga TODA la ventana de traza (~6 s / 72 muestras diezmadas, saltando las 2 del pico): temblor = max(pstdev gravedad, sd tilt x/y de la ventana) y deriva = rango de la misma. Una flecha con viaje grande pero reposo final corto ya no sale con 88 — lo que se ve en la traza es lo que puntúa.

## 56. APK v55 (3.8): trayectoria hasta la suelta, curva y a tiempo real (18/9)

- **La trayectoria (aim canvas y reproducción) termina en la suelta**: pts filtrados a p[2]<=0; el follow-through sigue visible en la gráfica de magnitud (donde aporta). Punto rojo = momento de la suelta.
- **Trazo suave**: aimPath con curvas cuadráticas por puntos medios (lineCap/Join round) — sin saltos de segmento a segmento; colores de fase intactos.
- **Reproducción**: solo fase pre, duración = tiempo real con suelo de 3 s (antes 0,8× tras 3× y 1/6 — cuarta iteración de ritmo), y revelado por CLIP rectangular continuo (el trazo crece con el marcador, cero saltos).
- Verificado: traza sintética de 4,7 s pre → reproducción 4,8 s. v55 instalada y app reiniciada. Solo móvil.

## 57. APK v56 (3.9): fin de la ilusión de borrado en la reproducción (18/9)

El revelado por recorte rectangular asumía X=tiempo, pero en la trayectoria X es el ÁNGULO — cuando el trazo iba a la izquierda, el clip "despintaba" (trazo siempre pintado + algo que borra desde la derecha + reaparece, según el usuario). Sustituido por crecimiento por tramos: aimPath(slice(0,m+1)) + segmento parcial interpolado hasta el marcador (corto, invisible como recta). Verificado midiendo píxeles de fase cada 500 ms: 1894→3224 monótono creciente hasta el trazo completo. v56 instalada y reiniciada.

## 58. APK v58 (4.1): anti-parpadeo del canvas estático + cierre de pestañas trampa (18/9)

El usuario seguía viendo rapidez + líneas desapareciendo, con 2 pestañas de test (127.0.0.1) vivas en el navegador — código VIEJO con los bugs ya arreglados. Cerradas por browser-use. Además, flicker REAL en la app: drawAim se repintaba entero (clear+rings+path) en cada render() disparado por eventos BLE (~1/s con pulso) — parpadeo perceptible. Ahora drawAim tiene dirty-check (key = flecha+total+canvas) y solo repinta al cambiar de flecha/dato; la cache se invalida al terminar/detener reproducción. v58 instalada y reiniciada.

## 59. APK v59 (4.2): el misterio de la reproducción erizada — ventanas de 32 s (18/9)

Diagnóstico con los datos REALES del usuario (field-sessions2.json): sus tandas guardadas aún tienen ventanas de 32 s (reloj pre-AWVV sin importar — no ha expulsado desde AWVV). Reproducción a tiempo real de 32 s = 28 s de colocar flecha casi inmóviles + el tiro comprimido al final → percepción de "instantáneo/demasiado rápido/líneas mal" (más el garabato de la fase de colocar con barridos de brújula ±180°). Además, mis mediciones de canvas contaban los ANILLOS de la diana (mismos colores que las fases) — hay que excluirlos (±15 en gris-azulado/verde) o diffar contra estático.

- dur = min(8000, max(3000, real≤8000 ? real : real/4)) — las tandas viejas se reproducen en ≤8 s; las nuevas (ventana 6 s tras AWVY) a tiempo real.
- v59 instalada. CLAVE pendiente: el usuario debe EXPULSAR el USB para importar AWVY (ventanas de 6 s desde el reloj).

## 60. APK v60 (4.3) + AWVZ: trayectorias con brújula por fin sanas (19/9)

Datos del usuario vía CDP (flecha 2/set 1, ventana 6 s): yaw CONGELADO en tramos (140.01317 exacto repetido — lotes de brújula más cortos que los del acelerómetro; mi relleno por clamp repetía el último valor) y con el salto de 160° los primeros puntos caían FUERA del canvas (P.x=437 en canvas 410) y la escala se disparaba.

- **Reloj (AWVZ)**: feed de brújula sin repetición en cascada — lote corto conserva el último valor conocido.
- **Móvil (v60)**: `fixYaw()` compartido por dibujo Y escala (la escala usaba yaw crudo con el tramo congelado → esc≈188° → todo microscópico: el colapso 27×4 px); diferencias angulares envueltas al camino corto (±180); P acota al canvas (saltos → borde, nunca fuera). Verificado con la firma exacta del usuario (40 muestras congeladas + variación): spread 152×21 px en canvas 330, todo dentro.
- Lección acumulada de canvas: excluir los anillos (mismos colores que fases) al medir; y las parcheadas múltiples de una función exigen releerla ENTERA antes del siguiente parche (me dejó un renombrado esc2/esc roto y el helper a medias).

## 61. APK v61 (4.4): reproducción fluida por rendimiento (19/9)

"Las rayas aparecen de golpe": cada frame redibujaba 5 anillos con relleno + ~64 trazos curvos individuales en canvas dpr≈3 — el móvil iba a 10-20 fps y el trazo avanzaba a saltos. Optimización: anillos cacheados en canvas offscreen (1 drawImage por frame) y aimPath agrupado por runs de color (≤4 beginPath/stroke, fases secuenciales). Geometría intacta (spread 152×21 verificado igual) y 303 frames en la reproducción de prueba. v61 instalada y reiniciada. AWVZ (feed brújula sin congelos) sigue pendiente de conexión del reloj.
