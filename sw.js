/**
 * Service Worker for russellcooper.me
 * Strategy: Cache-First for static assets, Network-First for HTML
 * Purpose: Reduce origin load under high traffic, enable offline access
 */

const CACHE_NAME = 'rc-portfolio-v1';
const STATIC_CACHE = 'rc-static-v1';

// Assets to pre-cache on install (critical path)
const PRECACHE_ASSETS = [
  '/',
  '/assets/index-SVyT6XHO.js',
  '/assets/index-DPQAAFZr.css',
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

  // Skip non-GET, cross-origin analytics, and chrome-extension requests
  if (
    request.method !== 'GET' ||
    url.pathname === '/umami' ||
    !url.origin.includes('russellcooper.me') && !url.origin.includes('localhost') && !url.origin.includes('127.0.0.1') && !url.origin.includes('fonts.googleapis.com') && !url.origin.includes('fonts.gstatic.com')
  ) {
    return;
  }

  // Strategy 1: Cache-First for hashed static assets (JS, CSS, images)
  // These files have content-hash in filename → safe to cache forever
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy 2: Stale-While-Revalidate for Google Fonts CSS
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Strategy 3: Network-First with cache fallback for HTML (index.html)
  event.respondWith(networkFirstWithFallback(request));
});

// ── Cache Strategies ─────────────────────────────────────────────────────────

/**
 * Cache-First: serve from cache, fetch from network only on miss.
 * Best for versioned/hashed assets that never change.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

/**
 * Stale-While-Revalidate: serve cached immediately, update cache in background.
 * Best for fonts and semi-static resources.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || new Response('', { status: 503 });
}

/**
 * Network-First with cache fallback: try network, fall back to cache.
 * Best for HTML pages that should always be fresh but need offline support.
 */
async function networkFirstWithFallback(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Ultimate fallback: serve cached index.html for SPA navigation
    const indexFallback = await cache.match('/') || await caches.match('/');
    if (indexFallback) return indexFallback;

    return new Response(
      '<!doctype html><html><body><p style="font-family:monospace;padding:2rem">russellcooper.me is temporarily unavailable. Please check your connection.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
