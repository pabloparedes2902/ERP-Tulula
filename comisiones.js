/* ══════════════════════════════════════════════════════════════════════
   TULULA ERP — MÓDULO COMISIONES
   Archivo: comisiones.js   ·   Parte 1: motor + vista principal
   ──────────────────────────────────────────────────────────────────────
   Se carga bajo demanda (lazy) al entrar al módulo por primera vez.

   REGLA DE ORO DE ESTE ARCHIVO: cero datos reales adentro.
   El repo es público. Nombres, sueldos, correos y montos llegan SIEMPRE
   del backend con token. Acá solo hay presentación.

   Usa las clases del ERP: .card .ct .mts .mt .ml .btn .bp .bg .bs .badge
   Usa las variables del ERP: --bg2 --bg3 --bd --tx --mu --ac --gn --am --rd
   → hereda modo claro/oscuro automáticamente.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
'use strict';

/* ── Estado del módulo ─────────────────────────────────────────────── */
var COM = {
  data: null,      // respuesta de op='admin'
  year: null,
  q: null,
  vista: 'home',
  cargando: false,
  refrescando: false,
  traidoEn: null,  // timestamp de los datos que se están mostrando
  ms: null,        // cuánto tardó la última consulta al servidor
};

/* ── Caché de sesión ────────────────────────────────────────────────
   Guarda la respuesta en sessionStorage para que volver al módulo sea
   instantáneo. Se borra al cerrar la pestaña, así que nunca queda data
   salarial en el disco del navegador.
   Estrategia: pintar lo guardado al instante y refrescar por detrás.  */

function claveCache(year, q) { return 'com_' + year + '_q' + q; }

function cacheLeer(year, q) {
  try {
    var raw = sessionStorage.getItem(claveCache(year, q));
    if (!raw) return null;
    var o = JSON.parse(raw);
    return (o && o.data) ? o : null;
  } catch (e) { return null; }
}

function cacheGuardar(year, q, data) {
  try {
    sessionStorage.setItem(claveCache(year, q),
      JSON.stringify({ data: data, t: Date.now() }));
  } catch (e) {}   // cuota llena o modo privado: seguimos sin caché
}

function cacheBorrar() {
  try {
    Object.keys(sessionStorage)
      .filter(function (k) { return k.indexOf('com_') === 0; })
      .forEach(function (k) { sessionStorage.removeItem(k); });
  } catch (e) {}
}

function haceCuanto(ts) {
  if (!ts) return '';
  var s = Math.round((Date.now() - ts) / 1000);
  if (s < 60)   return 'hace ' + s + 's';
  if (s < 3600) return 'hace ' + Math.round(s / 60) + ' min';
  return 'hace ' + Math.round(s / 3600) + ' h';
}

/* ── Puente con el backend ─────────────────────────────────────────── */
// apiSend manda el body como JSON y agrega _reqId (anti-duplicado).
// El backend lo recibe en comisionesAdmin(body).
function comApi(op, args) {
  return apiSend('comisiones.admin', { op: op, args: args || {} });
}

