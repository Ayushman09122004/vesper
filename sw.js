/* Vesper for iPhone — keeps the app working offline and opening instantly. The show list refreshes whenever you're online. */
var V = "vesper-v11";
var SHELL = ["./", "index.html", "m.css", "m.js", "shim.js", "shape.js", "taste.js", "config.js", "manifest.webmanifest",
  "fonts/inter-latin.woff2", "icons/icon-180.png", "logos/netflix.png", "logos/amazon.png", "logos/hotstar.png", "logos/apple.png", "logos/crunchyroll.png"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V && k !== "vesper-img"; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // posters: keep the ones you've seen, so rows appear instantly next time
  if (u.hostname === "images.justwatch.com") {
    e.respondWith(caches.open("vesper-img").then(function (c) { return c.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (r) { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }); }); }));
    return;
  }
  if (u.origin !== location.origin) return;
  // everything of ours: fresh from the network when possible, the saved copy when offline
  e.respondWith(fetch(e.request, { cache: "no-store" }).then(function (r) { if (r.ok) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(e.request, cp); }); } return r; })
    .catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});
