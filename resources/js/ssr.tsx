import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { I18nextProvider } from 'react-i18next';
import ReactDOMServer from 'react-dom/server';
import i18n from './i18n';

const appName = import.meta.env.VITE_APP_NAME || 'TIMS';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            ),
        setup: ({ App, props }) => {
            return (
                <I18nextProvider i18n={i18n}>
                    <App {...props} />
                </I18nextProvider>
            );
        },
    }),
);
