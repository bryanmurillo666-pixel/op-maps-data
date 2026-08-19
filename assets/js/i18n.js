/* ============================================================
   OP-MAPS DATA — traducción ES / EN
   ------------------------------------------------------------
   Cómo se usa en el HTML:
     <span data-i18n="clave">texto por defecto</span>      -> cambia el texto
     <p data-i18n-html="clave"></p>                        -> permite <b>, <br>…
     <input data-i18n-attr="placeholder:clave">            -> traduce un atributo
     <body data-title-key="clave">                         -> traduce el <title>

   Para añadir una página nueva basta con meter sus claves aquí abajo,
   en los dos idiomas. Si una clave falta en inglés se muestra la española.
   ============================================================ */
(function () {

  const DICT = {

    /* ---------------- ESPAÑOL ---------------- */
    es: {
      /* títulos de pestaña */
      'title.home':  'OP-MAPS DATA — Compendio del juego',
      'title.data':  'Data Crew — OP-MAPS DATA',
      'title.crew':  'Mi tripulación — OP-MAPS DATA',
      'title.pve':   'PvE — OP-MAPS DATA',
      'title.pvp':   'PvP — OP-MAPS DATA',
      'title.tips':  'Consejos — OP-MAPS DATA',
      'title.guide': 'Guía — OP-MAPS DATA',

      /* navegación */
      'nav.home':  'Inicio',
      'nav.data':  'Data Crew',
      'nav.crew':  'Mi tripulación',
      'nav.pve':   'PvE',
      'nav.pvp':   'PvP',
      'nav.tips':  'Consejos',
      'nav.guide': 'Guía',
      'nav.aria':  'Secciones del sitio',

      /* portada */
      'hero.eyebrow': 'Compendio no oficial',
      'hero.sub':     'Toda la información del juego en un solo sitio: tu tripulación, el combate PvP, el PvE, los datos de los 226 personajes y la guía completa.',
      'hero.link':    'Jugar en op-maps.com',

      'stat.chars.n':  '226',
      'stat.chars':    'Personajes',
      'stat.roles.n':  '18',
      'stat.roles':    'Roles',
      'stat.tac.n':    '3',
      'stat.tac':      'Tácticas',
      'stat.crew.n':   '11',
      'stat.crew':     'Máx. tripulantes',

      'menu.aria':     'Menú principal',
      'menu.data.t':   'Data Crew',
      'menu.data.d':   'Los 226 personajes: rol, si leen poneglifos, FUE/NAV/INT, poder, vida y precio de reclutamiento.',
      'menu.crew.t':   'Mi tripulación',
      'menu.crew.d':   'Guarda tus hasta 11 miembros y consulta al vuelo poder, velocidad, vida y qué bonus de rol tienes activos.',
      'menu.pve.t':    'PvE',
      'menu.pve.d':    'Cada isla tiene sus tres enemigos fijos: elige la tuya y te dice con qué alineación tienes más números.',
      'menu.pvp.t':    'PvP',
      'menu.pvp.d':    'Simulador 3v3: triángulo de tácticas, contraataque ×1.75 y la mejor alineación contra las guardias rivales.',
      'menu.tips.t':   'Consejos',
      'menu.tips.d':   'Lo que de verdad mueve la aguja: jugar mejor el PvP, exprimir el PvE, sobrevivir a IMU y progresar sin perder turnos.',
      'menu.guide.t':  'Guía',
      'menu.guide.d':  'La guía v4.0 al completo: temporadas, IMU, conquista, rankings, ítems y la tabla de constantes.',

      /* pie */
      'foot.made':    'Hecho por',
      'foot.contact': '¿Ves un error, algo que ajustar o algo que falte? Escríbeme por Discord: ElBryan98',
      'foot.src':     'Datos de la guía del jugador v4.0 · 226 tripulantes',

      /* páginas en construcción */
      'soon.tag':   'En construcción',
      'soon.title': 'Esta sección todavía no está montada',
      'soon.lead':  'La estructura del sitio ya está en pie. Este menú se llenará en el siguiente paso.',
      'soon.what':  'Lo que llevará',
      'soon.back':  '← Volver al inicio',

      'soon.crew.1': '<b>Tu tripulación guardada</b> en este navegador, hasta 11 miembros.',
      'soon.crew.2': '<b>Poder total</b>, velocidad, inteligencia total y vida de cada personaje.',
      'soon.crew.3': '<b>Bonus de rol activos</b> y los que te faltan: Comandante, Francotirador, Músico, Arqueólogo…',
      'soon.crew.4': '<b>Requisitos de Yonko</b> y qué te falta para cumplirlos.',

      'soon.pvp.1': 'El <b>simulador 3v3</b> que ya tienes, integrado con el diseño del sitio.',
      'soon.pvp.2': 'Triángulo de tácticas, <b>contraataque ×1.75</b> y afinidad de rol ×1.10.',
      'soon.pvp.3': 'Mejor alineación contra las 3 guardias rivales y fuerza individual de cada tripulante.',
      'soon.pvp.4': 'Daño esperado al casco y a los personajes según el marcador.',

      'soon.pve.1': 'Las <b>recompensas y penalizaciones</b> exactas de ganar o perder un desembarco.',
      'soon.pve.2': 'Probabilidad de <b>oferta de tripulante</b> y cómo aprovecharla.',
      'soon.pve.3': '<b>Tributos</b> que pagas al dueño de la isla, ganes o pierdas.',
      'soon.pve.4': 'Cuántas derrotas aguanta tu casco antes de hundirse.',

      'soon.data.1': 'Tabla con los <b>226 personajes</b> y buscador por nombre.',
      'soon.data.2': 'Filtros por <b>rol</b>, por lector de poneglifos y por rango de stats.',
      'soon.data.3': 'Orden por FUE, NAV, INT, poder, vida o <b>precio</b>.',
      'soon.data.4': 'Las 3 puntuaciones de combate de cada personaje, una por táctica.',

      'soon.tips.1': '<b>PvP</b>: tres personajes en pie antes que nada, y leer el triángulo antes que la hoja de stats.',
      'soon.tips.2': '<b>PvE</b>: es tu única fuente fiable de oro y de ofertas de tripulante.',
      'soon.tips.3': '<b>IMU</b>: no cargues poneglifos sin un Recubrimiento de Submarino a bordo.',
      'soon.tips.4': '<b>Progresión</b>: qué stat subir según lo que busques, y por qué la élite cuesta el cuádruple.',

      'soon.guide.1': 'La <b>guía v4.0</b> completa y navegable por secciones.',
      'soon.guide.2': 'PvP, PvE, IMU, conquista de islas, rankings y títulos.',
      'soon.guide.3': 'Ítems, tienda, suministros y recetas de los roles de apoyo.',
      'soon.guide.4': 'La <b>tabla de constantes</b> para consultar cualquier número al instante.',

      /* ---- página Data ---- */
      'data.lead':    'Los 226 personajes del juego con todo lo que sale de sus stats: poder, vida, precio y lo que puntúan en cada táctica. Toca uno para abrir su ficha.',
      'data.search':  'Buscar por nombre…',
      'data.roleAll': 'Todos los roles',
      'data.sortBy':  'Ordenar por',
      'data.readers': 'Solo lectores',
      'data.shown':   'de 226 mostrados',
      'data.more':      'Mostrar más',
      'data.remaining': 'restantes',
      'data.view.list':  'Lista',
      'data.view.album': 'Álbum',
      'data.viewAria':   'Forma de ver los personajes',
      'album.page':      'Página',
      'album.of':        'de',
      'album.prev':      'Página anterior',
      'album.next':      'Página siguiente',
      'album.index':     'Capítulos del álbum',
      'data.empty':   'Ningún personaje coincide con lo que buscas.',
      'data.reader':  'Lector',
      'data.reader.role':   'Lee por su rol de Arqueólogo',
      'data.reader.kozuki': 'Lee por sangre Kozuki, conservando su rol de combate',

      'sort.album':     'Numérico (1-226)',
      'sort.name':      'Alfabético (A-Z)',
      'sort.assault':   'Puntuación en Asalto',
      'sort.manoeuvre': 'Puntuación en Maniobra',
      'sort.ambush':    'Puntuación en Emboscada',

      /* abreviatura de cada stat, la que se ve en las barras */
      'st.f': 'FUE',
      'st.v': 'NAV',
      'st.i': 'INT',

      /* las tres tácticas, con el nombre que usa el juego en español */
      'tac.Assault':   'Asalto',
      'tac.Manoeuvre': 'Maniobra',
      'tac.Ambush':    'Emboscada',

      /* abreviaturas, para cuando las tres van juntas en una fila */
      'ta.Assault':   'ASA',
      'ta.Manoeuvre': 'MAN',
      'ta.Ambush':    'EMB',

      /* los 18 roles, con el nombre que usa el juego en español */
      'rn.Captain':        'Capitán',
      'rn.Commander':      'Comandante',
      'rn.Swordsman':      'Espadachín',
      'rn.Sniper':         'Francotirador',
      'rn.Helmsman':       'Timonel',
      'rn.Navigator':      'Navegante',
      'rn.Archaeologist':  'Arqueólogo',
      'rn.Doctor':         'Médico',
      'rn.Shipwright':     'Carpintero',
      'rn.Cook':           'Cocinero',
      'rn.Musician':       'Músico',
      'rn.Scientist':      'Científico',
      'rn.Monarch':        'Monarca',
      'rn.Elder':          'Anciano',
      'rn.Tamer':          'Domador',
      'rn.Sovereign':      'Soberano',
      'rn.Chief of Staff': 'Jefe de Estado Mayor',
      'rn.Ancient Weapon': 'Arma Ancestral',

      'lbl.power':   'Poder',
      'lbl.health':  'Vida máxima',
      'lbl.price':   'Precio',
      'lbl.total':   'Stats totales',
      'lbl.speed':   'Aporta de velocidad',
      'lbl.search':  'Aporta a buscar RP',
      'lbl.scores':  'Puntuación por táctica',
      'lbl.best':    'mejor',
      'lbl.role':    'Rol',
      'lbl.gold':    'oro',
      'lbl.chapter': 'Capítulo',
      'lbl.flavour': 'Rol sin efecto mecánico: a este personaje se le juzga solo por sus stats.',
      'lbl.roleNote':'Todo bonus de rol deja de contar si el personaje cae a 0 de vida.',
      'lbl.tacNote': 'Asalto puntúa con FUE, Emboscada con INT y Maniobra con NAV. Las otras dos stats suman ×15, o ×45 en Maniobra.',

      'role.Captain':       'Hace falta al menos uno a bordo para empezar la conquista de una isla.',
      'role.Commander':     'Da +1 ataque PvP por turno: 2 en vez de 1.',
      'role.Musician':      'Reduce a la mitad todo el aturdimiento y suma +10 % al poder total.',
      'role.Sniper':        'Sube el alcance de ataque de 60 a 90, y puntúa ×1.10 jugando Emboscada.',
      'role.Helmsman':      'Da +8 de velocidad, y puntúa ×1.10 jugando Maniobra.',
      'role.Navigator':     'Deja ver las siguientes islas; con un Timonel a bordo, además elegirlas.',
      'role.Archaeologist': 'Imprescindible para buscar poneglifos y para ver los que tienen los rivales.',
      'role.Doctor':        'Fabrica Medicina y hace que reviva con 70 de vida en vez de 45.',
      'role.Cook':          'Cocina raciones y carne, y hace que la comida cure un 50 % más.',
      'role.Shipwright':    'Fabrica kits de reparación y hace que reparen un 50 % más.',
      'role.Swordsman':     'Puntúa ×1.10 jugando Asalto.',

      /* ---- página Mi tripulación ---- */
      'crew.lead':     'Monta tu tripulación y mira al momento lo que da de sí: poder, velocidad, qué bonus de rol tienes activos y cuánto tardarías en conquistar una isla. Se guarda en este navegador, solo para ti.',
      'crew.add':      'Añade un tripulante por su nombre…',
      'crew.addBtn':   'Añadir',
      'crew.empty':    'Todavía no has puesto a nadie. Escribe un nombre arriba y ve completando hasta 11.',
      'crew.notFound': 'Ese nombre no está en la lista de los 226.',
      'crew.dupe':     'Ese ya está a bordo.',
      'crew.full':     'Ya llevas uno de más; quita a alguien antes de meter a otro.',
      'crew.over':      'Llevas uno de más: una tripulación solo admite 11.',
      'crew.rec':       'Cambiaría a',
      'crew.tag':       'Reemplazable',
      'crew.why.dup':   'su rol ya lo cubre otro tripulante',
      'crew.why.flavour':'su rol no da ningún bonus, solo cuentan sus stats',
      'crew.why.affinity':'su rol solo suma si pelea, y no entra en ninguna guardia',
      'crew.why.weak':  'es el que menos aporta de los que sobran',
      'crew.how':   'Cómo lo decide, por orden',
      'crew.rule1': 'No toca al <b>único lector</b> ni al <b>único Capitán</b>: sin ellos no puedes buscar poneglifos ni empezar una conquista.',
      'crew.rule2': 'Tampoco al que <b>lleva la Navegación</b>, que es la que da velocidad y la única respuesta a Emboscada.',
      'crew.rule3': 'Ni a los <b>3 mejores de cada táctica</b>: son 3 guardias de 3, y quien entra en varias listas cubre un hueco en cada una, hasta en las tres.',
      'crew.rule4': 'De los que quedan, sobra antes <b>quien no aporta bonus de rol</b>: rol repetido o rol sin efecto.',
      'crew.rule5': 'Y entre esos se va <b>el que menos velocidad aporta</b>; si empatan, el de menos inteligencia y menos poder.',
      'crew.remove':   'Quitar de la tripulación',
      'crew.members':  'Tripulantes',
      'crew.sortBy':      'Ordenar por',

      'sum.title':       'Lo que da tu tripulación',
      'sum.power':       'Poder total',
      'sum.speed':       'Velocidad',
      'sum.int':         'Inteligencia total',
      'sum.rp':          'Encontrar poneglifo',
      'sum.attacks':     'Ataques PvP por turno',
      'sum.range':       'Alcance de ataque',
      'sum.supplies':    'Suministros por turno',
      'sum.conquest':    'Conquistar isla neutral',
      'sum.conquestDef': 'Conquistar isla defendida',
      'sum.health':      'Vida de los tripulantes',
      'sum.price':       'Cuesta reclutarlos',
      'sum.musician':    'Incluye el +10 % del Músico.',
      'sum.speedCap':    'Tope de velocidad: 60.',
      'sum.noReader':    'Sin un Arqueólogo o un Kozuki a bordo no puedes ni empezar a buscar.',

      'roles.title':  'Bonus de rol',
      'roles.none':   'Nadie',
      'roles.combo':  'Timonel + Navegante',
      'roles.comboD': 'Con los dos puedes elegir a qué isla navegas, en vez de ir al azar.',

      'u.min':  'min',
      'u.gold': 'oro',
      'u.hp':   'de vida',
      'u.turn': 'por turno',

      /* ---- página PvE ---- */
      'pve.lead': 'El PvE es el combate contra el mundo, y salta solo al llegar a la isla hacia la que ibas. Cada isla tiene sus <b>tres enemigos fijos y en un orden fijo</b>: lo único que cambia de una visita a otra es la táctica que juega cada uno, al azar. Elige tu isla y te digo con qué alineación tienes más números.',

      'pve.isla.t':       'Combate al desembarcar',
      'pve.isla.pick':    'Elige la isla',
      'pve.isla.sea':     'Mar',
      'pve.isla.allSeas': 'Todos los mares',
      'pve.isla.none':    '— elige una isla —',
      'pve.isla.base':    'Esta isla no tiene combate: se desembarca sin pelear.',
      'pve.isla.enemies': 'Sus tres, en su orden',
      'pve.isla.prob':    'Probabilidad de ganar aquí',
      'pve.isla.line':    'Tu mejor alineación',
      'pve.isla.beats':   'le ganas a',
      'pve.isla.of3':     'de sus 3 tácticas',
      'pve.isla.noCrew':  'Monta tu tripulación en Mi tripulación y aquí saldrá la alineación que más gana.',
      'pve.sim.btn':      'Simular desembarco',
      'pve.sim.win':      'Ganas el combate',
      'pve.sim.lose':     'Pierdes el combate',
      'pve.sim.offer':    'Oferta de tripulante',
      'pve.sim.noOffer':  'Esta vez no salió oferta',
      'pve.sim.health':   'de vida en total',
      'pve.sim.musician': 'Músico: aturdimiento a la mitad',
      'pve.sim.offerNote':'Se sortea la táctica de cada enemigo y se resuelven los tres duelos. Si ganas, se tira la oferta: un 80 %, y si sale, el juego mira 5 personajes y ofrece uno que no tengas. Aquí se sortea sobre los 226, porque no se sabe qué personajes puede ofrecer cada isla.',
      'pve.isla.dmg':     'de vida de media',
      'pve.isla.dmgNote': 'Confirmado por la guía v5.0: cada uno se deja el <b>34 % de su vida máxima</b> si pierde su duelo y el <b>8 %</b> si lo gana, y quien contrarrestó la táctica rival paga solo el <b>60 %</b> de lo que le tocase. Ganar también desgasta, así que descansar es parte de navegar y no algo de después de una derrota.',
      'pve.isla.few':     'Hacen falta al menos 3 tripulantes.',
      'pve.isla.how':     'Los enemigos de cada isla son fijos y salen siempre en el mismo orden: el primero pelea contra tu posición 1, el segundo contra la 2 y el tercero contra la 3. Lo único que cambia es <b>la táctica que juega cada uno, al azar</b>, así que la probabilidad se calcula exacta: para cada posición se mira a cuántas de sus tres tácticas le ganas, y de ahí sale la de llevarte 2 de los 3 duelos.',
      'pve.isla.guide50': 'La guía <b>v5.0</b> ya recoge el 3 contra 3, así que aquí no queda contradicción que avisar. Del sistema viejo solo sobrevive un caso: una isla <b>sin defensores</b> mantiene la tirada plana del <b>50 %</b>, y lo mismo pasa si tu tripulación no tiene ni un personaje.',

      'pve.fixed':      'Las reglas del desembarco',
      'pve.col.lose':   'Se pierde',
      'pve.col.mid':    'Neutral',
      'pve.col.win':    'Se gana',
      'pve.k.gold':     'Oro',
      'pve.k.victory':  'Victoria de combate',
      'pve.k.offer':    'Oferta de tripulante',
      'pve.k.hull':     'Daño al casco',
      'pve.k.char':     'Vida por duelo perdido',
      'pve.k.charWin':  'Vida por duelo ganado',
      'pve.k.counter':  'Daño si contrarrestas',
      'pve.k.goldLoss': 'Oro',
      'pve.k.stun':     'Aturdimiento',

      'pve.win.t': 'Si ganas',
      'pve.win.1': '<b>5000 de oro</b> y una victoria de combate más. Si la isla es de otra tripulación y tiene el mantenimiento al día, <b>1000</b> de esos 5000 (el 20 %) se van para ellos como tributo.',
      'pve.win.2': '<b>80 % de que aparezca una oferta</b> de tripulante. Se tira <b>solo si has ganado</b>, así que ya no es un 40 % fijo sobre el total: cuanto más ganes, más gente se te acerca.',
      'pve.win.3': 'Una oferta nueva <b>sustituye a la que no hayas contestado</b>, así que conviene decidir antes del siguiente desembarco.',
      'pve.win.4': 'No hay oferta si la isla no tiene a nadie que ofrecer o si ya los tienes a todos a bordo. Tu bitácora lo apunta igual.',
      'pve.win.5': 'En las zonas especiales del mapa, ganar es lo que abre la búsqueda de poneglifos o el final del juego.',
      'pve.win.6': 'Ganar <b>también desgasta</b>: cada uno de los tuyos se deja el <b>8 %</b> de su vida por el duelo que gana. Una racha de desembarcos ganados cansa igual, y por eso descansar es parte de navegar.',

      'pve.lose.t': 'Si pierdes y aguantas',
      'pve.lose.1': 'El casco se lleva <b>525 de daño</b>.',
      'pve.lose.2': 'Cada uno paga <b>según su propio duelo</b>: el <b>34 %</b> de su vida máxima si lo pierde y el <b>8 %</b> si lo gana. Quien contrarrestó la táctica rival paga solo el <b>60 %</b> de lo que le tocase, y un puesto vacío no le cuesta vida a nadie.',
      'pve.lose.3': 'Pierdes <b>500 de oro</b>, o todo lo que tengas si es menos.',
      'pve.lose.4': 'Te quedas <b>aturdido 90 minutos</b>, o <b>45</b> si tienes un <b>Músico</b> en pie al terminar el combate. Uno al que hayan tumbado en ese mismo desembarco no recorta nada.',
      'pve.lose.5': 'El <b>Kit de Reparación de Emergencia</b> salta si el casco baja al 30 % o menos.',

      'pve.sink.t': 'Si pierdes y te hundes',
      'pve.sink.1': 'Pierdes el <b>20 % de tu oro</b>, y aquí no lo cobra nadie: se quema. En eso el PvE es distinto del PvP.',
      'pve.sink.2': 'Si la isla tenía dueño al día, le pagas igual su <b>10 %</b> de lo que te quede.',
      'pve.sink.3': 'Pierdes <b>un poneglifo al azar</b> si llevabas alguno.',
      'pve.sink.4': 'Vuelves al punto de partida.',
      'pve.sink.5': 'El casco vuelve lleno y <b>todos vuelven con la vida al máximo</b>, incluidos los que estaban tumbados.',
      'pve.sink.6': 'Sumas <b>un intento</b> y tu recompensa por tu cabeza baja a 0.',
      'pve.sink.7': 'Aturdimiento de <b>90 min + 45 por cada poneglifo</b> que llevaras, a la mitad con un Músico en pie.',

      'pve.down.t': 'Si llegas sin nadie en pie',
      'pve.down.1': 'Desde la <b>v0.37.0</b>, desembarcar con toda la tripulación tumbada es <b>una derrota directa, sin tirada</b>. Ya no se aplaza para un turno posterior ni te ponen a descansar por su cuenta: cuándo parar lo decides tú. Para eso está <b>Descansar al llegar</b>, que se arma desde el barco mientras navegas y hace que la tripulación empiece a descansar en cuanto atraque. Es de un solo uso: se gasta al activarse.',

      'pve.tips.t': 'Cómo sacarle más',
      'pve.tips.1': 'Es tu <b>única fuente fiable de oro</b>, y ahora sí puedes mejorar tus números: eliges quién desembarca y con qué táctica, así que mira la isla antes de zarpar.',
      'pve.tips.2': 'Es también de donde salen los <b>tripulantes nuevos</b>. Contesta la oferta que tengas antes del siguiente desembarco o la perderás.',
      'pve.tips.3': 'Ten el <b>casco reparado</b>: tres derrotas seguidas te hunden por muy fuerte que seas.',
      'pve.tips.4': 'Descansa antes de meterte en zona peligrosa: los tres que pierden un PvE son los mismos que mandarías a un PvP.',

      /* ---- página PvP ---- */
      'pvp.lead': 'El PvP son tres contra tres, posición contra posición: tu primero solo pelea con su primero. El poder total no decide nada. Tú eliges quién va, en qué orden y con qué táctica, pero no ves qué guardia te responde: el servidor la elige en secreto, así que atacas a ciegas.',

      'pvp.tri.t':   'El triángulo de tácticas',
      'pvp.tri.d':   'Cada táctica puntúa con una stat distinta y se vencen en círculo. Contrarrestar multiplica tu puntuación por <b>×1.75</b>, y el bonus es simétrico: el defensor lo tiene igual cuando su táctica contrarresta la tuya. Dos tácticas iguales no dan ventaja a nadie.',
      'pvp.tri.cap': 'Emboscada vence a Asalto · Asalto vence a Maniobra · Maniobra vence a Emboscada',

      'pvp.score.t': 'Cómo se puntúa un duelo',
      'pvp.score.1': 'La stat de la táctica cuenta <b>×100</b> y las otras dos <b>×15</b>. En Maniobra las otras dos cuentan <b>×45</b>, porque la Navegación es rarísima y sin ese ajuste la táctica era injugable.',
      'pvp.score.2': '<b>×1.75</b> si tu táctica contrarresta la suya.',
      'pvp.score.3': '<b>×1.10</b> si el rol del luchador casa con su táctica: Espadachín con Asalto, Francotirador con Emboscada, Timonel con Maniobra. Es del luchador, no de la tripulación: un Espadachín en la reserva no mejora el Asalto de nadie.',
      'pvp.score.4': 'Gana quien saque más puntuación, y <b>el empate se lo lleva el defensor</b>. Quien gane más duelos de los tres gana el combate, y un 1-1 con una posición vacía también cae del lado del defensor.',

      'pvp.sim.t':        'Simulador 3 vs 3',
      'pvp.sim.crew':     'Tu tripulación sale de Mi tripulación',
      'pvp.sim.empty':    'Primero monta tu tripulación en Mi tripulación: el simulador tira de ella.',
      'pvp.sim.few':      'Hacen falta al menos 3 tripulantes para formar una alineación.',
      'pvp.sim.rivals':   'Los 3 del rival',
      'pvp.sim.rivalPh':  'Nombre del rival…',
      'pvp.sim.add':      'Añadir',
      'pvp.sim.calc':     'Calcular',
      'pvp.sim.need':     'Pon a los 3 rivales para calcular el combate.',
      'pvp.sim.notFound': 'Ese nombre no está entre los 226.',
      'pvp.sim.dupe':     'Ese ya está en la lista.',
      'pvp.sim.prob':     'Probabilidad de ganar el combate',
      'pvp.sim.line':     'Alineación recomendada',
      'pvp.sim.min':      'mín',
      'pvp.sim.minNote':  'El <b>mínimo</b> es la puntuación más baja que puede tener quien ocupe esa posición sin que baje la probabilidad. Cualquiera por encima de ese número rinde igual.',
      'pvp.sim.indiv':    'Fuerza individual',
      'pvp.sim.indivNote':'Cada uno de los tuyos, por separado, contra cada rival y cada táctica rival. Sirve para ver quién es fuerte, aunque el combate lo decide la probabilidad de arriba.',
      'pvp.sim.how':      'Conoces a los tres rivales pero no su orden ni su táctica, así que se prueban <b>sus 6 órdenes × sus 27 repartos de táctica = 162 escenarios</b>. Para cada alineación tuya se cuenta en cuántos ganas 2 de 3 duelos, y se prueban todos tus tríos con sus 27 repartos de táctica.',

      'pvp.riv.t':        'Rivales',
      'pvp.riv.d':        'Apunta aquí las guardias que le vayas viendo a cada rival. Sus guardias <b>se pueden averiguar</b> —los informes de combate se comparten y eso es scouting legítimo—, pero <b>cuál te saldrá, no</b>: el servidor elige una al azar entre las que tenga, y no descarta la que acaba de salir. Cuantas más apuntes, más fino sale el plan. Escribe <b>-</b> en un puesto que el rival tenga vacío.',
      'pvp.riv.ph':       'Nombre de la tripulación rival',
      'pvp.riv.add':      'Añadir rival',
      'pvp.riv.none':     'Todavía no has apuntado ningún rival.',
      'pvp.riv.bad':      'Ponle un nombre, y que no lo tenga ya otro rival.',
      'pvp.riv.notFound': 'Ese personaje no está en la base. Escribe - si el puesto va vacío.',
      'pvp.riv.name':     'Nombre del rival',
      'pvp.riv.del':      'Borrar',
      'pvp.riv.guard':    'Guardia',
      'pvp.riv.gDel':     'Quitar',
      'pvp.riv.full':     'Ya tiene las 3 guardias que reparte el juego.',
      'pvp.riv.slot':     'Quién',
      'pvp.riv.tac':      'Táctica',

      'pvp.plan.t':      'Tu plan de ataque',
      'pvp.plan.pick':   'Contra quién',
      'pvp.plan.pick2':  'Elige un rival y te digo con qué plan tienes más números.',
      'pvp.plan.none':   '— elige un rival —',
      'pvp.plan.rate':   'Tasa de éxito',
      'pvp.plan.of':     'Guardias que le ganas:',
      'pvp.plan.line':   'Tu mejor plan',
      'pvp.plan.holes':  'Puestos sin apuntar, que aquí cuentan como perdidos:',
      'pvp.plan.holesT': 'Faltan datos',
      'pvp.plan.sim':    'Simular el abordaje',
      'pvp.plan.rolled': 'Te ha salido la',
      'pvp.plan.win':    'Ganas el abordaje',
      'pvp.plan.lose':   'Pierdes el abordaje',
      'pvp.plan.hull':   'Tu casco',
      'pvp.plan.how':    'Se prueban todos los planes posibles —los tuyos, en cada orden y con cada táctica— contra <b>todas</b> las guardias que hayas apuntado, y gana el que más guardias se lleva. Como la que te sale es un sorteo limpio, la tasa es exacta: guardias ganadas entre guardias que tiene. A igualdad se prefiere el plan que gana más duelos sueltos, porque cada duelo perdido cuesta el 34 % de la vida de ese tripulante.',

      'pvp.dmg.t': 'Lo que cuesta cada duelo',
      'pvp.dmg.1': 'Quien <b>pierde</b> el duelo se deja el <b>34 %</b> de su vida máxima.',
      'pvp.dmg.2': 'Quien lo <b>gana</b> se deja el <b>8 %</b>: ganar tampoco sale gratis.',
      'pvp.dmg.3': 'Jugar la táctica que contrarresta reduce lo que recibes al <b>60 %</b>, <b>aunque pierdas el duelo</b>. Leer bien nunca se desperdicia.',
      'pvp.dmg.4': 'Con el 34 %, uno sano aguanta dos derrotas y cae a la tercera. Una posición sin pelea no da ni recibe nada.',

      'pvp.hull.t':    'Daño al casco según el marcador',
      'pvp.hull.head': 'Marcador',
      'pvp.hull.lose': 'Casco del perdedor',
      'pvp.hull.win':  'Casco del ganador',
      'pvp.hull.wide': '2-1 amplio',
      'pvp.hull.tight':'2-1 ajustado',
      'pvp.hull.note': 'Un 2-1 es <b>amplio</b> cuando las tres puntuaciones del ganador suman al menos <b>1,25×</b> las del perdedor. Cada posición vacía suma otro <b>10 %</b> al casco de quien la dejó sin cubrir. El casco del ganador se puede desgastar pero nunca se destruye: en un combate solo puede hundirse un barco, y nunca el suyo.',

      'pvp.cost.t': 'Lo que cuesta perder el combate',
      'pvp.cost.1': 'Pierdes el <b>10 % de tu oro</b> y se lo lleva el ganador. Si te hunde, el <b>20 %</b>, más un poneglifo al azar y tu recompensa por tu cabeza entera.',
      'pvp.cost.2': '<b>90 minutos de aturdimiento</b>, a la mitad con un Músico en pie al acabar el combate.',
      'pvp.cost.3': 'Si te hunden: <b>+45 min por cada poneglifo</b> que llevaras, vuelves al inicio y sumas un intento.',
      'pvp.cost.4': 'Pierdes la protección de novato que te quedara, y tu <b>Kit de Reparación de Emergencia</b> salta si el casco queda en 450 o menos.',
      'pvp.cost.5': 'Al hundirte, el casco vuelve lleno y <b>todos vuelven con la vida al máximo</b>: hundirse es la curación completa más rápida del juego, y por eso el resto del castigo es tan duro.',

      'pvp.guard.t': 'Tus guardias',
      'pvp.guard.1': 'Una guardia es una alineación entera: tres posiciones con su personaje y su táctica. Se rellenan de delante hacia atrás.',
      'pvp.guard.2': 'Cuántas configuras depende de tu tamaño: con <b>1 personaje</b>, tres guardias y una táctica distinta en cada una; con <b>2</b>, dos guardias intercambiando posiciones; con <b>3 o más</b>, tres guardias, y quien repita tiene que cambiar de posición.',
      'pvp.guard.3': 'Hasta <b>2 reservas</b>. Una reserva entra por un defensor que falte o esté a 0, y pelea con la táctica de su hueco de reserva, no con la del caído. Quien esté a 1 de vida mantiene su puesto.',
      'pvp.guard.4': 'Desde la <b>v0.39.0</b> los cambios en tus guardias <b>se aplican al momento</b>. Antes había que esperar al turno siguiente.',
      'pvp.guard.5': 'Desde la <b>v0.41.3</b> los caídos salen marcados con una etiqueta en el plan, y <b>una reserva tumbada no sustituye a nadie</b>.',
      'pvp.guard.6': 'El rival puede saber <b>qué guardias tienes</b> —los informes de combate se comparten y eso es espionaje legítimo—, pero nunca <b>cuál va a responder</b>: la elige en secreto la temporada, y puede repetirse. No hay regla contra repetir, porque tenerla filtraría información.',

      'pvp.when.t': 'Cuándo puedes atacar',
      'pvp.when.1': '<b>1 ataque por turno</b>, o <b>2 con un Comandante</b> en pie.',
      'pvp.when.2': 'A <b>60 unidades</b> de distancia, o <b>90 con un Francotirador</b>.',
      'pvp.when.3': 'Ninguna de las dos tripulaciones puede estar aturdida, y la otra no puede tener la protección de novato.',
      'pvp.when.4': 'Te hace falta al menos un personaje en pie, y atacar te quita a ti la protección de novato.',
      'pvp.when.5': 'Un barco sumergido solo puede pelear contra otro sumergido, en los dos sentidos.'
    },

    /* ---------------- INGLÉS ---------------- */
    en: {
      'title.home':  'OP-MAPS DATA — Game compendium',
      'title.data':  'Data Crew — OP-MAPS DATA',
      'title.crew':  'My crew — OP-MAPS DATA',
      'title.pve':   'PvE — OP-MAPS DATA',
      'title.pvp':   'PvP — OP-MAPS DATA',
      'title.tips':  'Tips — OP-MAPS DATA',
      'title.guide': 'Guide — OP-MAPS DATA',

      'nav.home':  'Home',
      'nav.data':  'Data Crew',
      'nav.crew':  'My crew',
      'nav.pve':   'PvE',
      'nav.pvp':   'PvP',
      'nav.tips':  'Tips',
      'nav.guide': 'Guide',
      'nav.aria':  'Site sections',

      'hero.eyebrow': 'Unofficial compendium',
      'hero.sub':     'Everything about the game in one place: your crew, PvP combat, PvE, the data of all 226 characters and the full player guide.',
      'hero.link':    'Play at op-maps.com',

      'stat.chars.n':  '226',
      'stat.chars':    'Characters',
      'stat.roles.n':  '18',
      'stat.roles':    'Roles',
      'stat.tac.n':    '3',
      'stat.tac':      'Tactics',
      'stat.crew.n':   '11',
      'stat.crew':     'Max crew size',

      'menu.aria':     'Main menu',
      'menu.data.t':   'Data Crew',
      'menu.data.d':   'All 226 characters: role, poneglyph readers, STR/NAV/INT, power, health and recruit price.',
      'menu.crew.t':   'My crew',
      'menu.crew.d':   'Save your up-to-11 members and check power, speed, health and which role perks you have running.',
      'menu.pve.t':    'PvE',
      'menu.pve.d':    'Every island has its three fixed enemies: pick yours and it tells you which line-up gives you the best odds.',
      'menu.pvp.t':    'PvP',
      'menu.pvp.d':    '3v3 simulator: the tactic triangle, the ×1.75 counter and the best line-up against enemy guards.',
      'menu.tips.t':   'Tips',
      'menu.tips.d':   'What actually moves the needle: playing PvP better, milking PvE, surviving IMU and progressing without wasting turns.',
      'menu.guide.t':  'Guide',
      'menu.guide.d':  'The full v4.0 guide: seasons, IMU, conquest, rankings, items and the constants table.',

      'foot.made':    'Made by',
      'foot.contact': 'Found an error, an adjustment or something missing? Contact me on Discord: ElBryan98',
      'foot.src':     'Data from player guide v4.0 · 226 crew members',

      'soon.tag':   'Under construction',
      'soon.title': 'This section is not built yet',
      'soon.lead':  'The site structure is up. This menu gets filled in the next step.',
      'soon.what':  'What it will hold',
      'soon.back':  '← Back to home',

      'soon.crew.1': '<b>Your saved crew</b>, kept in this browser, up to 11 members.',
      'soon.crew.2': '<b>Total power</b>, speed, total intelligence and each character\'s health.',
      'soon.crew.3': '<b>Active role perks</b> and the ones you are missing: Commander, Sniper, Musician, Archaeologist…',
      'soon.crew.4': '<b>Yonko requirements</b> and how far you are from meeting them.',

      'soon.pvp.1': 'The <b>3v3 simulator</b> you already have, wearing the site design.',
      'soon.pvp.2': 'The tactic triangle, the <b>×1.75 counter</b> and the ×1.10 role affinity.',
      'soon.pvp.3': 'Best line-up against the 3 enemy guards, plus each member\'s individual strength.',
      'soon.pvp.4': 'Expected hull and character damage by scoreline.',

      'soon.pve.1': 'The exact <b>rewards and penalties</b> for winning or losing a landing.',
      'soon.pve.2': '<b>Crew offer</b> chance and how to make the most of it.',
      'soon.pve.3': '<b>Tribute</b> you pay the island owner, win or lose.',
      'soon.pve.4': 'How many defeats your hull takes before it goes down.',

      'soon.data.1': 'A table with all <b>226 characters</b> and a name search.',
      'soon.data.2': 'Filters by <b>role</b>, by poneglyph reader and by stat range.',
      'soon.data.3': 'Sorting by STR, NAV, INT, power, health or <b>price</b>.',
      'soon.data.4': 'The three combat scores of every character, one per tactic.',

      'soon.tips.1': '<b>PvP</b>: three standing characters before anything else, and read the triangle before the stat sheet.',
      'soon.tips.2': '<b>PvE</b>: it is your only reliable source of gold and of crew offers.',
      'soon.tips.3': '<b>IMU</b>: never carry poneglyphs without a Submarine Coating aboard.',
      'soon.tips.4': '<b>Progression</b>: which stat to raise for what, and why an elite roster costs four times as much.',

      'soon.guide.1': 'The complete <b>v4.0 guide</b>, browsable by section.',
      'soon.guide.2': 'PvP, PvE, IMU, island conquest, rankings and titles.',
      'soon.guide.3': 'Items, shop, supplies and the support roles\' recipes.',
      'soon.guide.4': 'The <b>constants table</b>, to look up any number at a glance.',

      /* ---- Data page ---- */
      'data.lead':    'All 226 characters with everything their stats produce: power, health, price and what they score on each tactic. Tap one to open its card.',
      'data.search':  'Search by name…',
      'data.roleAll': 'All roles',
      'data.sortBy':  'Sort by',
      'data.readers': 'Readers only',
      'data.shown':   'of 226 shown',
      'data.more':      'Show more',
      'data.remaining': 'remaining',
      'data.view.list':  'List',
      'data.view.album': 'Album',
      'data.viewAria':   'How to show the characters',
      'album.page':      'Page',
      'album.of':        'of',
      'album.prev':      'Previous page',
      'album.next':      'Next page',
      'album.index':     'Album chapters',
      'data.empty':   'No character matches your search.',
      'data.reader':  'Reader',
      'data.reader.role':   'Reads through the Archaeologist role',
      'data.reader.kozuki': 'Reads by Kozuki blood, keeping a combat role',

      'sort.album':     'Numeric (1-226)',
      'sort.name':      'Alphabetical (A-Z)',
      'sort.assault':   'Assault score',
      'sort.manoeuvre': 'Manoeuvre score',
      'sort.ambush':    'Ambush score',

      /* short label of each stat, the one shown on the bars */
      'st.f': 'STR',
      'st.v': 'NAV',
      'st.i': 'INT',

      /* the three tactics */
      'tac.Assault':   'Assault',
      'tac.Manoeuvre': 'Manoeuvre',
      'tac.Ambush':    'Ambush',

      /* short labels, for when the three sit together in one row */
      'ta.Assault':   'ASL',
      'ta.Manoeuvre': 'MAN',
      'ta.Ambush':    'AMB',

      /* the 18 roles, named as the player guide names them */
      'rn.Captain':        'Captain',
      'rn.Commander':      'Commander',
      'rn.Swordsman':      'Swordsman',
      'rn.Sniper':         'Sniper',
      'rn.Helmsman':       'Helmsman',
      'rn.Navigator':      'Navigator',
      'rn.Archaeologist':  'Archaeologist',
      'rn.Doctor':         'Doctor',
      'rn.Shipwright':     'Shipwright',
      'rn.Cook':           'Cook',
      'rn.Musician':       'Musician',
      'rn.Scientist':      'Scientist',
      'rn.Monarch':        'Monarch',
      'rn.Elder':          'Elder',
      'rn.Tamer':          'Tamer',
      'rn.Sovereign':      'Sovereign',
      'rn.Chief of Staff': 'Chief of Staff',
      'rn.Ancient Weapon': 'Ancient Weapon',

      'lbl.power':   'Power',
      'lbl.health':  'Max health',
      'lbl.price':   'Price',
      'lbl.total':   'Total stats',
      'lbl.speed':   'Speed it adds',
      'lbl.search':  'RP search it adds',
      'lbl.scores':  'Score per tactic',
      'lbl.best':    'best',
      'lbl.role':    'Role',
      'lbl.gold':    'gold',
      'lbl.chapter': 'Chapter',
      'lbl.flavour': 'A role with no mechanical effect: this character is judged purely on their stats.',
      'lbl.roleNote':'Every role perk switches off if the character drops to 0 health.',
      'lbl.tacNote': 'Assault scores on STR, Ambush on INT and Manoeuvre on NAV. The other two stats count ×15, or ×45 on Manoeuvre.',

      'role.Captain':       'You need at least one aboard to start an island conquest.',
      'role.Commander':     'Gives +1 PvP attack per turn: 2 instead of 1.',
      'role.Musician':      'Halves all stun and adds +10 % to your total power.',
      'role.Sniper':        'Raises attack range from 60 to 90, and scores ×1.10 playing Ambush.',
      'role.Helmsman':      'Gives +8 speed, and scores ×1.10 playing Manoeuvre.',
      'role.Navigator':     'Lets you see the next islands; with a Helmsman aboard, choose them too.',
      'role.Archaeologist': 'Required to search for poneglyphs and to see the ones rivals hold.',
      'role.Doctor':        'Crafts Medicine and makes it revive on 70 health instead of 45.',
      'role.Cook':          'Cooks rations and meat, and makes food restore 50 % more.',
      'role.Shipwright':    'Builds repair kits, and makes every kit repair 50 % more.',
      'role.Swordsman':     'Scores ×1.10 playing Assault.',

      /* ---- My crew page ---- */
      'crew.lead':     'Build your crew and see straight away what it is worth: power, speed, which role perks you have running and how long an island would take you. It is kept in this browser, just for you.',
      'crew.add':      'Add a crew member by name…',
      'crew.addBtn':   'Add',
      'crew.empty':    'Nobody aboard yet. Type a name above and fill up to 11.',
      'crew.notFound': 'That name is not among the 226.',
      'crew.dupe':     'That one is already aboard.',
      'crew.full':     'You are already one over; drop somebody before adding another.',
      'crew.over':      'You are one over: a crew only holds 11.',
      'crew.rec':       'I would swap out',
      'crew.tag':       'Replaceable',
      'crew.why.dup':   'their role is already covered by somebody else',
      'crew.why.flavour':'their role gives no perk, only their stats count',
      'crew.why.affinity':'their role only pays in a fight, and they make no guard',
      'crew.why.weak':  'they add the least of the ones to spare',
      'crew.how':   'How it decides, in order',
      'crew.rule1': 'It never touches the <b>only reader</b> or the <b>only Captain</b>: without them you cannot search poneglyphs or start a conquest.',
      'crew.rule2': 'Nor whoever <b>carries the Navigation</b>, which is what gives speed and the only answer to Ambush.',
      'crew.rule3': 'Nor the <b>top 3 in each tactic</b>: three guards of three, and whoever makes several lists fills a slot in each one, up to all three.',
      'crew.rule4': 'Of the rest, the first to go is <b>whoever adds no role perk</b>: a repeated role or a role with no effect.',
      'crew.rule5': 'And among those, <b>the one adding the least speed</b> goes; if they tie, the lowest intelligence and power.',
      'crew.remove':   'Remove from the crew',
      'crew.members':  'Crew members',
      'crew.sortBy':      'Sort by',

      'sum.title':       'What your crew is worth',
      'sum.power':       'Total power',
      'sum.speed':       'Speed',
      'sum.int':         'Total intelligence',
      'sum.rp':          'Poneglyph find chance',
      'sum.attacks':     'PvP attacks per turn',
      'sum.range':       'Attack range',
      'sum.supplies':    'Supplies per turn',
      'sum.conquest':    'Neutral island conquest',
      'sum.conquestDef': 'Defended island conquest',
      'sum.health':      'Crew health',
      'sum.price':       'Cost to recruit them',
      'sum.musician':    'Includes the Musician\'s +10 %.',
      'sum.speedCap':    'Speed is capped at 60.',
      'sum.noReader':    'Without an Archaeologist or a Kozuki aboard you cannot even start a search.',

      'roles.title':  'Role perks',
      'roles.none':   'Nobody',
      'roles.combo':  'Helmsman + Navigator',
      'roles.comboD': 'With both you choose which island you sail to instead of leaving it to chance.',

      'u.min':  'min',
      'u.gold': 'gold',
      'u.hp':   'health',
      'u.turn': 'per turn',

      /* ---- PvE page ---- */
      'pve.lead': 'PvE is combat against the world, and it fires on its own when you reach the island you were sailing to. Every island has its <b>three fixed enemies in a fixed order</b>: the only thing that changes between visits is the tactic each one plays, at random. Pick your island and this tells you which line-up gives you the best odds.',

      'pve.isla.t':       'Landing fight',
      'pve.isla.pick':    'Pick the island',
      'pve.isla.sea':     'Sea',
      'pve.isla.allSeas': 'All seas',
      'pve.isla.none':    '— pick an island —',
      'pve.isla.base':    'This island has no fight: you land without a battle.',
      'pve.isla.enemies': 'Their three, in order',
      'pve.isla.prob':    'Chance of winning here',
      'pve.isla.line':    'Your best line-up',
      'pve.isla.beats':   'you beat',
      'pve.isla.of3':     'of their 3 tactics',
      'pve.isla.noCrew':  'Build your crew on My crew and the best-winning line-up will show up here.',
      'pve.sim.btn':      'Simulate the landing',
      'pve.sim.win':      'You win the fight',
      'pve.sim.lose':     'You lose the fight',
      'pve.sim.offer':    'Crew offer',
      'pve.sim.noOffer':  'No offer this time',
      'pve.sim.health':   'health in total',
      'pve.sim.musician': 'Musician: stun halved',
      'pve.sim.offerNote':'Each enemy\'s tactic is rolled and the three duels resolved. If you win, the offer is rolled: 80 %, and if it lands the game looks at 5 characters and offers one you do not have. Here it draws from all 226, because which characters each island can offer is not known.',
      'pve.isla.dmg':     'health on average',
      'pve.isla.dmgNote': 'Confirmed by guide v5.0: each fighter loses <b>34 % of their max health</b> for losing their duel and <b>8 %</b> for winning it, and whoever countered the enemy tactic pays only <b>60 %</b> of whichever applies. Winning wears you down too, so resting is part of sailing rather than something you only do after a defeat.',
      'pve.isla.few':     'You need at least 3 crew members.',
      'pve.isla.how':     'Each island\'s enemies are fixed and always come out in the same order: the first fights your position 1, the second your 2 and the third your 3. The only thing that changes is <b>the tactic each one plays, at random</b>, so the chance is exact: for each position it counts how many of their three tactics you beat, and from that comes the chance of taking 2 of the 3 duels.',
      'pve.isla.guide50': 'Guide <b>v5.0</b> now documents the 3v3, so there is no contradiction left to flag. Only one case survives from the old system: an island with <b>no defenders</b> keeps the flat <b>50 %</b> roll, and so does a crew with no characters at all.',

      'pve.fixed':      'The landing rules',
      'pve.col.lose':   'You lose',
      'pve.col.mid':    'Neutral',
      'pve.col.win':    'You win',
      'pve.k.gold':     'Gold',
      'pve.k.victory':  'Battle victory',
      'pve.k.offer':    'Crew offer',
      'pve.k.hull':     'Hull damage',
      'pve.k.char':     'Health, duel lost',
      'pve.k.charWin':  'Health, duel won',
      'pve.k.counter':  'Damage if you counter',
      'pve.k.goldLoss': 'Gold',
      'pve.k.stun':     'Stun',

      'pve.win.t': 'If you win',
      'pve.win.1': '<b>5000 gold</b> and one more battle victory. If the island belongs to another crew and their upkeep is paid up, <b>1000</b> of that 5000 (20 %) goes to them as tribute.',
      'pve.win.2': '<b>80 % chance of a crew offer</b>. It is rolled <b>only if you won</b>, so it is no longer a flat 40 % of all arrivals: the more you win, the more people turn up.',
      'pve.win.3': 'A new offer <b>replaces one you have not answered</b>, so decide before your next landing.',
      'pve.win.4': 'No offer if the island has nobody to give or you already have them all aboard. Your log records it anyway.',
      'pve.win.5': 'At the special map areas, winning is what opens the poneglyph search or the end of the game.',
      'pve.win.6': 'Winning <b>wears you down too</b>: each of yours loses <b>8 %</b> of their health for the duel they win. A run of won landings still tires the crew, which is why resting is part of sailing.',

      'pve.lose.t': 'If you lose and survive',
      'pve.lose.1': 'The hull takes <b>525 damage</b>.',
      'pve.lose.2': 'Each one pays <b>for their own duel</b>: <b>34 %</b> of their max health for losing it and <b>8 %</b> for winning it. Whoever countered the enemy tactic pays only <b>60 %</b> of whichever applies, and a conceded position costs nobody health.',
      'pve.lose.3': 'You lose <b>500 gold</b>, or everything you have if it is less.',
      'pve.lose.4': 'You are <b>stunned for 90 minutes</b>, or <b>45</b> with a <b>Musician</b> still standing when the fight ends. One knocked out in that same landing shortens nothing.',
      'pve.lose.5': 'The <b>Emergency Repair Kit</b> fires if the hull drops to 30 % or below.',

      'pve.sink.t': 'If you lose and go down',
      'pve.sink.1': 'You lose <b>20 % of your gold</b>, and nobody collects it here: it burns. That is where PvE differs from PvP.',
      'pve.sink.2': 'If the island had an owner paid up, they still take their <b>10 %</b> of what is left.',
      'pve.sink.3': 'You lose <b>one random poneglyph</b> if you were carrying any.',
      'pve.sink.4': 'You return to your starting point.',
      'pve.sink.5': 'Your hull comes back full and <b>everybody comes back at full health</b>, the fallen included.',
      'pve.sink.6': 'You gain <b>one attempt</b> and your wanted bounty drops to 0.',
      'pve.sink.7': 'Stun of <b>90 min + 45 per poneglyph</b> you were carrying, halved by a standing Musician.',

      'pve.down.t': 'If you arrive with nobody standing',
      'pve.down.1': 'As of <b>v0.37.0</b>, landing with your whole crew down is <b>a straight loss, with no roll</b>. It is no longer put off for a later turn, and nobody puts you to rest on your own: when to stop is your call. That is what <b>Rest on arrival</b> is for — arm it from your ship while at sea and the crew starts resting the moment it ties up. Single use: it switches off once spent.',

      'pve.tips.t': 'Getting more out of it',
      'pve.tips.1': 'It is your <b>only reliable source of gold</b>, and now you can improve your odds: you pick who lands and with which tactic, so check the island before you sail.',
      'pve.tips.2': 'It is also where <b>new crew members</b> come from. Answer the offer you have before the next landing or you lose it.',
      'pve.tips.3': 'Keep the <b>hull repaired</b>: three defeats in a row sink you however strong you are.',
      'pve.tips.4': 'Rest before heading somewhere dangerous: the three who lose a PvE are the same three you would send into a PvP.',

      /* ---- PvP page ---- */
      'pvp.lead': 'PvP is three against three, position against position: your first fighter only ever meets their first. Total power decides nothing. You pick who goes, in what order and with which tactic — but you do not see which guard answers: the server picks one in secret, so you commit blind.',

      'pvp.tri.t':   'The tactic triangle',
      'pvp.tri.d':   'Each tactic scores on a different stat, and they beat each other in a cycle. Countering multiplies your score by <b>×1.75</b>, and the bonus is symmetric: the defender gets it just the same when their tactic counters yours. Two identical tactics give neither side an edge.',
      'pvp.tri.cap': 'Ambush beats Assault · Assault beats Manoeuvre · Manoeuvre beats Ambush',

      'pvp.score.t': 'How a duel is scored',
      'pvp.score.1': 'The tactic\'s stat counts <b>×100</b> and the other two <b>×15</b>. On Manoeuvre the other two count <b>×45</b>, because Navigation is rare and without that weighting the tactic was unplayable.',
      'pvp.score.2': '<b>×1.75</b> if your tactic counters theirs.',
      'pvp.score.3': '<b>×1.10</b> if the fighter\'s role matches their tactic: Swordsman with Assault, Sniper with Ambush, Helmsman with Manoeuvre. It belongs to the fighter, not the crew: a Swordsman in reserve does nobody else\'s Assault any good.',
      'pvp.score.4': 'The higher score wins, and <b>a tie goes to the defender</b>. Whoever wins more of the three duels wins the battle, and a level scoreline goes to the defender too.',

      'pvp.sim.t':        '3v3 simulator',
      'pvp.sim.crew':     'Your crew comes from My crew',
      'pvp.sim.empty':    'Build your crew on My crew first: the simulator reads it from there.',
      'pvp.sim.few':      'You need at least 3 crew members to field a line-up.',
      'pvp.sim.rivals':   'Their three',
      'pvp.sim.rivalPh':  'Enemy name…',
      'pvp.sim.add':      'Add',
      'pvp.sim.calc':     'Calculate',
      'pvp.sim.need':     'Add all three enemies to work out the battle.',
      'pvp.sim.notFound': 'That name is not among the 226.',
      'pvp.sim.dupe':     'That one is already on the list.',
      'pvp.sim.prob':     'Chance of winning the battle',
      'pvp.sim.line':     'Recommended line-up',
      'pvp.sim.min':      'min',
      'pvp.sim.minNote':  'The <b>minimum</b> is the lowest score whoever takes that position can have without the chance dropping. Anyone above that number performs the same.',
      'pvp.sim.indiv':    'Individual strength',
      'pvp.sim.indivNote':'Each of yours on their own, against each enemy and each enemy tactic. Good for seeing who is strong, though the battle is decided by the chance above.',
      'pvp.sim.how':      'You know their three but not their order or their tactics, so <b>their 6 orders × their 27 tactic spreads = 162 scenarios</b> are tried. For each of your line-ups it counts how many of those you win 2 of 3 duels in, trying every trio of yours with its 27 tactic spreads.',

      'pvp.riv.t':        'Rivals',
      'pvp.riv.d':        'Note down the guards you see on each rival. Their guards <b>can be learned</b> — battle reports are shared freely and that is real scouting — but <b>which one answers cannot</b>: the server picks one at random from those they have, and never rules out the one that just came up. The more you note, the sharper the plan. Type <b>-</b> for a position the rival leaves empty.',
      'pvp.riv.ph':       'Rival crew name',
      'pvp.riv.add':      'Add rival',
      'pvp.riv.none':     'You have not noted down any rival yet.',
      'pvp.riv.bad':      'Give it a name, and one no other rival already has.',
      'pvp.riv.notFound': 'That character is not in the database. Type - if the position is empty.',
      'pvp.riv.name':     'Rival name',
      'pvp.riv.del':      'Delete',
      'pvp.riv.guard':    'Guard',
      'pvp.riv.gDel':     'Remove',
      'pvp.riv.full':     'That is already the 3 guards the game deals.',
      'pvp.riv.slot':     'Who',
      'pvp.riv.tac':      'Tactic',

      'pvp.plan.t':      'Your attack plan',
      'pvp.plan.pick':   'Against whom',
      'pvp.plan.pick2':  'Pick a rival and this tells you which plan gives you the best odds.',
      'pvp.plan.none':   '— pick a rival —',
      'pvp.plan.rate':   'Success rate',
      'pvp.plan.of':     'Guards you beat:',
      'pvp.plan.line':   'Your best plan',
      'pvp.plan.holes':  'Positions not noted yet, counted here as losses:',
      'pvp.plan.holesT': 'Missing data',
      'pvp.plan.sim':    'Simulate the attack',
      'pvp.plan.rolled': 'You drew',
      'pvp.plan.win':    'You win the attack',
      'pvp.plan.lose':   'You lose the attack',
      'pvp.plan.hull':   'Your hull',
      'pvp.plan.how':    'Every possible plan — your crew, in each order and with each tactic — is tried against <b>all</b> the guards you noted, and the one that takes the most guards wins. Since the guard you meet is a clean draw, the rate is exact: guards beaten over guards they have. On a tie it prefers the plan that wins more individual duels, because each lost duel costs that crew member 34 % of their health.',

      'pvp.dmg.t': 'What each duel costs',
      'pvp.dmg.1': 'Whoever <b>loses</b> the duel takes <b>34 %</b> of their max health.',
      'pvp.dmg.2': 'Whoever <b>wins</b> takes <b>8 %</b>: winning is not free either.',
      'pvp.dmg.3': 'Playing the countering tactic cuts what you take to <b>60 %</b>, <b>even if you lost the duel</b>. A correct read is never wasted.',
      'pvp.dmg.4': 'At 34 %, a healthy character survives two defeats and falls on the third. An uncontested position deals and takes nothing.',

      'pvp.hull.t':    'Hull damage by scoreline',
      'pvp.hull.head': 'Scoreline',
      'pvp.hull.lose': 'Loser\'s hull',
      'pvp.hull.win':  'Winner\'s hull',
      'pvp.hull.wide': '2-1 wide',
      'pvp.hull.tight':'2-1 close',
      'pvp.hull.note': 'A 2-1 counts as <b>wide</b> when the winner\'s three scores add up to at least <b>1.25×</b> the loser\'s. Every empty position adds another <b>10 %</b> to the hull of whoever left it empty. The winner\'s hull can be chewed down but never destroyed: exactly one ship can go down per battle, and it is never theirs.',

      'pvp.cost.t': 'What losing the battle costs',
      'pvp.cost.1': 'You lose <b>10 % of your gold</b> and the winner takes it. If they sink you, <b>20 %</b>, plus a random poneglyph and your whole wanted bounty.',
      'pvp.cost.2': '<b>90 minutes of stun</b>, halved by a Musician still standing when the fight ends.',
      'pvp.cost.3': 'If you are sunk: <b>+45 min per poneglyph</b> you were carrying, you return to the start and gain one attempt.',
      'pvp.cost.4': 'You lose any new-player protection left, and your <b>Emergency Repair Kit</b> fires if the hull is left at 450 or below.',
      'pvp.cost.5': 'On sinking, your hull comes back full and <b>everybody returns at full health</b>: going down is the fastest full heal in the game, which is why the rest of the penalty is so heavy.',

      'pvp.guard.t': 'Your guards',
      'pvp.guard.1': 'A guard is a full line-up: three positions with their character and tactic. Positions fill from the front.',
      'pvp.guard.2': 'How many you set follows your size: with <b>1 character</b>, three guards each playing a different tactic; with <b>2</b>, two guards swapping positions; with <b>3 or more</b>, three guards, and anyone repeating moves to a different position.',
      'pvp.guard.3': 'Up to <b>2 reserves</b>. A reserve steps in for a defender who is missing or at 0, and fights with the tactic of its reserve slot, not the fallen one\'s. Somebody on 1 health keeps their position.',
      'pvp.guard.4': 'Since <b>v0.39.0</b> changes to your guards <b>apply instantly</b>. They used to wait for the next turn.',
      'pvp.guard.5': 'Since <b>v0.41.3</b> fallen characters are flagged in the plan, and <b>a reserve who is down substitutes for nobody</b>.',
      'pvp.guard.6': 'A rival can learn <b>what your guards are</b> — battle reports are shared and that is real scouting — but never <b>which one will answer</b>: the season picks it in secret, and it can repeat. There is deliberately no rule against repeats, because one would leak information.',

      'pvp.when.t': 'When you can attack',
      'pvp.when.1': '<b>1 attack per turn</b>, or <b>2 with a Commander</b> standing.',
      'pvp.when.2': 'Within <b>60 units</b>, or <b>90 with a Sniper</b>.',
      'pvp.when.3': 'Neither crew can be stunned, and the other cannot be under new-player protection.',
      'pvp.when.4': 'You need at least one character standing, and attacking drops your own new-player protection.',
      'pvp.when.5': 'A submerged crew can only fight another submerged crew, in both directions.'
    }
  };

  const KEY = 'opmaps-lang';

  /* Idioma inicial: el guardado, si no el del navegador, si no español. */
  function detect(){
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'es' || saved === 'en') return saved;
    } catch(e){ /* navegador con almacenamiento bloqueado */ }
    return (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  }

  let lang = detect();

  /* Devuelve la traducción; si falta en inglés cae al español, y si tampoco
     existe devuelve la propia clave (así un olvido se ve, no desaparece). */
  function t(key){
    const table = DICT[lang] || DICT.es;
    if (table[key] !== undefined) return table[key];
    if (DICT.es[key] !== undefined) return DICT.es[key];
    return key;
  }

  /* Repinta toda la página en el idioma actual. */
  function apply(){
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      // formato: "placeholder:clave; aria-label:otra.clave"
      el.dataset.i18nAttr.split(';').forEach(pair => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
    });

    const titleKey = document.body && document.body.dataset.titleKey;
    if (titleKey) document.title = t(titleKey);

    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      const on = btn.dataset.langBtn === lang;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /* API pública: I18N.t(), I18N.lang, I18N.set(), I18N.apply() */
  window.I18N = {
    get lang(){ return lang; },
    t: t,
    apply: apply,
    set: function(next){
      if (next !== 'es' && next !== 'en') return;
      lang = next;
      try { localStorage.setItem(KEY, next); } catch(e){ /* da igual, dura la sesión */ }
      apply();
      // Las páginas con contenido generado por JS escuchan esto para repintarse.
      document.dispatchEvent(new CustomEvent('langchange', { detail: next }));
    }
  };

  document.addEventListener('DOMContentLoaded', apply);
})();
