# Investigación científica: detección del instante de suelta (release) y fases del tiro con IMU en muñeca

**Fecha de la investigación:** 2026-09-17
**Objetivo:** fundamentar científicamente el detector de suelta de ArcheryWatch (Garmin Forerunner 165, Connect IQ, acelerómetro 100 Hz en muñeca del arco + magnetómetro 50 Hz + intervalos RR) y proponer el método más efectivo y portable.
**Alcance:** detección de suelta y fases en arquería con wearables; deportes análogos (tiro deportivo, raquetas, boxeo/kárate, pesas, detección de impactos); frecuencia de muestreo mínima; firmas del transitorio; papel del magnetómetro; técnicas anti-falsos-positivos; detección de apertura y clicker.

**Metodología y advertencias de esta revisión**

- Fuentes buscadas vía OpenAlex, Crossref, arXiv API y PubMed E-utilities (fecha de consulta: 2026-09-17). La API de búsqueda web general estuvo agotada durante la sesión; la cobertura se apoyó en APIs bibliográficas y texto completo de arXiv.
- Cada afirmación lleva cita con DOI/URL, año, y una etiqueta de nivel de evidencia:
  - **[PR]** = peer-reviewed (revista o congreso con revisión).
  - **[PR-A]** = peer-reviewed pero solo abstract/resumen accesible (no se verificó texto completo).
  - **[Preprint]** = arXiv u otro repositorio sin revisión por pares.
  - **[Inferencia]** = razonamiento técnico propio apoyado en las fuentes citadas (no afirmado por ningún autor).
- **Huecos documentados honestamente** (no se encontró literatura): magnitud en g del jolt de suelta en muñeca, dirección anatómica exacta del jolt en muñeca, uso del magnetómetro como "veto" de heading, y detección de let-down (apertura sin soltar). Se señalan explícitamente en §4 y §5.
- La literatura académica específica de "arquería + wearable" es pequeña (≈5 estudios primarios con sensor inercial). La mayor parte de la transferencia proviene de deportes análogos. Este desequilibrio es un hallazgo en sí mismo: casi todo lo que funcione habrá que validarlo con datos propios.

---

## 1. Detección de suelta / fases en arquería con wearables: los estudios primarios

Solo existen ~5 estudios primarios con sensor inercial que atacan directamente la detección de la suelta o de las fases del tiro. En orden de relevancia para ArcheryWatch:

### 1.1. E-archery (UbiComp 2016) — el precedente directo

