# Case delle specie: prompt per ChatGPT

Ogni specie costruisce o abita come in natura: le formiche scavano un formicaio, le termiti alzano un termitaio, le lumache si rifugiano tra gusci vuoti sotto una foglia, le mosche crescono attorno al frutto che matura, i ragni tessono una tana di seta, i coleotteri scavano il legno. Ogni prompt chiede 4 stadi di crescita. Il bagliore viola delle mutazioni lo aggiunge il gioco.

## 1. Formiche: il formicaio
Nome del file da chiedere: `formicaio.glb`
```
Sei un modellatore 3D tecnico. Scrivi ed ESEGUI tu stesso uno script Python (trimesh, numpy, PIL per le texture) che crea il modello 3D descritto sotto e consegnami il file .glb da scaricare.

Requisiti tecnici obbligatori:
- Forme organiche e irregolari (rumore sulle superfici, niente solidi geometrici perfetti), aspetto naturale da macrofotografia.
- Texture o colori dei vertici realistici e variati (terra, legno, seta), mai un colore piatto uniforme; metallicFactor 0 ovunque.
- Orientamento: alto verso +Y, appoggiato a y = 0, centrato in x = 0, z = 0. Unità: 1 = 10 cm.
- Massimo 4.000 triangoli per ogni stadio; pochi pezzi (massimo 6 per stadio).
- Fai 4 STADI DI CRESCITA dello stesso oggetto, come nodi separati chiamati stage_1, stage_2, stage_3, stage_4, affiancati lungo l'asse X a 0,6 unità di distanza (stage_1 = appena iniziato, stage_4 = completo).
- Alla fine mostrami 2 anteprime (tre quarti e dall'alto) su sfondo grigio, controlla che i 4 stadi siano diversi e credibili, correggi se serve, poi dammi il file .glb.

Oggetto: un FORMICAIO di formiche rosse dei boschi (Formica rufa) in miniatura, largo 0,35 unità e alto 0,18 a stadio 4. Una cupola di terra smossa e granelli di terriccio mescolati a minuscoli aghi di pino, rametti e semi; 3–5 ingressi scuri (fori) sui fianchi e in cima; un piccolo cratere di terra scavata attorno. Stadio 1: un solo foro con un cumulo di granelli di terra accanto. Stadio 2: due fori e un cumulo più grande. Stadio 3: cupola bassa con aghi e rametti. Stadio 4: cupola completa con più ingressi e sentieri battuti che partono dal nido.

Chiama il file formicaio.glb.
```

## 2. Termiti: il termitaio
Nome del file da chiedere: `termitaio.glb`
```
Sei un modellatore 3D tecnico. Scrivi ed ESEGUI tu stesso uno script Python (trimesh, numpy, PIL per le texture) che crea il modello 3D descritto sotto e consegnami il file .glb da scaricare.

Requisiti tecnici obbligatori:
- Forme organiche e irregolari (rumore sulle superfici, niente solidi geometrici perfetti), aspetto naturale da macrofotografia.
- Texture o colori dei vertici realistici e variati (terra, legno, seta), mai un colore piatto uniforme; metallicFactor 0 ovunque.
- Orientamento: alto verso +Y, appoggiato a y = 0, centrato in x = 0, z = 0. Unità: 1 = 10 cm.
- Massimo 4.000 triangoli per ogni stadio; pochi pezzi (massimo 6 per stadio).
- Fai 4 STADI DI CRESCITA dello stesso oggetto, come nodi separati chiamati stage_1, stage_2, stage_3, stage_4, affiancati lungo l'asse X a 0,6 unità di distanza (stage_1 = appena iniziato, stage_4 = completo).
- Alla fine mostrami 2 anteprime (tre quarti e dall'alto) su sfondo grigio, controlla che i 4 stadi siano diversi e credibili, correggi se serve, poi dammi il file .glb.

Oggetto: un TERMITAIO in miniatura, una torre di argilla e legno masticato, colore ocra-bruno, alto 0,45 unità a stadio 4, con pareti rugose e ondulate, piccoli camini di ventilazione e pinnacoli come una cattedrale di fango. Stadio 1: un piccolo grumo di argilla su un pezzetto di legno morto. Stadio 2: un cono basso. Stadio 3: torre con un camino. Stadio 4: torre alta con 3 pinnacoli e camini.

Chiama il file termitaio.glb.
```

