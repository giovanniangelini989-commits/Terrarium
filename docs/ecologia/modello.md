# Il modello del microclima (app/microclima.js)

Modulo autonomo: `window.__MICRO` nel browser, `module.exports` in node. Non tocca `sim.js` né altri file. Le fonti dei numeri sono in `studio.md` (§ indicati); ogni semplificazione è scritta e motivata.

## 1. API

```js
const m = __MICRO.create(stato0);     // stato0: {piante:['muschio','felce'], tappo:'chiuso'|'aperto', posizione:'ombra'|'mezza'|'sole', T, superficie, terriccio, drenaggio (ml), detrito, collemboli, muffa}
m.step(ore, ambiente)                 // avanza di `ore` (sotto-passi di 15 min); ambiente = oggetto o funzione(t) → {T, Tfinestra, sole, lux, rh, letargo}
m.act('bagna', 30) · act('terra') · act('pulisci', {zona}) · act('asciuga', {zona, v}) · act('apri') · act('chiudi') · act('sposta', 'sole') · act('collemboli', .4) · act('pianta', 'fungo') · act('togli', 'fungo')
m.view()  → { aria:{rh, T, rugiada}, T:{aria, suolo, vetro:{tappo,alto,medio,basso}}, acqua:{superficie, terriccio, drenaggio (0–1), ml:{…}, ristagno}, condensa:{tappo,alto,medio,basso} (0–1), gocce (g/h), muffa:{terra,vetro,foglie} (0–1), detrito, sporcoVetro, collemboli, luce:{lux (migliaia), dli}, piante:{id:{vigore, crescita}}, tappo, posizione, letargo }
m.save() / m.load(o)
__MICRO.ambienteDi(ora, {stagione, posizione, meteo})   // stanza con finestra, giorno/notte e stagione
__MICRO.eSat(T), dewPoint(T, rh), absHum(e, T), PIANTE, JAR
```

## 2. Passo temporale

- L'unità è **l'ora reale**; `step(ore)` spezza in sotto-passi di 0,25 h. Il giorno/notte viene dall'ambiente (`ambienteDi` usa l'ora 0–24; nel gioco si passa l'ora vera, come fa `isNight()` in `app2.js`).
- Compatibilità col motore: un giorno del vaso = 6 ore reali (4 giorni per giorno reale, `RITMO`), quindi per ogni `sim.step()` si chiama `micro.step(6, ambiente)`. Le notti del gioco («Passa la notte») possono chiamare `step(10)` con un ambiente notturno.
- **Letargo** (docs/DECISIONI.md §1): `ambiente.letargo = true` fa continuare la fisica ma blocca i valori alle soglie: terriccio ≥ 0,30, superficie ≥ 0,20, muffa ≤ 0,50, vigore delle piante ≥ 0,40. Stesse soglie di `LETARGO` in `app1.js` (`um 0,3`, `pul 0,5`). Con 20 giorni di assenza il passo costa 1 920 sotto-passi: pochi millisecondi.

## 3. Variabili di stato

| Variabile | Unità | Significato |
|---|---|---|
| `T.aria`, `T.suolo`, `T.vetro[z]` | °C | aria dentro, superficie del suolo, vetro per zona (tappo, alto, medio, basso) |
| `acqua.superficie / terriccio / drenaggio` | g (= ml) | acqua per strato; capacità 30 / 240 / 75 g |
| `rh`, `e` | – , hPa | umidità relativa e pressione di vapore dell'aria interna (quasi-equilibrio) |
| `film[z]` | g | velo di condensa per zona (cap. 2 g → `condensa = film/2`) |
| `gocce` | g/h | acqua che cola dal vetro alla terra |
| `marciume` | 0–1 | ristagno: drenaggio pieno e terriccio saturo |
| `muffa.terra / vetro / foglie` | 0–1 | rischio-copertura per zona |
| `detrito`, `sporcoVetro`, `collemboli` | 0–1 | materia morta, sporco sul vetro, popolazione dei decompositori |
| `lux`, `luxMed`, `dli` | kilolux | luce istantanea, media mobile ~24 h, integrale |
| `piante[id].vigore / crescita` | 0–1, – | salute e crescita cumulata |

## 4. Geometria del barattolo (numeri con fonte e semplificazione)

