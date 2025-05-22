const CACHE_NAME = "weather-pwa-cache-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/favorites.html",
  "/add-favorite.html",
  "/styles.css",
  "/script.js",
  "/icons/small_icon.png",
  "/icons/big_icon.png",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Install event");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching essential assets");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error("Service Worker: Failed to cache on install", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activate event");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).catch((error) => {
        console.log(
          "Service Worker: Fetch failed for",
          event.request.url,
          error
        );

        if (event.request.mode === "navigate") {
          return caches.match(OFFLINE_URL).then((offlineResponse) => {
            if (offlineResponse) {
              return offlineResponse;
            }
            return new Response(
              "<h1>Jestes offline</h1><p>Ta strona jest niedostepna offline. Sprobuj ponownie, gdy bedziesz miec polaczenie.</p>",
              {
                headers: { "Content-Type": "text/html" },
              }
            );
          });
        }

        throw error;
      });
    })
  );
});
