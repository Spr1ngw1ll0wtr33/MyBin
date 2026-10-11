/* MyBin – works out the next Wednesday bin collection.
 *
 * The collections follow a fixed 6-week loop:
 *   wheelie bins go Green → Black → Blue (every 3 weeks),
 *   the food caddy is collected every other week (every 2 weeks),
 *   and 3 and 2 only line up again after 6 weeks.
 * Week 0 of the loop is Wednesday 07/10/2026.
 */

// Month numbers in JavaScript start at 0, so 9 = October.
var ANCHOR = { y: 2026, m: 9, d: 7 };

var BINS = {
  green: {
    name: 'Green lidded bin',
    short: 'Green bin',
    colour: '#2f9e44',
    items: ['All paper', 'All cardboard']
  },
  black: {
    name: 'Black lidded bin',
    short: 'Black bin',
    colour: '#1f2023',
    items: ['General waste – anything that can’t go in the other bins or the caddy']
  },
  blue: {
    name: 'Blue lidded bin',
    short: 'Blue bin',
    colour: '#1c6fd6',
    items: [
      'Plastic bottles',
      'Plastic trays and film lids',
      'Cans',
      'Aluminium foil trays and sheet',
      'Glass jars and bottles'
    ]
  }
};

// caddy: 'collected' | 'stored' | 'transfer'
var CYCLE = [
  { bin: 'green', caddy: 'stored' },
  { bin: 'black', caddy: 'collected' },
  { bin: 'blue', caddy: 'stored' },
  { bin: 'green', caddy: 'collected' },
  { bin: 'black', caddy: 'transfer' },
  { bin: 'blue', caddy: 'collected' }
];

var DAY_MS = 24 * 60 * 60 * 1000;

// Whole days between two local calendar dates, ignoring clock changes.
function daysBetween(a, b) {
  var ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / DAY_MS);
}

function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

// The collection to show: today's if it is Wednesday before 12:00 pm,
// otherwise the coming Wednesday.
function nextCollectionDate(now) {
  var day = now.getDay(); // 0 Sunday … 3 Wednesday … 6 Saturday
  if (day === 3 && now.getHours() < 12) return addDays(now, 0);
  var ahead = (3 - day + 7) % 7;
  if (ahead === 0) ahead = 7;
  return addDays(now, ahead);
}

function collectionFor(wednesday) {
  var anchor = new Date(ANCHOR.y, ANCHOR.m, ANCHOR.d);
  var weeks = Math.round(daysBetween(anchor, wednesday) / 7);
  var pos = ((weeks % 6) + 6) % 6;
  var c = CYCLE[pos];
  return { date: wednesday, position: pos, bin: c.bin, caddy: c.caddy };
}

function upcoming(now, count) {
  var first = nextCollectionDate(now);
  var list = [];
  for (var i = 0; i < count; i++) list.push(collectionFor(addDays(first, i * 7)));
  return list;
}

/* ---------- Text helpers ---------- */

var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad(n) { return (n < 10 ? '0' : '') + n; }

function formatDate(d) {
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
}

function whenText(now, date) {
  var n = daysBetween(now, date);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return 'In ' + n + ' days';
}

function caddyHeadline(c) {
  if (c.caddy === 'collected') return 'Food caddy is collected too';
  if (c.caddy === 'transfer') return 'Caddy not collected – tip the food into the black bin';
  return 'Caddy not collected – keep the food in the caddy';
}

function caddyDetail(c) {
  if (c.caddy === 'collected') {
    return 'Put the food caddy out with the ' + BINS[c.bin].short.toLowerCase() + '.';
  }
  if (c.caddy === 'transfer') {
    return 'Before the black bin goes out, empty the food caddy into it. The caddy stays at home this week.';
  }
  return 'The caddy stays at home. It will be collected next week, on Wednesday ' +
    formatDate(addDays(c.date, 7)) + '.';
}

function caddyShort(c) {
  if (c.caddy === 'collected') return '+ food caddy';
  if (c.caddy === 'transfer') return '– tip the caddy into it';
  return '– caddy stays in';
}

function reminderTitle(c) {
  var t = 'Bins out tonight: ' + BINS[c.bin].short;
  if (c.caddy === 'collected') return t + ' + food caddy';
  if (c.caddy === 'transfer') return t + ' – tip the caddy into it';
  return t + ' (caddy stays in)';
}

/* ---------- Calendar file (.ics) ---------- */

function icsStamp(d) {
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
    pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}

function icsLocal(d, h, m) {
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(h) + pad(m) + '00';
}

function icsEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// One reminder at 1:00 pm on the Tuesday before each collection, for 52 weeks.
function buildICS(now) {
  var stamp = icsStamp(now);
  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MyBin//Bin reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MyBin reminders',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/London',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0000',
    'TZOFFSETTO:+0100',
    'TZNAME:BST',
    'DTSTART:19700329T010000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0000',
    'TZNAME:GMT',
    'DTSTART:19701025T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE'
  ];
  var list = upcoming(now, 52);
  for (var i = 0; i < list.length; i++) {
    var c = list[i];
    var tue = addDays(c.date, -1);
    // Skip a Tuesday 1:00 pm reminder that has already passed.
    if (new Date(tue.getFullYear(), tue.getMonth(), tue.getDate(), 13, 0) < now) continue;
    var title = reminderTitle(c);
    var desc = 'Collection on Wednesday ' + formatDate(c.date) + '. ' + caddyDetail(c);
    lines.push(
      'BEGIN:VEVENT',
      'UID:mybin-' + icsLocal(c.date, 0, 0).slice(0, 8) + '@spr1ngw1ll0wtr33.github.io',
      'DTSTAMP:' + stamp,
      'DTSTART;TZID=Europe/London:' + icsLocal(tue, 13, 0),
      'DTEND;TZID=Europe/London:' + icsLocal(tue, 13, 15),
      'SUMMARY:' + icsEscape(title),
      'DESCRIPTION:' + icsEscape(desc),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + icsEscape(title),
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/* ---------- Page ---------- */

// For testing only: ?date=2026-10-14T09:00 pretends it is that moment.
function currentTime() {
  var m = /[?&]date=([0-9T:\-]+)/.exec(location.search);
  if (m) {
    var p = m[1].split(/[-T:]/).map(Number);
    return new Date(p[0], p[1] - 1, p[2], p[3] || 0, p[4] || 0);
  }
  return new Date();
}

function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function playScene(c) {
  var scene = document.getElementById('scene');
  scene.setAttribute('class', 'scene bin-' + c.bin + ' caddy-' + c.caddy);
  // Force the browser to restart the animation.
  void scene.getBoundingClientRect();
  scene.classList.add('play');
}

function render() {
  var now = currentTime();
  var list = upcoming(now, 7);
  var c = list[0];
  var bin = BINS[c.bin];

  document.getElementById('when').textContent = whenText(now, c.date);
  document.getElementById('date').textContent = 'Wednesday ' + formatDate(c.date);

  var binCard = document.getElementById('bin-card');
  binCard.style.setProperty('--bin', bin.colour);
  document.getElementById('bin-name').textContent = bin.name;
  var items = document.getElementById('bin-items');
  items.innerHTML = '';
  bin.items.forEach(function (t) { items.appendChild(el('li', null, t)); });
  if (c.caddy === 'transfer') items.appendChild(el('li', 'extra', 'This week’s food waste from the caddy'));

  var caddyCard = document.getElementById('caddy-card');
  caddyCard.className = 'card caddy-card is-' + c.caddy;
  document.getElementById('caddy-head').textContent = caddyHeadline(c);
  document.getElementById('caddy-detail').textContent = caddyDetail(c);

  var ul = document.getElementById('upcoming');
  ul.innerHTML = '';
  list.slice(1).forEach(function (u) {
    var li = el('li', 'up up-' + u.caddy);
    var dot = el('span', 'dot');
    dot.style.background = BINS[u.bin].colour;
    li.appendChild(dot);
    li.appendChild(el('span', 'up-date', formatDate(u.date)));
    var txt = el('span', 'up-text');
    txt.appendChild(el('strong', null, BINS[u.bin].short));
    txt.appendChild(document.createTextNode(' ' + caddyShort(u)));
    li.appendChild(txt);
    ul.appendChild(li);
  });

  playScene(c);
  return c;
}

function downloadReminders() {
  var blob = new Blob([buildICS(currentTime())], { type: 'text/calendar' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mybin-reminders.ics';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

if (typeof document !== 'undefined') {
  var lastShown = null;
  document.addEventListener('DOMContentLoaded', function () {
    lastShown = render();
    document.getElementById('scene').addEventListener('click', function () { playScene(lastShown); });
    document.getElementById('replay').addEventListener('click', function () { playScene(lastShown); });
    document.getElementById('reminders').addEventListener('click', downloadReminders);
    // Refresh when the app is reopened, in case the day has moved on.
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) lastShown = render();
    });
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js'); });
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    nextCollectionDate: nextCollectionDate, collectionFor: collectionFor,
    upcoming: upcoming, buildICS: buildICS, formatDate: formatDate
  };
}
