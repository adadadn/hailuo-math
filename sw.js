/* 海螺游学 Service Worker
 * 策略：
 *  - 页面导航：网络优先（保证拿到新版本），失败回退缓存首页 → 离线也能打开
 *  - 脚本 / 样式 / JSON：stale-while-revalidate（先用缓存秒开，后台静默更新）
 *  - 图片 / 图标：缓存优先
 *  - 新版本不自动接管：由页面提示「有新版本」后 postMessage(SKIP_WAITING) 再刷新
 */
const VERSION = "v21";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "core.js",
  "manifest.webmanifest",
  "icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon-180.png",
];

self.addEventListener("install", (event) => {
  // 只预缓存，不立即接管页面：等页面提示「有新版本」后由用户决定何时刷新
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

const cacheable = (request) => {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return url.origin === self.location.origin;
};

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const shell = await cache.match("index.html");
    if (shell) return shell;
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) {
    // 不阻塞返回，后台完成后台更新
    network.catch(() => {});
    return cached;
  }
  const fresh = await network;
  if (fresh) return fresh;
  throw new Error("offline");
}

async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!cacheable(request)) return;
  if (request.mode === "navigate") { event.respondWith(networkFirst(request)); return; }
  const url = new URL(request.url);
  if (/\.(?:js|css|json|webmanifest)$/.test(url.pathname) || url.pathname.endsWith("/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
