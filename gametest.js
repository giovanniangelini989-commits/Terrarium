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
  const settle=()=>{ let k=0; while(k++<20&&(P.sim.pending.length||P.sim.finalePending)){ if(P.sim.finalePending){ P.closeChapter(); P.skipStart(); } const q=P.sim.pending[0]; if(q) P.resolveDecision(q.id,q.type==='mutazione'?'proteggi':q.type==='societa'?'nascosto':'lascia'); } P.popups.length=0; };
  P.doAct('acqua'); t('una cura sveglia il vaso',!P.G.letargo); settle(); t('senza decisioni in sospeso la carta è usabile',P.powerCards().why==='',P.powerCards().why);
  const d0=P.sim.d, r=P.usaSalto(); t('due giorni avanzati',r.ok&&((r.passi===2&&P.sim.d===d0+2&&r.resto===0)||(r.pausa&&r.passi+r.resto===2)),JSON.stringify(Object.assign({},r,{eventi:r.eventi.length})));
  t('carta consumata, una sola notte viva in coda',P.G.power.salto===5&&P.popups.filter(p=>p.t==='notte').length<=1);
  let g=0; while(!P.sim.pending.length&&g++<400){ if(P.sim.finalePending){ P.closeChapter(); P.skipStart(); } P.autoCare(); P.passaNotte(); P.popups.length=0; }
  t('una decisione arriva',P.sim.pending.length>0,g); if(!P.sim.pending.length){ console.log(ok,'ok',bad+1,'falliti'); process.exit(1); }
  const rb=P.usaSalto(); t('con una decisione in sospeso la carta non si usa',rb.ok===false&&rb.why==='decisione'&&P.G.power.salto===5);
  const p0=P.sim.pending[0]; P.resolveDecision(p0.id,p0.type==='mutazione'?'proteggi':p0.type==='societa'?'nascosto':'lascia'); t('risolta la decisione la carta torna usabile',P.powerCards().why===''||P.powerCards().why==='finale');
  let resto=null; for(let gi=0;gi<12&&resto==null;gi++){ P.newGame('T',JSON.parse(JSON.stringify(su))); P.popups.length=0; for(let i=0;i<120&&resto==null;i++){ if(P.sim.finalePending){ P.closeChapter(); P.skipStart(); } if(P.sim.pending.length){ const q=P.sim.pending[0]; P.resolveDecision(q.id,'lascia'); } P.autoCare(); P.G.power.salto=6; const rr=P.usaSalto(); P.popups.length=0; if(rr.ok&&rr.pausa){ resto=rr.resto; const dd=P.sim.d, q=P.sim.pending[0]; P.resolveDecision(q.id,q.type==='mutazione'?'proteggi':q.type==='societa'?'nascosto':'lascia'); t('la notte rimasta si svolge da sola dopo la decisione',P.G.power.resto===0&&P.sim.d>=dd+resto,P.sim.d+' '+dd+' '+resto); } } }
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
// 8) tempo e calendario (motore, docs/gameplay/tempo.md §1–5): una notte ogni 6 ore, letargo, salto nel calendario, mani, carta «Tempo in bottiglia», salvataggi vecchi, calendario()
{ const P=window.__app, dec=()=>{ let k=0; while(k++<20&&(P.sim.pending.length||P.sim.finalePending)){ if(P.sim.finalePending){ P.closeChapter(); P.skipStart(); } const q=P.sim.pending[0]; if(q) P.resolveDecision(q.id,q.type==='mutazione'?'proteggi':q.type==='societa'?'nascosto':'lascia'); } P.popups.length=0; };
  P.newGame('T',JSON.parse(JSON.stringify(su))); P.popups.length=0; const d0=P.sim.d; P.G.dev.offset+=1; P.checkNewDay(); dec(); t('un giorno della stanza = 4 notti del vaso',P.sim.d===d0+4,P.sim.d-d0);
  const o=P.orologio(); t('orologio(): quarto 0..3, prossima notte entro 6 ore',o.quarto>=0&&o.quarto<4&&o.prossimaNotteMs>0&&o.prossimaNotteMs<=6*3600000&&o.notti===4&&/^\d{4}-\d{2}-\d{2}$/.test(o.oggi.data),JSON.stringify(o));
  const d1=P.sim.d; P.G.dev.offset+=(o.prossimaNotteMs-60000)/864e5; const r0=P.checkNewDay(); t('un minuto prima della notte: niente',P.sim.d===d1&&r0===null,P.sim.d-d1);
  P.G.dev.offset+=120000/864e5; const r1=P.checkNewDay(); dec(); t('passata l’ora: una notte sola, popup notte-ora o risveglio',P.sim.d===d1+1&&r1&&r1.notti===1,JSON.stringify({d:P.sim.d-d1,r1}));
  P.popups.length=0; P.G.dev.offset+=.25; P.checkNewDay(); dec(); t('6 ore dopo: un’altra notte',P.sim.d===d1+2,P.sim.d-d1);
  // assenza di 3 giorni: 12 notti, 8 in letargo, i bisogni si fermano alle soglie
  const d2=P.sim.d; P.sim.setNeeds({um:.9,ter:.9,pul:.9}); P.G.dev.offset+=3; P.popups.length=0; P.checkNewDay(); dec(); const nd=P.sim.view().needs;
  t('3 giorni di assenza: 12 notti, letargo di 2 giorni',P.sim.d===d2+12&&!!P.G.letargo&&P.G.letargo.giorni===2,JSON.stringify({d:P.sim.d-d2,l:P.G.letargo}));
  t('in letargo i bisogni non scendono sotto le soglie',nd.um>=.3-1e-9&&nd.ter>=.2-1e-9&&nd.pul>=.5-1e-9,JSON.stringify(nd));
  const rowsL=P.G.cal.r.filter(r=>r[2]&2).length; t('il calendario segna i giorni dormiti',rowsL>=2,rowsL);
  P.doAct('acqua'); t('la cura sveglia il vaso e segna il risveglio',!P.G.letargo&&(P.G.cal.r[P.G.cal.r.length-1][2]&8)>0);
  // salto nel calendario
  dec(); P.G.power.salto=6; const cal0=P.calendario(), g0=cal0.mese.giorni.find(g=>g.oggi); const rs=P.usaSalto(); dec(); const g1=P.calendario().mese.giorni.find(g=>g.oggi);
  t('dopo un salto la casella di oggi ha 2 notti in più, viola',rs.ok&&g1.salti&&g1.notti>=g0.notti+2&&P.calendario().saltiOggi===2,JSON.stringify({rs:rs.ok,n0:g0.notti,n1:g1.notti,s:g1.salti}));
  // mani: 6 cure passano, la 7ª no; a bisogno basso passa gratis; dopo 20 minuti torna 1; livello 3 → 8; nuovo giorno → piene
  P.newGame('T',JSON.parse(JSON.stringify(su))); P.popups.length=0; P.G.req.done=true; P.sim.setNeeds({um:.9,ter:.9,pul:.9}); let okN=0; for(let i=0;i<6;i++){ const r=P.doAct('nutri'); if(r.ok&&!r.gratis) okN++; P.sim.setNeeds({ter:.9}); }
  const r7=P.doAct('nutri'); t('6 mani: sei cure passano, la settima no con i bisogni alti',okN===6&&r7.ok===false&&r7.why==='zero'&&P.mani().n===0&&P.mani().why==='zero',JSON.stringify({okN,r7:r7.why,m:P.mani()}));
  P.sim.setNeeds({um:.2}); const rg=P.doAct('acqua'); t('a zero mani la cura passa lo stesso se il vaso ha sete (gratis)',rg.ok&&rg.gratis===true,JSON.stringify(rg));
  P.G.real.cureT-=20*60000; t('dopo 20 minuti torna una mano',P.mani().n===1&&P.mani().minuti<=20,JSON.stringify(P.mani()));
  P.G.player.xp=P.XPT[2]; t('al livello 3 il massimo è 8',P.maniMax()===8&&P.mani().max===8); P.G.player.xp=P.XPT[4]; t('al livello 5 il massimo è 10',P.maniMax()===10); P.G.player.xp=0;
  P.G.dev.offset+=1; P.popups.length=0; P.checkNewDay(); dec(); t('nuovo giorno: mani piene',P.mani().n>=6,P.mani().n);
  P.sim.setNeeds({um:.97}); P.G.real.cure=6; const p0=P.sim.view().needs.pul; const rt=P.doAct('acqua'); t('troppa acqua: vetro appannato, pulizia −.05',rt.troppa===true&&P.sim.view().needs.pul<p0-.04&&P.sim.log.some(e=>e.icon==='🌫️'),JSON.stringify({rt,p0,p1:P.sim.view().needs.pul}));
  // carta «Tempo in bottiglia» → +2 salti, mai oltre 6
  P.G.mazzo.tempo=2; P.G.power.salto=5; P.playCard('tempo'); t('«Tempo in bottiglia» dà +2 salti entro il tetto 6',P.G.power.salto===6); P.G.power.salto=0; P.playCard('tempo'); t('… e +2 da zero',P.G.power.salto===2&&!P.G.mazzo.tempo);
  // salvataggio vecchio: via tempo e coda, calendario e mensola nascono
  P.persist(); const sv=JSON.parse(localStorage.getItem('terrario.save.v2')); sv.real.tempo=3; sv.real.tempoT=1; delete sv.real.lastSlot; sv.coda={n:0,slots:[]}; delete sv.cal; delete sv.vasi; delete sv.ui.vasoN; localStorage.setItem('terrario.save.v2',JSON.stringify(sv));
  t('un salvataggio vecchio si apre senza scorta tempo né banco, con calendario e mensola',P.loadSave()&&P.G.real.tempo===undefined&&P.G.coda===undefined&&Array.isArray(P.G.cal.r)&&Array.isArray(P.G.vasi)&&P.G.ui.vasoN===1&&typeof P.G.real.lastSlot==='number');
  const dv=P.sim.d; P.checkNewDay(); t('…e il tempo non corre all’indietro né fa scatti',P.sim.d===dv,P.sim.d-dv);
  // calendario(): un mese senza righe, poi un anno di gioco entro 5 KB
  let okCal=true, cv=null; try{ cv=P.calendario('2020-01'); }catch(e){ okCal=false; } t('calendario() di un mese vuoto: 31 giorni, nessun evento, nessuna eccezione',okCal&&cv.mese.giorni.length===31&&cv.mese.giorni.every(g=>!g.notti&&!g.eventi.length&&!g.visitato)&&cv.mese.primo===2,cv&&JSON.stringify(cv.mese.giorni[0]));
  P.G.dev.offset+=1; P.checkNewDay(); dec(); const cm=P.calendario(); t('calendario() del mese corrente ha oggi, notti e un’icona dove è successo qualcosa',cm.mese.giorni.some(g=>g.oggi)&&cm.mese.giorni.some(g=>g.notti>0)&&(cm.mese.giorni.some(g=>g.icona)||+String((cm.mese.giorni.find(g=>g.oggi)||{}).data||'').slice(8,10)<=4)&&cm.vaso.n===1,JSON.stringify(cm.mese.giorni.filter(g=>g.notti).map(g=>[g.data,g.notti,g.icona])));
  for(let i=0;i<365;i++){ P.G.dev.offset+=1; P.checkNewDay(); dec(); if((P.G.ui.fase||0)<1) P.doAct('terra'); if((P.G.ui.fase||0)<2) P.doAct('acqua'); P.inbox().forEach(a=>P.takeArrival(a.id,a.kind==='oggetto'?a.alt[0]:'si')); P.popups.length=0; }
  const cb=JSON.stringify(P.G.cal).length; t('un anno di calendario pesa meno di 5 KB',cb<=5000&&P.G.cal.r.length<=400,cb+' byte, '+P.G.cal.r.length+' righe'); P.persist(); console.log('calendario dopo un anno:',cb,'byte ·',P.G.cal.r.length,'righe · vasi',P.G.vasi.length,'· salvataggio',Math.round(localStorage.getItem('terrario.save.v2').length/1024),'KB');
  const sumD=P.G.vasi.reduce((a,v)=>a+v.dv,0)+P.sim.d; t('in un anno il vaso ha vissuto 4 notti al giorno (meno le pause delle decisioni)',sumD>=366*4-40&&sumD<=366*4+4,sumD);
  // diario della storia
  t('il diario della storia scrive pagine nel quaderno',P.G.quaderno.some(p=>/^diario-/.test(p.id)),P.G.quaderno.length); }
