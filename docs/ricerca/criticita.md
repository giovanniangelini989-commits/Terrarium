# Dove Terrario è debole e dove è unico (24 ottobre 2026)

**Metodo.** I fatti su Terrario vengono da `CLAUDE.md`, `docs/STORIA.md`, `docs/BACKLOG.md` e da quello che Giovanni ci ha detto (vasi persi dopo 3 giorni, serie di giorni, niente vibrazione). I fatti sui concorrenti e sulle regole sono in `concorrenti.md` e `regole.md`, con le fonti. Quello che segue è **la nostra lettura**, non un dato misurato: nessuna statistica di ritenzione è stata trovata.

## Dove siamo più deboli

### 1. Chi passa ogni 3 giorni perde il vaso
- **Fatto nostro:** senza cure il vaso si spegne in 5–6,5 giorni reali (STORIA.md). Un giocatore che passa ogni 3 giorni resta a metà strada: ogni visita trova bisogni bassi e poca scorta.
- **Confronto:** Neko Atsume è costruito sul ritorno senza pena, «un paio di volte al giorno» e gatti che arrivano da soli ([Coppell](https://coppellstudentmedia.com/61801/entertainment/neko-atsume-kitty-collector-an-app-that-lets-you-charm-cute-cats/)). I giochi con morte o perdita ricevono lamentele: sul Tamagotchi Uni «è facile perdere il personaggio, non si recupera» ([Mozilla](https://www.mozillafoundation.org/en/privacynotincluded/tamagotchi-uni/)); su Viridi, stima di terzi, progressi persi o crescita che torna indietro ([marlvel](https://marlvel.ai/apps/viridi)).
- **Rischio:** la perdita è la lamentela più citata nei giochi simili, e il nostro ritmo la favorisce.
- **Nota:** la morte per trascuratezza è una scelta di design e va decisa da Giovanni; qui segnaliamo solo il costo.

### 2. La serie di giorni
- **Fatto nostro:** la serie ha protezioni (di cosa e quante: da `docs/` non risulta; l'agente motore deve confermare).
- **Fonti:** nessuna norma trovata che vieti le serie in sé (`regole.md` §2). Un commento legale cita il caso «salti un giorno, perdi sei giorni» come esempio di meccanica a rischio nella futura Digital Fairness Act, non ancora proposta ([Lewis Silkin](https://www.lewissilkin.com/insights/2026/01/14/european-commission-issues-responses-to-digital-fairness-consultation-102m1s7)). Apple vieta le «pratiche manipolative» in generale ([5.6](https://developer.apple.com/app-store/review/guidelines/)).
- **Rischio (nostra lettura):** una serie che punisce l'assenza va contro l'ansia di cui parlano le fonti e contro il tono calmo del gioco; le protezioni sono la mossa giusta. Mostrare la serie come perdita («perdi 6 giorni») è il caso da evitare.

### 3. Un solo file HTML su iPhone, senza vibrazione
- **Fatto nostro:** su iPhone la vibrazione dal browser non funziona (iOS 26.5). Solo suono e risposta visiva (CLAUDE.md). Salvataggio in localStorage, che può perdersi se il browser pulisce i dati (nostra lettura).
- **Fonti:** Apple chiede app che vadano oltre «a repackaged website» ([4.2](https://developer.apple.com/app-store/review/guidelines/)). Un involucro nativo senza altro aggiunto è a rischio rifiuto.
- **Confronto:** Pou invia notifiche per fame e attenzione ([SourceForge](https://sourceforge.net/app/pou-tm/iphone/)); noi, da pagina web, non abbiamo richiami. Questo è il punto dove perdiamo di più sul «far tornare», e dovrà seguire le regole opt-in di Apple ([4.5.4](https://developer.apple.com/app-store/review/guidelines/)).
- **Rischio:** i progressi persi sono lamentela frequente in Cats & Soup e Terrarium: Garden Idle ([Justuseapp](https://justuseapp.com/en/app/1581431235/cats-soup/reviews), [marlvel](https://marlvel.ai/api/llm/apps/games/terrarium-garden-idle)). Un salvataggio solo locale è lo stesso rischio.

### 4. Pochi motivi di «collezione» rispetto a Neko Atsume
- Il fascino dei gatti rari è il motore dichiarato di Neko Atsume ([Everyeye](https://www.everyeye.it/articoli/recensione-neko-atsume-27940.html)). Noi abbiamo carte e albero, ma le carte sono «da ripensare» (BACKLOG.md). Rischio medio.

### 5. Finali non ancora presenti
- I finali animati sono in arrivo (BACKLOG.md, Sprint 1). Finché mancano, la promessa del gioco (popoli, guerre, finali diversi) si vede solo nei testi.

## Dove siamo unici

1. **Nessuna pubblicità né acquisti.** Le lamentele ricorrenti dei concorrenti sono pubblicità lunghe, ricompense che non arrivano, uscite ingannevoli, abbonamento al posto dell'acquisto unico ([Terrarium: Garden Idle](https://marlvel.ai/api/llm/apps/games/terrarium-garden-idle), [Cats & Soup](https://justuseapp.com/en/app/1581431235/cats-soup/reviews), [Cell to Singularity](https://steamcommunity.com/app/977400/discussions/0/604147460574557575)). Un gioco gratuito senza questi disturbi è un vantaggio chiaro **e** ci tiene fuori dalle regole su valute, odds e minori (`regole.md`). Va però deciso con Giovanni come si finanzia il gioco: qui non c'è fonte.
2. **Cure libere, senza timer.** Il Tamagotchi 2018 fa pagare per saltare l'attesa del sonno ([Android Police](https://www.androidpolice.com/2018/01/04/hands-tamagotchi-forever-everything-love-original-digital-pet-toy-mixed-many-free-play-mechanics/)); noi no.
3. **Una storia che evolve da sola** (mutazioni, popoli, guerre, finali; STORIA.md). Nei dieci giochi esaminati non l'abbiamo trovata in questa combinazione. Limite: cerca solo in dieci giochi e con accesso web ridotto.
4. **Il giocatore è il bambino**, in seconda persona. Nessuno dei dieci lo fa nelle fonti lette (non verificato a fondo).
5. **Miniatura realistica** (macrofotografia). Viridi è stato criticato per il look «bland» ([GamingTrend](https://gamingtrend.com/reviews/plant-it-in-the-cold-cold-ground-viridi-review/)); gli altri sono prevalentemente cartoon. Lettura nostra.
6. **Notti vive e Biscotto**: motivi di ritorno narrativi (20 eventi, 3 finali), non solo contatori.

## Cosa non sappiamo
- Quanti giocatori Terrario ha e a che ritmo tornano: nessun dato nel repository letto. I «giocatori ogni 3 giorni» sono un'osservazione di Giovanni.
- Come i giochi vicini gestiscono la perdita per assenza: i dati trovati sono scarsi (vedi tabella in `concorrenti.md`).
