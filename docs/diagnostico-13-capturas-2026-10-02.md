# Diagnóstico de las 13 capturas — 02/10/2026

Se recuperaron las sesiones del móvil y la señal completa del FIT de hoy antes de modificar el detector. La última sesión contiene 13 candidatos de calibración y cero flechas de entrenamiento. Sus puntuaciones son `null` por diseño: no significa que el transporte haya rechazado los datos. Se conservó el historial.

## Datos recuperados

| Candidato | Tiempo guardado (s) | Pico guardado (mG) |
|---|---:|---:|
| 1 | 73,792 | 161 |
| 2 | 87,936 | 155 |
| 3 | 90,144 | 629 |
| 4 | 92,224 | 156 |
| 5 | 98,688 | 2082 |
| 6 | 100,320 | 155 |
| 7 | 101,824 | 193 |
| 8 | 126,080 | 166 |
| 9 | 127,584 | 312 |
| 10 | 129,280 | 224 |
| 11 | 134,816 | 5458 |
| 12 | 136,384 | 159 |
| 13 | 137,920 | 207 |

El usuario confirma tres tiros reales y diez falsos positivos, pero no puede identificar con certeza qué registros corresponden a ellos. Considera el 5 el candidato más probable, también dudoso. Informó de IQ! **durante la detección**.

## Fallos reproducidos y cambios

- **Reloj absoluto convertido a Float:** a unos 321 millones de ms de encendido, el redondeo tiene pasos de 32 ms. Los tiempos almacenados y las trazas de 160 ms entre puntos concuerdan con este problema. El callback conserva ahora los tiempos absolutos como enteros y convierte a Float después de restar el origen de sesión. [Garmin documenta Float de 32 bits](https://developer.garmin.com/connect-iq/api-docs/Toybox/Lang/Float.html).
- **Apertura antigua:** el detector aplicaba la caducidad de 30 segundos al primer movimiento, aunque existiera una apertura posterior. Se comprueba ahora el episodio reciente.
- **La suelta borraba su propio contexto:** una primera muestra moderada podía borrar la calma y hacer rechazar el pico posterior. Ahora se prepara el candidato con un umbral bajo y se valida el pico del pulso completo. Un candidato débil se descarta pronto y no consume el periodo refractario de una flecha aceptada.
- **Duración rígida y sensibilidad:** el antiguo límite de 160 ms rechazaba pulsos de esta grabación de 161–222 ms. Se admite hasta 250 ms, con recuperación y nivel relativo al pico. La referencia guarda postura y varianza del apunte; el umbral es el 35 % del pico, mínimo 90 mG. Se conservan las referencias antiguas de tres componentes.
- **Puntuación anulada por la apertura:** se incluía el movimiento de abrir el arco al puntuar el apunte. Se utiliza ahora la ventana previa de 80–900 ms.
- **Presentación:** el móvil explica que un candidato está sin puntuar y muestra su pico. La calibración sigue conservando movimientos para permitir elegir una suelta débil; esos candidatos no cuentan como flechas de entrenamiento.

`node tools/tests/watch-regression.cjs` pasó de fallar en los casos de reloj, apertura, precursor y puntuación a pasar 35 regresiones. La reproducción de las 15.700 muestras, con cada una de tres referencias, acepta impulsos alrededor de 60,047 / 97,846 / 134,005 s, con picos de aproximadamente 2742 / 4821 / 6780 mG. Son impulsos compatibles con sueltas, **no etiquetas de verdad de terreno confirmadas**. No permiten afirmar precisión perfecta.

También pasan 17 pruebas móviles, el modelo de sesiones y el flujo en Edge de calibración, postura con varianza y eliminación de presets. Compilados FR165, FR165m y tests nativos. El ejecutor del simulador quedó bloqueado, incluso fuera del sandbox; se detuvo. No se atribuye a esas compilaciones una ejecución de tests en la VM Garmin.

## IQ! pendiente

`GARMIN/Apps/LOGS` contiene únicamente los errores antiguos del 15 y 17 de septiembre. Los registros de Debug tampoco contienen un fallo de hoy. No se ha reproducido ni demostrado la causa del IQ! reciente.

Se amplió el bloque protegido del callback para cubrir lectura de sensores, timestamps e intervalos RR; los lotes con ejes incompletos se descartan y las excepciones ordinarias conservan su mensaje. Al arrancar, el reloj envía al móvil su versión y la última marca de operación persistida antes de un cierre. Esto ayuda a localizar otro fallo, pero no demuestra que IQ! esté resuelto. Hace falta ejecutar el programa desconectado del USB y recuperar ese diagnóstico si vuelve a ocurrir.

## Entrega

- Nothing A069: APK 66 / 4.9 instalado con `adb install -r`; diagnóstico temporal desactivado y servicio receptor en primer plano. SHA256 instalado igual al compilado: `5CE28ABC1937262C89526708D999C948D8D9FB0FEEA4D5C2ECB250C17CDD161D`.
- FR165: `GARMIN/Apps/AW66.prg`, 156908 bytes, leído de vuelta y verificado: `481A2AAD66A2C594B2CE510E9985E5E1C38CC17F814C01B139D7140ABC0C5B29`.
- Evidencias privadas: `captures/diagnosis-20261002-112950/`. La fixture de regresión conserva solamente tiempos relativos y aceleración, sin identificadores del dispositivo, pulso ni etiquetas personales.

Expulsar y desconectar el Garmin para importar el programa, abrir ArcheryWatch y calibrar con una captura nueva. Las 13 capturas anteriores conservan el redondeo de la versión antigua.
