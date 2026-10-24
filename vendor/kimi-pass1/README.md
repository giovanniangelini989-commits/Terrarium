# Terrario — Asset procedurali · Pass 1

Versione `1.0-pass1`. Il modulo contiene le **6 creature** e gli **8 oggetti** richiesti, oltre al banco di prova per scala, budget, instancing, illuminazione e mutation glow. Piante, meteorite, jar, elementi del terreno, insediamenti e gatto sono previsti nei Pass 2 e 3.

## File e avvio

- `models.js` — modulo ES autonomo; unico import: `three`.
- `sheet.html` — banco di prova completo.
- `index.html` — copia di ingresso di `sheet.html` per l’anteprima/static hosting.
- `README.md` — questo documento.

Avvio locale dalla cartella dei file:

```bash
python3 -m http.server 8000
```

Aprire `http://localhost:8000/sheet.html`. L’unica risorsa esterna è `three@0.184.0`, caricata come modulo ES tramite import map. Non vengono usati loader, addon, texture su disco, `fetch` o asset esterni.

## Budget misurati

I valori derivano dagli indici delle geometrie effettivamente costruite, non da stime. Una draw call per mesh; i materiali speciali di specchio e candela richiedono una seconda mesh.

| Modello | Triangoli | Budget | Draw call | Esito |
|---|---:|---:|---:|---|
| `formiche` | 326 | ≤ 350 | 1 | OK |
| `termiti` | 308 | ≤ 350 | 1 | OK |
| `coleotteri` | 280 | ≤ 350 | 1 | OK |
| `ragni` | 252 | ≤ 350 | 1 | OK |
| `lumache` | 312 | ≤ 350 | 1 | OK |
| `mosche` | 226 | ≤ 350 | 1 | OK |
| `statuina` | 132 | ≤ 600 | 1 | OK |
| `orologio` | 516 | ≤ 600 | 1 | OK |
| `giocattolo` | 416 | ≤ 600 | 1 | OK |
| `specchio` | 468 | ≤ 600 | 2 | OK |
| `libro` | 108 | ≤ 600 | 1 | OK |
| `moneta` | 336 | ≤ 600 | 1 | OK |
| `radio` | 240 | ≤ 600 | 1 | OK |
| `candela` | 234 | ≤ 600 | 2 | OK |

**Worst case parziale:** 24.920 / 60.000 triangoli, calcolato come 14 istanze di ciascuna delle 6 specie più i primi 3 oggetti (`statuina`, `orologio`, `giocattolo`). Le piante e i due insediamenti non vengono simulati con valori fittizi: entreranno nel totale quando saranno implementati.

## API del Pass 1

```js
import { MODELS } from './models.js';

const ant = MODELS.creatures.formiche.build(THREE, { seed: 1 });
// { geometry, length, materialHint }

const clock = MODELS.objects.orologio.build(THREE, { seed: 1 });
// { group, size: { w, h, d }, materials }
```

Sono inoltre esportati `CREATURE_BUILDERS`, `OBJECT_BUILDERS`, `mergeParts` e l’export default `MODELS`. Ogni geometria è indicizzata e contiene `position`, `normal`, `color`, `aAnim`, `aEmit` e `aSway`. Per le creature `aSway` resta a zero; il suo uso effettivo inizierà con le piante.

### Convenzioni

- Unità: 1 unità = 10 cm; Y verso l’alto.
- Creature in scala finale, forward `+X`; oggetti con fronte `+Z`.
- Origine alla base: dopo il merge, la geometria di ogni creatura viene traslata in modo che il suo minimo Y sia esattamente `0`.
- Colori scritti come valori sRGB nel sorgente e convertiti da `THREE.Color` nello spazio lineare.
- Nessuna scala negativa. Le ali speculari della mosca sono ruotate, non riflesse con scala negativa.
- I segmenti aperti di zampe e antenne eliminano i tappi nascosti e riducono i triangoli inutili.
- `computeBoundingSphere()` viene eseguito sulle geometrie finali.
- `mulberry32` gestisce tutte le variazioni casuali; non viene chiamato `Math.random()`.

### Animazione e glow

- Zampe: `aAnim.x = 1`, fasi alternate.
- Antenne e peduncoli: `aAnim.x = 2`.
- Ali: `aAnim.x = 3`.
- Mandibole: `aAnim.x = 4`.
- Le zone di mutazione usano `aEmit`: punta dell’addome delle formiche, bordo delle elitre e occhi delle mosche.
- `sheet.html` mostra un esempio `onBeforeCompile` che aggiunge un glow verde proporzionale ad `aEmit` senza moltiplicare le geometrie.

## Banco di prova

- Renderer WebGL con ACES Filmic, esposizione `1.05`, FOV `36°` e rig Day/Night del brief.
- Ambiente PMREM generato da un canvas con gradiente verticale; nessuna texture esterna.
- Selezione e turntable di tutti i modelli, orbita manuale, zoom, wireframe e mutation glow.
- **Scale check:** formica, statuina, cubo da 1 unità, proxy della futura hut e anello del jar con raggio `1.00`. Hut e jar nel pannello sono esclusivamente riferimenti di scala del Pass 1, non modelli finali.
- **Instancing test:** 14 istanze per specie, 84 creature totali, `setColorAt` bianco e nessuna normale invertita.
- Tabella con triangoli, draw call, attributi e worst case.
- Gli slider `dry` e `health` sono presenti ma disabilitati fino all’arrivo delle piante nel Pass 2.

## Scelte e limiti noti

1. Lo stile usa primitive a bassa densità e silhouette chunky; non sono inclusi LOD `hero` o geometrie `armor` opzionali in questo pass.
2. Il guscio della lumaca è un tubo lungo una spirale di Archimede, non un toro sovrapposto.
3. Gli occhi della statuina sono incavi scuri semplificati, senza booleane costose.
4. L’orologio include base e anello superiore; la sua altezza complessiva è `0.62`, mentre il diametro resta `0.50`.
5. Il teddy viene normalizzato alle dimensioni finali `0.45 × 0.60 × 0.40`.
6. La candela ha una cera alta `0.52`; con stoppino e fiamma raggiunge circa `0.64`. La fiamma ha un materiale emissivo separato.
7. Lo specchio usa due draw call: cornice e disco riflettente con hint `metalness: 1`, `roughness: 0.05`.
8. Le geometrie non sono sottoposte a booleane CSG: le giunzioni fra primitive restano nascoste dentro le forme, una semplificazione coerente con il budget mobile.
9. Il Pass 1 non espone ancora le chiavi `plants`, `meteorite`, `jar`, `huts`, `landmarks` e `cat`; verranno aggiunte senza cambiare le API già consegnate.

## Verifica effettuata

Test in Chromium tramite server statico: caricamento di tutti i modelli, Day/Night, wireframe, glow, scala e instancing; nessun errore console o richiesta fallita. Controllo automatico di triangoli/draw call, valori di posizione finiti, determinismo con lo stesso seed e layout mobile a 375 px senza scroll orizzontale.

## Miglioramento successivo

Nel pass successivo la priorità è dare alle piante una ricchezza visiva maggiore senza perdere la lettura miniaturistica: fronde pennate reali, tappeto di muschio continuo, secchezza che modifichi sia colore sia postura, e una transizione coerente fra il suolo, la ghiaia e il meteorite. Successivamente conviene rifinire le silhouette degli insetti a 30 px usando screenshot dalla camera effettiva del gioco, prima di aggiungere eventuali LOD hero.
