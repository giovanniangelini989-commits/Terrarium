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
const BUDGET=[48000,30000,18000]; // triangoli per le creature, per livello della guardia prestazioni
const PX={close:100,swarm:30,lod1:11}; // soglie in pixel (altezza del corpo a schermo) per i livelli di dettaglio
const CLOSE_MAX=2;
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
const uni={uTime:{value:0},uDry:{value:0},uCharge:{value:0}};
function patch(mat,depth){ mat.onBeforeCompile=sh=>{ sh.uniforms.uTime=uni.uTime; sh.uniforms.uDry=uni.uDry;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+VHEAD).replace('#include <beginnormal_vertex>',VNORMAL).replace('#include <begin_vertex>',VBEGIN);
    if(!depth) sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vEmit; uniform float uTime;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3('+EMIT_COL.join(',')+')*vEmit*(2.6+.8*sin(uTime*3.+vEmit*7.))*vec3(1.,.8+.2*sin(uTime+vEmit*5.),1.);'); };
  mat.customProgramCacheKey=()=>depth?'antDepth':'antStd'; return mat; }

// ---------- lumaca (modello statico, niente rig): ondulazione del corpo nel vertex shader, guscio fermo ----------
// Pelle mutata = stessa UV, seconda texture (mutata_*.webp) mescolata col valore di mutazione; bagliore viola dalla maschera ripulita (build_app.py)
const SN_VHEAD=`
attribute float aEmit; attribute vec4 iAnim; attribute float iMut;
uniform float uTime;
varying float vMut; varying float vShell; varying vec3 vLoc;`;
const SN_VBEGIN=`vec3 transformed=vec3(position);
vMut=iMut; vShell=aEmit; vLoc=position;
{ float ph=iAnim.x*6.2832, spd=iAnim.y, body=1.-step(.5,aEmit);
  float low=1.-smoothstep(.04,.09,position.y), amp=.5+.5*spd;
  float ar=uTime*(.9+1.3*spd)-position.x*34.+ph;
  transformed.y+=body*low*amp*.0035*sin(ar);
  transformed.x+=body*low*amp*.005*cos(ar);
  float tent=body*smoothstep(.085,.115,position.y)*step(.09,position.x);
  transformed.z+=tent*(position.y-.085)*.9*sin(uTime*1.1+ph+position.y*16.);
  transformed.x+=tent*(position.y-.085)*.5*sin(uTime*.8+ph*1.7); }`;
// spirale del guscio (coordinate locali del modello, asse e centro ricavati dalla geometria del guscio: PCA dei vertici con _EMIT=1; spirale logaritmica, passo 2x per giro)
const SN_SP={close:{c:[-.0602,.0832,.0119],a:[.503,.862,-.061],b:[-.512,.24,-.824],o:[.0033,.0011]},swarm:{c:[-.0499,.0784,.0075],a:[.488,.867,-.101],b:[-.473,.165,-.866],o:[.0033,.0011]}};
const v3=a=>'vec3('+a.join(',')+')';
function patchSnail(mat,tier,tx){ const SP=SN_SP[tier]||SN_SP.close; mat.onBeforeCompile=sh=>{ sh.uniforms.uTime=uni.uTime; sh.uniforms.uMutMap={value:tx.mut}; sh.uniforms.uGlow={value:tx.glow}; sh.uniforms.uCharge=uni.uCharge;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+SN_VHEAD).replace('#include <begin_vertex>',SN_VBEGIN);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vMut; varying float vShell; varying vec3 vLoc; uniform float uTime,uCharge; uniform sampler2D uMutMap,uGlow;')
      .replace('#include <map_fragment>','#include <map_fragment>\n{ float mk=smoothstep(0.,1.,clamp(vMut,0.,1.)); diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(uMutMap,vMapUv).rgb*vec3(.32,.26,.4),mk*.8); }')
.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{ float k=clamp(vMut,0.,1.3), mk=k*k, g0=smoothstep(.5,.95,texture2D(uGlow,vMapUv).r)*step(.5,vShell); vec3 lp=vLoc-'+v3(SP.c)+'; vec2 sq=vec2(dot(lp,'+v3(SP.a)+'),dot(lp,'+v3(SP.b)+'))-vec2('+SP.o.join(',')+'); float sr=length(sq)+1e-5, sph=log(sr)*1.4427-atan(sq.y,sq.x)*.159155, sf=abs(sph-floor(sph+.5)); float sline=smoothstep(.1,.02,sf)*smoothstep(.003,.012,sr)*step(.5,vShell), shalo=smoothstep(.26,.0,sf)*step(.5,vShell)*smoothstep(.003,.02,sr); float g=(max(sline,g0*.35)+shalo*.12)*.36; float fr=pow(1.-abs(dot(normalize(normal),normalize(vViewPosition))),4.); float pl=.85+.15*sin(uTime*1.6+vMapUv.x*9.); vec3 V=vec3(.42,.02,1.), hue=mix(V,mix(vec3(1.,.2,.75),vec3(.15,.6,1.),.5+.5*sin(sph*6.2832+uTime*.7)),smoothstep(.05,.2,sf)*.75*step(.5,vShell)+.1*g0); float ch=.5+.7*uCharge; float sh=step(.5,vShell); totalEmissiveRadiance+=hue*(g*pl*mk*(1.0+1.9*ch)+fr*mk*(sh*.2+(1.-sh)*.9)*ch)*vec3(1.,1.,1.); }'); };
  mat.customProgramCacheKey=()=>'snail_'+tier; return mat; }
function loadTex(b64,srgb){ const t=new THREE.TextureLoader().load('data:image/webp;base64,'+b64); t.flipY=false; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; if(srgb) t.colorSpace=THREE.SRGBColorSpace; return t; }
const depthMat=patch(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}),true);
// ---------- caricamento dei GLB incorporati ----------
const GLB=window.__GLB||{}, GLBX=window.__GLBX||{}; const models={}; let loaded=false;
function b64buf(s){ const bin=atob(s), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u.buffer; }
function takeMesh(gltf){ let m=null; gltf.scene.traverse(o=>{ if(o.isMesh&&!m) m=o; }); const g=m.geometry; [['_anim','aAnim'],['_pivot','aPivot'],['_emit','aEmit'],['_ANIM','aAnim'],['_PIVOT','aPivot'],['_EMIT','aEmit']].forEach(([a,b])=>{ if(g.attributes[a]){ g.setAttribute(b,g.attributes[a]); g.deleteAttribute(a); } }); g.computeBoundingSphere(); return m; }
const tris=g=>g.index?g.index.count/3:g.attributes.position.count/3;
const ready=(async()=>{ const ids=Object.keys(GLB); if(!ids.length) return; let GL; try{ GL=(await import(LOADER_URL)).GLTFLoader; }catch(e){ console.warn('GLTFLoader non disponibile',e&&e.message); return; }
  const loader=new GL(); const parse=buf=>new Promise((res,rej)=>loader.parse(buf,'',res,rej));
  for(const id of ids){ try{ const set=GLB[id], out={tiers:[]}; let swarmMat=null;
      for(const tier of ['close','swarm','lod1','lod2']){ if(!set[tier]) continue; const m=takeMesh(await parse(b64buf(set[tier]))); let mat=m.material&&m.material.map?m.material:null; const anim=!!m.geometry.attributes.aAnim; if(!anim) out.object=true; const sx=GLBX[id]; const snail=!!(sx&&sx['mut_'+tier]&&sx['glow_'+tier]); if(snail&&mat){ mat=mat.clone(); mat.side=THREE.FrontSide; patchSnail(mat,tier,{mut:loadTex(sx['mut_'+tier],true),glow:loadTex(sx['glow_'+tier],false)}); out.object=false; if(tier==='swarm') swarmMat=mat; out.tiers.push({name:tier,geo:m.geometry,mat,tris:tris(m.geometry),shadow:tier==='close',snail:true,px:PX[tier]||0}); continue; }
        if(mat){ mat.side=THREE.FrontSide; if(anim) patch(mat); if(tier==='swarm') swarmMat=mat; } out.tiers.push({name:tier,geo:m.geometry,mat,tris:tris(m.geometry),shadow:false,px:PX[tier]||0}); }
      out.tiers.forEach(t=>{ if(!t.mat) t.mat=swarmMat||out.tiers.find(q=>q.mat).mat; }); if(!out.tiers.length) continue; models[id]=out; }catch(e){ console.warn('modello Kimi',id,e&&e.message); } }
  loaded=true; })();
