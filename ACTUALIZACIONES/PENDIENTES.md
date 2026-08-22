# Pendientes

## Pedido por el usuario

- [ ] **Ordenar las islas en el PvE.** Aparcado a propósito el 19 ago 2026 para
      decidir después con qué criterio: por mar y recorrido, por dificultad de
      la guardia, o alfabético.
- [ ] **Consejos** (`tips.html`) sigue siendo un esqueleto.
- [ ] **Enlaces desde la Guía** a las páginas que profundizan: los roles a
      Data Crew, el desembarco al PvE, las guardias al PvP. Pedido por el
      usuario para cuando revise el contenido.
- [ ] Cambio en la descripción de Data Crew, aparcado por el usuario.

## Ideas que salieron del PvP

- [x] **¿Qué patrón de guardias es el mejor?** Resuelto el 19 ago 2026 con el
      panel «Tus guardias contra él»: en vez de elegir un patrón, calcula las
      tres guardias concretas que menos caen contra ese rival.
- [ ] **Compartir rivales por código.** Exportar la libreta a un texto
      que se pega en el chat de la alianza y se importa. Sin servidor.

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
