/* Trayectoria del visor. El FR165 no tiene giroscopio: la posición integrada (qx/qy)
   deriva decenas de cm. Lo que se dibuja es el ángulo, o el arco de un brazo rígido. */
const Trace = {
  ARM_M: 0.65,
  // Diferencia de yaw en (-180, 180]: el salto ±180° no cuenta como una vuelta entera.
  yawDelta(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
    let d = (a - b) % 360;
    if (d >= 180) d -= 360;
    else if (d < -180) d += 360;
    return d === 0 ? 0 : d;
  },
  circMean(vals) {
    let s = 0, c = 0, n = 0;
    for (const v of vals || []) {
      if (!Number.isFinite(v)) continue;
      const r = v * Math.PI / 180;
      s += Math.sin(r); c += Math.cos(r); n++;
    }
    if (!n || (s === 0 && c === 0)) return 0;
    return Math.atan2(s, c) * 180 / Math.PI;
  },
  // cm de arco por cada grado: Δ(cm) = L(m) · Δ(rad) · 100.
  cmPerDeg(armM) {
    const L = Number(armM);
    const m = Number.isFinite(L) && L > 0 ? L : this.ARM_M;
    return m * Math.PI / 180 * 100;
  },
  armCm(dyawDeg, dpitchDeg, armM) {
    const k = this.cmPerDeg(armM);
    return [(Number.isFinite(dyawDeg) ? dyawDeg : 0) * k, (Number.isFinite(dpitchDeg) ? dpitchDeg : 0) * k];
  },
  prefs(storage) {
    try {
      const p = JSON.parse(storage.getItem('awPrefs') || '{}') || {};
      const trace = p.trace === 'cm' || p.trace === 'raw' ? p.trace : 'deg';
      let arm = Number(p.armM);
      if (!Number.isFinite(arm) || arm < 0.3 || arm > 1.2) arm = this.ARM_M;
      return {trace, armM: arm};
    } catch (e) { return {trace: 'deg', armM: this.ARM_M}; }
  },
  save(storage, next) {
    const cur = this.prefs(storage);
    const trace = next && (next.trace === 'deg' || next.trace === 'cm' || next.trace === 'raw') ? next.trace : cur.trace;
    const raw = String(next && next.armM != null ? next.armM : cur.armM).trim().replace(',', '.');
    let arm = raw === '' ? NaN : Number(raw);
    if (!Number.isFinite(arm)) arm = cur.armM;
    else arm = Math.min(1.2, Math.max(0.3, Math.round(arm * 100) / 100));
    const saved = {trace, armM: arm};
    try { storage.setItem('awPrefs', JSON.stringify(saved)); } catch (e) {}
    return saved;
  }
};
if (typeof module !== 'undefined') module.exports = Trace;
