# Giocatore «distratto» — 24 ottobre 2026

Quattro visite, una ogni 3 giorni veri (giorni 0, 3, 6, 9), di 50–93 secondi ciascuna. Il vaso passa dal giorno 0 al 44 perché ogni giorno vero ne vale 4 nel vaso. Alla fine non c'è più vita animale e ho chiuso un capitolo. Diario grezzo: `2026-10-24-distratto.log.json`.

## 1. Linea del tempo
- **0:00–0:46** Video completo, senza fretta, con un po' di tocchi a vuoto (stella, sasso: ci vogliono due tentativi).
- **0:46–1:20** Terra, acqua, arriva il muschio: chiudo la scheda con «Dopo» e poi la riapro dalla campanella. Funziona.
- **Giorno 12 (torno dopo 3 giorni)** Scheda «MENTRE NON C'ERI — Stellina»: una sola riga («L'acqua sta finendo: le foglie si arricciano») e il pulsante «Vai dal bambino» (`2026-10-24-distratto-01-confusione-ritorno.png`). Acqua 0%, terreno 17%. Sono passati 12 giorni del vaso e ne vedo uno.
- **Giorno 14–16** Dopo cure e due notti il vaso si riprende; Biscotto fissa le formiche.
- **Giorno 28** Torno: di nuovo acqua a 0% (`2026-10-24-distratto-02-frustrazione-barra-zero.png`). Qualcuno nel vaso ha sofferto, non so chi.
- **Giorno 42** Torno: le formiche non ci sono più, «Nel muschio resta un silenzio nuovo». Compare «Un finale ti aspetta»: «Il Vaso Spento» (`2026-10-24-distratto-03-bello-momento.png`). Lo leggo tutto. Il capitolo si chiude.

## 2. Noia, confusione, frustrazione
- **Confusione — il ritorno** (schermata 01): il gioco sa che sono stato via 3 giorni, ma mi mostra solo l'ultimo evento. Non capisco quanto tempo è passato né che cosa ho perso.
- **Frustrazione — perdita non spiegata**: a ogni ritorno l'acqua è a 0% e almeno una specie è sparita o sta male, senza una scheda che dica «le mosche non ce l'hanno fatta, per la sete».
- **Momento bello**: il finale «Il Vaso Spento»: «Ho tenuto il coperchio chiuso un giorno intero, come se aspettassi. La mamma dice che anche i mondi piccoli finiscono. Io ne farò un altro.» È il pezzo più forte che ho letto, e arriva perché ho abbandonato il vaso: mi sento in colpa nel modo giusto.
- **Falso allarme**: nessun tocco mancato vero in questa partita.

## 3. Le 3 modifiche più utili
1. **«Mentre non c'eri» deve raccontare tutto il periodo**: «Sei stato via 3 giorni. Sono passati 12 giorni nel vaso. È finita l'acqua; le mosche non ce l'hanno fatta» + un pulsante «Guarda il vaso». → *logica* (`app/app1.js`, `checkNewDay` prende solo gli ultimi 4 eventi), *storia* (testi), *interfaccia* (scheda).
2. **Un avviso prima di partire e uno prima del danno**: quando un bisogno scende sotto il 30% il bambino lascia un biglietto che resta ad attenderci. → *logica* + *storia*.
3. **Spiegare chi muore e perché** (una riga nel quaderno per ogni estinzione). → *storia* (`app/story.js`) + *motore* (`sim.js` espone la causa nel log).

## 4. Voto: **4/10** per tornare domani
Il finale mi ha colpito, ma l'esperienza è tornare ogni volta a un vaso più povero senza capire perché. Con un ritorno ben raccontato sarebbe un 7.

*Nota*: giocato con `window.__no3d=true` (vaso 2D) perché questa macchina non raggiunge jsDelivr.
