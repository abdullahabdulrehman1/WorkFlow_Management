import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import React from 'react';

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