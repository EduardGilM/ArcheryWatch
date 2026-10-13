/* Perfil, temas, tandas y tarjetas. El ámbar sigue siendo el acento por defecto. */
const StudioScore = (typeof module !== 'undefined') ? require('./score.js') : Score;
const StudioGoals = (typeof module !== 'undefined') ? require('./goals.js') : Goals;
const studioSans = "'Geist', system-ui, sans-serif";
const studioNum = "'Barlow Condensed', sans-serif";
const studioGeist = "'Geist', system-ui, -apple-system, sans-serif";
const Studio = {
  lens: 'all',
  picks: new Set(),
  arrows: new Set(),
  dayIds: new Set(),
  picking: false,
  shareOpen: false,
  shareKind: 'session',
  card: {layout: 'session', tilt: {x: 0, y: 0}, finish: 'glass', preset: 'campo', photo: ''},
  FINISHES: [
    {id: 'glass', name: 'Cristal'},
    {id: 'editorial', name: 'Editorial'},
    {id: 'obsidian', name: 'Obsidiana'}
  ],
  PRESETS: [
    {id: 'campo', name: 'Campo', src: 'photos/campo.js', focus: 0.4},
    {id: 'diana', name: 'Diana', src: 'photos/diana.js', focus: 0.45},
    {id: 'visor', name: 'Visor', src: 'photos/visor.js', focus: 0.35}
  ],
  THEMES: [
    {id: 'amber', name: 'Ámbar', acc: '#FF8A1F', acc2: '#FFC15E', glow: 'rgba(255,138,31,.28)', ink: '#1b0f05', soft: 'rgba(255,138,31,.12)', line: 'rgba(255,138,31,.45)'},
    {id: 'electric', name: 'Azul', acc: '#2F6BFF', acc2: '#9DB6FF', glow: 'rgba(47,107,255,.35)', ink: '#06101f', soft: 'rgba(47,107,255,.16)', line: 'rgba(47,107,255,.55)'},
    {id: 'cyan', name: 'Cian', acc: '#00E5FF', acc2: '#B8FBFF', glow: 'rgba(0,229,255,.32)', ink: '#041416', soft: 'rgba(0,229,255,.14)', line: 'rgba(0,229,255,.55)'},
    {id: 'lime', name: 'Lima', acc: '#C6FF3D', acc2: '#E7FF9C', glow: 'rgba(198,255,61,.28)', ink: '#141a04', soft: 'rgba(198,255,61,.14)', line: 'rgba(198,255,61,.5)'},
    {id: 'magenta', name: 'Magenta', acc: '#FF2BD6', acc2: '#FFA6EE', glow: 'rgba(255,43,214,.3)', ink: '#1a0614', soft: 'rgba(255,43,214,.14)', line: 'rgba(255,43,214,.5)'},
    {id: 'vivid', name: 'Naranja', acc: '#FF4D00', acc2: '#FFB088', glow: 'rgba(255,77,0,.32)', ink: '#1a0a04', soft: 'rgba(255,77,0,.14)', line: 'rgba(255,77,0,.5)'},
    {id: 'violet', name: 'Violeta', acc: '#7B2BFF', acc2: '#D2B3FF', glow: 'rgba(123,43,255,.32)', ink: '#100818', soft: 'rgba(123,43,255,.16)', line: 'rgba(123,43,255,.55)'},
    {id: 'red', name: 'Rojo', acc: '#FF2430', acc2: '#FF9AA0', glow: 'rgba(255,36,48,.32)', ink: '#1a0608', soft: 'rgba(255,36,48,.14)', line: 'rgba(255,36,48,.5)'},
    {id: 'gold', name: 'Oro', acc: '#E4C36A', acc2: '#F6E7B4', glow: 'rgba(228,195,106,.28)', ink: '#1a1406', soft: 'rgba(228,195,106,.14)', line: 'rgba(228,195,106,.5)'},
    {id: 'ice', name: 'Hielo', acc: '#7EB6FF', acc2: '#D5E8FF', glow: 'rgba(126,182,255,.28)', ink: '#071018', soft: 'rgba(126,182,255,.14)', line: 'rgba(126,182,255,.5)'}
  ],
  LAYOUTS: [
    {id: 'session', name: 'Sesión'},
    {id: 'profile', name: 'Perfil'},
    {id: 'best', name: 'Mejor tanda'}
  ],
  SIZES: {card: {w: 1080, h: 1350}},
  theme() {
    let id = 'amber';
    try {
      const saved = localStorage.getItem('awTheme');
      if (this.THEMES.some(t => t.id === saved)) id = saved;
    } catch (e) {}
    return this.THEMES.find(t => t.id === id) || this.THEMES[0];
  },
  setTheme(id) {
    const theme = this.THEMES.find(t => t.id === id) || this.THEMES[0];
    try { localStorage.setItem('awTheme', theme.id); } catch (e) {}
    this.applyTheme();
    if (typeof render === 'function') render();
  },
  applyTheme() {
    const theme = this.theme();
    if (typeof document !== 'undefined' && document.documentElement) {
      const root = document.documentElement.style;
      root.setProperty('--acc', theme.acc);
      root.setProperty('--acc2', theme.acc2);
      root.setProperty('--glow', theme.glow);
      root.setProperty('--acc-ink', theme.ink);
      root.setProperty('--acc-soft', theme.soft);
      root.setProperty('--acc-line', theme.line);
    }
    if (typeof themeAcc !== 'undefined') themeAcc = theme.acc;
    if (typeof C !== 'undefined' && C) { C.mark = theme.acc; C.rel = theme.acc; }
    if (typeof ACOLORS !== 'undefined' && ACOLORS) ACOLORS[0] = theme.acc;
    return theme;
  },
  pool(shots, lens) {
    const rows = shots || [];
    const mode = lens || this.lens || 'all';
    if (mode !== 'warm' && mode !== 'score') return rows;
    return rows.filter(s => s && s.phase === mode);
  },
  dayKey(ms) {
    const d = new Date(ms);
    if (!Number.isFinite(d.getTime())) return '';
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  },
  tag(session, phase, opts) {
    const o = opts || {};
    const sets = new Set((o.sets || []).map(v => String(v)));
    const times = new Set((o.times || []).map(Number));
    (session && session.shots || []).forEach(s => {
      if (!s) return;
      if (!o.all && !sets.has(String(s.set_id)) && !times.has(Number(s.t_ms))) return;
      if (phase === 'warm' || phase === 'score') s.phase = phase;
      else delete s.phase;
    });
    return session;
  },
  applyPhase(session, phase, setIds) {
    return this.tag(session, phase, {sets: setIds});
  },
  startRound(session, phase) {
    if (!session) return session;
    const mark = phase === 'warm' || phase === 'score' ? phase : '';
    if (mark) session.phase = mark;
    else delete session.phase;
    const shots = session.shots || [];
    const real = shots.filter(s => s && !s.candidate);
    let setId = session.currentSet;
    const has = setId != null && real.some(s => String(s.set_id) === String(setId));
    if (!has) setId = real.length ? real[real.length - 1].set_id : (shots.length ? shots[shots.length - 1].set_id : null);
    if (setId != null) this.applyPhase(session, mark, [setId]);
    return session;
  },
  scorePool(shots) {
    const real = (shots || []).filter(s => s && !s.candidate);
    const marked = real.filter(s => s.phase === 'score');
    return marked.length ? marked : real.filter(s => s.phase !== 'warm');
  },
  cardDate(ms) {
    const d = new Date(ms);
    if (!Number.isFinite(d.getTime())) return '';
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  },
  cardCopy(session, when) {
    const indoor = !!(session && session.mode === 'Indoor');
    return {
      brand: 'ARCHERY WATCH',
      kicker: indoor ? 'SESIÓN INDOOR' : (session && session.mode === 'Outdoor' ? 'SESIÓN OUTDOOR' : 'SESIÓN'),
      date: this.cardDate(when)
    };
  },
  breakdown(shots) {
    const counts = new Map();
    (shots || []).forEach(s => {
      if (!s || s.candidate) return;
      const v = s.result && s.result.value;
      if (v == null || v === '') return;
      if (StudioScore.points(v) == null && v !== 'M') return;
      counts.set(String(v), (counts.get(String(v)) || 0) + 1);
    });
    const order = ['X', '11', '10', '9', '8', '7', '6', 'M'];
    const parts = [];
    order.forEach(v => {
      const n = counts.get(v);
      if (!n) return;
      parts.push(v === 'X' || v === 'M' ? n + ' ' + v : n + '×' + v);
      counts.delete(v);
    });
    return parts.join(' · ');
  },
  bestSet(shots) {
    const pool = this.scorePool(shots);
    const order = [];
    const map = new Map();
    pool.forEach(s => {
      const id = String(s.set_id ?? '');
      if (!map.has(id)) { map.set(id, []); order.push(id); }
      map.get(id).push(s);
    });
    let best = null;
    order.forEach((id, i) => {
      const rows = map.get(id);
      const scored = rows.filter(s => StudioScore.points(s.result && s.result.value) != null);
      if (!scored.length) return;
      const sum = scored.reduce((n, s) => n + StudioScore.points(s.result.value), 0);
      if (!best || sum > best.sum) best = {id, index: i + 1, sum, rows};
    });
    return best;
  },
  isRecord(score, peers) {
    if (score == null) return false;
    let best = null;
    (peers || []).forEach(s => {
      if (!s) return;
      const t = StudioScore.totals((s.shots || []).filter(x => x && !x.candidate));
      if (t.score == null) return;
      best = best == null ? t.score : Math.max(best, t.score);
    });
    return best == null || score > best;
  },
  sharedFormat(sessions) {
    const formats = new Set();
    (sessions || []).forEach(s => {
      if (!s) return;
      const scored = (s.shots || []).some(a => a && !a.candidate && StudioScore.points(a.result && a.result.value) != null);
      if (!scored) return;
      formats.add(StudioScore.formatOf(s) || 'pad');
    });
    if (formats.size !== 1) return null;
    const only = [...formats][0];
    return only === 'pad' ? null : only;
  },
  radar(shots, format) {
    const pool = this.scorePool(shots);
    const scored = pool.filter(s => StudioScore.points(s.result && s.result.value) != null);
    const totals = StudioScore.totals(pool);
    const clamp = v => Math.max(0, Math.min(100, v));
    const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    const sd = a => {
      if (!a.length) return null;
      const m = mean(a);
      return Math.sqrt(a.reduce((n, x) => n + (x - m) ** 2, 0) / a.length);
    };
    const axis = (id, label, value, text, n) => ({
      id, label, n, thin: n < 8,
      value: n < 8 || value == null ? null : value,
      text: n < 8 || value == null ? '–' : text
    });
    const precisionN = scored.length;
    const mark = format === 'wa' ? '10' : format === 'lancaster' ? '11' : 'X';
    const precision = precisionN ? scored.filter(s => s.result.value === mark).length / precisionN * 100 : null;
    const pts = StudioScore.impacts(scored);
    let group = null;
    if (pts.length >= 2) {
      const rs = pts.map(p => Math.hypot(p.x, p.y));
      const spread = sd(rs);
      const tight = 0.25 * 0.2, wide = 0.6;
      group = spread <= tight ? 100 : spread >= wide ? 0 : clamp((1 - (spread - tight) / (wide - tight)) * 100);
    }
    let vertical = null;
    if (pts.length >= 2) {
      const sx = sd(pts.map(p => p.x)) || 0;
      const sy = sd(pts.map(p => p.y)) || 0;
      const ratio = sx < 1e-6 ? (sy < 1e-6 ? 1 : 2) : sy / sx;
      vertical = ratio <= 1 ? 100 : ratio >= 2 ? 0 : clamp((2 - ratio) * 100);
    }
    const draws = pool.map(s => s.draw_ms).filter(v => Number.isFinite(v) && v >= 0);
    const windowPct = draws.length ? draws.filter(ms => ms >= 6000 && ms <= 8000).length / draws.length * 100 : null;
    const hrs = pool.map(s => s.hr_bpm).filter(v => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
    let pulse = null, pulseMed = null;
    if (hrs.length) {
      const mid = Math.floor(hrs.length / 2);
      pulseMed = hrs.length % 2 ? hrs[mid] : (hrs[mid - 1] + hrs[mid]) / 2;
      pulse = pulseMed <= 70 ? 100 : pulseMed >= 100 ? 0 : clamp((100 - pulseMed) / 30 * 100);
    }
    const order = [];
    const bySet = new Map();
    pool.forEach(s => {
      const id = String(s.set_id ?? '');
      if (!bySet.has(id)) { bySet.set(id, []); order.push(id); }
      bySet.get(id).push(s);
    });
    const packed = order.map(id => {
      const rows = bySet.get(id);
      const p = rows.map(s => StudioScore.points(s.result && s.result.value)).filter(v => v != null);
      const a = rows.map(s => s.aim_score).filter(Number.isFinite);
      return {
        id,
        pts: p.length ? p.reduce((x, y) => x + y, 0) / p.length : null,
        sum: p.length ? p.reduce((x, y) => x + y, 0) : null,
        aim: a.length ? a.reduce((x, y) => x + y, 0) / a.length : null,
        n: rows.length
      };
    });
    let endure = null, endureN = 0;
    if (packed.length >= 4) {
      const first = packed.slice(0, 2), last = packed.slice(-2);
      endureN = [...first, ...last].reduce((n, s) => n + s.n, 0);
      const avg = (rows, key) => {
        const v = rows.map(r => r[key]).filter(x => x != null);
        return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null;
      };
      let a = avg(first, 'pts'), b = avg(last, 'pts');
      const flat = a != null && b != null && Math.abs(a - b) < 1e-6;
      if (a == null || b == null || !(a > 0) || flat) { a = avg(first, 'aim'); b = avg(last, 'aim'); }
      if (a != null && b != null && a > 0) {
        const ratio = b / a;
        endure = ratio >= 1 ? 100 : ratio <= 0.93 ? 0 : clamp((ratio - 0.93) / 0.07 * 100);
      }
    }
    const round = v => v == null ? '–' : String(Math.round(v));
    return {
      totals, sets: packed, pulseMed,
      axes: [
        axis('precision', 'Precisión', precision, precision == null ? '–' : Math.round(precision) + '%', precisionN),
        axis('group', 'Agrupación', group, round(group), pts.length),
        axis('vertical', 'Control vertical', vertical, round(vertical), pts.length),
        axis('window', 'Ventana de apunte', windowPct, windowPct == null ? '–' : Math.round(windowPct) + '%', draws.length),
        axis('pulse', 'Pulso al soltar', pulse, pulseMed == null ? '–' : Math.round(pulseMed) + ' lpm', hrs.length),
        axis('endure', 'Aguante', endure, round(endure), endureN)
      ]
    };
  },
  heatmap(sessions, now, weeks) {
    const nWeeks = weeks || 18;
    const when = now instanceof Date ? now : new Date(now || Date.now());
    const today = StudioGoals.daySerial(when);
    const parts = StudioGoals.localParts(when);
    if (today == null || !parts) return {weeks: nWeeks, start: 0, today: 0, cells: []};
    const dow = new Date(Date.UTC(parts.y, parts.m - 1, parts.d)).getUTCDay();
    const monday = today - (dow + 6) % 7;
    const start = monday - (nWeeks - 1) * 7;
    const counts = new Map();
    (sessions || []).forEach(s => {
      const day = StudioGoals.daySerial(s && s.id);
      if (day == null || day > today) return;
      const arrows = ((s && s.shots) || []).filter(x => x && !x.candidate).length;
      counts.set(day, (counts.get(day) || 0) + arrows);
    });
    const cells = [];
    for (let w = 0; w < nWeeks; w++) {
      for (let r = 0; r < 7; r++) {
        const day = start + w * 7 + r;
        const future = day > today;
        const n = future ? 0 : (counts.get(day) || 0);
        const level = !n ? 0 : n >= 60 ? 4 : n >= 30 ? 3 : n >= 12 ? 2 : 1;
        cells.push({day, w, r, n, level, future});
      }
    }
    return {weeks: nWeeks, start, today, cells};
  },
  profile() {
    const blank = {name: '', club: '', photo: ''};
    try {
      const raw = JSON.parse(localStorage.getItem('awProfile') || 'null');
      if (!raw || typeof raw !== 'object') return blank;
      return {
        name: String(raw.name || '').slice(0, 32),
        club: String(raw.club || '').slice(0, 40),
        photo: typeof raw.photo === 'string' && raw.photo.length < 300000 ? raw.photo : ''
      };
    } catch (e) { return blank; }
  },
  saveProfile(patch) {
    const next = {...this.profile(), ...patch};
    try { localStorage.setItem('awProfile', JSON.stringify({name: next.name, club: next.club, photo: next.photo})); } catch (e) {}
    return next;
  },
  historyShots() {
    if (typeof store === 'undefined') return [];
    const out = [];
    store.list().forEach(s => (s.shots || []).forEach(a => { if (a && !a.candidate) out.push(a); }));
    return out;
  },
  onSetClick(e) {
    if (!this.picking || !e || !e.target || !e.target.closest) return false;
    if (e.target.closest('.r') || e.target.closest('.modeSeg') || e.target.closest('#pickBar')) return false;
    if (e.target.closest('#setList summary') || e.target.closest('#setList .trendRow')) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      return true;
    }
    return false;
  }
};
if (typeof module !== 'undefined') module.exports = Studio;

