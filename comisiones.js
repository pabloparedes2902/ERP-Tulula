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
  desglose: null,  // índice de la asesora con el desglose abierto
  historico: null, // margen mensual, para detectar desviaciones
};

/* ── Caché de sesión ────────────────────────────────────────────────
   Guarda la respuesta en sessionStorage para que volver al módulo sea
   instantáneo. Se borra al cerrar la pestaña, así que nunca queda data
   salarial en el disco del navegador.
   Estrategia: pintar lo guardado al instante y refrescar por detrás.  */

function claveCache(year, q) { return 'com_' + year + '_q' + q; }
function claveCacheResumen(year, q) { return 'comres_' + year + '_q' + q; }

function cacheLeer(year, q) {
  try {
    // 1º la pestaña actual; 2º el disco (2-ago: para que el panel abra al
    // instante también tras reiniciar el navegador; solo laptop del admin).
    var raw = sessionStorage.getItem(claveCache(year, q)) ||
              ((typeof MY_ROLE === 'undefined' || MY_ROLE === 'Administrador')
                ? localStorage.getItem(claveCache(year, q)) : null);
    if (!raw) return null;
    var o = JSON.parse(raw);
    if (!o || !o.data) return null;
    if (o.t && Date.now() - o.t > 24 * 60 * 60 * 1000) return null;  // >24h: viejo
    return o;
  } catch (e) { return null; }
}

function cacheGuardar(year, q, data) {
  try {
    var pack = JSON.stringify({ data: data, t: Date.now() });
    sessionStorage.setItem(claveCache(year, q), pack);
    if (typeof MY_ROLE === 'undefined' || MY_ROLE === 'Administrador') {
      localStorage.setItem(claveCache(year, q), pack);
    }
  } catch (e) {}   // cuota llena o modo privado: seguimos sin caché
}

/** Restaura esquema (sueldos/factores) y cierres desde el disco del admin,
 *  para que "Ver como" y las tarjetas de cierres funcionen sin esperar al
 *  bootstrap de Apps Script. */
function extrasRestaurar(year) {
  try {
    if (ASE.data && CIERRE.cerradosTrim.length && EXTRA.cfgFull) return;
    var raw = localStorage.getItem('com_extra_' + year);
    if (!raw) return;
    var o = JSON.parse(raw);
    if (!o || !o.t || Date.now() - o.t > 24 * 60 * 60 * 1000) return;
    if (o.ase && !ASE.data) { ASE.data = o.ase; ASE.year = year; }
    if (o.cierresTrim && !CIERRE.cerradosTrim.length) CIERRE.cerradosTrim = o.cierresTrim;
    if (o.cierresMes && !CIERRE.cerradosMes.length)  CIERRE.cerradosMes  = o.cierresMes;
    if (o.cfgFull && !EXTRA.cfgFull) EXTRA.cfgFull = o.cfgFull;
  } catch (e) {}
}

