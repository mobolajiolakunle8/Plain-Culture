const CACHE_NAME = "plain-culture-v1";

// Assets to pre-cache for offline experience
const PRECACHE_ASSETS = [
  "/",
  "/icon-192.png",
  "/icon-512.png",
  "/images/hero.jpg",
  "/images/tee_onyx.jpg",
  "/images/tee_sand.jpg",
  "/images/tee_charcoal.jpg",
  "/images/tee_olive.jpg"
];

// Install: Pre-cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching essential assets");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first strategy with cache fallback
// This ensures fresh data from Firebase while still working offline
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and Firebase/external API calls
  if (
    event.request.method !== "GET" ||
    url.hostname.includes("firestore") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("web3forms") ||
    url.hostname.includes("wa.me")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline use
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the request is for a page navigation, serve the cached index
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
      })
  );
});
