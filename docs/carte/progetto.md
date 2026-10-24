# Carte di Terrario: progetto (fase 1, solo design)

Agente carte, 24 ottobre 2026. Da approvare: orchestratore, poi Giovanni.

## 1. Com'è oggi
- **12 carte**: 8 «comuni», 4 «speciali» (`CARTE` in `app/app1.js`). Arrivano **solo a fine capitolo**, una per finale. Speciale al 12%, garanzia ogni 8 capitoli. Le probabilità sono già scritte nel Codex (bene).
- **Numeri dei bot** (`node app/bots.js`, 32 vasi × 100 giorni): 1556 carte, speciali 15%, garanzia rispettata. Chi gioca bene chiude però circa **3 capitoli in 100 giorni** (97 capitoli in 32 vasi): **3 carte in tre mesi**. Per questo giocatore la garanzia «ogni 8 capitoli» scatta dopo circa 260 giorni e l'album completo non arriva mai. Chi gioca poco (passivo, 8,5 capitoli) riceve più carte di chi cura.
- **Rivelazione** (`cardReveal` in `app3.js`): fondo scuro, carta piatta con emoji, giro CSS di 1,1 s, bottone «Nel mazzo». Non c'è attesa, non si tocca la carta, e la celebrazione è la stessa per tutte (cambia solo il suono). Schermata: `screenshots/carte/oggi_2_fronte.png`.
- **Gioco**: dal pulsante «asso» si apre un foglio con un elenco e i bottoni «Gioca». La carta non viene mai portata nel vaso.

**Cosa non funziona**
1. Arrivano troppo poche carte, e chi cura di più ne riceve di meno.
2. Usa un terzo colore saturo (ambra per le speciali) e il verde per il bordo delle comuni, che invece spetta alle mutazioni.
3. Emoji e gradienti piatti: non sembra una carta vera.
4. Cinque testi dicono «il bambino» in terza persona (terra, scintilla, scudo, tempo, candela).
5. Nessun gesto, nessuna anticipazione, nessuna traccia nel vaso.

## 2. Il sistema proposto

**Cinque idee**
1. **La rarità si vede dal materiale, non dal colore.** Tre finiture vere più le carte ricordo.
2. **Album a quattro set**, con le carte mancanti in rilievo cieco (sagoma impressa, senza inchiostro).
3. **Le carte premiano la cura, non l'attesa.** Oltre al fine capitolo arrivano dai traguardi (sempre certi) e dai giorni in cui curi il vaso.
4. **Unboxing nella velina**: una carta alla volta, la apri tu con il dito. Lo svelamento è sempre onesto e la festa cresce con la rarità.
5. **Si gioca con un gesto**: trascini la carta sul vaso, lei ci entra e il vaso cambia in modo visibile.

