import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import './neutralino.d.ts';
import '@fortawesome/fontawesome-svg-core/styles.css';

// Initialize Neutralino when it's available
if (typeof window !== 'undefined' && (window as any).Neutralino) {
    (window as any).Neutralino.init();

    // Set up event listeners for Neutralino
    (window as any).Neutralino.events.on('windowClose', () => {
        (window as any).Neutralino.app.exit();
    });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