## 3. Lumache: il rifugio dei gusci
Nome del file da chiedere: `rifugio_lumache.glb`
```
Sei un modellatore 3D tecnico. Scrivi ed ESEGUI tu stesso uno script Python (trimesh, numpy, PIL per le texture) che crea il modello 3D descritto sotto e consegnami il file .glb da scaricare.

Requisiti tecnici obbligatori:
- Forme organiche e irregolari (rumore sulle superfici, niente solidi geometrici perfetti), aspetto naturale da macrofotografia.
- Texture o colori dei vertici realistici e variati (terra, legno, seta), mai un colore piatto uniforme; metallicFactor 0 ovunque.
- Orientamento: alto verso +Y, appoggiato a y = 0, centrato in x = 0, z = 0. Unità: 1 = 10 cm.
- Massimo 4.000 triangoli per ogni stadio; pochi pezzi (massimo 6 per stadio).
- Fai 4 STADI DI CRESCITA dello stesso oggetto, come nodi separati chiamati stage_1, stage_2, stage_3, stage_4, affiancati lungo l'asse X a 0,6 unità di distanza (stage_1 = appena iniziato, stage_4 = completo).
- Alla fine mostrami 2 anteprime (tre quarti e dall'alto) su sfondo grigio, controlla che i 4 stadi siano diversi e credibili, correggi se serve, poi dammi il file .glb.

Oggetto: il RIFUGIO DELLE LUMACHE: sotto una grande foglia secca curva appoggiata a terra come un tetto, una zona umida di terra scura e lucida con alcuni GUSCI VUOTI abbandonati a spirale (bruno-ambra, alcuni rotti), muschio, e scie di bava argentee lucide. Larghezza 0,4 unità a stadio 4. Stadio 1: un solo guscio vuoto sotto una foglietta. Stadio 2: due gusci e la foglia più grande. Stadio 3: tre gusci impilati e muschio. Stadio 4: la foglia grande come tetto, cinque gusci di varie misure disposti a cerchio, muschio e scie di bava.

Chiama il file rifugio_lumache.glb.
```

## 4. Mosche: il frutto e le pupe
Nome del file da chiedere: `nido_mosche.glb`
```
Sei un modellatore 3D tecnico. Scrivi ed ESEGUI tu stesso uno script Python (trimesh, numpy, PIL per le texture) che crea il modello 3D descritto sotto e consegnami il file .glb da scaricare.

Requisiti tecnici obbligatori:
- Forme organiche e irregolari (rumore sulle superfici, niente solidi geometrici perfetti), aspetto naturale da macrofotografia.
- Texture o colori dei vertici realistici e variati (terra, legno, seta), mai un colore piatto uniforme; metallicFactor 0 ovunque.
- Orientamento: alto verso +Y, appoggiato a y = 0, centrato in x = 0, z = 0. Unità: 1 = 10 cm.
- Massimo 4.000 triangoli per ogni stadio; pochi pezzi (massimo 6 per stadio).
- Fai 4 STADI DI CRESCITA dello stesso oggetto, come nodi separati chiamati stage_1, stage_2, stage_3, stage_4, affiancati lungo l'asse X a 0,6 unità di distanza (stage_1 = appena iniziato, stage_4 = completo).
- Alla fine mostrami 2 anteprime (tre quarti e dall'alto) su sfondo grigio, controlla che i 4 stadi siano diversi e credibili, correggi se serve, poi dammi il file .glb.

Oggetto: il NIDO DELLE MOSCHE: le mosche non costruiscono, si radunano dove c'è cibo che matura. Un piccolo frutto caduto (un acino o una mora) che matura e si ammorbidisce, con accanto un gruppo di PUPE di mosca (piccoli bozzoli ovali marrone-rossiccio, lucidi, lunghi 0,02 unità) mezze interrate. Larghezza 0,3 unità a stadio 4. Stadio 1: un frutto intero lucido. Stadio 2: il frutto un po' ammaccato e 3 pupe. Stadio 3: il frutto aperto con polpa visibile e 8 pupe. Stadio 4: il frutto avvizzito, 15 pupe di cui alcune aperte (vuote) e piccoli resti di ali.

Chiama il file nido_mosche.glb.
```

