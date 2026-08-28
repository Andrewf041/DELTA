/* I.V.I. Service Worker — Offline & Cache */

const CACHE_NAME = 'ivi-v3.0';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

/* Install — cache core assets */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

/* Activate — clean old caches */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

/* Fetch — cache-first for assets, network-first for API calls */
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    /* API calls — always go to network */
    if (url.hostname !== location.hostname) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response('{"error":"offline"}', {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    /* Static assets — cache first */
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
