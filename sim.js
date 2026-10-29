(function(root){
'use strict';
function rng(seed){ let s=(seed>>>0)||1; const f=()=>{ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; f.get=()=>s; f.set=v=>{ s=v>>>0; }; return f; }
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const f1=v=>(Math.round(v*10)/10).toString().replace('.',',');
const f2=v=>(Math.round(v*100)/100).toString().replace('.',',');

// ============ DATI ============
const LUCE=[{nome:'Ombra',s:.25},{nome:'Mezza luce',s:.6},{nome:'Vicino al sole',s:1}];
const ACQUA=[{nome:'Poca',w:.2},{nome:'Media',w:.55},{nome:'Tanta',w:.9}];
const METEO=[{nome:'Piccolo',g:.7},{nome:'Medio',g:1},{nome:'Grande',g:1.4}];

const PIANTE={
 muschio:{nome:'Muschio',icon:'🌿',opt:{l:.45,w:.7},rad:.2,foglie:.45,rot:0,nota:'Ama l’umido; resiste alla radiazione.'},
 felce:{nome:'Felce',icon:'🍃',opt:{l:.55,w:.6},rad:.7,foglie:.5,rot:0,nota:'Poco appetibile per gli erbivori (difese chimiche); soffre la radiazione.'},
 succulenta:{nome:'Succulenta',icon:'🌵',opt:{l:.95,w:.25},rad:.5,foglie:.8,rot:0,nota:'Vuole sole e poca acqua.'},
 fungo:{nome:'Funghi',icon:'🍄',opt:{l:.3,w:.8},rad:-.7,foglie:0,rot:1.2,nota:'Nutre chi mangia il marcio. Si nutre di radiazione.'},
 carnivora:{nome:'Pianta carnivora',icon:'🪴',opt:{l:.75,w:.65},rad:.6,foglie:.3,rot:0,pred:true,nota:'Cattura le mosche.'},
};
const SPECIE={
 formiche:{nome:'Formiche',icon:'🐜',g:0,dieta:'onnivora',sociale:true,size:1,rep:1,agg:.45,int:.7,tol:{l:.7,w:.4,r:.7},aff:{radioattivo:2.2,intelligenza:2,gigantismo:.8,corazza:.7,velenoso:.4,iperfertilita:1,bioluminescenza:.6},nota:'Sociali e adattabili: le più portate a farsi una società.'},
 termiti:{nome:'Termiti',icon:'🐛',g:0,dieta:'marcio',sociale:true,size:.9,rep:.9,agg:.35,int:.68,tol:{l:.25,w:.7,r:.5},aff:{intelligenza:2,corazza:1.3,radioattivo:1.2,gigantismo:.8,iperfertilita:1,bioluminescenza:.8,velenoso:.3},nota:'Sociali; vivono di marcio e amano il buio umido.'},
 mosche:{nome:'Mosche',icon:'🪰',g:0,dieta:'marcio',sociale:false,size:.5,rep:1.8,agg:.1,int:.1,tol:{l:.55,w:.6,r:.32},aff:{gigantismo:2.1,iperfertilita:1.5,radioattivo:1,bioluminescenza:.5,corazza:.4},nota:'Si riproducono in fretta; mutano in giganti.'},
 coleotteri:{nome:'Coleotteri',icon:'🪲',g:1,dieta:'foglie',sociale:false,size:1.2,rep:.6,agg:.3,int:.3,tol:{l:.5,w:.5,r:.65},aff:{corazza:2.5,gigantismo:1.6,radioattivo:1,velenoso:.6,iperfertilita:.8},nota:'Corazzati; mangiano foglie.'},
 ragni:{nome:'Ragni',icon:'🕷️',g:1,dieta:'insetti',sociale:false,size:1.1,rep:.5,agg:.9,int:.4,tol:{l:.45,w:.4,r:.5},aff:{velenoso:2.5,gigantismo:1.9,radioattivo:1,intelligenza:.5,corazza:.6},nota:'Predatori: tengono a bada gli altri, o li divorano.'},
 lumache:{nome:'Lumache',icon:'🐌',g:0,dieta:'misto',sociale:false,size:1.3,rep:.5,agg:.05,int:.1,tol:{l:.3,w:.85,r:.3},aff:{corazza:2.2,gigantismo:1.6,bioluminescenza:1.2,radioattivo:.8},nota:'Lente e pacifiche; adorano l’acqua.'},
};
const OGGETTI={
 statuina:{nome:'Statuina',icon:'🗿',memi:{sacro:1},txt:n=>`${n} hanno trovato la statuina: per loro è una divinità.`},
 orologio:{nome:'Orologio',icon:'⏰',memi:{sapere:.95},txt:n=>`Il ticchettio dell’orologio diventa per ${n} la misura di ogni cosa: nasce la scienza.`},
 giocattolo:{nome:'Giocattolo',icon:'🧸',memi:{gioco:1},txt:n=>`${n} fanno del giocattolo il centro delle loro feste.`},
 specchio:{nome:'Specchio',icon:'🪞',memi:{mistero:.8,sapere:.2},luce:.12,txt:n=>`${n} vedono un’altra colonia nello specchio e ne fanno un mistero.`},
 libro:{nome:'Libro',icon:'📖',memi:{sapere:1},txt:n=>`${n} imparano a «leggere» il libro: la conoscenza diventa sacra e utile.`},
 moneta:{nome:'Moneta',icon:'🪙',memi:{commercio:1},txt:n=>`${n} scambiano frammenti della moneta: nasce il commercio.`},
 radio:{nome:'Radio',icon:'📻',memi:{comunicazione:1,mistero:.3},txt:n=>`${n} ascoltano la radio: un coro lontano che chiamano «le Voci».`},
 candela:{nome:'Candela',icon:'🕯️',memi:{fuoco:1,sacro:.4},txt:n=>`${n} custodiscono la fiamma come un fuoco sacro.`},
};
const MUT={
 gigantismo:{nome:'Gigantismo',agg:['giganti','giganti'],txt:n=>`${n} diventano giganti.`,fx:'Dimensioni ×1,8, più aggressive, ma servono più risorse.'},
 radioattivo:{nome:'Radiotolleranza',agg:['radiotolleranti','radiotolleranti'],txt:n=>`${n} si abituano alla radiazione del sasso e la reggono meglio.`,fx:'Reggono molta più radiazione, ma si riproducono un po’ più piano.'},
 intelligenza:{nome:'Intelligenza',agg:['ingegnose','ingegnosi'],txt:n=>`${n} sviluppano un’intelligenza insolita.`,fx:'+0,25 di intelligenza (più vicine a una società), ma un cervello costa: si riproducono un po’ più piano.'},
 corazza:{nome:'Corazza',agg:['corazzate','corazzati'],txt:n=>`${n} sviluppano una corazza spessa.`,fx:'Molto più difficili da predare, ma la corazza costa energia: si riproducono più piano.'},
 velenoso:{nome:'Veleno',agg:['velenose','velenosi'],txt:n=>`${n} producono un veleno potente.`,fx:'I predatori le evitano, ma il veleno costa: si riproducono un po’ più piano.'},
 iperfertilita:{nome:'Iperfertilità',agg:['prolifiche','prolifici'],txt:n=>`${n} si moltiplicano a ritmo vertiginoso.`,fx:'Si riproducono il 50% più in fretta, ma i piccoli sono più fragili e si fanno predare di più.'},
 bioluminescenza:{nome:'Bioluminescenza',agg:['luminose','luminosi'],txt:n=>`${n} cominciano a brillare nel buio.`,fx:'Brillano; attirano i predatori.'},
};
const CULT={
 sacro:{nome:'Teocrazia',agg:['teocratiche','teocratici']},
 sapere:{nome:'Società scientifica',agg:['scientifiche','scientifici']},
 commercio:{nome:'Società mercantile',agg:['mercantili','mercantili']},
 gioco:{nome:'Società festaiola',agg:['festaiole','festaioli']},
 mistero:{nome:'Società esoterica',agg:['esoteriche','esoterici']},
 comunicazione:{nome:'Ascoltatori del cielo',agg:['in ascolto','in ascolto']},
 fuoco:{nome:'Custodi del fuoco',agg:['devote alla fiamma','devoti alla fiamma']},
 agricoltura:{nome:'Società agricola',agg:['agricole','agricoli']},
 guerra:{nome:'Società militarista',agg:['militariste','militaristi']},
 tribale:{nome:'Società tribale',agg:['tribali','tribali']},
};
const overlap=(a,b)=>{ if(a.dieta===b.dieta) return a.dieta==='insetti'?0:1; const mix=['misto','onnivora']; if(mix.includes(a.dieta)||mix.includes(b.dieta)) return (a.dieta==='insetti'||b.dieta==='insetti')?0:.3; return 0; };

const RITMO=4; // giorni del vaso per ogni giorno reale
const FINALI={
 equilibrio:{nome:'L’Equilibrio',fam:'Quiete',icon:'🌿',txt:'Il vaso trova pace. Nessuna società, nessuna crisi: un mondo piccolo che respira.',hint:'Pochi elementi, luce media, niente di speciale da scoprire.'},
 spento:{nome:'Il Vaso Spento',fam:'Quiete',icon:'🫙',txt:'La vita animale si spegne. Restano il muschio e il silenzio.',hint:'Il sole troppo vicino, o un’acqua sbagliata per chi hai scelto.'},
 gigante:{nome:'Il Gigante',fam:'Mostri',icon:'👹',txt:'Una sola specie cresce oltre misura e domina il vaso.',hint:'Un animale solitario, molta radiazione e cibo in abbondanza.'},
 tribu:{nome:'La Tribù',fam:'Società',icon:'🏕️',txt:'Una società senza nulla da venerare né studiare: sopravvive, e basta.',hint:'Un insetto sociale e nessun oggetto.'},
 fede:{nome:'La Fede',fam:'Società',icon:'🗿',txt:'Hanno trovato qualcosa da venerare, e ne hanno fatto un mondo.',hint:'Un insetto sociale e una statuina.'},
 accademia:{nome:'L’Accademia',fam:'Società',icon:'⏰',txt:'Misurano il tempo, leggono, imparano: nasce la scienza.',hint:'Un insetto sociale con un orologio o un libro.'},
 mercato:{nome:'Il Mercato',fam:'Società',icon:'🪙',txt:'Scoprono lo scambio e costruiscono un mondo di baratti.',hint:'Un insetto sociale e una moneta.'},
 carnevale:{nome:'Il Carnevale',fam:'Società',icon:'🧸',txt:'Fanno del gioco il centro di tutto: feste, giochi, rituali.',hint:'Un insetto sociale e un giocattolo.'},
 mistero:{nome:'Il Mistero',fam:'Società',icon:'🪞',txt:'Vedono un’altra colonia nello specchio e non smettono di interrogarla.',hint:'Un insetto sociale e uno specchio.'},
 voci:{nome:'Le Voci',fam:'Società',icon:'📻',txt:'Ascoltano un coro lontano e passano le notti a rispondere.',hint:'Un insetto sociale e una radio.'},
 fiamma:{nome:'La Fiamma',fam:'Società',icon:'🕯️',txt:'Custodiscono un fuoco che non si spegne mai.',hint:'Un insetto sociale e una candela.'},
 giardinieri:{nome:'I Giardinieri',fam:'Società',icon:'🍄',txt:'Coltivano i funghi e fondano un’agricoltura.',hint:'Formiche con i funghi nel vaso, senza oggetti.'},
 scisma:{nome:'Lo Scisma',fam:'Conflitti',icon:'⚡',txt:'Fede e scienza dividono la società in due.',hint:'Due idee opposte e quasi pari: una statuina e un orologio.'},
 conquista:{nome:'La Conquista',fam:'Conflitti',icon:'⚔️',txt:'Una guerra decide chi resta nel vaso, e chi no.',hint:'Due specie che si contendono lo stesso cibo, e almeno una è già una società.'},
 patto:{nome:'Il Patto',fam:'Conflitti',icon:'🕊️',txt:'Due società scelgono il commercio al posto delle armi.',hint:'Due insetti sociali in conflitto e una moneta.'},
};
const CULT2FIN={sacro:'fede',sapere:'accademia',commercio:'mercato',gioco:'carnevale',mistero:'mistero',comunicazione:'voci',fuoco:'fiamma',agricoltura:'giardinieri',tribale:'tribu',guerra:'tribu'};
// ============ SIMULAZIONE ============
const EV0=.034, EV1=.044, DT=.03, MU=.013, CW=.18, CM=.26, DET0=.75;
// Microclima nel ramo dei bisogni (ecologo, docs/ecologia/modello.md §8): solo con opts.needs, lo storico (equiv.js) non cambia.
const EVC0=.018, EVC1=.02, MG=.065, TOK={muschio:24,felce:26,succulenta:34,fungo:23,carnivora:30};
function createSim(setup0,opts){
  opts=opts||{}; const R_=rng(opts.seed||1); const NEEDS=!!opts.needs;
  const setup={luce:setup0.luce,acqua:setup0.acqua,meteorite:setup0.meteorite==null?1:setup0.meteorite,piante:(setup0.piante||[]).slice(),insetti:(setup0.insetti||[]).slice(),oggetti:(setup0.oggetti||[]).slice()};
  const ogg=setup.oggetti; const has=o=>ogg.includes(o);
  const flags={pace:false,warEnded:false}; const log=[]; let evN=0, lumMod=0, lumModLeft=0;
  const ev=(d,kind,icon,text,why)=>{ const en={d,kind,icon,text,why:why||[]}; if(opts.game) en.n=++evN; log.push(en); if(kind==='pace') flags.pace=true; if(kind==='guerra'&&text.indexOf('La guerra finisce')===0) flags.warEnded=true; };
  let s,w,T,H,met,wBoost=0;
  let Wres=ACQUA[setup0.acqua==null?1:setup0.acqua].w, nw={um:false,ter:false,pul:false}; const ERED=opts.eredita||{}; let E=ERED.E!=null?ERED.E:20,pulse=0,muffa=ACQUA[setup.acqua].w>.7?.3:.05,detr=(opts.needs?DET0:.2); if(NEEDS&&ERED.um!=null) Wres=clamp(ERED.um,0,1); let muffaWarn=false, siccita=false;
  const climaZero=()=>({tappo:0,ap:0,apOggi:0,dren:0,rist:0,umG:0,colle:0,rin:0,Tc:22,Hc:.8,pv:.7,f:{}}); let clima=climaZero();
  const mkPlant=id=>({id,...PIANTE[id],mut:false,v:0});
  const mkSp=id=>{ const b=SPECIE[id]; return {id,...b,tol:{...b.tol},pop:12,mut:[],mutIdx:0,X:0,gen:0,genAcc:0,society:null,suscept:1,tossico:false,alive:true,intBonus:0,monster:false,rep0:b.rep}; };
  const plants=setup.piante.map(mkPlant);
  const sp=setup.insetti.map(mkSp);
  const series={R:[],E:[],pop:{}}; sp.forEach(x=>series.pop[x.id]=[]);
  const wars=[]; const trade=new Set(); let warCount=0;
  function recompute(){ s=LUCE[setup.luce].s; ogg.forEach(o=>{ if(OGGETTI[o].luce) s=clamp(s+OGGETTI[o].luce); }); if(lumModLeft>0) s=clamp(s-lumMod); w=NEEDS?clamp(Wres,0,1):clamp(ACQUA[setup.acqua].w+wBoost,0,1); met=METEO[setup.meteorite]; T=.3+.7*s; H=clamp(w*.85-(T-.5)*.25+(plants.some(p=>p.id==='muschio')?.08:0)); }
  recompute();
  plants.forEach(p=>{ if(!p.v) p.v=clamp(1-1.1*Math.abs(s-p.opt.l)-1.1*Math.abs(w-p.opt.w)); });
  let radSum=0,radN=0,lastR=0.3; let d=0; const pending=[]; let chapterStart=0, chapterNo=opts.capitolo||1, finalePending=null, monsterSince=0, lastNotable=0, lastFinale=ERED.ultimo||null;
  function applyMut(x,pick){
    x.mut.push(pick); const M=MUT[pick];

        if(pick==='gigantismo'){ x.size*=1.8; x.agg=clamp(x.agg+.2); } if(pick==='radioattivo'){ x.tol.r+=.3; x.rep*=.9; }
        if(pick==='intelligenza'){ x.intBonus+=.25; x.rep*=.92; } if(pick==='corazza'){ x.suscept*=.45; x.rep*=.88; } if(pick==='velenoso'){ x.suscept*=.6; x.agg=clamp(x.agg+.1); x.rep*=.92; }
        if(pick==='iperfertilita'){ x.rep*=1.5; x.suscept*=1.2; } if(pick==='bioluminescenza') x.suscept*=1.25;
        const why=['Radiazione media finora '+f2((radSum/Math.max(1,radN)))+' ('+LUCE[setup.luce].nome.toLowerCase()+').'];
        why.push('Tratti di '+x.nome.toLowerCase()+': '+(x.aff[pick]>=2?'molto portate':'portate')+' a questa mutazione.');
        { const pr=pick==='corazza'?(sp.some(y=>y.dieta==='insetti'&&y.alive)?'C’è un predatore nel vaso: chi ha un guscio più duro sopravvive.':(w<.35?'L’aria è secca: una cuticola più spessa trattiene l’acqua.':'')):pick==='bioluminescenza'?(s<.4?'Il vaso è buio: la luce propria serve.':''):pick==='iperfertilita'?(x.pop/x.K>.6?'Il vaso è affollato: chi fa più piccoli vince.':''):pick==='radioattivo'?'La radiazione del sasso seleziona chi la regge. Nessuna radiazione esce da loro.':pick==='velenoso'?'C’è chi li caccia: il veleno li difende.':''; if(pr) why.push(pr); why.push('Costo: ogni cambiamento si paga (riproduzione più lenta o più fragilità). Al massimo due per specie.'); }
        ev(d,'mutazione','🧬',M.txt(x.nome),why);
        if(pick==='gigantismo' && !x.sociale && !x.monster && x.pop>25){ x.monster=true; ev(d,'mostro','👹',x.nome+' giganti dominano il vaso.',['Mutazione gigante + popolazione alta ('+Math.round(x.pop)+').']); }
  }
  function classify(){
    const socs=sp.filter(x=>x.society&&(!NEEDS||x.alive)), monsters=sp.filter(x=>x.monster&&x.alive), alive=sp.filter(x=>x.alive); let f; if(NEEDS&&!alive.length&&sp.length) return 'spento';
    if(NEEDS&&sp.length&&!alive.length) f='spento'; else if(socs.some(x=>x.society.scisma)) f='scisma'; else if(flags.pace) f='patto'; else if(flags.warEnded) f='conquista';
    else if(socs.length){ const dom=socs.slice().sort((a,b)=>b.pop-a.pop)[0]; f=CULT2FIN[dom.society.cult]||'tribu'; }
    else if(monsters.length) f='gigante'; else if(!alive.length&&sp.length) f='spento'; else f='equilibrio';
    return f; }
  function checkDestino(){
    if(!opts.game || finalePending || (NEEDS&&!sp.length)) return; const age=d-chapterStart;
    const alive=sp.filter(x=>x.alive), mons=sp.filter(x=>x.monster&&x.alive), socs=sp.filter(x=>x.society);
    const last=log.length?log[log.length-1].d:0; for(let i=log.length-1;i>=0;i--){ const k=log[i].kind; if(!['meteorite','ambiente','azione'].includes(k)){ lastNotable=Math.max(lastNotable,log[i].d); break; } }
    if(mons.length&&!monsterSince) monsterSince=d; if(!mons.length) monsterSince=0;
    let ready=false; const Rm=radSum/Math.max(1,radN);
    if(sp.length && !alive.length && age>=10) ready=true;
    else if(socs.length){ const since=Math.min(...socs.map(x=>x.society.since)); const warOn=wars.some(g=>!g.end); const lastWarEnd=wars.reduce((m,g)=>Math.max(m,g.end||0),0); if(age>=30 && d-since>=14 && !warOn && d-lastWarEnd>=3) ready=true; }
    else if(mons.length){ if(age>=30 && d-monsterSince>=12) ready=true; }
    else if(!wars.some(g=>!g.end)){ if(age>=60 && Rm<.4 && d-lastNotable>=14) ready=true; else if(age>=100 && d-lastNotable>=20) ready=true; }
    if(ready && lastFinale && classify()===lastFinale && alive.length) ready=false;   // dopo il primo capitolo serve un finale diverso
    if(ready){ finalePending={finale:classify(),d,chapter:chapterNo}; ev(d,'finale','✨','Il vaso ha trovato il suo destino.',[]); }
  }
  function step(){
    if(pending.length) return {paused:true,d};
    d++; wBoost=Math.max(0,wBoost-.03); if(NEEDS){ climaPre(); detr=clamp(detr-DT); } if(lumModLeft>0){ lumModLeft--; if(lumModLeft===0) lumMod=0; } recompute();
    // --- meteorite ---
    E+=met.g*(.9+3.2*s);
    if(E>=100){ E=20; pulse=.28; if(log.filter(l=>l.kind==='meteorite').length<3) ev(d,'meteorite','☄️','Il meteorite si scarica in un lampo viola.',['Energia accumulata: più luce ⇒ più energia ⇒ scariche più frequenti ('+LUCE[setup.luce].nome.toLowerCase()+').']); }
    pulse*=.8;
    const R=clamp(.1+.5*s+.25*(E/100)+pulse,0,1.3); series.R.push(R); series.E.push(E); radSum+=R; radN++; lastR=R;
    // --- muffa e piante ---
    muffa=NEEDS?climaMuffa():clamp(muffa+(H>.7?.02:-.01)); if(muffa>.7 && !muffaWarn){ muffaWarn=true; ev(d,'ambiente','🟣','La muffa invade il vaso.',['Umidità alta ('+f2(H)+') e acqua abbondante.']); }
    let leaf=0, rot=muffa*.8+detr, carn=0;
    plants.forEach(p=>{
      let v=clamp(1-1.1*Math.abs(s-p.opt.l)-1.1*Math.abs(w-p.opt.w));
      v*= p.rad<0 ? 1+(-p.rad)*R : clamp(1-p.rad*Math.max(0,R-.5)*1.4,.1,1.5);
      if(NEEDS){ v*=(p.pred?1:clamp(.45+1.1*detr,.45,1))*(1-clamp((muffa-.6)*1.2,0,.8)); v=climaPianta(p,v); } p.v=v; leaf+=p.foglie*v; rot+=p.rot*v; if(p.pred) carn+=v;
      if(!p.mut && R>.62 && d>25 && R_()<.03 && v>.3){ p.mut=true; ev(d,'mutazione','✨',p.id==='fungo'?'I funghi brillano e prosperano nella radiazione.':(p.id==='muschio'?'Il muschio comincia a emettere una luce verde.':p.nome+' cresce in forme strane vicino al meteorite.'),['Radiazione alta ('+f2(R)+') per molti giorni.']); }
    });
    if(NEEDS) climaWarn();
    if(!siccita && w<.3 && s>.9 && d>10){ siccita=true; ev(d,'ambiente','🏜️','Il vaso si secca: le piante soffrono.',['Poca acqua e sole diretto.']); }
    // --- capacità ---
    const bio=x=>x.pop*x.size;
    sp.forEach(x=>{
      if(!x.alive) return;
      let K;
      if(x.dieta==='foglie') K=70*leaf; else if(x.dieta==='marcio') K=60*(rot+.15)*(x.id==='termiti'?.8:1); else if(x.dieta==='onnivora') K=50*(.5*leaf+.6*rot+.35); else if(x.dieta==='misto') K=45*(.6*leaf+.6*rot+.1);
      else { let prey=0; sp.forEach(y=>{ if(y!==x&&y.alive&&y.dieta!=='insetti') prey+=y.pop*y.size*y.suscept; }); K=.7*prey/x.size; }
      K=Math.min(100,K)*(x.mut.includes('gigantismo')?.6:1);
      const suit=clamp(1-.55*Math.abs(s-x.tol.l)-.7*Math.abs(w-x.tol.w)-.8*Math.max(0,R-x.tol.r)-(NEEDS?clamp((muffa-.6)*.5,0,.3):0));
      x.K=Math.max(x.dieta==='insetti'?.4:2,K*suit); x.suit=suit; x.Rexp=R;
    });
    // --- dinamica popolazioni ---
    const delta=new Map();
    sp.forEach(x=>{
      if(!x.alive) return;
      let comp=x.pop; sp.forEach(y=>{ if(y!==x&&y.alive) comp+=overlap(x,y)*y.pop*(y.size/x.size); });
      const r=.12*x.rep*clamp(x.suit+.15,0,1.2)*(NEEDS?clamp((clima.Tc-8)/12,.2,1)*(w<.2&&x.id!=='lumache'?.5:1):1);
      let dp=r*x.pop*(1-comp/x.K);
      // disagio: se l'ambiente è troppo lontano dai gusti della specie, muoiono individui
      if(x.suit<.55) dp-=(.55-x.suit)*.16*x.pop;
      if(x.dieta==='insetti'){ let prey=0; sp.forEach(y=>{ if(y!==x&&y.alive&&y.dieta!=='insetti') prey+=y.pop; }); if(prey<8){ x.fame=(x.fame||0)+1; if(x.fame>10) dp-=.008*x.pop; } else x.fame=0; }
      // stress idrico: troppo secco o troppo bagnato per la specie
      const stress=Math.max(0,Math.abs(w-x.tol.w)-.35)*.08; if(stress>0) dp-=stress*x.pop; if(NEEDS){ const crit=(w<CW?1:0)+(detr<.04?.5:0)+(muffa>.88?.5:0); if(crit) dp-=crit*CM*x.pop; }
      if(stress>.015 && !x.idro && d>8){ x.idro=true; ev(d,'ambiente','💧',x.nome+(w<x.tol.w?' soffrono la siccità.':' soffrono l’umidità eccessiva.'),['Acqua '+ACQUA[setup.acqua].nome.toLowerCase()+': non è l’ambiente giusto per '+x.nome.toLowerCase()+'.']); }
      // radiazione
      if(R>x.tol.r) dp-=(R-x.tol.r)*.05*x.pop;
      // predazione
      sp.forEach(y=>{ if(y.dieta==='insetti'&&y.alive&&y!==x&&x.dieta!=='insetti'){ dp-=.0045*y.pop*y.agg*(y.mut.includes('gigantismo')?1.6:1)*x.suscept*x.pop/(x.pop+25); } });
      if(carn>0 && x.id==='mosche') dp-=.003*carn*x.pop*30/(x.pop+25)*.5;
      if(NEEDS&&x.id==='lumache') dp=climaLumache(x,dp);
      delta.set(x,dp);
    });
    sp.forEach(x=>{ if(!x.alive) return; x.pop=clamp(x.pop+delta.get(x),0,100); detr=clamp(detr+(delta.get(x)<0?-delta.get(x)*.004:0)-.002); });
    // --- generazioni, esposizione, mutazioni ---
    sp.forEach(x=>{
      if(!x.alive) return;
      if(x.pop<1){ x.alive=false; ev(d,'estinzione','💀',x.nome+' si estinguono.',['Cibo o clima non adatti ('+(x.suit<.3?'condizioni sfavorevoli':'competizione e predazione')+').']); return; }
      x.genAcc+=x.rep0*.1; if(x.genAcc>=1){ x.genAcc=0; x.gen++; }
      const gain=Math.pow(R,1.3)*1.0*(x.pop>3?1:0); x.mutIdx+=gain; x.X+=gain;
      const th=[6,14][x.mut.length];
      if(th!=null && x.mutIdx>=th && x.mut.length<2){
        const pool=Object.keys(MUT).filter(m=>!x.mut.includes(m)&&!(m==='intelligenza'&&!x.sociale&&x.int<.35)).map(m=>{
          let wt=(x.aff[m]||0.3);
          if(m==='radioattivo') wt*=.5+R*1.2; if(m==='corazza'||m==='velenoso') wt*=sp.some(y=>y.dieta==='insetti'&&y.alive)?1.8:.6;
          if(m==='iperfertilita') wt*=x.pop/x.K>.6?2:.4; if(m==='bioluminescenza') wt*=s<.4?2:.35; if(m==='corazza'&&w<.35) wt*=1.8; if(m==='gigantismo') wt*=x.K>40?1.3:.6;
          return [m,Math.max(.01,wt)]; });
        let tot=pool.reduce((a,b)=>a+b[1],0), r=R_()*tot, pick=pool[0][0]; for(const [m,wt] of pool){ r-=wt; if(r<=0){pick=m;break;} }
        if(opts.decisions && !x.decisionDone){ x.decisionDone=true; pending.push({id:'m'+d+'-'+x.id,type:'mutazione',sp:x.id,mutation:pick,d,th}); }
        else applyMut(x,pick);
      }
      // società
      if(x.sociale && !x.society){
        const intEff=x.int+x.intBonus+.02*x.gen;
        if(x.X>=40 && x.gen>=6 && x.pop>=12 && intEff>=.9){
          // cultura
          const memi={}; ogg.forEach(o=>{ Object.entries(OGGETTI[o].memi).forEach(([m,v])=>memi[m]=(memi[m]||0)+v*(m==='sapere'&&x.mut.includes('intelligenza')?1.3:1)); });
          if(s>=1) memi.sacro=(memi.sacro||0)+.5; if(plants.some(p=>p.id==='fungo')&&x.id==='formiche') memi.agricoltura=(memi.agricoltura||0)+.7; if(R>.8) memi.mistero=(memi.mistero||0)+.3;
          const ord=Object.entries(memi).sort((a,b)=>b[1]-a[1]); let cult=ord.length?ord[0][0]:'tribale';
          const gi=x.g, tratti=x.mut.filter(m=>m!=='intelligenza').slice(0,2).map(m=>MUT[m].agg[gi]);
          x.society={cult,memi,since:d,name:x.nome+(tratti.length?' '+tratti.join(' e '):'')+' '+CULT[cult].agg[gi]};
          if(opts.decisions) pending.push({id:'s'+d+'-'+x.id,type:'societa',sp:x.id,d});
          const why=['Esposizione alla radiazione: '+Math.round(x.X)+' (soglia 40).','Generazioni: '+x.gen+' (soglia 6). Intelligenza: '+f2(intEff)+' (soglia 0,9).'];
          ev(d,'societa','🏛️',x.nome+' si organizzano in una società.',why);
          ogg.filter(o=>OGGETTI[o].memi[cult]||true).slice(0,2).forEach(o=>ev(d,'cultura',OGGETTI[o].icon,OGGETTI[o].txt(x.nome),['Idea portata dall’oggetto: '+Object.keys(OGGETTI[o].memi).join(', ')+'.']));
          if(!ogg.length) ev(d,'cultura','🏕️',x.nome+' non hanno nulla da venerare né studiare: restano una società tribale.',['Nessun oggetto nel vaso.']);
          if(memi.agricoltura && cult!=='agricoltura') ev(d,'cultura','🍄','Le formiche coltivano i funghi: nasce l’agricoltura.',['Formiche + funghi nel vaso.']);
          if(ord.length>1 && ord[1][1]>=.75*ord[0][1] && ((ord[0][0]==='sacro'&&ord[1][0]==='sapere')||(ord[0][0]==='sapere'&&ord[1][0]==='sacro'))){ x.society.scisma=true; x.suscept*=1; ev(d,'scisma','⚡','Scisma: scienza e fede dividono la società in due fazioni.',['Due idee quasi pari e opposte: '+ord[0][0]+' e '+ord[1][0]+'.']); }
        }
      }
    });
    // --- guerre e paci ---
    if(d>=30 && d%4===0){
      for(let i=0;i<sp.length;i++)for(let j=i+1;j<sp.length;j++){
        const a=sp[i],b=sp[j]; if(!a.alive||!b.alive||a.pop<12||b.pop<12) continue;
        if(!((a.id==='formiche'&&b.id==='termiti')||(a.id==='termiti'&&b.id==='formiche'))) continue;
        const ov=overlap(a,b); if(ov<=0) continue;
        const crowd=Math.max((a.pop+ov*b.pop)/a.K,(b.pop+ov*a.pop)/b.K); const key=a.id+'|'+b.id; const cur=wars.find(x=>x.key===key&&!x.end);
        const prev=wars.filter(x=>x.key===key); const last=prev[prev.length-1]; const bothSoc=a.society&&b.society;
        const can=!cur && (!last || (last.end && d-last.end>=15 && bothSoc && prev.length<2));
        if(can && crowd>.7 && a.agg+b.agg>=.7){
          if(bothSoc && has('moneta')){ if(!trade.has(key)){ trade.add(key); ev(d,'pace','🕊️','Le due società scoprono il commercio: la moneta evita la guerra.',['Due società in conflitto per le stesse risorse.','La moneta porta l’idea dello scambio: commercio al posto delle armi.']); } }
          else { wars.push({key,a,b,start:d,end:0}); warCount++; if(opts.decisions) pending.push({id:'g'+d+'-'+key,type:'guerra',sp:a.id,sp2:b.id,key,d});
            ev(d,'guerra','⚔️','Guerra tra '+(bothSoc?'le società di ':'')+a.nome.toLowerCase()+' e '+b.nome.toLowerCase()+'.',['Stessa fonte di cibo e risorse scarse (affollamento '+f2(crowd)+').','Aggressività: '+f2(a.agg)+' + '+f2(b.agg)+' (soglia 0,7).']); }
        }
      }
    }
    wars.filter(x=>!x.end).forEach(g=>{
      const pa=g.a.pop*g.a.size*(1+.3*g.a.mut.length)*(1+g.a.agg), pb=g.b.pop*g.b.size*(1+.3*g.b.mut.length)*(1+g.b.agg);
      g.a.pop=clamp(g.a.pop-.04*g.a.pop*pb/(pa+pb),0,100); g.b.pop=clamp(g.b.pop-.04*g.b.pop*pa/(pa+pb),0,100);
      if(g.a.society&&g.b.society&&has('moneta')&&d-g.start>=8&&R_()<.08){ g.end=d; ev(d,'pace','🕊️','Le due società firmano un patto grazie alla moneta.',['La moneta insegna lo scambio: commercio invece di guerra.']); }
      else if(d-g.start>=25||g.a.pop<6||g.b.pop<6){ g.end=d; const win=pa>=pb?g.a:g.b; ev(d,'guerra','🏳️','La guerra finisce: '+win.nome.toLowerCase()+' prevalgono.',['Forza: '+Math.round(Math.max(pa,pb))+' contro '+Math.round(Math.min(pa,pb))+'.']); if(win.society) win.society.vincitrice=true; }
    });
    sp.forEach(x=>{ (series.pop[x.id]||(series.pop[x.id]=[])).push(x.alive?x.pop:0); });
    if(opts.game){ for(const k of ['R','E']) if(series[k].length>400) series[k].splice(0,series[k].length-400); for(const k in series.pop) if(series.pop[k].length>400) series.pop[k].splice(0,series.pop[k].length-400); if(log.length>300) log.splice(0,log.length-300); }
      if(NEEDS) needWarn();
    checkDestino();
    return {paused:false,d};
  }
  function steps(n){ let done=0; for(let i=0;i<n;i++){ const r=step(); if(r.paused) break; done++; } return done; }
  function summary(){
    const societies=sp.filter(x=>x.society).map(x=>x.society.name);
    const monsters=sp.filter(x=>x.monster&&x.alive);
    const alive=sp.filter(x=>x.alive), extinct=sp.filter(x=>!x.alive);
    let headline,tipo;
    if(societies.length){ headline=societies.join(' · '); tipo='societa'; }
    else if(monsters.length){ headline=monsters.map(m=>m.nome+' giganti').join(' · '); tipo='mostro'; }
    else if(!alive.length && sp.length){ headline='Il vaso resta senza vita animale'; tipo='estinzione'; }
    else if(!sp.length){ headline='Nessun animale nel vaso'; tipo='vuoto'; }
    else { headline='Un ecosistema tranquillo'; tipo='stabile'; }
    const sub=[]; if(warCount) sub.push(warCount===1?'una guerra':warCount+' guerre'); if(extinct.length) sub.push('estinte: '+extinct.map(x=>x.nome.toLowerCase()).join(', ')); if(monsters.length&&societies.length) sub.push('con '+monsters.map(m=>m.nome.toLowerCase()+' giganti').join(', '));
    const Rm=radSum/Math.max(1,radN); const finale=classify();
    return {setup,days:d,log,series,headline,tipo,finale,sub:sub.join(' · '),societies,warCount,monsters:monsters.map(m=>m.id),extinct:extinct.map(x=>x.id),alive:alive.map(x=>x.id),Rm,sp:sp.map(x=>({id:x.id,nome:x.nome,pop:x.pop,alive:x.alive,mut:x.mut,gen:x.gen,X:x.X,society:x.society&&{name:x.society.name,cult:x.society.cult,since:x.society.since,vincitrice:!!x.society.vincitrice,scisma:!!x.society.scisma}}))};
  }
  // ---------- API del gioco ----------
  function reculture(x){ const ord=Object.entries(x.society.memi).sort((a,b)=>b[1]-a[1]); const cult=ord.length?ord[0][0]:'tribale'; if(cult===x.society.cult) return false; x.society.cult=cult; const gi=x.g, tratti=x.mut.filter(m=>m!=='intelligenza').slice(0,2).map(m=>MUT[m].agg[gi]); x.society.name=x.nome+(tratti.length?' '+tratti.join(' e '):'')+' '+CULT[cult].agg[gi]; return true; }
  function addSpecies(id){ if(sp.some(x=>x.id===id)||!SPECIE[id]) return false; sp.push(mkSp(id)); setup.insetti.push(id); series.pop[id]=[]; ev(d,'ambiente',SPECIE[id].icon,SPECIE[id].nome+' entrano nel vaso.',['Le hai aggiunte tu.']); return true; }
  function removeSpecies(id){ const i=sp.findIndex(x=>x.id===id); if(i<0) return false; const x=sp[i]; sp.splice(i,1); const j=setup.insetti.indexOf(id); if(j>=0) setup.insetti.splice(j,1); for(let k=wars.length-1;k>=0;k--) if(wars[k].a===x||wars[k].b===x) wars.splice(k,1); delete series.pop[id]; ev(d,'ambiente','👋',x.nome+' escono dal vaso.',['Le hai tolte tu.']); return true; }
  function addPlant(id){ if(plants.some(p=>p.id===id)||!PIANTE[id]) return false; plants.push(mkPlant(id)); setup.piante.push(id); recompute(); { const p=plants[plants.length-1]; p.v=clamp(1-1.1*Math.abs(s-p.opt.l)-1.1*Math.abs(w-p.opt.w)); } ev(d,'ambiente',PIANTE[id].icon,PIANTE[id].nome+' nel vaso.',['L’hai piantata tu.']); return true; }
  function removePlant(id){ const i=plants.findIndex(p=>p.id===id); if(i<0) return false; plants.splice(i,1); const j=setup.piante.indexOf(id); if(j>=0) setup.piante.splice(j,1); recompute(); ev(d,'ambiente','🪴',PIANTE[id].nome+' tolta dal vaso.',['L’hai tolta tu.']); return true; }
  function addObject(id){ if(ogg.includes(id)||!OGGETTI[id]) return false; ogg.push(id); recompute(); ev(d,'ambiente',OGGETTI[id].icon,OGGETTI[id].nome+' nel vaso.',['L’hai messo tu.']); sp.forEach(x=>{ if(x.society){ Object.entries(OGGETTI[id].memi).forEach(([m,v])=>{ x.society.memi[m]=(x.society.memi[m]||0)+v*.8; }); if(reculture(x)) ev(d,'cultura',OGGETTI[id].icon,OGGETTI[id].txt(x.nome),['La società ha scoperto un oggetto nuovo: la sua cultura cambia.']); } }); return true; }
  function removeObject(id){ const i=ogg.indexOf(id); if(i<0) return false; ogg.splice(i,1); recompute(); ev(d,'ambiente',OGGETTI[id].icon,OGGETTI[id].nome+' tolto dal vaso.',['L’hai tolto tu.']); return true; }
  function setMalus(delta,days){ lumMod=delta; lumModLeft=days; recompute(); ev(d,'ambiente','🩹','Il vetro si è scheggiato: entra meno luce.',['Per qualche giorno il vaso è un po’ più scuro.']); }
  function setNeeds(o){ if(o.um!=null) Wres=clamp(o.um); if(o.ter!=null) detr=clamp(o.ter); if(o.pul!=null) muffa=clamp(1-o.pul); if(o.rist!=null) clima.rist=clamp(o.rist); recompute(); }
  // ---------- microclima (ecologo): tappo, ristagno, serra, muffa con le sue cause, collemboli ----------
  // B1 evaporazione: col tappo aperto (o nel giorno dopo una cura, quando lo togli per curare) come prima; chiuso l'acqua ricircola e se ne perde meno della metà (tappo non ermetico).
  function climaPre(){ const c=clima, ap=c.tappo||c.ap>0; c.apOggi=ap?1:0;
    Wres=clamp(Wres-(ap?EV0+EV1*s:EVC0+EVC1*s));
    if(c.dren>0&&Wres<.9){ const x=Math.min(c.dren,.03); c.dren-=x; Wres=clamp(Wres+x*.31); }   // il serbatoio tra i sassolini risale piano quando sopra si asciuga (~7 ml al giorno reale; 75 ml su 240)
    c.dren=Math.max(0,c.dren-(ap?.04:.01));
    c.rist=clamp(c.rist+(c.dren>.6&&Wres>.8?.15:-.08));                                          // B3 ristagno: l'acqua tra i sassolini tocca la terra fradicia
    if(c.ap>0) c.ap--; if(c.rin>0) c.rin--; }
  // B2 muffa: cresce con l'umido alla superficie (chiuso: l'aria resta quasi satura anche al sole, H = 0,6 + 0,4·acqua), 5–45 °C, materia morta; cala con aria, luce, collemboli
  function climaMuffa(){ const c=clima, ap=c.apOggi;
    const Hc=ap?H:clamp(.6+.4*w), Tc=20+4*s+(s>.6?(s-.6)/.4*(ap?5:9):0); c.Hc=Hc; c.Tc=Tc;
    const fRH=clamp((Hc-.6)/.3), fT=clamp(1-Math.abs(Tc-25)/20), morta=clamp(.5+.4*detr+.4*(1-c.pv));
    const cresce=MG*fRH*fT*morta*(ap?.6:1), cala=.004+(ap?.03:0)+.01*Math.max(0,s-.5)+.04*c.colle;
    c.umG=Hc>.8?c.umG+1:0;
    if(muffa>.45&&Hc>.8) c.colle=clamp(c.colle+.04); else if(Wres<.3||muffa<.1) c.colle=clamp(c.colle-.02);   // collemboli: arrivano dove c'è muffa e umido, se ne vanno col secco
    return clamp(muffa+cresce-cala); }
  // B3–B5, B8: il vaso cuoce al sole, le radici soffocano, la succulenta marcisce nel chiuso, il muschio rinasce
  function climaPianta(p,v){ const c=clima; let x=v; if(c.Tc>TOK[p.id]) x-=.035*(c.Tc-TOK[p.id]);
    if(c.rist>.5) x*=p.id==='succulenta'?.15:.6; if(p.id==='succulenta'&&c.umG>=5) x*=.15; if(p.id==='muschio'&&c.rin>0) x*=1.5; return Math.max(0,x); }
  // B7 lumache: col secco si sigillano nel guscio invece di morire
  function climaLumache(x,dp){ if(w<.35){ dp=Math.max(dp,-.01*x.pop); if(!x.est){ x.est=1; ev(d,'ambiente','🐌','Le lumache si sono sigillate nel guscio: aspettano l’umido.',['Con il secco chiudono il guscio con un velo e dormono.']); } } else x.est=0; return dp; }
  function climaWarn(){ const c=clima, f=c.f; c.pv=plants.length?plants.reduce((a,p)=>a+clamp(p.v),0)/plants.length:.7;
    if(c.rist>.5&&!f.rist){ f.rist=1; ev(d,'ambiente','🫧','C’è acqua ferma tra i sassolini: le radici restano senz’aria.',['Hai versato più acqua di quanta la terra ne tenga. Lascia il tappo aperto per farla uscire.']); } if(c.rist<.2) f.rist=0;
    if(c.Tc>28&&!c.apOggi&&plants.length&&!f.serra){ f.serra=1; ev(d,'ambiente','🌡️','Al sole, col tappo chiuso, dentro fa caldo come in una serra: il muschio e la felce soffrono.',['Il sole scalda il vetro chiuso di molti gradi. Spostalo in mezza luce o apri il tappo.']); } if(c.Tc<26) f.serra=0;
    if(c.umG===5&&plants.some(p=>p.id==='succulenta')){ ev(d,'ambiente','🌵','La succulenta è molle alla base: nell’aria chiusa e umida marcisce.',['Vuole il tappo aperto e il sole.']); }
    if(c.colle>=.2&&!f.colle){ f.colle=1; ev(d,'ambiente','🔬','Sulla terra saltano minuscoli collemboli bianchi: mangiano la muffa.',['Arrivano da soli dove la muffa e l’umido durano a lungo.']); } if(c.colle<.05) f.colle=0; }
  function climaCura(name){ const c=clima; c.ap=1;                                               // per curare togli il tappo: per un giorno entra aria
    if(name==='acqua'){ const over=Wres+.3-1; if(over>0) c.dren=clamp(c.dren+over*3.2);
      if((nw.um||Wres<.25)&&plants.some(p=>p.id==='muschio')){ c.rin=2; ev(d,'ambiente','🌿','Hai bagnato il muschio secco: in un’ora si riapre, verde come prima.',['Il muschio secco non è morto: aspetta l’acqua.']); } }
    if(name==='terra') c.colle=clamp(c.colle+.3); }
  function setTappo(aperto){ const a=aperto?1:0; if(a===clima.tappo) return false; clima.tappo=a; ev(d,'azione','🫙',a?'Hai tolto il tappo: entra aria e l’acqua comincia a uscire.':'Hai chiuso il tappo: dentro l’acqua torna a girare come pioggia.',[a?'Aperto il vaso si asciuga e la muffa cala.':'Chiuso il vaso resta umido più a lungo.']); return true; }
  function climaView(){ const c=clima, r=x=>Math.round(x*100)/100; return {tappo:c.tappo?'aperto':'chiuso',aperto:!!(c.tappo||c.ap>0),T:r(c.Tc),H:r(c.Hc),ristagno:r(c.rist),drenaggio:r(c.dren),collemboli:r(c.colle),umidiGiorni:c.umG}; }
  function needWarn(){ if(Wres<.22&&!nw.um){ nw.um=true; ev(d,'ambiente','🥀','L’acqua sta finendo: le foglie si arricciano.',['L’umidità è scesa sotto il minimo.']); } if(Wres>.4) nw.um=false;
    if(detr<.1&&!nw.ter){ nw.ter=true; ev(d,'ambiente','🍂','Il terreno è stanco: per chi vive nel marcio non c’è più niente da mangiare.',['Il terreno è quasi senza nutrienti.']); } if(detr>.25) nw.ter=false;
    if(muffa>.55&&!nw.pul){ nw.pul=true; ev(d,'ambiente','🟣','Il vetro è sporco e la muffa avanza.',['Nessuno pulisce da un po’.']); } if(muffa<.3) nw.pul=false; }
  function charge(dE){ E=clamp(E+dE,0,100); ev(d,'ambiente','☄️',dE>0?'Il sasso si carica di colpo.':'Il sasso si quieta.',[]); }
  function growMeteo(){ if(setup.meteorite>=2) return false; setup.meteorite++; recompute(); ev(d,'ambiente','☄️','Il sasso è cresciuto: ora batte con più forza.',['Un meteorite più grande accumula energia più in fretta.']); return true; }
  function setLuce(i){ if(i===setup.luce) return false; setup.luce=i; recompute(); ev(d,'azione','☀️','Hai spostato il vaso: '+LUCE[i].nome.toLowerCase()+'.',[]); return true; }
  function act(name){
    if(NEEDS&&(name==='acqua'||name==='nutri'||name==='pulisci'||name==='terra')) climaCura(name);
    if(name==='pulisci'){ muffa=clamp(muffa-(NEEDS?.4:.25)); if(!NEEDS) detr=clamp(detr-.1); ev(d,'azione','🧽','Hai pulito il vetro e il fondo.',['La muffa cala.']); return 'Più pulito: la muffa cala.'; }
    if(name==='terra'){ detr=clamp(detr+.6); ev(d,'azione','🪴','Versi una manciata di terra nel barattolo. Il sasso si scurisce un poco, come se ascoltasse.',['Il terreno parte da zero.']); return 'Terra nel barattolo.'; }
    if(name==='acqua'){ if(NEEDS&&Wres>=.95){ muffa=clamp(muffa+.05); ev(d,'ambiente','🌫️','Troppa acqua: il vetro si appanna e l’acqua cola sul fondo.',['Il vaso era già pieno d’acqua: l’umido in più nutre la muffa sul vetro.']); } if(NEEDS) Wres=clamp(Wres+.3); else wBoost=Math.min(.3,wBoost+.15); recompute(); ev(d,'azione','💧','Hai versato un po’ d’acqua.',['Il vaso è più umido per qualche giorno.']); return 'Più umido, per qualche giorno.'; }
    if(name==='nutri'){ detr=clamp(detr+(NEEDS?.35:.2)); ev(d,'azione','🌱','Hai nutrito il suolo.',['C’è più cibo per chi mangia il marcio.']); return 'Più cibo nel suolo.'; }
    return ''; }
  function resolve(id,choice){
    const i=pending.findIndex(p=>p.id===id); if(i<0) return null; const p=pending[i]; const x=sp.find(y=>y.id===p.sp); pending.splice(i,1); if(!x) return null;
    if(p.type==='mutazione'){
      if(choice==='proteggi'){ applyMut(x,p.mutation); x.pop=clamp(x.pop+6,0,100); ev(d,'azione','🛡️','Hai protetto il mutante: la mutazione si fissa.',[]); }
      else if(choice==='rimuovi'){ x.mutIdx=p.th*.55; ev(d,'azione','🧹','Hai rimosso il mutante: ci riproveranno.',['La radiazione continua a lavorare.']); }
      else { if(R_()<.5) applyMut(x,p.mutation); else { x.mutIdx=p.th*.7; ev(d,'ambiente','🌫️','La mutazione non si è fissata.',['Lasciar fare è un rischio: a volte non succede nulla.']); } }
    } else if(p.type==='guerra'){ const g=wars.find(q=>q.key===p.key&&!q.end); if(g){ if(choice==='separa'){ g.end=d; ev(d,'azione','🚧','Hai separato le due specie: la guerra si ferma.',[]); } else if(choice==='patto'&&has('moneta')){ g.end=d; flags.pace=true; ev(d,'pace','🕊️','Le due società firmano un patto grazie alla moneta.',['Hai proposto il patto: la moneta insegna lo scambio.']); } }
    } else if(p.type==='societa'&&x.society){
      if(choice==='mostrati'){ x.society.culto='giocatore'; x.society.memi.sacro=(x.society.memi.sacro||0)+.5; ev(d,'cultura','👁️','Si sono accorti di te: ti guardano come una presenza.',['Hai scelto di mostrarti.']); }
      else { x.society.culto='meteorite'; x.society.memi.mistero=(x.society.memi.mistero||0)+.5; ev(d,'cultura','☄️','Restano nascosti: venerano il meteorite.',['Hai scelto di restare nascosto.']); }
      reculture(x);
    }
    return p.type; }
  function save(){ return JSON.parse(JSON.stringify({v:1,setup,st:{E,pulse,muffa,detr,wBoost,muffaWarn,siccita,radSum,radN,lastR,warCount,chapterStart,chapterNo,finalePending,monsterSince,lastNotable,lastFinale,lumMod,lumModLeft,evN,Wres,d,clima},pending,wars:wars.map(g=>({key:g.key,a:g.a.id,b:g.b.id,start:g.start,end:g.end})),trade:[...trade],flags,plants,sp,series,log,rng:R_.get()})); }
  function load(st){
    const rep=(arr,vals)=>{ arr.splice(0,arr.length,...vals); };
    setup.luce=st.setup.luce; setup.acqua=st.setup.acqua; setup.meteorite=st.setup.meteorite; rep(setup.piante,st.setup.piante); rep(setup.insetti,st.setup.insetti); rep(setup.oggetti,st.setup.oggetti);
    rep(plants,st.plants); rep(sp,st.sp); rep(pending,st.pending); rep(log,st.log); series.R=st.series.R; series.E=st.series.E; series.pop=st.series.pop;
    rep(wars,st.wars.map(g=>({key:g.key,a:sp.find(x=>x.id===g.a),b:sp.find(x=>x.id===g.b),start:g.start,end:g.end}))); trade.clear(); st.trade.forEach(t=>trade.add(t));
    flags.pace=st.flags.pace; flags.warEnded=st.flags.warEnded; R_.set(st.rng);
    ({E,pulse,muffa,detr,wBoost,muffaWarn,siccita,radSum,radN,lastR,warCount,chapterStart,chapterNo,finalePending,monsterSince,lastNotable,lastFinale,lumMod,lumModLeft,evN,Wres,d}=st.st); if(Wres==null) Wres=ACQUA[setup.acqua].w; lumMod=lumMod||0; lumModLeft=lumModLeft||0; evN=evN||0; lastFinale=lastFinale||null; clima=Object.assign(climaZero(),st.st.clima||{}); recompute(); }
  function closeChapter(){ const fp=finalePending; if(fp) lastFinale=fp.finale; chapterStart=d; chapterNo++; finalePending=null; flags.pace=false; flags.warEnded=false; sp.forEach(x=>{ if(x.society) x.society.scisma=false; }); monsterSince=0; lastNotable=d; return fp; }
  function view(){
    const alive=sp.filter(x=>x.alive); const pv=plants.length?plants.reduce((a,p)=>a+clamp(p.v),0)/plants.length:1;
    const sv=alive.length?alive.reduce((a,x)=>a+clamp(x.suit==null?.7:x.suit),0)/alive.length:(sp.length?0:1);
    return {d,chapter:chapterNo,setup:{luce:setup.luce,acqua:setup.acqua,meteorite:setup.meteorite,piante:setup.piante.slice(),insetti:setup.insetti.slice(),oggetti:setup.oggetti.slice()},vit:Math.round(100*clamp(.5*pv+.5*sv)),E:Math.round(E),R:lastR,muffa,H,s,w,wBoost,detr,
      plants:plants.map(p=>({id:p.id,v:p.v,mut:p.mut})),
      sp:sp.map(x=>({id:x.id,nome:x.nome,icon:x.icon,pop:x.pop,alive:x.alive,mut:x.mut.slice(),society:x.society?{name:x.society.name,cult:x.society.cult,since:x.society.since,culto:x.society.culto}:null,monster:x.monster,size:x.size,gen:x.gen,sociale:x.sociale,suit:x.suit==null?.7:x.suit})),
      wars:wars.filter(g=>!g.end).map(g=>[g.a.id,g.b.id]),pending:pending.slice(),finalePending,age:d-chapterStart,needs:{um:NEEDS?Wres:w,ter:detr,pul:1-muffa},clima:NEEDS?climaView():null}; }
  return {setup,step,steps,summary,classify,log,series,pending,sp,plants,wars,R_,addSpecies,removeSpecies,addPlant,removePlant,addObject,removeObject,setLuce,setMalus,setNeeds,setTappo,charge,growMeteo,act,resolve,save,load,closeChapter,view,
    get d(){return d;}, get finalePending(){return finalePending;}, get chapter(){return chapterNo;}, get E(){return E;}, get lastR(){return lastR;} };
}
function run(setup,opts){ opts=opts||{}; const days=opts.days||120; const sim=createSim(setup,{seed:opts.seed}); for(let i=0;i<days;i++) sim.step(); const r=sim.summary(); r.days=days; return r; }
function randomSetup(R_){ const pick=(arr,n)=>{ const a=arr.slice(),o=[]; for(let i=0;i<n&&a.length;i++){ o.push(a.splice(Math.floor(R_()*a.length),1)[0]); } return o; };
  return {luce:Math.floor(R_()*3),acqua:Math.floor(R_()*3),meteorite:1,piante:pick(Object.keys(PIANTE),1+Math.floor(R_()*3)),insetti:pick(Object.keys(SPECIE),1+Math.floor(R_()*3)),oggetti:pick(Object.keys(OGGETTI),Math.floor(R_()*3))}; }
function batch(n,days,seed){ const R_=rng(seed||7); const out={n,fin:{},tipo:{},cult:{},guerra:0,mut:{},luce:[{n:0,soc:0,mos:0,est:0,war:0},{n:0,soc:0,mos:0,est:0,war:0},{n:0,soc:0,mos:0,est:0,war:0}],t:[]};
  for(let i=0;i<n;i++){ const su=randomSetup(R_); const r=run(su,{days,seed:1000+i}); out.tipo[r.tipo]=(out.tipo[r.tipo]||0)+1; out.fin[r.finale]=(out.fin[r.finale]||0)+1; if(r.warCount) out.guerra++;
    const L=out.luce[su.luce]; L.n++; if(r.tipo==='societa') L.soc++; if(r.tipo==='mostro') L.mos++; if(r.tipo==='estinzione') L.est++; if(r.warCount) L.war++;
    r.sp.forEach(x=>{ if(x.society) out.cult[x.society.cult]=(out.cult[x.society.cult]||0)+1; x.mut.forEach(m=>out.mut[m]=(out.mut[m]||0)+1); });
    r.log.filter(l=>l.kind==='societa').forEach(l=>out.t.push(l.d)); }
  return out; }
const API={run,createSim,batch,randomSetup,rng,FINALI,RITMO,LUCE,ACQUA,METEO,PIANTE,SPECIE,OGGETTI,MUT,CULT,f1,f2};
if(typeof module!=='undefined') module.exports=API; else root.Terr=API;
})(typeof window!=='undefined'?window:this);
