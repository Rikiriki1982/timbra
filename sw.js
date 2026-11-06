// Service worker: l'app resta apribile anche offline. Rete per prima, cache come riserva.
// Memorizza solo i file dell'app (stessa origine), mai le chiamate a Supabase.
const C = 'ptp-pages1';
const FILES = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-cache' })
      .then(res => { const copy = res.clone(); caches.open(C).then(c => c.put(r, copy)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match('./index.html')))
  );
});

// Notifiche push (arrivano anche ad app chiusa)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
      if (l.some(c => c.visibilityState === 'visible')) return; // app aperta: ci pensa già lei
      return self.registration.showNotification(d.title || 'Presenze & Ticket Pro', {
        body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png',
        tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || './' }
      });
    })
  );
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const u = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    for (const c of l) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
    return self.clients.openWindow(u);
  }));
});
