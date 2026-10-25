# Modalità test: scenari

**Link da aprire sull'iPhone:** https://giovanniangelini989-commits.github.io/Terrarium/?test

Senza `?test` nell'indirizzo il gioco è identico a prima (il file `app/scenari.js` esce subito).
Con `?test` compare in basso a sinistra un piccolo pulsante rotondo (flacone, vetro, linea sottile) che apre un pannello a tutto schermo. Un tocco su una voce: applica lo scenario, chiude il pannello, mostra il messaggio «Scenario: …».
Le voci grigie dipendono da funzioni non ancora presenti: si accendono da sole quando esistono.

Quasi tutti gli scenari di «Popolazioni» e «Partenza» creano una **nuova partita** (la tua attuale viene sostituita). Quelli di «Tempo», «Cura», «Storia», «Carte» lavorano sulla partita in corso (se non c'è, ne creano una avviata).

## Partenza
- **Nuova partita con il video**, **Nuova partita senza video (vaso vuoto)**, **Vaso avviato** (muschio, felce, formiche).

## Popolazioni
- 20 formiche · Popolazione grande (100+) · Tutte le specie insieme · Una specie mutata · Popolo fondato · Guerra in corso.

## Microclima
Stato scritto in una copia di `__MICRO`, rimesso nel salvataggio e ricaricato (`__app.micro()` lo legge); i bisogni passano da `sim.setNeeds`, il tappo da `__app.tappo`. Si accendono se esistono `__MICRO`, `__app.micro`, `__app.tappo`.
- Tappo aperto · Tappo chiuso · Troppa acqua (drenaggio pieno e ristagno) · Vaso al sole col tappo chiuso (serra) · Muffa che nasce · Muffa combattuta (apri, pulisci, collemboli) · Vetro appannato all'alba · Terreno secco · Terreno bagnato.

## Tempo
- **Avanti di 6 ore (una notte)**, **Avanti di 7 notti**.
- **Mani a zero**, **Mani piene** (`G.real.cure`).
- **Calendario del mese con eventi**: 8 notti, poi apre il segmento «calendario» del quaderno. Grigia finché non esiste `__app.calendario`.
- **Salta 2 giorni**: usa `__app.usaSalto()`.
- **Ritorno dopo 3 / 5 giorni**: `checkNewDay` con assenza: letargo e riepilogo «Mentre non c'eri».

## Cura
- Bisogni al minimo · Bisogni pieni · Serie di 7 giorni con un giorno saltato.

## Storia
- Decisione in sospeso · Notte di Biscotto (un capitolo per riga) · Finale imminente (uno per ognuno dei 15 finali).

## Carte
- **Una busta per rarità**: carta, argento, sasso, ricordo (`__carte.reveal({id,fonte,nuova})`).
- **Mazzo completo**, **Album completo**, **Album vuoto**, **Ventaglio pieno** (`__carte.hand`).

## Power card
- **Dai 6 «Salta 2 giorni»**.

## Fine del vaso
- **Porta il vaso a fine capitolo** (apre il finale) · **Chiudi il capitolo (con la carta)** (tocca davvero «Chiudi il capitolo»).
- **Vaso nuovo: solo il meteorite**: grigia finché non esistono `archiviaVaso` / `G.vasi`.
- **Mensola con 3 vasi finiti**: scrive `G.vasi` e apre il segmento «vasi»; grigia come sopra.

## Vista
- Giorno · Sera (grigia finché non c'è `__vase.setTempo`) · Notte · Forza 3D pieno · Forza 2D.
- **Guardia prestazioni livello 0 / 1 / 2**: grigie finché non esiste `__v3d.setLevel(n)`.
- **Contatore fps, triangoli, chiamate**: tocca di nuovo per spegnerlo.

## Prova tutto
Esegue in fila ogni scenario disponibile (esclusi video, esporta, importa, azzera, contatore), con 2 s di pausa e una barra di avanzamento in alto. In fondo un riepilogo: quanti riusciti, quali no, errori in console. Esito anche in `window.__scenariEsito`.

## Salvataggio
- **Esporta**: copia il salvataggio negli appunti.
- **Importa**: legge dagli appunti (o chiede di incollare) e ricarica.
- **Azzera la partita**: chiede conferma, poi cancella e ricarica.

## Test automatico
`python3 e2e_scenari.py` apre `dist/terrario-gioco.html?test`, parte da una partita avviata, tocca ogni voce disponibile, lancia «Prova tutto» e controlla zero errori in console. Schermate in `screenshots/test/`.

## Attivazione che resta
Basta aprire una volta il link con `?test`: il telefono se lo ricorda, anche aprendo il gioco dall'icona sulla schermata Home. Per toglierla, apri una volta il link con `?test=0`.
