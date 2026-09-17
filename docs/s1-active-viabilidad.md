# Xiaomi Watch S1 Active: prueba de viabilidad

Investigación: 15 de septiembre de 2026. Objetivo: registrar movimiento en el reloj y transferirlo a Android para analizar tiros.

## Conclusión

La captura continua de acelerómetro y giroscopio del S1 Active **no está demostrada en el dispositivo**, pero el código actual de Gadgetbridge contiene una vía concreta para probar acelerómetro: `XiaomiHealthService.startRawSensor()`. La habilita por defecto para dispositivos Xiaomi protobuf mediante una sesión deportiva sintética. El coordinador S1 Active hereda esa capacidad; todavía hay que verificar si su firmware responde. La siguiente entrega útil es probar esa ruta existente con el dispositivo real.

## Evidencia primaria

| Hallazgo | Evidencia | Consecuencia |
| --- | --- | --- |
| El S1 Active permite aplicaciones de terceros desde Mi Fitness. | [FAQ oficial, preguntas 55 y 56](https://www.mi.com/ph/support/faq/details/KA-08502/) | Hay una vía de distribución existente; no prueba instalación de paquetes nuestros ni acceso a sensores. |
| La propia FAQ mezcla referencias a Watch Color 2 y menciona Android 12 como beta. | [FAQ oficial](https://www.mi.com/ph/support/faq/details/KA-08502/) | Comprobar tienda, región y firmware reales; no extrapolar sus límites históricos a Android actual. |
| Gadgetbridge cataloga S1 Active como experimental y con soporte de alcance desconocido. Necesita clave de autenticación obtenida tras vinculación con Xiaomi. | [Dispositivos Xiaomi](https://gadgetbridge.org/gadgets/wearables/xiaomi/) | Puede servir para explorar la conexión; soporte nominal no equivale a captura IMU. |
| Los dispositivos Xiaomi protobuf pueden usar BLE o Bluetooth Classic según firmware. Gadgetbridge documenta cifrado, consulta de firmware/modelo, instalación RPK y gestión de aplicaciones, sujetas a capacidades. | [Xiaomi protobuf](https://gadgetbridge.org/basics/topics/xiaomi-protobuf/) | Un escaneo BLE vacío no descarta el reloj. La función RPK genérica no certifica este modelo. |
| La documentación general de tiempo real incluye pasos y pulso; el código actual añade captura de acelerómetro para Sleep as Android. | [Xiaomi protobuf](https://gadgetbridge.org/basics/topics/xiaomi-protobuf/) y código detallado abajo | El código ofrece una vía más concreta que la documentación general. No implica giroscopio ni almacenamiento autónomo. |
| La tabla oficial de dispositivos Vela JS enumera S1 Pro y otros modelos; S1 Active no aparece. | [Adaptación multipantalla de Vela](https://iot.mi.com/vela/quickapp/en/guide/multi-screens/) | No asumir que un proyecto AIoT/Vela moderno ejecutará en el S1 Active. |
| Vela documenta `sensor.subscribeAccelerometer`, pero marca S1 Pro como no soportado. S1 Active no figura; la página no presenta una API de giroscopio. | [API oficial de sensores](https://iot.mi.com/vela/quickapp/en/features/system/sensor.html) | Ni siquiera compatibilidad con Vela bastaría: hay que verificar cada API por dispositivo. |

## Ruta de acelerómetro encontrada en código

Se leyeron directamente cuatro archivos de la rama `master` de Codeberg el 15/09/2026; la rama es mutable, por lo que conviene fijar el commit al implementar:

**Disponibilidad publicada:** el [blog oficial](https://gadgetbridge.org/blog/) anuncia Gadgetbridge 0.93.0 y su [changelog](https://codeberg.org/Freeyourgadget/Gadgetbridge/raw/branch/master/CHANGELOG.md) incluye soporte Sleep as Android para Xiaomi protobuf. También se descargó y comprobó el [archivo XiaomiHealthService del tag 0.93.0](https://codeberg.org/Freeyourgadget/Gadgetbridge/raw/tag/0.93.0/app/src/main/java/nodomain/freeyourgadget/gadgetbridge/service/devices/xiaomi/services/XiaomiHealthService.java): contiene `startRawSensor()` y el canal 53. Puede probarse una APK oficial 0.93.0 sin depender de una nightly para esta función; todavía debe verificarse cómo invocarla y exportar los ejes.

- [XiaomiWatchS1ActiveCoordinator.java](https://codeberg.org/Freeyourgadget/Gadgetbridge/raw/branch/master/app/src/main/java/nodomain/freeyourgadget/gadgetbridge/devices/xiaomi/watches/XiaomiWatchS1ActiveCoordinator.java): nombre Bluetooth `^XiaomiWatchS1Active [0-9A-Z]{4}$`, experimental, `ConnectionType.BOTH`; no redefine la capacidad de acelerómetro.
- [XiaomiCoordinator.java](https://codeberg.org/Freeyourgadget/Gadgetbridge/raw/branch/master/app/src/main/java/nodomain/freeyourgadget/gadgetbridge/devices/xiaomi/XiaomiCoordinator.java): `getSleepAsAndroidFeatures()` incluye `ACCELEROMETER`. Su comentario exige que los modelos que no respondan al protocolo lo deshabiliten expresamente. `supportsAppsManagement()` devuelve `true` por defecto.
- [XiaomiHealthService.java](https://codeberg.org/Freeyourgadget/Gadgetbridge/raw/branch/master/app/src/main/java/nodomain/freeyourgadget/gadgetbridge/service/devices/xiaomi/services/XiaomiHealthService.java): implementa la secuencia siguiente y envía ejes a `SleepAsAndroidSender`.
- [XiaomiSystemService.java](https://codeberg.org/Freeyourgadget/Gadgetbridge/raw/branch/master/app/src/main/java/nodomain/freeyourgadget/gadgetbridge/service/devices/xiaomi/services/XiaomiSystemService.java): inspección acotada; no se encontró una ruta adicional de movimiento en este archivo.

Todos los mensajes siguientes usan `Command.type=8` y el transporte/autenticación Xiaomi existente:

| Paso | Implementación observada |
| --- | --- |
| Iniciar | `startRawSensor()`: activa estadísticas en tiempo real (subtipo 45), envía estado de entrenamiento (26), `sport=810`, `status=0`, `sportInfo.type=16`, `unknown6=3`, timestamp en segundos. |
| Confirmar | Ante `WorkoutOpenWatch` (30), responde con `WorkoutOpenReply` cuyos campos `unknown1/2/3` valen `0/2/2`. |
| Recibir | Subtipo 53: `RawSensorBatch.accel[]`, cada elemento `AxisSensor` contiene `x/y/z`. Se llama a `SleepAsAndroidSender.onAccelChanged`. |
| Mantener | Cada diez lotes recibidos envía subtipo 49: contador creciente, `unknown2=0`, `unknown3=0`. |
| Terminar | `stopRawSensor()`: desactiva estadísticas (46), envía estado 1 y después 3. El código reconoce que la semántica del estado intermedio no está clara, pero es requerida por el dispositivo. |

La sesión sintética se describe en comentarios como oculta/no persistente. Por tanto, esta ruta es candidata a transmitir aceleración al móvil mientras están conectados; **no demuestra registro autónomo en el reloj ni recuperación posterior**. El manejador leído procesa aceleración, sin giroscopio ni timestamps individuales; hay que revisar el esquema y medir frecuencia/unidades antes de interpretar señales.

## Límites de la investigación

El acceso web a Codeberg falló inicialmente; se resolvió descargando archivos individuales desde shell con acceso de red autorizado. No se hizo auditoría exhaustiva ni prueba física. El [repositorio oficial anterior](https://github.com/Freeyourgadget/Gadgetbridge) está archivado y remite a Codeberg; no debe tratarse como código actual.

No se ha instalado ningún RPK, modificado firmware ni obtenido muestras físicas en esta investigación. Tampoco se ha identificado un SDK público específico del S1 Active.

## Prueba mínima y criterios de éxito

1. Registrar versión de firmware, versión de Mi Fitness, modelo del móvil y presencia de la tienda de aplicaciones. Mantener la vinculación actual: la FAQ indica que desvincular restaura el reloj.
2. Inventariar Bluetooth del reloj. Si BLE no aparece, comprobar también Bluetooth Classic. Documentar servicios observados sin atribuirles una función de sensor por su nombre.
3. Probar `startRawSensor()` mediante una versión de Gadgetbridge que contenga esta implementación, usando su autenticación existente. Confirmar primero modelo/firmware y conexión; la versión instalada debe comprobarse porque esta lectura corresponde a `master`.
4. Si llegan lotes 53, grabar 30 segundos: reposo, inclinaciones, movimiento y reposo. Exportar tiempos de recepción y los ejes disponibles, verificar unidades y medir frecuencia efectiva/pérdidas. No confundir tiempo de recepción con instante exacto de muestreo.
5. Repetir con pantalla apagada. Probar desconexión para caracterizar límites, sin esperar persistencia del entrenamiento sintético. Para captura autónoma, investigar por separado paquete/SDK específico del **S1 Active**, ejecución, lectura de sensor, almacenamiento y transferencia posterior.

Éxito mínimo: archivo de muestras reales identificadas como procedentes del reloj y variación coherente con movimientos controlados. Una captura del móvil, datos sintéticos, pasos, pulso o confirmación de enlace Bluetooth no cumplen este criterio. Si solo se obtiene aceleración, el alcance inicial puede ser conteo experimental; la estabilidad angular queda pendiente de giroscopio u otra medición validada.

## Reutilización de open source

Usar Gadgetbridge como referencia de autenticación/transporte y capacidades. Su [repositorio](https://github.com/Freeyourgadget/Gadgetbridge) declara AGPLv3; cualquier incorporación de código debe conservar procedencia y licencia. No se ha copiado código en esta nota. Los algoritmos, formato de sesión y visualización pueden desarrollarse independientemente del adaptador del reloj mientras se resuelve el acceso físico.
