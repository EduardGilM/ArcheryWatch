/* Perfil, temas, tandas y tarjetas. El ámbar sigue siendo el acento por defecto. */
const StudioScore = (typeof module !== 'undefined') ? require('./score.js') : Score;
const StudioGoals = (typeof module !== 'undefined') ? require('./goals.js') : Goals;
const studioSans = "'Geist', system-ui, sans-serif";
const studioNum = "'Barlow Condensed', sans-serif";
const Studio = {
  lens: 'all',
  picks: new Set(),
  picking: false,
  shareOpen: false,
  shareKind: 'session',
  card: {layout: 'session', tilt: {x: 0, y: 0}},
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
  applyPhase(session, phase, setIds) {
    const ids = new Set((setIds || []).map(v => String(v)));
    (session && session.shots || []).forEach(s => {
      if (!s || !ids.has(String(s.set_id))) return;
      if (phase === 'warm' || phase === 'score') s.phase = phase;
      else delete s.phase;
    });
    return session;
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
    if (!e.target.closest('#setList summary')) return false;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    return true;
  }
};
if (typeof module !== 'undefined') module.exports = Studio;

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
  let hold = 0, suppress = false, x0 = 0, y0 = 0;
  if (list) {
    list.addEventListener('pointerdown', e => {
      if (e.target.closest && (e.target.closest('.modeSeg') || e.target.closest('.setModes'))) return;
      const sum = e.target.closest && e.target.closest('summary');
      if (!sum || (e.target.closest && e.target.closest('.trendRow'))) return;
      x0 = e.clientX; y0 = e.clientY;
      clearTimeout(hold);
      const sid = sum.parentElement && sum.parentElement.dataset.sid;
      hold = setTimeout(() => {
        Studio.picking = true;
        if (sid != null) Studio.picks.add(sid);
        suppress = true;
        studioSync();
      }, 480);
    });
    const drop = e => {
      if (e && Math.hypot((e.clientX || 0) - x0, (e.clientY || 0) - y0) > 12) clearTimeout(hold);
    };
    list.addEventListener('pointermove', drop);
    list.addEventListener('pointerup', () => clearTimeout(hold));
    list.addEventListener('pointercancel', () => clearTimeout(hold));
    list.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('summary')) e.preventDefault(); });
    list.addEventListener('click', e => {
      const modeBtn = e.target.closest && e.target.closest('[data-mode]');
      if (modeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const sid = modeBtn.closest('details') && modeBtn.closest('details').dataset.sid;
        if (sid != null) studioCommit(s => Studio.applyPhase(s, modeBtn.dataset.mode, [sid]));
        return;
      }
      const bulk = e.target.closest && e.target.closest('[data-bulk]');
      if (bulk) {
        e.preventDefault();
        e.stopPropagation();
        if (bulk.dataset.bulk === 'done') { Studio.picking = false; Studio.picks.clear(); studioSync(); return; }
        const ids = [...Studio.picks];
        Studio.picking = false;
        Studio.picks.clear();
        studioCommit(s => Studio.applyPhase(s, bulk.dataset.bulk, ids));
        return;
      }
      if (!Studio.picking) return;
      const sum = e.target.closest && e.target.closest('summary');
      if (!sum) return;
      e.preventDefault();
      e.stopPropagation();
      if (suppress) { suppress = false; return; }
      const sid = sum.parentElement && sum.parentElement.dataset.sid;
      if (sid == null) return;
      if (Studio.picks.has(sid)) Studio.picks.delete(sid); else Studio.picks.add(sid);
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
    if (view === 'Profile') studioPaintProfile();
    if (view === 'Progress') { studioPaintProgress(); studioPaintHeat(); }
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
    d.classList.toggle('picked', Studio.picking && Studio.picks.has(d.dataset.sid));
    d.hidden = Studio.lens !== 'all' && d.dataset.phase !== Studio.lens;
  });
  studioSyncShare();
}

function studioModes() {
  const list = document.getElementById('setList');
  if (!list) return;
  const existing = document.getElementById('setModes');
  if (!Studio.picking) { if (existing) existing.remove(); return; }
  const fresh = !existing;
  if (fresh) list.insertAdjacentHTML('afterbegin', '<div class="setModes" id="setModes"><div class="setModesTop"><span id="pickCount"></span><button type="button" data-bulk="done">Hecho</button></div><span class="modeSeg"><button type="button" data-bulk="warm">Calentamiento</button><button type="button" data-bulk="score">Puntuable</button><button type="button" data-bulk="">Libre</button></span></div>');
  const count = document.getElementById('pickCount');
  if (count) count.textContent = Studio.picks.size + (Studio.picks.size === 1 ? ' set' : ' sets');
  if (fresh) document.getElementById('setModes').scrollIntoView({block: 'nearest'});
}

function studioSyncShare() {
  const box = document.getElementById('shareThumbs');
  if (box) box.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('on', b.dataset.layout === Studio.card.layout));
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

