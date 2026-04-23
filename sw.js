const CACHE_NAME = 'ecoco-v1';

// Archivos que se guardan para funcionar sin internet
const ASSETS = [
  '/',
  '/index.html',
  '/ecoco-app.html',
  '/kiosko.html',
  '/fwplain.svg',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap'
];

// Instalación: guarda los archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Carga los archivos locales primero, las fuentes de Google aparte
      return cache.addAll(ASSETS.filter(url => !url.startsWith('http')))
        .then(() => {
          return cache.addAll(ASSETS.filter(url => url.startsWith('http')))
            .catch(() => {}); // Si las fuentes fallan (sin internet), no bloquear
        });
    })
  );
  self.skipWaiting();
});

// Activación: limpia cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: sirve desde caché, si no hay va a la red
self.addEventListener('fetch', event => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Guarda en caché respuestas válidas
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Si es una navegación y no hay red, muestra el index
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
