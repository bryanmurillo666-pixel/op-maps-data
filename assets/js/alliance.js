/* ============================================================
   OP-MAPS DATA — página Mi alianza
   ------------------------------------------------------------
   Dos caras: si no estás en ninguna, crear o unirte; si ya estás,
   el código, quién más hay dentro y el botón que junta las libretas.

   Esta página no edita rivales: los lee de la libreta para subirlos y
   los mete de vuelta con RIVALES.importar, que complementa en vez de
   sustituir. Toda la mecánica está en alliance-store.js.
   ============================================================ */
(function () {

  const A  = window.ALIANZA;

  const els = {
    fuera:     document.getElementById('pFuera'),
    dentro:    document.getElementById('pDentro'),
    apodoNuevo:document.getElementById('apodoNuevo'),
    crearBtn:  document.getElementById('crearBtn'),
    unirIn:    document.getElementById('unirIn'),
    unirBtn:   document.getElementById('unirBtn'),
    fueraHint: document.getElementById('fueraHint'),
    cod:       document.getElementById('aliCod'),
    copiarBtn: document.getElementById('copiarBtn'),
    count:     document.getElementById('aliCount'),
    syncBtn:   document.getElementById('syncBtn'),
    syncHint:  document.getElementById('syncHint'),
    resumen:   document.getElementById('syncResumen'),
    miembros:  document.getElementById('aliMiembros'),
    apodoIn:   document.getElementById('apodoIn'),
    apodoBtn:  document.getElementById('apodoBtn'),
    salirBtn:  document.getElementById('salirBtn')
  };

  const t = k => window.I18N.t(k);

  function esc(s){
    return String(s).replace(/[&<>"']/g, m => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
    ));
  }

  /* "hace 4 min", "hace 2 h", "hace 3 días". Nunca una hora exacta:
     lo que importa es si está fresco, no el minuto. */
  const desde = (n, u) => t('ali.hace').replace('{n}', n).replace('{u}', t(u));

  function hace(ts){
    if (!ts) return t('ali.nunca');
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return t('ali.ahora');
    const m = Math.round(s / 60);
    if (m < 60) return desde(m, 'ali.u.min');
    const h = Math.round(m / 60);
    if (h < 24) return desde(h, 'ali.u.h');
    const d = Math.round(h / 24);
    return desde(d, d === 1 ? 'ali.u.dia' : 'ali.u.dias');
  }

  function aviso(el, texto, mal){
    if (!el) return;
    el.textContent = texto || '';
    el.classList.toggle('err', !!mal);
  }

  /* Todos los fallos posibles en un sitio, para que la página nunca
     diga solo "error". */
  function porQue(codigo){
    const k = {
      red:         'ali.err.red',
      permiso:     'ali.err.permiso',
      servidor:    'ali.err.servidor',
      noExiste:    'ali.err.noExiste',
      llena:       'ali.err.llena',
      codigoCorto: 'ali.err.codigo',
      sinNombre:   'ali.err.nombre',
      fuera:       'ali.err.fuera',
      noVale:      'ali.err.noVale'
    }[codigo];
    return t(k || 'ali.err.servidor');
  }

  function ocupado(si){
    [els.syncBtn, els.crearBtn, els.unirBtn, els.salirBtn].forEach(b => {
      if (b) b.disabled = !!si;
    });
    if (els.syncBtn) els.syncBtn.textContent = t(si ? 'ali.sync.ing' : 'ali.sync.do');
  }

  /* ---------- pintar ---------- */

  function pintaMiembros(filas){
    if (!filas.length) {
      els.miembros.innerHTML = '<p class="hint">' + esc(t('ali.sinDatos')) + '</p>';
      return;
    }
    els.miembros.innerHTML = filas.map(m => {
      const nRiv = m.n + ' ' + t(m.n === 1 ? 'ali.rival' : 'ali.rivales');
      return '<div class="ali-m' + (m.yo ? ' yo' : '') + '">' +
        '<span class="ali-m-n">' + esc(m.nombre) +
          (m.yo ? ' <i>' + esc(t('ali.tu')) + '</i>' : '') + '</span>' +
        '<span class="ali-m-r">' + esc(nRiv) + '</span>' +
        '<span class="ali-m-t">' + esc(hace(m.ts)) + '</span>' +
        (m.yo ? '<span class="ali-m-x"></span>'
              : '<button class="btn-x ali-m-x" data-quitar="' + esc(m.id) + '" ' +
                'title="' + esc(t('ali.quitar')) + '">&times;</button>') +
      '</div>';
    }).join('');
  }

  function render(){
    const e = A.estado();

    els.fuera.hidden  = e.dentro;
    els.dentro.hidden = !e.dentro;
    if (!e.dentro) return;

    els.cod.textContent = e.codigo;
    if (document.activeElement !== els.apodoIn) els.apodoIn.value = e.miNombre;

    const n = e.miembros.length || 1;
    els.count.innerHTML = '<b>' + n + '</b> / ' + A.MAX_MIEMBROS;
    els.count.classList.toggle('over', n >= A.MAX_MIEMBROS);

    pintaMiembros(e.miembros);
    if (!els.syncHint.textContent) {
      aviso(els.syncHint, e.visto ? t('ali.ultima') + ' ' + hace(e.visto) : t('ali.primera'));
    }
  }

  /* ---------- acciones ---------- */

  function crear(){
    const r = A.crear(els.apodoNuevo.value);
    if (!r.ok) { aviso(els.fueraHint, porQue(r.error), true); els.apodoNuevo.focus(); return; }
    aviso(els.fueraHint, '');
    els.resumen.innerHTML = '';
    aviso(els.syncHint, t('ali.creada'));
    render();
  }

  function unir(){
    const cod = A.normaliza(els.unirIn.value);
    aviso(els.fueraHint, t('ali.buscando'));
    ocupado(true);
    A.unir(cod, els.apodoNuevo.value).then(r => {
      ocupado(false);
      if (!r.ok) { aviso(els.fueraHint, porQue(r.error), true); return; }
      aviso(els.fueraHint, '');
      els.unirIn.value = '';
      els.resumen.innerHTML = '';
      aviso(els.syncHint, t('ali.dentroYa'));
      render();
    });
  }

  function pintaResumen(r){
    if (!r.nuevos && !r.actualizados) {
      els.resumen.innerHTML = '<p class="ali-res vacio">' + esc(t('ali.res.nada')) + '</p>';
      return;
    }
    const lineas = r.deQuien.map(d => {
      const trozos = [];
      if (d.nuevos)       trozos.push('<b>' + d.nuevos + '</b> ' + esc(t('ali.res.nuevos')));
      if (d.actualizados) trozos.push('<b>' + d.actualizados + '</b> ' + esc(t('ali.res.mejor')));
      return '<li>' + esc(d.nombre) + ': ' + trozos.join(', ') + '</li>';
    }).join('');

    els.resumen.innerHTML =
      '<div class="ali-res">' +
        '<p class="ali-res-tit">' +
          esc(t('ali.res.t')) + ' <b>' + r.antes + '</b> &rarr; <b>' + r.ahora + '</b> ' +
          esc(t(r.ahora === 1 ? 'ali.rival' : 'ali.rivales')) +
        '</p>' +
        '<ul class="ali-res-l">' + lineas + '</ul>' +
      '</div>';
  }

  function sincronizar(){
    aviso(els.syncHint, t('ali.sync.ing'));
    els.resumen.innerHTML = '';
    ocupado(true);
    A.sincronizar().then(r => {
      ocupado(false);
      if (!r.ok) { aviso(els.syncHint, porQue(r.error), true); return; }
      aviso(els.syncHint, t('ali.ultima') + ' ' + hace(Date.now()));
      pintaResumen(r);
      render();
    });
  }

  function salir(){
    if (!window.confirm(t('ali.salir.seguro'))) return;
    ocupado(true);
    A.salir().then(() => {
      ocupado(false);
      els.resumen.innerHTML = '';
      aviso(els.syncHint, '');
      aviso(els.fueraHint, t('ali.fuera.ya'));
      render();
    });
  }

  function copiar(){
    const cod = A.estado().codigo;
    const ok = () => {
      els.copiarBtn.textContent = t('ali.copiado');
      setTimeout(() => { els.copiarBtn.textContent = t('ali.copiar'); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cod).then(ok, ok);
    } else {
      // sin portapapeles (pasa al abrir el archivo suelto): se selecciona
      const s = window.getSelection(), r = document.createRange();
      r.selectNodeContents(els.cod); s.removeAllRanges(); s.addRange(r);
      ok();
    }
  }

  /* ---------- enganches ---------- */

  els.crearBtn.addEventListener('click', crear);
  els.unirBtn.addEventListener('click', unir);
  els.unirIn.addEventListener('keydown', ev => { if (ev.key === 'Enter') unir(); });
  els.apodoNuevo.addEventListener('keydown', ev => { if (ev.key === 'Enter') crear(); });

  els.syncBtn.addEventListener('click', sincronizar);
  els.copiarBtn.addEventListener('click', copiar);
  els.salirBtn.addEventListener('click', salir);

  els.apodoBtn.addEventListener('click', () => {
    if (A.apodo(els.apodoIn.value)) aviso(els.syncHint, t('ali.apodo.ok'));
    else aviso(els.syncHint, porQue('sinNombre'), true);
  });

  els.miembros.addEventListener('click', ev => {
    const b = ev.target.closest('[data-quitar]');
    if (!b) return;
    if (!window.confirm(t('ali.quitar.seguro'))) return;
    A.quitar(b.getAttribute('data-quitar')).then(r => {
      if (!r.ok) aviso(els.syncHint, porQue(r.error), true);
      render();
    });
  });

  document.addEventListener('langchange', () => { render(); });

  render();
})();
