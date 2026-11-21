/* 21-nov-2026 · Marketing › 🎬 Creativos › 🎨 Diseños — FASE 1 (aprobada por Pablo).
   Plantillas de anuncio que se llenan solas con los datos de la tienda:
   · precio, precio tachado, colores, tallas con stock y portada de cada color → tienda pública  tulula.com.pe/products/<handle>.js
   · fotos en el orden del ERP, beneficios (3-5 por prenda) y frase gigante → copia de Shopify en la base (rpc mk_dis_productos)
   Base: public.mk_disenos + public.mk_dis_config (PEGAR_EN_SUPABASE_disenos_21nov.sql). Editan Admin y Marketing en Edición.
   Archivar en vez de borrar. «📤 A Por usar» = PNG listo → 🎬 Biblioteca › Por usar (ahí 🚀 Anuncio lo crea en Meta en pausa).
   Formatos: 4:5 (feed) y 9:16 (historias y reels, con zonas seguras de Meta). */
const DIS = { filas: null, prods: null, marca: null, puede: false, info: {}, ver: 'activos', fForm: '', fMsj: '', q: '', ed: null, sel: -1, prod: '', color: '', msg: '' };
const DIS_TAM = { '4x5': [1080, 1350], '9x16': [1080, 1920] };
const DIS_MSJ = [['producto','Producto'],['beneficios','Beneficios'],['oferta','Oferta'],['colores','Colores'],['preventa','Preventa'],['frase','Frase'],['resenas','Reseñas']];
const DIS_EST = { borrador: 'Borrador', prueba: 'En prueba', ganadora: 'Ganadora', archivada: 'Archivada' };
const DIS_VIS = [['siempre','Siempre'],['oferta','Solo en oferta'],['sin_oferta','Solo sin oferta'],['preventa','Solo en preventa'],['beneficios','Solo con beneficios']];
const DIS_CAMPOS = [['{{nombre}}','Nombre'],['{{precio}}','Precio'],['{{precio_antes}}','Precio antes'],['{{descuento}}','% descuento'],['{{ahorro}}','Ahorro'],['{{frase}}','Frase gigante'],['{{color}}','Color'],['{{colores_n}}','N.º de colores'],['{{tallas}}','Tallas'],['{{beneficio1}}','Beneficio 1'],['{{beneficio2}}','Beneficio 2'],['{{beneficio3}}','Beneficio 3'],['{{beneficio1_texto}}','Detalle beneficio 1']];
const DIS_COLS = [['principal','Principal'],['acento','Acento'],['texto','Texto'],['fondo','Fondo'],['oferta','Oferta'],['blanco','Blanco'],['negro','Negro']];
const DIS_MARCA_DEF = { aprobada: false, f_titulo: 'Tenor Sans', f_texto: 'Jost', c_principal: '#1f1f27', c_acento: '#7c99a9', c_texto: '#515167', c_fondo: '#ffffff', c_oferta: '#b3261e',
  logo_oscuro: 'https://cdn.shopify.com/s/files/1/0722/3564/7189/files/logo-oscuro_649cf6f9-9636-42ac-9f18-05f5af1ff2de.png' };
/* Zonas seguras 9:16 (guía de Meta para historias y reels): ~14% arriba y ~20% abajo los tapa la interfaz. */
const DIS_SEGURA = { arriba: 14, abajo: 20 };
const disA = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* ── plantillas de arranque (posiciones en % del lienzo; tamaños de letra en px sobre 1080 de ancho) ── */
const DIS_BASE = [
  { nombre: 'Producto con precio', mensaje: 'producto', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 100, h: 100 },
    { t: 'forma', x: 0, y: 72, w: 100, h: 28, color: 'principal', op: 0.88 },
    { t: 'logo', x: 6, y: 4, w: 24, claro: true },
    { t: 'texto', txt: '{{descuento}}', x: 72, y: 4, w: 22, tam: 52, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'oferta', pad: 14, r: 10, al: 'center', vis: 'oferta' },
    { t: 'texto', txt: '{{nombre}}', x: 6, y: 75, w: 88, tam: 60, fuente: 'titulo', color: 'blanco', mayus: true, ls: 2 },
    { t: 'texto', txt: '{{precio_antes}}', x: 6, y: 84, w: 40, tam: 34, fuente: 'texto', color: 'acento', tachado: true, vis: 'oferta' },
    { t: 'texto', txt: '{{precio}}', x: 6, y: 88, w: 50, tam: 62, fuente: 'texto', peso: 600, color: 'blanco' } ] },
  { nombre: 'Beneficios', mensaje: 'beneficios', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 58, h: 100 },
    { t: 'texto', txt: '{{nombre}}', x: 62, y: 8, w: 34, tam: 46, fuente: 'titulo', color: 'principal', mayus: true, ls: 1 },
    { t: 'lista', x: 62, y: 28, w: 35, tam: 30, color: 'texto', icono: '✓', max: 3, detalle: true },
    { t: 'texto', txt: '{{precio_antes}}', x: 62, y: 76, w: 34, tam: 30, fuente: 'texto', color: 'acento', tachado: true, vis: 'oferta' },
    { t: 'texto', txt: '{{precio}}', x: 62, y: 80, w: 34, tam: 56, fuente: 'texto', peso: 600, color: 'principal' },
    { t: 'logo', x: 62, y: 92, w: 22 } ] },
  { nombre: 'Oferta', mensaje: 'oferta', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 100, h: 100 },
    { t: 'forma', x: 0, y: 0, w: 100, h: 12, color: 'oferta', op: 1, vis: 'oferta' },
    { t: 'texto', txt: 'OFERTA {{descuento}}', x: 0, y: 2.6, w: 100, tam: 62, fuente: 'texto', peso: 600, color: 'blanco', al: 'center', ls: 3, vis: 'oferta' },
    { t: 'forma', x: 0, y: 80, w: 100, h: 20, color: 'fondo', op: 0.95 },
    { t: 'texto', txt: '{{nombre}}', x: 6, y: 84, w: 56, tam: 44, fuente: 'titulo', color: 'principal', mayus: true },
    { t: 'texto', txt: '{{precio_antes}}', x: 64, y: 82.5, w: 30, tam: 32, fuente: 'texto', color: 'texto', tachado: true, al: 'right', vis: 'oferta' },
    { t: 'texto', txt: '{{precio}}', x: 54, y: 87.5, w: 40, tam: 62, fuente: 'texto', peso: 600, color: 'oferta', al: 'right' } ] },
  { nombre: 'Colores', mensaje: 'colores', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 100, h: 72 },
    { t: 'texto', txt: 'Disponible en {{colores_n}}', x: 6, y: 75, w: 60, tam: 40, fuente: 'titulo', color: 'principal' },
    { t: 'texto', txt: '{{nombre}}', x: 6, y: 80.5, w: 60, tam: 28, fuente: 'texto', color: 'texto', mayus: true, ls: 2 },
    { t: 'texto', txt: '{{precio}}', x: 60, y: 75, w: 34, tam: 52, fuente: 'texto', peso: 600, color: 'principal', al: 'right' },
    { t: 'colores', x: 6, y: 86, w: 88, h: 11 } ] },
  { nombre: 'Preventa', mensaje: 'preventa', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 100, h: 100 },
    { t: 'forma', x: 0, y: 76, w: 100, h: 24, color: 'principal', op: 0.7 },
    { t: 'texto', txt: 'PREVENTA', x: 6, y: 5, w: 50, tam: 38, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'principal', pad: 14, r: 6, ls: 5 },
    { t: 'texto', txt: 'Sé la primera en tenerlo', x: 6, y: 80, w: 88, tam: 54, fuente: 'titulo', color: 'blanco' },
    { t: 'texto', txt: '{{nombre}} · {{precio}}', x: 6, y: 89, w: 88, tam: 34, fuente: 'texto', color: 'blanco' } ] },
  { nombre: 'Frase gigante', mensaje: 'frase', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 100, h: 100 },
    { t: 'forma', x: 0, y: 0, w: 100, h: 100, color: 'negro', op: 0.25 },
    { t: 'texto', txt: '{{frase}}', x: 6, y: 38, w: 88, tam: 104, fuente: 'titulo', color: 'blanco', al: 'center', mayus: true, ls: 4 },
    { t: 'texto', txt: '{{nombre}}', x: 6, y: 84, w: 88, tam: 34, fuente: 'texto', color: 'blanco', al: 'center', mayus: true, ls: 6 },
    { t: 'logo', x: 39, y: 91, w: 22, claro: true } ] }
];

