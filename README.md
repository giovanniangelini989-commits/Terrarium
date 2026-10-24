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