// ---------- istanze per specie ----------
const crt={}; const crumbCap=1024, crumbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.014,6,5),new THREE.MeshBasicMaterial({color:0xe8d8a0}),crumbCap); crumbs.count=0; crumbs.frustumCulled=false; crumbs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); critG.add(crumbs);
function mkTier(t,shared){ const g=t.geo.clone(); g.setAttribute('iAnim',new THREE.InstancedBufferAttribute(new Float32Array(CAP*4),4).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('iMut',new THREE.InstancedBufferAttribute(new Float32Array(CAP),1).setUsage(THREE.DynamicDrawUsage));
  const im=new THREE.InstancedMesh(g,t.mat,CAP); im.count=0; im.frustumCulled=false; im.castShadow=!!t.shadow; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); if(t.shadow&&t.anim) im.customDepthMaterial=depthMat; im.setColorAt(0,new Col(1,1,1)); critG.add(im); return {name:t.name,im,tris:t.tris,px:t.px,ia:g.attributes.iAnim,imu:g.attributes.iMut,anim:!!t.anim}; }
function ensure(x){ let c=crt[x.id]; if(c&&(c.kind==='glb'||!models[x.id])) return c; const items=c?c.items:[]; if(c) drop(c);
  let tiers, kind; if(models[x.id]){ kind='glb'; tiers=models[x.id].tiers.map(t=>mkTier({...t,anim:!t.snail})); }
  else { kind='pass1'; const geo=kimiGeo(x.id)||fallbackGeo(x.id), glossy=x.id==='coleotteri', wing=x.id==='mosche'; if(!geo.userData.final){ geo.computeBoundingBox(); const ex=geo.boundingBox.max.x-geo.boundingBox.min.x, f=(KLEN[x.id]||.2)/Math.max(.1,ex); geo.scale(f,f,f); geo.userData.final=true; } /* scala reale: lunghezza = KLEN */ tiers=[mkTier({name:'pass1',geo,mat:new THREE.MeshStandardMaterial({vertexColors:true,roughness:glossy?.42:.88,metalness:glossy?.4:.02,transparent:wing,depthWrite:!wing}),tris:tris(geo),shadow:false,px:0})]; tiers[0].final=!!geo.userData.final; }
  return crt[x.id]={id:x.id,kind,tiers,items,x,tint:'',final:kind==='glb'||tiers[0].final,len:KLEN[x.id]||.2,dying:0}; }
function drop(c){ c.tiers.forEach(t=>{ critG.remove(t.im); t.im.geometry.dispose(); if(c.kind==='pass1') t.im.material.dispose(); }); delete crt[c.id]; }
function newItem(){ const a=Math.random()*6.283,d=Math.sqrt(Math.random())*.7; return {px:Math.cos(a)*d,pz:Math.sin(a)*d,tx:0,tz:0,nt:0,ph:Math.random()*6.28,gait:Math.random(),spd:0,st:0,tw:0,ang:Math.random()*6.283,carry:false,eat:0}; }
// ---------- sincronizzazione con la vista del sim (ogni 0,25 s) ----------
function sync(v){ const seen=new Set(); v.sp.forEach(x=>{ seen.add(x.id); if(!x.alive){ const c=crt[x.id]; if(c&&!c.dying){ c.dying=S.t||1e-6; c.items.forEach(it=>{ it.st=5; it.tw=0; }); } return; }
    const c=ensure(x); c.x=x; c.dying=0; const n=Math.max(1,Math.round(x.pop)); // conta esatta: un individuo per unità di popolazione
    while(c.items.length<n) c.items.push(newItem()); if(c.items.length>n) c.items.length=n; });
  Object.keys(crt).forEach(id=>{ const c=crt[id]; if(!seen.has(id)||(c.dying&&S.t-c.dying>3)) drop(c); }); }
// ---------- fisica leggera delle creature (docs/ecologia/fisica-creature.md): cinematica semplice, niente motore fisico ----------
// parete del vetro (lumache, ragni), mosche a scatti che si posano, bava, separazione su griglia, piste e incontri delle formiche
const PROF=[[0,0],[.70,0],[.88,.05],[.97,.18],[1,.4],[1,1.9],[.96,2.08],[.82,2.18]];
function glassR(y){ for(let i=1;i<PROF.length;i++){ if(y<=PROF[i][1]||i===PROF.length-1){ const a=PROF[i-1],b=PROF[i],k=clamp((y-a[1])/Math.max(1e-4,b[1]-a[1])); return a[0]+(b[0]-a[0])*k; } } return 1; }
const WALL_IN=.035, YTOP=1.85, YLID=2.17;
const RAD={formiche:.03,termiti:.03,coleotteri:.07,ragni:.055,lumache:.095,mosche:.045};
const MASS={coleotteri:3,lumache:2,ragni:1.5};
const WP={lumache:{v:.024,turn:.5,crawl:[7,16],pause:[6,30],lo:0,hi:1.8},ragni:{v:.11,turn:3,crawl:[.5,1.4],pause:[30,100],lo:1.15,hi:1.84}};
const trailMat=(add)=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,
  uniforms:{uTime:{value:0},uPx:{value:600},uLife:{value:add?420:240},uK:{value:add?.5:.2},uCol:{value:add?new Col(.62,.78,.95):new Col(.7,.74,.76)}},
  vertexShader:`attribute vec3 aAux; uniform float uTime,uPx,uLife; varying float vK; varying vec3 vW;
  void main(){ float age=uTime-aAux.x; float k=1.-age/uLife; vK=k; vW=position; vec4 mv=modelViewMatrix*vec4(position,1.);
    gl_Position=projectionMatrix*mv; gl_PointSize=k>0.?aAux.y*(.55+.45*k)*uPx/max(.05,-mv.z):0.; }`,
  fragmentShader:`uniform float uTime,uK; uniform vec3 uCol; varying float vK; varying vec3 vW;
  void main(){ if(vK<=0.) discard; float d=length(gl_PointCoord-.5)*2.; float a=1.-smoothstep(.25,1.,d);
    float sp=pow(max(0.,sin(vW.x*95.+vW.y*61.+uTime*.5)*sin(vW.z*83.-vW.y*47.+uTime*.3)),5.);
    float fade=pow(vK,1.4); gl_FragColor=vec4(uCol*(1.+2.5*sp),a*uK*fade); }`});
function mkTrail(n,add){ const g=new THREE.BufferGeometry(); const pos=new Float32Array(n*3), aux=new Float32Array(n*3); for(let i=0;i<n;i++) aux[i*3]=-1e9;
  g.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aAux',new THREE.BufferAttribute(aux,3).setUsage(THREE.DynamicDrawUsage));
  const m=trailMat(add), p=new THREE.Points(g,m); p.frustumCulled=false; p.renderOrder=add?5:2; critG.add(p); return {p,g,m,pos,aux,n,i:0,dirty:false}; }
