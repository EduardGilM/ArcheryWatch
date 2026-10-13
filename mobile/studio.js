/* Perfil, temas, tandas y tarjetas. El ámbar sigue siendo el acento por defecto. */
const StudioScore = (typeof module !== 'undefined') ? require('./score.js') : Score;
const StudioGoals = (typeof module !== 'undefined') ? require('./goals.js') : Goals;
const studioSans = "'Geist', system-ui, sans-serif";
const studioNum = "'Barlow Condensed', sans-serif";
const Studio = {
  lens: 'all',
  picks: new Set(),
  arrows: new Set(),
  dayIds: new Set(),
  picking: false,
  shareOpen: false,
  shareKind: 'session',
  card: {layout: 'session', tilt: {x: 0, y: 0}, tone: 'dark'},
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
      const modeBtn = e.target.closest('[data-mode]');
      if (modeBtn && modeBtn.closest('#setList')) {
        e.preventDefault();
        e.stopPropagation();
        const sid = modeBtn.closest('details') && modeBtn.closest('details').dataset.sid;
        if (sid != null) studioCommit(s => Studio.applyPhase(s, modeBtn.dataset.mode, [sid]));
        return;
      }
      const start = e.target.closest('[data-pick="start"]');
      if (start) {
        e.preventDefault();
        Studio.picking = true;
        studioSync();
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
  const tone = $('shareTone');
  if (tone) tone.onclick = e => {
    const b = e.target.closest('[data-tone]');
    if (!b) return;
    Studio.card.tone = b.dataset.tone === 'light' ? 'light' : 'dark';
    studioDrawShare();
  };
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
    round.hidden = !session;
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
  bar.hidden = !hasShots;
  bar.classList.toggle('on', !!(hasShots && Studio.picking));
  if (!hasShots) { bar.innerHTML = ''; return; }
  if (!Studio.picking) {
    if (!bar.querySelector('[data-pick="start"]')) bar.innerHTML = '<button type="button" class="pickStart" data-pick="start">Seleccionar</button>';
    return;
  }
  if (!bar.querySelector('.pickBarOn')) {
    bar.innerHTML = '<div class="pickBarOn"><div class="setModesTop"><span id="pickCount"></span><button type="button" data-bulk="done">Hecho</button></div><div class="pickScope"><button type="button" data-scope="session">Sesión</button><button type="button" data-scope="day">Día</button></div><span class="modeSeg"><button type="button" data-bulk="warm">Calentamiento</button><button type="button" data-bulk="score">Puntuable</button><button type="button" data-bulk="">Libre</button></span></div>';
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
  const tone = document.getElementById('shareTone');
  if (tone) tone.querySelectorAll('[data-tone]').forEach(b => b.classList.toggle('sel', b.dataset.tone === (Studio.card.tone === 'light' ? 'light' : 'dark')));
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
    return studioCardPack(headline, subtitle, when, shots, sets.length, duration, bars, chart, grouped, profile.photo || '');
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
  return studioCardPack(headline, subtitle, when, shots, sets.length, duration, bars, chart, format, profile.photo || '');
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
      {id: 'time', label: 'Duración', value: studioDurationText(duration)},
      {id: 'avg', label: 'Media', value: studioAvgText(totals.avg)}
    ],
    chart, chartNote: 'Menor es mejor',
    bars: measured.slice(-12),
    photo: photo || ''
  };
}

