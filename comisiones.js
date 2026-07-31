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
};

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

/** Punto de entrada. Lo llama loadPg(). */
function cargar(forzar) {
  if (COM.cargando) return;
  inyectarEstilos();

  // Si ya hay datos y no se fuerza, repinta sin ir al servidor.
  if (COM.data && !forzar) { pintarHome(); return; }

  var hoy = new Date();
  COM.year = COM.year || hoy.getFullYear();
  COM.q    = COM.q    || Math.ceil((hoy.getMonth() + 1) / 3);

  COM.cargando = true;
  pintarCargando();

  comApi('admin', { year: COM.year, q: COM.q })
    .then(function (d) {
      COM.cargando = false;
      COM.data = d;
      pintarHome();
    })
    .catch(function (e) {
      COM.cargando = false;
      pintarError(e);
    });
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
    barraHerramientas(d, qTxt) +
    tarjetaEquipo(R, P, qTxt) +
    tarjetaRanking(R, qTxt) +
    '<div class="ct">Asesoras · ' + esc(qTxt) + '</div>' +
    '<div class="com-grid">' +
      R.rows.map(function (r, i) { return tarjetaAsesora(r, P.rows[i], R, meses); }).join('') +
    '</div>' +
    tarjetaCobertura(d) +
    tarjetaReglas(cfg, R);
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

  return '<div class="com-toolbar">' +
    '<span class="com-mut" style="font-size:12px">Período</span>' +
    '<select id="com-year" style="' + estilo + '" onchange="comCambiarPeriodo()">' + optY + '</select>' +
    '<select id="com-q" style="' + estilo + '" onchange="comCambiarPeriodo()">' + optQ + '</select>' +
    '<button class="btn bg bs" onclick="loadComisiones(true)">Actualizar datos</button>' +
  '</div>';
}

function tarjetaEquipo(R, P, qTxt) {
  var totalBase  = R.rows.reduce(function (s, r) { return s + r.base; }, 0);
  var bonoActual = R.rows.reduce(function (s, r) { return s + r.bono; }, 0);
  var bonoProy   = P.rows.reduce(function (s, r) { return s + r.bono; }, 0);
  var payroll    = totalBase * 3 + bonoProy;

  var aviso = R.teamGate ? '' :
    '<div style="color:var(--rd);font-size:13px;margin-top:12px;font-weight:500">' +
      'Bono inactivo: el equipo está por debajo del ' + R.gate + '% combinado del trimestre.' +
    '</div>';

  var mt = function (label, valor, sub, color) {
    return '<div class="mt">' +
             '<div class="ml">' + label + '</div>' +
             '<div class="com-big"' + (color ? ' style="color:' + color + '"' : '') + '>' + valor + '</div>' +
             (sub ? '<div class="ml" style="margin:5px 0 0">' + sub + '</div>' : '') +
           '</div>';
  };

  return '<div class="card">' +
    '<div class="ct">Cumplimiento del equipo · ' + esc(qTxt) + '</div>' +
    '<div style="font-size:22px;font-weight:700;color:' + NIVEL_COLOR[R.level] + '">' +
      p2(R.teamCumpl) + ' · ' + NIVEL_NOMBRE[R.level] +
    '</div>' +
    '<div style="margin-top:26px">' + barra(R.teamCumpl, 24, NIVEL_COLOR[R.level], R.tiers, true) + '</div>' +
    '<div class="ml" style="margin-top:10px">Proyección al cierre: ' +
      '<b style="color:' + NIVEL_COLOR[P.level] + '">' + p2(P.teamCumpl) + ' · ' + NIVEL_NOMBRE[P.level] + '</b>' +
    '</div>' +
    aviso +
    '<div class="mts" style="margin-top:20px;margin-bottom:0">' +
      mt('Margen del equipo', fmt(R.tMar), p2(R.teamCumpl) + ' de ' + fmt(R.tMeta)) +
      mt('Bono acumulado', f2(bonoActual), null, 'var(--gn)') +
      mt('Bono proyectado', f2(bonoProy), 'si cierra así', 'var(--gn)') +
      mt('Payroll del trimestre', fmt(payroll), 'sueldos × 3 + bono') +
      mt('Bono ÷ sueldos', totalBase > 0 ? p2(bonoProy / (totalBase * 3) * 100) : '0.00%', 'proyectado') +
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
   API PÚBLICA — lo único que sale del módulo
   ══════════════════════════════════════════════════════════════════════ */

window.loadComisiones = cargar;

window.comCambiarPeriodo = function () {
  var y = document.getElementById('com-year'), q = document.getElementById('com-q');
  if (!y || !q) return;
  COM.year = Number(y.value);
  COM.q    = Number(q.value);
  COM.data = null;
  cargar(true);
};

window._comReset = function () { COM.data = null; };

})();
