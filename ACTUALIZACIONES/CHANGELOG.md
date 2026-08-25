# Cambios del sitio

Lo más nuevo arriba. Para saber qué versión de cada fuente se sigue ahora,
mira [VERSIONES.md](VERSIONES.md).

---

## 1.9.1 — 25 ago 2026

**Los cuatro marcadores, el daño al rival y el banquillo.** El PvP tenía dos
botones —ganar o caer 2-1— y eso se quedaba corto: un 3v3 solo puede acabar de
cuatro maneras, y cada una cuesta y hace un daño distinto.

### Cuatro objetivos en vez de dos

| Marcador | Le haces | Te cuesta |
|---|---|---|
| Ganas 3-0 | `525` | `75` |
| Ganas 2-1 | `375` amplio · `270` ajustado | `150` · `180` |
| Pierdes 1-2 | `180` ajustado · `150` amplio | `270` · `375` |
| Pierdes 0-3 | `75` | `525` |

El modelo calcula los cuatro con el plan ya elegido —hacen falta para poder
elegirlo—, pero en pantalla solo sale el que has pedido: se probó a enseñar los
cuatro en barras y **cargaba la vista sin decidir nada**, así que fuera.

Los dos de perder no son un capricho. El **1-2** es la derrota más barata que
hay, que es lo que sirve para pelear solo por verle las guardias. El **0-3** es
justo el contrario: el que menos daño le hace a él, o sea la forma de regalarle
una victoria a un compañero sin estropearle el casco.

### El daño al rival, que faltaba

Dos cifras y se acabó: **cada cuánto sale el marcador** que has pedido, y
**`Casco del rival −525`** justo debajo. Nada más.

Y es el daño **de ese marcador**, no la media de todo. La diferencia no es
menor: en una partida real salía `−410`, que era `2/3 × 525 + 1/3 × 180` —
mezclaba el 3-0 que buscabas con el 1-2 que caía el resto de las veces, y
puesto debajo de un botón que dice «Ganar 3-0» se leía como el daño de un 3-0
sin serlo. Ahora un 3-0 dice `525` siempre, y el `67 %` de al lado ya cuenta
cada cuánto pasa. En los 2-1 sigue siendo una media, pero **solo entre amplio y
ajustado**, que es justo lo que uno quiere saber.

Solo el suyo. **Tu propio casco se calcula igual** —el modelo lo necesita para
elegir el plan— pero no se enseña: al decidir un ataque lo que se mira es lo que
le haces a él. Lo mismo en **Simular el abordaje**, que enseñaba el tuyo y una
suma de vida que no decidía nada.

De paso desaparece una duplicación fea: la tabla del casco estaba en `pvp.js` y
en `rules.js` a la vez, y la simulación usaba su propia copia con otras claves
(`tres` / `amplio` / `ajust`). Ahora hay **una sola tabla**, y la simulación
saca de ahí el daño con la misma clave que el modelo.

### «Exacto» no quiere decir «seguro»

Un caso que confundía, y con razón: el sello decía **Exacto** y al lado un
`67 %`. Parecían contradecirse.

No lo son. *Exacto* quiere decir que el número **no se estima** —conoces sus
tres guardias, no hay nada que adivinar—, pero el servidor sigue **sorteando
cuál de las tres te sale**. Ese 67 % es `2/3`: contra dos de sus guardias sacas
el marcador que has pedido, contra la tercera no.

Así que ahora lo dice: **`2/3 de sus guardias dan ese marcador`**, justo al lado
del sello. El número ya no hay que deducirlo.

La tabla del casco se sube de `pvp.js` a `rules.js`, con las **dos caras** de
cada marcador, porque ahora la necesita también el modelo. De paso quedan ahí el
`1,25×` que parte un 2-1 en amplio o ajustado, el `+10 %` por puesto vacío y el
umbral del Kit de Reparación de Emergencia (`450`, repara `600`).

### La regla que responde a la pregunta

De la guía v5.1, y no estaba en ningún sitio del sitio:

> El casco del **ganador se desgasta pero nunca se destruye**. En un combate solo
> puede hundirse un barco, y nunca el del que gana.

O sea que **perdiendo a propósito no se hunde a nadie**, por muy bajo que le
dejes el casco. Está donde tiene que estar: punto `11` de la sección PvP de la
**Guía**, con la consecuencia útil —como el tope de daño en un combate es el
`35 %` de un 3-0 (`525`), solo se hunde a quien esté ya **a 525 o menos**—. En
el PvP no sale como aviso: es una regla del juego que se aprende una vez, no
algo que haya que repetir en cada cálculo.

### Menos avisos

Las cajas de consejo del PvP se van casi todas. Estorbaban más de lo que
decidían: la de «perdiendo no lo hundes», la de «aquí perder sale más barato», y
en el panel de guardias la predicción de su próximo ataque y la de «una sola
jugada suya te tumba las tres». Los mensajes que quedaban en caja y siguen
haciendo falta —las guardias que te faltan por poner, y contra qué se está
midiendo cuando no hay rival elegido— pasan a ser **una línea de texto**.

