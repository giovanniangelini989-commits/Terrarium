(function(){
'use strict';
const T=window.Terr, S=window.__story, $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const XPT=[0,100,250,450,700,1000,1400];
const lvlOf=xp=>{ let l=1; for(let i=1;i<XPT.length;i++) if(xp>=XPT[i]) l=i+1; return l; };
const LIM={insetti:4,piante:4,oggetti:3};
const CULTICON={sacro:'🗿',sapere:'⏰',commercio:'🪙',gioco:'🧸',mistero:'🪞',comunicazione:'📻',fuoco:'🕯️',agricoltura:'🍄',tribale:'🏕️',guerra:'⚔️'};
const LS='terrario.save.v2';
let G=null, sim=null, mem=null, popups=[];
const store={get(){ try{ return localStorage.getItem(LS); }catch(e){ return mem; } }, set(v){ try{ localStorage.setItem(LS,v); }catch(e){ mem=v; } }, del(){ try{ localStorage.removeItem(LS); }catch(e){} mem=null; }};
const todayIdx=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/864e5)+(G&&G.dev?G.dev.offset:0);
const lvl=()=>lvlOf(G.player.xp), rank=()=>S.TITOLI[Math.min(lvl()-1,S.TITOLI.length-1)];
function fresh(name,setup,seed){ return {v:2,name,seed,player:{xp:0,serie:0,serieMax:0,protezioni:0,lastReqDay:null},real:{lastDay:0,cure:12,cureT:0,tempo:12,tempoT:0,owed:0},req:{day:0,kind:'',done:false},arrivi:{list:[],n:0},coda:{n:0,slots:[]},mazzo:{},libro:{},codex:{specie:{},cult:{},anomalie:{}},quaderno:[],settings:{audio:{suoni:true,voce:true,vol:.6},calma:{pausa:true,soft:false},tempo:'auto'},ui:{snoozeFinale:0,tut:false,pausaDay:-1,storyN:0,unread:0,nextBiscotto:0,fase:5},dev:{offset:0},sim:null,created:Date.now()}; }
function persist(){ if(!G||!sim) return; G.sim=sim.save(); store.set(JSON.stringify(G)); }
function loadSave(){ const s=store.get(); if(!s) return false; try{ const g=JSON.parse(s); if(!g||g.v!==2||!g.sim) return false; G=g; G.quaderno=G.quaderno||[]; G.ui=Object.assign({fase:5,snoozeFinale:0,tut:false,pausaDay:-1,storyN:0,unread:0,nextBiscotto:0},G.ui); sim=T.createSim({luce:1,acqua:1,piante:[],insetti:[],oggetti:[]},{seed:g.seed,game:true,decisions:true,needs:true}); sim.load(g.sim);
    G.arrivi=G.arrivi||{list:[],n:0}; if(!G.arrivi.list.length||G.arrivi.list.some(a=>a.due>5000)){ G.arrivi={list:[],n:0}; planArrivals(sim.d); } G.coda=G.coda||{n:0,slots:[]}; G.mazzo=G.mazzo||{}; if(G.ui.nextBiscotto>5000) G.ui.nextBiscotto=sim.d+14; G.settings=G.settings||{}; G.settings.audio=Object.assign({suoni:true,voce:true,vol:.6},G.settings.audio||{}); G.settings.calma=Object.assign({pausa:true,soft:false},G.settings.calma||{}); G.settings.tempo=G.settings.tempo||'auto'; G.player=Object.assign({xp:0,serie:0,serieMax:0,protezioni:0,lastReqDay:null},G.player); G.real=Object.assign({lastDay:0,cure:12,cureT:0,tempo:12,tempoT:0},G.real); delete G.real.actions; G.real.owed=G.real.owed||0; G.codex=G.codex||{specie:{},cult:{},anomalie:{}}; G.libro=G.libro||{}; G.dev=G.dev||{offset:0}; if(!G.req||!G.req.kind) G.req=makeRequest();
    return true; }catch(e){ console.error('salvataggio non leggibile',e); return false; } }
const lastN=()=>{ const L=sim.log; return L.length?(L[L.length-1].n||0):0; };
// ---------- XP, livelli ----------
function giveXP(n){ const before=lvl(); G.player.xp+=n; const after=lvl(); if(after>before) popups.push({t:'levelup',lvl:after,titolo:S.TITOLI[Math.min(after-1,S.TITOLI.length-1)]}); }
// ---------- quaderno ----------
function addPage(id,titolo,testo,major){ if(G.quaderno.some(p=>p.id===id)) return false; G.quaderno.unshift({id,d:sim.d,titolo,testo}); G.ui.unread++; if(major) popups.push({t:'pagina',id}); return true; }
function storyScan(){ const v=sim.view(); sim.log.filter(e=>(e.n||0)>G.ui.storyN).forEach(e=>{ const P=S.PAG;
  if(e.kind==='mutazione'&&S.MUTMAP[e.text]) addPage('mutazione',P.mutazione[0],P.mutazione[1],false);
  else if(e.kind==='societa'){ addPage('societa',P.societa[0],P.societa[1],true); const sp=v.sp.find(x=>e.text.indexOf(x.nome)===0&&x.society); if(sp&&sp.society) addPage('mito-'+sp.society.cult,'Il popolo di '+sp.nome.toLowerCase(),S.MITO[sp.society.cult]||'',false); }
  else if(e.kind==='guerra'&&e.text.indexOf('Guerra tra')===0) addPage('guerra',P.guerra[0],P.guerra[1],true);
  else if(e.kind==='mostro') addPage('mostro',P.mostro[0],P.mostro[1],false);
  else if(e.kind==='estinzione'&&v.sp.length&&v.sp.every(x=>!x.alive)) addPage('spento',P.spento[0],P.spento[1],true);
  else if(e.kind==='pace') addPage('pace',P.pace[0],P.pace[1],false);
  else if(e.kind==='scisma') addPage('scisma',P.scisma[0],P.scisma[1],false); });
  G.ui.storyN=lastN(); }
function updateCodex(){ const v=sim.view(); v.sp.forEach(x=>{ const c=G.codex.specie[x.id]||(G.codex.specie[x.id]={mut:[],soc:false}); x.mut.forEach(m=>{ if(!c.mut.includes(m)){ c.mut.push(m); if(sim.d>0) giveXP(10); } }); if(x.society){ c.soc=true; G.codex.cult[x.society.cult]=true; } if(x.monster) G.codex.anomalie[x.id]=true; }); storyScan(); }
// ---------- richieste del bambino ----------
function makeRequest(){ const f=G.ui.fase==null?5:G.ui.fase; if(f<1) return {day:todayIdx(),kind:'terra',done:false}; if(f<2) return {day:todayIdx(),kind:'acqua',done:false}; const n=sim.view().needs; let k=f<4?'notte':'osserva'; if(n.pul<.55&&f>=3) k='pulisci'; else if(n.um<.45) k='acqua'; else if(n.ter<.35) k='nutri'; return {day:todayIdx(),kind:k,done:false}; }
function reqCheck(kind){ const r=G.req; if(r.done||r.kind!==kind) return false; r.done=true; r.doneAt=nowMs(); giveXP(20); G.ui.reqN=(G.ui.reqN||0)+1; G.ui.reqToday=(G.ui.reqToday||0)+1; if(G.ui.reqToday<=3) G.real.cure=Math.min(18,G.real.cure+2); const t=todayIdx(), p=G.player; if(p.lastReqDay!==t){ p.serie=(p.lastReqDay===t-1||(p.serie===0&&p.lastReqDay==null))?p.serie+1:1; p.serieMax=Math.max(p.serieMax,p.serie); p.lastReqDay=t; if(p.serie%7===0&&p.protezioni<2){ p.protezioni++; toast('Serie di '+p.serie+' giorni: hai guadagnato una protezione.'); } } return true; }
// ---------- arrivi (le notifiche della storia) ----------
const SLOTS=[[6,'insetto'],[14,'pianta'],[24,'oggetto'],[36,'insetto'],[50,'oggetto'],[66,'insetto'],[84,'pianta'],[104,'oggetto'],[126,'insetto'],[150,'oggetto']];
function planArrivals(t0){ const a=G.arrivi; SLOTS.forEach(([off,k],i)=>{ a.list.push({id:'a'+(a.n++),slot:k,due:t0+off,state:'futuro'}); }); }
function materialize(a){ const v=sim.view(), R=T.rng(G.seed*13+a.id.length*7+sim.d), refused=G.arrivi.list.filter(x=>x.state==='rifiutato').map(x=>x.param); const have=v.setup;
  const alive=v.sp.filter(x=>x.alive&&T.SPECIE[x.id].dieta!=='insetti').length;
  if(a.force){ if(a.slot==='pianta'){ if(have.piante.includes(a.force)) return false; const t=S.ARR.pianta[a.force]; a.kind='pianta'; a.param=a.force; a.title=t[0]; a.text=t[1]; return true; } if(have.insetti.includes(a.force)) return false; const t=S.ARR.specie[a.force]; a.kind='specie'; a.param=a.force; a.title=t[0]; a.text=t[1]; return true; }
  if(a.slot==='insetto'){ if(have.insetti.length>=LIM.insetti) return false; const o=['mosche','coleotteri','termiti','lumache','ragni','formiche'].filter(id=>!have.insetti.includes(id)&&!refused.includes(id)&&(id!=='ragni'||alive>=2)); if(!o.length) return false; const id=o[Math.floor(R()*Math.min(2,o.length))]; const t=S.ARR.specie[id]; a.kind='specie'; a.param=id; a.title=t[0]; a.text=t[1]; return true; }
  if(a.slot==='pianta'){ if(have.piante.length>=LIM.piante) return false; const o=['fungo','succulenta','carnivora','felce','muschio'].filter(id=>!have.piante.includes(id)&&!refused.includes(id)&&(id!=='carnivora'||have.insetti.includes('mosche'))); if(!o.length) return false; const id=o[0]; const t=S.ARR.pianta[id]; a.kind='pianta'; a.param=id; a.title=t[0]; a.text=t[1]; return true; }
  if(have.oggetti.length>=LIM.oggetti) return false; const pool=['orologio','giocattolo','specchio','statuina','libro','moneta','radio','candela'].filter(id=>!have.oggetti.includes(id)&&!refused.includes(id)); if(pool.length<1) return false; const i0=Math.floor(R()*pool.length); const alt=pool.length>1?[pool[i0],pool[(i0+1+Math.floor(R()*(pool.length-1)))%pool.length]]:[pool[0]]; if(alt.length>1&&alt[0]===alt[1]) alt[1]=pool[(i0+1)%pool.length];
  a.kind='oggetto'; a.alt=alt; a.title='Dal tavolo del bambino'; a.text=alt.length>1?'Il bambino ti lascia due cose sul tavolo: '+S.ARR.oggetto[alt[0]][0]+', e '+S.ARR.oggetto[alt[1]][0]+'. Il vaso ne regge una sola.':'Il bambino ti lascia '+S.ARR.oggetto[alt[0]][0]+'. Lo fai entrare?'; return true; }
function dueArrivals(){ const t=sim.d, out=[]; for(const a of G.arrivi.list){ if(a.state!=='futuro'||a.due>t) continue; if(materialize(a)){ a.state='nuovo'; out.push(a); break; } else a.state='saltato'; } return out; }
function takeArrival(id,choice){ const a=G.arrivi.list.find(x=>x.id===id), st=a&&a.state; const r=takeArrival0(id,choice); if(a&&st==='nuovo'){ try{ const nmA=a.kind==='specie'?nm('SPECIE',a.param):a.kind==='pianta'?nm('PIANTE',a.param):nm('OGGETTI',a.param), yes=choice!=='no'; treeNode({k:'scelta',lane:'vaso',t:'Arriva: '+lc1(nmA),ch:yes?'Lo accogli nel vaso':'Lo lasci fuori',alt:yes?'Lasciarlo fuori':'Accoglierlo nel vaso',major:true}); treeDiff(); }catch(e){} } return r; }
function takeArrival0(id,choice){ const a=G.arrivi.list.find(x=>x.id===id); if(!a||a.state!=='nuovo') return false; let ok=false;
  if(choice==='no'){ a.state='rifiutato'; if(a.kind==='oggetto') a.alt.forEach(o=>{}); a.param=a.param||(a.alt&&a.alt[0]); if(a.force&&(G.ui.fase||0)<(a.kind==='pianta'?3:4)) G.arrivi.list.push({id:'a'+(G.arrivi.n++),slot:a.slot,force:a.force,due:sim.d+1,state:'futuro'}); }
  else { a.state='accettato'; if(a.kind==='specie') ok=sim.addSpecies(a.param); else if(a.kind==='pianta') ok=sim.addPlant(a.param); else { a.param=choice; ok=sim.addObject(choice); } giveXP(10);
    if(ok){ if(a.kind==='pianta'&&(G.ui.fase||0)<3){ G.ui.fase=3; G.ui.d3=sim.d; planAfterMoss(sim.d); G.req=makeRequest(); } else if(a.kind==='specie'&&(G.ui.fase||0)<4){ G.ui.fase=4; G.req=makeRequest(); } } }
  updateCodex(); persist(); return ok; }
function skipStart(){ if((G.ui.fase||0)>=4) return false; sim.setNeeds({um:.7,ter:.8}); ['muschio','felce'].forEach(p=>sim.addPlant(p)); sim.addSpecies('formiche'); G.ui.fase=5; G.arrivi={list:[],n:0}; G.arrivi.list=[]; planArrivals(sim.d); G.req=makeRequest(); updateCodex(); persist(); return true; }
function forceArrival(slot,force){ G.arrivi.list.push({id:'a'+(G.arrivi.n++),slot,force,due:sim.d,state:'futuro'}); dueArrivals().forEach(x=>popups.push({t:'arrivo',id:x.id})); }
function planAfterMoss(d){ const a=G.arrivi; a.list.push({id:'a'+(a.n++),slot:'pianta',force:'felce',due:d+3,state:'futuro'},{id:'a'+(a.n++),slot:'insetto',force:'formiche',due:d+7,state:'futuro'}); planArrivals(d+10); }
const inbox=()=>G.arrivi.list.filter(x=>x.state==='nuovo');
// ---------- carte: asso nella manica ----------
const CARTE={
 pioggia:{n:'Pioggia gentile',ic:'🌧️',r:'comune',d:'Più umido per qualche giorno, subito. Non costa cure.',x:'Una pioggia sottile scende dentro il vaso. Il muschio beve, il vetro si appanna.',w:{Quiete:3,Mostri:1,'Società':2,Conflitti:2}},
 terra:{n:'Terra buona',ic:'🪱',r:'comune',d:'Pulisce il vetro e nutre il suolo, senza usare cure.',x:'Il bambino versa una manciata di terra buona e passa uno straccio sul vetro.',w:{Quiete:3,Mostri:1,'Società':2,Conflitti:2}},
 scintilla:{n:'Scintilla',ic:'⚡',r:'comune',d:'Il meteorite si carica di colpo: più mutazioni, più in fretta.',x:'Una scintilla salta dal dito del bambino al sasso. Il battito si fa fitto.',w:{Quiete:1,Mostri:3,'Società':3,Conflitti:2}},
 ombra:{n:'Ombra fresca',ic:'🌫️',r:'comune',d:'Il meteorite si quieta: il vaso rallenta.',x:'Una mano stende un panno sul vaso. Il sasso rallenta, come chi si addormenta.',w:{Quiete:2,Mostri:3,'Società':1,Conflitti:3}},
 scudo:{n:'Scudo di vetro',ic:'🔰',r:'comune',d:'Salva dal prossimo Biscotto. Resta pronto finché non serve.',x:'Il bambino fissa una lastra di vetro sul davanzale. La prossima zampata di Biscotto non passerà.',w:{Quiete:2,Mostri:2,'Società':2,Conflitti:3}},
 tempo:{n:'Tempo in bottiglia',ic:'⏳',r:'comune',d:'+3 giorni di tempo accumulato.',x:'Il bambino stappa una bottiglietta che sembrava vuota: dentro c’era un po’ di tempo.',w:{Quiete:2,Mostri:2,'Società':3,Conflitti:2}},
 latte:{n:'Tazza di latte',ic:'🥛',r:'comune',d:'+6 cure.',x:'La nonna porta latte caldo e biscotti. Tutti ripartono con più energia.',w:{Quiete:3,Mostri:2,'Società':2,Conflitti:2}},
 bussola:{n:'Bussola',ic:'🧭',r:'comune',d:'Un indizio vago su dove sta andando il vaso.',x:'Il bambino gira una bussola rotta: l’ago indica, a tentoni, dove sta andando il vaso.',w:{Quiete:2,Mostri:2,'Società':2,Conflitti:2}},
 sasso:{n:'Il sasso cresce',ic:'☄️',r:'speciale',d:'Il meteorite diventa più grande: accumula energia più in fretta, per sempre.',x:'Il sasso fa un rumore come di ghiaccio che si incrina. Poi è un po’ più grande, e batte più forte.',w:{Quiete:1,Mostri:3,'Società':2,Conflitti:2}},
 moneta:{n:'Moneta d’argento',ic:'🪙',r:'speciale',d:'Mette una moneta nel vaso, anche se gli oggetti sono già al massimo.',x:'Una moneta d’argento rotola sul muschio e si ferma, in piedi, al centro del vaso.',w:{Quiete:1,Mostri:1,'Società':3,Conflitti:3}},
 candela:{n:'Candela eterna',ic:'🕯️',r:'speciale',d:'Mette una candela nel vaso, anche se gli oggetti sono già al massimo.',x:'Il bambino accende una candela che non si consuma. La mette vicino al vetro e se ne va in punta di piedi.',w:{Quiete:2,Mostri:1,'Società':3,Conflitti:1}},
 radio:{n:'Radio di notte',ic:'📻',r:'speciale',d:'Mette una radio nel vaso, anche se gli oggetti sono già al massimo.',x:'Una radiolina si accende da sola, appena. Dentro il fruscio sembra esserci una voce.',w:{Quiete:2,Mostri:1,'Società':3,Conflitti:1}}};
const BUSSOLA={Quiete:'L’ago resta quasi fermo: il vaso va verso la quiete.',Mostri:'L’ago trema verso qualcosa di grosso, che deve ancora crescere.','Società':'L’ago gira in tondo, come una piccola folla.',Conflitti:'L’ago punta in due direzioni insieme.'};
const mazzoTot=()=>Object.values(G.mazzo).reduce((a,b)=>a+b,0);
function drawCard(k){ const fam=T.FINALI[k].fam; G.ui.pity=(G.ui.pity||0)+1; const special=G.ui.pity>=8||Math.random()<.12; if(special) G.ui.pity=0;
  const pool=Object.entries(CARTE).filter(([id,c])=>special?c.r==='speciale':c.r==='comune'); const tot=pool.reduce((a,[id,c])=>a+(c.w[fam]||1),0); let x=Math.random()*tot, pick=pool[0][0]; for(const [id,c] of pool){ x-=(c.w[fam]||1); if(x<=0){ pick=id; break; } }
  G.mazzo[pick]=(G.mazzo[pick]||0)+1; (G.ui.viste=G.ui.viste||{})[pick]=1; return pick; }
function canPlay(id){ const c=CARTE[id]; if(!c||!(G.mazzo[id]>0)) return 'Non hai questa carta.'; const v=sim.view();
  if(id==='sasso'&&v.setup.meteorite>=2) return 'Il sasso è già al massimo.'; if((id==='moneta'||id==='candela'||id==='radio')&&v.setup.oggetti.includes(id)) return 'Questo oggetto è già nel vaso.'; if(id==='scudo'&&G.ui.scudo) return 'Lo scudo è già pronto.'; return ''; }
function playCard(id){ const r=playCard0(id); if(r&&r.ok!==false){ try{ treeNode({k:'carta',lane:'vaso',t:'Giochi la carta «'+((CARTE[id]||{}).nome||id)+'»'}); }catch(e){} } return r; }
function playCard0(id){ const why=canPlay(id); if(why) return {ok:false,why}; const c=CARTE[id]; let extra='';
  if(id==='pioggia'){ sim.act('acqua'); sim.act('acqua'); } else if(id==='terra'){ sim.act('nutri'); sim.act('pulisci'); }
  else if(id==='scintilla') sim.charge(35); else if(id==='ombra') sim.charge(-30); else if(id==='scudo') G.ui.scudo=1;
  else if(id==='tempo') G.real.tempo=Math.min(24,G.real.tempo+3); else if(id==='latte') G.real.cure=Math.min(18,G.real.cure+6);
  else if(id==='bussola'){ const f=sim.classify(); extra=' '+BUSSOLA[T.FINALI[f].fam]; } else if(id==='sasso') sim.growMeteo(); else sim.addObject(id);
  G.mazzo[id]--; if(G.mazzo[id]<=0) delete G.mazzo[id]; G.ui.carteGiocate=(G.ui.carteGiocate||0)+1; giveXP(5); updateCodex(); persist(); return {ok:true,text:c.x+extra,c}; }
// ---------- azioni ----------
let toastT=null;
function toast(msg){ let el=$('#toast'); if(el) el.remove(); el=document.createElement('div'); el.className='toast'; el.id='toast'; el.textContent=msg; document.body.appendChild(el); clearTimeout(toastT); toastT=setTimeout(()=>{ const e=$('#toast'); if(e) e.remove(); },2600); }
function doAct(name){ if(!spend(1)) return null; const m=sim.act(name); G.ui.tut=true; reqCheck(name); const f=G.ui.fase==null?5:G.ui.fase;
  if(name==='terra'&&f<1){ G.ui.fase=1; G.req=makeRequest(); } else if(name==='acqua'&&f===1){ G.ui.fase=2; sim.setNeeds({um:Math.max(.6,sim.view().needs.um)}); G.req=makeRequest(); forceArrival('pianta','muschio'); }
  persist(); return m; }
function osserva(){ const v=sim.view(); const o=S.osserva(v,sim.d+G.player.xp); reqCheck('osserva'); persist(); return o; }
// ---------- tempo reale ----------
function queueDecisions(){ sim.pending.forEach(p=>{ if(!popups.some(q=>q.t==='decisione'&&q.id===p.id)) popups.push({t:'decisione',id:p.id}); }); }
// ---------- energia (cure), tempo accumulato, banco del bambino ----------
const CURE_MAX=12, CURE_MS=20*60000, TEMPO_MS=6*3600000, TEMPO_MAX=12, NOTA=['mutazione','societa','guerra','pace','mostro','estinzione','scisma','finale'];
const nowMs=()=>Date.now()+(G&&G.dev?G.dev.offset:0)*864e5;
function regen(){ const r=G.real, n=nowMs();
  if(!r.cureT||r.cure>=CURE_MAX) r.cureT=n; else { const k=Math.floor((n-r.cureT)/CURE_MS); if(k>0){ r.cure=Math.min(CURE_MAX,r.cure+k); r.cureT=r.cure>=CURE_MAX?n:r.cureT+k*CURE_MS; } }
  if(!r.tempoT||r.tempo>=TEMPO_MAX) r.tempoT=n; else { const k=Math.floor((n-r.tempoT)/TEMPO_MS); if(k>0){ r.tempo=Math.min(TEMPO_MAX,r.tempo+k); r.tempoT=r.tempo>=TEMPO_MAX?n:r.tempoT+k*TEMPO_MS; } } }
function spend(n){ return true; }
const minToCure=()=>{ regen(); const r=G.real; return r.cure>=CURE_MAX?0:Math.max(1,Math.ceil((CURE_MS-(nowMs()-r.cureT))/60000)); };
const minToTempo=()=>{ regen(); const r=G.real; return r.tempo>=TEMPO_MAX?0:Math.max(1,Math.ceil((TEMPO_MS-(nowMs()-r.tempoT))/60000)); };
function autoCare(){ if((G.ui.fase==null?5:G.ui.fase)<3) return; const n=sim.view().needs; if(n.um<.55) sim.act('acqua'); if(n.ter<.45) sim.act('nutri'); if(n.pul<.7) sim.act('pulisci'); }
function demoDay(auto){ if(auto) autoCare(); const st=sim.step(); if(st.paused){ queueDecisions(); return {pausa:true}; } afterDay(); updateCodex(); if(sim.d%10===0) persist(); return {pausa:false}; }
function catchUp(){ let n=0; while(G.real.owed>0){ const r=sim.step(); if(r.paused){ queueDecisions(); break; } G.real.owed--; n++; afterDay(); } return n; }
function passaNotte(){ const out={passi:0,eventi:[],pausa:false}; const startN=lastN(); const st=sim.step(); if(st.paused){ queueDecisions(); out.pausa=true; } else { out.passi=1; giveXP(2); afterDay(); if(Math.random()<.75){ const nb=pickNight(); if(nb) popups.push({t:'notte',id:nb}); } } out.eventi=sim.log.filter(e=>(e.n||0)>startN&&e.kind!=='azione'&&e.kind!=='meteorite'); updateCodex(); queueDecisions(); persist(); return out; }
function afterDay(){ try{ treeDiff(); }catch(e){} dueArrivals().forEach(a=>popups.push({t:'arrivo',id:a.id})); const d=sim.d; if(!G.ui.nextBiscotto) G.ui.nextBiscotto=d+14;
  if(d>=G.ui.nextBiscotto&&d>=10&&(G.ui.fase==null||G.ui.fase>=4)){ const st=G.ui.gatto||0; if(st===1||st>=5){ if(G.ui.gattoFine!=='guardiano') popups.push({t:'biscotto'}); } else popups.push({t:'gatto',s:st}); if(st<5) G.ui.gatto=st+1; G.ui.nextBiscotto=d+(st>=4?30:12)+((d*7)%7); } }

// ===== L'albero del vaso: discendenze, scelte e strade non prese =====
const nm=(tab,id)=>(T[tab]&&T[tab][id]&&T[tab][id].nome)||String(id||'');
const lc1=x=>x?x.charAt(0).toLowerCase()+x.slice(1):x;
let treeBusy=false;
function treeState(v){ return {sp:v.sp.map(x=>({id:x.id,alive:x.alive,mut:x.mut.slice(),soc:x.society?x.society.name:null,cult:x.society?x.society.cult:null,monster:!!x.monster})),wars:v.wars.map(w=>w.slice().sort().join('+')),piante:v.setup.piante.slice(),ogg:v.setup.oggetti.slice()}; }
function pushNode(n){ const Tr=G.tree; n.d=n.d==null?sim.d:n.d; n.cap=sim.chapter||1;
  if(n.major&&typeof window!=='undefined'&&window.__vase&&window.__vase.snap){ try{ const im=window.__vase.snap(); if(im&&im.length<60000) n.img=im; }catch(e){} }
  Tr.nodes.push(n); const imgs=Tr.nodes.filter(x=>x.img); if(imgs.length>36) imgs.slice(0,imgs.length-36).forEach(x=>{ delete x.img; }); if(Tr.nodes.length>400) Tr.nodes.splice(0,Tr.nodes.length-400); }
function treeEnsure(){ const Tr=G.tree=G.tree||{nodes:[],snap:null}; if(Tr.snap||treeBusy) return Tr; treeBusy=true; Tr.snap=treeState(sim.view()); if(!Tr.nodes.length){ pushNode({k:'inizio',lane:'vaso',t:'Il vaso comincia',major:true}); Tr.snap.sp.forEach(x=>pushNode({k:'nasce',lane:x.id,t:nm('SPECIE',x.id)+' nel vaso'})); } treeBusy=false; return Tr; }
function treeNode(n){ treeEnsure(); pushNode(n); }
function treeDiff(){ const Tr=treeEnsure(), was=Tr.snap, now=treeState(sim.view()); Tr.snap=now; if(!was||was===now) return;
  now.sp.forEach(x=>{ const p=was.sp.find(y=>y.id===x.id), N=nm('SPECIE',x.id);
    if(!p){ pushNode({k:'nasce',lane:x.id,t:'Arrivano '+lc1(N),major:true}); return; }
    if(p.alive&&!x.alive) pushNode({k:'estinta',lane:x.id,t:N+': non ne resta nessuna',major:true});
    if(!p.alive&&x.alive) pushNode({k:'nasce',lane:x.id,t:N+' tornano nel vaso',major:true});
    x.mut.filter(m=>!p.mut.includes(m)).forEach(m=>pushNode({k:'muta',lane:x.id,t:N+': '+lc1((T.MUT&&T.MUT[m]&&T.MUT[m].nome)||m)}));
    if(!p.soc&&x.soc) pushNode({k:'popolo',lane:x.id,t:N+' fondano «'+x.soc+'»',major:true});
    else if(p.soc&&x.soc&&p.cult!==x.cult) pushNode({k:'cultura',lane:x.id,t:'«'+x.soc+'» cambia cultura'});
    if(!p.monster&&x.monster) pushNode({k:'mostro',lane:x.id,t:N+': nasce un gigante',major:true}); });
  now.wars.filter(w=>!was.wars.includes(w)).forEach(w=>{ const [a,b]=w.split('+'); pushNode({k:'guerra',lane:a,link:b,t:'Guerra tra '+lc1(nm('SPECIE',a))+' e '+lc1(nm('SPECIE',b)),major:true}); });
  was.wars.filter(w=>!now.wars.includes(w)).forEach(w=>{ const [a,b]=w.split('+'); pushNode({k:'pace',lane:a,link:b,t:'Pace tra '+lc1(nm('SPECIE',a))+' e '+lc1(nm('SPECIE',b))}); });
  now.piante.filter(p=>!was.piante.includes(p)).forEach(p=>pushNode({k:'pianta',lane:'vaso',t:'Nel vaso cresce: '+lc1(nm('PIANTE',p))}));
  now.ogg.filter(o=>!was.ogg.includes(o)).forEach(o=>pushNode({k:'oggetto',lane:'vaso',t:'Nel vaso: '+lc1(nm('OGGETTI',o))}));
  was.ogg.filter(o=>!now.ogg.includes(o)).forEach(o=>pushNode({k:'oggetto',lane:'vaso',t:'Sparisce '+lc1(nm('OGGETTI',o))})); }
const CHL={separa:'Li separi',lascia:'Lasci fare'};
const ART={statuina:'la statuina',orologio:'l’orologio',giocattolo:'il giocattolo',specchio:'lo specchio',libro:'il libro',moneta:'la moneta',radio:'la radio',candela:'la candela'};
function nightCtx(v){ v.__ogg=ART[v.setup.oggetti[0]]||'il vetro'; return v; }
function wipeGlass(area,scrub,cleared){ try{ const n=sim.view().needs; const dUm=Math.min(.035,area*.5); if(dUm>.003&&n.um>.5) sim.setNeeds({um:n.um-dUm}); if(scrub>.02) sim.setNeeds({pul:Math.min(1,sim.view().needs.pul+scrub*.05)});
  if(cleared>0) toast(cleared>1?'Hai tolto '+cleared+' macchie di muffa dal vetro.':'Hai tolto una macchia di muffa dal vetro.'); else if(!G.ui.wipedOnce&&dUm>.003){ G.ui.wipedOnce=1; toast('Hai asciugato il vetro: un po’ di umidità esce dal vaso.'); }
  persist(); if(window.__ui&&window.__ui.render) window.__ui.render(); }catch(e){} }
function bumpNeeds(o){ const n=sim.view().needs; sim.setNeeds({um:o.um!=null?Math.min(1,n.um+o.um):undefined,ter:o.ter!=null?Math.min(1,n.ter+o.ter):undefined}); }
function pickNight(){ const N=window.__notti; if(!N) return null; const v=nightCtx(sim.view()), recent=G.ui.nightLog||[]; const ok=N.NOTTI.filter(b=>{ try{ return b.c(v,G)&&!recent.includes(b.id); }catch(e){ return false; } }); if(!ok.length) return null; let tot=ok.reduce((a,b)=>a+b.w,0), r=Math.random()*tot, pick=ok[0]; for(const b of ok){ r-=b.w; if(r<=0){ pick=b; break; } } G.ui.nightLog=[pick.id].concat(recent).slice(0,6); return pick.id; }
const FXA=()=>({sim,giveXP,bumpNeeds,pullArrival});
function nightFx(id,i){ const B=window.__notti.NOTTI.find(b=>b.id===id); if(!B) return ''; let out=''; try{ if(B.ch&&i>=0){ const c=B.ch[i]; if(c.fx) c.fx(FXA()); out=c.o; try{ const tx=(typeof B.x==='function'?B.x(nightCtx(sim.view())):B.x); treeNode({k:'scelta',lane:'vaso',t:'Una notte: '+tx.split(/[.?!]/)[0],ch:B.ch[i].l,alt:(B.ch[1-i]||{}).l||''}); }catch(e){} addPage('notte-'+id+'-'+sim.d,'Una notte',(typeof B.x==='function'?B.x(nightCtx(sim.view())):B.x)+' '+c.o,false); } else if(B.fx) B.fx(FXA()); }catch(e){} giveXP(3); updateCodex(); persist(); return out; }
function gattoChoice(st,i){ const N=window.__notti, f=G.ui.gattoF=G.ui.gattoF||{}; let res;
  if(st>=4){ const D=N.destino(f); G.ui.gattoFine=D.k; if(D.k==='ladro'){ const o=sim.view().setup.oggetti[0]; if(o) sim.removeObject(o); } if(D.k==='guardiano') G.ui.scudo=1; res={t:D.t,x:D.x}; try{ treeNode({k:'gatto',lane:'vaso',t:'Biscotto diventa «'+D.t+'»',major:true}); }catch(e){} addPage('gatto-fine','Biscotto · '+D.t,D.x,true); }
  else { const C=N.GATTO[st], c=C.ch[i]; if(c.k) f[c.k]=(f[c.k]||0)+1; try{ if(c.fx) c.fx(FXA()); }catch(e){} res={t:C.t,x:c.o}; try{ treeNode({k:'scelta',lane:'vaso',t:'Biscotto · '+C.t,ch:c.l,alt:(C.ch[1-i]||{}).l||'',major:true}); }catch(e){} addPage('gatto-'+st,'Biscotto · '+C.t,C.x+' '+c.o,false); }
  giveXP(15); updateCodex(); persist(); return res; }
function scorri(mode){ regen(); const r=G.real, out={passi:0,eventi:[],pausa:false}; const startN=lastN(), max=mode==='evento'?12:1;
  while(out.passi<max&&r.tempo>0){ if(r.tempo>=TEMPO_MAX) r.tempoT=nowMs(); const st=sim.step(); if(st.paused){ queueDecisions(); out.pausa=true; break; } r.tempo--; out.passi++; giveXP(3); const hit=sim.log.some(e=>(e.n||0)>startN&&NOTA.includes(e.kind)); afterDay(); if(mode==='evento'&&hit) break; }
  out.eventi=sim.log.filter(e=>(e.n||0)>startN&&e.kind!=='azione'&&e.kind!=='meteorite'); updateCodex(); queueDecisions(); persist(); return out; }
const TASKS={
 germoglio:{n:'Far germinare un seme',ic:'🌱',ms:10*60000,lv:1,x:'Il bambino pianta un seme in giardino e non gli stacca gli occhi di dosso. Domani, forse, un germoglio.',r:{cure:3,xp:10},rt:'3 cure'},
 esplora:{n:'Esplorare il giardino',ic:'🧭',ms:45*60000,lv:1,x:'Il bambino gira tra il gelso e la siepe con una scatola di cartone. Torna con le mani sporche e un segreto.',r:{arrivo:1,xp:25},rt:'porta qualcosa dal giardino'},
 veglia:{n:'Vegliare il sasso',ic:'🕯️',ms:2*3600000,lv:2,x:'Si è seduto accanto al vaso con una candela e ha ascoltato il battito per ore. Dice che gli ha risposto.',r:{tempo:2,cure:4,xp:40},rt:'2 giorni di tempo e 4 cure'},
 soffitta:{n:'Cercare in soffitta',ic:'📦',ms:4*3600000,lv:3,x:'È salito in soffitta con la torcia. Dice che lassù le cose hanno una storia, e che alcune vogliono essere trovate.',r:{arrivo:1,tempo:2,xp:70},rt:'qualcosa dalla soffitta e 2 giorni'},
 notte:{n:'Una notte sveglio',ic:'🌙',ms:8*3600000,lv:4,x:'È rimasto sveglio fino all’alba a guardare cosa fa il sasso quando nessuno lo guarda. Non ha voluto dire cosa ha visto.',r:{tempo:4,cure:8,xp:120},rt:'4 giorni di tempo e 8 cure'}};
const slotMax=()=>lvl()>=3?3:2;
const taskLeft=s=>Math.max(0,s.ms-(nowMs()-s.t0));
const readyTasks=()=>G.coda.slots.filter(s=>taskLeft(s)===0);
function startTask(kind){ const t=TASKS[kind], c=G.coda; if(!t||lvl()<t.lv||c.slots.length>=slotMax()||c.slots.some(s=>s.kind===kind)) return false; c.slots.push({id:'c'+(c.n++),kind,t0:nowMs(),ms:t.ms,pinged:false}); persist(); return true; }
function pullArrival(){ for(let i=0;i<4;i++){ let a=G.arrivi.list.find(x=>x.state==='futuro'); if(!a){ planArrivals(sim.d); a=G.arrivi.list.find(x=>x.state==='futuro'); } a.due=sim.d; const got=dueArrivals(); if(got.length){ got.forEach(x=>popups.push({t:'arrivo',id:x.id})); return true; } } return false; }
function collectTask(id){ const i=G.coda.slots.findIndex(s=>s.id===id); if(i<0) return null; const s=G.coda.slots[i]; if(taskLeft(s)>0) return null; const t=TASKS[s.kind], r=t.r, lines=[]; G.coda.slots.splice(i,1);
  if(r.tempo){ G.real.tempo=Math.min(24,G.real.tempo+r.tempo); lines.push('+'+r.tempo+(r.tempo>1?' giorni':' giorno')+' di tempo'); }
  if(r.cure){ G.real.cure=Math.min(18,G.real.cure+r.cure); lines.push('+'+r.cure+' cure'); }
  if(r.xp){ giveXP(r.xp); lines.push('+'+r.xp+' XP'); }
  if(r.arrivo) lines.push(pullArrival()?'Il bambino ha trovato qualcosa':'Stavolta non ha trovato niente di nuovo');
  G.ui.compiti=(G.ui.compiti||0)+1; persist(); return {t,lines}; }
function taskPing(){ readyTasks().forEach(s=>{ if(!s.pinged){ s.pinged=true; popups.push({t:'compito',id:s.id}); } }); }
function refreshReq(force){ if(G.req.done&&(force||nowMs()-(G.req.doneAt||0)>=45000)){ G.req=makeRequest(); return true; } return false; }
function checkNewDay(){ const t=todayIdx(); if(t<=G.real.lastDay){ refreshReq(); return null; } const elapsed=Math.min(t-G.real.lastDay,8), startN=lastN(); const missed=G.player.lastReqDay!=null&&(t-1)>G.player.lastReqDay&&G.player.serie>0;
  G.real.lastDay=t; G.ui.reqToday=0; G.real.owed=(G.real.owed||0)+elapsed*T.RITMO; catchUp(); updateCodex(); G.req=makeRequest();
  const nuovi=sim.log.filter(e=>(e.n||0)>startN&&e.kind!=='azione'&&e.kind!=='meteorite').slice(-4);
  if(missed){ if(G.player.protezioni>0) popups.push({t:'serie'}); else G.player.serie=0; }
  popups.unshift({t:'risveglio',eventi:nuovi,giorni:elapsed}); if((G.ui.fase==null||G.ui.fase>=3)){ const nb=pickNight(); if(nb) popups.push({t:'notte',id:nb}); } persist(); return {nuovi}; }
function biscottoOutcome(choice){ if(G.ui.gattoFine==='guardiano'||G.ui.scudo){ G.ui.scudo=0; giveXP(25); addPage('biscotto',S.PAG.biscotto[0],S.PAG.biscotto[1],false); persist(); return {ok:true,text:'Biscotto salta sul davanzale, sbatte contro la lastra di vetro e ci rimane male. Se ne va con la coda alta. Lo scudo ha retto.'}; }  const B=S.biscotto(), t=todayIdx(); let ok=false;
  if(choice==='davanzale'){ sim.setLuce(Math.min(2,sim.view().setup.luce+1)); ok=true; }
  else if(choice==='pallina'){ ok=((t*13+sim.d)%10)<7; }
  if(ok){ giveXP(25); addPage('biscotto',S.PAG.biscotto[0],S.PAG.biscotto[1],false); } else { sim.setMalus(.12,12); giveXP(5); }
  persist(); return {ok,text:ok?(choice==='davanzale'?B.davanzale:B.pallina)+' '+B.ok:(choice==='pallina'?B.pallinaNo+' ':'')+B.male}; }
function resolveDecision(id,choice){ const p=sim.pending.find(x=>x.id===id); const r=resolveDecision0(id,choice); if(p&&!sim.pending.find(x=>x.id===id)){ try{ treeNode({k:'scelta',lane:'vaso',t:'Una decisione nel vaso',ch:CHL[choice]||choice,alt:choice==='separa'?'Lasciare fare':'Separarli',major:true}); treeDiff(); }catch(e){} } return r; }
function resolveDecision0(id,choice){ const p=sim.pending.find(x=>x.id===id); if(!p) return; if(choice==='separa'&&!spend(1)) return; sim.resolve(id,choice); giveXP(5); updateCodex(); if(G.real.owed>0) catchUp(); persist(); }
function closeChapter(){ try{ treeDiff(); }catch(e){} const r=closeChapter0(); try{ treeNode({k:'capitolo',lane:'vaso',t:'Fine del capitolo: '+((T.FINALI[r.k]||{}).nome||r.k),major:true}); }catch(e){} return r; }
function closeChapter0(){ const fp=sim.closeChapter(); const k=fp.finale; const first=!G.libro[k]; const v=sim.view(); const culto=(v.sp.find(x=>x.society)||{society:{}}).society.culto; G.libro[k]=G.libro[k]||{n:0,first:Date.now(),setup:v.setup,d:fp.d,chapter:fp.chapter}; G.libro[k].n++; addPage('fin-'+k+'-'+fp.chapter,T.FINALI[k].nome,S.epilogo(k,culto),false); giveXP(first?100:30); const carta=drawCard(k); persist(); return {k,first,culto,carta}; }
function newGame(name,setup){ const seed=1+Math.floor(Math.random()*99999); G=fresh(name,setup,seed); sim=T.createSim(setup,{seed,game:true,decisions:true,needs:true}); const pieno=setup.piante.length||setup.insetti.length; G.ui.fase=pieno?5:0; if(pieno) planArrivals(0); else sim.setNeeds({um:0,ter:0}); G.real.lastDay=todayIdx(); G.req=makeRequest(); updateCodex(); addPage('inizio',S.PAG.inizio[0],S.PAG.inizio[1],false); G.ui.nextBiscotto=sim.d+14; persist(); }
window.__app={wipeGlass,treeDiff,nightFx,gattoChoice,nightCtx,pickNight,bumpNeeds,skipStart,forceArrival,passaNotte,catchUp,autoCare,demoDay,CARTE,mazzoTot,drawCard,canPlay,playCard,regen,spend,scorri,TASKS,slotMax,startTask,taskLeft,readyTasks,collectTask,pullArrival,taskPing,refreshReq,nowMs,minToCure,minToTempo,CURE_MAX,TEMPO_MAX,T,S,esc,XPT,lvlOf,LIM,CULTICON,store,todayIdx,lvl,rank,fresh,persist,loadSave,newGame,giveXP,addPage,updateCodex,makeRequest,reqCheck,dueArrivals,takeArrival,inbox,toast,doAct,osserva,queueDecisions,checkNewDay,biscottoOutcome,resolveDecision,closeChapter,lastN,
 get G(){return G;},get sim(){return sim;},get popups(){return popups;},set popups(v){popups=v;}};
})();
