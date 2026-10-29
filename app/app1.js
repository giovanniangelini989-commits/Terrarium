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
// Tempo della stanza: nowMs include lo scostamento dei test (G.dev.offset, in giorni, anche frazionario); localMs è l'ora locale; una notte del vaso ogni fascia di 6 ore (SLOT_MS).
const SLOT_MS=6*3600000, NOTTI_GIORNO=4, OWED_MAX=8*NOTTI_GIORNO;
const nowMs=()=>Date.now()+(G&&G.dev?G.dev.offset:0)*864e5;
const localMs=()=>nowMs()-new Date().getTimezoneOffset()*60000;
const todayIdx=()=>Math.floor(localMs()/864e5);
const slotIdx=()=>Math.floor(localMs()/SLOT_MS);
const isoOf=t=>new Date(t*864e5).toISOString().slice(0,10);
const lvl=()=>lvlOf(G.player.xp), rank=()=>S.TITOLI[Math.min(lvl()-1,S.TITOLI.length-1)];
function fresh(name,setup,seed){ return {v:2,name,seed,player:{xp:0,serie:0,serieMax:0,protezioni:0,lastReqDay:null},real:{lastDay:0,lastSlot:null,cure:6,cureT:0,owed:0},req:{day:0,kind:'',done:false},arrivi:{list:[],n:0},mazzo:{},vasi:[],cal:null,libro:{},codex:{specie:{},cult:{},anomalie:{}},quaderno:[],settings:{audio:{suoni:true,voce:true,vol:.6},calma:{pausa:true,soft:false},tempo:'auto'},ui:{snoozeFinale:0,tut:false,pausaDay:-1,storyN:0,unread:0,nextBiscotto:0,fase:5,vasoN:1,vasoDal:null},dev:{offset:0},power:{salto:0,ultimoDono:null,donoN:0,usate:0,resto:0},sim:null,created:Date.now()}; }
function persist(){ if(!G||!sim) return; G.sim=sim.save(); store.set(JSON.stringify(G)); }
function loadSave(){ const s=store.get(); if(!s) return false; try{ const g=JSON.parse(s); if(!g||g.v!==2||!g.sim) return false; G=g; G.quaderno=G.quaderno||[]; G.ui=Object.assign({fase:5,snoozeFinale:0,tut:false,pausaDay:-1,storyN:0,unread:0,nextBiscotto:0},G.ui); sim=T.createSim({luce:1,acqua:1,piante:[],insetti:[],oggetti:[]},{seed:g.seed,game:true,decisions:true,needs:true,capitolo:(g.sim.st&&g.sim.st.chapterNo)||1,eredita:{ultimo:g.sim.st&&g.sim.st.lastFinale||null}}); sim.load(g.sim);
    G.arrivi=G.arrivi||{list:[],n:0}; if(!G.arrivi.list.length||G.arrivi.list.some(a=>a.due>5000)){ G.arrivi={list:[],n:0}; planArrivals(sim.d); } delete G.coda; G.mazzo=G.mazzo||{}; if(G.ui.nextBiscotto>5000) G.ui.nextBiscotto=sim.d+14; G.settings=G.settings||{}; G.settings.audio=Object.assign({suoni:true,voce:true,vol:.6},G.settings.audio||{}); G.settings.calma=Object.assign({pausa:true,soft:false},G.settings.calma||{}); G.settings.tempo=G.settings.tempo||'auto'; G.player=Object.assign({xp:0,serie:0,serieMax:0,protezioni:0,lastReqDay:null},G.player); G.real=Object.assign({lastDay:0,cure:6,cureT:0},G.real); delete G.real.actions; delete G.real.tempo; delete G.real.tempoT; G.real.owed=G.real.owed||0; if(G.real.lastSlot==null) G.real.lastSlot=Math.min(slotIdx(),G.real.lastDay*NOTTI_GIORNO+NOTTI_GIORNO-1); G.vasi=G.vasi||[]; if(G.ui.vasoN==null) G.ui.vasoN=G.vasi.length+1; if(G.ui.vasoDal==null) G.ui.vasoDal=Math.floor((G.created||Date.now())/864e5); calEnsure(); G.codex=G.codex||{specie:{},cult:{},anomalie:{}}; G.libro=G.libro||{}; G.dev=G.dev||{offset:0}; powerEnsure(); if(!G.req||!G.req.kind) G.req=makeRequest();
    return true; }catch(e){ console.error('salvataggio non leggibile',e); return false; } }
const lastN=()=>{ const L=sim.log; return L.length?(L[L.length-1].n||0):0; };
// ---------- XP, livelli ----------
function giveXP(n){ const before=lvl(); G.player.xp+=n; const after=lvl(); if(after>before) popups.push({t:'levelup',lvl:after,titolo:S.TITOLI[Math.min(after-1,S.TITOLI.length-1)]}); }
// ---------- quaderno ----------
function addPage(id,titolo,testo,major){ if(G.quaderno.some(p=>p.id===id)) return false; const pg={id,d:sim.d,titolo,testo}; if((G.ui.vasoN||1)>1) pg.vaso=G.ui.vasoN; G.quaderno.unshift(pg); if(G.quaderno.length>240) G.quaderno.length=240; G.ui.unread++; if(major) popups.push({t:'pagina',id}); return true; }
function storyScan(){ const v=sim.view(); sim.log.filter(e=>(e.n||0)>G.ui.storyN).forEach(e=>{ const P=S.PAG;
  if(e.kind==='mutazione'&&S.MUTMAP[e.text]) addPage('mutazione',P.mutazione[0],P.mutazione[1],false);
  else if(e.kind==='societa'){ addPage('societa',P.societa[0],P.societa[1],true); const sp=v.sp.find(x=>e.text.indexOf(x.nome)===0&&x.society); if(sp&&sp.society) addPage('mito-'+sp.society.cult,'Il popolo di '+sp.nome.toLowerCase(),S.MITO[sp.society.cult]||'',false); }
  else if(e.kind==='guerra'&&e.text.indexOf('Guerra tra')===0) addPage('guerra',P.guerra[0],P.guerra[1],true);
  else if(e.kind==='mostro') addPage('mostro',P.mostro[0],P.mostro[1],false);
  else if(e.kind==='estinzione'&&v.sp.length&&v.sp.every(x=>!x.alive)) addPage('spento',P.spento[0],P.spento[1],true);
  else if(e.kind==='pace') addPage('pace',P.pace[0],P.pace[1],false);
  else if(e.kind==='scisma') addPage('scisma',P.scisma[0],P.scisma[1],false); });
  G.ui.storyN=lastN(); }
