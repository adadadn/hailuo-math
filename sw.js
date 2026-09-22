const CACHE = "kaoyan-math-m1-v1";
const ASSETS = ["/", "/index.html", "/styles.css", "/app.js", "/data/questions.json", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
