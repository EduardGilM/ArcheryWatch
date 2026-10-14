const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

function style() {
  const s = {};
  Object.defineProperty(s, 'cssText', {
    get: () => Object.keys(s).map(k => k + ':' + s[k]).join(';'),
    set: v => {
      Object.keys(s).forEach(k => delete s[k]);
      String(v).split(';').forEach(kv => { const i = kv.indexOf(':'); if (i > 0) s[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); });
    }
  });
  Object.defineProperty(s, 'setProperty', {value: (k, v) => { s[k] = v; }});
  return s;
}

class El {
  constructor() {
    this.children = []; this.attributes = {}; this.listeners = {}; this.style = style();
    this.dataset = new Proxy({}, {set: (o, k, v) => { o[k] = String(v); return true; }});
    this.className = ''; this.hidden = false; this.textContent = ''; this.value = ''; this.parentNode = null; this._html = '';
  }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  removeEventListener() {}
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(c => c !== this); this.parentNode = null; }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  closest() { return null; }
  get classList() {
    const el = this, list = () => el.className.split(/\s+/).filter(Boolean);
    return {
      contains: c => list().includes(c),
      add: c => { if (!list().includes(c)) el.className = list().concat(c).join(' '); },
      remove: c => { el.className = list().filter(x => x !== c).join(' '); },
      toggle: (c, on) => { const has = list().includes(c); if (on === undefined ? !has : on && !has) el.className = list().concat(c).join(' '); else if (has && !on) el.className = list().filter(x => x !== c).join(' '); }
    };
  }
  set innerHTML(html) {
    this._html = html;
    this.children = [];
    for (const m of String(html).matchAll(/<div class="([^"]*)" data-index="(\d+)" style="([^"]*)"/g)) {
      const c = new El();
      c.className = m[1]; c.dataset.index = m[2]; c.style.cssText = m[3];
      this.appendChild(c);
    }
  }
  get innerHTML() { return this._html; }
  getBoundingClientRect() { return {left: 0, top: 0, width: 1080, height: 1350}; }
  setPointerCapture() {}
  scrollIntoView() {}
  getContext() { return new Proxy({}, {get: () => () => ({addColorStop() {}})}); }
}

function studio() {
  const elements = new Map(), storage = new Map(), frames = [];
  const document = {
    getElementById: id => { if (!elements.has(id)) elements.set(id, new El()); return elements.get(id); },
    createElement: () => new El(), querySelectorAll: () => [], documentElement: new El(), body: new El(), head: new El()
  };
  const sandbox = {document, console, setTimeout: () => 0, clearTimeout() {}, addEventListener() {},
    requestAnimationFrame: f => { frames.push(f); return frames.length; }, cancelAnimationFrame() {},
    localStorage: {getItem: k => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k)}};
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox), run = src => vm.runInContext(src, ctx);
  run(fs.readFileSync(path.join(root, 'mobile/score.js'), 'utf8'));
  run(fs.readFileSync(path.join(root, 'mobile/goals.js'), 'utf8'));
  run(fs.readFileSync(path.join(root, 'mobile/studio.js'), 'utf8'));
  const flush = () => { while (frames.length) frames.shift()(); };
  return {run, layer: document.getElementById('widgetLayer'), flush};
}

const layoutOnly = `studioDrawShare = () => {
  const style = studioStyle();
  Studio.card.rects = Studio.cardRows(style, Studio.cardConfig(style)).rows.flatMap(r => r.items.map(it => ({index: it.index, x: it.x, y: it.y, w: it.w, h: it.h})));
  studioWidgetBoxes();
};`;

const box = el => {
  const n = k => parseFloat(el.style[k]);
  return {cx: (n('left') + n('width') / 2) * 10.8, cy: (n('top') + n('height') / 2) * 13.5};
};

