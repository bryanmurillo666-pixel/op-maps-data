# Pendientes

## Pedido por el usuario

- [x] **Ordenar las islas en el PvE.** Hecho el 8 sep 2026: el usuario numeró cada
      isla dentro de su mar (campo `o` de `islands.js`) y la lista se guarda ya
      ordenada por (mar, orden), así que el desplegable las recorre de menos a más.
- [x] **Enemigos del New World.** Hecho el 12 sep 2026 con
      `Islas actualizadas.xlsx`: `64` de las `66` del New World ya traen sus tres.
      Quedan `14` islas pendientes de comprobar en el juego — `Green bit` y
      `Onigashima` (New World), `Ilisia kigdom`, `Karate island`, `7 ???`,
      `Downs island`, `Flevance kingdom`, `Rubeck island`,
      `Yotsuba island region`, `Goat island`, `Goa kingdom`, `Kumate island`,
      `Sixis island` y `Hidden cloud village`.
- [x] **Buscar la isla escribiendo** (12 sep 2026). El desplegable de 158 pasa a
      ser un campo de texto con `datalist`, con el mar al lado de cada nombre.
- [x] **Editar islas a mano** (12 sep 2026). Desglose nuevo en el PvE. Lo que se
      corrige vive en `localStorage` (`opmaps-islas`) y **no se comparte**: la
      alianza sigue compartiendo solo rivales.
- [x] **¿El PvE sirve para ganar 2-1?** Contestado el 12 sep 2026: no. El casco
      solo recibe los `525` si pierdes y son fijos, y la recompensa por ganar no
      depende del marcador; lo único que cambia es la vida de los tuyos. El PvE
      lo explica debajo de la alineación.
- [x] **Las guardias y el último ataque** (14 sep 2026). Ya contaban con él
      —la mitad del peso si le salió bien, un cuarto si le falló— pero solo
      se decía a partir de dos seguidas. Ahora se dice siempre, hay una cuarta
      defensa **Contra su último ataque** y su columna en la tabla.
- [x] **Lo borrado volvía al sincronizar** (18 sep 2026). No era la caché: borrar
      no salía de tu navegador y el compañero âo tu propio hueco de una
      temporada pasadaâ te lo devolvía. Ahora se apunta lo que borras.
- [x] **Ver las guardias del rival en el PvP y marcar Caído de un toque**
      (18 sep 2026). Desglose Â«Sus guardiasÂ».
- [x] **Fuera el plan de hundimiento** (18 sep 2026). En el historial de git.
- [x] **Isla del jefe final** (18 sep 2026): la última del Grand Line, con Dracule
      Mihawk en los tres puestos. `Final boss` en inglés, `Jefe final: Dracule
      Mihawk` en español.
- [ ] **Consejos** (`tips.html`) sigue siendo un esqueleto.
- [ ] **Enlaces desde la Guía** a las páginas que profundizan: los roles a
      Data Crew, el desembarco al PvE, las guardias al PvP. Pedido por el
      usuario para cuando revise el contenido.
- [ ] Cambio en la descripción de Data Crew, aparcado por el usuario.

## Ideas que salieron del PvP

- [x] **¿Qué patrón de guardias es el mejor?** Resuelto el 19 ago 2026 con el
      panel «Tus guardias contra él»: en vez de elegir un patrón, calcula las
      tres guardias concretas que menos caen contra ese rival.
- [x] **Compartir rivales por código.** Hecho: el código `OPMR1:` de *Mis
      rivales*, que se pega en el chat. Desde la `1.9.0` no sustituye al
      importar, complementa.
- [x] **Compartir rivales sin copiar y pegar.** Hecho en la `1.9.0` con la
      pestaña *Mi alianza*: hasta 10 personas, un botón que junta las libretas
      y fusión puesto a puesto. Firebase hablado con `fetch`, sin SDK.

## Secciones que la guía v5.0 pide y aún no existen

- [ ] **Mercado entre tripulaciones.** Un puesto por tripulación, 5 objetos, 50
      unidades cada uno, 7 días, precio entre el `20%` y el `100%` del de la
      tienda y sin comisión. Encaja como panel dentro de Consejos o como sección
      propia.
- [ ] **Alianzas.** Hasta 10 jugadores, código de invitación, tablón y ranking
      con pesos propios (islas `~28%`, poneglifos `~28%`, poder `~19%`,
      victorias `~11%`, oro `~7%`, recompensa `~7%`).

## Esperando datos

- [ ] **Bolsas de reclutamiento por isla.** La guía dice que la oferta sale de
      una muestra de 5 personajes, pero no de qué conjunto sale en cada isla.
      Mientras tanto el simulador de PvE muestrea sobre todo el roster.

## Decisiones sueltas

- [ ] Borrar o no los prototipos `_album-prueba.html` y `_opciones-stats.html`
      (ya excluidos del repositorio por el `.gitignore`).

## Cerrado

- [x] **Columna TRUE/FALSE de `Personajes/Lista 3.txt`** (19 ago 2026). Marcaba a
      Inuarashi, Doflamingo, Kozuki Hiyori y Kozuki Sukiyaki, que no comparten rol
      ni capítulo ni el ser lectores: es una casilla de la hoja de cálculo con un
      criterio propio del autor. El sitio no depende de ella y los stats de esas
      filas ya coincidían. El archivo se apartó a `OPMAPSDATA-ARCHIVO/`.
- [x] **Efecto del Recubrimiento de Submarino** (21 ago 2026). La guía `v5.1`
      zanja la contradicción con el texto de la tienda: sobrevives **sin daño**
      y sin perder oro ni poneglifos, el recubrimiento se gasta igual, y te deja
      **sumergido 120 min** (o sales a flote enseguida si ya estabas abajo). No
      salta si sigues aturdido cuando cae el rayo. Aplicado en `items.js`.

## De la auditoría del 22 ago 2026

- [ ] **El `+10 %` de casco por puesto vacío no se calcula.** Está escrito en
      `pvp.hull.note` pero ningún cálculo lo aplica. Hoy da igual porque el
      sitio siempre supone que sales con tres; haría falta si algún día se
      modela pelear con menos.
- [x] **Qué cuenta como «2-1 amplio»** (22 ago 2026). El usuario lo aclara: son
      las puntuaciones **con el contador aplicado**, o sea los críticos. Ya se
      calcula así en `pvp-model.js` y en la simulación. Sigue siendo su lectura
      del juego, no una cita literal de la guía: un informe de combate real que
      acabe 2-1 lo confirmaría del todo.
- [x] **Las tres tácticas de una isla son independientes** (22 ago 2026).
      Confirmado por el usuario: salen al azar sin relación entre ellas, y los
      enemigos mantienen su orden. Es justo lo que suponía el PvE, así que no
      hubo que cambiar nada.
- [ ] **Claves de texto muertas en `i18n.js`** (22 ago 2026). Al mudar la teoría
      a la Guía quedaron sin usar unas 120 claves (`pve.win.*`, `pve.sink.*`,
      `pvp.score.*`, `pvp.guard.*`, `pvp.when.*`, `pvp.tri.*`…). No molestan más
      que en peso, y borrarlas tiene su riesgo: varias claves se piden con el
      nombre montado en tiempo de ejecución (`t('rn.' + rol)`), así que un
      borrado automático se llevaría alguna viva por delante. Si se hace, hay
      que ir clave por clave.
