// Service Worker for Push Notifications

// Cache name for the application
const CACHE_NAME = 'workflow-management-v1';

// Installation event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
  console.log('[Service Worker] Installed and activated via skipWaiting');
});

// Activation event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  const activationComplete = self.clients.claim();
  console.log('[Service Worker] Activated and claimed clients');
  return activationComplete;
});

// Push event - handle incoming push notifications
self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Notification';
    const options = {
        body: data.body || 'You have a new notification.',
        icon: data.icon || '/logo.png',
        badge: data.badge || '/logo.png',
        data: {
            url: data.url || '/',
        },
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            const urlToOpen = event.notification.data.url;
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle notification close event (for analytics or cleanup)
self.addEventListener('notificationclose', event => {
  console.log('[Service Worker] Notification was closed', event);
});

// Optional: Listen for subscription changes if you need to update the server
self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
    .then(subscription => {
      // TODO: Send the new subscription to your server
      console.log('Push subscription changed: ', subscription);
      // Example: fetch('/push-subscriptions', { method: 'POST', ... body: subscription ... });
    })
  );
});