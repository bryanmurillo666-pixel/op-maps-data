/* ============================================================
   OP-MAPS DATA — página Mis rivales
   ------------------------------------------------------------
   La libreta. De cada rival se apunta lo que el juego te deja ver
   (su tripulación y en qué banda de salud está cada uno), lo que
   solo se averigua peleando (sus guardias) y lo que te ha hecho a
   ti (sus ataques, con si le salieron bien o mal).

   El PvP no edita nada de esto: solo lo lee para calcular.
   ============================================================ */
(function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;
  const RV = window.RIVALES;

  const els = {
    input:    document.getElementById('rivalAdd'),
    addBtn:   document.getElementById('rivalBtn'),
    lista:    document.getElementById('rivalList'),
    hint:     document.getElementById('rivalHint'),
    count:    document.getElementById('rivCount'),
    expOut:   document.getElementById('expOut'),
    expBtn:   document.getElementById('expBtn'),
    expHint:  document.getElementById('expHint'),
    impIn:    document.getElementById('impIn'),
    impBtn:   document.getElementById('impBtn'),
    impHint:  document.getElementById('impHint'),
    datalist: document.getElementById('db'),
    filtros:  document.getElementById('rivFiltros'),
    buscar:   document.getElementById('rivBuscar'),
    tag:      document.getElementById('rivTag'),
    tagAyuda: document.getElementById('rivTagAyuda'),
    tagsLista:document.getElementById('tagsUsados')
  };

  /* ---------- utilidades ---------- */

  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';
  const nameOf = c => (isES() && c.es) ? c.es : c.n;
  const porNombre = n => DB.find(x => x.n === n);

  function fold(s){
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function esc(s){
    return String(s).replace(/[&<>"']/g, m => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
    ));
  }
  function num(n){
    return Number(n).toLocaleString(isES() ? 'es-ES' : 'en-GB',
      { maximumFractionDigits: 0 });
  }
  function aClave(texto){
    const q = fold(texto);
    if (!q) return '';
    const c = DB.find(x => fold(x.n) === q || (x.es && fold(x.es) === q));
    return c ? c.n : '';
  }

  /* ---------- piezas ---------- */

  function opcionesTactica(sel, clase){
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
    return `<div class="suyo est-${m.e}" data-quien="${esc(m.n)}">
      <span class="suyo-n"><b>${esc(nameOf(c))}</b></span>
      <select class="suyo-e" aria-label="${esc(t('pvp.riv.state'))}">${opcionesEstado(m.e)}</select>
      <button type="button" class="btn-x suyo-del" aria-label="${esc(t('pvp.riv.del'))}">×</button>
    </div>`;
  }

  /* En una guardia suya solo puede haber gente suya, así que se elige de
     su tripulación en vez de escribir contra los 226. Si en el guardado
     quedara alguien que ya no está en ella, se le deja como opción para
     no borrarlo por la espalda. */
  function opcionesQuien(r, sel){
    const nombres = r.r.map(m => m.n);
    if (sel && sel !== RV.VACIO && nombres.indexOf(sel) === -1) nombres.push(sel);
    const op = (v, txt) =>
      `<option value="${esc(v)}"${v === (sel || '') ? ' selected' : ''}>${esc(txt)}</option>`;
    return op('', '— ' + t('pvp.riv.unknown') + ' —')
         + op(RV.VACIO, t('pvp.riv.empty'))
         + nombres.map(n => {
             const c = porNombre(n);
             return c ? op(n, nameOf(c)) : '';
           }).join('');
  }

  function puestoHTML(r, p, i, clase){
    return `<div class="puesto" data-p="${i}">
      <span class="pos">${i + 1}</span>
      <select class="${clase}-n" aria-label="${esc(t('pvp.riv.slot'))} ${i + 1}">${opcionesQuien(r, p ? p.n : '')}</select>
      <select class="${clase}-t" aria-label="${esc(t('pvp.riv.tac'))}">${opcionesTactica(p ? p.t : R.TACTICS[0])}</select>
    </div>`;
  }

  /* Los dos avisos que la guía convierte en imposibles: la misma persona
     no puede ocupar los dos huecos, y una reserva no puede estar además
     defendiendo. No se bloquea la entrada —esto es lo que TÚ viste— pero
     si choca, es que algo se apuntó mal. */
  function avisoReservas(r){
    const real = p => p && p.n !== RV.VACIO;
    const a = r.res[0], b = r.res[1];
    if (real(a) && real(b) && a.n === b.n) {
      return `<span class="cuenta mal">${esc(t('riv.res.dupe'))}</span>`;
    }
    const defiende = {};
    r.g.forEach(g => g.forEach(p => { if (p && p.n !== RV.VACIO) defiende[p.n] = true; }));
    if ([a, b].some(p => real(p) && defiende[p.n])) {
      return `<span class="cuenta mal">${esc(t('riv.res.clash'))}</span>`;
    }
    return '';
  }

  /* El banquillo se rellena igual que una guardia, pero sus huecos no
     llevan número de posición: una reserva entra por quien caiga, no por
     un puesto fijo. */
  function reservasHTML(r){
    const huecos = r.res.map((p, i) => `<div class="puesto" data-p="${i}">
      <span class="pos res">R${i + 1}</span>
      <select class="rs-n" aria-label="${esc(t('riv.res.slot'))} ${i + 1}">${opcionesQuien(r, p ? p.n : '')}</select>
      <select class="rs-t" aria-label="${esc(t('pvp.riv.tac'))}">${opcionesTactica(p ? p.t : R.TACTICS[0])}</select>
    </div>`).join('');

    return `<div class="guardia banquillo">
      <div class="guardia-cab">
        <h5>${esc(t('riv.res.t'))}</h5>
        ${avisoReservas(r)}
      </div>
      <div class="puestos">${huecos}</div>
      <p class="note">${t('riv.res.d')}</p>
    </div>`;
  }

  /* Un ataque suyo ya apuntado. El primero de la lista es el que manda en
     la predicción, así que se marca. */
  function ataqueHTML(at, i){
    const trozos = at.p.map((p, k) => {
      if (!p) return `<span class="vs vs-sin">${k + 1} ?</span>`;
      const c = porNombre(p.n);
      const seg = p.t === 'Assault' ? 'f' : (p.t === 'Manoeuvre' ? 'v' : 'i');
      return `<span class="vs tac-${seg}">${k + 1} ${esc(c ? nameOf(c) : p.n)} · ${esc(t('ta.' + p.t))}</span>`;
    }).join('');

    return `<div class="atk ${at.w ? 'gano' : 'perdio'}" data-i="${i}">
      <span class="atk-res">${esc(t(at.w ? 'riv.atk.won' : 'riv.atk.lost'))}</span>
      <span class="atk-p">${trozos}</span>
      ${i === 0 ? `<span class="cuenta full">${esc(t('riv.atk.counts'))}</span>` : ''}
      <button type="button" class="btn-x atk-del" aria-label="${esc(t('pvp.riv.del'))}">×</button>
    </div>`;
  }

  function rivalHTML(r, previos){
    const abierto     = !!(previos && previos[r.id]);
    const crewAbierta = !!(previos && previos[r.id + '|crew']);
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
      <div class="puestos">${g.map((p, i) => puestoHTML(r, p, i, 'p')).join('')}</div>
    </div>`).join('');

    const nuevoAtaque = r.r.length
      ? `<div class="puestos nuevo-atk">${[0,1,2].map(i => puestoHTML(r, null, i, 'a')).join('')}</div>
         <div class="atk-btns">
           <button type="button" class="btn-add atk-win">${esc(t('riv.atk.addWon'))}</button>
           <button type="button" class="btn-add atk-lose">${esc(t('riv.atk.addLost'))}</button>
         </div>`
      : `<p class="hint">${esc(t('riv.atk.needCrew'))}</p>`;

    const hechas = r.g.slice(0, nG).filter(g => g.every(p => p)).length;
    const nRes   = r.res.filter(Boolean).length;

    return `<details class="rival-card" data-id="${esc(r.id)}"${abierto ? ' open' : ''}>
      <summary>
        <b class="rival-n">${esc(r.n)}</b>
        ${r.tag ? `<span class="tag-pill">${esc(r.tag)}</span>` : ''}
        <span class="cuenta${lleno ? ' full' : ''}">${r.r.length}/${tope}</span>
        <span class="cuenta">${hechas}/${nG} ${esc(t('pvp.riv.gShort'))}</span>
        ${nRes ? `<span class="cuenta">${nRes}/${RV.RESERVAS} ${esc(t('riv.res.short'))}</span>` : ''}
        ${r.a.length ? `<span class="cuenta">${r.a.length} ${esc(t('riv.atk.short'))}</span>` : ''}
      </summary>
      <div class="plegable-body">
        <div class="rival-top">
          <input class="rival-nom" value="${esc(r.n)}" maxlength="40"
                 aria-label="${esc(t('pvp.riv.name'))}">
          <label class="rival-tag-campo">
            <span>${esc(t('riv.tag'))}</span>
            <input class="rival-tag" value="${esc(r.tag)}" maxlength="3"
                   list="tagsUsados" autocomplete="off" spellcheck="false"
                   placeholder="${esc(t('riv.tag.ph'))}"
                   aria-label="${esc(t('riv.tag'))}">
          </label>
          <button type="button" class="btn-x rival-del">${esc(t('pvp.riv.del'))}</button>
        </div>

        <details class="sub-plegable" data-s="crew"${crewAbierta ? ' open' : ''}>
          <summary>
            <h5 class="bloque-tit">${esc(t('pvp.riv.crew'))}</h5>
            <span class="cuenta${lleno ? ' full' : ''}">${r.r.length}/${tope}</span>
          </summary>
          <div class="sub-body">
            ${lleno
              ? `<p class="hint">${esc(t('pvp.riv.crewFull'))}</p>`
              : `<div class="add-row chica">
                  <input type="text" class="suyo-add" list="db" autocomplete="off"
                         placeholder="${esc(t('pvp.riv.crewPh'))}" aria-label="${esc(t('pvp.riv.crewPh'))}">
                  <button type="button" class="btn-add suyo-btn">+</button>
                </div>`}
            ${suyos}
            <p class="note">${t('pvp.riv.stateNote')}</p>
          </div>
        </details>

        <h5 class="bloque-tit">${esc(t('pvp.riv.guards'))}</h5>
        ${guardias}
        ${reservasHTML(r)}

        <h5 class="bloque-tit">${esc(t('riv.atk.t'))}</h5>
        <p class="note">${t('riv.atk.d')}</p>
        ${nuevoAtaque}
        ${r.a.length ? `<div class="ataques">${r.a.map(ataqueHTML).join('')}</div>` : ''}
      </div>
    </details>`;
  }

  /* Repintar cierra los desgloses, así que antes se apunta cuáles estaban
     abiertos: la tarjeta del rival y, dentro, su tripulación. */
  function abiertos(){
    const set = {};
    els.lista.querySelectorAll('.rival-card').forEach(d => {
      if (d.open) set[d.dataset.id] = true;
      d.querySelectorAll('details.sub-plegable[open]').forEach(s => {
        set[d.dataset.id + '|' + s.dataset.s] = true;
      });
    });
    return set;
  }

  /* El orden es "lo último que tocaste, primero", pero se congela mientras
     editas: la libreta se repinta entera en cada cambio, y si además se
     recolocara, la ficha que estás tocando saltaría al principio y
     perderías el sitio. Se refresca al cargar y cuando la lista cambia de
     tamaño: al añadir, al borrar y al importar. */
  let orden = [];
  const congelaOrden = () => { orden = RV.lista().map(r => r.id); };

  function enOrden(){
    const sitio = {};
    orden.forEach((id, i) => { sitio[id] = i; });
    // RV.lista() ya viene por fecha, así que los que no estaban (recién
    // importados) conservan ese orden entre ellos y salen delante
    return RV.lista().sort((a, b) => {
      const ia = sitio[a.id], ib = sitio[b.id];
      if (ia === undefined && ib === undefined) return 0;
      if (ia === undefined) return -1;
      if (ib === undefined) return 1;
      return ia - ib;
    });
  }

  /* Lo que se ve: por nombre y por etiqueta de alianza. */
  function filtrados(){
    const texto = fold(els.buscar ? els.buscar.value.trim() : '');
    const tag   = els.tag ? els.tag.value : '';
    return enOrden().filter(r =>
      (!tag   || r.tag === tag) &&
      (!texto || fold(r.n).indexOf(texto) !== -1)
    );
  }

  /* El filtro sólo aparece cuando estorba no tenerlo. Con cuatro rivales
     ocupa sitio y no resuelve nada. */
  const DESDE = 5;

  function pintaFiltros(total){
    if (!els.filtros) return;
    const usadas = RV.tags();

    /* Las que ya usas se ofrecen al escribir la de otro rival: así la
       segunda vez que apuntas a alguien de PAL lo eliges en vez de
       teclearlo, y no acabas con PAL y PLA conviviendo. */
    if (els.tagsLista) {
      els.tagsLista.innerHTML = usadas.map(x => `<option value="${esc(x)}"></option>`).join('');
    }

    els.filtros.hidden = total < DESDE;
    /* La ayuda sale justo cuando hace falta: ya tienes libreta de sobra
       pero todavía no has etiquetado a nadie, así que el desplegable está
       vacío y no se entiende para qué es. */
    if (els.tagAyuda) els.tagAyuda.hidden = els.filtros.hidden || usadas.length > 0;
    if (els.filtros.hidden) return;

    const antes = els.tag.value;
    els.tag.innerHTML = `<option value="">${esc(t('riv.tag.todas'))}</option>` +
      usadas.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
    els.tag.value = antes;
    if (els.tag.selectedIndex === -1) els.tag.value = '';

    /* Antes se escondía cuando no había ninguna etiqueta, por no meter un
       control inútil. Salió mal: un filtro que no se ve parece un filtro
       roto, y encima quitaba el único sitio donde se intuye que las
       etiquetas existen. Se queda siempre, y la línea de ayuda de debajo
       explica cómo llenarlo. */
    els.tag.hidden = false;
  }

  function listaHTML(previos){
    const total = RV.lista().length;
    if (!total) return `<p class="hint">${esc(t('pvp.riv.none'))}</p>`;
    const rs = filtrados();
    if (!rs.length) return `<p class="hint">${esc(t('riv.filtro.nada'))}</p>`;
    return `<div class="rivales">${rs.map(r => rivalHTML(r, previos)).join("")}</div>`;
  }

  function render(abrir){
    const previos = abiertos();
    if (abrir) previos[abrir] = true;
    const total = RV.lista().length;
    pintaFiltros(total);
    els.lista.innerHTML = listaHTML(previos);
    const vistos = filtrados().length;
    els.count.textContent = !total ? ''
      : (vistos === total ? total : vistos + ' / ' + total);
  }

  function rellenarDatalist(){
    els.datalist.innerHTML = DB.map(c => `<option value="${esc(nameOf(c))}"></option>`).join('');
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

  /* ---------- eventos: alta y edición ---------- */

  function anadirRival(){
    const id = RV.añadir(els.input.value);
    if (!id) { aviso('pvp.riv.bad'); return; }
    els.input.value = '';
    congelaOrden();
    render(id);
    els.input.focus();
  }

  els.addBtn.addEventListener('click', anadirRival);
  els.input.addEventListener('keydown', e => { if (e.key === 'Enter') anadirRival(); });

  els.lista.addEventListener('click', e => {
    const card = e.target.closest('.rival-card');
    if (!card) return;
    const id = card.dataset.id;

    if (e.target.closest('.rival-del')) { RV.borrar(id); congelaOrden(); render(); return; }

    if (e.target.closest('.suyo-btn')) {
      const campo = card.querySelector('.suyo-add');
      const clave = aClave(campo.value);
      if (!clave) { campo.classList.add('err'); aviso('pvp.riv.notFound'); return; }
      const q = RV.addMiembro(id, clave);
      if (q === 'llena') { aviso('pvp.riv.crewFull'); return; }
      if (q !== 'ok')    { aviso('pvp.riv.dupe'); return; }
      campo.value = '';
      render();
      return;
    }

    const suyoDel = e.target.closest('.suyo-del');
    if (suyoDel) { RV.delMiembro(id, suyoDel.closest('.suyo').dataset.quien); render(); return; }

    const gClear = e.target.closest('.g-clear');
    if (gClear) {
      RV.vaciarGuardia(id, Number(gClear.closest('.guardia').dataset.g));
      render();
      return;
    }

    const atkDel = e.target.closest('.atk-del');
    if (atkDel) { RV.delAtaque(id, Number(atkDel.closest('.atk').dataset.i)); render(); return; }

    // apuntar un ataque suyo: se leen los tres puestos del formulario
    const gano = e.target.closest('.atk-win');
    const fallo = e.target.closest('.atk-lose');
    if (gano || fallo) {
      const fila = card.querySelector('.nuevo-atk');
      if (!fila) return;
      const puestos = [0, 1, 2].map(i => {
        const p = fila.querySelector('.puesto[data-p="' + i + '"]');
        const n = p.querySelector('.a-n').value;
        return (n && n !== RV.VACIO) ? { n: n, t: p.querySelector('.a-t').value } : null;
      });
      const q = RV.addAtaque(id, puestos, !!gano);
      if (q !== 'ok') { aviso('riv.atk.empty'); return; }
      render(id);
    }
  });

  els.lista.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.classList.contains('suyo-add')) return;
    e.preventDefault();
    e.target.closest('.rival-card').querySelector('.suyo-btn').click();
  });

  /* Se guarda al salir del campo, no en cada tecla: repintar mientras
     escribes te quitaría el foco. */
  els.lista.addEventListener('change', e => {
    const card = e.target.closest('.rival-card');
    if (!card) return;
    const id = card.dataset.id;

    if (e.target.classList.contains('rival-nom')) {
      RV.renombrar(id, e.target.value);
      card.querySelector('.rival-n').textContent = e.target.value;
      return;
    }

    if (e.target.classList.contains('rival-tag')) {
      e.target.value = RV.setTag(id, e.target.value);
      render();   // la lista de etiquetas del filtro puede haber cambiado
      return;
    }

    if (e.target.classList.contains('suyo-e')) {
      const fila = e.target.closest('.suyo');
      RV.setEstado(id, fila.dataset.quien, e.target.value);
      fila.className = 'suyo est-' + e.target.value;
      return;
    }

    // los puestos del formulario de ataque no se guardan hasta pulsar
    if (e.target.closest('.nuevo-atk')) return;

    const puesto = e.target.closest('.puesto');
    if (!puesto) return;

    /* El banquillo lleva también la clase .guardia, así que se mira antes:
       si no, caería en la rama de las guardias con un data-g inexistente. */
    if (puesto.closest('.banquillo')) {
      RV.setReserva(id, Number(puesto.dataset.p),
        puesto.querySelector('.rs-n').value,
        puesto.querySelector('.rs-t').value);
      render();
      return;
    }

    const gi  = Number(puesto.closest('.guardia').dataset.g);
    const pos = Number(puesto.dataset.p);
    RV.setPuesto(id, gi, pos,
      puesto.querySelector('.p-n').value,
      puesto.querySelector('.p-t').value);
    // el contador del resumen puede haber cambiado
    render();
  });

  /* ---------- compartir ---------- */

  els.expBtn.addEventListener('click', () => {
    const cod = RV.exportar();
    els.expOut.value = cod;
    if (!cod) { els.expHint.textContent = t('riv.share.nada'); return; }
    els.expOut.select();
    let copiado = false;
    try { copiado = document.execCommand('copy'); } catch(e){ copiado = false; }
    els.expHint.textContent = (copiado ? t('riv.share.copied') : t('riv.share.manual'))
      + ' · ' + RV.lista().length + ' · ' + cod.length + ' ' + t('riv.share.chars');
  });

  els.impBtn.addEventListener('click', () => {
    const res = RV.importar(els.impIn.value);
    if (!res) {
      els.impHint.textContent = t('riv.share.bad');
      els.impHint.classList.add('err');
      return;
    }
    els.impHint.classList.remove('err');
    els.impHint.textContent = t('riv.share.ok')
      .replace('{n}', res.nuevos).replace('{a}', res.actualizados);
    els.impIn.value = '';
    congelaOrden();
    render();
  });

  /* ---------- buscar y filtrar ---------- */

  if (els.buscar) {
    els.buscar.addEventListener('input', () => { render(); });
    els.buscar.addEventListener('keydown', e => {
      if (e.key === 'Escape') { els.buscar.value = ''; render(); }
    });
  }
  if (els.tag) els.tag.addEventListener('change', () => { render(); });

  document.addEventListener('langchange', () => { rellenarDatalist(); render(); });

  rellenarDatalist();
  congelaOrden();
  render();
})();