Sobrevive uno solo en caja: cuando pides perder y **no puedes**, porque es lo
único que impide conseguir lo que has pedido.

Con eso se quedan sin uso **21 claves** de texto por idioma, que se retiran.

### El banquillo del rival

Faltaba entero. Cada rival tiene ahora **dos huecos de reserva**, con los mismos
tres estados que un puesto de guardia (sin averiguar / vacío / alguien), y el
modelo los usa de verdad. Las tres reglas de la guía, que no son las que uno
supone:

- una reserva entra por un defensor **Caído** — quien esté a 1 de vida mantiene
  su puesto
- pelea con la táctica de **su propio hueco**, no con la del caído
- una reserva que esté caída **se la saltan**, y cuando el banquillo se acaba el
  puesto se queda **vacío y concede**

Antes un defensor caído dejaba el puesto en «desconocido» y ahí se acababa.
Ahora, si has apuntado su banquillo, el puesto sale exacto; si el banquillo se
agota, sale como duelo regalado; y si no has apuntado nada, se queda en
desconocido como siempre — que tú no la hayas visto no significa que no la
tenga.

Quien esté en el banquillo **sale del reparto de guardias plausibles**, porque
la guía dice que una reserva no puede estar además defendiendo. Para no tener
que traducir índices, `suyos` se ordena a propósito: primero los que pueden
defender, y el banquillo detrás.

La pantalla avisa de las dos cosas que el juego no permite —la misma persona en
los dos huecos, o una reserva que además defiende— pero **no bloquea**: esto es
lo que tú viste, y si choca es que algo se apuntó mal.

### Guardias recomendadas sin rival elegido

Antes, sin rival, la pestaña no decía nada. Ahora mide contra el **techo**: los
once personajes de mayor puntuación del juego, con las guardias sin apuntar. No
es nadie real y la pantalla lo dice; es el peor caso razonable. Lo que aguante
contra eso aguanta contra cualquiera. Tarda `143 ms`.

### Por dentro

- El bucle de búsqueda cuenta ahora los cuatro marcadores por separado con
  máscaras de bits (`p&q&r`, exactamente dos, exactamente una, ninguna) y elige
  por **cuatro cifras en orden** en vez de por una torre de ternarios que ya no
  cabía: el marcador que pides, que el combate acabe del lado que quieres, los
  duelos, y la puntuación al final. Esa última es la que decide si el 2-1 sale
  amplio o ajustado.
- El `ts` de un rival y su banquillo **viajan dentro del código compartido**, y
  el banquillo se fusiona hueco a hueco con la misma regla que las guardias.
  Los códigos viejos se siguen leyendo.
- El modo guardado del navegador se traduce solo: quien tuviera `perder` pasa a
  `1-2`.

### Comprobaciones

`22/22` en el banco nuevo, y lo que más tranquiliza son dos invariantes:

- las cuatro probabilidades **suman exactamente 1** en los cuatro modos, que es
  lo que prueba que los marcadores son una partición y no se cuela ni se pierde
  ningún par
- pedir un marcador da **el mejor valor de ese marcador** de los cuatro planes
  posibles, comprobado uno contra otro

Y el daño sale clavado de la tabla: ganando 3-0 siempre, `5 %` / `35 %` y
`75` / `525`; perdiendo 0-3 siempre, al revés. Las reservas entran por el caído
con su propia táctica, el banquillo agotado concede, y sin apuntar nada el
puesto sigue estimándose.

`18` cadenas nuevas por idioma (`734` cada uno) y las nueve páginas sin claves
crudas.

### Además

El menú pasa a **Mi tripulación → Mi alianza → Mis rivales**, y las tarjetas de
la portada con él. De paso se arregla la numeración de los comentarios del HTML,
que se había quedado descuadrada al meter la alianza.

---

## 1.9.0 — 24 ago 2026

**Mi alianza: la libreta de rivales deja de ser tuya sola.** Hasta 10 personas
comparten lo que van averiguando. Una guardia cuesta una pelea de descubrir;
entre diez, se descubre diez veces más rápido.

### Cómo está montado

Firebase Realtime Database, hablado con `fetch` a pelo: sin SDK, sin CDN y sin
nada que compilar. El sitio sigue siendo el mismo HTML+JS y sigue en GitHub
Pages; lo único que se mueve es dónde viven los rivales.

La idea que lo hace sencillo es que **cada uno escribe solo en su propio hueco**:

```
alianzas/{codigo}/miembros/{miId}    <- aquí escribo yo, y solo yo
alianzas/{codigo}/miembros/{otro}    <- de aquí solo leo
```

Como nadie escribe donde escribe otro, no hay conflictos que resolver: ni
bloqueos, ni transacciones, ni «quién llegó antes». *Actualizar rivales* son
tres pasos: subo la mía, me bajo las de todos, las junto aquí.

### La regla de fusión

