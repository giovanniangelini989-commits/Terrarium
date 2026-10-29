# Audit di realismo dell'ecosistema (29 ottobre 2026)

Direzione di Giovanni: ecosistema reale al 100%, il meteorite è l'unico elemento fantastico. Verdetti: **ok**, **da correggere**, **irreale**, **fantasia (meteorite)** = ammessa perché è una mutazione. Colonna «fatto» = già corretto in questo ramo (solo `microclima.js`/`piante.js`); `sim.js` è sola lettura e resta uguale a engine_old: le correzioni sono proposte al motore (P1…).

Fonti web consultate in questa sessione (altre già in `studio.md`): [Smith et al. 2019, *Cornu aspersum*](https://wou.edu/wp/baltzlem/files/2024/12/Cornu_microbiota_Smith_et_al_2019.pdf) (lumaca generalista, mangia piante vive e morte, assume suolo per il calcio) · [Ortega-Hidalgo et al., ibernazione](https://iobc-wprs.org/product/hibernation-and-latitude-in-helix-cornu-aspersa-an-attempt-to-integrateenvironmental-restrictions-to-active-life-length-of-stasis-enduranceand-metabolic-costs/) (fino a 7,5 mesi, nessuna sotto 35°N) · [Duman et al. 2019](https://doaj.org/article/b68c3ca1613345738a9ca9e35f6cc9d1) (alimentazione e crescita salgono con la temperatura) · [Nesticodes rufipes, risposta funzionale tipo II](https://journals.ekb.eg/article_86933.html) (ragni digiunano 20 giorni, saziati in una settimana) · [Terrarium Tribe, collemboli](https://terrariumtribe.com/?p=19473) e [Tropical Glass, muffa](https://tropicalglass.co.uk/blogs/blog/tackling-mould-in-terrariums-the-comprehensive-guide) (collemboli e isopodi contro la muffa, aria ferma la favorisce) · [Karnivores, coltivazione](https://www.karnivores.com/en/3797-growing-tips-for-each-plant) e [RHS Dionaea](https://www.rhs.org.uk/plants/5893/i-dionaea-muscipula-i/details) (carnivore: tanta luce, torba povera, aria). Dati classici citati a memoria dai manuali (da verificare prima di scriverli nel gioco): Hendrix 1980 e Cooper-Driver 1978 (felci poco appetibili: composti difensivi, ptaquiloside), Dadachova et al. 2007 (funghi melanizzati e radiazione), Proctor (muschi poichilidri), Magnus/Sensirion (vapore saturo).

## Microclima e piante (i miei file)

| Regola | Nel gioco | Nella realtà (fonte) | Verdetto | Correzione |
|---|---|---|---|---|
| Vapore saturo, punto di rugiada | Magnus α=6,112, β=17,62 | identico (Sensirion/NPL) | ok | — |
| Condensa notturna e a gocce | vetro più freddo dell'aria, film → gocce oltre 2 g | è il ciclo reale del barattolo chiuso (studio.md §2) | ok | — |
| Effetto serra al sole | 36,7° dentro con 27° fuori | barattoli chiusi al sole 35–45° (guide terrari) | ok | — |
| Succulenta in vaso chiuso | benessere 0 se rh>0,8; marcisce | corretto: chiede aria secca e poca acqua | ok | — |
| Muschio secco | si ingiallisce, si riapre con l'acqua | muschi poichilidri tollerano l'essiccazione (Proctor) | ok | — |
| Muffa: umido, aria ferma, materia morta, 5–45 °C | come nel §5 | Penicillium/Aspergillus crescono con aw>0,8, 20–30 °C | ok | — |
| Collemboli/isopodi contro la muffa | −0,04·collemboli | confermato dalle guide, ma è prevenzione, non cura istantanea | ok | — |
| Crescita lineare lenta, vaso vuoto per giorni | forma da «ore buone», ~1 a notte | una piantina in terrario cresce visibilmente in giorni | da correggere | **fatto**: curva ease-out e tempo ×3,3 (modello §9) |
| Vaso soffocato in 8 notti | giungla n. 6, soffoca n. 8 | si pota ogni 2–4 settimane (guide terrari) | irreale | **fatto**: giungla n. 26, soffoca n. 35 (`KT`) |
| Appetibilità della felce 1 (la massima) | le lumache mangiano prima la felce | le felci sono poco appetibili (difese chimiche, Hendrix 1980); le lumache preferiscono foglie tenere e marcio (Smith 2019) | irreale | **fatto**: `pal` felce 0,5 (test verdi, equilibrio coi brucatori invariato) |
| Ombra: etiolamento | solo giallo e afflosciamento | all'ombra i fusti si allungano e si assottigliano (etiolamento) | da correggere | **fatto** in `piante.js`: volY ×(1+0,22·ombra), volX ×(1−0,1·ombra) |
| Fototropismo | nessuno | le piante si piegano verso la finestra (auxina, luce blu) | da correggere | P-tre-d1: curvare la chioma verso il lato finestra di 5–10° nello shader, proporzionale alla luce laterale |
| Crescita di notte ×0,2 | biomassa quasi ferma al buio | la fotosintesi si ferma, l'espansione cellulare continua di notte ma più piano | ok (semplificazione) | — |
| Luce a giorni di 11 h | profilo a seno | ok per latitudine media | ok | — |
| Letargo in assenza | biomassa e acqua si congelano | nella realtà il vaso continua; è una scelta di gioco (DECISIONI §1) | irreale per scelta | resta, dichiarato nella nota «cosa non c'è» |
| Carnivora come pianta normale | benessere acqua 0,6–1, rh 0,6–0,9 | vuole torba povera e luce forte; non cerca nutrienti (Karnivores, RHS) | ok nel microclima | vedi P3 per `sim.js` |

## Creature e catene alimentari (`sim.js`, sola lettura)

| Regola | Nel gioco | Nella realtà (fonte) | Verdetto | Correzione proposta (motore) |
|---|---|---|---|---|
| Fame dei ragni | se le prede <8, −3 % al giorno della popolazione | un ragno digiuna 20 giorni e oltre, saziato in una settimana (*Nesticodes*, tipo II) | da correggere | P1: −0,8 % al giorno, e solo dopo 10 giorni senza prede |
| Predazione | cresce con ragni e con prede, satura sulle prede (`pop/(pop+25)`) | risposta funzionale di tipo II (Holling), con sazietà | ok | P2 (opzionale): limite per ragno al giorno |
| Nutrienti per la carnivora | `v *= 0,45+1,1·detrito` per tutte le piante | le carnivore crescono in torba povera; il troppo nutriente le danneggia | irreale | P3: nessuna dipendenza dal detrito per la carnivora; la sua risorsa sono le prede |
| Felce «cibo ricco» | foglie=1, la più nutriente per gli erbivori | poco appetibile (Hendrix 1980); lumache e coleotteri preferiscono foglie tenere, muschio e marcio | irreale | P4: foglie felce 0,5, succulenta 0,8 |
| Lumache «misto» | 0,6 foglie + 0,6 marcio | generalista su vive e morte, assume suolo (Smith 2019) | ok | — |
| Alimentazione dipendente dal caldo | `suit` da luce e acqua, non da temperatura | l'assunzione di cibo cresce con la temperatura (Duman 2019) | da correggere | P5: moltiplicare r per il fattore temperatura che il microclima già calcola (`T.aria`) |
| Letargo di lumache e insetti | nessuno, le specie non vanno in letargo | le lumache ibernano o estivano (Ortega-Hidalgo): sotto ~10 °C o in secco | da correggere | P6: con `T.aria` <10 °C o acqua <0,15 attività ×0,2 invece di morte |
| Termiti in un barattolo | specie «marcio», buio, umido | mangiano legno morto; la polpa umida del terriccio non basta | da correggere | P7: dieta «legno», serve un pezzo di legno (oggetto) |
| Mosche | dieta marcio, rep 1,8 | larve su materia in fermentazione; ciclo 10–14 giorni | ok | — |
| Formiche | onnivore, sociali | ok; nidificano nel secco, non nel fradicio | ok | P8 (opz.): disagio se acqua >0,8 |
| Muffa nel motore (B2) | umidità, 25 °C, materia morta; cala con aria, luce, collemboli | come sopra | ok | — |
| Funghi «si nutrono di radiazione» | `rad:-0,7` | funghi melanizzati lo fanno davvero, ma con effetto piccolo (Dadachova 2007) | fantasia (meteorite) | resta, solo con il meteorite presente |
| Radioattivo, corazza, veleno, bioluminescenza, gigantismo | mutazioni | non esistono in natura così | fantasia (meteorite) | restano: sono l'unico fantastico; devono comparire solo con il meteorite (verificare nel motore) |

## Le cinque irrealtà più gravi
1. Vaso soffocato in 2 giorni reali (corretto: 35 notti).
2. Felce come cibo preferito dei brucatori (corretto: 0,5; proposta P4 per `sim.js`).
3. Ragni che muoiono di fame in pochi giorni (P1).
4. Le carnivore soffrono se manca il «nutrimento» del terreno (P3).
5. Nessun letargo o rallentamento per freddo/secco di lumache e insetti (P5, P6); il letargo del vaso resta scelta di gioco.

## Proposte numerate per il motore (nessuna cambia `engine_old`: da fare solo dopo il via di Giovanni, poi riallineare `equiv.js`)
P1 fame ragni · P2 limite di sazietà · P3 carnivora senza detrito · P4 `foglie` di felce 0,5 · P5 temperatura nel tasso di riproduzione e di cibo · P6 rallentamento da freddo/secco · P7 termiti e legno · P8 formiche e fradicio. Aggiungere a P-tre-d1 (fototropismo). Il microclima dà già `T.aria`, `acqua.terriccio` e `brucatori`, quindi non servono nuovi campi.
