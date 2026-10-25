(function(){
'use strict';
const A=window.__app, T=A.T, S=A.S, esc=A.esc, AU=window.__au;
const OBJ4=['statuina','orologio','giocattolo','specchio'];
const SCN=[
 {id:'cielo',lines:()=>S.PRO.cielo,hint:'Tocca la stella che brilla'},
 {id:'giardino',lines:()=>S.PRO.giardino,hint:'Tieni premuto sul sasso'},
 {id:'barattolo',lines:()=>S.PRO.barattolo,hint:'Trascina il sasso nel barattolo'},
 {id:'luce',lines:()=>S.PRO.posto,ctl:'luce'},
 {id:'legenda',lines:()=>S.PRO.legenda,hint:'Tocca il sasso: senti il battito'},
 {id:'nome',lines:()=>S.PRO.nome,ctl:'nome'}];
let el,cv,cx,w=0,h=0,dpr=1,u=1,raf=0,sc=-1,st={},lineI=0,lineTimer=0,P,nm='Piccolo Mondo',done=null,replay=false,ptr={x:0,y:0},pair=[];
let R=null, R3=null, load3=null, mode='2d';   // R = lettore attivo (2D o 3D). Il 3D vive in app/apertura.js.
const fast=()=>!!window.__fast;
const dur=s=>fast()?120:Math.min(7000,1800+s.length*52);
const rnd=i=>{ const x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x); };
const lerp=(a,b,k)=>a+(b-a)*Math.max(0,Math.min(1,k));
const ease=k=>{ k=Math.max(0,Math.min(1,k)); return k*k*(3-2*k); };
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const $=s=>el.querySelector(s);
function circ(x,y,r,f){ cx.beginPath(); cx.arc(x,y,Math.max(.1,r),0,6.2832); cx.fillStyle=f; cx.fill(); }
function glow(x,y,r,c,a){ const g=cx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,c.replace('A',a)); g.addColorStop(1,c.replace('A',0)); cx.fillStyle=g; cx.fillRect(x-r,y-r,r*2,r*2); }
function rr(x,y,ww,hh,r){ cx.beginPath(); cx.moveTo(x+r,y); cx.arcTo(x+ww,y,x+ww,y+hh,r); cx.arcTo(x+ww,y+hh,x,y+hh,r); cx.arcTo(x,y+hh,x,y,r); cx.arcTo(x,y,x+ww,y,r); cx.closePath(); }
// ---------- disegno 2D (riserva: window.__no3d, errore o lentezza del 3D) ----------
function sky(t){ const g=cx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#04060d'); g.addColorStop(.6,'#10163a'); g.addColorStop(1,'#241a4e'); cx.fillStyle=g; cx.fillRect(0,0,w,h);
  for(let i=0;i<70;i++){ const a=.3+.55*Math.sin(t/700+i)**2; circ(rnd(i)*w,rnd(i+99)*h*.72,(.5+rnd(i+7)*1.1)*dpr,'rgba(255,255,255,'+a.toFixed(2)+')'); }
  glow(w*.84,h*.13,u*.2,'rgba(200,210,255,A)',.35); circ(w*.84,h*.13,u*.045,'#e8ecff'); }
function garden(){ cx.fillStyle='#070a14'; cx.beginPath(); cx.moveTo(0,h); cx.lineTo(0,h*.84); cx.quadraticCurveTo(w*.3,h*.76,w*.55,h*.84); cx.quadraticCurveTo(w*.8,h*.92,w,h*.82); cx.lineTo(w,h); cx.fill();
  cx.fillStyle='#0b0f1d'; cx.fillRect(w*.07,h*.7,w*.2,h*.14); cx.beginPath(); cx.moveTo(w*.05,h*.7); cx.lineTo(w*.17,h*.62); cx.lineTo(w*.29,h*.7); cx.fill(); glow(w*.14,h*.76,u*.18,'rgba(255,200,120,A)',.4); cx.fillStyle='#ffd48a'; cx.fillRect(w*.12,h*.74,w*.05,h*.045);
  cx.fillStyle='#080b16'; cx.fillRect(w*.8,h*.68,w*.025,h*.16); [[.81,.64,.1],[.76,.67,.07],[.86,.67,.07],[.81,.6,.07]].forEach(c=>circ(w*c[0],h*c[1],u*c[2],'#0a1020')); }