function updateCodex(){ const v=sim.view(); v.sp.forEach(x=>{ const c=G.codex.specie[x.id]||(G.codex.specie[x.id]={mut:[],soc:false}); x.mut.forEach(m=>{ if(!c.mut.includes(m)){ c.mut.push(m); if(sim.d>0){ giveXP(10); ricordo('ric_muta'); } } }); if(x.society){ if(!c.soc) ricordo('ric_popolo'); c.soc=true; G.codex.cult[x.society.cult]=true; } if(x.monster) G.codex.anomalie[x.id]=true; }); storyScan(); }
// ---------- richieste: pensieri del giocatore ----------
function makeRequest(){ const f=G.ui.fase==null?5:G.ui.fase; if(f<1) return {day:todayIdx(),kind:'terra',done:false}; if(f<2) return {day:todayIdx(),kind:'acqua',done:false}; const n=sim.view().needs; let k=f<4?'notte':'osserva'; if(n.pul<.55&&f>=3) k='pulisci'; else if(n.um<.45) k='acqua'; else if(n.ter<.35) k='nutri'; return {day:todayIdx(),kind:k,done:false}; }
function reqCheck(kind){ if(G.letargo){ G.letargo=null; G.real.leth=0; G.ui.risvegli=(G.ui.risvegli||0)+1; G.real.cure=Math.max(G.real.cure||0,maniMax()); try{ calRow(todayIdx())[2]|=8; }catch(e){} } const r=G.req; if(r.done||r.kind!==kind) return false; r.done=true; r.doneAt=nowMs(); giveXP(20); G.ui.reqN=(G.ui.reqN||0)+1; G.ui.reqToday=(G.ui.reqToday||0)+1; if(G.ui.reqToday<=3) G.real.cure=Math.min(maniMax()+2,G.real.cure+2); const t=todayIdx(), p=G.player; if(p.lastReqDay!==t){ p.serie=(p.lastReqDay===t-1||(p.serie===0&&p.lastReqDay==null))?p.serie+1:1; p.serieMax=Math.max(p.serieMax,p.serie); p.lastReqDay=t; if(p.serie%7===0&&p.protezioni<2){ p.protezioni++; toast('Serie di '+p.serie+' giorni: hai guadagnato una protezione.'); } } return true; }
// ---------- arrivi (le notifiche della storia) ----------
const SLOTS=[[6,'insetto'],[14,'pianta'],[24,'oggetto'],[36,'insetto'],[50,'oggetto'],[66,'insetto'],[84,'pianta'],[104,'oggetto'],[126,'insetto'],[150,'oggetto']];
function planArrivals(t0){ const a=G.arrivi; SLOTS.forEach(([off,k],i)=>{ a.list.push({id:'a'+(a.n++),slot:k,due:t0+off,state:'futuro'}); }); }
function materialize(a){ const v=sim.view(), R=T.rng(G.seed*13+a.id.length*7+sim.d), refused=G.arrivi.list.filter(x=>x.state==='rifiutato').map(x=>x.param); const have=v.setup;
  const alive=v.sp.filter(x=>x.alive&&T.SPECIE[x.id].dieta!=='insetti').length;
  if(a.force){ if(a.slot==='pianta'){ if(have.piante.includes(a.force)) return false; const t=S.ARR.pianta[a.force]; a.kind='pianta'; a.param=a.force; a.title=t[0]; a.text=t[1]; return true; } if(have.insetti.includes(a.force)) return false; const t=S.ARR.specie[a.force]; a.kind='specie'; a.param=a.force; a.title=t[0]; a.text=t[1]; return true; }
  if(a.slot==='insetto'){ if(have.insetti.length>=LIM.insetti) return false; const o=['mosche','coleotteri','termiti','lumache','ragni','formiche'].filter(id=>!have.insetti.includes(id)&&!refused.includes(id)&&(id!=='ragni'||alive>=2)); if(!o.length) return false; const id=o[Math.floor(R()*Math.min(2,o.length))]; const t=S.ARR.specie[id]; a.kind='specie'; a.param=id; a.title=t[0]; a.text=t[1]; return true; }
  if(a.slot==='pianta'){ if(have.piante.length>=LIM.piante) return false; const o=['fungo','succulenta','carnivora','felce','muschio'].filter(id=>!have.piante.includes(id)&&!refused.includes(id)&&(id!=='carnivora'||have.insetti.includes('mosche'))); if(!o.length) return false; const id=o[0]; const t=S.ARR.pianta[id]; a.kind='pianta'; a.param=id; a.title=t[0]; a.text=t[1]; return true; }
  if(have.oggetti.length>=LIM.oggetti) return false; const pool=['orologio','giocattolo','specchio','statuina','libro','moneta','radio','candela'].filter(id=>!have.oggetti.includes(id)&&!refused.includes(id)); if(pool.length<1) return false; const er=G.ui.eredita, eo=er&&er.oggetto&&!have.oggetti.length?pool.indexOf(er.oggetto):-1; const i0=eo>=0?eo:Math.floor(R()*pool.length); const alt=pool.length>1?[pool[i0],pool[(i0+1+Math.floor(R()*(pool.length-1)))%pool.length]]:[pool[0]]; if(alt.length>1&&alt[0]===alt[1]) alt[1]=pool[(i0+1)%pool.length];
  a.kind='oggetto'; a.alt=alt; a.title='Dal tuo tavolo'; a.text=alt.length>1?'Sul tavolo trovi due cose: '+S.ARR.oggetto[alt[0]][0]+', e '+S.ARR.oggetto[alt[1]][0]+'. Il vaso ne regge una sola.':'Sul tavolo trovi '+S.ARR.oggetto[alt[0]][0]+'. Nel vaso c’è ancora posto.'; return true; }
function dueArrivals(){ const t=sim.d, out=[]; for(const a of G.arrivi.list){ if(a.state!=='futuro'||a.due>t) continue; if(materialize(a)){ a.state='nuovo'; out.push(a); break; } else a.state='saltato'; } return out; }
function takeArrival(id,choice){ const a=G.arrivi.list.find(x=>x.id===id), st=a&&a.state; const r=takeArrival0(id,choice); if(choice==='no'&&a&&st==='nuovo'&&a.force&&G.ui.fase<4){ const n=G.arrivi.n; forceArrival(a.slot,a.force); const nid='a'+n; for(let i=popups.length-1;i>=0;i--) if(popups[i].t==='arrivo'&&popups[i].id===nid) popups.splice(i,1); } /* avvio guidato: se lo lasci fuori resta sul davanzale come notifica (non si riapre da solo), così il vaso non resta fermo */ if(a&&st==='nuovo'){ try{ const nmA=a.kind==='specie'?nm('SPECIE',a.param):a.kind==='pianta'?nm('PIANTE',a.param):nm('OGGETTI',a.param), yes=choice!=='no'; treeNode({k:'scelta',lane:'vaso',t:'Arriva: '+lc1(nmA),ch:yes?'Lo accogli nel vaso':'Lo lasci fuori',alt:yes?'Lasciarlo fuori':'Accoglierlo nel vaso',major:true}); treeDiff(); }catch(e){} } return r; }
function takeArrival0(id,choice){ const a=G.arrivi.list.find(x=>x.id===id); if(!a||a.state!=='nuovo') return false; let ok=false;
  if(choice==='no'){ a.state='rifiutato'; if(a.kind==='oggetto') a.alt.forEach(o=>{}); a.param=a.param||(a.alt&&a.alt[0]); if(a.force&&(G.ui.fase||0)<(a.kind==='pianta'?3:4)) G.arrivi.list.push({id:'a'+(G.arrivi.n++),slot:a.slot,force:a.force,due:sim.d+1,state:'futuro'}); }
  else { a.state='accettato'; if(a.kind==='specie') ok=sim.addSpecies(a.param); else if(a.kind==='pianta') ok=sim.addPlant(a.param); else { a.param=choice; ok=sim.addObject(choice); } giveXP(10);
    if(ok){ if(a.kind==='pianta'&&(G.ui.fase||0)<3){ G.ui.fase=3; G.ui.d3=sim.d; planAfterMoss(sim.d); G.req=makeRequest(); } else if(a.kind==='specie'&&(G.ui.fase||0)<4){ G.ui.fase=4; G.ui.eredita=null; G.req=makeRequest(); } } }
  updateCodex(); persist(); return ok; }
