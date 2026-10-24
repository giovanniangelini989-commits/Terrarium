# Proposte dell'ecologo (primo giro, 24 ottobre 2026)

Numerate per agente. Dove tocco `sim.js` ricordo che `node equiv.js` deve restare a 0: le regole con `NEEDS` attive non entrano nello storico (equiv.js confronta 600 vasi senza `needs`), ma qualsiasi cambio va comunque concordato con l'orchestratore e il motore. Il microclima (`app/microclima.js`) è pronto e autonomo: le proposte dicono come usarlo.

## A. Integrazione (orchestratore)
- **A1.** Includere `app/microclima.js` in `build_app.py` (accanto a `app2.js`), creare `A.micro = __MICRO.create({piante: dal setup, tappo:'chiuso', posizione: da setup.luce})` in `app1.js`, salvarlo in `G.micro = micro.save()` (~1 KB) e fargli fare `step(6, ambiente)` a ogni `sim.step()` e `step(ore reali)` in `checkNewDay` (con `letargo:true` nei giorni di assenza). L'ambiente viene da `__MICRO.ambienteDi(ora reale, {stagione dal mese, posizione})`.
- **A2.** Mappare le cure: `acqua → micro.act('bagna',30)`, `nutri → act('terra')`, `pulisci → act('pulisci')`, `wipeGlass → act('asciuga',{zona,v:area})`, cambio di luce → `act('sposta')`. Nessun cambio al motore.
- **A3.** Esporre `__app.micro()` = `micro.view()` perché tre-d, luci, storia e interfaccia leggano gli stessi numeri.

