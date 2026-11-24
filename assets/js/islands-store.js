/* ============================================================
   OP-MAPS DATA — mis correcciones de islas
   ------------------------------------------------------------
   El mapa que trae `islands.js` lo lleva el autor a mano, así que
   siempre va un paso por detrás del juego. Esto deja corregirlo sin
   tocar el archivo: escribes los tres enemigos de una isla y se
   quedan guardados.

   SOLO EN TU NAVEGADOR. Vive en localStorage, igual que la
   tripulación. Si abres la página en otro equipo, ahí no están.

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

  /* Una corrección guardada es { e: [tres nombres] }. Se leen también
     las formas de antes: la lista a secas (las primeras versiones) y
     { e, xy } (cuando se guardaban coordenadas para el tiempo de viaje,
     que se quitó en la 1.13.0: las coordenadas se ignoran y desaparecen
     al volver a guardar). Nadie pierde sus correcciones por esto. */
  function subeFormato(v){
    if (Array.isArray(v)) return valida(v);
    if (v && typeof v === 'object') return valida(v.e);
    return null;
  }

  function aplicar(){
    window.ISLANDS.forEach(isla => {
      if (!(isla.n in original)) original[isla.n] = isla.e.slice();
      const mio = mios[isla.n];
      isla.e = mio ? mio.e.slice() : original[isla.n].slice();
    });
  }

  function cargar(){
    const crudo = leer();
    mios = {};
    Object.keys(crudo).forEach(nombre => {
      // Islas que ya no existen en el archivo: fuera, no sirven de nada.
      if (!islaPorNombre(nombre)) return;
      const e = subeFormato(crudo[nombre]);
      if (e) mios[nombre] = { e: e };
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
    const base = original[nombre] || [];
    const igual = e.join('\u0000') === base.join('\u0000');
    if (igual) delete mios[nombre]; else mios[nombre] = { e: e };
    escribir();
    aplicar();
    return igual ? 'igual' : 'ok';
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
    delArchivo: nombre => ({ e: (original[nombre] || []).slice() })
  };
})();

window.ISLAS_EDIT.cargar();