Lo pedido era «en caso de duplicados, la versión más reciente de cambios».
Aplicado al rival entero eso **pierde información**: si tú sabes su guardia 1 y
un compañero sabe la 2, el que guarde después borra lo del otro — justo lo
contrario de lo que se busca.

Así que se aplica la misma regla, pero **pieza a pieza**:

| Dato | Qué pasa al juntar |
|---|---|
| Su tripulación | Se unen las dos listas. El estado, del más reciente. |
| Cada puesto de cada guardia | Si uno lo sabe y el otro no, se copia. Si los dos lo saben y **difieren**, gana el más reciente. |
| Sus ataques | Se juntan sin repetir, los recientes delante. |

Nunca se pierde algo que alguien averiguó, y la fecha decide solo cuando hay
contradicción de verdad.

Para esto cada rival lleva ahora un `ts` con la fecha de su último cambio, que
se refresca en cada edición y **viaja dentro del código compartido**. Los
códigos viejos, sin `ts`, se leen igual (entran con fecha `0`, así que ceden
ante cualquier versión fechada).

### Lo que también cambia sin ser de la alianza

**Importar ya no sustituye, complementa.** El código de texto de *Mis rivales*
usa la misma fusión, así que compartir a mano dejó de pisar lo que sabías.

### Detalles que salieron probando

- Firebase **se come los arrays vacíos**: un `rivales:[]` desaparece del JSON.
  Por eso la libreta viaja como el código de texto que ya existía (`OPMR1:…`,
  unos 160 caracteres por rival) y no como estructura anidada.
- Después de fusionar se **vuelve a subir**. Así lo que te cuenta uno le llega
  al resto sin que tengáis que coincidir: la información circula sola.
- Tu propia fila del listado se corrige a mano tras ese segundo envío, porque la
  que vino del servidor es de **antes** de juntar nada.
- En inglés el «hace» iba vacío y salía « 4 min» en vez de «4 min ago». Las
  cadenas de tiempo pasan a plantilla (`hace {n} {u}` / `{n} {u} ago`).

### Seguridad, dicha claramente

Sin cuentas ni contraseñas, **el código de la alianza es la única llave**. Se
compensa con lo que se puede: 10 caracteres al azar de un alfabeto sin `O/0` ni
`I/1/L`, y unas reglas que **no dejan listar qué alianzas existen** — solo leer
una si ya sabes su código, y escribir únicamente dentro de un hueco de miembro.
Comprobado contra el servidor: leer la raíz da `401`, listar `/alianzas` da
`401`, y un código corto se rechaza.

Adivinar deja de ser viable. Filtrar el código en el chat equivocado, no.

### Consecuencia que conviene saber

Como nunca se borra nada, si **quitas un rival** de tu libreta y luego
actualizas, vuelve si algún compañero lo tiene. Para quitarlo de verdad hay que
quitarlo todos. Está avisado en la Guía.

### Lo demás

- Pestaña nueva entre *Mis rivales* y *PvE*; tarjeta `04` en la portada, y el
  resto corre hasta `08`.
- Sección `18` de la Guía: qué se comparte, qué no sale nunca de tu navegador,
  cómo funciona la fusión y el aviso de arriba.
- `54` cadenas nuevas por idioma. Paridad ES/EN comprobada: `715` claves cada
  uno.

### Comprobaciones

- `24/24` en el banco de fusión: complementar en los dos sentidos, la fecha
  mandando solo en contradicción, un rival nuevo entrando entero, ataques sin
  duplicar, el `ts` sobreviviendo al viaje y los códigos sin caracteres
  ambiguos.
- `16/16` contra el servidor real, con tres miembros de verdad: UNO sube su
  guardia 1, DOS entra con su guardia 2 y acaba con las dos, y TRES entra sin
  nada y recibe todo. Funciona también abriendo el archivo suelto (`file://`).

---

## 1.8.1 — 22 ago 2026

**Los desplegables de un puesto se leen.** Elegir quién va en una guardia era
incómodo: el nombre iba sin marco, a 12 px y apretado entre el número de
posición y la táctica, con los tres puestos en fila. Un nombre largo como
«San Ethanbaron V. Nusjuro» no cabía.

Ahora cada puesto apila sus dos desplegables, y los dos tienen el mismo aspecto
que el de elegir isla del PvE: marco, fondo, flecha y `13 px`. La táctica se
queda algo más discreta debajo, que es lo secundario del puesto.

Vale para los tres formularios a la vez —las guardias del rival, las tuyas y el
de sus ataques— porque el estilo se apunta al elemento (`.puesto select`) y no a
las seis clases que usa el JS para distinguirlos.

---

## 1.8.0 — 22 ago 2026

La teoría se muda a la Guía. Las pestañas se quedan con la herramienta y una
explicación corta.

### Lo que se ha movido

De **PvE** salen los cinco paneles de texto: si ganas, si pierdes, si te hundes,
si no queda nadie en pie y cómo sacarle más. De **PvP** salen los seis de
consulta: cómo se puntúa un duelo, lo que cuesta cada duelo, lo que cuesta
perder, la tabla de casco, tus guardias y cuándo puedes atacar.