function stone(x,y,s,p,g){ cx.save(); cx.translate(x,y); cx.scale(s,s); glow(0,0,u*(.16+.08*p)*g,'rgba(170,130,255,A)',.25+.4*p*g); cx.fillStyle='#1b1728'; cx.strokeStyle='#8a6aff'; cx.lineWidth=1.2*dpr/s; cx.beginPath(); cx.moveTo(-.05*u,.02*u); cx.lineTo(-.036*u,-.03*u); cx.lineTo(.006*u,-.045*u); cx.lineTo(.047*u,-.02*u); cx.lineTo(.054*u,.02*u); cx.lineTo(.006*u,.03*u); cx.closePath(); cx.fill(); cx.stroke();
  cx.strokeStyle='rgba(205,175,255,'+(.35+.6*p*g).toFixed(2)+')'; cx.lineWidth=1.6*dpr/s; cx.beginPath(); cx.moveTo(-.027*u,.007*u); cx.lineTo(-.006*u,-.017*u); cx.lineTo(.013*u,-.003*u); cx.lineTo(.034*u,-.02*u); cx.stroke(); cx.restore(); }
function jarGeom(){ const jw=Math.min(w*.56,h*.32), jh=jw*1.1; return {cx:w*.5,jw,jh,x0:w*.5-jw/2,y0:Math.min(h*.37,h-jh-h*.26)}; }
function jar(t,o){ const g=jarGeom(), {x0,y0,jw,jh}=g; const lum=o.luce==null?1:o.luce;
  const bg=cx.createLinearGradient(0,0,0,h); bg.addColorStop(0,lum===2?'#3a2a2a':lum===0?'#0b1220':'#1c1a26'); bg.addColorStop(1,'#120c0a'); cx.fillStyle=bg; cx.fillRect(0,0,w,h);
  const wx=w*.07, wy=h*.2, ww=w*.24, wh=h*.085; const li=[.25,.6,1][lum]; cx.fillStyle='rgb('+Math.round(40+li*200)+','+Math.round(50+li*160)+','+Math.round(90+li*40-li*20)+')'; cx.fillRect(wx,wy,ww,wh); cx.fillStyle='#120c0a'; cx.fillRect(wx+ww/2-1.5*dpr,wy,3*dpr,wh); cx.fillRect(wx,wy+wh/2-1.5*dpr,ww,3*dpr);
  if(lum>0){ const gr=cx.createLinearGradient(wx+ww,wy+wh,g.cx,y0+jh*.4); gr.addColorStop(0,'rgba(255,220,150,'+(.1+.2*li)+')'); gr.addColorStop(1,'rgba(255,220,150,0)'); cx.fillStyle=gr; cx.beginPath(); cx.moveTo(wx,wy+wh); cx.lineTo(wx+ww,wy+wh); cx.lineTo(g.cx+jw*.5,y0+jh); cx.lineTo(g.cx-jw*.5,y0+jh*.6); cx.closePath(); cx.fill(); }
  cx.fillStyle='#2a1b12'; cx.fillRect(0,y0+jh,w,h-(y0+jh)); cx.fillStyle='#3a2618'; cx.fillRect(0,y0+jh,w,4*dpr);
  (o.objs||[]).forEach((id,i)=>{ cx.font=Math.round(u*.1)+'px serif'; cx.textAlign='center'; cx.textBaseline='middle'; cx.fillText(T.OGGETTI[id].icon,g.cx+(i?1:-1)*jw*.78,y0+jh-u*.04); });
  cx.fillStyle='rgba(190,215,230,.07)'; rr(x0,y0,jw,jh,jw*.12); cx.fill();
  cx.fillStyle='rgba(138,138,134,.55)'; cx.fillRect(x0+2*dpr,y0+jh*.93,jw-4*dpr,jh*.05); for(let i=0;i<14;i++) circ(x0+jw*.06+rnd(i+3)*jw*.88,y0+jh*.945,(1+rnd(i+9))*dpr,'#b8b8b0');
  if(o.stone) stone(o.stone.x,o.stone.y,o.stone.s||1,o.pulse||0,o.sg==null?1:o.sg);
  const nd=[2,6,16][o.acqua==null?1:o.acqua]; for(let i=0;i<nd;i++) circ(x0+jw*.1+(rnd(i+50)*jw*.8),y0+jh*.1+((rnd(i+70)*jh*.6+t/(90+i*11))%(jh*.6)),(1.2+rnd(i+9))*dpr,'rgba(255,255,255,.28)');
  cx.strokeStyle='rgba(190,215,230,.75)'; cx.lineWidth=2.2*dpr; rr(x0,y0,jw,jh,jw*.12); cx.stroke(); cx.fillStyle='rgba(255,255,255,.12)'; rr(x0+jw*.06,y0+jh*.1,jw*.05,jh*.5,jw*.025); cx.fill();
  const lid=o.lid==null?-1:o.lid; const ly=y0-jh*.06-(1-Math.max(0,lid))*jh*.5; if(lid>=0){ cx.fillStyle='#8a6a4a'; rr(x0+jw*.08,ly,jw*.84,jh*.08,jw*.03); cx.fill(); } }
