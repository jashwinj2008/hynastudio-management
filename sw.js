const CACHE_NAME = 'hynaos-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin-login.html',
  '/employee-login.html',
  '/admin-dashboard.html',
  '/employee-dashboard.html',
  '/css/style.css',
  '/css/responsive.css',
  '/css/splash.css',
  '/css/admin-panel.css',
  '/css/employee-panel.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/supabase.js',
  '/js/role-selection.js',
  '/js/admin-panel.js',
  '/js/employee-panel.js',
  '/js/splash.js',
  '/assets/logo/hynaos-logo.jpeg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Don't cache supabase API calls
                if (!event.request.url.includes('supabase.co')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
