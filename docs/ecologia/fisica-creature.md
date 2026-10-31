# Fisica e comportamento delle creature (3D)

Scala: 1 unità = 10 cm. Tutto è cinematica semplice in `app/modelli.js` (funzione `physics`, chiamata da `move` una volta per fotogramma); nessun motore fisico. Gli ostacoli (oggetti e fusti delle piante) arrivano da `obstacleList()` in `app/v3d.js` (cerchi x, z, r, h, ricalcolati ogni 2 s). La sim non cambia: sono comportamenti visivi.

## Cosa si osserva davvero e come è reso
| Creatura | Dato reale | Resa |
|---|---|---|
| Lumaca | 1-3 mm/s; il piede avanza a onde pedali (la velocità pulsa), lunghe soste con corpo fermo, sale e scende sul vetro | Sulla terra .03 u/s; sul vetro .024 u/s (2,4 mm/s) modulata da `.55+.45 sin(5,2 t)`; fasi cammino 7-16 s e sosta 6-30 s; rotta verso una quota obiettivo con deriva sinusoidale. Ventre sul vetro (asse Y del modello = normale verso l'interno, X = direzione di marcia), segue il profilo `glassR(y)`. Passaggio terra/vetro e ritorno con interpolazione di posa 2,5 s |
| Bava | scia lucida, trasparente, argentea; si asciuga in ore | `Points` con anello circolare di 2048 punti (vetro, additivo, brillii da rumore sulla posizione) e 1024 (terra, normale); un punto ogni 1,5 cm; vita 420 s sul vetro e 240 s sulla terra (dimezzata con il secco), larghezza e luminosità calano con l'età |
| Mosca | volo a scatti (saccadi), ali ~200 Hz, si posa, cammina a tratti, si pulisce le zampe sfregando, riparte; fugge se qualcosa si avvicina | Impulso di velocità verso una meta ogni .15-.65 s e frenata esponenziale; ronzio = oscillazione y/rollio ad alta frequenza; appoggio su vetro, coperchio (lato interno), sasso/oggetti, cima delle piante; 3-14 s di sosta con fasi idle/cammino (.1 u/s)/pulizia (scuotimento 30 Hz); fuga se una creatura mobile o un ragno è a meno di 2 cm; resta sempre entro `glassR(y)-.07` |
| Ragno | aspetta fermo (ore), scatto breve verso la preda, tesse | Soste 30-100 s, scatti .5-1,4 s a .11 u/s; sulla parete in alto; se una mosca è posata sul vetro a meno di 6 cm scatta (.5 u/s); le mosche fuggono |
| Formica | piste di feromoni, fila, antenne che si toccano, trofallassi, scava | Pista nido-cibo-nido con corsia laterale per formica (fila); incontro frontale: tutte e due si fermano 0,7-1,3 s in posa «eat» (antenne/mandibole), 60 % di scambio del carico; pausa di 6 s prima di un nuovo incontro |
| Coleottero | pesante, spinge, ogni tanto si ribalta e si dimena | Massa 3 nella separazione (sposta gli altri); ogni 90-600 s si rovescia in .6 s, 3,7 s di zampe in aria (anim. walk), si raddrizza |
| Lumache tra loro | si scansano molto lentamente | Separazione con guadagno .25 |

## Collisioni
Griglia a celle di 18 cm, raggio per specie (formica .03, ragno .055, coleottero .07, lumaca .095) per la scala di ciascun individuo; proiezione delle sovrapposizioni con massa; sul vetro la stessa griglia in (arco, quota). Sasso, oggetti e piante sono cerchi che respingono; se un individuo resta bloccato (>30 fotogrammi di spinta) sceglie un nuovo bersaglio. Misura su 300 s di gioco simulato, 5 specie: 0,1 % delle coppie entro il 60 % del raggio (solo nei passaggi terra/vetro).

## Formicaio (gallerie)
`ahMesh`: cilindro trasparente a r=.953 (appena fuori dalla parete del terriccio) con una `CanvasTexture` 2048x256 dipinta a fasi (gallerie scure con bordo di terra smossa, camere in fondo). 3 reti deterministiche; la lunghezza cresce con la popolazione (.0006 u/s per formica, tetto 1-4,2 u) e con i giorni; ridipinta al massimo ogni 3 s. Cumulo (sfera schiacciata) e foro (disco nero) in superficie a r=.89. Il 30 % delle formiche «scavatrici» va a un foro, entra (posa interpolata) e cammina nella galleria sul piano della parete (ventre al vetro), sosta a scavare 2-5 s, risale ed esce. Con terriccio sottile (≈9 mm all'inizio) le gallerie sono basse: crescono con il terriccio (`S.soilTop`).

## Ragnatele
Fino a 3 ragnatele sul vetro, una per ragno: 12 raggi + 7 spirali (~190 segmenti, un solo `LineSegments`) e rugiada (`Points`, solo di notte). Crescono con attributo per vertice `aG` e progresso per ragnatela (200 s di notte, 1200 s di giorno). Una mosca in volo che attraversa la rete (60 %/s) resta impigliata e si dimena; il ragno la raggiunge, la avvolge (la mosca si ferma, 25-50 s) e poi viene rilasciata. La sim non registra predazione dei ragni: resa solo visiva, senza effetto sul conteggio.

## Sulle piante (felce, succulenta, carnivora)
Fusti e fronde sono terreno percorribile: `PL.surf` (app/piante.js) campiona 9 punti per fronda (centro di ogni fascia lungo l'organo) e li riporta in mondo con la stessa matematica di `plantPos()` dello shader (apertura, piega, scala, notte, pressione): i punti seguono crescita e afflosciamento, e valgono anche per le copie satellite. Una creatura entra (modo 7, posa interpolata 1,4 s) quando passa a meno di 15 cm da una base e il dado (45 % + 40 % giungla) lo consente; più è giungla più creature stanno in alto, quindi visibili (i 20 individui restano tutti istanziati: tetto 24). Cammina a salti tra campioni vicini, appoggiata 8 mm sopra la superficie con ventre lungo la normale; scende lungo la fronda e rientra a terra con la posa interpolata. Separazione: chi si sovrappone viene spostato di lato sulla superficie (i pesanti cedono meno).
| Creatura | Sulle piante |
|---|---|
| Lumaca | brucatrice: sosta 25-70 s su un punto (70 % sulle punte) e mangia; il morso `uBiteP` è locale (6 siti per pianta, raggio 1-11 mm, cresce piano e la foglia si rigenera in ore). Velocità .026 u/s a onde pedali |
| Coleottero | come la lumaca ma più veloce e soste 10-30 s |
| Formica | non mangia foglie. Il 50-90 % (più giungla) sono esploratrici: salgono, si fermano 3-8 s sui germogli (punte), oppure raccolgono un pezzetto di foglia secca o un seme (10 %, 40 % se la foglia è secca), scendono e lo portano al formicaio lungo la pista; consegnato, riprendono la pista o tornano a esplorare |
| Termite | cammina e accudisce i germogli, non mangia |
| Ragno | alcuni (25 % + giungla) nascono sulle fronde e vi aspettano 25-90 s per punto; poi scendono e vanno al vetro |

## Costo
Nessuna geometria nuova pesante: 2 `Points` per la bava, 1 `LineSegments` e 1 `Points` per le ragnatele, 1 cilindro per le gallerie, 6 mesh per i cumuli (+3 chiamate di disegno circa 10). Triangoli aggiunti < 1000. CPU: una passata O(n) con griglia per fotogramma.
