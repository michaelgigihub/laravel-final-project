import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme, ThemeProvider } from './hooks/use-appearance';
import { AnimatedScrollbar } from '@/components/ui/animated-scrollbar';
import { ChatProvider } from '@/contexts/chat-context';
import { DentalChatBot } from '@/components/dental-chat-bot';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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
            <ThemeProvider>
                <ChatProvider>
                    <AnimatedScrollbar />
                    <App {...props} />
                    <DentalChatBot isGlobal />
                </ChatProvider>
            </ThemeProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