const starPos2=t=>{ if(st.fall==null) return {x:w*.5+Math.sin(t/900)*2*dpr,y:h*.22+Math.cos(t/700)*2*dpr}; const f=st.v.fall; return {x:lerp(w*.5,w*.66,f),y:lerp(h*.22,h*.82,f*f)}; };
function draw2(t){ const id=SCN[sc].id; cx.setTransform(1,0,0,1,0,0); cx.textAlign='center';
  if(id==='cielo'){ sky(t); garden(); const p=starPos2(t);
    if(st.fall!=null){ const f=st.v.fall; for(let i=1;i<=14;i++){ const ff=Math.max(0,f-i*.015); const q={x:lerp(w*.5,w*.66,Math.min(1,ff)),y:lerp(h*.22,h*.82,Math.min(1,ff)**2)}; circ(q.x,q.y,u*.012*(1-i/16),'rgba(255,230,180,'+(.5*(1-i/15)).toFixed(2)+')'); }
      if(st.hit){ const k=(t-st.hit)/700; glow(p.x,p.y,u*(.1+.5*k),'rgba(255,230,190,A)',Math.max(0,.8*(1-k))); cx.strokeStyle='rgba(255,230,190,'+Math.max(0,1-k).toFixed(2)+')'; cx.lineWidth=2*dpr; cx.beginPath(); cx.arc(p.x,p.y,u*.05+k*u*.4,0,6.28); cx.stroke(); } }
    glow(p.x,p.y,u*.14,'rgba(255,240,200,A)',.6); circ(p.x,p.y,u*.016,'#fff'); if(st.active&&st.fall==null){ cx.strokeStyle='rgba(255,255,255,'+(.2+.3*Math.sin(t/300)**2).toFixed(2)+')'; cx.lineWidth=1.5*dpr; cx.beginPath(); cx.arc(p.x,p.y,u*(.06+.02*Math.sin(t/300)),0,6.28); cx.stroke(); } }
  else if(id==='giardino'){ sky(t); garden(); const base={x:w*.66,y:h*.84}; let pos=base,s=1; if(st.lift){ const f=st.v.lift; pos={x:lerp(base.x,w*.5,f),y:lerp(base.y,h*.45,f)}; s=1+f*1.4; }
    stone(pos.x,pos.y,s,.5+.5*Math.sin(t/(st.lift?300:600)),1);
    if(st.active&&!st.lift&&!st.hold){ cx.strokeStyle='rgba(205,175,255,'+(.2+.3*Math.sin(t/300)**2).toFixed(2)+')'; cx.lineWidth=1.5*dpr; cx.beginPath(); cx.arc(pos.x,pos.y,u*.09,0,6.28); cx.stroke(); }
    if(st.hold&&!st.lift){ cx.strokeStyle='#CFC0FF'; cx.lineWidth=4*dpr; cx.beginPath(); cx.arc(base.x,base.y,u*.09,-1.57,-1.57+6.28*Math.min(1,st.v.hold)); cx.stroke(); } }
  else if(id==='barattolo'){ const g=jarGeom(); let sp=st.stone||{x:g.cx,y:h*.2+Math.sin(t/600)*4*dpr}; let lid=-1, pulse=0;
    if(st.drop){ const f=st.v.drop; sp={x:lerp(st.sx,g.cx,f),y:lerp(st.sy,g.y0+g.jh*.86,f)}; if(f>=1){ pulse=.5+.5*Math.sin((t-st.thump)/180); lid=st.v.lid; } }
    jar(t,{luce:1,acqua:1,stone:{x:sp.x,y:sp.y,s:1},pulse,lid}); if(!st.drop&&st.active){ cx.strokeStyle='rgba(205,175,255,'+(.2+.3*Math.sin(t/300)**2).toFixed(2)+')'; cx.lineWidth=1.5*dpr; cx.setLineDash([6*dpr,6*dpr]); cx.beginPath(); cx.moveTo(sp.x,sp.y+u*.07); cx.lineTo(g.cx,g.y0+g.jh*.1); cx.stroke(); cx.setLineDash([]); } }
  else if(id==='luce'){ const g=jarGeom(); const lum=P.luce==null?1:P.luce; const per=[1900,1250,780][lum]; jar(t,{luce:lum,acqua:1,stone:{x:g.cx,y:g.y0+g.jh*.86,s:1},pulse:.5+.5*Math.sin(t/per*6.28/2),lid:1}); }
  else if(id==='legenda'){ cx.fillStyle='#07060f'; cx.fillRect(0,0,w,h); const cxm=w*.5, cym=h*.5; const pu=.5+.5*Math.sin(t/(st.boost?260:520)); glow(cxm,cym,u*.55,'rgba(150,110,255,A)',.18+.2*pu);
    (st.rings||[]).forEach(r=>{ const k=(t-r)/1400; if(k<1){ cx.strokeStyle='rgba(205,175,255,'+(.7*(1-k)).toFixed(2)+')'; cx.lineWidth=2*dpr; cx.beginPath(); cx.arc(cxm,cym,u*.1+k*u*.5,0,6.28); cx.stroke(); } });
    stone(cxm,cym,2.2,pu,1);
    const show=lineI===0?1:lineI===1?5:6; const cols=['#ffd080','#ffe8a0','#aaf0ff','#ffb080','#7CF5C8','#A88BFF']; for(let i=0;i<6;i++){ const a=i/6*6.28-1.57+t/9000, rad=u*.36; const on=i<show; if(on&&!(st.chainT&&st.chainT[i])){ (st.chainT=st.chainT||[])[i]=t+i*120; } const ap=st.chainT&&st.chainT[i]?Math.min(1,Math.max(0,(t-st.chainT[i])/600)):0; if(on&&ap>0){ glow(cxm+Math.cos(a)*rad,cym+Math.sin(a)*rad,u*.06*ap,'rgba(255,255,255,A)',.5*ap); circ(cxm+Math.cos(a)*rad,cym+Math.sin(a)*rad,u*.012*ap,cols[i]); } } }
  else if(id==='nome'){ const g=jarGeom(); jar(t,{luce:P.luce,acqua:1,stone:{x:g.cx,y:g.y0+g.jh*.86,s:1},pulse:.5+.5*Math.sin(t/(900-Math.min(500,(st.v.end||0)*500))),lid:st.end?1:0}); } }