function studioClearPick() {
  Studio.picking = false;
  Studio.picks.clear();
  Studio.arrows.clear();
  Studio.dayIds.clear();
}

function studioHaptic(el) {
  try { if (navigator.vibrate) navigator.vibrate([14, 28, 18]); } catch (e) {}
  if (!el || !el.classList) return;
  const node = el.classList.contains('trendRow') ? el : (el.closest && el.closest('details')) || el;
  node.classList.remove('wiggle');
  void node.offsetWidth;
  node.classList.add('wiggle');
}

function studioSessionIds(session) {
  const ids = [];
  const seen = new Set();
  (session && session.shots || []).forEach(s => {
    if (!s || s.set_id == null) return;
    const id = String(s.set_id);
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });
  return ids;
}

function studioSameDay(session) {
  if (!session || typeof store === 'undefined' || !store.list) return [];
  const key = Studio.dayKey(session.id);
  if (!key) return [];
  return store.list().filter(s => s && s.id !== session.id && Studio.dayKey(s.id) === key);
}

function studioSessionFull(session) {
  const ids = studioSessionIds(session);
  return ids.length > 0 && ids.every(id => Studio.picks.has(id)) && Studio.arrows.size === 0;
}

function studioPickCount() {
  let n = 0;
  const session = typeof displayedSession === 'function' ? displayedSession() : null;
  const cur = session && session.id;
  (session && session.shots || []).forEach(s => {
    if (!s) return;
    if (Studio.picks.has(String(s.set_id)) || (Number.isFinite(Number(s.t_ms)) && Studio.arrows.has(Number(s.t_ms)))) n++;
  });
  if (typeof store !== 'undefined' && store.list && Studio.dayIds.size) {
    store.list().forEach(s => {
      if (!s || s.id === cur || !Studio.dayIds.has(s.id)) return;
      (s.shots || []).forEach(a => { if (a) n++; });
    });
  }
  return n;
}

function studioToggleSet(sid) {
  if (sid == null) return;
  const setId = String(sid);
  const session = typeof displayedSession === 'function' ? displayedSession() : null;
  (session && session.shots || []).forEach(s => {
    if (s && String(s.set_id) === setId) Studio.arrows.delete(Number(s.t_ms));
  });
  if (Studio.picks.has(setId)) Studio.picks.delete(setId);
  else Studio.picks.add(setId);
}

function studioToggleArrow(t, sid) {
  const time = Number(t);
  if (!Number.isFinite(time)) return;
  const setId = sid == null ? '' : String(sid);
  if (setId && Studio.picks.has(setId)) {
    Studio.picks.delete(setId);
    const session = typeof displayedSession === 'function' ? displayedSession() : null;
    (session && session.shots || []).forEach(s => {
      if (!s || String(s.set_id) !== setId) return;
      const ms = Number(s.t_ms);
      if (Number.isFinite(ms) && ms !== time) Studio.arrows.add(ms);
    });
    Studio.arrows.delete(time);
    return;
  }
  if (Studio.arrows.has(time)) Studio.arrows.delete(time);
  else Studio.arrows.add(time);
}

function studioPickSession() {
  const session = typeof displayedSession === 'function' ? displayedSession() : null;
  const ids = studioSessionIds(session);
  const full = studioSessionFull(session) && Studio.dayIds.size === 0;
  Studio.arrows.clear();
  Studio.dayIds.clear();
  Studio.picks.clear();
  if (!full) ids.forEach(id => Studio.picks.add(id));
}

function studioPickDay() {
  const session = typeof displayedSession === 'function' ? displayedSession() : null;
  const ids = studioSessionIds(session);
  const others = studioSameDay(session);
  const full = studioSessionFull(session) && others.every(s => Studio.dayIds.has(s.id)) && Studio.dayIds.size === others.length;
  Studio.arrows.clear();
  Studio.picks.clear();
  Studio.dayIds.clear();
  if (full) return;
  ids.forEach(id => Studio.picks.add(id));
  others.forEach(s => Studio.dayIds.add(s.id));
}

function studioApplyPick(phase) {
  if (!studioPickCount()) {
    if (typeof notice === 'function') notice('Elige al menos una flecha.');
    return;
  }
  const sets = [...Studio.picks];
  const times = [...Studio.arrows];
  const days = new Set(Studio.dayIds);
  const current = typeof displayedSession === 'function' ? displayedSession() : null;
  const currentId = current && current.id;
  if (typeof store === 'undefined' || !store.list || !store.save) {
    if (current) Studio.tag(current, phase, {sets, times});
    studioClearPick();
    if (typeof render === 'function') render();
    return;
  }
  const L = store.list();
  L.forEach(s => {
    if (!s) return;
    if (s.id === currentId) Studio.tag(s, phase, {sets, times});
    else if (days.has(s.id)) Studio.tag(s, phase, {all: true});
  });
  store.save(L);
  const fresh = L.find(s => s.id === currentId);
  if (fresh && typeof historyMode !== 'undefined') {
    const shown = historyMode ? histId : (curSess && curSess.id);
    if (shown === fresh.id) {
      data = {shots: fresh.shots};
      if (!historyMode) curSess = fresh;
    }
  }
  studioClearPick();
  if (typeof render === 'function') render();
}

