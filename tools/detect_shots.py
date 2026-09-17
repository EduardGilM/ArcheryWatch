"""Prototipo histórico (v1). Para reloj v2 usar replay_detector.py.

Detector de tiros de arquería sobre señal de acelerómetro (mG, ~100 Hz).

Entrada: CSV t_ms,x_mg,y_mg,z_mg (export del FIT del reloj).
Salida: JSON con tiros detectados y métricas por tiro.
Detección: impulso = |a| desviándose de la gravedad local (>umbral) con periodo refractario.
"""
import csv
import json
import statistics
import sys
from pathlib import Path

THRESHOLD_MG = 3200.0   # desviación respecto a gravedad local (parámetro histórico; no valida el reloj v2)
REFRACTORY_MS = 1500.0  # un tiro enmascara el siguiente durante 1,5 s
PRE_MS = 3000.0         # ventana pre-suelta
POST_MS = 2000.0        # ventana post-suelta
WINDOW_GRAV_MS = 500.0  # gravedad local = media móvil de 0,5 s


def load(path):
    rows = []
    with open(path, newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            rows.append((int(r["t_ms"]), float(r["x_mg"]), float(r["y_mg"]), float(r["z_mg"])))
    return rows


def detect(rows):
    n = len(rows)
    t = [r[0] for r in rows]
    mag = [(r[1] ** 2 + r[2] ** 2 + r[3] ** 2) ** 0.5 for r in rows]
    # gravedad local por media móvil
    grav = []
    half = int(WINDOW_GRAV_MS // 10 // 2)
    for i in range(n):
        lo, hi = max(0, i - half), min(n, i + half + 1)
        grav.append(statistics.fmean(mag[lo:hi]))
    dev = [m - g for m, g in zip(mag, grav)]

    shots, last = [], -1e9
    for i, d in enumerate(dev):
        if d > THRESHOLD_MG and t[i] - last > REFRACTORY_MS:
            last = t[i]
            shots.append(i)
    return t, mag, grav, dev, shots


def shot_stats(t, rows, mag, dev, i):
    pre = [j for j in range(len(t)) if t[i] - PRE_MS <= t[j] <= t[i]]
    post = [j for j in range(len(t)) if t[i] < t[j] <= t[i] + POST_MS]
    hold_mag = [mag[j] for j in pre]
    instability = statistics.pstdev(hold_mag) if len(hold_mag) > 1 else 0.0
    peak = max((dev[j] for j in pre + post), default=0.0)
    # pico y tiempo hasta volver a <10% del pico (asentamiento)
    j_peak = max(pre + post, key=lambda j: dev[j])
    settle_ms = None
    for j in range(j_peak, len(dev)):
        if dev[j] < peak * 0.1:
            settle_ms = t[j] - t[i]
            break
    # inclinación durante el apuntado: gravedad proyectada en x,y (diagrama de puntería)
    mx = statistics.fmean(rows[j][1] for j in pre)
    my = statistics.fmean(rows[j][2] for j in pre)
    tilt_x = [round(rows[j][1] - mx) for j in pre]
    tilt_y = [round(rows[j][2] - my) for j in pre]
    hold_pts = [j for j in pre if t[j] <= t[i] - 500]  # últimos 500 ms estables
    aim_score = round(100 - statistics.pstdev([mag[j] for j in hold_pts]) / 10) if len(hold_pts) > 2 else 0
    return {
        "t_ms": t[i],
        "peak_mg": round(peak),
        "instab_mg": round(instability),
        "settle_ms": settle_ms,
        "aim_score": max(0, min(100, aim_score)),
        "tilt_x": tilt_x,
        "tilt_y": tilt_y,
        "window": {
            "pre": [round(t[j] - t[i]) for j in pre],
            "mag_pre": [round(mag[j]) for j in pre],
            "post": [round(t[j] - t[i]) for j in post],
            "mag_post": [round(mag[j]) for j in post],
        },
    }


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "captures/aw-session1.csv")
    dst = Path(sys.argv[2] if len(sys.argv) > 2 else "captures/aw-session1-shots.json")
    rows = load(src)
    t, mag, grav, dev, shots = detect(rows)
    out = {
        "source": src.name,
        "samples": len(rows),
        "duration_s": round((t[-1] - t[0]) / 1000.0, 2),
        "threshold_mg": THRESHOLD_MG,
        "shots": [shot_stats(t, rows, mag, dev, i) for i in shots],
    }
    dst.write_text(json.dumps(out), encoding="utf-8")
    print(f"{len(shots)} tiros(s) detectados -> {dst}")
    for k, s in enumerate(out["shots"], 1):
        print(f"  tiro {k}: t={s['t_ms']}ms pico={s['peak_mg']}mG instab={s['instab_mg']}mG asentamiento={s['settle_ms']}ms")


if __name__ == "__main__":
    main()
