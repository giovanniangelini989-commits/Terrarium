# Inventario delle emoji e loro sostituzione

Le emoji restano nei **dati** (sim.js, story.js, notti.js, app1/2.js: icon di specie, oggetti, eventi `EMO`, log). In visualizzazione `app/app3.js` (sezione «ICONE») le sostituisce nel DOM:
- foto di `window.__ICONE` per creature e orologio (mappa `PH`);
- icone SVG a linea della libreria `ICN` (viewBox 24, stroke 1.6, angoli tondi, `currentColor`, accenti `.a` viola #A88BFF e `.g` verde #7CF5C8);
- tolte (testo semplice) dentro `option`, `title`, `aria-label`, `placeholder`;
- emoji nuova senza icona: puntino (mai il glifo di sistema). Frecce e segni tipografici (→ ↗ ↘ ✓ ✕ ⇒) restano testo.
Verifica: `python3 e2e_emoji.py` apre tutti gli scenari di `?test`, le schede e le pagine del quaderno e cerca emoji nel DOM (testo e attributi): oggi zero.

| Emoji | Dove (file) | Sostituzione | Meglio come foto |
|---|---|---|---|
| ⏩ | app3.js | SVG `ff` |  |
| ⏭ | app1.js | SVG `skip` |  |
| ⏰ | app1.js | foto orologio | sì |
| ⏱ | app3.js | foto orologio |  |
| ⏳ | app1.js | foto orologio |  |
| ⏸ | app3.js | SVG `pause` |  |
| ☀ | app3.js | SVG `sun` |  |
| ☁ | app3.js | SVG `cloud` |  |
| ☄ | app1.js | SVG `meteor` |  |
| ☕ | app3.js | SVG `coffee` |  |
| ♨ | app3.js | SVG `steam` |  |
| ⚔ | app1.js | SVG `swords` |  |
| ⚙ | app3.js | SVG `gear` |  |
| ⚠ | app3.js | SVG `warn` |  |
| ⚡ | app1.js | SVG `bolt` |  |
| ⛅ | app3.js | SVG `partly` |  |
| ⛈ | app3.js | SVG `storm` |  |
| ✉ | app3.js | SVG `mail` |  |
| ✋ | app1.js | SVG `hand` |  |
| ✍ | app3.js | SVG `pencil` |  |
| ✔ | app3.js | SVG `check` |  |
| ✖ | app3.js | SVG `cross` |  |
| ✨ | app1.js | SVG `sparkle` |  |
| ❄ | app1.js | SVG `snow` |  |
| ❓ | app3.js | SVG `ask` |  |
| ❔ | app3.js | SVG `ask` |  |
| ⭐ | app3.js | SVG `sparkle` |  |
| 🃏 | app1.js | SVG `cards` |  |
| 🌁 | app3.js | SVG `fog` |  |
| 🌅 | app1.js | SVG `sunrise` |  |
| 🌑 | app3.js | SVG `moonnew` |  |
| 🌕 | app3.js | SVG `moonfull` |  |
| 🌟 | app3.js | SVG `sparkle` |  |
| 🌠 | app3.js | SVG `shoot` |  |
| 🌡 | app3.js | SVG `thermo` |  |
| 🌤 | app3.js | SVG `partly` |  |
| 🌧 | app1.js | SVG `rain` |  |
| 🌫 | app1.js | SVG `fog` |  |
| 🌱 | app1.js | SVG `sprout` |  |
| 🌵 | app3.js | SVG `cactus` | sì |
| 🌾 | app3.js | SVG `wheat` |  |
| 🌿 | app1.js | SVG `branch` |  |
| 🍂 | app3.js | SVG `autumn` |  |
| 🍃 | app3.js | foto felce |  |
| 🍄 | app1.js | SVG `mushroom` | sì |
| 🍪 | app3.js | SVG `cookie` |  |
| 🎁 | app3.js | SVG `gift` |  |
| 🎉 | app1.js | SVG `party` |  |
| 🎊 | app1.js | SVG `confetti` |  |
| 🎖 | app3.js | SVG `badge` |  |
| 🎶 | app3.js | SVG `music` |  |
| 🏕 | app1.js | SVG `tent` |  |
| 🏛 | app1.js | SVG `temple` |  |
| 🏜 | app3.js | SVG `desert` |  |
| 🏮 | app3.js | SVG `lantern` |  |
| 🏳 | app3.js | SVG `flag` |  |
| 🐈 | app1.js | SVG `cat` |  |
| 🐌 | app3.js | foto lumache |  |
| 🐛 | app3.js | foto termiti |  |
| 🐜 | app1.js | foto formiche |  |
| 🐱 | app3.js | SVG `cat` |  |
| 🐾 | app1.js | SVG `paw` |  |
| 👁 | app2.js | SVG `eye` |  |
| 👂 | app3.js | SVG `ear` |  |
| 👋 | app3.js | SVG `wave` |  |
| 👑 | app3.js | SVG `crown` |  |
| 👣 | app3.js | SVG `steps` |  |
| 👶 | app3.js | SVG `child` |  |
| 👹 | app1.js | SVG `monster` |  |
| 👺 | app3.js | SVG `monster` |  |
| 💀 | app3.js | SVG `skull` |  |
| 💎 | app3.js | SVG `gem` |  |
| 💤 | app1.js | SVG `sleepy` |  |
| 💧 | app3.js | SVG `drop` |  |
| 📓 | app1.js | SVG `notebook` |  |
| 📖 | app1.js | SVG `book` | sì |
| 📚 | app3.js | SVG `book` |  |
| 📻 | app1.js | SVG `radio` | sì |
| 🔍 | app1.js | SVG `search` |  |
| 🔎 | app1.js | SVG `search` |  |
| 🔔 | app1.js | SVG `bell` |  |
| 🔖 | app3.js | SVG `tag` |  |
| 🔦 | app3.js | SVG `torch` |  |
| 🔬 | app3.js | SVG `scope` |  |
| 🔰 | app1.js | SVG `shield` |  |
| 🕊 | app1.js | SVG `dove` |  |
| 🕯 | app1.js | SVG `candle` | sì |
| 🕷 | app3.js | foto ragni |  |
| 🕸 | app3.js | SVG `web` |  |
| 🗝 | app1.js | SVG `key` |  |
| 🗿 | app1.js | SVG `moai` | sì |
| 😀 | app3.js | SVG `smile` |  |
| 😊 | app3.js | SVG `smile` |  |
| 😐 | app3.js | SVG `neutral` |  |
| 😕 | app3.js | SVG `worried` |  |
| 😟 | app3.js | SVG `worried` |  |
| 😴 | app3.js | SVG `sleepy` |  |
| 🙂 | app3.js | SVG `smile` |  |
| 🚧 | app3.js | SVG `barrier` |  |
| 🛡 | app3.js | SVG `shield` |  |
| 🟢 | app3.js | SVG `dotg` |  |
| 🟣 | app3.js | SVG `dotv` |  |
| 🤝 | app3.js | SVG `shake` |  |
| 🥀 | app3.js | SVG `wilted` |  |
| 🥁 | app3.js | SVG `drum` |  |
| 🥚 | app3.js | SVG `egg` |  |
| 🥛 | app1.js | SVG `milk` |  |
| 🧒 | app3.js | SVG `child` |  |
| 🧪 | app3.js | SVG `flask` |  |
| 🧬 | app1.js | SVG `dna` |  |
| 🧭 | app1.js | SVG `compass` |  |
| 🧶 | app1.js | SVG `yarn` |  |
| 🧸 | app1.js | SVG `teddy` | sì |
| 🧹 | app3.js | SVG `broom` |  |
| 🧽 | app3.js | SVG `sponge` |  |
| 🩹 | app3.js | SVG `bandage` |  |
| 🪔 | app1.js | SVG `lamp` |  |
| 🪙 | app1.js | SVG `coin` | sì |
| 🪞 | app1.js | SVG `mirror` | sì |
| 🪟 | app3.js | SVG `window` |  |
| 🪦 | app1.js | SVG `grave` |  |
| 🪨 | app1.js | SVG `stone` |  |
| 🪰 | app3.js | foto mosche |  |
| 🪱 | app1.js | SVG `larva` |  |
| 🪲 | app3.js | foto coleotteri |  |
| 🪴 | app3.js | SVG `pot` | sì |
| 🪵 | app3.js | SVG `log` |  |
| 🪽 | app3.js | SVG `wing` |  |
| 🫙 | app1.js | SVG `jar` |  |
| 🫧 | app3.js | SVG `bubbles` |  |

## Da chiedere a Giovanni come foto (ChatGPT)
Oggetti: statuina, orsetto (giocattolo), specchietto, libro, moneta, radio, candela, orologio (già foto). Piante: muschio, succulenta, fungo, carnivora. Facoltative: lanterna, barattolo, gemma, uovo.

Nel 3D e nella vista 2D (canvas): `window.__icnImg` / `__icnFT` (app3.js) usate da `emoji()` in v3d.js e dai fillText di app2.js: foto o icona SVG a linea con alone scuro.
