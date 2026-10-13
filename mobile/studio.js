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
  card: {layout: 'resumen', tone: 'dark', size: 'story', bg: null, crop: {x: 0.5, y: 0.38, z: 1}, tilt: {x: 0, y: 0}},
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
    {id: 'resumen', name: 'Resumen'},
    {id: 'diana', name: 'Diana'},
    {id: 'tandas', name: 'Tandas'}
  ],
  SIZES: {story: {w: 1080, h: 1920}, post: {w: 1080, h: 1350}},
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
      tagline: 'CADA FLECHA CUENTA',
      date: this.cardDate(when),
      title: session && session.tanda ? 'Tanda puntuable' : indoor ? 'Sesión Indoor' : ((session && session.mode) || 'Sesión'),
      subtitle: indoor ? '18 M · DIANA REDUCIDA' : (session && session.mode === 'Outdoor' ? 'AIRE LIBRE' : 'SESIÓN'),
      foot: indoor ? 'Indoor 18 m' : ((session && session.mode) || 'ArcheryWatch')
    };
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
  radar(shots) {
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
    const precision = precisionN ? scored.filter(s => s.result.value === 'X').length / precisionN * 100 : null;
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
  ['shareSizes', 'shareTones'].forEach(id => {
    const box = $(id);
    if (!box) return;
    box.onclick = e => {
      const b = e.target.closest('[data-size], [data-tone]');
      if (!b) return;
      if (b.dataset.size) Studio.card.size = b.dataset.size;
      if (b.dataset.tone) Studio.card.tone = b.dataset.tone;
      studioDrawShare();
      studioSyncShare();
    };
  });
  const cam = $('shareCam'), gal = $('shareGal');
  const camFile = $('shareCamFile'), galFile = $('shareGalFile');
  if (cam && camFile) cam.onclick = () => { camFile.value = ''; camFile.click(); };
  if (gal && galFile) gal.onclick = () => { galFile.value = ''; galFile.click(); };
  const loadPhoto = input => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type || file.type.indexOf('image/') !== 0) return;
    const img = new Image();
    img.onload = () => {
      Studio.card.bg = img;
      Studio.card.crop = {x: 0.5, y: 0.38, z: 1};
      const crop = $('shareCrop');
      if (crop) crop.hidden = false;
      studioPaintCrop();
      studioDrawShare();
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };
  if (camFile) camFile.onchange = () => loadPhoto(camFile);
  if (galFile) galFile.onchange = () => loadPhoto(galFile);
  const zoom = $('cropZoom');
  if (zoom) zoom.oninput = () => {
    Studio.card.crop.z = Number(zoom.value) || 1;
    studioPaintCrop();
    studioDrawShare();
  };
  const frame = $('cropFrame');
  if (frame) {
    let drag = null;
    frame.onpointerdown = e => {
      drag = {x: e.clientX, y: e.clientY, crop: {...Studio.card.crop}};
      frame.setPointerCapture?.(e.pointerId);
    };
    frame.onpointermove = e => {
      if (!drag || !Studio.card.bg) return;
      const rect = frame.getBoundingClientRect();
      const z = Studio.card.crop.z || 1;
      Studio.card.crop.x = Math.max(0, Math.min(1, drag.crop.x - (e.clientX - drag.x) / rect.width / z));
      Studio.card.crop.y = Math.max(0, Math.min(1, drag.crop.y - (e.clientY - drag.y) / rect.height / z));
      studioPaintCrop();
      studioDrawShare();
    };
    frame.onpointerup = () => { drag = null; };
  }
  const cropDone = $('cropDone');
  if (cropDone) cropDone.onclick = () => { const crop = $('shareCrop'); if (crop) crop.hidden = true; };
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
  const box = document.getElementById('shareLayouts');
  if (box) box.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('on', b.dataset.layout === Studio.card.layout));
  const sizes = document.getElementById('shareSizes');
  if (sizes) sizes.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('on', b.dataset.size === Studio.card.size));
  const tones = document.getElementById('shareTones');
  if (tones) tones.querySelectorAll('[data-tone]').forEach(b => b.classList.toggle('on', b.dataset.tone === Studio.card.tone));
  const stage = document.getElementById('holoStage');
  if (stage) stage.dataset.tone = Studio.card.tone;
}

