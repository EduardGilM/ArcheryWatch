# Prueba física inicial — 15/09/2026

## Resultado comprobado

- Teléfono accesible por ADB: Nothing A069, Android 16; Mi Fitness 3.57.0i (357000).
- Gadgetbridge 0.93.0 instalado correctamente por ADB desde la [APK publicada en F-Droid](https://f-droid.org/packages/nodomain.freeyourgadget.gadgetbridge/), versión 252 firmada por el desarrollador. Sin configurar vinculación ni conceder permisos adicionales. Se usará como instrumento de prueba del protocolo.
- Mi Fitness detecta un XiaomiWatchS1Active; después el escáner BLE del ordenador también lo detectó.
- Conexión GATT completada y cerrada correctamente mediante `tools/probe.py`.
- Se enumeraron siete servicios: `1800`, `1801`, `FE95`, `FDAB`, `3802`, `cc353442-be58-4ea2-876e-11d8d6976366` y `1314ff00-1000-9000-7000-301291e21220` (UUID cortos con base Bluetooth estándar).
- `FDAB` expone una característica `00000001` de lectura y `00000002`/`00000003` con notificación y escritura sin respuesta. La enumeración no prueba su semántica ni acceso autenticado.
- No expone el servicio estándar Device Information `180A` en esta conexión; no se obtuvo firmware mediante el lector estándar.
- Informe local completo: `captures/watch-services.json`. Las copias de registros de Mi Fitness se mantienen en `captures/`, sin incluirlas en control de versiones.

## Pendiente

Confirmar vinculación actual del reloj con Mi Fitness, obtener firmware y establecer sesión autenticada del protocolo Xiaomi. Después probar la ruta de aceleración cruda encontrada en Gadgetbridge, descrita en [viabilidad](s1-active-viabilidad.md).

**No se han obtenido muestras de aceleración ni giroscopio.** No se ha iniciado un entrenamiento ni instalado paquetes en el reloj. La captura independiente del teléfono sigue siendo otro requisito por validar, incluso si funciona el envío de aceleración en directo.

## Verificación del diagnóstico

Compilación de Python y ayuda CLI correctas. Escaneo real ejecutado; inspección GATT del S1 Active terminada sin error. No se ha probado la lectura de información estándar en otro dispositivo ni la recuperación ante todos los fallos de Bluetooth.
