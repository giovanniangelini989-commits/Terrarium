(function(){
'use strict';
const A=window.__app, T=A.T;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const hashStr=s=>{ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
const rngS=seed=>{ let s=(seed>>>0)||1; return ()=>{ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
window.__v3dLoad=function(){ if(window.__v3d) return Promise.resolve(window.__v3d); return window.__v3dP||(window.__v3dP=(async()=>{ try{ const THREE=await import('three'); window.__v3d=build(THREE); return window.__v3d; }catch(e){ window.__v3dP=null; throw e; } })()); }; // una sola costruzione anche con chiamate concorrenti (menu + tentativo automatico)
function build(THREE){
  const V3=THREE.Vector3, Col=THREE.Color;
  const canvas=document.createElement('canvas'); canvas.className='v3d'; canvas.style.touchAction='none';
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);
  const TX=window.__TEX||null, TL=new THREE.TextureLoader(); const ptex=(k,rep,srgb=true)=>{ if(!TX||!TX[k]) return null; const t=TL.load(TX[k]); t.wrapS=t.wrapT=THREE.RepeatWrapping; if(rep) t.repeat.set(rep,rep); if(srgb) t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; };
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(36,1.2,.1,60);
  // ---------- luci (app/luci.js) ----------
  const LU=window.__LUCI(THREE,{scene,renderer,camera});
  // ---------- tavolo ----------
  (function(){ const c=document.createElement('canvas'); c.width=c.height=512; const g=c.getContext('2d'); g.fillStyle='#7a5230'; g.fillRect(0,0,512,512); const r=rngS(7); for(let i=0;i<90;i++){ g.strokeStyle='rgba('+(40+r()*40|0)+','+(20+r()*20|0)+',10,'+(.12+r()*.2)+')'; g.lineWidth=1+r()*3; g.beginPath(); const y=r()*512; g.moveTo(0,y); g.bezierCurveTo(170,y+r()*14-7,340,y+r()*14-7,512,y+r()*10-5); g.stroke(); } const tx=new THREE.CanvasTexture(c); tx.colorSpace=THREE.SRGBColorSpace; tx.wrapS=tx.wrapT=THREE.RepeatWrapping; tx.repeat.set(3,3);
    const wtx=ptex('wood_col',3); const table=new THREE.Mesh(new THREE.CylinderGeometry(3.6,3.6,.2,72),new THREE.MeshStandardMaterial(wtx?{map:wtx,color:0xc29a72,roughness:.5}:{map:tx,roughness:.82})); table.position.y=-.1; table.receiveShadow=true; scene.add(table);
    scene.userData.table=table; })();
  // ---------- vaso ----------
  const jar=new THREE.Group(); scene.add(jar);
  const prof=[[0,0],[.70,0],[.88,.05],[.97,.18],[1,.4],[1,1.9],[.96,2.08],[.82,2.18],[.78,2.24],[.78,2.34]].map(p=>new THREE.Vector2(p[0],p[1]));
  const glassGeo=new THREE.LatheGeometry(prof,96);
  const glass=new THREE.Mesh(glassGeo,new THREE.MeshPhysicalMaterial({color:0x000000,transparent:true,opacity:1,blending:THREE.AdditiveBlending,roughness:.05,metalness:0,clearcoat:.35,clearcoatRoughness:.03,specularIntensity:.7,envMapIntensity:.9,side:THREE.FrontSide,depthWrite:false})); glass.renderOrder=6; jar.add(glass);
  const rim=new THREE.Mesh(glassGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{},vertexShader:'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',fragmentShader:'varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),3.); vec3 c=mix(vec3(.72,.9,1.),vec3(1.,.72,.42),smoothstep(-.2,.85,normalize(vN).x*.9-normalize(vN).y*.25)); gl_FragColor=vec4(c*f*.6,f*.55); }'})); rim.renderOrder=7; jar.add(rim); [glass.material,rim.material].forEach(m=>{ m.blending=THREE.CustomBlending; m.blendEquation=THREE.AddEquation; m.blendSrc=THREE.OneFactor; m.blendDst=THREE.OneFactor; m.blendSrcAlpha=THREE.ZeroFactor; m.blendDstAlpha=THREE.OneFactor; m.needsUpdate=true; });
  // filetto e labbro del collo (vetro che cattura la luce: il barattolo si legge anche contro la finestra)
  [[2.34,.032],[2.27,.02],[2.2,.02]].forEach(([y,r])=>{ const t=new THREE.Mesh(new THREE.TorusGeometry(.8,r,8,64),rim.material); t.rotation.x=Math.PI/2; t.position.y=y; t.renderOrder=6; jar.add(t); });
  { const sp=new THREE.Mesh(new THREE.LatheGeometry(prof.slice(5),96),rim.material); sp.scale.set(1.004,1,1.004); sp.renderOrder=7; jar.add(sp); } // spalla e collo: il vetro si legge fino al tappo
  // bordo fumé del vetro: contro la finestra luminosa il vetro additivo sparisce, il bordo scuro (spessore, verde bottiglia) lo fa leggere sempre, collo e spalla compresi
  { const sm=new THREE.Mesh(glassGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{},vertexShader:'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',fragmentShader:'varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.2); gl_FragColor=vec4(vec3(.16,.24,.22),pow(clamp(f*.8,0.,1.),.45)); }'})); sm.scale.set(1.002,1,1.002); sm.renderOrder=8; jar.add(sm); }
  // coperchio a vite: tappo metallico (oro arrugginito dalla foto «coperchio»), avvitato sul collo; lato e piano hanno materiali separati
  const corkMk=()=>new THREE.MeshStandardMaterial({color:0x9a7a2e,metalness:.9,roughness:.45}); const corkMats=[corkMk(),corkMk(),corkMk()]; const cork=new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.34,64),corkMats); cork.position.y=2.39; cork.castShadow=true; jar.add(cork);
  // ---------- terreno: strati visibili dal vetro (ghiaia di drenaggio, rete, terriccio) con PBR generato in codice (app/materials.js → __TERRENO) ----------
  // Scala: 1 unità = 10 cm. Ghiaia 0 → GH (1,9 cm), rete a SOIL0, terriccio da SOIL0 a S.soilTop, disco in rilievo sopra (grani e sassolini veri, ±3 mm).
  const SOIL0=.2, GH=.19, AMP=.032, DISC_REP=1.9; // DISC_REP: tessere da 10 cm sul disco Ø 19 cm
  // ---------- materiali fotografici (foto vere di Giovanni: assets/materiali/<id>, incorporate da build_app.py in window.__MAT_FOTO) ----------
  // FOTO_SCALA: lato della foto in unità (1 unità = 10 cm); null = immagine singola non ripetibile (fronda scontornata).
  const MF=window.__MAT_FOTO||null, FOTO_SCALA={terriccio:1,ghiaia:.6,muschio:.5,muffa:.6,muschio_secco:.5,legno:3,coperchio:null,vetro_sporco:null,foglia_felce:null,foglia_succulenta:null,fungo:null,drosera:null,funghi_magici:null,carnivora_magica:null,foglia_magica:null}, FOTOS={};
  function fotoMat(id){ if(FOTOS[id]!==undefined) return FOTOS[id]; const src=MF&&MF[id]; if(!src||!(src.colore||src.maschera)) return FOTOS[id]=null;
    const scala=FOTO_SCALA[id]===undefined?1:FOTO_SCALA[id], F={id,scala,ready:false,img:{},H:null,N:0,cache:{},q:[]}, keys=Object.keys(src); let left=keys.length;
    const done=()=>{ F.ready=!!(F.img.colore||F.img.maschera); const q=F.q; F.q=[]; if(F.ready) q.forEach(cb=>{ try{ cb(F); }catch(e){} }); };
    keys.forEach(k=>{ const im=new Image(); im.onload=()=>{ F.img[k]=im; if(k==='altezza'){ const n=im.naturalWidth, c=document.createElement('canvas'); c.width=c.height=n; const g=c.getContext('2d'); g.drawImage(im,0,0); const d=g.getImageData(0,0,n,n).data, H=new Float32Array(n*n); for(let i=0;i<n*n;i++) H[i]=d[i*4]/255; F.H=H; F.N=n; } if(--left===0) done(); }; im.onerror=()=>{ if(--left===0) done(); }; im.src=src[k]; });
    F.when=cb=>{ if(F.ready) cb(F); else F.q.push(cb); };
    F.height=(u,v)=>{ if(!F.H) return .2; const n=F.N, x=Math.floor(((u%1)+1)%1*n), y=Math.floor(((1-v)%1+1)%1*n); return F.H[Math.min(n-1,y)*n+Math.min(n-1,x)]; };
    const half=im=>{ const c=document.createElement('canvas'); c.width=Math.max(1,im.naturalWidth>>1); c.height=Math.max(1,im.naturalHeight>>1); c.getContext('2d').drawImage(im,0,0,c.width,c.height); return c; };
    const mk=(im,srgb,small)=>{ const t=new THREE.Texture(small?half(im):im); t.wrapS=t.wrapT=scala==null?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping; if(srgb) t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; t.needsUpdate=true; return t; };
    // mappe per livello della guardia: 0 tutto · 1 colore+normale a metà risoluzione · 2 solo colore (metà)
    F.maps=l=>{ if(!F.ready) return null; l=Math.max(0,Math.min(2,l|0)); if(F.cache[l]) return F.cache[l]; const I=F.img, o={}; if(I.colore) o.map=mk(I.colore,true,l>0); if(l<2&&I.normale) o.normalMap=mk(I.normale,false,l>0); if(l<1&&I.ruvidezza) o.roughnessMap=mk(I.ruvidezza,false,false); if(I.maschera) o.mask=mk(I.maschera,false,l>0); return F.cache[l]=o; };
    return FOTOS[id]=F; }
  // rompe la ripetizione visibile: seconda lettura della stessa texture ruotata (34,6°) e scalata ×1,37, mescolata con un rumore a bassa frequenza
  const FOTO_GLSL=`float ftHash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float ftNoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(ftHash(i),ftHash(i+vec2(1.,0.)),f.x),mix(ftHash(i+vec2(0.,1.)),ftHash(i+vec2(1.,1.)),f.x),f.y); }
vec2 ftUv2(vec2 uv){ return vec2(.8229*uv.x-.5682*uv.y,.5682*uv.x+.8229*uv.y)*1.37+vec2(.31,.57); }
float ftMix(vec2 uv){ return smoothstep(.3,.7,ftNoise(uv*.43+vec2(3.7,1.3))); }
`;
  function fotoShader(sh){ sh.fragmentShader=sh.fragmentShader.replace('void main() {',FOTO_GLSL+'void main() {')
      .replace('vec4 sampledDiffuseColor = texture2D( map, vMapUv );','vec4 sampledDiffuseColor = mix(texture2D(map,vMapUv),texture2D(map,ftUv2(vMapUv)),ftMix(vMapUv));')
      .replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;','vec3 mapN; { vec3 n1=texture2D(normalMap,vNormalMapUv).xyz*2.-1., n2=texture2D(normalMap,ftUv2(vNormalMapUv)).xyz*2.-1.; n2.xy=vec2(.8229*n2.x+.5682*n2.y,-.5682*n2.x+.8229*n2.y); mapN=normalize(mix(n1,n2,ftMix(vNormalMapUv))); }')
      .replace('vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );','vec4 texelRoughness = mix(texture2D(roughnessMap,vRoughnessMapUv),texture2D(roughnessMap,ftUv2(vRoughnessMapUv)),ftMix(vRoughnessMapUv));'); return sh; }
  const antiTile=m=>{ m.onBeforeCompile=sh=>fotoShader(sh); m.customProgramCacheKey=()=>'foto'; return m; };
  const FOTO={mat:fotoMat,shader:fotoShader,antiTile,SCALA:FOTO_SCALA};
  // legno fotografico sulla scrivania
    const FW=fotoMat('legno'), table=scene.userData.table; if(FW&&table) FW.when(F=>{ const M=F.maps(1); if(!M) return; const rp=7.2/F.scala; [M.map,M.normalMap,M.roughnessMap].forEach(t=>{ if(t) t.repeat.set(rp,rp); }); const m=table.material; m.map=M.map; m.normalMap=M.normalMap||null; m.roughnessMap=M.roughnessMap||null; m.color.set(0xffffff); m.roughness=.62; m.needsUpdate=true; });
  // coperchio fotografico (foto intera mappata sul disco del tappo)
  { const FC=fotoMat('coperchio'); if(FC) FC.when(F=>{ const M=F.maps(1); if(!M) return;
    // fascia laterale: ritaglio centrale della foto (oro liscio con graffi), specchiato in orizzontale → tessera continua, nessuna cucitura né bordo della foto
    const side=(t)=>{ if(!t||!t.image) return null; const im=t.image, W=im.width||im.naturalWidth, H=im.height||im.naturalHeight, cw=Math.round(W*.6), ov=Math.round(cw*.25), T=cw-ov, ch=Math.round(H*.17), sx=W*.2, sy=H*.415, c=document.createElement('canvas'); c.width=T; c.height=ch; const g=c.getContext('2d'); g.drawImage(im,sx,sy,T,ch,0,0,T,ch);
      const m=document.createElement('canvas'); m.width=ov; m.height=ch; const mg=m.getContext('2d'); mg.drawImage(im,sx+T,sy,ov,ch,0,0,ov,ch); mg.globalCompositeOperation='destination-in'; const gr=mg.createLinearGradient(0,0,ov,0); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); mg.fillStyle=gr; mg.fillRect(0,0,ov,ch); g.drawImage(m,0,0); /* dissolvenza di chiusura: la coda della foto sfuma sull'inizio, la tessera si chiude da sola */
      const x=new THREE.CanvasTexture(c); x.wrapS=THREE.RepeatWrapping; x.wrapT=THREE.ClampToEdgeWrapping; x.repeat.set(2,1); x.anisotropy=4; if(t.colorSpace) x.colorSpace=t.colorSpace; return x; };
    [[corkMats[0],side(M.map),side(M.normalMap),side(M.roughnessMap)],[corkMats[1],M.map,M.normalMap,M.roughnessMap],[corkMats[2],M.map,M.normalMap,M.roughnessMap]].forEach(([m,mp,nm,rm])=>{ m.map=mp; m.normalMap=nm||null; m.roughnessMap=rm||null; m.color.set(0xd9a640); m.metalness=.92; m.roughness=.34; m.envMapIntensity=2.2; m.emissiveMap=null; m.emissiveIntensity=0; m.emissive.set(0x000000); m.needsUpdate=true; }); }); }
  const FT=fotoMat('terriccio'), FG=fotoMat('ghiaia'); // terriccio e ghiaia fotografici; senza __MAT_FOTO resta il terreno procedurale
  const TG=window.__TERRENO?{terra:FT?null:window.__TERRENO(THREE,{kind:'terra',seed:17}),ghiaia:FG?null:window.__TERRENO(THREE,{kind:'ghiaia',seed:29})}:null, TMAPS={};
  const terraMaps=l=>{ l=Math.max(0,Math.min(2,l|0)); if(TMAPS[l]) return TMAPS[l]; const p=Math.min(l,1), t=FT&&FT.ready?FT.maps(l):TG&&TG.terra?TG.terra.maps(p?.5:1):null, g=FG&&FG.ready?FG.maps(l):TG&&TG.ghiaia?TG.ghiaia.maps(p?.5:1):null; if(!t&&!g) return null; const o={terra:t,ghiaia:g}; if((!FT||FT.ready)&&(!FG||FG.ready)) TMAPS[l]=o; return o; };
  const soilMat=new THREE.MeshPhysicalMaterial(TG||FT?{color:0xffffff,roughness:1,metalness:0,clearcoat:0,clearcoatRoughness:.45}:TX?{map:ptex('Ground054_col',1.4),normalMap:ptex('Ground054_nor',1.4,false),color:0x7d6450,roughness:.95}:{color:0x6b4a30,roughness:.96});
  const sideMat=soilMat.clone(); sideMat.vertexColors=true; // parete del terriccio vista dal vetro: più scura verso il basso (colori dei vertici)
  const gravMat=new THREE.MeshStandardMaterial(TG||FG?{color:0xffffff,roughness:1}:TX?{map:ptex('Gravel023_col',2),normalMap:ptex('Gravel023_nor',2,false),color:0x9a968f,roughness:.92}:{color:0x8a8a86,roughness:.95});
  if(FT){ antiTile(soilMat); antiTile(sideMat); } if(FG) antiTile(gravMat);
  // ghiaia: profilo che segue il fondo del vaso
  const gravel=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.72,0],[.86,.05],[.94,.15],[.95,GH],[0,GH]].map(p=>new THREE.Vector2(p[0],p[1])),64),gravMat); gravel.receiveShadow=true; jar.add(gravel);
  const pebbles=(function(){ const geo=new THREE.IcosahedronGeometry(1,0), mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.72,flatShading:true}), n=40, im=new THREE.InstancedMesh(geo,mat,n), r=rngS(11), m=new THREE.Matrix4(), q=new THREE.Quaternion(), PC=FG?[0xf2eee6,0xd8d2c8,0xfaf6ee,0xc8c2b8,0xe8e0d2,0xd0c8b8]:[0x968e82,0x76706a,0xa09482,0x5c5650,0xb4aa98,0x86785f]; if(FG) FG.when(F=>{ mat.map=F.maps(0).map; mat.needsUpdate=true; }); for(let i=0;i<n;i++){ const a=r()*6.283, d=Math.sqrt(r())*.88, s=.018+r()*.03; m.compose(new V3(Math.cos(a)*d,GH-s*.3,Math.sin(a)*d),q.setFromEuler(new THREE.Euler(r()*3,r()*3,r()*3)),new V3(s,s*.7,s*(.8+r()*.4))); im.setMatrixAt(i,m); im.setColorAt(i,new Col(PC[(r()*PC.length)|0])); } im.receiveShadow=true; jar.add(im); return im; })();
  // rete tra ghiaia e terriccio
  const net=(function(){ const c=document.createElement('canvas'); c.width=256; c.height=16; const g=c.getContext('2d'); g.fillStyle='#262624'; g.fillRect(0,0,256,16); g.strokeStyle='rgba(128,124,112,.75)'; g.lineWidth=1; for(let x=0;x<256;x+=4){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+2,16); g.stroke(); } g.strokeStyle='rgba(96,92,84,.6)'; for(let y=1;y<16;y+=4){ g.beginPath(); g.moveTo(0,y); g.lineTo(256,y); g.stroke(); } const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=THREE.RepeatWrapping; t.repeat.set(24,1); const m=new THREE.Mesh(new THREE.CylinderGeometry(.957,.957,.012,64,1,true),new THREE.MeshStandardMaterial({map:t,roughness:.9})); m.position.y=SOIL0; jar.add(m); return m; })();
  // terriccio: parete aperta (il disco in rilievo chiude sopra)
  const soil=(function(){ const g=new THREE.CylinderGeometry(.95,.95,1,64,1,true), p=g.attributes.position, c=new Float32Array(p.count*3); for(let i=0;i<p.count;i++){ const k=.6+.4*(p.getY(i)+.5); c[i*3]=c[i*3+1]=c[i*3+2]=k; } g.setAttribute('color',new THREE.BufferAttribute(c,3)); const m=new THREE.Mesh(g,sideMat); m.receiveShadow=true; m.visible=false; jar.add(m); return m; })();
  const disc=(function(){ const RR=22, RS=64, pos=[], uv=[], idx=[]; for(let i=0;i<=RR;i++){ const rad=i/RR*.95, segs=i===0?1:RS; for(let j=0;j<segs;j++){ const a=j/RS*6.2831853; pos.push(Math.cos(a)*rad,0,Math.sin(a)*rad); uv.push(Math.cos(a)*rad/1.9+.5,Math.sin(a)*rad/1.9+.5); } }
    const base=i=>i===0?0:1+(i-1)*RS; for(let j=0;j<RS;j++) idx.push(0,base(1)+(j+1)%RS,base(1)+j); for(let i=1;i<RR;i++) for(let j=0;j<RS;j++){ const a=base(i)+j, b=base(i)+(j+1)%RS, c=base(i+1)+j, d=base(i+1)+(j+1)%RS; idx.push(a,d,c,a,b,d); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.userData.base=pos.slice(); const m=new THREE.Mesh(g,soilMat); m.receiveShadow=true; m.visible=false; jar.add(m); return m; })();
  const terraH=FT?FT.height:TG&&TG.terra?TG.terra.height:null; function discRelief(on){ const g=disc.geometry, p=g.attributes.position, b=g.userData.base, uv=g.attributes.uv; for(let i=0;i<p.count;i++){ const h=on&&terraH?terraH(uv.getX(i)*DISC_REP/(FT?FT.scala:1),uv.getY(i)*DISC_REP/(FT?FT.scala:1)):.2; p.setY(i,b[i*3+1]+.003+AMP*h); } p.needsUpdate=true; g.computeVertexNormals(); }
  discRelief(true);
  // linea d'acqua nella ghiaia (drenaggio pieno o ristagno): banda lucida tagliata al livello + menisco riflettente
  const waterPlane=new THREE.Plane(new V3(0,-1,0),0); renderer.localClippingEnabled=true;
  const CWATER=new Col(0x16262b), CMURK=new Col(0x4a4a24), CWTOP=new Col(0x7a8a8c);
  const waterMat=new THREE.MeshPhysicalMaterial({color:0x16262b,transparent:true,opacity:.6,roughness:.04,metalness:0,envMapIntensity:1.4,depthWrite:false,clippingPlanes:[waterPlane]});
  const water=new THREE.Mesh(new THREE.LatheGeometry([[.725,0],[.865,.05],[.945,.15],[.955,GH+.004]].map(p=>new THREE.Vector2(p[0],p[1])),64),waterMat); water.visible=false; water.renderOrder=2; jar.add(water);
  const waterTop=new THREE.Mesh(new THREE.RingGeometry(.78,.955,64),new THREE.MeshPhysicalMaterial({color:0x7a8a8c,transparent:true,opacity:.5,roughness:.03,metalness:0,envMapIntensity:1.6,depthWrite:false,side:THREE.DoubleSide})); waterTop.rotation.x=-Math.PI/2; waterTop.visible=false; waterTop.renderOrder=2; jar.add(waterTop);
  let terrainLvl=-1;
  const ST=FT?FT.scala:1, SG=FG?FG.scala:1; // scala reale: tessere da 10 cm (terriccio) e 6 cm (ghiaia); parete 2π·0,95 ≈ 60 cm, profilo della ghiaia ≈ 20 cm
  function terrainLevel(l,force){ l=Math.max(0,Math.min(2,l|0)); if(l===terrainLvl&&!force) return; terrainLvl=l; const M=terraMaps(l); if(!M) return; const full=l<2;
    const set=(m,src,rep)=>{ if(!src) return; const cl=t=>{ if(!t) return null; const c=t.clone(); c.repeat.set(rep[0],rep[1]); c.needsUpdate=true; return c; }; m.map=cl(src.map); m.normalMap=cl(src.normalMap); m.roughnessMap=cl(src.roughnessMap||src.orm); m.aoMap=src.orm?m.roughnessMap:null; if(m.normalMap) m.normalScale.set(1,1); m.needsUpdate=true; };
    set(soilMat,M.terra,[DISC_REP/ST,DISC_REP/ST]); set(sideMat,M.terra,[6/ST,.3/ST]); set(gravMat,M.ghiaia,[5.97/SG,1.99/SG]); discRelief(full); pebbles.visible=full; }
  terrainLevel(0); if(FT) FT.when(()=>terrainLevel(terrainLvl,true)); if(FG) FG.when(()=>terrainLevel(terrainLvl,true));
  const crackTex=(function(){ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'); g.strokeStyle='rgba(20,12,8,.85)'; g.lineWidth=2; const r=rngS(3); for(let i=0;i<14;i++){ let x=128,y=128,a=r()*6.283; g.beginPath(); g.moveTo(x,y); for(let k=0;k<7;k++){ a+=r()*1.2-.6; x+=Math.cos(a)*(14+r()*14); y+=Math.sin(a)*(14+r()*14); g.lineTo(x,y); } g.stroke(); } const t=new THREE.CanvasTexture(c); return t; })();
  const cracks=new THREE.Mesh(new THREE.CircleGeometry(.93,48),new THREE.MeshBasicMaterial({map:crackTex,transparent:true,opacity:0,depthWrite:false})); cracks.rotation.x=-Math.PI/2; cracks.visible=false; jar.add(cracks);
  // meteorite
  const stoneG=new THREE.Group(); jar.add(stoneG);
  const sgeo=new THREE.IcosahedronGeometry(.21,4); { const p=sgeo.attributes.position, r=rngS(21), ph=[r()*6,r()*6,r()*6]; for(let k=0;k<p.count;k++){ const x=p.getX(k),y=p.getY(k),z=p.getZ(k), n=Math.sin(x*23+ph[0])*Math.cos(y*19+ph[1])*.5+Math.sin(z*31+ph[2])*Math.cos(x*13+ph[1])*.35+Math.sin((x+y+z)*47)*.12, f=1+n*.1; p.setXYZ(k,x*f,y*f*.8,z*f); } sgeo.computeVertexNormals(); }
  const crackEm=(function(){ const c=document.createElement('canvas'); c.width=512; c.height=256; const g=c.getContext('2d'); g.fillStyle='#000'; g.fillRect(0,0,512,256); const r=rngS(33); g.lineCap='round'; g.lineJoin='round'; for(let i=0;i<16;i++){ let x=r()*512,y=40+r()*176,a=r()*6.28; g.beginPath(); g.moveTo(x,y); const n=6+(r()*8|0); for(let k=0;k<n;k++){ a+=r()*1.3-.65; x+=Math.cos(a)*(10+r()*18); y+=Math.sin(a)*(8+r()*14); g.lineTo(x,y); } g.strokeStyle='rgba(150,110,255,.35)'; g.lineWidth=7; g.stroke(); g.strokeStyle='rgb(205,176,255)'; g.lineWidth=2.4; g.stroke(); } const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; })();
  const rockTex=(function(){ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'); g.fillStyle='#3a3344'; g.fillRect(0,0,256,256); const r=rngS(8); for(let i=0;i<1600;i++){ g.fillStyle='rgba('+(r()<.5?'10,8,16':'110,98,130')+','+(.1+r()*.3)+')'; g.fillRect(r()*256,r()*256,1+r()*4,1+r()*3); } const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; })();
  const stoneMat=new THREE.MeshStandardMaterial({color:TX?0x5e5668:0xffffff,map:ptex('Rock030_col',1)||rockTex,normalMap:ptex('Rock030_nor',1,false),roughness:.9,metalness:.1,emissive:0xffffff,emissiveMap:crackEm,emissiveIntensity:.5}); const stone=new THREE.Mesh(sgeo,stoneMat); stone.castShadow=true; stoneG.add(stone);
  // ---------- sprite ed emoji ----------
  const emTex={}, emoji=(e,ring)=>{ const k=e+(ring?'r':''); if(emTex[k]) return emTex[k]; const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); if(ring){ g.fillStyle='rgba(255,255,255,.9)'; g.beginPath(); g.arc(64,64,58,0,6.283); g.fill(); } g.font=(ring?'64px':'96px')+' serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,64,ring?68:72); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return emTex[k]=t; };
  const glowTexCache={}, glowTex=col=>{ if(glowTexCache[col]) return glowTexCache[col]; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const rg=g.createRadialGradient(32,32,2,32,32,32); rg.addColorStop(0,col); rg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=rg; g.fillRect(0,0,64,64); return glowTexCache[col]=new THREE.CanvasTexture(c); };
  const mkSprite=(e,s,ring)=>{ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:emoji(e,ring),transparent:true,depthWrite:false})); sp.scale.set(s,s,1); sp.renderOrder=3; return sp; };
  const CPOOR=new Col(0x8a8274), CDRY=new Col(0xa58b64), CPOOR2=new Col(0x9a9690), MOSSWET=new Col(TX?0xb7d39c:0x3e8e68), MOSSDRY=new Col(TX?0x9c8c66:0x6e6b48), MOSSWETS=new Col(TX?0x6f9a52:0x5aa070), MOSSDRYS=new Col(0x8a7d58);
  // ---------- stato condiviso ----------
  const S={v:null,m:null,t:0,soilTop:SOIL0,soilGoal:SOIL0,dry:0,poor:0,wet:.5,wl:0,rist:0,moss:1,E:20,lastE:20,flash:0,night:false,n:{um:.6,ter:.6,pul:1}};
  const critG=new THREE.Group(), plantsG=new THREE.Group(), settleG=new THREE.Group(), objG=new THREE.Group(), bubG=new THREE.Group(); jar.add(critG,plantsG,settleG,objG,bubG);
  // condensa e muffa
  const dropN=80, dropPos=new Float32Array(dropN*3), dropV=[]; { const r=rngS(9); for(let i=0;i<dropN;i++){ const a=r()*6.283; dropPos[i*3]=Math.cos(a)*.985; dropPos[i*3+1]=.5+r()*1.5; dropPos[i*3+2]=Math.sin(a)*.985; dropV.push(.01+r()*.03); } }
  const dropGeo=new THREE.BufferGeometry(); dropGeo.setAttribute('position',new THREE.BufferAttribute(dropPos,3)); const drops=new THREE.Points(dropGeo,new THREE.PointsMaterial({map:glowTex('rgba(255,255,255,.95)'),size:.05,transparent:true,opacity:.65,depthWrite:false,sizeAttenuation:true})); drops.renderOrder=5; jar.add(drops);
  const molds=[]; { const r=rngS(13); for(let i=0;i<14;i++){ const a=r()*6.283, m=new THREE.Mesh(new THREE.CircleGeometry(.05+r()*.05,10),new THREE.MeshBasicMaterial({color:0x6a2f8f,transparent:true,opacity:.55,depthWrite:false})); m.position.set(Math.cos(a)*.975,.25+r()*.8,Math.sin(a)*.975); m.lookAt(0,m.position.y,0); m.visible=false; m.renderOrder=4; jar.add(m); molds.push(m); } }

  // ---------- vetro vivo: condensa da pulire col dito, gocce che scendono, muffa sul vetro e sulla terra ----------
  const FDI=fotoMat('vetro_sporco');
  const glassFX=(function(){ window.__glass=null;
    const FW=512, FH=192, FD=new Uint8Array(FW*FH*4); for(let i=0;i<FW*FH;i++){ FD[i*4]=255; FD[i*4+3]=255; }
    const tex=new THREE.DataTexture(FD,FW,FH,THREE.RGBAFormat); tex.wrapS=THREE.RepeatWrapping; tex.wrapT=THREE.ClampToEdgeWrapping; tex.magFilter=tex.minFilter=THREE.LinearFilter; tex.needsUpdate=true;
    const DR=[]; for(let i=0;i<8;i++) DR.push(new THREE.Vector4(0,0,1,0));
    const U={uMask:{value:tex},uDens:{value:0},uZ:{value:new THREE.Vector4(1,1,1,1)},uNight:{value:0},uTex:{value:new THREE.Vector2(1/FW,1/FH)},uDrops:{value:DR},uSize:{value:new THREE.Vector2(FW,FH)},uDirt:{value:null},uDirtK:{value:0}};
    const mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,side:THREE.DoubleSide,
      vertexShader:'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vec3 p=position; vUv=vec2(atan(p.z,p.x)/6.2831853+.5, p.y/2.34); vec4 mv=modelViewMatrix*vec4(p,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
      fragmentShader:[
      'uniform sampler2D uMask; uniform float uDens,uNight; uniform vec4 uZ; uniform vec2 uTex,uSize; uniform vec4 uDrops[8]; uniform sampler2D uDirt; uniform float uDirtK; varying vec2 vUv; varying vec3 vN; varying vec3 vV;',
      'vec2 h2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }',
      'float n2(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); float a=h2(i).x,b=h2(i+vec2(1.,0.)).x,c=h2(i+vec2(0.,1.)).x,d=h2(i+vec2(1.,1.)).x; return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }',
      'void main(){',
      ' vec4 M=texture2D(uMask,vUv); float m=M.r, mo=M.g;',
      ' float zy=vUv.y; float dz=uDens*mix(mix(uZ.w,uZ.z,smoothstep(.42,.50,zy)),mix(uZ.y,uZ.x,smoothstep(.84,.92,zy)),smoothstep(.66,.74,zy));', // condensa per fascia: basso < 1,0 < medio < 1,6 < alto < 2,0 < tappo
      ' float mx=texture2D(uMask,vUv+vec2(uTex.x*2.5,0.)).r, my=texture2D(uMask,vUv+vec2(0.,uTex.y*2.5)).r, mx2=texture2D(uMask,vUv-vec2(uTex.x*2.5,0.)).r;',
      ' float edge=clamp((abs(m-mx)+abs(m-my)+abs(m-mx2))*2.2,0.,1.)*dz;',
      ' float fog=m*dz;',
      ' vec2 g=vUv*vec2(260.,100.); vec2 ip=floor(g), fp=fract(g); float dm=9.; vec2 rv=vec2(0.), dv=vec2(0.);',
      ' for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 o=vec2(float(i),float(j)); vec2 r=h2(ip+o); vec2 d=o+r*.8+.1-fp; float s=.16+.34*r.x; float q=length(d)/s; if(q<dm){ dm=q; rv=r; dv=d/s; } }',
      ' float px=length(fwidth(g)); float vis=smoothstep(.3,.11,px); float has=step(.45,rv.y); float drop=smoothstep(1.,.82,dm)*has*clamp(fog*1.7+edge*1.4,0.,1.)*vis;',
      ' float rim=smoothstep(.78,.98,dm)*smoothstep(1.02,.95,dm)*drop; float hlm=smoothstep(.2,0.,length(dv-vec2(.3,-.36)))*drop;',
      ' float big=0., hl=0., bigrim=0.;',
      ' for(int k=0;k<8;k++){ vec4 D=uDrops[k]; if(D.w<=0.) continue; vec2 d=vUv-D.xy; d.x=fract(d.x+.5)-.5; d*=uSize/(D.z*vec2(1.,1.35)); float q=length(d); float b=smoothstep(1.,.85,q)*D.w; big=max(big,b); bigrim=max(bigrim,smoothstep(.6,1.,q)*b); hl=max(hl,smoothstep(.38,0.,length(d-vec2(.3,-.35)))*D.w); }',
      ' float fr=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);',
      ' vec3 fogC=mix(vec3(.86,.89,.9),vec3(.42,.47,.62),uNight);',
      ' float lens=drop*(1.-clamp(length(dv),0.,1.)); float af=fog*.7*(1.-drop*.55) + rim*.18 + big*(.06+.3*bigrim) + edge*.12 + lens*.1;',
      ' af*= (.78+.5*fr);',
      ' vec3 cf=mix(fogC*(1.-.22*rim-.3*bigrim),vec3(1.),lens*.35);',
      ' float dirt=uDirtK>0.?texture2D(uDirt,vUv*vec2(3.,1.2)).r*uDirtK:0.; cf=mix(cf,vec3(.5,.47,.4)*(1.-.5*uNight),clamp(dirt*.8,0.,1.)); af=clamp(af+dirt*.42*(1.-af),0.,1.);',
      ' float spec=hlm*.85+hl; cf=mix(cf,vec3(1.),clamp(spec,0.,1.)); af=clamp(af+spec*.6,0.,1.);',
      ' float fib=n2(vUv*vec2(900.,340.))*.6+n2(vUv*vec2(2600.,980.))*.4;',
      ' float am=smoothstep(.06,.5,mo)*(.45+.55*fib);',
      ' vec3 cm=mix(vec3(.93,.93,.88),vec3(.33,.48,.4),smoothstep(.55,.95,mo)); cm*=.85+.3*fib;',
      ' float a=am+af*(1.-am); vec3 c=a>0.001?(cm*am+cf*af*(1.-am))/a:cf;',
      ' gl_FragColor=vec4(c,a);',
      '}'].join('\n')});
    const mesh=new THREE.Mesh(glassGeo,mat); mesh.scale.set(.99,1,.99); mesh.renderOrder=5; jar.add(mesh);
    // muffa sulla terra: colonie vere (filamenti, nucleo, spore)
    function colonyTex(kind,seed){ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'), r=rngS(seed); g.translate(128,128);
      for(let i=0;i<1100;i++){ const a=r()*6.283, l=35+r()*88; g.strokeStyle='rgba(240,242,236,'+(.04+r()*.11)+')'; g.lineWidth=.35+r()*.7; g.beginPath(); let x=Math.cos(a)*r()*18, y=Math.sin(a)*r()*18; g.moveTo(x,y); for(let s=0;s<6;s++){ const aa=a+(r()-.5)*.7; x+=Math.cos(aa)*l/6; y+=Math.sin(aa)*l/6; g.lineTo(x,y); } g.stroke(); }
      const core=g.createRadialGradient(0,0,0,0,0,72);
      if(kind===0){ core.addColorStop(0,'rgba(196,198,190,.82)'); core.addColorStop(.5,'rgba(176,178,170,.5)'); core.addColorStop(1,'rgba(170,172,164,0)'); }
      else if(kind===1){ core.addColorStop(0,'rgba(96,104,96,.96)'); core.addColorStop(.42,'rgba(140,146,136,.88)'); core.addColorStop(.68,'rgba(234,238,230,.72)'); core.addColorStop(1,'rgba(234,238,230,0)'); }
      else { core.addColorStop(0,'rgba(38,36,32,.92)'); core.addColorStop(.5,'rgba(72,68,60,.72)'); core.addColorStop(.76,'rgba(222,222,212,.5)'); core.addColorStop(1,'rgba(222,222,212,0)'); }
      g.fillStyle=core; g.beginPath(); g.arc(0,0,72,0,6.283); g.fill();
      for(let i=0;i<300;i++){ const a=r()*6.283, d=Math.sqrt(r())*(kind===2?62:46); g.fillStyle=kind===2?'rgba(18,16,14,.75)':kind===1?'rgba(70,76,70,.6)':'rgba(255,255,255,.55)'; g.beginPath(); g.arc(Math.cos(a)*d,Math.sin(a)*d,.5+r()*1.5,0,6.283); g.fill(); }
      const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
    const CT=[colonyTex(0,31),colonyTex(1,32),colonyTex(2,33)], soilCol=[]; { const r=rngS(77); for(let i=0;i<9;i++){ const a=r()*6.283, d=.38+r()*.45, k=i%3; const m=new THREE.MeshStandardMaterial({map:CT[k],transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-2});
      const p=new THREE.Mesh(new THREE.PlaneGeometry(1,1),m); p.rotation.x=-Math.PI/2; p.rotation.z=r()*6.283; p.position.set(Math.cos(a)*d,0,Math.sin(a)*d); p.visible=false; p.renderOrder=3; jar.add(p);
      const f=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial({map:CT[0],transparent:true,depthWrite:false,opacity:.3,roughness:1})); f.rotation.copy(p.rotation); f.rotation.z+=1.3; f.visible=false; f.renderOrder=3; jar.add(f);
      soilCol.push({p,f,th:r()*.75,size:.07+r()*.09,cur:0}); } }
    // colonie fotografiche: ritagli della foto di muffa (colore) con la sua maschera, sfumati ai bordi; sostituiscono le colonie disegnate
    { const FMU=fotoMat('muffa'); if(FMU) FMU.when(F=>{ if(!F.img.maschera) return; try{ const R=rngS(91), tx=[]; for(let k=0;k<3;k++){ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'), sx=R()*560, sy=R()*560, cw=420;
        g.drawImage(F.img.colore,sx,sy,cw,cw,0,0,256,256); const col=g.getImageData(0,0,256,256); g.clearRect(0,0,256,256); g.drawImage(F.img.maschera,sx,sy,cw,cw,0,0,256,256); const mk=g.getImageData(0,0,256,256).data;
        for(let y=0;y<256;y++) for(let x=0;x<256;x++){ const i=(y*256+x)*4, d=Math.hypot(x-127.5,y-127.5)/128, fall=Math.max(0,Math.min(1,(1-d)/.45)); col.data[i+3]=Math.min(255,mk[i]*1.15*fall*fall*(3-2*fall)); }
        g.putImageData(col,0,0); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; tx.push(t); }
      soilCol.forEach((c,i)=>{ c.p.material.map=tx[i%3]; c.p.material.needsUpdate=true; c.f.material.map=tx[(i+1)%3]; c.f.material.needsUpdate=true; c.size*=1.6; }); }catch(e){} }); }
    // macchie di muffa sul vetro (canale G), strofinabili
    const spots=[]; { const r=rngS(55); for(let i=0;i<9;i++) spots.push({u:r(),dv:.012+r()*.14,R:5+r()*7,th:r()*.7,s:1,p1:r()*6.28,p2:r()*6.28,p3:r()*6.28}); }
    let L=0, LT=0, LF=0, soilV=.05, acc=0, moldAcc=0, drops=[], wiping=null, wipedArea=0, scrubbed=0, cleared=0;
    // muffa sulle foglie (muschio): tre piccoli decal grigi, posizionati sul cuscino di muschio
    const leafCol=[]; { const r=rngS(91); for(let i=0;i<3;i++){ const d=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial({map:CT[0],color:0xb4b6ae,transparent:true,opacity:0,depthWrite:false,roughness:1})); d.rotation.x=-Math.PI/2+.4-r()*.8; d.rotation.z=r()*6.283; d.userData={x:(r()-.5)*.3,y:r()*.05,z:(r()-.5)*.3,k:.7+r()*.6}; d.visible=false; d.renderOrder=3; jar.add(d); leafCol.push(d); } }
    function brush(u,v,r,ch,target,str,streak){ const cx=u*FW, cy=v*FH, R=Math.ceil(r); let ch2=0;
      for(let y=Math.max(0,Math.floor(cy-R)); y<=Math.min(FH-1,Math.ceil(cy+R)); y++) for(let xx=Math.floor(cx-R); xx<=Math.ceil(cx+R); xx++){ const dx=xx-cx, dy=y-cy, d=Math.sqrt(dx*dx+dy*dy)/r; if(d>1) continue; const x=((xx%FW)+FW)%FW, k=(y*FW+x)*4+ch; let f=str*(1-d*d); if(streak) f*=.8+.2*Math.sin(dy*2.1+dx*.4); const o=FD[k], nv=o+(target-o)*Math.min(1,f); if(Math.abs(nv-o)>.5){ FD[k]=nv; ch2+=Math.abs(o-nv); } }
      return ch2/255; }
    function paintMold(){ const v0=Math.max(0,Math.floor((soilV-.01)*FH)), v1=Math.min(FH-1,Math.ceil((soilV+.2)*FH)); for(let y=v0;y<=v1;y++) for(let x=0;x<FW;x++) FD[(y*FW+x)*4+1]=0;
      spots.forEach(sp=>{ const k=clamp((L-sp.th)/(1-sp.th+1e-3)); const rr=sp.R*k*sp.s; if(rr<.8) return; const cx=sp.u*FW, cy=(soilV+sp.dv)*FH, R=Math.ceil(rr*1.3);
        for(let y=Math.max(0,Math.floor(cy-R)); y<=Math.min(FH-1,Math.ceil(cy+R)); y++) for(let xx=Math.floor(cx-R); xx<=Math.ceil(cx+R); xx++){ const x=((xx%FW)+FW)%FW, dx=xx-cx, dy=y-cy, a=Math.atan2(dy,dx), wob=1+.16*Math.sin(a*3+sp.p1)+.1*Math.sin(a*7+sp.p2)+.06*Math.sin(a*13+sp.p3), d=Math.sqrt(dx*dx+dy*dy)/(rr*wob); if(d>1) continue; const k2=(y*FW+x)*4+1; const hn=((Math.sin(x*12.9898+y*78.233)*43758.5453)%1+1)%1; FD[k2]=Math.max(FD[k2],Math.round(255*(1-d*d)*(.62+.38*Math.min(1,k*1.4))*(.78+.22*hn))); } }); }
    function uvOf(pt){ const p=mesh.worldToLocal(pt.clone()); return [Math.atan2(p.z,p.x)/6.2831853+.5,p.y/2.34]; }
    const ray=new THREE.Raycaster();
    function hit(e){ const r=canvas.getBoundingClientRect(); ray.setFromCamera({x:((e.clientX-r.left)/r.width)*2-1,y:-((e.clientY-r.top)/r.height)*2+1},camera); const h=ray.intersectObject(mesh,false)[0]; return h?uvOf(h.point):null; }
    const sm=(a,b,x)=>{ const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); }, densAt=v=>{ const Z=U.uZ.value, lo=Z.w+(Z.z-Z.w)*sm(.42,.5,v), hi=Z.y+(Z.x-Z.y)*sm(.84,.92,v); return U.uDens.value*(lo+(hi-lo)*sm(.66,.74,v)); };
    function wipeable(uv){ if(!uv) return false; const x=Math.floor(((uv[0]%1)+1)%1*FW), y=Math.floor(clamp(uv[1])*(FH-1)), k=(y*FW+x)*4; return FD[k]/255*densAt(uv[1])>.1||FD[k+1]>30; }
    function strokeTo(uv){ const [u0,v0]=wiping; let du=uv[0]-u0; if(du>.5) du-=1; if(du<-.5) du+=1; const dv=uv[1]-v0, len=Math.hypot(du*FW,dv*FH), n=Math.max(1,Math.ceil(len/3)), BR=8;
      for(let i=1;i<=n;i++){ const u=u0+du*i/n, v=v0+dv*i/n; wipedArea+=brush(u,v,BR,0,0,.95,true);
        spots.forEach(sp=>{ if(sp.s<=0) return; let d=Math.abs(u-sp.u); d=Math.min(d,1-d)*FW; const dd=Math.hypot(d,(v-soilV-sp.dv)*FH); if(dd<sp.R+BR){ const o=sp.s; sp.s=Math.max(0,sp.s-.05); scrubbed+=o-sp.s; if(o>0&&sp.s===0) cleared++; } }); }
      wiping=uv; paintMold(); tex.needsUpdate=true; }
    function tick(dt){ const n=S.n||{um:.6,pul:1}, m=S.m&&S.m.condensa?S.m:null, Z=U.uZ.value;
      // con il microclima: densità per fascia (tappo, alto, medio, basso) da condensa{}; senza: un solo velo dai bisogni. Transizioni lente (~3 s)
      if(m){ U.uDens.value+=(1-U.uDens.value)*Math.min(1,dt*.4); const kz=Math.min(1,dt*.4), c=m.condensa; Z.set(Z.x+(clamp(c.tappo)-Z.x)*kz,Z.y+(clamp(c.alto)-Z.y)*kz,Z.z+(clamp(c.medio)-Z.z)*kz,Z.w+(clamp(c.basso)-Z.w)*kz); }
      else { U.uDens.value+=((clamp((n.um-.55)/.33))-U.uDens.value)*Math.min(1,dt*1.5); const kz=Math.min(1,dt*.6); Z.set(Z.x+(1-Z.x)*kz,Z.y+(1-Z.y)*kz,Z.z+(1-Z.z)*kz,Z.w+(1-Z.w)*kz); }
      U.uNight.value+=((S.night?1:0)-U.uNight.value)*Math.min(1,dt*2);
      if(FDI&&FDI.ready){ if(!U.uDirt.value){ const M=FDI.maps(1); if(M&&M.mask){ M.mask.wrapS=M.mask.wrapT=THREE.RepeatWrapping; U.uDirt.value=M.mask; } } U.uDirtK.value+=((U.uDirt.value?clamp((.9-n.pul)/.75):0)-U.uDirtK.value)*Math.min(1,dt*.6); }
      soilV=(S.soilTop||.2)/2.34; L+=((m?clamp(m.muffa.vetro):clamp((.62-n.pul)/.5))-L)*Math.min(1,dt*(m?.3:.8)); LT+=((m?clamp(m.muffa.terra):L)-LT)*Math.min(1,dt*.3); LF+=((m?clamp(m.muffa.foglie):0)-LF)*Math.min(1,dt*.3);
      const dens=U.uDens.value*Math.max(Z.x,Z.y,Z.z,Z.w); acc+=dt; let dirty=false;
      if(acc>.1){ const inc=Math.max(1,Math.round(255*(.012+.05*dens)*acc)); for(let i=0;i<FW*FH;i++){ const k=i*4; if(FD[k]<255) FD[k]=Math.min(255,FD[k]+inc); } acc=0; dirty=true; }
      // gocce: con il microclima solo se gocce>0 (g/h), e partono dalla fascia dove la condensa supera 0,6; senza, come prima
      if(m){ const g=Math.max(0,m.gocce||0); if(g>0&&drops.length<8&&Math.random()<Math.min(1.2,g*.35)*dt){ const bands=[[Math.max(soilV+.12,.3),.46,Z.w],[.46,.70,Z.z],[.70,.86,Z.y]].filter(b=>b[2]>.6); if(bands.length){ const b=bands[(Math.random()*bands.length)|0]; drops.push({u:Math.random(),v:b[0]+Math.random()*(b[1]-b[0]),sz:2.4+Math.random()*2.6,sp:.015+Math.random()*.04,st:.3+Math.random(),a:0}); } } }
      else if(dens>.35&&drops.length<8&&Math.random()<dens*1.1*dt){ drops.push({u:Math.random(),v:soilV+.25+Math.random()*.5,sz:2.4+Math.random()*2.6,sp:.015+Math.random()*.04,st:.3+Math.random(),a:0}); }
      drops.forEach(d=>{ d.a=Math.min(1,d.a+dt*3); if(d.st>0){ d.st-=dt; } else { const ov=d.v; d.v-=d.sp*dt; brush(d.u,d.v,d.sz*.65,0,0,.85,false); if(Math.random()<dt*.9) d.st=.15+Math.random()*.9; dirty=true; } if(d.v<soilV+.012) d.a=-1; });
      drops=drops.filter(d=>d.a>=0); for(let i=0;i<8;i++){ const d=drops[i]; if(d) DR[i].set(d.u,d.v,d.sz,d.a*densAt(d.v)); else DR[i].w=0; }
      spots.forEach(sp=>{ if(sp.s<1) sp.s=Math.min(1,sp.s+dt*.004*L); }); moldAcc+=dt; if(moldAcc>.5){ paintMold(); moldAcc=0; dirty=true; }
      if(dirty) tex.needsUpdate=true;
      soilCol.forEach(c=>{ const k=clamp((LT-c.th)/(1-c.th+1e-3)); c.cur+=(k-c.cur)*Math.min(1,dt*.6); const sc=c.size*Math.pow(c.cur,.7); const vis=sc>.008; c.p.visible=vis; c.f.visible=vis&&terrainLvl<2; if(!vis) return; /* guardia livello 2: niente alone (metà delle chiamate) */ c.p.scale.set(sc,sc,1); c.f.scale.set(sc*1.12,sc*1.12,1); c.p.position.y=(S.soilTop||.2)+AMP*.85+.004; c.f.position.set(c.p.position.x,(S.soilTop||.2)+AMP*.85+.007+sc*.03,c.p.position.z); });
      { const mo=plantObjs.muschio, vis=LF>.12&&!!mo; leafCol.forEach((d,i)=>{ d.visible=vis; if(!vis) return; const sc=.035+.07*LF*d.userData.k; d.scale.set(sc,sc,1); d.position.set(mo.g.position.x+d.userData.x,(S.soilTop||.2)+.085+d.userData.y,mo.g.position.z+d.userData.z); d.material.opacity=clamp((LF-.12)*3); }); } }
    const API={tick,
      start(e){ const uv=hit(e); if(!wipeable(uv)) return false; wiping=uv; wipedArea=0; scrubbed=0; cleared=0; strokeTo(uv); return true; },
      move(e){ if(!wiping) return; const uv=hit(e); if(uv) strokeTo(uv); },
      end(){ if(!wiping) return; wiping=null; const area=wipedArea/(FW*FH); try{ if(window.__app&&window.__app.wipeGlass) window.__app.wipeGlass(area,scrubbed,cleared); }catch(e){} },
      state(){ let fogSum=0, moldPx=0; for(let i=0;i<FW*FH;i++){ fogSum+=FD[i*4]; if(FD[i*4+1]>30) moldPx++; } return {dens:+U.uDens.value.toFixed(3),zone:U.uZ.value.toArray().map(x=>+x.toFixed(3)),LT:+LT.toFixed(3),LF:+LF.toFixed(3),fog:+(fogSum/(FW*FH*255)).toFixed(3),moldPx,L:+L.toFixed(3),drops:drops.length,soilCol:soilCol.filter(c=>c.p.visible).length}; }}; window.__glass=API; return API;
  })();
  jar.remove(drops); molds.forEach(m=>jar.remove(m));
  // ---------- piante ----------
  const SLOTS=[[-.4,-.4],[.42,-.35],[.1,-.62],[-.1,.58],[.58,.3]]; const plantObjs={};
  // piante vive (app/piante.js): crescita, turgore e vento dal microclima; se manca, resta mkPlant qui sotto
  const PL=(function(){ try{ return window.__PIANTE?window.__PIANTE(THREE,{S,ptex,TX,rngS,clamp,SLOTS,A,FOTO}):null; }catch(e){ console.warn('piante vive non caricate',e&&e.message); return null; } })();
  const lc=(base,dry)=>new Col(base).lerp(new Col(0x8d7440),clamp(dry*.95));
  function mkPlant(id,slot,seed){ const g=new THREE.Group(), r=rngS(seed), [sx,sz]=SLOTS[slot%SLOTS.length]; g.position.set(sx,.1,sz); const mats=[]; let upd=()=>{};
    if(id==='muschio'){ const MB=TX?0xb7d39c:0x3e8e68, SB=TX?0x6f9a52:0x5aa070;
      const cg=new THREE.IcosahedronGeometry(1,3); { const p=cg.attributes.position, cc=new Float32Array(p.count*3); for(let k=0;k<p.count;k++){ const x=p.getX(k),y=p.getY(k),z=p.getZ(k), n=1+.09*Math.sin(x*9.1+z*7.3)+.07*Math.sin(y*11+x*5)+.05*Math.sin(z*13-y*6); p.setXYZ(k,x*n,y*n,z*n); const t=Math.min(1,Math.max(0,y*.75+.45)), c=.42+.58*t; cc[k*3]=cc[k*3+1]=cc[k*3+2]=c; } cg.setAttribute('color',new THREE.BufferAttribute(cc,3)); cg.computeVertexNormals(); }
      const mat=new THREE.MeshStandardMaterial(TX?{vertexColors:true,color:MB,map:ptex('Moss002_col',1),normalMap:ptex('Moss002_nor',1,false),normalScale:new THREE.Vector2(1.6,1.6),roughness:1}:{vertexColors:true,color:MB,roughness:1}); mats.push(mat);
      const sg=new THREE.ConeGeometry(.006,.034,5,2); sg.translate(0,.017,0); { const p=sg.attributes.position; for(let k=0;k<p.count;k++){ const y=p.getY(k); p.setX(k,p.getX(k)+y*y*6); } sg.computeVertexNormals(); }
      const smat=new THREE.MeshStandardMaterial({color:SB,roughness:.9}); mats.push(smat);
      const N=16, SP=14, im=new THREE.InstancedMesh(cg,mat,N), st=new THREE.InstancedMesh(sg,smat,N*SP), base=[], sd=[];
      for(let i=0;i<N;i++){ const a=r()*6.283, d=Math.sqrt(r())*.3; base.push([Math.cos(a)*d,Math.sin(a)*d,.07+r()*.07]); for(let j=0;j<SP;j++){ const th=r()*6.283, ph=r()*1.15; sd.push([i,Math.cos(th)*Math.sin(ph),Math.cos(ph),Math.sin(th)*Math.sin(ph),r()*6.283,.7+r()*.6]); } }
      g.add(im); g.add(st); const m=new THREE.Matrix4(), q=new THREE.Quaternion(), up=new V3(0,1,0); let lastK=-1;
      upd=(v,dry)=>{ const k=.55+.45*clamp(v+.2); if(Math.abs(k-lastK)>.01){ lastK=k; for(let i=0;i<N;i++){ const [x,z,s]=base[i]; m.compose(new V3(x,s*.18*k,z),q,new V3(s*k,s*k*.55,s*k)); im.setMatrixAt(i,m); }
          sd.forEach((d,n)=>{ const [i,dx,dy,dz,rot,sc]=d, [x,z,s]=base[i], R=s*k; const dir=new V3(dx,dy+.6,dz).normalize(); const qq=new THREE.Quaternion().setFromUnitVectors(up,dir).multiply(new THREE.Quaternion().setFromAxisAngle(up,rot)); m.compose(new V3(x+dx*R,s*.18*k+dy*R*.55,z+dz*R),qq,new V3(sc,sc*(.8+k*.4),sc)); st.setMatrixAt(n,m); });
          im.instanceMatrix.needsUpdate=true; st.instanceMatrix.needsUpdate=true; }
        mat.color.copy(lc(MB,dry)); smat.color.copy(lc(SB,dry)); };
      im.castShadow=true; im.receiveShadow=true; }
    else if(id==='felce'){ const mat=new THREE.MeshStandardMaterial({color:0x4e8a4a,roughness:.85,side:THREE.DoubleSide}); mats.push(mat); const fr=[]; for(let f=0;f<5;f++) fr.push(new THREE.Group()); fr.forEach(f=>g.add(f)); let last=-1; upd=(v,dry)=>{ mat.color.copy(lc(0x4e8a4a,dry)); const key=Math.round(clamp(v+.15)*5)*10+Math.round(dry*5); if(key===last) return; last=key; const k=.5+.5*clamp(v+.15), droop=.3+dry*.9; fr.forEach((f,i)=>{ while(f.children.length){ const c=f.children.pop(); c.geometry&&c.geometry.dispose(); } const a=i/5*6.283+.4, len=.55*k, pts=[]; for(let s=0;s<=6;s++){ const u=s/6; pts.push(new V3(Math.cos(a)*u*.4*(1+droop*.4),Math.sin(u*Math.PI*(.7-droop*.25))*len,Math.sin(a)*u*.4*(1+droop*.4))); } const cu=new THREE.CatmullRomCurve3(pts); f.add(new THREE.Mesh(new THREE.TubeGeometry(cu,10,.01,5),mat)); for(let s=1;s<=10;s++){ const u=s/11, p=cu.getPoint(u), tg=cu.getTangent(u); for(const side of[-1,1]){ const lf=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),mat); lf.scale.set(.09*(1-u*.5),.012,.03*(1-u*.4)); lf.position.copy(p); lf.quaternion.setFromUnitVectors(new V3(1,0,0),new V3(tg.x,tg.y,tg.z).cross(new V3(0,1,0)).multiplyScalar(side).normalize().add(new V3(0,-droop*.4*u,0)).normalize()); f.add(lf); } } }); }; }
    else if(id==='fungo'){ const stem=new THREE.MeshStandardMaterial({color:0xe8d8c0,roughness:.9}), cap=new THREE.MeshStandardMaterial({color:0xd88070,roughness:.7,emissive:0x000000}); mats.push(cap); for(let i=0;i<3;i++){ const h=.1+r()*.1, m=new THREE.Group(); m.position.set((r()-.5)*.3,0,(r()-.5)*.3); const s=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,h,8),stem); s.position.y=h/2; const c=new THREE.Mesh(new THREE.SphereGeometry(.07,10,6,0,6.283,0,1.57),cap); c.position.y=h; m.add(s,c); g.add(m); } upd=(v,dry)=>{ const k=.55+.45*clamp(v+.2); g.scale.setScalar(k); cap.color.copy(lc(0xd88070,dry)); cap.emissive.set(S.v&&S.v.R>.3?0x4a3590:0x000000); }; }
    else if(id==='succulenta'){ const mat=new THREE.MeshStandardMaterial({color:0x6a9a78,roughness:.8}); mats.push(mat); for(let i=0;i<8;i++){ const a=i/8*6.283, l=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),mat); l.scale.set(.6,1.5,.6); l.position.set(Math.cos(a)*.06,.09,Math.sin(a)*.06); l.rotation.set(Math.sin(a)*.6,0,-Math.cos(a)*.6); g.add(l); } upd=(v,dry)=>{ g.scale.setScalar(.55+.45*clamp(v+.2)); mat.color.copy(lc(0x6a9a78,dry)); }; }
    else { const mat=new THREE.MeshStandardMaterial({color:0x4e9a5a,roughness:.8}); mats.push(mat); const st=new THREE.Mesh(new THREE.CylinderGeometry(.015,.02,.3,6),mat); st.position.y=.15; const hd=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshStandardMaterial({color:0xd44a4a,roughness:.6})); hd.scale.set(.9,1.2,.9); hd.position.set(.03,.32,0); g.add(st,hd); upd=(v,dry)=>{ g.scale.setScalar(.6+.4*clamp(v+.2)); mat.color.copy(lc(0x4e9a5a,dry)); }; }
    return {g,upd,mats}; }
  // ---------- oggetti ----------
  function mkObject(id){ const g=new THREE.Group(), M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.7},o)), add=(geo,m,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{ const me=new THREE.Mesh(geo,m); me.position.set(x,y,z); me.scale.set(sx,sy,sz); me.rotation.set(rx,ry,rz); g.add(me); return me; }, B=(w,h,d)=>new THREE.BoxGeometry(w,h,d), C=(a,b,h,n=16)=>new THREE.CylinderGeometry(a,b,h,n), Sp=r=>new THREE.SphereGeometry(r,12,9);
    if(id==='statuina'){ add(B(.1,.2,.08),M(0x8c8c92),0,.1,0); add(B(.016,.02,.01),M(0x222226),-.026,.15,.045); add(B(.016,.02,.01),M(0x222226),.026,.15,.045); add(B(.05,.012,.01),M(0x222226),0,.1,.045); }
    else if(id==='orologio'){ add(C(.09,.09,.03,28),M(0xe9e2cf),0,.11,0,1,1,1,1.5708); add(B(.008,.06,.006),M(0x2a1a0a),0,.13,.02); add(B(.006,.04,.006),M(0x2a1a0a),.014,.11,.02,1,1,1,0,0,-1.1); add(C(.03,.04,.06,10),M(0x6a4a2a),0,.03,0); }
    else if(id==='giocattolo'){ add(Sp(.07),M(0xb9783c),0,.07,0); add(Sp(.055),M(0xc98a4a),0,.17,0); add(Sp(.022),M(0xb9783c),-.04,.22,0); add(Sp(.022),M(0xb9783c),.04,.22,0); add(Sp(.012),M(0x1a1008),-.02,.18,.05); add(Sp(.012),M(0x1a1008),.02,.18,.05); }
    else if(id==='specchio'){ add(new THREE.TorusGeometry(.08,.011,8,24),M(0xd9b84a,{metalness:.9,roughness:.3}),0,.14,0,1,1.25,1); add(new THREE.CircleGeometry(.078,24),M(0xcfe6ff,{metalness:1,roughness:.05}),0,.14,.002,1,1.25,1); add(B(.02,.07,.02),M(0x6a4a2a),0,.03,0); }
    else if(id==='libro'){ add(B(.14,.035,.1),M(0xa83a30),0,.02,0); add(B(.13,.026,.092),M(0xf1ead8),.004,.02,0); }
    else if(id==='moneta'){ add(C(.06,.06,.012,26),M(0xf0c040,{metalness:.85,roughness:.3}),0,.07,0,1,1,1,1.5708); }
    else if(id==='radio'){ add(B(.15,.09,.06),M(0x4a5560),0,.05,0); add(C(.025,.025,.01,14),M(0xcfd8dc),-.04,.05,.032,1,1,1,1.5708); add(C(.006,.006,.12,6),M(0x9aa4ad),.05,.15,0,1,1,1,0,0,-.4); }
    else if(id==='candela'){ add(C(.03,.03,.14,14),M(0xf3ead0),0,.07,0); add(new THREE.ConeGeometry(.018,.05,8),new THREE.MeshBasicMaterial({color:0xffb040}),0,.17,0); }
    else add(Sp(.06),M(0x888888),0,.06,0);
    return g; }
  // ---------- insediamenti ----------
  const ANCH=[[-.42,.3],[.42,.3],[0,.55]]; const anchors={}, settles={};
  const anchorOf=id=>anchors[id]||(anchors[id]=ANCH.find(a=>!Object.values(anchors).includes(a))||ANCH[2]);
  const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o));
  function landmark(c,anim){ const g=new THREE.Group(), box=(w,h,d,col,x=0,y=0,z=0)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(col)); m.position.set(x,y+h/2,z); g.add(m); return m; };
    if(c==='sacro'){ box(.12,.3,.1,0x8c8c92); box(.02,.025,.02,0x222226,-.03,.21,.055); box(.02,.025,.02,0x222226,.03,.21,.055); box(.05,.012,.02,0x222226,0,.14,.055); for(const sx of[-.16,.16]){ const f=new THREE.Mesh(new THREE.ConeGeometry(.025,.07,8),new THREE.MeshBasicMaterial({color:0xffa030})); f.position.set(sx,.04,0); g.add(f); anim.push(t=>{ f.scale.y=1+.25*Math.sin(t*9+sx*20); }); } }
    else if(c==='sapere'){ const tw=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,.32,10),mat(0x7a6a58)); tw.position.y=.16; g.add(tw); const cl=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.025,24),mat(0xe9e2cf)); cl.rotation.x=1.5708; cl.position.set(0,.36,.03); g.add(cl); const hand=new THREE.Mesh(new THREE.BoxGeometry(.012,.07,.006),mat(0x2a1a0a)); hand.position.set(0,.36,.05); const pv=new THREE.Group(); pv.position.set(0,.36,.05); hand.position.y=.03; pv.add(hand); g.add(pv); anim.push(t=>{ pv.rotation.z=-t*.9; }); }
    else if(c==='commercio'){ box(.3,.1,.15,0x7a5a3a); for(let i=0;i<6;i++){ const a=new THREE.Mesh(new THREE.BoxGeometry(.05,.012,.2),mat(i%2?0xf1ebe0:0xc8473b)); a.position.set(-.125+i*.05,.24,.03); a.rotation.x=.3; g.add(a); } for(const sx of[-.06,.06]){ const co=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.008,14),new THREE.MeshStandardMaterial({color:0xf0c040,metalness:.8,roughness:.3})); co.position.set(sx,.11,.02); g.add(co); anim.push(t=>{ co.position.y=.11+Math.abs(Math.sin(t*3+sx*30))*.015; }); } }
    else if(c==='gioco'){ for(let i=0;i<7;i++){ const f=new THREE.Mesh(new THREE.ConeGeometry(.025,.05,3),new THREE.MeshBasicMaterial({color:[0xff6b6b,0xffd166,0x4ecdc4,0xa78bfa][i%4]})); f.position.set(-.3+i*.1,.36-Math.sin(i/6*3.14)*.06,0); f.rotation.z=3.14; g.add(f); } for(const sx of[-.32,.32]) { const p=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.4,6),mat(0x5a4630)); p.position.set(sx,.2,0); g.add(p); } const ball=mkSprite('🧸',.2); ball.position.y=.12; g.add(ball); anim.push(t=>{ ball.position.y=.12+Math.abs(Math.sin(t*3))*.14; }); }
    else if(c==='mistero'){ const fr=new THREE.Mesh(new THREE.TorusGeometry(.11,.014,10,32),new THREE.MeshStandardMaterial({color:0xd9b84a,metalness:.9,roughness:.3})); fr.position.y=.2; fr.scale.y=1.3; g.add(fr); const mi=new THREE.Mesh(new THREE.CircleGeometry(.1,32),new THREE.MeshStandardMaterial({color:0xcfe6ff,metalness:1,roughness:.05})); mi.position.set(0,.2,.003); mi.scale.y=1.3; g.add(mi); }
    else if(c==='comunicazione'){ const m1=new THREE.Mesh(new THREE.CylinderGeometry(.008,.012,.4,6),mat(0x9aa4ad)); m1.position.y=.2; g.add(m1); for(let k=0;k<3;k++){ const rg=new THREE.Mesh(new THREE.RingGeometry(.9,1,24),new THREE.MeshBasicMaterial({color:0xa0dcff,transparent:true,side:THREE.DoubleSide})); rg.position.y=.4; rg.rotation.x=1.5708; g.add(rg); anim.push(t=>{ const u=((t*.8+k/3)%1); rg.scale.setScalar(.03+u*.2); rg.material.opacity=1-u; }); } }
    else if(c==='fuoco'){ for(let i=0;i<3;i++){ const l=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.16,6),mat(0x4a3020)); l.position.y=.02; l.rotation.set(1.5708,0,i*1.05); g.add(l); } const f=new THREE.Mesh(new THREE.ConeGeometry(.06,.2,10),new THREE.MeshBasicMaterial({color:0xffa030})); f.position.y=.12; g.add(f); const f2=new THREE.Mesh(new THREE.ConeGeometry(.03,.12,8),new THREE.MeshBasicMaterial({color:0xffe070})); f2.position.y=.08; g.add(f2); anim.push(t=>{ f.scale.set(1,1+.25*Math.sin(t*11),1); f2.scale.y=1+.3*Math.sin(t*14+1); }); g.userData.fire=true; }
    else if(c==='agricoltura'){ const cap=mat(0xd88070); for(let i=0;i<5;i++){ const m=new THREE.Group(), h=.06+(i%2)*.04; m.position.set(-.2+i*.1,0,(i%2)*.06); const s=new THREE.Mesh(new THREE.CylinderGeometry(.01,.013,h,6),mat(0xe8d8c0)); s.position.y=h/2; const cp=new THREE.Mesh(new THREE.SphereGeometry(.04,8,5,0,6.283,0,1.57),cap); cp.position.y=h; m.add(s,cp); g.add(m); } }
    else if(c==='guerra'){ for(const sx of[-.18,.18]){ const p=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.36,6),mat(0x5a4630)); p.position.set(sx,.18,0); g.add(p); const fl=new THREE.Mesh(new THREE.PlaneGeometry(.14,.09,4,1),new THREE.MeshStandardMaterial({color:0xb8352f,side:THREE.DoubleSide})); fl.position.set(sx+.075,.31,0); g.add(fl); anim.push(t=>{ fl.rotation.y=Math.sin(t*5+sx*9)*.35; }); } }
    else { [0xc9663a,0xe0b04a,0x4a8fa8].forEach((col,i)=>{ box(.1,.08,.1,col,0,i*.08,0); box(.02,.02,.02,0x1c1410,-.025,i*.08+.04,.052); box(.02,.02,.02,0x1c1410,.025,i*.08+.04,.052); }); }
    return g; }
  function buildSettle(x,st,cult){ const g=new THREE.Group(), anim=[], huts=[0,2,4,6][st], an=anchorOf(x.id), base=Math.atan2(an[1],an[0]||.0001);
    for(let i=0;i<huts;i++){ const th=base+(i-(huts-1)/2)*.72, r=.3+(i%2)*.06, hx=Math.cos(th)*r, hz=Math.sin(th)*r; const h=new THREE.Mesh(new THREE.SphereGeometry(.16,16,10,0,6.283,0,1.5708),mat([0x6b4a30,0x7a5636,0x5d4029][i%3])); h.position.set(hx,0,hz); h.scale.set(1,.75,1); g.add(h); const d=new THREE.Mesh(new THREE.PlaneGeometry(.07,.08),new THREE.MeshBasicMaterial({color:0x140a05})); const dir=Math.atan2(-hx,-hz); d.position.set(hx+Math.sin(dir)*.159,.04,hz+Math.cos(dir)*.159); d.rotation.y=dir; g.add(d); }
    const lm=landmark(cult,anim); lm.scale.setScalar(1.25+st*.2); g.add(lm); return {g,anim}; }
  // ---------- creature 3D (una mesh istanziata per specie) ----------
  const SIZE=x=>.22+Math.min(.12,.03*x.size); const rnd=(a,b)=>a+Math.random()*(b-a);
  const SPH=new THREE.SphereGeometry(.5,12,9), CYL=new THREE.CylinderGeometry(.5,.5,1,6), TOR=new THREE.TorusGeometry(.5,.16,6,14);
  const MM=(x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,ord='XYZ')=>new THREE.Matrix4().compose(new V3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz,ord)),new V3(sx,sy,sz));
  function mk(parts){ const pos=[],nor=[],col=[],idx=[]; let off=0; parts.forEach(({g,m,c})=>{ const geo=g.clone(); geo.applyMatrix4(m); const p=geo.attributes.position, n=geo.attributes.normal; for(let i=0;i<p.count;i++){ pos.push(p.getX(i),p.getY(i),p.getZ(i)); nor.push(n.getX(i),n.getY(i),n.getZ(i)); col.push(c.r,c.g,c.b); } if(geo.index){ for(let i=0;i<geo.index.count;i++) idx.push(geo.index.getX(i)+off); } else for(let i=0;i<p.count;i++) idx.push(i+off); off+=p.count; }); const o=new THREE.BufferGeometry(); o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); o.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); o.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); o.setIndex(idx); return o; }
  const L=(c,x,s,len=.3,tilt=.95,yaw=0)=>({g:CYL,m:MM(x,len*.5*Math.cos(tilt),s*(.07+len*.5*Math.sin(tilt)),.03,len,.03,-s*tilt,yaw,0,'YXZ'),c});
  const MODEL={
   formiche:()=>{ const c=new Col(0x2b1d14), p=[{g:SPH,m:MM(-.3,.17,0,.46,.34,.34),c},{g:SPH,m:MM(-.02,.18,0,.28,.24,.24),c},{g:SPH,m:MM(.24,.19,0,.26,.24,.24),c}]; for(const s of[-1,1]){ for(const x of[-.12,0,.12]) p.push(L(c,x,s)); p.push({g:CYL,m:MM(.4,.3,s*.07,.02,.22,.02,0,0,-.8),c}); } return mk(p); },
   termiti:()=>{ const c=new Col(0xe6d6a8), h=new Col(0x7a5a30), p=[{g:SPH,m:MM(-.36,.14,0,.34,.26,.28),c},{g:SPH,m:MM(-.14,.15,0,.3,.28,.3),c},{g:SPH,m:MM(.08,.15,0,.28,.26,.28),c},{g:SPH,m:MM(.3,.16,0,.24,.22,.24),c:h}]; for(const s of[-1,1]) for(const x of[-.1,.02,.14]) p.push(L(h,x,s,.2,.9)); return mk(p); },
   coleotteri:()=>{ const c=new Col(0x2f9a60), d=new Col(0x14281c), p=[{g:SPH,m:MM(-.05,.25,0,.78,.46,.6),c},{g:SPH,m:MM(.38,.21,0,.24,.2,.24),c:d},{g:CYL,m:MM(-.05,.46,0,.012,.02,.5,1.5708,0,0),c:d}]; for(const s of[-1,1]) for(const x of[-.15,.02,.18]) p.push(L(d,x,s,.28)); return mk(p); },
   ragni:()=>{ const c=new Col(0x3a2a35), d=new Col(0x241a22), p=[{g:SPH,m:MM(-.2,.27,0,.5,.42,.42),c},{g:SPH,m:MM(.17,.23,0,.3,.25,.28),c:d}]; for(const s of[-1,1]) for(let i=0;i<4;i++) p.push(L(d,.05+(i-1.5)*.08,s,.5,1.15,(i-1.5)*.4)); return mk(p); },
   lumache:()=>{ const c=new Col(0xc9b79c), sh=new Col(0x9a6a3c), p=[{g:SPH,m:MM(0,.1,0,.95,.2,.26),c},{g:SPH,m:MM(.44,.16,0,.2,.22,.2),c},{g:CYL,m:MM(.5,.3,.05,.02,.22,.02),c},{g:CYL,m:MM(.5,.3,-.05,.02,.22,.02),c},{g:SPH,m:MM(-.12,.34,0,.5,.52,.46),c:sh},{g:TOR,m:MM(-.12,.34,0,.62,.62,.5,0,1.5708,0),c:new Col(0x6a4220)}]; return mk(p); },
   mosche:()=>{ const c=new Col(0x222a2e), p=[{g:SPH,m:MM(0,.4,0,.46,.26,.26),c},{g:SPH,m:MM(.28,.42,0,.2,.2,.2),c:new Col(0x7a1a1a)},{g:SPH,m:MM(-.02,.56,.16,.5,.04,.26,0,0,.3),c:new Col(0xcfd8dc)},{g:SPH,m:MM(-.02,.56,-.16,.5,.04,.26,0,0,-.3),c:new Col(0xcfd8dc)}]; for(const s of[-1,1]) for(const x of[-.08,.04,.14]) p.push({g:CYL,m:MM(x,.25,s*.05,.02,.2,.02,-s*.3),c}); return mk(p); },
   _:()=>mk([{g:SPH,m:MM(0,.2,0,.6,.4,.4),c:new Col(0x888888)}])};
  const KM=(function(){ try{ return window.__KIMI?window.__KIMI(THREE):null; }catch(e){ console.warn('modelli Kimi non caricati',e&&e.message); return null; } })(); const MATL=window.__MATLIB?window.__MATLIB(THREE):null; const KLEN={formiche:.20,termiti:.24,coleotteri:.34,ragni:.30,lumache:.38,mosche:.19};
  function kimiGeo(id){ if(!KM||!KM.creatures||!KM.creatures[id]) return null; const g=KM.creatures[id].build(THREE,{seed:1}).geometry; g.computeBoundingBox(); const len=g.boundingBox.max.x-g.boundingBox.min.x, f=(KLEN[id]||len)/len; g.scale(f,f,f); g.userData.final=true; return g; }
  // creature: conta esatta, instancing, livelli di dettaglio e animazione vivono in app/modelli.js (agente tre-d)
  const MOD=window.__MODELLI(THREE,{critG,S,KLEN,camera,viewH:()=>H,level:()=>level,anchorOf,kimiGeo,fallbackGeo:id=>(MODEL[id]||MODEL._)(),SIZE}); const crt=MOD.crt;
  // meteorite di Kimi (assets/kimi/meteorite, tier close): scala a Ø 0,42 (Kimi l'ha consegnato a 0,60), appoggiato nella terra; le crepe viola sono nella emissiveTexture e si accendono con la carica
  MOD.ready.then(()=>{ const o=MOD.object('meteorite'); if(!o) return; const bb=o.box, ext=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z), k=.42/ext; o.mesh.scale.setScalar(k); o.mesh.position.set(-(bb.max.x+bb.min.x)/2*k,-.17,-(bb.max.z+bb.min.z)/2*k); o.mesh.castShadow=true; o.mesh.receiveShadow=true; o.mat.emissiveIntensity=0; stone.visible=false; stoneG.add(o.mesh); S.metMat=o.mat; }).catch(e=>console.warn('meteorite Kimi',e&&e.message));
  function syncCreatures(v){ MOD.sync(v); }
  function moveCreatures(dt,t){ if(S.v) MOD.move(dt,t,S.v,S.dry); }
  // ---------- bolle ----------
  const bubbles=[]; function bubble(id,em){ const s=mkSprite(em,.3,true); s.renderOrder=9; bubG.add(s); bubbles.push({s,id,t0:S.t}); }
  // ---------- gruppi (posizione, hit, zoom) ----------
  function center(id){ const an=anchors[id]; const c=crt[id]; if(c&&c.x&&c.x.society&&an) return new V3(an[0],S.soilTop+.15,an[1]); if(c&&c.items.length){ let x=0,z=0; c.items.forEach(i=>{x+=i.px;z+=i.pz;}); return new V3(x/c.items.length,S.soilTop+.15,z/c.items.length); } return null; }
  // ---------- camera ----------
  const cam={az:0,pol:1.06,dist:5,tx:0,ty:.85,tz:0,gaz:0,gpol:1.06,gdist:5,gtx:0,gty:.85,gtz:0}; let userT=0, dragged=false, HOMEF=1.22, W=360,H=300;
  function fitDist(){ const th=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)), a=W/H; return Math.max(2.9/(2*th),2.35/(2*th*a))*1.06; }
  function home(){ cam.gaz=0; cam.gpol=1.06; cam.gdist=fitDist()*HOMEF; cam.gtx=0; cam.gty=.85; cam.gtz=0; }
  function fit(){ const par=canvas.parentElement; const big=canvas.dataset.big==='1'; W=Math.max(200,par?par.clientWidth:360); H=big?Math.max(200,par.clientHeight||300):(window.__vase&&window.__vase.heroH?window.__vase.heroH(W):Math.round(Math.min(W*.86,Math.max(210,innerHeight*.34)))); canvas.style.width='100%'; canvas.style.height=H+'px'; renderer.setPixelRatio(level?1:Math.min(1.75,window.devicePixelRatio||1)); renderer.setSize(W,H,false); camera.aspect=W/H; camera.updateProjectionMatrix(); if(userT===0) home(); }
  function zoomTo(f){ if(!f){ home(); return; } const k=f.kind; if(k==='meteorite'){ cam.gtx=0; cam.gty=S.soilTop+.2; cam.gtz=0; cam.gdist=2.1; cam.gpol=1.25; } else if(k==='centro'){ cam.gtx=0; cam.gty=S.soilTop+.2; cam.gtz=.1; cam.gdist=2.7; cam.gpol=1.22; } else if(k==='lid'){ cam.gtx=0; cam.gty=2.3; cam.gtz=0; cam.gdist=2.4; cam.gpol=1.4; } else if(k==='pianta'&&PL&&PL.objs[f.id]){ const c=PL.objs[f.id].g.position; cam.gtx=c.x; cam.gty=c.y+.1; cam.gtz=c.z; cam.gdist=1.15; cam.gpol=1.22; cam.gaz=Math.atan2(c.x,c.z+1.6); } else { const c=center(f.id); if(c){ cam.gtx=c.x; cam.gty=c.y+.1; cam.gtz=c.z; cam.gdist=2.1; cam.gpol=1.22; cam.gaz=Math.atan2(c.x,3)*.5; } } userT=0; }
  canvas.addEventListener('pointerdown',e=>{ dragged=false; canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId); pts[e.pointerId]={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY}; if(Object.keys(pts).length===1){ try{ pts[e.pointerId].wipe=glassFX.start(e); }catch(err){} } else Object.values(pts).forEach(p=>{ if(p.wipe){ glassFX.end(); p.wipe=false; } }); });
  const pts={}; canvas.addEventListener('pointermove',e=>{ const p=pts[e.pointerId]; if(!p) return; const ids=Object.keys(pts); if(p.wipe&&ids.length===1){ glassFX.move(e); if(Math.hypot(e.clientX-p.x0,e.clientY-p.y0)>7) dragged=true; p.x=e.clientX; p.y=e.clientY; userT=S.t; return; } if(ids.length===2){ const o=pts[ids.find(i=>+i!==e.pointerId)], d0=Math.hypot(p.x-o.x,p.y-o.y); p.x=e.clientX; p.y=e.clientY; const d1=Math.hypot(p.x-o.x,p.y-o.y); cam.gdist=clamp(cam.gdist*d0/Math.max(20,d1),1.6,fitDist()*1.4); dragged=true; userT=S.t; return; } const dx=e.clientX-p.x, dy=e.clientY-p.y; if(Math.hypot(e.clientX-p.x0,e.clientY-p.y0)>7) dragged=true; if(dragged){ cam.gaz=clamp(cam.gaz-dx*.006,-1.3,1.3); cam.gpol=clamp(cam.gpol+dy*.004,.85,1.5); userT=S.t; } p.x=e.clientX; p.y=e.clientY; });
  const up=e=>{ const p=pts[e.pointerId]; if(p&&p.wipe) glassFX.end(); delete pts[e.pointerId]; }; canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',e=>{ e.preventDefault(); cam.gdist=clamp(cam.gdist*(1+e.deltaY*.001),1.6,fitDist()*1.4); userT=S.t; },{passive:false});
  // ---------- giorno/notte ----------
  const BG={giorno:'linear-gradient(180deg,#d9b182,#8a5a34)',notte:'radial-gradient(1.2px 1.2px at 12% 14%,#fff,transparent),radial-gradient(1px 1px at 33% 8%,#fff,transparent),radial-gradient(1.4px 1.4px at 58% 18%,#fff,transparent),radial-gradient(1px 1px at 82% 10%,#fff,transparent),radial-gradient(1px 1px at 91% 28%,#fff,transparent),radial-gradient(1.2px 1.2px at 22% 30%,#fff,transparent),linear-gradient(180deg,#0b1030,#241a4e)'};
  const bgImg=new Image(); if(window.__TEX&&window.__TEX.bg_day) bgImg.src=window.__TEX.bg_day;
  function snap(){ try{ renderer.render(scene,camera); const W0=canvas.width,H0=canvas.height, s=Math.min(W0,H0)*.95, sx=(W0-s)/2, sy=Math.max(0,H0*.48-s*.55); const c=document.createElement('canvas'); c.width=c.height=112; const g=c.getContext('2d'); if(bgImg.complete&&bgImg.width){ const k=Math.max(112/bgImg.width,112/bgImg.height); g.drawImage(bgImg,(112-bgImg.width*k)/2,(112-bgImg.height*k)/2,bgImg.width*k,bgImg.height*k); } else { g.fillStyle='#2a211b'; g.fillRect(0,0,112,112); } g.drawImage(canvas,sx,sy,s,s,0,0,112,112); return c.toDataURL('image/jpeg',.72); }catch(e){ return null; } }
  function setNight(n){ S.night=n; if(window.__TEX) bgImg.src=n?window.__TEX.bg_night:window.__TEX.bg_day; canvas.style.background=(TX&&TX.bg_day)?('#0b1030 url('+(n?TX.bg_night:TX.bg_day)+') center/cover no-repeat'):(n?BG.notte:BG.giorno); LU.set(n?'notte':'giorno'); }
  // ---------- aggiornamento struttura dallo stato ----------
  let plantKey='', settleKey='', objKey='', lastView=-9;
  function syncStructure(v){ const pk=v.setup.piante.join(','); if(pk!==plantKey){ plantKey=pk; while(plantsG.children.length) plantsG.remove(plantsG.children[0]); Object.keys(plantObjs).forEach(k=>delete plantObjs[k]); v.setup.piante.forEach((id,i)=>{ let o=null; if(PL){ try{ o=PL.mk(id,i,hashStr(id)); }catch(e){ console.warn('pianta viva',id,e&&e.message); } } if(!o) o=mkPlant(id,i,hashStr(id)); o.g.traverse(m=>{ if(m.isMesh) m.castShadow=true; }); plantObjs[id]=o; plantsG.add(o.g); }); }
    v.sp.forEach(x=>{ const key=x.id+'|'+(x.alive&&x.society?x.society.cult+'|'+(()=>{ const age=v.d-x.society.since; return age<8?0:age<24?1:age<60?2:3; })():'-'); if(settles[x.id]&&settles[x.id].key===key) return; if(settles[x.id]){ settleG.remove(settles[x.id].g); delete settles[x.id]; } if(x.alive&&x.society){ const age=v.d-x.society.since, st=age<8?0:age<24?1:age<60?2:3, o=buildSettle(x,st,x.society.cult), an=anchorOf(x.id); o.g.position.set(an[0],S.soilTop,an[1]); o.g.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } }); o.key=key; if(x.society.culto){ const eye=mkSprite(x.society.culto==='giocatore'?'👁️':'☄️',.16); eye.position.set(0,.62,0); o.g.add(eye); o.eye=eye; } settleG.add(o.g); settles[x.id]=o; } });
    const ok=v.setup.oggetti.join(','); if(ok!==objKey){ objKey=ok; while(objG.children.length) objG.remove(objG.children[0]); const P=[[-.72,.1,.9],[.72,.12,-.9],[0,-.74,0]]; v.setup.oggetti.forEach((id,i)=>{ let o=null; try{ if(KM&&KM.objects&&KM.objects[id]){ o=KM.objects[id].build(THREE,{seed:1}).group; if(MATL) MATL.dress(o,id); } }catch(e){ console.warn('oggetto',id,e&&e.message); } if(!o) o=mkObject(id); o.position.set(P[i%3][0],0,P[i%3][1]); o.rotation.y=P[i%3][2]; o.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } }); objG.add(o); }); }
    syncCreatures(v); }
  // ---------- effetti delle cure ----------
  const FXN=70, fxPos=new Float32Array(FXN*3), fxCol=new Float32Array(FXN*3), fxGeo=new THREE.BufferGeometry(); fxGeo.setAttribute('position',new THREE.BufferAttribute(fxPos,3)); fxGeo.setAttribute('color',new THREE.BufferAttribute(fxCol,3));
  const fxPts=new THREE.Points(fxGeo,new THREE.PointsMaterial({map:glowTex('rgba(255,255,255,1)'),size:.07,transparent:true,vertexColors:true,depthWrite:false,sizeAttenuation:true})); fxPts.visible=false; fxPts.renderOrder=8; fxPts.frustumCulled=false; jar.add(fxPts);
  const fx={kind:null,t0:0,st:[]};
  function fxStart(kind){ const r=Math.random, col={terra:[.45,.3,.18],acqua:[.45,.75,1],nutri:[.6,.95,.4],pulisci:[1,1,1]}[kind]; if(!col) return; fx.kind=kind; fx.t0=S.t; fx.st=[];
    for(let i=0;i<FXN;i++){ const a=kind==='pulisci'?.4+r()*2.3:r()*6.283, d=Math.sqrt(r())*.6; fx.st.push({x:Math.cos(a)*d,z:Math.sin(a)*d,y0:kind==='pulisci'?.25+r()*.85:1.45+r()*.5,v:kind==='nutri'?.25+r()*.2:kind==='pulisci'?.08:1.3+r()*1.2,delay:r()*.5,a}); fxCol[i*3]=col[0]; fxCol[i*3+1]=col[1]; fxCol[i*3+2]=col[2]; }
    fxGeo.attributes.color.needsUpdate=true; fxPts.visible=true; fxPts.material.blending=kind==='terra'?THREE.NormalBlending:THREE.AdditiveBlending; fxPts.material.size=kind==='terra'?.06:.075; fxPts.material.needsUpdate=true; }
  function fxUpdate(){ if(!fx.kind) return; const k=S.t-fx.t0; let alive=0; for(let i=0;i<FXN;i++){ const s=fx.st[i], t=k-s.delay; let x=s.x,y=-9,z=s.z; if(t>0){ if(fx.kind==='pulisci'){ x=Math.cos(s.a)*.97; z=Math.sin(s.a)*.97; y=s.y0+t*s.v; if(t<1.3) alive++; else y=-9; } else if(fx.kind==='nutri'){ y=S.soilTop+.05+t*s.v; if(t<1.7) alive++; else y=-9; } else { y=s.y0-t*s.v; if(y<S.soilTop+.02) y=-9; else alive++; } } fxPos[i*3]=x; fxPos[i*3+1]=y; fxPos[i*3+2]=z; } fxGeo.attributes.position.needsUpdate=true; if(!alive&&k>.7){ fx.kind=null; fxPts.visible=false; } }
  // ---------- terreno vivo: bagnato/secco, linea d'acqua, muschio (microclima __app.micro(); senza microclima usa i bisogni) ----------
  function terrainTick(dt){ const m=S.m; let wet, wl=0, rist=0;
    if(m&&m.acqua){ wet=clamp(m.acqua.terriccio*.85+m.acqua.superficie*.45); wl=clamp(Math.max(m.acqua.drenaggio,m.acqua.ristagno*.9)); rist=clamp(m.acqua.ristagno); } else wet=clamp((S.n.um-.2)/.7);
    const k=Math.min(1,dt*.35); S.wet+=(wet-S.wet)*k; S.wl+=(wl-S.wl)*Math.min(1,dt*.25); S.rist+=(rist-S.rist)*k;
    const w=S.wet; // secco: chiaro e opaco · bagnato: scuro e lucido (la mappa resta la stessa: cambia la tinta, la roughness e un velo di clearcoat)
    if(FT) soilMat.color.setRGB(1.06-.62*w,1.02-.62*w,.98-.6*w).lerp(CPOOR2,S.poor*.5); else soilMat.color.setRGB(1.16-.66*w,1.04-.6*w,.88-.5*w).lerp(CPOOR2,S.poor*.5); soilMat.roughness=1-.5*w; soilMat.clearcoat=.5*w; sideMat.color.copy(soilMat.color).multiplyScalar(.9); sideMat.roughness=soilMat.roughness; sideMat.clearcoat=soilMat.clearcoat*.6;
    const show=S.wl>.1; water.visible=waterTop.visible=show; if(show){ const wy=S.wl*GH; waterPlane.constant=wy; waterTop.position.y=wy; waterMat.color.copy(CWATER).lerp(CMURK,S.rist); waterTop.material.color.copy(CWTOP).lerp(CMURK,S.rist*.7); waterMat.opacity=.55+.3*S.rist; waterTop.material.opacity=.45+.25*S.rist; }
    if(FG){ gravMat.color.setScalar(1.04-.5*S.wl); gravMat.roughness=1-.45*S.wl; } else gravMat.color.setScalar(1.3-.45*S.wl); // ghiaia chiara sopra la linea d'acqua, più scura se sommersa
    // muschio (C6): secco bruno-grigio opaco → bagnato verde saturo lucido; solo con il microclima (altrimenti decide upd(v,dry))
    const mo=plantObjs.muschio; if(!PL&&m&&mo&&mo.mats&&mo.mats[0]){ /* con le piante vive (app/piante.js) il muschio lo colora piante.js */ const vig=m.piante&&m.piante.muschio?clamp(m.piante.muschio.vigore):1, sup=clamp(m.acqua.superficie*1.3+m.acqua.terriccio*.3); const g=clamp(vig*.5+sup*.6); S.moss+=(g-S.moss)*Math.min(1,dt*.5); mo.mats[0].color.copy(MOSSDRY).lerp(MOSSWET,S.moss); mo.mats[0].roughness=1-.4*S.moss; if(mo.mats[1]) mo.mats[1].color.copy(MOSSDRYS).lerp(MOSSWETS,S.moss); } }
  // ---------- ciclo ----------
  let raf=0, running=false, lastT=0, lastDraw=0, ema=33, slowN=0, level=0, calm=0;
  function perfGuard(raw){ if(window.__fast||window.__noguard) return; ema=ema*.93+Math.min(raw,400)*.07; calm++; if(calm<45) return; if(ema>85){ slowN++; if(slowN>=30){ slowN=0; calm=0; if(level===0){ level=1; renderer.setPixelRatio(1); LU.level(1); try{ terrainLevel(1); if(PL&&PL.level) PL.level(1); }catch(e){} fit(); if(window.__ui&&window.__app) window.__app.toast('Il 3D va a scatti: abbasso la risoluzione.'); } else if(level===1){ level=2; LU.level(2); try{ terrainLevel(2); if(PL&&PL.level) PL.level(2); }catch(e){} } else if(level===2){ level=3; try{ renderer.setPixelRatio(Math.min(renderer.getPixelRatio(),1)); }catch(e){} fit(); } /* solo 3D (Giovanni): niente più vista 2D, all'ultimo livello si resta in 3D a risoluzione minima */ } } else slowN=Math.max(0,slowN-1); }
  function frame(ms){ raf=requestAnimationFrame(frame); const t00=performance.now(); if(document.hidden||!canvas.isConnected) return; if(ms-lastDraw<30) return; const raw=(ms-lastT)||33; const dt=Math.min(.1,raw/1000||.016); try{ glassFX.tick(dt); }catch(e){} lastT=ms; lastDraw=ms; S.t+=dt; const t=S.t; perfGuard(raw); if(scene.environment&&corkMats[0].envMap!==scene.environment) corkMats.forEach(m=>{ m.envMap=scene.environment; m.needsUpdate=true; }); /* envMapIntensity vale solo con envMap esplicita: il metallo del tappo riflette la stanza */
    if(t-lastView>.25){ lastView=t; const v=A.sim.view(); S.v=v; try{ S.m=A.micro?A.micro():null; }catch(e){ S.m=null; } syncStructure(v); const n=v.needs; S.n=n; S.dry=clamp((.5-n.um)/.45); S.poor=clamp((.45-n.ter)/.4); const nt=!!(window.__vase&&window.__vase.isNight&&window.__vase.isNight()); if(nt!==S.night) setNight(nt); if(S.lastE-v.E>30) S.flash=1; S.lastE=v.E; S.E=v.E; }
    const v=S.v; if(!v) return;
    // terra
    const ter=S.n.ter, thick=ter>.04?.05+.34*clamp(ter):0; S.soilGoal=SOIL0+thick; S.soilTop+=(S.soilGoal-S.soilTop)*Math.min(1,dt*3);
    if(thick>0){ soil.visible=disc.visible=true; const h=S.soilTop-SOIL0; soil.scale.y=Math.max(.01,h+AMP*.8); soil.position.y=SOIL0+soil.scale.y/2; disc.position.y=S.soilTop; if(sideMat.map&&Math.abs(sideMat.map.repeat.y*ST-h)>.003) [sideMat.map,sideMat.normalMap,sideMat.roughnessMap].forEach(tx=>{ if(tx) tx.repeat.set(6/ST,Math.max(.05,h)/ST); }); } else soil.visible=disc.visible=false;
    terrainTick(dt);
    cracks.visible=S.dry>.3&&thick>0; cracks.position.y=S.soilTop+AMP+.006; cracks.material.opacity=clamp((S.dry-.3)*1.4);
    // meteorite
    const pulse=.5+.5*Math.sin(t*(2.2+v.E*.03)), fl=S.flash; S.flash=Math.max(0,S.flash-dt*1.4);
    stoneG.position.set(0,S.soilTop+.13,0); stoneMat.emissiveIntensity=.3+(v.E/100)*1.5*pulse+fl*2.2; if(S.metMat) S.metMat.emissiveIntensity=(v.E/100)*(1.2+1.8*pulse)+fl*3; LU.meteora(S.soilTop+.5,.2+1.3*(v.E/100)*pulse+fl*5);
    // piante
    plantsG.children.forEach((g,i)=>{ g.position.y=S.soilTop; }); if(PL) PL.tick(dt,t,v,plantObjs); else v.plants.forEach(p=>{ const o=plantObjs[p.id]; if(!o) return; const key=Math.round(p.v*40)+':'+Math.round(S.dry*40)+':'+(S.v&&S.v.R>.6?1:0); if(o.key!==key){ o.key=key; o.upd(p.v,S.dry); } });
    // oggetti
    objG.children.forEach(s=>{ s.position.y=S.soilTop; });
    // insediamenti
    let fire=false, fp=[]; Object.entries(settles).forEach(([id,o])=>{ o.g.position.y=S.soilTop; o.anim.forEach(f=>f(t)); if(o.eye) o.eye.position.y=.62+Math.sin(t*1.6)*.02; if(o.g.userData.fire||o.g.children.some(c=>c.userData&&c.userData.fire)){ fire=true; fp=[o.g.position.x,S.soilTop+.25,o.g.position.z]; } }); LU.fuoco(fire?.7+.3*Math.sin(t*13):0,...fp);
    moveCreatures(dt,t); fxUpdate();
    // condensa e muffa
    const nd=Math.round(clamp(S.n.um)*dropN); dropGeo.setDrawRange(0,nd); for(let i=0;i<nd;i++){ dropPos[i*3+1]-=dropV[i]*dt; if(dropPos[i*3+1]<.4) dropPos[i*3+1]=2.0; } dropGeo.attributes.position.needsUpdate=true;
    const nm=Math.round(clamp((1-S.n.pul-.12)/.8)*molds.length); molds.forEach((m,i)=>{ m.visible=i<nm; });
    // bolle
    for(let i=bubbles.length-1;i>=0;i--){ const b=bubbles[i], k=(t-b.t0)/2.4; if(k>=1){ bubG.remove(b.s); bubbles.splice(i,1); continue; } const c=center(b.id)||new V3(0,S.soilTop,0); b.s.position.set(c.x,c.y+.4+k*.4,c.z); b.s.material.opacity=1-k*k; }
    // camera
    const idle=t-userT>5; if(idle&&cam.gdist<fitDist()*HOMEF*1.05&&cam.gtx===0) cam.gaz=Math.sin(t*.25)*.12; const L=Math.min(1,dt*5);
    ['az','pol','dist','tx','ty','tz'].forEach(k=>{ cam[k]+=(cam['g'+k]-cam[k])*L; });
    camera.position.set(cam.tx+cam.dist*Math.sin(cam.pol)*Math.sin(cam.az),cam.ty+cam.dist*Math.cos(cam.pol),cam.tz+cam.dist*Math.sin(cam.pol)*Math.cos(cam.az)); camera.lookAt(cam.tx,cam.ty,cam.tz);
    LU.update(dt); const tr=performance.now(); renderer.info.autoReset=false; renderer.info.reset(); renderer.render(scene,camera); const te=performance.now(); const _ri=renderer.info.render; window.__v3dT={logic:Math.round(tr-t00),render:Math.round(te-tr),calls:_ri.calls,tris:_ri.triangles}; }
  canvas.addEventListener('webglcontextlost',e=>{ e.preventDefault(); if(window.__vase) window.__vase.set3d(false).then(()=>{ if(window.__ui) window.__ui.render(); }); });
  const proj=p=>{ const q=p.clone().project(camera), r=canvas.getBoundingClientRect(); return {x:r.left+(q.x*.5+.5)*r.width,y:r.top+(-q.y*.5+.5)*r.height,z:q.z}; };
  function groups(){ const o={}; (S.v?S.v.sp:[]).forEach(x=>{ const c=center(x.id); if(c&&x.alive) o[x.id]={x:c.x,y:c.y,z:c.z}; }); return o; }
  const api={glassState:()=>glassFX.state(),terreno:()=>({wet:+S.wet.toFixed(3),wl:+S.wl.toFixed(3),rist:+S.rist.toFixed(3),moss:+S.moss.toFixed(3),level:terrainLvl,micro:!!S.m,soilTop:+S.soilTop.toFixed(3),water:water.visible}),terrainLevel,settle(n,cv){ if(cv) Object.keys(cv).forEach(k=>{ cam['g'+k]=cv[k]; }); for(let i=0;i<(n||30);i++){ try{ glassFX.tick(.5); }catch(e){} terrainTick(.5); } ['az','pol','dist','tx','ty','tz'].forEach(k=>{ cam[k]=cam['g'+k]; }); }, // settle: solo per test e schermate (porta subito a regime le transizioni)
    snap,canvas,fit,zoomTo,bubble,groups,fx:fxStart,modelli:MOD,piante:PL,lid:corkMats,
    start(){ if(running) return; running=true; setNight(!!(window.__vase&&window.__vase.isNight&&window.__vase.isNight())); fit(); home(); cam.az=cam.gaz; cam.pol=cam.gpol; cam.dist=cam.gdist; cam.tx=cam.gtx; cam.ty=cam.gty; cam.tz=cam.gtz; raf=requestAnimationFrame(frame); },
    stop(){ running=false; cancelAnimationFrame(raf); },
    reset(){ userT=0; home(); },
    screenOf(id){ const c=center(id); if(!c) return null; const p=proj(c.clone().add(new V3(0,.1,0))); return {x:p.x,y:p.y}; },
    hit(cx,cy){ if(dragged){ dragged=false; return null; } const g=groups(); let best=null,bd=1e9; Object.entries(g).forEach(([id,c])=>{ const p=proj(new V3(c.x,c.y+.1,c.z)); const d=Math.hypot(p.x-cx,p.y-cy), lim=Math.max(34,canvas.clientHeight*.14); if(d<lim&&d<bd){ bd=d; best=id; } }); return best; },
    get info(){ const T=window.__v3dT; return T&&T.calls!=null?{renderer:T.calls,tris:T.tris}:{renderer:renderer.info.render.calls,tris:renderer.info.render.triangles}; }};
  return api;
}
})();
