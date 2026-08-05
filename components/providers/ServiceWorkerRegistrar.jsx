'use client';

import { useEffect } from 'react';

/** Registers the service worker in production only — in dev it would cache
 *  stale HMR chunks and make changes appear not to apply. */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // A failed SW registration must never break the page.
      });
    };

    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