// 9) fine del vaso: si riparte dal sasso (tempo.md §7)
{ const P=window.__app; P.newGame('T',JSON.parse(JSON.stringify(su))); P.popups.length=0; let g=0; while(!P.sim.finalePending&&g++<600){ if(P.sim.pending.length){ const q=P.sim.pending[0]; P.resolveDecision(q.id,q.type==='mutazione'?'proteggi':q.type==='societa'?'nascosto':'lascia'); } P.autoCare(); P.passaNotte(); P.popups.length=0; }
  t('arriva un finale',!!P.sim.finalePending,g); if(!P.sim.finalePending){ console.log(ok,'ok',bad+1,'falliti'); process.exit(1); }
  const before={libro:JSON.stringify(P.G.libro),codex:JSON.stringify(P.G.codex),serie:P.G.player.serie,salto:P.G.power.salto,gatto:P.G.ui.gatto,mazzo:P.mazzoTot(),met:P.sim.view().setup.meteorite,cap:P.sim.view().chapter,d:P.sim.d,luce:P.sim.view().setup.luce,pag:P.G.quaderno.length,cal:P.G.cal.r.length};
  const r=P.closeChapter(); const v=P.sim.view(), fam=P.T.FINALI[r.k].fam;
  t('closeChapter() restituisce il vaso archiviato',r.vaso&&r.vaso.k===r.k&&r.vaso.dv===before.d&&r.vaso.n===1&&Array.isArray(r.vaso.nodi)&&r.vaso.nodi.length<=24,JSON.stringify(r.vaso&&{k:r.vaso.k,dv:r.vaso.dv,n:r.vaso.n,nodi:r.vaso.nodi.length}));
  t('dentro il vetro resta solo il sasso: niente specie, piante, oggetti',v.sp.length===0&&v.plants.length===0&&v.setup.oggetti.length===0&&v.setup.piante.length===0&&v.setup.insetti.length===0);
  t('terra e acqua a zero (Quiete: terra già un po’ umida)',v.needs.ter===0&&(fam==='Quiete'?v.needs.um>=.3-1e-9:v.needs.um===0),JSON.stringify(v.needs)+' '+fam);
  t('giorno 0, capitolo +1, stesso meteorite e stessa luce, fase 0',P.sim.d===0&&v.chapter===before.cap+1&&v.setup.meteorite===before.met&&v.setup.luce===before.luce&&P.G.ui.fase===0&&P.G.ui.vasoN===2&&P.G.req.kind==='terra');
  t('la mensola ha un vaso con il finale giusto',P.G.vasi.length===1&&P.G.vasi[0].k===r.k&&P.G.vasi[0].dv===before.d);
  t('album +1 carta; libro, codex, serie, salti e Biscotto invariati',P.mazzoTot()===before.mazzo+1&&!!P.G.libro[r.k]&&JSON.stringify(P.G.codex)===before.codex&&P.G.player.serie===before.serie&&P.G.power.salto===before.salto&&P.G.power.resto===0&&P.G.ui.gatto===before.gatto);
  t('albero nuovo con il solo nodo d’inizio, nessuna decisione in sospeso, quaderno conservato',P.G.tree.nodes.length<=2&&P.G.tree.nodes[0].k==='inizio'&&P.sim.pending.length===0&&P.G.quaderno.length>=before.pag+1&&P.G.quaderno.some(p=>p.id==='vaso-2'&&p.vaso===2)&&P.G.quaderno.length<=240);
  t('il calendario segna il vaso nuovo',(P.G.cal.r[P.G.cal.r.length-1][2]&16)>0&&P.calendario().vaso.n===2&&P.calendario().mese.giorni.some(g=>g.nuovoVaso));
  t('l’eredità del finale è annotata',P.G.ui.eredita&&P.G.ui.eredita.fam===fam&&typeof P.G.ui.eredita.testo==='string'&&P.G.ui.eredita.testo.length>10,JSON.stringify(P.G.ui.eredita));
  P.persist(); t('salvataggio e ripresa conservano mensola, fase e vaso nuovo',P.loadSave()&&P.G.vasi.length===1&&P.G.ui.fase===0&&P.sim.d===0&&P.sim.view().chapter===before.cap+1&&P.G.ui.vasoN===2);
  P.popups.length=0; const r1=P.doAct('terra'); const r2=P.doAct('acqua'); t('terra e acqua: si riparte (fase 2) e il muschio bussa',r1.ok&&r2.ok&&P.G.ui.fase===2&&P.inbox().some(a=>a.kind==='pianta'&&a.param==='muschio'),JSON.stringify({f:P.G.ui.fase,inbox:P.inbox().map(a=>a.param)}));
  const am=P.inbox()[0]; P.takeArrival(am.id,'si'); t('accolto il muschio il vaso nuovo vive (fase 3)',P.G.ui.fase===3&&P.sim.view().plants.some(p=>p.id==='muschio'));
  for(let i=0;i<12;i++){ P.passaNotte(); P.inbox().forEach(a=>P.takeArrival(a.id,'si')); P.popups.length=0; } t('felce e formiche arrivano: fase 4, eredità esaurita',P.G.ui.fase===4&&P.G.ui.eredita==null&&P.sim.view().sp.some(x=>x.id==='formiche'),P.G.ui.fase);
  // eredità per famiglia (archiviaVaso diretto)
  P.archiviaVaso({k:'equilibrio'}); t('Quiete → la terra nuova parte umida (.3)',P.sim.view().needs.um>=.3-1e-9&&P.G.ui.vasoN===3,P.sim.view().needs.um);
  P.archiviaVaso({k:'gigante'}); t('Mostri → il sasso parte carico (E 40)',P.sim.E===40&&P.sim.view().needs.um===0,P.sim.E);
  P.archiviaVaso({k:'conquista'}); P.doAct('terra'); P.doAct('acqua'); P.inbox().forEach(a=>P.takeArrival(a.id,'si')); const fa=P.G.arrivi.list.find(a=>a.force==='formiche'); t('Conflitti → la prima specie arriva un giorno prima',fa&&fa.due===P.G.ui.d3+6,JSON.stringify(fa));
  for(let i=0;i<8;i++) P.archiviaVaso({k:'fede'}); P.persist(); const kb=localStorage.getItem('terrario.save.v2').length; t('dopo 12 vasi il salvataggio resta leggero (< 60 KB)',P.G.vasi.length===12&&kb<60000,kb); console.log('mensola di 12 vasi:',JSON.stringify(P.G.vasi).length,'byte · salvataggio',Math.round(kb/1024),'KB'); }
