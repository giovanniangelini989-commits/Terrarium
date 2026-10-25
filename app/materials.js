/* Libreria materiali Terrario — stessi id del brief Kimi v2 (§3). Possediamo noi i materiali: i modelli indicano solo lo slot. */
window.__MATLIB=function(THREE){
  const P=o=>new THREE.MeshPhysicalMaterial(o), Sd=o=>new THREE.MeshStandardMaterial(o);
  const DEF={
    0:['chitina',()=>P({color:0x3a2a20,roughness:.32,clearcoat:.6,clearcoatRoughness:.2,vertexColors:true})],
    1:['chitina_opaca',()=>Sd({color:0xd9c39a,roughness:.6,vertexColors:true})],
    2:['occhio_composto',()=>P({color:0x7a1a14,roughness:.15,clearcoat:1})],
    3:['ala',()=>P({color:0xdfe8ff,roughness:.1,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false})],
    4:['conchiglia',()=>P({color:0xb07a46,roughness:.4,clearcoat:.5,vertexColors:true})],
    5:['pelle_umida',()=>P({color:0x9a8c7a,roughness:.25,clearcoat:.8,vertexColors:true})],
    6:['peluche',()=>P({color:0x9a6a44,roughness:1,sheen:1,sheenRoughness:.75,sheenColor:new THREE.Color(0xf0d0a8),vertexColors:true})],
    7:['plastica_lucida',()=>P({color:0x120c0a,roughness:.12,clearcoat:1,clearcoatRoughness:.05})],
    8:['ottone',()=>Sd({color:0xc9a24a,metalness:1,roughness:.32,vertexColors:true})],
    9:['metallo_brunito',()=>Sd({color:0x3a3530,metalness:1,roughness:.45})],
    10:['argento',()=>Sd({color:0xd9d6d0,metalness:1,roughness:.25,vertexColors:true})],
    11:['smalto',()=>P({color:0xf1ebdc,roughness:.15,clearcoat:.8,vertexColors:true})],
    12:['vetro_sottile',()=>P({color:0x000000,transparent:true,blending:THREE.AdditiveBlending,roughness:.05,clearcoat:.5,depthWrite:false})],
    13:['specchio',()=>Sd({color:0xe6ecef,metalness:1,roughness:.04})],
    14:['legno_lucido',()=>P({color:0x6b4426,roughness:.45,clearcoat:.5,vertexColors:true})],
    15:['pelle',()=>Sd({color:0x5a2a1e,roughness:.7,vertexColors:true})],
    16:['carta',()=>Sd({color:0xe9dfc6,roughness:.95,vertexColors:true})],
    17:['tessuto',()=>P({color:0x4a4f48,roughness:1,sheen:.6,sheenColor:new THREE.Color(0x9aa39a),vertexColors:true})],
    18:['cera',()=>P({color:0xf0e2c4,roughness:.55,sheen:.3,sheenColor:new THREE.Color(0xfff2d8),vertexColors:true})],
    19:['fiamma',()=>new THREE.MeshBasicMaterial({color:0xffb04a,toneMapped:false})],
    20:['pietra',()=>Sd({color:0xb8ad9c,roughness:.85,vertexColors:true})],
    21:['ceramica',()=>P({color:0xd8cfc0,roughness:.3,clearcoat:.4,vertexColors:true})]
  };
  const ID={}; Object.keys(DEF).forEach(k=>ID[DEF[k][0]]=+k);
  const cache={}; const mat=slot=>{ const id=typeof slot==='number'?slot:ID[slot]; if(!(id in DEF)) return null; return cache[id]||(cache[id]=DEF[id][1]()); };
  // Compatibilità pass 1: colori usati da Kimi → slot (si toglie quando arriva aMat)
  const OBJMAP={
    statuina:{'#42392b':'pietra','#0d0c0a':'pietra','#2d281f':'pietra'},
    orologio:{'#19130b':'metallo_brunito','#643d14':'ottone','#ad9f77':'smalto','#20150b':'metallo_brunito','#0d0b08':'metallo_brunito'},
    giocattolo:{'#522e17':'peluche','#7c522c':'peluche','#100a07':'plastica_lucida','#2a180d':'plastica_lucida'},
    specchio:{'#543a17':'ottone','#6f501f':'ottone','#90a3a3':'specchio'},
    libro:{'#564933':'pelle','#291610':'pelle','#958560':'carta','#130d0a':'pelle','#60431d':'ottone'},
    moneta:{'#734a14':'argento','#a17a28':'argento','#2e1d09':'argento'},
    radio:{'#705229':'legno_lucido','#3e473f':'tessuto','#212a25':'tessuto','#090c0a':'metallo_brunito','#a4905c':'ottone','#251b0e':'legno_lucido','#0e1210':'metallo_brunito','#464e47':'tessuto'},
    candela:{'#ad8d55':'cera','#826436':'ottone','#0b0805':'metallo_brunito','#ff8d25':'fiamma'}
  };
  const rgb=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
  const lum=c=>.2126*c[0]+.7152*c[1]+.0722*c[2];
  function dress(group,objId){ const map=OBJMAP[objId]; if(!map) return group; const keys=Object.keys(map).map(h=>({h,c:rgb(h),slot:map[h]}));
    group.traverse(m=>{ if(!m.isMesh) return; const g=m.geometry, col=g.attributes.color; if(!col) return; if(!g.index){ const a=[]; for(let i=0;i<g.attributes.position.count;i++) a.push(i); g.setIndex(a); }
      const idx=g.index.array, tri=idx.length/3, bySlot={}, near=i=>{ const c=[col.getX(i),col.getY(i),col.getZ(i)]; let best=keys[0], bd=1e9; keys.forEach(k=>{ const d=(k.c[0]-c[0])**2+(k.c[1]-c[1])**2+(k.c[2]-c[2])**2; if(d<bd){ bd=d; best=k; } }); return best; };
      const shade=new Float32Array(col.count*3);
      for(let t=0;t<tri;t++){ const k=near(idx[t*3]); (bySlot[k.slot]=bySlot[k.slot]||[]).push(idx[t*3],idx[t*3+1],idx[t*3+2]); }
      for(let i=0;i<col.count;i++){ const k=near(i), c=[col.getX(i),col.getY(i),col.getZ(i)], f=Math.max(.45,Math.min(1.25,lum(c)/Math.max(.02,lum(k.c)))); shade[i*3]=shade[i*3+1]=shade[i*3+2]=f; }
      g.setAttribute('color',new THREE.BufferAttribute(shade,3)); const order=Object.keys(bySlot), ni=[], mats=[]; g.clearGroups();
      order.forEach((s,j)=>{ g.addGroup(ni.length,bySlot[s].length,j); ni.push(...bySlot[s]); mats.push(mat(s)); }); g.setIndex(ni); m.material=mats.length===1?mats[0]:mats; });
    return group; }
  return {DEF,ID,mat,dress,OBJMAP};
};

