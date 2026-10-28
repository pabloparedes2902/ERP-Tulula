/* GENERADO por herramientas/generar_margen_local.js — NO editar a mano. */
(function () {
// ── Lo que en Apps Script da Google y en el navegador no existe (mismo comportamiento, sin servidor) ──
var __BANDERAS = { MARGEN_DESDE_BASE: 'SI', MARGEN_CONFIG_DESDE_BASE: 'SI', MARGEN_DESDE_VISTA_ADS: 'SI',
                   MARGEN_MISMA_LISTA: 'SI', MARGEN_SOLO_LOS_PEDIDOS: 'SI', ADS_ATRIBUIR_POR_COMPRA: 'SI' };
var __RUTAS = {}, __FALTAN = [], __PRODUCTOS = null;
var Logger = { log: function () {} };
function getProp(k, d) { return Object.prototype.hasOwnProperty.call(__BANDERAS, k) ? __BANDERAS[k] : d; }
function setProp() {}
var CacheService = { getScriptCache: function () { return { get: function () { return null; }, put: function () {}, remove: function () {},
  removeAll: function () {}, getAll: function () { return {}; }, putAll: function () {} }; } };
var SpreadsheetApp = { openById: function () { throw new Error('margen_local: sin planillas en el navegador'); },
                       getActiveSpreadsheet: function () { throw new Error('margen_local: sin planillas en el navegador'); } };
function _planillaSoloLectura_() { throw new Error('margen_local: sin planillas en el navegador'); }
function _silog_() {}
function _costMap_() { throw new Error('margen_local: sin hoja Cost (la base debe contestar)'); }
function _pagosDeLaBaseCacheados_() { return []; }
function productosListar() { if (!__PRODUCTOS) throw new Error('margen_local: sin productos'); return __PRODUCTOS; }
var Utilities = {
  formatDate: function (d, tz, fmt) {
    var p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return String(fmt).replace(/yyyy|MM|dd|HH|H|mm|ss/g, function (t) {
      return t === 'yyyy' ? p.year : t === 'MM' ? p.month : t === 'dd' ? p.day : t === 'HH' ? p.hour : t === 'H' ? String(parseInt(p.hour, 10)) : t === 'mm' ? p.minute : p.second;
    });
  }
};
/** _sbFetch_ del servidor, pero SÍNCRONO sobre lo ya bajado. Lo que falta se anota y se baja afuera (ver el pie). */
function _sbFetch_(metodo, ruta, cuerpo, hdr) {
  var perfil = (hdr && hdr['Accept-Profile']) || '';
  var k = metodo + ' ' + ruta + (perfil ? ' @' + perfil : '');
  if (__RUTAS[k]) return __RUTAS[k];
  if (metodo !== 'GET') return { code: 200, body: '[]' };   // el motor no escribe; por las dudas, nunca desde aca
  __FALTAN.push({ k: k, ruta: ruta, perfil: perfil });
  throw new Error('__MARGEN_LOCAL_FALTA__');
}


// ── Code.js · C
const C = {
  NRO:'NroPedido', NOMBRE:'Nombres y Apellidos', DNI:'DNI', CELULAR:'Celular',
  DIRECCION:'Direccion', DISTRITO:'Distrito', PROVINCIA:'Provincia', REGION:'Region',
  REFERENCIA:'Referencia', EMAIL:'Email', CANAL:'CANAL', ORIGEN:'ORIGEN',
  ASESORA:'Asesora', PRENDA:'Prenda', CAMBIO:'Cambio', PRECIO:'Precio',
  ENVIO:'Envio', SUBTOTAL:'Subtotal', PAGO:'Pago', FORMA_PAGO:'Forma pago',
  FECHA_PEDIDO:'Fecha Pedido', FECHA_PAGO:'Fecha Pago', PERIODO:'Periodo',
  FECHA_ENVIO:'Fecha Envio', ESTADO:'Estado', COURIER:'Courier',
  COMENT_ENVIO:'Comentarios Envio', ESTADO_PAGO:'Estado Pago',
  TRANSFERIDO:'Transferido', PABLO:'Pablo', ANA:'Ana', COMENT_PAGO:'Comentario Pago',
  CATEGORIA:'Categoria', MODELO:'Modelo', COLOR:'Color', TALLA:'Talla',
  CONSTANCIA:'Constancia', COLOR_PRENDA:'ColorPrenda',
};

// ── Code.js · EST
const EST = {
  // Estados de prenda/pedido
  PENDIENTE:'PENDIENTE', ENVIAR:'ENVIAR', SEPARAR:'SEPARAR',
  EN_CAMINO:'EN CAMINO', ENTREGADO:'ENTREGADO',
  PREVENTA:'PREVENTA',   // LOTES F1: prenda vendida SIN stock disponible aún (llega después)
  // Marcadores especiales
  FILA_PAGO:'_PAGO_',        // fila de pago (no es prenda)
  ELIMINADO_SI:'SI',         // soft delete (columna Eliminado)
  // Estados de Cambios
  CAM_SOLICITADO:'CLIENTE SOLICITA CAMBIO',
  CAM_ORIG_RECIBIDA:'PRENDA ORIGINAL RECIBIDA',
  CAM_NUEVA_ENVIADA:'PRENDA NUEVA ENVIADA',
};

// ── Code.js · COST_ALIAS
const COST_ALIAS = {
  'pack de collets': 'colets pack',
  'pack de colets':  'colets pack',
  'bermudas malva':      'short malva',
  'traje_de_baño praga': 'traje de baño praga',
  'bikini modelador':    'interior moldeador',
  'moldeador bikini cintura alta': 'interior moldeador',
  'moldeador corte bikini cintura alta': 'interior moldeador',   // 2-oct (Pablo): MOLDEADOR BIKINI CINTURA ALTA = INTERIOR MOLDEADOR
  'modelador faja':      'interior faja abdominal',
  // 12-ago-2026 (validado con Pablo — caso "prendas vendidas sin costo"):
  'correa animal print': 'correa print',       // el pedido dice ANIMAL PRINT; en Cost es CORREA PRINT
  'correa marmoleada':   'correa marmoleado',  // femenino en el pedido, masculino en Cost
  'blazer ejecutivo':    'blazer',             // BLAZER EJECUTIVO ANTONIA = BLAZER ANTONIA
  'falda lapiz cadiz':   'falda cadiz',        // 1-oct (Pablo): FALDA LAPIZ CADIZ = FALDA CADIZ
  // 2-oct (Pablo): nombres de la tienda Shopify que son otro producto del ERP
  'correa de tela chanel': 'correa lino',      // en Shopify «Correa de Tela Chanel» es la CORREA LINO (mismo costo)
  'correa chanel':         'correa lino',
  'conjunto atenas':       'conjunto madonna', // piezas: BLAZER MADONNA + PANTALON ATENAS
  'correas moda packs':    'correa circular',  // en Shopify es una COPIA en borrador de Correa Circular
};

// ── Code.js · _costDePrenda_
function _costDePrenda_(prenda, costData) {
  let memo = null;
  if (prenda && costData && typeof costData === 'object') {
    try {
      // La memoria cuelga de ESTA funcion (WeakMap por costData): no toca costData
      // y se va sola cuando costData deja de usarse.
      const wm = _costDePrenda_.__wm || (_costDePrenda_.__wm = new WeakMap());
      memo = wm.get(costData);
      if (!memo) { memo = {}; wm.set(costData, memo); }
    } catch (e) { memo = null; }
    const hit = memo && memo[String(prenda)];
    if (hit) return { unit: hit.unit, paq: hit.paq, disenoMatch: hit.disenoMatch };
  }
  const r = (function () {
    if (!prenda) return { unit: 0, paq: 0, disenoMatch: '' };
    let p = String(prenda).trim().toLowerCase().replace(/\s+/g, ' ');
    // 1) Renombres conocidos (alias): reemplazar el prefijo por el nombre de la hoja Cost
    // 20-set · LA PUERTA DE LA PANTALLA HOMOLOGACIONES. Con HOMOLOG_DESDE_ERP
    // apagado (el defecto) esto devuelve null y se usa COST_ALIAS TAL CUAL:
    // exactamente el comportamiento de hoy. Encendido, la pantalla SUMA sus
    // equivalencias a las del codigo (nunca las quita).
    const _homAls = ((typeof _homAliasCostos_ === 'function') ? _homAliasCostos_() : null) || COST_ALIAS;
    for (const a in _homAls) {
      if (p === a || p.indexOf(a + ' ') === 0) { p = _homAls[a] + p.slice(a.length); break; }
    }
    // 2) Probar el texto tal cual y también con guiones bajos como espacios (TRAJE_DE_BAÑO → TRAJE DE BAÑO)
    const cands = [p];
    const p2 = p.replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (p2 !== p) cands.push(p2);
    for (let c = 0; c < cands.length; c++) {
      const q = cands[c];
      let mejorK = '', mejorScore = -1;
      for (let i = 0; i < costData.keys.length; i++) {
        const k = costData.keys[i];
        // 12-ago-2026: ahora también se normaliza LA CLAVE de la hoja Cost, no solo el texto
        // del pedido. Antes "PANTALON WIDE LEG BEIGE CLARO S" jamás encontraba la fila
        // "PANTALON WIDE_LEG" y la prenda quedaba SIN COSTO (margen sobreestimado).
        const kv = _costClaveVariantes_(k);
        for (let v = 0; v < kv.length; v++) {
          const kk = kv[v];
          if (!kk) continue;
          if (!(q === kk || q.indexOf(kk) === 0 || q.indexOf(' '+kk+' ') >= 0)) continue;
          if (v === 0) return { unit: costData.map[k].unit, paq: costData.map[k].paq, disenoMatch: k };
          const sc = _costScoreVariante_(q, k);
          if (sc > mejorScore) { mejorScore = sc; mejorK = k; }
          break;
        }
      }
      if (mejorK) return { unit: costData.map[mejorK].unit, paq: costData.map[mejorK].paq, disenoMatch: mejorK };
    }
    return { unit: 0, paq: 0, disenoMatch: '' };
  })();
  if (memo && prenda) memo[String(prenda)] = r;
  return { unit: r.unit, paq: r.paq, disenoMatch: r.disenoMatch };
}

// ── Code.js · _costClaveVariantes_
function _costClaveVariantes_(k) {
  const out = [k];
  const sinGuion = String(k).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (sinGuion && sinGuion !== k) out.push(sinGuion);
  out.slice().forEach(function (x) {
    const i = x.indexOf('(');
    if (i > 0) {
      const base = x.slice(0, i).replace(/\s+/g, ' ').trim();
      if (base && out.indexOf(base) < 0) out.push(base);
    }
  });
  return out;
}

// ── Code.js · _costScoreVariante_
function _costScoreVariante_(q, k) {
  let sc = 0;
  const i = k.indexOf('(');
  if (i > 0) {
    const dentro = k.slice(i + 1, k.lastIndexOf(')') > 0 ? k.lastIndexOf(')') : k.length);
    const partes = dentro.split('+');
    for (let j = 0; j < partes.length; j++) {
      const tipo = partes[j].replace(/\s+/g, ' ').trim().split(' ')[0];
      if (tipo && q.indexOf(tipo) >= 0) sc += 100;
    }
    if (k.indexOf('blazer') >= 0) sc += 10;
  }
  return sc + Math.min(k.length, 9);
}

// ── Margenexport.js · _margenComoObjetos_
function _margenComoObjetos_(headers, filasPlanas){
  return (filasPlanas || []).map(function(fila){
    var o = {};
    for (var i = 0; i < headers.length; i++) o[headers[i]] = fila[i];
    return o;
  });
}

// ── PlanillasExternas.gs · MARGEN_CONFIG_PROP
var MARGEN_CONFIG_PROP = 'MARGEN_CONFIG_DESDE_BASE';

// ── PlanillasExternas.gs · MARGEN_CONFIG_PESTANAS
var MARGEN_CONFIG_PESTANAS = ['Config_General', 'Config_Productos', 'MetaAdsInversion'];

// ── PlanillasExternas.gs · _MARGEN_CONFIG_FORZAR
var _MARGEN_CONFIG_FORZAR = null;

// ── PlanillasExternas.gs · _margenConfigDesdeBase_
function _margenConfigDesdeBase_(pestana) {
  if (MARGEN_CONFIG_PESTANAS.indexOf(pestana) < 0) return null;
  if (_MARGEN_CONFIG_FORZAR === 'hoja') return null;
  var quiere = _MARGEN_CONFIG_FORZAR === 'base' || String(getProp(MARGEN_CONFIG_PROP, '') || '').trim().toUpperCase() === 'SI';
  if (!quiere) return null;
  try {
    var r = _sbFetch_('GET', 'margen_config?select=fila,row_json&pestana=eq.' + encodeURIComponent(pestana) + '&order=fila.asc&limit=5000', null, {});
    if (!r || r.code >= 300) throw new Error('margen_config HTTP ' + (r && r.code));
    var arr = JSON.parse(r.body || '[]') || [];
    if (!arr.length) throw new Error('margen_config sin filas de ' + pestana);
    return arr.map(function (x) { return x.row_json || {}; });
  } catch (e) {
    try { Logger.log('[margenConfig] la base fallo, uso la planilla: ' + String((e && e.message) || e)); } catch (_) {}
    if (_MARGEN_CONFIG_FORZAR === 'base') throw e;
    return null;
  }
}

// ════════ MargenEngine.js (entero, tal cual) ════════
/**
 * MargenEngine.gs
 * Motor de cálculo del módulo "Margen de Contribución".
 * Vive en la spreadsheet aislada MargenWhatsAppAds (Tulula)
 * (id: 1e-Mw58FzItJ-OlMskKM4ivy23qTHkLDc_OAuuCVQUE4)
 *
 * Requiere 4 pestañas de configuración en esa misma spreadsheet
 * (ver instrucciones abajo para crearlas con el contenido semilla):
 *   - Config_Productos     (ProductoBase, Activo, ConjuntoGrupo, RolConjunto)
 *   - Config_Abreviaturas  (Abreviatura, Categoria)
 *   - Config_General       (Clave, Valor)
 *   - MetaAdsInversion     (Mes, Producto, InversionSoles)  <- Fase 1: cache manual
 *                                                               Fase 2: la llena la API de Meta sola
 */

var MARGEN_SS_ID = '1e-Mw58FzItJ-OlMskKM4ivy23qTHkLDc_OAuuCVQUE4';

// ---------- Lectura de configuración ----------

function _margenSS_() {
  return SpreadsheetApp.openById(MARGEN_SS_ID);
}

function _leerHojaComoObjetos_(nombreHoja) {
  // 19-set · BLOQUE H: con MARGEN_CONFIG_DESDE_BASE=SI las 3 pestañas de configuracion
  // (Config_General, Config_Productos, MetaAdsInversion) salen de public.margen_config.
  // Si la base falla o no trae filas, sigue la planilla como hoy (ver PlanillasExternas.gs).
  if (typeof _margenConfigDesdeBase_ === 'function') {
    var desdeBase = _margenConfigDesdeBase_(nombreHoja);
    if (desdeBase) return desdeBase;
  }
  var sh = _margenSS_().getSheetByName(nombreHoja);
  if (!sh) throw new Error('No existe la pestaña ' + nombreHoja);
  var data = sh.getDataRange().getValues();
  var headers = data[0];
  var out = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i].join('') === '') continue; // fila vacía
    var row = {};
    for (var j = 0; j < headers.length; j++) row[headers[j]] = data[i][j];
    out.push(row);
  }
  return out;
}

function _configGeneral_() {
  var rows = _leerHojaComoObjetos_('Config_General');
  var map = {};
  rows.forEach(function (r) { map[String(r.Clave).trim()] = r.Valor; });
  return map;
}

function _configProductosManual_() {
  var rows = _leerHojaComoObjetos_('Config_Productos');
  var activos = {};       // 'PANTALON MIRELLA' -> {conjuntoGrupo, rolConjunto}
  var conjuntos = {};      // 'MIRELLA' -> {BLAZER: 'BLAZER MIRELLA', PANTALON: 'PANTALON MIRELLA'}
  rows.forEach(function (r) {
    var activo = String(r.Activo).trim().toUpperCase() === 'TRUE';
    if (!activo) return;
    var nombre = String(r.ProductoBase).trim().toUpperCase();
    var grupo = String(r.ConjuntoGrupo || '').trim().toUpperCase();
    var rol = String(r.RolConjunto || '').trim().toUpperCase();
    activos[nombre] = { conjuntoGrupo: grupo, rolConjunto: rol };
    if (grupo) {
      if (!conjuntos[grupo]) conjuntos[grupo] = {};
      conjuntos[grupo][rol] = nombre;
    }
  });
  return { activos: activos, conjuntos: conjuntos };
}

// Fase A (catálogo automático): lee productosListar() -- misma fuente que el
// módulo Productos real (hoja Maestros, cacheada 10 min), agrupado por
// Producto+Diseño. Un Diseño con BLAZER y PANTALON activos ambos se detecta
// automáticamente como conjunto. Devuelve null si no hay nada que confiar
// (señal para usar el fallback manual).
function _configProductosAuto_() {
  var filas;
  try {
    filas = productosListar();
  } catch (e) {
    try { _silog_('margen.catalogoAuto.productosListar', e); } catch (_) {}
    return null;
  }
  if (!filas || !filas.length) return null;

  var porProdDiseno = {}; // 'PANTALON MIRELLA' -> {producto, diseno, activo}
  filas.forEach(function (f) {
    var prod = String(f.Producto || '').trim().toUpperCase();
    var dis = String(f.Diseno || '').trim().toUpperCase();
    if (!prod || !dis) return;
    var nombre = prod + ' ' + dis;
    var activo = String(f.Estado || '').trim().toUpperCase() === 'ACTIVO';
    if (!porProdDiseno[nombre]) porProdDiseno[nombre] = { producto: prod, diseno: dis, activo: false };
    if (activo) porProdDiseno[nombre].activo = true;
  });

  var activos = {};
  var porDiseno = {}; // 'MIRELLA' -> {BLAZER: 'BLAZER MIRELLA', PANTALON: 'PANTALON MIRELLA'}
  for (var nombre in porProdDiseno) {
    var d = porProdDiseno[nombre];
    if (!d.activo) continue;
    activos[nombre] = { conjuntoGrupo: d.diseno, rolConjunto: d.producto };
    if (!porDiseno[d.diseno]) porDiseno[d.diseno] = {};
    porDiseno[d.diseno][d.producto] = nombre;
  }

  var conjuntos = {};
  for (var diseno in porDiseno) {
    var par = porDiseno[diseno];
    if (par.BLAZER && par.PANTALON) conjuntos[diseno] = par;
  }

  return { activos: activos, conjuntos: conjuntos, _n: Object.keys(activos).length };
}

// FUSION, no interruptor (18-set-2026, Pablo: sin propiedades nuevas -- el
// proyecto ya esta en el tope de 50). Antes esto era un ON/OFF que
// reemplazaba la lista de 16 productos por el catalogo automatico completo.
// Ahora se fusionan los dos: el catalogo real (productosListar(), sin limite
// de 16) aporta lo que la lista manual todavia no tiene, y la lista manual
// manda en cualquier solapamiento (ahi viven los conjuntos armados a mano:
// Mirella, Antonia, Grecia). Si productosListar() falla, cae solo en la
// lista manual, exactamente como se comportaba antes de este cambio -- no
// hay forma de que esto deje a Margen con MENOS productos que antes.
function _configProductos_() {
  var manual = _configProductosManual_();
  try {
    var auto = _configProductosAuto_();
    if (auto && auto._n > 0) {
      for (var nombre in auto.activos) {
        if (!manual.activos[nombre]) manual.activos[nombre] = auto.activos[nombre];
      }
      for (var grupo in auto.conjuntos) {
        if (!manual.conjuntos[grupo]) manual.conjuntos[grupo] = auto.conjuntos[grupo];
      }
    }
  } catch (e) {
    try { _silog_('margen.catalogoAuto', e); } catch (_) {}
  }
  return manual;
}

// ---------- Utilidades ----------

function _toFloat_(x) {
  if (x === '' || x === null || x === undefined) return 0;
  var n = parseFloat(x);
  return isNaN(n) ? 0 : n;
}

