const CACHE = 'habitcore-v10';
const ASSETS = ['/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  // skipWaiting aquí garantiza que el nuevo SW activa de inmediato
  // y controllerchange dispara en el cliente → reload automático
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  // Tomar control de todas las páginas abiertas sin esperar reload
  self.clients.claim();
});

// Mensaje desde el cliente para forzar skipWaiting (botón "Actualizar")
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  // HTML siempre desde la red (nunca cacheado) para recibir updates
  if (e.request.destination === 'document') {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
