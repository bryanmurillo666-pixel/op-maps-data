/* ============================================================
   OP-MAPS DATA — PvP: rivales y plan de ataque
   ------------------------------------------------------------
   Esto es la interfaz. Toda la matemática está en pvp-model.js.

   Tu tripulación sale de crew-store.js y los rivales de
   rivals-store.js. De cada rival se apunta lo que el juego te deja
   ver (su tripulación y en qué banda de salud está cada uno) y lo
   que solo se averigua peleando (sus guardias).

   La página va en tres desgloses: la libreta de rivales, cómo le ganas
   y cómo te defiendes de él. Se da por hecho que tu tripulación está
   entera: quién esté tocado cambia cada media hora y no es lo que se
   viene a mirar aquí.
   ============================================================ */
(function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;
  const C  = window.CREW;
  const RV = window.RIVALES;
  const M  = window.PVP_MODEL;

  /* Lo que cuesta un combate, de la guía v5.0. El casco depende del
     marcador; un 2-1 es "amplio" si el ganador suma al menos 1,25 veces
     los puntos del perdedor. */
  const PVP = {
    VIDA:       0.34,
    VIDA_GANAR: 0.08,
    CONTRA:     0.6,
    AMPLIO:     1.25,
    CASCO: {
      tres:   { pierde: 0.35, gana: 0.05 },
      amplio: { pierde: 0.25, gana: 0.10 },
      ajust:  { pierde: 0.18, gana: 0.12 }
    }
  };


  const els = {
    input:    document.getElementById('rivalAdd'),
    addBtn:   document.getElementById('rivalBtn'),
    lista:    document.getElementById('rivalList'),
    hint:     document.getElementById('rivalHint'),
    count:    document.getElementById('rivCount'),
    sel:      document.getElementById('planRival'),
    out:      document.getElementById('resultado'),
    def:      document.getElementById('defensa'),
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
  const porNombre = n => DB.find(x => x.n === n);

  /* Del texto escrito al nombre en inglés, que es el que se guarda. */
  function aClave(texto){
    const q = fold(texto);
    if (!q) return '';
    if (q === RV.VACIO) return RV.VACIO;
    const c = DB.find(x => fold(x.n) === q || (x.es && fold(x.es) === q));
    return c ? c.n : '';
  }

  /* Tu tripulación, tal cual está en Mi tripulación. Aquí se da por hecho
     que todos están enteros: quién esté tocado en un momento dado cambia
     cada media hora y no es lo que se viene a mirar a esta página. */
  const mios = () => C.personajes();

  /* ---------- pintado: un rival ---------- */

  function opcionesTactica(sel){
    return R.TACTICS.map(tac =>
      '<option value="' + tac + '"' + (tac === sel ? ' selected' : '') + '>' +
      esc(t('tac.' + tac)) + '</option>'
    ).join('');
  }

  function opcionesEstado(sel){
    return RV.ESTADOS.map(e =>
      '<option value="' + e + '"' + (e === sel ? ' selected' : '') + '>' +
      esc(t('pvp.est.' + e)) + '</option>'
    ).join('');
  }

  function miembroHTML(m){
    const c = porNombre(m.n);
    if (!c) return '';
    const tac = R.bestTactic(c);
    return `<div class="suyo est-${m.e}" data-quien="${esc(m.n)}">
      <span class="suyo-n">
        <b>${esc(nameOf(c))}</b>
        <i>${esc(t('tac.' + tac))} ${num(R.score(c, tac))}</i>
      </span>
      <select class="suyo-e" aria-label="${esc(t('pvp.riv.state'))}">${opcionesEstado(m.e)}</select>
      <button type="button" class="btn-x suyo-del" aria-label="${esc(t('pvp.riv.del'))}">×</button>
    </div>`;
  }

  /* En una guardia suya solo puede haber gente suya, así que en vez de
     escribir contra los 226 se elige de su tripulación. Si en el guardado
     hubiera alguien que ya no está en ella, se le deja como opción para
     no borrarlo por la espalda. */
  function opcionesQuien(r, sel){
    const nombres = r.r.map(m => m.n);
    if (sel && sel !== RV.VACIO && nombres.indexOf(sel) === -1) nombres.push(sel);
    const op = (v, txt, extra) =>
      `<option value="${esc(v)}"${v === (sel || '') ? ' selected' : ''}${extra || ''}>${esc(txt)}</option>`;
    return op('', '— ' + t('pvp.riv.unknown') + ' —')
         + op(RV.VACIO, t('pvp.riv.empty'))
         + nombres.map(n => {
             const c = porNombre(n);
             return c ? op(n, nameOf(c)) : '';
           }).join('');
  }

  function puestoHTML(r, p, i){
    const sel = p ? p.n : '';
    return `<div class="puesto" data-p="${i}">
      <span class="pos">${i + 1}</span>
      <select class="p-n" aria-label="${esc(t('pvp.riv.slot'))} ${i + 1}">${opcionesQuien(r, sel)}</select>
      <select class="p-t" aria-label="${esc(t('pvp.riv.tac'))}">${opcionesTactica(p ? p.t : R.TACTICS[0])}</select>
    </div>`;
  }

  /* Cada rival va en su propio desglose: con varios apuntados la página no
     se estira, y se abre solo el que estés mirando. */
  function rivalHTML(r, abierto){
    const nG = RV.nGuardias(r);
    const tope = R.MAX_CREW;
    const lleno = r.r.length >= tope;

    const suyos = r.r.length
      ? `<div class="suyos">${r.r.map(miembroHTML).join('')}</div>`
      : `<p class="hint">${esc(t('pvp.riv.crewNone'))}</p>`;

    const guardias = r.g.slice(0, nG).map((g, gi) => `<div class="guardia" data-g="${gi}">
      <div class="guardia-cab">
        <h5>${esc(t('pvp.riv.guard'))} ${gi + 1}</h5>
        <button type="button" class="btn-x g-clear">${esc(t('pvp.riv.gClear'))}</button>
      </div>
      <div class="puestos">${g.map((p, i) => puestoHTML(r, p, i)).join('')}</div>
    </div>`).join('');

    // cuántas guardias tiene ya averiguadas del todo
    const hechas = r.g.slice(0, nG).filter(g => g.every(p => p)).length;

    return `<details class="rival-card" data-id="${esc(r.id)}"${abierto ? ' open' : ''}>
      <summary>
        <b class="rival-n">${esc(r.n)}</b>
        <span class="cuenta${lleno ? ' full' : ''}">${r.r.length}/${tope}</span>
        <span class="cuenta">${hechas}/${nG} ${esc(t('pvp.riv.gShort'))}</span>
      </summary>
      <div class="plegable-body">
        <div class="rival-top">
          <input class="rival-nom" value="${esc(r.n)}" maxlength="40"
                 aria-label="${esc(t('pvp.riv.name'))}">
          <button type="button" class="btn-x rival-del">${esc(t('pvp.riv.del'))}</button>
        </div>

        <h5 class="bloque-tit">${esc(t('pvp.riv.crew'))} <span class="cuenta${lleno ? ' full' : ''}">${r.r.length}/${tope}</span></h5>
        ${lleno
          ? `<p class="hint">${esc(t('pvp.riv.crewFull'))}</p>`
          : `<div class="add-row chica">
              <input type="text" class="suyo-add" list="db" autocomplete="off"
                     placeholder="${esc(t('pvp.riv.crewPh'))}" aria-label="${esc(t('pvp.riv.crewPh'))}">
              <button type="button" class="btn-add suyo-btn">+</button>
            </div>`}
        ${suyos}
        <p class="note">${t('pvp.riv.stateNote')}</p>

        <h5 class="bloque-tit">${esc(t('pvp.riv.guards'))}</h5>
        ${guardias}
      </div>
    </details>`;
  }

  /* Qué rivales estaban abiertos, para no cerrarlos al repintar. */
  function abiertos(){
    const set = {};
    els.lista.querySelectorAll('.rival-card[open]').forEach(d => { set[d.dataset.id] = true; });
    return set;
  }

  function listaHTML(previos){
    const rs = RV.lista();
    if (!rs.length) return `<p class="hint">${esc(t('pvp.riv.none'))}</p>`;
    return `<div class="rivales">${rs.map(r => rivalHTML(r, previos && previos[r.id])).join('')}</div>`;
  }

  /* ---------- pintado: el plan ---------- */

  let ultimo = null;

  /* Para cada posición, contra quién se pelea en las formaciones que
     quedan en pie y cuántas veces se gana. Es lo que sustituye al viejo
     "sus tres de siempre": ahora puede haber varios candidatos. */
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

    const res = M.evaluar(crew, r);
    if (!res) return `<p class="hint">${esc(t('pvp.sim.few'))}</p>`;
    if (res.vacio) return `<p class="aviso-cambio"><b>${esc(t('pvp.plan.noDataT'))}</b>
      <span>${esc(t('pvp.plan.noData'))}</span></p>`;

    ultimo = { r: r, crew: crew, res: res };

    const exacto = res.completas >= res.nG;

    const filas = res.plan.idx.map((k, i) => {
      const c = crew[k], tac = res.plan.tac[i];
      const contra = rivalesDePosicion(res, c, tac, i).slice(0, 4).map(x => {
        const quien = x.n === '-' ? '—' : nameOf(porNombre(x.n));
        const clase = x.g === x.t ? 'vs-gano' : (x.g === 0 ? 'vs-perdio' : 'vs-mix');
        const marca = (x.g === x.t || x.g === 0) ? '' : ` ${x.g}/${x.t}`;
        return `<span class="vs ${clase}">${esc(quien)}${marca}</span>`;
      }).join('');
      const seg = tac === 'Assault' ? 'f' : (tac === 'Manoeuvre' ? 'v' : 'i');
      return `<div class="linea">
        <span class="pos">${i + 1}</span>
        <span class="quien">
          <b>${esc(nameOf(c))}</b>
          <i>${esc(t('rn.' + c.r))}</i>
        </span>
        <span class="tac-pill tac-${seg}">${esc(t('tac.' + tac))} · ${num(R.score(c, tac))}</span>
        <span class="contras">${contra}</span>
      </div>`;
    }).join('');

    // De qué está hecho el número: exacto, estimado, o mezcla.
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

    return `<h3 class="sub-tit">${esc(t('pvp.plan.rate'))}</h3>
      <p class="gran-prob ${claseProb(res.tasa)}">${num(res.tasa * 100)} %</p>
      <p class="sellos">${base}</p>

      <h3 class="sub-tit">${esc(t('pvp.plan.line'))}</h3>
      <div class="alineacion">${filas}</div>

      <button class="btn-calc" id="simBtn" type="button">${esc(t('pvp.plan.sim'))}</button>
      <div id="simOut"></div>

      <p class="note">${t(exacto ? 'pvp.plan.howExact' : 'pvp.plan.howEst')}</p>`;
  }

  /* ---------- pintado: tus guardias contra él ---------- */

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

    const seg = x => x === 'Assault' ? 'f' : (x === 'Manoeuvre' ? 'v' : 'i');

    const guardias = res.guardias.map((g, gi) => `<div class="guardia">
      <div class="guardia-cab">
        <h5>${esc(t('pvp.riv.guard'))} ${gi + 1}</h5>
        <span class="hint">${esc(t('pvp.def.falls'))} ${num(g.cae)} / ${num(res.ataques)}</span>
      </div>
      <div class="puestos">${g.puestos.map((p, i) => `
        <div class="puesto-fijo">
          <span class="pos">${i + 1}</span>
          <b>${esc(nameOf(p.c))}</b>
          <span class="tac-pill tac-${seg(p.t)}">${esc(t('tac.' + p.t))}</span>
        </div>`).join('')}</div>
    </div>`).join('');

    // Que pueda tumbarte las tres con una sola jugada es lo que de verdad
    // hay que avisar: significa que no estás repartiendo el riesgo.
    const aviso = res.peor === 0
      ? `<p class="aviso-cambio"><b>${esc(t('pvp.def.warnT'))}</b>
         <span>${esc(t('pvp.def.warn'))}</span></p>`
      : '';

    return `<h3 class="sub-tit">${esc(t('pvp.def.avg'))}</h3>
      <p class="gran-prob ${claseProb(res.media)}">${num(res.media * 100)} %</p>
      <p class="sellos">
        <span class="sello ${res.peor >= 0.5 ? 'exacto' : 'estimado'}">${num(res.peor * 100)} %</span>
        <span class="hint">${esc(t('pvp.def.worst'))}</span>
      </p>
      ${aviso}
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

    /* Dos sorteos: cuál de las formaciones plausibles es la de verdad
       (si ya las conoces todas, solo hay una) y cuál de sus guardias
       elige el servidor. */
    const f  = res.forms[Math.floor(Math.random() * res.forms.length)];
    const gi = Math.floor(Math.random() * res.nG);

    const duelos = M.resolver(crew, res.plan, f.g[gi], res.suyos);

    let mios = 0, suyos = 0;
    duelos.forEach(d => {
      mios  += d.punto;
      suyos += d.concede ? 0 : R.score(d.suyo, d.suTac);
      d.dmg  = d.concede ? 0 : dano(d.mio, d.tac, d.suTac, d.gano);
    });

    const ganados = duelos.filter(d => d.gano).length;
    const gana = ganados >= 2;

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

  function rellenarDatalist(){
    els.datalist.innerHTML = DB.map(c => `<option value="${esc(nameOf(c))}"></option>`).join('');
  }

  function repintaPlan(){
    els.out.innerHTML = planHTML();
    els.def.innerHTML = defensaHTML();
  }

  /* Repintar cierra los desgloses, así que antes se apunta cuáles estaban
     abiertos. `abrir` fuerza uno más, para el rival que acabas de crear. */
  function render(abrir){
    const previos = abiertos();
    if (abrir) previos[abrir] = true;
    els.lista.innerHTML = listaHTML(previos);
    const n = RV.lista().length;
    els.count.textContent = n ? n : '';
    llenarSelect();
    repintaPlan();
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
    render(id);                 // el nuevo se queda abierto
    els.sel.value = id;
    repintaPlan();
    els.input.focus();
  }

  els.addBtn.addEventListener('click', anadirRival);
  els.input.addEventListener('keydown', e => { if (e.key === 'Enter') anadirRival(); });


  els.lista.addEventListener('click', e => {
    const card = e.target.closest('.rival-card');
    if (!card) return;
    const id = card.dataset.id;

    if (e.target.closest('.rival-del')) { RV.borrar(id); render(); return; }

    if (e.target.closest('.suyo-btn')) {
      const campo = card.querySelector('.suyo-add');
      const clave = aClave(campo.value);
      if (!clave || clave === RV.VACIO) { campo.classList.add('err'); aviso('pvp.riv.notFound'); return; }
      const q = RV.addMiembro(id, clave);
      if (q === 'llena') { aviso('pvp.riv.crewFull'); return; }
      if (q !== 'ok')    { aviso('pvp.riv.dupe'); return; }
      campo.value = '';
      render();
      return;
    }

    const suyoDel = e.target.closest('.suyo-del');
    if (suyoDel) {
      RV.delMiembro(id, suyoDel.closest('.suyo').dataset.quien);
      render();
      return;
    }

    const gClear = e.target.closest('.g-clear');
    if (gClear) {
      RV.vaciarGuardia(id, Number(gClear.closest('.guardia').dataset.g));
      render();
    }
  });

  els.lista.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.classList.contains('suyo-add')) return;
    e.preventDefault();
    e.target.closest('.rival-card').querySelector('.suyo-btn').click();
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
      repintaPlan();
      return;
    }

    if (e.target.classList.contains('suyo-e')) {
      const fila = e.target.closest('.suyo');
      RV.setEstado(id, fila.dataset.quien, e.target.value);
      fila.className = 'suyo est-' + e.target.value;
      repintaPlan();
      return;
    }

    const puesto = e.target.closest('.puesto');
    if (!puesto) return;
    const gi    = Number(puesto.closest('.guardia').dataset.g);
    const pos   = Number(puesto.dataset.p);
    const quien = puesto.querySelector('.p-n').value;
    const tac   = puesto.querySelector('.p-t').value;
    RV.setPuesto(id, gi, pos, quien, tac);
    repintaPlan();
  });

  els.sel.addEventListener('change', repintaPlan);

  els.out.addEventListener('click', e => {
    if (!e.target.closest('#simBtn')) return;
    const salida = document.getElementById('simOut');
    if (salida) salida.innerHTML = simularHTML();
  });

  document.addEventListener('langchange', () => { rellenarDatalist(); render(); });

  /* Los tres desgloses vuelven como los dejaste. */
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

  rellenarDatalist();
  render();
})();
