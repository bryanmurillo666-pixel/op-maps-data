/* ============================================================
   OP-MAPS DATA — PvP: plan de ataque y guardias
   ------------------------------------------------------------
   Esto es la interfaz. Toda la matemática está en pvp-model.js.

   Aquí NO se edita nada: la libreta de rivales se lleva en Mis
   rivales y tus guardias en Mi tripulación. Esta página solo lee
   las dos cosas y calcula.

   Se da por hecho que tu tripulación está entera: quién esté
   tocado cambia cada media hora y no es lo que se viene a mirar.
   ============================================================ */
(function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;
  const C  = window.CREW;
  const RV = window.RIVALES;
  const MG = window.MIS_GUARDIAS;
  const M  = window.PVP_MODEL;

  /* Lo que cuesta un combate en VIDA de los personajes. El daño al casco
     ya no está aquí: vive en rules.js (R.CASCO, R.AMPLIO), que es de donde
     lo lee también el modelo. Tener dos copias de la misma tabla era
     pedirlas a gritos que se separasen. */
  const PVP = {
    VIDA:       0.34,
    VIDA_GANAR: 0.08,
    CONTRA:     0.6,
    CONTRA_PUNTOS: 1.75    // el contador también multiplica lo que cuenta para el marcador
  };

  const els = {
    sel: document.getElementById('planRival'),
    ali: document.getElementById('planAlianza'),
    campoAli: document.getElementById('campoAlianza'),
    out: document.getElementById('resultado'),
    def: document.getElementById('defensa'),
    suyas: document.getElementById('suyas')
  };

  /* ---------- utilidades ---------- */

  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';
  const nameOf = c => (isES() && c.es) ? c.es : c.n;
  const porNombre = n => DB.find(x => x.n === n);

  function esc(s){
    return String(s).replace(/[&<>"']/g, m => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
    ));
  }
  function num(n, dec){
    return Number(n).toLocaleString(isES() ? 'es-ES' : 'en-GB', {
      minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0
    });
  }
  const claseProb = p => p >= 0.6 ? 'win-hi' : (p >= 0.34 ? 'win-mid' : 'win-lo');
  const seg = x => x === 'Assault' ? 'f' : (x === 'Manoeuvre' ? 'v' : 'i');
  const mios = () => C.personajes();

  /* ---------- el plan de ataque ---------- */

  /* Los cuatro marcadores que puede tener un 3v3, que son objetivos de
     verdad distintos porque cada uno cuesta y hace un daño distinto:

       g30  ganas 3-0    le haces 525 y te cuesta  75  — lo mejor que hay
       g21  ganas 2-1    le haces 375/270 y te cuesta 150/180
       p12  pierdes 1-2  le haces 180/150 y te cuesta 270/375 — la derrota barata
       p03  pierdes 0-3  le haces  75 y te cuesta 525 — la más cara para ti,
                         pero la más suave para él

     Elegir uno no esconde los otros: se enseñan los cuatro con el plan ya
     elegido, que es lo que deja comparar de un vistazo. */
  const MODOS = ['g30', 'g21', 'p12', 'p03'];
  const MODO_KEY = 'opmaps-pvp-modo';

  let modo = 'g30';
  try {
    const g = localStorage.getItem(MODO_KEY);
    if (MODOS.indexOf(g) !== -1) modo = g;
    else if (g === 'perder') modo = 'p12';   // el modo viejo, traducido
  } catch(e){ /* si el navegador lo bloquea, se queda en g30 */ }

  let ultimo = null;

  /* Cuál de las tres defensas se está mirando. Se recuerda, como el modo
     del plan de ataque. */
  const DEF_KEY = 'opmaps-pvp-def';
  const DEFENSAS = ['equilibrada', 'mono', 'una'];
  let defOpcion = 'equilibrada';
  try {
    const g = localStorage.getItem(DEF_KEY);
    if (DEFENSAS.indexOf(g) !== -1) defOpcion = g;
  } catch(e){ /* si el navegador lo bloquea, se queda en la equilibrada */ }

  /* Para cada posición, contra quién pelea en las formaciones que quedan
     en pie y cuántas veces gana. */
  function rivalesDePosicion(res, mio, tac, i){
    const cuenta = {};
    res.forms.forEach(f => {
      for (let j = 0; j < res.nG; j++) {
        const p = f.g[j][i];
        const clave = p.c === M.CONCEDE ? '-' : res.suyos[p.c].n;
        if (!cuenta[clave]) cuenta[clave] = { gana: 0, total: 0 };
        cuenta[clave].total++;
        const gano = p.c === M.CONCEDE ||
          R.duelWin(R.score(mio, tac), tac,
                    R.score(res.suyos[p.c], R.TACTICS[p.t]), R.TACTICS[p.t]);
        if (gano) cuenta[clave].gana++;
      }
    });
    return Object.keys(cuenta)
      .map(k => ({ n: k, g: cuenta[k].gana, t: cuenta[k].total }))
      .sort((a, b) => b.t - a.t);
  }

  function planHTML(){
    ultimo = null;
    const r = RV.porId(els.sel.value);
    if (!r) return `<p class="hint">${esc(t('pvp.plan.pick2'))}</p>`;

    const crew = mios();
    if (crew.length < 3) {
      return `<p class="hint">${esc(t(crew.length ? 'pvp.sim.few' : 'pvp.sim.empty'))}</p>`;
    }

    const res = M.evaluar(crew, r, modo);
    if (!res) return `<p class="hint">${esc(t('pvp.sim.few'))}</p>`;
    if (res.vacio) return `<p class="aviso-cambio"><b>${esc(t('pvp.plan.noDataT'))}</b>
      <span>${esc(t('pvp.plan.noData'))}</span></p>`;

    ultimo = { r: r, crew: crew, res: res };
    const exacto = res.completas >= res.nG;
    const grande = res.tasas[modo];
    const quiereGanar = (modo === 'g30' || modo === 'g21');

    const filas = res.plan.idx.map((k, i) => {
      const c = crew[k], tac = res.plan.tac[i];
      const contra = rivalesDePosicion(res, c, tac, i).slice(0, 4).map(x => {
        const quien = x.n === '-' ? '—' : nameOf(porNombre(x.n));
        const clase = x.g === x.t ? 'vs-gano' : (x.g === 0 ? 'vs-perdio' : 'vs-mix');
        const marca = (x.g === x.t || x.g === 0) ? '' : ` ${x.g}/${x.t}`;
        return `<span class="vs ${clase}">${esc(quien)}${marca}</span>`;
      }).join('');
      return `<div class="linea">
        <span class="pos">${i + 1}</span>
        <span class="quien">
          <span class="quien-top">
            <b>${esc(nameOf(c))}</b>
            <span class="tac-pill tac-${seg(tac)}">${esc(t('tac.' + tac))} · ${num(R.score(c, tac))}</span>
          </span>
          <i>${esc(t('rn.' + c.r))}</i>
        </span>
        <span class="contras">${contra}</span>
      </div>`;
    }).join('');

    /* Con las tres guardias conocidas el número es exacto, pero eso NO
       quiere decir que el resultado esté asegurado: el servidor sigue
       sorteando cuál de sus tres te sale. Así que se dice en cuántas de
       ellas sale lo que has pedido, que es de donde viene el 67 %. */
    let base;
    if (exacto) {
      base = `<span class="sello exacto">${esc(t('pvp.plan.exact'))}</span>
        <span class="hint">${Math.round(grande * res.nG)}/${res.nG} ${esc(t('pvp.plan.ofGuards'))}</span>`;
    } else {
      const fam = res.familia ? ` · ${esc(t('pvp.plan.fam.' + res.familia))}` : '';
      base = `<span class="sello estimado">${esc(t('pvp.plan.est'))}</span>
        <span class="hint">${res.nFormaciones} ${esc(t('pvp.plan.forms'))}${fam}</span>`;
      if (res.completas) {
        base += `<span class="hint">${res.completas}/${res.nG} ${esc(t('pvp.plan.known'))}</span>`;
      }
    }

    /* Dos cifras y ya: cada cuánto sale el marcador que has pedido, y lo
       que le cuesta a ÉL *cuando sale ese marcador* — no la media de todo,
       que mezclaría el 3-0 que buscas con el 1-2 que cae el resto de las
       veces y no describiría ninguno de los dos.

       Tu propio casco y los otros tres marcadores se siguen calculando —el
       modelo los necesita para elegir el plan— pero no se enseñan. */
    const m = res.marcador;

    /* Si has pedido perder y resulta que no puedes, conviene saberlo: es
       lo único que impide conseguir lo que has pedido. */
    let nota = '';
    if (!quiereGanar && grande < 0.5) {
      nota = `<p class="aviso-cambio"><b>${esc(t('pvp.plan.loseHardT'))}</b>
        <span>${t('pvp.plan.loseHard')}</span></p>`;
    }

    return `<h3 class="sub-tit">${esc(t('pvp.mk.' + modo))}</h3>
      <p class="gran-prob ${claseProb(quiereGanar ? grande : 1 - grande)}">${num(grande * 100)} %</p>
      <p class="sellos">${base}</p>
      <p class="sellos"><span class="cuenta">${esc(t('pvp.plan.hullTheirs'))} −${num(m.suDe[modo])}</span></p>
      ${nota}

      <h3 class="sub-tit">${esc(t('pvp.plan.line'))}</h3>
      <div class="alineacion">${filas}</div>

      <button class="btn-calc" id="simBtn" type="button">${esc(t('pvp.plan.sim'))}</button>
      <div id="simOut"></div>

      <p class="note">${t(!quiereGanar ? 'pvp.plan.howLose'
                                       : (exacto ? 'pvp.plan.howExact' : 'pvp.plan.howEst'))}</p>`;
  }

  /* ---------- tus guardias contra él ---------- */

  function guardiaHTML(puestos, titulo, extra){
    return `<div class="guardia">
      <div class="guardia-cab">
        <h5>${esc(titulo)}</h5>
        ${extra || ''}
      </div>
      <div class="puestos">${puestos.map((p, i) => `
        <div class="puesto-fijo">
          <span class="pos">${i + 1}</span>
          <b>${esc(nameOf(p.c))}</b>
          <span class="tac-pill tac-${seg(p.t)}">${esc(t('tac.' + p.t))}</span>
        </div>`).join('')}</div>
    </div>`;
  }

  /* Cuando no has elegido rival hay que medir contra ALGO, y lo honesto es
     medir contra el techo: los personajes de mayor puntuación del juego,
     con sus guardias sin apuntar. No es nadie real y no pretende serlo —
     es el peor caso razonable. Unas guardias que aguanten contra esto
     aguantan contra cualquiera que te vayas a encontrar. */
  let refCache = null;
  function rivalReferencia(){
    if (refCache) return refCache;
    const fuerza = c => Math.max.apply(null, R.TACTICS.map(x => R.score(c, x)));
    const mejores = DB.slice().sort((a, b) => fuerza(b) - fuerza(a)).slice(0, R.MAX_CREW);
    refCache = {
      id: '', n: '', a: [], ts: 0,
      r: mejores.map(c => ({ n: c.n, e: 'ok' })),
      g: [[null,null,null], [null,null,null], [null,null,null]],
      res: [null, null]
    };
    return refCache;
  }

  /* ============================================================
     LO QUE SABES DE ÉL
     ------------------------------------------------------------
     Sus guardias apuntadas y su tripulación, aquí y no sólo en Mis
     rivales. Dos razones, y las dos son de uso:

     1. Cuando estás mirando qué le mandas, lo que quieres delante es
        contra qué te vas a encontrar. Ir a otra página a mirarlo y
        volver rompe lo que estabas haciendo.
     2. Un CAÍDO suyo lo cambia todo —no puede defender, entra una
        reserva en su puesto— y eso se sabe justo antes de atacar,
        porque el juego te enseña en qué banda está cada uno. Así que
        marcarlo tiene que costar un toque, no un viaje.

     Se toca lo mismo que en Mis rivales (RIVALES.setEstado), así que
     lo que marques aquí está allí, y viaja por la alianza igual.
     ============================================================ */

  /* Un toque cambia entre Caído y Sano, que es lo único que se mira
     deprisa. Los estados de en medio —Herido, Crítico— se siguen
     pudiendo poner en Mis rivales, y aquí se ven pero no estorban. */
  function suyoHTML(m, arma){
    const c = porNombre(m.n);
    if (!c) return '';
    const caido = m.e === RV.CAIDO;
    return `<button type="button" class="suyo-tog est-${esc(m.e)}${caido ? ' caido' : ''}"
      data-quien="${esc(m.n)}" aria-pressed="${caido}">
      <b>${esc(nameOf(c))}</b>
      <span>${esc(t('pvp.est.' + m.e))}${
        arma ? ' · ' + R.nombreArma(arma, isES()) : ''}</span>
    </button>`;
  }

  /* Una guardia suya, como la enseña Mis rivales pero sin poder tocarla:
     aquí se consulta, se edita allí. Los puestos sin apuntar salen como
     huecos, que es información: te dice lo que te falta por ver. */
  function suGuardiaHTML(g, gi, caidos, armas){
    const huecos = g.map((p, i) => {
      if (!p) return `<div class="puesto-fijo vacio">
        <span class="pos">${i + 1}</span>
        <b>—</b>
      </div>`;
      if (p.n === RV.VACIO) return `<div class="puesto-fijo vacio">
        <span class="pos">${i + 1}</span>
        <b>${esc(t('pvp.riv.empty'))}</b>
      </div>`;
      const c = porNombre(p.n);
      const fuera = caidos[p.n];
      return `<div class="puesto-fijo${fuera ? ' fuera' : ''}">
        <span class="pos">${i + 1}</span>
        <b>${esc(c ? nameOf(c) : p.n)}</b>
        <span class="tac-pill tac-${seg(p.t)}">${esc(t('tac.' + p.t))}</span>
        ${armas[p.n] ? `<span class="tag-arma">${esc(R.nombreArma(armas[p.n], isES()))}</span>` : ''}
        ${fuera ? `<span class="cuenta">${esc(t('pvp.est.ko'))}</span>` : ''}
      </div>`;
    }).join('');

    return `<div class="guardia">
      <div class="guardia-cab"><h5>${esc(t('pvp.riv.guard'))} ${gi + 1}</h5></div>
      <div class="puestos">${huecos}</div>
    </div>`;
  }

  function suyasHTML(){
    const r = RV.porId(els.sel.value);
    if (!r) return `<p class="hint">${esc(t('pvp.suyas.sinRival'))}</p>`;

    const caidos = {};
    r.r.forEach(m => { if (m.e === RV.CAIDO) caidos[m.n] = true; });

    /* `r.w` va de arma a portador, que es como se guarda; aqui hace falta
       al reves, porque se pinta persona a persona. */
    const armaDe = {};
    Object.keys(r.w || {}).forEach(a => { armaDe[r.w[a]] = a; });

    const tripu = r.r.length
      ? `<div class="suyos-tog">${r.r.map(m =>
          suyoHTML(m, RV.armaDe(r, m.n))).join('')}</div>`
      : `<p class="hint">${t('pvp.suyas.sinCrew')}</p>`;

    const nG = RV.nGuardias(r);
    const apuntadas = r.g.slice(0, nG).filter(g => g.some(Boolean)).length;
    const guardias = apuntadas
      ? `<div class="def-guardias">${r.g.slice(0, nG)
          .map((g, gi) => suGuardiaHTML(g, gi, caidos, armaDe)).join('')}</div>`
      : `<p class="hint">${t('pvp.suyas.sinGuardias')}</p>`;

    /* Las reservas sólo si hay alguna: dos huecos vacíos no dicen nada que
       no diga ya el mensaje de arriba. */
    const res = r.res.filter(Boolean);
    const reservas = res.length
      ? `<div class="guardia">
          <div class="guardia-cab"><h5>${esc(t('pvp.def.res'))}</h5></div>
          <div class="puestos reservas-${res.length}">${res.map((p, i) => {
            const c = porNombre(p.n);
            return `<div class="puesto-fijo${caidos[p.n] ? ' fuera' : ''}">
              <span class="pos res">R${i + 1}</span>
              <b>${esc(c ? nameOf(c) : p.n)}</b>
              <span class="tac-pill tac-${seg(p.t)}">${esc(t('tac.' + p.t))}</span>
            </div>`;
          }).join('')}</div>
        </div>`
      : '';

    const cuantos = r.r.filter(m => m.e === RV.CAIDO).length;
    const aviso = cuantos
      ? `<p class="hint win-lo">${t('pvp.suyas.caidos').replace('{n}', num(cuantos))}</p>`
      : '';

    return `<h3 class="sub-tit">${esc(t('pvp.suyas.crew'))}</h3>
      ${tripu}
      ${aviso}
      <h3 class="sub-tit">${esc(t('pvp.suyas.guardias'))} ${
        apuntadas ? `<span class="cuenta">${num(apuntadas)} / ${num(nG)}</span>` : ''}</h3>
      ${guardias}
      ${reservas}
      <p class="note">${t('pvp.suyas.d2')}</p>`;
  }

  function defensaHTML(){
    const elegido  = RV.porId(els.sel.value);
    const generico = !elegido;
    const r = elegido || rivalReferencia();

    const crew = mios();
    if (crew.length < 3) {
      return `<p class="hint">${esc(t(crew.length ? 'pvp.sim.few' : 'pvp.sim.empty'))}</p>`;
    }

    const res = M.mejoresGuardias(crew, r);
    if (!res || res.vacio) {
      return `<p class="hint">${esc(t('pvp.def.none'))}</p>`;
    }

    /* Las que tienes puestas ahora mismo, si las has apuntado en Mi
       tripulación. Solo cuentan las que estén completas. */
    const nGmias = MG.nGuardias();
    const puestas = MG.todas().slice(0, nGmias)
      .filter(g => g.every(Boolean))
      .map(g => g.map(p => ({ c: porNombre(p.n), t: p.t })))
      .filter(g => g.every(p => p.c));

    /* De las tres defensas, la que estés mirando. La equilibrada es la de
       siempre; las otras dos están afinadas contra un patrón de ataque
       concreto y pagan por ello contra los demás. */
    const ops = res.opciones || [];
    const op  = ops.find(o => o.clave === defOpcion) || ops[0] || res;

    /* La comparación solo vale si tienes las TRES puestas. Con dos estaríamos
       midiendo tus dos mejores contra tres recomendadas, y el número te
       saldría regalado: la guardia que te falta es justo la que no cuenta. */
    const completas = puestas.length >= nGmias;
    const ahora = completas ? M.aguante(puestas, r) : null;

    /* La comparación es lo primero que quieres ver: si lo que tienes
       puesto ya aguanta lo mismo, no hay nada que tocar. */
    let comparacion;
    if (!ahora) {
      comparacion = `<p class="hint">${puestas.length
        ? t('pvp.def.faltan').replace('{n}', nGmias - puestas.length)
        : t('pvp.def.sinTuyasD')}</p>`;
    } else {
      const delta = op.media - ahora.media;
      const clase = delta > 0.005 ? 'win-hi' : (delta < -0.005 ? 'win-lo' : 'win-mid');
      const signo = delta > 0 ? '+' : '';
      comparacion = `<div class="compara">
        <div class="compara-caja">
          <span>${esc(t('pvp.def.ahora'))}</span>
          <b class="${claseProb(ahora.media)}">${num(ahora.media * 100)} %</b>
          <em>${num(ahora.peor * 100)} % ${esc(t('pvp.def.worstShort'))}</em>
        </div>
        <div class="compara-flecha ${clase}">${signo}${num(delta * 100, 1)}</div>
        <div class="compara-caja">
          <span>${esc(t('pvp.def.reco'))}</span>
          <b class="${claseProb(op.media)}">${num(op.media * 100)} %</b>
          <em>${num(op.peor * 100)} % ${esc(t('pvp.def.worstShort'))}</em>
        </div>
      </div>
      <p class="hint">${esc(t(delta > 0.005 ? 'pvp.def.mejora'
                            : (delta < -0.005 ? 'pvp.def.peora' : 'pvp.def.igual')))}</p>`;
    }

    const guardias = op.guardias.map((g, gi) =>
      guardiaHTML(g.puestos, t('pvp.riv.guard') + ' ' + (gi + 1),
        `<span class="hint">${esc(t('pvp.def.falls'))} ${num(g.cae)} / ${num(res.ataques)}</span>`)
    ).join('');

    /* Lo único que sobrevive de los avisos: contra qué se está midiendo.
       Sin esto el número parece de un rival concreto y no lo es, así que
       quitarlo no simplificaría, mentiría. Va como línea, no como caja. */
    const cabecera = generico ? `<p class="note">${t('pvp.def.refD')}</p>` : '';

    /* El banquillo va como un bloque más de la lista, justo detrás de la
       guardia 3 y con la misma pinta: es parte de la misma alineación, no
       un apartado aparte. Como son dos y no tres, sus huecos se centran
       con el ancho de un puesto de guardia.

       No llevan porcentaje: el modelo lo calcula —es lo que las ordena de
       mejor a peor— pero enseñarlo no cambiaba ninguna decisión, porque no
       hay entre quién elegir: son los dos únicos que te sobran. */
    let banquillo, avisoBanco = '';
    if (op.reservas && op.reservas.length) {
      const huecos = op.reservas.map((r, i) => `
        <div class="puesto-fijo">
          <span class="pos res">R${i + 1}</span>
          <b>${esc(nameOf(r.c))}</b>
          <span class="tac-pill tac-${seg(r.t)}">${esc(t('tac.' + r.t))}</span>
        </div>`).join('');
      banquillo = `<div class="guardia">
        <div class="guardia-cab"><h5>${esc(t('pvp.def.res'))}</h5></div>
        <div class="puestos reservas-${op.reservas.length}">${huecos}</div>
      </div>`;
      if (op.reservas.length < 2) {
        avisoBanco = `<p class="hint">${t('pvp.def.res.una')}</p>`;
      }
    } else {
      banquillo = `<div class="guardia">
        <div class="guardia-cab"><h5>${esc(t('pvp.def.res'))}</h5></div>
        <p class="hint">${t('pvp.def.res.none')}</p>
      </div>`;
    }

    /* Los tres patrones con los que se ataca de verdad, y cómo aguanta cada
       defensa contra cada uno. Es la tabla la que decide, no yo: afinar
       contra mono puede darte veinte puntos o ninguno según con quién
       juegues, y eso sólo se ve mirándolo. */
    let eleccion = '';
    if (ops.length > 1) {
      const botones = ops.map(o =>
        `<button type="button" class="modo${o.clave === op.clave ? ' on' : ''}" ` +
        `data-def="${esc(o.clave)}">${esc(t('pvp.def.fam.' + o.clave))}</button>`
      ).join('');

      const cols = res.columnas || res.familias || ['mono', 'dos', 'una'];
      const mejorDe = {};
      cols.forEach(f => {
        mejorDe[f] = Math.max.apply(null, ops.map(o => o.contra[f]));
      });

      const filas = ops.map(o => `<tr${o.clave === op.clave ? ' class="on"' : ''}>
        <th>${esc(t('pvp.def.fam.' + o.clave))}</th>
        ${cols.map(f => `<td${o.contra[f] >= mejorDe[f] - 1e-9 ? ' class="top"' : ''}>${
          num(o.contra[f] * 100)} %</td>`).join('')}
      </tr>`).join('');

      /* Si la que miras sale igual que la de contra todo, se dice: dos
         filas idénticas en la tabla parecen un fallo y son un resultado. */
      const misma = op.igualQue
        ? `<p class="hint">${esc(op.igualBase
            ? t('pvp.def.fam.igual')
            : t('pvp.def.fam.igualQue')
                .replace('{d}', t('pvp.def.fam.' + op.igualQue)))}</p>`
        : '';

      /* Y el caso contrario al de arriba: unas guardias distintas de las de
         «contra todo» que no compran nada. Pasa cuando la equilibrada ya
         aguanta ese patrón entero — entonces afinar solo te quita en los
         demás. En la tabla está, pero hay que leerla entera para verlo. */
      const propia = { mono: 'mono', una: 'una', ult: 'ult' }[op.clave];
      const base0 = ops[0];
      const balde = (propia && !op.igualQue
          && op.contra[propia] <= base0.contra[propia] + 1e-9
          && op.media < base0.media - 1e-9)
        ? `<p class="hint">${esc(t('pvp.def.fam.enBalde')
            .replace('{d}', t('pvp.def.fam.' + base0.clave)))}</p>`
        : '';

      eleccion = `<div class="modo-btns def-btns${ops.length > 3 ? ' def-muchos' : ''}" role="group">${botones}</div>
        <table class="fam-tabla">
          <thead><tr><th></th>${cols.map(f =>
            `<th>${esc(t('pvp.def.fam.c.' + f))}</th>`).join('')}</tr></thead>
          <tbody>${filas}</tbody>
        </table>
        ${misma}
        ${balde}
        <p class="note">${t('pvp.def.fam.d')}</p>`;
    }

    /* Su último ataque pesa SIEMPRE en estas guardias: la mitad si le
       salió bien, un cuarto si le falló. Antes esto solo se decía a partir
       de dos seguidas, así que con un ataque apuntado la recomendación
       cambiaba sin que nada en pantalla lo explicara — y entonces parece
       que no se mira, que es justo lo contrario de lo que pasa.
       Una línea, no una caja. */
    let racha = '';
    if (res.rec) {
      const r = res.rec;
      if (r.gano) {
        racha = t(r.exacta >= 2 ? 'pvp.def.racha.gana' : 'pvp.def.racha.gana1')
                  .replace('{n}', r.exacta);
      } else {
        racha = t(r.patron >= 2 ? 'pvp.def.racha.falla' : 'pvp.def.racha.falla1')
                  .replace('{n}', r.patron);
      }
    } else if (res.hayAtaques) {
      // apuntó ataques suyos pero el último no se puede usar
      racha = t('pvp.def.racha.medio');
    }
    const avisoRacha = racha ? `<p class="hint">${racha}</p>` : '';

    return `${cabecera}
      ${comparacion}
      ${avisoRacha}
      <h3 class="sub-tit">${esc(t('pvp.def.reco'))}</h3>
      ${eleccion}
      <div class="def-guardias">${guardias}${banquillo}</div>
      ${avisoBanco}
      <p class="note">${t('pvp.def.how')}</p>
      <p class="note">${t('pvp.def.res.d')}</p>`;
  }

  /* ---------- simular un abordaje ---------- */

  function dano(c, miTac, suTac, gano){
    const base = gano ? PVP.VIDA_GANAR : PVP.VIDA;
    const mult = (suTac && R.beats(miTac, suTac)) ? PVP.CONTRA : 1;
    return R.health(c) * base * mult;
  }

  function simularHTML(){
    if (!ultimo) return '';
    const res = ultimo.res, crew = ultimo.crew;

    /* Dos sorteos: cuál de las formaciones plausibles es la de verdad, y
       cuál de sus guardias elige el servidor. */
    const f  = res.forms[Math.floor(Math.random() * res.forms.length)];
    const gi = Math.floor(Math.random() * res.nG);
    const duelos = M.resolver(crew, res.plan, f.g[gi], res.suyos);

    /* Para el marcador cuentan las puntuaciones del duelo ya resuelto, o
       sea con el contador aplicado: quien contrarresta pelea con la suya
       multiplicada. Es lo mismo que decide quién gana el duelo. */
    let miosPts = 0, suyosPts = 0;
    duelos.forEach(d => {
      let mio = d.punto;
      let suyo = d.concede ? 0 : R.score(d.suyo, d.suTac);
      if (!d.concede) {
        if (R.beats(d.tac, d.suTac))      mio  *= PVP.CONTRA_PUNTOS;
        else if (R.beats(d.suTac, d.tac)) suyo *= PVP.CONTRA_PUNTOS;
      }
      miosPts  += mio;
      suyosPts += suyo;
      d.dmg = d.concede ? 0 : dano(d.mio, d.tac, d.suTac, d.gano);
    });

    const ganados = duelos.filter(d => d.gano).length;
    const gana = ganados >= 2;

    /* Qué marcador ha salido, con la misma clave que usa rules.js: así el
       daño sale de la única tabla que hay y no de una copia local. */
    let cual, etiqueta;
    if (ganados === 3 || ganados === 0) {
      cual = ganados === 3 ? 'g30' : 'p03';
      etiqueta = ganados === 3 ? '3-0' : '0-3';
    } else {
      const alto = gana ? miosPts : suyosPts, bajo = gana ? suyosPts : miosPts;
      const amplio = bajo <= 0 || alto / bajo >= R.AMPLIO;
      cual = (gana ? 'g21' : 'p21') + (amplio ? 'a' : 't');
      etiqueta = t(amplio ? 'pvp.hull.wide' : 'pvp.hull.tight');
    }

    const filas = duelos.map((d, i) => `<div class="duelo ${d.gano ? 'gano' : 'perdio'}">
      <span class="pos">${i + 1}</span>
      <span class="lado">
        <b>${esc(nameOf(d.mio))}</b>
        <i>${esc(t('tac.' + d.tac))} · −${num(d.dmg, 1)}</i>
      </span>
      <span class="marca">${d.gano ? '▸' : '◂'}</span>
      <span class="lado der">
        <b>${d.concede ? '—' : esc(nameOf(d.suyo))}</b>
        <i>${d.concede ? '' : esc(t('tac.' + d.suTac))}</i>
      </span>
    </div>`).join('');

    const cabecera = res.completas >= res.nG
      ? `${esc(t('pvp.plan.rolled'))} <b>${esc(t('pvp.riv.guard'))} ${gi + 1}</b>`
      : `${esc(t('pvp.plan.rolledEst'))} <b>${esc(t('pvp.riv.guard'))} ${gi + 1}</b>`;

    return `<div class="sim-caja">
      <p class="hint">${cabecera}</p>
      <p class="sim-res ${gana ? 'win-hi' : 'win-lo'}">
        ${ganados}-${3 - ganados} · ${esc(t(gana ? 'pvp.plan.win' : 'pvp.plan.lose'))}
      </p>
      <div class="duelos">${filas}</div>
      <p class="botin ${gana ? 'gana' : 'pierde'}">${esc(t('pvp.plan.hullTheirs'))} −${num(R.CASCO[cual].el * R.HULL)} · ${esc(etiqueta)}</p>
    </div>`;
  }

  /* ---------- montaje ---------- */

  /* Dos desplegables encadenados, como el mar y la isla del PvE: eliges la
     alianza y el segundo se queda sólo con los suyos. El de alianza sólo
     sale si hay alguna etiqueta puesta — sin ellas no hay nada que elegir y
     sería un control muerto.

     Con "todas" elegido, el segundo sigue saliendo agrupado por etiqueta,
     que no cuesta nada y ahorra el primer paso cuando ya sabes a quién
     buscas. */
  const opcion = r => `<option value="${esc(r.id)}">${esc(r.n)}</option>`;

  const SIN_TAG = 'sin-alianza';   // una etiqueta real es de 3 caracteres [A-Z0-9], asi que no choca

  function llenarAlianzas(){
    if (!els.ali || !els.campoAli) return;
    const tags = RV.tags();
    els.campoAli.hidden = !tags.length;
    if (!tags.length) { els.ali.value = ''; return; }

    const haySueltos = RV.lista().some(r => !r.tag);
    const antes = els.ali.value;
    els.ali.innerHTML =
      `<option value="">${esc(t('pvp.plan.aliAll'))}</option>` +
      tags.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('') +
      (haySueltos ? `<option value="${SIN_TAG}">${esc(t('pvp.plan.sinTag'))}</option>` : '');
    els.ali.value = antes;
    if (els.ali.selectedIndex === -1) els.ali.value = '';
  }

  function llenarSelect(){
    const antes = els.sel.value;
    const filtro = els.ali ? els.ali.value : '';

    const suyos = RV.lista().filter(r =>
      !filtro || (filtro === SIN_TAG ? !r.tag : r.tag === filtro)
    );

    let html = `<option value="">${esc(t('pvp.plan.none'))}</option>`;
    if (filtro) {
      html += suyos.map(opcion).join('');
    } else {
      const grupos = {};
      suyos.forEach(r => { const k = r.tag || ''; (grupos[k] = grupos[k] || []).push(r); });
      const tags = Object.keys(grupos).filter(k => k).sort();
      tags.forEach(k => {
        html += `<optgroup label="${esc(k)}">${grupos[k].map(opcion).join('')}</optgroup>`;
      });
      if (grupos['']) {
        const sueltos = grupos[''].map(opcion).join('');
        html += tags.length
          ? `<optgroup label="${esc(t('pvp.plan.sinTag'))}">${sueltos}</optgroup>`
          : sueltos;
      }
    }

    els.sel.innerHTML = html;
    els.sel.value = antes;
    if (els.sel.selectedIndex === -1) els.sel.value = '';
  }

  function repinta(){
    els.out.innerHTML = planHTML();
    if (els.suyas) els.suyas.innerHTML = suyasHTML();
    els.def.innerHTML = defensaHTML();
  }

  els.sel.addEventListener('change', repinta);

  /* Marcar a uno suyo como Caído cambia TODO: no puede defender, así que
     entra una reserva en su puesto y con ella cambian el plan de ataque y
     las guardias que te convienen. Por eso se repinta la página entera y
     no sólo este panel. */
  if (els.suyas) {
    els.suyas.addEventListener('click', e => {
      const b = e.target.closest('.suyo-tog');
      if (!b) return;
      const r = RV.porId(els.sel.value);
      if (!r) return;
      const quien = b.getAttribute('data-quien');
      const m = r.r.filter(x => x.n === quien)[0];
      if (!m) return;
      RV.setEstado(r.id, quien, m.e === RV.CAIDO ? 'ok' : RV.CAIDO);
      repinta();
    });
  }

  /* Cambiar de defensa repinta solo ese panel. */
  els.def.addEventListener('click', e => {
    const b = e.target.closest('[data-def]');
    if (!b) return;
    const k = b.getAttribute('data-def');
    if (k === defOpcion) return;
    defOpcion = k;
    try { localStorage.setItem(DEF_KEY, k); }
    catch(err){ /* si el navegador lo bloquea, dura la sesión */ }
    els.def.innerHTML = defensaHTML();
  });

  /* Cambiar de alianza rehace la lista de rivales. Si el que tenías elegido
     ya no está en ella, el segundo desplegable vuelve a "elige un rival" y
     los paneles se vacían solos. */
  if (els.ali) {
    els.ali.addEventListener('change', () => { llenarSelect(); repinta(); });
  }

  /* los cuatro marcadores */
  function pintaModo(){
    document.querySelectorAll('.modo-btns .modo').forEach(b => {
      b.classList.toggle('on', b.dataset.modo === modo);
    });
  }
  document.querySelectorAll('.modo-btns .modo').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.modo === modo) return;
      modo = b.dataset.modo;
      try { localStorage.setItem(MODO_KEY, modo); }
      catch(e){ /* si el navegador lo bloquea, dura la sesión */ }
      pintaModo();
      repinta();
    });
  });

  els.out.addEventListener('click', e => {
    if (!e.target.closest('#simBtn')) return;
    const salida = document.getElementById('simOut');
    if (salida) salida.innerHTML = simularHTML();
  });

  document.addEventListener('langchange', () => {
    llenarAlianzas(); llenarSelect(); repinta();
  });

  /* Los desgloses vuelven como los dejaste. */
  const ABRE_KEY = 'opmaps-pvp-abre';
  (function recordarDesgloses(){
    let guardado = {};
    try { guardado = JSON.parse(localStorage.getItem(ABRE_KEY) || '{}') || {}; }
    catch(e){ guardado = {}; }

    document.querySelectorAll('details.plegable[data-k]').forEach(d => {
      const k = d.dataset.k;
      if (Object.prototype.hasOwnProperty.call(guardado, k)) d.open = !!guardado[k];
      d.addEventListener('toggle', () => {
        guardado[k] = d.open;
        try { localStorage.setItem(ABRE_KEY, JSON.stringify(guardado)); }
        catch(e){ /* si el navegador lo bloquea, dura la sesión */ }
      });
    });
  })();

  pintaModo();
  llenarAlianzas();
  llenarSelect();
  repinta();
})();
