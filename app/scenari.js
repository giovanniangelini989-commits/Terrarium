/* MODALITÀ TEST — si attiva solo con ?test nell'indirizzo. Usa solo le API pubbliche
   (window.__app, __ui, __vase, __film, __notti, __v3d). Senza ?test non fa nulla. */
(function(){
'use strict';
var ON=false; try{ ON=/[?&]test(=|&|#|$)/.test(location.search); }catch(e){}
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
function finale(k){
  var r=RICETTA[k]||[['formiche'],['muschio'],[]]; nuova(r[0],r[1],r[2]); var s=A.sim;
  var fp=avantiFinoFinale();
  if(!fp){ A.toast('Finale non raggiunto in 400 giorni'); return false; }
  fp.finale=k; // l'oggetto è quello vero del motore: cambia la scelta del finale
  var F=T.FINALI[k];
  if(F&&F.fam==='Società'&&!s.sp.some(x=>x.society)) societa(r[0][0],CULTDI[k]||'tribale');
  A.G.ui.snoozeFinale=0; A.persist(); U.render();
  setTimeout(function(){ var b=$('[data-a="fin-open"]'); if(b) b.click(); },500);
  return true; }

/* ---------- le voci ---------- */
function V(id,l,run,ok,sub){ return {id:id,l:l,run:run,ok:ok||function(){return true;},sub:sub||''}; }
const finaliVoci=function(){ var F=T.FINALI||{}; return Object.keys(F).map(function(k){ return V('finale-'+k,F[k].icon+' '+F[k].nome,function(){ return finale(k); },null,F[k].fam); }); };
const gatti=function(){ var N=window.__notti; var G=N&&N.GATTO||[]; var out=[]; G.forEach(function(g,i){ out.push(V('biscotto-'+i,'Capitolo '+(i+1)+(g?': '+g.t:': la zampa'),function(){ avviata(); A.popups.push(i===1?{t:'biscotto'}:{t:'gatto',s:i}); A.G.ui.gatto=Math.max(A.G.ui.gatto||0,i); popup(); },function(){ return !!N; })); }); if(!out.length) out.push(V('biscotto-x','Notte di Biscotto',nope,function(){ return 'in arrivo'; })); return out; };
const carteRar=function(){ var C=A.CARTE||{}, ids=Object.keys(C), seen={}, out=[]; ids.forEach(function(id){ var r=C[id].r; if(!seen[r]){ seen[r]=1; out.push(V('carta-'+r,'Carta '+r+': '+C[id].n,function(){ return apriCarta(id); })); } }); return out.length?out:[V('carta-x','Una carta',nope,function(){return 'in arrivo';})]; };
function apriCarta(id){ avviata(); var C=window.__carte;
  if(C&&typeof C.reveal==='function'){ C.reveal(id); return true; }
  if(U.cardReveal){ U.cardReveal(id,nope); return true; }
  A.G.mazzo[id]=(A.G.mazzo[id]||0)+1; A.persist(); U.render(); return true; }
function powerCard(){ avviata(); var P=A.powerCards;
  try{
    if(typeof P==='function'){ P('salta2',6); }
    else if(P&&typeof P.give==='function') P.give('salta2',6);
    else if(P&&typeof P.add==='function') P.add('salta2',6);
    else if(P&&typeof P==='object'){ P.salta2=6; }
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
function azzera(){ var ok=true; try{ ok=window.confirm('Azzerare la partita? Il salvataggio sparisce.'); }catch(e){} if(!ok) return 'skip'; A.store.del(); toast('Partita azzerata'); setTimeout(function(){ location.reload(); },400); return 'skip'; }

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
  V('video','Nuova partita con il video',function(){ A.store.del(); setTimeout(function(){ location.reload(); },300); return 'skip'; }),
  V('vuoto','Nuova partita senza video (vaso vuoto)',function(){ nuova([],[],[]); return true; }),
  V('avviato','Vaso avviato: muschio, felce, formiche',function(){ nuova([],[],[]); A.skipStart(); entra(); return true; })]},
 {t:'Popolazioni',v:[
  V('f20','20 formiche',function(){ nuova(['formiche'],['muschio','felce'],[]); pop('formiche',20); entra(); return true; }),
  V('grande','Popolazione grande (100+)',function(){ nuova(['formiche','termiti'],['muschio','felce'],[]); pop('formiche',120); pop('termiti',110); entra(); return true; }),
  V('tutte','Tutte le specie insieme',function(){ var P=Object.keys(T.PIANTE),S=Object.keys(T.SPECIE); nuova(S,P,[]); S.forEach(function(i){ pop(i,30); }); entra(); return true; }),
  V('mutata','Una specie mutata',function(){ nuova(['formiche'],['muschio','felce'],[]); var x=sp('formiche'); x.mut.push('gigantismo','radioattivo'); x.size*=1.8; x.gen=6; A.updateCodex(); entra(); return true; }),
  V('popolo','Popolo fondato',function(){ nuova(['formiche'],['muschio','felce'],['statuina']); pop('formiche',60); societa('formiche','sacro'); A.updateCodex(); entra(); return true; }),
  V('guerra','Guerra in corso',function(){ nuova(['formiche','termiti'],['muschio','felce'],[]); pop('formiche',70); pop('termiti',70); societa('formiche','tribale'); societa('termiti','tribale'); guerra('formiche','termiti'); A.updateCodex(); entra(); return true; })]},
 {t:'Tempo',v:[
  V('giorno','Giorno',function(){ avviata(); A.G.settings.tempo='giorno'; entra(); return true; }),
  V('sera','Sera',function(){ window.__vase.setTempo('sera'); return true; },function(){ return (window.__vase&&typeof window.__vase.setTempo==='function')||'in arrivo'; }),
  V('notte','Notte',function(){ avviata(); A.G.settings.tempo='notte'; entra(); return true; }),
  V('n1','Avanti di 1 notte',function(){ avviata(); giorni(1); popup(); return true; }),
  V('n7','Avanti di 7 notti',function(){ avviata(); giorni(7); popup(); return true; }),
  V('assenza3','Ritorno dopo 3 giorni di assenza',function(){ avviata(); A.G.real.lastDay=A.todayIdx()-3; A.persist(); A.checkNewDay(); popup(); return true; })]},
 {t:'Cura',v:[
  V('min','Bisogni al minimo',function(){ avviata(); A.sim.setNeeds({um:.04,ter:.04,pul:.04}); entra(); return true; }),
  V('max','Bisogni pieni',function(){ avviata(); A.sim.setNeeds({um:1,ter:1,pul:1}); if(typeof A.CURE_MAX==='number') A.G.real.cure=A.CURE_MAX; entra(); return true; }),
  V('serie','Serie di 7 giorni con un giorno saltato',function(){ avviata(); var t=A.todayIdx(), P=A.G.player; P.serie=7; P.serieMax=Math.max(P.serieMax||0,7); P.protezioni=Math.max(P.protezioni||0,1); P.lastReqDay=t-2; A.G.real.lastDay=t-1; A.persist(); A.checkNewDay(); popup(); return true; })]},
 {t:'Storia',v:[
  V('decisione','Decisione in sospeso',function(){ avviata(); if(!sp('formiche')) A.sim.addSpecies('formiche'); var s=A.sim; if(!s.pending.some(p=>p.type==='mutazione')) s.pending.push({id:'test-m'+s.d,type:'mutazione',sp:'formiche',mutation:'gigantismo',d:s.d,th:1}); popup(); return true; }),
  {sub:'Notte di Biscotto',grp:gatti},
  {sub:'Finale imminente',grp:finaliVoci}]},
 {t:'Carte',v:[
  V('mazzo','Mazzo completo',function(){ avviata(); Object.keys(A.CARTE).forEach(function(id){ A.G.mazzo[id]=(A.G.mazzo[id]||0)+1; }); entra(); return true; }),
  {grp:carteRar}]},
 {t:'Power card',v:[
  V('power','Dai 6 «Salta 2 giorni»',powerCard,function(){ return !!A.powerCards||'in arrivo'; })]},
 {t:'Prestazioni',v:[
  V('p3d','Forza 3D pieno',function(){ vista3d(true); return true; },function(){ return (window.__vase&&window.__vase.set3d&&!window.__no3d)||'non disponibile qui'; }),
  V('p3dr','Forza 3D ridotto',function(){ window.__v3d.setLevel(1); return true; },function(){ return (window.__v3d&&typeof window.__v3d.setLevel==='function')||'in arrivo'; }),
  V('p2d','Forza 2D',function(){ vista3d(false); return true; }),
  V('fps','Mostra fps, triangoli, chiamate di disegno',contatore)]},
 {t:'Salvataggio',v:[
  V('esporta','Esporta (copia negli appunti)',esporta),
  V('importa','Importa (incolla)',importa),
  V('azzera','Azzera la partita',azzera)]}
];

/* ---------- interfaccia ---------- */
const css=document.createElement('style'); css.textContent=
'#tst-btn{position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom) + 88px);z-index:95;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0;color:#EAF1F5;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);cursor:pointer;opacity:.78;transition:transform .15s ease,opacity .15s ease}'+
'#tst-btn:active{transform:scale(.92);opacity:1}#tst-btn svg{width:20px;height:20px}'+
'#tst-pan{position:fixed;inset:0;z-index:100;background:rgba(10,15,21,.95);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(env(safe-area-inset-top) + 14px) 16px calc(env(safe-area-inset-bottom) + 30px);color:#EAF1F5;font:500 14px Manrope,system-ui,sans-serif}'+
'#tst-pan .in{max-width:520px;margin:0 auto}#tst-pan header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}'+
'#tst-pan h2{margin:0;font:500 20px Unbounded,sans-serif}#tst-pan .x{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#EAF1F5;font-size:18px;cursor:pointer}'+
'#tst-pan .k{margin:20px 0 8px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#A88BFF}#tst-pan .k2{margin:12px 0 6px;font-size:12px;font-weight:700;color:#9AACB8}'+
'#tst-pan .it{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:46px;margin:0 0 6px;padding:8px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#EAF1F5;font:600 14px Manrope,sans-serif;text-align:left;cursor:pointer;transition:transform .15s ease,border-color .15s ease}'+
'#tst-pan .it:active{transform:scale(.98);border-color:#7CF5C8}#tst-pan .it[disabled]{opacity:.38;cursor:default}#tst-pan .it small{font-size:11px;font-weight:700;color:#9AACB8;white-space:nowrap}'+
'#tst-stat{position:fixed;left:62px;bottom:calc(env(safe-area-inset-bottom) + 98px);z-index:94;pointer-events:none;padding:3px 9px;border-radius:999px;background:rgba(10,15,21,.6);color:#7CF5C8;font:700 11px/1.4 ui-monospace,Menlo,monospace}';
document.head.appendChild(css);

const btn=document.createElement('button'); btn.id='tst-btn'; btn.type='button'; btn.setAttribute('aria-label','Modalità test 🧪');
btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6"/><path d="M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5-10V3"/><path d="M7.5 15h9"/></svg>';
document.body.appendChild(btn);

function toast(m){ A.toast('Scenario: '+m); }
function chiudi(){ var p=$('#tst-pan'); if(p) p.remove(); }
function pulisciPopup(){ try{ if(U.closeSheet) U.closeSheet(); }catch(e){} ['cine','cardrev','reveal'].forEach(function(i){ var e=document.getElementById(i); if(e) e.remove(); }); }
function voce(v,host){
  var ok=v.ok(); var b=document.createElement('button'); b.type='button'; b.className='it'; b.dataset.sc=v.id;
  var l=document.createElement('span'); l.textContent=v.l; b.appendChild(l);
  if(ok!==true){ b.disabled=true; var s=document.createElement('small'); s.textContent=typeof ok==='string'?ok:'in arrivo'; b.appendChild(s); }
  else if(v.sub){ var s2=document.createElement('small'); s2.textContent=v.sub; b.appendChild(s2); }
  b.addEventListener('click',function(){ if(b.disabled) return; chiudi(); pulisciPopup(); var r; try{ r=v.run(); }catch(e){ console.warn('scenario',v.id,e); A.toast('Scenario non riuscito: '+v.l); return; } if(r!=='skip'&&r!==false) toast(v.l); });
  host.appendChild(b); }
function apri(){ chiudi(); var p=document.createElement('div'); p.id='tst-pan'; var in_=document.createElement('div'); in_.className='in';
  in_.innerHTML='<header><h2>Modalità test</h2><button class="x" type="button" aria-label="Chiudi" data-x>✕</button></header><div style="color:#9AACB8;font-size:12px">Un tocco applica lo scenario e chiude il pannello. Le voci grigie dipendono da funzioni non ancora presenti.</div>';
  SEZ.forEach(function(sz){ var k=document.createElement('div'); k.className='k'; k.textContent=sz.t; in_.appendChild(k);
    sz.v.forEach(function(v){ if(v.grp){ if(v.sub){ var k2=document.createElement('div'); k2.className='k2'; k2.textContent=v.sub; in_.appendChild(k2); } v.grp().forEach(function(x){ voce(x,in_); }); } else voce(v,in_); }); });
  p.appendChild(in_); p.addEventListener('click',function(e){ if(e.target.closest('[data-x]')||e.target===p) chiudi(); }); document.body.appendChild(p); }
btn.addEventListener('click',apri);

window.__scenari={SEZ:SEZ,apri:apri,chiudi:chiudi};
}
})();
