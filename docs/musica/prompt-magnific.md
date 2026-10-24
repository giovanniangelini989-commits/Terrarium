# Prompt Magnific per Terrario
Tema (da `scheda-sonora.md`): **Mi4 Sol4 La4 · Si4 La4 Sol4 · Mi4 Re4 Do4**, Do maggiore, 72 BPM, 3/4. Cellula breve: Mi4 Sol4 La4.
Modelli: musica lunga = `google-lyria-3-pro` (30-180 s), cicli da 30 s = `google-lyria-3` (fisso 30 s); stinger ed effetti = `audio_sfx_generate` (1-30 s, max 450 caratteri, 5 crediti al secondo). Le stesse regole musicali valgono per tutto: strumenti piccoli e acustici, nessuna voce.

# A. Musica

## tema-principale
- **Uso nel gioco:** titolo, primo avvio, riferimento di tutta la colonna sonora
- **Durata:** 45 s  |  **Loop:** no  |  **BPM:** 72  |  **Tonalità:** Do maggiore
- **Strumenti:** celesta, carillon, chitarra classica
- **Legame col tema:** il tema intero, due volte, la seconda con arpeggio
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Solo celesta and music box carry the melody, then a gently fingerpicked nylon guitar joins with a slow C - F - C arpeggio. Tempo 72 BPM, C major. Like a lullaby heard from inside a glass jar on a desk at night. Plays the theme twice, the second time softer, ending on a held C that fades naturally. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## giorno-loop
- **Uso nel gioco:** musica del vaso di giorno
- **Durata:** 30 s  |  **Loop:** sì, ciclo 30 s  |  **BPM:** 72  |  **Tonalità:** Do maggiore
- **Strumenti:** celesta, chitarra classica, vibrafono
- **Legame col tema:** tema intero, luminoso
- **Strumento Magnific:** audio_music_generate, model google-lyria-3
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Bright, slow, sunlit morning music for a tiny miniature world. Celesta plays the melody, nylon guitar fingerpicks C - F - C - G, soft vibraphone adds sparse warm notes. 72 BPM, C major, seamless loop, the ending flows back into the beginning with no pause, constant gentle volume. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## notte-loop
- **Uso nel gioco:** musica del vaso di notte
- **Durata:** 30 s  |  **Loop:** sì, ciclo 30 s  |  **BPM:** 54  |  **Tonalità:** Do lidio (Fa diesis)
- **Strumenti:** carillon, armonica a bicchieri, archi in sordina
- **Legame col tema:** tema frammentato, una nota ogni tanto
- **Strumento Magnific:** audio_music_generate, model google-lyria-3
- **Prompt:**

> Very sparse night music. Music box plays only fragments of a simple rising theme (E4 G4 A4, B4 A4 G4) with long silences. Under it, muted strings and glass harmonica hold a suspended, unresolved chord (C, D, G, F sharp) that never resolves, with a faint violet mystery. 54 BPM, C lydian, seamless loop, dreamy and quiet, like a small jar glowing under a desk lamp at midnight. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## letargo-loop
- **Uso nel gioco:** il vaso dorme quando non giochi
- **Durata:** 30 s  |  **Loop:** sì, ciclo 30 s  |  **BPM:** 36  |  **Tonalità:** Do maggiore
- **Strumenti:** pianoforte felpato
- **Legame col tema:** solo la cellula Mi-Sol-La, rallentata
- **Strumento Magnific:** audio_music_generate, model google-lyria-3
- **Prompt:**