const trG=mkTrail(2048,true), trS=mkTrail(1024,false);
function emit(T,x,y,z,t,size){ const i=T.i; T.pos[i*3]=x; T.pos[i*3+1]=y; T.pos[i*3+2]=z; T.aux[i*3]=t; T.aux[i*3+1]=size; T.i=(i+1)%T.n; T.dirty=true; }
const _f=new V3(), _n=new V3(), _z=new V3(), _bm=new THREE.Matrix4(), _qa=new THREE.Quaternion(), _qb=new THREE.Quaternion(), _eu=new THREE.Euler(), UP=new V3(0,1,0), XA=new V3(1,0,0);
function basis(q,f,n){ _f.copy(f).addScaledVector(n,-f.dot(n)).normalize(); _z.crossVectors(_f,n); _bm.makeBasis(_f,n,_z); q.setFromRotationMatrix(_bm); return q; }
const wrap=a=>{ while(a>Math.PI) a-=6.2832; while(a<-Math.PI) a+=6.2832; return a; };
const ease=k=>{ k=clamp(k); return k*k*(3-2*k); };
const HASH=new Map(), CELL=.18;
function sepPairs(list,getX,getY,setXY,t){ // separazione su griglia: cella .18, un raggio per specie, i pesanti spostano meno
  HASH.clear(); list.forEach((it,ix)=>{ it.hx=ix; const k=((Math.floor(getX(it)/CELL)+40)<<8)+(Math.floor(getY(it)/CELL)+40); const a=HASH.get(k); if(a) a.push(it); else HASH.set(k,[it]); });
  list.forEach(it=>{ const x=getX(it), y=getY(it), cx=Math.floor(x/CELL), cz=Math.floor(y/CELL); const ra=(RAD[it.id_]||.04)*it.sz;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const a=HASH.get(((cx+i+40)<<8)+(cz+j+40)); if(!a) continue;
      for(const o of a){ if(o.hx<=it.hx) continue; const x1=getX(it), y1=getY(it), ox=getX(o), oy=getY(o); let dx=ox-x1, dy=oy-y1; const d=Math.hypot(dx,dy)||1e-4, mn=ra+(RAD[o.id_]||.04)*o.sz; if(d>=mn) continue;
        const ma=MASS[it.id_]||1, mb=MASS[o.id_]||1, g=(it.id_==='lumache'||o.id_==='lumache')?.25:.8, ov=(mn-d)*g; dx/=d; dy/=d;
        setXY(it,x1-dx*ov*mb/(ma+mb),y1-dy*ov*mb/(ma+mb)); setXY(o,ox+dx*ov*ma/(ma+mb),oy+dy*ov*ma/(ma+mb)); it.push=(it.push||0)+ov; o.push=(o.push||0)+ov;
        if(it.id_==='formiche'&&o.id_==='formiche'&&t>(it.cool||0)&&t>(o.cool||0)&&d<mn*1.25){ const dot=Math.cos(it.ang)*Math.cos(o.ang)+Math.sin(it.ang)*Math.sin(o.ang);
          if(dot<-.2){ const h=t+rnd(.7,1.3); it.hold=o.hold=h; it.holdSt=o.holdSt=4; it.cool=o.cool=h+6; if(!!it.carry!==!!o.carry&&Math.random()<.6){ const c=it.carry; it.carry=o.carry; o.carry=c; } } } } } }); }
let _pistaF=null, pxK=600, _dt=.016;
function physics(dt,t,v,dry){
  _dt=dt; const obs=env.obstacles?env.obstacles():[]; const st0=S.soilTop||.2;
  trG.m.uniforms.uTime.value=trS.m.uniforms.uTime.value=t; trG.m.uniforms.uPx.value=trS.m.uniforms.uPx.value=pxK; trG.m.uniforms.uLife.value=420*(1-.5*(dry||0)); trS.m.uniforms.uLife.value=240*(1-.5*(dry||0));
  const all=[]; Object.values(crt).forEach(c=>{ if(c.dying) return; c.items.forEach(it=>{ if(it.hid||it.st===5) return; it.id_=c.id; if(it.mode===undefined){ it.mode=0; it.blend=1; } all.push(it); }); });
  const flies=all.filter(i=>i.id_==='mosche'), ground=[], wall=[]; ahTick(dt,t,v,st0); webTick(dt,t,all); wUni.uPx.value=pxK;
  all.forEach(it=>{ const id=it.id_; if(id==='mosche'){ flyLife(it,dt,t,obs,all,st0); return; }
    if(it.mode===0&&(id==='lumache'||id==='ragni')) toWall(it,t,st0,id);
    if(id==='formiche'&&it.dig===undefined) it.dig=Math.random()<.3;
    if(it.mode===6){ tunLife(it,dt,t); if(it.mode===6) return; }
    if(it.mode===1){ wallLife(it,dt,t,id,st0,flies); wall.push(it); } else { ground.push(it); if(id==='formiche'){ if(!it.goH) pista(it,t,v,obs); if(it.dig) digGo(it,t); } if(id==='coleotteri') flip(it,dt,t); } });
  ground.forEach(it=>{ if(it.hold>t){ if(it.opx!==undefined){ it.px=it.opx; it.pz=it.opz; } it.st=it.holdSt||0; it.spd*=.5; } it.push=0; });
  sepPairs(ground,i=>i.px,i=>i.pz,(i,x,z)=>{ i.px=x; i.pz=z; },t);
  ground.forEach(it=>{ const ra=(RAD[it.id_]||.04)*it.sz; for(const ob of obs){ const dx=it.px-ob.x, dz=it.pz-ob.z, d=Math.hypot(dx,dz)||1e-4, mn=ob.r+ra; if(d<mn){ it.px=ob.x+dx/d*mn; it.pz=ob.z+dz/d*mn; it.push+=mn-d; } }
    const rr=Math.hypot(it.px,it.pz); if(rr>.84){ it.px*=.84/rr; it.pz*=.84/rr; }
    if(it.push>.004){ it.stuck=(it.stuck||0)+1; if(it.stuck>30){ it.stuck=0; if(it.nt<1e8) it.nt=0; else it.lane=rnd(-.08,.08); } } else if(it.stuck>0) it.stuck--;
    if(it.id_==='lumache'&&it.mode===0&&it.spd>.15){ const dx=it.px-(it.lx||0), dz=it.pz-(it.lz||0); if(dx*dx+dz*dz>.015*.015){ it.lx=it.px; it.lz=it.pz; emit(trS,it.px,st0+.03,it.pz,t,.08*it.sz); } }
    it.opx=it.px; it.opz=it.pz; });
  sepPairs(wall,i=>i.th*.97,i=>i.wy,(i,u,y)=>{ i.th=u/.97; i.wy=y; },t);
  wall.forEach(it=>{ wallPose(it); });
  all.forEach(it=>{ if(it.mode===0&&it.blend<1) groundBlend(it,dt); });
  [trG,trS].forEach(T=>{ if(T.dirty){ T.g.attributes.position.needsUpdate=true; T.g.attributes.aAux.needsUpdate=true; T.dirty=false; } });
}
// ---- lumache e ragni sulla parete ----
function toWall(it,t,st0,id){
  if(id==='ragni'){ it.th=Math.random()*6.283; it.wy=rnd(1.2,1.8); it.al=0; it.gy=it.wy; it.crawl=0; it.wend=t+rnd(5,60); it.mode=1; it.blend=1; return; }
  if(!it.clT) it.clT=t+rnd(20,80);
  if(!it.goW&&t>it.clT){ it.goW=1; const a=Math.atan2(it.pz,it.px); it.tx=Math.cos(a)*.95; it.tz=Math.sin(a)*.95; it.nt=t+90; it.clT=t+90; }
  if(it.goW&&(Math.hypot(it.px,it.pz)>.8||t>it.clT)){ if(t>it.clT){ it.goW=0; it.clT=t+rnd(30,90); return; }
    it.goW=0; it.from=new V3(it.px,it.y,it.pz); it.fromQ=new THREE.Quaternion().setFromEuler(_eu.set(0,-it.ang,0,'XYZ')); it.th=Math.atan2(it.pz,it.px); it.wy=st0+.01; it.al=0; it.gy=rnd(st0+.5,1.8); it.crawl=1; it.wend=t+rnd(8,15); it.mode=1; it.blend=0; it.clT=t+rnd(60,200); } }