**Rarità** (tre segni insieme: finitura, tacche in rilievo nell'angolo, parola stampata piccola):
| Rarità | Finitura | Tacche | Quota nella pesca |
|---|---|---|---|
| **di carta** | cartoncino avorio opaco, angoli consumati, inchiostro seppia | 1 | 70% |
| **d'argento** | lamina argentata desaturata: si accende solo inclinando la carta | 2 | 22% |
| **del sasso** | carta scura con una scheggia di meteorite incastonata; le crepe brillano di viola `#A88BFF` | 3 | 8% |
| **ricordo** | carta fotografica con la foto del *tuo* vaso, la data e il nome del vaso | bollo | non si pesca |

Il viola compare solo sulle carte del sasso (è il sasso). Il verde `#7CF5C8` compare solo sulle carte che fanno mutare.
Le illustrazioni sono incisioni a linea, a un solo inchiostro, in SVG dentro `carte.js`. Al posto delle emoji.

**Set e album.** 4 set da 6 carte, 24 in tutto: le 12 di oggi, 8 nuove da pescare e 4 ricordi. Ogni set ha 3 carte di carta, 1 d'argento, 1 del sasso e 1 ricordo.
- *Il tempo che fa*: Pioggia, Ombra, Scintilla · Brina (nuova, argento) · Il sasso cresce · ricordo «La prima mutazione»
- *La casa*: Latte, Terra, Tempo in bottiglia · Candela eterna · (nuova, sasso) · ricordo «Il primo popolo»
- *Biscotto*: Scudo · 2 nuove di carta · Radio di notte · (nuova, sasso) · ricordo «Biscotto, alla fine»
- *Il cassetto*: Bussola · 2 nuove di carta · Moneta d'argento · (nuova, sasso) · ricordo «Il primo finale»

L'album è una scatola da scarpe aperta sulla scrivania. Ogni set è una pagina con 6 tasche. Le carte mancanti sono sagome in rilievo con scritto *come* arrivano, mai «???». Quando completi un set, sulla pagina compare un timbro e nel quaderno una frase in prima persona. In fondo all'album, sempre visibili, ci sono le quote della pesca e i contatori di garanzia (vedi sotto).
L'album registra la prima volta che trovi una carta. Il mazzo contiene le copie da giocare: i doppioni servono, perché si giocano.

**Quando arrivano** (obiettivo per il giocatore attivo: circa 1 carta ogni 8–10 giorni, cioè 10–12 in 100 giorni):
1. **Fine capitolo**: 1 carta pescata. Prima le nuove: se nella rarità uscita ti manca qualcosa, esce una carta che ti manca.
2. **Garanzie visibili**: almeno una d'argento ogni 3 pesche, una del sasso entro 6 pesche. L'album lo mostra: «La prossima carta del sasso arriva entro 4 pesche».
3. **Ricordi**: 4 traguardi, sempre certi (prima mutazione, primo popolo fondato, primo finale, finale della storia di Biscotto).
4. **Giorni di cura**: ogni 7 giorni in cui hai curato il vaso (non serve che siano di fila, e non si perde nulla) arriva una pesca. È il motivo per cui chi cura riceve più carte.

**Dove e come si giocano.** In qualsiasi momento, tranne durante filmati e popup.
- Tocchi l'asso e il mazzo si apre a ventaglio dal basso, sopra il vaso. Il vaso resta visibile, con opacità 0,7.
- Trascini una carta verso l'alto, sul vaso, e la lasci: è giocata. Se la riporti giù torna nel ventaglio.
- Per VoiceOver c'è sempre anche il bottone «Gioca».
- Le carte che non si possono giocare restano velate e spiegano il perché (`canPlay`).

**Cosa cambia nel vaso.** La carta si piega ed entra dal tappo (220 ms), poi il vaso risponde con un effetto 3D proprio di ogni carta (`__vase.fx`):
- Pioggia: condensa che scende sul vetro.
- Terra: suolo più scuro e vetro pulito.
- Scintilla: le crepe del sasso si accendono di viola per 2 s.
- Ombra: il panno sfuma e la luce cala.
- Oggetti: l'oggetto compare.
- Il sasso cresce: il meteorite si gonfia in 600 ms e torna al battito.

Ogni carta giocata lascia un nodo nell'albero (c'è già). Le ultime 3 carte giocate restano appoggiate sulla scrivania, accanto al vaso: lo decide tre-d, è facoltativo.

## 3. L'unboxing, passo per passo
Ogni passo avanza al tuo tocco, mai da solo. Due tocchi rapidi saltano alla fine. Con `__fast` ogni tempo diventa 30 ms. Con «movimento ridotto» c'è solo dissolvenza.

| Fase | Cosa succede | Tempi |
|---|---|---|
| 0. Arrivo | Il vaso scende a opacità 0,6. Dal basso sale una piega di carta velina chiusa da un filo (scala 0,92→1, traslazione). Suono: fruscio. | 0–420 ms |
| 1. Anticipazione | La velina respira (scala 1→1,015, ciclo da 1600 ms). Dopo 1200 ms compare «Scorri per aprire». Se la carta è del sasso, dalla velina filtra una luce viola tenue. È sempre vera: non c'è mai una luce finta. | attesa libera |
| 2. Apertura | Scorri: il filo si spezza (80 ms) e i due lembi si aprono uno dopo l'altro (180 + 180 ms). Sotto c'è il dorso della carta, in rilievo con la sagoma del barattolo. | 440 ms |
| 3. Svelamento | Tocchi o fai scorrere la carta e lei si gira (rotateY, scala 1→1,06→1). Di carta: 520 ms. D'argento e del sasso: 700 ms con una pausa di 120 ms di taglio, in cui si vede il bordo della finitura. | 520–700 ms |
| 4a. Festa, di carta (piccola) | La carta si posa e si alza un filo di polvere. Suono: carta posata. | 200 ms |
| 4b. Festa, d'argento (media) | Un riflesso grigio-bianco attraversa la lamina, un lampo di luce del 6% torna a zero. | 600 ms |
| 4c. Festa, del sasso (grande) | La stanza si abbassa, le crepe pulsano due volte, polvere che sale. Il sasso nel vaso risponde (`__vase.fx('meteorite')`). Suono: rombo e cristallo. | 1600 ms |
| 4d. Ricordo | La foto del vaso si sviluppa, da grigia a nitida, e viene timbrata la data. | 900 ms |
| 5. Lettura | Se è nuova, il timbro «Nuova nell'album» scende (scala 1,3→1, 180 ms). Poi decidi tu: scorri **giù** e va nel mazzo (vola sull'asso in 240 ms, il numero pulsa 1→1,2→1); scorri **su**, sul vaso, e la giochi subito. | libera |

