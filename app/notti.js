/* Notti vive e storia di Biscotto — il giocatore è il bambino (seconda persona) */
(function(){
const nd=(v,k,d)=>(v.needs&&v.needs[k]!=null)?v.needs[k]:d, ogg=(v,id)=>v.setup.oggetti.includes(id), giu=(A,k,q)=>{ const n=A.sim.view().needs, o={}; o[k]=Math.max(0,Math.min(1,n[k]+q)); A.sim.setNeeds(o); };
const has=(v,id)=>v.sp.some(x=>x.id===id&&x.alive), hasP=(v,id)=>v.setup.piante.includes(id), soc=v=>v.sp.find(x=>x.alive&&x.society), mut=(v,m)=>v.sp.some(x=>x.alive&&(x.mut||[]).includes(m));
const vr=(v,a)=>a[(((v&&v.d)||0)%a.length+a.length)%a.length];
const NOTTI=[
 {id:'luna',ic:'🌕',w:2,c:v=>hasP(v,'muschio'),x:'C’è la luna piena. Entra dal vetro e fa brillare il muschio bagnato, goccia per goccia.'},
 {id:'temporale',ic:'⛈️',w:2,c:()=>true,x:'Fuori piove forte. Il vetro trema a ogni tuono e dentro si forma la condensa.',fx:A=>A.bumpNeeds({um:.15})},
 {id:'graffio',ic:'🔦',w:3,c:v=>has(v,'formiche'),x:'Senti un graffio leggero sul vetro. Accendi la torcia?',ch:[{l:'Accendi la torcia',o:'Una fila di formiche lavora al buio. Non si fermano neanche per te.',fx:A=>A.giveXP(10)},{l:'Lascia stare',o:'Torni a dormire. Il graffio continua, piano, fino all’alba.'}]},
 {id:'sogno',ic:'💤',w:2,c:()=>true,x:'Sogni il sasso che ti parla. Non capisci le parole, ma sai che ha fame di luce.',fx:A=>A.sim.charge(10)},
 {id:'nonna',ic:'✉️',w:2,c:(v,G)=>(G.ui.fase||0)>=4,x:v=>vr(v,['Sul comodino c’è un biglietto della nonna: «Domani ti porto una cosa per il tuo mondo».','Un biglietto sotto la lampada, scritto in fretta: «Domani passo dal vaso, e ti lascio una sorpresa».','La nonna ha lasciato due righe sul cuscino: «Ho visto qualcosa che piacerà al tuo mondo. A domani».']),fx:A=>A.pullArrival&&A.pullArrival()},
 {id:'lampi',ic:'⚡',w:2,c:v=>v.setup.oggetti.length>0,x:v=>'Il sasso fa tre lampi uno dopo l’altro, tutti verso '+v.__ogg+'.',fx:A=>A.sim.charge(15)},
 {id:'silenzio',ic:'🌫️',w:2,c:v=>v.vit<45&&v.sp.some(x=>x.alive),x:'Stanotte il vaso è silenzioso. Nessuno si muove, come se aspettassero qualcosa da te.'},
 {id:'sete',ic:'🥛',w:3,c:v=>v.needs.um<.5,x:v=>vr(v,['Ti svegli con la gola secca e pensi al vaso. Gli porti un goccio d’acqua?','Bevi un bicchiere in cucina e ti viene in mente il vaso: avrà sete anche lui? Gli porti un goccio?','Nel buio senti il bisogno di bere, e subito pensi alla terra del vaso. Un goccio per lei?']),ch:[{l:'Sì, un goccio',o:'La terra beve in silenzio. Torni a letto col cuore leggero.',fx:A=>A.bumpNeeds({um:.2})},{l:'Domani',o:'Ti rigiri nel letto. Domani, promesso.'}]},
 {id:'lucciola',ic:'✨',w:2,c:v=>mut(v,'bioluminescenza')||!!soc(v),x:'Una lucciola si posa sul vetro, fuori. Dentro, qualcuno si gira a guardarla.'},
 {id:'canto',ic:'🎶',w:2,c:v=>!!soc(v),x:'Dal vaso arriva un ronzio regolare, quasi una canzone. Stanno celebrando qualcosa.'},
 {id:'ombra',ic:'✋',w:1,c:v=>v.sp.some(x=>x.alive),x:'Un’ombra grande passa sul vetro. Era solo la tua mano, ma dentro si sono nascosti tutti.'},
 {id:'finestra',ic:'🪟',w:1,c:()=>true,x:'Hai lasciato la finestra aperta. Il lato del vaso verso fuori si appanna per primo: il vetro è la cosa più fredda della stanza. Il sasso rallenta.',fx:A=>{ A.bumpNeeds({um:.05}); A.sim.charge(-8); }},
 {id:'alba',ic:'🌅',w:2,c:v=>has(v,'formiche')&&hasP(v,'felce'),x:'All’alba vedi una formica sola in cima alla felce. Guarda verso la finestra, immobile.'},
 {id:'guerra',ic:'🥁',w:3,c:v=>v.wars.length>0,x:'Stanotte si sentono piccoli colpi secchi contro il vetro. La guerra non dorme.'},
 {id:'storia',ic:'📖',w:2,c:v=>!!soc(v),x:'Leggi una storia della buonanotte vicino al vaso. Ti sembra che ascoltino. Quale scegli?',ch:[{l:'Una storia di re',o:'Al mattino c’è una fila ordinata davanti al più grande del popolo.',fx:A=>A.giveXP(8)},{l:'Una storia di stelle',o:'Al mattino il popolo intero guarda il sasso, come se aspettasse che cadesse di nuovo.',fx:A=>{ A.giveXP(8); A.sim.charge(10); }}]},
 {id:'caldo',ic:'♨️',w:2,c:v=>v.E>60,x:'Tocchi il vetro sopra il sasso: è caldo, come una tazza appena riempita.'},
 {id:'mutante',ic:'🟢',w:3,c:v=>mut(v,'radioattivo'),x:'Qualcuno nel vaso brilla di verde nel buio. Prima non lo faceva.'},
 {id:'stella',ic:'🌠',w:1,c:()=>true,x:'Una stella cade fuori dalla finestra. Il sasso, dentro, batte una volta più forte.',fx:A=>A.sim.charge(20)},
 {id:'segni',ic:'✍️',w:2,c:v=>{ const s=soc(v); return !!s&&v.d-s.society.since>10; },x:'Sul muschio ci sono segni che sembrano lettere. Provi a copiarli nel quaderno, ma non li capisci.'},
 {id:'tela',ic:'🕸️',w:3,c:v=>has(v,'ragni')&&has(v,'mosche'),x:'Un ragno ha teso una tela in un angolo del vetro. Ci sono già due mosche.'},
 // ---- microclima: la causa fisica è vera (docs/ecologia/studio.md)
 {id:'appannato',ic:'🌁',w:2,c:v=>nd(v,'um',0)>.55,x:'Stanotte fuori è più freddo che nel vaso. All’alba il vetro è bianco. L’acqua del velo torna giù, nella terra.',fx:A=>A.bumpNeeds({um:.04})},
 {id:'serra',ic:'🌡️',w:3,c:v=>v.setup.luce===2,x:'Stanotte il vetro è ancora tiepido. Il sole di ieri ha scaldato il barattolo chiuso come una serra: la terra si è asciugata.',fx:A=>{ A.bumpNeeds({um:-.08}); A.sim.charge(8); }},
 {id:'ristagno',ic:'💧',w:3,c:v=>nd(v,'um',0)>.88,x:'Con la torcia vedi acqua ferma tra i sassolini in fondo. Le radici lì sotto non respirano. Apri il tappo per la notte?',ch:[{l:'Apri il tappo',o:'Al mattino il vetro è asciutto in alto e la pozza è scesa. Le radici respirano di nuovo.',fx:A=>A.bumpNeeds({um:-.18})},{l:'Lascia chiuso',o:'L’acqua resta ferma. Al mattino il vaso sa di stagno, e il vetro è più sporco.',fx:A=>giu(A,'pul',-.1)}]},
 {id:'collemboli',ic:'🔬',w:3,c:v=>v.muffa>.3||nd(v,'pul',1)<.6,x:'Con la torcia vedi puntini bianchi che saltano sulla muffa. Sono collemboli, arrivati con la terra. La mangiano.',fx:A=>giu(A,'pul',.12)},
 {id:'pioggia',ic:'🌧️',w:2,c:v=>nd(v,'um',0)>.5&&v.setup.piante.length>0,x:'Stanotte piove, ma dentro il vaso: gocce scendono dal tappo sul muschio. Il barattolo chiuso si annaffia da solo.',fx:A=>A.bumpNeeds({um:.04})},
 {id:'peluria',ic:'🍂',w:3,c:v=>v.muffa>.5,x:'Sulla foglia morta c’è una peluria bianca. È muffa: nasce dove è umido, fermo e c’è qualcosa di marcio. La togli?',ch:[{l:'Con la pinzetta',o:'La foglia esce intera. Sotto, la terra è scura e pulita.',fx:A=>giu(A,'pul',.15)},{l:'La lasci',o:'Al mattino la peluria è arrivata alla foglia vicina.',fx:A=>giu(A,'pul',-.08)}]},
 {id:'muschiosecco',ic:'🌾',w:3,c:v=>hasP(v,'muschio')&&nd(v,'um',1)<.35,x:'Il muschio è grigio e croccante. Non è morto: si è chiuso per non perdere acqua. Lo spruzzi?',ch:[{l:'Lo spruzzi',o:'In un’ora si riapre, verde come prima. Sembra respirare.',fx:A=>A.bumpNeeds({um:.15})},{l:'Domani',o:'Il muschio resta grigio. Domani avrà ancora più sete.'}]},
 {id:'succulenta',ic:'🪴',w:3,c:v=>hasP(v,'succulenta')&&nd(v,'um',0)>.75,x:'La succulenta è molle alla base. Nell’aria chiusa e umida marcisce: lei vuole sole e aria. Lasci il tappo socchiuso?',ch:[{l:'Socchiudi il tappo',o:'Al mattino la base è più soda. L’aria del vaso è meno pesante.',fx:A=>A.bumpNeeds({um:-.12})},{l:'Lasci chiuso',o:'Al mattino una foglia della succulenta è caduta, trasparente.'}]},
 {id:'guscio',ic:'🐌',w:3,c:v=>has(v,'lumache')&&nd(v,'um',1)<.4,x:'Le lumache si sono chiuse nel guscio con un velo bianco. Non sono morte: aspettano l’acqua.',ch:[{l:'Un goccio d’acqua',o:'All’alba un corno esce dal guscio, poi l’altro. La lumaca riparte, lentissima.',fx:A=>A.bumpNeeds({um:.12})},{l:'Aspetti',o:'Restano sigillate. Il vaso è più silenzioso senza le loro scie.'}]},
 {id:'rugiada',ic:'💎',w:2,c:v=>has(v,'ragni')&&nd(v,'um',0)>.5,x:'All’alba la tela del ragno è piena di gocce: il vaso è umido. Brilla come una collana. Il ragno non si muove.'},
 // ---- creature e piante
 {id:'termiti',ic:'🪵',w:2,c:v=>has(v,'termiti'),x:'Senti un rosicchiare sottile. Le termiti scavano nel legno morto e lo fanno diventare terra buona.',fx:A=>A.bumpNeeds({ter:.08})},
 {id:'rovescio',ic:'🪲',w:3,c:v=>has(v,'coleotteri'),x:'Un coleottero si è rovesciato sul dorso. Agita le zampe nel buio. Lo aiuti?',ch:[{l:'Lo giri con uno stecchino',o:'Riparte come se niente fosse. Al mattino ha mangiato mezza foglia.',fx:A=>A.giveXP(8)},{l:'Guardi',o:'Dopo un po’ si aggrappa al muschio e si gira da solo. Ha imparato qualcosa.',fx:A=>A.giveXP(4)}]},
 {id:'mosche',ic:'🪰',w:2,c:v=>has(v,'mosche'),x:'Le mosche dormono tutte sul lato del vetro ancora tiepido. Al buio cercano il caldo.'},
 {id:'funghi',ic:'🍄',w:2,c:v=>hasP(v,'fungo'),x:'Al buio i funghi hanno spinto su un cappello nuovo. Stamattina la terra intorno è soffice.',fx:A=>A.bumpNeeds({ter:.06})},
 {id:'scatto',ic:'🌿',w:3,c:v=>hasP(v,'carnivora')&&has(v,'mosche'),x:'Senti un piccolo scatto nel buio. Al mattino la pianta carnivora ha una foglia chiusa. Le mosche sono una di meno.'},
 {id:'masticare',ic:'👂',w:3,c:v=>mut(v,'gigantismo'),x:'Stanotte si sente masticare. Qualcuno nel vaso è diventato troppo grande per dormire a stomaco vuoto.',fx:A=>A.bumpNeeds({ter:-.06})},
 {id:'luna-nuova',ic:'🌑',w:2,c:v=>v.E<30,x:'Notte senza luna. Il sasso è così quieto che per un momento pensi si sia fermato. Lo tocchi?',ch:[{l:'Lo tocchi col dito',o:'Il vetro è freddo. Poi, sotto il dito, un battito. Uno solo.',fx:A=>A.sim.charge(10)},{l:'Lo lasci riposare',o:'Al mattino batte di nuovo, piano, come chi si sveglia senza fretta.'}]},
 // ---- il popolo e te (prepara «La Fede», DECISIONI §2)
 {id:'scultori',ic:'🗿',w:3,c:v=>!!soc(v)&&ogg(v,'statuina'),x:'Con la torcia vedi il popolo intorno alla statuina. Ne grattano la faccia, piano. Somiglia sempre di più alla tua.',fx:A=>A.giveXP(10)},
 {id:'guancia',ic:'😴',w:2,c:v=>!!soc(v),x:'Ti addormenti con la guancia contro il vetro. Al mattino, dove c’era la tua faccia, c’è un cerchio di sassolini.',fx:A=>A.giveXP(6)}];
const GATTO=[
 {t:'Lo sguardo',x:'Biscotto è salito sulla scrivania. Non si muove: fissa il vaso con gli occhi enormi.',ch:[{l:'Lo prendi e lo porti via',o:'Biscotto protesta, ma si lascia portare. Nel vaso, piano, tutto ricomincia a muoversi.',k:'calmo'},{l:'Lo lasci guardare',o:'Per un’ora intera Biscotto e il vaso si guardano. Nessuno sbatte le palpebre.',k:'curioso'}]},
 null,
 {t:'Il regalo',x:'Biscotto ti lascia un regalo sul cuscino: un coleottero vivo, un po’ stordito.',ch:[{l:'Lo metti nel vaso',o:'Il coleottero esplora il vaso. Biscotto ti guarda, fiero.',k:'regalo',fx:A=>{ const v=A.sim.view(); if(!v.setup.insetti.includes('coleotteri')) A.sim.addSpecies('coleotteri'); }},{l:'Lo riporti in giardino',o:'Lo liberi sotto il gelso. Biscotto non capisce, e se ne va offeso.',k:'calmo'}]},
 {t:'La notte di Biscotto',x:'Stanotte Biscotto dorme acciambellato contro il vaso. Il sasso batte più piano, come se lo sentisse.',ch:[{l:'Lo lasci lì',o:'Al mattino il vetro è caldo dove c’era lui. Il sasso è tranquillo.',k:'guardia',fx:A=>A.sim.charge(-20)},{l:'Lo porti nel tuo letto',o:'Dormite insieme. Il sasso, rimasto solo, batte più forte.',fx:A=>A.sim.charge(15)}]}];
function destino(f){ if((f.guardia||0)>=1&&(f.calmo||0)>=1) return {k:'guardiano',t:'Il guardiano',x:'Biscotto ha deciso: il vaso è suo da proteggere. Ora dorme sempre lì accanto, e nessuna zampa lo toccherà più.'};
  if((f.curioso||0)>=1&&(f.regalo||0)>=1) return {k:'amico',t:'L’amico con i baffi',x:'Nel vaso hanno imparato la sua forma. Sul fondo c’è un mucchietto di terra con due orecchie a punta.'};
  return {k:'ladro',t:'Il ladro',x:'Una mattina manca qualcosa nel vaso. Lo ritrovi sotto il divano, insieme a tre tappi e un calzino.'}; }
window.__notti={NOTTI,GATTO,destino};
})();
