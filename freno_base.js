/* 27-nov-2026 · FRENO DE LA BASE (candados 1, 2 y 3; Pablo aprobó «como los referentes»).
   Se carga PRIMERO en toda página que habla con Supabase y envuelve window.fetch:
   1) CUPO por pestaña (Stripe/GitHub): balde de 60 pedidos que se rellena a 1,5 por segundo.
      Las LECTURAS que se pasan esperan su turno; las escrituras nunca esperan.
   2) DISYUNTOR (Netflix): 6 lecturas fallidas en 20 s abren la llave; mientras está abierta las lecturas
      reciben al instante un 503 «FRENO» (la pantalla muestra lo último guardado) y la base respira.
      Se abre 15 s, luego 30, 60, hasta 120 s; la primera lectura buena la vuelve a cerrar.
   3) REINTENTOS CON FRENO: como todo pasa por aquí, ningún reintento de ninguna pantalla puede superar
      el cupo ni golpear la base con la llave abierta (el bucle del 27-nov habría quedado en ~6 pedidos).
   Las escrituras (guardar pagos, pedidos…) NUNCA se bloquean. /auth, /storage y /realtime no se tocan.
   Prueba: tests/regresion_freno_base_27nov.js. REVERSA: localStorage 'freno_base_off' = '1' o quitar el <script>. */
(function (W) {
  if (!W || !W.fetch || W.__frenoBase) return;
  var apagado = false; try { apagado = W.localStorage && W.localStorage.getItem('freno_base_off') === '1'; } catch (_) {}
  var CFG = { cap: 60, porSeg: 1.5, fallos: 6, ventanaMs: 20000, abrirMs: 15000, abrirMaxMs: 120000, enVuelo: 8 };
  var reloj = function () { return Date.now(); };
  var dormir = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var LECT_RPC = /\/rpc\/(viaje_versiones|viaje_pago_oficial|datos_version|mi_sesion|pref_get|salida_esperar|puerta_[a-z_]*|stock_libro_[a-z_]*|pedidos_(pagina|buscar|huella|contadores|pendiente_de|pendientes|duplicados|cambios_desde|colores_snapshot)|clientes_buscar|dashboard_[a-z_]*|comisiones_trimestre|cola_estado|prendas_no_reconocidas|catalogo_listar|pedido_por_request|margen_fuente|mk_escalamiento_stock|df_resumen|mk_propuestas_medir|prod_en_camino|prod_en_camino_detalle|prod_llego_stock|prod_lead_dias|[a-z_]*_(listar|calc|leer|resumen))(\?|$)/;
  var FALLA = { 0: 1, 408: 1, 500: 1, 502: 1, 503: 1, 504: 1, 520: 1, 521: 1, 522: 1, 523: 1, 524: 1, 544: 1 };
  var S = { tokens: CFG.cap, tUlt: reloj(), fallos: [], abiertaHasta: 0, abrirMs: CFG.abrirMs, enVuelo: 0,
            frenadas: 0, esperas: 0, aperturas: 0, apagado: apagado };
  var orig = W.fetch.bind(W), COLA = [];

  function urlDe(input) { try { return typeof input === 'string' ? input : (input && input.url) || String(input); } catch (_) { return ''; } }
  function esBase(u) { return /\.supabase\.co\/(rest|functions)\/v1\//.test(u); }
  function esLectura(u, init, input) {
    var m = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (m === 'GET' || m === 'HEAD') return true;
    return m === 'POST' && LECT_RPC.test(u.split('#')[0]);
  }
  function rellenar() { var t = reloj(); S.tokens = Math.min(CFG.cap, S.tokens + (t - S.tUlt) / 1000 * CFG.porSeg); S.tUlt = t; }
  function abierta() { return reloj() < S.abiertaHasta; }
  function anotarFallo() {
    var t = reloj(); S.fallos = S.fallos.filter(function (x) { return t - x < CFG.ventanaMs; }); S.fallos.push(t);
    if (S.fallos.length >= CFG.fallos || S.abiertaHasta > 0) {   // abiertaHasta > 0 = venía de estar abierta (media apertura)
      S.abiertaHasta = t + S.abrirMs; S.abrirMs = Math.min(CFG.abrirMaxMs, S.abrirMs * 2); S.fallos = []; S.aperturas++;
      aviso(true);
    }
  }
  function anotarBien() { if (S.abiertaHasta || S.fallos.length) { S.abiertaHasta = 0; S.abrirMs = CFG.abrirMs; S.fallos = []; aviso(false); } }
  function respuestaFreno() {
    S.frenadas++;
    return new Response(JSON.stringify({ message: 'FRENO_BASE: la base está en pausa unos segundos', code: 'FRENO' }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'X-Freno': '1' } });
  }
  function aviso(on) {
    try {
      if (W !== W.top || !W.document || !W.document.body) return;
      var d = W.document, el = d.getElementById('freno-base-aviso');
      if (!on) { if (el) el.remove(); return; }
      if (el) return;
      el = d.createElement('div'); el.id = 'freno-base-aviso';
      el.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;background:#1f1f1f;color:#fff;' +
        'border:1px solid #FFCC00;border-radius:8px;padding:8px 12px;font:500 12px var(--ui-f,Manrope,sans-serif);display:flex;gap:12px;align-items:center';
      el.innerHTML = '<span>La base está muy cargada: se muestra lo último guardado y se actualiza sola en segundos.</span>' +
        '<button aria-label="Cerrar" style="background:none;border:0;color:#fff;cursor:pointer;font:600 14px var(--ui-f,Manrope,sans-serif)">✕</button>';
      el.querySelector('button').onclick = function () { el.remove(); };
      d.body.appendChild(el);
    } catch (_) {}
  }

  async function frenoFetch(input, init) {
    var u = urlDe(input);
    if (S.apagado || !esBase(u)) return orig(input, init);
    var lect = esLectura(u, init, input);
    if (lect) {
      if (abierta()) return respuestaFreno();
      rellenar();
      var espero = false;
      while (S.tokens < 1 || S.enVuelo >= CFG.enVuelo) {
        if (!espero) { espero = true; S.esperas++; }
        if (S.tokens < 1) await dormir(Math.ceil((1 - S.tokens) / CFG.porSeg * 1000));
        else await new Promise(function (res) { COLA.push(res); });   // sale apenas otra termina (sin sondeo)
        rellenar();
        if (abierta()) return respuestaFreno();
      }
      S.tokens -= 1;
    } else { rellenar(); S.tokens = Math.max(0, S.tokens - 1); }   // la escritura gasta cupo pero no espera
    S.enVuelo++;
    try {
      var r = await orig(input, init);
      if (lect) { if (FALLA[r.status]) anotarFallo(); else anotarBien(); }
      return r;
    } catch (e) {
      if (lect && !(e && e.name === 'AbortError')) anotarFallo();
      throw e;
    } finally { S.enVuelo--; var sig = COLA.shift(); if (sig) sig(); }
  }

  W.fetch = frenoFetch;
  W.__frenoBase = { S: S, CFG: CFG, _probar: function (f) { if (f.reloj) reloj = f.reloj; if (f.dormir) dormir = f.dormir; if (f.cfg) Object.assign(CFG, f.cfg); if ('tokens' in f) S.tokens = f.tokens; S.tUlt = reloj(); } };
})(typeof window !== 'undefined' ? window : null);
