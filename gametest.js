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
console.log(ok,'ok',bad,'falliti');