Antes de quitarlos se comprobó qué cubría ya la Guía, y había cosas que **no**.
Se han añadido en vez de perderse:

- El `10 %` del oro que se lleva el ganador de un abordaje, y el `20 %` más un
  poneglifo si te hunde.
- Las **condiciones para atacar**: ninguno de los dos aturdido, él sin
  protección de novato, tú con al menos uno en pie, y sumergido solo contra
  sumergido.
- Que **hundirse cura del todo** — casco lleno y todos a tope, tumbados
  incluidos. En PvE, además, el oro que pierdes **se quema**: no lo cobra nadie.

### Sección nueva: «Cómo calcula este sitio»

La `17` de la Guía. Ya no son reglas del juego sino cómo saca sus números la
página, que es lo que hacía falta para poder recortar las notas largas de PvP y
PvE sin dejarlas huérfanas. Dice cuándo el número es **exacto** y cuándo es una
**estimación**, cómo se construyen las formaciones plausibles, qué criterio
siguen las guardias recomendadas, cómo pesa la predicción del último ataque, y
—esto importa— **qué no se calcula**: el `+10 %` de casco por puesto vacío y la
vida real de cada uno.

### En las pestañas

Cada una conserva una entradilla de dos líneas y una nota al pie que lleva a la
Guía. Las notas de método que salían bajo cada cálculo pasan de cinco líneas a
una.

De paso se corrigieron dos descripciones `<meta>` que seguían diciendo que el
PvE era «50 % de victoria».

---

## 1.7.4 — 22 ago 2026

Las dos incógnitas de la auditoría, resueltas por el usuario.

### El «2-1 amplio» cuenta los críticos

Faltaba saber si «las tres puntuaciones del ganador» son las de base o las del
duelo ya resuelto. Son las **del duelo ya resuelto**: con el contador aplicado.
Tiene sentido — si el crítico es lo que decide quién gana, es lo que debe contar
para medir por cuánto.

Cambiado en `pvp-model.js` (el marcador de cada escenario) y en la simulación
del abordaje. No es un detalle sin efecto: el contador multiplica al ganador, así
que **más 2-1 cruzan el umbral de `1,25×` y pasan de ajustado (`18 %`) a amplio
(`25 %`)**. En una prueba, de `144` derrotas 2-1 ajustadas se pasó a `96`
ajustadas y `48` amplias.

Consecuencia sobre el consejo de la `1.7.0`: cuando eres más débil, perder a
propósito sigue saliendo más barato que intentar ganar, pero la ventaja baja de
`0,8` a `0,3` puntos de casco.

### El PvE ya estaba bien

Las tácticas de los tres enemigos salen al azar **sin relación entre ellas**, y
mantienen su orden. Era exactamente lo que suponía el cálculo, así que no hubo
que tocar nada — solo dejarlo escrito en `pve.js` para que no vuelva a
levantarse la duda.

---

## 1.7.3 — 22 ago 2026

Auditoría de la lógica del PvP y del PvE. Un fallo real encontrado y
corregido; el resto, comprobado.

### El fallo: la comparación de guardias era injusta

En «Tus guardias contra él», si solo tenías **dos** de tus tres guardias
apuntadas, `aguante()` dividía entre 2 y `mejoresGuardias()` entre 3. O sea que
se comparaban **tus dos mejores contra tres recomendadas**, y el número te
salía regalado: la guardia que falta es justo la que no contaba.

Ahora la comparación solo se hace con las tres puestas. Si faltan, se dice
cuántas y no se enseña ningún número.

### Comprobado y correcto

- **El empate va al defensor.** `duelWin` usa `>` estricto: atacando hay que
  superar, defendiendo basta con igualar.
- **La fórmula de «2 de 3»** del PvE es la correcta.
- **La regla de repetición** entre guardias se cumple sola por construcción, y
  se verificó para tripulaciones de 3, 4 y 5.
- **El daño por duelo** (`34 %` / `8 %` / `×0,6` contrarrestando) y el casco por
  marcador coinciden con la guía.
- **Las dos rutas de cálculo defensivo** (`aguante` y `mejoresGuardias`) dan el
  mismo número sobre las mismas guardias.

### Tres cosas que no son fallos pero conviene tener presentes

Están anotadas en [PENDIENTES.md](PENDIENTES.md):

1. **El `+10 %` de casco por puesto vacío** está escrito en la página pero no se
   calcula. Hoy no cambia ningún número, porque el sitio siempre da por hecho
   que sales con tres.
2. **El «2-1 amplio» usa la puntuación con afinidad pero sin contador.** La guía
   dice «las tres puntuaciones del ganador» sin aclarar si incluyen los
   multiplicadores. Solo mueve algún 2-1 entre el `18 %` y el `25 %`.
3. **El PvE da por independientes las tres tácticas de la isla.** La guía no lo
   dice. Si la isla siguiera un patrón, las probabilidades cambiarían.

---

## 1.7.2 — 22 ago 2026

Retoques de presentación en las dos alineaciones.