| Grandezza | Valore | Da dove |
|---|---|---|
| Barattolo | ø 11 cm, ~2 L, aria 1,5 L | il «barattolo alto» del gioco |
| Terriccio | 5 cm × 95 cm² = 475 ml; capacità d'acqua **240 g** | 40–60 % del volume in acqua alla capacità di campo (MSU, USU, studio §2): preso 50 % |
| Drenaggio | 2 cm di ghiaia, **75 g** di acqua | strato 2,5–5 cm consigliato (Penn State); porosità ~40 % |
| Superficie (muschio, primo cm) | **30 g** | semplificazione: strato che evapora direttamente |
| Velo sul vetro | **2 g per zona** | stima nostra: va misurata pesando un barattolo appannato |
| Acqua in aria | 0,035 g a 25 °C saturi | Magnus (§3): è per questo che l'aria è in **quasi-equilibrio** e non è una variabile di stato |

## 5. Equazioni

### Temperatura
- `dT_aria/dt = (T_stanza − T_aria)/1 h + 8·sole` → a pieno sole il barattolo chiuso va a **+8 °C** sopra la stanza (col tappo aperto 60 %). *Stima*: il meccanismo è documentato (§4), il valore no; +3 °C misurati con lampade LED danno l'ordine di grandezza basso. Da tarare.
- `dT_suolo/dt = (T_aria + 3·sole − T_suolo)/3 h`: il suolo ha inerzia e il sole lo scalda direttamente.
- Vetro per zona: `T_vetro[z] → T_aria·(1−k_z) + T_fuori·k_z` con τ 15 min; `k` = tappo 0,7 · alto 0,6 · medio 0,5 · basso 0,35 (il tappo e l'alto sono i più esposti, il basso è scaldato dal suolo). `T_fuori` di notte è la temperatura **del vetro della finestra**, più bassa della stanza (vetro singolo = superficie più fredda, §3): −6 °C d'inverno, −3 di mezza stagione, 0 d'estate, pesati per la vicinanza alla finestra.

### Vapore (quasi-equilibrio, bilancio lineare)
Ogni sorgente/pozzo scambia con l'aria con una conduttanza `g` [g/(h·hPa)] verso la sua pressione di vapore:
- superficie bagnata: `g_S = (0,05 + 0,10·sole)·bagnato`, verso `e_sat(T_suolo)`;
- stanza: `g_X` = **0,07 aperto**, **0,0005 chiuso**, verso `e_stanza = e_sat(T_stanza)·rh_stanza`;
- piante (traspirazione): `g_P = 0,01·vigore·(0,3 + lux/10)` per pianta, dal terriccio;
- vetro per zona: `g_Z = 0,1·area_z·4`, verso `e_sat(T_vetro[z])`, **attivo solo se condensa** (vetro sotto il punto di rugiada) o se c'è già un velo da far evaporare.

`e = Σ g_i·e_i / Σ g_i`, limitato a `e_sat(T_aria)`; `rh = e/e_sat(T_aria)`. I flussi `g_i·(e_i − e)·dt` spostano grammi d'acqua: la superficie evapora, i veli crescono o evaporano, la stanza porta via (aperto) o quasi niente (chiuso).

**Taratura**: aperto a 22 °C, 50 % in stanza, terra umida → rh interna ≈ 0,7 e perdita ≈ 9 ml/giorno (bagnare 50 ml a settimana, §1). Chiuso → rh ≈ 0,95–1,0 e perdita ≈ 0,3 ml/giorno (mesi senza acqua, §1).

### Condensa e gocce
- `film[z] += g_Z·(e − e_sat(T_vetro[z]))·dt` (negativo = evapora, non sotto 0).
- Sopra il 60 % della capacità il velo **cola**: `gocce = (film − 1,2 g)·0,5/h`, che tornano alla superficie. Soglia *stima*.
- Risultato: mattina appannata/pomeriggio chiaro in mezza stagione e inverno (il vetro si scalda prima dell'aria), velo persistente e gocce nel barattolo troppo bagnato o al sole (§3: «appannato 24 h = troppa acqua o troppo calore»).

### Acqua negli strati
- Versata: 30 % in superficie, 70 % nel terriccio.
- Superficie > 30 g → percola nel terriccio (τ 0,5 h); terriccio > 240 g → scende nel drenaggio (τ 2 h); drenaggio → terriccio per risalita 0,3 g/h se il terriccio è sotto il 50 %; terriccio → superficie per capillarità fino a ~10 ml/giorno quando la superficie è secca.
- **Ristagno** `marciume`: +0,004/h se drenaggio ≥ 95 % e terriccio ≥ 95 %, −0,002/h altrimenti (§2: radici senz'aria).

### Luce
- `lux` dall'ambiente: davanzale al sole 9 kl di picco, mezza luce 3 kl, ombra 0,4 kl (§4: sud 5–10 kl, nord 0,2–0,5 kl); il vetro chiuso toglie l'8 %. `luxMed` (media ~24 h) ×2,2 ≈ picco diurno equivalente, usato dalle piante così la notte non è «stress».

### Muffa per zona (terra, vetro basso, foglie)
`dM/dt = 0,02·f_RH·f_T·substrato·(1 − 0,3·aperto)·(1 − M) − (0,004 + 0,02·aperto·(1 − f_RH) + 0,035·collemboli + 0,01·luce_UV)·M`
- `f_RH = clamp((rh_superficie − 0,80)/0,17)`: 0 all'80 %, 1 al 97 % (§6: soglia 0,8 di attività dell'acqua; VTT, Smithsonian). La terra bagnata e il vetro con velo contano come 98 %.
- `f_T = 1 − |T − 25|/20`: zero a 5 e 45 °C (§6: 5–50 °C, più lenta al freddo).
- substrato: terra `0,4 + 0,6·detrito`, vetro `0,25 + 0,75·sporco`, foglie `0,2 + 0,8·stress piante` (§6: materia morta, sporco colato, foglie stressate).
- Velocità: a 25 °C, rh 97 %, substrato pieno, da 0 a 0,6 in **~3 giorni**; a 20 °C e detrito medio ~5 giorni; con l'80 % non cresce. Coerente con «settimane sopra l'80 %» (VTT) e «si stabilisce nelle prime settimane» (Penn State). Le isoplete di Sedlbauer darebbero tempi di germinazione più precisi: non le ho potute leggere (fonte secondaria).
- Cure: `pulisci` ×0,1 sul vetro, ×0,4 sulla terra; `apri` asciuga e ventila; `collemboli` mangiano (0,035/h a popolazione piena: con collemboli 0,6 la muffa si assesta a ~0,3 anche nel chiuso, §6–7).

### Piante
`bene = min(f_luce, f_rh, f_acqua, f_T)`; `vigore → bene` con τ 48 h; penalità per ristagno > 0,5 e muffa sulle foglie > 0,6. Finestre (studio §5), con plateau largo attorno all'ottimo:

| Pianta | lux (kl) min/opt/max | rh | acqua terriccio | T °C min/opt/max |
|---|---|---|---|---|
| muschio | 0,3 / 3 / 8 | 0,75–1 | 0,35–0,95 | 5 / 15 / 28 |
| felce | 1 / 5 / 10 | 0,6–1 | 0,4–0,85 | 12 / 20 / 30 |
| succulenta | 5 / 10 / 30 | 0,1–0,55 | 0,08–0,4 | 15 / 25 / 38; `bene = 0` se rh > 0,8 o ristagno > 0,3 |
| fungo | buio ≤ 3 | 0,85–1 | 0,5–1 | 10 / 18 / 26; × (0,3 + 0,7·detrito) |
| carnivora | 4 / 8 / 20 | 0,6–0,9 | 0,6–1 | 18 / 25 / 32 |

Semplificazioni dichiarate: una sola specie per tipo; niente dormienza invernale delle carnivore; il muschio «si riprende in ore» è reso dalla τ di 48 h (lento) — se la storia vuole il risveglio rapido, basta una τ di 6 h al rialzo.

## 6. Cosa non c'è (e perché)
- Niente CO₂/O₂: nel chiuso con piante si bilancia da sola (Latimer); non cambia nulla di visibile.
- Niente carbone attivo come variabile: effetto su odori, non sul microclima.
- Niente animali come variabili fisiche tranne i collemboli: le formiche/lumache del gioco restano nel motore; il modello espone `rh` e `T` perché il motore possa farle estivare o rifugiarsi.
- Il barattolo aperto non ha «spiffero» variabile: una sola conduttanza; basta per distinguere aperto/chiuso.

## 7. Verifica
`node microclima_test.js`: 6 scenari (estate al sole col tappo chiuso, inverno alla finestra, troppa acqua, trascurato + letargo + risveglio, muffa che nasce e si combatte, save/load), 29 controlli, tutti verdi al 24 ottobre 2026.
