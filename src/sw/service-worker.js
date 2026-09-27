/* ClickHub service worker (classic script). scripts/build/pwa.mjs fills in the placeholders
 * at build time and writes the result to dist/sw.js. Never cached itself: the browser
 * re-checks sw.js on navigation and a changed file triggers the update flow. */
const APP_VERSION = '__APP_VERSION__';
const OCR_VERSION = '__OCR_VERSION__';
const PRECACHE = /*__PRECACHE__*/[];
const SCOPE = new URL(self.registration ? self.registration.scope : self.location.href.replace(/[^/]*$/, '')).pathname;
const APP_CACHE = `clickhub-app-${APP_VERSION}`;
const OCR_CACHE = `clickhub-ocr-${OCR_VERSION}`;
const SHELL = `${SCOPE}index.html`;
const precached = new Set(PRECACHE);

// Decide how a request is handled: 'shell' | 'precache' | 'ocr' | null (let the browser handle it).
function route(request, origin = self.location.origin) {
 if (request.method !== 'GET') return null;
 const url = new URL(request.url);
 if (url.origin !== origin || !url.pathname.startsWith(SCOPE)) return null;
 if (request.mode === 'navigate' && (url.pathname === SCOPE || url.pathname === SHELL)) return 'shell';
 if (url.pathname.startsWith(`${SCOPE}ocr/`)) return 'ocr';
 if (precached.has(url.pathname)) return 'precache';
 return null;
}
const cacheable = response => response && response.ok && response.status === 200 && response.type === 'basic';
async function fromCache(cacheName, key, request) {
 const hit = await caches.open(cacheName).then(cache => cache.match(key, { ignoreSearch: true }));
 return hit || fetch(request);
}
async function ocrAsset(request) {
 const cache = await caches.open(OCR_CACHE), key = new URL(request.url).pathname;
 const hit = await cache.match(key);
 if (hit) return hit;
 const response = await fetch(request);
 if (cacheable(response)) await cache.put(key, response.clone());
 return response;
}
self.addEventListener('install', event => {
 event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(PRECACHE.map(path => new Request(path, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  const keep = new Set([APP_CACHE, OCR_CACHE]);
  for (const name of await caches.keys()) if (name.startsWith('clickhub-') && !keep.has(name)) await caches.delete(name);
  await self.clients.claim();
 })());
});
self.addEventListener('message', event => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
 const kind = route(event.request);
 if (kind === 'shell') event.respondWith(fromCache(APP_CACHE, SHELL, event.request));
 else if (kind === 'precache') event.respondWith(fromCache(APP_CACHE, new URL(event.request.url).pathname, event.request));
 else if (kind === 'ocr') event.respondWith(ocrAsset(event.request));
});
self.__clickhub = { route, APP_CACHE, OCR_CACHE, PRECACHE, SCOPE };
