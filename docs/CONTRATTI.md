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
| finali | nuovo `app/finali.js` (lettore dei mini video) |
| logica di gioco (orchestratore) | `app/app1.js`, `build_app.py` |
| qa | nessuno (sola lettura), scrive solo in `screenshots/` e report |
| luci | `app/luci.js`, `qa_luci.py` (in `app/v3d.js` solo la chiamata a `__LUCI`) |
| giocatore | `tools/giocatore.py`, `docs/giocatore/`, `screenshots/giocatore/` (sul gioco sola lettura) |
| ricerca | `docs/ricerca/` |
| showrunner | `docs/regia/` (sul gioco sola lettura: note a storia e finali) |
| direttore-artistico | nessuno (sola lettura: approva o respinge le schermate) |
| lancio | `docs/lancio/`, `store/` |

## Motore → app (`sim.js`)
`createSim(setup,{seed,game,decisions,needs})` → `{step, view, act, resolve, addSpecies, removeSpecies, addPlant, removePlant, addObject, removeObject, setNeeds, charge, growMeteo, setMalus, closeChapter, save, load, log, pending, d, chapter, E}`.
`view()` → `{d, chapter, setup, vit, E, sp:[{id,nome,icon,pop,alive,mut[],society:{name,cult,since,culto}|null,monster,size,gen}], plants, wars:[[a,b]], pending, needs:{um,ter,pul}}`.
`log[]` → `{d, kind, icon, text, why[]}`.

## Logica → interfaccia (`window.__app`)
Funzioni principali: `newGame, act, passaNotte, takeArrival, resolveDecision, playCard, closeChapter, nightFx, gattoChoice, pickNight, treeDiff, persist`. Stato in `__app.G` (salvato). Letargo (docs/DECISIONI.md §1): `G.letargo = {da, giorni}` (giorno reale d'inizio e giorni di assenza; `null` quando il vaso è sveglio), `G.ui.letargoN` e `G.ui.risvegli` contatori; `G.real.leth` è interno.
Power card «Salta 2 giorni» (si consumano, non entrano nell'album): stato in `G.power = {salto, ultimoDono, donoN, usate, resto}`. `__app.POWER` → `{max:6, dono:2, giorni:2}`. `__app.powerCards()` → `{salto, max, nuove, resto, why}` con `why` ∈ `'' | carte | inizio | letargo | finale | decisione` (`''` = usabile; chiamarla esegue il dono del giorno se dovuto). `__app.usaSalto()` → `{ok, why?, passi, pausa, resto, eventi}`: due notti vere, una sola notte viva in coda; se la prima notte si ferma su una decisione, la seconda riparte da sola dopo `resolveDecision`. Regole: 2 al primo accesso di ogni giorno reale (non si accumulano in assenza), tetto 6, bloccate in avvio, letargo, finale da chiudere, decisione in sospeso; non toccano la serie. Popup in coda `__app.popups` con `t` ∈ `arrivo, decisione, finale, pagina, risveglio, biscotto, notte, gatto, livello, carta`.

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