// 9) ritorno: «Mentre non c'eri», dono della nonna, Avanza di una notte, carta ogni 7 giorni di cura
{ const P=window.__app; P.newGame('T',JSON.parse(JSON.stringify(su))); P.popups.length=0; P.G.ui.fase=5; const dec=()=>{ let g=0; while(P.sim.pending.length&&g++<20){ const d=P.sim.pending[0]; P.sim.resolve?P.sim.resolve(d.id,'lascia'):0; if(P.sim.pending[0]===d) break; } };
  // 1+2) assenza di 3 giorni: un solo risveglio con notti, un solo dono, nessun accumulo
  P.G.dev.offset+=3; P.popups.length=0; P.checkNewDay();
  const rv=P.popups.filter(p=>p.t==='risveglio'), dn=P.popups.filter(p=>p.t==='dono');
  t('ritorno: un solo foglio risveglio con il numero di notti',rv.length===1&&rv[0].notti>=4&&rv[0].giorni>=3,JSON.stringify(rv.map(x=>[x.notti,x.giorni])));
  t('dono della nonna: uno solo dopo 3 giorni di assenza, in seconda persona',dn.length===1&&dn[0].testo.length>20&&P.G.nonna.n===1,JSON.stringify(dn));
  P.popups.length=0; P.checkNewDay(); P.donoNonna(); t('stesso giorno: nessun secondo dono',!P.popups.some(p=>p.t==='dono')&&P.G.nonna.n===1);
  P.G.dev.offset+=1; P.popups.length=0; P.checkNewDay(); t('il giorno dopo: un altro dono, senza serie',P.G.nonna.n===2&&P.popups.filter(p=>p.t==='dono').length===1&&P.G.nonna.serie===undefined);
  const ids=new Set(); for(let i=0;i<12;i++){ P.G.dev.offset+=1; P.popups.length=0; P.checkNewDay(); ids.add(P.G.nonna.id); P.doAct('pulisci'); } t('i doni variano (a chi cura il vaso)',ids.size>=3,[...ids].join());
  // 3) Avanza di una notte
  P.G.dev.offset+=1; P.checkNewDay(); P.popups.length=0; P.sim.pending.length=0; P.G.letargo=null; P.G.real.owed=0; P.G.power.resto=0; let ai=P.avanzaInfo();
  const d0=P.sim.d; let okN=0; for(let i=0;i<5;i++){ const r=P.avanzaNotte(); if(r.ok) okN++; P.sim.pending.length=0; P.G.real.owed=0; }
  t('avanza: tetto di '+P.AVANZA.max+' notti per apertura',okN===P.AVANZA.max&&P.sim.d-d0>=P.AVANZA.max&&P.avanzaInfo().why==='tetto',okN+' '+JSON.stringify(P.avanzaInfo()));
  P.G.dev.offset+=40/1440; P.checkNewDay(); t('avanza: dopo 30 minuti di chiusura il tetto si ricarica',P.avanzaInfo().n===0&&P.avanzaInfo().why==='');
  P.G.letargo={da:1,giorni:2}; t('avanza: bloccato in letargo',P.avanzaNotte().ok===false&&P.avanzaInfo().why==='letargo'); P.G.letargo=null;
  // 4) carta di cura ogni 7 giorni reali con almeno una cura
  P.G.carte=null; P.G.album={}; P.popups.length=0; let carte=0; for(let g=0;g<14;g++){ P.G.dev.offset+=1; P.checkNewDay(); P.doAct('acqua'); P.doAct('pulisci'); carte+=P.popups.filter(p=>p.t==='carta'&&p.fonte==='cura').length; P.popups.length=0; }
  t('carta di cura: 14 giorni con cure → 2 pesche (7° e 14°)',carte===2&&P.G.carte.giorniCura===14,carte+' '+JSON.stringify(P.G.carte));
  P.G.dev.offset+=1; P.checkNewDay(); P.popups.length=0; P.G.dev.offset+=1; P.checkNewDay(); t('i giorni senza cure non contano',P.G.carte.giorniCura===14);
}
// 10) missioni e gocce: 3 attive, mai impossibili, si sostituiscono, le gocce comprano notti e salti
{ const P=window.__app, S2=window.__story; P.newGame('M',JSON.parse(JSON.stringify(su))); P.popups.length=0; P.G.ui.fase=5; P.G.arrivi={list:[],n:0};
  let m=P.missioni(); t('missioni: 3 attive, con titolo e premio',m.att.length===3&&m.att.every(a=>a.titolo.length>8&&a.g>=1&&a.n>=1),JSON.stringify(m.att.map(a=>a.k)));
  t('missioni: tipi diversi tra loro',new Set(m.att.map(a=>a.k)).size===3);
  P.G.ui.fase=3; P.G.miss=null; t('missioni: prima della fase 4 non ce ne sono',P.missioni().att.length===0); P.G.ui.fase=5;
  // una missione impossibile si cambia da sola, in silenzio, senza perdere gocce
  P.G.miss=null; P.G.miss=null; let M=P.missioni(); const vivi=M.att.find(a=>a.k==='vivi'||a.k==='osserva'); P.G.miss.att[0]={k:'vivi',x:'termiti',p:1,n:3,g:3,base:0}; const g0=P.G.miss.gocce; P.missioni();
  t('missioni: specie estinta → missione sostituita da sola, gocce intatte',P.G.miss.att.length===3&&!P.G.miss.att.some(a=>a.x==='termiti')&&P.G.miss.gocce===g0&&P.G.miss.cambiate>=1);
  // completamento: cure x3 → gocce, popup, sostituzione, cooldown
  P.G.miss.att[0]={k:'cure',x:null,p:0,n:3,g:2,base:0}; P.G.miss.att=P.G.miss.att.slice(0,1); P.G.real.cure=9; const gg=P.G.miss.gocce; for(let i=0;i<3;i++) P.doAct('acqua');
  t('missioni: 3 cure completano la missione (+2 gocce, popup, nuova missione)',P.G.miss.gocce>=gg+2&&P.popups.some(p=>p.t==='missione')&&P.G.miss.att.length===3&&P.G.miss.fatte>=1&&P.G.miss.recenti[0]==='cure',JSON.stringify(P.G.miss));
  t('missioni: la stessa non ricompare subito',!P.G.miss.att.some(a=>a.k==='cure'));
  // le missioni non hanno scadenza: dopo 20 giorni di assenza sono ancora lì
  const ids=P.G.miss.att.map(a=>a.k+a.x).join(); P.G.dev.offset+=20; P.checkNewDay(); P.popups.length=0; P.G.letargo=null; const m2=P.missioni(); t('missioni: nessuna scadenza né perdita dopo l’assenza',m2.att.length===3&&m2.gocce>=gg+2);
  // il progresso nasce dal vaso: notti con l'umidità giusta
  P.G.miss.oggi=null; P.G.miss.att[0]={k:'umidita',x:null,p:0,n:3,g:3,base:0}; P.sim.setNeeds({um:.6}); P.passaNotte(); P.sim.pending.length=0; P.passaNotte(); P.sim.pending.length=0; t('missioni: più notti nello stesso giorno contano una volta sola',P.G.miss.att[0].p===1); for(let i=0;i<4;i++){ P.G.dev.offset+=1; P.sim.setNeeds({um:.6}); P.passaNotte(); P.sim.pending.length=0; } t('missioni: 3 giorni con umidità giusta completano «umidità»',P.G.miss.recenti.includes('umidita'),JSON.stringify(P.G.miss.att.map(a=>[a.k,a.p])));
  { const Q=P.G.miss; Q.oggi={t:P.todayIdx(),n:P.MISS.alGiorno}; Q.att.pop(); P.missioni(); t('missioni: al massimo '+P.MISS.alGiorno+' al giorno, poi il posto resta libero fino a domani',Q.att.length===2&&P.missioni().riposo); P.G.dev.offset+=1; t('missioni: il giorno dopo il posto si riempie',P.missioni().att.length===3); }
  // spesa
  P.G.miss.gocce=2; t('spesa: poche gocce → rifiuto, nulla cambia',P.missSpendi('avanza').why==='gocce'&&P.G.miss.gocce===2);
  P.G.miss.gocce=20; P.G.power.salto=0; P.G.miss.pronte=0; const r1=P.missSpendi('avanza'), r2=P.missSpendi('salto'); t('spesa: notte e salto in più, gocce scalate',r1.ok&&r2.ok&&P.G.power.salto===1&&P.G.miss.pronte===1&&P.G.miss.gocce===20-P.MISS.costo.avanza-P.MISS.costo.salto);
  P.G.power.salto=P.MISS.tetti.salto; t('spesa: tetto dei salti',P.missSpendi('salto').why==='tetto');
  P.G.miss.pronte=0; P.G.dev.offset+=1; P.checkNewDay(); P.popups.length=0; P.sim.pending.length=0; P.G.real.owed=0; P.G.power.resto=0; P.G.letargo=null; P.G.ui.avanza={n:P.AVANZA.max,visto:P.nowMs()}; t('avanza: tetto raggiunto senza notti comprate',P.avanzaInfo().why==='tetto');
  P.G.miss.gocce=10; P.missSpendi('avanza'); const n0=P.G.ui.avanza.n; const ra=P.avanzaNotte(); t('avanza: una notte comprata supera il tetto, senza cambiare il contatore di visita',ra.ok&&P.G.ui.avanza.n===n0&&P.G.miss.pronte===0,JSON.stringify(ra)+P.G.miss.pronte);
  t('missioni: salvataggio leggero',JSON.stringify(P.G.miss).length<700,JSON.stringify(P.G.miss).length);
}
// biologia di fondo (motore): collemboli, regina e covata, sciame, larve di mosca
{ const mk=(ins,o)=>S.createSim(Object.assign({luce:1,acqua:1,meteorite:1,piante:['muschio','felce'],insetti:ins,oggetti:[]},o||{}),{seed:4,game:true,needs:true});
  const txt=(sim,re)=>sim.log.some(l=>re.test(l.text));
  const A=mk(['formiche','mosche']); t('bio: view().bio ha collemboli, formiche, termiti, mosche',(()=>{ const b=A.view().bio; return b&&typeof b.collemboli==='number'&&b.formiche&&b.termiti===null; })());
  A.steps(1); const b0=A.view().bio; t('bio: formiche con regina e covata, mosche con larve, termiti null',b0.formiche&&b0.formiche.regina===true&&b0.formiche.covata.uova>0&&b0.mosche&&b0.mosche.larve>0&&b0.termiti===null,JSON.stringify(b0));
  const N=S.createSim({luce:1,acqua:1,piante:['muschio'],insetti:['formiche'],oggetti:[]},{seed:4,game:true}); N.steps(5); t('bio: senza needs view().bio è null',N.view().bio===null);
  // collemboli: crescono con umido e muffa, calano col secco
  const C=mk(['formiche']); for(let i=0;i<30;i++){ C.setNeeds({um:.9}); C.step(); } const c1=C.view().bio.collemboli; t('bio: i collemboli crescono nell’umido con la muffa',c1>=20&&txt(C,/collemboli/),c1);
  C.setTappo(true); for(let i=0;i<40;i++){ C.setNeeds({um:.1,ter:.3}); C.step(); } t('bio: col secco i collemboli calano',C.view().bio.collemboli<c1/2,c1+'→'+C.view().bio.collemboli);
  // regina: senza di lei la colonia non cresce e invecchia; con una nuova riparte
  const Q=mk(['formiche']); const cura=(sim,n)=>{ for(let i=0;i<n;i++){ if(i%3===0){ sim.act('nutri'); sim.act('acqua'); } sim.step(); } }; cura(Q,10); const p0=Q.sp[0].pop; t('bio: setRegina(false) toglie la regina',Q.setRegina(false)&&Q.view().bio.formiche.regina===false);
  cura(Q,8); const f1=Q.view().bio.formiche.covata; t('bio: senza regina la covata si esaurisce e la colonia cala',f1.uova<.2&&Q.sp[0].pop<p0,p0.toFixed(1)+'→'+Q.sp[0].pop.toFixed(1)+' '+JSON.stringify(f1));
  Q.setRegina(true); cura(Q,10); t('bio: con la regina tornano le uova',Q.view().bio.formiche.covata.uova>0);
  const Q2=mk(['formiche']); cura(Q2,5); Q2.setRegina(false); cura(Q2,45); t('bio: una regina nuova arriva da sola, con una riga nel quaderno',Q2.view().bio.formiche.regina===true&&txt(Q2,/regina alata/));
  // termiti: sciame dopo umido con colonia grande
  const T=mk(['termiti'],{acqua:2,piante:['fungo','muschio']}); let sciame=false; for(let i=0;i<150;i++){ if(i%3===0) T.act('acqua'); if(i%3===1) T.act('nutri'); T.step(); if(T.view().bio.termiti&&T.view().bio.termiti.sciame) sciame=true; } t('bio: le termiti sciamano dopo l’umido (evento in seconda persona)',sciame&&txt(T,/ti sbattono contro il vetro/),T.view().bio.termiti&&JSON.stringify(T.view().bio.termiti));
  // mosche: le larve nutrono i predatori
  const M=mk(['mosche','ragni'],{piante:['felce']}); for(let i=0;i<40;i++){ if(i%3===0){ M.act('nutri'); M.act('acqua'); } M.step(); } t('bio: larve di mosca, e una riga quando compaiono',M.view().bio.mosche&&txt(M,/larve bianche/),JSON.stringify(M.view().bio.mosche));
  // salvataggio
  const S1=JSON.stringify(Q.view().bio), Q3=mk([]); Q3.load(JSON.parse(JSON.stringify(Q.save()))); t('bio: la covata e la regina si salvano col vaso',JSON.stringify(Q3.view().bio)===S1);
}
console.log(ok,'ok',bad,'falliti');