function skipStart(){ if((G.ui.fase||0)>=4) return false; sim.setNeeds({um:.7,ter:.8}); ['muschio','felce'].forEach(p=>sim.addPlant(p)); sim.addSpecies('formiche'); G.ui.fase=5; G.arrivi={list:[],n:0}; G.arrivi.list=[]; planArrivals(sim.d); G.req=makeRequest(); updateCodex(); persist(); return true; }
function forceArrival(slot,force){ G.arrivi.list.push({id:'a'+(G.arrivi.n++),slot,force,due:sim.d,state:'futuro'}); dueArrivals().forEach(x=>popups.push({t:'arrivo',id:x.id})); }
function planAfterMoss(d){ const a=G.arrivi, ant=(G.ui.eredita&&G.ui.eredita.anticipo)||0; a.list.push({id:'a'+(a.n++),slot:'pianta',force:'felce',due:d+3,state:'futuro'},{id:'a'+(a.n++),slot:'insetto',force:'formiche',due:d+7-ant,state:'futuro'}); planArrivals(d+10); }
const inbox=()=>G.arrivi.list.filter(x=>x.state==='nuovo');
// ---------- carte: asso nella manica (dati e logica; presentazione in carte.js) ----------
// r: carta (70%) · argento (22%) · sasso (8%) · ricordo (non si pesca). set: tempo · casa · biscotto · cassetto. come: riga per la sagoma nell'album.
const CARTE={
 // Il tempo che fa
 pioggia:{n:'Pioggia gentile',ic:'🌧️',r:'carta',set:'tempo',d:'Più umido per qualche giorno, subito. Non costa cure.',x:'Una pioggia sottile scende dentro il vaso. Il muschio beve, il vetro si appanna.',w:{Quiete:3,Mostri:1,'Società':2,Conflitti:2}},
 ombra:{n:'Ombra fresca',ic:'🌫️',r:'carta',set:'tempo',d:'Il meteorite si quieta: il vaso rallenta.',x:'Stendi un panno sul vaso. Il sasso rallenta, come chi si addormenta.',w:{Quiete:2,Mostri:3,'Società':1,Conflitti:3}}, // TESTO-STORIA
 scintilla:{n:'Scintilla',ic:'⚡',r:'carta',set:'tempo',d:'Il meteorite si carica di colpo: più mutazioni, più in fretta.',x:'Una scintilla salta dal tuo dito al sasso. Il battito si fa fitto.',w:{Quiete:1,Mostri:3,'Società':3,Conflitti:2}}, // TESTO-STORIA
 brina:{n:'Brina',ic:'❄️',r:'argento',set:'tempo',d:'Una notte di gelo: i bisogni risalgono un po’ e il sasso rallenta.',x:'Al mattino il vetro è coperto di brina. Dentro, tutto è fermo e intatto, come in una foto.',w:{Quiete:3,Mostri:1,'Società':2,Conflitti:2}}, // TESTO-STORIA
 sasso:{n:'Il sasso cresce',ic:'☄️',r:'sasso',set:'tempo',d:'Il meteorite diventa più grande: accumula energia più in fretta, per sempre.',x:'Il sasso fa un rumore come di ghiaccio che si incrina. Poi è un po’ più grande, e batte più forte.',w:{Quiete:1,Mostri:3,'Società':2,Conflitti:2}},
 ric_muta:{n:'La prima mutazione',ic:'✨',r:'ricordo',set:'tempo',d:'La foto del vaso il giorno in cui una creatura è cambiata per la prima volta.',x:'',come:'Arriva il giorno in cui una creatura cambia per la prima volta.'}, // TESTO-STORIA
 // La casa
 latte:{n:'Tazza di latte',ic:'🥛',r:'carta',set:'casa',d:'Mani piene, e due in più.',x:'La nonna ti porta latte caldo e biscotti. Torni al vaso con le mani calde.',w:{Quiete:3,Mostri:2,'Società':2,Conflitti:2}},
 terra:{n:'Terra buona',ic:'🪱',r:'carta',set:'casa',d:'Pulisce il vetro e nutre il suolo, senza usare cure.',x:'Versi una manciata di terra buona e passi uno straccio sul vetro.',w:{Quiete:3,Mostri:1,'Società':2,Conflitti:2}}, // TESTO-STORIA
 tempo:{n:'Tempo in bottiglia',ic:'⏳',r:'carta',set:'casa',d:'+2 carte «Salta 2 giorni» (fino a 6).',x:'Stappi una bottiglietta che sembrava vuota: dentro c’era un po’ di tempo.',w:{Quiete:2,Mostri:2,'Società':3,Conflitti:2}}, // TESTO-STORIA
 candela:{n:'Candela eterna',ic:'🕯️',r:'argento',set:'casa',d:'Mette una candela nel vaso, anche se gli oggetti sono già al massimo.',x:'Accendi una candela che non si consuma. La metti vicino al vetro e te ne vai in punta di piedi.',w:{Quiete:2,Mostri:1,'Società':3,Conflitti:1}}, // TESTO-STORIA
 scheggia:{n:'Scheggia del sasso',ic:'🪨',r:'sasso',set:'casa',d:'Il meteorite si carica fino in fondo, di colpo.',x:'Trovi una scheggia viola sotto il letto. Appena la avvicini al vetro, il sasso la riconosce e si accende tutto.',w:{Quiete:1,Mostri:3,'Società':3,Conflitti:2}}, // TESTO-STORIA
 ric_popolo:{n:'Il primo popolo',ic:'🏛️',r:'ricordo',set:'casa',d:'La foto del vaso il giorno in cui qualcuno, là dentro, ha fondato un popolo.',x:'',come:'Arriva quando una specie fonda il suo primo popolo.'}, // TESTO-STORIA
 // Biscotto
 scudo:{n:'Scudo di vetro',ic:'🔰',r:'carta',set:'biscotto',d:'Salva dal prossimo Biscotto. Resta pronto finché non serve.',x:'Fissi una lastra di vetro sul davanzale. La prossima zampata di Biscotto non passerà.',w:{Quiete:2,Mostri:2,'Società':2,Conflitti:3}}, // TESTO-STORIA
 campanello:{n:'Campanello',ic:'🔔',r:'carta',set:'biscotto',d:'Biscotto si tiene lontano per una settimana.',x:'Leghi un campanello alla tenda. Biscotto lo sente da lontano e cambia strada.',w:{Quiete:2,Mostri:2,'Società':2,Conflitti:2}}, // TESTO-STORIA
 gomitolo:{n:'Gomitolo',ic:'🧶',r:'carta',set:'biscotto',d:'La prossima pallina distrae Biscotto di sicuro.',x:'Lasci un gomitolo rosso sul tappeto. Nessun gatto resiste a un gomitolo rosso.',w:{Quiete:2,Mostri:2,'Società':2,Conflitti:3}}, // TESTO-STORIA
 radio:{n:'Radio di notte',ic:'📻',r:'argento',set:'biscotto',d:'Mette una radio nel vaso, anche se gli oggetti sono già al massimo.',x:'Una radiolina si accende da sola, appena. Dentro il fruscio sembra esserci una voce.',w:{Quiete:2,Mostri:1,'Società':3,Conflitti:1}},
 fusa:{n:'Le fusa',ic:'🐈',r:'sasso',set:'biscotto',d:'Biscotto si addormenta accanto al vaso: per un mese non salta più, e lo scudo è pronto.',x:'Biscotto si accuccia contro il vetro e fa le fusa. Il sasso batte al suo ritmo. Per un po’, nessuno disturba nessuno.',w:{Quiete:3,Mostri:1,'Società':2,Conflitti:2}}, // TESTO-STORIA
 ric_biscotto:{n:'Biscotto, alla fine',ic:'🐾',r:'ricordo',set:'biscotto',d:'La foto del vaso il giorno in cui la storia di Biscotto è arrivata alla fine.',x:'',come:'Arriva alla fine della storia di Biscotto.'}, // TESTO-STORIA
 // Il cassetto
 bussola:{n:'Bussola',ic:'🧭',r:'carta',set:'cassetto',d:'Un indizio vago su dove sta andando il vaso.',x:'Giri una bussola rotta: l’ago indica, a tentoni, dove sta andando il vaso.',w:{Quiete:2,Mostri:2,'Società':2,Conflitti:2}}, // TESTO-STORIA
 lente:{n:'Lente d’ingrandimento',ic:'🔍',r:'carta',set:'cassetto',d:'Uno sguardo in più, da vicino, senza usare cure.',x:'Appoggi la lente al vetro.',w:{Quiete:2,Mostri:3,'Società':2,Conflitti:2}}, // TESTO-STORIA
 semi:{n:'Bustina di semi',ic:'🌱',r:'carta',set:'cassetto',d:'Nutre il suolo due volte: le piante ripartono.',x:'Apri una bustina di semi trovata in fondo al cassetto. Li sparpagli sul muschio con due dita.',w:{Quiete:3,Mostri:1,'Società':2,Conflitti:1}}, // TESTO-STORIA
 moneta:{n:'Moneta d’argento',ic:'🪙',r:'argento',set:'cassetto',d:'Mette una moneta nel vaso, anche se gli oggetti sono già al massimo.',x:'Una moneta d’argento rotola sul muschio e si ferma, in piedi, al centro del vaso.',w:{Quiete:1,Mostri:1,'Società':3,Conflitti:3}},
 chiave:{n:'La chiave del cassetto',ic:'🗝️',r:'sasso',set:'cassetto',d:'Dal cassetto esce subito qualcosa per il vaso, e 2 carte «Salta 2 giorni».',x:'La chiave gira. Nel cassetto c’è una cosa che non ricordavi di avere, e sembra aspettasse proprio te.',w:{Quiete:2,Mostri:2,'Società':3,Conflitti:2}}, // TESTO-STORIA
 ric_finale:{n:'Il primo finale',ic:'📖',r:'ricordo',set:'cassetto',d:'La foto del vaso il giorno del tuo primo finale.',x:'',come:'Arriva con il tuo primo finale.'}}; // TESTO-STORIA
const SET_CARTE={tempo:'Il tempo che fa',casa:'La casa',biscotto:'Biscotto',cassetto:'Il cassetto'};
const ODDS={carta:.70,argento:.22,sasso:.08,gA:3,gS:6,cura:7};
const BUSSOLA={Quiete:'L’ago resta quasi fermo: il vaso va verso la quiete.',Mostri:'L’ago trema verso qualcosa di grosso, che deve ancora crescere.','Società':'L’ago gira in tondo, come una piccola folla.',Conflitti:'L’ago punta in due direzioni insieme.'};
const mazzoTot=()=>Object.values(G.mazzo).reduce((a,b)=>a+b,0);
function CK(){ if(!G.carte) G.carte={pA:G.ui.pity||0,pS:0,giorniCura:0,lastCura:null,pesche:0}; delete G.ui.pity; if(!G.album){ G.album={}; Object.keys(G.ui.viste||{}).forEach(id=>{ if(CARTE[id]) G.album[id]={d:sim.d,n:1}; }); delete G.ui.viste; } return G.carte; }
// Quote e garanzie: la stessa fonte della pesca (l'album le mostra).
function cardOdds(){ const C=CK(); return {carta:ODDS.carta,argento:ODDS.argento,sasso:ODDS.sasso,garanzia:{argento:Math.max(1,ODDS.gA-C.pA),sasso:Math.max(1,ODDS.gS-C.pS)},pesche:C.pesche,cura:{fatti:C.giorniCura%ODDS.cura,ogni:ODDS.cura}}; }
function drawCard(k,fonte){ const C=CK(); const fam=k&&T.FINALI[k]?T.FINALI[k].fam:null; C.pA++; C.pS++; C.pesche++;
  let r; if(C.pS>=ODDS.gS) r='sasso'; else if(C.pA>=ODDS.gA) r='argento'; else { const x=Math.random(); r=x<ODDS.sasso?'sasso':x<ODDS.sasso+ODDS.argento?'argento':'carta'; }
  if(r==='sasso'){ C.pS=0; C.pA=0; } else if(r==='argento') C.pA=0; C['n'+r[0].toUpperCase()]=(C['n'+r[0].toUpperCase()]||0)+1;
  let pool=Object.entries(CARTE).filter(([id,c])=>c.r===r); const nu=pool.filter(([id])=>!G.album[id]); if(nu.length) pool=nu; // prima le nuove
  const wf=c=>fam?(c.w[fam]||1):1; const tot=pool.reduce((a,[id,c])=>a+wf(c),0); let x=Math.random()*tot, pick=pool[0][0]; for(const [id,c] of pool){ x-=wf(c); if(x<=0){ pick=id; break; } }
  return giveCard(pick,fonte||'capitolo'); }