function _fechaComoDate_(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  var s = String(v).trim();
  if (!s) return null;
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function _mesDe_(d) {
  if (!d) return null;
  return Utilities.formatDate(d, 'America/Lima', 'yyyy-MM');
}

function _productoBase_(prenda, activos) {
  var p = String(prenda || '').trim().toUpperCase();
  var mejor = null;
  for (var nombre in activos) {
    if (p === nombre || p.indexOf(nombre + ' ') === 0) {
      if (!mejor || nombre.length > mejor.length) mejor = nombre;
    }
  }
  return mejor;
}

function _aplicarConjuntos_(productosPedido, conjuntos) {
  var set = {};
  productosPedido.forEach(function (p) { set[p] = true; });
  for (var grupo in conjuntos) {
    var par = conjuntos[grupo];
    if (par.BLAZER && par.PANTALON && set[par.BLAZER] && set[par.PANTALON]) {
      delete set[par.BLAZER];
      delete set[par.PANTALON];
      set['CONJUNTO ' + grupo] = true;
    }
  }
  return Object.keys(set);
}

// ---------- Inversión Meta Ads (Fase 1: lee cache; Fase 2: lo llena la API) ----------

function _inversionPorProductoYMes_(mesDesde, mesHasta) {
  // 26-oct (Pablo: «Margen no jala la inversión de anuncios ni el CPA») · la pestaña MetaAdsInversion se llenaba A MANO por mes y
  // octubre nunca se cargó (S/ 0). Ahora, en el ERP, la inversión sale SOLA del gasto real de Meta por anuncio y por día
  // (bot_remote.gasto_anuncios vía public.margen_inversion_auto), del rango exacto. Si eso falla o no trae nada, sigue la planilla.
  var rows = (typeof window !== 'undefined' && window.__mgInvAuto && window.__mgInvAuto.length) ? window.__mgInvAuto : _leerHojaComoObjetos_('MetaAdsInversion');
  var out = {};
  rows.forEach(function (r) {
    var mes = _mesNormalizado_(r.Mes);
    if (mes < mesDesde || mes > mesHasta) return;
    var prod = String(r.Producto).trim().toUpperCase();
    if (!out[mes]) out[mes] = {};
    out[mes][prod] = (out[mes][prod] || 0) + _toFloat_(r.InversionSoles);
  });
  return out;
}

// ---------- 20-set · ¿este nombre es un producto de VERDAD? ----------

/**
 * 20-set-2026 · Pablo. La pantalla Margen mostraba filas con 0 ventas y con
 * inversion de Ads (VARIOS, PANTALONES, BLUSAS, TOPS) marcadas «Gastando sin
 * ventas». PANTALONES y BLUSAS son CATEGORIAS del ERP y VARIOS/TOPS son nombres
 * genericos de campaña: ninguna venta se les va a pegar NUNCA, asi que salian
 * asi para siempre. Peor: esa plata (S/ 1067.63 del 01→20 de setiembre) no se
 * le descuenta a ningun producto real, y entonces el CPA y el margen de los que
 * SI venden salen mejores de lo que son.
 * Esto responde: el nombre esta en el catalogo / Config_Productos (producto real,
 * puede que no haya vendido en el periodo) o no esta en ninguno (no atribuible).
 * No cambia ninguna cuenta: solo clasifica.
 */
function _margenEsProductoReal_(prod, activos, conjuntos) {
  var p = String(prod || '').trim().toUpperCase();
  if (!p) return false;
  // _productoBase_ ya resuelve el nombre exacto y el que empieza igual
  // ('VESTIDO ROSA FLORAL' cuenta como 'VESTIDO ROSA').
  if (activos && _productoBase_(p, activos)) return true;
  // 'CONJUNTO MIRELLA' es un producto real armado (blazer + pantalon del mismo diseño).
  if (p.indexOf('CONJUNTO ') === 0 && conjuntos && conjuntos[p.slice(9)]) return true;
  return false;
}

// ---------- Motor principal ----------

/**
 * margenCalcular(fechaInicio, fechaFin)
 * fechaInicio, fechaFin: strings 'YYYY-MM-DD' (inclusive ambos extremos)
 */
function margenCalcular(fechaInicio, fechaFin) {
  var cfg = _configGeneral_();
  var gastoAdminMes = _toFloat_(cfg['GastoAdminMensual']) || 8000;

  var productos = _configProductos_();
  var activos = productos.activos;
  var conjuntos = productos.conjuntos;

  var dIni = _fechaRangoDesdeString_(fechaInicio);
  var dFin = _fechaRangoDesdeString_(fechaFin);
  dFin.setHours(23, 59, 59, 999);

  // 19-set-2026 · Bloque G: la puerta decide planilla o base (MARGEN_DESDE_BASE, ver MargenBase.gs).
  var filas = _margenFilasVentas_(fechaInicio, fechaFin);

  var porPedido = {};
  filas.forEach(function (f) {
    var prenda = String(f.Prenda || '').trim().toUpperCase();
    if (prenda.indexOf('CAMBIO') === 0) return;
    var nro = String(f.NroPedido).trim();
    if (!porPedido[nro]) porPedido[nro] = [];
    porPedido[nro].push(f);
  });

  var mesesTocados = {};
  var pedidosDelRango = [];

  for (var nro in porPedido) {
    var lineas = porPedido[nro];
    var fPago = _fechaComoDate_(lineas[0].FechaPago);
    var fPedido = _fechaComoDate_(lineas[0].FechaPedido);
    var fechaPedidoEfectiva = fPago || fPedido;
    if (!fechaPedidoEfectiva) continue;
    if (fechaPedidoEfectiva < dIni || fechaPedidoEfectiva > dFin) continue;

    var mes = _mesDe_(fechaPedidoEfectiva);
    mesesTocados[mes] = (mesesTocados[mes] || 0) + 1;
    pedidosDelRango.push({ nro: nro, lineas: lineas, mes: mes });
  }

  var totalPedidosPorMes = mesesTocados;

  var stats = {};

  pedidosDelRango.forEach(function (p) {
    var lineas = p.lineas;
    var productosPedido = [];
    var lineasPorProducto = {};
    lineas.forEach(function (l) {
      var base = _productoBase_(l.Prenda, activos);
      if (!base) return;
      productosPedido.push(base);
      if (!lineasPorProducto[base]) lineasPorProducto[base] = [];
      lineasPorProducto[base].push(l);
    });
    productosPedido = _aplicarConjuntos_(productosPedido, conjuntos);
    // 19-set · MARGEN_MISMA_LISTA (Pablo): el total del margen tiene que ser EXACTAMENTE la lista del Embudo (71).
    // Antes: (1) un pedido cuya prenda no esta en Config_Productos se perdia; (2) un pedido con 2 productos contaba 2 veces.
    // Ahora, con la lista encendida: cada pedido cuenta UNA vez, en su producto principal (el de mayor venta en el pedido;
    // un conjunto gana), y si ninguna prenda esta configurada va a 'OTROS (SIN PRODUCTO)'. Asi la suma de la tabla = la lista.
    if (typeof _margenMismaListaActiva_ === 'function' && _margenMismaListaActiva_()) {
      if (productosPedido.length === 0) productosPedido = ['OTROS (SIN PRODUCTO)'];
      else if (productosPedido.length > 1) {
        var mejor = null, mejorV = -1;
        productosPedido.forEach(function (prod) {
          var ls = lineasPorProducto[prod];
          var v = ls ? ls.reduce(function (a, l) { return a + _toFloat_(l.PrecioUnit); }, 0) : Infinity;   // conjunto: no tiene lineas propias → gana
          if (v > mejorV) { mejorV = v; mejor = prod; }
        });
        productosPedido = [mejor];
      }
    }
    if (productosPedido.length === 0) return;

    // 05-sep-2026 · Pablo: el costo debe reflejar el costo de TODAS las
    // prendas del pedido, igual que ingresoPedido ya suma TODAS las prendas
    // del pedido (no solo la/s prenda/s del producto identificado). Antes,
    // "Conjunto Antonia" (Blazer+Pantalon) sumaba costo solo de esas 2
    // prendas; si el mismo pedido traia ademas otra prenda, el ingreso del
    // pedido SI la incluia y el costo NO -> CPA/Margen injustos. Pablo lo
    // detecto comparando PrecioVentaProm (~2 conjuntos) vs CostoProm (menos
    // de 2 conjuntos) en Conjunto Antonia.
    var ingresoPedido = 0, costoPedido = 0;
    lineas.forEach(function (l) {
      ingresoPedido += _toFloat_(l.PrecioUnit);
      costoPedido += _toFloat_(l.CostoUnit);
    });

    productosPedido.forEach(function (prod) {
      if (!stats[prod]) stats[prod] = { pedidos: [], costos: [], ingresos: [], meses: [] };
      stats[prod].pedidos.push(p.nro);
      stats[prod].costos.push(costoPedido);
      stats[prod].ingresos.push(ingresoPedido);
      stats[prod].meses.push(p.mes);
    });
  });

  var mesInicio = _mesDe_(dIni), mesFin = _mesDe_(dFin);
  var inversion = _inversionPorProductoYMes_(mesInicio, mesFin);

  var salida = [];
  var todosLosProductos = Object.keys(stats);
  for (var mes in inversion) {
    for (var prod in inversion[mes]) {
      if (todosLosProductos.indexOf(prod) === -1) todosLosProductos.push(prod);
    }
  }

  todosLosProductos.forEach(function (prod) {
    var d = stats[prod];
    var n = d ? d.pedidos.length : 0;

    var inv = 0;
    for (var mes in inversion) inv += (inversion[mes][prod] || 0);

    // 17-set-2026 · Pablo: el Gasto Admin Mensual (Config_General) sale del
    // margen por SKU. Ningun producto debe cargar mas o menos overhead solo
    // por cuantos pedidos tuvo el NEGOCIO ese mes (costeo variable: el gasto
    // fijo es un gasto del PERIODO, no de la unidad). Se resta una sola vez,
    // a nivel de todo el periodo, en gastoAdminTotalPeriodo (ver mas abajo).
    var ingresoTotalProd = n ? d.ingresos.reduce(function (a, b) { return a + b; }, 0) : 0;
    var costoTotalProd = n ? d.costos.reduce(function (a, b) { return a + b; }, 0) : 0;
    var precioVentaProm = n ? ingresoTotalProd / n : 0;
    var costoProm = n ? costoTotalProd / n : 0;
    var cpaReal = n ? inv / n : 0;
    // CPA Max = margen bruto unitario de ESTE producto: lo maximo que se
    // puede pagar en Ads por pedido antes de perder plata en el, sin mezclar
    // el gasto administrativo del negocio.
    var cpaMaxProm = precioVentaProm - costoProm;
    var margen = cpaMaxProm - cpaReal;

    // 06-sep-2026 · Pablo: margen bruto % (Precio venta - Costo, SIN envio,
    // SIN publicidad, SIN gasto admin) como chequeo rapido de sanidad de
    // costos, independiente del ruido de Meta Ads. Pablo referencia ~61%
    // como benchmark esperado para Tulula.
    var margenBrutoPct = precioVentaProm ? ((precioVentaProm - costoProm) / precioVentaProm) * 100 : 0;

    salida.push({
      Producto: prod,
      Ventas: n,
      PrecioVentaProm: Math.round(precioVentaProm * 100) / 100,
      CostoProm: Math.round(costoProm * 100) / 100,
      MargenBrutoPct: Math.round(margenBrutoPct * 100) / 100,
      InversionMetaAds: Math.round(inv * 100) / 100,
      CPA: Math.round(cpaReal * 100) / 100,
      CPAMax: Math.round(cpaMaxProm * 100) / 100,
      Margen: Math.round(margen * 100) / 100,
      IngresoTotal: Math.round(ingresoTotalProd * 100) / 100,
      CostoTotal: Math.round(costoTotalProd * 100) / 100
    });
  });

  salida.sort(function (a, b) { return b.Ventas - a.Ventas; });

  // ══════════════════════════════════════════════════════════════════════
  // 20-set-2026 · LOS TRES BALDES DE LA INVERSION DE ADS (pedido de Pablo).
  // La misma inversion de siempre, separada en tres para que la pantalla pueda
  // decir la verdad. NO se toca ninguna formula: el margen, las ventas y el
  // total de inversion salen exactamente iguales que antes de este cambio.
  //   conVentas   → pegada a productos que SI vendieron en el periodo
  //   sinVentas   → productos REALES que no vendieron en el periodo (gasto
  //                 genuino: la campaña corrio y no vendio; hay que revisarla)
  //   noAtribuido → nombres que no son ningun producto (categorias como
  //                 PANTALONES/BLUSAS o campañas genericas como VARIOS/TOPS):
  //                 esa plata no se le va a poder pegar a un producto NUNCA
  // `total` se suma aparte, fila por fila, SIN depender de los tres baldes: asi
  // la prueba de cuadre (total = a + b + c) puede fallar de verdad si un balde
  // se pierde por el camino.
  // ══════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════
  // 20-set-2026 · ATRIBUIR LA INVERSION DE ADS AL PRODUCTO QUE SE COMPRO.
  // Interruptor ADS_ATRIBUIR_POR_COMPRA (nace APAGADO: solo 'SI' enciende).
  // La regla vive ENTERA en AdsAtribucion.gs; aca solo se la llama, y SIEMPRE
  // antes de armar los tres baldes, para que los baldes cuenten la plata ya
  // movida y el invariante «total = conVentas + sinVentas + noAtribuido» siga
  // valiendo exactamente igual que hoy.
  // Apagado devuelve null y no cambia NI UNA COMA. Si reventara, se registra y
  // el margen sigue como hoy: esto nunca debe tumbar la pantalla.
  // ══════════════════════════════════════════════════════════════════════
  var _atribPorCompra_ = null;
  try {
    if (typeof _adsAtribucionAplicar_ === 'function') {
      _atribPorCompra_ = _adsAtribucionAplicar_(salida, pedidosDelRango, activos, conjuntos, fechaInicio, fechaFin);
    }
  } catch (e) {
    try { _silog_('margen.adsAtribucion', e); } catch (_) {}
    _atribPorCompra_ = null;
  }

  var bal = { total: 0, conVentas: 0, sinVentas: 0, noAtribuido: 0, detalleSinVentas: [], detalleNoAtribuido: [] };
  salida.forEach(function (r) {
    var monto = _toFloat_(r.InversionMetaAds);
    bal.total += monto;
    if (r.Ventas > 0) { r.BaldeInversion = 'CON_VENTAS'; bal.conVentas += monto; return; }
    if (_margenEsProductoReal_(r.Producto, activos, conjuntos)) {
      r.BaldeInversion = 'PRODUCTO_SIN_VENTAS';
      if (monto > 0) { bal.sinVentas += monto; bal.detalleSinVentas.push({ nombre: r.Producto, monto: monto }); }
      return;
    }
    r.BaldeInversion = 'NO_ATRIBUIBLE';
    if (monto > 0) { bal.noAtribuido += monto; bal.detalleNoAtribuido.push({ nombre: r.Producto, monto: monto }); }
  });
  var _r2_ = function (n) { return Math.round(n * 100) / 100; };
  var _mayorPrimero_ = function (x, y) { return y.monto - x.monto; };
  bal.detalleSinVentas.sort(_mayorPrimero_);
  bal.detalleNoAtribuido.sort(_mayorPrimero_);
  var inversionBaldes = {
    total: _r2_(bal.total),
    conVentas: _r2_(bal.conVentas),
    sinVentas: _r2_(bal.sinVentas),
    noAtribuido: _r2_(bal.noAtribuido),
    detalleSinVentas: bal.detalleSinVentas.map(function (x) { return { nombre: x.nombre, monto: _r2_(x.monto) }; }),
    detalleNoAtribuido: bal.detalleNoAtribuido.map(function (x) { return { nombre: x.nombre, monto: _r2_(x.monto) }; })
  };

  // 17-set-2026 · Pablo: el gasto admin ya NO viaja pegado al array (un
  // JSON.stringify de un array descarta cualquier propiedad extra que no
  // sea un indice — se habria perdido en el primer cache-hit). Va aparte,
  // en su propia clave, dentro de un objeto {productos, gastoAdminTotalPeriodo}.
  var resultado = {
    productos: salida,
    gastoAdminTotalPeriodo: Math.round(_gastoAdminProrateado_(fechaInicio, fechaFin, gastoAdminMes) * 100) / 100,
    // 20-set · los tres baldes viajan aparte, igual que gastoAdminTotalPeriodo
    // (un array no puede llevar propiedades extra a traves de JSON.stringify).
    inversionBaldes: inversionBaldes
  };
  // 20-set · con ADS_ATRIBUIR_POR_COMPRA apagado esto es null y la clave NO
  // viaja: la pantalla recibe EXACTAMENTE el mismo JSON de siempre.
  if (_atribPorCompra_) resultado.atribucionPorCompra = _atribPorCompra_;
  // 21-set · LA LISTA ES EXACTA: con MARGEN_DESDE_VISTA_ADS encendido, la cantidad de
  // ventas del Margen TIENE que ser la misma que la de erp.v_compras_ads. La pantalla
  // esconde las filas sin inversion de Ads, y la fila OTROS (SIN PRODUCTO) no tiene
  // inversion: esa fila escondida se llevaba 1 venta de la cuenta (66 → 65). Con este
  // aviso la pantalla no esconde ninguna fila que tenga ventas.
  // APAGADO la clave NO viaja: la pantalla recibe EXACTAMENTE el mismo JSON de siempre.
  try { if (typeof _margenDesdeVistaAdsActiva_ === 'function' && _margenDesdeVistaAdsActiva_()) resultado.listaExacta = true; } catch (e) {}
  return resultado;
}

// ---------- Gasto administrativo del período (prorrateado por días) ----------

/**
 * El Gasto Admin Mensual (Config_General) es un costo FIJO del período, no
 * de cada pedido. Se prorratea por los días del rango dentro de cada mes
 * calendario que toca — no por cuantos pedidos hubo, que es lo que hacia
 * artificial la version anterior (un mes con pocos pedidos "cargaba" mas
 * gasto admin por pedido que uno con muchos, sin ninguna razon real).
 */
function _gastoAdminProrateado_(fechaInicioStr, fechaFinStr, gastoAdminMes) {
  var dIni = _fechaRangoDesdeString_(fechaInicioStr);
  var dFin = _fechaRangoDesdeString_(fechaFinStr);
  var total = 0;
  var cursor = new Date(dIni.getFullYear(), dIni.getMonth(), 1);
  var limite = new Date(dFin.getFullYear(), dFin.getMonth(), 1);
  while (cursor <= limite) {
    var inicioMes = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    var finMes = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    var overlapIni = dIni > inicioMes ? dIni : inicioMes;
    var overlapFin = dFin < finMes ? dFin : finMes;
    var diasEnMes = finMes.getDate();
    var diasOverlap = Math.round((overlapFin - overlapIni) / 86400000) + 1;
    if (diasOverlap > 0) total += gastoAdminMes * (diasOverlap / diasEnMes);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return total;
}

// ---------- Helpers de filtro de fecha (para el frontend) ----------

function margenRangoMes(anio, mes) {
  var ini = new Date(anio, mes - 1, 1);
  var fin = new Date(anio, mes, 0);
  return {
    inicio: Utilities.formatDate(ini, 'America/Lima', 'yyyy-MM-dd'),
    fin: Utilities.formatDate(fin, 'America/Lima', 'yyyy-MM-dd')
  };
}

function margenRangoTrimestre(anio, trimestre) {
  var mesIni = (trimestre - 1) * 3 + 1;
  var ini = new Date(anio, mesIni - 1, 1);
  var fin = new Date(anio, mesIni + 2, 0);
  return {
    inicio: Utilities.formatDate(ini, 'America/Lima', 'yyyy-MM-dd'),
    fin: Utilities.formatDate(fin, 'America/Lima', 'yyyy-MM-dd')
  };
}

// ---------- Pruebas manuales ----------

function margenCalcularProbarAgosto() {
  var r = margenCalcular('2026-08-01', '2026-08-31');
  Logger.log(JSON.stringify(r, null, 2));
}

function margenCalcularProbarJunAgo() {
  var r = margenCalcular('2026-06-01', '2026-08-31');
  Logger.log(JSON.stringify(r, null, 2));
}

function _fechaRangoDesdeString_(s) {
  var partes = String(s).split('-');
  return new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
}

function _mesNormalizado_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, 'America/Lima', 'yyyy-MM');
  }
  var s = String(v || '').trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  var d = new Date(s);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, 'America/Lima', 'yyyy-MM');
  return s;
}

// ════════ MargenBase.gs (entero, tal cual) ════════
/*****************************************************************
 * MargenBase.gs — 19-set-2026 · BLOQUE G: MARGEN DESDE LA BASE
 *
 * QUE LEIA HASTA HOY margenCalcular (MargenEngine.js)
 *   · Las VENTAS (una fila por prenda de cada pedido WHATSAPP COMPLETO, con su
 *     costo ya pegado) salian de la pestaña MargenWhatsAppAds de la planilla
 *     externa MARGEN_SS_ID. Esa pestaña la llena Margenexport.js a partir de la
 *     hoja Pedidos + public.pagos + la hoja Cost (_costMap_).
 *   · Config_General, Config_Productos y MetaAdsInversion: tambien de la
 *     planilla externa. NO tienen tabla en la base: se siguen leyendo de ahi.
 *
 * QUE CAMBIA (solo la LECTURA de las ventas)
 *   Con MARGEN_DESDE_BASE = 'SI', las mismas filas se arman desde la base:
 *     public.pedidos (rango de fechas, sin eliminados) + public.pagos (el mismo
 *     puente _pbPegarPagos_ que usa el export) + public.cost_hoja (costos;
 *     si falla, _costMap_ de la hoja Cost). Mismo pagoDePedido, mismo
 *     _costDePrenda_: la regla es la del export, no una nueva.
 *   Vacio (o cualquier otra cosa) = como hoy. Si la base falla, cae sola a la
 *   planilla. El export (ESCRITURA de MargenWhatsAppAds) no se toca.
 *   20-set · el export se RETIRO: sin base, error MARGEN_SIN_BASE (ya no cae a la pestaña).
 *
 * Comparador (solo lee): margenBaseComparar(desde, hasta)
 * Encender: margenBaseEncender() — solo si el comparador da limpio
 * Reversa:  margenBaseApagar()
 *****************************************************************/

var MARGEN_BASE_PROP       = 'MARGEN_DESDE_BASE';
var MARGEN_BASE_INFORME    = 'MARGEN_BASE_INFORME';
var MARGEN_BASE_PAGINA     = 1000;
var MARGEN_BASE_VUELTAS    = 200;   // freno, no meta
var MARGEN_BASE_COLCHON    = 120;   // dias antes del rango: pedidos viejos pagados dentro del rango
var _MARGEN_FORZAR         = null;  // 'hoja' | 'base' | null (solo el comparador lo usa)
var _MARGEN_ORIGEN         = '';    // de donde salio la ultima lectura de ventas
var _MARGEN_ULTIMAS_FILAS  = null;
var _MARGEN_COSTO_ORIGEN   = '';

// Columnas que se traen de pedidos. `->>` va como -%3E%3E en la URL.
var MARGEN_BASE_COLS = 'nro_pedido,prenda,precio,envio,subtotal,pago,fecha_pedido,fecha_pago,eliminado,' +
  'canal:row_json-%3E%3ECANAL,origen:row_json-%3E%3EORIGEN,periodo:row_json-%3E%3EPeriodo,' +
  'forma:row_json-%3E%3E%22Forma%20pago%22,pid:row_json-%3E%3EPagoId,epm:row_json-%3E%3EEstadoPagoManual';

function _margenBaseLog_(m) { try { Logger.log('[MargenBase] ' + m); } catch (e) {} }
function _margenBaseEncendido_() {
  try { return String(getProp(MARGEN_BASE_PROP, '') || '').trim().toUpperCase() === 'SI'; } catch (e) { return false; }
}

