/* Apertura in 3D — le scene del video iniziale costruite con Three.js (stesso import map del gioco).
   film.js tiene la logica (testi, tocchi, stati); qui vive solo la messa in scena.
   Interfaccia: window.__APERTURA.create(el, opts) → Promise<R> con
     R.kind='3d', R.canvas, R.fit(), R.size() → {w,h,dpr}, R.frame(t, C), R.anchors(id) → punti a schermo (pixel fisici), R.dispose()
   C = {id, st, P, lineI, fast}  (stato della scena calcolato da film.js in tick()).
   Registro dei modelli: slot(id) → Group. Se build_app.py ha incorporato assets/kimi/<id>/close.glb (window.__GLB[id]) si usa
   quello, altrimenti la versione procedurale. Slot: finestra, gelso, giardino, meteorite, barattolo, scrivania, lampada, quaderno, mano. */
(function(){
'use strict';
const SLOTS=['finestra','gelso','giardino','meteorite','barattolo','scrivania','lampada','quaderno','mano'];
const VIOLA=0xA88BFF;
const rnd=i=>{ const x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x); };
const lerp=(a,b,k)=>a+(b-a)*Math.max(0,Math.min(1,k));
const ease=k=>{ k=Math.max(0,Math.min(1,k)); return k*k*(3-2*k); };
// ---------- rumore e texture procedurali ----------
function vnoise(){ const p=new Uint8Array(512); for(let i=0;i<256;i++) p[i]=i; for(let i=255;i>0;i--){ const j=Math.floor(rnd(i+3)*(i+1)); const t=p[i]; p[i]=p[j]; p[j]=t; } for(let i=0;i<256;i++) p[256+i]=p[i];
  const fade=t=>t*t*t*(t*(t*6-15)+10), grad=(h,x,y)=>{ switch(h&3){ case 0:return x+y; case 1:return -x+y; case 2:return x-y; default:return -x-y; } };
  return (x,y)=>{ const X=Math.floor(x)&255, Y=Math.floor(y)&255; x-=Math.floor(x); y-=Math.floor(y); const u=fade(x), v=fade(y); const A=p[X]+Y, B=p[X+1]+Y;
    return lerp(lerp(grad(p[A],x,y),grad(p[B],x-1,y),u),lerp(grad(p[A+1],x,y-1),grad(p[B+1],x-1,y-1),u),v)*.5+.5; }; }
const N2=vnoise();
const fbm=(x,y,o=4)=>{ let a=0,s=1,n=0; for(let i=0;i<o;i++){ a+=N2(x,y)*s; n+=s; x*=2.03; y*=1.97; s*=.5; } return a/n; };
function texCanvas(THREE,w,h,fn,rep){ const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); const im=x.createImageData(w,h); const d=im.data;
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){ const o=(j*w+i)*4; const col=fn(i/w,j/h); d[o]=col[0]; d[o+1]=col[1]; d[o+2]=col[2]; d[o+3]=col[3]==null?255:col[3]; }
  x.putImageData(im,0,0); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; if(rep){ t.repeat.set(rep[0],rep[1]); } t.anisotropy=4; return t; }