- En el **plan de ataque del PvP**, la táctica recomendada pasa a ir **pegada al
  nombre** del personaje, con el rol debajo. Antes se iba al centro de la fila y
  costaba relacionarla con quién la juega.
- La **alineación del PvE** se iguala a esa misma forma: táctica en pastilla de
  color al lado del nombre, rol y desgaste medio debajo, y a la derecha una
  ficha con el enemigo que le toca y cuántas de sus tres tácticas le gana
  (`Stussy 2/3`), con el mismo código de color que el PvP — verde si le ganas
  las tres, dorado si unas sí y otras no, rojo si ninguna.

De paso el PvE gana algo que no tenía: **el rol de cada uno**, que en el PvP sí
se veía.

---

## 1.7.1 — 22 ago 2026

Arreglo de entrega, no de código: **los archivos ahora llevan versión**.

### Qué pasaba

Tras subir la `1.7.0`, los botones de Ganar / Perder salían con su clave de
traducción (`pvp.plan.modeWin`) y no respondían.

El código estaba bien y estaba publicado — se comprobó pidiendo los dos
archivos a la web. Lo que fallaba era la **entrega**: GitHub Pages manda
`Cache-Control: max-age=600`, así que durante diez minutos el navegador usa lo
que tiene sin preguntar. Quien tuviera la página abierta se quedó con el **HTML
nuevo y los `.js` viejos**.

El propio síntoma lo delataba: si `i18n.js` no cargara, el botón habría puesto
«Ganar», que es el texto de reserva del HTML. Que saliera la clave significa que
sí se estaba ejecutando un `i18n.js`, pero uno que no la conocía.

### El arreglo

Cada `.js`, `.css` y el icono llevan ahora la versión pegada
(`assets/js/i18n.js?v=1.7.0`) en las ocho páginas. Al cambiar el número el
navegador lo trata como otro archivo y lo pide entero, así que un cambio nunca
puede llegar a medias.

El procedimiento para subirlo en cada publicación está en
[README.md](README.md), con la orden hecha.

---

## 1.7.0 — 21 ago 2026

El plan de ataque tiene dos objetivos: **Ganar** y **Perder 2-1**. Idea de un
amigo del usuario.

### Por qué tiene sentido perder a propósito

Porque no todas las derrotas cuestan lo mismo. Un `0-3` te deja el casco a
`−35 %`; un `2-1` **ajustado**, a `−18 %`. Así que si la pelea está perdida,
importa mucho cómo la pierdes.

Y hay una tensión que hace el problema interesante: un `2-1` solo cuenta como
ajustado si el ganador **no** te saca `1,25` veces en puntos. O sea que hay que
**puntuar alto y aun así perder dos duelos** — mandar a los peores no vale,
porque eso da un `2-1` amplio (`−25 %`) o directamente un `0-3`.

### El criterio

1. Maximizar los escenarios en que ganas **exactamente un duelo**.
2. A igualdad, **ganar lo menos posible**: de nada sirve un plan que cae 2-1
   muchas veces si el resto se lleva el combate.
3. Y solo entonces la puntuación, que es lo que hace ajustado ese 2-1.

Reaprovecha las máscaras de bits que ya había: «exactamente uno» sale de
`(a&~b&~c) | (~a&b&~c) | (~a&~b&c)`, con una máscara extra que apaga los bits
sobrantes del último word para que el `~` no los encienda.

### Lo que enseña

La cifra grande pasa a ser **cuántas veces caes 2-1**, y al lado el **casco que
te cuesta de media**, que es lo que decide de verdad si compensa. Se calcula
recorriendo las formaciones una vez más y clasificando cada escenario por
marcador (`3-0`, `2-1` amplio, `2-1` ajustado, y sus tres inversos).

Dos avisos automáticos, que son la parte útil:

- **No puedes perder a voluntad**: sale cuando le ganas tanto que ni queriendo
  caes más de la mitad de las veces.
- **Aquí perder sale más barato que intentar ganar**: sale cuando te supera lo
  suficiente como para que el plan de ganar acabe en `0-3` a menudo.

Medido con tres emparejamientos: si eres mucho más fuerte, el plan de perder
cuesta `14,9 %` de casco contra `12,3 %` el de ganar — o sea que no compensa.
Si vais parejos, caes 2-1 el `61 %`. Y si eres más débil, el plan de perder
cuesta `20,6 %` contra `21,4 %` del de ganar: **perder bien sale más barato que
intentar ganar mal**.

---

## 1.6.0 — 21 ago 2026

La **Guía** deja de ser un esqueleto: ahora tiene toda la información del juego.

### Cómo está montada

Diecisiete pliegues numerados, en **orden de aprender**, no en el orden de la
guía oficial. Alguien que empieza puede leer de arriba abajo; quien ya juega
abre solo el que necesita.

`01` Empezar · `02` Tu tripulación · `03` Los roles · `04` El duelo ·
`05` Navegar · `06` Desembarcar (PvE) · `07` Atacar · `08` Defenderte ·
`09` Conquistar · `10` IMU · `11` Oro y tienda · `12` El mercado ·
`13` Poneglifos y el final · `14` Rankings y títulos · `15` Alianzas ·
`16` Temporadas y tu cuenta · `17` Todos los números.