function make2D(){ const c=document.createElement('canvas'); return {kind:'2d',canvas:c,fit(){ dpr=Math.min(2,window.devicePixelRatio||1); c.width=Math.round(innerWidth*dpr); c.height=Math.round(innerHeight*dpr); },size:()=>({w:c.width,h:c.height,dpr}),frame(t){ cx=c.getContext('2d'); draw2(t); },
  anchors(id){ const g=jarGeom(); return {center:{x:w*.5,y:h*.5},star:id==='cielo'?starPos2(performance.now()):null,stone:id==='giardino'?{x:w*.66,y:h*.84}:(st.stone||{x:g.cx,y:h*.2}),jar:g}; },dispose(){ c.remove(); }}; }
// ---------- logica per fotogramma (uguale per 2D e 3D) ----------
function tick(t){ const id=SCN[sc].id; const v=st.v=st.v||{};
  if(id==='cielo'){ v.fall=st.fall==null?0:Math.min(1,(t-st.fall)/(fast()?200:1800)); if(st.fall!=null&&v.fall>=1&&!st.hit){ st.hit=t; AU.sfx('tonfo'); } if(st.hit&&!st.next&&t-st.hit>(fast()?200:1500)){ st.next=1; go(1); } }
  else if(id==='giardino'){ v.hold=st.hold?(t-st.hold)/(fast()?200:900):0; if(st.hold&&!st.lift&&v.hold>=1){ st.lift=t; st.hold=0; AU.sfx('arrivo'); try{ navigator.vibrate&&navigator.vibrate(40); }catch(e){} } v.lift=st.lift?ease((t-st.lift)/(fast()?150:1300)):0; if(st.lift&&v.lift>=1&&!st.next){ st.next=1; go(2); } }
  else if(id==='barattolo'){ if(st.drop){ v.drop=ease((t-st.drop)/(fast()?150:800)); if(v.drop>=1){ if(!st.thump){ st.thump=t; AU.sfx('tonfo'); try{ navigator.vibrate&&navigator.vibrate([30,60,30]); }catch(e){} } const k=(t-st.thump)/(fast()?300:1100); v.lid=Math.min(1,Math.max(0,(t-st.thump-(fast()?60:500))/(fast()?150:700))); if(k>1.3&&!st.next){ st.next=1; go(3); } } else v.lid=0; } else v.drop=0; }
  else if(id==='nome'){ v.end=st.end?(t-st.end)/(fast()?300:2400):0; const f=$('.f-fade'); if(f) f.style.opacity=Math.min(1,v.end); } }
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&el&&!raf) raf=requestAnimationFrame(draw); });
function draw(t){ if(document.hidden){ raf=0; return; } raf=requestAnimationFrame(draw); if(!R||!SCN[sc]) return; tick(t); if(!el) return; try{ R.frame(t,{id:SCN[sc].id,st,P,lineI,fast:fast()}); }catch(e){ if(R.kind==='3d') fallback2D('errore'); } }
// ---------- flusso ----------
function sub(text){ const s=$('.f-sub'); s.classList.remove('in'); void s.offsetWidth; s.textContent=text; s.classList.add('in'); }
function nextLine(){ clearTimeout(lineTimer); const L=SCN[sc].lines(); if(lineI>=L.length-1) return; lineI++; sub(L[lineI]); AU.say(L[lineI]); if(lineI===L.length-1) activate(); else lineTimer=setTimeout(nextLine,dur(L[lineI])); }
function setHint(t){ const e=$('.f-hint'); e.textContent=t||''; e.style.opacity=t?1:0; }
function activate(){ const S0=SCN[sc]; st.active=true; if(S0.hint) setHint(S0.hint); if(S0.ctl) setCtl(S0.ctl); }
function optBtn(k,i,em,lb,sm,on){ return '<button class="f-opt" data-f="pick" data-k="'+k+'" data-i="'+i+'" aria-pressed="'+on+'"><span>'+em+'</span><b>'+lb+'</b><small>'+sm+'</small></button>'; }
function setCtl(kind){ const c=$('.f-ctl'); let h2='';
  if(kind==='luce') h2='<div class="f-row">'+[['☁️','Ombra','batte piano'],['🌤️','Finestra','batte regolare'],['☀️','Sole','batte forte']].map((o,i)=>optBtn('luce',i,o[0],o[1],o[2],P.luce===i)).join('')+'</div><button class="btn" data-f="next"'+(P.luce==null?' disabled':'')+'>Avanti</button>';
  else if(kind==='nome') h2='<input class="fld f-nm" id="f-nm" maxlength="18" value="'+esc(nm)+'" aria-label="Nome del terrario"><div class="f-chips">'+['Lumen','Piccolo Mondo','Stellina','Casa'].map(n=>'<button class="chip" data-f="chip" data-n="'+n+'">'+n+'</button>').join('')+'</div><button class="btn" data-f="end">Chiudi il coperchio</button>';
  else if(kind==='avanti') h2='<button class="btn" data-f="next">Avanti</button>';
  c.innerHTML=h2; el.classList.toggle('hasctl',!!h2); }