/* ── Formato ───────────────────────────────────────────────────────── */
function fmt(n)  { return 'S/' + Math.round(Number(n) || 0).toLocaleString('es-PE'); }
function f2(n)   { return 'S/' + (Number(n) || 0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}); }
function p2(n)   { return (Number(n) || 0).toFixed(2) + '%'; }
function esc(s)  { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

var MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Colores por nivel — mismas variables que el resto del ERP
var NIVEL_COLOR  = ['var(--rd)', 'var(--am)', 'var(--gn)', 'var(--ac)'];
var NIVEL_NOMBRE = ['No llega al mínimo', 'Llega al mínimo', 'Nivel intermedio', 'Nivel alto'];

function etiquetaTrim(q, year) {
  var T = [['Ene','Mar'], ['Abr','Jun'], ['Jul','Sep'], ['Oct','Dic']];
  var t = T[(q || 1) - 1] || T[0];
  return t[0] + '–' + t[1] + ' ' + year;
}


/* ══════════════════════════════════════════════════════════════════════
   MOTOR DE CÁLCULO
   Portado del panel actual. Mismas fórmulas, mismos resultados.
   El backend manda los datos crudos; acá se arma la vista.
   ══════════════════════════════════════════════════════════════════════ */

var TIERS_FALLBACK = [{from:80, rate:1.5}, {from:100, rate:3}, {from:120, rate:4.5}];

/**
 * Bono trimestral por asesora.
 * rows: [{nombre, base, mPct, marginM:[3], factorM:[3], sueldoM:[3]}]
 * cfg:  {xMeta, tiers}
 */
function bonoTrim(rows, cfg) {
  var tiers = (cfg && cfg.tiers && cfg.tiers.length) ? cfg.tiers : TIERS_FALLBACK;
  var x = (cfg && cfg.xMeta) || 12;
  var gate = tiers[0] ? tiers[0].from : 80;

  var out = rows.map(function (r) {
    var fM = (r.factorM && r.factorM.length) ? r.factorM : [1,1,1];
    var mM = (r.marginM && r.marginM.length) ? r.marginM : [0,0,0];
    var sM = (r.sueldoM && r.sueldoM.length) ? r.sueldoM : null;

    // Meta de margen por mes. Si hay sueldo efectivo del mes, manda ese
    // (cubre ingresos a mitad de mes); si no, base × factor de prorrateo.
    var metaM = fM.map(function (f, i) {
      return f > 0 ? (sM ? x * (sM[i] || 0) : x * r.base * f) : 0;
    });
    var marM = mM.map(function (m, i) { return fM[i] > 0 ? (m || 0) : 0; });

    var sumMeta = metaM.reduce(function (s, v) { return s + v; }, 0);
    var sumMar  = marM.reduce(function (s, v) { return s + v; }, 0);
    var cumpl   = sumMeta > 0 ? sumMar / sumMeta * 100 : 0;

    var rate = 0;
    tiers.forEach(function (t) { if (cumpl >= t.from) rate = t.rate; });

    return Object.assign({}, r, {
      metaM: metaM, marM: marM, sumMeta: sumMeta, sumMar: sumMar,
      cumpl: cumpl, rate: rate, bono: 0,
      mesesAct: fM.filter(function (f) { return f > 0; }).length,
    });
  });

  var tMar  = out.reduce(function (s, r) { return s + r.sumMar; }, 0);
  var tMeta = out.reduce(function (s, r) { return s + r.sumMeta; }, 0);
  var teamCumpl = tMeta > 0 ? tMar / tMeta * 100 : 0;
  var teamGate  = teamCumpl >= gate;

  // El bono se activa solo si el EQUIPO pasa el piso Y la asesora pasa el suyo.
  out.forEach(function (r) {
    if (teamGate && r.cumpl >= gate) r.bono = r.rate / 100 * r.sumMar;
  });

  return {
    rows: out, tMar: tMar, tMeta: tMeta,
    teamCumpl: teamCumpl, teamGate: teamGate,
    level: nivelDe(teamCumpl, tiers), gate: gate, tiers: tiers, x: x,
  };
}

function nivelDe(cumpl, tiers) {
  tiers = tiers || TIERS_FALLBACK;
  if (cumpl >= (tiers[2] ? tiers[2].from : 120)) return 3;
  if (cumpl >= (tiers[1] ? tiers[1].from : 100)) return 2;
  if (cumpl >= (tiers[0] ? tiers[0].from : 80))  return 1;
  return 0;
}

/**
 * Proyección al cierre del trimestre.
 * Meses cerrados = real. Mes en curso = ritmo diario × días del mes.
 * Meses futuros = mismo ritmo proyectado.
 */
function proyectarMargen(marginM, meses, year) {
  var hoy = new Date();
  var curM = hoy.getMonth() + 1, curY = hoy.getFullYear();
  var diasMes = new Date(curY, hoy.getMonth() + 1, 0).getDate();
  var dia = hoy.getDate();
  var idx = (meses || []).indexOf(curM);

  var proyCur = 0;
  if (idx >= 0) {
    var real = (marginM && marginM[idx]) || 0;
    proyCur = (dia > 0 && dia < diasMes) ? real / dia * diasMes : real;
  }

  return (meses || []).map(function (m, i) {
    var real = (marginM && marginM[i]) || 0;
    if (year < curY || (year === curY && m < curM)) return Math.round(real);
    return Math.round(proyCur);
  });
}


/* ══════════════════════════════════════════════════════════════════════
   BARRA DE CUMPLIMIENTO
   Único componente visual que el ERP no tiene. Escala fija 60%→180%
   para que todas las barras sean comparables entre sí.
   ══════════════════════════════════════════════════════════════════════ */

function posBarra(v) { return Math.max(0, Math.min(100, (v - 60) / 120 * 100)); }

function marcasTiers(tiers) {
  return tiers.map(function (t) {
    return '<div class="com-mk" style="left:' + posBarra(t.from) + '%">' +
             '<span>' + t.from + '%</span>' +
           '</div>';
  }).join('');
}

function barra(cumpl, alto, color, tiers, conMarcas) {
  return '<div class="com-bar" style="height:' + alto + 'px">' +
           '<div class="com-bar-bg">' +
             '<div class="com-bar-fill" style="width:' + posBarra(cumpl) + '%;background:' + color + '"></div>' +
           '</div>' +
           (conMarcas ? '<div class="com-bar-mks">' + marcasTiers(tiers) + '</div>' : '') +
         '</div>';
}


/* ══════════════════════════════════════════════════════════════════════
   ESTILOS PROPIOS — solo lo que el ERP no tiene ya
   ══════════════════════════════════════════════════════════════════════ */

function inyectarEstilos() {
  if (document.getElementById('com-styles')) return;
  var s = document.createElement('style');
  s.id = 'com-styles';
  s.textContent = [
    '.com-bar{position:relative}',
    '.com-bar-bg{position:absolute;inset:0;background:var(--bg3);border:1px solid var(--bd);border-radius:var(--r);overflow:hidden}',
    '.com-bar-fill{position:absolute;left:0;top:0;bottom:0;border-radius:var(--r);transition:width .5s ease}',
    '.com-bar-mks{position:absolute;inset:0;pointer-events:none}',
    '.com-mk{position:absolute;top:-2px;bottom:-2px;width:2px;background:var(--bd2)}',
    '.com-mk span{position:absolute;top:-15px;left:-10px;font-size:10px;color:var(--mu)}',
    '.com-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}',
    '.com-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--bd);font-size:13px}',
    '.com-row:last-child{border-bottom:none}',
    '.com-nom{font-size:18px;font-weight:600;letter-spacing:-.3px}',
    '.com-sub{font-size:12px;color:var(--mu);margin-top:3px}',
    '.com-big{font-size:26px;font-weight:700;letter-spacing:-.5px}',
    '.com-mut{color:var(--mu)}',
    '.com-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:16px}',
    '@media(max-width:640px){.com-grid{grid-template-columns:1fr}}',
  ].join('\n');
  document.head.appendChild(s);
}


/* ══════════════════════════════════════════════════════════════════════
   VISTA PRINCIPAL
   ══════════════════════════════════════════════════════════════════════ */

function cont() { return document.getElementById('com-w'); }

function pintarCargando(msg) {
  var c = cont();
  if (c) c.innerHTML = '<div class="ld"><div class="sp"></div>' + esc(msg || 'Cargando comisiones...') + '</div>';
}

function pintarError(e) {
  var msg = (e && e.message) || String(e) || 'Error desconocido';
  var c = cont();
  if (!c) return;
  c.innerHTML =
    '<div class="card" style="border-color:var(--rd)">' +
      '<div class="ct" style="color:var(--rd)">No se pudo cargar el módulo</div>' +
      '<div style="font-size:13px;margin-bottom:14px">' + esc(msg) + '</div>' +
      '<button class="btn bg" onclick="loadComisiones(true)">Reintentar</button>' +
    '</div>';
}

/**
 * Punto de entrada. Lo llama loadPg().
 *
 * Orden de prioridad para que se vea algo cuanto antes:
 *   1. Datos en memoria      → instantáneo
 *   2. Datos en sessionStorage → instantáneo, y refresca por detrás
 *   3. Nada                  → spinner mientras consulta
 */
function cargar(forzar) {
  inyectarEstilos();

  var hoy = new Date();
  COM.year = COM.year || hoy.getFullYear();
  COM.q    = COM.q    || Math.ceil((hoy.getMonth() + 1) / 3);

  // 1) En memoria
  if (COM.data && !forzar) { pintarHome(); refrescarDetras(); return; }

  // 2) En caché de sesión
  if (!forzar) {
    var c = cacheLeer(COM.year, COM.q);
    if (c) {
      COM.data = c.data;
      COM.traidoEn = c.t;
      pintarHome();
      refrescarDetras();
      return;
    }
  }

  // 3) Sin nada guardado: spinner
  if (COM.cargando) return;
  COM.cargando = true;
  pintarCargando();

  traer(COM.year, COM.q)
    .then(function () { COM.cargando = false; pintarHome(); })
    .catch(function (e) { COM.cargando = false; pintarError(e); });
}

/** Consulta al servidor y actualiza estado + caché. */
function traer(year, q) {
  var t0 = Date.now();
  return comApi('admin', { year: year, q: q }).then(function (d) {
    COM.data = d;
    COM.traidoEn = Date.now();
    COM.ms = Date.now() - t0;
    cacheGuardar(year, q, d);
    return d;
  });
}

/**
 * Refresca los datos sin bloquear la vista.
 * El usuario ya está viendo algo; esto solo lo actualiza cuando llega.
 */
function refrescarDetras() {
  if (COM.refrescando) return;
  COM.refrescando = true;
  marcarRefrescando(true);

  var year = COM.year, q = COM.q;

  traer(year, q)
    .then(function () {
      COM.refrescando = false;
      // Si el usuario cambió de período mientras tanto, no pisar la vista
      if (COM.year === year && COM.q === q && COM.vista === 'home') pintarHome();
      else marcarRefrescando(false);
    })
    .catch(function () {
      COM.refrescando = false;
      marcarRefrescando(false);
      // Falló el refresco silencioso: no molestamos, ya hay datos en pantalla.
    });
}

function marcarRefrescando(activo) {
  var e = document.getElementById('com-estado');
  if (!e) return;
  e.textContent = activo ? 'Actualizando…'
                         : (COM.traidoEn ? 'Datos ' + haceCuanto(COM.traidoEn) : '');
  e.style.color = activo ? 'var(--ac)' : 'var(--mu)';
}

/**
 * Precarga silenciosa. La llama el ERP al arrancar, si el rol es admin.
 * No pinta nada: solo deja los datos listos en caché.
 */
function precargar() {
  var hoy = new Date();
  var year = hoy.getFullYear();
  var q = Math.ceil((hoy.getMonth() + 1) / 3);
  if (cacheLeer(year, q)) return;      // ya está
  traer(year, q).catch(function () {}); // si falla, no pasa nada
}

function pintarHome() {
  var d = COM.data;
  if (!d) return;
  var c = cont();
  if (!c) return;

  COM.vista = 'home';

  var cfg   = d.cfgFull || {};
  var meses = d.meses || [];
  var qTxt  = etiquetaTrim(d.q, d.year);

  // Armar filas desde la respuesta del backend
  var rows = (d.results || []).map(function (r) {
    return {
      nombre:  r.nombre,
      base:    r.base_m || 0,
      mPct:    (r.gmPct && r.gmPct > 0) ? r.gmPct : (cfg.gm_pct || 62),
      marginM: r.marginM || [0,0,0],
      ventasM: r.ventas  || [0,0,0],
      factorM: r.factorM || [1,1,1],
      sueldoM: r.sueldoM,
    };
  });

  var R = bonoTrim(rows, cfg);
  var P = bonoTrim(rows.map(function (r) {
    return Object.assign({}, r, { marginM: proyectarMargen(r.marginM, meses, d.year) });
  }), cfg);

  c.innerHTML =
    pestañas('home') +
    barraHerramientas(d, qTxt) +
    tarjetaEquipo(R, P, qTxt, meses, d.year) +
    tarjetaRanking(R, qTxt) +
    '<div class="ct">Asesoras · ' + esc(qTxt) + '</div>' +
    '<div class="com-grid">' +
      R.rows.map(function (r, i) { return tarjetaAsesora(r, P.rows[i], R, meses); }).join('') +
    '</div>' +
    tarjetaCobertura(d) +
    tarjetaReglas(cfg, R);
}

/* ── Navegación interna del módulo ─────────────────────────────────── */

var PESTAÑAS = [
  { id: 'home',   txt: 'Panel' },
  { id: 'cierre', txt: 'Cierre' },
];

function pestañas(activa) {
  return '<div class="tabs">' +
    PESTAÑAS.map(function (p) {
      var on = p.id === activa;
      return '<button class="tab" onclick="comIr(\'' + p.id + '\')" style="' +
             (on ? 'color:var(--ac);border-bottom-color:var(--ac);font-weight:500' : '') + '">' +
             p.txt + '</button>';
    }).join('') +
  '</div>';
}

function barraHerramientas(d, qTxt) {
  var hoy = new Date();
  var yActual = hoy.getFullYear();
  var años = [yActual - 1, yActual];

  var optY = años.map(function (y) {
    return '<option value="' + y + '"' + (y === d.year ? ' selected' : '') + '>' + y + '</option>';
  }).join('');

  var optQ = [1,2,3,4].map(function (k) {
    return '<option value="' + k + '"' + (k === d.q ? ' selected' : '') + '>' + etiquetaTrim(k, d.year) + '</option>';
  }).join('');

  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 10px;border-radius:var(--r);font-size:13px;font-family:inherit';

  var estado = COM.refrescando ? 'Actualizando…'
             : (COM.traidoEn ? 'Datos ' + haceCuanto(COM.traidoEn) : '');
  var colorEstado = COM.refrescando ? 'var(--ac)' : 'var(--mu)';

  return '<div class="com-toolbar">' +
    '<span class="com-mut" style="font-size:12px">Período</span>' +
    '<select id="com-year" style="' + estilo + '" onchange="comCambiarPeriodo()">' + optY + '</select>' +
    '<select id="com-q" style="' + estilo + '" onchange="comCambiarPeriodo()">' + optQ + '</select>' +
    '<button class="btn bg bs" onclick="loadComisiones(true)">Actualizar datos</button>' +
    '<span id="com-estado" style="font-size:12px;color:' + colorEstado + '">' + estado + '</span>' +
  '</div>';
}

/**
 * Qué fracción del trimestre ya pasó.
 * Sin esto, ver "63%" el 31 de julio parece que van perdiendo, cuando
 * en realidad recién arrancó el trimestre y julio cerró por encima.
 */
function avanceTrimestre(year, q) {
  var ini = new Date(year, (q - 1) * 3, 1);
  var fin = new Date(year, (q - 1) * 3 + 3, 0, 23, 59, 59);
  var hoy = new Date();

  if (hoy > fin) return { frac: 1, dias: 0, cerrado: true };
  if (hoy < ini) return { frac: 0, dias: Math.round((fin - ini) / 864e5) + 1, cerrado: false };

  var total = (fin - ini) / 864e5 + 1;
  var pasado = (hoy - ini) / 864e5;
  return {
    frac: Math.max(0, Math.min(1, pasado / total)),
    dias: Math.max(0, Math.round((fin - hoy) / 864e5)),
    cerrado: false,
  };
}

function tarjetaEquipo(R, P, qTxt, meses, year) {
  var totalBase  = R.rows.reduce(function (s, r) { return s + r.base; }, 0);
  var bonoActual = R.rows.reduce(function (s, r) { return s + r.bono; }, 0);
  var bonoProy   = P.rows.reduce(function (s, r) { return s + r.bono; }, 0);
  var payroll    = totalBase * 3 + bonoProy;

  var av = avanceTrimestre(year, R.qNum || (COM.q || 1));
  var esperado = av.frac * 100;   // % de la meta que deberían llevar a hoy
  var ritmo = esperado > 0 ? R.teamCumpl / esperado * 100 : 0;

  // Contexto: sin esto el número acumulado engaña a mitad de trimestre
  var contexto = '';
  if (!av.cerrado && av.frac > 0.02) {
    var colorRitmo = ritmo >= 100 ? 'var(--gn)' : ritmo >= 85 ? 'var(--am)' : 'var(--rd)';
    contexto =
      '<div class="ml" style="margin-top:8px;line-height:1.7">' +
        'Transcurrió el <b>' + Math.round(av.frac * 100) + '%</b> del trimestre · ' +
        'quedan <b>' + av.dias + ' días</b>.<br>' +
        'A este punto deberían llevar ~' + esperado.toFixed(0) + '%. ' +
        'Van al <b style="color:' + colorRitmo + '">' + ritmo.toFixed(0) + '% del ritmo</b> necesario.' +
      '</div>';
  }

  var aviso = R.teamGate ? '' :
    '<div style="color:var(--rd);font-size:13px;margin-top:12px;font-weight:500">' +
      'Bono inactivo: el equipo está por debajo del ' + R.gate + '% combinado del trimestre.' +
      (!av.cerrado ? ' <span class="com-mut" style="font-weight:400">(el trimestre sigue abierto)</span>' : '') +
    '</div>';

  var mt = function (label, valor, sub, color) {
    return '<div class="mt">' +
             '<div class="ml">' + label + '</div>' +
             '<div class="com-big"' + (color ? ' style="color:' + color + '"' : '') + '>' + valor + '</div>' +
             (sub ? '<div class="ml" style="margin:5px 0 0">' + sub + '</div>' : '') +
           '</div>';
  };

  var ratio = totalBase > 0 ? bonoProy / (totalBase * 3) * 100 : 0;
  var colorRatio = ratio > 100 ? 'var(--am)' : null;

  return '<div class="card">' +
    '<div class="ct">Cumplimiento del equipo · ' + esc(qTxt) + '</div>' +
    '<div style="font-size:22px;font-weight:700;color:' + NIVEL_COLOR[R.level] + '">' +
      p2(R.teamCumpl) + ' · ' + NIVEL_NOMBRE[R.level] +
    '</div>' +
    '<div style="margin-top:26px">' + barra(R.teamCumpl, 24, NIVEL_COLOR[R.level], R.tiers, true) + '</div>' +
    contexto +
    '<div class="ml" style="margin-top:8px">Proyección al cierre: ' +
      '<b style="color:' + NIVEL_COLOR[P.level] + '">' + p2(P.teamCumpl) + ' · ' + NIVEL_NOMBRE[P.level] + '</b>' +
    '</div>' +
    aviso +
    '<div class="mts" style="margin-top:20px;margin-bottom:0">' +
      mt('Margen del equipo', fmt(R.tMar), p2(R.teamCumpl) + ' de ' + fmt(R.tMeta)) +
      mt('Bono acumulado', f2(bonoActual), null, 'var(--gn)') +
      mt('Bono proyectado', f2(bonoProy), 'si cierra así', 'var(--gn)') +
      mt('Payroll del trimestre', fmt(payroll), 'sueldos × 3 + bono') +
      mt('Bono ÷ sueldos', p2(ratio), 'proyectado', colorRatio) +
    '</div>' +
  '</div>';
}

function tarjetaRanking(R, qTxt) {
  var orden = R.rows.map(function (r) { return { nombre: r.nombre, cumpl: r.cumpl }; })
                    .sort(function (a, b) { return b.cumpl - a.cumpl; });

  var filas = orden.map(function (o, i) {
    var lv = nivelDe(o.cumpl, R.tiers);
    return '<div class="com-row">' +
             '<div style="display:flex;align-items:center;gap:12px">' +
               '<span class="com-mut" style="width:22px;text-align:center;font-size:12px">' + (i + 1) + '</span>' +
               '<span style="font-weight:500;font-size:15px">' + esc(o.nombre) + '</span>' +
             '</div>' +
             '<span style="font-weight:700;font-size:18px;color:' + NIVEL_COLOR[lv] + '">' + p2(o.cumpl) + '</span>' +
           '</div>';
  }).join('');

  return '<div class="card">' +
    '<div class="ct">Ranking · ' + esc(qTxt) + '</div>' + filas +
  '</div>';
}

function tarjetaAsesora(r, proy, R, meses) {
  var lv  = nivelDe(r.cumpl, R.tiers);
  var col = NIVEL_COLOR[lv];

  // Detalle mes a mes
  var filasMes = meses.map(function (m, j) {
    var factor = r.factorM[j];
    var activa = factor > 0;
    var cumplMes = r.metaM[j] > 0 ? r.marM[j] / r.metaM[j] * 100 : 0;

    var nota = '';
    if (factor > 0 && factor < 1) nota = ' <span style="color:var(--am);font-size:11px">(' + Math.round(factor * 100) + '% del mes)</span>';
    else if (factor === 0)        nota = ' <span class="com-mut" style="font-size:11px">(no activa)</span>';

    var valor = activa
      ? fmt(r.marM[j]) + ' · <b style="color:' + NIVEL_COLOR[nivelDe(cumplMes, R.tiers)] + '">' + p2(cumplMes) + '</b>'
      : '—';

    return '<div class="com-row" style="padding:7px 0;font-size:12px">' +
             '<span class="com-mut">' + MESES_CORTO[m - 1] + nota + '</span>' +
             '<span>' + valor + '</span>' +
           '</div>';
  }).join('');

  // Cuánto falta para el siguiente nivel
  var siguiente = R.tiers.find(function (t) { return t.from > r.cumpl; });
  var falta;
  if (siguiente) {
    var faltaMargen = Math.max(0, (siguiente.from / 100 * r.sumMeta) - r.sumMar);
    falta = 'Faltan <b>' + fmt(faltaMargen) + '</b> de margen para llegar al ' +
            (R.tiers.indexOf(siguiente) + 1) + '° nivel (' + siguiente.rate + '%).';
  } else {
    falta = 'Está en el nivel máximo.';
  }

  var parcial = r.mesesAct < 3 ? ' · activa ' + r.mesesAct + '/3 meses' : '';

  return '<div class="card" style="margin-bottom:0">' +
    '<div class="com-nom">' + esc(r.nombre) + '</div>' +
    '<div class="com-sub">Básico ' + fmt(r.base) + '/mes · margen real ' +
      (Number(r.mPct) || 0).toFixed(2) + '%' + parcial + '</div>' +

    '<div class="com-row" style="border:none;padding:14px 0 6px;font-size:12px">' +
      '<span class="com-mut">Cumplimiento del trimestre</span>' +
      '<b style="color:' + col + '">' + p2(r.cumpl) + '</b>' +
    '</div>' +
    '<div style="margin-top:18px">' + barra(r.cumpl, 16, col, R.tiers, true) + '</div>' +

    '<div style="margin-top:18px;border-top:1px solid var(--bd);padding-top:4px">' +
      '<div class="com-row"><span class="com-mut">Margen del trimestre</span>' +
        '<span style="font-weight:600;font-size:16px">' + fmt(r.sumMar) + '</span></div>' +
      '<div class="com-row"><span class="com-mut">Bono acumulado</span>' +
        '<span style="font-weight:700;font-size:18px;color:' + (r.bono > 0 ? 'var(--gn)' : 'var(--mu)') + '">' + f2(r.bono) + '</span></div>' +
      '<div class="com-row"><span class="com-mut">Proyección al cierre</span>' +
        '<span style="font-weight:600;color:' + (proy.bono > 0 ? 'var(--gn)' : 'var(--mu)') + '">' + f2(proy.bono) +
        ' <span class="com-mut" style="font-weight:400;font-size:12px">(' + p2(proy.cumpl) + ')</span></span></div>' +
    '</div>' +

    '<div class="ct" style="margin:16px 0 4px">Detalle por mes</div>' +
    filasMes +
    '<div class="ml" style="margin-top:12px;line-height:1.5">' + falta + '</div>' +
  '</div>';
}

function tarjetaCobertura(d) {
  var sc = d.sinCosto || { items: [], covPct: 100, sinCostoIngreso: 0 };
  if (!sc.items || !sc.items.length || sc.covPct >= 70) return '';

  var filas = sc.items.map(function (it) {
    return '<div class="com-row" style="font-size:12px">' +
             '<span>' + esc(it.prenda) + '</span>' +
             '<span class="com-mut">' + it.prendas + ' und · ' + fmt(it.ingreso) + '</span>' +
           '</div>';
  }).join('');

  return '<div class="card" style="border-color:var(--am)">' +
    '<div class="ct" style="color:var(--am)">Cobertura de costos: ' + sc.covPct + '%</div>' +
    '<div style="font-size:13px;margin-bottom:14px">' +
      'Hay ' + fmt(sc.sinCostoIngreso) + ' en prendas sin costo cargado. ' +
      'Mientras falte, el margen de estas prendas se estima y el bono puede salir mal calculado. ' +
      'Cargá el CostoUnitario en la hoja Cost.' +
    '</div>' + filas +
  '</div>';
}

function tarjetaReglas(cfg, R) {
  var tramos = (cfg.tiers || TIERS_FALLBACK).map(function (t, i) {
    return (i + 1) + '° nivel: desde ' + t.from + '% → paga ' + t.rate + '% del margen';
  }).join(' &nbsp;·&nbsp; ');

  var quien = '';
  if (cfg.rules_at) {
    try {
      var f = new Date(cfg.rules_at);
      quien = ' · aplicado por ' + esc(cfg.rules_by || 'admin') + ' el ' +
              f.toLocaleDateString('es-PE', {day:'2-digit', month:'2-digit', year:'numeric'});
    } catch (e) {}
  }

  var punto = function (color, txt) {
    return '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px">' +
             '<span style="width:9px;height:9px;border-radius:50%;background:' + color + '"></span>' + txt +
           '</span>';
  };

  return '<div class="card">' +
    '<div class="ct">Reglas vigentes</div>' +
    '<div style="font-size:13px;line-height:1.9">' +
      'Meta = <b>' + (cfg.xMeta || 12) + '×</b> el sueldo, medida en margen. Pago <b>trimestral</b>.' + quien + '<br>' +
      tramos + '<br>' +
      'El bono se activa solo si el equipo completo supera el ' + R.gate + '%.' +
    '</div>' +
    '<div class="ml" style="margin-top:12px">' +
      punto('var(--rd)', 'no llega') + punto('var(--am)', '1° nivel') +
      punto('var(--gn)', '2° nivel') + punto('var(--ac)', '3° nivel') +
    '</div>' +
  '</div>';
}


/* ══════════════════════════════════════════════════════════════════════
   VISTA CIERRE — donde se paga
   ══════════════════════════════════════════════════════════════════════ */

var CIERRE = {
  sub: 'trim',        // 'trim' | 'mes' | 'log'
  previewTrim: null,
  previewMes: null,
  cerradosTrim: [],
  cerradosMes: [],
  log: [],
  cargado: false,
};

function pintarCierre() {
  COM.vista = 'cierre';
  var c = cont();
  if (!c) return;

  if (!CIERRE.cargado) {
    c.innerHTML = pestañas('cierre') + '<div class="ld"><div class="sp"></div>Cargando cierres...</div>';
    Promise.all([
      comApi('cierresTrim', { limite: 8 }).catch(function () { return []; }),
      comApi('cierres',     { limite: 12 }).catch(function () { return []; }),
      comApi('reglasLog',   { limite: 10 }).catch(function () { return []; }),
    ]).then(function (r) {
      CIERRE.cerradosTrim = r[0] || [];
      CIERRE.cerradosMes  = r[1] || [];
      CIERRE.log          = r[2] || [];
      CIERRE.cargado = true;
      pintarCierre();
    }).catch(function (e) { pintarError(e); });
    return;
  }

  var sub = [
    { id: 'trim', txt: 'Trimestral · el que paga' },
    { id: 'mes',  txt: 'Mensual · informativo' },
    { id: 'log',  txt: 'Bitácora de reglas' },
  ].map(function (s) {
    var on = s.id === CIERRE.sub;
    return '<button class="btn ' + (on ? 'bp' : 'bg') + ' bs" ' +
           'onclick="comCierreSub(\'' + s.id + '\')">' + s.txt + '</button>';
  }).join(' ');

  var cuerpo = CIERRE.sub === 'trim' ? bloqueTrimestral()
             : CIERRE.sub === 'mes'  ? bloqueMensual()
             :                          bloqueBitacora();

  c.innerHTML = pestañas('cierre') +
    '<div class="com-toolbar">' + sub + '</div>' + cuerpo;
}

/* ── Trimestral ────────────────────────────────────────────────────── */

function bloqueTrimestral() {
  var hoy = new Date();
  var yDef = COM.year || hoy.getFullYear();
  var qDef = COM.q    || Math.ceil((hoy.getMonth() + 1) / 3);

  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 10px;border-radius:var(--r);font-size:13px;font-family:inherit';

  var optY = [yDef - 1, yDef].map(function (y) {
    return '<option value="' + y + '">' + y + '</option>';
  }).join('');
  var optQ = [1,2,3,4].map(function (k) {
    return '<option value="' + k + '"' + (k === qDef ? ' selected' : '') + '>' + etiquetaTrim(k, yDef) + '</option>';
  }).join('');

  return '<div class="card">' +
      '<div class="ct">Cerrar trimestre</div>' +
      '<div style="font-size:13px;margin-bottom:16px;line-height:1.6">' +
        'Calcula el bono definitivo con los sueldos, meses activos y ajustes vigentes. ' +
        'Podés modificar el bono de cada asesora antes de confirmar. ' +
        'Al cerrar, el resultado queda guardado como el pago de ese trimestre.' +
      '</div>' +
      '<div class="com-toolbar">' +
        '<span class="com-mut" style="font-size:12px">Año</span>' +
        '<select id="ct-year" style="' + estilo + '">' + optY + '</select>' +
        '<span class="com-mut" style="font-size:12px">Trimestre</span>' +
        '<select id="ct-q" style="' + estilo + '">' + optQ + '</select>' +
        '<button class="btn bp bs" onclick="comVerTrim()">Ver cálculo</button>' +
      '</div>' +
      '<div id="ct-preview"></div>' +
    '</div>' +
    listaTrimestresCerrados();
}

function comVerTrimImpl() {
  var y = Number(document.getElementById('ct-year').value);
  var q = Number(document.getElementById('ct-q').value);
  var box = document.getElementById('ct-preview');
  box.innerHTML = '<div class="ld" style="padding:24px"><div class="sp"></div>Calculando...</div>';

  comApi('previewTrim', { year: y, q: q, overrides: {} })
    .then(function (d) {
      CIERRE.previewTrim = { d: d, year: y, q: q };
      box.innerHTML = renderPreviewTrim(d, y, q);
    })
    .catch(function (e) {
      box.innerHTML = '<div style="color:var(--rd);font-size:13px;margin-top:12px">' +
                      esc((e && e.message) || e) + '</div>';
    });
}

function renderPreviewTrim(d, year, q) {
  var tiers = d.tiers || TIERS_FALLBACK;

  var filas = (d.rows || []).map(function (r) {
    var lv = nivelDe(r.cumpl, tiers);
    return '<div style="padding:12px 0;border-bottom:1px solid var(--bd)">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px">' +
        '<div>' +
          '<b style="font-size:15px">' + esc(r.nombre) + '</b> ' +
          '<span style="color:' + NIVEL_COLOR[lv] + ';font-weight:600">' + r.cumpl + '%</span>' +
          '<div class="ml" style="margin-top:4px">margen ' + fmt(r.margen) + ' · tasa ' + r.rate + '%</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<span class="ml">Calculado: <b style="color:var(--tx)">' + f2(r.bonoCalc) + '</b></span>' +
          '<span class="ml">Ajustar a S/</span>' +
          '<input type="number" class="ct-ov" data-nom="' + esc(r.nombre) + '" ' +
                 'data-calc="' + r.bonoCalc + '" ' +
                 'value="' + (r.bonoOverride != null ? r.bonoOverride : '') + '" ' +
                 'placeholder="' + Number(r.bonoCalc).toFixed(2) + '" ' +
                 'oninput="comTotalTrim()" ' +
                 'style="background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
                 'padding:6px 9px;border-radius:var(--r);font-size:13px;width:110px;text-align:right;font-family:inherit">' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  var estadoEquipo = d.teamGate
    ? '<span style="color:var(--gn)">Bono activo · equipo ' + d.teamCumpl + '%</span>'
    : '<span style="color:var(--rd)">Bono bloqueado · equipo ' + d.teamCumpl + '% (no llega al piso)</span>';

  return '<div style="margin-top:18px;background:var(--bg3);border:1px solid var(--bd);' +
              'border-radius:var(--r2);padding:16px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;' +
         'flex-wrap:wrap;gap:8px;margin-bottom:6px;font-weight:600">' +
      '<span>' + estadoEquipo + '</span>' +
      '<span>Total a pagar: <span style="color:var(--gn);font-size:18px" id="ct-total">' +
        f2(d.total) + '</span></span>' +
    '</div>' +
    filas +
    bloqueConfirmacion(year, q) +
  '</div>';
}

function bloqueConfirmacion(year, q) {
  var codigo = year + '-Q' + q;
  return '<div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--bd)">' +
    '<div style="font-size:13px;margin-bottom:10px;line-height:1.6">' +
      'Para confirmar, escribí <b style="color:var(--ac)">' + codigo + '</b> abajo. ' +
      'Esto guarda el pago del trimestre; si lo volvés a cerrar, se sobrescribe.' +
    '</div>' +
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<input id="ct-confirm" placeholder="' + codigo + '" oninput="comChequearConfirm()" ' +
             'style="background:var(--bg2);border:1px solid var(--bd);color:var(--tx);' +
             'padding:8px 12px;border-radius:var(--r);font-size:14px;width:140px;font-family:inherit">' +
      '<button id="ct-btn" class="btn bp" disabled onclick="comCerrarTrim()" ' +
              'style="opacity:.4;cursor:not-allowed">Cerrar trimestre</button>' +
      '<span id="ct-msg" style="font-size:13px"></span>' +
    '</div>' +
  '</div>';
}

function listaTrimestresCerrados() {
  if (!CIERRE.cerradosTrim.length) {
    return '<div class="card"><div class="ct">Trimestres cerrados</div>' +
           '<div class="ml">Todavía no cerraste ningún trimestre.</div></div>';
  }

  var items = CIERRE.cerradosTrim.map(function (c) {
    var filas = (c.filas || []).map(function (f) {
      var ajustado = (f.bonoOverride !== '' && f.bonoOverride != null)
                   ? ' <span style="color:var(--am);font-size:11px">ajustado</span>' : '';
      return '<div class="com-row" style="font-size:13px">' +
               '<span>' + esc(f.asesora) + ' <span class="com-mut">(' + f.cumpl + '%)</span>' + ajustado + '</span>' +
               '<span style="color:var(--gn);font-weight:600">' + f2(f.bonoPagar) + '</span>' +
             '</div>';
    }).join('');

    return '<details style="border:1px solid var(--bd);border-radius:var(--r2);' +
                'padding:14px 16px;margin-bottom:10px;background:var(--bg3)">' +
      '<summary style="cursor:pointer;display:flex;justify-content:space-between;' +
               'align-items:center;gap:10px;font-weight:600;flex-wrap:wrap">' +
        '<span>' + esc(c.yq) + ' · equipo ' + c.teamCumpl + '% ' +
          (c.teamGate === 'SI' ? '<span style="color:var(--gn)">activo</span>'
                               : '<span style="color:var(--rd)">bloqueado</span>') + '</span>' +
        '<span style="color:var(--gn)">' + f2(c.total) + '</span>' +
      '</summary>' +
      '<div style="margin-top:12px">' + filas +
        '<div class="ml" style="margin-top:10px">Cerrado el ' + esc(c.fecha) + ' por ' + esc(c.por) + '</div>' +
      '</div>' +
    '</details>';
  }).join('');

  return '<div class="card"><div class="ct">Trimestres cerrados</div>' + items + '</div>';
}

/* ── Mensual (informativo) ─────────────────────────────────────────── */

function bloqueMensual() {
  var hoy = new Date();
  var prev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  var defMes = prev.getFullYear() + '-' + String(prev.getMonth() + 1).padStart(2, '0');

  var cfg = (COM.data && COM.data.cfgFull) || {};
  var tiers = (cfg.tiers && cfg.tiers.length) ? cfg.tiers : TIERS_FALLBACK;

  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 10px;border-radius:var(--r);font-size:13px;font-family:inherit';

  var inputsTiers = tiers.map(function (t, k) {
    return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap">' +
      '<span class="com-mut" style="font-size:12px;min-width:64px">' + (k + 1) + '° nivel</span>' +
      '<span class="com-mut" style="font-size:12px">desde</span>' +
      '<input class="cm-from" type="number" value="' + t.from + '" style="' + estilo + ';width:72px">' +
      '<span class="com-mut" style="font-size:12px">% de meta → paga</span>' +
      '<input class="cm-rate" type="number" step="0.1" value="' + t.rate + '" style="' + estilo + ';width:72px">' +
      '<span class="com-mut" style="font-size:12px">% del margen</span>' +
    '</div>';
  }).join('');

  return '<div class="card">' +
      '<div class="ct">Cerrar mes</div>' +
      '<div style="font-size:13px;margin-bottom:16px;line-height:1.6">' +
        'El cierre mensual es informativo: sirve para dejar registro del avance. ' +
        'El pago real sale del <b>cierre trimestral</b>. ' +
        'Podés probar otros parámetros antes de cerrar; por defecto usa los vigentes.' +
      '</div>' +
      '<div class="com-toolbar">' +
        '<span class="com-mut" style="font-size:12px">Mes</span>' +
        '<input type="month" id="cm-mes" value="' + defMes + '" style="' + estilo + '">' +
        '<span class="com-mut" style="font-size:12px">Meta (×  sueldo)</span>' +
        '<input type="number" step="0.5" id="cm-x" value="' + (cfg.xMeta || 12) + '" style="' + estilo + ';width:76px">' +
      '</div>' +
      inputsTiers +
      '<div class="com-toolbar" style="margin-top:14px">' +
        '<button class="btn bp bs" onclick="comVerMes()">Ver cálculo</button>' +
      '</div>' +
      '<div id="cm-preview"></div>' +
    '</div>' +
    listaMesesCerrados();
}

function comVerMesImpl() {
  var v = document.getElementById('cm-mes').value;
  var box = document.getElementById('cm-preview');
  if (!v) { box.innerHTML = '<div class="ml">Elegí un mes.</div>'; return; }

  var p = v.split('-');
  var reglas = leerReglasMes();
  box.innerHTML = '<div class="ld" style="padding:24px"><div class="sp"></div>Calculando...</div>';

  comApi('previewMes', { year: Number(p[0]), mes: Number(p[1]), reglas: reglas })
    .then(function (d) {
      CIERRE.previewMes = { d: d, ym: v, reglas: reglas };
      box.innerHTML = renderPreviewMes(d, v);
    })
    .catch(function (e) {
      box.innerHTML = '<div style="color:var(--rd);font-size:13px;margin-top:12px">' +
                      esc((e && e.message) || e) + '</div>';
    });
}

function leerReglasMes() {
  var x = Number(document.getElementById('cm-x').value) || 12;
  var froms = document.querySelectorAll('.cm-from');
  var rates = document.querySelectorAll('.cm-rate');
  var tiers = [];
  for (var i = 0; i < froms.length; i++) {
    tiers.push({ from: Number(froms[i].value) || 0, rate: Number(rates[i].value) || 0 });
  }
  return { xMeta: x, tiers: tiers };
}

function renderPreviewMes(d, ym) {
  var tiers = d.tiers || TIERS_FALLBACK;

  var filas = (d.rows || []).map(function (f) {
    var lv = nivelDe(f.att, tiers);
    return '<div class="com-row" style="font-size:13px">' +
             '<span>' + esc(f.nombre) + ' <span style="color:' + NIVEL_COLOR[lv] + '">(' + f.att + '%)</span> ' +
               '<span class="com-mut">· básico ' + fmt(f.base) + ' · margen ' + fmt(f.margen) + '</span></span>' +
             '<span style="color:' + (f.com > 0 ? 'var(--gn)' : 'var(--mu)') + ';font-weight:600">' + f2(f.com) + '</span>' +
           '</div>';
  }).join('');

  return '<div style="margin-top:18px;background:var(--bg3);border:1px solid var(--bd);' +
              'border-radius:var(--r2);padding:16px">' +
    '<div style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:8px;flex-wrap:wrap;gap:8px">' +
      '<span>Equipo ' + d.teamAtt + '% ' +
        (d.teamGate ? '<span style="color:var(--gn)">activo</span>' : '<span style="color:var(--rd)">bloqueado</span>') +
      '</span>' +
      '<span style="color:var(--gn)">' + f2(d.total) + '</span>' +
    '</div>' + filas +
    '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--bd);' +
         'display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<button class="btn bp bs" onclick="comCerrarMes()">Guardar cierre de ' + esc(ym) + '</button>' +
      '<span id="cm-msg" style="font-size:13px"></span>' +
    '</div>' +
  '</div>';
}

function listaMesesCerrados() {
  if (!CIERRE.cerradosMes.length) {
    return '<div class="card"><div class="ct">Meses cerrados</div>' +
           '<div class="ml">Todavía no cerraste ningún mes.</div></div>';
  }

  var items = CIERRE.cerradosMes.map(function (c) {
    var filas = (c.filas || []).map(function (f) {
      return '<div class="com-row" style="font-size:13px">' +
               '<span>' + esc(f.asesora) + ' <span class="com-mut">· básico ' + fmt(f.base) + ' (' + f.cumpl + '%)</span></span>' +
               '<span style="color:var(--gn);font-weight:600">' + f2(f.com) + '</span>' +
             '</div>';
    }).join('');

    return '<details style="border:1px solid var(--bd);border-radius:var(--r2);' +
                'padding:14px 16px;margin-bottom:10px;background:var(--bg3)">' +
      '<summary style="cursor:pointer;display:flex;justify-content:space-between;' +
               'align-items:center;gap:10px;font-weight:600;flex-wrap:wrap">' +
        '<span>' + esc(c.ym) + ' · equipo ' + c.teamAtt + '% ' +
          (c.teamGate === 'SI' ? '<span style="color:var(--gn)">activo</span>'
                               : '<span style="color:var(--rd)">bloqueado</span>') + '</span>' +
        '<span style="color:var(--gn)">' + f2(c.total) + '</span>' +
      '</summary>' +
      '<div style="margin-top:12px">' +
        '<div class="ml" style="margin-bottom:8px">Meta: ' + esc(c.reglasX || '?') + '× · tramos ' + esc(c.reglasTramos || '—') + '</div>' +
        filas +
        '<div class="ml" style="margin-top:10px">Cerrado el ' + esc(c.fecha) + ' por ' + esc(c.por) + '</div>' +
      '</div>' +
    '</details>';
  }).join('');

  return '<div class="card"><div class="ct">Meses cerrados</div>' + items + '</div>';
}

/* ── Bitácora ──────────────────────────────────────────────────────── */

function bloqueBitacora() {
  if (!CIERRE.log.length) {
    return '<div class="card"><div class="ct">Bitácora de reglas</div>' +
           '<div class="ml">No hay cambios de reglas registrados.</div></div>';
  }

  var filas = CIERRE.log.map(function (l) {
    return '<div class="com-row" style="font-size:13px">' +
             '<span>Meta ' + esc(l.xMeta) + '× · ' + esc(l.tramos) + '</span>' +
             '<span class="com-mut">' + esc(l.fecha) + ' · ' + esc(l.por) + '</span>' +
           '</div>';
  }).join('');

  return '<div class="card">' +
    '<div class="ct">Bitácora de reglas</div>' +
    '<div style="font-size:13px;margin-bottom:14px">' +
      'Cada vez que alguien cambia la meta o los tramos, queda registrado acá.' +
    '</div>' + filas +
  '</div>';
}

window.loadComisiones = cargar;

/* ── Navegación interna ── */
window.comIr = function (vista) {
  if (vista === 'cierre') pintarCierre();
  else cargar();
};
window.comCierreSub = function (sub) { CIERRE.sub = sub; pintarCierre(); };
window.comVerTrim = comVerTrimImpl;
window.comVerMes  = comVerMesImpl;

/* ── Cierre trimestral ── */

/** Suma los ajustes en vivo mientras el admin los escribe. */
window.comTotalTrim = function () {
  var total = 0;
  Array.prototype.forEach.call(document.querySelectorAll('.ct-ov'), function (el) {
    var calc = Number(el.getAttribute('data-calc')) || 0;
    total += el.value !== '' ? Number(el.value) : calc;
  });
  var t = document.getElementById('ct-total');
  if (t) t.textContent = f2(total);
};

/** Habilita el botón de cierre solo cuando el código escrito coincide. */
window.comChequearConfirm = function () {
  var p = CIERRE.previewTrim;
  if (!p) return;
  var esperado = p.year + '-Q' + p.q;
  var inp = document.getElementById('ct-confirm');
  var btn = document.getElementById('ct-btn');
  if (!inp || !btn) return;

  var ok = inp.value.trim().toUpperCase() === esperado;
  btn.disabled = !ok;
  btn.style.opacity = ok ? '1' : '.4';
  btn.style.cursor  = ok ? 'pointer' : 'not-allowed';
};

window.comCerrarTrim = function () {
  var p = CIERRE.previewTrim;
  if (!p) return;

  var btn = document.getElementById('ct-btn');
  var msg = document.getElementById('ct-msg');

  // Recoger los ajustes manuales
  var bono = {};
  Array.prototype.forEach.call(document.querySelectorAll('.ct-ov'), function (el) {
    var n = el.getAttribute('data-nom');
    if (n && el.value !== '') bono[n] = Number(el.value);
  });

  btn.disabled = true;
  btn.textContent = 'Cerrando...';
  btn.style.opacity = '.6';
  if (msg) { msg.textContent = ''; msg.style.color = ''; }

  comApi('cerrarTrim', { year: p.year, q: p.q, overrides: { bono: bono } })
    .then(function () {
      CIERRE.cargado = false;      // recargar la lista de cerrados
      CIERRE.previewTrim = null;
      COM.data = null;             // los números del panel cambiaron
      cacheBorrar();
      pintarCierre();
    })
    .catch(function (e) {
      btn.disabled = false;
      btn.textContent = 'Cerrar trimestre';
      btn.style.opacity = '1';
      if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = (e && e.message) || e; }
    });
};

/* ── Cierre mensual ── */
window.comCerrarMes = function () {
  var p = CIERRE.previewMes;
  if (!p) return;
  var ym = p.ym.split('-');
  var msg = document.getElementById('cm-msg');
  if (msg) { msg.style.color = 'var(--mu)'; msg.textContent = 'Guardando...'; }

  comApi('cerrarMes', { year: Number(ym[0]), mes: Number(ym[1]), reglas: p.reglas })
    .then(function () {
      CIERRE.cargado = false;
      CIERRE.previewMes = null;
      cacheBorrar();
      pintarCierre();
    })
    .catch(function (e) {
      if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = (e && e.message) || e; }
    });
};

// Precarga silenciosa — la dispara el ERP al arrancar si el rol es admin
window._comPrecargar = precargar;

window.comCambiarPeriodo = function () {
  var y = document.getElementById('com-year'), q = document.getElementById('com-q');
  if (!y || !q) return;
  COM.year = Number(y.value);
  COM.q    = Number(q.value);
  COM.data = null;
  COM.traidoEn = null;
  cargar();   // usa caché si ya vio ese período antes
};

// Lo llama el botón 🔄 del ERP: tira todo lo guardado y vuelve a pedir
window._comReset = function () {
  COM.data = null;
  COM.traidoEn = null;
  cacheBorrar();
};

})();
