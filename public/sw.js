// FreelanceFlow Service Worker v1.0.0
// Progressive Web App capabilities with offline support

const CACHE_NAME = 'freelanceflow-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Cache First - For static assets (JS, CSS, fonts, icons)
  CACHE_FIRST: 'cache-first',
  // Network First - For dynamic content (API calls, user data)
  NETWORK_FIRST: 'network-first',
  // Stale While Revalidate - For semi-dynamic content
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/projects',
  '/clients', 
  '/tasks',
  '/profile',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache with different strategies
const API_CACHE_CONFIG = {
  '/api/projects': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  '/api/clients': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  '/api/tasks': CACHE_STRATEGIES.NETWORK_FIRST,
  '/api/auth': CACHE_STRATEGIES.NETWORK_FIRST
};

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate new service worker immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - Handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and external URLs
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // Handle different resource types with appropriate strategies
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(navigationStrategy(request));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Cache First Strategy - For static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline content unavailable', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network First Strategy - For dynamic content
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline and no cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Stale While Revalidate Strategy - For semi-dynamic content
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || networkResponsePromise;
}

// API Request Handler - Apply strategy based on endpoint
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  
  const strategy = Object.keys(API_CACHE_CONFIG).find(key => 
    endpoint.startsWith(key)
  );
  
  if (strategy && API_CACHE_CONFIG[strategy] === CACHE_STRATEGIES.NETWORK_FIRST) {
    return networkFirstStrategy(request);
  } else if (strategy && API_CACHE_CONFIG[strategy] === CACHE_STRATEGIES.STALE_WHILE_REVALIDATE) {
    return staleWhileRevalidateStrategy(request);
  }
  
  return networkFirstStrategy(request);
}

// Navigation Strategy - For page navigation
async function navigationStrategy(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Return cached shell or offline page
    const cachedShell = await caches.match('/');
    if (cachedShell) {
      return cachedShell;
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>FreelanceFlow - Offline</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f8fafc;
              color: #334155;
            }
            .offline-message {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 1rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              max-width: 400px;
            }
            .icon { font-size: 3rem; margin-bottom: 1rem; }
            h1 { margin: 0 0 0.5rem 0; color: #1e293b; }
            p { margin: 0; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <div class="icon">📱</div>
            <h1>Sin conexión</h1>
            <p>No hay conexión a internet. Algunas funciones pueden no estar disponibles.</p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         url.pathname.includes('supabase.co') ||
         url.hostname.includes('supabase');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processOfflineActions());
  }
});

async function processOfflineActions() {
  // Process any queued offline actions
  console.log('[SW] Processing background sync...');
  
  try {
    const cache = await caches.open('offline-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
        console.log('[SW] Synced offline action:', request.url);
      } catch (error) {
        console.log('[SW] Failed to sync action:', request.url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notifications handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'general',
    requireInteraction: false,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window/tab with the target URL
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[SW] Service worker loaded successfully');