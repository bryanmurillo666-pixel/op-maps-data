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

    return {
      id: String(r.id || ('r' + Date.now() + Math.random().toString(36).slice(2, 7))),
      n:  String(r.n || '').slice(0, 40),
      r:  rr.slice(0, window.RULES.MAX_CREW),
      g:  g
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
      n: n, r: [],
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
    recargar:  cargar
  };
})();
