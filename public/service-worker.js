/**
 * Unregistering service worker for tahins.me
 *
 * The previous Vue CLI 4 PWA plugin registered Workbox at exactly
 * /service-worker.js (see src/registerServiceWorker.js on master, and
 * the live file fetched from https://tahins.me/service-worker.js which
 * imported Workbox 4.3.1 and /precache-manifest.*.js with cache prefix
 * "tahins.me").
 *
 * This file is served at the same path so browsers update the existing
 * registration, then: skip waiting, delete every Cache Storage entry
 * (including tahins.me-precache-*), unregister itself, and reload
 * controlled clients so they are no longer served stale Vue shells.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(
        clients.map((client) => {
          if (client.navigate) {
            return client.navigate(client.url);
          }
          return Promise.resolve();
        }),
      );
    })(),
  );
});
