const test = require('node:test');
const assert = require('node:assert/strict');
const Trace = require('../../mobile/trace-geom.js');

test('yaw wrap stays on the short arc across ±180°', () => {
  assert.equal(Trace.yawDelta(179, -179), -2);
  assert.equal(Trace.yawDelta(-179, 179), 2);
  assert.equal(Trace.yawDelta(10, 10), 0);
  assert.equal(Trace.yawDelta(0, 180), -180);
  assert.equal(Trace.yawDelta(10, 370), 0);
  const anchor = Trace.circMean([179, -179]);
  assert.ok(Math.abs(Trace.yawDelta(anchor, 180)) < 1e-6, anchor);
  assert.ok(Math.abs(Trace.yawDelta(178, anchor)) < 3, Trace.yawDelta(178, anchor));
});

test('a rigid arm converts yaw and pitch into centimeters', () => {
  const k = Trace.cmPerDeg(0.65);
  assert.ok(Math.abs(k - 0.65 * Math.PI / 180 * 100) < 1e-9);
  assert.deepEqual(Trace.armCm(10, -4, 0.65), [10 * k, -4 * k]);
  assert.deepEqual(Trace.armCm(1, 0, 1), [Math.PI / 180 * 100, 0]);
  assert.equal(Trace.cmPerDeg(0), Trace.cmPerDeg(Trace.ARM_M));
});

test('trace preference defaults to degrees and keeps the arm length', () => {
  const mem = new Map();
  const storage = {getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v))};
  assert.deepEqual(Trace.prefs(storage), {trace: 'deg', armM: 0.65});
  assert.deepEqual(Trace.save(storage, {trace: 'cm', armM: '0,70'}), {trace: 'cm', armM: 0.7});
  assert.deepEqual(Trace.prefs(storage), {trace: 'cm', armM: 0.7});
  assert.equal(Trace.save(storage, {trace: 'raw', armM: 9}).armM, 1.2);
  assert.equal(Trace.save(storage, {trace: 'nope', armM: 'x'}).trace, 'raw');
  assert.equal(Trace.save(storage, {armM: ''}).armM, 1.2);
  assert.equal(mem.has('awSessions'), false);
});
