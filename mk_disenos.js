/* 21-nov-2026 · Marketing › 🎬 Creativos › 🎨 Diseños — FASE 1 (aprobada por Pablo).
   Plantillas de anuncio que se llenan solas con los datos de la tienda:
   · precio, precio tachado, colores, tallas con stock y portada de cada color → tienda pública  tulula.com.pe/products/<handle>.js
   · fotos en el orden del ERP, beneficios (3-5 por prenda) y frase gigante → copia de Shopify en la base (rpc mk_dis_productos)
   Base: public.mk_disenos + public.mk_dis_config (PEGAR_EN_SUPABASE_disenos_21nov.sql). Editan Admin y Marketing en Edición.
   Archivar en vez de borrar. «📤 A Por usar» = PNG listo → 🎬 Biblioteca › Por usar (ahí 🚀 Anuncio lo crea en Meta en pausa).
   Formatos: 4:5 (feed) y 9:16 (historias y reels, con zonas seguras de Meta). */
const DIS = { piezas: [], sinf: {}, lote: null, pz: null, filas: null, prods: null, marca: null, puede: false, info: {}, ver: 'plantillas', tipoNuevo: 'estatico', fForm: '', fMsj: '', q: '', ed: null, sel: -1, prod: '', color: '', msg: '' };
const DIS_TAM = { '4x5': [1080, 1350], '9x16': [1080, 1920], '1x1': [1080, 1080] };
const DIS_MSJ = [['producto','Producto'],['beneficios','Beneficios'],['oferta','Oferta'],['colores','Colores'],['preventa','Preventa'],['frase','Frase'],['resenas','Reseñas']];
const DIS_EST = { borrador: 'Borrador', prueba: 'En prueba', ganadora: 'Ganadora', archivada: 'Archivada' };
const DIS_VIS = [['siempre','Siempre'],['oferta','Solo en oferta'],['sin_oferta','Solo sin oferta'],['preventa','Solo en preventa'],['beneficios','Solo con beneficios'],['ultimas','Solo en últimas tallas'],['resenas','Solo con reseñas'],['cita','Solo con cita de clienta'],['sin_cita','Solo sin cita de clienta'],['badge','Solo si hay etiqueta'],['foto_clienta','Solo con reseña con foto'],['sin_foto_clienta','Solo sin reseña con foto'],['con_precio','Solo si se muestra el precio'],['junto','Solo si tiene prenda que se compra junta'],['sin_junto','Solo si no tiene prenda junta']];
const DIS_CAMPOS = [['{{nombre}}','Nombre'],['{{precio}}','Precio'],['{{precio_antes}}','Precio antes'],['{{descuento}}','% descuento'],['{{ahorro}}','Ahorro'],['{{frase}}','Frase gigante'],['{{color}}','Color'],['{{colores_n}}','N.º de colores'],['{{tallas}}','Tallas'],['{{ultimas}}','Últimas tallas'],['{{categoria}}','Categoría'],['{{nombre_corto}}','Nombre corto'],['{{estrellas}}','Estrellas'],['{{n_resenas}}','N.º reseñas'],['{{resena}}','Cita de clienta'],['{{resena_quien}}','Quién la dijo'],['{{badge}}','Etiqueta automática'],['{{ventaja1}}','Ventaja 1 (cuotas)'],['{{ventaja2}}','Ventaja 2'],['{{ventaja3}}','Ventaja 3'],['{{ventaja4}}','Ventaja 4'],['{{ventaja5}}','Ventaja 5 (envío S/ 200)'],['{{ventaja6}}','Ventaja 6 (envío 1.ª compra)'],['{{junto_nombre}}','Se compra junto con'],['{{fecha}}','Fecha comercial'],['{{fecha_frase}}','Frase de la fecha'],['{{fecha_sub}}','Detalle de la fecha'],['{{fecha_limite}}','Pide hasta… (llega a tiempo)'],['{{juntos_n}}','Clientas que las llevaron juntas'],['{{resena_foto_texto}}','Reseña con foto'],['{{beneficio1}}','Beneficio 1'],['{{beneficio2}}','Beneficio 2'],['{{beneficio3}}','Beneficio 3'],['{{beneficio1_texto}}','Detalle beneficio 1']];
const DIS_COLS = [['principal','Azul'],['acento','Naranja'],['fondo','Crema'],['suave','Gris azulado'],['texto','Texto'],['oferta','Oferta'],['blanco','Blanco'],['negro','Negro']];
const DIS_MARCA_DEF = { aprobada: false, f_titulo: 'Tenor Sans', f_texto: 'Jost', c_principal: '#173B61', c_acento: '#C15B07', c_texto: '#000000', c_fondo: '#EDEAE3', c_oferta: '#C15B07', c_suave: '#D3DBE5',   /* 21-nov · colores oficiales que pasó Pablo */
  logo_oscuro: 'https://cdn.shopify.com/s/files/1/0722/3564/7189/files/logo-oscuro_649cf6f9-9636-42ac-9f18-05f5af1ff2de.png' };
/* Zonas seguras 9:16 (guía de Meta para historias y reels): ~14% arriba y ~20% abajo los tapa la interfaz. */
const DIS_SEGURA = { arriba: 14, abajo: 20 };
/* 21-nov (capturas de Pablo) · muestras de color sólidas: nombre del ERP → color. Lo que no está sale con la foto del color. */
const DIS_COLOR_HEX = { negro: '#111111', blanco: '#f7f7f5', hueso: '#efe9dc', perla: '#e6e2da', crema: '#ede3cf', vainilla: '#f1e6c8', avena: '#d9cdb5', arena: '#cdb796', beige: '#d6c2a3', nude: '#d9b9a0',
  camel: '#b58552', toffee: '#9a6b43', moca: '#7a5642', cocoa: '#6b4a3a', chocolate: '#4e3427', marron: '#6a4a35', topo: '#7d7266', plomo: '#8c8c8c', azul: '#1f4f8f', azulino: '#3d6fd1', celeste: '#9cc3e6',
  'azul noche': '#1b2a44', 'azul marino': '#1d2b4f', 'azul acero': '#4f6f8f', 'azul presidente': '#203a7a', verde: '#2f6b48', 'verde botella': '#1f4a35', 'verde jade': '#3f9a82', 'verde perico': '#5cae3c', 'verde claro': '#9cc79a', 'verde oscuro': '#1e3d2c',
  rojo: '#b3202a', vino: '#6b1f2e', lacre: '#8e1c22', ladrillo: '#a3492f', coral: '#e8735f', naranja: '#e07a2e', mostaza: '#c99a2e', amarillo: '#e9c53b', dorado: '#c8a24a', rosa: '#e8a9b8', palorosa: '#d8a7a7', fucsia: '#c81d77', lila: '#b9a3d6', 'uva pastel': '#a58fc0', morado: '#5c2f73' };
function _disColorHex(n){ const s = String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-_]/g, ' ').trim();
  if (DIS_COLOR_HEX[s]) return DIS_COLOR_HEX[s]; const dos = s.split(/\s+/).slice(0, 2).join(' '); if (DIS_COLOR_HEX[dos]) return DIS_COLOR_HEX[dos]; return DIS_COLOR_HEX[s.split(/\s+/)[0]] || ''; }
/* 21-nov · Historias 9:16 SIN que nada caiga donde Instagram tapa (Pablo: «arriba y abajo se va a tapar»).
   Las capas se diseñan en 4:5; en 9:16 se acomodan solas dentro de la franja segura (14 % arriba · 20 % abajo),
   los fondos de borde a borde siguen ocupando todo. Si la mueves estando en 9:16, esa capa guarda su propio lugar (g916). */
function _disGeo(c, f){
  const g = { x: +c.x || 0, y: +c.y || 0, w: c.w != null ? +c.w : 100, h: c.h != null ? +c.h : null };
  if (f !== '9x16') return g;
  if (c.g916) return Object.assign(g, c.g916);
  const A = DIS_SEGURA.arriba, B = DIS_SEGURA.abajo, k = (100 - A - B) / 100, m = y => Math.round((A + y * k) * 10) / 10;
  const arriba = g.y <= 0.5, abajo = g.h != null && g.y + g.h >= 99.5;
  if (g.h != null && arriba && abajo) return g;                        /* de borde a borde: igual */
  if (g.h != null && arriba){ g.h = m(g.y + g.h); g.y = 0; return g; }  /* pegada arriba: estira hasta su borde */
  if (abajo){ g.y = m(g.y); g.h = 100 - g.y; return g; }               /* pegada abajo: llega al borde */
  g.y = m(g.y); if (g.h != null) g.h = Math.round(g.h * k * 10) / 10; return g;
}
function _disGeoSet(c, f, g){
  if (f === '9x16'){ c.g916 = { x: g.x, y: g.y, w: g.w }; if (g.h != null) c.g916.h = g.h; return; }
  c.x = g.x; c.y = g.y; c.w = g.w; if (g.h != null) c.h = g.h;
}
/* 21-nov · el logo se ve SIEMPRE (Pablo: «el logo blanco sobre fondo casi blanco no se ve»): en «Automático» mira qué hay detrás
   (foto, forma, degradado o el fondo) y elige azul de marca o blanco. */
const DIS_LOGO_COL = [['auto', 'Automático (se ve siempre)'], ['principal', 'Azul de marca'], ['blanco', 'Blanco'], ['negro', 'Negro']];
function _disLum(hex){ const h = String(hex || '#000').replace('#', ''), n = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6), v = parseInt(n, 16) || 0;
  return (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255; }
function _disLogoColor(c){ return c.color || (c.claro ? 'blanco' : 'auto'); }
function _disPosPct(c){
  if (c.fx != null || c.fy != null) return [c.fx != null ? +c.fx : 50, c.fy != null ? +c.fy : 0];
  const t = String(c.pos || 'center top').split(/\s+/), v = s => s === 'left' || s === 'top' ? 0 : s === 'right' || s === 'bottom' ? 100 : s === 'center' ? 50 : parseFloat(s) || 0;
  return [v(t[0] || 'center'), v(t[1] || 'top')];
}
function _disLuzClave(u, r){ return u + '|' + r.map(v => Math.round(v * 100)).join(','); }
function _disLogoTono(d, cx, i, gl){
  const f = d.formato, [W, H] = DIS_TAM[f] || DIS_TAM['4x5'], px = gl.x + gl.w / 2, lh = gl.w * 0.22 * W / H, py = gl.y + lh / 2;
  DIS._mix = 0;
  for (let j = i - 1; j >= 0; j--){
    const c = d.capas[j]; if (!c || !_disVis(c, cx) || !/^(foto|forma|degradado)$/.test(c.t)) continue;
    const g = _disGeo(c, f), h = g.h != null ? g.h : 100;
    if (px < g.x || px > g.x + g.w || py < g.y || py > g.y + h) continue;
    if (c.t === 'forma'){ if (c.op != null && +c.op < 0.45) continue; return _disLum(_disCol(c.color)); }
    if (c.t === 'degradado'){ const t = { abajo: (g.y + h - py) / h, arriba: (py - g.y) / h, izq: (px - g.x) / g.w, der: (g.x + g.w - px) / g.w }[c.desde || 'abajo'];
      const a = (c.op != null ? +c.op : 0.8) * (1 - Math.max(0, Math.min(1, t))); if (a < 0.45) continue; return _disLum(_disCol(c.color)); }
    const u0 = _disFotoSrc(cx, c.src), sf = c.sinfondo && DIS.sinf[_disArch(u0)]; if (!u0) continue;
    const r = [(gl.x - g.x) / g.w, (gl.y - g.y) / h, gl.w / g.w, lh / h], v = (DIS.luz || {})[_disLuzClave(u0, r)];
    if (sf) continue;   /* recorte: se ve lo de atrás en casi todo el borde */
    DIS._mix = (DIS.luzMix || {})[_disLuzClave(u0, r)] || 0;
    return v != null ? v : 0.8;
  }
  return _disLum(_disCol((d.ajustes && d.ajustes.fondo) || 'fondo'));
}
async function _disLuzMedir(u, c, gFoto, r, W, H){
  const im = await new Promise((ok, mal) => { const x = new Image(); x.crossOrigin = 'anonymous'; x.onload = () => ok(x); x.onerror = mal; x.src = _disTam(u, 400); });
  const bw = gFoto.w / 100 * W, bh = (gFoto.h != null ? gFoto.h : 100) / 100 * H, iw = im.naturalWidth, ih = im.naturalHeight;
  const cover = (c.fit || 'cover') === 'cover', sc = cover ? Math.max(bw / iw, bh / ih) : Math.min(bw / iw, bh / ih), [ppx, ppy] = _disPosPct(c);
  const ox = (bw - iw * sc) * ppx / 100, oy = (bh - ih * sc) * ppy / 100;
  const sx = (r[0] * bw - ox) / sc, sy = (r[1] * bh - oy) / sc, sw = Math.max(1, r[2] * bw / sc), sh = Math.max(1, r[3] * bh / sc);
  const cv = document.createElement('canvas'); cv.width = 6; cv.height = 3; const g = cv.getContext('2d');
  g.drawImage(im, Math.max(0, sx), Math.max(0, sy), Math.min(iw, sw), Math.min(ih, sh), 0, 0, 6, 3);
  const dt = g.getImageData(0, 0, 6, 3).data; let s = 0, mn = 1, mx = 0; for (let k = 0; k < dt.length; k += 4){ const l = (0.299 * dt[k] + 0.587 * dt[k + 1] + 0.114 * dt[k + 2]) / 255; s += l; mn = Math.min(mn, l); mx = Math.max(mx, l); }
  return { v: s / (dt.length / 4), mix: mx - mn };
}
async function _disLuzPrep(d, cx){
  if (!d || !cx || typeof document === 'undefined') return false; DIS.luz = DIS.luz || {}; let nuevo = false;
  const f = d.formato, [W, H] = DIS_TAM[f] || DIS_TAM['4x5'];
  for (let i = 0; i < (d.capas || []).length; i++){
    const L = d.capas[i]; if (L.t !== 'logo' || _disLogoColor(L) !== 'auto' || !_disVis(L, cx)) continue;
    const gl = _disGeo(L, f), px = gl.x + gl.w / 2, lh = gl.w * 0.22 * W / H, py = gl.y + lh / 2;
    for (let j = i - 1; j >= 0; j--){
      const c = d.capas[j]; if (!c || !_disVis(c, cx) || !/^(foto|forma|degradado)$/.test(c.t)) continue;
      const g = _disGeo(c, f), h = g.h != null ? g.h : 100; if (px < g.x || px > g.x + g.w || py < g.y || py > g.y + h) continue;
      if (c.t !== 'foto' || c.sinfondo) break;
      const u = _disFotoSrc(cx, c.src), r = [(gl.x - g.x) / g.w, (gl.y - g.y) / h, gl.w / g.w, lh / h], k = _disLuzClave(u, r);
      if (u && DIS.luz[k] == null){ DIS.luzMix = DIS.luzMix || {}; try { const m = await _disLuzMedir(u, c, g, r, W, H); DIS.luz[k] = m.v; DIS.luzMix[k] = m.mix; nuevo = true; } catch (_) { DIS.luz[k] = 0.8; } }
      break;
    }
  }
  return nuevo;
}
/* 21-nov · texto con estilo dentro: **negrita**, *cursiva*, ***negrita cursiva***, ~~precio tachado chico~~ */
function _disMarcas(html){
  return String(html).replace(/~~\s*~~/g, '').replace(/(\*{2,3})\s*\1/g, '')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<b style="font-weight:700;font-style:italic">$1</b>').replace(/\*\*(.+?)\*\*/g, '<b style="font-weight:700">$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/~~(.+?)~~/g, '<s style="opacity:.55;font-size:.62em;font-weight:400">$1</s>');
}
const disA = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* ── plantillas de arranque · 21-nov v2 (Pablo: «quiero algo de lujo, no PowerPoint»).
   Sacadas de los referentes premium (Skims, Vuori, Cuyana, Baukjen, Cambridge Satchel, Junge, About Vintage) y adaptadas a Tulula:
   panel de marca crema, recortes de detalle de la tela, producto recortado sobre azul con letra gigante, marco de galería,
   reseña real de una clienta, arco editorial y pantalla completa para historias. Posiciones en % · letra en px sobre 1080. ── */