function enter(i){ clearTimeout(lineTimer); sc=i; st={t0:performance.now(),v:{}}; lineI=-1; setHint(''); setCtl(''); $('.f-skip').style.display=(i<=2||replay)?'':'none'; $('.f-skip').textContent=replay?'Chiudi ✕':'Salta ›'; nextLine(); }
function go(i){ if(replay&&i>=SCN.length-1){ finish(); return; } cv.classList.add('out'); setTimeout(()=>{ enter(Math.min(i,SCN.length-1)); if(cv) cv.classList.remove('out'); },fast()?30:450); }
function finish(res){ cancelAnimationFrame(raf); raf=0; clearTimeout(lineTimer); AU.stopVoice(); const e=el; el=null; e.classList.add('out'); const r=R; R=null; setTimeout(()=>{ e.remove(); if(r&&r.kind==='3d') r.dispose(); },500); const d=done; done=null; if(d) d(res); }
function setPtr(e){ const r=cv.getBoundingClientRect(); ptr={x:(e.clientX-r.left)*dpr,y:(e.clientY-r.top)*dpr}; }
function pulse(){ (st.rings=st.rings||[]).push(performance.now()); st.n=(st.n||0)+1; AU.sfx('tonfo'); try{ navigator.vibrate&&navigator.vibrate(25); }catch(e){} if(st.n===1) st.boost=true; if(st.n>=3&&!st.shown){ st.shown=true; setHint(''); setCtl('avanti'); } }
// Il primo tocco sulla stella o sul sasso conta subito (difetto segnalato dal giocatore): si prova prima l'azione, poi la frase.
function onDown(e){ if(!el||e.target.closest('.f-ctl,.f-skip')) return; setPtr(e); const id=SCN[sc].id, t=performance.now(); const an=R.anchors(id); let hit=false;
  if(id==='cielo'&&st.fall==null){ if(an.star&&dist(ptr,an.star)<u*.22){ st.fall=t; setHint(''); AU.sfx('mut'); hit=true; } }
  else if(id==='giardino'&&!st.lift){ if(an.stone&&dist(ptr,an.stone)<u*.25){ st.hold=t; setHint(''); hit=true; } }
  else if(id==='barattolo'&&!st.drop){ if(an.stone&&dist(ptr,an.stone)<u*.25){ st.drag=true; st.stone={x:ptr.x,y:ptr.y}; setHint(''); hit=true; } }
  else if(id==='legenda'){ if(dist(ptr,an.center)<u*.4){ pulse(); hit=true; } }
  if(hit){ if(!st.active){ clearTimeout(lineTimer); const L=SCN[sc].lines(); lineI=L.length-1; sub(L[lineI]); AU.say(L[lineI]); st.active=true; if(id==='legenda'&&!st.shown) setHint(SCN[sc].hint); } return; }
  if(!st.active) nextLine(); }