function giveCard(id,fonte){ CK(); const c=CARTE[id]; if(!c) return null; const nuova=!G.album[id]; if(c.r==='ricordo'&&!nuova) return null; if(nuova) G.album[id]={d:sim.d,n:0}; G.album[id].n++;
  if(c.r!=='ricordo') G.mazzo[id]=(G.mazzo[id]||0)+1;
  else { const a=G.album[id], N=(G.tree||{nodes:[]}).nodes; for(let i=N.length-1;i>=Math.max(0,N.length-3);i--) if(N[i].img){ a.ni={d:N[i].d,t:N[i].t}; break; } if(!a.ni){ try{ const im=window.__vase&&window.__vase.snap&&window.__vase.snap(); if(im&&im.length<8000) a.img=im; }catch(e){} } }
  return {id,nuova,fonte}; }
function ricordo(id){ const r=giveCard(id,'ricordo'); if(r) popups.push({t:'carta',id,fonte:'ricordo',nuova:true}); return r; }
function cardImg(id){ const a=G.album&&G.album[id]; if(!a) return null; if(a.img) return a.img; if(a.ni){ const n=(G.tree||{nodes:[]}).nodes.find(x=>x.img&&x.d===a.ni.d&&x.t===a.ni.t); if(n) return n.img; } return null; }
function keepRicordo(node){ if(!G.album||!node.img) return; Object.values(G.album).forEach(a=>{ if(a.ni&&!a.img&&a.ni.d===node.d&&a.ni.t===node.t) a.img=node.img; }); }
// Un giorno in cui curi il vaso conta una volta sola; ogni 7 giorni di cura (non di fila) arriva una pesca. Niente si perde.
function curaDay(){ const C=CK(), t=todayIdx(); if(C.lastCura===t) return; C.lastCura=t; C.giorniCura++; if(C.giorniCura%ODDS.cura===0){ const r=drawCard(null,'cura'); if(r) popups.push({t:'carta',id:r.id,fonte:'cura',nuova:r.nuova}); } }
function canPlay(id){ const c=CARTE[id]; if(!c) return 'Non hai questa carta.'; if(c.r==='ricordo') return 'È un ricordo: resta nell’album.'; if(!(G.mazzo[id]>0)) return 'Non hai questa carta.'; const v=sim.view();
  if(id==='sasso'&&v.setup.meteorite>=2) return 'Il sasso è già al massimo.'; if((id==='moneta'||id==='candela'||id==='radio')&&v.setup.oggetti.includes(id)) return 'Questo oggetto è già nel vaso.'; if((id==='scudo'||id==='fusa')&&G.ui.scudo) return 'Lo scudo è già pronto.'; if(id==='gomitolo'&&G.ui.gomitolo) return 'Il gomitolo è già sul tappeto.'; return ''; }
function playCard(id){ const r=playCard0(id); if(r&&r.ok!==false){ try{ treeNode({k:'carta',lane:'vaso',t:'Giochi la carta «'+((CARTE[id]||{}).n||id)+'»'}); }catch(e){} } return r; }
function playCard0(id){ const why=canPlay(id); if(why) return {ok:false,why}; const c=CARTE[id]; let extra='';
  if(id==='pioggia'){ sim.act('acqua'); sim.act('acqua'); } else if(id==='terra'){ sim.act('nutri'); sim.act('pulisci'); } else if(id==='semi'){ sim.act('nutri'); sim.act('nutri'); }
  else if(id==='scintilla') sim.charge(35); else if(id==='ombra') sim.charge(-30); else if(id==='scheggia') sim.charge(100); else if(id==='scudo') G.ui.scudo=1;
  else if(id==='brina'){ const n=sim.view().needs; sim.setNeeds({um:Math.min(1,n.um+.15),ter:Math.min(1,n.ter+.15),pul:Math.min(1,n.pul+.15)}); sim.charge(-20); }
  else if(id==='tempo') donoSalti(2); else if(id==='chiave'){ donoSalti(2); extra=pullArrival()?' Qualcuno sta bussando.':''; }
  else if(id==='latte') G.real.cure=maniMax()+2;
  else if(id==='campanello') G.ui.nextBiscotto=Math.max(G.ui.nextBiscotto||0,sim.d)+7; else if(id==='gomitolo') G.ui.gomitolo=1; else if(id==='fusa'){ G.ui.nextBiscotto=Math.max(G.ui.nextBiscotto||0,sim.d)+30; G.ui.scudo=1; }
  else if(id==='bussola'){ const f=sim.classify(); extra=' '+BUSSOLA[T.FINALI[f].fam]; } else if(id==='lente'){ try{ extra=' '+S.osserva(sim.view(),sim.d+G.player.xp+7).text; }catch(e){} } else if(id==='sasso') sim.growMeteo(); else sim.addObject(id);
  G.mazzo[id]--; if(G.mazzo[id]<=0) delete G.mazzo[id]; G.ui.carteGiocate=(G.ui.carteGiocate||0)+1; giveXP(5); updateCodex(); persist(); return {ok:true,text:c.x+extra,c}; }
// ---------- azioni ----------
let toastT=null;
function toast(msg){ let el=$('#toast'); if(el) el.remove(); el=document.createElement('div'); el.className='toast'; el.id='toast'; el.textContent=msg; document.body.appendChild(el); clearTimeout(toastT); toastT=setTimeout(()=>{ const e=$('#toast'); if(e) e.remove(); },2600); }
function doAct(name){ regen(); const n0=sim.view().needs, f0=G.ui.fase==null?5:G.ui.fase; const free=name==='terra'?(f0<1||n0.ter<.35):name==='acqua'?n0.um<.35:name==='nutri'?n0.ter<.35:name==='pulisci'?n0.pul<.5:true; let gratis=false;
  if(G.real.cure>0) G.real.cure--; else if(free) gratis=true; else return {ok:false,why:'zero',text:S.TEMPO.maniZero,mani:mani()};
  const troppa=name==='acqua'&&n0.um>=.95; const m=sim.act(name); G.ui.tut=true; reqCheck(name); try{ curaDay(); }catch(e){} const f=G.ui.fase==null?5:G.ui.fase;
  if(name==='terra'&&f<1){ G.ui.fase=1; G.req=makeRequest(); } else if(name==='acqua'&&f===1){ G.ui.fase=2; sim.setNeeds({um:Math.max(.6,sim.view().needs.um)}); G.req=makeRequest(); forceArrival('pianta','muschio'); }
  persist(); return {ok:true,text:m,mani:mani(),gratis,troppa}; }
function osserva(){ const v=sim.view(); const o=S.osserva(v,sim.d+G.player.xp); reqCheck('osserva'); persist(); return o; }
// ---------- tempo reale ----------
function queueDecisions(){ sim.pending.forEach(p=>{ if(!popups.some(q=>q.t==='decisione'&&q.id===p.id)) popups.push({t:'decisione',id:p.id}); }); }
// ---------- le mani (energia delle cure, docs/gameplay/tempo.md §2): 6 al massimo (8 dal livello 3, 10 dal 5), una ogni 20 minuti, +2 per richiesta esaudita ----------
const MANI_MS=20*60000;
const maniMax=()=>{ const l=lvl(); return l>=5?10:l>=3?8:6; };
function regen(){ const r=G.real, n=nowMs(), max=maniMax(); if(r.cure==null) r.cure=max;
  if(!r.cureT||r.cure>=max) r.cureT=n; else { const k=Math.floor((n-r.cureT)/MANI_MS); if(k>0){ r.cure=Math.min(max,r.cure+k); r.cureT=r.cure>=max?n:r.cureT+k*MANI_MS; } } }
