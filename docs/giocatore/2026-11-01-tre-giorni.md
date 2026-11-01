# Tre giorni con quattro giocatori, 1 novembre 2026

Build di oggi (`dist/terrario-gioco.html`), 390x844, UA iPhone, **vaso 3D vero** (swiftshader) nelle sessioni segnate «3D», vaso 2D di test nelle altre. Il tempo reale è simulato spostando l'orologio del gioco (`G.dev.offset`, fino a 0,5 giorni per le seconde sessioni del giorno) e ricaricando la pagina; un giorno vero = 4 notti nel vaso. Tutte le scelte sono tocchi sui pulsanti visibili (video, cure, Notte/Salta, schede, missioni, Riscuoti, quaderno, carte, Osserva). Le «durate» sono il tempo di una persona (lettura e tocchi), non quello del computer. Script e dati grezzi: `/tmp/claude-0/-home-user/c7b2381a-3ddb-563b-8f45-5c4cdc86c3df/scratchpad/giocatori/` (`<persona>/res.json`).
Limiti: alcuni tocchi sul pulsante delle missioni e su Salta sono stati rifiutati da Playwright perché i pulsanti pulsano (con il dito funzionerebbero): non li conto come difetti. Il curioso ha riaperto la scheda Missioni più volte di fila perché il mio script la tratta come notifica: lo conto come segnale, non come bug.

## Voti «quanto ho voglia di tornare domani»
| Persona | Giorno 1 | Giorno 2 | Giorno 3 |
|---|---|---|---|
| Curioso | 8 | 7 | 6 |
| Frettoloso | 5 | 5 | 5 |
| Distratto | 6 | 6 (dopo 3 giorni) | 6 (dopo altri 3) |
| Ostinato | 5 | 4 | 4 |

## 1. Curioso (5 sessioni, 3 giorni)
- **G1 mattina, 3D, circa 4 min.** Video completo, guida «Metti la terra / Bagna», arrivo «Dal bosco dietro casa» accolto, Salta (giorno 0 -> 2), «Come sta il vaso», menu. 122 testi nuovi. Incuriosito: «Sogni il sasso che ti parla», il sasso che batte. Confuso: finita la guida, nessun invito su cosa fare (6 segnalazioni).
- **G1 sera, 2D, circa 4,5 min.** Seconda arrivo («Dalla serra della nonna»), scorrimento veloce (giorno 4 -> 7), «Dal giardino», prime Formiche, Osserva. Noia dopo 60 s senza novità (invito: «Sul davanzale trovi 2 salti»).
- **G2 mattina, circa 4,5 min.** «Senti un graffio sul vetro, accendi la torcia?» (lascia stare), idea «Le formiche vanno…», Guarda da vicino, missioni, Riscuoti. Solo 43 testi nuovi.
- **G2 sera, circa 6 min.** Quasi niente di nuovo (5 testi, 2 pannelli): stessa idea «Osserva il vaso», missioni in giro, 6 schede Missioni aperte.
- **G3 mattina, circa 6,5 min.** 11 schede. Novità 9 testi. Ancora «Le formiche van…» e Guarda da vicino.
- Voto 8 -> 6: il racconto e gli arrivi lo conquistano, dal terzo giro ritrova le stesse schede.

