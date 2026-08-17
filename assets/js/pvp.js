/* ============================================================
   OP-MAPS DATA — simulador PvP 3 vs 3
   ------------------------------------------------------------
   Tu tripulación sale de crew-store.js; los rivales se escriben aquí.
   Toda la puntuación y los duelos salen de rules.js.

   La idea: conoces a los tres rivales, pero no en qué orden salen ni
   qué táctica juega cada uno. Así que se prueban TODOS sus escenarios
   (6 órdenes × 27 repartos de táctica = 162) contra todas tus
   alineaciones posibles, y gana la que más veces se lleva 2 de 3.
   ============================================================ */
(function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;
  const C  = window.CREW;

  /* Los 6 órdenes en que el rival puede colocar a sus tres. */
  const ORDENES = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];

  /* Los 27 repartos de táctica de tres luchadores. */
  const REPARTOS = [];
  for (const a of R.TACTICS) for (const b of R.TACTICS) for (const c of R.TACTICS) REPARTOS.push([a, b, c]);

  let rivales = [];   // nombres en inglés

  const els = {
    input:  document.getElementById('rivalAdd'),
    addBtn: document.getElementById('rivalBtn'),
    lista:  document.getElementById('rivalList'),
    hint:   document.getElementById('rivalHint'),
    calc:   document.getElementById('calcBtn'),
    crew:   document.getElementById('miCrew'),
    out:    document.getElementById('resultado'),
    datalist: document.getElementById('db')
  };

  /* ---------- utilidades ---------- */

  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';
  const nameOf = c => (isES() && c.es) ? c.es : c.n;

  function fold(s){
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
  const pct = p => Math.round(p * 100) + ' %';

  /* ---------- el combate ---------- */

  /* Probabilidad de ganar el combate con una alineación fija (tres
     puntuaciones ya calculadas y sus tres tácticas) contra los tres
     rivales, promediando sus 162 escenarios. Se gana con 2 de 3. */
  function probabilidad(misPuntos, misTacticas, puntosRival){
    let ganados = 0;
    for (const orden of ORDENES) {
      for (const suReparto of REPARTOS) {
        let duelos = 0;
        for (let p = 0; p < 3; p++) {
          const suyo = orden[p];
          if (R.duelWin(misPuntos[p], misTacticas[p],
                        puntosRival[suyo][suReparto[p]], suReparto[p])) duelos++;
        }
        if (duelos >= 2) ganados++;
      }
    }
    return ganados / (ORDENES.length * REPARTOS.length);
  }

  /* Todas las combinaciones de 3 entre n. */
  function trios(n){
    const out = [];
    for (let a = 0; a < n; a++)
      for (let b = a + 1; b < n; b++)
        for (let c = b + 1; c < n; c++) out.push([a, b, c]);
    return out;
  }

  /* Prueba cada trío tuyo con cada reparto de tácticas y se queda con
     la mejor. Devuelve también la probabilidad máxima. */
  function mejorAlineacion(mios, rivalesChars){
    const misPuntuaciones = mios.map(R.scores);
    const puntosRival = rivalesChars.map(R.scores);

    let maxima = -1, mejor = null;

    for (const [a, b, c] of trios(mios.length)) {
      const tres = [misPuntuaciones[a], misPuntuaciones[b], misPuntuaciones[c]];
      for (const reparto of REPARTOS) {
        const puntos = [tres[0][reparto[0]], tres[1][reparto[1]], tres[2][reparto[2]]];
        const p = probabilidad(puntos, reparto, puntosRival);
        // Comparación con tolerancia: dos valores que "deberían" ser
        // iguales no se separan por ruido de coma flotante.
        if (p > maxima + 1e-9) {
          maxima = p;
          mejor = { idx: [a, b, c], tacticas: reparto.slice(), puntos: puntos };
        }
      }
    }
    return { prob: maxima, alineacion: mejor, puntosRival: puntosRival };
  }

  /* La puntuación más baja que puede tener quien ocupe una posición sin
     que baje la probabilidad, dejando las otras dos fijas. Búsqueda
     binaria: si con 'medio' la probabilidad no cambia, se puede bajar más. */
  function umbral(puntos, tacticas, puntosRival, pos, base){
    let bajo = 0, alto = puntos[pos];
    for (let paso = 0; paso < 40; paso++) {
      const medio = (bajo + alto) / 2;
      const prueba = puntos.slice();
      prueba[pos] = medio;
      if (Math.abs(probabilidad(prueba, tacticas, puntosRival) - base) < 1e-9) alto = medio;
      else bajo = medio;
    }
    return alto;
  }

  /* Fuerza individual: uno de los tuyos contra cada rival y cada táctica
     rival. Nueve escenarios por táctica tuya. */
  function individual(mio, rivalesChars){
    const mias = R.scores(mio);
    const suyas = rivalesChars.map(R.scores);
    const total = rivalesChars.length * R.TACTICS.length;

    const porTactica = {};
    for (const miTac of R.TACTICS) {
      let ganados = 0;
      for (let r = 0; r < rivalesChars.length; r++)
        for (const suTac of R.TACTICS)
          if (R.duelWin(mias[miTac], miTac, suyas[r][suTac], suTac)) ganados++;
      porTactica[miTac] = ganados / total;
    }
    let mejor = R.TACTICS[0];
    for (const tac of R.TACTICS) if (porTactica[tac] > porTactica[mejor]) mejor = tac;
    return { personaje: mio, mejor: mejor, prob: porTactica[mejor], porTactica: porTactica };
  }

  /* ---------- pintado ---------- */

  function claseProb(p){ return p >= 0.6 ? 'win-hi' : (p >= 0.34 ? 'win-mid' : 'win-lo'); }

  function crewHTML(){
    const crew = C.personajes();
    if (!crew.length) return `<p class="empty">${esc(t('pvp.sim.empty'))}</p>`;
    return `<div class="mini-crew">${crew.map(c =>
      `<span class="mini-chip">${esc(nameOf(c))}</span>`).join('')}</div>
      ${crew.length < 3 ? `<p class="hint err">${esc(t('pvp.sim.few'))}</p>` : ''}`;
  }

  function rivalesHTML(){
    if (!rivales.length) return '';
    return `<div class="mini-crew">${rivales.map(n => {
      const c = DB.find(x => x.n === n);
      return `<span class="mini-chip rival">${esc(nameOf(c))}
        <button class="mini-rm" type="button" data-name="${esc(n)}" aria-label="×">×</button></span>`;
    }).join('')}</div>`;
  }

  function resultadoHTML(){
    const mios = C.personajes();
    const suyos = rivales.map(n => DB.find(x => x.n === n));

    const res = mejorAlineacion(mios, suyos);
    const ali = res.alineacion;

    const filas = ali.idx.map((k, i) => {
      const c = mios[k];
      const min = umbral(ali.puntos, ali.tacticas, res.puntosRival, i, res.prob);
      return `<div class="linea">
        <span class="pos">${i + 1}</span>
        <span class="quien">
          <b>${esc(nameOf(c))}</b>
          <i>${esc(t('tac.' + ali.tacticas[i]))} · ${esc(t('rn.' + c.r))}</i>
        </span>
        <span class="puntos">
          <b>${num(ali.puntos[i])}</b>
          <i>${esc(t('pvp.sim.min'))} ${num(min)}</i>
        </span>
      </div>`;
    }).join('');

    const ranking = mios.map(c => individual(c, suyos))
      .sort((a, b) => b.prob - a.prob)
      .map((a, i) => {
        const desglose = R.TACTICS.map(tac =>
          `<span${tac === a.mejor ? ' class="on"' : ''}>${esc(t('ta.' + tac))} ${pct(a.porTactica[tac])}</span>`
        ).join('');
        return `<div class="rank">
          <div class="rank-top">
            <span class="idx">${i + 1}</span>
            <span class="nom">${esc(nameOf(a.personaje))}</span>
            <span class="tac-badge">${esc(t('tac.' + a.mejor))}</span>
            <span class="pc ${claseProb(a.prob)}">${pct(a.prob)}</span>
          </div>
          <div class="barra"><span style="width:${Math.round(a.prob * 100)}%"></span></div>
          <div class="desglose">${desglose}</div>
        </div>`;
      }).join('');

    return `<section class="panel">
      <h2>${esc(t('pvp.sim.prob'))}</h2>
      <p class="gran-prob ${claseProb(res.prob)}">${pct(res.prob)}</p>

      <h3 class="sub-tit">${esc(t('pvp.sim.line'))}</h3>
      <div class="alineacion">${filas}</div>
      <p class="note">${t('pvp.sim.minNote')}</p>
      <p class="note">${t('pvp.sim.how')}</p>
    </section>

    <section class="panel">
      <h2>${esc(t('pvp.sim.indiv'))}</h2>
      <div class="rank-list">${ranking}</div>
      <p class="note">${esc(t('pvp.sim.indivNote'))}</p>
    </section>`;
  }

  function render(){
    els.crew.innerHTML  = crewHTML();
    els.lista.innerHTML = rivalesHTML();
    const listo = C.personajes().length >= 3 && rivales.length === 3;
    els.calc.disabled = !listo;
    els.input.disabled = rivales.length >= 3;
    els.addBtn.disabled = rivales.length >= 3;
  }

  function rellenarDatalist(){
    els.datalist.innerHTML = DB.map(nameOf)
      .sort((a, b) => a.localeCompare(b, isES() ? 'es' : 'en'))
      .map(n => `<option value="${esc(n)}"></option>`).join('');
  }

  /* ---------- eventos ---------- */

  let avisoTimer;
  function aviso(clave){
    els.hint.textContent = t(clave);
    els.hint.classList.add('err');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => { els.hint.textContent = ''; els.hint.classList.remove('err'); }, 2800);
  }

  function añadirRival(){
    const escrito = els.input.value.trim();
    if (!escrito) return;
    const buscado = fold(escrito);
    const c = DB.find(x => fold(x.n) === buscado || (x.es && fold(x.es) === buscado));
    if (!c) { aviso('pvp.sim.notFound'); return; }
    if (rivales.indexOf(c.n) !== -1) { aviso('pvp.sim.dupe'); return; }
    rivales.push(c.n);
    els.input.value = '';
    els.out.innerHTML = '';
    render();
    els.input.focus();
  }

  els.addBtn.addEventListener('click', añadirRival);
  els.input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); añadirRival(); }
  });

  els.lista.addEventListener('click', e => {
    const b = e.target.closest('.mini-rm');
    if (!b) return;
    rivales = rivales.filter(n => n !== b.dataset.name);
    els.out.innerHTML = '';
    render();
  });

  els.calc.addEventListener('click', () => {
    els.out.innerHTML = resultadoHTML();
    els.out.scrollIntoView({ block: 'nearest' });
  });

  document.addEventListener('langchange', () => {
    rellenarDatalist();
    render();
    if (els.out.innerHTML) els.out.innerHTML = resultadoHTML();
  });

  /* ---------- arranque ---------- */
  rellenarDatalist();
  render();
})();
