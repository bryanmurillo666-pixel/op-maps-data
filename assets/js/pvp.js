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

  /* Lo que cuesta un combate, de la guía v5.1. El casco depende del
     marcador; un 2-1 es "amplio" si el ganador suma al menos 1,25 veces
     los puntos del perdedor. */
  const PVP = {
    VIDA:       0.34,
    VIDA_GANAR: 0.08,
    CONTRA:     0.6,
    AMPLIO:     1.25,
    CONTRA_PUNTOS: 1.75,   // el contador tambien multiplica lo que cuenta para el marcador
    CASCO: {
      tres:   { pierde: 0.35, gana: 0.05 },
      amplio: { pierde: 0.25, gana: 0.10 },
      ajust:  { pierde: 0.18, gana: 0.12 }
    }
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

  /* Dos objetivos. 'ganar' es lo de siempre. 'perder' busca caer 2-1, que
     es la derrota más barata: 18 % de casco en vez del 35 % de un 3-0.
     Sirve cuando quieres perder a propósito — dejarle la victoria a un
     aliado, por ejemplo — o cuando el rival te supera tanto que intentar
     ganar te sale más caro que caer bien. */
  const MODO_KEY = 'opmaps-pvp-modo';
  let modo = 'ganar';
  try { if (localStorage.getItem(MODO_KEY) === 'perder') modo = 'perder'; }
  catch(e){ /* si el navegador lo bloquea, se queda en ganar */ }

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
    const perder = modo === 'perder';

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

    let base;
    if (exacto) {
      base = `<span class="sello exacto">${esc(t('pvp.plan.exact'))}</span>`;
    } else {
      const fam = res.familia ? ` · ${esc(t('pvp.plan.fam.' + res.familia))}` : '';
      base = `<span class="sello estimado">${esc(t('pvp.plan.est'))}</span>
        <span class="hint">${res.nFormaciones} ${esc(t('pvp.plan.forms'))}${fam}</span>`;
      if (res.completas) {
        base += `<span class="hint">${res.completas}/${res.nG} ${esc(t('pvp.plan.known'))}</span>`;
      }
    }

    /* En modo perder la cifra grande es otra: cuántas veces caes 2-1, que
       es lo que se está buscando. El casco medio se enseña en los dos,
       porque es lo que de verdad decide si el plan compensa. */
    const m = res.marcador;
    const grande = perder ? res.tasa21 : res.tasa;
    const titulo = perder ? 'pvp.plan.rate21' : 'pvp.plan.rate';

    let extra = `<span class="cuenta">${esc(t('pvp.plan.hullAvg'))} ${num(m.casco * 100, 1)} %</span>`;
    if (perder) {
      extra = `<span class="cuenta">${esc(t('pvp.plan.alsoWin'))} ${num(res.tasa * 100)} %</span>` + extra;
    }

    /* Dos avisos que le ahorran a uno la mala decisión: cuando el rival es
       tan flojo que no puedes perder a voluntad, y cuando perder te sale
       más barato que intentar ganar. */
    let nota = '';
    if (perder) {
      if (res.tasa21 < 0.5) {
        nota = `<p class="aviso-cambio"><b>${esc(t('pvp.plan.loseHardT'))}</b>
          <span>${t('pvp.plan.loseHard')}</span></p>`;
      } else if (res.tasa < 0.34) {
        nota = `<p class="aviso-pred"><b>${esc(t('pvp.plan.loseGoodT'))}</b>
          <span>${t('pvp.plan.loseGood')}</span></p>`;
      }
    }

    return `<h3 class="sub-tit">${esc(t(titulo))}</h3>
      <p class="gran-prob ${perder ? claseProb(grande) : claseProb(res.tasa)}">${num(grande * 100)} %</p>
      <p class="sellos">${base}</p>
      <p class="sellos">${extra}</p>
      ${nota}

      <h3 class="sub-tit">${esc(t('pvp.plan.line'))}</h3>
      <div class="alineacion">${filas}</div>

      <button class="btn-calc" id="simBtn" type="button">${esc(t('pvp.plan.sim'))}</button>
      <div id="simOut"></div>

      <p class="note">${t(perder ? 'pvp.plan.howLose'
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

  function defensaHTML(){
    const r = RV.porId(els.sel.value);
    if (!r) return `<p class="hint">${esc(t('pvp.def.pick'))}</p>`;

    const crew = mios();
    if (crew.length < 3) {
      return `<p class="hint">${esc(t(crew.length ? 'pvp.sim.few' : 'pvp.sim.empty'))}</p>`;
    }

    const res = M.mejoresGuardias(crew, r);
    if (!res || res.vacio) {
      return `<p class="aviso-cambio"><b>${esc(t('pvp.plan.noDataT'))}</b>
        <span>${esc(t('pvp.def.none'))}</span></p>`;
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
      const titulo = puestas.length ? 'pvp.def.faltanT' : 'pvp.def.sinTuyas';
      const texto  = puestas.length
        ? t('pvp.def.faltan').replace('{n}', nGmias - puestas.length)
        : t('pvp.def.sinTuyasD');
      comparacion = `<p class="aviso-cambio"><b>${esc(t(titulo))}</b>
        <span>${texto}</span></p>`;
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

    // qué dice la predicción, si has apuntado algún ataque suyo
    const pred = res.rec
      ? `<p class="aviso-pred"><b>${esc(t('pvp.def.predT'))}</b>
         <span>${t(res.rec.gano ? 'pvp.def.predWon' : 'pvp.def.predLost')}</span></p>`
      : `<p class="hint">${t('pvp.def.predNone')}</p>`;

    const guardias = res.guardias.map((g, gi) =>
      guardiaHTML(g.puestos, t('pvp.riv.guard') + ' ' + (gi + 1),
        `<span class="hint">${esc(t('pvp.def.falls'))} ${num(g.cae)} / ${num(res.ataques)}</span>`)
    ).join('');

    const aviso = res.peor === 0
      ? `<p class="aviso-cambio"><b>${esc(t('pvp.def.warnT'))}</b>
         <span>${esc(t('pvp.def.warn'))}</span></p>`
      : '';

    return `${comparacion}
      ${pred}
      ${aviso}
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

    let tipo;
    if (ganados === 3 || ganados === 0) tipo = 'tres';
    else {
      const alto = gana ? miosPts : suyosPts, bajo = gana ? suyosPts : miosPts;
      tipo = (bajo <= 0 || alto / bajo >= PVP.AMPLIO) ? 'amplio' : 'ajust';
    }
    const casco = PVP.CASCO[tipo];
    const miCasco = gana ? casco.gana : casco.pierde;
    const etiqueta = tipo === 'tres' ? (ganados === 3 ? '3-0' : '0-3')
                   : t(tipo === 'amplio' ? 'pvp.hull.wide' : 'pvp.hull.tight');

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

    const vidaTot = duelos.reduce((s, d) => s + d.dmg, 0);
    const cabecera = res.completas >= res.nG
      ? `${esc(t('pvp.plan.rolled'))} <b>${esc(t('pvp.riv.guard'))} ${gi + 1}</b>`
      : `${esc(t('pvp.plan.rolledEst'))} <b>${esc(t('pvp.riv.guard'))} ${gi + 1}</b>`;

    return `<div class="sim-caja">
      <p class="hint">${cabecera}</p>
      <p class="sim-res ${gana ? 'win-hi' : 'win-lo'}">
        ${ganados}-${3 - ganados} · ${esc(t(gana ? 'pvp.plan.win' : 'pvp.plan.lose'))}
      </p>
      <div class="duelos">${filas}</div>
      <p class="botin ${gana ? 'gana' : 'pierde'}">${esc(t('pvp.plan.hull'))}: −${num(miCasco * 100)} % · ${esc(etiqueta)}</p>
      <p class="botin neutro">−${num(vidaTot, 1)} ${esc(t('pve.sim.health'))}</p>
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

  /* el interruptor ganar / perder */
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