function mani(){ regen(); const r=G.real, max=maniMax(); return {n:r.cure,max,bonus:Math.max(0,r.cure-max),minuti:r.cure>=max?0:Math.max(1,Math.ceil((MANI_MS-(nowMs()-r.cureT))/60000)),why:r.cure>0?'':'zero'}; }
function autoCare(){ if((G.ui.fase==null?5:G.ui.fase)<3) return; const n=sim.view().needs; if(n.um<.55) sim.act('acqua'); if(n.ter<.45) sim.act('nutri'); if(n.pul<.7) sim.act('pulisci'); }
function demoDay(auto){ if(auto) autoCare(); const st=sim.step(); if(st.paused){ queueDecisions(); return {pausa:true}; } afterDay(); updateCodex(); if(sim.d%10===0) persist(); return {pausa:false}; }
// Letargo: i giorni di assenza (dal 2° in poi) non uccidono il vaso. I bisogni calano fino alla soglia e lì si fermano; si esce alla prima cura.
const LETARGO={um:.3,ter:.2,pul:.5};
function inLetargo(){ return (G.real.leth||0)>0&&G.real.owed<=G.real.leth; }
function catchUp(){ let n=0; while(G.real.owed>0){ const lt=inLetargo(); const row=calRow(Math.floor((G.real.lastSlot-G.real.owed+1)/NOTTI_GIORNO)); if(lt) row[2]|=2; const r=sim.step(); if(r.paused){ queueDecisions(); break; } if(lt){ const nd=sim.view().needs; sim.setNeeds({um:Math.max(nd.um,LETARGO.um),ter:Math.max(nd.ter,LETARGO.ter),pul:Math.max(nd.pul,LETARGO.pul)}); G.real.leth--; } G.real.owed--; n++; afterDay(); } if(G.real.owed<=0) G.real.leth=0; return n; }
function passaNotte(){ const out={passi:0,eventi:[],pausa:false}; const startN=lastN(); calRow(todayIdx()); const st=sim.step(); if(st.paused){ queueDecisions(); out.pausa=true; } else { out.passi=1; giveXP(2); afterDay(); if(Math.random()<.75){ const nb=pickNight(); if(nb) popups.push({t:'notte',id:nb}); } } out.eventi=sim.log.filter(e=>(e.n||0)>startN&&e.kind!=='azione'&&e.kind!=='meteorite'); updateCodex(); queueDecisions(); persist(); return out; }
// ---------- power card «Salta 2 giorni» ----------
// Non è una carta da album: si consuma. Ogni giorno reale, al primo accesso, ne arrivano 2 (tetto 6: tre giorni senza usarle e sei pieno,
// così raccoglierle non diventa un obbligo). Il dono non si accumula nei giorni di assenza. Usarne una fa passare 2 notti vere (passaNotte×2).
// Bloccata se: fase di avvio (<3), vaso in letargo (prima lo svegli con una cura: DECISIONI §1), finale da chiudere, decisione in sospeso.
// Se la prima notte si ferma su una decisione, la seconda resta in «resto» e si svolge da sola appena risolvi (come catchUp con owed).
// Non tocca la serie di giorni: il salto muove il vaso, non il calendario.
const POWER={max:6,dono:2,giorni:2};
function powerEnsure(){ if(!G.power) G.power={salto:0,ultimoDono:null,donoN:0,usate:0,resto:0}; return G.power; }
function donoSalti(n){ const p=powerEnsure(); const k=Math.min(n,Math.max(0,POWER.max-p.salto)); p.salto+=k; return k; }
function donoPower(){ const p=powerEnsure(), t=todayIdx(); if(p.ultimoDono===t) return 0; const n=Math.min(POWER.dono,Math.max(0,POWER.max-p.salto)); p.salto+=n; p.ultimoDono=t; p.donoN=n; persist(); return n; }
function saltoWhy(){ const p=powerEnsure(); if(!(p.salto>0)) return 'carte'; if((G.ui.fase==null?5:G.ui.fase)<3) return 'inizio'; if(G.letargo) return 'letargo'; if(sim.finalePending) return 'finale'; if(sim.pending.length||G.real.owed>0||p.resto>0) return 'decisione'; return ''; }
function powerCards(){ donoPower(); const p=G.power; return {salto:p.salto,max:POWER.max,nuove:p.ultimoDono===todayIdx()?(p.donoN||0):0,resto:p.resto||0,why:saltoWhy()}; }
function nottiSalto(){ const p=powerEnsure(), startN=lastN(), nb0=popups.filter(q=>q.t==='notte').length; let passi=0,pausa=false;
  while(p.resto>0){ const r=passaNotte(); if(r.pausa){ pausa=true; break; } p.resto--; passi++; }
  let seen=0; popups=popups.filter(q=>{ if(q.t!=='notte') return true; seen++; return seen<=nb0+1; }); // una sola notte viva per salto
  const eventi=sim.log.filter(e=>(e.n||0)>startN&&e.kind!=='azione'&&e.kind!=='meteorite'); persist(); return {passi,pausa,resto:p.resto,eventi}; }
function usaSalto(){ donoPower(); const why=saltoWhy(); if(why) return {ok:false,why,passi:0,eventi:[]}; const p=G.power, t=todayIdx(); p.salto--; p.usate=(p.usate||0)+1; p.resto=POWER.giorni; calRow(t)[2]|=4; p.saltiOggi=(p.saltiOggi&&p.saltiOggi.t===t)?{t,n:p.saltiOggi.n+POWER.giorni}:{t,n:POWER.giorni}; return Object.assign({ok:true},nottiSalto()); } // niente nodo nell'albero: non è un evento del vaso, e 2 nodi al giorno gonfiano il salvataggio
function riprendiSalto(){ const p=powerEnsure(); if(!(p.resto>0)||sim.pending.length||G.real.owed>0) return null; return nottiSalto(); }
function afterDay(){ try{ treeDiff(); }catch(e){} try{ diarioDay(); }catch(e){} dueArrivals().forEach(a=>popups.push({t:'arrivo',id:a.id})); const d=sim.d; if(!G.ui.nextBiscotto) G.ui.nextBiscotto=d+14;
  if(d>=G.ui.nextBiscotto&&d>=10&&(G.ui.fase==null||G.ui.fase>=4)){ const st=G.ui.gatto||0; if(st===1||st>=5){ if(G.ui.gattoFine!=='guardiano') popups.push({t:'biscotto'}); } else popups.push({t:'gatto',s:st}); if(st<5) G.ui.gatto=st+1; G.ui.nextBiscotto=d+(st>=4?30:12)+((d*7)%7); } }

// ===== L'albero del vaso: discendenze, scelte e strade non prese =====
const nm=(tab,id)=>(T[tab]&&T[tab][id]&&T[tab][id].nome)||String(id||'');
const lc1=x=>x?x.charAt(0).toLowerCase()+x.slice(1):x;
let treeBusy=false;
function treeState(v){ return {sp:v.sp.map(x=>({id:x.id,alive:x.alive,mut:x.mut.slice(),soc:x.society?x.society.name:null,cult:x.society?x.society.cult:null,monster:!!x.monster})),wars:v.wars.map(w=>w.slice().sort().join('+')),piante:v.setup.piante.slice(),ogg:v.setup.oggetti.slice()}; }
function pushNode(n){ const Tr=G.tree; n.d=n.d==null?sim.d:n.d; n.cap=sim.chapter||1;
  if(n.major&&typeof window!=='undefined'&&window.__vase&&window.__vase.snap){ try{ const im=window.__vase.snap(); if(im&&im.length<60000) n.img=im; }catch(e){} }
  Tr.nodes.push(n); const imgs=Tr.nodes.filter(x=>x.img); if(imgs.length>36) imgs.slice(0,imgs.length-36).forEach(x=>{ keepRicordo(x); delete x.img; }); if(Tr.nodes.length>400) Tr.nodes.splice(0,Tr.nodes.length-400); }
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
  if(st>=4){ const D=N.destino(f); G.ui.gattoFine=D.k; if(D.k==='ladro'){ const o=sim.view().setup.oggetti[0]; if(o) sim.removeObject(o); } if(D.k==='guardiano') G.ui.scudo=1; res={t:D.t,x:D.x}; ricordo('ric_biscotto'); try{ treeNode({k:'gatto',lane:'vaso',t:'Biscotto diventa «'+D.t+'»',major:true}); }catch(e){} addPage('gatto-fine','Biscotto · '+D.t,D.x,true); }
  else { const C=N.GATTO[st], c=C.ch[i]; if(c.k) f[c.k]=(f[c.k]||0)+1; try{ if(c.fx) c.fx(FXA()); }catch(e){} res={t:C.t,x:c.o}; try{ treeNode({k:'scelta',lane:'vaso',t:'Biscotto · '+C.t,ch:c.l,alt:(C.ch[1-i]||{}).l||'',major:true}); }catch(e){} addPage('gatto-'+st,'Biscotto · '+C.t,C.x+' '+c.o,false); }
  giveXP(15); updateCodex(); persist(); return res; }