function wallLife(it,dt,t,id,st0,flies){
  const P=WP[id];
  if(t>it.wend){ if(it.crawl){ it.crawl=0; it.wend=t+rnd(P.pause[0],P.pause[1]); } else { it.crawl=1; it.wend=t+rnd(P.crawl[0],P.crawl[1]); if(Math.random()<.5) it.gy=rnd(Math.max(P.lo,st0+.1),P.hi); } }
  let v=0, hunt=false;
  if(id==='ragni'&&t>(it.hcool||0)){ let best=null,bd=.6; for(const f of flies){ if(!f.surf||f.surf.k!=='g'||!(f.mode===3||(f.mode===4&&f.tweb&&f.tweb===webs[it.web]))) continue; const du=wrap(f.surf.th-it.th)*.97, dy=f.surf.y-it.wy, d=Math.hypot(du,dy); if(d<bd){ bd=d; best=f; it.hu=du; it.hy=dy; } }
    if(best){ hunt=true; it.crawl=1; it.wend=t+.3; it.al+=wrap(Math.atan2(it.hu,it.hy)-it.al)*Math.min(1,dt*12); v=bd>.07?.5:0; if(bd<=.07){ if(best.mode===4){ best.mode=5; best.wrapT=t+rnd(25,50); it.hcool=t+6; } else it.hcool=t+25; it.crawl=0; it.wend=t+rnd(10,40); } } }
  if(id==='ragni') webLife(it,t,dt);
  if(it.crawl&&!hunt&&id==='ragni'&&it.web>=0){ const w=webs[it.web]; if(!it.wo||t>it.wot){ it.wo=[rnd(-1,1)*w.rho*w.prog*.6,rnd(-1,1)*w.rho*w.prog*.6]; it.wot=t+rnd(1,4); } const du=wrap(w.th-it.th)*.97+it.wo[0], dy=w.y-it.wy+it.wo[1]; it.al+=wrap(Math.atan2(du,dy)-it.al)*Math.min(1,dt*P.turn); v=Math.hypot(du,dy)>.03?P.v:0; }
  else if(it.crawl&&!hunt){ const tg=(it.wy<it.gy?0:Math.PI)+Math.sin(t*.23+it.ph)*(id==='lumache'?.7:.25); it.al+=wrap(tg-it.al)*Math.min(1,dt*P.turn); v=P.v*(id==='lumache'?(.55+.45*Math.sin(t*5.2+it.ph*3)):1); }
  it.th+=Math.sin(it.al)*v*dt/.97; it.wy+=Math.cos(it.al)*v*dt;
  const hi=id==='ragni'?P.hi:YTOP; if(it.wy>hi){ it.wy=hi; it.gy=rnd(.6,hi-.15); }
  if(it.wy<st0+.005){ if(id==='lumache'&&Math.cos(it.al)<0){ // ritorno sulla terra
      const a=it.th, R=glassR(st0)-WALL_IN; it.from=new V3(Math.cos(a)*R,st0,Math.sin(a)*R); it.fromQ=basis(new THREE.Quaternion(),new V3(-Math.sin(a)*Math.sin(it.al),Math.cos(it.al),Math.cos(a)*Math.sin(it.al)),new V3(-Math.cos(a),0,-Math.sin(a)));
      it.mode=0; it.px=Math.cos(a)*.84; it.pz=Math.sin(a)*.84; it.tx=Math.cos(a)*.6; it.tz=Math.sin(a)*.6; it.nt=t+4; it.ang=Math.atan2(-Math.sin(a),-Math.cos(a)); it.blend=0; it.clT=t+rnd(60,200); return; }
    it.wy=st0+.005; it.gy=rnd(st0+.5,1.8); }
  it.spd+=((v>0?(id==='ragni'?1.6:.45+.55*(v/P.v)):0)-it.spd)*Math.min(1,dt*3); it.st=v>0?1:0; it.gait=(it.gait+dt*(id==='ragni'?5:1.6)*it.spd)%1;
  if(id==='lumache'&&v>0){ const u=it.th*.97, dx=u-(it.lu||0), dy=it.wy-(it.ly||0); if(dx*dx+dy*dy>.016*.016){ it.lu=u; it.ly=it.wy; const R=glassR(it.wy)-.028; emit(trG,Math.cos(it.th)*R,it.wy,Math.sin(it.th)*R,t,.085*it.sz); } }
}
function wallPose(it){ const c=Math.cos(it.th), s=Math.sin(it.th), R=glassR(it.wy)-WALL_IN;
  const f=new V3(-s*Math.sin(it.al),Math.cos(it.al),c*Math.sin(it.al)), n=new V3(-c,0,-s); it.q=basis(it.q||new THREE.Quaternion(),f,n);
  const p=new V3(c*R,it.wy,s*R); if(it.blend<1){ const e=ease(it.blend); it.blend+=_dt/2.5; p.lerpVectors(it.from,p,e); it.q.slerpQuaternions(it.fromQ,it.q,e); }
  it.px=p.x; it.pz=p.z; it.y=p.y; it.ang=Math.atan2(f.z,f.x); }
function groundBlend(it,dt){ it.blend+=dt/2.5; const e=ease(it.blend); const q=new THREE.Quaternion().setFromEuler(_eu.set(0,-it.ang,0,'XYZ'));
  const p=new V3(it.px,it.y,it.pz); p.lerpVectors(it.from,p,e); it.q=(it.q||new THREE.Quaternion()).slerpQuaternions(it.fromQ,q,e); it.px=p.x; it.pz=p.z; it.y=p.y; if(it.blend>=1) it.q=null; }
// ---- formiche: piste e fila ----
function pista(it,t,v,obs){ if(v.wars.some(w=>w.includes('formiche'))){ if(it.nt>1e8) it.nt=0; return; }
  const A=anchorOf('formiche'); if(!_pistaF||_pistaF.a!==A){ let a=Math.atan2(A[1],A[0])+2.3, r=.55; let F=[Math.cos(a)*r,Math.sin(a)*r]; for(let k=0;k<8;k++){ if(!obs.some(o=>Math.hypot(F[0]-o.x,F[1]-o.z)<o.r+.12)) break; a+=.5; F=[Math.cos(a)*r,Math.sin(a)*r]; } _pistaF={a:A,F}; }
  const F=_pistaF.F; if(it.leg===undefined){ it.leg=Math.random()<.5?0:1; it.lane=rnd(-.03,.03); } it.nt=1e9;
  const tg=it.leg?A:F, dx=tg[0]-it.px, dz=tg[1]-it.pz, d=Math.hypot(dx,dz)||1;
  if(d<.07){ it.leg^=1; it.carry=it.leg===1; }
  it.tx=tg[0]-dz/d*it.lane; it.tz=tg[1]+dx/d*it.lane; }
// ---- coleotteri: ogni tanto si ribaltano e si dimenano ----
function flip(it,dt,t){ if(!it.flT) it.flT=t+rnd(90,420);
  if(!it.fl&&t>it.flT&&it.mode===0) it.fl=t;
  if(it.fl){ const T=t-it.fl; let r=0; if(T<.6) r=Math.PI*ease(T/.6); else if(T<4.3) r=Math.PI; else if(T<5) r=Math.PI*(1-ease((T-4.3)/.7)); else { it.fl=0; it.flT=t+rnd(200,600); it.q=null; return; }
    if(T>.6&&T<4.3){ if(it.opx!==undefined){ it.px=it.opx; it.pz=it.opz; } it.st=1; it.spd=1.6; it.gait=(it.gait+dt*4)%1; }
    _qa.setFromAxisAngle(UP,-it.ang); _qb.setFromAxisAngle(XA,r+(T>.6&&T<4.3?.35*Math.sin(t*9):0)); it.q=(it.q||new THREE.Quaternion()).copy(_qa).multiply(_qb); it.y+=.03*Math.sin(r/2); } }
