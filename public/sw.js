// Service Worker para suporte a PWA e instalação no Android Chrome
const CACHE_NAME = 'extintores-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler para satisfazer os critérios de instalação PWA do Chrome
  if (event.request.method === 'GET') {
    try {
      const url = new URL(event.request.url);
      // Não intercepta rotas de API nem esquemas externos
      if (url.pathname.startsWith('/api/') || !url.protocol.startsWith('http')) {
        return;
      }

      event.respondWith(
        fetch(event.request).catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        })
      );
    } catch {
      // Deixa o browser tratar normalmente
    }
  }
});
