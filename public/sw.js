const CACHE_NAME = 'yun-mandarin-lab-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  // 不缓存 API 请求，避免 TTS 或课程内容更新后出问题
  if (request.url.includes('/api/')) return;

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
