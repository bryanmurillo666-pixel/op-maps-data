# Versiones que sigue el sitio

Estado a **24 de noviembre de 2026**.

| Fuente | Versión | Fecha | Estado |
|---|---|---|---|
| Sitio OP-MAPS DATA | `1.13.0` | 24 nov 2026 | sin publicar, pendiente de que el usuario revise los cambios. |
| Guía del jugador | `7.7` | 2 nov 2026 | ✅ aplicada |
| Changelog del juego | `v0.44.0` | 18 ago 2026 | ✅ leído |
| Álbum del juego (ES/EN) | export | 16 ago 2026 | ✅ 226 personajes verificados. Los 396 enemigos de las islas existen todos. |
| Islas | `islands.js` | 25 sep 2026 | ✅ mapa de la **temporada 9**: 160 islas (con los dos jefes finales), 133 con enemigos y 27 pendientes. Volcado de `Islas temporada 9 - Island.csv`. Se corrigen en el PvE sin tocar el archivo, y esas correcciones son de cada navegador. |
| Armas | `rules.js` | 25 sep 2026 | ✅ 4: `Yoru` y `Napoleon` (espadachín), `Zeus` (francotirador), `Prometheus` (capitán). ×1,25 las cuatro. Una por miembro y una de cada por tripulación. El `×1,25` lo **confirma la guía 7.7** para las cuatro. |
| Daño a jefes | `rules.js` | 25 nov 2026 | ⚠️ por resultado del ataque: 150 (3-0) / 100 (2-1) / 50 (pierdes). Dato del usuario, **más nuevo que la guía 7.7** (que dice 150 por duelo). |
| Temporadas | — | 24 nov 2026 | ❌ quitadas de Mis rivales a petición del usuario: un rival vuelve a ser solo su nombre. |
| Tienda | export | 16 ago 2026 | ✅ 14 objetos |

## Servicios de los que depende

Solo **GitHub Pages**, que sirve todo el HTML, CSS y JS. Firebase se usaba
para *Mi alianza*, que se quitó en la `1.13.0`; la base `op-maps-data-default-rtdb`
se puede borrar desde la consola de Firebase cuando se quiera.


## Historial de guías

| Guía | Cerrada con | Qué cambió de fondo |
|---|---|---|
| `v4.0` | juego `v0.36.0` | Primera que se usó para montar el sitio. |
| `v5.0` | juego `v0.44.0` | El PvE deja de ser un `50%` fijo y pasa a ser un `3v3` real contra la guardia de la isla. Aparecen el mercado entre tripulaciones y el plan de ataque como pantalla propia. |
| `v5.1` | juego `v0.44.0` | Solo aclaraciones del **Recubrimiento de Submarino**: sobrevives sin daño, se gasta siempre, y te deja sumergido `120 min` (o sales a flote si ya lo estabas). No salta si sigues aturdido. |
| `v7.7` | sin dato | **Jefes del mundo** (Mihawk y Big Mom, con sus armas), **frutas del diablo**, comercio entre barcos, colíder y guerras de alianza, ranking de daño a jefes. El poneglifo pasa a `3` turnos + `1` tirada y va por la **INT media** (`0,26 + (media − 50) × 0,012`, entre `20 %` y `75 %`). El recubrimiento ya **no** te deja sumergido: sales a flote en el mismo turno. |

## Cómo comprobar si hay algo nuevo

El changelog del juego va por delante de la guía. Si en `Novedades.txt` aparece
una versión **posterior** a la que cerró la guía, eso manda sobre la guía.

La guía `v7.7` (2 nov 2026) es más nueva que el último `Novedades.txt` que hay
(`v0.44.0`, 18 ago 2026), así que **ahora manda la guía**.
