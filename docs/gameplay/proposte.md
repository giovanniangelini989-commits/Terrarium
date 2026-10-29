# Proposte di gameplay (agente motore, 24 ottobre 2026)

Cinque meccaniche nello spirito delle power card «Salta 2 giorni»: gestione del tempo, ritorno quotidiano gentile, scelte che contano, obiettivi a medio termine, ricompense che cambiano il vaso. Ordinate per impatto stimato. Nessuna è decisa: le approva Giovanni.

Vincoli che valgono per tutte (da `docs/ricerca/regole.md` e `docs/DECISIONI.md`): niente acquisti, valute o pubblicità (§6); niente perdita per assenza (§1); nessuna esortazione, nessun timer che scade, nessuna notifica di colpa; ogni numero nuovo si misura con `node app/bots.js` prima e dopo.

---

## 1. La Lente: ferma il tempo e guarda da vicino (gestione del tempo, al contrario)

**Cosa fa.** Il gemello della power card. Ogni giorno, al primo accesso, ricevi 1 «Lente» (tetto 3). La usi su una specie o una pianta: per i prossimi 2 giorni del vaso quella parte **non cambia** (niente mutazioni, niente calo di popolazione, niente guerra che la tocca) e la vedi in macro con una scheda che spiega cosa sta per succederle («le formiche stanno per dividersi in due popoli: se non intervieni, domani»). Tempo rallentato, non fermato: il resto del vaso va avanti.

**Perché funziona.** Dà al giocatore il potere opposto alla carta «Salta»: accelerare o trattenere. Neko Atsume vive del «guardare da vicino» (i gatti rari si scoprono osservando, `concorrenti.md` §1); noi abbiamo la macrofotografia e le mutazioni, ma oggi il giocatore non ha mai un motivo per fermarsi su una sola creatura. La Lente trasforma la richiesta «osserva» in una scelta con conseguenze, e produce una foto per l'albero.

**Rischi etici.** Bassi. Nessuna perdita, nessuna attesa forzata. Da evitare: mostrare «cosa sta per succedere» come minaccia («se non la usi, muore»): il testo resta descrittivo, mai esortativo (punto 28 della direttiva, `regole.md` §3).

**Costo.** Medio. Motore: 1 giorno (congelamento per specie in `sim.step`, con `equiv.js` a 0 perché attivo solo in modalità gioco). Interfaccia: 2 giorni (gesto, scheda macro, zoom con `__vase.zoomTo`). Storia: 20 frasi di previsione.

