// EnvBoard Service Worker（手写轻量版，不依赖 vite-plugin-pwa）
// 策略：app shell precache + runtime cache（cache-first with network fallback + offline fallback to index.html）
const CACHE_NAME = 'envboard-v2.0.0'
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './env.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  )
  // 立即激活，无需等旧 SW 关闭
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // 清理旧版本缓存
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// 网络优先（HTML），缓存优先（其他资源），离线降级
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // HTML 文档：网络优先，失败回退缓存，离线回退 index.html
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          return response
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('./index.html'))),
    )
    return
  }

  // 其他资源：缓存优先
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        }
        return response
      }).catch(() => cached)
    }),
  )
})