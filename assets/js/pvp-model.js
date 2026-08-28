/* ============================================================
   OP-MAPS DATA — el motor del plan de ataque
   ------------------------------------------------------------
   Aquí está toda la matemática del PvP. La interfaz va en pvp.js.

   EL PROBLEMA
   Atacas y el servidor elige UNA de sus guardias al azar, uniforme,
   sin descartar la que acaba de salir. Tú eliges tres de los tuyos,
   en un orden, cada uno con su táctica. Ganas si te llevas 2 de los
   3 duelos, porque el empate se lo lleva el defensor.

   Como el sorteo es uniforme, cada guardia aporta exactamente 1/n.
   Eso permite trabajar guardia a guardia en vez de con el conjunto.

   LO QUE SE SABE Y LO QUE NO
   El juego te enseña su tripulación y en qué banda de salud está cada
   uno. No te enseña sus guardias. Así que:

     · las guardias que hayas averiguado entran EXACTAS
     · las que no, se estiman con formaciones plausibles construidas
       a partir de su tripulación

   CÓMO SE CONSTRUYEN LAS FORMACIONES PLAUSIBLES
   Dos ejes, y el producto de los dos:

   1. Quién defiende. Se toman sus mejores personajes (los caídos no
      pueden defender) y se reparten en ventana cíclica: la guardia j
      empieza por el j-ésimo. Eso cumple sola la regla del juego de que
      quien repite tiene que cambiar de fila. Se prueban varios órdenes
      de partida — por su mejor puntuación y por cada táctica— para no
      dar por hecho que colocan siempre igual.

   2. Qué tácticas. Las tres familias que se ven en la práctica:
        mono  una sola táctica por guardia   (A,A,A) (M,M,M) (E,E,E)
        rot   una de cada en cada guardia    (A,M,E) (M,E,A) (E,A,M)
        dos   dos de una y una de otra       (A,A,E) (M,M,A) (E,E,M)
      Entre las tres cubren los 27 repartos posibles de tácticas: 3
      son mono, 6 tienen las tres distintas y 18 repiten exactamente
      una. Lo que cambia es cada cuánto se ven.

   SI YA HAS AVERIGUADO ALGO
   Se buscan las formaciones que encajan con lo que apuntaste. Si hay
   alguna, se descartan las demás: eso es lo que hace que con UNA sola
   guardia vista el resto se afine tanto. Si no encaja ninguna (el rival
   no sigue ningún patrón común), se conservan todas y simplemente se
   sobrescribe lo que sí sabes, que sigue entrando exacto.

   POR QUÉ ES RÁPIDO
   Tu posición i solo pelea contra la posición i del rival. Así que para
   cada personaje tuyo y cada táctica se precalcula una máscara de bits
   con las (formación, guardia) en las que ganaría esa posición. Elegir
   plan es entonces cruzar tres máscaras: (a&b)|(a&c)|(b&c) da las que
   ganas por 2 de 3, y contar bits da el resultado. Son unas 25
   operaciones por plan en vez de varios cientos.
   ============================================================ */
