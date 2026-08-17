/* ============================================================
   OP-MAPS DATA — la tripulación guardada
   ------------------------------------------------------------
   Vive en el navegador de cada uno (localStorage), así que no se
   comparte ni se sube a ningún sitio. Se guardan los nombres en
   inglés, que son los que no cambian al cambiar de idioma.

   Lo usan Mi tripulación y, más adelante, el simulador PvP.
   ============================================================ */
window.CREW = (function () {

  const KEY = 'opmaps-crew';
  const MAX  = 11;             // el tope de tripulantes del juego
  const TOPE = MAX + 1;        // se deja meter uno de más para poder comparar
                               // a quién conviene dejar fuera

  let lista = [];

  function existe(nombre){
    return window.CHARACTERS.some(c => c.n === nombre);
  }

  function cargar(){
    try {
      const guardado = JSON.parse(localStorage.getItem(KEY) || '[]');
      // Solo se aceptan nombres que sigan estando en la base, por si
      // el juego renombra a alguien.
      lista = Array.isArray(guardado) ? guardado.filter(existe).slice(0, TOPE) : [];
    } catch(e){
      lista = [];
    }
    return lista;
  }

  function guardar(){
    try { localStorage.setItem(KEY, JSON.stringify(lista)); }
    catch(e){ /* si el navegador bloquea el guardado, dura la sesión */ }
  }

  /* Devuelve 'ok', 'llena', 'repetido' o 'noExiste', para que la página
     pueda decir qué ha pasado. */
  function añadir(nombre){
    if (!existe(nombre)) return 'noExiste';
    if (lista.indexOf(nombre) !== -1) return 'repetido';
    if (lista.length >= TOPE) return 'llena';
    lista.push(nombre);
    guardar();
    return 'ok';
  }

  function quitar(nombre){
    lista = lista.filter(n => n !== nombre);
    guardar();
  }

  function vaciar(){
    lista = [];
    guardar();
  }

  // Los personajes completos, en el orden en que se añadieron.
  function personajes(){
    return lista.map(n => window.CHARACTERS.find(c => c.n === n));
  }

  cargar();

  return {
    MAX: MAX,
    TOPE: TOPE,
    nombres: () => lista.slice(),
    personajes: personajes,
    añadir: añadir,
    quitar: quitar,
    vaciar: vaciar,
    recargar: cargar
  };
})();
