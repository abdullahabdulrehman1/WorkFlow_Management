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
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received', event);

  let notification = {};
  
  try {
    if (event.data) {
      console.log('[Service Worker] Push event data available');
      console.log('[Service Worker] Push data:', event.data.text());
      notification = event.data.json();
      console.log('[Service Worker] Parsed notification data:', notification);
    } else {
      console.log('[Service Worker] No data in push event');
    }
  } catch (e) {
    console.error('[Service Worker] Error parsing notification data:', e);
    notification = {
      title: 'Workflow Management',
      body: 'New notification',
      icon: '/icons/icon-192x192.png'
    };
  }

  const title = notification.title || 'Workflow Management';
  
  // Enhanced options for Windows notifications
  const options = {
    body: notification.body || 'You have a new notification',
    icon: notification.icon || '/logo.png', // Use logo.png for recognizable icon
    badge: '/icons/icon-72x72.png',
    data: {
      ...notification.data || {},
      url: notification.url || '/workflows',
      timestamp: notification.timestamp || Date.now()
    },
    // Windows notification settings
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
    requireInteraction: true, // Keep notification until user interacts with it
    tag: 'workflow-' + Date.now(), // Unique tag for each notification
    actions: [
      {
        action: 'view',
        title: 'View Workflow',
        icon: '/icons/icon-72x72.png'
      }
    ],
    // Windows 10/11 specific
    silent: false, // Play notification sound on Windows
    renotify: true // Always notify even if tag is already present
  };

  console.log('[Service Worker] Showing notification with title:', title);
  console.log('[Service Worker] and options:', options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[Service Worker] Notification shown successfully');
      })
      .catch(error => {
        console.error('[Service Worker] Error showing notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked', event);
  
  const clickedNotification = event.notification;
  clickedNotification.close();

  // Handle action buttons
  if (event.action === 'view') {
    console.log('[Service Worker] "View Workflow" action clicked');
  }

  // Get notification data
  const data = clickedNotification.data;
  const urlToOpen = data.url || '/workflows';

  // Focus on existing window or open a new one
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if there is already a window/tab open with the target URL
      for (let client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is already open, open a new one
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