function studioMount() {
  if (typeof document === 'undefined' || !document.getElementById || Studio.mounted) return;
  Studio.mounted = true;
  const $ = id => document.getElementById(id);
  Studio.applyTheme();
  const profileNav = $('nProfile');
  if (profileNav) profileNav.onclick = () => show('Profile');
  const lens = $('lensBar');
  if (lens) lens.onclick = e => {
    const b = e.target.closest('[data-lens]');
    if (!b) return;
    Studio.lens = b.dataset.lens;
    if (typeof render === 'function') render();
  };
  const rounds = $('roundBar');
  if (rounds) rounds.onclick = e => {
    const b = e.target.closest('[data-round]');
    if (!b) return;
    studioCommit(s => Studio.startRound(s, b.dataset.round));
  };
  const list = $('setList');
  const root = $('vSession') || list;
  let hold = 0, suppress = false, x0 = 0, y0 = 0;
  if (list) {
    list.addEventListener('pointerdown', e => {
      if (!e.target.closest) return;
      if (e.target.closest('.modeSeg') || e.target.closest('.r') || e.target.closest('#pickBar')) return;
      const row = e.target.closest('.trendRow');
      const sum = e.target.closest('summary');
      if (!row && !sum) return;
      x0 = e.clientX; y0 = e.clientY;
      clearTimeout(hold);
      const box = (row || sum).closest('details');
      const sid = box && box.dataset.sid;
      const t = row && row.dataset.t;
      hold = setTimeout(() => {
        Studio.picking = true;
        if (row && t != null && t !== '') {
          const time = Number(t);
          if (Number.isFinite(time) && !(sid != null && Studio.picks.has(String(sid)))) Studio.arrows.add(time);
        } else if (sid != null) Studio.picks.add(String(sid));
        suppress = true;
        setTimeout(() => { suppress = false; }, 700);
        studioHaptic(row || sum);
        studioSync();
      }, 480);
    });
    const drop = e => {
      if (e && Math.hypot((e.clientX || 0) - x0, (e.clientY || 0) - y0) > 12) clearTimeout(hold);
    };
    list.addEventListener('pointermove', drop);
    list.addEventListener('pointerup', () => clearTimeout(hold));
    list.addEventListener('pointercancel', () => clearTimeout(hold));
    list.addEventListener('contextmenu', e => {
      if (e.target.closest && (e.target.closest('summary') || e.target.closest('.trendRow'))) e.preventDefault();
    });
  }
  if (root) {
    root.addEventListener('click', e => {
      if (!e.target.closest) return;
      if (suppress) {
        suppress = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const bulk = e.target.closest('[data-bulk]');
      if (bulk) {
        e.preventDefault();
        e.stopPropagation();
        if (bulk.dataset.bulk === 'done') { studioClearPick(); studioSync(); return; }
        studioApplyPick(bulk.dataset.bulk);
        return;
      }
      const scope = e.target.closest('[data-scope]');
      if (scope && Studio.picking) {
        e.preventDefault();
        e.stopPropagation();
        if (scope.dataset.scope === 'day') studioPickDay();
        else studioPickSession();
        studioSync();
        return;
      }
      if (!Studio.picking) return;
      if (e.target.closest('.r') || e.target.closest('#pickBar')) return;
      const row = e.target.closest('#setList .trendRow');
      if (row) {
        e.preventDefault();
        e.stopPropagation();
        const det = row.closest('details');
        studioToggleArrow(row.dataset.t, det && det.dataset.sid);
        studioSync();
        return;
      }
      const sum = e.target.closest('#setList summary');
      if (!sum) return;
      e.preventDefault();
      e.stopPropagation();
      studioToggleSet(sum.parentElement && sum.parentElement.dataset.sid);
      studioSync();
    }, true);
  }
  const swatches = $('themeSwatches');
  if (swatches) {
    swatches.innerHTML = Studio.THEMES.map(t => `<button type="button" data-theme="${t.id}" style="--sw:${t.acc}" aria-label="${t.name}"><i></i><small>${t.name}</small></button>`).join('');
    swatches.onclick = e => {
      const b = e.target.closest('[data-theme]');
      if (b) Studio.setTheme(b.dataset.theme);
    };
  }
  const layouts = $('shareLayouts');
  if (layouts) {
    layouts.innerHTML = Studio.LAYOUTS.map(t => `<button type="button" data-layout="${t.id}">${t.name}</button>`).join('');
    layouts.onclick = e => {
      const b = e.target.closest('[data-layout]');
      if (!b) return;
      Studio.card.layout = b.dataset.layout;
      studioDrawShare();
      studioSyncShare();
    };
  }
  const thumbs = $('shareThumbs');
  if (thumbs) thumbs.onclick = e => {
    const b = e.target.closest('[data-layout]');
    if (!b) return;
    Studio.card.layout = b.dataset.layout;
    studioDrawShare();
  };
  const stage = $('holoStage');
  if (stage) {
    stage.onpointerdown = e => { stage.setPointerCapture?.(e.pointerId); studioTiltFrom(stage, e); };
    stage.onpointermove = e => { if (e.buttons) studioTiltFrom(stage, e); };
    stage.onpointerup = () => studioTilt(0, 0);
    stage.onpointerleave = () => studioTilt(0, 0);
  }
  const gyroBtn = $('shareGyro');
  if (gyroBtn) gyroBtn.onclick = () => studioListenGyro(true);
  const finishBar = $('shareFinish');
  if (finishBar) finishBar.onclick = e => {
    const b = e.target.closest('[data-finish]');
    if (!b || !Studio.FINISHES.some(f => f.id === b.dataset.finish)) return;
    Studio.card.finish = b.dataset.finish;
    studioDrawShare();
  };
  const presets = $('sharePresets');
  if (presets) {
    presets.innerHTML = Studio.PRESETS.map(p => `<button type="button" data-preset="${p.id}"><i><img alt=""></i><small>${p.name}</small></button>`).join('');
    presets.onclick = e => {
      const b = e.target.closest('[data-preset]');
      if (!b) return;
      Studio.card.preset = b.dataset.preset;
      studioSetCardPhoto('');
    };
  }
  const cam = $('shareCam'), camFile = $('shareCamFile'), lib = $('shareLib'), libFile = $('shareLibFile');
  if (cam && camFile) cam.onclick = () => camFile.click();
  if (lib && libFile) lib.onclick = () => libFile.click();
  const onPhotoFile = file => { if (file) studioOpenCrop(file); };
  if (camFile) camFile.onchange = () => { onPhotoFile(camFile.files && camFile.files[0]); camFile.value = ''; };
  if (libFile) libFile.onchange = () => { onPhotoFile(libFile.files && libFile.files[0]); libFile.value = ''; };
  const clearPhoto = $('sharePhotoClear');
  if (clearPhoto) clearPhoto.onclick = () => studioSetCardPhoto('');
  const cropCanvas = $('cropCanvas');
  if (cropCanvas) {
    cropCanvas.onpointerdown = e => { studioCrop.drag = {x: e.clientX, y: e.clientY, ox: studioCrop.x, oy: studioCrop.y}; cropCanvas.setPointerCapture?.(e.pointerId); };
    cropCanvas.onpointermove = e => {
      if (!studioCrop.drag) return;
      const rect = cropCanvas.getBoundingClientRect();
      const sx = cropCanvas.width / Math.max(1, rect.width);
      const sy = cropCanvas.height / Math.max(1, rect.height);
      studioCrop.x = studioCrop.drag.ox + (e.clientX - studioCrop.drag.x) * sx;
      studioCrop.y = studioCrop.drag.oy + (e.clientY - studioCrop.drag.y) * sy;
      studioDrawCrop();
    };
    cropCanvas.onpointerup = cropCanvas.onpointercancel = () => { studioCrop.drag = null; };
  }
  const cropZoom = $('cropZoom');
  if (cropZoom) cropZoom.oninput = () => studioCropZoom(Number(cropZoom.value));
  const cropUse = $('cropUse');
  if (cropUse) cropUse.onclick = () => studioCommitCrop();
  const cropCancel = $('cropCancel');
  if (cropCancel) cropCancel.onclick = () => studioCloseCrop();
  if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
    if (gyroBtn) gyroBtn.hidden = true;
    studioListenGyro(false);
  }
  const photoBtn = $('profilePhotoBtn'), photoFile = $('profileFile');
  if (photoBtn && photoFile) photoBtn.onclick = () => photoFile.click();
  if (photoFile) photoFile.onchange = () => {
    const file = photoFile.files && photoFile.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 320;
      const x = c.getContext('2d');
      const scale = Math.max(320 / img.width, 320 / img.height);
      const w = img.width * scale, h = img.height * scale;
      x.drawImage(img, (320 - w) / 2, (320 - h) / 2, w, h);
      let q = 0.82, url = c.toDataURL('image/jpeg', q);
      while (url.length > 180000 && q > 0.45) { q -= 0.08; url = c.toDataURL('image/jpeg', q); }
      Studio.saveProfile({photo: url});
      studioPaintProfile();
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };
  ['profileName', 'profileClub'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const patch = {};
      patch[id === 'profileName' ? 'name' : 'club'] = el.value;
      Studio.saveProfile(patch);
    });
  });
  const open = $('openShare');
  if (open) open.onclick = () => studioOpenShare('session');
  const shareProfile = $('shareProfile');
  if (shareProfile) shareProfile.onclick = () => studioOpenShare('profile');
  const close = $('shareClose');
  if (close) close.onclick = () => { Studio.shareOpen = false; const sheet = $('shareSheet'); if (sheet) sheet.hidden = true; };
  const exp = $('shareExport');
  if (exp) exp.onclick = () => studioExport();
  if (typeof render === 'function') {
    const prev = render;
    render = function () { prev(); studioPaint(); };
  }
}

function studioCommit(mutator) {
  if (typeof displayedSession !== 'function' || typeof saveSession !== 'function') return;
  const s = displayedSession();
  if (!s) return;
  mutator(s);
  saveSession(s);
  if ((typeof historyMode !== 'undefined' && historyMode ? histId : curSess && curSess.id) === s.id) {
    data = {shots: s.shots};
    if (!historyMode) curSess = s;
  }
  if (typeof render === 'function') render();
}

function studioFit(c, cssH) {
  if (!c || !c.getContext) return null;
  const dpr = (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1;
  const w = c.clientWidth || 320;
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(cssH * dpr));
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, w, cssH);
  return {x, w, h: cssH};
}

function studioRadarDraw(ctx, cx, cy, R, stats, theme, labels) {
  const axes = stats.axes;
  const n = axes.length;
  const ang = i => -Math.PI / 2 + i * Math.PI * 2 / n;
  ctx.save();
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = ang(i), rr = R * ring / 4;
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const known = ax => ax && ax.value != null && !ax.thin;
  axes.forEach((ax, i) => {
    const a = ang(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.setLineDash(known(ax) ? [] : [3, 4]);
    ctx.strokeStyle = known(ax) ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.38)';
    ctx.stroke();
  });
  ctx.setLineDash([]);
  const solid = axes.map((ax, i) => ({ax, i})).filter(row => known(row.ax));
  if (solid.length >= 3) {
    ctx.beginPath();
    solid.forEach((row, n) => {
      const a = ang(row.i);
      const v = Math.max(0, Math.min(100, row.ax.value)) / 100;
      const px = cx + Math.cos(a) * R * v, py = cy + Math.sin(a) * R * v;
      n ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = theme.soft;
    ctx.fill();
    ctx.strokeStyle = theme.acc;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    solid.forEach(row => {
      const a = ang(row.i);
      const v = Math.max(0, Math.min(100, row.ax.value)) / 100;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v, 3.2, 0, 7);
      ctx.fillStyle = theme.acc2;
      ctx.fill();
    });
  }
  if (labels) {
    ctx.font = '600 11px ' + studioSans;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    axes.forEach((ax, i) => {
      const a = ang(i);
      ctx.fillStyle = known(ax) ? '#fff' : 'rgba(255,255,255,.38)';
      ctx.fillText(ax.label, cx + Math.cos(a) * (R + 28), cy + Math.sin(a) * (R + 28));
    });
  }
  ctx.restore();
}

function studioPaint() {
  try {
    Studio.applyTheme();
    studioSync();
    if (typeof view === 'undefined') return;
    if (view === 'Profile') { studioPaintProfile(); studioPaintProgress(); studioPaintHeat(); }
    if (Studio.shareOpen) studioDrawShare();
  } catch (e) {}
}

function studioSync() {
  const lens = document.getElementById('lensBar');
  if (lens) lens.querySelectorAll('[data-lens]').forEach(b => b.classList.toggle('on', b.dataset.lens === Studio.lens));
  const sw = document.getElementById('themeSwatches');
  if (sw) sw.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('on', b.dataset.theme === Studio.theme().id));
  studioModes();
  const session = typeof displayedSession === 'function' ? displayedSession() : null;
  const round = document.getElementById('roundBar');
  if (round) {
    round.hidden = !session || Studio.picking;
    const mark = session && (session.phase === 'warm' || session.phase === 'score') ? session.phase : '';
    round.querySelectorAll('[data-round]').forEach(b => b.classList.toggle('on', b.dataset.round === mark));
  }
  const share = document.getElementById('openShare');
  if (share) share.hidden = !(typeof data !== 'undefined' && data && data.shots && data.shots.length);
  document.querySelectorAll('#setList details').forEach(d => {
    const setOn = Studio.picking && Studio.picks.has(d.dataset.sid);
    d.classList.toggle('picked', setOn);
    d.hidden = Studio.lens !== 'all' && d.dataset.phase !== Studio.lens;
    d.querySelectorAll('.trendRow').forEach(row => {
      const t = Number(row.dataset.t);
      row.classList.toggle('picked', !!(Studio.picking && (setOn || (Number.isFinite(t) && Studio.arrows.has(t)))));
    });
  });
  studioSyncShare();
}

