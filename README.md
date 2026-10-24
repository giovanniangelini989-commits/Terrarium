# Terrario

Gioco per iPhone: un barattolo sigillato con dentro un meteorite. Il giocatore è il bambino che lo ha riempito.
Prototipo web giocabile (HTML unico) → in futuro app App Store.

## Avvio rapido (Mac)
```bash
pip3 install -r requirements.txt && python3 -m playwright install chromium
python3 build_app.py            # crea dist/terrario-gioco.html
open dist/terrario-gioco.html   # gioca
```

## Test (il cancello: niente entra se non passa)
```bash
node equiv.js        # motore identico allo storico (0 differenze su 600 vasi)
node gametest.js     # 12 scenari di gioco
node app/bots.js     # 7 giocatori virtuali × 32 partite × 100 giorni
python3 e2e.py                 # 67 controlli end-to-end, iPhone standard
python3 e2e.py 375 667 se      # stessi controlli su iPhone SE
python3 e2e_3d.py              # vista 3D
```
Le schermate dei test finiscono in `screenshots/` (ignorata da git).

## Struttura
| Percorso | Cosa |
|---|---|
| `sim.js` | Motore di simulazione (fonte di verità) |
| `engine_old.js` | Motore storico, solo per il test di equivalenza |
| `app/app1.js` | Stato, salvataggio, bisogni, arrivi, carte, notti, Biscotto, albero |
| `app/app2.js` | Vaso 2D e interfaccia comune 2D/3D (`window.__vase`) |
| `app/app3.js` | Interfaccia (Tavola A), quaderno, albero, pannelli |
| `app/v3d.js` | Vaso 3D (Three.js 0.184) |
| `app/materials.js` | Libreria materiali (slot del brief Kimi v2) |
| `app/kimi.js` | Modelli di Kimi pass 1, adattati a script classico |
| `app/tex.js` | 11 texture fotografiche (base64) |
| `app/story.js`, `app/notti.js` | Testi: storia, notti vive, capitoli di Biscotto |
| `app/film.js`, `app/audio.js` | Video iniziale interattivo, audio procedurale |
| `build_app.py` | Assembla tutto in `dist/terrario-gioco.html` |
| `docs/` | Storia del progetto, contratti, backlog, brief per Kimi |
| `vendor/kimi-pass1/` | Consegna originale di Kimi (pass 1) |
| `.claude/agents/` | Gli agenti del team |

## Lavorare dal telefono (Mac spento)
1. **Una volta sola**, da un qualsiasi computer: crea il repository privato e carica il progetto
   (`gh repo create terrario --private --source=. --push`, oppure GitHub Desktop).
2. Su GitHub → Settings → Pages → Source: **GitHub Actions**. Il gioco si pubblica da solo a ogni modifica di `main`
   (con un account GitHub gratuito Pages funziona solo con repository pubblici: in quel caso rendi pubblico il repository o usa Cloudflare Pages).
3. Su claude.ai/code → ambiente cloud → **Setup script**: incolla il contenuto di `scripts/setup-cloud.sh`.
4. Dall'app Claude → **Code** → **Projects** (o una sessione cloud) sul repository `terrario`.
5. I test completi girano su **GitHub Actions** a ogni modifica: le schermate sono negli artefatti del workflow «Test».
