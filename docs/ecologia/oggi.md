# Cosa simula oggi il gioco (e dove si discosta dalla realtà)

Letto con Grep in `sim.js`, `app/app1.js`, `app/app2.js`, `app/v3d.js`, `app/notti.js`, `app/story.js` (24 ottobre 2026). Riferimenti in `docs/ecologia/studio.md`.

## Il modello di oggi in breve

- **Tre bisogni** (`needs`): `um` = riserva d'acqua `Wres`, `ter` = nutrienti `detr`, `pul` = `1 − muffa`. Ogni giorno del vaso (4 per giorno reale): `Wres −= 0,034 + 0,044·s` (s = luce), `detr −= 0,03`, `muffa += 0,013` (+0,02 se `H > 0,7`, −0,01 altrimenti). Cure: acqua +0,30, nutri +0,35, pulisci −0,40 di muffa. [sim.js r. 81, 132, 139, 277–280]
- **Umidità dell'aria** `H = w·0,85 − (T − 0,5)·0,25 + 0,08 se c'è muschio`, con `T = 0,3 + 0,7·s`. È una funzione istantanea della riserva d'acqua e della luce. [sim.js r. 96]
- **Luce** = posizione (ombra 0,25 · mezza 0,6 · sole 1) ± oggetti, scheggiatura. Nessun giorno/notte nel motore; il 3D legge l'ora reale (notte 20–6) solo per il cielo e le luci. [sim.js r. 9, 96; app2.js r. 10]
- **Piante**: vigore `v = 1 − 1,1·|s − l_opt| − 1,1·|w − w_opt|`, poi radiazione, nutrienti e muffa. Ottimi: muschio l 0,45 w 0,7; succulenta l 0,95 w 0,25. [sim.js r. 14–16, 142–144]
- **Condensa in 3D**: densità = `(um − 0,55)/0,33` (quindi è la riserva d'acqua a decidere l'appannamento), si alza di notte solo nel colore; gocce che scendono quando densità > 0,35; `dropN = 80` punti luminosi proporzionali a `um`. [v3d.js r. 129–135, 285]
- **Muffa in 3D**: `L = (0,62 − pul)/0,5` guida macchie sul vetro (ovunque, in altezza 0,25–1,05) e colonie sulla terra; strofinare il vetro la toglie e alza `pul` di `scrub·0,05`; asciugare il vetro abbassa `um` di max 0,035. [v3d.js r. 60, 118–136; app1.js r. 141]
- **Tappo**: il barattolo è sempre «sigillato» nella storia, ma il bisogno d'acqua cala come se fosse aperto. Non esiste un'azione apri/chiudi.
- **Notti** con effetti fisici: temporale (+0,15 um), finestra aperta (+0,05 um, meteorite −8). [notti.js r. 6, 16]
- **Letargo**: in assenza i bisogni scendono fino a `um 0,3 · ter 0,2 · pul 0,5` e si fermano. [app1.js r. 107–109]

## Tabella: gioco contro realtà

| Tema | Oggi nel gioco | Nella realtà (fonte in studio.md) | Scarto | Gravità |
|---|---|---|---|---|
| Consumo d'acqua nel chiuso | `um` cala ogni giorno (0,034–0,078), vaso «spento» in 5–6 giorni senza cure | nel chiuso l'acqua ricircola: mesi o anni senza aggiunte (Latimer 1972→oggi); è l'**aperto** che vuole acqua ogni settimana (§1) | il gioco simula un barattolo aperto chiamandolo sigillato | alta per la coerenza, ma è il cuore del ritmo di gioco: non si tocca senza il motore |
| Cosa fa appannare il vetro | densità della condensa = riserva d'acqua `um` | temperatura: vetro più freddo del punto di rugiada dell'aria interna (quasi satura); mattina appannata, pomeriggio chiaro; sole = nebbia fitta di giorno (§3) | la condensa oggi non cambia con l'ora né con la stagione; non c'è un «ciclo» leggibile | alta (è la cosa più visibile del vaso) |
| Dove si appanna | tutto il vetro uniformemente, gocce casuali | per zone: coperchio e parte alta prima (più esposte), lato della finestra di notte, basso quasi mai; le gocce colano sopra il 60 % di copertura (§3, stima nostra per la soglia) | niente zone | media |
| Umidità dell'aria `H` | funzione di `w` e della luce, scende con la luce | nel chiuso 90–100 % quasi sempre, 60–85 % con ventilazione; cala solo con il tappo aperto (§3) | `H` serve solo per la muffa; sottostima il chiuso | bassa |
| Temperatura | `T = 0,3 + 0,7·s` (solo luce), nessuna notte, nessuna stagione | stanza 18–26 °C, −2/−4 °C di notte alla finestra, +3 °C misurati con lampade, effetto serra al sole (§4) | manca il ciclo giorno/notte, che è la causa fisica della condensa | alta per i testi («il vetro si appanna perché fuori è più freddo») |
| Sole diretto | «Vicino al sole» = più energia per il meteorite e più evaporazione; «Il vaso si secca» se `w < 0,3` e `s > 0,9` | il sole cuoce il barattolo chiuso (serra), muschio e felci soffrono il caldo prima della siccità; condensa fitta di giorno (§4) | il danno è attribuito alla siccità, non al calore | media |
| Muffa: cause | `+0,013` al giorno sempre, +0,02 se `H > 0,7`; cala solo pulendo | soglia: umidità alla superficie > 80 % per giorni, 5–40 °C, aria ferma, materia morta; cala con aria, luce, collemboli (§6) | la muffa è un timer di pulizia, non un fenomeno con cause | media |
| Muffa: dove | macchie sul vetro a ogni altezza + colonie sulla terra | terra e materia morta per prime, vetro in basso dove colano le gocce, foglie stressate (§6) | il vetro alto con la muffa non è realistico | bassa |
| Muffa: come si combatte | pulisci (−0,40), strofinare il vetro | aria (aprire), luce, pulizia, collemboli/isopodi, togliere la terra colpita (§6) | manca «aprire» e i decompositori come cura | media |
| Terreno a strati | un solo spessore proporzionale a `ter`; i nutrienti calano −0,03/giorno | drenaggio (serbatoio), carbone, barriera, terriccio 40–60 % d'acqua; ristagno se il drenaggio è pieno (§2) | nessun ristagno, nessuno strato | bassa (il 3D può mostrare gli strati senza cambiare il motore) |
| Troppa acqua | `acqua` aumenta `um` fino a 1, nessun danno; le specie soffrono solo se `|w − tol| > 0,35` | drenaggio pieno → radici senz'aria → marciume; succulenta morta nel chiuso; vetro sempre appannato (§2, §5) | bagnare troppo non ha conseguenze visibili | media |
| Piante: finestre | ottimi su luce e acqua (0–1), nessuna temperatura, nessuna umidità aria | muschio fresco (15 °C meglio di 25), felce umida, succulenta aria secca, fungo buio e materia morta, carnivora molta luce (§5) | la succulenta può vivere nel chiuso; il muschio non soffre il caldo | media |
| Muschio e siccità | «Le foglie si arricciano» sotto `um 0,22` | si secca davvero e **si riprende in ore** quando lo bagni (§5) | manca il «risveglio» del muschio come premio visibile | bassa |
| Animali del suolo | formiche, termiti, lumache con tolleranze luce/acqua; nessun collembolo/isopode | collemboli e isopodi mangiano la muffa; formiche vogliono il nido saturo; lumache estivano con l'aria secca (§7) | niente decompositori; le lumache non dormono col secco | bassa |
| Tappo | sempre chiuso, non esiste l'azione | aprire un'ora è la cura standard per la condensa fitta e la muffa; aperto = si asciuga in giorni (§3, §6) | manca l'azione più «fisica» di tutte | media |
| Letargo | bisogni bloccati a soglia | un barattolo chiuso lasciato solo sta benissimo: è proprio il caso Latimer (§1) | il letargo è coerente con la realtà **se** il tappo è chiuso: una buona storia da raccontare | nessuna (è un pregio) |

## Dove il gioco sbaglia di più (in ordine)

1. **Condensa guidata dall'acqua invece che dalla temperatura**: nessun ciclo mattino/pomeriggio, nessuna zona, nessuna causa raccontabile.
2. **Il barattolo si dice sigillato ma si asciuga come uno aperto**: la coerenza narrativa si recupera dicendo che il bambino apre il tappo per curare (ogni cura = aria che entra) oppure con il tappo come azione.
3. **Nessuna temperatura e nessuna notte nel motore**: il sole «vicino alla finestra» dà solo energia al sasso, mentre nella realtà è il rischio principale per muschio e felce.
4. **La muffa è un timer, non un fenomeno**: non dipende da aria ferma, materia morta o calore; non si combatte con aria, luce o collemboli.
5. **Troppa acqua non fa danni**: nella realtà è l'errore più frequente (ristagno, succulente marce, vetro sempre appannato).
