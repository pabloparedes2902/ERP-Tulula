/* GENERADO por herramientas/generar_cuadre_local.js — NO editar a mano. */
(function () {
// ── Lo que en Apps Script da Google y en el navegador no existe (mismo comportamiento, sin servidor) ──
var __RUTAS = {}, __FALTAN = [], __DRIVE = null, __PROPS = {}, __SALIDA = {};
var Logger = { log: function () {} };
function getProp(k, d) { return Object.prototype.hasOwnProperty.call(__PROPS, k) ? __PROPS[k] : d; }
function setProp() {}
var CacheService = { getScriptCache: function () { return { get: function () { return null; }, put: function () {}, remove: function () {}, getAll: function () { return {}; }, putAll: function () {} }; } };
var SpreadsheetApp = { openById: function () { throw new Error('cuadre_local: sin planillas en el navegador'); },
                       getActiveSpreadsheet: function () { throw new Error('cuadre_local: sin planillas en el navegador'); } };
var Utilities = {
  formatDate: function (d, tz, fmt) {
    var p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return String(fmt).replace(/yyyy|MM|dd|HH|H|mm|ss/g, function (t) {
      return t === 'yyyy' ? p.year : t === 'MM' ? p.month : t === 'dd' ? p.day : t === 'HH' ? p.hour : t === 'H' ? String(parseInt(p.hour, 10)) : t === 'mm' ? p.minute : p.second;
    });
  }
};
/** El Drive «Ing» sale de la copia en la base (public.drive_ing), armado igual que getValues(): fila N en la posición N-1. */
function _planillaSoloLectura_() {
  return { getSheetByName: function (n) {
    if (n !== 'Ing' || !__DRIVE) throw new Error('cuadre_local: solo la hoja Ing (copia de la base)');
    return { getDataRange: function () { return { getValues: function () { return __DRIVE; } }; } };
  } };
}
/** Homologaciones: mismas filas que el servidor lee de la base (tabla homologaciones, row_json en orden). */
function mudanzaFilas(nombre) {
  if (nombre !== 'homologaciones') return null;
  var out = [];
  for (var off = 0, v = 0; v < 100; v++, off += 1000) {
    var r = _sbFetch_('GET', 'homologaciones?select=row_json&order=id.asc&limit=1000&offset=' + off, null, {});
    if (r.code >= 300) return null;
    var a = JSON.parse(r.body || '[]'); if (!a.length) break;
    a.forEach(function (x) { if (x && x.row_json) out.push(x.row_json); });
  }
  return out;
}
/** _sbFetch_ del servidor, pero SÍNCRONO sobre lo ya bajado. Lo que falta se anota y se baja afuera (ver el pie).
 *  Escrituras: NUNCA desde el navegador; la foto del emparejador se guarda en __SALIDA para la pantalla. */
function _sbFetch_(metodo, ruta, cuerpo, hdr) {
  if (metodo !== 'GET') {
    if (/^rpc\/espejo_cache_set/.test(ruta) && cuerpo && cuerpo.p_clave) __SALIDA[cuerpo.p_clave] = cuerpo.p_datos;
    return { code: 200, body: '[]' };
  }
  var perfil = (hdr && hdr['Accept-Profile']) || '';
  var k = metodo + ' ' + ruta + (perfil ? ' @' + perfil : '');
  if (__RUTAS[k]) return __RUTAS[k];
  __FALTAN.push({ k: k, ruta: ruta, perfil: perfil });
  throw new Error('__CUADRE_LOCAL_FALTA__');
}


// ── EspejoDatos.gs · _libroHaySeq_
function _libroHaySeq_(toks, sub) {
  if (!sub.length || sub.length > toks.length) return false;
  for (var i = 0; i + sub.length <= toks.length; i++) {
    var ok = true;
    for (var j = 0; j < sub.length; j++) { if (toks[i + j] !== sub[j]) { ok = false; break; } }
    if (ok) return true;
  }
  return false;
}

// ── EspejoDatos.gs · _LIBRO_ACCESORIO
var _LIBRO_ACCESORIO = /^(CORREA|COLLAR|ARETE|ANILLO|PULSERA|CADENA)\b/;

// ── EspejoDatos.gs · _LIBRO_TSTD
var _LIBRO_TSTD = ['XS','S','M','L','XL','2XL','3XL'];

// ── EspejoDatos.gs · _LIBRO_IDX
var _LIBRO_IDX = null;

// ── EspejoDatos.gs · _libroLeer_
function _libroLeer_() {
  var out = {}, off = 0, vueltas = 0;
  while (vueltas < 50) {
    vueltas++;
    var r = _sbFetch_('GET', 'stock_saldos?select=prenda,diseno,color,talla,cat,conf,ventas,fallas&order=prenda.asc,diseno.asc,color.asc,talla.asc&limit=1000&offset=' + off, null, {});
    if (r.code >= 300) throw new Error('stock_saldos HTTP ' + r.code + ' ' + String(r.body).slice(0, 200));
    var arr = JSON.parse(r.body || '[]');
    if (!arr.length) break;
    arr.forEach(function (x) {
      var k = x.prenda + '|' + x.diseno + '|' + x.color;
      if (!out[k]) out[k] = { cat: x.cat || '', tallas: {} };
      out[k].tallas[x.talla] = { conf: (x.conf === null ? null : x.conf), v: x.ventas || 0, fa: (x.fallas === null ? null : x.fallas) };
    });
    off += arr.length;
  }
  return out;
}

// ── EspejoDatos.gs · _libroIndice_
function _libroIndice_() {
  if (_LIBRO_IDX) return _LIBRO_IDX;
  var libro = _libroLeer_();
  var _tok = function (s) { return vocCanon(s).split(' ').filter(Boolean); };
  var combos = [], byKey = {};
  Object.keys(libro).forEach(function (k) {
    var p = k.split('|');
    var c = { key: k, pT: _tok(p[0]), dT: _tok(p[1]), cT: _tok(p[2]) };
    c.peso = 0;
    var tt = libro[k].tallas;
    Object.keys(tt).forEach(function (t2) {
      var x = tt[t2];
      c.peso += Math.max(x.conf || 0, 0) + (x.v || 0) + Math.max(x.fa || 0, 0);
    });
    c.spec = c.pT.length + c.dT.length + c.cT.length;
    combos.push(c);
    byKey[k] = 1;
  });
  // DESEMPATE (28-ago): dos SKUs pueden colapsar al MISMO nombre despues de vocCanon
  // (ej. BLUSA|TOSCANA|TOFEE y |TOFFEE, o BERMUDAS|MALVA y SHORT|MALVA). Ahi los dos
  // combos empatan en especificidad y el ganador lo decidia el ORDEN de la lista, que
  // no es el mismo en los dos caminos. Regla explicita: gana el SKU CON HISTORIA REAL
  // (mas confeccion + ventas + fallas). Tercer criterio alfabetico para que sea 100%
  // determinista: el mismo texto da siempre el mismo SKU.
  combos.sort(function (a, b) {
    if (b.spec !== a.spec) return b.spec - a.spec;
    if (b.peso !== a.peso) return b.peso - a.peso;
    return a.key < b.key ? -1 : (a.key > b.key ? 1 : 0);
  });
  _LIBRO_IDX = { combos: combos, byKey: byKey, memo: {}, libro: libro };
  return _LIBRO_IDX;
}

// ── EspejoDatos.gs · libroResolverPrenda
function libroResolverPrenda(texto) {
  var idx = _libroIndice_();
  var prdNorm = vocCanon(texto);
  if (!prdNorm || prdNorm === '_PAGO_') return null;
  var toks = prdNorm.split(' ');
  // Talla = ultima palabra, mapeada al estandar. Accesorio sin talla -> M (regla Pablo).
  var tal = TMAP_GLOBAL[toks[toks.length - 1]] || toks[toks.length - 1];
  if (_LIBRO_TSTD.indexOf(tal) < 0) {
    if (_LIBRO_ACCESORIO.test(prdNorm)) tal = 'M';
    else return null;
  }
  var key = idx.memo[prdNorm];
  if (key === undefined) {
    // 1) Alias explicito: nombre del pedido (sin talla) -> SKU canonico.
    var aliasK = '';
    try {
      if (typeof ALIAS_VENTAS !== 'undefined') {
        var _ak = ALIAS_VENTAS[_aliasNormVenta(toks.slice(0, -1).join(' '))];
        if (_ak && idx.byKey[_ak]) aliasK = _ak;
      }
    } catch (e) {}
    if (aliasK) key = aliasK;
    else {
      // 2) Combo cuyo prenda, diseño Y color aparezcan como secuencia de palabras.
      var hit = '';
      for (var i = 0; i < idx.combos.length; i++) {
        var c = idx.combos[i];
        if (_libroHaySeq_(toks, c.pT) && _libroHaySeq_(toks, c.dT) && _libroHaySeq_(toks, c.cT)) { hit = c.key; break; }
      }
      key = hit;
    }
    idx.memo[prdNorm] = key;
  }
  if (!key) return null;
  var kp = key.split('|');
  return { p: kp[0], d: kp[1], c: kp[2], t: tal };
}

// ── EspejoDatos.gs · _libroCorte_
function _libroCorte_() {
  var raw = '';
  try { raw = String(getProp('STOCK_CUTOFF', '') || ''); } catch (e) {}
  if (!raw) return { ms: 0, diaMs: 0, hay: false };
  var d = new Date(/T/.test(raw) ? raw : (raw + 'T00:00:00-05:00'));
  var dia = new Date(Utilities.formatDate(d, 'America/Lima', 'yyyy-MM-dd') + 'T00:00:00-05:00');
  return { ms: d.getTime(), diaMs: dia.getTime(), hay: true };
}

// ── Code.js · STK_DRIVE_SS_ID
var STK_DRIVE_SS_ID = '1BOlXtGXCOaMThpIid2HMalNStkPdXMse-xmLblHFFao';

// ── Tallas.gs · TMAP_GLOBAL
var TMAP_GLOBAL = {
  // 27-set-2026 · E · MISMA COLUMNA QUE EL DRIVE (Pablo: "S/M es UNA sola talla").
  // Medido en el Drive Stk: BAGGY, CALA y FAJA ponen S/M en la columna S, M/L en M y
  // L/XL en L. Antes el ERP los corria una columna (S/M->M, M/L->L, L/XL->XL) y por eso
  // FAJA mostraba M y XL que no existen. REVERSA: volver a 'M','L','XL'.
  'S/M': 'S', 'M/L': 'M', 'L/XL': 'L',
  'C': 'M', 'G': 'XL', 'U': 'M',
  'STD': 'M', 'ESTANDAR': 'M', 'ESTÁNDAR': 'M',
  'XXL': '2XL', 'XXXL': '3XL',
};

// ── AliasVentas.gs · ALIAS_VENTAS
var ALIAS_VENTAS = {
  "PANTALON WIDE LEG NEGRO": "PANTALON|WIDE_LEG|NEGRO",
  // NOTA (jun-2026): tras correr fixSkuToscanaVino_APLICAR() el SKU pasa a ser
  // "BLUSA|TOSCANA|VINO". Este alias queda auto-bypassed (el guard `&& confMap[_ak]`
  // lo ignora al no existir VINO_RAYAS) y la venta matchea directo contra VINO por
  // tokens. Se conserva para no crear ningún hueco mientras se aplica el fix.
  "BLUSA TOSCANA VINO": "BLUSA|TOSCANA|VINO_RAYAS",
  "BLUSA POLKA OSCURO": "BLUSA|POLKA|NEGRO",
  "BLUSA IPANEMA BLANCO": "BLUSA|IPANEMA|PERLA",
  "FALDA KENYA NEGRO": "FALDA|KENYA|NEGRO",
  "PANTALON PATRICK NEGRO": "PANTALON|PATRICK|NEGRO_RAYAS",
  // 27-set-2026 (Pablo): BEIGE OSCURO y BEIGE CLARO son tonos DISTINTOS de MIRELLA. No se juntan.
  // "PANTALON MIRELLA BEIGE OSCURO": "PANTALON|MIRELLA|BEIGE_CLARO",
  "PANTALON WIDE LEG AZUL": "PANTALON|WIDE_LEG|AZUL",
  "PANTALON JOGGER NUDE": "PANTALON|JOGGER|NUDE",
  "VESTIDO VERONA VINO": "VESTIDO|VERONA|VINO",
  "BLUSA AMELIA BLANCO": "BLUSA|AMELIA|BLANCO",
  "BIKINI GENOVA LADRILLO BOTTOM": "BIKINI|GENOVA|LADRILLO-B",
  "PANTALON WIDE LEG CAMEL": "PANTALON|WIDE_LEG|CAMEL",
  "BIKINI GENOVA VERDE BOTTOM": "BIKINI|GENOVA|VERDE-B",
  "BIKINI GENOVA VERDE TOP": "BIKINI|GENOVA|VERDE-T",
  "BIKINI GENOVA LADRILLO TOP": "BIKINI|GENOVA|LADRILLO-T",
  "BLUSA AMELIA LILA": "BLUSA|AMELIA|LILA",
  "VESTIDO EMILIA NEGRO": "VESTIDO BLAZER|EMILIA|NEGRO",
  "BODY VALERIA NEGRO": "BODY|VALERIA|NEGRO",
  "BIKINI MODELADOR BEIGE": "MODELADOR|ENTERIZO|BEIGE",
  "BIKINI MILAN ZEBRA BOTTOM": "BIKINI|MILAN|ZEBRA-B",
  "BODY VALERIA LADRILLO": "BODY|VALERIA|LADRILLO",
  "BODY VALERIA CAMEL": "BODY|VALERIA|CAMEL",
  "BIKINI MILAN VERDE BOTTOM": "BIKINI|MILAN|VERDE-B",
  "BIKINI MILAN ZEBRA TOP": "BIKINI|MILAN|ZEBRA-T",
  "BIKINI MILAN VERDE TOP": "BIKINI|MILAN|VERDE-T",
  "BIKINI MODELADOR NEGRO": "MODELADOR|ENTERIZO|NEGRO",
  "VESTIDO EMILIA BEIGE": "VESTIDO BLAZER|EMILIA|BEIGE",
  "VESTIDO PAULA AZUL": "VESTIDO|PAULA|AZUL",
  "BODY EMMA FUCSIA": "BODY|EMMA|FUCSIA",
  "VESTIDO PAULA CORAL": "VESTIDO|PAULA|CORAL",
  "BODY SOFI BEIGE": "BODY|SOFI|CAMEL",
  "BIKINI MILAN FUCSIA BOTTOM": "BIKINI|MILAN|FUCSIA-B",
  "BODY EMMA NEGRO": "BODY|EMMA|NEGRO",
  "BODY EMMA LILA": "BODY|EMMA|LILA",
  "ANILLO CLEOPATRA DORADO": "ANILLO|CLEOPATRA|AMARILLO",
  "BIKINI MILAN FUCSIA TOP": "BIKINI|MILAN|FUCSIA-T",
  "BLUSA AMELIA MORADO": "BLUSA|AMELIA|MORADO",
  "TRIKINI VENECIA NARANJA": "TRIKINI|VENECIA|FUCSIA",
  "BODY EMMA AZUL": "BODY|EMMA|AZUL",
  "CORREA CLEOPATRA BLANCA": "CORREA|CLEOPATRA|PERLA",
  "BODY ALBA HUESO": "BODY|ALBA|PERLA",
  "BODY EMMA VINO": "BODY|EMMA|VINO",
  "PANTALON BAGGY ROJO": "PANTALON|BAGGY|ROJO",
  "BODY VALERIA LILA": "BODY|VALERIA|LILA",
  "BLUSA CALA NARANJA": "BLUSA|CALA|NARANJA",
  "TOP FERNANDA CREMA": "TOP|FERNANDA|NUDE",
  "BODY SOFI MORADO": "BODY|SOFI|LILA",
  "BODY FERNANDA NEGRO": "TOP|FERNANDA|NEGRO",
  "BIKINI GENOVA LADRILLO": "BIKINI|GENOVA|LADRILLO-T",
  "PANTALON CLASSIC VERDE BOTELLA": "PANTALON|CLASSIC|VERDE",
  "PANTALON FORMAL PLOMO NEGRO": "PANTALON|FORMAL|PLOMO_OSCURO",
  "TOP POLKA AZUL MARINO": "TOP|POLKA|AZUL",
  "VESTIDO VERONA AZUL MARINO": "VESTIDO|VERONA|AZUL",
  "BLUSA CORBAIN PERLA": "BLUSA|CORBATIN|PERLA",
  "PANTALON NAVIGARA MORADO": "PANTALON|NAVIGATA|MORADO",
  "FALDA CADIZ BLANCA": "FALDA|CADIZ|PERLA_SUBLIMADO",
  "CHALECO NAVIGATA LILA": "CHALECO|NAVIGATA|MORADO",
  "BODY EMMA EMMA": "BODY|EMMA|LILA",
  "BLUSA GRANDA BEIGE": "BLUSA|GRANADA|BEIGE",
  "TOP MIRANDO AZULINO": "TOP|MIRANDA|AZULINO",
  "TOP FLORENCIA PALO ROSA": "TOP|FLORENCIA|PALOROSA",
  "BLUSA SIENA PLOMO": "BLUSA|SIENA|NEGRO",
  "BLUSA SIENA BEIGE": "BLUSA|SIENA|BLANCO",
  "CORREA OVALADA ROJO": "CORREA|CIRCULAR|ROJO",
  "VESTIDO PAULA FUCSIA": "VESTIDO|PAULA|FUCSIA",
  "BODY EMMA FUCISA": "BODY|EMMA|FUCSIA",
  "ENTERIZO BEIGE": "MODELADOR|ENTERIZO|BEIGE",
  "ROPA INTERIOR ESTANDAR NEGRO": "INTERIOR|ESTANDAR|NEGRO",
  "CORREA ATENAS CAMEL": "CORREA|ATENAS|PRINT",
  "CORREA CATANIA PLOMO": "CORREA|CATANIA|NEGRO",
  "ANILLO ATENAS ANILLOS": "ANILLO|ATENAS|DORADO",
  "COLLAR CLEOPATRA COLLAR": "COLLAR|CLEOPATRA|DORADO",
  "PULSERA CLEOPATRA PULSERA": "PULSERA|CLEOPATRA|DORADO",
  "COLLAR HERA COLLAR": "COLLAR|HERA|DORADO",
  "COLLAR ISIS COLLAR": "COLLAR|ISIS|DORADO",
  "BLAZER EJECUTIVO ANTONIA BEIGE": "BLAZER|ANTONIA|BEIGE",
  "BLAZER MADONNA ARENA": "BLAZER|MADONNA|ARENA RAYAS",
  "BLAZER MADONNA AZUL": "BLAZER|MADONNA|AZUL RAYAS",
  "BLUSA TOSCANA TOFFEE": "BLUSA|TOSCANA|TOFEE",
  "GABARDINA EMMA PLOMO": "GABARDINA|EMMA|PLOMO OSCURO",
  "PANTALON MIRELLA VERDE OLIVA": "PANTALON|MIRELLA|VERDE",
  "PANTALON CORPORATIVO CATALAN MOCA": "PANTALON|CATALAN|MOCA",
  "PAÑUELO SEDA BEIGE": "PAÑUELO|SEDA|BEIGE",
  "PAÑUELO SEDA VERDE": "PAÑUELO|SEDA|VERDE",
  "FALDA LAPIZ CADIZ CREMA": "FALDA|CADIZ|PERLA SUBLIMADO",
  "TOP OLIVIA CUELLO CUADRADO MALVA": "TOP|OLIVIA|UVA PASTEL",
  // 27-set-2026 (Pablo): OLIVIA MALVA = UVA PASTEL · OLIVIA ROSADO = ROSA. Antes no resolvian y esas ventas no bajaban stock.
  "TOP OLIVIA MALVA": "TOP|OLIVIA|UVA PASTEL",
  "TOP OLIVIA ROSADO": "TOP|OLIVIA|ROSA",
  // 2-oct-2026 (Pablo): ALMA ROSADO = ROSA · ANTONIA BEIGE CLARO = BEIGE. (CONJUNTO GRECIA AZUL = blazer + pantalon AZUL NOCHE: solo en erp.alias_ventas, aca no se puede 1->2)
  "BLUSA ALMA ROSADO": "BLUSA|ALMA|ROSA",
  "BLAZER ANTONIA BEIGE CLARO": "BLAZER|ANTONIA|BEIGE",
  // 4-oct-2026 (Pablo: "que el ERP lo lea bien, sin tocar el Drive"). Textos del Drive (hoja Ing)
  // que no estan en el catalogo: BERMUDAS MALVA = SHORT MALVA · COLETS COLETS = COLETS PACK.
  // (Las CORREA ... C del Drive ya se leen igual que ... U: C y U son la misma talla en accesorios.)
  "BERMUDAS MALVA NEGRO": "SHORT|MALVA|NEGRO",
  "BERMUDAS MALVA BEIGE": "SHORT|MALVA|BEIGE",
  "BERMUDAS MALVA VERDE": "SHORT|MALVA|VERDE",
  "COLETS COLETS MARRON": "COLETS|PACK|MARRON",
  // 12-oct-2026 (Pablo): la web manda "Pack de Colets" / variante "Collets" → COLETS PACK MARRON (pedidos 22784 y 22904
  // entraron como "PACK DE COLETS COLLETS" sin homologar: no bajaban stock). Unico color del pack: MARRON.
  "PACK DE COLETS COLLETS": "COLETS|PACK|MARRON",
  "PACK DE COLETS": "COLETS|PACK|MARRON",
};

// ── AliasVentas.gs · _aliasNormVenta
function _aliasNormVenta(s) {
  return String(s || '').toUpperCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Vocabulario.gs · VOC_TYPOS
var VOC_TYPOS = {
  'NEGO': 'NEGRO',
  'TOFEE': 'TOFFEE',
  'INTERIOIR': 'INTERIOR',
  'STANDAR': 'ESTANDAR',
  'EMAI': 'EMAIL',
};

// ── Vocabulario.gs · _VOC_FRASES_
var _VOC_FRASES_ = null;

// ── Vocabulario.gs · _vocBase_
function _vocBase_(s) {
  var t = String(s || '').trim().toUpperCase()
    .replace(/Ñ/g, '\u0001')                                   // proteger la Ñ
    .normalize('NFD').replace(/[̀-ͯ]/g, '')          // fuera tildes de vocales
    .replace(/\u0001/g, 'Ñ')                                   // restaurar la Ñ
    .replace(/_/g, ' ')                                        // guión bajo = espacio
    .replace(/\s+/g, ' ').trim();
  if (!t) return t;
  return t.split(' ').map(function (tok) { return VOC_TYPOS[tok] || tok; }).join(' ');
}

// ── Vocabulario.gs · _vocFrases_
function _vocFrases_() {
  if (_VOC_FRASES_ !== null) return _VOC_FRASES_;
  _VOC_FRASES_ = [];
  try {
    // 19-set · LA PUERTA. Con la mudanza encendida y la base diciendo
    // EXACTAMENTE lo mismo que la hoja (mismas filas, mismo orden, mismo texto),
    // se usa la base. Cualquier diferencia → la hoja, como siempre.
    var d = null;
    var deLaBase = (typeof mudanzaFilas === 'function') ? mudanzaFilas('homologaciones') : null;
    if (deLaBase) {
      d = [['ANTES (como esta escrito)', 'DESPUES (nombre oficial)']];
      for (var b = 0; b < deLaBase.length; b++)
        d.push([deLaBase[b]['ANTES (como esta escrito)'], deLaBase[b]['DESPUES (nombre oficial)']]);
    } else {
      var sh = (typeof _dmLibro_ === 'function' ? _dmLibro_('Homologaciones') : SpreadsheetApp.getActiveSpreadsheet()).getSheetByName('Homologaciones');
      if (sh && sh.getLastRow() > 1) d = sh.getDataRange().getValues();
    }
    if (d && d.length > 1) {
      for (var i = 1; i < d.length; i++) {
        var rawA = String(d[i][0] || '').trim();
        var exacta = rawA.charAt(0) === '=';               // '=NOMBRE' → solo si el texto COMPLETO coincide
        var a = _vocBase_(exacta ? rawA.slice(1) : rawA), b = _vocBase_(d[i][1]);
        if (a && b && a !== b) _VOC_FRASES_.push({ a: ' ' + a + ' ', b: ' ' + b + ' ', ex: exacta, aTxt: a, bTxt: b });
      }
      _VOC_FRASES_.sort(function (x, y) { return y.a.length - x.a.length; }); // mas especificas primero
    }
  } catch (e) {}
  return _VOC_FRASES_;
}

// ── Vocabulario.gs · vocCanon
function vocCanon(s) {
  var t = _vocBase_(s);
  if (!t) return t;
  var fr = _vocFrases_();
  if (fr.length) {
    for (var e = 0; e < fr.length; e++) { if (fr[e].ex && t === fr[e].aTxt) { t = fr[e].bTxt; break; } } // exactas: el texto completo
    var pad = ' ' + t + ' ';
    for (var i = 0; i < fr.length; i++) { if (!fr[i].ex && pad.indexOf(fr[i].a) >= 0) pad = pad.split(fr[i].a).join(fr[i].b); }
    t = pad.replace(/\s+/g, ' ').trim();
  }
  // AUTOREPARACIÓN (14/07): colapsar palabras adyacentes repetidas (RAYAS RAYAS → RAYAS).
  // Hace idempotentes las reglas que agregan palabras y repara daños de pasadas previas.
  t = t.split(' ').filter(function (w, i, arr) { return i === 0 || w !== arr[i - 1]; }).join(' ');
  return t;
}

// ── CuadreMatch.gs · _cmTok_
function _cmTok_(s) {
  return String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 3 && ['DEL', 'DE', 'LAS', 'LOS', 'SRA', 'SRTA'].indexOf(w) < 0; });
}

// ── CuadreMatch.gs · _cmMisma_
function _cmMisma_(a, b) {
  if (a.dni && b.dni && a.dni === b.dni) return 'DNI';
  if (a.cel && b.cel && a.cel === b.cel) return 'CELULAR';
  if (a.nom.length && b.nom.length) {
    var comunes = a.nom.filter(function (w, i) { return a.nom.indexOf(w) === i && b.nom.indexOf(w) >= 0; });
    if (comunes.length >= 2) return 'NOMBRE';   // nombre + un apellido (o dos apellidos), en cualquier orden
  }
  return '';
}

// ── CuadreMatch.gs · _cmErpBase_
function _cmErpBase_(desde) {
  var out = [], off = 0, lim = 1000;
  var sel = 'select=id,nro_pedido,prenda,estado,dni,celular,nombres,fecha_pedido,eliminado,cambio2,yay:row_json-%3E%3EEsYayita';   // -> y >> van codificados (UrlFetch rechaza el > crudo)
  for (var vuelta = 0; vuelta < 60; vuelta++) {
    var r = _sbFetch_('GET', 'pedidos?' + sel + '&fecha_pedido=gte.' + desde + '&prenda=neq._PAGO_&order=id.asc&limit=' + lim + '&offset=' + off, null, {});
    if (r.code >= 300) throw new Error('pedidos HTTP ' + r.code + ' ' + String(r.body).slice(0, 200));
    var L = JSON.parse(r.body || '[]'); out = out.concat(L);
    if (L.length < lim) break; off += lim;
  }
  return out;
}

// ── CuadreMatch.gs · _cmConjuntos_
function _cmConjuntos_() {
  var r = _sbFetch_('GET', 'alias_ventas?select=clave,sku&sku=like.*%3B*', null, { 'Accept-Profile': 'erp' });
  var m = {}; if (r.code >= 300) return m;
  JSON.parse(r.body || '[]').forEach(function (a) { m[_aliasNormVenta(a.clave)] = String(a.sku || '').split(';'); });
  return m;
}

// ── CuadreMatch.gs · _cmPiezas_
function _cmPiezas_(pr, conj) {
  var toks = _aliasNormVenta(pr).split(' '), tal = toks[toks.length - 1], ks = conj && conj[toks.slice(0, -1).join(' ')];
  if (!ks || ks.length < 2) return [pr];
  return ks.map(function (k) { return k.split('|').join(' ') + ' ' + tal; });
}

// ── CuadreMatch.gs · _cmPagados_
function _cmPagados_(nros) {
  var P = {};
  for (var i = 0; i < nros.length; i += 80) {
    var lote = nros.slice(i, i + 80).map(function (n) { return '"' + String(n).replace(/"/g, '') + '"'; }).join(',');
    var r = _sbFetch_('GET', 'pagos?select=nro_pedido,monto,eliminado&nro_pedido=in.(' + encodeURIComponent(lote) + ')&limit=5000', null, {});
    if (r.code >= 300) throw new Error('pagos HTTP ' + r.code);
    JSON.parse(r.body || '[]').forEach(function (p) {
      if (['si', 'true', 't'].indexOf(String(p.eliminado || '').trim().toLowerCase()) >= 0) return;
      P[String(p.nro_pedido)] = (P[String(p.nro_pedido)] || 0) + (parseFloat(p.monto) || 0);
    });
  }
  return P;
}

/** 13-oct-2026 · Conjuntos 1→2 de erp.alias_ventas (clave sin talla → 'P|D|C;P|D|C'). Solo lectura. */
function _cmConjuntos_() {
  var r = _sbFetch_('GET', 'alias_ventas?select=clave,sku&sku=like.*%3B*', null, { 'Accept-Profile': 'erp' });
  var m = {}; if (r.code >= 300) return m;
  JSON.parse(r.body || '[]').forEach(function (a) { m[_aliasNormVenta(a.clave)] = String(a.sku || '').split(';'); });
  return m;
}
/** Texto de una línea → sus piezas ('CONJUNTO GRECIA AZUL M' → ['BLAZER GRECIA AZUL NOCHE M','PANTALON GRECIA AZUL NOCHE M']). */
function _cmPiezas_(pr, conj) {
  var toks = _aliasNormVenta(pr).split(' '), tal = toks[toks.length - 1], ks = conj && conj[toks.slice(0, -1).join(' ')];
  if (!ks || ks.length < 2) return [pr];
  return ks.map(function (k) { return k.split('|').join(' ') + ' ' + tal; });
}


// ── CuadreMatch.gs · cua_13_EMPAREJAR_VENTAS
function cua_13_EMPAREJAR_VENTAS() {
  var t0 = Date.now();
  var corte = _libroCorte_(); var cutMs = corte.hay ? corte.ms : 0;
  var cutDia = cutMs ? Utilities.formatDate(new Date(cutMs), 'America/Lima', 'yyyy-MM-dd') : '0000-00-00';
  // 17-oct (incidencias 235/237): ventana 25 → 45 días. Pedidos de junio a los que se les sumó la prenda
  // y el Drive la anotó en julio (20391 Francesca 20-jun vs Drive 12-jul; 20413 Nelly 26-jun vs 18-jul).
  var parDia = cutMs ? Utilities.formatDate(new Date(cutMs - 45 * 864e5), 'America/Lima', 'yyyy-MM-dd') : cutDia;   // 4-oct
  var num = function (v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? 0 : n; };
  var HOMO = {};   // 4-oct · texto del Drive -> como lo lee el ERP
  var canon = function (s) { var t = (_LIBRO_ACCESORIO.test(s.p) && s.t === 'M') ? 'U' : s.t; return (s.p + ' ' + s.d + ' ' + s.c + ' ' + t).replace(/_/g, ' ').replace(/\s+/g, ' ').trim(); };
  var dia = function (f) {
    if (f instanceof Date) return Utilities.formatDate(f, 'America/Lima', 'yyyy-MM-dd');
    var s = String(f || ''), m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/), m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m2) return m2[1] + '-' + m2[2] + '-' + m2[3];
    if (m) return m[3] + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2);
    return '';
  };
  var dias = function (a, b) { return Math.abs(new Date(a) - new Date(b)) / 864e5; };
  var persona = function (dni, cel, nom) {
    var d = String(dni || '').replace(/\D/g, ''), c = String(cel || '').replace(/\D/g, '').slice(-9);
    return { dni: d.length >= 8 ? d : '', cel: c.length === 9 ? c : '', nom: _cmTok_(nom) };
  };
  var sinResolver = { drive: 0, erp: 0 }, sinResolverTxt = { drive: {}, erp: {} };
  var mk = function (lado, texto, per, f, ref, est) {
    var s = libroResolverPrenda(texto);
    if (!s) {   // 27-set · se anota QUE texto no se reconoce: esas lineas no entran al cruce
      sinResolver[lado]++;
      var tk = String(texto || '').toUpperCase().replace(/\s+/g, ' ').trim().replace(/ (XS|S|M|L|XL|2XL|XXL|3XL|U|S\/M|M\/L|L\/XL|STD)$/, ' <talla>');
      sinResolverTxt[lado][tk] = (sinResolverTxt[lado][tk] || 0) + 1;
      return null;
    }
    if (lado === 'drive') {   // 4-oct · homologacion: solo los textos que el ERP "traduce"
      var tx = String(texto || '').toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim(), cn = canon(s);
      if (tx !== cn) { var hk = tx + '\u0001' + cn; HOMO[hk] = (HOMO[hk] || 0) + 1; }
    }
    return { k: s.p + '|' + s.d + '|' + s.c + '|' + s.t, sku: s.p + '|' + s.d + '|' + s.c, t: s.t, f: f, per: per, ref: ref, est: est, texto: texto, par: null };
  };
  // Drive: TODAS las filas con prenda (asi cuenta la formula de Stk); se guarda el estado
  var D = [], E = [], RET = [], GRP = {};
  var iv = _planillaSoloLectura_(STK_DRIVE_SS_ID).getSheetByName('Ing').getDataRange().getValues();
  for (var i = 1; i < iv.length; i++) {
    var r = iv[i], f = dia(r[20]); if (!f || f < parDia) continue;
    var perR = persona(r[2], r[3], r[1]);
    var gk = (perR.dni || perR.cel || perR.nom.join(' ')) + '|' + f;   // 4-oct · plata de la clienta ese dia
    var g = GRP[gk] || (GRP[gk] = { tot: 0, pag: 0 }); g.tot += num(r[15]) + num(r[16]); g.pag += num(r[18]);
    var camK = '';
    // 27-set (Pablo): columna O "Cambio". Con la talla entre parentesis = la prenda que
    // VOLVIO (el Drive ya no la cuenta). N vacia + O con parentesis = devolucion completa.
    var cam = String(r[14] || '').trim();
    if (/\(/.test(cam)) {
      // 4-oct · una celda puede traer VARIOS cambios seguidos separados por "//"
      // (fila 45818: "PANTALON GRECIA NEGRO (L) // PANTALON ANTONIA BEIGE (M)"): cada uno cuenta.
      cam.split(/\/\/|\s-\s/).forEach(function (parte) {
        if (!/\(/.test(parte)) return;
        var retTxt = parte.replace(/\(\s*([^)]+?)\s*\)/, '$1').replace(/\s+/g, ' ').trim();
        var rs = libroResolverPrenda(retTxt);
        if (rs) { camK = rs.p + '|' + rs.d + '|' + rs.c + '|' + rs.t; RET.push({ k: camK, f: f, per: persona(r[2], r[3], r[1]), nVacio: !String(r[13] || '').trim() }); }
      });
    }
    // Cambio en transito (O SIN parentesis): el Drive cuenta las dos prendas (la nueva en N y la
    // que todavia no vuelve en O). Se suma como una venta mas del Drive. "YAYA: ..." no cuenta.
    if (cam && !/\(/.test(cam) && !/^YAYA/i.test(cam)) {
      var xo = mk('drive', cam, persona(r[2], r[3], r[1]), f, 'Ing fila ' + (i + 1) + ' (cambio en transito) · ' + String(r[1] || '').slice(0, 40), String(r[24] || '').trim().toUpperCase());
      if (xo) { xo.viejo = f < cutDia; xo.gk = gk; xo.pre = 0; camK = xo.k; D.push(xo); }
    }
    var pr = String(r[13] || '').trim(); if (!pr) continue;
    var x = mk('drive', pr, persona(r[2], r[3], r[1]), f, 'Ing fila ' + (i + 1) + ' · ' + String(r[1] || '').slice(0, 40), String(r[24] || '').trim().toUpperCase());
    if (x) { x.viejo = f < cutDia; x.gk = gk; x.pre = num(r[15]); x.camK = camK; D.push(x); }
  }

  Logger.log('[cua_13 tiempos] Drive leído y resuelto (' + D.length + ' líneas) ' + Math.round((Date.now() - t0) / 1000) + ' s');   // 19-oct: medir qué parte se come los 5 min
  // ERP: mismos filtros que el stock. 4-oct · leido de la BASE (ver cabecera).
  var EB = null;
  try { EB = _cmErpBase_(parDia); } catch (eB) { EB = null; Logger.log('[cua_13] no pude leer la base, uso la copia de siempre: ' + eB); }
  var erpDeBase = !!(EB && EB.length);
  var CONJ = {}; try { CONJ = _cmConjuntos_(); } catch (eC) { CONJ = {}; }
  var DEVERP = {};   // 27-oct (Pablo, lista 257 · pedido 21135): prendas que el ERP tiene en estado DEVOLUCION, por pedido y prenda+color
  if (erpDeBase) {
    EB.forEach(function (p) {
      if (['si', 'true', 't'].indexOf(String(p.eliminado || '').trim().toLowerCase()) >= 0) return;
      var est = String(p.estado || '').trim().toUpperCase();
      if (est === 'DEVOLUCION') { var sdv = libroResolverPrenda(String(p.prenda || '').trim()); if (sdv) DEVERP[String(p.nro_pedido) + '|' + sdv.p + '|' + sdv.d + '|' + sdv.c] = 1; }
      if (est === 'CANCELADO' || est === 'DEVOLUCION') return;
      if (/^C2DEV /.test(String(p.cambio2 || ''))) return;   // 15-oct: devuelta en un cambio sin prenda nueva (ej. 22378 CAM-0219): ya no es venta
      var pr = String(p.prenda || '').trim(); if (!pr || vocCanon(pr) === '_PAGO_') return;
      if (String(p.yay || '').trim().toUpperCase() === 'SI' || /^\s*YAYITA\s*[-\u2013\u2014]?\s+/i.test(pr)) return;
      var f = dia(p.fecha_pedido); if (!f || f < parDia) return;
      // 13-oct (Pablo aprobó): un CONJUNTO se parte en sus piezas igual que el stock (erp.alias_ventas 1→2)
      _cmPiezas_(pr, CONJ).forEach(function (prz) {
      var x = mk('erp', prz, persona(p.dni, p.celular, p.nombres), f, 'pedido ' + p.nro_pedido + ' · ' + String(p.nombres || '').slice(0, 40), est);
      if (!x) return;
      x.nro = String(p.nro_pedido); x.viejo = f < cutDia;
      var c2 = String(p.cambio2 || '');
      if (/^C2ORIG:/.test(c2)) { var o = libroResolverPrenda(c2.replace(/^C2ORIG:/, '').trim()); if (o) x.origK = o.p + '|' + o.d + '|' + o.c + '|' + o.t; }
      E.push(x);
      });
    });
  } else {
      _pedidosRawCached().forEach(function (p) {
      var est = String(p[C.ESTADO] || '').trim().toUpperCase(); if (est === 'CANCELADO' || est === 'DEVOLUCION') return;
      var pr = String(p[C.PRENDA] || '').trim(); if (!pr || vocCanon(pr) === '_PAGO_') return;
      try { if (_esVentaYayita_(p)) return; } catch (e) {}
      var f = dia(p[C.FECHA_PEDIDO]); if (!f || f < cutDia) return;
      var x = mk('erp', pr, persona(p[C.DNI], p[C.CELULAR], p[C.NOMBRE]), f, 'pedido ' + p[C.NRO] + ' · ' + String(p[C.NOMBRE] || '').slice(0, 40), est);
      if (x) E.push(x);
    });
  }

  Logger.log('[cua_13 tiempos] ERP leído y resuelto ' + Math.round((Date.now() - t0) / 1000) + ' s');   // 19-oct: medir qué parte se come los 5 min
  var cuenta = { P1: 0, P2: 0, P3: 0, P4: 0 }, por = { DNI: 0, CELULAR: 0, NOMBRE: 0 };
  // Indices para no comparar todo contra todo (Apps Script tiene 6 minutos).
  var idx = function (clave) { var m = {}; E.forEach(function (e, j) { var ks = clave(e); ks.forEach(function (k) { if (k) (m[k] = m[k] || []).push(j); }); }); return m; };
  var porK = idx(function (e) { return [e.k]; }), porSku = idx(function (e) { return [e.sku]; });
  var clavesPer = function (x) { return [x.per.dni ? 'D' + x.per.dni : '', x.per.cel ? 'C' + x.per.cel : ''].concat(x.per.nom.map(function (w) { return 'N' + w; })); };
  var porPer = idx(clavesPer);
  var pasada = function (nombre, candidatos, cond) {
    D.forEach(function (d) {
      if (d.par) return;
      var cs = candidatos(d), visto = {};
      for (var a = 0; a < cs.length; a++) {
        var j = cs[a]; if (visto[j]) continue; visto[j] = 1;
        var e = E[j]; if (e.par) continue;
        var q = cond(d, e); if (!q) continue;
        d.par = e; e.par = d; d.paso = e.paso = nombre; if (q !== true) { d.como = e.como = q; por[q]++; }
        cuenta[nombre]++; return;
      }
    });
  };
  var deK = function (d) { return porK[d.k] || []; }, deSku = function (d) { return porSku[d.sku] || []; };
  var dePer = function (d) { var o = []; clavesPer(d).forEach(function (k) { if (k && porPer[k]) o = o.concat(porPer[k]); }); return o; };
  pasada('P1', deK, function (d, e) { return d.k === e.k && dias(d.f, e.f) <= 20 ? _cmMisma_(d.per, e.per) : ''; });
  // 17-oct (235/237): misma clienta + MISMA prenda y talla hasta 45 días (la fecha del pedido del ERP es la del
  // pedido original aunque la prenda se agregó después). Va antes de P2 para que no la tome otra clienta.
  pasada('P1', deK, function (d, e) { return d.k === e.k && dias(d.f, e.f) <= 45 ? _cmMisma_(d.per, e.per) : ''; });
  pasada('P2', deK, function (d, e) { return d.k === e.k && dias(d.f, e.f) <= 5; });
  pasada('P3', deSku, function (d, e) { return d.sku === e.sku && d.k !== e.k && dias(d.f, e.f) <= 15 ? _cmMisma_(d.per, e.per) : ''; });
  pasada('P4', dePer, function (d, e) { return d.sku !== e.sku && dias(d.f, e.f) <= 15 ? _cmMisma_(d.per, e.per) : ''; });

  Logger.log('[cua_13 tiempos] parejas P1-P4 ' + Math.round((Date.now() - t0) / 1000) + ' s');   // 19-oct: medir qué parte se come los 5 min
  // 27-set · ¿la diferencia es un CAMBIO o una DEVOLUCION que el Drive anoto y el ERP no?
  var retDe = function (e) {
    for (var z = 0; z < RET.length; z++) {
      var q = RET[z]; if (q.usado || q.k !== e.k || dias(q.f, e.f) > 45) continue;
      if (_cmMisma_(q.per, e.per)) { q.usado = 1; return q; }
    }
    return null;
  };
  var causa = { cambioNoEnErp: 0, devolucionNoEnErp: 0 };
  E.forEach(function (e) {
    var esPar = e.par && (e.paso === 'P3' || e.paso === 'P4');
    if (!esPar && e.par) return;
    var q = retDe(e); if (!q) return;
    e.causa = q.nVacio ? 'DEVOLUCION que el ERP no registro' : 'CAMBIO que el ERP no registro';
    if (q.nVacio) causa.devolucionNoEnErp++; else causa.cambioNoEnErp++;
  });
  // 4-oct · REGLA 1 (Pablo): otra talla/prenda -> ¿hubo cambio? Si no hubo, manda el Drive.
  D.forEach(function (d) {
    if (d.paso !== 'P3' && d.paso !== 'P4') return;
    var e = d.par;
    d.causa = (d.camK && d.camK === e.k) ? 'CAMBIO: el Drive ya lo aplico, el ERP no'
      : (e.origK && e.origK === d.k) ? 'CAMBIO: el ERP ya lo aplico, el Drive no'
      : 'SIN CAMBIO: manda el Drive';
  });
  // 4-oct · REGLA 2 (Pablo): "solo Drive" -> si el Drive tiene el pago, al ERP le FALTA la venta;
  // si no tiene pago, la fila SOBRA en el Drive.
  var soloDs = D.filter(function (d) { return !d.par && !d.viejo; });
  var nrosQ = {};
  soloDs.forEach(function (d) { d.nros = {}; dePer(d).forEach(function (j) { var e = E[j]; if (e.nro && dias(d.f, e.f) <= 7 && _cmMisma_(d.per, e.per)) { d.nros[e.nro] = 1; nrosQ[e.nro] = 1; } }); });

  Logger.log('[cua_13 tiempos] causas y regla 1 ' + Math.round((Date.now() - t0) / 1000) + ' s');   // 19-oct: medir qué parte se come los 5 min
  var PAG = {};
  try { PAG = _cmPagados_(Object.keys(nrosQ)); } catch (eP) { Logger.log('[cua_13] pagos: ' + eP); }
  Logger.log('[cua_13 tiempos] pagos leídos ' + Math.round((Date.now() - t0) / 1000) + ' s');   // 19-oct: medir qué parte se come los 5 min
  var porG = {}; soloDs.forEach(function (d) { (porG[d.gk] = porG[d.gk] || []).push(d); });
  var regla2 = { falta: 0, sobra: 0, sinPrecio: 0 };
  Object.keys(porG).forEach(function (gk) {
    var L = porG[gk], ns = {}; L.forEach(function (d) { Object.keys(d.nros).forEach(function (n) { ns[n] = 1; }); });
    var ePag = Object.keys(ns).reduce(function (a, n) { return a + (PAG[n] || 0); }, 0);
    var resto = ((GRP[gk] || {}).pag || 0) - ePag;
    L.sort(function (a, b) { return a.f < b.f ? -1 : 1; }).forEach(function (d) {
      if (/transito/i.test(d.ref)) return;
      // 27-oct (257) · ANTES: la prenda que el ERP tiene como DEVOLUCION y el Drive como vendida salía «SOBRA EN EL DRIVE: no tiene pago»
      // (el pago del pedido ya estaba contado entero en el ERP, así que no «sobraba» plata para ella) aunque los dos lados tenían el pago completo.
      // AHORA se dice lo que es: el estado no coincide. Va primero y no consume plata.
      var devN = Object.keys(d.nros).filter(function (n) { return DEVERP[n + '|' + d.sku]; });
      if (devN.length) { d.causa = 'DEVOLUCION EN EL ERP: el pedido ' + devN.join(', ') + ' tiene esta prenda como DEVOLUCION y el Drive la tiene vendida (pago completo en los dos): si no hubo devolución, corregir el estado en el ERP'; regla2.devErp = (regla2.devErp || 0) + 1; }
      else if (!(d.pre > 0)) { d.causa = 'SIN PRECIO en el Drive (regalo o falta el precio)'; regla2.sinPrecio++; }
      else if (resto >= d.pre - 0.5) { d.causa = 'FALTA EN EL ERP: el Drive tiene el pago'; resto -= d.pre; regla2.falta++; }
      else { d.causa = 'SOBRA EN EL DRIVE: no tiene pago'; regla2.sobra++; }
      d.causa += Object.keys(d.nros).length ? ' (la clienta tiene el pedido ' + Object.keys(d.nros).join(', ') + ')' : ' (la clienta no tiene pedido en el ERP)';
    });
  });
  // 4-oct · CAMBIOS DUPLICADOS: la prenda nueva de un cambio esta 2 veces en el pedido.
  var dup = [];
  if (erpDeBase) {
    var gp = {};
    EB.forEach(function (p) {
      if (['si', 'true', 't'].indexOf(String(p.eliminado || '').trim().toLowerCase()) >= 0) return;
      var est = String(p.estado || '').trim().toUpperCase(); if (est === 'CANCELADO' || est === 'DEVOLUCION') return;
      var k = p.nro_pedido + '|' + String(p.prenda || '').toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      var o = gp[k] || (gp[k] = { nro: String(p.nro_pedido), prenda: String(p.prenda || ''), ids: [], c2: 0 });
      o.ids.push(p.id); if (/^(C2ORIG:|NUEVA EXTRA|CARGO)/.test(String(p.cambio2 || ''))) o.c2++;
    });
    Object.keys(gp).forEach(function (k) { var o = gp[k]; if (o.c2 > 0 && o.ids.length > o.c2) dup.push({ nro: o.nro, prenda: o.prenda, filas: o.ids.length, ids: o.ids }); });
  }
  var homo = Object.keys(HOMO).map(function (k) { var a = k.split('\u0001'); return [a[0], a[1], HOMO[k]]; }).sort(function (x, y) { return y[2] - x[2]; });
  var fila = function (x) { return [x.k, x.f, x.ref, x.est, x.causa || '', x.texto || '']; };
  var corteReciente = '2026-09-26';
  var recientes = function (L) { return L.filter(function (x) { return x[1] >= corteReciente; }).length; };
  var talla = [], prenda = [];
  D.forEach(function (d) {
    if (!d.par || (d.viejo && d.par.viejo)) return;
    if (d.paso === 'P3') talla.push({ drive: fila(d), erp: fila(d.par), como: d.como, causa: d.causa });
    if (d.paso === 'P4') prenda.push({ drive: fila(d), erp: fila(d.par), como: d.como, causa: d.causa });
  });
  var soloD = D.filter(function (d) { return !d.par && !d.viejo; }).map(fila), soloE = E.filter(function (e) { return !e.par && !e.viejo; }).map(fila);
  var estD = {}; D.forEach(function (d) { estD[d.est || '(vacio)'] = (estD[d.est || '(vacio)'] || 0) + 1; });
  var R = { cuando: new Date().toISOString(), desde: cutDia, drive: D.length, erp: E.length, sinResolver: sinResolver,
            parejas: cuenta, parejasPor: por, estadosDrive: estD, causas: causa, retornosDrive: RET.length,
            otraTalla: talla, otraPrenda: prenda, soloDrive: soloD, soloErp: soloE,
            erpDeBase: erpDeBase, regla2: regla2, cambioDuplicado: dup, homologacion: homo,
            seg: Math.round((Date.now() - t0) / 100) / 10 };
  R.recientes = { desde: corteReciente, soloDrive: recientes(soloD), soloErp: recientes(soloE) };
  var top = function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (x, y) { return y[1] - x[1]; }).slice(0, 80); };
  R.sinResolverTop = { erp: top(sinResolverTxt.erp), drive: top(sinResolverTxt.drive) };
  try { _sbFetch_('POST', 'rpc/espejo_cache_set', { p_clave: 'claude.cuadre.match', p_datos: R, p_filas: soloD.length + soloE.length }, {}); } catch (e) { R.errGuardar = String(e); }
  Logger.log('[cua_13] ' + JSON.stringify({ erpDeBase: erpDeBase, drive: D.length, erp: E.length, parejas: cuenta, por: por, otraTalla: talla.length, otraPrenda: prenda.length, soloDrive: soloD.length, soloErp: soloE.length, regla2: regla2, cambioDuplicado: dup.length, homologacion: homo.length, seg: R.seg }));
  return { parejas: cuenta, soloDrive: soloD.length, soloErp: soloE.length };
}

// ── El conductor: baja la copia del Drive y lo que el emparejador pida de la base; corre; si falta algo, lo baja y vuelve a correr ──
async function __hdr() { var tok = await _sbSesionAsegurar(); if (!tok) throw new Error('cuadre_local: sin sesion'); return { apikey: SB_ANON, Authorization: 'Bearer ' + tok }; }
/** Todo se lee por public.cuadre_fuente (solo Administrador): UNA llamada por tabla, sin paginar.
 *  Devuelve lo mismo que la tabla; las páginas siguientes (offset > 0) van vacías → el motor del servidor corta solo. */
async function __fuente(tabla, desde, nros) {
  var h = Object.assign({ 'Content-Type': 'application/json' }, await __hdr());
  var r = await fetch(SB_URL + '/rest/v1/rpc/cuadre_fuente', { method: 'POST', headers: h, body: JSON.stringify({ p_tabla: tabla, p_desde: desde || null, p_nros: nros || null }) });
  return { code: r.status, body: await r.text() };
}
async function __bajar(f) {
  var off = /[?&]offset=(\d+)/.exec(f.ruta), q = f.ruta.split('?')[0];
  if (off && +off[1] > 0) { __RUTAS[f.k] = { code: 200, body: '[]' }; return; }
  var desde = (/[?&]fecha_pedido=gte\.([0-9-]+)/.exec(f.ruta) || [])[1] || null;
  var nros = null, mN = /[?&]nro_pedido=in\.\(([^&]*)\)/.exec(decodeURIComponent(f.ruta));
  if (mN) nros = mN[1].split(',').map(function (x) { return x.replace(/"/g, ''); });
  var tabla = q === 'alias_ventas' ? 'alias_conjuntos' : q;
  if (['stock_saldos', 'homologaciones', 'pedidos', 'alias_conjuntos', 'pagos'].indexOf(tabla) < 0) throw new Error('cuadre_local: ruta no prevista ' + q);
  __RUTAS[f.k] = await __fuente(tabla, desde, nros);
}
/** La copia del Drive desde una fecha, armada como getValues(): fila N en la posición N-1. */
async function __bajarDrive(desde) {
  var r = await __fuente('drive_ing', desde); if (r.code >= 300) throw new Error('drive_ing HTTP ' + r.code + ' ' + String(r.body).slice(0, 200));
  var filas = JSON.parse(r.body || '[]');
  var max = filas.reduce(function (m, x) { return Math.max(m, x.fila); }, 1), v = new Array(max);
  v[0] = []; for (var i = 1; i < max; i++) v[i] = [];
  filas.forEach(function (x) { v[x.fila - 1] = x.valores || []; });
  return { v: v, n: filas.length };
}
/** 20-oct · la fila del Drive tal cual (para la pantalla: columna Cambio y asesora de una fila de la lista 2). */
window.cuadreLocalFilaDrive = function (fila) { return (__DRIVE || [])[Number(fila) - 1] || null; };
/** Corre el emparejador del servidor en el navegador. corte = 'yyyy-mm-dd' (STOCK_CUTOFF del servidor). */
window.cuadreLocalEmparejar = async function (corte) {
  var t0 = Date.now(), viajes = 0;
  __RUTAS = {}; __SALIDA = {}; __PROPS = { STOCK_CUTOFF: corte };
  _LIBRO_IDX = null; _VOC_FRASES_ = null;
  var desde = new Date(new Date(corte + 'T00:00:00-05:00').getTime() - 46 * 864e5).toISOString().slice(0, 10);   // la ventana del emparejador (corte − 45 días) + 1 de margen
  var D = await __bajarDrive(desde); __DRIVE = D.v;
  var tDrive = Date.now() - t0;
  for (var vuelta = 0; vuelta < 20; vuelta++) {
    __FALTAN = []; var res = null, err = null;
    try { res = cua_13_EMPAREJAR_VENTAS(); } catch (e) { err = e; }
    if (!__FALTAN.length) {
      if (err) throw err;
      var M = __SALIDA['claude.cuadre.match'] || null;
      return { match: M, resumen: res, ms: Date.now() - t0, msDrive: tDrive, filasDrive: D.n, vueltas: vuelta + 1, viajes: viajes };
    }
    var vistos = {}, pedir = __FALTAN.filter(function (f) { if (vistos[f.k]) return false; vistos[f.k] = 1; return true; });
    viajes += pedir.length;
    await Promise.all(pedir.map(__bajar));
    _LIBRO_IDX = null; _VOC_FRASES_ = null;   // se rearman con lo recién bajado
  }
  throw new Error('cuadre_local: demasiadas vueltas');
};

})();
