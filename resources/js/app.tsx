import { createInertiaApp } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    // Public pages send their full title, suffix included (App\Support\Seo\Seo).
    title: (title) => title || appName,
    progress: {
        color: '#4B5563',
    },
});
