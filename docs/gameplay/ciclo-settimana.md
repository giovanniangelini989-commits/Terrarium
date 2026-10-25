# Un vaso = una settimana? (agente motore, 25 ottobre 2026, solo analisi)

Misure di oggi (`node calib.js`, `SOLO='attivo' node app/bots.js`): attivo = 3,3 vasi per 100 giorni, **24 giorni reali per vaso** (mediana), 4 giorni dalla chiusura alla fase 4, 11 finali distinti, 0 errori. Senza cure il vaso si spegne in 6,5 giorni reali (26 giorni-vaso). Un vaso dura ~96 giorni-vaso a 4 notti al giorno.

## 1. Verdetto: sì con condizioni
Sette giorni sono giusti come **ritmo del primo vaso e come tetto morbido**, non come scadenza. Perché sì: la ricerca sui concorrenti dice che il ritorno regge con cicli brevi e un «fine» visibile; 24 giorni senza un traguardo sono troppi per chi gioca 3 minuti al giorno, e oggi il finale più vicino (Società) richiede comunque 30+ giorni-vaso (8 giorni reali) già in condizioni perfette. Perché con condizioni: 7 giorni = 28 notti. Servono finali raggiungibili in 28 notti, ma non per forza *garantiti*: un finale garantito al giorno 7 uguale per tutti toglie la varietà. E il giocatore che passa ogni 2–3 giorni vive solo 12–16 notti vive (il resto è letargo): per lui «una settimana» deve voler dire 7 giorni **di calendario**, con il letargo che non conta.

## 2. Cosa cambiare per arrivare a ~7 giorni
Le soglie in `sim.js` (`checkDestino`) oggi: estinzione `age≥10`; popolo `age≥30` e `d−since≥14`, pace da 3; mostro `age≥30` e 12 giorni di mostro; quiete `age≥60` (Rm<.4, 14 senza eventi) o `age≥100` (20 senza eventi). Il vaso dura quindi 30–100+ giorni-vaso.

1. **Soglie dei finali ×0,6** (nuove: popolo `age≥18`, `since≥8`; mostro `age≥18`, 7 giorni; quiete `age≥36`/`≥56`, senza eventi 8/12; estinzione `age≥8`). Con 4 notti: Società ~5–6 giorni, Mostri ~5, Conflitto ~6, Quiete 9–14. Quiete va portata a `age≥28`, senza eventi 7, per stare nei 7 giorni: sulla Quiete la soglia attuale è la vera causa della mediana 24. Costo: meno tempo per popoli, mutazioni, guerre (vedi rischi).
2. **Avvio più corto**: oggi 4 giorni reali dalla chiusura alla fase 4 (mediana), 9 al massimo. Obiettivo ≤ 1,5. Il vaso nuovo parte con terra già umida e i primi due passi uniti (terra + acqua in una cura), il muschio arriva subito e la prima specie il giorno stesso; l'eredità del finale (§7 di tempo.md) accorcia ancora. Vale ~2,5 giorni su 7.
3. **Un finale «di scadenza» al giorno 7 reale, non garantito dal tempo ma dalla storia**: se a 28 notti vissute nessun finale è pronto, il vaso propone il finale della famiglia che più si avvicina (`classify()`), segnato come «Chiusura dolce», stessa carta ma senza il bonus del finale puro. Il giocatore lo rifiuta con «Più tardi» (rimanda di 3 giorni). Non si chiude mai da solo.
4. **Ritmo**: lasciare 4 notti al giorno. Passare a 6 (ogni 4 ore) accorcia a 4,7 giorni ma peggiora il letargo (soglia 4 notti = 16 h) e le bolle che chi apre due volte al giorno vede; meglio agire sulle soglie.
5. **Power card «Salta 2 giorni»**: oggi 2 al primo accesso, tetto 6. Per chi gioca poco serve una carta in più nella settimana: dono +1 al secondo accesso del vaso (tetto 6 invariato). Con 3 salti si recuperano 6 notti: il vaso di chi passa ogni 3 giorni arriva a 12 vive + 6 = 18, vicino a un finale veloce.
6. **Chi gioca poco** (ogni 2–3 giorni): il contatore è «Giorno 5 di 7» calcolato sul **calendario della stanza**; le notti in letargo contano per 1 su 2 ai fini delle soglie (age avanza di metà). Stima: 5–6 giorni reali, ~12 giorni di calendario. Il vaso passa dunque di 7 giorni di gioco attivo, non di calendario. Chi sparisce non perde nulla: nessuna scadenza, il finale pronto aspetta.

**Alternativa se 7 è troppo poco**: **vaso 1 = 7 giorni** (tutorial lungo, soglie ×0,6), **vasi dal 2º = variabile 7–14** scelto dal tipo di sasso o dalla famiglia di finale precedente (Quiete lento, Mostri veloce), con le soglie intere dal 4º vaso per chi vuole profondità. Così il 7 è una promessa, non un vincolo.

## 3. Rischi e rimedi
- **Finali tutti uguali**: con soglie corte vincono sempre Società o Estinzione (le più rapide). Rimedio: `lastFinale` già impone un finale diverso; aggiungere il vincolo «non lo stesso due volte negli ultimi 3 vasi» e tenere l'eredità. Verifica: finali distinti ≥ 10 su 100 giorni (oggi 11), «finali uguali di fila» = 0.
- **Poca profondità**: popoli e guerre hanno 4–6 giorni invece di 10–20. Rimedio: i popoli nascono prima (`society.since` ridotto a 8) e le mutazioni salgono al 1,3× la probabilità. Verifica: mutazioni e popoli per vaso (oggi 561 e 62 su 104 capitoli: ~5,4 e 0,6) non devono calare sotto 4 e 0,5.
- **Ansia da scadenza**: mai un conto alla rovescia, mai «ti restano 2 giorni». Il «di 7» è mostrato come un percorso sul calendario, non come tempo che finisce. Il vaso non muore per il tempo. Chi salta un giorno non perde il capitolo.
- **Tutto uguale ogni settimana (ripetizione)**: l'eredità, i finali diversi e la mensola rompono la routine; la mensola dopo 10 vasi vale come progresso.
- **Spegnimento senza cure**: non cambia (6,5 giorni reali): resta un limite naturale vicino ai 7.

## 4. Metriche bot per verificarlo (`app/bots.js`)
Da aggiungere come colonne e come cancello, a profilo (passivo, attivo, ogni-3-giorni, distratto):
- **giorni reali per vaso: mediana ≤ 7 e 90° percentile ≤ 7** (oggi 24 la mediana; il 90° non è misurato: aggiungere). Per «ogni 3 giorni» il traguardo è ≤ 7 giorni di *gioco attivo* (visite), non di calendario.
- giorni reali dalla chiusura alla fase 4: mediana ≤ 1,5.
- vasi per 100 giorni: ≥ 12 (oggi 3,3).
- finali distinti ≥ 10, finali uguali di fila 0, quota del finale più frequente ≤ 35 %.
- popoli e mutazioni per vaso ≥ 4 e ≥ 0,5; salvataggio max invariato o in calo; errori 0; cure negate 0; `node equiv.js` a 0 differenze (le soglie nuove stanno dietro `opts.game` e un parametro `ritmoCiclo`, il comportamento storico non cambia).
Prima di toccare i numeri: rilanciare `calib.js` (spegnimento 6,5 giorni) e bots su tutti i profili, e riportare prima/dopo.
