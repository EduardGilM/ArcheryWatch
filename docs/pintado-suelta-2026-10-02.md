# Pintado de la trayectoria: suelta y follow-through

El usuario confirmó que las ocho flechas de la última sesión son reales y pidió cambiar **únicamente el pintado de la trayectoria y su reproducción**. No se modifica la detección, el cálculo de métricas, los umbrales, la calibración ni el gráfico de señal.

El pintado inicial recortaba la trayectoria en el instante registrado. Las versiones 4.11/4.12 pasaron a marcar el máximo de la señal guardada y mostrar el tramo posterior, pero ese máximo desplazaba la marca hacia coordenadas del impulso. **Estado actual, 4.13:** la marca usa el último apunte previo al instante ya registrado; el movimiento posterior se pinta en naranja. La vista fija y la reproducción comparten ese punto y el cambio de color.

No se cambian tiempos ni muestras originales. El dibujo mantiene el último apunte guardado hasta el instante de referencia existente, sin interpolarlo con las coordenadas del golpe. No se reconstruyen las muestras omitidas en el envío.

## Verificación

- Dos regresiones con las capturas reales fallaron antes del cambio: posición de la marca y ausencia del follow-through en la reproducción.
- Pasan 22 pruebas móviles y el modelo de sesiones. Se comprueba también que el cambio de color coincide exactamente con el punto del pico y que el pintado conserva los datos.
- Edge verifica las ocho reproducciones, selección de flecha, controles, ausencia de errores JS y ausencia de desbordamiento. Capturas en `output/playwright/field68/`.
- Hashes de `ArcheryApp.mc`, `Training.mc`, `session-model.js` y `training.js` iguales a los anteriores a este cambio. La lógica de `drawTrace` sigue igual.
- APK **4.11 (68)** compilado y firmado: `android/build/review68/ArcheryWatch.apk`. SHA256: `7F1C48633F1E93108CA29214134C7566496C6F314F8F03592C183F685795B8C7`.

Instalado en el Nothing A069 tras reconectar el móvil, con `adb install -r`. Verificados versión 4.11 (68) y SHA256 del APK instalado idéntico al compilado. Se conservan las 41 sesiones y los datos de las últimas ocho flechas; reproducción comprobada en el teléfono. Retirada la compilación temporal de diagnóstico: la entrega no permite `run-as` y no expone el WebView de depuración. Receptor en primer plano activo. No se ha modificado el reloj.

Evidencias privadas: `captures/paint-release-20261002/`. La fixture de regresión conserva tiempos relativos y trazas, sin identificador de reloj ni datos de pulso.

## Claridad del instante — 4.12 (69)

El usuario indicó que seguía sin distinguir el punto de salida. El rojo se reserva ahora para un único punto con anillo y rótulo «Suelta estimada»; la trayectoria anterior queda blanca/gris y la posterior naranja. La marca se dibuja encima de la cruz central. La reproducción pausa 700 ms en ese punto antes de continuar el follow-through, en vez de mostrar el efecto al acabar toda la trayectoria.

Si el pico cae entre dos muestras de trayectoria, se interpola un punto solo en la copia usada para pintar y reproducir. No se modifican muestras guardadas, proyección, selección del pico, reloj, detección, calibración, métricas ni gráfico de señal. **El pico del movimiento de muñeca sigue siendo una estimación, no una medida directa del instante físico en que la flecha abandona el arco.** La interpolación visual no añade precisión al sensor.

Verificación: 24 pruebas móviles y modelo de sesiones correctos. Playwright/Edge comprueba las ocho flechas reales, visibilidad del punto mediante lectura de píxel, pausa antes del tramo naranja, coincidencia de la marca fija y animada, final de reproducción, conservación de datos, botón real y ausencia de errores JS/desbordamiento. Capturas en `output/playwright/field69/`. Hashes sin cambios de detector, entrenamiento y modelo; `proj`, `releaseTime` y `drawTrace` idénticos a 4.11.

Instalada **4.12 (69)** en el Nothing A069 con `adb install -r`, conservando el directorio de datos. SHA256 instalado idéntico al firmado: `9D29A30016DE6BAAAA3BD4D4D29DFB7F86C61A09A788929919FE9276FA65860D`. Receptor en primer plano activo; sin errores AndroidRuntime del proceso nuevo, sin depuración de WebView y `run-as` deshabilitado. Evidencias privadas de esta revisión en `captures/paint-focus-20261002/`.

## Posición de la marca corregida — 4.13 (70)

El usuario confirmó que el fallo es exclusivamente de visualización y que el resto funciona bien. Dos regresiones reprodujeron el problema antes de corregirlo: en la primera flecha, la marca aparecía en `(160,16)` mientras el último apunte estaba en `(156,149)`; entre un apunte `(10,20)` a −50 ms y un impulso `(900,800)` a +50 ms, se interpolaba artificialmente `(455,410)` en el instante cero.

Diagnóstico con las ocho capturas: se elegían máximos entre +10 y +235 ms y se mezclaban coordenadas previas con las del impulso. Adelantar solo el tiempo seguía dejando desplazamientos de 127–208 píxeles en la escala de prueba. El problema no exige cambiar la detección: su instante cero ya está guardado. La corrección retiene en el dibujo el último punto anterior a cero y lo usa como fin de apunte y marca de suelta, sin forzarlo al centro. Los segmentos posteriores, incluidos los muestreados exactamente en cero, se pintan en naranja. La reproducción pausa en ese mismo punto. Las coordenadas del golpe ya no determinan la marca roja.

25 pruebas móviles + modelo correctos, incluidas las dos regresiones antes fallidas. Playwright comprueba en las ocho flechas la posición contra el último apunte original, píxel rojo, pausa antes del tramo naranja, final de reproducción, botón real y ausencia de errores JS/desbordamiento. Datos originales intactos. Capturas y resultado: `output/playwright/field70/`; diagnóstico privado: `captures/paint-onset-20261002/`. Hashes idénticos de detector, entrenamiento y modelo; `proj`, métricas, calibración y `drawTrace` sin cambios.

Instalada **4.13 (70)** en el Nothing A069 con `adb install -r`, manteniendo el directorio de datos. SHA256 instalado igual al firmado: `677F35935F4DE0F8E28EE95E313EDB91727BFD9FC9521D90A964B9D489FB74AB`. Receptor en primer plano activo, sin errores AndroidRuntime nuevos, sin depuración de WebView y `run-as` deshabilitado. Reloj sin modificar. La marca representa el apunte registrado previo al impulso; sigue sin medir el impacto de la flecha ni certificar su instante físico exacto de salida.
