// 레벨메이트 서비스 워커
// 목적: (1) 설치 가능(PWA) 조건 충족, (2) 오프라인일 때 최소한의 안내 화면.
// PC방 PC는 재부팅 시 복원되는 경우가 많아 캐시를 오래 들고 있지 않는다.

// 이름을 바꾸면 예전에 담아둔 것은 activate 에서 전부 지워진다.
const CACHE = 'hanpan-v2'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL])),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  // 페이지 이동은 네트워크 우선, 실패하면 오프라인 안내로 떨어진다.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
      ),
    )
  }
})
