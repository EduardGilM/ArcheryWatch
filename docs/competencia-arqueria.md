# Competencia y dirección de producto de ArcheryWatch

Investigación: 16 de septiembre de 2026. Fuentes primarias consultadas ese día. Comparación con `mobile/index.html`, `watchapp/source/ArcheryApp.mc` y `watchapp/manifest.xml` tal como estaban al iniciar esta revisión; otros trabajos pueden modificarlos después.

## Conclusión

La oportunidad es un entrenamiento que se registre solo, permita corregir cualquier error y explique qué cambió entre tiros sin exigir mirar el teléfono constantemente. La ventaja no vendrá de acumular gráficas, sino de que el contador y las tandas sean fiables, las comparaciones tengan sentido y nunca desaparezcan datos.

El usuario quiere conservar el estilo actual y tomar inspiración de la esfera de K Archery, sin copiarla. Propongo jerarquía de un vistazo en el reloj; detalle progresivo en el móvil; y métricas honestas sobre el movimiento que realmente medimos.

**No se ha demostrado la precisión del detector de ArcheryWatch con una campaña de tiros etiquetados. Este documento no certifica preparación para producción.** Tampoco se han instalado ni probado físicamente las apps competidoras: sus funciones se contrastan con documentación, código público y la ficha visual de K Archery.

## 1. Competencia: qué está comprobado

### K Archery: la referencia exacta del usuario