## 5. Ragni: la tana di seta
Nome del file da chiedere: `tana_ragni.glb`
```
Sei un modellatore 3D tecnico. Scrivi ed ESEGUI tu stesso uno script Python (trimesh, numpy, PIL per le texture) che crea il modello 3D descritto sotto e consegnami il file .glb da scaricare.

Requisiti tecnici obbligatori:
- Forme organiche e irregolari (rumore sulle superfici, niente solidi geometrici perfetti), aspetto naturale da macrofotografia.
- Texture o colori dei vertici realistici e variati (terra, legno, seta), mai un colore piatto uniforme; metallicFactor 0 ovunque.
- Orientamento: alto verso +Y, appoggiato a y = 0, centrato in x = 0, z = 0. Unità: 1 = 10 cm.
- Massimo 4.000 triangoli per ogni stadio; pochi pezzi (massimo 6 per stadio).
- Fai 4 STADI DI CRESCITA dello stesso oggetto, come nodi separati chiamati stage_1, stage_2, stage_3, stage_4, affiancati lungo l'asse X a 0,6 unità di distanza (stage_1 = appena iniziato, stage_4 = completo).
- Alla fine mostrami 2 anteprime (tre quarti e dall'alto) su sfondo grigio, controlla che i 4 stadi siano diversi e credibili, correggi se serve, poi dammi il file .glb.

Oggetto: la TANA DEL RAGNO: una ragnatela a imbuto tesa tra due rametti e il terreno, fili sottilissimi e semitrasparenti (materiale con alpha), che termina in un rifugio a tubo di seta bianca rivestito di frammenti di foglia e terra, con un paio di prede avvolte nella seta (piccoli bozzoli allungati). Larghezza 0,4 unità a stadio 4. Stadio 1: pochi fili tra due rametti. Stadio 2: tela piatta. Stadio 3: tela a imbuto con il rifugio. Stadio 4: tela grande con rugiada sui fili, rifugio rivestito e 2 prede avvolte.

Chiama il file tana_ragni.glb.
```

## 6. Coleotteri: il ceppo scavato
Nome del file da chiedere: `ceppo_coleotteri.glb`
```
Sei un modellatore 3D tecnico. Scrivi ed ESEGUI tu stesso uno script Python (trimesh, numpy, PIL per le texture) che crea il modello 3D descritto sotto e consegnami il file .glb da scaricare.

Requisiti tecnici obbligatori:
- Forme organiche e irregolari (rumore sulle superfici, niente solidi geometrici perfetti), aspetto naturale da macrofotografia.
- Texture o colori dei vertici realistici e variati (terra, legno, seta), mai un colore piatto uniforme; metallicFactor 0 ovunque.
- Orientamento: alto verso +Y, appoggiato a y = 0, centrato in x = 0, z = 0. Unità: 1 = 10 cm.
- Massimo 4.000 triangoli per ogni stadio; pochi pezzi (massimo 6 per stadio).
- Fai 4 STADI DI CRESCITA dello stesso oggetto, come nodi separati chiamati stage_1, stage_2, stage_3, stage_4, affiancati lungo l'asse X a 0,6 unità di distanza (stage_1 = appena iniziato, stage_4 = completo).
- Alla fine mostrami 2 anteprime (tre quarti e dall'alto) su sfondo grigio, controlla che i 4 stadi siano diversi e credibili, correggi se serve, poi dammi il file .glb.

Oggetto: il CEPPO DEI COLEOTTERI: un piccolo pezzo di legno morto con la corteccia, scavato da gallerie sinuose (come quelle dei coleotteri della corteccia), fori d'uscita rotondi, rosura di legno chiara ammucchiata, e una pallina di terra rotolata accanto (come lo scarabeo). Lungo 0,4 unità a stadio 4. Stadio 1: un rametto con un solo foro. Stadio 2: il legno con due gallerie. Stadio 3: corteccia staccata che mostra la rete di gallerie. Stadio 4: ceppo pieno di gallerie, fori d'uscita, mucchietti di rosura e la pallina di terra.

Chiama il file ceppo_coleotteri.glb.
```