function studioModes() {
  const bar = document.getElementById('pickBar');
  if (!bar) return;
  const session = typeof displayedSession === 'function' ? displayedSession() : null;
  const hasShots = !!(session && session.shots && session.shots.length);
  const show = hasShots && Studio.picking && (typeof view === 'undefined' || view === 'Session');
  if (!show) { bar.classList.remove('on'); if (!hasShots) bar.hidden = true; return; }
  if (!bar.querySelector('.pickBarOn')) {
    bar.innerHTML = '<div class="pickBarOn"><div class="setModesTop"><span id="pickCount"></span><button type="button" data-bulk="done">Hecho</button></div><div class="pickScope"><button type="button" data-scope="session">Sesión</button><button type="button" data-scope="day">Día</button></div><span class="modeSeg"><button type="button" data-bulk="warm">Calentamiento</button><button type="button" data-bulk="score">Puntuable</button><button type="button" data-bulk="">Libre</button></span></div>';
  }
  const header = document.querySelector('header');
  if (header) bar.style.top = Math.round(header.getBoundingClientRect().bottom) + 'px';
  bar.hidden = false;
  if (!bar.classList.contains('on')) {
    void bar.offsetWidth;
    bar.classList.add('on');
  }
  const count = document.getElementById('pickCount');
  const n = studioPickCount();
  if (count) {
    const noun = n === 1 ? 'flecha' : 'flechas';
    count.textContent = Studio.dayIds.size ? (n + ' ' + noun + ' · día') : (n + ' ' + noun);
  }
  const others = studioSameDay(session);
  const full = studioSessionFull(session);
  const dayOn = full && others.every(s => Studio.dayIds.has(s.id)) && Studio.dayIds.size === others.length;
  const sessionOn = full && Studio.dayIds.size === 0;
  bar.querySelectorAll('[data-scope]').forEach(b => {
    const on = b.dataset.scope === 'day' ? dayOn : sessionOn;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function studioSyncShare() {
  const box = document.getElementById('shareThumbs');
  if (box) box.querySelectorAll('[data-layout]').forEach(b => {
    const on = b.dataset.layout === Studio.card.layout;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  const finish = Studio.card.finish || 'metal';
  document.querySelectorAll('#shareFinish [data-finish]').forEach(b => {
    const on = b.dataset.finish === finish;
    b.classList.toggle('sel', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  document.querySelectorAll('#sharePresets [data-preset]').forEach(b => {
    b.classList.toggle('on', !Studio.card.photo && b.dataset.preset === Studio.card.preset);
    const img = b.querySelector('img');
    const preset = Studio.PRESETS.find(p => p.id === b.dataset.preset);
    const url = preset ? studioPresetUrl(preset) : '';
    if (img && url && img.getAttribute('src') !== url) img.src = url;
  });
  const clear = document.getElementById('sharePhotoClear');
  if (clear) clear.hidden = !Studio.card.photo;
  const mine = document.getElementById('shareUserThumb');
  if (mine && Studio.card.photo && mine.getAttribute('src') !== Studio.card.photo) mine.src = Studio.card.photo;
}

function studioTilt(rx, ry) {
  Studio.card.tilt = {x: rx, y: ry};
  const tilt = document.getElementById('holoTilt');
  const sheen = document.getElementById('holoSheen');
  if (tilt) {
    tilt.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    tilt.style.boxShadow = (-ry * 1.8).toFixed(1) + 'px ' + (26 - rx).toFixed(1) + 'px 42px rgba(0,0,0,.55)';
  }
  if (sheen) sheen.style.backgroundPosition = (50 + ry * 3.2).toFixed(1) + '% ' + (42 - rx * 3.2).toFixed(1) + '%';
  if (Studio.shareOpen) studioDrawShare(false);
}

function studioTiltFrom(stage, e) {
  const r = stage.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  studioTilt(Math.max(-14, Math.min(14, -py * 26)), Math.max(-16, Math.min(16, px * 30)));
}

function studioGyro(e) {
  if (!Studio.shareOpen || e.gamma == null) return;
  const rx = Math.max(-12, Math.min(12, (e.beta || 0) * 0.16));
  const ry = Math.max(-14, Math.min(14, e.gamma * 0.22));
  studioTilt(rx, ry);
}

function studioListenGyro(ask) {
  const D = window.DeviceOrientationEvent;
  if (!D) return;
  const start = () => window.addEventListener('deviceorientation', studioGyro);
  if (ask && typeof D.requestPermission === 'function') {
    D.requestPermission().then(state => { if (state === 'granted') start(); }).catch(() => {});
    return;
  }
  start();
}

function studioSessions() {
  return typeof store === 'undefined' ? [] : store.list().filter(s => s && s.shots && s.shots.length).sort((a, b) => a.id - b.id);
}

function studioPaintProfile() {
  const p = Studio.profile();
  const name = document.getElementById('profileName');
  const club = document.getElementById('profileClub');
  if (name && document.activeElement !== name) name.value = p.name;
  if (club && document.activeElement !== club) club.value = p.club;
  const img = document.getElementById('profilePhoto');
  const ph = document.getElementById('profilePhotoPh');
  if (img) { img.hidden = !p.photo; if (p.photo) img.src = p.photo; }
  if (ph) ph.hidden = !!p.photo;
  const gear = document.getElementById('profileGear');
  let bows = [], arrows = [];
  try {
    const g = JSON.parse(localStorage.getItem('awGear') || 'null') || {};
    bows = Array.isArray(g.bows) ? g.bows : [];
    arrows = Array.isArray(g.arrows) ? g.arrows : [];
  } catch (e) {}
  const s = typeof displayedSession === 'function' ? displayedSession() : null;
  const bow = [...new Set([s && (s.bow || s.profile), ...bows].filter(Boolean))].slice(0, 3).join(' · ') || 'Sin arco';
  const arrow = [...new Set([s && s.arrows, ...arrows].filter(Boolean))].slice(0, 3).join(' · ') || 'Sin flechas';
  if (gear) gear.innerHTML = `<b>${escapeText(bow)}</b><br>${escapeText(arrow)}`;
  const sessions = studioSessions();
  const shots = Studio.historyShots();
  const stats = Studio.radar(shots, Studio.sharedFormat(sessions));
  const totals = stats.totals;
  const aims = shots.map(a => a.aim_score).filter(Number.isFinite);
  const aim = aims.length ? Math.round(aims.reduce((x, y) => x + y, 0) / aims.length) : null;
  const box = document.getElementById('profileNums');
  const markFormat = Studio.sharedFormat(sessions);
  const markLabel = markFormat === 'lancaster' ? '11' : markFormat === 'wa' ? '9' : 'X';
  const markN = markFormat === 'lancaster' ? totals.eleven : markFormat === 'wa' ? totals.nine : totals.x;
  if (box) box.innerHTML =
    `<div><span class="lbl">Flechas</span><b class="num">${shots.length || '–'}</b></div>` +
    `<div><span class="lbl">Sesiones</span><b class="num">${sessions.length || '–'}</b></div>` +
    `<div><span class="lbl">Media</span><b class="num">${totals.avg == null ? '–' : esNum(totals.avg, 1)}</b></div>` +
    `<div><span class="lbl">${markLabel}</span><b class="num">${totals.scored ? markN : '–'}</b></div>`;
  const span = document.getElementById('profileSpan');
  if (span) span.textContent = aim == null ? '' : 'estabilidad ' + aim;
  const spark = studioFit(document.getElementById('profileSpark'), 84);
  if (spark) {
    const vals = sessions.map(row => {
      const a = row.shots.map(x => x.aim_score).filter(Number.isFinite);
      return a.length ? a.reduce((m, n) => m + n, 0) / a.length : null;
    }).filter(v => v != null).slice(-12);
    if (vals.length >= 2) {
      const min = Math.min(...vals), max = Math.max(...vals), scale = Math.max(8, max - min);
      spark.x.beginPath();
      vals.forEach((v, i) => {
        const px = 8 + i * ((spark.w - 16) / (vals.length - 1));
        const py = spark.h - 12 - ((v - min) / scale) * (spark.h - 24);
        i ? spark.x.lineTo(px, py) : spark.x.moveTo(px, py);
      });
      spark.x.strokeStyle = Studio.theme().acc;
      spark.x.lineWidth = 2;
      spark.x.stroke();
    }
  }
  const radar = studioFit(document.getElementById('profileRadar'), 280);
  if (radar) studioRadarDraw(radar.x, radar.w / 2, radar.h / 2 - 4, Math.min(radar.w, radar.h) * 0.32, stats, Studio.theme(), true);
}

function studioProgressShots() {
  const select = document.getElementById('progressProfile');
  const key = select && select.value;
  const shots = [];
  studioSessions().forEach(s => (s.shots || []).forEach(a => {
    if (!a || a.candidate) return;
    if (key && typeof Training !== 'undefined' && Training.key && Training.key({profile: a.profile || s.profile, metric: a.metric || s.metric}) !== key) return;
    shots.push(a);
  }));
  return shots;
}

function studioPaintProgress() {
  const radar = studioFit(document.getElementById('progressRadar'), 280);
  if (!radar) return;
  const shots = studioProgressShots();
  const used = new Set(shots);
  const sessions = studioSessions().filter(s => (s.shots || []).some(a => used.has(a)));
  studioRadarDraw(radar.x, radar.w / 2, radar.h / 2 - 4, Math.min(radar.w, radar.h) * 0.32, Studio.radar(shots, Studio.sharedFormat(sessions)), Studio.theme(), true);
}

function studioPaintHeat() {
  const host = document.getElementById('heatmap');
  if (!host) return;
  const model = Studio.heatmap(typeof store === 'undefined' ? [] : store.list(), new Date(), 18);
  const label = document.getElementById('heatLabel');
  if (label) label.textContent = model.weeks + ' semanas';
  let html = '';
  for (let w = 0; w < model.weeks; w++) {
    html += '<span class="heatCol">';
    model.cells.filter(c => c.w === w).forEach(c => {
      html += `<i class="${c.future ? 'future' : 'l' + c.level}" title="${c.n}"></i>`;
    });
    html += '</span>';
  }
  host.innerHTML = html;
}

function studioShotSource() {
  if (Studio.shareKind === 'profile') return Studio.historyShots();
  const rows = (typeof data !== 'undefined' && data && data.shots) || [];
  return Studio.pool(rows);
}

function studioOpenShare(kind) {
  Studio.shareKind = kind || 'session';
  Studio.shareOpen = true;
  const sheet = document.getElementById('shareSheet');
  if (sheet) sheet.hidden = false;
  studioDrawShare();
  studioSyncShare();
}

function studioRound(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function studioRgb(hex) {
  const rgb = String(hex || '').match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const h = String(hex || '#FF8A1F').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return [255, 138, 31];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function studioRgba(hex, a) {
  const [r, g, b] = studioRgb(hex);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

function studioMix(a, b, t) {
  const A = studioRgb(a), B = studioRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return 'rgb(' + c.join(',') + ')';
}

function studioTrack(ctx, text, x, y, tracking) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
}

function studioAvgText(n) {
  if (n == null || !Number.isFinite(n)) return '–';
  const q = Math.round(n * 10) / 10;
  return Number.isInteger(q) ? String(q) : q.toFixed(1).replace('.', ',');
}
function studioSetsOf(shots) {
  const order = [];
  const map = new Map();
  (shots || []).forEach(s => {
    if (!s || s.candidate) return;
    const id = String(s.set_id ?? '');
    if (!map.has(id)) { map.set(id, []); order.push(id); }
    map.get(id).push(s);
  });
  return order.map((id, i) => ({id, n: i + 1, rows: map.get(id)}));
}
function studioSpread(rows) {
  const pts = StudioScore.impacts(rows);
  if (pts.length >= 2) {
    const c = StudioScore.groupCenter(pts);
    return pts.reduce((n, p) => n + Math.hypot(p.x - c.x, p.y - c.y), 0) / pts.length;
  }
  if (pts.length === 1) return Math.hypot(pts[0].x, pts[0].y);
  return null;
}
function studioDurationMs(session) {
  if (!session) return null;
  if (Number.isFinite(session.lastWt) && Number.isFinite(session.id) && session.lastWt > session.id) {
    const d = session.lastWt - session.id;
    if (d >= 60000 && d <= 8 * 3600000) return d;
  }
  const times = (session.shots || []).map(s => s && s.t_ms).filter(Number.isFinite);
  if (times.length >= 2) {
    const d = Math.max.apply(null, times) - Math.min.apply(null, times);
    if (d >= 60000 && d <= 8 * 3600000) return d;
  }
  return null;
}
function studioDurationText(ms) {
  if (!Number.isFinite(ms) || ms < 60000) return '–';
  const min = Math.round(ms / 60000);
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60), m = min % 60;
  return m ? h + ' h ' + m + ' min' : h + ' h';
}
function studioCornerDate(ms) {
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime())) return '';
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}
function studioSubtitle(session) {
  const bow = (session && (session.bow || session.profile)) || 'Compuesto';
  return session && session.mode === 'Indoor' ? bow + ' · 18 M' : String(bow);
}
function studioCardView(layout) {
  const session = typeof displayedSession === 'function' ? displayedSession() : null;
  const profile = Studio.profile();
  const sessionShots = typeof studioShotSource === 'function' ? studioShotSource() : [];
  const history = Studio.historyShots();
  const when = session && session.id ? session.id : Date.now();
  const format = session ? StudioScore.formatOf(session) : null;
  let shots = Studio.scorePool(sessionShots);
  let headline = 'Entrenamiento completado';
  let subtitle = studioSubtitle(session);
  let bars = [];
  let duration = studioDurationMs(session);
  if (layout === 'profile') {
    const sessions = typeof studioSessions === 'function' ? studioSessions() : [];
    shots = history;
    headline = profile.name || 'Perfil';
    subtitle = profile.club || 'Historial';
    const grouped = Studio.sharedFormat(sessions);
    const sets = [];
    let span = 0, anySpan = false;
    sessions.forEach(s => {
      studioSetsOf(s.shots).forEach(g => sets.push(g));
      const d = studioDurationMs(s);
      if (d != null) { span += d; anySpan = true; }
    });
    duration = anySpan ? span : null;
    bars = sessions.slice(-12).map((s, i) => ({n: i + 1, rows: Studio.scorePool(s.shots)}));
    return studioCardPack(headline, subtitle, when, shots, sets.length, duration, bars, grouped, studioPhotoSrc(), {
      kicker: 'TRAYECTORIA · ' + sessions.length + ' SESIONES',
      title: profile.name || 'Mi trayectoria',
      modeLine: profile.club || 'Historial completo',
      serial: '',
      per: 'session'
    });
  }
  const meta = {
    kicker: studioKicker(session),
    title: studioSubtitle(session).replace(/ M$/, ' m'),
    modeLine: studioModeLine(session),
    serial: studioSerial(session)
  };
  if (layout === 'best') {
    const best = Studio.bestSet(sessionShots.length ? sessionShots : history);
    shots = best ? best.rows : [];
    headline = 'Mejor tanda';
    subtitle = best ? 'Tanda ' + best.index + (session && session.mode === 'Indoor' ? ' · 18 M' : '') : studioSubtitle(session);
    bars = best ? [{n: best.index, rows: best.rows}] : [];
    meta.kicker = 'MEJOR TANDA' + (best ? ' · SERIE ' + best.index : '');
  } else {
    bars = studioSetsOf(shots);
  }
  const sets = studioSetsOf(shots);
  return studioCardPack(headline, subtitle, when, shots, sets.length, duration, bars, format, studioPhotoSrc(), meta);
}
function studioKicker(session) {
  if (!session) return 'ENTRENAMIENTO';
  if (session.mode === 'Indoor') return 'SESIÓN INDOOR';
  if (session.mode === 'Outdoor') return 'SESIÓN OUTDOOR';
  return 'ENTRENAMIENTO';
}
function studioModeLine(session) {
  const bow = (session && (session.bow || session.profile)) || 'Compuesto';
  if (session && session.mode === 'Indoor') return 'Indoor · ' + bow;
  if (session && session.mode === 'Outdoor') return 'Outdoor · ' + bow;
  return String(bow);
}
function studioSerial(session) {
  if (!session || typeof studioSessions !== 'function') return '';
  const i = studioSessions().findIndex(s => s.id === session.id);
  return i < 0 ? '' : 'Nº ' + String(i + 1).padStart(3, '0');
}
function studioSeriesItems(bars, format, per) {
  const top = StudioScore.arrowMax(format);
  const sumOf = rows => {
    const scored = (rows || []).filter(s => s && !s.candidate && StudioScore.points(s.result && s.result.value) != null);
    return scored.length ? {sum: scored.reduce((n, s) => n + StudioScore.points(s.result.value), 0), max: scored.length * top} : null;
  };
  const list = (bars || []).map(b => {
    const hit = sumOf(b.rows);
    return hit ? {label: (per === 'session' ? '' : 'S') + b.n, sum: hit.sum, max: hit.max} : null;
  }).filter(Boolean).slice(-12);
  if (list.length > 1 || !bars || !bars.length) return {title: per === 'session' ? 'POR SESIÓN' : 'POR SERIE', items: list};
  const arrows = (bars[0].rows || []).filter(s => s && !s.candidate && StudioScore.points(s.result && s.result.value) != null).slice(0, 12);
  return {title: 'POR FLECHA', items: arrows.map((s, i) => ({label: String(i + 1), sum: StudioScore.points(s.result.value), max: top, value: s.result.value}))};
}
function studioDistribution(shots) {
  const order = [['X', ['X']], ['11', ['11']], ['10', ['10']], ['9', ['9']], ['8', ['8']], ['≤7', ['7', '6', 'M']]];
  const counts = new Map();
  (shots || []).forEach(s => {
    if (!s || s.candidate) return;
    const v = s.result && s.result.value;
    if (v == null || v === '' || (StudioScore.points(v) == null && v !== 'M')) return;
    counts.set(String(v), (counts.get(String(v)) || 0) + 1);
  });
  return order.map(o => ({v: o[0], n: o[1].reduce((n, k) => n + (counts.get(k) || 0), 0)})).filter(d => d.n > 0);
}
function studioCardPack(headline, subtitle, when, shots, series, duration, bars, format, photo, meta) {
  const totals = StudioScore.totals(shots);
  const info = meta || {};
  const max = totals.score != null ? (format ? StudioScore.roundMax(shots, format) : (totals.arrows || 0) * 10) : 0;
  const best = Studio.bestSet(shots);
  const spread = studioSpread(shots);
  const d = new Date(when);
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const arrows = totals.arrows || 0;
  return {
    brand: 'ARCHERY WATCH',
    headline, subtitle,
    kicker: info.kicker || 'ENTRENAMIENTO',
    title: info.title || subtitle || '',
    modeLine: info.modeLine || subtitle || '',
    serial: info.serial || '',
    date: studioCornerDate(when),
    day: Number.isFinite(d.getTime()) ? String(d.getDate()) : '',
    monthYear: Number.isFinite(d.getTime()) ? months[d.getMonth()] + ' ' + d.getFullYear() : '',
    scoreMain: totals.score != null ? String(totals.score) : String(arrows),
    scoreMax: totals.score != null && max ? String(max) : '',
    scoreNote: totals.score != null ? '' : 'flechas registradas',
    pct: totals.score != null && max ? totals.score / max : null,
    best: best ? {index: best.index, sum: best.sum} : null,
    series: studioSeriesItems(bars, format, info.per),
    dist: studioDistribution(shots),
    spreadText: spread != null ? studioAvgText(spread * 10) + ' cm' : '–',
    stats: [
      {id: 'arrows', label: 'Flechas', value: String(arrows)},
      {id: 'series', label: 'Series', value: String(series || 0)},
      {id: 'avg', label: 'Media', value: studioAvgText(totals.avg)},
      {id: 'time', label: 'Duración', value: studioDurationText(duration)}
    ],
    photo: photo || '',
    focus: Studio.card.photo ? 0.5 : ((studioPreset() || {}).focus ?? 0.5)
  };
}

function studioHeaderImage(src) {
  if (!src || typeof Image === 'undefined') return null;
  if (Studio.card.photoSrc === src && Studio.card.photoImg && Studio.card.photoImg.complete && Studio.card.photoImg.naturalWidth) return Studio.card.photoImg;
  if (Studio.card.photoSrc !== src) {
    Studio.card.photoSrc = src;
    const img = new Image();
    img.onload = () => { if (Studio.shareOpen) studioDrawShare(false); };
    img.src = src;
    Studio.card.photoImg = img;
  }
  return Studio.card.photoImg && Studio.card.photoImg.complete && Studio.card.photoImg.naturalWidth ? Studio.card.photoImg : null;
}
function studioSetCardPhoto(url) {
  Studio.card.photo = url || '';
  Studio.card.photoSrc = '';
  Studio.card.photoImg = null;
  if (Studio.card.photoCache) Studio.card.photoCache.clear();
  if (Studio.shareOpen) studioDrawShare();
  if (typeof studioSyncShare === 'function') studioSyncShare();
}
const studioCrop = {img: null, url: '', zoom: 1, x: 0, y: 0, drag: null, ready: false};
function studioCropBox() {
  const canvas = document.getElementById('cropCanvas');
  return {canvas, w: canvas ? canvas.width : 900, h: canvas ? canvas.height : 620};
}
function studioCropScale() {
  const img = studioCrop.img;
  const {w, h} = studioCropBox();
  if (!img) return 1;
  return Math.max(w / img.naturalWidth, h / img.naturalHeight) * studioCrop.zoom;
}
function studioDrawCrop() {
  const {canvas, w, h} = studioCropBox();
  const img = studioCrop.img;
  if (!canvas || !img) return;
  const s = studioCropScale();
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  if (studioCrop.x > 0) studioCrop.x = 0;
  if (studioCrop.y > 0) studioCrop.y = 0;
  if (studioCrop.x + dw < w) studioCrop.x = w - dw;
  if (studioCrop.y + dh < h) studioCrop.y = h - dh;
  const x = canvas.getContext('2d');
  x.clearRect(0, 0, w, h);
  x.drawImage(img, studioCrop.x, studioCrop.y, dw, dh);
}
function studioCropZoom(z) {
  const img = studioCrop.img;
  if (!img) return;
  const {w, h} = studioCropBox();
  const prev = studioCropScale();
  const cx = w / 2, cy = h / 2;
  const ix = (cx - studioCrop.x) / prev;
  const iy = (cy - studioCrop.y) / prev;
  studioCrop.zoom = Math.max(1, Math.min(3, z || 1));
  const next = studioCropScale();
  studioCrop.x = cx - ix * next;
  studioCrop.y = cy - iy * next;
  studioDrawCrop();
}
function studioOpenCrop(file) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    studioCrop.img = img;
    studioCrop.url = url;
    studioCrop.zoom = 1;
    studioCrop.ready = false;
    const {w, h} = studioCropBox();
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    studioCrop.x = (w - img.naturalWidth * s) / 2;
    studioCrop.y = (h - img.naturalHeight * s) / 2;
    const sheet = document.getElementById('cropSheet');
    const zoom = document.getElementById('cropZoom');
    if (zoom) zoom.value = '1';
    if (sheet) sheet.hidden = false;
    studioDrawCrop();
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}
function studioCloseCrop() {
  const sheet = document.getElementById('cropSheet');
  if (sheet) sheet.hidden = true;
  if (studioCrop.url) URL.revokeObjectURL(studioCrop.url);
  studioCrop.img = null;
  studioCrop.url = '';
  studioCrop.drag = null;
}
function studioCommitCrop() {
  const img = studioCrop.img;
  if (!img) return;
  const {w, h} = studioCropBox();
  const outW = 1080, outH = Math.round(1080 * h / w);
  const k = outW / w;
  const c = document.createElement('canvas');
  c.width = outW;
  c.height = outH;
  const s = studioCropScale() * k;
  c.getContext('2d').drawImage(img, studioCrop.x * k, studioCrop.y * k, img.naturalWidth * s, img.naturalHeight * s);
  let q = 0.84, url = c.toDataURL('image/jpeg', q);
  while (url.length > 480000 && q > 0.5) { q -= 0.08; url = c.toDataURL('image/jpeg', q); }
  studioCloseCrop();
  studioSetCardPhoto(url);
}
function studioPhotoSrc() {
  if (Studio.card.photo) return Studio.card.photo;
  const hit = studioPreset();
  return hit ? studioPresetUrl(hit) : '';
}
// Android loads the app from file://, where a canvas that drew a file:// image can no longer be exported.
// Presets ship as data URLs inside scripts so the card always stays exportable.
function studioPresetUrl(preset) {
  if (typeof window === 'undefined') return '';
  const bank = window.AWPhotos || (window.AWPhotos = {});
  if (bank[preset.id]) return bank[preset.id];
  const asked = Studio.card.presetLoads || (Studio.card.presetLoads = {});
  if (!asked[preset.id] && typeof document !== 'undefined') {
    const script = document.createElement('script');
    script.src = preset.src;
    script.onload = () => {
      if (!Studio.shareOpen) return;
      studioDrawShare();
    };
    script.onerror = () => { delete asked[preset.id]; };
    asked[preset.id] = script;
    document.head.appendChild(script);
  }
  return '';
}
function studioPhotoReady() {
  const src = studioPhotoSrc();
  const img = studioHeaderImage(src);
  if (img || !src || !Studio.card.photoImg) return Promise.resolve();
  const pending = Studio.card.photoImg;
  return new Promise(resolve => {
    pending.addEventListener('load', resolve, {once: true});
    pending.addEventListener('error', resolve, {once: true});
    setTimeout(resolve, 3000);
  });
}
function studioPreset() {
  const list = Studio.PRESETS || [];
  return list.find(p => p.id === Studio.card.preset) || list[0] || null;
}
function studioF(weight, px, family) {
  return weight + ' ' + px + 'px ' + (family || studioGeist);
}
function studioTrackWidth(ctx, text, tracking) {
  let w = 0;
  for (const ch of String(text)) w += ctx.measureText(ch).width + tracking;
  return Math.max(0, w - tracking);
}
function studioTextWidth(ctx, text, font, track) {
  ctx.font = font;
  const s = String(text == null ? '' : text);
  if (!track) return ctx.measureText(s).width;
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = track + 'px';
    const w = ctx.measureText(s).width - track;
    ctx.letterSpacing = '0px';
    return w;
  }
  return studioTrackWidth(ctx, s, track);
}
function studioText(ctx, text, x, y, font, color, track, align) {
  const s = String(text == null ? '' : text);
  const t = track || 0;
  const w = studioTextWidth(ctx, s, font, t);
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (!t) ctx.fillText(s, x0, y);
  else if ('letterSpacing' in ctx) {
    ctx.letterSpacing = t + 'px';
    ctx.fillText(s, x0, y);
    ctx.letterSpacing = '0px';
  } else studioTrack(ctx, s, x0, y, t);
  return w;
}
function studioFitPx(ctx, text, maxW, px, weight, min, track) {
  let n = px;
  while (n > (min || 20) && studioTextWidth(ctx, text, studioF(weight, n), track || 0) > maxW) n -= 2;
  return n;
}
function studioWrap(ctx, text, font, maxW, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  ctx.font = font;
  words.forEach(w => {
    const next = line ? line + ' ' + w : w;
    if (line && ctx.measureText(next).width > maxW && lines.length < (maxLines || 2) - 1) {
      lines.push(line);
      line = w;
    } else line = next;
  });
  if (line) lines.push(line);
  return lines;
}
function studioSplitValue(v) {
  const s = String(v == null ? '–' : v);
  const m = s.match(/^([\d.,]+)\s*(min|cm|%|pts)$/);
  return m ? [m[1], m[2]] : [s, ''];
}
function studioValue(ctx, value, x, y, big, small, color, unitColor, align) {
  const [num, unit] = studioSplitValue(value);
  const a = studioTextWidth(ctx, num, big, 0);
  const b = unit ? studioTextWidth(ctx, unit, small, 0) + 8 : 0;
  const x0 = align === 'center' ? x - (a + b) / 2 : align === 'right' ? x - a - b : x;
  studioText(ctx, num, x0, y, big, color);
  if (unit) studioText(ctx, unit, x0 + a + 8, y, small, unitColor);
  return a + b;
}
function studioIcon(ctx, id, cx, cy, s, color, lw) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw || Math.max(1.6, s * 0.085);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const h = s / 2;
  ctx.beginPath();
  if (id === 'arrow') {
    ctx.moveTo(-h * 0.78, h * 0.78);
    ctx.lineTo(h * 0.62, -h * 0.62);
    ctx.moveTo(h * 0.7, -h * 0.7);
    ctx.lineTo(h * 0.18, -h * 0.62);
    ctx.moveTo(h * 0.7, -h * 0.7);
    ctx.lineTo(h * 0.62, -h * 0.18);
    ctx.moveTo(-h * 0.78, h * 0.78);
    ctx.lineTo(-h * 0.78, h * 0.34);
    ctx.moveTo(-h * 0.78, h * 0.78);
    ctx.lineTo(-h * 0.34, h * 0.78);
    ctx.moveTo(-h * 0.5, h * 0.5);
    ctx.lineTo(-h * 0.5, h * 0.12);
    ctx.moveTo(-h * 0.5, h * 0.5);
    ctx.lineTo(-h * 0.12, h * 0.5);
    ctx.stroke();
  } else if (id === 'series') {
    [-0.52, 0, 0.52].forEach((yy, i) => {
      ctx.moveTo(-h * 0.72, yy * h);
      ctx.lineTo(h * (0.72 - i * 0.26), yy * h);
    });
    ctx.stroke();
  } else if (id === 'target') {
    ctx.arc(0, 0, h * 0.8, 0, Math.PI * 2);
    ctx.moveTo(h * 0.44, 0);
    ctx.arc(0, 0, h * 0.44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, h * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'clock') {
    ctx.arc(0, 0, h * 0.8, 0, Math.PI * 2);
    ctx.moveTo(0, -h * 0.42);
    ctx.lineTo(0, 0);
    ctx.lineTo(h * 0.3, h * 0.2);
    ctx.stroke();
  } else if (id === 'bow') {
    ctx.arc(h * 0.9, 0, h * 1.25, Math.PI * 0.68, Math.PI * 1.32);
    const ax = h * 0.9 + Math.cos(Math.PI * 0.68) * h * 1.25;
    const ay = Math.sin(Math.PI * 0.68) * h * 1.25;
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax, -ay);
    ctx.moveTo(-h * 0.85, 0);
    ctx.lineTo(h * 0.85, 0);
    ctx.moveTo(h * 0.85, 0);
    ctx.lineTo(h * 0.5, -h * 0.3);
    ctx.moveTo(h * 0.85, 0);
    ctx.lineTo(h * 0.5, h * 0.3);
    ctx.stroke();
  } else if (id === 'score') {
    ctx.moveTo(-h * 0.55, -h * 0.78);
    ctx.lineTo(h * 0.55, -h * 0.78);
    ctx.lineTo(h * 0.5, -h * 0.1);
    ctx.quadraticCurveTo(0, h * 0.35, -h * 0.5, -h * 0.1);
    ctx.closePath();
    ctx.moveTo(0, h * 0.14);
    ctx.lineTo(0, h * 0.56);
    ctx.moveTo(-h * 0.4, h * 0.78);
    ctx.lineTo(h * 0.4, h * 0.78);
    ctx.stroke();
  } else {
    ctx.arc(0, 0, h * 0.56, 0, Math.PI * 2);
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(d => {
      ctx.moveTo(d[0] * h * 0.3, d[1] * h * 0.3);
      ctx.lineTo(d[0] * h * 0.9, d[1] * h * 0.9);
    });
    ctx.stroke();
  }
  ctx.restore();
}
function studioEase(g, from, to, colorOf) {
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const e = t * t * (3 - 2 * t);
    g.addColorStop(from + (to - from) * t, colorOf(e));
  }
}
function studioPhotoCanvas(img, src, w, h, opt) {
  const o = opt || {};
  const tag = String(src).length > 160 ? String(src).length + ':' + String(src).slice(-48) : String(src);
  const key = [tag, w, h, o.focus, o.bright, o.fade, o.tint].join('|');
  const cache = Studio.card.photoCache || (Studio.card.photoCache = new Map());
  if (cache.has(key)) return cache.get(key);
  if (cache.size > 10) cache.clear();
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  const fy = Number.isFinite(o.focus) ? o.focus : 0.5;
  x.filter = 'grayscale(1) contrast(1.12) brightness(' + (o.bright || 0.62) + ')';
  x.drawImage(img, (w - dw) / 2, (h - dh) * fy, dw, dh);
  x.filter = 'none';
  if (o.tint) {
    x.globalCompositeOperation = 'soft-light';
    x.fillStyle = o.tint;
    x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over';
  }
  const vig = x.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.3, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,.34)');
  x.fillStyle = vig;
  x.fillRect(0, 0, w, h);
  if (o.fade) {
    x.globalCompositeOperation = 'destination-out';
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    studioEase(g, o.fade, 1, e => 'rgba(0,0,0,' + e.toFixed(3) + ')');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'source-over';
  }
  cache.set(key, c);
  return c;
}
function studioCardSheen(ctx, x, y, w, h, r, tilt, gloss, accent) {
  const rx = tilt && Number.isFinite(tilt.x) ? tilt.x : 0;
  const ry = tilt && Number.isFinite(tilt.y) ? tilt.y : 0;
  const amount = Number.isFinite(gloss) ? gloss : 0.1;
  ctx.save();
  if (r > 0) { studioRound(ctx, x, y, w, h, r); ctx.clip(); }
  ctx.translate(x + w * 0.3 + ry * 18, y + h * 0.1 - rx * 14);
  ctx.rotate(-0.62);
  const g = ctx.createLinearGradient(-w * 0.2, 0, w * 0.8, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.38, 'rgba(255,255,255,0)');
  g.addColorStop(0.47, studioRgba(accent || '#ffffff', amount * 0.35));
  g.addColorStop(0.52, 'rgba(255,255,255,' + amount.toFixed(3) + ')');
  g.addColorStop(0.6, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-w * 1.6, -h, w * 3.4, h * 2.8);
  ctx.restore();
}
function studioFace(ctx) {
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
  if (Studio.card.fontsAsked) return;
  Studio.card.fontsAsked = true;
  Promise.all([300, 400, 500, 600, 700, 200].map(w => document.fonts.load(studioF(w, 40))).concat(document.fonts.load(studioF(600, 40, studioNum)))).then(() => {
    if (Studio.shareOpen) studioDrawShare();
  }).catch(() => {});
}

function studioGauge(ctx, cx, cy, R, pct, acc, acc2, lw) {
  const a0 = Math.PI * 0.75, sweep = Math.PI * 1.5;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0, a0 + sweep);
  ctx.strokeStyle = 'rgba(255,255,255,.08)';
  ctx.stroke();
  const p = Math.max(0, Math.min(1, pct || 0));
  if (p > 0) {
    const end = a0 + sweep * p;
    const g = ctx.createLinearGradient(cx - R, cy + R, cx + R, cy - R);
    g.addColorStop(0, acc);
    g.addColorStop(1, acc2);
    ctx.beginPath();
    ctx.arc(cx, cy, R, a0, end);
    ctx.strokeStyle = g;
    ctx.shadowColor = studioRgba(acc, 0.5);
    ctx.shadowBlur = 26;
    ctx.stroke();
    ctx.shadowBlur = 0;
    const kx = cx + Math.cos(end) * R, ky = cy + Math.sin(end) * R;
    ctx.beginPath();
    ctx.arc(kx, ky, lw * 0.64, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0b0d';
    ctx.fill();
    ctx.lineWidth = lw * 0.34;
    ctx.strokeStyle = acc2;
    ctx.stroke();
  }
  ctx.restore();
}
function studioPanel(ctx, x, y, w, h, r, fill, line) {
  studioRound(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  const sheen = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
  sheen.addColorStop(0, 'rgba(255,255,255,.035)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fill();
  studioRound(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Bars start from a floor just under the weakest series so close scores still read apart; the number on top stays exact.
function studioBars(ctx, x, y, w, h, series, o) {
  const items = (series && series.items) || [];
  if (!items.length) {
    studioText(ctx, 'Sin puntuación', x, y + h / 2, studioF(500, o.labelPx || 15), o.label);
    return;
  }
  const ratios = items.map(it => it.max ? it.sum / it.max : 0);
  const lo = Math.max(0, Math.floor((Math.min.apply(null, ratios) - 0.12) * 20) / 20);
  const top = items.reduce((k, it, i) => it.sum > items[k].sum ? i : k, 0);
  const n = items.length;
  const bw = Math.min(o.maxBar || 40, w / (n * 1.75));
  const step = n > 1 ? (w - bw) / (n - 1) : 0;
  const x0 = n > 1 ? x : x + (w - bw) / 2;
  const valPx = o.valuePx || 17, labPx = o.labelPx || 13;
  const plotTop = y + valPx + 10, plotH = h - valPx - 10 - labPx - 14;
  items.forEach((it, i) => {
    const bx = x0 + step * i;
    const k = Math.max(0.06, Math.min(1, ((it.max ? it.sum / it.max : 0) - lo) / Math.max(0.01, 1 - lo)));
    const bh = Math.max(bw * 0.5, plotH * k);
    const by = plotTop + plotH - bh;
    const best = it.value != null ? it.value === 'X' || it.value === '11' : i === top;
    if (o.track) {
      studioRound(ctx, bx, plotTop, bw, plotH, bw / 2);
      ctx.fillStyle = o.track;
      ctx.fill();
    }
    ctx.save();
    if (best && o.glow) {
      ctx.shadowColor = studioRgba(o.acc, 0.45);
      ctx.shadowBlur = 18;
    }
    studioRound(ctx, bx, by, bw, bh, bw / 2);
    if (best) {
      const g = ctx.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, o.acc2 || o.acc);
      g.addColorStop(1, o.acc);
      ctx.fillStyle = g;
    } else ctx.fillStyle = o.bar;
    ctx.fill();
    ctx.restore();
    studioText(ctx, String(it.value === 'X' ? 'X' : it.sum), bx + bw / 2, by - 10, studioF(600, valPx, o.valueFamily), best ? o.acc : o.value, 0, 'center');
    studioText(ctx, it.label, bx + bw / 2, y + h, studioF(500, labPx), o.label, 1, 'center');
  });
}
function studioDistTone(v, acc, acc2, base) {
  if (v === 'X' || v === '11') return acc;
  if (v === '10') return acc2;
  return studioRgba(base, v === '9' ? 0.62 : v === '8' ? 0.36 : 0.18);
}
function studioDistBar(ctx, x, y, w, h, dist, o) {
  const total = (dist || []).reduce((n, d) => n + d.n, 0);
  if (!total) {
    studioRound(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = studioRgba(o.base, 0.1);
    ctx.fill();
    return;
  }
  const gap = o.gap == null ? 4 : o.gap;
  const usable = w - gap * (dist.length - 1);
  const raw = dist.map(d => Math.max(h, usable * d.n / total));
  const fit = usable / raw.reduce((n, v) => n + v, 0);
  let cx = x;
  dist.forEach((d, i) => {
    const sw = raw[i] * fit;
    studioRound(ctx, cx, y, sw, h, Math.min(h / 2, o.radius || h / 2));
    ctx.fillStyle = studioDistTone(d.v, o.acc, o.acc2, o.base);
    ctx.fill();
    cx += sw + gap;
  });
  if (!o.legendY) return;
  const cells = dist.length;
  const cellW = w / Math.max(cells, o.minCells || 0);
  dist.forEach((d, i) => {
    const lx = x + cellW * i;
    ctx.beginPath();
    ctx.arc(lx + 6, o.legendY - (o.countPx || 22) * 0.32, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = studioDistTone(d.v, o.acc, o.acc2, o.base);
    ctx.fill();
    const lw = studioText(ctx, d.v, lx + 20, o.legendY, studioF(500, o.keyPx || 16), o.key);
    studioText(ctx, String(d.n), lx + 20 + lw + 8, o.legendY, studioF(o.countWeight || 650, o.countPx || 22, o.countFamily), o.count);
  });
}

function studioPaintGlass(ctx, view, theme, tilt, photo) {
  const W = 1080, H = 1350, acc = theme.acc, acc2 = theme.acc2 || studioMix(acc, '#ffffff', 0.45);
  const txt2 = '#9a9aa2', line = 'rgba(255,255,255,.08)';
  const num = px => studioF(600, px, studioNum);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  if (photo) {
    ctx.save();
    ctx.filter = 'blur(42px)';
    ctx.globalAlpha = 0.6;
    ctx.drawImage(studioPhotoCanvas(photo, view.photo, 540, 675, {focus: view.focus, bright: 0.62}), -90, -90, W + 180, H + 180);
    ctx.restore();
  }
  [[W * 0.1, H * 0.94, 760, 0.3], [W * 0.96, H * 0.04, 600, 0.14]].forEach(b => {
    const g = ctx.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]);
    g.addColorStop(0, studioRgba(acc, b[3]));
    g.addColorStop(1, studioRgba(acc, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
  const cx = 60, cy = 60, cw = 960, ch = 1230, r = 52;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.75)';
  ctx.shadowBlur = 90;
  ctx.shadowOffsetY = 30;
  studioRound(ctx, cx, cy, cw, ch, r);
  ctx.fillStyle = '#0b0b0d';
  ctx.fill();
  ctx.restore();
  ctx.save();
  studioRound(ctx, cx, cy, cw, ch, r);
  ctx.clip();
  const base = ctx.createLinearGradient(0, cy, 0, cy + ch);
  base.addColorStop(0, '#141417');
  base.addColorStop(1, '#09090b');
  ctx.fillStyle = base;
  ctx.fillRect(cx, cy, cw, ch);
  if (photo) ctx.drawImage(studioPhotoCanvas(photo, view.photo, cw, 640, {focus: view.focus, bright: 0.72, fade: 0.4}), cx, cy);
  const warm = ctx.createRadialGradient(cx, cy + ch, 0, cx, cy + ch, 720);
  warm.addColorStop(0, studioRgba(acc, 0.13));
  warm.addColorStop(1, studioRgba(acc, 0));
  ctx.fillStyle = warm;
  ctx.fillRect(cx, cy, cw, ch);
  const topShade = ctx.createLinearGradient(0, cy, 0, cy + 200);
  topShade.addColorStop(0, 'rgba(0,0,0,.5)');
  topShade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topShade;
  ctx.fillRect(cx, cy, cw, 200);
  const L = cx + 56, R = cx + cw - 56;
  ctx.save();
  ctx.beginPath();
  ctx.arc(L + 6, cy + 82, 6.5, 0, Math.PI * 2);
  ctx.fillStyle = acc;
  ctx.shadowColor = studioRgba(acc, 0.8);
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.restore();
  studioText(ctx, 'ARCHERY WATCH', L + 26, cy + 89, studioF(600, 17), 'rgba(255,255,255,.92)', 4.5);
  studioText(ctx, view.date, R, cy + 89, studioF(500, 17), 'rgba(255,255,255,.7)', 3.5, 'right');
  studioText(ctx, view.kicker, L, cy + 440, studioF(500, 18), studioMix(acc, '#ffffff', 0.25), 4.5);
  const hpx = studioFitPx(ctx, view.headline, cw - 112, 78, 400, 48, -2.5);
  studioText(ctx, view.headline, L - 3, cy + 522, studioF(400, hpx), '#ffffff', -2.5);
  studioText(ctx, view.title, L, cy + 570, studioF(400, 27), 'rgba(255,255,255,.62)');
  const fill = 'rgba(11,11,13,.8)';
  const hx = cx + 28, hw = cw - 56, hy = cy + 608, hh = 322;
  studioPanel(ctx, hx, hy, hw, hh, 40, fill, line);
  const gx = hx + 190, gy = hy + hh / 2 + 6, GR = 122;
  studioGauge(ctx, gx, gy, GR, view.pct, acc, acc2, 18);
  studioText(ctx, view.scoreMain, gx, gy + 30, num(122), acc, 0, 'center');
  studioText(ctx, view.scoreMax ? 'PUNTOS' : 'FLECHAS', gx, gy + 70, studioF(500, 15), txt2, 3.5, 'center');
  if (view.scoreMax) studioText(ctx, '/ ' + view.scoreMax, gx, gy + GR + 6, num(36), 'rgba(255,255,255,.5)', 0, 'center');
  ctx.fillStyle = line;
  ctx.fillRect(hx + 376, hy + 44, 1.5, hh - 88);
  const gridX = hx + 420, colW = (hx + hw - 30 - gridX) / 2;
  view.stats.forEach((cell, i) => {
    const x = gridX + (i % 2) * colW;
    const top = hy + (i < 2 ? 44 : 182);
    studioText(ctx, cell.label.toUpperCase(), x, top + 22, studioF(500, 16), txt2, 3.5);
    studioValue(ctx, cell.value, x - 2, top + 104, num(86), studioF(500, 25), '#ffffff', txt2);
  });
  const sy = hy + hh + 20, sh = 166;
  studioPanel(ctx, hx, sy, hw, sh, 36, fill, line);
  const c3 = hw / 3;
  [1, 2].forEach(i => {
    ctx.fillStyle = line;
    ctx.fillRect(hx + c3 * i, sy + 34, 1.5, sh - 68);
  });
  const sL = i => hx + c3 * i + 36;
  studioText(ctx, 'MEJOR SERIE', sL(0), sy + 54, studioF(500, 15), txt2, 3.5);
  if (view.best) {
    const bw = studioText(ctx, String(view.best.sum), sL(0) - 2, sy + 134, num(76), acc);
    studioText(ctx, 'S' + view.best.index, sL(0) + bw + 10, sy + 134, studioF(500, 24), txt2);
  } else studioText(ctx, '–', sL(0), sy + 134, num(76), '#ffffff');
  studioText(ctx, 'AGRUPACIÓN', sL(1), sy + 54, studioF(500, 15), txt2, 3.5);
  studioValue(ctx, view.spreadText, sL(1) - 2, sy + 134, num(76), studioF(500, 24), '#ffffff', txt2);
  studioText(ctx, 'PRECISIÓN', sL(2), sy + 54, studioF(500, 15), txt2, 3.5);
  studioValue(ctx, view.pct != null ? Math.round(view.pct * 100) + '%' : '–', sL(2) - 2, sy + 134, num(76), studioF(500, 24), '#ffffff', txt2);
  const fy = sy + sh;
  studioDistBar(ctx, L, fy + 34, R - L, 12, view.dist, {acc, acc2, base: '#ffffff', legendY: fy + 84, minCells: 5, key: txt2, count: '#ffffff', countPx: 26, countFamily: studioNum, countWeight: 600});
  studioCardSheen(ctx, cx, cy, cw, ch, r, tilt, 0.05, acc);
  ctx.restore();
  const rim = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
  rim.addColorStop(0, studioRgba(acc, 0.6));
  rim.addColorStop(0.32, 'rgba(255,255,255,.1)');
  rim.addColorStop(1, 'rgba(255,255,255,.05)');
  studioRound(ctx, cx + 0.75, cy + 0.75, cw - 1.5, ch - 1.5, r);
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function studioPaintEditorial(ctx, view, theme, tilt, photo) {
  const W = 1080, H = 1350, acc = theme.acc;
  const cream = '#f7f3ec', ink = '#1c1b19', soft = '#7a746b', hair = 'rgba(28,27,25,.09)', block = '#efe9df';
  ctx.fillStyle = '#3a3936';
  ctx.fillRect(0, 0, W, H);
  if (photo) {
    ctx.save();
    ctx.filter = 'blur(34px)';
    ctx.drawImage(studioPhotoCanvas(photo, view.photo, 540, 675, {focus: view.focus, bright: 0.74}), -60, -60, W + 120, H + 120);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(24,23,21,.24)';
  ctx.fillRect(0, 0, W, H);
  const cx = 104, cy = 40, cw = 872, ch = 1270, r = 40;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.4)';
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 28;
  studioRound(ctx, cx, cy, cw, ch, r);
  ctx.fillStyle = cream;
  ctx.fill();
  ctx.restore();
  ctx.save();
  studioRound(ctx, cx, cy, cw, ch, r);
  ctx.clip();
  const ph = 450;
  if (photo) ctx.drawImage(studioPhotoCanvas(photo, view.photo, cw, ph, {focus: view.focus, bright: 0.74, tint: 'rgba(150,140,120,.4)'}), cx, cy);
  else {
    ctx.fillStyle = '#4a4844';
    ctx.fillRect(cx, cy, cw, ph);
  }
  const shade = ctx.createLinearGradient(0, cy, 0, cy + 200);
  shade.addColorStop(0, 'rgba(10,10,10,.42)');
  shade.addColorStop(1, 'rgba(10,10,10,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(cx, cy, cw, 200);
  const L = cx + 56, R = cx + cw - 56;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.92)';
  ctx.lineWidth = 2.2;
  [17, 8].forEach(k => {
    ctx.beginPath();
    ctx.arc(L + 18, cy + 76, k, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.arc(L + 18, cy + 76, 2.6, 0, Math.PI * 2);
  ctx.fillStyle = acc;
  ctx.fill();
  ctx.restore();
  studioText(ctx, 'ARCHERY WATCH', L + 50, cy + 82, studioF(600, 16), 'rgba(255,255,255,.95)', 5);
  const pt = cy + ph - 40;
  const pg = ctx.createLinearGradient(0, pt - 90, 0, pt + 10);
  pg.addColorStop(0, 'rgba(0,0,0,0)');
  pg.addColorStop(1, 'rgba(0,0,0,.24)');
  ctx.fillStyle = pg;
  ctx.fillRect(cx, pt - 90, cw, 100);
  studioRound(ctx, cx, pt, cw, ch, 34);
  ctx.fillStyle = cream;
  ctx.fill();
  const tpx = studioFitPx(ctx, view.headline, 560, 58, 750, 36, -1);
  studioText(ctx, view.headline, L - 2, pt + 94, studioF(750, tpx), ink, -1);
  studioText(ctx, view.title, L, pt + 140, studioF(400, 27), soft);
  studioText(ctx, view.day, R, pt + 92, studioF(300, 64), acc, -1, 'right');
  studioText(ctx, view.monthYear, R, pt + 124, studioF(600, 14), soft, 3.5, 'right');
  ctx.fillStyle = hair;
  ctx.fillRect(L, pt + 180, R - L, 1.5);
  const row1 = [
    {icon: 'score', label: 'PUNTOS', value: view.scoreMax ? view.scoreMain + ' / ' + view.scoreMax : view.scoreMain},
    {icon: 'target', label: 'MEDIA', value: view.stats[2].value},
    {icon: 'clock', label: 'TIEMPO', value: view.stats[3].value}
  ];
  const c3 = (R - L) / 3;
  row1.forEach((m, i) => {
    const x = L + i * c3 + (i ? 30 : 0);
    studioIcon(ctx, m.icon, x + 14, pt + 226, 28, acc, 2.4);
    studioText(ctx, m.label, x, pt + 274, studioF(600, 14), soft, 3);
    const bits = String(m.value).split(' / ');
    const w0 = studioValue(ctx, bits[0], x, pt + 320, studioF(750, 42), studioF(600, 22), ink, soft);
    if (bits[1]) studioText(ctx, '/ ' + bits[1], x + w0 + 8, pt + 320, studioF(600, 22), soft);
    if (i) {
      ctx.fillStyle = hair;
      ctx.fillRect(L + i * c3, pt + 208, 1.5, 120);
    }
  });
  ctx.fillStyle = hair;
  ctx.fillRect(L, pt + 352, R - L, 1.5);
  const row2 = [
    {icon: 'arrow', label: 'FLECHAS', value: view.stats[0].value},
    {icon: 'series', label: 'SERIES', value: view.stats[1].value},
    {icon: 'group', label: 'AGRUPACIÓN', value: view.spreadText}
  ];
  row2.forEach((m, i) => {
    const x = L + i * c3 + (i ? 30 : 0);
    studioIcon(ctx, m.icon, x + 14, pt + 398, 28, acc, 2.4);
    studioText(ctx, m.label, x + 48, pt + 388, studioF(600, 14), soft, 3);
    studioValue(ctx, m.value, x + 48, pt + 426, studioF(750, 34), studioF(600, 20), ink, soft);
    if (i) {
      ctx.fillStyle = hair;
      ctx.fillRect(L + i * c3, pt + 372, 1.5, 70);
    }
  });
  const mx = L, mw = R - L, my = pt + 470, mh = 156;
  studioRound(ctx, mx, my, mw, mh, 24);
  ctx.fillStyle = block;
  ctx.fill();
  studioText(ctx, 'DISTRIBUCIÓN', mx + 30, my + 44, studioF(600, 13.5), soft, 3);
  studioDistBar(ctx, mx + 30, my + 66, mw - 60, 16, view.dist, {acc, acc2: studioMix(acc, cream, 0.45), base: ink, gap: 5, legendY: my + 128, minCells: 5, key: soft, count: ink, countPx: 26});
  const ky = my + mh + 14, kh = 164;
  studioRound(ctx, mx, ky, mw, kh, 24);
  ctx.fillStyle = block;
  ctx.fill();
  studioText(ctx, (view.series && view.series.title) || 'POR SERIE', mx + 30, ky + 44, studioF(600, 13.5), soft, 3);
  if (view.best && view.series && view.series.title === 'POR SERIE') {
    studioText(ctx, String(view.best.sum), mx + 28, ky + 108, studioF(750, 44), ink, -1);
    studioText(ctx, 'mejor · S' + view.best.index, mx + 30, ky + 138, studioF(500, 17), soft);
  }
  studioBars(ctx, mx + 200, ky + 22, mw - 236, kh - 44, view.series, {acc, bar: 'rgba(28,27,25,.13)', value: soft, label: soft, maxBar: 34, valuePx: 16, labelPx: 13});
  ctx.restore();
}

function studioRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function studioValueNoise(rnd) {
  const perm = new Uint8Array(512), val = new Float32Array(256);
  for (let i = 0; i < 256; i++) { perm[i] = i; val[i] = rnd(); }
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const at = (x, y) => val[perm[(x & 255) + perm[y & 255]]];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
// Obsidian: smoky mottling, conchoidal ripples, faint veins and mineral flecks under a polished sheen.
function studioStone(w, h, acc) {
  const key = w + 'x' + h + ':' + acc;
  const cache = Studio.card.stone || (Studio.card.stone = {});
  if (cache.key === key) return cache.canvas;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  const rnd = studioRandom(1307);
  const base = x.createLinearGradient(0, 0, w * 0.45, h);
  base.addColorStop(0, '#111113');
  base.addColorStop(0.55, '#0a0a0c');
  base.addColorStop(1, '#050506');
  x.fillStyle = base;
  x.fillRect(0, 0, w, h);
  const noise = studioValueNoise(rnd);
  const fbm = (px, py) => {
    let sum = 0, amp = 0.5, f = 1;
    for (let o = 0; o < 5; o++) { sum += amp * noise(px * f, py * f); f *= 2.03; amp *= 0.5; }
    return sum;
  };
  const k = 3, lw = Math.ceil(w / k), lh = Math.ceil(h / k);
  const low = document.createElement('canvas');
  low.width = lw;
  low.height = lh;
  const lx = low.getContext('2d');
  const img = lx.createImageData(lw, lh);
  const s = 2.3 / lw;
  for (let j = 0; j < lh; j++) {
    for (let i = 0; i < lw; i++) {
      const px = i * s, py = j * s;
      const qx = fbm(px * 1.4, py * 1.4), qy = fbm(px * 1.4 + 5.2, py * 1.4 + 1.3);
      const body = fbm(px + 2.4 * qx, py + 2.4 * qy);
      const ridge = 1 - Math.abs(2 * fbm(px * 1.25 + 2.6 * qx + 1.7, py * 1.25 + 2.6 * qy + 9.2) - 1);
      const vein = Math.pow(ridge, 34);
      const haze = Math.pow(Math.max(0, body - 0.35), 1.6);
      const lum = haze * 64 + vein * 26;
      const o = (j * lw + i) * 4;
      img.data[o] = lum;
      img.data[o + 1] = lum;
      img.data[o + 2] = lum * 1.06;
      img.data[o + 3] = 255;
    }
  }
  lx.putImageData(img, 0, 0);
  x.save();
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.globalCompositeOperation = 'lighter';
  x.drawImage(low, 0, 0, lw * k, lh * k);
  x.restore();
  for (let i = 0; i < 1400; i++) {
    const px = rnd() * w, py = rnd() * h, s = 0.4 + rnd() * rnd() * 1.6;
    x.beginPath();
    x.arc(px, py, s, 0, Math.PI * 2);
    x.fillStyle = 'rgba(214,214,222,' + (0.04 + rnd() * rnd() * 0.22).toFixed(3) + ')';
    x.fill();
  }
  const grain = x.getImageData(0, 0, w, h);
  const d = grain.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 7;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  x.putImageData(grain, 0, 0);
  const polish = x.createLinearGradient(w * 0.05, 0, w * 0.75, h * 0.6);
  polish.addColorStop(0, 'rgba(255,255,255,0)');
  polish.addColorStop(0.42, 'rgba(255,255,255,.035)');
  polish.addColorStop(0.5, 'rgba(255,255,255,.06)');
  polish.addColorStop(0.58, 'rgba(255,255,255,.02)');
  polish.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = polish;
  x.fillRect(0, 0, w, h);
  const glow = x.createRadialGradient(w * 0.8, h * 0.88, 0, w * 0.8, h * 0.88, w * 0.7);
  glow.addColorStop(0, studioRgba(acc, 0.06));
  glow.addColorStop(1, studioRgba(acc, 0));
  x.fillStyle = glow;
  x.fillRect(0, 0, w, h);
  const depth = x.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.max(w, h) * 0.78);
  depth.addColorStop(0, 'rgba(0,0,0,0)');
  depth.addColorStop(1, 'rgba(0,0,0,.55)');
  x.fillStyle = depth;
  x.fillRect(0, 0, w, h);
  cache.key = key;
  cache.canvas = c;
  return c;
}

function studioPaintObsidian(ctx, view, theme, tilt, photo) {
  const W = 1080, H = 1350, acc = theme.acc;
  const ink = '#f1efea', soft = '#8e8a83', hair = 'rgba(255,255,255,.1)';
  const stone = studioStone(W, H, acc);
  ctx.drawImage(stone, 0, 0);
  if (photo) {
    const shot = studioPhotoCanvas(photo, view.photo, W, 760, {focus: view.focus, bright: 0.66, fade: 0.4});
    const lay = document.createElement('canvas');
    lay.width = W;
    lay.height = 760;
    const lx = lay.getContext('2d');
    lx.drawImage(shot, 0, 0);
    lx.globalCompositeOperation = 'soft-light';
    lx.globalAlpha = 0.28;
    lx.drawImage(stone, 0, 0, W, 760, 0, 0, W, 760);
    lx.globalAlpha = 1;
    lx.globalCompositeOperation = 'destination-in';
    lx.drawImage(shot, 0, 0);
    ctx.drawImage(lay, 0, 0);
  }
  const top = ctx.createLinearGradient(0, 0, 0, 220);
  top.addColorStop(0, 'rgba(0,0,0,.45)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 220);
  const L = 84, R = W - 84;
  studioText(ctx, 'ARCHERY WATCH', L, 96, studioF(600, 17), 'rgba(255,255,255,.88)', 6);
  studioText(ctx, view.date, R, 96, studioF(500, 17), 'rgba(255,255,255,.7)', 4, 'right');
  studioText(ctx, view.kicker, L, 610, studioF(600, 17), studioMix(acc, '#ffffff', 0.2), 5);
  const tpx = studioFitPx(ctx, view.title, R - L, 56, 300, 34, -0.5);
  studioText(ctx, view.title, L - 2, 676, studioF(300, tpx), ink, -0.5);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  const sw = studioText(ctx, view.scoreMain, L - 10, 914, studioF(200, 236), ink, -8);
  ctx.restore();
  if (view.scoreMax) studioText(ctx, '/ ' + view.scoreMax, L + sw + 6, 914, studioF(300, 50), soft);
  if (view.scoreNote) studioText(ctx, view.scoreNote, L, 966, studioF(400, 22), soft, 1);
  studioText(ctx, (view.series && view.series.title) || 'POR SERIE', R - 290, 728, studioF(500, 14), soft, 3.5);
  studioBars(ctx, R - 290, 750, 290, 216, view.series, {acc, acc2: theme.acc2, glow: true, bar: 'rgba(255,255,255,.16)', track: 'rgba(255,255,255,.04)', value: soft, label: 'rgba(255,255,255,.4)', maxBar: 30, valuePx: 17, labelPx: 13, valueFamily: studioGeist});
  ctx.fillStyle = hair;
  ctx.fillRect(L, 1012, R - L, 1.5);
  const colW = (R - L) / 4;
  view.stats.forEach((cell, i) => {
    const x = L + colW * i;
    studioText(ctx, cell.label.toUpperCase(), x, 1066, studioF(500, 14), soft, 3.5);
    studioValue(ctx, cell.value, x - 2, 1128, studioF(300, 54), studioF(400, 24), ink, soft);
  });
  ctx.fillStyle = hair;
  ctx.fillRect(L, 1168, R - L, 1.5);
  studioText(ctx, 'AGRUPACIÓN', L, 1222, studioF(500, 14), soft, 3.5);
  studioValue(ctx, view.spreadText, L, 1262, studioF(300, 30), studioF(400, 18), ink, soft);
  studioDistBar(ctx, L + 300, 1204, R - L - 300, 10, view.dist, {acc, acc2: theme.acc2, base: '#ffffff', gap: 4, legendY: 1258, minCells: 5, key: soft, count: ink, countPx: 24, countWeight: 300});
  studioText(ctx, view.serial || '', R, 1306, studioF(500, 12.5), 'rgba(255,255,255,.4)', 4, 'right');
  studioCardSheen(ctx, 0, 0, W, H, 0, tilt, 0.05, acc);
  const rim = ctx.createLinearGradient(0, 0, 0, 3);
  rim.addColorStop(0, 'rgba(255,255,255,.16)');
  rim.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, W, 3);
}

function studioPaintCard(ctx, w, h, layout) {
  const view = studioCardView(layout || Studio.card.layout);
  const theme = Studio.theme();
  const style = Studio.FINISHES.some(f => f.id === Studio.card.finish) ? Studio.card.finish : Studio.FINISHES[0].id;
  const tilt = Studio.card.tilt || {x: 0, y: 0};
  const s = w / 1080;
  studioFace(ctx);
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, 1080, 1350);
  const photo = studioHeaderImage(view.photo);
  if (style === 'editorial') studioPaintEditorial(ctx, view, theme, tilt, photo);
  else if (style === 'obsidian') studioPaintObsidian(ctx, view, theme, tilt, photo);
  else studioPaintGlass(ctx, view, theme, tilt, photo);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function studioPaintThumbs() {
  const host = document.getElementById('shareThumbs');
  if (!host || host.childElementCount === Studio.LAYOUTS.length) return;
  host.innerHTML = Studio.LAYOUTS.map(t => `<button type="button" role="tab" data-layout="${t.id}">${t.name}</button>`).join('');
}

function studioDrawShare(withThumbs) {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;
  const size = Studio.SIZES.card;
  if (canvas.width !== size.w) canvas.width = size.w;
  if (canvas.height !== size.h) canvas.height = size.h;
  studioPaintCard(canvas.getContext('2d'), size.w, size.h, Studio.card.layout);
  if (withThumbs !== false) studioPaintThumbs();
  studioSyncShare();
}

async function studioExport() {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;
  await studioPhotoReady();
  const tilt = {...(Studio.card.tilt || {x: 0, y: 0})};
  Studio.card.tilt = {x: -6, y: 10};
  studioDrawShare(false);
  let png = '';
  try { png = canvas.toDataURL('image/png'); } catch (e) {}
  Studio.card.tilt = tilt;
  if (!png) {
    if (Studio.shareOpen) studioDrawShare(false);
    if (typeof notice === 'function') notice('No se pudo crear la imagen');
    return;
  }
  if (Studio.shareOpen) studioDrawShare(false);
  const raw = png.split(',')[1] || '';
  if (window.Native && Native.sharePng) { Native.sharePng(raw); return; }
  try {
    const blob = await (await fetch(png)).blob();
    const file = new File([blob], 'archerywatch.png', {type: 'image/png'});
    if (navigator.share && (!navigator.canShare || navigator.canShare({files: [file]}))) {
      await navigator.share({files: [file], title: 'ArcheryWatch'});
      return;
    }
  } catch (e) {}
  const a = document.createElement('a');
  a.href = png;
  a.download = 'archerywatch.png';
  a.click();
}

studioMount();
