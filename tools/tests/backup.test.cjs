const test = require('node:test');
const assert = require('node:assert/strict');
const Backup = require('../../mobile/backup.js');

function storage(entries) {
  const map = new Map(Object.entries(entries));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    key: index => [...map.keys()][index] ?? null,
    get length() { return map.size; }
  };
}

test('the backup keeps every aw* value and the export metadata', () => {
  const saved = storage({
    awSessions: JSON.stringify([{id: 1, shots: [{t_ms: 5, yaw_c: [179, -179]}]}]),
    awGear: JSON.stringify({bows: ['Recurvo'], arrows: []}),
    awCalibration: JSON.stringify({status: 'applied', profile: 'Recurvo'}),
    awPrefs: JSON.stringify({trace: 'deg', armM: 0.65}),
    awReceipt: '4',
    theme: 'dark',
    awBroken: '{no es json'
  });
  const copy = Backup.build(saved, {exportedAt: '2026-10-11T08:34:00.000Z', app: '4.13'});
  assert.equal(copy.format, 1);
  assert.equal(copy.exportedAt, '2026-10-11T08:34:00.000Z');
  assert.equal(copy.app, '4.13');
  assert.deepEqual(Object.keys(copy.storage), ['awBroken', 'awCalibration', 'awGear', 'awPrefs', 'awReceipt', 'awSessions']);
  assert.equal(copy.storage.awReceipt, '4');
  assert.equal(copy.storage.awBroken, '{no es json');
  assert.equal(copy.storage.awSessions[0].shots[0].yaw_c[1], -179);
  assert.equal(copy.storage.awGear.bows[0], 'Recurvo');
  assert.equal(copy.storage.awCalibration.status, 'applied');
  assert.equal(copy.storage.awPrefs.armM, 0.65);
  assert.equal(saved.getItem('theme'), 'dark');
  assert.equal(Backup.build(storage({}), {app: ''}).app, null);
});
