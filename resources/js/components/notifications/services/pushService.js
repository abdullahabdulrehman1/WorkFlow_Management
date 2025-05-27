import axios from 'axios';
import { urlBase64ToUint8Array, showFallbackNotification, isLocalhost, isMobileDevice } from '../utils/notificationUtils';

// Function to subscribe to push notifications
export async function subscribeToPush() {
    try {
        // First, check if push is supported
        if (!('serviceWorker' in navigator && 'PushManager' in window)) {
            console.log('Push notifications not supported');
            return { success: false, reason: 'unsupported' };
        }

        // Register service worker for all environments
        let swRegistration;
        try {
            swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;
        } catch (error) {
            console.error('Error registering service worker:', error);
            return { success: false, reason: 'sw-registration-failed', error };
        }
        
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return { success: false, reason: 'permission-denied' };
        }
        
        // Get VAPID public key
        const vapidPublicKey = document.querySelector('meta[name="vapid-public-key"]')?.content;
        if (!vapidPublicKey) {
            console.error('VAPID public key not found');
            return { success: false, reason: 'missing-key' };
        }
        
        // Unsubscribe from existing subscriptions first
        const existingSub = await swRegistration.pushManager.getSubscription();
        if (existingSub) {
            await existingSub.unsubscribe();
            console.log('Unsubscribed from previous push subscription');
        }
        
        let subscription;
        let subscriptionJson;
        
        try {
            // Subscribe with real push service
            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
            subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            
            // Get subscription as JSON
            subscriptionJson = subscription.toJSON();
            
            console.log('Created real push subscription:', subscriptionJson);
        } catch (error) {
            console.error('Error during subscription process:', error);
            return { success: false, reason: 'subscription-error', error };
        }
        
        // Send the subscription to the server
        try {
            console.log('Sending subscription to server:', subscription.endpoint);
            
            const response = await axios.post('/api/subscribe', {
                endpoint: subscription.endpoint,
                public_key: subscriptionJson.keys.p256dh,
                auth_token: subscriptionJson.keys.auth,
                content_encoding: 'aesgcm', // Use aesgcm for better compatibility
                platform: navigator.userAgent,
                device_id: navigator.userAgent.replace(/\D+/g, '').substring(0, 6) + Date.now().toString().substring(9, 13),
                user_id: 1  // Add user_id if your schema requires it
            });
            
            if (response.data.success) {
                console.log('Push subscription registered successfully');
                return { success: true };
            } else {
                console.error('Server rejected subscription:', response.data);
                return { success: false, reason: 'server-rejected', response: response.data };
            }
        } catch (error) {
            console.error('Error saving subscription to server:', error);
            return { success: false, reason: 'server-error', error };
        }
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return { success: false, reason: 'general-error', error };
    }
}

// Function to send push notification
export async function sendNotification(title, body, url = null) {
    try {
        // If running on localhost, use local notification instead
        if (isLocalhost()) {
            console.log('Running on localhost - using local notification');
            showFallbackNotification(title, body);
            
            // If on mobile in development, use a different notification approach
            if (isMobileDevice()) {
                console.log('Mobile device detected in local environment');
                // Just use the browser notification for now
            }
            
            return { sent: true, isLocalDevelopment: true };
        }
        
        const response = await axios.post('/api/push-notify', {
            title,
            body,
            url
        });
        
        console.log('Push notification response:', response.data);
        
        // If server indicates we should use fallback notifications
        if (!response.data.sent && response.data.fallbackEnabled) {
            console.log('Using fallback notification mechanism');
            showFallbackNotification(title, body);
        }
        
        return response.data;
    } catch (error) {
        console.error('Error sending push notification:', error);
        
        // Show fallback notification if server request fails
        showFallbackNotification(title, body);
        
        return { sent: false, error: error.message };
    }
}