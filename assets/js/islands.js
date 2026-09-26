/* ============================================================
   OP-MAPS DATA - las 160 islas del mapa y sus enemigos
   ------------------------------------------------------------
   TEMPORADA 9. Volcado el 25 sep 2026 desde
   `CONTEXTO/Islas temporada 9 - Island.csv`, que es el export del juego.

   Cada temporada va fijada a una version publicada del mapa, asi que
   esta lista es de la 9 y solo de la 9: cambia entera al empezar la
   siguiente. Lo de temporadas anteriores esta en el historial de git.

     m = mar, indice sobre ISLAND_SEAS
     n = nombre de la isla, en ingles como en el juego
     es = su nombre en espanol, solo si hace falta. Sin el se ensena `n`
          en los dos idiomas, que es lo normal. La identidad de una isla
          es SIEMPRE `n`, tambien para las correcciones del usuario
     o = orden dentro de su mar. Lo numero el usuario a mano y se
          conserva para las islas que siguen existiendo; las nuevas van
          detras, en el orden del export
     xy = donde esta en el mapa, [x, y]. Solo la traen las islas que
          venian con Location en el export; las demas se rellenan
          desde el editor del PvE
     e = los tres enemigos, en el orden en que salen: el primero pelea
          contra tu posicion 1, el segundo contra la 2 y el tercero
          contra la 3

   27 islas van con la lista de enemigos VACIA, y eso significa
   PENDIENTE: son las que aun no se han comprobado en el juego, no islas
   sin combate. El PvE lo dice y las marca en la lista.

   El usuario puede corregir esta lista desde el PvE sin tocar el
   archivo: lo que edite se guarda en su navegador y solo ahi.
   ============================================================ */
window.ISLAND_SEASON = "9";

window.ISLAND_SEAS = ["West Blue", "South Blue", "North Blue", "New World", "Grand Line", "East Blue"];