test('a dragged widget follows the finger, reorders once and keeps its boxes', () => {
  const s = studio();
  s.run(layoutOnly);
  s.run(`Studio.card.finish = 'editorial';
    Studio.setCardConfig('editorial', {photo: 'none', widgets: [{id: 'streak', size: 'small'}, {id: 'score', size: 'small'}, {id: 'stats', size: 'wide'}, {id: 'precision', size: 'wide'}, {id: 'train', size: 'small', variant: 'week'}]});
    studioEditWidgets(true);
    studioDrawShare(false);`);
  const order = () => s.run(`Studio.cardConfig('editorial').widgets.map(w => w.id).join()`);
  const rect = i => s.run(`JSON.stringify(Studio.card.rects.find(r => r.index === ${i}))`);
  const send = (type, x, y, target) => { s.layer.listeners[type].forEach(fn => fn({type, clientX: x, clientY: y, pointerId: 1, target, preventDefault() {}})); s.flush(); };
  const boxes = [...s.layer.children];
  assert.equal(boxes.length, 5);
  const from = JSON.parse(rect(0)), to = JSON.parse(rect(3));
  const grabbed = boxes.find(b => b.dataset.index === '0');
  send('pointerdown', from.x + from.w / 2, from.y + from.h / 2, {closest: sel => sel === '.wBox' ? grabbed : null});
  const p = {x: to.x + to.w * 0.1, y: to.y + to.h * 0.1};
  const orders = new Set();
  for (let k = 0; k < 12; k++) {
    send('pointermove', p.x + (k % 2 ? 2 : -2), p.y + (k % 3 - 1) * 2);
    orders.add(order());
  }
  send('pointermove', p.x, p.y);
  assert.deepEqual([...orders], ['score,stats,precision,streak,train'], 'the widget bounced between positions');
  assert.ok(boxes.every(b => s.layer.children.includes(b)), 'the boxes were rebuilt during the drag');
  const dragged = s.layer.children.find(b => b.className.split(' ').includes('drag'));
  assert.ok(dragged, 'no box is marked as dragged');
  assert.ok(Math.abs(box(dragged).cx - p.x) < 1 && Math.abs(box(dragged).cy - p.y) < 1, 'the dragged box does not follow the finger');
  send('pointerup', p.x, p.y);
  const slot = JSON.parse(rect(3)), back = s.layer.children.find(b => b.dataset.index === '3');
  assert.ok(!back.className.split(' ').includes('drag'));
  assert.ok(Math.abs(box(back).cx - (slot.x + slot.w / 2)) < 1 && Math.abs(box(back).cy - (slot.y + slot.h / 2)) < 1, 'the dropped box is not in its slot');
});

test('tilting the card eases over frames and reuses the painted card', () => {
  const s = studio();
  s.run(`var paints = 0, overlays = [];
    studioCardView = () => ({});
    studioPaintGlass = () => { paints++; return (c, t) => overlays.push(t.x + ',' + t.y); };
    Studio.card.finish = 'glass';
    Studio.shareOpen = true;
    studioDrawShare(false);`);
  const tilt = () => s.run('Studio.card.tilt.x + "," + Studio.card.tilt.y');
  s.run('studioTilt(8, -10)');
  s.flush();
  assert.equal(s.run('paints'), 1, 'the whole card was painted again while tilting');
  assert.equal(tilt(), '8,-10');
  assert.ok(s.run('overlays.length') > 4, 'the tilt jumped instead of easing');
  assert.equal(s.run('overlays[overlays.length - 1]'), '8,-10', 'the shine does not follow the final tilt');
  s.run('studioTilt(0, 0)');
  s.flush();
  assert.equal(tilt(), '0,0');
  assert.equal(s.run('paints'), 1);
  s.run('studioTilt(5, 5)');
  s.flush();
  s.run('studioEditWidgets(true)');
  assert.equal(tilt(), '0,0', 'editing must start with a flat card');
});

test('the obsidian distribution shows counts without percentages', () => {
  const s = studio();
  for (const variant of ['bar', 'donut', 'columns', 'pie']) {
    const texts = JSON.parse(s.run(`(() => {
      const texts = [], store = {};
      const ctx = new Proxy(store, {
        get: (o, k) => k === 'fillText' ? t => texts.push(String(t)) : k === 'measureText' ? t => ({width: String(t).length * 12}) : k in o ? o[k] : () => ({addColorStop() {}}),
        set: (o, k, v) => { o[k] = v; return true; }
      });
      const S = studioTokens('obsidian', Studio.theme());
      const dist = [{v: 'X', n: 7}, {v: '10', n: 7}, {v: '9', n: 9}, {v: '8', n: 5}, {v: '≤7', n: 8}];
      studioWidgetPaint.dist(ctx, {x: 84, y: 700, w: 912, h: 180, size: 'wide', widget: {id: 'dist', variant: '${variant}'}}, {dist}, S);
      return JSON.stringify(texts);
    })()`));
    assert.ok(texts.includes('9'), variant + ' lost the counts');
    assert.deepEqual(texts.filter(t => t.includes('%')), [], variant + ' still shows percentages');
  }
});
