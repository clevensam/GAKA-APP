
const CACHE_NAME = 'gaka-pinterest-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './manifest.json',
  './index.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME && caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Network-First for dynamic content, Cache-First for static UI
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // If it's a supabase request or dynamic data, try network first
  if (url.origin.includes('supabase.co')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Otherwise, default to Cache falling back to network
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
