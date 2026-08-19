# Cambios del sitio

Lo más nuevo arriba. Para saber qué versión de cada fuente se sigue ahora,
mira [VERSIONES.md](VERSIONES.md).

---

## 1.1.0 — 19 ago 2026

La guía del juego pasó de la `v4.0` a la `v5.0` y con ella cambia el PvE de
raíz. Además el PvP deja de adivinar y pasa a trabajar con datos reales.

### Guía v5.0 aplicada

- **El daño del desembarco ya no es plano.** Antes se decía que los tres que
  bajaban perdían el `34 %`. Ahora cada uno paga por *su* duelo: `34 %` si lo
  pierde, `8 %` si lo gana, y solo el `60 %` de lo que le tocase si contrarrestó
  la táctica rival. Ganar también desgasta.
- **El Músico entra en el PvE**: parte por la mitad los `90 min` de aturdimiento
  si sigue en pie al acabar el combate.
- **Tributo al dueño de la isla**: `20 %` de la recompensa si ganas, `10 %` si
  pierdes.
- Se cae el viejo «`80 %` sobre el total de desembarcos sale un `40 %`»: la
  oferta solo se tira si ganas, así que ahora depende de cuánto ganes.
- Dos notas del sitio que avisaban de contradicciones con la guía **ya no hacen
  falta**: la v5.0 recoge el 3 contra 3 y confirma los números de daño. En su
  lugar se explica el único resto del sistema viejo: una isla **sin defensores**
  mantiene la tirada plana del `50 %`.
- La fila «Las reglas del desembarco» pasa de 7 a **9 cajas**, para meter el
  daño al ganar el duelo y el `×0,6` del contador.

### PvP rehecho

- **Libreta de rivales.** Apuntas cada rival por su nombre y le vas rellenando
  las guardias que le ves: hasta `3` guardias de `3` puestos, con personaje y
  táctica. Se guarda en tu navegador.
- **Plan de ataque con tasa de éxito exacta.** Como el servidor elige la guardia
  al azar entre las que el rival tenga, la probabilidad no hay que estimarla:
  es guardias que le ganas entre guardias que tiene. Se prueban todos los planes
  posibles (los tuyos, en cada orden y con cada táctica) y gana el que más
  guardias se lleva; a igualdad, el que gana más duelos sueltos.
- Un puesto que **no has apuntado** cuenta como perdido a propósito, y el panel
  te dice cuántos hay. Así el número nunca es más bonito de lo que sabes.
- Escribe `-` en un puesto que el rival tenga vacío: eso concede el duelo.
- **Simular el abordaje** sortea la guardia como lo hace el juego, resuelve los
  tres duelos y calcula el daño al casco según el marcador (`3-0`, `2-1` amplio
  o `2-1` ajustado, con el umbral de `1,25×` de la guía).
- Sustituye al simulador viejo, que probaba 162 escenarios porque no sabía ni el
  orden ni las tácticas del rival. Con las guardias apuntadas eso sobra.

### Arreglos

- **El reemplazo ya no protege a un Espadachín flojo.** Un rol solo escuda a
  quien lo lleva si su efecto es del barco. El Espadachín es el único de los 11
  roles con efecto cuyo beneficio es *solo* de combate (el `×1.10` en Asalto),
  así que si no entra en ninguna guardia, no lo cobra y pasa a ser candidato
  como cualquiera. El Tirador (radio de ataque) y el Timonel (`+8` de velocidad)
  sí siguen escudando.
- En el PvP, un puesto que el rival **concede** ya no le cuesta vida a tu
  luchador: no hay nadie enfrente.

### Datos

- Isla nueva: **Scrap island** (Grand Line) — Momonosuke, Jesus Burgess, Pekoms.
  El mapa pasa a **156 islas**.

### Sitio

- Nace esta carpeta `ACTUALIZACIONES/`.

---

## 1.0.0 — 17 ago 2026

Primera versión publicada en GitHub Pages. Portada, Data Crew con los 226
personajes (lista y álbum), Mi tripulación, PvE con las 155 islas y PvP.
Bilingüe ES/EN. Consejos y Guía quedaron como esqueletos.
