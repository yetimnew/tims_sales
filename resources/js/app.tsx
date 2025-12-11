import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Import routes to set up global Ziggy routes
import './routes';
import { configureEcho } from '@laravel/echo-react';

const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT ?? (reverbScheme === 'https' ? 443 : 80));

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: reverbPort,
    wssPort: reverbPort,
    scheme: reverbScheme,
    forceTLS: reverbScheme === 'https',
    enabledTransports: ['ws', 'wss'],
    path: import.meta.env.VITE_REVERB_PATH ?? '',
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('🚨 Global Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
    });
});

const appName = import.meta.env.VITE_APP_NAME || 'TIMS';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