> Almost still. Solo felted upright piano, extremely slow, playing only three notes E4 G4 A4, each ringing a long time, then silence, then again, with very soft room tone. 36 BPM, C major, sleeping, breathing, hibernation. Seamless loop, no build, no change in volume. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## menu-quaderno-loop
- **Uso nel gioco:** menu e apertura del quaderno
- **Durata:** 30 s  |  **Loop:** sì, ciclo 30 s  |  **BPM:** 60  |  **Tonalità:** Do maggiore
- **Strumenti:** chitarra classica, carillon
- **Legame col tema:** tema accennato, leggerissimo
- **Strumento Magnific:** audio_music_generate, model google-lyria-3
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Very light background loop for a notebook screen. Fingerpicked nylon guitar with a few music box notes hinting at the theme, 60 BPM, C major, calm, like turning pages at a desk. Seamless loop, quiet, never demanding attention. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

# B. Stinger (2-6 s, tutti dalla cellula Mi4 Sol4 La4)

## stinger-risveglio
- **Uso nel gioco:** il vaso si risveglia dal letargo
- **Durata:** 5 s  |  **Loop:** no  |  **BPM:** 72  |  **Tonalità:** Do maggiore
- **Strumenti:** carillon, celesta, chitarra
- **Legame col tema:** la cellula lenta che riparte e diventa il tema
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 5
- **Prompt:**

> Short musical phrase: a lone music box plays E G A very slowly, then speeds up into a warm celesta and nylon guitar phrase E G A B A G, waking up gently, C major, 72 BPM, ends resolved on C with a soft ring.

## stinger-arrivo
- **Uso nel gioco:** arriva una nuova specie (livello medio)
- **Durata:** 4 s  |  **Loop:** no  |  **BPM:** 80  |  **Tonalità:** Do maggiore
- **Strumenti:** celesta
- **Legame col tema:** cellula in alto
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 4
- **Prompt:**

> Short bright celesta phrase, three notes E5 G5 A5 rising, then a soft shimmering tail, a small moment of arrival, C major, sparkling but gentle, close mic.

## stinger-mutazione
- **Uso nel gioco:** una specie muta (verde)
- **Durata:** 4 s  |  **Loop:** no  |  **BPM:** 80  |  **Tonalità:** Do lidio
- **Strumenti:** vibrafono, vetro
- **Legame col tema:** cellula con Fa diesis
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 4
- **Prompt:**

> Short musical stinger: vibraphone plays E G A with a surprising F sharp twist, then a glassy rising glissando on glass harmonica, fresh and bright, a little strange, mint-green feeling, resolves softly.

## stinger-popolo-fondato
- **Uso nel gioco:** nasce un popolo (livello grande)
- **Durata:** 6 s  |  **Loop:** no  |  **BPM:** 72  |  **Tonalità:** Do maggiore
- **Strumenti:** celesta, clarinetto, chitarra, archi
- **Legame col tema:** tema intero compresso
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 6
- **Prompt:**

> Short warm musical stinger: the theme E G A B A G E D C played by celesta and clarinet over soft nylon guitar and muted strings, warm and hopeful, a small community is born, C major, 72 BPM, ends on a full gentle chord with a long soft ring.

## stinger-guerra
- **Uso nel gioco:** scoppia la guerra
- **Durata:** 4 s  |  **Loop:** no  |  **BPM:** 90  |  **Tonalità:** Do minore
- **Strumenti:** legno, violoncello in sordina, pianoforte
- **Legame col tema:** cellula in minore Mi-Sol-La bemolle
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 4
- **Prompt:**

> Short tense musical stinger: dry wooden knocks, a muted cello low note and felted piano playing E G A flat in minor, small and dry, not epic, unsettling silence after it.

## stinger-pace
- **Uso nel gioco:** la moneta tra due popoli
- **Durata:** 5 s  |  **Loop:** no  |  **BPM:** 66  |  **Tonalità:** Sol maggiore
- **Strumenti:** chitarra, clarinetto
- **Legame col tema:** cellula che si apre in maggiore
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 5
- **Prompt:**

> Short gentle musical stinger: a nylon guitar and a clarinet answer each other with the phrase E G A, then play it together in unison, major key, relief after tension, warm and quiet, ends in a soft chord.

