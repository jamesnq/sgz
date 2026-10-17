self.addEventListener('push', function (event) {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch (e) {
    data = {
      title: 'Thông báo từ Sub Game Zone',
      body: event.data.text(),
    }
  }

  const title = data.title || 'Sub Game Zone'
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon-96x96.png',
    badge: data.badge || '/favicon-32x32.png',
    image: data.image || undefined,
    data: {
      url: data.url || '/',
      ...(data.data || {}),
    },
    tag: data.tag || undefined,
    renotify: !!data.tag,
    vibrate: [100, 50, 100],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then(function (c) {
              return c ? c.focus() : client.focus()
            })
          }
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    }),
  )
})
