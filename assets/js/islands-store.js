/* ============================================================
   OP-MAPS DATA — mis correcciones de islas
   ------------------------------------------------------------
   El mapa que trae `islands.js` lo lleva el autor a mano, así que
   siempre va un paso por detrás del juego. Esto deja corregirlo sin
   tocar el archivo: escribes los tres enemigos de una isla y se
   quedan guardados.

   SOLO EN TU NAVEGADOR. Vive en localStorage, igual que la
   tripulación, y no lo toca la alianza: lo que se sincroniza con los
   compañeros son los rivales, nada más. Si abres la página en otro
   equipo, ahí no están.

   Se guarda por NOMBRE de isla, no por posición, para que siga
   valiendo cuando el archivo se regenere y las islas cambien de sitio.
   Y solo se guardan las que hayas tocado: el resto sale del archivo.

     { "Ohara": ["Ideo", "Yamato", "Caesar Clown"], ... }

   Una isla con los tres campos vacíos se guarda como `[]`, que es la
   forma de volver a marcarla como PENDIENTE aunque el archivo traiga
   enemigos.
   ============================================================ */
window.ISLAS_EDIT = (function () {

  const KEY = 'opmaps-islas';

  let mios = {};        // lo que ha escrito el usuario
  let original = {};    // lo que traía el archivo, para poder deshacer

  const existePj = n => window.CHARACTERS.some(c => c.n === n);

  /* Una corrección válida es una lista de 0 o 3 nombres que estén en el
     álbum. Cualquier otra cosa se tira: más vale enseñar el archivo que
     enseñar algo a medias. */
  function valida(e){
    if (!Array.isArray(e)) return null;
    const limpio = e.map(n => String(n || '').trim()).filter(n => n.length);
    if (limpio.length === 0) return [];
    if (limpio.length !== 3) return null;
    return limpio.every(existePj) ? limpio : null;
  }

  function leer(){
    try {
      const g = JSON.parse(localStorage.getItem(KEY) || '{}');
      return (g && typeof g === 'object' && !Array.isArray(g)) ? g : {};
    } catch(e){ return {}; }
  }

  function escribir(){
    try { localStorage.setItem(KEY, JSON.stringify(mios)); }
    catch(e){ /* si el navegador no deja guardar, dura la sesión */ }
  }

  function islaPorNombre(n){
    return window.ISLANDS.filter(i => i.n === n)[0] || null;
  }

  /* Vuelca `mios` sobre `window.ISLANDS`. Lo llama `cargar()` al
     arrancar y cada vez que se guarda o se deshace algo, así que el
     resto de la página no se entera de que esto existe: lee
     `window.ISLANDS` como siempre. */
  function aplicar(){
    window.ISLANDS.forEach(isla => {
      if (!(isla.n in original)) original[isla.n] = isla.e.slice();
      isla.e = (isla.n in mios) ? mios[isla.n].slice() : original[isla.n].slice();
    });
  }

  function cargar(){
    const crudo = leer();
    mios = {};
    Object.keys(crudo).forEach(nombre => {
      // Islas que ya no existen en el archivo: fuera, no sirven de nada.
      if (!islaPorNombre(nombre)) return;
      const e = valida(crudo[nombre]);
      if (e) mios[nombre] = e;
    });
    aplicar();
    return mios;
  }

  /* Guarda los tres enemigos de una isla. Devuelve 'ok', 'noExiste'
     (la isla), 'malos' (algún nombre no está en el álbum o no son ni
     0 ni 3) o 'igual' (coincide con el archivo, así que se borra la
     corrección en vez de guardarla). */
  function guardar(nombre, enemigos){
    if (!islaPorNombre(nombre)) return 'noExiste';
    const e = valida(enemigos);
    if (!e) return 'malos';
    if (e.join('\u0000') === (original[nombre] || []).join('\u0000')) {
      delete mios[nombre];
      escribir();
      aplicar();
      return 'igual';
    }
    mios[nombre] = e;
    escribir();
    aplicar();
    return 'ok';
  }

  /* Deshace una isla: vuelve a lo que trae el archivo. */
  function deshacer(nombre){
    delete mios[nombre];
    escribir();
    aplicar();
  }

  function limpiar(){
    mios = {};
    escribir();
    aplicar();
  }

  return {
    cargar:   cargar,
    guardar:  guardar,
    deshacer: deshacer,
    limpiar:  limpiar,
    editada:  nombre => nombre in mios,
    cuantas:  () => Object.keys(mios).length,
    nombres:  () => Object.keys(mios).slice().sort(),
    delArchivo: nombre => (original[nombre] || []).slice()
  };
})();

window.ISLAS_EDIT.cargar();
