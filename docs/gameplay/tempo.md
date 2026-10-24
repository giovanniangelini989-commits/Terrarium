# Tempo e calendario (progetto, agente motore, 24 ottobre 2026)

**Stato (24 ottobre, sera): costruito nella logica e nel motore** (`app1.js`, `sim.js`, `gametest.js` blocchi 8 «tempo e calendario» e 9 «nuovo vaso», `app/bots.js`, `S.TEMPO/S.CAL` in `story.js`). Manca l'interfaccia (`app3.js`): perline delle mani, popup `notte-ora`, calendario nel quaderno, pulsante tappo/power card, ordine finale → carta → chiudi, segmento «Vasi», contatore «Vaso N · Giorno D». API in docs/CONTRATTI.md «Tempo, mani, calendario, fine del vaso». Differenze dal progetto: `G.cal` memorizza `dt = t − t0` (righe più corte, un anno ≈ 4,2 KB); il quaderno ha un tetto di 240 pagine e il diario non si ripete a ogni vaso; la mensola tiene 8 nodi per i vasi oltre gli ultimi 12; «La chiave del cassetto» dà anch'essa +2 salti (la vecchia scorta tempo non esiste più); separare due specie in guerra non costa una mano.

Fonti: `app/app1.js` (`checkNewDay`, `catchUp`, `G.real`, `G.power`), `sim.js` (`RITMO=4`), docs/DECISIONI.md §1, docs/CONTRATTI.md, docs/ricerca/SINTESI.md, docs/giocatore/2026-10-24-SINTESI.md, docs/ecologia/modello.md §2.