/** LA PUERTA que usa margenCalcular: filas tipo MargenWhatsAppAds, de la base o de la planilla. */
function _margenFilasVentas_(fechaInicio, fechaFin) {
  var quiereBase = _MARGEN_FORZAR === 'base' || (_MARGEN_FORZAR !== 'hoja' && _margenBaseEncendido_());
  var filas;
  if (quiereBase) {
    try {
      filas = _margenFilasBase_(fechaInicio, fechaFin);
      _MARGEN_ORIGEN = 'base'; _MARGEN_ULTIMAS_FILAS = filas;
      return filas;
    } catch (e) {
      _margenBaseLog_('la base fallo, uso la planilla: ' + String((e && e.message) || e));
      try { _silog_('margen.base', e); } catch (_) {}
      if (_MARGEN_FORZAR === 'base') throw e;
    }
  }
  // 20-set · BLOQUE H (Pablo): el export a MargenWhatsAppAds se RETIRO: esa pestaña quedo vieja y leerla
  // daria un margen equivocado sin avisar. Error claro. Solo el comparador (_MARGEN_FORZAR='hoja') la abre.
  if (_MARGEN_FORZAR !== 'hoja') throw new Error('MARGEN_SIN_BASE: ' + (quiereBase ? 'la base no contesto' : 'MARGEN_DESDE_BASE esta apagado') +
    ' y la pestaña MargenWhatsAppAds ya no se actualiza (export retirado el 20-set). Reintentar en un momento, o margenBaseEncender().');
  filas = _leerHojaComoObjetos_('MargenWhatsAppAds');
  _MARGEN_ORIGEN = 'hoja'; _MARGEN_ULTIMAS_FILAS = filas;
  return filas;
}

/** GET paginado: avanza por lo RECIBIDO y para SOLO con una pagina vacia. Lanza si falla. */
function _margenBaseGet_(ruta) {
  var out = [], off = 0;
  for (var v = 0; v < MARGEN_BASE_VUELTAS; v++) {
    var r = _sbFetch_('GET', ruta + '&limit=' + MARGEN_BASE_PAGINA + '&offset=' + off, null, {});
    if (!r || r.code >= 300) throw new Error('base HTTP ' + (r && r.code) + ' ' + String((r && r.body) || '').slice(0, 120));
    var a = JSON.parse(r.body || '[]') || [];
    if (!a.length) return out;
    for (var i = 0; i < a.length; i++) out.push(a[i]);
    off += a.length;
  }
  throw new Error('tope de vueltas: la lista vendria cortada');
}

/** 'yyyy-MM-dd' → medianoche de Lima (como la hoja); ISO → Date; lo demas igual. */
function _margenBaseFecha_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) return v;
  var s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T05:00:00.000Z');
  var d = new Date(s);
  return isNaN(d.getTime()) ? s : d;
}

/** Costos desde public.cost_hoja (mismo formato que _costMap_). Si falla, la hoja Cost. */
function _margenCostosBase_() {
  try {
    var filas = _margenBaseGet_('cost_hoja?select=row_json&order=id.asc');
    var rows = [];
    filas.forEach(function (x) { if (x && x.row_json) rows.push(x.row_json); });
    if (!rows.length) throw new Error('cost_hoja vacia');
    var col = function (o, nombres) {
      for (var k in o) {
        var kn = String(k).trim().toLowerCase();
        for (var n = 0; n < nombres.length; n++) if (kn === nombres[n]) return o[k];
      }
      return undefined;
    };
    var map = {}, keys = [];
    rows.forEach(function (o) {
      var d = col(o, ['diseno', 'diseño']), tipo = col(o, ['tipo de prenda', 'tipo', 'tipoprenda']), mod = col(o, ['modelo']);
      var diseno = '';
      if (d !== undefined) diseno = String(d || '').trim();
      else if (tipo !== undefined && mod !== undefined) diseno = (String(tipo || '').trim() + ' ' + String(mod || '').trim()).trim();
      else if (mod !== undefined) diseno = String(mod || '').trim();
      var k = diseno.toLowerCase();
      if (!k) return;
      map[k] = { unit: parseFloat(col(o, ['costounitario', 'costo unitario'])) || 0,
                 paq: parseFloat(col(o, ['costopaqueteria', 'costo paqueteria', 'costo paquetería'])) || 0 };
      keys.push(k);
    });
    if (!keys.length) throw new Error('cost_hoja sin disenos');
    keys.sort(function (a, b) { return b.length - a.length; });
    _MARGEN_COSTO_ORIGEN = 'base';
    return { map: map, keys: keys };
  } catch (e) {
    _margenBaseLog_('costos de la base no disponibles, uso la hoja Cost: ' + String((e && e.message) || e));
    _MARGEN_COSTO_ORIGEN = 'hoja';
    return _costMap_();
  }
}

/** Las filas de MargenWhatsAppAds, armadas desde la base para el rango. Lanza si no puede. */
function _margenFilasBase_(fechaInicio, fechaFin) {
  var dIni = _fechaRangoDesdeString_(fechaInicio), dFin = _fechaRangoDesdeString_(fechaFin);
  var desde = new Date(dIni.getTime() - MARGEN_BASE_COLCHON * 86400000);
  var hasta = new Date(dFin.getTime() + 2 * 86400000);
  // 19-set · MARGEN_MISMA_LISTA=SI: los pedidos son LA lista de Embudo/Marketing (VentasAds.gs), no un filtro propio.
  // 21-set · y con MARGEN_DESDE_VISTA_ADS=SI esa lista sale de erp.v_compras_ads, la MISMA que
  // usan Ventas y Marketing (MargenVistaAds.gs). La lista del bot queda para decir QUE ANUNCIO
  // vendio, que es para lo que sirve. Si el archivo nuevo no esta, todo sigue como antes.
  // 21-set (2) · LA LISTA SE PIDE PRIMERO, porque ahora decide COMO se piden los pedidos.
  var lista = (typeof _margenListaParaElMargen_ === 'function')
    ? _margenListaParaElMargen_(fechaInicio, fechaFin)
    : (_margenMismaListaActiva_() ? _margenListaCompartida_(fechaInicio, fechaFin) : null);

  // ════════════════════════════════════════════════════════════════════════
  // 21-set · MARGEN_SOLO_LOS_PEDIDOS (MargenSoloPedidos.gs, APAGADO por defecto)
  //
  // Medido: esta consulta traia 8.566 filas para quedarse con 117. El colchon
  // de 120 dias existe para pescar pedidos viejos pagados dentro del rango,
  // pero cuando HAY LISTA ya sabemos los numeros exactos que hacen falta, y
  // mas abajo (linea del `if (lista)`) se descarta todo lo que no este en
  // ella. O sea: el 98.6% del viaje ya se tiraba.
  //
  // Con el interruptor encendido se piden SOLO los de la lista, por numero,
  // reusando _margenListaFaltantes_ con crudas = [] (esa funcion ya traia por
  // numero, en tandas de 100, los pedidos que la ventana no alcanzaba).
  // Sin lista, o con el interruptor apagado, todo queda exactamente igual.
  // ════════════════════════════════════════════════════════════════════════
  var crudas;
  var _soloLista = lista && typeof _margenSoloLosPedidos_ === 'function' && _margenSoloLosPedidos_();
  if (_soloLista) {
    crudas = _margenListaFaltantes_([], lista);
  } else {
    crudas = _margenBaseGet_('pedidos?select=' + MARGEN_BASE_COLS + '&eliminado=is.null' +
      '&fecha_pedido=gte.' + desde.toISOString() + '&fecha_pedido=lt.' + hasta.toISOString() + '&order=id.asc');
    if (lista) crudas = crudas.concat(_margenListaFaltantes_(crudas, lista));
  }
  if (!crudas.length && !(lista && !lista.n)) throw new Error('la base no devolvio pedidos en el rango');

  var pagosBase = (typeof _pagosDeLaBaseCacheados_ === 'function') ? _pagosDeLaBaseCacheados_() : null;
  if (!pagosBase && !lista) throw new Error('public.pagos no contesto (sin pagos no se sabe quien esta COMPLETO)');

  var H = [C.NRO, C.PRENDA, C.PRECIO, C.ENVIO, C.SUBTOTAL, C.PAGO, C.FORMA_PAGO, C.FECHA_PEDIDO,
           C.FECHA_PAGO, C.PERIODO, C.CANAL, C.ORIGEN, 'PagoId', 'EstadoPagoManual', 'Eliminado'];
  var porNro = {}, orden = [];
  crudas.forEach(function (x) {
    var el = x.eliminado;
    if (el === true || String(el == null ? '' : el).trim().toUpperCase() === 'SI') return;
    var nro = String(x.nro_pedido == null ? '' : x.nro_pedido).trim();
    if (!nro) return;
    if (!porNro[nro]) { porNro[nro] = []; orden.push(nro); }
    porNro[nro].push([nro, x.prenda || '', x.precio, x.envio, x.subtotal, x.pago, x.forma || '',
      _margenBaseFecha_(x.fecha_pedido), _margenBaseFecha_(x.fecha_pago), x.periodo || '',
      x.canal || '', x.origen || '', x.pid || '', x.epm || '', '']);
  });

  var costData = _margenCostosBase_();
  var out = [];
  orden.forEach(function (nro) {
    var filas = porNro[nro], canal = '';
    for (var i = 0; i < filas.length; i++) { var vc = String(filas[i][10] || '').trim().toUpperCase(); if (vc) { canal = vc; break; } }
    if (lista) { if (!lista.fechaDe[nro]) return; }      // manda la lista: ni canal ni COMPLETO propios
    else if (canal !== 'WHATSAPP') return;
    var h = H, r = filas;
    if (!lista && pagosBase.length && typeof _pbPegarPagos_ === 'function') {
      var pg = _pbPegarPagos_({ h: H, r: filas }, pagosBase);
      if (pg && pg.r) { h = pg.h; r = pg.r; }
    }
    var objs = _margenComoObjetos_(h, r);
    var calc = lista ? { estado: 'COMPLETO', fechaPago: lista.fechaDe[nro] } : pagoDePedido(_margenSinEnvioRepetido_(objs));
    if (calc.estado !== 'COMPLETO') return;
    var origen = '', forma = '';
    objs.forEach(function (o) {
      if (!origen && String(o[C.ORIGEN] || '').trim()) origen = String(o[C.ORIGEN]).trim();
      if (!forma && String(o[C.FORMA_PAGO] || '').trim()) forma = String(o[C.FORMA_PAGO]).trim();
    });
    objs.forEach(function (o) {
      var prenda = String(o[C.PRENDA] || '').trim();
      if (!prenda || prenda.toUpperCase() === EST.FILA_PAGO) return;
      var costo = _costDePrenda_(prenda, costData);
      out.push({ NroPedido: nro, FechaPedido: o[C.FECHA_PEDIDO] || '', FechaPago: _margenBaseFecha_(calc.fechaPago || ''),
        Periodo: o[C.PERIODO] || '', Prenda: prenda, PrecioUnit: parseFloat(o[C.PRECIO]) || 0,
        Envio: parseFloat(o[C.ENVIO]) || 0, Subtotal: parseFloat(o[C.SUBTOTAL]) || 0,
        CostoUnit: costo.unit || 0, CostoPaq: costo.paq || 0, Canal: canal, Origen: origen, FormaPago: forma });
    });
  });
  // 21-set · un pedido que la vista cuenta y que en public.pedidos no tiene NI UNA prenda
  // no puede desaparecer sin que nadie se entere: entra como fila visible (OTROS (SIN PRODUCTO))
  // y mrg_10_COMPARAR_FUENTES() lo lista por su numero. Solo para la lista de la vista:
  // con el interruptor apagado el Margen se comporta EXACTAMENTE como hoy.
  if (lista && typeof MRGV_FUENTE === 'string' && lista.fuente === MRGV_FUENTE && typeof _margenVistaHuerfanos_ === 'function')
    out = _margenVistaHuerfanos_(out, lista);
  _margenBaseLog_((_soloLista ? '[solo la lista] ' : '') + crudas.length + ' filas de pedidos → ' + out.length + ' prendas ' + (lista ? 'de la lista compartida (' + lista.fuente + ', ' + lista.n + ' pedidos)' : 'WHATSAPP completas') + ' (costos: ' + _MARGEN_COSTO_ORIGEN + ')');
  return out;
}

// ── EL COMPARADOR (solo lee; escribe UNA propiedad: su informe) ───────────
function _margenPedidosEnRango_(filas, fechaInicio, fechaFin) {
  var dIni = _fechaRangoDesdeString_(fechaInicio), dFin = _fechaRangoDesdeString_(fechaFin);
  dFin.setHours(23, 59, 59, 999);
  var m = {}, prim = {};
  (filas || []).forEach(function (f) {
    var prenda = String(f.Prenda || '').trim().toUpperCase();
    if (prenda.indexOf('CAMBIO') === 0) return;
    var nro = String(f.NroPedido).trim();
    if (!prim[nro]) prim[nro] = f;          // margenCalcular mira la fecha de la PRIMERA linea
    (m[nro] = m[nro] || { ing: 0, costo: 0, lineas: 0 });
    m[nro].ing += _toFloat_(f.PrecioUnit); m[nro].costo += _toFloat_(f.CostoUnit); m[nro].lineas++;
  });
  var out = {};
  for (var nro in m) {
    var fe = _fechaComoDate_(prim[nro].FechaPago) || _fechaComoDate_(prim[nro].FechaPedido);
    if (!fe || fe < dIni || fe > dFin) continue;
    out[nro] = m[nro];
  }
  return out;
}

function _margenRangoDefecto_() {
  var hoy = new Date();
  var ini = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  return { desde: Utilities.formatDate(ini, 'America/Lima', 'yyyy-MM-dd'), hasta: Utilities.formatDate(hoy, 'America/Lima', 'yyyy-MM-dd') };
}

function margenBaseComparar(fechaInicio, fechaFin) {
  var rd = _margenRangoDefecto_();
  var desde = fechaInicio || rd.desde, hasta = fechaFin || rd.hasta;
  var R = { ok: false, cuando: new Date().toISOString(), desde: desde, hasta: hasta, interruptor: _margenBaseEncendido_() ? 'SI' : '' };
  var rh, rb, fh, fb;
  try {
    _MARGEN_FORZAR = 'hoja'; rh = margenCalcular(desde, hasta); fh = _MARGEN_ULTIMAS_FILAS;
    _MARGEN_FORZAR = 'base'; rb = margenCalcular(desde, hasta); fb = _MARGEN_ULTIMAS_FILAS;
    R.origenBase = _MARGEN_ORIGEN; R.costosBase = _MARGEN_COSTO_ORIGEN;
  } catch (e) {
    R.error = String((e && e.message) || e);
  } finally {
    _MARGEN_FORZAR = null;
  }
  if (!R.error) {
    var ph = _margenPedidosEnRango_(fh, desde, hasta), pb = _margenPedidosEnRango_(fb, desde, hasta);
    var soloHoja = [], soloBase = [], distintos = [];
    for (var n in ph) {
      if (!pb[n]) { soloHoja.push(n); continue; }
      if (Math.abs(ph[n].ing - pb[n].ing) > 0.01 || Math.abs(ph[n].costo - pb[n].costo) > 0.01)
        distintos.push(n + ' ing ' + ph[n].ing + '→' + pb[n].ing + ' costo ' + ph[n].costo + '→' + pb[n].costo);
    }
    for (var n2 in pb) if (!ph[n2]) soloBase.push(n2);
    var ingH = 0, ingB = 0;
    for (var a in ph) ingH += ph[a].ing;
    for (var b in pb) ingB += pb[b].ing;
    var mh = {}, difProd = [];
    (rh.productos || []).forEach(function (p) { mh[p.Producto] = p; });
    (rb.productos || []).forEach(function (p) {
      var q = mh[p.Producto]; delete mh[p.Producto];
      if (!q) { difProd.push(p.Producto + ': solo base (' + p.Ventas + ')'); return; }
      if (q.Ventas !== p.Ventas || Math.abs(q.IngresoTotal - p.IngresoTotal) > 0.01 || Math.abs(q.CostoTotal - p.CostoTotal) > 0.01)
        difProd.push(p.Producto + ': ventas ' + q.Ventas + '→' + p.Ventas + ' ingreso ' + q.IngresoTotal + '→' + p.IngresoTotal + ' costo ' + q.CostoTotal + '→' + p.CostoTotal);
    });
    for (var sp in mh) difProd.push(sp + ': solo planilla (' + mh[sp].Ventas + ')');
    var nH = Object.keys(ph).length, malos = soloHoja.length + soloBase.length + distintos.length;
    R.ok = true;
    R.pedidosHoja = nH; R.pedidosBase = Object.keys(pb).length;
    R.ingresoHoja = Math.round(ingH * 100) / 100; R.ingresoBase = Math.round(ingB * 100) / 100;
    R.nSoloHoja = soloHoja.length; R.nSoloBase = soloBase.length; R.nDistintos = distintos.length; R.nDifProductos = difProd.length;
    R.soloHoja = soloHoja.slice(0, 15); R.soloBase = soloBase.slice(0, 15); R.distintos = distintos.slice(0, 10); R.difProductos = difProd.slice(0, 10);
    R.limpio = R.origenBase === 'base' && nH > 0 && malos <= Math.max(1, Math.round(nH * 0.01)) &&
      Math.abs(ingH - ingB) <= Math.max(1, ingH * 0.01);
  } else {
    R.limpio = false;
  }
  try { setProp(MARGEN_BASE_INFORME, JSON.stringify(R).slice(0, 8500)); } catch (e2) {}
  return R;
}
function margenBaseUltimo() { try { return String(getProp(MARGEN_BASE_INFORME, '') || '') || 'Sin informe todavia.'; } catch (e) { return ''; } }
/** Enciende solo si el comparador da limpio. Reversa: margenBaseApagar. */
function margenBaseEncender(fechaInicio, fechaFin) {
  var c = margenBaseComparar(fechaInicio, fechaFin);
  if (!c.ok || !c.limpio) return { ok: false, encendido: false, comparador: c };
  setProp(MARGEN_BASE_PROP, 'SI');
  return { ok: true, encendido: true, comparador: c };
}
function margenBaseApagar() { setProp(MARGEN_BASE_PROP, ''); return { ok: true, encendido: false }; }

/** 19-set · REGLA NUEVA DEL CORTE (base manda, OK de Pablo "sí, enciende margen").
 *  El comparador no da limpio porque la PLANILLA esta atrasada: le faltan 16 pedidos pagados recientes que la base si tiene
 *  (+S/ 1.962) y de los 4 que solo tiene la planilla, 3 estan bien excluidos por la base (22008 pago anulado, 22043 eliminado,
 *  22187 canal TikTok). Se corre A MANO desde el editor (sin argumentos). Reversa: margenBaseApagar. */
function margenEncenderBaseManda_EJECUTAR() {
  setProp(MARGEN_BASE_PROP, 'SI');
  try { CacheService.getScriptCache().removeAll([]); } catch (e) {}
  try { auditLog('migracion.margenBaseManda', 'Margen', '', 'Margen lee de la base (regla del corte: base manda)', {}); } catch (e) {}
  Logger.log('Margen desde la base: ENCENDIDO. Reversa: margenBaseApagar');
  return { ok: true, encendido: true };
}

/** 19-set · EL ENVIO VIENE REPETIDO EN CADA FILA: Subtotal = Precio + Envio en TODAS las prendas del pedido.
 *  pagoDePedido suma los Subtotal → un pedido de 3 prendas con envio 10 "cuesta" 20 de mas y nunca queda COMPLETO.
 *  Medido en set-2026: 40 pedidos WhatsApp pagados quedaban fuera del margen (49 en vez de 88).
 *  Solo para el margen (no toca PagoCore): el envio cuenta UNA vez (en la primera prenda con envio). No muta las filas. */
function _margenSinEnvioRepetido_(objs) {
  // misma regla que PagoCore (PAGO_ENVIO_UNA_VEZ): una vez por LOTE (Lote o el dia de Fecha Pedido), y solo si el Subtotal trae el envio adentro
  var visto = {};
  return (objs || []).map(function (o) {
    var c = {}; for (var k in o) c[k] = o[k];
    var pren = String(c[C.PRENDA] || '').trim().toUpperCase();
    if (pren === '_PAGO_') return c;
    var env = parseFloat(c[C.ENVIO]) || 0, sub = parseFloat(c[C.SUBTOTAL]) || 0, pre = parseFloat(c[C.PRECIO]) || 0;
    if (env > 0 && sub >= pre + env - 0.01) {
      var lote = String(c.Lote || c.LOTE || '').trim() || String(c[C.FECHA_PEDIDO] || '').slice(0, 10);
      if (visto[lote]) c[C.SUBTOTAL] = Math.round((sub - env) * 100) / 100;
      visto[lote] = true;
    }
    return c;
  });
}


/*****************************************************************
 * 19-set · MARGEN_MISMA_LISTA — el margen cuenta LOS MISMOS pedidos que Embudo/Marketing
 *
 *   Vacio (como hasta hoy): pedidos WHATSAPP (cualquier origen) con pagoDePedido COMPLETO,
 *     al mes por la fecha del pago que lo completo.
 *   'SI': los pedidos son ventasAdsNros_(desde, hasta) (VentasAds.gs: erp.v_compras_ads con el
 *     filtro del Embudo; si no contesta, la regla de Resumen_ROAS "# WA Ads"), y cada uno cae
 *     en el dia de venta que da esa lista. Iguales por construccion.
 *   Si la lista no se puede leer, _margenFilasBase_ lanza y margenCalcular cae a la planilla.
 *
 * Comparador (solo lee; escribe UNA propiedad): margenMismaListaComparar(desde, hasta)
 * Encender: margenMismaListaEncender()  · Reversa: margenMismaListaApagar()
 *****************************************************************/
var MARGEN_LISTA_PROP    = 'MARGEN_MISMA_LISTA';
var MARGEN_LISTA_INFORME = 'MARGEN_LISTA_INFORME';
var _MARGEN_LISTA_FORZAR = null;   // 'vieja' | 'nueva' | null (solo el comparador)

function _margenMismaListaActiva_() {
  if (_MARGEN_LISTA_FORZAR === 'nueva') return true;
  if (_MARGEN_LISTA_FORZAR === 'vieja') return false;
  // 21-set · MARGEN_DESDE_VISTA_ADS MANDA SOBRE ESTE. Si esta encendido, la lista sale de
  // erp.v_compras_ads (66 pedidos el 01-20/09, contra 46 de la lista del bot) y vale la MISMA
  // regla de conteo: un pedido = una venta, y si ninguna prenda esta en Config_Productos la
  // venta va a OTROS (SIN PRODUCTO) en vez de perderse. Ver MargenVistaAds.gs.
  if (typeof _margenDesdeVistaAdsActiva_ === 'function' && _margenDesdeVistaAdsActiva_()) return true;
  try { return String(getProp(MARGEN_LISTA_PROP, '') || '').trim().toUpperCase() === 'SI'; } catch (e) { return false; }
}