**Il dito sulla carta** (sempre attivo, anche nel ventaglio e nell'album):
- **Inclinare**: trascini e la carta ruota fino a ±12° seguendo il dito. Riflesso e ombra si spostano, la lamina d'argento si accende solo in certi angoli. Quando lasci torna piatta in 220 ms.
- **Girare**: con un tocco mostri il retro, con il testo di storia in seconda persona.
- **Tenere premuto** (350 ms): la carta si avvicina (scala 1,08) per leggerla bene. Quando lasci torna a riposo.
- **Giocare**: la trascini sul vaso. Sopra il tappo il vaso si illumina appena per dirti «lascia qui».

## 4. Cosa serve agli altri
**Suono** (`app/audio.js`, generati dal musicista): fruscio della velina, filo che si spezza, lembi che si aprono, carta che gira, carta posata (di carta), riflesso della lamina (d'argento), rombo con cristallo (del sasso), foto che si sviluppa (ricordo), timbro «nuova», carta nel mazzo, carta nel vaso più un suono per effetto (pioggia, terra, scintilla, ombra, oggetto, sasso), pagina dell'album, set completo (grande). Volumi bassi: è una scrivania, non un casinò.

**Storia** (`app/story.js`, testi in `app1.js`):
- Riscrivere in seconda persona i 5 testi con «il bambino».
- Nomi e testi delle 8 carte nuove e dei 4 ricordi.
- Nomi dei set.
- Una frase da quaderno, in prima persona, per ogni set completato.
- Le righe «come arriva» per le sagome.

**Interfaccia** (`app3.js`, `app.css`):
- Chiamare `window.__carte` al posto di `cardReveal`, del foglio «mazzo» e della scheda Carte del Codex.
- Togliere l'ambra.
- Aggiungere `__carte.isOpen()` a `busy()`.

**Motore e logica** (`app1.js` con il via dell'orchestratore, `bots.js`):
- Le rarità nuove con quote 70/22/8.
- Le garanzie 3/6.
- «Prima le nuove».
- I ricordi.
- Una pesca ogni 7 giorni di cura.
- `G.album` al posto di `G.ui.viste`.
- In `bots.js`: carte per 100 giorni per stile di gioco (obiettivo per l'attivo 10±3, e l'attivo non deve ricevere meno del passivo), giorni per completare l'album, attesa massima per una d'argento e per una del sasso.

**Tre-d**: un effetto `__vase.fx` per carta (lista sopra) e, se vuole, le carte appoggiate sulla scrivania.

## 5. Cosa evitare (vedi `docs/ricerca/regole.md`)
- **Niente acquisti, valute, pubblicità, rilanci a pagamento** (DECISIONI §6). Le carte gratuite restano fuori dal «loot box a pagamento» di Apple 3.1.1. Pubblichiamo comunque le quote, perché le odds sono il primo tema dei principi CPC e della consultazione sulla Digital Fairness Act (regole §2–3). I loot box porterebbero la classificazione a 9+ e il gioco d'azzardo a 18+ (regole §1).
- **Niente probabilità nascoste**: quote e garanzie si leggono nell'album e vengono dalla stessa funzione che pesca.
- **Niente meccaniche da slot machine**:
  - niente rulli o luci intermittenti;
  - niente «quasi vinto» (nessuna luce viola finta);
  - niente aperture a catena («apri le altre 5»);
  - niente carte che scadono o timer;
  - niente serie di giorni che si perdono (regole §2, Apple 5.6).
- **Nessuna esortazione**: niente notifiche «hai una carta da aprire» e nessun testo che spinga a chiedere qualcosa ai genitori (punto 28 della direttiva, caso Star Stable, regole §3).
- **Celebrazione proporzionata**: anche la festa del sasso dura meno di 2 s, si può saltare e torna sempre a riposo.
