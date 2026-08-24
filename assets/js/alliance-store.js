/* ============================================================
   OP-MAPS DATA — la alianza
   ------------------------------------------------------------
   Hasta 10 personas que comparten lo que van averiguando de sus
   rivales. La idea clave, y lo que hace que esto sea sencillo:

     CADA UNO ESCRIBE SOLO EN SU PROPIO HUECO.

     alianzas/{codigo}/miembros/{miId}   <- aquí escribo yo, y solo yo
     alianzas/{codigo}/miembros/{otro}   <- de aquí solo leo

   Como nadie escribe donde escribe otro, no hay conflictos que
   resolver: ni bloqueos, ni transacciones, ni "quién llegó antes".
   "Actualizar rivales" son tres pasos: subo la mía, me bajo las de
   todos, y las junto aquí en mi navegador.

   Al juntar NO se sustituye un rival por el más reciente: se
   complementa puesto a puesto (eso lo hace RIVALES.importar). Si yo sé
   su guardia 1 y un compañero sabe la 2, nos quedamos con las dos. La
   fecha solo decide cuando dos versiones se contradicen en el mismo
   dato.

   El código de la alianza es la única llave: no hay cuentas ni
   contraseñas. Quien lo tenga, entra. Por eso son 10 caracteres al
   azar, y las reglas del servidor no dejan listar qué alianzas
   existen: solo leer una si ya sabes su código.
   ============================================================ */