**Chi.** Motore (regole e bot), interfaccia (gesto e scheda), storia (testi), tre-d (`zoomTo` già c'è).

---

## 2. Il quaderno delle promesse (obiettivi a medio termine, scelti da te)

**Cosa fa.** Ogni 7 giorni reali il quaderno ti propone **tre promesse** per la settimana; ne scegli una (es. «far nascere un popolo tra le termiti», «tenere il vetro pulito per 5 notti», «arrivare a 3 specie vive»). Si vede in una riga sotto le pillole dei bisogni, senza barra di progresso aggressiva. Se la mantieni, ricevi una carta ricordo con la foto del vaso in quel momento e una pagina del quaderno in prima persona. Se non la mantieni, la promessa scompare in silenzio: nessun «fallito», nessun contatore.

**Perché funziona.** I giochi di cura senza obiettivo vengono accusati di «poco da fare» (Neko Atsume, `concorrenti.md` §1; Viridi «senza stadi di crescita» §4). Una promessa scelta dal giocatore è un obiettivo a medio termine che sfrutta ciò che abbiamo già di unico: popoli, mutazioni, finali. Le promesse scelte, non assegnate, evitano la sensazione di «lista di compiti» delle daily quest.

**Rischi etici.** Medi se fatto male: le missioni settimanali sono la meccanica tipica dei giochi live. Regole: mai una ricompensa che si perde, mai «ultime ore», mai notifiche. La promessa è a settimana reale ma il gioco non conta i giorni mancanti a voce alta.

**Costo.** Medio. Motore: 1 giorno (10–12 promesse come predicati su `view()`, come i `c(view,G)` delle notti). Interfaccia: 1,5 giorni. Storia: testi delle promesse e delle pagine. Carte: la carta ricordo (già nel progetto carte, `docs/carte/progetto.md` §2).

**Chi.** Motore, storia, interfaccia, carte.

---

## 3. Il dono della nonna (ritorno quotidiano gentile, mai un obbligo)

**Cosa fa.** Al primo accesso di ogni giorno trovi sul davanzale **una cosa lasciata da qualcuno di casa**: un bicchiere d'acqua (umidità +), una tazza di latte (cure), un biscotto per Biscotto (il gatto resta buono per 3 giorni), una foglia secca (nutrimento), un pezzo di spago (niente, ma lo mette nel quaderno con una frase). È sempre lì quando arrivi, anche dopo 10 giorni di assenza: **non si accumula e non si perde**, non c'è serie, non c'è «giorno 5 di 7». La power card «Salta 2 giorni» diventa uno dei doni possibili (invece di un dono fisso), così il calendario dei doni ha varietà.

**Perché funziona.** Neko Atsume premia il ritorno con i pesci lasciati dai gatti, senza penalità (`concorrenti.md` §1): è il modello di «ritorno senza pena» che `SINTESI.md` mette al primo posto. Il dono è narrativo (una persona di casa), non un contatore: rafforza l'idea che il bambino vive in una casa vera.

**Rischi etici.** Bassi, a patto che il dono non sia mai progressivo (giorno 1 < giorno 7) e non ci siano notifiche. Lo studio legale citato in `regole.md` §2 indica proprio i «login reward che si azzerano» come esempio a rischio: qui non c'è nulla da azzerare.

**Costo.** Basso. Motore: mezza giornata (tabella doni, scelta con il seme del giorno, effetti già esistenti: `bumpNeeds`, `G.real.cure`, `G.ui.nextBiscotto`). Interfaccia: 1 giorno (oggetto sul davanzale, tocco per prenderlo). Storia: 8–10 frasi.

**Chi.** Motore, storia, interfaccia, tre-d (un oggetto sul davanzale, facoltativo).

---

## 4. Il patto (scelte che contano, a lungo termine)

**Cosa fa.** Quando un popolo si fonda, ti chiede **un patto**, una sola volta, con tre opzioni che cambiano il vaso per sempre per quel popolo: «Vi proteggo» (non si estinguono mai, ma non fanno più guerre né scismi: niente finali Conflitti per loro), «Vi lascio liberi» (tutto possibile, più mutazioni), «Vi chiedo un tributo» (ogni 10 giorni lasciano un oggetto o una carta, ma la loro popolazione resta piccola). La scelta va nell'albero come nodo maggiore con la strada non presa, e cambia il testo del finale.

**Perché funziona.** Oggi le decisioni (mutazione, società, guerra) sono locali e si dimenticano. Un patto è una scelta a lungo termine che il giocatore ricorda e di cui vede le conseguenze nei finali: è ciò che ci rende unici rispetto ai dieci concorrenti (`criticita.md`, «una storia che evolve da sola»). Dà anche un motivo per rigiocare: lo stesso popolo con un patto diverso.

**Rischi etici.** Bassi. Nessuna pressione temporale: il patto aspetta finché non scegli (come le decisioni in coda, che bloccano la power card).

**Costo.** Medio-alto. Motore: 2 giorni (flag per specie in `sim.js`, effetti su guerre, estinzione e tributo; `equiv.js` a 0 perché solo con `decisions:true`). Storia: 3 testi × 10 culture. Finali: una variante di epilogo per patto. Interfaccia: riusa il popup «decisione».

**Chi.** Motore, storia, finali, interfaccia.

---

## 5. Il clima del davanzale (ricompense che cambiano il vaso, stagioni reali)

**Cosa fa.** Il vaso sente la **stagione vera** del telefono (data, non posizione): d'inverno la luce cala e i popoli si raccolgono (più «sapere» e «fuoco»), d'estate l'umidità scende più in fretta e nascono più mutazioni, in autunno arrivano più oggetti dal tavolo, in primavera più piante. Ogni stagione porta **una ricompensa che si vede**: una brina sul vetro, una foglia che entra dal tappo, un raggio di sole che scalda il sasso. Le carte ricordo della stagione (4 all'anno) vanno nell'album.

**Perché funziona.** Dà un motivo di ritorno a lunghissimo termine (mesi) senza nessun meccanismo di obbligo: il gioco cambia da solo con il calendario, come Pokémon Sleep usa il ritmo reale (`concorrenti.md` §7) e Animal Crossing le stagioni. Per la miniatura realistica (CLAUDE.md) è un regalo visivo: lo stesso barattolo, luce diversa.