function onMove(e){ if(!el) return; setPtr(e); if(st.drag) st.stone={x:ptr.x,y:ptr.y}; }
function onUp(){ if(!el) return; if(st.hold&&!st.lift){ st.hold=0; setHint(SCN[sc].hint); }   // mollato troppo presto: l'invito torna
  if(st.drag){ st.drag=false; const g=R.anchors('barattolo').jar; if(Math.abs(ptr.x-g.cx)<g.jw*.5&&ptr.y>g.y0-g.jh*.5&&ptr.y<g.y0+g.jh*.75){ st.drop=performance.now(); st.sx=ptr.x; st.sy=ptr.y; } else { st.stone=null; setHint(SCN[sc].hint); } } }
function onClick(e){ if(!el) return; const b=e.target.closest('[data-f]'); if(!b) return; const a=b.dataset.f;
  if(a==='pick'){ const k=b.dataset.k, i=+b.dataset.i; if(k==='luce') P.luce=i; AU.sfx('azione'); setCtl(SCN[sc].ctl); }
  else if(a==='next'){ go(sc+1); } else if(a==='chip'){ nm=b.dataset.n; const i=$('#f-nm'); if(i) i.value=nm; }
  else if(a==='end'){ const i=$('#f-nm'); nm=((i&&i.value)||'').trim().slice(0,18)||'Piccolo Mondo'; st.end=performance.now(); setCtl(''); setHint(''); const L=S.PRO.fine; sub(L[0]); AU.say(L[0]); lineTimer=setTimeout(()=>{ sub(L[1]); AU.say(L[1]); lineTimer=setTimeout(()=>finish({name:nm,setup:{luce:P.luce,acqua:1,meteorite:1,piante:[],insetti:[],oggetti:[]}}),fast()?200:3600); },fast()?200:3200); }
  else if(a==='gate'){ AU.unlock(); AU.unlockVoice(); const gt=$('.f-gate'); if(gt) gt.remove(); enter(0); }
  else if(a==='skip'){ if(replay) finish(); else go(3); } }
