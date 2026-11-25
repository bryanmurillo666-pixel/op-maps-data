/* ============================================================
   OP-MAPS DATA — las reglas del juego, en un solo sitio
   ------------------------------------------------------------
   Todas las fórmulas salen de la guía del jugador v7.7. Si el juego
   cambia un número, se cambia AQUÍ y se corrige en todas las páginas
   a la vez (Data, Mi tripulación, PvP…).
   ============================================================ */
window.RULES = (function () {

  /* ---------- constantes ---------- */
  const COUNTER  = 1.75;   // contrarrestar la táctica rival
  const AFFINITY = 1.10;   // el rol del luchador casa con su táctica
  const HULL     = 1500;   // casco del barco, igual para toda tripulación
  const MAX_CREW = 11;

  const TACTICS = ['Assault', 'Manoeuvre', 'Ambush'];

  // Qué táctica vence a cuál: Ambush > Assault > Manoeuvre > Ambush.
  const BEATS = { Ambush: 'Assault', Assault: 'Manoeuvre', Manoeuvre: 'Ambush' };

  // El rol que da el ×1.10 en cada táctica.
  const ROLE_FOR = { Assault: 'Swordsman', Manoeuvre: 'Helmsman', Ambush: 'Sniper' };

  // Stat principal de cada táctica y cuánto valen las otras dos.
  // Manoeuvre pesa 45 en vez de 15 porque la Navegación es rarísima
  // en el roster y sin ese ajuste la táctica era injugable.
  const MAIN = { Assault: 'f', Manoeuvre: 'v', Ambush: 'i' };
  const OFF  = { Assault: 15,  Manoeuvre: 45,  Ambush: 15  };

  /* ---------- cálculos por personaje ---------- */

  // Suma de los tres stats. Es la base del precio y de la vida.
  function total(c){ return c.f + c.v + c.i; }

  // Poder: lo que mide el ranking de tripulación más fuerte.
  // No decide un duelo — eso lo deciden los scores de abajo.
  function power(c){ return c.f * 1.5 + c.i * 0.5 + c.v * 0.2; }

  // Vida máxima del personaje (el casco del barco va aparte).
  function health(c){ return 60 + 0.5 * total(c); }

  // Precio de reclutamiento: cuadrático, por eso la élite sale carísima.
  function price(c){ return Math.floor(Math.pow(total(c), 2) / 10); }

  // Lo que ese personaje aporta a la velocidad de la tripulación.
  function speedShare(c){ return c.v * 0.04; }


  /* ---------- jefes del mundo (guía v7.7) ----------
     El jefe está en las tres posiciones a la vez y cada copia juega una
     táctica secreta, sorteada en cada ataque. Sus stats son las de su
     carta del álbum, así que se buscan ahí.

     EL DAÑO VA POR EL RESULTADO DEL ATAQUE, no por duelo. Cambiado en el
     juego DESPUÉS de la guía v7.7 (que aún dice 150 por duelo ganado); lo
     trae el usuario el 25 nov 2026:
       ganas 3-0 → 150     ganas 2-1 → 100     pierdes → 50
     Con 2 ataques por turno, como mucho 300 por jugador y turno. El empate
     de un duelo es del jefe, como siempre (es el defensor). */
  const JEFES = {
    'Dracule Mihawk':   { vida: 30000, oro: 300000, isla: 'Kuraigana Island' },
    'Charlotte Linlin': { vida: 45000, oro: 450000, isla: 'Whole Cake Island' }
  };
  const JEFE_DANO = { g30: 150, g21: 100, pierde: 50 };   // por ataque

  /* Vida media que le quitas en UN ataque, con la probabilidad de ganar
     cada uno de los tres duelos (independientes: cada copia sortea su
     táctica). Un puesto vacío concede su duelo: probabilidad 0. */
  function danoJefe(p){
    const q = [0, 1, 2].map(i => Math.max(0, Math.min(1, Number(p[i]) || 0)));
    const tres = q[0] * q[1] * q[2];
    const dos = q[0] * q[1] * (1 - q[2]) + q[0] * (1 - q[1]) * q[2] + (1 - q[0]) * q[1] * q[2];
    return tres * JEFE_DANO.g30 + dos * JEFE_DANO.g21 + (1 - tres - dos) * JEFE_DANO.pierde;
  }

  /* Lo que le quita un ataque con tantos duelos ganados (0 a 3). */
  const danoJefeMarcador = ganados =>
    ganados >= 3 ? JEFE_DANO.g30 : (ganados === 2 ? JEFE_DANO.g21 : JEFE_DANO.pierde);
  const JEFE_AURA_CASCO = 225; // casco por turno a 120 unidades, despierto
  const JEFE_AURA_VIDA = 0.12; // y vida de cada personaje en pie

  /* ---------- armas ----------
     Un arma se equipa a UN personaje de una tripulación y le sube el
     score en las tres tácticas. Dos detalles que mandan en cómo está
     montado esto:

     1. Es de la TRIPULACIÓN, no del personaje del álbum. Tu Mihawk
        puede llevar Yoru y el Mihawk de un rival no, o al revés. Por eso
        el arma no se toca nunca sobre `CHARACTERS`: se pone sobre una
        COPIA con `conArma`, y cada tripulación hace la suya.
     2. Viaja PEGADA al personaje, no por parámetro. `score` se llama
        desde media página —el PvE, el plan de ataque, las guardias, la
        simulación— y añadirle un argumento a todas esas llamadas era
        pedir que se olvidara en alguna. Así no hay nada que recordar:
        quien reciba el personaje recibe su arma.

     El multiplicador cae sobre el score y no sobre los stats, pero da
     exactamente igual: `base` es lineal en los stats, así que subirlos
     un 25 % sube el score un 25 %. Sobre el score se lee mejor y no
     ensucia ni la vida, ni el precio, ni el poder de la tripulación. */
  /* Cada arma va a UN rol y nadie puede llevar dos a la vez. La guía v7.7
     confirma el ×1,25 de las cuatro, en cualquier duelo (PvP, islas y
     jefes), y que se acumula con la afinidad: un Espadachín con Yoru en
     Asalto puntúa ×1,375, que es justo 1,25 × 1,10 — lo que ya sale de
     multiplicar aquí abajo. Prometheus es de Capitán, que no tiene
     afinidad, así que es un ×1,25 plano.

     Una de cada por tripulación: el jefe no le da un arma a quien ya la
     tiene mientras quede alguien que no. Solo podría pasar si TODOS los
     que le pegaron la tienen ya, y eso no se modela. */
  const ARMAS = {
    Yoru:       { rol: 'Swordsman', mult: 1.25 },
    Napoleon:   { rol: 'Swordsman', mult: 1.25, es: 'Napoleón' },
    Zeus:       { rol: 'Sniper',    mult: 1.25 },
    Prometheus: { rol: 'Captain',   mult: 1.25, es: 'Prometeo' }
  };


  const armaDe = c => (c && c.arma) ? (ARMAS[c.arma] || null) : null;

  /* El nombre del arma como se escribe en cada idioma. Napoleon lleva
     tilde en espanol y Prometheus se llama Prometeo, y eso no deberia
     obligar a cada pagina a saberlo. */
  function nombreArma(k, es){
    const a = ARMAS[k];
    return (a && es && a.es) ? a.es : k;
  }

  /* ¿Puede este personaje llevar esta arma? Yoru es de espadachines. */
  function puedeArma(c, nombre){
    const a = ARMAS[nombre];
    return !!(a && c && (!a.rol || c.r === a.rol));
  }

  /* Una COPIA del personaje con el arma puesta. Si no puede llevarla, o
     no hay arma, devuelve el personaje tal cual: así se puede llamar sin
     comprobar nada antes. */
  function conArma(c, nombre){
    if (!c || !nombre || !puedeArma(c, nombre)) return c;
    const copia = {};
    for (const k in c) if (Object.prototype.hasOwnProperty.call(c, k)) copia[k] = c[k];
    copia.arma = nombre;
    return copia;
  }

  /* Score de un personaje en UNA táctica:
     stat principal ×100 + las otras dos ×15 (×45 en Manoeuvre),
     ×1.10 si su rol casa con la táctica, y ×el arma que lleve. */
  function score(c, tactic){
    const main = c[MAIN[tactic]];
    const rest = total(c) - main;
    const base = main * 100 + rest * OFF[tactic];
    const conAfinidad = hasAffinity(c, tactic) ? base * AFFINITY : base;
    const a = armaDe(c);
    return a ? conAfinidad * a.mult : conAfinidad;
  }

  function hasAffinity(c, tactic){ return c.r === ROLE_FOR[tactic]; }

  // Los tres scores de golpe: { Assault: n, Manoeuvre: n, Ambush: n }
  function scores(c){
    const out = {};
    for (const t of TACTICS) out[t] = score(c, t);
    return out;
  }

  // La táctica en la que ese personaje puntúa más alto.
  function bestTactic(c){
    const s = scores(c);
    return TACTICS.reduce((a, b) => (s[b] > s[a] ? b : a), TACTICS[0]);
  }

  /* ---------- cálculos de tripulación ---------- */

  // Velocidad: base 20, +0.04 por punto de Navegación total,
  // +8 plano con un Helmsman, y tope duro en 60.
  function crewSpeed(totalNav, hasHelmsman){
    return Math.min(60, 20 + totalNav * 0.04 + (hasHelmsman ? 8 : 0));
  }

  /* Probabilidad de que salga el poneglifo en la tirada. Desde la guía
     v7.7 va por la INT MEDIA de los que siguen en pie, no por la total:
     una tripulación más grande no lee mejor, una más lista sí. Suelo del
     20 % (media 45 o menos) y techo del 75 % (media 95 o más).

     Ojo, que también cambió el ritmo: ya no es una tirada por turno, sino
     3 turnos buscando y UNA tirada al final. */
  function rpChance(avgInt){
    return Math.min(0.75, Math.max(0.20, 0.26 + (avgInt - 50) * 0.012));
  }
  const RP_TURNOS = 3;

  // Poder total de la tripulación. Un Musician en pie suma +10%.
  function crewPower(crew, hasMusician){
    const sum = crew.reduce((acc, c) => acc + power(c), 0);
    return hasMusician ? sum * 1.1 : sum;
  }

  /* Cuánto tarda una conquista, en minutos, según el poder total.
     La base son 1, 2 o 3 turnos; toda conquista multiplica por 3, y una
     isla defendida vuelve a multiplicar por 2. */
  function conquestTime(power){
    const base = power >= 750 ? 1 : (power >= 450 ? 2 : 3);
    return { neutral: base * 3 * 30, defended: base * 3 * 2 * 30 };
  }

  // Suministros por turno: 10 por cada rol de apoyo DISTINTO a bordo.
  // Un segundo Cook no suma: lo que paga es la variedad.
  const SUPPORT_ROLES = ['Doctor', 'Cook', 'Shipwright'];
  function supplies(crew){
    let n = 0;
    for (const rol of SUPPORT_ROLES) {
      if (crew.some(c => c.r === rol)) n++;
    }
    return n * 10;
  }

  /* ---------- duelos ---------- */

  function beats(a, b){ return BEATS[a] === b; }

  /* ¿Gano yo el duelo? Se aplica el ×1.75 a quien contrarreste.
     El empate va al defensor, así que empatar no es ganar. */
  function duelWin(myScore, myTactic, opScore, opTactic){
    let mine = myScore, theirs = opScore;
    if (beats(myTactic, opTactic))      mine   *= COUNTER;
    else if (beats(opTactic, myTactic)) theirs *= COUNTER;
    return mine > theirs;
  }

  /* ---------- roles ---------- */

  // Los 11 roles con efecto mecánico. El resto de los 18 son de sabor:
  // el personaje se juzga solo por sus stats.
  const USEFUL_ROLES = [
    'Captain', 'Commander', 'Musician', 'Sniper', 'Helmsman', 'Navigator',
    'Archaeologist', 'Doctor', 'Cook', 'Shipwright', 'Swordsman'
  ];

  function isUsefulRole(role){ return USEFUL_ROLES.indexOf(role) !== -1; }

  /* Roles cuyo efecto es del BARCO y no depende de que su portador pelee:
     valen aunque su puntuacion sea mala, asi que protegen a quien los lleva.
     Swordsman NO esta en la lista a proposito: su unico efecto es el x1.10
     en Asalto, que solo se cobra si de verdad sale a una guardia. Un
     espadachin que no pelea no aporta nada que otro no pueda aportar. */
  const PASSIVE_ROLES = [
    'Captain', 'Commander', 'Musician', 'Sniper', 'Helmsman', 'Navigator',
    'Archaeologist', 'Doctor', 'Cook', 'Shipwright'
  ];

  function hasPassiveRole(role){ return PASSIVE_ROLES.indexOf(role) !== -1; }

  /* ---------- lo que cuesta un combate ----------
     Guía v7.7 (igual desde la v5.1): el daño al casco depende SOLO del marcador, y es una parte
     del casco MÁXIMO (1500), no del que te quede. O sea cantidades fijas
     que no se van achicando según pierdes.

     Un 2-1 es «amplio» cuando el ganador suma al menos 1,25 veces los
     puntos del perdedor; si no, es «ajustado».

     Cada fila lleva las dos caras del mismo combate, porque para decidir
     un plan hace falta saber lo que te cuesta a ti Y lo que le haces a él.

     Y la regla que lo cambia todo: el casco del ganador se desgasta pero
     NUNCA se destruye. En un combate solo puede hundirse un barco, y nunca
     el del que gana. Por eso perder a propósito jamás hunde a nadie. */
  const AMPLIO = 1.25;

  const CASCO = {
    g30:  { yo: 0.05, el: 0.35 },   // ganas 3-0
    g21a: { yo: 0.10, el: 0.25 },   // ganas 2-1 amplio
    g21t: { yo: 0.12, el: 0.18 },   // ganas 2-1 ajustado
    p21t: { yo: 0.18, el: 0.12 },   // pierdes 2-1 ajustado
    p21a: { yo: 0.25, el: 0.10 },   // pierdes 2-1 amplio
    p03:  { yo: 0.35, el: 0.05 }    // pierdes 0-3
  };

  // Cada puesto que dejas vacío suma esto a TU casco, no al suyo.
  const VACIO_EXTRA = 0.10;

  // El Kit de Reparación de Emergencia salta a este casco o por debajo.
  const KIT_EMERGENCIA = 450;
  const KIT_REPARA     = 600;


  // Un personaje lee poneglifos por rol (1) o por sangre Kozuki (2).
  function isReader(c){ return c.rd > 0; }

  return {
    COUNTER, AFFINITY, HULL, MAX_CREW,
    CASCO, AMPLIO, VACIO_EXTRA, KIT_EMERGENCIA, KIT_REPARA,
    TACTICS, BEATS, ROLE_FOR, USEFUL_ROLES, PASSIVE_ROLES,
    total, power, health, price, speedShare,
    score, scores, bestTactic, hasAffinity,
    ARMAS, armaDe, puedeArma, conArma, nombreArma,
    JEFES, JEFE_DANO, danoJefe, danoJefeMarcador, JEFE_AURA_CASCO, JEFE_AURA_VIDA,
    crewSpeed, crewPower, rpChance, RP_TURNOS, conquestTime, supplies, SUPPORT_ROLES,
    beats, duelWin, isUsefulRole, hasPassiveRole, isReader
  };
})();