/* ---------- Terreno fotorealistico (agente tre-d) ----------
   Texture PBR generate in codice: colore, normal map, roughness (canale G) e occlusione ambientale (canale R) nella stessa
   mappa «ORM». Scala: 1 unità = 10 cm, una tessera = 10 cm (N px per 10 cm → N/100 px per mm). Grani 1–3 mm, sassolini
   3–8 mm, fibre e radichette, frammenti di foglia. La stessa mappa d'altezza fa il rilievo del disco in cima (vedi v3d.js).
   `kind`: 'terra' (terriccio) o 'ghiaia' (drenaggio). `size`: 512 (livello 0) o 256 (livello 1 della guardia prestazioni). */
window.__TERRENO=function(THREE,o){
  o=o||{}; const N=o.size||512, kind=o.kind||'terra', seed=o.seed||17, MM=N/100; // MM = pixel per millimetro
  const rng=s=>{ s=(s>>>0)||1; return ()=>{ s=(s+0x6D2B79F5)>>>0; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; };
  const r=rng(seed), cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h||w; return c; };
  // rumore a valori, periodico su N (le tessere si ripetono senza cuciture)
  const P=new Uint8Array(512); { const q=rng(seed*7+1); for(let i=0;i<256;i++) P[i]=i; for(let i=255;i>0;i--){ const j=(q()*(i+1))|0; const t=P[i]; P[i]=P[j]; P[j]=t; } for(let i=0;i<256;i++) P[i+256]=P[i]; }
  const vn=(x,y,per)=>{ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy); const h=(a,b)=>P[(P[(a%per+per)%per]+(b%per+per)%per)&511]/255; const a=h(xi,yi), b=h(xi+1,yi), c=h(xi,yi+1), d=h(xi+1,yi+1); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; };
  const fbm=(x,y,oct,per)=>{ let s=0, a=.5, f=1, n=0; for(let i=0;i<oct;i++){ s+=a*vn(x*f,y*f,per*f); n+=a; a*=.5; f*=2; } return s/n; };
  // --- strato 0: base (altezza, colore, roughness) ---
  const hc=cv(N), hg=hc.getContext('2d'), cc=cv(N), cg=cc.getContext('2d'), rc=cv(N), rg=rc.getContext('2d');
  { const hi=hg.createImageData(N,N), ci=cg.createImageData(N,N), ri=rg.createImageData(N,N), HD=hi.data, CD=ci.data, RD=ri.data;
    const per=8; // 8 celle di rumore per tessera (una cella = 1,25 cm)
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const u=x/N*per, v=y/N*per, k=(y*N+x)*4;
      const lo=fbm(u,v,3,per), hiF=fbm(u*4+3.1,v*4+7.7,4,per*4), h=kind==='terra'?.30+.25*lo+.22*hiF:.18+.12*lo+.1*hiF;
      HD[k]=HD[k+1]=HD[k+2]=Math.round(255*h); HD[k+3]=255;
      let cr,cg2,cb; if(kind==='terra'){ const t=lo*.6+hiF*.4, w=.62+.6*t; cr=52*w; cg2=36*w; cb=24*w; const hum=fbm(u*2+11,v*2+5,2,per*2); if(hum<.46){ const f=(.46-hum)*2.2; cr*=1-.4*f; cg2*=1-.45*f; cb*=1-.45*f; } }
      else { const t=lo*.5+hiF*.5, w=.5+.6*t; cr=74*w; cg2=70*w; cb=64*w; }
      CD[k]=cr; CD[k+1]=cg2; CD[k+2]=cb; CD[k+3]=255;
      RD[k]=255; RD[k+1]=Math.round(255*(kind==='terra'?.9+.08*hiF:.82+.1*hiF)); RD[k+2]=0; RD[k+3]=255; }
    hg.putImageData(hi,0,0); cg.putImageData(ci,0,0); rg.putImageData(ri,0,0); }
  // sprite di un grano (altezza): profilo a cupola, disegnato con 'lighter' sulla mappa d'altezza
  const dome=(sz,pow)=>{ const c=cv(sz), g=c.getContext('2d'), im=g.createImageData(sz,sz), d=im.data, R=sz/2; for(let y=0;y<sz;y++) for(let x=0;x<sz;x++){ const dx=(x+.5-R)/R, dy=(y+.5-R)/R, q=1-dx*dx-dy*dy, k=(y*sz+x)*4; const h=q>0?Math.pow(q,pow):0; d[k]=d[k+1]=d[k+2]=255; d[k+3]=Math.round(255*h); } g.putImageData(im,0,0); return c; };
  const D1=dome(32,.55), D2=dome(64,.5);
  // disegna una forma anche sulle copie oltre i bordi (tessera senza cuciture)
  const wrap=(g,x,y,fn)=>{ for(const ox of [0,-N,N]) for(const oy of [0,-N,N]){ if(x+ox<-N*.2||x+ox>N*1.2||y+oy<-N*.2||y+oy>N*1.2) continue; g.save(); g.translate(x+ox,y+oy); fn(g); g.restore(); } };
  const shade=(g,col,a)=>{ g.fillStyle='rgba('+col[0]+','+col[1]+','+col[2]+','+a+')'; };
  hg.globalCompositeOperation='lighter';
  if(kind==='terra'){
    // --- zolle (5–15 mm): cupole morbide, un po' più scure e umide ---
    for(let i=0;i<150;i++){ const x=r()*N, y=r()*N, rad=(2.5+r()*5)*MM, sx=rad*(1+r()*.5), sy=rad, rot=r()*3.14, hgt=.22+r()*.2;
      wrap(hg,x,y,g=>{ g.rotate(rot); g.globalAlpha=hgt; g.drawImage(D2,-sx,-sy,sx*2,sy*2); });
      wrap(cg,x,y,g=>{ g.rotate(rot); const gr=g.createRadialGradient(0,0,0,0,0,sx); gr.addColorStop(0,'rgba(30,20,12,.22)'); gr.addColorStop(1,'rgba(30,20,12,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,sx,sy,0,0,6.283); g.fill(); }); }
    // --- grani (1–3 mm): ~4200 per tessera di 10 cm, per lo più bruni; i chiari sono rari ---
    const GR=[[96,70,46],[82,58,38],[70,48,30],[122,92,60],[44,30,20],[58,40,26],[90,62,44],[140,112,76],[160,140,110],[76,54,36]];
    for(let i=0;i<4200;i++){ const x=r()*N, y=r()*N, rad=(.5+r()*1)*MM, sx=rad*(1+r()*.6), sy=rad, rot=r()*3.14, col=GR[(r()*GR.length)|0], hgt=.12+r()*.18, a=.45+r()*.35;
      wrap(hg,x,y,g=>{ g.rotate(rot); g.globalAlpha=hgt; g.drawImage(D1,-sx,-sy,sx*2,sy*2); });
      wrap(cg,x,y,g=>{ g.rotate(rot); g.beginPath(); g.ellipse(0,0,sx,sy,0,0,6.283); shade(g,col,a); g.fill(); g.beginPath(); g.ellipse(-sx*.25,-sy*.25,sx*.45,sy*.4,0,0,6.283); g.fillStyle='rgba(255,240,220,.12)'; g.fill(); }); }
    // --- sassolini (3–8 mm): quarzo, basalto, arenaria ---
    const PB=[[150,142,130],[118,110,100],[172,160,140],[90,84,78],[200,196,188],[134,118,96]];
    for(let i=0;i<30;i++){ const x=r()*N, y=r()*N, rad=(1.5+r()*2.5)*MM, sx=rad*(1+r()*.5), sy=rad, rot=r()*3.14, col=PB[(r()*PB.length)|0], hgt=.5+r()*.5, rf=150+(r()*50|0), sp=[]; for(let k=0;k<6;k++) sp.push([(r()-.5)*sx*1.4,(r()-.5)*sy*1.4,.6*MM*r()+.3,r()<.5]);
      wrap(hg,x,y,g=>{ g.rotate(rot); g.globalAlpha=hgt; g.drawImage(D2,-sx,-sy,sx*2,sy*2); });
      wrap(cg,x,y,g=>{ g.rotate(rot); g.beginPath(); g.ellipse(0,0,sx,sy,0,0,6.283); shade(g,col,1); g.fill(); const gr=g.createRadialGradient(-sx*.3,-sy*.3,0,0,0,sx); gr.addColorStop(0,'rgba(255,255,250,.28)'); gr.addColorStop(.7,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(20,14,10,.45)'); g.fillStyle=gr; g.fill(); sp.forEach(s=>{ g.beginPath(); g.arc(s[0],s[1],s[2],0,6.283); g.fillStyle=s[3]?'rgba(0,0,0,.18)':'rgba(255,255,255,.14)'; g.fill(); }); });
      wrap(rg,x,y,g=>{ g.rotate(rot); g.beginPath(); g.ellipse(0,0,sx,sy,0,0,6.283); g.fillStyle='rgb(255,'+rf+',0)'; g.fill(); }); }
    // --- fibre e radichette (0,3–0,6 mm di spessore, 1–4 cm) ---
    for(let i=0;i<44;i++){ const x=r()*N, y=r()*N, len=(10+r()*30)*MM, w=(.3+r()*.4)*MM, col=r()<.5?[186,166,128]:[112,88,60], pts=[]; { let px=0,py=0,a=r()*6.283; for(let s=0;s<8;s++){ a+=(r()-.5)*.9; px+=Math.cos(a)*len/8; py+=Math.sin(a)*len/8; pts.push([px,py]); } }
      const stroke=(g,st,lw)=>{ g.beginPath(); g.moveTo(0,0); pts.forEach(p=>g.lineTo(p[0],p[1])); g.strokeStyle=st; g.lineWidth=lw; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
      wrap(hg,x,y,g=>{ g.globalAlpha=1; stroke(g,'rgba(255,255,255,.16)',w*2.2); });
      wrap(cg,x,y,g=>{ stroke(g,'rgba(0,0,0,.25)',w*2.4); stroke(g,'rgba('+col[0]+','+col[1]+','+col[2]+',.75)',w*1.2); }); }
    // --- frammenti di foglia secca (4–12 mm) con nervature ---
    for(let i=0;i<11;i++){ const x=r()*N, y=r()*N, L=(4+r()*8)*MM, Wd=L*(.35+r()*.3), rot=r()*6.283, col=r()<.5?[150,112,58]:[118,84,46], pts=[]; const n=7+(r()*4|0); for(let k=0;k<n;k++){ const a=k/n*6.283, rr2=(.8+r()*.3); pts.push([Math.cos(a)*L*.5*rr2,Math.sin(a)*Wd*.5*rr2]); }
      const poly=g=>{ g.beginPath(); pts.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); };
      wrap(hg,x,y,g=>{ g.rotate(rot); poly(g); g.globalAlpha=.2; g.fillStyle='#fff'; g.fill(); });
      wrap(cg,x,y,g=>{ g.rotate(rot); poly(g); shade(g,col,.95); g.fill(); g.strokeStyle='rgba(60,36,16,.6)'; g.lineWidth=.3*MM; g.stroke(); g.strokeStyle='rgba(70,44,20,.45)'; g.lineWidth=.25*MM; g.beginPath(); g.moveTo(-L*.45,0); g.lineTo(L*.45,0); for(let k=-2;k<=2;k++){ g.moveTo(k*L*.17,0); g.lineTo(k*L*.17+L*.12,Wd*.4); g.moveTo(k*L*.17,0); g.lineTo(k*L*.17+L*.12,-Wd*.4); } g.stroke(); });
      wrap(rg,x,y,g=>{ g.rotate(rot); poly(g); g.fillStyle='rgb(255,205,0)'; g.fill(); }); }
  } else {
    // --- ghiaia di drenaggio: sassolini 3–10 mm stretti uno all'altro ---
    const PB=[[150,142,130],[118,110,100],[176,164,146],[92,86,80],[206,200,190],[138,120,98],[160,150,140],[104,96,90]];
    for(let i=0;i<520;i++){ const x=r()*N, y=r()*N, rad=(1.6+r()*3.2)*MM, sx=rad*(1+r()*.5), sy=rad, rot=r()*3.14, col=PB[(r()*PB.length)|0], hgt=.7+r()*.3, rf=140+(r()*60|0), sp=[]; for(let k=0;k<5;k++) sp.push([(r()-.5)*sx*1.3,(r()-.5)*sy*1.3,.5*MM*r()+.3,r()<.5]);
      wrap(hg,x,y,g=>{ g.rotate(rot); g.globalAlpha=hgt; g.drawImage(D2,-sx,-sy,sx*2,sy*2); });
      wrap(cg,x,y,g=>{ g.rotate(rot); g.beginPath(); g.ellipse(0,0,sx,sy,0,0,6.283); shade(g,col,1); g.fill(); const gr=g.createRadialGradient(-sx*.3,-sy*.3,0,0,0,sx); gr.addColorStop(0,'rgba(255,255,250,.3)'); gr.addColorStop(.65,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(10,8,6,.55)'); g.fillStyle=gr; g.fill(); sp.forEach(s=>{ g.beginPath(); g.arc(s[0],s[1],s[2],0,6.283); g.fillStyle=s[3]?'rgba(0,0,0,.2)':'rgba(255,255,255,.16)'; g.fill(); }); });
      wrap(rg,x,y,g=>{ g.rotate(rot); g.beginPath(); g.ellipse(0,0,sx*.9,sy*.9,0,0,6.283); g.fillStyle='rgb(255,'+rf+',0)'; g.fill(); }); }
  }
  // --- dall'altezza: normal map, occlusione ambientale (canale R della mappa ORM) e Float32 per il rilievo ---
  const HD=hg.getImageData(0,0,N,N).data, H=new Float32Array(N*N); let hmax=0; for(let i=0;i<N*N;i++){ H[i]=HD[i*4]/255; if(H[i]>hmax) hmax=H[i]; } for(let i=0;i<N*N;i++) H[i]/=hmax||1;
  const nc=cv(N), ng=nc.getContext('2d'), ni=ng.createImageData(N,N), ND=ni.data, S=(kind==='terra'?2.6:3.2)*N/512;
  const at=(x,y)=>H[((y%N+N)%N)*N+((x%N+N)%N)];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const dx=(at(x+1,y)-at(x-1,y))*S*N/2, dy=(at(x,y+1)-at(x,y-1))*S*N/2; const l=Math.hypot(dx,dy,1); const k=(y*N+x)*4; ND[k]=Math.round(127.5+127.5*(-dx/l)); ND[k+1]=Math.round(127.5+127.5*(dy/l)); ND[k+2]=Math.round(127.5+127.5*(1/l)); ND[k+3]=255; }
  ng.putImageData(ni,0,0);
  // AO: cavità = altezza sfocata − altezza (sfocatura a scatola separabile, raggio ≈ 1,5 mm)
  const B=new Float32Array(N*N), B2=new Float32Array(N*N), R=Math.max(2,Math.round(1.5*MM));
  for(let y=0;y<N;y++){ let s=0; for(let x=-R;x<=R;x++) s+=at(x,y); for(let x=0;x<N;x++){ B[y*N+x]=s/(2*R+1); s+=at(x+R+1,y)-at(x-R,y); } }
  for(let x=0;x<N;x++){ let s=0; for(let y=-R;y<=R;y++) s+=B[((y%N+N)%N)*N+x]; for(let y=0;y<N;y++){ B2[y*N+x]=s/(2*R+1); s+=B[((y+R+1)%N)*N+x]-B[((y-R+N)%N)*N+x]; } }
  const RI=rg.getImageData(0,0,N,N), RD=RI.data; for(let i=0;i<N*N;i++){ const cav=Math.max(0,B2[i]-H[i])*6; RD[i*4]=Math.round(255*Math.max(.35,1-cav)); } rg.putImageData(RI,0,0);
  const tex=(c,srgb)=>{ const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; if(srgb) t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; };
  const small=c=>{ const s=cv(N/2), g=s.getContext('2d'); g.drawImage(c,0,0,N/2,N/2); return s; };
  // altezza (0–1) in un punto uv della tessera: serve al rilievo del disco in v3d.js
  const height=(u,v)=>{ const x=Math.floor(((u%1)+1)%1*N), y=Math.floor(((1-v)%1+1)%1*N); return H[Math.min(N-1,y)*N+Math.min(N-1,x)]; };
  return { N, canvases:{col:cc,nor:nc,orm:rc}, height,
    maps(scale){ const f=scale===.5?small:c=>c; return { map:tex(f(cc),true), normalMap:tex(f(nc),false), orm:tex(f(rc),false) }; } };
};