Botones de **abrir y cerrar todo**, y cada pliegue recuerda cómo lo dejaste.

### La versión, siempre arriba

Un panel fijo con la versión de la guía oficial que sigue el sitio y su fecha.
Sale de `window.GUIA` en `assets/js/guide.js`: **se toca en un solo sitio** y
cambia en la página.

### La chuleta se calcula sola

La sección `17` no está escrita a mano. Las fórmulas y constantes salen de
`rules.js` — el mismo código que usa el sitio para calcular — así que si un día
cambia una fórmula, la tabla cambia con ella y no puede quedarse desfasada.

Las fórmulas se escriben una sola vez y se adaptan al idioma: en español el
decimal es coma y el separador de argumentos punto y coma (`mín(0,9 ; 0,3 + …)`),
y en inglés se invierte y la inicial de Fuerza pasa a ser `S` de Strength.

### Números

`134` claves de texto nuevas por idioma para el contenido, más `42` para la
chuleta. El diccionario pasa de `438` a `619` claves en cada idioma.

---

## 1.5.2 — 21 ago 2026

- **La información del PvP vuelve.** En la 1.5.1 quité el desglose y me llevé
  por delante el contenido, que no era lo pedido. Los cinco paneles de consulta
  (puntuación de un duelo, daños, coste de perder, tabla de casco, reglas de
  guardias y cuándo puedes atacar) están otra vez, ahora sueltos y siempre a la
  vista.
- **Icono del sitio.** La misma brújula de la cabecera, en `assets/favicon.svg`,
  enlazada desde las ocho páginas. Va sobre un cuadrado del color del fondo para
  que se lea a `16 px` y también con el navegador en tema claro.
- **El título de la portada** se queda en `OP-MAPS DATA`, sin el "Compendio del
  juego" detrás.

---

## 1.5.1 — 21 ago 2026

Ajustes de colocación, y un fallo de CSS de la versión anterior.

- **Mis rivales** pasa a ir detrás de Mi tripulación, en el menú y en la
  portada. Las tarjetas se renumeran solas.
- **Importar y exportar** suben a lo primero de Mis rivales, uno al lado del
  otro, y dejan de ir plegados.
- **Fuera el desglose de reglas del PvP.** Lo que explicaba (puntuación de un
  duelo, daños, tabla de casco, reglas de guardias, cuándo puedes atacar) sigue
  en `i18n.js` sin usarse: es material de consulta y su sitio natural es la
  Guía, cuando se escriba.
- **La tripulación del rival es plegable** y sus miembros ya no enseñan su mejor
  puntuación: ahí solo interesa quién es y en qué estado está.

### El fallo de CSS

Los tres formularios de puesto usan clases distintas para que el JS los
distinga —`p-` las guardias del rival, `g-` las tuyas, `a-` el formulario de
ataques— pero el CSS solo tenía regla para `p-`. Los otros dos salían con los
desplegables por defecto del navegador. Ahora la regla cubre los tres.

De paso, `.botin.neutro` tampoco tenía color y heredaba el del contenedor.

---

## 1.5.0 — 21 ago 2026

Guía `v5.1`, libreta de rivales con página propia, y tus guardias entran en el
cálculo.

### Guía v5.1

Actualización pequeña y toda del **Recubrimiento de Submarino**, que zanja la
contradicción que arrastrábamos con el texto de la tienda. Manda la guía:
sobrevives **sin daño** y sin perder oro ni poneglifos; el recubrimiento se
gasta igual; y te deja **sumergido 120 min** (o sales a flote enseguida si ya
estabas abajo). No salta si sigues aturdido cuando cae el rayo. Aplicado en
`items.js`, y de paso se pusieron al día todas las referencias a la versión de
la guía por el sitio, incluido el pie de página.

### Mis rivales, en su propia pestaña

La libreta sale del PvP y pasa a `rivals.html`, con su entrada en el menú y su
tarjeta en la portada. El PvP ya no edita nada: solo lee y calcula.

Nuevo en la libreta: **sus ataques contra ti**, con si le salieron bien o mal.

### Compartir sin servidor

Un **código de texto** que se pega en el chat de la alianza. Un rival completo
ocupa unos `160` caracteres, así que la libreta entera cabe en un mensaje. Se
usan los números de ficha del álbum en vez de los nombres: ocupa mucho menos y
no se rompe al cambiar de idioma. Al importar, un rival con el mismo nombre se
sustituye.

**Por qué no un código de invitación**: para que diez personas vean una libreta
común hace falta un servidor donde viva, y esto es un sitio estático. Cualquier
backend metido aquí llevaría sus claves a la vista, o sea que cualquiera podría
leer y escribir en la libreta de la alianza.

### Tus tres guardias

Se apuntan en Mi tripulación, en un panel nuevo que avisa si te saltas las
reglas del juego (tres distintos por guardia; quien repite cambia de fila).

