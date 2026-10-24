# Sintesi ricerca, primo giro (24 ottobre 2026)

Dettagli e fonti in `concorrenti.md`, `criticita.md`, `regole.md`. Nessun dato di ritenzione trovato; accesso web ridotto (fonti UE/IT/MT solo secondarie). Le azioni sono proposte per Giovanni, non decisioni.

## Le 5 azioni, in ordine

1. **Rendere il ritorno ogni 3 giorni non punitivo.** I giochi di cura con perdita per assenza raccolgono lamentele (Tamagotchi Uni «non si recupera»; Viridi progressi persi, stima) mentre Neko Atsume vive del ritorno senza pena. Proposta: oltre alle cure, un modo di sopravvivere ai giorni di assenza (es. il vaso «dorme» invece di spegnersi) da ricalibrare sul campione di 32 vasi. Decide Giovanni se cambiare la morte per trascuratezza. **Responsabile: motore** (calibrazione), con **storia** per i testi.
2. **Riassunto al ritorno come premio.** Neko Atsume premia chi rientra con ciò che è successo nel frattempo. Noi abbiamo le notti vive e il registro eventi: mostrare «mentre eri via» con 1–3 momenti e la foto. **Responsabile: interfaccia** (schermata), **storia** (testi in seconda persona).
3. **Serie di giorni senza paura di perdere.** Tenere le protezioni, non mostrare mai la perdita come numero («perdi N giorni»), nessuna notifica di colpa. Nessuna norma trovata che la vieti, ma la Digital Fairness Act è attesa nel quarto trimestre 2026 e Apple vieta le pratiche manipolative (5.6). **Responsabile: motore** (regole della serie), **interfaccia** (come si mostra).
4. **Preparare l'involucro nativo secondo Apple.** 4.2 (non solo sito impacchettato), 5.1.1(i) (privacy policy dentro l'app e nei metadati), 4.5.4 (notifiche solo opt-in, mai promozionali), 2.5.19 (tutto documentato), vibrazione nativa e salvataggio più robusto di localStorage. Non scegliere la Categoria Bambini senza decisione (1.3). **Responsabile: orchestratore** (logica di gioco, `build_app.py`) con **interfaccia** per il link alla policy nell'app.
5. **Far pesare i finali animati e tenere «nessuna pubblicità né acquisti» come promessa.** La lamentela più frequente nei dieci concorrenti sono pubblicità e acquisti; i finali sono il nostro punto più unico. Se un giorno si monetizza, prima si controllano i principi CPC e il punto 28 della direttiva (esortazioni ai bambini). **Responsabile: finali** (lettore, `app/finali.js`), **storia** (testi), **qa** (controllo che nessun testo spinga ad acquistare).

## Da non dimenticare
- Parere di un legale su «bisogni che calano + morte per trascuratezza» (già in backlog): nelle fonti non c'è una norma specifica.
- Il file `.claude/agents/ricerca.md` citato nell'incarico non esiste nel repository; ho seguito CLAUDE.md, STORIA.md, BACKLOG.md e CONTRATTI.md. Se la tabella dei proprietari deve includere «ricerca», va aggiunta in `docs/CONTRATTI.md` (cambio di interfaccia: lo decide l'orchestratore).
