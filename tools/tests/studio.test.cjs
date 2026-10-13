const test = require('node:test');
const assert = require('node:assert/strict');
const Studio = require('../../mobile/studio.js');
const Goals = require('../../mobile/goals.js');

test('uncategorized arrows stay out of the scoring and warm-up lenses', () => {
  const shots = [{phase: 'score', id: 1}, {phase: 'warm', id: 2}, {id: 3}];
  assert.deepEqual(Studio.pool(shots, 'score').map(s => s.id), [1]);
  assert.deepEqual(Studio.pool(shots, 'warm').map(s => s.id), [2]);
  assert.equal(Studio.pool(shots, 'all').length, 3);
  assert.equal(Studio.pool(shots).length, 3);
});

test('assigning a phase does not touch the other sets', () => {
  const session = {shots: [{set_id: 1, phase: 'warm'}, {set_id: 2, result: {value: 'X'}}, {set_id: 1}]};
  Studio.applyPhase(session, 'score', [1]);
  assert.equal(session.shots[0].phase, 'score');
  assert.equal(session.shots[2].phase, 'score');
  assert.equal(session.shots[1].phase, undefined);
  assert.equal(session.shots[1].result.value, 'X');
  Studio.applyPhase(session, '', [1]);
  assert.equal(session.shots[0].phase, undefined);
  assert.equal(session.shots[1].phase, undefined);
});

test('starting a round tags the current set and the next arrows', () => {
  const session = {currentSet: 2, shots: [{set_id: 1}, {set_id: 2}, {set_id: 2, candidate: true}]};
  Studio.startRound(session, 'score');
  assert.equal(session.phase, 'score');
  assert.equal(session.shots[0].phase, undefined);
  assert.equal(session.shots[1].phase, 'score');
  assert.equal(session.shots[2].phase, 'score');
  const fresh = {currentSet: 9, shots: [{set_id: 1}, {set_id: 4}]};
  Studio.startRound(fresh, 'warm');
  assert.equal(fresh.phase, 'warm');
  assert.equal(fresh.shots[0].phase, undefined);
  assert.equal(fresh.shots[1].phase, 'warm');
});

test('radar turns points, grouping and rhythm into a 0-100 shape', () => {
  const shots = [
    {t_ms: 0, set_id: 1, aim_score: 80, result: {value: 'X', impact: {x: 0, y: 0}}},
    {t_ms: 10000, set_id: 1, aim_score: 80, result: {value: '10', impact: {x: 0.2, y: 0}}},
    {t_ms: 20000, set_id: 1, aim_score: 80, result: {value: '9', impact: {x: 0, y: 0.2}}}
  ];
  const stats = Studio.radar(shots);
  const by = Object.fromEntries(stats.axes.map(a => [a.id, a]));
  assert.ok(Math.abs(by.media.value - (stats.totals.avg / 10 * 100)) < 0.01);
  assert.ok(Math.abs(by.x.value - (100 / 3)) < 0.01);
  assert.equal(Math.round(by.stab.value), 80);
  assert.equal(Math.round(by.const.value), 100);
  assert.equal(Math.round(by.ritmo.value), 100);
  assert.equal(by.ritmo.text, '10,0 s');
  assert.ok(by.group.value > 70 && by.group.value < 85);
  const one = Studio.radar([{aim_score: 90, result: {value: 'X', impact: {x: 0.1, y: 0.1}}}]);
  assert.equal(one.axes.find(a => a.id === 'group').value, 100);
});

test('the training calendar counts a day and skips the future', () => {
  const now = new Date(2026, 9, 13, 15);
  const tomorrow = new Date(2026, 9, 14, 15);
  const sessions = [
    {id: now.getTime(), shots: [{}, {candidate: true}, {}]},
    {id: tomorrow.getTime(), shots: [{}, {}]}
  ];
  const heat = Studio.heatmap(sessions, now, 18);
  const today = heat.cells.find(c => c.day === Goals.daySerial(now));
  const ahead = heat.cells.find(c => c.day === Goals.daySerial(tomorrow));
  assert.equal(today.n, 2);
  assert.equal(today.level, 1);
  assert.equal(today.future, false);
  assert.equal(ahead.future, true);
  assert.equal(ahead.n, 0);
  assert.equal(ahead.level, 0);
  assert.ok(heat.cells.filter(c => c.future).every(c => c.n === 0));
});

test('amber stays the default accent', () => {
  assert.equal(Studio.THEMES[0].id, 'amber');
  assert.equal(Studio.theme().id, 'amber');
  assert.equal(Studio.theme().acc, '#FF8A1F');
  assert.ok(Studio.THEMES.length >= 6);
});
