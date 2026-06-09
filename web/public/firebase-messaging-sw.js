/* Firebase Cloud Messaging background handler (#57).
 *
 * The Firebase web config is injected at registration time via the ?fcfg=
 * query param (see src/lib/push.ts), so this committed file holds no project
 * keys. Runs in its own scope so it doesn't clash with the PWA's sw.js. */
/* global importScripts, firebase, self */
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js')

try {
  const cfg = JSON.parse(new URL(self.location).searchParams.get('fcfg') || '{}')
  if (cfg.apiKey) {
    firebase.initializeApp(cfg)
    const messaging = firebase.messaging()
    messaging.onBackgroundMessage((payload) => {
      const n = (payload && payload.notification) || {}
      self.registration.showNotification(n.title || 'Near 💗', {
        body: n.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: (payload && payload.data && payload.data.tag) || 'near-message',
        data: (payload && payload.data) || {},
      })
    })
  }
} catch (e) {
  /* best-effort: if config is missing the worker simply does nothing */
}

// Focus or open the app when a notification is tapped.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    }),
  )
})
