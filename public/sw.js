// Quizzer Service Worker – caches the app shell for offline use
const CACHE_NAME = "quizzer-v2";
const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy: try network, fall back to cache
self.addEventListener("fetch", (event) => {
  // Only intercept same-origin GET requests; skip API / auth routes
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("/auth/")
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(event.request);
        // Cache a clone of successful responses only
        if (res && res.ok && res.type === "basic") {
          const clone = res.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, clone).catch(() => {});
        }
        return res;
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Offline fallback for navigations
        if (event.request.mode === "navigate") {
          const fallback = await caches.match("/");
          if (fallback) return fallback;
        }
        // Never resolve to undefined — return a real Response
        return new Response("Network request failed and no cached response is available.", {
          status: 408,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })()
  );
});
