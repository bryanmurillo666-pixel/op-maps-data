/* ============================================================
   OP-MAPS DATA — PvP: rivales y plan de ataque
   ------------------------------------------------------------
   Esto es la interfaz. Toda la matemática está en pvp-model.js.

   Tu tripulación sale de crew-store.js y los rivales de
   rivals-store.js. De cada rival se apunta lo que el juego te deja
   ver (su tripulación y en qué banda de salud está cada uno) y lo
   que solo se averigua peleando (sus guardias).

   Los tuyos que estén caídos se marcan aquí y quedan fuera del plan:
   no pueden desembarcar ni abordar.
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

  const CAIDOS_KEY = 'opmaps-caidos';

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
  const porNombre = n => DB.find(x => x.n === n);

  /* Del texto escrito al nombre en inglés, que es el que se guarda. */
  function aClave(texto){
    const q = fold(texto);
    if (!q) return '';
    if (q === RV.VACIO) return RV.VACIO;
    const c = DB.find(x => fold(x.n) === q || (x.es && fold(x.es) === q));
    return c ? c.n : '';
  }

  /* ---------- los tuyos que están caídos ---------- */

  let caidos = {};
  function cargarCaidos(){
    try {
      const g = JSON.parse(localStorage.getItem(CAIDOS_KEY) || '[]');
      caidos = {};
      if (Array.isArray(g)) g.forEach(n => { caidos[n] = true; });
    } catch(e){ caidos = {}; }
  }
  function guardarCaidos(){
    try { localStorage.setItem(CAIDOS_KEY, JSON.stringify(Object.keys(caidos))); }
    catch(e){ /* si el navegador lo bloquea, dura la sesión */ }
  }
  const enPie = () => C.personajes().filter(c => !caidos[c.n]);

  /* ---------- pintado: tu tripulación ---------- */

  function crewHTML(){
    const crew = C.personajes();
    if (!crew.length) return `<p class="hint">${esc(t('pvp.sim.empty'))}</p>`;
    return `<div class="mini-crew">${crew.map(c => {
      const tac = R.bestTactic(c);
      const ko = !!caidos[c.n];
      return `<button type="button" class="mini-chip mio${ko ? ' ko' : ''}"
                data-mio="${esc(c.n)}" title="${esc(t('pvp.mine.toggle'))}">
        <b>${esc(nameOf(c))}</b>
        <i>${ko ? esc(t('pvp.est.ko')) : esc(t('tac.' + tac)) + ' ' + num(R.score(c, tac))}</i>
      </button>`;
    }).join('')}</div>
    <p class="hint">${esc(t('pvp.mine.hint'))}</p>`;
  }

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
    const nG = RV.nGuardias(r);

    const suyos = r.r.length
      ? `<div class="suyos">${r.r.map(miembroHTML).join('')}</div>`
      : `<p class="hint">${esc(t('pvp.riv.crewNone'))}</p>`;

    const guardias = r.g.slice(0, nG).map((g, gi) => `<div class="guardia" data-g="${gi}">
      <div class="guardia-cab">
        <h5>${esc(t('pvp.riv.guard'))} ${gi + 1}</h5>
        <button type="button" class="btn-x g-clear">${esc(t('pvp.riv.gClear'))}</button>
      </div>
      <div class="puestos">${g.map(puestoHTML).join('')}</div>
    </div>`).join('');

    return `<div class="rival-card" data-id="${esc(r.id)}">
      <div class="rival-top">
        <input class="rival-nom" value="${esc(r.n)}" maxlength="40"
               aria-label="${esc(t('pvp.riv.name'))}">
        <button type="button" class="btn-x rival-del">${esc(t('pvp.riv.del'))}</button>
      </div>

      <h5 class="bloque-tit">${esc(t('pvp.riv.crew'))}</h5>
      <div class="add-row chica">
        <input type="text" class="suyo-add" list="db" autocomplete="off"
               placeholder="${esc(t('pvp.riv.crewPh'))}" aria-label="${esc(t('pvp.riv.crewPh'))}">
        <button type="button" class="btn-add suyo-btn">+</button>
      </div>
      ${suyos}
      <p class="note">${t('pvp.riv.stateNote')}</p>

      <h5 class="bloque-tit">${esc(t('pvp.riv.guards'))}</h5>
      ${guardias}
    </div>`;
  }

  function listaHTML(){
    const rs = RV.lista();
    if (!rs.length) return `<p class="hint">${esc(t('pvp.riv.none'))}</p>`;
    return `<div class="rivales">${rs.map(rivalHTML).join('')}</div>`;
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

    const crew = enPie();
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

  function repintaPlan(){ els.out.innerHTML = planHTML(); }

  function render(){
    els.crew.innerHTML  = crewHTML();
    els.lista.innerHTML = listaHTML();
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
    render();
    els.sel.value = id;
    repintaPlan();
    els.input.focus();
  }

  els.addBtn.addEventListener('click', anadirRival);
  els.input.addEventListener('keydown', e => { if (e.key === 'Enter') anadirRival(); });

  // marcar a uno de los tuyos como caído
  els.crew.addEventListener('click', e => {
    const b = e.target.closest('[data-mio]');
    if (!b) return;
    const n = b.dataset.mio;
    if (caidos[n]) delete caidos[n]; else caidos[n] = true;
    guardarCaidos();
    els.crew.innerHTML = crewHTML();
    repintaPlan();
  });

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
      if (q !== 'ok') { aviso('pvp.riv.dupe'); return; }
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
    const campo = puesto.querySelector('.p-n');
    const tac   = puesto.querySelector('.p-t').value;
    const clave = aClave(campo.value);

    if (campo.value.trim() && !clave) {
      campo.classList.add('err');
      aviso('pvp.riv.notFound');
      return;
    }
    campo.classList.remove('err');
    if (clave && clave !== RV.VACIO) campo.value = nameOf(porNombre(clave));
    RV.setPuesto(id, gi, pos, clave, tac);
    repintaPlan();
  });

  els.sel.addEventListener('change', repintaPlan);

  els.out.addEventListener('click', e => {
    if (!e.target.closest('#simBtn')) return;
    const salida = document.getElementById('simOut');
    if (salida) salida.innerHTML = simularHTML();
  });

  document.addEventListener('langchange', () => { rellenarDatalist(); render(); });

  cargarCaidos();
  rellenarDatalist();
  render();
})();
