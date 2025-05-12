import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { registerSW } from 'virtual:pwa-register';

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

createInertiaApp({
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
    setup({ el, App, props }) {
        createRoot(el).render(
            <>
                <App {...props} />
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
            </>
        );
    },
});