## Com'è oggi (misurato nel codice)
- 1 giorno reale = 4 giorni del vaso (`RITMO`). Tutti e 4 passano **in blocco al primo accesso del giorno** (`checkNewDay` → `owed` → `catchUp`). Nel resto della giornata il vaso è fermo: chi riapre alle 13 e alle 20 non vede nulla di nuovo (giocatore: frettoloso 4/10, distratto 4/10).
- Assenza: dal 2° giorno in poi i giorni dovuti sono in letargo (`G.real.leth`, soglie `LETARGO` um .3 / ter .2 / pul .5). Ci si sveglia con la prima cura (`reqCheck`).
- Power card «Salta 2 giorni»: 2 al primo accesso, tetto 6, due `passaNotte` veri, una sola notte viva in coda. Non ha ancora un pulsante in `app3.js`.
- Giorno/notte visivo: orologio reale della stanza (`isNight` in `app2.js`: 20–6).
- Cure: **illimitate** (`spend()` restituisce sempre `true`). `G.real.cure` viene ricaricata (1 ogni 20 min fino a 12, +2 per richiesta fino a 18) ma **non viene mai spesa né mostrata**. Il giocatore «ostinato» ha dato acqua 49 volte senza alcuna risposta.
- Scorta tempo `G.real.tempo` (max 12, +1 ogni 6 ore): la consumava `scorri()`, che nessun pulsante chiama più. Oggi la alimentano ancora la carta «Tempo in bottiglia» (+3, effetto invisibile: **difetto**) e il banco dei compiti `TASKS` (`startTask/collectTask`, senza pulsante d'ingresso: codice morto).

## 1. Un'unica regola del tempo

> **Nel vaso passa una notte ogni 6 ore della stanza: alle 6, alle 12, alle 18 e a mezzanotte.** Quattro notti al giorno, da sole, anche se non guardi. Puoi aggiungerne due per volta con una carta «Salta 2 giorni». Se non vieni per più di un giorno, il vaso si addormenta e aspetta.

Vocabolario per i testi: **giorno** = giorno della stanza (data vera); **notte** = un passo del vaso (`sim.step`); il contatore in alto a sinistra resta «Giorno N» del vaso. Mai «giorno-vaso» nei testi.

**Le quattro notti a orario fisso** sostituiscono il blocco unico al primo accesso. Motivo: lo stesso rapporto 4:1 (bot e calibrazione invariati: i bot avanzano a giorni interi) ma la seconda visita della giornata trova sempre qualcosa (una notte è passata, un evento, una barra scesa). L'orario fisso è leggibile: il calendario può dire «la prossima notte arriva alle 18». Regola di cortesia: una notte che matura mentre stai giocando si svolge solo quando non hai schede aperte (`busy()` già esiste), con una dissolvenza di 250 ms del vaso.

**Letargo** (DECISIONI §1, invariato nei numeri): le notti dovute oltre le prime 4 dall'ultima visita sono in letargo. Si sveglia con la prima cura. Durante il letargo le notti a orario non si segnano nel calendario come «vissute» ma come «dormite».

**Power card**: invariata (2 al primo accesso, tetto 6, blocchi: inizio, letargo, finale, decisione). Resta l'unico modo di muovere il tempo a mano.

**Vecchia scorta `G.real.tempo`: si elimina, non si fonde.** Due scorte di tempo (una ricaricata a ore, una donata a giorni) sono una regola di troppo e la ricerca chiede meno contatori, non di più. Cosa cambia:
- via `tempo, tempoT, TEMPO_MS, TEMPO_MAX, minToTempo, scorri, TASKS, slotMax, startTask, taskLeft, readyTasks, collectTask, taskPing, G.coda`, lo scenario `t-tempo` e i gestori `task-*` in `app3.js`; `loadSave` cancella `G.real.tempo/tempoT` e `G.coda` dai salvataggi vecchi;
- la carta «Tempo in bottiglia» diventa **+2 «Salta 2 giorni»** (entro il tetto 6): è l'unico punto di fusione, e dà alla carta un effetto visibile (chiede il via dell'orchestratore all'agente carte: dati `CARTE` in `app1.js`);
- i compiti del banco (`veglia`, `soffitta`, `notte`) spariscono: il «ritorno quotidiano» è già coperto dal dono delle power card e dalla proposta 3 di `proposte.md`.

## 2. Azioni limitate e visibili: le «mani»

L'energia delle cure si chiama **mani** (sei il bambino: curi con le mani). Unità: una mano = una cura (pulisci, acqua, nutri). Si vedono come **sei perline chiare sotto i tre pulsanti rotondi**; una si spegne quando curi, si riaccende quando torna.

| Regola | Valore | Perché |
|---|---|---|
| Mani al massimo | 6 (8 dal livello 3, 10 dal livello 5) | il fabbisogno vero è 2–3 cure al giorno (acqua +.30 contro un calo di ~.16 al giorno): 6 non limita mai chi cura, limita solo il tocco a vuoto; crescere con il livello è la ricompensa |
| Ricarica | 1 mano ogni 20 min, solo sotto il massimo (`CURE_MS` di oggi) | in 2 ore sei pieno: nessuna attesa sentita |
| Bonus | +2 per ogni richiesta esaudita (max 3 al giorno), fino a max+2; carta «Tazza di latte» riempie | esiste già (`reqCheck`, `playCard`), diventa visibile |
| A zero | **la cura passa lo stesso se il bisogno è sotto il 35 %** (acqua/terra) o sotto il 50 % (pulizia). Altrimenti il pulsante si abbassa di scala e il vaso risponde: «Hai le mani piene di terra. Il vaso sta bene: aspetta un po’.» Mai un conto alla rovescia in evidenza; i minuti si leggono solo nella scheda dei bisogni | il limite non può mai impedire una cura necessaria: è una regola anti-ansia, non una porta |
| Nuovo giorno / risveglio | mani al massimo | niente da «recuperare» dopo l'assenza (ricerca, azione 1) |
| Troppa cura | acqua con umidità ≥ 95 %: vetro appannato, pulizia −.05 (regola in `sim.js`, solo con `needs:true`, `equiv.js` resta a 0) | risposta visibile a ogni tocco (giocatore, modifica 3) senza punire davvero |

Cosa premia: curare **quando serve** (la mano torna presto, il bisogno sale) e salire di livello (più mani). Cosa non fa: non scade, non si perde, non manda notifiche, non blocca il vaso che ha sete.

## 3. Il calendario

Vive nel quaderno, come primo segmento (`Calendario · Albero · Pagine · Specie · Finali · Carte`); la «Cronaca» diventa il dettaglio di un giorno del calendario (stessi dati di `sim.log`).

**Cosa mostra.** Una griglia a mese della stanza (7 colonne, lunedì–domenica), si sfoglia a strisciata orizzontale, un mese per schermata, si parte dal mese corrente. Ogni casella:
- il numero del giorno reale e, sotto, **quattro tacche** (le notti): accese se vissute, tratteggiate se dormite (letargo), **viola `#A88BFF`** quelle aggiunte da un salto (una casella può avere 6 o 8 tacche);
- un'icona sola, l'evento più importante del giorno, con priorità: finale › popolo › guerra · pace › mostro › arrivo · nascita › mutazione › estinzione › letargo · risveglio › pagina;
- oggi ha il bordo verde `#7CF5C8`; i giorni futuri sono vuoti (nessuna promessa, nessun «torna domani»).
Sotto la griglia, una riga: «Giorno 57 del vaso · la prossima notte alle 18».

**Tocco su un giorno** → scheda con la data, «notti 45–48», il letargo se c'è, e la lista degli eventi in seconda persona con l'icona; tocco su un evento → `why[]` del log (come la cronaca di oggi) o la foto dell'albero se c'è.

**Dati in `G`** (nuovo `G.cal`, ≤ 2,5 KB in un anno):
```
G.cal = { v:1, r:[[t, d0, f], ...] }
```
`t` = indice del giorno reale (`todayIdx()`), `d0` = primo giorno del vaso di quel giorno reale, `f` = bit: 1 visitato · 2 letargo · 4 salto · 8 risveglio. L'ultimo giorno del vaso di una riga è `d0` della riga dopo −1 (oggi: `sim.d`). Si aggiunge una riga a ogni nuovo giorno reale in `checkNewDay`; i salti e il risveglio accendono i bit. Tetto 400 righe (come l'albero), si scartano le più vecchie. Un anno = 365 × ~7 byte ≈ 2,5 KB.

