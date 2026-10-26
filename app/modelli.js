/* Modelli di Kimi nel gioco (agente tre-d).
   - carica i GLB incorporati da build_app.py (window.__GLB, base64) con il GLTFLoader di three 0.184 (jsDelivr, stesso import map);
   - conta esatta: ogni individuo della popolazione (Math.round(pop)) è un'istanza; una chiamata di disegno per specie e per livello;
   - livelli di dettaglio a budget di triangoli: close (zoom) · swarm · lod1 · lod2 (vendor/lod, derivati da swarm); la guardia prestazioni abbassa il dettaglio, mai il numero;
   - animazione nel vertex shader con _ANIM/_PIVOT (brief v3 §5.1): idle, walk (treppiede alternato), carry, fight, eat, dead;
   - mutazioni: _EMIT accende il verde #7CF5C8 sugli individui mutati.
   Specie senza GLB (termiti, coleotteri, …) usano ancora i modelli procedurali del pass 1, con lo stesso instancing 1:1. */
window.__MODELLI=function(THREE,env){
'use strict';
const {critG,S,KLEN,camera,viewH,level,anchorOf,kimiGeo,fallbackGeo,SIZE}=env;
const V3=THREE.Vector3, Col=THREE.Color, clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), rnd=(a,b)=>a+Math.random()*(b-a);
const LOADER_URL='https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/loaders/GLTFLoader.js';
const CAP=128;                 // il sim limita pop a 100 per specie
const BUDGET=[64000,36000,20000]; // triangoli per le creature, per livello della guardia prestazioni
const PX={close:64,swarm:30,lod1:11}; // soglie in pixel (altezza del corpo a schermo) per i livelli di dettaglio
const CLOSE_MAX=6;
const EMIT_COL=[0.659,0.545,1.0]; // #A88BFF (viola del sasso: Giovanni, sei-scenari)
// ---------- shader: posa procedurale per parte (brief v3 §5.1) ----------
const VHEAD=`
attribute vec4 aAnim; attribute vec3 aPivot; attribute float aEmit;
attribute vec4 iAnim; attribute float iMut;
uniform float uTime; uniform float uDry;
varying float vEmit;
mat3 aRX(float a){ float c=cos(a),s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
mat3 aRY(float a){ float c=cos(a),s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 aRZ(float a){ float c=cos(a),s=sin(a); return mat3(c,s,0., -s,c,0., 0.,0.,1.); }
void antPose(out vec3 P, out mat3 R){
  vEmit=aEmit*iMut;
  float part=aAnim.x, limb=aAnim.y, side=aAnim.w;
  float ph=iAnim.x, spd=iAnim.y, st=iAnim.z, tw=iAnim.w, t=uTime;
  float kin=min(1.,tw*4.);
  float walk=spd*(1.-.35*uDry);
  float isCarry=step(1.5,st)*step(st,2.5), isFight=step(2.5,st)*step(st,3.5), isEat=step(3.5,st)*step(st,4.5), isDead=step(4.5,st);
  float cyc=6.2832*ph;
  R=mat3(1.);
  if(part==5.){ float k=mod(limb,3.), grp=mod(k+step(0.,side),2.), c=cyc+grp*3.1416;
    float yaw=-side*.5*walk*sin(c);
    float roll=side*max(0.,cos(c))*walk*(.45-.25*uDry);
    float front=(1.-step(.5,k))*isFight*kin; roll+=side*front*(.9+.3*sin(t*18.+side)); yaw-=side*front*.3;
    roll-=side*1.6*isDead*smoothstep(0.,.6,tw);
    R=aRY(yaw)*aRX(roll); }
  else if(part==1.){ float pitch=.04*sin(t*1.3+cyc*.3)+isCarry*kin*.25-isEat*kin*(.3-.08*sin(t*25.))+isFight*kin*.2; R=aRZ(pitch); }
  else if(part==2.){ float s=1.+.03*sin(t*1.5+cyc*.2); R=mat3(s)*aRZ(-.3*isFight*kin); }
  else if(part==3.){ float yaw=side*(.22*sin(t*3.5+cyc+side)+.12*sin(t*5.3+cyc*.5)), pitch=.1*sin(t*2.7+cyc)+isFight*kin*.3; R=aRY(yaw)*aRZ(pitch); }
  else if(part==4.){ float open=isFight*kin*(.5+.5*sin(t*15.+cyc))*.45+isEat*kin*(.5+.5*sin(t*25.))*.25; R=aRY(side*open); }
  P=aPivot+R*(position-aPivot);
  P.y+=.003*walk*sin(2.*cyc);
  float rear=isFight*kin*.35; if(rear>0.){ vec3 hp=vec3(-.02,0.,0.); mat3 Rr=aRZ(rear); P=hp+Rr*(P-hp); R=Rr*R; }
  float kd=isDead*smoothstep(0.,.6,tw); if(kd>0.){ vec3 c0=vec3(0.,.07,0.); mat3 Rd=aRX(3.1416*kd); P=c0+Rd*(P-c0); R=Rd*R; }
}`;
const VNORMAL=`#define ANT_POSED
vec3 antP; mat3 antR; antPose(antP,antR);
vec3 objectNormal=antR*vec3(normal);
#ifdef USE_TANGENT
vec3 objectTangent=antR*vec3(tangent.xyz);
#endif`;
const VBEGIN=`#ifndef ANT_POSED
vec3 antP; mat3 antR; antPose(antP,antR);
#endif
vec3 transformed=antP;`;
const uni={uTime:{value:0},uDry:{value:0}};
function patch(mat,depth){ mat.onBeforeCompile=sh=>{ sh.uniforms.uTime=uni.uTime; sh.uniforms.uDry=uni.uDry;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+VHEAD).replace('#include <beginnormal_vertex>',VNORMAL).replace('#include <begin_vertex>',VBEGIN);
    if(!depth) sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vEmit; uniform float uTime;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3('+EMIT_COL.join(',')+')*vEmit*(2.6+.8*sin(uTime*3.+vEmit*7.))*vec3(1.,.8+.2*sin(uTime+vEmit*5.),1.);'); };
  mat.customProgramCacheKey=()=>depth?'antDepth':'antStd'; return mat; }
