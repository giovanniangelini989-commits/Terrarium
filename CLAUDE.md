# Terrario — regole del progetto

Leggi prima `docs/STORIA.md` (cosa è stato deciso e perché) e `docs/CONTRATTI.md` (le interfacce tra le parti).

## Chi decide
- **Giovanni** (art director, product owner) decide direzione creativa e approva. Parla italiano.
- **L'orchestratore** (sessione principale) pianifica gli sprint, assegna il lavoro agli agenti in `.claude/agents/`, unisce i risultati, fa il QA finale e riferisce a Giovanni.
- **Kimi** (esterno) produce tutti i modelli 3D in autonomia secondo `docs/brief-kimi-v3.md`, avviato con `docs/prompt-kimi.md`. L'agente tre-d non genera modelli: li integra e ne controlla l'ingresso (`tools/qa_gate.mjs`).

## Regole non negoziabili
1. **QA prima di consegnare qualsiasi cosa a Giovanni**: test verdi + controllo visivo delle schermate. Lui vuole consegne pronte per la produzione.
2. **Ogni agente modifica solo i file che possiede** (vedi tabella in `docs/CONTRATTI.md`). Se serve toccare un file altrui, lo chiede all'orchestratore.
3. **Un cambiamento a un'interfaccia condivisa** si scrive prima in `docs/CONTRATTI.md`, poi nel codice.
4. **I test sono il cancello**: `node equiv.js`, `node gametest.js`, `node app/bots.js`, `python3 e2e.py` (standard e SE). Nessun merge con test rossi.
5. **Unione sequenziale**: l'orchestratore unisce un ramo alla volta e rilancia i test dopo ogni unione.
6. Si lavora in rami/worktree separati per agente; `main` è sempre giocabile.

## Lo studio
| Ruolo da studio | Agente | Modello |
|---|---|---|
| Creative director | **Giovanni** | — |
| Producer | orchestratore (sessione principale) | Opus |
| Showrunner (metodo serie TV) | showrunner | Opus |
| Narrative director | storia | Opus |
| Direttore artistico | direttore-artistico | Opus |
| Direttore della fotografia | luci | Opus |
| Technical artist 3D | tre-d (modelli generati da Kimi) | Opus |
| Game e systems designer | motore | Sonnet |
| UI/UX designer | interfaccia | Sonnet |
| Regista delle cinematiche | finali | Sonnet |
| Sound designer e compositore | suono | Sonnet |
| Playtest e user research | giocatore | Sonnet |
| Ricerca di mercato | ricerca | Sonnet |
| Lancio e App Store | lancio | Sonnet |
| QA | qa | Haiku |

Ogni agente lavora solo quando serve: l'orchestratore li attiva al momento giusto, non tutti insieme.

## Ciclo di perfezionamento continuo
1. **giocatore** gioca con le quattro persone e scrive dove si annoia, si confonde o si frustra.
2. **ricerca** porta i dati dei concorrenti e le criticità quando una scelta va verificata.
3. L'orchestratore trasforma i report in compiti e li assegna agli agenti secondo `docs/CONTRATTI.md`.
4. Gli agenti correggono in rami separati; l'orchestratore unisce uno alla volta e rilancia i test.
5. **qa** controlla, **direttore-artistico** approva le schermate, **giocatore** rigioca la stessa persona: il voto «quanto ho voglia di tornare domani» deve salire.
6. Report breve a Giovanni con le schermate e il link da aprire sull'iPhone.
L'orchestratore agisce senza chiedere conferma; chiede a Giovanni solo le scelte creative.

## Modelli e risparmio token
- Ogni agente ha il suo modello nel file in `.claude/agents/` (vedi «Lo studio»). Per la prima costruzione dei finali si può passare a Opus.
- **Mai leggere** `app/tex.js` (1 MB di texture), `dist/` (gioco già costruito) né tutta la cartella `screenshots/`.
- `app3.js`, `v3d.js`, `sim.js` hanno righe lunghissime: prima Grep, poi si legge solo il pezzo che serve.
- Ogni agente lancia solo i test della sua parte; la suite completa con il browser gira su GitHub Actions.
- Le schermate le guarda l'orchestratore: solo le 3–5 che contano.
- Il brief a un agente nomina i file da leggere, non ne copia il contenuto.

## Direzione creativa (già decisa)
- **Il giocatore è il bambino**: testi in seconda persona («Senti un graffio…») o prima persona nel quaderno. Mai «il bambino» come terzo personaggio.
- **Miniatura ultra-realistica**: deve sembrare macrofotografia di un barattolo vero su una scrivania vera. Materiali dalla libreria (`app/materials.js`), mai colori piatti.
- **UI Tavola A «Vetro pieno»**: vaso a tutto schermo, pillole dei bisogni in alto a sinistra, notifiche in colonna a destra, cure come pulsanti rotondi con icone a linea, maniglia del quaderno. Minimalista e immersiva (riferimento: Sky).
- **Due soli colori saturi**: viola del sasso `#A88BFF`, verde mutazioni `#7CF5C8`.
- **Micro-interazioni**: 100–250 ms, si anima la scala non le dimensioni, ogni effetto torna a riposo. Tre livelli di risposta (piccolo: tocco pulsante · medio: arrivo, scelta · grande: finale, popolo fondato).

## Vincoli tecnici
- Pagina pubblicata = un solo file HTML autonomo. Script esterni solo da cdnjs, jsDelivr, cdn.tailwindcss.com, code.jquery.com (versioni fissate, vecchie ≥ 14 giorni). Niente immagini remote, niente fetch verso altri siti.
- Three.js 0.184. Budget: iPhone 12 a 60 fps, ≤ 90k triangoli nel caso peggiore, guardia prestazioni già attiva (abbassa risoluzione, poi spegne ombre, poi il 3D).
- Su iPhone la vibrazione dal browser non funziona (Apple ha chiuso il trucco in iOS 26.5): solo suono e risposta visiva finché non c'è l'app nativa.
- Salvataggio in localStorage: tenere il salvataggio leggero (l'albero limita a 36 foto da ~5 KB).

## Lavoro nel cloud (Giovanni lavora quasi sempre dal telefono, con il Mac spento)
- Si lavora in sessioni cloud / Projects. Ogni filone apre una pull request; **i test completi girano su GitHub Actions** (workflow «Test»): una PR si unisce solo se è verde.
- Se nella sessione cloud il browser di test non è disponibile, lancia comunque i test node e affidati a GitHub Actions per quelli con il browser; leggi le schermate dagli artefatti del workflow.
- Il gioco si pubblica da solo su GitHub Pages a ogni modifica di `main`: nel report finale a Giovanni metti sempre il link da aprire sull'iPhone.
- Il report a Giovanni deve essere leggibile su telefono: breve, con le 3–5 schermate più importanti.
