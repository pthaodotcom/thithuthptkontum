const CACHE = "m4-exam-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_EXAM" || !Array.isArray(event.data.urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const url of event.data.urls) {
      try {
        const request = new Request(url, { credentials: "same-origin" });
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
      } catch {
        // A partial shell cache is still useful; failed resources can be
        // populated by a later online visit.
      }
    }
    event.source?.postMessage({ type: "EXAM_CACHED" });
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(request, { ignoreVary: true });
      if (cached) return cached;
      if (request.mode === "navigate") {
        const pages = await cache.keys();
        const fallback = pages.find((item) => new URL(item.url).pathname === new URL(request.url).pathname);
        if (fallback) return cache.match(fallback);
      }
      return new Response("Ngoại tuyến và tài nguyên chưa được lưu.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  })());
});
