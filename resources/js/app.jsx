import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { registerSW } from 'virtual:pwa-register';
import PushManager from './components/notifications/PushManager';
import NotificationListener from './components/notifications/NotificationListener';
import { CallManager, CallProvider } from './components/call/CallManager';
import { WindowsNotificationUtil } from './utils/WindowsNotification';
import soundManager from './utils/SoundManager';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Standard service worker registration for push notifications
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
            console.error('ServiceWorker registration failed: ', error);
        });
}

// Register service worker for PWA functionality
const updateSW = registerSW({
    onNeedRefresh() {
        console.log('New version available');
        // You could show a UI notification here to prompt the user to refresh
    },
    onOfflineReady() {
        console.log('PWA is ready to work offline');
        // You could show a UI notification here that the app is ready for offline use
    }
});

// Debug: Check if we're in Electron immediately
console.log('🔍 Immediate Electron check:', typeof window !== 'undefined' ? !!window.electron : false);
console.log('🔍 Window object keys:', typeof window !== 'undefined' ? Object.keys(window).filter(key => key.includes('electron') || key.includes('Electron')) : 'No window');

// Wait a bit and check again in case preload script loads later
setTimeout(() => {
    console.log('🔍 Delayed Electron check:', typeof window !== 'undefined' ? !!window.electron : false);
    if (typeof window !== 'undefined' && window.electron) {
        console.log('✅ ELECTRON DETECTED AFTER DELAY');
        console.log('🔧 Available APIs:', Object.keys(window.electron));
    } else {
        console.log('❌ STILL NO ELECTRON AFTER DELAY');
    }
}, 1000);

// Initialize sound manager if in Electron environment
if (typeof window !== 'undefined' && window.electron) {
    console.log('🔊 Sound manager initialized for Electron environment');
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        createRoot(el).render(
            <CallProvider>
                <App {...props} />
                <PushManager />
                <NotificationListener userId={props.initialPage.props.auth?.user?.id} />
                <CallManager />
                <Toaster 
                    position="top-center" 
                    gutter={12}
                    containerStyle={{ 
                        zIndex: 9999,
                        top: 60 
                    }}
                    toastOptions={{
                        className: '!bg-opacity-90 backdrop-blur-sm',
                    }}
                />
            </CallProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});