# Regole: App Store, minori, privacy, consumatori UE/Italia/Malta (24 ottobre 2026)

**Stato delle fonti.** Le linee guida Apple le ho lette direttamente su `developer.apple.com` (testo ufficiale, citazioni brevi). I siti UE, italiani e maltesi non erano raggiungibili dalla sessione cloud: per quelli ho solo riassunti di ricerca, che indico come «fonte secondaria». **Niente qui è parere legale.** Prima della pubblicazione nativa serve la verifica sui testi ufficiali (EUR-Lex, normattiva.it, legislation.mt, agcm.it, idpc.org.mt).

## 1. App Store (fonte primaria: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/))

| Tema | Regola | Cosa significa per Terrario |
|---|---|---|
| 4.2 Funzionalità minima | «Your app should include features, content, and UI that elevate it beyond a repackaged website.» | Un involucro attorno al singolo file HTML rischia il rifiuto se non aggiunge nulla di nativo (nostra lettura). |
| 4.5.4 Notifiche push | Non devono essere necessarie al funzionamento; promozioni solo con consenso esplicito e modo di disattivarle. | Richiami di cura opzionali, mai promozionali. |
| 5.1.1(i) Privacy policy | Link nei metadati di App Store Connect e nell'app, facilmente raggiungibile. | Serve una privacy policy (già in backlog). |
| 5.1.1(ii) Consenso | Se si raccolgono dati, serve il consenso e un modo per ritirarlo. | Oggi salvataggio solo in localStorage (da CLAUDE.md), nessun invio: da ribadire nella policy. |
| 5.1.1(v) | Se c'è creazione di account, va offerta la cancellazione nell'app. | Non applicabile finché non ci sono account. |
| 5.1.4 Minori | Per app per bambini: niente analytics né pubblicità di terzi; informativa privacy; rispetto delle leggi sui minori. | Evitare strumenti di terzi. |
| 1.3 Categoria Bambini | Niente link esterni né acquisti senza «parental gate»; niente analytics/pubblicità di terzi. | Scelta di categoria da decidere (vedi SINTESI); non è obbligatoria. |
| 3.1.1 Acquisti | Valute e contenuti sbloccabili vanno per In-App Purchase; le valute acquistate non scadono; odds dichiarate prima dell'acquisto per i «loot box» (oggetti casuali a pagamento). | Oggi non applicabile (nessun acquisto). Le carte estratte a ogni finale sono gratuite: restano fuori dal «a pagamento». Se un giorno si vendono carte, valgono le odds. |
| 5.6 Codice di condotta | Vietate pratiche manipolative dentro e fuori l'app (inganno su acquisti, prezzi, dati). | Vedi serie di giorni in `criticita.md`. |
| 2.5.19 | Vietate funzioni nascoste o non documentate. | Tutto ciò che c'è nell'app va nelle note di revisione. |

**Classificazione per età** ([Age ratings, Apple](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions)): cinque livelli 4+, 9+, 13+, 16+, 18+. I «loot box» portano a 9+ (e 16+ in Australia); il gioco d'azzardo a 18+. Un gioco senza queste cose ha una classificazione bassa; la domanda sulle «meccaniche di sfida» (contest) frequenti porta a 13+, da valutare solo se si aggiungono classifiche. Sistema con valori diversi per iOS 26 e versioni precedenti.

