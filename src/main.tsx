import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and safely handle benign iframe-level IndexedDB transaction abort errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (
      reasonStr.includes("createOrUpgrade") ||
      reasonStr.includes("The transaction was aborted") ||
      reasonStr.includes("AbortError") ||
      event.reason?.name === 'AbortError'
    ) {
      console.warn('[IndexedDB Resilience] Intercepted benign aborted transaction rejection:', reasonStr);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const messageStr = String(event.message || event.error?.message || '');
    if (
      messageStr.includes("createOrUpgrade") ||
      messageStr.includes("The transaction was aborted") ||
      messageStr.includes("AbortError")
    ) {
      console.warn('[IndexedDB Resilience] Intercepted benign aborted transaction error:', messageStr);
      event.preventDefault();
    }
  });
}

// Register Service Worker for offline functionality and Stale-While-Revalidate caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(
      (registration) => {
        console.log('[Harmony SW] ServiceWorker registered with scope:', registration.scope);
      },
      (err) => {
        console.warn('[Harmony SW] ServiceWorker registration failed:', err);
      }
    );
  });
} else if ('serviceWorker' in navigator) {
  // Always register in dev/preview environment if supported
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(
      (registration) => {
        console.log('[Harmony SW] Dev ServiceWorker registered with scope:', registration.scope);
      },
      (err) => {
        console.warn('[Harmony SW] Dev ServiceWorker registration failed:', err);
      }
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

