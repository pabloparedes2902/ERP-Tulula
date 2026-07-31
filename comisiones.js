function filtrosPeriodo() { return ''; }   // el período ya vive en la barra de arriba

/** Sub-selector dentro del resumen: todo el trimestre o un mes suelto. */
function selectorMesResumen() {
  var hoy = new Date();
  var year = COM.year || hoy.getFullYear();
  var q = COM.q || Math.ceil((hoy.getMonth() + 1) / 3);
  var m0 = (q - 1) * 3 + 1;
  var tope = (year === hoy.getFullYear()) ? hoy.getMonth() + 1 : 12;

  var estilo = 'background:var(--bg2);border:1px solid var(--bd);color:var(--tx);' +
               'padding:5px 8px;border-radius:var(--r);font-size:12px;font-family:inherit;cursor:pointer';

  var todos = [];
  for (var k = 0; k < 3; k++) if (m0 + k <= tope) todos.push(m0 + k);
  var esTodo = !PER.meses || PER.meses.length !== 1;

  var opts = '<option value="0"' + (esTodo ? ' selected' : '') + '>Todo el trimestre</option>';
  todos.forEach(function (m) {
    var sel = (!esTodo && PER.meses[0] === m) ? ' selected' : '';
    opts += '<option value="' + m + '"' + sel + '>' + MESES_LARGO[m - 1] + '</option>';
  });

  return '<select style="' + estilo + '" onchange="comMesResumen(this.value)">' + opts + '</select>';
}

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
  comoEmail: '',   // si no está vacío, se está viendo el panel de una asesora
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

/** Medalla de oro, plata o bronce. Del 4° en adelante, solo el número. */
function medalla(i) {
  var M = [
    { fill: '#fbbf24', borde: '#d97706' },   // oro
    { fill: '#cbd5e1', borde: '#94a3b8' },   // plata
    { fill: '#d97757', borde: '#b45309' },   // bronce
  ];
  if (i > 2) {
    return '<span class="com-mut" style="width:24px;text-align:center;font-size:12px">' + (i + 1) + '</span>';
  }
  var m = M[i];
  return '<svg width="24" height="24" viewBox="0 0 24 24" style="flex-shrink:0" aria-label="Puesto ' + (i + 1) + '">' +
    '<circle cx="12" cy="14" r="7" fill="' + m.fill + '" stroke="' + m.borde + '" stroke-width="1.5"/>' +
    '<path d="M8 2l2 5M16 2l-2 5" stroke="' + m.borde + '" stroke-width="1.5" fill="none"/>' +
    '<text x="12" y="17.5" text-anchor="middle" font-size="8" font-weight="700" fill="' + m.borde + '">' +
      (i + 1) + '</text></svg>';
}

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

// Escala de la barra. Arranca en 0 para que un cumplimiento bajo también
// se vea, y el tope se estira si alguien supera el nivel máximo.
var BARRA_TOPE = 200;   // escala fija 0% → 200%, igual en todas las barras

function escalaBarra() { return BARRA_TOPE; }

function posBarra(v) { return Math.max(0, Math.min(100, (v || 0) / BARRA_TOPE * 100)); }

