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
// 6) power card «Salta 2 giorni» (strato app): dono giornaliero, tetto, letargo, decisione in sospeso, due giorni avanzati
{ const P=window.__app; P.newGame('T',JSON.parse(JSON.stringify(su))); P.popups.length=0;
  let pc=P.powerCards(); t('dono del primo giorno: 2 carte su 6',pc.salto===2&&pc.max===6&&pc.nuove===2,JSON.stringify(pc));
  pc=P.powerCards(); t('il dono non si ripete nello stesso giorno',pc.salto===2&&pc.nuove===2);
  P.G.dev.offset+=1; P.checkNewDay(); t('nuovo giorno: +2',P.G.power.salto===4);
  P.G.dev.offset+=1; P.checkNewDay(); P.G.dev.offset+=1; P.checkNewDay(); t('tetto a 6',P.G.power.salto===6&&P.powerCards().nuove===0);
  P.G.dev.offset+=5; P.popups.length=0; P.checkNewDay(); t('dopo 5 giorni di assenza resta 6: il dono non si accumula',P.G.power.salto===6);
  t('in letargo la carta si blocca',!!P.G.letargo&&P.usaSalto().ok===false&&P.powerCards().why==='letargo'&&P.G.power.salto===6);
  const settle=()=>{ let k=0; while(k++<20&&(P.sim.pending.length||P.sim.finalePending)){ if(P.sim.finalePending) P.closeChapter(); const q=P.sim.pending[0]; if(q) P.resolveDecision(q.id,q.type==='mutazione'?'proteggi':q.type==='societa'?'nascosto':'lascia'); } P.popups.length=0; };
  P.doAct('acqua'); t('una cura sveglia il vaso',!P.G.letargo); settle(); t('senza decisioni in sospeso la carta è usabile',P.powerCards().why==='',P.powerCards().why);
  const d0=P.sim.d, r=P.usaSalto(); t('due giorni avanzati',r.ok&&((r.passi===2&&P.sim.d===d0+2&&r.resto===0)||(r.pausa&&r.passi+r.resto===2)),JSON.stringify(Object.assign({},r,{eventi:r.eventi.length})));
  t('carta consumata, una sola notte viva in coda',P.G.power.salto===5&&P.popups.filter(p=>p.t==='notte').length<=1);
  let g=0; while(!P.sim.pending.length&&g++<400){ if(P.sim.finalePending) P.closeChapter(); P.autoCare(); P.passaNotte(); P.popups.length=0; }
  t('una decisione arriva',P.sim.pending.length>0,g); if(!P.sim.pending.length){ console.log(ok,'ok',bad+1,'falliti'); process.exit(1); }
  const rb=P.usaSalto(); t('con una decisione in sospeso la carta non si usa',rb.ok===false&&rb.why==='decisione'&&P.G.power.salto===5);
  const p0=P.sim.pending[0]; P.resolveDecision(p0.id,p0.type==='mutazione'?'proteggi':p0.type==='societa'?'nascosto':'lascia'); t('risolta la decisione la carta torna usabile',P.powerCards().why===''||P.powerCards().why==='finale');
  let resto=null; for(let gi=0;gi<12&&resto==null;gi++){ P.newGame('T',JSON.parse(JSON.stringify(su))); P.popups.length=0; for(let i=0;i<120&&resto==null;i++){ if(P.sim.finalePending) P.closeChapter(); if(P.sim.pending.length){ const q=P.sim.pending[0]; P.resolveDecision(q.id,'lascia'); } P.autoCare(); P.G.power.salto=6; const rr=P.usaSalto(); P.popups.length=0; if(rr.ok&&rr.pausa){ resto=rr.resto; const dd=P.sim.d, q=P.sim.pending[0]; P.resolveDecision(q.id,q.type==='mutazione'?'proteggi':q.type==='societa'?'nascosto':'lascia'); t('la notte rimasta si svolge da sola dopo la decisione',P.G.power.resto===0&&P.sim.d>=dd+resto,P.sim.d+' '+dd+' '+resto); } } }
  t('un salto interrotto da una decisione lascia 1 notte in sospeso',resto===1,resto);
  t('salvataggio e ripresa conservano le carte',(()=>{ P.persist(); const s=P.G.power.salto; P.loadSave(); return P.G.power.salto===s; })()); }
console.log(ok,'ok',bad,'falliti');
