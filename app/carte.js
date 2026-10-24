/* Carte di Terrario — presentazione: carta (quattro finiture), unboxing nella velina, il dito sulla carta, ventaglio sul vaso, album.
   Solo transform e opacity; ogni effetto torna a riposo. La logica (quali carte escono, quote, mazzo) resta in app1.js (window.__app).
   Tempi in T (progetto.md §3). __fast → 30 ms; «movimento ridotto» → solo dissolvenza. */
(function(){
'use strict';
const T={arrivo:420,hint:1200,filo:80,lembo:180,giro:520,giroR:700,taglio:120,festa:{carta:200,argento:600,sasso:1600,ricordo:900},timbro:180,mazzo:240,vaso:220,ritorno:220,tenuta:350};
let A=null, AU=null, V=null;
const $=s=>document.querySelector(s), fast=()=>!!window.__fast, RM=()=>!!(window.__fx&&window.__fx.RM);
const ms=k=>fast()?30:RM()?Math.min(k,160):k;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sfx=n=>{ try{ AU&&AU.sfx&&AU.sfx(n); }catch(e){} };
const RNOME={carta:'di carta',argento:'d’argento',sasso:'del sasso',ricordo:'ricordo'}, TACCHE={carta:1,argento:2,sasso:3,ricordo:0};
// ---------- incisioni a linea (un solo inchiostro) ----------
const ART={
 pioggia:'M30 55a12 12 0 0 1 2-24a16 16 0 0 1 31-4a11 11 0 0 1 8 28zM36 66l-4 10M50 66l-4 10M64 66l-4 10',
 ombra:'M35 44v32a4 4 0 0 0 4 4h22a4 4 0 0 0 4-4V44M28 42q22-14 44 0M31 42q19 8 38 0',
 scintilla:'M55 20L38 54h14L44 82L66 44H52zM22 30h6M25 27v6M74 72h6M77 69v6',
 brina:'M50 22v56M26 36l48 28M26 64l48-28M50 30l-6-6M50 30l6-6M50 70l-6 6M50 70l6 6M33 40l-8 2M33 40l-2-8M67 60l8-2M67 60l2 8',
 sasso:'M38 36q10-14 26-6q12 8 10 24q-4 16-20 16q-18-2-20-16q-2-10 4-18z',
 latte:'M30 42h36v22a12 12 0 0 1-12 12H42a12 12 0 0 1-12-12zM66 48q12 2 10 12t-10 6M42 32q2-6-2-10M52 32q2-6-2-10',
 terra:'M22 70q28-26 56 0M34 62q6-10 12-2t12-2M30 74h40M40 78h20',
 tempo:'M34 24h32M34 76h32M38 24q0 20 12 26q12 6 12 26M62 24q0 20-12 26q-12 6-12 26M44 70h12',
 candela:'M44 40h12v34H44zM50 38q-6-8 0-14q6 6 0 14zM34 74h32',
 scheggia:'M50 22l16 22-6 30-20 6-12-24z',
 scudo:'M50 22l24 8v22q0 20-24 28q-24-8-24-28V30zM40 36l-4 14',
 campanello:'M38 62q0-26 12-30q12 4 12 30zM50 28v4M34 62h32M46 66q4 6 8 0',
 gomitolo:'M50 50m-22 0a22 22 0 1 0 44 0a22 22 0 1 0-44 0M32 40q18 2 34 16M30 56q18-4 36 8M40 30q6 16 24 28M72 60q10 6 8 16',
 radio:'M28 40h44v34H28zM62 57m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M34 50h16M34 58h16M34 66h16M58 40l12-16',
 fusa:'M26 66q6-20 26-18q22 2 24 18H26zM30 54q-2-10 8-10q6 0 8 6M30 46l2-8 6 6M74 66q6-10-2-14M64 34h8l-8 8h8',
 bussola:'M50 50m-24 0a24 24 0 1 0 48 0a24 24 0 1 0-48 0M50 30l6 20-6 20-6-20zM50 22v4M50 74v4M22 50h4M74 50h4',
 lente:'M44 44m-18 0a18 18 0 1 0 36 0a18 18 0 1 0-36 0M57 57l18 18M36 38q4-6 10-6',
 semi:'M32 26h36v48H32zM32 26l18 14 18-14M44 56l2 2M52 60l2 2M48 50l2 2',
 moneta:'M50 50m-22 0a22 22 0 1 0 44 0a22 22 0 1 0-44 0M50 50m-17 0a17 17 0 1 0 34 0a17 17 0 1 0-34 0M50 38l4 8 9 1-6 6 1 9-8-4-8 4 1-9-6-6 9-1z',
 chiave:'M36 40m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0M46 40h30M70 40v8M62 40v6',
 ric_muta:'M50 26l6 18 18 6-18 6-6 18-6-18-18-6 18-6z',
 ric_popolo:'M30 66V52l10-8 10 8v14zM52 66V56l8-6 8 6v10zM26 66h50',
 ric_biscotto:'M50 62m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M36 48m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M46 40m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M58 40m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M66 50m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
 ric_finale:'M50 34q-14-8-26-2v40q12-6 26 2q14-8 26-2V32q-12-6-26 2zM50 34v40'};
const CREPE={sasso:'M48 46l6 8-3 8M58 42l8 6M44 60l-8 4',scheggia:'M44 40l10 12-4 14M60 48l6 8',fusa:'M40 60l6 2M52 58l6 4',chiave:'M30 36l4 6M42 44l4-4'};
const JAR='M36 24h28v6l4 4v40a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V34l4-4zM44 64q6-8 12 0';
const svg=(d,cls)=>'<svg class="'+(cls||'')+'" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+d+'"/></svg>';
// ---------- finiture: una texture canvas per finitura, in cache ----------
const PAPER={};
function paper(k){ if(PAPER[k]) return PAPER[k]; const c=document.createElement('canvas'); c.width=256; c.height=364; const x=c.getContext('2d'); if(!x) return PAPER[k]='';
  const base={carta:[236,226,206],argento:[214,216,220],sasso:[38,36,44],ricordo:[246,244,238]}[k]||[230,230,230]; x.fillStyle='rgb('+base.join(',')+')'; x.fillRect(0,0,256,364);
  let s=k.length*977; const r=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  const g=k==='sasso'?14:k==='ricordo'?4:9, n=k==='ricordo'?2200:5200; for(let i=0;i<n;i++){ const v=Math.round((r()-.5)*g); x.fillStyle='rgba('+(v>0?255:0)+','+(v>0?255:0)+','+(v>0?255:0)+','+Math.abs(v)/100+')'; x.fillRect(r()*256,r()*364,1+r()*1.5,1+r()*1.5); }
  if(k==='carta'||k==='argento') for(let i=0;i<70;i++){ x.strokeStyle='rgba('+(r()<.5?'255,255,255':'80,60,30')+',.07)'; x.lineWidth=.8; x.beginPath(); const px=r()*256, py=r()*364; x.moveTo(px,py); x.lineTo(px+(r()-.5)*40,py+(r()-.5)*8); x.stroke(); }
  if(k==='sasso') for(let i=0;i<120;i++){ x.fillStyle='rgba(168,139,255,'+(r()*.08)+')'; x.fillRect(r()*256,r()*364,1,1); }
  const v=x.createRadialGradient(128,182,60,128,182,240); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,k==='sasso'?'rgba(0,0,0,.45)':'rgba(70,50,20,.16)'); x.fillStyle=v; x.fillRect(0,0,256,364);
  return PAPER[k]=c.toDataURL('image/jpeg',.6); }
// ---------- la carta ----------
function cardEl(id,o){ o=o||{}; const c=A.CARTE[id]; if(!c) return document.createElement('div'); const r=c.r, el=document.createElement('div'); el.className='ct ct-'+r+(o.mini?' mini':'')+(o.lato==='retro'?' flip':''); el.dataset.id=id; el.style.setProperty('--paper','url('+paper(r)+')');
  const tk='<span class="tk">'+'<i></i>'.repeat(TACCHE[r])+'</span>', set=A.SET_CARTE?A.SET_CARTE[c.set]||'':'';
  let art; if(r==='ricordo'){ const im=A.cardImg?A.cardImg(id):null, alb=A.G&&A.G.album&&A.G.album[id]; art='<div class="ph'+(im?'':' noph')+'">'+(im?'<img src="'+im+'" alt="">':svg(ART[id]||JAR,'art'))+'<span class="dt">giorno '+(alb?alb.d:'—')+(A.G&&A.G.name?' · '+esc(A.G.name):'')+'</span></div>'; }
  else art=(r==='sasso'?'<span class="shard">'+svg(ART[id]||JAR,'art')+svg(CREPE[id]||CREPE.sasso,'crk')+'</span>':svg(ART[id]||JAR,'art'));
  el.innerHTML='<div class="cf fr">'+tk+'<b class="tt">'+esc(c.n)+'</b>'+art+'<p class="cd">'+esc(c.d)+'</p><span class="rw">'+RNOME[r]+'</span><span class="st">'+esc(set)+'</span>'+(r==='argento'?'<i class="foil"></i>':'')+'</div>'
   +'<div class="cf bk">'+tk+svg(JAR,'jar')+'<p class="nar bx">'+esc(c.x||c.come||c.d)+'</p><span class="rw">Terrario</span></div>';
  return el; }
// ---------- il dito: inclinare, girare, tenere premuto, scorrere ----------
function touch(el,o){ o=o||{}; let p=null, raf=0, hold=0, lastTap=0;
  const rest=()=>{ el.classList.remove('mv','near'); ['--rx','--ry','--tx','--ty','--lx','--ly','--lm'].forEach(k=>el.style.removeProperty(k)); };
  const apply=()=>{ raf=0; if(!p) return; const w=el.offsetWidth||230, h=el.offsetHeight||330, dx=p.x-p.x0, dy=p.y-p.y0; const ry=Math.max(-12,Math.min(12,dx/(w*.5)*12)), rx=Math.max(-12,Math.min(12,-dy/(h*.5)*12));
    el.style.setProperty('--rx',rx.toFixed(1)+'deg'); el.style.setProperty('--ry',ry.toFixed(1)+'deg'); el.style.setProperty('--lx',(50+ry*4).toFixed(0)+'%'); el.style.setProperty('--ly',(50-rx*4).toFixed(0)+'%'); el.style.setProperty('--lm',Math.min(1,Math.hypot(rx,ry)/9).toFixed(2));
    if(p.drag){ el.style.setProperty('--tx',dx.toFixed(0)+'px'); el.style.setProperty('--ty',dy.toFixed(0)+'px'); if(o.onDrag) o.onDrag(dx,dy,p); } };
  el.addEventListener('pointerdown',e=>{ if(e.button) return; p={x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,t0:performance.now(),id:e.pointerId,drag:false,moved:false,axis:null}; el.classList.add('mv'); clearTimeout(hold); hold=setTimeout(()=>{ if(p&&!p.moved) el.classList.add('near'); },ms(T.tenuta)); });
  el.addEventListener('pointermove',e=>{ if(!p||e.pointerId!==p.id) return; p.x=e.clientX; p.y=e.clientY; const dx=p.x-p.x0, dy=p.y-p.y0, d=Math.hypot(dx,dy);
    if(!p.axis&&d>8){ p.axis=Math.abs(dx)>Math.abs(dy)?'x':'y'; if(o.panX&&p.axis==='x'){ p=null; rest(); return; } try{ el.setPointerCapture(e.pointerId); }catch(x){} }
    if(d>8){ p.moved=true; clearTimeout(hold); el.classList.remove('near'); if(o.drag&&d>24&&!p.drag){ p.drag=true; if(o.onDragStart) o.onDragStart(p.id); } } if(!raf) raf=requestAnimationFrame(apply); });
  const up=e=>{ if(!p||e.pointerId!==p.id) return; clearTimeout(hold); const q=p; p=null; const dt=Math.max(1,performance.now()-q.t0), dy=q.y-q.y0, vy=dy/dt, near=el.classList.contains('near'); el.classList.remove('mv'); el.classList.remove('near');
    if(!q.moved){ if(!near){ const now=performance.now(); const dbl=now-lastTap<350; lastTap=now; if(dbl&&o.onDouble) o.onDouble(); else if(o.onTap) o.onTap(); } rest(); return; }
    if(q.drag&&o.onDrop&&o.onDrop(q.x-q.x0,dy,q)){ return; }
    if((dy<-60||vy<-.5)&&o.onUp) o.onUp(); else if((dy>60||vy>.5)&&o.onDown) o.onDown(); rest(); };
  el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); el.addEventListener('lostpointercapture',e=>{ if(p&&!p.drag) up(e); });
  return {rest}; }