- **Cita:** Y. Zhao, S. Salunke, A. Leavitt, K. M. Curtin, N. Huynh, C. Zeagler, "E-archery", *Proceedings of the 2016 ACM International Joint Conference on Pervasive and Ubiquitous Computing: Adjunct (UbiComp '16)*, DOI: [10.1145/2968219.2968577](https://doi.org/10.1145/2968219.2968577) (2016). **[PR]** (texto completo de pago; abstract verificado vía OpenAlex el 2026-09-17).
- **Qué hace:** dispositivo wearable con acelerómetro que rastrea el movimiento de la mano para **capturar la "release"** del arquero y usarla como marcador de entrenamiento sin entrenador presente.
- **Algoritmo:** clasificador (tipo no especificado en el abstract) entrenado con **50 muestras por clase** de tres tipos de suelta: **good release, bad release, pluck release** (el "pluck" = abrir la mano/tirar de la cuerda en vez de relajar los dedos).
- **Resultado:** **recall > 90 % en las tres clases**.
- **Lecciones para ArcheryWatch:**
  1. Ya en 2016 se demostró que un acelerómetro en la mano del arco basta para capturar el evento de suelta con ≥50 ejemplos por clase y recall >90 %.
  2. La clasificación de la **calidad** de la suelta (good/bad/pluck) es un producto diferenciable que nadie ha llevado a smartwatch desde entonces.
  3. No reporta en el abstract la frecuencia de muestreo ni el clasificador exacto (hueco documentado).

### 1.2. Archery Skill Assessment Using an Acceleration Sensor (IEEE THMS 2021) — ciclo de tiro binario + tremor

- **Cita:** T. Ogasawara, H. Fukamachi, K. Aoyagi, S. Kumano, H. Togo, K. Oka, "Archery Skill Assessment Using an Acceleration Sensor", *IEEE Transactions on Human-Machine Systems*, DOI: [10.1109/THMS.2020.3046435](https://doi.org/10.1109/THMS.2020.3046435) (publicado online 2020, número 2021). **[PR-A]** (abstract verificado vía OpenAlex el 2026-09-17).
- **Montaje:** acelerómetro pequeño y ligero montado **en el arco** (no en la muñeca), 11 arqueros de club universitario.
- **Algoritmo (dos etapas):**
  1. **Detección automática del ciclo de tiro** (fases aiming → release → follow-through) mediante **clasificación binaria** (dispara/no-dispara) — exactamente la arquitectura "candidato barato + confirmación" que usa ArcheryWatch.
  2. Cuantificación del **tremor postural durante el apunte** dentro del ciclo detectado, y regresión hacia la puntuación total esperada.
- **Resultados:** detección de tiro con **precisión 0.72 y recall 0.80**; predicción de score con **|r| = 0.74** en validación **leave-one-subject-out** (LOSO).
- **Lecciones:**
  1. Incluso un sistema bien publicado en IEEE THMS logró solo 0.72/0.80 en la detección del ciclo: la tarea es difícil y los umbrales por usuario importan.
  2. El estándar de validación correcto es **LOSO** (generalización entre usuarios), no particiones por ventana.
  3. La cadena "detectar ciclo → medir tremor → predecir score" es un diferenciador de producto ya publicado; replicarla en muñeca es viable.

### 1.3. arXiv 2511.14057 (2025, preprint) — LSTM en muñeca del arco a 20 Hz

- **Cita:** X. Liu, J. Liu, C. Xu, M. Wang, H. Peng, T. Sun, J. Xu, "A Machine Learning-Based Multimodal Framework for Wearable Sensor-Based Archery Action Recognition and Stress Estimation", arXiv:[2511.14057](https://arxiv.org/abs/2511.14057), enviado el **2025-11-18**. **[Preprint]** (texto completo leído el 2026-09-17; sin revisión por pares).
- **Montaje:** pulsera propia (Ergosensing, China) en la **muñeca de la mano del arco** (izquierda en todos los participantes); **acelerómetro a 20 Hz** + PPG a 20 Hz (luz verde 532 nm).
- **Dataset:** 6 arqueros profesionales adolescentes (4 mujeres, 2 hombres; edad media 15.5 ± 0.5); rondas de competición real; anotación manual por un experimentador (marcas Draw y Release en tablet) refinada por inspección visual de la señal; 4 clics por acción: inicio de draw, fin de draw/inicio de aim, inicio de release/fin de aim, fin de release (definido como **el primer pico tras la suelta**).
- **Features exactas:** magnitud total de aceleración (Total Acc); derivada temporal (Diff Acc); y su novedad **SmoothDiff** = media móvil con **ventana de 20 muestras (1 s a 20 Hz)** aplicada a Diff Acc, que "realza las fronteras entre fases y reduce ruido".
- **Modelo:** **LSTM** binario (draw-to-release vs. fondo) sobre ventanas deslizantes de **80 muestras (4 s)** con **paso de 20 (1 s)**; la ventana de 4 s se eligió porque "la gran mayoría de las acciones draw-to-release caben en esa duración". Salida sigmoide. Reequilibrio por submuestreo de la clase mayoritaria + sobremuestreo de la minoritaria.
- **Resultados:** **accuracy 96.8 %, F1 95.9 %**; estrés vía HRV del PPG (RMSSD, pNN50, HF 0.15–0.4 Hz, potencia total) con MLP → **80 % de accuracy** alto/bajo estrés.
- **Advertencias críticas (nuestras, [Inferencia]):** la partición 70:30 es **por ventana, no por sujeto ni por sesión**; con ventanas solapadas de la misma serie es casi seguro que hay fuga de datos y las cifras están infladas. Aun así, es el estudio más cercano a ArcheryWatch (misma muñeca, mismas fases) y valida tres cosas: (a) 20 Hz bastan para separar draw/aim/release a nivel de ventana; (b) la derivada suavizada (jerk filtrado) realza las fronteras de fase; (c) HRV pre-tiro lleva señal de estrés medible.
- **Conclusión clave para el diseño:** en un reloj de 100 Hz se puede **recalcular SmoothDiff a 20 Hz** (diferencia + media móvil de 20 muestras a 20 Hz ≈ ventana 4-5 muestras) y conservar la portabilidad.

### 1.4. Consistencia del tiro con IMU a 60 Hz (IJPAH 2024)

- **Cita:** "A032: Archery Consistency Assessment by Using Inertial Measurement Unit (IMU)", *International Journal of Physical Activity and Health*, DOI: [10.18122/ijpah.3.3.32.boisestate](https://doi.org/10.18122/ijpah.3.3.32.boisestate) (2024). **[PR-A]** (abstract de congreso/revista verificado el 2026-09-17).
- **Montaje:** 6 arqueros de la **selección nacional china**, tiro a 50 m; **5 IMUs Xsens-DOT a 60 Hz** vs. captura óptica Qualisys a 200 Hz.
- **Métodos y resultados:** fases segmentadas con el sistema óptico; **CMC (Coefficient of Multiple Correlation) > 0.75** en la mayoría de parámetros de aceleración (alta similitud IMU vs. óptica); **distancia DTW** entre repeticiones como métrica de consistencia (la zona lumbar resultó la más consistente, p < 0.05); sin diferencia significativa de consistencia entre tiros al 10 y tiros fuera del 10 en esta élite (p > 0.05).
- **Lecciones:** (a) 60 Hz captura la forma de onda de la aceleración del tiro con fidelidad alta (CMC>0.75 frente a 200 Hz); (b) **DTW contra una plantilla propia es la métrica de "tiro consistente" avalada incluso en élite** — directamente aplicable como feature de confirmación o como score de calidad del tiro en ArcheryWatch.

### 1.5. Micro-movimiento del arco por FFT (IEEE GECOST 2024)

- **Cita:** "Archery Bow Micro-Movement Profiling Using Inertial Measurement Unit", *2024 International Conference on Green Energy, Computing and Sustainable Technology (GECOST)*, IEEE, DOI: [10.1109/GECOST60902.2024.10474945](https://doi.org/10.1109/GECOST60902.2024.10474945) (2024). **[PR]** (abstract verificado el 2026-09-17).
- **Qué hace:** IMU sobre el arco durante **anclaje y apunte**; FFT del señal inercial para perfilar el micro-movimiento.
- **Resultados numéricos:** las frecuencias de ocurrencia dominantes entre arqueros élite son **1, 3, 6 y 10 Hz**; la desviación estándar de los componentes medios de la FFT se sitúa en torno a **26 Hz**; construyen un "perfil de rendimiento" con distribución normal y umbral de inspección.
- **Lecciones para el diseño del detector:** durante el apunte, la señal útil en el arco vive mayoritariamente **por debajo de ~10 Hz**, con cola hasta ~26 Hz. Esto delimita el ancho de banda necesario (ver §3) y sugiere features espectrales baratas (energía en bandas 0–3 / 3–10 / 10–30 Hz) como firma de "estás apuntando con un arco".

### 1.6. Estudios de soporte biomecánico con acelerómetro en el arco/ambos brazos

- **Movimiento de ambos brazos y score (Procedia Engineering 2016):** acelerómetros dedicados en ambos brazos, muestreando a **~15 Hz** (¡muy bajo!), streaming Bluetooth; 6 flechas × 3 rondas por arquero universitario. El patrón de aceleración lineal de tiros altos y bajos es muy parecido, pero los tiros bajos tardan **~1 s más antes de la suelta**. DOI: [10.1016/j.proeng.2016.06.204](https://doi.org/10.1016/j.proeng.2016.06.204) (2016). **[PR]**. Lección: incluso a 15 Hz el eje temporal ("cuánto tiempo quieto antes de soltar") discriminaba; la duración del apunte es una feature útil.
- **Tremor del arco en la fase de apunte (PLoS ONE 2023):** acelerómetro montado **en el arco** para medir el tremor total durante el sighting; un entrenamiento de 4 semanas lo redujo (p < 0.05) y el paper conecta menor tremor con **fase de apunte más corta**. DOI: [10.1371/journal.pone.0285223](https://doi.org/10.1371/journal.pone.0285223) (2023). **[PR]**.
- **Feedback auditivo de inclinación del arco (BIBE 2022):** acelerómetro en el arco midiendo tilt en tiempo real durante el apunte con tonos de aviso: **−38 % de inclinación** en 9 arqueros, efecto persistente tras apagar el feedback; 67 % de los participantes corrigió su percepción del tilt. DOI: [10.1109/BIBE55377.2022.00019](https://doi.org/10.1109/BIBE55377.2022.00019) (2022). **[PR]**. Lección: el feedback en tiempo real desde el sensor del arco ya está validado como intervención de entrenamiento.

### 1.7. Revisión sistemática de referencia

- **Cita:** E. Vendrame, V. Belluscio, L. Truppa, L. Rum, A. Lazich, E. Bergamini, "Performance assessment in archery: a systematic review", *Sports Biomechanics*, DOI: [10.1080/14763141.2022.2049357](https://doi.org/10.1080/14763141.2022.2049357) (publicado online 2022-03-14; **[PR]**, abstract verificado 2026-09-17).
- **Alcance:** 41 estudios (1986–2021). Conclusiones: los expertos **maximizan la estabilidad postural** y desarrollan **estrategias personales** de activación muscular y gestión del tiempo; la **repetibilidad del gesto** es el eje de la evaluación del rendimiento.
- **Lección:** la literatura biomecánica avala que el marcador universal de buen tiro es la **consistencia inter-tiro**, no un patrón absoluto. Un detector por usuario (calibración personal) está mejor alineado con la evidencia que un modelo universal.

---

## 2. Deportes análogos: lecciones transferibles

### 2.1. Tiro con arco análogo: tiro olímpico con arma (pistola/rifle) — apunte, disparo, biofeedback

- **Sensor System for Precision Shooting Evaluation and Real-time Biofeedback** (*Procedia Computer Science*, DOI: [10.1016/j.procs.2019.01.228](https://doi.org/10.1016/j.procs.2019.01.228), 2019. **[PR]**): sistema que mide el movimiento de la pistola durante las **fases aiming / firing / post firing de cada disparo** en 46 sujetos; el movimiento de la mano durante el apunte correlaciona con la precisión; proponen usar las features para **avisar al tirador de suspender el disparo** cuando el movimiento sea excesivo. Es exactamente el análogo de "veto de apunte inestable → no contar el tiro" para ArcheryWatch.
- **Hand tremors y score en pistola de aire (Sensors 2024, DOI: [10.3390/s24082438](https://doi.org/10.3390/s24082438). [PR]):** acelerómetros triaxiales en la mano de 17 tiradores de la selección china; el **tremor medio-lateral y vertical** correlaciona negativamente con el score (r² entre −0.22 y −0.33, p < 0.001), y la relación es más marcada en élite. Confirma que el tremor de apunte medido con acelerómetro es un biomarcador válido del tiro.
- **Parámetros psicofisiológicos del tiro (Sensors 2023, DOI: [10.3390/s23063160](https://doi.org/10.3390/s23063160). [PR]):** EEG + parámetros psicofisiológicos predicen el fallo antes del disparo (aumento de delta y alfa temporal derecha antes de fallar). Contexto para el uso de RR intervals: la señal fisiológica precede y predice el desenlace del disparo.

### 2.2. Detección de impactos con smartwatch/wearable — la familia de métodos más transferible

- **Shot detection en raquetas con smartwatch (arXiv 2018, [Preprint]):** M. Sharma, A. Anand, R. Srivastava, L. Kaligounder, "Wearable Audio and IMU Based Shot Detection in Racquet Sports", arXiv:[1805.05456](https://arxiv.org/abs/1805.05456) (2018-05-14). Sistema **barato computacionalmente y en tiempo real** para detectar golpes en tenis de mesa desde un **smartwatch en la muñeca**, fusionando IMU + audio del reloj; **95.6 % de accuracy**. Destacan que tenis de mesa/bádminton tienen "movimiento de mano menos intenso" y por eso el análisis de tenis/golf no traslada directamente — exactamente la situación de la suelta de arquería (evento breve y moderado en muñeca). Diseño recomendado por los autores: detector de evento transitorio en la muñeca como base, y clasificadores encima.
- **Impactos de cabeza en fútbol americano (Sci Rep 2017, [PR], DOI: [10.1038/s41598-017-17864-3](https://doi.org/10.1038/s41598-017-17864-3)):** SVM con features de tiempo, frecuencia y wavelet; **las features PSD/wavelet en 10–30 Hz fueron las mejores**; con **<10 features** ya se optimiza el clasificador: **87.2 % sensibilidad y 93.2 % precisión** (validación cruzada, n=387) y >90 % en dataset juvenil independiente. Dos lecciones directas: (a) el contenido discriminativo de un impacto en un wearable vive en **10–30 Hz**; (b) una SVM con pocas features bien elegidas supera a redes grandes en este tipo de evento.
- **Detección de catch en fútbol americano (Sensors 2020, [PR], DOI: [10.3390/s20236722](https://doi.org/10.3390/s20236722)):** 9-DOF + audio en ambas manos, **759 intentos**, red neuronal con **93 % de accuracy**; el análisis de ablación muestra que **la red depende sobre todo de la aceleración y del magnetómetro**, ignorando giroscopio y la mayor parte del audio. Es el único ejemplo encontrado de **magnetómetro con rol en la detección de un evento** (ver §5).

### 2.3. Golpes en deportes de combate con sensor en muñeca

- **Boxeo (IoT 2020, [PR], DOI: [10.3390/iot1020021](https://doi.org/10.3390/iot1020021)):** comparación de 6 modelos supervisados × 2 configuraciones (muñecas; muñecas+T3). Entrenando **con un solo atleta**: 0.90 ± 0.12 de accuracy (solo muñecas) y la mejor SVM (kernel RBF) llega a **0.96**. La conclusión de los autores es que la clasificación por golpe y el monitoreo de carga automatizado son viables con **sensores simples + modelo por usuario**.
- **Punch Trackers comerciales (Sensors 2021, [PR], DOI: [10.3390/s21092968](https://doi.org/10.3390/s21092968)):** evaluación de Corner/Everlast/Hykso contra vídeo en 21 sujetos: los trackers reconocen mejor a **pugilistas entrenados** que a no entrenados (p = 0.007) y reconocen **rectos mejor que ganchos y uppercuts** (p < 0.001). Lección anti-optimismo: los detectores comerciales fallan sistemáticamente según el tipo exacto de movimiento y la experiencia del usuario; en arquería, el análogo es que un modelo entrenado con la técnica "correcta" puede fallar con principiantes o con sueltas defectuosas (pluck/let-down).
- **Kárate (IEEE Access 2021, [PR], DOI: [10.1109/ACCESS.2021.3118038](https://doi.org/10.1109/ACCESS.2021.3118038)):** **solo acelerómetros** de IMUs en ambas muñecas, CNN (MLP, 1D y 2D) sobre los campos de aceleración sin estadísticos previos; **accuracy 0.96, F1 0.97** en 5 clases incluyendo "movimiento sin golpe" — la clase negativa explícita es una buena práctica exportable (ver §6).

### 2.4. Deportes de raqueta: segmentación de eventos transitorios en muñeca

- **Tenis (IWSSIP 2016, [PR], DOI: [10.1109/IWSSIP.2016.7502764](https://doi.org/10.1109/IWSSIP.2016.7502764)):** IMU miniatura en el **antebrazo justo encima de la muñeca**; **detección del golpe con el acelerómetro** y clasificación (drive/revese/saque) con el giroscopio; algoritmos "muy simples" por memoria/CPU limitadas y aun así **98.1 % de accuracy**. Patrón arquitectónico: **detección barata con accel → clasificación costosa con más sensores**.
- **Tenis (Sensors 2019, [PR], DOI: [10.3390/s19225004](https://doi.org/10.3390/s19225004)):** espectrogramas + deep learning semisupervisado; robustez a la variabilidad del sujeto: **>96.5 % reconociendo golpes de un jugador nuevo nunca visto** (user-independence).
- **Bádminton (Sensors 2020, [PR], DOI: [10.3390/s20174685](https://doi.org/10.3390/s20174685)):** CNN con 9 actividades; **solo acelerómetro a 50 Hz → 86 % de precisión**; añadir giroscopio → hasta 99 %; el paper analiza explícitamente el impacto de la **frecuencia de muestreo** y la colocación del sensor.
- **MultiSenseBadminton (Scientific Data 2024, [PR], DOI: [10.1038/s41597-024-03144-z](https://doi.org/10.1038/s41597-024-03144-z)):** dataset abierto de 7,763 swings de 25 jugadores multi-sensor, con anotación de tipo de golpe — referencia para diseñar capturas de datos propias.

### 2.5. Pesas / rep counting: arquitecturas sin entrenamiento y con plantillas

- **uLift (IEEE Access 2024, [PR], DOI: [10.1109/ACCESS.2024.3363437](https://doi.org/10.1109/ACCESS.2024.3363437)):** tracker de entrenamiento con **un solo acelerómetro de muñeca**, sin proceso de entrenamiento: (1) detección binaria de "está entrenando" mediante **suma ponderada de autocorrelación**; (2) **conteo de repeticiones filtrando picos indeseados** (refractario implícito); (3) clasificación del ejercicio por **plantillas + distancia DTW**; (4) score de forma por consistencia entre repeticiones. Resultados: 93.09 % de detección, error medio de conteo 0.61, 90.06 % de clasificación (15 ejercicios, 35 participantes). **Es el paralelo arquitectónico más completo para ArcheryWatch**: al no ser cíclico, la autocorrelación se sustituye por la ventana quieta de apunte, pero el resto (picos → plantilla DTW → consistencia) encaja.
- **Gym jerárquico (IEEE IoT-J 2018, [PR], DOI: [10.1109/JIOT.2018.2846359](https://doi.org/10.1109/JIOT.2018.2846359)):** arquitectura **en dos capas**: one-class SVM para separar burdamente "actividad con pesas" del resto, y después NN/HMM para clasificación fina y conteo. Validación del patrón "filtro grueso barato + confirmación cara".
- **Intensidad de fuerza con wearables (J. Biomedical Informatics 2015, [PR-A], DOI: [10.1016/j.jbi.2015.09.020](https://doi.org/10.1016/j.jbi.2015.09.020)):** reconocimiento de intensidad de ejercicio de fuerza con sensores wearable; referencia de features generales de aceleración para entrenamiento.

### 2.6. Detección de caídas en muñeca: la escuela del umbral + segunda etapa

- **On-wrist fall detection (Sensors 2018, [PR], DOI: [10.3390/s18051350](https://doi.org/10.3390/s18051350)):** umbral publicado + ajuste fino de umbrales, features extendidas y comparación de modelos ligeros en muñeca: los **sistemas basados en reglas rinden como las redes neuronales con mucho menos coste**, y las SVM logran la mejor especificidad; el reto real es **reducir falsas alarmas**. Idéntico trade-off al de ArcheryWatch (sensibilidad vs. FPs en el día a día).
- **EvenT-ML (Sensors 2018, [PR], DOI: [10.3390/s18010020](https://doi.org/10.3390/s18010020)):** en vez de ventanas fijas, **segmentar alineado con las etapas del evento** (pre-impacto / impacto / post-impacto) disparado por el propio evento: F-scores de 98 % (pecho) y 92 % (cintura) con reducciones de coste computacional de hasta **78×** frente a ventanas deslizantes. Lección: alinear la ventana de features al candidato (p. ej., 300 ms antes → 600 ms después del pico) mejora detección y coste.
- **SmartFall (Sensors 2018, [PR], DOI: [10.3390/s18103363](https://doi.org/10.3390/s18103363)):** DL sobre accel cruda de smartwatch comercial; generaliza mejor a usuarios nuevos que SVM/NB sobre features manuales — el contraargumento a considerar si se quiere un modelo global.

---

## 3. ¿Qué frecuencia mínima hace falta?

**Resumen de la evidencia:**

| Fuente | Frecuencia | Hallazgo | Nivel |
|---|---|---|---|
| arXiv 2511.14057 (2025-11-18) | **20 Hz** | LSTM separa draw/aim/release en muñeca del arco (96.8 % acc, con la salvedad de fuga por partición por ventana) | [Preprint] |
| GECOST 2024 | FFT del apunte | Componentes dominantes 1/3/6/10 Hz; dispersión de componentes FFT con SD ~26 Hz | [PR] |
| Sci Rep 2017 (head impacts) | — | Features **10–30 Hz** (PSD/wavelet) son las más discriminativas para detectar impactos | [PR] |
| Sensors 2020 (bádminton) | **50 Hz** | Solo accel a 50 Hz: 86 % precisión en 9 actividades; analizan el efecto de la frecuencia | [PR] |
| Procedia Eng. 2016 (arquería) | **~15 Hz** | Incluso a 15 Hz, patrones de brazo y tiempos pre-suelta discriminan score | [PR] |
| IJPAH 2024 (arquería) | **60 Hz** | CMC > 0.75 frente a óptica de 200 Hz en aceleración del tiro | [PR-A] |

**Síntesis para el diseño ([Inferencia] apoyada en las fuentes anteriores):**

1. **Duración del transitorio:** la evidencia biomecánica sitúa la fase mecánica de la suelta (caída del clicker/cuerda, retroceso del arco, salida de la flecha) en el orden de **decenas de milisegundos**; el "evento medible en muñeca" (jolt + oscilación del arco + reajuste del brazo) se extiende unos cientos de ms (los estudios que definen el fin de la fase de release usan "el primer pico tras la suelta" [arXiv 2025] y miden follow-through posterior [Callaway 2016]). No se encontró ninguna publicación que cuantifique en ms el ancho del pulso específicamente en muñeca — **hueco documentado**; conviene medirlo con las capturas de ArcheryWatch.
2. **Ancho de banda de la señal en muñeca del arco:** en apunte, la potencia útil vive por debajo de ~10 Hz con cola hasta ~26 Hz (GECOST 2024). Los impactos genéricos en wearables llevan su contenido discriminativo en 10–30 Hz (Sci Rep 2017). Combinando ambas: un detector de suelta necesita capturar **hasta ~30 Hz** para no ser ciego a la firma del impacto.
3. **Qué se pierde a cada tasa** ([Inferencia] directa del teorema de Nyquist + los puntos anteriores):
   - **25 Hz (Nyquist 12.5 Hz):** suficiente para fases lentas (draw/aim) y para métricas de estabilidad/tremor (1–10 Hz), pero **recorta todo el contenido 12.5–30 Hz** que la evidencia marca como discriminativo del impacto. Sirve para "contar fases", es arriesgado para "clavar el instante de suelta" y para validar la forma del pulso.
   - **100 Hz (Nyquist 50 Hz):** cubre con margen la banda relevante (0–30 Hz). Es el punto dulce y coincide con la configuración actual de ArcheryWatch. La evidencia de CMC>0.75 a 60 Hz sugiere que incluso 50–60 Hz bastaría para la forma de onda.
   - **400+ Hz:** aporta detalle del borde del impulso (útil en laboratorio o con sensor en el arco), pero en muñeca el tejido blando actúa como filtro paso-bajo mecánico y la ganancia informativa marginal no compensa el coste de batería en un reloj. Ningún estudio wearable de arquería usa >200 Hz (los 200/600 Hz de los estudios biomecánicos son óptica/plataformas de fuerza, no acelerómetros de muñeca).
4. **Conclusión práctica:** para portabilidad entre relojes, diseñar para **funcionar a 25 Hz** (fases, gating, estabilidad) y **explotar 100 Hz cuando esté disponible** (forma del pulso, confirmación fina). Nunca depender de features que requieran >50 Hz.

---

## 4. Firmas de la suelta descritas en la literatura

**Qué dice la literatura (y qué no):**

1. **Dirección del jolt en muñeca del arco: hueco documentado.** Ningún estudio publicado describe el eje anatómico del impulso de suelta medido en muñeca. Lo más cercano: el estudio de ambos brazos a 15 Hz midió adelante-atrás / arriba-abajo / izquierda-derecha en las dos manos durante la release y encontró patrones correlacionados con el score ([10.1016/j.proeng.2016.06.204](https://doi.org/10.1016/j.proeng.2016.06.204), 2016, [PR]); y la biomecánica del release muestra que la **deflexión lateral de la cuerda** y el movimiento de los dedos dominan el evento en el arco ([10.1123/jab.27.2.151](https://doi.org/10.1123/jab.27.2.151), J. Applied Biomechanics 2011, [PR]). Físicamente ([Inferencia]) el impulso en la mano del arco debería proyectarse principalmente sobre el **eje de empuje del arco (eje anteroposterior de la muñeca, "hacia el blanco/arriba")** con componentes laterales de la torsión del arco al girar en la mano (follow-through), pero **esta dirección debe medirse empíricamente con las capturas de ArcheryWatch antes de acoplar el detector a un eje concreto**.
2. **Magnitud típica en g en muñeca: hueco documentado.** No se publicó ningún valor de amplitud del jolt en muñeca. Referencias indirectas: el detector del ciclo de tiro sobre el arco (Ogasawara 2021) alcanzó precision 0.72/recall 0.80 con un acelerómetro genérico; el detector de catch (Sensors 2020) funcionó con accel de smartwatch estándar en eventos de impacto de intensidad comparable. Conclusión operativa: **la magnitud absoluta debe calibrarse por usuario/dispositivo** (como ya hace ArcheryWatch con su mediana de ≥3 tiros y mínimo 900 mg), y la discriminación debe apoyarse más en **forma temporal y espectro (10–30 Hz)** que en un umbral global de g.
3. **Oscilación posterior:** el fin de la fase de release se define por el **primer pico tras la suelta** ([arXiv 2511.14057, 2025, Preprint]) y la fase de **follow-through es una variable temporal estudiada por derecho propio** (Callaway et al. 2016, DOI: [10.1080/02640414.2016.1211730](https://doi.org/10.1080/02640414.2016.1211730), J. Sports Sciences, [PR]): follow-through time, aiming time y variabilidad del intervalo clicker→release figuran entre los 14 predictores del score. La estabilidad post-release también predice score (Spratford & Campbell 2017, DOI: [10.1080/17461391.2017.1285963](https://doi.org/10.1080/17461391.2017.1285963), Eur. J. Sport Science, [PR]: menor sway speed post-suelta → mejor score, en 39 arqueros de Copa del Mundo con plataforma de fuerza a 1000 Hz). Operativamente: **después del jolt esperan oscilación amortiguada + reajuste del brazo durante ~0.5–1 s**; validar eso es una confirmación barata y robusta.
4. **Contraste con actividades interferentes:**
   - **Caminar / recoger flechas / bajar el arco:** ningún estudio de arquería las caracteriza como negativos (hueco). Por transferencia de HAR genérico: la marcha es casi-periódica (1–3 Hz) y de baja amplitud, fácil de excluir con el gating de quietud y autocorrelación (uLift 2024 usa exactamente autocorrelación para separar "ejercicio" del resto; [PR]).
   - **Let-down (apertura sin soltar): hueco documentado total** — no se encontró ningún estudio que detecte let-down con inerciales. Es un falso positivo/negativo crítico que ArcheryWatch tendrá que resolver empíricamente (sugerencia: el let-down genera un movimiento controlado de gran excursión SIN impulso agudo final; el detector de "pico agudo al final de un draw" debería separarlo — [Inferencia]).
   - **Cómo distinguen otros autores el evento de otros impactos:** en impactos de cabeza, con features de forma espectral (10–30 Hz) y wavelet (Sci Rep 2017); en catch, con red sobre señal cruda de ambas manos (Sensors 2020); en golf/raquetas, con detección por umbral de accel + clasificación posterior (IWSSIP 2016; Sci Rep 2024 golf con un solo IMU de muñeca, DOI: [10.1038/s41598-024-59949-w](https://doi.org/10.1038/s41598-024-59949-w)). Patrón común: **el umbral encuentra candidatos; la forma (tiempo-frecuencia) confirma**.

---

## 5. Papel del magnetómetro

1. **Uso directo en detección (no solo orientación):** el único caso encontrado es la **detección de catch en fútbol americano (Sensors 2020, [PR], DOI: [10.3390/s20236722](https://doi.org/10.3390/s20236722))**, donde la red neuronal "depende sobre todo de la aceleración y de los datos del magnetómetro, despreciando giroscopio y la mayor parte del audio". Interpretación ([Inferencia]): el mag aporta un firma estática/instantánea de la orientación de la mano en el momento del evento (el campo magnético terrestre como "brújula absoluta barata"), útil cuando el giroscopio no está disponible o es caro de procesar. Para ArcheryWatch: incluir la **magnitud y dirección del campo magnético en el instante del candidato** como features de confirmación es una idea con un único precedente, barata de probar.
2. **Veto/confirmación por salto de heading: sin precedente publicado** (hueco documentado). La literatura de fusión usa el mag para **estimación de orientación y heading**, y estudia sus fallos: perturbaciones magnéticas degradan heading y actitud de forma bien caracterizada (Sensors 2018, DOI: [10.3390/s18010076](https://doi.org/10.3390/s18010076), [PR]; Sensors 2014, DOI: [10.3390/s141120008](https://doi.org/10.3390/s141120008), [PR]). Un "salto de heading" durante un impulso puede ser tanto movimiento real como **distorsión magnética** — usarlo como veto sin previsión de distorsión es peligroso ([Inferencia]).
3. **Contaminación por el arco:** no hay estudios específicos de arcos (hueco). Los risers de aluminio/carbono con accesorios metálicos (vise, clicker, pesos, estabilizadores) crean **anomalías magnéticas locales dependientes de la orientación del arco**, el peor caso para una brújula de muñeca: la norma |B| local se desvía del campo terrestre (~25–65 µT) y varía al mover el arco. Práctica estándar en AHRS: **detectar distorsión comprobando la desviación de |B| respecto a su valor de referencia** y degradar la confianza del mag en consecuencia ([Inferencia] apoyada en Sensors 2014/2018).
4. **Recomendación operativa ([Inferencia]):** usar el mag como **feature de confirmación (norma + heading antes/después del candidato) y como detector de contexto "arco apuntando" (heading estable durante el apunte)**, nunca como condición de veto dura salvo que las capturas propias demuestren lo contrario. Muestrear mag a 50 Hz es suficiente: el campo no cambia con el movimiento salvo por rotación real o distorsión.

---

## 6. Técnicas anti-falsos-positivos validadas

**6.1. Gating por contexto (ventana quieta previa obligatoria)**

- El patrón "primero detectar que hay un ciclo/actividad, después buscar el evento" está validado en arquería misma: Ogasawara 2021 detecta el **ciclo de tiro** antes de cuantificar nada ([PR-A]); el sistema de tiro olímpico mide primero el apunte y usa sus features para **suspender disparos malos** ([10.1016/j.procs.2019.01.228](https://doi.org/10.1016/j.procs.2019.01.228), 2019, [PR]); uLift exige un estado de "está entrenando" (autocorrelación) antes de contar reps (IEEE Access 2024, [PR]). La ventana quieta de apunte de ArcheryWatch tiene además respaldo biomecánico: los buenos arqueros son **más estables y más consistentes** en el apunte (revisión sistemática Vendrame 2022, [PR]; PLoS ONE 2023 tremor, [PR]).

**6.2. Validación de la forma del pulso (duración, decaimiento, simetría)**

- La evidencia más sólida: en impactos de cabeza, **features de forma temporal + espectral (PSD 10–30 Hz, wavelet) con <10 features** dan 87.2 %/93.2 % (Sci Rep 2017, [PR]) — la forma, no la amplitud, discrimina. EvenT-ML (Sensors 2018, [PR]) muestra además que **alinear la ventana de features a las etapas del evento** (pre/impacto/post) mejora el F-score y reduce el cómputo hasta 78× — es la justificación formal de validar el decaimiento en los primeros 600 ms como hace ArcheryWatch.
- El rechazo de "impulso sostenido" (el candidato no es un choque sino un movimiento) tiene paralelo en el filtrado de picos de uLift para conteo (2024, [PR]) y en las reglas adaptativas de detección de pasos con condiciones múltiples sobre la forma del pico (Sensors 2016, DOI: [10.3390/s16091423](https://doi.org/10.3390/s16091423), [PR]).

**6.3. Período refractario y recuperación**

- Estándar en conteo de eventos: filtrado de picos con distancia mínima entre eventos (uLift 2024, [PR]; detección de pasos Sensors 2016, [PR]). La novedad de ArcheryWatch (recuperación gradual del umbral, 150 ms bajo umbral) es consistente con la práctica de histéresis de umbral en detección de caídas/pasos (Sensors 2018 fall detection: umbral + histéresis ajustada, [PR]). Sin publicación específica de período refractario en arquería: parámetro a ajustar con datos propios.

**6.4. Clasificadores ligeros entrenables con ≤10 ejemplos por usuario**

| Técnica | Evidencia | Resultado con pocos ejemplos | Nivel |
|---|---|---|---|
| **DTW con 1 plantilla por gesto (uWave)** | Liu et al., PerCom 2009, DOI: [10.1109/PERCOM.2009.4912759](https://doi.org/10.1109/PERCOM.2009.4912759) | **1 sola muestra de entrenamiento** por gesto → **98.6 %** en vocabulario de 8 gestos (4000+ muestras, 8 usuarios) | [PR] |
| **Few-shot sobre modelo preentrenado** | CHI 2022, DOI: [10.1145/3491102.3501904](https://doi.org/10.1145/3491102.3501904) | 1/3/5 ejemplos para un gesto nuevo → **55.3 % / 83.1 % / 87.2 %** sin degradar el set existente; FPR 0.6/h del modelo base | [PR] |
| **SVM por usuario (boxeo)** | IoT 2020, DOI: [10.3390/iot1020021](https://doi.org/10.3390/iot1020021) | Entrenado con **un solo atleta** → 0.90–0.96 de accuracy | [PR] |
| **Plantillas DTW por ejercicio (uLift)** | IEEE Access 2024, DOI: [10.1109/ACCESS.2024.3363437](https://doi.org/10.1109/ACCESS.2024.3363437) | Plantilla representativa generada de las propias repeticiones, sin entrenamiento → 90 % clasificación | [PR] |
| **DTW como métrica de consistencia de tiro** | IJPAH 2024, DOI: [10.18122/ijpah.3.3.32.boisestate](https://doi.org/10.18122/ijpah.3.3.32.boisestate) | DTW-distance entre tiros del propio arquero como métrica validada en élite | [PR-A] |
| **Reglas/umbral ajustado vs. ML** | Sensors 2018 fall, DOI: [10.3390/s18051350](https://doi.org/10.3390/s18051350) | Reglas ≈ redes neuronales con menos coste; SVM mejor especificidad | [PR] |
| **Umbral por percentil de los propios tiros** | (práctica de calibración; ArcheryWatch ya la usa con mediana de ≥3 tiros) | Coherente con la evidencia de que **los patrones absolutos no generalizan entre usuarios** y sí la consistencia personal (Vendrame 2022) | [PR] + [Inferencia] |

- **Conclusión:** con ≤10 ejemplos por usuario, lo que mejor funciona según la evidencia es **k-NN/DTW sobre plantillas del propio usuario + umbral estadístico personal (mediana/percentil de sus propios tiros) + validación de forma**, no entrenar redes. El preentrenado + few-shot (CHI 2022) es el techo superior si algún día hay modelo global.

---

## 7. Detección de apertura (draw) y clicker; separabilidad de fases

**7.1. Detección del draw con inerciales**

- arXiv 2511.14057 (2025, [Preprint]) es el único que segmenta **draw/aim/release desde la muñeca del arco** (a 20 Hz, LSTM sobre SmoothDiff). E-archery (2016, [PR]) también parte del draw para capturar la release. Los análisis dinámicos del movimiento de apertura muestran que la **mano del arco durante el draw tiene firmas dinámicas medibles** (convex hull, Hurst, entropía muestral) que separan profesionales de novatos (Entropy 2023, DOI: [10.3390/e25101414](https://doi.org/10.3390/e25101414), [PR]) — es decir, el draw no solo es detectable sino informativo del nivel.
- Implicación: **abrir la sesión de tiro al detectar el draw** (en vez de esperar al impulso) reduce drásticamente el espacio de búsqueda del detector y es el diseño que la evidencia usa.

**7.2. Clicker (recurvo olímpico)**

- **Timing del clicker como predictor:** clicker reaction time más corto + mayor draw force + menor sway post-suelta predicen mejor score (Spratford & Campbell 2017, [PR], 39 arqueros élite). La variabilidad del intervalo **clicker→release** es uno de los 14 predictores temporales del score (Callaway 2016, [PR], 15 arqueros × 30 tiros a 18 m). El MCRT (tiempo de reacción mecánico del clicker) y la actividad del flexor **en el segundo previo a la caída del clicker** discriminan rendimiento (Tınazcı 2011, DOI: [10.1016/j.proeng.2011.05.087](https://doi.org/10.1016/j.proeng.2011.05.087), Procedia Engineering, [PR]; EMG+fuerza a 600 Hz sincronizados con la caída del clicker).
- **El snap del clicker como evento objetivo:** provoca un potencial N1–P2 de latencia larga cuya amplitud N1 es mayor en tiros de acierto (Montenegrin J. Sports Sci. Med. 2021, DOI: [10.26773/mjssm.210306](https://doi.org/10.26773/mjssm.210306), [PR]). El snap audible se usa como **marcador de sincronización** en los estudios de laboratorio (Tınazcı 2011).
- **Detección del clicker con acelerómetro de muñeca: hueco documentado.** La caída del clicker golpea el riser y debería aparecer como un **micro-impulso de alta frecuencia (~tensión de ms) inmediatamente antes del jolt principal**; ningún estudio lo ha intentado con inerciales ([Inferencia]). Es una confirmación barata y específica de recurvo: "micro-pico en 10–30 Hz seguido a <100 ms del impulso principal".

**7.3. Separabilidad de fases apertura→anclaje→apunte→suelta→seguimiento**

- Estados del ciclo validados con inerciales: aiming / release / follow-through (Ogasawara 2021, [PR-A], sobre el arco); draw / aim / release (arXiv 2025, [Preprint], en muñeca); consistencia inter-fases con DTW (IJPAH 2024, [PR-A]).
- Marcadores fisiológicos de fase: la **HRV de los 20 s previos a cada flecha** diferencia arqueros experimentados (mayor LF, RMSSD, pNN50; aumento parasimpático) (J. Sports Sciences 2011, DOI: [10.1080/02640414.2011.568514](https://doi.org/10.1080/02640414.2011.568514), [PR]); y la colocación del **primer movimiento del dedo dentro del ciclo cardíaco** fue el parámetro más consistente para distinguir tiros buenos: los buenos se sueltan en fase ST/mitad del ciclo ECG (Keast & Elliott 1990, DOI: [10.1080/02640419008732146](https://doi.org/10.1080/02640419008732146), J. Sports Sciences, [PR]). Estos dos hallazgos dan soporte directo al uso de **intervalos RR** de ArcheryWatch como feature de contexto (y como idea de producto: "avisar cuando el corazón esté en fase favorable" tiene base publicada de 1990).
- Fases temporales medias del ciclo (para dimensionar ventanas): pre-shot time, aiming time, clicker→release y follow-through son del orden de segundos, con el apunte típicamente multi-segundo y el par release+follow-through en torno al segundo (Callaway 2016, [PR]; el pre-suelta ~1 s más largo ya separa tiros malos incluso a 15 Hz, Procedia 2016, [PR]).
- **Veredicto de separabilidad:** draw/apunte (segundos, baja frecuencia) son trivialmente separables a 20–25 Hz; **suelta vs. follow-through exige 50–100 Hz**; clicker vs. suelta exige 100 Hz y probablemente sensor/ubicación favorables ([Inferencia] a partir del ancho de banda de §3).

---

## 8. Implicaciones para ArcheryWatch (15 puntos accionables)

1. **Arquitectura recomendada = máquina de estados de 4 estados con confirmación en dos etapas** (patrón validado en la propia arquería y en análogos): `IDLE → DRAW (apertura detectada, big-window, features lentas a 20 Hz) → AIM/SETTLE (gating de quietud obligatorio + tremor/estabilidad) → CANDIDATE (umbral barato de impulso) → CONFIRM (forma del pulso + plantilla + opcional mag/RR) → REFRACTORY (cooldown + histéresis de recuperación)`. Precedentes: Ogasawara 2021 (ciclo binario antes de medir), One-class SVM + modelo fino (IoT-J 2018), EvenT-ML (segmentación alineada al evento).
2. **Abre con el draw, no con el impulso.** Detectar la apertura con features lentas (SMA, autocorrelación inversa, excursión grande sostenida) a 20 Hz reduce los candidatos y los falsos positivos a casi cero fuera de sesiones (arXiv 2025 demuestra que draw es reconocible en muñeca incluso a 20 Hz).
3. **Mantén el gating de apunte quieto, pero mide su calidad.** No lo trates como binario: cuanta energía de tremor 3–10 Hz y estabilidad (desviación estándar por eje + heading del mag) durante la ventana; sirve tanto de gate como de feature de confirmación ("el impulso llegó tras un apunte estable") y de métrica de calidad del tiro para el usuario (GECOST 2024; PLoS ONE 2023).
4. **Conserva el umbral calibrado por usuario, ancla el mínimo por dispositivo y añade umbral por percentil.** La evidencia es consistente: no hay patrón absoluto universal; la consistencia personal es el predictor (Vendrame 2022). Umbral sugerido: percentil 95–99 de la energía de picos durante draw/apunte del propio usuario + margen, en lugar de solo mediana de tiros + 900 mg.
5. **Cambia el peso de la validación de la amplitud a la forma del espectro.** Calcula la distribución de energía por bandas 0–3 / 3–10 / 10–30 Hz del candidato (100 Hz, ventana ~500 ms con FFT de 256): los impactos discriminativos viven en 10–30 Hz (Sci Rep 2017) y el apunte en <10 Hz (GECOST 2024). Un ratio "energía 10–30 Hz / energía total" alto es firma de impacto; alto en <3 Hz es caminar/reajuste.
6. **Suaviza la derivada (jerk filtrado) como feature primaria, no la accel cruda.** SmoothDiff (diferencia + media móvil) mejoró las fronteras de fase en muñeca del arco (arXiv 2025); a 100 Hz equivale a diff de 1 muestra + media móvil de 4–5 muestras. Coste insignificante en Connect IQ.
7. **Alinea la ventana de confirmación al evento, no ventanas fijas:** 250–300 ms pre-pico + 600 ms post-pico (EvenT-ML). Tu validación de decaimiento a 100 ms/600 ms encaja; añade la parte pre-pico (quietud + micro-pico del clicker si aplica).
8. **Añade plantilla DTW del propio usuario como segunda confirmación (sustituta o complemento de la similitud coseno).** DTW con 1 plantilla ya funciona con 98.6 % en gestos de muñeca (uWave 2009) y es la métrica de consistencia avalada en arquería élite (IJPAH 2024). Cosine ≥0.85 + DTW-distance ≤ percentil 75 de los tiros de calibración es una combinación barata y avalada.
9. **Busca el micro-impulso del clicker (recurvo olímpico) como marcador negativo/positivo:** pico breve en 10–30 Hz en los ~100 ms previos al jolt. Sin precedente publicado, pero mecánicamente obligado ([Inferencia]) y muy específico: su presencia casi descarta caminar o golpes casuales. Compáralo con el snap audible que la literatura usa como ground truth (Tınazcı 2011).
10. **Usa el magnetómetro como confirmación blanda, nunca como veto duro (aún):** features = norma |B| y heading 1 s antes vs. después del candidato; coherencia "heading estable durante apunte → cambio brusco coherente con el follow-through". Único precedente positivo de mag en detección: catch CNN (Sensors 2020). Prevé degradación por el riser metálico: si |B| se desvía del campo de referencia durante la sesión, baja la confianza del mag (AHRS literature 2014/2018). **Valida primero con capturas propias si el mag aporta algo junto al arco.**
11. **Monetiza los RR intervals con dos features avaladas:** (a) HRV de los 20–60 s previos (RMSSD/pNN50/HF) como contexto de sesión y "readiness" (ANS 2011; arXiv 2025 stress MLP 80 %); (b) experimento de producto único: registrar la fase del ciclo cardíaco en la suelta — la colocación del primer movimiento de dedo en fase ST del ECG fue el predictor más consistente de tiro bueno (Keast & Elliott 1990). Barato de registrar, imposible de falsificar, y nadie lo tiene en un reloj.
12. **Portabilidad a relojes de 25 Hz:** define el detector en dos capas con frecuencias lógicas: capa 1 (fases/gating/quietud/HRV) funciona a 20–25 Hz (demostrado en muñeca del arco, arXiv 2025); capa 2 (forma del pulso 10–30 Hz) se degrada con elegancia a 25 Hz sustituyendo la validación espectral por la validación temporal (duración, decaimiento, DTW). Publica como requisito: "100 Hz recomendado; 25 Hz soportado con confirmación temporal".
13. **Qué validar primero (orden de rentabilidad):** (1) recolectar ≥30 tiros × ≥5 usuarios con etiqueta de vídeo/audio (el snap del clicker como marcador objetivo); (2) medir en tus propios datos: duración y eje del jolt, ratio de bandas 10–30 Hz, micro-pico del clicker, separación vs. let-down — son los tres huecos de la literatura; (3) A/B de umbral-mediana vs. percentil; (4) DTW vs. coseno; (5) mag y RR como features incrementales (ablation). Sin estas mediciones propias, cualquier decisión fina sobre eje/magnitud del jolt sería adivinanza: la literatura no las documenta.
14. **Validación estadística al estilo del estado del arte:** reporta precisión/recall **por sujeto con LOSO** (Ogasawara: 0.72/0.80 es el benchmark realista publicado en arquería), no accuracy por ventana (el 96.8 % del preprint de 2025 usa partición por ventana y probablemente está inflado por fuga — tratarlo como techo no como objetivo). Incluye la matriz de confusión contra los interferentes reales: caminar, recoger flechas, bajar el arco, let-down.
15. **Riesgos principales:** (a) **let-down sin detección publicada** — mayor hueco y mayor riesgo de FN/FP, requiere datos propios ya; (b) variabilidad entre arcos (recurve/compuesto, peso de arco) cambia la firma del jolt: la calibración por usuario debe incluir tipo de arco como perfil; (c) trackers comerciales de boxeo fallan más con usuarios noveles y gestos atípicos (Sensors 2021): esperar lo mismo con principiantes y sueltas defectuosas — las clases "pluck/bad" de E-archery son la solución publicada; (d) distorsión magnética del arco puede invalidar features de heading según la configuración de accesorios; (e) el drain de batería de 100 Hz continuo limita la adopción: por eso la arquitectura de dos capas (25 Hz idle → 100 Hz en DRAW) es también la respuesta de producto.

---

## Tabla maestra de fuentes primarias

| # | Fuente | Año | Tipo | DOI/URL | Relevancia |
|---|---|---|---|---|---|
| 1 | Zhao et al., "E-archery", UbiComp '16 Adjunct | 2016 | [PR] | 10.1145/2968219.2968577 | Suelta good/bad/pluck, accel, recall >90 % |
| 2 | Ogasawara et al., IEEE THMS | 2021 | [PR-A] | 10.1109/THMS.2020.3046435 | Detección binaria del ciclo tiro, P 0.72/R 0.80, LOSO |
| 3 | Liu et al., arXiv:2511.14057 | 2025 | [Preprint] | arxiv.org/abs/2511.14057 | Muñeca del arco, 20 Hz, LSTM+SmoothDiff, draw/aim/release |
| 4 | "A032 Archery Consistency IMU", IJPAH | 2024 | [PR-A] | 10.18122/ijpah.3.3.32.boisestate | 60 Hz vs 200 Hz, CMC>0.75, DTW consistencia |
| 5 | "Bow Micro-Movement Profiling", GECOST | 2024 | [PR] | 10.1109/GECOST60902.2024.10474945 | FFT apunte: 1/3/6/10 Hz, SD 26 Hz |
| 6 | "Archer's Hands Movement", Procedia Eng. | 2016 | [PR] | 10.1016/j.proeng.2016.06.204 | 15 Hz ambos brazos, +1 s pre-suelta en malos tiros |
| 7 | Vendrame et al., Sports Biomechanics (revisión) | 2022 | [PR] | 10.1080/14763141.2022.2049357 | 41 estudios; consistencia = clave |
| 8 | Callaway et al., J. Sports Sciences | 2016 | [PR] | 10.1080/02640414.2016.1211730 | Fases temporales, clicker→release, follow-through |
| 9 | Spratford & Campbell, Eur. J. Sport Sci. | 2017 | [PR] | 10.1080/17461391.2017.1285963 | Clicker RT + sway post-suelta predicen score |
| 10 | Tınazcı, Procedia Eng. | 2011 | [PR] | 10.1016/j.proeng.2011.05.087 | MCRT, 600 Hz, flexor 1 s antes del clicker |
| 11 | Keast & Elliott, J. Sports Sciences | 1990 | [PR] | 10.1080/02640419008732146 | Fase del ciclo ECG en la suelta → score |
| 12 | ANS/HRV en competición, J. Sports Sciences | 2011 | [PR] | 10.1080/02640414.2011.568514 | HRV 20 s pre-flecha, RMSSD/pNN50 |
| 13 | ERP N1 al clicker, MJSSM | 2021 | [PR] | 10.26773/mjssm.210306 | Snap del clicker como evento neuronal/marcador |
| 14 | Tremor apunte + ejercicio, PLoS ONE | 2023 | [PR] | 10.1371/journal.pone.0285223 | Accel en arco mide tremor de apunte |
| 15 | Bow-tilt feedback, BIBE | 2022 | [PR] | 10.1109/BIBE55377.2022.00019 | Accel en arco, feedback en tiempo real −38 % |
| 16 | Entropy, control dinámico de arqueros | 2023 | [PR] | 10.3390/e25101414 | Dinámica de la mano del arco en draw |
| 17 | Sharma et al., shot detection raquetas | 2018 | [Preprint] | arxiv.org/abs/1805.05456 | Smartwatch muñeca, IMU+audio, 95.6 % |
| 18 | Head impacts SVM, Sci. Reports | 2017 | [PR] | 10.1038/s41598-017-17864-3 | Features 10–30 Hz, <10 features, 87/93 % |
| 19 | Catch detection CNN, Sensors | 2020 | [PR] | 10.3390/s20236722 | 93 %; mag + accel son las señales clave |
| 20 | Boxing punch classification, IoT | 2020 | [PR] | 10.3390/iot1020021 | SVM por atleta 0.96 con muñecas |
| 21 | Punch Trackers, Sensors | 2021 | [PR] | 10.3390/s21092968 | Trackers comerciales: sesgos por tipo/nivel |
| 22 | Karate punches CNN, IEEE Access | 2021 | [PR] | 10.1109/ACCESS.2021.3118038 | Solo accel de muñeca, 0.96 acc, clase "sin golpe" |
| 23 | Tennis IMU, IWSSIP | 2016 | [PR] | 10.1109/IWSSIP.2016.7502764 | Detección por accel + clasificación por gyro, 98.1 % |
| 24 | Tennis activities, Sensors | 2019 | [PR] | 10.3390/s19225004 | Usuario nuevo nunca visto >96.5 % |
| 25 | Badminton accel, Sensors | 2020 | [PR] | 10.3390/s20174685 | 50 Hz accel-only 86 %; estudio de frecuencias |
| 26 | MultiSenseBadminton, Scientific Data | 2024 | [PR] | 10.1038/s41597-024-03144-z | Dataset 7,763 swings / 25 jugadores |
| 27 | uLift, IEEE Access | 2024 | [PR] | 10.1109/ACCESS.2024.3363437 | 1 accel muñeca: autocorrelación + picos + DTW |
| 28 | Gym jerárquico, IEEE IoT-J | 2018 | [PR] | 10.1109/JIOT.2018.2846359 | Two-stage: one-class SVM + NN/HMM |
| 29 | uWave, PerCom | 2009 | [PR] | 10.1109/PERCOM.2009.4912759 | DTW 1 plantilla, 98.6 %, personalización |
| 30 | Gesture customization few-shot, CHI | 2022 | [PR] | 10.1145/3491102.3501904 | 1/3/5 shots → 55/83/87 % |
| 31 | On-wrist fall detection, Sensors | 2018 | [PR] | 10.3390/s18051350 | Reglas ≈ NN en muñeca; SVM especificidad |
| 32 | EvenT-ML, Sensors | 2018 | [PR] | 10.3390/s18010020 | Alineación de ventana al evento, −78× coste |
| 33 | SmartFall, Sensors | 2018 | [PR] | 10.3390/s18103363 | DL sobre accel cruda de smartwatch |
| 34 | Paso adaptativo, Sensors | 2016 | [PR] | 10.3390/s16091423 | Reglas adaptativas de forma del pico |
| 35 | Air pistol tremor, Sensors | 2024 | [PR] | 10.3390/s24082438 | Tremor mano ↔ score en tiro olímpico |
| 36 | Precision shooting biofeedback, Procedia CS | 2019 | [PR] | 10.1016/j.procs.2019.01.228 | Fases aiming/firing/post-firing, suspender tiro malo |
| 37 | Mag disturbance y heading, Sensors | 2018 | [PR] | 10.3390/s18010076 | Efectos de distorsión magnética en heading |
| 38 | AHRS bajo distorsión magnética, Sensors | 2014 | [PR] | 10.3390/s141120008 | Mitigación de distorsión del mag |
| 39 | Bao & Intille, Pervasive | 2004 | [PR] | 10.1007/978-3-540-24646-6_1 | Clásico de features HAR multi-ubicación |
| 40 | Karantonis et al., IEEE T-ITAB | 2006 | [PR] | 10.1109/TITB.2005.856864 | Clasificación en tiempo real separando gravedad |
| 41 | Golf single wrist IMU, Sci. Reports | 2024 | [PR] | 10.1038/s41598-024-59949-w | Swing tracking con 1 IMU de muñeca |

**Huecos de literatura confirmados (para no dar por sentado lo que no existe):** dirección y magnitud en g del jolt de suelta en muñeca; detección del let-down con inerciales; uso del mag como veto de heading en detección de eventos; detección del clicker con acelerómetro; anchura en ms del pulso de suelta en muñeca. Todos requieren medición propia con las capturas de ArcheryWatch.
