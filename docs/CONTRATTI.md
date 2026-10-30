# Contratti tra le parti

## Chi possiede cosa
| Agente | File |
|---|---|
| motore | `sim.js`, `engine_old.js`, `equiv.js`, `gametest.js`, `calib.js`, `app/bots.js` |
| storia | `app/story.js`, `app/notti.js`, testi dentro `app/app1.js` (solo stringhe) |
| interfaccia | `app/app3.js`, `app/app.css`, `app/film.js`, `app/fx.js` |
| suono | `app/audio.js` |
| musicista | `docs/musica/`, `audio/` |
| carte | `app/carte.js`, `docs/carte/` (dati `CARTE` in `app/app1.js` solo con il via dell'orchestratore) |
| ecologo | `app/microclima.js`, `microclima_test.js`, `docs/ecologia/` (le regole di `sim.js` restano del motore) |
| modellatore | `assets/kimi/<id>/`, `docs/modelli/` (asset 3D generati internamente al posto di Kimi) |
| tre-d | `app/v3d.js`, `app/app2.js`, `app/materials.js`, `app/kimi.js`, `app/tex.js`, `vendor/` |
| finali | nuovo `app/finali.js` (lettore dei mini video), `app/apertura.js` (video iniziale in 3D), `e2e_apertura.py`; in `app/film.js` la messa in scena |
| logica di gioco (orchestratore) | `app/app1.js`, `build_app.py` |
| qa | nessuno (sola lettura), scrive solo in `screenshots/` e report |
| luci | `app/luci.js`, `qa_luci.py` (in `app/v3d.js` solo la chiamata a `__LUCI`) |
| giocatore | `tools/giocatore.py`, `docs/giocatore/`, `screenshots/giocatore/` (sul gioco sola lettura) |
| ricerca | `docs/ricerca/` |
| showrunner | `docs/regia/` (sul gioco sola lettura: note a storia e finali) |
| direttore-artistico | nessuno (sola lettura: approva o respinge le schermate) |
| lancio | `docs/lancio/`, `store/` |

## Motore → app (`sim.js`)
`createSim(setup,{seed,game,decisions,needs,capitolo?,eredita?:{E,um,ultimo}})` → `{step, view, act, resolve, addSpecies, removeSpecies, addPlant, removePlant, addObject, removeObject, setNeeds, charge, growMeteo, setMalus, closeChapter, save, load, log, pending, d, chapter, E}`.
`view()` → `{d, chapter, setup, vit, E, sp:[{id,nome,icon,pop,alive,mut[],society:{name,cult,since,culto}|null,monster,size,gen}], plants, wars:[[a,b]], pending, needs:{um,ter,pul}}`.
`log[]` → `{d, kind, icon, text, why[]}`.

## Logica → interfaccia (`window.__app`)
Funzioni principali: `newGame, act, passaNotte, takeArrival, resolveDecision, playCard, closeChapter, nightFx, gattoChoice, pickNight, treeDiff, persist`. Stato in `__app.G` (salvato). Letargo (docs/DECISIONI.md §1): `G.letargo = {da, giorni}` (giorno reale d'inizio e giorni di assenza; `null` quando il vaso è sveglio), `G.ui.letargoN` e `G.ui.risvegli` contatori; `G.real.leth` è interno.
Power card «Salta 2 giorni» (si consumano, non entrano nell'album): stato in `G.power = {salto, ultimoDono, donoN, usate, resto}`. `__app.POWER` → `{max:6, dono:2, giorni:2}`. `__app.powerCards()` → `{salto, max, nuove, resto, why}` con `why` ∈ `'' | carte | inizio | letargo | finale | decisione` (`''` = usabile; chiamarla esegue il dono del giorno se dovuto). `__app.usaSalto()` → `{ok, why?, passi, pausa, resto, eventi}`: due notti vere, una sola notte viva in coda; se la prima notte si ferma su una decisione, la seconda riparte da sola dopo `resolveDecision`. Regole: 2 al primo accesso di ogni giorno reale (non si accumulano in assenza), tetto 6, bloccate in avvio, letargo, finale da chiudere, decisione in sospeso; non toccano la serie. Popup in coda `__app.popups` con `t` ∈ `arrivo, decisione, finale, pagina, risveglio, biscotto, notte, gatto, livello, carta`.

## Tempo, mani, calendario, fine del vaso (docs/gameplay/tempo.md; logica in `app1.js`, interfaccia in `app3.js`)
**Orologio.** Nel vaso passa una notte ogni 6 ore della stanza (alle 0, 6, 12, 18 locali). `__app.checkNewDay()` (già chiamata da `app3.js` ogni 15 s quando non è `busy()`) svolge le notti maturate: su un nuovo giorno reale torna `{nuovi}` e mette in coda il popup `risveglio` come oggi; su una notte a orario nello stesso giorno torna `{nuovi, notti}` e mette in coda `{t:'notte-ora', eventi, notti}` (l'interfaccia lo tratta come una `notte` senza scheda se `eventi` è vuoto). Letargo invariato (DECISIONI §1): le notti dovute oltre le prime 4 dall'ultima visita, quando mancano ≥ 2 giorni reali, sono in letargo.
- `__app.orologio()` → `{d, vaso, quarto (0..3), prossimaNotteMs, notti:4, letargo (bool), dovute, oggi:{t, data:'YYYY-MM-DD'}}`.
- Stato: `G.real.lastSlot` (indice dell'ultima fascia di 6 ore svolta; i salvataggi vecchi lo ricavano da `lastDay`). **Via** `G.real.tempo/tempoT`, `G.coda`, `scorri, TASKS, startTask, collectTask, taskPing, readyTasks, taskLeft, slotMax, minToTempo, TEMPO_MAX, minToCure, CURE_MAX, spend, regen` (i gestori `task-*`, `t-tempo` e il popup `compito` in `app3.js` sono da togliere: interfaccia). La carta «Tempo in bottiglia» dà +2 «Salta 2 giorni» (tetto 6); «La chiave del cassetto» idem, più l'arrivo.
- `G.dev.offset` è in giorni e può essere frazionario (0.25 = 6 ore) per i test.

**Mani** (l'energia delle cure: una mano = una cura `pulisci/acqua/nutri/terra`). Stato `G.real.cure/cureT`. Massimo 6 (8 dal livello 3, 10 dal livello 5); ricarica 1 ogni 20 min sotto il massimo; +2 per richiesta esaudita (max 3 al giorno) fino a massimo+2; «Tazza di latte» riempie a massimo+2; nuovo giorno reale e risveglio → piene.
- `__app.mani()` → `{n, max, bonus, minuti (alla prossima mano, 0 se piene), why:''|'zero'}`.
- `__app.doAct(k)` → `{ok, text, mani, gratis, troppa}` oppure `{ok:false, why:'zero', text, mani}` quando non hai mani **e** il bisogno sta bene. Regola anti-ansia: a zero mani la cura passa lo stesso (`gratis:true`) se il bisogno è sotto il 35 % (acqua/terra/nutri) o sotto il 50 % (pulizia), e `terra` nella fase 0. `troppa:true` = acqua con umidità ≥ 95 %: il motore appanna il vetro (pulizia −.05, evento 🌫️; solo con `needs:true`).
- Interfaccia: perline delle mani sotto i pulsanti rotondi (`mani().n` su `max`, le oltre `max` sono il bonus), a `why==='zero'` il pulsante si abbassa di scala e mostra `text` (da `S.TEMPO.maniZero`); mai un conto alla rovescia in evidenza.

**Calendario.** Stato `G.cal = {v:1, t0, r:[[dt, d0, f], ...]}` (≤ 400 righe, ~13 byte l'una): `dt = t − t0` (giorno reale), `d0` = primo giorno del vaso di quel giorno reale, `f` bit: 1 visitato · 2 letargo · 4 salto · 8 risveglio · 16 nuovo vaso. Le righe nascono nelle notti svolte (`catchUp`, `passaNotte`) e alla visita.
- `__app.calendario(mese?)` (`mese` = `'YYYY-MM'`, assente = mese corrente) → `{oggi:{t, data}, vaso:{n, dal}, prossimaNotteMs, saltiOggi, mese:{anno, mese, primo (0=lunedì), giorni:[{t, data, g, oggi, futuro, vaso, dal, al, notti, letargo, salti, risveglio, visitato, nuovoVaso, icona, eventi:[{d, k, icon, text, major, img?}]}]}}`. `k` degli eventi = quelli dell'albero (`G.tree`) più `pagina`; per i vasi passati gli eventi vengono da `G.vasi[n].nodi`. Icona = l'evento più importante del giorno (priorità: finale › popolo › guerra · pace › mostro › nasce · estinta › muta › letargo · risveglio › pagina).
- `S.CAL[k]` etichette brevi per `k` dell'albero, `S.TEMPO` testi del tempo (`story.js`).

**Fine del vaso: si riparte dal sasso** (tempo.md §7). `__app.closeChapter()` → `{k, first, culto, carta, cartaNuova, vaso}`: libro, pagina, carta come oggi, poi **archivia il vaso e riparte dalla fase 0** con il solo meteorite (stessa grandezza, stessa luce e acqua), nuovo seme, bisogni a zero, `sim.d=0`, capitolo +1, albero nuovo con il nodo «Il vaso ricomincia dal sasso», `G.ui.fase=0`, richiesta «terra». Si conservano `G.mazzo, G.libro, G.quaderno (le pagine nuove hanno vaso:n), G.codex, G.player, G.power (resto 0), G.real.cure, G.ui.gatto*, G.ui.scudo, G.cal`.
- Mensola: `G.vasi = [{n, k, dal, al, dv, popoli, mut, specie:[id], img?, nodi:[{k,t,d}] (max 24 maggiori)}]`; `vaso.n` 1-based; `G.ui.vasoN` = numero del vaso attuale; `G.ui.vasoDal` = giorno reale d'inizio.
- Eredità del finale (una riga a `S.TEMPO.eredita[fam]`, in `G.ui.eredita = {fam, testo}` finché il vaso nuovo non arriva alla fase 4): Quiete → umidità .3; Mostri → sasso a 40; Società → il primo oggetto offerto è quello del culto; Conflitti → la prima specie arriva un giorno prima.
- Interfaccia: ordine finale → carta → conferma «Chiudi il capitolo» → transizione (oggi `fin-close` chiama `closeChapter` prima della carta); segmento «Vasi» nel quaderno; contatore «Vaso N · Giorno D» (`orologio().vaso`).
- Motore: `createSim(setup,{…, capitolo, eredita:{E, um, ultimo}})`, opzioni facoltative (capitolo di partenza, carica iniziale, umidità iniziale, ultimo finale per la regola «serve un finale diverso»); senza opzioni il comportamento è identico (`equiv.js` a 0).

**Diario.** `S.diario(view, G)` viene chiamato una volta per notte del vaso (`afterDay`) e la pagina entra nel quaderno con `addPage` (id con suffisso `-vN` dal secondo vaso).

## Biologia di fondo (motore, solo con `needs`; non tocca equiv)
- `view().bio` (null senza `needs`) → `{collemboli, formiche, termiti, mosche}`:
  - `collemboli`: 0–100, popolazione di fondo (stessa grandezza di `clima.collemboli` ×100). Arrivano dove muffa e umido durano, crescono con umido + muffa + detrito, calano col secco o senza cibo; mangiano muffa e detrito. Per la grafica: puntini bianchi che saltano, quantità ∝ valore.
  - `formiche`: `null` se estinte, altrimenti `{regina: bool, covata:{uova, larve, pupe}}` (numeri, stesso peso degli individui; 0–~30). La colonia cresce solo con la regina (`regina:true`); senza regina niente nascite e le operaie calano ~2%/giorno. La regina muore dopo 10 giorni consecutivi di adattamento < 0,3; ne arriva una nuova da sola dopo ≥ 18 giorni se la colonia sta meglio. Grafica: regina grande nel nido, mucchietti di uova/larve/pupe in proporzione.
  - `termiti`: `null` se estinte, altrimenti `{sciame: bool, fondati: n}`. `sciame:true` per 3 giorni di vaso quando la colonia è grande (≥ 40) e l'aria umida (acqua ≥ 0,75 o ≥ 4 giorni di umido), al massimo uno ogni 90 giorni; poi `fondati` +1. Grafica: alate che salgono lungo il vetro.
  - `mosche`: `null` se estinte, altrimenti `{larve: n}`. Le larve crescono nel detrito/frutta e diventano adulte; ragni e coleotteri le mangiano (nutrono il predatore). Grafica: vermetti bianchi nel marcio.
- API: `sim.setRegina(true|false)` → bool (fa arrivare o toglie la regina: per eventi/carte); le chiavi nuove stanno in `clima` e si salvano con `save()` (vecchi salvataggi: partono da zero).
- Eventi nel quaderno (kind `ambiente`, seconda persona): collemboli compaiono/spariscono, uova nel nido, regina persa/arrivata, larve di mosca, sciame e nido fondato delle termiti.
- `engine_old.js` resta il motore storico senza `needs`: non ha clima, quindi non ha queste regole.

## Ritorno, dono della nonna, «Avanza di una notte», carta di cura (app1.js logica, app3.js interfaccia, testi in `story.js`)
- **«Mentre non c'eri»**: il popup `risveglio` ha ora `{eventi, giorni, notti}` (`notti` = notti svolte in questo accesso). L'interfaccia mostra **un solo foglio**: titolo «Mentre non c'eri», riga «Sono passate N notti» (`S.RITORNO.notti(n)`), 1–3 momenti, il dono della nonna se c'è, pulsante «Guarda il vaso». Nel foglio si accorpano le notti senza scelta in coda, i popup `notte-ora` e il `dono`; arrivi, decisioni e carte restano schede a parte (richiedono una scelta o una cerimonia).
- **Dono della nonna**: `checkNewDay()` su un nuovo giorno reale chiama `donoNonna()` → `{id, ic, t, fx}` | `null`; mette in coda `{t:'dono', id, ic, testo}` (fase ≥ 2). Stato `G.nonna = {ultimo (giorno reale), id, n}`. Un solo dono per giorno reale, mai accumulato, nessuna serie, nessun contatore. `S.NONNA = [{id, ic, t}]` (seconda persona); effetti piccoli: `acqua` (umidità +.08), `terra` (suolo +.08), `latte` (+2 mani, tetto massimo+2), `biscotto` (Biscotto resta buono 3 giorni), `spago` (+3 XP). Si sceglie col seme del giorno saltando i doni inutili (es. acqua con umidità > .85). `__app.donoNonna()` è idempotente nello stesso giorno.
- **Avanza di una notte**: `__app.avanzaNotte()` → `{ok, why?, passi, pausa, eventi, rimaste}`; `__app.avanzaInfo()` → `{n, max, why}` con `why` ∈ `'' | inizio | letargo | finale | decisione | tetto`. Una notte vera subito (come `passaNotte`), `calRow(oggi)[2]|=4`. Tetto `__app.AVANZA = {max:3, pausaMin:30}` per sessione: `G.ui.avanza = {n, visto}`; `checkNewDay()` aggiorna `visto` ad ogni chiamata, e se è passata più di `pausaMin` dall'ultima apertura `n` torna a 0. Nessun conto alla rovescia, nessuna notifica. Non tocca la serie. «Notti a orario» e «Salta 2» invariate. Interfaccia: pulsante rotondo `data-a="avanza"` nella barra (Tavola A), velato a `why`.
- **Carta ogni 7 giorni di cura**: `curaDay()` ora è chiamata da `doAct` a ogni cura riuscita (qualunque cura, anche gratis), non più solo dalla richiesta esaudita. Conta i giorni reali con almeno una cura (`G.carte.giorniCura`); al 7°, 14°… `drawCard(null,'cura')` + popup `carta`. `cardOdds().cura = {fatti, ogni:7}` invariato.

## Microclima (`window.__MICRO`, `__app.micro()`, `__app.tappo()`, `G.micro`)
Modello in `app/microclima.js` (ecologo), incluso da `build_app.py` prima di `app1.js`. Dettagli e numeri in `docs/ecologia/modello.md` §8.
- **Motore** (`sim.js`, solo con `needs`): `view().clima` → `{tappo:'aperto'|'chiuso', aperto (bool: tappo tolto o giorno dopo una cura), T (°C dentro), H (umidità dell'aria 0–1), ristagno, drenaggio, collemboli (0–1), umidiGiorni}`; `setTappo(bool)`; `setNeeds({rist})`. Con `needs:false` `clima` è `null` e lo storico non cambia (`equiv.js` a 0).
- **Logica**: `G.micro = micro.save()` + `ofs` (ora reale del primo passo); salvataggi senza `G.micro` si aprono e il microclima nasce allineato al vaso. Ogni `sim.step()` riuscito = `micro.step(6)` (6 ore reali), con `letargo` quando il vaso dorme. Cure: `acqua→bagna`, `nutri→nutri`, `terra→terra`, `pulisci→pulisci`, `wipeGlass→asciuga` (+ `pulisci` vetro se toglie macchie). Prima di ogni passo il microclima copia dal motore acqua, muffa, tappo, posizione, piante, drenaggio, collemboli.
- `__app.micro()` → `micro.view()` + `clima` del motore: `{t, tappo, aperto, posizione, aria:{rh, T, rugiada, Tmax}, stanza:{T}, T:{aria, suolo, vetro:{tappo, alto, medio, basso}}, acqua:{superficie, terriccio, drenaggio (0–1), ml, ristagno}, condensa:{tappo, alto, medio, basso} (0–1), gocce (g/h), muffa:{terra, vetro, foglie} (0–1), detrito, sporcoVetro, collemboli, luce:{lux, dli}, piante:{id:{vigore, crescita, biomassa, ombra}}, copertura, giungla, soffocato, brucatori, mangiato, mangiatoUltimo, potato, pota, letargo, clima}`. `null` prima di una partita.
- **Giungla (biomassa, brucatori, pota)** — solo `microclima.js`; il collegamento col motore e la grafica sono compiti successivi.
  - `view().piante[id]` ora ha anche `biomassa` (0–1, copertura del vaso di quella pianta; minimo 0,02: le radici ricacciano) e `ombra` (0–1, quanta luce le tolgono le piante più alte o la folla: la grafica la usa per ingiallire; `vigore` scende di conseguenza).
  - `view()` espone anche: `copertura` (somma delle biomasse, ~0–1), `giungla` (0–1: 0 sotto copertura 0,7, 1 a 1,0; per la grafica e il finale «giungla mista»), `soffocato` (bool, copertura ≥ 0,8), `brucatori` (input, 0–1), `mangiato` (biomassa mangiata in totale), `mangiatoUltimo` (nell'ultimo `step`), `potato` (totale potato), `pota:{pronta, attesa (ore), ultima:{ok, motivo:'riposo'|'vuoto'|'', pianta, tagliato}|null}`.
  - **Ingresso `brucatori`** (0–1, indice di lumache e coleotteri vivi: proposta `min(1, (lumache+coleotteri)/4)` dalla sim): `act('imposta',{brucatori:x})` o `act({tipo:'brucatori',v:x})`, oppure `create({brucatori:x})`. Il motore lo copia ogni passo insieme agli altri valori. Valori utili: 0,1 ritarda la giungla (soffoca al giorno 19 invece del 8), 0,2–0,35 equilibrio (copertura 0,4–0,6), ≥ 0,5 spela il vaso. I collemboli (già in `collemboli`) mangiano il detrito, non le piante.
  - **Cura `pota`**: `act('pota')` o `act({tipo:'pota',zona:'felce'})` (senza `zona` taglia la più invadente: biomassa pesata per altezza). Toglie il 40 % della biomassa, al massimo 0,3; vigore −0,05; il 30 % del tagliato diventa detrito. **Limite: una pota per giorno del vaso (6 h)**, la seconda dà `ultima.ok=false, motivo:'riposo'`. Come ogni cura toglie il tappo per un giorno del vaso. Il motore decide se costa un'azione.
  - Un giorno del vaso senza cure e senza brucatori: giungla al giorno 6, soffocato al giorno 8. In letargo la biomassa si ferma. Salvataggi vecchi senza `biomassa` si aprono (valori iniziali).
- `__app.tappo(aperto?)` → `{tappo, testo}`: `true` apre, `false` chiude, senza argomento inverte. Non conta come cura (non sveglia il letargo, non spende).

## Albero del vaso (`G.tree`)
`{nodes:[{k, lane, link?, t, d, cap, ch?, alt?, major?, img?}], snap}`.
`k` ∈ `inizio, nasce, estinta, muta, popolo, cultura, mostro, guerra, pace, pianta, oggetto, scelta, carta, gatto, capitolo`. `lane` = id specie o `vaso` (tronco). Per `scelta`: `ch` scelto, `alt` strada non presa. `img` = JPEG 112×112 in data URL (max 36).

## Vaso (`window.__vase`)
`set3d(on), is3d, cv, fitCv(), setView(v), zoomTo({kind,id}), reset(), hit(x,y), screenOf(id), fx(kind), bubble(id,emoji), groups, snap() → dataURL`.

## Notti e Biscotto (`window.__notti`)
`NOTTI:[{id, ic, w, c(view,G), x|x(view), fx?(A), ch?:[{l, o, fx?}]}]`, `GATTO:[capitolo0, null(=zampa), capitolo2, capitolo3]`, `destino(flags) → {k,t,x}`; `A` = `{sim, giveXP, bumpNeeds, pullArrival}`.

## Materiali (`window.__MATLIB(THREE)`)
`{DEF, ID, mat(slot|id), dress(group, objId)}`. Gli id coincidono con il §3 di `docs/brief-kimi-v2.md`. Quando Kimi consegna `aMat`, `dress` userà l'attributo invece dei colori.

## Modelli Kimi
Contratto completo in `docs/brief-kimi-v3.md` (tier swarm/close/hero, `_ANIM`, `_PIVOT`, `_EMIT`, clip). Ogni consegna passa dal controllo d'ingresso (agente tre-d + qa) prima di entrare.

### Modelli nel gioco (`window.__MODELLI`, in `app/modelli.js`, agente tre-d)
`__MODELLI(THREE, {critG, S, KLEN, camera, viewH, level, anchorOf, kimiGeo, fallbackGeo, SIZE}) → {crt, sync(view), move(dt, t, view, dry), ready, loaded, stats(), models}`.
- **Conta esatta**: per ogni specie viva si disegnano `Math.round(pop)` individui (minimo 1), in 3D e nella riserva 2D (`app/app2.js`). Lo stesso numero che la scheda del gruppo mostra («Sono circa N»).
- I GLB approvati (`assets/kimi/<id>/swarm.glb`, `close.glb`) e i LOD derivati (`vendor/lod/<id>_lod1.glb`, `_lod2.glb`, generati da `vendor/lod/make_lod.mjs`) vengono incorporati in base64 da `build_app.py` in `window.__GLB = {<id>: {swarm, close, lod1, lod2}}`. `hero.glb` non si incorpora (docs/DECISIONI.md §5). Il meteorite resta escluso finché Kimi non lo corregge.
- Un `InstancedMesh` per specie e per livello di dettaglio; i livelli si assegnano per grandezza a schermo entro un budget di triangoli per livello della guardia prestazioni (`level()` 0/1/2 → 64k/36k/20k): la guardia abbassa il dettaglio, mai il numero.
- Animazione nel vertex shader: attributi per istanza `iAnim` (fase del passo, velocità, stato 0 idle · 1 walk · 2 carry · 3 fight · 4 eat · 5 dead, tempo nello stato) e `iMut` (0–1,3: intensità del bagliore `_EMIT` verde `#7CF5C8`); uniformi `uTime`, `uDry`.
- `stats()` → `{<id>: {n, kind: 'glb'|'pass1', tiers: {close, swarm, lod1, lod2}}}` per QA e test. Esposto anche come `window.__v3d.modelli`.

## Video iniziale in 3D (`window.__APERTURA`, in `app/apertura.js`, agente finali)
`app/film.js` tiene testi, tocchi e stati (`window.__film` invariato: `start(cb,{replay})`, `scene`, `P`; in più `mode` ∈ `'2d'|'3d'`, `anchors()`, `info()`, `slots`, `_go(i)` solo per i test). Il film parte in 2D e passa al 3D appena `__APERTURA.create(el,{onFallback})` è pronto; resta in 2D con `window.__no3d`, errore, timeout (12 s) o guardia prestazioni (risoluzione → vetro semplice → 2D).
`create() → {kind:'3d', canvas, fit(), size(), frame(t,{id,st,P,lineI,fast}), anchors(id) → punti a schermo in pixel fisici {star|stone|jar|center}, info(), slots, dispose()}`.
**Slot dei modelli** (`slot(id)`, procedurale finché manca il file): `finestra`, `gelso`, `giardino`, `meteorite`, `barattolo`, `scrivania`, `lampada`, `quaderno`, `mano`. `build_app.py` incorpora `assets/kimi/<id>/close.glb` in `window.__GLB_APERTURA = {<id>: {close}}` (stesso formato di `__GLB`; mai `hero`); `apertura.js` legge anche `__GLB` per gli stessi id. Nomi dei nodi usati: `lid` (barattolo), `bulb` (lampada), `vetro`.

## Finale animato (`app/finali.js`, da costruire)
`playEnding(container, data, {onDone})` dove `data = {finale, nome, giorni, capitolo, culto, popolo, nodi: G.tree.nodes (con foto)}`. Durata 30–45 s, saltabile, tenere premuto accelera.

## Carte (`window.__carte`, in `app/carte.js`)
`carte.js` è solo presentazione: non decide quali carte escono e non tocca `G`. Si carica prima di `app3.js`.
```
__carte.init({app, audio, vase})          // __app, __au, __vase; app3 la chiama prima di ogni uso
__carte.reveal(dono, onDone)              // unboxing: velina → apertura → giro → festa → lettura
   dono = {id, fonte:'capitolo'|'cura'|'ricordo', nuova:bool}
   onDone({azione:'mazzo'|'gioca'})      // 'gioca' → app3 chiama H['carta-gioca']({id})
__carte.hand({onPlay(id)})                // ventaglio del mazzo sopra il vaso (trascina sul vaso = gioca)
__carte.albumHTML() → string · __carte.album(el)   // album a 4 set, sagome «come arriva», quote da cardOdds()
__carte.cardEl(id, {lato:'fronte'|'retro', mini?}) → HTMLElement
__carte.view(id) · __carte.isOpen() → bool (in busy()) · __carte.close() · __carte.ok() (il pulsante data-a="carta-ok")
Root dell'unboxing: id="cardrev" con data-st (arrivo·attesa·apertura·chiusa·giro·festa·lettura); pulsante accessibile data-a="carta-ok" (Apri → Gira → Nel mazzo). Ventaglio: id="hand", una .cardrow[data-id] per carta, pulsante data-a="carta-gioca". Visore: id="cardview".
Suoni richiesti ad audio.js (AU.sfx): carta-velina, carta-filo, carta-lembo, carta-gira, carta-posa, carta-lamina, carta-sasso, carta-foto, carta-timbro, carta-mazzo, carta-album, carta-vaso, carta-ventaglio, carta-pagina.
```
Logica → carte (`window.__app`, app1.js):
```
CARTE[id] = {n, ic, r:'carta'|'argento'|'sasso'|'ricordo', set:'tempo'|'casa'|'biscotto'|'cassetto', d, x, w, come?}   SET_CARTE = {set: nome}
drawCard(k, fonte) → {id, nuova, fonte}     giveCard(id, fonte) → {id, nuova, fonte} | null (ricordo già avuto)
cardOdds() → {carta:.70, argento:.22, sasso:.08, garanzia:{argento:n, sasso:m}, pesche, cura:{fatti, ogni:7}}   // stessa fonte della pesca
cardImg(id) → dataURL | null   (foto del ricordo: punta al nodo dell'albero, copiata solo se l'albero la scarta)
G.album = {id:{d, n, ni?, img?}} (sostituisce G.ui.viste, migrato al primo uso) · G.carte = {pA, pS, pesche, giorniCura, lastCura, nC, nA, nS}
Popup {t:'carta', id, fonte, nuova} per le pesche di cura e i ricordi; closeChapter() → {…, carta:id, cartaNuova}.
Ricordi (una volta sola): ric_muta (prima mutazione), ric_popolo (primo popolo), ric_finale (primo finale), ric_biscotto (fine della storia di Biscotto).
Pesca di cura: curaDay() in reqCheck → ogni 7 giorni (reali, non di fila) in cui fai ciò che il vaso chiede.
```

## Luci (`window.__LUCI`, in `app/luci.js`)
`__LUCI(THREE, {scene, renderer, camera}) → {set(tempo), update(dt), level(n), dispose()}`. `tempo` ∈ `giorno, sera, notte`. `level(n)` riceve il livello della guardia prestazioni (0 pieno · 1 ridotto · 2 minimo) e spegne gli effetti costosi. Tutte le luci, il tone mapping, l'esposizione, le ombre e i post-effetti vivono qui, non in `v3d.js`.

### Pota e brucatori (gioco, 27 ottobre 2026)
- `__app.pota()` → `{ok, motivo, pianta, tagliato, text}`; limite giornaliero = `micro.pota.pronta`; non costa mani. Pulsante «Pota» (icona `IC.pota`) visibile solo con `copertura > 0,6` o `giungla > 0`.
- Brucatori passati al microclima in `microSync`: `min(1, Σ min(2, pop/12) per lumache e coleotteri vivi / 6)` (due specie alla partenza = 0,33, equilibrio).
- Avvisi una volta per giorno del vaso: `G.ui.avSoff` («La felce ha coperto il muschio.», `ombra > 0,8`) e `G.ui.avMang` («Le lumache hanno rosicchiato le foglie.», `mangiatoUltimo > 0`); mai in letargo.

## Biologia reale del motore (29 ottobre 2026, ramo motore/biologia)
Regole cambiate **in `sim.js` e in `engine_old.js` insieme** (`equiv.js` resta a 0: è un test di regressione, non uno storico). Nessun cambio a `view()` né all'API; la chiave `radioattivo` resta (solo il nome mostrato è «Radiotolleranza»).
- Felce `foglie` 0,5 (poco appetibile). Radiotolleranza: +0,3 di tolleranza, niente più tossicità. Ogni mutazione ha un costo (riproduzione ×0,88–0,92; iperfertilità: piccoli più fragili `suscept`×1,2). Tetto **2 mutazioni per specie** (`th=[6,14]`): le app non devono assumere più di 2 elementi in `mut`.
- Pressione presente: corazza (predatore o secco `w<.35`), bioluminescenza (buio `s<.4`), iperfertilità (affollamento `pop/K>.6`); la riga `why` del registro lo spiega.
- Ragni: digiuno lungo, −0,8 %/giorno dopo 10 giorni senza prede (prima −3 % subito). Termiti: capacità ×0,8 (manca il legno morto; proposta: oggetto «legno», non fatto).
- **Guerra solo formiche contro termiti** (basta che entrambe abbiano ≥12 individui, niente società richiesta); le altre specie competono per il cibo. Finali «Conquista»/«Patto» di conseguenza più rari.
- Solo con `needs` (non toccano equiv): carnivora senza dipendenza dal detrito; tasso di riproduzione ×fattore temperatura (`clima.Tc`, <20 °C rallenta, 8 °C quasi fermo) e ×0,5 con acqua <0,2 (lumache hanno già l'estivazione). I collemboli restano l'indice `clima.collemboli` (nessuna specie nuova): menzione narrativa nell'evento esistente.

## Missioni e gocce (29 ottobre 2026, ramo motore/missioni; logica in `app1.js`, interfaccia in `app3.js`, testi in `story.js` come `S.MISS`)
Missioni da completare → **gocce** (valuta in tema: «gocce di rugiada») → si spendono per notti e salti in più. Mai soldi veri, nessuna scadenza, nessuna serie che si perde, nessun conto alla rovescia.
- **Stato** `G.miss = {gocce, tot, fatte, n, att:[{k, x, p, n, g, base, nuova}], recenti:[k], pronte, compri:{avanza, salto}, vista}` (creato al bisogno, i salvataggi vecchi restano validi). `att` = esattamente 3 missioni attive dalla fase 4 (vuoto prima). `x` = specie legata (id). `p` progresso, `n` obiettivo, `g` gocce di premio (1–3). `pronte` = «Avanza» extra comprati e non ancora usati (tetto 3). `vista` = false se ci sono missioni nuove non aperte (accende la pastiglia «Missioni» nelle notifiche).
- **Scelta**: dal vaso reale (`sim.view()` + arrivi). Ogni missione ha `puo(v)` (solo se fattibile adesso) e `morta(v,m)` (diventa impossibile: specie estinta, pianta sparita, nessun arrivo atteso). Una missione morta **si sostituisce da sola** e in silenzio (`G.miss.cambiate` conta, nessuna perdita). Il giocatore può anche cambiarne una a piacere, gratis. Una missione appena completata non per le 2 successive (`recenti`).
- **Eventi** (`missEv(tipo, arg)` chiamata da `doAct` → `cura`, `osserva` → `osserva`, `pota` riuscita → `pota`, arrivo accolto → `arrivo`, ogni notte svolta, da `afterDay`, quindi anche recupero e Salta 2 → `notte`). I progressi legati al tempo contano **una volta per giorno reale** (`m.u`): comprare notti non regala gocce a cascata. Tipi di missione: `vivi` (specie viva per 3 giorni reali), `pota` (felce e muschio presenti, poti), `osserva` (guarda da vicino una specie viva), `umidita` (2 giorni reali con umidità tra .40 e .85, si accumulano: niente reset), `fungo` (un fungo in salute nel vaso), `muta` (compare una mutazione nuova), `cure` (3 cure), `arrivo` (accogli un ospite).
- **Gocce**: +1…3 per missione compiuta (al massimo 2 missioni al giorno reale: `MISS.alGiorno`, poi il posto resta libero fino a domani; `missioni().riposo` lo segnala), +1 alla prima cura di ogni giorno reale (`curaDay`). Costi `__app.MISS.costo = {avanza:3, salto:6}`.
- **Spesa**: `__app.missSpendi('avanza')` → una notte in più oltre il tetto di sessione (`pronte++`; `avanzaWhy` non dà `'tetto'` finché `pronte>0`; `avanzaNotte` consuma una pronta invece di `G.ui.avanza.n`). `__app.missSpendi('salto')` → +1 «Salta 2» (tetto di acquisto `MISS.saltoMax = 8`; il dono giornaliero resta fermo a `POWER.max = 6`). Ritorno `{ok, why?}` con `why` ∈ `gocce | tetto | inizio`.
- **API** `__app.missioni()` → `{gocce, tot, fatte, pronte, costo, tetti:{avanza:3, salto:8}, vista, att:[{k, titolo, sotto, p, n, g, pct}]}`; `__app.missCambia(i)` sostituisce la missione i; `__app.missVista()` mette `vista=true`; `__app.MISS`. Completamento: popup in coda `{t:'missione', titolo, g}`, mostrato come avviso («Missione compiuta: …», livello medio) con anello e pop sulla pastiglia «Nuove missioni»; non è un foglio e non blocca i tocchi.
- **Ritmo atteso** (misurato con `SOLO='attivo' node app/bots.js`): il giocatore attivo sblocca ≈ 1 salto ogni 1–2 giorni reali; il tetto 6 dei doni e il tetto di sessione di Avanza non cambiano.