function pullArrival(){ for(let i=0;i<4;i++){ let a=G.arrivi.list.find(x=>x.state==='futuro'); if(!a){ planArrivals(sim.d); a=G.arrivi.list.find(x=>x.state==='futuro'); } a.due=sim.d; const got=dueArrivals(); if(got.length){ got.forEach(x=>popups.push({t:'arrivo',id:x.id})); return true; } } return false; }
function refreshReq(force){ if(G.req.done&&(force||nowMs()-(G.req.doneAt||0)>=45000)){ G.req=makeRequest(); return true; } return false; }
// Una notte del vaso ogni fascia di 6 ore della stanza (tempo.md §1). app3 la chiama ogni 15 s quando non è busy(): se sono maturate notti le svolge qui.
// Nuovo giorno reale: come prima (risveglio, serie, richiesta nuova, mani piene). Stessa giornata: popup «notte-ora» con gli eventi. Letargo (DECISIONI §1): oltre le prime 4 notti dall'ultima visita, se mancano ≥ 2 giorni.
function checkNewDay(){ const t=todayIdx(), s=slotIdx(), r=G.real; donoPower(); avanzaVisto(); if(r.lastSlot==null) r.lastSlot=Math.min(s,r.lastDay*NOTTI_GIORNO+NOTTI_GIORNO-1);
  const newDay=t>r.lastDay; if(!newDay&&s<=r.lastSlot){ refreshReq(); return null; }
  const startN=lastN(), nuove=Math.min(Math.max(0,s-r.lastSlot),OWED_MAX); let elapsed=0, missed=false;
  if(newDay){ elapsed=Math.min(t-r.lastDay,8); missed=G.player.lastReqDay!=null&&(t-1)>G.player.lastReqDay&&G.player.serie>0; r.lastDay=t; G.ui.reqToday=0;
    if(elapsed>1){ r.leth=(r.leth||0)+Math.max(0,nuove-NOTTI_GIORNO); G.letargo={da:t-elapsed+1,giorni:(G.letargo?G.letargo.giorni:0)+elapsed-1}; G.ui.letargoN=(G.ui.letargoN||0)+1; } }
  r.owed=(r.owed||0)+nuove; r.lastSlot=s; catchUp(); updateCodex(); calRow(t)[2]|=1;
  const nuovi=sim.log.filter(e=>(e.n||0)>startN&&e.kind!=='azione'&&e.kind!=='meteorite').slice(-4);
  if(newDay){ r.cure=Math.max(r.cure||0,maniMax()); G.req=makeRequest(); if(missed){ if(G.player.protezioni>0) popups.push({t:'serie'}); else G.player.serie=0; }
    popups.unshift({t:'risveglio',eventi:nuovi,giorni:elapsed,notti:nuove}); try{ donoNonna(); }catch(e){} if((G.ui.fase==null||G.ui.fase>=3)){ const nb=pickNight(); if(nb) popups.push({t:'notte',id:nb}); } }
  else { refreshReq(); popups.push({t:'notte-ora',eventi:nuovi,notti:nuove}); }
  persist(); return {nuovi,notti:nuove}; }
// ---------- Il dono della nonna: uno al giorno reale, mai accumulato né perso, nessuna serie ----------
function donoNonna(){ const t=todayIdx(); if((G.ui.fase==null?5:G.ui.fase)<2) return null; const n=G.nonna||(G.nonna={ultimo:null,id:null,n:0}); if(n.ultimo===t) return null;
  const v=sim.view().needs, L=S.NONNA, ok={acqua:v.um<.85,terra:v.ter<.85,latte:(G.real.cure||0)<maniMax()+2,biscotto:true,spago:true};
  let i=((G.seed||0)+t)%L.length, k=0; while(k<L.length&&!ok[L[i].id]){ i=(i+1)%L.length; k++; } const d=L[i];
  if(d.id==='acqua') bumpNeeds({um:.08}); else if(d.id==='terra') bumpNeeds({ter:.08}); else if(d.id==='latte') G.real.cure=Math.min(maniMax()+2,(G.real.cure||0)+2);
  else if(d.id==='biscotto') G.ui.nextBiscotto=Math.max(G.ui.nextBiscotto||0,sim.d)+3; else if(d.id==='spago') giveXP(3);
  n.ultimo=t; n.id=d.id; n.n++; popups.push({t:'dono',id:d.id,ic:d.ic,testo:d.t}); return {id:d.id,ic:d.ic,t:d.t}; }
// ---------- Avanza di una notte: una notte vera subito, tetto per apertura (ricaricato dopo 30 min di chiusura), senza conti alla rovescia ----------
const AVANZA={max:3,pausaMin:30};
function avanzaVisto(){ const a=G.ui.avanza||(G.ui.avanza={n:0,visto:nowMs()}), now=nowMs(); if(now-(a.visto||0)>AVANZA.pausaMin*60000) a.n=0; a.visto=now; }
function avanzaWhy(){ avanzaVisto(); if((G.ui.fase==null?5:G.ui.fase)<3) return 'inizio'; if(G.letargo) return 'letargo'; if(sim.finalePending) return 'finale'; const p=powerEnsure(); if(sim.pending.length||G.real.owed>0||p.resto>0) return 'decisione'; if(G.ui.avanza.n>=AVANZA.max) return 'tetto'; return ''; }
function avanzaInfo(){ const why=avanzaWhy(); return {n:G.ui.avanza.n,max:AVANZA.max,why}; }
function avanzaNotte(){ const why=avanzaWhy(); if(why) return {ok:false,why,passi:0,pausa:false,eventi:[],rimaste:Math.max(0,AVANZA.max-G.ui.avanza.n)}; G.ui.avanza.n++; calRow(todayIdx())[2]|=4; const r=passaNotte(); return {ok:true,passi:r.passi,pausa:r.pausa,eventi:r.eventi,rimaste:Math.max(0,AVANZA.max-G.ui.avanza.n)}; }
function orologio(){ const s=slotIdx(), r=G.real, t=todayIdx(); return {d:sim.d,vaso:G.ui.vasoN||1,quarto:((s%NOTTI_GIORNO)+NOTTI_GIORNO)%NOTTI_GIORNO,prossimaNotteMs:Math.max(0,(s+1)*SLOT_MS-localMs()),notti:NOTTI_GIORNO,letargo:!!G.letargo,dovute:(r.owed||0)+Math.max(0,s-(r.lastSlot==null?s:r.lastSlot)),oggi:{t,data:isoOf(t)}}; }
// ---------- calendario (tempo.md §3): G.cal = {v, t0, r:[[dt, d0, f]]}, f: 1 visitato · 2 letargo · 4 salto · 8 risveglio · 16 nuovo vaso ----------
const CAL_MAX=400;
function calEnsure(){ if(!G.cal||!Array.isArray(G.cal.r)) G.cal={v:1,t0:todayIdx(),r:[]}; return G.cal; }
function calRow(t){ const c=calEnsure(), dt=t-c.t0, R=c.r; for(let i=R.length-1;i>=0;i--){ if(R[i][0]===dt) return R[i]; if(R[i][0]<dt) break; } const row=[dt,sim?sim.d:0,0]; R.push(row); if(R.length>CAL_MAX) R.splice(0,R.length-CAL_MAX); return row; }
const CAL_ICON={inizio:'🫙',nasce:'🐜',estinta:'🪦',muta:'🧬',popolo:'🏛️',cultura:'🗿',mostro:'👹',guerra:'⚔️',pace:'🕊️',pianta:'🌿',oggetto:'🧸',scelta:'✋',carta:'🃏',gatto:'🐈',capitolo:'✨',pagina:'📓',letargo:'💤',risveglio:'🌅',salto:'⏭️',vaso:'🫙'};
const CAL_PRIO=['capitolo','popolo','guerra','pace','mostro','nasce','estinta','muta','vaso','letargo','risveglio','salto','pianta','oggetto','cultura','scelta','carta','gatto','inizio','pagina'];
function calendario(mese){ const c=calEnsure(), R=c.r, t=todayIdx(), cur=G.ui.vasoN||1; let anno,m; if(typeof mese==='string'&&/^\d{4}-\d{2}$/.test(mese)){ anno=+mese.slice(0,4); m=+mese.slice(5,7); } else { const dd=new Date(t*864e5); anno=dd.getUTCFullYear(); m=dd.getUTCMonth()+1; }
  const vasoOf=[]; let vn=1; R.forEach((r,i)=>{ if(r[2]&16) vn++; vasoOf[i]=vn; });   // il numero del vaso di una riga = 1 + le righe «nuovo vaso» fino a lei
  const nottiOf=i=>{ const r=R[i], nx=R[i+1]; if(!nx){ return Math.max(0,sim.d-r[1]); } if(nx[2]&16){ const vv=G.vasi[vasoOf[i]-1]; return Math.max(0,(vv?vv.dv:r[1])-r[1]); } return Math.max(0,nx[1]-r[1]); };
  const nodiDi=v=>v===cur?((G.tree&&G.tree.nodes)||[]):((G.vasi[v-1]||{}).nodi||[]);
  const evDi=(v,lo,hi)=>{ const out=[]; nodiDi(v).forEach(n=>{ if(n.d>lo&&n.d<=hi){ const e={d:n.d,k:n.k,icon:CAL_ICON[n.k]||'·',text:n.t,major:!!n.major}; if(n.img) e.img=n.img; out.push(e); } });
    G.quaderno.forEach(p=>{ if((p.vaso||1)===v&&p.d>lo&&p.d<=hi) out.push({d:p.d,k:'pagina',icon:CAL_ICON.pagina,text:p.titolo,major:false}); }); return out; };
  const nDays=new Date(Date.UTC(anno,m,0)).getUTCDate(), primo=(new Date(Date.UTC(anno,m-1,1)).getUTCDay()+6)%7, giorni=[];
  for(let g=1;g<=nDays;g++){ const tg=Math.floor(Date.UTC(anno,m-1,g)/864e5), dt=tg-c.t0, day={t:tg,data:isoOf(tg),g,oggi:tg===t,futuro:tg>t,vaso:null,dal:null,al:null,notti:0,letargo:false,salti:false,risveglio:false,visitato:false,nuovoVaso:false,icona:'',eventi:[]};
    R.forEach((r,i)=>{ if(r[0]!==dt) return; const nn=nottiOf(i), v=vasoOf[i]; day.vaso=v; if(day.dal==null||r[2]&16){ day.dal=r[1]+1; } day.al=r[1]+nn; day.notti+=nn; if(r[2]&2) day.letargo=true; if(r[2]&4) day.salti=true; if(r[2]&8) day.risveglio=true; if(r[2]&1) day.visitato=true; if(r[2]&16) day.nuovoVaso=true;
      day.eventi=day.eventi.concat(evDi(v,r[1],r[1]+nn+(i===R.length-1?1:0))); });
    if(day.letargo) day.eventi.push({d:day.dal,k:'letargo',icon:CAL_ICON.letargo,text:S.TEMPO.letargoCal,major:false}); if(day.risveglio) day.eventi.push({d:day.al,k:'risveglio',icon:CAL_ICON.risveglio,text:S.TEMPO.risveglioCal,major:false}); if(day.salti) day.eventi.push({d:day.al,k:'salto',icon:CAL_ICON.salto,text:S.CAL.salto,major:false}); if(day.nuovoVaso) day.eventi.push({d:0,k:'vaso',icon:CAL_ICON.vaso,text:S.CAL.vaso,major:true});
    day.eventi.sort((a,b)=>a.d-b.d); let best=99; day.eventi.forEach(e=>{ const pi=CAL_PRIO.indexOf(e.k); const px=pi<0?98:pi; if(px<best){ best=px; day.icona=e.icon; } }); giorni.push(day); }
  const so=G.power&&G.power.saltiOggi; return {oggi:{t,data:isoOf(t)},vaso:{n:cur,dal:G.ui.vasoDal},prossimaNotteMs:orologio().prossimaNotteMs,saltiOggi:so&&so.t===t?so.n:0,mese:{anno,mese:m,primo,giorni}}; }