// ---- mosche: scatti, posa, camminata, pulizia, fuga ----
function pickPerch(obs,st0){ const r=Math.random(), P=new V3(), n=new V3();
  const O=obs.filter(o=>o.t==='o'), Pl=obs.filter(o=>o.t==='p'), none=!O.length&&!Pl.length;
  if(r<.4||(none&&r<.7)){ const th=Math.random()*6.283, y=rnd(st0+.2,1.8), R=glassR(y)-.04; P.set(Math.cos(th)*R,y,Math.sin(th)*R); n.set(-Math.cos(th),0,-Math.sin(th)); return {k:'g',P,n,th,y}; }
  if(r<.55||none){ const a=Math.random()*6.283, rr=Math.sqrt(Math.random())*.65; P.set(Math.cos(a)*rr,YLID+.01,Math.sin(a)*rr); n.set(0,-1,0); return {k:'l',P,n}; }
  if((r<.8&&O.length)||!Pl.length){ const o=O[Math.random()*O.length|0], a=Math.random()*6.283; P.set(o.x+Math.cos(a)*o.r*.5,o.h+.005,o.z+Math.sin(a)*o.r*.5); n.set(0,1,0); return {k:'s',P,n}; }
  const o=Pl[Math.random()*Pl.length|0]; P.set(o.x+rnd(-.04,.04),o.h*.9,o.z+rnd(-.04,.04)); n.set(0,1,0); return {k:'f',P,n}; }
function flyLife(it,dt,t,obs,all,st0){
  if(!it.P){ it.P=new V3(it.px,st0+.4,it.pz); it.V=new V3(); it.mode=2; it.nh=0; it.land=null; it.jit=Math.random()*6; it.ph3=0; it.sub=0; }
  const P=it.P, V=it.V;
  if(it.mode===4||it.mode===5){ const S4=it.surf; if((it.mode===4&&t>it.trapEnd)||(it.mode===5&&t>it.wrapT)){ it.mode=2; P.copy(it.tp); V.set(rnd(-1,1),rnd(0,1),rnd(-1,1)).addScaledVector(S4.n,1.2).normalize().multiplyScalar(1.2); it.nh=t+.3; it.land=null; it.noland=t+4; it.tweb=null; it.surf=null; }
    else { const jx=it.mode===4?.005*Math.sin(t*70+it.jit):0; P.copy(it.tp); it.px=P.x+jx; it.pz=P.z; it.y=P.y+(it.mode===4?.004*Math.sin(t*53):0); basis(_qa,S4.f,S4.n); if(it.mode===4){ _qb.setFromEuler(_eu.set(0,0,.2*Math.sin(t*40),'XYZ')); _qa.multiply(_qb); } it.q=(it.q||new THREE.Quaternion()).copy(_qa); it.st=it.mode===4?1:0; it.spd=it.mode===4?1.5:0; it.gait=(it.gait+dt*10)%1; return; } }
  if(it.mode===3){ const S3=it.surf; let flee=false;
    for(const o of all){ if(o.id_==='mosche') continue; const dx=o.px-P.x, dy=o.y-P.y, dz=o.pz-P.z; if(dx*dx+dy*dy+dz*dz<.2*.2&&(o.spd>.2||o.id_==='ragni')){ flee=true; break; } }
    if(flee||t>it.leave){ it.mode=2; V.set(rnd(-1,1),rnd(.2,1),rnd(-1,1)).addScaledVector(S3.n,1.2).normalize().multiplyScalar(1.5); it.nh=t+.25; it.land=null; it.noland=t+rnd(1,3); it.surf=null; }
    else { if(t>it.sub){ it.ph3=it.ph3===0?(Math.random()<.5?1:2):0; it.sub=t+(it.ph3===1?rnd(.4,1):it.ph3===2?rnd(1,2.2):rnd(1,4)); if(it.ph3===1) it.fdir=Math.random()*6.283; }
      const n=S3.n; if(it.ph3===1){ _n.copy(S3.f).applyAxisAngle(n,it.fdir-S3.fd0); _n.addScaledVector(n,-_n.dot(n)).normalize(); S3.f.copy(_n); P.addScaledVector(_n,.1*dt); S3.fd0=it.fdir;
        if(S3.k==='g'){ const th=Math.atan2(P.z,P.x), R=glassR(P.y)-.04; P.x=Math.cos(th)*R; P.z=Math.sin(th)*R; S3.th=th; S3.y=P.y; S3.n.set(-Math.cos(th),0,-Math.sin(th)); } }
      basis(_qa,S3.f,S3.n); if(it.ph3===2){ _qb.setFromEuler(_eu.set(0,0,.14*Math.sin(t*30),'XYZ')); _qa.multiply(_qb); }
      it.q=(it.q||new THREE.Quaternion()).copy(_qa); it.px=P.x; it.pz=P.z; it.y=P.y; it.st=it.ph3===1?1:0; it.spd=it.ph3===1?.35:0; it.gait=(it.gait+dt*it.spd*3)%1; it.ang=Math.atan2(S3.f.z,S3.f.x); return; } }
  if(t>it.nh){ it.nh=t+rnd(.15,.65);
    if(!it.land&&t>(it.noland||0)&&Math.random()<.22) it.land=pickPerch(obs,st0);
    let tg; if(it.land) tg=it.land.P; else { const a=Math.random()*6.283, r=Math.sqrt(Math.random())*.8; tg=new V3(Math.cos(a)*r,rnd(st0+.15,2.05),Math.sin(a)*r); }
    _n.copy(tg).sub(P); const d=_n.length(); _n.normalize(); if(it.land){ V.copy(_n).multiplyScalar(Math.min(1.8,2+d)); it.nh=t+clamp(d/1.2,.1,.5); } else V.copy(_n).multiplyScalar(rnd(.8,1.7)); }
  P.addScaledVector(V,dt); V.multiplyScalar(Math.exp(-dt*(it.land?2.2:3.6)));
  if(it.land){ const L=it.land; if(P.distanceTo(L.P)<.06){ it.mode=3; it.surf={k:L.k,n:L.n.clone(),th:L.th,y:L.y,f:new V3(rnd(-1,1),L.k==='g'?1:0,rnd(-1,1)).normalize(),fd0:0}; P.copy(L.P); V.set(0,0,0); it.leave=t+rnd(3,14); it.sub=t+rnd(.5,1.5); it.ph3=0; it.fdir=0; it.land=null; } }
  const rr=Math.hypot(P.x,P.z), rmax=glassR(clamp(P.y,.2,2.1))-.07; if(it.mode===2&&!it.land&&rr>rmax){ P.x*=rmax/rr; P.z*=rmax/rr; V.x*=-.5; V.z*=-.5; }
  if(P.y>YLID-.02&&!it.land){ P.y=YLID-.02; V.y=-Math.abs(V.y); } if(P.y<st0+.05){ P.y=st0+.05; V.y=Math.abs(V.y); }
  if(it.mode===2&&!it.land) for(const o of obs){ const dx=P.x-o.x, dz=P.z-o.z, d=Math.hypot(dx,dz)||1e-4, mn=o.r+.04; if(d<mn&&P.y<o.h+.03){ P.x=o.x+dx/d*mn; P.z=o.z+dz/d*mn; } }
  if(it.mode===2&&!it.land&&webTrap(it,t,P)) return;
  const sp=V.length(); if(sp>.05) it.ang+=wrap(Math.atan2(V.z,V.x)-it.ang)*Math.min(1,dt*18);
  it.px=P.x; it.pz=P.z; it.y=P.y+Math.sin(t*95+it.jit)*.006; it.st=1; it.spd=1.4; it.gait=(it.gait+dt*14)%1; _eu.set(.12*Math.sin(t*70+it.jit),-it.ang,-clamp(sp*.12,0,.3),'YXZ'); it.q=(it.q||new THREE.Quaternion()).setFromEuler(_eu); }
