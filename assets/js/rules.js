/* ============================================================
   OP-MAPS DATA — las reglas del juego, en un solo sitio
   ------------------------------------------------------------
   Todas las fórmulas salen de la guía del jugador v4.0. Si el juego
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

  // Lo que aporta a la probabilidad de encontrar un poneglifo.
  function searchShare(c){ return c.i * 0.001; }

  /* Score de un personaje en UNA táctica:
     stat principal ×100 + las otras dos ×15 (×45 en Manoeuvre),
     y ×1.10 si su rol casa con la táctica. */
  function score(c, tactic){
    const main = c[MAIN[tactic]];
    const rest = total(c) - main;
    const base = main * 100 + rest * OFF[tactic];
    return hasAffinity(c, tactic) ? base * AFFINITY : base;
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

  // Probabilidad de encontrar un poneglifo, con tope en 0.9.
  function rpChance(totalInt){
    return Math.min(0.9, 0.3 + totalInt * 0.001);
  }

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

  // Un personaje lee poneglifos por rol (1) o por sangre Kozuki (2).
  function isReader(c){ return c.rd > 0; }

  return {
    COUNTER, AFFINITY, HULL, MAX_CREW,
    TACTICS, BEATS, ROLE_FOR, USEFUL_ROLES,
    total, power, health, price, speedShare, searchShare,
    score, scores, bestTactic, hasAffinity,
    crewSpeed, crewPower, rpChance, conquestTime, supplies, SUPPORT_ROLES,
    beats, duelWin, isUsefulRole, isReader
  };
})();
