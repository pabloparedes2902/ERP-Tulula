/* 30-set-2026 · FECHAS PERSONALIZADAS RAPIDAS (Marketing y Ventas)
   n8n precalcula cada DIA por separado y lo deja en public.espejo_cache con la
   clave 'mk:dia:<endpoint>:<AAAA-MM-DD>' (formato compacto, ver el nodo
   Precalcular). Cuando se pide un rango que no esta precalculado, aca se leen
   los dias del rango en UNA sola consulta a Supabase y se suman en el
   navegador, rehaciendo los calculos (ROAS, CTR, CPM...) con las MISMAS
   formulas que n8n (nodos "Salida" y "Pegar compras reales" de marketing2).
   Si falta un dia o esta viejo, devuelve null y la pantalla va a n8n como antes.
   Probado 30-set contra n8n (10-14 set): Marketing identico (totales y filas); ventas identico;
   sesiones web y 'personas' difieren ~1% (una sesion que cruza la medianoche cuenta en los dos dias). */
(function (raiz) {
  'use strict';
  var SB_URL = 'https://vlilvrxfppppzwyaeviu.supabase.co';
  var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsaWx2cnhmcHBwcHp3eWFldml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDIwMTMsImV4cCI6MjEwMDIxODAxM30.Bmo4CNDDbSF7Vp9JpDm7ceKUlsKKdufKcKFDIGHS4Hs';
  var MAX_DIAS = 70;
  var HOY_MAX_MS = 20 * 60 * 1000, PASADO_MAX_MS = 30 * 3600 * 1000;
  var B = ['gasto','impresiones','alcance','clics','link_clicks','v3s','thruplays','p100','conv_meta',
           'conversaciones','pedidos','pagados','ingreso','costo','frias','tibias','calientes'];

  function iso(d) { return d.toISOString().slice(0, 10); }
  function sumarDias(f, n) { var t = new Date(f + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return iso(t); }
  function listaDias(d, h) {
    var out = [], x = d, g = 0;
    while (x <= h && g++ < 400) { out.push(x); x = sumarDias(x, 1); }
    return out;
  }
  function hoyLima() { return iso(new Date(Date.now() - 5 * 3600 * 1000)); }
  function fLima(t) { return new Date((Number(t) - 5 * 3600) * 1000).toISOString().slice(0, 10); }
  function esFecha(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')); }

  /* ── que endpoint y que dias pide la URL ── */
  function entender(url) {
    var i = url.indexOf('/webhook/'); if (i < 0) return null;
    var resto = url.slice(i + 9), ep = resto.split('?')[0], q = {};
    (resto.split('?')[1] || '').split('&').forEach(function (p) {
      var kv = p.split('='); if (kv[0]) q[kv[0]] = decodeURIComponent(kv[1] || '');
    });
    var d = q.desde, h = q.hasta;
    if (ep === 'embudo-periodo' && /^\d{9,11}$/.test(d || '') && /^\d{9,11}$/.test(h || '')) {
      /* Ventas manda segundos: solo sirve si son dias completos de Lima */
      if ((Number(d) - 5 * 3600) % 86400 !== 0 || (Number(h) + 1 - 5 * 3600) % 86400 !== 0) return null;
      d = fLima(d); h = fLima(h);
    } else if (ep === 'embudo-web-rango') {
      var a = Date.parse(d), b = Date.parse(h);
      if (isNaN(a) || isNaN(b)) return null;
      if ((a / 1000 - 5 * 3600) % 86400 !== 0 || Math.round(b / 1000 + 1 - 5 * 3600) % 86400 !== 0) return null;
      d = fLima(a / 1000); h = fLima(Math.round(b / 1000));
    }
    if (['marketing2','ventas-periodo','embudo-periodo','embudo-web-anuncio','embudo-web-rango'].indexOf(ep) < 0) return null;
    if (!esFecha(d) || !esFecha(h) || d > h) return null;
    var act = listaDias(d, h);
    if (!act.length || act.length > MAX_DIAS) return null;
    var prev = [];
    if (ep === 'marketing2') { prev = listaDias(sumarDias(d, -act.length), sumarDias(d, -1)); }
    return { ep: ep, desde: d, hasta: h, act: act, prev: prev };
  }

  function token() {
    try {
      var t = JSON.parse(localStorage.getItem('erp_sb_sess') || 'null');
      return (t && t.access_token && Date.now() < (t.expires_at || 0)) ? t.access_token : null;
    } catch (e) { return null; }
  }

  /* ── una sola lectura a Supabase para todos los dias ── */
  function leerDias(ep, dias, extra) {
    var tok = token(); if (!tok) return Promise.resolve(null);
    var claves = dias.map(function (x) { return 'mk:dia:' + ep + ':' + x; }).concat(extra || []);
    var filtro = 'in.(' + claves.map(function (k) { return '"' + k + '"'; }).join(',') + ')';
    return fetch(SB_URL + '/rest/v1/espejo_cache?select=clave,datos,generado&clave=' + encodeURIComponent(filtro),
                 { headers: { apikey: SB_ANON, Authorization: 'Bearer ' + tok } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (filas) {
        if (!Array.isArray(filas)) return null;
        var m = {}, hoy = hoyLima(), ahora = Date.now();
        filas.forEach(function (f) { m[f.clave] = f; });
        for (var i = 0; i < dias.length; i++) {
          var f = m['mk:dia:' + ep + ':' + dias[i]];
          if (!f || f.datos == null) return null;
          var edad = ahora - Date.parse(f.generado);
          if (edad > (dias[i] >= hoy ? HOY_MAX_MS : PASADO_MAX_MS)) return null;
        }
        return m;
      })
      .catch(function () { return null; });
  }

  /* ── formulas: copia exacta de n8n (Salida + Pegar compras reales) ── */
  function derivar(t, erp) {
    var o = {}; B.forEach(function (k) { o[k] = t[k] || 0; });
    var imp = o.impresiones, conv = o.conversaciones, ped = o.pedidos;
    o.hook_rate  = imp ? 100 * o.v3s / imp : null;
    o.hold_rate  = imp ? 100 * o.thruplays / imp : null;
    o.retencion  = o.v3s ? 100 * o.p100 / o.v3s : null;
    o.ctr        = imp ? 100 * o.link_clicks / imp : null;
    o.ctr_todos  = imp ? 100 * o.clics / imp : null;
    o.cpm        = imp ? 1000 * o.gasto / imp : null;
    o.cpc        = o.link_clicks ? o.gasto / o.link_clicks : null;
    o.costo_conv = conv ? o.gasto / conv : null;
    o.tasa_cierre = conv ? 100 * ped / conv : null;
    o.cac        = ped ? o.gasto / ped : null;
    o.roas       = o.gasto ? o.ingreso / o.gasto : null;
    o.ticket     = ped ? o.ingreso / ped : null;
    if (erp) {   /* "Pegar compras reales": pedidos = pagados y tasa 0 si no hay conversaciones */
      o.pagados = o.pedidos;
      o.roas = o.gasto > 0 ? o.ingreso / o.gasto : null;
      o.cac = o.pedidos > 0 ? o.gasto / o.pedidos : null;
      o.ticket = o.pedidos > 0 ? o.ingreso / o.pedidos : null;
      o.tasa_cierre = o.conversaciones > 0 ? 100 * o.pedidos / o.conversaciones : 0;
    }
    return o;
  }
  function vacio() { var o = {}; B.forEach(function (k) { o[k] = 0; }); return o; }
  function acum(a, nums) { B.forEach(function (k, i) { a[k] += Number(nums[i]) || 0; }); }

  function unirMarketing(p, m) {
    var ads = {}, info = (m['mk:dia:_ads'] && m['mk:dia:_ads'].datos) || {};
    var erp = true;
    function ventana(dias) {
      var filas = {}, tot = vacio(), atrib = 0, eleg = 0, atr = 0;
      dias.forEach(function (x) {
        var d = m['mk:dia:marketing2:' + x].datos;
        if (d.src !== 'ERP') erp = false;
        Object.keys(d.ads || {}).forEach(function (id) { ads[id] = d.ads[id]; });
        Object.keys(d.r || {}).forEach(function (id) { if (!filas[id]) filas[id] = vacio(); acum(filas[id], d.r[id]); });
        acum(tot, d.t || []); atrib += Number((d.t || [])[B.length]) || 0;
        eleg += Number((d.c || [])[0]) || 0; atr += Number((d.c || [])[1]) || 0;
      });
      return { filas: filas, tot: tot, atrib: atrib, cob: { elegibles: eleg, atribuidos: atr, pct: eleg ? 100 * atr / eleg : null } };
    }
    var A = ventana(p.act), P = ventana(p.prev);
    var ids = {}; Object.keys(A.filas).concat(Object.keys(P.filas)).forEach(function (id) { ids[id] = 1; });
    var filas = Object.keys(ids).map(function (id) {
      var a = ads[id] || [], x = info[id] || [];
      return { ad_id: id, anuncio: a[0] || '(sin nombre)', conjunto: a[1] || '', campana: a[2] || '',
               thumbnail_url: x[0] || '', permalink: x[1] || '', estado_anuncio: a[3] || '',
               act: derivar(A.filas[id] || vacio(), erp), prev: derivar(P.filas[id] || vacio(), erp) };
    });
    var ta = derivar(A.tot, erp), tp = derivar(P.tot, erp);
    ta.pedidos_atribuidos = A.atrib; tp.pedidos_atribuidos = P.atrib;
    return { cobertura: { act: A.cob, prev: P.cob },
             meta: { desde: p.desde, hasta: p.hasta, prev_desde: p.prev[0], prev_hasta: p.prev[p.prev.length - 1],
                     dias: p.act.length, generado: new Date().toISOString(), por_dias: true },
             total: { act: ta, prev: tp }, filas: filas, compras_fuente: erp ? 'ERP' : 'meta' };
  }

  /* arreglos por clave: suma los numeros, deja el primer texto no vacio */
  function unirFilas(listas, clave) {
    var m = {}, orden = [];
    listas.forEach(function (arr) {
      (arr || []).forEach(function (f) {
        var k = clave(f);
        if (!m[k]) { m[k] = {}; orden.push(k); }
        var o = m[k];
        Object.keys(f).forEach(function (c) {
          var v = f[c];
          if (typeof v === 'number') o[c] = (o[c] || 0) + v;
          else if (o[c] == null || o[c] === '') o[c] = v;
        });
      });
    });
    return orden.map(function (k) { return m[k]; });
  }
  function desEmbudo(d) {   /* embudo-periodo compacto: {K:[campos], r:[[...]]} */
    if (Array.isArray(d)) return d;
    return (d.r || []).map(function (fila) { var o = {}; d.K.forEach(function (k, i) { o[k] = fila[i]; }); return o; });
  }
  function sumarObj(a, b) {
    Object.keys(b || {}).forEach(function (k) {
      var v = b[k];
      if (typeof v === 'number') a[k] = (a[k] || 0) + v;
      else if (v && typeof v === 'object' && !Array.isArray(v)) { a[k] = a[k] || {}; sumarObj(a[k], v); }
    });
    return a;
  }

  function unir(p, m) {
    var datos = p.act.map(function (x) { return m['mk:dia:' + p.ep + ':' + x].datos; });
    if (p.ep === 'marketing2') return unirMarketing(p, m);
    if (p.ep === 'ventas-periodo') return unirFilas(datos, function (f) { return String(f.anuncio) + '|' + !!f.sin_id; });
    if (p.ep === 'embudo-periodo') {
      /* las filas tipo 'texto' (titulo/cuerpo del anuncio) NO son del periodo: vienen una sola vez aparte */
      var tx = (m['mk:dia:_ep_texto'] && m['mk:dia:_ep_texto'].datos) || [];
      return unirFilas(datos.map(desEmbudo), function (f) { return f.tipo + '|' + f.clave + '|' + !!f.sin_id; })
        .concat(Array.isArray(tx) ? tx : []);
    }
    if (p.ep === 'embudo-web-anuncio') {
      return { fuente: 'posthog', desde: p.desde, hasta: p.hasta, generado: new Date().toISOString(), cacheado: true, error: null,
               total: datos.reduce(function (a, d) { return sumarObj(a, d.total); }, {}),
               filas: unirFilas(datos.map(function (d) { return d.filas; }), function (f) { return f.anuncio + '|' + f.campana; }) };
    }
    if (p.ep === 'embudo-web-rango') {
      var disp = unirFilas(datos.map(function (d) { return d.dispositivos; }), function (f) { return f.dispositivo; });
      var dm = {};   /* el "acumulado" de cada dispositivo es objeto: se suma aparte */
      datos.forEach(function (d) { (d.dispositivos || []).forEach(function (x) { dm[x.dispositivo] = sumarObj(dm[x.dispositivo] || {}, x.acumulado); }); });
      disp.forEach(function (x) { x.acumulado = dm[x.dispositivo]; });
      return { acumulado: datos.reduce(function (a, d) { return sumarObj(a, d.acumulado); }, {}), dispositivos: disp };
    }
    return null;
  }

  /* API: devuelve la respuesta armada con los dias, o null (=> ir a n8n) */
  function leer(url) {
    var p = entender(url); if (!p) return Promise.resolve(null);
    var extra = p.ep === 'marketing2' ? ['mk:dia:_ads'] : (p.ep === 'embudo-periodo' ? ['mk:dia:_ep_texto'] : []);
    return leerDias(p.ep, p.prev.concat(p.act), extra).then(function (m) {
      if (!m) return null;
      try { return unir(p, m); } catch (e) { return null; }
    });
  }

  raiz.MKDIAS = { leer: leer, entender: entender, unir: unir, derivar: derivar, B: B };
})(typeof window !== 'undefined' ? window : globalThis);