// ---------- formicaio: gallerie dipinte sulla parete del terriccio, cumuli e fori in superficie, formiche che scavano ----------
const AH={W:2048,H:256,Y0:.2,Y1:1.0,len:0,paintLen:-1,paintTop:-1,paintT:0,ents:[],built:false,top:.3,pop:0};
const AH_ARC=2*Math.PI*.95, AH_VS=.4, AH_MAX=4.2;
const ahCanvas=document.createElement('canvas'); ahCanvas.width=AH.W; ahCanvas.height=AH.H; const ahCtx=ahCanvas.getContext('2d');
const ahTex=new THREE.CanvasTexture(ahCanvas); ahTex.colorSpace=THREE.SRGBColorSpace; ahTex.wrapS=THREE.RepeatWrapping; ahTex.anisotropy=4;
const ahMesh=new THREE.Mesh(new THREE.CylinderGeometry(.953,.953,AH.Y1-AH.Y0,96,1,true),new THREE.MeshStandardMaterial({map:ahTex,transparent:true,roughness:1,metalness:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
ahMesh.position.y=(AH.Y0+AH.Y1)/2; ahMesh.renderOrder=1; ahMesh.visible=false; critG.add(ahMesh);
const moundMat=new THREE.MeshStandardMaterial({color:0x4a3624,roughness:1}), holeMat=new THREE.MeshBasicMaterial({color:0x0c0705});
const mounds=[]; for(let i=0;i<3;i++){ const m=new THREE.Mesh(new THREE.SphereGeometry(1,8,5),moundMat), h=new THREE.Mesh(new THREE.CircleGeometry(1,10),holeMat); h.rotation.x=-Math.PI/2; m.visible=h.visible=false; m.castShadow=false; critG.add(m,h); mounds.push({m,h}); }
function ahBuild(){ let seed=11; const r=()=>(seed=(seed*16807)%2147483647)/2147483647; AH.ents=[-.45,.08,.5].map(u0=>{ const br=[];
    const mk=(u,f,a,n,step,side)=>{ const pts=[[u,f]]; for(let i=0;i<n;i++){ a+=(r()-.5)*.55; if(f>.92) a=a>0?1.3:-1.3; f=Math.min(1,f+Math.cos(a)*step/AH_VS); u+=Math.sin(a)*step; pts.push([u,f]); } const cum=[0]; for(let i=1;i<pts.length;i++) cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],(pts[i][1]-pts[i-1][1])*AH_VS)); return {pts,cum,total:cum[cum.length-1],ch:.05+r()*.04}; };
    const main=mk(u0,0,(r()-.5)*.5,14,.05); br.push(main);
    [.45,.75].forEach((k,i)=>{ const j=Math.round(k*(main.pts.length-1)), p=main.pts[j]; br.push(mk(p[0],p[1],(i?1:-1)*(1.0+r()*.4),8,.05)); });
    return {u0,br,total:br.reduce((s,b)=>s+b.total,0)}; }); AH.built=true; }
const ahY=(f,top)=>top-.02-f*Math.max(.05,top-AH.Y0-.07);
function ahAt(b,s){ s=clamp(s,0,b.total); let i=1; while(i<b.cum.length-1&&b.cum[i]<s) i++; const k=(s-b.cum[i-1])/Math.max(1e-5,b.cum[i]-b.cum[i-1]), a=b.pts[i-1], c=b.pts[i]; return {u:a[0]+(c[0]-a[0])*k,f:a[1]+(c[1]-a[1])*k,du:c[0]-a[0],df:(c[1]-a[1])*AH_VS}; }
function ahPaint(top,t){ const c=ahCtx; c.clearRect(0,0,AH.W,AH.H); const X=u=>((u/AH_ARC)%1+1)%1*AH.W, Y=y=>(AH.Y1-y)/(AH.Y1-AH.Y0)*AH.H, per=AH.len/AH.ents.length, WD=clamp((top-AH.Y0)*110,6,11); c.lineCap='round'; c.lineJoin='round';
  const strokes=(pts,wd,col)=>{ c.strokeStyle=col; c.lineWidth=wd; [-1,0,1].forEach(o=>{ c.beginPath(); pts.forEach((p,i)=>{ const x=X(p[0])+o*AH.W, y=Y(p[1]); if(i) c.lineTo(x,y); else c.moveTo(x,y); }); c.stroke(); }); };
  const ell=(u,y,rx,ry,col)=>{ c.fillStyle=col; [-1,0,1].forEach(o=>{ c.beginPath(); c.ellipse(X(u)+o*AH.W,Y(y),rx,ry,0,0,6.2832); c.fill(); }); };
  AH.ents.forEach(e=>{ let left=per; e.br.forEach(b=>{ if(left<=0) return; const s=Math.min(left,b.total); left-=s; const pts=[]; for(let i=0;i<=24;i++){ const a=ahAt(b,s*i/24); pts.push([a.u,ahY(a.f,top)]); }
      b._p=pts; b._full=s>=b.total-1e-3; });
    e.br.forEach(b=>{ if(!b._p||b._p.length<2) return; strokes(b._p,WD+5,'rgba(170,135,95,.5)'); });
    e.br.forEach(b=>{ if(!b._p) return; if(b._full){ const p=b._p[b._p.length-1]; ell(p[0],p[1],b.ch*343*.8+WD*.5+4,WD*.8+4,'rgba(170,135,95,.5)'); } });
    e.br.forEach(b=>{ if(!b._p||b._p.length<2) return; strokes(b._p,WD,'rgba(16,9,5,.94)'); });
    e.br.forEach(b=>{ if(!b._p) return; if(b._full){ const p=b._p[b._p.length-1]; ell(p[0],p[1],b.ch*343*.8,WD*.8,'rgba(16,9,5,.94)'); } }); e.br.forEach(b=>{ b._p=null; }); });
  ahTex.needsUpdate=true; AH.paintLen=AH.len; AH.paintTop=top; AH.paintT=t; }
function ahTick(dt,t,v,top){ const fm=crt.formiche, pop=fm&&fm.x&&fm.x.alive!==false?Math.max(0,fm.x.pop||0):0; AH.pop=pop; AH.top=top;
  if(!AH.built) ahBuild(); const vis=pop>0&&top-AH.Y0>.05; ahMesh.visible=vis; const Rm=AH_MAX*clamp(.25+pop/12,0,1);
  const days=v.d||v.day||0; AH.len=Math.max(AH.len,Math.min(Rm,days*.05*clamp(pop/8,0,1))); AH.len=Math.min(Rm,AH.len+dt*.0006*pop);
  if(vis&&(Math.abs(AH.len-AH.paintLen)>.03||Math.abs(top-AH.paintTop)>.02)&&t-AH.paintT>3) ahPaint(top,t);
  AH.ents.forEach((e,i)=>{ const q=mounds[i], on=vis&&AH.len>.05, th=e.u0/.95, k=clamp(AH.len/AH.ents.length/1.2); q.m.visible=q.h.visible=on; if(!on) return;
    q.m.position.set(Math.sin(th)*.89,top+.008,Math.cos(th)*.89); q.m.scale.set(.03+.05*k,.012+.02*k,.03+.05*k); q.h.position.set(Math.sin(th)*.89,top+.016+.02*k,Math.cos(th)*.89); q.h.scale.setScalar(.018+.012*k); }); }
