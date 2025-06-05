import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import '@fortawesome/fontawesome-svg-core/styles.css';
import faviconUrl from './assets/favicon.ico';

// Dynamically set the favicon
const faviconLink = document.createElement('link');
faviconLink.rel = 'icon';
faviconLink.href = faviconUrl;
document.head.appendChild(faviconLink);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