/** ventasAdsNros_ → {fuente, n, fechaDe:{nro:'yyyy-MM-dd'}}. Lanza si no hay lista. */
function _margenListaCompartida_(fechaInicio, fechaFin) {
  if (typeof ventasAdsNros_ !== 'function') throw new Error('falta VentasAds.gs (ventasAdsNros_)');
  var L = ventasAdsNros_(fechaInicio, fechaFin);
  var fechaDe = {};
  (L.lista || []).forEach(function (x) { fechaDe[String(x.nro).trim()] = x.fecha; });
  return { fuente: L.fuente, n: Object.keys(fechaDe).length, fechaDe: fechaDe };
}

/** Pedidos de la lista que no vinieron en la ventana por fecha de pedido (pedidos muy viejos pagados ahora). */
function _margenListaFaltantes_(crudas, lista) {
  var hay = {};
  (crudas || []).forEach(function (x) { hay[String(x.nro_pedido == null ? '' : x.nro_pedido).trim()] = 1; });
  var faltan = Object.keys(lista.fechaDe).filter(function (n) { return !hay[n]; });
  var out = [];
  for (var i = 0; i < faltan.length; i += 100) {
    var trozo = faltan.slice(i, i + 100).map(function (n) { return encodeURIComponent(n); }).join(',');
    var a = _margenBaseGet_('pedidos?select=' + MARGEN_BASE_COLS + '&eliminado=is.null&nro_pedido=in.(' + trozo + ')&order=id.asc');
    for (var j = 0; j < a.length; j++) out.push(a[j]);
  }
  return out;
}

function margenMismaListaComparar(fechaInicio, fechaFin) {
  var hoy = new Date();
  var desde = fechaInicio || Utilities.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1), 'America/Lima', 'yyyy-MM-dd');
  var hasta = fechaFin || Utilities.formatDate(hoy, 'America/Lima', 'yyyy-MM-dd');
  var R = { ok: false, cuando: new Date().toISOString(), desde: desde, hasta: hasta,
            interruptor: _margenMismaListaActiva_() ? 'SI' : '' };
  var fv, fn, L;
  try {
    L = ventasAdsNros_(desde, hasta);
    R.panel = L.n; R.fuentePanel = L.fuente; R.filasPanel = L.filas;
    if (L.errorVista) R.errorVista = String(L.errorVista).slice(0, 200);
    try { var S = ventasAdsNros_(desde, hasta, { fuente: 'serie' }); R.serieWaAds = S.n; R.serieSumaDias = S.filas; } catch (eS) { R.serieError = String((eS && eS.message) || eS).slice(0, 200); }
    _MARGEN_LISTA_FORZAR = 'vieja'; fv = _margenFilasBase_(desde, hasta);
    _MARGEN_LISTA_FORZAR = 'nueva'; fn = _margenFilasBase_(desde, hasta);
  } catch (e) {
    R.error = String((e && e.message) || e);
  } finally {
    _MARGEN_LISTA_FORZAR = null;
  }
  if (!R.error) {
    var pv = _margenPedidosEnRango_(fv, desde, hasta), pn = _margenPedidosEnRango_(fn, desde, hasta);
    var soloViejo = [], soloNuevo = [];
    for (var a in pv) if (!pn[a]) soloViejo.push(a);
    for (var b in pn) if (!pv[b]) soloNuevo.push(b);
    var enLista = {}; (L.lista || []).forEach(function (x) { enLista[String(x.nro).trim()] = 1; });
    var faltanEnMargen = Object.keys(enLista).filter(function (n) { return !pn[n]; });
    R.ok = true;
    R.margenViejo = Object.keys(pv).length; R.margenNuevo = Object.keys(pn).length;
    R.nSoloViejo = soloViejo.length; R.nSoloNuevo = soloNuevo.length;
    R.soloViejo = soloViejo.sort().slice(0, 10); R.soloNuevo = soloNuevo.sort().slice(0, 10);
    R.listaSinLineas = faltanEnMargen.sort().slice(0, 10);   // en la lista pero sin prendas en la base
    R.nuevoIgualPanel = R.margenNuevo === R.panel && faltanEnMargen.length === 0;
  }
  try { setProp(MARGEN_LISTA_INFORME, JSON.stringify(R).slice(0, 8500)); } catch (e2) {}
  return R;
}
function margenMismaListaUltimo() { try { return String(getProp(MARGEN_LISTA_INFORME, '') || '') || 'Sin informe todavia.'; } catch (e) { return ''; } }
function margenMismaListaEncender() { setProp(MARGEN_LISTA_PROP, 'SI'); try { CacheService.getScriptCache().removeAll([]); } catch (e) {} return { ok: true, encendido: true }; }
function margenMismaListaApagar() { setProp(MARGEN_LISTA_PROP, ''); return { ok: true, encendido: false }; }


// ════════ MargenVistaAds.gs (entero, tal cual) ════════
/*****************************************************************
 * MargenVistaAds.gs - 21-set-2026 - EL MARGEN CUENTA LAS MISMAS VENTAS QUE VENTAS Y MARKETING
 *
 * ── EL HALLAZGO, MEDIDO CON DATOS REALES (periodo 2026-09-01 → 2026-09-20) ──
 *   · erp.v_compras_ads (la vista que miran Ventas y Marketing): 66 pedidos.
 *     Su filtro: canal WHATSAPP + origen ADS% + pago COMPLETO, por DIA DE PAGO.
 *     (Esa vista se arreglo el 21-set: leia pagos y prendas de copias congeladas
 *      del esquema erp; ahora lee de public.pagos y public.pedidos.)
 *   · la lista de atribucion del bot (public.bot_ventas_atribuidas, es_ads): 46 pedidos.
 *   · el Margen usa HOY la lista del bot (interruptor MARGEN_MISMA_LISTA=SI): por eso
 *     nunca cuadra con las otras dos pantallas.
 *
 *   La diferencia quedo explicada PEDIDO POR PEDIDO:
 *     · 5 estan en el bot y NO en la vista: estan A MEDIO PAGAR (22173 pago 22 de 119;
 *       22179 pago 20 de 229; 22188 pago 20 de 129; 22194 pago 30 de 299; 22338 pago 10
 *       de 129). La vista tiene razon en no contarlas: no son una venta cobrada.
 *     · ~25 estan en la vista y NO en el bot: son WHATSAPP + ADS DIRECTO, pago COMPLETO,
 *       ventas reales; el bot simplemente NO PUDO ATRIBUIRLAS a un anuncio.
 *
 * ── LA DECISION DE PABLO (aprobada el 21-set) ──────────────────────────────
 *   El numero correcto de ventas es el de la vista (66). La lista del bot sirve para
 *   decir QUE ANUNCIO vendio, no CUANTAS ventas hubo. Hoy el Margen la usa para las dos
 *   cosas, y de ahi salen tres pantallas con tres numeros.
 *
 * ── QUE CAMBIA (solo el CONJUNTO de pedidos que cuentan como venta) ────────
 *   Con MARGEN_DESDE_VISTA_ADS = SI, la lista de pedidos del Margen sale de
 *   erp.v_compras_ads: la MISMA que usan Ventas y Marketing. Asi las tres pantallas
 *   cuentan lo mismo POR CONSTRUCCION, no por coincidencia.
 *     · Las PRENDAS y sus PRECIOS siguen saliendo de public.pedidos, como hoy.
 *     · La FECHA de cada venta pasa a ser la que da la vista (dia_pago), para que el
 *       Margen y el Embudo fechen igual.
 *     · Un pedido de la vista SIN filas de prenda en public.pedidos NO se pierde en
 *       silencio: entra como una fila visible (cae en OTROS (SIN PRODUCTO), igual que
 *       hoy hace un pedido sin producto configurado) y mrg_10 lo lista por su numero.
 *     · LA ATRIBUCION POR ANUNCIO NO CAMBIA: la lista del bot se sigue usando para saber
 *       que anuncio/campana corresponde a cada venta. Este archivo no la toca.
 *
 * ── MANDA SOBRE MARGEN_MISMA_LISTA ────────────────────────────────────────
 *   Encendido, la lista es la de la vista AUNQUE MARGEN_MISMA_LISTA este en SI, y vale
 *   su misma regla de conteo (un pedido = una venta; si ninguna prenda esta en
 *   Config_Productos, la venta va a OTROS (SIN PRODUCTO) y se ve).
 *   Apagado, el Margen se comporta EXACTAMENTE como hoy.
 *
 * ── NACE APAGADO. Solo el texto SI enciende ────────────────────────────────
 *     mirar    : mrg_10_COMPARAR_FUENTES()   sin argumentos, mes en curso, SOLO LEE
 *     encender : mrg_11_ENCENDER()           sin argumentos, se niega sin mrg_10
 *     apagar   : margenDesdeVistaAdsApagar() reversa, en cualquier momento
 *   El sello de mrg_10 vive en CacheService (6 horas), no gasta una propiedad mas
 *   (el mismo truco de com_3_ENCENDER en ComisionCobrado.gs) y obliga a que los
 *   numeros que Pablo vio sean FRESCOS.
 *
 * ── COMO SE LEE LA VISTA DESDE APPS SCRIPT ────────────────────────────────
 *   erp.v_compras_ads SI se puede leer por PostgREST, pero SOLO con el encabezado
 *   Accept-Profile: erp (sin el, PostgREST la busca en public y contesta PGRST205).
 *   Es el mismo camino que ya usa MargenCuadre.gs (_mrgcEmbudoVista_). No se inventa
 *   ninguna ruta nueva.
 *
 * ── CUIDANDO LA CUOTA ─────────────────────────────────────────────────────
 *   UNA SOLA LECTURA POR FUENTE: la vista se lee una vez por rango (memoria de la
 *   ejecucion) y NUNCA dentro de un bucle por pedido. Ayer se agoto la cuota diaria
 *   de urlfetch de Apps Script: aca no se agrega ni una llamada de mas.
 *****************************************************************/

var MRGV_PROP       = 'MARGEN_DESDE_VISTA_ADS';   // la unica propiedad nueva. Solo 'SI' enciende.
var MRGV_VISTA      = 'v_compras_ads';            // erp.v_compras_ads
var MRGV_FUENTE     = 'erp.v_compras_ads';
var MRGV_PERFIL     = { 'Accept-Profile': 'erp' };// SIN esto PostgREST contesta PGRST205
var MRGV_PAGINA     = 1000;
var MRGV_VUELTAS    = 20;                         // freno, no meta
var MRGV_SELLO      = 'MRGV_SELLO_MRG10';         // sello del comparador (memoria, 6 h)
var MRGV_SELLO_S    = 21600;                      // 6 horas, el maximo de CacheService
var MRGV_PRENDA_SIN = 'SIN PRENDA EN PEDIDOS';    // la fila visible del pedido sin prendas
var MRGV_TOPE_MS    = 4 * 60 * 1000;              // tope de reloj (Apps Script mata a los 6)

var _MRGV_FORZAR    = null;   // 'vista' | 'como-esta' | null  (SOLO mrg_10 lo usa)
var _MRGV_MEMO      = {};     // 'desde|hasta' -> lista (una sola lectura por ejecucion)
var _MRGV_HUERFANOS = [];     // pedidos de la vista sin prendas en public.pedidos (ultima corrida)

function _mrgvLog_(m) { try { Logger.log('[MargenVistaAds] ' + m); } catch (e) {} }
function _mrgvHoy_()  { return Utilities.formatDate(new Date(), 'America/Lima', 'yyyy-MM-dd'); }
function _mrgvMes1_() { return _mrgvHoy_().slice(0, 8) + '01'; }
function _mrgvS_(n)   { return 'S/ ' + (Math.round((Number(n) || 0) * 100) / 100); }
function _mrgvR_(s, n) { s = String(s == null ? '' : s); while (s.length < n) s += ' '; return s.slice(0, n); }
function _mrgvL_(s, n) { s = String(s == null ? '' : s); while (s.length < n) s = ' ' + s; return s.slice(-n); }

/** EL INTERRUPTOR. Propiedad pura: solo 'SI' enciende. Ante cualquier duda, apagado. */
function _margenDesdeVistaAdsActiva_() {
  if (_MRGV_FORZAR === 'vista') return true;
  if (_MRGV_FORZAR === 'como-esta') return false;
  try { return String(getProp(MRGV_PROP, '') || '').trim().toUpperCase() === 'SI'; } catch (e) { return false; }
}

/** LA REVERSA. En cualquier momento, sin publicar nada. */
function margenDesdeVistaAdsApagar() {
  setProp(MRGV_PROP, '');
  try { CacheService.getScriptCache().removeAll([MRGV_SELLO]); } catch (e) {}
  _mrgvLog_('MARGEN_DESDE_VISTA_ADS = (vacio): el Margen vuelve a comportarse como antes.');
  return { ok: true, encendido: false };
}

/** LA LISTA DE LA VISTA, con la MISMA forma que _margenListaCompartida_
 *  ({fuente, n, fechaDe:{nro:'yyyy-MM-dd'}}) mas los soles que la vista ya trae.
 *  Una sola lectura por rango. Lanza si la vista no contesta (quien llama decide). */
function _margenVistaAdsLista_(fechaInicio, fechaFin) {
  var desde = String(fechaInicio == null ? '' : fechaInicio).slice(0, 10);
  var hasta = String(fechaFin == null ? '' : fechaFin).slice(0, 10);
  var clave = desde + '|' + hasta;
  if (_MRGV_MEMO[clave]) return _MRGV_MEMO[clave];
  var fechaDe = {}, montos = {}, n = 0, filas = 0;
  for (var v = 0; v < MRGV_VUELTAS; v++) {
    // select=* como MargenCuadre.gs: la definicion de la vista vive solo en Supabase
    // y no conviene nombrar columnas que manana podrian no estar.
    var ruta = MRGV_VISTA + '?select=*&dia_pago=gte.' + encodeURIComponent(desde) +
               '&dia_pago=lte.' + encodeURIComponent(hasta) +
               '&order=dia_pago.asc&limit=' + MRGV_PAGINA + '&offset=' + (v * MRGV_PAGINA);
    var r = _sbFetch_('GET', ruta, null, MRGV_PERFIL);
    if (!r || r.code >= 300) throw new Error(MRGV_FUENTE + ' HTTP ' + (r && r.code) + ' ' + String((r && r.body) || '').slice(0, 140));
    var a = null;
    try { a = JSON.parse(r.body || '[]'); } catch (e) { throw new Error(MRGV_FUENTE + ': respuesta ilegible'); }
    if (!a || !a.length) break;
    for (var i = 0; i < a.length; i++) {
      var x = a[i];
      // el MISMO filtro que n8n y el Embudo: PAGINA WEB no es venta de WhatsApp.
      if (String(x.canal || '').trim().toUpperCase() === 'PAGINA WEB') continue;
      var nro = String(x.numero != null ? x.numero : (x.nro_pedido != null ? x.nro_pedido : (x.nro != null ? x.nro : ''))).trim();
      if (!nro) continue;
      filas++;
      var f = String(x.dia_pago != null ? x.dia_pago : (x.fecha_pago != null ? x.fecha_pago : '')).slice(0, 10);
      if (!fechaDe[nro]) { fechaDe[nro] = f; n++; }
      else if (f && (!fechaDe[nro] || f < fechaDe[nro])) fechaDe[nro] = f;
      montos[nro] = (montos[nro] || 0) + (Number(x.venta_prendas != null ? x.venta_prendas : (x.venta || 0)) || 0);
    }
    if (a.length < MRGV_PAGINA) break;
    if (v === MRGV_VUELTAS - 1) throw new Error(MRGV_FUENTE + ': tope de vueltas (la lista vendria cortada)');
  }
  var out = { fuente: MRGV_FUENTE, n: n, fechaDe: fechaDe, montos: montos, filas: filas };
  _MRGV_MEMO[clave] = out;
  _mrgvLog_('la vista devolvio ' + n + ' pedidos (' + desde + ' → ' + hasta + ')');
  return out;
}

/** QUE LISTA MANDA EN EL MARGEN. La vista si el interruptor nuevo esta encendido;
 *  si no, lo de siempre (la lista del bot con MARGEN_MISMA_LISTA, o ninguna). */
function _margenListaParaElMargen_(fechaInicio, fechaFin) {
  if (_MARGEN_LISTA_FORZAR !== 'vieja' && _margenDesdeVistaAdsActiva_())
    return _margenVistaAdsLista_(fechaInicio, fechaFin);
  return _margenMismaListaActiva_() ? _margenListaCompartida_(fechaInicio, fechaFin) : null;
}

/** UN PEDIDO DE LA VISTA SIN FILAS DE PRENDA NO SE PIERDE EN SILENCIO.
 *  Entra con una prenda de nombre MRGV_PRENDA_SIN (no empieza con CAMBIO, asi que
 *  margenCalcular no la descarta) y sus soles son los que la vista ya cobro.
 *  Como MARGEN_DESDE_VISTA_ADS manda sobre MARGEN_MISMA_LISTA, margenCalcular la
 *  manda a la fila OTROS (SIN PRODUCTO): se VE. mrg_10 la lista por su numero. */
function _margenVistaHuerfanos_(out, lista) {
  var hay = {};
  (out || []).forEach(function (f) {
    // 21-set · POR QUE SE MIRA LA PRENDA Y NO SOLO EL NUMERO: margenCalcular
    // (MargenEngine.js ~255) tira a la basura toda linea cuya prenda empieza con CAMBIO.
    // Un pedido cuyas UNICAS lineas son de cambio tenia filas aca, parecia "presente",
    // no recibia su fila de OTROS (SIN PRODUCTO)... y despues se quedaba sin ninguna
    // linea y desaparecia de la cuenta. Ese era el pedido que faltaba (66 en la vista,
    // 65 en la pantalla). Para el Margen, un pedido solo-CAMBIO es un pedido SIN prendas.
    if (_mrgvEsNoPrenda_(f.Prenda)) return;
    hay[String(f.NroPedido).trim()] = 1;
  });
  var faltan = Object.keys(lista.fechaDe || {}).filter(function (n) { return !hay[n]; }).sort();
  _MRGV_HUERFANOS = faltan.slice(0, 200);
  faltan.forEach(function (nro) {
    var monto = Number((lista.montos || {})[nro]) || 0;
    out.push({ NroPedido: nro, FechaPedido: '', FechaPago: _margenBaseFecha_(lista.fechaDe[nro] || ''),
      Periodo: '', Prenda: MRGV_PRENDA_SIN, PrecioUnit: monto, Envio: 0, Subtotal: monto,
      CostoUnit: 0, CostoPaq: 0, Canal: 'WHATSAPP', Origen: 'ADS', FormaPago: '' });
  });
  if (faltan.length) _mrgvLog_(faltan.length + ' pedido(s) de la vista sin prendas en public.pedidos: ' + faltan.slice(0, 20).join(', '));
  _mrgvGuardiaCuadre_(out, lista);
  return out;
}

/** 21-set · UNA LINEA QUE NO ES UNA PRENDA. Las dos que el Margen descarta:
 *  las de CAMBIO (margenCalcular las tira) y las `_PAGO_` (no son filas de pedido).
 *  Un pedido hecho solo de estas es, para el Margen, un pedido sin prendas. */
function _mrgvEsNoPrenda_(prenda) {
  var p = String(prenda == null ? '' : prenda).trim().toUpperCase();
  return !p || p.indexOf('CAMBIO') === 0 || p.indexOf('_PAGO_') === 0;
}

/** 21-set · EL GUARDIA PERMANENTE. Con el interruptor encendido, el Margen tiene que contar
 *  EXACTAMENTE los pedidos que trae la vista. Si alguno se queda afuera no se pierde en
 *  silencio: queda escrito cuantos faltaron y sus numeros. Es un aviso, no un freno: la
 *  pantalla igual se dibuja (mejor un numero con aviso que una pantalla en blanco). */
function _mrgvGuardiaCuadre_(out, lista) {
  try {
    var cuenta = {}, nC = 0;
    (out || []).forEach(function (f) {
      if (_mrgvEsNoPrenda_(f.Prenda)) return;
      var n = String(f.NroPedido).trim();
      if (n && !cuenta[n]) { cuenta[n] = 1; nC++; }
    });
    var todos = Object.keys((lista && lista.fechaDe) || {});
    var sin = todos.filter(function (n) { return !cuenta[n]; }).sort();
    if (!sin.length) return true;
    var m = 'CUADRE ROTO: la vista trae ' + todos.length + ' pedidos y el Margen cuenta ' + nC +
            '. Faltan ' + sin.length + ': ' + sin.slice(0, 40).join(', ');
    _mrgvLog_(m);
    try { _silog_('margen.vistaAds.cuadre', new Error(m)); } catch (e) {}
    return false;
  } catch (e) { return true; }
}

