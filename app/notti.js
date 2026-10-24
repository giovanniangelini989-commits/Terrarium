/* Notti vive e storia di Biscotto — il giocatore è il bambino (seconda persona) */
(function(){
const has=(v,id)=>v.sp.some(x=>x.id===id&&x.alive), hasP=(v,id)=>v.setup.piante.includes(id), soc=v=>v.sp.find(x=>x.alive&&x.society), mut=(v,m)=>v.sp.some(x=>x.alive&&(x.mut||[]).includes(m));
const NOTTI=[
 {id:'luna',ic:'🌕',w:2,c:v=>hasP(v,'muschio'),x:'C’è la luna piena. Dal vetro esce una luce verde: il muschio brilla da solo.'},
 {id:'temporale',ic:'⛈️',w:2,c:()=>true,x:'Fuori piove forte. Il vetro trema a ogni tuono e dentro si forma la condensa.',fx:A=>A.bumpNeeds({um:.15})},
 {id:'graffio',ic:'🔦',w:3,c:v=>has(v,'formiche'),x:'Senti un graffio leggero sul vetro. Accendi la torcia?',ch:[{l:'Accendi la torcia',o:'Una fila di formiche lavora al buio. Non si fermano neanche per te.',fx:A=>A.giveXP(10)},{l:'Lascia stare',o:'Torni a dormire. Il graffio continua, piano, fino all’alba.'}]},
 {id:'sogno',ic:'💤',w:2,c:()=>true,x:'Sogni il sasso che ti parla. Non capisci le parole, ma sai che ha fame di luce.',fx:A=>A.sim.charge(10)},
 {id:'nonna',ic:'✉️',w:2,c:(v,G)=>(G.ui.fase||0)>=4,x:'Sul comodino c’è un biglietto della nonna: «Domani ti porto una cosa per il tuo mondo».',fx:A=>A.pullArrival&&A.pullArrival()},
 {id:'lampi',ic:'⚡',w:2,c:v=>v.setup.oggetti.length>0,x:v=>'Il sasso fa tre lampi uno dopo l’altro, tutti verso '+v.__ogg+'.',fx:A=>A.sim.charge(15)},
 {id:'silenzio',ic:'🌫️',w:2,c:v=>v.vit<45&&v.sp.some(x=>x.alive),x:'Stanotte il vaso è silenzioso. Nessuno si muove, come se aspettassero qualcosa da te.'},
 {id:'sete',ic:'🥛',w:3,c:v=>v.needs.um<.5,x:'Ti svegli con la gola secca e pensi al vaso. Gli porti un goccio d’acqua?',ch:[{l:'Sì, un goccio',o:'Il muschio beve in silenzio. Torni a letto contento.',fx:A=>A.bumpNeeds({um:.2})},{l:'Domani',o:'Ti rigiri nel letto. Domani, promesso.'}]},
 {id:'lucciola',ic:'✨',w:2,c:v=>mut(v,'bioluminescenza')||!!soc(v),x:'Una lucciola si posa sul vetro, fuori. Dentro, qualcuno si gira a guardarla.'},
 {id:'canto',ic:'🎶',w:2,c:v=>!!soc(v),x:'Dal vaso arriva un ronzio regolare, quasi una canzone. Stanno celebrando qualcosa.'},
 {id:'ombra',ic:'✋',w:1,c:v=>v.sp.some(x=>x.alive),x:'Un’ombra grande passa sul vetro. Era solo la tua mano, ma dentro si sono nascosti tutti.'},
 {id:'finestra',ic:'🪟',w:1,c:()=>true,x:'Hai lasciato la finestra aperta: fa freddo, e il vaso si appanna. Il sasso rallenta.',fx:A=>{ A.bumpNeeds({um:.05}); A.sim.charge(-8); }},
 {id:'alba',ic:'🌅',w:2,c:v=>has(v,'formiche')&&hasP(v,'felce'),x:'All’alba vedi una formica sola in cima alla felce. Guarda verso la finestra, immobile.'},
 {id:'guerra',ic:'🥁',w:3,c:v=>v.wars.length>0,x:'Stanotte si sentono piccoli colpi secchi contro il vetro. La guerra non dorme.'},
 {id:'storia',ic:'📖',w:2,c:v=>!!soc(v),x:'Leggi una storia della buonanotte vicino al vaso. Ti sembra che ascoltino. Quale scegli?',ch:[{l:'Una storia di re',o:'Al mattino trovi le formiche in fila davanti al più grande di loro.',fx:A=>A.giveXP(8)},{l:'Una storia di stelle',o:'Al mattino tutte guardano il sasso, come se aspettassero che cadesse di nuovo.',fx:A=>{ A.giveXP(8); A.sim.charge(10); }}]},
 {id:'caldo',ic:'♨️',w:2,c:v=>v.E>60,x:'Tocchi il vetro sopra il sasso: è caldo, come una tazza appena riempita.'},
 {id:'mutante',ic:'🟢',w:3,c:v=>mut(v,'radioattivo'),x:'Qualcuno nel vaso brilla di verde nel buio. Prima non lo faceva.'},
 {id:'stella',ic:'🌠',w:1,c:()=>true,x:'Una stella cade fuori dalla finestra. Il sasso, dentro, batte una volta più forte.',fx:A=>A.sim.charge(20)},
 {id:'segni',ic:'✍️',w:2,c:v=>{ const s=soc(v); return !!s&&v.d-s.society.since>10; },x:'Sul muschio ci sono segni che sembrano lettere. Provi a copiarli nel quaderno, ma non li capisci.'},
 {id:'tela',ic:'🕸️',w:3,c:v=>has(v,'ragni')&&has(v,'mosche'),x:'Un ragno ha teso una tela tra la felce e il vetro. Ci sono già due mosche.'}];
const GATTO=[
 {t:'Lo sguardo',x:'Biscotto è salito sulla scrivania. Non si muove: fissa le formiche con gli occhi enormi.',ch:[{l:'Lo prendi e lo porti via',o:'Biscotto protesta, ma si lascia portare. Le formiche tornano al lavoro.',k:'calmo'},{l:'Lo lasci guardare',o:'Per un’ora intera Biscotto e le formiche si guardano. Nessuno sbatte le palpebre.',k:'curioso'}]},
 null,
 {t:'Il regalo',x:'Biscotto ti lascia un regalo sul cuscino: un coleottero vivo, un po’ stordito.',ch:[{l:'Lo metti nel vaso',o:'Il coleottero esplora il muschio. Biscotto ti guarda, fiero.',k:'regalo',fx:A=>{ const v=A.sim.view(); if(!v.setup.insetti.includes('coleotteri')) A.sim.addSpecies('coleotteri'); }},{l:'Lo riporti in giardino',o:'Lo liberi sotto il gelso. Biscotto non capisce, e se ne va offeso.',k:'calmo'}]},
 {t:'La notte di Biscotto',x:'Stanotte Biscotto dorme acciambellato contro il vaso. Il sasso batte più piano, come se lo sentisse.',ch:[{l:'Lo lasci lì',o:'Al mattino il vetro è caldo dove c’era lui. Il sasso è tranquillo.',k:'guardia',fx:A=>A.sim.charge(-20)},{l:'Lo porti nel tuo letto',o:'Dormite insieme. Il sasso, rimasto solo, batte più forte.',fx:A=>A.sim.charge(15)}]}];
function destino(f){ if((f.guardia||0)>=1&&(f.calmo||0)>=1) return {k:'guardiano',t:'Il guardiano',x:'Biscotto ha deciso: il vaso è suo da proteggere. Ora dorme sempre lì accanto, e nessuna zampa lo toccherà più.'};
  if((f.curioso||0)>=1&&(f.regalo||0)>=1) return {k:'amico',t:'L’amico con i baffi',x:'Le formiche hanno imparato la sua forma. Sul muschio c’è un mucchietto di terra con due orecchie a punta.'};
  return {k:'ladro',t:'Il ladro',x:'Una mattina manca qualcosa nel vaso. Lo ritrovi sotto il divano, insieme a tre tappi e un calzino.'}; }
window.__notti={NOTTI,GATTO,destino};
})();
