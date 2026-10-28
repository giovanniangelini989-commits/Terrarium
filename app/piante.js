/* Piante vive — app/piante.js (agente tre-d)
   Le piante crescono e vivono nel vaso guidate dal microclima (__app.micro().piante = {id:{vigore,crescita}}).
   Geometria procedurale costruita UNA volta, con gli stessi attributi che chiediamo a Kimi (brief v3 §5.3):
   _GROW (ordine di comparsa) e _SWAY (0 base → 1 punta), più tre pose per organo (chiusa · mezza · aperta) che fanno
   da morph target «uncurl» (felce, carnivora) o «emerge» (succulenta, fungo). Tutto il movimento è nel vertex shader:
   crescita, srotolamento, turgore, afflosciamento, vento. La CPU aggiorna solo qualche uniforme per fotogramma.
   Quando arriveranno i modelli veri, l'adattatore in fondo (ADATTA) mappa gli stessi stati su _GROW/_SWAY/morph. */
window.__PIANTE=function(THREE,env){
  const {S,ptex,TX,rngS,clamp,SLOTS,A,FOTO}=env;
  // materiali fotografici (foto vere: muschio ripetibile 5 cm, fronda di felce scontornata); senza __MAT_FOTO restano i colori procedurali
  const FM=FOTO?FOTO.mat('muschio'):null, FF=FOTO?FOTO.mat('foglia_felce'):null, FS=FOTO?FOTO.mat('foglia_succulenta'):null, FD=FOTO?FOTO.mat('drosera'):null, FU=FOTO?FOTO.mat('fungo'):null, FMS=FOTO?FOTO.mat('muschio_secco'):null, FXM=FOTO?FOTO.mat('funghi_magici'):null, FXC=FOTO?FOTO.mat('carnivora_magica'):null, FXL=FOTO?FOTO.mat('foglia_magica'):null, FXMU=FOTO?FOTO.mat('muschio_magico'):null, FXF=FOTO?FOTO.mat('felce_magica'):null, FXS=FOTO?FOTO.mat('succulenta_magica'):null, FRA=FOTO?FOTO.mat('rametto'):null, FCO=FOTO?FOTO.mat('corteccia_gelso'):null, FOTOMATS=[], SECCOMATS=[]; let fotoLvl=0;
  function fotoBind(mat,F,depth){ FOTOMATS.push({mat,F,depth}); F.when(()=>fotoApply(mat,F,depth)); }
  function fotoApply(mat,F,depth){ const M=F.maps(fotoLvl); if(!M) return; mat.map=M.map; mat.normalMap=M.normalMap||null; mat.roughnessMap=M.roughnessMap||null; if(mat.normalMap) mat.normalScale.set(1,1); mat.needsUpdate=true; if(depth){ depth.map=M.map; depth.needsUpdate=true; } }
  // muschio secco: seconda foto mescolata alla prima in base a uDry (vDry nel fragment)
  function seccoBind(mat){ if(!FMS) return; mat.userData.secco={value:null}; mat.userData.seccoOn={value:0}; SECCOMATS.push(mat); FMS.when(()=>seccoApply(mat)); }
  function seccoApply(mat){ const M=FMS.maps(fotoLvl); if(!M||!mat.userData.secco) return; mat.userData.secco.value=M.map; mat.userData.seccoOn.value=1; }
  function level(l){ l=Math.max(0,Math.min(2,l|0)); if(l===fotoLvl) return; fotoLvl=l; FOTOMATS.forEach(b=>{ if(b.F.ready) fotoApply(b.mat,b.F,b.depth); }); MAGICMATS.forEach(m=>{ if(m.userData.F&&m.userData.F.ready) magApply(m); }); if(FMS&&FMS.ready) SECCOMATS.forEach(seccoApply); } const V3=THREE.Vector3, Col=THREE.Color, M4=THREE.Matrix4;
  const Y=new V3(0,1,0);
  // ---------- stati visivi e mappe di crescita ----------
  // crescita = ore «buone» accumulate dal microclima (≈ 12–19 al giorno reale con vigore alto)
  const GROW={muschio:c=>Math.min(1.3,c/190), felce:c=>Math.min(1.25,c/260), succulenta:c=>Math.min(1.2,c/600), carnivora:c=>Math.min(1.2,c/300), fungo:c=>c/60};
  const GMIN={muschio:.2, felce:.14, succulenta:.14, carnivora:.12, fungo:0};
  const BREF={muschio:.35,felce:.45,succulenta:.2,carnivora:.25,fungo:.15}, BALT={muschio:.6,felce:1.15,succulenta:.85,carnivora:.95,fungo:.8};
  const KIND={felce:1,succulenta:2,carnivora:3,fungo:4};
  const CURL_FUN=5, CURL_MUS=5, CURL_SPK=6;

  // ---------- shader comune ----------
  const GLSL_ROT='vec3 rotA(vec3 v,vec3 a,float t){ float c=cos(t),s=sin(t); return v*c+cross(a,v)*s+a*dot(a,v)*(1.-c); }\n';
  const HEAD_ORG=`uniform float uGrow,uTurgor,uDroop,uDry,uRot,uDew,uWind,uTime;
attribute vec3 aP0,aP1,aPivot,aAxis,aSpine; attribute float aGrow,aSway,aPhase,aType;
varying float vDry,vRot,vShade; varying vec3 vMW;
${GLSL_ROT}
struct Org{ float open,sc,bend,wilt; };
Org org(){ Org o; o.wilt=0.;
#if KIND==1
  o.open=smoothstep(aGrow,aGrow+.25,uGrow); o.sc=(.2+.8*o.open)*(.55+.45*min(uGrow,1.)); o.bend=-uDroop*aSway*.95;
#elif KIND==2
  o.open=smoothstep(aGrow,aGrow+.18,uGrow); o.sc=(.35+.65*o.open)*(.4+.6*min(uGrow,1.)); o.bend=-uDroop*aSway*.7;
#elif KIND==3
  o.open=smoothstep(aGrow,aGrow+.22,uGrow); o.sc=(.25+.75*o.open)*(.5+.5*min(uGrow,1.)); o.bend=-uDroop*aSway*.85;
#else
  float u=uGrow-aPhase; u=uGrow<1.?max(0.,u):fract(u);
  o.open=smoothstep(.12,.5,u); float w=max(smoothstep(.62,.95,u),uDroop); o.sc=smoothstep(0.,.32,u)*(1.-.4*w); o.bend=-w*aSway*1.1; o.wilt=w;
#endif
  return o; }
vec3 plantPos(Org o){ vec3 p=o.open<.5?mix(aP0,aP1,o.open*2.):mix(aP1,position,o.open*2.-1.);
  float ap=smoothstep(.7,1.,o.open); float lat=mix(1.,1.-.45*uDroop,ap); if(aType==3.) lat=uDew*ap;
  p=aSpine+(p-aSpine)*lat; p=aPivot+(p-aPivot)*o.sc; p=aPivot+rotA(p-aPivot,aAxis,o.bend);
  float w=uWind*aSway*aSway*.011*o.sc; p+=aAxis*w*(sin(uTime*1.6+aPhase*6.28+aSway*2.)+.5*sin(uTime*2.7+aPhase*3.1))+vec3(0.,1.,0.)*w*.35*sin(uTime*2.1+aPhase*5.);
  return p; }
`;
  const HEAD_INST=`uniform float uGrow,uTurgor,uDry,uRot,uWind,uTime; attribute float iGrow,iPhase; varying float vDry,vRot,vShade; varying vec3 vMW;\n`;
  const FRAG_HEAD='uniform float uGloss,uTrans,uMut,uCharge,uTime,uFung,uBite; varying float vDry,vRot,vShade; varying vec3 vMW;\n';
  const FRAG_COL=`#include <color_fragment>
if(uBite>.001){ vec3 bq_=vMW*15.; vec2 bc_=floor(bq_.xz+bq_.y*.7); float bh_=fract(sin(dot(bc_,vec2(12.9898,78.233)))*43758.5453); vec2 bo_=vec2(fract(bh_*7.3),fract(bh_*3.7))*.5+.25; float bd_=length(fract(bq_.xz+bq_.y*.7)-bo_); if(bh_<uBite*.55&&bd_<.2+.14*fract(bh_*11.)) discard; }
diffuseColor.rgb*=vShade;
{ float d=clamp(vDry,0.,1.); vec3 g=vec3(dot(diffuseColor.rgb,vec3(.3,.59,.11))); diffuseColor.rgb=mix(diffuseColor.rgb,mix(g,diffuseColor.rgb,.4)*vec3(1.3,1.08,.55)+vec3(.1,.07,0.),d); }
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.32,.28,.2),clamp(vRot,0.,1.));
{ float nr=exp(-length(vMW.xz)*1.5); float l_=dot(diffuseColor.rgb,vec3(.3,.59,.11)); diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.5,.4,.95)*(.25+l_*1.1),clamp(uMut*(.05+.2*nr),0.,.22)); }`;
  // mutazione: bagliore viola #A88BFF su bordi (fresnel) e venature, più forte vicino al sasso e con la carica; verde #7CF5C8 solo come riflesso freddo raro
  const FRAG_MUT=`#ifndef DEPTH_PACKING
if(uMut>.004||uFung>.5){ float um=max(uMut,uFung*.55); float dd=length(vMW.xz), nr=exp(-dd*1.7), fr=pow(1.-abs(dot(normalize(normal),normalize(vViewPosition))),2.4);
  float vn=abs(sin(vMW.x*85.+sin(vMW.z*61.+vMW.y*40.)*2.4)*sin(vMW.z*73.-vMW.y*55.+sin(vMW.x*47.)*1.8)); float vein=1.-smoothstep(0.,.22,vn);
  float lm=dot(diffuseColor.rgb,vec3(.3,.59,.11)); float st=um*(.45+.9*nr)*(.55+.7*uCharge)*(1.+.22*sin(uTime*2.1+dd*5.));
  float cold=smoothstep(.7,.94,sin(vMW.x*17.+vMW.z*11.+vMW.y*23.)*.5+.5);
  float irid=.5+.5*sin(vMW.y*9.+vMW.x*6.+dot(normalize(normal),vec3(1.,.4,.2))*3.+uTime*.4);
  vec3 vio=vec3(.659,.545,1.), rosa=vec3(1.,.38,.82), azz=vec3(.35,.7,1.);
  vec3 tint=mix(vio,mix(rosa,azz,irid),smoothstep(.45,1.,um)*.55);
  vec3 em=tint*(fr*1.8+vein*(.5+1.1*nr))*(.35+.6*lm)+vec3(.486,.961,.784)*fr*cold*.3;
  if(uFung>.5){ float up=smoothstep(-.1,.6,normalize(normal).y); em+=mix(vio,vec3(.5,.45,1.),irid*.35)*vec3(.8,.55,1.)*(.3+.45*fr+.25*up)*(.45+.6*nr); } /* fungo: cappello e lamelle luminosi */
  totalEmissiveRadiance+=em*st*1.7; }
#endif`;
  const FRAG_ROUGH='#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,roughnessFactor*.5,uGloss); roughnessFactor=mix(roughnessFactor,min(1.,roughnessFactor+.3),clamp(vDry,0.,1.));';
  // luce che passa attraverso la foglia (translucenza economica: luce principale da dietro)
  const FRAG_TRANS='#include <lights_fragment_end>\n#if NUM_DIR_LIGHTS > 0\nreflectedLight.directDiffuse += diffuseColor.rgb*directionalLights[0].color*uTrans*max(0.,-dot(normal,directionalLights[0].direction))*.55;\n#endif\n';
  // muschio fotografico: proiezione dall'alto nello spazio della pianta (la foto è ripresa dall'alto; niente pizzicature ai poli)
  const UV_PLANAR=FM?`vec2 fuv_=(instanceMatrix*vec4(transformed,1.)).xz/${FM.scala}+vec2(.5);\n#ifdef USE_MAP\nvMapUv=fuv_;\n#endif\n#ifdef USE_NORMALMAP\nvNormalMapUv=fuv_;\n#endif\n#ifdef USE_ROUGHNESSMAP\nvRoughnessMapUv=fuv_;\n#endif\n`:'';
  function patch(mat,U,kind,inst){ const head=inst?HEAD_INST:HEAD_ORG;
    const begin=inst?(kind===CURL_SPK
      ?`float op=smoothstep(iGrow-.12,iGrow+.08,uGrow); float sc=op*(.6+.4*min(uGrow,1.)); vec3 transformed=position*sc; transformed.xz*=(.35+.65*uTurgor); transformed.y*=(.55+.45*uTurgor); transformed.x+=uWind*.0025*sin(uTime*2.2+iPhase*6.28)*position.y*25.; vDry=uDry; vRot=uRot; vShade=1.;`
      :`float op=smoothstep(iGrow-.12,iGrow+.08,uGrow); float sc=op*(.6+.4*min(uGrow,1.)); vec3 transformed=position*sc; transformed.y*=(.42+.58*uTurgor); vDry=uDry; vRot=uRot; vShade=.45+.55*clamp(position.y*.75+.45,0.,1.);`)
      :`Org o_=org(); vec3 transformed=plantPos(o_); vDry=uDry+o_.wilt*.55; vRot=uRot+o_.wilt*.6; vShade=1.;`;
    mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U); const SC=mat.userData.secco; if(SC){ sh.uniforms.mapSecco=SC; sh.uniforms.uSeccoOn=mat.userData.seccoOn; }
      sh.vertexShader=sh.vertexShader.replace('void main() {','#define KIND '+kind+'\n'+head+'void main() {').replace('#include <begin_vertex>',begin+(inst?UV_PLANAR:'')).replace('#include <project_vertex>','#include <project_vertex>\n#ifdef USE_INSTANCING\nvMW=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;\n#else\nvMW=(modelMatrix*vec4(transformed,1.)).xyz;\n#endif');
      if(!inst) sh.vertexShader=sh.vertexShader.replace('#include <beginnormal_vertex>','Org on_=org(); vec3 objectNormal=rotA(normal,aAxis,on_.bend);');
      sh.fragmentShader=sh.fragmentShader.replace('void main() {',FRAG_HEAD+'void main() {'); if(SC) sh.fragmentShader=sh.fragmentShader.replace('void main() {','uniform sampler2D mapSecco; uniform float uSeccoOn;\nvoid main() {').replace('vec4 sampledDiffuseColor = texture2D( map, vMapUv );','vec4 sampledDiffuseColor = texture2D(map,vMapUv); if(uSeccoOn>.5) sampledDiffuseColor=mix(sampledDiffuseColor,texture2D(mapSecco,vMapUv),smoothstep(.12,.65,vDry));'); sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',FRAG_COL).replace('#include <roughnessmap_fragment>',FRAG_ROUGH).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n'+FRAG_MUT).replace('#include <lights_fragment_end>',FRAG_TRANS); };
    mat.customProgramCacheKey=()=>'pianta'+kind+(inst?'i':'o')+(mat.userData.secco?'s':'')+(mat.isMeshDepthMaterial?'d':'m'); return mat; }
  function uniforms(){ return {uGrow:{value:0},uTurgor:{value:1},uDroop:{value:0},uDry:{value:0},uRot:{value:0},uDew:{value:0},uWind:{value:0},uTime:{value:0},uGloss:{value:0},uTrans:{value:0},uMut:{value:0},uCharge:{value:0},uFung:{value:0},uBite:{value:0}}; }
  function shadowed(mesh,U,kind,inst){ mesh.customDepthMaterial=patch(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}),U,kind,inst); mesh.castShadow=true; mesh.receiveShadow=true; return mesh; }

  // ---------- costruttore di geometria con attributi ----------
  // addOrgan(buildFn(q)→{pos:[],nor:[],uv:[],col:[],idx:[],meta:[{sway,spine:V3}]}, {pivot,axis,grow,phase,type,group})
  function Builder(){ const G={}; const grp=k=>G[k]||(G[k]={pos:[],nor:[],uv:[],col:[],p0:[],p1:[],piv:[],ax:[],sp:[],gr:[],sw:[],ph:[],ty:[],idx:[],n:0});
    return {
      add(build,o){ const g=grp(o.group||0), a=build(1), b=build(0), c=build(.5), base=g.n;
        for(let i=0;i<a.pos.length/3;i++){ const m=a.meta[i]; g.pos.push(a.pos[i*3],a.pos[i*3+1],a.pos[i*3+2]); g.nor.push(a.nor[i*3],a.nor[i*3+1],a.nor[i*3+2]); g.uv.push(a.uv[i*2],a.uv[i*2+1]); g.col.push(a.col[i*3],a.col[i*3+1],a.col[i*3+2]);
          g.p0.push(b.pos[i*3],b.pos[i*3+1],b.pos[i*3+2]); g.p1.push(c.pos[i*3],c.pos[i*3+1],c.pos[i*3+2]); g.piv.push(o.pivot.x,o.pivot.y,o.pivot.z); g.ax.push(o.axis.x,o.axis.y,o.axis.z); g.sp.push(m.spine.x,m.spine.y,m.spine.z);
          g.gr.push(o.grow); g.sw.push(m.sway); g.ph.push(o.phase); g.ty.push(m.type!=null?m.type:(o.type||0)); }
        a.idx.forEach(k=>g.idx.push(k+base)); g.n+=a.pos.length/3; },
      geo(){ const keys=Object.keys(G).sort(), out=new THREE.BufferGeometry(), F=(arr,n)=>new THREE.Float32BufferAttribute(arr,n); const all={pos:[],nor:[],uv:[],col:[],p0:[],p1:[],piv:[],ax:[],sp:[],gr:[],sw:[],ph:[],ty:[]}, idx=[]; let off=0;
        keys.forEach((k,j)=>{ const g=G[k]; Object.keys(all).forEach(f=>{ all[f].push(...g[f]); }); out.addGroup(idx.length,g.idx.length,j); g.idx.forEach(i=>idx.push(i+off)); off+=g.n; });
        out.setAttribute('position',F(all.pos,3)); out.setAttribute('normal',F(all.nor,3)); out.setAttribute('uv',F(all.uv,2)); out.setAttribute('color',F(all.col,3));
        out.setAttribute('aP0',F(all.p0,3)); out.setAttribute('aP1',F(all.p1,3)); out.setAttribute('aPivot',F(all.piv,3)); out.setAttribute('aAxis',F(all.ax,3)); out.setAttribute('aSpine',F(all.sp,3));
        out.setAttribute('aGrow',F(all.gr,1)); out.setAttribute('aSway',F(all.sw,1)); out.setAttribute('aPhase',F(all.ph,1)); out.setAttribute('aType',F(all.ty,1)); out.setIndex(idx); out.computeBoundingSphere(); return {geo:out,groups:keys}; } }; }
  // una parte = geometria three (già trasformata) + funzioni per gli attributi
  function part(geo,m,o){ geo=geo.clone(); geo.applyMatrix4(m); if(!geo.index){ const a=[]; for(let i=0;i<geo.attributes.position.count;i++) a.push(i); geo.setIndex(a); }
    const p=geo.attributes.position, n=geo.attributes.normal, uv=geo.attributes.uv, out={pos:[],nor:[],uv:[],col:[],idx:Array.from(geo.index.array),meta:[]}, c=new Col(), v=new V3();
    for(let i=0;i<p.count;i++){ v.set(p.getX(i),p.getY(i),p.getZ(i)); out.pos.push(v.x,v.y,v.z); out.nor.push(n.getX(i),n.getY(i),n.getZ(i)); out.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0); const cc=o.color(v,i); c.set(cc); out.col.push(c.r,c.g,c.b); out.meta.push({sway:o.sway?o.sway(v,i):0,spine:o.spine?o.spine(v,i):v.clone(),type:o.type}); }
    geo.dispose(); return out; }
  function merge(parts){ const out={pos:[],nor:[],uv:[],col:[],idx:[],meta:[]}; let off=0; parts.forEach(p=>{ out.pos.push(...p.pos); out.nor.push(...p.nor); out.uv.push(...p.uv); out.col.push(...p.col); p.idx.forEach(k=>out.idx.push(k+off)); out.meta.push(...p.meta); off+=p.pos.length/3; }); return out; }
  // spina dorsale di un organo: integra l'angolo della tangente (2D: x in fuori, y in alto)
  function spine(n,L,phi0,kappa){ const pts=[],tg=[]; let x=0,y=0,phi=phi0; const ds=L/n; for(let k=0;k<=n;k++){ const u=k/n; pts.push([x,y]); tg.push(phi); phi+=kappa(u)*ds; x+=Math.cos(phi)*ds; y+=Math.sin(phi)*ds; } return {pts,tg}; }
  // nastro lungo una spina 3D: P[k], T[k] tangenti, E[k] laterali, w(u) semilarghezza, fold = alzata del bordo, cols = vertici trasversali (3)
  function ribbon(P,T,E,w,fold,uvw){ const pos=[],nor=[],uv=[],idx=[],meta=[], n=P.length-1, cols=3; const N=new V3();
    for(let k=0;k<=n;k++){ const u=k/n, hw=w(u); N.crossVectors(E[k],T[k]).normalize(); for(let j=0;j<cols;j++){ const s=j/(cols-1)*2-1, p=P[k].clone().addScaledVector(E[k],s*hw).addScaledVector(N,Math.abs(s)*fold*hw); pos.push(p.x,p.y,p.z); const nn=N.clone().addScaledVector(E[k],-s*fold*.8).normalize(); nor.push(nn.x,nn.y,nn.z); uv.push(j/(cols-1),u*(uvw||1)); meta.push({sway:u,spine:P[k].clone(),s}); } }
    for(let k=0;k<n;k++) for(let j=0;j<cols-1;j++){ const a=k*cols+j, b=a+1, c=a+cols, d=c+1; idx.push(a,c,b,b,c,d); }
    return {pos,nor,uv,idx,meta}; }
  function tube(P,r,sides){ const pos=[],nor=[],uv=[],idx=[],meta=[], n=P.length-1; let X=new V3(1,0,0);
    for(let k=0;k<=n;k++){ const u=k/n, T=(k<n?P[k+1].clone().sub(P[k]):P[k].clone().sub(P[k-1])).normalize(); if(Math.abs(T.dot(X))>.9) X=new V3(0,0,1); const e1=new V3().crossVectors(T,X).normalize(), e2=new V3().crossVectors(T,e1); X=e1;
      for(let j=0;j<=sides;j++){ const a=j/sides*6.283, nn=e1.clone().multiplyScalar(Math.cos(a)).addScaledVector(e2,Math.sin(a)), p=P[k].clone().addScaledVector(nn,r(u)); pos.push(p.x,p.y,p.z); nor.push(nn.x,nn.y,nn.z); uv.push(j/sides,u); meta.push({sway:u,spine:P[k].clone()}); } }
    for(let k=0;k<n;k++) for(let j=0;j<sides;j++){ const a=k*(sides+1)+j, b=a+1, c=a+sides+1, d=c+1; idx.push(a,c,b,b,c,d); }
    return {pos,nor,uv,idx,meta}; }
  const colorize=(part,fn)=>{ part.col=[]; const c=new Col(); for(let i=0;i<part.pos.length/3;i++){ c.set(fn(part.meta[i],i,part.pos[i*3],part.pos[i*3+1],part.pos[i*3+2])); part.col.push(c.r,c.g,c.b); } if(fn.type!=null) part.meta.forEach(m=>{ m.type=fn.type; }); return part; };
  const vary=(hex,r,k)=>new Col(hex).offsetHSL((r()-.5)*.03,(r()-.5)*.1,(r()-.5)*k);
  const to3=(pt,a,base)=>new V3(base.x+Math.cos(a)*pt[0],base.y+pt[1],base.z+Math.sin(a)*pt[0]);

  // ---------- FELCE: fronde con pastorali che si srotolano ----------
  function buildFelce(r){ const B=Builder(), NF=7, Lf=.5;
    for(let f=0;f<NF;f++){ const a=f*2.399+r()*.5, base=new V3((r()-.5)*.03,.01,(r()-.5)*.03), axis=new V3(-Math.sin(a),0,Math.cos(a)), L=Lf*(.8+r()*.35), colG=FF?new Col(0xe9eee0).offsetHSL((r()-.5)*.05,(r()-.5)*.2,(r()-.5)*.1):vary(0x4a8a44,r,.06), ph=r();
      // pose: q=1 aperta · q=.5 mezza · q=0 pastorale arrotolato
      const build=q=>{ const len=L*(.45+.55*q), phi0=1.15+.3*(1-q), n=16;
        const kap=u=>{ const open=-(1.5)/len*(.6+.4*q); const curl=q>=1?0:(q>.25?Math.max(0,u-.5)*Math.max(0,u-.5)*110/len*(1-q)*2:u*u*48/len); return open*(q)+curl+(q>0.25&&q<1?-(1.1/len)*Math.min(1,u*2):0); };
        const sp=spine(n,len,phi0,kap), P=sp.pts.map(p=>to3(p,a,base)), T=sp.tg.map(t=>new V3(Math.cos(a)*Math.cos(t),Math.sin(t),Math.sin(a)*Math.cos(t))), E=P.map(()=>axis);
        if(FF){ /* fronda fotografica: striscia (3 colonne, 16 segmenti) che segue la spina; si srotola e si piega con essa, la foto (420×1024, base in basso) fa pinne e rachide */ return colorize(ribbon(P,T,E,()=>.205*L*(.35+.65*q),.12,1),()=>colG); }
        const parts=[colorize(tube(P,u=>.011*(1-.7*u)*(.5+.5*q),4),()=>colG.clone().multiplyScalar(.75))];
        const NP=14, sweep=.55+(1-q)*.95, lat=.12+.88*q, tilt=.25;
        for(let i=0;i<NP;i++){ const u=.12+.85*i/(NP-1), k=Math.round(u*n), Pk=P[k], Tk=T[k]; const lp=.11*Math.pow(Math.sin(Math.PI*(.12+.88*u)),.7)*(.7+.3*q);
          for(const side of[-1,1]){ const Nf=new V3().crossVectors(Tk,axis).normalize(); const d=axis.clone().multiplyScalar(side*Math.cos(sweep)).addScaledVector(Tk,Math.sin(sweep)).normalize().multiplyScalar(Math.cos(tilt)).addScaledVector(Nf,-Math.sin(tilt)*(q)).normalize(), e=new V3().crossVectors(Nf,d).normalize();
            const m=3, PP=[],TT=[],EE=[]; for(let s=0;s<=m;s++){ const t=s/m; PP.push(Pk.clone().addScaledVector(d,t*lp).addScaledVector(Nf,-t*t*lp*.3*q)); TT.push(d); EE.push(e); }
            parts.push(colorize(ribbon(PP,TT,EE,t=>.026*lat*Math.pow(Math.sin(Math.PI*Math.min(1,t*.92+.04)),.6)*(1-.3*t)*(1+.09*Math.sin(t*34)),.22,1),mm=>colG.clone().offsetHSL(0,0,.04*Math.sin(mm.sway*20)-.03*Math.abs(mm.s||0)))); } }
        return merge(parts); };
      B.add(build,{pivot:base,axis,grow:f/NF,phase:ph,type:2}); }
    return B.geo(); }
  // ---------- SUCCULENTA: rosetta che si allarga, foglie che emergono dal centro ----------
  function buildSucculenta(r){ const B=Builder(), N=19, leafGeo=new THREE.SphereGeometry(1,7,6);
    { const p=leafGeo.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i), t=(y+1)/2; p.setXYZ(i,x*(.15+.85*Math.pow(Math.sin(Math.PI*Math.pow(t,.8)),.8))*.42,y,z*(.45+.55*Math.sin(Math.PI*t))*.17*(z>0?1:.6)); } leafGeo.computeVertexNormals(); }
    for(let i=0;i<N;i++){ const f=i/N, a=i*2.399+.3, rad=.012+.045*Math.pow(f,.85), base=new V3(Math.cos(a)*rad,.015+.006*(1-f),Math.sin(a)*rad), axis=new V3(-Math.sin(a),0,Math.cos(a)), colG=vary(0x7aa386,r,.06), tip=new Col(0xa8605a);
      const build=q=>{ const tiltF=.2+1.15*Math.pow(f,.9), tilt=tiltF*(.15+.85*q), len=(.075+.075*f)*(.45+.55*q), lat=.35+.65*q;
        if(FS){ /* foglia fotografica scontornata: nastro lungo la foglia carnosa (foto 475×768, base in basso), si apre dal centro */ const L2=len*1.7, sp=spine(5,L2,Math.PI/2-tilt,()=>-(.9+.8*f)/L2*(.4+.6*q)), P=sp.pts.map(pt=>to3(pt,a,base)), T=sp.tg.map(t=>new V3(Math.cos(a)*Math.cos(t),Math.sin(t),Math.sin(a)*Math.cos(t))), E=P.map(()=>axis), cg=colG.clone().lerp(new Col(0xffffff),.82);
          return colorize(ribbon(P,T,E,()=>.31*L2*(.55+.45*lat),.28,1),()=>cg); }
        const m=new M4().makeTranslation(base.x,base.y,base.z).multiply(new M4().makeRotationY(-a)).multiply(new M4().makeRotationZ(-tilt)).multiply(new M4().makeTranslation(0,len/2,0)).multiply(new M4().makeScale(lat*len,len/2,lat*len));
        return part(leafGeo,m,{color:(v,k)=>{ const t=clamp((leafGeo.attributes.position.getY(k)+1)/2); return colG.clone().lerp(tip,Math.pow(t,3)*.8).offsetHSL(0,0,.03*(1-t)); },sway:(v,k)=>clamp((leafGeo.attributes.position.getY(k)+1)/2)*.35,spine:v=>{ const d=v.clone().sub(base), up=new V3(Math.cos(a)*Math.sin(tilt),Math.cos(tilt),Math.sin(a)*Math.sin(tilt)); return base.clone().addScaledVector(up,d.dot(up)); }}); };
      B.add(build,{pivot:base,axis,grow:f*.95,phase:r(),type:2}); }
    leafGeo.dispose(); return B.geo(); }
  // ---------- CARNIVORA (Drosera): foglie a nastro con tentacoli e gocce ----------
  function buildCarnivora(r){ const B=Builder(), NL=6, dropGeo=new THREE.SphereGeometry(1,5,3);
    for(let i=0;i<NL;i++){ const f=i/NL, a=i*2.399+1.1, base=new V3(Math.cos(a)*.012,.012,Math.sin(a)*.012), axis=new V3(-Math.sin(a),0,Math.cos(a)), L=.2*(.75+.3*f+r()*.1), colG=vary(0x5f9a4e,r,.05), red=new Col(0xc0423a), ph=r();
      const build=q=>{ const len=L*(.45+.55*q), n=12, phi0=.95+.45*(1-q), kap=u=>(q>=1?-.9/len:(q>.25?-(1.2/len)*Math.min(1,u*2)+Math.max(0,u-.45)*Math.max(0,u-.45)*120/len*(1-q)*2:u*u*52/len));
        const sp=spine(n,len,phi0,kap), P=sp.pts.map(p=>to3(p,a,base)), T=sp.tg.map(t=>new V3(Math.cos(a)*Math.cos(t),Math.sin(t),Math.sin(a)*Math.cos(t))), E=P.map(()=>axis), lat=.3+.7*q;
        if(FD) return colorize(ribbon(P,T,E,()=>.162*len*1.15*(.5+.5*lat),.12,1),()=>colG.clone().lerp(new Col(0xffffff),.85)); /* foto con tentacoli e gocce */
        const leaf=colorize(ribbon(P,T,E,u=>(u<.35?.0085:.017*lat*Math.pow(Math.sin(Math.PI*Math.min(1,(u-.35)/.68)),.45)),-.35,1),mm=>mm.sway<.35?colG.clone().multiplyScalar(.9):colG.clone().lerp(red,.3*Math.abs(mm.s||0)+.1));
        const parts=[leaf];
        // tentacoli: gambo rosso + goccia (aType 3: scala con la rugiada)
        const rows=5, cols=[-.62,0,.62]; for(let k=0;k<rows;k++){ const u=.42+.54*k/(rows-1), idx=Math.round(u*n), Pk=P[idx], Nf=new V3().crossVectors(axis,T[idx]).normalize(), hw=.017*lat*Math.pow(Math.sin(Math.PI*Math.min(1,(u-.35)/.68)),.45);
          cols.forEach((s,ci)=>{ const root=Pk.clone().addScaledVector(axis,s*hw).addScaledVector(Nf,Math.abs(s)*-.35*hw), dir=Nf.clone().addScaledVector(axis,s*.9).normalize(), ln=(.011+.008*Math.abs(s))*lat, tipP=root.clone().addScaledVector(dir,ln);
            parts.push(colorize(tube([root,tipP],()=>.0012,3),()=>red.clone().offsetHSL(0,0,-.1)));
            const d=part(dropGeo,new M4().makeTranslation(tipP.x,tipP.y,tipP.z).multiply(new M4().makeScale(.0036,.0036,.0036)),{color:()=>0xffffff,sway:()=>u,spine:()=>tipP.clone(),type:3}); d.meta.forEach(m=>{ m.sway=u; }); parts.push(d); }); }
        return merge(parts); };
      B.add(build,{pivot:base,axis,grow:f*.9,phase:ph,type:2}); }
    dropGeo.dispose(); return B.geo(); }
  // ---------- FUNGO: ondate di corpi fruttiferi (spillo → bottone → cappello aperto → appassito) ----------
  function buildFungo(r){ const B=Builder(), N=9;
    for(let i=0;i<N;i++){ const a=i*2.399+r(), rad=.05+.17*Math.sqrt(r()), base=new V3(Math.cos(a)*rad,0,Math.sin(a)*rad), axis=new V3(-Math.sin(a+.7),0,Math.cos(a+.7)), sz=.8+r()*.45, lean=(r()-.5)*.25, capC=vary(0xb8825a,r,.08), gill=new Col(0x6a4a34), stemC=vary(0xe6dccb,r,.03), ph=i*.09+r()*.06;
      const build=q=>{ const h=.11*sz*(.25+.75*q), R=.058*sz*(.32+.68*q), V=.95-.52*q, n=6; const P=[]; for(let k=0;k<=n;k++){ const u=k/n; P.push(base.clone().add(new V3(Math.sin(lean)*u*h,u*h,0))); }
        const stem=tube(P,u=>.011*sz*(1.25-.35*u),7); if(FU){ /* geometria vera col fotogramma del fungo: gambo dalla zona del gambo, cappello dalla zona del cappello */ for(let k=0;k<stem.uv.length;k+=2){ const uu=stem.uv[k], vv=stem.uv[k+1]; stem.uv[k]=.5+.06*Math.cos(uu*6.283); stem.uv[k+1]=.12+.55*vv; } }
        const parts=[colorize(stem,()=>FU?new Col(0xffffff).offsetHSL(0,0,(r()-.5)*.04):stemC)];
        // cappello: emisfero schiacciato + fondo (lamelle)
        const top=P[n], rows=5, segs=12, pos=[],nor=[],uv=[],idx=[],meta=[]; const push=(p,nn,sw,tu=0,tv=0)=>{ pos.push(p.x,p.y,p.z); nor.push(nn.x,nn.y,nn.z); uv.push(tu,tv); meta.push({sway:sw,spine:top.clone()}); };
        for(let k=0;k<=rows;k++){ const al=k/rows*Math.PI/2; for(let j=0;j<=segs;j++){ const b=j/segs*6.283, x=Math.sin(al)*R*Math.cos(b), z=Math.sin(al)*R*Math.sin(b), y=Math.cos(al)*R*V; push(top.clone().add(new V3(x,y-R*V*.15,z)),new V3(x,y/V,z).normalize(),1,.5+.45*Math.sin(al)*Math.cos(b),.98-.26*al/(Math.PI/2)); } }
        for(let k=0;k<rows;k++) for(let j=0;j<segs;j++){ const A1=k*(segs+1)+j, B1=A1+1, C1=A1+segs+1, D1=C1+1; idx.push(A1,B1,C1,B1,D1,C1); }
        const nTop=pos.length/3; for(let j=0;j<=segs;j++){ const b=j/segs*6.283; push(top.clone().add(new V3(R*Math.cos(b),-R*V*.15,R*Math.sin(b))),new V3(0,-1,0),1,.5+.45*Math.cos(b),.70+.03*Math.sin(b)); } push(top.clone().add(new V3(0,-R*V*.15-R*.12*q,0)),new V3(0,-1,0),1,.5,.70);
        const c=pos.length/3-1; for(let j=0;j<segs;j++) idx.push(nTop+j,c,nTop+j+1);
        const cap={pos,nor,uv,idx,meta}; colorize(cap,(m,k,x,y,z)=>{ const under=k>=nTop; const d=Math.hypot(x-top.x,z-top.z)/R; if(FU) return new Col(0xffffff).offsetHSL(0,0,-.05*(1-d)+.03*Math.sin(k*1.7)); return under?gill.clone().offsetHSL(0,0,.05*Math.sin(k*2.3)):capC.clone().offsetHSL(0,0,-.16*(1-d)+.04*Math.sin(k*1.7)); }); parts.push(cap);
        return merge(parts); };
      B.add(build,{pivot:base,axis,grow:0,phase:ph,type:4}); }
    return B.geo(); }
  // ---------- MUSCHIO: cuscini istanziati che si allargano e si infittiscono ----------
  function buildMuschio(g,r,U){ const MB=TX?0xb7d39c:0x3e8e68, SB=TX?0x5e8a46:0x4e9060;
    const cg=new THREE.IcosahedronGeometry(1,2); { const p=cg.attributes.position; for(let k=0;k<p.count;k++){ const x=p.getX(k),y=p.getY(k),z=p.getZ(k), n=FM?1+.06*Math.sin(x*3.1+z*2.3)+.05*Math.sin(y*3.7+x*1.9)+.03*Math.sin(z*4.3-y*2.1):1+.1*Math.sin(x*9.1+z*7.3)+.08*Math.sin(y*11+x*5)+.05*Math.sin(z*13-y*6); p.setXYZ(k,x*n,y*n,z*n); } cg.computeVertexNormals(); }
    const mat=patch(new THREE.MeshStandardMaterial(FM?{color:0xffffff,roughness:1}:TX?{color:MB,map:ptex('Moss002_col',3),normalMap:ptex('Moss002_nor',3,false),normalScale:new THREE.Vector2(1.2,1.2),roughness:1}:{color:MB,roughness:1}),U,CURL_MUS,true); if(FM){ fotoBind(mat,FM); seccoBind(mat); }
    const sg=new THREE.ConeGeometry(.0055,.034,5,2); sg.translate(0,.017,0); { const p=sg.attributes.position; for(let k=0;k<p.count;k++){ const y=p.getY(k); p.setX(k,p.getX(k)+y*y*6); } sg.computeVertexNormals(); }
    const smat=patch(new THREE.MeshStandardMaterial({color:FM?0xd8e0c8:SB,roughness:1}),U,CURL_SPK,true); if(FM){ fotoBind(smat,FM); seccoBind(smat); }
    const N=26, SP=6, im=new THREE.InstancedMesh(cg,mat,N), st=new THREE.InstancedMesh(sg,smat,N*SP), m=new M4(), q=new THREE.Quaternion(), ig=new Float32Array(N), ip=new Float32Array(N), sgr=new Float32Array(N*SP), sph=new Float32Array(N*SP);
    for(let i=0;i<N;i++){ const a=r()*6.283, d=(i<3?.08:.34)*Math.sqrt(r()), x=Math.cos(a)*d, z=Math.sin(a)*d, s=.075+r()*.065; ig[i]=clamp(.08+d/.34*1.05+(r()-.5)*.12,0,1.22); ip[i]=r();
      m.compose(new V3(x,s*.18,z),q,new V3(s,s*.6,s)); im.setMatrixAt(i,m);
      for(let j=0;j<SP;j++){ const th=r()*6.283, phh=r()*1.15, dir=new V3(Math.cos(th)*Math.sin(phh),Math.cos(phh)+.6,Math.sin(th)*Math.sin(phh)).normalize(), qq=new THREE.Quaternion().setFromUnitVectors(Y,dir).multiply(new THREE.Quaternion().setFromAxisAngle(Y,r()*6.283)), sc=.7+r()*.6, k=i*SP+j;
        m.compose(new V3(x+dir.x*s,s*.18+dir.y*s*.6,z+dir.z*s),qq,new V3(sc,sc,sc)); st.setMatrixAt(k,m); sgr[k]=Math.min(1.25,ig[i]+.04+j/SP*.45); sph[k]=r(); } }
    cg.setAttribute('iGrow',new THREE.InstancedBufferAttribute(ig,1)); cg.setAttribute('iPhase',new THREE.InstancedBufferAttribute(ip,1)); sg.setAttribute('iGrow',new THREE.InstancedBufferAttribute(sgr,1)); sg.setAttribute('iPhase',new THREE.InstancedBufferAttribute(sph,1));
    im.instanceMatrix.needsUpdate=true; st.instanceMatrix.needsUpdate=true; shadowed(im,U,CURL_MUS,true); shadowed(st,U,CURL_SPK,true); st.castShadow=false; g.add(im,st); return [im,st]; }

  // ---------- creazione ----------
  const objs={};
  // ---------- mutazioni magiche: grappoli di foto vere (piani incrociati, alphaTest + depthWrite, nessun blending) con emissiveMap = la foto: il bloom li accende ----------
  const MAGICMATS=[];
  function magMat(F,mask){ const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5,side:THREE.DoubleSide,alphaTest:.5,emissive:0xffffff,emissiveIntensity:0}); m.userData.F=F;
    if(mask) m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{ vec3 e_=texture2D(emissiveMap,vEmissiveMapUv).rgb; float k_=smoothstep(.02,.18,max(e_.b-e_.g*.9,e_.r-e_.g*1.1)); totalEmissiveRadiance=emissive*e_*k_; }'); };
    m.customProgramCacheKey=()=>mask?'magL':'magF'; const dm=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,alphaTest:.5}); m.userData.dm=dm;
    if(F) F.when(()=>magApply(m)); MAGICMATS.push(m); return m; }
  function magApply(m){ const F=m.userData.F, M=F&&F.maps(fotoLvl); if(!M) return; m.map=m.emissiveMap=M.map; m.normalMap=M.normalMap||null; m.needsUpdate=true; m.userData.dm.map=M.map; m.userData.dm.needsUpdate=true; }
  function magCluster(F,w,n,spread,r,mask){ const grp=new THREE.Group(), m=magMat(F,mask); const geo=new THREE.PlaneGeometry(w,w); geo.translate(0,w/2,0);
    for(let i=0;i<n;i++){ const a=r()*6.283, d=r()*spread, sc=.7+r()*.5; for(let k=0;k<2;k++){ const q=new THREE.Mesh(geo,m); q.customDepthMaterial=m.userData.dm; q.castShadow=true; q.position.set(Math.cos(a)*d,.02,Math.sin(a)*d); q.rotation.y=a+k*Math.PI/2; q.scale.setScalar(sc); grp.add(q); } }
    grp.visible=false; grp.userData.m=m; return grp; }
  // rametto appoggiato sulla terra accanto al sasso (sempre presente): fusto curvo con corteccia + ritaglio di muschio e licheni su due piani incrociati
  let ramG=null;
  function rametto(){ if(ramG) return ramG; ramG=new THREE.Group(); const L=.9, pts=[]; for(let i=0;i<=8;i++){ const u=i/8; pts.push(new V3((u-.5)*L,.025+.035*Math.sin(u*Math.PI)+.01*Math.sin(u*9),.05*Math.sin(u*3.2))); }
    const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.03,7), bark=new THREE.MeshStandardMaterial({color:0x6b5440,roughness:.9}); const mb=FCO&&FCO.when?FCO:null; if(mb) mb.when(()=>{ const M=mb.maps(fotoLvl); if(M){ bark.map=M.map; bark.color.set(0xffffff); bark.normalMap=M.normalMap||null; bark.needsUpdate=true; } });
    const stick=new THREE.Mesh(geo,bark); stick.castShadow=true; ramG.add(stick);
    if(FRA){ const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,side:THREE.DoubleSide,alphaTest:.5}), dm=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,alphaTest:.5}); FRA.when(()=>{ const M=FRA.maps(fotoLvl); if(M){ m.map=M.map; m.needsUpdate=true; dm.map=M.map; dm.needsUpdate=true; } });
      for(let k=0;k<2;k++){ const q=new THREE.Mesh(new THREE.PlaneGeometry(L*1.05,L*1.05*512/1816),m); q.customDepthMaterial=dm; q.position.y=.07; q.rotation.x=k?Math.PI/2:0; if(k) q.position.y=.06; ramG.add(q); } }
    ramG.position.set(.42,0,-.28); ramG.rotation.y=.5; return ramG; }
  // lettiera: foglie morte sulla terra (detrito + giungla), istanze di una foglia di felce scontornata ingiallita
  let litG=null, litN=0;
  function lettiera(){ if(litG) return litG; litG=new THREE.Group(); const N=48, mat=new THREE.MeshStandardMaterial({color:0x7a5426,roughness:.9,side:THREE.DoubleSide,alphaTest:.5}); if(FF) fotoBind(mat,FF,null); else mat.alphaTest=0;
    const geo=new THREE.PlaneGeometry(.2,.2).rotateX(-Math.PI/2), im=new THREE.InstancedMesh(geo,mat,N), r=rngS(77), M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), sc=new THREE.Vector3(), ps=new V3();
    for(let i=0;i<N;i++){ let x,z,t=0; do{ const a=r()*6.283, d=Math.sqrt(r())*.82; x=Math.cos(a)*d; z=Math.sin(a)*d; t++; }while(t<20&&Math.hypot(x,z)<.2); e.set((r()-.5)*.35,r()*6.283,(r()-.5)*.35); q.setFromEuler(e); const k=.7+r()*.8; sc.set(k,1,k); ps.set(x,.015+r()*.03,z); M.compose(ps,q,sc); im.setMatrixAt(i,M); }
    im.count=0; im.receiveShadow=true; litG.add(im); litG.userData.im=im; litG.userData.N=N; return litG; }
  const id_=o=>o.id;
  function mk(id,slot,seed){ const g=new THREE.Group(), r=rngS(seed), [sx,sz]=SLOTS[slot%SLOTS.length]; g.position.set(sx,.1,sz); const U=uniforms(), meshes=[]; let emiss=null; U.uFung.value=id==='fungo'?1:0;
    if(id==='muschio') meshes.push(...buildMuschio(g,r,U));
    else { const kind=KIND[id]||KIND.felce, built=(id==='felce'?buildFelce:id==='succulenta'?buildSucculenta:id==='carnivora'?buildCarnivora:buildFungo)(r);
      const fotoF=id==='felce'?FF:id==='succulenta'?FS:id==='carnivora'?FD:id==='fungo'?FU:null, leaf=patch(new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,color:0xffffff,roughness:id==='fungo'?.75:id==='succulenta'?.5:.62,side:THREE.DoubleSide},fotoF?{alphaTest:.5,roughness:.55}:{})),U,kind,false); if(fotoF) U.uTrans.value=id==='felce'||id==='carnivora'?.6:.25;
      const mats=built.groups.map(k=>k==='0'?leaf:patch(new THREE.MeshPhysicalMaterial({vertexColors:true,color:0xffffff,roughness:.05,clearcoat:1,clearcoatRoughness:.03,transparent:true,opacity:.7,specularIntensity:1,depthWrite:false}),U,kind,false));
      const mesh=new THREE.Mesh(built.geo,mats.length===1?mats[0]:mats); shadowed(mesh,U,kind,false); if(fotoF){ mesh.customDepthMaterial.alphaTest=.5; fotoBind(leaf,fotoF,mesh.customDepthMaterial); } g.add(mesh); meshes.push(mesh); if(id==='fungo') emiss=leaf; }
    const mag=[]; if(id==='fungo'&&FXM) mag.push(magCluster(FXM,.55,3,.25,r,false)); if(id==='carnivora'&&FXC) mag.push(magCluster(FXC,.6,2,.2,r,false)); if(id==='muschio'&&FXMU) mag.push(magCluster(FXMU,.4,4,.3,r,true)); if(id==='felce'&&FXF) mag.push(magCluster(FXF,.55,3,.25,r,true)); if((id==='felce'||id==='succulenta')&&FXL) mag.push(magCluster(FXL,.45,2,.22,r,true)); if(id==='succulenta'&&FXS){ const c=magCluster(FXS,.5,1,0,r,true), mm=c.userData.m; c.clear(); const q=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5).rotateX(-Math.PI/2),mm); q.customDepthMaterial=mm.userData.dm; q.position.y=.12; c.add(q); mag.push(c); } mag.forEach(c=>g.add(c));
    const o={id,g,U,meshes,emiss,st:null,key:'', mag,
      upd(){}, // compatibilità con il vecchio ciclo di v3d: tutto passa da tick()
      dispose(){ meshes.forEach(m=>{ m.geometry.dispose(); [].concat(m.material).forEach(x=>x.dispose()); if(m.customDepthMaterial) m.customDepthMaterial.dispose(); }); } };
    // densità: copie satellite (stessa geometria e materiali, ruotate e scalate) che compaiono con la maturità della specie
    if(id!=='muschio'){ o.sat=[]; for(let k=0;k<4;k++){ let lx=.3,lz=.3; for(let t=0;t<30;t++){ const a=r()*6.283, d=.3+r()*.42, wx=Math.cos(a)*d, wz=Math.sin(a)*d; lx=wx-sx; lz=wz-sz; if(Math.hypot(wx,wz)>.28&&SLOTS.every(([ox,oz],j)=>j===slot%SLOTS.length||Math.hypot(wx-ox,wz-oz)>.16)) break; }
        const ry=r()*6.283, sc=.78+r()*.4; meshes.slice().forEach(m=>{ const c=m.clone(); c.customDepthMaterial=m.customDepthMaterial; c.position.set(lx,0,lz); c.rotation.y=ry; c.scale.setScalar(sc); c.userData.at=.7+.4*k; c.userData.rel=.3+.22*k; c.userData.gj=k>=2; c.visible=false; g.add(c); o.sat.push(c); }); } }
    objs[id]=o; return o; }

  // ---------- stato dal microclima → bersagli visivi ----------
  let forced=null, lastPull=-1, micro=null;
  function target(id,p,v,m){ const q=m&&m.piante&&m.piante[id], f=forced&&forced[id]||{};
    const vig=f.vigore!=null?f.vigore:q?q.vigore:clamp(p.v), cre=f.crescita!=null?f.crescita:q?q.crescita:1e9;
    const um=S.n?clamp(S.n.um):.6, wetS=f.superficie!=null?f.superficie:m?m.acqua.superficie:um, wetT=f.terriccio!=null?f.terriccio:m?m.acqua.terriccio:um, rh=f.rh!=null?f.rh:m?m.aria.rh:.85, rist=f.ristagno!=null?f.ristagno:m?m.acqua.ristagno:0;
    const aperto=f.aperto!=null?f.aperto:m?!!m.aperto:!!(v.clima&&v.clima.aperto);
    const grow=Math.max(GMIN[id]||0,(GROW[id]||GROW.felce)(cre));
    let tur; if(id==='muschio') tur=.3*vig+.7*clamp((wetS-.08)/.45); else if(id==='felce') tur=.45*vig+.55*clamp((wetT-.3)/.4); else if(id==='carnivora') tur=.5*vig+.5*clamp((wetT-.4)/.4); else tur=vig;
    const droop=Math.max(clamp((.55-vig)/.4),clamp((.5-tur)/.5)*.8), dry=clamp((.55-tur)/.45)*(1-clamp(rist-.3)*2);
    const rotC=id==='succulenta'?(rist>.3||rh>.8?1:0):clamp((rist-.3)/.5), rot=rotC*clamp((.85-vig)/.6);
    const dew=id==='carnivora'?clamp((rh-.6)/.3)*tur:0, gloss=clamp((vig-.65)/.25)*clamp(tur), wind=aperto?1:.12;
    // giungla (modello §9): biomassa → volume e numero di organi; ombra → giallo e afflosciamento; morsi
    const mg=m&&m.piante?m:null, bio0=f.biomassa!=null?f.biomassa:q&&q.biomassa!=null?q.biomassa:null, rel=bio0==null?.5:clamp(bio0/(BREF[id]||.4)), ombra=f.ombra!=null?f.ombra:q&&q.ombra!=null?q.ombra:0;
    const gg=forced&&forced.giungla!=null?forced.giungla:mg&&mg.giungla!=null?mg.giungla:0, sof=forced&&forced.soffocato!=null?forced.soffocato:mg?!!mg.soffocato:false;
    const bite=f.bite!=null?f.bite:mg&&mg.mangiatoUltimo>0?clamp(mg.mangiatoUltimo*40+.25):0;
    const growV=Math.min(1.35,grow*(.6+.55*rel)*(1+.12*gg)), volY=(.62+.62*rel+.6*gg)*(BALT[id]||1), volX=.72+.4*rel+.12*gg;
    const sh=clamp(ombra*1.2), dryO=id==='muschio'&&(sof||ombra>.55)?clamp((ombra-.25)/.4):sh*1.1;
    return {grow:growV,vig,tur:tur*(1-.35*sh),droop:Math.max(droop,sh*.6),dry:Math.max(dry,dryO),rot,dew,gloss:gloss*(1-sh),wind,mut:clamp((v.R-.12)/.6),E:clamp((v.E||0)/100),volY,volX,rel,gg,bite,ombra}; }
  const ease=(a,b,k)=>a+(b-a)*Math.min(1,k);
  function tick(dt,t,v,plantObjs){
    if(t-lastPull>.5){ lastPull=t; try{ micro=A.micro?A.micro():null; }catch(e){ micro=null; } }
    Object.keys(objs).forEach(id=>{ if(!plantObjs[id]||plantObjs[id]!==objs[id]){ objs[id].dispose(); delete objs[id]; } });
    if(litG){ const gg=forced&&forced.giungla!=null?forced.giungla:micro&&micro.giungla||0, de=forced&&forced.detrito!=null?forced.detrito:micro&&micro.detrito||0, want=Math.round(litG.userData.N*clamp(de*1.3+gg*.7)); litN=ease(litN,want,dt*3); litG.userData.im.count=Math.round(litN); }
    v.plants.forEach(p=>{ const o=objs[p.id]; if(!o) return; o.g.position.y=S.soilTop; const T=target(p.id,p,v,micro); let s=o.st;
      if(!s){ s=o.st=Object.assign({},T); }
      else { s.grow=ease(s.grow,T.grow,dt*.6); s.vig=ease(s.vig,T.vig,dt*.5); s.tur=ease(s.tur,T.tur,T.tur>s.tur?dt*.45:dt*.07); s.droop=ease(s.droop,T.droop,T.droop<s.droop?dt*.4:dt*.08); s.dry=ease(s.dry,T.dry,T.dry<s.dry?dt*.35:dt*.06); s.rot=ease(s.rot,T.rot,dt*.08); s.dew=ease(s.dew,T.dew,dt*.3); s.gloss=ease(s.gloss,T.gloss,dt*.4); s.wind=ease(s.wind,T.wind,dt*.5); s.mut=ease(s.mut,T.mut,dt*.5); s.E=ease(s.E,T.E,dt*.8); s.volY=ease(s.volY,T.volY,T.volY<s.volY-.03?dt*9:dt*.5); s.volX=ease(s.volX,T.volX,T.volX<s.volX-.03?dt*9:dt*.5); s.rel=T.rel; s.gg=ease(s.gg,T.gg,dt*.5); s.ombra=T.ombra; s.bite=ease(s.bite||0,T.bite,T.bite>(s.bite||0)?dt*3:dt*.05); }
      const U=o.U; U.uGrow.value=s.grow; U.uTurgor.value=s.tur; U.uDroop.value=s.droop; U.uDry.value=s.dry; U.uRot.value=s.rot; U.uDew.value=s.dew; U.uGloss.value=s.gloss; U.uWind.value=s.wind; U.uTime.value=t; U.uMut.value=s.mut; U.uCharge.value=s.E; U.uBite.value=(o.id==='muschio'||o.id==='fungo')?0:s.bite||0; o.g.scale.set(s.volX,s.volY,s.volX);
      if(o.mag) o.mag.forEach(c=>{ const need=(id_(o)==='muschio'?.4:id_(o)==='succulenta'?.35:id_(o)==='fungo'?.15:id_(o)==='carnivora'?.25:.45)-.22*(s.gg||0), k=clamp((s.mut-need)/.25)*clamp(s.grow*1.2); c.visible=k>.02&&s.vig>.15; if(c.visible){ c.scale.setScalar(.35+.65*k); c.userData.m.emissiveIntensity=(1.4+1.8*s.E)*(1+.15*Math.sin(t*2.1+o.g.position.x*9)); } });
      if(o.sat){ o.sat.forEach(q=>{ q.visible=(s.rel>=q.userData.rel||(q.userData.gj&&s.gg>.35))&&s.grow>=.5&&s.vig>.12; }); } }); }
  // QA e test: forza gli stati (force(null) toglie), settle() salta le transizioni
  function force(st){ forced=st; lastPull=-1; }
  function settle(){ Object.values(objs).forEach(o=>{ o.st=null; }); }
  function state(){ const r={}; Object.values(objs).forEach(o=>{ r[o.id]=o.st&&Object.assign({},o.st); }); return r; }
  // Adattatore per i modelli veri di Kimi (brief v3 §5.3): stessi stati, attributi _GROW/_SWAY e morph target.
  // Dato un mesh glTF con attributi _GROW/_SWAY e morph «uncurl»/«trap_close», ADATTA(mesh) restituisce {U, apply(st)}:
  // il materiale riceve la stessa patch (gli attributi glTF vengono rinominati aGrow/aSway e, mancando aP0/aP1/aPivot, si usano morph e posizione).
  function ADATTA(mesh,kind){ const U=uniforms(); const g=mesh.geometry; if(g.attributes._GROW&&!g.attributes.aGrow) g.setAttribute('aGrow',g.attributes._GROW); if(g.attributes._SWAY&&!g.attributes.aSway) g.setAttribute('aSway',g.attributes._SWAY);
    const n=g.attributes.position.count, z=new Float32Array(n*3); ['aP0','aP1','aSpine'].forEach(k=>{ if(!g.attributes[k]) g.setAttribute(k,g.attributes.position); }); if(!g.attributes.aPivot) g.setAttribute('aPivot',new THREE.BufferAttribute(z,3)); if(!g.attributes.aAxis){ const ax=new Float32Array(n*3); for(let i=0;i<n;i++) ax[i*3]=1; g.setAttribute('aAxis',new THREE.BufferAttribute(ax,3)); } if(!g.attributes.aPhase) g.setAttribute('aPhase',new THREE.BufferAttribute(new Float32Array(n),1)); if(!g.attributes.aType) g.setAttribute('aType',new THREE.BufferAttribute(new Float32Array(n),1));
    [].concat(mesh.material).forEach(m=>patch(m,U,kind||1,false)); shadowed(mesh,U,kind||1,false);
    return {U,apply(s){ U.uGrow.value=s.grow; U.uTurgor.value=s.tur; U.uDroop.value=s.droop; U.uDry.value=s.dry; U.uRot.value=s.rot; U.uDew.value=s.dew; U.uGloss.value=s.gloss; U.uWind.value=s.wind; const mi=mesh.morphTargetDictionary; if(mi&&mesh.morphTargetInfluences){ if('uncurl' in mi) mesh.morphTargetInfluences[mi.uncurl]=clamp(s.grow); if('trap_close' in mi) mesh.morphTargetInfluences[mi.trap_close]=s.trap||0; } }}; }
  const gj=()=>forced&&forced.giungla!=null?forced.giungla:micro&&micro.giungla||0;
  return {gj,lettiera,mk,tick,force,settle,state,target,GROW,ADATTA,objs,level,rametto};
};