const DIS_BASE = [
  { nombre: 'Editorial dividido', mensaje: 'producto', ref: 'Skims · Vuori', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 60, h: 100, pos: 'center top' },
    { t: 'texto', txt: '{{descuento}}', x: 3.5, y: 3, w: 30, tam: 30, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'acento', pad: 10, r: 2, ls: 2, vis: 'oferta' },
    { t: 'logo', x: 66, y: 5.5, w: 28 },
    { t: 'texto', txt: '{{categoria}}', x: 64, y: 17, w: 33, tam: 22, fuente: 'texto', peso: 500, color: 'acento', mayus: true, ls: 6 },
    { t: 'texto', txt: '{{nombre_corto}}', x: 64, y: 20.5, w: 33, tam: 54, fuente: 'titulo', color: 'principal', mayus: true, ls: 1, lh: 1 },
    { t: 'forma', x: 64, y: 32.5, w: 7, h: 0.3, color: 'principal' },
    { t: 'texto', txt: '★ {{estrellas}}  ·  {{n_resenas}}', x: 64, y: 34.5, w: 33, tam: 22, fuente: 'texto', color: 'texto', ls: 1, vis: 'resenas' },
    { t: 'foto', src: 'ben:0', x: 64, y: 40, w: 32, h: 30, zoom: 1.5, fx: 50, fy: 45 },
    { t: 'texto', txt: '{{beneficio1}}', x: 64, y: 71.5, w: 32, tam: 22, fuente: 'texto', color: 'texto', cursiva: true, vis: 'beneficios' },
    { t: 'texto', txt: '{{precio_antes}}', x: 64, y: 82.5, w: 32, tam: 30, fuente: 'texto', color: 'texto', tachado: true, op: 0.6, vis: 'oferta' },
    { t: 'texto', txt: '{{precio}}', x: 64, y: 86, w: 32, tam: 58, fuente: 'texto', peso: 500, color: 'principal' } ] },
  { nombre: 'Díptico', mensaje: 'producto', ref: 'Cuyana', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 49.7, h: 87.5 },
    { t: 'foto', src: 'color:1', x: 50.3, y: 0, w: 49.7, h: 87.5 },
    { t: 'texto', txt: '{{badge}}', x: 3, y: 3, w: 40, tam: 22, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'principal', pad: 9, ls: 4, mayus: true, vis: 'badge' },
    { t: 'texto', txt: '{{nombre}}', x: 4, y: 91.3, w: 36, tam: 24, fuente: 'texto', peso: 500, color: 'texto', mayus: true, ls: 3 },
    { t: 'logo', x: 41, y: 90.6, w: 18 },
    { t: 'texto', txt: '{{precio}}', x: 60, y: 90.8, w: 36, tam: 30, fuente: 'texto', peso: 500, color: 'principal', al: 'right' } ] },
  { nombre: 'Detalle de la prenda', mensaje: 'beneficios', ref: 'American Eagle · Baukjen', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 63.5, h: 82 },
    { t: 'foto', src: 'ben:0', x: 64.3, y: 0, w: 35.7, h: 40.6, zoom: 1.5, fx: 50, fy: 45 },
    { t: 'foto', src: 'ben:1', x: 64.3, y: 41.4, w: 35.7, h: 40.6, zoom: 1.5, fx: 50, fy: 45 },
    { t: 'texto', txt: '{{beneficio1}}', x: 66, y: 33.5, w: 32, tam: 23, fuente: 'texto', peso: 500, color: 'principal', fondo: 'fondo', pad: 7, ls: 1, vis: 'beneficios' },
    { t: 'texto', txt: '{{beneficio2}}', x: 66, y: 74.8, w: 32, tam: 23, fuente: 'texto', peso: 500, color: 'principal', fondo: 'fondo', pad: 7, ls: 1, vis: 'beneficios' },
    { t: 'forma', x: 0, y: 82, w: 100, h: 18, color: 'principal' },
    { t: 'logo', x: 5, y: 87.6, w: 21, claro: true },
    { t: 'texto', txt: '{{nombre_corto}}', x: 31, y: 86.4, w: 40, tam: 38, fuente: 'titulo', color: 'fondo', mayus: true, ls: 2 },
    { t: 'texto', txt: '{{precio}}', x: 68, y: 86.2, w: 28, tam: 44, fuente: 'texto', peso: 500, color: 'fondo', al: 'right' } ] },
  { nombre: 'Recorte sobre azul', mensaje: 'frase', ref: 'Armani · Sasta', ajustes: { fondo: 'principal' }, capas: [
    { t: 'texto', txt: '{{frase}}', x: -6, y: 9, w: 112, tam: 170, fuente: 'titulo', color: 'fondo', contorno: true, op: 0.22, mayus: true, al: 'center', lh: 0.92 },
    { t: 'foto', src: 'color:0', sinfondo: true, x: 8, y: 5, w: 84, h: 82, fit: 'contain', pos: 'center bottom', sombra: true },
    { t: 'degradado', x: 0, y: 66, w: 100, h: 34, color: 'principal', desde: 'abajo', op: 0.95 },
    { t: 'logo', x: 38, y: 4, w: 24, claro: true },
    { t: 'texto', txt: '{{nombre}}', x: 6, y: 86, w: 56, tam: 36, fuente: 'titulo', color: 'fondo', mayus: true, ls: 2 },
    { t: 'texto', txt: '{{precio_antes}}', x: 62, y: 83.2, w: 32, tam: 28, fuente: 'texto', color: 'suave', tachado: true, al: 'right', vis: 'oferta' },
    { t: 'texto', txt: '{{precio}}', x: 56, y: 86.3, w: 38, tam: 50, fuente: 'texto', peso: 500, color: 'fondo', al: 'right' } ] },
  { nombre: 'Marco de galería', mensaje: 'producto', ref: 'Junge · About Vintage', ajustes: { fondo: 'principal' }, capas: [
    { t: 'forma', x: 12, y: 9, w: 76, h: 68, color: 'acento' },
    { t: 'foto', src: 'color:0', x: 8.5, y: 6, w: 76, h: 68 },
    { t: 'texto', txt: 'COLECCIÓN EJECUTIVA', x: 91, y: 12, w: 6, tam: 20, fuente: 'texto', peso: 500, color: 'fondo', ls: 9, vertical: true },
    { t: 'texto', txt: '{{nombre}}', x: 8.5, y: 80.5, w: 62, tam: 44, fuente: 'titulo', color: 'fondo', mayus: true, ls: 1 },
    { t: 'texto', txt: '{{precio}}  ·  Tallas {{tallas}}', x: 8.5, y: 88.5, w: 62, tam: 26, fuente: 'texto', color: 'suave', ls: 1 },
    { t: 'logo', x: 71, y: 88.6, w: 21, claro: true } ] },
  { nombre: 'Reseña de clienta', mensaje: 'resenas', ref: 'Baukjen', capas: [
    { t: 'logo', x: 40, y: 2.3, w: 20 },
    { t: 'foto', src: 'color:0', x: 0, y: 8, w: 100, h: 53, pos: 'center 15%' },
    { t: 'texto', txt: '★★★★★', x: 8, y: 64, w: 84, tam: 30, fuente: 'texto', color: 'acento', al: 'center', ls: 8 },
    { t: 'texto', txt: '«{{resena}}»', x: 9, y: 68.5, w: 82, tam: 38, fuente: 'titulo', color: 'principal', al: 'center', lh: 1.25, vis: 'cita' },
    { t: 'texto', txt: '{{frase}}', x: 9, y: 70, w: 82, tam: 56, fuente: 'titulo', color: 'principal', al: 'center', mayus: true, vis: 'sin_cita' },
    { t: 'texto', txt: '{{resena_quien}} · clienta verificada', x: 9, y: 87.5, w: 82, tam: 21, fuente: 'texto', color: 'texto', al: 'center', ls: 2, mayus: true, vis: 'cita' },
    { t: 'texto', txt: '{{nombre}}  ·  {{precio}}', x: 9, y: 92.3, w: 82, tam: 24, fuente: 'texto', peso: 500, color: 'principal', al: 'center', ls: 1 } ] },
  { nombre: 'Arco editorial', mensaje: 'oferta', ref: 'Editorial de lujo', capas: [
    { t: 'logo', x: 39.5, y: 2.6, w: 21 },
    { t: 'foto', src: 'color:0', x: 16, y: 8, w: 68, h: 64, arco: true },
    { t: 'texto', txt: '{{descuento}}', x: 72, y: 9, w: 16, tam: 38, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'acento', pad: 22, r: 999, al: 'center', vis: 'oferta' },
    { t: 'texto', txt: '{{categoria}}', x: 10, y: 75, w: 80, tam: 21, fuente: 'texto', peso: 500, color: 'acento', al: 'center', ls: 7, mayus: true },
    { t: 'texto', txt: '{{nombre_corto}}', x: 6, y: 78.3, w: 88, tam: 62, fuente: 'titulo', color: 'principal', al: 'center', mayus: true, ls: 2 },
    { t: 'texto', txt: '{{precio_antes}}', x: 10, y: 86.2, w: 80, tam: 26, fuente: 'texto', color: 'texto', tachado: true, op: 0.6, al: 'center', vis: 'oferta' },
    { t: 'texto', txt: '{{precio}}', x: 10, y: 89.2, w: 80, tam: 46, fuente: 'texto', peso: 500, color: 'principal', al: 'center' } ] },
  { nombre: 'Colores', mensaje: 'colores', ref: 'Cuyana · Skims', capas: [
    { t: 'logo', x: 40, y: 2.3, w: 20 },
    { t: 'foto', src: 'color:0', x: 0, y: 8, w: 100, h: 61, pos: 'center 10%' },
    { t: 'texto', txt: 'Disponible en {{colores_n}}', x: 6, y: 71.5, w: 88, tam: 22, fuente: 'texto', peso: 500, color: 'acento', al: 'center', ls: 6, mayus: true },
    { t: 'colores', x: 10, y: 75.8, w: 80, h: 14, estilo: 'punto' },
    { t: 'texto', txt: '{{nombre}}  ·  {{precio}}', x: 6, y: 93, w: 88, tam: 26, fuente: 'texto', peso: 500, color: 'principal', al: 'center', ls: 1 } ] },
  { nombre: 'Pantalla completa', mensaje: 'producto', ref: 'Historias y reels', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 100, h: 100 },
    { t: 'degradado', x: 0, y: 50, w: 100, h: 50, color: 'principal', desde: 'abajo', op: 0.92 },
    { t: 'logo', x: 71, y: 90, w: 22, claro: true },
    { t: 'texto', txt: '{{badge}}', x: 7, y: 63, w: 60, tam: 21, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'acento', pad: 8, ls: 4, mayus: true, vis: 'badge' },
    { t: 'texto', txt: '{{categoria}}', x: 7, y: 68.5, w: 86, tam: 22, fuente: 'texto', peso: 500, color: 'suave', ls: 7, mayus: true },
    { t: 'texto', txt: '{{nombre_corto}}', x: 7, y: 71.5, w: 86, tam: 80, fuente: 'titulo', color: 'blanco', mayus: true, ls: 1, lh: 1 },
    { t: 'texto', txt: '★ {{estrellas}}  ·  {{n_resenas}}', x: 7, y: 82, w: 86, tam: 24, fuente: 'texto', color: 'blanco', vis: 'resenas' },
    { t: 'texto', txt: '{{precio}}', x: 7, y: 86.5, w: 40, tam: 54, fuente: 'texto', peso: 500, color: 'blanco' },
    { t: 'texto', txt: '{{precio_antes}}', x: 36, y: 88.3, w: 30, tam: 30, fuente: 'texto', color: 'suave', tachado: true, vis: 'oferta' } ] },
  { nombre: 'Preventa', mensaje: 'preventa', ref: 'Lanzamiento', ajustes: { fondo: 'principal' }, capas: [
    { t: 'foto', src: 'color:0', x: 6, y: 5, w: 88, h: 63, marco: 10, marcoColor: 'fondo' },
    { t: 'texto', txt: 'PREVENTA', x: 6, y: 72, w: 60, tam: 24, fuente: 'texto', peso: 600, color: 'acento', ls: 9 },
    { t: 'texto', txt: 'Sé la primera en tenerla', x: 6, y: 76, w: 88, tam: 58, fuente: 'titulo', color: 'fondo', lh: 1.05 },
    { t: 'texto', txt: '{{nombre}}  ·  {{precio}}', x: 6, y: 89.5, w: 60, tam: 26, fuente: 'texto', color: 'suave', ls: 1 },
    { t: 'logo', x: 72, y: 89.4, w: 22, claro: true } ] },
  /* ── 21-nov · las 10 capturas que eligió Pablo, adaptadas a Tulula (letra, colores, datos y fotos de la tienda) ── */
  { nombre: 'Ficha con detalle', mensaje: 'producto', ref: 'Captura Skims · ficha', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 58, h: 100, pos: 'center top' },
    { t: 'foto', src: 'ben:0', x: 52, y: 2.5, w: 46, h: 51, zoom: 1.35, fx: 50, fy: 40, marco: 12, marcoColor: 'fondo' },
    { t: 'logo', x: 4, y: 4, w: 22 },
    { t: 'texto', txt: '{{categoria}}', x: 62, y: 58.5, w: 35, tam: 22, fuente: 'texto', peso: 500, color: 'texto', mayus: true, ls: 3 },
    { t: 'texto', txt: '{{nombre_corto}}', x: 62, y: 62, w: 35, tam: 48, fuente: 'texto', peso: 600, color: 'principal', mayus: true, ls: 1, lh: 1.02 },
    { t: 'forma', x: 62, y: 78.5, w: 34, h: 0.15, color: 'texto', op: 0.4 },
    { t: 'texto', txt: '{{n_resenas}}', x: 62, y: 81, w: 35, tam: 21, fuente: 'texto', color: 'texto', mayus: true, ls: 1, vis: 'resenas' },
    { t: 'texto', txt: '★★★★★', x: 62, y: 84.3, w: 35, tam: 26, fuente: 'texto', color: 'principal', ls: 4, vis: 'resenas' },
    { t: 'texto', txt: '{{precio}}  ~~{{precio_antes}}~~', x: 62, y: 89.3, w: 35, tam: 42, fuente: 'texto', peso: 500, color: 'principal' } ] },
  { nombre: 'Logo gigante detrás', mensaje: 'producto', ref: 'Captura Skims · logo', ajustes: { fondo: 'suave' }, capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 100, h: 100, pos: 'center top' },
    { t: 'logo', x: 7, y: 8.5, w: 86, color: 'principal', op: 0.92 },
    { t: 'foto', src: 'color:0', sinfondo: true, fit: 'cover', x: 0, y: 0, w: 100, h: 100, pos: 'center top' },
    { t: 'degradado', x: 0, y: 74, w: 100, h: 26, color: 'negro', desde: 'abajo', op: 0.5 },
    { t: 'texto', txt: '{{nombre}}', x: 6, y: 89.5, w: 56, tam: 28, fuente: 'texto', peso: 500, color: 'blanco', mayus: true, ls: 3 },
    { t: 'texto', txt: '{{precio}}', x: 58, y: 88, w: 36, tam: 46, fuente: 'texto', peso: 500, color: 'blanco', al: 'right' } ] },
  { nombre: 'Estilo de vida + prenda', mensaje: 'producto', ref: 'Captura Cuyana', ajustes: { fondo: 'blanco' }, capas: [
    { t: 'foto', src: 'color:1', x: 0, y: 0, w: 55, h: 100, pos: 'center top' },
    { t: 'degradado', x: 0, y: 74, w: 55, h: 26, color: 'negro', desde: 'abajo', op: 0.45 },
    { t: 'logo', x: 13.5, y: 91.5, w: 28, color: 'blanco' },
    { t: 'texto', txt: '{{badge}}', x: 60, y: 8, w: 35, tam: 19, fuente: 'texto', peso: 500, color: 'blanco', fondo: 'principal', pad: 8, r: 999, al: 'center', ls: 1, vis: 'badge' },
    { t: 'texto', txt: '{{nombre}}', x: 58, y: 14.5, w: 39, tam: 34, fuente: 'titulo', color: 'principal', al: 'center', lh: 1.18 },
    { t: 'foto', src: 'color:0', sinfondo: true, fit: 'contain', x: 58, y: 25, w: 39, h: 50, pos: 'center bottom', sombra: true },
    { t: 'texto', txt: 'Color — {{color}}', x: 58, y: 78, w: 39, tam: 22, fuente: 'texto', color: 'texto', al: 'center' },
    { t: 'colores', estilo: 'mini', al: 'center', x: 58, y: 82.3, w: 39, h: 5 },
    { t: 'texto', txt: '{{precio}}  ~~{{precio_antes}}~~', x: 58, y: 89.5, w: 39, tam: 34, fuente: 'texto', peso: 500, color: 'principal', al: 'center' } ] },
  { nombre: 'Ficha con dos detalles', mensaje: 'beneficios', ref: 'Captura Huckberry · detalles', capas: [
    { t: 'foto', src: 'ben:0', x: 60, y: 0, w: 40, h: 49.8, zoom: 1.6, fx: 50, fy: 45 },
    { t: 'foto', src: 'ben:1', x: 60, y: 50.2, w: 40, h: 49.8, zoom: 1.6, fx: 50, fy: 55 },
    { t: 'logo', x: 17, y: 5, w: 26 },
    { t: 'texto', txt: '{{categoria}}', x: 4, y: 12.3, w: 52, tam: 20, fuente: 'texto', peso: 500, color: 'texto', al: 'center', mayus: true, ls: 3 },
    { t: 'texto', txt: '{{nombre_corto}}', x: 4, y: 15.2, w: 52, tam: 44, fuente: 'titulo', color: 'principal', al: 'center', lh: 1.05 },
    { t: 'forma', x: 25, y: 23.6, w: 10, h: 0.25, color: 'principal' },
    { t: 'texto', txt: '{{precio}}  ~~{{precio_antes}}~~', x: 4, y: 25.6, w: 52, tam: 34, fuente: 'texto', peso: 500, color: 'principal', al: 'center' },
    { t: 'foto', src: 'color:0', sinfondo: true, fit: 'contain', x: 6, y: 32, w: 48, h: 52, pos: 'center bottom', sombra: true },
    { t: 'forma', x: 4, y: 87.5, w: 52, h: 0.15, color: 'texto', op: 0.35 },
    { t: 'texto', txt: 'Color — {{color}}', x: 4, y: 90.6, w: 28, tam: 21, fuente: 'texto', peso: 500, color: 'texto' },
    { t: 'colores', estilo: 'mini', al: 'right', tam: 40, x: 30, y: 89.8, w: 26, h: 4 } ] },
  { nombre: 'Tríptico', mensaje: 'producto', ref: 'Captura Feedr · tres vistas', ajustes: { fondo: 'principal' }, capas: [
    { t: 'foto', src: 'color:0', x: 2, y: 2, w: 31.3, h: 70 },
    { t: 'foto', src: 'ben:0', x: 34.35, y: 2, w: 31.3, h: 70, zoom: 1.4, fx: 50, fy: 40 },
    { t: 'foto', src: 'color:1', x: 66.7, y: 2, w: 31.3, h: 70 },
    { t: 'texto', txt: '{{nombre}}', x: 4, y: 76, w: 62, tam: 36, fuente: 'titulo', color: 'blanco', lh: 1.15 },
    { t: 'texto', txt: '{{precio_antes}}', x: 4, y: 84.6, w: 30, tam: 26, fuente: 'texto', color: 'suave', tachado: true, vis: 'oferta' },
    { t: 'texto', txt: '{{precio}}', x: 4, y: 88, w: 30, tam: 56, fuente: 'texto', peso: 500, color: 'blanco' },
    { t: 'texto', txt: '{{badge}}', x: 30, y: 90, w: 34, tam: 19, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'acento', pad: 7, r: 4, mayus: true, ls: 2, vis: 'badge' },
    { t: 'logo', x: 72, y: 85.5, w: 23, color: 'blanco', caja: true } ] },
  { nombre: 'Llegada nueva', mensaje: 'producto', ref: 'Captura Feedr · new arrival', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 52, h: 100, zoom: 1.6, fx: 50, fy: 30 },
    { t: 'logo', x: 4, y: 90, w: 22, caja: true },
    { t: 'texto', txt: '———  NUEVA LLEGADA  ———', x: 55, y: 5.5, w: 43, tam: 21, fuente: 'texto', color: 'principal', al: 'center', ls: 4 },
    { t: 'texto', txt: '{{nombre}}', x: 56, y: 11.5, w: 40, tam: 28, fuente: 'texto', color: 'texto', mayus: true, ls: 1, lh: 1.2 },
    { t: 'texto', txt: '{{precio}}  ~~{{precio_antes}}~~', x: 56, y: 19, w: 40, tam: 46, fuente: 'titulo', color: 'principal' },
    { t: 'foto', src: 'color:1', x: 56, y: 28.5, w: 40, h: 66, pos: 'center top' } ] },
  { nombre: 'Oferta en curva', mensaje: 'oferta', ref: 'Captura Feedr · SALE', capas: [
    { t: 'degradado', x: 0, y: 0, w: 100, h: 100, color: 'acento', desde: 'der', op: 0.16 },
    { t: 'forma', x: -38, y: -12, w: 64, h: 124, color: 'principal', elipse: true },
    { t: 'texto', txt: 'O\nF\nE\nR\nT\nA', x: 2, y: 7, w: 19, tam: 140, fuente: 'titulo', color: 'fondo', al: 'center', lh: 0.98, vis: 'oferta' },
    { t: 'texto', txt: 'N\nU\nE\nV\nA', x: 2, y: 12, w: 19, tam: 140, fuente: 'titulo', color: 'fondo', al: 'center', lh: 0.98, vis: 'sin_oferta' },
    { t: 'foto', src: 'color:0', sinfondo: true, fit: 'cover', x: 14, y: 0, w: 52, h: 100, pos: 'center top', sombra: true },
    { t: 'logo', x: 76, y: 5, w: 19, caja: true },
    { t: 'texto', txt: '{{nombre}}', x: 67, y: 46, w: 29, tam: 32, fuente: 'titulo', color: 'principal', al: 'right', lh: 1.15 },
    { t: 'texto', txt: '~~{{precio_antes}}~~  {{precio}}', x: 50, y: 60, w: 46, tam: 54, fuente: 'texto', peso: 500, color: 'acento', al: 'right' },
    { t: 'texto', txt: '{{descuento}}', x: 78, y: 68.5, w: 18, tam: 30, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'acento', pad: 10, r: 999, al: 'center', vis: 'oferta' },
    { t: 'texto', txt: '{{ventaja1}}', x: 50, y: 92, w: 46, tam: 21, fuente: 'texto', color: 'principal', al: 'right', ls: 1 } ] },
  { nombre: 'Cinta de colección', mensaje: 'producto', ref: 'Captura Feedr · new collection', capas: [
    { t: 'forma', x: 0, y: 0, w: 100, h: 9.5, color: 'blanco' },
    { t: 'texto', txt: 'COLECCIÓN  ***NUEVA COLECCIÓN***  NUEVA COLECCIÓN  ***NUEVA COLECCIÓN***  NUEVA COLECCIÓN', x: -9, y: 2.2, w: 130, tam: 50, fuente: 'texto', color: 'principal', linea: true },
    { t: 'foto', src: 'color:0', x: 40, y: 9.5, w: 60, h: 90.5, pos: 'center top' },
    { t: 'logo', x: 12, y: 49, w: 24, caja: true },
    { t: 'texto', txt: '{{nombre}}', x: 3, y: 61.5, w: 34, tam: 28, fuente: 'texto', color: 'texto', al: 'right', lh: 1.2 },
    { t: 'texto', txt: '{{precio}}', x: 3, y: 67.5, w: 34, tam: 52, fuente: 'texto', peso: 600, color: 'principal', al: 'right' },
    { t: 'texto', txt: '{{precio_antes}}', x: 3, y: 74.5, w: 34, tam: 26, fuente: 'texto', color: 'texto', tachado: true, op: 0.6, al: 'right', vis: 'oferta' } ] },
  { nombre: 'Prenda en panel', mensaje: 'colores', ref: 'Captura Huckberry · estilo de vida', capas: [
    { t: 'foto', src: 'color:1', x: 0, y: 0, w: 57, h: 100, pos: 'center top' },
    { t: 'logo', x: 66, y: 5, w: 24 },
    { t: 'foto', src: 'color:0', sinfondo: true, fit: 'contain', x: 61, y: 12, w: 35, h: 47, pos: 'center bottom', sombra: true },
    { t: 'texto', txt: '{{categoria}}', x: 61, y: 63, w: 36, tam: 20, fuente: 'texto', peso: 500, color: 'texto', mayus: true, ls: 2, op: 0.7 },
    { t: 'texto', txt: '{{nombre_corto}}', x: 61, y: 66.5, w: 36, tam: 40, fuente: 'titulo', color: 'principal', lh: 1.1 },
    { t: 'texto', txt: '{{precio}}  ~~{{precio_antes}}~~', x: 61, y: 76.5, w: 36, tam: 32, fuente: 'texto', peso: 500, color: 'principal' },
    { t: 'forma', x: 61, y: 84, w: 35, h: 0.15, color: 'texto', op: 0.35 },
    { t: 'texto', txt: 'Color — {{color}}', x: 61, y: 86.8, w: 36, tam: 21, fuente: 'texto', color: 'texto' },
    { t: 'colores', estilo: 'mini', al: 'left', tam: 42, x: 61, y: 90.6, w: 36, h: 4.5 } ] },
  { nombre: 'Franja oscura con precio', mensaje: 'oferta', ref: 'Captura Ted Baker', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 32.5, h: 100, zoom: 1.8, fx: 30, fy: 20, bri: 45 },
    { t: 'foto', src: 'color:0', x: 32.5, y: 0, w: 67.5, h: 100, pos: 'center top' },
    { t: 'logo', x: 4, y: 6, w: 24.5, color: 'blanco' },
    { t: 'texto', txt: '{{precio_antes}}', x: 4, y: 74.5, w: 27, tam: 30, fuente: 'texto', color: 'blanco', tachado: true, op: 0.75, vis: 'oferta' },
    { t: 'texto', txt: '{{precio}}', x: 4, y: 79, w: 27, tam: 54, fuente: 'texto', peso: 500, color: 'blanco' },
    { t: 'texto', txt: '{{nombre}}', x: 4, y: 87, w: 26, tam: 20, fuente: 'texto', color: 'blanco', op: 0.85, mayus: true, ls: 2, lh: 1.3 },
    { t: 'texto', txt: '{{descuento}}', x: 4, y: 67, w: 14, tam: 30, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'acento', pad: 10, r: 999, al: 'center', vis: 'oferta' },
    { t: 'texto', txt: '{{ventaja1}}', x: 36, y: 93, w: 60, tam: 21, fuente: 'texto', color: 'blanco', fondo: 'principal', pad: 8, r: 999, al: 'center', ls: 1 } ] },
  /* 21-nov · Fase 4: reseña real CON FOTO de la clienta (solo productos que la tienen; si no, usa la foto de la prenda) */
  { nombre: 'Reseña con foto', mensaje: 'resenas', ref: 'Prueba social real', capas: [
    { t: 'foto', src: 'resena:0', x: 5, y: 5, w: 50, h: 70, marco: 10, marcoColor: 'blanco', sombra: true, pos: 'center center' },
    { t: 'foto', src: 'color:0', x: 56, y: 22, w: 40, h: 53, pos: 'center top' },
    { t: 'texto', txt: '★★★★★', x: 5, y: 78, w: 60, tam: 30, fuente: 'texto', color: 'acento', ls: 6 },
    { t: 'texto', txt: '«{{resena_foto_texto}}»', x: 5, y: 82, w: 88, tam: 30, fuente: 'titulo', color: 'principal', lh: 1.22, vis: 'foto_clienta' },
    { t: 'texto', txt: '«{{resena}}»', x: 5, y: 82, w: 88, tam: 30, fuente: 'titulo', color: 'principal', lh: 1.22, vis: 'sin_foto_clienta' },
    { t: 'texto', txt: '{{resena_foto_quien}} · clienta real · {{nombre}}', x: 5, y: 93.5, w: 88, tam: 20, fuente: 'texto', color: 'texto', mayus: true, ls: 2 },
    { t: 'logo', x: 66, y: 7, w: 26 } ] },
  /* 21-nov noche · Fase 4 «Se compran juntas»: la pareja que MÁS se lleva en el mismo pedido según el ERP (últimos 180 días, rpc mk_dis_juntas) */
  { nombre: 'Se compran juntas', mensaje: 'producto', ref: 'Venta cruzada con datos del ERP', capas: [
    { t: 'texto', txt: 'Se llevan *juntas*', x: 6, y: 5, w: 70, tam: 64, fuente: 'titulo', color: 'principal', lh: 1.05 },
    { t: 'logo', x: 74, y: 6, w: 20 },
    { t: 'foto', src: 'color:0', x: 5, y: 17, w: 44, h: 62, r: 6, pos: 'center top' },
    { t: 'foto', src: 'junto:0', x: 51, y: 17, w: 44, h: 62, r: 6, pos: 'center top' },
    { t: 'texto', txt: '+', x: 45, y: 44, w: 10, tam: 54, fuente: 'texto', peso: 500, color: 'blanco', fondo: 'acento', pad: 4, r: 999, al: 'center', vis: 'junto' },
    { t: 'texto', txt: '{{nombre}}  +  {{junto_nombre}}', x: 5, y: 82, w: 90, tam: 30, fuente: 'titulo', color: 'principal', lh: 1.2, vis: 'junto' },
    { t: 'texto', txt: '{{nombre}}', x: 5, y: 82, w: 90, tam: 30, fuente: 'titulo', color: 'principal', lh: 1.2, vis: 'sin_junto' },
    { t: 'texto', txt: '{{juntos_n}}', x: 5, y: 88.5, w: 90, tam: 21, fuente: 'texto', color: 'texto', mayus: true, ls: 2 },
    { t: 'texto', txt: '{{ventaja5}}', x: 5, y: 93.5, w: 90, tam: 21, fuente: 'texto', color: 'acento', ls: 1 } ] },
  /* 21-nov noche · Fase 4 calendario comercial: el texto sale de la fecha elegida (Navidad, Día de la Madre…) */
  { nombre: 'Fecha · Regalo', mensaje: 'producto', ref: 'Calendario comercial', ajustes: { fondo: 'principal' }, capas: [
    { t: 'texto', txt: '{{fecha}}', x: 6, y: 5, w: 60, tam: 22, fuente: 'texto', color: 'acento', mayus: true, ls: 4 },
    { t: 'texto', txt: '{{fecha_frase}}', x: 6, y: 9, w: 88, tam: 70, fuente: 'titulo', color: 'fondo', lh: 1.05 },
    { t: 'foto', src: 'color:0', x: 20, y: 27, w: 60, h: 58, arco: true, pos: 'center top' },
    { t: 'texto', txt: '{{nombre}}', x: 6, y: 87, w: 60, tam: 26, fuente: 'titulo', color: 'fondo' },
    { t: 'texto', txt: '{{fecha_limite}}', x: 6, y: 92.5, w: 88, tam: 21, fuente: 'texto', color: 'fondo', op: 0.85, ls: 1 },
    { t: 'logo', x: 74, y: 87, w: 20 } ] },
  { nombre: 'Fecha · Último día', mensaje: 'oferta', ref: 'Calendario comercial · cierre', capas: [
    { t: 'foto', src: 'color:0', x: 0, y: 0, w: 56, h: 100, pos: 'center top' },
    { t: 'logo', x: 62, y: 5, w: 30 },
    { t: 'texto', txt: '{{fecha}}', x: 60, y: 22, w: 36, tam: 22, fuente: 'texto', color: 'acento', mayus: true, ls: 3 },
    { t: 'texto', txt: '{{fecha_frase}}', x: 60, y: 26, w: 36, tam: 52, fuente: 'titulo', color: 'principal', lh: 1.08 },
    { t: 'texto', txt: '~~{{precio_antes}}~~', x: 60, y: 52, w: 36, tam: 30, fuente: 'texto', color: 'texto', vis: 'oferta' },
    { t: 'texto', txt: '{{precio}}', x: 60, y: 56, w: 36, tam: 64, fuente: 'texto', peso: 600, color: 'acento' },
    { t: 'texto', txt: '{{descuento}}', x: 60, y: 65, w: 16, tam: 28, fuente: 'texto', peso: 600, color: 'blanco', fondo: 'acento', pad: 8, r: 999, al: 'center', vis: 'oferta' },
    { t: 'texto', txt: '{{fecha_limite}}', x: 60, y: 76, w: 36, tam: 22, fuente: 'texto', color: 'blanco', fondo: 'principal', pad: 10, r: 6, lh: 1.3 },
    { t: 'texto', txt: '{{ventaja1}}', x: 60, y: 92, w: 36, tam: 19, fuente: 'texto', color: 'texto' } ] }

];

/* ── datos ── */
async function disCargar(){
  const pRes = _mklSb('/rest/v1/rpc/mk_dis_resultados', { method: 'POST', body: '{}' }).catch(() => null), pCrit = _mklSb('/rest/v1/mk_dis_critica?select=diseno_id,total,detalle,creado&order=creado.desc&limit=500').catch(() => null);
  const [f, p, m, pu, pz, sf, jn] = await Promise.all([
    _mklSb('/rest/v1/mk_disenos?select=*&order=creado.desc'),
    DIS.prods ? Promise.resolve(DIS.prods) : _mklSb('/rest/v1/rpc/mk_dis_productos', { method: 'POST', body: '{}' }),
    _mklSb('/rest/v1/mk_dis_config?select=clave,valor&clave=in.(marca,orden_plantillas)').catch(() => []),
    _mklSb('/rest/v1/rpc/_mk_puede_editar', { method: 'POST', body: '{}' }).catch(() => false),
    _mklSb('/rest/v1/mk_dis_piezas?select=*&estado=neq.archivada&order=creado.desc&limit=2000').catch(() => []),
    _mklSb('/rest/v1/mk_dis_sinfondo?select=foto,url').catch(() => []),
    DIS.juntas ? Promise.resolve(DIS.juntas) : _mklSb('/rest/v1/rpc/mk_dis_juntas', { method: 'POST', body: '{}' }).catch(() => [])]);
  DIS.filas = Array.isArray(f) ? f : []; DIS.juntas = Array.isArray(jn) ? jn : [];
  DIS.piezas = Array.isArray(pz) ? pz : []; DIS.sinf = {}; (Array.isArray(sf) ? sf : []).forEach(x => { DIS.sinf[x.foto] = x.url; });
  DIS.prods = (Array.isArray(p) ? p : []).filter(x => !/^archived$/i.test(x.estado || '')).sort((a, b) => (_disActivo(a) ? 0 : 1) - (_disActivo(b) ? 0 : 1) || String(a.titulo).localeCompare(String(b.titulo)));
  const cfg = k => ((Array.isArray(m) ? m : []).find(x => x.clave === k) || {}).valor;
  DIS.marca = Object.assign({}, DIS_MARCA_DEF, cfg('marca') || {}); DIS.ordenP = cfg('orden_plantillas') || null;
  _disFondosCargar();
  DIS.puede = pu === true;
  /* 21-nov noche (medido: resultados ~2,2 s porque lee anuncios de otra base) · ya no frena la galería: se pinta primero y los
     resultados y notas del crítico llegan después y repintan. Arrancan junto con lo demás (pRes/pCrit al inicio). */
  Promise.all([pRes, pCrit]).then(([r, L]) => {
    DIS.res = r || null; DIS.crit = {}; (Array.isArray(L) ? L : []).forEach(x => { if (!DIS.crit[x.diseno_id]) DIS.crit[x.diseno_id] = x; });
    _disAutoEstado(); if (document.getElementById('mkDis') && DIS.filas) disPintar();
  });
}
async function disInfo(handle){
  if (!handle) return {};
  const v = DIS.info[handle]; if (v) return await v;
  const pr = fetch('https://tulula.com.pe/products/' + encodeURIComponent(handle) + '.js').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  DIS.info[handle] = pr; const j = await pr; DIS.info[handle] = j || {};
  try { const p0 = (DIS.prods || []).find(x => x.handle === handle), jn = p0 && _disJunto(p0); if (jn && !DIS.info[jn.p.handle]) await disInfo(jn.p.handle); } catch (_) {}
  return DIS.info[handle];
}
/* producto de muestra: activo, con beneficios y reseñas (se ve el diseño completo) */
function _disProdLindo(){ const L = (DIS.prods || []).filter(_disActivo); return L.find(p => (p.beneficios || []).length >= 2 && p.cita) || L.find(p => (p.beneficios || []).length >= 2) || L[0] || null; }
function _disActivo(p){ return /^active$/i.test((p && p.estado) || ''); }   /* Shopify escribe ACTIVE en mayúsculas */
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
  const nTallas = ti >= 0 ? ((ops[ti] && ops[ti].values) || []).length : 0, ultimas = tallas.length > 0 && tallas.length <= 2 && nTallas > 2;
  const tags = (inf.tags || []).map(t => String(t).toLowerCase());
  const preventa = tags.some(t => t.indexOf('preventa') >= 0) || !!(aj.preventa && aj.preventa[p.handle]);
  return { p, fotos, i0, color, colores: cols, portadas: cols.map(c => ({ c, src: portadaDe(c) })), benBase, ben,
    precio: _disSol(precio), antes: oferta ? _disSol(antes) : '', descuento: oferta ? '-' + Math.round((1 - precio / antes) * 100) + '%' : '',
    ahorro: oferta ? 'Ahorras ' + _disSol(antes - precio) : '', oferta, preventa, tallas, ultimas, agotado: !!vsAll.length && !tallas.length && ti >= 0,
    estrellas: p.estrellas != null ? (+p.estrellas).toFixed(1).replace('.', ',') : '', n_resenas: +p.n_resenas || 0, cita: p.cita || '', cita_quien: p.cita_quien || '', foto_clienta: p.foto_clienta || '', foto_texto: p.foto_texto || '', foto_quien: p.foto_quien || '', junto: _disJunto(p, color), fecha: _disFecha(aj.fecha),
    categoria: String(p.titulo || '').trim().split(/\s+/)[0] || '', nombre_corto: String(p.titulo || '').trim().split(/\s+/).slice(1).join(' ') || String(p.titulo || ''),
    badge: preventa ? 'Preventa' : ultimas ? 'Últimas tallas' : oferta ? 'Oferta ' + ('-' + Math.round((1 - precio / antes) * 100) + '%') : ((+p.n_resenas || 0) >= 10 ? 'Favorita de clientas' : ''), frase: p.frase || '', nombre: String(p.titulo || '') };
}
function _disFotoSrc(cx, src){
  src = String(src || 'color:0'); const k = src.split(':')[0], i = +src.split(':')[1] || 0;
  if (k === 'color') return cx.fotos[cx.i0 + i] || cx.fotos[i] || '';
  if (k === 'n') return cx.fotos[i] || '';
  if (k === 'ben'){ const b = cx.ben[i]; if (b && b.foto){ const f = cx.fotos.find(u => _disArch(u) === _disArch(b.foto)); if (f) return f; } return cx.fotos[cx.i0 + i + 1] || ''; }
  if (k === 'url') return src.slice(4);
  if (k === 'resena') return cx.foto_clienta || cx.fotos[cx.i0] || '';
  if (k === 'junto') return cx.junto ? (cx.junto.fotos[i] || cx.junto.fotos[0] || '') : (cx.fotos[cx.i0 + 1] || cx.fotos[0] || '');
  if (k === 'fondo'){ const f = (DIS.fondos || [])[i]; return f ? f.url : ''; }
  return '';
}
function _disTxt(cx, t){
  return String(t || '').replace(/\{\{(\w+)\}\}/g, (m, k) => {
    const b = k.match(/^beneficio(\d)(_texto)?$/); if (b){ const x = cx.ben[+b[1] - 1]; return x ? (b[2] ? x.texto : x.titulo) : ''; }
    const n = cx.tallas.length, tal = n > 2 ? cx.tallas[0] + ' a ' + cx.tallas[n - 1] : cx.tallas.join(' y ');
    const v = { nombre: cx.nombre, precio: cx.precio, precio_antes: cx.antes, descuento: cx.descuento, ahorro: cx.ahorro, frase: cx.frase, color: cx.color,
      colores_n: cx.colores.length > 1 ? cx.colores.length + ' colores' : '', tallas: tal, ultimas: cx.ultimas ? 'Últimas tallas: ' + cx.tallas.join(' y ') : '', marca: 'TULULA',
      estrellas: cx.estrellas, n_resenas: cx.n_resenas >= 100 ? cx.n_resenas + ' reseñas' : '',   /* 21-nov · Pablo: con menos de 100 no se muestra */
      ventaja1: _disVentajas()[0] || '', ventaja2: _disVentajas()[1] || '', ventaja3: _disVentajas()[2] || '', ventaja4: _disVentajas()[3] || '', ventaja5: _disVentajas()[4] || '', ventaja6: _disVentajas()[5] || '', junto_nombre: cx.junto ? cx.junto.nombre : '', fecha: cx.fecha ? cx.fecha.nombre : '', fecha_frase: cx.fecha ? cx.fecha.frase : '', fecha_sub: cx.fecha ? cx.fecha.sub : '', fecha_limite: cx.fecha ? cx.fecha.limite : '', juntos_n: cx.junto && cx.junto.n >= 10 ? cx.junto.n + ' clientas las llevaron juntas' : '', resena_foto_texto: _disCorta(cx.foto_texto, 120), resena_foto_quien: cx.foto_quien || '', resena: cx.cita, resena_quien: cx.cita_quien,
      categoria: cx.categoria, nombre_corto: cx.nombre_corto, badge: cx.badge }[k];
    return v == null ? '' : v; });
}
/* un texto con tramos «a · b · c»: se cae solo el tramo cuyo dato viene vacío (ej. «Tallas {{tallas}}» sin tallas) */
function _disTxtSeg(cx, t){
  return String(t || '').split(/(\s+·\s+)/).reduce((acc, seg, i, arr) => {
    if (i % 2) return acc;
    const tiene = /\{\{\w+\}\}/.test(seg), vals = (seg.match(/\{\{\w+\}\}/g) || []).map(m => _disTxt(cx, m));
    if (tiene && vals.every(v => !String(v).trim())) return acc;
    return acc.concat([_disTxt(cx, seg)]);
  }, []).join('  ·  ').replace(/\s+·\s+/g, '  ·  ');
}
function _disVis(c, cx){
  if (c.oculto) return false;
  const v = c.vis || 'siempre';
  return v === 'siempre' || (v === 'oferta' && cx.oferta) || (v === 'sin_oferta' && !cx.oferta) || (v === 'preventa' && cx.preventa) || (v === 'beneficios' && cx.ben.length > 0) || (v === 'ultimas' && !!cx.ultimas) || (v === 'resenas' && cx.n_resenas > 0) || (v === 'cita' && !!cx.cita) || (v === 'foto_clienta' && !!cx.foto_clienta) || (v === 'sin_foto_clienta' && !cx.foto_clienta) || (v === 'con_precio' && !!cx.precio) || (v === 'junto' && !!cx.junto) || (v === 'sin_junto' && !cx.junto) || (v === 'sin_cita' && !cx.cita) || (v === 'badge' && !!cx.badge);
}
function _disCol(c){
  const m = DIS.marca || DIS_MARCA_DEF;
  return { principal: m.c_principal, acento: m.c_acento, texto: m.c_texto, fondo: m.c_fondo, oferta: m.c_oferta, suave: m.c_suave || '#D3DBE5', blanco: '#ffffff', negro: '#000000', transparente: 'transparent' }[c] || (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : m.c_principal);
}

