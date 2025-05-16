import React, { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { LocalNotifications } from '@capacitor/local-notifications';

// Function to convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Function to show a simple desktop notification as fallback
function showFallbackNotification(title, body) {
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notifications");
        return;
    }
    
    if (Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: '/logo.png'
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, {
                    body: body,
                    icon: '/logo.png'
                });
            }
        });
    }
}

// Function to subscribe to push notifications
export async function subscribeToPush() {
    try {
        // First, check if push is supported
        if (!('serviceWorker' in navigator && 'PushManager' in window)) {
            console.log('Push notifications not supported');
            return { success: false, reason: 'unsupported' };
        }
        
        // Unsubscribe from existing subscriptions first
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                console.log('Unsubscribed from previous push subscription');
            }
        }
        
        // Register service worker
        const swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
        
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
        
        try {
            // Subscribe
            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
            const newSubscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            
            // Get subscription as JSON
            const subscriptionJson = newSubscription.toJSON();
            
            // Send to server
            const response = await axios.post('/api/subscribe', {
                endpoint: newSubscription.endpoint,
                public_key: subscriptionJson.keys.p256dh,
                auth_token: subscriptionJson.keys.auth,
                content_encoding: 'aes128gcm'
            });
            
            if (response.data.success) {
                console.log('Push subscription registered successfully');
                return { success: true };
            } else {
                console.error('Server rejected subscription:', response.data);
                return { success: false, reason: 'server-rejected' };
            }
        } catch (error) {
            console.error('Error during subscription process:', error);
            return { success: false, reason: 'subscription-error', error };
        }
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return { success: false, reason: 'general-error', error };
    }
}

// Function to send push notification
export async function sendNotification(title, body, url = null) {
    try {
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

// React component that initializes push notifications
const PushManager = () => {
    useEffect(() => {
        const initPushNotifications = async () => {
            // Dont run in iframes
            if (window.self !== window.top) return;
            
            try {
                // Wait a moment for page to load fully
                setTimeout(async () => {
                    const result = await subscribeToPush();
                    
                    if (!result.success) {
                        console.log('Push notifications not enabled:', result.reason);
                        
                        // Only show permission errors to user
                        if (result.reason === 'permission-denied') {
                            toast.error('Please enable notifications for workflow alerts');
                        }
                    }
                }, 2000);

                // Request Local Notifications permission
                const { granted } = await LocalNotifications.requestPermissions();
                if (!granted) {
                    console.log('Local notifications permission denied');
                }
            } catch (error) {
                console.error('Error initializing push notifications:', error);
            }
        };
        
        initPushNotifications();
    }, []);
    
    return null;
};

export default PushManager;