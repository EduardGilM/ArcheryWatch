# Las 21 capturas de la segunda prueba

El reloj ejecutó el build 66 y estaba en **calibración**. Se recuperaron 19 candidatos del archivo de sesiones y dos candidatos más, junto al cierre, de la cola duradera del móvil. Tras actualizar, los 21 están guardados y la cola está vacía. No se eliminaron sesiones ni se eligió una referencia por el usuario.

Los candidatos 4, 12 y 18 son los tres tiros **probables**, según la señal y la respuesta del usuario; la identificación sigue siendo tentativa.

| Candidato | Tiempo relativo | Pico |
|---|---:|---:|
| 4 | 64,367 s | 3653 mG |
| 12 | 133,506 s | 8240 mG |
| 18 | 157,468 s | 5054 mG |

## Causa de la presentación vacía

Las capturas contienen inclinación, orientación y tiempos. La proyección elegía el desplazamiento integrado porque sus arrays tenían la longitud correcta, aunque todos sus valores previos fueran cero. Eso ocultaba la orientación registrada. Además, las barras representaban la estabilidad, que es `null` para candidatos: todas terminaban en la altura mínima de tres píxeles.

El móvil 67 muestra la orientación de los candidatos, con escala individual explícita. En entrenamiento, un desplazamiento plano permite recuperar la orientación. Las barras de una sesión de candidatos comparan sus picos en mG y permiten tocar un candidato. La comparación de dos trazas utiliza la escala de la seleccionada. También se corrigió la regla CSS que hacía visibles controles marcados como ocultos.

## Verificación y límites

- Las dos regresiones de presentación fallaron con los datos reales antes del cambio y ahora pasan; las 21 trazas admiten reproducción. Pasan 19 pruebas móviles y el modelo de sesiones.
- Edge verificó las 21 animaciones, barras, selección táctil, panel de referencia y controles ocultos, sin errores JS ni desbordamiento horizontal.
- La señal FIT contiene 18.500 muestras; la fixture conserva 18.499 tiempos únicos, relativos, y aceleración redondeada en mG. Reproducir los métodos actuales del reloj con cualquiera de las tres referencias probables acepta tres impulsos cerca de esos candidatos y descarta el resto. Pasan 36 regresiones. Este ejecutor usa adaptadores JS; no equivale a ejecutar la VM Garmin ni confirma precisión general en el campo.
- Comprobado en el teléfono: 21 candidatos guardados, sesión finalizada, reproducción disponible y cero eventos/órdenes pendientes. Después se reinstaló el APK de entrega sin depuración, versión **4.10 (67)**, conservando los datos y con el receptor activo.
- SHA256 del APK instalado y compilado: `75CD145BAC8319A9C1A1D29DC97F5177F8481C657B46BB8BABF9E33B269B0822`.

La calibración conserva movimientos para permitir escoger una suelta débil; 21 candidatos no significan 21 flechas confirmadas. La siguiente prueba debe realizarse después de seleccionar una referencia real desde el móvil. El IQ! de la prueba anterior sigue sin una causa confirmada; esta actualización del móvil no demuestra su resolución.

Evidencias privadas: `captures/diagnosis-21/`. Fixtures sin identificadores, pulso ni etiquetas personales: `tools/tests/fixtures/candidates-20261002.json` y `field-20261002-afternoon.json`.
