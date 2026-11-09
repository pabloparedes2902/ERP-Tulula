// ══════════════════════════════════════════════════════════════
// Tulula ERP — Service Worker
//
// Estrategias:
//   • index.html → network-first CON PREGUNTA CORTA (VR_CARGA02_2NOV, 2-nov-2026): si ya hay copia guardada, se le
//     pregunta al servidor «¿cambió?» con su huella (ETag). Si no cambió responde 304 (0 KB) y se abre la copia guardada;
//     si cambió llega la nueva entera, como siempre. La red sigue mandando: nunca se abre una versión vieja.
//   • Libs CDN (xlsx, lz-string, Google Fonts) → cache-first (no cambian).
//   • API Apps Script (script.google.com/macros) → bypass total (siempre fresh, sin cache).
//
// Versionado: subí SW_VERSION cuando cambies estrategias para forzar invalidación.
// ══════════════════════════════════════════════════════════════
const SW_VERSION = 'tulula-20261109-065903';
const CACHE_STATIC  = 'tulula-static-' + SW_VERSION;
const CACHE_RUNTIME = 'tulula-runtime-' + SW_VERSION;
// VR_CARGA02_2NOV · interruptor: false = vuelve el network-first de siempre (baja el index.html entero en cada apertura).
const VR_CARGA02 = true;

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
      .then(cache => (VR_CARGA02 ? precargar(cache) : cache.addAll(PRECACHE_URLS)).catch(err => {
        // No abortamos la instalación si una sola lib falla — seguimos con lo que sí entró.
        console.warn('[SW] precache parcial:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

// VR_CARGA02_2NOV · PRECARGA SIN BAJAR TRES VECES LO MISMO. Antes, la primera apertura (y cada publicación) bajaba
// index.html 3 veces (la página + './' + './index.html', ~1 MB cada una) y volvía a bajar las librerías del CDN.
// Ahora: lo que ya está guardado en el caché de la versión anterior se copia (el network-first con pregunta corta lo
// corrige solo si quedó viejo: el servidor contesta con la versión nueva); lo que no está, se baja UNA vez.
// Cada pieza por separado: si una falla, las demás igual entran.
async function precargar(cache) {
  const html = ['./', './index.html'];
  let pag = null;
  for (const u of html) { try { pag = await caches.match(u); } catch (_) { pag = null; } if (pag) break; }
  if (!pag) { try { pag = await fetch('./index.html', { cache: 'no-store', credentials: 'same-origin' }); } catch (_) { pag = null; } }
  const tareas = [];
  if (pag && pag.ok) html.forEach(u => tareas.push(cache.put(u, pag.clone())));
  PRECACHE_URLS.filter(u => html.indexOf(u) < 0).forEach(u => tareas.push((async () => {
    const vieja = await caches.match(u).catch(() => null);
    if (vieja) return cache.put(u, vieja);
    return cache.add(u);
  })()));
  const r = await Promise.allSettled(tareas);
  if (r.some(x => x.status === 'rejected')) console.warn('[SW] precache parcial');
}

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

  // 4.5. VR_CARGA02_2NOV · el propio index.html pedido por la página (la revisión de versión a los 3 s, `fetch(...index.html)`)
  //      → misma regla que la navegación: la red manda, con pregunta corta. Antes caía en el paso 5 (stale-while-revalidate
  //      en otro caché): bajaba ~1 MB más en cada apertura y podía contestar con una copia vieja.
  if (VR_CARGA02 && url.origin === self.location.origin && esPaginaErp(url)) {
    event.respondWith(networkFirst(req, CACHE_STATIC));
    return;
  }

  // 5. Otros assets same-origin → stale-while-revalidate en runtime
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req, CACHE_RUNTIME));
    return;
  }
  // Resto: ir a red directo.
});

// VR_CARGA02_2NOV · ¿es el index.html del ERP (la carpeta del Service Worker o su index.html)?
function esPaginaErp(url) {
  try { const dir = new URL('./', self.location.href).pathname; return url.pathname === dir || url.pathname === dir + 'index.html'; }
  catch (_) { return false; }
}

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
    // VR_CARGA02_2NOV · PREGUNTA CORTA. Si hay copia guardada con huella (ETag / Last-Modified), se pide con
    // If-None-Match: el servidor contesta 304 (0 KB, ~1 viaje) si no cambió, y se usa la copia; si cambió, manda la
    // nueva entera y sigue todo como antes (aviso a las otras pestañas incluido). Sin huella → pedido entero, igual que antes.
    let previo = null, h = null;
    if (typeof VR_CARGA02 === 'undefined' || VR_CARGA02) {
      try { previo = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true })) || null; } catch (_) { previo = null; }
      const et = previo && previo.headers && previo.headers.get('etag');
      const lm = previo && previo.headers && previo.headers.get('last-modified');
      if (et) h = { 'If-None-Match': et }; else if (lm) h = { 'If-Modified-Since': lm };
    }
    const res = await fetch(req.url, h ? { cache: 'no-store', credentials: 'same-origin', headers: h }
                                       : { cache: 'no-store', credentials: 'same-origin' });
    if (h && res && res.status === 304 && previo) return previo;
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
