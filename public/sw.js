/* BazaarX service worker — offline shell + runtime caching. */
const VERSION = 'bazaarx-v1';
const APP_SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const PRECACHE = ['/', '/offline', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL)
      // Individual failures must not abort the whole install.
      .then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache the API — prices, stock and orders must always be fresh.
  if (url.pathname.startsWith('/api') || url.port === '8000') return;

  // Navigations: network first, fall back to cache, then the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then(hit => hit || caches.match('/offline')))
    );
    return;
  }

  // Static assets and images: cache first.
  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(res => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(request, copy));
        }
        return res;
      }).catch(() => hit))
    );
  }
});
