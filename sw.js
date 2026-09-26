const CACHE = 'habitcore-v14';
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

// Si la red tarda más que esto, se muestra la última versión guardada
// (la app abre rápido igual; la versión nueva queda lista para la próxima).
const NETWORK_TIMEOUT_MS = 2500;

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // HTML: red primero (para recibir updates) con timeout y copia en caché
  if (req.destination === 'document') {
    const network = fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    });
    e.waitUntil(network.catch(() => {}));
    e.respondWith(new Promise(resolve => {
      let settled = false;
      const fallback = () => caches.match(req).then(cached => {
        if (cached && !settled) { settled = true; resolve(cached); }
        return cached;
      });
      const timer = setTimeout(fallback, NETWORK_TIMEOUT_MS);
      network.then(res => {
        clearTimeout(timer);
        if (!settled) { settled = true; resolve(res); }
      }).catch(() => {
        clearTimeout(timer);
        fallback().then(cached => { if (!cached && !settled) { settled = true; resolve(Response.error()); } });
      });
    }));
    return;
  }

  // Librería de Supabase (CDN): caché primero, así no se descarga en cada apertura
  if (req.url.startsWith('https://cdn.jsdelivr.net/npm/@supabase/')) {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