**Rischi etici.** Bassi. Nessun evento a tempo limitato con ricompensa che si perde: la carta ricordo della stagione si ottiene semplicemente aprendo il gioco una volta in quella stagione, anche l'ultimo giorno.

**Costo.** Medio. Motore: 1 giorno (4 profili di modificatori in `createSim` opzionali, bot per stagione). Luci: 1 giorno (`__LUCI.set` con stagione). Tre-d: brina e foglia (2 giorni). Storia: 4 pagine. Niente rete, niente geolocalizzazione: solo `new Date()`.

**Chi.** Motore, luci, tre-d, storia, carte.

---

## 6. La festa del popolo (ricompensa che cambia il vaso, nata dal calendario) — secondo giro, 24 ottobre

**Cosa fa.** Ogni popolo ricorda il giorno in cui è nato (`society.since`, già in `view()`). Ogni 30 notti del vaso torna la sua festa: per una notte il popolo fa qualcosa di visibile secondo la sua cultura (il «sacro» accende lumini intorno alla statuina, il «fuoco» un fuocherello sul muschio, il «gioco» un girotondo) e lascia **un segno permanente** nel vaso (una pietra incisa, un filo teso tra due foglie: `__vase.fx` + un oggetto `G.tree` con foto). Il calendario (`docs/gameplay/tempo.md`) segna la festa in anticipo con una tacca, senza testo: chi la nota, la aspetta.

**Perché funziona.** È l'unico «evento in calendario» che non chiede niente: si ottiene vivendo. Animal Crossing tiene i giocatori per anni con feste a data fissa (`concorrenti.md`); da noi la data la fissa il vaso, non il negozio. Dà ai popoli una vita rituale che oggi manca (giocatore: «dopo il giorno 20 si ripete»).

**Rischi etici.** Bassi: se la festa cade in un giorno di assenza, si vede al risveglio nel riassunto e il segno resta lo stesso. Nessun «l'hai persa».

**Costo.** Medio. Motore: ½ giorno (evento `festa` in `sim.js` con `decisions:true`, `equiv.js` a 0). Storia: 10 culture × 1 riga. Tre-d/interfaccia: un effetto e un segno per cultura (può partire con 3 culture).

**Chi.** Motore, storia, tre-d, interfaccia.

## 7. Il biglietto di domani (obiettivo a breve termine scelto da te, dal calendario)

**Cosa fa.** La sera (dopo le 20 reali) il quaderno ti chiede una riga: «Domani vorrei…» con tre scelte prese dallo stato del vaso («che le formiche facciano pace», «che il muschio torni verde», «vedere cosa c’è sotto il sasso»). Il biglietto va nella casella di domani del calendario. Il giorno dopo, se la cosa è successa, la casella si colora e il quaderno scrive una pagina in prima persona; se non è successa, il biglietto resta lì, senza colore e senza commento. Un solo biglietto per giorno, mai obbligatorio.

**Perché funziona.** Dà un motivo di ritorno a 24 ore che nasce da una curiosità, non da un premio (SINTESI ricerca, azione 1 e 3). Usa le notti a orario del nuovo tempo: tra sera e mattina passano 2 notti, abbastanza perché qualcosa accada. È la versione «a un giorno» della proposta 2, più leggera.

**Rischi etici.** Medi se mal fatto: niente notifica, niente serie di biglietti, niente conteggio dei biglietti non avverati. Il testo non deve mai dire «non ce l'hai fatta».

**Costo.** Basso. Motore: ½ giorno (12 predicati su `view()` come le notti). Storia: 12 frasi + 12 pagine brevi. Interfaccia: la scheda serale e la casella colorata (½ giorno, sopra il calendario).

**Chi.** Motore, storia, interfaccia.

## 8. Una cosa da salvare (scelta che conta, alla fine del vaso) — terzo giro, 24 ottobre

**Cosa fa.** Quando chiudi il capitolo e il vaso si svuota (tempo.md §7), prima della transizione il gioco ti chiede **una sola cosa da portare nel vaso nuovo**: un seme di una pianta che c'era (arriva già alla fase 2, senza aspettare l'arrivo), un oggetto dal tavolo (torna come primo arrivo), oppure «niente, solo il sasso». La scelta va nell'albero come nodo maggiore con la strada non presa e nella mensola (`G.vasi[n].salvato`). Mai una specie: gli animali non si salvano in tasca, e così il vaso nuovo resta un vaso nuovo.