## stinger-biscotto
- **Uso nel gioco:** Biscotto compare
- **Durata:** 3 s  |  **Loop:** no  |  **BPM:** 100  |  **Tonalità:** Do maggiore
- **Strumenti:** pianoforte giocattolo, pizzicato
- **Legame col tema:** cellula saltellante
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 3
- **Prompt:**

> Very short playful stinger: toy piano and pizzicato strings play a bouncing E G A with a cheeky little skip, cute and curious, light, like a small pet jumping up on a table.

# C. Finali (15 brani, 40 s, no loop, tutti sul tema)

## finale-equilibrio
- **Uso nel gioco:** schermata finale «L’Equilibrio»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 68  |  **Tonalità:** Do maggiore
- **Strumenti:** celesta, chitarra
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'L’Equilibrio': serene full statement of the theme, balanced and calm, like breathing. Instruments: celesta, chitarra. Key Do maggiore, 68 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-spento
- **Uso nel gioco:** schermata finale «Il Vaso Spento»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 50  |  **Tonalità:** La minore
- **Strumenti:** pianoforte felpato
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'Il Vaso Spento': empty and quiet, the theme only half remembered in A minor, long silences, moss and silence. Instruments: pianoforte felpato. Key La minore, 50 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-gigante
- **Uso nel gioco:** schermata finale «Il Gigante»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 58  |  **Tonalità:** Re minore
- **Strumenti:** pianoforte felpato grave, marimba bassa, violoncello in sordina
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'Il Gigante': the theme in the low register, slow heavy footsteps, big but not epic, no brass. Instruments: pianoforte felpato grave, marimba bassa, violoncello in sordina. Key Re minore, 58 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-tribu
- **Uso nel gioco:** schermata finale «La Tribù»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 90  |  **Tonalità:** Sol maggiore
- **Strumenti:** tongue drum, kalimba, legni
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'La Tribù': small survival, hand percussion on wood, the theme played on kalimba. Instruments: tongue drum, kalimba, legni. Key Sol maggiore, 90 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-fede
- **Uso nel gioco:** schermata finale «La Fede»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 60  |  **Tonalità:** Mi maggiore
- **Strumenti:** armonica a bicchieri, archi in sordina
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'La Fede': hushed reverence, glass harmonica, the theme like a quiet hymn without voices. Instruments: armonica a bicchieri, archi in sordina. Key Mi maggiore, 60 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-accademia
- **Uso nel gioco:** schermata finale «L’Accademia»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 84  |  **Tonalità:** Fa maggiore
- **Strumenti:** pizzicato, celesta, woodblock
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'L’Accademia': curious, clockwork ticking on woodblock, pizzicato strings, the theme as a study exercise. Instruments: pizzicato, celesta, woodblock. Key Fa maggiore, 84 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-mercato
- **Uso nel gioco:** schermata finale «Il Mercato»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 100  |  **Tonalità:** Re maggiore
- **Strumenti:** kalimba, chitarra, glockenspiel
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'Il Mercato': light bargaining, plucked and coin-like bright notes, a busy little bazaar. Instruments: kalimba, chitarra, glockenspiel. Key Re maggiore, 100 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-carnevale
- **Uso nel gioco:** schermata finale «Il Carnevale»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 108  |  **Tonalità:** Sol maggiore
- **Strumenti:** pianoforte giocattolo, carillon, glockenspiel
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'Il Carnevale': playful waltz, toy piano and music box, festival of tiny toys, the theme dancing. Instruments: pianoforte giocattolo, carillon, glockenspiel. Key Sol maggiore, 108 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-mistero
- **Uso nel gioco:** schermata finale «Il Mistero»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 56  |  **Tonalità:** Mi minore
- **Strumenti:** vibrafono con archetto, carillon
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'Il Mistero': mirror image: the theme played upside-down, bowed vibraphone, reversed shimmer, mysterious. Instruments: vibrafono con archetto, carillon. Key Mi minore, 56 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-voci
- **Uso nel gioco:** schermata finale «Le Voci»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 62  |  **Tonalità:** Re dorico
- **Strumenti:** clarinetto, flauto, pianoforte
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'Le Voci': two instruments calling and answering from far away, distant echo, the theme as a message. Instruments: clarinetto, flauto, pianoforte. Key Re dorico, 62 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-fiamma
- **Uso nel gioco:** schermata finale «La Fiamma»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 60  |  **Tonalità:** Fa lidio
- **Strumenti:** chitarra classica solista, violoncello
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'La Fiamma': warm solo nylon guitar, a small candle flame, cozy, faint soft crackle, the theme glowing. Instruments: chitarra classica solista, violoncello. Key Fa lidio, 60 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-giardinieri
- **Uso nel gioco:** schermata finale «I Giardinieri»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 76  |  **Tonalità:** Do maggiore
- **Strumenti:** kalimba, marimba morbida, pizzicato
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'I Giardinieri': organic growth, slowly layering plucked notes like sprouting plants, earthy and patient. Instruments: kalimba, marimba morbida, pizzicato. Key Do maggiore, 76 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-scisma
- **Uso nel gioco:** schermata finale «Lo Scisma»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 72  |  **Tonalità:** Do e Fa diesis insieme
- **Strumenti:** pianoforte felpato, vibrafono
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'Lo Scisma': two instruments playing the theme in two clashing keys, C and F sharp, slowly converging at the end. Instruments: pianoforte felpato, vibrafono. Key Do e Fa diesis insieme, 72 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-conquista
- **Uso nel gioco:** schermata finale «La Conquista»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 84  |  **Tonalità:** Re minore
- **Strumenti:** pianoforte felpato, archi bassi in sordina, spazzole su legno
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'La Conquista': dry and tense, small war, brushes on wood, not epic, the theme in a hard minor. Instruments: pianoforte felpato, archi bassi in sordina, spazzole su legno. Key Re minore, 84 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

