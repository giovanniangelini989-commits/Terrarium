global.window=global; global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}}; global.document={querySelector:()=>null,createElement:()=>({}),body:{appendChild(){}}};
global.Terr=require('../sim.js'); require('./story.js'); require('./app1.js'); const A=window.__app, T=A.T, S=A.S;
const setups=[{luce:1,acqua:1,meteorite:1,piante:['muschio','felce'],insetti:['formiche'],oggetti:['statuina']},{luce:2,acqua:1,meteorite:1,piante:['muschio','felce'],insetti:['formiche'],oggetti:[]},{luce:0,acqua:2,meteorite:1,piante:['muschio','felce'],insetti:['formiche'],oggetti:['orologio']},{luce:1,acqua:0,meteorite:1,piante:['muschio','felce'],insetti:['formiche'],oggetti:['specchio']}];
function finite(o,path=''){ for(const k in o){ const v=o[k]; if(typeof v==='number'&&!isFinite(v)) return path+k; if(v&&typeof v==='object'){ const r=finite(v,path+k+'.'); if(r) return r; } } return null; }
const decide=(p,mode,day)=>{ if(p.type==='mutazione') return mode==='caos'?['proteggi','rimuovi','lascia'][day%3]:'proteggi'; if(p.type==='societa') return mode==='mostrati'?'mostrati':'nascosto'; if(p.type==='guerra'){ const m=A.sim.view().setup.oggetti.includes('moneta'); return mode==='caos'?(m?'patto':['separa','lascia'][day%2]):'lascia'; } return 'lascia'; };
function resolveAll(mode,day){ let g=0; while(A.sim.pending.length&&g++<12){ const p=A.sim.pending[0]; A.resolveDecision(p.id,decide(p,mode,day)); } }
function arrivals(mode,day){ A.inbox().forEach(a=>{ const no=(mode==='caos'&&day%3===0); if(no) A.takeArrival(a.id,'no'); else A.takeArrival(a.id,a.kind==='oggetto'?a.alt[day%a.alt.length]:'si'); }); }
function care(mode,burst){ const n=A.sim.view().needs; for(let b=0;b<(burst||1);b++){ const v=A.sim.view().needs; if(v.um<.6) A.doAct('acqua'); if(v.ter<.5) A.doAct('nutri'); if(v.pul<.7) A.doAct('pulisci'); } A.refreshReq(true); if(A.G.req.kind==='osserva'&&mode!=='passivo') A.osserva(); if(mode==='caos'&&Math.random()<.4) A.doAct(['pulisci','acqua','nutri'][Math.floor(Math.random()*3)]); }
function biscotto(mode,day){ if(A.popups.some(p=>p.t==='biscotto')){ A.biscottoOutcome(mode==='caos'?['pallina','davanzale','scaduto'][day%3]:'pallina'); } }
let gap=0, cardTot=0, cardSpec=0, cardErr=0, spentoDays=[];
function fin(mode){ if(A.sim.finalePending){ const k=A.sim.finalePending.finale; const r=A.closeChapter(); const c=A.CARTE[r.carta]; if(!c){ cardErr++; return; } cardTot++; if(c.r==='speciale'){ cardSpec++; gap=0; } else { gap++; if(gap>8){ cardErr++; console.log('GARANZIA VIOLATA'); } } } }
function check(v,pn,si,seed,day,st){ const bad=finite(v); if(bad){ st.nan++; if(st.nan<3) console.log('NaN in',bad,pn,si,seed,day); }
  const n=v.needs; if(Object.values(n).some(x=>x<-1e-9||x>1+1e-9)){ st.errs++; if(st.errs<3) console.log('BISOGNO FUORI SCALA',JSON.stringify(n)); } if(A.G.real.owed<0) st.errs++; if(v.pending.length>3) st.stuck++; if(v.setup.meteorite>2){ st.errs++; }
  A.sim.log.slice(-6).forEach(e=>{ const t=S.narra(e); if(!t||typeof t!=='string'||/undefined|NaN|\[object/.test(t)){ st.errs++; if(st.errs<3) console.log('TESTO ROTTO',JSON.stringify(e),t); } }); }
const POL={
 passivo:{vis:()=>true,f:(day)=>{ resolveAll('nascosto',day); arrivals('ok',day); care('passivo',1); biscotto('passivo',day); fin(); }},
 attivo:{vis:()=>true,f:(day)=>{ resolveAll('mostrati',day); arrivals('ok',day); care('attivo',2); biscotto('attivo',day); fin(); }},
 caotico:{vis:()=>true,f:(day)=>{ if(A.mazzoTot()&&Math.random()<.4){ const ids=Object.keys(A.G.mazzo); A.playCard(ids[Math.floor(Math.random()*ids.length)]); } resolveAll('caos',day); arrivals('caos',day); care('caos',1); biscotto('caos',day); fin(); }},
 'ogni 2 giorni':{vis:d=>d%2===0,f:(day)=>{ resolveAll('nascosto',day); arrivals('ok',day); care('passivo',3); biscotto('passivo',day); fin(); }},
 'ogni 3 giorni':{vis:d=>d%3===0,f:(day)=>{ resolveAll('nascosto',day); arrivals('ok',day); care('passivo',4); biscotto('passivo',day); fin(); }},
 'da zero':{vis:()=>true,f:(day)=>{ if(day===1){ A.doAct('terra'); A.doAct('acqua'); } resolveAll('nascosto',day); arrivals('ok',day); care('passivo',1); biscotto('passivo',day); fin(); }},
 demo:{vis:()=>true,f:(day)=>{ for(let i=0;i<40;i++){ const r=A.demoDay(true); if(r.pausa) resolveAll('nascosto',day); if(A.sim.finalePending) break; } arrivals('ok',day); biscotto('demo',day); fin(); }},
 abbandono:{vis:d=>d<=1,f:(day)=>{ resolveAll('nascosto',day); }}
};
let problems=0; const rows=[];
for(const [pn,pol] of Object.entries(POL)){ const st={errs:0,nan:0,stuck:0}; let ch=0,fins={},saveMax=0,first=[],arr=0,pag=0,vivi=0,tot=0,spenti=0,giorniSpento=[],a4=0;
  for(const [si,su0] of setups.entries()) for(let seed=0;seed<8;seed++){ const su=pn==='da zero'?Object.assign({},su0,{piante:[],insetti:[],oggetti:[]}):su0;
    try{ A.newGame('Bot',JSON.parse(JSON.stringify(su))); A.G.seed=seed; gap=0; let first1=null,spentoAt=null; tot++;
      for(let day=1;day<=100;day++){ A.G.dev.offset++; if(pol.vis(day)||pn==='abbandono') A.checkNewDay(); const ps=A.popups.slice(); A.popups.length=0; if(ps.some(p=>p.t==='biscotto')) A.popups.push({t:'biscotto'}); if(pol.vis(day)) pol.f(day); else if(pn==='abbandono') resolveAll('nascosto',day); A.popups.length=0; A.updateCodex();
        if(pn==='abbandono'&&A.sim.finalePending&&spentoAt==null) spentoAt=day; if(!first1&&A.sim.view().chapter>1) first1=day; check(A.sim.view(),pn,si,seed,day,st); if(pn==='abbandono'&&spentoAt!=null) break; }
      A.persist(); saveMax=Math.max(saveMax,localStorage._d['terrario.save.v2'].length); ch+=A.sim.view().chapter-1; Object.keys(A.G.libro).forEach(k=>{ fins[k]=1; }); if(A.G.libro.spento) spenti++; arr+=A.G.arrivi.list.filter(a=>a.state==='accettato').length; pag+=A.G.quaderno.length; if(first1) first.push(first1); if(A.sim.view().sp.some(x=>x.alive)) vivi++; if(A.G.ui.fase>=4) a4++; if(spentoAt!=null&&A.sim.finalePending&&A.sim.finalePending.finale==='spento') giorniSpento.push(spentoAt);
    }catch(e){ st.errs++; if(st.errs<3) console.log('ECCEZIONE',pn,si,seed,e.stack.split('\n').slice(0,3).join(' | ')); } }
  first.sort((a,b)=>a-b); giorniSpento.sort((a,b)=>a-b);
  rows.push([pn.padEnd(14),'errori '+st.errs,'NaN '+st.nan,'blocchi '+st.stuck,'capitoli chiusi '+ch,'finali distinti '+Object.keys(fins).length,'vasi vivi a fine '+vivi+'/'+tot,'arrivati alla vita '+a4+'/'+tot,'«Il Vaso Spento» '+spenti+(giorniSpento.length?' (mediana giorno '+giorniSpento[Math.floor(giorniSpento.length/2)]+')':''),'salvataggio max '+Math.round(saveMax/1024)+' KB']); if(st.errs||st.nan||st.stuck) problems++; }
rows.forEach(r=>console.log(r.join(' · ')));
if(cardErr) problems++; console.log('CARTE: '+cardTot+' estratte · speciali '+cardSpec+' ('+Math.round(100*cardSpec/Math.max(1,cardTot))+'%) · garanzia ogni 8 capitoli rispettata: '+(cardErr?'NO':'sì'));
console.log(problems?'PROBLEMI':'Nessun errore, nessun NaN, nessun blocco.');
