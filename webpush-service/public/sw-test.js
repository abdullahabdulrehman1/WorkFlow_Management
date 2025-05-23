// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }
  
  const title = notificationData.title || 'Push Notification';
  const options = {
    body: notificationData.body || 'Something has happened!',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge.png',
    data: notificationData.data || { url: '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      if (clients.openWindow) {
        const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
        return clients.openWindow(url);
      }
    })
  );
});