function studioPalette(tone) {
  if (tone === 'light') return {bg: '#f6f3ec', ink: '#16161a', muted: '#5c5c66', onPhoto: '#ffffff'};
  return {bg: '#121316', ink: '#f4f5f7', muted: '#a3a3ab', onPhoto: '#ffffff'};
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
function studioRangeScene(tone, accent) {
  const key = tone + '|' + accent;
  if (Studio.card.rangeKey === key && Studio.card.rangeCanvas) return Studio.card.rangeCanvas;
  const c = document.createElement('canvas');
  c.width = 540;
  c.height = 680;
  const x = c.getContext('2d');
  const w = 540, h = 680;
  const sky = x.createLinearGradient(0, 0, 0, h);
  if (tone === 'light') {
    sky.addColorStop(0, '#c5d7e8');
    sky.addColorStop(0.38, '#f3e6d2');
    sky.addColorStop(0.62, '#d7c4a4');
    sky.addColorStop(1, '#b7c48a');
  } else {
    sky.addColorStop(0, '#17283c');
    sky.addColorStop(0.34, '#3d5168');
    sky.addColorStop(0.58, '#8a6244');
    sky.addColorStop(1, '#2c3424');
  }
  x.fillStyle = sky;
  x.fillRect(0, 0, w, h);
  const sun = x.createRadialGradient(w * 0.74, h * 0.2, 6, w * 0.74, h * 0.2, 180);
  sun.addColorStop(0, studioRgba(accent, tone === 'light' ? 0.7 : 0.55));
  sun.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = sun;
  x.fillRect(0, 0, w, h);
  x.fillStyle = tone === 'light' ? '#6e8a52' : '#243222';
  x.beginPath();
  x.moveTo(0, h * 0.66);
  for (let i = 0; i <= 14; i++) x.lineTo((i / 14) * w, h * (0.56 + (i % 3) * 0.018));
  x.lineTo(w, h);
  x.lineTo(0, h);
  x.fill();
  x.fillStyle = tone === 'light' ? '#8fa86c' : '#3a4a30';
  x.fillRect(0, h * 0.64, w, h);
  [0.16, 0.34, 0.52, 0.7, 0.86].forEach((fx, i) => {
    const bx = w * fx, by = h * 0.55, bw = 26 + (i % 2) * 6, bh = 52;
    x.fillStyle = tone === 'light' ? '#d9c7ae' : '#6d5c49';
    x.fillRect(bx, by, 4, bh);
    x.fillRect(bx + bw, by, 4, bh);
    x.fillRect(bx, by + bh - 6, bw + 4, 6);
    x.beginPath();
    x.arc(bx + bw / 2, by + 18, 16, 0, Math.PI * 2);
    x.fillStyle = i % 2 ? '#3e6278' : '#a34b48';
    x.fill();
    x.beginPath();
    x.arc(bx + bw / 2, by + 18, 7, 0, Math.PI * 2);
    x.fillStyle = '#f0e2b8';
    x.fill();
  });
  Studio.card.rangeKey = key;
  Studio.card.rangeCanvas = c;
  return c;
}
function studioCardSheen(ctx, x, y, w, h, r, tilt, tone) {
  const shift = tilt && Number.isFinite(tilt.y) ? tilt.y : 8;
  ctx.save();
  studioRound(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.translate(x + w * 0.55 + shift * 12, y + h * 0.32);
  ctx.rotate(-0.6);
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  const a = tone === 'light' ? 0.2 : 0.12;
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.46, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,' + a + ')');
  g.addColorStop(0.55, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-w * 1.6, -h, w * 3.2, h * 2);
  ctx.restore();
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
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + R + 16, R * 0.62, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  const disk = (k, color) => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * k, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  disk(1, '#3E6278');
  disk(0.8, '#A34B48');
  disk(0.4, '#E6CC8E');
  disk(0.2, '#F6E7C2');
  ctx.strokeStyle = 'rgba(28,22,16,.5)';
  ctx.lineWidth = Math.max(1.5, R * 0.012);
  [1, 0.8, 0.6, 0.4, 0.2, 0.1].forEach(k => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * k, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 ' + Math.round(R * 0.072) + 'px ' + studioSans;
  const num = (text, r, color) => { ctx.fillStyle = color; ctx.fillText(text, cx, cy - r); };
  num('6', R * 0.9, 'rgba(236,242,246,.9)');
  num('7', R * 0.7, 'rgba(42,18,18,.72)');
  num('8', R * 0.5, 'rgba(42,18,18,.72)');
  num('9', R * 0.3, 'rgba(44,36,22,.7)');
  num('10', R * 0.15, 'rgba(44,36,22,.7)');
  if (center) {
    ctx.fillStyle = 'rgba(44,36,22,.78)';
    ctx.font = '700 ' + Math.round(R * 0.085) + 'px ' + studioSans;
    ctx.fillText(center, cx, cy + R * 0.01);
  }
  (impacts || []).forEach((p, i) => {
    const rr = Math.hypot(p.x, p.y);
    const lim = 1.06;
    const sx = rr > lim ? p.x * lim / rr : p.x;
    const sy = rr > lim ? p.y * lim / rr : p.y;
    const last = i === impacts.length - 1;
    ctx.beginPath();
    ctx.arc(cx + sx * R, cy + sy * R, last ? R * 0.042 : R * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = last ? accent : '#F7F4EE';
    ctx.fill();
    ctx.lineWidth = Math.max(1.4, R * 0.01);
    ctx.strokeStyle = 'rgba(20,16,12,.8)';
    ctx.stroke();
  });
  ctx.restore();
}
function studioPaintCard(ctx, w, h, layout) {
  const view = studioCardView(layout || Studio.card.layout);
  const theme = Studio.theme();
  const tone = Studio.card.tone === 'light' ? 'light' : 'dark';
  const pal = studioPalette(tone);
  const tilt = Studio.card.tilt || {x: 0, y: 0};
  const s = w / 1080;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, 1080, 1350);
  ctx.save();
  studioRound(ctx, 0, 0, 1080, 1350, 56);
  ctx.clip();
  ctx.filter = 'blur(28px)';
  const img = studioHeaderImage(view.photo);
  if (img) {
    const scale = Math.max(1180 / img.naturalWidth, 1480 / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, (1080 - dw) / 2, (1350 - dh) / 2, dw, dh);
    ctx.filter = 'none';
    ctx.fillStyle = tone === 'light' ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.32)';
    ctx.fillRect(0, 0, 1080, 1350);
  } else {
    const scene = studioRangeScene(tone, theme.acc);
    ctx.drawImage(scene, -48, -40, 1176, 1460);
    ctx.filter = 'none';
  }
  const vig = ctx.createRadialGradient(540, 640, 180, 540, 700, 820);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, tone === 'light' ? 'rgba(70,55,35,.16)' : 'rgba(0,0,0,.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.restore();
  const gx = 46, gy = 46, gw = 988, gh = 1258, gr = 46;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.28)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 16;
  studioRound(ctx, gx, gy, gw, gh, gr);
  ctx.fillStyle = tone === 'light' ? 'rgba(255,252,248,.88)' : 'rgba(14,15,18,.78)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const gloss = ctx.createLinearGradient(gx, gy, gx, gy + 280);
  gloss.addColorStop(0, tone === 'light' ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.07)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  studioRound(ctx, gx, gy, gw, gh, gr);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = studioRgba(theme.acc, tone === 'light' ? 0.28 : 0.4);
  studioRound(ctx, gx, gy, gw, gh, gr);
  ctx.stroke();
  ctx.restore();
  const left = 96, right = 984, mid = 540;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = pal.muted;
  ctx.font = '600 20px ' + studioSans;
  ctx.textAlign = 'left';
  studioTrack(ctx, view.brand, left, 128, 3.4);
  ctx.textAlign = 'right';
  ctx.font = '600 20px ' + studioSans;
  ctx.fillText(view.date || '', right, 128);
  ctx.textAlign = 'left';
  ctx.fillStyle = pal.ink;
  const title = view.headline || '';
  const titlePx = studioFit(ctx, title, right - left, 58, '700', studioSans);
  ctx.font = '650 ' + titlePx + 'px ' + studioSans;
  ctx.fillText(title, left, 206);
  ctx.fillStyle = pal.muted;
  ctx.font = '600 22px ' + studioSans;
  const sub = String(view.subtitle || '').toUpperCase();
  studioTrack(ctx, sub, left, 256, 2.4);
  studioTargetFace(ctx, mid, 492, 196, view.impacts, view.center, theme.acc);
  const bits = String(view.scoreLine || '–').split(' / ');
  ctx.textAlign = 'left';
  ctx.font = '600 108px ' + studioNum;
  const scoreW = ctx.measureText(bits[0]).width;
  ctx.font = '500 64px ' + studioNum;
  const maxW = bits[1] ? ctx.measureText(' / ' + bits[1]).width : 0;
  const scoreX = mid - (scoreW + maxW) / 2;
  ctx.font = '600 108px ' + studioNum;
  ctx.fillStyle = pal.ink;
  ctx.fillText(bits[0], scoreX, 808);
  if (bits[1]) {
    ctx.font = '500 64px ' + studioNum;
    ctx.fillStyle = pal.muted;
    ctx.fillText(' / ' + bits[1], scoreX + scoreW, 808);
  }
  const stats = (view.stats || []).slice(0, 4);
  const colW = (right - left) / Math.max(1, stats.length);
  stats.forEach((cell, i) => {
    const cx = left + colW * i + colW / 2;
    studioStatIcon(ctx, cell.id, cx, 888, 36, theme.acc);
    ctx.textAlign = 'center';
    ctx.fillStyle = pal.ink;
    const value = cell.value || '–';
    const px = studioFit(ctx, value, colW - 12, 40, '600', studioNum);
    ctx.font = '600 ' + px + 'px ' + studioNum;
    ctx.fillText(value, cx, 948);
    ctx.fillStyle = pal.muted;
    ctx.font = '600 16px ' + studioSans;
    ctx.fillText(cell.label, cx, 978);
  });
  const bars = view.bars || [];
  if (bars.length) {
    ctx.textAlign = 'left';
    ctx.fillStyle = pal.ink;
    ctx.font = '600 22px ' + studioSans;
    ctx.fillText(view.chart || '', left, 1056);
    ctx.textAlign = 'right';
    ctx.fillStyle = pal.muted;
    ctx.font = '500 18px ' + studioSans;
    ctx.fillText(view.chartNote || '', right, 1056);
    const max = Math.max.apply(null, bars.map(b => b.value));
    const gap = 10;
    const bw = Math.min(48, (right - left - gap * (bars.length - 1)) / bars.length);
    const total = bw * bars.length + gap * (bars.length - 1);
    const x0 = left + (right - left - total) / 2;
    const base = 1192;
    const best = Math.min.apply(null, bars.map(b => b.value));
    bars.forEach((b, i) => {
      const bh = max > 0 ? Math.max(8, (b.value / max) * 108) : 8;
      const x = x0 + i * (bw + gap);
      const tight = b.value === best;
      ctx.fillStyle = studioRgba(theme.acc, tight ? 0.95 : 0.38);
      studioRound(ctx, x, base - bh, bw, bh, 8);
      ctx.fill();
      if (bars.length <= 12) {
        ctx.fillStyle = pal.muted;
        ctx.font = '500 14px ' + studioSans;
        ctx.textAlign = 'center';
        ctx.fillText(String(b.n), x + bw / 2, base + 24);
      }
    });
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = pal.muted;
  ctx.font = '600 16px ' + studioSans;
  studioTrack(ctx, 'CADA FLECHA CUENTA', left, 1272, 2.2);
  const foot = 'ARCHERY WATCH';
  const fw = studioTrackWidth(ctx, foot, 2.2);
  studioTrack(ctx, foot, right - fw, 1272, 2.2);
  studioCardSheen(ctx, gx, gy, gw, gh, gr, tilt, tone);
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
