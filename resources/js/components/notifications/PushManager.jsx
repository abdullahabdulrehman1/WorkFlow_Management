import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Function to convert base64 string to Uint8Array for applicationServerKey
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

// Function to check if push notifications are supported
function isPushNotificationSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Function to get existing subscription
async function getExistingSubscription() {
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return null;
        
        const subscription = await registration.pushManager.getSubscription();
        return subscription;
    } catch (error) {
        console.error('Error getting existing subscription:', error);
        return null;
    }
}

// Function to register service worker
async function registerServiceWorker() {
    try {
        let registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
            registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('Service Worker registered successfully:', registration);
        } else {
            console.log('Service Worker already registered');
        }
        
        return registration;
    } catch (error) {
        console.error('Error registering service worker:', error);
        throw error;
    }
}

// Function to subscribe to push notifications
export async function subscribeToPush(retries = 3) {
    if (!isPushNotificationSupported()) {
        console.log('Push notifications not supported in this browser');
        toast.error('Push notifications are not supported in your browser');
        return false;
    }
    
    try {
        // Check for existing subscription first
        const existingSubscription = await getExistingSubscription();
        if (existingSubscription) {
            console.log('Already subscribed to push notifications');
            return true;
        }
        
        // Register service worker
        const registration = await registerServiceWorker();
        
        // Wait until the service worker is ready
        await navigator.serviceWorker.ready;
        
        // Request notification permission
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            
            // Show a message to the user about enabling notifications
            if (permission === 'denied') {
                toast.error('Notification permission denied. Please enable notifications in your browser settings for workflow alerts.');
            }
            return false;
        }
        
        // Get the VAPID public key from meta tag
        const vapidPublicKey = document.querySelector('meta[name="vapid-public-key"]')?.content;
        
        if (!vapidPublicKey) {
            console.error('VAPID public key not found');
            toast.error('Unable to configure notifications: Missing security key');
            return false;
        }
        
        // Convert VAPID public key to the format expected by the browser
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
        });
        
        console.log('Push subscription successful:', subscription);
        
        // Send the subscription to the server
        await axios.post('/api/subscribe', {
            endpoint: subscription.endpoint,
            public_key: subscription.toJSON().keys.p256dh,
            auth_token: subscription.toJSON().keys.auth,
        });
        
        console.log('Subscription sent to server successfully');
        toast.success('Notifications enabled successfully!');
        return true;
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        
        // Implement retry logic
        if (retries > 0) {
            console.log(`Retrying subscription... (${retries} attempts left)`);
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(subscribeToPush(retries - 1));
                }, 2000); // Wait 2 seconds before retrying
            });
        } else {
            toast.error('Failed to enable notifications. Please try again later.');
            return false;
        }
    }
}

// Function to test push notification
export async function sendTestNotification() {
    try {
        const response = await axios.post('/api/push-notify', {
            title: 'Test Notification',
            body: 'This is a test notification from Workflow Management'
        });
        
        return response.data;
    } catch (error) {
        console.error('Error sending test notification:', error);
        throw error;
    }
}

// React component that initializes push notifications
const PushManager = () => {
    const [initialized, setInitialized] = useState(false);
    
    useEffect(() => {
        // Try to subscribe to push notifications when the component mounts
        // but only once
        if (!initialized) {
            const initializePushNotifications = async () => {
                // Only attempt to initialize if not in an iframe
                if (window.self === window.top) {
                    try {
                        await subscribeToPush();
                        setInitialized(true);
                    } catch (error) {
                        console.error('Failed to initialize push notifications', error);
                    }
                }
            };
            
            // Delay initialization slightly to allow page to load
            const timer = setTimeout(() => {
                initializePushNotifications();
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [initialized]);
    
    // This component doesn't render anything visible
    return null;
};

export default PushManager;