/*══════════════════════════════════════════════════════════════════════════
  mrg_10_COMPARAR_FUENTES() - LO QUE PABLO MIRA ANTES DE ENCENDER
  Sin argumentos (el editor de Apps Script solo lista esas). SOLO LEE: no enciende
  nada, no cambia ningun calculo, no escribe ninguna propiedad (el sello va a la
  memoria del script, 6 horas). Mes en curso. Devuelve el texto como string.
══════════════════════════════════════════════════════════════════════════*/
function mrg_10_COMPARAR_FUENTES() {
  var t0 = Date.now();
  var desde = _mrgvMes1_(), hasta = _mrgvHoy_();
  var L = [];
  var P = function (s) { L.push(s); };
  P('══════ MARGEN · DE DONDE SALEN LAS VENTAS (' + desde + ' → ' + hasta + ') ══════');
  P('SOLO LEE. No enciende nada y no cambia ningun numero de las pantallas.');
  P('');

  // ── FUENTE 1: la vista que usan Ventas y Marketing (una sola lectura) ──
  var V = null, eV = '';
  try { V = _margenVistaAdsLista_(desde, hasta); } catch (e) { eV = String((e && e.message) || e); }
  // ── FUENTE 2: la lista de atribucion del bot (la que usa el Margen hoy) ──
  var B = null, eB = '';
  try { B = ventasAdsNros_(desde, hasta); } catch (e) { eB = String((e && e.message) || e); }

  // ── FUENTE 3: el Margen, como esta configurado AHORA ──
  var hoyN = 0, hoySoles = 0, eH = '', hoyPed = {};
  try {
    _MRGV_FORZAR = 'como-esta';
    var fh = _margenFilasVentas_(desde, hasta);
    hoyPed = _margenPedidosEnRango_(fh, desde, hasta);
    for (var a in hoyPed) { hoyN++; hoySoles += hoyPed[a].ing; }
  } catch (e) { eH = String((e && e.message) || e); } finally { _MRGV_FORZAR = null; }

  // ── FUENTE 4: el Margen CON EL INTERRUPTOR ENCENDIDO ──
  var nueN = 0, nueSoles = 0, eN = '', nuePed = {}, huerfanos = [];
  try {
    _MRGV_FORZAR = 'vista'; _MRGV_HUERFANOS = [];
    var fn = _margenFilasBase_(desde, hasta);
    nuePed = _margenPedidosEnRango_(fn, desde, hasta);
    for (var b in nuePed) { nueN++; nueSoles += nuePed[b].ing; }
    huerfanos = (_MRGV_HUERFANOS || []).slice(0);
  } catch (e) { eN = String((e && e.message) || e); } finally { _MRGV_FORZAR = null; }

  var vistaSoles = 0;
  if (V) for (var k in V.montos) vistaSoles += Number(V.montos[k]) || 0;

  // ── LA TABLA ──
  P('  ' + _mrgvR_('FUENTE', 46) + _mrgvL_('PEDIDOS', 9) + _mrgvL_('SOLES', 14));
  P('  ' + _mrgvR_('', 69).replace(/ /g, '─'));
  P('  ' + _mrgvR_('erp.v_compras_ads  (Ventas y Marketing)', 46) +
      _mrgvL_(V ? V.n : '?', 9) + _mrgvL_(V ? _mrgvS_(vistaSoles) : '-', 14));
  P('  ' + _mrgvR_('lista del bot  (bot_ventas_atribuidas)', 46) +
      _mrgvL_(B ? B.n : '?', 9) + _mrgvL_('-', 14));
  P('  ' + _mrgvR_('el MARGEN, como esta configurado hoy', 46) +
      _mrgvL_(eH ? '?' : hoyN, 9) + _mrgvL_(eH ? '-' : _mrgvS_(hoySoles), 14));
  P('  ' + _mrgvR_('el MARGEN con el interruptor ENCENDIDO', 46) +
      _mrgvL_(eN ? '?' : nueN, 9) + _mrgvL_(eN ? '-' : _mrgvS_(nueSoles), 14));
  P('');
  if (eV) P('  🛑 la vista no contesto: ' + eV);
  if (eB) P('  🛑 la lista del bot no contesto: ' + eB);
  if (eH) P('  🛑 el margen de hoy no se pudo calcular: ' + eH);
  if (eN) P('  🛑 el margen con el interruptor no se pudo calcular: ' + eN);
  P('  interruptores: MARGEN_DESDE_VISTA_ADS = ' + (_margenDesdeVistaAdsActiva_() ? 'SI' : '(vacio)') +
    '  ·  MARGEN_MISMA_LISTA = ' + ((function () { try { return String(getProp('MARGEN_MISMA_LISTA', '') || '') || '(vacio)'; } catch (e) { return '?'; } })()));
  P('');

  // ── LOS QUE ESTAN EN UNA Y NO EN LA OTRA, CON EL MOTIVO ──
  if (V && B) {
    var enV = V.fechaDe || {}, enB = {};
    (B.lista || []).forEach(function (x) { enB[String(x.nro).trim()] = x.fecha; });
    var soloBot = Object.keys(enB).filter(function (n) { return !enV[n]; }).sort();
    var soloVis = Object.keys(enV).filter(function (n) { return !enB[n]; }).sort();
    P('── EN EL BOT Y NO EN LA VISTA: ' + soloBot.length + ' ──');
    P('   motivo: la vista exige PAGO COMPLETO. Medido el 21-set, estos estaban A MEDIO PAGAR');
    P('   (22173 pago 22 de 119 · 22179 pago 20 de 229 · 22188 pago 20 de 129 ·');
    P('    22194 pago 30 de 299 · 22338 pago 10 de 129). La vista tiene razon en no contarlos.');
    P('   ' + (soloBot.length ? soloBot.slice(0, 60).join(', ') : 'ninguno'));
    P('');
    P('── EN LA VISTA Y NO EN EL BOT: ' + soloVis.length + ' ──');
    P('   motivo: son WhatsApp + Ads con pago COMPLETO, ventas reales; el bot no pudo');
    P('   atribuirlas a un anuncio. Son ventas: tienen que contar.');
    P('   ' + (soloVis.length ? soloVis.slice(0, 60).join(', ') : 'ninguno'));
    P('');
  }
  // ── LOS QUE LA VISTA TRAE Y public.pedidos NO TIENE CON PRENDAS ──
  P('── DE LA VISTA, SIN NINGUNA PRENDA EN public.pedidos: ' + huerfanos.length + ' ──');
  P('   no desaparecen: entran con la prenda «' + MRGV_PRENDA_SIN + '» y se ven en la');
  P('   fila OTROS (SIN PRODUCTO) del Margen.');
  P('   ' + (huerfanos.length ? huerfanos.slice(0, 60).join(', ') : 'ninguno'));
  P('');
  // ── LOS QUE HOY CUENTA EL MARGEN Y CON EL INTERRUPTOR YA NO (y al reves) ──
  var pierde = [], gana = [];
  for (var h in hoyPed) if (!nuePed[h]) pierde.push(h);
  for (var g in nuePed) if (!hoyPed[g]) gana.push(g);
  P('── QUE CAMBIA EN EL MARGEN SI SE ENCIENDE ──');
  P('   deja de contar (' + pierde.length + '): ' + (pierde.length ? pierde.sort().slice(0, 60).join(', ') : 'ninguno'));
  P('   empieza a contar (' + gana.length + '): ' + (gana.length ? gana.sort().slice(0, 60).join(', ') : 'ninguno'));
  P('');
  P('══════ EL NUMERO QUE QUEDARIA ══════');
  P('  con el interruptor ENCENDIDO el Margen contaria ' + (eN ? '?' : nueN) + ' ventas' +
    (eN ? '' : '  (' + _mrgvS_(nueSoles) + ')') + ', las mismas que la vista' +
    (V ? ' (' + V.n + ')' : '') + '.');
  P('  hoy cuenta ' + (eH ? '?' : hoyN) + '.');
  P('  Si el numero te cuadra: mrg_11_ENCENDER()   ·   reversa: margenDesdeVistaAdsApagar()');
  if ((Date.now() - t0) > MRGV_TOPE_MS) P('  ⚠️  tardo mas de 4 minutos: corre de nuevo si algo quedo cortado.');
  P('══════ FIN ══════');

  var sello = { cuando: new Date().toISOString(), desde: desde, hasta: hasta,
                vista: V ? V.n : -1, bot: B ? B.n : -1, hoy: eH ? -1 : hoyN, conVista: eN ? -1 : nueN,
                huerfanos: huerfanos.length, ok: !!(V && !eN) };
  try { CacheService.getScriptCache().put(MRGV_SELLO, JSON.stringify(sello), MRGV_SELLO_S); } catch (e) {}
  var s = L.join('\n');
  Logger.log(s);
  return s;
}

function _mrgvSelloLeer_() {
  var s = '';
  try { s = CacheService.getScriptCache().get(MRGV_SELLO) || ''; } catch (e) {}
  if (!s) return null;
  try { return JSON.parse(s); } catch (e) { return null; }
}

/*══════════════════════════════════════════════════════════════════════════
  mrg_11_ENCENDER() - sin argumentos. Se NIEGA si mrg_10 no se corrio antes.
  El sello vive en CacheService (6 h): no gasta una propiedad mas (Apps Script ya
  tiene el cupo lleno) y obliga a que los numeros vistos sean frescos.
══════════════════════════════════════════════════════════════════════════*/
function mrg_11_ENCENDER() {
  var L = ['══════ MARGEN DESDE erp.v_compras_ads · ENCENDER ══════'];
  var sello = _mrgvSelloLeer_();
  if (!sello || !sello.cuando) {
    L.push('🛑 NO se enciende: primero hay que correr mrg_10_COMPARAR_FUENTES().');
    L.push('   Cambia el numero de ventas de una pantalla: no se enciende sin haber visto');
    L.push('   la tabla. El sello dura 6 horas; si paso mas, correlo otra vez.');
    var s0 = L.join('\n'); Logger.log(s0);
    return { ok: false, motivo: 'sin comparador', texto: s0 };
  }
  if (sello.ok === false || sello.vista < 0 || sello.conVista < 0) {
    L.push('🛑 NO se enciende: el ultimo mrg_10_COMPARAR_FUENTES() no pudo leer todo.');
    L.push('   Correlo otra vez y mira si la vista contesto.');
    var s1 = L.join('\n'); Logger.log(s1);
    return { ok: false, motivo: 'comparador incompleto', texto: s1 };
  }
  L.push('comparador corrido el ' + sello.cuando + ' (' + sello.desde + ' → ' + sello.hasta + ')');
  L.push('vista ' + sello.vista + ' · bot ' + sello.bot + ' · margen hoy ' + sello.hoy + ' · margen encendido ' + sello.conVista);
  if (sello.huerfanos) L.push('⚠️  ' + sello.huerfanos + ' pedido(s) de la vista sin prendas: se ven en OTROS (SIN PRODUCTO).');
  setProp(MRGV_PROP, 'SI');
  try {
    auditLog('margen.desdeVistaAds.encender', 'Margen', '',
             'el Margen toma su lista de pedidos de erp.v_compras_ads (la misma que Ventas y Marketing)',
             { cuando: sello.cuando, vista: sello.vista, antes: sello.hoy, ahora: sello.conVista });
  } catch (e) {}
  L.push('✅ MARGEN_DESDE_VISTA_ADS = SI. Reversa en cualquier momento: margenDesdeVistaAdsApagar()');
  var s = L.join('\n');
  Logger.log(s);
  return { ok: true, encendido: true, ventas: sello.conVista, texto: s };
}

/*══════════════════════════════════════════════════════════════════════════
  mrg_12_QUIEN_FALTA() - LA PRUEBA DE QUE LA CUENTA QUEDO EXACTA
  Sin argumentos (el editor de Apps Script solo lista esas). SOLO LEE: no enciende nada,
  no escribe ninguna propiedad, no cambia ningun numero. Mes en curso.
  Compara la lista de erp.v_compras_ads contra los pedidos que el Margen DE VERDAD cuenta
  y lista por numero los que falten, con el motivo exacto de cada uno.
  Despues del arreglo del 21-set tiene que decir «faltan: 0».
  CUOTA: una sola lectura de la vista (memoria de la ejecucion) + la lectura normal de
  public.pedidos. Solo si falta alguien pide UNA consulta mas, acotada a esos numeros.
══════════════════════════════════════════════════════════════════════════*/
function mrg_12_QUIEN_FALTA() {
  var t0 = Date.now();
  var desde = _mrgvMes1_(), hasta = _mrgvHoy_();
  var L = [], P = function (s) { L.push(s); };
  P('══════ MARGEN · QUIEN FALTA (' + desde + ' → ' + hasta + ') ══════');
  P('SOLO LEE. La lista de la vista contra los pedidos que el Margen cuenta de verdad.');
  P('');

  // ── la lista de la vista (una sola lectura) ──
  var V = null, eV = '';
  try { V = _margenVistaAdsLista_(desde, hasta); } catch (e) { eV = String((e && e.message) || e); }

  // ── los pedidos que el Margen cuenta de verdad (con la lista de la vista mandando) ──
  var enMargen = {}, eM = '';
  try {
    _MRGV_FORZAR = 'vista';
    enMargen = _margenPedidosEnRango_(_margenFilasBase_(desde, hasta), desde, hasta);
  } catch (e) { eM = String((e && e.message) || e); } finally { _MRGV_FORZAR = null; }

  var nV = V ? Object.keys(V.fechaDe || {}).length : 0;
  var nM = Object.keys(enMargen).length;
  var faltan = V ? Object.keys(V.fechaDe || {}).filter(function (n) { return !enMargen[n]; }).sort() : [];

  if (eV) P('  🛑 la vista no contesto: ' + eV);
  if (eM) P('  🛑 el margen no se pudo calcular: ' + eM);

  // ── EL MOTIVO DE CADA UNO. Una sola consulta, acotada a los que faltan. ──
  if (faltan.length) {
    var crudas = [];
    try {
      var trozo = faltan.slice(0, 300).map(function (n) { return encodeURIComponent(n); }).join(',');
      crudas = _margenBaseGet_('pedidos?select=nro_pedido,prenda,fecha_pedido,eliminado&nro_pedido=in.(' + trozo + ')&order=id.asc');
    } catch (e) { P('  ⚠️  no se pudo leer public.pedidos de los que faltan: ' + String((e && e.message) || e)); }
    // la misma ventana de lectura de _margenFilasBase_: si la fecha de pedido cae afuera,
    // ese pedido solo entra por el rescate por numero; si tampoco entro, se dice aca.
    var dIni = _fechaRangoDesdeString_(desde), dFin = _fechaRangoDesdeString_(hasta);
    var vIni = new Date(dIni.getTime() - MARGEN_BASE_COLCHON * 86400000);
    var vFin = new Date(dFin.getTime() + 2 * 86400000);
    var porNro = {};
    crudas.forEach(function (x) {
      var k = String(x.nro_pedido == null ? '' : x.nro_pedido).trim();
      if (!k) return;
      if (!porNro[k]) porNro[k] = [];
      porNro[k].push(x);
    });
    P('── LOS QUE FALTAN, CON SU MOTIVO: ' + faltan.length + ' ──');
    faltan.forEach(function (nro) {
      var rs = porNro[nro] || [], prendas = 0, cambios = 0, pagos = 0, fmin = '';
      rs.forEach(function (x) {
        var p = String(x.prenda == null ? '' : x.prenda).trim().toUpperCase();
        if (!p) { /* fila vacia: tampoco es prenda */ }
        else if (p.indexOf('CAMBIO') === 0) cambios++;
        else if (p.indexOf('_PAGO_') === 0) pagos++;
        else prendas++;
        var f = String(x.fecha_pedido || '').slice(0, 10);
        if (f && (!fmin || f < fmin)) fmin = f;
      });
      var fd = fmin ? new Date(fmin + 'T05:00:00.000Z') : null;
      var fuera = !!(fd && (fd < vIni || fd >= vFin));
      var motivo;
      if (!rs.length) motivo = 'no tiene filas en public.pedidos';
      else if (!prendas && cambios && !pagos) motivo = 'todas sus lineas son CAMBIO';
      else if (!prendas && pagos && !cambios) motivo = 'solo tiene _PAGO_';
      else if (!prendas) motivo = 'ninguna de sus lineas es una prenda (CAMBIO y/o _PAGO_)';
      else if (fuera) motivo = 'su fecha de pedido quedo fuera de la lectura: ' + fmin;
      else motivo = 'tiene prendas y esta dentro de la lectura: hay que mirarlo a mano';
      P('   ' + _mrgvR_(nro, 10) + motivo);
    });
    P('');
  } else {
    P('── LOS QUE FALTAN: ninguno. Cada pedido de la vista cuenta como una venta. ──');
    P('');
  }

  P('vista: ' + nV + ' · margen: ' + nM + ' · faltan: ' + faltan.length);
  if ((Date.now() - t0) > MRGV_TOPE_MS) P('⚠️  tardo mas de 4 minutos: corre de nuevo si algo quedo cortado.');
  P('══════ FIN ══════');
  var s = L.join('\n');
  Logger.log(s);
  return s;
}


// ════════ MargenSoloPedidos.gs (entero, tal cual) ════════
// ══════════════════════════════════════════════════════════════════════════
// 21-set-2026 · MARGEN_SOLO_LOS_PEDIDOS
// Que el Margen pida SOLO los pedidos que va a usar, no 120 dias de historia.
//
// ── LO QUE SE MIDIO ─────────────────────────────────────────────────────────
// Cronometro del 21-set (mrg_13_CUANTO_TARDA, MargenReloj.gs), mes hasta hoy:
//     1. _configGeneral_() ......  214 ms
//     2. _configProductos_() ....  235 ms
//     3. _margenFilasVentas_() .. 6029 ms   ← aca esta TODO el tiempo
//     TOTAL margenCalcular() .... 5109 ms
// Y el registro de MargenBase decia la causa en una linea:
//     "8566 filas de pedidos → 117 prendas de la lista compartida"
// Trae 8.566 filas para quedarse con 117. El 98.6% del viaje se tira.
//
// ── POR QUE PASABA ──────────────────────────────────────────────────────────
// _margenFilasBase_ pide public.pedidos por VENTANA DE FECHA, con un colchon
// de 120 dias hacia atras (MARGEN_BASE_COLCHON). Ese colchon existe por una
// razon buena: un pedido viejo puede pagarse dentro del rango, y si se pide
// solo por fecha_pedido del mes, ese pedido no aparece.
// Pero desde el 19-set el Margen YA NO decide por su cuenta que pedidos van:
// recibe LA LISTA, la misma que leen Ventas y Marketing (erp.v_compras_ads).
// O sea: sabe de antemano los 66 numeros exactos que necesita. El colchon de
// 120 dias pasa a ser un rodeo: se trae media historia para despues tirarla.
//
// ── LO QUE HACE ESTE INTERRUPTOR ───────────────────────────────────────────
// Cuando hay lista, se saltea la ventana por fecha y se piden EXACTAMENTE los
// pedidos de la lista, por numero, en tandas de 100. De ~8.566 filas a ~150.
// No se inventa nada nuevo: reusa _margenListaFaltantes_(crudas, lista), que
// es la funcion que ya traia por numero los pedidos viejos que la ventana no
// alcanzaba. Se la llama con crudas = [] y trae la lista entera.
//
// ── POR QUE NO CAMBIA NINGUN NUMERO ────────────────────────────────────────
// Hoy, con lista, la linea 172 de MargenBase.gs descarta todo pedido que no
// este en ella:  if (lista) { if (!lista.fechaDe[nro]) return; }
// O sea que las 8.449 filas de mas YA se estaban tirando. Pedir solo la lista
// llega al mismo conjunto por el camino corto. mrg_14_COMPARAR lo comprueba
// corriendo las dos formas y enfrentando producto por producto.
//
// SIN LISTA (MARGEN_DESDE_VISTA_ADS y MARGEN_MISMA_LISTA apagados) no cambia
// NADA: sin lista no hay numeros que pedir y la ventana por fecha es la unica
// forma. El interruptor se ignora solo.
//
// ── INTERRUPTOR ────────────────────────────────────────────────────────────
// Propiedad pura MARGEN_SOLO_LOS_PEDIDOS. APAGADO por defecto: solo 'SI'
// enciende. Reversa en cualquier momento y sin publicar:
//     margenSoloLosPedidosApagar()
//
// ── FUNCIONES (todas sin argumentos, salen en la lista del editor) ─────────
//   mrg_14_COMPARAR_SOLO_PEDIDOS()  mide y compara las dos formas. NO cambia nada.
//   margenSoloLosPedidosEncender()  enciende (pide haber corrido mrg_14 antes).
//   margenSoloLosPedidosApagar()    la reversa.
// ══════════════════════════════════════════════════════════════════════════

var MSP_PROP    = 'MARGEN_SOLO_LOS_PEDIDOS';
var MSP_SELLO   = 'MSP_SELLO_MRG14';
var MSP_SELLO_S = 21600;                 // 6 h, el maximo de CacheService

var _MSP_FORZAR = null;                  // 'lista' | 'ventana' | null (solo mrg_14 lo usa)

function _mspLog_(m) { try { Logger.log('[MargenSoloPedidos] ' + m); } catch (e) {} }

/** EL INTERRUPTOR. Propiedad pura: solo 'SI' enciende. Ante cualquier duda, apagado. */
function _margenSoloLosPedidos_() {
  if (_MSP_FORZAR === 'lista')  return true;
  if (_MSP_FORZAR === 'ventana') return false;
  try { return String(getProp(MSP_PROP, '') || '').trim().toUpperCase() === 'SI'; } catch (e) { return false; }
}

/** LA REVERSA. */
function margenSoloLosPedidosApagar() {
  setProp(MSP_PROP, '');
  try { CacheService.getScriptCache().removeAll([MSP_SELLO]); } catch (e) {}
  _mspLog_('MARGEN_SOLO_LOS_PEDIDOS = (vacio): vuelve la ventana de 120 dias.');
  return { ok: true, encendido: false };
}

/** Resumen comparable de un resultado de margenCalcular: producto → cifras. */
function _mspHuella_(res) {
  var h = {}, lista = (res && (res.productos || res.filas)) || [];
  lista.forEach(function (p) {
    var k = String((p && (p.producto || p.Producto || p.nombre)) || '').trim().toUpperCase();
    if (!k) return;
    h[k] = [Math.round((Number(p.unidades || p.Unidades || 0)) * 100) / 100,
            Math.round((Number(p.ingreso  || p.Ingreso  || 0)) * 100) / 100,
            Math.round((Number(p.margen   || p.Margen   || 0)) * 100) / 100].join('|');
  });
  return h;
}

