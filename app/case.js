/* Case delle specie — app/case.js (agente tre-d)
   Ogni specie abita come in natura (DECISIONI «Case delle specie»), costruita in codice con i materiali fotografici
   (assets/materiali via FOTO.mat): formicaio a cupola di terra smossa, termitaio a torre di argilla, rifugio di gusci
   vuoti sotto una foglia secca, frutto che matura con le pupe, rifugio di seta del ragno, ceppo scavato dai coleotteri.
   Quattro stadi per specie, legati a popolazione/società (view().sp) e alla bio (regina, covata, sciame, larve).
   Una sola casa per specie presente, rigenerata solo quando cambia lo stadio o la posizione. Budget: tutte le case ≤ 12k triangoli.
   Con la mutazione alta: bagliore viola sulle parti adatte (funghi, bava, seta, muffa). */
window.__CASE=function(THREE,env){
  const {S,FOTO,rngS,clamp}=env, V3=THREE.Vector3, Q=THREE.Quaternion, TAU=Math.PI*2, UP=new V3(0,1,0);
  const root=new THREE.Group(); root.name='case';
  // ---------- rumore ----------
  const h3=(i,j,k)=>{ const n=Math.sin(i*127.1+j*311.7+k*74.7)*43758.5453; return n-Math.floor(n); };
  const sm=a=>a*a*(3-2*a), lp=(a,b,t)=>a+(b-a)*t;
  function vn(x,y,z){ const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),a=sm(x-i),b=sm(y-j),c=sm(z-k);
    return lp(lp(lp(h3(i,j,k),h3(i+1,j,k),a),lp(h3(i,j+1,k),h3(i+1,j+1,k),a),b),lp(lp(h3(i,j,k+1),h3(i+1,j,k+1),a),lp(h3(i,j+1,k+1),h3(i+1,j+1,k+1),a),b),c); }
  const fbm=(x,y,z,s)=>(vn(x+s,y+s*1.7,z-s)*.6+vn(x*2.1+s,y*2.1,z*2.1+s)*.3+vn(x*4.3,y*4.3+s,z*4.3)*.1)-.5;
  // ---------- materiali: foto vere quando ci sono, altrimenti il colore di ripiego ----------
  const MATS=[]; let lvl=0;
  function apply(e){ const M=e.F.maps(lvl); if(!M) return; const m=e.m; m.map=M.map||null; m.normalMap=M.normalMap||null; m.roughnessMap=(lvl<1&&M.roughnessMap)||null; m.color.set(e.o.tint==null?0xffffff:e.o.tint); m.needsUpdate=true; }
  function pm(id,o){ o=o||{}; const F=FOTO?FOTO.mat(id):null, m=new THREE.MeshStandardMaterial({color:o.fb==null?0x6b5440:o.fb,roughness:o.rough==null?.95:o.rough,metalness:0,side:o.side||THREE.FrontSide,vertexColors:!!o.vc});
    const lift=o.lift||0; if(lift){ m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.rgb=min(vec3(1.),diffuseColor.rgb*'+lift.toFixed(2)+');'); }; m.customProgramCacheKey=()=>'case'+lift; }
    if(F){ const e={m,F,o}; MATS.push(e); F.when(()=>apply(e)); } return m; }
  const mk={}; // materiali condivisi tra le case (creati una volta)
  function mats(){ if(mk.ok) return mk; mk.ok=1;
    mk.suolo=pm('terriccio',{fb:0x4a3624,tint:0xe9dccd,lift:1.6,rough:.97});          // terra smossa del formicaio
    mk.suoloC=pm('terriccio',{fb:0x7a6048,tint:0xd8c6ad,lift:2.5,rough:.97});         // terra battuta, più chiara
    mk.argilla=pm('terriccio',{fb:0x9a6f3c,tint:0xf0b970,lift:3.4,rough:.92});        // argilla ocra del termitaio
    mk.umido=pm('terriccio',{fb:0x2b2019,tint:0x9a8a80,rough:.4});                    // terra bagnata e lucida
    mk.aghi=pm('muschio_secco',{fb:0x7a5a32,tint:0xb89a74,rough:.9});
    mk.rametto=pm('rametto',{fb:0x6b5440,rough:.9,side:THREE.DoubleSide});
    mk.corteccia=pm('corteccia_gelso',{fb:0x5a4636,tint:0xd8c8b8,rough:.95});
    mk.legno=pm('legno',{fb:0x8a6a48,tint:0xc8a880,rough:.8});
    mk.legnoScuro=pm('legno',{fb:0x2a1a10,tint:0x3a2616,rough:.9});
    mk.guscio=pm('legno',{fb:0xd8a868,tint:0xe8b878,rough:.45});
    mk.foglia=pm('muschio_secco',{fb:0xa07848,tint:0xb08a58,rough:.9,side:THREE.DoubleSide});
    mk.muschio=pm('muschio',{fb:0x4f6a2a,tint:0xffffff,rough:1});
    mk.frutto=pm('terriccio',{fb:0x5a1a40,tint:0xffffff,lift:3.2,rough:.32,vc:true});
    mk.muffa=pm('muffa',{fb:0xcfd2c8,tint:0xffffff,lift:1.5,rough:1});
    mk.pupa=pm('legno',{fb:0x7a3a20,tint:0xa8582e,rough:.25});
    mk.pupaV=pm('legno',{fb:0xc9a37a,tint:0xe8d0a8,rough:.5});
    mk.seta=pm('muffa',{fb:0xe6e3d8,tint:0xfffaf0,lift:2.2,rough:.7,side:THREE.DoubleSide});
    mk.buco=new THREE.MeshStandardMaterial({color:0x070403,roughness:1});
    mk.bava=new THREE.MeshStandardMaterial({color:0xdde8ec,roughness:.08,metalness:0,transparent:true,opacity:.55,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,emissive:0xA88BFF,emissiveIntensity:0});
    mk.filo=new THREE.LineBasicMaterial({color:0xf2f0ea,transparent:true,opacity:.7});
    mk.velo=new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.7,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false,emissive:0xA88BFF,emissiveIntensity:0});
    mk.luce=new THREE.MeshStandardMaterial({color:0x2a1a44,emissive:0xA88BFF,emissiveIntensity:0,roughness:.5});
    return mk; }
  // ---------- geometrie ----------
  function finish(g,uvf){ g.computeVertexNormals(); return g; }
  const surfUV=(g,k,sc)=>{ const p=g.attributes.position, uv=new Float32Array(p.count*2), f=k/(sc==null?1:sc); for(let i=0;i<p.count;i++){ uv[i*2]=(p.getX(i)+p.getY(i)*.6)*f; uv[i*2+1]=(p.getZ(i)+p.getY(i)*.6)*f; } g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); };
  // cupola di terra smossa: mezza sfera con rumore; surf(dir) restituisce il punto sulla superficie (per fori, aghi, funghi)
  function dome(rx,ry,rz,ws,hs,amp,seed,fq){ const g=new THREE.SphereGeometry(1,ws,hs,0,TAU,0,Math.PI/2), p=g.attributes.position;
    const f=(x,y,z)=>1+amp*2*fbm(x*fq,y*fq,z*fq,seed);
    for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i), k=f(x,y,z); p.setXYZ(i,x*rx*k,Math.max(0,y*ry*k-(y<.02?.0:0)),z*rz*k); }
    surfUV(g,1,.4); g.computeVertexNormals();
    const surf=d=>{ d=d.clone().normalize(); const k=f(d.x,d.y,d.z); return new V3(d.x*rx*k,d.y*ry*k,d.z*rz*k); };
    const nrm=d=>new V3(d.x/rx,d.y/ry,d.z/rz).normalize();
    return {g,surf,nrm}; }
  // torre rugosa (termitaio, spire, camini): profilo r(t) con ondulazioni
  function tower(rb,rt,h,ws,hs,rf,seed,sc){ const pos=[],uv=[],idx=[]; for(let j=0;j<=hs;j++){ const t=j/hs, y=t*h; let r=lp(rb,rt,Math.pow(t,.85))*(1+.35*Math.pow(1-t,4))+rf*Math.sin(t*15+seed)*rb*.35; if(j===hs) r*=.12;
      for(let i=0;i<=ws;i++){ const a=i/ws*TAU, c=Math.cos(a), s=Math.sin(a), n=1+rf*2.4*fbm(c*2.2,y*9,s*2.2,seed); const rr=Math.max(.002,r*n); pos.push(c*rr,y,s*rr); uv.push(i/ws*TAU*rb/(sc||.4),y/(sc||.4)); } }
    for(let j=0;j<hs;j++) for(let i=0;i<ws;i++){ const a=j*(ws+1)+i, b=a+ws+1; idx.push(a,b,a+1,a+1,b,b+1); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  function ribbon(pts,w0,w1,y){ const pos=[],uv=[],idx=[],n=pts.length; for(let i=0;i<n;i++){ const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)], dx=b[0]-a[0], dz=b[1]-a[1], l=Math.hypot(dx,dz)||1, nx=-dz/l, nz=dx/l, w=lp(w0,w1,i/(n-1))*.5;
      pos.push(pts[i][0]+nx*w,y,pts[i][1]+nz*w,pts[i][0]-nx*w,y,pts[i][1]-nz*w); uv.push(pts[i][0]*2.5,pts[i][1]*2.5,pts[i][0]*2.5+.2,pts[i][1]*2.5+.2); }
    for(let i=0;i<n-1;i++){ const a=i*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  // guscio di lumaca: spirale che cresce, aperta sull'imboccatura; cut<1 = guscio rotto
  function shell(R,s,cut,seed){ const N=14,M=6,turns=2.4,pos=[],uv=[],idx=[], tc=[]; const ct=t=>{ const th=t*turns*TAU, rr=s*.55*Math.exp(.34*th/ (TAU)*1.0); return [rr*Math.cos(th)*.62, s*.28*t, rr*Math.sin(th)*.62]; };
    const cmax=cut; for(let i=0;i<=N;i++){ const t=i/N*cmax, rad=s*(.06+.36*Math.pow(t,1.15)), th=t*turns*TAU, c=ct(t), nx=Math.cos(th), nz=Math.sin(th);
      for(let j=0;j<=M;j++){ const b=j/M*TAU, ox=Math.cos(b)*rad, oy=Math.sin(b)*rad, n=1+.06*fbm(i*.7,j*.7,seed,seed); pos.push(c[0]+(nx*ox)*n,c[1]+oy*n,c[2]+(nz*ox)*n); uv.push(t*6,j/M*1.2); } }
    for(let i=0;i<N;i++) for(let j=0;j<M;j++){ const a=i*(M+1)+j,b=a+M+1; idx.push(a,a+1,b,a+1,b+1,b); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  // ---------- istanze ----------
  const _m=new THREE.Matrix4(), _q=new Q(), _s=new V3(), _c=new THREE.Color();
  function inst(parent,geo,mat,items,detail){ if(!items.length) return null; const im=new THREE.InstancedMesh(geo,mat,items.length);
    items.forEach((it,i)=>{ _q.copy(it.q||_q.identity()); const sc=it.s==null?1:it.s; if(typeof sc==='number') _s.set(sc,sc,sc); else _s.copy(sc); _m.compose(it.p,it.q||new Q(),_s); im.setMatrixAt(i,_m); if(it.c!=null){ _c.set(it.c); im.setColorAt(i,_c); } });
    im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; im.frustumCulled=false; im.userData.detail=!!detail; parent.add(im); return im; }
  const alongQ=(dir)=>new Q().setFromUnitVectors(UP,dir.clone().normalize());
  // ---------- le sei case ----------
  const B={};
  // FORMICAIO ---------------------------------------------------------------
  B.formiche=function(st,ctx){ const g=new THREE.Group(), M=mats(), R=rngS(101), i4=st-1, r=[.07,.11,.15,.19][i4], h=[.035,.07,.12,.18][i4], nh=[1,2,3,5][i4], fx=[];
    const D=dome(r,h,r*.92,30,12,.1+.03*i4,3,2.4); const cup=new THREE.Mesh(D.g,M.suolo); cup.castShadow=cup.receiveShadow=true; g.add(cup);
    // fori d'ingresso: il primo guarda il vetro dove corrono le gallerie
    const toGal=Math.atan2(ctx.gx-ctx.x,ctx.gz-ctx.z);
    for(let k=0;k<nh;k++){ const az=k===0?toGal:toGal+(R()-.5)*5, el=k===0?.35:.25+R()*1.0, d=new V3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)), p=D.surf(d), n=D.nrm(d), hr=(k===0?.02:.013+R()*.007)*(.7+.3*i4/3);
      const c=new THREE.Mesh(new THREE.CircleGeometry(hr,9),M.buco); c.position.copy(p).addScaledVector(n,.002); c.quaternion.setFromUnitVectors(new V3(0,0,1),n); g.add(c);
      const rim=new THREE.Mesh(new THREE.TorusGeometry(hr*1.05,hr*.35,4,9),M.suoloC); rim.position.copy(p).addScaledVector(n,.001); rim.quaternion.copy(c.quaternion); g.add(rim); }
    // cratere di terra scavata
    { const ri=r*.9, ro=r*(1.35+.1*i4), rg=new THREE.RingGeometry(ri,ro,28,2), p=rg.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i), t=(Math.hypot(x,y)-ri)/(ro-ri); p.setXYZ(i,x,y,.004+h*.12*(1-t)*(1-t)+.006*fbm(x*14,y*14,0,5)); } rg.rotateX(-Math.PI/2); surfUV(rg,1,.4); rg.computeVertexNormals(); const rm=new THREE.Mesh(rg,M.suoloC); rm.receiveShadow=true; g.add(rm); }
    // granelli di terra smossa
    { const gg=new THREE.OctahedronGeometry(.007,0), it=[], n=[34,52,48,70][i4]; for(let k=0;k<n;k++){ const a=R()*TAU, rr=r*(.4+R()*1.45); it.push({p:new V3(Math.sin(a)*rr,.003,Math.cos(a)*rr),q:new Q().setFromEuler(new THREE.Euler(R()*6,R()*6,R()*6)),s:new V3(.6+R()*1.2,.5+R()*.8,.6+R()*1.2),c:[0x5a4430,0x7a6048,0x3a2a1c,0x6a5038][k&3]}); }
      const im=inst(g,gg,M.suolo,it,true); if(im) im.receiveShadow=true; }
    // aghi di pino e rametti sulla cupola
    if(st>=3){ const na=st===3?70:150, nt=st===3?4:10, ng=new THREE.CylinderGeometry(.0028,.0028,.05,3,1,true), tg=new THREE.CylinderGeometry(.007,.006,.12,5,1,true), ia=[], it=[];
      const lay=(arr,n,len,e0,e1,col)=>{ for(let k=0;k<n;k++){ const az=R()*TAU, el=e0+R()*(e1-e0), d=new V3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)), p=D.surf(d).addScaledVector(D.nrm(d),.004), nn=D.nrm(d), t=new V3(R()-.5,R()*.3,R()-.5).cross(nn).normalize(); if(t.lengthSq()<.1) t.set(1,0,0);
          arr.push({p,q:alongQ(t),s:new V3(.7+R()*.6,len*(.6+R()*.8),.7+R()*.6),c:col?col[k&3]:null}); } };
      lay(ia,na,1,.05,1.35,[0x8a6a3c,0x6a4a2a,0x9a7a48,0x7a5a34]); lay(it,nt,1,.05,1.0,null);
      inst(g,ng,M.aghi,ia,true); const tm=inst(g,tg,M.rametto,it,true); if(tm) tm.castShadow=true; }
    // sentieri battuti: partono dal nido; uno corre verso le gallerie sulla parete
    if(st>=3){ const targets=[[ctx.gx-ctx.x,ctx.gz-ctx.z]]; if(st===4){ targets.push([R()*.5-.7,R()*.4-.6],[.5+R()*.2,.15-R()*.5]); }
      targets.forEach((tg,k)=>{ const L=Math.hypot(tg[0],tg[1])||1, ux=tg[0]/L, uz=tg[1]/L, len=Math.min(L*(k?.55:.92),.55), pts=[], a0=r*.85; for(let i=0;i<=9;i++){ const u=i/9, d=a0+(len-a0)*u, wob=.02*Math.sin(u*7+k*2)+.01*(R()-.5); pts.push([ux*d-uz*wob,uz*d+ux*wob]); }
        const pm_=new THREE.Mesh(ribbon(pts,.04,.018,.005),M.suoloC); pm_.receiveShadow=true; g.add(pm_); }); }
    // funghi della mutazione, minuscoli, sul bordo della cupola
    { const cap=new THREE.SphereGeometry(.014,6,3,0,TAU,0,Math.PI/2), it=[]; for(let k=0;k<10;k++){ const az=R()*TAU, el=.1+R()*.9, d=new V3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)); it.push({p:D.surf(d).addScaledVector(D.nrm(d),.006),q:new Q().setFromUnitVectors(UP,D.nrm(d)),s:.5+R()*.9}); }
      const f=new THREE.Group(); inst(f,cap,M.luce,it); g.add(f); fx.push(f); }
    return {g,fx,rad:r*1.5+.06}; };
  // TERMITAIO ---------------------------------------------------------------
  B.termiti=function(st,ctx){ const g=new THREE.Group(), M=mats(), R=rngS(202), fx=[], i4=st-1;
    if(st===1){ const D=dome(.085,.05,.075,22,8,.14,5,3); g.add(Object.assign(new THREE.Mesh(D.g,M.argilla),{castShadow:true,receiveShadow:true}));
      const lg=new THREE.CylinderGeometry(.013,.011,.16,7,1,false); lg.rotateZ(Math.PI/2); surfUV(lg,1,.5); const lm=new THREE.Mesh(lg,M.corteccia); lm.position.set(.02,.012,.095); lm.rotation.y=.4; lm.castShadow=true; g.add(lm); }
    else { const H=[0,.15,.3,.45][i4], rb=[0,.1,.115,.13][i4], t=new THREE.Mesh(tower(rb,rb*.22,H,26,st===4?20:14,.06+.02*i4,7),M.argilla); t.castShadow=t.receiveShadow=true; g.add(t);
      const nsp=st===4?3:0, nch=st===3?1:st===4?2:0;
      for(let k=0;k<nsp;k++){ const a=k/nsp*TAU+.7, hh=H*(.5+.1*k), sp=new THREE.Mesh(tower(.03,.006,hh,10,8,.05,11+k),M.argilla); sp.position.set(Math.sin(a)*rb*.95,0,Math.cos(a)*rb*.95); sp.castShadow=true; g.add(sp); }
      for(let k=0;k<nch;k++){ const a=k*2.4+1.6, y=H*(.45+.12*k), rr=rb*(1-.62*(y/H))*.78, ch=new THREE.Mesh(new THREE.CylinderGeometry(.017,.022,.07,9,1,true),M.argilla); ch.position.set(Math.sin(a)*rr,y,Math.cos(a)*rr); ch.rotation.set(Math.cos(a)*.45,0,-Math.sin(a)*.45); ch.castShadow=true; g.add(ch);
        const cc=new THREE.Mesh(new THREE.CircleGeometry(.015,9),M.buco); cc.rotation.x=-Math.PI/2; cc.position.copy(ch.position); cc.position.y+=.03; g.add(cc); } }
    // giardino di funghi sul fondo (bagliore della mutazione)
    { const cap=new THREE.SphereGeometry(.012,6,3,0,TAU,0,Math.PI/2), it=[]; for(let k=0;k<9;k++){ const a=R()*TAU, rr=.1+R()*.07; it.push({p:new V3(Math.sin(a)*rr,.004,Math.cos(a)*rr),q:new Q(),s:.6+R()}); }
      const f=new THREE.Group(); inst(f,cap,M.luce,it); g.add(f); fx.push(f); }
    // briciole di argilla attorno alla base
    { const gg=new THREE.OctahedronGeometry(.006,0), it=[], n=[14,22,30,40][i4]; for(let k=0;k<n;k++){ const a=R()*TAU, rr=.1+R()*.14; it.push({p:new V3(Math.sin(a)*rr,.003,Math.cos(a)*rr),q:new Q().setFromEuler(new THREE.Euler(R()*6,R()*6,R()*6)),s:.7+R()*1.3}); } inst(g,gg,M.argilla,it,true); }
    return {g,fx,rad:[.13,.16,.17,.2][i4]}; };
  // RIFUGIO DELLE LUMACHE ------------------------------------------------------
  B.lumache=function(st,ctx){ const g=new THREE.Group(), M=mats(), R=rngS(303), fx=[], i4=st-1, W=[.18,.26,.34,.42][i4], Wd=[.14,.2,.27,.33][i4], Ht=[.045,.07,.1,.13][i4];
    // zona umida e scura
    { const dg=new THREE.CircleGeometry(.3*Wd*2.6/1.0*.5+.05,22); dg.rotateX(-Math.PI/2); const p=dg.attributes.position; for(let i=0;i<p.count;i++){ p.setY(i,.0035+.003*fbm(p.getX(i)*9,0,p.getZ(i)*9,2)); p.setX(i,p.getX(i)*1.15); } surfUV(dg,1,.4); dg.computeVertexNormals(); const dm=new THREE.Mesh(dg,M.umido); dm.receiveShadow=true; g.add(dm); }
    // foglia secca curva: tetto ad arco, bordo frastagliato
    { const NU=16, NV=10, pos=[],uv=[],idx=[]; for(let i=0;i<=NU;i++){ const u=i/NU*2-1, hw=Wd*Math.pow(Math.max(0,1-u*u),.62)+.002;
        for(let j=0;j<=NV;j++){ const v=j/NV*2-1, edge=1+.07*fbm(u*5,v*3,0,9), x=u*W/2, z=v*hw*edge, y=Ht*(1-v*v)*(1-.35*u*u)+.003+.012*fbm(u*6,v*6,1,4)+.014*Math.abs(v)*Math.sin(u*9)*.5; pos.push(x,y,z); uv.push(x*2.2,z*2.2); } }
      for(let i=0;i<NU;i++) for(let j=0;j<NV;j++){ const a=i*(NV+1)+j,b=a+NV+1; idx.push(a,b,a+1,a+1,b,b+1); }
      const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); lg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); lg.setIndex(idx); lg.computeVertexNormals(); const lf=new THREE.Mesh(lg,M.foglia); lf.castShadow=lf.receiveShadow=true; g.add(lf); }
    // gusci vuoti: per stadio 1,2,3,5 (alcuni rotti)
    { const cfg=[[[.0,0,.05,1,0]],[[-.04,.03,.055,1,.5],[.07,-.02,.04,.65,2]],[[-.07,.02,.06,1,0],[.05,.04,.05,1,1.7],[.0,-.04,.045,.7,3.3]],
        [[-.12,.02,.075,1,.2],[.1,.05,.06,1,1.9],[-.02,-.05,.05,.7,3.1],[.18,-.03,.045,1,4.4],[-.2,-.05,.05,.62,5.5]]][i4];
      cfg.forEach((c,k)=>{ const sg=new THREE.Mesh(shell(R,c[2]*1.5,c[3],k+4),M.guscio); sg.rotation.set(Math.PI*.5*(k%2?.7:-.2)+R()*.4,c[4],Math.PI/2*(k%3?0:1)); sg.updateMatrixWorld(); const bb=new THREE.Box3().setFromObject(sg); sg.position.set(c[0],-bb.min.y+.002,c[1]); sg.castShadow=true; sg.receiveShadow=true; g.add(sg); }); }
    // muschio al margine
    if(st>=3){ const n=st===3?3:5; for(let k=0;k<n;k++){ const a=R()*TAU, D=dome(.025+R()*.03,.016+R()*.012,.03,10,5,.35,20+k,4); const mm=new THREE.Mesh(D.g,M.muschio); mm.position.set(Math.sin(a)*(.12+R()*.1)*(W/.42)*1.2,0,Math.cos(a)*(.1+R()*.06)); g.add(mm); } }
    // scie di bava argentea
    { const n=st<3?1:st===3?2:3, f=new THREE.Group(); for(let k=0;k<n;k++){ const pts=[]; let x=-.15+R()*.1, z=(R()-.5)*.2, a=R()*TAU; for(let i=0;i<9;i++){ pts.push([x,z]); a+=(R()-.5)*.7; x+=Math.cos(a)*.035; z+=Math.sin(a)*.035; }
        const tr=new THREE.Mesh(ribbon(pts,.012,.006,.0065),M.bava); tr.renderOrder=2; f.add(tr); } g.add(f); fx.push(f); }
    return {g,fx,rad:W*.62+.04}; };
  // FRUTTO + PUPE DELLE MOSCHE ---------------------------------------------------
  B.mosche=function(st,ctx){ const g=new THREE.Group(), M=mats(), R=rngS(404), fx=[], i4=st-1, rf=[.085,.08,.075,.07][i4], sq=[1,.88,.78,.55][i4], dent=[.03,.1,.14,.28][i4];
    const fg=new THREE.SphereGeometry(1,22,13), p=fg.attributes.position, cols=new Float32Array(p.count*3), fresh=new THREE.Color(0x6a1c4a), ripe=new THREE.Color(0x4a1034), pulp=new THREE.Color(0xc04a5c), dry=new THREE.Color(0x2c1a1a), tmp=new THREE.Color(), cut=new V3(.55,.55,.6).normalize();
    for(let i=0;i<p.count;i++){ let x=p.getX(i),y=p.getY(i),z=p.getZ(i); const drup=.035*Math.abs(Math.sin(x*21)*Math.sin(y*19+z*8)), n=1+dent*2*fbm(x*2.2,y*2.2,z*2.2,7)-drup*(st<4?1:.4), k=rf*n; let yy=y*k*sq; if(yy<-rf*.55*sq) yy=-rf*.55*sq+(yy+rf*.55*sq)*.2;
      p.setXYZ(i,x*k,yy+rf*sq*.55,z*k); const d=new V3(x,y,z).normalize().dot(cut); tmp.copy(st===1?fresh:st===2?ripe:st===3?ripe:dry); if(st===3&&d>.62){ const t=clamp((d-.62)*6); tmp.lerp(pulp,t); if(t>.5){ const q=p.getX(i),rr=p.getY(i); p.setXYZ(i,x*k-cut.x*.012*t,yy+rf*sq*.55-cut.y*.012*t,z*k-cut.z*.012*t); } } if(st>=2) tmp.multiplyScalar(.85+.3*vn(x*5,y*5,z*5)); cols[i*3]=tmp.r; cols[i*3+1]=tmp.g; cols[i*3+2]=tmp.b; }
    fg.setAttribute('color',new THREE.BufferAttribute(cols,3)); surfUV(fg,1,.4); fg.computeVertexNormals(); const fm=new THREE.Mesh(fg,M.frutto); fm.castShadow=fm.receiveShadow=true; g.add(fm);
    const pivot=new THREE.Group(); // picciolo
    if(st<4){ const sg=new THREE.CylinderGeometry(.004,.006,.04,5,1,true), sm_=new THREE.Mesh(sg,M.rametto); sm_.position.set(0,rf*sq*1.1+.015,0); sm_.rotation.z=.25; g.add(sm_); }
    // pupe: ovali marrone-rossicci, lucidi, mezze interrate
    { const np=[0,3,8,15][i4], pg=new THREE.SphereGeometry(1,7,5), it=[], it2=[]; for(let k=0;k<np;k++){ const a=k*2.4+R(), rr=rf*1.25+.03+R()*.1*(1+i4*.35), open=st===4&&k%4===3, e=new THREE.Euler((R()-.5)*.8,R()*TAU,(R()-.5)*.6+Math.PI/2);
        (open?it2:it).push({p:new V3(Math.sin(a)*rr,.002+.002*R(),Math.cos(a)*rr),q:new Q().setFromEuler(e),s:new V3(.0105,.0052,.0052)}); }
      inst(g,pg,M.pupa,it,true); inst(g,pg,M.pupaV,it2,true);
      if(st===4){ const wg=new THREE.PlaneGeometry(.022,.009), wi=[]; for(let k=0;k<6;k++){ const a=R()*TAU, rr=rf*1.2+R()*.2; wi.push({p:new V3(Math.sin(a)*rr,.003,Math.cos(a)*rr),q:new Q().setFromEuler(new THREE.Euler(-Math.PI/2,0,R()*TAU)),s:.7+R()*.6}); } const wm=inst(g,wg,M.seta,wi,true); } }
    // muffa e bagliore sul frutto che avvizzisce
    if(st>=3){ const mg=new THREE.SphereGeometry(1,7,4), it=[], f=new THREE.Group(); for(let k=0;k<(st===3?4:8);k++){ const d=new V3(R()-.5,R()*.6+.1,R()-.5).normalize(); it.push({p:new V3(d.x*rf*.98,d.y*rf*sq*.98+rf*sq*.55,d.z*rf*.98),q:new Q(),s:new V3(.014+R()*.012,.006,.014+R()*.01)}); }
      inst(g,mg,M.muffa,it); const lm=[]; it.forEach(o=>lm.push({p:o.p.clone().add(new V3(0,.004,0)),q:new Q(),s:new V3(.7,.7,.7).multiplyScalar(.01)})); inst(f,new THREE.SphereGeometry(1,6,4),M.luce,lm); g.add(f); fx.push(f); }
    return {g,fx,rad:[.17,.18,.2,.24][i4]}; };
  // RAGNI: rifugio di seta nella foglia arrotolata, in alto contro il vetro -------------------
  B.ragni=function(st,ctx){ const g=new THREE.Group(), M=mats(), R=rngS(505), fx=[], f=new THREE.Group();
    const L=[0,.1,.15,.17][st-1], rr=.04;
    if(st>=2){ const lg=new THREE.CylinderGeometry(rr,rr*.7,L,12,4,true,0,[0,TAU*.7,TAU*.8,TAU*.85][st-1]), p=lg.attributes.position; for(let i=0;i<p.count;i++){ const k=1+.12*fbm(p.getX(i)*30,p.getY(i)*30,p.getZ(i)*30,3); p.setX(i,p.getX(i)*k); p.setZ(i,p.getZ(i)*k); } lg.rotateZ(Math.PI/2); surfUV(lg,2.5,1); lg.computeVertexNormals();
      const lf=new THREE.Mesh(lg,M.foglia); lf.rotation.x=.4; lf.castShadow=true; g.add(lf); }
    // velo di seta che chiude la foglia e piccola ancora sul vetro
    { const vg=new THREE.SphereGeometry(1,12,7); const vm=new THREE.Mesh(vg,M.velo); const sc=st===1?new V3(.03,.02,.02):new V3(L*.52+.012,rr*1.05,rr*1.05); vm.scale.copy(sc); vm.position.set(0,0,.0); vm.rotation.x=.4; f.add(vm); }
    // fili: tre verso il vetro, uno segnale verso il centro del vaso
    { const pts=[]; const ln=(a,b)=>{ pts.push(a,b); }; for(let k=0;k<3;k++) ln(new V3((k-1)*L*.4,0,0),new V3((k-1)*L*.55+(R()-.5)*.04,(R()-.5)*.08+.02,-.07-R()*.03));
      if(st>=3) ln(new V3(0,-.01,.035),new V3(.0,-.28,.34)); const lg=new THREE.BufferGeometry().setFromPoints(pts); const ls=new THREE.LineSegments(lg,M.filo); g.add(ls);
      if(st===4){ [[-.05,.14,.9],[.06,.22,-.6]].forEach(pr=>{ const top=new V3(pr[0],-.015,.02), bot=new V3(pr[0]+.01,-pr[1],.03); g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([top,bot]),M.filo));
          const pg=new THREE.SphereGeometry(1,8,5), pr_=new THREE.Mesh(pg,M.seta); pr_.scale.set(.011,.026,.011); pr_.position.copy(bot).add(new V3(0,-.02,0)); pr_.rotation.z=pr[2]*.25; pr_.castShadow=true; g.add(pr_); }); } }
    g.add(f); fx.push(f);
    return {g,fx,rad:.1,high:true}; };
  // CEPPO DEI COLEOTTERI ----------------------------------------------------------
  B.coleotteri=function(st,ctx){ const g=new THREE.Group(), M=mats(), R=rngS(606), fx=[], i4=st-1, r=[.022,.045,.06,.07][i4], L=[.25,.3,.35,.4][i4], arc=[TAU*.97,TAU*.78,TAU*.66,TAU*.72][i4];
    const log=new THREE.Group(); log.position.y=r*.85; log.rotation.z=0; g.add(log);
    const ed=a=>new V3(0,Math.sin(a),Math.cos(a)); // angolo attorno all'asse X
    // anima di legno
    { const cg=new THREE.CylinderGeometry(r*.94,r*.94,L,22,6,false), p=cg.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i), k=1+.06*fbm(x*14,y*6,z*14,1); p.setXYZ(i,x*k,y,z*k); } cg.rotateZ(Math.PI/2); surfUV(cg,1,.5); const uvp=cg.attributes.uv; for(let i=0;i<p.count;i++){ uvp.setXY(i,p.getX(i)*2,Math.atan2(p.getZ(i),p.getY(i))*r*2); } cg.computeVertexNormals(); const cm=new THREE.Mesh(cg,M.legno); cm.castShadow=cm.receiveShadow=true; log.add(cm); }
    // corteccia: arco aperto che lascia in vista il legno scavato (la parte scoperta guarda in alto)
    { const th0=Math.PI/2-(TAU+arc)/2, gapA=Math.PI/2, gw=(TAU-arc)/2, bg=new THREE.CylinderGeometry(r,r*.98,L,26,8,true,th0,arc), p=bg.attributes.position, uv=bg.attributes.uv; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i), k=1+.1*fbm(x*18,y*5,z*18,2)+.05*Math.sin(y*40+z*30); p.setXYZ(i,x*k,y,z*k); uv.setXY(i,uv.getX(i)*arc*r*2,y*2+L); } bg.rotateZ(Math.PI/2); bg.computeVertexNormals(); const bm=new THREE.Mesh(bg,M.corteccia); bm.castShadow=bm.receiveShadow=true; log.add(bm);
      // gallerie scavate nel legno scoperto
      const ng=[0,2,5,8][i4], gm=[]; for(let k=0;k<ng;k++){ const P=[]; let xx=-L*.42+R()*L*.3, aa=gapA+(R()-.5)*gw*.8; for(let i=0;i<22;i++){ const rr=r*.97; P.push(new V3(xx,Math.sin(aa)*rr,Math.cos(aa)*rr)); xx+=.008+.006*R(); aa=clamp(aa+(R()-.5)*.6,gapA-gw+.25,gapA+gw-.25); }
        const tg=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P),24,.0042+.0016*R(),4,false); log.add(new THREE.Mesh(tg,M.legnoScuro)); gm.push(P[8]); }
      // fori d'uscita sulla corteccia
      const nh=[1,1,2,4][i4]; for(let k=0;k<nh;k++){ const a=th0+arc*(.15+.7*R()), x=-L*.4+R()*L*.8, nn=new V3(0,Math.sin(a),Math.cos(a)), c=new THREE.Mesh(new THREE.CircleGeometry(.0075+.003*R(),9),M.buco); c.position.set(x,Math.sin(a)*r*1.06,Math.cos(a)*r*1.06); c.quaternion.setFromUnitVectors(new V3(0,0,1),nn); log.add(c); }
      // funghetti luminosi nelle gallerie (mutazione)
      const cap=new THREE.SphereGeometry(.007,6,3,0,TAU,0,Math.PI/2), it=[]; gm.forEach(pp=>{ const nn=new V3(0,pp.y,pp.z).normalize(); it.push({p:pp.clone().addScaledVector(nn,.003),q:new Q().setFromUnitVectors(UP,nn),s:1+R()*.6}); }); const fg=new THREE.Group(); inst(fg,cap,M.luce,it); log.add(fg); fx.push(fg); }
    // rosura chiara e pallina di terra
    { const gg=new THREE.OctahedronGeometry(.005,0), it=[], n=[0,8,22,44][i4]; for(let k=0;k<n;k++){ const x=(R()-.5)*L*.9, side=R()<.5?1:-1, dz=r*(.9+R()*1.6)*side; it.push({p:new V3(x,.003,dz),q:new Q().setFromEuler(new THREE.Euler(R()*6,R()*6,R()*6)),s:.6+R()*1.3,c:[0xd8c49a,0xc9b080,0xe6d8b4,0xb8a070][k&3]}); } const mm=pm('terriccio',{fb:0xd8c49a,tint:0xffffff,lift:3.6,rough:1}); inst(g,gg,mm,it,true); }
    if(st===4){ const bg=new THREE.SphereGeometry(.03,12,8), p=bg.attributes.position; for(let i=0;i<p.count;i++){ const k=1+.12*fbm(p.getX(i)*30,p.getY(i)*30,p.getZ(i)*30,5); p.setXYZ(i,p.getX(i)*k,p.getY(i)*k*.95,p.getZ(i)*k); } surfUV(bg,1,.15); bg.computeVertexNormals(); const bm=new THREE.Mesh(bg,M.suolo); bm.position.set(L*.5+.06,.027,.06); bm.castShadow=bm.receiveShadow=true; g.add(bm);
      const tk=ribbon([[L*.5+.03,.06],[L*.5-.04,.05],[L*.5-.1,.07]],.006,.004,.004); g.add(new THREE.Mesh(tk,M.suoloC)); }
    return {g,fx,rad:L*.6+.03}; };

  // ---------- gestione: una casa per specie presente ----------
  const HOUSES={}, LIST=['formiche','termiti','lumache','mosche','coleotteri','ragni'];
  const PREF={formiche:[.1,.62],termiti:[-.58,.02],lumache:[-.32,-.6],mosche:[.58,.32],coleotteri:[.12,-.62],ragni:[0,0]};
  const GAL=[.075,.886];
  let placeKey='', placed={}, force=null, mutLv=0, detail=true;
  function stageOf(id,x,bio){ const pop=Math.max(0,x.pop||0); let s=pop<4?1:pop<10?2:pop<22?3:4; if(x.society) s=4;
    if(id==='formiche'&&bio&&bio.formiche){ const c=bio.formiche.covata||{}, nn=(c.uova||0)+(c.larve||0)+(c.pupe||0); if(bio.formiche.regina&&nn>2) s=Math.max(s,3); if(bio.formiche.regina&&nn>10) s=4; if(!bio.formiche.regina) s=Math.min(s,3); }
    if(id==='termiti'&&bio&&bio.termiti){ if(bio.termiti.sciame) s=Math.max(s,3); if((bio.termiti.fondati||0)>0) s=Math.max(s,4); }
    if(id==='mosche'&&bio&&bio.mosche&&bio.mosche.larve>0) s=Math.max(s,2);
    return Math.max(1,Math.min(4,s)); }
  function place(ids,occ){ const out={}, taken=occ.map(o=>({x:o.x,z:o.z,r:o.r}));
    ids.forEach(id=>{ if(id==='ragni') return; const H=HOUSES[id], rad=(H&&H.rad)||.2, pf=PREF[id]; let best=null,bs=1e9, fall=null,fs=-1e9;
      for(let a=0;a<72;a++){ const ang=a/72*TAU; for(const rr of [.3,.4,.5,.6,.68]){ const x=Math.sin(ang)*rr, z=Math.cos(ang)*rr; if(rr+rad>.86) continue;
          let gap=1e9; taken.forEach(o=>{ gap=Math.min(gap,Math.hypot(o.x-x,o.z-z)-o.r-rad); }); const dd=Math.hypot(x-pf[0],z-pf[1]);
          if(gap>=.02&&dd<bs){ bs=dd; best=[x,z]; } if(gap>fs){ fs=gap; fall=[x,z]; } } }
      const p=best||fall||[pf[0],pf[1]]; out[id]=p; taken.push({x:p[0],z:p[1],r:rad}); });
    return out; }
  function dispose(g){ g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.isInstancedMesh) o.dispose&&o.dispose(); }); }
  function rebuild(id,st,pos){ let H=HOUSES[id]; if(!H){ H=HOUSES[id]={id,w:new THREE.Group(),st:0,rad:.2,inner:null,t0:-9,key:''}; H.w.name='casa_'+id; root.add(H.w); }
    const key=st+'|'+pos.map(v=>v.toFixed(2)).join(','); if(H.key===key) return H; const first=!H.inner; if(H.inner){ H.w.remove(H.inner); dispose(H.inner); }
    let o; try{ o=B[id](st,{x:pos[0],z:pos[1],gx:GAL[0],gz:GAL[1]}); }catch(e){ console.warn('casa',id,e&&e.message); o={g:new THREE.Group(),fx:[],rad:.2}; }
    H.inner=o.g; H.fx=o.fx||[]; H.rad=o.rad; H.high=!!o.high; H.w.add(o.g); if(H.st!==st&&!first) H.t0=performance.now()/1000; H.st=st; H.key=key; H.w.rotation.y=id==='formiche'?0:(id==='ragni'?0:(id.length*1.7)%TAU);
    o.g.traverse(m=>{ if(m.isInstancedMesh&&m.userData.detail) m.visible=detail; }); return H; }
  const api={g:root,houses:HOUSES,
    get force(){ return force; }, set force(v){ force=v; placeKey=''; },
    level(l){ lvl=l; MATS.forEach(e=>{ if(e.F.ready) apply(e); }); detail=l<2; Object.values(HOUSES).forEach(H=>H.inner&&H.inner.traverse(m=>{ if(m.isInstancedMesh&&m.userData.detail) m.visible=detail; })); },
    stats(){ let tri=0; root.traverse(o=>{ if(!o.visible||!o.geometry) return; let vis=true,p=o; while(p){ if(!p.visible){ vis=false; break; } p=p.parent; } if(!vis) return; const n=o.geometry.index?o.geometry.index.count/3:o.geometry.attributes.position.count/3; tri+=o.isInstancedMesh?n*o.count:(o.isLineSegments?0:n); }); return {tri:Math.round(tri),case:Object.keys(HOUSES).filter(k=>HOUSES[k].w.visible)}; },
    tick(dt,t,v,occ){ const bio=v.bio, ids=[], stg={}; (v.sp||[]).forEach(x=>{ if(x.alive===false||LIST.indexOf(x.id)<0) return; ids.push(x.id); let s=stageOf(x.id,x,bio); if(force!=null) s=typeof force==='number'?force:(force[x.id]||s); stg[x.id]=s; });
      const mt=(v.sp||[]).reduce((a,x)=>Math.max(a,x.alive===false?0:Math.min(1,(x.mut||[]).length/4)),0); mutLv=mt;
      const key=ids.join(',')+'|'+(occ||[]).map(o=>o.x.toFixed(2)+','+o.z.toFixed(2)+','+o.r.toFixed(2)).join(';'); if(key!==placeKey){ placeKey=key; ids.forEach(id=>{ if(!HOUSES[id]) rebuild(id,stg[id],PREF[id]); }); placed=place(ids,occ||[]); }
      LIST.forEach(id=>{ const on=ids.indexOf(id)>=0, H=HOUSES[id]; if(!on){ if(H) H.w.visible=false; return; }
        const pos=id==='ragni'?[Math.sin(2.35)*.87,Math.cos(2.35)*.87]:(placed[id]||PREF[id]); const Hh=rebuild(id,stg[id],pos); Hh.w.visible=true;
        // cresce con un piccolo balzo (200 ms) al cambio di stadio; sempre sulla terra, mai fuori dal vetro
        const k=Math.min(1,(performance.now()/1000-Hh.t0)/.25), sc=.88+.12*(1-Math.pow(1-clamp(k),3)); Hh.w.scale.setScalar(sc);
        Hh.w.position.set(pos[0],Hh.high?1.5-S.soilTop:.0,pos[1]);
        if(id==='ragni'){ Hh.w.rotation.y=Math.atan2(pos[0],pos[1])+Math.PI; } // la foglia sta contro il vetro, la parte aperta guarda il centro
        Hh.fx.forEach(f=>{ f.visible=mutLv>.2; }); });
      const gl=mutLv*(1.2+.35*Math.sin(t*1.7)), M=mk; if(M.ok){ M.luce.emissiveIntensity=gl*1.6; M.bava.emissiveIntensity=gl*.9; M.velo.emissiveIntensity=gl*.6; } }};
  root.position.y=0;
  return api;
};
