const S=require('./sim.js'); let ok=0,bad=0; const t=(n,c,x)=>{ if(c){ok++;} else {bad++; console.log('✗',n,x||'');} };
const su={luce:1,acqua:1,meteorite:1,piante:['muschio','felce','fungo'],insetti:['formiche'],oggetti:['statuina']};
// 1) salvataggio e ripresa: stessi risultati di una partita continua
const A=S.createSim(su,{seed:11,game:true}); A.steps(40); const snap=A.save(); A.steps(60); const contA=JSON.stringify(A.save());
const B=S.createSim({luce:0,acqua:0,piante:['muschio'],insetti:[],oggetti:[]},{seed:1,game:true}); B.load(JSON.parse(JSON.stringify(snap))); B.steps(60); const contB=JSON.stringify(B.save());
t('salva/riprendi identico',contA===contB);
// 2) decisioni mettono in pausa il tempo
const D=S.createSim({...su,luce:2},{seed:5,game:true,decisions:true}); let paused=0; for(let i=0;i<120;i++){ const r=D.step(); if(r.paused){ paused++; const p=D.pending[0]; const before=D.d; D.step(); t('in pausa il giorno non avanza',D.d===before); D.resolve(p.id,p.type==='mutazione'?'proteggi':'mostrati'); } }
t('almeno una decisione comparsa',paused>0,paused);
// 3) aggiungere/rimuovere
const G=S.createSim(su,{seed:3,game:true}); G.steps(10);
t('aggiungi specie',G.addSpecies('termiti')&&G.view().sp.some(x=>x.id==='termiti')); t('niente doppioni',!G.addSpecies('termiti'));
t('rimuovi specie',G.removeSpecies('termiti')&&!G.view().sp.some(x=>x.id==='termiti'));
t('aggiungi oggetto',G.addObject('orologio')&&G.view().setup.oggetti.includes('orologio')); G.steps(20); t('il vaso continua dopo i cambi',G.d===30);
t('azioni',G.act('pulisci')!==''&&G.act('acqua')!==''&&G.act('nutri')!=='');
// 4) un finale arriva, si chiude il capitolo, il vaso continua
const F=S.createSim({...su,luce:1},{seed:2,game:true,decisions:true}); let guard=0,fin=null; while(!F.finalePending&&guard<400){ guard++; const r=F.step(); if(r.paused){ const p=F.pending[0]; F.resolve(p.id,p.type==='mutazione'?'proteggi':'nascosto'); } }
t('arriva un finale',!!F.finalePending,guard); if(F.finalePending){ const d0=F.d, c0=F.chapter; const fp=F.closeChapter(); t('capitolo chiuso',F.chapter===c0+1&&!F.finalePending&&fp.finale); F.steps(10); t('il vaso continua dopo il finale',F.d===d0+10); console.log('finale',fp.finale,'al giorno del vaso',fp.d,'(≈ giorno reale',Math.ceil(fp.d/4)+')'); }
// 5) serie e protezione (strato app): serie 7, salto 2 giorni
{ global.window=global; global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}}; global.document={querySelector:()=>null,createElement:()=>({}),body:{appendChild(){}}}; global.Terr=S; require('./app/story.js'); require('./app/app1.js'); const P=window.__app;
  const prova=(usa)=>{ P.newGame('T',JSON.parse(JSON.stringify(su))); P.G.player.serie=7; P.G.player.serieMax=7; P.G.player.protezioni=1; P.G.player.lastReqDay=P.todayIdx(); P.G.dev.offset+=3; P.popups.length=0; P.checkNewDay(); const pop=P.popups.some(p=>p.t==='serie');
    if(usa&&pop){ P.G.player.protezioni--; P.G.player.lastReqDay=P.todayIdx()-1; } /* come 'serie-usa' in app3.js */
    P.G.req={day:P.todayIdx(),kind:'osserva',done:false}; P.reqCheck('osserva'); return {pop,serie:P.G.player.serie,prot:P.G.player.protezioni}; };
  const a=prova(true); t('serie 7 + protezione + richiesta = 8',a.pop&&a.serie===8&&a.prot===0,JSON.stringify(a));
  P.G.dev.offset+=1; P.popups.length=0; P.checkNewDay(); t('dopo la protezione il popup non torna',!P.popups.some(p=>p.type==='serie'||p.t==='serie'));
  const b=prova(false); t('senza protezione la serie riparte da 1',b.serie===1,JSON.stringify(b));
  P.G.player.protezioni=0; P.G.player.serie=7; P.G.player.lastReqDay=P.todayIdx()-5; P.popups.length=0; P.checkNewDay(); P.G.req={day:0,kind:'osserva',done:false}; P.reqCheck('osserva'); t('senza protezioni la serie riparte da 1',P.G.player.serie===1&&!P.popups.some(p=>p.t==='serie')); }
console.log(ok,'ok',bad,'falliti');
