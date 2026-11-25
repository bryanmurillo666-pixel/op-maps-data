/* ============================================================
   OP-MAPS DATA — página Jefes: simulador de los jefes del mundo
   ------------------------------------------------------------
   Varios jugadores atacan a la vez a Mihawk o a Big Mom. Cada uno manda
   a sus tres mejores con una táctica cada uno y ataca N veces por turno
   (2 con Comandante, que es lo normal en los que van a por un jefe).

   Las reglas, de la guía v7.7:
     - el jefe está en las tres posiciones y cada copia juega una táctica
       secreta sorteada en cada ataque: los tres duelos son independientes
       y cada uno es un sorteo limpio entre las tres tácticas del jefe
     - el daño va por el RESULTADO de cada ataque: 150 si ganas 3-0, 100 si
       ganas 2-1 y 50 si pierdes (cambiado en el juego después de la guía
       v7.7, que aún dice 150 por duelo; ver R.JEFE_DANO)
     - el empate lo gana el jefe (es el defensor)
     - tus luchadores pagan la vida de siempre: 34 % perdiendo, 8 %
       ganando, ×0,6 si contrarrestaste. Y el aura: 12 % por turno a cada
       uno, más 225 de casco
     - las armas cuentan también contra los jefes

   Así que no hace falta simular para la media: cada duelo se gana con
   probabilidad (tácticas del jefe a las que ganas) / 3, y de las tres sale
   el daño medio del ataque (R.danoJefe). Lo que sí se simula es el RANGO
   de turnos, porque la suerte de cada turno se va sumando.

   Todo se guarda en este navegador (opmaps-jefes).
   ============================================================ */
