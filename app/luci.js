// Luci di Terrario: tutte le luci, tone mapping, esposizione, ombre, ambiente e post-effetti vivono qui (contratto «Luci» in docs/CONTRATTI.md).
// window.__LUCI(THREE,{scene,renderer,camera}) -> {set(tempo), update(dt), level(n), dispose()}
//   tempo: 'giorno' | 'sera' | 'notte' · level: 0 pieno · 1 ridotto · 2 minimo (guardia prestazioni)
// Luci guidate dal gioco (le pilota v3d.js a ogni fotogramma):
//   meteora(y,k)   luce viola del sasso all'altezza y, intensità di base k
//   fuoco(k,x,y,z) bagliore del fuoco di un insediamento (k=0 spento)
// Direzione: macrofotografia di un barattolo vero su una scrivania vera.
//   giorno: finestra morbida (luce chiave con ombra soffice + riflesso della finestra nel vetro), rimbalzo caldo del legno
//   sera:   sole basso e caldo, ombre lunghe
//   notte:  lampada da scrivania calda, buio intorno, il sasso viola unica luce fredda
// Profondità di campo da macro (livello 0): la scena passa in un render target e un passaggio a schermo intero
// sfoca in base alla distanza dal piano di fuoco (asse del vaso). Si attiva avvolgendo renderer.render solo per la
// scena principale, così v3d.js non cambia; dispose() ripristina tutto.
// Ambiente: stanza procedurale (foto di fondo + finestra o lampada in HDR, PMREM). Slot per una HDRI vera: window.__TEX.hdri_stanza.
// Post (solo livello 0, stesso passaggio della profondità di campo): vignettatura leggera, grana fine, aberrazione cromatica ai bordi,
// sfocatura di movimento della camera proporzionale alla velocità (sparisce a camera ferma; solo camera, non le singole creature).
// Costi per livello: 0 = ombre 1024 morbide + profondità di campo + post · 1 = ombre 512, niente profondità di campo · 2 = niente ombre né luci secondarie.
(function(){
'use strict';
window.__LUCI=function(THREE,o){
  const scene=o.scene, renderer=o.renderer;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), V3=THREE.Vector3;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.AgXToneMapping;

  // ---------- regìe per ora del giorno ----------
  // key: luce chiave (finestra o sole basso) · bounce: rimbalzo caldo dal legno · fill: cielo/stanza · lamp: lampada (notte)
  const LOOK={
    giorno:{exp:1.2,  env:.8,  key:[0xeef2ff,3.1,[2.8,4.6,3.0]], fill:[0xe2e9f2,.3], hemi:[0xe8eef5,0x8a6a4a,.3], bounce:[0xffcf9a,.45], lamp:0, met:1, fire:1, sh:.82},
    sera:  {exp:1.15, env:.45, key:[0xffb06a,2.4,[4.6,1.9,1.6]], fill:[0xc9cfdc,.16], hemi:[0xd8c8b8,0x6a4a30,.2], bounce:[0xffb070,.45], lamp:.55, met:1.2, fire:1.3, sh:.88},
    notte: {exp:1.15, env:.10, key:null, fill:[0xd8d2c8,.03], hemi:[0x2a2622,0x1a120c,.12], bounce:[0xff9a50,.18], lamp:1, met:2.2, fire:1.8, sh:.92}
  };

  // ---------- ambiente: foto della stanza + finestra (o lampada) in HDR, filtrata PMREM ----------
  const pm=new THREE.PMREMGenerator(renderer); const envCache={}; let photo=null, curT='giorno';
  const srgb2lin=c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
  function envFor(t){
    if(envCache[t]) return envCache[t];
    const W=256,H=128, D=new Float32Array(W*H*4), L=LOOK[t];
    const win=t==='notte'?null:new V3(...(t==='sera'?[1,.32,.55]:[1,.62,.92])).normalize();
    const lamp=new V3(-.55,.62,.55).normalize(), ph=PANO[t==='notte'?'notte':'giorno']||photo;
    const tint=t==='sera'?[1.08,.86,.68]:t==='notte'?[.5,.42,.36]:[.92,.97,1.06], pk=t==='notte'?.03:t==='sera'?.4:.55;
    for(let y=0;y<H;y++){ const v=(y+.5)/H, el=(v-.5)*Math.PI, cy=Math.sin(el), ce=Math.cos(el);
      for(let x=0;x<W;x++){ const u=(x+.5)/W, az=(u-.5)*2*Math.PI, dx=Math.cos(az)*ce, dz=Math.sin(az)*ce; let r,g,b;
        if(ph){ const px=Math.min(ph.w-1,(u*ph.w)|0), py=Math.min(ph.h-1,((1-v)*ph.h)|0), k=(py*ph.w+px)*4; r=ph.d[k]; g=ph.d[k+1]; b=ph.d[k+2]; }
        else { const s=clamp(cy*.5+.5); r=.25+.35*s; g=.22+.33*s; b=.2+.3*s; }
        r*=pk*tint[0]; g*=pk*tint[1]; b*=pk*tint[2];
        if(cy<-.04){ const k=clamp((-cy-.04)*4); const wd=t==='notte'?.025:t==='sera'?.16:.24; r=r*(1-k*.6)+.62*wd*k; g=g*(1-k*.6)+.42*wd*k; b=b*(1-k*.6)+.26*wd*k; } // scrivania di legno
        if(win){ const lx=dx*win.x+dz*win.z, ang=Math.atan2(dz*win.x-dx*win.z,lx), de=el-Math.asin(win.y);
          const m=(1-clamp((Math.abs(ang)-.17)/.08))*(1-clamp((Math.abs(de)-.34)/.1))*(lx>0?1:0);
          if(m>0){ const bar=(Math.abs(ang)<.018||Math.abs(de)<.018)?.15:1, I=(t==='sera'?2.6:3.2)*m*bar, c=t==='sera'?[1,.66,.4]:[.9,.95,1]; r+=I*c[0]; g+=I*c[1]; b+=I*c[2]; } }
        if(t!=='giorno'){ const k=dx*lamp.x+cy*lamp.y+dz*lamp.z; if(k>.9){ const I=Math.pow((k-.9)/.1,3)*(t==='notte'?14:6); r+=I; g+=I*.72; b+=I*.44; } }
        { const sb=clamp(1-Math.abs(cy-.78)/.16)*clamp(1-Math.abs(Math.sin(az-.5))/.45)*(Math.cos(az-.5)>0?1:0), ring=clamp(1-Math.abs(cy-.2)/.07)*clamp(1-Math.abs(Math.sin(az+1.2))/.3)*(Math.cos(az+1.2)>0?1:0); // softbox sopra il vaso e striscia luminosa bassa: il metallo del coperchio riflette luce vera
          const I=(t==='notte'?3.2:t==='sera'?4.2:5.5)*sb+(t==='notte'?2:3)*ring, wc=t==='giorno'?[1,.92,.8]:[1,.78,.5]; r+=I*wc[0]; g+=I*wc[1]; b+=I*wc[2]; }
        const i=(y*W+x)*4; D[i]=r; D[i+1]=g; D[i+2]=b; D[i+3]=1; } }
    const tx=new THREE.DataTexture(D,W,H,THREE.RGBAFormat,THREE.FloatType); tx.mapping=THREE.EquirectangularReflectionMapping; tx.colorSpace=THREE.LinearSRGBColorSpace; tx.magFilter=tx.minFilter=THREE.LinearFilter; tx.needsUpdate=true;
    const rt=pm.fromEquirectangular(tx); tx.dispose(); envCache[t]=rt; return rt;
  }
  const HDRI=window.__TEX&&(window.__TEX.hdri_stanza||window.__TEX.bg_day);
  if(HDRI){ const im=new Image(); im.onload=()=>{ try{ const w=192,h=96, c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.drawImage(im,0,0,w,h); const d=g.getImageData(0,0,w,h).data, f=new Float32Array(w*h*4); for(let i=0;i<d.length;i++) f[i]=srgb2lin(d[i]/255); photo={w,h,d:f}; Object.keys(envCache).forEach(k=>{ envCache[k].dispose(); delete envCache[k]; }); applyEnv(); }catch(e){} }; im.src=HDRI; }
  // panorami veri della stanza (giorno/notte) dai materiali fotografici: letti a bassa risoluzione e filtrati PMREM, niente texture grandi in GPU
  const PANO={}; (function(){ const MF=window.__MAT_FOTO; if(!MF) return; [['giorno','stanza_giorno'],['notte','stanza_notte']].forEach(([k,id])=>{ const u=MF[id]&&MF[id].panorama; if(!u) return; const im=new Image(); im.onload=()=>{ try{ const w=192,h=96, c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d',{willReadFrequently:true}); g.drawImage(im,0,0,w,h); const d=g.getImageData(0,0,w,h).data, f=new Float32Array(w*h*4); for(let i=0;i<d.length;i++) f[i]=srgb2lin(d[i]/255); PANO[k]={w,h,d:f}; Object.keys(envCache).forEach(q=>{ envCache[q].dispose(); delete envCache[q]; }); applyEnv(); }catch(e){} }; im.src=u; }); })();
  function applyEnv(){ scene.environment=envFor(curT).texture; }

  // ---------- luci ----------
  const hemi=new THREE.HemisphereLight(0xffffff,0x000000,.3); scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffffff,3); key.castShadow=true; key.shadow.mapSize.set(1024,1024); Object.assign(key.shadow.camera,{left:-2.4,right:2.4,top:3,bottom:-1.4,near:.5,far:18}); key.shadow.bias=-.0006; key.shadow.normalBias=.02; key.shadow.radius=4; scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,.3); fill.position.set(-3,2.2,2); scene.add(fill);
  const bounce=new THREE.DirectionalLight(0xffcf9a,.4); bounce.position.set(.6,-3,1.2); scene.add(bounce); // dal piano del tavolo verso l'alto
  const lamp=new THREE.SpotLight(0xffb469,0,0,.62,.85,1.6); lamp.position.set(-2.6,3.6,2.4); lamp.target.position.set(0,.55,0); lamp.castShadow=true; lamp.shadow.mapSize.set(1024,1024); lamp.shadow.bias=-.0008; lamp.shadow.normalBias=.02; lamp.shadow.radius=4; lamp.shadow.camera.near=1; lamp.shadow.camera.far=12; scene.add(lamp,lamp.target);
  const metLight=new THREE.PointLight(0xa88bff,0,2.6,2); scene.add(metLight);
  const fireLight=new THREE.PointLight(0xffa457,0,2.2,2); scene.add(fireLight);

  // ---------- ombre di contatto (sempre accese: costano un quad ciascuna) ----------
  function blob(stops,size,y){ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const rg=g.createRadialGradient(64,64,0,64,64,64); stops.forEach(([p,a])=>rg.addColorStop(p,'rgba(0,0,0,'+a+')')); g.fillStyle=rg; g.fillRect(0,0,128,128); const t=new THREE.CanvasTexture(c);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false})); m.rotation.x=-Math.PI/2; m.position.y=y; m.renderOrder=-1; scene.add(m); return m; }
  const shWide=blob([[0,.42],[.55,.3],[1,0]],3.2,.004);           // penombra larga del vaso
  const shTight=blob([[0,.55],[.78,.5],[.9,.32],[1,0]],2.25,.005); // contatto stretto sotto il fondo

  // ---------- profondità di campo (passaggio unico, spegnibile) ----------
  const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); // Safari iOS: niente MSAA sul bersaglio con profondità (terra nera allo zoom)
  const size=new THREE.Vector2(); let rt=null;
  const quadCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1), quadScene=new THREE.Scene();
  const U={tCol:{value:null},tDep:{value:null},uRes:{value:new THREE.Vector2(1,1)},uNear:{value:.1},uFar:{value:60},uFocus:{value:5},uAp:{value:1.6},uMax:{value:8},uTime:{value:0},uVig:{value:.32},uGrain:{value:.018},uCA:{value:1.2},uInvVP:{value:new THREE.Matrix4()},uPrevVP:{value:new THREE.Matrix4()},uMB:{value:0},tB0:{value:null},tB1:{value:null},uBloom:{value:0}};
  const dofMat=new THREE.ShaderMaterial({uniforms:U,depthTest:false,depthWrite:false,blending:THREE.NoBlending,
    vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader:[
    'uniform sampler2D tCol; uniform sampler2D tDep; uniform vec2 uRes; uniform float uNear,uFar,uFocus,uAp,uMax,uTime,uVig,uGrain,uCA,uMB; uniform mat4 uInvVP,uPrevVP; uniform sampler2D tB0,tB1; uniform float uBloom; varying vec2 vUv;',
    'float lz(vec2 p){ float d=texture2D(tDep,p).x; return uNear*uFar/(uFar-d*(uFar-uNear)); }',
    'float F;',
    'float coc(float z){ return clamp(uAp*(abs(z-F)/max(z,1e-3)-.07),0.,1.); }',
    'void main(){',
    ' float zc=lz(vec2(.5)); F=(zc>uFocus*.55&&zc<uFocus*1.15)?zc:uFocus;',   // autofocus sul centro se cade sul soggetto, altrimenti asse del vaso
    ' float z0=lz(vUv), c0=coc(z0); vec2 dc=vUv-.5; vec2 ca=dc*dot(dc,dc)*uCA*8./uRes; vec4 acc=texture2D(tCol,vUv); acc.r=texture2D(tCol,vUv+ca).r; acc.b=texture2D(tCol,vUv-ca).b; float wsum=1.;',
    ' if(c0*uMax>.6){',
    '  float ph=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))*6.2831853; vec2 px=1./uRes;',
    '  for(int i=0;i<16;i++){ float r=sqrt((float(i)+.5)/16.), a=float(i)*2.3999632+ph; vec2 off=vec2(cos(a),sin(a))*r*c0*uMax*px;',
    '   float z=lz(vUv+off), c=coc(z); float w=z>=z0-.05?1.:clamp(c/max(c0,1e-3),0.,1.);',
    '   acc+=texture2D(tCol,vUv+off)*w; wsum+=w; }',
    ' }',
    ' gl_FragColor=acc/wsum; if(any(isnan(gl_FragColor))||any(isinf(gl_FragColor))) gl_FragColor=texture2D(tCol,vUv);',  // le GPU Apple disegnano NaN come nero
    ' if(uMB>0.){',   // sfocatura di movimento della camera: riproietta il punto con la camera del fotogramma prima
    '  vec4 wp=uInvVP*vec4(vUv*2.-1.,texture2D(tDep,vUv).x*2.-1.,1.); wp/=wp.w; vec4 pp=uPrevVP*wp; vec2 vel=(vUv-(pp.xy/pp.w*.5+.5))*uMB;',
    '  float lp=length(vel*uRes); if(lp>1.5&&lp<uRes.y*.25){ vel*=min(1.,uRes.y*.035/lp); vec4 mb=vec4(0.);',
    '   for(int i=0;i<8;i++){ mb+=texture2D(tCol,vUv+vel*(float(i)/7.-.5)); }',
    '   gl_FragColor=mix(gl_FragColor,mb/8.,clamp((lp-1.5)/3.,0.,1.)); }',
    ' }',
    ' if(uBloom>0.){ vec3 bl=(texture2D(tB0,vUv).rgb*.7+texture2D(tB1,vUv).rgb*1.1)*uBloom; gl_FragColor.rgb+=bl; gl_FragColor.a=min(1.,gl_FragColor.a+max(bl.r,max(bl.g,bl.b))); }',
    ' if(any(isnan(gl_FragColor))) gl_FragColor=vec4(0.,0.,0.,0.);',
    ' #include <tonemapping_fragment>',
    ' #include <colorspace_fragment>',
    ' float v=1.-uVig*smoothstep(.25,.95,length(dc*vec2(uRes.x/uRes.y,1.))*1.25);',            // vignettatura (scurisce anche la foto di fondo, alfa premoltiplicato)
    ' float g=fract(sin(dot(gl_FragCoord.xy+uTime*61.,vec2(12.9898,78.233)))*43758.5453)-.5;',   // grana fine da sensore
    ' gl_FragColor.rgb=gl_FragColor.rgb*v+g*uGrain*gl_FragColor.a; gl_FragColor.a=1.-v*(1.-gl_FragColor.a);',
    '}'].join('\n')});
  // ---------- bloom selettivo: estrae solo ciò che supera la soglia HDR (emissivo viola, riflessi forti), sfoca a 1/4 e 1/16 della risoluzione ----------
  const BU={tSrc:{value:null},uDir:{value:new THREE.Vector2()},uThr:{value:1}};
  const bloomMat=new THREE.ShaderMaterial({uniforms:BU,depthTest:false,depthWrite:false,blending:THREE.NoBlending,
    vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader:['uniform sampler2D tSrc; uniform vec2 uDir; uniform float uThr; varying vec2 vUv;',
    'void main(){ vec3 c;',
    ' #ifdef EXTRACT',
    ' c=vec3(0.); for(int i=0;i<4;i++){ vec2 o=(vec2(float(i&1),float(i/2))-.5)*uDir; vec3 s=texture2D(tSrc,vUv+o).rgb; float l=dot(s,vec3(.3,.59,.11)); float vi=clamp((s.b-s.g)*2.5/(l+.2),0.,1.); float k=smoothstep(uThr,uThr+.8,l*(1.+1.4*vi)); c+=min(s,vec3(8.))*k; } c*=.25;',
    ' #else',
    ' c=texture2D(tSrc,vUv).rgb*.227; for(int i=1;i<5;i++){ float fi=float(i); float w=i==1?.19:i==2?.12:i==3?.06:.025; c+=(texture2D(tSrc,vUv+uDir*fi).rgb+texture2D(tSrc,vUv-uDir*fi).rgb)*w; }',
    ' #endif',
    ' gl_FragColor=vec4(c,1.); }'].join('\n')});
  const bloomExt=bloomMat.clone(); bloomExt.defines={EXTRACT:''}; bloomExt.uniforms=BU;
  let bA0=null,bB0=null,bA1=null,bB1=null, bDiv=4, bloomK=1.15;
  function mkB(w,h){ return new THREE.WebGLRenderTarget(Math.max(2,w|0),Math.max(2,h|0),{type:THREE.HalfFloatType,depthBuffer:false}); }
  function ensureBloom(){ const w=Math.ceil(size.x/bDiv), h=Math.ceil(size.y/bDiv); if(bA0&&bA0.width===w&&bA0.height===h) return; [bA0,bB0,bA1,bB1].forEach(x=>x&&x.dispose()); bA0=mkB(w,h); bB0=mkB(w,h); bA1=mkB(w/4,h/4); bB1=mkB(w/4,h/4); }
  function bpass(m,src,dst,dx,dy){ quad.material=m; BU.tSrc.value=src.texture||src; BU.uDir.value.set(dx,dy); R0.call(renderer,quadScene,quadCam); }
  function bloomRun(srcTex){ ensureBloom(); renderer.setRenderTarget(bA0); BU.uThr.value=1.25; bpass(bloomExt,srcTex,null,bDiv/size.x,bDiv/size.y);
    renderer.setRenderTarget(bB0); bpass(bloomMat,bA0,null,1.5/bA0.width,0); renderer.setRenderTarget(bA0); bpass(bloomMat,bB0,null,0,1.5/bA0.height);
    renderer.setRenderTarget(bA1); bpass(bloomMat,bA0,null,1.2/bA1.width,0); renderer.setRenderTarget(bB1); bpass(bloomMat,bA1,null,2.2/bB1.width,0); renderer.setRenderTarget(bA1); bpass(bloomMat,bB1,null,0,2.2/bA1.height);
    quad.material=dofMat; U.tB0.value=bA0.texture; U.tB1.value=bA1.texture; U.uBloom.value=bloomK; }
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),dofMat); quad.frustumCulled=false; quadScene.add(quad);
  function ensureRT(){ renderer.getDrawingBufferSize(size); if(rt&&rt.width===size.x&&rt.height===size.y) return;
    if(rt) rt.dispose(); const dt=new THREE.DepthTexture(size.x,size.y); dt.type=THREE.UnsignedIntType;
    rt=new THREE.WebGLRenderTarget(size.x,size.y,{type:THREE.HalfFloatType,samples:IOS?0:(lv===0?4:2),depthTexture:dt}); U.uRes.value.set(size.x,size.y); }
  // Gli ShaderMaterial senza colorspace_fragment (vetro, condensa) scrivono colori già «da schermo»: nel render target
  // lineare li riportiamo in lineare, alfa compreso (define LUCI_LIN): la fusione in lineare renderebbe il vetro lattiginoso.
  const linMats=new Set();
  function linScan(on){ scene.traverse(x=>{ const ms=x.material?(Array.isArray(x.material)?x.material:[x.material]):[]; ms.forEach(m=>{
      if(!m.isShaderMaterial||m.isRawShaderMaterial||m===dofMat||/colorspace_fragment/.test(m.fragmentShader)) return;
      if(!linMats.has(m)){ linMats.add(m); const prev=m.onBeforeCompile; m.onBeforeCompile=function(sh,r){ if(prev) prev.call(this,sh,r); const i=sh.fragmentShader.lastIndexOf('}'); sh.fragmentShader=sh.fragmentShader.slice(0,i)+'\n#ifdef LUCI_LIN\n gl_FragColor=pow(max(gl_FragColor,vec4(0.)),vec4(2.2));\n#endif\n'+sh.fragmentShader.slice(i); }; }
      const has=!!(m.defines&&m.defines.LUCI_LIN); if(has!==on){ m.defines=m.defines||{}; if(on) m.defines.LUCI_LIN=''; else delete m.defines.LUCI_LIN; m.needsUpdate=true; } }); }); }
  const R0=renderer.render; let inPost=false, scanN=0, dofOn=true, bloomOn=true, curCam=o.camera;
  const _f=new V3(), _p=new V3();
  const _vp=new THREE.Matrix4(), _pv=new THREE.Matrix4(); let mbOk=false;
  function motion(cam){ // velocità della camera: confronta con il fotogramma precedente (otturatore a 180°)
    _vp.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse); const moved=mbOk&&!_vp.equals(_pv);
    U.uPrevVP.value.copy(_pv); U.uInvVP.value.copy(_vp).invert(); U.uMB.value=moved?.5:0; _pv.copy(_vp); mbOk=true; }
  function focusOn(cam){ // piano di fuoco: punto dell'asse del vaso più vicino al raggio centrale della camera
    cam.getWorldDirection(_f); const c=cam.position; const a=_f.x*_f.x+_f.z*_f.z; let t=a>1e-4?-(c.x*_f.x+c.z*_f.z)/a:5; t=Math.max(.5,t);
    _p.copy(c).addScaledVector(_f,t); _p.set(0,clamp(_p.y,.15,1.7),0); const fz=_p.sub(c).dot(_f); U.uFocus.value+=(fz-U.uFocus.value)*(U._init?.35:1); U._init=1; }
  renderer.render=function(s,cam){
    if(inPost||!dofOn||s!==scene||renderer.getRenderTarget()!==null||renderer.xr&&renderer.xr.isPresenting) return R0.call(renderer,s,cam);
    inPost=true; try{ ensureRT(); if(!(scanN++%90)) linScan(true); focusOn(cam); cam.updateMatrixWorld(); if(lv===0) motion(cam); else{ U.uMB.value=0; } U.uNear.value=cam.near; U.uFar.value=cam.far; U.uMax.value=Math.max(3,size.y*.011);
      renderer.setRenderTarget(rt); R0.call(renderer,s,cam); renderer.setRenderTarget(null);
      U.uBloom.value=0; if(bloomOn){ bloomRun(rt.texture); renderer.setRenderTarget(null); }
      U.tCol.value=rt.texture; U.tDep.value=rt.depthTexture; R0.call(renderer,quadScene,quadCam); }
    finally{ inPost=false; } };

  // ---------- stato ----------
  let lv=0, night=false, L=LOOK.giorno;
  function set(tempo){ curT=LOOK[tempo]?tempo:'giorno'; L=LOOK[curT]; night=curT==='notte';
    renderer.toneMappingExposure=L.exp; scene.environmentIntensity=L.env; applyEnv();
    hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity=L.hemi[2];
    if(L.key){ key.visible=true; key.color.set(L.key[0]); key.intensity=L.key[1]; key.position.set(...L.key[2]); } else key.visible=false;
    fill.color.set(L.fill[0]); fill.intensity=L.fill[1]; bounce.color.set(L.bounce[0]); bounce.intensity=L.bounce[1];
    bloomK=curT==='notte'?1.3:curT==='sera'?1.0:.8; lamp.visible=!!L.lamp; lamp.castShadow=night; lamp.intensity=26*L.lamp; key.shadow.intensity=L.sh; lamp.shadow.intensity=L.sh;
    shWide.material.opacity=night?.7:1; shTight.material.opacity=1;
    applyLevel(); }
  function applyLevel(){ const sm=lv===0?1024:512; [key,lamp].forEach(l=>{ if(l.shadow.mapSize.x!==sm){ l.shadow.mapSize.set(sm,sm); if(l.shadow.map){ l.shadow.map.dispose(); l.shadow.map=null; } } l.shadow.radius=lv===0?4:2; });
    const shOn=lv<2; if(renderer.shadowMap.enabled!==shOn){ renderer.shadowMap.enabled=shOn; scene.traverse(x=>{ if(x.material){ (Array.isArray(x.material)?x.material:[x.material]).forEach(m=>m.needsUpdate=true); } }); }
    fill.visible=lv<2; bounce.visible=lv<2;
    dofOn=lv<2; bloomOn=lv<2; bDiv=lv===0?4:8; U.uAp.value=lv===0?1.6:0; U.uCA.value=lv===0?1.2:0; mbOk=false; if(rt){ rt.dispose(); rt=null; } [bA0,bB0,bA1,bB1].forEach(x=>x&&x.dispose()); bA0=bB0=bA1=bB1=null; if(!dofOn){ linScan(false); } else scanN=0; }
  function level(n){ n=clamp(n|0,0,2); if(n===lv) return; lv=n; applyLevel(); }
  let tt=0; function update(dt){ tt+=dt||0; if(L.lamp){ lamp.intensity=26*L.lamp*(1+.012*Math.sin(tt*2.1)); } U.uTime.value=tt%100; }
  function meteora(y,k){ metLight.position.set(0,y,0); metLight.intensity=k*L.met; }
  function fuoco(k,x,y,z){ if(k>0&&x!==undefined) fireLight.position.set(x,y,z); fireLight.intensity=k*L.fire; }
  function dispose(){ renderer.render=R0; [hemi,key,fill,bounce,lamp,lamp.target,metLight,fireLight,shWide,shTight].forEach(x=>scene.remove(x)); [bA0,bB0,bA1,bB1].forEach(x=>x&&x.dispose()); bloomMat.dispose(); bloomExt.dispose(); [shWide,shTight,quad].forEach(m=>{ m.geometry.dispose(); if(m.material.map) m.material.map.dispose(); m.material.dispose(); });
    if(rt) rt.dispose(); Object.values(envCache).forEach(r=>r.dispose()); pm.dispose(); if(window.__luci===api) window.__luci=null; }
  const api={set,update,level,dispose,meteora,fuoco,get stato(){ return {tempo:curT,livello:lv,dof:lv===0,bloom:bloomOn&&U.uBloom.value>0}; }};
  set('giorno'); window.__luci=api; return api;
};
})();
