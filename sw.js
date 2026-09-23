const CACHE = "kaoyan-math-m1-v12";
const ASSETS = ["/", "/index.html", "/styles.css", "/app.js", "/core.js", "/data/questions.json", "/data/curriculum.json", "/data/notes.json", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