function fit(){ if(!R) return; R.fit(); const s=R.size(); dpr=s.dpr; w=s.w; h=s.h; u=Math.min(w,h*.7); }
function use(r){ if(!el) return; const old=R; R=r; mode=r.kind; const c=r.canvas; c.className=(old&&old.canvas.className.includes('out'))?'out':''; el.insertBefore(c,el.firstChild); if(old){ old.canvas.remove(); if(old.kind==='3d') old.dispose(); } cv=c; fit(); }
function fallback2D(why){ if(!el||!R||R.kind!=='3d') return; try{ console.warn('apertura 3D: riserva 2D ('+why+')'); }catch(e){} R3=null; use(make2D()); }
function start3D(){ if(window.__no3d||!window.__APERTURA||load3) return; const my=load3=Promise.race([window.__APERTURA.create(el,{onFallback:fallback2D}),new Promise((_,rej)=>setTimeout(()=>rej('timeout'),fast()?20000:12000))]);
  my.then(r=>{ if(!el||load3!==my){ try{ r.dispose(); }catch(e){} return; } R3=r; use(r); }).catch(e=>{ try{ console.warn('apertura 3D non disponibile:',e&&e.message||e); }catch(x){} }).finally(()=>{ if(load3===my) load3=null; }); }
function start(cb,opts){ opts=opts||{}; replay=!!opts.replay; done=cb; P={luce:null,acqua:null,oggetto:undefined}; pair=[]; nm='Piccolo Mondo';
  el=document.createElement('div'); el.id='film'; el.className='film'; el.innerHTML='<button class="f-skip" data-f="skip">Salta ›</button><div class="f-fade" style="position:absolute;inset:0;background:#04060d;opacity:0;pointer-events:none;z-index:2"></div><div class="f-sub" aria-live="polite"></div><div class="f-hint"></div><div class="f-ctl"></div>'+(replay?'':'<div class="f-gate" data-f="gate"><div class="gt">TERRARIO</div><div class="gs">Tocca per iniziare</div><div class="gn">Meglio con l’audio acceso: la storia ti viene raccontata a voce.</div></div>'); document.body.appendChild(el); R=null; use(make2D()); start3D();
  el.addEventListener('pointerdown',onDown); el.addEventListener('pointermove',onMove); el.addEventListener('pointerup',onUp); el.addEventListener('pointercancel',onUp); el.addEventListener('click',onClick); window.addEventListener('resize',fit);
  AU.unlock(); sc=0; st={v:{}}; lineI=-1; if(replay) enter(0); raf=requestAnimationFrame(draw); }
window.__film={start,_go:i=>go(i),get scene(){ return sc>=0?SCN[sc].id:null; },get P(){ return P; },get mode(){ return mode; },get loading3d(){ return !!load3; },anchors(){ return R&&sc>=0?R.anchors(SCN[sc].id):null; },info(){ return R&&R.info?R.info():null; },get slots(){ return R3?R3.slots:null; }};
})();
