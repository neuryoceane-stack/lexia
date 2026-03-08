const CACHE_NAME = "lexiva-v1";
const ASSET_PREFIXES = ["/logo.png", "/_next/static/", "/fonts/"];

function isAssetRequest(url) {
  const path = new URL(url).pathname;
  return ASSET_PREFIXES.some((p) => path.startsWith(p)) || /\.(png|jpg|jpeg|svg|ico|woff2?|css|js)$/.test(path);
}

function isApiRequest(url) {
  return new URL(url).pathname.startsWith("/api/");
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (event.request.method !== "GET") return;

  if (isApiRequest(url)) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({ error: "Offline" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }))
    );
    return;
  }

  if (isAssetRequest(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) =>
          cached || fetch(event.request).then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          })
        )
      )
    );
  }
});