const depthMat=patch(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}),true);
// ---------- caricamento dei GLB incorporati ----------
const GLB=window.__GLB||{}; const models={}; let loaded=false;
function b64buf(s){ const bin=atob(s), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u.buffer; }
function takeMesh(gltf){ let m=null; gltf.scene.traverse(o=>{ if(o.isMesh&&!m) m=o; }); const g=m.geometry; [['_anim','aAnim'],['_pivot','aPivot'],['_emit','aEmit'],['_ANIM','aAnim'],['_PIVOT','aPivot'],['_EMIT','aEmit']].forEach(([a,b])=>{ if(g.attributes[a]){ g.setAttribute(b,g.attributes[a]); g.deleteAttribute(a); } }); g.computeBoundingSphere(); return m; }
const tris=g=>g.index?g.index.count/3:g.attributes.position.count/3;
const ready=(async()=>{ const ids=Object.keys(GLB); if(!ids.length) return; let GL; try{ GL=(await import(LOADER_URL)).GLTFLoader; }catch(e){ console.warn('GLTFLoader non disponibile',e&&e.message); return; }
  const loader=new GL(); const parse=buf=>new Promise((res,rej)=>loader.parse(buf,'',res,rej));
  for(const id of ids){ try{ const set=GLB[id], out={tiers:[]}; let swarmMat=null;
      for(const tier of ['close','swarm','lod1','lod2']){ if(!set[tier]) continue; const m=takeMesh(await parse(b64buf(set[tier]))); let mat=m.material&&m.material.map?m.material:null; const anim=!!m.geometry.attributes.aAnim; if(!anim) out.object=true; if(mat){ mat.side=THREE.FrontSide; if(anim) patch(mat); if(tier==='swarm') swarmMat=mat; } out.tiers.push({name:tier,geo:m.geometry,mat,tris:tris(m.geometry),shadow:tier==='close'||tier==='swarm',px:PX[tier]||0}); }
      out.tiers.forEach(t=>{ if(!t.mat) t.mat=swarmMat||out.tiers.find(q=>q.mat).mat; }); if(!out.tiers.length) continue; models[id]=out; }catch(e){ console.warn('modello Kimi',id,e&&e.message); } }
  loaded=true; })();
