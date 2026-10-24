# Carte: suoni richiesti (per l'agente suono)

`carte.js` chiama `AU.sfx(nome)`; i nomi non ancora definiti in `audio.js` non suonano (nessun errore). Volumi bassi: è una scrivania, non un casinò. Su iPhone non c'è vibrazione: il suono è il feedback.

| Nome | Quando | Carattere |
|---|---|---|
| `carta-velina` | la velina sale dal basso (arrivo) | fruscio di carta velina, 400 ms |
| `carta-filo` | il filo si spezza (apertura) | schiocco secco, cortissimo |
| `carta-lembo` | i due lembi si aprono | due fruscii brevi, uno dopo l'altro (180 + 180 ms) |
| `carta-gira` | la carta si gira | un colpo di carta rigida che ruota |
| `carta-posa` | festa, di carta (piccola) | carta che si posa sul legno, un filo di polvere |
| `carta-lamina` | festa, d'argento (media) | riflesso metallico, «shimmer» breve, senza glitter da slot |
| `carta-sasso` | festa, del sasso (grande) | rombo basso + cristallo che si incrina; meno di 2 s, torna al silenzio |
| `carta-foto` | festa, ricordo | foto che si sviluppa: sibilo morbido, poi un timbro |
| `carta-timbro` | timbro «Nuova nell'album» | timbro di gomma su carta |
| `carta-mazzo` | la carta vola sull'asso | carta che scivola nel mazzo |
| `carta-album` | il ricordo entra nell'album | pagina + tasca |
| `carta-vaso` | la carta entra dal tappo del vaso | carta che si piega + tappo che si chiude |
| `carta-ventaglio` | il mazzo si apre a ventaglio | ventaglio di carte |
| `carta-pagina` | si apre una carta dall'album | pagina sfogliata |

Mancano ancora (non chiamati da `carte.js`, da aggiungere quando ci sarà l'effetto 3D per carta): un suono per effetto nel vaso (pioggia, terra, scintilla, ombra, oggetto, sasso) e «set completo» (grande).
