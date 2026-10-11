// MyBin offline support. Only ever touches caches whose names start "mybin-",
// because other apps on spr1ngw1ll0wtr33.github.io share the same cache storage.
var PREFIX = 'mybin-';
var CACHE = PREFIX + 'v1';
var FILES = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf(PREFIX) === 0 && k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Show the saved copy straight away, and fetch a fresh one in the background.
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (saved) {
        var fresh = fetch(req).then(function (res) {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function () { return saved; });
        return saved || fresh;
      });
    })
  );
});
