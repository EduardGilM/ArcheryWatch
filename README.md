# ArcheryWatch

Detección de tiros de arquería en tiempo real con un Garmin Forerunner 165 y visualización en vivo en Android.

- **Reloj (Connect IQ / Monkey C)**: detecta la suelta por acelerómetro (energía/jerk + ventana de apuntado quieta), segmenta el tiro (apertura → apunte → suelta → follow-through), mide brújula (yaw real), pulso e intervalos RR, y envía cada flecha por BLE vía Garmin Connect.
- **Móvil (APK sin Gradle)**: servicio en primer plano que recibe las flechas en vivo (pantalla apagada incluida) y una interfaz de análisis: traza de apunte en la diana con fases coloreadas, reproducción del tiro, magnitud en escala log, estabilidad/deriva, tiempo de tiro, radio de apunte, sets automáticos, historial y progreso.
- **Calibración**: 3 tiros por arco — umbral = mediana de tus picos, guardado por arco con nombre.

Estructura: `watchapp/` (app del reloj), `mobile/` (web de la app), `android/` (envoltorio APK + servicio ConnectIQ), `tools/` (scripts), `docs/` (investigación y competencia), `CONTINUIDAD.md` (bitácora de ingeniería del proyecto).

Builds: `tools/ciq/sdk/bin/monkeyc.bat -f watchapp/monkey.jungle -d fr165 -y watchapp/developer.der -o watchapp/build/AW.prg` (requiere el SDK de Connect IQ en `tools/ciq`) · `bash android/build.sh` (requiere build-tools 35).
