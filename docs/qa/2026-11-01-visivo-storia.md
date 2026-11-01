# QA visivo e narrativo — 1 novembre 2026

Build provata: `dist/terrario-gioco.html` (iPhone 390x844, Chromium swiftshader, Three.js locale 0.184).
Percorsi giocati: intro film.js, vaso 3D a giorno 0 / 5 / 20 / 40, giorni 0-20 con clic reali (Salta, popup, scelte), menu e Impostazioni, Quaderno, missioni, carte (lette da codice).
Nessun codice modificato. Script e schermate in `/tmp/claude-0/-home-user/c7b2381a-3ddb-563b-8f45-5c4cdc86c3df/scratchpad/qa/` (fuori dal repo).

Console: nessun errore JS e `window.__glErr` vuoto in tutte le corse. Unici avvisi: AudioContext prima del gesto (atteso). Emoji: scansione di tutto il testo visibile in oltre 40 stati di gioco, zero emoji nel DOM. Il termine «il bambino» in terza persona non compare in nessun testo del gioco (solo in commenti di codice).

---

## Gravità ALTA

### 1. Toast «Missione compiuta: [object Object]»
- **Dove:** ogni volta che una missione si completa; compare in basso sopra la barra delle cure, anche durante altri popup (visto a giorno 14, sotto la scelta di Biscotto).
- **Riprodurre:** nuova partita, giocare fino a completare una missione (basta lasciar passare i giorni: la missione «Accogli un nuovo ospite» si completa all'arrivo). Il toast resta con la scritta rotta.
- **Causa:** in `S.MISS` la chiave `tocca` è definita due volte. Prima come stringa `tocca:'tocca Riscuoti'`, poi come tipo di missione `tocca:{t:...,s:...,f:...}`; vince la seconda, quindi `S.MISS.tocca` è un oggetto.
- **File probabile:** `app/story.js` (oggetto `MISS`, chiavi duplicate `tocca`); consumatore in `app/app3.js` (`showNextPopup`, ramo `p.t==='missione'`: `A.toast(S.MISS.fatta+': '+S.MISS.tocca)`). Rinominare una delle due chiavi (es. `toccaRiscuoti`).
- **Schermata:** `.../qa/pop_d14_1.png`

### 2. Strumenti di test e voci «demo» visibili al giocatore
- **Dove:** Menu ⋯ → «Scorri i giorni (demo)»; Impostazioni → card «STRUMENTI DI TEST» («Servono a provare il gioco in fretta. Non faranno parte del gioco.») con: Salta l'avvio guidato, Passa al giorno dopo, Una carta di ogni tipo, +1 giorno del vaso, **Vai avanti fino al finale**, Fai arrivare una notifica, Chiama Biscotto, **Fai succedere qualcosa stanotte**, Capitolo successivo di Biscotto.
- **Riprodurre:** aprire ⋯, poi Impostazioni, scorrere in fondo. Nessun filtro (nessun flag di sviluppo).
- **Perché grave:** rompe la promessa «consegna pronta per la produzione», permette di saltare tutta la progressione (e le gocce/salti a pagamento di tempo), e riporta «stanotte» come pulsante (regola: nessuna parola «notte» come pulsante).
- **File probabile:** `app/app3.js` (template della schermata Impostazioni, blocco `Strumenti di test`; voce «Scorri i giorni (demo)» nel menu). Nascondere dietro `G.dev` o parametro URL.
- **Schermata:** `.../qa/menu1.png` (menu), `.../qa/menu2.png` se presente

---

## Gravità MEDIA

### 3. Il vaso a giorno 40 non è «magico e luminoso»
- **Dove:** vaso 3D, giorni 20 e 40 (energia del sasso E=76 a giorno 20). Il sasso resta scuro e opaco, nessun bloom viola, nessuna venatura che brilla, funghi/creature non visibili; giorno 20 e giorno 40 sono quasi identici (solo il muschio lilla).
- **Riprodurre:** nuova partita (`luce:1, acqua:1, meteorite:1, muschio, formiche`), avanzare con `__app.demoDay(true)` (risolvendo le mutazioni con «proteggi») fino a 20 e 40, poi `__vase.set3d(true)` e attendere 20 s.
- **Cautela:** swiftshader e la guardia prestazioni potrebbero aver spento bloom/post-processing; da riconfermare su GitHub Actions o su iPhone reale prima di aprire un compito. Direzione di riferimento: `docs/riferimenti/sei-scenari.png`.
- **File probabile:** `app/v3d.js` (bloom, emissivo del sasso `_EMIT`), `app/luci.js`.
- **Schermate:** `.../qa/v3_d0.png`, `.../qa/v3_d20.png`, `.../qa/v3_d40.png`

### 4. Frasi fisse sul «muschio» anche se nel vaso non c'è muschio
- **Dove:** didascalie ambientali del vaso («Qualcosa si muove sotto il muschio.», «Sul muschio ci sono tracce che sembrano strade.», «Una goccia scende dal tappo e cade sul muschio.»), animazione notte `NLINE` («Il sasso batte piano. Il muschio respira.»), messaggio `notte-ui` («Il sasso batte, il muschio respira.»), `RITORNO.saltaDone` («Due notti passano. Il sasso batte, il muschio respira.»), carta Pioggia («Il muschio beve, il vetro si appanna.»).
- **Riprodurre:** nuova partita con piante `['felce']` o `['succulenta']` (senza muschio), lasciar passare qualche giorno e leggere le didascalie / il passaggio di notte.
- **File probabile:** `app/story.js` (pool didascalie in `p.push(...)`, `RITORNO`), `app/app3.js` (`NLINE`, `notte-ui`), `app/app1.js` (`CARTE.pioggia.x`). Legare la frase alla pianta realmente presente (o dire «le foglie»).
- Verificato da codice e in una corsa con muschio; la corsa senza muschio mostra solo il pool generale.

### 5. Un vaso di partenza con soli ragni si estingue alla prima notte
- **Dove:** partita con `insetti:['ragni']`, `piante:['felce']`: alla prima notte il log riporta «Ragni si estinguono.» (evento `estinzione`, giorno 1).
- **Riprodurre:** newGame come sopra e chiamare `__app.passaNotte()` (o Salta una volta).
- **Perché:** il film offre l'ospite come scelta; una scelta valida non dovrebbe far fallire il vaso al primo salto. Verificare con l'ecologo che il cibo iniziale dei ragni (nessuna preda) sia voluto; se sì, dire al giocatore perché (i testi dicono solo «Cibo o clima non adatti»).
- **File probabile:** `sim.js` (avvio ragni, prede iniziali) o dati di partenza in `app/app1.js` (`newGame`).

### 6. Il diario dice «Con la lente ho visto…» senza che si sia usata la lente
- **Dove:** Quaderno → «La regina» (giorno 15), «Puntini bianchi». Il testo in prima persona presuppone un'azione del giocatore.
- **Riprodurre:** partita con formiche, 15 giorni di `demoDay(true)` senza mai aprire la Lente; la pagina compare comunque (condizione solo `v.bio.formiche.regina && covata.uova>=2`).
- **File probabile:** `app/story.js` (`diario-regina`, `diario-collemboli`): aggiungere la condizione «Lente usata» o riscrivere senza «con la lente».
- **Schermata:** `.../qa/q1.png` (Quaderno a giorno 15)

### 7. Terminologia giorno / notte incoerente
- **Dove:** il pulsante dice «Salta» e la guida «Tocca la clessidra per saltare due giorni»; il contatore HUD dice «GIORNO»; il popup dice «STANOTTE»; il messaggio dice «Due notti passano»; le carte dicono «trenta notti» (`ric_festa`), il bottone Impostazioni offre «Giorno / Notte».
- **Riprodurre:** un Salta dal giorno 0: il giorno passa a 2, compare il popup «STANOTTE» con una scelta della notte, e il testo promesso era «due giorni».
- **File probabile:** `app/story.js` (`RITORNO.salta`, `GUIDA.notte`/`dormi`), `app/app3.js` (`NLINE`, bottoni «Notte»). Scegliere un solo termine per l'unità di tempo del vaso.

---

## Gravità BASSA

### 8. Emoji disegnate nelle tele del vaso
- `app/v3d.js` (sprite `🧸`, `👁️`/`☄️` sopra le società) e `app/app2.js` (🧸 👁 ☄ ⚔ 🍄 👹 🪙) disegnano emoji reali dentro il canvas, e la lista `sim.log` porta icone emoji (es. `💀`). La scansione del DOM non le vede, ma compaiono come glifi nel vaso quando c'è un popolo o un oggetto. Contro la regola «niente emoji». Da sostituire con icone a linea o sprite proprie e verificare con un popolo fondato.

### 9. Intro: pulsante «Salta ›» salta anche la storia
- Il «Salta ›» in alto durante il film porta direttamente alla schermata «Dove lo metti?», cioè salta anche i testi di legenda e le scelte narrative intermedie (acqua, ospite, oggetto, nome vengono comunque chiesti in seguito, ma la storia della nonna e del sasso si perde). Probabilmente voluto, ma al primo avvio non c'è conferma.
- File: `app/film.js` (`data-f="skip"`).

### 10. Intro: sottotitoli dei pulsanti poco leggibili e «Avanti» spento senza scelta
- Nella schermata «Dove lo metti?» le righe piccole sotto Ombra / Finestra / Sole («batte piano»…) hanno contrasto bassissimo sullo sfondo del legno, e «Avanti» resta grigio finché non si sceglie, senza una scelta predefinita né un suggerimento.
- File: `app/film.js` (`optBtn`, stile `.f-opt small`), `app/app.css`.
- **Schermate (percorso intro):** `.../qa/film_sheet.png` (10 inquadrature), `.../qa/f10.png`

### 11. Genere nel testo
- «Sei corso fuori scalzo» (`PRO.giardino`) è al maschile, mentre il giocatore è «il bambino» senza genere dichiarato. Forma neutra possibile: «Sei corso fuori» → «Fuori, a piedi nudi, senza pensarci.»
- File: `app/story.js` (`PRO.giardino`).

### 12. Brina in una stanza
- Carta «Brina» («Al mattino il vetro è coperto di brina») e «Una notte di gelo» in un vaso che sta su una scrivania dentro casa: incongruente con la regola «ecosistema reale al 100%» (la brina non si forma dentro una stanza). Suggerimento: «condensa ghiacciata» o spostare il vaso sul davanzale esterno nel testo.
- File: `app/app1.js` (`CARTE.brina`).

### 13. Badge «6» tagliato dal bordo
- Con il popup di mutazione aperto (giorno 15), il numero sul pulsante Quaderno esce di 5 px dal bordo destro (x 383-395 su 390).
- File: `app/app.css` (badge `.rb` / colonna destra); visibile in `.../qa/pop_d15_0.png`.

---

## Cosa è risultato a posto
- Intro: film 10 inquadrature con sottotitoli in seconda persona leggibili, passaggio al vaso senza errori (`film_sheet.png`).
- Testi di notti, popup di Biscotto, arrivi e mutazioni: seconda persona, nessun «il bambino», nessun segnaposto non risolto tranne il punto 1.
- Layout a 390 px: nessun testo tagliato o sovrapposto trovato, tranne il badge del punto 13.
- Vaso a giorno 0 in 3D: vetro, coperchio, terra, sasso e formiche presenti e ben dentro il vetro; a giorno 20 e 40 piante (muschio lilla) ben dentro il vetro, nessuna compenetrazione visibile.

## Limiti di questa verifica
- Il film completo è stato visto fino alla scelta della luce; i passi successivi (acqua, ospite, oggetto, nome) non sono stati giocati a clic reali perché in swiftshader il film 3D è troppo lento.
- Un'immagine a giorno 5 mostrava il fallback 2D con `is3d` true (caricamento 3D non ancora completato dopo 20 s con due browser attivi): non lo conto come bug, ma va riconfermato.
- Giorno 40 raggiunto con `demoDay(true)` (cure automatiche) e mutazioni risolte con «proteggi»: nessuna guerra né popolo fondato in questa corsa, quindi finali e società non sono stati coperti.
