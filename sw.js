// ══════════════════════════════════════════════════════════════
// Tulula ERP — Service Worker
//
// Estrategias:
//   • index.html → stale-while-revalidate (siempre se ve algo, se refresca en bg).
//   • Libs CDN (xlsx, lz-string, Google Fonts) → cache-first (no cambian).
//   • API Apps Script (script.google.com/macros) → bypass total (siempre fresh, sin cache).
//
// Versionado: subí SW_VERSION cuando cambies estrategias para forzar invalidación.
// ══════════════════════════════════════════════════════════════
const SW_VERSION = 'tulula-20260904-drag3';
const CACHE_STATIC  = 'tulula-static-' + SW_VERSION;
const CACHE_RUNTIME = 'tulula-runtime-' + SW_VERSION;

// Recursos pre-cacheados al instalar (carga inmediata desde la 2ª visita).
const PRECACHE_URLS = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js',
];

// Hosts cuyas respuestas NUNCA se cachean (datos en vivo).
const NEVER_CACHE_HOSTS = [
  'script.google.com',
  'script.googleusercontent.com',
];

// ── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(err => {
        // No abortamos la instalación si una sola lib falla — seguimos con lo que sí entró.
        console.warn('[SW] precache parcial:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(k => k !== CACHE_STATIC && k !== CACHE_RUNTIME)
        .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // 1. Bypass: API Apps Script — nunca cachear, datos en vivo.
  if (NEVER_CACHE_HOSTS.some(h => url.hostname.endsWith(h))) return;

  // 2. Bypass: chrome-extension, devtools, otros esquemas raros
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 2.5. EL PANEL (flujo.html) → NETWORK-FIRST. 27-ago-2026.
  //    flujo.html es una herramienta de trabajo, no una web que tenga que abrir
  //    offline: importa mucho más que esté al día que que abra 200ms antes.
  //    Con stale-while-revalidate pasaba esto: publicabas, recargabas, y seguías
  //    viendo la versión vieja sin saberlo — la nueva recién aparecía a la
  //    SEGUNDA recarga. Ahora manda la red; el caché queda solo de red de
  //    seguridad para cuando no hay internet.
  if (url.origin === self.location.origin && /\/flujo\.html$/.test(url.pathname)) {
    event.respondWith(networkFirst(req, CACHE_RUNTIME));
    return;
  }

  // 3. HTML (navegación) → PERF Fase 2a: STALE-WHILE-REVALIDATE + AVISO DE VERSIÓN.
  //    Abre INSTANTÁNEO desde caché y descarga la versión nueva en segundo plano.
  //    Si la de la red es distinta (ETag/Last-Modified), avisa a la página para que
  //    muestre el banner "Hay versión nueva — Recargar". Combina apertura instantánea
  //    con "nunca quedarse en versión vieja sin saberlo".
  const isHtml = req.mode === 'navigate' || req.destination === 'document';
  if (isHtml) {
    event.respondWith(htmlSWRNotify(req, CACHE_STATIC));
    return;
  }

  // 4. CDN libs / fuentes → cache-first (largo plazo)
  if (url.hostname.endsWith('cdnjs.cloudflare.com') ||
      url.hostname.endsWith('jsdelivr.net') ||
      url.hostname.endsWith('googleapis.com') ||
      url.hostname.endsWith('gstatic.com')) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }

  // 5. Otros assets same-origin → stale-while-revalidate en runtime
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req, CACHE_RUNTIME));
    return;
  }
  // Resto: ir a red directo.
});

// ── ESTRATEGIAS ───────────────────────────────────────────────
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return hit || Response.error();
  }
}

// Network-first: la red manda; si falla (sin internet), cae al caché.
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone()).catch(()=>{});
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    return hit || Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetchPromise = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone()).catch(()=>{});
    return res;
  }).catch(() => null);
  return hit || (await fetchPromise) || Response.error();
}

// PERF Fase 2a — HTML: stale-while-revalidate con aviso de versión nueva.
// 1) Si hay caché: responde YA con el caché (apertura instantánea) y en segundo
//    plano baja la versión de la red. Si difiere (ETag o Last-Modified), actualiza
//    el caché y manda {type:'HTML_UPDATED'} a todas las pestañas abiertas.
// 2) Si no hay caché (primera visita): va a la red como siempre.
async function htmlSWRNotify(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  // FIX v7 — la revalidación en segundo plano DEBE saltarse el caché HTTP del navegador
  // (GitHub Pages manda max-age=600: sin esto, tras publicar, el "fresh" seguía siendo
  // la versión VIEJA por hasta 10 min y el aviso de versión nueva nunca disparaba).
  const fetchAndCompare = fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }).then(async res => {
    if (!res || !res.ok) return res;
    if (hit) {
      const oldTag = hit.headers.get('etag') || hit.headers.get('last-modified') || '';
      const newTag = res.headers.get('etag') || res.headers.get('last-modified') || '';
      const changed = (oldTag && newTag) ? (oldTag !== newTag) : false;
      await cache.put(req, res.clone()).catch(()=>{});
      if (changed) {
        const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        clients.forEach(c => c.postMessage({ type: 'HTML_UPDATED' }));
      }
    } else {
      await cache.put(req, res.clone()).catch(()=>{});
    }
    return res;
  }).catch(() => null);
  return hit || (await fetchAndCompare) || Response.error();
}

// Permite que el cliente fuerce un skipWaiting (cuando avisa "hay versión nueva")
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
