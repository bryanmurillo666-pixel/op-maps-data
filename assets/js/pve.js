/* ============================================================
   OP-MAPS DATA — página PvE
   ------------------------------------------------------------
   Los números fijos salen de la guía v4.0; los de "tu situación"
   se calculan con lo que escribas y con tu tripulación guardada.
   ============================================================ */
(function () {

  const R = window.RULES;
  const C = window.CREW;

  /* Las constantes del PvE. Están aquí y no en rules.js porque solo las
     usa esta página; si algún día las necesita otra, se mudan. */
  const PVE = {
    ORO_GANAR:  5000,
    ORO_PERDER: 500,
    OFERTA:     0.8,     // solo se tira si has ganado
    CASCO:      525,     // daño al casco por derrota
    VIDA:       0.34,    // lo que pierde cada uno de los tres
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
    fijos:   document.getElementById('fijos')
  };

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
    const mejor = crew.map(c => enemigos.map(en => {
      let top = { tac: R.TACTICS[0], gana: -1 };
      for (const tac of R.TACTICS) {
        const g = ganadas(c, tac, en);
        if (g > top.gana) top = { tac: tac, gana: g };
      }
      return top;
    }));

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
          if (!salida || p > salida.prob + 1e-12 ||
              (p > salida.prob - 1e-12 && duelos > salida.duelos)) {
            salida = { prob: p, duelos: duelos, idx: [a, b, c], puestos: trio };
          }
        }
      }
    return salida;
  }

  function combateHTML(){
    const idx = els.isla.value;
    if (idx === '') return '';

    const isla = window.ISLANDS[Number(idx)];
    // Sin enemigos es isla base: se desembarca sin pelear.
    if (!isla.e.length) return `<p class="hint">${esc(t('pve.isla.base'))}</p>`;

    const enemigos = isla.e.map(n => DB.find(c => c.n === n));
    const cabecera = `<h3 class="sub-tit">${esc(t('pve.isla.enemies'))}</h3>
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

    const filas = ali.idx.map((k, i) => {
      const c = crew[k], puesto = ali.puestos[i];
      const daño = R.health(c) * PVE.VIDA;
      return `<div class="linea">
        <span class="pos">${i + 1}</span>
        <span class="quien">
          <b>${esc(nameOf(c))}</b>
          <i>${esc(t('tac.' + puesto.tac))} · ${num(R.score(c, puesto.tac))}
             · −${num(daño, 1)} ${esc(t('pve.isla.dmg'))}</i>
        </span>
        <span class="puntos">
          <b class="${puesto.gana === 3 ? 'win-hi' : (puesto.gana ? 'win-mid' : 'win-lo')}">${puesto.gana} / 3</b>
          <i>${esc(t('pve.isla.beats'))} ${esc(nameOf(enemigos[i]))}</i>
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
      <p class="note">${t('pve.isla.dmgNote')}</p>`;
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
      return { mio: mio, miTac: miTac, suyo: enemigos[i], suTac: suTac, gano: gano };
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
        <b>${esc(nameOf(d.mio))}</b><i>${esc(t('tac.' + d.miTac))}</i>
      </span>
      <span class="marca">${d.gano ? '▸' : '◂'}</span>
      <span class="lado der">
        <b>${esc(nameOf(d.suyo))}</b><i>${esc(t('tac.' + d.suTac))}</i>
      </span>
    </div>`).join('');

    const premio = gana
      ? `<p class="botin gana">+${num(PVE.ORO_GANAR)} ${esc(t('u.gold'))} · +1 ${esc(t('pve.k.victory')).toLowerCase()}</p>
         <p class="botin ${hayOferta ? 'gana' : 'neutro'}">${
            hayOferta
              ? `${esc(t('pve.sim.offer'))}: <b>${esc(nameOf(oferta))}</b> · ${esc(t('rn.' + oferta.r))} · ${num(R.price(oferta))} ${esc(t('u.gold'))}`
              : esc(t('pve.sim.noOffer'))
          }</p>`
      : `<p class="botin pierde">−${num(PVE.ORO_PERDER)} ${esc(t('u.gold'))} · −${num(PVE.CASCO)} ${esc(t('pve.k.hull')).toLowerCase()} · ${PVE.ATURDE} ${esc(t('u.min'))}</p>`;

    return `<div class="sim-caja">
      <p class="sim-res ${gana ? 'win-hi' : 'win-lo'}">
        ${ganados}-${3 - ganados} · ${esc(t(gana ? 'pve.sim.win' : 'pve.sim.lose'))}
      </p>
      <div class="duelos">${filas}</div>
      ${premio}
      <p class="note">${esc(t('pve.sim.offerNote'))}</p>
    </div>`;
  }

  function llenarMares(){
    const antes = els.mar.value;
    els.mar.innerHTML = `<option value="">${esc(t('pve.isla.allSeas'))}</option>` +
      maresEnOrden().map(m =>
        `<option value="${m}">${esc(window.ISLAND_SEAS[m])}</option>`).join('');
    if (antes) els.mar.value = antes;
  }

  /* La lista de islas, filtrada por el mar elegido. Sin mar, van todas
     agrupadas; con mar, solo las suyas y sin agrupar. */
  function llenarIslas(){
    const filtro = els.mar.value;
    const antes = els.isla.value;
    let html = `<option value="">${esc(t('pve.isla.none'))}</option>`;

    const opcion = (isla, i) =>
      `<option value="${i}">${esc(isla.n)}${isla.e.length ? '' : ' ·'}</option>`;

    if (filtro === '') {
      maresEnOrden().forEach(m => {
        html += `<optgroup label="${esc(window.ISLAND_SEAS[m])}">` +
          window.ISLANDS.map((isla, i) => isla.m === m ? opcion(isla, i) : '').join('') +
          `</optgroup>`;
      });
    } else {
      const m = Number(filtro);
      html += window.ISLANDS.map((isla, i) => isla.m === m ? opcion(isla, i) : '').join('');
    }

    els.isla.innerHTML = html;
    // Si la isla que estaba elegida sigue en la lista, se mantiene.
    els.isla.value = antes;
    if (els.isla.selectedIndex === -1) els.isla.value = '';
  }

  /* ---------- los números fijos ---------- */

  /* Lo fijo, todo en una fila: primero lo que se gana, luego lo neutral y
     al final lo que se pierde. Las cabeceras se estiran por encima de sus
     cajas con grid-column. */
  function fijosHTML(){
    const caja = (valor, etiqueta, clase) =>
      `<div class="kpi-box ${clase}"><b>${valor}</b><span>${esc(etiqueta)}</span></div>`;

    return `<div class="fila-fija">
      <h4 class="gana"   style="grid-column:span 2">${esc(t('pve.col.win'))}</h4>
      <h4 class="neutro" style="grid-column:span 1">${esc(t('pve.col.mid'))}</h4>
      <h4 class="pierde" style="grid-column:span 4">${esc(t('pve.col.lose'))}</h4>

      ${caja('+' + num(PVE.ORO_GANAR), t('pve.k.gold') + ' · ' + t('u.gold'), 'gana')}
      ${caja('+1', t('pve.k.victory'), 'gana')}
      ${caja('80 %', t('pve.k.offer'), 'neutro')}
      ${caja('−' + num(PVE.ORO_PERDER), t('pve.k.goldLoss') + ' · ' + t('u.gold'), 'pierde')}
      ${caja(num(PVE.CASCO), t('pve.k.hull'), 'pierde')}
      ${caja('34 %', t('pve.k.char'), 'pierde')}
      ${caja('90 ' + t('u.min'), t('pve.k.stun'), 'pierde')}
    </div>`;
  }

  /* ---------- pintado ---------- */

  function render(){
    els.combate.innerHTML = combateHTML();
    els.fijos.innerHTML   = fijosHTML();
  }

  /* ---------- eventos ---------- */

  els.mar.addEventListener('change', () => { llenarIslas(); render(); });
  els.isla.addEventListener('change', render);

  // El botón se repinta con el panel, así que se escucha por delegación.
  els.combate.addEventListener('click', e => {
    if (!e.target.closest('#simBtn')) return;
    const salida = document.getElementById('simOut');
    if (salida) salida.innerHTML = simularHTML();
  });

  document.addEventListener('langchange', () => { llenarMares(); llenarIslas(); render(); });

  llenarMares();
  llenarIslas();
  render();
})();