## B. Motore (regole di `sim.js`, con i numeri)
- **B1. Evaporazione legata al tappo, non alla luce.** Oggi `Wres −= 0,034 + 0,044·s`. Proposta: `Wres −= EV_apri·aperto + 0,004·chiuso`, con `EV_apri = 0,06` (≈ 9 ml/giorno su 240 ml di capacità, modello §5). Senza azione «tappo» si può raccontare che ogni cura apre il barattolo: `Wres −= 0,034 + 0,044·s` resta uguale nei giorni con cure e scende a `0,01` nei giorni senza cure consecutive oltre il secondo (coerente col letargo). Solo ramo `NEEDS`: `equiv.js` resta a 0.
- **B2. Muffa con cause.** Oggi `muffa += 0,013 + (H > 0,7 ? 0,02 : −0,01)`. Proposta: `muffa += 0,02·f_RH·f_T·(0,4 + 0,6·(1 − detr)) − 0,004 − 0,02·aperto`, con `f_RH = clamp((H − 0,8)/0,17)` e `f_T = 1 − |T_C − 25|/20` dove `T_C = 18 + 8·s` (ombra 20 °C, sole 26 °C). Effetto: senza umidità alta la muffa non cresce; terreno nutrito (`detr` alto) ≠ materia morta, quindi va letto al contrario: `detr` basso = terreno «stanco» = più marcio. Da calibrare con `calib.js` perché cambia il ritmo dei bisogni (la pulizia oggi è un timer).
- **B3. Troppa acqua fa danni.** Aggiungere `ristagno = clamp(ristagno + (Wres > 0,95 ? 0,15 : −0,08))` per giorno; quando `ristagno > 0,5`: vigore delle piante ×0,6, succulenta ×0 (studio §2, §5), evento «Le radici restano senz'aria». Oggi `acqua` oltre 1 è gratis.
- **B4. Temperatura per le piante.** Aggiungere alle piante un ottimo di temperatura `t_opt` (muschio 0,25 ≈ 15 °C, felce 0,45, succulenta 0,7, fungo 0,35, carnivora 0,6 sulla scala `T = 0,3 + 0,7·s`) e il termine `−0,8·max(0, T − t_opt − 0,25)`: così «Vicino al sole» cuoce il muschio e la felce prima di seccarle (studio §4). Nel ramo `NEEDS` soltanto, o con un flag `opts.clima` per non toccare `equiv.js`.
- **B5. Succulenta nel chiuso.** `v = 0` se `H > 0,8` per 5 giorni di fila (studio §5). È una scelta chiara di gioco: la succulenta vuole il tappo aperto.
- **B6. Collemboli come specie.** Nuova specie in `SPECIE` (`collemboli`, dieta `marcio`, `tol {l:.3, w:.8, r:.4}`, non sociale, `rep .9`) con effetto `muffa −= 0,012·pop/100` al giorno: è la cura «viva» della muffa (studio §7). Va aggiunta anche in `app/microclima.js` (`act('collemboli')` già c'è).
- **B7. Lumache che estivano.** Se `w < 0,35` per 3 giorni, le lumache non muoiono subito: `pop` fermo, `agg 0`, evento «Le lumache si sono sigillate nel guscio»; riprendono con l'acqua (studio §7). Riduce le estinzioni «ingiuste».
- **B8. Muschio che rinasce.** Dopo un evento siccità, la prima `acqua` dà `v` del muschio ×1,5 per 2 giorni + evento «Il muschio si riapre in poche ore» (studio §5): premio visibile della cura.

## C. Tre-d (`app/v3d.js`) — condensa, gocce, muffa guidate dal modello
- **C1. Densità della condensa da `micro.view().condensa`**, non da `um`: `uDens` per zona (tappo/alto/medio/basso → 4 fasce di `vUv.y` nel fragment shader, `FD` canale R già esiste per fascia). Risultato: mattina appannata che si schiarisce, sole = nebbia fitta, inverno = lato della finestra più appannato (`zona alto` e `tappo`).
- **C2. Gocce solo quando `gocce > 0`**: `drops.push` con probabilità `∝ gocce` e partenza dalla fascia dove `condensa > 0,6` (oggi partono a caso con `dens > 0,35`). Le gocce lasciano la scia che pulisce il velo: già fatto, va solo collegato.
- **C3. Muffa sul vetro solo in basso**: `molds`/`spots` con `v` entro `soilV + 0,25` e intensità da `muffa.vetro`; sulla terra da `muffa.terra`; sulle foglie (nuovo, un decal sul muschio/felce) da `muffa.foglie`. Togliere le macchie a mezza altezza (0,25–1,05) che oggi non hanno causa.
- **C4. Strati visibili**: ghiaia (drenaggio) 2 cm sotto il terriccio, con l'acqua che si vede nel vetro in basso quando `acqua.drenaggio > 0,8` (un piano riflettente «water line» tra i sassolini): è il segnale visivo del «troppa acqua».
- **C5. Il tappo**: se entra l'azione apri/chiudi, il coperchio si solleva di 10° e la condensa su `tappo` evapora in 1–2 h (il modello lo fa già).
- **C6. Muschio secco/bagnato**: colore e `roughness` del muschio da `piante.muschio.vigore` e `acqua.superficie` (secco = bruno-grigio opaco, bagnato = verde saturo lucido), con transizione in ~2 s dopo `bagna` (studio §5: si riapre in minuti-ore).

## D. Luci (`app/luci.js`)
- **D1. `tempo` arricchito**: oltre a giorno/sera/notte, passare `sole` (0–1) e `stagione` da `ambienteDi`: inverno = sole basso e freddo (4 500 K), lato finestra più chiaro; estate = sole alto e caldo (5 600 K) con la macchia di luce sul fondo del barattolo quando `sole > 0,6`.
- **D2. Condensa che diffonde la luce**: quando `condensa.alto > 0,5` abbassare il contrasto dei riflessi del vetro e aumentare lo scattering (un alone chiaro attorno alla sorgente) — è il modo in cui si legge «appannato» anche senza vedere le gocce.
- **D3. Lampada notturna**: di notte in letargo, il vetro appannato riflette una luce fredda da finestra (`Tfinestra` più bassa): il blu della condensa (`fogC` di notte in `v3d.js`) ha una causa fisica, basta dirlo nel testo.

## E. Storia (`app/story.js`, `app/notti.js`) — testi con la causa fisica
- **E1.** Condensa del mattino: «Stamattina il vetro è appannato: la notte fuori è stata più fredda del vaso. Verso mezzogiorno si schiarisce da solo.» (studio §3)
- **E2.** Sole: «Il vetro è tutto bianco e dentro fa caldo: il sole scalda il barattolo come una serra. Il muschio non ama il caldo: spostalo.» (studio §4) — in `REQ`/`ambient` quando `T.aria > T_stanza + 5`.
- **E3.** Troppa acqua: «Si vede l'acqua fra i sassolini in fondo. Le radici non respirano. Lascia il tappo aperto per un giorno.» (studio §2)
- **E4.** Muffa: «Una peluria bianca sulla foglia morta: è muffa. Nasce dove è umido, fermo e c'è qualcosa di marcio. Aria, luce e qualcuno che la mangi.» (studio §6) — e, con i collemboli: «I collemboli l'hanno ripulita in pochi giorni.»
- **E5.** Letargo coerente: «Hai lasciato il tappo chiuso: dentro l'acqua ha continuato a salire e scendere da sola, come pioggia. Non è morto niente.» (studio §1, Latimer) — è la spiegazione fisica della decisione §1 di DECISIONI.md.
- **E6.** Muschio che rinasce: «Hai bagnato il muschio secco. In un'ora si è riaperto, verde come prima.» (studio §5)
- **E7.** Notte `finestra` (già in notti.js): aggiungere la causa: «…il lato del vaso verso la finestra si appanna per primo, perché il vetro è la cosa più fredda della stanza.»
- **E8.** Succulenta: «La succulenta è molle alla base: nell'aria chiusa e umida marcisce. Vuole il tappo aperto e il sole.»
- **E9.** Quaderno (prima persona): «Ho capito una cosa: il vetro si appanna quando fuori fa più freddo che dentro. Di mattina è una finestra bianca, di pomeriggio torna trasparente.»

## F. Interfaccia (`app/app3.js`, `app/app.css`) — cosa mostrare
- **F1.** Nella pillola «umidità» sostituire o affiancare il numero con un'icona del vetro (limpido / velato / gocce) guidata da `condensa` del modello: è ciò che il giocatore vede davvero nel vaso.
- **F2.** Una pillola discreta «temperatura» (termometro a linea) solo quando è fuori dalla fascia 15–28 °C: freddo (inverno alla finestra) o caldo (sole). Altrimenti nascosta: minimalismo Tavola A.
- **F3.** Azione «tappo» come pulsante rotondo (icona coperchio): aperto/chiuso, con un piccolo testo «Aperto: si asciuga, entra aria · Chiuso: pioggia dentro». È la cura più fisica e manca.
- **F4.** Tocco lungo sul vetro appannato: non solo si pulisce, ma un tooltip di 2 s dice la causa («fuori è più freddo» / «il sole lo scalda»). Micro-interazione piccola (100–250 ms).
- **F5.** Nel quaderno, una pagina «Il mio barattolo» con tre numeri leggibili: umidità dell'aria (%), acqua nel terreno (gocce 0–5), temperatura (°C), presi da `micro.view()`; una riga: «così funziona un terrario vero».

## G. Da misurare (per il prossimo giro)
- +8 °C al sole è una stima: basterebbe un termometro in un barattolo chiuso sul davanzale per un pomeriggio.
- 2 g di velo per zona e la soglia del 60 % per le gocce: pesare un barattolo appannato.
- Tempi della muffa: se qualcuno trova le isoplete di Sedlbauer leggibili, i tempi di germinazione sostituiscono la mia costante 0,02/h.