## 2. Frettoloso (3 sessioni da circa 30 s)
- **G1 (3D).** Salta il video con «Salta ›», fa la guida in pochi tocchi, accoglie «Dal bosco». Vaso a giorno 0, nessuna creatura. 1 scheda.
- **G2 (3D, vaso a giorno 4).** «Casa» (Mentre non c'eri) chiusa, «Dalla serra della nonna», idea «La felce arrotol…» -> Acqua. Il vaso è terra, sasso e una felce: nessun animale. 3 schede in 28 s.
- **G3 (2D, giorno 8).** «Casa», «Stanotte: Sì, un goccio», «Dal giardino». Prime Formiche. 4 schede in 27 s.
- Voto 5 fisso: «Faccio tre tocchi, ne chiudo altri tre, e il vaso è uguale a ieri».

## 3. Distratto (3 visite: giorno 1, giorno 4, giorno 7)
- **V1 (3D, circa 40 s).** Video intero, guida, arrivo, notte «Lo lasci riposare», Salta (0 -> 2).
- **V2 (3D, dopo 3 giorni, circa 80 s, vaso da giorno 2 a 14).** Scheda «Mentre non c'eri: sono passate 12 notti» con le righe «Ha bisogno del terreno: tocca Nutri» e «dell'acqua: tocca Acqua» e pulsanti Nutri/Acqua accanto; 6 schede in tutto (2 arrivi, 2 Stanotte, idea). Barre 30/20/90, il vaso è bellissimo (felce lilla, formiche, chiocciola) ma nulla è andato perso.
- **V3 (2D, dopo altri 3 giorni, vaso a giorno 26, circa 45 s).** Mutazione «Le formiche: iperfertili» (sceglie «Lascia fare»), arrivo «Dalla finestra», le Mosche. Salta non ha cambiato il giorno (26 -> 26) e non gli è stato detto perché.
- Voto 6: gli piace tornare, ma non c'è mai un motivo preciso per farlo presto.

## 4. Ostinato (4 sessioni, 3 giorni, sempre Acqua)
- **G1 mattina (3D, circa 47 s).** Guida, poi 8 volte Acqua. Umidità 100%.
- **G1 sera (2D).** Acqua a 100% sei volte: risposta in italiano «Il terreno è già bagnato.», ma nessun'altra reazione. Pulizia 42%.
- **G2 mattina (3D, vaso giorno 4).** «Piccolo Mondo» (Mentre non c'eri), due idee «Passa il panno», che esegue.
- **G3 (2D, giorno 8, circa 110 s).** Prime Formiche, zoom, di nuovo Acqua a 100% 5 volte. Terreno 42%, Pulizia 43%: nessuno glielo ha detto in modo che lo veda.
- Voto 5 -> 4: nulla di grave succede, quindi nulla lo spinge a cambiare cura.

## 5. Punti di noia, confusione, frustrazione (3 schermate)
1. **Il vaso resta quasi vuoto per i primi due giorni veri.** Frettoloso e ostinato a giorno 4 hanno terra, sasso e una felce; il primo animale (Formiche) arriva a giorno 7-9. Nel frattempo accogliere «Dal bosco / dalla serra / dal giardino» non mostra niente di animato. Schermata: `.../giocatori/frettoloso/s1_3d.png` (giorno 4, nessuna creatura; confrontala con `.../distratto/s1_3d.png`, giorno 14, il vaso pieno).
2. **Dopo la guida nessun invito chiaro** (curioso 6 volte, ostinato 3): resta una frase in corsivo e quattro pulsanti rotondi. Il solo invito è un numero sul quaderno.
3. **Troppe schede al ritorno per chi ha 30 secondi**: 3-6 di fila (Mentre non c'eri, 2 arrivi, 2 «Stanotte» di cui la seconda è solo «Continua», un'idea). Schermata (la scheda in sé è buona, ora ha Nutri/Acqua): `.../giocatori/screenshots/giocatore/2026-11-01-distratto-01-confusione-ritorno.png`. Il tasto «Guarda il vaso» è giusto, ma dopo non si guarda niente: arrivano altre schede.
4. **Stesse idee e stesse schede**: «Le formiche vanno…» con «Guarda da vicino» compare in 4 sessioni su 5 del curioso e due dell'ostinato; «Osserva il vaso» in G2 e G3. I testi nuovi per sessione del curioso: 122, 58, 43, 5, 9.
5. **Missioni, gocce e Salta senza peso.** Il pulsante rotondo delle Missioni ha un numero che non cala mai (1, 2, 3, 4), Riscuoti dà +1 goccia che non si spende; «Salta» (2/6, 3/6) in due casi non ha mosso il giorno e non lo ha spiegato.
6. Positivo da tenere: **«Il terreno è già bagnato.»** risponde all'Acqua inutile; **«Mentre non c'eri»** adesso dice cosa fare e porta il pulsante.

## 6. Le 3 modifiche più utili
1. **Dare vita visibile al primo giorno vero.** Un animale piccolo (una formica, una cocciniglia) nelle prime 2 notti, o un arrivo che si vede subito nel vaso. Agente: **logica di gioco** (`app/app1.js`, piano arrivi), con **motore** per il tempo di comparsa.
2. **Coda di schede al ritorno: massimo 2** (riassunto + un solo arrivo), il resto sul badge del quaderno. Togliere la scheda «Continua» dopo ogni scelta «Stanotte» (il risultato dentro la stessa scheda) e non ripetere la stessa idea per 5 giorni. Agente: **interfaccia** (`app/app3.js`) più **storia** per le idee e la memoria delle ripetizioni.
3. **Una ragione per tornare presto e per cambiare cura.** Un avviso visibile con la cura accanto quando Terreno o Pulizia scendono sotto 45% (chi fa sempre Acqua oggi non lo vede), e un piccolo arrivo o evento garantito dopo ogni assenza di 3 giorni o più. Più una riga quando Salta non muove il giorno. Agente: **interfaccia** (avviso, pulsanti), **storia** (testi), **motore** con **ecologo** (evento di assenza).

## 7. Feedback finale, a voce
- **Curioso:** «La prima sera mi sono perso nel vaso: il sasso che batte, la nonna, l'arrivo dal giardino. Poi ogni mattina trovavo la stessa idea sulle formiche e le missioni che mi chiedono di toccarle tre volte. Tornerei per scoprire cosa c'è dopo le formiche, ma voglio qualcosa di nuovo ogni giorno.»
- **Frettoloso:** «Apro, chiudo tre cartelle, do da bere e via. Dopo due giorni il vaso era ancora senza niente di vivo. Non so perché dovrei aprirlo domani.»
- **Distratto:** «Sono stato via tre giorni e non mi hanno sgridato: mi hanno detto che cosa fare con due pulsanti. E il vaso era bellissimo. Ma non mi è successo niente di grave e non ho una ragione per tornare prima.»
- **Ostinato:** «Io do l'acqua, sempre. Mi dicono “il terreno è già bagnato” e va bene, ma non mi dicono che la pulizia è al 43%. Non mi succede niente, quindi continuo uguale, e dopo tre giorni mi annoio.»
