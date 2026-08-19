/* ============================================================
   OP-MAPS DATA — los rivales que vas descubriendo
   ------------------------------------------------------------
   Cada rival guarda hasta 3 guardias, y cada guardia son 3 puestos
   con personaje y táctica. Vive en el navegador (localStorage), así
   que es tuyo: no se comparte ni se sube a ningún sitio.

   Un puesto puede estar en tres estados:
     null            no lo has apuntado todavía
     {n:'-', t:...}  el rival lo tiene vacío, así que concede
     {n:'Zoro', t:'Assault'}
   ============================================================ */
window.RIVALES = (function () {

  const KEY     = 'opmaps-rivales';
  const GUARDIAS = 3;   // el juego no reparte más de tres
  const PUESTOS  = 3;
  const VACIO    = '-'; // el rival deja ese puesto sin cubrir

  let lista = [];

  const existe = n => n === VACIO || window.CHARACTERS.some(c => c.n === n);

  const guardiaVacia = () => [null, null, null];

  function limpiaPuesto(p){
    if (!p || typeof p !== 'object') return null;
    if (!existe(p.n)) return null;
    if (window.RULES.TACTICS.indexOf(p.t) === -1) return null;
    return { n: p.n, t: p.t };
  }

  /* Todo lo que sale de localStorage se revisa: si el juego renombra a
     alguien o alguien toca el guardado a mano, no debe romper la página. */
  function limpiaRival(r){
    if (!r || typeof r !== 'object') return null;
    const crudas = Array.isArray(r.g) ? r.g.slice(0, GUARDIAS) : [];
    const g = crudas.map(gu => {
      const out = guardiaVacia();
      if (Array.isArray(gu)) for (let i = 0; i < PUESTOS; i++) out[i] = limpiaPuesto(gu[i]);
      return out;
    });
    return {
      id: String(r.id || ('r' + Date.now() + Math.random().toString(36).slice(2, 7))),
      n:  String(r.n || '').slice(0, 40),
      g:  g.length ? g : [guardiaVacia()]
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

  /* Devuelve el id del rival nuevo, o null si el nombre está vacío o
     repetido: dos rivales con el mismo nombre solo confunden. */
  function añadir(nombre){
    const n = String(nombre || '').trim().slice(0, 40);
    if (!n) return null;
    if (lista.some(r => r.n.toLowerCase() === n.toLowerCase())) return null;
    const r = { id: 'r' + Date.now() + Math.random().toString(36).slice(2, 7),
                n: n, g: [guardiaVacia()] };
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

  function addGuardia(id){
    const r = porId(id);
    if (!r || r.g.length >= GUARDIAS) return;
    r.g.push(guardiaVacia());
    guardar();
  }

  function delGuardia(id, gi){
    const r = porId(id);
    if (!r || r.g.length <= 1) return;   // siempre queda al menos una
    r.g.splice(gi, 1);
    guardar();
  }

  /* Pone un puesto. Con nombre vacío se borra (vuelve a "sin apuntar"). */
  function setPuesto(id, gi, pos, nombre, tactica){
    const r = porId(id);
    if (!r || !r.g[gi] || pos < 0 || pos >= PUESTOS) return;
    const n = String(nombre || '').trim();
    r.g[gi][pos] = n ? limpiaPuesto({ n: n, t: tactica }) : null;
    guardar();
  }

  cargar();

  return {
    GUARDIAS: GUARDIAS,
    PUESTOS:  PUESTOS,
    VACIO:    VACIO,
    lista:    () => lista.slice(),
    porId:    porId,
    añadir:   añadir,
    borrar:   borrar,
    renombrar: renombrar,
    addGuardia: addGuardia,
    delGuardia: delGuardia,
    setPuesto: setPuesto,
    recargar: cargar
  };
})();