// ---------- diario della storia (S.diario in story.js): una pagina ogni 3+ giorni del vaso, legata a ciò che succede ----------
function diarioDay(){ if(!S.diario) return; const n=G.ui.vasoN||1; const q=G.quaderno.map(p=>(p.vaso||1)===n?p:Object.assign({},p,{d:-99})); const pg=S.diario(sim.view(),Object.assign({},G,{quaderno:q})); if(pg) addPage(pg.id,pg.titolo,pg.testo,false); }
// ---------- fine del vaso: si riparte dal sasso (tempo.md §7). Resta tutto ciò che sta fuori dal vetro; dentro, solo il meteorite. ----------
const CULTOGG={sacro:'statuina',sapere:'orologio',commercio:'moneta',gioco:'giocattolo',mistero:'specchio',comunicazione:'radio',fuoco:'candela',agricoltura:'libro'};
function archiviaVaso(r){ const v=sim.view(), fam=(T.FINALI[r.k]||{}).fam||'Quiete', n=G.ui.vasoN||1, t=todayIdx(); treeEnsure(); const N=G.tree.nodes;
  const nodi=N.filter(x=>x.major).slice(-24).map(x=>({k:x.k,t:String(x.t).slice(0,60),d:x.d})); let img=null; for(let i=N.length-1;i>=0&&!img;i--) if(N[i].img&&N[i].img.length<=12000) img=N[i].img; N.forEach(keepRicordo);
  const vaso={n,k:r.k,dal:G.ui.vasoDal==null?t:G.ui.vasoDal,al:t,dv:sim.d,popoli:v.sp.filter(x=>x.society).length,mut:v.sp.reduce((a,x)=>a+x.mut.length,0),specie:v.sp.map(x=>x.id),nodi}; if(img) vaso.img=img;
  G.vasi=G.vasi||[]; G.vasi.push(vaso); const con=G.vasi.filter(x=>x.img); if(con.length>12) con.slice(0,con.length-12).forEach(x=>{ delete x.img; }); G.vasi.slice(0,-12).forEach(x=>{ if(x.nodi&&x.nodi.length>8) x.nodi=x.nodi.slice(-8); });
  const er={fam,testo:(S.TEMPO&&S.TEMPO.eredita&&S.TEMPO.eredita[fam])||''}; if(fam==='Quiete') er.um=.3; else if(fam==='Mostri') er.E=40; else if(fam==='Società'){ const sc=v.sp.find(x=>x.society); er.oggetto=(sc&&CULTOGG[sc.society.cult])||null; } else if(fam==='Conflitti') er.anticipo=1;
  const seed=1+Math.floor(Math.random()*99999); G.seed=seed; const setup={luce:v.setup.luce,acqua:v.setup.acqua,meteorite:v.setup.meteorite,piante:[],insetti:[],oggetti:[]};
  sim=T.createSim(setup,{seed,game:true,decisions:true,needs:true,capitolo:v.chapter,eredita:{E:er.E,um:er.um,ultimo:r.k}}); sim.setNeeds({um:er.um||0,ter:0});
  G.ui.vasoN=n+1; G.ui.vasoDal=t; G.ui.fase=0; G.ui.d3=null; G.ui.storyN=0; G.ui.snoozeFinale=0; G.ui.eredita=er; G.ui.nightLog=[]; G.ui.nextBiscotto=sim.d+14; G.arrivi={list:[],n:0}; powerEnsure().resto=0; G.real.owed=0; G.real.leth=0; G.letargo=null;
  G.tree={nodes:[],snap:treeState(sim.view())}; pushNode({k:'inizio',lane:'vaso',t:S.TEMPO.nuovoVasoTitolo,major:true}); G.req=makeRequest();
  const c=calEnsure(); c.r.push([t-c.t0,0,16|1]); if(c.r.length>CAL_MAX) c.r.splice(0,c.r.length-CAL_MAX);
  addPage('vaso-'+(n+1),S.TEMPO.nuovoVasoTitolo,S.TEMPO.nuovoVaso(n+1)+(er.testo?' '+er.testo:''),false);
  if(typeof microInit==='function'){ G.micro=null; try{ microInit(); }catch(e){} } updateCodex(); persist(); return vaso; }
function biscottoOutcome(choice){ if(G.ui.gattoFine==='guardiano'||G.ui.scudo){ G.ui.scudo=0; giveXP(25); addPage('biscotto',S.PAG.biscotto[0],S.PAG.biscotto[1],false); persist(); return {ok:true,text:'Biscotto salta sul davanzale, sbatte contro la lastra di vetro e ci rimane male. Se ne va con la coda alta. Lo scudo ha retto.'}; }  const B=S.biscotto(), t=todayIdx(); let ok=false;
  if(choice==='davanzale'){ sim.setLuce(Math.min(2,sim.view().setup.luce+1)); ok=true; }
  else if(choice==='pallina'){ ok=((t*13+sim.d)%10)<7||!!G.ui.gomitolo; G.ui.gomitolo=0; }
  if(ok){ giveXP(25); addPage('biscotto',S.PAG.biscotto[0],S.PAG.biscotto[1],false); } else { sim.setMalus(.12,12); giveXP(5); }
  persist(); return {ok,text:ok?(choice==='davanzale'?B.davanzale:B.pallina)+' '+B.ok:(choice==='pallina'?B.pallinaNo+' ':'')+B.male}; }
