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
     Un puesto cuyo personaje esté CAÍDO se marca como desconocido: en su
     lugar entrará una reserva que no sabes cuál es. */
  function observado(rival, idx, caidos){
    const out = [];
    for (let j = 0; j < rival.g.length; j++) {
      const fila = [];
      for (let i = 0; i < 3; i++) {
        const p = rival.g[j][i];
        if (!p) { fila.push(null); continue; }
        if (p.n === window.RIVALES.VACIO) { fila.push({ c: CONCEDE, t: 0 }); continue; }
        if (caidos[p.n]) { fila.push(null); continue; }   // entra una reserva
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
  function evaluar(crew, rival){
    if (!crew || crew.length < 3 || !rival) return null;

    const RV = window.RIVALES;
    const nG = RV.nGuardias(rival);

    // Los suyos que pueden defender. Si no has apuntado su tripulación,
    // se usa a quien le hayas visto en las guardias.
    const caidos = {};
    rival.r.forEach(m => { if (m.e === RV.CAIDO) caidos[m.n] = true; });

    const nombres = [];
    const mete = n => {
      if (n && n !== RV.VACIO && !caidos[n] && nombres.indexOf(n) === -1) nombres.push(n);
    };
    rival.r.forEach(m => mete(m.n));
    rival.g.forEach(g => g.forEach(p => { if (p) mete(p.n); }));

    const suyos = nombres.map(n => DB.find(c => c.n === n)).filter(Boolean);

    // índice de personaje rival -> posición en `suyos`
    const idx = {};
    suyos.forEach((c, i) => { idx[c.n] = i; });

    const obs   = observado(rival, idx, caidos);
    const nApun = apuntados(obs);

    let forms = formaciones(suyos, nG, obs);
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

    /* --- se prueban todos los planes --- */
    let mejor = null;
    const n = crew.length;
    const tmp = new Uint32Array(words);

    for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++){ if (b === a) continue;
    for (let c = 0; c < n; c++){ if (c === a || c === b) continue;
      for (let x = 0; x < 3; x++){
        const w1 = mask[a][x][0];
        for (let y = 0; y < 3; y++){
          const w2 = mask[b][y][1];
          for (let z = 0; z < 3; z++){
            const w3 = mask[c][z][2];
            let ganadas = 0, duelos = 0;
            for (let k = 0; k < words; k++){
              const p = w1[k], q = w2[k], r = w3[k];
              // al menos dos de las tres posiciones
              tmp[k] = (p & q) | (p & r) | (q & r);
              ganadas += popcount(tmp[k]);
              duelos  += popcount(p) + popcount(q) + popcount(r);
            }
            /* Tercer desempate: la puntuación del trío. Muchos planes
               empatan en resultado, y sin esto se quedaba con el primero
               que salía del bucle — por eso aparecía gente floja pudiendo
               mandar a alguien mejor que hacía exactamente lo mismo. */
            const fuerza = puntosDe[a][x] + puntosDe[b][y] + puntosDe[c][z];
            if (!mejor || ganadas > mejor.ganadas ||
                (ganadas === mejor.ganadas &&
                  (duelos > mejor.duelos ||
                    (duelos === mejor.duelos && fuerza > mejor.fuerza)))){
              mejor = { ganadas: ganadas, duelos: duelos, fuerza: fuerza,
                        idx: [a, b, c], tac: [T[x], T[y], T[z]] };
            }
          }
        }
      }
    }}

    return {
      plan:  mejor,
      tasa:  mejor ? mejor.ganadas / pares : 0,
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

    const suyos = nucleo(suyosTodos, 5);
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
    const words = Math.ceil(ataques.length / 32) || 1;

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
      return { d: d, w: w, n: n, f: f };
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

    const evalua = grupo => {
      const A = grupo[0].w, B = grupo[1].w, Cw = grupo.length > 2 ? grupo[2].w : null;
      let tres = 0, dos = 0, una = 0, suma = 0;
      for (let k = 0; k < words; k++) {
        const a = A[k], b = B[k], c = Cw ? Cw[k] : 0;
        if (Cw) {
          tres += popcount(a & b & c);
          dos  += popcount((a & b) | (a & c) | (b & c));
          una  += popcount(a | b | c);
        } else {
          dos += popcount(a & b);
          una += popcount(a | b);
        }
      }
      let fuerza = 0;
      grupo.forEach(x => { suma += x.n; fuerza += x.f; });
      let peor, caenPeor;
      if (Cw && tres) { peor = 3; caenPeor = tres; }
      else if (dos)   { peor = 2; caenPeor = dos; }
      else if (una)   { peor = 1; caenPeor = una; }
      else            { peor = 0; caenPeor = 0; }
      return { peor: peor, caenPeor: caenPeor, suma: suma, fuerza: fuerza };
    };

    /* Manda cuánto aguantas DE MEDIA, no el peor caso. El rival no ve tus
       guardias cuando ataca, así que optimizar contra su contra perfecta
       sería paranoia: te haría elegir guardias peores contra todo lo que
       de verdad te va a mandar. El peor caso se calcula igual y se enseña
       aparte, porque a base de informes de combate sí puede ir
       aprendiéndotelas. */
    const mejorQue = (a, b) => {
      if (!b) return true;
      if (a.suma !== b.suma) return a.suma < b.suma;      // cae menos veces
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
    let mejor = null;
    const semillas = Math.min(top.length, 25);

    for (let s = 0; s < semillas; s++) {
      const grupo = [top[s]];
      while (grupo.length < combos) {
        let elegido = null, valor = null;
        for (let i = 0; i < top.length; i++) {
          if (grupo.indexOf(top[i]) !== -1 || !encajan(grupo, top[i])) continue;
          const v = evalua(grupo.concat([top[i]]));
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
          let actual = evalua(grupo), cambio = null;
          for (let i = 0; i < top.length; i++) {
            if (grupo.indexOf(top[i]) !== -1 || !encajan(resto, top[i])) continue;
            const v = evalua(resto.concat([top[i]]));
            if (mejorQue(v, actual)) { actual = v; cambio = top[i]; }
          }
          if (cambio) grupo[g] = cambio;
        }
      }

      const v = evalua(grupo);
      if (mejorQue(v, mejor)) mejor = Object.assign({ trio: grupo.slice() }, v);
    }
    if (!mejor) return { vacio: true };

    return {
      guardias: mejor.trio.map(x => ({
        puestos: [0, 1, 2].map(i => ({ c: mios[x.d.c[i]], t: T[x.d.t[i]] })),
        cae: x.n
      })),
      // lo que aguantas si él juega su mejor plan, y si lo elige al azar
      peor:  1 - mejor.peor / combos,
      media: 1 - mejor.suma / (combos * total),
      nG: combos,
      ataques: total,
      suyos: suyos,
      // de cuántos planes suyos se defiende del todo
      inmune: mejor.peor === 0
    };
  }

  return {
    CONCEDE: CONCEDE,
    evaluar: evaluar,
    resolver: resolver,
    formaciones: formaciones,
    patronesTactica: patronesTactica,
    mejoresGuardias: mejoresGuardias
  };
})();
