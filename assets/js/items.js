/* ============================================================
   OP-MAPS DATA — los 14 objetos de la tienda
   ------------------------------------------------------------
   Nombres, precios y descripciones en español: CONTEXTO/Tienda.txt,
   que es la tienda del juego tal cual. Los nombres y efectos en inglés
   salen de la guía v4.0 (la tienda solo la tenemos en español).

     id    = identificador interno
     es/en = nombre en cada idioma
     p     = precio en oro
     auto  = true si el juego lo gasta solo cuando toca
     cd    = enfriamiento del uso automático, en horas (0 = no tiene)
     ds/de = descripción en español (tienda) e inglés (guía)

   OJO, hay una diferencia entre las dos fuentes con el Recubrimiento de
   Submarino: la guía v4.0 dice que te salva del rayo de Imu sin más, y la
   tienda dice que lo convierte en daño fuerte al casco en vez de una
   derrota instantánea. La tienda es lo que está vivo en el juego, así que
   manda ella, pero conviene confirmarlo antes de escribir la sección de IMU.
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
    ds:'Se activa automáticamente cuando un rayo de Imu golpea a tu tripulación. Sumerge el barco para convertir la destrucción instantánea en daño fuerte al casco.',
    de:'Auto-triggers against IMU, saves you and submerges you for 120 min.' },

  { id:'coating-manual', es:'Recubrimiento de Submarino (Manual)', en:'Submarine Coating (Manual)', p:500, auto:false, cd:0,
    ds:'Recubrimiento de uso manual. Actívalo para sumergirte y convertir el próximo rayo de Imu en daño fuerte al casco en lugar de una derrota instantánea.',
    de:'Submerges you manually for 60 min.' },

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
