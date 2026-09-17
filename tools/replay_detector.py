"""Reproduce el detector causal v2. CSV t_ms,x_mg,y_mg,z_mg; no certifica precisión.

Etiquetas JSON: [{"t_ms": 1234, "label": "shot"}, ...], obtenidas de vídeo o anotación
independiente. Las marcas de calibración delimitan intervalos, no instantes de suelta.
"""
import argparse
import csv
import json
import math
import statistics
from pathlib import Path


def replay(rows, rate=100, threshold=3200):
    size, stable = math.ceil(rate * .5), max(1, math.ceil(rate * .5) - math.ceil(rate * .08))
    gravity, index, count, dec, ring = [1000.] * size, 0, 0, 0, []
    stride, total, last, active, quiet, output = math.ceil(rate / 20), 1000. * size, -1e6, None, None, []
    previous = None
    for t, x, y, z in rows:
        if previous is not None and t <= previous:
            raise ValueError('Timestamps deben ser estrictamente crecientes')
        if previous is not None and t - previous > 2000:
            if active:
                active['incomplete'] = True
                output.append(active)
                active = None
            gravity, index, count, total, ring, dec = [1000.] * size, 0, 0, 1000. * size, [], 0
        previous = t
        magnitude = math.sqrt(x*x + y*y + z*z)
        deviation = magnitude - total / size
        old = [gravity[(index+k) % size] for k in range(stable)]
        if active is None and count >= size and len(ring) >= 10 and deviation > threshold and t-last > 1500 and statistics.pstdev(old) < 450:
            active = dict(t_ms=t, peak_mg=deviation, settle_ms=None, metric=2,
                          aim_score=max(0, min(100, 100-statistics.pstdev(gravity)/10)),
                          instab_mg=statistics.pstdev(ring), decision_ms=t+2000)
            last, quiet = t, None
        elif active is not None:
            active['peak_mg'] = max(active['peak_mg'], deviation)
            if active['settle_ms'] is None and t-last > 50:
                if abs(deviation) < 300:
                    quiet = t if quiet is None else quiet
                    if t-quiet >= 150:
                        active['settle_ms'] = quiet-last
                else:
                    quiet = None
            if t-last >= 2000:
                output.append(active)
                active = None
        total += magnitude-gravity[index]
        gravity[index], index, count = magnitude, (index+1) % size, min(size, count+1)
        if dec == 0:
            ring = (ring+[magnitude])[-64:]
        dec = (dec+1) % stride
    if active:
        active['incomplete'] = True
        output.append(active)
    return output


def evaluate(shots, labels, tolerance=300):
    truth = [e['t_ms'] for e in labels if e.get('label') == 'shot']
    remaining, errors, duplicates = list(truth), [], 0
    for shot in shots:
        t = shot['t_ms']
        nearest = min(remaining, key=lambda x: abs(x-t), default=None)
        if nearest is not None and abs(nearest-t) <= tolerance:
            errors.append(t-nearest)
            remaining.remove(nearest)
        elif any(abs(x-t) <= tolerance for x in truth):
            duplicates += 1
    tp, fp, fn = len(errors), len(shots)-len(errors), len(remaining)
    precision, recall = tp/(tp+fp) if tp+fp else None, tp/(tp+fn) if tp+fn else None
    return dict(true_positives=tp, false_positives=fp, missed=fn, duplicates=duplicates,
                precision=precision, recall=recall, timing_errors_ms=errors,
                tolerance_ms=tolerance, ground_truth_shots=len(truth))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path)
    parser.add_argument('--labels', type=Path)
    parser.add_argument('--rate', type=int, default=100)
    parser.add_argument('--threshold', type=float, default=3200)
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    if not 20 <= args.rate <= 100 or args.threshold <= 0:
        parser.error('rate debe estar entre 20 y 100; threshold debe ser positivo')
    with args.csv.open(encoding='utf-8-sig', newline='') as stream:
        rows = [tuple(float(r[k]) for k in ('t_ms','x_mg','y_mg','z_mg')) for r in csv.DictReader(stream)]
    shots = replay(rows, args.rate, args.threshold)
    report = dict(detector='causal-v2', rate=args.rate, threshold=args.threshold, shots=shots)
    if args.labels:
        report['validation'] = evaluate(shots, json.loads(args.labels.read_text(encoding='utf-8-sig')))
    else:
        report['validation'] = 'Sin etiquetas independientes: no se puede calcular precisión'
    text = json.dumps(report, indent=2, ensure_ascii=False)
    if args.out:
        args.out.write_text(text, encoding='utf-8')
    else:
        print(text)


if __name__ == '__main__':
    main()
