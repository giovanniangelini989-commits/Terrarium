# Carte: piano di implementazione (`app/carte.js`)

Si parte solo quando l'orchestratore ha approvato `progetto.md` e ha scritto la voce di contratto qui sotto in `docs/CONTRATTI.md`. `carte.js` gestisce solo la **presentazione**: non decide quali carte escono né cambia lo stato di gioco. Quello resta in `app1.js`.

## Voce proposta per `docs/CONTRATTI.md`

```
## Carte (`window.__carte`, in `app/carte.js`)
__carte.init({app, audio, vase})          // __app, AU, __vase; una volta, dopo boot
__carte.reveal(dono, onDone)              // unboxing di una carta
   dono = {id, fonte:'capitolo'|'cura'|'ricordo', nuova:bool, img?:dataURL, data?:string, vaso?:string}
   onDone({azione:'mazzo'|'gioca'})      // 'gioca' → app3 chiama __app.playCard(id) e poi l'effetto
__carte.hand({onPlay(id)})                // ventaglio del mazzo sopra il vaso
__carte.album(el)                         // disegna l'album dentro el (tab Carte del quaderno)
__carte.cardEl(id, {lato:'fronte'|'retro', mini?:bool}) → HTMLElement
__carte.isOpen() → bool                   // per busy() in app3.js
__carte.close()
Root dell'unboxing: id="cardrev", pulsante accessibile data-a="carta-ok" (compatibilità e2e).

Logica → carte (`window.__app`, app1.js):
CARTE[id] = {n, ic, r:'carta'|'argento'|'sasso'|'ricordo', set:'tempo'|'casa'|'biscotto'|'cassetto', art, d, x, w, come?}
drawCard(k) → {id, nuova, fonte}            giveCard(id, fonte, img?) → {id, nuova, fonte}
cardOdds() → {carta:.70, argento:.22, sasso:.08, garanzia:{argento:n, sasso:m}}   // stessa fonte della pesca
G.album = {id:{d, n, img?}}  (sostituisce G.ui.viste)   G.carte = {pA, pS, giorniCura}
```

## Passi (ognuno piccolo, con test verdi e schermate prima e dopo in `screenshots/carte/`)

**P1. Carta statica.** Scheletro di `carte.js` (IIFE, `window.__carte`).
- `cardEl` con le quattro finiture: cartoncino come rumore procedurale su canvas 256×364, generato una volta e messo in cache; lamina come gradiente in `mix-blend-mode`; scheggia del sasso in SVG con crepe `#A88BFF`; ricordo con `<img>` dalla foto dell'albero.
- Incisioni SVG a linea per le 12 carte di oggi; tacche e parola della rarità.
- Prova: una pagina di prova con le 12 carte di fronte e di retro.

**P2. Unboxing.** `reveal()` come macchina a stati: `arrivo → attesa → apertura → svelamento → festa → lettura`, con i tempi di `progetto.md` §3 in una tabella `T` in cima al file.
- Si animano solo `transform` e `opacity`.
- `__fast` porta ogni tempo a 30 ms; con `prefers-reduced-motion` c'è solo dissolvenza.
- Due tocchi saltano alla fine. Il pulsante `carta-ok` resta per l'accessibilità.

**P3. Il dito.** Puntatore unico (`pointerdown/move/up`):
- inclinazione ±12° con le variabili CSS `--rx --ry --lx --ly`;
- ritorno in 220 ms;
- tenuta 350 ms → scala 1,08;
- tocco → giro;
- scorrimento oltre 60 px o con velocità > 0,5 px/ms → su gioca, giù nel mazzo;
- `requestAnimationFrame`, nessun layout durante il trascinamento.

**P4. Ventaglio.** `hand()`: fino a 7 carte a ventaglio (rotazione ±18°, sovrapposte). Il trascinamento sul vaso usa `__vase.screenOf`/`hit`: sopra il tappo l'alone si accende, al rilascio la carta si piega ed entra (220 ms), poi `onPlay(id)`. Le carte non giocabili sono velate e mostrano il motivo di `canPlay`.

**P5. Album.** `album(el)`: 4 pagine di set, tasche, sagome in rilievo cieco con la riga «come arriva», timbro «set completo». In fondo, quote e garanzie lette da `__app.cardOdds()`. Toccando una carta la apri a schermo con le interazioni di P3.

**P6. Integrazione** (agente interfaccia, `app3.js`):
- `cardReveal(id, after)` → `__carte.reveal(...)`;
- il foglio `'mazzo'` → `__carte.hand(...)`;
- la scheda `carte` del Codex → `__carte.album(...)`;
- `busy()` += `__carte.isOpen()`;
- togliere `.fr.rare` ambra da `app.css`.

`build_app.py` (orchestratore) include `carte.js` prima di `app3.js`.

**P7. Dati e numeri** (orchestratore + motore):
- `CARTE` con `r/set/art`;
- quote 70/22/8, garanzie 3/6, «prima le nuove»;
- `giveCard` per i ricordi;
- pesca ogni 7 giorni di cura;
- migrazione del salvataggio (`viste` → `album`, `comune` → `carta`, `speciale` → `argento`, il sasso → `sasso`).

`bots.js` stampa: carte per 100 giorni per stile, giorni per completare l'album, attesa massima argento/sasso, KB del salvataggio. Gli obiettivi sono in `progetto.md` §2.

**P8. Testi e suoni**: storia (8 carte nuove, 4 ricordi, 5 testi in seconda persona), suono (la lista di `progetto.md` §4) sugli eventi `AU.sfx('carta-*')`.

**P9. QA**: `node equiv.js`, `node gametest.js`, `node app/bots.js`, `python3 e2e.py` standard e SE. Lo e2e aggiunge:
- l'unboxing si apre e si chiude con il gesto e con il pulsante;
- una carta trascinata sul vaso viene giocata;
- l'album mostra le quote.

Schermate per Giovanni: velina chiusa, carta del sasso nella festa, ventaglio sul vaso, album.

## Budget
- `carte.js` ≤ 25 KB.
- Niente Three.js per la carta: DOM + CSS 3D, una texture canvas per finitura (non per carta).
- 60 fps su iPhone 12 con il vaso 3D dietro: durante l'unboxing la guardia prestazioni può mettere in pausa il rendering del vaso, tranne nella festa del sasso.
- Il salvataggio cresce di meno di 1 KB: le foto dei ricordi puntano al nodo dell'albero, non vengono copiate. Se l'albero scarta quella foto (limite di 36), il ricordo la copia: al massimo 4 × 5 KB.
