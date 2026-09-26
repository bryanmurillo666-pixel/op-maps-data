/* ============================================================
   OP-MAPS DATA — página PvE
   ------------------------------------------------------------
   Los números fijos salen de la guía v5.1; los de "tu situación"
   se calculan con lo que escribas y con tu tripulación guardada.
   ============================================================ */
(function () {

  const R = window.RULES;
  const C = window.CREW;

  /* Las constantes del PvE, de la guía v5.1. Están aquí y no en rules.js
     porque solo las usa esta página; si algún día las necesita otra, se
     mudan. */
  const PVE = {
    ORO_GANAR:  5000,
    ORO_PERDER: 500,
    OFERTA:     0.8,     // solo se tira si has ganado
    CASCO:      525,     // daño al casco por derrota, sea 2-1 o 3-0
    VIDA:       0.34,    // vida que pierde quien PIERDE su duelo
    VIDA_GANAR: 0.08,    // y la que pierde quien lo GANA: ganar también duele
    CONTRA:     0.6,     // ×0.6 al daño recibido si contrarrestaste su táctica
    MUSICO:     0.5,     // un Músico en pie parte el aturdimiento por la mitad
    ATURDE:     90       // minutos
  };

  const DB = window.CHARACTERS;

  /* Los mares en orden de viaje: primero los cuatro Blues, luego Grand Line
     y al final el New World. En los datos van en otro orden, así que aquí
     se traduce a índices. */
  const ORDEN_MARES = ['East Blue', 'West Blue', 'North Blue', 'South Blue', 'Grand Line', 'New World'];
  const maresEnOrden = () => ORDEN_MARES
    .map(nombre => window.ISLAND_SEAS.indexOf(nombre))
    .filter(i => i !== -1);

  const els = {
    mar:     document.getElementById('mar'),
    isla:    document.getElementById('isla'),
    combate: document.getElementById('combate'),
    fijos:   document.getElementById('fijos'),
    viaje:      document.getElementById('viaje'),
    donde:      document.getElementById('donde'),
    islaHint:   document.getElementById('islaHint'),
    islasLista: document.getElementById('islasLista'),
    pjLista:    document.getElementById('pjLista'),
    editor:     document.getElementById('editor'),
    edCount:    document.getElementById('edCount')
  };

  /* Las que el usuario marca como gordas: salen en rojo en la lista y
     al elegirlas. Van aqui y no en islands.js porque no es un dato del
     juego, es una seniala suya. */
  const ROJAS = ['Fish-man island', 'Whole Cake island', 'Zou',
                 'Wano kingdom', 'Elbaf'];
  const esRoja = isla => ROJAS.indexOf(isla.n) !== -1;

  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';

  function num(n, dec){
    return Number(n).toLocaleString(isES() ? 'es-ES' : 'en-GB', {
      minimumFractionDigits: dec || 0,
      maximumFractionDigits: dec || 0
    });
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g, m => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
    ));
  }

  const nameOf = c => (isES() && c.es) ? c.es : c.n;

  /* Casi ninguna isla necesita traducción —se llaman igual en los dos
     idiomas— así que sólo las que traen `es` cambian de nombre. Pero la
     IDENTIDAD de una isla es siempre `n`: es lo que guarda el editor y
     lo que empareja las correcciones, pase lo que pase con el idioma. */
  const nombreIsla = isla => (isES() && isla.es) ? isla.es : isla.n;

  function kpi(valor, etiqueta, nota){
    return `<div class="kpi-box">
      <b>${valor}</b>
      <span>${esc(etiqueta)}</span>
      ${nota ? `<em>${esc(nota)}</em>` : ''}
    </div>`;
  }

  /* ============================================================
     EL COMBATE DE LA ISLA
     Los enemigos son fijos y el orden también: su primero pelea contra
     tu posición 1. Lo único al azar es la táctica de cada uno, así que
     no hace falta simular: para cada posición se cuenta a cuántas de sus
     tres tácticas le ganas, y de ahí sale la probabilidad exacta de
     llevarse 2 de los 3 duelos.

     CONFIRMADO por el usuario (22 ago 2026): las tácticas de los tres
     salen al azar SIN relación entre ellas, y los enemigos mantienen
     su orden. O sea que los tres duelos son independientes, que es
     justo lo que supone la fórmula de aquí abajo.
     ============================================================ */

  /* Cuántas de las 3 tácticas del enemigo gana este personaje con esta
     táctica suya. Devuelve 0, 1, 2 o 3. */
  function ganadas(mio, miTac, enemigo){
    const miPunto = R.score(mio, miTac);
    const suyas = R.scores(enemigo);
    let n = 0;
    for (const suTac of R.TACTICS) {
      if (R.duelWin(miPunto, miTac, suyas[suTac], suTac)) n++;
    }
    return n;
  }

  /* Lo que le cuesta el duelo a este personaje, en puntos de vida.
     Ganar el duelo también duele (8 %), perderlo cuesta el 34 %, y haber
     contrarrestado la táctica rival rebaja al 60 % lo que toque: el
     contador te protege incluso cuando pierdes. */
  function dano(c, miTac, suTac, gano){
    const base = gano ? PVE.VIDA_GANAR : PVE.VIDA;
    const mult = R.beats(miTac, suTac) ? PVE.CONTRA : 1;
    return R.health(c) * base * mult;
  }

  /* Daño medio de ese puesto: la táctica del enemigo es un sorteo limpio
     entre sus tres, así que se promedian los tres desenlaces posibles. */
  function danoMedio(c, miTac, enemigo){
    const suyas = R.scores(enemigo);
    let suma = 0;
    for (const suTac of R.TACTICS) {
      const gano = R.duelWin(R.score(c, miTac), miTac, suyas[suTac], suTac);
      suma += dano(c, miTac, suTac, gano);
    }
    return suma / R.TACTICS.length;
  }

  /* Probabilidad de ganar el combate a partir de las tres probabilidades
     de duelo: hay que llevarse al menos dos. */
  function dosDeTres(p){
    return p[0]*p[1]*p[2]
         + p[0]*p[1]*(1-p[2])
         + p[0]*(1-p[1])*p[2]
         + (1-p[0])*p[1]*p[2];
  }

  /* La mejor alineación: como cada posición solo pelea contra su enemigo,
     se calcula la mejor táctica de cada uno contra cada puesto y luego se
     prueban todas las formas de repartir tres personajes distintos. */
  function mejorAlineacion(crew, enemigos){
    /* La mejor táctica de cada uno contra cada enemigo. A igualdad de
       tácticas ganadas se queda con la de más puntuación: si no, ganaba
       siempre Asalto por ser la primera de la lista. */
    const mejor = crew.map(c => enemigos.map(en => {
      let top = { tac: R.TACTICS[0], gana: -1, punto: -1 };
      for (const tac of R.TACTICS) {
        const g = ganadas(c, tac, en);
        const punto = R.score(c, tac);
        if (g > top.gana || (g === top.gana && punto > top.punto)) {
          top = { tac: tac, gana: g, punto: punto };
        }
      }
      return top;
    }));

    // lo fuerte que es cada enemigo en su mejor táctica
    const duro = enemigos.map(en =>
      Math.max.apply(null, R.TACTICS.map(tac => R.score(en, tac))));

    let salida = null;
    for (let a = 0; a < crew.length; a++)
      for (let b = 0; b < crew.length; b++) {
        if (b === a) continue;
        for (let c = 0; c < crew.length; c++) {
          if (c === a || c === b) continue;
          const trio = [mejor[a][0], mejor[b][1], mejor[c][2]];
          const p = dosDeTres(trio.map(x => x.gana / 3));
          // A igualdad de probabilidad, la que gana más duelos sueltos:
          // cada duelo perdido cuesta el 34 % de la vida de ese tripulante.
          const duelos = trio[0].gana + trio[1].gana + trio[2].gana;
          /* Y en tercer lugar, la puntuación del trío. Muchísimas
             alineaciones empatan en todo lo demás, y sin esto se quedaba
             con la primera que salía del bucle — o sea, con el orden en
             que metiste la tripulación. Por eso aparecía gente floja
             pudiendo mandar a alguien mejor que hacía lo mismo. */
          const fuerza = trio[0].punto + trio[1].punto + trio[2].punto;
          /* Cuarto criterio, para cuando dos de los tuyos son
             intercambiables (los dos ganan las 3 tácticas de su enemigo y
             la suma no los distingue): se empareja al más fuerte tuyo con
             el enemigo más fuerte. Maximizar la suma de los productos hace
             justo eso, y deja el mayor margen donde más apretado está. */
          const pareo = trio[0].punto * duro[0]
                      + trio[1].punto * duro[1]
                      + trio[2].punto * duro[2];
          const mejorQue =
            !salida ||
            p > salida.prob + 1e-12 ||
            (p > salida.prob - 1e-12 &&
              (duelos > salida.duelos ||
                (duelos === salida.duelos &&
                  (fuerza > salida.fuerza ||
                    (fuerza === salida.fuerza && pareo > salida.pareo)))));
          if (mejorQue) {
            salida = { prob: p, duelos: duelos, fuerza: fuerza, pareo: pareo,
                       idx: [a, b, c], puestos: trio };
          }
        }
      }
    return salida;
  }

  function combateHTML(){
    const idx = islaElegida();
    if (idx === -1) return '';

    const isla = window.ISLANDS[idx];
    /* Las gordas se avisan antes de nada: es lo primero que quieres saber
       al abrirlas. */
    const aviso = esRoja(isla)
      ? `<p class="isla-gorda">${t('pve.isla.gordaD')
          .replace('{n}', esc(nombreIsla(isla)))}</p>`
      : '';
    /* Sin enemigos no es una isla sin combate: es una isla que aun no se
       ha comprobado en el juego. El texto lleva negrita, asi que va sin
       escapar, como los demas mensajes con formato. */
    if (!isla.e.length) return aviso + `<p class="hint">${t('pve.isla.base')}</p>`;

    const enemigos = isla.e.map(n => DB.find(c => c.n === n));

    /* Un enemigo que no está en el álbum. Pasa cuando el juego mete gente
       nueva y el álbum de aquí es de antes: el export de islas ya los
       nombra y aquí todavía no existen. Sin esto la página reventaba al
       abrir esa isla, que es la peor forma de enterarse.

       No se vacía la isla ni se le quitan los otros dos: el nombre es
       información buena y sirve en cuanto se vuelva a exportar el álbum.
       Lo que no se puede es calcular, así que se dice y ya. */
    const sinFicha = isla.e.filter((n, i) => !enemigos[i]);
    if (sinFicha.length) {
      return `<p class="hint">${t('pve.isla.sinFicha')
        .replace('{n}', esc(sinFicha.join(', ')))}</p>`;
    }

    const cabecera = aviso + `<h3 class="sub-tit">${esc(t('pve.isla.enemies'))}</h3>
      <div class="party">${enemigos.map((c, i) => {
        const mejor = R.bestTactic(c);
        return `<div class="party-box">
          <b>${i + 1} · ${esc(nameOf(c))}</b>
          <span>${esc(t('rn.' + c.r))}</span>
          <em class="neutro">${esc(t('tac.' + mejor))} ${num(R.score(c, mejor))}</em>
        </div>`;
      }).join('')}</div>`;

    const crew = C.personajes();
    if (crew.length < 3) {
      ultimaAlineacion = null;
      return cabecera + `<p class="hint">${esc(t(crew.length ? 'pve.isla.few' : 'pve.isla.noCrew'))}</p>`;
    }

    const ali = mejorAlineacion(crew, enemigos);
    ultimaAlineacion = { crew: crew, enemigos: enemigos, ali: ali };

    /* Misma forma que el plan de ataque del PvP: la táctica como pastilla
       de color al lado del nombre, el rol debajo, y a la derecha contra
       quién peleas con cuántas de sus tres tácticas le ganas. */
    const seg = x => x === 'Assault' ? 'f' : (x === 'Manoeuvre' ? 'v' : 'i');

    const filas = ali.idx.map((k, i) => {
      const c = crew[k], puesto = ali.puestos[i];
      const daño = danoMedio(c, puesto.tac, enemigos[i]);
      const clase = puesto.gana === 3 ? 'vs-gano'
                  : (puesto.gana ? 'vs-mix' : 'vs-perdio');
      return `<div class="linea">
        <span class="pos">${i + 1}</span>
        <span class="quien">
          <span class="quien-top">
            <b>${esc(nameOf(c))}</b>
            <span class="tac-pill tac-${seg(puesto.tac)}">${esc(t('tac.' + puesto.tac))} · ${num(R.score(c, puesto.tac))}</span>
          </span>
          <i>${esc(t('rn.' + c.r))} · −${num(daño, 1)} ${esc(t('pve.isla.dmg'))}</i>
        </span>
        <span class="contras">
          <span class="vs ${clase}">${esc(nameOf(enemigos[i]))} ${puesto.gana}/3</span>
        </span>
      </div>`;
    }).join('');

    return `${cabecera}
      <h3 class="sub-tit">${esc(t('pve.isla.prob'))}</h3>
      <p class="gran-prob ${ali.prob >= 0.6 ? 'win-hi' : (ali.prob >= 0.34 ? 'win-mid' : 'win-lo')}">${num(ali.prob * 100)} %</p>
      <h3 class="sub-tit">${esc(t('pve.isla.line'))}</h3>
      <div class="alineacion">${filas}</div>

      <button class="btn-calc" id="simBtn" type="button">${esc(t('pve.sim.btn'))}</button>
      <div id="simOut"></div>

      <p class="note">${t('pve.isla.how')}</p>
      <p class="note">${t('pve.isla.why21')}</p>
`;
  }

  /* ============================================================
     SIMULAR UN DESEMBARCO
     Se sortea la táctica de cada enemigo, se resuelven los tres duelos
     con la alineación recomendada y, si se gana, se tira la oferta de
     tripulante: 80 % y, si sale, mira 5 personajes al azar y ofrece uno
     que no tengas.
     ============================================================ */

  let ultimaAlineacion = null;   // la que se está enseñando

  const alAzar = lista => lista[Math.floor(Math.random() * lista.length)];

  function simularHTML(){
    if (!ultimaAlineacion) return '';
    const { crew, enemigos, ali } = ultimaAlineacion;

    let ganados = 0;
    const duelos = ali.idx.map((k, i) => {
      const mio = crew[k], suTac = alAzar(R.TACTICS), miTac = ali.puestos[i].tac;
      const gano = R.duelWin(R.score(mio, miTac), miTac,
                             R.score(enemigos[i], suTac), suTac);
      if (gano) ganados++;
      return { mio: mio, miTac: miTac, suyo: enemigos[i], suTac: suTac,
               gano: gano,
               dmg: dano(mio, miTac, suTac, gano),
               contra: R.beats(miTac, suTac) };
    });

    const gana = ganados >= 2;

    // La oferta solo se tira si has ganado.
    let oferta = null, hayOferta = false;
    if (gana && Math.random() < PVE.OFERTA) {
      const fuera = crew.map(c => c.n);
      const posibles = DB.filter(c => fuera.indexOf(c.n) === -1);
      if (posibles.length) {
        // el juego mira una muestra de 5 y ofrece uno de ellos
        const muestra = [];
        while (muestra.length < 5 && muestra.length < posibles.length) {
          const c = alAzar(posibles);
          if (muestra.indexOf(c) === -1) muestra.push(c);
        }
        oferta = alAzar(muestra);
        hayOferta = true;
      }
    }

    const filas = duelos.map((d, i) => `<div class="duelo ${d.gano ? 'gano' : 'perdio'}">
      <span class="pos">${i + 1}</span>
      <span class="lado">
        <b>${esc(nameOf(d.mio))}</b>
        <i>${esc(t('tac.' + d.miTac))} · −${num(d.dmg, 1)}${d.contra ? ' ×' + num(PVE.CONTRA, 1) : ''}</i>
      </span>
      <span class="marca">${d.gano ? '▸' : '◂'}</span>
      <span class="lado der">
        <b>${esc(nameOf(d.suyo))}</b><i>${esc(t('tac.' + d.suTac))}</i>
      </span>
    </div>`).join('');

    /* Ganar también cuesta vida desde la v5.0, así que el desgaste se
       enseña ganes o pierdas. El Músico solo recorta el aturdimiento si
       sigue en pie al acabar; aquí no se lleva la vida real de nadie, así
       que se da por hecho que lo está. */
    const vidaTot = duelos.reduce((s, d) => s + d.dmg, 0);
    const musico  = crew.some(c => c.r === 'Musician');
    const aturde  = musico ? Math.floor(PVE.ATURDE * PVE.MUSICO) : PVE.ATURDE;

    const premio = gana
      ? `<p class="botin gana">+${num(PVE.ORO_GANAR)} ${esc(t('u.gold'))} · +1 ${esc(t('pve.k.victory')).toLowerCase()}</p>
         <p class="botin ${hayOferta ? 'gana' : 'neutro'}">${
            hayOferta
              ? `${esc(t('pve.sim.offer'))}: <b>${esc(nameOf(oferta))}</b> · ${esc(t('rn.' + oferta.r))} · ${num(R.price(oferta))} ${esc(t('u.gold'))}`
              : esc(t('pve.sim.noOffer'))
          }</p>`
      : `<p class="botin pierde">−${num(PVE.ORO_PERDER)} ${esc(t('u.gold'))} · −${num(PVE.CASCO)} ${esc(t('pve.k.hull')).toLowerCase()} · ${aturde} ${esc(t('u.min'))}${musico ? ' · ' + esc(t('pve.sim.musician')) : ''}</p>`;

    return `<div class="sim-caja">
      <p class="sim-res ${gana ? 'win-hi' : 'win-lo'}">
        ${ganados}-${3 - ganados} · ${esc(t(gana ? 'pve.sim.win' : 'pve.sim.lose'))}
      </p>
      <div class="duelos">${filas}</div>
      ${premio}
      <p class="botin neutro">−${num(vidaTot, 1)} ${esc(t('pve.sim.health'))}</p>
      <p class="note">${esc(t('pve.sim.offerNote'))}</p>
    </div>`;
  }

  /* ============================================================
     ELEGIR LA ISLA
     Es un campo de texto con datalist: se escribe y el navegador
     filtra. Hay 158 islas, y un desplegable de 158 se recorre fatal.
     El valor del campo es el NOMBRE, que es único, y de ahí sale el
     índice.
     ============================================================ */

  function llenarMares(){
    const antes = els.mar.value;
    els.mar.innerHTML = `<option value="">${esc(t('pve.isla.allSeas'))}</option>` +
      maresEnOrden().map(m =>
        `<option value="${m}">${esc(window.ISLAND_SEAS[m])}</option>`).join('');
    if (antes) els.mar.value = antes;
  }

  /* El índice de la isla escrita, o -1. Se admite el nombre tal cual y
     también con el «· pendiente» pegado detrás, por si el navegador lo
     copia al elegir. Lo usan los dos buscadores: el de a dónde vas y el
     de dónde estás. */
  function indiceDe(texto){
    const escrito = String(texto == null ? '' : texto)
      .trim().replace(/\s*·.*$/, '').trim();
    if (!escrito) return -1;
    /* Se busca por los dos nombres: el del archivo y el traducido. Si no,
       en español no encontrarías una isla escribiendo lo que la página te
       acaba de enseñar. */
    const bajo = escrito.toLowerCase();
    const como = isla => [isla.n, isla.es || ''];
    let i = window.ISLANDS.findIndex(isla => como(isla).indexOf(escrito) !== -1);
    if (i === -1) {
      i = window.ISLANDS.findIndex(isla =>
        como(isla).some(x => x && x.toLowerCase() === bajo));
    }
    return i;
  }

  const islaElegida = () => indiceDe(els.isla.value);

  /* Las opciones del datalist, filtradas por el mar elegido. El nombre
     va en value porque es lo que se escribe; el mar va en label, que el
     navegador enseña al lado. */
  function llenarIslas(){
    const filtro = els.mar.value;
    const soloMar = filtro === '' ? null : Number(filtro);

    els.islasLista.innerHTML = window.ISLANDS.map(isla => {
      if (soloMar !== null && isla.m !== soloMar) return '';
      const mar = window.ISLAND_SEAS[isla.m];
      const marca = (isla.e.length ? '' : ' · ' + t('pve.isla.pend'))
                  + (esRoja(isla) ? ' · ' + t('pve.isla.gorda') : '');
      return `<option value="${esc(nombreIsla(isla))}" label="${esc(mar + marca)}"></option>`;
    }).join('');

    /* Si al cambiar de mar la isla escrita ya no está en la lista, se
       limpia: más vale el campo vacío que un nombre que el filtro
       contradice. */
    const i = islaElegida();
    if (i !== -1 && soloMar !== null && window.ISLANDS[i].m !== soloMar) {
      els.isla.value = '';
    }
  }

  /* ---------- los números fijos ---------- */

  /* Lo fijo, todo en una fila: primero lo que se gana, luego lo neutral y
     al final lo que se pierde. Las cabeceras se estiran por encima de sus
     cajas con grid-column. */
  function fijosHTML(){
    const caja = (valor, etiqueta, clase) =>
      `<div class="kpi-box ${clase}"><b>${valor}</b><span>${esc(etiqueta)}</span></div>`;

    const pct = x => '−' + num(x * 100) + ' %';

    return `<div class="fila-fija">
      <h4 class="gana"   style="grid-column:span 2">${esc(t('pve.col.win'))}</h4>
      <h4 class="neutro" style="grid-column:span 3">${esc(t('pve.col.mid'))}</h4>
      <h4 class="pierde" style="grid-column:span 4">${esc(t('pve.col.lose'))}</h4>

      ${caja('+' + num(PVE.ORO_GANAR), t('pve.k.gold') + ' · ' + t('u.gold'), 'gana')}
      ${caja('+1', t('pve.k.victory'), 'gana')}
      ${caja('80 %', t('pve.k.offer'), 'neutro')}
      ${caja(pct(PVE.VIDA_GANAR), t('pve.k.charWin'), 'neutro')}
      ${caja('×' + num(PVE.CONTRA, 1), t('pve.k.counter'), 'neutro')}
      ${caja('−' + num(PVE.ORO_PERDER), t('pve.k.goldLoss') + ' · ' + t('u.gold'), 'pierde')}
      ${caja(num(PVE.CASCO), t('pve.k.hull'), 'pierde')}
      ${caja(pct(PVE.VIDA), t('pve.k.char'), 'pierde')}
      ${caja(PVE.ATURDE + ' ' + t('u.min'), t('pve.k.stun'), 'pierde')}
    </div>`;
  }

  /* ---------- cuánto tardas en llegar ----------
     Línea recta entre tu ubicación y la de la isla, dividida por la
     velocidad de tu tripulación, y los turnos redondeados hacia arriba.
     Es una estimación sacada de las coordenadas del mapa, no una regla de
     la guía, y por eso se dice.

     Hacen falta tres cosas y cualquiera puede faltar: dónde estás, dónde
     está la isla y una tripulación. Si falta la isla o la tripulación se
     dice CUÁL falta, que es lo único accionable; si falta dónde estás no,
     porque los campos para ponerlo están justo encima y ya lo piden. */
  function viajeHTML(){
    const i = islaElegida();
    if (i === -1) return '';
    const isla = window.ISLANDS[i];

    const donde = C.donde();
    /* Sin punto de salida no hay viaje que contar, y el aviso ya lo da
       el panel de arriba: aqui solo estorbaria. */
    if (!donde) return '';
    if (!isla.xy) {
      return `<p class="hint">${t('pve.viaje.sinIsla')
        .replace('{n}', esc(nombreIsla(isla)))}</p>`;
    }

    const crew = C.personajes();
    const nav = crew.reduce((s, c) => s + c.v, 0);
    const timonel = crew.some(c => c.r === 'Helmsman');
    const vel = crew.length ? R.crewSpeed(nav, timonel) : 0;
    if (!vel) return `<p class="hint">${t('pve.viaje.sinCrew')}</p>`;

    const v = R.viaje([donde.x, donde.y], isla.xy, vel);
    if (!v) return '';

    /* Ya estás ahí: no es un viaje de cero turnos, es que no hay viaje. */
    if (v.dist < 0.5) {
      return `<p class="hint">${t('pve.viaje.aqui')
        .replace('{n}', esc(nombreIsla(isla)))}</p>`;
    }

    const desde = donde.isla
      ? esc(nombreIsla(islaPorNombre(donde.isla) || { n: donde.isla }))
      : num(donde.x) + ', ' + num(donde.y);

    return `<div class="viaje">
      <div class="kpi-box">
        <b>${reloj(v.minutos)}</b>
        <span>${esc(t('pve.viaje.tiempo'))}</span>
        <em>${num(v.turnos)} ${esc(t(v.turnos === 1 ? 'pve.viaje.turno' : 'pve.viaje.turnos'))}</em>
      </div>
      <div class="kpi-box">
        <b>${num(v.dist, 1)}</b>
        <span>${esc(t('pve.viaje.dist'))}</span>
        <em>${esc(t('pve.viaje.vel'))} ${num(vel, 1)}</em>
      </div>
      <p class="hint">${t('pve.viaje.desde').replace('{d}', desde)}</p>
    </div>`;
  }

  /* «1 h 30 min», nunca «90 min»: lo que se quiere saber es si esto es un
     rato o media tarde. */
  function reloj(min){
    const h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + ' ' + t('u.min');
    return h + ' h' + (m ? ' ' + m + ' ' + t('u.min') : '');
  }

  const islaPorNombre = n => window.ISLANDS.filter(x => x.n === n)[0] || null;

  /* ---------- dónde estás ----------
     Vive aquí, pegado al viaje, porque es lo único para lo que sirve: sin
     punto de salida no hay nada que calcular. Se busca escribiendo, igual
     que la isla de arriba, y en la lista salen TODAS, también las que no
     traen posición: para esas este es justo el sitio de apuntarla, porque
     es donde te hace falta.

     La verdad son las coordenadas; el nombre de la isla es una etiqueta y
     un atajo para rellenarlas.

     El bloque se pinta UNA vez y no vuelve a rehacerse mientras se usa: lo
     único que cambia al tocarlo es la línea de debajo, y rehacerlo entero
     te quitaría el foco de encima justo cuando pasas de la X a la Y. Por lo
     mismo queda fuera de render(), que corre con cada tecla de la búsqueda
     de isla. */
  function dondeRender(){
    if (els.donde) els.donde.innerHTML = dondeHTML();
  }

  const dondeCampo = id => els.donde ? els.donde.querySelector('#' + id) : null;

  /* La isla que hay escrita ahora mismo en el buscador, o null. */
  function dondeIsla(){
    const campo = dondeCampo('dondeIsla');
    if (!campo) return null;
    const i = indiceDe(campo.value);
    return i === -1 ? null : window.ISLANDS[i];
  }

  function dondeAviso(){
    const h = dondeCampo('dondeHint');
    if (h) h.innerHTML = dondeAvisoHTML(dondeIsla());
  }

  /* `pendiente` es la isla escrita cuando todavía no hay ubicación: sirve
     para separar «no has dicho nada» de «has dicho una isla de la que no sé
     la posición», que se arreglan de maneras distintas. */
  function dondeAvisoHTML(pendiente){
    const d = C.donde();
    if (!d) {
      return (pendiente && !pendiente.xy)
        ? t('pve.donde.falta').replace('{n}', esc(nombreIsla(pendiente)))
        : t('pve.donde.no');
    }
    /* Un punto suelto no tiene nombre de isla, y poner un guion en su hueco
       solo hace ruido: se dice con las coordenadas y ya. */
    const frase = d.isla
      ? t('pve.donde.hay').replace('{d}',
          esc(nombreIsla(islaPorNombre(d.isla) || { n: d.isla })))
      : t('pve.donde.hayXY');
    return frase.replace('{x}', num(d.x)).replace('{y}', num(d.y));
  }

  function dondeHTML(){
    const d = C.donde();
    const opciones = window.ISLANDS.map(isla => {
      const mar = window.ISLAND_SEAS[isla.m];
      const marca = isla.xy ? '' : ' · ' + t('pve.donde.sinXY');
      return `<option value="${esc(nombreIsla(isla))}" label="${esc(mar + marca)}"></option>`;
    }).join('');
    const nombre = (d && d.isla)
      ? nombreIsla(islaPorNombre(d.isla) || { n: d.isla }) : '';

    return `<div class="donde">
      <label class="campo campo-ancho">
        <span>${esc(t('pve.donde.isla'))}</span>
        <input type="text" id="dondeIsla" class="isla-select" list="dondeLista"
               autocomplete="off" spellcheck="false"
               placeholder="${esc(t('pve.isla.ph'))}" value="${esc(nombre)}">
        <datalist id="dondeLista">${opciones}</datalist>
      </label>
      <label class="campo campo-corto">
        <span>X</span>
        <input type="number" id="dondeX" step="any" value="${d ? d.x : ''}">
      </label>
      <label class="campo campo-corto">
        <span>Y</span>
        <input type="number" id="dondeY" step="any" value="${d ? d.y : ''}">
      </label>
      <p class="hint" id="dondeHint">${dondeAvisoHTML(null)}</p>
    </div>`;
  }

  /* ---------- pintado ---------- */

  function render(){
    const escrito = els.isla.value.trim();
    const i = islaElegida();

    // Ha escrito algo que no es ninguna isla: hay que decírselo.
    els.islaHint.hidden = !(escrito && i === -1);
    if (!els.islaHint.hidden) els.islaHint.textContent = t('pve.isla.noMatch');

    if (els.viaje) els.viaje.innerHTML = viajeHTML();
    els.combate.innerHTML = combateHTML();
    els.fijos.innerHTML   = fijosHTML();
    editorRender();
  }

  /* ============================================================
     EDITOR DE ISLAS
     Corrige los tres enemigos de la isla elegida arriba. Lo que se
     escriba se guarda SOLO en este navegador (islands-store.js): no
     sube a ningún sitio ni lo ve la alianza, que solo comparte rivales.
     ============================================================ */

  const ED = window.ISLAS_EDIT;

  function llenarPersonajes(){
    /* Se escribe el nombre en inglés, que es el que guarda el almacén;
       en español el oficial va como etiqueta, al lado. */
    els.pjLista.innerHTML = DB.map(c => {
      const otro = nameOf(c);
      const et = (otro === c.n ? '' : otro + ' · ') + t('rn.' + c.r);
      return `<option value="${esc(c.n)}" label="${esc(et)}"></option>`;
    }).join('');
  }

  function editorRender(){
    const n = ED.cuantas();
    els.edCount.textContent = n ? num(n) : '';
    els.edCount.hidden = !n;

    const i = islaElegida();
    if (i === -1) {
      els.editor.innerHTML = `<p class="hint">${esc(t('pve.ed.pick'))}</p>` + listaEditadas();
      return;
    }

    const isla = window.ISLANDS[i];
    const tocada = ED.editada(isla.n);
    const campos = [0, 1, 2].map(k => `<label class="campo">
      <span>${esc(t('pve.ed.pos'))} ${k + 1}</span>
      <input type="text" class="ed-pj" data-k="${k}" list="pjLista"
             autocomplete="off" spellcheck="false"
             value="${esc(isla.e[k] || '')}">
    </label>`).join('');

    els.editor.innerHTML = `
      <h3 class="sub-tit">${esc(nombreIsla(isla))} · ${esc(window.ISLAND_SEAS[isla.m])}${
        tocada ? ` <span class="cuenta">${esc(t('pve.ed.mine'))}</span>` : ''}</h3>
      <div class="ed-form">${campos}</div>
      <div class="ed-btns">
        <button class="btn-calc" id="edGuardar" type="button">${esc(t('pve.ed.save'))}</button>
        <button class="btn-add" id="edVaciar" type="button">${esc(t('pve.ed.empty'))}</button>
        ${tocada ? `<button class="btn-x" id="edDeshacer" type="button">${esc(t('pve.ed.undo'))}</button>` : ''}
      </div>
      <h3 class="sub-tit">${esc(t('pve.ed.xy'))}</h3>
      <div class="ed-form">
        <label class="campo campo-corto">
          <span>X</span>
          <input type="number" class="ed-xy" data-k="x" step="any"
                 value="${isla.xy ? isla.xy[0] : ''}">
        </label>
        <label class="campo campo-corto">
          <span>Y</span>
          <input type="number" class="ed-xy" data-k="y" step="any"
                 value="${isla.xy ? isla.xy[1] : ''}">
        </label>
        <button class="btn-add" id="edXY" type="button">${esc(t('pve.ed.save'))}</button>
      </div>
      <p class="note">${t('pve.ed.xyD')}</p>
      <p class="hint" id="edHint"></p>
      ${listaEditadas()}`;
  }

  /* El resumen de lo corregido, para saber qué se ha tocado sin ir isla
     por isla. */
  function listaEditadas(){
    const nombres = ED.nombres();
    if (!nombres.length) return '';
    return `<div class="ed-mias">
      <h3 class="sub-tit">${esc(t('pve.ed.list'))}</h3>
      <p class="ed-chips">${nombres.map(n => {
        // el atajo lleva dentro el nombre del archivo, que es la identidad,
        // y enseña el traducido, que es lo que se reconoce
        const isla = window.ISLANDS.filter(x => x.n === n)[0];
        return `<button type="button" class="ed-chip" data-isla="${esc(n)}">${
          esc(isla ? nombreIsla(isla) : n)}</button>`;
      }).join('')}</p>
      <button class="btn-x" id="edLimpiar" type="button">${esc(t('pve.ed.clearAll'))}</button>
    </div>`;
  }

  function edMensaje(clave, malo){
    const h = document.getElementById('edHint');
    if (!h) return;
    h.textContent = t(clave);
    h.className = 'hint' + (malo ? ' win-lo' : '');
  }

  /* ---------- eventos ---------- */

  els.mar.addEventListener('change', () => { llenarIslas(); render(); });
  /* input y no change: al elegir del datalist con el ratón, Chrome manda
     input y el change solo llega al salir del campo. */
  els.isla.addEventListener('input', render);

  /* Escribir una isla copia sus coordenadas; escribirlas a mano deja el
     nombre puesto como etiqueta, si lo escrito es una isla de verdad. Se
     tocan los campos uno a uno en vez de repintar el bloque, para no mover
     el foco mientras se escribe.

     `input` en el buscador y `change` en los números: al elegir del
     desplegable con el ratón, Chrome manda input y el change solo llega al
     salir del campo. */
  if (els.donde) {
    els.donde.addEventListener('input', e => {
      if (e.target.closest('#dondeIsla')) dondeCambia(true);
    });
    els.donde.addEventListener('change', e => {
      if (e.target.closest('#dondeX') || e.target.closest('#dondeY')) dondeCambia(false);
    });
  }

  function dondeCambia(desdeElBuscador){
    const isla = dondeIsla();
    const x = dondeCampo('dondeX'), y = dondeCampo('dondeY');

    if (desdeElBuscador && isla) {
      if (isla.xy) {
        x.value = isla.xy[0];
        y.value = isla.xy[1];
      } else {
        /* Esas coordenadas eran de otra isla, no de esta: se van, y se
           piden. Si ya estabas en esta, se quedan las que escribiste. */
        const antes = C.donde();
        if (!antes || antes.isla !== isla.n) { x.value = ''; y.value = ''; }
      }
    }

    C.setDonde(x.value, y.value, isla ? isla.n : '');
    dondeAviso();
    render();
  }

  // El botón se repinta con el panel, así que se escucha por delegación.
  els.combate.addEventListener('click', e => {
    if (!e.target.closest('#simBtn')) return;
    const salida = document.getElementById('simOut');
    if (salida) salida.innerHTML = simularHTML();
  });

  els.editor.addEventListener('click', e => {
    const chip = e.target.closest('.ed-chip');
    if (chip) {
      const suya = window.ISLANDS.filter(x => x.n === chip.dataset.isla)[0];
      els.isla.value = suya ? nombreIsla(suya) : chip.dataset.isla;
      // La isla puede ser de otro mar: se quita el filtro para que se vea.
      const j = islaElegida();
      if (j !== -1 && els.mar.value !== '' && window.ISLANDS[j].m !== Number(els.mar.value)) {
        els.mar.value = '';
        llenarIslas();
      }
      render();
      return;
    }

    if (e.target.closest('#edLimpiar')) {
      if (!confirm(t('pve.ed.confirm'))) return;
      ED.limpiar();
      render();
      return;
    }

    const i = islaElegida();
    if (i === -1) return;
    const isla = window.ISLANDS[i];

    if (e.target.closest('#edDeshacer')) {
      ED.deshacer(isla.n);
      render();
      return;
    }
    if (e.target.closest('#edVaciar')) {
      els.editor.querySelectorAll('.ed-pj').forEach(x => { x.value = ''; });
      return;
    }
    if (e.target.closest('#edXY')) {
      const v = k => els.editor.querySelector('.ed-xy[data-k="' + k + '"]').value.trim();
      const r = ED.guardarXY(isla.n, v('x'), v('y'));
      if (r === 'malos') { edMensaje('pve.ed.bad', true); return; }
      render();
      edMensaje(r === 'igual' ? 'pve.ed.same' : 'pve.ed.saved');
      return;
    }
    if (e.target.closest('#edGuardar')) {
      const vals = [0, 1, 2].map(k =>
        els.editor.querySelector('.ed-pj[data-k="' + k + '"]').value.trim());
      const r = ED.guardar(isla.n, vals);
      if (r === 'malos') { edMensaje('pve.ed.bad', true); return; }
      render();
      edMensaje(r === 'igual' ? 'pve.ed.same' : 'pve.ed.saved');
    }
  });

  document.addEventListener('langchange', () => {
    llenarMares(); llenarIslas(); llenarPersonajes(); dondeRender(); render();
  });

  llenarMares();
  llenarIslas();
  llenarPersonajes();
  dondeRender();
  render();
})();