// ---------- istanze per specie ----------
const crt={}; const crumbCap=1024, crumbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.014,6,5),new THREE.MeshBasicMaterial({color:0xe8d8a0}),crumbCap); crumbs.count=0; crumbs.frustumCulled=false; crumbs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); critG.add(crumbs);
function mkTier(t,shared){ const g=t.geo.clone(); g.setAttribute('iAnim',new THREE.InstancedBufferAttribute(new Float32Array(CAP*4),4).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('iMut',new THREE.InstancedBufferAttribute(new Float32Array(CAP),1).setUsage(THREE.DynamicDrawUsage));
  const im=new THREE.InstancedMesh(g,t.mat,CAP); im.count=0; im.frustumCulled=false; im.castShadow=!!t.shadow; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); if(t.shadow&&t.anim) im.customDepthMaterial=depthMat; im.setColorAt(0,new Col(1,1,1)); critG.add(im); return {name:t.name,im,tris:t.tris,px:t.px,ia:g.attributes.iAnim,imu:g.attributes.iMut,anim:!!t.anim}; }
function ensure(x){ let c=crt[x.id]; if(c&&(c.kind==='glb'||!models[x.id])) return c; const items=c?c.items:[]; if(c) drop(c);
  let tiers, kind; if(models[x.id]){ kind='glb'; tiers=models[x.id].tiers.map(t=>mkTier({...t,anim:true})); }
  else { kind='pass1'; const geo=kimiGeo(x.id)||fallbackGeo(x.id), glossy=x.id==='coleotteri'; tiers=[mkTier({name:'pass1',geo,mat:new THREE.MeshStandardMaterial({vertexColors:true,roughness:glossy?.3:.72,metalness:glossy?.45:.05}),tris:tris(geo),shadow:true,px:0})]; tiers[0].final=!!geo.userData.final; }
  return crt[x.id]={id:x.id,kind,tiers,items,x,tint:'',final:kind==='glb'||tiers[0].final,len:KLEN[x.id]||.2,dying:0}; }
function drop(c){ c.tiers.forEach(t=>{ critG.remove(t.im); t.im.geometry.dispose(); if(c.kind==='pass1') t.im.material.dispose(); }); delete crt[c.id]; }
function newItem(){ const a=Math.random()*6.283,d=Math.sqrt(Math.random())*.7; return {px:Math.cos(a)*d,pz:Math.sin(a)*d,tx:0,tz:0,nt:0,ph:Math.random()*6.28,gait:Math.random(),spd:0,st:0,tw:0,ang:Math.random()*6.283,carry:false,eat:0}; }
// ---------- sincronizzazione con la vista del sim (ogni 0,25 s) ----------
function sync(v){ const seen=new Set(); v.sp.forEach(x=>{ seen.add(x.id); if(!x.alive){ const c=crt[x.id]; if(c&&!c.dying){ c.dying=S.t||1e-6; c.items.forEach(it=>{ it.st=5; it.tw=0; }); } return; }
    const c=ensure(x); c.x=x; c.dying=0; const n=Math.max(1,Math.round(x.pop)); // conta esatta: un individuo per unità di popolazione
    while(c.items.length<n) c.items.push(newItem()); if(c.items.length>n) c.items.length=n; });
  Object.keys(crt).forEach(id=>{ const c=crt[id]; if(!seen.has(id)||(c.dying&&S.t-c.dying>3)) drop(c); }); }