function cacheBorrar() {
  try {
    [sessionStorage, localStorage].forEach(function (st) {
      Object.keys(st)
        .filter(function (k) { return k.indexOf('com_') === 0 || k.indexOf('comres_') === 0; })
        .forEach(function (k) { st.removeItem(k); });
    });
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
var COM_CELESTE = '#38bdf8';   // 3er nivel: celeste, se distingue mejor del morado del ERP
var NIVEL_COLOR  = ['var(--rd)', 'var(--am)', 'var(--gn)', COM_CELESTE];
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

function posBarra(v) { return Math.max(0, Math.min(100, (v || 0) / BARRA_TOPE * 100)); }

/**
 * Zonas de color del fondo. Salen de los tramos configurados, así que si
 * cambian los niveles, las zonas se mueven con ellos.
 * Rojo bajo el piso · ámbar 1° nivel · verde 2° · violeta 3°.
 */
function zonasBarra(tiers) {
  var t = (tiers && tiers.length) ? tiers : TIERS_FALLBACK;
  var piso = t[0] ? t[0].from : 75;
  var medio = t[1] ? t[1].from : 100;
  var alto = t[2] ? t[2].from : 125;

  return [
    { desde: 0,     hasta: piso,        color: 'var(--rd)' },
    { desde: piso,  hasta: medio,       color: 'var(--am)' },
    { desde: medio, hasta: alto,        color: 'var(--gn)' },
    { desde: alto,  hasta: BARRA_TOPE,  color: COM_CELESTE },
  ];
}

/**
 * Barra de cumplimiento.
 * Fondo dividido en zonas tenues (dónde estaría cada nivel), progreso sólido
 * encima, y una marca cada 25% para ubicarse.
 */
function barra(cumpl, alto, color, tiers, conMarcas) {
  var t = (tiers && tiers.length) ? tiers : TIERS_FALLBACK;

  // Fondo por zonas
  var fondo = zonasBarra(t).map(function (z) {
    var izq = z.desde / BARRA_TOPE * 100;
    var ancho = (z.hasta - z.desde) / BARRA_TOPE * 100;
    return '<div style="position:absolute;left:' + izq + '%;width:' + ancho + '%;' +
           'top:0;bottom:0;background:' + z.color + ';opacity:.16"></div>';
  }).join('');

  // Marcas cada 25%
  var marcas = '';
  if (conMarcas) {
    for (var p = 25; p < BARRA_TOPE; p += 25) {
      var x = p / BARRA_TOPE * 100;
      var esNivel = t.some(function (tt) { return tt.from === p; });
      marcas +=
        '<div style="position:absolute;left:' + x + '%;top:0;bottom:0;width:1px;' +
             'background:var(--bd2);opacity:' + (esNivel ? '.9' : '.4') + '"></div>' +
        '<div style="position:absolute;left:' + x + '%;top:100%;transform:translateX(-50%);' +
             'margin-top:3px;font-size:9px;color:var(--mu);' +
             (esNivel ? 'font-weight:600' : '') + '">' + p + '%</div>';
    }
  }

  return '<div class="com-bar" style="height:' + alto + 'px;' +
              (conMarcas ? 'margin-bottom:16px' : '') + '">' +
    '<div class="com-bar-bg">' + fondo +
      '<div class="com-bar-fill" style="width:' + posBarra(cumpl) + '%;background:' + color + '"></div>' +
    '</div>' +
    (conMarcas ? '<div class="com-bar-mks">' + marcas + '</div>' : '') +
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
    '.com-bar-fill{position:absolute;left:0;top:0;bottom:0;border-radius:var(--r);transition:width .5s ease;z-index:2}',
    '.com-bar-mks{position:absolute;inset:0;pointer-events:none;z-index:3}',
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
'.com-mts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;align-items:stretch}',
    '@media(min-width:700px){.com-mts{grid-template-columns:repeat(3,1fr)}}',
    '@media(min-width:1000px){.com-mts{grid-template-columns:repeat(5,1fr)}}',
    '@media(min-width:1000px){.com-mts.com-mts-6{grid-template-columns:repeat(6,1fr)}}',
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

  // FASE 1 asesoras (2-ago): si quien entra es una asesora (el login del ERP
  // la reconoció y guardó su nombre en MY_ASESORA), ve SU vista, no la admin.
  if (typeof window.MY_ASESORA !== 'undefined' && window.MY_ASESORA) {
    return vendCargar(forzar);
  }

  var hoy = new Date();
  COM.year = COM.year || hoy.getFullYear();
  COM.q    = COM.q    || Math.ceil((hoy.getMonth() + 1) / 3);

  // 1) En memoria
  if (COM.data && !forzar) { pintarHome(); refrescarDetras(); return; }

  // 2) En caché de sesión (o del disco, tras reiniciar el navegador)
  if (!forzar) {
    var c = cacheLeer(COM.year, COM.q);
    if (c) {
      COM.data = c.data;
      COM.traidoEn = c.t;
      extrasRestaurar(COM.year);
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
    if (b.historico) COM.historico = b.historico;
    if (b.cierresTrim || b.cierresMes || b.reglasLog) {
      CIERRE.cerradosTrim = b.cierresTrim || [];
      CIERRE.cerradosMes  = b.cierresMes  || [];
      CIERRE.log          = b.reglasLog   || [];
      CIERRE.cargado = true;
    }
    // 2-ago: guardar esquema y cierres en el disco del admin para que la
    // vista abra completa al instante incluso tras reiniciar el navegador.
    try {
      if (typeof MY_ROLE === 'undefined' || MY_ROLE === 'Administrador') {
        localStorage.setItem('com_extra_' + year, JSON.stringify({
          t: Date.now(), ase: b.asesoras || null,
          cfgFull: (b.admin && b.admin.cfgFull) || null,
          cierresTrim: b.cierresTrim || [], cierresMes: b.cierresMes || [] }));
      }
    } catch (e) {}
    // Si el admin está en "Ver como" y la vista salió antes de que llegaran
    // los cierres (primer arranque), repintarla ahora que ya están completos.
    try {
      if (VEND.preview && COM.comoEmail) {
        sbMontarVerComo(VEND.preview.email, VEND.preview.nombre, VEND.year, VEND.q);
      }
    } catch (e) {}
    // El histórico va aparte: alimenta la alerta de desviaciones
    setTimeout(precargarPestanas, 1200);
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
      // Si el usuario cambió de período —o entró a "Ver como" una asesora—
      // mientras tanto, NO pisar la vista. (2-ago: sin el chequeo de comoEmail
      // este refresco silencioso repintaba la vista Admin encima del preview.)
      if (COM.year === year && COM.q === q && COM.vista === 'home' && !COM.comoEmail) pintarHome();
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
  // Cinturón de seguridad (2-ago): si el admin está mirando "Ver como" una
  // asesora, NADIE puede repintar la vista Admin encima. Salir del preview
  // (comVerComo('')) limpia comoEmail antes de volver a llamar acá.
  // 3-ago: al VOLVER al módulo con "Ver como" activo, remontar la vista de
  // la asesora al instante en vez de dejar la pantalla esperando.
  if (COM.comoEmail) {
    try { window.comVerComo(COM.comoEmail); } catch (e) {}
    return;
  }
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
      R.rows.map(function (r, i) { return tarjetaAsesora(r, P.rows[i], R, meses, i); }).join('') +
    '</div>' +
    tarjetaAnomalias(COM.historico) +
    tarjetaCobertura(d) +
    tarjetaReglas(cfg, R);

  // El resumen y el histórico son 3 peticiones más. Con el ERP en cola eso
  // multiplica la espera, así que solo se cargan si ya se pidieron antes o
  // si el usuario toca un filtro. La primera vez muestra un botón.
  if (PER.perf) { pintarPerf(); pintarHist(); }
  else {
    var z = document.getElementById('com-perf');
    if (z) z.innerHTML = '<div class="card"><div class="ct">Resumen del período</div>' +
                         '<div class="ml">Cargando…</div></div>';
    cargarPeriodo('meses');
  }

  // PRECARGA "Ver como" (2-ago): con el panel ya pintado, traer en segundo
  // plano la vista de cada asesora para que el switch abra al instante.
  setTimeout(vcPrecache, 1500);
  // Números frescos de la base espejo (~2 s), en silencio.
  setTimeout(sbRefrescarPanel, 300);
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

/**
 * Qué fracción del trimestre ya pasó.
 * Sin esto, ver "63%" el 31 de julio parece que van perdiendo, cuando
 * en realidad recién arrancó el trimestre.
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

/**
 * Barra delgada, hasta 100%: qué parte del trimestre ya pasó.
 * El color lo da el nivel en el que están las ventas, así se ve de un
 * vistazo si el ritmo alcanza para el tiempo que queda.
 */
function barraAvance(year, q, cumpl, tiers) {
  var av = avanceTrimestre(year, q);
  var pct = Math.round(av.frac * 100);

  // El color NO sale del avance temporal sino del RITMO: cuánto se lleva
  // de la meta comparado con cuánto tiempo pasó. Si va el 10% del trimestre
  // y lleva el 15% de la meta, el ritmo es 150% y la barra va celeste.
  var ritmo = av.frac > 0.01 ? (cumpl / (av.frac * 100)) * 100 : 0;
  var col = NIVEL_COLOR[nivelDe(ritmo, tiers)];

  // La barra grande va de 0 a BARRA_TOPE (200%), así que el 100% cae a la
  // mitad del ancho. Esta barra solo cubre ese tramo; el texto ocupa el resto.
  var anchoUtil = 100 / BARRA_TOPE * 100;   // 50% cuando el tope es 200

  return '<div style="display:flex;align-items:center;gap:12px;margin-top:8px">' +
    '<div style="width:' + anchoUtil.toFixed(1) + '%;height:5px;background:var(--bg3);' +
         'border-radius:3px;overflow:hidden;flex-shrink:0">' +
      '<div style="width:' + pct + '%;height:100%;background:' + col + ';border-radius:3px"></div>' +
    '</div>' +
    '<span class="ml" style="white-space:nowrap">Progreso del trimestre = ' + pct + '%</span>' +
  '</div>';
}

function tarjetaEquipo(R, P, qTxt, meses, year) {
  // Los bonos suben al resumen del período
  COM.bonos = {
    bono:     R.rows.reduce(function (s2, r) { return s2 + r.bono; }, 0),
    bonoProy: P.rows.reduce(function (s2, r) { return s2 + r.bono; }, 0),
    margen:   R.tMar,      // lo que suman las asesoras: es lo que comisiona
  };

  var av = avanceTrimestre(year, COM.q || 1);
  var aviso = R.teamGate ? '' :
    '<div style="color:var(--rd);font-size:13px;margin-top:12px;font-weight:500">' +
      'Bono inactivo: el equipo está por debajo del ' + R.gate + '% combinado del trimestre.' +
      (!av.cerrado ? ' <span class="com-mut" style="font-weight:400">(el trimestre sigue abierto)</span>' : '') +
    '</div>';

  return '<div class="card">' +
    '<div class="ct">Cumplimiento del equipo · ' + esc(qTxt) + '</div>' +
    '<div style="font-size:22px;font-weight:700;color:' + NIVEL_COLOR[R.level] + '">' +
      p2(R.teamCumpl) + ' · ' + NIVEL_NOMBRE[R.level] +
    '</div>' +
    '<div style="margin-top:26px">' + barra(R.teamCumpl, 24, NIVEL_COLOR[R.level], R.tiers, true) + '</div>' +
    barraAvance(year, COM.q || 1, R.teamCumpl, R.tiers) +
    aviso +
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

function tarjetaAsesora(r, proy, R, meses, idxAsesora) {
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

  var abierto = COM.desglose === idxAsesora;

  return '<div class="card" style="margin-bottom:0">' +
    // Nombre y cumplimiento en la misma línea, mismo tamaño
    '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">' +
      '<span class="com-nom">' + esc(r.nombre) + '</span>' +
      '<span class="com-nom" style="color:' + col + '">' + p2(r.cumpl) + '</span>' +
    '</div>' +
    '<div class="com-sub">Básico ' + fmt(r.base) + '/mes · margen real ' +
      (Number(r.mPct) || 0).toFixed(2) + '%' + parcial + '</div>' +

    '<div style="margin-top:22px">' + barra(r.cumpl, 16, col, R.tiers, true) + '</div>' +
    barraAvance(COM.year || new Date().getFullYear(), COM.q || 1, r.cumpl, R.tiers) +

    '<div style="margin-top:18px;border-top:1px solid var(--bd);padding-top:4px">' +
      '<div class="com-row"><span class="com-mut">Margen del trimestre</span>' +
        '<span style="font-weight:600;font-size:16px">' + fmt(r.sumMar) + '</span></div>' +
      '<div class="com-row"><span class="com-mut">Bono acumulado</span>' +
        '<span style="font-weight:700;font-size:18px;color:' + (r.bono > 0 ? 'var(--gn)' : 'var(--mu)') + '">' +
          f2(r.bono) + '</span></div>' +
      '<div class="com-row"><span class="com-mut">Proyección al cierre</span>' +
        '<span style="font-weight:600;color:' + (proy.bono > 0 ? 'var(--gn)' : 'var(--mu)') + '">' + f2(proy.bono) +
        ' <span class="com-mut" style="font-weight:400;font-size:12px">(' + p2(proy.cumpl) + ')</span></span></div>' +
    '</div>' +

    '<button class="btn ' + (abierto ? 'bp' : 'bg') + ' bs" style="width:100%;margin-top:12px" ' +
            'onclick="comDesglose(' + idxAsesora + ')">' +
      (abierto ? '▲  Ocultar el cálculo' : '▼  Ver cómo se calcula este bono') +
    '</button>' +
    (abierto ? desgloseHTML(r, R, meses) : '') +

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

function tarjetaReglas(cfg, R, titulo) {
  // 3-ago (pedido Pablo): texto FIJO e INAMOVIBLE, igual en todas las vistas.
  // No se deriva de la config ni se toca sin pedido explícito de Pablo.
  var punto = function (color, txt) {
    return '<span style="display:inline-flex;align-items:center;gap:6px">' +
             '<span style="width:9px;height:9px;border-radius:50%;background:' + color + ';' +
                   'flex-shrink:0"></span>' + txt +
           '</span>';
  };

  return '<div class="card">' +
    '<div class="ct">' + esc(titulo || 'Reglas vigentes') + '</div>' +
    '<div style="font-size:13px;line-height:2.1">' +
      'Meta = Ventas (pedidos con pago completo) x Margen bruto x Factor nivel x 3 (meses)<br>' +
      '<b>Niveles de comisión:</b><br>' +
      punto('var(--rd)',  'Nivel 0° = Menos de 75%') + '<br>' +
      punto('var(--am)',  '1° Nivel = 75% - 100%') + '<br>' +
      punto('var(--gn)',  '2° Nivel = 100% - 125%') + '<br>' +
      punto(COM_CELESTE,  '3° Nivel = Más de 125%') + '<br>' +
      '<b>Activación:</b> La comisión se activa siempre y cuando el equipo ' +
      'llegue al menos al 1° nivel en promedio.' +
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
   DESGLOSE DEL CÁLCULO  ·  solo vista admin
   ──────────────────────────────────────────────────────────────────────
   Clic en el bono y se ve de dónde sale cada número: sueldo → meta →
   margen → cumplimiento → tramo → tasa → monto.
   Es lo que contesta un reclamo antes de que exista.
   ══════════════════════════════════════════════════════════════════════ */

function desgloseHTML(r, R, meses) {
  var paso = function (n, titulo, valor, detalle) {
    return '<div style="display:flex;gap:12px;padding:11px 0;border-bottom:1px solid var(--bd)">' +
      '<span style="width:22px;height:22px;border-radius:50%;background:var(--bg2);' +
            'color:var(--mu);font-size:11px;font-weight:600;display:flex;' +
            'align-items:center;justify-content:center;flex-shrink:0">' + n + '</span>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
          '<span style="font-size:13px">' + titulo + '</span>' +
          '<b style="font-size:14px;white-space:nowrap">' + valor + '</b>' +
        '</div>' +
        (detalle ? '<div class="ml" style="margin-top:3px">' + detalle + '</div>' : '') +
      '</div>' +
    '</div>';
  };

  // 1 · Sueldos mes a mes
  var sueldos = (r.sueldoM && r.sueldoM.length)
    ? meses.map(function (m, i) {
        return MESES_CORTO[m - 1] + ' ' + fmt(r.sueldoM[i] || 0);
      }).join(' · ')
    : fmt(r.base) + ' × 3 meses';

  // 2 · Meses no trabajados
  var inactivos = [];
  meses.forEach(function (m, i) {
    if (r.factorM[i] <= 0) inactivos.push(MESES_CORTO[m - 1]);
    else if (r.factorM[i] < 1) inactivos.push(MESES_CORTO[m - 1] + ' (' + Math.round(r.factorM[i] * 100) + '%)');
  });

  // 4 · De dónde sale el margen
  var detMargen = meses.map(function (m, i) {
    if (r.factorM[i] <= 0) return null;
    return MESES_CORTO[m - 1] + ' ' + fmt(r.marM[i]);
  }).filter(Boolean).join(' + ');

  // 6 · Tramo alcanzado
  var idxTramo = -1;
  R.tiers.forEach(function (t, i) { if (r.cumpl >= t.from) idxTramo = i; });
  var tramoTxt = idxTramo >= 0
    ? (idxTramo + 1) + '° nivel · paga ' + R.tiers[idxTramo].rate + '% del margen'
    : 'No alcanza el 1° nivel (' + R.gate + '%)';

  var escala = R.tiers.map(function (t, i) {
    var on = i === idxTramo;
    return '<span style="' + (on ? 'color:var(--tx);font-weight:600' : 'color:var(--mu)') + '">' +
           (i + 1) + '°: ' + t.from + '%→' + t.rate + '%</span>';
  }).join(' &nbsp;·&nbsp; ');

  // 7 · Requisito de equipo
  var equipoOk = R.teamGate;

  return '<div style="background:var(--bg3);border:1px solid var(--bd);' +
              'border-radius:var(--r2);padding:16px;margin-top:14px">' +
    '<div class="ct" style="margin:0 0 10px">Cómo se llegó a este número</div>' +

    paso(1, 'Sueldo del trimestre', fmt(r.sumMeta / R.x), sueldos) +

    paso(2, 'Meta de margen', fmt(r.sumMeta),
         R.x + '× el sueldo' +
         (inactivos.length ? ' · sin contar ' + inactivos.join(', ') : '')) +

    paso(3, 'Margen generado', fmt(r.sumMar), detMargen || 'sin ventas registradas') +

    paso(4, 'Cumplimiento',
         '<span style="color:' + NIVEL_COLOR[nivelDe(r.cumpl, R.tiers)] + '">' + p2(r.cumpl) + '</span>',
         fmt(r.sumMar) + ' ÷ ' + fmt(r.sumMeta)) +

    paso(5, 'Nivel alcanzado', r.rate > 0 ? r.rate + '%' : '—', tramoTxt + '<br>' + escala) +

    paso(6, 'Requisito de equipo',
         equipoOk ? '<span style="color:var(--gn)">cumplido</span>'
                  : '<span style="color:var(--rd)">no cumplido</span>',
         'El equipo va ' + p2(R.teamCumpl) + ' y necesita ' + R.gate + '%' +
         (equipoOk ? '' : ' — sin esto nadie cobra')) +

    '<div style="display:flex;justify-content:space-between;align-items:center;' +
         'gap:10px;padding-top:14px;flex-wrap:wrap">' +
      '<b style="font-size:14px">Bono</b>' +
      '<b style="font-size:20px;color:' + (r.bono > 0 ? 'var(--gn)' : 'var(--mu)') + '">' +
        f2(r.bono) + '</b>' +
    '</div>' +
    '<div class="ml" style="margin-top:4px">' +
      (r.bono > 0
        ? r.rate + '% de ' + fmt(r.sumMar)
        : (!equipoOk ? 'Bloqueado por el requisito de equipo'
                     : 'No alcanza el 1° nivel')) +
    '</div>' +
  '</div>';
}


/* ══════════════════════════════════════════════════════════════════════
   ALERTA DE ANOMALÍA
   ──────────────────────────────────────────────────────────────────────
   Compara el mes en curso contra el ritmo propio de cada asesora.
   No compara entre personas: cada una contra sí misma.
   ══════════════════════════════════════════════════════════════════════ */

var ANOM_CAIDA = 30;    // % de caída que dispara aviso
var ANOM_SUBIDA = 60;   // % de subida que también conviene mirar
var ANOM_MIN_MESES = 3; // menos historia que esto, no alcanza para comparar

/**
 * Devuelve las desviaciones del último mes cerrado contra el promedio previo.
 * @return [{nombre, mes, margen, promedio, desvio, tipo}]
 */
function detectarAnomalias(historico) {
  if (!historico || !historico.porAsesora) return [];

  var hoy = new Date();
  var mesActual = hoy.getMonth() + 1;
  var diasDelMes = new Date(hoy.getFullYear(), mesActual, 0).getDate();
  var diaHoy = hoy.getDate();
  var fraccion = diaHoy / diasDelMes;

  // El mes en curso solo sirve si ya está casi completo. Antes de eso,
  // cualquiera parecería en caída solo porque el mes no terminó.
  var mesMirar, parcial = false;
  if (fraccion >= 0.85) { mesMirar = mesActual; parcial = fraccion < 1; }
  else { mesMirar = mesActual - 1; }
  if (mesMirar < 1) return [];

  var salida = [];

  Object.keys(historico.porAsesora).forEach(function (nombre) {
    var datos = historico.porAsesora[nombre];
    var actual = datos[mesMirar];
    if (!actual || !actual.margen) return;

    // Promedio de los meses anteriores con actividad
    var previos = [];
    for (var m = 1; m < mesMirar; m++) {
      if (datos[m] && datos[m].margen > 0) previos.push(datos[m].margen);
    }
    if (previos.length < ANOM_MIN_MESES) return;

    var promedio = previos.reduce(function (a, b) { return a + b; }, 0) / previos.length;
    if (promedio <= 0) return;

    // Si el mes está a medias, comparamos contra la parte proporcional
    var referencia = parcial ? promedio * fraccion : promedio;
    var desvio = (actual.margen - referencia) / referencia * 100;

    if (desvio <= -ANOM_CAIDA) {
      salida.push({ nombre: nombre, mes: mesMirar, margen: actual.margen,
                    promedio: Math.round(promedio), desvio: desvio,
                    tipo: 'caida', parcial: parcial });
    } else if (desvio >= ANOM_SUBIDA) {
      salida.push({ nombre: nombre, mes: mesMirar, margen: actual.margen,
                    promedio: Math.round(promedio), desvio: desvio,
                    tipo: 'subida', parcial: parcial });
    }
  });

  return salida.sort(function (a, b) { return a.desvio - b.desvio; });
}

function tarjetaAnomalias(historico) {
  // Todavía cargando: avisamos, no desaparecemos
  if (!historico && !COM.historicoError) {
    return '<div class="card">' +
      '<div class="ct">Desviaciones del mes</div>' +
      '<div class="ml">Revisando el ritmo de cada asesora…</div>' +
    '</div>';
  }

  if (COM.historicoError) {
    return '<div class="card" style="border-color:var(--am)">' +
      '<div class="ct" style="color:var(--am)">Desviaciones del mes</div>' +
      '<div style="font-size:13px">No se pudo calcular: ' + esc(COM.historicoError) + '</div>' +
      '<button class="btn bg bs" style="margin-top:10px" onclick="comReintentarHistorico()">Reintentar</button>' +
    '</div>';
  }

  var an = detectarAnomalias(historico);

  // Sin desvíos: lo decimos, así se sabe que el control corrió
  if (!an.length) {
    var cuantas = historico && historico.porAsesora ? Object.keys(historico.porAsesora).length : 0;
    return '<div class="card">' +
      '<div class="ct">Desviaciones del mes</div>' +
      '<div style="font-size:13px;color:var(--gn)">' +
        'Ninguna asesora se desvió de su ritmo habitual' +
        (cuantas ? ' (' + cuantas + ' revisadas)' : '') + '.' +
      '</div>' +
      '<div class="ml" style="margin-top:8px">' +
        'Se avisa cuando alguien cae más de ' + ANOM_CAIDA + '% o sube más de ' +
        ANOM_SUBIDA + '% contra su propio promedio.' +
      '</div>' +
    '</div>';
  }

  var filas = an.map(function (a) {
    var caida = a.tipo === 'caida';
    var col = caida ? 'var(--rd)' : 'var(--gn)';
    var flecha = caida ? '▼' : '▲';

    return '<div style="display:flex;justify-content:space-between;align-items:center;' +
                'gap:12px;padding:11px 0;border-bottom:1px solid var(--bd);flex-wrap:wrap">' +
      '<div>' +
        '<b style="font-size:14px">' + esc(a.nombre) + '</b>' +
        '<div class="ml" style="margin-top:3px">' +
          MESES_LARGO[a.mes - 1] + (a.parcial ? ' (en curso)' : '') + ': ' + fmt(a.margen) +
          ' · su promedio venía siendo ' + fmt(a.promedio) +
        '</div>' +
      '</div>' +
      '<b style="color:' + col + ';font-size:16px;white-space:nowrap">' +
        flecha + ' ' + Math.abs(a.desvio).toFixed(0) + '%</b>' +
    '</div>';
  }).join('');

  var hayCaida = an.some(function (a) { return a.tipo === 'caida'; });

  return '<div class="card" style="border-color:' + (hayCaida ? 'var(--am)' : 'var(--bd)') + '">' +
    '<div class="ct"' + (hayCaida ? ' style="color:var(--am)"' : '') + '>' +
      'Desviaciones del mes (cae más de ' + ANOM_CAIDA + '% o sube más de ' + ANOM_SUBIDA + '%)' +
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
        'Si dejás el <b>sueldo del mes</b> vacío se usa el sueldo base prorrateado ' +
        'por días trabajados. Solo hay que llenarlo cuando ese mes cobró distinto.<br>' +
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
  // Incluye HOY: el día en curso se muestra con lo que va vendido
  var fin = ultimoDia > hoy ? hoy : ultimoDia;
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

  // Trimestre completo: una sola llamada trae todo el resumen
  var esTrimestreCompleto = !PER.meses || !PER.meses.length;
  if (esTrimestreCompleto) {
    // Si ya se vio en esta sesión, se pinta al instante y se refresca detrás
    try {
      var guardado = sessionStorage.getItem(claveCacheResumen(year, q));
      if (guardado) {
        var g = JSON.parse(guardado);
        if (g && g.perf) {
          PER.perf = g.perf; PER.perfPrev = g.perfPrev || null;
          PER.hist = g.histRango || null;
          if (g.rango) PER.rango = g.rango;
          PER.cargando = false;
          pintarPerf(); pintarHist();
        }
      }
    } catch (e) {}

    comApi('resumen', { year: year, q: q })
      .then(function (d) {
        if (seq !== PER.seq) return;
        PER.perf = d.perf;
        PER.perfPrev = d.perfPrev || null;
        PER.hist = d.histRango || null;
        if (d.rango) PER.rango = d.rango;
        PER.cargando = false;
        try { sessionStorage.setItem(claveCacheResumen(year, q), JSON.stringify(d)); } catch (e) {}
        pintarPerf();
        pintarHist();
      })
      .catch(function (e) {
        if (seq !== PER.seq) return;
        PER.cargando = false;
        if (zonaPerf) zonaPerf.innerHTML = '<div class="card" style="border-color:var(--rd)">' +
          '<div class="ct" style="color:var(--rd)">Resumen del período</div>' +
          '<div style="font-size:13px">' + esc((e && e.message) || e) + '</div>' +
          '<button class="btn bg bs" style="margin-top:10px" onclick="comCargarResumen()">Reintentar</button>' +
        '</div>';
      });
    return;
  }

  // Un mes suelto: se piden los rangos por separado
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

/**
 * Ventas de las asesoras en el período seleccionado.
 * Sale del bootstrap (r.ventas por mes), que ya viene con el filtro de
 * pagos aplicado: mismo universo que el margen comisionable.
 * Devuelve null si el dato no está (caché viejo): la tarjeta muestra —.
 */
function ventasAsesorasPeriodo() {
  var d = COM.data;
  if (!d || !d.results || !d.results.length) return null;

  var mesesQ = d.meses || [];
  var sel = (PER.meses && PER.meses.length) ? PER.meses : mesesQ;

  var total = 0, hay = false;
  d.results.forEach(function (r) {
    var v = r.ventas;
    if (!v || !v.length) return;
    sel.forEach(function (m) {
      var i = mesesQ.indexOf(m);
      if (i >= 0 && v[i] != null) { total += Number(v[i]) || 0; hay = true; }
    });
  });
  return hay ? total : null;
}

function pintarPerf() {
  var z = document.getElementById('com-perf');
  if (!z || !PER.perf) return;

  var d = PER.perf, prev = PER.perfPrev, r = PER.rango;
  var vAse = ventasAsesorasPeriodo();
  var mr  = d.totalVentas > 0 ? d.totalMargen / d.totalVentas * 100 : 0;
  var mrP = (prev && prev.totalVentas > 0) ? prev.totalMargen / prev.totalVentas * 100 : null;
  var porDia = d.totalMargen / Math.max(1, r.dias);
  // Días del período anterior, para comparar margen diario contra diario
  var prevDias = 0;
  if (prev && prev.desde && prev.hasta) {
    prevDias = Math.max(1, Math.round((new Date(prev.hasta) - new Date(prev.desde)) / 864e5) + 1);
  }

  // El bono lo calcula el panel, no el resumen: se toma de COM.bonos
  var celBono = function (label, cual, sub) {
    var v = (COM.bonos && COM.bonos[cual] != null) ? f2(COM.bonos[cual]) : '—';
    return '<div class="com-met">' +
             '<div class="ml">' + label + '</div>' +
             '<div class="com-big" style="color:var(--gn)">' + v + '</div>' +
             '<div class="com-sub2">' + (sub || '&nbsp;') + '</div>' +
           '</div>';
  };

  // Lo que realmente entra al bono: suma de las asesoras, ya filtrado
  var celComisionable = function () {
    var v = (COM.bonos && COM.bonos.margen != null) ? fmt(COM.bonos.margen) : '—';
    return '<div class="com-met" style="border-color:var(--ac)">' +
             '<div class="ml">Margen comisionable</div>' +
             '<div class="com-big" style="color:var(--ac)">' + v + '</div>' +
             '<div class="com-sub2">&nbsp;</div>' +
           '</div>';
  };

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
    '<div class="ct">Resumen del período</div>' +

    '<div class="com-mts com-mts-6">' +
      cel('Ventas asesoras', vAse != null ? fmt(vAse) : '—', '') +
      celComisionable() +
      cel('Margen real', mr.toFixed(2) + '%', mrP != null ? delta(mr, mrP) : '', 'var(--gn)') +
      cel('Margen por día', fmt(porDia),
          (prev && prevDias) ? delta(porDia, prev.totalMargen / prevDias) : '', 'var(--gn)') +
      celBono('Bono acumulado', 'bono') +
      celBono('Bono proyectado', 'bonoProy') +
    '</div>' +
  '</div>';
}

/* ── Gráfico histórico en SVG ──────────────────────────────────────── */

function pintarHist() {
  var z = document.getElementById('com-hist');
  if (!z || !PER.hist) return;

  var d = PER.hist;
  var filas = completarDias(d.rows || [], d.gran);
  if (!filas.length) { z.innerHTML = ''; return; }

  var niveles = (d.niveles && d.niveles.length) ? d.niveles : [];
  var titulo = 'Margen del equipo · ' + (d.gran === 'day' ? 'por día' : 'por mes');

  z.innerHTML = '<div class="card">' +
    '<div class="ct">' + titulo + '</div>' +
    graficoBarras(filas, niveles, titulo) +
  '</div>';
}

/**
 * Rellena los días del mes que todavía no llegaron, para que el eje muestre
 * el mes completo. Los días futuros quedan sin barra.
 */
function completarDias(filas, gran) {
  if (gran !== 'day' || !filas.length) return filas;

  var hoy = new Date();
  var mes = (PER.meses && PER.meses.length === 1) ? PER.meses[0] : null;
  if (!mes) return filas;                    // solo tiene sentido con un mes

  var year = COM.year || hoy.getFullYear();
  var ultimo = new Date(year, mes, 0).getDate();
  var LETRA = ['D','L','M','X','J','V','S'];

  // Lo que ya vino, indexado por número de día
  var porDia = {};
  filas.forEach(function (r) {
    var n = parseInt(String(r.label).replace(/\D/g, ''), 10);
    if (n) porDia[n] = r;
  });

  var out = [];
  for (var dia = 1; dia <= ultimo; dia++) {
    if (porDia[dia]) { out.push(porDia[dia]); continue; }
    out.push({
      label: String(dia),
      sub: LETRA[new Date(year, mes - 1, dia).getDay()],
      margen: 0,
    });
  }
  return out;
}


/**
 * Barras verticales con líneas de referencia.
 * viewBox fijo + preserveAspectRatio: escala solo al ancho del contenedor.
 */
function graficoBarras(filas, niveles, titulo) {
  titulo = titulo || 'Margen del equipo';
  var W = 2400, H = 380;
  var mIzq = 96, mDer = 128, mArr = 34, mAba = 58;
  var ancho = W - mIzq - mDer, alto = H - mArr - mAba;

  // Monto abreviado con dos decimales: 1.40K
  var kk = function (v) {
    v = Number(v) || 0;
    if (Math.abs(v) < 1000) return String(Math.round(v));
    var k = v / 1000;
    // Sin decimales si es redondo (2K), con dos si no (2.77K)
    return (k === Math.round(k) ? String(k) : k.toFixed(2)) + 'K';
  };

  var maxDato = Math.max.apply(null, filas.map(function (r) { return r.margen || 0; }));
  var maxNivel = niveles.length ? Math.max.apply(null, niveles.map(function (n) { return n.ref || 0; })) : 0;
  var bruto = Math.max(maxDato, maxNivel) * 1.12 || 1;

  // Escala en múltiplos redondos: S/2K, S/4K, S/6K… en vez de S/2.26K
  var salto = bruto <= 14000 ? 2000
            : bruto <= 35000 ? 5000
            : bruto <= 80000 ? 10000
            : Math.ceil(bruto / 6 / 10000) * 10000;
  var max = Math.ceil(bruto / salto) * salto;
  var pasos = Math.round(max / salto);

  var y = function (v) { return mArr + alto - (v / max * alto); };
  var paso = ancho / filas.length;
  var wBarra = Math.max(6, Math.min(62, paso * 0.6));

  // Grilla horizontal + escala
  var lineas = '';
  for (var i = 0; i <= pasos; i++) {
    var val = salto * i, yy = y(val);
    lineas +=
      '<line x1="' + mIzq + '" y1="' + yy + '" x2="' + (W - mDer) + '" y2="' + yy + '" ' +
        'stroke="var(--bd)" stroke-width="1.5" opacity=".5"/>' +
      '<text x="' + (mIzq - 12) + '" y="' + (yy + 5) + '" text-anchor="end" ' +
        'font-size="15" fill="var(--mu)">S/' + kk(val) + '</text>';
  }

  // Barras + etiquetas del eje X
  var barras = '', etiquetas = '';
  var saltar = Math.ceil(filas.length / 32);
  filas.forEach(function (r, i) {
    var v = r.margen || 0;
    var x = mIzq + paso * i + (paso - wBarra) / 2;
    var cx = mIzq + paso * i + paso / 2;
    var h = Math.max(1, alto - (y(v) - mArr));
    barras += '<rect x="' + x.toFixed(1) + '" y="' + y(v).toFixed(1) + '" ' +
                'width="' + wBarra.toFixed(1) + '" height="' + h.toFixed(1) + '" ' +
                'rx="2" fill="var(--gn)"><title>' + esc(r.label) + ': ' + fmt(v) + '</title></rect>';

    // Monto sobre cada barra
    if (v > 0 && paso > 22) {
      barras += '<text x="' + cx.toFixed(1) + '" y="' + (y(v) - 7).toFixed(1) + '" ' +
                  'text-anchor="middle" font-size="14" font-weight="600" fill="var(--tx)">' +
                  kk(v) + '</text>';
    }

    if (i % saltar === 0) {
      etiquetas += '<text x="' + cx.toFixed(1) + '" y="' + (H - mAba + 24) + '" ' +
                     'text-anchor="middle" font-size="15" fill="var(--mu)">' + esc(r.label) + '</text>';
      if (r.sub) {
        etiquetas += '<text x="' + cx.toFixed(1) + '" y="' + (H - mAba + 43) + '" ' +
                       'text-anchor="middle" font-size="13" fill="var(--mu)">' + esc(r.sub) + '</text>';
      }
    }
  });

  // Líneas de nivel con su monto a la derecha
  var colores = ['var(--am)', 'var(--gn)', COM_CELESTE];
  var refs = '', leyenda = '';
  niveles.forEach(function (n, i) {
    var yy = y(n.ref || 0);
    if (isNaN(yy) || yy < mArr) return;
    var col = colores[i] || 'var(--mu)';
    refs +=
      '<line x1="' + mIzq + '" y1="' + yy + '" x2="' + (W - mDer) + '" y2="' + yy + '" ' +
        'stroke="' + col + '" stroke-width="2.5"/>' +
      '<text x="' + (W - mDer + 8) + '" y="' + (yy + 5) + '" font-size="15" ' +
        'font-weight="600" fill="' + col + '">S/' + kk(n.ref || 0) + '</text>';

    leyenda += '<span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px">' +
                 '<span style="width:14px;height:2px;background:' + col + '"></span>' +
                 '<span class="ml">' + esc(n.label) + '</span>' +
               '</span>';
  });

  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" ' +
              'style="width:100%;height:auto;max-height:300px;display:block" ' +
              'role="img" aria-label="' + esc(titulo) + '">' +
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

/* ══════════════════════════════════════════════════════════════════════
   MODO ASESORA (Fase 1, 2-ago-2026)
   La asesora entra al módulo con su propio login y ve su vista real:
   período navegable, su historial y su tarjeta de motivación personal.
   ══════════════════════════════════════════════════════════════════════ */

var VEND = { modo: false, data: null, hist: null, dia: null, year: null, q: null,
             cargando: false, preview: null };

/** ¿El período seleccionado es el trimestre en curso? */
function vendEsActual() {
  var hoy = new Date();
  return VEND.year === hoy.getFullYear() && VEND.q === Math.ceil((hoy.getMonth() + 1) / 3);
}

function vendCargar(forzar) {
  VEND.modo = true;
  var hoy = new Date();
  VEND.year = VEND.year || hoy.getFullYear();
  VEND.q    = VEND.q    || Math.ceil((hoy.getMonth() + 1) / 3);

  // ── VÍA RÁPIDA (solo vista previa del admin): el cambio de trimestre se
  //    arma desde los datos ya traídos de la base espejo, sin ir al servidor.
  var pv0 = VEND.preview;
  if (pv0 && sbDisponible() && SBC.full &&
      VEND.year === new Date().getFullYear() &&
      sbMontarVerComo(pv0.email, pv0.nombre, VEND.year, VEND.q)) {
    return;
  }

  if (VEND.cargando) return;
  VEND.cargando = true;
  var c = cont();
  if (c && (!VEND.data || forzar)) {
    c.innerHTML = '<div class="ld"><div class="sp"></div>Cargando tus comisiones...</div>';
  }

  // En modo vista previa (admin), las ops llevan a quién mirar.
  // VELOCIDAD (2-ago): las 3 cosas (trimestre + historial + día) vienen en UN
  // solo viaje al servidor ('vendedoraFull'). Antes eran 3 llamadas y cada una
  // releía la hoja de Pedidos → ~60s. Ahora la hoja se lee una vez.
  var pv = VEND.preview;
  var argsFull = { year: VEND.year, q: VEND.q,
                   histYear: hoy.getFullYear(),
                   conDia: vendEsActual() };
  if (pv) { argsFull.asesora = pv.email; argsFull.nombre = pv.nombre; }

  comApi('vendedoraFull', argsFull).then(function (r) {
    VEND.cargando = false;
    VEND.data = r.vend;
    VEND.hist = r.hist || VEND.hist;
    VEND.dia  = r.dia;
    pintarVerComo(VEND.data, true);
  }).catch(function (e) { VEND.cargando = false; pintarError(e); });
}

window.comVendPeriodo = function (val) {
  var p = String(val || '').split('-');
  if (p.length !== 2) return;
  VEND.year = parseInt(p[0], 10);
  VEND.q = parseInt(p[1], 10);
  VEND.data = null;
  vendCargar(true);
};

/** Selector de trimestres con datos (del historial) + el actual. */
function vendSelector() {
  var hoy = new Date();
  var ops = {};
  ops[hoy.getFullYear() + '-' + Math.ceil((hoy.getMonth() + 1) / 3)] = 1;
  if (VEND.hist && VEND.hist.series) {
    Object.keys(VEND.hist.series).forEach(function (y) {
      Object.keys(VEND.hist.series[y]).forEach(function (m) {
        ops[y + '-' + Math.ceil(parseInt(m, 10) / 3)] = 1;
      });
    });
  }
  // El esquema arrancó en 2026-Q2: nada anterior a eso (pedido Pablo 3-ago)
  Object.keys(ops).forEach(function (o) {
    var p0 = o.split('-');
    if (parseInt(p0[0], 10) < 2026 || (parseInt(p0[0], 10) === 2026 && parseInt(p0[1], 10) < 2)) delete ops[o];
  });
  var sel = VEND.year + '-' + VEND.q;
  var estilo = 'background:var(--bg2);border:1px solid var(--bd);color:var(--tx);' +
               'padding:6px 10px;border-radius:var(--r);font-size:13px;font-family:inherit;cursor:pointer';
  return '<select style="' + estilo + '" onchange="comVendPeriodo(this.value)">' +
    Object.keys(ops).sort().reverse().map(function (o) {
      var p = o.split('-');
      return '<option value="' + o + '"' + (o === sel ? ' selected' : '') + '>' +
             esc(etiquetaTrim(parseInt(p[1], 10), parseInt(p[0], 10))) + '</option>';
    }).join('') + '</select>';
}

/** Tarjeta de motivación personal: mejor mes, promedio y mes en curso. */
function tarjetaCamino() {
  var h = VEND.hist;
  if (!h || !h.series) return '';
  var hoy = new Date(), y = hoy.getFullYear(), m = hoy.getMonth() + 1;
  var val = function (yy, mm) {
    var s = h.series[yy];
    return (s && s[mm]) ? s[mm].margen : null;
  };

  var actual = val(y, m) || 0;

  // Promedio de los últimos 3 meses cerrados con datos
  var prev = [], yy = y, mm = m;
  for (var i = 0; i < 18 && prev.length < 3; i++) {
    mm--; if (mm < 1) { mm = 12; yy--; }
    var v = val(yy, mm);
    if (v != null && v > 0) prev.push(v);
  }
  var prom = prev.length ? prev.reduce(function (a, b) { return a + b; }, 0) / prev.length : 0;

  // Mejor mes histórico (sin contar el mes en curso)
  var mejor = null;
  Object.keys(h.series).forEach(function (y2) {
    Object.keys(h.series[y2]).forEach(function (m2) {
      if (parseInt(y2, 10) === y && parseInt(m2, 10) === m) return;
      var v2 = h.series[y2][m2].margen;
      if (v2 > 0 && (!mejor || v2 > mejor.v)) mejor = { v: v2, y: parseInt(y2, 10), m: parseInt(m2, 10) };
    });
  });

  var filas = '';
  if (mejor) {
    var record = actual > mejor.v;
    filas += '<div class="com-row"><span class="com-mut">Tu mejor mes</span>' +
      '<span style="font-weight:600">' + fmt(mejor.v) +
      ' <span class="com-mut" style="font-weight:400;font-size:12px">(' +
      MESES_LARGO[mejor.m - 1] + ' ' + mejor.y + ')</span>' +
      (record ? ' <span style="color:var(--gn);font-size:12px">🔥 ¡vas rumbo a récord!</span>' : '') +
      '</span></div>';
  }
  if (prom > 0) {
    var dif = (actual - prom) / prom * 100;
    var col = dif >= 0 ? 'var(--gn)' : 'var(--rd)';
    filas += '<div class="com-row"><span class="com-mut">Tu promedio (últimos ' + prev.length + ' meses)</span>' +
      '<span style="font-weight:600">' + fmt(prom) + '</span></div>';
    filas += '<div class="com-row"><span class="com-mut">Este mes vas en</span>' +
      '<span style="font-weight:600">' + fmt(actual) +
      ' <span style="color:' + col + ';font-size:12px;font-weight:600">' +
      (dif >= 0 ? '▲' : '▼') + ' ' + Math.abs(dif).toFixed(0) + '% vs tu promedio</span></span></div>';
  }
  if (!filas) return '';
  return '<div class="card"><div class="ct">Tu camino</div>' + filas + '</div>';
}

/**
 * FASE 2 — META DEL DÍA (idea de Pablo): doble objetivo diario, en soles
 * cobrados Y en cantidad de pedidos. Se calcula solo: lo que falta del mes
 * ÷ los días que quedan. Incluye la racha 🔥 de días cumpliendo.
 */
function tarjetaMetaDia(d) {
  if (!vendEsActual() || !VEND.dia || !VEND.dia.dias) return '';

  var hoy = new Date();
  var diaHoy = hoy.getDate();
  var diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  var idxMes = (d.meses || []).indexOf(hoy.getMonth() + 1);

  var gm = ((Number(d.gmPct) || 62) / 100);
  var metaMesMargen = Number(d.metaM) || 0;                    // meta de margen del mes
  var margenMes = idxMes >= 0 ? (Number((d.marginM || [])[idxMes]) || 0) : 0;
  var faltaMargen = Math.max(0, metaMesMargen - margenMes);
  var diasRestantes = Math.max(1, diasMes - diaHoy + 1);

  var metaDiaVentas = gm > 0 ? (faltaMargen / diasRestantes) / gm : 0;
  var ticket = Number(d.ticketOwn) || Number(d.ticket) || 0;
  var metaDiaPedidos = (metaDiaVentas > 0 && ticket > 0) ? Math.ceil(metaDiaVentas / ticket) : 0;

  var hoyDat = VEND.dia.dias[diaHoy] || { cobrado: 0, pedidos: 0 };

  // Racha: días seguidos cumpliendo la meta diaria FIJA del mes (meta mensual
  // en ventas ÷ días del mes), contando hacia atrás desde ayer; si hoy ya
  // cumplió, hoy también suma.
  var metaFija = gm > 0 ? (metaMesMargen / gm) / diasMes : 0;
  var racha = 0;
  if (metaFija > 0) {
    if ((hoyDat.cobrado || 0) >= metaFija) racha++;
    for (var dd = diaHoy - 1; dd >= 1; dd--) {
      var v = VEND.dia.dias[dd];
      if (v && v.cobrado >= metaFija) racha++;
      else break;
    }
  }

  var barrita = function (valor, meta, color) {
    var pct = meta > 0 ? Math.max(0, Math.min(100, valor / meta * 100)) : 0;
    var lleno = meta > 0 && valor >= meta;
    return '<div style="height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;margin-top:6px">' +
      '<div style="width:' + pct.toFixed(0) + '%;height:100%;border-radius:4px;background:' +
      (lleno ? 'var(--gn)' : color) + '"></div></div>';
  };

  var metaCumplida = metaDiaVentas <= 0;   // ya no le falta nada del mes
  var cuerpo;
  if (metaCumplida) {
    cuerpo = '<div style="font-size:14px;color:var(--gn);font-weight:600">' +
             '🏁 ¡Meta del mes completa! Todo lo que cobres ahora es pura ganancia de bono.</div>';
  } else {
    cuerpo =
      '<div class="com-row" style="border:none;padding-bottom:0">' +
        '<span class="com-mut">Cobrar hoy</span>' +
        '<span style="font-weight:600">' + fmt(hoyDat.cobrado) +
          ' <span class="com-mut" style="font-weight:400">de ' + fmt(metaDiaVentas) + '</span></span>' +
      '</div>' + barrita(hoyDat.cobrado, metaDiaVentas, 'var(--ac)') +
      '<div class="com-row" style="border:none;padding-bottom:0;margin-top:12px">' +
        '<span class="com-mut">Pedidos hoy</span>' +
        '<span style="font-weight:600">' + (hoyDat.pedidos || 0) +
          ' <span class="com-mut" style="font-weight:400">de ' + metaDiaPedidos + '</span></span>' +
      '</div>' + barrita(hoyDat.pedidos || 0, metaDiaPedidos, 'var(--am)');
  }

  return '<div class="card">' +
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div class="ct" style="margin:0">Tu meta de hoy</div>' +
      (racha > 0 ? '<span style="font-size:13px;font-weight:600">🔥 ' + racha +
        (racha === 1 ? ' día' : ' días seguidos') + '</span>' : '') +
    '</div>' +
    '<div style="margin-top:10px">' + cuerpo + '</div>' +
    '<div class="ml" style="margin-top:10px">Se recalcula cada día con lo que te falta del mes.</div>' +
  '</div>';
}

/** FASE 2 — Celebración: si subió de nivel desde su última visita. */
function bannerCelebracion(d, nivel) {
  if (!vendEsActual()) return '';
  var clave = 'com_nivel_' + String(d.nombre || '').toLowerCase();
  var previo = -1;
  try { previo = parseInt(localStorage.getItem(clave), 10); } catch (e) {}
  try { localStorage.setItem(clave, String(nivel)); } catch (e) {}
  if (isNaN(previo) || previo < 0 || nivel <= previo) return '';
  return '<div class="card" style="border-color:var(--gn);text-align:center">' +
    '<div style="font-size:20px">🎉</div>' +
    '<div style="font-weight:700;color:var(--gn)">¡Subiste al ' + nivel + '° nivel!</div>' +
    '<div class="ml">Tu bono creció. Sigue así.</div>' +
  '</div>';
}

/** Cierres anteriores de la asesora, desde SU historial (sin montos ajenos). */
/** Meses que CONTARON en el cierre. Vienen del servidor (esquema de sueldos +
 *  fecha de ingreso), no de si tuvo ventas: Angie vendió en abril pero entró
 *  al esquema en mayo → su Q2 dice "Mayo – Junio 2026". */
function mesesDeCierre(c) {
  if (!c.meses || !c.meses.length || c.meses.length >= 3) return '';   // trimestre completo: no hace falta
  var p = String(c.yq || '').match(/^(\d{4})-Q\d$/);
  var noms = c.meses.map(function (m) { return MESES_LARGO[m - 1]; });
  return 'Meses considerados: ' + noms.join(' – ') + (p ? ' ' + p[1] : '');
}

function tarjetaCierresVend() {
  var h = VEND.hist;
  var filas = ((h && h.cierres) || []).map(function (c) {
    var mesesTxt = mesesDeCierre(c);
    return '<div style="padding:4px 0">' +
      '<div class="com-row" style="font-size:13px">' +
        '<span>' + esc(c.yq) + ' <span class="com-mut">(' + c.cumpl + '%' +
          (c.equipo ? '' : ' · equipo no llegó') + ')</span></span>' +
        '<span style="color:var(--gn);font-weight:600">' + f2(c.bono) + '</span>' +
      '</div>' +
      (mesesTxt ? '<div class="com-mut" style="font-size:12px;margin-top:1px">' + esc(mesesTxt) + '</div>' : '') +
    '</div>';
  }).join('');
  return '<div class="card"><div class="ct">Tus cierres anteriores</div>' +
    (filas || '<div class="ml">Todavía no hay trimestres cerrados.</div>') + '</div>';
}

function pintarVerComo(d, real) {
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
  // ── TRIMESTRE CERRADO (2-ago, pedido Pablo): si este trimestre ya se
  //    cerró, manda el CIERRE OFICIAL: su bono pagado, su % del cierre,
  //    los meses que contaron, y el ranking del cierre (sin %, y sin
  //    asesoras que no participaron — ej. Lucía entró en julio).
  var yqKey = d.year + '-Q' + d.q;
  var cierreOf = null, yoCierre = null;
  try {
    cierreOf = (CIERRE.cerradosTrim || []).find(function (cx) { return cx.yq === yqKey; }) || null;
    if (cierreOf) {
      yoCierre = (cierreOf.filas || []).find(function (x) {
        return String(x.asesora || '').trim().toUpperCase() ===
               String(d.nombre || '').trim().toUpperCase();
      }) || null;
    }
  } catch (e) {}
  var cerrado = !!yoCierre;
  var mesesCerradoTxt = '';
  if (cerrado && VEND.hist && VEND.hist.cierres) {
    var ciH = VEND.hist.cierres.find(function (cx) { return cx.yq === yqKey; });
    if (ciH) mesesCerradoTxt = mesesDeCierre(ciH);
  }

  var rank;
  if (cerrado) {
    rank = (cierreOf.filas || [])
      .filter(function (f0) { return (Number(f0.meta) || 0) > 0; })   // solo quienes participaron
      .slice().sort(function (a, b) { return (b.cumpl || 0) - (a.cumpl || 0); })
      .map(function (f0, i) {
        var yoMismo0 = String(f0.asesora || '').trim().toUpperCase() ===
                       String(d.nombre || '').trim().toUpperCase();
        return '<div class="com-row">' +
                 '<div style="display:flex;align-items:center;gap:10px">' +
                   medalla(i) +
                   '<span style="font-weight:' + (yoMismo0 ? '700' : '400') + ';' +
                         (yoMismo0 ? 'color:var(--ac)' : '') + '">' +
                     esc(f0.asesora) + (yoMismo0 ? ' (tú)' : '') + '</span>' +
                 '</div>' +
               '</div>';
      }).join('');
  } else {
    rank = R.rows.map(function (r) { return { nombre: r.nombre, cumpl: r.cumpl }; })
      .sort(function (a, b) { return b.cumpl - a.cumpl; })
      .map(function (r, i) {
        var yoMismo = r.nombre === d.nombre;
        return '<div class="com-row">' +
                 '<div style="display:flex;align-items:center;gap:10px">' +
                   medalla(i) +
                   '<span style="font-weight:' + (yoMismo ? '700' : '400') + ';' +
                         (yoMismo ? 'color:var(--ac)' : '') + '">' +
                     esc(r.nombre) + (yoMismo ? ' (tú)' : '') + '</span>' +
                 '</div>' +
                 '<span style="font-weight:600;color:' + NIVEL_COLOR[nivelDe(r.cumpl, R.tiers)] + '">' +
                   p2(r.cumpl) + '</span>' +
               '</div>';
      }).join('');
  }

  // Cuánto le falta, expresado en VENTAS aproximadas (margen ÷ % de margen real)
  var sig = R.tiers.find(function (t) { return t.from > yo.cumpl; });
  var falta = 'Estás en el nivel máximo.';
  if (sig) {
    var faltaMargen = Math.max(0, (sig.from / 100 * yo.sumMeta) - yo.sumMar);
    var pctMargen = (Number(yo.mPct) || 62) / 100;
    var faltaVentas = pctMargen > 0 ? faltaMargen / pctMargen : faltaMargen;
    falta = 'Te faltan <b>' + fmt(faltaVentas) + '</b> de ventas aproximadas para subir al ' +
            (R.tiers.indexOf(sig) + 1) + '° nivel (' + sig.rate + '%).';
  }

  // Modo REAL (asesora logueada): sin pestañas de admin ni botón de vista
  // previa; título propio + selector de período. Modo preview (admin): igual
  // que siempre.
  var cabecera = real
    ? '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'gap:10px;margin-bottom:14px;max-width:620px;margin-left:auto;margin-right:auto">' +
        '<div style="font-size:17px;font-weight:600">' +
          (VEND.preview ? 'Así lo ve ' + esc(VEND.preview.nombre) : 'Mis comisiones') + '</div>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
          vendSelector() +
          (VEND.preview ? '<button class="btn bg bs" onclick="comVerComo(\'\')">← Mi vista</button>' : '') +
        '</div>' +
      '</div>'
    : pestañas('home') +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:10px">' +
        '<button class="btn bg bs" onclick="comVerComo(\'\')">Volver a mi vista</button>' +
      '</div>';

  var lvActual = nivelDe(yo.cumpl, R.tiers);

  // Tarjeta principal: con el trimestre CERRADO manda el cierre oficial
  var cumplVer = cerrado ? (Number(yoCierre.cumpl) || 0) : yo.cumpl;
  var colVer = cerrado ? NIVEL_COLOR[nivelDe(cumplVer, R.tiers)] : col;
  var bonoVer = cerrado ? (Number(yoCierre.bonoPagar) || 0) : yo.bono;
  var tarjetaPrincipal =
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">' +
          '<span class="com-nom">' + esc(d.nombre) + '</span>' +
          '<span class="com-nom" style="color:' + colVer + '">' + p2(cumplVer) + '</span>' +
        '</div>' +
        '<div class="com-sub">' + esc(qTxt) +
          (cerrado ? ' · <b style="color:var(--gn)">Trimestre cerrado ✓</b>' : '') + '</div>' +
        '<div style="text-align:center;margin:20px 0 8px">' +
          '<div class="ml">' + (cerrado ? 'Tu comisión' : 'Tu bono del trimestre') + '</div>' +
          '<div style="font-size:36px;font-weight:700;letter-spacing:-1px;' +
               'color:' + (bonoVer > 0 ? 'var(--gn)' : 'var(--mu)') + '">' + f2(bonoVer) + '</div>' +
          (cerrado
            ? (mesesCerradoTxt ? '<div class="ml">' + esc(mesesCerradoTxt) + '</div>' : '')
            : '<div class="ml">proyectado al cierre: <b style="color:' +
                (yoP.bono > 0 ? 'var(--gn)' : 'var(--mu)') + '">' + f2(yoP.bono) + '</b></div>') +
        '</div>' +
        '<div style="margin-top:18px">' + barra(cumplVer, 20, colVer, R.tiers, true) + '</div>' +
        (cerrado ? '' : barraAvance(d.year, d.q, yo.cumpl, R.tiers)) +
        (cerrado ? '' : '<div style="font-size:13px;margin-top:18px">' + falta + '</div>') +
        '<div style="font-size:13px;margin-top:10px;font-weight:500;color:' +
             ((cerrado ? cierreOf.teamGate === 'SI' : R.teamGate) ? 'var(--gn)' : 'var(--rd)') + '">' +
          (cerrado
            ? (cierreOf.teamGate === 'SI'
                ? 'El equipo llegó al nivel 1° en promedio. Comisión pagada.'
                : 'El equipo no llegó al mínimo en este trimestre.')
            : (R.teamGate
                ? 'El equipo llegó al mínimo: tu bono está activo.'
                : 'El bono se activa cuando el equipo completo supere el ' + R.gate + '%. Van ' + p2(R.teamCumpl) + '.')) +
        '</div>' +
      '</div>';

  c.innerHTML = cabecera +
    '<div style="max-width:620px;margin:0 auto">' +
      (real && !cerrado ? bannerCelebracion(d, lvActual) : '') +
      (real ? tarjetaMetaDia(d) : '') +
      tarjetaPrincipal +

      (cerrado ? '' : '<div class="card"><div class="ct">Tu margen mes a mes</div>' + filasMes + '</div>') +
      (real && !cerrado ? tarjetaCamino() : '') +
      '<div class="card"><div class="ct">Ranking del trimestre</div>' + rank + '</div>' +
      (cerrado ? '' : (real ? tarjetaCierresVend() : cierresDeAsesora(d.nombre))) +
      (cerrado ? '' : tarjetaReglas(cfg, R, 'Leyenda')) +
    '</div>';
}

/**
 * Cierres trimestrales anteriores de UNA asesora: solo su fila de cada
 * cierre, sin montos ajenos. Sale de CIERRE.cerradosTrim (bootstrap).
 */
function cierresDeAsesora(nombre) {
  var buscado = String(nombre || '').trim().toLowerCase();
  var filas = (CIERRE.cerradosTrim || []).map(function (c) {
    var f = (c.filas || []).find(function (x) {
      return String(x.asesora || '').trim().toLowerCase() === buscado;
    });
    if (!f) return '';
    var ajustado = (f.bonoOverride !== '' && f.bonoOverride != null)
                 ? ' <span style="color:var(--am);font-size:11px">ajustado</span>' : '';
    return '<div class="com-row" style="font-size:13px">' +
             '<span>' + esc(c.yq) +
               ' <span class="com-mut">(' + f.cumpl + '%' +
                 (c.teamGate === 'SI' ? '' : ' · equipo no llegó') + ')</span>' + ajustado + '</span>' +
             '<span style="color:var(--gn);font-weight:600">' + f2(f.bonoPagar) + '</span>' +
           '</div>';
  }).join('');

  return '<div class="card"><div class="ct">Tus cierres anteriores</div>' +
    (filas || '<div class="ml">Todavía no hay trimestres cerrados.</div>') +
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
      '<div style="font-size:13px;margin-bottom:16px;line-height:1.6">' +
        'Definen cuánto se paga. Un cambio acá afecta el bono de todas ' +
        'y queda registrado en la bitácora.' +
      '</div>' +

      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px">' +
        '<span class="com-mut" style="font-size:12px">Meta de margen =</span>' +
        '<input id="cfg-x" type="number" step="0.5" value="' + (cfg.xMeta || 12) + '" ' +
               'style="' + estilo + ';width:80px;text-align:center;font-weight:600">' +
        '<span class="com-mut" style="font-size:12px">× el sueldo del mes</span>' +
      '</div>' +

      '<div style="display:grid;gap:9px">' +
        (cfg.tiers || TIERS_FALLBACK).map(function (t, k) {
          return '<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">' +
            '<span class="com-mut" style="font-size:12px;min-width:62px">' + (k + 1) + '° nivel</span>' +
            '<span class="com-mut" style="font-size:12px">desde</span>' +
            '<input class="cfg-from" type="number" value="' + t.from + '" ' +
                   'style="' + estilo + ';width:70px;text-align:center">' +
            '<span class="com-mut" style="font-size:12px">% de la meta → paga</span>' +
            '<input class="cfg-rate" type="number" step="0.1" value="' + t.rate + '" ' +
                   'style="' + estilo + ';width:70px;text-align:center">' +
            '<span class="com-mut" style="font-size:12px">% del margen</span>' +
          '</div>';
        }).join('') +
      '</div>' +

      '<div class="ml" style="margin-top:12px;line-height:1.6">' +
        'El bono se activa solo si el equipo completo supera el ' +
        ((cfg.tiers || TIERS_FALLBACK)[0] || {}).from + '%.<br>' +
        'Para ver el efecto antes de guardar, probalo en el <b>Simulador</b>.' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="ct">Asesoras</div>' +
      '<div style="font-size:13px;margin-bottom:14px;line-height:1.6">' +
        'Quién entra al cálculo de comisiones. El correo es con el que inicia sesión en Tulula Comisiones.<br>' +
        '<b>El sueldo base y la fecha de ingreso se definen acá.</b> ' +
        'En la pestaña Asesoras se ajusta el detalle mes a mes cuando alguna cobró distinto.' +
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

/** Abre o cierra el desglose del cálculo de una asesora. */
window.comDesglose = function (i) {
  COM.desglose = (COM.desglose === i) ? null : i;
  pintarHome();
};

window.comReintentarHistorico = function () {
  COM.historico = null;
  COM.historicoError = null;
  precargarPestanas._hecho = false;
  pintarHome();
  precargarPestanas();
};

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

  // El histórico alimenta la alerta de desviaciones. Recorre todo el año,
  // así que va aparte y sin bloquear: cuando llega, se repinta.
  if (!COM.historico) {
    comApi('historico', { year: COM.year || new Date().getFullYear() })
      .then(function (h) {
        COM.historico = h || {};
        COM.historicoError = null;
        if (COM.vista === 'home' && !COM.comoEmail) pintarHome();
      })
      .catch(function (e) {
        // Antes se callaba y la alerta no aparecía nunca sin explicación
        COM.historicoError = (e && e.message) || String(e);
        COM.historico = {};
        if (COM.vista === 'home' && !COM.comoEmail) pintarHome();
      });
  }

  if (ASE.data && CIERRE.cargado) return;   // bootstrap ya trajo el resto

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
// Gancho para el banco de pruebas: limpiar la caché de la vía rápida
window.__sbcReset = function () { SBC.full = null; SBC.t = 0; SBC.cargando = null; };

window._comReset = function () {
  COM.data = null;
  COM.traidoEn = null;
  ASE.data = null;
  CIERRE.cargado = false;
  PER.perf = null; PER.perfPrev = null; PER.hist = null;
  VEND.data = null; VEND.hist = null;   // modo asesora: refrescar también
  SBC.full = null; SBC.t = 0;            // vía rápida: pedir datos frescos
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

/* ── VÍA RÁPIDA SUPABASE (2-ago noche) ──────────────────────────────
   El servidor de Apps Script está saturado: un ping vacío tarda 9-18 s
   (medido en vivo). La base espejo contesta lo mismo en ~2 s, así que
   los NÚMEROS del módulo se leen de ahí (RPC comisiones_vista_full,
   mismo motor validado al centavo) y Apps Script queda solo como
   respaldo y para lo que no está en la base (config, cierres).       */

var SBC = { full: null, t: 0, cargando: null };
var EXTRA = { cfgFull: null };   // respaldo de config (tiers/sueldos) desde el disco
var SBC_TTL = 5 * 60 * 1000;   // 5 min: el espejo se refresca cada minuto

function sbDisponible() {
  // OJO: SB_URL es un `const` del index.html — NO cuelga de window. Hay que
  // mirarlo como identificador suelto (los scripts comparten el ámbito global).
  try {
    return typeof SB_URL !== 'undefined' && !!SB_URL &&
           typeof _sbSesionAsegurar === 'function';
  } catch (e) { return false; }
}

/** UNA llamada trae TODO lo numérico (2 años por asesora/mes + día a día). */
function sbVistaFull(forzar) {
  if (!sbDisponible()) return Promise.resolve(null);
  if (SBC.full && !forzar && Date.now() - SBC.t < SBC_TTL) return Promise.resolve(SBC.full);
  if (SBC.cargando) return SBC.cargando;
  var hoy = new Date();
  SBC.cargando = _sbSesionAsegurar().then(function (tok) {
    if (!tok) return null;
    return fetch(SB_URL + '/rest/v1/rpc/comisiones_vista_full', {
      method: 'POST',
      headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + tok,
                 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_year: hoy.getFullYear(),
                             p_dia_year: hoy.getFullYear(),
                             p_dia_mes: hoy.getMonth() + 1 }),
    }).then(function (r) { return r.ok ? r.json() : null; });
  }).then(function (d) {
    SBC.cargando = null;
    if (d && d.anual) {
      SBC.full = d; SBC.t = Date.now();
      // Foto en disco: la próxima vez que se abra el ERP, la vista pinta AL
      // INSTANTE con esta foto y se refresca por detrás (el pase a la base
      // puede tardar ~10 s en renovarse cuando pasó >1 h; con la foto no se
      // siente). Solo laptop del admin.
      try {
        if (typeof MY_ROLE === 'undefined' || MY_ROLE === 'Administrador') {
          localStorage.setItem('com_sb_full', JSON.stringify({ t: Date.now(), d: d }));
        }
      } catch (e) {}
    }
    return SBC.full;
  }).catch(function () { SBC.cargando = null; return null; });
  return SBC.cargando;
}

function sbAsesoraEsquema(nombre) {
  var lista = (ASE.data && ASE.data.asesoras) || [];
  for (var i = 0; i < lista.length; i++) {
    if (String(lista[i].nombre || '').trim().toUpperCase() === nombre) return lista[i];
  }
  return null;
}

/** Arma {vend, hist, dia} para una asesora SIN tocar Apps Script:
 *  números del RPC + sueldos/factores del esquema + cierres del bootstrap.
 *  Devuelve null si falta alguna pieza (el caller cae a la vía de siempre). */
function sbArmarVista(nombre, year, q) {
  var full = SBC.full;
  var hoy = new Date();
  if (!full || !full.anual) return null;
  var cfgFull = (COM.data && COM.data.cfgFull) || EXTRA.cfgFull;
  if (!cfgFull) return null;
  if (!ASE.data || !(ASE.data.asesoras || []).length) return null;
  if (year !== hoy.getFullYear()) return null;   // el RPC cubre year-1..year; el esquema, el año actual
  nombre = String(nombre || '').trim().toUpperCase();

  var xMeta = Number(cfgFull.xMeta) || 12;
  var meses = [(q - 1) * 3 + 1, (q - 1) * 3 + 2, (q - 1) * 3 + 3];

  var idx = {};
  full.anual.forEach(function (a) {
    idx[String(a.asesora).toUpperCase() + '|' + a.y + '|' + a.mes] = a;
  });

  var teamRows = [], propio = null;
  (ASE.data.asesoras || []).forEach(function (e) {
    var nomE = String(e.nombre || '').trim().toUpperCase();
    var marginM = [], ventasM = [], factorM = [], sueldoM = [];
    var vQ = 0, mQ = 0, pedQ = 0;
    meses.forEach(function (m) {
      var reg = (e.meses || [])[m - 1] || {};
      var activo = reg.activo ? 1 : 0;
      var a = idx[nomE + '|' + year + '|' + m];
      var v  = (reg.ventaOv  != null) ? Number(reg.ventaOv)  : (a ? Number(a.ventas) : 0);
      var mg = (reg.margenOv != null) ? Number(reg.margenOv) : (a ? Number(a.margen) : 0);
      marginM.push(activo ? Math.round(mg) : 0);
      ventasM.push(activo ? Math.round(v) : 0);
      factorM.push(activo);
      sueldoM.push(activo ? Math.round(Number(reg.sueldoEfectivo) || 0) : 0);
      if (activo) { vQ += v; mQ += mg; pedQ += a ? (Number(a.pedidos) || 0) : 0; }
    });
    var fila = { nombre: e.nombre, base_m: Number(e.base) || 0,
                 gmPct: vQ > 0 ? Math.round(mQ / vQ * 1000) / 10 : (Number(cfgFull.gm_pct) || 62),
                 marginM: marginM, ventasM: ventasM, factorM: factorM, sueldoM: sueldoM };
    teamRows.push(fila);
    if (nomE === nombre) propio = { fila: fila, vQ: vQ, pedQ: pedQ, esq: e };
  });
  if (!propio) return null;

  var hoyMes = hoy.getMonth() + 1;
  var jMes = meses.indexOf(hoyMes);
  var vend = {
    isAdmin: false, nombre: propio.fila.nombre, year: year, q: q, meses: meses,
    cfg: { tiers: cfgFull.tiers, xMeta: xMeta, gm_pct: cfgFull.gm_pct },
    teamRows: teamRows,
    marginM: propio.fila.marginM,
    gmPct: propio.fila.gmPct,
    metaM: jMes >= 0 ? xMeta * (propio.fila.sueldoM[jMes] || 0) : 0,
    ticketOwn: propio.pedQ > 0 ? Math.round(propio.vQ / propio.pedQ) : 0,
  };

  var series = {};
  full.anual.forEach(function (a) {
    if (String(a.asesora).toUpperCase() !== nombre) return;
    if (!series[a.y]) series[a.y] = {};
    series[a.y][a.mes] = { margen: Math.round(Number(a.margen)), ventas: Math.round(Number(a.ventas)) };
  });

  var cierres = [];
  (CIERRE.cerradosTrim || []).forEach(function (c) {
    var f = (c.filas || []).find(function (x) {
      return String(x.asesora || '').trim().toUpperCase() === nombre;
    });
    if (!f) return;
    var ci = { yq: c.yq, cumpl: f.cumpl, bono: f.bonoPagar, equipo: c.teamGate === 'SI' };
    var p = String(c.yq || '').match(/^(\d{4})-Q(\d)$/);
    if (p && parseInt(p[1], 10) === (ASE.year || year)) {
      var ms = [];
      for (var m2 = (parseInt(p[2], 10) - 1) * 3 + 1; m2 <= parseInt(p[2], 10) * 3; m2++) {
        var r2 = (propio.esq.meses || [])[m2 - 1] || {};
        if (r2.activo && (Number(r2.sueldoEfectivo) || 0) > 0) ms.push(m2);
      }
      if (ms.length) ci.meses = ms;
    }
    cierres.push(ci);
  });
  var hist = { nombre: propio.fila.nombre, year: year, series: series, cierres: cierres };

  var dias = {};
  (full.dia || []).forEach(function (d) {
    if (String(d.asesora).toUpperCase() !== nombre) return;
    dias[d.dia] = { cobrado: Number(d.cobrado) || 0, pedidos: Number(d.pedidos) || 0 };
  });
  var dia = { nombre: propio.fila.nombre, year: hoy.getFullYear(), mes: hoyMes, dias: dias };

  return { vend: vend, hist: hist, dia: dia };
}

/** Monta la vista de la asesora desde la vía rápida. true si pudo. */
function sbMontarVerComo(email, nombre, year, q) {
  var r = sbArmarVista(nombre, year, q);
  if (!r) return false;
  VEND.preview = { email: email, nombre: r.vend.nombre };
  VEND.year = year; VEND.q = q;
  VEND.data = r.vend; VEND.hist = r.hist; VEND.dia = r.dia;
  pintarVerComo(r.vend, true);
  return true;
}

/** Refresca los números del panel Admin desde la base espejo (rápido y en
 *  silencio). Respeta los overrides manuales del esquema (AsesorasMes). */
function sbRefrescarPanel() {
  if (!sbDisponible() || !COM.data || !COM.data.results) return;
  var year = COM.year, q = COM.q, hoyR = new Date();
  if (year !== hoyR.getFullYear()) return;
  sbVistaFull().then(function (full) {
    if (!full || !full.anual) return;
    if (COM.year !== year || COM.q !== q) return;
    var meses = COM.data.meses || [(q - 1) * 3 + 1, (q - 1) * 3 + 2, (q - 1) * 3 + 3];
    var idx = {};
    full.anual.forEach(function (a) { idx[String(a.asesora).toUpperCase() + '|' + a.y + '|' + a.mes] = a; });
    var cambio = false;
    COM.data.results.forEach(function (r) {
      var nomR = String(r.nombre || '').trim().toUpperCase();
      var esq = sbAsesoraEsquema(nomR);
      meses.forEach(function (m, j) {
        var reg = esq && (esq.meses || [])[m - 1];
        if (reg && (reg.ventaOv != null || reg.margenOv != null)) return;  // override manual manda
        var a = idx[nomR + '|' + year + '|' + m];
        var v = a ? Math.round(Number(a.ventas)) : 0;
        var mg = a ? Math.round(Number(a.margen)) : 0;
        if (r.ventas && r.ventas[j] !== v)   { r.ventas[j] = v;   cambio = true; }
        if (r.marginM && r.marginM[j] !== mg) { r.marginM[j] = mg; cambio = true; }
      });
    });
    if (cambio && COM.vista === 'home' && !COM.comoEmail) pintarHome();
  });
}

/* ── Ver como asesora ── */

// PRECARGA (2-ago): apenas el panel Admin queda pintado, se traen en segundo
// plano las vistas de las asesoras. Así "Ver como" abre AL INSTANTE desde
// caché (y se refresca por detrás). En fila, no en paralelo: no satura el ERP.
var VC_CACHE = {};                 // "email|year-q" → { t, r }
var VC_TTL = 10 * 60 * 1000;       // 10 minutos
var vcPrecargando = false;

function vcKey(email) { return email + '|' + COM.year + '-' + COM.q; }

function vcArgs(email) {
  var hoy = new Date();
  var esActual = COM.year === hoy.getFullYear() &&
                 COM.q === Math.ceil((hoy.getMonth() + 1) / 3);
  return { year: COM.year, q: COM.q, asesora: email,
           histYear: hoy.getFullYear(), conDia: esActual };
}

function vcPrecache() {
  if (typeof window.MY_ASESORA !== 'undefined' && window.MY_ASESORA) return;
  // Vía rápida: UNA llamada a la base espejo precarga las vistas de TODAS
  // las asesoras (~2 s). El desfile de llamadas a Apps Script queda solo
  // como respaldo si la base no está disponible.
  if (sbDisponible()) { sbVistaFull(); return; }
  if (vcPrecargando) return;
  var vend = COM.data &&
    ((COM.data.cfgFull && COM.data.cfgFull.vendedoras) ||
     (COM.data.cfg && COM.data.cfg.vendedoras));
  if (!vend) return;
  var emails = Object.keys(vend).filter(function (e) {
    var c = VC_CACHE[vcKey(e)];
    return !(c && Date.now() - c.t < VC_TTL);
  });
  if (!emails.length) return;
  vcPrecargando = true;
  (function uno(i) {
    if (i >= emails.length) { vcPrecargando = false; return; }
    comApi('vendedoraFull', vcArgs(emails[i]))
      .then(function (r) { VC_CACHE[vcKey(emails[i])] = { t: Date.now(), r: r }; })
      .catch(function () {})
      .then(function () { uno(i + 1); });
  })(0);
}

window.comVerComo = function (email) {
  COM.comoEmail = email || '';
  if (!email) {
    // salir de la vista previa: limpiar el estado de asesora y volver al panel
    VEND.preview = null; VEND.data = null; VEND.hist = null; VEND.dia = null;
    VEND.year = null; VEND.q = null;
    cargar();
    return;
  }

  // ── VÍA RÁPIDA: montar desde la base espejo, sin tocar Apps Script ──
  var cfgV = (COM.data && COM.data.cfgFull) || EXTRA.cfgFull;
  var vendCfgV = cfgV && cfgV.vendedoras;
  var nombreV = (vendCfgV && vendCfgV[email]) ? String(vendCfgV[email].nombre || '') : '';
  if (!nombreV && ASE.data) {   // respaldo: el esquema guardado también trae los correos
    var eV = (ASE.data.asesoras || []).find(function (a) { return a.email === email; });
    if (eV) nombreV = String(eV.nombre || '');
  }
  var hoyV2 = new Date();
  if (sbDisponible() && nombreV && COM.year === hoyV2.getFullYear()) {
    // Con la precarga lista: pinta AL INSTANTE (y refresca por detrás)
    if (SBC.full && sbMontarVerComo(email, nombreV, COM.year, COM.q)) {
      sbVistaFull().then(function (full) {
        if (full && COM.comoEmail === email) sbMontarVerComo(email, nombreV, COM.year, COM.q);
      });
      return;
    }
    // Sin precarga aún: spinner + una sola llamada (~2 s)
    var cV = cont();
    if (cV) cV.innerHTML = pestañas('home') + '<div class="ld"><div class="sp"></div>Cargando su vista...</div>';
    sbVistaFull().then(function (full) {
      if (COM.comoEmail !== email) return;
      if (full && sbMontarVerComo(email, nombreV, COM.year, COM.q)) return;
      comVerComoApps(email);   // la base no contestó: vía de siempre
    });
    return;
  }
  comVerComoApps(email);
};

// Vía de respaldo por Apps Script (la de siempre, con su propia caché)
function comVerComoApps(email) {
  // Montar la experiencia REAL de la asesora con una respuesta del servidor
  function vcMontar(r) {
    var d = r.vend;
    if (d && d.isAdmin) { pintarError(new Error('Ese correo es de un administrador, no de una asesora.')); return; }
    VEND.preview = { email: email, nombre: d.nombre };
    VEND.year = COM.year; VEND.q = COM.q;
    VEND.data = d;
    VEND.hist = r.hist;
    VEND.dia  = r.dia;
    pintarVerComo(d, true);
  }

  // 1) Si la precarga ya la trajo, pinta AL INSTANTE (y refresca por detrás)
  var hit = VC_CACHE[vcKey(email)];
  if (hit && Date.now() - hit.t < VC_TTL) {
    vcMontar(hit.r);
  } else {
    var c = cont();
    if (c) c.innerHTML = pestañas('home') + '<div class="ld"><div class="sp"></div>Cargando su vista...</div>';
  }

  // 2) Siempre pedir datos frescos: UNA sola llamada trae trimestre +
  //    historial + día (antes eran 3 viajes en fila → ~60s de espera).
  comApi('vendedoraFull', vcArgs(email))
    .then(function (r) {
      VC_CACHE[vcKey(email)] = { t: Date.now(), r: r };
      if (COM.comoEmail !== email) return;   // ya cambió de selección
      vcMontar(r);
    })
    .catch(function (e) {
      // Si ya se pintó desde caché, no ensuciar la pantalla con el error
      if (!(hit && Date.now() - hit.t < VC_TTL)) pintarError(e);
    });
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

  // Reglas de comisión
  var x = Number(document.getElementById('cfg-x').value) || 0;
  if (x <= 0) {
    if (msg) { msg.style.color = 'var(--rd)'; msg.textContent = 'La meta tiene que ser mayor que cero.'; }
    return;
  }

  var froms = document.querySelectorAll('.cfg-from');
  var rates = document.querySelectorAll('.cfg-rate');
  var tiers = [];
  for (var i = 0; i < froms.length; i++) {
    tiers.push({ from: Number(froms[i].value) || 0, rate: Number(rates[i].value) || 0 });
  }
  // Los niveles tienen que ir de menor a mayor, o el cálculo se rompe
  for (var j = 1; j < tiers.length; j++) {
    if (tiers[j].from <= tiers[j - 1].from) {
      if (msg) { msg.style.color = 'var(--rd)';
                 msg.textContent = 'Cada nivel tiene que empezar más arriba que el anterior.'; }
      return;
    }
    if (tiers[j].rate < tiers[j - 1].rate) {
      if (msg) { msg.style.color = 'var(--rd)';
                 msg.textContent = 'Un nivel más alto no puede pagar menos que el anterior.'; }
      return;
    }
  }

  var patch = {
    xMeta: x,
    tiers: tiers,
    vendedoras: vend,
    admin: admins,
    gm_mode: document.getElementById('cfg-gmmode').value,
    gm_pct: Number(document.getElementById('cfg-gm').value) || 62,
  };

  var btn = document.querySelector('button[onclick="comCfgGuardar()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; btn.style.opacity = '.6'; }
  if (msg) { msg.style.color = 'var(--mu)'; msg.textContent = ''; }

  // La pantalla se actualiza YA con los valores nuevos. El margen de cada
  // asesora no cambia por editar una regla: lo que cambia es cómo se aplica,
  // y ese cálculo corre acá mismo. Guardar en el servidor va en paralelo.
  if (COM.data) {
    COM.data.cfgFull = Object.assign({}, COM.data.cfgFull || {}, patch);
    cacheGuardar(COM.year, COM.q, COM.data);
  }
  ASE.data = null;      // el prorrateo depende de la meta
  SIM.filas = null;     // el simulador arranca de nuevo
  pintarConfig();

  var msg2 = document.getElementById('cfg-msg');
  if (msg2) { msg2.style.color = 'var(--mu)'; msg2.textContent = 'Guardando en el servidor…'; }

  comApi('saveCfg', { patch: patch })
    .then(function () {
      cacheBorrar();
      var m = document.getElementById('cfg-msg');
      if (m) { m.style.color = 'var(--gn)'; m.textContent = 'Guardado'; }
    })
    .catch(function (e) {
      var m = document.getElementById('cfg-msg');
      if (m) {
        m.style.color = 'var(--rd)';
        m.textContent = 'No se pudo guardar: ' + ((e && e.message) || e) +
                        ' — recargá antes de seguir editando.';
      }
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




// ── PRE-ARRANQUE (2-ago) ──────────────────────────────────────────────
// Corre al FINAL del archivo (todo ya inicializado): restaura del disco la
// config/esquema/cierres y la FOTO de datos, y pide números frescos a la
// base espejo (caché precalculada: ~200-400 ms). Así "Ver como" abre al
// instante aunque el usuario haga clic apenas entra al módulo.
try {
  if (!(typeof window.MY_ASESORA !== 'undefined' && window.MY_ASESORA)) {
    extrasRestaurar(new Date().getFullYear());
    try {
      var _snap = JSON.parse(localStorage.getItem('com_sb_full') || 'null');
      if (_snap && _snap.d && _snap.d.anual && Date.now() - _snap.t < 24 * 60 * 60 * 1000) {
        SBC.full = _snap.d; SBC.t = 0;   // t=0: viejos → el refresco trae frescos
      }
    } catch (e) {}
    if (sbDisponible()) sbVistaFull();
  }
} catch (e) {}

})();