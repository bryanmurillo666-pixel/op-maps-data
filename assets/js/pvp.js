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
    out: document.getElementById('resultado'),
    def: document.getElementById('defensa')
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
      const delta = res.media - ahora.media;
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
          <b class="${claseProb(res.media)}">${num(res.media * 100)} %</b>
          <em>${num(res.peor * 100)} % ${esc(t('pvp.def.worstShort'))}</em>
        </div>
      </div>
      <p class="hint">${esc(t(delta > 0.005 ? 'pvp.def.mejora'
                            : (delta < -0.005 ? 'pvp.def.peora' : 'pvp.def.igual')))}</p>`;
    }

    const guardias = res.guardias.map((g, gi) =>
      guardiaHTML(g.puestos, t('pvp.riv.guard') + ' ' + (gi + 1),
        `<span class="hint">${esc(t('pvp.def.falls'))} ${num(g.cae)} / ${num(res.ataques)}</span>`)
    ).join('');

    /* Lo único que sobrevive de los avisos: contra qué se está midiendo.
       Sin esto el número parece de un rival concreto y no lo es, así que
       quitarlo no simplificaría, mentiría. Va como línea, no como caja. */
    const cabecera = generico ? `<p class="note">${t('pvp.def.refD')}</p>` : '';

    return `${cabecera}
      ${comparacion}
      <h3 class="sub-tit">${esc(t('pvp.def.reco'))}</h3>
      <div class="def-guardias">${guardias}</div>
      <p class="note">${t('pvp.def.how')}</p>`;
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

  function llenarSelect(){
    const antes = els.sel.value;
    els.sel.innerHTML = `<option value="">${esc(t('pvp.plan.none'))}</option>` +
      RV.lista().map(r => `<option value="${esc(r.id)}">${esc(r.n)}</option>`).join('');
    els.sel.value = antes;
    if (els.sel.selectedIndex === -1) els.sel.value = '';
  }

  function repinta(){
    els.out.innerHTML = planHTML();
    els.def.innerHTML = defensaHTML();
  }

  els.sel.addEventListener('change', repinta);

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

  document.addEventListener('langchange', () => { llenarSelect(); repinta(); });

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
  llenarSelect();
  repinta();
})();