// ---------- unboxing ----------
let rev=null;
function reveal(dono,onDone){ if(rev) close(); const id=dono.id, c=A.CARTE[id]; if(!c){ if(onDone) onDone({azione:'mazzo'}); return; } const r=c.r;
  const kick={capitolo:'Dal finale, una carta',cura:'Sette giorni di cure: una carta',ricordo:'Un ricordo per l’album'}[dono.fonte]||'Hai trovato una carta';
  const el=document.createElement('div'); el.id='cardrev'; el.className='crv r-'+r; el.dataset.st='arrivo';
  el.innerHTML='<div class="crv-bg"></div><div class="crv-fl"></div><div class="kicker">'+kick+'</div><div class="crv-st"><div class="vel"><div class="lembo l"></div><div class="lembo r"></div><div class="filo"><i></i></div><div class="luce"></div></div></div><div class="crv-hint">Scorri per aprire</div><div class="crv-tim">Nuova nell’album</div><div class="crv-act"><button class="btn" data-a="carta-ok">Apri</button><button class="btn s" data-c="gioca-ora" hidden>Gioca ora</button></div>';
  document.body.appendChild(el); document.documentElement.classList.add('crt-dim'); const st=el.querySelector('.crv-st'), vel=el.querySelector('.vel'), card=cardEl(id,{lato:'retro'}); st.appendChild(card); const btn=el.querySelector('[data-a=carta-ok]'), gb=el.querySelector('[data-c=gioca-ora]');
  const playable=r!=='ricordo'&&!A.canPlay(id); let tm=[]; const later=(f,t)=>tm.push(setTimeout(f,ms(t)));
  rev={el,onDone,id,done:false,st:'arrivo',set(s){ rev.st=s; el.dataset.st=s; }};
  const say=t=>{ try{ AU.say&&AU.say(t); }catch(e){} };
  sfx('carta-velina'); later(()=>{ rev.set('attesa'); later(()=>el.classList.add('hint'),T.hint); },T.arrivo);
  const apri=()=>{ if(rev.st!=='attesa') return; rev.set('apertura'); el.classList.remove('hint'); sfx('carta-filo'); later(()=>sfx('carta-lembo'),T.filo); later(()=>{ rev.set('chiusa'); btn.textContent='Gira'; },T.filo+T.lembo*2+40); };
  const gira=()=>{ if(rev.st!=='chiusa') return; rev.set('giro'); sfx('carta-gira'); const d=r==='carta'?T.giro:T.giroR; card.classList.remove('flip'); later(()=>festa(),d); };
  const festa=()=>{ rev.set('festa'); el.classList.add('f-'+r); sfx('carta-'+(r==='carta'?'posa':r==='argento'?'lamina':r==='sasso'?'sasso':'foto'));
    if(r==='sasso'){ try{ V&&V.fx&&V.fx('meteorite'); }catch(e){} if(window.__fx&&!RM()) window.__fx.grande('rgba(168,139,255,.3)'); }
    say((dono.nuova?'Nuova. ':'')+c.n+'. '+c.d); later(lettura,T.festa[r]); };
  const lettura=()=>{ if(rev.st==='lettura') return; rev.set('lettura'); el.classList.remove('hint'); card.classList.remove('flip'); btn.textContent=r==='ricordo'?'Nell’album':'Nel mazzo'; if(playable) gb.hidden=false; if(dono.nuova){ el.classList.add('nuova'); sfx('carta-timbro'); } };
  const finish=az=>{ if(rev.done) return; rev.done=true; tm.forEach(clearTimeout); try{ AU.stopVoice&&AU.stopVoice(); }catch(e){}
    const end=()=>{ el.remove(); document.documentElement.classList.remove('crt-dim'); rev=null; if(onDone) onDone({azione:az}); };
    if(az==='gioca'){ sfx('carta-vaso'); flyTo(card,vaseTop(),.22,T.vaso,end); return; }
    sfx(r==='ricordo'?'carta-album':'carta-mazzo'); const ace=$('.rb.ace'); const to=ace?ace.getBoundingClientRect():null; flyTo(card,to?{x:to.left+to.width/2,y:to.top+to.height/2}:{x:innerWidth/2,y:innerHeight},.18,T.mazzo,()=>{ if(ace&&window.__fx){ const s=ace.querySelector('small'); if(s) window.__fx.bump(s,true); } end(); }); };
  const salta=()=>{ if(rev.st==='lettura') return; tm.forEach(clearTimeout); tm=[]; el.classList.add('salta'); el.classList.add('f-'+r); vel.classList.add('aperta'); lettura(); };
  const next=()=>{ const s=rev.st; if(s==='arrivo'||s==='attesa') apri(); else if(s==='chiusa') gira(); else if(s==='lettura') finish('mazzo'); else if(s==='apertura'||s==='giro'||s==='festa') salta(); };
  rev.ok=next; rev.gioca=()=>{ if(rev.st!=='lettura') salta(); finish('gioca'); };
  touch(vel,{onTap:apri,onUp:apri,onDown:apri,onDouble:salta});
  touch(card,{onTap:()=>{ if(rev.st==='chiusa') gira(); else if(rev.st==='lettura') card.classList.toggle('flip'); },onDouble:salta,onUp:()=>{ if(rev.st==='chiusa') gira(); else if(rev.st==='lettura'&&playable) finish('gioca'); },onDown:()=>{ if(rev.st==='chiusa') gira(); else if(rev.st==='lettura') finish('mazzo'); }});
  gb.addEventListener('click',e=>{ e.stopPropagation(); rev.gioca(); }); }