// ---------- movimento, stati, livelli di dettaglio ----------
const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _p=new V3(), _s=new V3(), _e=new THREE.Euler(), _c=new V3(), cands=[];
function move(dt,t,v,dry){ uni.uTime.value=t; uni.uDry.value=dry||0; const lv=Math.min(2,level()||0); let budget=BUDGET[lv]; cands.length=0; let crumbN=0;
  const H=viewH()||300, kpx=H/(2*Math.tan(camera.fov*Math.PI/360)); _c.copy(camera.position);
  Object.values(crt).forEach(c=>{ const x=c.x, id=c.id, fly=id==='mosche', soc=!!x.society&&!fly, an=soc?anchorOf(id):null, war=!c.dying&&v.wars.find(w=>w.includes(id)), wi=war?war.indexOf(id):0, sp=(fly?.55:.28)*(war?2:1), mut=x.mut||[], mutK=mut.length?Math.min(1.3,.7+.2*mut.length):0, glb=c.kind==='glb';
    const tint=(x.monster?'m':'')+(glb?'':mut.join(',')); if(tint!==c.tint){ c.tint=tint; const col=new Col(1,1,1); if(x.monster) col.multiply(new Col(1,.55,.55)); if(!glb){ if(mut.includes('radioattivo')) col.multiply(new Col(.7,1.2,.7)); if(mut.includes('bioluminescenza')) col.multiply(new Col(.7,1,1.25)); if(mut.includes('velenoso')) col.multiply(new Col(1.1,.7,1.25)); } c.tiers.forEach(tr=>{ for(let i=0;i<CAP;i++) tr.im.setColorAt(i,col); tr.im.instanceColor.needsUpdate=true; }); }
    const sz=(c.final?(1+Math.min(.5,.12*Math.max(0,(x.size||1)-1))):SIZE(x))*(x.monster?1.7:1), vis=c.final?c.len*sz:sz;
    c.items.forEach(it=>{ const dead=it.st===5;
      if(!dead&&t>it.nt){ if(soc){ if(war){ it.tx=(wi?.1:-.1)+rnd(-.1,.1); it.tz=an[1]*.4+rnd(-.12,.12); } else { const edge=Math.random()<.15; it.tx=edge?rnd(-.8,.8):an[0]+rnd(-.28,.28); it.tz=edge?rnd(-.5,.5):an[1]+rnd(-.2,.2); it.carry=!edge&&Math.random()<.4; } } else { const a=Math.random()*6.283,d=Math.sqrt(Math.random())*.78; it.tx=Math.cos(a)*d; it.tz=Math.sin(a)*d; it.carry=false; } it.nt=t+1.5+Math.random()*3.5; it.eat=Math.random()<.3?1:0; }
      const dx=it.tx-it.px, dz=it.tz-it.pz, d=dead?0:Math.hypot(dx,dz)||1, mv=!dead&&d>.02, st0=dead?0:Math.min(d,sp*dt); if(mv){ it.px+=dx/d*st0; it.pz+=dz/d*st0; const rr=Math.hypot(it.px,it.pz); if(rr>.84){ it.px*=.84/rr; it.pz*=.84/rr; } const ta=Math.atan2(dz,dx); let da=ta-it.ang; while(da>Math.PI) da-=6.283; while(da<-Math.PI) da+=6.283; it.ang+=da*Math.min(1,dt*7); }
      // stato: 0 idle · 1 walk · 2 carry · 3 fight · 4 eat · 5 dead
      const st=dead?5:war?3:mv?(it.carry?2:1):(it.eat&&!fly?4:0); if(st!==it.st){ it.st=st; it.tw=0; } it.tw+=dt;
      const tsp=mv?(war?1.6:1)*(1-.3*(dry||0)):0; it.spd+=(tsp-it.spd)*Math.min(1,dt*8); it.gait=(it.gait+dt*4*it.spd)%1;
      const y=fly?S.soilTop+.35+Math.sin(t*1.1+it.ph)*.3:S.soilTop+(glb?0:Math.abs(Math.sin(t*(war?9:4)+it.ph))*(war?.03:.006));
      it.y=y; it.sz=sz; it.mut=mutK;
      if(it.carry&&mv&&!war&&crumbN<crumbCap){ _p.set(it.px,y+vis*.55,it.pz); _m.makeTranslation(_p.x,_p.y,_p.z); crumbs.setMatrixAt(crumbN++,_m); }
      if(c.tiers.length>1){ const dcam=Math.hypot(it.px-_c.x,y-_c.y,it.pz-_c.z); it.pxs=kpx*c.len*sz/Math.max(.05,dcam); cands.push(it); it.c=c; } else { it.c=c; it.tier=0; budget-=c.tiers[0].tris; } });
    c.tiers.forEach(tr=>{ tr.n=0; }); });
  crumbs.count=crumbN; crumbs.instanceMatrix.needsUpdate=true;
  // livelli di dettaglio: i più grandi a schermo prendono il dettaglio migliore finché il budget regge; mai meno individui
  if(cands.length){ cands.sort((a,b)=>b.pxs-a.pxs); let closeN=0; const maxTier=lv===0?0:lv===1?1:2; // indice del livello migliore ammesso (0 close)
    let minSum=0; cands.forEach(it=>{ minSum+=it.c.tiers[it.c.tiers.length-1].tris; });
    cands.forEach(it=>{ const T=it.c.tiers, last=T.length-1, minT=T[last].tris; minSum-=minT; let pick=last; for(let k=Math.min(maxTier,last);k<last;k++){ const tr=T[k]; if(it.pxs<tr.px) continue; if(tr.name==='close'&&closeN>=CLOSE_MAX) continue; if(tr.tris<=budget-minSum){ pick=k; break; } } if(T[pick].name==='close') closeN++; budget-=T[pick].tris; it.tier=pick; }); }
  Object.values(crt).forEach(c=>{ c.items.forEach(it=>{ const tr=c.tiers[it.tier||0], i=tr.n++; _e.set(0,-it.ang,0); _q.setFromEuler(_e); _p.set(it.px,it.y,it.pz); _s.set(it.sz,it.sz,it.sz); _m.compose(_p,_q,_s); tr.im.setMatrixAt(i,_m); tr.ia.setXYZW(i,it.gait,it.spd,it.st,it.tw); tr.imu.setX(i,it.mut); });
    c.tiers.forEach(tr=>{ tr.im.count=tr.n; tr.im.instanceMatrix.needsUpdate=true; tr.ia.needsUpdate=true; tr.imu.needsUpdate=true; }); }); }
// oggetti di Kimi (meteorite): una copia del tier close, materiale proprio (emissiva regolabile dal gioco)
function object(id){ const m=models[id]; if(!m||!m.object) return null; const t=m.tiers.find(q=>q.name==='close')||m.tiers[0]; const mat=t.mat.clone(); const mesh=new THREE.Mesh(t.geo,mat); mesh.geometry.computeBoundingBox(); const o={mesh,mat,tris:t.tris,box:mesh.geometry.boundingBox}; objs[id]=o; return o; }
const objs={};
function stats(){ const o={}; Object.values(crt).forEach(c=>{ o[c.id]={n:c.items.length,kind:c.kind,tiers:{}}; c.tiers.forEach(tr=>{ o[c.id].tiers[tr.name]=tr.n||0; }); }); return o; }
return {crt,sync,move,ready,stats,object,objs,get loaded(){ return loaded; },models};
};
