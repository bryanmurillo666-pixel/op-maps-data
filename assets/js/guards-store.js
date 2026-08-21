/* ============================================================
   OP-MAPS DATA — tus tres guardias
   ------------------------------------------------------------
   Las guardias que tienes puestas AHORA MISMO en el juego. Se
   apuntan en Mi tripulación y el PvP las usa para decirte cuánto
   aguantan contra cada rival, y cuánto ganarías cambiándolas por
   las que te recomienda.

   Cuántas reparte el juego depende del tamaño de tu tripulación:
   con dos personajes son dos guardias, y con uno o con tres o más,
   tres. Igual que para los rivales.

   Vive en el navegador (localStorage). Cada puesto es:
     null              sin poner
     {n:'Zoro', t:'Assault'}
   ============================================================ */
window.MIS_GUARDIAS = (function () {

  const KEY      = 'opmaps-mis-guardias';
  const GUARDIAS = 3;
  const PUESTOS  = 3;

  let lista = [];

  const guardiaVacia = () => [null, null, null];

  function limpiaPuesto(p){
    if (!p || typeof p !== 'object') return null;
    if (!window.CHARACTERS.some(c => c.n === p.n)) return null;
    if (window.RULES.TACTICS.indexOf(p.t) === -1) return null;
    return { n: p.n, t: p.t };
  }

  function cargar(){
    lista = [];
    let crudo = [];
    try { crudo = JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e){ crudo = []; }
    for (let i = 0; i < GUARDIAS; i++) {
      const g = guardiaVacia();
      if (Array.isArray(crudo) && Array.isArray(crudo[i])) {
        for (let j = 0; j < PUESTOS; j++) g[j] = limpiaPuesto(crudo[i][j]);
      }
      lista.push(g);
    }
    return lista;
  }

  function guardar(){
    try { localStorage.setItem(KEY, JSON.stringify(lista)); }
    catch(e){ /* si el navegador lo bloquea, dura lo que dure la sesión */ }
  }

  /* Cuántas guardias te reparte el juego, según tu tripulación. */
  function nGuardias(){
    const n = window.CREW ? window.CREW.nombres().length : 0;
    return n === 2 ? 2 : GUARDIAS;
  }

  function setPuesto(gi, pos, nombre, tactica){
    if (!lista[gi] || pos < 0 || pos >= PUESTOS) return;
    const n = String(nombre || '').trim();
    lista[gi][pos] = n ? limpiaPuesto({ n: n, t: tactica }) : null;
    guardar();
  }

  function vaciar(gi){
    if (!lista[gi]) return;
    lista[gi] = guardiaVacia();
    guardar();
  }

  /* Cuántas tienes completas de las que te tocan. */
  function hechas(){
    return lista.slice(0, nGuardias()).filter(g => g.every(p => p)).length;
  }

  /* ¿Cumple la regla del juego? Dentro de una guardia, tres distintos;
     y quien repita entre guardias tiene que cambiar de fila. Devuelve la
     lista de problemas, vacía si está todo bien. */
  function problemas(){
    const out = [];
    const g = lista.slice(0, nGuardias());

    g.forEach((gu, i) => {
      const puestos = gu.filter(Boolean).map(p => p.n);
      const unicos = puestos.filter((n, k) => puestos.indexOf(n) === k);
      if (unicos.length !== puestos.length) out.push({ tipo: 'repe', g: i });
    });

    for (let a = 0; a < g.length; a++)
      for (let b = a + 1; b < g.length; b++)
        for (let i = 0; i < PUESTOS; i++)
          if (g[a][i] && g[b][i] && g[a][i].n === g[b][i].n) {
            out.push({ tipo: 'fila', g: b, pos: i, quien: g[a][i].n });
          }

    return out;
  }

  cargar();

  return {
    GUARDIAS:  GUARDIAS,
    PUESTOS:   PUESTOS,
    todas:     () => lista.map(g => g.slice()),
    nGuardias: nGuardias,
    setPuesto: setPuesto,
    vaciar:    vaciar,
    hechas:    hechas,
    problemas: problemas,
    recargar:  cargar
  };
})();
