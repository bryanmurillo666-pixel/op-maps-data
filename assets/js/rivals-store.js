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

     res  sus dos RESERVAS. Tampoco se ven. Una reserva entra por un
        defensor que esté CAÍDO, y pelea con la táctica de SU hueco, no
        con la del caído. Una reserva caída se la saltan, y cuando el
        banquillo se acaba el puesto se queda vacío y concede.

   Siempre son tres guardias (dos si la tripulación tiene justo dos
   personajes), y un puesto puede estar en tres estados:

     null            no lo has averiguado todavía
     {n:'-', t:...}  el rival lo tiene vacío, así que concede
     {n:'Zoro', t:'Assault'}

     tag  la ETIQUETA de 3 letras de su alianza (`PAL`, `RKS`...). Es dato
        del juego, no algo que te inventes: una alianza se crea con una, y
        se ve en pantalla. Sirve para agrupar y filtrar cuando la libreta
        crece, y viaja por la alianza como todo lo demás.

   Vive en el navegador (localStorage): es tuyo y no se sube a ningún
   sitio.
   ============================================================ */
window.RIVALES = (function () {

  const KEY      = 'opmaps-rivales';
  const GUARDIAS = 3;
  const PUESTOS  = 3;
  const RESERVAS = 2;   // el banquillo: la guía deja hasta dos
  const VACIO    = '-';

  /* Las cuatro bandas de salud que enseña el juego, más 'ok' como
     valor por defecto cuando no te has fijado. */
  const ESTADOS = ['ok', 'her', 'cri', 'ko'];
  const CAIDO   = 'ko';

  /* Cuánto tarda cada banda en volver a Sano, con los números de la guía:
     descansar cura el 10 % de la vida por turno, y un turno son 30 min.

       Herido  (30-69 %) → 70 %:  4 turnos           = 2 h
       Crítico (1-29 %)  → 70 %:  7 turnos           = 3,5 h
       Caído   (0 %)     → 4 turnos para revivir al 20 %,
                           y 5 más hasta el 70 %:     = 4,5 h

     Es una estimación, no una regla: descansar es voluntario y quien esté
     navegando o peleando no se cura. Pero dar por bueno un "Caído" que
     apuntaste hace medio día engaña mucho más de lo que ayuda, y el modelo
     lo usa para decidir si entra una reserva. */
  const CURA = { her: 2 * 3600e3, cri: 3.5 * 3600e3, ko: 4.5 * 3600e3 };

  let lista = [];

  const existe = n => n === VACIO || window.CHARACTERS.some(c => c.n === n);

  const guardiaVacia = () => [null, null, null];

  function limpiaPuesto(p){
    if (!p || typeof p !== 'object') return null;
    if (!existe(p.n)) return null;
    if (window.RULES.TACTICS.indexOf(p.t) === -1) return null;
    return { n: p.n, t: p.t };
  }

  /* La etiqueta de alianza: 3 caracteres, mayúsculas, sin nada raro. Se
     normaliza al entrar para que no convivan `PAL`, `pal` y `Pal `. */
  const limpiaTag = t =>
    String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);

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

    // el banquillo: mismos tres estados que un puesto de guardia
    const res = [];
    for (let i = 0; i < RESERVAS; i++) {
      res.push(Array.isArray(r.res) ? limpiaPuesto(r.res[i]) : null);
    }

    return {
      id: String(r.id || ('r' + Date.now() + Math.random().toString(36).slice(2, 7))),
      n:  String(r.n || '').slice(0, 40),
      tag: limpiaTag(r.tag),
      r:  rr.slice(0, window.RULES.MAX_CREW),
      g:  g,
      res: res,
      a:  a,
      ts: Number(r.ts) || 0,
      // cuándo apuntaste su salud, para saber cuándo dejar de creértela
      tsE: Number(r.tsE) || 0
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

  /* Cada rival lleva la fecha de su ultimo cambio. Solo sirve para una
     cosa: cuando dos versiones del mismo rival se contradicen al juntar
     libretas, gana la mas reciente. */
  const ahora = () => Date.now();
  function toca(r){ if (r) r.ts = ahora(); }

  /* Devuelve los estados a Sano cuando ha pasado tiempo de sobra. Se llama
     al leer la libreta, no con un temporizador: así funciona igual si
     dejas la pestaña abierta media tarde que si la abres al día siguiente. */
  function caducaEstados(){
    const ya = Date.now();
    let cambio = false;
    lista.forEach(r => {
      if (!r.tsE) return;
      const pasado = ya - r.tsE;
      r.r.forEach(m => {
        if (m.e !== 'ok' && pasado >= CURA[m.e]) { m.e = 'ok'; cambio = true; }
      });
      if (r.r.every(m => m.e === 'ok')) { r.tsE = 0; cambio = true; }
    });
    if (cambio) guardar();
  }

  const porId = id => { caducaEstados(); return lista.find(r => r.id === id) || null; };

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
      n: n, tag: '', r: [], a: [], ts: ahora(), tsE: 0, res: [null, null],
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
    toca(r);
    guardar();
  }

  function setTag(id, tag){
    const r = porId(id);
    if (!r) return '';
    r.tag = limpiaTag(tag);
    toca(r);
    guardar();
    return r.tag;
  }

  /* Las etiquetas que de verdad estás usando, para poder ofrecerlas en una
     lista en vez de dejar escribirlas a mano en el filtro. */
  function tags(){
    const vistas = {};
    lista.forEach(r => { if (r.tag) vistas[r.tag] = true; });
    return Object.keys(vistas).sort();
  }

  /* ---------- su tripulación ---------- */

  function addMiembro(id, nombre){
    const r = porId(id);
    if (!r) return 'noExiste';
    if (!window.CHARACTERS.some(c => c.n === nombre)) return 'noExiste';
    if (r.r.some(m => m.n === nombre)) return 'repetido';
    if (r.r.length >= window.RULES.MAX_CREW) return 'llena';
    r.r.push({ n: nombre, e: 'ok' });
    toca(r);
    guardar();
    return 'ok';
  }

  function delMiembro(id, nombre){
    const r = porId(id);
    if (!r) return;
    r.r = r.r.filter(m => m.n !== nombre);
    toca(r);
    guardar();
  }

  function setEstado(id, nombre, estado){
    const r = porId(id);
    if (!r) return;
    const m = r.r.find(x => x.n === nombre);
    if (m && ESTADOS.indexOf(estado) !== -1) {
      m.e = estado;
      if (estado !== 'ok') r.tsE = ahora();
      toca(r);
      guardar();
    }
  }

  /* ---------- sus guardias ---------- */

  /* Pone un puesto. Con nombre vacío se borra y vuelve a "sin averiguar". */
  function setPuesto(id, gi, pos, nombre, tactica){
    const r = porId(id);
    if (!r || !r.g[gi] || pos < 0 || pos >= PUESTOS) return;
    const n = String(nombre || '').trim();
    r.g[gi][pos] = n ? limpiaPuesto({ n: n, t: tactica }) : null;
    toca(r);
    guardar();
  }

  /* Pone una reserva. Con nombre vacío se borra y vuelve a "sin averiguar".
     No se valida que no repita ni que no esté defendiendo: esto es lo que
     TÚ has visto, y si lo has visto mal el aviso va en la pantalla, no
     tirando el dato. */
  function setReserva(id, i, nombre, tactica){
    const r = porId(id);
    if (!r || i < 0 || i >= RESERVAS) return;
    const n = String(nombre || '').trim();
    r.res[i] = n ? limpiaPuesto({ n: n, t: tactica }) : null;
    toca(r);
    guardar();
  }

  function vaciarGuardia(id, gi){
    const r = porId(id);
    if (!r || !r.g[gi]) return;
    r.g[gi] = guardiaVacia();
    toca(r);
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
    toca(r);
    guardar();
    return 'ok';
  }

  function delAtaque(id, idx){
    const r = porId(id);
    if (!r || !r.a[idx]) return;
    r.a.splice(idx, 1);
    toca(r);
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
      r.a.map(at => [at.p.map(codPuesto), at.w]),
      r.ts || 0,
      r.res.map(codPuesto),
      r.tag || '',
      r.tsE || 0
    ]);
    return CABECERA + b64(JSON.stringify(datos));
  }

  /* ---------- juntar dos versiones del mismo rival ----------
     La regla es complementar, no sustituir. Si tú sabes su guardia 1 y un
     compañero sabe la 2, os quedáis con las dos: cambiar el rival entero
     por el más reciente tiraría lo que uno de los dos averiguó. La fecha
     solo decide cuando las dos versiones se contradicen en el MISMO dato.
     Devuelve si algo cambió. */
  function fusionaRival(mio, suyo){
    const mandaSuyo = (suyo.ts || 0) > (mio.ts || 0);
    let cambio = false;

    /* Su tripulación: la unión de las dos. Para la SALUD manda su propia
       fecha, no la del rival entero: alguien pudo apuntar una guardia hace
       un minuto sin volver a mirar quién estaba tocado. */
    const saludSuya = (suyo.tsE || 0) > (mio.tsE || 0);
    suyo.r.forEach(m => {
      const ya = mio.r.find(x => x.n === m.n);
      if (!ya) {
        if (mio.r.length < window.RULES.MAX_CREW) {
          mio.r.push({ n: m.n, e: m.e });
          cambio = true;
        }
      } else if (ya.e !== m.e && saludSuya) { ya.e = m.e; cambio = true; }
    });
    if (saludSuya && suyo.tsE) { mio.tsE = suyo.tsE; cambio = true; }

    // sus guardias, puesto a puesto
    for (let i = 0; i < GUARDIAS; i++){
      for (let j = 0; j < PUESTOS; j++){
        const a = mio.g[i][j], b = suyo.g[i][j];
        if (!b) continue;                                       // él no sabe nada de ese puesto
        if (!a) { mio.g[i][j] = b; cambio = true; continue; }   // yo tampoco: me lo quedo
        if (a.n === b.n && a.t === b.t) continue;               // coinciden, nada que hacer
        if (mandaSuyo) { mio.g[i][j] = b; cambio = true; }      // se contradicen: manda la fecha
      }
    }

    // su etiqueta: si tú no la tienes y él sí, te la quedas
    if (suyo.tag && suyo.tag !== mio.tag && (!mio.tag || mandaSuyo)) {
      mio.tag = suyo.tag;
      cambio = true;
    }

    // su banquillo, hueco a hueco, con la misma regla que las guardias
    for (let i = 0; i < RESERVAS; i++) {
      const a = mio.res[i], b = suyo.res[i];
      if (!b) continue;
      if (!a) { mio.res[i] = b; cambio = true; continue; }
      if (a.n === b.n && a.t === b.t) continue;
      if (mandaSuyo) { mio.res[i] = b; cambio = true; }
    }

    // sus ataques: se juntan sin repetir, los más recientes delante
    const firma = at => JSON.stringify([at.p.map(codPuesto), at.w]);
    const tengo = {};
    mio.a.forEach(at => { tengo[firma(at)] = true; });
    const sueltos = suyo.a.filter(at => !tengo[firma(at)]);
    if (sueltos.length){
      mio.a = (mandaSuyo ? sueltos.concat(mio.a) : mio.a.concat(sueltos)).slice(0, MAX_ATAQUES);
      cambio = true;
    }

    if (cambio) mio.ts = Math.max(mio.ts || 0, suyo.ts || 0);
    return cambio;
  }

  /* Un rival tal como viene dentro de un código, ya en formato normal. */
  function deCodigo(d){
    if (!Array.isArray(d)) return null;
    const nombre = String(d[0] || '').trim().slice(0, 40);
    if (!nombre) return null;
    return limpiaRival({
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
      })),
      ts: d[4] || 0,
      res: (Array.isArray(d[5]) ? d[5] : []).map(dePuesto),
      tag: d[6] || '',
      tsE: d[7] || 0
    });
  }

  /* Devuelve {nuevos, actualizados} o null si el código no vale. Un rival
     que ya tienes NO se sustituye: se complementa con fusionaRival. */
  function importar(codigo){
    const txt = String(codigo || '').trim();
    if (txt.indexOf(CABECERA) !== 0) return null;

    let datos;
    try { datos = JSON.parse(deB64(txt.slice(CABECERA.length))); }
    catch(e){ return null; }
    if (!Array.isArray(datos)) return null;

    let nuevos = 0, actualizados = 0;

    datos.forEach(d => {
      const suyo = deCodigo(d);
      if (!suyo) return;
      const ya = lista.find(r => r.n.toLowerCase() === suyo.n.toLowerCase());
      if (ya) {
        if (fusionaRival(ya, suyo)) actualizados++;
      } else {
        lista.push(suyo);
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
    RESERVAS: RESERVAS,
    VACIO:    VACIO,
    ESTADOS:  ESTADOS,
    CAIDO:    CAIDO,
    /* Sale ordenada por lo último que se tocó. Con la libreta llena, lo que
       acabas de averiguar es lo que quieres tener delante. */
    lista:     () => { caducaEstados();
                       return lista.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)); },
    porId:     porId,
    nGuardias: nGuardias,
    añadir:    añadir,
    borrar:    borrar,
    renombrar: renombrar,
    setTag:    setTag,
    tags:      tags,
    addMiembro: addMiembro,
    delMiembro: delMiembro,
    setEstado:  setEstado,
    setPuesto:  setPuesto,
    vaciarGuardia: vaciarGuardia,
    setReserva:  setReserva,
    addAtaque:  addAtaque,
    delAtaque:  delAtaque,
    ultimoAtaque: ultimoAtaque,
    exportar:   exportar,
    importar:   importar,
    fusionar:   fusionaRival,
    recargar:  cargar
  };
})();
