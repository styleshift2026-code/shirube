const CACHE_NAME = 'shirube-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n!==CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

// HTML (navigation) requests: always try the network first so updates show up
// immediately; fall back to the cache only when offline.
self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  var isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';

  if(isNavigation){
    event.respondWith(
      fetch(event.request).then(function(res){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, resClone); });
        return res;
      }).catch(function(){ return caches.match(event.request).then(function(c){ return c || caches.match('./index.html'); }); })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(res){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, resClone); });
        return res;
      });
    })
  );
});
