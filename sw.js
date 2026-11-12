// Ризк: keeps the app working without internet
const V = "rizq-v2";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const LIBS = ["app", "auth", "firestore"].map(m => "https://www.gstatic.com/firebasejs/10.12.2/firebase-" + m + "-compat.js");
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE).then(() => Promise.all(LIBS.map(u => fetch(u, { mode: "cors" }).then(r => r.ok && c.put(u, r)).catch(() => {}))))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (r.mode === "navigate") { // fresh page when online, saved copy when offline
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put("index.html", cp)); return res; })
      .catch(() => caches.match("index.html")));
    return;
  }
  const ext = /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|www\.gstatic\.com/.test(u.host);
  if (u.origin === location.origin || ext) {
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
