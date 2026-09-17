# ArcheryWatch: revisión técnica y siguiente entrega

> Estado histórico de v1.5. La implementación posterior y las pruebas actuales están en [v2-entrenamiento.md](v2-entrenamiento.md).

16 de septiembre de 2026. APK 36 / 1.5; Garmin compilado para Forerunner 165.

## Resultado

Compila y supera las pruebas locales descritas abajo. **Todavía no está certificado para producción**: faltan pruebas de conexión y reinicio con dispositivos físicos, y una campaña de tiro etiquetada. Al terminar esta revisión, `adb devices` no enumera ningún teléfono y el explorador MTP no enumera el Garmin. No se ha instalado esta versión ni borrado datos del usuario.

## Cambios realizados

- Android conserva los eventos en almacenamiento local y los retira cuando JavaScript confirma su aplicación. Pruebas de orden, reinicio, confirmación duplicada y fallo de escritura. Los errores de almacenamiento se hacen visibles.
- Mensajes nuevos incluyen `sid`, identidad de la actividad, para deduplicar inicios y recuperar sesiones tras retransmisiones. Los registros de borrado se conservan también en actividades archivadas con identidad del reloj.
- Corrección del filtro del identificador Connect IQ: el SDK devuelve el UUID sin guiones. Serialización con JSONObject en lugar del generador manual.
- WebView sin depuración en release, navegación externa bloqueada, sin acceso general a archivos/contenido ni cargas de red. Icono de notificación monocromo y acceso a la app desde la notificación. SDK mínimo 26, coherente con las APIs utilizadas.
- APK empaqueta solo la interfaz e iconos, excluyendo capturas JSON de entrenamiento. Se conserva la firma existente; claves y compilados añadidos a .gitignore.
- Reloj: cola persistente, transmisión de una entrada por vez, reintento sin destruir el contenido, identidad de sesión, calentamiento del detector y buffers parciales válidos. Media móvil mediante suma acumulada; frecuencia solicitada limitada a 100 Hz y espaciado nominal dependiente de frecuencia. Captura del pico inicial antes de actualizar la media.
- Frontend: identidad de tanda `set_id`, asignada inicialmente con la heurística previa. Borrar una flecha intermedia ya no divide las restantes en dos tandas. Las sesiones antiguas reciben identidad al leerse, guardada con la siguiente modificación.
- Un tiro entrante conserva la pestaña y una flecha anterior que se esté revisando. Si se estaba siguiendo la última, la selección avanza a la nueva. Historial separado del directo.
- «Puntería» pasa a «Estabilidad» sin cambiar la fórmula histórica. Se retira el consejo no sustentado de anclaje/tensión y se identifica la traza como movimiento relativo con escala automática. El pico se etiqueta como aceleración.
- Logo generado con ImageGen, adaptado a los iconos Android, web y Garmin. Prompt y procedencia en assets/branding/README.md.

## Pruebas

| Comprobación | Resultado |
|---|---|
| Caso original: borrar flecha central a 0/40/80 s | Reproducido: una tanda pasaba a dos antes del arreglo |
| tools/frontend-regression.js | 30 comprobaciones correctas: navegación, vacío, reproducción, borrados, reenvíos, identidad de tanda, recibos y selección |
| tools/tests/EventQueueTest.java | Persistencia, FIFO, confirmaciones y fallos de disco correctos |
| Compilación Android con android/build.sh | Correcta, APK firmado; avisos de APIs obsoletas, sin errores |
| apksigner verify | Correcto |
| Contenido del APK | Solo index.html, manifest, service worker e iconos en assets |
| Compilación Monkey C para fr165 | BUILD SUCCESSFUL |
| Navegador 390 × 780 | Sin desbordamiento horizontal; consola sin errores |
| Dispositivo real / sesión de tiro | Pendiente: dispositivos no disponibles al cierre |

Las pruebas del navegador guardan/restauran las claves de prueba, pero deben ejecutarse en un navegador dedicado, nunca sobre una sesión real del usuario. Compilar para fr165 no valida automáticamente fr165m ni otros relojes.

## Límites y trabajo pendiente

1. La confirmación de transporte Garmin no constituye una confirmación de almacenamiento del móvil. Para garantizar entrega de extremo a extremo hace falta un ACK de aplicación y probar desconexiones/cierres. El almacenamiento del reloj es finito; un fallo muestra error. Un final pendiente puede necesitar abrir de nuevo la app del reloj para enviarse.
2. Las tandas tienen ahora identidad estable, pero siguen infiriéndose inicialmente por pausas de 60 s. **No se ha implementado el cierre explícito, objetivos 3/6, reapertura ni corrección de límites.** Son la siguiente mejora de dominio.
3. El detector y su asentamiento siguen siendo heurísticos. No se han ajustado umbrales sin datos ni validado la primera muestra tranquila como recuperación sostenida. El detector Python no es equivalente al causal del reloj.
4. El índice 0–100 conserva su fórmula para no alterar el histórico. No es precisión sobre la diana. Comparación a escala común, fases verificadas y tiempos nativos requieren otro cambio y su validación.
5. Comprobar en el teléfono actualización conservando historial, permisos iniciales, WebView local, pantalla apagada, cierre/reapertura, reinicio, Garmin Connect ausente y recuperación de conexión. En el reloj comprobar cola, memoria y registro FIT con tiro real.
6. Antes de distribuir públicamente: revisar requisitos vigentes de las tiendas, política de datos, copia/exportación del historial y gestión segura de firma. La compilación local no equivale a aprobación de tienda.

## Orden propuesto de implementación

1. Eventos explícitos de tanda y correcciones, persistidos en reloj y teléfono; entrega confirmada de extremo a extremo.
2. Esfera propia naranja con contador 3/6, estado y total; cerrar/corregir desde botones y feedback discreto.
3. Recopilar tiros reales y negativos, implementar detector reproducible, separar sesiones de ajuste y validación.
4. Comparador de trazas a escala común, ritmo entre tiros, recuperación sostenida y progreso por equipo.

Detalles y fuentes: [competencia](competencia-arqueria.md) y [detección y validación](deteccion-validacion.md).
