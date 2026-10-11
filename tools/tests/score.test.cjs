const test = require('node:test');
const assert = require('node:assert/strict');
const Score = require('../../mobile/score.js');
const Backup = require('../../mobile/backup.js');

const arrow = (value, extra = {}) => ({aim_score: 80, draw_ms: 3000, settle_ms: 200, hr_bpm: 90, result: value == null ? undefined : {value}, ...extra});

test('arrow values score X and 10 as ten points and can be cleared without the impact', () => {
  assert.equal(Score.points('X'), 10);
  assert.equal(Score.points('10'), 10);
  assert.equal(Score.points('M'), 0);
  assert.equal(Score.points('9'), 9);
  assert.equal(Score.points('0'), null);
  assert.equal(Score.points('Y'), null);
  const shot = {t_ms: 1, result: {value: '9', impact: {x: 0.2, y: -0.1}}};
  assert.equal(Score.set(shot, 'X'), true);
  assert.deepEqual(shot.result, {value: 'X', impact: {x: 0.2, y: -0.1}});
  assert.equal(Score.set(shot, null), true);
  assert.deepEqual(shot.result, {impact: {x: 0.2, y: -0.1}});
  assert.equal(Score.set({candidate: true}, '10'), false);
  assert.equal(Score.set(shot, 'Y'), false);
  assert.equal(shot.result.impact.x, 0.2);
});

test('totals count the set and the session without old shots or candidates', () => {
  const shots = [arrow('X'), arrow('10'), arrow('9'), arrow('M'), {aim_score: 50}, {candidate: true, result: {value: 'X'}}];
  const t = Score.totals(shots);
  assert.equal(t.arrows, 5);
  assert.equal(t.scored, 4);
  assert.equal(t.score, 29);
  assert.equal(t.x, 1);
  assert.equal(t.ten, 1);
  assert.equal(Score.totalsLine(t), '29 puntos · media 7,3 · 1 X · 1 diez');
  assert.equal(Score.totals([{aim_score: 80}]).scored, 0);
  assert.equal(Score.totalsLine(Score.totals([])), '');
});

test('value groups average execution and the sentence waits for four arrows', () => {
  const high = [0, 1, 2, 3].map(i => arrow(i < 3 ? 'X' : '10', {aim_score: 82 + i, draw_ms: 3000 + i * 100, settle_ms: 180, hr_bpm: 88}));
  const rest = [arrow('9', {aim_score: 70, draw_ms: 5000}), arrow('7', {aim_score: 60}), arrow('M', {aim_score: 40, hr_bpm: 110})];
  const groups = Score.groups([...high, ...rest]);
  const x10 = groups.find(g => g.id === 'x10');
  assert.equal(x10.n, 4);
  assert.equal(groups.find(g => g.id === '98').n, 1);
  assert.equal(groups.find(g => g.id === 'low').n, 1);
  assert.equal(groups.find(g => g.id === 'm').n, 1);
  assert.ok(x10.aim >= 80 && x10.aim_min >= 80);
  assert.ok(Math.abs(x10.shot_s - 4.35) < 0.05, x10.shot_s);
  assert.match(Score.groupLine(x10), /X-10 · 4 flechas · estabilidad 8\d · tiro 4,[34] s/);
  const said = Score.insight([...high, ...rest]);
  assert.equal(said.enough, true);
  assert.match(said.text, /Tus X-10 salen con 4-5 s de tiro y estabilidad ≥80/);
  assert.equal(Score.insight(high.slice(0, 3)).enough, false);
  assert.match(Score.insight(high.slice(0, 3)).text, /al menos 4/);
  const soft = Score.insight([0, 1, 2, 3].map(() => arrow('9', {aim_score: 70, draw_ms: 2800})));
  assert.match(soft.text, /Tus 9-8 salen con unos 4 s de tiro y estabilidad media 70/);
});

test('the backup carries the arrow value because it lives on the shot', () => {
  const mem = new Map();
  const storage = {
    getItem: k => mem.get(k) ?? null,
    setItem: (k, v) => mem.set(k, String(v)),
    key: i => [...mem.keys()][i] ?? null,
    get length() { return mem.size; }
  };
  storage.setItem('awSessions', JSON.stringify([{id: 1, shots: [{t_ms: 5, result: {value: 'X', impact: {x: 1, y: 2}}}]}]));
  const copy = Backup.build(storage, {exportedAt: '2026-10-11T08:00:00.000Z', app: '4.13'});
  assert.equal(copy.storage.awSessions[0].shots[0].result.value, 'X');
  assert.equal(copy.storage.awSessions[0].shots[0].result.impact.y, 2);
});
