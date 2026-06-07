const CACHE_NAME = "plain-culture-v2";

// ONLY pre-cache lightweight static assets.
// Do NOT pre-cache the massive index.html (1.2MB single-file build) — it crashes installation.
const PRECACHE_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

// Install: Pre-cache only small static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Pre-caching essential static assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch((err) => console.warn("[SW] Pre-cache failed:", err))
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

// Fetch: Network-first with cache fallback for offline support
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and external API calls
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
        // Cache successful responses at runtime
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: try to serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // For navigations, fallback to cached homepage if available
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
      })
  );
});
