/* Perfil, temas, tandas y tarjetas. El ámbar sigue siendo el acento por defecto. */
const StudioScore = (typeof module !== 'undefined') ? require('./score.js') : Score;
const StudioGoals = (typeof module !== 'undefined') ? require('./goals.js') : Goals;
const studioSans = "'Geist', system-ui, sans-serif";
const studioNum = "'Barlow Condensed', sans-serif";
const studioSerif = "'Liberation Serif', 'DejaVu Serif', Georgia, 'Times New Roman', serif";
const Studio = {
  lens: 'all',
  picks: new Set(),
  arrows: new Set(),
  dayIds: new Set(),
  picking: false,
  shareOpen: false,
  shareKind: 'session',
  card: {layout: 'session', tilt: {x: 0, y: 0}, tone: 'dark', finish: 'metal', preset: 'range', photo: ''},
  FINISHES: [
    {id: 'metal', name: 'Metal'},
    {id: 'obsidian', name: 'Obsidiana'},
    {id: 'glass', name: 'Cristal'},
    {id: 'carbon', name: 'Carbono'}
  ],
  PRESETS: [
    {id: 'range', name: 'Campo', src: 'photos/range.jpg'},
    {id: 'field', name: 'Pradera', src: 'photos/field.jpg'},
    {id: 'targets', name: 'Dianas', src: 'photos/targets.jpg'},
    {id: 'bow', name: 'Arco', src: 'photos/bow.jpg'}
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
    presets.innerHTML = Studio.PRESETS.map(p => `<button type="button" data-preset="${p.id}" aria-label="${p.name}"><img src="${p.src}" alt=""></button>`).join('');
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
  if (box) box.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('on', b.dataset.layout === Studio.card.layout));
  const finish = Studio.card.finish || 'metal';
  document.querySelectorAll('#shareFinish [data-finish]').forEach(b => {
    const on = b.dataset.finish === finish;
    b.classList.toggle('sel', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  document.querySelectorAll('#sharePresets [data-preset]').forEach(b => b.classList.toggle('on', !Studio.card.photo && b.dataset.preset === Studio.card.preset));
  const clear = document.getElementById('sharePhotoClear');
  if (clear) clear.hidden = !Studio.card.photo;
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
function studioAimLoose(rows) {
  const aims = (rows || []).map(s => s.aim_score).filter(Number.isFinite);
  if (!aims.length) return null;
  return 100 - aims.reduce((x, y) => x + y, 0) / aims.length;
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
function studioScoreLine(totals, shots, format) {
  if (!totals || totals.score == null) return '–';
  const max = format ? StudioScore.roundMax(shots, format) : (totals.arrows || 0) * 10;
  return max ? totals.score + ' / ' + max : String(totals.score);
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
  let chart = 'Agrupación';
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
    chart = bars.some(b => studioSpread(b.rows) != null) ? 'Agrupación' : 'Estabilidad de puntería';
    return studioCardPack(headline, subtitle, when, shots, sets.length, duration, bars, chart, grouped, studioPhotoSrc());
  }
  if (layout === 'best') {
    const best = Studio.bestSet(sessionShots.length ? sessionShots : history);
    shots = best ? best.rows : [];
    headline = 'Mejor tanda';
    subtitle = best ? 'Tanda ' + best.index + (session && session.mode === 'Indoor' ? ' · 18 M' : '') : studioSubtitle(session);
    bars = best ? [{n: best.index, rows: best.rows}] : [];
  } else {
    bars = studioSetsOf(shots);
  }
  chart = bars.some(b => studioSpread(b.rows) != null) ? 'Agrupación' : 'Estabilidad de puntería';
  const sets = studioSetsOf(shots);
  return studioCardPack(headline, subtitle, when, shots, sets.length, duration, bars, chart, format, studioPhotoSrc());
}
function studioCardPack(headline, subtitle, when, shots, series, duration, bars, chart, format, photo) {
  const totals = StudioScore.totals(shots);
  const measured = (bars || []).map(b => {
    const spread = studioSpread(b.rows);
    return {n: b.n, value: spread != null ? spread : studioAimLoose(b.rows)};
  }).filter(b => b.value != null);
  const center = format === 'lancaster' ? '11' : format === 'wa' ? '' : 'X';
  return {
    brand: 'ARCHERY WATCH',
    headline, subtitle,
    date: studioCornerDate(when),
    scoreLine: studioScoreLine(totals, shots, format),
    center,
    impacts: StudioScore.impacts(shots).slice(-80),
    stats: [
      {id: 'arrows', label: 'Flechas', value: String(totals.arrows || 0)},
      {id: 'series', label: 'Series', value: String(series || 0)},
      {id: 'avg', label: 'Media', value: studioAvgText(totals.avg)},
      {id: 'time', label: 'Duración', value: studioDurationText(duration)}
    ],
    chart, chartNote: 'Menor es mejor',
    bars: measured.slice(-12),
    photo: photo || ''
  };
}

function studioPalette(tone) {
  if (tone === 'light') return {field: '#e6e1d6', glass: '#f6f3ec', ink: '#1b1916', muted: '#6d685f', onPhoto: '#f7f4ee'};
  return {field: '#050506', glass: '#0c0c0e', ink: '#f3f1ec', muted: '#9b968d', onPhoto: '#f7f4ee'};
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
  Studio.card.gradeKey = '';
  Studio.card.gradeCanvas = null;
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
function studioCardSheen(ctx, x, y, w, h, r, tilt, gloss, accent) {
  const rx = tilt && Number.isFinite(tilt.x) ? tilt.x : 0;
  const ry = tilt && Number.isFinite(tilt.y) ? tilt.y : 0;
  const amount = Number.isFinite(gloss) ? gloss : 0.2;
  ctx.save();
  if (r > 0) { studioRound(ctx, x, y, w, h, r); ctx.clip(); }
  ctx.translate(x + w * 0.22 + (20 + ry) * 14, y + h * 0.06 - rx * 12);
  ctx.rotate(-0.72);
  const g = ctx.createLinearGradient(-w * 0.05, 0, w * 0.72, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.36, 'rgba(255,255,255,0)');
  g.addColorStop(0.46, studioRgba(accent || '#fff', amount * 0.16));
  g.addColorStop(0.5, 'rgba(255,255,255,' + (0.06 + amount * 0.5) + ')');
  g.addColorStop(0.55, 'rgba(186,210,255,' + (amount * 0.1) + ')');
  g.addColorStop(0.64, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-w * 1.6, -h, w * 3.4, h * 2.8);
  ctx.restore();
}
function studioPhotoSrc() {
  if (Studio.card.photo) return Studio.card.photo;
  const list = Studio.PRESETS || [];
  const hit = list.find(p => p.id === Studio.card.preset) || list[0];
  return hit ? hit.src : '';
}
function studioRand(seed) {
  let s = seed || 1;
  return () => { s = (s * 48271) % 2147483647; return s / 2147483647; };
}
function studioMetalBrush() {
  if (Studio.card.metalBrush) return Studio.card.metalBrush;
  const c = document.createElement('canvas');
  c.width = 48; c.height = 320;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, '#c5cad0');
  g.addColorStop(0.42, '#8e949b');
  g.addColorStop(1, '#6a7076');
  x.fillStyle = g;
  x.fillRect(0, 0, 48, 320);
  const rnd = studioRand(19);
  for (let i = 0; i < 900; i++) {
    const yy = rnd() * 320;
    x.strokeStyle = rnd() > 0.55 ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.18)';
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(0, yy);
    x.lineTo(48, yy + (rnd() - 0.5) * 1.2);
    x.stroke();
  }
  Studio.card.metalBrush = c;
  return c;
}
function studioNoiseTile() {
  if (Studio.card.noiseTile) return Studio.card.noiseTile;
  const n = 160;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d');
  const img = x.createImageData(n, n);
  const rnd = studioRand(73);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  Studio.card.noiseTile = c;
  return c;
}
function studioCarbonTile() {
  if (Studio.card.carbonTile) return Studio.card.carbonTile;
  const cell = 10;
  const c = document.createElement('canvas');
  c.width = cell * 4; c.height = cell * 4;
  const x = c.getContext('2d');
  for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) {
    const twill = ((xx + yy) % 4) < 2;
    x.fillStyle = twill ? '#2a2e32' : '#101214';
    x.fillRect(xx * cell, yy * cell, cell, cell);
    x.fillStyle = twill ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.35)';
    x.fillRect(xx * cell, yy * cell, cell, 2);
  }
  Studio.card.carbonTile = c;
  return c;
}
function studioPaintFinish(ctx, id, accent, tilt) {
  const W = 1080, H = 1350;
  if (id === 'obsidian') {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#23262c');
    g.addColorStop(0.45, '#101114');
    g.addColorStop(1, '#1a1c20');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = ctx.createPattern(studioNoiseTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const ox = (tilt && tilt.y || 0) * 10;
    const oy = (tilt && tilt.x || 0) * -8;
    ctx.save();
    ctx.lineWidth = 2;
    [[180 + ox, 980 + oy, 260, 0.2, 1.7], [860 + ox, 640 + oy, 190, 3.6, 5.2], [420 + ox, 1180 + oy, 340, 0.8, 2.1]].forEach(arc => {
      ctx.beginPath();
      ctx.arc(arc[0], arc[1], arc[2], arc[3], arc[4]);
      ctx.strokeStyle = 'rgba(255,255,255,.09)';
      ctx.stroke();
    });
    ctx.restore();
    const gloss = ctx.createRadialGradient(W * 0.3 + ox, 180 + oy, 10, W * 0.45, 280, 520);
    gloss.addColorStop(0, 'rgba(255,255,255,.16)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  if (id === 'carbon') {
    ctx.fillStyle = ctx.createPattern(studioCarbonTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255,255,255,.05)');
    g.addColorStop(0.5, 'rgba(0,0,0,.18)');
    g.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  if (id === 'glass') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1d26');
    g.addColorStop(1, '#0b0c10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.5, 160, 20, W * 0.5, 420, 640);
    glow.addColorStop(0, studioRgba(accent, 0.2));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    const frost = ctx.createLinearGradient(0, 0, 0, 260);
    frost.addColorStop(0, 'rgba(255,255,255,.1)');
    frost.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = frost;
    ctx.fillRect(0, 0, W, 260);
    return;
  }
  ctx.drawImage(studioMetalBrush(), 0, 0, W, H);
  ctx.fillStyle = studioRgba(accent, 0.07);
  ctx.fillRect(0, 0, W, H);
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, 'rgba(255,255,255,.16)');
  shade.addColorStop(0.35, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(0,0,0,.2)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
}
function studioGradedPhoto(img, src) {
  const key = String(src) + '|v3';
  if (Studio.card.gradeKey === key && Studio.card.gradeCanvas) return Studio.card.gradeCanvas;
  const W = 1080, H = 700;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  x.filter = 'grayscale(1) contrast(1.05) brightness(0.8)';
  x.drawImage(img, (W - dw) / 2, Math.min(0, (H - dh) / 2), dw, dh);
  x.filter = 'none';
  x.fillStyle = 'rgba(92, 94, 98, 0.46)';
  x.fillRect(0, 0, W, H);
  const top = x.createLinearGradient(0, 0, 0, 150);
  top.addColorStop(0, 'rgba(10,10,12,.55)');
  top.addColorStop(1, 'rgba(10,10,12,0)');
  x.fillStyle = top;
  x.fillRect(0, 0, W, 150);
  x.globalCompositeOperation = 'destination-out';
  const fade = x.createLinearGradient(0, 400, 0, H);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = fade;
  x.fillRect(0, 400, W, H - 400);
  Studio.card.gradeKey = key;
  Studio.card.gradeCanvas = c;
  return c;
}
function studioFill(ctx, text, x, y, color, relief) {
  if (relief === 'emboss') {
    ctx.fillStyle = 'rgba(0,0,0,.42)';
    ctx.fillText(text, x + 1.5, y + 2);
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.fillText(text, x - 0.7, y - 0.8);
  } else if (relief === 'engrave') {
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.fillText(text, x - 0.7, y - 0.7);
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.fillText(text, x + 1, y + 1.2);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
function studioTrackAt(ctx, text, x, y, tracking, color, relief) {
  let cx = x;
  const s = String(text || '');
  for (const ch of s) {
    studioFill(ctx, ch, cx, y, color, relief);
    cx += ctx.measureText(ch).width + tracking;
  }
}
function studioTrackWidth(ctx, text, tracking) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + tracking;
  return Math.max(0, w - tracking);
}
function studioFit(ctx, text, max, size, weight, family) {
  let px = size;
  const font = n => weight + ' ' + n + 'px ' + family;
  ctx.font = font(px);
  while (px > 28 && ctx.measureText(text).width > max) {
    px -= 2;
    ctx.font = font(px);
  }
  return px;
}
function studioStatIcon(ctx, id, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (id === 'arrows') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, s * 0.28);
    ctx.lineTo(s * 0.3, -s * 0.28);
    ctx.moveTo(0, -s * 0.28);
    ctx.lineTo(s * 0.3, -s * 0.28);
    ctx.lineTo(s * 0.3, 0.02);
    ctx.stroke();
  } else if (id === 'series') {
    [-0.26, 0, 0.26].forEach((yy, i) => {
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, yy * s);
      ctx.lineTo(s * (0.02 + i * 0.14), yy * s);
      ctx.stroke();
    });
  } else if (id === 'time') {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
    ctx.moveTo(0, -s * 0.16);
    ctx.lineTo(0, 0);
    ctx.lineTo(s * 0.14, s * 0.08);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
    ctx.moveTo(-s * 0.18, s * 0.08);
    ctx.lineTo(0, -s * 0.1);
    ctx.lineTo(s * 0.2, s * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}
function studioTargetFace(ctx, cx, cy, R, impacts, center, accent) {
  ctx.save();
  const shade = ctx.createRadialGradient(cx, cy + R * 0.92, R * 0.08, cx, cy + R * 0.98, R * 0.95);
  shade.addColorStop(0, 'rgba(0,0,0,.32)');
  shade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(cx, cy + R * 0.96, R * 0.78, R * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  const disk = (k, color) => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * k, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  disk(1.045, '#f4f0e6');
  disk(1, '#1a6f9c');
  disk(0.8, '#c4232c');
  disk(0.4, '#e4be55');
  disk(0.2, '#f0d78a');
  const hair = Math.max(1.25, R * 0.008);
  const ring = (k, color) => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * k, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = hair;
    ctx.stroke();
  };
  ring(1, 'rgba(255,255,255,.42)');
  ring(0.8, 'rgba(255,255,255,.38)');
  ring(0.6, 'rgba(255,255,255,.28)');
  ring(0.4, 'rgba(42,28,8,.42)');
  ring(0.2, 'rgba(42,28,8,.38)');
  ring(0.1, 'rgba(42,28,8,.5)');
  const gloss = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.34, R * 0.04, cx, cy, R * 1.05);
  gloss.addColorStop(0, 'rgba(255,255,255,.3)');
  gloss.addColorStop(0.42, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  disk(1, gloss);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (R >= 88) {
    ctx.font = '600 ' + Math.round(R * 0.062) + 'px ' + studioSans;
    const num = (text, r, color) => { ctx.fillStyle = color; ctx.fillText(text, cx, cy - r); };
    num('6', R * 0.9, 'rgba(244,248,252,.88)');
    num('7', R * 0.7, 'rgba(255,236,232,.8)');
    num('8', R * 0.5, 'rgba(255,236,232,.72)');
    num('9', R * 0.3, 'rgba(48,32,8,.62)');
    num('10', R * 0.15, 'rgba(48,32,8,.7)');
  }
  if (center) {
    ctx.fillStyle = 'rgba(48,32,8,.78)';
    ctx.font = '600 ' + Math.round(R * 0.07) + 'px ' + studioSerif;
    ctx.fillText(center, cx, cy + R * 0.012);
  }
  (impacts || []).forEach((p, i) => {
    const rr = Math.hypot(p.x, p.y);
    const lim = 1.02;
    const sx = rr > lim ? p.x * lim / rr : p.x;
    const sy = rr > lim ? p.y * lim / rr : p.y;
    const last = i === impacts.length - 1;
    ctx.beginPath();
    ctx.arc(cx + sx * R, cy + sy * R, last ? R * 0.038 : R * 0.026, 0, Math.PI * 2);
    ctx.fillStyle = last ? accent : '#f7f4ee';
    ctx.fill();
    ctx.lineWidth = Math.max(1.2, R * 0.008);
    ctx.strokeStyle = 'rgba(16,12,8,.82)';
    ctx.stroke();
  });
  ctx.restore();
}
function studioSparkline(ctx, x, y, w, h, bars, accent) {
  if (!bars || !bars.length) return;
  const vals = bars.map(b => b.value);
  const max = Math.max.apply(null, vals);
  const min = Math.min.apply(null, vals);
  const span = max - min || 1;
  const pts = vals.map((v, i) => ({
    x: x + (vals.length === 1 ? w / 2 : (i / (vals.length - 1)) * w),
    y: y + h - ((v - min) / span) * (h * 0.86) - h * 0.08
  }));
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, y + h);
  ctx.lineTo(pts[0].x, y + h);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, studioRgba(accent, 0.28));
  fill.addColorStop(1, studioRgba(accent, 0));
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
}
function studioScorePaint(ctx, line, cx, baseline, maxW, ink, muted, relief, align) {
  const bits = String(line || '–').split(' / ');
  let big = 132;
  const fontBig = n => 'normal ' + n + 'px ' + studioSerif;
  const fontSmall = n => 'normal ' + Math.round(n * 0.42) + 'px ' + studioSerif;
  const widthOf = () => {
    ctx.font = fontBig(big);
    const a = ctx.measureText(bits[0]).width;
    ctx.font = fontSmall(big);
    const b = bits[1] ? ctx.measureText(' / ' + bits[1]).width : 0;
    return {a, b};
  };
  let box = widthOf();
  while (big > 72 && box.a + box.b > maxW) { big -= 4; box = widthOf(); }
  const x = align === 'left' ? cx : cx - (box.a + box.b) / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = fontBig(big);
  studioFill(ctx, bits[0], x, baseline, ink, relief);
  if (bits[1]) {
    ctx.font = fontSmall(big);
    studioFill(ctx, ' / ' + bits[1], x + box.a, baseline, muted, relief);
  }
}
function studioFinishInk(id) {
  if (id === 'metal') return {ink: '#2a2d31', muted: '#3c4148', score: '#f6f7f8', scoreMuted: 'rgba(255,255,255,.62)', onPhoto: 'rgba(255,255,255,.9)', relief: 'emboss', label: 'engrave', gloss: 0.62, edge: 'rgba(255,255,255,.7)'};
  if (id === 'carbon') return {ink: '#f3f0ea', muted: '#b7b2a8', score: '#f7f4ee', scoreMuted: 'rgba(243,240,234,.55)', onPhoto: 'rgba(255,255,255,.9)', relief: '', label: '', gloss: 0.22, edge: ''};
  if (id === 'glass') return {ink: '#f4f1ea', muted: '#c2bdb4', score: '#f7f4ee', scoreMuted: 'rgba(247,244,238,.5)', onPhoto: 'rgba(255,255,255,.9)', relief: '', label: '', gloss: 0.18, edge: ''};
  return {ink: '#f4f1ea', muted: '#c8c2b8', score: '#f7f4ee', scoreMuted: 'rgba(247,244,238,.5)', onPhoto: 'rgba(255,255,255,.9)', relief: '', label: '', gloss: 0.28, edge: 'rgba(255,255,255,.22)'};
}
function studioPaintCard(ctx, w, h, layout) {
  const view = studioCardView(layout || Studio.card.layout);
  const theme = Studio.theme();
  const finish = Studio.FINISHES.some(f => f.id === Studio.card.finish) ? Studio.card.finish : 'metal';
  const ink = studioFinishInk(finish);
  const tilt = Studio.card.tilt || {x: 0, y: 0};
  const s = w / 1080;
  const W = 1080, H = 1350, rad = 44;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#050506';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  studioRound(ctx, 0, 0, W, H, rad);
  ctx.clip();
  studioPaintFinish(ctx, finish, theme.acc, tilt);
  const photo = studioHeaderImage(view.photo);
  if (photo) ctx.drawImage(studioGradedPhoto(photo, view.photo), 0, 0);
  const left = 72, right = 1008;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '600 18px ' + studioSans;
  ctx.textAlign = 'left';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 8;
  studioTrackAt(ctx, view.brand, left, 78, 4.2, ink.onPhoto, '');
  ctx.restore();
  ctx.font = '600 18px ' + studioSans;
  ctx.textAlign = 'right';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 8;
  studioFill(ctx, view.date || '', right, 78, ink.onPhoto, '');
  ctx.restore();
  ctx.textAlign = 'left';
  const title = view.headline || '';
  const titlePx = studioFit(ctx, title, right - left - 210, 42, '560', studioSans);
  ctx.font = '560 ' + titlePx + 'px ' + studioSans;
  studioFill(ctx, title, left, 792, ink.ink, ink.label);
  ctx.font = '600 18px ' + studioSans;
  studioTrackAt(ctx, String(view.subtitle || '').toUpperCase(), left, 838, 2.6, ink.muted, ink.label);
  const scoreRelief = finish === 'metal' ? 'emboss' : '';
  studioScorePaint(ctx, view.scoreLine, left, 1004, right - left - 250, ink.score, ink.scoreMuted, scoreRelief, 'left');
  studioTargetFace(ctx, right - 108, 968, 96, view.impacts, view.center, theme.acc);
  const stats = (view.stats || []).slice(0, 4);
  const colW = (right - left) / Math.max(1, stats.length);
  stats.forEach((cell, i) => {
    const cx = left + colW * i + colW / 2;
    studioStatIcon(ctx, cell.id, cx, 1116, 26, theme.acc);
    ctx.textAlign = 'center';
    const value = cell.value || '–';
    const px = studioFit(ctx, value, colW - 16, 36, '600', studioNum);
    ctx.font = '600 ' + px + 'px ' + studioNum;
    studioFill(ctx, value, cx, 1172, ink.ink, ink.label);
    ctx.font = '600 14px ' + studioSans;
    const label = String(cell.label || '').toUpperCase();
    const lw = studioTrackWidth(ctx, label, 1.6);
    studioTrackAt(ctx, label, cx - lw / 2, 1206, 1.6, ink.muted, ink.label);
  });
  ctx.textAlign = 'left';
  ctx.font = '600 16px ' + studioSans;
  studioTrackAt(ctx, String(view.chart || 'AGRUPACIÓN').toUpperCase(), left, 1264, 2, ink.muted, ink.label);
  const note = String(view.chartNote || '').toUpperCase();
  ctx.font = '500 14px ' + studioSans;
  const noteW = studioTrackWidth(ctx, note, 1.3);
  studioTrackAt(ctx, note, right - noteW, 1264, 1.3, ink.muted, '');
  const bars = (view.bars || []).slice(-8);
  if (bars.length) studioSparkline(ctx, left, 1284, right - left, 36, bars, theme.acc);
  else {
    ctx.strokeStyle = studioRgba(theme.acc, 0.55);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(left, 1302);
    ctx.lineTo(right, 1302);
    ctx.stroke();
  }
  ctx.font = '600 14px ' + studioSans;
  ctx.textAlign = 'left';
  studioTrackAt(ctx, 'CADA FLECHA CUENTA', left, 1334, 3, ink.muted, ink.label);
  const gloss = ink.gloss;
  studioCardSheen(ctx, 0, 0, W, H, rad, tilt, gloss, theme.acc);
  ctx.restore();
  ctx.lineWidth = finish === 'metal' ? 2.5 : 1.75;
  ctx.strokeStyle = finish === 'glass' || finish === 'carbon' ? studioRgba(theme.acc, 0.75) : ink.edge;
  studioRound(ctx, 1.5, 1.5, W - 3, H - 3, rad);
  ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function studioPaintThumbs() {
  const host = document.getElementById('shareThumbs');
  if (!host) return;
  if (host.childElementCount !== Studio.LAYOUTS.length) {
    host.innerHTML = Studio.LAYOUTS.map(t => `<button type="button" data-layout="${t.id}" aria-label="${t.name}"><canvas width="180" height="225"></canvas></button>`).join('');
  }
  const keep = Studio.card.layout;
  host.querySelectorAll('[data-layout]').forEach(b => {
    b.classList.toggle('on', b.dataset.layout === keep);
    const canvas = b.querySelector('canvas');
    if (!canvas) return;
    Studio.card.layout = b.dataset.layout;
    studioPaintCard(canvas.getContext('2d'), canvas.width, canvas.height, b.dataset.layout);
  });
  Studio.card.layout = keep;
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
  const tilt = {...(Studio.card.tilt || {x: 0, y: 0})};
  Studio.card.tilt = {x: -6, y: 10};
  studioDrawShare(false);
  const png = canvas.toDataURL('image/png');
  Studio.card.tilt = tilt;
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