function studioCardView(layout) {
  const session = typeof displayedSession === 'function' ? displayedSession() : null;
  const profile = Studio.profile();
  const sessionShots = typeof studioShotSource === 'function' ? studioShotSource() : [];
  const history = Studio.historyShots();
  const when = session && session.id ? session.id : Date.now();
  const copy = Studio.cardCopy(session, when);
  const format = session ? StudioScore.formatOf(session) : null;
  const formatName = format && StudioScore.FORMATS[format] ? StudioScore.FORMATS[format].name.toUpperCase() : '';
  let shots = sessionShots;
  let kicker = copy.kicker;
  let date = copy.date;
  let hero = 'target';
  let score = null;
  let line2 = '';
  let line3 = profile.name || '';
  if (layout === 'profile') {
    shots = history;
    kicker = 'PERFIL';
    date = profile.club || '';
    const totals = StudioScore.totals(shots);
    score = totals.score;
    line2 = profile.name || 'ArcheryWatch';
    line3 = (totals.arrows || 0) + (totals.arrows === 1 ? ' flecha' : ' flechas');
  } else if (layout === 'best') {
    const best = Studio.bestSet(sessionShots.length ? sessionShots : history);
    shots = best ? best.rows : [];
    kicker = 'MEJOR TANDA';
    date = best ? 'TANDA ' + best.index : '';
    score = best ? best.sum : null;
    hero = 'number';
    line2 = Studio.breakdown(shots);
    line3 = profile.name || '';
    if (formatName) date = date ? date + ' · ' + formatName : formatName;
  } else {
    const pool = Studio.scorePool(shots);
    const totals = StudioScore.totals(pool);
    score = totals.score;
    line2 = Studio.breakdown(pool);
    if (formatName) date = (date ? date + ' · ' : '') + formatName;
    if (format && totals.score != null) {
      const max = StudioScore.roundMax(pool, format);
      line3 = [profile.name, max ? totals.score + '/' + max : ''].filter(Boolean).join(' · ');
    }
  }
  return {
    brand: 'ARCHERY WATCH',
    kicker, date, hero,
    title: score == null ? '–' : String(score),
    line2, line3,
    impacts: hero === 'number' ? [] : StudioScore.impacts(Studio.scorePool(shots))
  };
}

function studioHoloTarget(ctx, cx, cy, R, accent, tilt, impacts) {
  const lx = ((tilt && tilt.y) || 8) / 16;
  const ly = ((tilt && tilt.x) || -6) / 16;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.beginPath();
  ctx.ellipse(cx + 8, cy + R * 1.05, R * 0.82, R * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  const glow = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.55);
  glow.addColorStop(0, studioRgba(accent, 0.5));
  glow.addColorStop(0.4, studioRgba(accent, 0.14));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2);
  ctx.fill();
  const rings = [
    {r: 1, color: '#1a6798'},
    {r: 0.8, color: '#d83a48'},
    {r: 0.58, color: '#f2d48a'},
    {r: 0.34, color: accent},
    {r: 0.16, color: '#fff6e4'}
  ];
  rings.forEach(ring => {
    const rad = R * ring.r;
    const g = ctx.createRadialGradient(cx - lx * rad * 0.8, cy - ly * rad * 0.8, rad * 0.08, cx + lx * 6, cy + ly * 6, rad);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.22, studioMix('#ffffff', ring.color, 0.35));
    g.addColorStop(0.55, ring.color);
    g.addColorStop(1, studioMix(ring.color, '#07060a', 0.62));
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  });
  const rim = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  [[0, '#d9c6ff'], [0.22, accent], [0.46, '#9af6ff'], [0.68, '#ffe08a'], [0.86, '#ff8ad8'], [1, accent]].forEach(stop => rim.addColorStop(stop[0], stop[1]));
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(8, R * 0.07);
  ctx.strokeStyle = rim;
  ctx.stroke();
  ctx.save();
  ctx.translate(cx - lx * R * 0.28, cy - ly * R * 0.32);
  ctx.rotate(-0.7);
  ctx.scale(1.15, 0.42);
  const spec = ctx.createRadialGradient(0, 0, 4, 0, 0, R * 0.62);
  spec.addColorStop(0, 'rgba(255,255,255,.72)');
  spec.addColorStop(0.45, 'rgba(255,255,255,.16)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  (impacts || []).forEach(p => {
    ctx.beginPath();
    ctx.arc(cx + p.x * R, cy + p.y * R, Math.max(4, R * 0.032), 0, Math.PI * 2);
    ctx.fillStyle = '#f6f3ec';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(10,8,6,.85)';
    ctx.stroke();
  });
  ctx.restore();
}