/* ── datos ── */
async function disCargar(){
  const [f, p, m, pu] = await Promise.all([
    _mklSb('/rest/v1/mk_disenos?select=*&order=creado.desc'),
    DIS.prods ? Promise.resolve(DIS.prods) : _mklSb('/rest/v1/rpc/mk_dis_productos', { method: 'POST', body: '{}' }),
    _mklSb('/rest/v1/mk_dis_config?select=valor&clave=eq.marca').catch(() => []),
    _mklSb('/rest/v1/rpc/_mk_puede_editar', { method: 'POST', body: '{}' }).catch(() => false)]);
  DIS.filas = Array.isArray(f) ? f : [];
  DIS.prods = (Array.isArray(p) ? p : []).slice().sort((a, b) => (a.estado === 'active' ? 0 : 1) - (b.estado === 'active' ? 0 : 1) || String(a.titulo).localeCompare(String(b.titulo)));
  DIS.marca = Object.assign({}, DIS_MARCA_DEF, (m && m[0] && m[0].valor) || {});
  DIS.puede = pu === true;
}
async function disInfo(handle){
  if (!handle) return {};
  const v = DIS.info[handle]; if (v) return await v;
  const pr = fetch('https://tulula.com.pe/products/' + encodeURIComponent(handle) + '.js').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  DIS.info[handle] = pr; const j = await pr; DIS.info[handle] = j || {}; return DIS.info[handle];
}
function _disProd(handle){ return (DIS.prods || []).find(x => x.handle === handle) || (DIS.prods || [])[0] || null; }
function _disFotos(p){ return (Array.isArray(p && p.fotos) ? p.fotos : []).map(u => typeof u === 'string' ? u : (u && (u.url || u.src)) || '').filter(Boolean); }
function _disArch(u){ return String(u || '').split('?')[0].split('/').pop().toLowerCase(); }
function _disTam(u, w){ return /cdn\.shopify\.com/.test(u) ? u + (u.indexOf('?') >= 0 ? '&' : '?') + 'width=' + (w || 1080) : u; }
function _disSol(c){ if (c == null || c === '' || isNaN(+c)) return ''; c = +c; return 'S/ ' + (c % 100 ? (c / 100).toFixed(2) : String(c / 100)); }

/* el contexto = todo lo que una plantilla puede mostrar de UN producto en UN color */
function disCtx(p, inf, color, aj){
  inf = inf || {}; p = p || {}; aj = aj || {};
  const fotos = _disFotos(p), ops = inf.options || [];
  const ci = ops.findIndex(o => /color/i.test(o.name || o)), ti = ops.findIndex(o => /talla/i.test(o.name || o));
  const cols = ci >= 0 ? (ops[ci].values || []) : [];
  if (!color || cols.indexOf(color) < 0) color = cols[0] || '';
  const vsAll = inf.variants || [], opc = (v, i) => (v.options || [v.option1, v.option2, v.option3])[i];
  const vs = vsAll.filter(v => ci < 0 || opc(v, ci) === color);
  const v0 = vs[0] || vsAll[0] || {};
  const precio = v0.price != null ? v0.price : inf.price, antes = v0.compare_at_price != null ? v0.compare_at_price : inf.compare_at_price;
  const oferta = !!(antes && precio && +antes > +precio);
  const portadaDe = c => { const v = vsAll.find(x => (ci < 0 || opc(x, ci) === c) && x.featured_image); return v ? v.featured_image.src : ''; };
  const port = portadaDe(color); let i0 = port ? fotos.findIndex(u => _disArch(u) === _disArch(port)) : 0; if (i0 < 0) i0 = 0;
  const tallas = []; vs.forEach(v => { const t = ti >= 0 ? opc(v, ti) : ''; if (v.available && t && tallas.indexOf(t) < 0) tallas.push(t); });
  const benBase = (Array.isArray(p.beneficios) ? p.beneficios : []).map(b => ({ titulo: String(b.titulo || ''), texto: String(b.texto || ''), foto: b.foto || '' }));
  const benAj = aj.ben && aj.ben[p.handle];
  const ben = Array.isArray(benAj) ? benAj.filter(b => b && b.on !== false) : benBase.slice(0, 3);
  const tags = (inf.tags || []).map(t => String(t).toLowerCase());
  const preventa = tags.some(t => t.indexOf('preventa') >= 0) || !!(aj.preventa && aj.preventa[p.handle]);
  return { p, fotos, i0, color, colores: cols, portadas: cols.map(c => ({ c, src: portadaDe(c) })), benBase, ben,
    precio: _disSol(precio), antes: oferta ? _disSol(antes) : '', descuento: oferta ? '-' + Math.round((1 - precio / antes) * 100) + '%' : '',
    ahorro: oferta ? 'Ahorras ' + _disSol(antes - precio) : '', oferta, preventa, tallas, frase: p.frase || '', nombre: String(p.titulo || '') };
}
function _disFotoSrc(cx, src){
  src = String(src || 'color:0'); const k = src.split(':')[0], i = +src.split(':')[1] || 0;
  if (k === 'color') return cx.fotos[cx.i0 + i] || cx.fotos[i] || '';
  if (k === 'n') return cx.fotos[i] || '';
  if (k === 'ben'){ const b = cx.ben[i]; if (b && b.foto){ const f = cx.fotos.find(u => _disArch(u) === _disArch(b.foto)); if (f) return f; } return cx.fotos[cx.i0 + i + 1] || ''; }
  if (k === 'url') return src.slice(4);
  return '';
}
function _disTxt(cx, t){
  return String(t || '').replace(/\{\{(\w+)\}\}/g, (m, k) => {
    const b = k.match(/^beneficio(\d)(_texto)?$/); if (b){ const x = cx.ben[+b[1] - 1]; return x ? (b[2] ? x.texto : x.titulo) : ''; }
    const n = cx.tallas.length, tal = n > 2 ? cx.tallas[0] + ' a ' + cx.tallas[n - 1] : cx.tallas.join(' y ');
    const v = { nombre: cx.nombre, precio: cx.precio, precio_antes: cx.antes, descuento: cx.descuento, ahorro: cx.ahorro, frase: cx.frase, color: cx.color,
      colores_n: cx.colores.length > 1 ? cx.colores.length + ' colores' : '', tallas: tal, marca: 'TULULA' }[k];
    return v == null ? '' : v; });
}
function _disVis(c, cx){
  if (c.oculto) return false;
  const v = c.vis || 'siempre';
  return v === 'siempre' || (v === 'oferta' && cx.oferta) || (v === 'sin_oferta' && !cx.oferta) || (v === 'preventa' && cx.preventa) || (v === 'beneficios' && cx.ben.length > 0);
}
function _disCol(c){
  const m = DIS.marca || DIS_MARCA_DEF;
  return { principal: m.c_principal, acento: m.c_acento, texto: m.c_texto, fondo: m.c_fondo, oferta: m.c_oferta, blanco: '#ffffff', negro: '#000000' }[c] || (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : m.c_principal);
}

