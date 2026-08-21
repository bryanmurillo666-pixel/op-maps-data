/* ============================================================
   OP-MAPS DATA — los rivales que vas descubriendo
   ------------------------------------------------------------
   De un rival se guardan dos cosas distintas, porque el juego te
   deja ver una y te esconde la otra:

     r  su TRIPULACIÓN y el estado de cada uno. Esto SÍ se ve antes
        de atacar: cuántos siguen en pie y en qué banda está cada
        uno (Sano 70-100 %, Herido 30-69 %, Crítico 1-29 %, Caído 0 %).

     g  sus tres GUARDIAS. Esto NO se ve: solo se averigua peleando
        o con informes de combate que alguien comparta.

   Siempre son tres guardias (dos si la tripulación tiene justo dos
   personajes), y un puesto puede estar en tres estados:

     null            no lo has averiguado todavía
     {n:'-', t:...}  el rival lo tiene vacío, así que concede
     {n:'Zoro', t:'Assault'}

   Vive en el navegador (localStorage): es tuyo y no se sube a ningún
   sitio.
   ============================================================ */
window.RIVALES = (function () {

  const KEY      = 'opmaps-rivales';
  const GUARDIAS = 3;
  const PUESTOS  = 3;
  const VACIO    = '-';

  /* Las cuatro bandas de salud que enseña el juego, más 'ok' como
     valor por defecto cuando no te has fijado. */
  const ESTADOS = ['ok', 'her', 'cri', 'ko'];
  const CAIDO   = 'ko';

  let lista = [];

  const existe = n => n === VACIO || window.CHARACTERS.some(c => c.n === n);

  const guardiaVacia = () => [null, null, null];

  function limpiaPuesto(p){
    if (!p || typeof p !== 'object') return null;
    if (!existe(p.n)) return null;
    if (window.RULES.TACTICS.indexOf(p.t) === -1) return null;
    return { n: p.n, t: p.t };
  }

  function limpiaMiembro(m){
    if (!m || typeof m !== 'object') return null;
    if (!window.CHARACTERS.some(c => c.n === m.n)) return null;
    return { n: m.n, e: ESTADOS.indexOf(m.e) === -1 ? 'ok' : m.e };
  }

  /* Todo lo que sale de localStorage se revisa: si el juego renombra a
     alguien, o alguien toca el guardado a mano, no debe romper nada.
     También sube los rivales guardados con el formato viejo, que no
     tenían tripulación y podían llevar menos de tres guardias. */
  function limpiaRival(r){
    if (!r || typeof r !== 'object') return null;

    const roster = (Array.isArray(r.r) ? r.r : [])
      .map(limpiaMiembro).filter(Boolean);
    // sin repetidos: la misma persona no está dos veces en una tripulación
    const vistos = {};
    const rr = roster.filter(m => vistos[m.n] ? false : (vistos[m.n] = true));

    const crudas = Array.isArray(r.g) ? r.g : [];
    const g = [];
    for (let i = 0; i < GUARDIAS; i++) {
      const out = guardiaVacia();
      if (Array.isArray(crudas[i])) {
        for (let j = 0; j < PUESTOS; j++) out[j] = limpiaPuesto(crudas[i][j]);
      }
      g.push(out);
    }

    // sus ataques contra ti, del más reciente al más viejo
    const a = (Array.isArray(r.a) ? r.a : []).map(at => {
      if (!at || !Array.isArray(at.p)) return null;
      const p = [0, 1, 2].map(i => limpiaPuesto(at.p[i]));
      return p.some(Boolean) ? { p: p, w: at.w ? 1 : 0 } : null;
    }).filter(Boolean).slice(0, 10);

    return {
      id: String(r.id || ('r' + Date.now() + Math.random().toString(36).slice(2, 7))),
      n:  String(r.n || '').slice(0, 40),
      r:  rr.slice(0, window.RULES.MAX_CREW),
      g:  g,
      a:  a
    };
  }

  function cargar(){
    try {
      const guardado = JSON.parse(localStorage.getItem(KEY) || '[]');
      lista = Array.isArray(guardado) ? guardado.map(limpiaRival).filter(Boolean) : [];
    } catch(e){
      lista = [];
    }
    return lista;
  }

  function guardar(){
    try { localStorage.setItem(KEY, JSON.stringify(lista)); }
    catch(e){ /* si el navegador lo bloquea, dura lo que dure la sesión */ }
  }

  const porId = id => lista.find(r => r.id === id) || null;

  /* Cuántas guardias reparte el juego a esa tripulación. Con dos
     personajes solo salen dos; con uno o con tres o más, tres. */
  function nGuardias(r){
    return (r && r.r.length === 2) ? 2 : GUARDIAS;
  }

  /* Devuelve el id del rival nuevo, o null si el nombre está vacío o
     repetido: dos rivales con el mismo nombre solo confunden. */
  function añadir(nombre){
    const n = String(nombre || '').trim().slice(0, 40);
    if (!n) return null;
    if (lista.some(r => r.n.toLowerCase() === n.toLowerCase())) return null;
    const r = {
      id: 'r' + Date.now() + Math.random().toString(36).slice(2, 7),
      n: n, r: [], a: [],
      g: [guardiaVacia(), guardiaVacia(), guardiaVacia()]
    };
    lista.push(r);
    guardar();
    return r.id;
  }

  function borrar(id){
    lista = lista.filter(r => r.id !== id);
    guardar();
  }

  function renombrar(id, nombre){
    const r = porId(id);
    if (!r) return;
    r.n = String(nombre || '').trim().slice(0, 40);
    guardar();
  }

  /* ---------- su tripulación ---------- */

  function addMiembro(id, nombre){
    const r = porId(id);
    if (!r) return 'noExiste';
    if (!window.CHARACTERS.some(c => c.n === nombre)) return 'noExiste';
    if (r.r.some(m => m.n === nombre)) return 'repetido';
    if (r.r.length >= window.RULES.MAX_CREW) return 'llena';
    r.r.push({ n: nombre, e: 'ok' });
    guardar();
    return 'ok';
  }

  function delMiembro(id, nombre){
    const r = porId(id);
    if (!r) return;
    r.r = r.r.filter(m => m.n !== nombre);
    guardar();
  }

  function setEstado(id, nombre, estado){
    const r = porId(id);
    if (!r) return;
    const m = r.r.find(x => x.n === nombre);
    if (m && ESTADOS.indexOf(estado) !== -1) { m.e = estado; guardar(); }
  }

  /* ---------- sus guardias ---------- */

  /* Pone un puesto. Con nombre vacío se borra y vuelve a "sin averiguar". */
  function setPuesto(id, gi, pos, nombre, tactica){
    const r = porId(id);
    if (!r || !r.g[gi] || pos < 0 || pos >= PUESTOS) return;
    const n = String(nombre || '').trim();
    r.g[gi][pos] = n ? limpiaPuesto({ n: n, t: tactica }) : null;
    guardar();
  }

  function vaciarGuardia(id, gi){
    const r = porId(id);
    if (!r || !r.g[gi]) return;
    r.g[gi] = guardiaVacia();
    guardar();
  }

  /* ---------- sus ataques contra ti ----------
     Para qué sirve: la gente repite. Si un ataque le funcionó, lo vuelve a
     mandar; y si le falló, muchas veces lo intenta otra vez antes de
     cambiar. Apuntar el último te deja predecir el siguiente mejor que
     cualquier media. */

  const MAX_ATAQUES = 10;

  function addAtaque(id, puestos, gano){
    const r = porId(id);
    if (!r) return 'noExiste';
    const p = [0, 1, 2].map(i => limpiaPuesto(puestos && puestos[i]));
    if (!p.some(Boolean)) return 'vacio';
    r.a.unshift({ p: p, w: gano ? 1 : 0 });   // el más reciente, delante
    r.a = r.a.slice(0, MAX_ATAQUES);
    guardar();
    return 'ok';
  }

  function delAtaque(id, idx){
    const r = porId(id);
    if (!r || !r.a[idx]) return;
    r.a.splice(idx, 1);
    guardar();
  }

  const ultimoAtaque = r => (r && r.a && r.a.length) ? r.a[0] : null;

  /* ---------- compartir la libreta ----------
     Un código de texto que se pega en el chat. Se usan los números de
     ficha del álbum (1-226) en vez de los nombres: ocupa mucho menos y no
     se rompe al cambiar de idioma. */

  const CABECERA = 'OPMR1:';

  function b64(txt){
    const bytes = new TextEncoder().encode(txt);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function deB64(txt){
    let t = txt.replace(/-/g, '+').replace(/_/g, '/');
    while (t.length % 4) t += '=';
    const bin = atob(t);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  const album = n => {
    const c = window.CHARACTERS.find(x => x.n === n);
    return c ? c.a : 0;
  };
  const porAlbum = a => window.CHARACTERS.find(x => x.a === a);

  //  0 = sin averiguar   -1 = puesto vacío   [ficha, táctica]
  function codPuesto(p){
    if (!p) return 0;
    if (p.n === VACIO) return -1;
    const a = album(p.n);
    return a ? [a, window.RULES.TACTICS.indexOf(p.t)] : 0;
  }

  function dePuesto(c){
    if (c === -1) return { n: VACIO, t: window.RULES.TACTICS[0] };
    if (!Array.isArray(c)) return null;
    const p = porAlbum(c[0]);
    const t = window.RULES.TACTICS[c[1]];
    return (p && t) ? { n: p.n, t: t } : null;
  }

  function exportar(ids){
    const cuales = (ids && ids.length)
      ? lista.filter(r => ids.indexOf(r.id) !== -1)
      : lista;
    if (!cuales.length) return '';

    const datos = cuales.map(r => [
      r.n,
      r.r.map(m => [album(m.n), ESTADOS.indexOf(m.e)]).filter(x => x[0]),
      r.g.map(g => g.map(codPuesto)),
      r.a.map(at => [at.p.map(codPuesto), at.w])
    ]);
    return CABECERA + b64(JSON.stringify(datos));
  }

  /* Devuelve {nuevos, actualizados} o null si el código no vale. Un rival
     con el mismo nombre se sustituye: al compartir, lo último que alguien
     averiguó es lo bueno. */
  function importar(codigo){
    const txt = String(codigo || '').trim();
    if (txt.indexOf(CABECERA) !== 0) return null;

    let datos;
    try { datos = JSON.parse(deB64(txt.slice(CABECERA.length))); }
    catch(e){ return null; }
    if (!Array.isArray(datos)) return null;

    let nuevos = 0, actualizados = 0;

    datos.forEach(d => {
      if (!Array.isArray(d)) return;
      const nombre = String(d[0] || '').trim().slice(0, 40);
      if (!nombre) return;

      const crudo = {
        n: nombre,
        r: (Array.isArray(d[1]) ? d[1] : []).map(m => {
          const c = porAlbum(m[0]);
          return c ? { n: c.n, e: ESTADOS[m[1]] || 'ok' } : null;
        }).filter(Boolean),
        g: (Array.isArray(d[2]) ? d[2] : []).map(g =>
          (Array.isArray(g) ? g : []).map(dePuesto)),
        a: (Array.isArray(d[3]) ? d[3] : []).map(at => ({
          p: (Array.isArray(at[0]) ? at[0] : []).map(dePuesto),
          w: at[1] ? 1 : 0
        }))
      };

      const ya = lista.find(r => r.n.toLowerCase() === nombre.toLowerCase());
      if (ya) {
        crudo.id = ya.id;
        const limpio = limpiaRival(crudo);
        Object.assign(ya, limpio);
        actualizados++;
      } else {
        const limpio = limpiaRival(crudo);
        lista.push(limpio);
        nuevos++;
      }
    });

    guardar();
    return { nuevos: nuevos, actualizados: actualizados };
  }

  cargar();

  return {
    GUARDIAS: GUARDIAS,
    PUESTOS:  PUESTOS,
    VACIO:    VACIO,
    ESTADOS:  ESTADOS,
    CAIDO:    CAIDO,
    lista:     () => lista.slice(),
    porId:     porId,
    nGuardias: nGuardias,
    añadir:    añadir,
    borrar:    borrar,
    renombrar: renombrar,
    addMiembro: addMiembro,
    delMiembro: delMiembro,
    setEstado:  setEstado,
    setPuesto:  setPuesto,
    vaciarGuardia: vaciarGuardia,
    addAtaque:  addAtaque,
    delAtaque:  delAtaque,
    ultimoAtaque: ultimoAtaque,
    exportar:   exportar,
    importar:   importar,
    recargar:  cargar
  };
})();