function resolveDecision(id,choice){ const p=sim.pending.find(x=>x.id===id); const r=resolveDecision0(id,choice); if(p&&!sim.pending.find(x=>x.id===id)){ try{ treeNode({k:'scelta',lane:'vaso',t:'Una decisione nel vaso',ch:CHL[choice]||choice,alt:choice==='separa'?'Lasciare fare':'Separarli',major:true}); treeDiff(); }catch(e){} } return r; }
function resolveDecision0(id,choice){ const p=sim.pending.find(x=>x.id===id); if(!p) return; sim.resolve(id,choice); giveXP(5); updateCodex(); if(G.real.owed>0) catchUp(); riprendiSalto(); persist(); }
function closeChapter(){ try{ treeDiff(); }catch(e){} const r=closeChapter0(); try{ treeNode({k:'capitolo',lane:'vaso',t:'Fine del capitolo: '+((T.FINALI[r.k]||{}).nome||r.k),major:true}); }catch(e){} r.vaso=archiviaVaso(r); return r; }
function closeChapter0(){ const fp=sim.closeChapter(); const k=fp.finale; const first=!G.libro[k]; const v=sim.view(); const culto=(v.sp.find(x=>x.society)||{society:{}}).society.culto; G.libro[k]=G.libro[k]||{n:0,first:Date.now(),setup:v.setup,d:fp.d,chapter:fp.chapter}; G.libro[k].n++; addPage('fin-'+k+'-'+fp.chapter,T.FINALI[k].nome,S.epilogo(k,culto),false); giveXP(first?100:30); const dc=drawCard(k,'capitolo'); if(Object.keys(G.libro).length===1&&G.libro[k].n===1) ricordo('ric_finale'); persist(); return {k,first,culto,carta:dc.id,cartaNuova:dc.nuova}; }
function newGame(name,setup){ const seed=1+Math.floor(Math.random()*99999); G=fresh(name,setup,seed); sim=T.createSim(setup,{seed,game:true,decisions:true,needs:true}); const pieno=setup.piante.length||setup.insetti.length; G.ui.fase=pieno?5:0; if(pieno) planArrivals(0); else sim.setNeeds({um:0,ter:0}); G.real.lastDay=todayIdx(); G.real.lastSlot=slotIdx(); G.ui.vasoN=1; G.ui.vasoDal=todayIdx(); G.vasi=[]; calEnsure(); calRow(todayIdx())[2]|=1; G.req=makeRequest(); updateCodex(); addPage('inizio',S.PAG.inizio[0],S.PAG.inizio[1],false); G.ui.nextBiscotto=sim.d+14; donoPower(); persist(); }
window.__app={AVANZA,donoNonna,avanzaNotte,avanzaInfo,POWER,powerCards,usaSalto,riprendiSalto,donoPower,wipeGlass,treeDiff,nightFx,gattoChoice,nightCtx,pickNight,bumpNeeds,skipStart,forceArrival,passaNotte,catchUp,autoCare,demoDay,CARTE,SET_CARTE,mazzoTot,drawCard,giveCard,cardOdds,cardImg,canPlay,playCard,regen,mani,maniMax,donoSalti,orologio,calendario,calRow,calEnsure,archiviaVaso,diarioDay,pullArrival,refreshReq,nowMs,slotIdx,localMs,isoOf,SLOT_MS,NOTTI_GIORNO,T,S,esc,XPT,lvlOf,LIM,CULTICON,store,todayIdx,lvl,rank,fresh,persist,loadSave,newGame,giveXP,addPage,updateCodex,makeRequest,reqCheck,dueArrivals,takeArrival,inbox,toast,doAct,osserva,queueDecisions,checkNewDay,biscottoOutcome,resolveDecision,closeChapter,lastN,
 get G(){return G;},get sim(){return sim;},get popups(){return popups;},set popups(v){popups=v;}};
// ===== Microclima (ecologo, docs/ecologia/modello.md §8). Blocco unico: avvolge le funzioni sopra senza cambiarle. =====
// G.micro = micro.save() (+ ofs: ora reale del primo passo); un passo di 6 ore reali per ogni giorno del vaso; cure → bagna/nutri/terra/pulisci; vetro → asciuga.
const MC=window.__MICRO||(typeof require==='function'?(()=>{ try{ return require('./microclima.js'); }catch(e){ return null; } })():null); let micro=null;
const POSIZ=['ombra','mezza','sole'];
const stagione=()=>{ const m=new Date(nowMs()).getMonth(); return m===11||m<2?'inverno':(m>=5&&m<=7?'estate':'mezza'); };
function microSync(){ const v=sim.view(), c=v.clima||{}; micro.act('imposta',{um:v.needs.um,muffa:1-v.needs.pul,tappo:c.aperto?'aperto':'chiuso',posizione:POSIZ[v.setup.luce]||'mezza',drenaggio:c.drenaggio||0,collemboli:c.collemboli||0,piante:v.plants.map(p=>p.id),brucatori:brucatori(v)}); return v; }
// Brucatori (modello §9): lumache e coleotteri vivi, popolazione/12 (la partenza) con tetto 2 per specie; /6 → entrambe alla partenza = 0,33 (equilibrio), una sola 0,17.
function brucatori(v){ let n=0; for(const x of v.sp){ if(x.alive&&(x.id==='lumache'||x.id==='coleotteri')) n+=Math.min(2,x.pop/12); } return Math.min(1,n/6); }
function microStep(){ if(!micro) return; try{ const v=microSync(), ofs=G.micro&&G.micro.ofs||0, pos=POSIZ[v.setup.luce]||'mezza', st=stagione(), lt=inLetargo();
    micro.step(6,t=>Object.assign(MC.ambienteDi(t+ofs,{stagione:st,posizione:pos}),{letargo:lt}));
    if(lt&&v.clima&&v.clima.ristagno>.3) sim.setNeeds({rist:.3}); avvisiGiungla(); }catch(e){ console.error('microclima',e); } }   // letargo (DECISIONI §1): in assenza neanche il ristagno fa danni
// Avvisi (al massimo uno al giorno del vaso ciascuno) e cura Pota. Il limite giornaliero è del microclima (pota.pronta); la pota non costa mani.
function avvisiGiungla(){ if(!micro||inLetargo()) return; const m=micro.view(), u=G.ui, d=sim.d; const ombra=Math.max(0,...Object.values(m.piante||{}).map(p=>p.ombra||0));
  if(ombra>.8&&u.avSoff!==d){ u.avSoff=d; toast('La felce ha coperto il muschio.'); }
  else if(m.mangiatoUltimo>0&&u.avMang!==d){ u.avMang=d; toast('Le lumache hanno rosicchiato le foglie.'); } }
function pota(){ if(!micro||!sim) return {ok:false,motivo:'vuoto',text:''}; regen(); micro.act('pota'); const m=micro.view(), u=m.pota&&m.pota.ultima||{ok:false,motivo:'vuoto'};
  const nome=u.pianta&&(sim.view().plants.find(p=>p.id===u.pianta)||{}).nome||u.pianta;
  const text=u.ok?'Tagli '+(u.pianta==='felce'?'la felce che copriva il muschio.':''+(nome?'la pianta più invadente ('+nome+').':'le foglie di troppo.')):u.motivo==='riposo'?'Le piante hanno bisogno di un giorno per riprendersi.':'Non c’è niente da tagliare.';
  if(u.ok) persist(); return {ok:u.ok,motivo:u.motivo,pianta:u.pianta,tagliato:u.tagliato,text}; }
function microInit(){ micro=null; if(!MC||!sim) return; try{ const v=sim.view(); micro=MC.create({piante:v.plants.map(p=>p.id),posizione:POSIZ[v.setup.luce]||'mezza'});
    if(G.micro&&G.micro.S) micro.load(G.micro); else G.micro={ofs:new Date(nowMs()).getHours()};   // salvataggi vecchi: il microclima nasce allineato al vaso
    microSync(); const st=sim.step; if(!sim.__micro){ sim.__micro=1; sim.step=function(){ const r=st.apply(sim,arguments); if(r&&!r.paused) microStep(); return r; }; } }catch(e){ console.error('microclima',e); micro=null; } }
const _persist=persist; persist=function(){ if(G&&micro){ try{ G.micro=Object.assign(micro.save(),{ofs:G.micro&&G.micro.ofs||0}); }catch(e){} } return _persist(); };
const _newGame=newGame; newGame=function(name,setup){ const r=_newGame(name,setup); G.micro=null; microInit(); persist(); return r; };
const _loadSave=loadSave; loadSave=function(){ const ok=_loadSave(); if(ok) microInit(); return ok; };
const _doAct=doAct; doAct=function(name){ if(micro){ try{ micro.act({acqua:'bagna',nutri:'nutri',terra:'terra',pulisci:'pulisci'}[name]||'nessuna'); }catch(e){} } return _doAct(name); };
const _wipeGlass=wipeGlass; wipeGlass=function(area,scrub,cleared){ if(micro){ try{ micro.act('asciuga',{v:Math.min(1,(area||0)*2)}); if(cleared>0) micro.act('pulisci',{zona:'vetro'}); }catch(e){} } return _wipeGlass(area,scrub,cleared); };
// Letargo coerente: se una decisione ha fermato il recupero dell'assenza, la cura che sveglia il vaso non toglie la protezione ai giorni di assenza ancora da recuperare.
const _reqCheck=reqCheck; reqCheck=function(kind){ const leth=G.real.leth||0; const r=_reqCheck(kind); if(leth>0&&!(G.real.leth>0)&&G.real.owed>0) G.real.leth=Math.min(leth,G.real.owed); return r; };
// Il tappo: aperto il vaso si asciuga e la muffa cala, chiuso l'acqua ricircola (e al sole scalda come una serra). aperto: true|false, assente = inverte.
function tappo(aperto){ if(!sim) return null; const c=sim.view().clima||{}; const a=aperto==null?c.tappo!=='aperto':!!aperto; sim.setTappo(a); if(micro) micro.act(a?'apri':'chiudi'); persist();
  return {tappo:a?'aperto':'chiuso',testo:a?'Hai tolto il tappo: entra aria, il vetro si schiarisce e la terra si asciuga.':'Hai chiuso il tappo: dentro l’acqua torna a girare, come pioggia.'}; }
function microView(){ if(!micro||!sim) return null; const v=micro.view(); v.clima=sim.view().clima; return v; }
Object.assign(window.__app,{pota,persist,newGame,loadSave,doAct,wipeGlass,reqCheck,tappo,micro:microView});
})();
