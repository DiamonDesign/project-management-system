/**
 * Advanced Service Worker for VisionDay
 * Implements sophisticated caching strategies, background sync, and offline support
 */

// Service Worker version for cache busting
const SW_VERSION = '1.0.0';
const CACHE_NAME = `visionday-v${SW_VERSION}`;

// Cache configurations
const CACHE_CONFIG = {
  // Static assets cache (immutable)
  static: {
    name: `${CACHE_NAME}-static`,
    strategy: 'CacheFirst',
    maxEntries: 100,
    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
    patterns: [
      /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
      /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
      /^https:\/\/cdn\.jsdelivr\.net/
    ]
  },

  // Dynamic content cache
  dynamic: {
    name: `${CACHE_NAME}-dynamic`,
    strategy: 'NetworkFirst',
    maxEntries: 50,
    maxAgeSeconds: 60 * 60 * 24, // 1 day
    networkTimeoutSeconds: 3,
    patterns: [
      /^https:\/\/visionday\.app\/$/,
      /^https:\/\/visionday\.app\/dashboard/,
      /^https:\/\/visionday\.app\/projects/,
      /^https:\/\/visionday\.app\/tasks/
    ]
  },

  // API cache
  api: {
    name: `${CACHE_NAME}-api`,
    strategy: 'NetworkFirst',
    maxEntries: 100,
    maxAgeSeconds: 60 * 60, // 1 hour
    networkTimeoutSeconds: 5,
    patterns: [
      /\/api\/projects/,
      /\/api\/tasks/,
      /\/api\/clients/
    ]
  },

  // Images cache
  images: {
    name: `${CACHE_NAME}-images`,
    strategy: 'CacheFirst',
    maxEntries: 200,
    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
    patterns: [
      /\.(?:png|jpg|jpeg|gif|svg|webp|avif)$/i
    ]
  }
};

// Background sync configurations
const SYNC_CONFIG = {
  // Retry delays (exponential backoff)
  retryDelays: [1000, 5000, 15000, 30000, 60000], // 1s, 5s, 15s, 30s, 1m

  // Sync tags
  tags: {
    PROJECT_SYNC: 'project-sync',
    TASK_SYNC: 'task-sync',
    OFFLINE_ANALYTICS: 'offline-analytics'
  }
};

// Global variables
let isOnline = navigator.onLine;
const pendingRequests = new Map();
const analytics = {
  queue: [],
  endpoint: '/api/analytics'
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}`);

  event.waitUntil(
    (async () => {
      // Pre-cache critical resources
      const cache = await caches.open(CACHE_CONFIG.static.name);

      const criticalResources = [
        '/',
        '/offline.html',
        '/manifest.json',
        // Add other critical resources
      ];

      try {
        await cache.addAll(criticalResources);
        console.log('[SW] Critical resources cached');
      } catch (error) {
        console.error('[SW] Failed to cache critical resources:', error);
      }

      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}`);

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name =>
        name.startsWith('visionday-v') && name !== CACHE_NAME
      );

      await Promise.all(
        oldCaches.map(name => caches.delete(name))
      );

      if (oldCaches.length > 0) {
        console.log('[SW] Cleaned up old caches:', oldCaches);
      }

      // Take control of all clients immediately
      self.clients.claim();

      // Initialize background sync if available
      if ('sync' in self.registration) {
        console.log('[SW] Background sync available');
      }

      // Initialize push notifications if available
      if ('pushManager' in self.registration) {
        console.log('[SW] Push notifications available');
      }
    })()
  );
});

/**
 * Fetch Event Handler - Main request interceptor
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (except for offline handling)
  if (request.method !== 'GET') {
    return handleNonGetRequest(event);
  }

  // Determine caching strategy based on request
  const strategy = getCachingStrategy(request);

  if (strategy) {
    event.respondWith(strategy(request));
  }
});

/**
 * Background Sync Event Handler
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  switch (event.tag) {
    case SYNC_CONFIG.tags.PROJECT_SYNC:
      event.waitUntil(syncProjects());
      break;
    case SYNC_CONFIG.tags.TASK_SYNC:
      event.waitUntil(syncTasks());
      break;
    case SYNC_CONFIG.tags.OFFLINE_ANALYTICS:
      event.waitUntil(syncAnalytics());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

/**
 * Push Event Handler
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  const { notification, action } = event;

  event.notification.close();

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      // Handle notification actions
      let url = '/';

      if (action) {
        url = notification.data.actions?.[action]?.url || '/';
      } else if (notification.data.url) {
        url = notification.data.url;
      }

      // Focus existing tab or open new one
      const existingClient = clients.find(client =>
        client.url.includes(url) && 'focus' in client
      );

      if (existingClient) {
        return existingClient.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })()
  );
});

/**
 * Message Handler - Communication with main thread
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'CACHE_UPDATE':
      handleCacheUpdate(payload);
      break;
    case 'ANALYTICS_TRACK':
      handleAnalyticsTracking(payload);
      break;
    case 'SYNC_REQUEST':
      handleSyncRequest(payload);
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Online/Offline Event Handlers
 */
self.addEventListener('online', () => {
  isOnline = true;
  console.log('[SW] Back online');

  // Retry pending requests
  retryPendingRequests();

  // Trigger background sync
  if ('sync' in self.registration) {
    self.registration.sync.register(SYNC_CONFIG.tags.OFFLINE_ANALYTICS);
  }
});

self.addEventListener('offline', () => {
  isOnline = false;
  console.log('[SW] Gone offline');
});

/**
 * Caching Strategy Implementations
 */

