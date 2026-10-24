(function(){
'use strict';
const A=window.__app, T=A.T, esc=A.esc, $=s=>document.querySelector(s);
// ================= VASO PROVVISORIO (canvas) =================
let cam={x:150,y:132,z:1.3,tx:150,ty:132,tz:1.3};
const cv=document.createElement('canvas'); const ctx=cv.getContext('2d'); let dpr=1, VIEW=null, anim={}, lastDraw=0;
const rnd=(a,b)=>a+Math.random()*(b-a);
function mix(a,b,t){ const pa=parseInt(a.slice(1),16), pb=parseInt(b.slice(1),16); const f=(s)=>Math.round(((pa>>s)&255)*(1-t)+((pb>>s)&255)*t); return '#'+((1<<24)+(f(16)<<16)+(f(8)<<8)+f(0)).toString(16).slice(1); }
let DRY=0, POOR=0; const lc=c=>DRY>0.02?mix(c,'#8d7440',Math.min(.88,DRY)):c;
function isNight(){ const m=A.G&&A.G.settings.tempo; if(m==='notte') return true; if(m==='giorno') return false; const h=new Date().getHours(); return h<6||h>=20; }
function kOf(W,H){ const tall=H/W>1.3; return Math.min(H*.84/205,W*(tall?.86:.60)/160)*cam.z*(tall?.8:1); }
function heroH(w){ const f=window.__app&&window.__app.G&&window.__app.G.ui&&window.__app.G.ui.fase!=null?window.__app.G.ui.fase:5; return Math.round(Math.max(260,Math.min(innerHeight*(f<4?.62:.56),(w||360)*1.3))); }
function fitCv(){ const w=cv.parentElement?cv.parentElement.clientWidth:360; dpr=Math.min(2,window.devicePixelRatio||1); const big=cv.dataset.big==='1'; const h=big?Math.round(cv.parentElement.clientHeight||300):heroH(w); cv.style.height=h+'px'; cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); }
function circ(x,y,r,f){ ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fillStyle=f; ctx.fill(); }
function glow(x,y,r,c,a){ const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,c.replace('A',a)); g.addColorStop(1,c.replace('A',0)); ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2); }
function drawPlants(v,t,night){ const n=v.plants.length; v.plants.forEach((p,i)=>{ const px=n===1?150:96+i*(108/Math.max(1,n-1)); const k=Math.max(.35,Math.min(1.15,p.v+.2)); const sw=Math.sin(t/1400+i)*1.5;
  if(p.id==='muschio'){ for(let j=0;j<6;j++){ const x=px-22+j*9, r=7+((j*5)%4)*k; circ(x,174,r*k,j%2?lc('#2f7a55'):lc('#3e8e68')); } if(night||p.mut){ glow(px,168,38,'rgba(124,245,200,A)',.35); } }
  else if(p.id==='felce'){ for(let s=0;s<3;s++){ const bx=px-10+s*10; ctx.strokeStyle=lc('#3a7a44'); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx,176); ctx.quadraticCurveTo(bx+(s-1)*12+sw,150*(1-.1*k),bx+(s-1)*20+sw*2,128+(1-k)*30); ctx.stroke(); for(let l=0;l<5;l++){ const f=l/5; const lx=bx+(s-1)*20*f*f+sw*f, ly=176-48*k*f; ctx.fillStyle=l%2?lc('#4e8a4a'):lc('#5ea05a'); ctx.beginPath(); ctx.ellipse(lx+(l%2?5:-5),ly,6,2.6,l%2?.5:-.5,0,6.28); ctx.fill(); } } }
  else if(p.id==='succulenta'){ for(let l=0;l<7;l++){ const a=l/7*Math.PI; ctx.fillStyle=l%2?lc('#5a8a6a'):lc('#6a9a78'); ctx.beginPath(); ctx.ellipse(px+Math.cos(a)*10-0,166-Math.sin(a)*10*k,4,9*k,a-1.57,0,6.28); ctx.fill(); } circ(px,166,3,'#c88'); }
  else if(p.id==='fungo'){ for(let m=0;m<3;m++){ const x=px-12+m*12, h=10+m%2*6; ctx.fillStyle=lc('#e8d8c0'); ctx.fillRect(x-1.5,176-h*k,3,h*k); ctx.fillStyle=p.mut||v.R>.6?lc('#ff9ab0'):lc('#d88070'); ctx.beginPath(); ctx.ellipse(x,176-h*k,7,4.5,0,Math.PI,0); ctx.fill(); if(p.mut||v.R>.6) glow(x,170,18,'rgba(255,150,180,A)',.35); } }
  else if(p.id==='carnivora'){ ctx.strokeStyle=lc('#3a7a44'); ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(px,176); ctx.quadraticCurveTo(px+6,150,px+2+sw,140); ctx.stroke(); ctx.fillStyle=lc('#4e9a5a'); ctx.beginPath(); ctx.ellipse(px+2+sw,138,7,9,.3,0,6.28); ctx.fill(); ctx.fillStyle='#d44'; ctx.beginPath(); ctx.ellipse(px+2+sw,142,5,3,.3,0,6.28); ctx.fill(); } }); }
