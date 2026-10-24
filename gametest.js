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
// 7) microclima (ecologo): troppa acqua → ristagno, sole col tappo chiuso → caldo, muffa che nasce e si combatte, tappo e salvataggio
{ const mk=(o)=>S.createSim(Object.assign({luce:1,acqua:1,meteorite:1,piante:['muschio','felce','succulenta'],insetti:['formiche'],oggetti:[]},o||{}),{seed:4,game:true,needs:true});
  const has=(sim,ic)=>sim.log.some(e=>e.icon===ic);
  // troppa acqua: cinque bicchieri di fila
  const W=mk(), C=mk(); for(let i=0;i<5;i++) W.act('acqua'); W.steps(4); C.steps(4);
  const pv=(x,id)=>x.view().plants.find(p=>p.id===id).v;
  t('troppa acqua: il drenaggio si riempie e arriva il ristagno',W.view().clima.drenaggio>.85&&W.view().clima.ristagno>.4,JSON.stringify(W.view().clima));
  t('troppa acqua: avviso «acqua ferma tra i sassolini»',has(W,'🫧'));
  t('troppa acqua: la succulenta marcisce più del vaso curato',pv(W,'succulenta')<pv(C,'succulenta')*.5,pv(W,'succulenta').toFixed(2)+' '+pv(C,'succulenta').toFixed(2));
  W.setTappo(true); W.steps(8); t('col tappo aperto il ristagno passa',W.view().clima.ristagno<.2,W.view().clima.ristagno);
  // sole diretto col tappo chiuso: serra
  const Sc=mk({luce:2}), So=mk({luce:2}), M=mk({luce:1}); So.setTappo(true); for(let i=0;i<4;i++){ [Sc,So,M].forEach(x=>{ x.setNeeds({um:.6}); x.step(); }); }
  t('sole e tappo chiuso: dentro fa caldo (serra)',Sc.view().clima.T>=28&&has(Sc,'🌡️'),Sc.view().clima.T);
  t('sole e tappo aperto: meno caldo',So.view().clima.T<Sc.view().clima.T&&!has(So,'🌡️'),So.view().clima.T);
  t('la felce soffre il caldo della serra',pv(Sc,'felce')<pv(So,'felce')-.1,pv(Sc,'felce').toFixed(2)+' '+pv(So,'felce').toFixed(2));
  // muffa: chiuso, umido, nessuna cura → cresce; aperto + pulito → cala; i collemboli arrivano da soli
  const F=mk({acqua:2}); F.setNeeds({um:.85,pul:.9}); const m0=F.view().muffa; F.steps(10); const m1=F.view().muffa;
  t('muffa: nel chiuso umido cresce da sola',m1>m0+.2,m0.toFixed(2)+'→'+m1.toFixed(2));
  const G2=mk({acqua:2}); G2.setNeeds({um:.85,pul:.9}); G2.setTappo(true); G2.steps(10); t('muffa: col tappo aperto cresce molto meno',G2.view().muffa<m1-.15,G2.view().muffa.toFixed(2));
  for(let i=0;i<5;i++){ F.setNeeds({um:.85}); F.steps(3); } t('muffa: arrivano i collemboli e lo racconta',F.view().clima.collemboli>.1&&has(F,'🔬'),JSON.stringify(F.view().clima));
  F.act('pulisci'); F.setTappo(true); const m2=F.view().muffa; F.steps(6); t('muffa: aria, pulizia e collemboli la fanno calare',F.view().muffa<m2,m2.toFixed(2)+'→'+F.view().muffa.toFixed(2));
  // salvataggio del motore: il clima si conserva
  const s1=JSON.stringify(F.view().clima), F2=S.createSim({luce:1,acqua:1,piante:[],insetti:[],oggetti:[]},{seed:1,game:true,needs:true}); F2.load(JSON.parse(JSON.stringify(F.save()))); t('il clima si salva col vaso',JSON.stringify(F2.view().clima)===s1);
  // strato app: __app.micro(), __app.tappo(), G.micro, salvataggi vecchi
  const P=window.__app; P.newGame('T',JSON.parse(JSON.stringify(su))); P.popups.length=0; const mv=P.micro();
  t('__app.micro() dà condensa, temperatura e muffa per zona',mv&&mv.condensa&&mv.T&&mv.muffa&&mv.clima&&typeof mv.aria.rh==='number',JSON.stringify(mv&&Object.keys(mv)));
  const tp=P.tappo(true); t('__app.tappo(true) apre il vaso',tp.tappo==='aperto'&&P.sim.view().clima.aperto&&P.micro().tappo==='aperto');
  P.tappo(false); P.passaNotte(); P.popups.length=0; t('un giorno del vaso = 6 ore del microclima',P.micro().t>=6,P.micro().t);
  P.persist(); t('G.micro nel salvataggio, leggero',!!P.G.micro&&JSON.stringify(P.G.micro).length<4000,JSON.stringify(P.G.micro||'').length);
  const sv=JSON.parse(localStorage.getItem('terrario.save.v2')); delete sv.micro; localStorage.setItem('terrario.save.v2',JSON.stringify(sv)); t('un salvataggio vecchio senza microclima si apre',P.loadSave()&&!!P.micro()&&!!P.G.micro);
  P.doAct('acqua'); t('le cure passano al microclima',P.micro().aperto===true); }
console.log(ok,'ok',bad,'falliti');
