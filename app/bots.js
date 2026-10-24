global.window=global; global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}}; global.document={querySelector:()=>null,createElement:()=>({}),body:{appendChild(){}}};
global.Terr=require('../sim.js'); require('./story.js'); require('./app1.js'); const A=window.__app, T=A.T, S=A.S;
const setups=[{luce:1,acqua:1,meteorite:1,piante:['muschio','felce'],insetti:['formiche'],oggetti:['statuina']},{luce:2,acqua:1,meteorite:1,piante:['muschio','felce'],insetti:['formiche'],oggetti:[]},{luce:0,acqua:2,meteorite:1,piante:['muschio','felce'],insetti:['formiche'],oggetti:['orologio']},{luce:1,acqua:0,meteorite:1,piante:['muschio','felce'],insetti:['formiche'],oggetti:['specchio']}];
function finite(o,path=''){ for(const k in o){ const v=o[k]; if(typeof v==='number'&&!isFinite(v)) return path+k; if(v&&typeof v==='object'){ const r=finite(v,path+k+'.'); if(r) return r; } } return null; }
const decide=(p,mode,day)=>{ if(p.type==='mutazione') return mode==='caos'?['proteggi','rimuovi','lascia'][day%3]:'proteggi'; if(p.type==='societa') return mode==='mostrati'?'mostrati':'nascosto'; if(p.type==='guerra'){ const m=A.sim.view().setup.oggetti.includes('moneta'); return mode==='caos'?(m?'patto':['separa','lascia'][day%2]):'lascia'; } return 'lascia'; };
function resolveAll(mode,day){ let g=0; while(A.sim.pending.length&&g++<12){ const p=A.sim.pending[0]; A.resolveDecision(p.id,decide(p,mode,day)); } }
function arrivals(mode,day){ A.inbox().forEach(a=>{ const no=(mode==='caos'&&day%3===0); if(no) A.takeArrival(a.id,'no'); else A.takeArrival(a.id,a.kind==='oggetto'?a.alt[day%a.alt.length]:'si'); }); }
function care(mode,burst){ const n=A.sim.view().needs; for(let b=0;b<(burst||1);b++){ const v=A.sim.view().needs; if(v.um<.6) A.doAct('acqua'); if(v.ter<.5) A.doAct('nutri'); if(v.pul<.7) A.doAct('pulisci'); } A.refreshReq(true); if(A.G.req.kind==='osserva'&&mode!=='passivo') A.osserva(); if(mode==='caos'&&Math.random()<.4) A.doAct(['pulisci','acqua','nutri'][Math.floor(Math.random()*3)]); }
function biscotto(mode,day){ if(A.popups.some(p=>p.t==='biscotto')){ A.biscottoOutcome(mode==='caos'?['pallina','davanzale','scaduto'][day%3]:'pallina'); } }
const SERIE_BUCHI=[9,10,20,21,22,30,31]; // 1-8 pieni (protezione al 7), buco 9-10 (si usa), 11-19, buco 20-22 (nessuna protezione: serie a 1)
let gap=0, cardTot=0, cardErr=0, spentoDays=[]; const CR={carta:0,argento:0,sasso:0}; let ricTot=0; const CARDROWS=[];
function fin(mode){ if(A.sim.finalePending){ const k=A.sim.finalePending.finale; const r=A.closeChapter(); const c=A.CARTE[r.carta]; if(!c||!['carta','argento','sasso'].includes(c.r)){ cardErr++; return; } } }
const PESC=Object.keys(A.CARTE).filter(id=>A.CARTE[id].r!=='ricordo').length;
function cardDay(day,cs){ const C=A.G.carte; if(!C) return; if(C.pA>=3||C.pS>=6){ cardErr++; if(cardErr<3) console.log('GARANZIA VIOLATA',C.pA,C.pS); } if((C.nA||0)>cs.nA){ cs.lastA=day; } if((C.nS||0)>cs.nS){ cs.lastS=day; } cs.nA=C.nA||0; cs.nS=C.nS||0; cs.wA=Math.max(cs.wA,day-cs.lastA); cs.wS=Math.max(cs.wS,day-cs.lastS); if(cs.full==null&&Object.keys(A.G.album||{}).filter(id=>A.CARTE[id]&&A.CARTE[id].r!=='ricordo').length>=PESC) cs.full=day; }
function check(v,pn,si,seed,day,st){ const bad=finite(v); if(bad){ st.nan++; if(st.nan<3) console.log('NaN in',bad,pn,si,seed,day); }
  const n=v.needs; if(Object.values(n).some(x=>x<-1e-9||x>1+1e-9)){ st.errs++; if(st.errs<3) console.log('BISOGNO FUORI SCALA',JSON.stringify(n)); } if(A.G.real.owed<0) st.errs++;
  const pw=A.G.power; if(!pw||!Number.isInteger(pw.salto)||pw.salto<0||pw.salto>A.POWER.max||!Number.isInteger(pw.resto)||pw.resto<0){ st.errs++; if(st.errs<3) console.log('POWER CARD FUORI SCALA',JSON.stringify(pw)); } if(v.pending.length>3) st.stuck++; if(v.setup.meteorite>2){ st.errs++; }
  A.sim.log.slice(-6).forEach(e=>{ const t=S.narra(e); if(!t||typeof t!=='string'||/undefined|NaN|\[object/.test(t)){ st.errs++; if(st.errs<3) console.log('TESTO ROTTO',JSON.stringify(e),t); } }); }
// power card «Salta 2 giorni»: le usa tutte, risolvendo le decisioni che fermano il salto; conta usi e blocchi inattesi
let saltiUsati=0, saltiBloccati={};
function salti(mode,day,st){ let g=0; while(g++<8){ const pc=A.powerCards(); if(!pc.salto) break; const r=A.usaSalto(); if(!r.ok){ saltiBloccati[r.why]=(saltiBloccati[r.why]||0)+1; if(r.why==='decisione'){ resolveAll(mode,day); continue; } if(r.why==='finale'){ fin(); continue; } break; }
    saltiUsati++; if(!(r.passi+r.resto===A.POWER.giorni)){ st.errs++; if(st.errs<3) console.log('SALTO INCOERENTE',JSON.stringify({passi:r.passi,resto:r.resto})); } if(r.pausa) resolveAll(mode,day); if(A.G.power.resto>0){ st.errs++; if(st.errs<3) console.log('SALTO NON RIPRESO',A.G.power.resto); } arrivals('ok',day); } }
const POL={
 passivo:{vis:()=>true,f:(day)=>{ resolveAll('nascosto',day); arrivals('ok',day); care('passivo',1); biscotto('passivo',day); fin(); }},
 attivo:{vis:()=>true,f:(day)=>{ resolveAll('mostrati',day); arrivals('ok',day); care('attivo',2); biscotto('attivo',day); fin(); }},
 'attivo+salti':{vis:()=>true,f:(day)=>{ resolveAll('mostrati',day); arrivals('ok',day); care('attivo',2); salti('mostrati',day,ST); care('attivo',1); biscotto('attivo',day); fin(); }},
 'ogni 3 giorni+salti':{vis:d=>d%3===0,f:(day)=>{ resolveAll('nascosto',day); arrivals('ok',day); care('passivo',4); salti('nascosto',day,ST); care('passivo',1); biscotto('passivo',day); fin(); }},
 caotico:{vis:()=>true,f:(day)=>{ if(A.mazzoTot()&&Math.random()<.4){ const ids=Object.keys(A.G.mazzo); A.playCard(ids[Math.floor(Math.random()*ids.length)]); } resolveAll('caos',day); arrivals('caos',day); care('caos',1); biscotto('caos',day); fin(); }},
 'ogni 2 giorni':{vis:d=>d%2===0,f:(day)=>{ resolveAll('nascosto',day); arrivals('ok',day); care('passivo',3); biscotto('passivo',day); fin(); }},
 'ogni 3 giorni':{vis:d=>d%3===0,f:(day)=>{ resolveAll('nascosto',day); arrivals('ok',day); care('passivo',4); biscotto('passivo',day); fin(); }},
 'da zero':{vis:()=>true,f:(day)=>{ if(day===1){ A.doAct('terra'); A.doAct('acqua'); } resolveAll('nascosto',day); arrivals('ok',day); care('passivo',1); biscotto('passivo',day); fin(); }},
 'serie con buchi':{vis:d=>!SERIE_BUCHI.includes(d),serie:true,f:(day)=>{ resolveAll('nascosto',day); arrivals('ok',day); care('serie',1); if(!A.G.req.done) A.reqCheck(A.G.req.kind); biscotto('passivo',day); fin(); }},
 demo:{vis:()=>true,f:(day)=>{ for(let i=0;i<40;i++){ const r=A.demoDay(true); if(r.pausa) resolveAll('nascosto',day); if(A.sim.finalePending) break; } arrivals('ok',day); biscotto('demo',day); fin(); }},
 abbandono:{vis:d=>d<=1,f:(day)=>{ resolveAll('nascosto',day); }}
};

// profilo «serie con buchi»: un modello atteso di serie/protezioni/XP confrontato con il gioco, giorno per giorno
let SM=null;
function serieStep(pol,ps,day,st){ const vis=pol.vis(day); if(day===1) SM={s:0,max:0,prot:0,last:null,xp:0};
  const popSerie=ps.some(p=>p.t==='serie');
  if(vis){ const gapDay=SM.last!=null&&day-1>SM.last&&SM.s>0;
    if(gapDay){ if(SM.prot>0){ if(!popSerie){ st.errs++; console.log('SERIE: manca il popup al giorno',day); } A.G.player.protezioni--; A.G.player.lastReqDay=A.todayIdx()-1; SM.prot--; SM.last=day-1; } else { if(popSerie){ st.errs++; console.log('SERIE: popup senza protezioni',day); } SM.s=0; } }
    else if(popSerie){ st.errs++; console.log('SERIE: popup fuori luogo',day); }
    SM.xpBefore=A.G.player.xp; SM.exp=true; }
  else SM.exp=false; }
function serieAfter(day,vis,st){ if(!SM) return; if(vis){ SM.s=(SM.last===day-1||SM.s===0&&SM.last==null)?SM.s+1:1; SM.last=day; SM.max=Math.max(SM.max,SM.s); if(SM.s%7===0&&SM.prot<2) SM.prot++;
    if(A.G.player.xp<SM.xpBefore+20){ st.errs++; console.log('SERIE: XP mancanti al giorno',day); } }
  const P=A.G.player; if(P.serie!==SM.s||P.protezioni!==SM.prot||P.serieMax!==SM.max){ st.errs++; if(st.errs<4) console.log('SERIE: giorno',day,'atteso',JSON.stringify(SM),'gioco',P.serie,P.protezioni,P.serieMax); } }
let problems=0, ST=null; const rows=[], CARDN={};
for(const [pn,pol] of Object.entries(POL)){ if(process.env.SOLO&&process.env.SOLO!==pn) continue; const st=ST={errs:0,nan:0,stuck:0}, cst={n:0,alb:0,wA:0,wS:0,full:[]}; saltiUsati=0; saltiBloccati={}; let ch=0,fins={},saveMax=0,first=[],arr=0,pag=0,vivi=0,tot=0,spenti=0,giorniSpento=[],a4=0,leth=0,wake=0,giorniVaso=0,popoli=0,mutazioni=0;
  for(const [si,su0] of setups.entries()) for(let seed=0;seed<8;seed++){ const su=pn==='da zero'?Object.assign({},su0,{piante:[],insetti:[],oggetti:[]}):su0;
    try{ A.newGame('Bot',JSON.parse(JSON.stringify(su))); A.G.seed=seed; gap=0; let first1=null,spentoAt=null; tot++; const cs={nA:0,nS:0,lastA:0,lastS:0,wA:0,wS:0,full:null};
      for(let day=1;day<=100;day++){ A.G.dev.offset++; if(pol.vis(day)||pn==='abbandono') A.checkNewDay(); const ps=A.popups.slice(); A.popups.length=0; if(pol.serie) serieStep(pol,ps,day,st); if(ps.some(p=>p.t==='biscotto')) A.popups.push({t:'biscotto'}); if(pol.vis(day)) pol.f(day); else if(pn==='abbandono') resolveAll('nascosto',day); A.popups.length=0; if(pol.serie) serieAfter(day,pol.vis(day),st); A.updateCodex(); cardDay(day,cs);
        if(pn==='abbandono'&&A.sim.finalePending&&spentoAt==null) spentoAt=day; if(!first1&&A.sim.view().chapter>1) first1=day; check(A.sim.view(),pn,si,seed,day,st); if(pn==='abbandono'&&spentoAt!=null) break; }
      { const C=A.G.carte||{}, alb=Object.keys(A.G.album||{}); const ric=alb.filter(id=>A.CARTE[id]&&A.CARTE[id].r==='ricordo').length; const n=(C.pesche||0)+ric; cardTot+=C.pesche||0; ricTot+=ric; CR.carta+=C.nC||0; CR.argento+=C.nA||0; CR.sasso+=C.nS||0; cst.n+=n; cst.alb+=alb.length-ric; cst.wA=Math.max(cst.wA,cs.wA); cst.wS=Math.max(cst.wS,cs.wS); if(cs.full!=null) cst.full.push(cs.full); } if(A.G.ui.letargoN) leth++; if(A.G.ui.risvegli) wake++; giorniVaso+=A.sim.d; popoli+=Object.keys(A.G.codex.cult).length; mutazioni+=Object.values(A.G.codex.specie).reduce((a,c)=>a+c.mut.length,0); A.persist(); saveMax=Math.max(saveMax,localStorage._d['terrario.save.v2'].length); ch+=A.sim.view().chapter-1; Object.keys(A.G.libro).forEach(k=>{ fins[k]=1; }); if(A.G.libro.spento) spenti++; arr+=A.G.arrivi.list.filter(a=>a.state==='accettato').length; pag+=A.G.quaderno.length; if(first1) first.push(first1); if(A.sim.view().sp.some(x=>x.alive)) vivi++; if(A.G.ui.fase>=4) a4++; if(spentoAt!=null&&A.sim.finalePending&&A.sim.finalePending.finale==='spento') giorniSpento.push(spentoAt);
    }catch(e){ st.errs++; if(st.errs<3) console.log('ECCEZIONE',pn,si,seed,e.stack.split('\n').slice(0,3).join(' | ')); } }
  first.sort((a,b)=>a-b); giorniSpento.sort((a,b)=>a-b);
  rows.push([pn.padEnd(14),'errori '+st.errs,'NaN '+st.nan,'blocchi '+st.stuck,'capitoli chiusi '+ch,'finali distinti '+Object.keys(fins).length,'vasi vivi a fine '+vivi+'/'+tot,'arrivati alla vita '+a4+'/'+tot,'«Il Vaso Spento» '+spenti+(giorniSpento.length?' (mediana giorno '+giorniSpento[Math.floor(giorniSpento.length/2)]+')':''),'letargo '+leth+'/'+tot+' (risvegliati '+wake+')','salti '+saltiUsati+(Object.keys(saltiBloccati).length?' (bloccati '+JSON.stringify(saltiBloccati)+')':''),'giorni-vaso medi '+Math.round(giorniVaso/Math.max(1,tot)),'popoli '+popoli,'mutazioni '+mutazioni,'salvataggio max '+Math.round(saveMax/1024)+' KB']); if(pn!=='abbandono'){ cst.full.sort((a,b)=>a-b); CARDROWS.push(pn.padEnd(14)+' · carte/100 giorni '+(cst.n/tot).toFixed(1)+' · album '+(cst.alb/tot).toFixed(1)+'/'+PESC+' pescabili'+(cst.full.length?' (completo in '+cst.full.length+'/'+tot+', mediana giorno '+cst.full[Math.floor(cst.full.length/2)]+')':' (mai completo in 100 giorni)')+' · attesa max argento '+cst.wA+' g · sasso '+cst.wS+' g'); CARDN[pn]=cst.n/tot; } if(st.errs||st.nan||st.stuck) problems++; }
rows.forEach(r=>console.log(r.join(' · ')));
CARDROWS.forEach(r=>console.log(r)); if(CARDN.attivo!=null&&CARDN.passivo!=null&&CARDN.attivo<CARDN.passivo){ problems++; console.log('CARTE: l’attivo riceve meno del passivo'); }
if(cardErr) problems++; const pct=k=>Math.round(100*CR[k]/Math.max(1,cardTot)); console.log('CARTE: '+cardTot+' pescate (carta '+pct('carta')+'% · argento '+pct('argento')+'% · sasso '+pct('sasso')+'%) + '+ricTot+' ricordi · garanzie argento ≤3 / sasso ≤6 rispettate: '+(cardErr?'NO':'sì'));
console.log(problems?'PROBLEMI':'Nessun errore, nessun NaN, nessun blocco.');
