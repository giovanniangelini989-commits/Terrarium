# Modalità test: scenari

**Link da aprire sull'iPhone:** https://giovanniangelini989-commits.github.io/Terrarium/?test

Senza `?test` nell'indirizzo il gioco è identico a prima (il file `app/scenari.js` esce subito).
Con `?test` compare in basso a sinistra un piccolo pulsante rotondo (flacone, vetro, linea sottile) che apre un pannello a tutto schermo. Un tocco su una voce: applica lo scenario, chiude il pannello, mostra il messaggio «Scenario: …».
Le voci grigie dipendono da funzioni non ancora presenti: si accendono da sole quando esistono.

Quasi tutti gli scenari di «Popolazioni» e «Partenza» creano una **nuova partita** (la tua attuale viene sostituita). Quelli di «Tempo», «Cura», «Storia», «Carte» lavorano sulla partita in corso (se non c'è, ne creano una avviata).

## Partenza
- **Nuova partita con il video**: cancella il salvataggio e ricarica; riparte il video.
- **Nuova partita senza video (vaso vuoto)**: salta il video, vaso vuoto da avviare a mano.
- **Vaso avviato**: muschio, felce, formiche (come «Salta l'avvio guidato»).

## Popolazioni
- **20 formiche**, **Popolazione grande (100+)** (formiche e termiti), **Tutte le specie insieme** (6 specie, 5 piante), **Una specie mutata** (formiche giganti e radioattive), **Popolo fondato** (formiche con statuina, teocrazia), **Guerra in corso** (formiche contro termiti, entrambe società).

## Tempo
- **Giorno / Notte**: forzano l'aspetto (poi si torna ad «Auto» dalle impostazioni). **Sera**: grigia finché non c'è `__vase.setTempo`.
- **Avanti di 1 notte / di 7 notti**: eseguono davvero le notti; si fermano se scatta una decisione.
- **Ritorno dopo 3 giorni di assenza**: sposta indietro di 3 giorni l'ultimo giorno reale e fa girare `checkNewDay`: scatta il letargo (`G.letargo`), il popup di risveglio e il resto.

## Cura
- **Bisogni al minimo** / **Bisogni pieni** (e cure al massimo).
- **Serie di 7 giorni con un giorno saltato**: serie 7, una protezione, ieri saltato: compare «Bentornato, usi una protezione?».

## Storia
- **Decisione in sospeso**: una mutazione da decidere.
- **Notte di Biscotto**: un capitolo per riga (da `__notti.GATTO`, il secondo è la zampa).
- **Finale imminente**: uno per ognuno dei 15 finali di `FINALI`. Il vaso viene preparato con gli ingredienti giusti, si fanno passare i giorni fino al finale pronto, poi il finale è forzato su quello scelto e si apre la schermata del finale.

## Carte
- **Mazzo completo**: una copia di ogni carta.
- **Una carta per rarità** (comune, speciale…): usa `__carte.reveal(id)` o `__ui.cardReveal` se esistono; altrimenti la carta finisce nel mazzo (l'animazione di apertura non è raggiungibile dalle API pubbliche).

## Power card
- **Dai 6 «Salta 2 giorni»**: grigia finché non esiste `__app.powerCards` (accetta una funzione `(id,n)`, un oggetto con `give`/`add`, o un oggetto contatore `salta2`).

## Prestazioni
- **Forza 3D pieno / 2D**: cambiano la vista (spengono la guardia prestazioni). Il 3D è grigio dove non è disponibile.
- **Forza 3D ridotto**: grigia finché `__v3d.setLevel(n)` non esiste (oggi il livello è interno a `v3d.js`).
- **Mostra fps, triangoli, chiamate**: contatore in basso a sinistra; tocca di nuovo la voce per spegnerlo.

## Salvataggio
- **Esporta**: copia il salvataggio negli appunti.
- **Importa**: legge dagli appunti (o chiede di incollare) e ricarica.
- **Azzera la partita**: chiede conferma, poi cancella e ricarica.

## Test automatico
`python3 e2e_scenari.py` apre `dist/terrario-gioco.html?test`, tocca ogni voce disponibile e controlla zero errori in console. Schermate in `screenshots/test/`.