Con eso, el PvP enseña **lo que aguantan las que tienes puestas contra lo que
aguantarían las recomendadas**, con la diferencia entre ambas. Si lo que tienes
ya aguanta lo mismo, te lo dice y no tocas nada.

### La predicción del próximo ataque

La idea del usuario, y funciona: **la gente repite**. Si un ataque le salió bien
lo vuelve a mandar, y si le falló muchas veces lo intenta otra vez antes de
cambiar. Así que su último ataque apuntado deja de pesar como uno entre mil:

- le **salió bien** → pesa un `50 %` de la predicción
- le **falló** → pesa un `25 %`

Medido en la prueba, con el mismo rival y las mismas guardias: sin ataque
apuntado se aguanta un `74 %`; con su último ataque apuntado y ganador, `87 %`;
y si le falló, `80,6 %`.

### Comprobaciones

`aguante()` (evalúa unas guardias concretas) y `mejoresGuardias()` (busca las
mejores) llegan al mismo número sobre las mismas guardias, que es la
comprobación cruzada de que las dos rutas de cálculo concuerdan.

---

## 1.4.0 — 19 ago 2026

Reordenada la página de PvP, y arreglado en las dos páginas por qué salían
personajes flojos en las alineaciones.

### Por qué salían personajes que no pintaban nada

Dos causas, las dos mías:

1. **Se probaba el orden invertido.** Entre las formaciones plausibles del rival
   se incluía el orden «sus peores primero», que nadie usa. Eso llenaba el
   cálculo de guardias imposibles con sus personajes más flojos, y el plan
   recomendado salía afinado contra ellas. Fuera.
2. **No había desempate por fuerza.** Muchísimos planes empatan en resultado, y
   se quedaba con el primero que salía del bucle. Ahora, a igualdad de guardias
   ganadas y de duelos sueltos, gana el trío con más puntuación. Mismo
   resultado, mejor gente.

Lo mismo se aplicó al panel de defensa.

### El mismo fallo, también en el PvE

El PvE elegía alineación con exactamente los dos mismos empates mal resueltos:

- **La táctica de cada uno** se elegía con `>` estricto, así que a igualdad de
  tácticas ganadas se quedaba siempre con Asalto por ser la primera de la lista.
  Ahora, a igualdad, gana la de más puntuación.
- **El trío** se quedaba con el primero del bucle cuando empataban probabilidad y
  duelos, o sea con el orden en que metiste la tripulación.

Y un cuarto criterio nuevo, para cuando dos de los tuyos son de verdad
intercambiables (los dos ganan las 3 tácticas de su enemigo, y la suma no los
distingue): se **empareja al más fuerte tuyo con el enemigo más fuerte**.
Maximizar la suma de los productos hace justo eso y deja el mayor margen donde
más apretado está el duelo.

### La página, en desgloses

Cuatro secciones que se abren y se cierran, y recuerdan cómo las dejaste:
**Rivales**, **Tu plan de ataque**, **Tus guardias contra él** y **Las reglas
del PvP**. Con varios rivales apuntados la página ya no se estira.

- **Cada rival es su propio desglose** dentro de Rivales, con su nombre, cuántos
  tripulantes le has apuntado (`5/11`) y cuántas guardias tienes averiguadas
  (`1/3`). Se abren de uno en uno, y el que acabas de crear se queda abierto.
- **Tope de 11.** Al llegar a `11/11` desaparece el campo de añadir, que es el
  tope de tripulantes del juego.
- El selector **Contra quién** vive fuera de los desgloses, porque manda sobre
  ataque y defensa a la vez.

### Fuera

- **El triángulo de tácticas.** Lo que explicaba ya está en «Cómo se puntúa un
  duelo», dentro de las reglas.
- **La tira de tus personajes con el interruptor de caído.** Se da por hecho que
  tu tripulación está entera: quién esté tocado cambia cada media hora y no es
  lo que se viene a mirar aquí. Los estados del RIVAL se quedan, que esos sí son
  información que recoges tú.

### Arreglos

- Colisión de nombres en el CSS: la clase `desglose` ya existía con
  `display:flex` y descuadraba las secciones nuevas. Las nuevas pasan a
  llamarse `plegable`.

---

## 1.3.0 — 19 ago 2026

El PvP responde ahora las dos mitades: cómo le ganas y cómo te defiendes.

### Sus guardias, por lista

En una guardia suya solo puede haber gente suya, así que el puesto pasa de
campo de texto contra los 226 a un **desplegable con su tripulación**, más
«sin averiguar» y «puesto vacío». Si en el guardado hubiera alguien que ya
no está en su tripulación, se le deja como opción para no borrarlo por la
espalda.

### Tus guardias contra él

Panel nuevo, y es el problema espejo. Cambian tres cosas respecto al ataque:

- **El empate es tuyo**: defendiendo basta con igualar.
- **Él elige un plan y el servidor sortea una de tus guardias.** Él apunta a un
  sitio y tú repartes el riesgo entre tres. Lo que decide no es tener una
  guardia buenísima, sino que **ninguna jugada suya se lleve varias a la vez**.
