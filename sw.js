// Service worker: l'app resta apribile anche offline. Rete per prima, cache come riserva.
// Memorizza solo i file dell'app (stessa origine), mai le chiamate a Supabase.
const C = 'ptp-pages1';
const FILES = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('ptp-pages') && x !== C).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method === 'POST' && u.origin === location.origin && u.pathname.endsWith('/share-target')) {
    // contenuto condiviso da un'altra app (es. WhatsApp): lo teniamo da parte e apriamo l'app
    e.respondWith((async () => {
      try {
        const fd = await r.formData(), c = await caches.open('ptp-share');
        await c.put('meta', new Response(JSON.stringify({ title: fd.get('title') || '', text: fd.get('text') || '', url: fd.get('url') || '' })));
        const f = fd.get('media');
        if (f && f.size) await c.put('file', new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream', 'x-name': encodeURIComponent(f.name || 'vocale') } }));
      } catch (_) {}
      return Response.redirect(new URL('./?share=1', self.registration.scope).href, 303);
    })());
    return;
  }
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
      const v = l.filter(c => c.visibilityState === 'visible');
      if (v.length) { v.forEach(c => c.postMessage({ type: 'push', title: d.title, body: d.body })); return; } // app aperta: avviso dentro l'app
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
