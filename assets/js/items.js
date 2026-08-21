/* ============================================================
   OP-MAPS DATA — los 14 objetos de la tienda
   ------------------------------------------------------------
   Nombres, precios y descripciones en español: CONTEXTO/Tienda.txt,
   que es la tienda del juego tal cual. Los nombres y efectos en inglés
   salen de la guía v5.1 (la tienda solo la tenemos en español).

     id    = identificador interno
     es/en = nombre en cada idioma
     p     = precio en oro
     auto  = true si el juego lo gasta solo cuando toca
     cd    = enfriamiento del uso automático, en horas (0 = no tiene)
     ds/de = descripción en español (tienda) e inglés (guía)

   RESUELTO con la guía v5.1 (20 ago 2026). Había una contradicción con el
   Recubrimiento de Submarino: el texto de la tienda dice que convierte el
   rayo de Imu en "daño fuerte al casco", y la guía dice que sobrevives sin
   daño ninguno. Manda la guía: es posterior al export de la tienda y se
   declara a sí misma la fuente única de las mecánicas. Lo que hace de
   verdad, según la v5.1:

     · sobrevives, SIN daño y sin perder oro ni poneglifos
     · el recubrimiento se gasta pase lo que pase
     · si salta contra el rayo, te deja sumergido 120 min: ahí no navegas y
       solo puedes pelear contra otras tripulaciones sumergidas
     · si ya estabas sumergido cuando cayó el rayo, se gasta en absorberlo
       y sales a flote enseguida
     · NO salta si sigues aturdido cuando cae el rayo; si el aturdimiento
       ya se te había pasado, salta con normalidad
     · sumergirte rompe una conquista en curso
   ============================================================ */
window.ITEMS = [
  { id:'ration', es:'Ración', en:'Ration', p:100, auto:false, cd:0,
    ds:'Restaura 40 de vida a un tripulante que siga en pie. No levanta a los caídos — para eso está la Medicina.',
    de:'Restores 40 health to one character who is standing.' },

  { id:'meat', es:'Carne Asada', en:'Grilled Meat', p:350, auto:false, cd:0,
    ds:'Restaura 160 de vida a un tripulante que siga en pie. No levanta a los caídos — para eso está la Medicina.',
    de:'Restores 160 health to one character who is standing.' },

  { id:'medicine', es:'Medicina', en:'Medicine', p:1000, auto:true, cd:0,
    ds:'Levanta a un tripulante caído con 45 de vida, o 70 si tienes un Doctor en pie. La única forma de revivir a alguien sin esperar un descanso.',
    de:'Brings one fallen character back on 45 health (70 with a Doctor).' },

  { id:'kit-minor', es:'Kit de Reparación Menor', en:'Minor Repair Kit', p:100, auto:false, cd:0,
    ds:'Repara 100 de vida del casco. Solo uso manual.',
    de:'Repairs 100 hull.' },

  { id:'kit-major', es:'Kit de Reparación Mayor', en:'Major Repair Kit', p:500, auto:false, cd:0,
    ds:'Repara 600 de vida del casco. Solo uso manual.',
    de:'Repairs 600 hull.' },

  { id:'kit-emergency', es:'Kit de Reparación de Emergencia', en:'Emergency Repair Kit', p:1000, auto:true, cd:4,
    ds:'Repara automáticamente 600 de vida del casco cuando el barco baja al 30 % de vida o menos.',
    de:'Auto-triggers at low hull (30 %) and repairs 600.' },

  { id:'coffee', es:'Café Cargado', en:'Strong Coffee', p:100, auto:false, cd:0,
    ds:'Reduce el tiempo de aturdimiento en 60 minutos. ¡Te mantiene despierto!',
    de:'Removes 60 min of stun.' },

  { id:'tears', es:'Lágrimas de Sirena', en:'Mermaid Tears', p:500, auto:false, cd:0,
    ds:'Elimina instantáneamente cualquier efecto de aturdimiento. Una lágrima rara de una princesa sirena.',
    de:'Fully removes stun.' },

  { id:'super-cafe', es:'Super Cafe', en:'Super Cafe', p:1000, auto:true, cd:4,
    ds:'Elimina automáticamente el aturdimiento cuando tu tripulación queda incapacitada.',
    de:'Auto-triggers when you become stunned.' },

  { id:'coating', es:'Recubrimiento de Submarino', en:'Submarine Coating', p:1000, auto:true, cd:4,
    ds:'Salta solo cuando te cae un rayo de Imu: sobrevives sin daño y sin perder oro ni poneglifos. Te deja sumergido 120 min, y ahí ni navegas ni puedes pelear con nadie que no esté sumergido. No salta si sigues aturdido cuando cae el rayo.',
    de:'Auto-triggers against an IMU strike: you survive with no damage and lose no gold or poneglyphs. It leaves you submerged for 120 min, where you cannot sail and can only fight other submerged crews. It does not fire if you are still stunned when the strike lands.' },

  { id:'coating-manual', es:'Recubrimiento de Submarino (Manual)', en:'Submarine Coating (Manual)', p:500, auto:false, cd:0,
    ds:'Recubrimiento de uso manual: te sumerges 60 min cuando tú quieras. Si el rayo te pilla ya sumergido, se gasta en absorberlo y sales a flote enseguida.',
    de:'Submerges you manually for 60 min. If a strike lands while you are already under, this coating is spent absorbing it and you surface right away.' },

  { id:'anchor', es:'Ancla', en:'Anchor', p:1000, auto:false, cd:0,
    ds:'Echa el ancla durante 4 horas. El barco se detiene sin perder su rumbo. Super Cola puede romper el efecto antes.',
    de:'Keeps you still for 240 min without losing your route.' },

  { id:'super-cola', es:'Super Cola', en:'Super Cola', p:10000, auto:false, cd:1,
    ds:'Úsala mientras navegas para avanzar exactamente un turno de navegación.',
    de:'Advances you exactly one travel segment.' },

  { id:'registry', es:'Enmienda de Registro', en:'Registry Amendment', p:100000, auto:false, cd:0,
    ds:'Documentos falsificados del Gobierno Mundial para volver a registrar tu tripulación con otro nombre. El nuevo nombre debe ser único esta temporada y no puede contener espacios.',
    de:'Renames your crew once.' }
];