function studioTilt(rx, ry) {
  Studio.card.tilt = {x: rx, y: ry};
  const tilt = document.getElementById('holoTilt');
  const sheen = document.getElementById('holoSheen');
  if (tilt) {
    tilt.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    tilt.style.boxShadow = (-ry * 1.4).toFixed(1) + 'px ' + (16 - rx).toFixed(1) + 'px 28px rgba(0,0,0,.38)';
  }
  if (sheen) sheen.style.backgroundPosition = (50 + ry * 2.4).toFixed(1) + '% ' + (50 - rx * 2.4).toFixed(1) + '%';
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
  const stats = Studio.radar(shots);
  const totals = stats.totals;
  const aims = shots.map(a => a.aim_score).filter(Number.isFinite);
  const aim = aims.length ? Math.round(aims.reduce((x, y) => x + y, 0) / aims.length) : null;
  const box = document.getElementById('profileNums');
  if (box) box.innerHTML =
    `<div><span class="lbl">Flechas</span><b class="num">${shots.length || '–'}</b></div>` +
    `<div><span class="lbl">Sesiones</span><b class="num">${sessions.length || '–'}</b></div>` +
    `<div><span class="lbl">Media</span><b class="num">${totals.avg == null ? '–' : esNum(totals.avg, 1)}</b></div>` +
    `<div><span class="lbl">X</span><b class="num">${totals.scored ? totals.x : '–'}</b></div>`;
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
  studioRadarDraw(radar.x, radar.w / 2, radar.h / 2 - 4, Math.min(radar.w, radar.h) * 0.32, Studio.radar(studioProgressShots()), Studio.theme(), true);
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

function studioCover(ctx, img, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function studioDrawCrop(ctx, img, dx, dy, dw, dh, crop) {
  const z = Math.max(1, (crop && crop.z) || 1);
  const cx = ((crop && crop.x) ?? 0.5) * img.width;
  const cy = ((crop && crop.y) ?? 0.38) * img.height;
  let vw = img.width / z;
  let vh = vw * (dh / dw);
  if (vh > img.height) { vh = img.height; vw = vh * (dw / dh); }
  const sx = Math.max(0, Math.min(img.width - vw, cx - vw / 2));
  const sy = Math.max(0, Math.min(img.height - vh, cy - vh / 2));
  ctx.drawImage(img, sx, sy, vw, vh, dx, dy, dw, dh);
}

function studioPaintCrop() {
  const canvas = document.getElementById('cropCanvas');
  const img = Studio.card.bg;
  if (!canvas || !img) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  studioDrawCrop(ctx, img, 0, 0, canvas.width, canvas.height, Studio.card.crop);
}

function studioInk(tone) {
  if (tone === 'light') {
    return {ink: '#17191e', muted: 'rgba(23,25,30,.62)', tile: 'rgba(255,255,255,.72)', glass: 'rgba(255,255,255,.9)', line: 'rgba(23,25,30,.1)'};
  }
  return {ink: '#f5f7fb', muted: 'rgba(245,247,251,.72)', tile: 'rgba(8,12,20,.55)', glass: 'rgba(12,16,28,.84)', line: 'rgba(255,255,255,.14)'};
}

function studioIcon(ctx, kind, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.lineCap = 'round';
  if (kind === 'score') {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'x') {
    ctx.font = '700 ' + Math.round(r * 1.15) + 'px ' + studioNum;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', x, y + 1);
  } else if (kind === 'heart') {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.32);
    ctx.bezierCurveTo(x - r * 0.7, y - r * 0.15, x - r * 0.2, y - r * 0.55, x, y - r * 0.05);
    ctx.bezierCurveTo(x + r * 0.2, y - r * 0.55, x + r * 0.7, y - r * 0.15, x, y + r * 0.32);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.08, y - r * 0.42);
    ctx.lineTo(x + r * 0.34, y + r * 0.05);
    ctx.lineTo(x + r * 0.02, y + r * 0.05);
    ctx.lineTo(x + r * 0.12, y + r * 0.42);
    ctx.lineTo(x - r * 0.34, y - r * 0.02);
    ctx.lineTo(x, y - r * 0.02);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function studioBackdrop(ctx, w, h, accent) {
  const img = Studio.card.bg;
  const tone = Studio.card.tone;
  if (img && img.width) {
    ctx.save();
    ctx.filter = 'blur(34px)';
    studioDrawCrop(ctx, img, -48, -48, w + 96, h + 96, Studio.card.crop);
    ctx.filter = 'none';
    ctx.fillStyle = tone === 'light' ? 'rgba(255,255,255,.28)' : 'rgba(8,10,16,.35)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, accent);
  g.addColorStop(0.42, tone === 'light' ? '#f3efe8' : '#24180f');
  g.addColorStop(1, tone === 'light' ? '#d5dee8' : '#10151f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function studioSheen(ctx, w, h, accent) {
  const tilt = Studio.card.tilt || {x: 0, y: -8};
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-18 + tilt.y) * Math.PI / 180);
  const grad = ctx.createLinearGradient(-w, 0, w, 0);
  [[0, 'rgba(123,43,255,0)'], [0.32, 'rgba(123,43,255,.20)'], [0.42, 'rgba(0,229,255,.28)'], [0.5, 'rgba(198,255,61,.16)'], [0.58, 'rgba(255,210,80,.22)'], [0.68, accent], [0.78, 'rgba(255,43,214,.22)'], [1, 'rgba(123,43,255,0)']].forEach(s => grad.addColorStop(s[0], s[1]));
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.28;
  ctx.fillRect(-w, -h, w * 2, h * 2);
  ctx.restore();
}

function studioMiniFace(ctx, x, y, R, impacts) {
  const disk = (r, color) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); };
  disk(R, '#3F5F78');
  disk(R * 0.8, '#8F4A4C');
  disk(R * 0.4, '#C2A36A');
  ctx.strokeStyle = 'rgba(0,0,0,.45)';
  ctx.lineWidth = 2;
  [1, 0.8, 0.6, 0.4, 0.2, 0.1].forEach(k => { ctx.beginPath(); ctx.arc(x, y, R * k, 0, Math.PI * 2); ctx.stroke(); });
  impacts.forEach(p => {
    ctx.beginPath();
    ctx.arc(x + p.x * R, y + p.y * R, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#f7f4ee';
    ctx.fill();
    ctx.strokeStyle = 'rgba(12,10,8,.8)';
    ctx.stroke();
  });
}

function studioSetChart(ctx, x, y, w, h, sets, ink, accent) {
  const rows = (sets || []).filter(s => s.sum != null);
  ctx.save();
  studioRound(ctx, x, y, w, h, 28);
  ctx.fillStyle = ink.tile;
  ctx.fill();
  if (rows.length < 2) {
    ctx.fillStyle = ink.muted;
    ctx.font = '500 28px ' + studioSans;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sin tandas suficientes', x + w / 2, y + h / 2);
    ctx.restore();
    return;
  }
  const max = Math.max(...rows.map(s => s.sum), 1);
  const pad = 36;
  ctx.beginPath();
  rows.forEach((s, i) => {
    const px = x + pad + (rows.length === 1 ? w / 2 : i * (w - pad * 2) / (rows.length - 1));
    const py = y + h - pad - (s.sum / max) * (h - pad * 2);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function studioDrawShare() {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = Studio.SIZES[Studio.card.size] || Studio.SIZES.story;
  const w = size.w, h = size.h;
  canvas.width = w;
  canvas.height = h;
  const theme = Studio.theme();
  const shots = studioShotSource();
  const stats = Studio.radar(shots);
  const profile = Studio.profile();
  const session = typeof displayedSession === 'function' ? displayedSession() : null;
  const when = session ? session.id : Date.now();
  const copy = Studio.cardCopy(session, when);
  const ink = studioInk(Studio.card.tone);
  const totals = stats.totals;
  const format = session && typeof Score !== 'undefined' && Score.formatOf ? Score.formatOf(session) : null;
  const maxPt = format === 'lancaster' ? 11 : 10;
  const arrows = totals.arrows || 0;
  const denom = arrows ? arrows * maxPt : 0;
  const scoreText = totals.score == null ? '–' : String(totals.score) + (denom ? '/' + denom : '');
  const peers = (typeof store !== 'undefined' && Studio.shareKind !== 'profile') ? store.list().filter(s => !session || s.id !== session.id) : [];
  const record = totals.score != null && peers.length ? Studio.isRecord(totals.score, peers) : false;
  const hrs = Studio.scorePool(shots).map(s => s.hr_bpm).filter(v => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  let med = null;
  if (hrs.length) {
    const mid = Math.floor(hrs.length / 2);
    med = hrs.length % 2 ? hrs[mid] : (hrs[mid - 1] + hrs[mid]) / 2;
  }
  const xCount = totals.x || 0;
  const precision = stats.axes.find(a => a.id === 'precision');
  studioBackdrop(ctx, w, h, theme.acc);
  const m = 48;
  studioRound(ctx, m, m, w - m * 2, h - m * 2, 48);
  ctx.fillStyle = ink.glass;
  ctx.fill();
  ctx.save();
  studioRound(ctx, m, m, w - m * 2, h - m * 2, 48);
  ctx.clip();
  const tall = h > 1600;
  const photoH = tall ? 480 : 260;
  const photoX = m + 22, photoY = m + 22, photoW = w - (m + 22) * 2;
  studioRound(ctx, photoX, photoY, photoW, photoH, 36);
  ctx.save();
  ctx.clip();
  if (Studio.card.bg && Studio.card.bg.width) studioDrawCrop(ctx, Studio.card.bg, photoX, photoY, photoW, photoH, Studio.card.crop);
  else {
    const pg = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH);
    pg.addColorStop(0, theme.acc);
    pg.addColorStop(1, Studio.card.tone === 'light' ? '#d7dee6' : '#1b2433');
    ctx.fillStyle = pg;
    ctx.fillRect(photoX, photoY, photoW, photoH);
    studioMiniFace(ctx, photoX + photoW * 0.72, photoY + photoH * 0.46, photoH * 0.28, []);
  }
  const veil = ctx.createLinearGradient(0, photoY + photoH * 0.35, 0, photoY + photoH);
  veil.addColorStop(0, 'rgba(0,0,0,0)');
  veil.addColorStop(1, Studio.card.tone === 'light' ? 'rgba(20,16,12,.55)' : 'rgba(6,8,14,.72)');
  ctx.fillStyle = veil;
  ctx.fillRect(photoX, photoY, photoW, photoH);
  ctx.fillStyle = '#fff';
  ctx.font = '600 22px ' + studioSans;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(copy.tagline, photoX + 28, photoY + photoH - 28);
  ctx.restore();
  let y = photoY + photoH + 36;
  ctx.fillStyle = ink.muted;
  ctx.font = '600 22px ' + studioSans;
  ctx.textAlign = 'left';
  ctx.fillText(copy.date, m + 40, y);
  y += 58;
  ctx.fillStyle = ink.ink;
  ctx.font = '700 64px ' + studioSans;
  ctx.fillText(copy.title, m + 40, y);
  y += 36;
  ctx.fillStyle = ink.muted;
  ctx.font = '600 22px ' + studioSans;
  ctx.fillText(copy.subtitle, m + 40, y);
  y += 28;
  const gap = 16;
  const gridX = m + 28, gridW = w - gridX - m - 28;
  const tileW = (gridW - gap) / 2, tileH = tall ? 150 : 112;
  const tiles = [
    {k: 'score', label: 'PUNTUACIÓN', value: scoreText, unit: '', color: theme.acc},
    {k: 'x', label: 'X', value: String(xCount), unit: '', color: '#FF8A1F'},
    {k: 'heart', label: 'PULSO MEDIO', value: med == null ? '–' : String(Math.round(med)), unit: med == null ? '' : 'lpm', color: '#FF4D5A'},
    {k: 'arrow', label: 'FLECHAS', value: String(arrows), unit: '', color: '#3DDC97'}
  ];
  tiles.forEach((tile, i) => {
    const tx = gridX + (i % 2) * (tileW + gap);
    const ty = y + Math.floor(i / 2) * (tileH + gap);
    studioRound(ctx, tx, ty, tileW, tileH, 28);
    ctx.fillStyle = ink.tile;
    ctx.fill();
    studioIcon(ctx, tile.k, tx + 36, ty + 40, 16, tile.color);
    ctx.fillStyle = ink.muted;
    ctx.font = '600 16px ' + studioSans;
    ctx.textAlign = 'left';
    ctx.fillText(tile.label, tx + 62, ty + 46);
    ctx.fillStyle = ink.ink;
    ctx.font = '600 ' + (tall ? 52 : 40) + 'px ' + studioNum;
    ctx.fillText(tile.value, tx + 24, ty + (tall ? 108 : 86));
    if (tile.unit) {
      const tw = ctx.measureText(tile.value).width;
      ctx.font = '500 20px ' + studioSans;
      ctx.fillStyle = ink.muted;
      ctx.fillText(tile.unit, tx + 32 + tw, ty + 108);
    }
  });
  y += tileH * 2 + gap + 16;
  const hiH = tall ? 160 : 112;
  studioRound(ctx, gridX, y, gridW, hiH, 28);
  ctx.fillStyle = ink.tile;
  ctx.fill();
  if (record) {
    studioIcon(ctx, 'score', gridX + 56, y + hiH / 2, 28, theme.acc);
    ctx.fillStyle = theme.acc;
    ctx.font = '700 22px ' + studioSans;
    ctx.fillText('NUEVO RÉCORD', gridX + 104, y + hiH / 2 - 16);
    ctx.fillStyle = ink.ink;
    ctx.font = '600 48px ' + studioNum;
    ctx.fillText(totals.score + ' PTS', gridX + 104, y + hiH / 2 + 36);
  } else {
    const pct = precision && precision.value != null ? precision.value : (totals.scored ? xCount / totals.scored * 100 : 0);
    const cx = gridX + 70, cy = y + hiH / 2, rad = 42;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.strokeStyle = ink.line;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = theme.acc;
    ctx.lineWidth = 8;
    ctx.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(100, pct)) / 100);
    ctx.stroke();
    ctx.fillStyle = ink.ink;
    ctx.font = '600 22px ' + studioNum;
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(pct) + '%', cx, cy + 8);
    ctx.textAlign = 'left';
    ctx.fillStyle = ink.muted;
    ctx.font = '600 16px ' + studioSans;
    ctx.fillText('PRECISIÓN', gridX + 132, y + hiH / 2 - 18);
    ctx.fillStyle = ink.ink;
    ctx.font = '600 42px ' + studioNum;
    ctx.fillText((precision && precision.text) || '–', gridX + 132, y + hiH / 2 + 28);
  }
  y += hiH + 16;
  const footTop = h - m - 64;
  const setCap = Studio.card.layout === 'diana' ? 0 : Math.min(stats.sets.length, tall ? 5 : 3);
  const setRoom = setCap * 36;
  const blockH = Math.max(140, Math.min(tall ? 280 : 180, footTop - y - setRoom - 12));
  const impacts = StudioScore.impacts(Studio.scorePool(shots));
  if (Studio.card.layout === 'tandas') studioSetChart(ctx, gridX, y, gridW, blockH, stats.sets, ink, theme.acc);
  else if (Studio.card.layout === 'diana' || impacts.length) {
    studioRound(ctx, gridX, y, gridW, blockH, 28);
    ctx.fillStyle = ink.tile;
    ctx.fill();
    studioMiniFace(ctx, gridX + gridW / 2, y + blockH / 2, Math.min(gridW, blockH) * 0.38, impacts);
  } else studioSetChart(ctx, gridX, y, gridW, blockH, stats.sets, ink, theme.acc);
  y += blockH + 18;
  if (Studio.card.layout !== 'diana' && stats.sets.length) {
    const best = Math.max(...stats.sets.map(s => s.sum == null ? -1 : s.sum));
    stats.sets.slice(0, setCap).forEach((set, i) => {
      if (y > footTop - 8) return;
      ctx.fillStyle = ink.muted;
      ctx.font = '500 22px ' + studioSans;
      ctx.textAlign = 'left';
      ctx.fillText('Tanda ' + (i + 1), gridX + 8, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = ink.ink;
      ctx.font = '600 28px ' + studioNum;
      const star = set.sum != null && set.sum === best ? ' ★' : '';
      ctx.fillText((set.sum == null ? '–' : String(set.sum)) + star, gridX + gridW - 8, y);
      y += 40;
    });
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = ink.muted;
  ctx.font = '600 18px ' + studioSans;
  const foot = copy.foot + (profile.name ? '  ·  ' + profile.name : '');
  ctx.fillText(foot, m + 40, h - m - 36);
  ctx.textAlign = 'right';
  ctx.fillText('ARCHERYWATCH', w - m - 40, h - m - 36);
  ctx.restore();
  ctx.save();
  studioRound(ctx, m, m, w - m * 2, h - m * 2, 48);
  ctx.strokeStyle = theme.acc;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  studioSheen(ctx, w, h, theme.acc);
}

async function studioExport() {
  const canvas = document.getElementById('shareCanvas');
  if (!canvas) return;
  studioDrawShare();
  const png = canvas.toDataURL('image/png');
  const jpeg = Studio.card.bg ? canvas.toDataURL('image/jpeg', 0.92) : png;
  const payload = jpeg.length > 900000 ? canvas.toDataURL('image/jpeg', 0.86) : jpeg;
  const raw = payload.split(',')[1] || '';
  if (window.Native && Native.sharePng) { Native.sharePng(raw); return; }
  try {
    const blob = await (await fetch(payload)).blob();
    const file = new File([blob], payload.startsWith('data:image/jpeg') ? 'archerywatch.jpg' : 'archerywatch.png', {type: blob.type});
    if (navigator.share && (!navigator.canShare || navigator.canShare({files: [file]}))) {
      await navigator.share({files: [file], title: 'ArcheryWatch'});
      return;
    }
  } catch (e) {}
  const a = document.createElement('a');
  a.href = payload;
  a.download = payload.startsWith('data:image/jpeg') ? 'archerywatch.jpg' : 'archerywatch.png';
  a.click();
}

studioMount();
