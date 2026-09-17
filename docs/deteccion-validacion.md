# Detección de tiros y sets: investigación y validación

Fecha: 2026-09-16. Investigación, no certificación de precisión. Estado del código leído al comenzar esta revisión; otras correcciones concurrentes pueden cambiarlo.

## Conclusión

El sistema puede aportar un registro útil con el acelerómetro del reloj, pero todavía no hay evidencia suficiente para prometer detección fiable ni medir la puntería real. La prioridad es conservar señales y etiquetas verificables, unificar el detector de reloj y ordenador, hacer explícitos los sets y distinguir medición de interpretación. Un algoritmo más complejo sin datos etiquetados no resuelve esa carencia.

El manifiesto del proyecto admite `fr165` y `fr165m` (Forerunner 165 y 165 Music), aunque en conversación se dijo «65». Esta revisión se limita al acelerómetro solicitado por el código. No presupone acceso a giroscopio.

## Evidencia primaria y qué aprovechar

| Fuente consultada | Hallazgo y aplicación |
|---|---|
| [Garmin Sensor](https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor.html) y [AccelerometerData](https://developer.garmin.com/connect-iq/api-docs/Toybox/Sensor/AccelerometerData.html) | Los ejes llegan en milig y los lotes dependen del periodo solicitado. Hay timestamps por muestra desde API 5.1.1; usarlos solo tras comprobar compatibilidad, porque el proyecto declara mínimo 3.3.0. La frecuencia solicitada no debe sustituir la inspección de intervalos reales. |
| [NXP AN3461](https://www.nxp.com/docs/en/application-note/AN3461.pdf) | La inclinación por acelerómetro se basa en gravedad; la aceleración dinámica contamina esa estimación. No aporta rumbo absoluto alrededor de la gravedad. Aplicación: separar reposo/apunte de suelta y evitar representar aceleración como impacto. |
| [ArcheryShotCounter, repositorio del autor](https://github.com/Vemestael/ArcheryShotCounter) | MIT, Wear OS, aceleración lineal compensada, umbral configurable, pausa y corrección manual. Describe cooldown de dos segundos. Aprovechar interacción y calibración, no copiar valores: nuestra señal incluye gravedad y el dispositivo es distinto. No presenta un benchmark independiente de precisión/recall. |
| [Open Float, Blueprint del proyecto](https://github.com/DevanMetz/Open-Float-Archery/blob/main/Blueprint.md) | Sensor fijado al arco con acelerómetro y giroscopio, replay por fases y visualización de orientación. Inspiración para revisión temporal y calibración; sus datos y capacidades no equivalen a los de una muñeca con solo acelerómetro. Revisar licencia de cada archivo antes de incorporar código. |
| [Ogasawara et al., Sports Engineering, 2023](https://link.springer.com/article/10.1007/s12283-023-00402-y) | El resumen editorial compara siete métodos y reporta mejora de F-measure del random forest respecto al método previo. Útil para priorizar clasificadores pequeños tras reunir datos. Se consultó el resumen público, no el texto de pago; no se reconstruyen parámetros ni se trasladan resultados a Garmin. El artículo indica que los datos requieren solicitud y aprobación adicional. |
| [Liu et al., preprint 2025](https://arxiv.org/html/2511.14057v1) | Propone fases draw/aim/release, aceleración diferencial suavizada y LSTM. Reporta 96,8% accuracy y 95,9% F1 en su tarea, no en nuestra detección por evento. Las etiquetas combinan anotación manual y revisión de señales. Útil como hipótesis de features; no prueba que nuestro reloj logre esos resultados. Es un preprint, no garantía de revisión por pares. |

Se localizó también [Archery Skill Assessment Using an Acceleration Sensor, 2021](https://doi.org/10.1109/THMS.2020.3046435), pero el editor no entregó contenido legible en esta consulta. No se utiliza como sustento de cifras no verificadas directamente. Se descartó un resultado sobre lanzamiento de peso: detectar una suelta en otro deporte no valida arquería.

## Auditoría del código actual

Fuentes locales: `watchapp/source/ArcheryApp.mc`, `tools/detect_shots.py`, `mobile/index.html`, `captures/aw-session1-shots.json`.

1. **Los dos detectores divergen.** Reloj: media causal de 50 muestras, filtro `preStable`, bloqueo durante ventana posterior. Python: media centrada que utiliza muestras futuras, sin estabilidad previa, refractario independiente. Las métricas y el asentamiento tampoco coinciden. El comentario «mismos parámetros» no garantiza equivalencia; una evaluación Python actual no valida el reloj.
2. **Frecuencia implícita.** Cincuenta muestras solo son 500 ms a 100 Hz; Python presupone 10 ms por muestra. El reloj admite frecuencia inferior. Definir ventanas por tiempo y registrar frecuencia efectiva y discontinuidades.
3. **Timestamps aproximados.** `onData` retrocede desde el momento del callback suponiendo espaciado perfecto. Retrasos de entrega se confunden con tiempo del tiro. Guardar procedencia del tiempo y usar timestamps nativos si están disponibles; verificar su base temporal antes de mezclarlos con `System.getTimer()`.
4. **Umbral sin generalización demostrada.** `THRESH=3200 mG` y `PRE_STABLE=450 mG` son heurísticas. El comentario que asegura excluir sacudidas/recogida no está respaldado por un conjunto de validación localizado. Cambian señal, brazo, arco, técnica y ajuste de correa.
5. **Asentamiento prematuro.** Se acepta la primera muestra con desviación absoluta menor de 300 mG después de 50 ms. Una oscilación cruza el umbral antes de estabilizarse. Exigir permanencia y dispersión bajas durante un intervalo; reportar desconocido si termina la captura sin recuperación.
6. **Puntería no medida.** `100 - pstdev(gBuf)/10` es un índice arbitrario de variación de magnitud. Una rotación lenta cambia los ejes manteniendo magnitud casi constante. No es puntuación de diana, ni precisión, ni calidad técnica. No debe generar consejos como «revisa anclaje y tensión» sin evidencia causal.
7. **Traza no espacial.** `tx/ty` son aceleraciones centradas en su media. No son trayectoria de mira, centímetros o MOA. El centrado de cada tiro impide comparar su dirección absoluta con otros. El autoescalado y descarte de puntos mayores de 2000 mG pueden ocultar diferencias o picos: mostrar escala, filtros y datos excluidos.
8. **Resumen incompleto.** `decimate` recorta últimos puntos; no reduce uniformemente toda la ventana. Con 20 Hz, 32 puntos de traza son aproximadamente 1,6 s, mientras otras métricas usan más historia. Documentar ventanas y versionarlas.
9. **Sets reconstruidos por hueco.** `sets()` separa flechas si pasan más de 60000 ms. No detecta cierre hasta recibir otra flecha; pausa larga divide una tanda, pausa corta entre tandas las fusiona. Borrar una flecha intermedia puede modificar límites al recalcular.
10. **Corrección manual incompleta en reloj.** `markShot()` agrega una lap FIT; no genera la misma entidad de flecha que la detección. No sustituye un flujo claro de añadir/corregir una flecha.
11. **Captura histórica no es benchmark.** El JSON visible tiene 3000 muestras, 30,09 s y umbral 1500 mG, diferente al actual. No contiene por sí mismo verdad de terreno que permita estimar precisión o recall. No usar «detectó un pico» como «detectó un tiro real».

## Métricas físicamente defendibles

| Mostrar | Condición y límite |
|---|---|
| Flechas detectadas y corregidas | Separar origen automático/manual; medir errores en campo. |
| Intervalo entre tiros | Con timestamps monotónicos y calidad temporal conocida. |
| Variación de aceleración pre-suelta, en mG | Ventana fija, misma frecuencia/filtro y exclusión del impulso; comparar configuraciones equivalentes. |
| Pico de aceleración registrado | Añadir saturación y frecuencia; no llamarlo fuerza, potencia ni velocidad de flecha. |
| Inclinación relativa del reloj | Solo en fase cuasiestática, con calibración y ejes definidos; no equivale a inclinación exacta del arco. |
| Tiempo de recuperación | Definición reproducible de estabilidad sostenida, confianza e incompletitud explícitas. |
| Tiempo de apunte estimado | Solo tras validar límites de fase frente a vídeo; una ventana fija de tres segundos no lo mide. |
| Pulso contextual | Frescura y ausencia explícitas; BPM aislados no miden ansiedad, estrés ni HRV. |
| Consistencia respecto a sesiones propias | Mostrar tamaño de muestra y mismo perfil de equipo; un índice versionado puede ser útil sin presentarlo como puntuación deportiva. |

No ofrecer con este hardware/código: punto de impacto, agrupación real, trayectoria absoluta de mira, velocidad de flecha, puntuación de diana predicha, diagnóstico técnico o estrés inferido. Una futura correlación con puntuaciones introducidas por el usuario exige validación aparte. El principio físico de la limitación angular procede de NXP; las limitaciones concretas de las métricas actuales son deducciones del código leído.

## Máquina de estados propuesta

Diseño propio a validar; ninguna duración o cota propuesta aquí está calibrada.

`REPOSO → PREPARACIÓN → APUNTE → CANDIDATO_SUELTA → RECUPERACIÓN → REPOSO`

- **REPOSO:** conservar buffer circular; reconocer actividad cotidiana sin contarla. La orientación estable no demuestra que se esté apuntando.
- **PREPARACIÓN:** cambio compatible con elevar/tensar, considerando brazo configurado. Si vuelve al reposo, no contar flecha.
- **APUNTE:** dispersión vectorial, orientación aproximada y duración compatibles. Guardar inicio estimado y calidad; no exigir inmovilidad perfecta que excluya principiantes.
- **CANDIDATO_SUELTA:** impulso, pendiente, anchura, energía local y secuencia previa. Confirmar con un pequeño tramo posterior; distinguir instante estimado y momento de notificación.
- **RECUPERACIÓN:** agrupar picos del mismo evento, esperar estabilidad sostenida o marcar captura incompleta. Volver a armar después de recuperación y una nueva preparación, además del mínimo refractario.
- **ABANDONO:** desde preparación/apunte al bajar el arco sin suelta. Conservarlo como entrenamiento opcional, nunca como flecha automática.
- **PAUSA/DATOS_INSUFICIENTES:** no emitir métricas inventadas si faltan muestras o hay saturación; permitir reanudar y corrección.

Comenzar con reglas legibles y características de bajo coste calculadas incrementalmente. Entrenar después un árbol/forest pequeño como comparación, primero offline. LSTM en reloj no es requisito inicial. La confianza debe derivarse de validación; no convertir arbitrariamente distancia al umbral en «98% de certeza».

### Fin de set

Mantener `setId` persistente por flecha y eventos `setStarted/setClosed`, con razón `manual/targetCount/inactivity` y estado `provisional/confirmed`. El modo puede ser 3, 6, personalizado o libre; el usuario lo configura, no se presupone una regla deportiva universal.

1. Cierre explícito mediante botón: referencia fiable de intención y disponible sin móvil.
2. Alcanzar objetivo: indicar «tanda completa» y cerrar según configuración, permitiendo corregir un falso positivo sin perder contexto.
3. Inactividad y cambio de actividad: sugerencia de cierre, reversible; un reloj inmóvil no puede saber si habrá otra flecha.
4. Siguiente preparación/tiro: resolver sugerencia y crear set cuando corresponda.
5. Correcciones: borrar no renumera identidades ni fusiona sets. Ofrecer mover flecha, dividir y unir sets como operaciones explícitas.

Mostrar «pausa sugerida» cuando sea una inferencia; conservar diferencia entre tiempo de la última flecha y momento de cierre. El móvil debe poder mostrar cierre aunque no llegue una flecha nueva.

## Datos y protocolo de validación

### Registrar antes de optimizar umbrales

- Señal cruda `t,x,y,z`, unidad, frecuencia efectiva, pérdidas/saturación, dispositivo/firmware y versión de algoritmo.
- Perfil: tipo de arco, brazo del reloj, diestro/zurdo, orientación/ajuste y cambios de configuración.
- Etiquetas independientes: inicio de preparación, apunte, suelta, abandono, set y actividades negativas. Sincronizar vídeo con un evento visible e identificar incertidumbre de anotación; botones solos incluyen retraso humano.
- Conservar predicción original y corrección como eventos separados; no entrenar contra la propia predicción como si fuera verdad.
- Registrar sesiones completas: caminar, sacar flechas, golpear accidentalmente, beber, manipular móvil, ajustar arco, pausas, falso arranque y recogida. Los minutos sin tiro importan tanto como los tiros.

### Separación de datos

Para uso personal, calibrar en unas sesiones y evaluar en días distintos sin retocar umbrales sobre el test. Para generalizar, separar también personas y configuraciones. No repartir ventanas solapadas de un mismo tiro entre entrenamiento y test. Congelar versión y parámetros antes del ensayo final. Una primera tanda sirve para depurar; no basta para declarar producción.

### Métricas de aceptación

- Emparejar eventos uno a uno dentro de una tolerancia temporal declarada, acorde al error de sincronización. Detecciones extra son falsos positivos, aunque caigan cerca de un tiro ya emparejado.
- Precisión = TP/(TP+FP); recall = TP/(TP+FN); F1 y falsos positivos por hora sin tiro. Incluir denominadores e intervalos de confianza.
- Error absoluto de tiempo de suelta: mediana y percentil 95; latencia de notificación por separado.
- Error de conteo por set, porcentaje de sets con conteo exacto y errores de división/fusión. Evaluar también tandas incompletas y abandonos.
- Coste de uso: correcciones por sesión, latencia móvil, batería/hora, pérdidas tras reconexión/reinicio y crecimiento de almacenamiento.
- Desglosar por brazo, arco, usuario y sesión; una media global puede ocultar fallos graves en una configuración.

Objetivos iniciales de producto, no resultados obtenidos: apuntar a precisión y recall de al menos 98% en el perfil soportado y menos de un falso positivo por hora de actividad negativa. Revisarlos con el usuario y publicar incertidumbre; no afirmar haberlos alcanzado con una muestra pequeña. La tolerancia temporal, número de sesiones y tamaño del test se fijan antes de medir, según el uso y la incertidumbre deseada.

### Pruebas de software que sí ayudan

Replay determinista de la misma señal en detector de referencia y reloj: eventos y ventanas deben coincidir dentro de redondeo. Incluir señal sin tiros, dos impulsos de una flecha, abandonos, tasas distintas, lotes retrasados, reinicio a mitad de captura y saturación. Una señal sintética prueba el contrato del software, no la calidad deportiva.

## Prioridad de implementación

1. **Ahora:** corregir etiquetas engañosas, timestamps/ventanas, asentamiento sostenido, equivalencia reloj/Python, identidad estable de sets y corrección manual. Guardar versión del algoritmo en cada tiro.
2. **Próxima sesión real:** capturar datos etiquetados y negativos, medir detector actual sin modificar umbrales sobre el mismo test.
3. **Después:** comparar máquina de estados con detector simple; elegir por precisión, recall, consumo y correcciones necesarias, no por complejidad.
4. **Experiencia de uso:** reloj con estado y flechas de la tanda, confirmación discreta después del tiro, corrección rápida; móvil con replay alineado y escala comparable, evolución personal y una observación descriptiva breve.
5. **Más adelante:** similitud de trazas, perfiles y modelos personales cuando haya suficientes datos. No bloquear una app útil esperando ML, ni confundir una UI pulida con un detector validado.

## Estado de esta investigación

Lectura de fuentes oficiales, repositorios y publicaciones; auditoría estática del código indicado. No se hicieron tiros reales, no se midió precisión/recall y no se calibraron parámetros. Este documento no modifica código ni declara lista la aplicación para producción.


## Actualización tras la revisión técnica

La auditoría anterior describe el punto de partida. En esta entrega se corrigieron la identidad de tandas al borrar, la navegación al recibir tiros y la etiqueta de estabilidad, y se reforzó la persistencia. No se implementaron todavía cierre explícito ni nuevo detector calibrado. Véase [estado de producción](estado-produccion.md) para distinguir cambios terminados de propuestas.
