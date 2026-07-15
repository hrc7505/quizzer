// Quizzer Service Worker – caches the app shell for offline use.
// Strategy:
//  - Navigations: network-first, fall back to the cached shell ("/") when offline.
//  - Static assets (JS/CSS/images): left to the browser's own HTTP cache so we
//    never serve a stale hashed bundle after a redeploy.
//  - API / auth requests: never intercepted.
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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Only manage navigations. Everything else falls through to the browser.
  if (request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = (await caches.match(request)) || (await caches.match("/"));
        return (
          cached ||
          new Response("You are offline and this page was not cached.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
        );
      }
    })()
  );
});
