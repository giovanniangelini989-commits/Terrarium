# Ritenzione di Terrario: cosa fa tornare, cosa manca (1 novembre 2026)

Analista: agente ricerca (ruolo gamification e ritenzione). Lingua: italiano.

**Limiti dichiarati.** Non ci sono dati reali di ritenzione (D1/D7/D30): non esistono ancora utenti in produzione. Le misure sono di tre tipi: audit del giocatore (30 ottobre, 4 persone, 12 visite ciascuna), simulazioni dei bot, lettura del codice. I dati dei concorrenti sono qualitativi: nessuna fonte web affidabile dà percentuali di ritenzione per giochi cozy o idle. Dove un dato viene da un'azienda o da un blog senza metodo lo segno **[non verificato]**. Non ho studiato Alto né Stardew: nessuna fonte di ritenzione trovata in questa sessione.

Fonti interne citate: `docs/CONTRATTI.md`, `docs/DECISIONI.md`, `docs/gameplay/gamification-2026-10-29.md`, `docs/gameplay/proposte.md`, `docs/gameplay/tempo.md`, `docs/gameplay/ciclo-settimana.md`, `docs/giocatore/2026-10-30-audit.md`, `docs/ricerca/regole.md`, `docs/ricerca/SINTESI.md`, `docs/ricerca/concorrenti.md`, `app/app1.js`, `app/app3.js`, `app/carte.js`, `app/notti.js`.

---

## 0. Sintesi in sei righe

1. Il ritorno non punisce (letargo, DECISIONI §1): è la scelta giusta e va tenuta.
2. Il ritorno però è ancora una **pila di schede**: 9–13 per visita per il frettoloso, fino a 20 per il curioso (audit, criticità 2). Qualunque meccanica nuova aggiunta sopra peggiora questo problema.
3. Mancano i **traguardi a medio termine** tra la cura quotidiana e il finale. È il buco più grande (gamification 29 ottobre, punto 2).
4. Le gocce non servono a niente (33 e 25 gocce non spese, audit criticità 3): o si tolgono o diventano un pagamento di qualcosa di permanente.
5. Il tempo del vaso è ~24 giorni reali per vaso (mediana, calibrazione del 25 ottobre). Quindi **D30 coincide quasi sempre con la chiusura del primo vaso**: il momento «fine vaso» è il vero hook a un mese, non un evento a parte.
6. Le meccaniche da inserire, in ordine: riepilogo unico al ritorno, cura che porta a una carta ogni 7 giorni (già nel codice, da rendere visibile), promesse della settimana, «una cosa da salvare» alla fine del vaso, Atlante che cambia il vaso. Notifiche push solo nell'app nativa, opt-in e descrittive (sezione 5).

---

## 1. Giocabilità attuale

**Obiettivi.** Tre missioni attive dalla fase 4 (`MISS.quante=3`, `app/app1.js` riga ~286), più una missione «grande» di più giorni. Ogni missione dà gocce; le gocce comprano notti extra, carte o una «nonna» (`MISS.costo`). Il giocatore le vede, ma nessuna ha un effetto che si conserva. Verdetto: obiettivi chiari a livello di singola missione, poco chiari come direzione («a cosa serve?»).

**Prima sessione.** Avvio a fasi: terra → acqua → muschio → felce → formica, poi tutto sbloccato (STORIA.md). Le fasi sono una buona curva di apprendimento. Il punto debole è il pulsante «Fallo», che ha lo stesso peso di «Cambia» e fa solo comparire un suggerimento (audit criticità 10). L'ostinato non capisce di dover usare Nutri e perde senza spiegazione (audit, voto 4).

**Ritmo.** Quattro notti al giorno a orario fisso (alle 0, 6, 12, 18; `docs/gameplay/tempo.md` §1). Notte costa niente fino a 3 ogni 30 minuti, Salta 2 viene dalle carte o dalle gocce. Dal 30 ottobre Salta è l'unico pulsante del tempo (`docs/CONTRATTI.md`). L'audit segnala che Notte e Salta 2 non partivano senza il flag `__fast`, bloccati da `busy()` (criticità 1): nel codice `wrapNight` ora usa `h.entering` (riga ~592–595 di `app/app3.js`), ma non ho potuto verificare il comportamento a mano. **Va provato con un test senza `__fast` prima di considerarlo chiuso.**

