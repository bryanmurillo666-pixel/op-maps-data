/* ============================================================
   OP-MAPS DATA — página Data: los 226 personajes
   ------------------------------------------------------------
   Nada se guarda calculado: todo sale de assets/js/rules.js a
   partir de los stats de assets/js/characters.js.
   ============================================================ */
(function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;

  /* ---------- estado de la vista ---------- */
  const state = {
    q: '',            // texto buscado
    role: '',         // rol filtrado ('' = todos)
    sort: 'album',    // criterio de orden (por defecto, el numérico del juego)
    readers: false,   // solo los que leen poneglifos
    view: 'list',     // 'list' = tabla · 'album' = cromos por capítulos
    page: 0,          // página del álbum, contada de corrido por todo el libro
    limit: 50,        // cuántos se pintan en la lista (el resto, bajo demanda)
    open: null        // nombre (en inglés) del personaje con la ficha abierta
  };

  // La lista arranca con 50 y va creciendo de 50 en 50. El buscador y los
  // filtros trabajan sobre los 226: esto solo recorta lo que se pinta.
  const TANDA = 50;

  /* El álbum del juego reparte 9 cromos por página (3×3). En pantalla
     estrecha caben 2 columnas, así que la página baja a 6 (2×3). */
  const ANCHO_MOVIL = window.matchMedia('(max-width: 640px)');
  const porPagina = () => (ANCHO_MOVIL.matches ? 6 : 9);

  // La vista elegida se recuerda en este navegador.
  const VIEW_KEY = 'opmaps-data-view';
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === 'album' || v === 'list') state.view = v;
  } catch(e){ /* almacenamiento bloqueado: se queda en lista */ }

  // Y se puede forzar por la URL: data.html?view=album
  try {
    const qv = new URLSearchParams(location.search).get('view');
    if (qv === 'album' || qv === 'list') state.view = qv;
  } catch(e){ /* navegador antiguo: se queda como estaba */ }

  /* Los criterios de orden. 'name' y 'album' son los dos órdenes naturales
     del juego; los otros tres ordenan por lo que puntúa cada táctica. */
  const SORTS = {
    name:      null,               // alfabético, en el idioma que se esté viendo
    album:     c => c.a,           // el número del álbum, de menor a mayor
    assault:   c => R.score(c, 'Assault'),
    manoeuvre: c => R.score(c, 'Manoeuvre'),
    ambush:    c => R.score(c, 'Ambush')
  };
  const SORT_ORDER = ['album', 'name', 'assault', 'manoeuvre', 'ambush'];

  // Los tres que ordenan de mayor a menor (los de puntuación).
  const IS_SCORE = { assault: 'Assault', manoeuvre: 'Manoeuvre', ambush: 'Ambush' };

  const els = {
    col:      document.querySelector('.data-col'),
    search:   document.getElementById('search'),
    role:     document.getElementById('roleFilter'),
    sort:     document.getElementById('sortBy'),
    sortWrap: document.getElementById('sortWrap'),
    readers:  document.getElementById('fReaders'),
    vList:    document.getElementById('vList'),
    vAlbum:   document.getElementById('vAlbum'),
    count:    document.getElementById('count'),
    list:     document.getElementById('list')
  };

  // Cuántos personajes tiene cada capítulo en total, para el contador
  // de la página cuando hay filtros puestos.
  const POR_CAPITULO = {};
  DB.forEach(c => { POR_CAPITULO[c.ch] = (POR_CAPITULO[c.ch] || 0) + 1; });

  /* ---------- utilidades ---------- */

  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';

  // Nombre y rol en el idioma que se esté viendo.
  const nameOf = c => (isES() && c.es) ? c.es : c.n;
  const roleOf = c => t('rn.' + c.r);

  // Para poder buscar "brulee" y que salga "Charlotte Brûlée".
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

  // El número de álbum siempre con tres cifras, como en el juego.
  const pad3 = n => String(n).padStart(3, '0');

  /* ---------- filtros ---------- */

  function filtered(){
    const q = fold(state.q.trim());

    let out = DB.filter(c => {
      if (q) {
        // Se busca por los dos nombres y también por el número de álbum.
        const hit = fold(c.n).indexOf(q) !== -1
                 || (c.es && fold(c.es).indexOf(q) !== -1)
                 || pad3(c.a).indexOf(q) === 0;
        if (!hit) return false;
      }
      if (state.role && c.r !== state.role) return false;
      if (state.readers && !R.isReader(c)) return false;
      return true;
    });

    if (state.sort === 'name') {
      const loc = isES() ? 'es' : 'en';
      out.sort((a, b) => nameOf(a).localeCompare(nameOf(b), loc));
    } else if (state.sort === 'album') {
      out.sort((a, b) => a.a - b.a);
    } else {
      const key = SORTS[state.sort];
      out.sort((a, b) => key(b) - key(a));   // de mayor a menor
    }
    return out;
  }

  /* ---------- pintado ---------- */

  /* Un stat: la etiqueta, el número y diez tramos, uno por cada 10 puntos.
     Se redondea al tramo más cercano (95 llena los diez, 5 enciende uno). */
  function statBar(label, value, cls){
    const on = Math.round(value / 10);
    let segs = '';
    for (let s = 0; s < 10; s++) segs += `<span class="seg${s < on ? ' ' + cls : ''}"></span>`;
    return `<span class="sb"><i>${label}</i><b>${value}</b><span class="segs">${segs}</span></span>`;
  }

  /* La marca de lector de poneglifos. Va pegada al número, no al nombre,
     para que los nombres largos no se queden sin sitio. */
  function readerMark(c){
    if (!c.rd) return '';
    const why = c.rd === 1 ? t('data.reader.role') : t('data.reader.kozuki');
    return `<span class="rd-badge" title="${esc(why)}">◈ ${esc(t('data.reader'))}</span>`;
  }

  /* El número de la derecha: si se está ordenando por una táctica, la
     puntuación en esa táctica; si no, la de su mejor táctica. En ambos
     casos la etiqueta dice de qué táctica es el número. */
  function metric(c){
    const tac = IS_SCORE[state.sort] || R.bestTactic(c);
    return { v: num(R.score(c, tac)), label: t('tac.' + tac) };
  }

  function detail(c){
    const sc   = R.scores(c);
    const best = R.bestTactic(c);
    const max  = Math.max(sc.Assault, sc.Manoeuvre, sc.Ambush);

    const scoreRows = R.TACTICS.map(tac => {
      const on  = tac === best;
      const aff = R.hasAffinity(c, tac);
      return `<div class="sc-row${on ? ' sc-best' : ''}">
        <span class="sc-name">${esc(t('tac.' + tac))}${aff ? ' <em>×1.10</em>' : ''}</span>
        <span class="sc-track"><span class="sc-fill" style="width:${(sc[tac] / max) * 100}%"></span></span>
        <span class="sc-val">${num(sc[tac])}${on ? ` <i>${esc(t('lbl.best'))}</i>` : ''}</span>
      </div>`;
    }).join('');

    const roleTxt = R.isUsefulRole(c.r) ? t('role.' + c.r) : t('lbl.flavour');

    return `<div class="ch-detail">
      <div class="kv">
        <div><b>${num(R.power(c))}</b><span>${esc(t('lbl.power'))}</span></div>
        <div><b>${num(R.health(c), R.health(c) % 1 ? 1 : 0)}</b><span>${esc(t('lbl.health'))}</span></div>
        <div><b>${num(R.total(c))}</b><span>${esc(t('lbl.total'))}</span></div>
        <div><b>${num(R.price(c))}</b><span>${esc(t('lbl.price'))} · ${esc(t('lbl.gold'))}</span></div>
        <div><b>+${num(R.speedShare(c), 1)}</b><span>${esc(t('lbl.speed'))}</span></div>
        <div><b>+${num(R.searchShare(c) * 100, 1)} %</b><span>${esc(t('lbl.search'))}</span></div>
      </div>

      <div class="sc-block">
        <h3>${esc(t('lbl.scores'))}</h3>
        ${scoreRows}
        <p class="note">${esc(t('lbl.tacNote'))}</p>
      </div>

      <div class="role-note">
        <h3>${esc(t('lbl.role'))} · ${esc(roleOf(c))}</h3>
        <p>${esc(roleTxt)}</p>
        ${R.isUsefulRole(c.r) ? `<p class="note">${esc(t('lbl.roleNote'))}</p>` : ''}
        ${c.rd ? `<p class="note">◈ ${esc(c.rd === 1 ? t('data.reader.role') : t('data.reader.kozuki'))}</p>` : ''}
      </div>
    </div>`;
  }

  /* ---------- vista LISTA ---------- */

  function botonMas(total){
    const restan = total - state.limit;
    if (restan <= 0) return '';
    return `<button class="btn-mas" type="button">
      <span>${esc(t('data.more'))}</span>
      <i>${restan} ${esc(t('data.remaining'))}</i>
    </button>`;
  }

  function listHTML(rows){
    return rows.map(c => {
      const m    = metric(c);
      const open = state.open === c.n;
      return `<article class="ch${open ? ' is-open' : ''}">
        <button class="ch-head" type="button" data-name="${esc(c.n)}" aria-expanded="${open}">
          <span class="ch-idx">${pad3(c.a)}</span>
          <span class="ch-id">
            <span class="ch-name">${esc(nameOf(c))} ${readerMark(c)}</span>
            <span class="ch-role">${esc(roleOf(c))}</span>
          </span>
          <span class="ch-metric"><b>${m.v}</b><i>${esc(m.label)}</i></span>
        </button>
        <div class="ch-bars">
          ${statBar(t('st.f'), c.f, 'f')}
          ${statBar(t('st.v'), c.v, 'v')}
          ${statBar(t('st.i'), c.i, 'i')}
        </div>
        ${open ? detail(c) : ''}
      </article>`;
    }).join('');
  }

  /* ---------- vista ÁLBUM ---------- */

  // Las tres stats del cromo, apiladas y en miniatura.
  function mini(c){
    const filas = [[t('st.f'), c.f, 'f'], [t('st.v'), c.v, 'v'], [t('st.i'), c.i, 'i']];
    return `<span class="mini">${filas.map(([lb, val, cls]) => {
      const on = Math.round(val / 10);
      let segs = '';
      for (let s = 0; s < 10; s++) segs += `<span class="seg${s < on ? ' ' + cls : ''}"></span>`;
      return `<span class="fila"><i>${esc(lb)}</i><b>${val}</b><span class="segs">${segs}</span></span>`;
    }).join('')}</span>`;
  }

  /* Rellena la hoja con huecos vacíos hasta completarla, para que todas
     las páginas del álbum midan lo mismo aunque el capítulo se acabe. */
  function huecos(cuantos){
    const faltan = porPagina() - cuantos;
    return faltan > 0 ? '<div class="cromo vacio" aria-hidden="true"></div>'.repeat(faltan) : '';
  }

  function cromo(c){
    const open = state.open === c.n;
    return `<article class="cromo${open ? ' is-open' : ''}">
        <button class="cromo-btn" type="button" data-name="${esc(c.n)}" aria-expanded="${open}">
          <span class="num">#${pad3(c.a)}</span>
          <span class="nom">${esc(nameOf(c))} ${readerMark(c)}</span>
          <span class="rol">${esc(roleOf(c))}</span>
          ${mini(c)}
        </button>
      </article>
      ${open ? `<div class="cromo-detail">${detail(c)}</div>` : ''}`;
  }

  /* Trocea el álbum en páginas de corrido, como un libro: cada capítulo
     empieza en página nueva y se reparte de 9 en 9 (6 en móvil), igual que
     el juego. Devuelve una lista plana de páginas. */
  function paginasAlbum(rows){
    const porPag = porPagina();
    const porCapitulo = {};
    rows.forEach(c => { (porCapitulo[c.ch] = porCapitulo[c.ch] || []).push(c); });

    const hojas = [];
    Object.keys(porCapitulo).map(Number).sort((a, b) => a - b).forEach(ch => {
      const cartas = porCapitulo[ch].sort((a, b) => a.a - b.a);
      const total = Math.max(1, Math.ceil(cartas.length / porPag));
      for (let p = 0; p < total; p++) {
        hojas.push({
          ch: ch,
          enCapitulo: p,          // qué página es dentro de su capítulo
          deCapitulo: total,      // cuántas tiene ese capítulo
          cartas: cartas.slice(p * porPag, p * porPag + porPag),
          quedan: cartas.length   // cuántas quedan del capítulo tras filtrar
        });
      }
    });
    return hojas;
  }

  /* Una sola página a la vista, con el índice de capítulos arriba y los
     botones de pasar página abajo. El orden lo manda el libro, no el
     desplegable. */
  function albumHTML(rows){
    const caps  = window.ALBUM_CHAPTERS[isES() ? 'es' : 'en'];
    const hojas = paginasAlbum(rows);

    // Tras filtrar puede haber menos páginas de las que había abiertas.
    if (state.page > hojas.length - 1) state.page = hojas.length - 1;
    if (state.page < 0) state.page = 0;
    const hoja = hojas[state.page];

    // Índice: la primera página de cada capítulo, para saltar de golpe.
    const primera = {};
    hojas.forEach((h, i) => { if (primera[h.ch] === undefined) primera[h.ch] = i; });
    const indice = Object.keys(primera).map(Number).sort((a, b) => a - b).map(ch =>
      `<button class="cap-chip${ch === hoja.ch ? ' on' : ''}" type="button"
               data-page="${primera[ch]}" title="${esc(caps[ch])}">${ch + 1}</button>`
    ).join('');

    // "10" si está el capítulo entero, "4 / 10" si hay filtros puestos.
    const cuenta = hoja.quedan === POR_CAPITULO[hoja.ch]
      ? String(POR_CAPITULO[hoja.ch])
      : `${hoja.quedan} / ${POR_CAPITULO[hoja.ch]}`;
    const dentro = hoja.deCapitulo > 1
      ? ` · ${esc(t('album.page')).toLowerCase()} ${hoja.enCapitulo + 1} ${esc(t('album.of'))} ${hoja.deCapitulo}`
      : '';

    return `<nav class="cap-strip" aria-label="${esc(t('album.index'))}">${indice}</nav>
      <section class="pagina">
        <div class="pagina-cab">
          <h2>${esc(caps[hoja.ch])}</h2>
          <span class="cuenta">${cuenta}${dentro}</span>
        </div>
        <div class="cromos">${hoja.cartas.map(cromo).join('') + huecos(hoja.cartas.length)}</div>
        <div class="pag">
          <button class="pag-btn" type="button" data-dir="-1"
                  ${state.page === 0 ? 'disabled' : ''} title="${esc(t('album.prev'))}">‹</button>
          <span class="pag-num">${esc(t('album.page'))} ${state.page + 1} ${esc(t('album.of'))} ${hojas.length}</span>
          <button class="pag-btn" type="button" data-dir="1"
                  ${state.page === hojas.length - 1 ? 'disabled' : ''} title="${esc(t('album.next'))}">›</button>
        </div>
      </section>`;
  }

  /* ---------- pintado ---------- */

  function render(){
    const rows  = filtered();
    const album = state.view === 'album';

    els.col.classList.toggle('es-album', album);
    els.sortWrap.hidden = album;              // en álbum manda el orden del libro
    els.vList.classList.toggle('on', !album);
    els.vAlbum.classList.toggle('on', album);
    els.vList.setAttribute('aria-pressed', album ? 'false' : 'true');
    els.vAlbum.setAttribute('aria-pressed', album ? 'true' : 'false');

    els.count.innerHTML = `<b>${rows.length}</b> ${esc(t('data.shown'))}`;

    if (!rows.length) {
      els.list.innerHTML = `<p class="empty">${esc(t('data.empty'))}</p>`;
      return;
    }

    els.list.innerHTML = album
      ? albumHTML(rows)
      : listHTML(rows.slice(0, state.limit)) + botonMas(rows.length);
  }

  /* ---------- desplegables ---------- */

  function fillRoles(){
    const counts = {};
    DB.forEach(c => { counts[c.r] = (counts[c.r] || 0) + 1; });

    // Se ordenan por el nombre traducido, que es el que se ve.
    const roles = Object.keys(counts).sort((a, b) => roleOf({ r:a }).localeCompare(roleOf({ r:b })));

    els.role.innerHTML =
      `<option value="">${esc(t('data.roleAll'))} (${DB.length})</option>` +
      roles.map(r =>
        `<option value="${esc(r)}"${state.role === r ? ' selected' : ''}>${esc(roleOf({ r:r }))} (${counts[r]})</option>`
      ).join('');
  }

  function fillSorts(){
    els.sort.innerHTML = SORT_ORDER.map(o =>
      `<option value="${o}"${state.sort === o ? ' selected' : ''}>${esc(t('sort.' + o))}</option>`
    ).join('');
  }

  /* ---------- eventos ---------- */

  /* Al cambiar la búsqueda o los filtros se vuelve a empezar: primera
     página del álbum y primeros 50 de la lista. */
  function reiniciar(){
    state.limit = TANDA;
    state.page = 0;
  }

  els.search.addEventListener('input', e => { state.q = e.target.value; reiniciar(); render(); });
  els.role.addEventListener('change', e => { state.role = e.target.value; reiniciar(); render(); });
  els.sort.addEventListener('change', e => { state.sort = e.target.value; reiniciar(); render(); });

  els.readers.addEventListener('click', () => {
    state.readers = !state.readers;
    els.readers.classList.toggle('on', state.readers);
    els.readers.setAttribute('aria-pressed', state.readers ? 'true' : 'false');
    reiniciar();
    render();
  });

  // Cambio de vista: lista o álbum.
  function setView(v){
    if (state.view === v) return;
    state.view = v;
    try { localStorage.setItem(VIEW_KEY, v); } catch(e){ /* da igual, dura la sesión */ }
    render();
  }
  els.vList.addEventListener('click',  () => setView('list'));
  els.vAlbum.addEventListener('click', () => setView('album'));

  // Abrir y cerrar fichas (delegado: la lista se repinta entera).
  // Vale tanto para la fila de la lista como para el cromo del álbum.
  els.list.addEventListener('click', e => {
    // Pasar página del álbum.
    const pagBtn = e.target.closest('.pag-btn');
    if (pagBtn) {
      state.page = Math.max(0, state.page + Number(pagBtn.dataset.dir));
      state.open = null;           // al pasar de página se cierra la ficha
      syncHash();
      render();
      subirAlAlbum();
      return;
    }

    // Pintar la siguiente tanda de la lista.
    if (e.target.closest('.btn-mas')) {
      state.limit += TANDA;
      render();
      return;
    }

    // Saltar a un capítulo desde el índice.
    const chip = e.target.closest('.cap-chip');
    if (chip) {
      state.page = Number(chip.dataset.page);
      state.open = null;
      syncHash();
      render();
      subirAlAlbum();
      return;
    }

    const head = e.target.closest('.ch-head, .cromo-btn');
    if (!head) return;
    const name = head.dataset.name;
    state.open = (state.open === name) ? null : name;
    syncHash();
    render();
  });

  /* Enlace directo: data.html#Shanks abre esa ficha, y abrir una ficha
     actualiza la barra de direcciones para poder pasar el enlace.
     Vale tanto el nombre inglés como el español. */
  function nameFromHash(){
    let h = '';
    try { h = decodeURIComponent(location.hash.replace(/^#/, '')).trim(); } catch(e){ return null; }
    if (!h) return null;
    const hit = DB.find(c => c.n === h || c.es === h);
    return hit ? hit.n : null;
  }

  function syncHash(){
    const next = state.open ? '#' + encodeURIComponent(state.open) : '';
    try {
      // replaceState para no llenar el historial con cada ficha abierta.
      history.replaceState(null, '', location.pathname + location.search + next);
    } catch(e){
      // Algunos navegadores lo bloquean al abrir el archivo con file://.
      // No es grave: el enlace directo sigue funcionando al cargar.
    }
  }

  // Al cambiar de idioma cambian nombres, roles, orden alfabético y formato
  // numérico, así que hay que repintarlo todo.
  document.addEventListener('langchange', () => {
    fillRoles();
    fillSorts();
    render();
  });

  // Al cambiar entre móvil y escritorio cambian los cromos por página.
  if (ANCHO_MOVIL.addEventListener) {
    ANCHO_MOVIL.addEventListener('change', () => { if (state.view === 'album') render(); });
  }

  /* Si se entra con un enlace directo estando en álbum, hay que abrir la
     página donde está esa carta, no la primera del libro. */
  function irAPaginaDe(name){
    const hojas = paginasAlbum(filtered());
    const i = hojas.findIndex(h => h.cartas.some(c => c.n === name));
    if (i >= 0) state.page = i;
  }

  /* Al pasar de página, volver al principio de la hoja: si no, te quedas
     mirando el pie de la página nueva. */
  function subirAlAlbum(){
    const pagina = els.list.querySelector('.pagina');
    if (pagina) pagina.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- arranque ---------- */
  state.open = nameFromHash();
  if (state.open) {
    if (state.view === 'album') irAPaginaDe(state.open);
    else {
      // Un enlace directo a alguien que cae más allá de los 50 primeros
      // tiene que traer consigo las tandas necesarias para verlo.
      const i = filtered().findIndex(c => c.n === state.open);
      if (i >= state.limit) state.limit = Math.ceil((i + 1) / TANDA) * TANDA;
    }
  }
  fillRoles();
  fillSorts();
  render();

  // Si se ha entrado con un enlace directo, acercamos la ficha a la vista.
  // 'nearest' hace el mínimo movimiento: si ya se ve, no salta nada.
  if (state.open) {
    const card = els.list.querySelector('.ch.is-open');
    if (card) card.scrollIntoView({ block: 'nearest' });
  }
})();
