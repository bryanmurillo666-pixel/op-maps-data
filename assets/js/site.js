/* ============================================================
   OP-MAPS DATA — cabecera y pie compartidos
   ------------------------------------------------------------
   Cada página solo necesita:
     <body data-page="pvp" data-title-key="title.pvp">
     <div id="site-header"></div>   ... contenido ...   <div id="site-footer"></div>
     <script src="assets/js/i18n.js"></script>
     <script src="assets/js/site.js"></script>

   Así el menú se toca en UN sitio y cambia en todas las páginas.
   ============================================================ */
(function () {

  // El orden aquí es el orden del menú.
  const PAGES = [
    { id:'home',  href:'index.html', key:'nav.home'  },
    { id:'data',  href:'data.html',  key:'nav.data'  },
    { id:'crew',  href:'crew.html',  key:'nav.crew'  },
    { id:'rivals',href:'rivals.html',key:'nav.rivals'},
    { id:'pve',   href:'pve.html',   key:'nav.pve'   },
    { id:'pvp',   href:'pvp.html',   key:'nav.pvp'   },
    { id:'tips',  href:'tips.html',  key:'nav.tips'  },
    { id:'guide', href:'guide.html', key:'nav.guide' }
  ];

  const current = document.body.dataset.page || '';

  /* ---------- cabecera ---------- */
  // El texto ya se pinta traducido para que no se vea la clave ni un parpadeo.
  const label = key => (window.I18N ? window.I18N.t(key) : key);

  const links = PAGES.map(p =>
    `<a href="${p.href}"${p.id === current ? ' class="on" aria-current="page"' : ''} data-i18n="${p.key}">${label(p.key)}</a>`
  ).join('');

  const header = `
    <div class="hdr-top">
      <a class="brand" href="index.html">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
          <path d="M15 9l-2 4-4 2 2-4z" fill="currentColor" stroke="none"/>
        </svg>
        <span>OP-MAPS <span class="b-dim">DATA</span></span>
      </a>
      <div class="lang-switch" role="group" aria-label="Idioma / Language">
        <button type="button" data-lang-btn="es">ES</button>
        <button type="button" data-lang-btn="en">EN</button>
      </div>
    </div>
    <div class="nav-wrap">
      <nav class="nav-strip" data-i18n-attr="aria-label:nav.aria">${links}</nav>
    </div>`;

  const headerHost = document.getElementById('site-header');
  if (headerHost) {
    headerHost.className = 'site-header';
    headerHost.innerHTML = header;
    headerHost.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.addEventListener('click', () => window.I18N.set(btn.dataset.langBtn));
    });
  }

  /* ---------- pie ---------- */
  const footerHost = document.getElementById('site-footer');
  if (footerHost) {
    footerHost.className = 'site-footer';
    footerHost.innerHTML = `
      <p class="made"><span data-i18n="foot.made">Hecho por</span> <em>ElBryan98</em></p>
      <p class="contact" data-i18n="foot.contact"></p>
      <p class="src" data-i18n="foot.src"></p>`;
  }

  // Ya está el DOM completo: traducimos lo recién inyectado.
  if (window.I18N) window.I18N.apply();
})();
