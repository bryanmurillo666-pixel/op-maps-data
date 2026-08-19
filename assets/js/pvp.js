/* ============================================================
   OP-MAPS DATA — PvP: rivales y plan de ataque
   ------------------------------------------------------------
   Tu tripulación sale de crew-store.js y los rivales de
   rivals-store.js. Toda la puntuación y los duelos, de rules.js.

   La idea, ya con la guía v5.0 en la mano: las guardias de un rival
   se pueden averiguar (los informes de combate se comparten y eso es
   scouting legítimo), pero NO cuál de ellas te va a salir — el
   servidor elige una al azar, uniforme, entre las que tenga, y no
   excluye la que acaba de salir.

   Así que aquí apuntas las guardias que le has visto y se prueba cada
   plan de ataque posible contra todas ellas. La tasa de éxito es
   exacta: guardias que le ganarías entre guardias que tiene.
   ============================================================ */
(function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;
  const C  = window.CREW;
  const RV = window.RIVALES;

  /* Lo que cuesta un combate, de la guía v5.0. El casco depende del
     marcador; un 2-1 es "amplio" si el ganador suma al menos 1,25 veces
     los puntos del perdedor. */
  const PVP = {
    VIDA:       0.34,   // el que pierde su duelo
    VIDA_GANAR: 0.08,   // el que lo gana
    CONTRA:     0.6,    // ×0,6 si contrarrestaste su táctica
    AMPLIO:     1.25,
    CASCO: {
      tres:   { pierde: 0.35, gana: 0.05 },
      amplio: { pierde: 0.25, gana: 0.10 },
      ajust:  { pierde: 0.18, gana: 0.12 }
    }
  };

  /* Los dos estados de un puesto rival que no es un luchador normal. */
  const SIN = 'sin', CONCEDE = 'concede';

  const els = {
    input:    document.getElementById('rivalAdd'),
    addBtn:   document.getElementById('rivalBtn'),
    lista:    document.getElementById('rivalList'),
    hint:     document.getElementById('rivalHint'),
    crew:     document.getElementById('miCrew'),
    sel:      document.getElementById('planRival'),
    out:      document.getElementById('resultado'),
    datalist: document.getElementById('db')
  };

  /* ---------- utilidades ---------- */

  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';
  const nameOf = c => (isES() && c.es) ? c.es : c.n;

  function fold(s){
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
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

  /* Del texto escrito al nombre en inglés, que es el que se guarda.
     Busca en los dos idiomas y sin acentos. */
  function aClave(texto){
    const q = fold(texto);
    if (!q) return '';
    if (q === RV.VACIO) return RV.VACIO;
    const c = DB.find(x => fold(x.n) === q || (x.es && fold(x.es) === q));
    return c ? c.n : '';
  }
  const porNombre = n => DB.find(x => x.n === n);

  /* ---------- el cálculo ---------- */

  /* Cómo defiende ese puesto: sin apuntar, concedido, o su puntuación
     ya calculada. */
  function defensor(p){
    if (!p) return SIN;
    if (p.n === RV.VACIO) return CONCEDE;
    const c = porNombre(p.n);
    if (!c) return SIN;
    return { punto: R.score(c, p.t), tac: p.t, c: c };
  }

  /* ¿Me llevo el puesto? Un puesto que no has apuntado cuenta como
     PERDIDO a propósito: así la tasa que se enseña nunca peca de
     optimista por lo que todavía no sabes. */
  function ganoPuesto(miPunto, miTac, def){
    if (def === SIN)     return false;
    if (def === CONCEDE) return true;
    return R.duelWin(miPunto, miTac, def.punto, def.tac);
  }

  /* El mejor plan: tres de los tuyos, en orden, cada uno con su táctica.
     Se prueban todas las combinaciones contra todas las guardias y gana
     la que más guardias se lleva. A igualdad, la que gana más duelos
     sueltos, porque cada duelo perdido cuesta el 34 % de la vida. */
  function mejorPlan(crew, guardias){
    const T = R.TACTICS;
    /* Precalculado: el bucle es grande y si no, R.score() se llamaría
       cientos de miles de veces. */
    const misPuntos = crew.map(c => T.map(tac => R.score(c, tac)));
    const defs = guardias.map(g => g.map(defensor));
    const n = crew.length;

    let mejor = null;
    for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++){ if (b === a) continue;
    for (let c = 0; c < n; c++){ if (c === a || c === b) continue;
      for (let x = 0; x < 3; x++)
      for (let y = 0; y < 3; y++)
      for (let z = 0; z < 3; z++){
        let ganadas = 0, duelos = 0;
        for (let g = 0; g < defs.length; g++){
          const d = defs[g];
          let k = 0;
          if (ganoPuesto(misPuntos[a][x], T[x], d[0])) k++;
          if (ganoPuesto(misPuntos[b][y], T[y], d[1])) k++;
          if (ganoPuesto(misPuntos[c][z], T[z], d[2])) k++;
          duelos += k;
          if (k >= 2) ganadas++;
        }
        if (!mejor || ganadas > mejor.ganadas ||
            (ganadas === mejor.ganadas && duelos > mejor.duelos)){
          mejor = { ganadas: ganadas, duelos: duelos,
                    idx: [a, b, c], tac: [T[x], T[y], T[z]] };
        }
      }
    }}
    return mejor;
  }

  /* ---------- pintado: los rivales ---------- */

  function opcionesTactica(sel){
    return R.TACTICS.map(tac =>
      '<option value="' + tac + '"' + (tac === sel ? ' selected' : '') + '>' +
      esc(t('tac.' + tac)) + '</option>'
    ).join('');
  }

  function puestoHTML(p, i){
    const c = (p && p.n !== RV.VACIO) ? porNombre(p.n) : null;
    const valor = p ? (p.n === RV.VACIO ? RV.VACIO : (c ? nameOf(c) : '')) : '';
    return `<div class="puesto" data-p="${i}">
      <span class="pos">${i + 1}</span>
      <input class="p-n" list="db" autocomplete="off" value="${esc(valor)}"
             placeholder="${esc(t('pvp.riv.slot'))}"
             aria-label="${esc(t('pvp.riv.slot'))} ${i + 1}">
      <select class="p-t" aria-label="${esc(t('pvp.riv.tac'))}">${opcionesTactica(p ? p.t : R.TACTICS[0])}</select>
    </div>`;
  }

  function rivalHTML(r){
    const guardias = r.g.map((g, gi) => `<div class="guardia" data-g="${gi}">
      <div class="guardia-cab">
        <h5>${esc(t('pvp.riv.guard'))} ${gi + 1}</h5>
        ${r.g.length > 1 ? `<button type="button" class="btn-x g-del">${esc(t('pvp.riv.gDel'))}</button>` : ''}
      </div>
      <div class="puestos">${g.map(puestoHTML).join('')}</div>
    </div>`).join('');

    return `<div class="rival-card" data-id="${esc(r.id)}">
      <div class="rival-top">
        <input class="rival-nom" value="${esc(r.n)}" maxlength="40"
               aria-label="${esc(t('pvp.riv.name'))}">
        <button type="button" class="btn-x rival-del">${esc(t('pvp.riv.del'))}</button>
      </div>
      ${guardias}
      ${r.g.length < RV.GUARDIAS
        ? `<button type="button" class="btn-mini g-add">+ ${esc(t('pvp.riv.guard'))}</button>`
        : `<p class="hint">${esc(t('pvp.riv.full'))}</p>`}
    </div>`;
  }

  function listaHTML(){
    const rs = RV.lista();
    if (!rs.length) return `<p class="hint">${esc(t('pvp.riv.none'))}</p>`;
    return `<div class="rivales">${rs.map(rivalHTML).join('')}</div>`;
  }

  /* ---------- pintado: tu tripulación ---------- */

  function crewHTML(){
    const crew = C.personajes();
    if (!crew.length) return `<p class="hint">${esc(t('pvp.sim.empty'))}</p>`;
    return `<div class="mini-crew">${crew.map(c => {
      const tac = R.bestTactic(c);
      return `<span class="mini-chip"><b>${esc(nameOf(c))}</b><i>${esc(t('tac.' + tac))} ${num(R.score(c, tac))}</i></span>`;
    }).join('')}</div>`;
  }

  /* ---------- pintado: el plan ---------- */

  let ultimoPlan = null;

  function planHTML(){
    ultimoPlan = null;
    const r = RV.porId(els.sel.value);
    if (!r) return `<p class="hint">${esc(t('pvp.plan.pick2'))}</p>`;

    const crew = C.personajes();
    if (crew.length < 3) {
      return `<p class="hint">${esc(t(crew.length ? 'pvp.sim.few' : 'pvp.sim.empty'))}</p>`;
    }

    const plan = mejorPlan(crew, r.g);
    const prob = plan.ganadas / r.g.length;
    ultimoPlan = { r: r, crew: crew, plan: plan };

    // Puestos sin apuntar: dicen lo fiable que es el número de arriba.
    let sinApuntar = 0;
    r.g.forEach(g => g.forEach(p => { if (!p) sinApuntar++; }));

    const filas = plan.idx.map((k, i) => {
      const c = crew[k], tac = plan.tac[i];
      const miPunto = R.score(c, tac);
      const detalle = r.g.map((g, gi) => {
        const def = defensor(g[i]);
        const gano = ganoPuesto(miPunto, tac, def);
        const quien = def === SIN ? '?' : (def === CONCEDE ? '—' : nameOf(def.c));
        const clase = def === SIN ? 'vs-sin' : (gano ? 'vs-gano' : 'vs-perdio');
        return `<span class="vs ${clase}" title="${esc(t('pvp.riv.guard'))} ${gi + 1}">${esc(quien)}</span>`;
      }).join('');
      const seg = tac === 'Assault' ? 'f' : (tac === 'Manoeuvre' ? 'v' : 'i');
      return `<div class="linea">
        <span class="pos">${i + 1}</span>
        <span class="quien">
          <b>${esc(nameOf(c))}</b>
          <i>${esc(t('rn.' + c.r))}</i>
        </span>
        <span class="tac-pill tac-${seg}">${esc(t('tac.' + tac))} · ${num(miPunto)}</span>
        <span class="contras">${detalle}</span>
      </div>`;
    }).join('');

    return `<h3 class="sub-tit">${esc(t('pvp.plan.rate'))}</h3>
      <p class="gran-prob ${claseProb(prob)}">${num(prob * 100)} %</p>
      <p class="hint">${esc(t('pvp.plan.of'))} ${plan.ganadas} / ${r.g.length}</p>

      <h3 class="sub-tit">${esc(t('pvp.plan.line'))}</h3>
      <div class="alineacion">${filas}</div>

      ${sinApuntar ? `<p class="aviso-cambio"><b>${esc(t("pvp.plan.holesT"))}</b><span>${esc(t("pvp.plan.holes"))} ${sinApuntar}</span></p>` : ""}

      <button class="btn-calc" id="simBtn" type="button">${esc(t('pvp.plan.sim'))}</button>
      <div id="simOut"></div>

      <p class="note">${t('pvp.plan.how')}</p>`;
  }

  /* ---------- simular un abordaje ---------- */

  function dano(c, miTac, suTac, gano){
    const base = gano ? PVP.VIDA_GANAR : PVP.VIDA;
    const mult = (suTac && R.beats(miTac, suTac)) ? PVP.CONTRA : 1;
    return R.health(c) * base * mult;
  }

  function simularHTML(){
    if (!ultimoPlan) return '';
    const r = ultimoPlan.r, crew = ultimoPlan.crew, plan = ultimoPlan.plan;

    // El servidor elige una guardia al azar, y ninguna queda excluida.
    const gi = Math.floor(Math.random() * r.g.length);
    const guardia = r.g[gi];

    let mios = 0, suyos = 0;
    const duelos = plan.idx.map((k, i) => {
      const c = crew[k], tac = plan.tac[i];
      const def = defensor(guardia[i]);
      const miPunto = R.score(c, tac);
      const gano = ganoPuesto(miPunto, tac, def);
      mios  += miPunto;
      suyos += (def === SIN || def === CONCEDE) ? 0 : def.punto;
      /* Un puesto que el rival concede no tiene a nadie enfrente, así que
         no cuesta vida. Uno sin apuntar sí: se cuenta como duelo perdido
         para no dar un número más bonito de lo que sabes. */
      const dmg = (def === CONCEDE) ? 0
                : dano(c, tac, def === SIN ? null : def.tac, gano);
      return { c: c, tac: tac, def: def, gano: gano, dmg: dmg };
    });

    const ganados = duelos.filter(d => d.gano).length;
    const gana = ganados >= 2;

    // Casco: 3-0, o 2-1 amplio/ajustado según la suma de puntos.
    let tipo;
    if (ganados === 3 || ganados === 0) tipo = 'tres';
    else {
      const alto = gana ? mios : suyos, bajo = gana ? suyos : mios;
      tipo = (bajo <= 0 || alto / bajo >= PVP.AMPLIO) ? 'amplio' : 'ajust';
    }
    const casco = PVP.CASCO[tipo];
    const miCasco = gana ? casco.gana : casco.pierde;
    const etiqueta = tipo === 'tres' ? (ganados === 3 ? '3-0' : '0-3')
                   : t(tipo === 'amplio' ? 'pvp.hull.wide' : 'pvp.hull.tight');

    const filas = duelos.map((d, i) => {
      const quien = d.def === SIN ? '?' : (d.def === CONCEDE ? '—' : nameOf(d.def.c));
      const suTac = (d.def === SIN || d.def === CONCEDE) ? '' : t('tac.' + d.def.tac);
      return `<div class="duelo ${d.gano ? 'gano' : 'perdio'}">
        <span class="pos">${i + 1}</span>
        <span class="lado">
          <b>${esc(nameOf(d.c))}</b>
          <i>${esc(t('tac.' + d.tac))} · −${num(d.dmg, 1)}</i>
        </span>
        <span class="marca">${d.gano ? '▸' : '◂'}</span>
        <span class="lado der">
          <b>${esc(quien)}</b><i>${esc(suTac)}</i>
        </span>
      </div>`;
    }).join('');

    const vidaTot = duelos.reduce((s, d) => s + d.dmg, 0);

    return `<div class="sim-caja">
      <p class="hint">${esc(t('pvp.plan.rolled'))} <b>${esc(t('pvp.riv.guard'))} ${gi + 1}</b></p>
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

  function rellenarDatalist(){
    els.datalist.innerHTML = DB.map(c => `<option value="${esc(nameOf(c))}"></option>`).join('');
  }

  function render(){
    els.crew.innerHTML  = crewHTML();
    els.lista.innerHTML = listaHTML();
    llenarSelect();
    els.out.innerHTML   = planHTML();
  }

  let avisoTimer = null;
  function aviso(clave){
    els.hint.textContent = t(clave);
    els.hint.classList.add('err');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => {
      els.hint.textContent = '';
      els.hint.classList.remove('err');
    }, 2800);
  }

  /* ---------- eventos ---------- */

  function anadirRival(){
    const id = RV.añadir(els.input.value);
    if (!id) { aviso('pvp.riv.bad'); return; }
    els.input.value = '';
    render();
    els.sel.value = id;
    els.out.innerHTML = planHTML();
    els.input.focus();
  }

  els.addBtn.addEventListener('click', anadirRival);
  els.input.addEventListener('keydown', e => { if (e.key === 'Enter') anadirRival(); });

  // Botones de las tarjetas: borrar rival, quitar guardia, añadir guardia.
  els.lista.addEventListener('click', e => {
    const card = e.target.closest('.rival-card');
    if (!card) return;
    const id = card.dataset.id;
    if (e.target.closest('.rival-del')) { RV.borrar(id); render(); return; }
    if (e.target.closest('.g-add'))     { RV.addGuardia(id); render(); return; }
    const gDel = e.target.closest('.g-del');
    if (gDel) {
      RV.delGuardia(id, Number(gDel.closest('.guardia').dataset.g));
      render();
    }
  });

  /* Los campos se guardan al salir del campo (change), no en cada tecla:
     repintar mientras escribes te quitaría el foco. */
  els.lista.addEventListener('change', e => {
    const card = e.target.closest('.rival-card');
    if (!card) return;
    const id = card.dataset.id;

    if (e.target.classList.contains('rival-nom')) {
      RV.renombrar(id, e.target.value);
      llenarSelect();
      els.out.innerHTML = planHTML();
      return;
    }

    const puesto = e.target.closest('.puesto');
    if (!puesto) return;
    const gi    = Number(puesto.closest('.guardia').dataset.g);
    const pos   = Number(puesto.dataset.p);
    const campo = puesto.querySelector('.p-n');
    const tac   = puesto.querySelector('.p-t').value;
    const clave = aClave(campo.value);

    if (campo.value.trim() && !clave) {
      campo.classList.add('err');
      aviso('pvp.riv.notFound');
      return;
    }
    campo.classList.remove('err');
    // Se reescribe con el nombre tal cual lo llama el juego en este idioma.
    if (clave && clave !== RV.VACIO) campo.value = nameOf(porNombre(clave));
    RV.setPuesto(id, gi, pos, clave, tac);
    els.out.innerHTML = planHTML();
  });

  els.sel.addEventListener('change', () => { els.out.innerHTML = planHTML(); });

  els.out.addEventListener('click', e => {
    if (!e.target.closest('#simBtn')) return;
    const salida = document.getElementById('simOut');
    if (salida) salida.innerHTML = simularHTML();
  });

  document.addEventListener('langchange', () => { rellenarDatalist(); render(); });

  rellenarDatalist();
  render();
})();
