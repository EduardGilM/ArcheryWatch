/* Valor de la flecha (diana), aparte de la estabilidad aim_score.
   result.impact queda libre para marcar después el punto en la diana. */
const Score = {
  VALUES: ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'],
  GROUPS: [{id: 'x10', label: 'X-10'}, {id: '98', label: '9-8'}, {id: 'low', label: '≤7'}, {id: 'm', label: 'M'}],
  MIN: 4,
  points(value) {
    if (value === 'X' || value === '10') return 10;
    if (value === 'M') return 0;
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= 9 ? n : null;
  },
  groupOf(value) {
    if (value === 'X' || value === '10') return 'x10';
    if (value === '9' || value === '8') return '98';
    if (value === 'M') return 'm';
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= 7 ? 'low' : null;
  },
  set(shot, value) {
    if (!shot || shot.candidate) return false;
    if (value == null || value === '') {
      if (!shot.result) return true;
      const impact = shot.result.impact;
      if (impact == null) delete shot.result;
      else shot.result = {impact};
      return true;
    }
    const key = String(value);
    if (this.points(key) == null) return false;
    const impact = shot.result && shot.result.impact;
    shot.result = impact == null ? {value: key} : {value: key, impact};
    return true;
  },
  // El mismo número que la ficha llama «Tiempo de tiro» cuando el reloj mandó draw_ms.
  shotSeconds(shot) {
    return shot && Number.isFinite(shot.draw_ms) && shot.draw_ms >= 0 ? (shot.draw_ms + 1200) / 1000 : null;
  },
  totals(shots) {
    const rows = (shots || []).filter(s => s && !s.candidate);
    const scored = rows.filter(s => this.points(s.result && s.result.value) != null);
    const sum = scored.reduce((n, s) => n + this.points(s.result.value), 0);
    return {
      arrows: rows.length,
      scored: scored.length,
      score: scored.length ? sum : null,
      avg: scored.length ? sum / scored.length : null,
      x: scored.filter(s => s.result.value === 'X').length,
      ten: scored.filter(s => s.result.value === '10').length
    };
  },
  totalsLine(t) {
    if (!t || !t.scored) return '';
    const avg = Math.round(t.avg * 10) / 10;
    const avgText = Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
    const tens = t.ten === 1 ? '1 diez' : t.ten + ' dieces';
    return t.score + ' puntos · media ' + avgText + ' · ' + t.x + ' X · ' + tens;
  },
  groups(shots) {
    const buckets = this.GROUPS.map(g => ({...g, n: 0, aim: [], shot_s: [], settle: [], hr: []}));
    const byId = {};
    buckets.forEach(g => { byId[g.id] = g; });
    for (const s of shots || []) {
      if (!s || s.candidate) continue;
      const id = this.groupOf(s.result && s.result.value);
      if (!id) continue;
      const g = byId[id];
      g.n++;
      if (Number.isFinite(s.aim_score)) g.aim.push(s.aim_score);
      const sec = this.shotSeconds(s);
      if (sec != null) g.shot_s.push(sec);
      if (Number.isFinite(s.settle_ms)) g.settle.push(s.settle_ms);
      if (Number.isFinite(s.hr_bpm)) g.hr.push(s.hr_bpm);
    }
    const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    return buckets.map(g => ({
      id: g.id, label: g.label, n: g.n,
      aim: mean(g.aim), aim_n: g.aim.length, aim_min: g.aim.length ? Math.min(...g.aim) : null,
      shot_s: mean(g.shot_s), shot_n: g.shot_s.length,
      settle: mean(g.settle), settle_n: g.settle.length,
      hr: mean(g.hr), hr_n: g.hr.length
    }));
  },
  groupLine(g) {
    if (!g || !g.n) return '';
    const bits = [g.n + ' flecha' + (g.n === 1 ? '' : 's')];
    if (g.aim_n) bits.push('estabilidad ' + Math.round(g.aim));
    if (g.shot_n) bits.push('tiro ' + g.shot_s.toFixed(1) + ' s');
    if (g.settle_n) bits.push('estabilización ' + Math.round(g.settle) + ' ms');
    if (g.hr_n) bits.push('pulso ' + Math.round(g.hr));
    return g.label + ' · ' + bits.join(' · ');
  },
  sentence(g) {
    const bits = [];
    if (g.shot_n >= this.MIN) {
      const lo = Math.floor(g.shot_s), hi = Math.ceil(g.shot_s);
      bits.push(lo === hi ? 'unos ' + lo + ' s de tiro' : lo + '-' + hi + ' s de tiro');
    }
    if (g.aim_n >= this.MIN) bits.push(g.aim_min >= 80 ? 'estabilidad ≥80' : 'estabilidad media ' + Math.round(g.aim));
    return bits.length ? 'Tus ' + g.label + ' salen con ' + bits.join(' y ') + '.' : '';
  },
  insight(shots) {
    const groups = this.groups(shots);
    const ready = g => g.n >= this.MIN && (g.aim_n >= this.MIN || g.shot_n >= this.MIN) && this.sentence(g);
    const good = groups.find(g => g.id === 'x10' && ready(g)) || groups.find(ready);
    if (!good) return {enough: false, text: 'Hacen falta al menos 4 flechas en un mismo grupo de valor, con estabilidad o tiempo de tiro, para cruzarlas con la ejecución.'};
    return {enough: true, text: this.sentence(good)};
  }
};
if (typeof module !== 'undefined') module.exports = Score;