**Cosa fa il giocatore al ritorno (oggi).** Apre la «Mentre non c'eri» e poi 3–13 schede: Qualcosa è arrivato, Nuova missione, Stanotte, carte ricordo. Tocca Continua. Se ha sete, cura. Il curioso (voto 7) lo fa per la curiosità dell'Atlante e della nonna; il frettoloso (voto 5) impiega metà del tempo a chiudere popup.

**Voti dell'audit («quanto ho voglia di tornare domani»):** curioso 7, frettoloso 5, assente 5, ostinato 4 (`docs/giocatore/2026-10-30-audit.md`). Il voto più basso è dell'ostinato, cioè di chi non capisce cosa fare: la ritenzione dipende prima da questo.

---

## 2. Cosa già funziona per la ritenzione

| Meccanica | Dove nel codice | Perché tiene | Rischio |
|---|---|---|---|
| Letargo: il vaso dorme, non muore | `G.real.leth`, DECISIONI §1 | Chi torna dopo 5 giorni non trova lutti. Tamagotchi (neglect = morte) è la lamentela più citata nelle fonti sui giochi di cura ([NPR](https://www.npr.org/transcripts/172298069)) | Basso. Da tenere |
| Dono della nonna, uno al giorno | `donoNonna()` in `app/app1.js` riga ~232 | Nessuna serie, nessuna perdita: il ritorno porta un oggetto. Neko Atsume premia il ritorno con doni lasciati dai gatti (fonte interna, `docs/ricerca/concorrenti.md` §1) | Basso |
| Notti a orario fisso (4 al giorno) | `docs/gameplay/tempo.md` §1 | Crea un appuntamento: «la prossima notte alle 18» | Basso, se niente notifiche di colpa |
| Carta ogni 7 giorni di cura | `ODDS.cura=7` in `app/app1.js` riga ~100 e ~120 | Premia la cura, non l'attesa. `giorniCura % 7`: non si azzera mai | Basso. **Già nel codice ma invisibile** |
| Garanzie delle carte (argento entro 3 pesche, sasso entro 6) | `cardOdds()`, `docs/carte/progetto.md` | Riduce la frustrazione: si sa quando arriva la prossima | Basso |
| Notti con scelta e voce del bambino | `app/notti.js` (36 voci con `id`), `app/story.js` | Sono i momenti più citati come belli (gamification 29 ottobre) | Basso |
| Biglietto di domani, Lente, festa del popolo, Atlante | `app/app3.js` (ramo 30 ottobre, `docs/CONTRATTI.md` «Atlante, biglietto, Lente, festa, eredità») | Obiettivi a breve e lungo termine già pronti, da verificare nel build | Basso |
| Assente: 3–4 arrivi e una festa al ritorno | audit, assente | È «la parte bella» per chi torna dopo 100 giorni | Basso |

---

## 3. Cosa fanno i concorrenti (fatti e opinioni separati)

| Gioco | Cosa fa tornare (fatto) | Lezione per Terrario | Fonte |
|---|---|---|---|
| **Neko Atsume** | Il progresso avviene a gioco chiuso («progress while gone»; studio su N=1972 giocatori). Al ritorno si trovano i pesci lasciati dai gatti (fonte interna) | Il ritorno senza pena e con un regalo funziona. Il guardare da vicino è un'attività propria | [Cutting, Gundry, Cairns 2018, IJHCS, DOI 10.1016/j.ijhcs.2018.09.006](https://eprints.whiterose.ac.uk/135461); `docs/ricerca/concorrenti.md` §1 |
| **Finch** (cura di un uccellino) | Check-in quotidiano, widget con barra di progresso, notifiche che fanno tornare. Lo streak si perdona senza punire | I widget sono un canale di ritorno senza push. L'affetto per il personaggio spiega il ritorno, ma non lo dimostra ([Appbot](https://appbot.co/blog/finch-app-reviews-emotional-attachment-user-retention-product-loyalty/) riconosce che è correlazione) | [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl), [WhistleOut](https://www.whistleout.com/CellPhones/Apps/finch-self-care-app-review) |
| **Animal Crossing: Pocket Camp** | Login giornaliero premiato (150 biglietti per accedere ogni giorno nella prima metà di novembre 2018); eventi stagionali mensili. Il gioco gratuito è stato chiuso e sostituito da una versione a pagamento unico | Gli eventi stagionali funzionano; quelli con scadenza sono la parte da non copiare. Il login premiato a giorni consecutivi è la forma citata dai commentatori del DFA (vedi §6) | [Animal Crossing World 2018](https://animalcrossingworld.com/2018/10/animal-crossing-pocket-camps-first-anniversary-brings-150-free-leaf-tickets-in-november/), [Nintendo Wire 2018](https://nintendowire.com/news/2018/11/02/pocket-camp-celebrates-1st-anniversary-with-seasonal-events/), [GINX](https://www.ginx.tv/en/pocket-camp-november-seventh-anniversary-seasonal-events-free-gifts), [Nintendo](https://nintendo.com/us/whatsnew/mobilenews-animal-crossing-pocket-camp-complete-is-now-available) |
| **Pikmin Bloom** | Sfide settimanali (anche in squadra) e community day mensili; ricompense che tornano negli anniversari | L'obiettivo settimanale funziona con le scelte. Le sfide settimanali usano biglietti freemium, in parte a pagamento: da non copiare la parte a pagamento. Nessun dato di ritenzione pubblicato | [Nintendo Wire 2022](https://nintendowire.com/news/2022/07/11/pikmin-blooms-newest-update-adds-social-weekly-challenges-to-complete-with-friends/), [Pikmin Wiki, Weekly challenge](https://pikminwiki.com/Weekly_challenge) |
| **Viridi** | Una sola pianta da curare nel tempo; il team dichiara di non voler far correre a sbloccare nuove piante (dichiarazione del tecnico) | Il ritmo lento è una scelta, ma la crescita persa è il lamento più citato (fonte interna, non confermata ora) | [Wikipedia, Viridi](https://en.wikipedia.org/wiki/Viridi). Recensioni: non trovate in questa sessione |
| **Tamagotchi** | Se lo trascuri muore (versioni storiche) | Il lutto dell'animale è il motivo di abbandono più noto: il letargo è la risposta giusta | [NPR](https://www.npr.org/transcripts/172298069). Recensioni della versione Uni: non trovate |
| **Duolingo** (streak) | Lo streak sfrutta la perdita: l'azienda dichiara un effetto a 7 giorni | Non copiare. I numeri circolanti (es. «oltre il 40% in più») non hanno fonte primaria **[non verificato]** ([Mobbin](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs), [Lazyweb](https://lazyweb.com/research/duolingo-streak-goals-retention)) | Solo fonti secondarie |

**Opinione dell'analista.** Il tratto comune dei giochi che tengono è: ritorno senza pena, un motivo per guardare cosa è cambiato, una collezione che si vede. Il rischio dei giochi che perdono è il contrario: scadenze, login premiati a giorni consecutivi, lutti.

---

## 4. Le meccaniche da inserire (ordinate per impatto su ritenzione, costo, rischio)

Per ognuna: **orizzonte** (giornaliero, settimanale, mensile, collezione), **perché** (fonte), **costo** (basso/medio/alto), **chi** (agente e file secondo `docs/CONTRATTI.md`), **rischio dark pattern**.

Regola comune: niente streak che si azzera, niente scadenze che fanno perdere, niente notifiche di colpa, niente tempo limitato che porta a comprare. Le ricompense restano nel vaso e nell'album, e il giocatore non perde mai nulla.

### 1. Riepilogo unico «Mentre non c'eri» (giornaliero, D1–D7)
- **Cosa.** Un solo foglio al ritorno con 1–3 momenti, una foto e due pulsanti (Accogli / Lascia). Ogni avviso ha il suo pulsante («Terreno stanco» con «Nutri» accanto). Le altre schede vanno in coda alla visita successiva.
- **Perché.** Riduce le 9–13 schede che spingono via il frettoloso (audit). Il ritorno che racconta il mondo è il meccanismo di Neko Atsume (fonte interna e Cutting et al. 2018, sopra).
- **Costo.** Basso. **Chi.** interfaccia (`app/app3.js`), storia (testi in `app/story.js`), logica per la coda (orchestratore, `app/app1.js`).
- **Rischio.** Nessuno. Riduce il rumore.

### 2. Cura che porta alla carta ogni 7 giorni, resa visibile (settimanale, D7)
- **Cosa.** La regola esiste già (`ODDS.cura=7`): dopo 7 giorni di cura compare una carta. Oggi è invisibile. Si aggiunge una riga in «Oggi»: «Giorni di cura verso la prossima carta: 3 di 7». Nessun reset, nessuna perdita.
- **Perché.** Premia la cura quotidiana senza serie. Il contrasto sono i login premiati a giorni consecutivi, la forma citata dai commentatori del Digital Fairness Act (vedi §6).
- **Costo.** Basso (solo interfaccia: `cardOdds().cura`, già esposto). **Chi.** interfaccia, carte (testo della carta).
- **Rischio.** Basso, a patto che il numero non diventi un «perdi». Il conteggio è sui giorni di cura, non sulla presenza.

### 3. Promesse della settimana (settimanale, D7–D30)
- **Cosa.** Ogni 7 giorni reali il quaderno propone tre promesse («far nascere un popolo tra le termiti», «tre specie vive», «vetro pulito per 5 notti»). Se ne sceglie una. Se si mantiene, carta ricordo con la foto del vaso. Se no, sparisce in silenzio (`docs/gameplay/proposte.md` §2).
- **Perché.** Dà un obiettivo a medio termine scelto dal giocatore, non assegnato. Le sfide settimanali di Pikmin Bloom usano uno schema simile, con la socialità al centro ([Nintendo Wire 2022](https://nintendowire.com/news/2022/07/11/pikmin-blooms-newest-update-adds-social-weekly-challenges-to-complete-with-friends/)). Dato di ritenzione: non trovato.
- **Costo.** Medio (motore 1 giorno: predicati su `view()`; storia 20 frasi; interfaccia 1,5 giorni). **Chi.** motore (`app/app1.js` logica, `sim.js` solo se serve), storia, interfaccia, carte.
- **Rischio.** Medio. Diventa «daily quest» se la promessa è assegnata o se c'è un contatore dei fallimenti. Vietato: «ultime ore», «hai fallito», una scadenza visibile.

### 4. Una cosa da salvare alla chiusura del vaso (mensile, D30)
- **Cosa.** Quando il vaso si chiude, il gioco chiede una sola cosa da portare nel vaso nuovo: un seme di una pianta, un oggetto dal tavolo, o «niente, solo il sasso». Il nuovo vaso parte dalla fase 0 con quella scelta (`docs/gameplay/proposte.md` §8, `docs/gameplay/tempo.md` §7).
- **Perché.** D30 coincide con la chiusura del primo vaso (mediana 24 giorni reali). È il momento più carico e oggi non ha scelta: la carta esce da sola. Le roguelite di cura (es. Spiritfarer, citato nei documenti interni) ritrovano il giocatore grazie al segno della partita precedente. Fonte web sul punto: non trovata in questa sessione.
- **Costo.** Basso (½ giorno logica, ½ interfaccia, storia 3 righe). **Chi.** orchestratore (`closeChapter`), interfaccia, storia, motore (test).
- **Rischio.** Basso. Il «niente» è un'opzione piena, senza giudizio.

### 5. Atlante che cambia il vaso (collezione, D30–D90)
- **Cosa.** L'Atlante (32 pagine, `docs/CONTRATTI.md`) è già nel gioco. Ora le soglie 14, 22 e 32 pagine aggiungono qualcosa al vetro: un'etichetta scritta a mano, una lucciola, un lume sul davanzale (`docs/gameplay/proposte.md` §2 del 30 ottobre).
- **Perché.** La collezione si vede nel mondo, non in un menu. Neko Atsume tiene i giocatori con oggetti visibili nella stanza (fonte interna: `docs/ricerca/concorrenti.md` §1). Pikmin Bloom riporta nelle ricorrenze le ricompense passate: il collezionismo che ritorna ([Pikmin Wiki, Event](https://www.pikminwiki.com/Event)).
- **Costo.** Medio, quasi tutto 3D e luci. **Chi.** tre-d, luci, interfaccia (espone `atlante().rango`).
- **Rischio.** Nessuno, purché non diventi un oggetto da comprare.

### 6. Pagina del mese (mensile, D30)
- **Cosa.** Il primo giorno del mese il quaderno scrive una pagina con i dati del calendario: notti vissute, notti dormite, il giorno più ricco, la foto migliore, un popolo nato. In prima persona, senza voti né confronti (`docs/gameplay/tempo.md` §10).
- **Perché.** Trasforma il calendario in ricordo. I riepiloghi periodici sono un'idea forte in molti prodotti, ma è un'opinione del team: **nessuna fonte web trovata su questo punto**.
- **Costo.** Basso. **Chi.** motore (`riassuntoMese`), storia, interfaccia.
- **Rischio.** Basso. Mai percentuali di presenza («hai dormito il 40%»).

### 7. Mensola dei vasi (collezione, D90)
- **Cosa.** I vasi finiti restano sulla mensola dietro al vaso, in miniatura, con il colore del finale. Toccando un barattolo si apre la sua scheda. Ogni tanto un vaso passato «si fa sentire» in una pagina del quaderno (`docs/gameplay/proposte.md` §11).
- **Perché.** È la ricompensa a lungo termine che resta visibile dopo 90 giorni. Crea un motivo per iniziare un vaso nuovo, senza scadenza.
- **Costo.** Medio-alto (1,5 giorni tre-d, ½ logica, storia 10 pagine). **Chi.** tre-d, direttore-artistico (colori delle famiglie), storia, interfaccia.
- **Rischio.** Basso. La mensola mostra la durata («112 giorni»), non il numero dei vasi.

### 8. Festa dei popoli sul calendario reale (mensile, D30–D90)
- **Cosa.** Oggi la festa torna ogni 30 notti (`docs/gameplay/proposte.md` §6). Ma per chi gioca ogni giorno 30 notti sono 7–8 giorni reali: non è una cadenza mensile. Proposta: la festa torna ogni 30 giorni **reali** dalla nascita del popolo, sul calendario. Il segno resta nel vaso.
- **Perché.** Animal Crossing tiene i giocatori con feste a data fissa (fonte interna, `docs/gameplay/gamification-2026-10-29.md`). Qui la data la dà il calendario reale, non un negozio.
- **Costo.** Medio. **Chi.** motore (`sim.js` evento `festa`), tre-d, storia, interfaccia.
- **Rischio.** Basso. Se la festa cade in assenza, si vede al risveglio e il segno resta. Nessun «l'hai persa».

### 9. Stagioni del davanzale (collezione, D90 e oltre)
- **Cosa.** Il vaso sente la stagione del telefono (data, non posizione): d'inverno la luce cala e i popoli si raccolgono, d'estate l'umidità scende prima. Ogni stagione lascia una ricompensa visibile (brina sul vetro, foglia dal tappo) e una carta ricordo (`docs/gameplay/proposte.md` §5).
- **Perché.** Dà un motivo di ritorno a mesi di distanza senza obbligo. Pocket Camp usa eventi stagionali mensili ([Nintendo Wire 2018](https://nintendowire.com/news/2018/11/02/pocket-camp-celebrates-1st-anniversary-with-seasonal-events/)), ma con scadenza: noi no. Quella è la differenza.
- **Costo.** Medio. **Chi.** motore (modificatori, bot per stagione), luci, tre-d, storia, carte.
- **Rischio.** Basso. Nessun evento a tempo la cui ricompensa si perde. La carta della stagione si ottiene aprendo il gioco una volta in quella stagione.

### 10. Il patto (scelta che conta, D90 e replay)
- **Cosa.** Quando un popolo si fonda, chiede un patto una sola volta: «Vi proteggo», «Vi lascio liberi», «Vi chiedo un tributo». La scelta cambia il finale di quel popolo e va nell'albero (`docs/gameplay/proposte.md` §4).
- **Perché.** Una decisione che il giocatore ricorda e che si vede nei finali è un motivo di replay, con lo stesso popolo e un patto diverso. Oggi le decisioni sono locali e si dimenticano.
- **Costo.** Medio-alto (motore 2 giorni, storia 3 testi × 10 culture, finali). **Chi.** motore, storia, finali, interfaccia.
- **Rischio.** Basso. Nessuna pressione temporale: il patto aspetta.

### Già nel gioco o con un prerequisito (non contano tra le 10)
- **Prerequisito A: coda popup.** Massimo 3 schede per visita; le missioni nuove vanno nel badge del pulsante; il resto in coda per la visita dopo (audit, criticità 2). Senza questo, ogni meccanica sopra peggiora il ritorno del frettoloso. **Chi.** interfaccia (`showNextPopup`, `app/app3.js`) e logica (`missPop`, `app/app1.js`).
- **Prerequisito B: Notte senza `__fast`.** Va provato con un test e2e senza il flag (audit, criticità 1). **Chi.** interfaccia.
- **Prerequisito C: il suggerimento che dice cosa curare.** «Terreno a 0%» deve nominare Nutri (audit, criticità 5). **Chi.** storia e interfaccia.
- **Gocce.** Decidere: tolte, o pagamento di un permanente (una seconda Lente, un posto in più per gli oggetti) (audit, criticità 3). Decisione di Giovanni.

---

## 5. Notifiche push per l'app nativa futura

Oggi il gioco ha solo notifiche in-app (la pastiglia «Ti è venuta un'idea», `docs/CONTRATTI.md`). Le push arrivano con l'app nativa. Regole proposte, da rivedere con il lancio:

**Principi (da Apple, `docs/ricerca/regole.md` §1).**
- Le push **non sono necessarie al funzionamento** (4.5.4). Il gioco deve funzionare anche senza.
- Le promozioni vanno solo con consenso esplicito e un modo semplice per disattivarle (4.5.4). **Non ci sono promozioni.**
- Il consenso si chiede dopo aver giocato almeno una volta, mai alla prima apertura.

**Cosa si può mandare (tutte opt-in, tutte descrittive):**
1. «Il muschio ha sete»: un bisogno sotto il 25 % e il vaso sveglio. Una volta al giorno, al massimo. Mai in letargo. È il rimedio all'ostinato che non vede la barra (audit, criticità 5; `docs/giocatore/2026-10-24-frettoloso.md`).
2. «Il vaso ha una risposta al tuo biglietto»: se la casella di domani si è colorata (`docs/gameplay/proposte.md` §7).
3. «Oggi il popolo fa festa»: il giorno della festa, se il giocatore l'ha attivata.
4. «Stagione nuova»: quattro all'anno.

**Vietato:** «hai perso», «ultimo giorno», «ti stiamo aspettando», «non ti sei preso cura», conti alla rovescia, notifiche di acquisto, streak. **Vietato anche il richiamo automatico dopo N giorni di silenzio** (una pratica diffusa nei giochi di questo tipo): se mai, solo se il giocatore lo attiva.

**Orario e frequenza.** Massimo una al giorno, orario scelto dal giocatore, nessuna notte. Niente push durante il letargo.

**Dati e minori.** Il token push è un dato personale. Il gioco è pensato per 9+. In Italia il consenso digitale dei minori è a 14 anni (art. 2-quinquies del Codice privacy, `docs/ricerca/regole.md` §4); a Malta a 13 (`regole.md` §5). Il token va in locale o con una policy chiara; nessun profilo, nessuna analisi di terzi. Da verificare con `lancio` prima dell'uscita.

**Cosa tenere fuori dalle push.** Tutto ciò che è spinta al ritorno senza valore per il giocatore: il vaso non deve chiedere di tornare.

---

## 6. Regole: cosa cambia per le meccaniche di ritorno

- **Digital Fairness Act (UE).** Non è ancora stata presentata la proposta. Il calendario indicato è Q4 2026; uno studio legale cita una bozza per l'11 novembre 2026 (**fonte secondaria, non confermata**) ([Revera](https://revera.legal/en/info-centr/news-and-analytical-materials/2091-digital-fairness-act-dfa-kak-izmenyatsya-pravila-dlya-cifrovoj-ekonomiki-es/), [Parlamento europeo, Legislative Train](https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act)). Il commento legale cita come esempio un login giornaliero che azzera sei giorni di progressi se si salta un giorno: è **un'opinione, non la posizione della Commissione**. La Commissione ha detto che esaminerà gli elementi di design che creano dipendenza, con attenzione ai minori (le fonti parlano di default disattivati o divieti per i giochi per bambini) ([CMS](https://cms.law/en/aut/legal-updates/inside-the-eu-s-planned-digital-fairness-act-digital-design-subscription-traps-and-influencer-marketing)).
  **Conseguenza:** evitare login premiati a giorni consecutivi con perdita; la cura a 7 giorni (punto 2) non azzera nulla e non è un login.
- **Pratiche aggressive, Italia.** Il Codice del consumo (D.Lgs. 206/2005) vieta le pratiche commerciali aggressive (artt. 20, 24–26) ([Brocardi](https://www.brocardi.it/codice-del-consumo/parte-ii/titolo-iii/capo-ii/sezione-ii/), [Normattiva, testo consolidato](https://www.normattiva.it/eli/id/2007/09/06//007G0161/CONSOLIDATED)). Il testo integrale degli articoli non è stato letto in questa sessione: **da verificare su Normattiva**. L'AGCM ha aperto istruttorie su giochi mobili per offerte a tempo e interfacce orientate all'acquisto (fonte interna `regole.md` §4, esito non trovato). Per Terrario, la conseguenza pratica è: nessuna offerta a tempo, nessun acquisto.
- **Principi CPC sulle valute virtuali (marzo 2025).** Non vincolanti; pertinenti solo se si aggiungono valute o acquisti (`regole.md` §3). Oggi le gocce sono una valuta interna: se si tengono, serve il prezzo in chiaro e nessun obbligo di comprare.
- **Apple.** 5.6 (pratiche manipolative), 3.1.1 (valute e odds dichiarate per i contenuti casuali a pagamento), 4.5.4 (push) ([linee guida](https://developer.apple.com/app-store/review/guidelines/)). Per la classificazione 9+ il gioco non ha loot box né acquisti.
- **Malta.** Il Consumer Affairs Act (Cap. 378) copre le pratiche commerciali sleali; non è stata trovata una posizione sui loot box (`regole.md` §5). Nessuna meccanica di acquisto, quindi nessun rischio diretto oggi.

---

## 7. Cosa non fare (rischi dark pattern riassunti)

- Streak che si azzerano (Duolingo, e i login premiati a giorni consecutivi con perdita): assenti dalla lista.
- Premi del giorno a scadenza e login a giorni consecutivi con perdita (la forma citata dai commentatori del DFA, §6). Gli eventi sono solo stagionali e senza perdita.
- Notifiche di colpa, di re-engagement automatico o con conto alla rovescia.
- Contatori di fallimento («promesse mancate: 3»).
- Gocce che diventano pagamento per evitare un'attesa: il tempo del vaso non si compra.
- Confronti sociali o classifiche (per 9+ non servono e rischiano la classificazione 13+, `regole.md` §1).

---

## 8. Come misurare senza dati di terze parti

Non c'è un benchmark D1/D7/D30 affidabile per i giochi cozy (confermato da `docs/gameplay/gamification-2026-10-29.md` §5). Per misurare Terrario senza inviare dati fuori dal telefono:
- **Bot** (`app/bots.js`, colonne nuove): quota di profili che tornano a 1, 7, 30, 90 giorni simulati; giorni reali per vaso (mediana e 90°); carte e promesse mantenute per profilo. Eseguire con `SOLO='<profilo>'`. I bot misurano il ritmo, non il piacere: vanno affiancati ai giocatori.
- **Quattro giocatori** (`docs/giocatore/`): voto «quanto ho voglia di tornare domani», ripetuto a D1, D7, D30 con la stessa persona.
- **Analytics di terze parti: no.** Con la categoria 9+ e la regola 5.1.4 per le app per minori, meglio nessun SDK. Se servono numeri reali, contatori locali con esportazione volontaria.

---

## 9. Ordine di lavoro proposto (per l'orchestratore)

1. Prerequisiti A, B, C (coda popup, Notte senza `__fast`, nomi delle cure): interfaccia, storia.
2. Meccanica 1 (riepilogo unico) e 2 (cura a 7 giorni visibile): interfaccia.
3. Meccanica 4 (una cosa da salvare): orchestratore, interfaccia, storia.
4. Meccanica 3 (promesse della settimana): motore, storia, interfaccia.
5. Meccanica 5 (Atlante che cambia il vaso): tre-d, luci, interfaccia.
6. Le altre (6–10) dopo la misura dei bot e dei quattro giocatori.
7. Notifiche push: solo con l'app nativa, dopo un parere su minori e token con `lancio`.

Ogni passo va rimisurato con i bot e con il voto dei quattro giocatori. Il successo si vede se il voto «quanto ho voglia di tornare domani» sale da 4–5 a 6–7 per frettoloso, assente e ostinato.

---

## Fonti

Esterne (verificate in questa sessione, con il grado indicato):
- Cutting, Gundry, Cairns (2018), «Busy doing nothing? What do players do in idle games?», IJHCS, DOI 10.1016/j.ijhcs.2018.09.006: [eprints.whiterose.ac.uk](https://eprints.whiterose.ac.uk/135461) (fatto: studio su N=1972 giocatori; i dati di ritorno specifici non sono nel riassunto).
- Viridi, [Wikipedia](https://en.wikipedia.org/wiki/Viridi) (dichiarazione di design; recensioni non trovate).
- Pikmin Bloom: [Nintendo Wire 2022](https://nintendowire.com/news/2022/07/11/pikmin-blooms-newest-update-adds-social-weekly-challenges-to-complete-with-friends/), [Pikmin Wiki, Weekly challenge](https://pikminwiki.com/Weekly_challenge), [Pikmin Wiki, Event](https://www.pikminwiki.com/Event) (fatti sulle meccaniche; nessun dato di ritenzione).
- Finch: [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl), [WhistleOut](https://www.whistleout.com/CellPhones/Apps/finch-self-care-app-review), [Appbot](https://appbot.co/blog/finch-app-reviews-emotional-attachment-user-retention-product-loyalty/) (blog e recensioni: opinioni; nessun dato quantitativo).
- Animal Crossing: Pocket Camp: [Animal Crossing World, 2018](https://animalcrossingworld.com/2018/10/animal-crossing-pocket-camps-first-anniversary-brings-150-free-leaf-tickets-in-november/), [Nintendo Wire, 2018](https://nintendowire.com/news/2018/11/02/pocket-camp-celebrates-1st-anniversary-with-seasonal-events/), [GINX](https://www.ginx.tv/en/pocket-camp-november-seventh-anniversary-seasonal-events-free-gifts), [Nintendo, Pocket Camp Complete](https://nintendo.com/us/whatsnew/mobilenews-animal-crossing-pocket-camp-complete-is-now-available) (fatti su eventi e login premiati; nessun dato di ritenzione).
- Tamagotchi: [NPR](https://www.npr.org/transcripts/172298069) (fatto: neglect porta alla morte nelle versioni storiche). Recensioni della versione Uni: non trovate.
- Duolingo (streak): [Mobbin](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs), [Lazyweb](https://lazyweb.com/research/duolingo-streak-goals-retention) **[non verificato]** (numeri senza fonte primaria).
- Digital Fairness Act: [Parlamento europeo, Legislative Train](https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act) (fatto: proposta non ancora presentata, Q4 2026), [Revera](https://revera.legal/en/info-centr/news-and-analytical-materials/2091-digital-fairness-act-dfa-kak-izmenyatsya-pravila-dlya-cifrovoj-ekonomiki-es/) (opinione legale), [CMS](https://cms.law/en/aut/legal-updates/inside-the-eu-s-planned-digital-fairness-act-digital-design-subscription-traps-and-influencer-marketing) (analisi).
- Codice del consumo: [Brocardi](https://www.brocardi.it/codice-del-consumo/parte-ii/titolo-iii/capo-ii/sezione-ii/), [Normattiva, consolidato](https://www.normattiva.it/eli/id/2007/09/06//007G0161/CONSOLIDATED) (testo degli artt. 24–26 non letto integralmente).
- Apple App Review Guidelines: [developer.apple.com](https://developer.apple.com/app-store/review/guidelines/) (3.1.1, 4.5.4, 5.1.4, 5.6, citati come in `docs/ricerca/regole.md`).

Interne:
- `docs/CONTRATTI.md`, `docs/DECISIONI.md` §1, §6
- `docs/gameplay/gamification-2026-10-29.md`, `proposte.md`, `tempo.md`, `ciclo-settimana.md`
- `docs/giocatore/2026-10-30-audit.md`, `docs/giocatore/2026-10-24-frettoloso.md`
- `docs/ricerca/regole.md`, `SINTESI.md`, `concorrenti.md`
- Codice letto con Grep, senza aprire `app/tex.js` né `dist/`: `app/app1.js` (ODDS riga ~100, cardOdds ~105, donoNonna ~232, MISS ~286, missFill ~312), `app/app3.js` (busy e nHold ~210–217, wrapNight ~592), `app/carte.js` (album, garanzie), `app/notti.js` (36 voci `id`), `app/story.js`.
