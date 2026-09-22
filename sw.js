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
  '/css/admin-panel.css',
  '/css/employee-panel.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/admin-panel.js',
  '/js/employee-panel.js',
  '/js/supabase.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Fallback to network first for APIs and dynamically generated pages, cache for static
  // But for simple static assets cache-first is fine, as requested: "cache-first strategy for our static assets"
  const url = new URL(event.request.url);
  
  if (url.origin === location.origin && (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/') || url.pathname.startsWith('/assets/'))) {
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            if (response) return response;
            return fetch(event.request).then(res => {
                if(!res || res.status !== 200 || res.type !== 'basic') return res;
                var resToCache = res.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, resToCache));
                return res;
            });
          })
      );
  } else {
      // For HTML and other dynamic endpoints, use network-first or pass-through
      event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});