/* ── dibujar: el mismo HTML sirve para la galería (chico), el editor y la imagen final (1080) ── */
function disHtml(d, cx, s, opt){
  opt = opt || {}; const [W, H] = DIS_TAM[d.formato] || DIS_TAM['4x5'], m = DIS.marca || DIS_MARCA_DEF;
  const ft = "'" + m.f_titulo + "', serif", fx = "'" + m.f_texto + "', sans-serif", anchoFoto = opt.ancho || 1080;
  let h = '<div class="dis-lienzo" style="position:relative;overflow:hidden;width:' + Math.round(W * s) + 'px;height:' + Math.round(H * s) + 'px;background:' + _disCol((d.ajustes && d.ajustes.fondo) || 'fondo') + '">';
  (d.capas || []).forEach((c, i) => {
    if (!_disVis(c, cx)) return;
    const pos = 'position:absolute;left:' + (+c.x || 0) + '%;top:' + (+c.y || 0) + '%;width:' + (c.w != null ? +c.w : 100) + '%;' + (c.h != null ? 'height:' + (+c.h) + '%;' : '');
    const sel = opt.sel === i ? 'outline:2px dashed #7c5cff;outline-offset:-2px;' : '', da = opt.edit ? ' data-capa="' + i + '"' : '';
    const cur = opt.edit ? 'cursor:move;' : '';
    if (c.t === 'foto'){
      const u = _disFotoSrc(cx, c.src);
      h += '<div' + da + ' style="' + pos + sel + cur + 'border-radius:' + ((+c.r || 0) * s) + 'px;overflow:hidden;background:#e9e9ee">'
        + (u ? '<img crossorigin="anonymous" src="' + disA(_disTam(u, anchoFoto)) + '" style="width:100%;height:100%;object-fit:' + (c.fit || 'cover') + ';object-position:' + (c.pos || 'center top') + ';display:block;pointer-events:none" draggable="false">' : '') + '</div>';
    } else if (c.t === 'forma'){
      h += '<div' + da + ' style="' + pos + sel + cur + 'background:' + _disCol(c.color) + ';opacity:' + (c.op != null ? +c.op : 1) + ';border-radius:' + ((+c.r || 0) * s) + 'px"></div>';
    } else if (c.t === 'logo'){
      h += '<div' + da + ' style="' + pos + sel + cur + '"><img crossorigin="anonymous" src="' + disA(m.logo_oscuro) + '" style="width:100%;display:block;pointer-events:none;' + (c.claro ? 'filter:brightness(0) invert(1)' : '') + '" draggable="false"></div>';
    } else if (c.t === 'texto'){
      const t = _disTxt(cx, c.txt); if (!t.trim()) return;
      const fondo = c.fondo ? 'background:' + _disCol(c.fondo) + ';padding:' + ((+c.pad || 0) * s) + 'px ' + ((+c.pad || 0) * 1.4 * s) + 'px;border-radius:' + ((+c.r || 0) * s) + 'px;' : '';
      h += '<div' + da + ' style="' + pos + sel + cur + 'text-align:' + (c.al || 'left') + ';line-height:1.12">'
        + '<span style="display:inline-block;' + fondo + 'font-family:' + (c.fuente === 'titulo' ? ft : fx) + ';font-size:' + ((+c.tam || 40) * s) + 'px;font-weight:' + (c.peso || 400) + ';color:' + _disCol(c.color)
        + ';letter-spacing:' + ((+c.ls || 0) * s) + 'px;' + (c.mayus ? 'text-transform:uppercase;' : '') + (c.tachado ? 'text-decoration:line-through;' : '') + 'white-space:pre-wrap">' + disA(t) + '</span></div>';
    } else if (c.t === 'lista'){
      const L = cx.ben.slice(0, +c.max || 3); if (!L.length) return;
      const tam = (+c.tam || 30) * s;
      h += '<div' + da + ' style="' + pos + sel + cur + 'font-family:' + fx + ';color:' + _disCol(c.color) + '">' + L.map(b =>
        '<div style="display:flex;gap:' + (tam * 0.45) + 'px;margin-bottom:' + (tam * 0.7) + 'px"><span style="font-size:' + tam + 'px;line-height:1.1;color:' + _disCol('acento') + '">' + disA(c.icono || '✓') + '</span>'
        + '<div><div style="font-size:' + tam + 'px;font-weight:600;line-height:1.15">' + disA(b.titulo) + '</div>'
        + (c.detalle && b.texto ? '<div style="font-size:' + (tam * 0.72) + 'px;line-height:1.25;margin-top:' + (tam * 0.15) + 'px;opacity:.85">' + disA(b.texto) + '</div>' : '') + '</div></div>').join('') + '</div>';
    } else if (c.t === 'colores'){
      const P = cx.portadas.filter(x => x.src); if (P.length < 2) return;
      h += '<div' + da + ' style="' + pos + sel + cur + 'display:flex;gap:' + (14 * s) + 'px">' + P.slice(0, 6).map(x =>
        '<div style="flex:1;min-width:0;text-align:center;font-family:' + fx + ';font-size:' + (22 * s) + 'px;color:' + _disCol('texto') + '"><div style="height:' + (110 * s) + 'px;border-radius:' + (8 * s) + 'px;overflow:hidden;background:#e9e9ee;' + (x.c === cx.color ? 'outline:' + (3 * s) + 'px solid ' + _disCol('principal') + ';' : '') + '">'
        + '<img crossorigin="anonymous" src="' + disA(_disTam(x.src, 300)) + '" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;pointer-events:none" draggable="false"></div>'
        + '<div style="margin-top:' + (6 * s) + 'px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + disA(x.c) + '</div></div>').join('') + '</div>';
    }
  });
  if (opt.guia && d.formato === '9x16'){
    const z = 'position:absolute;left:0;width:100%;background:repeating-linear-gradient(45deg,rgba(124,92,255,.18) 0 8px,transparent 8px 16px);border:1px dashed #7c5cff;pointer-events:none;';
    h += '<div title="Zona que tapa Instagram (arriba)" style="' + z + 'top:0;height:' + DIS_SEGURA.arriba + '%"></div><div title="Zona que tapa Instagram (abajo)" style="' + z + 'bottom:0;height:' + DIS_SEGURA.abajo + '%"></div>';
  }
  return h + '</div>';
}

/* ── galería ── */
async function disAbrir(){
  const el = document.getElementById('mkDis'); if (!el) return;
  _disFuentes();
  if (DIS.filas === null){
    el.innerHTML = '<div class="mkl-vacio">Cargando diseños…</div>';
    try { await disCargar(); } catch (e) { el.innerHTML = '<div class="mkl-vacio">No pude cargar los diseños (' + esc(e.message) + ').</div>'; return; }
  }
  disPintar();
}
function _disVisibles(){
  const q = _mkNorm(DIS.q);
  return (DIS.filas || []).filter(f => (DIS.ver === 'archivados' ? f.estado === 'archivada' : DIS.ver === 'ganadoras' ? f.estado === 'ganadora' : f.estado !== 'archivada')
    && (!DIS.fForm || f.formato === DIS.fForm) && (!DIS.fMsj || f.mensaje === DIS.fMsj) && (!q || _mkNorm(f.nombre).indexOf(q) >= 0));
}
function disPintar(){
  const el = document.getElementById('mkDis'); if (!el) return;
  const fs = DIS.filas || [], vis = _disVisibles();
  const n = { activos: fs.filter(f => f.estado !== 'archivada').length, ganadoras: fs.filter(f => f.estado === 'ganadora').length, archivados: fs.filter(f => f.estado === 'archivada').length };
  const b = (k, t) => '<button class="btn' + (DIS.ver === k ? ' on' : '') + '" onclick="DIS.ver=\'' + k + '\';disPintar()">' + t + ' <span class="ui-nota">' + n[k] + '</span></button>';
  const sel = (id, v, ops, ph) => '<select onchange="' + id + '=this.value;disPintar()"><option value="">' + ph + '</option>' + ops.map(o => '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
  const m = DIS.marca || DIS_MARCA_DEF;
  let h = '<div class="dis-barra"><div class="dis-barra-izq">' + b('activos', 'Activos') + b('ganadoras', '🏆 Ganadoras') + b('archivados', 'Archivados')
    + sel('DIS.fForm', DIS.fForm, [['4x5', '4:5 feed'], ['9x16', '9:16 historias']], 'Formato') + sel('DIS.fMsj', DIS.fMsj, DIS_MSJ, 'Mensaje')
    + '<input type="search" placeholder="Buscar" value="' + disA(DIS.q) + '" oninput="DIS.q=this.value;clearTimeout(DIS._t);DIS._t=setTimeout(disPintar,250)" style="width:150px"></div>'
    + '<div class="dis-barra-der">' + (DIS.puede ? '<button class="btn" onclick="disMarcaAbrir()" title="Letras, colores y logo de las plantillas">🎨 Marca</button><button class="btn on" onclick="disNuevoAbrir()">➕ Nuevo diseño</button>' : '') + '</div></div>';
  if (!m.aprobada && DIS.puede) h += '<div class="ui-nota dis-aviso">Marca sacada de tulula.com.pe (Tenor Sans, Jost, ' + esc(m.c_principal) + '). Revísala en 🎨 Marca y apruébala.</div>';
  if (DIS.msg) h += '<div class="ui-nota dis-aviso">' + DIS.msg + ' <button class="tt-ico" onclick="DIS.msg=\'\';disPintar()" title="Cerrar">✕</button></div>';
  if (!vis.length) h += '<div class="mkl-vacio">' + (fs.length ? 'Nada para mostrar con estos filtros.' : 'Todavía no hay diseños. Crea el primero con ➕ Nuevo diseño.') + '</div>';
  else h += '<div class="dis-grilla">' + vis.map(f => _disTarjeta(f)).join('') + '</div>';
  el.innerHTML = h;
  vis.forEach(f => _disMini(f));
}
function _disTarjeta(f){
  const est = f.estado, chip = est === 'ganadora' ? 'ok' : est === 'prueba' ? 'am' : '';
  const ac = DIS.puede ? (est === 'archivada'
      ? '<button class="tt-ico" title="Restaurar" onclick="disEstado(' + f.id + ',\'borrador\')">↩️</button>'
      : '<button class="tt-ico" title="Editar" onclick="disEditar(' + f.id + ')">✏️</button><button class="tt-ico" title="Duplicar" onclick="disDuplicar(' + f.id + ')">⧉</button>'
        + '<button class="tt-ico" title="Hacer la imagen y llevarla a 🎬 Biblioteca › Por usar" onclick="disUsar(' + f.id + ')">📤</button><button class="tt-ico" title="Archivar (se puede restaurar)" onclick="disEstado(' + f.id + ',\'archivada\')">🗄</button>') : '';
  const estSel = DIS.puede && est !== 'archivada' ? '<select class="dis-est" onchange="disEstado(' + f.id + ',this.value)">' + ['borrador', 'prueba', 'ganadora'].map(k => '<option value="' + k + '"' + (k === est ? ' selected' : '') + '>' + DIS_EST[k] + '</option>').join('') + '</select>'
    : '<span class="ui-chip ' + chip + '">' + DIS_EST[est] + '</span>';
  const msj = (DIS_MSJ.find(x => x[0] === f.mensaje) || ['', f.mensaje])[1];
  return '<div class="dis-tarj"><div class="dis-mini" id="disMini' + f.id + '" onclick="' + (DIS.puede && est !== 'archivada' ? 'disEditar(' + f.id + ')' : '') + '"></div>'
    + '<div class="dis-tarj-pie"><div class="ui-tot dis-nom" title="' + disA(f.nombre) + '">' + esc(f.nombre) + '</div>'
    + '<div class="ui-nota">' + (f.formato === '9x16' ? '9:16' : '4:5') + ' · ' + esc(msj) + (f.usos ? ' · ' + f.usos + ' usos' : '') + (f.padre_id ? ' · copia de #' + f.padre_id : '') + '</div>'
    + '<div class="dis-acc">' + estSel + '<span style="flex:1"></span>' + ac + '</div></div></div>';
}
async function _disMini(f){
  const box = document.getElementById('disMini' + f.id); if (!box) return;
  const aj = f.ajustes || {}, p = _disProd(aj.prev_handle); if (!p){ box.innerHTML = '<div class="ui-nota">Sin productos</div>'; return; }
  const inf = await disInfo(p.handle), W = (DIS_TAM[f.formato] || DIS_TAM['4x5'])[0];
  box.innerHTML = disHtml(f, disCtx(p, inf, aj.prev_color, aj), 200 / W, { ancho: 400 });
}

/* ── crear, duplicar, estado ── */
function disNuevoAbrir(){
  const p = (DIS.prods || [])[0];
  let h = '<div class="dis-modal" id="disNuevo"><div class="dis-caja" style="max-width:900px"><div class="dis-cab"><span class="ui-pag">Nuevo diseño</span><span style="flex:1"></span>'
    + '<select id="disNuevoForm"><option value="4x5">4:5 feed</option><option value="9x16">9:16 historias y reels</option></select>'
    + '<button class="tt-ico" onclick="document.getElementById(\'disNuevo\').remove()" title="Cerrar">✕</button></div><div class="ui-nota" style="margin:0 0 10px">Elige una plantilla de arranque. Todo se puede cambiar después.</div><div class="dis-grilla">';
  DIS_BASE.forEach((b, i) => { h += '<div class="dis-tarj" style="cursor:pointer" onclick="disNuevo(' + i + ')"><div class="dis-mini" id="disBase' + i + '"></div><div class="dis-tarj-pie"><div class="ui-tot">' + esc(b.nombre) + '</div></div></div>'; });
  h += '<div class="dis-tarj" style="cursor:pointer" onclick="disNuevo(-1)"><div class="dis-mini dis-blanco">＋ En blanco</div><div class="dis-tarj-pie"><div class="ui-tot">En blanco</div></div></div></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
  if (p) disInfo(p.handle).then(inf => DIS_BASE.forEach((b, i) => { const el = document.getElementById('disBase' + i); if (el) el.innerHTML = disHtml({ formato: '4x5', capas: b.capas }, disCtx(p, inf), 200 / 1080, { ancho: 400 }); }));
}
function disNuevo(i){
  const b = DIS_BASE[i], form = (document.getElementById('disNuevoForm') || {}).value || '4x5';
  const n = document.getElementById('disNuevo'); if (n) n.remove();
  const p = (DIS.prods || [])[0];
  DIS.ed = { id: null, nombre: b ? b.nombre : 'Diseño nuevo', formato: form, tipo: 'estatico', mensaje: b ? b.mensaje : 'producto', capas: JSON.parse(JSON.stringify(b ? b.capas : [])), ajustes: { prev_handle: p ? p.handle : '' }, padre_id: null, _sucio: true };
  DIS.sel = -1; DIS.prod = DIS.ed.ajustes.prev_handle; DIS.color = '';
  _disEdAbrir();
}
async function disDuplicar(id){
  const f = (DIS.filas || []).find(x => x.id === id); if (!f) return;
  try {
    const r = await _mklSb('/rest/v1/rpc/mk_diseno_guardar', { method: 'POST', body: JSON.stringify({ p_id: null, p_datos: { nombre: (f.nombre + ' (copia)').slice(0, 120), formato: f.formato, tipo: f.tipo, mensaje: f.mensaje, capas: f.capas, ajustes: f.ajustes, padre_id: f.id } }) });
    if (!r || !r.ok) throw new Error((r && r.error) || 'no se guardó');
    DIS.filas.unshift(r.fila); DIS.msg = 'Copia creada: ' + esc(r.fila.nombre) + '.'; DIS.ver = 'activos'; disPintar();
  } catch (e) { DIS.msg = '<span class="mal">No pude duplicar (' + esc(e.message) + ').</span>'; disPintar(); }
}
async function disEstado(id, est){
  try {
    const r = await _mklSb('/rest/v1/rpc/mk_diseno_estado', { method: 'POST', body: JSON.stringify({ p_id: id, p_estado: est }) });
    if (!r || !r.ok) throw new Error((r && r.error) || 'no se guardó');
    const i = DIS.filas.findIndex(x => x.id === id); if (i >= 0) DIS.filas[i] = r.fila;
    DIS.msg = est === 'archivada' ? 'Archivado. Está en «Archivados» y se puede restaurar.' : ''; disPintar();
  } catch (e) { DIS.msg = '<span class="mal">No pude cambiar el estado (' + esc(e.message) + ').</span>'; disPintar(); }
}

/* ── editor ── */
function disEditar(id){
  const f = (DIS.filas || []).find(x => x.id === id); if (!f) return;
  DIS.ed = JSON.parse(JSON.stringify(f)); DIS.ed.ajustes = DIS.ed.ajustes || {};
  DIS.sel = -1; DIS.prod = DIS.ed.ajustes.prev_handle || ((DIS.prods || [])[0] || {}).handle || ''; DIS.color = DIS.ed.ajustes.prev_color || '';
  _disEdAbrir();
}
function _disEdAbrir(){
  const v = document.getElementById('disEd'); if (v) v.remove();
  const prods = (DIS.prods || []).map(p => '<option value="' + disA(p.handle) + '"' + (p.handle === DIS.prod ? ' selected' : '') + '>' + esc(p.titulo) + (p.estado !== 'active' ? ' (borrador)' : '') + '</option>').join('');
  const h = '<div class="dis-modal" id="disEd"><div class="dis-caja dis-ed"><div class="dis-cab">'
    + '<input id="disEdNombre" value="' + disA(DIS.ed.nombre) + '" maxlength="120" style="width:220px" oninput="DIS.ed.nombre=this.value;DIS.ed._sucio=true">'
    + '<select onchange="DIS.ed.formato=this.value;DIS.ed._sucio=true;disEdPintar()"><option value="4x5"' + (DIS.ed.formato === '4x5' ? ' selected' : '') + '>4:5 feed</option><option value="9x16"' + (DIS.ed.formato === '9x16' ? ' selected' : '') + '>9:16 historias</option></select>'
    + '<select onchange="DIS.ed.mensaje=this.value;DIS.ed._sucio=true">' + DIS_MSJ.map(o => '<option value="' + o[0] + '"' + (DIS.ed.mensaje === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>'
    + '<span class="ui-nota">Probar con</span><select id="disEdProd" onchange="disEdProd(this.value)" style="max-width:230px">' + prods + '</select><select id="disEdColor" onchange="DIS.color=this.value;disEdPintar()"></select>'
    + '<button class="btn" onclick="disEdProd(null,1)" title="Siguiente producto">▶</button><span style="flex:1"></span><span class="ui-nota" id="disEdRes"></span>'
    + '<button class="btn" onclick="disUsar(null)" title="Guardar, hacer la imagen y llevarla a 🎬 Biblioteca › Por usar">📤 A Por usar</button>'
    + '<button class="btn on" onclick="disGuardar()">Guardar diseño</button><button class="tt-ico" onclick="disEdCerrar()" title="Cerrar">✕</button></div>'
    + '<div class="dis-ed-cuerpo"><div class="dis-ed-lienzo" id="disEdLienzo"></div><div class="dis-ed-panel" id="disEdPanel"></div></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
  _disArrastreIni(); disEdPintar();
}
async function disEdCerrar(){
  if (DIS.ed && DIS.ed._sucio && !await _uiSeguro('Hay cambios sin guardar. ¿Cerrar igual?', 'Cerrar sin guardar')) return;
  const v = document.getElementById('disEd'); if (v) v.remove(); DIS.ed = null;
}
function disEdProd(handle, paso){
  const L = DIS.prods || []; if (paso){ const i = L.findIndex(p => p.handle === DIS.prod); handle = (L[(i + 1) % L.length] || {}).handle; const s = document.getElementById('disEdProd'); if (s) s.value = handle; }
  DIS.prod = handle; DIS.color = ''; disEdPintar();
}
function _disLienzoRepintar(){ const lz = document.getElementById('disEdLienzo'); if (lz && DIS.ed && DIS._cx) lz.innerHTML = disHtml(DIS.ed, DIS._cx, DIS._s, { edit: true, sel: DIS.sel, guia: true, ancho: 800 }); }
async function disEdPintar(){
  if (!DIS.ed) return;
  const p = _disProd(DIS.prod), inf = p ? await disInfo(p.handle) : {};
  if (!DIS.ed) return;
  const cx = disCtx(p, inf, DIS.color, DIS.ed.ajustes); DIS.color = cx.color; DIS._cx = cx;
  const cs = document.getElementById('disEdColor'); if (cs) cs.innerHTML = cx.colores.map(c => '<option' + (c === cx.color ? ' selected' : '') + '>' + esc(c) + '</option>').join('') || '<option value="">Sin color</option>';
  const lz = document.getElementById('disEdLienzo'); if (!lz) return;
  const [W, H] = DIS_TAM[DIS.ed.formato] || DIS_TAM['4x5'], alto = Math.max(320, lz.clientHeight - 8), ancho = Math.max(240, lz.clientWidth - 8);
  DIS._s = Math.min(alto / H, ancho / W);
  _disLienzoRepintar(); _disPanel(cx);
}
function _disCapaNombre(c){
  return c.t === 'texto' ? '🔤 ' + (String(c.txt || '').slice(0, 22) || 'Texto') : c.t === 'foto' ? '🖼 Foto' : c.t === 'forma' ? '▭ Forma' : c.t === 'logo' ? '◆ Logo' : c.t === 'lista' ? '✓ Beneficios' : '🎨 Colores';
}
function _disPanel(cx){
  const pn = document.getElementById('disEdPanel'); if (!pn || !DIS.ed) return;
  const C = DIS.ed.capas;
  let h = '<div class="ui-blo">Capas <span class="ui-nota">la de arriba se ve adelante</span></div><div class="dis-capas">' + C.map((c, i) => '<div class="dis-capa' + (DIS.sel === i ? ' on' : '') + '" onclick="DIS.sel=' + i + ';disEdPintar()">'
    + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(_disCapaNombre(c)) + (c.vis && c.vis !== 'siempre' ? ' <span class="ui-nota">· ' + esc((DIS_VIS.find(v => v[0] === c.vis) || ['', ''])[1]) + '</span>' : '') + '</span>'
    + '<button class="tt-ico" title="' + (c.oculto ? 'Mostrar' : 'Ocultar') + '" onclick="event.stopPropagation();disCapaSet(' + i + ',\'oculto\',' + !c.oculto + ')">' + (c.oculto ? '🙈' : '👁') + '</button>'
    + '<button class="tt-ico" title="Adelante" onclick="event.stopPropagation();disCapaMover(' + i + ',1)">▲</button><button class="tt-ico" title="Atrás" onclick="event.stopPropagation();disCapaMover(' + i + ',-1)">▼</button>'
    + '<button class="tt-ico" title="Quitar" onclick="event.stopPropagation();disCapaQuitar(' + i + ')">🗑</button></div>').reverse().join('') + '</div>'
    + '<div class="dis-add">' + [['texto', '＋ Texto'], ['foto', '＋ Foto'], ['forma', '＋ Forma'], ['logo', '＋ Logo'], ['lista', '＋ Beneficios'], ['colores', '＋ Colores']].map(x => '<button class="btn" onclick="disCapaAgregar(\'' + x[0] + '\')">' + x[1] + '</button>').join('') + '</div>';
  const c = C[DIS.sel];
  if (c) h += '<div class="ui-blo" style="margin-top:12px">' + esc(_disCapaNombre(c)) + '</div>' + _disProps(c, DIS.sel, cx);
  h += _disBenPanel(cx);
  h += '<div class="ui-nota" style="margin-top:12px">Precio, tachado, colores y tallas: tienda en vivo · Beneficios y frase: ficha de Shopify.' + (DIS.ed.formato === '9x16' ? ' Rayado = zona que tapa Instagram.' : '') + '</div>';
  pn.innerHTML = h;
}
function _disProps(c, i, cx){
  const num = (k, t, paso) => '<label class="dis-prop"><span class="ui-nota">' + t + '</span><input type="number" step="' + (paso || 1) + '" value="' + (c[k] != null ? c[k] : '') + '" onchange="disCapaSet(' + i + ',\'' + k + '\',this.value===\'\'?null:+this.value)"></label>';
  const selc = (k, t, ops, v) => '<label class="dis-prop"><span class="ui-nota">' + t + '</span><select onchange="disCapaSet(' + i + ',\'' + k + '\',this.value)">' + ops.map(o => '<option value="' + o[0] + '"' + (String(v != null ? v : (c[k] != null ? c[k] : '')) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>';
  const chk = (k, t) => '<label class="dis-prop dis-chk"><input type="checkbox"' + (c[k] ? ' checked' : '') + ' onchange="disCapaSet(' + i + ',\'' + k + '\',this.checked)"> <span class="ui-nota">' + t + '</span></label>';
  let h = '<div class="dis-props">' + num('x', 'X %', 0.5) + num('y', 'Y %', 0.5) + num('w', 'Ancho %', 0.5) + (c.t === 'foto' || c.t === 'forma' || c.t === 'colores' ? num('h', 'Alto %', 0.5) : '') + '</div>';
  if (c.t === 'texto'){
    h += '<label class="dis-prop" style="width:100%"><span class="ui-nota">Texto (los campos se llenan solos)</span><textarea rows="2" style="width:100%" oninput="disCapaSet(' + i + ',\'txt\',this.value,1)">' + esc(c.txt || '') + '</textarea></label>'
      + '<div class="dis-campos">' + DIS_CAMPOS.map(x => '<button class="dis-campo" title="' + disA(_disTxt(cx, x[0]) || '(vacío en este producto)') + '" onclick="disCampoInsertar(' + i + ',\'' + x[0] + '\')">' + x[1] + '</button>').join('') + '</div>'
      + '<div class="dis-props">' + selc('fuente', 'Letra', [['titulo', 'Títulos'], ['texto', 'Texto']]) + num('tam', 'Tamaño') + selc('peso', 'Grosor', [['400', 'Normal'], ['500', 'Medio'], ['600', 'Negrita']], String(c.peso || 400))
      + selc('color', 'Color', DIS_COLS) + selc('fondo', 'Fondo', [['', 'Ninguno']].concat(DIS_COLS)) + num('pad', 'Relleno') + num('r', 'Redondeo') + selc('al', 'Alinear', [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']], c.al || 'left') + num('ls', 'Espaciado', 0.5) + '</div>'
      + '<div class="dis-props">' + chk('mayus', 'MAYÚSCULAS') + chk('tachado', 'Tachado') + '</div>';
  } else if (c.t === 'foto'){
    const n = cx.fotos.length, ops = [];
    for (let k = 0; k < 6; k++) ops.push(['color:' + k, k ? 'Foto ' + (k + 1) + ' del color' : 'Portada del color']);
    cx.ben.forEach((b, k) => ops.push(['ben:' + k, 'Foto del beneficio ' + (k + 1)]));
    for (let k = 0; k < n; k++) ops.push(['n:' + k, 'Foto ' + (k + 1) + ' de ' + n + ' (todas)']);
    h += '<div class="dis-props">' + selc('src', 'Foto', ops, c.src || 'color:0') + selc('fit', 'Encaje', [['cover', 'Llenar'], ['contain', 'Entera']], c.fit || 'cover') + selc('pos', 'Enfoque', [['center top', 'Arriba'], ['center center', 'Centro'], ['center bottom', 'Abajo']], c.pos || 'center top') + num('r', 'Redondeo') + '</div>';
  } else if (c.t === 'forma'){
    h += '<div class="dis-props">' + selc('color', 'Color', DIS_COLS) + num('op', 'Opacidad 0-1', 0.05) + num('r', 'Redondeo') + '</div>';
  } else if (c.t === 'logo'){
    h += '<div class="dis-props">' + chk('claro', 'Logo blanco (sobre fondo oscuro)') + '</div>';
  } else if (c.t === 'lista'){
    h += '<div class="dis-props">' + num('max', 'Cuántos') + num('tam', 'Tamaño') + selc('color', 'Color', DIS_COLS) + '</div><div class="dis-props">' + chk('detalle', 'Con detalle debajo') + '</div>';
  }
  h += '<div class="dis-props">' + selc('vis', 'Se muestra', DIS_VIS, c.vis || 'siempre') + '</div>';
  return h;
}
/* beneficios: los de Shopify, elegibles y editables POR PRODUCTO (se guardan en el diseño) */
function _disBenPanel(cx){
  const p = cx.p; if (!p || !p.handle) return '';
  const base = cx.benBase, aj = DIS.ed.ajustes.ben && DIS.ed.ajustes.ben[p.handle];
  const L = Array.isArray(aj) ? aj : base.map((b, k) => Object.assign({}, b, { on: k < 3 }));
  let h = '<div class="ui-blo" style="margin-top:12px">Beneficios de ' + esc(p.titulo) + ' <span class="ui-nota">' + base.length + ' en Shopify</span></div>';
  if (!L.length) return h + '<div class="ui-nota">Esta prenda no tiene beneficios en su ficha de Shopify.</div>';
  return h + L.map((b, k) => '<div class="dis-ben"><input type="checkbox"' + (b.on !== false ? ' checked' : '') + ' onchange="disBenSet(' + k + ',\'on\',this.checked)" title="Usar este beneficio">'
    + '<div style="flex:1;min-width:0"><input value="' + disA(b.titulo) + '" oninput="disBenSet(' + k + ',\'titulo\',this.value)" style="width:100%">'
    + '<input value="' + disA(b.texto) + '" oninput="disBenSet(' + k + ',\'texto\',this.value)" style="width:100%;margin-top:3px"></div></div>').join('')
    + (Array.isArray(aj) ? '<button class="btn" style="margin-top:6px" onclick="disBenReset()">↺ Volver a los de Shopify</button>' : '');
}
function disBenSet(k, campo, v){
  const p = DIS._cx && DIS._cx.p; if (!p || !DIS.ed) return;
  const aj = DIS.ed.ajustes; aj.ben = aj.ben || {};
  if (!Array.isArray(aj.ben[p.handle])) aj.ben[p.handle] = DIS._cx.benBase.map((b, i) => Object.assign({}, b, { on: i < 3 }));
  aj.ben[p.handle][k][campo] = v; DIS.ed._sucio = true;
  if (campo === 'on') return disEdPintar();
  clearTimeout(DIS._bt); DIS._bt = setTimeout(() => { DIS._cx = disCtx(p, DIS.info[p.handle], DIS.color, aj); _disLienzoRepintar(); }, 300);
}
function disBenReset(){ const p = DIS._cx && DIS._cx.p; if (p && DIS.ed.ajustes.ben) delete DIS.ed.ajustes.ben[p.handle]; DIS.ed._sucio = true; disEdPintar(); }
function disCapaSet(i, k, v, suave){
  const c = DIS.ed && DIS.ed.capas[i]; if (!c) return;
  if (v === '' && k === 'fondo') delete c[k]; else c[k] = (k === 'peso' ? +v : v);
  DIS.ed._sucio = true;
  if (suave){ clearTimeout(DIS._ct); DIS._ct = setTimeout(_disLienzoRepintar, 250); return; }
  disEdPintar();
}
function disCampoInsertar(i, campo){ const c = DIS.ed.capas[i]; if (!c) return; c.txt = (c.txt ? c.txt + ' ' : '') + campo; DIS.ed._sucio = true; disEdPintar(); }
function disCapaMover(i, d){ const C = DIS.ed.capas, j = i + d; if (j < 0 || j >= C.length) return; const t = C[i]; C[i] = C[j]; C[j] = t; DIS.sel = j; DIS.ed._sucio = true; disEdPintar(); }
async function disCapaQuitar(i){ if (!await _uiSeguro('¿Quitar esta capa del diseño?', 'Quitar')) return; DIS.ed.capas.splice(i, 1); DIS.sel = -1; DIS.ed._sucio = true; disEdPintar(); }
function disCapaAgregar(t){
  const n = { texto: { t, txt: '{{nombre}}', x: 8, y: 40, w: 84, tam: 56, fuente: 'titulo', color: 'blanco' }, foto: { t, src: 'color:1', x: 55, y: 55, w: 40, h: 40, r: 12 },
    forma: { t, x: 0, y: 80, w: 100, h: 20, color: 'principal', op: 0.8 }, logo: { t, x: 6, y: 4, w: 24 }, lista: { t, x: 8, y: 30, w: 84, tam: 32, color: 'blanco', icono: '✓', max: 3 }, colores: { t, x: 6, y: 84, w: 88, h: 12 } }[t];
  DIS.ed.capas.push(n); DIS.sel = DIS.ed.capas.length - 1; DIS.ed._sucio = true; disEdPintar();
}
/* arrastrar una capa sobre el lienzo para moverla */
function _disArrastreIni(){
  const lz = document.getElementById('disEdLienzo'); if (!lz) return;
  lz.addEventListener('mousedown', e => {
    const el = e.target.closest('[data-capa]'); if (!el || !DIS.ed) return;
    e.preventDefault(); const i = +el.dataset.capa, c = DIS.ed.capas[i], cont = lz.querySelector('.dis-lienzo'); if (!c || !cont) return;
    if (DIS.sel !== i){ DIS.sel = i; _disPanel(DIS._cx); lz.querySelectorAll('[data-capa]').forEach(x => { x.style.outline = ''; }); el.style.outline = '2px dashed #7c5cff'; }
    const W = cont.clientWidth, H = cont.clientHeight, x0 = e.clientX, y0 = e.clientY, cx0 = +c.x || 0, cy0 = +c.y || 0;
    const mv = ev => { c.x = Math.round((cx0 + (ev.clientX - x0) / W * 100) * 2) / 2; c.y = Math.round((cy0 + (ev.clientY - y0) / H * 100) * 2) / 2; el.style.left = c.x + '%'; el.style.top = c.y + '%'; DIS.ed._sucio = true; };
    const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); _disPanel(DIS._cx); };
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
  });
}
async function disGuardar(callado){
  const res = document.getElementById('disEdRes'), d = DIS.ed; if (!d) return null;
  d.nombre = String(d.nombre || '').trim(); if (d.nombre.length < 2){ if (res) res.innerHTML = '<span class="mal">Ponle nombre al diseño.</span>'; return null; }
  d.ajustes.prev_handle = DIS.prod; d.ajustes.prev_color = DIS.color;
  if (res) res.textContent = 'Guardando…';
  try {
    const r = await _mklSb('/rest/v1/rpc/mk_diseno_guardar', { method: 'POST', body: JSON.stringify({ p_id: d.id || null, p_datos: { nombre: d.nombre, formato: d.formato, tipo: d.tipo || 'estatico', mensaje: d.mensaje, capas: d.capas, ajustes: d.ajustes, padre_id: d.padre_id || null } }) });
    if (!r || !r.ok) throw new Error((r && r.error) || 'no se guardó');
    const i = DIS.filas.findIndex(x => x.id === r.fila.id); if (i >= 0) DIS.filas[i] = r.fila; else DIS.filas.unshift(r.fila);
    d.id = r.fila.id; d._sucio = false; if (res) res.textContent = '✓ Guardado';
    if (!callado) disPintar();
    return r.fila;
  } catch (e) { if (res) res.innerHTML = '<span class="mal">No se guardó (' + esc(e.message) + ').</span>'; return null; }
}

/* ── imagen final (PNG 1080) y paso a 🎬 Biblioteca › Por usar ── */
function _disFuentes(){
  if (document.getElementById('disFuentes')) return;
  const l = document.createElement('link'); l.id = 'disFuentes'; l.rel = 'stylesheet'; l.crossOrigin = 'anonymous';
  l.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Tenor+Sans&display=swap'; document.head.appendChild(l);
}
async function _disLib(){
  if (window.htmlToImage) return;
  await new Promise((ok, mal) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js'; s.onload = ok; s.onerror = () => mal(new Error('no cargó el generador de imágenes')); document.head.appendChild(s); });
}
async function disPng(d, cx){
  _disFuentes(); await _disLib();
  const m = DIS.marca || DIS_MARCA_DEF;
  try { await Promise.all([document.fonts.load("60px '" + m.f_titulo + "'"), document.fonts.load("600 60px '" + m.f_texto + "'"), document.fonts.load("60px '" + m.f_texto + "'")]); } catch (_) {}
  const [W, H] = DIS_TAM[d.formato] || DIS_TAM['4x5'];
  const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-20000px;top:0;z-index:-1';
  box.innerHTML = disHtml(d, cx, 1, { ancho: 1200 }); document.body.appendChild(box);
  const el = box.firstChild;
  try {
    await Promise.all([...el.querySelectorAll('img')].map(im => im.complete && im.naturalWidth ? 0 : new Promise(r => { im.onload = im.onerror = r; setTimeout(r, 15000); })));
    const malas = [...el.querySelectorAll('img')].filter(im => !im.naturalWidth).length;
    if (malas) throw new Error(malas + (malas > 1 ? ' fotos no cargaron' : ' foto no cargó'));
    const blob = await window.htmlToImage.toBlob(el, { width: W, height: H, pixelRatio: 1, backgroundColor: _disCol('fondo') });
    if (!blob) throw new Error('la imagen salió vacía');
    return blob;
  } finally { box.remove(); }
}
function _disProdNom(titulo){
  /* «Pantalón NAVIGATA» → el valor de 🏷️ Listas que tenga NAVIGATA (ej. «Pan Navigata») */
  try {
    const L = mkNomLista('prod') || [], pal = _mkNorm(titulo).split(/\s+/).filter(w => w.length > 3), tipo = _mkNorm(titulo).slice(0, 3);
    const c = L.filter(v => { const n = _mkNorm(v); return pal.some(w => n.indexOf(w) >= 0); });
    return c.find(v => _mkNorm(v).indexOf(tipo) === 0) || c[0] || '';
  } catch (_) { return ''; }
}
async function disUsar(id){
  if (id != null){ const f = (DIS.filas || []).find(x => x.id === id); if (!f) return; DIS.ed = JSON.parse(JSON.stringify(f)); DIS.ed.ajustes = DIS.ed.ajustes || {}; DIS.prod = DIS.ed.ajustes.prev_handle || ((DIS.prods || [])[0] || {}).handle; DIS.color = DIS.ed.ajustes.prev_color || ''; }
  const d = DIS.ed; if (!d) return;
  const res = document.getElementById('disEdRes'), avisar = t => { if (res) res.innerHTML = t; else { DIS.msg = t; disPintar(); } };
  if (!d.id || d._sucio){ const g = await disGuardar(true); if (!g) return; }
  avisar('Haciendo la imagen…');
  try {
    const p = _disProd(DIS.prod), inf = await disInfo(p.handle), cx = disCtx(p, inf, DIS.color, d.ajustes);
    const blob = await disPng(d, cx);
    const nomArch = ('DIS' + d.id + '-' + p.handle + '-' + (cx.color || 'unico') + '-' + d.formato).replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '.png';
    const file = new File([blob], nomArch, { type: 'image/png' });
    try { await _mklSb('/rest/v1/rpc/mk_diseno_usado', { method: 'POST', body: JSON.stringify({ p_id: d.id }) }); const f = DIS.filas.find(x => x.id === d.id); if (f) f.usos = (f.usos || 0) + 1; } catch (_) {}
    const v = document.getElementById('disEd'); if (v) v.remove(); DIS.ed = null; DIS.msg = '';
    mkIrSub('contenido'); await mkcrAbrir(); mkcrSubirAbrir(null);
    MKCR.disenoId = d.id;   /* mkcrGuardar lo deja en campos.diseno: así el creativo (y su anuncio) sabe de qué plantilla salió */
    mkcrArchivo([file]);
    const pr = document.getElementById('mkcrProd'), nom = _disProdNom(p.titulo);
    if (pr && nom){ pr.value = nom; pr.dispatchEvent(new Event('input', { bubbles: true })); }
    try { mkcrNombreArmar(); } catch (_) {}
  } catch (e) { avisar('<span class="mal">No pude hacer la imagen (' + esc(e.message) + ').</span>'); }
}

/* ── marca (aprobación de Pablo) ── */
function disMarcaAbrir(){
  const m = DIS.marca || DIS_MARCA_DEF, col = (k, t) => '<label class="dis-prop"><span class="ui-nota">' + t + '</span><input type="color" id="disM_' + k + '" value="' + disA(m[k]) + '"></label>';
  const h = '<div class="dis-modal" id="disMarca"><div class="dis-caja" style="max-width:560px"><div class="dis-cab"><span class="ui-pag">Marca de las plantillas</span><span style="flex:1"></span><button class="tt-ico" onclick="document.getElementById(\'disMarca\').remove()" title="Cerrar">✕</button></div>'
    + '<div class="ui-nota" style="margin-bottom:10px">Sacada de tulula.com.pe. Se aplica a todos los diseños.</div><div class="dis-props">'
    + '<label class="dis-prop"><span class="ui-nota">Letra de títulos</span><input id="disM_f_titulo" value="' + disA(m.f_titulo) + '"></label>'
    + '<label class="dis-prop"><span class="ui-nota">Letra de textos</span><input id="disM_f_texto" value="' + disA(m.f_texto) + '"></label></div><div class="dis-props">'
    + col('c_principal', 'Principal') + col('c_acento', 'Acento') + col('c_texto', 'Texto') + col('c_fondo', 'Fondo') + col('c_oferta', 'Oferta') + '</div>'
    + '<label class="dis-prop" style="width:100%"><span class="ui-nota">Logo (PNG)</span><input id="disM_logo_oscuro" value="' + disA(m.logo_oscuro) + '" style="width:100%"></label>'
    + '<div class="dis-acc" style="margin-top:12px"><span class="ui-nota" id="disMRes"></span><span style="flex:1"></span><button class="btn" onclick="disMarcaGuardar(false)">Guardar</button><button class="btn on" onclick="disMarcaGuardar(true)">✓ Aprobar marca</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
}
async function disMarcaGuardar(aprobar){
  const v = Object.assign({}, DIS.marca || DIS_MARCA_DEF);
  ['f_titulo', 'f_texto', 'c_principal', 'c_acento', 'c_texto', 'c_fondo', 'c_oferta', 'logo_oscuro'].forEach(k => { const el = document.getElementById('disM_' + k); if (el && el.value.trim()) v[k] = el.value.trim(); });
  if (aprobar) v.aprobada = true;
  const res = document.getElementById('disMRes'); if (res) res.textContent = 'Guardando…';
  try {
    const r = await _mklSb('/rest/v1/rpc/mk_dis_marca_guardar', { method: 'POST', body: JSON.stringify({ p_valor: v }) });
    if (!r || !r.ok) throw new Error((r && r.error) || 'no se guardó');
    DIS.marca = v; const x = document.getElementById('disMarca'); if (x) x.remove(); DIS.msg = aprobar ? 'Marca aprobada.' : 'Marca guardada.'; disPintar();
  } catch (e) { if (res) res.innerHTML = '<span class="mal">No se guardó (' + esc(e.message) + ').</span>'; }
}

/* ── estilos (solo la pantalla del ERP; las letras de los anuncios son las de la marca) ── */
(function(){
  if (typeof document === 'undefined' || document.getElementById('disCss')) return;
  const s = document.createElement('style'); s.id = 'disCss';
  s.textContent = '#mkDis{padding:0 2px 12px;font-family:var(--ui-f)}'
    + '.dis-barra{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px}.dis-barra-izq,.dis-barra-der{display:flex;gap:6px;align-items:center;flex-wrap:wrap}'
    + '.dis-aviso{margin:-4px 0 12px}.dis-grilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:12px}'
    + '.dis-tarj{background:var(--card);border:1px solid var(--bd);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}'
    + '.dis-mini{display:flex;justify-content:center;align-items:center;background:#0e1118;padding:8px;min-height:120px;cursor:pointer}.dis-blanco{min-height:258px;color:var(--txt2);font:500 13px var(--ui-f)}'
    + '.dis-tarj-pie{padding:10px 12px;display:flex;flex-direction:column;gap:4px}.dis-nom{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.dis-acc{display:flex;align-items:center;gap:4px}.dis-est{font-size:12px;padding:3px 6px}'
    + '.dis-modal{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px}'
    + '.dis-caja{background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:14px 16px;width:100%;max-height:96vh;overflow:auto;font-family:var(--ui-f);color:var(--txt)}'
    + '.dis-cab{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}'
    + '.dis-ed{max-width:1400px;height:94vh;display:flex;flex-direction:column}.dis-ed-cuerpo{flex:1;min-height:0;display:flex;gap:14px}'
    + '.dis-ed-lienzo{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;background:#0e1118;border-radius:10px;user-select:none}'
    + '.dis-ed-panel{width:360px;flex-shrink:0;overflow:auto;padding-right:4px}'
    + '.dis-capas{display:flex;flex-direction:column;gap:2px;margin:6px 0 8px}.dis-capa{display:flex;align-items:center;gap:2px;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:13px;border:1px solid transparent}'
    + '.dis-capa:hover{background:var(--card)}.dis-capa.on{border-color:#7c5cff;background:var(--card)}'
    + '.dis-add{display:flex;flex-wrap:wrap;gap:4px}.dis-add .btn{font-size:12px;padding:4px 9px}'
    + '.dis-props{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.dis-prop{display:flex;flex-direction:column;gap:3px;min-width:76px}.dis-prop input[type=number]{width:76px}'
    + '.dis-chk{flex-direction:row;align-items:center;gap:6px}.dis-campos{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}'
    + '.dis-campo{background:var(--card);border:1px solid var(--bd);color:var(--txt2);border-radius:12px;padding:3px 9px;font:500 11px var(--ui-f);cursor:pointer}.dis-campo:hover{color:var(--txt);border-color:#7c5cff}'
    + '.dis-ben{display:flex;gap:8px;align-items:flex-start;margin-top:8px}.dis-ben input[type=checkbox]{margin-top:7px}';
  document.head.appendChild(s);
})();