// ══════════════════════════════════════════════════════════════════════════
// mrg_14 · LAS DOS FORMAS, ENFRENTADAS. No enciende ni cambia nada.
// ══════════════════════════════════════════════════════════════════════════
function mrg_14_COMPARAR_SOLO_PEDIDOS() {
  var L = [];
  var hoy = new Date();
  var desde = Utilities.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1), 'America/Lima', 'yyyy-MM-dd');
  var hasta = Utilities.formatDate(hoy, 'America/Lima', 'yyyy-MM-dd');

  L.push('══ MARGEN: VENTANA DE 120 DIAS  vs  SOLO LOS PEDIDOS DE LA LISTA ══');
  L.push('   ' + desde + ' → ' + hasta);
  L.push('');

  var corre = function (modo) {
    _MSP_FORZAR = modo;
    var t = Date.now(), r = null, e = '';
    try { r = margenCalcular(desde, hasta); } catch (ex) { e = String((ex && ex.message) || ex); }
    _MSP_FORZAR = null;
    return { ms: Date.now() - t, res: r, err: e, filas: (typeof _MARGEN_ULTIMAS_FILAS !== 'undefined' && _MARGEN_ULTIMAS_FILAS) ? _MARGEN_ULTIMAS_FILAS.length : -1 };
  };

  var A = corre('ventana');
  L.push('COMO ESTA HOY (ventana de 120 dias) ... ' + A.ms + ' ms' + (A.err ? '   ⚠️ ' + A.err : ''));
  var B = corre('lista');
  L.push('SOLO LOS PEDIDOS DE LA LISTA ......... ' + B.ms + ' ms' + (B.err ? '   ⚠️ ' + B.err : ''));
  L.push('');

  if (A.err || B.err) {
    L.push('❌ Una de las dos fallo. NO encender. Arriba esta el motivo.');
    Logger.log(L.join('\n')); return L.join('\n');
  }

  if (A.ms > 0) {
    var ahorro = A.ms - B.ms;
    L.push('DIFERENCIA: ' + (ahorro >= 0 ? '-' : '+') + Math.abs(ahorro) + ' ms   ('
           + Math.round((ahorro / A.ms) * 100) + '% mas rapido)');
    L.push('');
  }

  // ── Lo unico que de verdad importa: que los numeros sean IDENTICOS ───────
  var ha = _mspHuella_(A.res), hb = _mspHuella_(B.res);
  var todas = {}, k;
  for (k in ha) todas[k] = 1;
  for (k in hb) todas[k] = 1;
  var nombres = Object.keys(todas).sort(), difs = [];
  nombres.forEach(function (n) {
    if (ha[n] !== hb[n]) difs.push('   · ' + n + '\n       hoy:  ' + (ha[n] || '(no aparece)') +
                                   '\n       nuevo:' + (hb[n] || '(no aparece)'));
  });

  L.push('PRODUCTOS: ' + Object.keys(ha).length + ' hoy  ·  ' + Object.keys(hb).length + ' con el cambio');
  if (!difs.length) {
    L.push('✅ IDENTICOS producto por producto (unidades, ingreso y margen).');
    L.push('');
    L.push('Se puede encender:  margenSoloLosPedidosEncender()');
    try { CacheService.getScriptCache().put(MSP_SELLO, String(Date.now()), MSP_SELLO_S); } catch (e) {}
  } else {
    L.push('❌ HAY ' + difs.length + ' DIFERENCIA(S). NO encender.');
    L.push(difs.slice(0, 20).join('\n'));
    if (difs.length > 20) L.push('   ... y ' + (difs.length - 20) + ' mas.');
    L.push('');
    L.push('Que significa: la ventana de 120 dias estaba aportando pedidos que la');
    L.push('lista no trae. Hay que entender cual antes de tocar nada.');
  }

  Logger.log(L.join('\n'));
  return L.join('\n');
}

// ══════════════════════════════════════════════════════════════════════════
// EL ENCENDIDO. Pide haber corrido mrg_14 y que haya dado identico.
// ══════════════════════════════════════════════════════════════════════════
function margenSoloLosPedidosEncender() {
  var sello = null;
  try { sello = CacheService.getScriptCache().get(MSP_SELLO); } catch (e) {}
  if (!sello) {
    var m = 'Antes de encender, corre mrg_14_COMPARAR_SOLO_PEDIDOS() y confirma que da IDENTICO. '
          + 'El sello dura 6 horas. Asi nadie enciende a ciegas.';
    _mspLog_(m);
    return { ok: false, motivo: 'sin comparacion previa', detalle: m };
  }
  setProp(MSP_PROP, 'SI');
  _mspLog_('✅ MARGEN_SOLO_LOS_PEDIDOS = SI. Reversa en cualquier momento: margenSoloLosPedidosApagar()');
  return { ok: true, encendido: true };
}


// ════════ AdsAtribucion.gs (entero, tal cual) ════════
/*****************************************************************
 * AdsAtribucion.gs — 20-set-2026 · LA PLATA DE ADS VA A LA FAMILIA QUE SE VENDIO
 *
 * ── POR QUE DABA CERO (Pablo lo corrio con datos reales el 20-set) ──────────
 * mrg_7_ATRIBUCION_ENSAYO() dio 0 en las cuatro lineas:
 *   TOPS S/ 873.96 · BLUSAS S/ 145.87 · PANTALONES S/ 24.55 · VARIOS S/ 23.25
 *   todas «sin ventas → queda en NO ATRIBUIDO» · atribuido a productos: S/ 0.00
 * La version anterior buscaba las ventas cuya columna `campana` de
 * public.bot_ventas_atribuidas se llamara EXACTAMENTE «TOPS», o «TOPS» + un
 * separador (eso hacia _adsCampanaCoincide_, y _adsPedidosPorCampana_ agrupaba
 * los pedidos por ese nombre). Pero «TOPS» NO ES EL NOMBRE DE NINGUNA CAMPAÑA:
 * es el texto que Pablo escribe A MANO en la columna Producto de la pestaña
 * MetaAdsInversion. Las campañas de verdad se llaman con la nomenclatura
 * completa, asi que ninguna coincidia nunca, la lista `mias` quedaba vacia y las
 * cuatro lineas caian en «sin ventas». Por eso salia 0 en las cuatro.
 *
 * ── LA REGLA NUEVA (Pablo, 20-set, textual) ─────────────────────────────────
 * «si dice tops, entonces si hay un top, por ejemplo el top violeta, entonces se
 *  le atribuye al top violeta. ¿no debería haber como una categoría top
 *  solamente? si dice pantalones, debe ser a una categoría»
 *
 * O SEA: SE OLVIDA EL EMPAREJAMIENTO POR CAMPAÑA. Cuando una linea de inversion
 * se llama como una FAMILIA DE PRENDA (en plural o en singular: TOPS, BLUSAS,
 * PANTALONES, BLAZERS…), su plata se reparte entre LOS PRODUCTOS DE ESA FAMILIA
 * QUE SE VENDIERON EN EL PERIODO, en proporcion a las ventas en soles de cada uno.
 * Con sus numeros: la linea TOPS tiene S/ 873.96; si en setiembre se vendieron
 * TOP VIOLETA S/ 600 y TOP OLIVIA S/ 400, van S/ 524.38 y S/ 349.58.
 * Si NO se vendio ningun top en el periodo, esos S/ 873.96 quedan enteros en la
 * fila «🚫 NO ATRIBUIDO». Eso es correcto: no hay a quien cargarle.
 * VARIOS no es una familia de prenda: NUNCA empareja, siempre queda sin atribuir.
 *
 * ── LO QUE NO CAMBIA ────────────────────────────────────────────────────────
 * Una linea de inversion cuyo nombre SI es un producto completo
 * («PANTALON MIRELLA») se sigue pegando por nombre exacto, como hoy: esta regla
 * solo toca las lineas que NO son un producto real (_margenEsProductoReal_ en
 * MargenEngine.js). Esa plata no se mueve ni un centimo.
 *
 * ── UNA CONSULTA MENOS A LA BASE ────────────────────────────────────────────
 * Ya NO se lee public.bot_ventas_atribuidas: no hacen falta sus columnas
 * `campana` ni `ad_name`. La fuente son LAS VENTAS DEL PERIODO QUE EL MARGEN YA
 * TIENE EN MEMORIA (las mismas filas que arma margenCalcular), agrupadas por
 * producto. Este calculo hace CERO viajes a la base: en este archivo ya no hay
 * ningun _sbFetch_ (mrg_9, que solo diagnostica, lee la pestaña una sola vez).
 *
 * ── LOS PASOS, EN ORDEN ─────────────────────────────────────────────────────
 *  1. Las ventas del periodo se agrupan UNA vez en memoria: familia → producto →
 *     soles (_adsVentasPorFamilia_). Los soles de un producto son la suma de
 *     PrecioUnit de SUS prendas: el precio de la prenda, NO el subtotal (el
 *     subtotal arrastra envio y descuento, que no son la prenda).
 *  2. Solo se toca la inversion cuyo nombre NO es un producto real.
 *  3. De ese nombre se saca su FAMILIA (TOPS→TOP, BLUSAS→BLUSA, PANTALONES→
 *     PANTALON; VARIOS→ninguna), sin tildes y aceptando plural o singular.
 *  4. Si esa familia vendio, la plata se reparte entre esos productos en
 *     proporcion a sus soles. Si no vendio nada, o el nombre no es una familia,
 *     la plata ENTERA se queda en «🚫 NO ATRIBUIDO».
 *
 * ── SIEMPRE EL MISMO RESULTADO (determinista) ───────────────────────────────
 * El reparto recorre los productos EN ORDEN ALFABETICO, asi que la misma entrada
 * da SIEMPRE los mismos numeros, sin importar en que orden llegaron las ventas.
 *
 * ── NO SE PIERDE NI SE DUPLICA UN CENTIMO ───────────────────────────────────
 * La plata solo se MUEVE de fila a fila: la inversion total del periodo no
 * cambia. Al repartir se redondea a 2 decimales y EL ULTIMO PRODUCTO DEL REPARTO
 * ABSORBE EL RESIDUO, asi la suma de los pedazos es EXACTAMENTE el monto de la
 * linea. Invariante que las pruebas verifican antes y despues de encender:
 *      inversion total = atribuida + productos reales sin ventas + no atribuible
 *
 * ── LAS DOS LECTURAS, SIN MEZCLAR (lo pidio Pablo expresamente) ─────────────
 *      LECTURA 1 · GASTO POR CAMPAÑA   → que linea corrio y cuanto gasto
 *      LECTURA 2 · GASTO POR PRODUCTO  → cuanto me costo vender esto (el margen)
 *
 * ── NACE APAGADO ────────────────────────────────────────────────────────────
 *   interruptor: ADS_ATRIBUIR_POR_COMPRA  — SOLO el texto 'SI' lo enciende
 *   ensayar    : mrg_7_ATRIBUCION_ENSAYO()     sin argumentos, SOLO LEE
 *   encender   : mrg_8_ENCENDER()              se niega si mrg_7 no se corrio
 *   apagar     : adsAtribuirPorCompraApagar()  reversa, en cualquier momento
 *   diagnostico: mrg_9_DE_DONDE_SALE_VARIOS()  sin argumentos, SOLO LEE
 * Apagado, margenCalcular devuelve EXACTAMENTE lo de siempre (ni una clave nueva
 * viaja a la pantalla) y la columna nueva de la tabla muestra «—».
 *
 * ── MetaAdsInversion NO GUARDA EL NUMERO DEL ANUNCIO ────────────────────────
 * Pablo pregunto «cual es el numero exacto de ese anuncio». No hay ninguno: la
 * pestaña MetaAdsInversion tiene SOLO tres columnas — Mes, Producto,
 * InversionSoles (ver MargenEngine.js y el check de
 * PEGAR_EN_SUPABASE_margen_config_19sep.sql). NO guarda ad_id ni campana. Ese
 * texto («VARIOS», «TOPS») lo escribio una persona a mano: no hay ningun anuncio
 * detras que se pueda rastrear desde el ERP. Se corrige en la pestaña, y
 * mrg_9_DE_DONDE_SALE_VARIOS() dice la planilla, la pestaña y la FILA EXACTA.
 *****************************************************************/

var ADS_ATRIB_PROP     = 'ADS_ATRIBUIR_POR_COMPRA';   // la unica propiedad nueva
var ADS_ATRIB_SELLO    = 'ADS_ATRIB_ENSAYO';          // sello de mrg_7 (memoria, 6 h)
var ADS_ATRIB_SELLO_S  = 21600;                       // 6 horas (el maximo de CacheService)
// 20-set · YA NO HAY NINGUNA CONSTANTE DE CONSULTA: la regla por familia vendida
// no lee bot_ventas_atribuidas (ni su tabla, ni su paginado, ni su tope de viajes).
var _ADS_ATRIB_FORZAR   = null;   // true | false | null — SOLO el ensayo lo usa
var _ADS_ATRIB_CACHE    = null;   // la propiedad se lee una vez por ejecucion

function _adsAtribLog_(m) { try { Logger.log('[AdsAtribucion] ' + m); } catch (e) {} }
function _adsR2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function _adsRell_(s, n) { s = String(s == null ? '' : s); while (s.length < n) s += ' '; return s.slice(0, n); }
function _adsNum_(x, n) { var s = _adsR2_(x).toFixed(2); while (s.length < n) s = ' ' + s; return s; }

/** EL INTERRUPTOR. Propiedad pura: solo 'SI' enciende. Ante cualquier duda
 *  (error al leer, vacia, texto raro) devuelve false = la regla de siempre. */
function _adsAtribActivo_() {
  if (_ADS_ATRIB_FORZAR === true || _ADS_ATRIB_FORZAR === false) return _ADS_ATRIB_FORZAR;
  if (_ADS_ATRIB_CACHE === null) {
    try { _ADS_ATRIB_CACHE = String(getProp(ADS_ATRIB_PROP, '') || '').trim().toUpperCase() === 'SI'; }
    catch (e) { _ADS_ATRIB_CACHE = false; }
  }
  return _ADS_ATRIB_CACHE;
}

/** LA REVERSA. Sin argumentos: se corre desde el editor. No pierde ningun dato:
 *  la inversion vuelve a quedarse donde la puso el nombre de la campaña. */
function adsAtribuirPorCompraApagar() {
  setProp(ADS_ATRIB_PROP, '');
  _ADS_ATRIB_CACHE = null;
  try { auditLog('margen.adsAtribucion.apagar', 'Margen', '', 'la inversion de Ads vuelve a pegarse por nombre de campaña', {}); } catch (e) {}
  _adsAtribLog_('APAGADO: la inversion de Ads vuelve a pegarse por el nombre de la campaña.');
  return { ok: true, encendido: false };
}

// ── Normalizar nombres ────────────────────────────────────────────────────
/** Un nombre comparable: sin espacios de sobra, en mayusculas. Nada mas: NO se
 *  quitan tildes ni signos, porque el nombre de la campaña y el de la linea de
 *  inversion los escribe la misma persona y cambiarlos aca esconderia errores. */
function _adsClave_(x) { return String(x == null ? '' : x).replace(/\s+/g, ' ').trim().toUpperCase(); }

// 20-set · SE FUE _adsCampanaCoincide_: ERA LA CAUSA DEL 0. Comparaba el texto
// que Pablo escribe a mano en MetaAdsInversion («TOPS») contra el nombre real de
// la campaña, que se llama con la nomenclatura completa: no coincidia nunca.

// ── 20-set · LA FAMILIA DE PRENDA: EL EMPAREJAMIENTO QUE PIDIO PABLO ──────
/**
 * 20-set-2026 · Pablo, textual: «si una campaña Tops vendió pantalones, no
 * debería atribuirle a nadie por regla. Solo si vendió Tops, se le atribuye al
 * top que vendió.» Por eso la plata de una campaña solo se le carga a un
 * producto de SU MISMA FAMILIA: lo que no empareja se queda sin atribuir, que es
 * lo honesto (esa venta no prueba que ese producto haya costado esa plata).
 *
 * LA LISTA DE FAMILIAS NO ESTA INVENTADA. Es la misma lista de tipos de prenda
 * con la que el ERP ya clasifica el catalogo: ProductosAdmin.gs, arreglo REGLAS
 * (lineas 510-518), el que decide a que CATS_CANON (linea 480) va cada producto.
 * Aca se copia SOLO la palabra del tipo de prenda, en singular.
 * Y la familia de un producto es SU PRIMERA PALABRA, que es exactamente como
 * _productoBase_ (MargenEngine.js) parte el nombre en «TIPO DISEÑO»:
 * TOP OLIVIA → TOP · BLUSA TOSCANA → BLUSA · PANTALON MIRELLA → PANTALON.
 */
var ADS_FAMILIAS_ERP = [
  'BLAZER', 'ABRIGO', 'SACO', 'CASACA', 'TRENCH', 'CARDIGAN', 'CHALECO', 'GABARDINA',
  'PANTALON', 'BERMUDA', 'LEGGIN', 'JEAN',
  'BIKINI', 'TRIKINI', 'SWIM',
  'FALDA', 'VESTIDO', 'ENTERIZO', 'JUMPER', 'SHORT',
  'BLUSA', 'BODY', 'TOP', 'CROP', 'POLO', 'CAMISA',
  'INTERIOR', 'MODELADOR', 'MOLDEADOR', 'FAJA', 'BRASIER', 'HILO', 'TANGA',
  'CORREA', 'CINTURON', 'PANUELO',
  'ANILLO', 'ARETE', 'COLLAR', 'PULSERA', 'ARO', 'CADENA', 'DIJE', 'COLET',
  'SCRUNCHIE', 'GARGANTILLA'
];

/** Sin tildes y en mayusculas (el mismo criterio que _sinAc de ProductosAdmin.gs).
 *  Aca SI se quitan las tildes, al contrario que en _adsClave_: el nombre de la
 *  campaña lo escribe una persona («Pantalón») y el del catalogo otra. */
function _adsSinTildes_(x) {
  return String(x == null ? '' : x).toUpperCase()
    .replace(/[ÁÀÄÂ]/g, 'A').replace(/[ÉÈËÊ]/g, 'E').replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O').replace(/[ÚÙÜÛ]/g, 'U').replace(/Ñ/g, 'N');
}

/** Plural → singular, tolerante: BLUSAS→BLUSA, TOPS→TOP, PANTALONES→PANTALON.
 *  Mismo criterio que ProductosAdmin.gs (_sing_): se le saca la 'S' o el 'ES'
 *  del final. Asi BLUSAS y BLUSA son la misma familia sin listar cada par. */
function _adsSingular_(p) { return _adsSinTildes_(p).replace(/E?S$/, ''); }

/** La familia de un PRODUCTO = su primera palabra, en singular. */
function _adsFamiliaProducto_(prod) {
  var p = _adsSinTildes_(prod).replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  return _adsSingular_(p.split(' ')[0] || '');
}

/** La familia de una LINEA DE INVERSION (nombre de campaña) = su primera palabra
 *  en singular, Y SOLO SI es un tipo de prenda del ERP. Por eso «VARIOS» no
 *  tiene familia y NUNCA empareja con nada: es correcto y esperado, ese nombre
 *  no dice que prenda se anuncio. */
function _adsFamiliaCampana_(nombre) {
  var f = _adsFamiliaProducto_(nombre);
  if (!f) return '';
  for (var i = 0; i < ADS_FAMILIAS_ERP.length; i++) if (ADS_FAMILIAS_ERP[i] === f) return f;
  return '';
}

/** ¿El producto comprado es de la familia de la campaña? */
function _adsMismaFamilia_(familia, prod) {
  return !!familia && _adsFamiliaProducto_(prod) === familia;
}

// ── 20-set · SE FUERON 7 FUNCIONES DEL EMPAREJAMIENTO POR CAMPAÑA ─────────
// _adsFamiliasDelPedido_ · _adsRestarDias_ · _adsAnuncioPorPedido_ ·
// _adsProductoMayorPrecio_ · _adsPedidosPorCampana_ · _adsSolesPedido_ ·
// _adsAporteDeLinea_.  Todas existian para contestar «que campaña vendio este
// pedido», y esa pregunta ya no se hace: Pablo pidio repartir por FAMILIA
// VENDIDA. Con ellas se fue la unica consulta a bot_ventas_atribuidas.

// ── LAS VENTAS DEL PERIODO, AGRUPADAS POR FAMILIA Y POR PRODUCTO ──────────
/**
 * 20-set · Pablo, textual: «si dice tops, entonces si hay un top, por ejemplo el
 * top violeta, entonces se le atribuye al top violeta». Esta es LA FUENTE del
 * reparto: las ventas del periodo QUE EL MARGEN YA TIENE EN MEMORIA (los mismos
 * pedidos que arma margenCalcular). No lee nada: cero viajes a la base.
 *
 * Devuelve  { 'TOP': { soles, pedidos, productos: { 'TOP OLIVIA': {soles, pedidos} } } }
 *
 * Los soles de un producto son la suma de PrecioUnit de SUS prendas: el precio de
 * la prenda, NO el subtotal (el subtotal arrastra envio y descuento del pedido y
 * moveria el reparto por razones que no tienen nada que ver con la prenda).
 * `pedidos` cuenta pedidos distintos y sirve SOLO para contarlo en el informe: no
 * entra en ninguna cuenta de plata.
 * Una prenda que no esta en el catalogo no cuenta: no se le puede atribuir plata
 * a un producto que no existe.
 */
function _adsVentasPorFamilia_(pedidos, activos) {
  var out = {};
  (pedidos || []).forEach(function (p) {
    var vistoFam = {}, vistoProd = {};
    ((p && p.lineas) || []).forEach(function (l) {
      var base = _productoBase_(l.Prenda, activos);
      if (!base) return;
      var fam = _adsFamiliaProducto_(base);
      if (!fam) return;
      var F = out[fam] || (out[fam] = { soles: 0, pedidos: 0, productos: {} });
      var P = F.productos[base] || (F.productos[base] = { soles: 0, pedidos: 0 });
      var soles = _toFloat_(l.PrecioUnit);
      F.soles = _adsR2_(F.soles + soles);
      P.soles = _adsR2_(P.soles + soles);
      if (!vistoFam[fam])   { vistoFam[fam] = 1;   F.pedidos++; }
      if (!vistoProd[base]) { vistoProd[base] = 1; P.pedidos++; }
    });
  });
  return out;
}

// ── PASO 4: repartir sin perder ni duplicar un centimo ────────────────────
/**
 * pares = [[producto, solesQueAporto], ...]. Devuelve [[producto, monto], ...]
 * con dos decimales, recorridos EN ORDEN ALFABETICO, y el ULTIMO absorbe el
 * residuo del redondeo para que la suma sea EXACTAMENTE `monto`. Si los soles
 * suman 0 (no deberia pasar: un pedido sin plata no llega aca) se reparte en
 * partes iguales, que es lo unico que no inventa un ganador.
 */
function _adsRepartir_(monto, pares) {
  monto = _adsR2_(monto);
  var lista = (pares || []).slice().sort(function (x, y) { return x[0] < y[0] ? -1 : (x[0] > y[0] ? 1 : 0); });
  if (!lista.length) return [];
  var total = 0;
  lista.forEach(function (x) { total += Number(x[1]) || 0; });
  var out = [], acum = 0;
  for (var i = 0; i < lista.length; i++) {
    var m;
    if (i === lista.length - 1) m = _adsR2_(monto - acum);            // el ultimo cuadra el centimo
    else m = _adsR2_(total > 0 ? monto * ((Number(lista[i][1]) || 0) / total) : monto / lista.length);
    acum = _adsR2_(acum + m);
    out.push([lista[i][0], m]);
  }
  return out;
}