function vaseTop(){ const vb=$('#vb'); const r=vb?vb.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight*.6}; return {x:r.left+r.width/2,y:r.top+r.height*.28}; }
function flyTo(card,to,sc,dur,done){ const r=card.getBoundingClientRect(); if(!r.width||RM()||!card.animate){ done(); return; } const dx=to.x-(r.left+r.width/2), dy=to.y-(r.top+r.height/2);
  const a=card.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) rotateX(55deg) scale('+sc+')',opacity:.2}],{duration:ms(dur),easing:'cubic-bezier(.4,0,.8,1)',fill:'forwards'}); a.onfinish=done; }
// ---------- ventaglio: il mazzo sopra il vaso ----------
let hand=null;
function openHand(o){ o=o||{}; if(hand) close(); const have=Object.entries(A.G.mazzo).filter(([id,n])=>n>0&&A.CARTE[id]); const el=document.createElement('div'); el.id='hand'; el.className='crh';
  el.innerHTML='<div class="crh-scrim" data-c="chiudi"></div><div class="crh-halo"></div><div class="kicker crh-k">Asso nella manica</div><div class="crh-hint">'+(have.length?'Trascina una carta sul vaso per giocarla. Toccala per girarla.':'Nessuna carta. Ogni finale ne regala una, e ogni sette giorni di cura un’altra.')+'</div><div class="crh-strip"></div><div class="crh-act"><button class="btn s" data-c="chiudi">Chiudi</button></div>';
  document.body.appendChild(el); document.documentElement.classList.add('crt-dim2'); const strip=el.querySelector('.crh-strip'), n=have.length; { const vt=vaseTop(), halo=el.querySelector('.crh-halo'); halo.style.left=vt.x+'px'; halo.style.top=vt.y+'px'; }
  have.forEach(([id,cnt],i)=>{ const c=A.CARTE[id], why=A.canPlay(id); const slot=document.createElement('div'); slot.className='cardrow crh-slot'+(why?' no':''); slot.dataset.id=id; const rot=Math.max(-18,Math.min(18,(i-(n-1)/2)*4)); slot.style.setProperty('--rot',rot+'deg');
    const card=cardEl(id,{mini:true}); slot.appendChild(card); slot.insertAdjacentHTML('beforeend',(cnt>1?'<small class="cnt">×'+cnt+'</small>':'')+'<div class="m">'+esc(why||'')+'</div>'+(why?'':'<button class="btn sm g" data-a="carta-gioca" data-id="'+id+'">Gioca</button>')); strip.appendChild(slot);
    // Durante il trascinamento la carta esce dalla striscia (che altrimenti la taglierebbe) e viaggia in un livello fisso; se non viene giocata torna al suo posto.
    const porta=pid=>{ const rc=card.getBoundingClientRect(); card.classList.add('drg'); Object.assign(card.style,{position:'fixed',left:rc.left+'px',top:rc.top+'px',margin:0,zIndex:6}); el.appendChild(card); try{ card.setPointerCapture(pid); }catch(e){} };
    const torna=()=>{ card.classList.remove('drg'); ['position','left','top','margin','zIndex'].forEach(k=>card.style[k]=''); slot.insertBefore(card,slot.firstChild); };
    touch(card,{panX:true,drag:!why,onTap:()=>card.classList.toggle('flip'),onDragStart:porta,onDrag:(dx,dy)=>{ const over=card.getBoundingClientRect().top<innerHeight*.5; el.classList.toggle('over',over); },onDrop:(dx,dy)=>{ el.classList.remove('over'); if(card.getBoundingClientRect().top>=innerHeight*.5){ torna(); return false; } sfx('carta-vaso'); flyTo(card,vaseTop(),.25,T.vaso,()=>{ if(o.onPlay) o.onPlay(id); }); return true; },onUp:()=>{ if(why&&window.__fx) window.__fx.shake(card); }}); });
  hand={el,onPlay:o.onPlay}; sfx('carta-ventaglio'); }
