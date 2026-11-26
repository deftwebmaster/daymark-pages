// Increment CACHE_VERSION for each deployed change to an app shell file or the content.
const CACHE_VERSION = '1.4.1-2';
const scope = self.registration.scope;
const prefix = `daymark:${scope}:`;
const cacheName = prefix + CACHE_VERSION;
const shell = [
  '', 'offline.html', 'manifest.webmanifest', 'css/app.css',
  'assets/icons/newleaf-favicon-64.png', 'assets/icons/newleaf-192.png', 'assets/icons/newleaf-512.png',
  'assets/icons/newleaf-maskable-512.png', 'assets/icons/newleaf-apple-180.png', 'assets/images/daybreak.jpg',
  'assets/images/steponeart-logo.webp', 'assets/images/steponeart-artwork.webp',
  'js/theme.js', 'js/config.js', 'js/app.js', 'js/registry.js',
  'js/core/content.js', 'js/core/dates.js', 'js/core/storage.js', 'js/core/ui.js',
  'js/modules/today.js', 'js/modules/prayers.js', 'js/modules/recovery.js',
  'js/modules/toolkit.js', 'js/modules/settings.js', 'js/modules/meeting-spark.js',
  'js/modules/share-timer.js', 'content/library.json',
];
const assetURLs = new Set(shell.map(path => new URL(path, scope).href));
const indexPath = new URL('index.html', scope).pathname;
const entryPath = new URL(scope).pathname;
const offlineURL = new URL('offline.html', scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll([...assetURLs].map(url => new Request(url, { cache: 'reload' })));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(prefix) && name !== cacheName) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      const url = new URL(request.url);
      if (url.pathname === entryPath || url.pathname === indexPath) {
        const entry = await cache.match(scope);
        if (entry) return entry;
      }
      try { return await fetch(request); }
      catch {
        const offline = await cache.match(offlineURL);
        if (!offline) return Response.error();
        // Pages may redirect offline.html. Navigation requests cannot reuse a followed redirect.
        return offline.redirected ? new Response(offline.body, {
          status: offline.status, statusText: offline.statusText, headers: offline.headers,
        }) : offline;
      }
    })());
    return;
  }
  if (assetURLs.has(request.url)) {
    event.respondWith(caches.open(cacheName).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