function marcasTiers(tiers) {
  return (tiers || []).map(function (t) {
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
'.com-mts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:stretch}',
    '.com-met{background:var(--bg3);border:1px solid var(--bd);border-radius:var(--r2);padding:14px;min-width:0;text-align:center}',
    '.com-met .ml{margin:0 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}',
    '.com-met .com-big{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;text-align:center}',
    '.com-met .com-sub2{font-size:11px;color:var(--mu);margin-top:5px;line-height:1.4;text-align:center}',
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
/**
 * Trae todo el módulo en UNA sola llamada.
 * Cada ida y vuelta a Apps Script cuesta ~3 segundos (redirect incluido),
 * así que pedir cinco cosas por separado son 15 segundos de espera.
 */
function traer(year, q) {
  var t0 = Date.now();
  return comApi('bootstrap', { year: year, q: q }).then(function (b) {
    COM.data = b.admin;
    COM.traidoEn = Date.now();
    COM.ms = Date.now() - t0;
    cacheGuardar(year, q, b.admin);

    // Las otras pestañas ya vienen resueltas
    if (b.asesoras) { ASE.data = b.asesoras; ASE.year = year; }
    if (b.cierresTrim || b.cierresMes || b.reglasLog) {
      CIERRE.cerradosTrim = b.cierresTrim || [];
      CIERRE.cerradosMes  = b.cierresMes  || [];
      CIERRE.log          = b.reglasLog   || [];
      CIERRE.cargado = true;
    }
    return b.admin;
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
  if (activo) { e.textContent = 'Actualizando…'; e.style.color = 'var(--ac)'; return; }
  // En silencio salvo que el ERP esté lento: ahí sí conviene saberlo
  if (COM.ms != null && COM.ms > 8000) {
    e.textContent = 'El ERP está ocupado (' + (COM.ms / 1000).toFixed(0) + 's)';
    e.style.color = 'var(--am)';
  } else {
    e.textContent = '';
  }
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
    filtrosPeriodo() +
    '<div id="com-perf"></div>' +
    '<div id="com-hist"></div>' +
    tarjetaEquipo(R, P, qTxt, meses, d.year) +
    tarjetaRanking(R, qTxt) +
    '<div class="ct">Asesoras · ' + esc(qTxt) + '</div>' +
    '<div class="com-grid">' +
      R.rows.map(function (r, i) { return tarjetaAsesora(r, P.rows[i], R, meses); }).join('') +
    '</div>' +
    tarjetaCobertura(d) +
    tarjetaReglas(cfg, R);

  // El resumen y el histórico son 3 peticiones más. Con el ERP en cola eso
  // multiplica la espera, así que solo se cargan si ya se pidieron antes o
  // si el usuario toca un filtro. La primera vez muestra un botón.
  if (PER.perf) { pintarPerf(); pintarHist(); }
  else {
    var z = document.getElementById('com-perf');
    if (z) z.innerHTML =
      '<div class="card">' +
        '<div class="ct">Resumen del período</div>' +
        '<div style="font-size:13px;margin-bottom:12px">' +
          'Ventas, margen, pedidos y ticket, comparados con el período anterior.' +
        '</div>' +
        '<button class="btn bg bs" onclick="comCargarResumen()">Cargar resumen</button>' +
      '</div>';
  }
}

/* ── Navegación interna del módulo ─────────────────────────────────── */

var PESTAÑAS = [
  { id: 'home',     txt: 'Panel' },
  { id: 'cierre',   txt: 'Cierre' },
  { id: 'asesoras', txt: 'Asesoras' },
  { id: 'sim',      txt: 'Simulador' },
  { id: 'config',   txt: 'Configuración' },
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
  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:8px 11px;border-radius:var(--r);font-size:13px;font-family:inherit;cursor:pointer';

  // Un solo desplegable con los trimestres, del más reciente al más viejo
  var opts = '', yActual = hoy.getFullYear(), qActual = Math.ceil((hoy.getMonth() + 1) / 3);
  for (var k = 0; k < 8; k++) {
    var qq = qActual - k, yy = yActual;
    while (qq < 1) { qq += 4; yy--; }
    var sel = (yy === d.year && qq === d.q) ? ' selected' : '';
    var etq = etiquetaTrim(qq, yy);
    if (k === 0) etq += '  ·  actual';
    opts += '<option value="' + yy + '-' + qq + '"' + sel + '>' + etq + '</option>';
  }

  return '<div class="com-toolbar">' +
    '<select id="com-periodo" style="' + estilo + ';font-weight:500" onchange="comCambiarPeriodo()">' +
      opts + '</select>' +
    selectorVerComo(d.cfgFull) +
    '<button class="btn bg bs" onclick="loadComisiones(true)">Actualizar</button>' +
    '<span id="com-estado" style="font-size:12px;color:var(--mu)"></span>' +
  '</div>';
}

function tarjetaEquipo(R, P, qTxt, meses, year) {
  var totalBase  = R.rows.reduce(function (s, r) { return s + r.base; }, 0);
  var bonoActual = R.rows.reduce(function (s, r) { return s + r.bono; }, 0);
  var bonoProy   = P.rows.reduce(function (s, r) { return s + r.bono; }, 0);
  var payroll    = totalBase * 3 + bonoProy;

  var av = avanceTrimestre(year, COM.q || 1);
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
    return '<div class="com-met">' +
             '<div class="ml">' + label + '</div>' +
             '<div class="com-big"' + (color ? ' style="color:' + color + '"' : '') + '>' + valor + '</div>' +
             (sub ? '<div class="com-sub2">' + sub + '</div>' : '') +
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
    '<div class="com-mts" style="margin-top:20px">' +
      mt('Margen del equipo', fmt(R.tMar), p2(R.teamCumpl) + ' de ' + fmt(R.tMeta)) +
      mt('Bono acumulado', f2(bonoActual), null, 'var(--gn)') +
      mt('Bono proyectado', f2(bonoProy), 'si cierra así', 'var(--gn)') +
      mt('Payroll del trimestre', fmt(payroll), 'sueldos × 3 + bono') +
      mt('Bono vs sueldos', p2(ratio), 'del costo fijo', colorRatio) +
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
               medalla(i) +
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
    return '<option value="' + y + '"' + (y === yDef ? ' selected' : '') + '>' + y + '</option>';
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

/* ══════════════════════════════════════════════════════════════════════
   VISTA ASESORAS — quién estuvo activa, con qué sueldo, y qué meta le tocó
   ──────────────────────────────────────────────────────────────────────
   Acá se corrige el caso típico: una asesora entra a mitad de año y el
   sistema le calcula meta de meses en que no trabajó. Eso arrastra el
   cumplimiento del equipo hacia abajo y castiga a las demás.
   ══════════════════════════════════════════════════════════════════════ */

var ASE = {
  data: null,
  year: null,
  abiertas: {},     // qué tarjetas están expandidas
  avanzado: {},     // qué asesoras muestran los campos de ajuste manual
  cargando: false,
};

var MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function pintarAsesoras() {
  COM.vista = 'asesoras';
  var c = cont();
  if (!c) return;

  ASE.year = ASE.year || COM.year || new Date().getFullYear();

  if (!ASE.data) {
    if (ASE.cargando) return;
    ASE.cargando = true;
    c.innerHTML = pestañas('asesoras') + '<div class="ld"><div class="sp"></div>Cargando asesoras...</div>';
    comApi('asesoraMes', { year: ASE.year })
      .then(function (d) { ASE.cargando = false; ASE.data = d; pintarAsesoras(); })
      .catch(function (e) { ASE.cargando = false; pintarError(e); });
    return;
  }

  var d = ASE.data;
  var x = d.xMeta || 12;
  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 10px;border-radius:var(--r);font-size:13px;font-family:inherit';

  var optY = [d.year - 1, d.year, d.year + 1].map(function (y) {
    return '<option value="' + y + '"' + (y === d.year ? ' selected' : '') + '>' + y + '</option>';
  }).join('');

  c.innerHTML = pestañas('asesoras') +
    '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
        '<div class="ct" style="margin:0">Asesoras · mes a mes</div>' +
        '<div>' +
          '<span class="com-mut" style="font-size:12px">Año </span>' +
          '<select onchange="comAseAno(this.value)" style="' + estilo + '">' + optY + '</select>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:13px;margin-top:12px;line-height:1.7">' +
        'Marcá los meses en que cada asesora estuvo activa. Los meses inactivos ' +
        'no suman meta ni arrastran el cumplimiento del equipo.<br>' +
        'Si dejás el <b>sueldo</b> vacío se usa el prorrateo por días trabajados. ' +
        'La <b>meta</b> se calcula sola: ' + x + '× el sueldo del mes.' +
      '</div>' +
    '</div>' +
    (d.asesoras || []).map(function (a, i) { return tarjetaAsesoraAdmin(a, d, x, i); }).join('');
}

function tarjetaAsesoraAdmin(a, d, x, idx) {
  var abierta = !!ASE.abiertas[idx];
  var activa = a.estado !== 'inactiva';
  var K = 'a' + idx;                       // clave estable para IDs del DOM
  var hoy = new Date();
  var mesActual = hoy.getMonth() + 1;
  var esteAno = d.year === hoy.getFullYear();

  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 9px;border-radius:var(--r);font-size:13px;font-family:inherit';

  var mesesActivos = (a.meses || []).filter(function (m) { return m.activo; }).length;

  var resumen =
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;' +
         'flex-wrap:wrap;cursor:pointer" onclick="comAseToggle(' + idx + ')">' +
      '<div>' +
        '<span style="font-size:16px;font-weight:600">' + esc(a.nombre) + '</span>' +
        '<span class="com-mut" style="font-size:12px;margin-left:10px">' +
          'base ' + fmt(a.base) + ' · ingreso ' + esc(a.desde || 'sin fecha') + ' · ' +
          mesesActivos + '/12 meses activos' +
          (activa ? '' : ' · <span style="color:var(--rd)">inactiva</span>') +
        '</span>' +
      '</div>' +
      '<span class="com-mut" style="font-size:18px">' + (abierta ? '−' : '+') + '</span>' +
    '</div>';

  if (!abierta) return '<div class="card">' + resumen + '</div>';

  var general =
    '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;' +
         'margin:16px 0;padding-bottom:16px;border-bottom:1px solid var(--bd)">' +
      '<span class="com-mut" style="font-size:12px">Fecha de ingreso</span>' +
      '<input type="date" id="as-desde-' + a.email + '" value="' + (a.desde || '') + '" style="' + estilo + '">' +
      '<span class="com-mut" style="font-size:12px">Sueldo base</span>' +
      '<input type="number" id="as-base-' + a.email + '" value="' + a.base + '" style="' + estilo + ';width:100px">' +
      '<span class="com-mut" style="font-size:12px">Estado</span>' +
      '<button type="button" id="as-est-' + a.email + '" data-on="' + (activa ? 1 : 0) + '" ' +
              'onclick="comAseEstado(' + idx + ')" ' +
              'style="cursor:pointer;border-radius:99px;padding:6px 16px;font-size:12px;font-weight:600;' +
              'font-family:inherit;color:#fff;border:1px solid ' + (activa ? 'var(--gn)' : 'var(--rd)') + ';' +
              'background:' + (activa ? 'var(--gn)' : 'var(--rd)') + '">' +
        (activa ? 'Activa' : 'Inactiva') + '</button>' +
      '<button class="btn bg bs" onclick="comAseAvanzado(' + idx + ')">' +
        (ASE.avanzado[idx] ? 'Ocultar ajustes' : 'Ajustes manuales') + '</button>' +
    '</div>';

  var filas = (a.meses || []).map(function (m) {
    var id = K + '-' + m.mes;
    var on = !!m.activo;
    var vigente = esteAno && m.mes === mesActual;

    var pill =
      '<button type="button" id="as-act-' + id + '" data-on="' + (on ? 1 : 0) + '" ' +
              'onclick="comAseMes(\'' + id + '\')" ' +
              'style="cursor:pointer;border-radius:99px;padding:4px 13px;font-size:11px;font-weight:600;' +
              'font-family:inherit;border:1px solid ' + (on ? 'var(--gn)' : 'var(--bd)') + ';' +
              'background:' + (on ? 'var(--gn)' : 'transparent') + ';' +
              'color:' + (on ? '#fff' : 'var(--mu)') + '">' +
        (on ? 'Activo' : 'Inactivo') + '</button>';

    var avanzado = ASE.avanzado[idx]
      ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:10px">' +
          campoOv('Venta',  'as-vov-' + id, m.ventaOv,  estilo) +
          campoOv('Margen', 'as-mov-' + id, m.margenOv, estilo) +
          campoOv('Bono',   'as-bov-' + id, m.bonoOv,   estilo) +
          '<div><div class="ml" style="margin-bottom:3px">Nota</div>' +
            '<input type="text" id="as-nota-' + id + '" value="' + esc(m.nota || '') + '" ' +
                   'style="' + estilo + ';width:100%"></div>' +
        '</div>'
      : '';

    return '<div id="as-box-' + id + '" style="' + estiloMes(on) + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<b style="font-size:13px">' + MESES_LARGO[m.mes - 1] +
          (vigente ? ' <span style="color:var(--ac);font-size:11px">en curso</span>' : '') + '</b>' +
        pill +
      '</div>' +
      '<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-top:10px">' +
        '<div>' +
          '<div class="ml" style="margin-bottom:3px">Sueldo del mes</div>' +
          '<input type="number" id="as-suel-' + id + '" ' +
                 'value="' + (m.sueldo != null ? m.sueldo : '') + '" ' +
                 'data-sug="' + (m.sueldoSugerido || 0) + '" ' +
                 'placeholder="' + (m.sueldoSugerido || 0) + ' (prorrateo)" ' +
                 'oninput="comAseMeta(\'' + id + '\')" style="' + estilo + ';width:145px">' +
        '</div>' +
        '<div>' +
          '<div class="ml" style="margin-bottom:3px">Meta de margen</div>' +
          '<div id="as-meta-' + id + '" style="font-weight:600;padding:7px 0">' + fmt(m.meta) + '</div>' +
        '</div>' +
      '</div>' + avanzado +
    '</div>';
  }).join('');

  var acciones =
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:16px;' +
         'padding-top:16px;border-top:1px solid var(--bd)">' +
      '<button class="btn bp" onclick="comAseGuardar(' + idx + ')">Guardar cambios</button>' +
      '<button class="btn bg" id="as-reset-' + a.email + '" ' +
              'onclick="comAseReset(' + idx + ')">Restablecer el año</button>' +
      '<span id="as-msg-' + a.email + '" style="font-size:13px"></span>' +
    '</div>';

  return '<div class="card">' + resumen + general +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:10px">' +
      filas +
    '</div>' + acciones +
  '</div>';
}

function campoOv(label, id, valor, estilo) {
  return '<div>' +
    '<div class="ml" style="margin-bottom:3px">' + label + '</div>' +
    '<input type="number" id="' + id + '" value="' + (valor != null ? valor : '') + '" ' +
           'placeholder="auto" style="' + estilo + ';width:100%">' +
  '</div>';
}

function estiloMes(activo) {
  return activo
    ? 'border:1px solid var(--ac);border-radius:var(--r2);padding:12px;background:var(--bg3)'
    : 'border:1px solid var(--bd);border-radius:var(--r2);padding:12px;opacity:.5';
}


/* ══════════════════════════════════════════════════════════════════════
   RESUMEN DEL PERÍODO + HISTÓRICO
   Lo de arriba del panel: ventas, margen, pedidos, ticket — comparado
   contra el mismo período anterior — y el gráfico de margen en el tiempo.
   El gráfico es SVG puro: sin librerías y hereda el tema claro/oscuro.
   ══════════════════════════════════════════════════════════════════════ */

var PER = {
  modo: 'meses',     // los meses elegidos mandan
  meses: null,       // [7] o [4,5,6] o los que sean
  perf: null,
  perfPrev: null,
  hist: null,
  rango: null,
  cargando: false,
  seq: 0,            // descarta respuestas de una selección ya abandonada
};

var PER_NOMBRE = { mes: 'Este mes', trim: 'Este trimestre', anio: 'Este año', custom: 'Personalizado' };

function iso(d) {
  return d.getFullYear() + '-' +
         String(d.getMonth() + 1).padStart(2, '0') + '-' +
         String(d.getDate()).padStart(2, '0');
}

/**
 * Rango del período elegido + el mismo tramo del período anterior.
 * Corta en AYER: el día en curso está incompleto y ensucia la comparación.
 */
function rangoComparable(modo) {
  var hoy = new Date();
  var ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  var ini;

  if (modo === 'trim')      ini = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1);
  else if (modo === 'anio') ini = new Date(hoy.getFullYear(), 0, 1);
  else                      ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  // Si hoy es día 1, no hay días cerrados: tomamos el período anterior
  if (ayer < ini) ini = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);

  var dias = Math.max(1, Math.round((ayer - ini) / 864e5) + 1);

  var iniPrev;
  if (modo === 'anio')      iniPrev = new Date(ini.getFullYear() - 1, 0, 1);
  else if (modo === 'trim') iniPrev = new Date(ini.getFullYear(), ini.getMonth() - 3, 1);
  else                      iniPrev = new Date(ini.getFullYear(), ini.getMonth() - 1, 1);

  var finPrev = new Date(iniPrev.getFullYear(), iniPrev.getMonth(), iniPrev.getDate() + dias - 1);

  return {
    desde: iso(ini), hasta: iso(ayer),
    pDesde: iso(iniPrev), pHasta: iso(finPrev),
    dias: dias,
  };
}

/** Rango de fechas a partir de los meses seleccionados. */
function rangoDeMeses(meses, year) {
  var ms = (meses || []).slice().sort(function (a, b) { return a - b; });
  if (!ms.length) return null;

  var hoy = new Date();
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var ini = new Date(year, ms[0] - 1, 1);
  var ultimoDia = new Date(year, ms[ms.length - 1], 0);
  // No pasar de ayer: el día en curso está incompleto
  var ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  var fin = ultimoDia > ayer ? ayer : ultimoDia;
  if (fin < ini) fin = ultimoDia;

  var dias = Math.max(1, Math.round((fin - ini) / 864e5) + 1);

  // Mismo número de meses, inmediatamente antes
  var iniPrev = new Date(year, ms[0] - 1 - ms.length, 1);
  var finPrev = new Date(iniPrev.getFullYear(), iniPrev.getMonth() + ms.length, 0);

  var iso2 = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  return {
    desde: iso2(ini), hasta: iso2(fin),
    pDesde: iso2(iniPrev), pHasta: iso2(finPrev),
    dias: dias,
  };
}

function cargarPeriodo(modo, desde, hasta) {
  PER.modo = modo;
  var seq = ++PER.seq;

  var hoy = new Date();
  var year = COM.year || hoy.getFullYear();
  var q = COM.q || Math.ceil((hoy.getMonth() + 1) / 3);

  // Sin selección explícita, el resumen cubre el trimestre entero
  var meses = PER.meses;
  if (!meses || !meses.length) {
    var m0 = (q - 1) * 3 + 1;
    var tope = (year === hoy.getFullYear()) ? hoy.getMonth() + 1 : 12;
    meses = [];
    for (var k = 0; k < 3; k++) if (m0 + k <= tope) meses.push(m0 + k);
    if (!meses.length) meses = [m0];
  }

  var r = rangoDeMeses(meses, year);
  if (!r) return;
  PER.rango = r;
  PER.cargando = true;

  var zonaPerf = document.getElementById('com-perf');
  var zonaHist = document.getElementById('com-hist');
  if (zonaPerf) zonaPerf.innerHTML = '<div class="card"><div class="ml">Cargando resumen…</div></div>';
  if (zonaHist) zonaHist.innerHTML = '';

  // Período actual
  comApi('perf', { desde: r.desde, hasta: r.hasta })
    .then(function (d) {
      if (seq !== PER.seq) return;   // el usuario ya cambió de selección
      PER.perf = d;
      if (!r.pDesde) { PER.perfPrev = null; PER.cargando = false; pintarPerf(); return; }
      return comApi('perf', { desde: r.pDesde, hasta: r.pHasta })
        .then(function (p) { if (seq === PER.seq) { PER.perfPrev = p; pintarPerf(); } })
        .catch(function () { if (seq === PER.seq) { PER.perfPrev = null; pintarPerf(); } });
    })
    .catch(function (e) {
      if (seq !== PER.seq) return;
      if (zonaPerf) zonaPerf.innerHTML = '<div class="card" style="border-color:var(--rd)">' +
        '<div class="ml" style="color:var(--rd)">' + esc((e && e.message) || e) + '</div></div>';
    });

  // Histórico
  comApi('hist', { desde: r.desde, hasta: r.hasta })
    .then(function (d) { if (seq === PER.seq) { PER.hist = d; pintarHist(); } })
    .catch(function (e) {
      if (seq !== PER.seq) return;
      var z = document.getElementById('com-hist');
      if (z) z.innerHTML = '<div class="card">' +
        '<div class="ct">Histórico de margen</div>' +
        '<div class="ml">No se pudo cargar: ' + esc((e && e.message) || e) + '</div>' +
        '<button class="btn bg bs" style="margin-top:10px" onclick="comCargarResumen()">Reintentar</button>' +
      '</div>';
    });
}

function filtrosPeriodo() { return ''; }   // el período vive en la barra de arriba

/** Flecha comparativa contra el período anterior. */
function delta(actual, previo) {
  if (previo == null || isNaN(previo)) return '';
  var a = Number(actual) || 0, p = Number(previo) || 0;
  if (p === 0 && a === 0) return '<span class="ml">sin cambio</span>';
  if (p === 0) return '<span style="color:var(--gn);font-size:11px">nuevo</span>';

  var pct = (a - p) / Math.abs(p) * 100;
  var col = pct > 0.05 ? 'var(--gn)' : pct < -0.05 ? 'var(--rd)' : 'var(--mu)';
  var flecha = pct > 0.05 ? '▲' : pct < -0.05 ? '▼' : '=';
  return '<span style="color:' + col + ';font-size:11px;font-weight:600">' +
         flecha + ' ' + Math.abs(pct).toFixed(1) + '%</span>';
}

function pintarPerf() {
  var z = document.getElementById('com-perf');
  if (!z || !PER.perf) return;

  var d = PER.perf, prev = PER.perfPrev, r = PER.rango;
  var mr  = d.totalVentas > 0 ? d.totalMargen / d.totalVentas * 100 : 0;
  var mrP = (prev && prev.totalVentas > 0) ? prev.totalMargen / prev.totalVentas * 100 : null;
  var porDia = d.totalMargen / Math.max(1, r.dias);
  // Días del período anterior, para comparar margen diario contra diario
  var prevDias = 0;
  if (prev && prev.desde && prev.hasta) {
    prevDias = Math.max(1, Math.round((new Date(prev.hasta) - new Date(prev.desde)) / 864e5) + 1);
  }

  var cel = function (label, valor, dt, color) {
    return '<div class="com-met">' +
             '<div class="ml">' + label + '</div>' +
             '<div class="com-big"' + (color ? ' style="color:' + color + '"' : '') + '>' + valor + '</div>' +
             '<div class="com-sub2">' + (dt || '&nbsp;') + '</div>' +
           '</div>';
  };

  var comparativa = prev
    ? '<div class="ml" style="margin-bottom:12px">Comparado con ' + esc(prev.desde) + ' a ' + esc(prev.hasta) + '</div>'
    : '';

  var etq = (PER.meses || []).slice().sort(function (a, b) { return a - b; })
              .map(function (m) { return MESES_CORTO[m - 1]; }).join(', ');

  z.innerHTML = '<div class="card">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<div class="ct" style="margin:0">Resumen del período</div>' +
      selectorMesResumen() +
    '</div>' +
    '<div class="ml" style="margin-bottom:6px">' + esc(r.desde) + ' a ' + esc(r.hasta) + ' · hasta el cierre de ayer</div>' +
    comparativa +
    '<div class="com-mts">' +
      cel('Ventas', fmt(d.totalVentas), prev ? delta(d.totalVentas, prev.totalVentas) : '') +
      cel('Margen', fmt(d.totalMargen), prev ? delta(d.totalMargen, prev.totalMargen) : '', 'var(--gn)') +
      cel('Margen real', mr.toFixed(2) + '%', mrP != null ? delta(mr, mrP) : '', 'var(--gn)') +
      cel('Margen por día', fmt(porDia),
          (prev && prevDias) ? delta(porDia, prev.totalMargen / prevDias) : '', 'var(--gn)') +
      cel('Pedidos', (Number(d.totalOrders) || 0).toLocaleString('es-PE'), prev ? delta(d.totalOrders, prev.totalOrders) : '') +
      cel('Ticket promedio', fmt(d.ticket), prev ? delta(d.ticket, prev.ticket) : '') +
    '</div>' +
  '</div>';
}

/* ── Gráfico histórico en SVG ──────────────────────────────────────── */

function pintarHist() {
  var z = document.getElementById('com-hist');
  if (!z || !PER.hist) return;

  var d = PER.hist;
  var filas = d.rows || [];
  if (!filas.length) { z.innerHTML = ''; return; }

  var niveles = (d.niveles && d.niveles.length) ? d.niveles : [];
  var titulo = 'Margen del equipo · ' + (d.gran === 'day' ? 'por día' : 'por mes');

  z.innerHTML = '<div class="card">' +
    '<div class="ct">' + titulo + '</div>' +
    graficoBarras(filas, niveles) +
  '</div>';
}

/**
 * Barras verticales con líneas de referencia.
 * viewBox fijo + preserveAspectRatio: escala solo al ancho del contenedor.
 */
function graficoBarras(filas, niveles) {
  var W = 900, H = 300;
  var mIzq = 52, mDer = 46, mArr = 14, mAba = 34;
  var ancho = W - mIzq - mDer, alto = H - mArr - mAba;

  var maxDato = Math.max.apply(null, filas.map(function (r) { return r.margen || 0; }));
  var maxNivel = niveles.length ? Math.max.apply(null, niveles.map(function (n) { return n.ref || 0; })) : 0;
  var max = Math.max(maxDato, maxNivel) * 1.12 || 1;

  var y = function (v) { return mArr + alto - (v / max * alto); };
  var paso = ancho / filas.length;
  var wBarra = Math.max(2, Math.min(46, paso * 0.66));

  // Grilla horizontal + escala
  var lineas = '', pasos = 4;
  for (var i = 0; i <= pasos; i++) {
    var val = max / pasos * i, yy = y(val);
    lineas +=
      '<line x1="' + mIzq + '" y1="' + yy + '" x2="' + (W - mDer) + '" y2="' + yy + '" ' +
        'stroke="var(--bd)" stroke-width="1"/>' +
      '<text x="' + (mIzq - 8) + '" y="' + (yy + 4) + '" text-anchor="end" ' +
        'font-size="11" fill="var(--mu)">S/' + Math.round(val / 1000) + 'k</text>';
  }

  // Barras + etiquetas del eje X
  var barras = '', etiquetas = '';
  var saltar = Math.ceil(filas.length / 22);   // no amontonar etiquetas
  filas.forEach(function (r, i) {
    var v = r.margen || 0;
    var x = mIzq + paso * i + (paso - wBarra) / 2;
    var h = Math.max(1, alto - (y(v) - mArr));
    barras += '<rect x="' + x.toFixed(1) + '" y="' + y(v).toFixed(1) + '" ' +
                'width="' + wBarra.toFixed(1) + '" height="' + h.toFixed(1) + '" ' +
                'rx="3" fill="var(--gn)"><title>' + esc(r.label) + ': ' + fmt(v) + '</title></rect>';

    if (i % saltar === 0) {
      var cx = mIzq + paso * i + paso / 2;
      etiquetas += '<text x="' + cx.toFixed(1) + '" y="' + (H - mAba + 16) + '" ' +
                     'text-anchor="middle" font-size="10" fill="var(--mu)">' + esc(r.label) + '</text>';
      if (r.sub) {
        etiquetas += '<text x="' + cx.toFixed(1) + '" y="' + (H - mAba + 28) + '" ' +
                       'text-anchor="middle" font-size="9" fill="var(--mu)">' + esc(r.sub) + '</text>';
      }
    }
  });

  // Líneas de nivel con su monto a la derecha
  var colores = ['var(--am)', 'var(--gn)', 'var(--ac)'];
  var refs = '', leyenda = '';
  niveles.forEach(function (n, i) {
    var yy = y(n.ref || 0);
    if (isNaN(yy) || yy < mArr) return;
    var col = colores[i] || 'var(--mu)';
    refs +=
      '<line x1="' + mIzq + '" y1="' + yy + '" x2="' + (W - mDer) + '" y2="' + yy + '" ' +
        'stroke="' + col + '" stroke-width="2" stroke-dasharray="6 4"/>' +
      '<text x="' + (W - mDer + 5) + '" y="' + (yy + 4) + '" font-size="11" ' +
        'font-weight="600" fill="' + col + '">S/' + Math.round((n.ref || 0) / 1000) + 'k</text>';

    leyenda += '<span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px">' +
                 '<span style="width:14px;height:2px;background:' + col + '"></span>' +
                 '<span class="ml">' + esc(n.label) + '</span>' +
               '</span>';
  });

  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" ' +
              'style="width:100%;height:auto;display:block;overflow:visible" ' +
              'role="img" aria-label="' + titulo + '">' +
      lineas + barras + refs + etiquetas +
    '</svg>' +
    (leyenda ? '<div style="margin-top:12px">' + leyenda + '</div>' : '');
}



/* ══════════════════════════════════════════════════════════════════════
   VER COMO ASESORA
   Un switch en la barra del Panel. Muestra exactamente lo que ve ella
   al entrar a Tulula Comisiones: su bono, su progreso, el ranking.
   Nunca ve sueldos ajenos ni el payroll.
   ══════════════════════════════════════════════════════════════════════ */

function selectorVerComo(cfg) {
  var vend = (cfg && cfg.vendedoras) || {};
  var emails = Object.keys(vend);
  if (!emails.length) return '';

  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 10px;border-radius:var(--r);font-size:13px;font-family:inherit';

  var opts = '<option value="">Admin</option>' +
    emails.map(function (e) {
      return '<option value="' + esc(e) + '"' + (COM.comoEmail === e ? ' selected' : '') + '>' +
             esc(vend[e].nombre) + '</option>';
    }).join('');

  var activo = !!COM.comoEmail;
  return '<span style="display:inline-flex;align-items:center;gap:6px;' +
              'background:var(--bg3);border:1px solid ' + (activo ? 'var(--ac)' : 'var(--bd)') + ';' +
              'border-radius:var(--r);padding:0 4px 0 9px">' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' +
      (activo ? 'var(--ac)' : 'var(--mu)') + '" stroke-width="2" style="flex-shrink:0">' +
      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
    '<select onchange="comVerComo(this.value)" style="background:transparent;border:none;' +
            'color:' + (activo ? 'var(--ac)' : 'var(--tx)') + ';font-size:13px;font-family:inherit;' +
            'padding:7px 4px;cursor:pointer;outline:none">' + opts + '</select>' +
  '</span>';
}

function pintarVerComo(d) {
  var c = cont();
  if (!c) return;

  var cfg = d.cfg || {};
  var meses = d.meses || [];
  var qTxt = etiquetaTrim(d.q, d.year);

  var rows = (d.teamRows || []).map(function (r) {
    return {
      nombre: r.nombre, base: r.base_m || 0,
      mPct: (r.gmPct && r.gmPct > 0) ? r.gmPct : (cfg.gm_pct || 62),
      marginM: r.marginM || [0,0,0], ventasM: r.ventasM || [0,0,0],
      factorM: r.factorM || [1,1,1], sueldoM: r.sueldoM,
    };
  });

  var R = bonoTrim(rows, cfg);
  var P = bonoTrim(rows.map(function (r) {
    return Object.assign({}, r, { marginM: proyectarMargen(r.marginM, meses, d.year) });
  }), cfg);

  var yo   = R.rows.find(function (x) { return x.nombre === d.nombre; }) || R.rows[0];
  var yoP  = P.rows.find(function (x) { return x.nombre === d.nombre; }) || { bono: 0, cumpl: 0 };
  if (!yo) { c.innerHTML = pestañas('home') + '<div class="card"><div class="ml">Sin datos para esta asesora.</div></div>'; return; }

  var col = NIVEL_COLOR[nivelDe(yo.cumpl, R.tiers)];

  // Detalle por mes — solo los meses en que estuvo activa
  var filasMes = meses.map(function (m, j) {
    if (yo.factorM[j] <= 0) return '';
    var cumplMes = yo.metaM[j] > 0 ? yo.marM[j] / yo.metaM[j] * 100 : 0;
    var lv = nivelDe(cumplMes, R.tiers);
    return '<div class="com-row" style="font-size:13px">' +
             '<span>' + MESES_LARGO[m - 1] + '</span>' +
             '<span>' + fmt(yo.marM[j]) + ' · <b style="color:' + NIVEL_COLOR[lv] + '">' + p2(cumplMes) + '</b></span>' +
           '</div>';
  }).join('');

  // Ranking — nombre y porcentaje, sin montos
  var rank = R.rows.map(function (r) { return { nombre: r.nombre, cumpl: r.cumpl }; })
    .sort(function (a, b) { return b.cumpl - a.cumpl; })
    .map(function (r, i) {
      var yoMismo = r.nombre === d.nombre;
      return '<div class="com-row">' +
               '<span style="font-weight:' + (yoMismo ? '700' : '400') + ';' +
                     (yoMismo ? 'color:var(--ac)' : '') + '">' +
                 (i + 1) + '. ' + esc(r.nombre) + (yoMismo ? ' (vos)' : '') + '</span>' +
               '<span style="font-weight:600;color:' + NIVEL_COLOR[nivelDe(r.cumpl, R.tiers)] + '">' +
                 p2(r.cumpl) + '</span>' +
             '</div>';
    }).join('');

  var sig = R.tiers.find(function (t) { return t.from > yo.cumpl; });
  var falta = sig
    ? 'Te faltan <b>' + fmt(Math.max(0, (sig.from / 100 * yo.sumMeta) - yo.sumMar)) +
      '</b> de margen para subir al ' + (R.tiers.indexOf(sig) + 1) + '° nivel (' + sig.rate + '%).'
    : 'Estás en el nivel máximo.';

  c.innerHTML = pestañas('home') +
    '<div class="card" style="border-color:var(--ac);background:var(--bg3)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<div style="font-size:13px">' +
          '<b style="color:var(--ac)">Vista previa</b> — así ve el panel ' + esc(d.nombre) + '. ' +
          'No ve sueldos ajenos ni el costo total.' +
        '</div>' +
        '<button class="btn bg bs" onclick="comVerComo(\'\')">Volver a mi vista</button>' +
      '</div>' +
    '</div>' +

    '<div style="max-width:620px;margin:0 auto">' +
      '<div class="card">' +
        '<div class="com-nom">' + esc(d.nombre) + '</div>' +
        '<div class="com-sub">' + esc(qTxt) + '</div>' +
        '<div style="text-align:center;margin:20px 0 8px">' +
          '<div class="ml">Tu bono del trimestre</div>' +
          '<div style="font-size:36px;font-weight:700;letter-spacing:-1px;' +
               'color:' + (yo.bono > 0 ? 'var(--gn)' : 'var(--mu)') + '">' + f2(yo.bono) + '</div>' +
          '<div class="ml">proyectado al cierre: <b style="color:' +
            (yoP.bono > 0 ? 'var(--gn)' : 'var(--mu)') + '">' + f2(yoP.bono) + '</b></div>' +
        '</div>' +
        '<div class="com-row" style="border:none;font-size:12px;padding:16px 0 6px">' +
          '<span class="com-mut">Cumplimiento del trimestre</span>' +
          '<b style="color:' + col + '">' + p2(yo.cumpl) + '</b>' +
        '</div>' +
        '<div style="margin-top:18px">' + barra(yo.cumpl, 20, col, R.tiers, true) + '</div>' +
        '<div style="font-size:13px;margin-top:18px">' + falta + '</div>' +
        '<div style="font-size:13px;margin-top:10px;font-weight:500;color:' +
             (R.teamGate ? 'var(--gn)' : 'var(--rd)') + '">' +
          (R.teamGate
            ? 'El equipo llegó al mínimo: tu bono está activo.'
            : 'El bono se activa cuando el equipo completo supere el ' + R.gate + '%. Van ' + p2(R.teamCumpl) + '.') +
        '</div>' +
      '</div>' +

      '<div class="card"><div class="ct">Tu margen mes a mes</div>' + filasMes + '</div>' +
      '<div class="card"><div class="ct">Ranking del trimestre</div>' + rank + '</div>' +

      '<div class="card">' +
        '<div style="font-size:13px;line-height:1.9">' +
          '<b>Bono trimestral</b> = Margen del trimestre × % del nivel alcanzado<br>' +
          'El bono se activa siempre y cuando el equipo llegue al menos al <b>1° nivel</b>.<br>' +
          '<b>% por nivel:</b> ' +
          R.tiers.map(function (t, i) {
            return (i + 1) + '° nivel = ' + t.rate + '%';
          }).join(' · ') + '<br>' +
          'Tu meta de margen es <b>' + R.x + '×</b> tu sueldo.' +
        '</div>' +
      '</div>' +
    '</div>';
}


/* ══════════════════════════════════════════════════════════════════════
   SIMULADOR
   Arranca del trimestre real y pregunta en soles, no en porcentajes.
   Tres modos: mover ventas, calcular cuánto falta, y ver el techo de costo.
   ══════════════════════════════════════════════════════════════════════ */

var SIM = { filas: null, xMeta: null, tiers: null, objetivo: {} };

function pintarSim() {
  COM.vista = 'sim';
  var c = cont();
  if (!c) return;

  if (!COM.data) {
    c.innerHTML = pestañas('sim') + '<div class="ld"><div class="sp"></div>Cargando datos reales...</div>';
    traer(COM.year || new Date().getFullYear(), COM.q || Math.ceil((new Date().getMonth() + 1) / 3))
      .then(function () { if (COM.vista === 'sim') pintarSim(); })
      .catch(pintarError);
    return;
  }

  var d = COM.data;
  var cfg = d.cfgFull || {};
  var meses = d.meses || [];

  if (!SIM.filas) {
    SIM.xMeta = cfg.xMeta || 12;
    SIM.tiers = JSON.parse(JSON.stringify((cfg.tiers && cfg.tiers.length) ? cfg.tiers : TIERS_FALLBACK));
    SIM.filas = (d.results || []).map(function (r) {
      var base = r.base_m || 0;
      var marginM = r.marginM || [0,0,0];
      var factorM = r.factorM || [1,1,1];
      var real = marginM.reduce(function (a, b) { return a + (b || 0); }, 0);
      var proy = proyectarMargen(marginM, meses, d.year).reduce(function (a, b) { return a + (b || 0); }, 0);
      return {
        nombre: r.nombre, base: base,
        mPct: (r.gmPct && r.gmPct > 0) ? r.gmPct : (cfg.gm_pct || 62),
        factorM: factorM, sueldoM: r.sueldoM,
        margenReal: real,           // lo que llevan hoy
        margenSim: Math.round(proy), // punto de partida: la proyección
      };
    });
  }

  c.innerHTML = pestañas('sim') +
    tarjetaReglasSim() +
    tarjetaEscenario() +
    tarjetaObjetivos();
}

/** Calcula con los valores simulados, usando el mismo motor que el Panel. */
function calcSim() {
  var filas = SIM.filas.map(function (f) {
    // Repartimos el margen simulado entre los meses activos, respetando el prorrateo
    var activos = f.factorM.filter(function (x) { return x > 0; }).length || 1;
    var porMes = f.margenSim / activos;
    return {
      nombre: f.nombre, base: f.base, mPct: f.mPct,
      factorM: f.factorM, sueldoM: f.sueldoM,
      marginM: f.factorM.map(function (x) { return x > 0 ? porMes : 0; }),
    };
  });
  return bonoTrim(filas, { xMeta: SIM.xMeta, tiers: SIM.tiers });
}

function tarjetaReglasSim() {
  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:6px 9px;border-radius:var(--r);font-size:13px;font-family:inherit';

  var tramos = SIM.tiers.map(function (t, k) {
    return '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
      '<span class="com-mut" style="font-size:12px;min-width:60px">' + (k + 1) + '° nivel</span>' +
      '<span class="com-mut" style="font-size:12px">desde</span>' +
      '<input type="number" value="' + t.from + '" oninput="comSimTier(' + k + ',\'from\',this.value)" ' +
             'style="' + estilo + ';width:64px">' +
      '<span class="com-mut" style="font-size:12px">% → paga</span>' +
      '<input type="number" step="0.1" value="' + t.rate + '" oninput="comSimTier(' + k + ',\'rate\',this.value)" ' +
             'style="' + estilo + ';width:64px">' +
      '<span class="com-mut" style="font-size:12px">% del margen</span>' +
    '</div>';
  }).join('');

  return '<div class="card">' +
    '<div class="ct">Reglas a simular</div>' +
    '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px">' +
      '<span class="com-mut" style="font-size:12px">Meta = </span>' +
      '<input type="number" step="0.5" value="' + SIM.xMeta + '" oninput="comSimX(this.value)" ' +
             'style="' + estilo + ';width:72px">' +
      '<span class="com-mut" style="font-size:12px">× el sueldo, medida en margen</span>' +
    '</div>' +
    '<div style="display:grid;gap:8px">' + tramos + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
      '<button class="btn bg bs" onclick="comSimReset()">Volver a las reglas vigentes</button>' +
      '<button class="btn bp bs" onclick="comSimAplicar()">Aplicar estas reglas de verdad</button>' +
      '<span id="sim-msg" style="font-size:13px"></span>' +
    '</div>' +
    '<div class="ml" style="margin-top:8px">' +
      '"Aplicar" cambia las reglas reales del sistema y queda registrado en la bitácora.' +
    '</div>' +
  '</div>';
}

function tarjetaEscenario() {
  var R = calcSim();
  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 9px;border-radius:var(--r);font-size:13px;font-family:inherit;text-align:right';

  var filas = SIM.filas.map(function (f, i) {
    var r = R.rows[i];
    var lv = nivelDe(r.cumpl, R.tiers);
    var dif = f.margenSim - f.margenReal;
    var difTxt = dif === 0 ? '' :
      '<span style="color:' + (dif > 0 ? 'var(--gn)' : 'var(--rd)') + ';font-size:11px">' +
        (dif > 0 ? '+' : '') + fmt(dif) + ' vs hoy</span>';

    return '<div style="padding:14px 0;border-bottom:1px solid var(--bd)">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">' +
        '<b style="font-size:15px">' + esc(f.nombre) + '</b>' +
        '<span style="font-weight:700;font-size:17px;color:' + (r.bono > 0 ? 'var(--gn)' : 'var(--mu)') + '">' +
          f2(r.bono) + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px">' +
        '<span class="ml">Margen del trimestre S/</span>' +
        '<input type="number" value="' + Math.round(f.margenSim) + '" ' +
               'oninput="comSimMargen(' + i + ',this.value)" style="' + estilo + ';width:120px">' +
        '<span class="ml">→ <b style="color:' + NIVEL_COLOR[lv] + '">' + p2(r.cumpl) + '</b> · tasa ' + r.rate + '%</span>' +
        difTxt +
      '</div>' +
      '<div style="margin-top:10px">' + barra(r.cumpl, 12, NIVEL_COLOR[lv], R.tiers, false) + '</div>' +
    '</div>';
  }).join('');

  var totalBono = R.rows.reduce(function (s, r) { return s + r.bono; }, 0);
  var totalBase = SIM.filas.reduce(function (s, f) { return s + f.base; }, 0);
  var ratio = totalBase > 0 ? totalBono / (totalBase * 3) * 100 : 0;

  return '<div class="card">' +
    '<div class="ct">Escenario</div>' +
    '<div style="font-size:13px;margin-bottom:6px">' +
      'Arranca en la proyección real del trimestre. Cambiá el margen de cada una y mirá qué pasa.' +
    '</div>' + filas +
    '<div class="mts" style="margin-top:16px;margin-bottom:0">' +
      '<div class="mt"><div class="ml">Equipo</div>' +
        '<div class="com-big" style="color:' + NIVEL_COLOR[R.level] + '">' + p2(R.teamCumpl) + '</div>' +
        '<div class="ml" style="margin:5px 0 0">' + NIVEL_NOMBRE[R.level] + '</div></div>' +
      '<div class="mt"><div class="ml">Bono total</div>' +
        '<div class="com-big" style="color:var(--gn)">' + f2(totalBono) + '</div></div>' +
      '<div class="mt"><div class="ml">Costo total</div>' +
        '<div class="com-big">' + fmt(totalBase * 3 + totalBono) + '</div>' +
        '<div class="ml" style="margin:5px 0 0">sueldos × 3 + bono</div></div>' +
      '<div class="mt"><div class="ml">Bono vs sueldos</div>' +
        '<div class="com-big"' + (ratio > 100 ? ' style="color:var(--am)"' : '') + '>' + p2(ratio) + '</div></div>' +
    '</div>' +
  '</div>';
}

/** Cálculo inverso: cuánto margen hace falta para un bono dado. */
function margenParaBono(objetivo, sumMeta, tiers) {
  for (var k = tiers.length - 1; k >= 0; k--) {
    var t = tiers[k];
    if (!(t.rate > 0)) continue;
    var mar = objetivo / (t.rate / 100);
    var cumpl = sumMeta > 0 ? mar / sumMeta * 100 : 0;
    if (cumpl >= t.from) return { margen: mar, cumpl: cumpl, rate: t.rate, nivel: k + 1 };
  }
  return null;
}

function tarjetaObjetivos() {
  var R = calcSim();
  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 9px;border-radius:var(--r);font-size:13px;font-family:inherit;text-align:right';

  var filas = SIM.filas.map(function (f, i) {
    var r = R.rows[i];

    // Cuánto falta para cada nivel que todavía no alcanzó
    var pasos = R.tiers.filter(function (t) { return t.from > r.cumpl; }).map(function (t) {
      var necesario = t.from / 100 * r.sumMeta;
      var faltaMargen = Math.max(0, necesario - r.sumMar);
      var faltaVenta = f.mPct > 0 ? faltaMargen / (f.mPct / 100) : 0;
      var bonoAhi = t.rate / 100 * necesario;
      return '<div class="com-row" style="font-size:12px">' +
               '<span class="com-mut">Para el ' + (R.tiers.indexOf(t) + 1) + '° nivel (' + t.rate + '%)</span>' +
               '<span>+' + fmt(faltaMargen) + ' de margen · ≈' + fmt(faltaVenta) + ' de venta → ' +
                 '<b style="color:var(--gn)">' + f2(bonoAhi) + '</b></span>' +
             '</div>';
    }).join('');

    var obj = SIM.objetivo[f.nombre];
    var resObj = '';
    if (obj) {
      var m = margenParaBono(obj, r.sumMeta, R.tiers);
      resObj = m
        ? '<div class="ml" style="margin-top:8px;line-height:1.6">Para ganar <b>' + f2(obj) + '</b> ' +
          'necesita <b style="color:var(--tx)">' + fmt(m.margen) + '</b> de margen (' + p2(m.cumpl) + ', ' +
          m.nivel + '° nivel). Le faltan <b style="color:var(--gn)">' +
          fmt(Math.max(0, m.margen - r.sumMar)) + '</b>.</div>'
        : '<div class="ml" style="margin-top:8px;color:var(--am)">Ese monto queda debajo del primer nivel: ' +
          'no se alcanza con los tramos actuales.</div>';
    }

    return '<div style="padding:14px 0;border-bottom:1px solid var(--bd)">' +
      '<b style="font-size:14px">' + esc(f.nombre) + '</b>' +
      (pasos || '<div class="ml" style="margin-top:6px">Está en el nivel máximo.</div>') +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px">' +
        '<span class="ml">¿Cuánto para ganar S/</span>' +
        '<input type="number" value="' + (obj || '') + '" placeholder="3000" ' +
               'oninput="comSimObjetivo(\'' + esc(f.nombre) + '\',this.value)" style="' + estilo + ';width:100px">' +
        '<span class="ml">?</span>' +
      '</div>' + resObj +
    '</div>';
  }).join('');

  // Techo: todas en el nivel máximo
  var tope = R.tiers[R.tiers.length - 1];
  var costoTope = R.rows.reduce(function (s, r) {
    return s + (tope.rate / 100) * (tope.from / 100 * r.sumMeta);
  }, 0);
  var baseTot = SIM.filas.reduce(function (s, f) { return s + f.base; }, 0);

  return '<div class="card">' +
    '<div class="ct">Cuánto falta y cuánto cuesta</div>' + filas +
    '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--bd);font-size:13px;line-height:1.8">' +
      'Si <b>todas</b> llegaran justo al ' + tope.from + '% (nivel máximo), el bono del trimestre sería ' +
      '<b style="color:var(--gn)">' + f2(costoTope) + '</b> contra ' + fmt(baseTot * 3) + ' de sueldos: ' +
      '<b>' + p2(baseTot > 0 ? costoTope / (baseTot * 3) * 100 : 0) + '</b> de la planilla.<br>' +
      '<span class="com-mut">Ese es el techo de costo con las reglas simuladas.</span>' +
    '</div>' +
  '</div>';
}


/* ══════════════════════════════════════════════════════════════════════
   CONFIGURACIÓN
   ══════════════════════════════════════════════════════════════════════ */

function pintarConfig() {
  COM.vista = 'config';
  var c = cont();
  if (!c) return;

  if (!COM.data) {
    c.innerHTML = pestañas('config') + '<div class="ld"><div class="sp"></div>Cargando configuración...</div>';
    traer(COM.year || new Date().getFullYear(), COM.q || Math.ceil((new Date().getMonth() + 1) / 3))
      .then(function () { if (COM.vista === 'config') pintarConfig(); })
      .catch(pintarError);
    return;
  }

  var cfg = COM.data.cfgFull || {};
  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 10px;border-radius:var(--r);font-size:13px;font-family:inherit';

  var vend = cfg.vendedoras || {};
  var filasVend = Object.keys(vend).map(function (email, i) {
    return filaVendedora(email, vend[email], i, estilo);
  }).join('');

  var tramos = (cfg.tiers || TIERS_FALLBACK).map(function (t, k) {
    return (k + 1) + '° nivel: desde ' + t.from + '% → paga ' + t.rate + '% del margen';
  }).join('<br>');

  c.innerHTML = pestañas('config') +
    '<div class="card">' +
      '<div class="ct">Reglas de comisión</div>' +
      '<div style="font-size:13px;line-height:1.9;background:var(--bg3);border:1px solid var(--bd);' +
           'border-radius:var(--r);padding:12px 14px">' +
        'Meta = <b>' + (cfg.xMeta || 12) + '×</b> el sueldo, medida en margen<br>' + tramos +
      '</div>' +
      '<div class="ml" style="margin-top:10px">' +
        'Las reglas se cambian desde el <b>Simulador</b>, donde podés ver el efecto antes de aplicarlas.' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="ct">Asesoras</div>' +
      '<div style="font-size:13px;margin-bottom:14px">' +
        'Quién entra al cálculo de comisiones. El correo es con el que inicia sesión en Tulula Comisiones.' +
      '</div>' +
      '<div id="cfg-vend">' + filasVend + '</div>' +
      '<button class="btn bg bs" onclick="comCfgAgregar()" style="margin-top:10px">Agregar asesora</button>' +
    '</div>' +

    '<div class="card">' +
      '<div class="ct">Administradores</div>' +
      '<div style="font-size:13px;margin-bottom:10px">' +
        'Correos que pueden ver y cerrar comisiones. Separados por coma.<br>' +
        '<span class="com-mut">Además necesitan rol Administrador en la hoja Usuarios del ERP.</span>' +
      '</div>' +
      '<input id="cfg-admin" type="text" value="' + esc((cfg.admin || []).join(', ')) + '" ' +
             'style="' + estilo + ';width:100%;max-width:520px">' +
    '</div>' +

    '<div class="card">' +
      '<div class="ct">Cálculo del margen</div>' +
      '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">' +
        '<select id="cfg-gmmode" style="' + estilo + '">' +
          '<option value="real"' + (cfg.gm_mode === 'real' ? ' selected' : '') + '>Costo real (hoja Cost)</option>' +
          '<option value="fijo"' + (cfg.gm_mode === 'fijo' ? ' selected' : '') + '>Porcentaje fijo</option>' +
        '</select>' +
        '<span class="com-mut" style="font-size:12px">Margen % para prendas sin costo cargado</span>' +
        '<input id="cfg-gm" type="number" step="0.1" value="' + (cfg.gm_pct || 62) + '" style="' + estilo + ';width:80px">' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<button class="btn bp" onclick="comCfgGuardar()">Guardar configuración</button>' +
        '<button class="btn bg" id="cfg-reset" onclick="comCfgReset()">Restaurar valores de fábrica</button>' +
        '<span id="cfg-msg" style="font-size:13px"></span>' +
      '</div>' +
    '</div>';
}

function filaVendedora(email, v, i, estilo) {
  v = v || { nombre: '', b: 0, desde: '' };
  return '<div class="cfg-v" style="border:1px solid var(--bd);border-radius:var(--r2);' +
              'padding:14px;margin-bottom:10px;position:relative">' +
    '<button onclick="this.parentNode.remove()" title="Quitar" ' +
            'style="position:absolute;top:10px;right:12px;background:none;border:none;' +
            'color:var(--mu);cursor:pointer;font-size:18px;line-height:1">×</button>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">' +
      '<div><div class="ml" style="margin-bottom:3px">Nombre</div>' +
        '<input class="cv-nombre" value="' + esc(v.nombre || '') + '" style="' + estilo + ';width:100%"></div>' +
      '<div><div class="ml" style="margin-bottom:3px">Correo</div>' +
        '<input class="cv-email" value="' + esc(email || '') + '" placeholder="correo@gmail.com" ' +
               'style="' + estilo + ';width:100%"></div>' +
      '<div><div class="ml" style="margin-bottom:3px">Sueldo base</div>' +
        '<input class="cv-base" type="number" value="' + (v.b || 0) + '" style="' + estilo + ';width:100%"></div>' +
      '<div><div class="ml" style="margin-bottom:3px">Fecha de ingreso</div>' +
        '<input class="cv-desde" type="date" value="' + esc(v.desde || '') + '" style="' + estilo + ';width:100%"></div>' +
    '</div>' +
  '</div>';
}


/* ══════════════════════════════════════════════════════════════════════
   API PÚBLICA — lo único que sale del módulo
   ══════════════════════════════════════════════════════════════════════ */

window.loadComisiones = cargar;

/* ── Navegación interna ── */
window.comIr = function (vista) {
  if (vista === 'cierre') pintarCierre();
  else if (vista === 'asesoras') pintarAsesoras();
  else if (vista === 'sim') pintarSim();
  else if (vista === 'config') pintarConfig();
  else { COM.comoEmail = ''; cargar(); }
};

/**
 * Precarga las otras pestañas en segundo plano.
 * Se dispara cuando el Panel ya terminó de cargar: para cuando el usuario
 * toca una pestaña, los datos ya están.
 */
function precargarPestanas() {
  if (precargarPestanas._hecho) return;
  precargarPestanas._hecho = true;
  if (ASE.data && CIERRE.cargado) return;   // bootstrap ya trajo todo

  var year = COM.year || new Date().getFullYear();

  // Asesoras
  if (!ASE.data) {
    comApi('asesoraMes', { year: year })
      .then(function (d) { ASE.data = d; ASE.year = year; })
      .catch(function () {});
  }

  // Cierre: las tres listas de una
  if (!CIERRE.cargado) {
    Promise.all([
      comApi('cierresTrim', { limite: 8 }).catch(function () { return []; }),
      comApi('cierres',     { limite: 12 }).catch(function () { return []; }),
      comApi('reglasLog',   { limite: 10 }).catch(function () { return []; }),
    ]).then(function (r) {
      CIERRE.cerradosTrim = r[0] || [];
      CIERRE.cerradosMes  = r[1] || [];
      CIERRE.log          = r[2] || [];
      CIERRE.cargado = true;
    }).catch(function () {});
  }
}
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
  var el = document.getElementById('com-periodo');
  if (!el) return;
  var p = String(el.value).split('-');
  COM.year = Number(p[0]);
  COM.q    = Number(p[1]);
  PER.meses = null;    // el resumen vuelve al trimestre completo
  COM.data = null;
  COM.traidoEn = null;
  // Asesoras depende del año: si cambió, hay que releerla
  if (ASE.year !== COM.year) { ASE.data = null; ASE.year = COM.year; }
  cargar();   // usa caché si ya vio ese período antes
};

// Lo llama el botón de recarga del ERP: tira todo lo guardado y vuelve a pedir
window._comReset = function () {
  COM.data = null;
  COM.traidoEn = null;
  ASE.data = null;
  CIERRE.cargado = false;
  PER.perf = null; PER.perfPrev = null; PER.hist = null;
  cacheBorrar();
};

// Engancharse al botón de recarga del ERP sin tocar su código:
// si _refrescarModulo existe, lo envolvemos para que también limpie lo nuestro.
(function engancharRefrescar() {
  if (typeof window._refrescarModulo !== 'function' || window._refrescarModulo._comHook) return;
  var original = window._refrescarModulo;
  var envuelto = function (pg) {
    if (pg === 'comisiones') {
      window._comReset();
      if (COM.vista === 'cierre') { pintarCierre(); return; }
      if (COM.vista === 'asesoras') { pintarAsesoras(); return; }
      cargar(true);
      return;
    }
    return original.apply(this, arguments);
  };
  envuelto._comHook = true;
  window._refrescarModulo = envuelto;
})();



/* ── Asesoras ── */

window.comAseAno = function (y) {
  ASE.year = Number(y);
  ASE.data = null;
  pintarAsesoras();
};

window.comAseToggle = function (idx) {
  if (ASE.abiertas[idx]) delete ASE.abiertas[idx];
  else ASE.abiertas[idx] = true;
  pintarAsesoras();
};

window.comAseAvanzado = function (idx) {
  if (ASE.avanzado[idx]) delete ASE.avanzado[idx];
  else ASE.avanzado[idx] = true;
  pintarAsesoras();
};

/** Devuelve la asesora por índice, o null. */
function aseDe(idx) {
  return (ASE.data && ASE.data.asesoras && ASE.data.asesoras[idx]) || null;
}

/** Enciende o apaga un mes. Sin recargar: solo cambia el aspecto. */
window.comAseMes = function (id) {
  var b = document.getElementById('as-act-' + id);
  if (!b) return;
  var on = b.getAttribute('data-on') !== '1';
  b.setAttribute('data-on', on ? '1' : '0');
  b.textContent = on ? 'Activo' : 'Inactivo';
  b.style.background  = on ? 'var(--gn)' : 'transparent';
  b.style.color       = on ? '#fff' : 'var(--mu)';
  b.style.borderColor = on ? 'var(--gn)' : 'var(--bd)';
  var box = document.getElementById('as-box-' + id);
  if (box) box.setAttribute('style', estiloMes(on));
};

window.comAseEstado = function (idx) {
  var b = document.getElementById('as-est-a' + idx);
  if (!b) return;
  var on = b.getAttribute('data-on') !== '1';
  b.setAttribute('data-on', on ? '1' : '0');
  b.textContent = on ? 'Activa' : 'Inactiva';
  b.style.background  = on ? 'var(--gn)' : 'var(--rd)';
  b.style.borderColor = on ? 'var(--gn)' : 'var(--rd)';
};

/** Recalcula la meta al vuelo mientras se escribe el sueldo. */
window.comAseMeta = function (id) {
  var el = document.getElementById('as-suel-' + id);
  if (!el) return;
  var sug = Number(el.getAttribute('data-sug')) || 0;
  var v = el.value !== '' ? Number(el.value) : sug;
  var x = (ASE.data && ASE.data.xMeta) || 12;
  var out = document.getElementById('as-meta-' + id);
  if (out) out.textContent = fmt(Math.round(x * v));
};

window.comAseGuardar = function (idx) {
  var a = aseDe(idx);
  if (!a) return;
  var K = 'a' + idx;
  var email = a.email;

  var val = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  var num = function (id) { var v = val(id); return v === '' ? null : Number(v); };

  var master = {
    desde:  val('as-desde-' + K),
    base:   Number(val('as-base-' + K)) || 0,
    estado: document.getElementById('as-est-' + K).getAttribute('data-on') === '1'
            ? 'activa' : 'inactiva',
  };

  var meses = (a.meses || []).map(function (m) {
    var id = K + '-' + m.mes;
    return {
      mes:      m.mes,
      sueldo:   num('as-suel-' + id),
      activo:   document.getElementById('as-act-' + id).getAttribute('data-on') === '1',
      ventaOv:  num('as-vov-' + id),
      margenOv: num('as-mov-' + id),
      bonoOv:   num('as-bov-' + id),
      nota:     val('as-nota-' + id),
    };
  });

  var msg = document.getElementById('as-msg-' + K);
  if (msg) { msg.style.color = 'var(--mu)'; msg.textContent = 'Guardando...'; }

  comApi('saveAsesoraFull', { email: email, year: ASE.year, master: master, meses: meses })
    .then(function (d) {
      ASE.data = d;
      COM.data = null;      // el panel cambió: hay que recalcularlo
      cacheBorrar();
      pintarAsesoras();
      var m2 = document.getElementById('as-msg-' + K);
      if (m2) { m2.style.color = 'var(--gn)'; m2.textContent = 'Guardado'; }
    })
    .catch(function (e) {
      if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = (e && e.message) || e; }
    });
};

/** Borra los ajustes del año y vuelve a los valores automáticos. */
window.comAseReset = function (idx) {
  var a = aseDe(idx);
  if (!a) return;
  var K = 'a' + idx, email = a.email;
  var b = document.getElementById('as-reset-' + K);
  if (!b) return;

  // Confirmación en dos pasos: el primer clic arma, el segundo ejecuta
  if (b.getAttribute('data-armed') !== '1') {
    b.setAttribute('data-armed', '1');
    b.textContent = 'Confirmar: borra todo el año';
    b.style.color = 'var(--rd)';
    b.style.borderColor = 'var(--rd)';
    clearTimeout(b._t);
    b._t = setTimeout(function () {
      b.setAttribute('data-armed', '0');
      b.textContent = 'Restablecer el año';
      b.style.color = '';
      b.style.borderColor = '';
    }, 4000);
    return;
  }

  clearTimeout(b._t);
  b.textContent = 'Restableciendo...';
  b.disabled = true;

  comApi('delAsesoraAnio', { email: email, year: ASE.year })
    .then(function (d) {
      ASE.data = d;
      COM.data = null;
      cacheBorrar();
      pintarAsesoras();
    })
    .catch(function (e) {
      b.disabled = false;
      b.setAttribute('data-armed', '0');
      b.textContent = 'Restablecer el año';
      var msg = document.getElementById('as-msg-' + K);
      if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = (e && e.message) || e; }
    });
};

/* ── Filtro de período del resumen ── */

/** Cambia el resumen entre todo el trimestre y un mes suelto. */
window.comMesResumen = function (v) {
  var m = Number(v) || 0;
  PER.meses = m ? [m] : null;
  PER.perf = null; PER.perfPrev = null; PER.hist = null;
  cargarPeriodo('meses');
};

window.comCargarResumen = function () {
  PER.perf = null; PER.perfPrev = null; PER.hist = null;
  cargarPeriodo('meses');
};

window.comPeriodo = function (modo) {
  if (modo === 'custom') { pintarCustom(); return; }
  PER.perf = null; PER.perfPrev = null; PER.hist = null;
  PER.modo = modo;
  var f = document.getElementById('com-filtros');
  if (f) f.outerHTML = filtrosPeriodo();
  cargarPeriodo(modo);
};

function pintarCustom() {
  PER.modo = 'custom';
  var hoy = new Date();
  var ini = iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  var fin = iso(hoy);
  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 10px;border-radius:var(--r);font-size:13px;font-family:inherit';

  var z = document.getElementById('com-perf');
  if (!z) return;
  var f = document.getElementById('com-filtros');
  if (f) f.outerHTML = filtrosPeriodo();

  document.getElementById('com-hist').innerHTML = '';
  document.getElementById('com-perf').innerHTML =
    '<div class="card">' +
      '<div class="ct">Rango personalizado</div>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<input type="date" id="com-d1" value="' + ini + '" style="' + estilo + '">' +
        '<span class="com-mut">a</span>' +
        '<input type="date" id="com-d2" value="' + fin + '" style="' + estilo + '">' +
        '<button class="btn bp bs" onclick="comAplicarCustom()">Aplicar</button>' +
      '</div>' +
    '</div>';
}

window.comAplicarCustom = function () {
  var a = document.getElementById('com-d1').value;
  var b = document.getElementById('com-d2').value;
  if (!a || !b) return;
  if (a > b) {
    document.getElementById('com-perf').innerHTML +=
      '<div class="ml" style="color:var(--rd);margin-top:8px">La fecha inicial es posterior a la final.</div>';
    return;
  }
  PER.perf = null; PER.perfPrev = null; PER.hist = null;
  cargarPeriodo('custom', a, b);
};

/* ── Ver como asesora ── */

window.comVerComo = function (email) {
  COM.comoEmail = email || '';
  if (!email) { cargar(); return; }
  var c = cont();
  if (c) c.innerHTML = pestañas('home') + '<div class="ld"><div class="sp"></div>Cargando su vista...</div>';
  comApi('vendedora', { year: COM.year, q: COM.q, asesora: email })
    .then(function (d) {
      if (COM.comoEmail !== email) return;   // ya cambió de selección
      if (d && d.isAdmin) { pintarError(new Error('Ese correo es de un administrador, no de una asesora.')); return; }
      pintarVerComo(d);
    })
    .catch(pintarError);
};

/* ── Simulador ── */

window.comSimX = function (v) {
  SIM.xMeta = Number(v) || 1;
  pintarSim();
};

window.comSimTier = function (i, campo, v) {
  SIM.tiers[i][campo] = Number(v) || 0;
  pintarSim();
};

window.comSimMargen = function (i, v) {
  SIM.filas[i].margenSim = Number(v) || 0;
  pintarSim();
};

window.comSimObjetivo = function (nombre, v) {
  if (v === '') delete SIM.objetivo[nombre];
  else SIM.objetivo[nombre] = Number(v) || 0;
  pintarSim();
};

window.comSimReset = function () {
  SIM.filas = null;
  SIM.objetivo = {};
  pintarSim();
};

window.comSimAplicar = function () {
  var msg = document.getElementById('sim-msg');

  // Confirmación en dos pasos: cambia las reglas de pago reales
  var btn = document.querySelector('button[onclick="comSimAplicar()"]');
  if (btn && btn.getAttribute('data-armed') !== '1') {
    btn.setAttribute('data-armed', '1');
    btn.textContent = 'Confirmar: cambia el pago real';
    btn.classList.remove('bp');
    btn.style.background = 'var(--rd)';
    btn.style.color = '#fff';
    setTimeout(function () {
      if (!btn) return;
      btn.setAttribute('data-armed', '0');
      btn.textContent = 'Aplicar estas reglas de verdad';
      btn.classList.add('bp');
      btn.style.background = '';
    }, 4000);
    return;
  }

  if (msg) { msg.style.color = 'var(--mu)'; msg.textContent = 'Guardando...'; }
  comApi('saveCfg', { patch: { xMeta: SIM.xMeta, tiers: SIM.tiers } })
    .then(function () {
      COM.data = null;
      cacheBorrar();
      if (msg) { msg.style.color = 'var(--gn)'; msg.textContent = 'Reglas aplicadas'; }
      setTimeout(function () { SIM.filas = null; cargar(true); }, 600);
    })
    .catch(function (e) {
      if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = (e && e.message) || e; }
    });
};

