/* ============================================================
   OP-MAPS DATA — página Mi tripulación
   ------------------------------------------------------------
   La tripulación se guarda en assets/js/crew-store.js y todo lo que
   se enseña sale de assets/js/rules.js. Aquí solo se pinta.
   ============================================================ */
(function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;
  const C  = window.CREW;

  // Cómo se listan los tripulantes: 'entry' (como los añadiste) o el
  // nombre de una táctica, y entonces se ordena por ella de mayor a menor.
  let orden = 'entry';

  const els = {
    input:    document.getElementById('add'),
    addBtn:   document.getElementById('addBtn'),
    count:    document.getElementById('count'),
    hint:     document.getElementById('hint'),
    resumen:  document.getElementById('resumen'),
    roles:    document.getElementById('roles'),
    lista:    document.getElementById('miembros'),
    datalist: document.getElementById('db')
  };

  /* ---------- utilidades ---------- */

  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';
  const nameOf = c => (isES() && c.es) ? c.es : c.n;
  const roleOf = c => t('rn.' + c.r);

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
      minimumFractionDigits: dec || 0,
      maximumFractionDigits: dec || 0
    });
  }

  // "225 min" se lee peor que "3 h 45 min" cuando la cifra crece.
  function minutos(m){
    if (m < 60) return `${m} ${t('u.min')}`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h} h ${r} ${t('u.min')}` : `${h} h`;
  }

  /* ---------- resumen ---------- */

  function kpi(valor, etiqueta, nota){
    return `<div class="kpi-box">
      <b>${valor}</b>
      <span>${esc(etiqueta)}</span>
      ${nota ? `<em>${esc(nota)}</em>` : ''}
    </div>`;
  }

  function resumenHTML(crew){
    const tieneRol = rol => crew.some(c => c.r === rol);

    const musico    = tieneRol('Musician');
    const timonel   = tieneRol('Helmsman');
    const poder     = R.crewPower(crew, musico);
    const navTotal  = crew.reduce((a, c) => a + c.v, 0);
    const intTotal  = crew.reduce((a, c) => a + c.i, 0);
    const vidaTotal = crew.reduce((a, c) => a + R.health(c), 0);
    const precio    = crew.reduce((a, c) => a + R.price(c), 0);
    const velocidad = R.crewSpeed(navTotal, timonel);
    const lector    = crew.some(R.isReader);
    const tiempos   = R.conquestTime(poder);

    return `<section class="panel">
      <h2>${esc(t('sum.title'))}</h2>
      <div class="kpi">
        ${kpi(num(poder), t('sum.power'), musico ? t('sum.musician') : '')}
        ${kpi(num(velocidad, velocidad % 1 ? 1 : 0), t('sum.speed'), velocidad >= 60 ? t('sum.speedCap') : '')}
        ${kpi(num(intTotal), t('sum.int'))}
        ${kpi(num(R.rpChance(intTotal) * 100) + ' %', t('sum.rp'), lector ? '' : t('sum.noReader'))}
        ${kpi(tieneRol('Commander') ? '2' : '1', t('sum.attacks'))}
        ${kpi(tieneRol('Sniper') ? '90' : '60', t('sum.range'))}
        ${kpi(num(R.supplies(crew)), t('sum.supplies'))}
        ${kpi(num(vidaTotal), t('sum.health'))}
        ${kpi(minutos(tiempos.neutral), t('sum.conquest'))}
        ${kpi(minutos(tiempos.defended), t('sum.conquestDef'))}
        ${kpi(num(precio), t('sum.price') + ' · ' + t('u.gold'))}
      </div>
    </section>`;
  }

  /* ---------- bonus de rol ---------- */

  function rolesHTML(crew){
    const filas = R.USEFUL_ROLES.map(rol => {
      const quienes = crew.filter(c => c.r === rol);
      const on = quienes.length > 0;
      const nombres = on ? quienes.map(nameOf).join(', ') : t('roles.none');
      return `<div class="rol-fila${on ? ' on' : ''}">
        <span class="rol-marca">${on ? '✓' : '·'}</span>
        <div class="rol-txt">
          <b>${esc(t('rn.' + rol))}</b>
          <span>${esc(t('role.' + rol))}</span>
        </div>
        <span class="rol-quien">${esc(nombres)}</span>
      </div>`;
    }).join('');

    // El combo es el único bonus que pide dos roles a la vez.
    const combo = crew.some(c => c.r === 'Helmsman') && crew.some(c => c.r === 'Navigator');
    const comboFila = `<div class="rol-fila${combo ? ' on' : ''}">
      <span class="rol-marca">${combo ? '✓' : '·'}</span>
      <div class="rol-txt">
        <b>${esc(t('roles.combo'))}</b>
        <span>${esc(t('roles.comboD'))}</span>
      </div>
      <span class="rol-quien"></span>
    </div>`;

    return `<section class="panel">
      <h2>${esc(t('roles.title'))}</h2>
      <div class="rol-grid">${filas}${comboFila}</div>
    </section>`;
  }

  /* ---------- a quién conviene dejar fuera ---------- */

  /* Solo se pronuncia cuando llevas uno de más. Se apoya en dos reglas de
     la guía: los bonus de rol NO se acumulan (un segundo Comandante no da
     un tercer ataque) y los roles de sabor no dan nada. Así que sobra
     antes quien no aporta bonus, y de esos, el de puntuación más baja.
     Al único lector de poneglifos no se le toca: sin él no se puede ni
     empezar a buscar. */
  const NAV_QUE_CUENTA = 30;   // por debajo de esto no es un navegante, es el menos malo

  /* Cuántos se protegen por táctica. Son 3 guardias de 3 posiciones y un
     mismo personaje solo puede repetirse una vez por guardia, así que de
     cada táctica interesa tener tres de fondo. Ojo: es por táctica, no en
     total — quien puntúa alto en dos cubre hueco en las dos, y cuenta una
     vez en cada lista. */
  const POR_TACTICA = 3;

  /* Cada táctica se pinta del color de la stat con la que puntúa, los
     mismos que las barras de Data Crew: Asalto va con FUE, Maniobra con
     NAV y Emboscada con INT. */
  const COLOR_TAC = { Assault: 'f', Manoeuvre: 'v', Ambush: 'i' };

  function recomendacion(crew){
    if (crew.length <= C.MAX) return null;

    /* --- intocables ---
       Cuatro cosas que duelen más de lo que dice una puntuación:
       el único que sabe leer poneglifos, el único Capitán (sin él no
       se empieza una conquista), quien lleva la Navegación (rarísima, y
       Maniobra es la única respuesta a Emboscada) y los tres mejores de
       cada táctica, que son con los que se rellenan las guardias. */
    const protegidos = {};
    const proteger = c => { if (c) protegidos[c.n] = true; };

    const lectores = crew.filter(R.isReader);
    if (lectores.length === 1) proteger(lectores[0]);

    const capitanes = crew.filter(c => c.r === 'Captain');
    if (capitanes.length === 1) proteger(capitanes[0]);

    const navegante = crew.reduce((a, b) => (b.v > a.v ? b : a), crew[0]);
    if (navegante.v >= NAV_QUE_CUENTA) proteger(navegante);

    R.TACTICS.forEach(tac => {
      crew.slice()
        .sort((a, b) => R.score(b, tac) - R.score(a, tac))
        .slice(0, POR_TACTICA)
        .forEach(proteger);
    });

    /* --- candidatos --- */
    const cuentaRol = {};
    crew.forEach(c => { cuentaRol[c.r] = (cuentaRol[c.r] || 0) + 1; });
    const sinBonus = c => !R.isUsefulRole(c.r) || cuentaRol[c.r] > 1;

    let candidatos = crew.filter(c => !protegidos[c.n] && sinBonus(c));
    if (!candidatos.length) candidatos = crew.filter(c => !protegidos[c.n]);
    if (!candidatos.length) candidatos = crew.slice();

    /* A estas alturas los candidatos no están en el top 3 de ninguna
       táctica, así que no van a salir a pelear y su puntuación de combate
       da igual. Lo que cuenta es lo que aportan sin bajar del barco:
       velocidad primero (NAV), luego la búsqueda de poneglifos (INT) y
       por último el poder, que decide el tiempo de conquista. */
    candidatos.sort((a, b) => {
      if (a.v !== b.v) return a.v - b.v;                 // menos velocidad, fuera
      if (a.i !== b.i) return a.i - b.i;                 // menos inteligencia
      return R.power(a) - R.power(b);                    // y menos poder
    });

    const peor = candidatos[0];

    let razon;
    if (R.isUsefulRole(peor.r) && cuentaRol[peor.r] > 1) {
      const otro = crew.find(c => c.r === peor.r && c.n !== peor.n);
      razon = t('crew.why.dup') + (otro ? ' (' + nameOf(otro) + ')' : '');
    } else if (!R.isUsefulRole(peor.r)) {
      razon = t('crew.why.flavour');
    } else {
      razon = t('crew.why.weak');
    }

    return { quien: peor, razon: razon };
  }

  function avisoHTML(crew, rec){
    if (!rec) return '';
    const reglas = [1, 2, 3, 4, 5]
      .map(n => `<li>${t('crew.rule' + n)}</li>`)   // llevan <b>, no se escapan
      .join('');

    return `<div class="aviso-cambio">
      <b>${esc(t('crew.over'))}</b>
      <span>${esc(t('crew.rec'))} <em>${esc(nameOf(rec.quien))}</em> — ${esc(rec.razon)}.</span>
      <details class="reglas">
        <summary>${esc(t('crew.how'))}</summary>
        <ol>${reglas}</ol>
      </details>
    </div>`;
  }

  /* ---------- miembros ---------- */

  function readerMark(c){
    if (!c.rd) return '';
    const why = c.rd === 1 ? t('data.reader.role') : t('data.reader.kozuki');
    return `<span class="rd-badge" title="${esc(why)}">◈ ${esc(t('data.reader'))}</span>`;
  }

  /* Cabecera de las tres columnas de puntuación. Cada táctica es un botón:
     ordena la lista por ella de mayor a menor, y al volver a tocarla se
     recupera el orden en que los añadiste. */
  function cabeceraHTML(){
    return `<div class="lista-cab">
      <span class="lc-hueco"></span>
      <span class="ch-tri">${R.TACTICS.map(tac => `
        <button class="tri-sort${orden === tac ? ' on' : ''}" type="button" data-tac="${tac}"
                title="${esc(t('crew.sortBy'))} ${esc(t('tac.' + tac))}">
          <span class="larga">${esc(t('tac.' + tac))}</span><span class="corta">${esc(t('ta.' + tac))}</span><i>▾</i>
        </button>`).join('')}</span>
      <span class="lc-rm"></span>
    </div>`;
  }

  function miembrosHTML(crew, rec){
    if (!crew.length) return `<p class="empty">${esc(t('crew.empty'))}</p>`;

    // Se ordena una copia: el orden en que los guardaste no se toca.
    let lista = crew.slice();
    if (orden !== 'entry') {
      lista.sort((a, b) => R.score(b, orden) - R.score(a, orden));
    }

    return cabeceraHTML() + lista.map(c => {
      const mejor = R.bestTactic(c);
      const sobra = rec && rec.quien.n === c.n;
      return `<article class="ch simple${sobra ? ' sobra' : ''}">
        <div class="ch-head static">
          <span class="ch-id">
            <span class="ch-name">${esc(nameOf(c))} ${readerMark(c)}</span>
            <span class="ch-sub">
              <span class="ch-role">${esc(roleOf(c))}</span>
              ${sobra ? `<span class="tag-rojo">${esc(t('crew.tag'))}</span>` : ''}
            </span>
          </span>
          <span class="ch-tri">${R.TACTICS.map(tac => `
            <span class="tri ${COLOR_TAC[tac]}" title="${esc(t('tac.' + tac))}">
              <b>${num(R.score(c, tac))}</b>
            </span>`).join('')}</span>
          <button class="rm" type="button" data-name="${esc(c.n)}"
                  title="${esc(t('crew.remove'))}" aria-label="${esc(t('crew.remove'))}">×</button>
        </div>
      </article>`;
    }).join('');
  }

  /* ---------- pintado ---------- */

  function render(){
    const crew = C.personajes();
    const rec  = recomendacion(crew);

    els.count.innerHTML = `<b>${crew.length}</b> / ${C.MAX}`;
    els.count.classList.toggle('over', crew.length > C.MAX);
    // Solo se bloquea al llegar al de más: hasta ahí se deja comparar.
    els.input.disabled  = crew.length >= C.TOPE;
    els.addBtn.disabled = crew.length >= C.TOPE;

    els.resumen.innerHTML = crew.length ? resumenHTML(crew) : '';
    els.roles.innerHTML   = crew.length ? rolesHTML(crew) : '';
    els.lista.innerHTML   = avisoHTML(crew, rec) + miembrosHTML(crew, rec);
  }

  function rellenarDatalist(){
    els.datalist.innerHTML = DB
      .map(nameOf)
      .sort((a, b) => a.localeCompare(b, isES() ? 'es' : 'en'))
      .map(n => `<option value="${esc(n)}"></option>`)
      .join('');
  }

  /* ---------- avisos ---------- */

  let avisoTimer;
  function aviso(clave){
    els.hint.textContent = t(clave);
    els.hint.classList.add('err');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => {
      els.hint.textContent = '';
      els.hint.classList.remove('err');
    }, 2800);
  }

  /* ---------- añadir ---------- */

  function añadir(){
    const escrito = els.input.value.trim();
    if (!escrito) return;

    // Se acepta el nombre en cualquiera de los dos idiomas, con o sin tildes.
    const buscado = fold(escrito);
    const c = DB.find(x => fold(x.n) === buscado || (x.es && fold(x.es) === buscado));

    if (!c) { aviso('crew.notFound'); return; }

    const r = C.añadir(c.n);
    if (r === 'repetido') { aviso('crew.dupe'); return; }
    if (r === 'llena')    { aviso('crew.full'); return; }

    els.input.value = '';
    els.hint.textContent = '';
    els.hint.classList.remove('err');
    render();
    els.input.focus();
  }

  /* ---------- eventos ---------- */

  els.addBtn.addEventListener('click', añadir);
  els.input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); añadir(); }
  });


  els.lista.addEventListener('click', e => {
    // Ordenar por una táctica, o volver al orden de entrada si ya estaba.
    const cab = e.target.closest('.tri-sort');
    if (cab) {
      orden = (orden === cab.dataset.tac) ? 'entry' : cab.dataset.tac;
      render();
      return;
    }

    const btn = e.target.closest('.rm');
    if (!btn) return;
    C.quitar(btn.dataset.name);
    render();
  });

  document.addEventListener('langchange', () => {
    rellenarDatalist();
    render();
  });

  /* ---------- arranque ---------- */
  rellenarDatalist();
  render();
})();
