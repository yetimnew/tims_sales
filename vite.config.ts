import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separate vendor chunks for better caching
                    'react-vendor': ['react', 'react-dom', '@inertiajs/react'],
                    'ui-vendor': [
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-checkbox',
                        '@radix-ui/react-collapsible',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-label',
                        '@radix-ui/react-navigation-menu',
                        '@radix-ui/react-popover',
                        '@radix-ui/react-select',
                        '@radix-ui/react-separator',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-toast',
                        '@radix-ui/react-toggle',
                        '@radix-ui/react-toggle-group',
                        '@radix-ui/react-tooltip',
                    ],
                    'icons-vendor': ['lucide-react'],
                    'charts-vendor': ['recharts'],
                    'maps-vendor': ['leaflet', 'react-leaflet'],
                },
            },
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Enable source maps for production debugging (optional)
        sourcemap: false,
    },
    // Optimize dependencies
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            'lucide-react',
        ],
    },
});
