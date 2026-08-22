# Cambios del sitio

Lo más nuevo arriba. Para saber qué versión de cada fuente se sigue ahora,
mira [VERSIONES.md](VERSIONES.md).

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
