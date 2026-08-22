/* ============================================================
   OP-MAPS DATA — página Guía
   ------------------------------------------------------------
   El texto va en i18n.js, con la clave `gd.*`. Aquí solo hay tres
   cosas:

     1. Qué versión de la guía sigue el sitio. Se toca SOLO aquí.
     2. La tabla de todos los números, calculada desde rules.js en
        vez de escrita a mano, para que no pueda desfasarse: si un
        día cambia una fórmula, esta tabla cambia sola.
     3. Abrir y cerrar los pliegues, y recordar cómo los dejaste.
   ============================================================ */

/* La guía que sigue el sitio ahora mismo. Al llegar una nueva:
   se cambia aquí, se revisa el sitio y se apunta en ACTUALIZACIONES. */
window.GUIA = { v: '5.1', fecha: '2026-08-20' };

(function () {

  const R = window.RULES;
  const t = k => window.I18N.t(k);
  const isES = () => window.I18N.lang !== 'en';

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

  /* ---------- la versión, siempre arriba ---------- */

  function pintaVersion(){
    const n = document.getElementById('verNum');
    const f = document.getElementById('verFecha');
    if (n) n.textContent = 'v' + window.GUIA.v;
    if (f) {
      const d = new Date(window.GUIA.fecha + 'T00:00:00');
      f.textContent = t('gd.ver.up') + ' ' + d.toLocaleDateString(
        isES() ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  /* ---------- todos los números ----------
     Los valores salen de rules.js siempre que se pueda. Los que no
     tienen fórmula (son constantes sueltas de la guía) van escritos,
     pero agrupados aquí y en ningún otro sitio de esta página. */

  function filas(){
    const conq750 = R.conquestTime(750);
    const conq450 = R.conquestTime(450);
    const conq0   = R.conquestTime(0);
    const min = n => num(n) + ' ' + t('u.min');

    return [
      { g: 'gd.g.combat' },
      { k: 'gd.n.pos',        v: '3' },
      { k: 'gd.n.guards',     v: '3' },
      { k: 'gd.n.res',        v: '2' },
      { k: 'gd.n.score',      v: t('gd.n.scoreV') },
      { k: 'gd.n.counter',    v: '×' + num(R.COUNTER, 2) },
      { k: 'gd.n.aff',        v: '×' + num(R.AFFINITY, 2) },
      { k: 'gd.n.tie',        v: t('gd.n.tieV') },
      { k: 'pve.k.char',      v: '−34 %' },
      { k: 'pve.k.charWin',   v: '−8 %' },
      { k: 'pve.k.counter',   v: '×' + num(0.6, 1) },
      { k: 'gd.n.hull',       v: num(R.HULL) },

      { g: 'gd.g.pve' },
      { k: 'gd.n.pveGold',    v: '+' + num(5000) },
      { k: 'gd.n.pveLoss',    v: '−' + num(500) },
      { k: 'pve.k.offer',     v: '80 %' },
      { k: 'pve.k.hull',      v: num(525) },
      { k: 'pve.k.stun',      v: min(90) },
      { k: 'gd.n.tribute',    v: t('gd.n.tributeV') },

      { g: 'gd.g.conq' },
      { k: 'gd.n.conq750',    v: min(conq750.neutral) + ' / ' + min(conq750.defended) },
      { k: 'gd.n.conq450',    v: min(conq450.neutral) + ' / ' + min(conq450.defended) },
      { k: 'gd.n.conq0',      v: min(conq0.neutral)   + ' / ' + min(conq0.defended) },
      { k: 'gd.n.upkeep',     v: num(3000) + ' / ' + num(5000) },

      { g: 'gd.g.rp' },
      { k: 'gd.n.rp',         v: 'mín(0,9 @ 0,3 + INT × 0,001)', raw: true },
      { k: 'gd.n.rpTry',      v: '1' },
      { k: 'gd.n.rpEnd',      v: t('gd.n.rpEndV') },
      { k: 'gd.n.yonko',      v: t('gd.n.yonkoV') },

      { g: 'gd.g.crew' },
      { k: 'gd.n.start',      v: t('gd.n.startV') },
      { k: 'gd.n.max',        v: num(R.MAX_CREW) },
      { k: 'gd.n.health',     v: '60 + 0,5 × (F+N+I)', raw: true },
      { k: 'gd.n.price',      v: '(F+N+I)² / 10', raw: true },
      { k: 'gd.n.power',      v: 'F × 1,5 + I × 0,5 + N × 0,2', raw: true },
      { k: 'gd.n.speed',      v: 'mín(60 @ 20 + N × 0,04 + 8)', raw: true },
      { k: 'gd.n.supplies',   v: t('gd.n.suppliesV') },
      { k: 'gd.n.world',      v: t('gd.n.worldV') },

      { g: 'gd.g.other' },
      { k: 'gd.n.market',     v: t('gd.n.marketV') },
      { k: 'gd.n.ally',       v: t('gd.n.allyV') }
    ];
  }

  /* Las fórmulas se escriben una sola vez, en español, con `@` donde va el
     separador de argumentos. En español el decimal ya es la coma, así que
     ahí el separador tiene que ser punto y coma o no se entiende
     `mín(0,9 , 0,3 + ...)`. En inglés se invierte todo y la inicial de
     Fuerza pasa a ser S, de Strength. */
  function formula(txt){
    if (isES()) return txt.replace(/@/g, ';');
    return txt
      .replace(/mín/g, 'min')
      .replace(/@/g, ',')
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/\bF\b/g, 'S');
  }

  function pintaTabla(){
    const caja = document.getElementById('tablaNumeros');
    if (!caja) return;

    const html = filas().map(f => {
      if (f.g) return `<tr class="grupo"><th colspan="2">${esc(t(f.g))}</th></tr>`;
      const v = f.raw ? formula(f.v) : f.v;
      return `<tr><td>${esc(t(f.k))}</td><td class="cifra">${esc(v)}</td></tr>`;
    }).join('');

    caja.innerHTML = `<table class="tabla tabla-num"><tbody>${html}</tbody></table>`;
  }

  /* ---------- abrir, cerrar y recordar ---------- */

  const ABRE_KEY = 'opmaps-guia-abre';
  let guardado = {};
  try { guardado = JSON.parse(localStorage.getItem(ABRE_KEY) || '{}') || {}; }
  catch(e){ guardado = {}; }

  function recuerda(){
    try { localStorage.setItem(ABRE_KEY, JSON.stringify(guardado)); }
    catch(e){ /* si el navegador lo bloquea, dura la sesión */ }
  }

  const pliegues = () => document.querySelectorAll('details.plegable[data-k]');

  pliegues().forEach(d => {
    const k = d.dataset.k;
    if (Object.prototype.hasOwnProperty.call(guardado, k)) d.open = !!guardado[k];
    d.addEventListener('toggle', () => { guardado[k] = d.open; recuerda(); });
  });

  function todos(abrir){
    pliegues().forEach(d => { d.open = abrir; guardado[d.dataset.k] = abrir; });
    recuerda();
  }

  const bAbrir = document.getElementById('abrirTodo');
  const bCerrar = document.getElementById('cerrarTodo');
  if (bAbrir)  bAbrir.addEventListener('click',  () => todos(true));
  if (bCerrar) bCerrar.addEventListener('click', () => todos(false));

  document.addEventListener('langchange', () => { pintaVersion(); pintaTabla(); });

  pintaVersion();
  pintaTabla();
})();