function digGo(it,t){ const fm=AH.len>.2&&AH.top-AH.Y0>.05; if(!fm||it.nt<-1) return; if(!it.dnt) it.dnt=t+rnd(6,25);
  if(!it.goH&&t>it.dnt){ it.goH=1; it.he=Math.random()*AH.ents.length|0; it.dgo=t+70; }
  if(it.goH){ const e=AH.ents[it.he], th=e.u0/.95, hx=Math.sin(th)*.89, hz=Math.cos(th)*.89; it.tx=hx; it.tz=hz; it.nt=1e9; it.carry=false;
    if(Math.hypot(it.px-hx,it.pz-hz)<.07){ const b=e.br[0], per=AH.len/AH.ents.length; it.goH=0; it.mode=6; it.from=new V3(it.px,it.y,it.pz); it.fromQ=new THREE.Quaternion().setFromEuler(_eu.set(0,-it.ang,0,'XYZ')); it.blend=0;
      it.tun={e:e,s:0,ph:0,tg:Math.max(.05,Math.min(per,b.total)*rnd(.5,1)),wait:0}; }
    else if(t>it.dgo){ it.goH=0; it.dnt=t+rnd(30,60); it.nt=0; } } }
function tunLife(it,dt,t){ const T=it.tun, b=T.e.br[0], top=AH.top, sp=.07; let d=0;
  if(T.ph===0){ T.s+=sp*dt; d=1; if(T.s>=T.tg){ T.s=T.tg; T.ph=1; T.wait=t+rnd(2,5); } } else if(T.ph===1){ if(t>T.wait) T.ph=2; } else { T.s-=sp*dt; d=-1; if(T.s<=0){ // esce dal foro
      const th=T.e.u0/.95; it.mode=0; it.px=Math.sin(th)*.88; it.pz=Math.cos(th)*.88; it.ang=Math.atan2(-Math.cos(th),-Math.sin(th))+rnd(-.5,.5); it.from=new V3(Math.sin(th)*.962,top,Math.cos(th)*.962); it.fromQ=(it.q||new THREE.Quaternion()).clone(); it.blend=0; it.nt=0; it.dnt=t+rnd(30,90); it.tun=null; return; } }
  const a=ahAt(b,T.s), th=a.u/.95, y=ahY(a.f,top), R=.962, c=Math.cos(th), s=Math.sin(th), lane=it.lane||0;
  const dir=d||1, h=Math.max(.05,top-AH.Y0-.07), f=new V3(c*a.du*dir,-(a.df/AH_VS)*h*dir,-s*a.du*dir); if(f.lengthSq()<1e-9) f.set(0,-1,0); const n=new V3(-s,0,-c);
  const q=basis(it.q||new THREE.Quaternion(),f,n), p=new V3(s*R+c*lane*.01,y,c*R-s*lane*.01);
  if(it.blend<1){ const e=ease(it.blend); it.blend+=dt/1.5; p.lerpVectors(it.from,p,e); q.slerpQuaternions(it.fromQ,q,e); }
  it.q=q; it.px=p.x; it.pz=p.z; it.y=p.y; it.ang=Math.atan2(f.z,f.x); const mv=T.ph!==1; it.st=mv?1:4; it.spd+=((mv?.5:0)-it.spd)*Math.min(1,dt*4); it.gait=(it.gait+dt*it.spd*2)%1; }
// ---------- ragnatele: fili e rugiada, crescono in qualche notte; le mosche possono restare impigliate ----------
const WEBN=3, WSP=12, WRG=7, WSEGV=(WSP+WRG*WSP)*2;
const webs=[]; for(let i=0;i<WEBN;i++) webs.push({on:false,th:0,y:0,rho:.3,prog:0,owner:null});
const wPos=new Float32Array(WEBN*WSEGV*3), wG=new Float32Array(WEBN*WSEGV), wW=new Float32Array(WEBN*WSEGV);
const wGeo=new THREE.BufferGeometry(); wGeo.setAttribute('position',new THREE.BufferAttribute(wPos,3)); wGeo.setAttribute('aG',new THREE.BufferAttribute(wG,1)); wGeo.setAttribute('aW',new THREE.BufferAttribute(wW,1));
const wUni={uP:{value:[0,0,0]},uNight:{value:0},uTime:{value:0},uPx:{value:600}};
const wVert=`attribute float aG; attribute float aW; varying float vG; varying float vW; varying vec3 vP; uniform float uNight,uPx; void main(){ vG=aG; vW=aW; vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uNight*.022*uPx/max(.1,-mv.z); }`;
const wUniL=Object.assign({},wUni,{uCol:{value:new Col(.95,.97,1)},uA:{value:.95}}), wUniD=Object.assign({},wUni,{uCol:{value:new Col(.12,.1,.1)},uA:{value:.35}});
const wFrag=`uniform float uP[3]; uniform float uNight,uTime,uA; uniform vec3 uCol; varying float vG; varying float vW; varying vec3 vP; void main(){ int w=int(vW+.5); float p=w==0?uP[0]:(w==1?uP[1]:uP[2]); if(vG>p) discard; float sp=pow(max(0.,sin(vP.x*130.+vP.y*90.+uTime*.4)*sin(vP.z*110.-vP.y*70.)),4.); gl_FragColor=vec4(uCol*(.85+.5*sp),uA*(.8+.2*sp)); }`;
const wMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:wUniL,fragmentShader:wFrag,vertexShader:wVert});
const wMatD=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:wUniD,fragmentShader:wFrag,vertexShader:wVert});
const wDew=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:wUni,vertexShader:wVert,
  fragmentShader:`uniform float uP[3]; uniform float uNight; varying float vG; varying float vW; varying vec3 vP; void main(){ int w=int(vW+.5); float p=w==0?uP[0]:(w==1?uP[1]:uP[2]); if(vG>p||uNight<.05) discard; float d=length(gl_PointCoord-.5)*2.; float a=1.-smoothstep(.2,1.,d); gl_FragColor=vec4(vec3(.85,.95,1.)*a*1.6,a*uNight*.9); }`});
const wLines=new THREE.LineSegments(wGeo,wMat), wLinesB=new THREE.LineSegments(wGeo,wMat), wLinesD=new THREE.LineSegments(wGeo,wMatD); wLinesB.position.set(.0025,.0025,0); wLinesD.position.set(-.002,-.004,0); [wLines,wLinesB,wLinesD].forEach(l=>{ l.frustumCulled=false; l.renderOrder=5; critG.add(l); });
const wDewGeo=new THREE.BufferGeometry(); const dewN=WEBN*WRG*WSP; const dPos=new Float32Array(dewN*3), dG=new Float32Array(dewN), dW=new Float32Array(dewN);
wDewGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3)); wDewGeo.setAttribute('aG',new THREE.BufferAttribute(dG,1)); wDewGeo.setAttribute('aW',new THREE.BufferAttribute(dW,1));
const wPts=new THREE.Points(wDewGeo,wDew); wPts.frustumCulled=false; wPts.renderOrder=5; critG.add(wPts);
function webBuild(k,w){ const sv=k*WSEGV; let vi=sv, di=k*WRG*WSP; const P=(rad,ang)=>{ const u=Math.cos(ang)*rad, yy=w.y+Math.sin(ang)*rad*1.05, th=w.th+u/.97, R=glassR(yy)-.03; return [Math.cos(th)*R,yy,Math.sin(th)*R]; };
  const put=(p,g)=>{ wPos[vi*3]=p[0]; wPos[vi*3+1]=p[1]; wPos[vi*3+2]=p[2]; wG[vi]=g; wW[vi]=k; vi++; };
  const jit=Math.random()*6.28; for(let i=0;i<WSP;i++){ const a=jit+i/WSP*6.2832; put(P(0,a),i*.012); put(P(w.rho*(.95+Math.random()*.1),a),i*.012+.2); }
  for(let j=1;j<=WRG;j++){ const rad=w.rho*j/WRG; for(let i=0;i<WSP;i++){ const a0=jit+i/WSP*6.2832, a1=jit+(i+1)/WSP*6.2832, r0=rad*(1+Math.sin(i*1.7+j)*.05), r1=rad*(1+Math.sin((i+1)*1.7+j)*.05);
      const g0=.25+.7*((j-1)/WRG)+.7/WRG*(i/WSP), g1=g0+.7/WRG/WSP; put(P(r0,a0),g0); put(P(r1,a1),g1); const p=P(r0,a0); dPos[di*3]=p[0]; dPos[di*3+1]=p[1]; dPos[di*3+2]=p[2]; dG[di]=g0; dW[di]=k; di++; } }
  wGeo.attributes.position.needsUpdate=wGeo.attributes.aG.needsUpdate=wGeo.attributes.aW.needsUpdate=true; wDewGeo.attributes.position.needsUpdate=wDewGeo.attributes.aG.needsUpdate=wDewGeo.attributes.aW.needsUpdate=true; }