**Da dove vengono gli eventi**: nessuna copia. `G.tree.nodes` (hanno `d`, `k`, `major`, `img`), `sim.log` (ultimi 300 passi, con `why`) e `G.quaderno` (pagine con `d`) si mappano sul giorno reale con una ricerca binaria su `G.cal.r` per `d`. I giorni più vecchi del log mostrano solo i nodi dell'albero: basta.

## 4. Cosa vedi dopo un «Salta 2 giorni»

1. Il vaso si scurisce e si rischiara due volte (250 ms l'una, due lune nel riquadro), le barre scendono con l'animazione di scala, bolle sugli eventi (`bubbleEvents`, già c'è).
2. Una sola scheda: «Due notti passano» con 1–3 eventi (`usaSalto().eventi`) e, se c'è, la notte viva in coda. Se la prima notte si ferma su una decisione: la scheda della decisione, poi la seconda notte riparte da sola (`riprendiSalto`, invariato).
3. Nel calendario: la casella di oggi ha 6 tacche, le ultime 2 viola; l'icona del giorno si aggiorna; la riga sotto dice «Giorno 59 del vaso · 2 notti saltate oggi».
4. Nell'albero: niente nodo (decisione già presa: non è un evento del vaso). La serie non cambia.

## 5. API, contratti, test, metriche

**`window.__app` (logica di gioco, da aggiungere in docs/CONTRATTI.md, sezione «Logica → interfaccia»):**
- `orologio()` → `{d, quarto, prossimaNotteMs, notti: 4, letargo}`: `quarto` ∈ 0..3, `prossimaNotteMs` = ms che mancano alla prossima notte a orario.
- `mani()` → `{n, max, bonus, minuti, why}`; `why` ∈ `'' | zero` (con `zero` il pulsante si abbassa). Sostituisce `minToCure`, `CURE_MAX`; `spend(1)` torna a contare, con l'eccezione del bisogno sotto soglia.
- `doAct(k)` → aggiunge al risultato `{mani, gratis, troppa}` (`gratis` = passata a zero mani perché il bisogno era basso; `troppa` = acqua a vaso già pieno).
- `calendario(mese?)` → `{oggi:{t, data}, mese:{anno, mese, giorni:[{t, data, dal, al, notti, letargo, salti, risveglio, visitato, icona, eventi:[{d, k, icon, text, major, img?}]}]}, prossimaNotteMs, saltiOggi}`. `data` in ISO locale (`2026-10-24`).
- `G.cal` come al §3; `G.real.cure/cureT` restano; via `G.real.tempo/tempoT`, `G.coda`.
- Popup `__app.popups`: nuovo `t:'notte-ora'` (una notte a orario svoltasi mentre guardavi), gestito da `app3.js` come una `notte` senza scheda se non ci sono eventi.

**Storia (`app/story.js`, stringhe):** `S.TEMPO = { prossima(ore), notteOra, maniZero, maniGratis, troppaAcqua, salto2, letargoCal, risveglioCal }` e le etichette del calendario `S.CAL.k` per ogni `k` dell'albero (seconda persona, 1 riga).

**Interfaccia (`app3.js`, `app.css`):** perline delle mani, pulsante power card nella colonna destra (ancora manca), segmento «Calendario», scheda del giorno, dissolvenza della notte a orario.

**`gametest.js` (motore), blocco 7 «tempo e calendario»:**
1. 4 notti al giorno: `dev.offset+1` → `sim.d` +4; avanzando di 6 ore → +1; di 5 h 59 → 0.
2. Assenza 3 giorni: 12 notti dovute, 8 in letargo, soglie rispettate, `G.cal` con tre righe `f&2`.
3. Salto: la riga di oggi ha `al−dal+1 === 6` e `f&4`.
4. Mani: 6 cure passano, la 7ª no con bisogni alti; con umidità .2 la 7ª passa (`gratis`); dopo 20 min torna 1; a livello 3 il massimo è 8; nuovo giorno → pieno.
5. Carta «Tempo in bottiglia» → `G.power.salto` +2, mai oltre 6.
6. Salvataggio vecchio con `real.tempo` e `coda` → caricato senza le due chiavi; `G.cal` ricostruito con una riga da oggi.
7. `calendario()` di un mese senza righe → giorni vuoti, nessuna eccezione; `JSON.stringify(G.cal).length ≤ 5000` dopo 365 giorni simulati.

**Bot (`app/bots.js`), colonne nuove:** `cure negate` (devono essere 0 nei profili passivo/attivo/ogni-3-giorni: il limite non deve mai bloccare chi cura), `cure gratis`, `troppa acqua` (alto nel caotico), `mani medie a fine giornata`, `righe cal` e `byte cal` (≤ 5000), `notti a orario` = 4 × giorni visitati. Un profilo nuovo `due volte al giorno` (accesso alle 8 e alle 20: `dev.offset` a mezze giornate) per misurare che le notti si spalmino. Prima/dopo da riportare: tempo di spegnimento senza cure (oggi 5–6,5 giorni reali), finali distinti, errori.

## 6. Piano in passi piccoli

| # | Passo | Chi | Durata | Cancello |
|---|---|---|---|---|
| 0 | Aspettare il botanico (sta cambiando `sim.js` e `app1.js`) | orchestratore | — | sua PR verde |
| 1 | Scrivere in docs/CONTRATTI.md `orologio, mani, calendario, G.cal`, via `scorri/TASKS/tempo` | motore (testo), orchestratore (unisce) | ½ g | — |
| 2 | Togliere la scorta tempo e il banco; carta «Tempo in bottiglia» → +2 salti; migrazione in `loadSave` | orchestratore (`app1.js`), carte (dati `CARTE`), interfaccia (via `task-*`, `t-tempo`) | ½ g | `node gametest.js` 5–6, bot senza errori |
| 3 | Notti a orario (`quarto`), `orologio()`, popup `notte-ora`, `G.cal` scritto in `checkNewDay/usaSalto/reqCheck` | orchestratore (`app1.js`), motore (test 1–3, profilo bot `due volte al giorno`) | 1 g | test 1–3, `equiv.js` 0, bot: giorni-vaso medi invariati |
| 4 | Mani: `spend` vero con l'eccezione sotto soglia, `mani()`, `doAct` esteso, «troppa acqua» in `sim.js` | motore (`sim.js`, test 4, bot), orchestratore (`app1.js`) | 1 g | test 4, `cure negate` = 0 nei profili di cura, spegnimento senza cure invariato |
| 5 | Interfaccia: perline, risposta a zero, pulsante power card, dissolvenza notte | interfaccia | 1,5 g | e2e, schermate |
| 6 | `calendario()`, segmento nel quaderno, scheda del giorno, testi `S.CAL/S.TEMPO` | orchestratore (API), interfaccia (griglia), storia (testi), motore (test 7) | 2 g | test 7, byte cal ≤ 5 KB, e2e |
| 7 | QA visivo su iPhone: griglia a 390 px, tacche leggibili, contrasto «Giorno» | qa, direttore-artistico | ½ g | approvazione |

Ordine consigliato: 2 → 3 → 4 insieme in una PR (sono tutte in `app1.js`), poi 5, poi 6. Il passo 4 può slittare se il botanico cambia il calo dei bisogni: le soglie del «gratis» vanno rimisurate sulle sue curve.

## 7. Fine del vaso: si riparte dal sasso (richiesta di Giovanni, 24 ottobre)

**La regola.** Quando chiudi un capitolo, il vaso si svuota: resta solo il meteorite sul fondo del barattolo. Si riparte dalla fase 0 («Il barattolo è vuoto» → Metti la terra → Bagna → muschio → felce → formica). **Un capitolo = un vaso.** Il contatore diventa «Vaso 2 · Giorno 3».

**Lo decidi tu, mai il gioco.** Il finale pronto aspetta come oggi («Più tardi» lo rimanda di 3 giorni, il vaso intanto vive). Nessun azzeramento durante l'assenza, in letargo o con una decisione aperta: lo scatena solo il tocco su «Chiudi il capitolo». La scheda lo dice prima, senza drammi: «Il vaso si addormenterà per sempre. Il sasso resta con te.»

**Cosa si conserva (tutto ciò che sta fuori dal vetro)**
| Cosa | Dove | Note |
|---|---|---|
| Album delle carte, Libro dei finali | `G.mazzo`, `G.libro` | + la carta estratta al finale |
| Quaderno (pagine) | `G.quaderno` | restano, con un separatore «Vaso 1» |
| Specie e culture scoperte | `G.codex` | l'enciclopedia è tua, non del vaso |
| Livello, XP, serie, protezioni | `G.player` | la serie segue i giorni della stanza |
| Power card, mani | `G.power`, `G.real.cure` | `G.power.resto` torna 0 |
| Biscotto (capitolo, destino, scudo) | `G.ui.gatto*`, `G.ui.scudo` | il gatto vive in casa, non nel vaso |
| Il meteorite: grandezza | `setup.meteorite` | la carta «Il sasso cresce» vale per sempre |
| Calendario | `G.cal` | continuo tra un vaso e l'altro |
| **La mensola dei vasi** (nuovo) | `G.vasi[]` | vedi sotto |

**Cosa si perde (tutto ciò che sta dentro il vetro):** specie, piante, oggetti, bisogni (terra e acqua a 0), mutazioni, popoli, guerre, carica del sasso (`E` riparte da 20), decisioni in sospeso (scartate), arrivi programmati, richiesta del giorno, albero del vaso (archiviato), `G.ui.fase` → 0.

**La mensola dei vasi** (la ricompensa che resta). Nel quaderno, segmento «Vasi»: un barattolo per ogni vaso finito, con la foto del finale, il nome del finale, «12 ottobre – 9 novembre · 112 giorni nel vaso · 2 popoli · 7 mutazioni». Toccandolo si riapre il suo albero (solo nodi maggiori). Dati: `G.vasi = [{n, k, dal, al, dv, popoli, mut, specie:[id], img?, nodi:[{k,t,d}] (max 24 maggiori)}]`, ~600 B a vaso senza foto. Foto: una sola per vaso (lo scatto del finale), dentro il tetto globale di 36 dell'albero; oltre 12 vasi le foto più vecchie si tolgono e resta il testo.

**Il sasso ricorda** (piccolo, visibile, non è potere): ogni finale **diverso** accende una crepa del meteorite in più (`_EMIT`, fino a 15, agente tre-d); e la famiglia dell'ultimo finale lascia un'eredità al vaso nuovo: Quiete → la terra parte già umida (um .3); Società → il primo oggetto offerto è quello del culto; Mostri → il sasso parte carico (E 40); Conflitti → la prima specie arriva un giorno prima. Si dice in una riga al risveglio del vaso nuovo.

**Sequenza (si lega al finale animato).**
1. «Un finale ti aspetta» → `playEnding(data)` (`app/finali.js`) con `data.nodi = G.tree.nodes` **prima** dell'azzeramento.
2. Carta estratta (`cardReveal`), poi la conferma «Chiudi il capitolo».
3. `closeChapter()` archivia e azzera; transizione grande (≤ 1,2 s): la vita si dissolve, la terra scende, resta il sasso che batte viola.
4. Fase 0 come al primo avvio, senza il video iniziale; il primo pulsante dice «Ricomincia: metti la terra».
Oggi `fin-close` chiama `closeChapter` prima della carta: va invertito (interfaccia).

**Nel calendario.** Il giorno della chiusura ha l'icona del finale con bordo viola e una linea verticale sottile dopo la casella; da lì `d0` riparte da 0. `G.cal.r` aggiunge il bit 16 «nuovo vaso»: il numero del vaso di una riga = quanti bit 16 la precedono. Per i giorni dei vasi passati la scheda del giorno mostra solo i nodi archiviati in `G.vasi[n].nodi` (il log del vaso vecchio non si conserva). In cima al mese: «Vaso 3 · dal 9 novembre».

**Cosa cambia nel codice.**
- `sim.js` (motore): `createSim` accetta due opzioni nuove e facoltative `{capitolo, eredita}` (numero del capitolo di partenza; `{um, E, anticipo}`). Senza opzioni il comportamento è identico: `equiv.js` resta a 0. Va scritto prima in docs/CONTRATTI.md.
- `app1.js` (orchestratore): `closeChapter0` = libro + pagina epilogo + carta, poi `archiviaVaso()` → `G.vasi.push`, nuovo `sim` con `{luce, acqua, meteorite}` del vecchio setup e liste vuote, nuovo seme, `setNeeds({um:0,ter:0})` + eredità, `G.tree` nuovo con il nodo «Il vaso ricomincia dal sasso», `G.arrivi` vuoto, `G.ui.fase=0`, `G.req=makeRequest()`, `G.power.resto=0`, riga di `G.cal` con bit 16. Ritorna `{k, first, culto, carta, vaso}`. `loadSave` crea `G.vasi=[]` nei salvataggi vecchi (il vaso attuale resta com'è).
- `app3.js` (interfaccia): ordine finale → carta → chiudi → transizione; segmento «Vasi»; contatore «Vaso N · Giorno D».
- `story.js` (storia): testi della conferma, della transizione, delle 4 eredità, della mensola.

**Test (`gametest.js`, blocco 8 «nuovo vaso»).** Dopo `closeChapter()`: nessuna specie, pianta, oggetto; `needs.um=0, ter=0`; `sim.d===0`; `chapter` +1; meteorite della stessa grandezza; `G.ui.fase===0`; `G.vasi.length` +1 con il finale giusto; `G.mazzo` +1 carta; `G.libro`, `G.codex`, `G.player.serie`, `G.power.salto`, `G.ui.gatto` invariati; `G.tree.nodes.length ≤ 2`; nessuna decisione in sospeso; salvataggio e ripresa conservano tutto. Poi `doAct('terra')`, `doAct('acqua')` → arriva il muschio (fase 2). Con un finale Quiete il vaso nuovo ha `um ≥ .3`. Il salvataggio dopo 10 vasi resta sotto quello di oggi. `equiv.js` a 0.

**Metriche bot (prima → dopo da riportare).** Oggi (100 giorni, 32 vasi per profilo): capitoli chiusi 57–258, finali distinti 9–12, salvataggio max **70–99 KB**, 0 errori. Nuove colonne: `vasi per 100 giorni`, `giorni reali per vaso` (mediana), `giorni reali dalla chiusura alla fase 4` (atteso ≤ 3), `finali uguali di fila`, `byte mensola`. Attese: finali distinti invariati (± 1), salvataggio max in calo (l'albero riparte a ogni vaso), capitoli chiusi un po' più bassi (ogni vaso rifà l'avvio). Tutti i profili devono saper rifare l'avvio (`terra`, `acqua` quando `fase<2`): oggi lo fa solo «da zero».

**Passo nel piano.** Passo 8, dopo il 6: contratto (motore, ½ g) → `createSim{capitolo,eredita}` + test + bot (motore, 1 g) → `closeChapter`/`G.vasi` (orchestratore, 1 g) → sequenza e mensola (interfaccia 1,5 g, finali, tre-d per le crepe, storia per i testi). Se il finale animato non è pronto, la sequenza parte dalla carta: l'azzeramento non dipende da `finali.js`.