## finale-patto
- **Uso nel gioco:** schermata finale «Il Patto»
- **Durata:** 40 s  |  **Loop:** no  |  **BPM:** 66  |  **Tonalità:** Sol maggiore
- **Strumenti:** due chitarre, clarinetto
- **Legame col tema:** sempre riconoscibile Mi-Sol-La
- **Strumento Magnific:** audio_music_generate, model google-lyria-3-pro
- **Prompt:**

> Theme (the signature of the jar): notes E4 G4 A4, B4 A4 G4, E4 D4 C4, in 3/4, a rising two-step phrase that settles on C. Ending music for a miniature world, called 'Il Patto': a dialogue between two guitars and a clarinet that end up playing the theme in unison, trust. Instruments: due chitarre, clarinetto. Key Sol maggiore, 66 BPM. Builds from a quiet start to one clear statement of the theme in the middle, then a slow fade-out ending at about 40 seconds. Intimate close-mic acoustic recording in a quiet room, soft and warm, lots of space between notes, no vocals, no lyrics, no drums, no epic orchestra, no electronic sounds.

# D. Effetti sonori (audio_sfx_generate)

## fx-tocco-vetro
- **Uso nel gioco:** tocco su un pulsante o sul vetro (livello piccolo)
- **Durata:** 1 s  |  **Loop:** no  |  **BPM:** -  |  **Tonalità:** -
- **Strumenti:** suono reale in presa ravvicinata
- **Legame col tema:** nessuno, solo materia
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 1
- **Prompt:**

> Single soft fingertip tap on thick glass jar, tiny clear tick, close mic, quiet, no echo, dry.

## fx-bagna
- **Uso nel gioco:** cura: bagnare
- **Durata:** 3 s  |  **Loop:** no  |  **BPM:** -  |  **Tonalità:** -
- **Strumenti:** suono reale in presa ravvicinata
- **Legame col tema:** nessuno, solo materia
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 3
- **Prompt:**

