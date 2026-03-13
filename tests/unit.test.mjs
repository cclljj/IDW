import assert from 'node:assert/strict';
import { parseModeFromUrl } from '../js/core/query.js';
import { adaptDataset, buildDerivedCompareDataset } from '../js/data/adapter.js';

const defaultMode = parseModeFromUrl('');
assert.deepEqual(defaultMode, {
  notice: true,
  contour: false,
  humidity: false,
  www: false
});

const queryMode = parseModeFromUrl('?notice=no&contour=yes&humidity=yes&www=yes');
assert.deepEqual(queryMode, {
  notice: false,
  contour: true,
  humidity: true,
  www: true
});

const adapted = adaptDataset({
  points: [
    [25.04, 121.52, 16, 24, 70, 'AirBox', 'AB-1', 'Station 1', '/s/1'],
    [null, 121.0, 11]
  ]
}, 'AirBox');

assert.equal(adapted.points.length, 1);
assert.equal(adapted.skipped, 1);
assert.equal(adapted.points[0].sensorId, 'AB-1');

const compare = buildDerivedCompareDataset(
  [{ lat: 23.7, lng: 120.8, pm25: 12, sensorId: 'CAL-1' }],
  [{ lat: 23.71, lng: 120.81, pm25: 10, sensorId: 'EPA-1' }]
);

assert.equal(compare.length, 1);
assert(Math.abs(compare[0].ratio - 1.2) < 1e-9);

console.log('IDW unit smoke tests passed.');