window.ISLANDS = [
  {m:0, o:1, n:"Ilisia kigdom", e:[], xy:[572, 569]},
  {m:0, o:2, n:"1 ???", e:[]},
  {m:0, o:2, n:"2 ???", e:[]},
  {m:0, o:2, n:"Toroa island", e:["Borsalino", "Sakazuki", "Foxy"], xy:[446, 839]},
  {m:0, o:3, n:"3 ???", e:[]},
  {m:0, o:4, n:"4 ???", e:[]},
  {m:0, o:5, n:"5 ???", e:[]},
  {m:0, o:5, n:"Ohara", e:["Charlotte Katakuri", "Vander Decken IX", "Kalifa"], xy:[417, 1176]},
  {m:0, o:6, n:"6 ???", e:[]},
  {m:0, o:7, n:"Ballywood kingdom", e:["Uta", "Hyouzou", "Cavendish"], xy:[502, 1536]},
  {m:0, o:7, n:"Kano country", e:["Hajrudin", "Rocks D. Xebec", "Chew"], xy:[158, 1513]},
  {m:0, o:7, n:"God valley", e:["Kujaku", "Vinsmoke Yonji", "Bartolomeo"], xy:[670, 1410]},
  {m:1, o:1, n:"7 ???", e:[]},
  {m:1, o:1, n:"Karate island", e:[], xy:[642, 3750]},
  {m:1, o:2, n:"8 ???", e:[]},
  {m:1, o:2, n:"Sorbet kingdom", e:["Charlotte Daifuku", "Dracule Mihawk", "Urouge"], xy:[440, 3500]},
  {m:1, o:3, n:"9 ???", e:[]},
  {m:1, o:3, n:"Torino kingdom", e:["Silvers Rayleigh", "Vinsmoke Niji", "Shiryu"]},
  {m:1, o:3, n:"Centaurea kingdom", e:["Yasopp", "Kuroobi", "Queen"], xy:[190, 3153]},
  {m:1, o:4, n:"Judo island", e:["Sabo", "Charlotte Smoothie", "Mohji"], xy:[243, 2923]},
  {m:1, o:4, n:"10 ???", e:[]},
  {m:1, o:5, n:"11 ???", e:[]},
  {m:1, o:5, n:"Baterilla island", e:["Fukurou", "Nico Robin", "Denjiro"], xy:[191, 2621]},
  {m:1, o:6, n:"Briss kingdom", e:["Charlotte Smoothie", "Vander Decken IX", "Bartholomew Kuma"], xy:[457, 2435]},
  {m:2, o:1, n:"Swallow island", e:["King", "Kaku", "Van Augur"], xy:[1624, 745]},
  {m:2, o:1, n:"Downs island", e:[], xy:[1463, 719]},
  {m:2, o:1, n:"Flevance kingdom", e:[], xy:[1614, 565]},
  {m:2, o:1, n:"Rubeck island", e:[], xy:[1723, 662]},
  {m:2, o:2, n:"12 ???", e:[]},
  {m:2, o:2, n:"13 ???", e:[]},
  {m:2, o:2, n:"14 ???", e:[]},
  {m:2, o:2, n:"Minion island", e:["Monkey D. Dragon", "Shanks", "Saint Jaygarcia Saturn"], xy:[1704, 858]},
  {m:2, o:3, n:"Whiteland kigdom", e:["Franky", "Jozu", "Tilestone"], xy:[1857, 1217]},
  {m:2, o:4, n:"Lvneel kingdom", e:["Jabra", "Blue Gilly", "Enel"], xy:[1593, 1317]},
  {m:2, o:5, n:"Deul kingdom", e:["Caribou", "Paulie", "Kaido"], xy:[1522, 1490]},
  {m:2, o:6, n:"15 ???", e:[]},
  {m:3, n:"Whole Cake island", e:["Charlotte Cracker", "Miss Goldenweek", "Bon Clay"]},
  {m:3, n:"Prodence kingdom", e:["Caesar Clown", "Bartholomew Kuma", "Nekomamushi"]},
  {m:3, n:"Karai bari island", e:["Kumadori", "Vinsmoke Reiju", "Mohji"]},
  {m:3, n:"Mystoria island", e:["Miss Goldenweek", "Vivi", "Lilith"], xy:[1035, 188]},
  {m:3, n:"Risky red island", e:["Vinsmoke Reiju", "Avalo Pizarro", "Kuroobi"]},
  {m:3, n:"Green bit", e:[]},
  {m:3, n:"Doerena kingdom", e:["Kumadori", "Professor Clover", "Saint Marcus Mars"]},
  {m:3, n:"Broc coli island", e:["Saint Shepherd Ju Peter", "Buggy", "Franky"], xy:[1076, 637]},
  {m:3, n:"Komugi", e:["Aramaki", "Saint Marcus Mars", "Raizo"]},
  {m:3, n:"Ice", e:["Jesus Burgess", "Capone Bege", "Kyros"]},
  {m:3, n:"Milk", e:["Lao G", "Crocus", "Urouge"]},
  {m:3, n:"Yukiryu island", e:["Vergo", "Issho", "Iceburg"]},
  {m:3, n:"Ballon terminal", e:["Capone Bege", "Gecko Moria", "Chew"]},
  {m:3, n:"Onigashima", e:["Vinsmoke Reiju", "Saint Ethanbaron V. Nusjuro", "Queen"]},
  {m:3, n:"Hachinosu pirate island", e:["Miss Doublefinger", "Silvers Rayleigh", "Iceburg"]},
  {m:3, n:"Nuts", e:["Cabaji", "Jesus Burgess", "Kalifa"]},
  {m:3, n:"Kibo", e:["Fukurou", "Franky", "Hyouzou"]},
  {m:3, n:"Noko", e:["King", "Raizo", "Nami"]},
  {m:3, n:"Elbaf", e:["Monkey D. Garp", "Sanjuan Wolf", "Dr. Hogback"]},
  {m:3, n:"Funwari", e:["Sentomaru", "Usopp", "Miss Goldenweek"]},
  {m:3, n:"Sphinx island", e:["Viola", "Kozuki Sukiyaki", "Gin"]},
  {m:3, n:"Raijin island", e:["Rebecca", "Saint Shepherd Ju Peter", "Franky"], xy:[967, 219]},
  {m:3, n:"Dressrosa kingdom", e:["Jinbe", "Yasopp", "Urouge"]},
  {m:3, n:"Applenine island", e:["Buffalo", "Laffitte", "Saint Marcus Mars"]},
  {m:3, n:"Majiatsuka kingdom", e:["Rocks D. Xebec", "Charlotte Katakuri", "Trafalgar Law"]},
  {m:3, n:"Tanega", e:["Paulie", "Dracule Mihawk", "Kozuki Sukiyaki"]},
  {m:3, n:"Fruits", e:["Usopp", "Kuroobi", "Gecko Moria"]},
  {m:3, n:"Unique", e:["Dellinger", "Vegapunk", "York"]},
  {m:3, n:"Futoru", e:["Yamato", "Gladius", "Caesar Clown"]},
  {m:3, n:"Kimi", e:["Dr. Hogback", "Bepo", "Miss Goldenweek"]},
  {m:3, n:"Poripori", e:["Charlotte Katakuri", "Momonosuke", "Roronoa Zoro"]},
  {m:3, n:"Biscuits", e:["Karasu", "Porche", "Peepley Lulu"]},
  {m:3, n:"Rokumitsu", e:["Iceburg", "Izo", "X Drake"]},
  {m:3, n:"Candy", e:["Tsuru", "Donquixote Doflamingo", "Trebol"]},
  {m:3, n:"Potato", e:["Tsuru", "Donquixote Doflamingo", "Trebol"]},
  {m:3, n:"Cacao", e:["Charlotte Mont-d'Or", "Gladius", "Kuro"]},
  {m:3, n:"Jelly", e:["Marco", "Capone Bege", "Izo"]},
  {m:3, n:"Liqueur", e:["Jean Bart", "Inuarashi", "Usopp"]},
  {m:3, n:"Zou", e:["Shaka", "Bepo", "Tsuru"]},
  {m:3, n:"Egghead island", e:["Baron Tamago", "Urouge", "Caribou"]},
  {m:3, n:"Flavor", e:["Gol D. Roger", "Nico Olvia", "Gladius"]},
  {m:3, n:"Yakigashi", e:["Viola", "Hyouzou", "Yamato"]},
  {m:3, n:"Kinko", e:["Karasu", "Vinsmoke Niji", "Kikunojo"]},
  {m:3, n:"Milenge", e:["Caribou", "Jewelry Bonney", "Charlotte Brûlée"]},
  {m:3, n:"Loadestar island", e:["Monkey D. Garp", "Borsalino", "Jinbe"]},
  {m:3, n:"Fish-man island", e:["Hody Jones", "Baron Tamago", "Fukurou"], xy:[981, 93]},
  {m:3, n:"New marineford", e:["Killer", "Caesar Clown", "Ryuboshi"]},
  {m:3, n:"G-5", e:["Ulti", "Tsuru", "Basil Hawkins"]},
  {m:3, n:"Punk hazard", e:["Kuro", "Kalifa", "Morgan"]},
  {m:3, n:"Mogaro kingdom", e:["Rob Lucci", "Arlong", "Lucky Roux"]},
  {m:3, n:"Sanshoku", e:["Marshall D. Teach", "Baron Tamago", "Peepley Lulu"]},
  {m:3, n:"Piepie", e:["Borsalino", "Catarina Devon", "Leo"]},
  {m:3, n:"Loving", e:["Kuro", "Queen", "Vinsmoke Niji"]},
  {m:3, n:"Black", e:["Vander Decken IX", "Blueno", "Shirahoshi"]},
  {m:3, n:"Topping", e:["Spandam", "Sanjuan Wolf", "Pythagoras"]},
  {m:3, n:"Cheese", e:["Lilith", "Capone Bege", "Sugar"]},
  {m:3, n:"100% island", e:["Viola", "Sasaki", "Kalifa"]},
  {m:3, n:"Jam", e:["Dellinger", "Basil Hawkins", "Hibari"]},
  {m:3, n:"Germa kingdom", e:["Gladius", "Kaku", "Vegapunk"], xy:[1099, 1193]},
  {m:3, n:"Foodvalten island", e:["Sasaki", "Black Maria", "Donquixote Doflamingo"]},
  {m:3, n:"Baltigo", e:["Lao G", "Kumadori", "Koala"]},
  {m:3, n:"Wano kingdom", e:["Koby", "Professor Clover", "Jinbe"]},
  {m:3, n:"G-14", e:["Blue Gilly", "Jabra", "Morgan"]},
  {m:3, n:"Package", e:["Smoker", "Monkey D. Luffy", "Senor Pink"]},
  {m:3, n:"Margarine", e:["Aramaki", "Hatchan", "Baby 5"]},
  {m:3, n:"Winner island", e:["Sasaki", "Lucky Roux", "Kuzan"]},
  {m:3, n:"Final boss: Big Mom", es:"Jefe final: Big Mom", e:["Charlotte Linlin", "Charlotte Linlin", "Charlotte Linlin"]},
  {m:4, o:1, n:"Reverse mountain", e:["Miss Valentine", "Pagaya", "Blueno"], xy:[993, 1986]},
  {m:4, o:2, n:"Cactus island", e:["Hamburg", "Momonosuke", "Shimotsuki Yasuie"], xy:[1029, 2282]},
  {m:4, o:3, n:"Little garden", e:["Cabaji", "Jabra", "Saint Jaygarcia Saturn"], xy:[1092, 2311]},
  {m:4, o:3, n:"Boin archipielago", e:["Arlong", "Avalo Pizarro", "Nami"], xy:[910, 2325]},
  {m:4, o:4, n:"Kyuka island", e:["Caesar Clown", "Vergo", "Senor Pink"], xy:[1044, 2370]},
  {m:4, o:5, n:"Renaise", e:["Avalo Pizarro", "Manboshi", "Paulie"], xy:[999, 2414]},
  {m:4, o:5, n:"Drum island", e:["Caesar Clown", "Saint Topman Warcury", "Nico Olvia"], xy:[1094, 2449]},
  {m:4, o:6, n:"Nanimonai island", e:["Mohji", "Doc Q", "Ulti"], xy:[1029, 2498]},
  {m:4, o:7, n:"Sandy island", e:["Morgan", "Vista", "Ashura Doji"], xy:[1071, 2580]},
  {m:4, o:8, n:"Foolshout island", e:["Kozuki Sukiyaki", "Rocks D. Xebec", "Marshall D. Teach"], xy:[929, 2714]},
  {m:4, o:8, n:"Jaya", e:["Hibari", "Vinsmoke Yonji", "Gol D. Roger"], xy:[995, 2737]},
  {m:4, o:8, n:"Ukkari island", e:["Riku Dold III", "Mohji", "Imu"]},
  {m:4, o:9, n:"Hidden cloud village", e:[], xy:[1031, 2803]},
  {m:4, o:10, n:"Upper yard", e:["Hibari", "Uta", "York"]},
  {m:4, o:11, n:"Skypiea", e:["Gecko Moria", "Charlotte Cracker", "Otohime"], xy:[1014, 2825]},
  {m:4, o:12, n:"Angel island", e:["Koala", "Saint Jaygarcia Saturn", "Bogard"], xy:[999, 2850]},
  {m:4, o:13, n:"Long ring long island", e:["Galdino", "Edward Weevil", "Machvise"], xy:[1050, 2970]},
  {m:4, o:13, n:"Kenzan island", e:["Hamburg", "Tsuru", "Laffitte"]},
  {m:4, o:14, n:"Namakura island", e:["Vander Decken IX", "Porche", "Vinsmoke Ichiji"]},
  {m:4, o:14, n:"Weatheria", e:["Charlotte Perospero", "Fukaboshi", "Saint Jaygarcia Saturn"], xy:[1109, 3053]},
  {m:4, o:15, n:"San faldo", e:["Inuarashi", "Hody Jones", "Kozuki Hiyori"], xy:[955, 3203]},
  {m:4, o:15, n:"Banaro island", e:["Edison", "Hajrudin", "Leo"]},
  {m:4, o:16, n:"Scrap island", e:["Roronoa Zoro", "Miss Valentine", "Orlumbus"]},
  {m:4, o:16, n:"Pucci island", e:["Sugar", "Charlotte Cracker", "Vasco Shot"]},
  {m:4, o:17, n:"Water seven", e:["Bepo", "Morgan", "Alvida"]},
  {m:4, o:17, n:"Shift station", e:["Kozuki Oden", "Cavendish", "Sai"], xy:[1013, 3269]},
  {m:4, o:18, n:"St. poplar", e:["Otama", "Tsuru", "Monkey D. Dragon"]},
  {m:4, o:18, n:"Momoiro island", e:["Don Krieg", "Kaido", "Tom"], xy:[1078, 3467]},
  {m:4, o:19, n:"Karakuri island", e:["Trafalgar Law", "Helmeppo", "Denjiro"]},
  {m:4, o:19, n:"Rusukaina", e:["Peepley Lulu", "Roronoa Zoro", "Dr. Hogback"]},
  {m:4, o:20, n:"Guanhao", e:["Hody Jones", "Fukaboshi", "Kozuki Sukiyaki"]},
  {m:4, o:20, n:"Amazon lily", e:["Roronoa Zoro", "Inuarashi", "Morley"]},
  {m:4, o:21, n:"Enies lobby", e:["Saint Shepherd Ju Peter", "Foxy", "Bartolomeo"], xy:[958, 3566]},
  {m:4, o:22, n:"Impel down", e:["Kuro", "Orlumbus", "Don Krieg"], xy:[867, 3650]},
  {m:4, o:22, n:"Thriller bark", e:["Saint Ethanbaron V. Nusjuro", "Shaka", "Belo Betty"], xy:[1048, 3668]},
  {m:4, o:23, n:"Marineford", e:["Daz Bonez", "Buffalo", "Wyper"]},
  {m:4, o:24, n:"Lulusia kingdom", e:["Foxy", "Sai", "Kujaku"], xy:[1074, 3804]},
  {m:4, o:24, n:"Kuraigana island", e:["Buffalo", "Absalom", "Sasaki"]},
  {m:4, o:25, n:"G-2", e:["Lindbergh", "Shanks", "Kin'emon"], xy:[1101, 3930]},
  {m:4, n:"Sabaody archipelago", e:["Marco", "Monkey D. Dragon", "Kujaku"], xy:[1025, 3930]},
  {m:4, n:"Final boss: Mihawk", es:"Jefe final: Dracule Mihawk", e:["Dracule Mihawk", "Dracule Mihawk", "Dracule Mihawk"]},
  {m:5, o:1, n:"Yotsuba island region", e:[], xy:[1854, 3545]},
  {m:5, o:1, n:"Goat island", e:[], xy:[1758, 3558]},
  {m:5, o:1, n:"Kumate island", e:[], xy:[1542, 3517]},
  {m:5, o:1, n:"Sixis island", e:[], xy:[1325, 3515]},
  {m:5, o:2, n:"Tequila wolf", e:["X Drake", "Galdino", "Vinsmoke Ichiji"], xy:[1936, 3166]},
  {m:5, o:3, n:"Organ island", e:["Dr. Hogback", "Don Krieg", "Yamato"], xy:[1648, 3191]},
  {m:5, o:4, n:"Island of rare animals", e:["Kalifa", "Shinobu", "Scratchmen Apoo"], xy:[1589, 3135]},
  {m:5, o:5, n:"Gecko island", e:["Spandam", "York", "Kozuki Oden"], xy:[1594, 2933]},
  {m:5, o:5, n:"Baratie", e:["Caesar Clown", "Uta", "Buffalo"], xy:[1319, 3090]},
  {m:5, o:6, n:"Mirror ball island", e:["Alvida", "Kikunojo", "Bogard"], xy:[1736, 2910]},
  {m:5, o:7, n:"Conomi island", e:["Miss Goldenweek", "York", "Vinsmoke Reiju"], xy:[1652, 2600]},
  {m:5, o:7, n:"Frauce kingdom", e:["Vinsmoke Niji", "Yamato", "Inazuma"], xy:[1836, 2771]},
  {m:5, o:7, n:"Cozia island", e:["Pagaya", "Jean Bart", "Saint Ethanbaron V. Nusjuro"], xy:[1752, 2433]},
  {m:5, o:8, n:"Oykot kigdom", e:["Prince Grus", "Nico Robin", "Tsuru"], xy:[1312, 2751]},
  {m:5, o:9, n:"Polestar island", e:["Kurozumi Orochi", "Tsuru", "Blueno"], xy:[1262, 2278]},
  {m:5, n:"Dawn island", e:[], xy:[1709, 3635]}
];