// ── EL APLICADOR: lo que llama margenCalcular ─────────────────────────────
/**
 * Devuelve null cuando el interruptor esta apagado (y entonces margenCalcular no
 * cambia ni una coma). Encendido, MUEVE la plata de las lineas que no son
 * productos a los productos DE ESA FAMILIA que se vendieron en el periodo,
 * recalcula el CPA y el margen de las filas tocadas, y devuelve las DOS lecturas
 * para el informe.
 * 20-set · `desde` y `hasta` ya no se usan: la fuente son los pedidos que llegan
 * por parametro, no una consulta por rango. Se dejan en la firma para no tocar
 * MargenEngine.js.
 */
function _adsAtribucionAplicar_(salida, pedidos, activos, conjuntos, desde, hasta) {
  if (!_adsAtribActivo_()) return null;
  // 20-set · LA UNICA FUENTE: las ventas del periodo que el Margen ya tiene en
  // memoria. Antes se leia public.bot_ventas_atribuidas para saber que campaña
  // habia vendido cada pedido; con la regla por familia ese dato no hace falta y
  // este calculo hace CERO viajes a la base.
  var porFamilia = _adsVentasPorFamilia_(pedidos, activos);

  // Todas las filas declaran de donde viene su plata, aunque no cambien: la
  // pantalla necesita poder decir «propia» vs «atribuida» en cada fila.
  var porNombre = {};
  salida.forEach(function (r) {
    r.InversionPropia = _adsR2_(r.InversionMetaAds);
    r.InversionAtribuida = 0;
    porNombre[r.Producto] = r;
  });

  var informe = [], tocadas = {}, totalAtribuido = 0, totalSinAtribuir = 0;

  // Solo las lineas de inversion cuyo nombre NO es un producto real. Una linea
  // que SI es un producto completo («PANTALON MIRELLA») se queda tal cual, como
  // hoy: no se le mueve ni un centimo.
  salida.slice().forEach(function (r) {
    if (_margenEsProductoReal_(r.Producto, activos, conjuntos)) return;
    var monto = _adsR2_(r.InversionMetaAds);
    if (monto <= 0) return;
    var nombre = _adsClave_(r.Producto);
    // La familia de la linea. '' = el nombre no es una familia de prenda (VARIOS).
    var familia = _adsFamiliaCampana_(nombre);
    var F = familia ? porFamilia[familia] : null;
    var pares = F ? Object.keys(F.productos).map(function (p) { return [p, F.productos[p].soles]; }) : [];

    if (!pares.length) {
      // O el nombre no dice que prenda se anuncio (VARIOS: nunca empareja), o esa
      // familia NO vendio nada en el periodo. En los dos casos la plata se queda
      // ENTERA en la fila «🚫 NO ATRIBUIDO». A proposito: es lo honesto, no hay a
      // quien cargarle ese gasto.
      totalSinAtribuir = _adsR2_(totalSinAtribuir + monto);
      tocadas[r.Producto] = r;
      informe.push({ campana: r.Producto, familia: familia, inversion: monto,
                     productosFamilia: 0, pedidosFamilia: 0, ventasSoles: 0,
                     atribuido: 0, sinAtribuir: monto,
                     estado: familia ? 'FAMILIA_SIN_VENTAS' : 'NO_ES_FAMILIA',
                     productos: [] });
      return;
    }

    // Reparto PROPORCIONAL A LAS VENTAS EN SOLES de cada producto de la familia.
    // _adsRepartir_ recorre alfabetico y el ULTIMO absorbe el residuo: la suma de
    // los pedazos es EXACTAMENTE `monto`.
    var reparto = _adsRepartir_(monto, pares);
    var det = [];
    reparto.forEach(function (x) {
      var prod = x[0], m = x[1];
      var fila = porNombre[prod];
      if (!fila) {
        // El producto vendido no tenia fila propia (pasa con MARGEN_MISMA_LISTA:
        // el pedido se conto en OTRO producto, el de mayor venta del pedido). Se
        // le abre una fila para que la plata no se pierda.
        fila = { Producto: prod, Ventas: 0, PrecioVentaProm: 0, CostoProm: 0, MargenBrutoPct: 0,
                 InversionMetaAds: 0, CPA: 0, CPAMax: 0, Margen: 0, IngresoTotal: 0, CostoTotal: 0,
                 InversionPropia: 0, InversionAtribuida: 0 };
        salida.push(fila);
        porNombre[prod] = fila;
      }
      fila.InversionMetaAds = _adsR2_(fila.InversionMetaAds + m);
      fila.InversionAtribuida = _adsR2_(fila.InversionAtribuida + m);
      tocadas[prod] = fila;
      totalAtribuido = _adsR2_(totalAtribuido + m);
      det.push({ producto: prod, ventasSoles: F.productos[prod].soles,
                 pedidos: F.productos[prod].pedidos, monto: m });
    });
    r.InversionMetaAds = 0;   // toda su plata se fue a los productos de su familia
    tocadas[r.Producto] = r;
    informe.push({ campana: r.Producto, familia: familia, inversion: monto,
                   productosFamilia: pares.length, pedidosFamilia: F.pedidos,
                   ventasSoles: F.soles, atribuido: monto, sinAtribuir: 0,
                   estado: 'REPARTIDA', productos: det });
  });

  // El CPA y el margen de las filas tocadas se recalculan con la MISMA formula
  // de siempre (MargenEngine.js): CPA = inversion / ventas, Margen = CPAMax - CPA.
  for (var p in tocadas) _adsRecalcularFila_(tocadas[p]);

  informe.sort(function (x, y) { return y.inversion - x.inversion; });
  return {
    activo: true,
    totalAtribuido: _adsR2_(totalAtribuido),
    noAtribuidoRestante: _adsR2_(totalSinAtribuir),
    campanas: informe,
    // LA OTRA LECTURA, sin mezclar: cuanto gasto CADA linea de inversion (la
    // verdad del anuncio), que es lo que sirve para decidir que campaña correr.
    gastoPorCampana: informe.map(function (x) {
      return { campana: x.campana, inversion: x.inversion, familia: x.familia,
               productosFamilia: x.productosFamilia, ventasSoles: x.ventasSoles,
               atribuido: x.atribuido, sinAtribuir: x.sinAtribuir, estado: x.estado };
    })
  };
}

/** CPA y Margen de una fila, con las formulas de MargenEngine.js, ni una mas. */
function _adsRecalcularFila_(r) {
  var inv = _adsR2_(r.InversionMetaAds);
  r.InversionMetaAds = inv;
  var cpa = r.Ventas ? inv / r.Ventas : 0;
  r.CPA = _adsR2_(cpa);
  r.Margen = _adsR2_(r.CPAMax - cpa);
  return r;
}

// ══════════════════════════════════════════════════════════════════════════
//  mrg_7_ATRIBUCION_ENSAYO — SIN ARGUMENTOS, SOLO LEE
// ══════════════════════════════════════════════════════════════════════════
function _adsHoy_()  { return Utilities.formatDate(new Date(), 'America/Lima', 'yyyy-MM-dd'); }
function _adsMes1_() { return _adsHoy_().slice(0, 8) + '01'; }

/**
 * Lo que Pablo mira ANTES de encender. No enciende ni escribe nada: corre el
 * mes en curso con la regla forzada en ON, en memoria, y cuenta:
 *   · linea por linea: si es un producto exacto, una familia de prenda o nada;
 *     cuantos productos de esa familia vendieron en el periodo y cuanto vendio
 *     cada uno; cuanto le toca a cada uno; y que queda sin atribuir;
 *   · LAS DOS LECTURAS por separado (gasto por campaña / gasto por producto);
 *   · el antes y el despues del CPA de los productos mas afectados;
 *   · el cuadre al centimo: total = atribuido + no atribuible, antes y despues.
 * Deja un sello de 6 horas en la memoria del script (CacheService, NO una
 * propiedad: el proyecto ya esta en el tope de la pantalla de Propiedades) para
 * que mrg_8_ENCENDER() sepa que estos numeros se vieron y son frescos.
 */
function mrg_7_ATRIBUCION_ENSAYO() {
  var desde = _adsMes1_(), hasta = _adsHoy_();
  var L = ['', '══════ ADS · ATRIBUIR AL PRODUCTO COMPRADO · ENSAYO (SOLO LEE) ══════',
           '  periodo: ' + desde + ' → ' + hasta, ''];
  var antes = null, despues = null, err = '';
  var guardar = _ADS_ATRIB_FORZAR;
  try {
    _ADS_ATRIB_FORZAR = false;  antes   = margenCalcular(desde, hasta);
    _ADS_ATRIB_FORZAR = true;   despues = margenCalcular(desde, hasta);
  } catch (e) { err = String((e && e.message) || e); }
  _ADS_ATRIB_FORZAR = guardar;

  if (err || !antes || !despues) {
    L.push('  🛑 no pude calcular: ' + (err || 'sin datos'));
    var s0 = L.join('\n'); Logger.log(s0); return s0;
  }

  var A = antes.inversionBaldes, D = despues.inversionBaldes;
  var at = despues.atribucionPorCompra || { campanas: [], totalAtribuido: 0, noAtribuidoRestante: 0 };

  L.push('  ── HOY (la inversion se pega por el NOMBRE de la campaña) ──');
  L.push('    inversion total del periodo ....... S/ ' + _adsNum_(A.total, 10));
  L.push('    pegada a productos que vendieron .. S/ ' + _adsNum_(A.conVentas, 10));
  L.push('    productos reales que no vendieron . S/ ' + _adsNum_(A.sinVentas, 10));
  L.push('    🚫 NO ATRIBUIDO ................... S/ ' + _adsNum_(A.noAtribuido, 10));
  L.push('');
  L.push('  ── LECTURA 1 · GASTO POR CAMPAÑA (la verdad del anuncio) ──');
  L.push('    Esto es lo que hay que mirar para decidir QUE CAMPAÑA CORRER.');
  L.push('    No se mezcla con la lectura 2: son dos preguntas distintas.');
  L.push('    LA REGLA (Pablo, 20-set): «si dice tops, entonces si hay un top, por ejemplo el');
  L.push('    top violeta, entonces se le atribuye al top violeta. ¿no debería haber como una');
  L.push('    categoría top solamente? si dice pantalones, debe ser a una categoría»');
  L.push('    Ya NO se empareja por nombre de campaña (eso daba 0: «TOPS» no es el nombre de');
  L.push('    ninguna campaña, es el texto que escribiste en MetaAdsInversion). Ahora la plata');
  L.push('    de una linea que se llama como una FAMILIA DE PRENDA se reparte entre los');
  L.push('    productos DE ESA FAMILIA que se vendieron en el periodo, segun sus ventas.');
  L.push('    ' + _adsRell_('linea de inversion', 24) + _adsRell_('inversion', 12) + 'que es este nombre');
  L.push('    ' + '───────────────────────────────────────────────────────────────────');
  if (!at.campanas.length) L.push('    (no hay inversion en nombres que no sean productos: nada que atribuir)');
  at.campanas.forEach(function (c) {
    L.push('    ' + _adsRell_(c.campana, 24) + _adsRell_('S/ ' + _adsNum_(c.inversion, 8), 12) +
           (c.familia ? ('familia de prenda ' + c.familia) : 'NO es una familia de prenda: nunca empareja'));
    if (c.estado === 'NO_ES_FAMILIA') {
      L.push('        ⛔ este nombre no dice que prenda se anuncio → los S/ ' + _adsNum_(c.inversion, 2) + ' quedan SIN ATRIBUIR');
      L.push('        ↳ para saber en que FILA esta escrito y corregirlo: mrg_9_DE_DONDE_SALE_VARIOS()');
    } else if (c.estado === 'FAMILIA_SIN_VENTAS') {
      L.push('        ⛔ no se vendio ningun ' + c.familia + ' en el periodo → los S/ ' + _adsNum_(c.inversion, 2) + ' quedan SIN ATRIBUIR');
    } else {
      L.push('        · en el periodo vendieron ' + c.productosFamilia + ' producto(s) de la familia ' +
             c.familia + ' por S/ ' + _adsNum_(c.ventasSoles, 2) + ' en ' + c.pedidosFamilia + ' pedido(s)');
      L.push('        ✅ se atribuyen los S/ ' + _adsNum_(c.atribuido, 2) + ' completos, en proporcion a lo que vendio cada uno:');
      c.productos.forEach(function (p) {
        L.push('        ↳ ' + _adsRell_(p.producto, 28) + 'S/ ' + _adsNum_(p.monto, 8) +
               '   (vendio S/ ' + _adsNum_(p.ventasSoles, 8) + ' en ' + p.pedidos + ' pedido(s))');
      });
    }
  });
  L.push('');
  L.push('  ── LECTURA 2 · GASTO ATRIBUIDO A PRODUCTO (la verdad del margen) ──');
  L.push('    Esto es lo que contesta CUANTO ME COSTO VENDER ESTO.');
  L.push('    ' + _adsRell_('producto', 26) + _adsRell_('propia', 11) + _adsRell_('atribuida', 11) + _adsRell_('total', 11) + 'CPA antes → despues');
  L.push('    ' + '───────────────────────────────────────────────────────────────────────────');
  var afectados = despues.productos.filter(function (r) { return Number(r.InversionAtribuida || 0) > 0; })
    .sort(function (x, y) { return y.InversionAtribuida - x.InversionAtribuida; });
  if (!afectados.length) L.push('    (ningun producto recibiria plata atribuida)');
  afectados.slice(0, 15).forEach(function (r) {
    var cpaAntes = r.Ventas ? _adsR2_(Number(r.InversionPropia || 0) / r.Ventas) : 0;
    L.push('    ' + _adsRell_(r.Producto, 26) +
           _adsRell_('S/ ' + _adsNum_(r.InversionPropia, 7), 11) +
           _adsRell_('S/ ' + _adsNum_(r.InversionAtribuida, 7), 11) +
           _adsRell_('S/ ' + _adsNum_(r.InversionMetaAds, 7), 11) +
           (r.Ventas ? ('S/ ' + _adsNum_(cpaAntes, 7) + ' → S/ ' + _adsNum_(r.CPA, 7) +
                        '   (' + r.Ventas + ' ventas, CPA max S/ ' + _adsNum_(r.CPAMax, 7) + ')')
                     : '(0 ventas en el periodo: fila abierta solo para no perder la plata)'));
  });
  L.push('');
  L.push('  ── DESPUES (como quedarian los baldes) ──');
  L.push('    inversion total del periodo ....... S/ ' + _adsNum_(D.total, 10) +
         (_adsR2_(D.total) === _adsR2_(A.total) ? '   ✅ el total NO cambio' : '   🛑 EL TOTAL CAMBIO: NO ENCENDER'));
  L.push('    pegada a productos que vendieron .. S/ ' + _adsNum_(D.conVentas, 10));
  L.push('    productos reales que no vendieron . S/ ' + _adsNum_(D.sinVentas, 10));
  L.push('    🚫 NO ATRIBUIDO (lo que de verdad no se puede atribuir) S/ ' + _adsNum_(D.noAtribuido, 10));
  L.push('');
  var sumaA = _adsR2_(A.conVentas + A.sinVentas + A.noAtribuido);
  var sumaD = _adsR2_(D.conVentas + D.sinVentas + D.noAtribuido);
  var cuadra = sumaA === _adsR2_(A.total) && sumaD === _adsR2_(D.total) && _adsR2_(A.total) === _adsR2_(D.total);
  L.push('  ── EL CUADRE AL CENTIMO (no se pierde ni se duplica plata) ──');
  L.push('    antes:   ' + _adsNum_(sumaA, 10) + ' = total ' + _adsNum_(A.total, 10) + (sumaA === _adsR2_(A.total) ? '  ✅' : '  🛑'));
  L.push('    despues: ' + _adsNum_(sumaD, 10) + ' = total ' + _adsNum_(D.total, 10) + (sumaD === _adsR2_(D.total) ? '  ✅' : '  🛑'));
  L.push('    atribuido a productos: S/ ' + _adsNum_(at.totalAtribuido, 10) +
         ' · no atribuible: S/ ' + _adsNum_(D.noAtribuido, 10));
  L.push('');
  L.push('  ── LO QUE TODAVIA QUEDA SIN ATRIBUIR, Y POR QUE ──');
  L.push('    Una linea cuyo nombre NO es una familia de prenda (VARIOS) no dice que prenda');
  L.push('    se anuncio: no hay a quien cargarle esa plata y se queda SIN ATRIBUIR. Lo mismo');
  L.push('    una familia que no vendio nada en el periodo. Es a proposito: ese es el numero');
  L.push('    honesto de lo que no se sabe a quien cargarle, inventar un dueño seria peor.');
  L.push('    Para saber EN QUE FILA de MetaAdsInversion esta escrito cada nombre que no es');
  L.push('    ningun producto, y corregirlo a mano: mrg_9_DE_DONDE_SALE_VARIOS()');
  L.push('');
  L.push('  ── PASOS ──');
  L.push('    1. Mirar arriba: el total no cambia y el cuadre da ✅.');
  L.push('    2. Si esta bien: mrg_8_ENCENDER()   (no enciende si este ensayo no se corrio)');
  L.push('    3. Si algo se ve raro: no encender. Reversa siempre: adsAtribuirPorCompraApagar()');
  L.push('    4. Si hay plata en nombres que no son ningun producto (VARIOS): correr');
  L.push('       mrg_9_DE_DONDE_SALE_VARIOS() — dice la fila exacta para corregirla a mano.');
  L.push('══════════════════════════════════════════════════════════════════════');

  try {
    CacheService.getScriptCache().put(ADS_ATRIB_SELLO, JSON.stringify({
      cuando: new Date().toISOString(), desde: desde, hasta: hasta,
      total: _adsR2_(A.total), cuadra: cuadra,
      atribuido: _adsR2_(at.totalAtribuido), noAtribuido: _adsR2_(D.noAtribuido)
    }), ADS_ATRIB_SELLO_S);
  } catch (e) {}

  var s = L.join('\n');
  Logger.log(s);
  try { _cbInforme_(L); } catch (e) {}
  return s;
}

// ══════════════════════════════════════════════════════════════════════════
//  mrg_8_ENCENDER — SIN ARGUMENTOS. Se niega si mrg_7 no se corrio antes.
// ══════════════════════════════════════════════════════════════════════════
/**
 * El sello del ensayo vive 6 horas en la memoria del script (igual que hizo
 * com_3_ENCENDER en ComisionCobrado.gs): no gasta una propiedad mas y obliga a
 * que los numeros que Pablo vio sean FRESCOS. Si el ensayo dijo que la plata no
 * cuadra al centimo, NO enciende: eso no es una advertencia, es un error.
 */
function mrg_8_ENCENDER() {
  var L = ['══════ ADS · ATRIBUIR AL PRODUCTO COMPRADO · ENCENDER ══════'];
  var sello = null;
  try { var raw = CacheService.getScriptCache().get(ADS_ATRIB_SELLO); if (raw) sello = JSON.parse(raw); } catch (e) {}
  if (!sello) {
    L.push('  🛑 NO se enciende: primero hay que correr mrg_7_ATRIBUCION_ENSAYO().');
    L.push('     (el ensayo deja un sello de 6 horas; si paso mas tiempo, correlo de nuevo)');
    var s0 = L.join('\n'); Logger.log(s0); return s0;
  }
  if (sello.cuadra !== true) {
    L.push('  🛑 NO se enciende: el ensayo del ' + sello.cuando + ' NO cuadro al centimo.');
    L.push('     total ' + sello.total + ' · atribuido ' + sello.atribuido + ' · no atribuible ' + sello.noAtribuido);
    L.push('     Arreglar eso primero. Correr mrg_7_ATRIBUCION_ENSAYO() otra vez.');
    var s1 = L.join('\n'); Logger.log(s1); return s1;
  }
  setProp(ADS_ATRIB_PROP, 'SI');
  _ADS_ATRIB_CACHE = null;
  try {
    auditLog('margen.adsAtribucion.encender', 'Margen', '',
             'la inversion de Ads se atribuye al producto comprado de la MISMA FAMILIA que la campaña (mayor precio de la familia)',
             { ensayo: sello.cuando, atribuido: sello.atribuido, noAtribuido: sello.noAtribuido });
  } catch (e) {}
  L.push('  ✅ ADS_ATRIBUIR_POR_COMPRA = SI');
  L.push('     ensayo del ' + sello.cuando + ' (' + sello.desde + ' → ' + sello.hasta + ')');
  L.push('     se atribuyeron S/ ' + sello.atribuido + ' · quedan S/ ' + sello.noAtribuido + ' sin atribuir');
  L.push('  Reversa, en cualquier momento: adsAtribuirPorCompraApagar()');
  var s = L.join('\n');
  Logger.log(s);
  return s;
}

// ══════════════════════════════════════════════════════════════════════════
//  mrg_9_DE_DONDE_SALE_VARIOS — SIN ARGUMENTOS, SOLO LEE
// ══════════════════════════════════════════════════════════════════════════
/**
 * Lee la pestaña MetaAdsInversion UNA sola vez (getDataRange) y devuelve cada
 * linea CON SU NUMERO DE FILA de la planilla, para poder decirle a Pablo donde
 * corregir a mano. La fila 1 es el encabezado, asi que la primera linea de datos
 * es la fila 2. Las filas vacias se saltan (igual que _leerHojaComoObjetos_).
 * Tambien devuelve los nombres de las columnas, que es la prueba de que esa
 * pestaña NO guarda ad_id ni el nombre de la campaña.
 */
function _adsInversionConFila_() {
  var sh = _margenSS_().getSheetByName('MetaAdsInversion');
  if (!sh) throw new Error('No existe la pestaña MetaAdsInversion');
  var d = sh.getDataRange().getValues();     // UNA sola lectura, ningun bucle de lectura
  var H = (d[0] || []).map(function (x) { return String(x == null ? '' : x).trim(); });
  var iMes = H.indexOf('Mes'), iProd = H.indexOf('Producto'), iInv = H.indexOf('InversionSoles');
  var filas = [];
  for (var i = 1; i < d.length; i++) {
    if (d[i].join('') === '') continue;
    filas.push({
      fila: i + 1,
      mes: iMes >= 0 ? _mesNormalizado_(d[i][iMes]) : '',
      producto: iProd >= 0 ? String(d[i][iProd] == null ? '' : d[i][iProd]).trim() : '',
      soles: iInv >= 0 ? _toFloat_(d[i][iInv]) : 0
    });
  }
  return { columnas: H, filas: filas };
}

