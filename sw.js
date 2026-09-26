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
const SW_VERSION = 'tulula-20260926-061020';
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
  //    14-set-2026 — CAMBIADO A NETWORK-FIRST. Medido en vivo: tras publicar el
  //    arreglo del PagoId, el ERP siguio sirviendo el index.html VIEJO aun despues
  //    de dos recargas. La pantalla mostraba 177 pagos pendientes y la base 154
  //    (los 23 de la regresion) y el ERP se recargaba solo cada 3 minutos buscando
  //    cuadrarlos. Con stale-while-revalidate el HTML viejo siempre gana la primera
  //    carga, y si la revalidacion de fondo no llega a tiempo, tambien la segunda.
  //    El ERP es una herramienta de trabajo: importa MUCHO mas que este al dia que
  //    que abra 200 ms antes. Misma decision que ya se habia tomado para flujo.html
  //    el 27-ago por exactamente el mismo motivo. El cache queda de red de seguridad
  //    para cuando no hay internet.
  const isHtml = req.mode === 'navigate' || req.destination === 'document';
  if (isHtml) {
    event.respondWith(networkFirst(req, CACHE_STATIC));
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
// 16-set-2026 — el aviso "Hay una version nueva del ERP" (banner con Recargar/
// Despues, ya construido en index.html) dependia de htmlSWRNotify(), pero el
// 14-set el HTML paso a networkFirst y htmlSWRNotify dejo de llamarse: el aviso
// quedo desconectado. Sin el, una pestaña que queda abierta todo el dia se
// queda en la version vieja para siempre y nadie se entera (se vio en vivo:
// pedido de Mirella Paredes con el ERP estampado "v 16/09 10:23" horas despues
// de publicado el arreglo). Esto reconecta el aviso DENTRO de networkFirst, sin
// tocar la estrategia (la red sigue mandando, el cache sigue siendo solo la
// red de seguridad sin internet) y sin recargar sola — eso ya lo decide la
// persona con el boton Recargar.
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const esHtml = req.mode === 'navigate' || req.destination === 'document';
  try {
    /* 25-set-2026 — sin esto, fetch(req) puede resolverse contra el cache HTTP
       del propio navegador (GitHub Pages manda max-age=600), y "network-first"
       en realidad seguia sirviendo una version de hasta 10 min de antiguedad.
       Se vio en vivo: Marketing publicado y sin aparecer tras recargar. */
    const res = await fetch(req.url, { cache: 'no-store', credentials: 'same-origin' });
    if (res && res.ok) {
      if (esHtml) {
        const hit = await cache.match(req);
        if (hit) {
          const viejo = hit.headers.get('etag') || hit.headers.get('last-modified') || '';
          const nuevo = res.headers.get('etag') || res.headers.get('last-modified') || '';
          if (viejo && nuevo && viejo !== nuevo) {
            const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
            clients.forEach(c => c.postMessage({ type: 'HTML_UPDATED' }));
          }
        }
      }
      cache.put(req, res.clone()).catch(()=>{});
    }
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
