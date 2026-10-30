(function(root){
'use strict';
function rng(seed){ let s=(seed>>>0)||1; return ()=>{ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
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
 termiti:{nome:'Termiti',icon:'🐛',g:0,dieta:'marcio',sociale:true,size:.9,rep:.9,agg:.35,int:.68,tol:{l:.25,w:.7,r:.5},aff:{intelligenza:2,corazza:1.3,radioattivo:1.2,gigantismo:.8,iperfertilita:1,bioluminescenza:.8,velenoso:.3},nota:'Sociali; mangiano legno morto e foglie secche, amano il buio umido.'},
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
function run(setup,opts){
  opts=opts||{}; const days=opts.days||120; const R_=rng(opts.seed||1);
  const ogg=setup.oggetti||[]; const has=o=>ogg.includes(o);
  let s=LUCE[setup.luce].s; ogg.forEach(o=>{ if(OGGETTI[o].luce) s=clamp(s+OGGETTI[o].luce); });
  const w=ACQUA[setup.acqua].w, met=METEO[setup.meteorite==null?1:setup.meteorite];
  const T=.3+.7*s;
  const log=[]; const ev=(d,kind,icon,text,why)=>log.push({d,kind,icon,text,why:why||[]});
  let E=20,pulse=0,muffa=w>.7?.3:.05,detr=.2; let muffaWarn=false, siccita=false;
  const plants=(setup.piante||[]).map(id=>({id,...PIANTE[id],mut:false,v:0}));
  const sp=(setup.insetti||[]).map(id=>{ const b=SPECIE[id]; return {id,...b,tol:{...b.tol},pop:12,mut:[],mutIdx:0,X:0,gen:0,genAcc:0,society:null,suscept:1,tossico:false,alive:true,intBonus:0,monster:false,rep0:b.rep}; });
  const series={R:[],E:[],pop:{}}; sp.forEach(x=>series.pop[x.id]=[]);
  const wars=[]; const trade=new Set(); let warCount=0; const H=clamp(w*.85-(T-.5)*.25+(plants.some(p=>p.id==='muschio')?.08:0));
  const radBase=[],nomi=x=>x.nome;
  for(let d=1; d<=days; d++){
    // --- meteorite ---
    E+=met.g*(.9+3.2*s);
    if(E>=100){ E=20; pulse=.28; if(log.filter(l=>l.kind==='meteorite').length<3) ev(d,'meteorite','☄️','Il meteorite si scarica in un lampo viola.',['Energia accumulata: più luce ⇒ più energia ⇒ scariche più frequenti ('+LUCE[setup.luce].nome.toLowerCase()+').']); }
    pulse*=.8;
    const R=clamp(.1+.5*s+.25*(E/100)+pulse,0,1.3); series.R.push(R); series.E.push(E); radBase.push(R);
    // --- muffa e piante ---
    muffa=clamp(muffa+(H>.7?.02:-.01)); if(muffa>.7 && !muffaWarn){ muffaWarn=true; ev(d,'ambiente','🟣','La muffa invade il vaso.',['Umidità alta ('+f2(H)+') e acqua abbondante.']); }
    let leaf=0, rot=muffa*.8+detr, carn=0;
    plants.forEach(p=>{
      let v=clamp(1-1.1*Math.abs(s-p.opt.l)-1.1*Math.abs(w-p.opt.w));
      v*= p.rad<0 ? 1+(-p.rad)*R : clamp(1-p.rad*Math.max(0,R-.5)*1.4,.1,1.5);
      p.v=v; leaf+=p.foglie*v; rot+=p.rot*v; if(p.pred) carn+=v;
      if(!p.mut && R>.62 && d>25 && R_()<.03 && v>.3){ p.mut=true; ev(d,'mutazione','✨',p.id==='fungo'?'I funghi brillano e prosperano nella radiazione.':(p.id==='muschio'?'Il muschio comincia a emettere una luce verde.':p.nome+' cresce in forme strane vicino al meteorite.'),['Radiazione alta ('+f2(R)+') per molti giorni.']); }
    });
    if(!siccita && w<.3 && s>.9 && d>10){ siccita=true; ev(d,'ambiente','🏜️','Il vaso si secca: le piante soffrono.',['Poca acqua e sole diretto.']); }
    // --- capacità ---
    const bio=x=>x.pop*x.size;
    sp.forEach(x=>{
      if(!x.alive) return;
      let K;
      if(x.dieta==='foglie') K=70*leaf; else if(x.dieta==='marcio') K=60*(rot+.15)*(x.id==='termiti'?.8:1); else if(x.dieta==='onnivora') K=50*(.5*leaf+.6*rot+.35); else if(x.dieta==='misto') K=45*(.6*leaf+.6*rot+.1);
      else { let prey=0; sp.forEach(y=>{ if(y!==x&&y.alive&&y.dieta!=='insetti') prey+=y.pop*y.size*y.suscept; }); K=.7*prey/x.size; }
      K=Math.min(100,K)*(x.mut.includes('gigantismo')?.6:1);
      const suit=clamp(1-.55*Math.abs(s-x.tol.l)-.7*Math.abs(w-x.tol.w)-.8*Math.max(0,R-x.tol.r));
      x.K=Math.max(x.dieta==='insetti'?.4:2,K*suit); x.suit=suit; x.Rexp=R;
    });
    // --- dinamica popolazioni ---
    const delta=new Map();
    sp.forEach(x=>{
      if(!x.alive) return;
      let comp=x.pop; sp.forEach(y=>{ if(y!==x&&y.alive) comp+=overlap(x,y)*y.pop*(y.size/x.size); });
      const r=.12*x.rep*clamp(x.suit+.15,0,1.2);
      let dp=r*x.pop*(1-comp/x.K);
      // disagio: se l'ambiente è troppo lontano dai gusti della specie, muoiono individui
      if(x.suit<.55) dp-=(.55-x.suit)*.16*x.pop;
      if(x.dieta==='insetti'){ let prey=0; sp.forEach(y=>{ if(y!==x&&y.alive&&y.dieta!=='insetti') prey+=y.pop; }); if(prey<8){ x.fame=(x.fame||0)+1; if(x.fame>10) dp-=.008*x.pop; } else x.fame=0; }
      // stress idrico: troppo secco o troppo bagnato per la specie
      const stress=Math.max(0,Math.abs(w-x.tol.w)-.35)*.08; if(stress>0) dp-=stress*x.pop;
      if(stress>.015 && !x.idro && d>8){ x.idro=true; ev(d,'ambiente','💧',x.nome+(w<x.tol.w?' soffrono la siccità.':' soffrono l’umidità eccessiva.'),['Acqua '+ACQUA[setup.acqua].nome.toLowerCase()+': non è l’ambiente giusto per '+x.nome.toLowerCase()+'.']); }
      // radiazione
      if(R>x.tol.r) dp-=(R-x.tol.r)*.05*x.pop;
      // predazione
      sp.forEach(y=>{ if(y.dieta==='insetti'&&y.alive&&y!==x&&x.dieta!=='insetti'){ dp-=.0045*y.pop*y.agg*(y.mut.includes('gigantismo')?1.6:1)*x.suscept*x.pop/(x.pop+25); } });
      if(carn>0 && x.id==='mosche') dp-=.003*carn*x.pop*30/(x.pop+25)*.5;
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
        x.mut.push(pick); const M=MUT[pick];
        if(pick==='gigantismo'){ x.size*=1.8; x.agg=clamp(x.agg+.2); } if(pick==='radioattivo'){ x.tol.r+=.3; x.rep*=.9; }
        if(pick==='intelligenza'){ x.intBonus+=.25; x.rep*=.92; } if(pick==='corazza'){ x.suscept*=.45; x.rep*=.88; } if(pick==='velenoso'){ x.suscept*=.6; x.agg=clamp(x.agg+.1); x.rep*=.92; }
        if(pick==='iperfertilita'){ x.rep*=1.5; x.suscept*=1.2; } if(pick==='bioluminescenza') x.suscept*=1.25;
        const why=['Radiazione media finora '+f2(radBase.reduce((a,b)=>a+b,0)/radBase.length)+' ('+LUCE[setup.luce].nome.toLowerCase()+').'];
        why.push('Tratti di '+x.nome.toLowerCase()+': '+(x.aff[pick]>=2?'molto portate':'portate')+' a questa mutazione.');
        { const pr=pick==='corazza'?(sp.some(y=>y.dieta==='insetti'&&y.alive)?'C’è un predatore nel vaso: chi ha un guscio più duro sopravvive.':(w<.35?'L’aria è secca: una cuticola più spessa trattiene l’acqua.':'')):pick==='bioluminescenza'?(s<.4?'Il vaso è buio: la luce propria serve.':''):pick==='iperfertilita'?(x.pop/x.K>.6?'Il vaso è affollato: chi fa più piccoli vince.':''):pick==='radioattivo'?'La radiazione del sasso seleziona chi la regge. Nessuna radiazione esce da loro.':pick==='velenoso'?'C’è chi li caccia: il veleno li difende.':''; if(pr) why.push(pr); why.push('Costo: ogni cambiamento si paga (riproduzione più lenta o più fragilità). Al massimo due per specie.'); }
        ev(d,'mutazione','🧬',M.txt(x.nome),why);
        if(pick==='gigantismo' && !x.sociale && !x.monster && x.pop>25){ x.monster=true; ev(d,'mostro','👹',x.nome+' giganti dominano il vaso.',['Mutazione gigante + popolazione alta ('+Math.round(x.pop)+').']); }
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
          else { wars.push({key,a,b,start:d,end:0}); warCount++;
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
    sp.forEach(x=>series.pop[x.id].push(x.alive?x.pop:0));
  }
  // ------ riassunto ------
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
  const Rm=radBase.reduce((a,b)=>a+b,0)/radBase.length;
  const socs=sp.filter(x=>x.society); const hasLog=k=>log.some(l=>l.kind===k); let finale;
  if(socs.some(x=>x.society.scisma)) finale='scisma'; else if(hasLog('pace')) finale='patto'; else if(log.some(l=>l.kind==='guerra'&&l.text.indexOf('La guerra finisce')===0)) finale='conquista';
  else if(socs.length){ const dom=socs.slice().sort((a,b)=>b.pop-a.pop)[0]; finale=CULT2FIN[dom.society.cult]||'tribu'; }
  else if(monsters.length) finale='gigante'; else if(!alive.length&&sp.length) finale='spento'; else finale='equilibrio';
  return {setup,days,log,series,headline,tipo,finale,sub:sub.join(' · '),societies,warCount,monsters:monsters.map(m=>m.id),extinct:extinct.map(x=>x.id),alive:alive.map(x=>x.id),Rm,sp:sp.map(x=>({id:x.id,nome:x.nome,pop:x.pop,alive:x.alive,mut:x.mut,gen:x.gen,X:x.X,society:x.society&&{name:x.society.name,cult:x.society.cult,since:x.society.since,vincitrice:!!x.society.vincitrice,scisma:!!x.society.scisma}}))};
}
function randomSetup(R_){ const pick=(arr,n)=>{ const a=arr.slice(),o=[]; for(let i=0;i<n&&a.length;i++){ o.push(a.splice(Math.floor(R_()*a.length),1)[0]); } return o; };
  return {luce:Math.floor(R_()*3),acqua:Math.floor(R_()*3),meteorite:1,piante:pick(Object.keys(PIANTE),1+Math.floor(R_()*3)),insetti:pick(Object.keys(SPECIE),1+Math.floor(R_()*3)),oggetti:pick(Object.keys(OGGETTI),Math.floor(R_()*3))}; }
function batch(n,days,seed){ const R_=rng(seed||7); const out={n,fin:{},tipo:{},cult:{},guerra:0,mut:{},luce:[{n:0,soc:0,mos:0,est:0,war:0},{n:0,soc:0,mos:0,est:0,war:0},{n:0,soc:0,mos:0,est:0,war:0}],t:[]};
  for(let i=0;i<n;i++){ const su=randomSetup(R_); const r=run(su,{days,seed:1000+i}); out.tipo[r.tipo]=(out.tipo[r.tipo]||0)+1; out.fin[r.finale]=(out.fin[r.finale]||0)+1; if(r.warCount) out.guerra++;
    const L=out.luce[su.luce]; L.n++; if(r.tipo==='societa') L.soc++; if(r.tipo==='mostro') L.mos++; if(r.tipo==='estinzione') L.est++; if(r.warCount) L.war++;
    r.sp.forEach(x=>{ if(x.society) out.cult[x.society.cult]=(out.cult[x.society.cult]||0)+1; x.mut.forEach(m=>out.mut[m]=(out.mut[m]||0)+1); });
    r.log.filter(l=>l.kind==='societa').forEach(l=>out.t.push(l.d)); }
  return out; }
const API={run,batch,randomSetup,rng,FINALI,RITMO,LUCE,ACQUA,METEO,PIANTE,SPECIE,OGGETTI,MUT,CULT,f1,f2};
if(typeof module!=='undefined') module.exports=API; else root.Terr=API;
})(typeof window!=='undefined'?window:this);
