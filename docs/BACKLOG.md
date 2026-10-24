# Backlog (ordine di priorità)

## In corso
- [ ] **tre-d — Vetro vivo** (`app/v3d.js`, blocco `glassFX`): condensa che cresce con l'umidità e si pulisce passando il dito sul vetro (abbassa l'umidità), gocce che scendono aprendo scie, muffa sul vetro (si toglie strofinando, alza la pulizia) e colonie di muffa sulla terra. Funziona ma **non è ancora realistico**: da vicino le goccioline sembrano pois scuri (devono essere lenti trasparenti: puntini più chiari nella nebbia, bordo sottilissimo, piccolo riflesso); le colonie di muffa sulla terra da vicino sembrano stelline. Riferimenti: github.com/olefriis/misty-window, «Kinetic Fog Glass». Verifica con `python3 qa_vetro.py`.
- [ ] **design — Meteorite**: Giovanni sta definendo il design con immagini di riferimento; poi brief per Kimi.

## Sprint 1 (proposto)
- [ ] **finali** + **storia**: primo mini video di finale, «La Fede» (popolo che adora il bambino). Riassume i rami dell'albero con le foto. GSAP per la linea temporale, gl-transitions per i cambi di scena. Brief per Kimi degli elementi 3D animati.
- [x] **interfaccia**: micro-interazioni a tre livelli (`app/fx.js`, animazioni native). Da fare: il nodo dell'albero che si espande nella scheda (Flip).
- [ ] **tre-d**: scena di riferimento + script di controllo d'ingresso per le consegne di Kimi (lista §9 del brief v2).
- [ ] **storia**: riscrivere in prima/seconda persona i 10 punti che ancora dicono «il bambino» (pagine del quaderno, storia).
- [ ] **motore**: ribilanciare notti e bisogni con le nuove notti vive (gli effetti degli eventi notturni cambiano umidità e carica).

## Dopo
- [ ] Integrare gli asset di Kimi secondo `docs/brief-kimi-v3.md` (qualità fotografica, tre livelli hero/close/swarm, controllo d'ingresso `tools/qa_gate.mjs`). Pass A (formica) in lavorazione.
- [ ] Finali animati per gli altri finali (uno per volta, stesso lettore).
- [ ] Carte: ripensarle (illustrazione, animazione, dove si giocano).
- [ ] Brand book / guida visiva.
- [ ] Validazione regole consumatori (bisogni + morte per trascuratezza), regole Malta/Italia.
- [ ] Privacy policy, icona, screenshot App Store, involucro nativo (vibrazione nativa).

## Noti
- In 2D (riserva quando il 3D non regge) il realismo è minore: accettato.
- Il ragno di Kimi pass 1 ha zampe troppo corte (0,23 invece di 0,55).
