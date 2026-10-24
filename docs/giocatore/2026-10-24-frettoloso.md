# Giocatore «frettoloso» — 24 ottobre 2026

Dieci visite da 15–38 secondi l'una (totale circa 4 minuti di gioco in 10 giorni), vaso dal giorno 0 al 46. 92 tocchi in tutto, 47 schede chiuse, 9 cure. Voglio fare una cosa e uscire. Diario grezzo: `2026-10-24-frettoloso.log.json`.

## 1. Linea del tempo
- **0:00–0:23** Video: tocco «Tocca per iniziare», poi «Salta ›» alla prima occasione. Salta direttamente alla scelta della luce: va bene, ma perdo la storia del sasso e non so perché il barattolo è lì. Il nome è già proposto: tocco «Casa» tra i suggerimenti.
- **0:23–0:40** «Metti la terra», «Bagna la terra», accetto il muschio. Chiaro e veloce.
- **Giorno 5, 10, 15…** Ogni visita è: si apre una scheda («Mentre non c'eri»), ne chiudo altre 3–5 (notte, arrivo, idea, livello), tocco la barra più bassa se c'è, «Passa la notte», esco. Mai oltre 40 s.
- **Giorno 16** Arriva una mosca da accogliere: leggo di sfuggita. Sul vaso c'è ancora la pagina nuova del quaderno con il numero 3: non la apro mai (alla fine sono 9 non lette).
- **Giorno 45** Riapro e trovo l'acqua a 0% e la felce mezza secca (`2026-10-24-frettoloso-02-frustrazione-barra-zero.png`). Il pulsante dell'acqua è evidenziato: l'invito c'è, ma solo adesso.

## 2. Noia, confusione, frustrazione
- **Frustrazione — il gioco è un seguito di schede da chiudere**: 47 schede contro 9 cure in 10 visite. In 20 secondi tocco più «Continua», «Bene», «Dopo» che il vaso. È la cosa che mi farebbe mollare.
- **Frustrazione — nessun avviso prima che sia tardi**: le barre scendono a 0% e nessuna notifica me lo dice prima (schermata `frettoloso-02`). Il bambino non mi scrive «ha sete».
- **Confusione — «Vai dal bambino»**: il pulsante della scheda «Mentre non c'eri» non mi dice cosa fa; lo tocco solo per chiuderla.
- **Confusione — icone senza parole**: i quattro pulsanti rotondi in basso non hanno etichetta; il primo (pulisci) sembra una batteria. Il giorno in alto («GIORNO») è quasi illeggibile sullo sfondo chiaro del vaso al sole.
- **Il tocco mancato** di `frettoloso-01` (giorno 16) è del mio script: la scheda «Dalla finestra» si era aperta da sola. Non lo conto.
- **Non vedo mai una noia vera**: non faccio abbastanza per annoiarmi. Il rischio è l'opposto: non ho niente da inseguire.

## 3. Le 3 modifiche più utili
1. **Una sola scheda per visita**: riunire notte, idea, livello e arrivi in un unico riepilogo («Stanotte: …  È arrivata una mosca  [Accogli] [Dopo]») invece di 4–5 schede una dopo l'altra. → *interfaccia* (`app/app3.js`, coda dei popup) + *logica* (`app/app1.js`, `checkNewDay`).
2. **Avvisare prima che una barra tocchi zero** (notifica del bambino a 25%: «Ha sete») e non nasconderla dietro il numero sul quaderno. → *logica* (notifiche in `app/app1.js`) + *storia* (testi).
3. **Dare un nome al pulsante «Vai dal bambino»** («Guarda il vaso») e mettere etichette corte alle icone la prima volta. → *interfaccia* (`app/app3.js`, `app/app.css`).

## 4. Voto: **4/10** per tornare domani
Il gioco mi chiede 20 secondi e me li riempie di schede, non di scelte. Non c'è niente che perdo se salto un giorno (a 46 giorni il vaso è vivo) e niente che aspetto con ansia.

*Nota*: giocato con `window.__no3d=true` (vaso 2D) perché questa macchina non raggiunge jsDelivr.