> Small spray of water droplets falling onto soil and moss inside a glass jar, gentle, close mic, soft, with a tiny glassy resonance.

## fx-terra
- **Uso nel gioco:** cura: aggiungere terra
- **Durata:** 2 s  |  **Loop:** no  |  **BPM:** -  |  **Tonalità:** -
- **Strumenti:** suono reale in presa ravvicinata
- **Legame col tema:** nessuno, solo materia
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 2
- **Prompt:**

> A handful of dry soft earth poured into a glass jar, gentle crumbly pour, close mic, quiet.

## fx-pulisci
- **Uso nel gioco:** cura: pulire
- **Durata:** 2 s  |  **Loop:** no  |  **BPM:** -  |  **Tonalità:** -
- **Strumenti:** suono reale in presa ravvicinata
- **Legame col tema:** nessuno, solo materia
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 2
- **Prompt:**

> Soft cloth wiping a glass surface, one gentle squeaky swipe, close mic, quiet.

## fx-notifica
- **Uso nel gioco:** notifica a destra
- **Durata:** 2 s  |  **Loop:** no  |  **BPM:** -  |  **Tonalità:** Do maggiore
- **Strumenti:** suono reale in presa ravvicinata
- **Legame col tema:** usa Mi-Sol-La
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 2
- **Prompt:**

> Two soft celesta notes, E and G, rising, tiny bell-like notification, gentle, short, dry.

## fx-apri-quaderno
- **Uso nel gioco:** maniglia del quaderno
- **Durata:** 2 s  |  **Loop:** no  |  **BPM:** -  |  **Tonalità:** -
- **Strumenti:** suono reale in presa ravvicinata
- **Legame col tema:** nessuno, solo materia
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 2
- **Prompt:**

> Old paper notebook cover opening, soft leather and cardboard creak, close mic, quiet desk.

## fx-carta
- **Uso nel gioco:** voltare una pagina
- **Durata:** 2 s  |  **Loop:** no  |  **BPM:** -  |  **Tonalità:** -
- **Strumenti:** suono reale in presa ravvicinata
- **Legame col tema:** nessuno, solo materia
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 2
- **Prompt:**

> A single paper page turning, light airy rustle, close mic, quiet room.

## fx-livello
- **Uso nel gioco:** sale di livello (livello medio)
- **Durata:** 3 s  |  **Loop:** no  |  **BPM:** -  |  **Tonalità:** Do maggiore
- **Strumenti:** suono reale in presa ravvicinata
- **Legame col tema:** usa Mi-Sol-La
- **Strumento Magnific:** audio_sfx_generate, durationSeconds 3
- **Prompt:**

> Short sparkling arpeggio on celesta and glass, E G A B, bright but soft, a small reward, gentle tail.

# Stima del costo (mcp__Magnific__simulate_cost, valori esatti sui preventivi di prova)

Prove fatte: lyria-3 30 s = 80 crediti; lyria-3-pro 30 s e 45 s = 160 crediti; sfx 1 s = 5, 2 s = 10, 5 s = 25 (5 crediti al secondo). I 15 finali da 40 s sono stimati a 160 (stesso prezzo di 30 s e 45 s).

| Gruppo | Pezzi | Crediti |
|---|---|---|
| Tema principale (lyria-3-pro) | 1 | 160 |
| Giorno, notte, letargo, menu (lyria-3) | 4 | 320 |
| Finali (lyria-3-pro) | 15 | 2400 |
| Stinger (31 s totali di sfx) | 7 | 155 |
| Effetti (17 s totali di sfx) | 8 | 85 |
| **Totale (una generazione per pezzo)** | **35** | **3120** |

Se si vuole scegliere tra due varianti per ogni pezzo, il totale raddoppia. Se bastano i finali principali, i soli 15 finali pesano il 77 percento della spesa.
