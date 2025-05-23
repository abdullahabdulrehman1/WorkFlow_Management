\
import { useState, useEffect } from 'react';
import axios from 'axios';

const VAPID_PUBLIC_KEY_ROUTE = '/vapid-public-key';
const PUSH_SUBSCRIBE_ROUTE = '/push-subscriptions';

async function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setSubscriptionError('Push notifications are not supported by this browser.');
            setIsLoading(false);
            return;
        }

        async function registerPushSubscription() {
            try {
                const registration = await navigator.serviceWorker.ready;
                let existingSubscription = await registration.pushManager.getSubscription();

                if (existingSubscription) {
                    setIsSubscribed(true);
                    setIsLoading(false);
                    // Optionally, you might want to re-send the subscription to the backend
                    // to ensure it's up-to-date, or if the user re-enabled notifications.
                    // await sendSubscriptionToBackend(existingSubscription);
                    return;
                }

                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    setSubscriptionError('Permission for notifications was denied.');
                    setIsLoading(false);
                    return;
                }

                const response = await axios.get(VAPID_PUBLIC_KEY_ROUTE);
                const vapidPublicKey = response.data.vapidPublicKey;

                if (!vapidPublicKey) {
                    setSubscriptionError('VAPID public key not found.');
                    setIsLoading(false);
                    return;
                }

                const applicationServerKey = await urlBase64ToUint8Array(vapidPublicKey);
                existingSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                });

                await sendSubscriptionToBackend(existingSubscription);
                setIsSubscribed(true);
            } catch (error) {
                console.error('Error subscribing to push notifications:', error);
                setSubscriptionError('Failed to subscribe to push notifications.');
            } finally {
                setIsLoading(false);
            }
        }

        registerPushSubscription();
    }, []);

    async function sendSubscriptionToBackend(subscription) {
        try {
            await axios.post(PUSH_SUBSCRIBE_ROUTE, subscription.toJSON());
        } catch (error) {
            console.error('Error sending subscription to backend:', error);
            // Handle error appropriately, maybe retry or inform the user
            setSubscriptionError('Failed to save push subscription on the server.');
            // If sending to backend fails, we should probably unsubscribe locally too
            // or at least set isSubscribed to false
            if (subscription) {
                await subscription.unsubscribe();
            }
            setIsSubscribed(false);
            throw error; // Re-throw to be caught by caller if needed
        }
    }

    return { isSubscribed, subscriptionError, isLoading };
}