/* ── dibujar: el mismo HTML sirve para la galería (chico), el editor y la imagen final (1080).
   v2 21-nov: marco, arco, recorte de detalle (zoom + foco), sombra, degradado, texto vertical, letra de contorno, cursiva. ── */
function _disRgba(hex, a){ const h = String(hex || '#000').replace('#', ''), n = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6), v = parseInt(n, 16) || 0;
  return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + (a == null ? 1 : a) + ')'; }
function disHtml(d, cx, s, opt){
  opt = opt || {}; if (_disSinPrecio(d)) cx = _disCxSinPrecio(cx); const [W, H] = DIS_TAM[d.formato] || DIS_TAM['4x5'], m = DIS.marca || DIS_MARCA_DEF;
  const ft = "'" + m.f_titulo + "', serif", fx = "'" + m.f_texto + "', sans-serif", anchoFoto = opt.ancho || 1080;
  let h = '<div class="dis-lienzo" style="position:relative;overflow:hidden;width:' + Math.round(W * s) + 'px;height:' + Math.round(H * s) + 'px;background:' + _disCol((d.ajustes && d.ajustes.fondo) || 'fondo') + '">';
  (d.capas || []).forEach((c, i) => {
    if (!_disVis(c, cx)) return;
    const g = _disGeo(c, d.formato), pos = 'position:absolute;left:' + g.x + '%;top:' + g.y + '%;width:' + g.w + '%;' + (g.h != null ? 'height:' + g.h + '%;' : '')
      + (c.op != null && c.t !== 'forma' && c.t !== 'degradado' ? 'opacity:' + (+c.op) + ';' : '');
    const sel = opt.sel === i ? 'outline:' + Math.max(1, 2) + 'px solid #7c5cff;outline-offset:-1px;' : '', da = opt.edit ? ' data-capa="' + i + '"' : '';
    const cur = opt.edit ? 'cursor:move;' : '';
    let inner = '', estilo = '';
    if (c.t === 'foto'){
      const u0 = _disFotoSrc(cx, c.src), sf = c.sinfondo && DIS.sinf[_disArch(u0)], u = sf || u0;
      const z = Math.max(1, +c.zoom || 1), fxp = (c.fx != null ? +c.fx : 50) + '% ' + (c.fy != null ? +c.fy : 0) + '%';
      const op = c.pos || (c.fx != null || c.fy != null ? fxp : 'center top');
      const fil = [c.bri != null && +c.bri !== 100 ? 'brightness(' + (+c.bri / 100) + ')' : '', c.con != null && +c.con !== 100 ? 'contrast(' + (+c.con / 100) + ')' : '', c.sat != null && +c.sat !== 100 ? 'saturate(' + (+c.sat / 100) + ')' : '',
        +c.blur ? 'blur(' + (+c.blur * s) + 'px)' : '',
        +c.calidez > 0 ? 'sepia(' + (+c.calidez / 100) + ') saturate(' + (1 + +c.calidez / 150) + ')' : +c.calidez < 0 ? 'hue-rotate(' + (-c.calidez * 0.6) + 'deg) saturate(0.95)' : '', c.sinfondo && c.sombra ? 'drop-shadow(0 ' + (26 * s) + 'px ' + (30 * s) + 'px rgba(0,0,0,.35))' : ''].filter(Boolean).join(' ');
      const rad = c.arco ? '9999px 9999px 0 0' : ((+c.r || 0) * s) + 'px';
      estilo = 'border-radius:' + rad + ';overflow:hidden;background:' + (c.sinfondo ? 'transparent' : '#e9e7e2') + ';'
        + (c.marco ? 'border:' + (+c.marco * s) + 'px solid ' + _disCol(c.marcoColor || 'fondo') + ';box-sizing:border-box;' : '')
        + (c.sombra && !c.sinfondo ? 'box-shadow:0 ' + (24 * s) + 'px ' + (60 * s) + 'px rgba(0,0,0,.28);' : '');
      inner = u ? '<img crossorigin="anonymous" src="' + disA(sf ? u : _disTam(u, anchoFoto)) + '" style="width:100%;height:100%;object-fit:' + (c.fit || (c.sinfondo ? 'contain' : 'cover')) + ';object-position:' + op + ';display:block;pointer-events:none;'
        + (z > 1 ? 'transform:scale(' + z + ');transform-origin:' + fxp + ';' : '') + (fil ? 'filter:' + fil + ';' : '') + '" draggable="false">' : '';
    } else if (c.t === 'forma'){
      estilo = 'background:' + _disCol(c.color) + ';opacity:' + (c.op != null ? +c.op : 1) + ';border-radius:' + (c.elipse ? '50%' : ((+c.r || 0) * s) + 'px') + ';' + (+c.blur ? 'filter:blur(' + (+c.blur * s) + 'px);' : '') + (c.mezcla ? 'mix-blend-mode:' + c.mezcla + ';' : '');
    } else if (c.t === 'degradado'){
      const dir = { abajo: 'to top', arriba: 'to bottom', izq: 'to right', der: 'to left' }[c.desde || 'abajo'] || 'to top';
      estilo = 'background:linear-gradient(' + dir + ',' + _disRgba(_disCol(c.color), c.op != null ? +c.op : 0.8) + ' 0%,' + _disRgba(_disCol(c.color), 0) + ' 100%);';
    } else if (c.t === 'logo'){
      const lc = _disLogoColor(c), tono = lc === 'auto' ? (_disLogoTono(d, cx, i, g) > 0.55 ? 'principal' : 'blanco') : lc, halo = lc === 'auto' && DIS._mix > 0.3;   /* fondo mezclado (pelo + pared): aura suave para que se lea */
      const hexL = tono === 'blanco' ? '#ffffff' : tono === 'negro' ? '#000000' : _disCol('principal');
      if (c.caja) estilo = 'border:' + Math.max(1, 3 * s) + 'px solid ' + hexL + ';border-radius:' + (16 * s) + 'px;padding:' + (14 * s) + 'px ' + (18 * s) + 'px;box-sizing:border-box;';
      inner = '<img crossorigin="anonymous" src="' + disA(m.logo_oscuro) + '" data-tono="' + tono + '" style="width:100%;display:block;pointer-events:none;' + 'filter:' + (tono === 'blanco' ? 'brightness(0) invert(1)' : tono === 'negro' ? 'brightness(0)' : (halo ? '' : 'none')) + (halo ? (tono === 'blanco' ? ' drop-shadow(0 0 ' + (10 * s) + 'px rgba(0,0,0,.55))' : ' drop-shadow(0 0 ' + (10 * s) + 'px rgba(255,255,255,.9)) drop-shadow(0 0 ' + (4 * s) + 'px rgba(255,255,255,.9))') : '') + '" draggable="false">';
    } else if (c.t === 'texto'){
      const t = _disTxtSeg(cx, c.txt); if (!t.trim() || (/\{\{/.test(c.txt || '') && /^[\s·«»—★~*]*$/.test(t))) return;
      const fondo = c.fondo ? 'background:' + _disCol(c.fondo) + ';padding:' + ((+c.pad || 0) * s) + 'px ' + ((+c.pad || 0) * 1.4 * s) + 'px;border-radius:' + ((+c.r || 0) * s) + 'px;' : '';
      const col = _disCol(c.color);
      estilo = 'text-align:' + (c.al || 'left') + ';line-height:' + (c.lh || 1.12) + ';font-size:' + ((+c.tam || 40) * s) + 'px;' + (c.vertical ? 'writing-mode:vertical-rl;transform:rotate(180deg);' : '');
      inner = '<span style="display:inline-block;' + fondo + 'font-family:' + (c.fuente === 'titulo' ? ft : fx) + ';font-size:' + ((+c.tam || 40) * s) + 'px;font-weight:' + (c.peso || 400) + ';'
        + (c.contorno ? 'color:transparent;-webkit-text-stroke:' + Math.max(0.6, (+c.trazo || 2) * s) + 'px ' + col + ';' : 'color:' + col + ';')
        + 'letter-spacing:' + ((+c.ls || 0) * s) + 'px;' + (c.mayus ? 'text-transform:uppercase;' : '') + (c.tachado ? 'text-decoration:line-through;' : '') + (c.cursiva ? 'font-style:italic;' : '') + 'white-space:' + (c.linea ? 'nowrap' : 'pre-wrap') + '">' + _disMarcas(disA(t)) + '</span>';
    } else if (c.t === 'lista'){
      const L = cx.ben.slice(0, +c.max || 3); if (!L.length) return;
      const tam = (+c.tam || 30) * s;
      estilo = 'font-family:' + fx + ';color:' + _disCol(c.color) + ';';
      inner = L.map(b => '<div style="display:flex;gap:' + (tam * 0.45) + 'px;margin-bottom:' + (tam * 0.7) + 'px"><span style="font-size:' + tam + 'px;line-height:1.1;color:' + _disCol('acento') + '">' + disA(c.icono || '✓') + '</span>'
        + '<div><div style="font-size:' + tam + 'px;font-weight:600;line-height:1.15">' + disA(b.titulo) + '</div>'
        + (c.detalle && b.texto ? '<div style="font-size:' + (tam * 0.72) + 'px;line-height:1.25;margin-top:' + (tam * 0.15) + 'px;opacity:.85">' + disA(b.texto) + '</div>' : '') + '</div></div>').join('');
    } else if (c.t === 'colores' && c.estilo === 'mini'){
      const P = cx.portadas; if (!P.length) return; const lado = (+c.tam || 46) * s;
      estilo = 'display:flex;align-items:center;gap:' + (lado * 0.35) + 'px;justify-content:' + ({ left: 'flex-start', right: 'flex-end' }[c.al] || 'center') + ';';
      inner = P.slice(0, 8).map(x => { const hx = _disColorHex(x.c), on = x.c === cx.color;
        return '<div title="' + disA(x.c) + '" style="width:' + lado + 'px;height:' + lado + 'px;border-radius:50%;flex:none;overflow:hidden;background:' + (hx || '#e9e7e2') + ';'
          + (on ? 'box-shadow:0 0 0 ' + (3 * s) + 'px ' + _disCol((d.ajustes && d.ajustes.fondo) || 'fondo') + ',0 0 0 ' + (5 * s) + 'px ' + _disCol('texto') + ';' : 'box-shadow:inset 0 0 0 ' + (1.5 * s) + 'px rgba(0,0,0,.14);') + '">'
          + (hx || !x.src ? '' : '<img crossorigin="anonymous" src="' + disA(_disTam(x.src, 200)) + '" style="width:100%;height:100%;object-fit:cover;object-position:center 30%;display:block;pointer-events:none" draggable="false">') + '</div>'; }).join('');
    } else if (c.t === 'colores'){
      const P = cx.portadas.filter(x => x.src); if (P.length < 2) return;
      const punto = c.estilo === 'punto', lado = punto ? 120 : 110;
      estilo = 'display:flex;justify-content:center;gap:' + ((punto ? 26 : 14) * s) + 'px;';
      inner = P.slice(0, 6).map(x => '<div style="' + (punto ? 'width:' + (lado * s) + 'px;' : 'flex:1;min-width:0;') + 'text-align:center;font-family:' + fx + ';font-size:' + (19 * s) + 'px;letter-spacing:' + (1.5 * s) + 'px;text-transform:uppercase;color:' + _disCol('texto') + '">'
        + '<div style="height:' + (lado * s) + 'px;' + (punto ? 'width:' + (lado * s) + 'px;border-radius:50%;' : 'border-radius:' + (8 * s) + 'px;') + 'overflow:hidden;background:#e9e7e2;'
        + (x.c === cx.color ? 'box-shadow:0 0 0 ' + (3 * s) + 'px ' + _disCol('fondo') + ',0 0 0 ' + (5 * s) + 'px ' + _disCol('principal') + ';' : '') + '">'
        + '<img crossorigin="anonymous" src="' + disA(_disTam(x.src, 300)) + '" style="width:100%;height:100%;object-fit:cover;object-position:center 25%;display:block;pointer-events:none" draggable="false"></div>'
        + '<div style="margin-top:' + (10 * s) + 'px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + disA(x.c) + '</div></div>').join('');
    }
    h += '<div' + da + ' style="' + pos + estilo + sel + cur + '">' + inner + (opt.edit && opt.sel === i ? '<span class="dis-tirador" data-tirador="' + i + '"></span>' : '') + '</div>';
  });
  if (opt.guia && d.formato === '9x16'){
    const z = 'position:absolute;left:0;width:100%;background:repeating-linear-gradient(45deg,rgba(124,92,255,.16) 0 8px,transparent 8px 16px);border:1px dashed #7c5cff;pointer-events:none;';
    h += '<div title="Zona que tapa Instagram (arriba)" style="' + z + 'top:0;height:' + DIS_SEGURA.arriba + '%"></div><div title="Zona que tapa Instagram (abajo)" style="' + z + 'bottom:0;height:' + DIS_SEGURA.abajo + '%"></div>';
  }
  if (opt.edit) h += '<div class="dis-guia-v" style="display:none"></div><div class="dis-guia-h" style="display:none"></div>';
  return h + '</div>';
}

/* ── íconos de línea (mismo trazo que el menú del ERP) ── */
const DIS_ICO = {
  ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ojoNo: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/>',
  arriba: '<path d="M12 19V5M5 12l7-7 7 7"/>', abajo: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  copia: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', basura: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  lapiz: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>', lote: '<path d="M4 7h11M4 12h16M4 17h11M17 4l3 3-3 3"/>', enviar: '<path d="M4 12l16-8-6 16-3-7-7-1z"/>',
  archivo: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/>', volver: '<path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"/>',
  deshacer: '<path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"/>', rehacer: '<path d="M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3"/>',
  grilla: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  texto: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', foto: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  forma: '<rect x="4" y="4" width="16" height="16" rx="2"/>', degradado: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 14h16M4 18h16" opacity=".5"/>',
  logo: '<path d="M12 3l2.5 6H21l-5 4 2 7-6-4-6 4 2-7-5-4h6.5z"/>', lista: '<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  colores: '<circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><circle cx="12" cy="6" r="3"/>', subir: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>'
};
function disIco(n, t){ return '<svg viewBox="0 0 24 24" width="' + (t || 16) + '" height="' + (t || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (DIS_ICO[n] || '') + '</svg>'; }
function _disIb(ico, tit, js, cls){ return '<button type="button" class="dis-ib' + (cls ? ' ' + cls : '') + '" title="' + disA(tit) + '" onclick="' + js + '">' + disIco(ico) + '</button>'; }

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
  return _disOrdenar((DIS.filas || []).filter(f => (DIS.ver === 'archivados' ? f.estado === 'archivada' : DIS.ver === 'ganadoras' ? f.estado === 'ganadora' : f.estado !== 'archivada')
    && (!DIS.fForm || f.formato === DIS.fForm) && (!DIS.fMsj || f.mensaje === DIS.fMsj) && (!q || _mkNorm(f.nombre).indexOf(q) >= 0)));
}
function disPintar(){
  const el = document.getElementById('mkDis'); if (!el) return;
  const fs = DIS.filas || [], vis = _disVisibles();
  const n = { plantillas: DIS_BASE.length, activos: fs.filter(f => f.estado !== 'archivada').length, ganadoras: fs.filter(f => f.estado === 'ganadora').length, archivados: fs.filter(f => f.estado === 'archivada').length };
  const b = (k, t) => '<button class="btn' + (DIS.ver === k ? ' on' : '') + '" onclick="DIS.ver=\'' + k + '\';disPintar()">' + t + ' <span class="dis-cnt">' + n[k] + '</span></button>';
  const sel = (id, v, ops, ph) => '<select onchange="' + id + '=this.value;disPintar()"><option value="">' + ph + '</option>' + ops.map(o => '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
  const m = DIS.marca || DIS_MARCA_DEF;
  let h = '<div class="dis-cabeza"><div><div class="ui-blo">Diseños de anuncios</div><div class="ui-nota">Plantillas que se llenan solas con fotos, precios, colores y reseñas de cada prenda.</div></div>'
    + '<div class="dis-barra-der">' + (DIS.puede ? '<button class="btn" onclick="disPiezasAbrir(null)">🧩 Piezas <span class="dis-cnt">' + DIS.piezas.filter(x => x.estado !== 'archivada').length + '</span></button><button class="btn" onclick="disADNAbrir()" title="Qué tienen en común los diseños que venden">🧬 ADN</button><button class="btn" onclick="disFondosAbrir()">🏞️ Fondos</button><button class="btn" onclick="disMarcaAbrir()">🎨 Marca</button><button class="btn on" onclick="disNuevoAbrir()">➕ Nuevo diseño</button>' : '') + '</div></div>'
    + '<div class="dis-barra"><div class="dis-barra-izq">' + b('plantillas', '✨ Plantillas') + b('activos', 'Mis diseños') + b('ganadoras', '🏆 Ganadoras') + b('archivados', 'Archivados') + '</div>'
    + (DIS.ver === 'plantillas' ? '</div>' : '<div class="dis-barra-der">' + sel('DIS.fForm', DIS.fForm, [['4x5', 'Feed 4:5'], ['9x16', 'Historias 9:16']], 'Todos los formatos') + sel('DIS.fMsj', DIS.fMsj, DIS_MSJ, 'Todos los mensajes')
    + '<input type="search" placeholder="🔍 Buscar por nombre" value="' + disA(DIS.q) + '" oninput="DIS.q=this.value;clearTimeout(DIS._t);DIS._t=setTimeout(disPintar,250)" style="width:190px"></div></div>');
  if (!m.aprobada && DIS.puede) h += '<div class="dis-aviso">🎨 Marca lista con el azul, naranja y crema de Tulula. Revísala en <b>🎨 Marca</b> y apruébala.</div>';
  if (DIS.msg) h += '<div class="dis-aviso">' + DIS.msg + ' <button class="dis-ib" onclick="DIS.msg=\'\';disPintar()" title="Cerrar">' + disIco('cerrar', 14) + '</button></div>';
  if (DIS.ver === 'plantillas'){ el.innerHTML = h + _disPlantillasHtml(); if (DIS.puede) _disArrastrable(document.getElementById('disNuevoGrilla'), ks => _disGuardarOrdenPlant(ks)); disNuevoPintar(); return; }
  if (!vis.length) h += '<div class="mkl-vacio">' + (fs.length ? 'Nada para mostrar con estos filtros.' : 'Todavía no hay diseños. Crea el primero con ➕ Nuevo diseño.') + '</div>';
  else h += '<div class="dis-grilla">' + vis.map(f => _disTarjeta(f)).join('') + '</div>';
  el.innerHTML = h;
  if (DIS.puede && DIS.ver === 'activos') _disArrastrable(el.querySelector('.dis-grilla'), ks => _disGuardarOrdenDis(ks.filter(k => { const f = (DIS.filas || []).find(x => x.id === +k); return f && f.estado !== 'ganadora'; })));
  vis.forEach(f => _disMini(f));
}
function _disTarjeta(f){
  const est = f.estado, chip = est === 'ganadora' ? 'ok' : est === 'prueba' ? 'am' : '';
  const msj = (DIS_MSJ.find(x => x[0] === f.mensaje) || ['', f.mensaje])[1], npz = _disNPz(f.id);
  const acc = !DIS.puede ? '' : est === 'archivada'
    ? '<button class="btn" onclick="disEstado(' + f.id + ',\'borrador\')">↩️ Restaurar</button><button class="btn" onclick="disEliminar(' + f.id + ')">🗑 Eliminar</button>'
    : '<button class="btn" onclick="disEditar(' + f.id + ')">✏️ Editar</button><button class="btn" onclick="disLoteAbrir(' + f.id + ')" title="Varios productos y colores de una vez">🔁 Replicar</button>'
      + '<button class="btn" onclick="disUsar(' + f.id + ')" title="Hacer la imagen y llevarla a 🎬 Biblioteca › Por usar">📤 Usar</button>'
      + '<button class="btn" onclick="disLoteAbrir(' + f.id + ',1)" title="Elige 2 a 10 prendas o colores y sale como carrusel">🎠 Carrusel</button>'
      + '<button class="btn" onclick="disCriticarFila(' + f.id + ')" title="Nota de la IA y qué mejorar (~US$0,01)">🧐 Revisar</button>'
      + '<button class="btn" onclick="disVideoAbrir(' + f.id + ')" title="Video corto para Reels e Historias (sin costo)">🎬 Video</button>'
      + '<button class="btn" onclick="disMarcoCatalogo(' + f.id + ')" title="Marco transparente para anuncios de catálogo de Meta">🖼 Marco catálogo</button>'
      + '<button class="btn" onclick="disDuplicar(' + f.id + ')">⧉ Duplicar</button><button class="btn" onclick="disEstado(' + f.id + ',\'archivada\')" title="Se guarda en Archivados y se puede restaurar">🗄 Archivar</button>'
      + '<button class="btn" onclick="disEliminar(' + f.id + ')">🗑 Eliminar</button>';
  const estSel = DIS.puede && est !== 'archivada' ? '<select class="dis-est" onchange="disEstado(' + f.id + ',this.value)">' + ['borrador', 'prueba', 'ganadora'].map(k => '<option value="' + k + '"' + (k === est ? ' selected' : '') + '>' + DIS_EST[k] + '</option>').join('') + '</select>'
    : '<span class="ui-chip ' + chip + '">' + DIS_EST[est] + '</span>';
  return '<div class="dis-tarj" data-k="' + f.id + '"' + (DIS.puede && est !== 'archivada' && est !== 'ganadora' ? ' draggable="true" title="Arrastra para cambiar el orden"' : '') + '><div class="dis-mini" id="disMini' + f.id + '" onclick="' + (DIS.puede && est !== 'archivada' ? 'disEditar(' + f.id + ')' : '') + '"></div>'
    + '<div class="dis-tarj-pie"><div class="dis-fila"><div class="ui-tot dis-nom" title="' + disA(f.nombre) + '"><span class="dis-cod">#' + _disCod(f.id) + '</span> ' + esc(f.nombre) + '</div>' + estSel + '</div>'
    + '<div class="dis-fila" style="margin:2px 0">' + (DIS.puede && est !== 'archivada' ? '<select class="dis-est" title="Público al que apunta" onchange="disTempCambiar(' + f.id + ',this.value)">' + DIS_TEMP.map(o => '<option value="' + o[0] + '"' + (_disTemp(f) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>' : _disTempChip(_disTemp(f))) + '</div>'
    + _disResLinea(f)
    + (_disGemelo(f) ? '<div class="ui-nota" style="color:#e9c53b" title="Meta trata anuncios casi iguales como uno solo: cambia la composición, no solo el color">⚠ ' + Math.round(_disGemelo(f).p * 100) + '% igual a #' + _disCod(_disGemelo(f).f.id) + '</div>' : '')
    + (_disCritDe(f.id) ? '<div class="dis-res"><span class="ui-nota" title="' + disA(((_disCritDe(f.id).detalle || {}).veredicto) || '') + '">🧐 Nota IA</span><span class="dis-etapa ' + (+_disCritDe(f.id).total >= 8 ? 'e3' : +_disCritDe(f.id).total >= 6 ? 'e1' : '') + '">' + String(_disCritDe(f.id).total).replace('.', ',') + '/10</span></div>' : '')
    + '<div class="ui-nota">' + (f.formato === '9x16' ? 'Historias 9:16' : 'Feed 4:5') + ' · ' + esc(msj) + (npz ? ' · <a href="#" onclick="disPiezasAbrir(' + f.id + ');return false">' + npz + ' piezas</a>' : '') + (f.usos ? ' · usado ' + f.usos + '×' : '') + '</div>'
    + '<div class="mkcr-acc dis-acc">' + acc + '</div></div></div>';
}
async function _disMini(f){
  const box = document.getElementById('disMini' + f.id); if (!box) return;
  const aj = f.ajustes || {}, p = _disProd(aj.prev_handle); if (!p){ box.innerHTML = '<div class="ui-nota">Sin productos</div>'; return; }
  const inf = await disInfo(p.handle), W = (DIS_TAM[f.formato] || DIS_TAM['4x5'])[0];
  const cx = disCtx(p, inf, aj.prev_color, aj); try { await _disLuzPrep(f, cx); } catch (_) {}
  box.innerHTML = disHtml(f, cx, 248 / W, { ancho: 500 });
  if ((f.capas || []).some(c => c.t === 'foto' && c.sinfondo && _disVis(c, cx) && !DIS.sinf[_disArch(_disFotoSrc(cx, c.src))]))
    DIS._colaSF = (DIS._colaSF || Promise.resolve()).then(() => _disSinFondoPrep(f, cx)).then(() => { const b2 = document.getElementById('disMini' + f.id); if (b2) b2.innerHTML = disHtml(f, cx, 248 / W, { ancho: 500 }); }).catch(() => {});
}

/* ── crear, duplicar, estado ── */
/* 21-nov · «Nuevo diseño» = la pestaña ✨ Plantillas (Pablo: que sea lo primero que se ve) */
function disNuevoAbrir(){ DIS.ver = 'plantillas'; disPintar(); const el = document.getElementById('mkDis'); if (el) el.scrollIntoView({ block: 'start' }); }
function _disPlantillasHtml(){
  const seg = (k, t) => '<button type="button" class="' + (DIS.tipoNuevo === k ? 'on' : '') + '" onclick="DIS.tipoNuevo=\'' + k + '\';disPintar()">' + t + '</button>';
  let h = '<div class="dis-barra"><div class="dis-barra-izq"><span class="ui-nota">Elige una plantilla para empezar · todo se cambia después</span></div><div class="dis-barra-der">'
    + '<div class="dis-seg">' + [['', 'Todos'], ...DIS_TEMP].map(o => '<button type="button" class="' + ((DIS.fTemp || '') === o[0] ? 'on' : '') + '" title="' + disA(DIS_TEMP_NOTA[o[0]] || 'Todas las plantillas') + '" onclick="DIS.fTemp=\'' + o[0] + '\';disPintar()">' + o[1] + '</button>').join('') + '</div>'
    + '<div class="dis-seg">' + seg('estatico', '🖼 Una imagen') + seg('carrusel', '🎠 Carrusel') + '</div>'
    + '<select id="disNuevoForm" onchange="disNuevoPintar()"><option value="4x5">Feed 4:5</option><option value="9x16">Historias 9:16</option></select></div></div>'
    + _disCalendarioHtml()
    + (DIS.tipoNuevo === 'carrusel' ? '<div class="dis-aviso">🎠 Carrusel: eliges la plantilla, la guardas y luego marcas 2 a 10 prendas o colores. Cada una sale como una tarjeta del carrusel, en el orden que las elijas, y va junta a 🎬 Biblioteca › Por usar.</div>' : '')
    + '<div class="dis-grilla" id="disNuevoGrilla">';
  if (DIS.puede) h += '<div class="dis-tarj dis-elegir" onclick="disCapturaAbrir()"><div class="dis-mini dis-blanco dis-ia">📷<b>Crear desde captura</b><span class="ui-nota">Pega un anuncio que te guste y la IA lo adapta a Tulula</span></div><div class="dis-tarj-pie"><div class="ui-tot">✨ Desde captura</div><div class="ui-nota">~US$0,02 cada una</div></div></div>';
  _disOrdenPlantillas().filter(i => !DIS.fTemp || _disTemp(DIS_BASE[i]) === DIS.fTemp).forEach(i => { const b = DIS_BASE[i]; h += '<div class="dis-tarj dis-elegir" data-k="' + i + '"' + (DIS.puede ? ' draggable="true"' : '') + ' onclick="disNuevo(' + i + ')"><div class="dis-mini" id="disBase' + i + '"></div><div class="dis-tarj-pie"><div class="ui-tot"><span class="dis-cod">' + _disCod(i + 1) + '</span> ' + esc(b.nombre) + ' ' + _disTempChip(_disTemp(b)) + '</div><div class="ui-nota">Estilo ' + esc(b.ref || '') + (DIS.puede ? ' · arrastra para ordenar' : '') + '</div></div></div>'; });
  return h + '<div class="dis-tarj dis-elegir" onclick="disNuevo(-1)"><div class="dis-mini dis-blanco">＋ En blanco</div><div class="dis-tarj-pie"><div class="ui-tot">En blanco</div><div class="ui-nota">Arma el tuyo desde cero</div></div></div></div>';
}
function disNuevoPintar(){
  const p = _disProdLindo(), form = (document.getElementById('disNuevoForm') || {}).value || '4x5'; if (!p) return;
  disInfo(p.handle).then(inf => DIS_BASE.forEach((b, i) => { const el = document.getElementById('disBase' + i); if (el) el.innerHTML = disHtml({ nombre: b.nombre, mensaje: b.mensaje, formato: form, capas: b.capas, ajustes: b.ajustes || {} }, disCtx(p, inf, '', { fecha: DIS.fechaSel }), 248 / 1080, { ancho: 500 }); }));
}
function disNuevo(i){
  const b = DIS_BASE[i], form = (document.getElementById('disNuevoForm') || {}).value || '4x5';
  const n = document.getElementById('disNuevo'); if (n) n.remove();
  const p = (DIS.prods || [])[0];
  DIS.ed = { id: null, nombre: b ? b.nombre : 'Diseño nuevo', formato: form, tipo: DIS.tipoNuevo === 'carrusel' ? 'carrusel' : 'estatico', mensaje: b ? b.mensaje : 'producto', capas: JSON.parse(JSON.stringify(b ? b.capas : [])), ajustes: Object.assign({}, (b && b.ajustes) || {}, { prev_handle: (_disProdLindo() || p || {}).handle || '', temp: b ? _disTemp(b) : 'frio', fecha: (_disFecha(DIS.fechaSel) || {}).k || '' }), padre_id: null, _sucio: true };
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

/* ── editor (mini app): lienzo al centro, panel por secciones, mover y agrandar con el mouse, guías de centro,
   deshacer/rehacer, atajos de teclado y vista en 6 productos a la vez ── */
/* 21-nov · Pablo pidió poder eliminar (con confirmación). Borra el diseño y sus piezas; lo ya enviado a la Biblioteca se queda allá. */
async function disEliminar(id){
  const f = (DIS.filas || []).find(x => x.id === id); if (!f) return; const np = _disNPz(id);
  if (!await _uiSeguro('¿Eliminar «' + f.nombre + '»' + (np ? ' y sus ' + np + ' piezas' : '') + '? No se puede deshacer. (Lo que ya está en la Biblioteca no se borra.)', 'Eliminar')) return;
  try { const r = await _mklSb('/rest/v1/rpc/mk_diseno_eliminar', { method: 'POST', body: JSON.stringify({ p_id: id }) }); if (!r || !r.ok) throw new Error((r && r.error) || 'no se eliminó');
    DIS.filas = DIS.filas.filter(x => x.id !== id); DIS.piezas = DIS.piezas.filter(x => x.diseno_id !== id); DIS.msg = '🗑 «' + esc(f.nombre) + '» eliminado.'; }
  catch (e) { DIS.msg = '<span class="mal">No se eliminó (' + esc(e.message) + ').</span>'; }
  disPintar();
}
function disEditar(id){
  const f = (DIS.filas || []).find(x => x.id === id); if (!f) return;
  DIS.ed = JSON.parse(JSON.stringify(f)); DIS.ed.ajustes = DIS.ed.ajustes || {};
  DIS.sel = -1; DIS.prod = DIS.ed.ajustes.prev_handle || (_disProdLindo() || {}).handle || ''; DIS.color = DIS.ed.ajustes.prev_color || '';
  _disEdAbrir();
}
function _disEdAbrir(){
  const v = document.getElementById('disEd'); if (v) v.remove();
  DIS.hist = { pila: [], futuro: [] };
  const prods = (DIS.prods || []).map(p => '<option value="' + disA(p.handle) + '"' + (p.handle === DIS.prod ? ' selected' : '') + '>' + esc(p.titulo) + (_disActivo(p) ? '' : ' (borrador)') + '</option>').join('');
  const h = '<div class="dis-modal" id="disEd"><div class="dis-caja dis-ed"><div class="dis-cab">'
    + '<input id="disEdNombre" class="dis-nombre" value="' + disA(DIS.ed.nombre) + '" maxlength="120" oninput="DIS.ed.nombre=this.value;DIS.ed._sucio=true" title="Nombre del diseño">'
    + '<div class="dis-seg">' + ['4x5', '9x16'].map(f => '<button type="button" data-f="' + f + '" class="' + (DIS.ed.formato === f ? 'on' : '') + '" onclick="disEdFormato(\'' + f + '\')">' + (f === '4x5' ? 'Feed 4:5' : 'Historias 9:16') + '</button>').join('') + '</div>'
    + '<select onchange="DIS.ed.mensaje=this.value;DIS.ed._sucio=true" title="Mensaje del anuncio">' + DIS_MSJ.map(o => '<option value="' + o[0] + '"' + (DIS.ed.mensaje === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>'
    + '<select title="Precio en este diseño" onchange="DIS.ed.ajustes.precio=this.value;DIS.ed._sucio=true;disEdPintar()">' + [['', 'Precio: según público'], ['si', 'Precio: siempre'], ['no', 'Precio: nunca']].map(o => '<option value="' + o[0] + '"' + ((DIS.ed.ajustes.precio || '') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>'
    + _disIb('deshacer', 'Deshacer (Ctrl+Z)', 'disDeshacer()') + _disIb('rehacer', 'Rehacer (Ctrl+Y)', 'disRehacer()')
    + '<span style="flex:1"></span><span class="ui-nota" id="disEdRes"></span>'
    + '<button class="btn" onclick="disCriticarEditor()" title="La IA le pone nota y dice qué mejorar (~US$0,01)">🧐 Revisar</button>'
    + '<button class="btn" onclick="disIAMensajeAbrir()" title="Escribe lo que quieres cambiar y la IA lo hace (~US$0,01)">✨ Pedir un cambio</button>'
    + '<button class="btn" onclick="disVerMuchos()" title="El mismo diseño con 6 productos distintos">' + disIco('grilla', 14) + ' Ver en 6 productos</button>'
    + '<button class="btn' + (DIS.ed.tipo === 'carrusel' ? ' on' : '') + '" onclick="disLoteDesdeEditor(1)" title="Guarda y arma un carrusel con 2 a 10 prendas o colores">🎠 Carrusel</button><button class="btn" onclick="disLoteDesdeEditor()">🔁 Replicar</button><button class="btn" onclick="disUsar(null)">📤 Usar</button>'
    + '<button class="btn on" onclick="disGuardar()">Guardar</button>' + _disIb('cerrar', 'Cerrar', 'disEdCerrar()') + '</div>'
    + '<div class="dis-ed-cuerpo"><div class="dis-ed-izq"><div class="dis-ed-lienzo" id="disEdLienzo"></div>'
    + '<div class="dis-ed-prueba"><span class="ui-nota">Probar con</span><select id="disEdProd" onchange="disEdProd(this.value)">' + prods + '</select>'
    + '<select id="disEdColor" onchange="DIS.color=this.value;disEdPintar()"></select><button class="btn" onclick="disEdProd(null,1)" title="Siguiente producto">Siguiente ›</button>'
    + '<span class="ui-nota" style="margin-left:auto">Arrastra para mover · esquina para agrandar · flechas para afinar · Ctrl+Z deshace</span></div></div>'
    + '<div class="dis-ed-panel" id="disEdPanel"></div></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
  _disArrastreIni(); _disTeclas(true); disEdPintar(); DIS._orig = (DIS.ed.id || DIS.ed.ajustes.origen !== 'captura') ? _disHuella() : '';
}
/* 21-nov · «cambios sin guardar» = lo que guardarías difiere de lo que abriste (mirar en 9:16 o cambiar el producto de prueba no cuenta) */
function _disHuella(){ const d = DIS.ed; if (!d) return ''; const a = Object.assign({}, d.ajustes || {}); delete a.prev_handle; delete a.prev_color; return JSON.stringify([d.nombre, d.mensaje, d.capas, a]); }
function disEdFormato(f){ _disMemo(); DIS.ed.formato = f; DIS.ed._sucio = true; document.querySelectorAll('#disEd .dis-seg button').forEach(b => b.classList.toggle('on', b.dataset.f === f)); disEdPintar(); }
async function disEdCerrar(){
  if (DIS.ed && _disHuella() !== DIS._orig && !await _uiSeguro('Hay cambios sin guardar. ¿Cerrar igual?', 'Cerrar sin guardar')) return;
  const v = document.getElementById('disEd'); if (v) v.remove(); DIS.ed = null; _disTeclas(false);
}
function disEdProd(handle, paso){
  const L = (DIS.prods || []).filter(_disActivo); if (paso){ const i = L.findIndex(p => p.handle === DIS.prod); handle = (L[(i + 1) % L.length] || {}).handle; const s = document.getElementById('disEdProd'); if (s) s.value = handle; }
  DIS.prod = handle; DIS.color = ''; disEdPintar();
}
function _disLienzoRepintar(){ const lz = document.getElementById('disEdLienzo'); if (!(lz && DIS.ed && DIS._cx)) return; lz.innerHTML = disHtml(DIS.ed, DIS._cx, DIS._s, { edit: true, sel: DIS.sel, guia: true, ancho: 900 });
  if (!DIS._luzCorre){ DIS._luzCorre = 1; _disLuzPrep(DIS.ed, DIS._cx).then(n => { DIS._luzCorre = 0; if (n) _disLienzoRepintar(); }).catch(() => { DIS._luzCorre = 0; }); } }
async function disEdPintar(){
  if (!DIS.ed) return;
  const p = _disProd(DIS.prod), inf = p ? await disInfo(p.handle) : {};
  if (!DIS.ed) return;
  const cx = disCtx(p, inf, DIS.color, DIS.ed.ajustes); DIS.color = cx.color; DIS._cx = cx;
  const cs = document.getElementById('disEdColor'); if (cs) cs.innerHTML = cx.colores.map(c => '<option' + (c === cx.color ? ' selected' : '') + '>' + esc(c) + '</option>').join('') || '<option value="">Sin color</option>';
  const lz = document.getElementById('disEdLienzo'); if (!lz) return;
  const [W, H] = DIS_TAM[DIS.ed.formato] || DIS_TAM['4x5'], alto = Math.max(320, lz.clientHeight - 24), ancho = Math.max(240, lz.clientWidth - 24);
  DIS._s = Math.min(alto / H, ancho / W);
  _disLienzoRepintar(); _disPanel(cx);
}
/* deshacer / rehacer */
function _disFoto(){ return JSON.stringify({ c: DIS.ed.capas, a: DIS.ed.ajustes, f: DIS.ed.formato }); }
function _disMemo(){ if (!DIS.ed || !DIS.hist) return; DIS.hist.pila.push(_disFoto()); if (DIS.hist.pila.length > 80) DIS.hist.pila.shift(); DIS.hist.futuro = []; }
function _disVolverA(t){ const o = JSON.parse(t); DIS.ed.capas = o.c; DIS.ed.ajustes = o.a; DIS.ed.formato = o.f; DIS.ed._sucio = true; if (DIS.sel >= DIS.ed.capas.length) DIS.sel = -1; disEdPintar(); }
function disDeshacer(){ const H = DIS.hist; if (!DIS.ed || !H || !H.pila.length) return; H.futuro.push(_disFoto()); _disVolverA(H.pila.pop()); }
function disRehacer(){ const H = DIS.hist; if (!DIS.ed || !H || !H.futuro.length) return; H.pila.push(_disFoto()); _disVolverA(H.futuro.pop()); }
function _disTeclas(on){
  if (typeof document === 'undefined') return;
  if (DIS._kh){ document.removeEventListener('keydown', DIS._kh); DIS._kh = null; }
  if (!on) return;
  DIS._kh = e => {
    if (!DIS.ed || !document.getElementById('disEd')) return;
    const enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || ''), mod = e.ctrlKey || e.metaKey, k0 = String(e.key || '').toLowerCase();
    if (mod && k0 === 'z' && !enCampo){ e.preventDefault(); return e.shiftKey ? disRehacer() : disDeshacer(); }
    if (mod && k0 === 'y' && !enCampo){ e.preventDefault(); return disRehacer(); }
    if (mod && k0 === 's'){ e.preventDefault(); return disGuardar(); }
    if (enCampo || DIS.sel < 0) return;
    const c = DIS.ed.capas[DIS.sel]; if (!c) return;
    if (mod && k0 === 'd'){ e.preventDefault(); return disCapaDuplicar(DIS.sel); }
    if (e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); return disCapaQuitar(DIS.sel); }
    if (e.key === 'Escape'){ DIS.sel = -1; return disEdPintar(); }
    const d = e.shiftKey ? 2 : 0.5, k = { ArrowLeft: ['x', -d], ArrowRight: ['x', d], ArrowUp: ['y', -d], ArrowDown: ['y', d] }[e.key];
    if (k){ e.preventDefault(); if (!DIS._nudge){ _disMemo(); DIS._nudge = 1; } clearTimeout(DIS._nt); DIS._nt = setTimeout(() => { DIS._nudge = 0; _disPanel(DIS._cx); }, 600);
      const f = DIS.ed.formato, g = _disGeo(c, f); g[k[0]] = Math.round((g[k[0]] + k[1]) * 2) / 2; _disGeoSet(c, f, g); DIS.ed._sucio = true; _disLienzoRepintar(); }
  };
  document.addEventListener('keydown', DIS._kh);
}
const DIS_TIPOS = { texto: ['texto', 'Texto'], foto: ['foto', 'Foto'], forma: ['forma', 'Forma'], degradado: ['degradado', 'Degradado'], logo: ['logo', 'Logo'], lista: ['lista', 'Beneficios'], colores: ['colores', 'Colores'] };
function _disCapaNombre(c){
  if (c.t === 'texto') return String(c.txt || '').replace(/\{\{\w+\}\}/g, m => '‹' + ((DIS_CAMPOS.find(x => x[0] === m) || ['', m.replace(/[{}]/g, '')])[1]) + '›').slice(0, 34) || 'Texto';
  if (c.t === 'foto') return 'Foto · ' + (String(c.src || 'color:0').indexOf('ben') === 0 ? 'detalle ' + (+String(c.src).split(':')[1] + 1) : String(c.src || '').indexOf('url') === 0 ? 'imagen propia' : 'del color') + (c.sinfondo ? ' · sin fondo' : '');
  return (DIS_TIPOS[c.t] || ['', c.t])[1];
}
function _disPanel(cx){
  const pn = document.getElementById('disEdPanel'); if (!pn || !DIS.ed) return;
  const C = DIS.ed.capas, ab = DIS._abiertos || (DIS._abiertos = { capas: 1, capa: 1, ben: 0, fondo: 0 });
  const sec = (k, t, cuerpo, extra) => '<details class="dis-sec"' + (ab[k] ? ' open' : '') + ' ontoggle="DIS._abiertos.' + k + '=this.open?1:0"><summary><span>' + t + '</span>' + (extra || '') + '</summary><div class="dis-sec-c">' + cuerpo + '</div></details>';
  const filas = C.map((c, i) => '<div class="dis-capa' + (DIS.sel === i ? ' on' : '') + (c.oculto ? ' apagada' : '') + '" onclick="DIS.sel=' + i + ';disEdPintar()">'
    + '<span class="dis-capa-ico">' + disIco((DIS_TIPOS[c.t] || ['forma'])[0], 15) + '</span><span class="dis-capa-nom">' + esc(_disCapaNombre(c)) + '</span>'
    + (c.vis && c.vis !== 'siempre' ? '<span class="dis-capa-cond" title="' + disA((DIS_VIS.find(v => v[0] === c.vis) || ['', ''])[1]) + '">si…</span>' : '')
    + '<span class="dis-capa-acc">' + _disIb(c.oculto ? 'ojoNo' : 'ojo', c.oculto ? 'Mostrar' : 'Ocultar', 'event.stopPropagation();disCapaSet(' + i + ',\'oculto\',' + !c.oculto + ')')
    + _disIb('arriba', 'Poner encima (tapa a la capa de arriba)', 'event.stopPropagation();disCapaMover(' + i + ',1)') + _disIb('abajo', 'Poner debajo (queda detrás de la capa de abajo)', 'event.stopPropagation();disCapaMover(' + i + ',-1)')
    + _disIb('copia', 'Duplicar capa (Ctrl+D)', 'event.stopPropagation();disCapaDuplicar(' + i + ')') + _disIb('basura', 'Quitar capa (Supr)', 'event.stopPropagation();disCapaQuitar(' + i + ')', 'rojo') + '</span></div>').reverse().join('');
  const add = '<div class="dis-add">' + Object.keys(DIS_TIPOS).map(k => '<button type="button" class="dis-add-b" onclick="disCapaAgregar(\'' + k + '\')" title="Agregar ' + DIS_TIPOS[k][1].toLowerCase() + '">' + disIco(DIS_TIPOS[k][0], 18) + '<span>' + DIS_TIPOS[k][1] + '</span></button>').join('') + '</div>';
  let h = sec('capas', 'Capas', add + '<div class="dis-capas">' + filas + '</div>', '<span class="dis-cnt">' + C.length + '</span>');
  const c = C[DIS.sel];
  h += c ? sec('capa', 'Editar · ' + esc(_disCapaNombre(c)), _disProps(c, DIS.sel, cx)) : '<div class="dis-sec dis-vacio ui-nota">Haz clic en algo del lienzo (o en una capa) para editarlo.</div>';
  if (DIS.ed.formato === '9x16') h += '<div class="dis-sec dis-916"><span class="ui-nota">Historias: lo rayado lo tapa Instagram. Todo se acomoda solo dentro de la zona segura.</span>'
    + (C.some(x => x.g916) ? '<button type="button" class="btn" onclick="disAuto916()">↺ Acomodar todo solo</button>' : '') + '</div>';
  h += sec('ben', 'Beneficios de esta prenda', _disBenPanel(cx));
  const fs = (DIS.ed.ajustes && DIS.ed.ajustes.fondo) || 'fondo';
  h += sec('fondo', 'Fondo del diseño', '<div class="dis-colores">' + DIS_COLS.map(o => '<button type="button" class="dis-col' + (fs === o[0] ? ' on' : '') + '" style="background:' + _disCol(o[0]) + '" title="' + o[1] + '" onclick="disFondo(\'' + o[0] + '\')"></button>').join('') + '</div>'
    + '<label class="btn dis-subir">' + disIco('subir', 14) + ' Subir una imagen de fondo<input type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="disFondoSubir(this.files[0])"></label>'
    + '<button class="btn" style="margin-top:6px" onclick="disFondosAbrir()">🏞️ Elegir de la biblioteca de Fondos</button><button class="btn" style="margin-top:6px" onclick="disIgualarLuz()" title="Calienta o enfría la prenda para que calce con la luz del fondo">🎨 Igualar luz con el fondo</button>'
    + '<div class="ui-nota">Ej.: una oficina, mármol o lino. Queda detrás de todo.</div>');
  pn.innerHTML = h;
}
function disFondo(k){ _disMemo(); DIS.ed.ajustes.fondo = k; DIS.ed._sucio = true; disEdPintar(); }
async function disFondoSubir(f){
  if (!f) return; const res = document.getElementById('disEdRes'); if (res) res.textContent = 'Subiendo imagen…';
  try { const url = await _disSubir(f, 'creativos/dis/fondos/' + Date.now() + '-' + String(f.name || 'fondo').replace(/[^a-z0-9.]+/gi, '-').toLowerCase());
    _disMemo(); DIS.ed.capas.unshift({ t: 'foto', src: 'url:' + url, x: 0, y: 0, w: 100, h: 100, pos: 'center center' }); DIS.sel = 0; DIS.ed._sucio = true; if (res) res.textContent = ''; disEdPintar(); }
  catch (e) { if (res) res.innerHTML = '<span class="mal">' + esc(e.message) + '</span>'; }
}
function disCentrar(i, eje){ const c = DIS.ed.capas[i]; if (!c) return; _disMemo(); const f = DIS.ed.formato, g = _disGeo(c, f); if (eje === 'x') g.x = Math.round((50 - g.w / 2) * 2) / 2; else if (g.h != null) g.y = Math.round((50 - g.h / 2) * 2) / 2; _disGeoSet(c, f, g); DIS.ed._sucio = true; disEdPintar(); }
function _disProps(c, i, cx){
  const num = (k, t, paso, ph) => '<label class="dis-prop"><span class="ui-nota">' + t + '</span><input type="number" step="' + (paso || 1) + '" value="' + (c[k] != null ? c[k] : '') + '" placeholder="' + (ph || '') + '" onchange="disCapaSet(' + i + ',\'' + k + '\',this.value===\'\'?null:+this.value)"></label>';
  const selc = (k, t, ops, v) => '<label class="dis-prop"><span class="ui-nota">' + t + '</span><select onchange="disCapaSet(' + i + ',\'' + k + '\',this.value)">' + ops.map(o => '<option value="' + o[0] + '"' + (String(v != null ? v : (c[k] != null ? c[k] : '')) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>';
  const chk = (k, t) => '<label class="dis-chk"><input type="checkbox"' + (c[k] ? ' checked' : '') + ' onchange="disCapaSet(' + i + ',\'' + k + '\',this.checked)"> <span>' + t + '</span></label>';
  const col = (k, t) => '<div class="dis-prop dis-ancho"><span class="ui-nota">' + t + '</span><div class="dis-colores">' + (k === 'fondo' || k === 'marcoColor' ? '<button type="button" class="dis-col nada' + (!c[k] ? ' on' : '') + '" title="Ninguno" onclick="disCapaSet(' + i + ',\'' + k + '\',\'\')"></button>' : '')
    + DIS_COLS.map(o => '<button type="button" class="dis-col' + (c[k] === o[0] ? ' on' : '') + '" style="background:' + _disCol(o[0]) + '" title="' + o[1] + '" onclick="disCapaSet(' + i + ',\'' + k + '\',\'' + o[0] + '\')"></button>').join('') + '</div></div>';
  const grupo = (t, x) => '<div class="dis-grupo"><div class="dis-grupo-t">' + t + '</div>' + x + '</div>';
  let cont = '', est = ''; const G = _disGeo(c, DIS.ed.formato);
  const numG = (k, t) => '<label class="dis-prop"><span class="ui-nota">' + t + '</span><input type="number" step="0.5" value="' + (G[k] != null ? G[k] : '') + '" onchange="disCapaSet(' + i + ',\'' + k + '\',this.value===\'\'?null:+this.value)"></label>';
  if (c.t === 'texto'){
    const tok = /\{\{\w+\}\}/.test(c.txt || '');
    cont = '<div class="dis-asi"><span class="ui-nota">Así se ve:</span> <b>' + esc(_disTxtSeg(cx, c.txt) || '(vacío en este producto)') + '</b></div>'
      + (tok ? '<button type="button" class="btn" style="margin:0 0 6px" onclick="disTextoFijar(' + i + ')" title="Cambia los campos automáticos por lo que ves, para escribir encima">✏️ Escribir mi propio texto</button>' : '')
      + '<textarea id="disTxt' + i + '" rows="2" style="width:100%" oninput="disCapaSet(' + i + ',\'txt\',this.value,1)">' + esc(c.txt || '') + '</textarea>'
      + '<div class="ui-nota" style="margin:4px 0">Doble clic en el lienzo para escribir directo · **negrita** · *cursiva* · ~~precio tachado~~</div>'
      + '<div class="ui-nota" style="margin:6px 0 4px">Campos que se llenan solos (pasa el mouse para ver el valor):</div>'
      + '<div class="dis-campos">' + DIS_CAMPOS.map(x => '<button type="button" class="dis-campo" title="' + disA(_disTxt(cx, x[0]) || '(vacío en este producto)') + '" onclick="disCampoInsertar(' + i + ',\'' + x[0] + '\')">' + x[1] + '</button>').join('') + '</div>';
    est = '<div class="dis-props">' + selc('fuente', 'Letra', [['titulo', 'Títulos (Tenor)'], ['texto', 'Texto (Jost)']]) + num('tam', 'Tamaño') + selc('peso', 'Grosor', [['300', 'Fino'], ['400', 'Normal'], ['500', 'Medio'], ['600', 'Negrita']], String(c.peso || 400))
      + selc('al', 'Alinear', [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']], c.al || 'left') + num('ls', 'Espaciado', 0.5) + num('lh', 'Interlínea', 0.05, '1.12') + num('op', 'Opacidad', 0.05, '1') + '</div>'
      + col('color', 'Color') + col('fondo', 'Fondo de etiqueta') + '<div class="dis-props">' + num('pad', 'Relleno') + num('r', 'Redondeo') + '</div>'
      + '<div class="dis-props">' + chk('mayus', 'MAYÚSCULAS') + chk('cursiva', 'Cursiva') + chk('tachado', 'Tachado') + chk('contorno', 'Solo contorno') + chk('vertical', 'Vertical') + chk('linea', 'En una sola línea') + '</div>';
  } else if (c.t === 'foto'){
    const n = cx.fotos.length, ops = [];
    for (let k = 0; k < 6; k++) ops.push(['color:' + k, k ? 'Foto ' + (k + 1) + ' del color' : 'Portada del color']);
    cx.ben.forEach((b, k) => ops.push(['ben:' + k, 'Detalle: ' + (b.titulo || 'beneficio ' + (k + 1))]));
    for (let k = 0; k < n; k++) ops.push(['n:' + k, 'Foto ' + (k + 1) + ' de ' + n + ' (todas)']);
    if (String(c.src || '').indexOf('url:') === 0) ops.unshift([c.src, 'Imagen propia']);
    cont = '<div class="dis-props">' + selc('src', 'Qué foto', ops, c.src || 'color:0') + '</div><div class="dis-props">' + chk('sinfondo', '✂ Quitar el fondo (gratis; la 1ª vez 5-15 s)') + chk('sombra', 'Sombra') + chk('arco', 'Forma de arco') + '</div>';
    est = '<div class="dis-props">' + selc('fit', 'Encaje', [['cover', 'Llenar'], ['contain', 'Entera']], c.fit || (c.sinfondo ? 'contain' : 'cover')) + num('zoom', 'Acercar ×', 0.1, '1') + num('fx', 'Foco horiz. %', 5, '50') + num('fy', 'Foco vert. %', 5, '0') + num('r', 'Redondeo') + num('marco', 'Marco') + '</div>' + (c.marco ? col('marcoColor', 'Color del marco') : '')
      + '<div class="dis-props"><button type="button" class="btn" onclick="disCapaPaso(' + i + ',\'bri\',-10)">☾ Más oscura</button><button type="button" class="btn" onclick="disCapaPaso(' + i + ',\'bri\',10)">☀ Más clara</button><button type="button" class="btn" onclick="disCapaSet(' + i + ',\'calidez\',Math.min(40,(+DIS.ed.capas[' + i + '].calidez||0)+8))">🔥 Más cálida</button><button type="button" class="btn" onclick="disCapaSet(' + i + ',\'calidez\',Math.max(-30,(+DIS.ed.capas[' + i + '].calidez||0)-8))">❄️ Más fría</button></div>'
      + '<div class="dis-props">' + num('bri', 'Brillo %', 5, '100') + num('con', 'Contraste %', 5, '100') + num('sat', 'Color %', 5, '100') + num('blur', 'Desenfoque', 1, '0') + num('calidez', 'Calidez (−30 a 40)', 2, '0') + '</div>';
  } else if (c.t === 'forma'){ est = col('color', 'Color') + '<div class="dis-props">' + num('op', 'Opacidad 0-1', 0.05) + num('r', 'Redondeo') + chk('elipse', 'Curva / óvalo') + num('blur', 'Desenfoque', 1, '0') + selc('mezcla', 'Mezcla', [['', 'Normal'], ['soft-light', 'Luz suave'], ['multiply', 'Oscurecer'], ['screen', 'Aclarar']], c.mezcla || '') + '</div>'; }
  else if (c.t === 'degradado'){ est = col('color', 'Color') + '<div class="dis-props">' + selc('desde', 'Más fuerte', [['abajo', 'Abajo'], ['arriba', 'Arriba'], ['izq', 'Izquierda'], ['der', 'Derecha']], c.desde || 'abajo') + num('op', 'Intensidad 0-1', 0.05) + '</div>'; }
  else if (c.t === 'logo'){ est = '<div class="dis-props">' + selc('color', 'Color del logo', DIS_LOGO_COL, _disLogoColor(c)) + num('op', 'Opacidad', 0.05, '1') + chk('caja', 'En recuadro') + '</div>'; }
  else if (c.t === 'lista'){ est = '<div class="dis-props">' + num('max', 'Cuántos') + num('tam', 'Tamaño') + '</div>' + col('color', 'Color') + '<div class="dis-props">' + chk('detalle', 'Con detalle debajo') + '</div>'; }
  else if (c.t === 'colores'){ est = '<div class="dis-props">' + selc('estilo', 'Muestras', [['cuadro', 'Fotos cuadradas'], ['punto', 'Fotos redondas'], ['mini', 'Puntos de color']], c.estilo || 'cuadro')
    + (c.estilo === 'mini' ? selc('al', 'Alinear', [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']], c.al || 'center') + num('tam', 'Tamaño del punto', 2, '46') : '') + '</div>'; }
  const posi = (DIS.ed.formato === '9x16' ? '<div class="ui-nota" style="margin-bottom:4px">' + (c.g916 ? 'Lugar propio en Historias' : 'Acomodada sola en Historias') + '</div>' : '')
    + '<div class="dis-props">' + numG('x', '← Desde la izquierda %') + numG('y', '↓ Desde arriba %') + numG('w', 'Ancho %') + (G.h != null || /^(foto|forma|degradado|colores)$/.test(c.t) ? numG('h', 'Alto %') : '') + '</div>'
    + '<div class="dis-props"><button type="button" class="btn" onclick="disCentrar(' + i + ',\'x\')">↔ Centrar</button><button type="button" class="btn" onclick="disCentrar(' + i + ',\'y\')">↕ Centrar</button><button type="button" class="btn" onclick="disDeshacer()" title="Ctrl+Z">↶ Deshacer</button></div>'
    + (c.t === 'degradado' ? '<div class="ui-nota" style="margin:6px 0 4px">Sombra rápida (oscurece un lado para que se lea el texto):</div><div class="dis-props">' + [['abajo', '⬇ Abajo'], ['arriba', '⬆ Arriba'], ['izq', '⬅ Izquierda'], ['der', '➡ Derecha'], ['toda', '▣ Toda la foto']].map(o => '<button type="button" class="btn" onclick="disSombraRapida(' + i + ',\'' + o[0] + '\')">' + o[1] + '</button>').join('') + '</div>' : '');
  const orden = '<div class="ui-nota" style="margin-bottom:4px">Qué tapa a qué: la capa de más arriba en la lista se ve encima.</div><div class="dis-props">'
    + '<button type="button" class="btn" onclick="disCapaExtremo(' + i + ',1)">⏫ Al frente</button><button type="button" class="btn" onclick="disCapaMover(' + i + ',1)">⬆ Un paso adelante</button>'
    + '<button type="button" class="btn" onclick="disCapaMover(' + i + ',-1)">⬇ Un paso atrás</button><button type="button" class="btn" onclick="disCapaExtremo(' + i + ',0)">⏬ Al fondo</button></div>'
    + (c.t === 'foto' ? '<div class="ui-nota" style="margin-top:6px">Para cambiar la foto de lugar, arrástrala en el lienzo. Para usar otra foto, cambia «Qué foto».</div>' : '');
  return (cont ? grupo('Contenido', cont) : '') + grupo('Posición y tamaño', posi) + grupo('Adelante o atrás', orden) + (est ? grupo('Estilo', est) : '') + grupo('Cuándo aparece', '<div class="dis-props">' + selc('vis', 'Se muestra', DIS_VIS, c.vis || 'siempre') + '</div>');
}
/* beneficios: los de Shopify, elegibles y editables POR PRODUCTO (se guardan en el diseño) */
function _disBenPanel(cx){
  const p = cx.p; if (!p || !p.handle) return '';
  const base = cx.benBase, aj = DIS.ed.ajustes.ben && DIS.ed.ajustes.ben[p.handle];
  const L = Array.isArray(aj) ? aj : base.map((b, k) => Object.assign({}, b, { on: k < 3 }));
  if (!L.length) return '<div class="ui-nota">' + esc(p.titulo) + ' no tiene beneficios en su ficha de Shopify.</div>';
  return '<div class="ui-nota" style="margin-bottom:6px">' + esc(p.titulo) + ' · ' + base.length + ' en Shopify. Marca los que van y corrige el texto si quieres.</div>'
    + L.map((b, k) => '<div class="dis-ben"><input type="checkbox"' + (b.on !== false ? ' checked' : '') + ' onchange="disBenSet(' + k + ',\'on\',this.checked)" title="Usar este beneficio">'
    + '<div style="flex:1;min-width:0"><input value="' + disA(b.titulo) + '" oninput="disBenSet(' + k + ',\'titulo\',this.value)" style="width:100%">'
    + '<input value="' + disA(b.texto) + '" oninput="disBenSet(' + k + ',\'texto\',this.value)" style="width:100%;margin-top:3px"></div></div>').join('')
    + (Array.isArray(aj) ? '<button class="btn" style="margin-top:8px" onclick="disBenReset()">↺ Volver a los de Shopify</button>' : '');
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
  if (!suave || !DIS._tx){ _disMemo(); if (suave) DIS._tx = 1; }
  if (k === 'sinfondo' && v){ c[k] = v; DIS.ed._sucio = true; const res = document.getElementById('disEdRes');
    _disSinFondoPrep(DIS.ed, DIS._cx, t => { if (res) res.innerHTML = t; }).then(() => { if (res) res.textContent = ''; disEdPintar(); }).catch(e => { if (res) res.innerHTML = '<span class="mal">' + esc(e.message) + '</span>'; }); return; }
  if (/^[xywh]$/.test(k) && DIS.ed.formato === '9x16'){ const g = _disGeo(c, '9x16'); g[k] = v == null ? g[k] : +v; _disGeoSet(c, '9x16', g); DIS.ed._sucio = true; disEdPintar(); return; }
  if (k === 'color' && c.t === 'logo') delete c.claro;
  if (v === '' && (k === 'fondo' || k === 'marcoColor')) delete c[k]; else c[k] = (k === 'peso' ? +v : v);
  DIS.ed._sucio = true;
  if (suave){ clearTimeout(DIS._ct); DIS._ct = setTimeout(() => { DIS._tx = 0; _disLienzoRepintar(); }, 250); return; }
  disEdPintar();
}
function disCapaPaso(i, k, d){ const c = DIS.ed.capas[i]; if (!c) return; disCapaSet(i, k, Math.max(10, Math.min(200, (c[k] != null ? +c[k] : 100) + d))); }
function disAuto916(){ _disMemo(); DIS.ed.capas.forEach(c => { delete c.g916; }); DIS.ed._sucio = true; disEdPintar(); }
function disTextoFijar(i){ const c = DIS.ed.capas[i]; if (!c) return; _disMemo(); c.txt = _disTxtSeg(DIS._cx, c.txt); DIS.ed._sucio = true; disEdPintar(); setTimeout(() => { const t = document.getElementById('disTxt' + i); if (t){ t.focus(); t.select(); } }, 60); }
/* 21-nov · doble clic sobre un texto del lienzo = escribir encima (Pablo: «los textos están rígidos»). Si tenía campos automáticos, queda fijo. */
function disTextoEnLinea(i, el){
  const c = DIS.ed.capas[i], sp = el && el.querySelector('span'); if (!c || !sp) return;
  const antes = _disTxtSeg(DIS._cx, c.txt);
  sp.innerText = antes; sp.contentEditable = 'true'; sp.style.outline = '2px dashed #C15B07'; sp.style.cursor = 'text'; el.style.cursor = 'text'; sp.focus();
  try { const r = document.createRange(); r.selectNodeContents(sp); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); } catch (_) {}
  const alSalir = () => { sp.removeEventListener('blur', alSalir); const nuevo = sp.innerText.replace(/\n+$/, ''); if (nuevo !== antes){ _disMemo(); c.txt = nuevo; DIS.ed._sucio = true; } disEdPintar(); };
  sp.addEventListener('blur', alSalir);
  sp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Escape'){ ev.preventDefault(); sp.removeEventListener('blur', alSalir); disEdPintar(); } else if (ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); sp.blur(); } });
}
function disCampoInsertar(i, campo){ const c = DIS.ed.capas[i]; if (!c) return; _disMemo(); c.txt = (c.txt ? c.txt + ' ' : '') + campo; DIS.ed._sucio = true; disEdPintar(); }
function disCapaMover(i, d){ const C = DIS.ed.capas, j = i + d; if (j < 0 || j >= C.length) return; _disMemo(); const t = C[i]; C[i] = C[j]; C[j] = t; DIS.sel = j; DIS.ed._sucio = true; disEdPintar(); }
async function disCapaQuitar(i){ if (!await _uiSeguro('¿Quitar esta capa del diseño? (Ctrl+Z la devuelve)', 'Quitar')) return; _disMemo(); DIS.ed.capas.splice(i, 1); DIS.sel = -1; DIS.ed._sucio = true; disEdPintar(); }
function disCapaExtremo(i, alFrente){ const C = DIS.ed.capas; if (!C[i]) return; _disMemo(); const c = C.splice(i, 1)[0]; if (alFrente) C.push(c); else C.unshift(c); DIS.sel = alFrente ? C.length - 1 : 0; DIS.ed._sucio = true; disEdPintar(); }
function disSombraRapida(i, lado){ const c = DIS.ed.capas[i]; if (!c) return; _disMemo(); const g = { abajo: [0, 55, 100, 45], arriba: [0, 0, 100, 45], izq: [0, 0, 55, 100], der: [45, 0, 55, 100], toda: [0, 0, 100, 100] }[lado];
  c.x = g[0]; c.y = g[1]; c.w = g[2]; c.h = g[3]; delete c.g916; c.desde = lado === 'toda' ? 'abajo' : lado; if (lado === 'toda') c.op = Math.min(+c.op || 0.5, 0.5); DIS.ed._sucio = true; disEdPintar(); }
function disCapaDuplicar(i){ const c = DIS.ed.capas[i]; if (!c) return; _disMemo(); const n = JSON.parse(JSON.stringify(c)); n.x = (+n.x || 0) + 2; n.y = (+n.y || 0) + 2; DIS.ed.capas.splice(i + 1, 0, n); DIS.sel = i + 1; DIS.ed._sucio = true; disEdPintar(); }
function disCapaAgregar(t){
  const n = { texto: { t, txt: '{{nombre}}', x: 8, y: 44, w: 84, tam: 56, fuente: 'titulo', color: 'blanco', al: 'center' }, foto: { t, src: 'color:1', x: 55, y: 55, w: 38, h: 38, r: 0 },
    forma: { t, x: 0, y: 80, w: 100, h: 20, color: 'principal', op: 0.9 }, degradado: { t, x: 0, y: 55, w: 100, h: 45, color: 'principal', desde: 'abajo', op: 0.85 },
    logo: { t, x: 38, y: 4, w: 24 }, lista: { t, x: 8, y: 30, w: 84, tam: 30, color: 'blanco', icono: '✓', max: 3 }, colores: { t, x: 10, y: 80, w: 80, h: 14, estilo: 'punto' } }[t];
  _disMemo(); DIS.ed.capas.push(n); DIS.sel = DIS.ed.capas.length - 1; DIS.ed._sucio = true; DIS._abiertos.capa = 1; disEdPintar();
}
/* mover (arrastrar), agrandar (esquina) y guías de centro */
function _disArrastreIni(){
  const lz = document.getElementById('disEdLienzo'); if (!lz) return;
  lz.addEventListener('mousedown', e => {
    const cont = lz.querySelector('.dis-lienzo'); if (!cont || !DIS.ed || e.target.isContentEditable) return;
    const tir = e.target.closest('[data-tirador]'), el = e.target.closest('[data-capa]');
    if (!el && !tir){ if (DIS.sel >= 0){ DIS.sel = -1; disEdPintar(); } return; }
    e.preventDefault(); const i = +(tir ? tir.dataset.tirador : el.dataset.capa), c = DIS.ed.capas[i]; if (!c) return;
    const caja = tir ? tir.parentElement : el;
    if (DIS.sel !== i){ DIS.sel = i; _disPanel(DIS._cx); lz.querySelectorAll('[data-capa]').forEach(x => { x.style.outline = ''; }); caja.style.outline = '2px solid #7c5cff'; }
    _disMemo();
    const g0 = _disGeo(c, DIS.ed.formato), W = cont.clientWidth, H = cont.clientHeight, x0 = e.clientX, y0 = e.clientY, o = { x: g0.x, y: g0.y, w: g0.w, h: g0.h, tam: +c.tam || 40 }; let movio = 0;
    const gv = cont.querySelector('.dis-guia-v'), gh = cont.querySelector('.dis-guia-h'), r2 = v => Math.round(v * 2) / 2;
    const mv = ev => {
      const dx = (ev.clientX - x0) / W * 100, dy = (ev.clientY - y0) / H * 100;
      if (tir){
        const nw = Math.max(2, r2(o.w + dx)), nh = o.h != null ? Math.max(1, r2(ev.shiftKey ? o.h * nw / o.w : o.h + dy)) : null;
        _disGeoSet(c, DIS.ed.formato, { x: o.x, y: o.y, w: nw, h: nh }); movio = 1;
        if (c.t === 'texto') c.tam = Math.max(8, Math.round(o.tam * nw / o.w));
        caja.style.width = nw + '%'; if (nh != null) caja.style.height = nh + '%';
        if (c.t === 'texto') { const sp = caja.querySelector('span'); if (sp) sp.style.fontSize = (c.tam * DIS._s) + 'px'; }
      } else {
        let nx = r2(o.x + dx), ny = r2(o.y + dy); const cxp = nx + o.w / 2, cyp = o.h != null ? ny + o.h / 2 : null;
        const pegaX = Math.abs(cxp - 50) < 1.2, pegaY = cyp != null && Math.abs(cyp - 50) < 1.2;
        if (pegaX) nx = r2(50 - o.w / 2); if (pegaY) ny = r2(50 - o.h / 2);
        if (gv) gv.style.display = pegaX ? 'block' : 'none'; if (gh) gh.style.display = pegaY ? 'block' : 'none';
        if (nx !== o.x || ny !== o.y){ _disGeoSet(c, DIS.ed.formato, { x: nx, y: ny, w: o.w, h: o.h }); movio = 1; } caja.style.left = nx + '%'; caja.style.top = ny + '%';
      }
      DIS.ed._sucio = true;
    };
    const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); if (gv) gv.style.display = 'none'; if (gh) gh.style.display = 'none';
      if (!movio && DIS.hist) DIS.hist.pila.pop(); _disLienzoRepintar(); _disPanel(DIS._cx); };
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
  });
  lz.addEventListener('dblclick', e => { const el = e.target.closest('[data-capa]'); if (!el || !DIS.ed) return; const i = +el.dataset.capa, c = DIS.ed.capas[i]; if (c && c.t === 'texto') disTextoEnLinea(i, el); });
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
    d.id = r.fila.id; d._sucio = false; DIS._orig = _disHuella(); if (res) res.textContent = '✓ Guardado';
    if (!callado) disPintar();
    return r.fila;
  } catch (e) { if (res) res.innerHTML = '<span class="mal">No se guardó (' + esc(e.message) + ').</span>'; return null; }
}
/* el mismo diseño con 6 productos distintos: así se ve si aguanta nombres largos, sin oferta, sin reseñas, etc. */
async function disVerMuchos(){
  const d = DIS.ed; if (!d) return;
  const L = (DIS.prods || []).filter(_disActivo).filter(p => _disFotos(p).length).slice(0, 40), pick = [];
  [p => p.cita, p => (p.beneficios || []).length >= 2, () => true].forEach(f => L.forEach(p => { if (pick.length < 6 && pick.indexOf(p) < 0 && f(p)) pick.push(p); }));
  const [W] = DIS_TAM[d.formato] || DIS_TAM['4x5'];
  document.body.insertAdjacentHTML('beforeend', '<div class="dis-modal" id="disMuchos" onclick="if(event.target===this)this.remove()"><div class="dis-caja" style="max-width:1280px"><div class="dis-cab"><div class="ui-pag">«' + esc(d.nombre) + '» en 6 productos</div><span style="flex:1"></span>'
    + '<button class="dis-ib" onclick="document.getElementById(\'disMuchos\').remove()" title="Cerrar">' + disIco('cerrar') + '</button></div><div class="dis-grilla dis-muchos">' + pick.map((p, k) => '<div class="dis-tarj"><div class="dis-mini" id="disM' + k + '"></div><div class="dis-tarj-pie"><div class="ui-nota dis-nom">' + esc(p.titulo) + '</div></div></div>').join('') + '</div></div></div>');
  const cxs = [];
  for (let k = 0; k < pick.length; k++){ const inf = await disInfo(pick[k].handle), el = document.getElementById('disM' + k); cxs[k] = disCtx(pick[k], inf, '', d.ajustes); if (el) el.innerHTML = disHtml(d, cxs[k], 290 / W, { ancho: 500 }); }
  /* 21-nov · Pablo: «a los demás no se les quitó el fondo». Cada producto recorta su foto (la 1ª vez 5-15 s; después queda guardada) */
  for (let k = 0; k < pick.length; k++){ const el = document.getElementById('disM' + k); if (!el) return;
    const falta = (d.capas || []).some(c => c.t === 'foto' && c.sinfondo && _disVis(c, cxs[k]) && !DIS.sinf[_disArch(_disFotoSrc(cxs[k], c.src))]);
    if (falta) el.insertAdjacentHTML('beforeend', '<div class="dis-mini-av">✂ Quitando el fondo…</div>');
    try { await _disSinFondoPrep(d, cxs[k]); await _disLuzPrep(d, cxs[k]); } catch (_) {}
    const e2 = document.getElementById('disM' + k); if (e2) e2.innerHTML = disHtml(d, cxs[k], 290 / W, { ancho: 500 }); }
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
  _disFuentes(); await _disLib(); await _disSinFondoPrep(d, cx); try { await _disLuzPrep(d, cx); } catch (_) {}
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
    const blob = await window.htmlToImage.toBlob(el, { width: W, height: H, pixelRatio: 1, backgroundColor: _disCol((d.ajustes && d.ajustes.fondo) || 'fondo') });   /* 21-nov · respeta el fondo del diseño (antes forzaba crema) */
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
  const h = '<div class="dis-modal" id="disMarca"><div class="dis-caja" style="max-width:560px"><div class="dis-cab"><span class="ui-pag">Marca de las plantillas</span><span style="flex:1"></span>' + _disIb('cerrar', 'Cerrar', 'document.getElementById(\'disMarca\').remove()') + '</div>'
    + '<div class="ui-nota" style="margin-bottom:10px">Sacada de tulula.com.pe. Se aplica a todos los diseños.</div><div class="dis-props">'
    + '<label class="dis-prop"><span class="ui-nota">Letra de títulos</span><input id="disM_f_titulo" value="' + disA(m.f_titulo) + '"></label>'
    + '<label class="dis-prop"><span class="ui-nota">Letra de textos</span><input id="disM_f_texto" value="' + disA(m.f_texto) + '"></label></div><div class="dis-props">'
    + col('c_principal', 'Azul') + col('c_acento', 'Naranja') + col('c_fondo', 'Crema') + col('c_suave', 'Gris azulado') + col('c_texto', 'Texto') + col('c_oferta', 'Oferta') + '</div>'
    + '<label class="dis-prop" style="width:100%"><span class="ui-nota">Ventajas de la tienda (una por línea · campos {{ventaja1}}…{{ventaja6}})</span><textarea id="disM_ventajas" rows="6" style="width:100%">' + esc(_disVentajas().join('\n')) + '</textarea></label>'
    + '<label class="dis-prop" style="width:100%"><span class="ui-nota">Precio en los anuncios</span><select id="disM_precio_publico"><option value="caliente"' + ((m.precio_publico || 'caliente') === 'caliente' ? ' selected' : '') + '>Solo en público 🔥 Caliente (Frío y Tibio sin precio)</option><option value="todos"' + (m.precio_publico === 'todos' ? ' selected' : '') + '>En todos los públicos</option></select></label>'
    + '<label class="dis-prop" style="width:100%"><span class="ui-nota">Logo (PNG)</span><input id="disM_logo_oscuro" value="' + disA(m.logo_oscuro) + '" style="width:100%"></label>'
    + '<div class="dis-acc" style="margin-top:12px"><span class="ui-nota" id="disMRes"></span><span style="flex:1"></span><button class="btn" onclick="disMarcaGuardar(false)">Guardar</button><button class="btn on" onclick="disMarcaGuardar(true)">✓ Aprobar marca</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
}
async function disMarcaGuardar(aprobar){
  const v = Object.assign({}, DIS.marca || DIS_MARCA_DEF);
  ['f_titulo', 'f_texto', 'c_principal', 'c_acento', 'c_texto', 'c_fondo', 'c_oferta', 'c_suave', 'logo_oscuro'].forEach(k => { const el = document.getElementById('disM_' + k); if (el && el.value.trim()) v[k] = el.value.trim(); });
  const vt = document.getElementById('disM_ventajas'); if (vt) v.ventajas = vt.value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 6);
  const pp = document.getElementById('disM_precio_publico'); if (pp) v.precio_publico = pp.value;
  if (aprobar) v.aprobada = true;
  const res = document.getElementById('disMRes'); if (res) res.textContent = 'Guardando…';
  try {
    const r = await _mklSb('/rest/v1/rpc/mk_dis_marca_guardar', { method: 'POST', body: JSON.stringify({ p_valor: v }) });
    if (!r || !r.ok) throw new Error((r && r.error) || 'no se guardó');
    DIS.marca = v; const x = document.getElementById('disMarca'); if (x) x.remove(); DIS.msg = aprobar ? 'Marca aprobada.' : 'Marca guardada.'; disPintar();
  } catch (e) { if (res) res.innerHTML = '<span class="mal">No se guardó (' + esc(e.message) + ').</span>'; }
}

/* ── estilos (solo la pantalla del ERP; las letras de los anuncios son las de la marca) · v2 21-nov: mismo lenguaje que el ERP ── */
(function(){
  if (typeof document === 'undefined' || document.getElementById('disCss')) return;
  const s = document.createElement('style'); s.id = 'disCss';
  s.textContent = '#mkDis{padding:4px 2px 16px;font-family:var(--ui-f)}'
    + '.dis-cabeza{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px}'
    + '.dis-barra{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px}.dis-barra-izq,.dis-barra-der{display:flex;gap:6px;align-items:center;flex-wrap:wrap}'
    + '.dis-cnt{display:inline-block;min-width:18px;padding:0 6px;margin-left:4px;border-radius:9px;background:rgba(255,255,255,.08);font:600 11px var(--ui-f);text-align:center}'
    + '.dis-cal{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 12px}.dis-cal-f{display:inline-flex;gap:6px;align-items:center;padding:6px 10px;border:1px solid var(--bd);border-radius:999px;background:var(--card);color:var(--txt);font:400 13px var(--ui-f);cursor:pointer}.dis-cal-f.on{border-color:#7c5cff;background:rgba(124,92,255,.14)}'
    + '.dis-aviso{display:flex;align-items:center;gap:8px;justify-content:space-between;margin:0 0 14px;padding:9px 12px;border:1px solid var(--bd);border-radius:10px;background:var(--card);font:400 13px var(--ui-f);color:var(--txt)}'
    + '.dis-grilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(264px,1fr));gap:14px}'
    + '.dis-tarj{background:var(--card);border:1px solid var(--bd);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .15s,transform .15s}'
    + '.dis-tarj:hover{border-color:#7c5cff}.dis-elegir{cursor:pointer}.dis-elegir:hover{transform:translateY(-2px)}'
    + '.dis-mini{display:flex;justify-content:center;align-items:center;background:#0d1017;padding:8px;min-height:140px;cursor:pointer}.dis-blanco{min-height:310px;color:var(--txt2);font:500 14px var(--ui-f)}'
    + '.dis-mini .dis-lienzo{box-shadow:0 6px 24px rgba(0,0,0,.45)}'
    + '.dis-tarj-pie{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px}.dis-fila{display:flex;align-items:center;gap:8px}.dis-nom{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.dis-acc{padding:0!important;margin:2px 0 0!important}.dis-est{font-size:11px;padding:3px 6px;border-radius:8px}'
    + '.dis-ib{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--txt2);cursor:pointer;padding:0;flex-shrink:0}'
    + '.dis-ib:hover{background:rgba(255,255,255,.06);border-color:var(--bd);color:var(--txt)}.dis-ib.rojo:hover{color:var(--bad,#ef4444);border-color:rgba(239,68,68,.5)}'
    + '.dis-modal{position:fixed;inset:0;background:rgba(5,7,12,.72);backdrop-filter:blur(3px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:18px}'
    + '.dis-caja{background:var(--panel);border:1px solid var(--bd);border-radius:14px;padding:16px 18px;width:100%;max-height:96vh;overflow:auto;font-family:var(--ui-f);color:var(--txt);box-shadow:0 20px 60px rgba(0,0,0,.5)}'
    + '.dis-cab{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px}'
    + '.dis-nombre{font:600 15px var(--ui-f)!important;width:240px;padding:6px 10px!important;border-radius:8px}'
    + '.dis-seg{display:inline-flex;border:1px solid var(--bd);border-radius:9px;overflow:hidden}.dis-seg button{background:transparent;border:0;color:var(--txt2);padding:6px 12px;font:500 12px var(--ui-f);cursor:pointer}.dis-seg button.on{background:#7c5cff;color:#fff}'
    + '.dis-ed{max-width:1500px;height:95vh;display:flex;flex-direction:column;padding:12px 14px}.dis-ed-cuerpo{flex:1;min-height:0;display:flex;gap:14px}'
    + '.dis-ed-izq{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}'
    + '.dis-ed-lienzo{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#0d1017 radial-gradient(circle at 1px 1px,rgba(255,255,255,.05) 1px,transparent 0) 0 0/18px 18px;border-radius:12px;user-select:none}'
    + '.dis-ed-lienzo .dis-lienzo{box-shadow:0 10px 40px rgba(0,0,0,.55)}'
    + '.dis-ed-prueba{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.dis-ed-prueba select{max-width:260px}'
    + '.dis-ed-panel{width:380px;flex-shrink:0;overflow:auto;padding-right:4px;display:flex;flex-direction:column;gap:10px}'
    + '.dis-sec{background:var(--card);border:1px solid var(--bd);border-radius:12px}.dis-sec>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;font:600 13px var(--ui-f);color:var(--txt)}'
    + '.dis-sec>summary::-webkit-details-marker{display:none}.dis-sec>summary::after{content:"›";color:var(--txt2);transform:rotate(90deg);transition:transform .15s}.dis-sec:not([open])>summary::after{transform:rotate(0)}'
    + '.dis-sec-c{padding:0 12px 12px}.dis-vacio{padding:14px;text-align:center}'
    + '.dis-grupo{border-top:1px solid var(--bd);padding-top:10px;margin-top:10px}.dis-grupo:first-child{border-top:0;margin-top:0;padding-top:0}'
    + '.dis-grupo-t{font:500 11px var(--ui-f);letter-spacing:.06em;text-transform:uppercase;color:var(--txt2);margin-bottom:6px}'
    + '.dis-add{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}'
    + '.dis-add-b{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:1px dashed var(--bd);border-radius:10px;background:transparent;color:var(--txt2);font:500 11px var(--ui-f);cursor:pointer}'
    + '.dis-add-b:hover{border-color:#7c5cff;color:var(--txt);background:rgba(124,92,255,.08)}'
    + '.dis-capas{display:flex;flex-direction:column;gap:2px}'
    + '.dis-capa{display:flex;align-items:center;gap:8px;padding:4px 6px 4px 8px;border-radius:8px;cursor:pointer;font:400 13px var(--ui-f);color:var(--txt);border:1px solid transparent}'
    + '.dis-capa:hover{background:rgba(255,255,255,.04)}.dis-capa.on{border-color:#7c5cff;background:rgba(124,92,255,.12)}.dis-capa.apagada .dis-capa-nom{opacity:.45;text-decoration:line-through}'
    + '.dis-capa-ico{color:var(--txt2);display:flex}.dis-capa-nom{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.dis-capa-cond{font:600 10px var(--ui-f);color:#f59e0b;border:1px solid rgba(245,158,11,.4);border-radius:6px;padding:0 5px}'
    + '.dis-capa-acc{display:flex;gap:0;opacity:0;transition:opacity .12s}.dis-capa:hover .dis-capa-acc,.dis-capa.on .dis-capa-acc{opacity:1}.dis-capa-acc .dis-ib{width:24px;height:24px}'
    + '.dis-props{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;align-items:flex-end}.dis-prop{display:flex;flex-direction:column;gap:3px;min-width:78px}.dis-prop input[type=number]{width:78px}.dis-ancho{width:100%}'
    + '.dis-chk{display:inline-flex;align-items:center;gap:6px;font:400 12px var(--ui-f);color:var(--txt);cursor:pointer;margin-right:6px}'
    + '.dis-temp{display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:999px;margin-left:4px;vertical-align:middle}.dis-temp-frio{background:#1e3a5f;color:#9cc3e6}.dis-temp-tibio{background:#4a3a14;color:#e9c53b}.dis-temp-caliente{background:#5a2412;color:#f3a27a}'
    + '.dis-res{display:flex;justify-content:space-between;gap:6px;align-items:center;font-size:12px;margin:2px 0}.dis-etapa{font-size:11px;font-weight:600;padding:1px 7px;border-radius:999px;background:var(--bg3,#2a3142);color:var(--txt2)}.dis-etapa.e1{background:#3b3a14;color:#e9c53b}.dis-etapa.e2{background:#173b2a;color:#7fd3a0}.dis-etapa.e3{background:#1d4d2e;color:#a6f0c0}'
    + '.dis-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;margin:6px 0}.dis-kpis b{display:block;font-size:22px;font-weight:600}'
    + '.dis-crit-total{text-align:center;margin:4px 0 12px}.dis-crit-total b{font-size:22px;font-weight:600}.dis-crit-total span{color:var(--txt2);font-size:13px}.dis-crit-total div{font-size:13px;margin-top:4px}'
    + '.dis-crit-eje{display:grid;grid-template-columns:150px 1fr 34px;gap:8px;align-items:center;font-size:13px;margin:6px 0}.dis-crit-eje b{text-align:right}.dis-barra-n{height:8px;border-radius:999px;background:var(--bg3,#2a3142);overflow:hidden}.dis-barra-n div{height:100%}'
    + '.dis-crit-mej{margin:0;padding-left:18px;font-size:13px;line-height:1.5}'
    + '#disEdRes{max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.dis-cod{font-size:11px;font-weight:600;color:var(--mu,#8a93a6);letter-spacing:.5px;margin-right:2px}.dis-tarj[draggable=true]{cursor:grab}.dis-mueve{opacity:.4}'
    + '.dis-ia{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:14px;font-size:28px}.dis-ia b{font-size:14px}'
    + '.dis-cap-zona{display:flex;flex-direction:column;align-items:center;gap:6px;padding:28px;border:2px dashed var(--bd);border-radius:10px;cursor:pointer;text-align:center;background-size:cover;background-position:center}.dis-ocupado{opacity:.6;pointer-events:none}'
    + '.dis-mini{position:relative}.dis-mini-av{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.65);color:#fff;font-size:12px;padding:4px 8px;border-radius:6px}'
    + '.dis-asi{font-size:13px;margin:0 0 6px;line-height:1.35}.dis-916{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px}'
    + '.dis-colores{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0}.dis-col{width:24px;height:24px;border-radius:50%;border:2px solid var(--bd);cursor:pointer;padding:0}'
    + '.dis-col.on{border-color:#7c5cff;box-shadow:0 0 0 2px rgba(124,92,255,.45)}.dis-col.nada{background:repeating-linear-gradient(45deg,transparent 0 4px,var(--bd) 4px 5px)}'
    + '.dis-campos{display:flex;flex-wrap:wrap;gap:4px}'
    + '.dis-campo{background:transparent;border:1px solid var(--bd);color:var(--txt2);border-radius:12px;padding:3px 9px;font:500 11px var(--ui-f);cursor:pointer}.dis-campo:hover{color:var(--txt);border-color:#7c5cff}'
    + '.dis-ben{display:flex;gap:8px;align-items:flex-start;margin-top:8px}.dis-ben input[type=checkbox]{margin-top:8px}'
    + '.dis-subir{display:inline-flex;align-items:center;gap:6px;margin:10px 0 4px;cursor:pointer}'
    + '.dis-tirador{position:absolute;right:-7px;bottom:-7px;width:14px;height:14px;background:#fff;border:2px solid #7c5cff;border-radius:3px;cursor:nwse-resize;z-index:5}'
    + '.dis-guia-v{position:absolute;left:50%;top:0;bottom:0;width:0;border-left:1px dashed #ff4fd8;pointer-events:none;z-index:6}'
    + '.dis-guia-h{position:absolute;top:50%;left:0;right:0;height:0;border-top:1px dashed #ff4fd8;pointer-events:none;z-index:6}'
    + '.dis-muchos{grid-template-columns:repeat(auto-fill,minmax(306px,1fr))}';
  document.head.appendChild(s);
})();

/* ══ FASE 2 (21-nov) · quitar fondo · replicar en lote · piezas · carrusel ══ */
function _disNPz(id){ return DIS.piezas.filter(x => x.diseno_id === id && x.estado !== 'archivada').length; }
async function _disSubir(blob, ruta){
  const tok = _mkSbTok(); if (!tok) throw new Error('tu sesión del ERP venció: recarga la página');
  const r = await fetch(MK_SB_URL + '/storage/v1/object/producto-media/' + ruta, { method: 'POST', headers: { apikey: MK_SB_ANON, Authorization: 'Bearer ' + tok, 'Content-Type': blob.type || 'image/png' }, body: blob });
  if (!r.ok) throw new Error(r.status === 403 || r.status === 400 ? 'el almacén no te dejó subir (' + r.status + ')' : 'el almacén respondió ' + r.status);
  return MK_SB_URL + '/storage/v1/object/public/producto-media/' + ruta;
}
/* Quitar fondo: usa el MISMO recortador del ERP (index.html · _bgQuitar: gratis, en el navegador, cuida prendas blancas y
   el hueco entre las piernas). Cada foto se recorta UNA vez: el resultado queda en public.mk_dis_sinfondo para todos. */
async function _disQuitarFondo(blob){
  try { if (window.parent && window.parent !== window && typeof window.parent._bgQuitar === 'function') return await window.parent._bgQuitar(blob); } catch (_) {}
  const m = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm');
  return await m.removeBackground(blob, { model: 'isnet_fp16', output: { format: 'image/png', quality: 0.9 } });
}
async function _disSinFondoPrep(d, cx, avisar){
  if (!d || !cx) return;
  const pend = [];
  (d.capas || []).forEach(c => { if (c.t === 'foto' && c.sinfondo && _disVis(c, cx)){ const u = _disFotoSrc(cx, c.src), k = _disArch(u); if (u && !DIS.sinf[k] && pend.indexOf(u) < 0) pend.push(u); } });
  for (let i = 0; i < pend.length; i++){
    const u = pend[i], k = _disArch(u);
    if (avisar) avisar('✂ Quitando fondo ' + (i + 1) + ' de ' + pend.length + '… (la 1ª vez baja el programa, ~40 MB)');
    const blob = await (await fetch(_disTam(u, 1200))).blob();
    const out = await _disQuitarFondo(blob);
    const url = await _disSubir(out, 'creativos/dis/sinfondo/' + k.replace(/\.[a-z0-9]+$/i, '') + '-' + Date.now() + '.png');
    try { await _mklSb('/rest/v1/rpc/mk_dis_sinfondo_guardar', { method: 'POST', body: JSON.stringify({ p_foto: k, p_url: url }) }); } catch (_) {}
    DIS.sinf[k] = url;
  }
}
/* ══ 21-nov (3ª tanda, Pablo) ══ códigos y orden · IA (crear desde captura, pedir un cambio) · Fondos · recortes en «Ver en 6» ══ */
function _disCod(n){ return String(n).padStart(3, '0'); }
/* orden: 🏆 ganadoras primero (automático) → el orden que tú arrastras → lo más nuevo */
function _disOrdenar(L){
  return L.slice().sort((a, b) => (a.estado === 'ganadora' ? 0 : 1) - (b.estado === 'ganadora' ? 0 : 1)
    || ((a.ajustes && a.ajustes.orden) || 1e9) - ((b.ajustes && b.ajustes.orden) || 1e9) || String(b.creado || '').localeCompare(String(a.creado || '')));
}
function _disOrdenPlantillas(){
  const n = DIS_BASE.length, o = (Array.isArray(DIS.ordenP) ? DIS.ordenP : []).filter(i => i >= 0 && i < n);
  for (let i = 0; i < n; i++) if (o.indexOf(i) < 0) o.push(i);
  return o;
}
/* arrastrar y soltar para reordenar tarjetas (data-k = clave) */
function _disArrastrable(cont, alSoltar){
  if (!cont || cont._dnd) return; cont._dnd = 1; let src = null;
  cont.addEventListener('dragstart', e => { src = e.target.closest('[data-k]'); if (src){ src.classList.add('dis-mueve'); e.dataTransfer.effectAllowed = 'move'; } });
  cont.addEventListener('dragend', () => { if (src) src.classList.remove('dis-mueve'); src = null; });
  cont.addEventListener('dragover', e => { const t = e.target.closest('[data-k]'); if (!src || !t || t === src || t.parentNode !== src.parentNode) return; e.preventDefault();
    const r = t.getBoundingClientRect(), antes = (e.clientX - r.left) < r.width / 2; t.parentNode.insertBefore(src, antes ? t : t.nextSibling); });
  cont.addEventListener('drop', e => { if (!src) return; e.preventDefault(); alSoltar([...src.parentNode.querySelectorAll(':scope > [data-k]')].map(x => x.dataset.k)); });
}
async function _disGuardarOrdenDis(ids){
  ids = ids.map(Number); ids.forEach((id, k) => { const f = (DIS.filas || []).find(x => x.id === id); if (f){ f.ajustes = f.ajustes || {}; f.ajustes.orden = k + 1; } });
  try { await _mklSb('/rest/v1/rpc/mk_diseno_orden', { method: 'POST', body: JSON.stringify({ p_ids: ids }) }); } catch (e) { DIS.msg = '⚠ No se guardó el orden (' + esc(e.message) + ').'; disPintar(); }
}
async function _disGuardarOrdenPlant(ks){
  DIS.ordenP = ks.map(Number).filter(k => k >= 0);
  try { await _mklSb('/rest/v1/rpc/mk_dis_config_guardar', { method: 'POST', body: JSON.stringify({ p_clave: 'orden_plantillas', p_valor: DIS.ordenP }) }); } catch (_) {}
}
/* ── IA: una sola puerta (Edge Function disenos-ia). Gasto aprobado por Pablo ~US$3-5/mes ── */
async function _disIA(cuerpo){
  const tok = _mkSbTok(); if (!tok) throw new Error('tu sesión del ERP venció: recarga la página');
  const r = await fetch(MK_SB_URL + '/functions/v1/disenos-ia', { method: 'POST', headers: { apikey: MK_SB_ANON, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => ({})); if (!r.ok || !j.ok) throw new Error(j.error || ('la IA respondió ' + r.status)); return j;
}
function _disImgB64(file, max){
  return new Promise((ok, mal) => { const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const k = Math.min(1, (max || 1100) / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.86)); };
    im.onerror = () => mal(new Error('no pude leer la imagen')); im.src = u; });
}
const _DIS_T = ['foto', 'texto', 'forma', 'degradado', 'logo', 'lista', 'colores'];
function _disLimpiarCapas(C){
  const n = v => (v == null || v === '' || isNaN(+v)) ? undefined : +v;
  const L = (Array.isArray(C) ? C : []).filter(c => c && _DIS_T.indexOf(c.t) >= 0).map(c => {
    const o = Object.assign({}, c); ['x', 'y', 'w', 'h', 'tam', 'ls', 'lh', 'op', 'pad', 'r', 'zoom', 'fx', 'fy', 'bri', 'marco'].forEach(k => { if (o[k] != null){ const v = n(o[k]); if (v == null) delete o[k]; else o[k] = v; } });
    if (o.x == null) o.x = 0; if (o.y == null) o.y = 0; if (o.w == null) o.w = 100;
    if (o.t === 'foto' && !/^(color|ben|n|url|fondo):/.test(o.src || '')) o.src = 'color:0';
    if (o.t === 'texto' && !o.txt) o.txt = '{{nombre}}'; if (o.tam != null) o.tam = Math.max(12, Math.min(220, o.tam));
    return o; });
  if (!L.some(c => c.t === 'logo')) L.push({ t: 'logo', x: 39, y: 3, w: 22 });
  return L;
}
function disCapturaAbrir(){
  const v = document.getElementById('disCap'); if (v) v.remove();
  document.body.insertAdjacentHTML('beforeend', '<div class="dis-modal" id="disCap" style="z-index:10050"><div class="dis-caja" style="max-width:560px"><div class="dis-cab"><div><div class="ui-pag">📷 Crear desde captura</div><div class="ui-nota">La IA copia la idea del anuncio y la arma con tu marca, fotos y precios · ~US$0,04 por captura</div></div><span style="flex:1"></span>' + _disIb('cerrar', 'Cerrar', 'disCapturaCerrar()') + '</div>'
    + '<label class="dis-cap-zona" id="disCapZona">' + disIco('subir', 28) + '<b>Pega la captura (Ctrl+V) o haz clic para elegirla</b><span class="ui-nota">JPG o PNG · una captura = una plantilla</span><input type="file" accept="image/*" style="display:none" onchange="disCapturaCrear(this.files[0])"></label>'
    + '<textarea id="disCapNota" rows="2" style="width:100%;margin-top:10px" placeholder="Opcional: qué quieres (ej. «solo la idea del panel de la derecha», «con el precio más grande»)"></textarea>'
    + '<div class="ui-nota" id="disCapRes" style="margin-top:8px"></div></div></div>');
  DIS._pega = e => { const it = [...((e.clipboardData && e.clipboardData.items) || [])].find(x => /^image\//.test(x.type)); if (it){ e.preventDefault(); disCapturaCrear(it.getAsFile()); } };
  document.addEventListener('paste', DIS._pega);
}
function disCapturaCerrar(){ const v = document.getElementById('disCap'); if (v) v.remove(); if (DIS._pega){ document.removeEventListener('paste', DIS._pega); DIS._pega = null; } }
async function disCapturaCrear(file){
  const res = document.getElementById('disCapRes'), z = document.getElementById('disCapZona'); if (!file || DIS._capCorre) return;
  DIS._capCorre = 1; if (z) z.classList.add('dis-ocupado');
  try {
    if (res) res.innerHTML = '✨ La IA está armando la plantilla… (15-30 s)';
    const img = await _disImgB64(file, 1100), nota = ((document.getElementById('disCapNota') || {}).value || '').trim();
    if (z) z.style.backgroundImage = 'url(' + img + ')';
    const r = await _disIA({ modo: 'captura', imagen: img, tipo: 'image/jpeg', nota }), d = r.diseno || {};
    disCapturaCerrar(); const nv = document.getElementById('disNuevo'); if (nv) nv.remove();
    const p = _disProdLindo() || (DIS.prods || [])[0] || {};
    DIS.ed = { id: null, nombre: String(d.nombre || 'Desde captura').slice(0, 60), formato: '4x5', tipo: 'estatico', mensaje: DIS_MSJ.some(x => x[0] === d.mensaje) ? d.mensaje : 'producto',
      capas: _disLimpiarCapas(d.capas), ajustes: { fondo: DIS_COLS.some(x => x[0] === d.fondo) ? d.fondo : 'fondo', prev_handle: p.handle || '', origen: 'captura' }, padre_id: null };
    DIS.sel = -1; DIS.prod = DIS.ed.ajustes.prev_handle; DIS.color = ''; _disEdAbrir();
    const e2 = document.getElementById('disEdRes'); if (e2) e2.innerHTML = '✨ ' + esc(d.nota || 'Plantilla creada') + ' · US$' + String(r.usd).replace('.', ',');
  } catch (e) { if (res) res.innerHTML = '<span class="mal">No se pudo (' + esc(e.message) + ').</span>'; }
  finally { DIS._capCorre = 0; if (z) z.classList.remove('dis-ocupado'); }
}
const DIS_IA_EJ = ['Pon el precio más grande y en naranja', 'Baja el logo y hazlo más chico', 'Oscurece la foto de la izquierda', 'Agrega «Envío gratis» abajo', 'Más aire: separa los textos', 'Fondo azul y letras crema'];
function disIAMensajeAbrir(){
  const v = document.getElementById('disIAm'); if (v) v.remove();
  document.body.insertAdjacentHTML('beforeend', '<div class="dis-modal" id="disIAm" style="z-index:10050"><div class="dis-caja" style="max-width:540px"><div class="dis-cab"><div><div class="ui-pag">✨ Pedir un cambio</div><div class="ui-nota">Escribe lo que quieres y la IA edita el diseño · ~US$0,01 · Ctrl+Z lo deshace</div></div><span style="flex:1"></span>' + _disIb('cerrar', 'Cerrar', 'document.getElementById(\'disIAm\').remove()') + '</div>'
    + '<textarea id="disIAtxt" rows="3" style="width:100%" placeholder="Ej.: baja el descuento, sube el precio y pon el logo en azul" onkeydown="event.stopPropagation();if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();disIAMensaje()}"></textarea>'
    + '<div class="dis-campos" style="margin:8px 0">' + DIS_IA_EJ.map(t => '<button type="button" class="dis-campo" onclick="document.getElementById(\'disIAtxt\').value=this.textContent">' + esc(t) + '</button>').join('') + '</div>'
    + '<div style="display:flex;gap:8px;align-items:center"><span class="ui-nota" id="disIAres" style="flex:1"></span><button class="btn on" id="disIAbtn" onclick="disIAMensaje()">✨ Aplicar</button></div></div></div>');
  setTimeout(() => { const t = document.getElementById('disIAtxt'); if (t) t.focus(); }, 50);
}
async function disIAMensaje(){
  const t = document.getElementById('disIAtxt'), res = document.getElementById('disIAres'), b = document.getElementById('disIAbtn'), msg = ((t || {}).value || '').trim();
  if (!msg || !DIS.ed || DIS._iaCorre) return; DIS._iaCorre = 1; if (b) b.disabled = true; if (res) res.textContent = '✨ Editando… (5-15 s)';
  try {
    const cx = DIS._cx || {}, muestra = { nombre: cx.nombre, precio: cx.precio, precio_antes: cx.antes, descuento: cx.descuento, color: cx.color, colores: (cx.colores || []).length, oferta: !!cx.oferta, beneficios: (cx.ben || []).map(x => x.titulo) };
    const r = await _disIA({ modo: 'mensaje', mensaje: msg, diseno: { formato: DIS.ed.formato, capas: DIS.ed.capas, ajustes: { fondo: (DIS.ed.ajustes || {}).fondo } }, muestra }), d = r.diseno || {};
    _disMemo(); DIS.ed.capas = _disLimpiarCapas(d.capas); if (DIS_COLS.some(x => x[0] === d.fondo)) DIS.ed.ajustes.fondo = d.fondo;
    DIS.ed._sucio = true; DIS.sel = -1; await disEdPintar();
    const v = document.getElementById('disIAm'); if (v) v.remove();
    const e2 = document.getElementById('disEdRes'); if (e2) e2.innerHTML = '✨ ' + esc(d.nota || 'Listo') + ' · Ctrl+Z deshace';
  } catch (e) { if (res) res.innerHTML = '<span class="mal">No se pudo (' + esc(e.message) + ').</span>'; }
  finally { DIS._iaCorre = 0; if (b) b.disabled = false; }
}
/* ── 🏞️ Fondos: biblioteca de fotos de ambiente (Lima, oficinas, texturas) para poner detrás de la prenda recortada ── */
const DIS_ORIGEN = [['propia', 'Foto propia'], ['unsplash', 'Unsplash (libre)'], ['pexels', 'Pexels (libre)'], ['permiso', 'Con permiso del dueño']];
async function _disFondosCargar(){ try { const L = await _mklSb('/rest/v1/mk_dis_fondos?select=*&estado=eq.activo&order=creado.desc'); DIS.fondos = Array.isArray(L) ? L : []; } catch (_) { DIS.fondos = DIS.fondos || []; } }
function disFondosAbrir(){
  const v = document.getElementById('disFon'); if (v) v.remove();
  document.body.insertAdjacentHTML('beforeend', '<div class="dis-modal" id="disFon" style="z-index:10050"><div class="dis-caja" style="max-width:1000px"><div class="dis-cab"><div><div class="ui-pag">🏞️ Fondos</div><div class="ui-nota">Lugares para poner detrás de la prenda recortada: calles de Lima, oficinas, texturas.</div></div><span style="flex:1"></span>' + _disIb('cerrar', 'Cerrar', 'document.getElementById(\'disFon\').remove()') + '</div>'
    + (DIS.puede ? '<div class="dis-barra"><div class="dis-barra-izq"><input id="disFonNom" placeholder="Nombre (ej. Óvalo Gutiérrez de noche)" style="width:260px"><select id="disFonOri">' + DIS_ORIGEN.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('') + '</select>'
      + '<label class="btn on">' + disIco('subir', 14) + ' Subir fondo (se guarda solo)<input type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="disFondoNuevo(this.files[0])"></label></div><span class="ui-nota" id="disFonRes"></span></div>' : '')
    + '<div class="ui-nota" style="margin:4px 0 10px">Solo fotos propias o libres de uso (unsplash.com, pexels.com: busca «Lima», «Miraflores», «office»). Las de Google casi siempre tienen dueño y Meta puede bajar el anuncio.</div>'
    + '<div class="dis-pz-grilla" id="disFonGrilla"><div class="ui-nota">Cargando…</div></div></div></div>');
  _disFondosCargar().then(disFondosPintar);
}
function disFondosPintar(){
  const g = document.getElementById('disFonGrilla'); if (!g) return; const L = DIS.fondos || [];
  g.innerHTML = L.length ? L.map(f => '<div class="dis-pz" style="cursor:default"><img src="' + disA(f.url) + '" style="width:100%;aspect-ratio:4/5;object-fit:cover;display:block;border-radius:6px">'
    + '<div class="ui-nota dis-nom">' + esc(f.nombre || 'Fondo') + ' · ' + esc(((DIS_ORIGEN.find(o => o[0] === f.origen) || ['', f.origen])[1])) + '</div>'
    + (DIS.puede ? '<div class="dis-acc">' + (DIS.ed ? '<button class="btn on" onclick="disFondoPoner(' + f.id + ')">Poner en el diseño</button>' : '') + _disIb('basura', 'Archivar fondo', 'disFondoArchivar(' + f.id + ')', 'rojo') + '</div>' : '') + '</div>').join('')
    : '<div class="mkl-vacio">Todavía no hay fondos. Sube el primero arriba.</div>';
}
async function disFondoNuevo(file){
  const res = document.getElementById('disFonRes'); if (!file) return;
  const nom = ((document.getElementById('disFonNom') || {}).value || '').trim() || file.name.replace(/\.[a-z0-9]+$/i, ''), ori = (document.getElementById('disFonOri') || {}).value || 'propia';
  try { if (res) res.textContent = 'Subiendo…';
    const b64 = await _disImgB64(file, 1600), blob = await (await fetch(b64)).blob();
    const url = await _disSubir(blob, 'creativos/dis/fondos/' + Date.now() + '.jpg');
    const r = await _mklSb('/rest/v1/rpc/mk_dis_fondo_guardar', { method: 'POST', body: JSON.stringify({ p_url: url, p_nombre: nom, p_origen: ori }) });
    if (!r || !r.ok) throw new Error((r && r.error) || 'no se guardó');
    DIS.fondos = [r.fila].concat(DIS.fondos || []); if (res) res.textContent = '✓ Fondo guardado'; disFondosPintar();
  } catch (e) { if (res) res.innerHTML = '<span class="mal">' + esc(e.message) + '</span>'; }
}
async function disFondoArchivar(id){
  if (!await _uiSeguro('¿Archivar este fondo? Los diseños que ya lo usan no cambian.', 'Archivar')) return;
  try { await _mklSb('/rest/v1/rpc/mk_dis_fondo_estado', { method: 'POST', body: JSON.stringify({ p_id: id, p_estado: 'archivado' }) }); DIS.fondos = (DIS.fondos || []).filter(f => f.id !== id); disFondosPintar(); } catch (_) {}
}
/* el fondo va atrás (algo desenfocado y oscuro, con un velo azul) y la prenda recortada encima, con sombra a sus pies:
   «collage editorial» (lo honesto: no fingimos que la foto se tomó ahí) */
function disFondoPoner(id){
  const f = (DIS.fondos || []).find(x => x.id === id); if (!f || !DIS.ed) return; _disMemo();
  const C = DIS.ed.capas, i0 = C.findIndex(c => c.esFondo);
  const capa = { t: 'foto', src: 'url:' + f.url, x: 0, y: 0, w: 100, h: 100, blur: 3, bri: 85, esFondo: true, pos: 'center center' };
  if (i0 >= 0) C[i0] = capa; else {
    C.unshift(capa, { t: 'degradado', x: 0, y: 0, w: 100, h: 100, color: 'principal', desde: 'abajo', op: 0.35, esVelo: true });
    const k = C.findIndex(c => c.t === 'foto' && !c.esFondo);
    if (k >= 0){ const p = C[k]; p.sinfondo = true; p.sombra = true; p.fit = 'contain'; p.pos = 'center bottom';
      C.splice(k, 0, { t: 'forma', x: p.x + p.w * 0.25, y: Math.min(97, p.y + (p.h || 100) - 2.5), w: p.w * 0.5, h: 3, color: 'negro', op: 0.35, elipse: true, blur: 10 }); }
  }
  DIS.ed._sucio = true; const v = document.getElementById('disFon'); if (v) v.remove(); disEdPintar(); setTimeout(disIgualarLuz, 300);
}
/* ══ 21-nov · FASE 3 (Pablo): público Frío / Tibio / Caliente + regla de ganadora en 3 etapas con datos del ERP ══ */
const DIS_TEMP = [['frio', '❄️ Frío'], ['tibio', '🌤️ Tibio'], ['caliente', '🔥 Caliente']];
const DIS_TEMP_NOTA = { frio: 'No te conoce: gancho, prenda o reseña; precio chico', tibio: 'Ya te vio: nombre, colores y precio visibles', caliente: 'Casi compra: precio grande, descuento, urgencia' };
/* criterio propio de Claude con los datos de Confect/Madgicx (ver turno 21-nov): qué público ataca mejor cada plantilla */
const DIS_TEMP_BASE = { 'Editorial dividido': 'caliente', 'Díptico': 'tibio', 'Detalle de la prenda': 'frio', 'Recorte sobre azul': 'frio', 'Marco de galería': 'frio', 'Reseña de clienta': 'frio',
  'Arco editorial': 'caliente', 'Colores': 'tibio', 'Pantalla completa': 'frio', 'Preventa': 'tibio', 'Ficha con detalle': 'tibio', 'Logo gigante detrás': 'frio', 'Estilo de vida + prenda': 'tibio',
  'Ficha con dos detalles': 'tibio', 'Tríptico': 'caliente', 'Llegada nueva': 'tibio', 'Oferta en curva': 'caliente', 'Cinta de colección': 'frio', 'Prenda en panel': 'tibio', 'Franja oscura con precio': 'caliente', 'Reseña con foto': 'frio', 'Se compran juntas': 'tibio', 'Fecha · Regalo': 'tibio', 'Fecha · Último día': 'caliente' };
function _disTemp(f){ const a = (f && f.ajustes) || {}; const nb = String((f && f.nombre) || ''); return a.temp || DIS_TEMP_BASE[nb] || DIS_TEMP_BASE[Object.keys(DIS_TEMP_BASE).find(k => nb.indexOf(k) === 0) || ''] || ({ oferta: 'caliente', preventa: 'tibio', colores: 'tibio' }[f && f.mensaje]) || 'frio'; }
function _disTempChip(t){ const o = DIS_TEMP.find(x => x[0] === t) || DIS_TEMP[0]; return '<span class="dis-temp dis-temp-' + o[0] + '" title="' + disA(DIS_TEMP_NOTA[o[0]]) + '">' + o[1] + '</span>'; }
/* regla de ganadora: gasto mínimo en «veces el CPA objetivo», compras mínimas y ROAS en «veces el ROAS de equilibrio».
   Base (Motion/Foreplay/práctica de cuentas grandes): no juzgar antes de gastar 1-3 CPA; ganadora = volumen + retorno sostenido. */
/* 21-nov noche (Pablo) · UNA sola fuente: un diseño es 🏆 Ganadora cuando 🎬 Anuncios (el motor del ERP) propuso «Escalar»
   alguno de sus anuncios (tabla mk_propuestas). Diseños ya no tiene regla propia. */
/* pareja del producto: misma prenda+diseño del ERP («BLAZER MIRELLA») ↔ producto de Shopify por su título */
function _disNorm(t){ return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }
function _disLado(p, k){ const w = _disNorm(p && p.titulo).split(/\s+/), q = String(k || '').split(' '); return w[0] === q[0] && w.indexOf(q[1]) > 0; }
/* 21-nov noche (Pablo) · solo CONJUNTOS: misma prenda-diseño con el mismo nombre (Blazer Mirella + Pantalón Mirella).
   Una blusa con un pantalón de otro nombre NO cuenta. La pareja sale en el MISMO color (si lo tiene). */
function _disJunto(p, color){
  if (!p || !Array.isArray(DIS.juntas) || !DIS.juntas.length) return null;
  for (const j of DIS.juntas){
    const qa = String(j.a || '').split(' '), qb = String(j.b || '').split(' '); if (!qa[1] || qa[1] !== qb[1]) continue;
    const otro = _disLado(p, j.a) ? j.b : _disLado(p, j.b) ? j.a : ''; if (!otro) continue;
    const q = (DIS.prods || []).filter(x => x.handle !== p.handle && _disLado(x, otro) && _disFotos(x).length).sort((a, b) => (_disActivo(a) ? 0 : 1) - (_disActivo(b) ? 0 : 1))[0];
    if (!q) continue;
    let fotos = _disFotos(q); const inf = DIS.info && DIS.info[q.handle];
    if (color && inf && !(inf instanceof Promise) && Array.isArray(inf.variants)){
      const ops = inf.options || [], ci = ops.findIndex(o => /color/i.test(o.name || o)), cn = _disNorm(color);
      const v = ci >= 0 && inf.variants.find(x => _disNorm((x.options || [x.option1, x.option2, x.option3])[ci]) === cn && x.featured_image);
      if (v){ const k = fotos.findIndex(u => _disArch(u) === _disArch(v.featured_image.src)); if (k > 0) fotos = [fotos[k]].concat(fotos.filter((_, i) => i !== k)); }
    }
    return { p: q, nombre: String(q.titulo || ''), fotos, n: +j.n || 0 };
  }
  return null;
}
/* reseña larga: se corta en la última palabra antes del tope, con «…» (que no tape la firma) */
function _disCorta(t, n){ t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; const c = t.slice(0, n), i = c.lastIndexOf(' '); return (i > n * 0.6 ? c.slice(0, i) : c).replace(/[\s,;.:]+$/, '') + '…'; }
function _disGana(x){ return !!(x && +x.esc_dias > 0); }
function _disRes(id){ return ((DIS.res && DIS.res.disenos) || []).find(x => +x.diseno === +id) || null; }
function _disResLinea(f){
  const x = _disRes(f.id), b = DIS.res && DIS.res.base; if (!x || !(+x.gasto > 0)) return '<div class="ui-nota">' + (x && x.creativos ? 'En la Biblioteca, sin anuncio con gasto todavía' : 'Sin anuncios todavía') + '</div>';
  const g = _disGana(x), n = v => String(v).replace('.', ','), fe = x.esc_ult ? String(x.esc_ult).split('-').reverse().slice(0, 2).join('/') : '';
  return '<div class="dis-res"><span>S/ ' + Math.round(x.gasto) + ' · ' + x.pedidos + ' compra' + (x.pedidos === 1 ? '' : 's') + ' · ROAS ' + n(x.roas || 0) + '</span>'
    + '<span class="dis-etapa ' + (g ? 'e3' : 'e0') + '" title="Lo decide 🎬 Anuncios: Ganadora = el ERP propuso Escalar alguno de sus anuncios">' + (g ? '🏆 Anuncios: Escalar' + (fe ? ' · ' + fe : '') : 'En prueba') + '</span></div>';
}
/* sube sola: con gasto → «En prueba»; Anuncios propone Escalar → 🏆 Ganadora (nunca baja sola) */
async function _disAutoEstado(){
  if (!DIS.puede || !DIS.res) return; const b = DIS.res.base, sub = [];
  for (const f of (DIS.filas || [])){ if (f.estado === 'archivada' || f.estado === 'ganadora') continue;
    const x = _disRes(f.id), est = _disGana(x) ? 'ganadora' : (x && +x.gasto > 0 && f.estado === 'borrador') ? 'prueba' : '';
    if (!est) continue;
    try { const r = await _mklSb('/rest/v1/rpc/mk_diseno_estado', { method: 'POST', body: JSON.stringify({ p_id: f.id, p_estado: est }) }); if (r && r.ok){ Object.assign(f, r.fila); if (est === 'ganadora') sub.push(f.nombre); } } catch (_) {}
  }
  if (sub.length){ DIS.msg = '🏆 Pasó a Ganadoras porque Anuncios propuso Escalar: ' + sub.map(esc).join(', ') + '.'; disPintar(); }
}
async function disTempCambiar(id, t){
  const f = (DIS.filas || []).find(x => x.id === id); if (!f) return; f.ajustes = Object.assign({}, f.ajustes || {}, { temp: t });
  try { const r = await _mklSb('/rest/v1/rpc/mk_diseno_guardar', { method: 'POST', body: JSON.stringify({ p_id: f.id, p_datos: { nombre: f.nombre, formato: f.formato, tipo: f.tipo || 'estatico', mensaje: f.mensaje, capas: f.capas, ajustes: f.ajustes, padre_id: f.padre_id || null } }) });
    if (!r || !r.ok) throw new Error((r && r.error) || 'no se guardó'); } catch (e) { DIS.msg = '<span class="mal">No se guardó el público (' + esc(e.message) + ').</span>'; }
  disPintar();
}
/* ══ 21-nov · CRÍTICO CON IA (Pablo aprobó ~US$0,01 por revisión): nota 1-10 en legibilidad, jerarquía, marca y público + 3 mejoras.
   «Aprende»: le mandamos las 🏆 ganadoras reales (con su nota y ROAS) como referencia de lo que le funciona a Tulula. ══ */
const DIS_CRIT_EJES = [['legibilidad', 'Se lee'], ['jerarquia', 'Jerarquía'], ['marca', 'Marca de lujo'], ['publico', 'Encaja con el público']];
function _disCritDe(id){ return (DIS.crit || {})[id] || null; }
function _disAprendido(){
  return (DIS.filas || []).filter(f => f.estado === 'ganadora').map(f => { const c = _disCritDe(f.id), r = _disRes(f.id); return { nombre: f.nombre, temp: _disTemp(f), nota: c ? +c.total : null, roas: r ? r.roas : null }; });
}
async function disCriticar(d, cx){
  if (!d || !cx || DIS._critCorre) return; DIS._critCorre = 1;
  const v = document.getElementById('disCrit'); if (v) v.remove();
  document.body.insertAdjacentHTML('beforeend', '<div class="dis-modal" id="disCrit" style="z-index:10050"><div class="dis-caja" style="max-width:560px"><div class="dis-cab"><div><div class="ui-pag">🧐 Revisión con IA · «' + esc(d.nombre || '') + '»</div><div class="ui-nota">' + _disTempChip(_disTemp(d)) + ' · ~US$0,01</div></div><span style="flex:1"></span>' + _disIb('cerrar', 'Cerrar', 'document.getElementById(\'disCrit\').remove()') + '</div><div id="disCritCuerpo" class="ui-nota">Mirando el diseño… (5-10 s)</div></div></div>');
  const cu = () => document.getElementById('disCritCuerpo');
  try {
    const blob = await disPng(Object.assign({}, d), cx), img = await _disImgB64(blob, 900);
    const r = await _disIA({ modo: 'critica', imagen: img, temp: _disTemp(d), nombre: d.nombre, formato: d.formato, diseno_id: d.id || null, aprendido: _disAprendido() }), k = r.critica || {};
    if (d.id){ DIS.crit = DIS.crit || {}; DIS.crit[d.id] = { diseno_id: d.id, total: k.total, detalle: k }; }
    const n = v => String(v == null ? '—' : v).replace('.', ','), barra = x => { const p = Math.max(0, Math.min(10, +x || 0)) * 10; return '<div class="dis-barra-n"><div style="width:' + p + '%;background:' + (p >= 80 ? '#2f9e62' : p >= 60 ? '#c99a2e' : '#c4452c') + '"></div></div>'; };
    if (!cu()) return;
    cu().innerHTML = '<div class="dis-crit-total"><b>' + n(k.total) + '</b><span>/10</span><div>' + esc(k.veredicto || '') + '</div></div>'
      + DIS_CRIT_EJES.map(e => '<div class="dis-crit-eje"><span>' + e[1] + '</span>' + barra(k[e[0]]) + '<b>' + n(k[e[0]]) + '</b></div>').join('')
      + '<div class="ui-tot" style="margin:12px 0 4px">Qué cambiar</div><ol class="dis-crit-mej">' + (k.mejoras || []).map(m => '<li>' + esc(m) + '</li>').join('') + '</ol>'
      + (DIS.ed && DIS.ed === d && k.instruccion ? '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn on" onclick="disCritAplicar()">✨ Aplicar estas mejoras</button></div>' : '')
      + '<div class="ui-nota" style="margin-top:8px">US$' + n(r.usd) + (_disAprendido().length ? ' · comparó con ' + _disAprendido().length + ' ganadora(s) de Tulula' : ' · aún no hay ganadoras para comparar: aprende cuando las haya') + '</div>';
    DIS._critInstr = k.instruccion || '';
    if (!DIS.ed) disPintar();
  } catch (e) { if (cu()) cu().innerHTML = '<span class="mal">No se pudo (' + esc(e.message) + ').</span>'; }
  finally { DIS._critCorre = 0; }
}
function disCritAplicar(){ const v = document.getElementById('disCrit'); if (v) v.remove(); disIAMensajeAbrir(); setTimeout(() => { const t = document.getElementById('disIAtxt'); if (t){ t.value = DIS._critInstr || ''; disIAMensaje(); } }, 80); }
function disCriticarEditor(){ if (DIS.ed && DIS._cx) disCriticar(DIS.ed, DIS._cx); }
async function disCriticarFila(id){
  const f = (DIS.filas || []).find(x => x.id === id); if (!f) return; const aj = f.ajustes || {}, p = _disProd(aj.prev_handle); if (!p) return;
  disCriticar(f, disCtx(p, await disInfo(p.handle), aj.prev_color, aj));
}
/* ══ 21-nov noche (Pablo) · precio según público, ventajas de la tienda, luz del ambiente, parecido entre diseños ══ */
/* Ventajas de Tulula (de tulula.com.pe + las que dijo Pablo). Editables en 🎨 Marca. Campos {{ventaja1}}…{{ventaja4}}. */
const DIS_VENTAJAS_DEF = ['Paga hasta en 6 cuotas sin intereses', 'Primer cambio de talla gratis', '10% en tu primera compra', 'Pago semi contra entrega', 'Envío gratis desde S/ 200', 'Envío gratis en tu primera compra web desde S/ 100'];
function _disVentajas(){ const v = (DIS.marca && DIS.marca.ventajas) || DIS_VENTAJAS_DEF; return Array.isArray(v) ? v.filter(x => String(x || '').trim()) : DIS_VENTAJAS_DEF; }
/* Decisión de Pablo: Frío y Tibio SIN precio; Caliente con precio nuevo grande + tachado + % (se puede forzar por diseño). */
function _disSinPrecio(d){
  const a = (d && d.ajustes) || {}, modo = (DIS.marca && DIS.marca.precio_publico) || 'caliente';
  if (a.precio === 'si') return false; if (a.precio === 'no') return true;
  return modo === 'caliente' && _disTemp(d) !== 'caliente';
}
function _disCxSinPrecio(cx){ return Object.assign({}, cx, { precio: '', antes: '', descuento: '', ahorro: '', oferta: false, badge: cx.preventa ? 'Preventa' : cx.ultimas ? 'Últimas tallas' : ((+cx.n_resenas || 0) >= 10 ? 'Favorita de clientas' : '') }); }
/* parecido entre diseños: misma «huella» de capas (tipo y lugar en una grilla de 10 %). Meta trata casi-iguales como uno solo. */
function _disHuellaCapas(d){ return new Set((d.capas || []).filter(c => !c.oculto).map(c => c.t + ':' + Math.round((+c.x || 0) / 10) + ':' + Math.round((+c.y || 0) / 10) + ':' + Math.round((c.w != null ? +c.w : 100) / 10))); }
function _disParecido(a, b){ const A = _disHuellaCapas(a), B = _disHuellaCapas(b); let i = 0; A.forEach(x => { if (B.has(x)) i++; }); const u = A.size + B.size - i; return u ? i / u : 0; }
function _disGemelo(f){
  let mejor = null; (DIS.filas || []).forEach(g => { if (g.id === f.id || g.estado === 'archivada' || f.estado === 'archivada') return; const p = _disParecido(f, g); if (p >= 0.7 && (!mejor || p > mejor.p)) mejor = { f: g, p }; });
  return mejor;
}
/* luz del ambiente: mide el color promedio del fondo y calienta/enfría la prenda + capa de «luz suave» del mismo color */
async function _disColorPromedio(url){
  const im = await new Promise((ok, mal) => { const x = new Image(); x.crossOrigin = 'anonymous'; x.onload = () => ok(x); x.onerror = mal; x.src = url; });
  const c = document.createElement('canvas'); c.width = 12; c.height = 12; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 12, 12);
  const d = g.getImageData(0, 0, 12, 12).data; let r = 0, gg = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4){ if (d[i + 3] < 200) continue; r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
  return n ? [r / n, gg / n, b / n] : [128, 128, 128];
}
async function disIgualarLuz(){
  if (!DIS.ed) return; const C = DIS.ed.capas, fo = C.find(c => c.esFondo), pr = C.find(c => c.t === 'foto' && !c.esFondo);
  if (!fo || !pr){ const r = document.getElementById('disEdRes'); if (r) r.textContent = 'Primero pon un fondo de la biblioteca.'; return; }
  try {
    const [r, g, b] = await _disColorPromedio(_disFotoSrc(DIS._cx, fo.src)), lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255, calido = (r - b) / 255;
    _disMemo();
    pr.calidez = Math.max(-25, Math.min(35, Math.round(calido * 90)));
    pr.bri = Math.max(80, Math.min(112, Math.round(88 + lum * 24)));
    const hex = '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const i = C.findIndex(c => c.esLuz), luz = { t: 'forma', x: 0, y: 0, w: 100, h: 100, color: hex, op: 0.32, mezcla: 'soft-light', esLuz: true };
    if (i >= 0) C[i] = luz; else { const k = C.indexOf(pr); C.splice(k + 1, 0, luz); }
    DIS.ed._sucio = true; disEdPintar(); const e2 = document.getElementById('disEdRes'); if (e2) e2.textContent = '🎨 Luz igualada al fondo (Ctrl+Z deshace)';
  } catch (e) { const e2 = document.getElementById('disEdRes'); if (e2) e2.innerHTML = '<span class="mal">No pude medir la luz del fondo.</span>'; }
}
/* lote: combinaciones producto × color × formato × foto (función pura: la prueba la usa) */
function _disLoteCombos(sel, formatos, fotos){
  const out = []; Object.keys(sel || {}).forEach(h => (sel[h] || []).forEach(c => (formatos || []).forEach(f => { for (let k = 0; k < Math.max(1, +fotos || 1); k++) out.push({ handle: h, color: c, formato: f, foto_n: k }); })));
  return out;
}
function _disCapasFoto(capas, k){ return !k ? capas : capas.map(c => c.t === 'foto' && /^color:\d+$/.test(c.src || 'color:0') ? Object.assign({}, c, { src: 'color:' + ((+String(c.src || 'color:0').split(':')[1] || 0) + k) }) : c); }
function disLoteDesdeEditor(carr){ disGuardar(true).then(f => { if (!f) return; const v = document.getElementById('disEd'); if (v) v.remove(); DIS.ed = null; _disTeclas(false); DIS.ver = 'activos'; disPintar(); disLoteAbrir(f.id, carr); }); }
function disLoteAbrir(id, carr){
  const f = (DIS.filas || []).find(x => x.id === id); if (!f) return;
  DIS.lote = { id, carr: !!carr, nuevas: [], sel: {}, formatos: [f.formato], fotos: 1, q: '', stock: true, corriendo: false, parar: false };
  const h = '<div class="dis-modal" id="disLote"><div class="dis-caja" style="max-width:860px"><div class="dis-cab"><div><div class="ui-pag">' + (carr ? '🎠 Carrusel con «' : 'Replicar «') + esc(f.nombre) + '»</div>' + (carr ? '<div class="ui-nota">Marca 2 a 10 prendas o colores: cada una es una tarjeta del carrusel, en el orden en que las marcas.</div>' : '') + '</div><span style="flex:1"></span>'
    + '' + _disIb('cerrar', 'Cerrar', 'disLoteCerrar()') + '</div><div id="disLoteCuerpo"></div></div></div>';
  document.body.insertAdjacentHTML('beforeend', h); disLotePintar();
}
function disLoteCerrar(){ if (DIS.lote && DIS.lote.corriendo){ DIS.lote.parar = true; return; } const v = document.getElementById('disLote'); if (v) v.remove(); DIS.lote = null; disPintar(); }
function disLotePintar(){
  const L = DIS.lote, el = document.getElementById('disLoteCuerpo'); if (!L || !el) return;
  const q = _mkNorm(L.q), prods = (DIS.prods || []).filter(p => _disActivo(p) && (!q || _mkNorm(p.titulo).indexOf(q) >= 0));
  const n = _disLoteCombos(L.sel, L.formatos, L.fotos).length;
  let h = '<div class="dis-barra"><div class="dis-barra-izq"><input type="search" placeholder="Buscar producto" value="' + disA(L.q) + '" oninput="DIS.lote.q=this.value;clearTimeout(DIS._lt);DIS._lt=setTimeout(disLotePintar,250)" style="width:180px">'
    + '<label class="dis-chk"><input type="checkbox"' + (L.formatos.indexOf('4x5') >= 0 ? ' checked' : '') + ' onchange="disLoteFormato(\'4x5\',this.checked)"> <span class="ui-nota">4:5</span></label>'
    + '<label class="dis-chk"><input type="checkbox"' + (L.formatos.indexOf('9x16') >= 0 ? ' checked' : '') + ' onchange="disLoteFormato(\'9x16\',this.checked)"> <span class="ui-nota">9:16</span></label>'
    + '<label class="dis-prop" style="flex-direction:row;align-items:center;gap:6px"><span class="ui-nota">Fotos por color</span><select onchange="DIS.lote.fotos=+this.value;disLotePintar()">' + [1, 2, 3, 4, 5].map(k => '<option' + (k === L.fotos ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></label>'
    + '<label class="dis-chk" title="No genera piezas de colores sin ninguna talla disponible"><input type="checkbox"' + (L.stock ? ' checked' : '') + ' onchange="DIS.lote.stock=this.checked"> <span class="ui-nota">Saltar colores agotados</span></label></div>'
    + '<div class="dis-barra-der"><span class="ui-nota" id="disLoteRes"></span><button class="btn on" ' + (n && !L.corriendo ? '' : 'disabled ') + 'onclick="disLoteCorrer()">Generar ' + n + ' pieza' + (n === 1 ? '' : 's') + '</button></div></div>'
    + '<div class="dis-lote-lista">' + prods.map(p => { const on = !!L.sel[p.handle], inf = DIS.info[p.handle], cols = inf && !inf.then && inf.options ? ((inf.options.find(o => /color/i.test(o.name || '')) || {}).values || []) : null;
      return '<div class="dis-lote-fila"><label class="dis-chk"><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="disLoteProd(\'' + disA(p.handle) + '\',this.checked)"> <span>' + esc(p.titulo) + '</span></label>'
        + (on ? '<div class="dis-campos">' + (cols ? cols.map(c => '<button class="dis-campo' + (L.sel[p.handle].indexOf(c) >= 0 ? ' on' : '') + '" onclick="disLoteColor(\'' + disA(p.handle) + '\',\'' + disA(c).replace(/\\/g, '') + '\')">' + esc(c) + '</button>').join('') : '<span class="ui-nota">cargando colores…</span>') + '</div>' : '') + '</div>'; }).join('') + '</div>';
  el.innerHTML = h;
}
function disLoteFormato(f, on){ const L = DIS.lote; L.formatos = L.formatos.filter(x => x !== f); if (on) L.formatos.push(f); disLotePintar(); }
async function disLoteProd(handle, on){
  const L = DIS.lote; if (!on){ delete L.sel[handle]; return disLotePintar(); }
  L.sel[handle] = []; disLotePintar();
  const inf = await disInfo(handle), o = (inf.options || []).find(x => /color/i.test(x.name || ''));
  if (DIS.lote && DIS.lote.sel[handle]) DIS.lote.sel[handle] = o ? (o.values || []).slice() : ['']; disLotePintar();
}
function disLoteColor(handle, c){ const a = DIS.lote.sel[handle]; const i = a.indexOf(c); if (i >= 0) a.splice(i, 1); else a.push(c); disLotePintar(); }
async function disLoteCorrer(){
  const L = DIS.lote, f = (DIS.filas || []).find(x => x.id === L.id); if (!f || L.corriendo) return;
  const combos = _disLoteCombos(L.sel, L.formatos, L.fotos); L.corriendo = true; L.parar = false;
  const res = () => document.getElementById('disLoteRes'); let ok = 0, salt = 0, mal = 0; const t0 = Date.now();
  for (let i = 0; i < combos.length; i++){
    if (L.parar) break;
    const x = combos[i], r = res(); if (r) r.innerHTML = 'Generando ' + (i + 1) + ' de ' + combos.length + '… <button class="btn" onclick="DIS.lote.parar=true">⏹ Parar</button>';
    try {
      const p = _disProd(x.handle), inf = await disInfo(x.handle), cx = disCtx(p, inf, x.color, f.ajustes);
      if (L.stock && cx.agotado){ salt++; continue; }
      if (x.foto_n && !cx.fotos[cx.i0 + x.foto_n]){ salt++; continue; }
      const d = Object.assign({}, f, { formato: x.formato, capas: _disCapasFoto(f.capas, x.foto_n) });
      const blob = await disPng(d, cx);
      const ruta = 'creativos/dis/' + f.id + '/' + (x.handle + '-' + (cx.color || 'unico') + '-' + x.formato + '-' + (x.foto_n + 1)).replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '-' + Date.now() + '.png';
      const url = await _disSubir(blob, ruta);
      const g = await _mklSb('/rest/v1/rpc/mk_dis_pieza_guardar', { method: 'POST', body: JSON.stringify({ p_diseno: f.id, p_handle: x.handle, p_color: cx.color, p_formato: x.formato, p_foto_n: x.foto_n, p_url: url, p_ruta: ruta }) });
      if (!g || !g.ok) throw new Error((g && g.error) || 'no se guardó');
      DIS.piezas = DIS.piezas.filter(z => !(z.diseno_id === f.id && z.handle === x.handle && z.color === cx.color && z.formato === x.formato && z.foto_n === x.foto_n && z.estado === 'nueva'));
      DIS.piezas.unshift(g.fila); L.nuevas.push(g.fila.id); ok++;
    } catch (e) { mal++; console.warn('[Diseños] pieza', x, e); }
  }
  L.corriendo = false;
  const seg = Math.round((Date.now() - t0) / 1000);
  DIS.msg = '🔁 ' + ok + ' pieza' + (ok === 1 ? '' : 's') + ' lista' + (ok === 1 ? '' : 's') + ' en ' + seg + ' s' + (salt ? ' · ' + salt + ' saltadas (agotado o sin esa foto)' : '') + (mal ? ' · <span class="mal">' + mal + ' fallaron</span>' : '') + (L.parar ? ' · parado' : '') + '. Están en 🧩 Piezas.';
  const v = document.getElementById('disLote'); if (v) v.remove(); const id = L.id; DIS.lote = null; disPintar(); if (ok){ disPiezasAbrir(id); if (L.carr && DIS.pz){ DIS.pz.sel = L.nuevas.slice(0, 10); disPiezasPintar(); } }
}
/* piezas: elegir (el orden de los clics = el orden del carrusel), llevar a Por usar, descargar, archivar */
function disPiezasAbrir(id){
  DIS.pz = { dis: id || '', prod: '', sel: [] };
  document.body.insertAdjacentHTML('beforeend', '<div class="dis-modal" id="disPz"><div class="dis-caja" style="max-width:1100px"><div class="dis-cab"><span class="ui-pag">🧩 Piezas</span><span style="flex:1"></span>' + _disIb('cerrar', 'Cerrar', 'disPiezasCerrar()') + '</div><div id="disPzCuerpo"></div></div></div>');
  disPiezasPintar();
}
function disPiezasCerrar(){ const v = document.getElementById('disPz'); if (v) v.remove(); DIS.pz = null; disPintar(); }
function disPiezasPintar(){
  const Z = DIS.pz, el = document.getElementById('disPzCuerpo'); if (!Z || !el) return;
  const vis = DIS.piezas.filter(x => x.estado !== 'archivada' && (!Z.dis || x.diseno_id === +Z.dis) && (!Z.prod || x.handle === Z.prod));
  const nomD = id => ((DIS.filas || []).find(f => f.id === id) || {}).nombre || ('#' + id), nomP = h => (_disProd(h) || {}).titulo || h;
  const ds = [...new Set(DIS.piezas.map(x => x.diseno_id))], ps = [...new Set(DIS.piezas.filter(x => !Z.dis || x.diseno_id === +Z.dis).map(x => x.handle))];
  const n = Z.sel.length;
  let h = '<div class="dis-barra"><div class="dis-barra-izq"><select onchange="DIS.pz.dis=this.value;DIS.pz.prod=\'\';disPiezasPintar()"><option value="">Todos los diseños</option>' + ds.map(d => '<option value="' + d + '"' + (+Z.dis === d ? ' selected' : '') + '>' + esc(nomD(d)) + '</option>').join('') + '</select>'
    + '<select onchange="DIS.pz.prod=this.value;disPiezasPintar()"><option value="">Todos los productos</option>' + ps.map(p => '<option value="' + disA(p) + '"' + (Z.prod === p ? ' selected' : '') + '>' + esc(nomP(p)) + '</option>').join('') + '</select>'
    + '<span class="ui-nota">' + vis.length + ' piezas · el orden en que las eliges = orden del carrusel</span></div>'
    + '<div class="dis-barra-der"><span class="ui-nota" id="disPzRes"></span>'
    + '<button class="btn" ' + (n ? '' : 'disabled ') + 'onclick="disPiezasBajar()">⬇ Descargar</button><button class="btn" ' + (n ? '' : 'disabled ') + 'onclick="disPiezasArchivar()">🗄 Archivar</button>'
    + '<button class="btn on" ' + (n && n <= 10 ? '' : 'disabled ') + 'onclick="disPiezasUsar()" title="1 = imagen · 2 a 10 = carrusel">📤 A Por usar' + (n > 1 ? ' (carrusel de ' + n + ')' : '') + '</button></div></div>';
  if (!vis.length) h += '<div class="mkl-vacio">Todavía no hay piezas. Usa 🔁 en un diseño para generarlas.</div>';
  else h += '<div class="dis-pz-grilla">' + vis.map(x => { const k = Z.sel.indexOf(x.id);
    return '<div class="dis-pz' + (k >= 0 ? ' on' : '') + '" onclick="disPiezaSel(' + x.id + ')" title="' + disA(nomD(x.diseno_id) + ' · ' + nomP(x.handle) + ' · ' + x.color + ' · ' + (x.formato === '9x16' ? '9:16' : '4:5')) + '">'
      + '<img src="' + disA(x.url) + '" loading="lazy">' + (k >= 0 ? '<span class="dis-pz-n">' + (k + 1) + '</span>' : '') + (x.estado === 'enviada' ? '<span class="dis-pz-env" title="Ya se llevó a Por usar">📤</span>' : '')
      + '<div class="ui-nota dis-nom">' + esc(nomP(x.handle)) + ' · ' + esc(x.color || '—') + '</div></div>'; }).join('') + '</div>';
  el.innerHTML = h;
}
function disPiezaSel(id){ const a = DIS.pz.sel, i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); disPiezasPintar(); }
function _disPzElegidas(){ return DIS.pz.sel.map(id => DIS.piezas.find(x => x.id === id)).filter(Boolean); }
async function disPiezasBajar(){
  for (const x of _disPzElegidas()){ try { const b = await (await fetch(x.url)).blob(), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (x.ruta || 'pieza.png').split('/').pop(); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); } catch (_) {} }
}
async function disPiezasArchivar(){
  const ids = DIS.pz.sel.slice(); if (!ids.length) return;
  try { const r = await _mklSb('/rest/v1/rpc/mk_dis_pieza_estado', { method: 'POST', body: JSON.stringify({ p_ids: ids, p_estado: 'archivada' }) }); if (!r || !r.ok) throw new Error((r && r.error) || 'no se guardó');
    DIS.piezas.forEach(x => { if (ids.indexOf(x.id) >= 0) x.estado = 'archivada'; }); DIS.pz.sel = []; disPiezasPintar(); }
  catch (e) { const r = document.getElementById('disPzRes'); if (r) r.innerHTML = '<span class="mal">' + esc(e.message) + '</span>'; }
}
async function disPiezasUsar(){
  const L = _disPzElegidas(), res = document.getElementById('disPzRes'); if (!L.length || L.length > 10) return;
  if (res) res.textContent = 'Preparando…';
  try {
    const files = await Promise.all(L.map(async x => new File([await (await fetch(x.url)).blob()], (x.ruta || ('pieza-' + x.id + '.png')).split('/').pop(), { type: 'image/png' })));
    try { await _mklSb('/rest/v1/rpc/mk_dis_pieza_estado', { method: 'POST', body: JSON.stringify({ p_ids: L.map(x => x.id), p_estado: 'enviada' }) }); L.forEach(x => { x.estado = 'enviada'; }); } catch (_) {}
    const v = document.getElementById('disPz'); if (v) v.remove(); DIS.pz = null;
    mkIrSub('contenido'); await mkcrAbrir(); mkcrSubirAbrir(null);
    MKCR.disenoId = L[0].diseno_id;
    mkcrArchivo(files);
    const hs = [...new Set(L.map(x => x.handle))];
    if (hs.length === 1){ const pr = document.getElementById('mkcrProd'), nom = _disProdNom((_disProd(hs[0]) || {}).titulo || ''); if (pr && nom){ pr.value = nom; pr.dispatchEvent(new Event('input', { bubbles: true })); } }
    try { mkcrNombreArmar(); } catch (_) {}
  } catch (e) { if (res) res.innerHTML = '<span class="mal">No pude preparar las piezas (' + esc(e.message) + ').</span>'; }
}
(function(){
  if (typeof document === 'undefined' || document.getElementById('disCss2')) return;
  const s = document.createElement('style'); s.id = 'disCss2';
  s.textContent = '.dis-lote-lista{max-height:60vh;overflow:auto;display:flex;flex-direction:column;gap:6px}.dis-lote-fila{padding:8px 10px;background:var(--card);border:1px solid var(--bd);border-radius:8px}'
    + '.dis-campo.on{color:var(--txt);border-color:#7c5cff;background:rgba(124,92,255,.18)}'
    + '.dis-pz-grilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;max-height:70vh;overflow:auto}'
    + '.dis-pz{position:relative;border:2px solid transparent;border-radius:8px;cursor:pointer;background:var(--card);padding:4px}.dis-pz.on{border-color:#7c5cff}'
    + '.dis-pz img{width:100%;display:block;border-radius:6px}.dis-pz-n{position:absolute;top:8px;left:8px;background:#7c5cff;color:#fff;border-radius:12px;padding:1px 8px;font:600 12px var(--ui-f)}'
    + '.dis-pz-env{position:absolute;top:8px;right:8px}';
  document.head.appendChild(s);
})();

/* ══ 21-nov noche · Fase 4 · 📅 CALENDARIO COMERCIAL (Pablo aprobó). Fechas de Perú que mueven moda ejecutiva.
   Criterio (práctica de retail grande, no dato de Tulula): creativos listos ~1 semana antes de pautar; pauta 2-5 semanas antes según la fecha;
   la fecha límite de pedido deja 4 días para que llegue (Lima y provincias). ══ */
const DIS_FECHAS = [
  { k: 'valentin', nombre: 'San Valentín', e: '💝', f: y => new Date(y, 1, 14), frase: 'Un look para enamorarte de ti', sub: 'Regálate algo que te haga sentir poderosa', ant: 21 },
  { k: 'oficina', nombre: 'Regreso a la oficina', e: '💼', f: y => new Date(y, 2, 2), frase: 'Vuelve a la oficina con todo', sub: 'Looks listos para tu primera reunión', ant: 21 },
  { k: 'mujer', nombre: 'Día de la Mujer', e: '🌷', f: y => new Date(y, 2, 8), frase: 'Para la mujer que lidera', sub: 'Celebra a la ejecutiva que eres', ant: 14 },
  { k: 'madre', nombre: 'Día de la Madre', e: '💐', f: y => { const d = new Date(y, 4, 1); return new Date(y, 4, 1 + (7 - d.getDay()) % 7 + 7); }, frase: 'El regalo que mamá sí va a usar', sub: 'Elegancia para todos sus días', ant: 28 },
  { k: 'patrias', nombre: 'Fiestas Patrias', e: '🇵🇪', f: y => new Date(y, 6, 28), frase: 'Impecable estas Fiestas Patrias', sub: 'Looks para los almuerzos y reuniones de julio', ant: 21 },
  { k: 'blackfriday', nombre: 'Black Friday', e: '🖤', f: y => { const d = new Date(y, 10, 1); return new Date(y, 10, 1 + (4 - d.getDay() + 7) % 7 + 22); }, frase: 'Lo mejor de Tulula al mejor precio', sub: 'Solo por pocos días', ant: 14, oferta: true },
  { k: 'navidad', nombre: 'Navidad', e: '🎄', f: y => new Date(y, 11, 25), frase: 'Regala elegancia esta Navidad', sub: 'El regalo perfecto para ella (o para ti)', ant: 35 },
  { k: 'finano', nombre: 'Fin de año', e: '🥂', f: y => new Date(y, 11, 31), frase: 'Tu look para cerrar el año', sub: 'Brilla en la cena de fin de año', ant: 21 }];
function _disDM(d){ return d.getDate() + '/' + (d.getMonth() + 1); }
function _disFechasProx(hoy){
  hoy = hoy || new Date(); const h0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return DIS_FECHAS.map(x => { let d = x.f(h0.getFullYear()); if (d < h0) d = x.f(h0.getFullYear() + 1);
    const dias = Math.round((d - h0) / 864e5), pauta = new Date(d - x.ant * 864e5), crea = new Date(pauta - 7 * 864e5), lim = new Date(d - 4 * 864e5);
    return Object.assign({}, x, { d, dias, pauta, crea, limite: x.oferta ? 'Solo hasta el ' + _disDM(d) : 'Pide hasta el ' + _disDM(lim) + ' y llega a tiempo', ya: h0 >= pauta }); })
    .sort((a, b) => a.d - b.d);
}
function _disFecha(k, hoy){ const L = _disFechasProx(hoy); return (k && L.find(x => x.k === k)) || L[0] || null; }
function _disCalendarioHtml(){
  const L = _disFechasProx().slice(0, 5), sel = (_disFecha(DIS.fechaSel) || {}).k;
  return '<div class="dis-cal"><span class="ui-nota" style="margin-right:6px">📅 PRÓXIMAS FECHAS</span>' + L.map(x => '<button type="button" class="dis-cal-f' + (x.k === sel ? ' on' : '') + '" onclick="DIS.fechaSel=\'' + x.k + '\';disPintar()" title="' + disA('Creativos desde el ' + _disDM(x.crea) + ' · pauta desde el ' + _disDM(x.pauta) + ' · ' + x.limite) + '">'
    + x.e + ' <b>' + esc(x.nombre) + '</b> <span class="ui-nota">en ' + x.dias + ' días' + (x.ya ? ' · 🔴 ya toca pautar' : ' · pauta desde ' + _disDM(x.pauta)) + '</span></button>').join('') + '</div>';
}

/* ══ 21-nov noche · Fase 4 · 🧬 ADN DEL CREATIVO: qué tienen en común los diseños que venden (datos reales de sus anuncios) ══ */
const DIS_ADN_EJES = [
  ['Plantilla', f => String(f.nombre || '').replace(/\s*\(copia.*\)\s*$/i, '')],
  ['Público', f => (DIS_TEMP.find(x => x[0] === _disTemp(f)) || ['', '—'])[1]],
  ['Precio', f => _disSinPrecio(f) ? 'Sin precio' : 'Con precio'],
  ['Foto', f => (f.capas || []).some(c => /^fondo:/.test(c.src || '')) ? 'Con fondo de ambiente' : 'De estudio'],
  ['Tipo', f => f.tipo === 'carrusel' ? 'Carrusel' : 'Una imagen'],
  ['Formato', f => f.formato === '9x16' ? 'Historias 9:16' : 'Feed 4:5']];
function _disADN(filas){
  return DIS_ADN_EJES.map(([eje, fn]) => { const g = {};
    (filas || []).filter(f => f.estado !== 'archivada').forEach(f => { const k = fn(f), x = _disRes(f.id) || {}, o = g[k] || (g[k] = { k, n: 0, gasto: 0, compras: 0, ingreso: 0, gana: 0 });
      o.n++; o.gasto += +x.gasto || 0; o.compras += +x.pedidos || 0; o.ingreso += +x.ingreso || 0; if (f.estado === 'ganadora') o.gana++; });
    const L = Object.values(g).map(o => Object.assign(o, { roas: o.gasto > 0 ? o.ingreso / o.gasto : null })).sort((a, b) => (b.roas || -1) - (a.roas || -1) || b.n - a.n);
    return { eje, L, mejor: L.find(o => o.gasto > 0 && o.compras > 0) || null }; });
}
function disADNAbrir(){
  const v = document.getElementById('disADN'); if (v) v.remove(); const A = _disADN(DIS.filas), n = x => String(x).replace('.', ',');
  const hay = A.some(a => a.L.some(o => o.gasto > 0));
  const res = hay ? '<div class="dis-aviso">🧬 Lo que más vende: ' + A.filter(a => a.mejor).map(a => '<b>' + esc(a.eje) + ':</b> ' + esc(a.mejor.k) + ' (ROAS ' + n(a.mejor.roas.toFixed(1)) + ')').join(' · ') + '</div>'
    : '<div class="dis-aviso">Todavía ningún diseño de esta sección tiene anuncio con gasto. El ADN se llena solo cuando Paola use los diseños (📤 Usar → anuncio).</div>';
  const tabla = a => '<div class="ui-blo" style="margin-top:12px">' + esc(a.eje) + '</div><table class="tt" style="width:100%"><thead><tr><th>' + esc(a.eje) + '</th><th>Diseños</th><th>Gasto</th><th>Compras</th><th>ROAS</th><th>🏆</th></tr></thead><tbody>'
    + a.L.map(o => '<tr><td>' + esc(o.k) + '</td><td>' + o.n + '</td><td>S/ ' + Math.round(o.gasto) + '</td><td>' + o.compras + '</td><td>' + (o.roas == null ? '—' : n(o.roas.toFixed(2))) + '</td><td>' + (o.gana || '') + '</td></tr>').join('') + '</tbody></table>';
  document.body.insertAdjacentHTML('beforeend', '<div class="dis-modal" id="disADN"><div class="dis-caja" style="max-width:760px;max-height:88vh;overflow:auto"><div class="dis-cab"><div><div class="ui-pag">🧬 ADN de los diseños</div><div class="ui-nota">Qué tienen en común los que venden · datos reales de sus anuncios</div></div><span style="flex:1"></span>' + _disIb('cerrar', 'Cerrar', 'document.getElementById(\'disADN\').remove()') + '</div>'
    + res + A.map(tabla).join('') + '</div></div>');
}

/* ══ 21-nov noche · Fase 5 · 🎬 VIDEO desde un diseño (sin costo: se arma en el navegador).
   «Zoom suave» = una prenda 6 s · «Sus colores» = un color tras otro (2,4 s c/u). MP4 si el navegador puede; si no, WebM (Meta acepta los dos). ══ */
function disVideoAbrir(id){
  const f = (DIS.filas || []).find(x => x.id === id); if (!f) return; const v = document.getElementById('disVid'); if (v) v.remove();
  document.body.insertAdjacentHTML('beforeend', '<div class="dis-modal" id="disVid"><div class="dis-caja" style="max-width:520px"><div class="dis-cab"><div><div class="ui-pag">🎬 Video · «' + esc(f.nombre) + '»</div><div class="ui-nota">Sin costo · no cambies de pestaña mientras se graba</div></div><span style="flex:1"></span>' + _disIb('cerrar', 'Cerrar', 'document.getElementById(\'disVid\').remove()') + '</div>'
    + '<div class="dis-props"><label class="dis-prop"><span class="ui-nota">Formato</span><select id="disVidForm"><option value="9x16"' + (f.formato === '9x16' ? ' selected' : '') + '>Historias y Reels 9:16</option><option value="4x5"' + (f.formato !== '9x16' ? ' selected' : '') + '>Feed 4:5</option></select></label></div>'
    + '<div style="display:flex;gap:8px;margin:10px 0"><button class="btn on" onclick="disVideoHacer(' + id + ',\'zoom\')">🔍 Zoom suave (6 s)</button><button class="btn" onclick="disVideoHacer(' + id + ',\'colores\')">🎨 Sus colores, uno tras otro</button></div>'
    + '<div id="disVidRes" class="ui-nota"></div></div></div>');
}
async function _disMuxLib(){
  if (window.Mp4Muxer) return;
  await new Promise((ok, mal) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js'; sc.onload = ok; sc.onerror = () => mal(new Error('no cargó el armador de video')); document.head.appendChild(sc); });
}
function _disVidMime(){ const L = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']; return L.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || 'video/webm'; }
function _disVidPlan(n, modo){ const seg = modo === 'colores' ? 2.4 : 6; return { seg, total: seg * Math.max(1, n), fade: 0.4 }; }
async function disVideoHacer(id, modo){
  const f = (DIS.filas || []).find(x => x.id === id), res = document.getElementById('disVidRes'); if (!f || !res || DIS._vidCorre) return; DIS._vidCorre = 1;
  try {
    const d = JSON.parse(JSON.stringify(f)); d.ajustes = d.ajustes || {}; d.formato = (document.getElementById('disVidForm') || {}).value || d.formato || '4x5';
    const p = _disProd(d.ajustes.prev_handle), inf = await disInfo(p.handle), cx0 = disCtx(p, inf, d.ajustes.prev_color, d.ajustes);
    const cols = modo === 'colores' ? (cx0.colores.length > 1 ? cx0.colores.slice(0, 5) : [cx0.color]) : [cx0.color], imgs = [];
    for (let i = 0; i < cols.length; i++){ res.textContent = 'Haciendo la imagen ' + (i + 1) + ' de ' + cols.length + '…'; imgs.push(await createImageBitmap(await disPng(d, disCtx(p, inf, cols[i], d.ajustes)))); }
    const [W, H] = DIS_TAM[d.formato] || DIS_TAM['4x5'], cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const pl = _disVidPlan(imgs.length, modo), FPS = 30;
    const pinta = (im, z, a) => { g.globalAlpha = a; g.drawImage(im, (W - W * z) / 2, (H - H * z) / 2, W * z, H * z); g.globalAlpha = 1; };
    const cuadro = t => { const i = Math.min(imgs.length - 1, Math.floor(t / pl.seg)), lt = t - i * pl.seg; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (i > 0 && lt < pl.fade) pinta(imgs[i - 1], 1.06, 1); pinta(imgs[i], 1 + 0.06 * (lt / pl.seg), Math.min(1, lt / pl.fade)); };
    let blob, mime;
    if (window.VideoEncoder){
      /* cuadro por cuadro (no depende de que la pestaña esté al frente) → MP4 de verdad, con duración */
      res.textContent = 'Armando el video…'; await _disMuxLib(); mime = 'video/mp4';
      const mx = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H }, fastStart: 'in-memory' });
      let err = null; const enc = new VideoEncoder({ output: (c, m) => mx.addVideoChunk(c, m), error: e => { err = e; } });
      enc.configure({ codec: 'avc1.640028', width: W, height: H, bitrate: 6e6, framerate: FPS });
      const N = Math.round(pl.total * FPS);
      for (let k = 0; k < N; k++){ if (err) throw err; cuadro(k / FPS); const vf = new VideoFrame(cv, { timestamp: Math.round(k * 1e6 / FPS), duration: Math.round(1e6 / FPS) }); enc.encode(vf, { keyFrame: k % 60 === 0 }); vf.close();
        if (enc.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 0)); if (k % 30 === 0) res.textContent = 'Armando el video… ' + Math.round(k / N * 100) + '%'; }
      await enc.flush(); if (err) throw err; mx.finalize(); blob = new Blob([mx.target.buffer], { type: mime });
    } else {
      mime = _disVidMime(); const ch = [], rec = new MediaRecorder(cv.captureStream(FPS), { mimeType: mime, videoBitsPerSecond: 8e6 });
      rec.ondataavailable = e => { if (e.data && e.data.size) ch.push(e.data); };
      res.textContent = 'Grabando ' + Math.round(pl.total) + ' s…'; rec.start(200); const t0 = performance.now();
      await new Promise(ok => { const paso = () => { const t = (performance.now() - t0) / 1000; if (t >= pl.total){ ok(); return; } cuadro(t); requestAnimationFrame(paso); }; paso(); });
      await new Promise(ok => { rec.onstop = ok; rec.stop(); }); blob = new Blob(ch, { type: mime.split(';')[0] });
    }
    if (blob.size < 20000) throw new Error('el video salió vacío');
    const ext = /mp4/.test(mime) ? 'mp4' : 'webm', url = URL.createObjectURL(blob);
    const nom = ('DIS' + f.id + '-' + p.handle + '-video-' + d.formato).replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '.' + ext;
    DIS._vid = { file: new File([blob], nom, { type: blob.type }), d, p };
    res.innerHTML = '<video src="' + url + '" controls autoplay loop muted playsinline style="width:100%;max-height:52vh;border-radius:8px;background:#000"></video>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px"><a class="btn" href="' + url + '" download="' + nom + '">⬇ Descargar</a><button class="btn on" onclick="disVideoABiblioteca()">📤 Mandar a Biblioteca</button></div>'
      + '<div class="ui-nota">' + ext.toUpperCase() + ' · ' + Math.round(blob.size / 1024) + ' KB · ' + Math.round(pl.total) + ' s</div>';
  } catch (e) { res.innerHTML = '<span class="mal">No pude hacer el video (' + esc(e.message) + ').</span>'; }
  DIS._vidCorre = 0;
}
async function _disABiblioteca(file, d, p){
  try { await _mklSb('/rest/v1/rpc/mk_diseno_usado', { method: 'POST', body: JSON.stringify({ p_id: d.id }) }); } catch (_) {}
  mkIrSub('contenido'); await mkcrAbrir(); mkcrSubirAbrir(null); MKCR.disenoId = d.id; mkcrArchivo([file]);
  const pr = document.getElementById('mkcrProd'), nom = _disProdNom(p.titulo); if (pr && nom){ pr.value = nom; pr.dispatchEvent(new Event('input', { bubbles: true })); }
  try { mkcrNombreArmar(); } catch (_) {}
}
async function disVideoABiblioteca(){ const v = DIS._vid; if (!v) return; const m = document.getElementById('disVid'); if (m) m.remove(); await _disABiblioteca(v.file, v.d, v.p); }

/* ══ 21-nov noche · Fase 5 · 🖼 MARCO PARA CATÁLOGO: PNG 1:1 transparente con lo fijo del diseño (logo, formas, ventajas).
   Se sube en Meta al anuncio de catálogo (Opciones de catálogo › Marco) y se pone encima de TODAS las prendas de la web. ══ */
function _disCapasMarco(capas){
  return (capas || []).filter(c => c.t === 'logo' || c.t === 'forma' || c.t === 'degradado' || (c.t === 'texto' && !/\{\{(?!ventaja\d)\w+\}\}/.test(c.txt || '')));
}
async function disMarcoCatalogo(id){
  const f = (DIS.filas || []).find(x => x.id === id); if (!f) return;
  DIS.msg = 'Haciendo el marco para catálogo…'; disPintar();
  try {
    const d = JSON.parse(JSON.stringify(f)); d.formato = '1x1'; d.ajustes = Object.assign({}, d.ajustes || {}, { fondo: 'transparente' }); d.capas = _disCapasMarco(d.capas);
    if (!d.capas.length) throw new Error('este diseño no tiene partes fijas (logo, formas o ventajas)');
    const p = _disProd(d.ajustes.prev_handle), cx = disCtx(p, await disInfo(p.handle), '', d.ajustes), blob = await disPng(d, cx);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ('marco-catalogo-DIS' + f.id).toLowerCase() + '.png'; document.body.appendChild(a); a.click(); a.remove();
    DIS.msg = '🖼 Marco descargado (1080×1080, fondo transparente). En Meta: anuncio de catálogo › Opciones de catálogo › Marco › subir esta imagen.';
  } catch (e) { DIS.msg = '<span class="mal">No pude hacer el marco (' + esc(e.message) + ').</span>'; }
  disPintar();
}
