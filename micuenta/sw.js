// Mi Cuenta Tulula · trabajador mínimo: guarda la pantalla para abrir rápido; los datos siempre van a la base.
const V = 'micuenta-20261128b';
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['./', './index.html', './manifest.json']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});

// 28-nov (Pablo) · PUSH_28NOV · aviso del pedido al celular y, al tocarlo, se abre la app en ese pedido
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'Tulula', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Tulula', { body: d.body || '', icon: 'https://tulula.com.pe/cdn/shop/files/Diseno_sin_titulo_20.png?width=192', badge: 'https://tulula.com.pe/cdn/shop/files/Diseno_sin_titulo_20.png?width=96', tag: d.tag || 'tulula', renotify: true, data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const u = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(L => { for (const c of L) if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) { c.navigate(u); return c.focus(); } return clients.openWindow(u); }));
});
