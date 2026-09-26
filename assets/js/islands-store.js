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

  /* Una corrección guardada es ahora un objeto:

       { e: [tres nombres] | null, xy: [x, y] | null }

     `null` en un campo significa «esta parte no la he tocado», y entonces
     manda el archivo. Antes era solo la lista de enemigos, a secas, así
     que lo que ya esté guardado con la forma vieja se sube de formato al
     leerlo: nadie pierde sus correcciones por esto. */
  function subeFormato(v){
    if (Array.isArray(v)) return { e: valida(v), xy: null };
    if (!v || typeof v !== 'object') return null;
    return { e: valida(v.e), xy: validaXY(v.xy) };
  }

  /* Dos números y nada más. Sin esto una coordenada a medias dejaría el
     viaje calculando con basura, que es peor que no calcular. */
  function validaXY(xy){
    if (!Array.isArray(xy) || xy.length !== 2) return null;
    /* Ojo con la cadena vacia: Number('') es 0, no NaN. Sin esta
       comprobacion, media coordenada se guardaba como [960, 0] y la
       isla acababa en el origen del mapa con un viaje absurdo. */
    if (String(xy[0]).trim() === '' || String(xy[1]).trim() === '') return null;
    const x = Number(xy[0]), y = Number(xy[1]);
    return (isFinite(x) && isFinite(y)) ? [x, y] : null;
  }

  function aplicar(){
    window.ISLANDS.forEach(isla => {
      if (!(isla.n in original)) {
        original[isla.n] = { e: isla.e.slice(), xy: isla.xy ? isla.xy.slice() : null };
      }
      const mio = mios[isla.n];
      const base = original[isla.n];
      isla.e = (mio && mio.e) ? mio.e.slice() : base.e.slice();
      const xy = (mio && mio.xy) ? mio.xy : base.xy;
      if (xy) isla.xy = xy.slice(); else delete isla.xy;
    });
  }

  function cargar(){
    const crudo = leer();
    mios = {};
    Object.keys(crudo).forEach(nombre => {
      // Islas que ya no existen en el archivo: fuera, no sirven de nada.
      if (!islaPorNombre(nombre)) return;
      const v = subeFormato(crudo[nombre]);
      if (v && (v.e || v.xy)) mios[nombre] = v;
    });
    aplicar();
    return mios;
  }

  const mioDe = n => mios[n] || { e: null, xy: null };

  /* Guarda los tres enemigos de una isla. Devuelve 'ok', 'noExiste'
     (la isla), 'malos' (algún nombre no está en el álbum o no son ni
     0 ni 3) o 'igual' (coincide con el archivo, así que se borra esa
     parte de la corrección en vez de guardarla). */
  function guardar(nombre, enemigos){
    if (!islaPorNombre(nombre)) return 'noExiste';
    const e = valida(enemigos);
    if (!e) return 'malos';
    const mio = mioDe(nombre);
    const base = original[nombre] || { e: [], xy: null };
    const igual = e.join('\u0000') === (base.e || []).join('\u0000');
    mios[nombre] = { e: igual ? null : e, xy: mio.xy };
    if (!mios[nombre].e && !mios[nombre].xy) delete mios[nombre];
    escribir();
    aplicar();
    return igual ? 'igual' : 'ok';
  }

  /* Y sus coordenadas. El export del juego solo trae las de algunas
     islas, así que el resto se rellenan a mano aquí y con eso el PvE ya
     puede calcular el viaje. Con los dos campos vacíos se quita la
     corrección y vuelve lo del archivo, si lo había. */
  function guardarXY(nombre, x, y){
    if (!islaPorNombre(nombre)) return 'noExiste';
    const mio = mioDe(nombre);
    const vacio = String(x).trim() === '' && String(y).trim() === '';
    const xy = vacio ? null : validaXY([x, y]);
    if (!vacio && !xy) return 'malos';

    const base = original[nombre] || { e: [], xy: null };
    const igual = xy && base.xy && xy[0] === base.xy[0] && xy[1] === base.xy[1];
    mios[nombre] = { e: mio.e, xy: igual ? null : xy };
    if (!mios[nombre].e && !mios[nombre].xy) delete mios[nombre];
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
    guardarXY: guardarXY,
    deshacer: deshacer,
    limpiar:  limpiar,
    editada:  nombre => nombre in mios,
    cuantas:  () => Object.keys(mios).length,
    nombres:  () => Object.keys(mios).slice().sort(),
    delArchivo: nombre => {
      const b = original[nombre] || { e: [], xy: null };
      return { e: b.e.slice(), xy: b.xy ? b.xy.slice() : null };
    }
  };
})();

window.ISLAS_EDIT.cargar();
