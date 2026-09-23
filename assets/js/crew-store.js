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
    // si se va quien llevaba un arma, el arma se va con él
    Object.keys(armas).forEach(a => { if (armas[a] === nombre) delete armas[a]; });
    guardarArmas();
    guardar();
  }

  function vaciar(){
    lista = [];
    armas = {};
    guardarArmas();
    guardar();
  }

  /* ---------- las armas ----------
     Quién lleva cada arma, por nombre: { Yoru: 'Dracule Mihawk' }. Una
     sola por arma, que es la regla del juego —un arma se equipa a un
     tripulante y a nadie más—, y por eso es un valor y no una lista:
     ponérsela a otro se la quita al anterior sin que haya que pensarlo.

     Va en su propia clave y no dentro de `opmaps-crew`, que es un array
     de nombres desde el primer día y no hay por qué romperlo. */
  const KEY_ARMAS = 'opmaps-armas';

  let armas = {};

  function cargarArmas(){
    try {
      const g = JSON.parse(localStorage.getItem(KEY_ARMAS) || '{}');
      armas = (g && typeof g === 'object' && !Array.isArray(g)) ? g : {};
    } catch(e){ armas = {}; }
    /* Se tira lo que ya no valga: un arma que no existe, alguien que no
       está en la tripulación, o alguien que no puede llevarla porque no
       es de su rol. Si no, un cambio de tripulación dejaría un arma
       colgada sumando puntos a quien no está. */
    Object.keys(armas).forEach(nombre => {
      const quien = String(armas[nombre] || '');
      const c = window.CHARACTERS.find(x => x.n === quien);
      if (!window.RULES.ARMAS[nombre] || lista.indexOf(quien) === -1
          || !window.RULES.puedeArma(c, nombre)) delete armas[nombre];
    });
    return armas;
  }

  function guardarArmas(){
    try { localStorage.setItem(KEY_ARMAS, JSON.stringify(armas)); }
    catch(e){ /* si el navegador lo bloquea, dura la sesión */ }
  }

  /* Devuelve 'ok', 'noExiste' (el arma), 'fuera' (no está en tu
     tripulación) o 'rolMalo' (Yoru es de espadachines). Con `quien`
     vacío se desequipa. */
  function setArma(nombre, quien){
    if (!window.RULES.ARMAS[nombre]) return 'noExiste';
    const n = String(quien || '').trim();
    if (!n) { delete armas[nombre]; guardarArmas(); return 'ok'; }
    if (lista.indexOf(n) === -1) return 'fuera';
    const c = window.CHARACTERS.find(x => x.n === n);
    if (!window.RULES.puedeArma(c, nombre)) return 'rolMalo';
    armas[nombre] = n;
    guardarArmas();
    return 'ok';
  }

  // Quién lleva esa arma, o ''.
  const portador = nombre => armas[nombre] || '';

  // Qué arma lleva ese tripulante, o ''. Como es una por arma y una por
  // persona, con encontrar la primera basta.
  function armaDe(quien){
    const k = Object.keys(armas).filter(a => armas[a] === quien)[0];
    return k || '';
  }

  /* Los personajes completos, en el orden en que se añadieron, y CON su
     arma puesta. Aquí es donde entra el arma en todo lo demás: el PvE,
     el plan de ataque, tus guardias y la simulación piden la tripulación
     por aquí, así que ninguno tiene que saber que las armas existen. */
  function personajes(){
    return lista.map(n => {
      const c = window.CHARACTERS.find(x => x.n === n);
      if (!c) return c;
      const a = armaDe(n);
      return a ? window.RULES.conArma(c, a) : c;
    });
  }

  cargar();
  cargarArmas();

  return {
    MAX: MAX,
    TOPE: TOPE,
    nombres: () => lista.slice(),
    personajes: personajes,
    setArma:  setArma,
    portador: portador,
    armaDe:   armaDe,
    armas:    () => JSON.parse(JSON.stringify(armas)),
    añadir: añadir,
    quitar: quitar,
    vaciar: vaciar,
    recargar: () => { const l = cargar(); cargarArmas(); return l; }
  };
})();