// ---- popoli: insediamenti che crescono, comportamenti, bolle sugli eventi ----
const ANCHOR=[118,182,150]; let anchors={}, groups={}, bubbles=[];
function anchorFor(v,id){ if(anchors[id]!=null) return anchors[id]; const used=Object.values(anchors); anchors[id]=ANCHOR.find(a=>!used.includes(a))||150; return anchors[id]; }
const stageOf=(v,x)=>{ const age=v.d-x.society.since; return age<8?0:age<24?1:age<60?2:3; };
function flame(x,y,t,s){ const f=1+.18*Math.sin(t/90+x); glow(x,y-4*s,14*s,'rgba(255,170,60,A)',.35); ctx.fillStyle='#ff8a2a'; ctx.beginPath(); ctx.ellipse(x,y-3*s,2.6*s*f,5*s*f,0,0,6.28); ctx.fill(); ctx.fillStyle='#ffd35a'; ctx.beginPath(); ctx.ellipse(x,y-2.4*s,1.4*s,3*s*f,0,0,6.28); ctx.fill(); }
function hut(x,y,s,col,lit){ ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(x,y,7*s,6*s,0,Math.PI,0); ctx.fill(); ctx.fillStyle='rgba(20,10,5,.75)'; ctx.fillRect(x-1.7*s,y-3.6*s,3.4*s,3.6*s); if(lit){ ctx.fillStyle='rgba(255,210,120,.9)'; ctx.fillRect(x-1.2*s,y-3.1*s,2.4*s,2.7*s); } }
function landmark(c,x,y,s,t,night){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  if(c==='sacro'){ glow(0,-14,24,'rgba(255,230,160,A)',.28); ctx.fillStyle='#8c8c92'; rr(-5.5,-25,11,25,4); ctx.fill(); ctx.fillStyle='#26262a'; ctx.fillRect(-3.2,-20,2.2,2.2); ctx.fillRect(1,-20,2.2,2.2); ctx.fillRect(-2.2,-14.5,4.4,1.4); flame(-11,0,t,.7); flame(11,0,t+90,.7); }
  else if(c==='sapere'){ ctx.fillStyle='#7a6a58'; ctx.fillRect(-3,-26,6,26); circ(0,-29,9,'#e9e2cf'); ctx.strokeStyle='#3a2a1a'; ctx.lineWidth=1.1; ctx.beginPath(); ctx.arc(0,-29,9,0,6.28); ctx.stroke(); const a1=t/1400; ctx.beginPath(); ctx.moveTo(0,-29); ctx.lineTo(Math.cos(a1)*7,-29+Math.sin(a1)*7); ctx.moveTo(0,-29); ctx.lineTo(Math.cos(a1/12)*4.5,-29+Math.sin(a1/12)*4.5); ctx.stroke(); }
  else if(c==='commercio'){ ctx.fillStyle='#7a5a3a'; ctx.fillRect(-12,-9,24,9); for(let i=0;i<6;i++){ ctx.fillStyle=i%2?'#f1ebe0':'#c8473b'; ctx.beginPath(); ctx.moveTo(-13+i*4.4,-20); ctx.lineTo(-8.6+i*4.4,-20); ctx.lineTo(-8.6+i*4.4,-10); ctx.lineTo(-13+i*4.4,-10); ctx.fill(); } ctx.font='9px serif'; ctx.textAlign='center'; ctx.fillText('🪙',-5,-10.5+Math.sin(t/400)*.8); ctx.fillText('🪙',5,-10.5-Math.sin(t/400)*.8); }
  else if(c==='gioco'){ for(let i=0;i<7;i++){ ctx.fillStyle=['#ff6b6b','#ffd166','#4ecdc4','#a78bfa'][i%4]; ctx.beginPath(); ctx.moveTo(-24+i*8,-25+Math.sin(i)*1.5); ctx.lineTo(-20+i*8,-25+Math.sin(i)*1.5); ctx.lineTo(-22+i*8,-19+Math.sin(i)*1.5); ctx.fill(); } ctx.font='13px serif'; ctx.textAlign='center'; ctx.fillText('🧸',0,-5-Math.abs(Math.sin(t/450))*8); }
  else if(c==='mistero'){ ctx.strokeStyle='#d9b84a'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(0,-15,8,13,0,0,6.28); ctx.stroke(); const g=ctx.createLinearGradient(-6,-26,6,-4); g.addColorStop(0,'rgba(190,225,255,.75)'); g.addColorStop(1,'rgba(120,150,210,.35)'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(0,-15,6.2,11.2,0,0,6.28); ctx.fill(); ctx.fillStyle='rgba(255,255,255,'+(.4+.4*Math.sin(t/300))+')'; ctx.fillRect(2,-21,1.5,4); }
  else if(c==='comunicazione'){ ctx.strokeStyle='#9aa4ad'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-28); ctx.moveTo(-6,-4); ctx.lineTo(0,-24); ctx.lineTo(6,-4); ctx.stroke(); for(let k=0;k<3;k++){ const r=((t/260+k*4)%12)+3; ctx.strokeStyle='rgba(160,220,255,'+(1-r/15)+')'; ctx.lineWidth=1.1; ctx.beginPath(); ctx.arc(0,-28,r,-2.4,-.74); ctx.stroke(); } }
  else if(c==='fuoco'){ ctx.fillStyle='#4a3020'; ctx.fillRect(-9,-2,18,3); flame(0,-1,t,1.6); glow(0,-8,34,'rgba(255,150,50,A)',.22); }
  else if(c==='agricoltura'){ ctx.font='11px serif'; ctx.textAlign='center'; for(let i=0;i<4;i++) ctx.fillText('🍄',-15+i*10,-1-(i%2)*4); ctx.strokeStyle='rgba(120,90,60,.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-20,1); ctx.lineTo(20,1); ctx.stroke(); }
  else if(c==='guerra'){ [-12,12].forEach((fx,i)=>{ ctx.strokeStyle='#5a4630'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(fx,0); ctx.lineTo(fx,-26); ctx.stroke(); ctx.fillStyle='#b8352f'; const w=Math.sin(t/200+i)*2; ctx.beginPath(); ctx.moveTo(fx,-26); ctx.lineTo(fx+11,-23+w); ctx.lineTo(fx,-19); ctx.fill(); }); }
  else { ['#c9663a','#e0b04a','#4a8fa8'].forEach((col,i)=>{ ctx.fillStyle=col; ctx.fillRect(-5,-8-i*8,10,8); ctx.fillStyle='#1c1410'; ctx.fillRect(-3,-5-i*8,2,2); ctx.fillRect(1,-5-i*8,2,2); }); }
  ctx.restore(); }
function drawSettle(v,x,t,night){ const a=anchorFor(v,x.id), st=stageOf(v,x), ps=Math.max(.75,Math.min(1.25,x.pop/55)), base=176; groups[x.id]={x:a,y:base-9,r:30};
  if(st>=1){ ctx.strokeStyle='rgba(215,185,140,.4)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(a-36,base+3); ctx.quadraticCurveTo(a,base-1,a+36,base+3); ctx.stroke(); }
  const huts=[0,2,4,6][st], hx=[-22,22,-35,35,-10,10], lit=night||x.society.cult==='fuoco';
  for(let i=0;i<huts;i++) hut(a+hx[i]*ps,base+1,(i>3?.78:.95)*(.9+.12*ps),['#6b4a30','#7a5636','#5d4029'][i%3],lit);
  landmark(x.society.cult,a,base,(.78+st*.2)*ps,t,night);
  if(x.society.culto){ ctx.font='11px serif'; ctx.textAlign='center'; ctx.globalAlpha=.85; ctx.fillText(x.society.culto==='giocatore'?'👁️':'☄️',a,base-46-Math.sin(t/600)*2); ctx.globalAlpha=1; } }
function drawCreatures(v,t,night){ groups={}; v.sp.forEach(x=>{ if(x.alive&&x.society) drawSettle(v,x,t,night); });
  v.sp.forEach(x=>{ if(!x.alive) return; const n=Math.max(1,Math.min(14,Math.round(x.pop/7))); const arr=anim[x.id]||(anim[x.id]=[]); while(arr.length<n) arr.push({x:rnd(92,208),dx:rnd(-.35,.35)||.2,ph:rnd(0,6)}); arr.length=n;
    const px=11+Math.min(18,4.5*x.size), fly=x.id==='mosche', soc=!!x.society&&!fly, a=soc?anchorFor(v,x.id):0, war=v.wars.find(w=>w.includes(x.id)), wi=war?war.indexOf(x.id):0;
    arr.forEach((c,i)=>{ let face;
      if(soc){ if(!c.tx||t>c.nt){ const edge=Math.random()<.16; c.tx=war?(wi===0?a-6:a+6)+rnd(-12,12):edge?(Math.random()<.5?90:210):a+rnd(-28,28); c.carry=!war&&Math.random()<.35; c.nt=t+rnd(1800,4200); } const dd=c.tx-c.x; c.dx=Math.abs(dd)<1.5?0:Math.sign(dd)*(war?.6:.4); c.x+=c.dx; face=war?(wi===0?1:-1):(c.dx?Math.sign(c.dx):(c.face||1)); c.face=face; }
      else { c.x+=c.dx*(fly?2:1); if(c.x<90||c.x>210) c.dx*=-1; face=c.dx<0?-1:1; }
      const gx=c.x, gy=fly?100+Math.sin(t/500+c.ph)*34+i*2:170+Math.sin(t/200+c.ph)*1.2+(war?Math.sin(t/90+c.ph)*1.5:0);
      if(x.mut.includes('radioattivo')) glow(gx,gy,16,'rgba(150,255,120,A)',.55); if(x.mut.includes('bioluminescenza')) glow(gx,gy,16,'rgba(120,230,255,A)',.55); if(x.mut.includes('velenoso')) glow(gx,gy,14,'rgba(190,140,255,A)',.4);
      ctx.font=px+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.save(); ctx.translate(gx,gy); if(face<0) ctx.scale(-1,1); ctx.fillText(x.icon,0,0); ctx.restore();
      if(x.mut.includes('corazza')){ ctx.strokeStyle='rgba(200,210,220,.6)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(gx,gy,px*.62,0,6.28); ctx.stroke(); }
      if(c.carry&&c.dx) circ(gx+face*2.5,gy-px*.58,1.7,'#e8d8a0'); });
    if(!x.society){ const cx=arr.reduce((s,c)=>s+c.x,0)/arr.length; groups[x.id]={x:cx,y:fly?118:166,r:22}; }
    if(x.monster){ ctx.font='13px serif'; ctx.fillText('👹',arr[0].x,128); } });
  const nowT=performance.now(); bubbles=bubbles.filter(b=>nowT-b.t0<2600); bubbles.forEach(b=>{ const g=groups[b.id]||{x:150,y:150}, k=(nowT-b.t0)/2600, yy=g.y-34-k*22; ctx.globalAlpha=Math.max(0,1-k*k); circ(g.x,yy,9,'rgba(255,255,255,.88)'); ctx.font='12px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(b.emoji,g.x,yy+.5); ctx.globalAlpha=1; }); }
function drawVase(t){ if(!VIEW||!cv.parentElement) return; const v=VIEW, night=isNight(); DRY=v.needs?Math.max(0,Math.min(1,(.5-v.needs.um)/.45)):0; POOR=v.needs?Math.max(0,Math.min(1,(.45-v.needs.ter)/.4)):0; const W=cv.width,H=cv.height; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,W,H); { const bg=ctx.createLinearGradient(0,0,0,H); if(night){ bg.addColorStop(0,'#0b1030'); bg.addColorStop(1,'#241a4e'); } else { bg.addColorStop(0,'#d9b182'); bg.addColorStop(1,'#8a5a34'); } ctx.fillStyle=bg; ctx.fillRect(0,0,W,H); } const k=kOf(W,H); ctx.setTransform(k,0,0,k,W/2-cam.x*k,H*.47-cam.y*k);
  const g=ctx.createLinearGradient(0,0,0,258); if(night){ g.addColorStop(0,'#0b1030'); g.addColorStop(1,'#241a4e'); } else { g.addColorStop(0,v.setup.luce===2?'#f0c890':v.setup.luce===0?'#6a5a52':'#d4a878'); g.addColorStop(1,'#7a4a2a'); } ctx.fillStyle=g; ctx.fillRect(-80,-80,460,420);
  if(night){ for(let i=0;i<22;i++){ circ((i*53)%300,(i*29)%110,.8+((i*7)%3)*.4,'rgba(255,255,255,'+(.4+((i*13)%6)/10)+')'); } circ(250,38,13,'#e8ecff'); glow(250,38,40,'rgba(200,210,255,A)',.35); } else { for(let i=0;i<8;i++) glow(30+i*38,40+(i%3)*26,24,'rgba(255,200,120,A)',v.setup.luce===0?.08:.22); if(v.setup.luce===2) glow(255,25,70,'rgba(255,230,160,A)',.7); }
  ctx.fillStyle='#4a2c18'; ctx.beginPath(); ctx.ellipse(150,236,150,40,0,0,6.28); ctx.fill(); ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(150,216,92,9,0,0,6.28); ctx.fill();
  // vaso: dietro
  ctx.fillStyle='rgba(255,255,255,.05)'; rr(70,34,160,180,22); ctx.fill();
  // strati
  ctx.fillStyle='#8a8a86'; ctx.fillRect(72,200,156,13); for(let i=0;i<30;i++) circ(76+(i*37)%150,203+(i*11)%9,1.4,'#b8b8b0'); ctx.fillStyle='#2a2a2e'; ctx.fillRect(72,194,156,6); if(!(v.needs&&v.needs.ter<.04&&!v.setup.piante.length)){ ctx.fillStyle=POOR>0.02?mix('#5a3a24','#8a8274',POOR*.75):'#5a3a24'; ctx.fillRect(72,176,156,18); } if(DRY>.45){ ctx.strokeStyle='rgba(20,12,8,.55)'; ctx.lineWidth=1; for(let c=0;c<7;c++){ const cx0=80+c*22, cy0=177+(c%3)*3; ctx.beginPath(); ctx.moveTo(cx0,cy0); ctx.lineTo(cx0+6,cy0+6); ctx.lineTo(cx0+3,cy0+12); ctx.stroke(); } }
  // oggetti
  v.setup.oggetti.forEach((o,i)=>{ ctx.font='17px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(T.OGGETTI[o].icon,[84,216,106][i]||100,172); });
  drawPlants(v,t,night);
  // meteorite
  const mx=150,my=178, pulse=.5+.5*Math.sin(t/(900-v.E*4)); ctx.fillStyle='#1b1728'; ctx.strokeStyle='#8a6aff'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(mx-15,my+6); ctx.lineTo(mx-11,my-8); ctx.lineTo(mx+2,my-13); ctx.lineTo(mx+14,my-6); ctx.lineTo(mx+16,my+6); ctx.lineTo(mx+2,my+9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(200,170,255,'+(.3+.6*(v.E/100)*(.6+.4*pulse))+')'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(mx-8,my+2); ctx.lineTo(mx-2,my-5); ctx.lineTo(mx+4,my-1); ctx.lineTo(mx+10,my-6); ctx.stroke(); glow(mx,my,22+v.E/5,'rgba(170,130,255,A)',.25+.35*(v.E/100)*pulse);
  drawCreatures(v,t,night);
  v.wars.forEach(()=>{ ctx.font='15px serif'; ctx.textAlign='center'; ctx.fillText('⚔️',150,150+Math.sin(t/200)*2); });
  // spore
  if(night||v.R>.5){ for(let i=0;i<10;i++){ const y=170-((t/40+i*37)%110), x=100+((i*41)%100)+Math.sin(t/900+i)*8; circ(x,y,1.2,'rgba(200,255,240,'+(.25+.5*Math.sin(t/500+i)**2)+')'); } }
  // vetro: bordo, riflessi, lid
  ctx.strokeStyle='rgba(190,215,230,.75)'; ctx.lineWidth=2.2; rr(70,34,160,180,22); ctx.stroke(); ctx.fillStyle='#8a6a4a'; rr(82,22,136,16,5); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.14)'; rr(78,50,10,120,5); ctx.fill();
  // condensa
  const nd=Math.round(Math.min(10,v.H*13)*(1-Math.min(.8,v.muffa*.0))); for(let i=0;i<nd;i++){ const x=82+((i*47)%136), y=52+((i*31+t/(60+i*9))%120); circ(x,y,1.5+((i*3)%3)*.6,'rgba(255,255,255,.28)'); }
  if(v.muffa>.45){ ctx.fillStyle='rgba(150,70,200,'+Math.min(.5,(v.muffa-.3))+')'; for(let i=0;i<5;i++) circ(86+i*34,190,6+i%2*3,ctx.fillStyle); }
  ctx.setTransform(1,0,0,1,0,0); }
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function focusOf(f){ if(!f) return {x:150,y:132,z:1.3}; const A2=window.__app; if(f.kind==='meteorite') return {x:150,y:176,z:2.7}; if(f.kind==='centro') return {x:150,y:162,z:2.1}; if(f.kind==='lid') return {x:150,y:34,z:2.4}; if(f.kind==='specie'){ const a=anim[f.id]; const cx=groups[f.id]?groups[f.id].x:(a&&a.length?a.reduce((s,c)=>s+c.x,0)/a.length:150); return {x:cx,y:f.id==='mosche'?118:166,z:2.5}; } return {x:150,y:132,z:1.3}; }
function zoomTo(f){ const p=focusOf(f); cam.tx=p.x; cam.ty=p.y; cam.tz=p.z; }
function loop(t){ requestAnimationFrame(loop); cam.x+=(cam.tx-cam.x)*.09; cam.y+=(cam.ty-cam.y)*.09; cam.z+=(cam.tz-cam.z)*.09; if(document.hidden||t-lastDraw<33) return; lastDraw=t; if(A.sim&&cv.parentElement){ VIEW=A.sim.view(); drawVase(t); } }
requestAnimationFrame(loop); window.addEventListener('resize',()=>{ fitCv(); });
function hit(cx0,cy0){ const r=cv.getBoundingClientRect(); const px=(cx0-r.left)*dpr, py=(cy0-r.top)*dpr, W=cv.width, H=cv.height, k=kOf(W,H); const wx=(px-(W/2-cam.x*k))/k, wy=(py-(H*.47-cam.y*k))/k; let best=null,bd=1e9; Object.entries(groups).forEach(([id,g])=>{ const d=Math.hypot(wx-g.x,(wy-g.y)*.75); if(d<g.r+10&&d<bd){ bd=d; best=id; } }); return best; }
function screenOf(id){ const g=groups[id]; if(!g) return null; const r=cv.getBoundingClientRect(), W=cv.width, H=cv.height, k=kOf(W,H); return {x:r.left+(g.x*k+(W/2-cam.x*k))/dpr, y:r.top+(g.y*k+(H*.47-cam.y*k))/dpr}; }
let v3=null, on3=false; const is3=()=>on3&&!!v3;
window.__vase={
  heroH,get cv(){ return is3()?v3.canvas:cv; }, fitCv(){ if(is3()) v3.fit(); else fitCv(); }, setView:v=>{ if(!is3()) VIEW=v; },
  snap(){ if(is3()) return v3.snap?v3.snap():null; try{ const c=document.createElement('canvas'); c.width=c.height=112; const W=cv.width,H=cv.height, s=Math.min(W,H)*.92, sy=Math.max(0,H*.47-s*.5); c.getContext('2d').drawImage(cv,(W-s)/2,sy,s,s,0,0,112,112); return c.toDataURL('image/jpeg',.72); }catch(e){ return null; } },
  zoomTo(f){ if(is3()) v3.zoomTo(f); else zoomTo(f); }, reset(){ if(is3()) v3.reset(); else zoomTo(null); },
  hit(x,y){ return is3()?v3.hit(x,y):hit(x,y); }, screenOf(id){ return is3()?v3.screenOf(id):screenOf(id); },
  fx(k){ if(is3()) v3.fx(k); }, bubble(id,emoji){ if(is3()) v3.bubble(id,emoji); else bubbles.push({id,emoji,t0:performance.now()}); },
  get groups(){ return is3()?v3.groups():groups; }, get is3d(){ return is3(); }, cam, isNight, get anim(){ return anim; },
  async set3d(on){ if(!on){ on3=false; if(v3) v3.stop(); return false; } if(window.__no3d) return false; try{ if(!window.__v3dLoad) return false; v3=await window.__v3dLoad(); on3=true; v3.start(); return true; }catch(e){ console.warn('3D non disponibile',e&&e.message); on3=false; return false; } }
};
})();
