# OP-MAPS DATA

Compendio no oficial del juego [op-maps.com](https://op-maps.com/): los 226
personajes, tu tripulación, el combate PvE y PvP, consejos y la guía.

Hecho por **ElBryan98**. ¿Ves un error o algo que falte? Discord: `ElBryan98`.

## Cómo abrirlo

No hace falta servidor ni compilar nada: abre `index.html` en el navegador y
listo. Todo es HTML, CSS y JavaScript sin dependencias.

## Qué hay dentro

| Página | Qué hace |
|---|---|
| `index.html` | Portada con los ocho menús |
| `data.html` | Los 226 personajes, en lista o en álbum por capítulos |
| `crew.html` | Tu tripulación: poder, velocidad, bonus de rol y a quién sobra |
| `pve.html` | Las 156 islas con sus enemigos, y qué alineación gana en cada una |
| `pvp.html` | Tu plan de ataque y qué guardias montar contra cada rival |
| `rivals.html` | Tu libreta de rivales, con código para compartirla |
| `alianza.html` | Compartir la libreta con hasta 10 compañeros |
| `tips.html` | Consejos |
| `guide.html` | Toda la información del juego, en 19 pliegues |

```
assets/css/style.css     una sola hoja de estilo para todo el sitio
assets/js/i18n.js        los textos en español e inglés
assets/js/site.js        cabecera y pie compartidos
assets/js/rules.js       las fórmulas del juego, en un solo sitio
assets/js/characters.js  los 226 personajes
assets/js/islands.js     las 156 islas y sus enemigos
assets/js/items.js       los 14 objetos de la tienda
```

Las páginas comparten cabecera, pie y traducciones, así que el menú se toca en
un único archivo. Nada de lo que calcula el sitio está guardado a mano: poder,
vida, precio y puntuaciones salen todos de `rules.js`.

## De dónde salen los datos

- **Mecánicas y fórmulas**: la guía del jugador del juego.
- **Personajes**: cruce del álbum del juego (en sus dos idiomas) con las
  recopilaciones del autor. Los 226 están verificados contra datos del juego.
- **Islas y enemigos**, **tienda** y **novedades**: exports del propio juego.

## Idiomas

Español e inglés, con el selector de la cabecera. La elección se recuerda en el
navegador. Los nombres de roles, tácticas y personajes usan los oficiales de
cada idioma.

## Privacidad

Tu tripulación se guarda solo en tu navegador (`localStorage`). No hay servidor,
ni cuentas, ni nada que se envíe a ninguna parte.
