// Copyright 2020-2024, GUILLEUS Hugues <ghugues@netc.fr>

((
  CACHE_VERSION,
  { addEventListener, caches } = self,
  currentCache,
  initCurrentCache = () =>
    currentCache
      ? Promise.resolve(currentCache)
      : caches.open(CACHE_VERSION).then((_cache) => (currentCache = _cache)),
) => {
  addEventListener("install", (event) =>
    event.waitUntil(
      initCurrentCache()
        .then((_) =>
          currentCache.addAll(
            [
              ".",
              "audio/1.mp3",
              "audio/2.mp3",
              "favicon.png",
              "index.html",
              "index.js",
              "manifest.webmanifest",
              "pwa.js",
              "style.css",
            ].map((url) => new Request(url, { cache: "reload" })),
          )
        )
        .then(skipWaiting),
    ));

  addEventListener(
    "activate",
    (event) =>
      clients.claim() |
      caches
        .keys()
        .then((cacheKeysArray) =>
          cacheKeysArray.forEach(
            (cacheKey) => cacheKey != CACHE_VERSION && caches.delete(cacheKey),
          )
        ),
  );

  addEventListener("fetch", (event) =>
    event.respondWith(
      initCurrentCache()
        .then((_) => currentCache.match(event.request))
        .then(
          (cachedResponse) =>
            cachedResponse ||
            fetch(event.request).then(
              (fetchedResponse) =>
                [
                  fetchedResponse.ok &&
                  currentCache.put(event.request, fetchedResponse.clone()),
                  fetchedResponse,
                ][1],
            ),
        )
        .catch((_) => {}),
    ));
})("v2");
