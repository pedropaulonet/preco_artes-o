const CACHE_NAME = 'preco-artesao-static-v1';
const APP_FILES = [
  './', './index.html', './styles.css', './manifest.webmanifest', './assets/icon.svg',
  './src/app.js', './src/ui.js', './src/pricing.js', './src/model.js', './src/db.js',
];
const urls = APP_FILES.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urls)));
  // New versions wait until existing tabs close, keeping module versions together.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('preco-artesao-static-') && key !== CACHE_NAME)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  url.search = '';
  if (!urls.includes(url.href)) return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = await cache.match(url.href);
    return cached || fetch(request);
  }));
});