**Verifica dell'età (secondaria):** in Texas, dal 2026, i nuovi account dei minori richiedono il consenso del genitore tramite Family Sharing; Apple offre alle app la «Declared Age Range API» per sapere la fascia d'età. Le date riportate dalle fonti sono in disaccordo (Texas, Utah da 6 maggio 2026, Louisiana da 1 luglio 2026): da verificare su Apple. [9to5Mac](https://9to5mac.com/2025/10/08/apple-announces-new-requirements-for-apps-available-in-texas/), [Storyboard18](https://www.storyboard18.com/digital/apple-to-require-parental-approval-for-texas-teens-app-downloads-from-2026-82282.htm), [DEV Community](https://dev.to/mr_manushukla/age-assurance-for-apps-in-2026-the-android-and-ios-compliance-build-1c5j)

## 2. Meccaniche di ritorno e premi giornalieri

- **Nessuna fonte trovata che vieti per legge le serie di giorni o i premi giornalieri in quanto tali.** Il tema è in discussione: la Commissione europea ha fatto una consultazione sulla futura «Digital Fairness Act» (17 luglio – 24 ottobre 2025) con focus su progettazione che crea dipendenza, schemi ingannevoli, valute virtuali e minori. Un commento legale cita come esempio le ricompense di accesso giornaliero in cui saltare un giorno azzera sei giorni di progressi: è l'opinione di uno studio legale, **non una posizione della Commissione**. [Lewis Silkin](https://www.lewissilkin.com/insights/2026/01/14/european-commission-issues-responses-to-digital-fairness-consultation-102m1s7), [Parlamento europeo, Legislative Train](https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act)
- **Stato della proposta:** non ancora presentata; attesa per il quarto trimestre 2026 secondo le fonti, con ritardi già avvenuti. Opzioni riportate: spegnere di default le funzioni che creano dipendenza, vietare funzioni dannose per i minori. [Parlamento europeo, Legislative Train](https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act), [Wikipedia](https://en.wikipedia.org/wiki/Digital_Fairness_Act)
- **Sulle consultazioni:** nelle risposte raccolte, per i videogiochi il sostegno era più forte su prezzi in moneta reale per le valute virtuali, odds dei loot box e possibilità di disattivare le valute virtuali; più debole sul vietare funzioni ai minori (36%). [Lewis Silkin](https://www.lewissilkin.com/insights/2026/01/14/european-commission-issues-responses-to-digital-fairness-consultation-102m1s7)
- **Apple 5.6** vieta le «pratiche manipolative» in senso ampio, senza elencare le serie di giorni. [Apple](https://developer.apple.com/app-store/review/guidelines/)

## 3. Consumatori UE (fonti secondarie)

- **Direttiva sulle pratiche commerciali sleali, allegato I punto 28:** vietato includere in una pubblicità un'esortazione diretta ai bambini ad acquistare o a convincere i genitori ad acquistare. [Risposta della Commissione (Parlamento europeo)](https://www.europarl.europa.eu/doceo/document/E-8-2015-009285-ASW_EN.pdf), [Schönherr](https://schoenherr.eu/content/advertising-directed-at-children)
- **Caso Star Stable:** la rete CPC ha considerato esortazioni dirette ai bambini messaggi come «Buy now» e anche un popup di livello senza ordine esplicito. Esito dopo il mese concesso: non trovato. [BDK Advokati](https://bdkadvokati.com/eu-consumer-protection-authorities-address-harmful-commercial-practices-affecting-children-in-gaming), [Gamesmarket](https://www.gamesmarket.global/case-of-star-stable-online-conflict-ahead-eu-commission-and-cpc-set-sights-on-games-industry-1870db4b2004d7d284e1c833a28c1f38/)
- **Principi CPC sulle valute virtuali (21 marzo 2025):** non vincolanti; le fonti parlano di sette principi: prezzo in moneta reale, niente costi nascosti né obbligo di comprare valuta, diritto di recesso, tutela dei più vulnerabili (bambini). Le associazioni di categoria (VGE, EGDF) li contestano. [Linklaters](https://techinsights.linklaters.com/post/102k6t4/game-changer-eu-introduces-consumer-protection-guidance-for-in-game-virtual-curr), [Reed Smith](https://www.reedsmith.com/articles/qas-on-the-eu-consumer-protection-authorities-joint-guidance-paper/), [PocketGamer.biz](https://www.pocketgamer.biz/new-eu-guidelines-demand-transparency-for-in-game-purchases/)

Terrario oggi non ha valute né acquisti: queste regole diventano pertinenti solo se si aggiungono.

## 4. Italia

- **Consenso digitale dei minori:** 14 anni (art. 2-quinquies del Codice privacy, d.lgs. 196/2003, come modificato dal d.lgs. 101/2018); sotto i 14 serve il consenso di chi esercita la responsabilità genitoriale, quando il servizio si basa sul consenso. [Cybersecurity360](https://www.cybersecurity360.it/legal/privacy-dati-personali/trattamento-dei-dati-come-conciliare-eta-minima-per-il-consenso-consenso-informato-e-legittimo-interesse/), [Bird & Bird](https://childreninthedigitalworld.twobirds.com/home/italy). Il GDPR fissa 16 anni con possibilità di scendere fino a 13.
- **Autorità antitrust (AGCM):** il caso PS8754 (gioco per bambini «gratuito», 2014) si è chiuso con impegni di iTunes, Google, Amazon e Gameloft, senza sanzione. [MondoMobileWeb](https://www.mondomobileweb.it/45708-antitrust-accolti-impegni-di-itunes-google-amazon-e-gameloft-su-app-gratuite/), [AGCM PS8754](https://www.agcm.it/dotcmsDOC/allegati-news/PS8754.pdf). Più recente: due istruttorie su Activision Blizzard King (Call of Duty Mobile, Diablo Immortal) su interfacce orientate all'acquisto, offerte a tempo, controllo parentale di default, valuta di gioco poco chiara; esito e date non trovati. [QuiFinanza](https://quifinanza.it/innovazione/istruttoria-agcm-videogiochi-smartphone-diablo-call-of-duty/953550/), [Tecnoandroid](https://www.tecnoandroid.it/news/agcm-due-istruttorie-su-abk-sotto-osservazione-call-of-duty-mobile-e-diablo-immortal-1729927/)

## 5. Malta

- **Consenso digitale:** 13 anni, indicato dalla legislazione sussidiaria 586.11 sotto il Data Protection Act (pagina dell'autorità maltese IDPC). Testo della norma non letto. [IDPC](https://idpc.org.mt/our-office/legislation/), [White & Case](https://whitecase.com/publications/article/gdpr-guide-national-implementation-malta)
- **Consumatori:** la legge principale è il Consumer Affairs Act (Cap. 378), che copre clausole e pratiche commerciali sleali. [Gonzi](https://gonzi.com.mt/?p=1293)
- **Loot box e Malta Gaming Authority:** nessuna posizione ufficiale trovata. Un riassunto legale dice che i giochi d'azzardo non esentati vanno registrati presso la MGA, senza dire se i loot box rientrino. [Slater Vecchio](https://www.slatervecchio.com/?p=30219)

## 6. Cosa resta da verificare (in ordine)

1. Testo ufficiale dei punti dell'allegato I della direttiva 2005/29/CE e dei principi CPC.
2. Se la proposta Digital Fairness Act è uscita e cosa dice su serie di giorni, notifiche e minori.
3. Parere di un legale su «bisogni che calano + vaso che muore per trascuratezza» (voce già in backlog); nelle fonti trovate non c'è una norma specifica su questo.
4. Date Apple per i requisiti di età negli Stati Uniti, solo se si pubblica lì.
5. Regole equivalenti di Google Play, se si pubblica anche su Android (non esaminate).
