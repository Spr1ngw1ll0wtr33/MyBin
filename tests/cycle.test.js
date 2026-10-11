// Run with:  node tests/cycle.test.js
var assert = require('assert');
var app = require('../app.js');

function at(y, m, d, h, min) { return new Date(y, m - 1, d, h || 0, min || 0); }
function show(now) {
  var c = app.collectionFor(app.nextCollectionDate(now));
  return app.formatDate(c.date) + ' ' + c.bin + ' ' + c.caddy;
}

// The eight dates Kathryn supplied, checked on the morning of each.
var given = [
  [at(2026, 10, 7, 8), '07/10/2026 green stored'],
  [at(2026, 10, 14, 8), '14/10/2026 black collected'],
  [at(2026, 10, 21, 8), '21/10/2026 blue stored'],
  [at(2026, 10, 28, 8), '28/10/2026 green collected'],
  [at(2026, 11, 4, 8), '04/11/2026 black transfer'],
  [at(2026, 11, 11, 8), '11/11/2026 blue collected'],
  [at(2026, 11, 18, 8), '18/11/2026 green stored'],
  [at(2026, 11, 25, 8), '25/11/2026 black collected']
];
// Edge cases.
var edges = [
  [at(2026, 10, 11, 18), '14/10/2026 black collected'],   // Sunday (today)
  [at(2026, 10, 13, 23, 59), '14/10/2026 black collected'],// Tuesday night
  [at(2026, 10, 14, 11, 59), '14/10/2026 black collected'],// Wednesday 11:59 am
  [at(2026, 10, 14, 12, 0), '21/10/2026 blue stored'],     // Wednesday 12:00 pm
  [at(2026, 10, 25, 3), '28/10/2026 green collected'],     // clocks go back
  [at(2026, 12, 30, 14), '06/01/2027 black collected'],    // year boundary (91 days = 13 weeks)
  [at(2026, 12, 16, 8), '16/12/2026 black transfer'],      // next transfer week
  [at(2026, 9, 30, 8), '30/09/2026 blue collected'],       // before the start date
  [at(2027, 3, 28, 12), '31/03/2027 black collected']      // clocks go forward
];

given.concat(edges).forEach(function (t) {
  assert.strictEqual(show(t[0]), t[1], t[0].toString());
});
console.log('All ' + (given.length + edges.length) + ' date checks passed.');

// Calendar file: Tuesdays at 1:00 pm, titles match the cycle.
var ics = app.buildICS(at(2026, 10, 11, 18));
var starts = ics.match(/DTSTART;TZID=Europe\/London:\d{8}T\d{6}/g);
assert.strictEqual(starts.length, 52);
starts.forEach(function (s) {
  var v = s.split(':')[1];
  var d = new Date(+v.slice(0, 4), +v.slice(4, 6) - 1, +v.slice(6, 8));
  assert.strictEqual(d.getDay(), 2, 'not a Tuesday: ' + v);
  assert.strictEqual(v.slice(9), '130000');
});
assert.ok(starts[0].endsWith('20261013T130000'));
assert.ok(/SUMMARY:Bins out tonight: Black bin – tip the caddy into it\r\n[^]*?/.test(ics));
assert.ok(ics.indexOf('20261103T130000') > 0);
// Opening on a Tuesday afternoon skips that day's already-passed reminder.
assert.ok(app.buildICS(at(2026, 10, 13, 14)).indexOf('London:20261013T130000') < 0);
console.log('Calendar file checks passed (' + starts.length + ' reminders).');