- **No sabes con qué va a atacar**, así que se mide contra todos los planes que
  podría montar con su tripulación.

Se prueban todas las guardias que puedes montar contra todos sus ataques
posibles y se eligen las tres que menos caen en conjunto, respetando la regla
del juego de que quien repite entre guardias cambia de fila.

Se enseñan **dos números**: lo que aguantas de media, que es lo que manda, y lo
que aguantarías si te estudiara y eligiera su mejor jugada. Si existe un plan
suyo que tumba tus tres guardias, sale un aviso: mientras no las conozca da
igual, pero los informes de combate se comparten.

**Por qué la media y no el peor caso.** Optimizar contra su contra perfecta
sería paranoia: te haría elegir guardias peores contra todo lo que de verdad te
va a mandar. El peor caso se calcula igual, pero solo como aviso.

**Cómo se busca.** Probarlas todas es inviable, y quedarse con «las N mejores
sueltas» tampoco vale: las mejores guardias suelen poner al mismo personaje en
el mismo puesto y entonces ninguna pareja cumple la regla de repetición. Así
que se arranca de `25` semillas distintas y se mejora cada guardia por
separado. Tarda entre `10` y `150 ms`.

---

## 1.2.0 — 19 ago 2026

El PvP deja de tratar lo desconocido como perdido y pasa a estimarlo.

### Qué se sabe de un rival, y qué no

La guía v5.0 aclara que **antes de atacar sí ves su tripulación** y la banda de
salud de cada uno (Sano `70-100 %`, Herido `30-69 %`, Crítico `1-29 %`, Caído
`0 %`). Lo que no ves son sus guardias. El sitio ahora separa las dos cosas:

- **Su tripulación** se apunta con el estado de cada uno. Un **Caído** no puede
  defender: en su puesto entra una reserva desconocida, así que ese puesto se
  estima aunque lo tuvieras apuntado.
- **Sus guardias** siguen apuntándose a mano, pero ya no hacen falta para
  empezar: con la tripulación basta para tener un número.

### El motor (`assets/js/pvp-model.js`)

Archivo nuevo, con toda la matemática separada de la interfaz.

- **Simplificación de fondo.** Como el servidor sortea una guardia entre las
  suyas de forma uniforme, cada guardia aporta exactamente `1/n`. No hace falta
  razonar sobre conjuntos de guardias: basta con ir guardia a guardia.
- **Formaciones plausibles.** Se construyen cruzando dos ejes: *quién defiende*
  (sus mejores, repartidos en ventana cíclica, que cumple sola la regla del
  juego de que quien repite cambia de fila) y *qué tácticas*, con los tres
  estilos que se ven en la práctica — una por guardia, una de cada, o dos de una
  y una de otra. Las tres familias pesan lo mismo, porque si no «dos de una»
  arrasaría solo por ser `18` de los `27` repartos posibles.
- **Inferencia.** Lo que hayas apuntado descarta las formaciones que no encajan.
  En la práctica, apuntar **una sola guardia** baja el espacio de `540`
  formaciones a `6-12`, y de paso dice qué estilo usa el rival.
- **Velocidad.** Cada posición tuya solo pelea contra su homóloga, así que se
  precalculan máscaras de bits y «gano 2 de 3» se resuelve con
  `(a&b)|(a&c)|(b&c)` y un contador de bits. El peor caso — no saber nada de un
  rival con cinco personajes — tarda `60 ms`.

### En la página

- El número viene con un sello: **Exacto** si conoces sus tres guardias,
  **Estimado** si no, y en ese caso cuántas formaciones quedan en pie y qué
  estilo parece usar.
- Cada posición de tu plan enseña contra quién pelearía y cuántas veces gana
  (`6/12`), en vez de un solo rival fijo.
- **Los tuyos que estén caídos** se marcan tocándolos y quedan fuera del plan.
- La simulación sortea dos veces: qué formación es la de verdad y qué guardia
  elige el servidor. Avisa de cuándo la guardia sale de una suposición.

### Arreglos

- Se cae el apaño de contar los puestos sin apuntar como perdidos. Ya no hace
  falta: ahora se estiman.

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
- **Limpieza de las fuentes.** Todo lo ya volcado al sitio (la guía `v4.0`, los
  export `Island.html` y `Data Crews.html`, los simuladores viejos y la carpeta
  `Personajes/`) se apartó a `Desktop/Programas/OPMAPSDATA-ARCHIVO/`. `CONTEXTO/`
  pasa de **5,7 MB a 141 KB** y se queda solo con lo vivo: la guía `v5.0`, las
  novedades, el álbum en los dos idiomas y la tienda.

---

## 1.0.0 — 17 ago 2026

Primera versión publicada en GitHub Pages. Portada, Data Crew con los 226
personajes (lista y álbum), Mi tripulación, PvE con las 155 islas y PvP.
Bilingüe ES/EN. Consejos y Guía quedaron como esqueletos.