function studioChromeText(ctx, text, x, y, size, accent) {
  ctx.save();
  ctx.font = '600 ' + size + 'px ' + studioNum;
  ctx.textAlign = 'left';
  const width = Math.ceil(ctx.measureText(text).width + size * 0.8);
  const height = Math.ceil(size * 1.45);
  const off = (typeof document !== 'undefined' && document.createElement) ? document.createElement('canvas') : null;
  if (!off) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.fillText(text, x, y);
    ctx.restore();
    return width;
  }
  off.width = Math.max(2, width);
  off.height = Math.max(2, height);
  const g = off.getContext('2d');
  g.font = ctx.font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const cx = off.width / 2, cy = off.height / 2 + size * 0.02;
  for (let i = 16; i >= 1; i--) {
    g.fillStyle = i > 9 ? '#05060a' : studioRgba(accent, 0.28);
    g.fillText(text, cx + i * 0.28, cy + i * 0.85);
  }
  const grad = g.createLinearGradient(0, cy - size * 0.55, off.width, cy + size * 0.45);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.16, accent);
  grad.addColorStop(0.38, '#b9fff6');
  grad.addColorStop(0.58, '#ffe7a0');
  grad.addColorStop(0.78, '#ff86d6');
  grad.addColorStop(1, accent);
  g.fillStyle = grad;
  g.fillText(text, cx, cy - size * 0.04);
  g.globalCompositeOperation = 'source-atop';
  const shine = g.createLinearGradient(0, 0, 0, off.height);
  shine.addColorStop(0, 'rgba(255,255,255,.78)');
  shine.addColorStop(0.46, 'rgba(255,255,255,0)');
  shine.addColorStop(1, 'rgba(0,0,0,.28)');
  g.fillStyle = shine;
  g.fillRect(0, 0, off.width, off.height);
  ctx.drawImage(off, x - off.width / 2, y - off.height / 2);
  ctx.restore();
  return width;
}

function studioCardSheen(ctx, w, h, tilt) {
  const ang = (((tilt && tilt.y) || 10) * Math.PI) / 180;
  ctx.save();
  studioRound(ctx, 0, 0, w, h, 72);
  ctx.clip();
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(w / 2 + ((tilt && tilt.y) || 0) * 8, h / 2);
  ctx.rotate(-0.45 + ang);
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.4, 'rgba(255,255,255,0)');
  g.addColorStop(0.48, 'rgba(255,255,255,.2)');
  g.addColorStop(0.52, 'rgba(190,255,255,.18)');
  g.addColorStop(0.58, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-w, -h, w * 2, h * 2);
  ctx.restore();
}

function studioPaintCard(ctx, w, h, layout) {
  const view = studioCardView(layout || Studio.card.layout);
  const theme = Studio.theme();
  const tilt = Studio.card.tilt || {x: 0, y: 0};
  const s = w / 1080;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, 1080, 1350);
  studioRound(ctx, 0, 0, 1080, 1350, 72);
  ctx.fillStyle = '#07080c';
  ctx.fill();
  ctx.save();
  studioRound(ctx, 0, 0, 1080, 1350, 72);
  ctx.clip();
  const wash = ctx.createRadialGradient(540, 520, 40, 540, 560, 780);
  wash.addColorStop(0, studioRgba(theme.acc, 0.22));
  wash.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.font = '600 22px ' + studioSans;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  studioTrack(ctx, view.brand, 78, 108, 7);
  ctx.fillStyle = '#f4f6fb';
  ctx.font = '600 28px ' + studioSans;
  studioTrack(ctx, view.kicker, 78, 156, 3);
  if (view.date) {
    ctx.fillStyle = 'rgba(244,246,251,.5)';
    ctx.font = '500 20px ' + studioSans;
    studioTrack(ctx, view.date, 78, 196, 2);
  }
  if (view.hero === 'number') {
    studioChromeText(ctx, view.title, 540, 640, view.title.length > 3 ? 250 : 320, theme.acc);
    ctx.strokeStyle = theme.acc;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(540 - 70, 860);
    ctx.lineTo(540 + 70, 860);
    ctx.stroke();
    let y = 940;
    ctx.textAlign = 'center';
    [view.line2, view.line3].filter(Boolean).forEach((line, i) => {
      ctx.fillStyle = i === 0 ? 'rgba(244,246,251,.82)' : 'rgba(244,246,251,.5)';
      ctx.font = (i === 0 ? '500 32px ' : '500 26px ') + studioSans;
      ctx.fillText(line, 540, y);
      y += 52;
    });
  } else {
    studioHoloTarget(ctx, 540, 590, 250, theme.acc, tilt, view.impacts);
    const size = view.title.length > 3 ? 132 : 168;
    studioChromeText(ctx, view.title, 540, 980, size, theme.acc);
    ctx.strokeStyle = theme.acc;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(540 - 64, 1062);
    ctx.lineTo(540 + 64, 1062);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(244,246,251,.84)';
    ctx.font = '500 30px ' + studioSans;
    if (view.line2) ctx.fillText(view.line2, 540, 1124);
    ctx.fillStyle = 'rgba(244,246,251,.5)';
    ctx.font = '500 26px ' + studioSans;
    if (view.line3) ctx.fillText(view.line3, 540, 1172);
  }
  ctx.restore();
  studioCardSheen(ctx, 1080, 1350, tilt);
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
