# Actualizaciones

Aquí se lleva la cuenta de **qué versión del juego sigue el sitio** y **qué se ha
ido cambiando**. Sirve para responder de un vistazo a "¿esto ya está al día?".

Tres archivos:

| Archivo | Para qué |
|---|---|
| [VERSIONES.md](VERSIONES.md) | Qué versión de cada fuente estamos siguiendo ahora mismo |
| [CHANGELOG.md](CHANGELOG.md) | Todo lo que se ha cambiado en el sitio, por versión |
| [PENDIENTES.md](PENDIENTES.md) | Lo que queda por hacer y lo que está esperando datos |

## Cómo se numera el sitio

`MAYOR.MENOR.PARCHE`, contando desde la primera publicación:

- **MAYOR** — se reescribe una sección entera o cambia la estructura del sitio.
- **MENOR** — sección nueva, función nueva, o se sigue una guía del juego nueva.
- **PARCHE** — correcciones de datos, textos y arreglos visuales.

## De dónde sale cada dato

Cuando dos fuentes se contradicen, manda la de más arriba:

1. **`CONTEXTO/Novedades.txt`** — el changelog del juego. Es siempre lo más
   reciente que existe, y manda sobre la guía en lo que sea posterior a ella.
2. **`CONTEXTO/player-guide-v5.0.txt`** — la guía oficial. Manda en mecánicas,
   fórmulas y constantes.
3. **Exports del juego** — `Orden y tripulantes album*.txt` (nombres, roles,
   número de ficha y capítulo) y `Tienda.txt` (objetos y precios). Las islas
   ya no tienen export vivo: manda `assets/js/islands.js`, que además incluye
   las que fue aportando el autor.
4. **Recopilaciones del autor** — ya volcadas y verificadas contra el juego, así
   que se apartaron a `Desktop/Programas/OPMAPSDATA-ARCHIVO/` el 19 ago 2026.