/**
 * 20-set · Pablo pregunto «cual es el numero exacto de ese anuncio». NO HAY
 * NINGUNO, y hay que decirlo claro: la pestaña MetaAdsInversion tiene SOLO tres
 * columnas — Mes, Producto, InversionSoles. No guarda ad_id ni campana. Ese
 * texto («VARIOS») lo escribio una persona a mano, asi que no hay un anuncio
 * detras que se pueda rastrear desde el ERP. La pregunta util es otra: ¿EN QUE
 * FILA esta escrito, para corregirlo?
 *
 * Esta funcion, PARA EL MES EN CURSO, lista TODAS las lineas de MetaAdsInversion
 * con su nombre TAL CUAL esta escrito y su monto, y de cada una dice si es:
 *    · un producto exacto del catalogo  → su plata no se mueve
 *    · una familia de prenda            → se reparte entre lo que vendio la familia
 *    · NINGUN producto                  → queda sin atribuir: hay que corregirlo
 * Y al final, para las que no son ningun producto, dice la planilla, la pestaña y
 * la FILA EXACTA donde estan escritas.
 *
 * SIN ARGUMENTOS y SOLO LEE: no escribe, no enciende y no toca ningun interruptor.
 */
function mrg_9_DE_DONDE_SALE_VARIOS() {
  var mes = _adsHoy_().slice(0, 7);
  var L = ['', '══════ ADS · DE DONDE SALE «VARIOS» (Y CADA NOMBRE) · SOLO LEE ══════',
           '  mes en curso: ' + mes, ''];
  var hoja = null, prods = null, err = '';
  try { hoja = _adsInversionConFila_(); prods = _configProductos_(); }
  catch (e) { err = String((e && e.message) || e); }
  if (err || !hoja || !prods) {
    L.push('  🛑 no pude leer MetaAdsInversion: ' + (err || 'sin datos'));
    var s0 = L.join('\n'); Logger.log(s0); return s0;
  }
  var activos = prods.activos, conjuntos = prods.conjuntos;

  L.push('  ── PRIMERO, LA PREGUNTA QUE HICISTE: «cual es el numero exacto de ese anuncio» ──');
  L.push('    NO HAY NINGUNO. La pestaña MetaAdsInversion tiene solo estas columnas:');
  L.push('      ' + hoja.columnas.join('  ·  '));
  L.push('    NO guarda ad_id ni el nombre de la campaña. Ese texto lo escribio una persona');
  L.push('    a mano: no hay un anuncio detras que se pueda rastrear desde el ERP. Se corrige');
  L.push('    en la pestaña, en la fila que dice mas abajo.');
  L.push('');

  var delMes = hoja.filas.filter(function (f) { return f.mes === mes; });
  L.push('  ── TODAS LAS LINEAS DE ' + mes + ' (' + delMes.length + ') ──');
  L.push('    ' + _adsRell_('fila', 6) + _adsRell_('nombre tal cual esta escrito', 30) +
         _adsRell_('monto', 14) + 'que es');
  L.push('    ' + '────────────────────────────────────────────────────────────────────────────────');
  var malos = [], totalMal = 0, total = 0;
  if (!delMes.length) L.push('    (no hay ninguna linea de inversion de ' + mes + ')');
  delMes.forEach(function (f) {
    total = _adsR2_(total + f.soles);
    var esProd = _margenEsProductoReal_(f.producto, activos, conjuntos);
    var familia = esProd ? '' : _adsFamiliaCampana_(_adsClave_(f.producto));
    var que;
    if (esProd) que = '✅ producto exacto del catalogo: su plata NO se mueve';
    else if (familia) que = '📦 familia de prenda ' + familia + ': se reparte entre los ' + familia + ' que vendieron';
    else { que = '🛑 NINGUN producto: esta plata queda SIN ATRIBUIR'; malos.push(f); totalMal = _adsR2_(totalMal + f.soles); }
    L.push('    ' + _adsRell_(String(f.fila), 6) + _adsRell_(f.producto || '(vacio)', 30) +
           _adsRell_('S/ ' + _adsNum_(f.soles, 9), 14) + que);
  });
  L.push('    ' + '────────────────────────────────────────────────────────────────────────────────');
  L.push('    total del mes: S/ ' + _adsNum_(total, 10) + '   ·   de eso, sin atribuir: S/ ' + _adsNum_(totalMal, 10));
  L.push('');
  L.push('  ── LO QUE HAY QUE CORREGIR A MANO, Y DONDE EXACTAMENTE ──');
  if (!malos.length) {
    L.push('    ✅ nada: todas las lineas del mes son un producto del catalogo o una familia de prenda.');
  } else {
    L.push('    planilla: MargenWhatsAppAds  (id ' + MARGEN_SS_ID + ')');
    L.push('    pestaña : MetaAdsInversion');
    malos.forEach(function (f) {
      L.push('      · FILA ' + f.fila + ' · columna Producto dice «' + f.producto + '» · S/ ' + _adsNum_(f.soles, 2));
    });
    L.push('');
    L.push('    COMO SE CORRIGE: cambiar ese texto por el nombre del producto que se anuncio');
    L.push('    («TOP OLIVIA») o por la familia de prenda que era («TOPS», «PANTALONES»). Si de');
    L.push('    verdad fue publicidad de varias cosas distintas, partir esa fila en varias, una');
    L.push('    por prenda, cada una con su parte del monto.');
    L.push('    Si MARGEN_CONFIG_DESDE_BASE esta encendido, despues de corregir la planilla hay');
    L.push('    que correr margenConfigMudanza() para que la base vea el cambio.');
  }
  L.push('══════════════════════════════════════════════════════════════════════');
  var s = L.join('\n');
  Logger.log(s);
  try { _cbInforme_(L); } catch (e) {}
  return s;
}

/** SOLO LEE: en que estado esta el interruptor (para el tablero y para dudas). */
function adsAtribucionEstado() {
  var v = '';
  try { v = String(getProp(ADS_ATRIB_PROP, '') || '').trim(); } catch (e) {}
  var s = 'ADS_ATRIBUIR_POR_COMPRA = ' + (v || '(vacio)') +
          (String(v).toUpperCase() === 'SI'
            ? ' · ENCENDIDO: la inversion de Ads va al producto comprado DE LA MISMA FAMILIA que la campaña'
            : ' · apagado: la inversion se pega por el nombre de la campaña, como siempre');
  Logger.log(s);
  return s;
}


// ── El conductor: corre el motor; si le falta algo de la base, lo baja (en paralelo) y vuelve a correr ──
async function __bajar(f) {
  var tok = await _sbSesionAsegurar(); if (!tok) throw new Error('margen_local: sin sesion');
  var h = { apikey: SB_ANON, Authorization: 'Bearer ' + tok };
  if (f.perfil) h['Accept-Profile'] = f.perfil;
  // costos y configuracion de Margen no se leen tabla por tabla (son privados): van por public.margen_fuente,
  // que devuelve LO MISMO que la tabla y solo a Admin/Marketing. El paginado se respeta: pagina > 0 = vacia.
  var mF = /^(cost_hoja|margen_config)\?/.exec(f.ruta);
  if (mF) {
    var off = /[?&]offset=(\d+)/.exec(f.ruta), pes = /[?&]pestana=eq\.([^&]+)/.exec(f.ruta), cuerpo = '[]', st = 200;
    if (!(off && +off[1] > 0)) {
      var rr = await fetch(SB_URL + '/rest/v1/rpc/margen_fuente', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, h),
        body: JSON.stringify({ p_tabla: mF[1], p_pestana: pes ? decodeURIComponent(pes[1]) : null }) });
      st = rr.status; cuerpo = await rr.text();
    }
    __RUTAS[f.k] = { code: st, body: cuerpo };
    return;
  }
  var r = await fetch(SB_URL + '/rest/v1/' + f.ruta, { headers: h });
  var body = await r.text();
  /* 27-oct · canal del Margen sobre erp.v_compras_ads: wsp = igual que siempre · web = solo PAGINA WEB · todos = las dos */
  if (__MG_CANAL !== 'wsp' && r.status >= 200 && r.status < 300 && /^v_compras_ads\?/.test(f.ruta)) {
    try { var _a = JSON.parse(body || '[]');
      if (Array.isArray(_a)) { var _esW = function (x) { return String(x.canal || '').trim().toUpperCase() === 'PAGINA WEB'; };
        if (__MG_CANAL === 'web') _a = _a.filter(_esW);
        _a.forEach(function (x) { if (_esW(x)) x.canal = 'WEB'; });
        body = JSON.stringify(_a); } } catch (_) {}
  }
  __RUTAS[f.k] = { code: r.status, body: body, getResponseCode: function () { return r.status; }, getContentText: function () { return body; } };
}
// 27-oct (Pablo) · CANAL del Margen: 'wsp' (WhatsApp, como siempre) · 'web' (Página web) · 'todos'. Lo fija margenLocalCalcular(desde, hasta, canal).
var __MG_CANAL = 'wsp';
var __MG_INV_FILAS = [];   // 28-oct · gasto por ANUNCIO del canal (para repartirlo entre lo que ese anuncio vendió)
// 26-oct · inversión automática: gasto de Meta del rango, por anuncio → producto (2.ª parte del nombre: «Con Catalina» = CONJUNTO CATALINA).
// El Margen cuenta solo ventas de WhatsApp: los anuncios de la WEB no entran (se informan aparte). Sin producto reconocible → VARIOS (no atribuible).
var __MG_ABR = { PAN:'PANTALON', BLA:'BLAZER', BLU:'BLUSA', CON:'CONJUNTO', ABR:'ABRIGO', GAB:'GABARDINA', VES:'VESTIDO', CHA:'CHALECO', TOP:'TOP', FAL:'FALDA',
                 COR:'CORREA', BIK:'BIKINI', TRI:'TRIKINI', CAM:'CAMISA', SHO:'SHORT', ENT:'ENTERIZO', JUM:'JUMPSUIT', POL:'POLO', CAS:'CASACA', CHO:'CHOMPA' };
function __mgNorm(t) { return String(t || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(); }
function __mgProdDeAnuncio(a) {
  var p = String(a || '').replace(/^\D*?🆕\s*/, '').split('/'); if (p.length < 2) return null;
  var seg = __mgNorm(p[1]).split(' '), k = seg[0] || '', t = __MG_ABR[k] || __MG_ABR[k.slice(0, 3)]; if (!t) return null;
  var mod = seg.slice(1).join(' '); return mod ? t + ' ' + mod : (t === 'TOP' ? 'TOPS' : t + 'S');
}
function __mgEsWeb(x) { var s = __mgNorm((x.campana || '') + ' ' + (x.anuncio || '')); return !/(WHATSAPP|WHASTAPP|WATSAPP|WSP|WPP|MENSAJE)/.test(s) && /(PAGINA WEB|WEB|SHOPIFY|PURCHASE|CATALOGO)/.test(s); }
async function __mgInvAutoCargar(desde, hasta) {
  var tok = await _sbSesionAsegurar(); if (!tok) throw new Error('sin sesión');
  var r = await fetch(SB_URL + '/rest/v1/rpc/margen_inversion_auto', { method: 'POST', headers: { apikey: SB_ANON, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_desde: desde, p_hasta: hasta }) });
  if (!r.ok) throw new Error('margen_inversion_auto ' + r.status);
  __MG_INV_FILAS = [];
  var j = await r.json(), F = (j && j.filas) || [], acc = {}, info = { fuente: 'Meta (automático)', total: 0, web: 0, sinProducto: 0, ultimo: j && j.ultimo, n: F.length };
  F.forEach(function (x) { var g = +x.gasto || 0; if (!(g > 0)) return;
    var _w = __mgEsWeb(x);   /* 27-oct · por canal: wsp = sin anuncios web · web = solo anuncios web · todos = todo */
    if (__MG_CANAL === 'wsp' && _w) { info.web += g; return; }
    if (__MG_CANAL === 'web' && !_w) { info.wsp = (info.wsp || 0) + g; return; }
    var prod = __mgProdDeAnuncio(x.anuncio); if (!prod) { prod = 'VARIOS'; info.sinProducto += g; }
    __MG_INV_FILAS.push({ anuncio: String(x.anuncio || '').trim(), gasto: g, prod: prod });
    acc[prod] = (acc[prod] || 0) + g; info.total += g; });
  var mes = String(desde).slice(0, 7);
  info.canal = __MG_CANAL; window.__mgInvInfo = info;
  return Object.keys(acc).map(function (k) { return { Mes: mes, Producto: k, InversionSoles: Math.round(acc[k] * 100) / 100 }; });
}
/* 27-oct · una cuenta a la vez: Escalamiento (iframe de Marketing) y 💰 Margen pueden pedirla juntas y comparten __RUTAS/__MG_CANAL */
var __mgCola = Promise.resolve();
window.margenLocalCalcular = function (desde, hasta, canal) {
  var p = __mgCola.then(function () { return __mgCalcular(desde, hasta, canal); });
  __mgCola = p.catch(function () {});
  return p;
};
/* 28-oct (Pablo aprobó «la forma de los referentes») · EL GASTO SIGUE A LO QUE SE VENDIÓ.
   Antes: la venta se contaba en el producto comprado y el gasto en el producto del NOMBRE del anuncio → el Conjunto Mirella
   (comprado entrando por anuncios del pantalón y del blazer) salía con CPA S/ 13. Ahora el gasto de CADA anuncio se reparte
   entre los productos de los pedidos que ESE anuncio trajo, según lo que pesó cada pedido en soles (como Triple Whale:
   «Ad spend gets attributed to each product in proportion to its share»). Si el anuncio no vendió nada en el período, su gasto
   se queda en su producto (o en VARIOS si su nombre no dice producto). Las ventas, ingresos, costos y el total de inversión
   NO cambian: solo dónde cae cada sol de inversión. */
function __mgRepartir(res) {
  if (!res || !Array.isArray(res.productos) || !__MG_INV_FILAS.length || !_MARGEN_ULTIMAS_FILAS) return { aplicado: false, motivo: 'sin datos' };
  var cfgP = _configProductos_(), activos = cfgP.activos, conjuntos = cfgP.conjuntos;
  var adDe = {};   // nro → nombre del anuncio (de erp.v_compras_ads, ya filtrada por canal)
  Object.keys(__RUTAS).forEach(function (k) { if (k.indexOf('GET v_compras_ads?') !== 0) return;
    try { (JSON.parse(__RUTAS[k].body || '[]') || []).forEach(function (x) { var n = String(x.numero != null ? x.numero : '').trim(); if (n && x.ad_name) adDe[n] = String(x.ad_name).trim(); }); } catch (_) {} });
  var vivos = {}; res.productos.forEach(function (r) { if (r.Ventas > 0) vivos[r.Producto] = r; });
  var por = {}; _MARGEN_ULTIMAS_FILAS.forEach(function (f) { var n = String(f.NroPedido).trim(), pr = String(f.Prenda || '').trim().toUpperCase(); if (pr.indexOf('CAMBIO') === 0) return; (por[n] = por[n] || []).push(f); });
  var ped = {};   // nro → { prod principal (MISMA regla que el motor), ingreso }
  Object.keys(por).forEach(function (n) {
    var L = por[n], prods = [], lpp = {};
    L.forEach(function (l) { var b = _productoBase_(l.Prenda, activos); if (!b) return; prods.push(b); (lpp[b] = lpp[b] || []).push(l); });
    prods = _aplicarConjuntos_(prods, conjuntos);
    if (!prods.length) prods = ['OTROS (SIN PRODUCTO)'];
    var mej = prods[0], mv = -1;
    if (prods.length > 1) prods.forEach(function (pp) { var ls = lpp[pp], v = ls ? ls.reduce(function (a, l) { return a + _toFloat_(l.PrecioUnit); }, 0) : Infinity; if (v > mv) { mv = v; mej = pp; } });
    if (!vivos[mej]) return;   // el motor no contó este pedido en el período
    ped[n] = { prod: mej, ing: L.reduce(function (a, l) { return a + _toFloat_(l.PrecioUnit); }, 0) };
  });
  var porAd = {}; Object.keys(ped).forEach(function (n) { var a = adDe[n]; if (a) (porAd[a] = porAd[a] || []).push(n); });
  var inv = {}, propia = {}, atrib = {}, repartido = 0, quedo = 0;
  __MG_INV_FILAS.forEach(function (x) {
    var os = porAd[x.anuncio] || [], T = os.reduce(function (a, n) { return a + ped[n].ing; }, 0);
    if (!os.length || !(T > 0)) { inv[x.prod] = (inv[x.prod] || 0) + x.gasto; propia[x.prod] = (propia[x.prod] || 0) + x.gasto; quedo += x.gasto; return; }
    os.forEach(function (n) { var p = ped[n].prod, m = x.gasto * ped[n].ing / T; inv[p] = (inv[p] || 0) + m;
      if (p === x.prod) propia[p] = (propia[p] || 0) + m; else atrib[p] = (atrib[p] || 0) + m; });
    repartido += x.gasto;
  });
  var r2 = function (v) { return Math.round(v * 100) / 100; }, idx = {};
  res.productos.forEach(function (r) { idx[r.Producto] = r; });
  Object.keys(inv).forEach(function (p) { if (!idx[p]) { idx[p] = { Producto: p, Ventas: 0, PrecioVentaProm: 0, CostoProm: 0, MargenBrutoPct: 0, InversionMetaAds: 0, CPA: 0, CPAMax: 0, Margen: 0, IngresoTotal: 0, CostoTotal: 0 }; res.productos.push(idx[p]); } });
  res.productos.forEach(function (r) {
    var i = inv[r.Producto] || 0; r.InversionMetaAds = r2(i); r.InversionPropia = r2(propia[r.Producto] || 0); r.InversionAtribuida = r2(atrib[r.Producto] || 0);
    r.CPA = r.Ventas ? r2(i / r.Ventas) : 0; r.Margen = r2((r.CPAMax || 0) - r.CPA);
  });
  res.productos = res.productos.filter(function (r) { return r.Ventas > 0 || r.InversionMetaAds > 0; });
  var bal = { total: 0, conVentas: 0, sinVentas: 0, noAtribuido: 0, detalleSinVentas: [], detalleNoAtribuido: [] };
  res.productos.forEach(function (r) { var m = r.InversionMetaAds; bal.total += m; delete r.BaldeInversion;
    if (r.Ventas > 0) { r.BaldeInversion = 'CON_VENTAS'; bal.conVentas += m; return; }
    if (_margenEsProductoReal_(r.Producto, activos, conjuntos)) { r.BaldeInversion = 'PRODUCTO_SIN_VENTAS'; if (m > 0) { bal.sinVentas += m; bal.detalleSinVentas.push({ nombre: r.Producto, monto: r2(m) }); } return; }
    r.BaldeInversion = 'NO_ATRIBUIBLE'; if (m > 0) { bal.noAtribuido += m; bal.detalleNoAtribuido.push({ nombre: r.Producto, monto: r2(m) }); } });
  bal.detalleSinVentas.sort(function (a, b) { return b.monto - a.monto; }); bal.detalleNoAtribuido.sort(function (a, b) { return b.monto - a.monto; });
  ['total', 'conVentas', 'sinVentas', 'noAtribuido'].forEach(function (k) { bal[k] = r2(bal[k]); });
  res.inversionBaldes = bal;
  res.productos.sort(function (a, b) { return b.Ventas - a.Ventas; });
  var conAd = Object.keys(ped).filter(function (n) { return adDe[n]; }).length;
  return { aplicado: true, repartido: r2(repartido), seQuedo: r2(quedo), pedidos: Object.keys(ped).length, pedidosConAnuncio: conAd };
}
async function __mgCalcular(desde, hasta, canal) {
  var t0 = Date.now(), viajes = 0;
  __MG_CANAL = (canal === 'web' || canal === 'todos') ? canal : 'wsp';
  /* la lista de la vista se guarda por fechas (_MRGV_MEMO): con canales distintos hay que pedirla de nuevo en cada cuenta */
  try { if (typeof _MRGV_MEMO === 'object' && _MRGV_MEMO) Object.keys(_MRGV_MEMO).forEach(function (k) { delete _MRGV_MEMO[k]; }); } catch (_) {}
  __RUTAS = {};
  window.__mgInvAuto = null; window.__mgInvInfo = null;
  try { window.__mgInvAuto = await __mgInvAutoCargar(desde, hasta); } catch (e) { window.__mgInvInfo = { fuente: 'planilla MetaAdsInversion', error: String(e && e.message || e) }; }
  if (typeof _productosListarRapido === 'function') { __PRODUCTOS = await _productosListarRapido(); }
  if (!Array.isArray(__PRODUCTOS) || !__PRODUCTOS.length) throw new Error('margen_local: la lista de productos no vino');
  for (var vuelta = 0; vuelta < 15; vuelta++) {
    __FALTAN = [];
    var res = null, err = null;
    try { res = margenCalcular(desde, hasta); } catch (e) { err = e; }
    if (!__FALTAN.length) {
      if (err) { try { window.__mlRutas = Object.keys(__RUTAS).map(function (k) { return __RUTAS[k].code + ' ' + k.slice(0, 90); }); } catch (_) {} throw err; }
      res.__local = { ms: Date.now() - t0, vueltas: vuelta + 1, viajes: viajes, inversion: window.__mgInvInfo, canal: __MG_CANAL };
      try { res.__local.reparto = __mgRepartir(res); } catch (eR) { res.__local.reparto = { error: String(eR && eR.message || eR) }; }
      try { window.__mlRutas = Object.keys(__RUTAS).map(function (k) { return __RUTAS[k].code + ' ' + k.slice(0, 90); }); } catch (_) {}
      return res;
    }
    var vistos = {}, pedir = __FALTAN.filter(function (f) { if (vistos[f.k]) return false; vistos[f.k] = 1; return true; });
    viajes += pedir.length;
    await Promise.all(pedir.map(__bajar));
  }
  throw new Error('margen_local: demasiadas vueltas');
}

})();
