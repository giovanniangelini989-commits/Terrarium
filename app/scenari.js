/* MODALITÀ TEST — si attiva solo con ?test nell'indirizzo. Usa solo le API pubbliche
   (window.__app, __ui, __vase, __film, __notti, __v3d). Senza ?test non fa nulla. */
(function(){
'use strict';
var ON=false; try{ var q=location.search; if(/[?&]test=0(&|#|$)/.test(q)){ localStorage.removeItem('terrario-test'); } else if(/[?&]test(=|&|#|$)/.test(q)){ localStorage.setItem('terrario-test','1'); } ON=localStorage.getItem('terrario-test')==='1'; }catch(e){ try{ ON=/[?&]test(=|&|#|$)/.test(location.search)&&!/[?&]test=0/.test(location.search); }catch(e2){} }
if(!ON) return;
try{ boot(); }catch(e){ console.warn('scenari: avvio fallito', e&&e.message); }

function boot(){
const A=window.__app, U=window.__ui, T=A.T;
const $=s=>document.querySelector(s);
const nope=()=>{};
const SETUP=(insetti,piante,oggetti)=>({luce:1,acqua:1,meteorite:1,piante:piante||[],insetti:insetti||[],oggetti:oggetti||[]});

/* ---------- aiuti ---------- */
function lasciaGioco(){ var f=document.getElementById('film'); if(f) f.remove(); var s=document.getElementById('splash'); if(s) s.remove(); U.mode='game'; U.tab='vaso'; }
function entra(){ lasciaGioco(); A.persist(); U.render(); }
function nuova(insetti,piante,oggetti){ A.newGame('Prova',SETUP(insetti,piante,oggetti)); try{ A.sim.setNeeds({um:.7,ter:.8,pul:.9}); }catch(e){} A.popups.length=0; entra(); }
function avviata(){ // mantiene la partita in corso, se c'è; altrimenti ne crea una avviata
  if(!A.G||U.mode!=='game'){ nuova([],[],[]); }
  if((A.G.ui.fase||0)<4) A.skipStart();
  lasciaGioco(); return A.sim; }
function popup(){ A.persist(); U.render(); setTimeout(function(){ try{ A.queueDecisions(); U.showNextPopup(); }catch(e){} },250); }
const sp=id=>A.sim.sp.find(x=>x.id===id);
function pop(id,n){ var x=sp(id); if(x) x.pop=n; }
function societa(id,cult){ var x=sp(id); if(!x) return; x.gen=Math.max(x.gen,8); x.X=Math.max(x.X,45); x.society={cult:cult,memi:(function(o){o[cult]=1;return o;})({}),since:Math.max(0,A.sim.d-5),name:x.nome+' '+(T.CULT&&T.CULT[cult]?T.CULT[cult].agg[x.g||0]:'organizzate'),culto:'giocatore'}; }
function guerra(a,b){ var x=sp(a),y=sp(b); if(!x||!y) return; A.sim.wars.push({key:a+'|'+b,a:x,b:y,start:A.sim.d,end:0}); }
function giorni(n){ var tot=0; for(var i=0;i<n;i++){ var r=A.passaNotte(); if(r.pausa) break; tot++; } A.popups.splice(0,A.popups.length,...A.popups.filter(p=>p.t!=='notte')); return tot; }
function avantiFinoFinale(){ var g=0, s=A.sim; while(!s.finalePending&&g<400){ g++; var r=A.demoDay(true); if(r.pausa){ var p=s.pending[0]; s.resolve(p.id,p.type==='mutazione'?'proteggi':p.type==='guerra'?'lascia':'nascosto'); } } A.popups.length=0; return s.finalePending; }

/* ---------- microclima: lo stato si scrive in una copia (__MICRO.create), poi si rimette nel salvataggio e si ricarica ---------- */
const MC=function(){ return window.__MICRO; };
function microCopia(){ var m=MC().create({}); A.persist(); if(A.G&&A.G.micro&&A.G.micro.S) m.load(JSON.parse(JSON.stringify(A.G.micro))); return m; }
function microInietta(m,ofs){ A.persist(); var g=JSON.parse(A.store.get()); g.micro=Object.assign(m.save(),{ofs:(ofs!=null?ofs:(g.micro&&g.micro.ofs)||0)}); A.store.set(JSON.stringify(g)); A.loadSave(); lasciaGioco(); U.render(); }
function microOre(m,ora,n,pos,st){ m.step(n,function(t){ return Object.assign(MC().ambienteDi(ora+t,{stagione:st||'mezza',posizione:pos||'mezza'}),{letargo:false}); }); }
function microScena(f,needs){ avviata(); if(!MC()||typeof A.micro!=='function'||!A.micro()) return false;
  if(needs) A.sim.setNeeds(needs);
  var m=microCopia(); f(m,m._S,MC().JAR); microInietta(m); return true; }
const microOk=function(){ return (MC()&&typeof A.micro==='function'&&typeof A.tappo==='function')||'in arrivo'; };
function segmento(t){ U.mode='game'; U.tab='quaderno'; U.render(); setTimeout(function(){ var b=$('[data-a="cdx"][data-t="'+t+'"]'); if(b) b.click(); },150); }
function mazzoPieno(){ avviata(); Object.keys(A.CARTE).forEach(function(id){ A.G.mazzo[id]=A.G.mazzo[id]||1; }); A.persist(); }
function assenza(n){ avviata(); A.G.real.lastDay=A.todayIdx()-n; A.persist(); A.checkNewDay(); popup(); return true; }

/* ---------- finali: ingredienti per specie ---------- */
const INV={sacro:'fede',sapere:'accademia',commercio:'mercato',gioco:'carnevale',mistero:'mistero',comunicazione:'voci',fuoco:'fiamma',agricoltura:'giardinieri'};
const CULTDI={}; Object.keys(INV).forEach(c=>CULTDI[INV[c]]=c);
const RICETTA={
  equilibrio:[['mosche'],['muschio'],[]], spento:[['mosche'],['muschio'],[]], gigante:[['coleotteri'],['felce'],[]],
  tribu:[['formiche'],['muschio'],[]], fede:[['formiche'],['muschio'],['statuina']], accademia:[['formiche'],['muschio'],['orologio']],
  mercato:[['formiche'],['muschio'],['moneta']], carnevale:[['formiche'],['muschio'],['giocattolo']], mistero:[['formiche'],['muschio'],['specchio']],
  voci:[['formiche'],['muschio'],['radio']], fiamma:[['formiche'],['muschio'],['candela']], giardinieri:[['formiche'],['fungo','muschio'],[]],
  scisma:[['formiche'],['muschio'],['statuina','orologio']], conquista:[['formiche','termiti'],['muschio'],[]], patto:[['formiche','termiti'],['muschio'],['moneta']]
};
function finale(k,chiudiPoi){
  var r=RICETTA[k]||[['formiche'],['muschio'],[]]; nuova(r[0],r[1],r[2]); var s=A.sim;
  var fp=avantiFinoFinale();
  if(!fp){ A.toast('Finale non raggiunto in 400 giorni'); return false; }
  fp.finale=k; // l'oggetto è quello vero del motore: cambia la scelta del finale
  var F=T.FINALI[k];
  if(F&&F.fam==='Società'&&!s.sp.some(x=>x.society)) societa(r[0][0],CULTDI[k]||'tribale');
  A.G.ui.snoozeFinale=0; A.persist(); U.render();
  setTimeout(function(){ var b=$('[data-a="fin-open"]'); if(b) b.click(); if(chiudiPoi){ var n=0, h=setInterval(function(){ var c=$('[data-a="fin-close"]'); if(c){ clearInterval(h); c.click(); } else if(++n>20){ clearInterval(h); try{ A.closeChapter(); U.render(); }catch(e){} } },200); } },500);
  return true; }

/* ---------- le voci ---------- */
function VN(id,l,run,ok,sub){ var v=V(id,l,run,ok,sub); v.noTutto=true; return v; }
function V(id,l,run,ok,sub){ return {id:id,l:l,run:run,ok:ok||function(){return true;},sub:sub||''}; }
const finaliVoci=function(){ var F=T.FINALI||{}; return Object.keys(F).map(function(k){ return V('finale-'+k,F[k].icon+' '+F[k].nome,function(){ return finale(k); },null,F[k].fam); }); };
const gatti=function(){ var N=window.__notti; var G=N&&N.GATTO||[]; var out=[]; G.forEach(function(g,i){ out.push(V('biscotto-'+i,'Capitolo '+(i+1)+(g?': '+g.t:': la zampa'),function(){ avviata(); A.popups.push(i===1?{t:'biscotto'}:{t:'gatto',s:i}); A.G.ui.gatto=Math.max(A.G.ui.gatto||0,i); popup(); },function(){ return !!N; })); }); if(!out.length) out.push(V('biscotto-x','Notte di Biscotto',nope,function(){ return 'in arrivo'; })); return out; };
const RARITA={carta:'Busta «carta» (comune)',argento:'Busta d’argento',sasso:'Busta del sasso',ricordo:'Busta del ricordo'};
const carteRar=function(){ var C=A.CARTE||{}, ids=Object.keys(C), seen={}, out=[]; ids.forEach(function(id){ var r=C[id].r; if(!seen[r]){ seen[r]=1; out.push(V('carta-'+r,(RARITA[r]||'Busta '+r)+': '+C[id].n,function(){ return apriCarta(id); })); } }); return out.length?out:[V('carta-x','Una busta',nope,function(){return 'in arrivo';})]; };
function apriCarta(id){ avviata(); var C=window.__carte; A.G.mazzo[id]=(A.G.mazzo[id]||0)+1; A.persist(); U.render();
  if(C&&typeof C.reveal==='function'){ try{ C.init({app:A,audio:window.__au,vase:window.__vase}); }catch(e){} C.reveal({id:id,fonte:'capitolo',nuova:true},nope); return true; }
  if(U.cardReveal){ U.cardReveal(id,nope); return true; }
  return true; }
function powerCard(){ avviata(); var P=A.powerCards;
  try{
    P(); var max=(A.POWER&&A.POWER.max)||6; A.G.power=A.G.power||{}; A.G.power.salto=max;
  }catch(e){ A.toast('Power card: formato non riconosciuto'); return false; }
  A.persist(); U.render(); return true; }

/* ---------- salvataggio ---------- */
function copia(txt){ try{ if(navigator.clipboard&&navigator.clipboard.writeText) return navigator.clipboard.writeText(txt); }catch(e){}
  return new Promise(function(ok,ko){ try{ var t=document.createElement('textarea'); t.value=txt; t.style.cssText='position:fixed;opacity:0;top:0'; document.body.appendChild(t); t.select(); var r=document.execCommand('copy'); t.remove(); r?ok():ko(new Error('copia')); }catch(e){ ko(e); } }); }
function esporta(){ if(A.G) A.persist(); var s=A.store.get(); if(!s){ A.toast('Niente da esportare'); return false; } copia(s).then(function(){ toast('Salvataggio copiato ('+Math.round(s.length/1024)+' KB)'); }).catch(function(){ try{ window.prompt('Copia il salvataggio',s); }catch(e){} }); return 'skip'; }
function importa(){ var applica=function(t){ try{ var g=JSON.parse(t); if(!g||g.v!==2||!g.sim) throw new Error('formato'); A.store.set(t); toast('Salvataggio importato'); setTimeout(function(){ location.reload(); },500); }catch(e){ toast('Testo non valido: non è un salvataggio'); } };
  var chiedi=function(){ var t=null; try{ t=window.prompt('Incolla qui il salvataggio'); }catch(e){} if(t) applica(t); };
  try{ if(navigator.clipboard&&navigator.clipboard.readText){ navigator.clipboard.readText().then(function(t){ if(t&&t.trim().charAt(0)==='{') applica(t); else chiedi(); }).catch(chiedi); return 'skip'; } }catch(e){}
  chiedi(); return 'skip'; }
function azzera(){ var ok=true; try{ ok=window.confirm('Azzerare la partita? Il salvataggio sparisce.'); }catch(e){} if(!ok) return 'skip'; try{ A.persist=function(){}; if(A.store.set) A.store.set=function(){}; if(A.store.save) A.store.save=function(){}; }catch(e){} A.store.del(); /* niente salvataggi tra la cancellazione e il ricaricamento */ toast('Partita azzerata'); setTimeout(function(){ location.reload(); },400); return 'skip'; }

/* ---------- prestazioni ---------- */
var stat=null, statRaf=0, statOn=false;
function contatore(){ statOn=!statOn; if(!statOn){ if(stat) stat.remove(); stat=null; cancelAnimationFrame(statRaf); return true; }
  stat=document.createElement('div'); stat.id='tst-stat'; document.body.appendChild(stat);
  var n=0,t0=performance.now(); (function tick(t){ n++; if(t-t0>=500){ var fps=Math.round(n*1000/(t-t0)); n=0; t0=t; var i=(window.__v3d&&window.__v3d.info)||null; stat.textContent=fps+' fps · '+(i?Math.round(i.tris/1000*10)/10+'k tri · '+i.renderer+' draw':(window.__vase&&window.__vase.is3d?'3D n/d':'2D')); } statRaf=requestAnimationFrame(tick); })(performance.now());
  return true; }
function vista3d(on){ window.__noguard=true; return window.__vase.set3d(on).then(function(r){ if(A.G){ A.G.settings.v3d=!!on; A.persist(); } U.render(); if(on&&!r) A.toast('3D non disponibile qui'); }); }

/* ---------- elenco ---------- */
const SEZ=[
 {t:'Partenza',v:[
  VN('video','Nuova partita con il video',function(){ A.store.del(); setTimeout(function(){ location.reload(); },300); return 'skip'; }),
  V('vuoto','Nuova partita senza video (vaso vuoto)',function(){ nuova([],[],[]); return true; }),
  V('avviato','Vaso avviato: muschio, felce, formiche',function(){ nuova([],[],[]); A.skipStart(); entra(); return true; })]},
 {t:'Popolazioni',v:[
  V('f20','20 formiche',function(){ nuova(['formiche'],['muschio','felce'],[]); pop('formiche',20); entra(); return true; }),
  V('giungla-tot','Giungla totale: le piante occupano tutto',function(){ nuova(['formiche','lumache'],['muschio','felce','fungo','carnivora','succulenta'],[]); entra(); var f={giungla:1,detrito:.5}; ['muschio','felce','fungo','carnivora','succulenta'].forEach(function(id){ f[id]={vigore:.95,crescita:400,biomassa:1}; }); setTimeout(function(){ try{ if(window.__v3d&&window.__v3d.piante) window.__v3d.piante.force(f); }catch(e){} },300); return true; }),
  V('grande','Popolazione grande (100+)',function(){ nuova(['formiche','termiti'],['muschio','felce'],[]); pop('formiche',120); pop('termiti',110); entra(); return true; }),
  V('tutte','Tutte le specie insieme',function(){ var P=Object.keys(T.PIANTE),S=Object.keys(T.SPECIE); nuova(S,P,[]); S.forEach(function(i){ pop(i,30); }); entra(); return true; }),
  V('mutata','Una specie mutata',function(){ nuova(['formiche'],['muschio','felce'],[]); var x=sp('formiche'); x.mut.push('gigantismo','radioattivo'); x.size*=1.8; x.gen=6; A.updateCodex(); entra(); return true; }),
  V('popolo','Popolo fondato',function(){ nuova(['formiche'],['muschio','felce'],['statuina']); pop('formiche',60); societa('formiche','sacro'); A.updateCodex(); entra(); return true; }),
  V('guerra','Guerra in corso',function(){ nuova(['formiche','termiti'],['muschio','felce'],[]); pop('formiche',70); pop('termiti',70); societa('formiche','tribale'); societa('termiti','tribale'); guerra('formiche','termiti'); A.updateCodex(); entra(); return true; })]},
 {t:'Tempo',v:[
  V('n1','Avanti di 6 ore (una notte)',function(){ avviata(); giorni(1); popup(); return true; }),
  V('n7','Avanti di 7 notti',function(){ avviata(); giorni(7); popup(); return true; }),
  V('mani0','Mani a zero',function(){ avviata(); if(A.G.real) { A.G.real.cure=0; A.G.real.cureT=A.nowMs?A.nowMs():Date.now(); } A.persist(); entra(); return true; },function(){ return (A.G||typeof A.mani==='function'||typeof A.CURE_MAX==='number')?true:'in arrivo'; }),
  V('mani6','Mani piene',function(){ avviata(); var mx=(typeof A.mani==='function'&&A.mani()&&A.mani().max)||A.CURE_MAX||6; A.G.real.cure=mx; A.G.real.cureT=A.nowMs?A.nowMs():Date.now(); A.persist(); entra(); return true; },function(){ return (A.G||typeof A.mani==='function'||typeof A.CURE_MAX==='number')?true:'in arrivo'; }),
  V('calendario','Calendario del mese con eventi',function(){ avviata(); giorni(8); A.persist(); U.render(); segmento('calendario'); return true; },function(){ return typeof A.calendario==='function'||'in arrivo'; }),
  V('salto2','Salta 2 giorni',function(){ avviata(); try{ A.powerCards(); }catch(e){} if(A.G.power) A.G.power.salto=Math.max(A.G.power.salto||0,2); A.persist(); var r=A.usaSalto(); popup(); return !!r; },function(){ return typeof A.usaSalto==='function'||'in arrivo'; }),
  V('assenza3','Ritorno dopo 3 giorni di assenza',function(){ return assenza(3); }),
  V('assenza5','Ritorno dopo 5 giorni (letargo, «Mentre non c’eri»)',function(){ return assenza(5); })]},
 {t:'Cura',v:[
  V('min','Bisogni al minimo',function(){ avviata(); A.sim.setNeeds({um:.04,ter:.04,pul:.04}); entra(); return true; }),
  V('max','Bisogni pieni',function(){ avviata(); A.sim.setNeeds({um:1,ter:1,pul:1}); if(typeof A.CURE_MAX==='number') A.G.real.cure=A.CURE_MAX; entra(); return true; }),
  V('serie','Serie di 7 giorni con un giorno saltato',function(){ avviata(); var t=A.todayIdx(), P=A.G.player; P.serie=7; P.serieMax=Math.max(P.serieMax||0,7); P.protezioni=Math.max(P.protezioni||0,1); P.lastReqDay=t-2; A.G.real.lastDay=t-1; A.persist(); A.checkNewDay(); popup(); return true; })]},
 {t:'Storia',v:[
  V('decisione','Decisione in sospeso',function(){ avviata(); if(!sp('formiche')) A.sim.addSpecies('formiche'); var s=A.sim; if(!s.pending.some(p=>p.type==='mutazione')) s.pending.push({id:'test-m'+s.d,type:'mutazione',sp:'formiche',mutation:'gigantismo',d:s.d,th:1}); popup(); return true; }),
  {sub:'Notte di Biscotto',grp:gatti},
  {sub:'Finale imminente',grp:finaliVoci}]},
 {t:'Carte',v:[
  {sub:'Apri una busta',grp:carteRar},
  V('mazzo','Mazzo completo (una copia di ogni carta)',function(){ mazzoPieno(); entra(); return true; }),
  V('album-pieno','Album completo',function(){ mazzoPieno(); segmento('carte'); return true; }),
  V('album-vuoto','Album vuoto',function(){ avviata(); A.G.mazzo={}; A.persist(); segmento('carte'); return true; }),
  V('ventaglio','Ventaglio pieno',function(){ mazzoPieno(); entra(); var C=window.__carte; C.init({app:A,audio:window.__au,vase:window.__vase}); C.hand({onPlay:nope}); return true; },function(){ return (window.__carte&&typeof window.__carte.hand==='function')||'in arrivo'; })]},
 {t:'Power card',v:[
  V('power','Dai 6 «Salta 2 giorni»',powerCard,function(){ return !!A.powerCards||'in arrivo'; })]},
 {t:'Microclima',v:[
  V('mc-apri','Tappo aperto',function(){ avviata(); A.tappo(true); entra(); return true; },microOk),
  V('mc-chiudi','Tappo chiuso',function(){ avviata(); A.tappo(false); entra(); return true; },microOk),
  V('mc-troppa','Troppa acqua: drenaggio pieno e ristagno',function(){ return microScena(function(m,S,J){ S.acqua.superficie=J.cap.superficie; S.acqua.terriccio=J.cap.terriccio; S.acqua.drenaggio=J.cap.drenaggio; S.marciume=.65; },{um:1,rist:.7}); },microOk),
  V('mc-serra','Vaso al sole col tappo chiuso (serra)',function(){ avviata(); A.tappo(false); return microScena(function(m,S){ S.posizione='sole'; microOre(m,10,6,'sole','estate'); }); },microOk),
  V('mc-muffa','Muffa che nasce',function(){ return microScena(function(m,S){ S.detrito=.85; S.muffa.terra=.5; S.muffa.vetro=.3; S.muffa.foglie=.2; },{um:.9,pul:.2}); },microOk),
  V('mc-combatti','Muffa combattuta: apri, pulisci, collemboli',function(){ avviata(); A.tappo(true); return microScena(function(m){ m.act('pulisci'); m.act('collemboli',.6); },{pul:.85}); },microOk),
  V('mc-alba','Vetro appannato all’alba',function(){ return microScena(function(m,S,J){ J.zone.forEach(function(z){ S.film[z]=J.filmCap*.9; }); S.gocce=.5; S.rh=.98; S.sporcoVetro=.3; S.T.vetro.alto=S.T.vetro.medio=S.T.vetro.basso=S.T.vetro.tappo=14; },null); },microOk),
  V('mc-secco','Terreno secco',function(){ return microScena(function(m){ m.act({tipo:'imposta',v:{um:.04}}); },{um:.04}); },microOk),
  V('mc-bagnato','Terreno bagnato',function(){ return microScena(function(m){ m.act({tipo:'imposta',v:{um:1}}); },{um:1}); },microOk)]},
 {t:'Fine del vaso',v:[
  V('fv-fine','Porta il vaso a fine capitolo',function(){ return finale('tribu'); }),
  V('fv-chiudi','Chiudi il capitolo (con la carta)',function(){ return finale('equilibrio',true); }),
  V('fv-nuovo','Vaso nuovo: solo il meteorite',function(){ nuova(['formiche'],['muschio','felce'],[]); avantiFinoFinale(); var r=A.closeChapter(); entra(); return !!r; },function(){ return (typeof A.archiviaVaso==='function'||(A.G&&Array.isArray(A.G.vasi)))||'in arrivo'; }),
  V('fv-mensola','Mensola con 3 vasi finiti',function(){ avviata(); var d=A.todayIdx?A.todayIdx():0; A.G.vasi=[
      {n:1,k:'equilibrio',dal:d-90,al:d-60,dv:30,popoli:1,mut:3,specie:['formiche'],nodi:[]},
      {n:2,k:'tribu',dal:d-59,al:d-30,dv:29,popoli:2,mut:5,specie:['formiche','termiti'],nodi:[]},
      {n:3,k:'fede',dal:d-29,al:d-1,dv:28,popoli:1,mut:7,specie:['formiche'],nodi:[]}]; A.persist(); segmento('vasi'); return true; },function(){ return (A.G&&Array.isArray(A.G.vasi))||(typeof A.archiviaVaso==='function')||'in arrivo'; })]},
 {t:'Vista',v:[
  V('giorno','Giorno',function(){ avviata(); A.G.settings.tempo='giorno'; entra(); return true; }),
  V('sera','Sera',function(){ window.__vase.setTempo('sera'); return true; },function(){ return (window.__vase&&typeof window.__vase.setTempo==='function')||'in arrivo'; }),
  V('notte','Notte',function(){ avviata(); A.G.settings.tempo='notte'; entra(); return true; }),
  V('p3d','Forza 3D pieno',function(){ vista3d(true); return true; },function(){ return (window.__vase&&window.__vase.set3d&&!window.__no3d)||'non disponibile qui'; }),
  V('p2d','Forza 2D',function(){ vista3d(false); return true; }),
  V('lv0','Guardia prestazioni: livello 0 (pieno)',function(){ window.__noguard=true; window.__v3d.setLevel(0); return true; },function(){ return (window.__v3d&&typeof window.__v3d.setLevel==='function')||'in arrivo'; }),
  V('lv1','Guardia prestazioni: livello 1',function(){ window.__noguard=true; window.__v3d.setLevel(1); return true; },function(){ return (window.__v3d&&typeof window.__v3d.setLevel==='function')||'in arrivo'; }),
  V('lv2','Guardia prestazioni: livello 2 (minimo)',function(){ window.__noguard=true; window.__v3d.setLevel(2); return true; },function(){ return (window.__v3d&&typeof window.__v3d.setLevel==='function')||'in arrivo'; }),
  VN('fps','Mostra fps, triangoli, chiamate di disegno',contatore)]},
 {t:'Prova tutto',v:[
  VN('tutto','Prova tutto: ogni scenario, uno dopo l’altro (2 s di pausa)',provaTutto)]},
 {t:'Salvataggio',v:[
  VN('esporta','Esporta (copia negli appunti)',esporta),
  VN('importa','Importa (incolla)',importa),
  VN('azzera','Azzera la partita',azzera)]}
];

/* ---------- interfaccia ---------- */
const css=document.createElement('style'); css.textContent=
'#tst-btn{position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom) + 88px);z-index:95;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0;color:#EAF1F5;background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.6);box-shadow:0 2px 10px rgba(0,0,0,.35);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);cursor:pointer;opacity:1;transition:transform .15s ease,opacity .15s ease}'+
'#tst-btn:active{transform:scale(.92);opacity:1}#tst-btn svg{width:20px;height:20px}'+
'#tst-pan{position:fixed;inset:0;z-index:100;background:rgba(10,15,21,.95);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(env(safe-area-inset-top) + 14px) 16px calc(env(safe-area-inset-bottom) + 30px);color:#EAF1F5;font:500 14px Manrope,system-ui,sans-serif}'+
'#tst-pan .in{max-width:520px;margin:0 auto}#tst-pan header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}'+
'#tst-pan h2{margin:0;font:500 20px Unbounded,sans-serif}#tst-pan .x{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#EAF1F5;font-size:18px;cursor:pointer}'+
'#tst-pan .k{margin:20px 0 8px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#A88BFF}#tst-pan .k2{margin:12px 0 6px;font-size:12px;font-weight:700;color:#9AACB8}'+
'#tst-pan .it{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:46px;margin:0 0 6px;padding:8px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#EAF1F5;font:600 14px Manrope,sans-serif;text-align:left;cursor:pointer;transition:transform .15s ease,border-color .15s ease}'+
'#tst-pan .it:active{transform:scale(.98);border-color:#7CF5C8}#tst-pan .it[disabled]{opacity:.38;cursor:default}#tst-pan .it small{font-size:11px;font-weight:700;color:#9AACB8;white-space:nowrap}'+
'#tst-pan .cmp-n{display:flex;align-items:center;gap:10px}#tst-pan .cmp-n b{min-width:26px;text-align:center;font-size:16px}#tst-pan .cmp-b{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#EAF1F5;font-size:22px;cursor:pointer;transition:transform .12s ease}#tst-pan .cmp-b:active{transform:scale(.94)}#tst-pan .cmp-p[aria-pressed=true]{border-color:#7CF5C8;background:rgba(124,245,200,.12)}#tst-pan .cmp-s{cursor:default}#tst-pan .cmp-s input{flex:1;min-width:0;height:44px;accent-color:#A88BFF}#tst-pan .cmp-go{justify-content:center;margin-top:16px;min-height:52px;background:#A88BFF;color:#0F0D14;border-color:#A88BFF;font-weight:800;font-size:16px}#tst-pan .cmp-go:active{transform:scale(.94)}#tst-pan .cmp-go[disabled]{opacity:.45;background:#3a3350;color:#EAF1F5;border-color:#3a3350}#tst-pan .cmp-bar{position:sticky;bottom:calc(-1 * env(safe-area-inset-bottom) - 30px);margin:14px -16px 0;padding:10px 16px calc(env(safe-area-inset-bottom) + 14px);background:linear-gradient(to top,rgba(10,15,21,.98) 70%,rgba(10,15,21,0));z-index:2}#tst-pan .cmp-bar .cmp-go{margin:0}#tst-pan .cmp-chk{display:flex;align-items:center;gap:12px;flex:1;min-height:44px;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:0}#tst-pan .cmp-chk i{width:26px;height:26px;border-radius:8px;border:2px solid rgba(255,255,255,.4);flex:none;display:flex;align-items:center;justify-content:center;transition:transform .15s ease,background .15s ease}#tst-pan .cmp-chk[aria-pressed=true] i{background:#7CF5C8;border-color:#7CF5C8}#tst-pan .cmp-chk[aria-pressed=true] i::after{content:"✓";color:#0F0D14;font-weight:800;font-size:16px}#tst-pan .cmp-chk:active i{transform:scale(.9)}#tst-pan .cmp-big{min-height:72px;font-size:19px;font-weight:800;justify-content:center;text-align:center;flex-direction:column;gap:2px;background:rgba(168,139,255,.16);border:2px solid #A88BFF}#tst-pan .cmp-big small{font-size:12px}'+
'#tst-run{position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top) + 8px);z-index:101;pointer-events:none;padding:6px 12px;border-radius:999px;background:rgba(10,15,21,.78);color:#A88BFF;font:700 12px Manrope,sans-serif;text-align:center}'+
'#tst-stat{position:fixed;left:62px;bottom:calc(env(safe-area-inset-bottom) + 98px);z-index:94;pointer-events:none;padding:3px 9px;border-radius:999px;background:rgba(10,15,21,.6);color:#7CF5C8;font:700 11px/1.4 ui-monospace,Menlo,monospace}';
document.head.appendChild(css);

const btn=document.createElement('button'); btn.id='tst-btn'; btn.type='button'; btn.setAttribute('aria-label','Modalità test 🧪');
btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6"/><path d="M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5-10V3"/><path d="M7.5 15h9"/></svg>';
document.body.appendChild(btn);

function toast(m){ A.toast('Scenario: '+m); }
function chiudi(){ var p=$('#tst-pan'); if(p) p.remove(); }
function pulisciPopup(){ try{ if(U.closeSheet) U.closeSheet(); }catch(e){} ['cine','cardrev','reveal','hand','cardview'].forEach(function(i){ var e=document.getElementById(i); if(e) e.remove(); }); }
function esegui(v){ chiudi(); pulisciPopup(); var r; try{ r=v.run(); }catch(e){ console.warn('scenario',v.id,e); A.toast('Scenario non riuscito: '+v.l); return 'errore'; } if(r!=='skip'&&r!==false) toast(v.l); return r; }
function voce(v,host){
  var ok=v.ok(); var b=document.createElement('button'); b.type='button'; b.className='it'; b.dataset.sc=v.id;
  var l=document.createElement('span'); l.textContent=v.l; b.appendChild(l);
  if(ok!==true){ b.disabled=true; var s=document.createElement('small'); s.textContent=typeof ok==='string'?ok:'in arrivo'; b.appendChild(s); }
  else if(v.sub){ var s2=document.createElement('small'); s2.textContent=v.sub; b.appendChild(s2); }
  b.addEventListener('click',function(){ if(b.disabled) return; esegui(v); });
  host.appendChild(b); }
function tutteLeVoci(){ var out=[]; SEZ.forEach(function(sz){ sz.v.forEach(function(v){ if(v.grp) v.grp().forEach(function(x){ out.push(x); }); else out.push(v); }); }); return out; }
/* Prova tutto: ogni scenario disponibile in fila, pausa tra l'uno e l'altro, riepilogo finale */
var provaInCorso=false;
function provaTutto(){ if(provaInCorso) return 'skip'; provaInCorso=true;
  var voci=tutteLeVoci().filter(function(v){ return !v.noTutto&&v.ok()===true; }), pausa=window.__scenariPausa!=null?window.__scenariPausa:2000;
  var errs=[], onErr=function(e){ errs.push(String(e&&e.message||e&&e.reason||e).slice(0,140)); }, ce=console.error;
  window.addEventListener('error',onErr); window.addEventListener('unhandledrejection',onErr);
  console.error=function(){ errs.push(Array.prototype.join.call(arguments,' ').slice(0,140)); return ce.apply(console,arguments); };
  var bar=document.createElement('div'); bar.id='tst-run'; document.body.appendChild(bar);
  var buoni=0, falliti=[], i=0;
  function fine(){ window.removeEventListener('error',onErr); window.removeEventListener('unhandledrejection',onErr); console.error=ce; bar.remove(); provaInCorso=false; pulisciPopup();
    var rep={totale:voci.length,ok:buoni,falliti:falliti,errori:errs.slice()}; window.__scenariEsito=rep;
    chiudi(); var p=document.createElement('div'); p.id='tst-pan'; var d=document.createElement('div'); d.className='in'; d.id='tst-esito';
    d.innerHTML='<header><h2>Prova tutto</h2><button class="x" type="button" data-x aria-label="Chiudi">✕</button></header><div class="k">Riepilogo</div><div class="it" style="cursor:default"><span>Scenari riusciti</span><small>'+buoni+' / '+voci.length+'</small></div><div class="it" style="cursor:default"><span>Errori in console</span><small>'+errs.length+'</small></div>'+
      (falliti.length?'<div class="k2">Non riusciti</div>'+falliti.map(function(x){ return '<div class="it" style="cursor:default"><span>'+x+'</span></div>'; }).join(''):'')+
      (errs.length?'<div class="k2">Errori</div>'+errs.slice(0,8).map(function(x){ return '<div class="it" style="cursor:default;font-size:12px"><span>'+x.replace(/</g,'&lt;')+'</span></div>'; }).join(''):'');
    p.appendChild(d); p.addEventListener('click',function(e){ if(e.target.closest('[data-x]')||e.target===p) chiudi(); }); document.body.appendChild(p); }
  function avanti(){ if(i>=voci.length){ fine(); return; } var v=voci[i++], n0=errs.length; bar.textContent='Prova tutto '+i+'/'+voci.length+' · '+v.l;
    var r=esegui(v); if(r==='errore'||r===false){ falliti.push(v.l); } else if(errs.length>n0){ falliti.push(v.l+' (errori in console)'); } else buoni++;
    setTimeout(avanti,pausa); }
  chiudi(); setTimeout(avanti,200); return 'skip'; }
function apri(){ chiudi(); var p=document.createElement('div'); p.id='tst-pan'; var in_=document.createElement('div'); in_.className='in';
  in_.innerHTML='<header><h2>Modalità test</h2><button class="x" type="button" aria-label="Chiudi" data-x>✕</button></header><div style="color:#9AACB8;font-size:12px">Un tocco applica lo scenario e chiude il pannello. Le voci grigie dipendono da funzioni non ancora presenti.</div>';
  var cg=document.createElement('button'); cg.type='button'; cg.className='it'; cg.id='tst-open-comp'; cg.className='it cmp-big'; cg.style.cssText='margin-top:14px'; cg.innerHTML='<span>Componi il vaso</span><small>scegli tu specie e piante</small>'; cg.addEventListener('click',componi); in_.appendChild(cg);
  SEZ.forEach(function(sz){ var k=document.createElement('div'); k.className='k'; k.textContent=sz.t; in_.appendChild(k);
    sz.v.forEach(function(v){ if(v.grp){ if(v.sub){ var k2=document.createElement('div'); k2.className='k2'; k2.textContent=v.sub; in_.appendChild(k2); } v.grp().forEach(function(x){ voce(x,in_); }); } else voce(v,in_); }); });
  p.appendChild(in_); p.addEventListener('click',function(e){ if(e.target.closest('[data-x]')||e.target===p) chiudi(); }); document.body.appendChild(p); }
/* ---------- Componi il vaso (editor) ---------- */
var COMP={cr:{},pi:{muschio:0},mut:0,car:20,notte:0};
var MUTL=['gigantismo','bioluminescenza','radioattivo','corazza','iperfertilita','intelligenza'];
function compInit(){ Object.keys(T.SPECIE).forEach(function(id){ if(!COMP.cr[id]) COMP.cr[id]={on:0,n:6}; }); Object.keys(T.PIANTE).forEach(function(id){ if(COMP.pi[id]==null) COMP.pi[id]=0; }); }
function compCount(){ var c=Object.keys(COMP.cr).filter(function(i){ return COMP.cr[i].on; }).length, q=Object.keys(COMP.pi).filter(function(i){ return COMP.pi[i]; }).length; return [c,q]; }
function compGo(d){ var n=compCount(), g=d.querySelector('[data-go]'); g.disabled=!(n[0]+n[1]); g.textContent=(n[0]+n[1])?'Crea il vaso · '+n[0]+' specie, '+n[1]+' piante':'Scegli almeno una specie o una pianta'; }
function componi(){ chiudi(); compInit(); var p=document.createElement('div'); p.id='tst-pan'; var d=document.createElement('div'); d.className='in'; d.id='tst-comp';
  var h='<header><h2>Componi il vaso</h2><button class="x" type="button" data-x aria-label="Chiudi">✕</button></header><div style="color:#9AACB8;font-size:12px">Spunta quello che vuoi nel vaso. Il vaso conterrà solo le voci spuntate.</div><div class="k">Creature (tutte)</div>';
  Object.keys(T.SPECIE).forEach(function(id){ var x=T.SPECIE[id], c=COMP.cr[id]; h+='<div class="it cmp-r" data-cr="'+id+'"><button type="button" class="cmp-chk" data-chk aria-pressed="'+(c.on?'true':'false')+'"><i></i><span>'+x.icon+' '+x.nome+'</span></button><span class="cmp-n"><button type="button" class="cmp-b" data-d="-1" aria-label="Meno '+x.nome+'">−</button><b>'+c.n+'</b><button type="button" class="cmp-b" data-d="1" aria-label="Più '+x.nome+'">+</button></span></div>'; });
  h+='<div class="k">Piante (tutte)</div>';
  Object.keys(T.PIANTE).forEach(function(id){ var x=T.PIANTE[id]; h+='<div class="it cmp-r" data-pi="'+id+'"><button type="button" class="cmp-chk" data-chk aria-pressed="'+(COMP.pi[id]?'true':'false')+'"><i></i><span>'+x.icon+' '+x.nome+'</span></button></div>'; });
  h+='<div class="k">Magia</div>';
  h+='<label class="it cmp-s"><span>Mutazione</span><input type="range" min="0" max="100" value="'+Math.round(COMP.mut*100)+'" data-k="mut"><small data-o="mut">'+COMP.mut.toFixed(2)+'</small></label>';
  h+='<label class="it cmp-s"><span>Carica del sasso</span><input type="range" min="0" max="100" value="'+COMP.car+'" data-k="car"><small data-o="car">'+COMP.car+'</small></label>';
  h+='<button type="button" class="it cmp-p" data-nt aria-pressed="'+(COMP.notte?'true':'false')+'"><span>Notte</span><small>'+(COMP.notte?'notte':'giorno')+'</small></button>';
  h+='<div class="cmp-bar"><button type="button" class="it cmp-go" data-go>Crea il vaso</button></div>';
  d.innerHTML=h; p.appendChild(d); compGo(d);
  d.addEventListener('click',function(e){ var t=e.target;
    var b=t.closest('.cmp-b'); if(b){ var id=b.closest('[data-cr]').dataset.cr; COMP.cr[id].n=Math.max(1,Math.min(30,COMP.cr[id].n+(+b.dataset.d))); b.parentNode.querySelector('b').textContent=COMP.cr[id].n; if(!COMP.cr[id].on){ COMP.cr[id].on=1; b.closest('[data-cr]').querySelector('[data-chk]').setAttribute('aria-pressed','true'); compGo(d); } return; }
    var ck=t.closest('[data-chk]'); if(ck){ var r=ck.closest('[data-cr]'), q=ck.closest('[data-pi]'); if(r){ COMP.cr[r.dataset.cr].on=COMP.cr[r.dataset.cr].on?0:1; ck.setAttribute('aria-pressed',COMP.cr[r.dataset.cr].on?'true':'false'); } else if(q){ COMP.pi[q.dataset.pi]=COMP.pi[q.dataset.pi]?0:1; ck.setAttribute('aria-pressed',COMP.pi[q.dataset.pi]?'true':'false'); } compGo(d); return; }
    var n=t.closest('[data-nt]'); if(n){ COMP.notte=COMP.notte?0:1; n.setAttribute('aria-pressed',COMP.notte?'true':'false'); n.querySelector('small').textContent=COMP.notte?'notte':'giorno'; return; }
    if(t.closest('[data-go]')){ if(!t.closest('[data-go]').disabled) creaComposto(); return; }
    if(t.closest('[data-x]')||t===p) chiudi(); });
  d.addEventListener('input',function(e){ var r=e.target; if(!r.dataset.k) return; var v=+r.value; COMP[r.dataset.k]=r.dataset.k==='mut'?v/100:v; d.querySelector('[data-o="'+r.dataset.k+'"]').textContent=r.dataset.k==='mut'?COMP[r.dataset.k].toFixed(2):v; });
  document.body.appendChild(p); }
function creaComposto(){ var ins=Object.keys(COMP.cr).filter(function(i){ return COMP.cr[i].on; }), pia=Object.keys(COMP.pi).filter(function(i){ return COMP.pi[i]; });
  chiudi(); pulisciPopup(); nuova(ins,pia,[]);
  var s=A.sim, m=COMP.mut;
  ins.forEach(function(id){ var x=sp(id); if(!x) return; x.pop=COMP.cr[id].n;
    if(m>0){ var n=Math.max(1,Math.round(m*MUTL.length)); for(var i=0;i<n;i++){ if(x.mut.indexOf(MUTL[i])<0) x.mut.push(MUTL[i]); } if(x.mut.indexOf('gigantismo')>=0) x.size*=1+.8*m; x.gen=Math.max(x.gen||0,Math.round(2+m*6)); } });
  try{ s.charge(COMP.car-s.view().E); }catch(e){}
  A.G.settings.tempo=COMP.notte?'notte':'giorno';
  try{ A.updateCodex(); }catch(e){} entra(); toast('vaso composto'); }
btn.addEventListener('click',apri);
window.__componi=componi;

window.__scenari={SEZ:SEZ,apri:apri,chiudi:chiudi,provaTutto:provaTutto,voci:tutteLeVoci};
}
})();