La ficha corresponde a **K Archery – shoot detection and analysis**, de Jean-Noel_K. Se abrió en navegador, se seleccionó App Info y se expandió More: la descripción dinámica es más reciente que el texto del buscador. Versión visible 4.6, publicada el 15/09/2026. Ofrece detección mediante acelerómetro, flechas y tandas automáticas, pulso, GPS opcional, curvas por tiro en K Archery Connect y exportación de un minuto de datos crudos para diagnóstico. La ficha anuncia desbloqueo del contador por 15 € y servicio Connect por suscripción. Son declaraciones del desarrollador; su afirmación de no confundir movimientos ordinarios no viene acompañada de sensibilidad/especificidad publicadas. [Ficha oficial](https://apps.garmin.com/en-US/apps/f3b2b9de-0a33-47d2-bfda-b6df45efc946).

Observación visual de la captura de la esfera: fondo negro, contadores superiores, franja central con diana multicolor y total, y pulso/tiempo debajo. Su fuerza es reunir el estado de la tanda en una sola mirada. No conviene reproducir su distribución ni su distintiva diana central. Una reseña visible de enero de 2026 menciona tiros omitidos y tandas cerradas antes de tiempo: es un testimonio individual, no una medición de fiabilidad. La lógica exacta de cierre no es pública en la ficha.

### Garmin ArcheryX + ShotView

Garmin anuncia el 25/08/2026 una actividad para arco compuesto, incluida en fēnix 9/9 Pro. Describe análisis previo a la suelta, tiempo desde apertura hasta suelta, contador, estabilidad en minutos de arco, traza animada, biometría y evolución en ShotView. La propuesta une resumen inmediato y análisis posterior. Eso no demuestra que nuestras señales permitan replicar sus minutos de arco ni su segmentación. [Anuncio oficial](https://www.garmin.com/en-US/newsroom/press-release/outdoor/track-and-improve-archery-performance-with-the-new-archeryx-smartwatch-activity-from-garmin/).

El manual indica llevarlo en la muñeca del arco, calibrar al cambiar de arco, consultar más pantallas tras cada tiro y borrar el último tiro desde el reloj. Lección aplicable: calibración y corrección son funciones principales, no herramientas escondidas. [Manual oficial](https://www8.garmin.com/manuals/webhelp/GUID-708A8F4D-9A78-49CF-9528-DE109BBCC472/EN-US/GUID-95092193-D88B-41FA-8C68-8D48FD263264.html).

### Mantis X8

El sensor va fijado al arco y se comunica por BLE. La app describe fases con colores, comparación entre tiros, estabilidad 0–100, inclinación, tiempos e historial. Lo útil es la lectura por fases y la comparación de consistencia. Su medición sobre el arco no equivale a la aceleración de la muñeca. [Funcionamiento oficial](https://mantisarchery.com/pages/how-it-works).

Mantis explica por separado preparación, aproximación, mantenimiento, suelta y movimiento posterior; incluso marca salida de flecha. Podemos adoptar la idea de una línea temporal legible, pero no etiquetar esos eventos físicos en nuestra app hasta detectarlos y validarlos. [Guía del fabricante](https://mantisx.com/pages/mantisx-for-archery).

### ArcherySuccess

Combina anotación/posición de impactos, análisis de grupos, identificación de flechas, material, notas, objetivos de volumen y progreso semanal. La aportación es relacionar resultados con contexto: saber qué arco y flechas se usaron, no comparar sesiones incompatibles. [Producto oficial](https://archerysuccess.com/).

Su ayuda documenta uso sin conexión, copia/restauración, reanudación de rondas y envío de informes de entrenamiento. Lección: la continuidad y la portabilidad de los datos también motivan a usar una app. [Ayuda oficial](https://archerysuccess.com/how-to-faq/).

### Artemis

La cronología del fabricante documenta comparación estadística de configuraciones, herramientas para entrenadores, registro de inclinación mediante BOWdometer, temporizador y métricas de habilidad basadas en resultados. Hay valor en comparar equipamiento y sesiones con suficiente muestra. Esta fuente es una cronología histórica: no verifica por sí sola disponibilidad actual en cada tarifa. [Historia oficial de funciones](https://artemis.vapeldoorn.net/artemis_10years_timeline.html).

### Referencias open source

| Proyecto | Evidencia documentada | Qué aprovechar conceptualmente | Límite |
| --- | --- | --- | --- |
| [ArcheryShotCounter](https://github.com/Vemestael/ArcheryShotCounter) | MIT, Wear OS, aceleración lineal, umbral configurable, periodo de 2 s, vibración, corrección +/− e historial; probado según autor en Galaxy Watch 6 Classic | Calibración sencilla, corrección inmediata, feedback discreto | No es un detector validado para nuestros Garmin; no transportar umbrales entre sensores |
| [OpenFloat Archery](https://github.com/DevanMetz/Open-Float-Archery) | MIT, sensor IMU externo, orientación mediante cuaterniones, revisión por fases, reproducción, comparación, almacenamiento local y backup; anuncia flujo ~1110 Hz | Revisión sincronizada, protocolo recuperable, datos locales | Hardware y frecuencia muy distintos; su Float Score tampoco es puntuación de diana |
| [MyTargets](https://github.com/DreierF/MyTargets) | Código Android/Kotlin, módulos móvil y wearable, GPLv2; repositorio archivado desde 2020 | Modelado y organización del entrenamiento como referencia | Dependencias antiguas; revisar licencia de archivos concretos antes de incorporar código |

## 2. Hechos, inferencias y límites

| Afirmación | Estado | Consecuencia |
| --- | --- | --- |
| K Archery anuncia flechas y tandas automáticas | Verificada en ficha del autor | Comparar experiencia; no asumir su fiabilidad ni su algoritmo |
| La referencia tiene una esfera de vistazo con total y tanda | Observada en captura oficial | Inspirarse en claridad, no copiar arte/distribución |
| ArcheryX pide calibración y permite borrar el último tiro | Verificada en manual | Incluir ambas en el flujo del reloj |
| Mantis mide desde el arco y ArcheryWatch desde la muñeca | Documentación del fabricante y planteamiento/código local | No equiparar precisión ni puntuaciones |
| El proyecto local recoge acelerómetro y FC | Verificado en fuente Monkey C | Aprovechar esas señales; no asumir giroscopio activo |
| La traza local representa impactos reales en diana | No demostrado; no se deriva de la implementación | Etiquetar movimiento relativo, nunca impacto estimado |
| El detector local detectará correctamente cualquier arco | No demostrado | Validar perfiles, muñeca, ritmos y errores antes de prometerlo |
| Un descanso de 60 s implica nueva tanda | Heurística actual, no hecho deportivo | Hacer corregibles y persistentes los límites |
| Más información significa más números visibles | Hipótesis de producto que desaconsejamos | Dar más profundidad al abrir detalle, no saturar el directo |

## 3. Diferencias concretas con nuestra implementación

La plataforma configurada es `fr165` y `fr165m` (Forerunner 165/165 Music), aunque en la conversación se dijo “65”. Confirmar el dispositivo físico durante las pruebas; la configuración por sí sola no identifica el conectado.

1. **Tandas reconstruidas por tiempo.** `sets()` separa únicamente cuando hay más de 60 s entre flechas. No hay un evento explícito de cierre en esa función. Si se borran flechas, los saltos temporales pueden cambiar la agrupación. Conviene guardar identidad/límites de tanda y migrar las anteriores conservando el agrupado existente.
2. **Detección con umbral fijo.** `THRESH=3200 mg`, estabilidad previa, refractario de 1,5 s y ventana posterior de 2 s. Los valores son parámetros locales, no resultados de validación multiarco. Cambiar umbrales a ciegas puede aumentar falsos positivos.
3. **Ventanas dependientes de frecuencia.** El código usa 50 muestras para gravedad y 42 para estabilidad; duran distinto si cambia el muestreo. Evaluar ventanas por tiempo y registrar la frecuencia efectiva.
4. **“Puntería” es una heurística de estabilidad.** `100 - pstdev(gBuf)/10`, limitado al rango, no mide el impacto ni la dirección de apuntado. Usar “Estabilidad” y describir su alcance brevemente; versionar el cálculo antes de cambiarlo para no falsear el progreso histórico.
5. **Plano de aceleración, no mira calibrada.** Se centran ejes x/y del acelerómetro y se dibujan sobre anillos. La escala automática por tiro puede hacer que una traza mayor parezca igual de estable. Ofrecer escala común para comparar; identificarla como movimiento relativo y conservar unidades cuando proceda.
6. **Asentamiento frágil.** Se toma la primera muestra bajo umbral después de 50 ms. Un cruce aislado no demuestra estabilidad sostenida. Validar ventana de permanencia, y mostrar “sin dato” cuando la señal no permita medirlo.
7. **Botón del reloj.** `markShot()` registra una vuelta FIT; no incrementa ni corrige directamente una flecha detectada. Aclarar su función y disponer de corrección real sin inventar una traza para un tiro manual.

Son observaciones estáticas del código, no fallos reproducidos en esta investigación. Los ensayos de ejecución corresponden al trabajo de validación del proyecto.

## 4. Propuesta de experiencia propia

### Reloj: entrenar sin sacar el móvil

- Fondo oscuro y un único acento naranja, consistente con el móvil.
- Centro: `3 / 6` grande; debajo `SET 4`. En modo libre, `3` y `FLECHAS EN SET`.
- Arco fino periférico representa avance de la tanda, sin reproducir la diana multicolor de K Archery.
- Arriba: estado inequívoco `LISTO`, `GRABANDO`, `DESCANSO` o `PAUSA`.
- Abajo: total de sesión y tiempo. Pulso y última estabilidad en pantalla secundaria, sin robar jerarquía al contador.
- Vibración breve tras confirmar un tiro; patrón distinto al cerrar tanda; posibilidad de desactivarlas. Evitar avisos mientras se apunta.
- Acción rápida para cerrar tanda; corrección de último tiro accesible; pausa/reanudar separadas de finalizar.

El arco periférico es avance, no una nota de calidad. Los colores nunca deben ser la única señal de estado. La interfaz debe poder manejarse con botones físicos y texto legible al aire libre.

### Móvil: una respuesta útil por pantalla

- **Tiro:** traza grande con antes/suelta/después, reproducción y cursor temporal. Resumen con estabilidad, ritmo o duración fiable y comparación con la mediana de la tanda. Detalle ampliable para pico, señal y pulso.
- **Inicio / casita:** últimas semanas, volumen, consistencia y última sesión. Una frase objetiva como “Menor variación entre tiros esta semana” solo con muestra comparable suficiente. Nada de recomendaciones técnicas concluyentes desde una sola señal.
- **Set:** pequeñas marcas por flecha y comparador de dos trazas a escala común. Mostrar un valor central y dispersión; no diez gráficas simultáneas. Cerrar, reabrir y corregir límites sin perder tiros.
- **Sesión / historial:** lista clara, resumen y acceso al detalle. Mantener inequívoca la separación histórico/directo. Volver del histórico recupera el directo real o su vacío.

Que sea fluida implica conservar selección al llegar datos, no desplazar al usuario mientras analiza otra flecha, detener animaciones invisibles, limitar redibujado a la vista activa y hacer inmediata la interacción local aunque el reloj esté desconectado. No requiere añadir animaciones continuas.

## 5. Detección y cierre: propuesta para validar

### Detección de tiros

Primero obtener señales etiquetadas: tiros reales, abrir y bajar sin disparar, caminar, recoger flechas, mover material y ajustar correa. Separar perfiles por arco, muñeca y colocación. Registrar tiros manuales como corrección y señal de entrenamiento del detector, sin fabricar métricas.

Una evolución razonable es una máquina de estados: reposo → preparación/estabilidad → candidato de suelta → confirmación → recuperación. El impulso debe interpretarse junto con el contexto temporal, no convertirse automáticamente en tiro por ser grande. Los estados de preparación/apuntado solo se deben mostrar al usuario cuando se validen; inicialmente pueden servir de señales internas.

Calibración breve con tiros y movimientos negativos; guardar un perfil con versión, dispositivo y frecuencia. Calcular precisión (qué proporción de detecciones eran tiros), sensibilidad (qué proporción de tiros se detectó), duplicados y retraso por perfil. Separar datos usados para ajustar de sesiones reservadas para verificar. No basta con que la cuenta final coincida: un falso positivo y un tiro perdido pueden cancelarse.

### Fin de tanda

Tres modos posibles: número previsto (3/6/personalizado), libre con cierre manual, y sugerencia automática. El número previsto aporta una señal fuerte, pero debe poder corregirse si hubo una falsa detección. Un largo silencio puede indicar descanso, una interrupción o una apertura abortada: por sí solo no debe reescribir límites anteriores.

Guardar eventos explícitos de cierre y motivo. La sugerencia por inactividad se puede aceptar o deshacer, con histéresis para no alternar entre estados continuamente. Un periodo de recogida reduce falsos positivos; debe poder terminarse manualmente porque no todo descanso tiene la misma duración. Persistir la tanda antes de cambiar de pantalla o perder conexión.

## 6. Priorización

| Prioridad | Mejora | Criterio para darla por terminada |
| --- | --- | --- |
| P0 | Preservar datos, deduplicar y confirmar entrega | Reconectar/reiniciar reloj y móvil sin perder ni duplicar eventos; borrados no resucitan |
| P0 | Límites de tanda persistentes y corregibles | Borrar una flecha no cambia las otras tandas; cerrar/reabrir funciona offline |
| P0 | Métricas y trazas honestas | Sin llamar impacto/puntería a aceleración; unidades y “sin dato” coherentes |
| P0 | Prueba física etiquetada | Publicar resultados por perfil, no solo pruebas sintéticas |
| P1 | Esfera de avance y corrección rápida | Legible al aire libre y operable con botones; estado claro sin móvil |
| P1 | Perfiles y calibración | Recuperan configuración y reducen errores en sesiones reservadas de validación |
| P1 | Comparador a escala común y reproducción | Comparación visual estable, reproducción sincronizada con tiempos reales |
| P1 | Copia/exportación y restauración | Ida y vuelta conserva sesiones, tandas, tiros y correcciones |
| P2 | Progreso contextual | Filtrar por equipo, conservar versión de métricas, no mezclar datos incompatibles |
| P2 | Notas, impactos manuales y equipo | Correlacionar ejecución con resultado sin confundirlos |
| P3 | Entrenador, vídeo, GPS, nube | Solo cuando añadan valor probado; no son requisitos del entrenamiento básico |

## 7. Qué no prometer todavía

No prometer punto de impacto, minutos de arco, instante de salida de flecha, diagnóstico de técnica ni mejoras garantizadas a partir del acelerómetro actual. Tampoco afirmar compatibilidad con todos los Garmin desde una compilación para dos productos. Información abundante debe significar señales más interpretables y comparaciones fiables, no precisión aparente.

La siguiente entrega de producto más valiosa sería una sesión completa fiable: contar → cerrar/corregir tanda → guardar offline → sincronizar → revisar a escala común. Esa secuencia aporta más que añadir nuevas métricas sin validar.


## Actualización tras la revisión técnica

La auditoría anterior describe el punto de partida. En esta entrega se corrigieron la identidad de tandas al borrar, la navegación al recibir tiros y la etiqueta de estabilidad, y se reforzó la persistencia. No se implementaron todavía cierre explícito ni nuevo detector calibrado. Véase [estado de producción](estado-produccion.md) para distinguir cambios terminados de propuestas.
