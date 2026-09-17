# Registro de tiro con arco en reloj

Consulta de fuentes primarias: 15 de septiembre de 2026. Investigación documental; sin prueba física ni validación de precisión.

## Referencias comerciales

Garmin anunció ArcheryX el 25 de agosto de 2026 para fēnix 9 y fēnix 9 Pro, orientado a arco compuesto: contador, tiempo de ejecución, estabilidad, análisis de suelta y trayectoria del movimiento de muñeca; el análisis ampliado se consulta en ShotView. [Anuncio oficial](https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/).

El reloj se lleva en la muñeca que sostiene el arco; Garmin recomienda un disparo de calibración al cambiar de arco. [Manual oficial](https://www8.garmin.com/manuals/webhelp/GUID-708A8F4D-9A78-49CF-9528-DE109BBCC472/EN-US/GUID-95092193-D88B-41FA-8C68-8D48FD263264.html).

Mantis X8 es el modelo específico de arquería y utiliza su aplicación propia. Su sensor se monta en el arco y se conecta por Bluetooth al teléfono. [Modelos](https://mantisx.com/blogs/news/which-mantisx-product-is-right-for-you), [instalación oficial](https://mantisx.com/blogs/news/getting-started-with-mantisx-sensors-is-easy).

## Proyectos abiertos

| Proyecto | Licencia y capacidades documentadas | Utilidad y límites para este proyecto |
| --- | --- | --- |
| [ArcheryShotCounter](https://github.com/Vemestael/ArcheryShotCounter) | MIT. Aplicación Kotlin para Wear OS 3/API 30 o superior. Detecta picos de aceleración lineal con umbral ajustable y bloqueo de 2 segundos entre tiros. Historial de sesiones y corrección manual. El autor la probó con Galaxy Watch 6 Classic, arco compuesto y brazo del arco. | Base directa para contar tiros desde un reloj Wear OS. El README no documenta sincronización con teléfono ni trazas de estabilidad; habría que comprobar el código y añadir estas funciones. Su afirmación de funcionar con distintos arcos y muñecas no equivale a validación de precisión en todos ellos. |
| [Open-Float-Archery](https://github.com/DevanMetz/Open-Float-Archery) | [MIT](https://github.com/DevanMetz/Open-Float-Archery/blob/main/LICENSE). Sensor externo Seeed XIAO nRF54L15 Sense y firmware Zephyr; transmisión IMU por BLE a aproximadamente 1110 Hz. Panel web local con trazas y puntuación propia de técnica. | Referencia para análisis y visualización. El firmware está destinado a esa placa, por lo que no se instala directamente como aplicación en un reloj. El propio autor lo presenta como experimental. |

OpenFloat documenta registros persistentes de hasta 100 tiros, recuperación al reconectar y confirmación después de guardar en IndexedDB. Su puntuación Float Score 0–100 combina estabilidad, suelta, seguimiento y nivelación; es una métrica propia. Las trazas conectadas conservan unos 3,5 segundos anteriores y una ventana posterior configurable. Estas son referencias útiles para almacenamiento y sincronización tolerantes a desconexiones. [Estado de funcionalidades](https://github.com/DevanMetz/Open-Float-Archery/blob/main/docs/feature-status.md).

## Conclusión técnica e hipótesis a validar

Es viable plantear una aplicación propia que guarde sesiones y eventos en el reloj y los sincronice posteriormente con el teléfono. Para Wear OS, ArcheryShotCounter ofrece el punto de partida más cercano. OpenFloat sirve como referencia de telemetría más completa, aunque requiere adaptar algoritmos y comunicación al dispositivo elegido.

El usuario confirmó **Xiaomi Watch S1 Active**, con móvil Android. La propuesta inicial de Wear OS/Data Layer no aplica a este reloj. Las comprobaciones ADB/MDNS no han mostrado un dispositivo de depuración conectado. Ver [viabilidad específica](s1-active-viabilidad.md): acceso a sensores y ejecución de código propio todavía pendientes de demostrar.

La muñeca y el arco no forman un conjunto rígido: medir movimiento de muñeca no garantiza reconstruir con la misma fidelidad el movimiento del arco. Esta es una limitación física a comprobar con datos, no una equivalencia de precisión demostrada entre productos.

Antes de implementar: confirmar modelo y sistema operativo del reloj, sensores y frecuencia real accesible; registrar acelerómetro y giroscopio con marcas manuales de tiros reales; medir falsos positivos y tiros perdidos; después añadir ventanas antes/después de la suelta y sincronización con identificadores únicos. Cualquier medida de estabilidad debe presentarse inicialmente como movimiento de muñeca, sin prometer localización de impactos ni equivalencia con Mantis o Garmin.