function texWood(THREE){ return texCanvas(THREE,512,512,(u,v)=>{ const g=fbm(u*2.2,v*22,4); const ring=.5+.5*Math.sin((v*18+g*3.2+u*.6)*6.28); const k=.42+.4*ring*ring+(fbm(u*40,v*9,3)-.5)*.16; const stain=Math.max(0,1-Math.hypot(u-.72,v-.3)*4)**2*.35; const r=118*k-stain*40, gg=76*k-stain*30, b=42*k-stain*18; return [r,gg,b]; },[2,1]); }
function texWoodRough(THREE){ return texCanvas(THREE,256,256,(u,v)=>{ const k=130+90*fbm(u*8,v*60,3)+(rnd(u*997+v*31)-.5)*30; return [k,k,k]; }); }
function texPlaster(THREE){ return texCanvas(THREE,256,256,(u,v)=>{ const k=.78+.2*fbm(u*9,v*9,4); return [205*k,196*k,178*k]; },[3,3]); }
function texPaint(THREE){ return texCanvas(THREE,256,256,(u,v)=>{ const f=fbm(u*6,v*6,4); const flake=f>.66?.78:1; const k=(.86+.1*f)*flake; return [238*k,232*k,218*k]; },[2,2]); }
function texSoil(THREE){ return texCanvas(THREE,512,512,(u,v)=>{ const f=fbm(u*7,v*7,5), g=fbm(u*23+5,v*23,3); const gr=g>.52?1:0; const r=lerp(52,34,gr)*(.6+.8*f), gg=lerp(40,58,gr)*(.6+.8*f), b=lerp(26,18,gr)*(.6+.8*f); return [r,gg,b]; },[22,22]); }
function texLeaf(THREE){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,64,64); x.fillStyle='#fff'; x.beginPath(); x.moveTo(32,2); x.bezierCurveTo(60,18,58,48,32,62); x.bezierCurveTo(6,48,4,18,32,2); x.fill(); x.strokeStyle='#777'; x.lineWidth=1.5; x.beginPath(); x.moveTo(32,4); x.lineTo(32,60); x.stroke(); const t=new THREE.CanvasTexture(c); return t; }
function texSoft(THREE){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.35,'rgba(255,255,255,.45)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); }
function texLabel(THREE){ return texCanvas(THREE,128,64,(u,v)=>{ const f=fbm(u*9,v*5,3); const a=(f>.47&&u>.08&&u<.92&&v>.12&&v<.88)?90+90*f:0; return [240,230,205,a]; }); }
function texMetal(THREE){ return texCanvas(THREE,256,256,(u,v)=>{ const f=fbm(u*12,v*12,4); const rust=Math.max(0,f-.58)*3; return [lerp(188,120,rust),lerp(168,62,rust),lerp(120,30,rust)]; }); }
// ---------- shader comuni ----------
const DISC_VS='varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const DISC_FS='uniform vec3 uCol; uniform float uA; uniform float uMode; uniform float uR; uniform float uW; uniform float uFrac; varying vec2 vUv;\n'+
 'void main(){ vec2 p=vUv-.5; float d=length(p)*2.0; float a=0.0;\n'+
 ' if(uMode<.5){ a=exp(-d*d*4.0); } else { float ang=atan(p.x,p.y); ang=mod(-ang+3.14159265,6.2831853)/6.2831853; a=smoothstep(uW,0.0,abs(d-uR))*step(ang,uFrac); }\n'+
 ' gl_FragColor=vec4(uCol*a*uA,a*uA); }';
const STAR_VS='attribute float aSize; attribute float aPhase; uniform float uT; uniform float uDpr; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vA=.45+.55*pow(sin(uT*.0012+aPhase),2.0); gl_PointSize=aSize*uDpr; gl_Position=projectionMatrix*mv; }';
const STAR_FS='varying float vA; void main(){ float d=length(gl_PointCoord-.5)*2.0; float a=smoothstep(1.0,0.0,d)*vA; gl_FragColor=vec4(vec3(.92,.95,1.0)*a,a); }';
const SKY_VS='varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const SKY_FS='uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform float uDay; varying vec3 vP; void main(){ float y=normalize(vP).y; vec3 c=mix(uHor,uTop,smoothstep(-.05,.6,y)); float s=pow(max(0.0,dot(normalize(vP),normalize(uSun))),6.0); c+=vec3(1.0,.8,.55)*s*uDay*.6; gl_FragColor=vec4(c,1.0); }';

async function create(el,opts){
  opts=opts||{}; const THREE=await import('three'); let GLTFLoader=null;
  try{ GLTFLoader=(await import('https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/loaders/GLTFLoader.js')).GLTFLoader; }catch(e){ GLTFLoader=null; }
  const ML=window.__MATLIB?window.__MATLIB(THREE):null;
  const mlib=(id,o)=>{ let m=null; try{ m=ML&&ML.mat(id); m=m&&m.clone(); }catch(e){ m=null; } if(!m) m=new THREE.MeshStandardMaterial(); m.vertexColors=false; if(o) Object.keys(o).forEach(k=>{ if(m[k]&&m[k].isColor) m[k].set(o[k]); else m[k]=o[k]; }); m.needsUpdate=true; return m; };
  const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  // foto vere (window.__MAT_FOTO, file a parte): senza, restano le texture procedurali
  const MFO=window.__MAT_FOTO||null, TL=new THREE.TextureLoader();
  function ftex(id,key,rep,srgb){ const u=MFO&&MFO[id]&&MFO[id][key]; if(!u) return null; const t=TL.load(u); if(srgb!==false&&key!=='normale'&&key!=='ruvidezza'&&key!=='altezza') t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep[0],rep[1]); } return t; }
  const hasF=id=>!!(MFO&&MFO[id]&&MFO[id].colore);
  const fpbr=(id,rep)=>{ if(!hasF(id)) return null; const o={map:ftex(id,'colore',rep),color:0xffffff}; const n=ftex(id,'normale',rep); if(n) o.normalMap=n; const r=ftex(id,'ruvidezza',rep); if(r){ o.roughnessMap=r; o.roughness=1; } return o; };
  const canvas=document.createElement('canvas'); canvas.className='v3d';
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.transmissionResolutionScale=.5; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
  let dpr=Math.min(2,window.devicePixelRatio||1), W=1,H=1, level=0;
  function fit(){ W=Math.max(1,Math.round(innerWidth)); H=Math.max(1,Math.round(innerHeight)); renderer.setPixelRatio(dpr); renderer.setSize(W,H,false); SETS.forEach(s=>{ if(s&&s.cam){ s.cam.aspect=W/H; s.cam.updateProjectionMatrix(); } }); }
  // ambiente per riflessi (stanza in miniatura)
  const pm=new THREE.PMREMGenerator(renderer); const envScene=new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.BoxGeometry(40,40,40),new THREE.MeshBasicMaterial({color:0x1a1c22,side:THREE.BackSide})));
  const pan=(x,y,z,c,sx,sy)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),new THREE.MeshBasicMaterial({color:c})); m.position.set(x,y,z); m.lookAt(0,0,0); envScene.add(m); };
  pan(0,19,0,0xfff2dc,16,10); pan(-19,6,0,0x8aa0c8,6,14); pan(19,2,6,0xffd9a8,8,8); pan(0,-19,0,0x3a3230,30,30);
  const ENV=pm.fromScene(envScene,.04).texture; pm.dispose();
  const TEX={soft:texSoft(THREE),leaf:texLeaf(THREE)};
  // ---------- registro dei modelli di Kimi ----------
  // stesso formato di window.__GLB ({id:{close:base64}}): prima la scenografia dell'apertura, poi i modelli del gioco
  const GLB={}; [window.__GLB||{},window.__GLB_APERTURA||{}].forEach(src=>Object.keys(src).forEach(k=>{ const t=src[k]&&src[k].close; if(t&&SLOTS.includes(k)) GLB[k]=t; }));
  function parseGlb(data){ return new Promise((res,rej)=>{ if(!GLTFLoader) return rej('no loader'); const b=atob(data); const u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); new GLTFLoader().parse(u.buffer,'',g=>res(g.scene),rej); }); }
  function normalize(g,len){ const bb=new THREE.Box3().setFromObject(g); const sz=bb.getSize(new THREE.Vector3()); const s=len/Math.max(sz.x,sz.y,sz.z,1e-6); g.scale.setScalar(s); const bb2=new THREE.Box3().setFromObject(g); const c=bb2.getCenter(new THREE.Vector3()); g.position.set(-c.x,-bb2.min.y,-c.z); const w=new THREE.Group(); w.add(g); return w; }
  const PROC={}; const used={};
  async function slot(id,len){ const w=new THREE.Group(); w.name='slot:'+id; let g=null;
    if(GLB[id]){ try{ g=normalize(await parseGlb(GLB[id]),len); g.traverse(o=>{ if(o.isMesh){ o.castShadow=o.receiveShadow=true; } }); used[id]='kimi'; }catch(e){ g=null; } }
    if(!g){ g=PROC[id]?PROC[id](len):new THREE.Group(); used[id]=PROC[id]?'procedurale':'vuoto'; }
    w.add(g); return w; }
  // ---------- costruttori procedurali ----------
  PROC.meteorite=len=>{ const geo=new THREE.IcosahedronGeometry(.5,4); const p=geo.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i); const n=fbm(x*2+3,y*2+z*1.3,4); const k=.78+.42*n-(fbm(x*7,z*7+y*5,3)>.6?.09:0); p.setXYZ(i,x*k*1.25,y*k*.85,z*k); } geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x1b1715,roughness:.86,metalness:.12,emissive:VIOLA,emissiveIntensity:.3})); m.castShadow=m.receiveShadow=true; return normalize(m,len); };
  PROC.scrivania=()=>{ const g=new THREE.Group(); const wood=mlib('legno_lucido',{map:texWood(THREE),roughnessMap:texWoodRough(THREE),roughness:.55,clearcoat:.35,clearcoatRoughness:.4,color:0xffffff}); const top=new THREE.Mesh(new THREE.BoxGeometry(14,.4,8,1,1,1),wood); top.position.y=-.2; top.receiveShadow=true; top.castShadow=true; g.add(top);
    const edge=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,14,12),wood); edge.rotation.z=Math.PI/2; edge.position.set(0,-.2,4); g.add(edge); return g; };
  PROC.barattolo=()=>{ const g=new THREE.Group(); const pts=[]; const R=.56,Hh=1.55; const prof=[[0,0],[.5,0],[R,.06],[R,1.05],[R-.04,1.18],[.46,1.28],[.46,1.36],[.49,1.4],[.49,1.47],[.46,1.5],[.46,Hh]]; prof.forEach(q=>pts.push(new THREE.Vector2(q[0],q[1]))); const inner=[[.42,Hh],[.42,1.33],[.47,1.2],[R-.06,1.0],[R-.06,.12],[.44,.08],[0,.08]]; inner.forEach(q=>pts.push(new THREE.Vector2(q[0],q[1])));
    // vetro identico al gioco (profilo e materiale di v3d.js), scalato al barattolo dell'apertura
    const gp=[[0,0],[.70,0],[.88,.05],[.97,.18],[1,.4],[1,1.9],[.96,2.08],[.82,2.18],[.78,2.24],[.78,2.34]].map(q=>new THREE.Vector2(q[0]*R,q[1]*Hh/2.34)); const geo=new THREE.LatheGeometry(gp,96);
    const glass=new THREE.MeshPhysicalMaterial({color:0x000000,transparent:true,opacity:1,roughness:.05,metalness:0,clearcoat:.35,clearcoatRoughness:.03,specularIntensity:.7,envMapIntensity:.9,side:THREE.FrontSide,depthWrite:false});
    const rimM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',fragmentShader:'varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),3.); gl_FragColor=vec4(vec3(.72,.9,1.)*f*.55,f*.55); }'});
    [glass,rimM].forEach(m=>{ m.blending=THREE.CustomBlending; m.blendEquation=THREE.AddEquation; m.blendSrc=THREE.OneFactor; m.blendDst=THREE.OneFactor; m.blendSrcAlpha=THREE.ZeroFactor; m.blendDstAlpha=THREE.OneFactor; });
    const jar=new THREE.Mesh(geo,glass); jar.name='vetro'; jar.renderOrder=6; jar.castShadow=false; jar.receiveShadow=false; g.add(jar); const jr=new THREE.Mesh(geo,rimM); jr.renderOrder=7; g.add(jr);
    const lab=new THREE.Mesh(new THREE.PlaneGeometry(.7,.42),new THREE.MeshStandardMaterial({map:texLabel(THREE),transparent:true,roughness:.9,depthWrite:false})); lab.position.set(0,.62,R+.005); lab.name='label'; g.add(lab);
    const lid=new THREE.Group(); lid.name='lid'; const FC=fpbr('coperchio'), lm=FC?new THREE.MeshStandardMaterial(Object.assign({roughness:.6,metalness:.15},FC)):mlib('metallo_brunito',{map:texMetal(THREE),color:0xffffff,metalness:.9,roughness:.42}); const cap=new THREE.Mesh(new THREE.CylinderGeometry(.45,.414,.168,48),lm); cap.position.y=.084; cap.castShadow=true; lid.add(cap); lid.position.y=Hh; g.add(lid);
    const grav=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.045,0),mlib('pietra',{color:0xb8b4a8,roughness:.9}),70); const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(); for(let i=0;i<70;i++){ const a=rnd(i)*6.28,r=Math.sqrt(rnd(i+9))*.42; S.setScalar(.7+rnd(i+3)*.8); Q.setFromEuler(new THREE.Euler(rnd(i+5)*3,rnd(i+6)*3,0)); M.compose(V3(Math.cos(a)*r,.1+rnd(i+7)*.03,Math.sin(a)*r),Q,S); grav.setMatrixAt(i,M); } grav.receiveShadow=true; g.add(grav); return g; };
  PROC.finestra=()=>{ const g=new THREE.Group(); const FWL=fpbr('legno_finestra',[1,2]), paint=new THREE.MeshStandardMaterial(FWL?Object.assign({roughness:.7},FWL):{map:texPaint(THREE),roughness:.72}); const bar=(x,y,z,sx,sy,sz)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),paint); m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; g.add(m); return m; };
    const Wd=10,Ht=14; bar(-Wd/2,Ht/2,0,.5,Ht,.9); bar(Wd/2,Ht/2,0,.5,Ht,.9); bar(0,Ht,0,Wd,.5,.9); bar(0,Ht*.84,0,Wd,.35,.7); bar(0,Ht/2,0,.3,Ht,.6); const sill=bar(0,-.25,.55,Wd+1.4,.5,2.2); sill.name='davanzale';
    const glass=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.02,transparent:true,opacity:.12,metalness:0,clearcoat:1,envMapIntensity:1.5,side:THREE.DoubleSide,depthWrite:false}); const pane=new THREE.Mesh(new THREE.PlaneGeometry(Wd,Ht),glass); pane.position.set(0,Ht/2,0); pane.name='vetro'; g.add(pane); return g; };
  PROC.gelso=len=>{ const g=new THREE.Group(); const FB=fpbr('corteccia_gelso',[2,3]), bark=new THREE.MeshStandardMaterial(FB?Object.assign({roughness:.95},FB):{color:0x3a2e24,roughness:.95}); const seg=(a,b,r1,r2)=>{ const d=b.clone().sub(a); const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,d.length(),7,1),bark); m.position.copy(a).add(d.clone().multiplyScalar(.5)); m.quaternion.setFromUnitVectors(V3(0,1,0),d.clone().normalize()); m.castShadow=true; g.add(m); };
    const H=len||40; const leafM=new THREE.MeshStandardMaterial({map:TEX.leaf,alphaMap:TEX.leaf,alphaTest:.5,color:0x2f5a2a,roughness:.9,side:THREE.DoubleSide}); const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.1,1.5),leafM,700); let li=0; const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=V3(1,1,1);
    const branch=(a,dir,len2,r,depth)=>{ const b=a.clone().add(dir.clone().multiplyScalar(len2)); seg(a,b,r,r*.62); if(depth<=0||li>=640){ for(let i=0;i<18&&li<700;i++){ const p=b.clone().add(V3((rnd(li)-.5)*5,(rnd(li+1)-.3)*4,(rnd(li+2)-.5)*5)); Q.setFromEuler(new THREE.Euler(rnd(li+3)*3,rnd(li+4)*3,rnd(li+5)*3)); M.compose(p,Q,S); leaves.setMatrixAt(li++,M); } return; }
      for(let i=0;i<3;i++){ const nd=dir.clone().add(V3((rnd(depth*7+i)-.5)*1.1,(rnd(depth*9+i)-.5)*.5+.15,(rnd(depth*11+i)-.5)*1.1)).normalize(); branch(b,nd,len2*.64,r*.62,depth-1); } };
    branch(V3(0,0,0),V3(.05,1,.02),H*.38,H*.055,3); leaves.count=li; g.add(leaves); return g; };
  PROC.giardino=()=>{ const g=new THREE.Group(); const geo=new THREE.PlaneGeometry(60,60,70,70); const p=geo.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i); const d=Math.hypot(x,y); const crater=d<1.6?-((1-d/1.6)**1.4)*.55:(d<2.3?(1-Math.abs(d-1.95)/.35)*.14:0); p.setZ(i,(fbm(x*.25+9,y*.25,3)*1.2-.6)*Math.min(1,d/3.5)+crater); } geo.computeVertexNormals(); geo.rotateX(-Math.PI/2);
    const FP=fpbr('prato',[14,14]), FBR=fpbr('terra_bruciata',[14,14]), soil=new THREE.MeshStandardMaterial(FP?Object.assign({roughness:.95},FP):{map:texSoil(THREE),roughness:.95});
    if(FP&&FBR){ soil.onBeforeCompile=sh=>{ sh.uniforms.mapB={value:FBR.map}; sh.fragmentShader='uniform sampler2D mapB;\n'+sh.fragmentShader.replace('vec4 sampledDiffuseColor = texture2D( map, vMapUv );','vec4 sampledDiffuseColor = mix(texture2D(mapB,vMapUv)*vec4(2.2,2.2,2.2,1.),texture2D(map,vMapUv),smoothstep(.25,.95,vColor.r));'); }; soil.customProgramCacheKey=()=>'prato-bruciato'; } const ground=new THREE.Mesh(geo,soil); ground.receiveShadow=true; ground.name='terreno'; g.add(ground);
    const gc=new Float32Array(p.count*3); for(let i=0;i<p.count;i++){ const x=p.getX(i),z=p.getZ(i); const d=Math.hypot(x,z)*(1+(fbm(x*1.7+3,z*1.7)-.5)*.6); const k=d<2.6?.18+.82*Math.min(1,Math.max(0,(d-1.2)/1.4))**1.5:1; gc[i*3]=k; gc[i*3+1]=k*.96; gc[i*3+2]=k*.92; } geo.setAttribute('color',new THREE.BufferAttribute(gc,3)); soil.vertexColors=true;
    // fili d'erba
    const bg=new THREE.PlaneGeometry(.06,.75,1,3); bg.translate(0,.45,0); const bp=bg.attributes.position; for(let i=0;i<bp.count;i++){ const y=bp.getY(i); bp.setX(i,bp.getX(i)*(1-y/.95)); bp.setZ(i,y*y*.25); }
    const gm=new THREE.MeshStandardMaterial({color:0x3c6a2c,roughness:.85,side:THREE.DoubleSide}); gm.onBeforeCompile=sh=>{ sh.uniforms.uT={value:0}; gm.userData.sh=sh; sh.vertexShader='uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float ph=instanceMatrix[3][0]*1.7+instanceMatrix[3][2]*1.3; transformed.x+=sin(uT*.0014+ph)*.09*position.y; transformed.z+=cos(uT*.0011+ph)*.05*position.y;'); };
    const N=4200; const grass=new THREE.InstancedMesh(bg,gm,N); const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(); const col=new THREE.Color(); let n=0; for(let i=0;i<N*3&&n<N;i++){ const x=(rnd(i)-.5)*28, z=(rnd(i+1)-.5)*28; const d=Math.hypot(x,z); if(d<1.75) continue; const h=(fbm(x*.25+9,z*.25,3)*1.2-.6)*Math.min(1,d/3.5); const s=.7+rnd(i+2)*.9; S.set(s,s*(d<2.6?.45:d<3.4?.7:1),s); Q.setFromEuler(new THREE.Euler(0,rnd(i+3)*6.28,0)); M.compose(V3(x,h,z),Q,S); grass.setMatrixAt(n,M); col.setHSL(.24+rnd(i+4)*.07,.38,.3+rnd(i+5)*.18); grass.setColorAt(n,col); n++; } grass.count=n; grass.castShadow=false; grass.receiveShadow=true; grass.name='erba'; g.add(grass);
    // foglie cadute
    const fl=new THREE.InstancedMesh(new THREE.PlaneGeometry(.7,.95),new THREE.MeshStandardMaterial({map:TEX.leaf,alphaMap:TEX.leaf,alphaTest:.5,color:0x3e3220,roughness:.9,side:THREE.DoubleSide}),90); for(let i=0;i<90;i++){ let x=(rnd(i+70)-.5)*16, z=(rnd(i+71)-.5)*16; if(Math.hypot(x,z)<2.6){ x*=2.6/Math.max(.3,Math.hypot(x,z)); z*=2.6/Math.max(.3,Math.hypot(x,z)); } const h=(fbm(x*.25+9,z*.25,3)*1.2-.6)*Math.min(1,Math.hypot(x,z)/3.5)+(Math.hypot(x,z)<1.6?-((1-Math.hypot(x,z)/1.6)**1.4)*.55:0)+.02; Q.setFromEuler(new THREE.Euler(-Math.PI/2+(rnd(i+72)-.5)*.6,0,rnd(i+73)*6.28)); S.setScalar(.8+rnd(i+74)*.6); M.compose(V3(x,h+.03,z),Q,S); fl.setMatrixAt(i,M); } g.add(fl);
    // zolle sollevate dall'impatto, intorno al bordo del cratere
    const cg=new THREE.DodecahedronGeometry(.08,1); const cp=cg.attributes.position; for(let i=0;i<cp.count;i++){ const k=.75+.5*fbm(cp.getX(i)*30+1,cp.getY(i)*30+cp.getZ(i)*20,2); cp.setXYZ(i,cp.getX(i)*k,cp.getY(i)*k*.7,cp.getZ(i)*k); } cg.computeVertexNormals();
    const clods=new THREE.InstancedMesh(cg,new THREE.MeshStandardMaterial(FBR?Object.assign({roughness:1},FBR):{map:texSoil(THREE),color:0x8a7a68,roughness:1}),180); for(let i=0;i<180;i++){ const a=rnd(i+300)*6.28, r=1.3+Math.pow(rnd(i+301),2)*2.6; const x=Math.cos(a)*r, z=Math.sin(a)*r; const y=(fbm(x*.25+9,z*.25,3)*1.2-.6)*Math.min(1,r/3.5)+(r<2.3?(1-Math.abs(r-1.95)/.35)*.14:0); S.setScalar((.25+rnd(i+302)*.6)*Math.min(1.6,2.6/r)); Q.setFromEuler(new THREE.Euler(rnd(i+303)*6,rnd(i+304)*6,0)); M.compose(V3(x,y+.02,z),Q,S); clods.setMatrixAt(i,M); } clods.castShadow=clods.receiveShadow=true; g.add(clods);
    return g; };
  PROC.lampada=()=>{ const g=new THREE.Group(); const met=mlib('metallo_brunito',{color:0x2a2a2e,metalness:.85,roughness:.38}); const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.2,.25,32),met); base.position.y=.12; base.castShadow=true; g.add(base);
    const arm=(a,b,r)=>{ const d=b.clone().sub(a); const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),10),met); m.position.copy(a).add(d.clone().multiplyScalar(.5)); m.quaternion.setFromUnitVectors(V3(0,1,0),d.clone().normalize()); m.castShadow=true; g.add(m); };
    arm(V3(0,.2,0),V3(-.8,3.6,.4),.1); arm(V3(-.8,3.6,.4),V3(-2.8,5.2,1.6),.1); const head=new THREE.Mesh(new THREE.ConeGeometry(.9,1.3,32,1,true),new THREE.MeshStandardMaterial({color:0x2a2a2e,metalness:.85,roughness:.35,side:THREE.DoubleSide})); head.position.set(-3.1,4.9,2.0); head.lookAt(V3(-5.2,0,4.4)); head.rotateX(-Math.PI/2); head.name='head'; g.add(head);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),new THREE.MeshStandardMaterial({color:0xfff2d0,emissive:0xffd890,emissiveIntensity:2.5,roughness:.3})); bulb.position.set(-3.3,4.55,2.25); bulb.name='bulb'; g.add(bulb); return g; };
  PROC.quaderno=()=>{ const g=new THREE.Group(); const cov=new THREE.Mesh(new THREE.BoxGeometry(2.1,.22,3),(hasF('copertina_quaderno')?new THREE.MeshStandardMaterial(Object.assign({roughness:.8},fpbr('copertina_quaderno'))):mlib('carta',{color:0x6b7a8f,roughness:.9,map:texPlaster(THREE)}))); cov.position.y=.11; cov.castShadow=cov.receiveShadow=true; g.add(cov); const pages=new THREE.Mesh(new THREE.BoxGeometry(2.0,.18,2.9),new THREE.MeshStandardMaterial({color:0xf0ead8,roughness:.95})); pages.position.y=.1; g.add(pages);
    const pen=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1.9,8),new THREE.MeshStandardMaterial({color:0xd9a93a,roughness:.6})); pen.rotation.z=Math.PI/2; pen.rotation.y=.4; pen.position.set(.6,.3,-.2); pen.castShadow=true; g.add(pen); return g; };
  PROC.mano=()=>new THREE.Group();
  // ---------- aiutanti di scena ----------
  function disc(mode,col){ const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({vertexShader:DISC_VS,fragmentShader:DISC_FS,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,uniforms:{uCol:{value:new THREE.Color(col)},uA:{value:1},uMode:{value:mode},uR:{value:.8},uW:{value:.08},uFrac:{value:1}}})); m.renderOrder=20; m.frustumCulled=false; return m; }
  function skyDome(){ const m=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),new THREE.ShaderMaterial({vertexShader:SKY_VS,fragmentShader:SKY_FS,side:THREE.BackSide,depthWrite:false,uniforms:{uTop:{value:new THREE.Color(0x04060d)},uHor:{value:new THREE.Color(0x1a1740)},uSun:{value:V3(.3,.2,-1)},uDay:{value:0}}})); m.renderOrder=-10; return m; }
  function stars(n){ const g=new THREE.BufferGeometry(); const P=new Float32Array(n*3), S=new Float32Array(n), Ph=new Float32Array(n); for(let i=0;i<n;i++){ const a=rnd(i)*6.28, e=Math.asin(.03+rnd(i+1)*.95); P[i*3]=Math.cos(a)*Math.cos(e)*380; P[i*3+1]=Math.sin(e)*380; P[i*3+2]=Math.sin(a)*Math.cos(e)*380; S[i]=1.2+rnd(i+2)**3*3.2; Ph[i]=rnd(i+3)*6.28; } g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('aSize',new THREE.BufferAttribute(S,1)); g.setAttribute('aPhase',new THREE.BufferAttribute(Ph,1));
    const m=new THREE.Points(g,new THREE.ShaderMaterial({vertexShader:STAR_VS,fragmentShader:STAR_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uDpr:{value:dpr}}})); m.frustumCulled=false; return m; }
  function sprite(col,sc,op){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.soft,color:col,transparent:true,opacity:op==null?1:op,depthWrite:false,blending:THREE.AdditiveBlending})); s.scale.setScalar(sc); return s; }
  function cam(fov){ const c=new THREE.PerspectiveCamera(fov,W/H,.05,900); return c; }
  const tmpV=new THREE.Vector3();
  function proj(c,v){ tmpV.copy(v).project(c); return {x:(tmpV.x+1)/2*W*dpr,y:(1-tmpV.y)/2*H*dpr,z:tmpV.z}; }
  function unproj(c,sx,sy,dist){ tmpV.set(sx*2-1,1-sy*2,.5).unproject(c); const d=tmpV.sub(c.position).normalize(); return c.position.clone().add(d.multiplyScalar(dist)); }
  function rayGround(c,sx,sy,y0){ tmpV.set(sx*2-1,1-sy*2,.5).unproject(c); const d=tmpV.sub(c.position).normalize(); if(d.y>=-.01) return null; const t=(y0-c.position.y)/d.y; return c.position.clone().add(d.multiplyScalar(t)); }
  // ---------- SET NOTTE: finestra, giardino, gelso, cratere ----------
  const SETS=[]; const night={}, room={}, macro={};
  async function buildNight(){ const s=new THREE.Scene(); night.scene=s; s.background=new THREE.Color(0x04060d); s.environment=ENV; s.fog=new THREE.FogExp2(0x0a0c1c,.012);
    const cn=ftex('cielo_notte','panorama'), PH=!!cn;
    if(PH){ cn.mapping=THREE.EquirectangularReflectionMapping; const dome=new THREE.Mesh(new THREE.SphereGeometry(400,48,24),new THREE.MeshBasicMaterial({map:cn,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false})); dome.rotation.y=Math.PI; dome.renderOrder=-10; s.add(dome); s.fog=null; night.stars=stars(1); night.stars.visible=false; s.add(night.stars); }
    else { s.add(skyDome()); night.stars=stars(1400); s.add(night.stars); const moon=sprite(0xdfe6ff,34,.9); moon.position.set(110,150,-300); s.add(moon); const moonCore=new THREE.Mesh(new THREE.SphereGeometry(5,24,16),new THREE.MeshBasicMaterial({color:0xf2f4ff})); moonCore.position.copy(moon.position); s.add(moonCore); }
    s.add(new THREE.HemisphereLight(0x6070b0,0x141008,.7)); const ml=new THREE.DirectionalLight(0xc8d2ff,1.3); ml.position.set(-70,90,40); ml.target.position.set(0,0,-22); s.add(ml.target); ml.castShadow=true; ml.shadow.mapSize.set(1024,1024); ml.shadow.camera.left=ml.shadow.camera.bottom=-12; ml.shadow.camera.right=ml.shadow.camera.top=12; ml.shadow.camera.near=1; ml.shadow.camera.far=300; ml.shadow.bias=-.0008; s.add(ml); night.moonLight=ml;
    // casa: parete interna e finestra (z=0 è il vetro, dentro z>0)
    const wm=new THREE.MeshStandardMaterial({map:texPlaster(THREE),roughness:.9,color:0x6a6878}); const wp=(x,y,sx,sy)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),wm); m.position.set(x,y,.5); s.add(m); }; wp(-25,20,40,60); wp(25,20,40,60); wp(0,-8,10,30); wp(0,36,10,30);
    const win=await slot('finestra',14); win.position.set(0,7,0); s.add(win); night.win=win; if(PH) win.traverse(o=>{ if(o.isMesh&&o.material&&o.material.map&&o.material.color) o.material.color.set(0x70748e); });
    // giardino fuori, gelso, casa lontana
    const gard=await slot('giardino',20); gard.position.set(4,0,-22); s.add(gard); night.gard=gard; night.landing=V3(4,0,-22);
    const tree=await slot('gelso',40); tree.position.set(9,0,-34); s.add(tree); night.tree=tree;
    const far=new THREE.Mesh(new THREE.BoxGeometry(60,16,14),new THREE.MeshStandardMaterial({color:0x090c16,roughness:1})); far.position.set(-30,8,-90); s.add(far); const lit=new THREE.Mesh(new THREE.PlaneGeometry(4,5),new THREE.MeshBasicMaterial({color:0xffd48a})); lit.position.set(-26,8,-82.9); s.add(lit); const litG=sprite(0xffc070,22,.5); litG.position.copy(lit.position); s.add(litG);
    const hedge=new THREE.Mesh(new THREE.BoxGeometry(80,7,6),new THREE.MeshStandardMaterial({color:0x0e1a10,roughness:1})); hedge.position.set(0,3,-60); s.add(hedge); if(PH){ far.visible=lit.visible=litG.visible=hedge.visible=false; }
    // stella
    night.star=new THREE.Group(); const core=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),new THREE.MeshBasicMaterial({color:0xffffff})); night.star.add(core); night.starGlow=sprite(0xfff0c8,4,.9); night.star.add(night.starGlow); night.starRing=disc(1,0xffffff); night.starRing.scale.setScalar(3); night.star.add(night.starRing); s.add(night.star);
    night.trail=[]; for(let i=0;i<14;i++){ const sp=sprite(0xffe6b4,1.6*(1-i/16),.55*(1-i/15)); sp.visible=false; s.add(sp); night.trail.push(sp); }
    night.flash=sprite(0xffe8c8,1,1); night.flash.visible=false; s.add(night.flash); night.flashRing=disc(1,0xffe6c0); night.flashRing.visible=false; s.add(night.flashRing); night.flashLight=new THREE.PointLight(0xffd8a0,0,60,2); s.add(night.flashLight);
    // cratere: fumo, sasso caldo, luce
    night.smoke=[]; for(let i=0;i<12;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.soft,color:0x8a8a90,transparent:true,opacity:.2,depthWrite:false})); sp.visible=false; s.add(sp); night.smoke.push(sp); }
    night.stone=await slot('meteorite',.42); s.add(night.stone); night.stone.visible=false; night.stoneLight=new THREE.PointLight(0xff8a48,0,4,2); s.add(night.stoneLight); night.violet=new THREE.PointLight(VIOLA,0,5,2); s.add(night.violet);
    night.holdRing=disc(1,0xcfc0ff); night.holdRing.visible=false; s.add(night.holdRing); night.hint=disc(1,0xcfc0ff); night.hint.visible=false; s.add(night.hint);
    const hand=await slot('mano',1.4); night.hand=hand; hand.visible=false; s.add(hand);
    night.camWin=cam(68); night.camWin.position.set(-2.5,9.6,8.5); night.camWin.lookAt(-2.4,8.4,-20); night.camGar=cam(50); SETS.push(night); night.cam=night.camWin; return s; }
  // ---------- SET STANZA: scrivania, barattolo, finestra, lampada, quaderno ----------
  async function buildRoom(){ const s=new THREE.Scene(); room.scene=s; s.environment=ENV; s.background=new THREE.Color(0x0d0b10);
    const desk=await slot('scrivania',14); s.add(desk); const jar=await slot('barattolo',1.6); s.add(jar); room.jar=jar; room.lid=null; jar.traverse(o=>{ if(o.name==='lid') room.lid=o; if(o.name==='vetro') room.glass=o; });
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(40,24),new THREE.MeshStandardMaterial({map:texPlaster(THREE),roughness:.92,color:0x8a8488})); wall.position.set(0,8,-4); wall.receiveShadow=true; s.add(wall);
    const win=await slot('finestra',14); win.scale.setScalar(.5); win.position.set(-4.6,1.6,-3.9); s.add(win); room.win=win; room.winHole=new THREE.Mesh(new THREE.PlaneGeometry(5,7),new THREE.MeshBasicMaterial({color:0x8fb4ff})); room.winHole.position.set(-4.6,5.1,-3.95); { const cg=ftex('cielo_giorno','panorama'); if(cg){ cg.repeat.set(.18,.5); cg.offset.set(.28,.3); room.winHole.material.dispose(); room.winHole.material=new THREE.MeshBasicMaterial({map:cg,toneMapped:false}); room.winTex=true; } } s.add(room.winHole);
    const lamp=await slot('lampada',6); lamp.scale.setScalar(.75); lamp.position.set(4.3,0,-1.3); lamp.rotation.y=-.25; s.add(lamp); room.lamp=lamp; room.bulb=null; lamp.traverse(o=>{ if(o.name==='bulb') room.bulb=o; }); lamp.updateMatrixWorld(true); room.lampLight=new THREE.PointLight(0xffd090,0,14,2); if(room.bulb) room.bulb.getWorldPosition(room.lampLight.position); else room.lampLight.position.set(1.8,3.4,.4); room.lampLight.castShadow=true; room.lampLight.shadow.mapSize.set(512,512); room.lampLight.shadow.bias=-.002; s.add(room.lampLight);
    const nb=await slot('quaderno',3); nb.position.set(-1.6,0,1.1); nb.rotation.y=.5; s.add(nb);
    s.add(new THREE.HemisphereLight(0x8090b0,0x2a1e14,.25)); room.amb=s.children[s.children.length-1];
    room.sun=new THREE.DirectionalLight(0xfff0d8,0); room.sun.position.set(-7,9,-1); room.sun.target.position.set(0,.5,.5); s.add(room.sun.target); room.sun.castShadow=true; room.sun.shadow.mapSize.set(1024,1024); room.sun.shadow.camera.left=room.sun.shadow.camera.bottom=-6; room.sun.shadow.camera.right=room.sun.shadow.camera.top=6; room.sun.shadow.camera.near=1; room.sun.shadow.camera.far=30; room.sun.shadow.bias=-.0006; s.add(room.sun);
    // lama di luce dalla finestra
    const shaft=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({vertexShader:DISC_VS,fragmentShader:'uniform float uA; varying vec2 vUv; void main(){ float a=smoothstep(0.0,.35,vUv.x)*smoothstep(1.0,.5,vUv.x)*smoothstep(0.0,.3,vUv.y)*smoothstep(1.0,.7,vUv.y); gl_FragColor=vec4(vec3(1.0,.9,.7)*a*uA,a*uA); }',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uA:{value:0}}})); shaft.position.set(-2.2,2.6,-1.2); shaft.rotation.set(0,.5,-.6); shaft.scale.set(7,4.5,1); s.add(shaft); room.shaft=shaft;
    room.stone=await slot('meteorite',.42); s.add(room.stone); room.violet=new THREE.PointLight(VIOLA,0,4,2); s.add(room.violet);
    room.hintLine=[]; for(let i=0;i<7;i++){ const d=disc(0,0xcfc0ff); d.scale.setScalar(.1); d.visible=false; s.add(d); room.hintLine.push(d); }
    room.drops=new THREE.InstancedMesh(new THREE.SphereGeometry(.018,6,5),new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:0,transmission:.6,transparent:true,opacity:.8}),40); const M=new THREE.Matrix4(); for(let i=0;i<40;i++){ const a=rnd(i+20)*6.28; M.makeTranslation(Math.cos(a)*.565,.25+rnd(i+21)*1.0,Math.sin(a)*.565); room.drops.setMatrixAt(i,M); } room.drops.visible=false; s.add(room.drops);
    room.cam=cam(46); room.cam.position.set(1.1,1.7,3.3); room.cam.lookAt(0,.8,0); SETS.push(room); return s; }
  // ---------- SET MACRO: il sasso che batte ----------
  async function buildMacro(){ const s=new THREE.Scene(); macro.scene=s; s.background=new THREE.Color(0x07060f); s.environment=ENV;
    macro.stone=await slot('meteorite',.42); macro.stone.scale.setScalar(2.2); s.add(macro.stone); macro.violet=new THREE.PointLight(VIOLA,6,8,2); macro.violet.position.set(0,1.2,.8); s.add(macro.violet);
    const rim1=new THREE.DirectionalLight(0x9fb4ff,.9); rim1.position.set(-3,2,-2); s.add(rim1); const rim2=new THREE.DirectionalLight(0xffd8c0,.5); rim2.position.set(3,1,2); s.add(rim2); s.add(new THREE.AmbientLight(0x404060,.3));
    macro.glow=disc(0,VIOLA); macro.glow.scale.setScalar(4); macro.glow.position.set(0,.5,-.2); s.add(macro.glow);
    macro.rings=[]; for(let i=0;i<6;i++){ const r=disc(1,0xcfc0ff); r.visible=false; r.position.set(0,.5,.3); s.add(r); macro.rings.push(r); }
    macro.orbs=[]; for(let i=0;i<6;i++){ const o=new THREE.Group(); const c=new THREE.Mesh(new THREE.SphereGeometry(.07,12,10),new THREE.MeshStandardMaterial({color:0xffffff,emissive:[0xffd080,0xffe8a0,0xaaf0ff,0xffb080,0x7CF5C8,0xA88BFF][i],emissiveIntensity:3,roughness:.4})); o.add(c); const gl=sprite([0xffd080,0xffe8a0,0xaaf0ff,0xffb080,0x7CF5C8,0xA88BFF][i],.6,.8); o.add(gl); o.visible=false; s.add(o); macro.orbs.push(o); }
    macro.dust=stars(300); macro.dust.scale.setScalar(.006); macro.dust.position.set(0,.5,0); s.add(macro.dust);
    macro.cam=cam(42); macro.cam.position.set(.5,1.3,3.4); macro.cam.lookAt(0,.5,0); SETS.push(macro); return s; }
  await Promise.all([buildNight(),buildRoom(),buildMacro()]); fit();
  // ---------- aggiornamento per scena ----------
  const stoneHeat=(st_,k)=>{ st_.traverse(o=>{ if(o.isMesh&&o.material&&o.material.emissive){ o.material.emissive.set(VIOLA); o.material.emissiveIntensity=.15+k*2.6; } }); };
  let fallenLast=null, bob=0;
  function frameCielo(t,C){ const st=C.st, c=night.camWin; night.cam=c; night.stone.visible=false; night.smoke.forEach(s=>s.visible=false); night.holdRing.visible=false; night.hint.visible=false; night.stoneLight.intensity=0; night.violet.intensity=0;
    const P0=unproj(c,.5,.22,120); const land=rayGround(c,.66,.70,0)||V3(1.3,0,-18); if(!st.p0){ st.p0=P0; st.p1=land; night.landing.copy(land); night.gard.position.copy(land); night.gard.position.x=land.x; night.gard.position.z=land.z; }
    const f=st.v.fall; let p=st.p0.clone(); if(st.fall==null){ p.x+=Math.sin(t/900)*.4; p.y+=Math.cos(t/700)*.4; } else { p.lerpVectors(st.p0,st.p1,f); p.y=lerp(st.p0.y,st.p1.y+.2,f*f); }
    night.star.position.copy(p); night.starGlow.scale.setScalar(st.fall==null?4+Math.sin(t/300)*.5:3); night.starRing.visible=st.active&&st.fall==null; night.starRing.quaternion.copy(c.quaternion); night.starRing.material.uniforms.uA.value=.25+.3*Math.sin(t/300)**2; night.starRing.material.uniforms.uR.value=.8+.08*Math.sin(t/300); night.starRing.scale.setScalar(5);
    night.trail.forEach((sp,i)=>{ if(st.fall==null||f>=1){ sp.visible=false; return; } const ff=Math.max(0,f-(i+1)*.015); sp.visible=ff>0; sp.position.lerpVectors(st.p0,st.p1,ff); sp.position.y=lerp(st.p0.y,st.p1.y+.2,ff*ff); });
    night.star.visible=!(st.hit&&f>=1&&(t-st.hit)>300);
    if(st.hit){ const k=(t-st.hit)/700; night.flash.visible=k<1.6; night.flash.position.copy(st.p1).add(V3(0,.6,0)); night.flash.scale.setScalar(3+k*22); night.flash.material.opacity=Math.max(0,.9*(1-k/1.6)); night.flashRing.visible=k<1.2; night.flashRing.position.copy(night.flash.position); night.flashRing.quaternion.copy(c.quaternion); night.flashRing.scale.setScalar(2+k*18); night.flashRing.material.uniforms.uA.value=Math.max(0,1-k); night.flashRing.material.uniforms.uR.value=.9; night.flashRing.material.uniforms.uW.value=.05; night.flashLight.position.copy(night.flash.position).add(V3(0,2,0)); night.flashLight.intensity=Math.max(0,1-k)*600; } else { night.flash.visible=night.flashRing.visible=false; night.flashLight.intensity=0; }
    night.stars.material.uniforms.uT.value=t; night.stars.material.uniforms.uDpr.value=dpr; }
  function frameGiardino(t,C){ const st=C.st, c=night.camGar; night.cam=c; night.star.visible=false; night.starRing.visible=false; night.trail.forEach(s=>s.visible=false); night.flash.visible=night.flashRing.visible=false; night.flashLight.intensity=0;
    const L=night.landing; if(!st.camSet){ st.camSet=1; c.position.set(L.x-1.6,2.9,L.z+3.6); c.lookAt(L.x+.1,-.3,L.z); c.updateMatrixWorld(); }
    night.stone.visible=true; const lift=st.v.lift; let pos=L.clone(); pos.y=-.5; let heat=.5+.5*Math.sin(t/(st.lift?300:600)); night.stone.rotation.y=.4+Math.sin(t/4000)*.1;
    if(st.lift){ const target=unproj(c,.5,.5,1.0); pos.lerpVectors(pos,target,lift); night.stone.rotation.y+=lift*1.2; night.stone.rotation.x=-lift*.5; }
    night.stone.position.copy(pos); stoneHeat(night.stone,heat); night.stoneLight.position.copy(pos).add(V3(0,.5,.3)); night.stoneLight.intensity=.35+heat*.6; night.violet.position.copy(pos).add(V3(0,.35,.4)); night.violet.intensity=.5+heat*1.4;
    if(night.hand.children.length&&night.hand.children[0].children.length){ night.hand.visible=!!st.lift; night.hand.position.copy(pos).add(V3(0,-.2,0)); }
    night.smoke.forEach((sp,i)=>{ const k=((t/1000)*(.08+rnd(i)*.05)+rnd(i+1))%1; sp.visible=!st.lift||lift<.4; sp.position.set(L.x+Math.sin(i*2.1+k*3)*(.3+k*.6),-.3+k*2.4,L.z+Math.cos(i*1.7+k*2)*(.3+k*.5)); sp.scale.setScalar(.6+k*2.4); sp.material.opacity=.16*(1-k)*(1-(st.lift?lift:0)); });
    night.holdRing.visible=!!(st.hold&&!st.lift); if(night.holdRing.visible){ night.holdRing.position.copy(L).add(V3(0,-.3,0)); night.holdRing.quaternion.copy(c.quaternion); night.holdRing.scale.setScalar(1.1); const u=night.holdRing.material.uniforms; u.uFrac.value=Math.min(1,st.v.hold); u.uR.value=.8; u.uW.value=.07; u.uA.value=1; }
    night.hint.visible=!!(st.active&&!st.lift&&!st.hold); if(night.hint.visible){ night.hint.position.copy(L).add(V3(0,-.3,0)); night.hint.quaternion.copy(c.quaternion); night.hint.scale.setScalar(1.1); const u=night.hint.material.uniforms; u.uFrac.value=1; u.uR.value=.8+.06*Math.sin(t/300); u.uW.value=.05; u.uA.value=.25+.3*Math.sin(t/300)**2; }
    const sh=night.gard; sh.traverse(o=>{ if(o.material&&o.material.userData.sh) o.material.userData.sh.uniforms.uT.value=t; }); night.stars.material.uniforms.uT.value=t; }
  function setLuce(lum){ const li=[.25,.6,1][lum==null?1:lum]; room.sun.intensity=lum==null?1.2:[0,1.6,3.6][lum]; room.winHole.material.color.set(room.winTex?(lum===2?0xffffff:lum===0?0x34405a:0xc4d2ee):(lum===2?0xfff0c8:lum===0?0x2a3550:0x8fb4ff)); room.shaft.material.uniforms.uA.value=lum==null?.35:[0,.45,.9][lum]; const lampOn=lum===0||lum==null; room.lampLight.intensity=lampOn?26:6; if(room.bulb) room.bulb.material.emissiveIntensity=lampOn?2.5:.6; room.amb.intensity=.18+.25*li; room.scene.background.set(lum===2?0x2a2220:lum===0?0x0a1020:0x16141c); }
  function frameRoom(t,C){ const st=C.st, id=C.id, c=room.cam; const lum=id==='barattolo'?1:(C.P.luce==null?1:C.P.luce); setLuce(id==='barattolo'?null:lum);
    const wide=id!=='barattolo'; const asp=Math.max(.35,W/H), hw=wide?1.55:1.0, dd=hw/(Math.tan(c.fov*Math.PI/360)*asp); const dir=wide?V3(.32,.42,1).normalize():V3(.28,.3,1).normalize(); const want=dir.multiplyScalar(dd).add(V3(0,wide?1.2:.75,0)); if(!room.cp) room.cp=want.clone(); room.cp.lerp(want,C.fast?1:.04); c.position.set(room.cp.x+Math.sin(t/5000)*.12,room.cp.y+Math.sin(t/7000)*.06,room.cp.z); c.lookAt(0,wide?1.0:.75,0);
    const per=[1900,1250,780][lum]; let pulse=.5+.5*Math.sin(t/per*3.14); let lid=1, spos=V3(0,.12,0), inside=true;
    if(id==='barattolo'){ inside=false; lid=-1; if(st.drop){ const f=st.v.drop; const from=st.world||unproj(c,.5,.2,c.position.distanceTo(V3(0,.75,0))*.8); spos=from.clone().lerp(V3(0,.12,0),f); spos.y+=Math.sin(f*3.14)*.3*(1-f); inside=f>=1; if(inside){ pulse=.5+.5*Math.sin((t-st.thump)/180); lid=st.v.lid; } else pulse=.3; }
      else { const px=st.stone?st.stone.x/(W*dpr):.5, py=st.stone?st.stone.y/(H*dpr):.2+Math.sin(t/600)*.005; spos=unproj(c,px,py,c.position.distanceTo(V3(0,.75,0))*.8); st.world=spos.clone(); pulse=.3; } }
    else if(id==='nome'){ lid=st.end?Math.min(1,st.v.end*1.6):0; pulse=.5+.5*Math.sin(t/(900-Math.min(500,(st.v.end||0)*500))); }
    room.stone.position.copy(spos); room.stone.rotation.y=t/9000; stoneHeat(room.stone,inside||id!=='barattolo'?pulse:.35); room.violet.position.copy(spos).add(V3(0,.3,.2)); room.violet.intensity=(inside||id!=='barattolo'?pulse:.3)*2.2;
    if(room.lid){ const open=lid<0?1:1-lid; const a=Math.min(1,open*1.6), arc=Math.sin(Math.min(1,open)*Math.PI)*.5; room.lid.position.set(-1.05*a,1.55*(1-a)+arc,.55*a); room.lid.rotation.set(0,a*.8,0); }
    room.drops.visible=id!=='barattolo'; room.hintLine.forEach((d,i)=>{ const on=id==='barattolo'&&!st.drop&&st.active; d.visible=on; if(on){ d.position.lerpVectors(spos,V3(0,1.7,0),(i+1)/8); d.quaternion.copy(c.quaternion); d.material.uniforms.uA.value=.35+.3*Math.sin(t/300+i)**2; } }); }
  function frameLegenda(t,C){ const st=C.st, c=macro.cam; const pu=.5+.5*Math.sin(t/(st.boost?260:520)); stoneHeat(macro.stone,pu); macro.stone.rotation.y=t/6000; macro.violet.intensity=4+pu*9; macro.glow.quaternion.copy(c.quaternion); macro.glow.material.uniforms.uA.value=.25+.3*pu; macro.dust.material.uniforms.uT.value=t; macro.dust.rotation.y=t/20000;
    macro.rings.forEach((r,i)=>{ const r0=(st.rings||[])[((st.rings||[]).length-1-i)]; if(r0==null){ r.visible=false; return; } const k=(t-r0)/1400; r.visible=k<1; if(k<1){ r.quaternion.copy(c.quaternion); r.scale.setScalar(.6+k*3.6); const u=r.material.uniforms; u.uA.value=.8*(1-k); u.uR.value=.9; u.uW.value=.06; u.uFrac.value=1; } });
    const show=C.lineI===0?1:C.lineI===1?5:6; macro.orbs.forEach((o,i)=>{ const on=i<show; if(on&&!(st.chainT&&st.chainT[i])) (st.chainT=st.chainT||[])[i]=t+i*120; const ap=st.chainT&&st.chainT[i]?Math.min(1,Math.max(0,(t-st.chainT[i])/600)):0; o.visible=on&&ap>0; const a=i/6*6.28-1.57+t/9000; o.position.set(Math.cos(a)*.62,.5+Math.sin(a)*1.0+Math.sin(t/800+i)*.05,.5+Math.cos(a)*.3); o.scale.setScalar(ap); }); }
  // ---------- guardia prestazioni ----------
  let lastT=0, acc=0, nF=0, slowSince=0;
  function guard(t){ if(C_fast()) return; if(lastT){ const dt=t-lastT; acc+=dt; nF++; if(nF>=60){ const avg=acc/nF; acc=0; nF=0; if(avg>22){ slowSince=slowSince||t; if(t-slowSince>2500){ slowSince=0; bump(); } } else slowSince=0; } } lastT=t; }
  function bump(){ level++; if(level===1){ dpr=1; fit(); renderer.shadowMap.enabled=false; } else if(level===2){ if(room.glass){ room.glass.material=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.05,transparent:true,opacity:.18,clearcoat:1,side:THREE.DoubleSide,depthWrite:false}); } } else if(opts.onFallback) opts.onFallback('lento'); }
  const C_fast=()=>!!window.__fast;
  let curId=null;
  function frame(t,C){ guard(t); const id=C.id; if(!id) return; let set;
    if(id==='cielo'){ frameCielo(t,C); set=night; } else if(id==='giardino'){ frameGiardino(t,C); set=night; } else if(id==='legenda'){ frameLegenda(t,C); set=macro; } else { frameRoom(t,C); set=room; }
    if(set.cam.aspect!==W/H){ set.cam.aspect=W/H; set.cam.updateProjectionMatrix(); } renderer.render(set.scene,set.cam); curId=id; }
  function anchors(id){ const out={center:{x:W*dpr*.5,y:H*dpr*.5}};
    if(id==='cielo'){ const c=night.camWin; const p=night.star.position.lengthSq()?night.star.position:unproj(c,.5,.22,120); out.star=proj(c,p); }
    else if(id==='giardino'){ const c=night.camGar; c.updateMatrixWorld(); out.stone=proj(c,night.landing.clone().add(V3(0,-.3,0))); if(!(out.stone.x>0&&out.stone.x<W*dpr)) out.stone={x:W*dpr*.66,y:H*dpr*.84}; }
    else { const c=room.cam; const top=proj(c,V3(0,1.75,0)), bot=proj(c,V3(0,0,0)), l=proj(c,V3(-.6,.8,.6)), r=proj(c,V3(.6,.8,.6)); const jw=Math.abs(r.x-l.x)*1.25, jh=Math.abs(bot.y-top.y); out.jar={cx:(l.x+r.x)/2,x0:(l.x+r.x)/2-jw/2,y0:top.y,jw,jh}; out.stone=room.stone.position.lengthSq()?proj(c,room.stone.position):proj(c,unproj(c,.5,.2,c.position.distanceTo(V3(0,.75,0))*.8)); }
    return out; }
  function dispose(){ try{ SETS.forEach(s=>s.scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); } })); renderer.dispose(); }catch(e){} canvas.remove(); }
  function info(){ return {renderer:renderer.info.render.calls,tris:renderer.info.render.triangles,level,slots:Object.assign({},used)}; }
  window.__apDbg={renderer,night,room,macro,THREE};
  return {kind:'3d',canvas,fit,size:()=>({w:W*dpr,h:H*dpr,dpr}),frame,anchors,dispose,info,slots:used};
}
window.__APERTURA={create,SLOTS};
})();