/* ── Configuración ── */

window.comCfgAgregar = function () {
  var estilo = 'background:var(--bg3);border:1px solid var(--bd);color:var(--tx);' +
               'padding:7px 10px;border-radius:var(--r);font-size:13px;font-family:inherit';
  var w = document.createElement('div');
  w.innerHTML = filaVendedora('', null, Date.now(), estilo);
  document.getElementById('cfg-vend').appendChild(w.firstChild);
};

window.comCfgGuardar = function () {
  var msg = document.getElementById('cfg-msg');
  var vend = {};
  var errores = [];

  Array.prototype.forEach.call(document.querySelectorAll('#cfg-vend .cfg-v'), function (row) {
    var email  = (row.querySelector('.cv-email').value || '').trim().toLowerCase();
    var nombre = (row.querySelector('.cv-nombre').value || '').trim();
    if (!email && !nombre) return;                       // fila vacía: se ignora
    if (!email || !nombre) { errores.push('Falta nombre o correo en una fila.'); return; }
    if (email.indexOf('@') < 0) { errores.push('Correo inválido: ' + email); return; }
    if (vend[email]) { errores.push('Correo repetido: ' + email); return; }
    vend[email] = {
      nombre: nombre,
      b: Number(row.querySelector('.cv-base').value) || 0,
      t: 0, tp: 'planilla',
      desde: (row.querySelector('.cv-desde').value || '').trim(),
    };
  });

  if (errores.length) {
    if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = errores[0]; }
    return;
  }
  if (!Object.keys(vend).length) {
    if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = 'Tiene que haber al menos una asesora.'; }
    return;
  }

  var admins = document.getElementById('cfg-admin').value
                 .split(',').map(function (s) { return s.trim().toLowerCase(); })
                 .filter(Boolean);
  if (!admins.length) {
    if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = 'Tiene que haber al menos un administrador.'; }
    return;
  }

  var patch = {
    vendedoras: vend,
    admin: admins,
    gm_mode: document.getElementById('cfg-gmmode').value,
    gm_pct: Number(document.getElementById('cfg-gm').value) || 62,
  };

  if (msg) { msg.style.color = 'var(--mu)'; msg.textContent = 'Guardando...'; }
  comApi('saveCfg', { patch: patch })
    .then(function () {
      COM.data = null; ASE.data = null;
      cacheBorrar();
      if (msg) { msg.style.color = 'var(--gn)'; msg.textContent = 'Guardado'; }
      setTimeout(function () { cargar(true); setTimeout(pintarConfig, 900); }, 400);
    })
    .catch(function (e) {
      if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = (e && e.message) || e; }
    });
};

window.comCfgReset = function () {
  var b = document.getElementById('cfg-reset');
  var msg = document.getElementById('cfg-msg');
  if (!b) return;

  if (b.getAttribute('data-armed') !== '1') {
    b.setAttribute('data-armed', '1');
    b.textContent = 'Confirmar: borra toda la configuración';
    b.style.color = 'var(--rd)';
    b.style.borderColor = 'var(--rd)';
    clearTimeout(b._t);
    b._t = setTimeout(function () {
      b.setAttribute('data-armed', '0');
      b.textContent = 'Restaurar valores de fábrica';
      b.style.color = ''; b.style.borderColor = '';
    }, 4000);
    return;
  }

  clearTimeout(b._t);
  b.disabled = true;
  b.textContent = 'Restaurando...';
  comApi('resetCfg', {})
    .then(function () {
      COM.data = null; ASE.data = null; SIM.filas = null;
      cacheBorrar();
      cargar(true);
      setTimeout(pintarConfig, 900);
    })
    .catch(function (e) {
      b.disabled = false;
      b.setAttribute('data-armed', '0');
      b.textContent = 'Restaurar valores de fábrica';
      if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = (e && e.message) || e; }
    });
};


})();