// ---------- album ----------
function albumHTML(){ const G=A.G, alb=G.album||{}, O=A.cardOdds(), sets=A.SET_CARTE||{tempo:'Il tempo che fa',casa:'La casa',biscotto:'Biscotto',cassetto:'Il cassetto'}; let h='<div class="alb"><p class="muted">Le carte si guadagnano solo giocando: una a fine capitolo, una ogni sette giorni di cura, e i ricordi quando succede qualcosa per la prima volta. Non si comprano mai.</p>';
  Object.entries(sets).forEach(([k,nome])=>{ const ids=Object.keys(A.CARTE).filter(id=>A.CARTE[id].set===k), got=ids.filter(id=>alb[id]).length, full=got===ids.length;
    h+='<div class="card alb-set'+(full?' full':'')+'"><div class="alb-h"><span class="kicker">'+esc(nome)+'</span><b>'+got+' / '+ids.length+'</b>'+(full?'<span class="stamp">Completo</span>':'')+'</div><div class="alb-grid">';
    ids.forEach(id=>{ const c=A.CARTE[id]; if(alb[id]){ const n=G.mazzo[id]||0; h+='<button class="alb-c" data-c="vedi" data-id="'+id+'" aria-label="'+esc(c.n)+'">'+cardEl(id,{mini:true}).outerHTML+(n>1?'<small class="cnt">×'+n+'</small>':'')+'</button>'; }
      else { const fam=c.w?Object.entries(c.w).filter(e=>e[1]>=3).map(e=>e[0]):[]; const come=c.come||('Si pesca a fine capitolo o dopo sette giorni di cura.'+(fam.length?' Più facile dopo un finale di '+fam.join(', ')+'.':'')); h+='<div class="alb-sil" style="--paper:url('+paper('carta')+')"><span class="tk">'+'<i></i>'.repeat(TACCHE[c.r])+'</span>'+svg(ART[id]||JAR,'art')+'<span class="rw">'+RNOME[c.r]+'</span><p class="come">'+esc(come)+'</p></div>'; } });
    h+='</div></div>'; });
  h+='<div class="card alb-odds"><div class="kicker">Come pesca il vaso</div><p>Ogni pesca: <b>di carta '+Math.round(O.carta*100)+'%</b> · <b>d’argento '+Math.round(O.argento*100)+'%</b> · <b>del sasso '+Math.round(O.sasso*100)+'%</b>. Se nella rarità uscita ti manca qualcosa, esce una carta che ti manca.</p><p>Garanzie: la prossima d’argento arriva entro <b>'+O.garanzia.argento+'</b> '+(O.garanzia.argento===1?'pesca':'pesche')+', la prossima del sasso entro <b>'+O.garanzia.sasso+'</b>. Giorni di cura verso la prossima pesca: <b>'+O.cura.fatti+' / '+O.cura.ogni+'</b>. Pesche fatte: '+O.pesche+'.</p><p class="muted">I ricordi non si pescano: arrivano una volta sola, quando succede.</p></div></div>'; return h; }
