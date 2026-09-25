/**
 * @file sw.js
 * @description Advanced Service Worker for Harmony OS Super App.
 * Implements Stale-While-Revalidate caching for static assets & mini-app code chunks,
 * Cache-First for media/fonts, and dedicated offline Firestore caching for Notes, Docs, and Calendar Events.
 */

const SHELL_CACHE_NAME = 'harmony-os-shell-v4';
const DATA_CACHE_NAME = 'harmony-os-data-v4';
const FIRESTORE_CACHE_NAME = 'harmony-os-firestore-v4';
const ASSETS_CACHE_NAME = 'harmony-os-assets-v4';
const AJAM_OFFLINE_CACHE = 'harmony-ajam-script-v4';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './harmony-logo.jpg'
];

// Install Event: Precaches App Shell with resilient fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then(async (cache) => {
      console.log('[SW] Precaching Harmony OS app shell');
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Precache skipped for:', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate Event: Prunes old caches & claims clients
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE_NAME, DATA_CACHE_NAME, FIRESTORE_CACHE_NAME, ASSETS_CACHE_NAME, AJAM_OFFLINE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting deprecated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event: Caches Firestore data, Mini-App snapshots, & AjamScript manuscript metadata
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, key, entity, data, timestamp } = event.data;

  if (type === 'CACHE_FIRESTORE_DATA' || type === 'CACHE_MINI_APP_SNAPSHOT' || type === 'CACHE_AJAM_DATA') {
    const cacheKey = key || (entity ? `firestore_${entity}` : 'unknown_snapshot');
    const targetUrl = new URL(`/offline-cache/${cacheKey}`, self.location.origin).href;
    const secondaryUrl = entity ? new URL(`/api/firestore/${entity}`, self.location.origin).href : null;
    const ajamUrl = entity ? new URL(`/api/ajam/${entity}`, self.location.origin).href : null;

    const payload = JSON.stringify({
      key: cacheKey,
      entity: entity || cacheKey,
      data,
      timestamp: timestamp || Date.now(),
      cachedAt: new Date().toISOString()
    });

    const headers = {
      'Content-Type': 'application/json',
      'X-Harmony-Ajam-Cache': 'true',
      'X-Harmony-Cached-At': new Date(timestamp || Date.now()).toISOString()
    };

    caches.open(AJAM_OFFLINE_CACHE).then((cache) => {
      cache.put(targetUrl, new Response(payload, { headers }));
      if (secondaryUrl) cache.put(secondaryUrl, new Response(payload, { headers }));
      if (ajamUrl) cache.put(ajamUrl, new Response(payload, { headers }));
      console.log(`[SW] AjamScript / Mini-App offline cache updated for: ${cacheKey}`);
    }).catch((err) => {
      console.warn('[SW] Failed to cache snapshot:', err);
    });
  }

  // Handle Factory Reset & App Cache Purge messages
  if (type === 'FACTORY_RESET_APP' || type === 'CLEAR_APP_CACHE') {
    const targetAppId = event.data.appId;
    if (targetAppId) {
      const allCaches = [SHELL_CACHE_NAME, DATA_CACHE_NAME, FIRESTORE_CACHE_NAME, ASSETS_CACHE_NAME, AJAM_OFFLINE_CACHE];
      Promise.all(
        allCaches.map(async (cacheName) => {
          try {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            for (const req of requests) {
              if (req.url.toLowerCase().includes(targetAppId.toLowerCase())) {
                await cache.delete(req);
              }
            }
          } catch (e) {
            console.debug('[SW] Cache purge error for', cacheName, e);
          }
        })
      ).then(() => {
        console.log(`[SW] Factory reset cache wipe complete for: ${targetAppId}`);
      });
    }
  }
});

// Fetch Event: Tiered caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or unsupported schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle synthetic offline data & AjamScript manuscript / character sets endpoints
  if (url.pathname.startsWith('/offline-cache/') || url.pathname.startsWith('/api/firestore/') || url.pathname.startsWith('/api/ajam/')) {
    event.respondWith(
      caches.open(AJAM_OFFLINE_CACHE).then((ajamCache) => {
        return ajamCache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return caches.open(FIRESTORE_CACHE_NAME).then((fsCache) => {
            return fsCache.match(request).then((fsResponse) => {
              if (fsResponse) return fsResponse;

              return caches.open(DATA_CACHE_NAME).then((dataCache) => {
                return dataCache.match(request).then((dataResponse) => {
                  if (dataResponse) return dataResponse;
                  return new Response(JSON.stringify({ status: 'offline_empty', data: [] }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'X-Harmony-Offline-Fallback': 'true' }
                  });
                });
              });
            });
          });
        });
      })
    );
    return;
  }

  // Navigation Requests: Network-First with HTML App Shell fallback for single-page app
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('./index.html') || caches.match('./') || caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Intercept Google Firestore REST or WebChannel network failures gracefully when offline
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebase') || url.pathname.includes('google.firestore')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return matching cached snapshot or fallback empty array payload when offline
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, documents: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Harmony-Offline-Firestore': 'true' }
          });
        });
      })
    );
    return;
  }

  // Static Assets and Code Chunks (JS, CSS, Fonts, Images, Icons, CDNs)
  const isStaticAssetOrChunk = 
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|ico|woff|woff2|ttf|wasm)$/) ||
    url.pathname.includes('/assets/') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('images.unsplash.com');

  if (isStaticAssetOrChunk) {
    // Stale-While-Revalidate Caching Strategy
    event.respondWith(
      caches.open(ASSETS_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((err) => {
              console.log('[SW] Fetch failed in SWR for asset:', request.url, err);
            });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // API Requests & General Dynamic Resources: Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DATA_CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
