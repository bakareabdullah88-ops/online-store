/* Kamplug service worker: offline shell for pages already visited. Bump VERSION
 * to invalidate. */
const VERSION = "kamplug-v2";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll([OFFLINE_URL, "/icon/192"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => caches.match(request));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // The backend (sign-in redirects, photos, live updates) always goes straight to the network.
  if (url.pathname.startsWith("/api/")) return;

  // Pages: network first, then the cached copy, then the offline page.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request).then((res) => res || caches.match(OFFLINE_URL)));
    return;
  }

  // Immutable build assets and fonts: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Client navigations (RSC payloads): network first with cache fallback.
  if (request.headers.get("RSC") === "1") {
    event.respondWith(networkFirst(request).then((res) => res || Response.error()));
  }
});
