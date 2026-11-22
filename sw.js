// Service worker mínimo: só existe para o navegador oferecer "Instalar app".
// Não guarda nada em cache, porque o app precisa do servidor online de qualquer jeito.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
