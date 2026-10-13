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

test('tagging can mark individual arrows or a whole session', () => {
  const session = {shots: [
    {set_id: 1, t_ms: 10, phase: 'warm'},
    {set_id: 1, t_ms: 20},
    {set_id: 2, t_ms: 30}
  ]};
  Studio.tag(session, 'score', {times: [20]});
  assert.equal(session.shots[0].phase, 'warm');
  assert.equal(session.shots[1].phase, 'score');
  assert.equal(session.shots[2].phase, undefined);
  Studio.tag(session, 'warm', {all: true});
  session.shots.forEach(s => assert.equal(s.phase, 'warm'));
  Studio.tag(session, '', {sets: [2]});
  assert.equal(session.shots[0].phase, 'warm');
  assert.equal(session.shots[2].phase, undefined);
});

test('dayKey uses the local calendar day', () => {
  const ms = Date.UTC(2026, 9, 13, 15, 0, 0);
  const d = new Date(ms);
  assert.equal(Studio.dayKey(ms), d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate());
  assert.equal(Studio.dayKey(NaN), '');
  assert.equal(Studio.dayKey('nope'), '');
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
  const libre = {phase: 'score', currentSet: 1, shots: [{set_id: 1, phase: 'score'}, {set_id: 2, phase: 'warm'}]};
  Studio.startRound(libre, '');
  assert.equal(libre.phase, undefined);
  assert.equal(libre.shots[0].phase, undefined);
  assert.equal(libre.shots[1].phase, 'warm');
});

test('radar scores only the six new axes and leaves a thin sample blank', () => {
  const shots = [];
  for (let i = 0; i < 8; i++) {
    shots.push({
      t_ms: i * 1000, set_id: Math.floor(i / 2) + 1, phase: 'score', aim_score: 80,
      draw_ms: 7000, hr_bpm: 68,
      result: {value: 'X', impact: {x: 0.01, y: 0.01}}
    });
  }
  shots.push({t_ms: 9000, set_id: 1, phase: 'warm', aim_score: 10, draw_ms: 1000, hr_bpm: 140, result: {value: 'M', impact: {x: 0.9, y: 0.9}}});
  const by = Object.fromEntries(Studio.radar(shots).axes.map(a => [a.id, a]));
  assert.deepEqual(Object.keys(by), ['precision', 'group', 'vertical', 'window', 'pulse', 'endure']);
  assert.equal(by.precision.value, 100);
  assert.equal(by.group.value, 100);
  assert.equal(by.vertical.value, 100);
  assert.equal(by.window.value, 100);
  assert.equal(by.pulse.value, 100);
  assert.equal(by.pulse.text, '68 lpm');
  assert.equal(by.endure.value, 100);
  const thin = Studio.radar([{aim_score: 90, draw_ms: 7000, hr_bpm: 80, result: {value: 'X', impact: {x: 0.1, y: 0.4}}}]);
  thin.axes.forEach(ax => { assert.equal(ax.value, null); assert.equal(ax.thin, true); assert.equal(ax.text, '–'); });
  const wide = Array.from({length: 8}, (_, i) => ({
    set_id: 1, phase: 'score', result: {value: '10', impact: {x: 0, y: (i - 3.5) * 0.2}}
  }));
  assert.equal(Studio.radar(wide).axes.find(a => a.id === 'vertical').value, 0);
  const drop = [];
  for (let s = 1; s <= 4; s++) {
    for (let n = 0; n < 3; n++) drop.push({set_id: s, phase: 'score', aim_score: 80, result: {value: s < 3 ? '10' : '9'}});
  }
  assert.equal(Studio.radar(drop).axes.find(a => a.id === 'endure').value, 0);
  const vegas = Array.from({length: 8}, () => ({phase: 'score', result: {value: 'X', impact: {x: 0.05, y: 0.05}}}));
  assert.equal(Studio.radar(vegas, 'vegas').axes.find(a => a.id === 'precision').value, 100);
  assert.equal(Studio.radar(vegas, 'wa').axes.find(a => a.id === 'precision').value, 0);
  const wa = Array.from({length: 8}, () => ({phase: 'score', result: {value: '10', impact: {x: 0.12, y: 0.05}}}));
  assert.equal(Studio.radar(wa, 'wa').axes.find(a => a.id === 'precision').value, 100);
  const lancaster = Array.from({length: 8}, () => ({phase: 'score', result: {value: '11', impact: {x: 0.02, y: 0.02}}}));
  assert.equal(Studio.radar(lancaster, 'lancaster').axes.find(a => a.id === 'precision').value, 100);
  assert.equal(Studio.sharedFormat([{mode: 'Indoor', shots: [{result: {value: 'X'}}]}]), 'vegas');
  assert.equal(Studio.sharedFormat([{mode: 'Indoor', scoreFormat: 'wa', shots: [{result: {value: '10'}}]}]), 'wa');
  assert.equal(Studio.sharedFormat([
    {mode: 'Indoor', scoreFormat: 'wa', shots: [{result: {value: 'X'}}]},
    {mode: 'Indoor', scoreFormat: 'lancaster', shots: [{result: {value: '11'}}]}
  ]), null);
});

test('the share card is a portrait holographic collectible with a short score line', () => {
  assert.equal(Studio.cardDate(new Date(2026, 9, 13, 12).getTime()), 'MAR 13 OCT 2026');
  const copy = Studio.cardCopy({mode: 'Indoor'}, new Date(2026, 9, 13, 12).getTime());
  assert.equal(copy.brand, 'ARCHERY WATCH');
  assert.equal(copy.kicker, 'SESIÓN INDOOR');
  assert.equal(copy.date, 'MAR 13 OCT 2026');
  const shots = [
    ...Array.from({length: 16}, () => ({result: {value: 'X'}})),
    ...Array.from({length: 11}, () => ({result: {value: '10'}})),
    ...Array.from({length: 3}, () => ({result: {value: '9'}}))
  ];
  assert.equal(Studio.breakdown(shots), '16 X · 11×10 · 3×9');
  const best = Studio.bestSet([
    {set_id: 1, result: {value: '9'}},
    {set_id: 2, result: {value: 'X'}},
    {set_id: 2, result: {value: '10'}}
  ]);
  assert.equal(best.index, 2);
  assert.equal(best.sum, 20);
  assert.deepEqual(Studio.LAYOUTS.map(t => t.id), ['session', 'profile', 'best']);
  assert.deepEqual(Studio.FINISHES.map(t => t.id), ['glass', 'editorial', 'obsidian']);
  assert.deepEqual(Studio.PRESETS.map(t => t.id), ['campo', 'diana', 'visor']);
  assert.equal(Studio.card.finish, 'glass');
  assert.equal(Studio.SIZES.card.w / Studio.SIZES.card.h, 1080 / 1350);
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
  assert.ok(Studio.THEMES.length >= 10);
  assert.ok(Studio.THEMES.some(t => t.acc.toLowerCase() === '#2f6bff'));
});
