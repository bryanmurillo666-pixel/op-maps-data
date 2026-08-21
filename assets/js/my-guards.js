/* ============================================================
   OP-MAPS DATA — tus tres guardias, dentro de Mi tripulación
   ------------------------------------------------------------
   Se apuntan aquí las que tienes puestas AHORA en el juego. El PvP
   las lee para decirte cuánto aguantan contra cada rival y cuánto
   ganarías cambiándolas por las que recomienda.

   Se avisa si se salta la regla del juego: dentro de una guardia,
   tres personajes distintos; y quien repita entre guardias tiene
   que cambiar de fila.
   ============================================================ */
(function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;
  const C  = window.CREW;
  const MG = window.MIS_GUARDIAS;

  const caja  = document.getElementById('misGuardias');
  const cuenta = document.getElementById('gCount');
  if (!caja) return;

  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';
  const nameOf = c => (isES() && c.es) ? c.es : c.n;
  const porNombre = n => DB.find(x => x.n === n);

  function esc(s){
    return String(s).replace(/[&<>"']/g, m => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
    ));
  }
  function num(n){
    return Number(n).toLocaleString(isES() ? 'es-ES' : 'en-GB',
      { maximumFractionDigits: 0 });
  }

  function opcionesQuien(sel){
    const nombres = C.nombres();
    if (sel && nombres.indexOf(sel) === -1) nombres.push(sel);
    const op = (v, txt) =>
      `<option value="${esc(v)}"${v === (sel || '') ? ' selected' : ''}>${esc(txt)}</option>`;
    return op('', '— ' + t('crew.guards.empty') + ' —')
         + nombres.map(n => {
             const c = porNombre(n);
             return c ? op(n, nameOf(c)) : '';
           }).join('');
  }

  function opcionesTactica(sel){
    return R.TACTICS.map(tac =>
      '<option value="' + tac + '"' + (tac === sel ? ' selected' : '') + '>' +
      esc(t('tac.' + tac)) + '</option>'
    ).join('');
  }

  function puestoHTML(p, i){
    const punto = p ? num(R.score(porNombre(p.n), p.t)) : '';
    return `<div class="puesto" data-p="${i}">
      <span class="pos">${i + 1}</span>
      <select class="g-n" aria-label="${esc(t('pvp.riv.slot'))} ${i + 1}">${opcionesQuien(p ? p.n : '')}</select>
      <select class="g-t" aria-label="${esc(t('pvp.riv.tac'))}">${opcionesTactica(p ? p.t : R.TACTICS[0])}</select>
      ${punto ? `<span class="g-pts">${punto}</span>` : ''}
    </div>`;
  }

  function render(){
    const nG = MG.nGuardias();
    const todas = MG.todas().slice(0, nG);

    if (cuenta) cuenta.innerHTML = `<b>${MG.hechas()}</b> / ${nG}`;

    if (C.nombres().length < 3) {
      caja.innerHTML = `<p class="hint">${esc(t('crew.guards.few'))}</p>`;
      return;
    }

    const guardias = todas.map((g, gi) => `<div class="guardia" data-g="${gi}">
      <div class="guardia-cab">
        <h5>${esc(t('pvp.riv.guard'))} ${gi + 1}</h5>
        <button type="button" class="btn-x g-clear">${esc(t('pvp.riv.gClear'))}</button>
      </div>
      <div class="puestos">${g.map(puestoHTML).join('')}</div>
    </div>`).join('');

    const fallos = MG.problemas();
    const aviso = fallos.length
      ? `<p class="aviso-cambio"><b>${esc(t('crew.guards.badT'))}</b>
         <span>${fallos.map(f => f.tipo === 'repe'
            ? t('crew.guards.badRepe').replace('{g}', f.g + 1)
            : t('crew.guards.badFila')
                .replace('{q}', esc(nameOf(porNombre(f.quien)) || f.quien))
                .replace('{p}', f.pos + 1)
                .replace('{g}', f.g + 1)
          ).join('<br>')}</span></p>`
      : '';

    caja.innerHTML = `<div class="def-guardias">${guardias}</div>
      ${aviso}
      <p class="note">${t('crew.guards.note')}</p>`;
  }

  caja.addEventListener('change', e => {
    const puesto = e.target.closest('.puesto');
    if (!puesto) return;
    const gi = Number(puesto.closest('.guardia').dataset.g);
    MG.setPuesto(gi, Number(puesto.dataset.p),
      puesto.querySelector('.g-n').value,
      puesto.querySelector('.g-t').value);
    render();
  });

  caja.addEventListener('click', e => {
    const b = e.target.closest('.g-clear');
    if (!b) return;
    MG.vaciar(Number(b.closest('.guardia').dataset.g));
    render();
  });

  document.addEventListener('crewchange', render);
  document.addEventListener('langchange', render);

  render();
})();
