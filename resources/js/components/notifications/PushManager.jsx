import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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

// Function to detect if running on localhost
function isLocalhost() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.indexOf('192.168.') === 0;
}

// Check if running on a mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Function to subscribe to push notifications
export async function subscribeToPush() {
    try {
        // First, check if push is supported
        if (!('serviceWorker' in navigator && 'PushManager' in window)) {
            console.log('Push notifications not supported');
            return { success: false, reason: 'unsupported' };
        }

        // Check if running on localhost
        const isLocal = isLocalhost();
        
        // Register service worker or use mock data for localhost
        let subscription;
        let subscriptionJson;
        
        if (isLocal) {
            console.log('Running on localhost - creating test subscription');
            
            // Still request notification permission for UX consistency
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return { success: false, reason: 'permission-denied' };
            }
            
            // Create mock subscription data for localhost testing
            subscription = {
                endpoint: 'https://localhost-testing-endpoint-' + Date.now(),
            };
            
            subscriptionJson = {
                keys: {
                    p256dh: 'mock-public-key-for-testing-' + Math.random().toString(36).substring(2),
                    auth: 'mock-auth-token-' + Math.random().toString(36).substring(2),
                }
            };
            
            console.log('Created mock subscription for localhost:', subscription);
        } else {
            // For production sites: Register real service worker
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
            
            try {
                // Subscribe with real push service
                const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
                subscription = await swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                });
                
                // Get subscription as JSON
                subscriptionJson = subscription.toJSON();
            } catch (error) {
                console.error('Error during subscription process:', error);
                return { success: false, reason: 'subscription-error', error };
            }
        }
        
        // Regardless of environment, send the subscription to the server
        try {
            console.log('Sending subscription to server:', subscription.endpoint);
            
            const response = await axios.post('/api/subscribe', {
                endpoint: subscription.endpoint,
                public_key: subscriptionJson.keys.p256dh,
                auth_token: subscriptionJson.keys.auth,
                content_encoding: isLocal ? 'test' : 'aes128gcm',
                user_id: 1  // Add user_id if your schema requires it
            });
            
            if (response.data.success) {
                console.log('Push subscription registered successfully');
                return { success: true, isLocalDevelopment: isLocal };
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

// React component that initializes push notifications
const PushManager = () => {
    const [isLocalhostEnv, setIsLocalhostEnv] = useState(false);
    
    useEffect(() => {
        // Check if running on localhost
        setIsLocalhostEnv(isLocalhost());
        
        const initPushNotifications = async () => {
            // Don't run in iframes
            if (window.self !== window.top) return;
            
            try {
                // Wait a moment for page to load fully
                setTimeout(async () => {
                    const result = await subscribeToPush();
                    
                    if (result.isLocalDevelopment) {
                        console.log('Running in local development mode - mock push subscription created');
                    } else if (!result.success) {
                        console.log('Push notifications not enabled:', result.reason);
                        
                        // Only show permission errors to user
                        if (result.reason === 'permission-denied') {
                            toast.error('Please enable notifications for workflow alerts');
                        }
                    }
                }, 2000);

                // For mobile apps, request notification permissions if needed
                if (isMobileDevice()) {
                    if ('Notification' in window) {
                        Notification.requestPermission();
                    }
                }
            } catch (error) {
                console.error('Error initializing push notifications:', error);
            }
        };
        
        initPushNotifications();
    }, []);
    
    // Show a small indicator during local development
    if (isLocalhostEnv && process.env.NODE_ENV === 'development') {
        return (
            <div style={{
                position: 'fixed',
                bottom: 10, 
                right: 10, 
                background: 'rgba(0,0,0,0.1)', 
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                zIndex: 9999
            }}>
                Local notifications active
            </div>
        );
    }
    
    return null;
};

export default PushManager;