// Cache First strategy (for static assets)
async function cacheFirst(request, cacheConfig) {
  const cache = await caches.open(cacheConfig.name);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Update cache in background if stale
    if (isStale(cachedResponse, cacheConfig.maxAgeSeconds)) {
      updateCacheInBackground(request, cache);
    }
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await updateCache(cache, request, networkResponse.clone(), cacheConfig);
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First network error:', error);
    return createOfflineResponse(request);
  }
}

// Network First strategy (for dynamic content)
async function networkFirst(request, cacheConfig) {
  const cache = await caches.open(cacheConfig.name);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), cacheConfig.networkTimeoutSeconds * 1000);

    const networkResponse = await fetch(request, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (networkResponse.ok) {
      await updateCache(cache, request, networkResponse.clone(), cacheConfig);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network First fallback to cache:', error.message);

    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return createOfflineResponse(request);
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheConfig) {
  const cache = await caches.open(cacheConfig.name);
  const cachedResponse = await cache.match(request);

  // Always try to update from network in background
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        updateCache(cache, request, networkResponse.clone(), cacheConfig);
      }
      return networkResponse;
    })
    .catch(error => {
      console.log('[SW] Stale While Revalidate network error:', error);
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // If no cache, wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    return createOfflineResponse(request);
  }
}

/**
 * Utility Functions
 */

function getCachingStrategy(request) {
  const url = new URL(request.url);

  // Check each cache configuration
  for (const [name, config] of Object.entries(CACHE_CONFIG)) {
    if (config.patterns.some(pattern => pattern.test(request.url))) {
      switch (config.strategy) {
        case 'CacheFirst':
          return (req) => cacheFirst(req, config);
        case 'NetworkFirst':
          return (req) => networkFirst(req, config);
        case 'StaleWhileRevalidate':
          return (req) => staleWhileRevalidate(req, config);
        default:
          return null;
      }
    }
  }

  return null;
}

function isStale(response, maxAgeSeconds) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;

  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  const age = (now - responseTime) / 1000;

  return age > maxAgeSeconds * 0.8; // Consider stale at 80% of max age
}

async function updateCache(cache, request, response, config) {
  // Clean up cache if it exceeds max entries
  if (config.maxEntries) {
    await cleanupCache(cache, config.maxEntries);
  }

  // Store in cache
  await cache.put(request, response);
}

async function cleanupCache(cache, maxEntries) {
  const keys = await cache.keys();

  if (keys.length >= maxEntries) {
    // Remove oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxEntries + 10);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

function updateCacheInBackground(request, cache) {
  // Update cache in background without blocking response
  fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response);
      }
    })
    .catch(error => {
      console.log('[SW] Background cache update failed:', error);
    });
}

function createOfflineResponse(request) {
  const url = new URL(request.url);

  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    return caches.match('/offline.html');
  }

  // For API requests, return offline data or error
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This request requires an internet connection',
      offline: true
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // For other requests, return a basic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

function handleNonGetRequest(event) {
  const { request } = event;

  // If offline, store for later sync
  if (!isOnline && request.url.includes('/api/')) {
    event.respondWith(handleOfflineRequest(request));
    return;
  }

  // For online or non-API requests, proceed normally
  event.respondWith(fetch(request));
}

async function handleOfflineRequest(request) {
  // Store request for background sync
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };

  // Store in IndexedDB for persistence
  await storeOfflineRequest(requestData);

  // Register for background sync
  if ('sync' in self.registration) {
    await self.registration.sync.register(SYNC_CONFIG.tags.PROJECT_SYNC);
  }

  // Return offline response
  return new Response(JSON.stringify({
    success: true,
    message: 'Request queued for sync when online',
    offline: true
  }), {
    status: 202,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

async function storeOfflineRequest(requestData) {
  // Simple implementation - in production, use IndexedDB
  const stored = await caches.open(`${CACHE_NAME}-offline-requests`);
  const response = new Response(JSON.stringify(requestData));
  await stored.put(new Request(`/offline-request-${requestData.timestamp}`), response);
}

async function retryPendingRequests() {
  // Retrieve and retry offline requests
  const stored = await caches.open(`${CACHE_NAME}-offline-requests`);
  const requests = await stored.keys();

  for (const request of requests) {
    try {
      const response = await stored.match(request);
      const requestData = await response.json();

      // Retry the request
      await fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body || undefined
      });

      // Remove from storage on success
      await stored.delete(request);
    } catch (error) {
      console.log('[SW] Failed to retry offline request:', error);
    }
  }
}

// Background sync implementations
async function syncProjects() {
  console.log('[SW] Syncing projects...');
  await retryPendingRequests();
}

async function syncTasks() {
  console.log('[SW] Syncing tasks...');
  await retryPendingRequests();
}

async function syncAnalytics() {
  console.log('[SW] Syncing analytics...');

  if (analytics.queue.length === 0) {
    return;
  }

  try {
    await fetch(analytics.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events: analytics.queue
      })
    });

    // Clear queue on success
    analytics.queue = [];
  } catch (error) {
    console.log('[SW] Analytics sync failed:', error);
  }
}

// Message handlers
function handleCacheUpdate(payload) {
  // Force cache update for specific resources
  caches.open(CACHE_CONFIG.static.name).then(cache => {
    if (payload.urls) {
      return Promise.all(
        payload.urls.map(url =>
          fetch(url).then(response => {
            if (response.ok) {
              cache.put(url, response);
            }
          })
        )
      );
    }
  });
}

function handleAnalyticsTracking(payload) {
  analytics.queue.push({
    ...payload,
    timestamp: Date.now(),
    offline: !isOnline
  });

  // Sync immediately if online
  if (isOnline) {
    syncAnalytics();
  }
}

function handleSyncRequest(payload) {
  if ('sync' in self.registration && payload.tag) {
    self.registration.sync.register(payload.tag);
  }
}

console.log(`[SW] Service Worker ${SW_VERSION} loaded`);