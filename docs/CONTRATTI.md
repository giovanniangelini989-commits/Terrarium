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
Funzioni principali: `newGame, act, passaNotte, takeArrival, resolveDecision, playCard, closeChapter, nightFx, gattoChoice, pickNight, treeDiff, persist`. Stato in `__app.G` (salvato). Letargo (docs/DECISIONI.md §1): `G.letargo = {da, giorni}` (giorno reale d'inizio e giorni di assenza; `null` quando il vaso è sveglio), `G.ui.letargoN` e `G.ui.risvegli` contatori; `G.real.leth` è interno. Popup in coda `__app.popups` con `t` ∈ `arrivo, decisione, finale, pagina, risveglio, biscotto, notte, gatto, livello, carta`.

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
Contratto completo in `docs/brief-kimi-v2.md` (scala, LOD, `aMat`, `aAnim`, `aPivot`, `iAnim`, `patchMaterial`, clip). Ogni consegna passa dal controllo d'ingresso (agente tre-d + qa) prima di entrare.

## Finale animato (`app/finali.js`, da costruire)
`playEnding(container, data, {onDone})` dove `data = {finale, nome, giorni, capitolo, culto, popolo, nodi: G.tree.nodes (con foto)}`. Durata 30–45 s, saltabile, tenere premuto accelera.

## Luci (`window.__LUCI`, in `app/luci.js`)
`__LUCI(THREE, {scene, renderer, camera}) → {set(tempo), update(dt), level(n), dispose()}`. `tempo` ∈ `giorno, sera, notte`. `level(n)` riceve il livello della guardia prestazioni (0 pieno · 1 ridotto · 2 minimo) e spegne gli effetti costosi. Tutte le luci, il tone mapping, l'esposizione, le ombre e i post-effetti vivono qui, non in `v3d.js`.