window.ALIANZA = (function () {

  const DB   = 'https://op-maps-data-default-rtdb.firebaseio.com';
  const KEY  = 'opmaps-alianza';

  const MAX_MIEMBROS = 10;
  const LARGO        = 10;
  /* Sin O/0 ni I/1/L: el código se dicta y se copia a mano. */
  const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  const vacio = () => ({ codigo: '', miId: '', miNombre: '', visto: 0, miembros: [] });

  let est = vacio();

  /* ---------- lo que se recuerda en este navegador ---------- */

  function cargar(){
    try {
      const g = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (g && typeof g === 'object') {
        est = {
          codigo:   String(g.codigo   || '').toUpperCase().slice(0, 24),
          miId:     String(g.miId     || '').slice(0, 24),
          miNombre: String(g.miNombre || '').slice(0, 24),
          visto:    Number(g.visto) || 0,
          miembros: Array.isArray(g.miembros) ? g.miembros : []
        };
      }
    } catch(e){ est = vacio(); }
    return est;
  }

  function guardar(){
    try { localStorage.setItem(KEY, JSON.stringify(est)); }
    catch(e){ /* si el navegador lo bloquea, dura lo que dure la sesión */ }
  }

  /* ---------- al azar de verdad ---------- */

  function sorteo(n, alfabeto){
    const bytes = new Uint8Array(n);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
    let out = '';
    for (let i = 0; i < n; i++) out += alfabeto[bytes[i] % alfabeto.length];
    return out;
  }

  const nuevoCodigo = () => sorteo(LARGO, ALFABETO);
  const nuevoId     = () => 'm' + sorteo(12, 'abcdefghijkmnpqrstuvwxyz23456789');

  /* Se acepta escrito de cualquier manera: minúsculas, con espacios o
     con guiones de por medio. */
  function normaliza(c){
    return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
  }

  /* ---------- hablar con el servidor ---------- */

  function pedir(metodo, camino, cuerpo){
    const opciones = { method: metodo, cache: 'no-store' };
    if (cuerpo !== undefined) {
      opciones.headers = { 'Content-Type': 'application/json' };
      opciones.body = JSON.stringify(cuerpo);
    }
    return fetch(DB + camino, opciones).then(res => {
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'permiso' };
      if (!res.ok) return { ok: false, error: 'servidor' };
      return res.json().then(
        d => ({ ok: true, data: d }),
        () => ({ ok: true, data: null })
      );
    }).catch(() => ({ ok: false, error: 'red' }));
  }

  const ruta = (codigo, resto) => '/alianzas/' + encodeURIComponent(codigo) + resto;

  /* ---------- entrar y salir ---------- */

  const dentro = () => !!(est.codigo && est.miId);

  function estado(){
    return {
      codigo:   est.codigo,
      miId:     est.miId,
      miNombre: est.miNombre,
      visto:    est.visto,
      miembros: est.miembros.slice(),
      dentro:   dentro()
    };
  }

  function apodo(nombre){
    const n = String(nombre || '').trim().slice(0, 24);
    if (!n) return false;
    est.miNombre = n;
    guardar();
    return true;
  }

  /* Crear no toca el servidor: la alianza nace en el primer
     "actualizar rivales", cuando se escribe el primer hueco. */
  function crear(nombre){
    const n = String(nombre || '').trim().slice(0, 24);
    if (!n) return { ok: false, error: 'sinNombre' };
    est = vacio();
    est.codigo   = nuevoCodigo();
    est.miId     = nuevoId();
    est.miNombre = n;
    guardar();
    return { ok: true, codigo: est.codigo };
  }

  /* Unirse sí comprueba antes: que la alianza exista de verdad (así un
     código mal copiado no crea una alianza fantasma de uno) y que
     queden huecos. */
  function unir(codigo, nombre){
    const c = normaliza(codigo);
    const n = String(nombre || '').trim().slice(0, 24);
    if (!n) return Promise.resolve({ ok: false, error: 'sinNombre' });
    if (c.length < 8) return Promise.resolve({ ok: false, error: 'codigoCorto' });

    return pedir('GET', ruta(c, '.json')).then(r => {
      if (!r.ok) return { ok: false, error: r.error };
      const miembros = (r.data && r.data.miembros) || null;
      if (!miembros) return { ok: false, error: 'noExiste' };
      const cuantos = Object.keys(miembros).length;
      if (!cuantos) return { ok: false, error: 'noExiste' };
      if (cuantos >= MAX_MIEMBROS) return { ok: false, error: 'llena' };

      est = vacio();
      est.codigo   = c;
      est.miId     = nuevoId();
      est.miNombre = n;
      guardar();
      return { ok: true, codigo: c, miembros: cuantos };
    });
  }

  /* Salir borra tu hueco para no ocupar sitio. Aunque el borrado falle
     te sales igual: aquí mandas tú, no el servidor. */
  function salir(){
    if (!dentro()) return Promise.resolve({ ok: true });
    const camino = ruta(est.codigo, '/miembros/' + encodeURIComponent(est.miId) + '.json');
    return pedir('DELETE', camino).then(() => {
      est = vacio();
      guardar();
      return { ok: true };
    });
  }

  /* Quitar a alguien que ya no juega y está ocupando uno de los diez
     huecos. Sin cuentas no hay forma de que solo pueda hacerlo un jefe:
     esto va a confianza, como el propio código. */
  function quitar(id){
    if (!dentro() || !id || id === est.miId) return Promise.resolve({ ok: false, error: 'noVale' });
    const camino = ruta(est.codigo, '/miembros/' + encodeURIComponent(id) + '.json');
    return pedir('DELETE', camino).then(r => {
      if (!r.ok) return r;
      est.miembros = est.miembros.filter(m => m.id !== id);
      guardar();
      return { ok: true };
    });
  }

  /* ---------- actualizar rivales ----------
     1. subo mi libreta a mi hueco
     2. me bajo la alianza entera
     3. junto las de los demás con la mía, complementando
     4. si he aprendido algo, lo vuelvo a subir, para que lo que me ha
        contado uno le llegue también al resto sin tener que coincidir */

  function sincronizar(){
    if (!dentro()) return Promise.resolve({ ok: false, error: 'fuera' });

    const miCamino = ruta(est.codigo, '/miembros/' + encodeURIComponent(est.miId) + '.json');
    const mios     = window.RIVALES.lista();

    const subir = () => pedir('PUT', miCamino, {
      nombre:  est.miNombre || '?',
      ts:      Date.now(),
      n:       window.RIVALES.lista().length,
      rivales: window.RIVALES.exportar() || ''
    });

    return subir().then(p => {
      if (!p.ok) return { ok: false, error: p.error };

      return pedir('GET', ruta(est.codigo, '.json')).then(g => {
        if (!g.ok) return { ok: false, error: g.error };

        const miembros = (g.data && g.data.miembros) || {};
        let nuevos = 0, actualizados = 0;
        const filas = [];
        const deQuien = [];

        Object.keys(miembros).forEach(id => {
          const m = miembros[id] || {};
          const fila = {
            id:     id,
            nombre: String(m.nombre || '?').slice(0, 24),
            ts:     Number(m.ts) || 0,
            n:      Number(m.n) || 0,
            yo:     id === est.miId
          };
          filas.push(fila);
          if (fila.yo) return;

          const res = window.RIVALES.importar(m.rivales || '');
          if (res && (res.nuevos || res.actualizados)) {
            nuevos       += res.nuevos;
            actualizados += res.actualizados;
            deQuien.push({ nombre: fila.nombre, nuevos: res.nuevos, actualizados: res.actualizados });
          }
        });

        // los que más rivales tienen primero, y yo siempre arriba
        filas.sort((a, b) => (b.yo - a.yo) || (b.n - a.n) || a.nombre.localeCompare(b.nombre));

        est.miembros = filas;
        est.visto    = Date.now();
        guardar();

        const hecho = {
          ok: true,
          nuevos: nuevos,
          actualizados: actualizados,
          deQuien: deQuien,
          miembros: filas,
          antes: mios.length,
          ahora: window.RIVALES.lista().length
        };

        // he aprendido algo: que lo vea el resto sin tener que pasar por mí.
        // Mi propia fila se corrige aquí: la que vino del GET es de antes de
        // juntar nada, y se quedaría diciendo que tengo menos rivales.
        if (nuevos || actualizados) {
          const mia = filas.find(f => f.yo);
          if (mia) { mia.n = window.RIVALES.lista().length; mia.ts = Date.now(); }
          filas.sort((a, b) => (b.yo - a.yo) || (b.n - a.n) || a.nombre.localeCompare(b.nombre));
          guardar();
          return subir().then(() => hecho);
        }
        return hecho;
      });
    });
  }

  cargar();

  return {
    MAX_MIEMBROS: MAX_MIEMBROS,
    dentro:      dentro,
    estado:      estado,
    normaliza:   normaliza,
    apodo:       apodo,
    crear:       crear,
    unir:        unir,
    salir:       salir,
    quitar:      quitar,
    sincronizar: sincronizar
  };
})();