function album(el){ el.innerHTML=albumHTML(); }
// ---------- visore: una carta a schermo ----------
let view=null;
function openView(id){ if(view) view.el.remove(); const el=document.createElement('div'); el.id='cardview'; el.className='crw'; el.innerHTML='<div class="crh-scrim" data-c="chiudi"></div><div class="crv-st"></div><p class="crv-hint on">Inclinala con il dito. Toccala per girarla. Tienila premuta per leggerla.</p><div class="crh-act"><button class="btn s" data-c="chiudi">Chiudi</button></div>'; document.body.appendChild(el); const card=cardEl(id,{}); el.querySelector('.crv-st').appendChild(card); touch(card,{onTap:()=>card.classList.toggle('flip')}); view={el}; sfx('carta-pagina'); }
function isOpen(){ return !!(rev||hand||view); }
function close(){ if(rev){ rev.el.remove(); rev=null; } if(hand){ hand.el.remove(); hand=null; } if(view){ view.el.remove(); view=null; } document.documentElement.classList.remove('crt-dim','crt-dim2'); }
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-c]'); if(!b) return; const k=b.dataset.c; if(k==='chiudi'){ if(view){ view.el.remove(); view=null; } else close(); } else if(k==='vedi') openView(b.dataset.id); });
// ---------- stile ----------
const CSS=`
.crt-dim #app{opacity:.6;transition:opacity .4s}.crt-dim2 #app{opacity:.7;transition:opacity .3s}
@property --sc{syntax:'<number>';inherits:false;initial-value:1}
.ct{--cw:230px;--rx:0deg;--ry:0deg;--fl:0deg;--tx:0px;--ty:0px;--lx:50%;--ly:50%;--lm:0;--sc:1;position:relative;width:var(--cw);height:calc(var(--cw)*1.43);font-size:calc(var(--cw)*.062);transform-style:preserve-3d;transform:translate(var(--tx),var(--ty)) rotateX(var(--rx)) rotateY(calc(var(--ry) + var(--fl))) scale(var(--sc));transition:transform .22s cubic-bezier(.22,1,.36,1);touch-action:none;user-select:none;-webkit-user-select:none;flex:none}
.ct.mv{transition:none}.ct.near{--sc:1.08}.ct.flip{--fl:180deg}.ct.mini{--cw:96px;touch-action:pan-x}
.ct .cf{position:absolute;inset:0;border-radius:calc(var(--cw)*.045);overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:var(--paper) center/cover,#e9e1cc;color:#4b3b2a;box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 0 0 1px rgba(0,0,0,.08) inset,0 10px 24px rgba(0,0,0,.45),0 2px 4px rgba(0,0,0,.4);display:flex;flex-direction:column;align-items:center;padding:9% 7% 7%;text-align:center}
.ct .cf::before{content:"";position:absolute;inset:4.5%;border:1px solid currentColor;opacity:.32;border-radius:calc(var(--cw)*.02);pointer-events:none}
.ct .cf::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 0 0,rgba(255,255,255,.28),transparent 12%),radial-gradient(circle at 100% 100%,rgba(255,255,255,.22),transparent 12%),radial-gradient(circle at 100% 0,rgba(90,60,20,.14),transparent 14%),radial-gradient(circle at 0 100%,rgba(90,60,20,.12),transparent 12%)}
.ct .bk{transform:rotateY(180deg);justify-content:center;gap:4%}.ct .bk .jar{width:34%;opacity:.42;filter:drop-shadow(0 1px 0 rgba(255,255,255,.6))}.ct .bk .bx{font-size:.78em;line-height:1.35;margin:0;color:inherit;opacity:.9;padding:0 2%;max-height:52%;overflow:hidden}
.ct .tt{font:800 .92em/1.15 Manrope,sans-serif;letter-spacing:.02em;margin-top:2%;position:relative}.ct .art{width:58%;margin:5% 0 3%;position:relative}
.ct .cd{font:500 .66em/1.35 Manrope,sans-serif;margin:0;opacity:.85;flex:1}.ct .rw{font:800 .5em Manrope,sans-serif;letter-spacing:.2em;text-transform:uppercase;opacity:.6;margin-top:4%}.ct .st{position:absolute;left:7%;bottom:5.5%;font:700 .46em Manrope,sans-serif;letter-spacing:.08em;opacity:.45}
.ct .tk{position:absolute;top:7%;right:7%;display:flex;gap:2px;height:3%}.ct .tk i{display:block;width:calc(var(--cw)*.028);height:100%;border-radius:1px;background:rgba(0,0,0,.14);box-shadow:0 1px 0 rgba(255,255,255,.45),0 -1px 0 rgba(0,0,0,.18) inset}
.ct-argento .cf{color:#30353c;background:var(--paper) center/cover,#d6d8dc}.ct .foil{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:calc(.12 + var(--lm)*.7);background:linear-gradient(115deg,transparent 0%,rgba(255,255,255,.08) 30%,rgba(255,255,255,.75) 50%,rgba(255,255,255,.08) 70%,transparent 100%);background-size:220% 220%;background-position:var(--lx) var(--ly);transition:opacity .22s}
.ct-sasso .cf{color:#ddd7ea;background:var(--paper) center/cover,#26242c;box-shadow:0 0 0 1px rgba(255,255,255,.08) inset,0 10px 24px rgba(0,0,0,.6)}.ct-sasso .shard{position:relative;width:58%;margin:5% 0 3%}.ct-sasso .shard .art{width:100%;margin:0}.ct-sasso .crk{position:absolute;inset:0;width:100%;color:#A88BFF;stroke-width:2.2;filter:drop-shadow(0 0 3px #A88BFF);animation:crk 3.2s ease-in-out infinite}
@keyframes crk{0%,100%{opacity:.55}50%{opacity:1}}
.ct-ricordo .cf{color:#3a342c;background:var(--paper) center/cover,#f4f1e8}.ct .ph{position:relative;width:70%;margin:4% 0 3%;background:#fff;padding:4% 4% 9%;box-shadow:0 2px 6px rgba(0,0,0,.25);transform:rotate(-2deg)}.ct .ph img{display:block;width:100%;aspect-ratio:1;object-fit:cover;filter:sepia(.25) contrast(.95)}.ct .ph.noph .art{width:100%;margin:0;opacity:.5}.ct .ph .dt{position:absolute;left:0;right:0;bottom:1%;font:italic 500 .58em Newsreader,serif;color:#6b5a3e}
.crv,.crh,.crw{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;pointer-events:auto}
.crv .crv-bg{position:absolute;inset:0;background:rgba(6,9,14,.55);transition:background .6s}.crv.f-sasso .crv-bg{background:rgba(4,5,10,.86)}
.crv .crv-fl{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}.crv.f-argento .crv-fl{animation:crvfl .6s ease-out}@keyframes crvfl{0%{opacity:0}30%{opacity:.06}100%{opacity:0}}
.crv .kicker,.crv .crv-hint,.crv .crv-act,.crv .crv-tim,.crh > *,.crw > *{position:relative;z-index:1}
.crv-st{position:relative;perspective:900px;width:230px;height:330px;display:flex;align-items:center;justify-content:center;z-index:1}
.vel{position:absolute;inset:-3% -6%;z-index:2;transform:scale(.92) translateY(40px);opacity:0;transition:transform .42s cubic-bezier(.22,1,.36,1),opacity .4s;touch-action:none;pointer-events:none}
.crv[data-st=attesa] .vel,.crv[data-st=apertura] .vel{pointer-events:auto}.crv:not([data-st=arrivo]) .vel{transform:none;opacity:1}
.crv[data-st=attesa] .vel{animation:velr 1.6s ease-in-out infinite}@keyframes velr{0%,100%{transform:scale(1)}50%{transform:scale(1.015)}}
.vel .lembo{position:absolute;top:0;bottom:0;width:52%;background:linear-gradient(100deg,rgba(236,230,216,.97),rgba(222,214,196,.94));box-shadow:0 8px 20px rgba(0,0,0,.35);transform-origin:left center;transition:transform .18s cubic-bezier(.4,0,.6,1)}.vel .lembo.l{left:0;border-radius:10px 2px 2px 10px}.vel .lembo.r{right:0;transform-origin:right center;border-radius:2px 10px 10px 2px}
.vel .filo{position:absolute;left:8%;right:8%;top:50%;height:2px;background:#8b7355;transform-origin:center;transition:transform .08s,opacity .08s}.vel .filo i{position:absolute;left:50%;top:-5px;width:12px;height:12px;border-radius:50%;background:#8b7355;transform:translateX(-50%)}
.vel .luce{position:absolute;inset:20%;border-radius:50%;background:radial-gradient(circle,rgba(168,139,255,.35),transparent 70%);opacity:0;transition:opacity .8s;pointer-events:none}.crv.r-sasso[data-st=attesa] .luce{opacity:1;animation:crk 1.6s ease-in-out infinite}
.crv[data-st=apertura] .filo,.crv:not([data-st=arrivo]):not([data-st=attesa]) .filo{transform:scaleX(.1);opacity:0}
.crv[data-st=apertura] .lembo.l,.vel.aperta .lembo.l,.crv[data-st=chiusa] .lembo.l,.crv[data-st=giro] .lembo.l,.crv[data-st=festa] .lembo.l,.crv[data-st=lettura] .lembo.l{transform:rotateY(-150deg);transition-delay:.08s}
.crv[data-st=apertura] .lembo.r,.vel.aperta .lembo.r,.crv[data-st=chiusa] .lembo.r,.crv[data-st=giro] .lembo.r,.crv[data-st=festa] .lembo.r,.crv[data-st=lettura] .lembo.r{transform:rotateY(150deg);transition-delay:.26s}
.crv:not([data-st=lettura]) .bk .bx{opacity:0}
.crv[data-st=chiusa] .vel,.crv[data-st=giro] .vel,.crv[data-st=festa] .vel,.crv[data-st=lettura] .vel{opacity:0;transition:opacity .3s .4s;pointer-events:none}
.crv .ct{transition:transform .52s cubic-bezier(.3,.7,.3,1)}.crv.r-argento .ct,.crv.r-sasso .ct,.crv.r-ricordo .ct{transition-duration:.7s;transition-timing-function:cubic-bezier(.2,.9,.1,1)}.crv .ct.mv{transition:none}
.crv[data-st=giro] .ct{animation:giro .52s}.crv.r-argento[data-st=giro] .ct,.crv.r-sasso[data-st=giro] .ct{animation-duration:.7s}@keyframes giro{0%{--sc:1}50%{--sc:1.06}100%{--sc:1}}
.crv.f-carta .ct{animation:posa .2s ease-out}@keyframes posa{0%{transform:translateY(-4px)}100%{transform:translateY(0)}}
.crv.f-argento .ct .foil{animation:lamina .6s ease-in-out}@keyframes lamina{0%{background-position:-20% 50%;opacity:.1}50%{opacity:.9}100%{background-position:120% 50%;opacity:.12}}
.crv.f-sasso .crk{animation:crk2 .8s ease-in-out 2}@keyframes crk2{0%,100%{opacity:.5;filter:drop-shadow(0 0 2px #A88BFF)}50%{opacity:1;filter:drop-shadow(0 0 9px #A88BFF)}}
.crv.f-ricordo .ph img{animation:svil .9s ease-out}@keyframes svil{0%{filter:grayscale(1) contrast(.4) blur(2px)}100%{filter:sepia(.25) contrast(.95)}}
.crv.f-carta .crv-st::after,.crv.f-sasso .crv-st::after{content:"";position:absolute;left:10%;right:10%;bottom:-4%;height:12%;border-radius:50%;background:radial-gradient(ellipse,rgba(230,220,200,.35),transparent 70%);animation:polv 1.2s ease-out forwards;pointer-events:none}@keyframes polv{0%{opacity:0;transform:translateY(0) scale(.6)}30%{opacity:1}100%{opacity:0;transform:translateY(-40px) scale(1.4)}}
.crv .crv-hint{color:var(--quiet);font-size:13px;opacity:0;transition:opacity .4s}.crv.hint .crv-hint,.crv-hint.on{opacity:1}
.crv .crv-tim{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-8deg) scale(1.3);opacity:0;padding:6px 12px;border:2px solid #7CF5C8;color:#7CF5C8;border-radius:6px;font:800 12px Manrope,sans-serif;letter-spacing:.14em;text-transform:uppercase;pointer-events:none;z-index:3;transition:transform .18s cubic-bezier(.22,1,.36,1),opacity .18s;mix-blend-mode:screen}.crv.nuova .crv-tim{opacity:.95;transform:translate(-50%,-50%) translateY(128px) rotate(-8deg) scale(1)}
.crv .crv-act{display:flex;gap:10px;width:100%;max-width:320px}.crv .btn{flex:1}.crv [hidden]{display:none!important}.crv .kicker{text-align:center;margin-bottom:14px}
.crh{justify-content:flex-end;gap:8px;padding:0 0 calc(118px + env(safe-area-inset-bottom))}.crh-scrim{position:absolute;inset:0;background:rgba(3,6,10,.25)}.crh-k{display:flex;align-items:center;gap:10px}.crh .crh-act{position:absolute;top:calc(14px + env(safe-area-inset-top));right:14px;width:auto;max-width:none}.crh .crh-act .btn{min-height:40px;padding:0 14px;font-size:13px;background:rgba(10,15,21,.6)}.crh .ct.drg{transition:none}
.crh-halo{position:absolute;left:50%;top:22%;width:260px;height:200px;transform:translate(-50%,-50%) scale(.8);border-radius:50%;background:radial-gradient(ellipse,rgba(234,241,245,.34),transparent 62%);opacity:0;transition:opacity .25s,transform .25s;pointer-events:none}.crh.over .crh-halo{opacity:1;transform:translate(-50%,-50%) scale(1)}
.crh-hint{color:var(--quiet);font-size:13px;text-align:center;max-width:300px}.crh-strip{display:flex;gap:10px;align-items:flex-end;width:100%;max-width:520px;overflow-x:auto;overflow-y:visible;padding:24px 14px 8px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.crh-slot{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;width:120px;scroll-snap-align:center;position:relative;border:0;padding:0}.crh-slot .ct{--cw:112px;transform:translate(var(--tx),var(--ty)) rotateX(var(--rx)) rotateY(calc(var(--ry) + var(--fl))) rotate(var(--rot,0deg)) scale(var(--sc))}.crh-slot .ct.mv{z-index:5}.crh-slot.no .ct{opacity:.45}.crh-slot .m{font-size:11px;color:var(--quiet);text-align:center;min-height:14px}.crh-slot .btn{width:auto;min-height:36px;padding:0 16px}
.cnt{position:absolute;right:4px;top:-8px;min-width:20px;height:20px;border-radius:10px;background:var(--ink);color:#05070F;font:800 11px Manrope,sans-serif;display:flex;align-items:center;justify-content:center;padding:0 5px;z-index:2}
.crh-act,.crw .crh-act{width:100%;max-width:320px}.crw .crh-scrim{background:rgba(3,6,10,.7)}.crw .crv-hint{color:var(--quiet);font-size:12.5px;text-align:center;max-width:280px}
.alb .alb-h{display:flex;align-items:center;gap:10px;margin-bottom:8px}.alb .alb-h b{margin-left:auto;font-size:13px;color:var(--quiet)}.alb .stamp{border:2px solid #7CF5C8;color:#7CF5C8;border-radius:5px;padding:2px 7px;font:800 10px Manrope,sans-serif;letter-spacing:.12em;text-transform:uppercase;transform:rotate(-6deg)}
.alb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.alb-c{position:relative;background:none;border:0;padding:0;display:flex;justify-content:center;cursor:pointer}.alb-c .ct{--cw:92px}
.alb-sil{position:relative;width:92px;height:132px;margin:0 auto;border-radius:4px;background:var(--paper) center/cover,#e9e1cc;opacity:.55;color:#7a6a50;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px;text-align:center;box-shadow:0 0 0 1px rgba(0,0,0,.1) inset}
.alb-sil .art{width:48%;color:transparent;stroke:rgba(0,0,0,.12);filter:drop-shadow(0 1px 0 rgba(255,255,255,.55))}.alb-sil .tk{position:absolute;top:6px;right:6px;display:flex;gap:2px;height:4px}.alb-sil .tk i{display:block;width:3px;height:100%;background:rgba(0,0,0,.12);box-shadow:0 1px 0 rgba(255,255,255,.45)}
.alb-sil .rw{font:800 6px Manrope,sans-serif;letter-spacing:.2em;text-transform:uppercase;opacity:.7}.alb-sil .come{font:500 8.5px/1.25 Manrope,sans-serif;margin:4px 0 0;color:#5a4a34}
.alb-odds p{font-size:13px;margin:6px 0}
@media (prefers-reduced-motion:reduce){.crv .vel,.crv .lembo,.crv .ct,.ct{transition:opacity .2s!important;animation:none!important}}
`;
const sty=document.createElement('style'); sty.textContent=CSS; document.head.appendChild(sty);
function init(o){ A=o.app||window.__app; AU=o.audio||window.__au; V=o.vase||window.__vase; }
window.__carte={init,reveal,hand:openHand,album,albumHTML,cardEl,view:openView,isOpen,close,ok:()=>{ if(rev) rev.ok(); },T};
})();