window.PVP_MODEL = (function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;
  const T  = R.TACTICS;

  const CONCEDE = -1;   // puesto sin nadie: ese duelo lo ganas sin pelear
  const RESERVAS = 2;  // el banquillo que deja el juego, en ataque y en defensa

  /* ---------- utilidades ---------- */

  function permutaciones(a){
    if (a.length <= 1) return [a.slice()];
    const out = [];
    a.forEach((x, i) => {
      const resto = a.slice(0, i).concat(a.slice(i + 1));
      permutaciones(resto).forEach(p => out.push([x].concat(p)));
    });
    return out;
  }

  /* Desplazamiento lógico (>>>) y no aritmético: los valores vienen de un
     Uint32Array y con >> el bit alto se interpretaría como signo. */
  /* Compara dos planes por varias cifras en orden: la primera que difiera
     decide. Sustituye a una torre de ternarios que ya no cabía. */
  function mejorQue(a, b){
    for (let i = 0; i < a.length; i++) {
      if (a[i] > b[i]) return true;
      if (a[i] < b[i]) return false;
    }
    return false;
  }

  function popcount(x){
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    x = (x + (x >>> 4)) & 0x0f0f0f0f;
    return (x * 0x01010101) >>> 24;
  }

  /* ---------- los patrones de táctica ---------- */

  /* Devuelve una lista de patrones. Cada uno son nG filas de 3 tácticas
     (índices sobre T), una fila por guardia. */
  function patronesTactica(nG){
    const perms = permutaciones([0, 1, 2]);
    const FAM = ['mono', 'rot', 'dos'];
    const familias = { mono: [], rot: [], dos: [] };
    const vistos = {};

    /* Se guarda un patrón por MULTICONJUNTO de filas. El orden de las
       filas se expande después, porque para el cálculo da igual (el
       sorteo es uniforme) pero para reconocer una guardia que ya has
       visto no: ahí sí importa cuál es la 1, la 2 y la 3. */
    const mete = (familia, filas) => {
      const clave = familia + '|' + filas.map(f => f.join('')).sort().join(',');
      if (vistos[clave]) return;
      vistos[clave] = true;
      familias[familia].push(filas);
    };

    perms.forEach(p => {
      mete('mono', [[p[0],p[0],p[0]], [p[1],p[1],p[1]], [p[2],p[2],p[2]]]);
      mete('rot',  [[p[0],p[1],p[2]], [p[1],p[2],p[0]], [p[2],p[0],p[1]]]);
      mete('rot',  [[p[0],p[1],p[2]], [p[2],p[0],p[1]], [p[1],p[2],p[0]]]);
      for (let j = 0; j < 3; j++) {
        mete('dos', [0,1,2].map(i => {
          const fila = [p[i], p[i], p[i]];
          fila[j] = p[(i + 1) % 3];
          return fila;
        }));
      }
    });

    const expandir = ms => {
      const out = [], dedup = {};
      ms.forEach(filas => permutaciones([0, 1, 2]).forEach(o => {
        const g = o.slice(0, nG).map(k => filas[k]);
        const k = g.map(f => f.join('')).join(',');
        if (!dedup[k]) { dedup[k] = true; out.push(g); }
      }));
      return out;
    };

    /* Las tres familias pesan lo mismo. Sin esto "dos de una" arrasaría
       solo por ser la más numerosa (18 de los 27 repartos posibles
       repiten exactamente una táctica), y en la práctica se ven las
       tres por igual. */
    const listas = FAM.map(f => expandir(familias[f]));
    const tope = Math.max.apply(null, listas.map(l => l.length));

    const out = [];
    listas.forEach((l, k) => {
      const veces = l.length ? Math.max(1, Math.round(tope / l.length)) : 0;
      for (let v = 0; v < veces; v++) l.forEach(g => out.push({ f: FAM[k], g: g }));
    });
    return out;
  }

  /* ---------- quién defiende ---------- */

  /* Reparte a los suyos en ventana cíclica: la guardia j empieza por el
     j-ésimo del orden. Cumple sola la regla de que quien repite cambia
     de fila, y con menos de tres personajes deja puestos concedidos. */
  function reparto(orden, nG){
    const p = orden.length;
    const filas = [];
    for (let j = 0; j < nG; j++) {
      const fila = [];
      for (let i = 0; i < 3; i++) fila.push(i < p ? orden[(j + i) % p] : CONCEDE);
      filas.push(fila);
    }
    return filas;
  }

  /* Devuelve ÍNDICES sobre pool, no personajes: el resto del motor
     trabaja con índices para poder meterlos en máscaras de bits.

     Además de los órdenes "razonables" (por su mejor puntuación y por
     cada táctica), se construye el orden que REPRODUCE lo que ya has
     visto. Sin eso, ver una guardia no serviría de nada: ninguna
     formación candidata encajaría con ella y no se podría descartar
     nada. */
  function ordenes(pool, obs){
    const idx = pool.map((c, i) => i);
    const p = pool.length;
    const mejor = c => Math.max.apply(null, T.map(t => R.score(c, t)));
    const porPuntos = idx.slice().sort((a, b) => mejor(pool[b]) - mejor(pool[a]));

    /* Solo órdenes que alguien pondría de verdad: por su mejor puntuación
       y por cada táctica, para cubrir tanto "delante el más fuerte" como
       "delante el especialista". NO se prueba el orden invertido: nadie
       manda de guardia a sus tres peores, y meterlo llenaba el cálculo de
       formaciones imposibles con sus personajes más flojos. */
    const listas = [ porPuntos ];
    T.forEach(t => listas.push(
      idx.slice().sort((a, b) => R.score(pool[b], t) - R.score(pool[a], t))));

    /* El orden que encaja con lo apuntado. La guardia j empieza por el
       j-ésimo del orden, así que ver a alguien en la guardia j, fila i,
       fija su sitio en la posición (j+i) del orden. */
    if (obs && p) {
      const sitio = new Array(p).fill(-1);
      let choca = false;
      for (let j = 0; j < obs.length && !choca; j++) {
        for (let i = 0; i < 3; i++) {
          const o = obs[j][i];
          if (!o || o.c === CONCEDE) continue;
          const k = (j + i) % p;
          if (sitio[k] !== -1 && sitio[k] !== o.c) { choca = true; break; }
          sitio[k] = o.c;
        }
      }
      if (!choca) {
        const puestos = {};
        sitio.forEach(c => { if (c !== -1) puestos[c] = true; });
        const resto = porPuntos.filter(c => !puestos[c]);
        const orden = sitio.map(c => c !== -1 ? c : resto.shift());
        if (orden.every(c => c !== undefined)) listas.unshift(orden);
      }
    }

    const out = [], vistos = {};
    listas.forEach(l => {
      /* Sin recortar: la ventana cíclica ya hace que solo salgan los
         primeros del orden, y recortar rompería las posiciones que fija
         lo que has visto. */
      const k = l.join('|');
      if (!vistos[k]) { vistos[k] = true; out.push(l); }
    });
    return out;
  }

  /* ---------- las formaciones plausibles ---------- */

  /* Una formación son nG guardias; cada guardia, 3 puestos
     {c: índice de personaje rival o CONCEDE, t: índice de táctica}. */
  function formaciones(pool, nG, obs){
    const out = [];
    if (!pool.length) return out;

    const reps = ordenes(pool, obs).map(o => reparto(o, nG));
    const pats = patronesTactica(nG);

    reps.forEach(rep => {
      pats.forEach(pat => {
        const guardias = [];
        for (let j = 0; j < nG; j++) {
          const fila = [];
          for (let i = 0; i < 3; i++) fila.push({ c: rep[j][i], t: pat.g[j][i] });
          guardias.push(fila);
        }
        out.push({ f: pat.f, g: guardias });
      });
    });
    return out;
  }

  /* ---------- lo que has averiguado ---------- */

  /* Traduce las guardias apuntadas a la misma forma que las plausibles.

     Cuando un defensor está CAÍDO entra una reserva, y ahí la guía pone
     tres detalles que importan:

       - la reserva pelea con la táctica de SU hueco, no la del caído
       - una reserva que esté caída ella misma se la saltan
       - cuando el banquillo se acaba, el puesto se queda vacío y concede

     El banquillo ya llega resuelto. Si no has apuntado ninguna reserva el
     puesto se queda en desconocido: que tú no la hayas visto no significa
     que no la tenga. */
  function observado(rival, idx, caidos, banquillo){
    const out = [];
    for (let j = 0; j < rival.g.length; j++) {
      const fila = [];
      let usadas = 0;                    // reservas gastadas EN ESTA guardia
      for (let i = 0; i < 3; i++) {
        const p = rival.g[j][i];
        if (!p) { fila.push(null); continue; }
        if (p.n === window.RIVALES.VACIO) { fila.push({ c: CONCEDE, t: 0 }); continue; }
        if (caidos[p.n]) { fila.push(banquillo[usadas++] || null); continue; }
        const c = idx[p.n];
        fila.push(c === undefined ? null : { c: c, t: T.indexOf(p.t) });
      }
      out.push(fila);
    }
    return out;
  }

  const casan = (a, b) => a.c === b.c && (a.c === CONCEDE || a.t === b.t);

  /* Cuántos puestos apuntados encajan con esta formación. */
  function encaje(form, obs){
    let n = 0;
    for (let j = 0; j < form.g.length && j < obs.length; j++)
      for (let i = 0; i < 3; i++)
        if (obs[j][i] && casan(obs[j][i], form.g[j][i])) n++;
    return n;
  }

  function apuntados(obs){
    let n = 0;
    obs.forEach(g => g.forEach(p => { if (p) n++; }));
    return n;
  }

  /* ---------- el cálculo ---------- */

  /* crew    : tus personajes disponibles (los caídos ya fuera)
     rival   : el rival tal cual está guardado
     Devuelve null si no hay con qué calcular. */
  /* modo: 'g30' | 'g21' | 'p12' | 'p03', el marcador que buscas. */
  function evaluar(crew, rival, modo){
    if (!crew || crew.length < 3 || !rival) return null;

    const RV = window.RIVALES;
    const nG = RV.nGuardias(rival);

    // Los suyos que pueden defender. Si no has apuntado su tripulación,
    // se usa a quien le hayas visto en las guardias.
    const caidos = {};
    rival.r.forEach(m => { if (m.e === RV.CAIDO) caidos[m.n] = true; });

    /* Quien está en el banquillo NO puede defender —lo dice la guía—, así
       que sale del reparto de guardias. El orden es a propósito: primero
       los que sí pueden defender y detrás el banquillo, para que los
       índices del reparto y los de `suyos` coincidan y no haya que
       traducir de unos a otros. */
    const enBanco = {};
    (rival.res || []).forEach(p => { if (p && p.n !== RV.VACIO) enBanco[p.n] = true; });

    const nombres = [];
    const mete = n => {
      if (n && n !== RV.VACIO && !caidos[n] && nombres.indexOf(n) === -1) nombres.push(n);
    };
    rival.r.forEach(m => { if (!enBanco[m.n]) mete(m.n); });
    rival.g.forEach(g => g.forEach(p => { if (p && !enBanco[p.n]) mete(p.n); }));
    const nPool = nombres.length;
    (rival.res || []).forEach(p => { if (p) mete(p.n); });

    const suyos = nombres.map(n => DB.find(c => c.n === n)).filter(Boolean);

    // índice de personaje rival -> posición en `suyos`
    const idx = {};
    suyos.forEach((c, i) => { idx[c.n] = i; });

    /* El banquillo, ya resuelto: sin apuntar deja el puesto en desconocido,
       marcado como vacío concede, y una reserva caída desaparece de la fila
       porque se la saltan. */
    const banquillo = (rival.res || []).map(p => {
      if (!p) return null;
      if (p.n === RV.VACIO) return { c: CONCEDE, t: 0 };
      if (caidos[p.n]) return undefined;
      const c = idx[p.n];
      return c === undefined ? null : { c: c, t: T.indexOf(p.t) };
    }).filter(x => x !== undefined);

    const obs   = observado(rival, idx, caidos, banquillo);
    const nApun = apuntados(obs);

    let forms = formaciones(suyos.slice(0, nPool), nG, obs);
    let familia = null;

    if (!forms.length) {
      // No sabes nada de nadie: no hay nada honesto que estimar.
      if (!nApun) return { vacio: true, nG: nG, apuntados: 0 };
      forms = [{ f: null, g: obs.map(g => g.map(p => p || { c: CONCEDE, t: 0 })) }];
    } else if (nApun) {
      // Si alguna formación encaja del todo con lo apuntado, las demás
      // sobran: es lo que hace que una guardia vista afine tanto el resto.
      const completas = forms.filter(f => encaje(f, obs) === nApun);
      if (completas.length) {
        forms = completas;
        const fs = {};
        forms.forEach(f => { fs[f.f] = true; });
        const claves = Object.keys(fs);
        if (claves.length === 1) familia = claves[0];
      }
      // Encaje o no, lo apuntado manda: se sobrescribe en todas.
      forms = forms.map(f => ({
        f: f.f,
        g: f.g.map((fila, j) => fila.map((p, i) => (obs[j] && obs[j][i]) ? obs[j][i] : p))
      }));
    }

    /* Puntuación de cada uno de los tuyos en cada táctica: se usa para
       construir las máscaras y como último desempate entre planes. */
    const puntosDe = crew.map(c => T.map(tac => R.score(c, tac)));

    /* --- máscaras de bits ---
       Un bit por cada par (formación, guardia). */
    const pares = forms.length * nG;
    const words = Math.ceil(pares / 32) || 1;

    // mask[m][u][i] -> Uint32Array(words)
    const mask = [];
    for (let m = 0; m < crew.length; m++) {
      mask.push([]);
      for (let u = 0; u < 3; u++) {
        const puntos = puntosDe[m][u];
        const porPos = [];
        for (let i = 0; i < 3; i++) {
          const w = new Uint32Array(words);
          for (let f = 0; f < forms.length; f++) {
            for (let j = 0; j < nG; j++) {
              const p = forms[f].g[j][i];
              let gano;
              if (p.c === CONCEDE) gano = true;
              else {
                const suyo = suyos[p.c];
                gano = R.duelWin(puntos, T[u], R.score(suyo, T[p.t]), T[p.t]);
              }
              if (gano) {
                const bit = f * nG + j;
                w[bit >> 5] |= (1 << (bit & 31));
              }
            }
          }
          porPos.push(w);
        }
        mask[m].push(porPos);
      }
    }

    /* --- se prueban todos los planes ---
       Cuatro objetivos, y no son "ganar o perder": son cuatro marcadores
       concretos, cada uno con su precio y su daño (la tabla está en
       rules.js, sacada de la guía v5.1):

         g30  ganas 3-0    le haces 35 % y te cuesta  5 %
         g21  ganas 2-1    le haces 25/18 % y te cuesta 10/12 %
         p12  pierdes 1-2  le haces 12/10 % y te cuesta 18/25 %
         p03  pierdes 0-3  le haces  5 % y te cuesta 35 %

       Los dos de perder existen porque perder tiene usos: el 1-2 es la
       derrota más barata que hay —sirve para pelear solo por verle las
       guardias, que es la única forma de averiguarlas—, y el 0-3 es el que
       menos daño le hace a él, o sea la forma de regalarle una victoria
       sin estropearle el casco.

       Lo que NO se puede hacer perdiendo es hundirlo: el casco del ganador
       se desgasta pero nunca se destruye. */
    const quiereGanar = (modo === 'g30' || modo === 'g21');

    /* Los bits que sobran del último word no son pares reales, y al negar
       con ~ se encenderían. Esta máscara los apaga. */
    const valido = new Uint32Array(words);
    for (let k = 0; k < pares; k++) valido[k >> 5] |= (1 << (k & 31));

    let mejor = null;
    const n = crew.length;

    for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++){ if (b === a) continue;
    for (let c = 0; c < n; c++){ if (c === a || c === b) continue;
      for (let x = 0; x < 3; x++){
        const w1 = mask[a][x][0];
        for (let y = 0; y < 3; y++){
          const w2 = mask[b][y][1];
          for (let z = 0; z < 3; z++){
            const w3 = mask[c][z][2];

            // en cuántos pares (formación, guardia) acaba en cada marcador
            let c3 = 0, c2 = 0, c1 = 0, c0 = 0, duelos = 0;
            for (let k = 0; k < words; k++){
              const v = valido[k];
              const p = w1[k] & v, q = w2[k] & v, r = w3[k] & v;
              const tres = p & q & r;
              const dos  = ((p & q) | (p & r) | (q & r)) & ~tres;
              const una  = (p & ~q & ~r) | (~p & q & ~r) | (~p & ~q & r);
              const cero = ~p & ~q & ~r;
              c3 += popcount(tres);
              c2 += popcount(dos);
              c1 += popcount(una & v);
              c0 += popcount(cero & v);
              duelos += popcount(p) + popcount(q) + popcount(r);
            }
            const ganadas = c3 + c2;

            /* La puntuación del trío. Muchos planes empatan en resultado, y
               sin esto se quedaba con el primero que salía del bucle — por
               eso aparecía gente floja pudiendo mandar a alguien mejor que
               hacía exactamente lo mismo.

               Perdiendo es más que un desempate: un 2-1 solo cuenta como
               AJUSTADO —18 % de casco en vez de 25 %, y encima 12 % de daño
               en vez de 10 %— si el ganador no te saca 1,25 veces en
               puntos. O sea que hay que puntuar alto y aun así perder dos
               duelos. */
            const fuerza = puntosDe[a][x] + puntosDe[b][y] + puntosDe[c][z];

            /* Cuatro cifras por orden, y la primera que difiera decide: el
               marcador que buscas; que el combate acabe del lado que
               quieres y no al revés por accidente; cuántos duelos caen de
               tu parte; y la puntuación al final. */
            const puntua = [
              modo === 'g30' ? c3 : modo === 'g21' ? c2 : modo === 'p12' ? c1 : c0,
              quiereGanar ? ganadas : -ganadas,
              quiereGanar ? duelos  : -duelos,
              fuerza
            ];

            if (!mejor || mejorQue(puntua, mejor.puntua)) {
              mejor = { puntua: puntua, ganadas: ganadas, duelos: duelos,
                        c3: c3, c2: c2, c1: c1, c0: c0, fuerza: fuerza,
                        idx: [a, b, c], tac: [T[x], T[y], T[z]] };
            }
          }
        }
      }
    }}

    /* Con el plan ya elegido, se recorren las formaciones una vez más para
       saber cómo acaba cada una: el marcador y lo que le cuesta a tu casco.
       Es barato (unas cientas de vueltas) y es lo que hace falta para poder
       decir «pierdes 2-1 el 80 % de las veces y te cuesta un 19 %». */
    let marcador = null;
    if (mejor) {
      marcador = { g30:0, g21a:0, g21t:0, p21t:0, p21a:0, p03:0,
                   casco:0, suCasco:0 };

      /* El daño al rival, pero SOLO en las veces que sale cada marcador.
         Sin esto habría que enseñar la media de todo, y una media que
         mezcla el 3-0 que buscas con el 1-2 que sale el resto de las
         veces no describe ninguno de los dos: puesta debajo de "Ganar
         3-0" se lee como el daño de un 3-0 y no lo es.

         En el 3-0 y en el 0-3 sale un número fijo. En los 2-1 sigue
         siendo una media, pero solo entre amplio y ajustado, que es
         justo lo que uno quiere saber. */
      const cubo = { g30:{n:0,s:0}, g21:{n:0,s:0}, p12:{n:0,s:0}, p03:{n:0,s:0} };
      const grupoDe = { g30:'g30', g21a:'g21', g21t:'g21',
                        p21t:'p12', p21a:'p12', p03:'p03' };

      for (let f = 0; f < forms.length; f++) {
        for (let j = 0; j < nG; j++) {
          let gano = 0, miTotal = 0, suTotal = 0;
          for (let i = 0; i < 3; i++) {
            const p = forms[f].g[j][i];
            const miTac = mejor.tac[i];
            let miPunto = puntosDe[mejor.idx[i]][T.indexOf(miTac)];

            if (p.c === CONCEDE) { gano++; miTotal += miPunto; continue; }

            const suTac = T[p.t];
            let suPunto = R.score(suyos[p.c], suTac);

            /* Las puntuaciones que cuentan para el marcador son las del
               duelo YA resuelto, o sea con el contador aplicado: quien
               contrarresta pelea con su puntuación multiplicada. Es lo
               mismo que decide quién gana el duelo, así que comparar
               aquí es comparar lo que de verdad pasó. */
            if (R.beats(miTac, suTac))      miPunto *= R.COUNTER;
            else if (R.beats(suTac, miTac)) suPunto *= R.COUNTER;

            miTotal += miPunto;
            suTotal += suPunto;
            if (miPunto > suPunto) gano++;   // el empate se lo lleva el otro
          }

          /* Qué marcador ha salido. El 2-1 se parte en amplio y ajustado
             porque cuestan distinto y hacen distinto daño, y con el mismo
             criterio en los dos sentidos: es amplio cuando el ganador saca
             1,25 veces los puntos del perdedor. */
          let cual;
          if (gano === 3)      cual = 'g30';
          else if (gano === 0) cual = 'p03';
          else if (gano === 2) cual = (suTotal <= 0 || miTotal / suTotal >= R.AMPLIO) ? 'g21a' : 'g21t';
          else                 cual = (miTotal <= 0 || suTotal / miTotal >= R.AMPLIO) ? 'p21a' : 'p21t';

          marcador[cual]++;
          marcador.casco   += R.CASCO[cual].yo;
          marcador.suCasco += R.CASCO[cual].el;

          const grupo = cubo[grupoDe[cual]];
          grupo.n++;
          grupo.s += R.CASCO[cual].el;
        }
      }
      marcador.casco   /= pares;            // daño medio a tu casco
      marcador.suCasco /= pares;            // ...y al suyo
      marcador.danoMio  = marcador.casco   * R.HULL;
      marcador.danoSuyo = marcador.suCasco * R.HULL;

      /* Si un marcador no sale nunca, su daño es hipotético: se usa el de
         la tabla, con la variante ajustada para los 2-1 por ser la que más
         se da. La probabilidad que se enseña al lado será 0 %, así que el
         número no engaña a nadie. */
      const suelto = { g30: R.CASCO.g30.el,  g21: R.CASCO.g21t.el,
                       p12: R.CASCO.p21t.el, p03: R.CASCO.p03.el };
      marcador.suDe = {};
      Object.keys(cubo).forEach(k => {
        marcador.suDe[k] = (cubo[k].n ? cubo[k].s / cubo[k].n : suelto[k]) * R.HULL;
      });
      marcador.pierde21 = (marcador.p21t + marcador.p21a) / pares;
    }

    return {
      plan:  mejor,
      modo:  modo,
      tasa:  mejor ? mejor.ganadas / pares : 0,
      // qué parte de las veces sale cada marcador con este plan: es lo que
      // deja comparar los cuatro objetivos entre sí
      tasas: mejor ? {
        g30: mejor.c3 / pares, g21: mejor.c2 / pares,
        p12: mejor.c1 / pares, p03: mejor.c0 / pares
      } : null,
      tasa21: mejor ? mejor.c1 / pares : 0,
      marcador: marcador,
      pares: pares,
      forms: forms,
      familia: familia,
      suyos: suyos,
      nG: nG,
      nFormaciones: forms.length,
      apuntados: nApun,
      // cuántas guardias tienes completas, que son las que van exactas
      completas: obs.filter(g => g.every(p => p)).length
    };
  }

  /* ---------- ¿cuántos ataques para hundirlo? ----------
     Se le mete el casco que le queda y sale la tanda más corta de
     abordajes que lo hunde. Tres reglas lo gobiernan, y las tres son de la
     guía:

       - el daño al casco sólo depende del marcador, y es una parte del
         casco MÁXIMO: cantidades fijas, no porcentajes de lo que quede
       - el casco del ganador se desgasta pero NUNCA se destruye, así que
         el golpe final tiene que ser una victoria; perdiendo se le puede
         dejar en 1, no en 0
       - su Kit de Emergencia salta solo al bajar de 450 y repara 600

     Y de ahí sale lo bonito del asunto: si tiene kit, hay que dejarlo en
     la ventana (450, 525] antes del golpe final. Por debajo de 450 el kit
     lo devuelve a la vida; por encima de 525 no hay golpe que lo hunda.
     Son 75 puntos de margen.

     Búsqueda en anchura sobre (casco, kit) — unas doscientas situaciones
     posibles, así que se recorre entera y la tanda sale mínima de verdad,
     no "la primera que se encontró". */
  const GOLPES = [
    { k: 'g30',  gana: true  },
    { k: 'g21a', gana: true  },
    { k: 'g21t', gana: true  },
    { k: 'p21t', gana: false },
    { k: 'p21a', gana: false },
    { k: 'p03',  gana: false }
  ];

  const TOPE_ATAQUES = 14;

  /* Lo que cuesta cada abordaje EN TIEMPO, y aquí hay una vuelta de tuerca
     que lo cambia todo. La guía, entre los requisitos para poder atacar:

         «the other crew cannot be stunned»

     O sea que el aturdimiento que te frena no es el tuyo: es el SUYO. Y el
     suyo sólo salta cuando PIERDE, o sea cuando tú ganas.

       ganas   → se queda aturdido 90 min (45 si tiene Músico en pie)
                 y no puedes volver a atacarle hasta que se le pase
       pierdes → él ha ganado, así que no se aturde: puedes seguir ya

     De ahí sale, contra toda intuición, que **desgastarlo perdiendo es más
     rápido que ganarle**: cada victoria tuya le regala hora y media de
     respiro. Tu propio aturdimiento no se cuenta — Super Café, Lágrimas de
     Sirena o Café Cargado lo quitan, y así lo pidió quien usa esto.

       coste de una derrota = 30 / abordajesPorTurno
       coste de una victoria = 30 / abordajesPorTurno + su aturdimiento

     Es una aproximación: el aturdimiento puede solaparse con el final de un
     turno y salir algo más barato. Pero el orden de magnitud es el que es. */
  const TURNO = 30;

  function comoHundirlo(casco, conKit, opciones){
    const o = opciones || {};
    const H       = R.HULL;
    const porTurno = Math.max(1, Math.min(2, Number(o.porTurno) || 1));
    // el aturdimiento que cuenta es el SUYO, y sólo lo sufre al perder
    const suAturde = Math.max(0, Number(o.suAturdimiento) || 0);
    const inicio   = Math.max(1, Math.min(H, Math.round(Number(casco) || H)));

    /* Con qué desgastas y con qué rematas. Es la forma en que se juega de
       verdad: se le baja la vida con lo que salga y el golpe final se da
       cuando conoces su guardia. */
    const permitidos = Array.isArray(o.desgaste) && o.desgaste.length
      ? o.desgaste : GOLPES.map(g => g.k);
    const remate = o.remate || 'g30';

    const ranura = TURNO / porTurno;
    const info = {};
    GOLPES.forEach(g => {
      info[g.k] = { k: g.k, gana: g.gana, d: Math.round(R.CASCO[g.k].el * H) };
      // ganar le da un respiro; perder, no
      info[g.k].min = ranura + (g.gana ? suAturde : 0);
    });

    const desgaste = permitidos.map(k => info[k]).filter(Boolean);
    const final    = info[remate];
    if (!final || !final.gana) return { ok: false, inicio: inicio, motivo: 'remate' };

    /* Dijkstra sobre (casco, kit) con el tiempo como coste. El espacio es
       pequeño —el casco se mueve en múltiplos de 15— así que se recorre
       entero y la respuesta es la más rápida de verdad. */
    const clave = (h, kit) => h + '|' + (kit ? 1 : 0);
    const mejor = {};
    const raiz  = { h: inicio, kit: !!conKit, min: 0, pasos: [] };
    mejor[clave(inicio, !!conKit)] = 0;

    let cola = [raiz], salida = null;

    while (cola.length) {
      // el más barato de la cola
      let idx = 0;
      for (let i = 1; i < cola.length; i++) if (cola[i].min < cola[idx].min) idx = i;
      const e = cola.splice(idx, 1)[0];
      if (salida && e.min >= salida.min) break;
      if (e.pasos.length >= TOPE_ATAQUES) continue;

      // ¿lo remato desde aquí?
      if (e.h <= final.d) {
        // el golpe final no espera a nada: lo hunde y se acabó
        const total = e.min + ranura;
        if (!salida || total < salida.min) {
          salida = { min: total,
                     pasos: e.pasos.concat([{ k: final.k, d: final.d, queda: 0, kit: false }]) };
        }
      }

      for (let j = 0; j < desgaste.length; j++) {
        const g = desgaste[j];
        let h = e.h - g.d;
        if (h <= 0) {
          /* Si el golpe con el que desgastas es una victoria y ya lo hunde,
             pues lo hunde: no hay que reservar el remate para otro. Sólo
             perdiendo es imposible acabar con él. */
          if (g.gana) {
            const total = e.min + ranura;
            if (!salida || total < salida.min) {
              salida = { min: total,
                         pasos: e.pasos.concat([{ k: g.k, d: g.d, queda: 0, kit: false }]) };
            }
            continue;
          }
          h = 1;   // se desgasta pero no se destruye
        }

        let kit = e.kit, salta = false;
        if (kit && h <= R.KIT_EMERGENCIA) {
          h = Math.min(H, h + R.KIT_REPARA);
          kit = false;
          salta = true;
        }

        const min = e.min + g.min;
        const c = clave(h, kit);
        if (mejor[c] !== undefined && mejor[c] <= min) continue;
        mejor[c] = min;
        cola.push({ h: h, kit: kit, min: min,
                    pasos: e.pasos.concat([{ k: g.k, d: g.d, queda: h, kit: salta }]) });
      }
    }

    if (!salida) return { ok: false, inicio: inicio, conKit: !!conKit };

    const derrotas = salida.pasos.filter(p => !info[p.k].gana).length;
    return {
      ok: true, inicio: inicio, conKit: !!conKit,
      pasos: salida.pasos,
      minutos: salida.min,
      turnos: salida.min / TURNO,
      derrotas: derrotas,
      porTurno: porTurno,
      suAturde: suAturde,
      // lo que TE cuesta a ti de casco todo el plan, que no es poco
      tuCasco: salida.pasos.reduce((s, p) => s + Math.round(R.CASCO[p.k].yo * H), 0)
    };
  }

  /* Resuelve un plan contra UNA guardia concreta, para la simulación.
     Devuelve la lista de duelos con su daño. */
  function resolver(crew, plan, guardia, suyos){
    return plan.idx.map((k, i) => {
      const mio = crew[k], tac = plan.tac[i];
      const p = guardia[i];
      const concede = p.c === CONCEDE;
      const suyo = concede ? null : suyos[p.c];
      const suTac = concede ? null : T[p.t];
      const miPunto = R.score(mio, tac);
      const gano = concede ||
        R.duelWin(miPunto, tac, R.score(suyo, suTac), suTac);
      return { mio: mio, tac: tac, punto: miPunto,
               suyo: suyo, suTac: suTac, gano: gano, concede: concede };
    });
  }

  /* ============================================================
     TUS GUARDIAS CONTRA ÉL — el problema espejo
     ------------------------------------------------------------
     Aquí defiendes tú, y cambian tres cosas:

     1. El EMPATE ES TUYO. Defendiendo te basta con igualar, así que
        ganas el puesto si él no te supera estrictamente.
     2. Él elige UN plan de ataque y el servidor sortea UNA de tus
        guardias. O sea: él apunta a un sitio y tú repartes el riesgo
        entre tres. Lo que decide no es tener una guardia buenísima,
        sino que ninguna jugada suya se lleve varias a la vez.
     3. No sabes con qué va a atacar. Así que se mide contra TODOS los
        planes que podría montar con su tripulación.

     Se buscan las tres guardias que aguantan su MEJOR ataque, no su
     ataque medio: es el criterio seguro, y además es el que tiene
     sentido cuando el rival puede ir aprendiendo tus guardias a base
     de informes de combate.

     Con máscaras de bits sale directo: si A, B y C son los planes suyos
     que tumban cada una de tus tres guardias, entonces A&B&C son los
     que te tumban las tres, y (A&B)|(A&C)|(B&C) los que te tumban dos.
     Vacías esas dos y ninguna jugada suya te gana más de una de tres.
     ============================================================ */

  /* Los suyos que pueden atacar y los tuyos que pueden defender: en los
     dos casos, los mejores, porque nadie reparte a los flojos. */
  function nucleo(lista, tope){
    const dentro = {}, out = [];
    const mete = c => { if (!dentro[c.n]) { dentro[c.n] = true; out.push(c); } };
    T.forEach(t => lista.slice().sort((a, b) => R.score(b, t) - R.score(a, t))
                        .slice(0, 3).forEach(mete));
    lista.slice()
      .sort((a, b) => Math.max.apply(null, T.map(t => R.score(b, t))) -
                      Math.max.apply(null, T.map(t => R.score(a, t))))
      .forEach(mete);
    return out.slice(0, tope);
  }

  /* Todas las alineaciones de 3 (personajes distintos, en orden, cada uno
     con su táctica) que se pueden montar con esa gente. */
  function alineaciones(pool){
    const out = [];
    for (let a = 0; a < pool.length; a++)
    for (let b = 0; b < pool.length; b++){ if (b === a) continue;
    for (let c = 0; c < pool.length; c++){ if (c === a || c === b) continue;
      for (let x = 0; x < 3; x++)
      for (let y = 0; y < 3; y++)
      for (let z = 0; z < 3; z++)
        out.push({ c: [a, b, c], t: [x, y, z] });
    }}
    return out;
  }

  /* Igual, pero para un rival al que no le dan los personajes para llenar
     tres puestos: los que no puede cubrir los concede. */
  function alineacionesCon(pool){
    if (pool.length >= 3) return alineaciones(pool);
    const colocaciones = [];
    (function rec(pos, usados, actual){
      if (pos === 3) { colocaciones.push(actual.slice()); return; }
      rec(pos + 1, usados, actual.concat([CONCEDE]));
      for (let i = 0; i < pool.length; i++) {
        if (usados.indexOf(i) !== -1) continue;
        rec(pos + 1, usados.concat([i]), actual.concat([i]));
      }
    })(0, [], []);

    const out = [];
    colocaciones.forEach(cs => {
      for (let x = 0; x < 3; x++)
      for (let y = 0; y < 3; y++)
      for (let z = 0; z < 3; z++) out.push({ c: cs, t: [x, y, z] });
    });
    return out;
  }

  /* Regla del juego: quien repite entre guardias tiene que cambiar de
     fila. Dentro de una guardia ya van tres distintos por construcción. */
  function compatibles(g1, g2){
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (i === j && g1.c[i] === g2.c[j]) return false;
    return true;
  }

  /* ---------- la predicción del próximo ataque ----------
     La gente repite. Si un ataque le funcionó lo vuelve a mandar, y si le
     falló muchas veces lo intenta otra vez antes de cambiar. Así que su
     último ataque conocido no pesa como uno más entre mil: se le da un
     peso propio y el resto se reparte entre todo lo demás.

     Ganó  → 50 %. Repetir lo que funciona es lo más humano que hay.
     Falló → 25 %. Menos, pero muy por encima de una jugada cualquiera. */
  const PESO_GANO  = 0.5;
  const PESO_FALLO = 0.25;

  /* Sus mejores, más quien saliera en su último ataque aunque no esté
     entre los mejores: si lo mandó una vez, puede repetirlo. */
  function nucleoConAtaque(pool, rival, tope){
    const base = nucleo(pool, tope);
    const ult = window.RIVALES.ultimoAtaque(rival);
    if (ult) ult.p.forEach(p => {
      if (!p) return;
      const c = pool.find(x => x.n === p.n);
      if (c && base.indexOf(c) === -1) base.push(c);
    });
    return base;
  }

  /* Localiza su último ataque dentro de la lista de ataques posibles.
     Devuelve {i, w} con el índice y el peso, o null si no lo has apuntado
     entero (con un puesto en blanco no hay nada que predecir). */
  function ataqueRecordado(rival, suyos, ataques){
    const ult = window.RIVALES.ultimoAtaque(rival);
    if (!ult || !ult.p.every(Boolean)) return null;

    const c = [], t = [];
    for (let i = 0; i < 3; i++) {
      const p = ult.p[i];
      const k = suyos.findIndex(x => x.n === p.n);
      if (k === -1) return null;
      c.push(k);
      t.push(T.indexOf(p.t));
    }
    const i = ataques.findIndex(a =>
      a.c[0] === c[0] && a.c[1] === c[1] && a.c[2] === c[2] &&
      a.t[0] === t[0] && a.t[1] === t[1] && a.t[2] === t[2]);
    if (i === -1) return null;
    return { i: i, w: ult.w ? PESO_GANO : PESO_FALLO, gano: !!ult.w };
  }

  /* ---------- lo que aguantan UNAS guardias concretas ----------
     Para poder comparar las que tienes puestas con las que se recomiendan.
     `guardias` son filas de {c: personaje, t: táctica} o null. */
  function aguante(guardias, rival){
    if (!rival) return null;
    const RV = window.RIVALES;

    const caidos = {};
    rival.r.forEach(m => { if (m.e === RV.CAIDO) caidos[m.n] = true; });
    const nombres = [];
    const mete = n => {
      if (n && n !== RV.VACIO && !caidos[n] && nombres.indexOf(n) === -1) nombres.push(n);
    };
    rival.r.forEach(m => mete(m.n));
    rival.g.forEach(g => g.forEach(p => { if (p) mete(p.n); }));
    const todos = nombres.map(n => DB.find(c => c.n === n)).filter(Boolean);
    if (!todos.length) return null;

    const suyos = nucleoConAtaque(todos, rival, 5);
    const ataques = alineacionesCon(suyos);
    if (!ataques.length) return null;

    const usables = guardias.filter(g => g && g.every(Boolean));
    if (!usables.length) return null;

    const rec = ataqueRecordado(rival, suyos, ataques);
    const total = ataques.length;

    let suma = 0, peor = 0, sumaRec = 0;
    for (let k = 0; k < ataques.length; k++) {
      const at = ataques[k];
      let caen = 0;
      usables.forEach(g => {
        let mios3 = 0;
        for (let i = 0; i < 3; i++) {
          const suyo = at.c[i] === CONCEDE ? null : suyos[at.c[i]];
          // defendiendo, el empate es tuyo: ganas si él no te supera
          if (!suyo || !R.duelWin(R.score(suyo, T[at.t[i]]), T[at.t[i]],
                                  R.score(g[i].c, g[i].t), g[i].t)) mios3++;
        }
        if (mios3 < 2) caen++;
      });
      suma += caen;
      if (caen > peor) peor = caen;
      if (rec && k === rec.i) sumaRec = caen;
    }

    const nG = usables.length;
    const medioUniforme = suma / total;
    const medio = rec
      ? (1 - rec.w) * medioUniforme + rec.w * sumaRec
      : medioUniforme;

    return {
      media: 1 - medio / nG,
      peor:  1 - peor / nG,
      nG:    nG,
      ataques: total,
      rec:   rec ? { gano: rec.gano, peso: rec.w } : null
    };
  }

  function mejoresGuardias(crew, rival){
    if (!crew || crew.length < 3 || !rival) return null;

    const RV = window.RIVALES;
    const caidos = {};
    rival.r.forEach(m => { if (m.e === RV.CAIDO) caidos[m.n] = true; });

    const nombres = [];
    const mete = n => {
      if (n && n !== RV.VACIO && !caidos[n] && nombres.indexOf(n) === -1) nombres.push(n);
    };
    rival.r.forEach(m => mete(m.n));
    rival.g.forEach(g => g.forEach(p => { if (p) mete(p.n); }));
    const suyosTodos = nombres.map(n => DB.find(c => c.n === n)).filter(Boolean);
    if (suyosTodos.length < 1) return { vacio: true };

    const suyos = nucleoConAtaque(suyosTodos, rival, 5);
    const mios  = nucleo(crew, 6);

    // Cuántas guardias reparte el juego a TU tripulación.
    const nG = crew.length === 2 ? 2 : 3;

    /* Tabla: ¿gano yo el puesto? Defendiendo, el empate es mío, así que
       gano si él NO me supera. */
    const gano = [];
    for (let m = 0; m < mios.length; m++) {
      gano.push([]);
      for (let u = 0; u < 3; u++) {
        const miPunto = R.score(mios[m], T[u]);
        const fila = [];
        for (let s = 0; s < suyos.length; s++) {
          const col = [];
          for (let v = 0; v < 3; v++) {
            col.push(!R.duelWin(R.score(suyos[s], T[v]), T[v], miPunto, T[u]));
          }
          fila.push(col);
        }
        gano[m].push(fila);
      }
    }

    const ataques  = alineacionesCon(suyos);  // todo lo que él podría montar
    const defensas = alineaciones(mios);      // todo lo que tú podrías poner
    if (!ataques.length || !defensas.length) return { vacio: true };
    const rec = ataqueRecordado(rival, suyos, ataques);
    const words = Math.ceil(ataques.length / 32) || 1;

    /* ---------- las tres formas de atacar ----------
       De las 27 combinaciones de táctica de un trío, 3 son MONO (las tres
       iguales), 18 son DOS+UNA y 6 son UNA DE CADA. Optimizar contra las 27
       por igual da una defensa equilibrada, pero si en tu servidor la gente
       juega mono mucho más de lo que sale por azar, esa media está mal
       repartida.

       Así que se calculan las tres defensas —la mejor contra cada patrón— y
       se mide cada una contra los tres. El precio de especializarse se ve
       en la tabla en vez de decidirlo por ti. */
    const FAMILIAS = ['mono', 'dos', 'una'];

    const familiaDe = t => {
      if (t[0] === t[1] && t[1] === t[2]) return 0;                  // mono
      if (t[0] === t[1] || t[1] === t[2] || t[0] === t[2]) return 1; // 2+1
      return 2;                                                      // una de cada
    };

    const maskFam = [new Uint32Array(words), new Uint32Array(words), new Uint32Array(words)];
    const nFam = [0, 0, 0];
    for (let k = 0; k < ataques.length; k++) {
      const f = familiaDe(ataques[k].t);
      maskFam[f][k >> 5] |= (1 << (k & 31));
      nFam[f]++;
    }

    /* Para cada guardia tuya, los ataques suyos que la tumban. */
    const cand = defensas.map(d => {
      const w = new Uint32Array(words);
      let n = 0;
      for (let k = 0; k < ataques.length; k++) {
        const at = ataques[k];
        let puntos = 0;
        for (let i = 0; i < 3; i++) {
          // un puesto que él no puede cubrir te lo concede
          if (at.c[i] === CONCEDE || gano[d.c[i]][d.t[i]][at.c[i]][at.t[i]]) puntos++;
        }
        if (puntos < 2) { w[k >> 5] |= (1 << (k & 31)); n++; }
      }
      const f = R.score(mios[d.c[0]], T[d.t[0]])
              + R.score(mios[d.c[1]], T[d.t[1]])
              + R.score(mios[d.c[2]], T[d.t[2]]);
      const rep = rec ? ((w[rec.i >> 5] >>> (rec.i & 31)) & 1) : 0;
      // cuántos ataques de cada patrón la tumban, para poder medirla contra
      // uno solo sin tener que rehacer la máscara
      const nf = [0, 0, 0];
      for (let f = 0; f < 3; f++) {
        for (let k = 0; k < words; k++) nf[f] += popcount(w[k] & maskFam[f][k]);
      }
      return { d: d, w: w, n: n, nf: nf, f: f, rep: rep };
    });

    /* Las que menos caen, pero con tope por reparto de personajes: si no,
       las 400 primeras serían las 27 variantes de táctica del mismo trío
       en el mismo orden, y entonces ninguna pareja cumpliría la regla de
       repetición y no habría con qué formar las tres guardias. */
    cand.sort((a, b) => a.n - b.n);
    const top = [], cuantas = {};
    for (let i = 0; i < cand.length && top.length < 400; i++) {
      const k = cand[i].d.c.join(',');
      if ((cuantas[k] || 0) >= 6) continue;
      cuantas[k] = (cuantas[k] || 0) + 1;
      top.push(cand[i]);
    }

    const total  = ataques.length;
    const combos = nG === 2 ? 2 : 3;

    /* fam = -1 para las 27, o 0/1/2 para un patrón concreto. */
    const evalua = (grupo, fam) => {
      const fm = fam >= 0 ? maskFam[fam] : null;
      const tot = fam >= 0 ? nFam[fam] : ataques.length;
      const A = grupo[0].w, B = grupo[1].w, Cw = grupo.length > 2 ? grupo[2].w : null;
      let tres = 0, dos = 0, una = 0, suma = 0;
      for (let k = 0; k < words; k++) {
        const m = fm ? fm[k] : 0xFFFFFFFF;
        const a = A[k] & m, b = B[k] & m, c = Cw ? (Cw[k] & m) : 0;
        if (Cw) {
          tres += popcount(a & b & c);
          dos  += popcount((a & b) | (a & c) | (b & c));
          una  += popcount(a | b | c);
        } else {
          dos += popcount(a & b);
          una += popcount(a | b);
        }
      }
      let fuerza = 0, repCae = 0;
      grupo.forEach(x => {
        suma += fam >= 0 ? x.nf[fam] : x.n;
        fuerza += x.f;
        repCae += x.rep;
      });
      let peor, caenPeor;
      if (Cw && tres) { peor = 3; caenPeor = tres; }
      else if (dos)   { peor = 2; caenPeor = dos; }
      else if (una)   { peor = 1; caenPeor = una; }
      else            { peor = 0; caenPeor = 0; }
      /* Cuántas de tus guardias te tumba un ataque suyo, de media. Si has
         apuntado su último ataque, ese pesa aparte: la gente repite. */
      const coste = rec
        ? (1 - rec.w) * (suma / (tot || 1)) + rec.w * repCae
        : suma / (tot || 1);
      return { peor: peor, caenPeor: caenPeor, suma: suma,
               coste: coste, fuerza: fuerza };
    };

    /* Manda cuánto aguantas DE MEDIA, no el peor caso. El rival no ve tus
       guardias cuando ataca, así que optimizar contra su contra perfecta
       sería paranoia: te haría elegir guardias peores contra todo lo que
       de verdad te va a mandar. El peor caso se calcula igual y se enseña
       aparte, porque a base de informes de combate sí puede ir
       aprendiéndotelas. */
    const mejorQue = (a, b) => {
      if (!b) return true;
      if (Math.abs(a.coste - b.coste) > 1e-9) return a.coste < b.coste;  // cae menos
      if (a.peor !== b.peor) return a.peor < b.peor;      // y si te estudia, aguanta
      if (a.caenPeor !== b.caenPeor) return a.caenPeor < b.caenPeor;
      return a.fuerza > b.fuerza;                         // y con la gente mas fuerte
    };

    const encajan = (grupo, x) => grupo.every(g => compatibles(g.d, x.d));

    /* Búsqueda voraz con mejoras. Probarlas todas sería inviable, y
       quedarse con "las N mejores sueltas" tampoco vale: las mejores
       guardias suelen poner al mismo personaje en el mismo puesto, y
       entonces ninguna pareja cumple la regla de repetición. Así que se
       arranca de varias semillas distintas y luego se intenta mejorar
       cada guardia por separado. */
    const semillas = Math.min(top.length, 25);

    function busca(fam){
      let mejor = null;
      for (let s = 0; s < semillas; s++) {
        const grupo = [top[s]];
        while (grupo.length < combos) {
          let elegido = null, valor = null;
          for (let i = 0; i < top.length; i++) {
            if (grupo.indexOf(top[i]) !== -1 || !encajan(grupo, top[i])) continue;
            const v = evalua(grupo.concat([top[i]]), fam);
            if (!valor || mejorQue(v, valor)) { valor = v; elegido = top[i]; }
          }
          if (!elegido) break;
          grupo.push(elegido);
        }
        if (grupo.length < combos) continue;

        // mejoras: se intenta cambiar cada guardia por otra mejor
        for (let ronda = 0; ronda < 3; ronda++) {
          for (let g = 0; g < grupo.length; g++) {
            const resto = grupo.filter((_, k) => k !== g);
            let actual = evalua(grupo, fam), cambio = null;
            for (let i = 0; i < top.length; i++) {
              if (grupo.indexOf(top[i]) !== -1 || !encajan(resto, top[i])) continue;
              const v = evalua(resto.concat([top[i]]), fam);
              if (mejorQue(v, actual)) { actual = v; cambio = top[i]; }
            }
            if (cambio) grupo[g] = cambio;
          }
        }

        const v = evalua(grupo, fam);
        if (mejorQue(v, mejor)) mejor = Object.assign({ trio: grupo.slice() }, v);
      }
      return mejor;
    }

    /* Tres defensas: la mejor contra el patrón mono, la mejor contra el
       2+1 y la equilibrada (contra las 27 por igual). Cada una se mide
       después contra los tres patrones, que es lo que deja ver el precio
       de especializarse. */
    /* No hay opción «contra 2+1» y no es un olvido: de las 27 combinaciones,
       18 son 2+1, o sea dos tercios de todo lo que te pueden mandar. La
       equilibrada ya está dominada por ese patrón, así que afinar contra él
       devolvía las mismas guardias y un botón que no hacía nada. Las dos
       especializaciones que sí cambian algo son mono y una-de-cada. */
    const CUALES = [
      { clave: 'equilibrada', fam: -1 },
      { clave: 'mono',        fam: 0  },
      { clave: 'una',         fam: 2  }
    ];

    const hallado = CUALES.map(c => ({ clave: c.clave, fam: c.fam, r: busca(c.fam) }))
                          .filter(x => x.r);
    if (!hallado.length) return { vacio: true };
    const mejor = hallado[0].r;

    /* ---------- el banquillo ----------
       Las tres guardias no son toda la defensa: el juego deja además dos
       reservas, y entran por cualquiera que esté CAÍDO cuando empiece el
       combate. Recomendarlas es parte del trabajo.

       Dos reglas de la guía las acotan: una reserva NO puede estar además
       defendiendo, y la misma persona no puede ocupar los dos huecos. Así
       que se elige entre los que no han entrado en ninguna guardia.

       Como no se sabe qué puesto quedará vacío ni contra quién, se mide lo
       único que se puede medir: contra todo lo que él es capaz de mandar,
       en cualquiera de los tres puestos, qué parte de esos duelos gana.
       Defendiendo el empate es tuyo, igual que en las guardias. */
    const veces = suyos.map(() => [0, 0, 0]);
    let concedidos = 0, puestosTotales = 0;
    for (let k = 0; k < ataques.length; k++) {
      const at = ataques[k];
      for (let i = 0; i < 3; i++) {
        puestosTotales++;
        if (at.c[i] === CONCEDE) concedidos++;
        else veces[at.c[i]][at.t[i]]++;
      }
    }

    function banquilloDe(trio){
      const enGuardia = {};
      trio.forEach(x => x.d.c.forEach(i => { enGuardia[mios[i].n] = true; }));

      const notas = [];
      crew.forEach(c => {
        if (enGuardia[c.n]) return;
        for (let u = 0; u < 3; u++) {
          const miPunto = R.score(c, T[u]);
          let ganados = concedidos;
          for (let s = 0; s < suyos.length; s++) {
            for (let v = 0; v < 3; v++) {
              if (!veces[s][v]) continue;
              if (!R.duelWin(R.score(suyos[s], T[v]), T[v], miPunto, T[u])) {
                ganados += veces[s][v];
              }
            }
          }
          notas.push({ c: c, t: T[u], pts: miPunto,
                       tasa: puestosTotales ? ganados / puestosTotales : 0 });
        }
      });
      notas.sort((a, b) => (b.tasa - a.tasa) || (b.pts - a.pts));

      const banco = [], yaEsta = {};
      for (let i = 0; i < notas.length && banco.length < RESERVAS; i++) {
        if (yaEsta[notas[i].c.n]) continue;   // uno no cubre dos huecos
        yaEsta[notas[i].c.n] = true;
        banco.push(notas[i]);
      }
      return { banco: banco, libres: crew.filter(c => !enGuardia[c.n]).length };
    }

    /* Cada defensa medida contra los tres patrones. Sin el peso del último
       ataque apuntado: ese pertenece a una familia concreta y metido en la
       medida de las otras dos falsearía la comparación. */
    const contraFamilia = (trio, f) => {
      let cae = 0;
      trio.forEach(g => { cae += g.nf[f]; });
      return 1 - (cae / (nFam[f] || 1)) / combos;
    };

    const opciones = hallado.map(x => {
      const b = banquilloDe(x.r.trio);
      const contra = {};
      FAMILIAS.forEach((nombre, f) => { contra[nombre] = contraFamilia(x.r.trio, f); });
      return {
        clave: x.clave,
        guardias: x.r.trio.map(g => ({
          puestos: [0, 1, 2].map(i => ({ c: mios[g.d.c[i]], t: T[g.d.t[i]] })),
          cae: g.n
        })),
        reservas: b.banco,
        libres:   b.libres,
        // lo que aguantas si él juega su mejor plan, y si lo elige al azar
        peor:   1 - x.r.peor / combos,
        media:  1 - x.r.coste / combos,
        contra: contra,
        inmune: x.r.peor === 0
      };
    });

    /* Dos defensas pueden salir idénticas —pasa cuando afinar no aporta
       nada contra ese rival— y hay que decirlo: si no, parece que el botón
       está roto. */
    const firma = o => o.guardias
      .map(g => g.puestos.map(p => p.c.n + '|' + p.t).join(',')).join(' / ');
    const deBase = firma(opciones[0]);
    opciones.forEach((o, i) => { o.igualBase = i > 0 && firma(o) === deBase; });

    const base = opciones[0];   // la equilibrada: la de toda la vida

    return {
      // lo de siempre apunta a la equilibrada, para no romper nada
      guardias: base.guardias,
      reservas: base.reservas,
      libres:   base.libres,
      peor:     base.peor,
      media:    base.media,
      inmune:   base.inmune,
      // y las tres, con lo que hace falta para comparar
      opciones: opciones,
      familias: FAMILIAS,
      cuantas:  { mono: nFam[0], dos: nFam[1], una: nFam[2] },
      rec:   rec ? { gano: rec.gano, peso: rec.w } : null,
      nG: combos,
      ataques: total,
      suyos: suyos
    };
  }

  return {
    CONCEDE: CONCEDE,
    evaluar: evaluar,
    comoHundirlo: comoHundirlo,
    resolver: resolver,
    formaciones: formaciones,
    aguante: aguante,
    patronesTactica: patronesTactica,
    mejoresGuardias: mejoresGuardias
  };
})();