(function () {

  const R  = window.RULES;
  const DB = window.CHARACTERS;
  const C  = window.CREW;

  const KEY = 'opmaps-jefes';
  const MAX_JUGADORES = 30;
  const VIDA_PIERDE = 0.34, VIDA_GANA = 0.08, CONTRA = 0.6;
  const SIMULACIONES = 400;

  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';
  const nameOf = c => (isES() && c.es) ? c.es : c.n;

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
  const fold = s => String(s || '').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').trim();

  /* «2 d 5 h», «3 h 30 min», «30 min»: lo que se quiere saber es si es
     una tarde o una semana. */
  function tiempo(min){
    const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
    if (d) return d + ' d' + (h ? ' ' + h + ' h' : '');
    if (h) return h + ' h' + (m ? ' ' + m + ' ' + t('u.min') : '');
    return m + ' ' + t('u.min');
  }

  /* ---------- estado ---------- */

  const jefesDisponibles = () => Object.keys(R.JEFES).filter(n => DB.some(c => c.n === n));

  let estado = { jefe: 'Dracule Mihawk', ataques: 2, jugadores: [] };

  function cargar(){
    try {
      const g = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (g && typeof g === 'object') {
        if (R.JEFES[g.jefe]) estado.jefe = g.jefe;
        if (g.ataques === 1 || g.ataques === 2) estado.ataques = g.ataques;
        if (Array.isArray(g.jugadores)) {
          estado.jugadores = g.jugadores.slice(0, MAX_JUGADORES).map(j => ({
            n: String((j && j.n) || '').slice(0, 24),
            p: [0, 1, 2].map(k => {
              const s = (j && Array.isArray(j.p) && j.p[k]) || {};
              return { c: String(s.c || ''), t: R.TACTICS.indexOf(s.t) !== -1 ? s.t : 'auto',
                       w: R.ARMAS[s.w] ? s.w : '' };
            })
          }));
        }
      }
    } catch(e){ /* lo guardado no vale: se empieza de cero */ }
  }

  function guardar(){
    try { localStorage.setItem(KEY, JSON.stringify(estado)); }
    catch(e){ /* si el navegador lo bloquea, dura la sesión */ }
  }

  const jefeActual = () => DB.find(c => c.n === estado.jefe);

  /* El personaje por lo escrito, en cualquiera de los dos idiomas. */
  function pjPor(texto){
    const f = fold(texto);
    if (!f) return null;
    return DB.find(c => fold(c.n) === f || (c.es && fold(c.es) === f)) || null;
  }

  /* ---------- cuentas de un duelo contra el jefe ---------- */

  /* Contra una táctica concreta del jefe: ¿gano?, y ¿cuánta vida me cuesta
     (en tanto por uno de la mía)? */
  function duelo(mio, miTac, jefe, suTac){
    const gana = R.duelWin(R.score(mio, miTac), miTac, R.score(jefe, suTac), suTac);
    const coste = (gana ? VIDA_GANA : VIDA_PIERDE) * (R.beats(miTac, suTac) ? CONTRA : 1);
    return { gana: gana, coste: coste };
  }

  /* Lo que vale un luchador con una táctica, de media sobre las tres del
     jefe: probabilidad de ganar el duelo y vida que se deja. */
  function valor(mio, miTac, jefe){
    let gana = 0, coste = 0;
    for (const suTac of R.TACTICS) {
      const d = duelo(mio, miTac, jefe, suTac);
      if (d.gana) gana++;
      coste += d.coste;
    }
    return { p: gana / 3, coste: coste / 3, tac: miTac, punto: R.score(mio, miTac) };
  }

  /* La mejor táctica contra el jefe: la que más duelos gana; a igualdad,
     la que menos vida cuesta, y luego la de más puntuación. */
  function mejorTactica(mio, jefe){
    return R.TACTICS.map(tac => valor(mio, tac, jefe)).reduce((a, b) =>
      (b.p > a.p + 1e-9 || (Math.abs(b.p - a.p) < 1e-9 &&
        (b.coste < a.coste - 1e-9 || (Math.abs(b.coste - a.coste) < 1e-9 && b.punto > a.punto)))) ? b : a);
  }

  /* Un puesto del jugador ya resuelto: personaje con su arma, táctica y
     lo que vale. null si el puesto está vacío o el nombre no existe. */
  function puesto(s, jefe){
    const base = pjPor(s.c);
    if (!base) return null;
    const mio = (s.w && R.puedeArma(base, s.w)) ? R.conArma(base, s.w) : base;
    const v = s.t === 'auto' ? mejorTactica(mio, jefe) : valor(mio, s.t, jefe);
    return { pj: mio, v: v, auto: s.t === 'auto' };
  }

  /* Lo de un jugador: duelos ganados por ataque, daño por ataque y por
     turno, y cuántos turnos aguanta su luchador más tocado sin curarse
     (los ataques del turno más el aura). */
  function jugador(j, jefe){
    const ps = j.p.map(s => puesto(s, jefe));
    const validos = ps.filter(Boolean);
    const duelos = validos.reduce((a, x) => a + x.v.p, 0);
    // un puesto vacío concede su duelo
    const probs = ps.map(x => x ? x.v.p : 0);
    const porAtaque = validos.length ? R.danoJefe(probs) : 0;
    const porTurno = porAtaque * estado.ataques;
    let aguanta = Infinity;
    validos.forEach(x => {
      const pierde = x.v.coste * estado.ataques + R.JEFE_AURA_VIDA;
      aguanta = Math.min(aguanta, Math.ceil(1 / pierde - 1e-9));
    });
    return { ps: ps, probs: probs, validos: validos.length, duelos: duelos,
             porAtaque: porAtaque, porTurno: porTurno,
             aguanta: validos.length ? aguanta : 0 };
  }

  /* ---------- simulación del rango ----------
     La media dice cuánto tarda «de media», pero la suerte se acumula:
     cada duelo es un sorteo. Se juega la pelea entera muchas veces,
     turno a turno, y se cuentan los turnos que hicieron falta. */
  function simula(equipos, vida){
    if (!equipos.length) return null;
    const tope = 5000;
    const turnos = [];
    for (let s = 0; s < SIMULACIONES; s++) {
      let quitado = 0, n = 0;
      while (quitado < vida && n < tope) {
        n++;
        for (let a = 0; a < estado.ataques; a++)
          for (let e = 0; e < equipos.length; e++) {
            let ganados = 0;
            for (let i = 0; i < 3; i++) if (Math.random() < equipos[e][i]) ganados++;
            quitado += R.danoJefeMarcador(ganados);
          }
      }
      turnos.push(n);
    }
    turnos.sort((a, b) => a - b);
    const q = f => turnos[Math.min(turnos.length - 1, Math.floor(f * turnos.length))];
    return { rapido: q(0.1), lento: q(0.9) };
  }

  /* ---------- pintado ---------- */

  const els = {
    elige:     document.getElementById('jefeElige'),
    ficha:     document.getElementById('jefeFicha'),
    resultado: document.getElementById('resultado'),
    lista:     document.getElementById('jugadores'),
    count:     document.getElementById('jugCount'),
    nombre:    document.getElementById('jugNombre'),
    add:       document.getElementById('jugAdd'),
    mio:       document.getElementById('jugMio'),
    vaciar:    document.getElementById('jugVaciar'),
    hint:      document.getElementById('jugHint'),
    datalist:  document.getElementById('pjLista')
  };

  const COLOR = { Assault: 'f', Manoeuvre: 'v', Ambush: 'i' };

  function eligeHTML(){
    const botones = jefesDisponibles().map(n => {
      const c = DB.find(x => x.n === n);
      return `<button type="button" data-jefe="${esc(n)}" class="${n === estado.jefe ? 'on' : ''}"
        aria-pressed="${n === estado.jefe}">${esc(nameOf(c))}</button>`;
    }).join('');
    const ataques = [1, 2].map(n => `<button type="button" data-ataques="${n}"
        class="${n === estado.ataques ? 'on' : ''}" aria-pressed="${n === estado.ataques}">${n}</button>`).join('');
    return `<div class="jef-elige">
      <div class="seg-ctrl" role="group" aria-label="${esc(t('jef.boss.t'))}">${botones}</div>
      <div class="jef-ataques">
        <span>${esc(t('jef.boss.atk'))}</span>
        <div class="seg-ctrl" role="group" aria-label="${esc(t('jef.boss.atk'))}">${ataques}</div>
      </div>
    </div>`;
  }

  function fichaHTML(){
    const c = jefeActual();
    if (!c) return '';
    const datos = R.JEFES[c.n];
    const sc = R.scores(c);
    const tacs = R.TACTICS.map(tac => `<span class="tac-pill tac-${COLOR[tac]}">${esc(t('tac.' + tac))} · ${num(sc[tac])}</span>`).join(' ');
    return `<div class="kpi jef-kpi">
        <div class="kpi-box"><b>${num(datos.vida)}</b><span>${esc(t('jef.boss.hp'))}</span></div>
        <div class="kpi-box"><b>${num(datos.oro)}</b><span>${esc(t('jef.boss.gold'))}</span></div>
        <div class="kpi-box"><b>${c.f} / ${c.v} / ${c.i}</b><span>${esc(t('st.f'))} / ${esc(t('st.v'))} / ${esc(t('st.i'))}</span><em>${esc(t('rn.' + c.r))}</em></div>
      </div>
      <p class="jef-tacs">${tacs}</p>
      <p class="hint">${t('jef.boss.d').replace('{isla}', esc(datos.isla))}</p>`;
  }

  function resultadoHTML(){
    const jefe = jefeActual();
    if (!jefe) return '';
    const vida = R.JEFES[jefe.n].vida;
    const res = estado.jugadores.map(j => jugador(j, jefe));
    const conAlguien = res.filter(r => r.validos);
    if (!conAlguien.length) return `<p class="hint">${esc(t('jef.res.empty'))}</p>`;

    const porTurno = res.reduce((a, r) => a + r.porTurno, 0);

    const turnos = Math.ceil(vida / porTurno);
    const rango = simula(conAlguien.map(r => r.probs), vida);
    const aguanta = Math.min.apply(null, conAlguien.map(r => r.aguanta));
    const casco = Math.ceil(R.HULL / R.JEFE_AURA_CASCO);   // se hunde en ese turno

    const avisos = [];
    if (turnos >= aguanta) avisos.push(t('jef.res.caen').replace('{n}', aguanta));
    if (turnos >= casco) avisos.push(t('jef.res.casco').replace('{n}', casco));

    return `<div class="kpi">
        <div class="kpi-box"><b>${num(porTurno)}</b><span>${esc(t('jef.res.turn'))}</span>
          <em>${num(porTurno / vida * 100, 1)} % ${esc(t('jef.res.ofHp'))}</em></div>
        <div class="kpi-box"><b>${num(turnos)}</b><span>${esc(t('jef.res.turns'))}</span>
          <em>${rango ? esc(t('jef.res.range').replace('{a}', rango.rapido).replace('{b}', rango.lento)) : ''}</em></div>
        <div class="kpi-box"><b>${tiempo(turnos * 30)}</b><span>${esc(t('jef.res.time'))}</span>
          <em>${rango ? esc(tiempo(rango.rapido * 30) + ' – ' + tiempo(rango.lento * 30)) : ''}</em></div>
        <div class="kpi-box"><b>${num(conAlguien.length)}</b><span>${esc(t('jef.res.players'))}</span>
          <em>${num(estado.ataques)} ${esc(t(estado.ataques === 1 ? 'jef.res.atk1' : 'jef.res.atkN'))}</em></div>
      </div>
      ${avisos.map(a => `<p class="jef-aviso">${a}</p>`).join('')}
      ${repartoHTML(res, porTurno)}`;
  }

  /* Cuánto pone cada uno: una barra por jugador. */
  function repartoHTML(res, total){
    const filas = estado.jugadores.map((j, i) => {
      const r = res[i];
      if (!r.validos) return '';
      const pct = total ? r.porTurno / total * 100 : 0;
      return `<div class="jef-barra">
        <span class="jb-n">${esc(j.n || t('jef.pl.anon') + ' ' + (i + 1))}</span>
        <span class="jb-track"><span class="jb-fill" style="width:${pct}%"></span></span>
        <span class="jb-v">${num(r.porTurno)} · ${num(pct)} %</span>
      </div>`;
    }).join('');
    return `<h3 class="sub-tit">${esc(t('jef.res.share'))}</h3><div class="jef-reparto">${filas}</div>`;
  }

  function opcionesArma(pj, elegida){
    const puede = pj ? Object.keys(R.ARMAS).filter(a => R.puedeArma(pj, a)) : [];
    return `<option value="">${esc(t('jef.slot.noW'))}</option>` + puede.map(a =>
      `<option value="${esc(a)}"${a === elegida ? ' selected' : ''}>${esc(R.nombreArma(a, isES()))} ×${num(R.ARMAS[a].mult, 2)}</option>`
    ).join('');
  }

  function slotInfo(x){
    if (!x) return '';
    const tac = x.v.tac;
    return `<span class="tac-pill tac-${COLOR[tac]}">${x.auto ? esc(t('jef.slot.auto')) + ' · ' : ''}${esc(t('tac.' + tac))} · ${num(x.v.punto)}</span>
      <span class="jef-gana ${x.v.p >= 2/3 - 1e-9 ? 'win-hi' : (x.v.p > 0 ? 'win-mid' : 'win-lo')}">${Math.round(x.v.p * 3)}/3</span>`;
  }

  function jugadorResHTML(r){
    if (!r.validos) return `<span class="hint">${esc(t('jef.pl.noPj'))}</span>`;
    return `<b>${num(r.porTurno)}</b> ${esc(t('jef.pl.perTurn').replace('{max}', num(R.JEFE_DANO.g30 * estado.ataques)))}
      · ${num(r.duelos, 2)} ${esc(t('jef.pl.duels'))}
      · ${esc(t('jef.pl.lasts').replace('{n}', r.aguanta))}`;
  }

  function jugadoresHTML(){
    const jefe = jefeActual();
    if (!estado.jugadores.length) return `<p class="empty">${esc(t('jef.pl.empty'))}</p>`;
    const tacs = [['auto', t('jef.slot.auto')]].concat(R.TACTICS.map(x => [x, t('tac.' + x)]));
    return estado.jugadores.map((j, i) => {
      const r = jugador(j, jefe);
      const slots = j.p.map((s, k) => {
        const pj = pjPor(s.c);
        return `<div class="jef-slot" data-i="${i}" data-k="${k}">
          <span class="pos">${k + 1}</span>
          <input type="text" class="js-pj" list="pjLista" autocomplete="off" spellcheck="false"
                 value="${esc(pj ? nameOf(pj) : s.c)}" placeholder="${esc(t('jef.slot.ph'))}"
                 aria-label="${esc(t('jef.slot.ph'))} ${k + 1}">
          <select class="isla-select js-tac" aria-label="${esc(t('jef.slot.tac'))}">${tacs.map(([v, txt]) =>
            `<option value="${v}"${v === s.t ? ' selected' : ''}>${esc(txt)}</option>`).join('')}</select>
          <select class="isla-select js-arma" aria-label="${esc(t('jef.slot.w'))}"${pj && Object.keys(R.ARMAS).some(a => R.puedeArma(pj, a)) ? '' : ' disabled'}>${opcionesArma(pj, s.w)}</select>
          <span class="js-info">${slotInfo(r.ps[k])}</span>
        </div>`;
      }).join('');
      return `<article class="jef-jug" data-i="${i}">
        <div class="jef-jug-cab">
          <input type="text" class="js-nombre" maxlength="24" value="${esc(j.n)}"
                 placeholder="${esc(t('jef.pl.anon') + ' ' + (i + 1))}" aria-label="${esc(t('jef.pl.ph'))}">
          <button class="rm" type="button" data-quitar="${i}" title="${esc(t('jef.pl.del'))}" aria-label="${esc(t('jef.pl.del'))}">×</button>
        </div>
        ${slots}
        <p class="jef-jug-res" data-res="${i}">${jugadorResHTML(r)}</p>
      </article>`;
    }).join('');
  }

  function pintaCabecera(){
    els.elige.innerHTML = eligeHTML();
    els.ficha.innerHTML = fichaHTML();
  }
  function pintaResultado(){ els.resultado.innerHTML = resultadoHTML(); }
  function pintaJugadores(){
    els.lista.innerHTML = jugadoresHTML();
    els.count.innerHTML = `<b>${estado.jugadores.length}</b> / ${MAX_JUGADORES}`;
  }
  function pintaTodo(){ pintaCabecera(); pintaJugadores(); pintaResultado(); }

  /* Al tocar un puesto no se repinta la lista (te quitaría el foco al
     pasar de un campo a otro): solo su línea, la del jugador y el total. */
  function refrescaJugador(i){
    const jefe = jefeActual();
    const j = estado.jugadores[i];
    if (!j) return;
    const r = jugador(j, jefe);
    const card = els.lista.querySelector(`.jef-jug[data-i="${i}"]`);
    if (!card) return;
    card.querySelectorAll('.jef-slot').forEach(slot => {
      const k = Number(slot.dataset.k);
      slot.querySelector('.js-info').innerHTML = slotInfo(r.ps[k]);
    });
    card.querySelector('.jef-jug-res').innerHTML = jugadorResHTML(r);
    pintaResultado();
  }

  function rellenarDatalist(){
    els.datalist.innerHTML = DB.slice()
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b), isES() ? 'es' : 'en'))
      .map(c => `<option value="${esc(nameOf(c))}" label="${esc(t('rn.' + c.r))}"></option>`).join('');
  }

  let avisoTimer;
  function aviso(clave, malo){
    els.hint.textContent = t(clave);
    els.hint.className = 'hint' + (malo ? ' err' : '');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => { els.hint.textContent = ''; }, 3200);
  }

  /* ---------- acciones ---------- */

  function nuevoJugador(nombre, puestos){
    if (estado.jugadores.length >= MAX_JUGADORES) { aviso('jef.pl.full', true); return false; }
    estado.jugadores.push({
      n: String(nombre || '').trim().slice(0, 24),
      p: puestos || [0, 1, 2].map(() => ({ c: '', t: 'auto', w: '' }))
    });
    guardar();
    pintaJugadores();
    pintaResultado();
    return true;
  }

  /* Tu tripulación guardada: los tres que más duelos le ganan a ESTE
     jefe, con el arma que lleven y la táctica en automático. */
  function añadirMia(){
    const crew = C ? C.personajes() : [];
    if (crew.length < 1) { aviso('jef.pl.noCrew', true); return; }
    const jefe = jefeActual();
    /* Se prueban todos los tríos (con 12 son 220) y se queda el que más
       daño medio hace: no siempre es sumar los tres mejores sueltos,
       porque un 3-0 vale más que dos 2-1. A igualdad, menos vida gastada. */
    const v = crew.map(c => ({ c: c, v: mejorTactica(c, jefe) }));
    let tres = v.slice(0, 3), mejor = -1, coste = Infinity;
    for (let a = 0; a < v.length; a++)
      for (let b = a + 1; b < v.length; b++)
        for (let c = b + 1; c < v.length; c++) {
          const d = R.danoJefe([v[a].v.p, v[b].v.p, v[c].v.p]);
          const k = v[a].v.coste + v[b].v.coste + v[c].v.coste;
          if (d > mejor + 1e-9 || (Math.abs(d - mejor) < 1e-9 && k < coste)) { mejor = d; coste = k; tres = [v[a], v[b], v[c]]; }
        }
    const puestos = [0, 1, 2].map(k => tres[k]
      ? { c: tres[k].c.n, t: 'auto', w: tres[k].c.arma || '' }
      : { c: '', t: 'auto', w: '' });
    if (nuevoJugador(t('jef.pl.mineName'), puestos)) aviso('jef.pl.mineOk');
  }

  els.add.addEventListener('click', () => {
    if (nuevoJugador(els.nombre.value)) { els.nombre.value = ''; els.nombre.focus(); }
  });
  els.nombre.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); els.add.click(); }
  });
  els.mio.addEventListener('click', añadirMia);
  els.vaciar.addEventListener('click', () => {
    if (!estado.jugadores.length) return;
    if (!window.confirm(t('jef.pl.clearSure'))) return;
    estado.jugadores = [];
    guardar();
    pintaJugadores();
    pintaResultado();
  });

  els.elige.addEventListener('click', e => {
    const b = e.target.closest('[data-jefe]');
    if (b) { estado.jefe = b.dataset.jefe; guardar(); pintaTodo(); return; }
    const a = e.target.closest('[data-ataques]');
    if (a) { estado.ataques = Number(a.dataset.ataques); guardar(); pintaTodo(); }
  });

  els.lista.addEventListener('click', e => {
    const q = e.target.closest('[data-quitar]');
    if (!q) return;
    estado.jugadores.splice(Number(q.dataset.quitar), 1);
    guardar();
    pintaJugadores();
    pintaResultado();
  });

  /* `change` y no `input`: con cada tecla saldría «no existe» a medio
     escribir. Al elegir del desplegable con el ratón Chrome manda `input`
     sin `change`, así que en el campo del personaje se escuchan los dos
     y se actúa solo si lo escrito ya es alguien. */
  function alCambiar(e, esInput){
    const card = e.target.closest('.jef-jug');
    if (!card) return;
    const i = Number(card.dataset.i);
    const j = estado.jugadores[i];
    if (!j) return;

    if (e.target.classList.contains('js-nombre')) {
      if (esInput) return;
      j.n = e.target.value.trim().slice(0, 24);
      guardar();
      pintaResultado();
      return;
    }

    const slot = e.target.closest('.jef-slot');
    if (!slot) return;
    const s = j.p[Number(slot.dataset.k)];

    if (e.target.classList.contains('js-pj')) {
      const pj = pjPor(e.target.value);
      if (esInput && !pj) return;
      s.c = pj ? pj.n : e.target.value.trim();
      // el arma que llevaba puede no valerle al nuevo
      if (s.w && !(pj && R.puedeArma(pj, s.w))) s.w = '';
      const sel = slot.querySelector('.js-arma');
      sel.innerHTML = opcionesArma(pj, s.w);
      sel.disabled = !(pj && Object.keys(R.ARMAS).some(a => R.puedeArma(pj, a)));
    } else if (e.target.classList.contains('js-tac')) {
      if (esInput) return;
      s.t = e.target.value;
    } else if (e.target.classList.contains('js-arma')) {
      if (esInput) return;
      s.w = e.target.value;
      /* Una de cada por tripulación: si otro de los suyos la llevaba, se
         la quita. */
      if (s.w) j.p.forEach((o, k) => {
        if (o !== s && o.w === s.w) {
          o.w = '';
          const otro = card.querySelector(`.jef-slot[data-k="${k}"] .js-arma`);
          if (otro) otro.value = '';
        }
      });
    } else return;

    guardar();
    refrescaJugador(i);
  }

  els.lista.addEventListener('change', e => alCambiar(e, false));
  els.lista.addEventListener('input',  e => alCambiar(e, true));

  document.addEventListener('langchange', () => { rellenarDatalist(); pintaTodo(); });

  /* ---------- arranque ---------- */
  cargar();
  if (!R.JEFES[estado.jefe] || !jefeActual()) estado.jefe = jefesDisponibles()[0];
  rellenarDatalist();
  pintaTodo();

  // para el banco de pruebas
  window.JEFES_SIM = { estado: () => JSON.parse(JSON.stringify(estado)), jugador: j => jugador(j, jefeActual()),
                       mejorTactica: c => mejorTactica(c, jefeActual()) };
})();
