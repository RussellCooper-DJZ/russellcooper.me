/**
 * Service Worker for russellcooper.me
 * Strategy: Stale-While-Revalidate for most assets, Network-First for HTML
 * Purpose: Instant loading, offline access, and background updates
 */

const CACHE_NAME = 'rc-portfolio-v3';
const STATIC_CACHE = 'rc-static-v3';

// Assets to pre-cache on install (critical path)
// Updated with latest build hashes from March 2026
const PRECACHE_ASSETS = [
  '/',
  '/assets/index-B59Olrk2.js',
  '/assets/vendor-core-wOJwx7kQ.js',
  '/assets/vendor-ui-CM71TTxK.js',
  '/assets/index-CmGxIbAT.css',
  '/assets/wechat_qr.png',
];

// ── Install: pre-cache critical assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed for some assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: smart caching strategy ───────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, analytics, and chrome-extension requests
  if (
    request.method !== 'GET' ||
    url.pathname.includes('/umami') ||
    (!url.origin.includes('russellcooper.me') && 
     !url.origin.includes('localhost') && 
     !url.origin.includes('fonts.googleapis.com') && 
     !url.origin.includes('fonts.gstatic.com'))
  ) {
    return;
  }

  // Strategy 1: Cache-First for versioned assets (JS, CSS)
  if (url.pathname.startsWith('/assets/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy 2: Stale-While-Revalidate for images and fonts
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|woff2|woff|ttf)$/) ||
    url.origin.includes('fonts.gstatic.com')
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Strategy 3: Network-First with cache fallback for HTML/Root
  event.respondWith(networkFirstWithFallback(request));
});

// ── Cache Strategies ─────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetchPromise;
}

async function networkFirstWithFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { signal: AbortSignal.timeout(3000) });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    return cached || await caches.match('/');
  }
}
