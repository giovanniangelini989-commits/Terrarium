# Decisioni prese (orchestratore, su delega di Giovanni del 24 ottobre 2026)

Giovanni ha delegato all'orchestratore le scelte aperte. Ogni agente le segue; si possono rivedere solo su richiesta di Giovanni.

## 1. Assenza: il vaso va in letargo, non muore
Quando non giochi, il vaso **si addormenta**: i bisogni scendono fino a una soglia e lì si fermano, le popolazioni possono calare ma non sparire. Quando torni il vaso si risveglia, e le prime cure lo rimettono in moto.
«Il Vaso Spento» resta possibile, ma solo per trascuratezza **mentre giochi** (fai passare le notti senza curare), mai per i giorni di assenza.
*Perché:* i giochi di cura che puniscono l'assenza raccolgono lamentele (docs/ricerca), Apple vieta le pratiche manipolative (5.6), e così cade il dubbio legale su «morte per trascuratezza». La tensione resta dentro la partita.

## 2. «La Fede»: il popolo adora te, attraverso la statuina
La statuina resta la condizione del finale, ma il popolo la scolpisce a tua immagine: è il loro modo di rappresentare il gigante che li cura. Così valgono sia il gioco di oggi sia il backlog, e il giocatore resta il bambino.

## 3. Meteorite
Meteorite ferroso-roccioso con crosta di fusione scura, regmaglipti (incavi come impronte di pollice) e una rete di crepe sottili che si accendono di viola `#A88BFF` con la carica (`_EMIT`). Niente cristalli. È la descrizione del brief v3: entra nella passata C di Kimi.

## 4. Kit di Kimi
`reference/` e `golden/` sono stati consegnati a Kimi con il brief v3. Kimi li usa da lì. Per il nostro controllo d'ingresso tre-d chiede a Kimi di includerli nella prima consegna.

## 5. Modelli hero e musica: file separati sullo stesso sito
Il gioco resta un solo file HTML con dentro i modelli `swarm` e `close`. I modelli `hero` (fino a 2,6 MB) e la musica stanno in file separati sullo stesso sito GitHub Pages e si caricano solo quando servono (finali, macro). Non è un altro sito, quindi la regola «niente fetch verso altri siti» resta valida. La copia offline per iPhone usa i modelli `close` e una sola traccia musicale.

## 5b. Materiali fotografici: file a parte
Le texture fotografiche (`assets/materiali/`) si pubblicano come file `.webp` accanto al gioco (`materiali/<id>/…`), non dentro l'HTML: il gioco resta sotto i 4 MB e il telefono le tiene in cache. In locale (file://) e senza rete resta il terreno procedurale.

## 6. Niente pubblicità né acquisti
Promessa del gioco. È la lamentela più frequente nei dieci concorrenti studiati.

## 7. App Store: pubblico generale, non Categoria Bambini
Classificazione prevista 9+. La Categoria Bambini (1.3) imporrebbe vincoli che oggi non servono. Si rivede prima dell'uscita con l'agente lancio.

## 8. Musica: generata con Magnific
La musica e gli effetti si generano con Magnific. L'agente **musicista** scrive i prompt e genera; l'agente **suono** integra nel gioco (volumi, cicli, eventi). Si fa dopo il giro di correzioni in corso.