function webLife(it,t,dt){ if(it.web===undefined){ it.web=-1; it.wdelay=t+rnd(8,30); }
  if(it.web<0&&t>it.wdelay){ const k=webs.findIndex(w=>!w.on); if(k>=0){ const w=webs[k]; w.on=true; w.owner=it; w.th=it.th; w.y=clamp(it.wy,1.1,1.65); w.rho=.24+Math.random()*.08; w.prog=0; it.web=k; webBuild(k,w); } else it.web=-2; } }
function webTick(dt,t,all){ const nt=S.night?1:0; wUni.uNight.value+=(nt-wUni.uNight.value)*Math.min(1,dt*.5); wUni.uTime.value=t; const arr=wUni.uP.value;
  webs.forEach((w,k)=>{ if(w.on&&w.prog<1) w.prog=Math.min(1,w.prog+dt/(S.night?200:1200)); arr[k]=w.on?w.prog:-1; }); }
function webTrap(it,t,P){ for(const w of webs){ if(!w.on||w.prog<.4) continue; const th=Math.atan2(P.z,P.x), R=Math.hypot(P.x,P.z); if(R<glassR(P.y)-.1) continue;
    const du=wrap(th-w.th)*.97, dy=P.y-w.y; if(Math.hypot(du,dy)<w.rho*w.prog*.85&&Math.random()<dt_trap()){ const Rg=glassR(P.y)-.03; it.mode=4; it.tweb=w; it.trapT=t; it.trapEnd=t+rnd(50,90); it.tp=new V3(Math.cos(th)*Rg,P.y,Math.sin(th)*Rg); it.tth=th; it.surf={k:'g',th:th,y:P.y,n:new V3(-Math.cos(th),0,-Math.sin(th)),f:new V3(0,1,0)}; return true; } } return false; }
const dt_trap=()=>.35*_dt;
// ---------- movimento, stati, livelli di dettaglio ----------
const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _p=new V3(), _s=new V3(), _e=new THREE.Euler(), _c=new V3(), cands=[];
function move(dt,t,v,dry){ uni.uTime.value=t; uni.uDry.value=dry||0; uni.uCharge.value=Math.max(0,Math.min(1,(v.E||0)/100)); const lv=Math.min(2,level()||0); let budget=BUDGET[lv]; cands.length=0; let crumbN=0;
  const H=viewH()||300, kpx=H/(2*Math.tan(camera.fov*Math.PI/360)); _c.copy(camera.position);
  Object.values(crt).forEach(c=>{ const x=c.x, id=c.id, fly=id==='mosche', soc=!!x.society&&!fly, an=soc?anchorOf(id):null, war=!c.dying&&v.wars.find(w=>w.includes(id)), wi=war?war.indexOf(id):0, sp=(fly?.55:id==='lumache'?.03:.28)*(war?2:1), mut=x.mut||[], mutK=mut.length?Math.min(1.3,.7+.2*mut.length):0, glb=c.kind==='glb';
    const tint=(x.monster?'m':'')+(glb?'':mut.join(',')); if(tint!==c.tint){ c.tint=tint; const col=new Col(1,1,1); if(x.monster) col.multiply(new Col(1,.55,.55)); if(!glb){ if(mut.includes('radioattivo')) col.multiply(new Col(.7,1.2,.7)); if(mut.includes('bioluminescenza')) col.multiply(new Col(.7,1,1.25)); if(mut.includes('velenoso')) col.multiply(new Col(1.1,.7,1.25)); } c.tiers.forEach(tr=>{ for(let i=0;i<CAP;i++) tr.im.setColorAt(i,col); tr.im.instanceColor.needsUpdate=true; }); }
    const lim=glb?24:12; const sz=(c.final?(1+Math.min(.5,.12*Math.max(0,(x.size||1)-1))):SIZE(x))*(x.monster?1.7:1), vis=c.final?c.len*sz:sz;
    c.items.forEach((it,ix)=>{ if(ix>=lim){ it.hid=1; return; } it.hid=0; const dead=it.st===5;
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
  pxK=kpx; physics(dt,t,v,dry);
  // livelli di dettaglio: i più grandi a schermo prendono il dettaglio migliore finché il budget regge; mai meno individui
  if(cands.length){ cands.sort((a,b)=>b.pxs-a.pxs); let closeN=0; const maxTier=lv===0?0:lv===1?1:2; // indice del livello migliore ammesso (0 close)
    let minSum=0; cands.forEach(it=>{ minSum+=it.c.tiers[it.c.tiers.length-1].tris; });
    cands.forEach(it=>{ const T=it.c.tiers, last=T.length-1, minT=T[last].tris; minSum-=minT; let pick=last; for(let k=Math.min(maxTier,last);k<last;k++){ const tr=T[k]; if(it.pxs<tr.px) continue; if(tr.name==='close'&&closeN>=CLOSE_MAX) continue; if(tr.tris<=budget-minSum){ pick=k; break; } } if(T[pick].name==='close') closeN++; budget-=T[pick].tris; it.tier=pick; }); }
  Object.values(crt).forEach(c=>{ c.items.forEach(it=>{ if(it.hid) return; const tr=c.tiers[it.tier||0], i=tr.n++; if(it.q) _q.copy(it.q); else { _e.set(0,-it.ang,0); _q.setFromEuler(_e); } _p.set(it.px,it.y,it.pz); _s.set(it.sz,it.sz,it.sz); _m.compose(_p,_q,_s); tr.im.setMatrixAt(i,_m); tr.ia.setXYZW(i,it.gait,it.spd,it.st,it.tw); tr.imu.setX(i,it.mut); });
    c.tiers.forEach(tr=>{ tr.im.count=tr.n; tr.im.instanceMatrix.needsUpdate=true; tr.ia.needsUpdate=true; tr.imu.needsUpdate=true; }); }); }
// oggetti di Kimi (meteorite): una copia del tier close, materiale proprio (emissiva regolabile dal gioco)
function object(id){ const m=models[id]; if(!m||!m.object) return null; const t=m.tiers.find(q=>q.name==='close')||m.tiers[0]; const mat=t.mat.clone(); const mesh=new THREE.Mesh(t.geo,mat); mesh.geometry.computeBoundingBox(); const o={mesh,mat,tris:t.tris,box:mesh.geometry.boundingBox}; objs[id]=o; return o; }
const objs={};
function stats(){ const o={}; Object.values(crt).forEach(c=>{ o[c.id]={n:c.items.length,kind:c.kind,tiers:{}}; c.tiers.forEach(tr=>{ o[c.id].tiers[tr.name]=tr.n||0; }); }); return o; }
return {crt,sync,move,ready,stats,object,objs,trails:[trG,trS],ah:AH,ahCanvas,webs,get loaded(){ return loaded; },models};
};