**Perché funziona.** Il momento della fine è il più carico di emozione e oggi non ha nessuna scelta: la carta esce da sola. I giochi che fanno «ricominciare» (roguelite di cura come Cultist Simulator o il ciclo di Spiritfarer, `concorrenti.md`) tengono il giocatore perché ogni ripartenza porta un segno della partita prima. È la versione a scelta esplicita dell'«eredità» già costruita (§7: Quiete → terra umida, ecc.), che invece è automatica.

**Rischi etici.** Bassi. Nessuna perdita: «niente» è un'opzione piena, con una riga sua nel quaderno. Da evitare: pesare le tre opzioni in modo che una sia «giusta».

**Costo.** Basso. Logica: ½ giorno (`closeChapter(scelta)`: un campo in `G.ui.eredita`, `forceArrival` già esiste). Interfaccia: ½ giorno (tre pulsanti nella scheda «Chiudi il capitolo»). Storia: 3 righe + 1 pagina.

**Chi.** Orchestratore (logica), interfaccia, storia, motore (test nel blocco 9).

---

## 9. Stare svegli (gestione del tempo: la notte in diretta)

**Cosa fa.** Se sei nel gioco quando scatta una delle quattro notti a orario (`orologio().prossimaNotteMs` sotto i 2 minuti), compare una sola riga: «Sta per farsi notte. Resti a guardare?». Se resti, la notte si svolge **in diretta** in 20 secondi (il vaso si scurisce davvero, le barre scendono con l'animazione, le creature si muovono di più) e la notte viva, se c'è, la **scegli tu** tra due invece di riceverla. Se non resti, tutto come oggi (popup `notte-ora`). Non si accumula, non dà XP in più: cambia solo come la vivi.

**Perché funziona.** Il nuovo tempo a orario fisso crea un appuntamento naturale (alle 18, a mezzanotte) e la ricerca chiede momenti da aspettare senza premi (`SINTESI.md`, azione 2: «riassunto al ritorno come premio»; qui è il contrario: l'evento in diretta). Pokémon Sleep e Animal Crossing usano l'orologio reale per rendere speciale «esserci». Costa zero in equilibrio di gioco.

**Rischi etici.** Medi se mal fatto: niente notifica push per «la notte sta arrivando», nessun bonus per chi resta. L'avviso compare solo se l'app è già aperta.

**Costo.** Medio. Motore: nessuno (usa `passaNotte` e `pickNight` due volte). Interfaccia: 1,5 giorni (sequenza di 20 s con `__LUCI.set('notte')`, scelta tra due notti). Storia: 1 riga.

**Chi.** Interfaccia, luci, suono (un suono per la notte in diretta).

---

## 10. La pagina del mese (obiettivo a medio termine, senza obiettivo)

**Cosa fa.** Il primo giorno di ogni mese della stanza il quaderno scrive **una pagina del mese** con i dati del calendario (`G.cal`): quante notti ha vissuto il vaso, quante ne ha dormite, il giorno con più eventi, la foto migliore dell'albero, un popolo nato, un finale. In prima persona, come un bambino che riguarda il mese («A ottobre il vaso ha fatto 71 notti. Ho dormito solo tre giorni»). Niente voti, niente «potevi fare meglio», niente confronto con il mese prima. La pagina ha un segnalibro nel calendario (bordo viola sulla casella del 1°).

**Perché funziona.** Trasforma il calendario da strumento in ricordo. I «riepiloghi» periodici (Spotify Wrapped, i resoconti annuali di Animal Crossing) sono tra le cose più condivise di qualunque prodotto e non chiedono nulla al giocatore (`concorrenti.md`). È l'obiettivo a medio termine della ricerca (`SINTESI.md`) senza la forma della missione.

**Rischi etici.** Bassi. La pagina non conta i giorni mancati come colpa: «ho dormito tre giorni» è un fatto, non un rimprovero. Mai percentuali di presenza.

**Costo.** Basso. Motore: ½ giorno (`riassuntoMese(anno, mese)` su `G.cal`, `G.tree`, `G.vasi`: tutto già esposto da `calendario()`). Storia: 10 frasi a incastro. Interfaccia: ½ giorno (segnalibro nel calendario, pagina già nel quaderno).

**Chi.** Motore, storia, interfaccia.

---

## 11. La mensola viva (ricompensa che cambia la stanza, dai vasi passati)

**Cosa fa.** I vasi finiti (`G.vasi`) non sono solo schede: stanno **sulla mensola dietro al vaso**, in miniatura, nella scena 3D (fino a 5 visibili, poi scorrono). Ogni barattolo ha il colore del suo finale (famiglia: Quiete verde cupo, Società ambra, Mostri viola, Conflitti ruggine) e una luce dentro che batte piano. Toccarne uno apre la sua scheda. Una volta ogni tanto (seme del giorno, ~1 su 10 visite) un vaso passato «si fa sentire»: una pagina del quaderno in prima persona che ricorda quel vaso, legata a quello che sta succedendo adesso («Anche le formiche del primo vaso facevano così, prima di dividersi»).

**Perché funziona.** Dà alla «fine del vaso» una ricompensa visibile e permanente dentro la scena (regola della direzione: «ricompense che cambiano il vaso»). Il collezionismo di Neko Atsume e dei finali di Reigns (`concorrenti.md`) funziona quando la collezione si vede sempre, non in un menu. E le pagine-ricordo collegano i vasi tra loro: la storia diventa una vita, non una serie di partite.

**Rischi etici.** Bassi. Nessun incentivo a chiudere vasi in fretta: la mensola mostra la durata («112 giorni»), non il numero.

**Costo.** Medio-alto. Tre-d: 1,5 giorni (barattoli in miniatura con `materials.js`, entro i 90k triangoli: un barattolo = 200 triangoli). Logica: ½ giorno (`G.vasi` già c'è; pagine-ricordo con 10 predicati). Storia: 10 pagine. Interfaccia: tocco e scheda (½ giorno).

**Chi.** Tre-d, direttore-artistico (colori delle famiglie), storia, orchestratore, interfaccia.

---

## Riepilogo

| # | Meccanica | Impatto | Costo | Rischio etico |
|---|---|---|---|---|
| 1 | La Lente | alto | medio | basso |
| 2 | Quaderno delle promesse | alto | medio | medio (se diventa «daily quest») |
| 3 | Dono della nonna | medio-alto | basso | basso |
| 4 | Il patto | medio-alto | medio-alto | basso |
| 5 | Clima del davanzale | medio | medio | basso |
| 6 | La festa del popolo | medio-alto | medio | basso |
| 7 | Il biglietto di domani | medio | basso | medio (se diventa una serie) |
| 8 | Una cosa da salvare | alto | basso | basso |
| 9 | Stare svegli | medio-alto | medio | medio (se compare una notifica) |
| 10 | La pagina del mese | medio | basso | basso |
| 11 | La mensola viva | medio-alto | medio-alto | basso |

Ordine consigliato: il sistema «Tempo e calendario» è costruito (24 ottobre, logica e motore; manca l'interfaccia). Poi 8 (costa poco, chiude bene la fine del vaso), 3, 10, 1, 7, 9, 2, 11.


## Proposte del motore (29 ottobre 2026, dopo la biologia reale)
Ordinate per impatto. Concorrenti: vedi `docs/ricerca/`.
1. **Il quaderno delle cause** (impatto alto, costo basso, interfaccia). Ogni mutazione e ogni estinzione ha già una riga `why`; mostrarla come «Perché?» con una icona del fattore (buio, secco, predatore, affollamento). Funziona perché insegna l'ecologia vera (feedback chiaro, come nei giochi di gestione). Rischio etico: nessuno. Costo: 1 giorno.
2. **Il costo scelto** (alto, medio, motore+carte). Alla mutazione proponi «proteggi» o «lascia» già ora; aggiungere una carta che sposta la pressione (es. «tappo aperto» = secco = cuticola) per guidare l'evoluzione con le cure. Rischio: manipolazione se obbliga; resta facoltativa.
3. **Ritorno gentile dopo i digiuni** (alto, basso, motore). Il digiuno lungo dei ragni è ora realistico: un evento «i ragni sono magri ma vivi» dopo 10 giorni dà una ragione per tornare e dare un grillo, senza punire l'assenza.
4. **Obiettivi di medio termine «ospita»** (medio, basso, storia/carte): «un vaso con collemboli visibili», «formiche e termiti in pace» (la guerra è ora rara e leggibile). Ricompensa: texture del vaso (condensa, puntini bianchi).
5. **Legno morto come oggetto** (medio, medio, motore+interfaccia+tre-d): permette alle termiti di vivere (oggi capacità ×0,8) e dà una scelta di setup sensata. Rischio: nessuno.
